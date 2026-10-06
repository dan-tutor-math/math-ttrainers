"""
Промпт №20 (новый список): доски — точный масштаб с клавиатуры и бегунок.

Двойное нажатие на проценты в левой колонке (рейле) открывает рядом панель с
бегунком, а проценты становятся полем ввода: число + Enter. Бегунок меняет
масштаб плавно, вокруг середины видимой части доски. Проценты и бегунок всегда
показывают одно и то же. Закрывается Escape, щелчком мимо и повторным двойным
нажатием. «+/−» работают как раньше, одиночный щелчок по процентам — как
раньше сброс на 100 %.

Проверяем:
  A. Двойной щелчок мышью: панель открыта, вместо кнопки поле с теми же
     процентами, курсор в поле; масштаб при этом НЕ сбросился на 100 %.
  B. Ввод 150 + Enter → 150 %, бегунок встал на 150 %, середина доски на месте.
  C. За пределами: 1000 → 400 %, 3 → 10 %; «87,5» и «120 %» понимаются;
     «абв» не меняет масштаб и возвращает в поле текущие проценты.
  D. Бегунок вертикальный, синий (цвет доски --ink) на белом. Мышью снизу
     вверх: масштаб растёт плавно на каждом шаге, проценты в поле и бегунок
     совпадают на каждом шаге, середина доски не уезжает; щелчок в точку
     полосы, магнит у 100 %, стрелки и Home с клавиатуры.
  E. «+/−» при открытой панели: шаг прежний (×1,25), панель не закрылась,
     поле и бегунок пошли следом; недонабранное число «+» отменяет.
  F. Закрытие: Escape (и выделение на доске Escape при этом не снимает),
     щелчок по доске, повторный двойной щелчок по полю. После закрытия на
     месте поля снова кнопка с верными процентами.
  G. Одиночный щелчок по процентам — прежний сброс на 100 % (после паузы).
  H. Цифры, набранные в поле, не переключают инструменты доски.
  I. Где панель: рейл слева — справа от рейла на уровне процентов; рейл в
     верхней панели (док слева) — под ним; панель целиком в окне.
  J. Планшет (касания): двойной тап открывает, клавиатура сама не лезет
     (поле не в фокусе), бегунок тянется пальцем, масштаб в реальном времени.
  K. Телефон: двойной тап открывает, панель целиком в узком окне, ввод числа
     и тап по доске — число применилось, панель закрылась. Страница при
     двойном тапе не увеличилась.
  L. Нет ошибок JavaScript.

Запуск: python3 test_prompt20_board_zoom_slider.py (сервер поднимается сам).
"""
import contextlib
import http.client
import math
import subprocess
import sys
import time

from playwright.sync_api import sync_playwright

PORT = 9120
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


def lite(bid, name):
    return {"id": bid, "name": name, "folderId": None,
            "createdAt": 1000, "updatedAt": 1000, "lastOpenedAt": None, "rev": 1,
            "cellSize": 24, "sheetCols": 76, "sheetRows": 54, "pageOrder": "h",
            "recentColors": [], "colorUsage": {}}


def boot(page):
    page.route("https://**/*", lambda r: r.abort())
    page.goto(f"{BASE}/boards.html")
    page.evaluate(SEED_JS, [[lite("bA", "Урок")], {"bA": {"objects": [], "imageLib": []}}])
    page.reload()
    page.evaluate(BOOT_JS)
    page.wait_for_function("() => window.getDB && window.getDB().boards.length >= 1")
    page.evaluate("() => window.openBoard('bA')")
    page.wait_for_function("() => window.getCurrentBoard() && window.getCurrentBoard().id === 'bA' && boardActive")
    page.wait_for_timeout(300)


def zoom(page):
    return page.evaluate("() => cam.zoom")


def center(page):
    """какая точка доски сейчас посередине холста"""
    return page.evaluate("() => [cam.x + cssW/2/cam.zoom, cam.y + cssH/2/cam.zoom]")


