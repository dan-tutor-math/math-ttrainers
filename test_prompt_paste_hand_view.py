"""
«Вставка и вид доски»: две правки досок (boards-core.js).

1. Вставили картинку — включается «рука», что бы ни было выбрано до этого,
   и картинку можно сразу тащить. Окно вставки (Ctrl+V с картинкой в
   системном буфере, кнопка, перетаскивание) так делало с промпта №44, а
   вставка своего буфера (скопировал картинку на одной доске — Ctrl+V или
   «Вставить» в меню на другой) оставляла прежний инструмент, и первое же
   касание рисовало поверх картинки.
2. Доска открывается там, где её закрыли — и после «Назад к доскам», и после
   закрытия вкладки крестиком. Раньше вид жил только в индексе досок, при
   слиянии вкладок каждая считала главным свой — соседняя вкладка со старым
   видом его возвращала; при закрытии вкладки запись в IndexedDB могла не
   успеть; сдвиги камеры не колесом и не мышью (подъезд к заданию и т. п.)
   не запоминались; при другом размере окна середина уезжала.

Проверяем:
  A. Окно вставки: с ручки и с прямой — «рука», картинка выделена, тащится
     первым же нажатием (регрессия промпта №44).
  B. Свой буфер: скопировали картинку (Ctrl+C), выбрали ручку, Ctrl+V — «рука»,
     вставленная картинка выделена и тащится; то же через «Вставить» в меню и
     с другой доски; закреплённая картинка (задание) тащится без двойного клика.
  C. Вставили картинку вместе со штрихом — «рука», тащится вся вставка разом;
     клик мимо отпускает группу.
  D. Вставили только штрихи — инструмент прежний (ручка), рисовать можно дальше.
  E. «Назад к доскам» — открывается там же (и масштаб тот же).
  F. Закрыли вкладку сразу после прокрутки (до паузы автосохранения) — в новой
     вкладке доска там же. Вид из localStorage свежее индекса — берётся он.
  G. Две вкладки: во второй список открыт давно (старый вид в памяти). В
     первой прокрутили и вышли; вторая сохраняется (её старый вид не должен
     затереть свежий) и открывает доску — там, где закончили в первой.
  H. Камеру сдвинул не человек (подъезд к новому заданию) — тоже запоминается.
  I. Окно стало уже — посередине окна та же точка доски, что была.
  J. Открыли одну доску, потом другую: камера первой не записывается второй.
  K. Нет ошибок JavaScript.

Realtime отсюда не проверить (websocket к Supabase закрыт) — общие доски с
учеником Даниил перепроверяет на сайте.

Запуск: python3 test_prompt_paste_hand_view.py (сервер поднимается сам).
"""
import contextlib
import http.client
import subprocess
import sys
import time

from playwright.sync_api import sync_playwright

PORT = 9083
BASE = f"http://127.0.0.1:{PORT}"
fails = []


def check(msg, cond, extra=""):
    print(("[OK]   " if cond else "[FAIL] ") + msg + (f" — {extra}" if extra and not cond else ""))
    if not cond:
        fails.append(msg)


