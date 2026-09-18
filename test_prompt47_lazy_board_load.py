"""
Промпт №47: раньше idbLoadDB() при каждой загрузке страницы сразу
подгружала в память тяжёлые поля (штрихи, картинки) ВСЕХ досок разом
(Promise.all по каждой доске из индекса) — при нескольких десятках досок,
особенно с картинками, это столько памяти, что вкладка падала ещё до
появления списка досок, без единого открытия хоть одной доски.

Теперь доска из индекса приходит без objects/imageLib, и они лениво
подгружаются по одной — только когда доску реально открывают (см.
ensureBoardLoaded в boards-core.js). Проверяем:

  1. После загрузки страницы доски, которые не открывали, НЕ имеют
     objects/imageLib в памяти (это и есть весь смысл фикса — не тянуть
     тяжёлые данные, пока не понадобились).
  2. openBoard() лениво подгружает штрихи именно открываемой доски.
  3. Открытие одной доски не трогает данные остальных — они остаются
     неподгруженными.
  4. «Выгрузить все доски» (exportAllBoardsArchive) — единственное место,
     где нужны ВСЕ доски целиком, — по-прежнему собирает полные данные
     даже для досок, которые никто в этой сессии не открывал.
"""
import json
import subprocess
import sys
import time
import contextlib
import http.client

from playwright.sync_api import sync_playwright

PORT = 8965
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


def seed_split_db(page, index_boards, payloads):
    """Кладёт базу СРАЗУ в новом (разделённом, __v:2) формате — как будто
    страница уже когда-то мигрировала и это обычная повторная загрузка."""
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


def light_board(board_id, name):
    # ровно то, что stripHeavy() оставляет в индексе — без objects/imageLib
    return {
        "id": board_id, "name": name, "folderId": None,
        "createdAt": 1000, "updatedAt": 1000, "lastOpenedAt": None, "rev": 1,
        "cellSize": 24, "sheetCols": 76, "sheetRows": 54, "pageOrder": "h",
        "recentColors": [], "colorUsage": {},
    }


def run():
    failures = []

    def check(name, cond):
        status = "OK" if cond else "FAIL"
        print(f"[{status}] {name}")
        if not cond:
            failures.append(name)

    boards = {
        "bA": [{"id": "bA-o0", "type": "pen", "points": [{"x": 1, "y": 1}, {"x": 2, "y": 2}]}],
        "bB": [{"id": f"bB-o{i}", "type": "pen", "points": [{"x": i, "y": i}, {"x": i+1, "y": i+1}]} for i in range(5)],
        "bC": [{"id": "bC-o0", "type": "pen", "points": [{"x": 3, "y": 3}, {"x": 4, "y": 4}]}],
    }

    with local_server(), sync_playwright() as p:
        browser = p.chromium.launch()
        context = browser.new_context(accept_downloads=True)
        page = context.new_page()
        page.goto(f"{BASE}/boards.html")

        index_boards = [light_board("bA", "Максим"), light_board("bB", "Аня"), light_board("bC", "Костя")]
        payloads = {bid: {"objects": objs, "imageLib": []} for bid, objs in boards.items()}
        seed_split_db(page, index_boards, payloads)

        page.reload()
        page.evaluate(BOOT_JS)
        page.wait_for_function("window.getDB && Array.isArray(window.getDB().boards) && window.getDB().boards.length === 3")
        page.wait_for_timeout(200)

        # ── 1. после загрузки списка ни одна доска не подгружена ──────
        loaded_flags = page.evaluate(
            "() => Object.fromEntries(window.getDB().boards.map(b => [b.id, b.objects !== undefined]))"
        )
        check(
            "после загрузки страницы ни одна доска не подгружена в память (objects === undefined)",
            loaded_flags == {"bA": False, "bB": False, "bC": False},
        )

        # ── 2. открытие доски B лениво подгружает именно её штрихи ────
        page.evaluate("() => window.openBoard('bB')")
        page.wait_for_function("window.getCurrentBoard() && window.getCurrentBoard().id === 'bB' && Array.isArray(window.getCurrentBoard().objects)")
        b_objects = page.evaluate("() => window.getCurrentBoard().objects.map(o => o.id)")
        check(
            "openBoard('bB') подгрузил ровно её штрихи",
            set(b_objects) == {o["id"] for o in boards["bB"]},
        )

        # ── 3. соседние доски A и C остались неподгруженными ──────────
        still_unloaded = page.evaluate(
            "() => ({ bA: window.getDB().boards.find(b=>b.id==='bA').objects, bC: window.getDB().boards.find(b=>b.id==='bC').objects })"
        )
        check(
            "открытие доски B не трогает данные соседних досок A и C",
            still_unloaded["bA"] is None and still_unloaded["bC"] is None,
        )

        # ── 4. «Выгрузить все доски» всё равно собирает ВСЕ доски целиком ──
        page.evaluate("() => window.backToList()")
        with page.expect_download() as dl_info:
            page.evaluate("() => window.exportAllBoardsArchive()")
        download = dl_info.value
        export_path = download.path()
        with open(export_path, encoding="utf-8") as f:
            archive = json.load(f)
        exported_by_id = {b["id"]: {o["id"] for o in (b.get("objects") or [])} for b in archive.get("boards", [])}
        check(
            "экспорт всех досок содержит полные данные даже неоткрытых досок (bA, bC)",
            exported_by_id.get("bA") == {o["id"] for o in boards["bA"]}
            and exported_by_id.get("bC") == {o["id"] for o in boards["bC"]}
            and exported_by_id.get("bB") == {o["id"] for o in boards["bB"]},
        )

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