def near(a, b, tol=0.5):
    return all(abs(x - y) <= tol for x, y in zip(a, b))


def state(page):
    return page.evaluate("""() => ({
      open: document.getElementById('bdZoomPop').classList.contains('open'),
      // по тому, что видно на экране, а не по атрибуту: display:flex у
      // кнопок рейла однажды уже перебил hidden
      labelHidden: !document.getElementById('railZoomLabel').getClientRects().length,
      inputHidden: !document.getElementById('railZoomInput').getClientRects().length,
      input: document.getElementById('railZoomInput').value,
      label: document.getElementById('railZoomLabel').textContent,
      slider: +getComputedStyle(document.getElementById('bdZoomSlider')).getPropertyValue('--f'),
      focused: document.activeElement && document.activeElement.id,
      zoom: cam.zoom,
    })""")


def slider_of(z):
    """доля бегунка снизу вверх: 0 — 10 %, 1 — 400 %, шкала логарифмическая"""
    return round((math.log(z) - math.log(0.1)) / (math.log(4) - math.log(0.1)), 4)


def same_f(a, b):
    return abs(a - b) < 2e-4


def thumb_frac(page):
    """где бегунок на самом деле нарисован: доля по высоте полосы"""
    return page.evaluate("""() => { const t = bdZoomThumb.getBoundingClientRect(), r = bdZoomSlider.getBoundingClientRect();
        const pad = t.height / 2; return (r.bottom - pad - (t.top + t.height / 2)) / (r.height - 2 * pad); }""")


def y_for(page, z):
    """экранная высота точки полосы, где стоит масштаб z"""
    return page.evaluate("""(f) => { const r = bdZoomSlider.getBoundingClientRect();
        const pad = parseFloat(getComputedStyle(bdZoomSlider).getPropertyValue('--pad'));
        return r.bottom - pad - f * (r.height - 2 * pad); }""", slider_of(z))


def box(page, sel):
    return page.evaluate(f"""() => {{ const r = document.querySelector('{sel}').getBoundingClientRect();
        return {{ l: r.left, t: r.top, r: r.right, b: r.bottom, w: r.width, h: r.height }}; }}""")


def dbl_label(page):
    page.dblclick("#railZoomLabel")
    page.wait_for_timeout(450)   # дольше окна двойного нажатия: сброса быть не должно


def type_zoom(page, text):
    page.click("#railZoomInput", click_count=1)
    page.wait_for_timeout(400)   # чтобы следующий щелчок не сложился в двойной
    page.evaluate("() => document.getElementById('railZoomInput').select()")
    page.keyboard.type(text)
    page.keyboard.press("Enter")
    page.wait_for_timeout(120)


