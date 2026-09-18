"""
Промпт №48: Промпт №47 научил доски подгружать штрихи/картинки ЛЕНИВО (по
одной, при открытии), но не научил их выгружаться обратно. Доска, которую
открыли, так и оставалась в памяти навсегда, пока не перезагрузишь всю
страницу — а декодированные картинки (imgCache) оставались в памяти ещё и
как раскрытые bitmap'ы, которые весят в разы больше своего base64 на диске.
За долгую рабочую сессию (открыл доску — вернулся в список — открыл другую,
и так десяток раз) это тихо копилось и в итоге роняло вкладку с мгновенным
скачком памяти на несколько гигабайт — именно это поймали в этой сессии
живьём через Activity Monitor.

Теперь backToList() выгружает покидаемую доску обратно в лёгкое состояние
(как будто её не открывали) и чистит её картинки из imgCache. Проверяем:

  1. После ухода со страницы доски в список её objects/imageLib пропадают
     из памяти (unloadBoard сработал), а сама доска остаётся в DB.boards
     (не удаляется).
  2. Данные при этом не теряются — снова открыть эту же доску можно, и в
     ней все те же штрихи (ensureBoardLoaded подгружает заново с диска).
  3. Картинка доски, которую покинули, пропадает из imgCache — если она не
     используется никакой другой доской, до сих пор открытой в памяти.
  4. Общая для двух досок картинка НЕ выгружается из imgCache, пока хотя бы
     одна из этих досок ещё подгружена, — иначе на второй доске эта
     картинка на миг показала бы «Загрузка…» без необходимости.
"""
import subprocess
import sys
import time
import contextlib
import http.client

from playwright.sync_api import sync_playwright

PORT = 8966
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


