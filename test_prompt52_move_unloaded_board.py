"""
Промпт №52: доска пустеет после переноса в папку.

Живой случай: позанимались на доске «Саша от Илины», вышли в список,
перетащили доску в папку «Архив» — и доска стала пустой. Причина: при
выходе со страницы доски она выгружается из памяти (промпт №48,
objects === undefined), а перенос в папку метит её «грязной» (touchBoard).
Следующее сохранение писало её тяжёлую часть через heavyOf() — то есть
пустой массив вместо настоящих штрихов, поверх настоящей записи на диске.
Второй путь к той же беде: B после выхода в список не обнуляется, и любой
saveDB() на списке (переименование, удаление, перенос через меню ЛЮБОЙ
доски) штамповал покинутую доску и тоже затирал её пустотой.

Проверяем:
  1. Рисуем на доске, выходим в список, переносим доску в папку
     перетаскиванием — запись boarddata на диске не пустеет, а при
     повторном открытии все штрихи на месте.
  2. Переименование ДРУГОЙ доски на списке сразу после выхода не трогает
     покинутую: её rev не растёт, запись на диске цела.
"""
import subprocess
import sys
import time
import contextlib
import http.client

from playwright.sync_api import sync_playwright

PORT = 8967
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


def light_board(board_id, name):
    return {
        "id": board_id, "name": name, "folderId": None,
        "createdAt": 1000, "updatedAt": 1000, "lastOpenedAt": None, "rev": 1,
        "cellSize": 24, "sheetCols": 76, "sheetRows": 54, "pageOrder": "h",
        "recentColors": [], "colorUsage": {},
        # без сохранённого view открытие доски центрирует камеру на СЕРЕДИНЕ
        # сетки листов (см. openBoardReady) — это далеко от координат наших
        # тестовых объектов (5,5)/(6,6)/(9,9), картинки бы просто не попали
        # в кадр и не оказались бы в imgCache; фиксируем камеру у начала
        # координат явно, как и test_prompt46_viewport_culling.py
        "view": {"x": 0, "y": 0, "zoom": 1},
    }


def seed_split_db(page, index_boards, payloads):
    page.evaluate(
        """([index_boards, payloads]) => new Promise((resolve, reject) => {
            const req = indexedDB.open('ogeBoardsDB', 1);
            req.onupgradeneeded = () => {
              const idb = req.result;
              if (!idb.objectStoreNames.contains('state')) idb.createObjectStore('state');
            };
            req.onsuccess = () => {
              const tx = req.result.transaction('state', 'readwrite');
              const store = tx.objectStore('state');
              store.put({ __v: 2, folders: [], boards: index_boards, deleted: [], sortMode: 'my' }, 'db');
              Object.keys(payloads).forEach(id => store.put(payloads[id], 'boarddata:' + id));
              tx.oncomplete = () => resolve(true);
              tx.onerror = () => reject(tx.error);
            };
            req.onerror = () => reject(req.error);
        })""",
        [index_boards, payloads],
    )



def read_payload(page, board_id):
    return page.evaluate(
        """(id) => new Promise((resolve, reject) => {
            const req = indexedDB.open('ogeBoardsDB');
            req.onsuccess = () => {
              const g = req.result.transaction('state', 'readonly').objectStore('state').get('boarddata:' + id);
              g.onsuccess = () => resolve(g.result || null);
              g.onerror = () => reject(g.error);
            };
            req.onerror = () => reject(req.error);
        })""",
        board_id,
    )