def desktop(browser, errors):
    ctx = browser.new_context(viewport={"width": 1400, "height": 900})
    page = ctx.new_page()
    page.on("pageerror", lambda e: errors.append(str(e)))
    boot(page)

    # A — масштаб 125 %, потом двойной щелчок по процентам
    page.click("#railZoomIn")
    page.wait_for_timeout(100)
    z0, c0 = zoom(page), center(page)
    check("перед проверкой масштаб 125 %", abs(z0 - 1.25) < 1e-9, str(z0))
    dbl_label(page)
    s = state(page)
    check("A: панель открылась", s["open"])
    check("A: вместо кнопки — поле", s["labelHidden"] and not s["inputHidden"])
    check("A: в поле текущие проценты", s["input"] == "125%", s["input"])
    check("A: курсор в поле", s["focused"] == "railZoomInput", str(s["focused"]))
    check("A: двойной щелчок не сбросил масштаб на 100 %", abs(s["zoom"] - 1.25) < 1e-9, str(s["zoom"]))
    check("A: бегунок стоит на 125 %", same_f(s["slider"], slider_of(1.25)), f"{s['slider']} vs {slider_of(1.25)}")
    check("A: и нарисован там же", abs(thumb_frac(page) - slider_of(1.25)) < 0.01, str(thumb_frac(page)))
    check("A: доска не сдвинулась", near(center(page), c0))

    # B — 150 и Enter
    page.keyboard.press("Control+A")
    page.keyboard.type("150")
    page.keyboard.press("Enter")
    page.wait_for_timeout(120)
    s = state(page)
    check("B: Enter применил 150 %", abs(s["zoom"] - 1.5) < 1e-9, str(s["zoom"]))
    check("B: бегунок на 150 %", same_f(s["slider"], slider_of(1.5)), f"{s['slider']} vs {slider_of(1.5)}")
    check("B: в поле 150%", s["input"] == "150%", s["input"])
    check("B: середина доски на месте", near(center(page), c0), f"{center(page)} vs {c0}")
    check("B: панель осталась открытой", s["open"])

    # C — границы и форматы
    type_zoom(page, "1000")
    s = state(page)
    check("C: 1000 → 400 %", abs(s["zoom"] - 4) < 1e-9 and s["input"] == "400%", f"{s['zoom']} {s['input']}")
    check("C: бегунок упёрся вверх", same_f(s["slider"], 1) and abs(thumb_frac(page) - 1) < 0.01)
    check("C: середина на месте при 400 %", near(center(page), c0), f"{center(page)} vs {c0}")
    type_zoom(page, "3")
    s = state(page)
    check("C: 3 → 10 %", abs(s["zoom"] - 0.1) < 1e-9 and s["input"] == "10%", f"{s['zoom']} {s['input']}")
    check("C: бегунок упёрся вниз", same_f(s["slider"], 0) and abs(thumb_frac(page)) < 0.01)
    type_zoom(page, "87,5")
    s = state(page)
    check("C: «87,5» → 87,5 %", abs(s["zoom"] - 0.875) < 1e-9, str(s["zoom"]))
    type_zoom(page, "120 %")
    s = state(page)
    check("C: «120 %» → 120 %", abs(s["zoom"] - 1.2) < 1e-9 and s["input"] == "120%", f"{s['zoom']} {s['input']}")
    type_zoom(page, "абв")
    s = state(page)
    check("C: «абв» не трогает масштаб", abs(s["zoom"] - 1.2) < 1e-9, str(s["zoom"]))
    check("C: и в поле снова 120%", s["input"] == "120%", s["input"])
    check("C: середина так и не уехала", near(center(page), c0), f"{center(page)} vs {c0}")

    # D — бегунок мышью, снизу вверх
    sb = box(page, "#bdZoomSlider")
    check("D: бегунок вертикальный", sb["h"] > 150 and sb["h"] > 4 * sb["w"], str(sb))
    colors = page.evaluate("""() => { const ink = getComputedStyle(document.documentElement).getPropertyValue('--ink').trim();
        const probe = document.createElement('i'); probe.style.color = ink; document.body.appendChild(probe);
        const inkRgb = getComputedStyle(probe).color; probe.remove();
        return { ink: inkRgb, thumb: getComputedStyle(bdZoomThumb).backgroundColor,
          fill: getComputedStyle(document.querySelector('.bd-zoom-fill')).backgroundColor,
          rail: getComputedStyle(document.querySelector('.bd-zoom-rail')).backgroundColor,
          pop: getComputedStyle(bdZoomPop).backgroundColor }; }""")
    check("D: бегунок и заливка синие — цвет доски (--ink)", colors["thumb"] == colors["ink"] == colors["fill"] == "rgb(0, 76, 153)", str(colors))
    check("D: полоса и панель белые", colors["rail"] == colors["pop"] == "rgb(255, 255, 255)", str(colors))
    x = sb["l"] + sb["w"] / 2
    page.mouse.move(x, y_for(page, 0.1))
    page.mouse.down()
    steps, zs, synced = 24, [], True
    y0, y1 = y_for(page, 0.1), y_for(page, 4)
    for i in range(1, steps + 1):
        page.mouse.move(x + (5 if i % 2 else -5), y0 + (y1 - y0) * i / steps)   # рука не идеально ровная
        page.wait_for_timeout(16)
        s = state(page)
        zs.append(s["zoom"])
        if s["input"] != f"{round(s['zoom'] * 100)}%" or not same_f(s["slider"], slider_of(s["zoom"])):
            synced = False
    page.mouse.move(x + 60, y1 - 80)   # увели за полосу вверх и вбок — бегунок держится у края
    page.wait_for_timeout(30)
    zs.append(zoom(page))
    page.mouse.up()
    check("D: масштаб менялся на ходу, а не в конце", len(set(zs)) >= steps - 3, f"{len(set(zs))} разных из {steps}")
    check("D: тянем вверх — только растёт", all(b >= a for a, b in zip(zs, zs[1:])))
    check("D: дошёл до 400 % и за полосой там остался", abs(zs[-1] - 4) < 1e-9, str(zs[-1]))
    check("D: поле и бегунок совпадали на каждом шаге", synced)
    check("D: самый крупный шаг бегунка не больше 25 % (мельче кнопок)",
          max(b / a for a, b in zip(zs, zs[1:]) if a) < 1.25)
    check("D: середина доски не уехала", near(center(page), c0, 1.0), f"{center(page)} vs {c0}")
    # щелчок в точку полосы — бегунок прыгает туда; у 100 % магнит
    page.mouse.click(x, y_for(page, 1.02))
    page.wait_for_timeout(40)
    s = state(page)
    check("D: щелчок у 102 % прилипает к 100 %", s["zoom"] == 1 and s["input"] == "100%", f"{s['zoom']} {s['input']}")
    check("D: засечка 100 % там же, где бегунок на 100 %", page.evaluate("""() => {
        const t = bdZoomTick.getBoundingClientRect(), h = bdZoomThumb.getBoundingClientRect();
        return Math.abs((t.top + t.bottom) / 2 - (h.top + h.bottom) / 2) < 1.5; }"""))
    page.mouse.click(x, y_for(page, 2))
    page.wait_for_timeout(40)
    check("D: щелчок у 200 % — 200 %", abs(zoom(page) - 2) < 0.03, str(zoom(page)))
    # стрелки, когда фокус на полосе
    z1 = zoom(page)
    page.keyboard.press("ArrowUp")
    z2 = zoom(page)
    page.keyboard.press("ArrowDown"); page.keyboard.press("ArrowDown")
    z3 = zoom(page)
    page.keyboard.press("Home")
    z4 = zoom(page)
    check("D: стрелки двигают бегунок мелким шагом", z1 < z2 < z1 * 1.05 and z3 < z1, f"{z1} {z2} {z3}")
    check("D: Home — 10 %", abs(z4 - 0.1) < 1e-9 and state(page)["input"] == "10%", str(z4))
    page.mouse.click(x, y_for(page, 1.0))
    page.wait_for_timeout(40)

    # E — «+/−» при открытой панели
    page.click("#railZoomIn")
    page.wait_for_timeout(80)
    s = state(page)
    check("E: «+» — прежний шаг ×1,25", abs(s["zoom"] - 1.25) < 1e-9, str(s["zoom"]))
    check("E: панель не закрылась", s["open"])
    check("E: поле и бегунок за «+»", s["input"] == "125%" and same_f(s["slider"], slider_of(1.25)), f"{s['input']} {s['slider']}")
    page.click("#railZoomOut")
    page.wait_for_timeout(80)
    s = state(page)
    check("E: «−» — прежний шаг", abs(s["zoom"] - 1) < 1e-9 and s["input"] == "100%", f"{s['zoom']} {s['input']}")
    # недонабранное и «+»
    page.click("#railZoomInput")
    page.wait_for_timeout(400)
    page.evaluate("() => railZoomInput.select()")
    page.keyboard.type("33")
    page.click("#railZoomIn")
    page.wait_for_timeout(80)
    s = state(page)
    check("E: «+» поверх недонабранного — в поле итоговый масштаб", s["input"] == "125%" and abs(s["zoom"] - 1.25) < 1e-9, f"{s['input']} {s['zoom']}")

    # H — цифры в поле не переключают инструменты
    page.click('#bdDock .bd-tool[data-tool="pen"]')
    page.wait_for_timeout(60)
    if not state(page)["open"]:
        dbl_label(page)
    page.click("#railZoomInput")
    page.wait_for_timeout(400)
    page.evaluate("() => railZoomInput.select()")
    page.keyboard.type("21")
    check("H: «2» и «1» в поле не сменили ручку на выделение/руку", page.evaluate("() => tool") == "pen")
    page.keyboard.press("Enter")
    page.wait_for_timeout(80)
    check("H: 21 % применились", abs(zoom(page) - 0.21) < 1e-9, str(zoom(page)))

    # I — рейл слева: панель справа от рейла, по высоте у процентов
    pop, rail, inp = box(page, "#bdZoomPop"), box(page, "#bdRail"), box(page, "#railZoomInput")
    check("I: панель справа от рейла", pop["l"] >= rail["r"] and pop["l"] - rail["r"] < 20, f"{pop} {rail}")
    mid = (inp["t"] + inp["b"]) / 2
    check("I: проценты на уровне панели, панель ниже верхней панели доски",
          pop["t"] < mid < pop["b"] and pop["t"] >= box(page, ".bd-topbar")["b"], f"{pop} {inp}")
    check("I: целиком в окне", pop["l"] >= 0 and pop["t"] >= 0 and pop["r"] <= 1400 and pop["b"] <= 900)

    # F — Escape; выделение на доске при этом остаётся
    page.evaluate("""() => { const v = visibleBoardRect();
        B.objects.push({ id: 'zz1', type: 'rect', color: '#000', width: 2,
          points: [{ x: v.x + 50, y: v.y + 50 }, { x: v.x + 150, y: v.y + 120 }] });
        selectedId = 'zz1'; scheduleRedraw(); }""")
    page.keyboard.press("Escape")
    page.wait_for_timeout(80)
    s = state(page)
    check("F: Escape закрыл панель", not s["open"])
    check("F: снова кнопка с верными процентами", not s["labelHidden"] and s["inputHidden"] and s["label"] == "21%", s["label"])
    check("F: Escape панели не снял выделение на доске", page.evaluate("() => selectedId") == "zz1")
    check("F: фокус не остался в спрятанном поле", s["focused"] != "railZoomInput")
    page.keyboard.press("Escape")
    check("F: второй Escape — уже доске (выделение снято)", page.evaluate("() => selectedId") is None)

    # F — щелчок по доске
    dbl_label(page)
    check("F: снова открылась", state(page)["open"])
    cv = box(page, "#boardCv")
    page.click('#bdDock .bd-tool[data-tool="hand"]')
    page.mouse.click(cv["l"] + cv["w"] * 0.6, cv["t"] + cv["h"] * 0.6)
    page.wait_for_timeout(100)
    check("F: щелчок по доске закрыл", not state(page)["open"])

    # F — повторный двойной щелчок по полю
    dbl_label(page)
    page.dblclick("#railZoomInput")
    page.wait_for_timeout(450)
    s = state(page)
    check("F: двойной щелчок по полю закрыл", not s["open"] and not s["labelHidden"])
    check("F: и масштаб не сбросил", abs(s["zoom"] - 0.21) < 1e-9, str(s["zoom"]))

    # G — одиночный щелчок по процентам: прежний сброс
    c1 = center(page)
    page.click("#railZoomLabel")
    page.wait_for_timeout(500)
    s = state(page)
    check("G: одиночный щелчок — 100 %", abs(s["zoom"] - 1) < 1e-9 and s["label"] == "100%", f"{s['zoom']} {s['label']}")
    check("G: панель не открылась", not s["open"])
    check("G: вокруг середины", near(center(page), c1, 1.0))

    # I — док слева: рейл в верхней панели, панель под ним
    page.evaluate("() => { dockPos = 'left'; applyDockLayout(); }")
    page.wait_for_timeout(150)
    dbl_label(page)
    pop, rail, lab = box(page, "#bdZoomPop"), box(page, "#bdRail"), box(page, "#railZoomInput")
    check("I: рейл наверху — панель под ним", pop["t"] >= rail["b"] and pop["t"] - rail["b"] < 20, f"{pop} {rail}")
    check("I: по горизонтали у процентов или прижата к краю окна",
          abs((pop["l"] + pop["r"]) / 2 - (lab["l"] + lab["r"]) / 2) < 2 or pop["r"] >= 1400 - 9, f"{pop} {lab}")
    check("I: целиком в окне", pop["l"] >= 0 and pop["r"] <= 1400 and pop["b"] <= 900)
    page.keyboard.press("Escape")
    page.evaluate("() => { dockPos = 'bottom'; applyDockLayout(); }")

    # выход из доски с открытой панелью
    dbl_label(page)
    page.evaluate("() => backToList()")
    page.wait_for_timeout(300)
    check("выход из доски закрывает панель", not state(page)["open"])
    ctx.close()


