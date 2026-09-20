"""
Промпт №54, доски: мелкие, но опасные дыры, найденные при сплошной вычитке
boards-core.js.

Проверяем:
  1. Сбой ЧТЕНИЯ записи доски не превращает её в «подгруженную пустую»:
     доска не открывается, остаётся невыгруженной, запись на диске цела.
     Раньше ensureBoardLoaded при ошибке ставил objects = [] — и первый же
     штрих переписал бы весь урок одним штрихом (как в промпте №52).
  2. Сбой ЗАПИСИ при рабочем IndexedDB показывает красную плашку и не
     пишет копию всех досок в localStorage. Раньше копия вставала, плашка
     снималась, а сохранённое терялось: эту копию при рабочем IndexedDB
     никто не читает, а вход Supabase в том же localStorage мог начать
     отказывать следом.
  3. Кнопка «Выгрузить в файл» на плашке, нажатая на СПИСКЕ досок, отдаёт
     полный архив (со штрихами неоткрытых досок), а не пустую покинутую
     доску и не JSON.stringify(DB) без содержимого.
  3б. Если запись не прошла, доска при выходе в список НЕ выгружается из
     памяти: раньше её несохранённые штрихи пропадали вместе с выгрузкой.
  4. Панель «Тренажёры» на доске знает «Действия со степенями», а у ОГЭ №12
     и степеней снимаются и добавленные карточки, как у ОГЭ №8.
  5. Прокрутка колесом/тачпадом запоминает вид доски (rememberView).
  6. Кэш цветов темы сбрасывается при смене темы: цвет чернил «--pencil»
     разный в светлой и тёмной.
  7. boards.html не ходит на cdnjs: jsPDF и html2canvas — локальные файлы.

Запуск: python3 test_prompt54_boards_fixes.py (сервер поднимается сам).
"""
import json
import subprocess
import sys
import time
import contextlib
import http.client

from playwright.sync_api import sync_playwright

PORT = 8970
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


def lite(board_id, name):
    return {
        "id": board_id, "name": name, "folderId": None,
        "createdAt": 1000, "updatedAt": 1000, "lastOpenedAt": None, "rev": 1,
        "cellSize": 24, "sheetCols": 76, "sheetRows": 54, "pageOrder": "h",
        "recentColors": [], "colorUsage": {}, "view": {"x": 0, "y": 0, "zoom": 1},
    }


def pen(obj_id, x):
    return {"id": obj_id, "type": "pen", "color": "--pencil", "width": 2,
            "points": [{"x": x, "y": 10}, {"x": x + 20, "y": 30}]}


SEED_JS = """([boards, payloads]) => new Promise((resolve, reject) => {
    const req = indexedDB.open('ogeBoardsDB', 1);
    req.onupgradeneeded = () => req.result.createObjectStore('state');
    req.onsuccess = () => {
      const tx = req.result.transaction('state', 'readwrite');
      const st = tx.objectStore('state');
      st.put({ __v: 2, folders: [], boards, deleted: [], sortMode: 'my' }, 'db');
      Object.keys(payloads).forEach(id => st.put(payloads[id], 'boarddata:' + id));
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => reject(tx.error);
    };
    req.onerror = () => reject(req.error);
})"""

READ_JS = """(key) => new Promise((resolve, reject) => {
    const req = indexedDB.open('ogeBoardsDB');
    req.onsuccess = () => {
      const g = req.result.transaction('state', 'readonly').objectStore('state').get(key);
      g.onsuccess = () => resolve(g.result === undefined ? null : g.result);
      g.onerror = () => reject(g.error);
    };
    req.onerror = () => reject(req.error);
})"""


def open_app(context, boards, payloads, external):
    page = context.new_page()
    # сторонние адреса — только посчитать и отрезать: сети в песочнице нет,
    # а п.7 проверяет, что за библиотеками экспорта страница никуда не ходит
    def on_route(route):
        external.append(route.request.url)
        route.abort()
    page.route("https://**/*", on_route)
    page.goto(f"{BASE}/boards.html")
    page.evaluate(SEED_JS, [boards, payloads])
    page.reload()
    page.evaluate(BOOT_JS)
    page.wait_for_function("() => window.getDB && window.getDB().boards.length >= %d" % len(boards))
    return page


