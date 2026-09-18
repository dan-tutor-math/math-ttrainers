"""
Промпт №45: доски больше не пишутся в IndexedDB одной записью со всем
содержимым — тяжёлые поля (штрихи objects, imageLib) каждой доски лежат
отдельной записью 'boarddata:<id>', а запись 'db' держит только лёгкий
индекс (имена/папки/даты/rev). Цель: во время рисования на одной доске
НЕ переписываются данные остальных досок.

Проверяем:
  1. Миграция: доска, "приехавшая" в старом формате (одна запись 'db' со
     всеми полями), после загрузки страницы читается корректно и
     раскладывается на новый формат (индекс + отдельные записи).
  2. Во время рисования на одной доске запись остальных досок в
     IndexedDB не переписывается — обновляется только запись открытой
     доски и лёгкий индекс.
  3. Целостность после перезагрузки страницы: две доски с разным
     содержимым не путаются и не теряют данные.

Нужен локальный http-сервер (см. HANDOFF, раздел 9):
    python3 -m http.server 8963
запускается прямо из этого файла через subprocess, как и остальные
test_prompt*.py в репозитории.
"""
import json
import subprocess
import sys
import time
import contextlib
import http.client

from playwright.sync_api import sync_playwright

PORT = 8963
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


def boot_page(page):
    page.goto(f"{BASE}/boards.html")
    # вход по email из песочницы не проходит (см. HANDOFF) — прячем экран
    # входа и стартуем локальное приложение напрямую
    page.evaluate(BOOT_JS)
    # __boardsBooted выставляется СИНХРОННО, до того как idbLoadDB() разберёт
    # диск (DB изначально пустая: let DB = {boards: []}) — ждём, пока в
    # памяти реально появится хотя бы одна доска, а не просто пустой массив
    page.wait_for_function("window.getDB && Array.isArray(window.getDB().boards) && window.getDB().boards.length > 0")


def idb_get(page, key):
    return page.evaluate(
        """(key) => new Promise((resolve, reject) => {
            const req = indexedDB.open('ogeBoardsDB', 1);
            req.onsuccess = () => {
              const tx = req.result.transaction('state', 'readonly');
              const r = tx.objectStore('state').get(key);
              r.onsuccess = () => resolve(r.result === undefined ? null : r.result);
              r.onerror = () => reject(r.error);
            };
            req.onerror = () => reject(req.error);
        })""",
        key,
    )


def seed_legacy_db(page, db):
    """Кладёт БД в старом формате (одна запись, доски целиком) напрямую в
    IndexedDB — как если бы страница работала ДО этой правки."""
    page.evaluate(
        """(db) => new Promise((resolve, reject) => {
            const req = indexedDB.open('ogeBoardsDB', 1);
            req.onupgradeneeded = () => {
              const idb = req.result;
              if (!idb.objectStoreNames.contains('state')) idb.createObjectStore('state');
            };
            req.onsuccess = () => {
              const tx = req.result.transaction('state', 'readwrite');
              tx.objectStore('state').put(db, 'db');
              tx.oncomplete = () => resolve(true);
              tx.onerror = () => reject(tx.error);
            };
            req.onerror = () => reject(req.error);
        })""",
        db,
    )


def make_board(board_id, name, n_strokes):
    objects = [
        {"id": f"{board_id}-obj{i}", "type": "pen", "points": [{"x": i, "y": i}, {"x": i + 5, "y": i + 5}]}
        for i in range(n_strokes)
    ]
    return {
        "id": board_id, "name": name, "folderId": None,
        "createdAt": 1000, "updatedAt": 1000, "lastOpenedAt": None, "rev": 1,
        "cellSize": 24, "sheetCols": 76, "sheetRows": 54, "pageOrder": "h",
        "objects": objects, "recentColors": [], "colorUsage": {},
        "imageLib": [],
    }


