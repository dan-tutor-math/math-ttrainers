"""
Промпт №9: док доски (boards.html / boards-core.js) — перемещение без
перескока, ручки с обеих сторон, прямоугольничек «размер или перемещение».

Проверяем:
  A. Три точки есть у обоих концов дока: снизу — слева и справа, сбоку —
     сверху и снизу; ручки внутри дока и не наезжают на инструменты.
  B. Левые три точки: нажатие ничего не двигает, первый пиксель движения —
     ровно пиксель панели, точка захвата всё время под курсором (раньше
     середина панели прыгала под курсор).
  C. Правые три точки — то же самое.
  D. Прямоугольничек: вверх — крупнее, панель по горизонтали на месте;
     влево-вправо — перемещение за точку захвата, размер не меняется; меньше
     порога — ничего; режим решается по первым пикселям и до отпускания не
     переключается (в обе стороны).
  E. Панель не уходит за край экрана; правая ручка доводит панель до правого
     края по низу, не перебрасывая её на боковой край раньше времени;
     дрожание у стенки не перебрасывает; прижать и давить — переезд вбок.
  F. Боковой док: вдоль края едет за точкой захвата по вертикали; у
     прямоугольничка поперёк (влево-вправо) — размер, вдоль — перемещение;
     обратно вниз — ручка снова под курсором.
  G. Положение переживает перезагрузку, панель на экране; сохранённое
     смещение «за краем» от старой версии подрезается; инструменты кликаются;
     нет ошибок JavaScript.
  H. Открыли панель тренажёров рядом с доской — прижатый к краю док остаётся
     в оставшейся части экрана и тянется за точку захвата.

Запуск: python3 test_prompt9_dock_drag.py (сервер поднимается сам).
"""
import contextlib
import http.client
import subprocess
import sys
import time

from playwright.sync_api import sync_playwright

PORT = 8993
BASE = f"http://127.0.0.1:{PORT}"
TOL = 0.6

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

