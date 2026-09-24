"""
Промпт №69: доработки инструментов доски (boards.html / boards-core.js).

Проверяем:
  1. «Прямая с закреплённым центром»: рисуется протяжкой от центра, центр
     отмечен точкой; за конец — поворот вокруг центра без смены длины и
     центра; за центр — перенос целиком; клик мимо только что построенной
     сразу начинает следующую.
  2. Баг цветов ручки: новый цвет — одна новая ячейка в конце палитры, даже
     если пипетка прислала десяток промежуточных оттенков; остальные ячейки
     не меняются, рисование их не переставляет, повтор цвета не дублируется.
  3. Паттерны ручки: панель только у «Ручки», левее дока; кружок залит
     цветом, внутри толщина, у пунктира пунктирное кольцо; до пяти;
     добавить/применить/заменить/удалить; переживают перезагрузку.
  4. Вставка скопированного: в точку курсора (Ctrl+V), в точку клика (меню),
     курсор вне доски — центр видимой области; не рядом с исходником.
  5. «Прямоугольник» вместо «Четырёхугольника»: зажал-потянул-отпустил,
     прямые углы, угол тянется с сохранением прямых углов; старые
     четырёхугольники правятся по точке, как раньше; клик без протяжки — ничего.
  6. «Текст»: рамка с шириной и переносом строк, ручки ширины у готового
     текста и у поля ввода, подложка при вводе прозрачная и стоит ровно там,
     где потом рисуется текст (сравнение пикселей до и после «Подтвердить»).
  7. Протяжки работают и в заметках справочной панели; нет ошибок JavaScript.

Запуск: python3 test_prompt69_board_tools.py (сервер поднимается сам).
"""
import contextlib
import http.client
import json
import subprocess
import sys
import time

from playwright.sync_api import sync_playwright

PORT = 8990
BASE = f"http://127.0.0.1:{PORT}"


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

LITE = {
    "id": "bA", "name": "Урок", "folderId": None,
    "createdAt": 1000, "updatedAt": 1000, "lastOpenedAt": None, "rev": 1,
    "cellSize": 24, "sheetCols": 76, "sheetRows": 54, "pageOrder": "h",
    "recentColors": [], "colorUsage": {},
}

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


def open_board(ctx, objects=None, w=1400, h=900, errors=None):
    page = ctx.new_page()
    page.set_viewport_size({"width": w, "height": h})
    if errors is not None:
        page.on("pageerror", lambda e: errors.append(str(e)))
    page.route("https://**/*", lambda r: r.abort())
    page.goto(f"{BASE}/boards.html")
    page.evaluate(SEED_JS, [[LITE], {"bA": {"objects": objects or [], "imageLib": []}}])
    page.reload()
    page.evaluate(BOOT_JS)
    page.wait_for_function("() => window.getDB && window.getDB().boards.length >= 1")
    page.evaluate("() => window.openBoard('bA')")
    page.wait_for_function("() => window.getCurrentBoard() && Array.isArray(window.getCurrentBoard().objects)")
    page.wait_for_timeout(300)
    return page


def pick_tool(page, t):
    page.click(f'#bdDock .bd-tool[data-tool="{t}"]')
    page.wait_for_timeout(60)


def w2s(page, x, y):
    """мировая точка -> координаты окна (для мыши)"""
    return page.evaluate("""([x, y]) => { const r = canvas.getBoundingClientRect();
        return { x: r.left + (x - cam.x) * cam.zoom, y: r.top + (y - cam.y) * cam.zoom }; }""", [x, y])


def s2w(page, x, y):
    return page.evaluate("""([x, y]) => { const r = canvas.getBoundingClientRect();
        return screenToWorld(x - r.left, y - r.top); }""", [x, y])


def drag(page, a, b, steps=6):
    page.mouse.move(a[0], a[1])
    page.mouse.down()
    for i in range(1, steps + 1):
        page.mouse.move(a[0] + (b[0] - a[0]) * i / steps, a[1] + (b[1] - a[1]) * i / steps)
    page.mouse.up()
    page.wait_for_timeout(60)


def objs(page):
    return page.evaluate("() => JSON.parse(JSON.stringify(B.objects))")


def near(a, b, tol=0.75):
    return abs(a - b) <= tol


def ink_box(png_bytes, dark=110):
    """прямоугольник тёмных пикселей (текст) на снимке — [x0, y0, x1, y1]"""
    import io
    from PIL import Image
    im = Image.open(io.BytesIO(png_bytes)).convert("RGB")
    w, h = im.size
    px = im.load()
    xs, ys = [], []
    for y in range(h):
        for x in range(w):
            r, g, b = px[x, y]
            if (r + g + b) / 3 < dark:
                xs.append(x)
                ys.append(y)
    if not xs:
        return None
    return [min(xs), min(ys), max(xs), max(ys)]


