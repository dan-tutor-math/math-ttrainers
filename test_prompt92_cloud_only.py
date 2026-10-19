"""
Промпт №92: облачные доски — без копии в браузере, когда места нет.

В инкогнито (особенно Яндекс) сайту дают крошечное хранилище; кэш облачных
досок в него упирался — красная плашка «Доска не сохраняется» и
перезагрузки, хотя записи уходили в облако. Проверяем:

  A. Маленькая квота с самого начала (как инкогнито) — сразу режим «без
     копии», спокойная подсказка вместо красной плашки.
  B. Нормальная квота, но запись упёрлась в место на облачной доске —
     красной плашки нет, режим включился, кэш неоткрытых облачных досок
     освобождён, доска только-здесь и доска на середине переноса не тронуты.
  C. В режиме «без копии» тяжёлая часть облачной доски больше не пишется,
     а доски только-здесь — пишутся.
  D. Не хватило места на доске, которая есть только здесь, — красная
     плашка, как раньше (там потеря настоящая).
"""
import subprocess
import sys
import time
import contextlib
import http.client

from playwright.sync_api import sync_playwright

PORT = 8992
BASE = f"http://127.0.0.1:{PORT}"
ORIGIN = BASE


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

SEED_JS = """
(boards) => new Promise((resolve, reject) => {
  const req = indexedDB.open('ogeBoardsDB', 1);
  req.onupgradeneeded = () => {
    const idb = req.result;
    if (!idb.objectStoreNames.contains('state')) idb.createObjectStore('state');
  };
  req.onsuccess = () => {
    const tx = req.result.transaction('state', 'readwrite');
    const store = tx.objectStore('state');
    store.put({ __v: 2, folders: [], boards, deleted: [], sortMode: 'my' }, 'db');
    boards.forEach(b => store.put({ objects: [{ id: b.id + '-o', type: 'pen', points: [{x:1,y:1},{x:2,y:2}] }], imageLib: [] }, 'boarddata:' + b.id));
    tx.oncomplete = () => resolve(true);
    tx.onerror = () => reject(tx.error);
  };
  req.onerror = () => reject(req.error);
})
"""

HAS_KEY_JS = """
(key) => new Promise((resolve, reject) => {
  const req = indexedDB.open('ogeBoardsDB', 1);
  req.onsuccess = () => {
    const q = req.result.transaction('state').objectStore('state').get(key);
    q.onsuccess = () => resolve(q.result !== undefined);
    q.onerror = () => reject(q.error);
  };
  req.onerror = () => reject(req.error);
})
"""

# idbPut ломается «нет места» на тяжёлой записи выбранных досок; считает
# все попытки записать тяжёлую часть
BREAK_PUT_JS = """
(failIds) => {
  window.__puts = [];
  const orig = window.idbPut;
  window.idbPut = function(key, value){
    if (String(key).startsWith('boarddata:')) {
      const id = String(key).slice('boarddata:'.length);
      window.__puts.push(id);
      if (failIds.includes(id)) return Promise.reject(new DOMException('нет места', 'QuotaExceededError'));
    }
    return orig.apply(this, arguments);
  };
}
"""


def board(board_id, name, **extra):
    b = {
        "id": board_id, "name": name, "folderId": None,
        "createdAt": 1000, "updatedAt": 1000, "lastOpenedAt": None, "rev": 1,
        "cellSize": 24, "sheetCols": 76, "sheetRows": 54, "pageOrder": "h",
        "recentColors": [], "colorUsage": {},
    }
    b.update(extra)
    return b


