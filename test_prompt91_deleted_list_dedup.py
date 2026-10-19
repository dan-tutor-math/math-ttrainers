"""
Промпт №91: список удалённых (DB.deleted) удваивался на каждом сохранении.

mergeDbs склеивает список с диска и из памяти через concat, а после записи
оба списка одинаковые — N + N = 2N. С 13.09.2026 одна удалённая доска у
учителя разрослась до 16 777 216 копий (2^24): страница досок брала 3+ ГБ
при открытии и висла даже в чистом браузере и в инкогнито — хватало удалить
одну доску (например, дубликат) и поработать пару минут.

Проверяем:
  1. Уже раздутый список на диске схлопывается при загрузке страницы.
  2. После загрузки и десятка сохранений на диске одна запись на доску.
  3. Удаление доски + много сохранений и слияний — список не растёт.
  4. Удалённая доска по-прежнему не возвращается из копии на диске
     (ради этого список и заведён).
"""
import subprocess
import sys
import time
import contextlib
import http.client

from playwright.sync_api import sync_playwright

PORT = 8991
BASE = f"http://127.0.0.1:{PORT}"


@contextlib.contextmanager
def local_server():
    proc = subprocess.Popen(
        [sys.executable, "-m", "http.server", str(PORT)],
        stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL,
    )
    try:
        for _ in range(50):
            try:
                conn = http.client.HTTPConnection("127.0.0.1", PORT, timeout=0.2)
                conn.request("GET", "/boards.html")
                conn.getresponse()
                break
            except Exception:
                time.sleep(0.1)
        else:
            raise RuntimeError("локальный сервер не поднялся")
        yield
    finally:
        proc.terminate()
        proc.wait(timeout=5)


BOOT_JS = """
() => {
  const gate = document.getElementById('authGate');
  if (gate) gate.style.display = 'none';
  window.boardsAppBoot();
}
"""

# раздутый список кладём прямо из страницы: 2^16 одинаковых записей — как у
# учителя, только поменьше, чтобы тест шёл секунды
SEED_JS = """
(boards) => new Promise((resolve, reject) => {
  const req = indexedDB.open('ogeBoardsDB', 1);
  req.onupgradeneeded = () => {
    const idb = req.result;
    if (!idb.objectStoreNames.contains('state')) idb.createObjectStore('state');
  };
  req.onsuccess = () => {
    const at = Date.now() - 3600 * 1000;
    const one = { kind: 'board', id: 'goneBoard', at };
    const deleted = new Array(65536).fill(0).map(() => Object.assign({}, one));
    const tx = req.result.transaction('state', 'readwrite');
    const store = tx.objectStore('state');
    store.put({ __v: 2, folders: [], boards, deleted, sortMode: 'my' }, 'db');
    boards.forEach(b => store.put({ objects: [], imageLib: [] }, 'boarddata:' + b.id));
    tx.oncomplete = () => resolve(true);
    tx.onerror = () => reject(tx.error);
  };
  req.onerror = () => reject(req.error);
})
"""

READ_STORED_DELETED = """
() => new Promise((resolve, reject) => {
  const req = indexedDB.open('ogeBoardsDB', 1);
  req.onsuccess = () => {
    const q = req.result.transaction('state').objectStore('state').get('db');
    q.onsuccess = () => {
      const d = (q.result && q.result.deleted) || [];
      resolve({ n: d.length, ids: d.map(x => x.kind + '|' + x.id),
                boards: (q.result.boards || []).map(b => b.id) });
    };
    q.onerror = () => reject(q.error);
  };
  req.onerror = () => reject(req.error);
})
"""


def light_board(board_id, name):
    return {
        "id": board_id, "name": name, "folderId": None,
        "createdAt": 1000, "updatedAt": 1000, "lastOpenedAt": None, "rev": 1,
        "cellSize": 24, "sheetCols": 76, "sheetRows": 54, "pageOrder": "h",
        "recentColors": [], "colorUsage": {},
    }


def run():
    failures = []

    def check(name, cond, extra=""):
        print(f"[{'OK' if cond else 'FAIL'}] {name}{(' — ' + str(extra)) if extra else ''}")
        if not cond:
            failures.append(name)

    with local_server(), sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()
        page.goto(f"{BASE}/boards.html")
        page.evaluate(SEED_JS, [light_board("bA", "Аня"), light_board("bB", "Костя")])
        page.reload()
        page.evaluate(BOOT_JS)
        page.wait_for_function("window.getDB && window.getDB().boards.length === 2")

        # ── 1. раздутый список схлопнулся при загрузке ─────────────────
        n_mem = page.evaluate("() => window.getDB().deleted.length")
        check("после загрузки в памяти одна запись об удалённой доске", n_mem == 1, n_mem)

        # ── 2. десяток сохранений — на диске одна запись ───────────────
        page.evaluate("async () => { for (let i = 0; i < 10; i++) await idbSaveDB(); }")
        st = page.evaluate(READ_STORED_DELETED)
        check("после 10 сохранений на диске одна запись", st["n"] == 1, st["n"])

        # ── 3. удаление ещё одной доски + сохранения и слияния ─────────
        page.evaluate("""async () => {
            noteDeleted('board', 'bB');
            const DB = window.getDB();
            DB.boards = DB.boards.filter(b => b.id !== 'bB');
            for (let i = 0; i < 12; i++) { await idbSaveDB(); await refreshFromStore(false); }
        }""")
        st = page.evaluate(READ_STORED_DELETED)
        n_mem = page.evaluate("() => window.getDB().deleted.length")
        check("после удаления и 12 циклов сохранение+слияние на диске 2 записи",
              st["n"] == 2 and sorted(st["ids"]) == ["board|bB", "board|goneBoard"], st["ids"][:5])
        check("в памяти тоже 2 записи", n_mem == 2, n_mem)

        # ── 4. удалённая доска не воскресает из старой копии на диске ──
        page.evaluate("""() => new Promise(resolve => {
            const req = indexedDB.open('ogeBoardsDB', 1);
            req.onsuccess = () => {
              const store = req.result.transaction('state', 'readwrite').objectStore('state');
              const q = store.get('db');
              q.onsuccess = () => {
                const v = q.result;
                v.boards.push({ id: 'bB', name: 'Костя', createdAt: 1000, updatedAt: 1000, rev: 1 });
                store.put(v, 'db').onsuccess = () => resolve(true);
              };
            };
        })""")
        page.evaluate("async () => { await refreshFromStore(false); await idbSaveDB(); }")
        ids = page.evaluate("() => window.getDB().boards.map(b => b.id)")
        check("удалённая доска не вернулась из копии на диске", ids == ["bA"], ids)

        browser.close()

    print()
    if failures:
        print(f"ПРОВАЛЕНО: {len(failures)}")
        sys.exit(1)
    print("Все проверки пройдены")


if __name__ == "__main__":
    run()