SEED_JS = """([boards, payloads, prefs]) => new Promise((resolve, reject) => {
    localStorage.removeItem('boardsDockPos'); localStorage.removeItem('boardsDockOffset');
    localStorage.removeItem('boardsDockScale');
    Object.keys(prefs || {}).forEach(k => localStorage.setItem(k, prefs[k]));
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

STATE_JS = """() => {
  const R = el => { const r = document.getElementById(el).getBoundingClientRect();
    return { l: r.left, r: r.right, t: r.top, b: r.bottom, w: r.width, h: r.height,
             cx: r.left + r.width / 2, cy: r.top + r.height / 2 }; };
  const ref = document.getElementById('bdRefToggle').getBoundingClientRect();
  return { pos: dockPos, off: dockOffset, scale: dockScale, rng: dockOffsetRange(), refL: ref.left, refT: ref.top,
           dock: R('bdDock'), g1: R('bdDockGrip'), g2: R('bdDockGripEnd'), rs: R('bdDockResize'),
           W: innerWidth, H: innerHeight };
}"""


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


FAILS = []


def check(cond, msg):
    print(("  ok   " if cond else "  FAIL ") + msg)
    if not cond:
        FAILS.append(msg)


def open_board(ctx, w=1400, h=900, errors=None, prefs=None):
    page = ctx.new_page()
    page.set_viewport_size({"width": w, "height": h})
    if errors is not None:
        page.on("pageerror", lambda e: errors.append(str(e)))
    page.route("https://**/*", lambda r: r.abort())
    page.goto(f"{BASE}/boards.html")
    page.evaluate(SEED_JS, [[LITE], {"bA": {"objects": [], "imageLib": []}}, prefs or {}])
    page.reload()
    page.evaluate(BOOT_JS)
    page.wait_for_function("() => window.getDB && window.getDB().boards.length >= 1")
    page.evaluate("() => window.openBoard('bA')")
    page.wait_for_function("() => window.getCurrentBoard() && Array.isArray(window.getCurrentBoard().objects)")
    page.wait_for_timeout(250)
    return page


def st(page):
    return page.evaluate(STATE_JS)


def near(a, b, tol=TOL):
    return abs(a - b) <= tol


def inside(inner, outer, tol=0.5):
    return (inner["l"] >= outer["l"] - tol and inner["r"] <= outer["r"] + tol
            and inner["t"] >= outer["t"] - tol and inner["b"] <= outer["b"] + tol)


def overlap(a, b):
    return not (a["r"] <= b["l"] or a["l"] >= b["r"] or a["b"] <= b["t"] or a["t"] >= b["b"])


def tools_rects(page):
    return page.evaluate("""() => [...document.querySelectorAll('#bdDockTools > *')]
      .filter(e => e.offsetParent !== null).map(e => { const r = e.getBoundingClientRect();
      return { l: r.left, r: r.right, t: r.top, b: r.bottom }; })""")


def grab_point(s, key, fx, fy):
    r = s[key]
    return r["l"] + fx * r["w"], r["t"] + fy * r["h"]


def follow(page, key, fx, fy, path, label):
    """ведём мышь по path, после каждого шага точка захвата ручки key должна
    быть под курсором; возвращает число шагов с расхождением"""
    bad = 0
    worst = 0.0
    checked = 0
    for (x, y) in path:
        page.mouse.move(x, y)
        s = st(page)
        gx, gy = grab_point(s, key, fx, fy)
        p, g = (x, gx) if s["pos"] == "bottom" else (y, gy)
        lo, hi = s["rng"]
        # панель упёрлась в стенку (край экрана или соседнюю кнопку) — дальше
        # курсора она не едет, но и не отстаёт в обратную сторону
        if abs(s["off"] - hi) < 0.01 and p >= g - TOL:
            continue
        if abs(s["off"] - lo) < 0.01 and p <= g + TOL:
            continue
        checked += 1
        d = abs(g - p)
        worst = max(worst, d)
        if d > TOL:
            bad += 1
    check(bad == 0 and checked >= len(path) * 0.6,
          f"{label}: точка захвата под курсором ({checked} шагов из {len(path)} без упора, худшее расхождение {worst:.2f}px)")
    return bad


def block_a(ctx):
    print("A. Ручки с обеих сторон")
    page = open_board(ctx)
    s = st(page)
    check(s["pos"] == "bottom", "док по умолчанию снизу")
    n1 = page.locator("#bdDockGrip span").count()
    n2 = page.locator("#bdDockGripEnd span").count()
    check(n1 == 3 and n2 == 3, f"по три точки у обеих ручек ({n1}, {n2})")
    tr = tools_rects(page)
    check(s["g1"]["r"] <= tr[0]["l"] + 0.5, "левые три точки левее первого инструмента")
    check(s["g2"]["l"] >= tr[-1]["r"] - 0.5, "правые три точки правее последнего инструмента")
    check(inside(s["g1"], s["dock"]) and inside(s["g2"], s["dock"]), "обе ручки внутри дока")
    check(near(s["g1"]["l"] - s["dock"]["l"], s["dock"]["r"] - s["g2"]["r"], 1.0),
          "ручки стоят симметрично у краёв")
    check(not any(overlap(s["g1"], t) or overlap(s["g2"], t) for t in tr), "ручки не наезжают на инструменты")
    check(near(s["g1"]["cy"], s["dock"]["cy"], 1) and near(s["g2"]["cy"], s["dock"]["cy"], 1),
          "обе ручки по высоте посередине дока")
    page.close()
    for side in ("left", "right"):
        page = open_board(ctx, prefs={"boardsDockPos": side})
        s = st(page)
        tr = tools_rects(page)
        check(s["pos"] == side, f"док {side}")
        check(s["g1"]["b"] <= tr[0]["t"] + 0.5 and s["g2"]["t"] >= tr[-1]["b"] - 0.5,
              f"док {side}: три точки сверху и снизу от инструментов")
        check(inside(s["g1"], s["dock"]) and inside(s["g2"], s["dock"]), f"док {side}: ручки внутри дока")
        check(not any(overlap(s["g1"], t) or overlap(s["g2"], t) for t in tr),
              f"док {side}: ручки не наезжают на инструменты")
        check(s["dock"]["t"] >= 0 and s["dock"]["b"] <= s["H"], f"док {side}: по высоте на экране")
        page.close()


def grip_no_jump(ctx, key, sel, direction, label):
    page = open_board(ctx)
    s0 = st(page)
    fx, fy = 0.3, 0.7   # нарочно не в середине ручки
    x0, y0 = grab_point(s0, key, fx, fy)
    page.mouse.move(x0, y0)
    page.mouse.down()
    s1 = st(page)
    check(near(s1["dock"]["l"], s0["dock"]["l"]) and near(s1["off"], s0["off"]),
          f"{label}: нажатие не сдвигает панель")
    page.mouse.move(x0 + direction, y0)
    s2 = st(page)
    check(near(s2["dock"]["l"] - s0["dock"]["l"], direction),
          f"{label}: первый пиксель движения — пиксель панели (сдвиг {s2['dock']['l'] - s0['dock']['l']:.2f})")
    path = [(x0 + direction * k, y0 + (k % 7) - 3) for k in range(2, 260, 9)]
    path += [(x0 + direction * (260 - k), y0 + 5) for k in range(0, 400, 13)]
    follow(page, key, fx, fy, path, label)
    s3 = st(page)
    check(s3["pos"] == "bottom", f"{label}: док остался снизу")
    check(near(s3["dock"]["t"], s0["dock"]["t"]), f"{label}: по вертикали панель на месте")
    page.mouse.up()
    saved = page.evaluate("() => parseFloat(localStorage.getItem('boardsDockOffset'))")
    check(near(saved, s3["off"]), f"{label}: смещение сохранено")
    page.close()


def block_b(ctx):
    print("B. Левые три точки — без перескока")
    grip_no_jump(ctx, "g1", "#bdDockGrip", 1, "левые точки")


def block_c(ctx):
    print("C. Правые три точки — без перескока")
    grip_no_jump(ctx, "g2", "#bdDockGripEnd", -1, "правые точки")


def block_d(ctx):
    print("D. Прямоугольничек: размер или перемещение")
    page = open_board(ctx)
    s0 = st(page)
    fx, fy = 0.35, 0.6
    x0, y0 = grab_point(s0, "rs", fx, fy)
    # меньше порога — ничего
    page.mouse.move(x0, y0); page.mouse.down()
    page.mouse.move(x0 + 2, y0 - 2)
    s = st(page)
    check(near(s["scale"], s0["scale"], 1e-9) and near(s["dock"]["cx"], s0["dock"]["cx"]),
          "пара пикселей — ни размер, ни положение не меняются")
    page.mouse.up()
    # вверх — крупнее, по горизонтали на месте
    page.mouse.move(x0, y0); page.mouse.down()
    for k in range(1, 11):
        page.mouse.move(x0 + (1 if k % 2 else 0), y0 - 6 * k)
    s = st(page)
    check(s["scale"] > s0["scale"] + 0.3, f"вверх — панель крупнее ({s0['scale']:.2f} → {s['scale']:.2f})")
    check(near(s["dock"]["cx"], s0["dock"]["cx"]), "вверх — по горизонтали панель на месте")
    # режим не переключается: теперь в сторону — размер/положение не едут вбок
    page.mouse.move(x0 + 200, y0 - 60)
    s2 = st(page)
    check(near(s2["dock"]["cx"], s0["dock"]["cx"]), "начали с размера — уход вбок панель не двигает")
    check(near(s2["scale"], s["scale"], 1e-9), "начали с размера — уход вбок размер не меняет")
    page.mouse.up()
    saved = page.evaluate("() => parseFloat(localStorage.getItem('boardsDockScale'))")
    check(near(saved, s2["scale"], 1e-6), "размер сохранён")
    # вниз — обратно мельче
    s0 = st(page)
    x0, y0 = grab_point(s0, "rs", fx, fy)
    page.mouse.move(x0, y0); page.mouse.down()
    for k in range(1, 11):
        page.mouse.move(x0, y0 + 6 * k)
    page.mouse.up()
    s = st(page)
    check(s["scale"] < s0["scale"] - 0.3, "вниз — панель мельче")
    # влево-вправо — перемещение за точку захвата, размер не меняется
    s0 = st(page)
    x0, y0 = grab_point(s0, "rs", fx, fy)
    page.mouse.move(x0, y0); page.mouse.down()
    page.mouse.move(x0 + 3, y0)   # ещё до порога
    s = st(page)
    check(near(s["dock"]["cx"], s0["dock"]["cx"]), "до порога панель не едет")
    path = [(x0 + 6 + 10 * k, y0 + (k % 3)) for k in range(0, 25)]
    path += [(x0 + 246 - 12 * k, y0 - 2) for k in range(0, 40)]
    follow(page, "rs", fx, fy, path, "прямоугольничек вбок")
    s = st(page)
    check(near(s["scale"], s0["scale"], 1e-9), "вбок — размер не меняется")
    check(near(s["dock"]["t"], s0["dock"]["t"]), "вбок — панель по вертикали на месте")
    # режим не переключается: теперь вверх — размер не меняется
    page.mouse.move(path[-1][0], y0 - 150)
    s2 = st(page)
    check(near(s2["scale"], s0["scale"], 1e-9), "начали с перемещения — тяга вверх размер не меняет")
    check(near(s2["dock"]["cx"], s["dock"]["cx"]), "начали с перемещения — тяга вверх панель вбок не двигает")
    check(page.evaluate("() => document.getElementById('bdDockResize').classList.contains('moving')"),
          "в режиме перемещения у прямоугольничка курсор «тащу»")
    page.mouse.up()
    check(not page.evaluate("() => document.getElementById('bdDockResize').classList.contains('moving')"),
          "после отпускания курсор прямоугольничка прежний")
    saved = page.evaluate("() => parseFloat(localStorage.getItem('boardsDockOffset'))")
    check(near(saved, s2["off"]), "смещение после перемещения прямоугольничком сохранено")
    page.close()


def block_e(ctx, errors):
    print("E. Края экрана")
    page = open_board(ctx, errors=errors)
    s0 = st(page)
    W = s0["W"]
    # левой ручкой далеко вправо (курсор не у края) — панель упирается и не уходит за экран
    x0, y0 = grab_point(s0, "g1", 0.5, 0.5)
    page.mouse.move(x0, y0); page.mouse.down()
    page.mouse.move(W - 200, y0, steps=20)
    s = st(page)
    check(s["pos"] == "bottom", "левой ручкой вправо — док снизу")
    check(s["dock"]["r"] <= W - 8 + 0.5, f"панель не уходит за правый край ({s['dock']['r']:.1f} из {W})")
    check(near(s["dock"]["r"], s["refL"] - 8),
          f"панель упирается перед кнопкой справочных материалов, а не лезет под неё ({s['dock']['r']:.1f}, кнопка с {s['refL']:.1f})")
    page.mouse.move(x0, y0, steps=20)
    s = st(page)
    check(near(s["dock"]["l"], s0["dock"]["l"]), "вернули мышь — панель на исходном месте")
    page.mouse.up()
    # правой ручкой к правому краю: панель доезжает до края по низу
    s0 = st(page)
    x0, y0 = grab_point(s0, "g2", 0.5, 0.5)
    page.mouse.move(x0, y0); page.mouse.down()
    wall = s0["refL"] - 8
    gap = wall - s0["dock"]["r"]
    target = x0 + gap - 1          # курсор уже в «боковой» зоне, а панель ещё не у стенки
    check(target > W - 110, "проверка осмысленна: курсор в 110 px от края")
    page.mouse.move(target, y0, steps=25)
    s = st(page)
    check(s["pos"] == "bottom", "правой ручкой к краю — док не перескакивает вбок раньше, чем упрётся")
    check(near(s["g2"]["cx"], target), "правая ручка под курсором у самого края")
    page.mouse.move(x0 + gap, y0)
    s = st(page)
    check(s["pos"] == "bottom" and near(s["dock"]["r"], wall), "панель довели до правого края по низу")
    check(page.evaluate("([x, y]) => !!document.elementFromPoint(x, y).closest('#bdDockGripEnd')", [s["g2"]["cx"], s["g2"]["cy"]]),
          "правая ручка у края не закрыта соседними кнопками — её можно схватить снова")
    page.mouse.up()
    # дрожание у стенки не перебрасывает
    s0 = st(page)
    x0, y0 = grab_point(s0, "g2", 0.5, 0.5)
    page.mouse.move(x0, y0); page.mouse.down()
    page.mouse.move(x0 + 3, y0 + 1)
    page.mouse.move(x0 + 2, y0)
    s = st(page)
    check(s["pos"] == "bottom", "дрожание у стенки — док остаётся снизу")
    # давим в стенку — переезд вправо
    page.mouse.move(W - 1, y0, steps=5)
    s = st(page)
    check(s["pos"] == "right", "прижали и давят в правый край — док переехал вправо")
    page.mouse.up()
    check(page.evaluate("() => localStorage.getItem('boardsDockPos')") == "right", "положение справа сохранено")
    page.close()
    # левой ручкой, прижатой к левой стенке: дрожание и переезд влево
    page = open_board(ctx, errors=errors)
    s0 = st(page)
    x0, y0 = grab_point(s0, "g1", 0.5, 0.5)
    page.mouse.move(x0, y0); page.mouse.down()
    page.mouse.move(2, y0, steps=30)
    s = st(page)
    check(s["pos"] == "bottom" or s["pos"] == "left", "левой ручкой к левому краю")
    page.mouse.up()
    s0 = st(page)
    if s0["pos"] == "bottom":
        check(near(s0["dock"]["l"], 8), f"панель прижата к левому краю ({s0['dock']['l']:.1f})")
        x0, y0 = grab_point(s0, "g1", 0.5, 0.5)
        page.mouse.move(x0, y0); page.mouse.down()
        page.mouse.move(x0 - 3, y0)
        check(st(page)["pos"] == "bottom", "дрожание у левой стенки — док остаётся снизу")
        page.mouse.move(0, y0, steps=4)
        check(st(page)["pos"] == "left", "давят в левую стенку — док переехал влево")
        page.mouse.up()
    else:
        check(True, "док переехал влево сразу — курсор ушёл к самому краю")
    page.close()


def block_f(ctx, errors):
    print("F. Боковой док")
    for side in ("left", "right"):
        # окно повыше: на 900 px боковой док почти во всю высоту, и ехать ему
        # вдоль края почти некуда — точку захвата не проверить
        page = open_board(ctx, h=1300, errors=errors, prefs={"boardsDockPos": side})
        s0 = st(page)
        for key in ("g1", "g2"):
            s0 = st(page)
            fx, fy = 0.6, 0.4
            x0, y0 = grab_point(s0, key, fx, fy)
            page.mouse.move(x0, y0); page.mouse.down()
            s1 = st(page)
            check(near(s1["dock"]["t"], s0["dock"]["t"]), f"док {side}, {key}: нажатие не сдвигает")
            direction = 1   # вниз и обратно: после g1 панель уже сдвинута вверх
            path = [(x0 + (k % 3), y0 + direction * 7 * k) for k in range(1, 30)]
            path += [(x0, y0 + direction * (200 - 9 * k)) for k in range(0, 40)]
            follow(page, key, fx, fy, path, f"док {side}, {key} вдоль края")
            s = st(page)
            check(s["pos"] == side, f"док {side}, {key}: остался у своего края")
            check(s["dock"]["t"] >= 8 - 0.5 and s["dock"]["b"] <= s["H"] - 8 + 0.5,
                  f"док {side}, {key}: по высоте на экране")
            page.mouse.up()
        # прямоугольничек: поперёк — размер, вдоль — перемещение
        s0 = st(page)
        x0, y0 = grab_point(s0, "rs", 0.5, 0.5)
        inward = 1 if side == "left" else -1
        page.mouse.move(x0, y0); page.mouse.down()
        for k in range(1, 11):
            page.mouse.move(x0 + inward * 6 * k, y0 + (k % 2))
        s = st(page)
        check(s["scale"] > s0["scale"] + 0.3, f"док {side}: прямоугольничек поперёк — крупнее")
        pinned = min(abs(s["off"] - s["rng"][0]), abs(s["off"] - s["rng"][1])) < 0.01
        check(near(s["dock"]["cy"], s0["dock"]["cy"]) or pinned,
              f"док {side}: поперёк — по вертикали на месте (или подвинут ровно настолько, чтобы остаться на экране)")
        check(s["dock"]["t"] >= 8 - 0.5 and s["dock"]["b"] <= s["H"] - 8 + 0.5, f"док {side}: выросший док на экране")
        page.mouse.up()
        s0 = st(page)
        x0, y0 = grab_point(s0, "rs", 0.5, 0.3)
        page.mouse.move(x0, y0); page.mouse.down()
        path = [(x0 + (k % 2), y0 + 8 * k) for k in range(1, 15)]
        path += [(x0, y0 + 112 - 10 * k) for k in range(0, 25)]
        follow(page, "rs", 0.5, 0.3, path, f"док {side}: прямоугольничек вдоль края")
        s = st(page)
        check(near(s["scale"], s0["scale"], 1e-9), f"док {side}: вдоль — размер не меняется")
        page.mouse.up()
        # обратно вниз: верхней ручкой в середину экрана — ручка под курсором
        s0 = st(page)
        x0, y0 = grab_point(s0, "g1", 0.5, 0.5)
        page.mouse.move(x0, y0); page.mouse.down()
        W = s0["W"]
        page.mouse.move(200, y0, steps=15)
        s = st(page)
        check(s["pos"] == "bottom", f"док {side}: в середину экрана — снова снизу")
        follow(page, "g1", 0.5, 0.5, [(200 + 5 * k, y0) for k in range(0, 20)], f"док {side} → низ: левая ручка")
        page.mouse.up()
        page.close()


def block_g(ctx, errors):
    print("G. Перезагрузка, старые смещения, инструменты")
    page = open_board(ctx, errors=errors)
    s0 = st(page)
    x0, y0 = grab_point(s0, "g1", 0.5, 0.5)
    page.mouse.move(x0, y0); page.mouse.down()
    page.mouse.move(x0 - 150, y0, steps=10)
    page.mouse.up()
    s1 = st(page)
    page.reload()
    page.evaluate(BOOT_JS)
    page.wait_for_function("() => window.getDB && window.getDB().boards.length >= 1")
    page.evaluate("() => window.openBoard('bA')")
    page.wait_for_timeout(250)
    s2 = st(page)
    check(s2["pos"] == "bottom" and near(s2["dock"]["l"], s1["dock"]["l"]), "после перезагрузки док там же")
    page.close()
    # смещение от старой версии (панель уезжала за край) подрезается при открытии
    page = open_board(ctx, errors=errors, prefs={"boardsDockOffset": "560"})
    s = st(page)
    check(s["dock"]["r"] <= s["W"] - 8 + 0.5 and s["dock"]["l"] >= 8 - 0.5,
          f"сохранённое смещение за краем подрезано ({s['dock']['l']:.0f}…{s['dock']['r']:.0f})")
    page.close()
    page = open_board(ctx, errors=errors, prefs={"boardsDockPos": "left", "boardsDockOffset": "900"})
    s = st(page)
    check(s["dock"]["t"] >= 8 - 0.5 and s["dock"]["b"] <= s["H"] - 8 + 0.5, "боковой док с большим смещением — на экране")
    page.close()
    # узкое окно: панель на экране, ручки по краям
    page = open_board(ctx, w=600, h=800, errors=errors, prefs={"boardsDockOffset": "-400"})
    s = st(page)
    check(s["dock"]["l"] >= 0 and s["dock"]["r"] <= s["W"], "узкое окно — док на экране")
    check(inside(s["g1"], s["dock"]) and inside(s["g2"], s["dock"]), "узкое окно — обе ручки в доке")
    page.close()
    # инструменты по-прежнему кликаются, клик по ручке инструмент не меняет
    page = open_board(ctx, errors=errors)
    page.click('#bdDock .bd-tool[data-tool="eraser"]')
    check(page.evaluate("() => document.querySelector('#bdDock .bd-tool[data-tool=\"eraser\"]').classList.contains('active')"),
          "инструмент выбирается кликом")
    page.click("#bdDockGripEnd")
    page.click("#bdDockResize")
    check(page.evaluate("() => document.querySelector('#bdDock .bd-tool[data-tool=\"eraser\"]').classList.contains('active')"),
          "клик по ручкам инструмент не сбивает")
    s = st(page)
    page.close()


def block_h(ctx, errors):
    print("H. Панель тренажёров рядом с доской")
    for off in ("-2000", "2000"):
        page = open_board(ctx, errors=errors, prefs={"boardsDockOffset": off})
        page.evaluate("() => setTrainersPanel('open')")
        page.wait_for_timeout(300)
        r = page.evaluate("""() => { const d = document.getElementById('bdDock').getBoundingClientRect();
            const pr = document.getElementById('bdTrainersPanel').getBoundingClientRect();
            return { dl: d.left, dr: d.right, pr: pr.right, W: innerWidth, inset: boardInset }; }""")
        check(r["inset"] > 0 and r["dl"] >= r["pr"] - 0.5 and r["dr"] <= r["W"] - 8 + 0.5,
              f"док, прижатый {'влево' if off.startswith('-') else 'вправо'}, после открытия панели — в оставшейся части ({r['dl']:.0f}…{r['dr']:.0f}, панель до {r['pr']:.0f})")
        # и тянется за точку захвата при открытой панели
        s0 = st(page)
        x0, y0 = grab_point(s0, "g1", 0.5, 0.5)
        page.mouse.move(x0, y0); page.mouse.down()
        direction = 1 if off.startswith("-") else -1
        follow(page, "g1", 0.5, 0.5, [(x0 + direction * 6 * k, y0) for k in range(1, 30)],
               f"при открытой панели тренажёров, от {'левого' if direction > 0 else 'правого'} края")
        page.mouse.up()
        page.close()


def main():
    blocks = sys.argv[1:] or list("ABCDEFGH")
    errors = []
    with local_server(), sync_playwright() as p:
        browser = p.chromium.launch()
        ctx = browser.new_context()
        if "A" in blocks: block_a(ctx)
        if "B" in blocks: block_b(ctx)
        if "C" in blocks: block_c(ctx)
        if "D" in blocks: block_d(ctx)
        if "E" in blocks: block_e(ctx, errors)
        if "F" in blocks: block_f(ctx, errors)
        if "G" in blocks: block_g(ctx, errors)
        if "H" in blocks: block_h(ctx, errors)
        browser.close()
    check(not errors, "нет ошибок JavaScript" + (f": {errors[:3]}" if errors else ""))
    print()
    print("ИТОГ:", "всё прошло" if not FAILS else f"провалов: {len(FAILS)}")
    sys.exit(1 if FAILS else 0)


if __name__ == "__main__":
    main()
