"""
Промпт №50: настоящая причина падений с мгновенным скачком памяти на
несколько гигабайт (см. HANDOFF, раздел 10 — там же живой пример краша на
~6.3 ГБ, пойманный через Activity Monitor). pushUndo() вызывается на КАЖДЫЙ
штрих/перетаскивание и клал в undoStack ПОЛНУЮ копию всей доски целиком
(JSON.stringify(B.objects)) — если у доски богатая история (например, общая
доска, которой пользуются на каждом уроке месяцами, объекты в ней никогда
не схлопываются), один снимок может весить десятки мегабайт, а стек хранит
их до 60 штук ОДНОВРЕМЕННО. Именно поэтому доска, которую давно не
редактировали руками, спокойно открывалась (её просто читают), а падение
случалось ровно в момент, когда начинали писать — на первом же pushUndo.

Теперь общий вес истории отмены/повтора ограничен явным бюджетом байт
(UNDO_BYTES_BUDGET), а не только количеством снимков (UNDO_LIMIT=60).
Проверяем:

  1. На ТЯЖЁЛОЙ доске (крупные объекты) многократные pushUndo() не дают
     стеку разрастись пропорционально количеству снимков — итоговый вес
     остаётся в пределах бюджета, а длина стека заметно меньше UNDO_LIMIT.
  2. На ЛЁГКОЙ доске (маленькие объекты) поведение НЕ изменилось —
     по-прежнему копится ровно до UNDO_LIMIT=60 снимков (регрессия старого,
     привычного поведения на обычных досках).
  3. Обрезка по бюджету не ломает сам undo — после серии pushUndo() вызов
     doUndo() всё равно корректно возвращает последнее сохранённое состояние.
  4. Открытие другой доски сбрасывает счётчик веса истории (undoBytes) в 0 —
     иначе вес одной тяжёлой доски мог бы влиять на бюджет следующей.
"""
import subprocess
import sys
import time
import contextlib
import http.client

from playwright.sync_api import sync_playwright

PORT = 8988
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

        # доска H («тяжёлая»): несколько объектов с большими строковыми полями
        # (эмулируем большую реальную доску — много точек в штрихах и т.п. —
        # без необходимости рисовать тысячи настоящих объектов в тесте)
        # доска L («лёгкая»): маленькие объекты, как у обычной свежей доски
        big_field = "x" * (2 * 1024 * 1024)  # ~2 МБ на одну строку
        index_boards = [light_board("bH", "Тяжёлая"), light_board("bL", "Лёгкая")]
        payloads = {
            "bH": {"objects": [{"id": f"h{i}", "type": "pen", "blob": big_field} for i in range(3)], "imageLib": []},
            "bL": {"objects": [{"id": "l0", "type": "pen", "points": [{"x": 1, "y": 1}]}], "imageLib": []},
        }
        seed_split_db(page, index_boards, payloads)

        page.reload()
        page.evaluate(BOOT_JS)
        page.wait_for_function("window.getDB && Array.isArray(window.getDB().boards) && window.getDB().boards.length === 2")

        # ── 1. тяжёлая доска: 10 pushUndo() не должны раздуть стек до 10×вес ──
        page.evaluate("() => window.openBoard('bH')")
        page.wait_for_function("window.getCurrentBoard() && window.getCurrentBoard().id === 'bH'")
        for _ in range(10):
            page.evaluate("() => window.pushUndo()")
        info_heavy = page.evaluate("() => window.__undoStackInfo()")
        print("тяжёлая доска, инфо стека:", info_heavy)
        check(
            "на тяжёлой доске стек НЕ дорастает до полных 10 снимков (бюджет байт обрезает раньше)",
            info_heavy["count"] < 10,
        )
        check(
            "на тяжёлой доске общий вес истории укладывается в бюджет (с запасом на последний снимок)",
            info_heavy["bytes"] <= info_heavy["budget"] + 7 * 1024 * 1024,
        )

        # ── 2. обрезка по бюджету не ломает сам undo — после серии pushUndo
        # состояние можно откатить, и оно совпадает с тем, что было ПЕРЕД
        # последним pushUndo (последний снимок всегда остаётся в стеке) ──
        # pushUndo() снимает снимок ДО изменения (обычный порядок в самом
        # движке: pushUndo() → потом мутируем объекты) — значит doUndo()
        # должен вернуть именно состояние, зафиксированное этим снимком,
        # а не более раннее и не промежуточное
        before_last_push = page.evaluate("() => JSON.stringify(window.getCurrentBoard().objects)")
        page.evaluate("() => { window.pushUndo(); window.getCurrentBoard().objects.push({id:'h-extra', type:'pen', points:[{x:9,y:9}]}); window.getCurrentBoard().objects.push({id:'h-extra2', type:'pen', points:[{x:5,y:5}]}); }")
        page.evaluate("() => window.doUndo()")
        after_undo = page.evaluate("() => JSON.stringify(window.getCurrentBoard().objects)")
        check("после doUndo() состояние доски совпадает с последним сохранённым снимком", after_undo == before_last_push)

        # ── 3. открытие другой доски сбрасывает счётчик веса истории ──
        page.evaluate("() => window.backToList()")
        page.evaluate("() => window.openBoard('bL')")
        page.wait_for_function("window.getCurrentBoard() && window.getCurrentBoard().id === 'bL'")
        info_after_switch = page.evaluate("() => window.__undoStackInfo()")
        check("после перехода на другую доску счётчик веса истории обнулён", info_after_switch["bytes"] == 0 and info_after_switch["count"] == 0)

        # ── 4. лёгкая доска: поведение не изменилось — копится ровно до
        # UNDO_LIMIT (60), бюджет байт тут ни при чём (маленькие объекты) ──
        for _ in range(70):
            page.evaluate("() => window.pushUndo()")
        info_light = page.evaluate("() => window.__undoStackInfo()")
        print("лёгкая доска, инфо стека:", info_light)
        check("на лёгкой доске стек по-прежнему ограничен именно UNDO_LIMIT=60 (не бюджетом байт)", info_light["count"] == 60)
        check("на лёгкой доске вес истории далеко не дотягивает до бюджета", info_light["bytes"] < info_light["budget"] / 10)

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