def run():
    failures = []

    def check(name, cond):
        status = "OK" if cond else "FAIL"
        print(f"[{status}] {name}")
        if not cond:
            failures.append(name)

    with local_server(), sync_playwright() as p:
        browser = p.chromium.launch()
        context = browser.new_context()
        page = context.new_page()
        page.goto(f"{BASE}/boards.html")

        page.evaluate(
            """() => new Promise((resolve, reject) => {
                const req = indexedDB.open('ogeBoardsDB', 1);
                req.onupgradeneeded = () => req.result.createObjectStore('state');
                req.onsuccess = () => {
                  const tx = req.result.transaction('state', 'readwrite');
                  const st = tx.objectStore('state');
                  const lite = (id, name) => ({ id, name, folderId: null, createdAt: 1000, updatedAt: 1000,
                    lastOpenedAt: null, rev: 1, cellSize: 24, sheetCols: 76, sheetRows: 54, pageOrder: 'h',
                    recentColors: [], colorUsage: {}, view: { x: 0, y: 0, zoom: 1 } });
                  st.put({ __v: 2, folders: [{ id: 'fArch', name: 'Архив', createdAt: 1000 }],
                           boards: [lite('bSasha', 'Саша от Илины'), lite('bOther', 'Другая')],
                           deleted: [], sortMode: 'my' }, 'db');
                  st.put({ objects: [{ id: 's0', type: 'pen', points: [{x:1,y:1},{x:2,y:2}] }], imageLib: [] }, 'boarddata:bSasha');
                  st.put({ objects: [{ id: 'o0', type: 'pen', points: [{x:3,y:3},{x:4,y:4}] }], imageLib: [] }, 'boarddata:bOther');
                  tx.oncomplete = () => resolve(true);
                  tx.onerror = () => reject(tx.error);
                };
                req.onerror = () => reject(req.error);
            })"""
        )
        page.reload()
        page.evaluate(BOOT_JS)
        page.wait_for_function("window.getDB && window.getDB().boards.length === 2")

        # ── занятие: открываем доску и «пишем» на ней ещё два штриха ──
        page.evaluate("() => window.openBoard('bSasha')")
        page.wait_for_function("window.getCurrentBoard() && window.getCurrentBoard().id === 'bSasha' && Array.isArray(window.getCurrentBoard().objects)")
        page.evaluate("""() => {
            const b = window.getCurrentBoard();
            b.objects.push({ id: 's1', type: 'pen', points: [{x:5,y:5},{x:6,y:6}] });
            b.objects.push({ id: 's2', type: 'pen', points: [{x:7,y:7},{x:8,y:8}] });
            window.saveDB();
        }""")
        page.wait_for_timeout(600)
        check("штрихи урока записаны на диск", len((read_payload(page, 'bSasha') or {}).get('objects', [])) == 3)

        # ── выходим в список, доска выгружается ──
        page.evaluate("() => window.backToList()")
        page.wait_for_function("window.getDB().boards.find(b => b.id === 'bSasha').objects === undefined")

        # ── 2. на списке переименовываем ДРУГУЮ доску (тот же путь saveDB) ──
        rev_before = page.evaluate("() => window.getDB().boards.find(b => b.id === 'bSasha').rev")
        page.evaluate("""() => {
            const o = window.getDB().boards.find(b => b.id === 'bOther');
            o.name = 'Другая (новое имя)';
            window.saveDB();
        }""")
        page.wait_for_timeout(600)
        rev_after = page.evaluate("() => window.getDB().boards.find(b => b.id === 'bSasha').rev")
        check("правка другой доски на списке не поднимает rev покинутой доске", rev_after == rev_before)
        check("правка другой доски на списке не затирает покинутую пустотой",
              len((read_payload(page, 'bSasha') or {}).get('objects', [])) == 3)

        # ── 1. перетаскиваем доску в папку «Архив» — как в живом случае ──
        moved = page.evaluate("""() => {
            const ok = window.__applyDrop({ id: 'bSasha', kind: 'board' }, { type: 'into', folderId: 'fArch' });
            if (ok) window.saveDB();
            return ok;
        }""")
        check("перенос в папку сработал", moved)
        page.wait_for_timeout(600)
        check("после переноса в папку запись доски на диске НЕ пустая",
              len((read_payload(page, 'bSasha') or {}).get('objects', [])) == 3)
        check("доска действительно лежит в папке «Архив»",
              page.evaluate("() => window.getDB().boards.find(b => b.id === 'bSasha').folderId") == 'fArch')

        # ── повторное открытие после перезагрузки страницы — всё на месте ──
        page.reload()
        page.evaluate(BOOT_JS)
        page.wait_for_function("window.getDB && window.getDB().boards.length === 2")
        page.evaluate("() => window.openBoard('bSasha')")
        page.wait_for_function("window.getCurrentBoard() && window.getCurrentBoard().id === 'bSasha' && Array.isArray(window.getCurrentBoard().objects)")
        ids = page.evaluate("() => window.getCurrentBoard().objects.map(o => o.id)")
        check("после перезагрузки доска открывается со всеми штрихами урока", set(ids) == {'s0', 's1', 's2'})

        context.close()
        browser.close()

    print()
    if failures:
        print(f"ИТОГ: {len(failures)} проверок провалено — {failures}")
    else:
        print("ИТОГ: всё прошло")
    return not failures


if __name__ == "__main__":
    ok = run()
    sys.exit(0 if ok else 1)