def run():
    failures = []

    def check(name, cond, extra=""):
        print(f"[{'OK' if cond else 'FAIL'}] {name}" + (f"  ({extra})" if extra and not cond else ""))
        if not cond:
            failures.append(name)

    with local_server(), sync_playwright() as p:
        browser = p.chromium.launch()
        errors = []

        # ═══ 1. прямая с закреплённым центром ═════════════════════════════
        ctx = browser.new_context()
        page = open_board(ctx, errors=errors)
        page.evaluate("() => { curSnap = false; }")
        check("1. кнопка «Прямая с закреплённым центром» есть в доке",
              page.locator('#bdDock .bd-tool[data-tool="pivot"]').count() == 1)
        pick_tool(page, "pivot")
        check("1. у инструмента открыта панель цвета/толщины",
              page.evaluate("() => document.getElementById('bdOptbar').classList.contains('open')"))
        c = s2w(page, 600, 400)
        e = s2w(page, 700, 400)
        page.mouse.move(600, 400)
        page.mouse.down()
        page.mouse.move(650, 400)
        page.mouse.move(700, 400)
        mid_preview = page.evaluate("() => !!shapeDrag && B.objects.length === 0")
        check("1. во время протяжки — превью, объекта ещё нет", mid_preview)
        page.mouse.up()
        page.wait_for_timeout(80)
        o = objs(page)
        check("1. построена одна прямая с флагом pivot", len(o) == 1 and o[0]["type"] == "line" and o[0].get("pivot") is True)
        L = o[0]
        cx = (L["points"][0]["x"] + L["points"][1]["x"]) / 2
        cy = (L["points"][0]["y"] + L["points"][1]["y"]) / 2
        length0 = ((L["points"][0]["x"] - L["points"][1]["x"]) ** 2 + (L["points"][0]["y"] - L["points"][1]["y"]) ** 2) ** 0.5
        check("1. центр — там, где зажали", near(cx, c["x"]) and near(cy, c["y"]), f"{cx},{cy} vs {c}")
        check("1. конец — там, где отпустили, второй конец симметричен",
              near(L["points"][1]["x"], e["x"]) and near(L["points"][0]["x"], 2 * c["x"] - e["x"]))
        # отметка центра: на 2.6 px от линии поперёк у центра — чернила, у конца — фон
        page.wait_for_timeout(100)
        px = page.evaluate("""([x1, y1, x2, y2]) => {
            const r = canvas.getBoundingClientRect();
            const d = ctx.getImageData(Math.round((x1 - r.left) * dpr), Math.round((y1 - r.top) * dpr), 1, 1).data;
            const q = ctx.getImageData(Math.round((x2 - r.left) * dpr), Math.round((y2 - r.top) * dpr), 1, 1).data;
            return [Array.from(d), Array.from(q)]; }""", [600, 402.8, 680, 402.8])
        dark_center = sum(px[0][:3]) / 3 < 120
        light_far = sum(px[1][:3]) / 3 > 180
        check("1. центр отмечен точкой (толще линии), у конца линия тонкая", dark_center and light_far, str(px))
        check("1. сразу после построения прямая в фокусе (ручки видны)",
              page.evaluate("() => editLockId === B.objects[0].id && selectedId === B.objects[0].id"))
        handles = page.evaluate("() => getHandles(B.objects[0]).map(h => h.role)")
        check("1. ручки: центр и два конца", handles == ["pc", "p0", "p1"], str(handles))
        # поворот за конец: тянем правый конец вверх над центром
        drag(page, (700, 400), (600, 330))
        L2 = objs(page)[0]
        cx2 = (L2["points"][0]["x"] + L2["points"][1]["x"]) / 2
        cy2 = (L2["points"][0]["y"] + L2["points"][1]["y"]) / 2
        len2 = ((L2["points"][0]["x"] - L2["points"][1]["x"]) ** 2 + (L2["points"][0]["y"] - L2["points"][1]["y"]) ** 2) ** 0.5
        check("1. поворот за конец: центр на месте", near(cx2, cx, 0.01) and near(cy2, cy, 0.01))
        check("1. поворот за конец: длина та же", near(len2, length0, 0.01), f"{len2} vs {length0}")
        check("1. поворот за конец: прямая встала вертикально (конец над центром)",
              near(L2["points"][1]["x"], cx, 0.05) and L2["points"][1]["y"] < cy)
        # второй конец тоже поворачивает (тянем нижний конец вправо-вниз)
        p0s = w2s(page, L2["points"][0]["x"], L2["points"][0]["y"])
        drag(page, (p0s["x"], p0s["y"]), (700, 500))
        L3 = objs(page)[0]
        len3 = ((L3["points"][0]["x"] - L3["points"][1]["x"]) ** 2 + (L3["points"][0]["y"] - L3["points"][1]["y"]) ** 2) ** 0.5
        cx3 = (L3["points"][0]["x"] + L3["points"][1]["x"]) / 2
        check("1. поворот за другой конец: длина и центр те же", near(len3, length0, 0.01) and near(cx3, cx, 0.01))
        # перенос за центр
        drag(page, (600, 400), (650, 460))
        L4 = objs(page)[0]
        cx4 = (L4["points"][0]["x"] + L4["points"][1]["x"]) / 2
        cy4 = (L4["points"][0]["y"] + L4["points"][1]["y"]) / 2
        len4 = ((L4["points"][0]["x"] - L4["points"][1]["x"]) ** 2 + (L4["points"][0]["y"] - L4["points"][1]["y"]) ** 2) ** 0.5
        cexp = s2w(page, 650, 460)
        check("1. за центр — прямая переехала целиком, центр под курсором",
              near(cx4, cexp["x"]) and near(cy4, cexp["y"]) and near(len4, length0, 0.01))
        check("1. направление после переноса не изменилось",
              near(L4["points"][1]["x"] - L4["points"][0]["x"], L3["points"][1]["x"] - L3["points"][0]["x"], 0.01))
        # отмена возвращает до переноса
        page.keyboard.press("Control+z")
        page.wait_for_timeout(60)
        L5 = objs(page)[0]
        check("1. отмена возвращает положение до переноса",
              near((L5["points"][0]["x"] + L5["points"][1]["x"]) / 2, cx, 0.01))
        # клик мимо тем же инструментом — сразу новая прямая
        drag(page, (300, 650), (380, 700))
        o = objs(page)
        check("1. протяжка мимо построенной сразу рисует вторую", len(o) == 2 and o[1].get("pivot"))
        # старая обычная прямая осталась обычной: ручки концов свободные
        page.evaluate("""() => { B.objects.push({ id:'plain', type:'line', color:'--pencil', width:2, points:[{x:0,y:0},{x:100,y:0}] }); }""")
        page.evaluate("() => applyHandle(B.objects.find(o => o.id === 'plain'), 'p1', {x:100, y:50})")
        pl = page.evaluate("() => B.objects.find(o => o.id === 'plain').points")
        check("1. обычная прямая по-прежнему тянется за конец свободно (длина меняется)",
              near(pl[1]["y"], 50, 0.01) and near(pl[0]["x"], 0, 0.01))
        page.close()

        # ═══ 2. баг цветов ручки ══════════════════════════════════════════
        page = open_board(ctx, errors=errors)
        page.evaluate("() => { curSnap = false; }")
        base = page.evaluate("() => B.recentColors.slice()")
        check("2. исходная палитра — 5 цветов", len(base) == 5, str(base))
        # «+» открывает системную пипетку; в тесте её не открываем, а шлём
        # события сами — ровно как это делает поле выбора цвета при протяжке
        page.evaluate("() => { document.getElementById('bdColorInput').click = () => {}; }")
        pick_tool(page, "pen")
        page.click("#bdSwatchAdd")
        page.evaluate("""() => {
            const inp = document.getElementById('bdColorInput');
            ['#101010', '#402020', '#803030', '#b04040', '#d05030', '#e06020', '#f07010', '#ff8000', '#ff8800', '#ff9900'].forEach(h => {
              inp.value = h; inp.dispatchEvent(new Event('input', { bubbles: true }));
            });
            inp.dispatchEvent(new Event('change', { bubbles: true }));
        }""")
        pal = page.evaluate("() => B.recentColors.slice()")
        check("2. после выбора цвета — ровно одна новая ячейка", len(pal) == 6, str(pal))
        check("2. сохранённые ячейки не изменились", pal[:5] == base, str(pal))
        check("2. новая ячейка — итоговый цвет, в конце", pal[5] == "#ff9900")
        check("2. новый цвет выбран для ручки", page.evaluate("() => curColorTok") == "#ff9900")
        swatches = page.evaluate("() => Array.from(document.querySelectorAll('#bdSwatches .bd-swatch')).map(s => s.dataset.tok)")
        check("2. на панели 6 кружков в том же порядке", swatches == pal)
        # второй цвет — ещё одна ячейка, первые шесть на месте
        page.click("#bdSwatchAdd")
        page.evaluate("""() => { const inp = document.getElementById('bdColorInput');
            ['#00aa00', '#00bb11', '#00cc22'].forEach(h => { inp.value = h; inp.dispatchEvent(new Event('input', { bubbles: true })); });
            inp.dispatchEvent(new Event('change', { bubbles: true })); }""")
        pal2 = page.evaluate("() => B.recentColors.slice()")
        check("2. второй свой цвет — седьмая ячейка, первые шесть без изменений", pal2[:6] == pal and pal2[6] == "#00cc22" and len(pal2) == 7)
        # рисование первым цветом больше не переставляет палитру
        page.click('#bdSwatches .bd-swatch[data-tok="--pencil"]')
        drag(page, (500, 500), (560, 540))
        pal3 = page.evaluate("() => B.recentColors.slice()")
        check("2. штрих не переставляет и не режет палитру", pal3 == pal2, str(pal3))
        # повтор существующего цвета не плодит дубль
        page.click("#bdSwatchAdd")
        page.evaluate("""() => { const inp = document.getElementById('bdColorInput');
            inp.value = '#ff9900'; inp.dispatchEvent(new Event('input', { bubbles: true }));
            inp.dispatchEvent(new Event('change', { bubbles: true })); }""")
        pal4 = page.evaluate("() => B.recentColors.slice()")
        check("2. уже имеющийся цвет не дублируется", pal4 == pal2, str(pal4))
        # палитра до 12, дальше «+» выключен, а не вытесняет старые
        page.evaluate("""() => { const inp = document.getElementById('bdColorInput');
            for (let k = 0; k < 8; k++){ document.getElementById('bdSwatchAdd').click();
              inp.value = '#1234' + (10 + k); inp.dispatchEvent(new Event('input', { bubbles: true }));
              inp.dispatchEvent(new Event('change', { bubbles: true })); } }""")
        pal5 = page.evaluate("() => B.recentColors.slice()")
        check("2. палитра упирается в 12 ячеек, ранние не вытеснены", len(pal5) == 12 and pal5[:7] == pal2, str(len(pal5)))
        check("2. на полной палитре «+» выключен",
              page.evaluate("() => document.getElementById('bdSwatchAdd').disabled"))
        page.evaluate("() => { const all = document.querySelectorAll('#bdSwatches .bd-swatch-x'); all[all.length - 1].click(); }")
        check("2. после удаления ячейки «+» снова доступен",
              not page.evaluate("() => document.getElementById('bdSwatchAdd').disabled"))
        # палитра сохранилась в доске
        page.wait_for_timeout(600)
        page.close()
        page = open_board(ctx, errors=errors)
        # open_board заново засевает базу — проверяем сохранение внутри одной загрузки ниже
        page.close()

        # ═══ 3. паттерны ручки ════════════════════════════════════════════
        page = open_board(ctx, errors=errors)
        page.evaluate("() => { curSnap = false; localStorage.removeItem('boardsPenPatterns'); penPatterns = []; renderPatterns(); }")
        pick_tool(page, "pen")
        vis = page.evaluate("""() => { const el = document.getElementById('bdPatterns');
            const r = el.getBoundingClientRect(), d = document.getElementById('bdDock').getBoundingClientRect();
            return { shown: getComputedStyle(el).display !== 'none', right: r.right, dockLeft: d.left,
                     midY: r.top + r.height / 2, dockMid: d.top + d.height / 2 }; }""")
        check("3. у «Ручки» панель паттернов видна", vis["shown"])
        check("3. панель левее основной панели инструментов, на её высоте",
              vis["right"] <= vis["dockLeft"] - 4 and abs(vis["midY"] - vis["dockMid"]) < 3, str(vis))
        pick_tool(page, "line")
        check("3. у другого инструмента панели паттернов нет",
              page.evaluate("() => getComputedStyle(document.getElementById('bdPatterns')).display === 'none'"))
        pick_tool(page, "pen")
        page.click("#bdPatternAdd")
        page.click('#bdSwatches .bd-swatch[data-tok="--ink"]')
        for _ in range(4):
            page.click("#widthPlus")
        page.click("#toggleDash")
        page.click("#bdPatternAdd")
        pats = page.evaluate("() => JSON.parse(JSON.stringify(penPatterns))")
        check("3. сохранены два паттерна с цветом, толщиной и типом линии",
              pats == [{"color": "--pencil", "width": 2, "dash": False}, {"color": "--ink", "width": 6, "dash": True}], str(pats))
        look = page.evaluate("""() => Array.from(document.querySelectorAll('#bdPatternList .bd-pattern')).map(b => {
            const dot = b.querySelector('.bd-pattern-dot'); const cs = getComputedStyle(dot);
            const num = b.querySelector('.bd-pattern-num') || dot;
            return { text: num.textContent.trim(), dashed: dot.classList.contains('dashed'),
                     border: cs.borderTopStyle, borderColor: cs.borderTopColor,
                     fill: getComputedStyle(num).backgroundColor, active: b.classList.contains('active') }; })""")
        ink = page.evaluate("() => { const d = document.createElement('div'); d.style.color = resolveColor('--ink'); document.body.appendChild(d); const c = getComputedStyle(d).color; d.remove(); return c; }")
        pencil = page.evaluate("() => { const d = document.createElement('div'); d.style.color = resolveColor('--pencil'); document.body.appendChild(d); const c = getComputedStyle(d).color; d.remove(); return c; }")
        check("3. кружок залит цветом паттерна, внутри толщина",
              look[0]["text"] == "2" and look[0]["fill"] == pencil and look[1]["text"] == "6" and look[1]["fill"] == ink, str(look))
        check("3. пунктирный паттерн обведён пунктиром того же цвета, сплошной — нет",
              look[1]["dashed"] and look[1]["border"] == "dashed" and look[1]["borderColor"] == ink and not look[0]["dashed"])
        check("3. активен паттерн, совпадающий с текущей ручкой", look[1]["active"] and not look[0]["active"])
        page.click('#bdPatternList .bd-pattern[data-i="0"]')
        st = page.evaluate("() => ({ c: curColorTok, w: curWidth, d: curDash, wv: document.getElementById('widthVal').textContent, dashOn: document.getElementById('toggleDash').classList.contains('on') })")
        check("3. нажатие на паттерн сразу применяет цвет, толщину и тип линии",
              st == {"c": "--pencil", "w": 2, "d": False, "wv": "2", "dashOn": False}, str(st))
        page.click('#bdPatternList .bd-pattern[data-i="1"]')
        drag(page, (500, 300), (600, 360))
        stroke = objs(page)[-1]
        check("3. штрих рисуется настройками паттерна",
              stroke["type"] == "pen" and stroke["color"] == "--ink" and stroke["width"] == 6 and stroke["dash"] is True)
        # заменить: текущие настройки (толщина 9) в паттерн №1
        for _ in range(3):
            page.click("#widthPlus")
        page.hover('#bdPatternList .bd-pattern[data-i="0"]')
        page.click('#bdPatternList .bd-pattern[data-i="0"] .bd-pattern-re')
        pats = page.evaluate("() => JSON.parse(JSON.stringify(penPatterns))")
        check("3. «заменить» кладёт текущие настройки в тот же паттерн",
              pats[0] == {"color": "--ink", "width": 9, "dash": True} and len(pats) == 2, str(pats))
        for _ in range(5):
            page.click("#widthMinus")
            if page.evaluate("() => document.getElementById('bdPatternAdd').style.display !== 'none'"):
                page.click("#bdPatternAdd")
        n = page.evaluate("() => penPatterns.length")
        check("3. паттернов не больше пяти, «+» пропадает", n == 5 and page.evaluate("() => document.getElementById('bdPatternAdd').style.display === 'none'"))
        page.hover('#bdPatternList .bd-pattern[data-i="1"]')
        page.click('#bdPatternList .bd-pattern[data-i="1"] .bd-pattern-x')
        check("3. удаление паттерна", page.evaluate("() => penPatterns.length") == 4
              and page.evaluate("() => document.getElementById('bdPatternAdd').style.display !== 'none'"))
        saved = page.evaluate("() => JSON.parse(localStorage.getItem('boardsPenPatterns'))")
        page.reload()
        page.evaluate(BOOT_JS)
        page.wait_for_function("() => window.getDB && window.getDB().boards.length >= 1")
        page.evaluate("() => window.openBoard('bA')")
        page.wait_for_function("() => window.getCurrentBoard() && Array.isArray(window.getCurrentBoard().objects)")
        page.wait_for_timeout(200)
        pick_tool(page, "pen")
        after = page.evaluate("() => JSON.parse(JSON.stringify(penPatterns))")
        check("3. паттерны переживают перезагрузку", after == saved and len(after) == 4)
        # док сбоку — панель над доком, в пределах экрана и не поверх дока
        page.evaluate("() => { dockPos = 'left'; applyDockLayout(); }")
        page.wait_for_timeout(50)
        box = page.evaluate("""() => { const r = document.getElementById('bdPatterns').getBoundingClientRect(), d = document.getElementById('bdDock').getBoundingClientRect();
            const o = document.getElementById('bdOptbar').getBoundingClientRect();
            const ovOpt = !(r.right <= o.left || r.left >= o.right || r.bottom <= o.top || r.top >= o.bottom);
            return { r: [r.left, r.top, r.right, r.bottom], d: [d.left, d.top, d.right, d.bottom], ovOpt, vertical: document.getElementById('bdPatterns').classList.contains('vertical') }; }""")
        overlap = not (box["r"][2] <= box["d"][0] or box["r"][0] >= box["d"][2] or box["r"][3] <= box["d"][1] or box["r"][1] >= box["d"][3])
        check("3. док слева во всю высоту — панель паттернов столбиком рядом, ни на что не наезжает",
              box["vertical"] and not overlap and not box["ovOpt"] and box["r"][1] >= 0, str(box))
        page.evaluate("() => { dockPos = 'bottom'; applyDockLayout(); }")
        page.close()

        # узкий экран: слева от дока места нет — панель над доком, в экране
        page = open_board(ctx, w=560, h=800, errors=errors)
        pick_tool(page, "pen")
        page.evaluate("() => { penPatterns = [{color:'--ink',width:3,dash:false},{color:'--teacher',width:5,dash:true}]; renderPatterns(); }")
        box = page.evaluate("""() => { const r = document.getElementById('bdPatterns').getBoundingClientRect(), d = document.getElementById('bdDock').getBoundingClientRect(), o = document.getElementById('bdOptbar').getBoundingClientRect();
            return { r: [r.left, r.top, r.right, r.bottom], d: [d.left, d.top, d.right, d.bottom], o: [o.left, o.top, o.right, o.bottom], W: innerWidth }; }""")
        def ov(a, b):
            return not (a[2] <= b[0] or a[0] >= b[2] or a[3] <= b[1] or a[1] >= b[3])
        check("3. узкий экран: панель паттернов в пределах экрана, не на доке и не на панели цвета",
              box["r"][0] >= 0 and box["r"][2] <= box["W"] and not ov(box["r"], box["d"]) and not ov(box["r"], box["o"]), str(box))
        page.close()

        # ═══ 4. вставка скопированного ════════════════════════════════════
        page = open_board(ctx, errors=errors)
        page.evaluate("() => { curSnap = false; }")
        # исходник — на экране (камера открытой доски стоит на среднем листе)
        o0 = s2w(page, 300, 300)
        X0, Y0 = o0["x"], o0["y"]
        page.evaluate("""([x, y]) => { B.objects.push({ id:'src', type:'pen', color:'--pencil', width:2,
            points:[{x:x,y:y},{x:x+60,y:y+30}] }); scheduleRedraw(); }""", [X0, Y0])
        pick_tool(page, "select")
        a = w2s(page, X0 + 30, Y0 + 15)
        page.mouse.click(a["x"], a["y"])
        page.wait_for_timeout(60)
        check("4. исходник выделен", page.evaluate("() => selectedId") == "src")
        page.keyboard.press("Control+c")
        page.wait_for_timeout(100)
        # уходим в другую часть доски
        page.evaluate("() => { cam.x += 3000; cam.y += 1500; scheduleRedraw(); }")
        page.wait_for_timeout(80)

        def center_of_new(before_ids):
            cur = objs(page)
            new = [o for o in cur if o["id"] not in before_ids]
            if len(new) != 1:
                return None
            xs = [p["x"] for p in new[0]["points"]]
            ys = [p["y"] for p in new[0]["points"]]
            return ((min(xs) + max(xs)) / 2, (min(ys) + max(ys)) / 2)

        ids = {o["id"] for o in objs(page)}
        page.mouse.move(900, 520)
        page.mouse.move(905, 525)
        page.keyboard.press("Control+v")
        page.wait_for_timeout(150)
        got = center_of_new(ids)
        if got is None:
            # на случай, если системная вставка в безголовом браузере не шлёт
            # событие 'paste', шлём его сами — обработчик тот же
            page.evaluate("() => document.dispatchEvent(new ClipboardEvent('paste', { bubbles: true }))")
            page.wait_for_timeout(100)
            got = center_of_new(ids)
        exp = s2w(page, 905, 525)
        check("4. Ctrl+V — копия в точке курсора, а не у исходника",
              got is not None and near(got[0], exp["x"], 0.6) and near(got[1], exp["y"], 0.6), f"{got} vs {exp}")
        # курсор ушёл с доски на док — в центр видимой области
        ids = {o["id"] for o in objs(page)}
        dock = page.evaluate("() => { const r = document.getElementById('bdDock').getBoundingClientRect(); return { x: r.left + 30, y: r.top + r.height / 2 }; }")
        page.mouse.move(dock["x"], dock["y"])
        page.wait_for_timeout(50)
        page.evaluate("() => document.dispatchEvent(new ClipboardEvent('paste', { bubbles: true }))")
        page.wait_for_timeout(100)
        got = center_of_new(ids)
        vc = page.evaluate("() => { const v = visibleBoardRect(); return { x: v.x + v.w / 2, y: v.y + v.h / 2 }; }")
        check("4. курсор вне доски — вставка в центр видимой области",
              got is not None and near(got[0], vc["x"], 0.6) and near(got[1], vc["y"], 0.6), f"{got} vs {vc}")
        # курсор покинул окно — тоже центр
        ids = {o["id"] for o in objs(page)}
        page.mouse.move(700, 450)
        page.evaluate("() => canvas.dispatchEvent(new PointerEvent('pointerleave'))")
        page.evaluate("() => document.dispatchEvent(new ClipboardEvent('paste', { bubbles: true }))")
        page.wait_for_timeout(80)
        got = center_of_new(ids)
        check("4. курсор ушёл из окна — центр видимой области",
              got is not None and near(got[0], vc["x"], 0.6) and near(got[1], vc["y"], 0.6))
        # меню выделения: «Вставить» кладёт в точку клика
        ids = {o["id"] for o in objs(page)}
        page.wait_for_function("() => document.getElementById('bdCtxMenu').classList.contains('open')")
        btn = page.evaluate("() => { const r = document.querySelector('#bdCtxMenu [data-act=\"paste\"]').getBoundingClientRect(); return { x: r.left + 20, y: r.top + r.height / 2 }; }")
        page.mouse.click(btn["x"], btn["y"])
        page.wait_for_timeout(100)
        got = center_of_new(ids)
        exp = s2w(page, btn["x"], btn["y"])
        check("4. «Вставить» из меню — в точку клика",
              got is not None and near(got[0], exp["x"], 0.6) and near(got[1], exp["y"], 0.6), f"{got} vs {exp}")
        # кнопка «Вставить» слева — центр видимой области
        ids = {o["id"] for o in objs(page)}
        page.evaluate("() => document.getElementById('railPaste').click()")
        page.wait_for_timeout(80)
        got = center_of_new(ids)
        check("4. кнопка «Вставить» в левой колонке — центр видимой области",
              got is not None and near(got[0], vc["x"], 0.6) and near(got[1], vc["y"], 0.6))
        # вставка там же, где исходник (курсор прямо на нём) — сдвиг, чтобы копию было видно
        page.evaluate("() => { cam.x -= 3000; cam.y -= 1500; scheduleRedraw(); }")
        page.wait_for_timeout(60)
        ids = {o["id"] for o in objs(page)}
        s = w2s(page, X0 + 30, Y0 + 15)
        page.mouse.move(s["x"], s["y"])
        page.evaluate("() => document.dispatchEvent(new ClipboardEvent('paste', { bubbles: true }))")
        page.wait_for_timeout(80)
        got = center_of_new(ids)
        check("4. вставка точно поверх исходника сдвигается на полклетки",
              got is not None and near(got[0], X0 + 42) and near(got[1], Y0 + 27))
        n_before = len(objs(page))
        page.keyboard.press("Control+z")
        page.wait_for_timeout(60)
        check("4. вставка отменяется одним шагом", len(objs(page)) == n_before - 1)
        page.close()

        # ═══ 5. прямоугольник ═════════════════════════════════════════════
        old_quad = {"id": "oq", "type": "quad", "color": "--pencil", "width": 2,
                    "points": [{"x": 1000, "y": 1000}, {"x": 1100, "y": 1010}, {"x": 1120, "y": 1090}, {"x": 990, "y": 1080}]}
        page = open_board(ctx, objects=[old_quad], errors=errors)
        page.evaluate("() => { curSnap = false; }")
        title = page.get_attribute('#bdDock .bd-tool[data-tool="quad"]', "title")
        check("5. кнопка называется «Прямоугольник»", title.startswith("Прямоугольник") and "Четырёх" not in title, title)
        page.keyboard.press("7")
        check("5. клавиша 7 выбирает прямоугольник", page.evaluate("() => tool") == "quad")
        a = s2w(page, 400, 300)
        b = s2w(page, 520, 390)
        page.mouse.move(400, 300)
        page.mouse.down()
        page.mouse.move(460, 340)
        live = page.evaluate("() => shapeDrag && [shapeDrag.a, shapeDrag.b]")
        check("5. во время протяжки прямоугольник тянется за курсором", live is not None and near(live[1]["x"], s2w(page, 460, 340)["x"]))
        page.mouse.move(520, 390)
        page.mouse.up()
        page.wait_for_timeout(60)
        o = [x for x in objs(page) if x["id"] != "oq"]
        R = o[0] if o else None
        ok = R is not None and R["type"] == "quad" and R.get("rect") is True
        check("5. отпустили — прямоугольник зафиксирован", ok)
        if ok:
            P = R["points"]
            check("5. углы: начальная точка и точка отпускания противоположные",
                  near(P[0]["x"], a["x"]) and near(P[0]["y"], a["y"]) and near(P[2]["x"], b["x"]) and near(P[2]["y"], b["y"]))
            check("5. стороны параллельны осям (углы прямые)",
                  near(P[1]["x"], b["x"]) and near(P[1]["y"], a["y"]) and near(P[3]["x"], a["x"]) and near(P[3]["y"], b["y"]))
            # тянем угол — прямые углы сохраняются, противоположный угол на месте
            drag(page, (520, 390), (600, 440))
            P2 = [x for x in objs(page) if x["id"] == R["id"]][0]["points"]
            c2 = s2w(page, 600, 440)
            check("5. угол тянется, противоположный неподвижен",
                  near(P2[2]["x"], c2["x"]) and near(P2[2]["y"], c2["y"]) and near(P2[0]["x"], a["x"]) and near(P2[0]["y"], a["y"]))
            check("5. после правки углы по-прежнему прямые",
                  near(P2[1]["x"], P2[2]["x"], 0.01) and near(P2[1]["y"], P2[0]["y"], 0.01) and near(P2[3]["x"], P2[0]["x"], 0.01) and near(P2[3]["y"], P2[2]["y"], 0.01))
            # нечётный угол (правый верхний)
            s1 = w2s(page, P2[1]["x"], P2[1]["y"])
            drag(page, (s1["x"], s1["y"]), (s1["x"] + 30, s1["y"] - 25))
            P3 = [x for x in objs(page) if x["id"] == R["id"]][0]["points"]
            check("5. правый верхний угол тоже держит прямые углы, левый нижний на месте",
                  near(P3[3]["x"], P2[3]["x"], 0.01) and near(P3[3]["y"], P2[3]["y"], 0.01)
                  and near(P3[0]["y"], P3[1]["y"], 0.01) and near(P3[1]["x"], P3[2]["x"], 0.01)
                  and near(P3[2]["y"], P3[3]["y"], 0.01) and near(P3[3]["x"], P3[0]["x"], 0.01))
        # клик без протяжки — ничего
        n0 = len(objs(page))
        page.mouse.click(300, 650)
        page.wait_for_timeout(60)
        check("5. клик без протяжки прямоугольник не создаёт", len(objs(page)) == n0)
        # вторая протяжка мимо — второй прямоугольник
        drag(page, (250, 600), (330, 680))
        check("5. следующая протяжка сразу рисует новый прямоугольник", len(objs(page)) == n0 + 1)
        # с прилипанием к клеткам углы в узлах сетки
        page.evaluate("() => { curSnap = true; }")
        drag(page, (703, 507), (791, 598))
        R2 = objs(page)[-1]
        check("5. с прилипанием углы в узлах сетки",
              all(abs(p["x"] / 24 - round(p["x"] / 24)) < 1e-6 and abs(p["y"] / 24 - round(p["y"] / 24)) < 1e-6 for p in R2["points"]))
        # старый четырёхугольник (без флага) по-прежнему правится по точке
        page.evaluate("() => applyHandle(B.objects.find(o => o.id === 'oq'), 'pt2', {x:1150, y:1150})")
        oq = page.evaluate("() => B.objects.find(o => o.id === 'oq').points")
        check("5. старый четырёхугольник: тянется одна точка, остальные на месте",
              oq[2] == {"x": 1152, "y": 1152} and oq[1] == {"x": 1100, "y": 1010} and oq[3] == {"x": 990, "y": 1080}, str(oq))
        page.close()

        # ═══ 6. текст ═════════════════════════════════════════════════════
        old_text = {"id": "ot", "type": "text", "color": "--pencil", "fontSize": 22,
                    "points": [{"x": 3000, "y": 3000}], "content": "старый текст без рамки, длинная строка без переносов вообще",
                    "w": 10, "h": 20}
        page = open_board(ctx, objects=[old_text], errors=errors)
        page.evaluate("() => { curSnap = false; document.documentElement.setAttribute('data-theme', 'light'); }")
        lay = page.evaluate("() => { const o = B.objects[0]; measureTextObj(o); return { n: textLayout(o).lines.length, box: o.boxW || null }; }")
        check("6. старый текст без рамки не переносится", lay["n"] == 1 and lay["box"] is None)
        pick_tool(page, "text")
        page.mouse.click(400, 300)
        page.wait_for_selector(".bd-text-editor textarea")
        page.wait_for_timeout(60)
        styles = page.evaluate("""() => { const w = document.querySelector('.bd-text-editor'), t = w.querySelector('textarea');
            return { wrapBg: getComputedStyle(w).backgroundColor, taBg: getComputedStyle(t).backgroundColor,
                     wrapBorder: getComputedStyle(w).borderTopWidth, taPad: getComputedStyle(t).paddingTop }; }""")
        check("6. подложка поля ввода прозрачная", styles["wrapBg"] == "rgba(0, 0, 0, 0)" and styles["taBg"] == "rgba(0, 0, 0, 0)", str(styles))
        box = page.evaluate("() => textEditSession.boxW")
        vis_right = page.evaluate("() => { const v = visibleBoardRect(); return v.x + v.w; }")
        pt = s2w(page, 400, 300)
        check("6. новый текст сразу с рамкой, не шире видимой области", box and pt["x"] + box <= vis_right + 0.5, f"{box}")
        # поле стоит там же, где потом будет текст: сравниваем пиксели
        page.keyboard.type("Нужен Hxy")
        page.wait_for_timeout(80)
        ta = page.evaluate("() => { const r = document.querySelector('.bd-text-editor textarea').getBoundingClientRect(); return [r.left, r.top, r.width, r.height]; }")
        clip = {"x": ta[0] - 10, "y": ta[1] - 3, "width": 240, "height": ta[3] + 6}
        page.evaluate("() => { document.querySelector('.bd-text-editor').style.outline = 'none'; document.querySelectorAll('.bd-text-grip,.bd-text-editor-btns').forEach(e => e.style.visibility = 'hidden'); document.querySelector('.bd-text-editor textarea').style.caretColor = 'transparent'; }")
        shot_edit = page.screenshot(clip=clip)
        page.evaluate("() => document.querySelector('.bd-text-editor .bd-text-editor-ok').click()")
        page.wait_for_timeout(120)
        page.evaluate("() => { selectedId = null; clearEditLock(); scheduleRedraw(); }")
        page.wait_for_timeout(120)
        shot_done = page.screenshot(clip=clip)
        b1, b2 = ink_box(shot_edit), ink_box(shot_done)
        check("6. текст при вводе и после «Подтвердить» стоит в одном месте (±1.5 px)",
              b1 and b2 and all(abs(b1[i] - b2[i]) <= 1.5 for i in range(4)), f"{b1} vs {b2}")
        t = objs(page)[-1]
        check("6. у текста сохранена рамка boxW", t["type"] == "text" and abs(t.get("boxW", 0) - box) < 0.01)
        # рамку сужаем за правый край в поле ввода — текст переносится
        long_txt = "раз два три четыре пять шесть семь восемь девять десять"
        page.mouse.click(400, 500)
        page.wait_for_selector(".bd-text-editor textarea")
        page.keyboard.type(long_txt)
        page.wait_for_timeout(60)
        h1 = page.evaluate("() => document.querySelector('.bd-text-editor textarea').offsetHeight")
        g = page.evaluate("() => { const r = document.querySelector('.bd-text-grip.e').getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; }")
        ta_r = page.evaluate("() => { const r = document.querySelector('.bd-text-editor textarea').getBoundingClientRect(); return [r.left, r.right]; }")
        # сдвигаем ручку ровно на столько, чтобы правый край поля встал на left + 160
        drag(page, (g["x"], g["y"]), (g["x"] + (ta_r[0] + 160 - ta_r[1]), g["y"]), steps=10)
        st = page.evaluate("""() => { const t = document.querySelector('.bd-text-editor textarea');
            return { open: !!textEditSession, focused: document.activeElement === t, w: t.offsetWidth, h: t.offsetHeight,
                     lh: parseFloat(getComputedStyle(t).lineHeight), boxW: textEditSession && textEditSession.boxW }; }""")
        check("6. рамка тянется за край, редактор не закрылся и держит фокус", st["open"] and st["focused"], str(st))
        check("6. поле стало уже, текст перенёсся на новые строки", abs(st["w"] - 160) <= 2 and st["h"] > h1 * 2, str(st))
        lines_editor = round(st["h"] / st["lh"])
        page.evaluate("() => document.querySelector('.bd-text-editor .bd-text-editor-ok').click()")
        page.wait_for_timeout(80)
        t = page.evaluate("() => { const o = B.objects[B.objects.length - 1]; const l = textLayout(o); textMeasureCtx.font = textFontCss(o, o.fontSize || 22); return { boxW: o.boxW, h: o.h, fs: o.fontSize, lines: l.lines, widths: l.lines.map(x => textMeasureCtx.measureText(x).width) }; }")
        check("6. на доске столько же строк, сколько было в поле ввода", len(t["lines"]) == lines_editor, f"{t['lines']} vs {lines_editor}")
        check("6. ни одна строка не вылезает за рамку", all(w <= t["boxW"] + 0.01 for w in t["widths"]))
        check("6. текст целиком сохранился (перенос только на экране)", " ".join(t["lines"]) == long_txt)
        check("6. высота объекта = строки × межстрочный", abs(t["h"] - len(t["lines"]) * t["fs"] * 1.25) < 0.01)
        # готовый текст: ручки ширины у выделения
        pick_tool(page, "select")
        tid = page.evaluate("() => B.objects[B.objects.length - 1].id")
        page.evaluate("(id) => { selectedId = id; scheduleRedraw(); }", tid)
        hs = page.evaluate("(id) => getHandles(B.objects.find(o => o.id === id)).map(h => h.role)", tid)
        check("6. у выделенного текста ручки краёв рамки", hs == ["tw", "te"])
        te = page.evaluate("(id) => { const o = B.objects.find(x => x.id === id); const h = getHandles(o)[1]; const r = canvas.getBoundingClientRect(); return { x: r.left + (h.x - cam.x) * cam.zoom, y: r.top + (h.y - cam.y) * cam.zoom }; }", tid)
        drag(page, (te["x"], te["y"]), (te["x"] + 200, te["y"]))
        t2 = page.evaluate("(id) => { const o = B.objects.find(x => x.id === id); return { boxW: o.boxW, n: textLayout(o).lines.length }; }", tid)
        check("6. растянули рамку готового текста — строк стало меньше", t2["n"] < len(t["lines"]) and t2["boxW"] > t["boxW"] + 150, str(t2))
        page.keyboard.press("Control+z")
        page.wait_for_timeout(60)
        t3 = page.evaluate("(id) => { const o = B.objects.find(x => x.id === id); return { boxW: o.boxW, n: textLayout(o).lines.length }; }", tid)
        check("6. отмена возвращает прежнюю рамку", abs(t3["boxW"] - t["boxW"]) < 0.01 and t3["n"] == len(t["lines"]))
        # левая ручка: правый край неподвижен
        p0 = page.evaluate("(id) => { const o = B.objects.find(x => x.id === id); return { x: o.points[0].x, right: o.points[0].x + o.boxW }; }", tid)
        page.evaluate("(id) => { const o = B.objects.find(x => x.id === id); applyHandle(o, 'tw', { x: o.points[0].x + 30, y: o.points[0].y }); }", tid)
        p1 = page.evaluate("(id) => { const o = B.objects.find(x => x.id === id); return { x: o.points[0].x, right: o.points[0].x + o.boxW }; }", tid)
        check("6. левый край рамки: начало сдвигается, правый край на месте",
              abs(p1["x"] - p0["x"] - 30) < 0.8 and abs(p1["right"] - p0["right"]) < 0.8, f"{p0} {p1}")
        # левая ручка в поле ввода двигает начало текста
        pick_tool(page, "text")
        s = w2s(page, p1["x"] + 5, page.evaluate("(id) => B.objects.find(x => x.id === id).points[0].y", tid) + 5)
        page.mouse.click(s["x"], s["y"])
        page.wait_for_selector(".bd-text-editor textarea")
        gw = page.evaluate("() => { const r = document.querySelector('.bd-text-grip.w').getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; }")
        drag(page, (gw["x"], gw["y"]), (gw["x"] - 40, gw["y"]))
        page.evaluate("() => document.querySelector('.bd-text-editor .bd-text-editor-ok').click()")
        page.wait_for_timeout(80)
        p2 = page.evaluate("(id) => { const o = B.objects.find(x => x.id === id); return { x: o.points[0].x, right: o.points[0].x + o.boxW }; }", tid)
        check("6. левая ручка поля ввода двигает начало текста, правый край на месте",
              p2["x"] < p1["x"] - 30 and abs(p2["right"] - p1["right"]) < 0.8, f"{p1} {p2}")
        page.keyboard.press("Control+z")
        page.wait_for_timeout(60)
        p3 = page.evaluate("(id) => B.objects.find(x => x.id === id).points[0].x", tid)
        check("6. и это отменяется", abs(p3 - p1["x"]) < 0.01)
        # масштаб: поле ввода следует за текстом и на другом зуме
        page.evaluate("() => { setZoom(1.6, cam.x, cam.y, 0, 0); }")
        page.wait_for_timeout(100)
        page.mouse.click(700, 250)
        page.wait_for_selector(".bd-text-editor textarea")
        page.keyboard.type("Hxy масштаб")
        page.wait_for_timeout(60)
        ta = page.evaluate("() => { const r = document.querySelector('.bd-text-editor textarea').getBoundingClientRect(); return [r.left, r.top, r.width, r.height]; }")
        clip = {"x": ta[0] - 10, "y": ta[1] - 4, "width": 320, "height": ta[3] + 8}
        page.evaluate("() => { document.querySelector('.bd-text-editor').style.outline = 'none'; document.querySelectorAll('.bd-text-grip,.bd-text-editor-btns').forEach(e => e.style.visibility = 'hidden'); document.querySelector('.bd-text-editor textarea').style.caretColor = 'transparent'; }")
        s1 = page.screenshot(clip=clip)
        page.evaluate("() => document.querySelector('.bd-text-editor .bd-text-editor-ok').click()")
        page.wait_for_timeout(100)
        page.evaluate("() => { selectedId = null; clearEditLock(); scheduleRedraw(); }")
        page.wait_for_timeout(100)
        s2 = page.screenshot(clip=clip)
        b1, b2 = ink_box(s1), ink_box(s2)
        check("6. и на масштабе 160% поле стоит там же, где текст (±2 px)",
              b1 and b2 and all(abs(b1[i] - b2[i]) <= 2 for i in range(4)), f"{b1} vs {b2}")
        page.close()

        # ═══ 7. заметки справочной панели ═════════════════════════════════
        page = open_board(ctx, errors=errors)
        page.evaluate("() => { curSnap = false; document.getElementById('bdRefToggle').click(); }")
        page.wait_for_timeout(150)
        page.evaluate("() => { B.refPanel.mode = 'text'; B.refPanel.textMode = 'draw'; applyRefPanel(); rfResizeCanvas(); rfScheduleRedraw(); }")
        page.wait_for_timeout(150)
        r = page.evaluate("() => { const r = document.getElementById('bdRefDrawCanvas').getBoundingClientRect(); return [r.left, r.top, r.width, r.height]; }")
        if r[2] > 80 and r[3] > 80:
            pick_tool(page, "quad")
            drag(page, (r[0] + 20, r[1] + 20), (r[0] + 70, r[1] + 60))
            rq = page.evaluate("() => rfObjects().filter(o => o.type === 'quad' && o.rect).length")
            pick_tool(page, "pivot")
            drag(page, (r[0] + 40, r[1] + 70), (r[0] + 70, r[1] + 75))
            rp = page.evaluate("() => rfObjects().filter(o => o.type === 'line' && o.pivot).length")
            check("7. в заметках прямоугольник и прямая с центром рисуются протяжкой", rq == 1 and rp == 1, f"{rq} {rp}")
        else:
            check("7. холст заметок открылся", False, str(r))
        page.close()

        check("8. нет ошибок JavaScript", not errors, "; ".join(errors[:3]))
        browser.close()

    print()
    if failures:
        print(f"ИТОГ: не прошло {len(failures)}")
        for f in failures:
            print("  -", f)
        sys.exit(1)
    print("ИТОГ: всё прошло")


if __name__ == "__main__":
    run()