def run():
    failures = []

    def check(name, cond):
        status = "OK" if cond else "FAIL"
        print(f"[{status}] {name}")
        if not cond:
            failures.append(name)

    with local_server(), sync_playwright() as p:
        browser = p.chromium.launch()
        # одна вкладка = один Page, но обеим нужен ОБЩИЙ IndexedDB одного
        # источника — значит, один BrowserContext, а не browser.new_page()
        # (у него каждый вызов создаёт свой изолированный контекст)
        context = browser.new_context()
        page = context.new_page()

        # ── 1. миграция старого формата ──────────────────────────────
        page.goto(f"{BASE}/boards.html")
        legacy = {
            "folders": [],
            "boards": [make_board("bA", "Максим", 3), make_board("bB", "Аня", 2)],
            "deleted": [], "sortMode": "my",
        }
        seed_legacy_db(page, legacy)
        page.reload()
        page.evaluate(BOOT_JS)
        page.wait_for_function("window.getDB && Array.isArray(window.getDB().boards) && window.getDB().boards.length === 2")
        # даём мигратору время дописать отдельные записи (промисы внутри idbLoadDB)
        page.wait_for_timeout(300)

        index_after_migration = idb_get(page, "db")
        check(
            "после переезда индекс версии 2 и без тяжёлых полей",
            index_after_migration is not None
            and index_after_migration.get("__v") == 2
            and all("objects" not in b for b in index_after_migration["boards"]),
        )
        board_a_payload = idb_get(page, "boarddata:bA")
        board_b_payload = idb_get(page, "boarddata:bB")
        check(
            "после переезда штрихи обеих досок лежат в своих записях",
            board_a_payload is not None and len(board_a_payload["objects"]) == 3
            and board_b_payload is not None and len(board_b_payload["objects"]) == 2,
        )
        db_in_memory = page.evaluate("() => window.getDB().boards.map(b => ({id: b.id, n: b.objects.length}))")
        check(
            "в памяти доски остались полными (весь остальной код их так и читает)",
            {b["id"]: b["n"] for b in db_in_memory} == {"bA": 3, "bB": 2},
        )

        # ── 2. рисование на одной доске не трогает запись другой ────
        # Промпт №47: openBoard теперь сам асинхронно догружает штрихи доски
        # (см. ensureBoardLoaded) — ждём, пока это реально случится, а не
        # просто отсчитываем фиксированную паузу
        page.evaluate("() => window.openBoard('bA')")
        page.wait_for_function("window.getCurrentBoard() && window.getCurrentBoard().id === 'bA' && Array.isArray(window.getCurrentBoard().objects)")
        before_b = idb_get(page, "boarddata:bB")

        # рисуем на доске A через тот же путь, что и настоящий штрих:
        # кладём объект и вызываем saveDB(), как это делает код холста
        page.evaluate(
            """() => {
                const b = window.getCurrentBoard();
                b.objects.push({ id: 'bA-new', type: 'pen', points: [{x:1,y:1},{x:2,y:2}] });
                window.saveDB();
            }"""
        )
        # автосохранение — через 300 мс после правки
        page.wait_for_timeout(500)

        after_a = idb_get(page, "boarddata:bA")
        after_b = idb_get(page, "boarddata:bB")
        index_after_draw = idb_get(page, "db")
        check(
            "новый штрих на доске A записался в её собственную запись",
            after_a is not None and any(o["id"] == "bA-new" for o in after_a["objects"]),
        )
        check(
            "запись доски B во время рисования на A не тронута",
            json.dumps(before_b, sort_keys=True) == json.dumps(after_b, sort_keys=True),
        )
        check(
            "индекс по-прежнему не содержит штрихов ни одной доски",
            all("objects" not in b for b in index_after_draw["boards"]),
        )

        # ── 3. целостность после перезагрузки страницы ───────────────
        page.evaluate("() => window.backToList()")
        page.evaluate("() => window.openBoard('bB')")
        page.wait_for_function("window.getCurrentBoard() && window.getCurrentBoard().id === 'bB' && Array.isArray(window.getCurrentBoard().objects)")
        page.evaluate(
            """() => {
                const b = window.getCurrentBoard();
                b.objects.push({ id: 'bB-new', type: 'pen', points: [{x:9,y:9},{x:8,y:8}] });
                window.saveDB();
            }"""
        )
        page.wait_for_timeout(500)

        page.reload()
        page.evaluate(BOOT_JS)
        page.wait_for_function("window.getDB && Array.isArray(window.getDB().boards) && window.getDB().boards.length === 2")
        page.wait_for_timeout(300)
        # Промпт №47: после перезагрузки доски в памяти лёгкие (без штрихов) —
        # они лениво подгружаются только при открытии (см. ensureBoardLoaded).
        # Проверяем то же самое, что и раньше — целостность штрихов каждой
        # доски, — но через фактически сохранённые записи на диске, а не
        # через ещё не подгруженные объекты в памяти
        by_id = {
            board_id: {o["id"] for o in idb_get(page, "boarddata:" + board_id)["objects"]}
            for board_id in ("bA", "bB")
        }
        check(
            "после перезагрузки у доски A все 4 штриха (3 исходных + новый)",
            by_id.get("bA", set()) >= {"bA-obj0", "bA-obj1", "bA-obj2", "bA-new"},
        )
        check(
            "после перезагрузки у доски B все 3 штриха (2 исходных + новый), доски не перепутались",
            by_id.get("bB", set()) >= {"bB-obj0", "bB-obj1", "bB-new"} and "bA-new" not in by_id.get("bB", set()),
        )

        # ── 4. конфликт: та же доска открыта в двух вкладках ──────────
        # вкладка 2 успевает сохраниться ДВАЖДЫ, пока вкладка 1 сидит с той
        # же доской, ничего не отправляя — так её rev однозначно уходит
        # вперёд (это же было верно и для единого блока: слияние решает по
        # rev, при равенстве — по времени; здесь важно проверить именно
        # ветку с rev, а не гонку по времени, которая существовала и до этой
        # правки и её не касается). Вкладка 1 после этого правит доску вслепую
        # (не зная о вкладке 2) — её правка должна проиграть, и она должна
        # подтянуть версию вкладки 2, а не затереть её своей.
        page2 = context.new_page()
        boot_page(page2)
        page.evaluate("() => window.backToList()")
        page.evaluate("() => window.openBoard('bA')")
        page2.evaluate("() => window.openBoard('bA')")
        BOARD_READY_JS = "window.getCurrentBoard() && window.getCurrentBoard().id === 'bA' && Array.isArray(window.getCurrentBoard().objects)"
        page.wait_for_function(BOARD_READY_JS)
        page2.wait_for_function(BOARD_READY_JS)
        # обе вкладки в одном браузере обычно узнают о чужом сохранении через
        # пинг localStorage (см. refreshFromStore) — это отдельная, более
        # быстрая защита, и она реально снимает большинство конфликтов ДО
        # того, как до них доходит. Здесь же мы хотим проверить именно
        # восстановление в момент сохранения (activeLostTo/refreshActive
        # PayloadIfLost) — поэтому нарочно отключаем этот пинг на вкладке 1,
        # как будто сообщение не дошло (другой браузер/устройство, вкладка
        # в фоне у части браузеров, просто гонка внутри одного и того же
        # окна в 300 мс)
        page.evaluate("() => { window.refreshFromStore = () => Promise.resolve(); }")

        page2.evaluate(
            """() => {
                const b = window.getCurrentBoard();
                b.objects.push({ id: 'tab2-wins', type: 'pen', points: [{x:3,y:3},{x:4,y:4}] });
                window.saveDB();
            }"""
        )
        page2.wait_for_timeout(500)
        page2.evaluate(
            """() => {
                const b = window.getCurrentBoard();
                b.objects.push({ id: 'tab2-wins-2', type: 'pen', points: [{x:7,y:7},{x:8,y:8}] });
                window.saveDB();
            }"""
        )
        page2.wait_for_timeout(500)   # rev вкладки 2 теперь на 2 больше, чем у вкладки 1

        page.evaluate(
            """() => {
                const b = window.getCurrentBoard();
                b.objects.push({ id: 'tab1-loses', type: 'pen', points: [{x:5,y:5},{x:6,y:6}] });
                window.saveDB();
            }"""
        )
        page.wait_for_timeout(500)

        stored_after_conflict = idb_get(page, "boarddata:bA")
        tab1_ids_after = set(page.evaluate("() => window.getCurrentBoard().objects.map(o => o.id)"))
        check(
            "проигравшая вкладка не затёрла версию победившей на диске",
            any(o["id"] == "tab2-wins" for o in stored_after_conflict["objects"])
            and not any(o["id"] == "tab1-loses" for o in stored_after_conflict["objects"]),
        )
        check(
            "проигравшая вкладка подтянула в память версию победившей, а не осталась при своей",
            "tab2-wins" in tab1_ids_after and "tab1-loses" not in tab1_ids_after,
        )

        page2.close()
        browser.close()

    print()
    if failures:
        print(f"ИТОГ: {len(failures)} провал(ов): " + "; ".join(failures))
        sys.exit(1)
    print("ИТОГ: всё прошло")


if __name__ == "__main__":
    run()