# крошечный, но настоящий data:-URL картинки (1x1 PNG) — этого достаточно,
# чтобы проверить логику кэша, реальный размер файла тут не важен
TINY_PNG = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII="
OTHER_PNG = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII="


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

        # доска A: штрих + СВОЯ картинка (OTHER_PNG, больше ни у кого нет);
        # доска B: штрих + картинка, ОБЩАЯ с доской C (TINY_PNG);
        # доска C: штрих + та же общая картинка, что и у B
        index_boards = [light_board("bA", "Максим"), light_board("bB", "Аня"), light_board("bC", "Костя")]
        payloads = {
            "bA": {
                "objects": [
                    {"id": "bA-o0", "type": "pen", "points": [{"x": 1, "y": 1}, {"x": 2, "y": 2}]},
                    {"id": "bA-img", "type": "image", "src": OTHER_PNG, "points": [{"x": 5, "y": 5}], "w": 10, "h": 10},
                ],
                "imageLib": [],
            },
            "bB": {
                "objects": [
                    {"id": "bB-o0", "type": "pen", "points": [{"x": 3, "y": 3}, {"x": 4, "y": 4}]},
                    {"id": "bB-img", "type": "image", "src": TINY_PNG, "points": [{"x": 6, "y": 6}], "w": 10, "h": 10},
                ],
                "imageLib": [],
            },
            "bC": {
                "objects": [
                    {"id": "bC-o0", "type": "pen", "points": [{"x": 7, "y": 7}, {"x": 8, "y": 8}]},
                    {"id": "bC-img", "type": "image", "src": TINY_PNG, "points": [{"x": 9, "y": 9}], "w": 10, "h": 10},
                ],
                "imageLib": [],
            },
        }
        seed_split_db(page, index_boards, payloads)

        page.reload()
        page.evaluate(BOOT_JS)
        page.wait_for_function("window.getDB && Array.isArray(window.getDB().boards) && window.getDB().boards.length === 3")
        page.wait_for_timeout(200)

        # ── открываем A, ждём подгрузки и отрисовки (чтобы картинка попала в imgCache) ──
        page.evaluate("() => window.openBoard('bA')")
        page.wait_for_function("window.getCurrentBoard() && window.getCurrentBoard().id === 'bA' && Array.isArray(window.getCurrentBoard().objects)")
        page.evaluate("() => window.boardsRedraw()")  # заставляем реально отрисовать кадр, чтобы картинка попала в imgCache
        page.wait_for_timeout(150)  # дать <img> в imgCache успеть решить onload
        check("картинка доски A действительно попала в imgCache перед проверкой выгрузки", page.evaluate(f"() => window.__imgCacheHas({OTHER_PNG!r})"))

        # ── 1. уходим в список — доска A должна выгрузиться из памяти ──
        page.evaluate("() => window.backToList()")
        page.wait_for_timeout(150)  # backToList выгружает ПОСЛЕ idbSaveDB, даём ей осесть
        a_unloaded = page.evaluate("() => window.getDB().boards.find(b=>b.id==='bA').objects === undefined")
        check("после возврата в список доска A выгружена из памяти (objects === undefined)", a_unloaded)

        board_still_present = page.evaluate("() => window.getDB().boards.some(b=>b.id==='bA')")
        check("сама доска A при этом никуда не пропала из списка", board_still_present)

        # ── 2. картинка, которая была ТОЛЬКО у A, ушла из imgCache ──────
        check(
            "картинка, использовавшаяся только доской A, вычищена из imgCache после её выгрузки",
            not page.evaluate(f"() => window.__imgCacheHas({OTHER_PNG!r})"),
        )

        # ── 3. данные не потеряны — снова открыть A можно, штрихи те же ──
        page.evaluate("() => window.openBoard('bA')")
        page.wait_for_function("window.getCurrentBoard() && window.getCurrentBoard().id === 'bA' && Array.isArray(window.getCurrentBoard().objects)")
        reloaded_ids = page.evaluate("() => window.getCurrentBoard().objects.map(o => o.id)")
        check(
            "повторное открытие A подгружает те же штрихи заново (данные не потеряны)",
            set(reloaded_ids) == {"bA-o0", "bA-img"},
        )
        page.evaluate("() => window.backToList()")
        page.wait_for_timeout(150)

        # ── 4. общая картинка (B и C) не выгружается, пока держит хотя бы
        # одна из двух досок: открываем B, потом C (через список, как в
        # реальном UI — B закрывается сама, C остаётся открытой), и
        # проверяем, что общая картинка не пропала из кэша ──────────────
        page.evaluate("() => window.openBoard('bB')")
        page.wait_for_function("window.getCurrentBoard() && window.getCurrentBoard().id === 'bB' && Array.isArray(window.getCurrentBoard().objects)")
        page.evaluate("() => window.boardsRedraw()")
        page.wait_for_timeout(150)
        page.evaluate("() => window.backToList()")  # выгружает B — но C ещё не открывали, её объекта в памяти вообще нет
        page.wait_for_timeout(150)
        check(
            "общая картинка вычищена, если её держала только уже закрытая доска B (доска C ещё не подгружена)",
            not page.evaluate(f"() => window.__imgCacheHas({TINY_PNG!r})"),
        )

        # теперь открываем и B, и C оба сразу (напрямую через openBoard —
        # эмулируем «две вкладки»/«вернулись и открыли снова, не закрывая
        # первую подгрузку в памяти данных» невозможно штатно в одной вкладке,
        # поэтому проверяем принцип напрямую: пока ОБЕ доски подгружены,
        # закрытие только одной из них не должно чистить общую картинку
        page.evaluate("() => window.openBoard('bC')")
        page.wait_for_function("window.getCurrentBoard() && window.getCurrentBoard().id === 'bC' && Array.isArray(window.getCurrentBoard().objects)")
        page.evaluate("() => window.boardsRedraw()")
        page.wait_for_timeout(150)
        check("общая картинка снова в imgCache после открытия C и явной перерисовки", page.evaluate(f"() => window.__imgCacheHas({TINY_PNG!r})"))
        # искусственно возвращаем bB в подгруженное состояние параллельно с C,
        # как будто их обе успели открыть в этой сессии (unloadBoard проверяет
        # именно DB.boards, а не то, какая доска сейчас активна)
        page.evaluate(
            f"""() => {{
                const bb = window.getDB().boards.find(b=>b.id==='bB');
                bb.objects = [{{id:'bB-o0'}}, {{id:'bB-img', type:'image', src:{TINY_PNG!r}}}];
                bb.imageLib = [];
            }}"""
        )
        page.evaluate("() => window.backToList()")  # выгружает C (активную), но B искусственно оставлена подгруженной
        page.wait_for_timeout(150)
        check(
            "общая картинка НЕ вычищена из imgCache, пока доска B всё ещё числится подгруженной",
            page.evaluate(f"() => window.__imgCacheHas({TINY_PNG!r})"),
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