def run():
    failures = []

    def check(name, cond, extra=""):
        print(f"[{'OK' if cond else 'FAIL'}] {name}{(' — ' + str(extra)) if extra else ''}")
        if not cond:
            failures.append(name)

    seed = [
        board("cA", "Рита", cloudBoardId="11111111-1111-1111-1111-111111111111", cloudRole="owner"),
        board("cB", "Юля", cloudBoardId="22222222-2222-2222-2222-222222222222", cloudRole="editor"),
        board("cP", "На переносе", cloudPendingId="33333333-3333-3333-3333-333333333333"),
        board("lL", "Только здесь"),
    ]

    with local_server(), sync_playwright() as p:
        browser = p.chromium.launch()

        # ── A. маленькая квота с самого начала ────────────────────────
        ctx = browser.new_context()
        page = ctx.new_page()
        page.goto(f"{BASE}/boards.html")
        page.evaluate(SEED_JS, seed)
        cdp = ctx.new_cdp_session(page)
        cdp.send("Storage.overrideQuotaForOrigin", {"origin": ORIGIN, "quotaSize": 50 * 1024 * 1024})
        page.reload()
        page.evaluate(BOOT_JS)
        page.wait_for_function("window.getDB && window.getDB().boards.length === 4")
        page.wait_for_timeout(400)
        check("A: маленькая квота — режим без копии включён", page.evaluate("() => window.boardsCloudOnly()"))
        check("A: спокойная подсказка показана", page.evaluate("() => !!document.getElementById('cloudOnlyNote')"))
        check("A: красной плашки нет", not page.evaluate("() => !!document.getElementById('saveFailBanner')"))
        ctx.close()

        # ── B. нормальная квота, место кончилось на облачной доске ────
        ctx = browser.new_context()
        page = ctx.new_page()
        page.goto(f"{BASE}/boards.html")
        page.evaluate(SEED_JS, seed)
        page.reload()
        page.evaluate(BOOT_JS)
        page.wait_for_function("window.getDB && window.getDB().boards.length === 4")
        page.wait_for_timeout(300)
        check("B: при нормальной квоте режим выключен", not page.evaluate("() => window.boardsCloudOnly()"))
        page.evaluate(BREAK_PUT_JS, ["cA"])
        page.evaluate("""async () => {
            const b = window.getDB().boards.find(x => x.id === 'cA');
            await ensureBoardLoaded(b);
            touchBoard(b);
            await idbSaveDB();
        }""")
        page.wait_for_timeout(300)
        check("B: красной плашки нет", not page.evaluate("() => !!document.getElementById('saveFailBanner')"))
        check("B: режим без копии включился", page.evaluate("() => window.boardsCloudOnly()"))
        check("B: кэш неоткрытой облачной доски освобождён", not page.evaluate(HAS_KEY_JS, "boarddata:cB"))
        check("B: доска на середине переноса не тронута", page.evaluate(HAS_KEY_JS, "boarddata:cP"))
        check("B: доска только-здесь не тронута", page.evaluate(HAS_KEY_JS, "boarddata:lL"))

        # ── C. в режиме без копии облачная не пишется, местная пишется ─
        page.evaluate("""async () => {
            window.__puts = [];
            const DB = window.getDB();
            for (const id of ['cA', 'lL']) { const b = DB.boards.find(x => x.id === id); await ensureBoardLoaded(b); touchBoard(b); }
            await idbSaveDB();
        }""")
        puts = page.evaluate("() => window.__puts")
        check("C: тяжёлая часть облачной доски не пишется", "cA" not in puts, puts)
        check("C: доска только-здесь пишется", "lL" in puts, puts)
        check("C: и плашки по-прежнему нет", not page.evaluate("() => !!document.getElementById('saveFailBanner')"))
        ctx.close()

        # ── D. место кончилось на доске, которая есть только здесь ────
        ctx = browser.new_context()
        page = ctx.new_page()
        page.goto(f"{BASE}/boards.html")
        page.evaluate(SEED_JS, seed)
        page.reload()
        page.evaluate(BOOT_JS)
        page.wait_for_function("window.getDB && window.getDB().boards.length === 4")
        page.wait_for_timeout(300)
        page.evaluate(BREAK_PUT_JS, ["lL"])
        page.evaluate("""async () => {
            const b = window.getDB().boards.find(x => x.id === 'lL');
            await ensureBoardLoaded(b);
            touchBoard(b);
            await idbSaveDB();
        }""")
        page.wait_for_timeout(300)
        check("D: доска только-здесь — красная плашка есть", page.evaluate("() => !!document.getElementById('saveFailBanner')"))
        check("D: режим без копии не включён", not page.evaluate("() => window.boardsCloudOnly()"))
        ctx.close()

        # ── E. не записался сам список: все доски облачные — молчим ───
        ctx = browser.new_context()
        page = ctx.new_page()
        page.goto(f"{BASE}/boards.html")
        page.evaluate(SEED_JS, seed[:2])
        page.reload()
        page.evaluate(BOOT_JS)
        page.wait_for_function("window.getDB && window.getDB().boards.length === 2")
        page.wait_for_timeout(300)
        page.evaluate("""async () => {
            window.idbOpen = () => Promise.reject(new DOMException('нет места', 'QuotaExceededError'));
            window.getDB().boards[0].name = 'Рита (переименована)';
            await idbSaveDB();
        }""")
        page.wait_for_timeout(300)
        check("E: список не записался, досок только-здесь нет — плашки нет",
              not page.evaluate("() => !!document.getElementById('saveFailBanner')"))
        check("E: режим без копии включился", page.evaluate("() => window.boardsCloudOnly()"))
        ctx.close()

        browser.close()

    print()
    if failures:
        print(f"ПРОВАЛЕНО: {len(failures)}")
        sys.exit(1)
    print("Все проверки пройдены")


if __name__ == "__main__":
    run()