def touch_drag(page, x0, y0, x1, y1, steps=16):
    """протяжка пальцем через CDP — у Playwright касание есть только тапом"""
    cdp = page.context.new_cdp_session(page)
    cdp.send("Input.dispatchTouchEvent", {"type": "touchStart", "touchPoints": [{"x": x0, "y": y0}]})
    zs = []
    for i in range(1, steps + 1):
        x = x0 + (x1 - x0) * i / steps
        y = y0 + (y1 - y0) * i / steps
        cdp.send("Input.dispatchTouchEvent", {"type": "touchMove", "touchPoints": [{"x": x, "y": y}]})
        page.wait_for_timeout(20)
        zs.append(zoom(page))
    cdp.send("Input.dispatchTouchEvent", {"type": "touchEnd", "touchPoints": []})
    page.wait_for_timeout(60)
    return zs


def double_tap(page, sel):
    b = box(page, sel)
    x, y = b["l"] + b["w"] / 2, b["t"] + b["h"] / 2
    page.touchscreen.tap(x, y)
    page.wait_for_timeout(120)
    page.touchscreen.tap(x, y)
    page.wait_for_timeout(450)


def tablet(browser, errors):
    ctx = browser.new_context(viewport={"width": 1024, "height": 768}, has_touch=True, is_mobile=True,
                              device_scale_factor=2)
    page = ctx.new_page()
    page.on("pageerror", lambda e: errors.append(str(e)))
    boot(page)
    coarse = page.evaluate("() => matchMedia('(pointer: coarse)').matches")
    z0, c0 = zoom(page), center(page)
    double_tap(page, "#railZoomLabel")
    s = state(page)
    check("J: планшет — двойной тап открыл панель", s["open"] and not s["inputHidden"])
    check("J: масштаб не сбросился и не прыгнул", s["zoom"] == z0 and near(center(page), c0))
    if coarse:
        check("J: на сенсорном экране клавиатура сама не вылезает", s["focused"] != "railZoomInput", str(s["focused"]))
    sb = box(page, "#bdZoomSlider")
    check("J: полоса под палец (ширина ≥ 40 px, бегунок ≥ 24 px)",
          (sb["w"] >= 40 and box(page, "#bdZoomThumb")["h"] >= 24) or not coarse, str(sb))
    check("J: вертикальный", sb["h"] > 4 * sb["w"], str(sb))
    xm = sb["l"] + sb["w"] / 2
    zs = touch_drag(page, xm, y_for(page, z0), xm + 12, sb["t"] - 30)
    s = state(page)
    check("J: палец тянет бегунок — масштаб растёт по ходу", len(set(zs)) >= 8 and zs[-1] > 3.5, f"{len(set(zs))} шагов, {zs[-1]}")
    check("J: проценты за пальцем", s["input"] == f"{round(s['zoom'] * 100)}%", s["input"])
    check("J: середина на месте", near(center(page), c0, 1.0), f"{center(page)} vs {c0}")
    check("J: доска под бегунком не панорамировалась", page.evaluate("() => document.scrollingElement.scrollTop") == 0)
    double_tap(page, "#railZoomInput")
    check("J: повторный двойной тап закрыл", not state(page)["open"])
    ctx.close()