@contextlib.contextmanager
def local_server():
    proc = subprocess.Popen([sys.executable, "-m", "http.server", str(PORT)],
                            stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
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


BOOT_JS = """() => {
  const gate = document.getElementById('authGate');
  if (gate) gate.style.display = 'none';
  window.boardsAppBoot();
}"""

def lite(bid, name):
    return {"id": bid, "name": name, "folderId": None,
            "createdAt": 1000, "updatedAt": 1000, "lastOpenedAt": None, "rev": 1,
            "cellSize": 24, "sheetCols": 76, "sheetRows": 54, "pageOrder": "h",
            "recentColors": [], "colorUsage": {}}

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

IMG_JS = """() => { const c = document.createElement('canvas'); c.width = 400; c.height = 300;
  const x = c.getContext('2d'); x.fillStyle = '#d00'; x.fillRect(0, 0, 200, 300);
  x.fillStyle = '#00d'; x.fillRect(200, 0, 200, 300); return c.toDataURL('image/png'); }"""

STORED_VIEW_JS = """(id) => new Promise(res => {
  const req = indexedDB.open('ogeBoardsDB', 1);
  req.onsuccess = () => { const g = req.result.transaction('state').objectStore('state').get('db');
    g.onsuccess = () => { const b = (g.result.boards || []).find(x => x.id === id); res(b ? (b.view || null) : null); }; };
})"""


def boot(page, seed=False):
    page.route("https://**/*", lambda r: r.abort())
    page.goto(f"{BASE}/boards.html")
    if seed:
        page.evaluate(SEED_JS, [[lite("bA", "Урок"), lite("bB", "Другая")],
                                {"bA": {"objects": [], "imageLib": []}, "bB": {"objects": [], "imageLib": []}}])
        page.reload()
    page.evaluate(BOOT_JS)
    page.wait_for_function("() => window.getDB && window.getDB().boards.length >= 2")


def open_b(page, bid):
    page.evaluate(f"() => window.openBoard('{bid}')")
    page.wait_for_function(f"() => window.getCurrentBoard() && window.getCurrentBoard().id === '{bid}' && boardActive && Array.isArray(window.getCurrentBoard().objects)")
    page.wait_for_timeout(250)


def back(page):
    page.click("#bdBack")
    page.wait_for_timeout(400)


def new_page(ctx, errors, w=1400, h=900):
    page = ctx.new_page()
    page.set_viewport_size({"width": w, "height": h})
    page.on("pageerror", lambda e: errors.append(str(e)))
    return page


def pick_tool(page, t):
    page.click(f'#bdDock .bd-tool[data-tool="{t}"]')
    page.wait_for_timeout(60)


def active_tool(page):
    return page.evaluate("() => [tool, (document.querySelector('.bd-tool.active') || {dataset:{}}).dataset.tool]")


def w2s(page, x, y):
    return page.evaluate("""([x, y]) => { const r = canvas.getBoundingClientRect();
        return [r.left + (x - cam.x) * cam.zoom, r.top + (y - cam.y) * cam.zoom]; }""", [x, y])


def drag(page, a, b, steps=6):
    page.mouse.move(a[0], a[1])
    page.mouse.down()
    for i in range(1, steps + 1):
        page.mouse.move(a[0] + (b[0] - a[0]) * i / steps, a[1] + (b[1] - a[1]) * i / steps)
    page.mouse.up()
    page.wait_for_timeout(100)


def obj(page, oid):
    return page.evaluate(f"() => JSON.parse(JSON.stringify(B.objects.find(o => o.id === '{oid}') || null))")


def center_of(page, o):
    return w2s(page, o["points"][0]["x"] + o["w"] / 2, o["points"][0]["y"] + o["h"] / 2)


def paste_system_image(page, src):
    page.evaluate("""async (src) => { const blob = await (await fetch(src)).blob();
      const dt = new DataTransfer(); dt.items.add(new File([blob], 'a.png', {type:'image/png'}));
      document.dispatchEvent(new ClipboardEvent('paste', {clipboardData: dt, bubbles: true})); }""", src)
    page.wait_for_function("() => document.getElementById('imgModalBackdrop').classList.contains('open')")
    page.wait_for_timeout(150)


def paste_own(page):
    # системный буфер без картинки — Ctrl+V относится к своему буферу доски
    page.evaluate("() => document.dispatchEvent(new ClipboardEvent('paste', {clipboardData: new DataTransfer(), bubbles: true}))")
    page.wait_for_timeout(150)


def add_image(page, locked=False, dx=0):
    """картинка посередине видимой части доски, возвращает id"""
    return page.evaluate("""([src, locked, dx]) => { const v = visibleBoardRect();
        const o = { id: 'im' + Math.random().toString(36).slice(2, 8), type: 'image', src,
          points: [{ x: v.x + v.w/2 - 100 + dx, y: v.y + v.h/2 - 75 }], w: 200, h: 150, natW: 400, natH: 300, locked };
        B.objects.push(o); saveDB(); scheduleRedraw(); return o.id; }""", [page.evaluate(IMG_JS), locked, dx])


def view_center(page):
    """какая точка доски сейчас посередине окна"""
    return page.evaluate("() => [cam.x + (window.innerWidth/2 - boardInset)/cam.zoom, cam.y + cssH/2/cam.zoom, cam.zoom]")


def close_to(a, b, tol=0.6):
    return all(abs(x - y) <= tol for x, y in zip(a, b))


def run(browser):
    errors = []
    ctx = browser.new_context()
    page = new_page(ctx, errors)
    boot(page, seed=True)
    open_b(page, "bA")
    src = page.evaluate(IMG_JS)

    # ── A. окно вставки ──
    for t in ("pen", "line"):
        pick_tool(page, t)
        paste_system_image(page, src)
        page.click("#imgModalInsert")
        page.wait_for_timeout(200)
        check(f"A: окно вставки с инструмента «{t}» — включилась «рука»", active_tool(page) == ["hand", "hand"], str(active_tool(page)))
        oid = page.evaluate("() => selectedId")
        o = obj(page, oid)
        check(f"A: вставленная картинка выделена ({t})", o and o["type"] == "image")
        c = center_of(page, o)
        drag(page, c, [c[0] + 90, c[1] + 40])
        o2 = obj(page, oid)
        check(f"A: картинка тащится первым же нажатием ({t})",
              abs(o2["points"][0]["x"] - o["points"][0]["x"] - 90 / page.evaluate('() => cam.zoom')) < 1.5,
              f'{o["points"][0]} → {o2["points"][0]}')
    page.evaluate("() => { B.objects = []; selectedId = null; multiSelectIds = []; saveDB(); scheduleRedraw(); }")

    # ── B. свой буфер ──
    iid = add_image(page)
    pick_tool(page, "select")
    page.evaluate(f"() => {{ selectedId = '{iid}'; multiSelectIds = []; updateContextMenu(); }}")
    page.keyboard.press("Control+c")
    page.wait_for_timeout(150)
    check("B: Ctrl+C положил картинку в буфер доски", page.evaluate("() => clipboardObjs && clipboardObjs.length === 1 && clipboardObjs[0].type === 'image'"))
    pick_tool(page, "pen")
    page.mouse.move(500, 420)
    paste_own(page)
    check("B: Ctrl+V своей картинки с ручки — «рука»", active_tool(page) == ["hand", "hand"], str(active_tool(page)))
    nid = page.evaluate("() => selectedId")
    check("B: выделена именно вставленная копия", nid and nid != iid and obj(page, nid)["type"] == "image")
    n_before = page.evaluate("() => B.objects.length")
    o = obj(page, nid)
    c = center_of(page, o)
    drag(page, c, [c[0] - 70, c[1] + 50])
    o2 = obj(page, nid)
    check("B: вставленная картинка тащится сразу, поверх ничего не нарисовалось",
          page.evaluate("() => B.objects.length") == n_before and abs(o2["points"][0]["y"] - o["points"][0]["y"]) > 10,
          f'{o["points"][0]} → {o2["points"][0]}')

    # через «Вставить» в меню (правый клик), с прямой
    pick_tool(page, "line")
    page.evaluate("() => { selectedId = null; multiSelectIds = []; updateContextMenu(); }")
    has_menu = page.evaluate("() => !!document.querySelector('[data-act=\"paste\"]')")
    if has_menu:
        page.evaluate("""() => { const b = document.querySelector('[data-act="paste"]');
            b.dispatchEvent(new MouseEvent('click', { bubbles: true, clientX: 700, clientY: 380 })); }""")
    else:
        page.evaluate("() => pasteClipboard({ x: 700, y: 380 })")
    page.wait_for_timeout(150)
    check("B: «Вставить» из меню с прямой — «рука»", active_tool(page) == ["hand", "hand"], str(active_tool(page)))

    # с другой доски, закреплённая картинка (задание с тренажёра)
    page.evaluate("() => { B.objects = []; saveDB(); }")
    lid = add_image(page, locked=True)
    pick_tool(page, "select")
    page.evaluate(f"() => {{ selectedId = '{lid}'; multiSelectIds = []; updateContextMenu(); }}")
    page.keyboard.press("Control+c")
    page.wait_for_timeout(150)
    back(page)
    open_b(page, "bB")
    pick_tool(page, "eraser")
    page.mouse.move(640, 430)
    paste_own(page)
    check("B: на другой доске с ластика — «рука»", active_tool(page) == ["hand", "hand"], str(active_tool(page)))
    nid = page.evaluate("() => selectedId")
    o = obj(page, nid)
    check("B: копия закреплённая, как оригинал", o and o.get("locked") is True)
    c = center_of(page, o)
    drag(page, c, [c[0] + 60, c[1] + 60])
    o2 = obj(page, nid)
    check("B: закреплённую вставленную картинку тащит без двойного клика",
          abs(o2["points"][0]["x"] - o["points"][0]["x"]) > 10, f'{o["points"][0]} → {o2["points"][0]}')

    # ── C. картинка + штрих разом ──
    page.evaluate("() => { B.objects = []; selectedId = null; multiSelectIds = []; saveDB(); }")
    gid = add_image(page)
    sid = page.evaluate("""() => { const v = visibleBoardRect(); const x = v.x + v.w/2 + 160, y = v.y + v.h/2;
        const o = { id: 'st1', type: 'pen', color: 'ink', width: 3, points: [{x, y}, {x: x+60, y: y+30}, {x: x+120, y: y}] };
        B.objects.push(o); saveDB(); scheduleRedraw(); return o.id; }""")
    page.evaluate(f"() => {{ selectedId = null; multiSelectIds = ['{gid}', '{sid}']; updateContextMenu(); }}")
    page.keyboard.press("Control+c")
    page.wait_for_timeout(150)
    pick_tool(page, "pen")
    page.mouse.move(600, 300)
    paste_own(page)
    check("C: картинка вместе со штрихом — «рука»", active_tool(page) == ["hand", "hand"], str(active_tool(page)))
    ids = page.evaluate("() => multiSelectIds.slice()")
    check("C: выделена вся вставка (2 объекта)", len(ids) == 2)
    im = next(obj(page, i) for i in ids if obj(page, i)["type"] == "image")
    st = next(obj(page, i) for i in ids if obj(page, i)["type"] == "pen")
    c = center_of(page, im)
    drag(page, c, [c[0] + 50, c[1] + 80])
    im2, st2 = obj(page, im["id"]), obj(page, st["id"])
    dxi = im2["points"][0]["x"] - im["points"][0]["x"]
    dxs = st2["points"][0]["x"] - st["points"][0]["x"]
    check("C: тащится вся вставка разом", abs(dxi) > 10 and abs(dxi - dxs) < 0.01, f"{dxi} / {dxs}")
    page.mouse.click(60, 860)
    page.wait_for_timeout(100)
    check("C: клик мимо отпускает группу", page.evaluate("() => multiSelectIds.length") == 0)

    # ── D. только штрихи — инструмент прежний ──
    page.evaluate(f"() => {{ selectedId = '{sid}'; multiSelectIds = []; updateContextMenu(); }}")
    page.keyboard.press("Control+c")
    page.wait_for_timeout(100)
    pick_tool(page, "pen")
    paste_own(page)
    check("D: вставили только штрих — осталась ручка", active_tool(page) == ["pen", "pen"], str(active_tool(page)))
    back(page)

    # ── E. «Назад к доскам» ──
    open_b(page, "bA")
    page.evaluate("() => setZoom(1.5, cam.x + cssW/2/cam.zoom, cam.y + cssH/2/cam.zoom, cssW/2, cssH/2)")
    page.mouse.move(700, 450)
    page.mouse.wheel(1300, 900)
    page.wait_for_timeout(150)
    want = view_center(page)
    back(page)
    open_b(page, "bA")
    got = view_center(page)
    check("E: «Назад к доскам» → открылась там же и в том же масштабе", close_to(want, got), f"{want} / {got}")

    # ── F. закрыли вкладку крестиком сразу после прокрутки ──
    page.mouse.move(700, 450)
    page.mouse.wheel(-2100, 1700)
    page.wait_for_timeout(60)        # меньше паузы автосохранения (700 мс)
    want = view_center(page)
    page.close(run_before_unload=True)
    time.sleep(0.3)
    page = new_page(ctx, errors)
    boot(page)
    open_b(page, "bA")
    got = view_center(page)
    check("F: после закрытия вкладки доска открылась там же", close_to(want, got), f"{want} / {got}")
    # вид из localStorage свежее, чем в индексе — открываемся по нему
    back(page)
    page.evaluate("""() => { const b = getDB().boards.find(x => x.id === 'bA');
        b.view = Object.assign({}, b.view, { cx: b.view.cx - 5000, at: b.view.at - 60000 });
        const m = JSON.parse(localStorage.getItem('boardsViews')); m.bA.cx += 3000; m.bA.at = Date.now();
        localStorage.setItem('boardsViews', JSON.stringify(m)); }""")
    ls_cx = page.evaluate("() => JSON.parse(localStorage.getItem('boardsViews')).bA.cx")
    open_b(page, "bA")
    check("F: свежий вид из localStorage главнее старого в индексе", abs(view_center(page)[0] - ls_cx) < 0.6,
          f"{view_center(page)[0]} / {ls_cx}")

    # ── G. две вкладки ──
    back(page)
    page.wait_for_timeout(800)
    tab2 = new_page(ctx, errors)
    boot(tab2)                                   # во второй вкладке — список, вид в памяти старый
    old2 = tab2.evaluate("() => JSON.parse(JSON.stringify(getDB().boards.find(x => x.id === 'bA').view))")
    open_b(page, "bA")
    page.mouse.move(700, 450)
    page.mouse.wheel(4800, -2600)
    page.wait_for_timeout(150)
    want = view_center(page)
    back(page)
    page.wait_for_timeout(400)
    # localStorage общий для вкладок — убираем его, чтобы проверить именно слияние индекса
    tab2.evaluate("() => localStorage.removeItem('boardsViews')")
    tab2.evaluate("() => idbSaveDB()")          # вкладка со старым видом сохраняется
    tab2.wait_for_timeout(300)
    stored = page.evaluate(STORED_VIEW_JS, "bA")
    check("G: сохранение соседней вкладки не затёрло свежий вид старым",
          stored and abs(stored["cx"] - want[0]) < 0.6, f"{stored} / {want}, было во 2-й {old2}")
    tab2.bring_to_front()
    tab2.evaluate("() => refreshFromStore()")
    tab2.wait_for_timeout(200)
    open_b(tab2, "bA")
    got = view_center(tab2)
    check("G: вторая вкладка открыла доску там, где закончили в первой", close_to(want, got), f"{want} / {got}")
    back(tab2)
    tab2.close()

    # ── H. камеру сдвинула программа ──
    open_b(page, "bA")
    page.evaluate("() => { const v = visibleBoardRect(); revealWorldRect({ x: v.x + v.w + 3000, y: v.y, w: 200, h: 100 }); }")
    page.wait_for_timeout(100)
    page.evaluate("() => { cam.y += 777; scheduleRedraw(); }")   # и совсем без rememberView (жесты, клавиши)
    page.wait_for_timeout(100)
    want = view_center(page)
    page.close(run_before_unload=True)
    time.sleep(0.3)
    page = new_page(ctx, errors)
    boot(page)
    open_b(page, "bA")
    check("H: сдвиг камеры не человеком тоже запомнился", close_to(want, view_center(page)), f"{want} / {view_center(page)}")

    # ── I. окно другого размера ──
    want = view_center(page)
    back(page)
    page.set_viewport_size({"width": 900, "height": 700})
    page.wait_for_timeout(150)
    open_b(page, "bA")
    got = view_center(page)
    check("I: окно уже — посередине та же точка доски", close_to(want, got), f"{want} / {got}")
    page.set_viewport_size({"width": 1400, "height": 900})
    back(page)

    # ── J. переход с доски на доску ──
    page.evaluate("() => { const b = getDB().boards.find(x => x.id === 'bB'); delete b.view; const m = JSON.parse(localStorage.getItem('boardsViews') || '{}'); delete m.bB; localStorage.setItem('boardsViews', JSON.stringify(m)); }")
    open_b(page, "bA")
    a_cam = page.evaluate("() => [cam.x, cam.y]")
    back(page)
    open_b(page, "bB")
    b_cam = page.evaluate("() => [cam.x, cam.y]")
    bv = page.evaluate("() => getCurrentBoard().view || null")
    check("J: вторая доска открылась не на месте первой", not close_to(a_cam, b_cam, 5), f"{a_cam} / {b_cam}")
    check("J: в вид второй доски не попала камера первой",
          bv is None or not close_to([bv["x"], bv["y"]], a_cam, 5), str(bv))

    # ── K ──
    check("K: нет ошибок JavaScript", not errors, "; ".join(errors[:3]))
    ctx.close()


def main():
    with local_server(), sync_playwright() as p:
        browser = p.chromium.launch()
        try:
            run(browser)
        finally:
            browser.close()
    print()
    print("ВСЁ ПРОШЛО" if not fails else f"ПРОВАЛОВ: {len(fails)}")
    sys.exit(1 if fails else 0)


if __name__ == "__main__":
    main()