def run():
    failures = []

    def check(name, cond):
        print(f"[{'OK' if cond else 'FAIL'}] {name}")
        if not cond:
            failures.append(name)

    with local_server(), sync_playwright() as p:
        browser = p.chromium.launch()

        # ── 1. сбой чтения не превращает доску в пустую ─────────────────
        ctx = browser.new_context(accept_downloads=True)
        external = []
        page = open_app(ctx, [lite("bA", "Урок"), lite("bB", "Другая")],
                        {"bA": {"objects": [pen("p1", 10), pen("p2", 60)], "imageLib": []},
                         "bB": {"objects": [pen("q1", 10)], "imageLib": []}}, external)
        dialogs = []
        page.on("dialog", lambda d: (dialogs.append(d.message), d.accept()))
        page.evaluate("""() => {
            window.__origIdbGet = window.idbGet;
            window.idbGet = (key) => String(key).startsWith('boarddata:')
              ? Promise.reject(new Error('сбой чтения (тест)')) : window.__origIdbGet(key);
        }""")
        page.evaluate("() => window.openBoard('bA')")
        page.wait_for_timeout(500)
        st = page.evaluate("""() => { const b = window.getDB().boards.find(x => x.id === 'bA');
            return { loaded: b.objects !== undefined,
                     boardShown: document.getElementById('screenBoard').style.display === 'block' }; }""")
        check("1. при сбое чтения доска не считается подгруженной", not st["loaded"])
        check("1. при сбое чтения доска не открывается", not st["boardShown"])
        check("1. человеку сказали, что прочитать не вышло", any("прочитать" in d for d in dialogs))
        page.evaluate("() => { window.idbGet = window.__origIdbGet; }")
        page.evaluate("() => window.openBoard('bA')")
        page.wait_for_function("() => window.getCurrentBoard() && window.getCurrentBoard().id === 'bA' && document.getElementById('screenBoard').style.display === 'block'")
        n = page.evaluate("() => window.getCurrentBoard().objects.length")
        check("1. после сбоя доска открывается целиком (2 штриха)", n == 2)

        # ── 5. колесо/тачпад запоминает вид ─────────────────────────────
        before = page.evaluate("() => JSON.stringify(window.getCurrentBoard().view || null)")
        page.mouse.move(700, 400)
        page.mouse.wheel(0, 240)
        page.wait_for_timeout(1200)
        after_mem = page.evaluate("() => window.getCurrentBoard().view")
        idx = page.evaluate(READ_JS, "db")
        disk_view = next(b for b in idx["boards"] if b["id"] == "bA").get("view")
        check("5. прокрутка колесом меняет запомненный вид", json.dumps(after_mem) != before and after_mem["y"] > 0)
        check("5. запомненный вид дошёл до диска", disk_view and abs(disk_view["y"] - after_mem["y"]) < 1e-6)

        # ── 6. кэш цветов темы сбрасывается при смене темы ─────────────
        colors = page.evaluate("""async () => {
            const a = resolveColor('--pencil');
            const was = document.documentElement.getAttribute('data-theme');
            document.documentElement.setAttribute('data-theme', was === 'dark' ? 'light' : 'dark');
            await new Promise(r => setTimeout(r, 0));
            const b = resolveColor('--pencil');
            document.documentElement.setAttribute('data-theme', was);
            await new Promise(r => setTimeout(r, 0));
            const c = resolveColor('--pencil');
            return [a, b, c];
        }""")
        check("6. цвет темы меняется вместе с темой и возвращается", colors[0] != colors[1] and colors[0] == colors[2])

        # ── 2 и 3. сбой записи на СПИСКЕ: плашка, без localStorage, архив ─
        page.evaluate("() => document.getElementById('bdBack').click()")
        page.wait_for_function("() => document.getElementById('screenList').style.display === 'flex'")
        page.wait_for_function("() => window.getDB().boards.find(b => b.id === 'bA').objects === undefined")
        page.evaluate("""() => {
            localStorage.removeItem('ogeBoards:v1');
            window.__origIdbPut = window.idbPut;
            window.idbPut = () => Promise.reject(Object.assign(new Error('диск полон (тест)'), { name: 'QuotaExceededError' }));
            window.__origIdbOpen = window.idbOpen;
            // idbSaveIndexMerged пишет через свою транзакцию — роняем и её
            window.idbOpen = () => Promise.reject(Object.assign(new Error('диск полон (тест)'), { name: 'QuotaExceededError' }));
            const b = window.getDB().boards.find(x => x.id === 'bB');
            b.name = 'Другая (переименована)';
            window.saveDB();
        }""")
        page.wait_for_selector("#saveFailBanner", timeout=4000)
        ls = page.evaluate("() => localStorage.getItem('ogeBoards:v1')")
        check("2. при рабочем IndexedDB сбой записи показан плашкой", True)
        check("2. копия всех досок в localStorage не пишется", ls is None)

        # чтение с диска при этом работает — архив соберётся полностью
        page.evaluate("() => { window.idbOpen = window.__origIdbOpen; }")
        with page.expect_download(timeout=8000) as dl_info:
            page.click("#saveFailBanner button")
        path = dl_info.value.path()
        data = json.load(open(path, encoding="utf-8"))
        a = next((b for b in data.get("boards", []) if b["id"] == "bA"), None)
        check("3. на списке «Выгрузить в файл» отдаёт архив всех досок", data.get("__kind") == "boards-archive")
        check("3. в архиве есть штрихи неоткрытой (выгруженной) доски", a is not None and len(a.get("objects") or []) == 2)
        page.evaluate("() => { window.idbPut = window.__origIdbPut; }")

        # ── 3б. сбой записи при выходе в список — доска остаётся в памяти ─
        page.evaluate("() => window.openBoard('bB')")
        page.wait_for_function("() => window.getCurrentBoard() && window.getCurrentBoard().id === 'bB' && document.getElementById('screenBoard').style.display === 'block'")
        page.evaluate("""() => {
            window.idbPut = () => Promise.reject(new Error('диск полон (тест)'));
            window.idbOpen = () => Promise.reject(new Error('диск полон (тест)'));
            const b = window.getCurrentBoard();
            window.pushUndo();
            b.objects.push({ id: 'q2', type: 'pen', color: '--pencil', width: 2,
                             points: [{ x: 90, y: 10 }, { x: 110, y: 30 }] });
            window.saveDB();
        }""")
        page.evaluate("() => document.getElementById('bdBack').click()")
        page.wait_for_timeout(800)
        kept = page.evaluate("() => { const b = window.getDB().boards.find(x => x.id === 'bB'); return b.objects === undefined ? -1 : b.objects.length; }")
        check("3б. при сбое записи покинутая доска не выгружается (несохранённый штрих в памяти)", kept == 2)
        page.evaluate("() => { window.idbPut = window.__origIdbPut; window.idbOpen = window.__origIdbOpen; }")

        # ── 4. панель «Тренажёры» ──────────────────────────────────────
        panel = page.evaluate("""() => ({
            ids: TRAINERS_PANEL_GROUPS.flatMap(g => g.items.map(i => i.id)),
            powers: TRAINER_CAPTURE.powers, oge12: TRAINER_CAPTURE.oge12,
            name: TRAINER_NAMES.powers,
        })""")
        check("4. в панели тренажёров есть «Действия со степенями»", "powers" in panel["ids"])
        check("4. у степеней снимаются добавленные карточки",
              any(e.get("selAll") for e in (panel["powers"] or [])))
        check("4. у ОГЭ №12 снимаются добавленные карточки",
              any(e.get("selAll") for e in (panel["oge12"] or [])))
        check("4. в «Добавить из подборки» степени подписаны по-русски", panel["name"] == "Действия со степенями")

        # ── 7. без cdnjs ────────────────────────────────────────────────
        libs = page.evaluate("() => ({ pdf: !!(window.jspdf && window.jspdf.jsPDF), h2c: typeof window.html2canvas === 'function' })")
        check("7. jsPDF и html2canvas подключены локально", libs["pdf"] and libs["h2c"])
        check("7. страница досок не обращается к cdnjs", not any("cdnjs" in u for u in external))
        ctx.close()
        browser.close()

    print()
    if failures:
        print("ПРОВАЛЫ:")
        for f in failures:
            print(" -", f)
        sys.exit(1)
    print("ИТОГ: всё прошло")


if __name__ == "__main__":
    run()