def phone(browser, errors):
    W, H = 390, 844
    ctx = browser.new_context(viewport={"width": W, "height": H}, has_touch=True, is_mobile=True,
                              device_scale_factor=3)
    page = ctx.new_page()
    page.on("pageerror", lambda e: errors.append(str(e)))
    boot(page)
    z0 = zoom(page)
    double_tap(page, "#railZoomLabel")
    s = state(page)
    check("K: телефон — двойной тап открыл панель", s["open"], json_like(s))
    check("K: масштаб не сброшен", s["zoom"] == z0)
    pop = box(page, "#bdZoomPop")
    check("K: панель целиком в узком окне", pop["l"] >= 0 and pop["r"] <= W and pop["t"] >= 0 and pop["b"] <= H, str(pop))
    sb = box(page, "#bdZoomSlider")
    check("K: бегунок не крошечный (≥ 120 px в высоту)", sb["h"] >= 120, str(sb["h"]))
    check("K: панель не заходит на верхнюю панель доски", pop["t"] >= box(page, ".bd-topbar")["b"], str(pop))
    check("K: страница не увеличилась от двойного тапа",
          page.evaluate("() => (window.visualViewport ? visualViewport.scale : 1)") == 1)
    # ввод с экранной клавиатуры и тап по доске
    b = box(page, "#railZoomInput")
    page.touchscreen.tap(b["l"] + b["w"] / 2, b["t"] + b["h"] / 2)
    page.wait_for_timeout(400)
    page.evaluate("() => railZoomInput.select()")
    page.keyboard.type("200")
    cv = box(page, "#boardCv")
    c0 = center(page)
    page.touchscreen.tap(cv["l"] + cv["w"] / 2, cv["t"] + cv["h"] * 0.45)
    page.wait_for_timeout(150)
    s = state(page)
    check("K: тап мимо применил набранное (на цифровой клавиатуре iPhone нет Enter)", abs(s["zoom"] - 2) < 1e-9, str(s["zoom"]))
    check("K: и закрыл панель", not s["open"] and s["label"] == "200%", s["label"])
    check("K: вокруг середины", near(center(page), c0, 1.0))
    # бегунок пальцем на телефоне
    double_tap(page, "#railZoomLabel")
    sb = box(page, "#bdZoomSlider")
    xm = sb["l"] + sb["w"] / 2
    zs = touch_drag(page, xm, y_for(page, 2), xm - 10, sb["b"] + 30)
    check("K: бегунок пальцем уменьшает масштаб по ходу", len(set(zs)) >= 6 and abs(zs[-1] - 0.1) < 1e-9, f"{len(set(zs))} {zs[-1]}")
    s = state(page)
    check("K: проценты за пальцем", s["input"] == f"{round(s['zoom'] * 100)}%")
    ctx.close()


def json_like(s):
    return ", ".join(f"{k}={v}" for k, v in s.items())


def main():
    errors = []
    with local_server(), sync_playwright() as p:
        browser = p.chromium.launch()
        try:
            print("— компьютер —")
            desktop(browser, errors)
            print("— планшет —")
            tablet(browser, errors)
            print("— телефон —")
            phone(browser, errors)
            check("L: нет ошибок JavaScript", not errors, "; ".join(errors[:3]))
        finally:
            browser.close()
    print()
    print("ВСЁ ПРОШЛО" if not fails else f"ПРОВАЛОВ: {len(fails)}")
    sys.exit(1 if fails else 0)


if __name__ == "__main__":
    main()
