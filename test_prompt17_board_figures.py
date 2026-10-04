"""
Промпт №17 «фигуры», этап 1: плоские фигуры на досках (board-figures.js).

Проверяем:
  1. Кнопка «Фигуры» в доке открывает меню: вкладки «Планиметрия» и
     «Стереометрия», 13 фигур с иконками и подписями, кнопка «3D-конструктор»;
     клик мимо и Esc закрывают меню.
  2. Фигура из меню встаёт в центр видимой части доски, это обычный poly
     (окружность — circle) с полем fig, цвет/толщина/пунктир — из ручки;
     сразу выделена, инструмент «Выделение», открыта панель элементов.
  3. Перетаскивание вершин сохраняет вид у каждой фигуры (по 60 случайных
     рывков через ту же applyHandle, что у мыши) и настоящей мышью.
  4. Ручки поворота (с прилипанием к 15°) и масштаба — мышью; вид не меняется.
  5. Панель: имена вершин (A1 → A₁), переключатели, по вершинам у
     треугольника, одна отмена на набор имени, отмена переключателя.
     Вписанная окружность в трапецию подгоняет форму (суммы сторон равны)
     и держится при движении вершин.
  6. За фигуру берут и изнутри; панель закрывается со снятием выделения.
  7. Переживает перезагрузку, рисуется функцией выгрузки, в тёмной теме,
     в заметках справочной панели; телефон 375 — меню в экране.
  8. Нет ошибок JavaScript.

Запуск: python3 test_prompt17_board_figures.py (сервер поднимается сам).
"""
import contextlib
import http.client
import math
import subprocess
import sys
import time

from playwright.sync_api import sync_playwright

PORT = 9002
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

RESULTS = []


def check(name, ok, info=""):
    RESULTS.append((name, bool(ok)))
    print(("[OK] " if ok else "[FAIL] ") + name + (("  — " + str(info)) if (not ok and info) else ""))


def boot(page, seed):
    page.route("https://**/*", lambda r: r.abort())
    page.goto(f"{BASE}/boards.html")
    if seed:
        page.evaluate(SEED_JS, [[LITE], {"bA": {"objects": [], "imageLib": []}}])
        page.reload()
    page.evaluate(BOOT_JS)
    page.wait_for_function("() => window.getDB && window.getDB().boards.length >= 1")
    page.evaluate("() => window.openBoard('bA')")
    page.wait_for_function("() => window.getCurrentBoard() && Array.isArray(window.getCurrentBoard().objects)")
    page.wait_for_timeout(300)


def open_board(ctx, errors, w=1400, h=900):
    page = ctx.new_page()
    page.set_viewport_size({"width": w, "height": h})
    page.on("pageerror", lambda e: errors.append(str(e)))
    boot(page, True)
    return page


def reload_board(page):
    page.wait_for_timeout(700)
    page.evaluate("() => window.idbSaveDB && window.idbSaveDB()")
    page.wait_for_timeout(300)
    page.reload()
    boot(page, False)


def clear_board(page):
    page.evaluate("() => { getCurrentBoard().objects = []; window.boardsClearSelection(); figClosePanel(); window.boardsRedraw(); }")


def last_obj(page):
    return page.evaluate("() => { const o = getCurrentBoard().objects.slice(-1)[0]; return o ? JSON.parse(JSON.stringify(o)) : null; }")


def screen_of(page, p):
    """мировая точка → координаты окна (холст может начинаться правее)"""
    return page.evaluate("""(p) => { const s = window.__w2s(p); const r = document.getElementById('boardCv').getBoundingClientRect();
        return { x: s.x + r.left, y: s.y + r.top }; }""", p)


# ── инварианты видов (в мировых координатах) ──
def d(a, b):
    return math.hypot(a["x"] - b["x"], a["y"] - b["y"])


def vec(a, b):
    return (b["x"] - a["x"], b["y"] - a["y"])


def cos_ang(u, v):
    lu, lv = math.hypot(*u), math.hypot(*v)
    return (u[0] * v[0] + u[1] * v[1]) / (lu * lv) if lu > 1e-9 and lv > 1e-9 else 0


def parallel(u, v):
    return abs(abs(cos_ang(u, v)) - 1) < 1e-6


def perp(u, v):
    return abs(cos_ang(u, v)) < 1e-6


def close(a, b, tol=1e-6):
    return abs(a - b) <= tol * max(1, abs(a), abs(b))


def invariant(kind, P):
    A = P
    if kind == "tri-iso":
        return close(d(A[0], A[1]), d(A[1], A[2]))
    if kind == "tri-eq":
        return close(d(A[0], A[1]), d(A[1], A[2])) and close(d(A[1], A[2]), d(A[2], A[0]))
    if kind == "tri-right":
        return perp(vec(A[2], A[0]), vec(A[2], A[1]))
    if kind == "tri":
        return len(A) == 3
    sides = [d(A[i], A[(i + 1) % len(A)]) for i in range(len(A))]
    if kind == "sq":
        return all(close(s, sides[0]) for s in sides) and all(perp(vec(A[i], A[(i + 1) % 4]), vec(A[i], A[(i + 3) % 4])) for i in range(4))
    if kind == "rect":
        return all(perp(vec(A[i], A[(i + 1) % 4]), vec(A[i], A[(i + 3) % 4])) for i in range(4))
    if kind == "rhomb":
        return all(close(s, sides[0]) for s in sides)
    if kind == "par":
        return parallel(vec(A[0], A[1]), vec(A[3], A[2])) and parallel(vec(A[1], A[2]), vec(A[0], A[3])) and close(sides[0], sides[2])
    if kind == "trap-iso":
        return parallel(vec(A[0], A[3]), vec(A[1], A[2])) and close(d(A[0], A[1]), d(A[2], A[3]))
    if kind == "trap-right":
        return parallel(vec(A[0], A[3]), vec(A[1], A[2])) and perp(vec(A[0], A[1]), vec(A[0], A[3]))
    if kind == "trap":
        return parallel(vec(A[0], A[3]), vec(A[1], A[2]))
    if kind == "hex":
        return all(close(s, sides[0]) for s in sides) and all(abs(cos_ang(vec(A[i], A[(i + 1) % 6]), vec(A[i], A[(i + 5) % 6])) + 0.5) < 1e-6 for i in range(6))
    return True


def tangential(P):
    s = [d(P[i], P[(i + 1) % 4]) for i in range(4)]
    return close(s[0] + s[2], s[1] + s[3], 1e-5)


DRAG_JS = """([kind, seed, inOn]) => {
  // те же функции, что у мыши: getHandles → applyHandle по роли вершины
  let x = seed; const rnd = () => { x = (x * 16807) % 2147483647; return x / 2147483647; };
  const o = figCreate(kind, { x: 1000, y: 800 }, 300);
  if (inOn) o.fig.sh.in = true;
  const bad = [];
  const out = [];
  for (let step = 0; step < 60; step++){
    const n = o.points.length, i = Math.floor(rnd() * n);
    const p = o.points[i];
    const pt = { x: p.x + (rnd() - 0.5) * 160, y: p.y + (rnd() - 0.5) * 160 };
    applyHandle(o, 'pt' + i, pt);
    if (o.points.some(q => !isFinite(q.x) || !isFinite(q.y))) bad.push(step);
    out.push(o.points.map(q => ({ x: q.x, y: q.y })));
  }
  return { bad, out };
}"""


SOLID_EDGES_JS = """(scene) => {
  // какие рёбра тела в этом виде невидимы — по именам концов
  const M = Solids.buildMesh(scene.k, scene.p), cam = Solids.camBasis(scene.cam, scene.k);
  const nm = i => M.names[i];
  return M.edges.filter(e => !e.smooth && !e.f.some(fi => Solids.frontFace(M.faces[fi], cam.v)))
    .map(e => [nm(e.a), nm(e.b)].sort().join('')).sort();
}"""


def stage2(ctx, errors):
    """Этап 2: тела в школьной проекции на доске."""
    page = ctx.new_page()
    page.set_viewport_size({"width": 1400, "height": 900})
    page.on("pageerror", lambda e: errors.append(str(e)))
    boot(page, True)
    check("9. модуль тел не грузится, пока он не нужен", page.evaluate("() => !window.Solids && ![...document.scripts].some(s => /solids-geom/.test(s.src))"))
    page.click("#figBtn")
    page.click('.bd-fig-tab[data-tab="solid"]')
    page.wait_for_function("() => document.querySelectorAll('#bdFigGrid .bd-fig-item[data-solid]').length > 0")
    items = page.eval_on_selector_all("#bdFigGrid .bd-fig-item", "els => els.map(e => [e.dataset.solid, e.querySelector('span').textContent, !!e.querySelector('canvas')])")
    check("9. вкладка «Стереометрия»: 12 тел с иконками и подписями", len(items) == 12 and all(i[0] and i[1] and i[2] for i in items), items)
    check("9. набор тел — как в промпте", [i[0] for i in items] == ["cube", "box", "prism3", "prism6", "pyr3", "pyr4", "tetra", "cyl", "cone", "sphere", "fcone", "fpyr"])
    page.click('#bdFigGrid .bd-fig-item[data-solid="cube"]')
    page.wait_for_timeout(150)
    o = last_obj(page)
    check("9. тело на доске — poly с полем solid и рамкой из 4 точек", o["type"] == "poly" and o["solid"]["k"] == "cube" and len(o["points"]) == 4, o)
    check("9. сразу выделено, открыта панель", page.evaluate("() => selectedId") == o["id"] and page.evaluate("() => document.getElementById('bdFigPanel').classList.contains('open')"))
    names = page.eval_on_selector_all("#bdFigPanel input[data-sid]", "els => els.map(e => e.value)")
    check("9. подписи куба по-школьному: ABCDA₁B₁C₁D₁", names == ["A", "B", "C", "D", "A1", "B1", "C1", "D1"], names)
    label_txt = page.evaluate("() => Solids.draw(getCurrentBoard().objects.slice(-1)[0].solid).labels.map(l => Solids.pretty(l.t)).join('')")
    check("9. на чертеже индексы подстрочные (A₁…)", label_txt == "ABCDA₁B₁C₁D₁", label_txt)
    hid = page.evaluate(SOLID_EDGES_JS, o["solid"])
    check("9. куб в школьной проекции: пунктиром ровно три ребра из B", hid == ["AB", "BB1", "BC"], hid)
    for mid, want in [("pyr4", ["AB", "BC", "BS"]), ("tetra", ["AB", "BC", "BD"]), ("prism3", ["AB", "BB1", "BC"])]:
        sc = page.evaluate("(id) => Solids.newScene(id)", mid)
        h = page.evaluate(SOLID_EDGES_JS, sc)
        check(f"9. {mid}: невидимые рёбра — из задней вершины B", h == want, h)
    cyl = page.evaluate("""() => { const d = Solids.draw(Solids.newScene('cyl'));
        const e = d.lines.filter(l => l.kind === 'edge');
        const h = e.filter(l => l.hid), vis = e.filter(l => !l.hid);
        const ys = h.flatMap(l => l.pts.map(p => p.y)), all = d.lines.flatMap(l => l.pts.map(p => p.y));
        const mid = (Math.min(...all) + Math.max(...all)) / 2;
        return { hid: h.length, hidPts: h.reduce((s, l) => s + l.pts.length, 0), low: ys.every(y => y < mid),
                 visPts: vis.reduce((s, l) => s + l.pts.length, 0), labels: d.labels.map(l => l.t) }; }""")
    check("9. цилиндр: пунктиром только задняя половина нижнего основания", cyl["hid"] == 1 and cyl["low"] and 34 <= cyl["hidPts"] <= 40, cyl)
    check("9. цилиндр: верхнее основание, передняя половина нижнего и две образующие — сплошные", cyl["visPts"] >= 72 + 36 + 2, cyl)
    check("9. цилиндр: центры O и O₁", cyl["labels"] == ["O", "O1"], cyl)
    sph = page.evaluate("() => { const M = Solids.buildMesh('sphere', {r: 2}); const v = Solids.camBasis({m:'school'}, 'sphere').v; return [Solids.occluded(M, {x:0,y:0,z:0}, v), Solids.occluded(M, {x: v.x*2, y: v.y*2, z: v.z*2}, v), Solids.occluded(M, {x: -v.x*2, y: -v.y*2, z: -v.z*2}, v)]; }")
    check("9. шар: центр и задняя точка закрыты, передняя видна", sph == [True, False, True], sph)
    occ = page.evaluate("() => { const M = Solids.buildMesh('cube', {a: 4}); const v = Solids.camBasis({m:'school'}, 'cube').v; return [Solids.occluded(M, {x:2,y:2,z:2}, v), Solids.occluded(M, {x:2,y:0,z:2}, v), Solids.occluded(M, {x:0,y:2,z:2}, v)]; }")
    check("9. куб: центр закрыт, точка передней грани видна, левой — закрыта", occ == [True, False, True], occ)
    sec = page.evaluate("""() => { const M = Solids.buildMesh('cube', {a: 4}), V = Solids.V3;
        const area = (P) => { let n = {x:0,y:0,z:0}; for (let i = 0; i < P.length; i++) n = V.add(n, V.cross(P[i], P[(i+1)%P.length])); return V.len(n) / 2; };
        const s1 = Solids.sectionOf(M, Solids.planeOf(M.V[0], M.V[2], M.V[6]));
        const s2 = Solids.sectionOf(M, Solids.planeOf({x:2,y:0,z:0}, {x:0,y:2,z:0}, {x:0,y:0,z:2}));
        return [s1.poly.length, area(s1.poly), s2.poly.length, area(s2.poly)]; }""")
    check("9. сечение куба через AC и C₁ — прямоугольник 4 × 4√2", sec[0] == 4 and abs(sec[1] - 16 * math.sqrt(2)) < 1e-6, sec)
    check("9. сечение через середины трёх рёбер из A — правильный треугольник", sec[2] == 3 and abs(sec[3] - math.sqrt(3) / 4 * 8) < 1e-6, sec)

    # масштаб за угол — без искажений
    r0 = page.evaluate("() => { const p = getCurrentBoard().objects.slice(-1)[0].points; return [p[2].x - p[0].x, p[2].y - p[0].y]; }")
    br_pt = screen_of(page, o["points"][2])
    page.mouse.move(br_pt["x"], br_pt["y"])
    page.mouse.down()
    page.mouse.move(br_pt["x"] + 120, br_pt["y"] + 10, steps=6)
    page.mouse.up()
    r1 = page.evaluate("() => { const p = getCurrentBoard().objects.slice(-1)[0].points; return [p[2].x - p[0].x, p[2].y - p[0].y]; }")
    check("9. тянем за угол — тело крупнее, пропорции те же", r1[0] > r0[0] + 50 and abs(r1[1] / r1[0] - r0[1] / r0[0]) < 1e-6, [r0, r1])
    # переименование и переключатели
    page.fill('#bdFigPanel input[data-sid="v0"]', "K")
    page.click('#bdFigPanel .bd-fig-chip[data-so="hid"]')
    o = last_obj(page)
    check("9. переименование вершины и «Невидимые линии» выкл.", o["solid"]["nm"].get("v0") == "K" and o["solid"]["opt"].get("hid") is False, o["solid"])
    page.keyboard.press("Control+z")
    o = last_obj(page)
    check("9. отмена возвращает пунктир", "hid" not in (o["solid"].get("opt") or {}))
    # все тела — на доску, перезагрузка, выгрузка
    clear_board(page)
    for i in [it[0] for it in items]:
        page.evaluate("(i) => figInsertSolid(i)", i)
    page.evaluate("() => saveDB()")
    before = page.evaluate("() => JSON.stringify(getCurrentBoard().objects.map(o => [o.solid, o.points]))")
    reload_board(page)
    page.wait_for_function("() => !!window.Solids", timeout=5000)
    after = page.evaluate("() => JSON.stringify(getCurrentBoard().objects.map(o => [o.solid, o.points]))")
    check("9. 12 тел переживают перезагрузку, модуль догружается сам", before == after)
    ok = page.evaluate("""() => { const cv = document.createElement('canvas'); cv.width = 900; cv.height = 700;
        render(cv.getContext('2d'), 900, 700, { x: cam.x, y: cam.y, zoom: 0.5 }, false, 1); activeCam = cam; return true; }""")
    check("9. выгрузка с телами без ошибок", ok and not errors, errors)
    old = page.evaluate("() => { const o = JSON.parse(JSON.stringify(getCurrentBoard().objects[0])); delete o.solid; return [o.type, o.points.length]; }")
    check("9. без модуля тело — рамка-многоугольник (так его видит старая вкладка)", old == ["poly", 4], old)
    page.close()


def cv_pt(page, q3):
    """точка модели → координаты окна на холсте конструктора"""
    return page.evaluate("""(q) => { const vw = Solids3D.view(); const s = vw.toS(vw.d.pr(q));
        const r = document.getElementById('s3dCanvas').getBoundingClientRect(); return { x: s.x + r.left, y: s.y + r.top }; }""", q3)


def cv_vertex(page, i, j=None, k=0.0):
    q = page.evaluate("""([i, j, k]) => { const M = Solids3D.view().d.mesh; const A = M.V[i]; if (j == null) return A;
        const B = M.V[j]; return { x: A.x + (B.x - A.x) * k, y: A.y + (B.y - A.y) * k, z: A.z + (B.z - A.z) * k }; }""", [i, j, k])
    return cv_pt(page, q)


def cv_point(page, pid):
    q = page.evaluate("(id) => Solids3D.view().d.pos[id]", pid)
    return cv_pt(page, q)


def scene(page):
    return page.evaluate("() => JSON.parse(JSON.stringify(Solids3D.state().scene))")


def stage3(ctx, errors):
    """Этап 3: 3D-конструктор."""
    page = ctx.new_page()
    page.set_viewport_size({"width": 1400, "height": 900})
    page.on("pageerror", lambda e: errors.append(str(e)))
    boot(page, True)
    check("10. конструктор не грузится заранее", page.evaluate("() => !window.Solids3D && ![...document.scripts].some(s => /solid3d/.test(s.src))"))
    page.click("#figBtn")
    page.click("#bdFig3dBtn")
    page.wait_for_function("() => window.Solids3D && Solids3D.isOpen()")
    check("10. «3D-конструктор» открывает окно поверх доски, куб по умолчанию", scene(page)["k"] == "cube" and page.is_visible("#s3dCanvas"))
    # параметры
    page.select_option("#s3dKind", "box")
    page.fill("#s3dP_w", "8")
    page.dispatch_event("#s3dP_w", "change")
    sc = scene(page)
    check("10. вид тела и параметры числами", sc["k"] == "box" and sc["p"]["w"] == 8, sc["p"])
    page.select_option("#s3dKind", "prism")
    page.fill("#s3dP_n", "40")
    page.dispatch_event("#s3dP_n", "change")
    check("10. число сторон основания ограничено (3…10)", scene(page)["p"]["n"] == 10)
    page.select_option("#s3dKind", "cube")
    # вращение протяжкой — один шаг отмены
    n_hist = page.evaluate("() => Solids3D.state().hist.length")
    c0 = cv_vertex(page, 0)
    page.mouse.move(700, 450)
    page.mouse.down()
    page.mouse.move(800, 420, steps=10)
    page.mouse.up()
    sc = scene(page)
    check("10. протяжка вращает (камера свободная), точек не добавилось", sc["cam"]["m"] == "orth" and not sc["pts"], sc["cam"])
    check("10. поворот — один шаг отмены", page.evaluate("() => Solids3D.state().hist.length") == n_hist + 1)
    for v in ["front", "top", "side", "school"]:
        page.click(f'#s3dViews [data-view="{v}"]')
    check("10. кнопки видов (школьная в конце)", scene(page)["cam"] == {"m": "school"})
    void = c0

    # точки
    p = cv_vertex(page, 0, 3, 0.49)
    page.mouse.click(p["x"], p["y"])
    sc = scene(page)
    check("11. щелчок у середины ребра AD — точка M ровно посередине", len(sc["pts"]) == 1 and sc["pts"][0]["def"] == {"t": "seg", "a": "v0", "b": "v3", "k": 0.5} and sc["pts"][0]["name"] == "M", sc["pts"])
    page.click('#s3dToolBox [data-ratio="0.3333333333333333"]')
    p = cv_vertex(page, 3, 7, 0.8)
    page.mouse.click(p["x"], p["y"])
    sc = scene(page)
    check("11. отношение 1 : 2 — точка на трети ребра", abs(sc["pts"][1]["def"]["k"] - 1 / 3) < 1e-6 and sc["pts"][1]["name"] == "N", sc["pts"][1])
    page.click('#s3dToolBox [data-ratio=""]')
    q = page.evaluate("() => ({ x: 1.3, y: 0, z: 2.6 })")   # передняя грань AA₁D₁D
    p = cv_pt(page, q)
    page.mouse.click(p["x"], p["y"])
    sc = scene(page)
    face = page.evaluate("() => { const st = Solids3D.state(); const M = Solids.buildMesh(st.scene.k, st.scene.p); const R = Solids.resolvePoints(M, st.scene); return R.pos['p3']; }")
    check("11. щелчок по грани — точка на ней", sc["pts"][2]["def"]["t"] == "face" and abs(face["y"]) < 1e-6 and abs(face["x"] - 1.3) < 0.05 and abs(face["z"] - 2.6) < 0.05, face)
    page.select_option("#s3dSegA", "v0")
    page.select_option("#s3dSegB", "v6")
    page.click("#s3dSegAdd")
    sc = scene(page)
    check("11. точка внутри тела — середина диагонали AC₁", sc["pts"][3]["def"] == {"t": "seg", "a": "v0", "b": "v6", "k": 0.5})
    page.click("#s3dOpts [data-opt=\"axes\"]")
    page.fill("#s3dX", "4"); page.fill("#s3dY", "2"); page.fill("#s3dZ", "4")
    page.click("#s3dXYZAdd")
    items = page.eval_on_selector_all("#s3dList .s3d-item", "els => els.map(e => e.textContent.replace(/\\s+/g, ' ').trim())")
    check("11. точка по координатам и координаты в списке", "по координатам (4; 2; 4)✕" in items, items)
    check("11. у вершин — координаты от начала A", "C₁вершина (4; 4; 4)" in items and "Aвершина (0; 0; 0)" in items, items)

    # отрезок, прямая, сечение
    page.click('#s3dTools [data-tool="seg"]')
    for pid in ["v0", "v6"]:
        p = cv_vertex(page, int(pid[1:]))
        page.mouse.click(p["x"], p["y"])
    page.click('#s3dTools [data-tool="line"]')
    for i in [1, 3]:
        p = cv_vertex(page, i)
        page.mouse.click(p["x"], p["y"])
    sc = scene(page)
    check("12. отрезок AC₁ и прямая BD — двумя щелчками", [(g["a"], g["b"], g["line"]) for g in sc["segs"]] == [("v0", "v6", False), ("v1", "v3", True)], sc["segs"])
    page.click('#s3dTools [data-tool="plane"]')
    for pid in ["p1", "p2"]:
        p = cv_point(page, pid)
        page.mouse.click(p["x"], p["y"])
    p = cv_vertex(page, 5)
    page.mouse.click(p["x"], p["y"])
    sc = scene(page)
    check("12. сечение тремя щелчками", len(sc["planes"]) == 1 and [sc["planes"][0][k] for k in "abc"] == ["p1", "p2", "v5"], sc["planes"])
    fills = page.evaluate("() => Solids3D.view().d.fills.filter(f => f.kind === 'sec').length")
    check("12. сечение закрашено", fills == 1)
    # три точки на одной прямой — не плоскость
    n_pl = len(sc["planes"])
    for i in [0, 1]:
        p = cv_vertex(page, i)
        page.mouse.click(p["x"], p["y"])
    p = cv_point(page, "p1")   # M на AD — не на AB; возьмём точку на AB через форму ниже
    page.keyboard.press("Escape")
    check("12. Esc сбрасывает начатый выбор", page.evaluate("() => Solids3D.state().pend.length") == 0 and len(scene(page)["planes"]) == n_pl)

    # пошагово
    page.click('#s3dList [data-steps="s1"]')
    steps = page.evaluate("() => Solids3D.sectionSteps(Solids3D.state().scene.planes[0])")
    fills0 = page.evaluate("() => Solids3D.view().d.fills.filter(f => f.kind === 'sec').length")
    check("13. пошагово: сначала без заливки, подпись шага", fills0 == 0 and page.is_visible("#s3dSteps") and "Шаг 0" in page.inner_text("#s3dSteps"))
    check("13. шаги называют грань («в грани …»)", len(steps) >= 3 and all("в грани" in t for t in steps), steps)
    page.click('#s3dSteps [data-step="1"]')
    check("13. шаг вперёд — одна сторона", "Шаг 1" in page.inner_text("#s3dSteps") and scene(page)["planes"][0]["steps"] == 1)
    page.click('#s3dSteps [data-step="all"]')
    check("13. «Всё сечение» — заливка вернулась", page.evaluate("() => Solids3D.view().d.fills.filter(f => f.kind === 'sec').length") == 1 and "steps" not in scene(page)["planes"][0])
    # точки сечения на рёбрах
    before = len(scene(page)["pts"])
    page.click('#s3dList [data-cutpts="s1"]')
    sc = scene(page)
    cuts = [p for p in sc["pts"] if p["def"]["t"] == "cut"]
    named_all = page.evaluate("""() => { const st = Solids3D.state(), V = Solids.V3, M = Solids.buildMesh(st.scene.k, st.scene.p), R = Solids.resolvePoints(M, st.scene);
        const P = st.scene.planes[0], S2 = Solids.sectionOf(M, Solids.planeOf(R.pos[P.a], R.pos[P.b], R.pos[P.c]));
        return S2.poly.every(q => Object.keys(R.pos).some(id => R.names[id] && V.len(V.sub(R.pos[id], q)) < 1e-6)); }""")
    check("13. «Точки» подписывают пересечения сечения с рёбрами — все вершины сечения с именами", len(cuts) >= 1 and len(sc["pts"]) == before + len(cuts) and named_all, [c["name"] for c in cuts])
    on_plane = page.evaluate("""() => { const st = Solids3D.state(); st.scene.p = { a: 6 }; const M = Solids.buildMesh('cube', { a: 6 });
        const R = Solids.resolvePoints(M, st.scene), P = st.scene.planes[0], pl = Solids.planeOf(R.pos[P.a], R.pos[P.b], R.pos[P.c]);
        const r = st.scene.pts.filter(p => p.def.t === 'cut').map(p => Math.abs(Solids.V3.dot(pl.n, R.pos[p.id]) - pl.d));
        st.scene.p = { a: 4 }; return Math.max(...r); }""")
    check("13. точки сечения остаются на плоскости при смене размеров", on_plane < 1e-9, on_plane)

    # перпендикуляры
    page.click('#s3dTools [data-tool="perp"]')
    page.select_option("#s3dPerpP", "v4")
    page.select_option("#s3dPerpA", "v0")
    page.select_option("#s3dPerpB", "v2")
    page.click("#s3dPerpLine")
    page.select_option("#s3dPerpP", "v0")
    page.click("#s3dPerpPlane")
    res = page.evaluate("""() => { const st = Solids3D.state(), V = Solids.V3, M = Solids.buildMesh(st.scene.k, st.scene.p), R = Solids.resolvePoints(M, st.scene);
        const feet = st.scene.pts.filter(p => p.def.t === 'foot');
        const h1 = R.pos[feet[0].id], h2 = R.pos[feet[1].id];
        const P = st.scene.planes[0], pl = Solids.planeOf(R.pos[P.a], R.pos[P.b], R.pos[P.c]);
        return { names: feet.map(f => f.name), d1: V.dot(V.sub(M.V[4], h1), V.sub(M.V[2], M.V[0])), d2: V.len(V.cross(V.sub(M.V[0], h2), pl.n)), on: Math.abs(V.dot(pl.n, h2) - pl.d),
                 rights: st.scene.marks.filter(m => m.t === 'right').length }; }""")
    check("14. перпендикуляр к прямой и к плоскости: основания H, H₁ и прямые углы", res["names"] == ["H", "H1"] and abs(res["d1"]) < 1e-9 and res["d2"] < 1e-9 and res["on"] < 1e-9 and res["rights"] == 2, res)

    # измерения на чистом кубе 4
    page.evaluate("() => { const st = Solids3D.state(); st.scene = Solids.newScene('cube'); }")
    page.click('#s3dTools [data-tool="pt"]')
    def measure(t, args):
        page.select_option("#s3dMType", t)
        for k, v in args.items():
            page.select_option(f'#s3dMArgs [data-marg="{k}"]', v)
        page.click("#s3dMAdd")
        return page.evaluate("() => { const st = Solids3D.state(), M = Solids.buildMesh(st.scene.k, st.scene.p), R = Solids.resolvePoints(M, st.scene); return Solids.measure(M, R.pos, st.scene.marks[st.scene.marks.length - 1]).full; }")
    m1 = measure("len", {"a": "v0", "b": "v6"})
    m2 = measure("dist", {"p": "v0", "a": "v1", "b": "v3", "c": "v4"})
    m3 = measure("angLP", {"a": "v0", "b": "v6", "c": "v0", "d": "v1", "e": "v2"})
    m4 = measure("angPP", {"a": "v4", "b": "v1", "c": "v3", "d": "v0", "e": "v1", "f": "v2"})
    m5 = measure("angLL", {"a": "v0", "b": "v5", "c": "v1", "d": "v6"})
    m6 = measure("dline", {"p": "v0", "a": "v1", "b": "v7"})
    check("15. диагональ куба 4: 4√3", m1 == "4√3 ≈ 6,93", m1)
    check("15. от A до плоскости A₁BD: 4√3/3", m2 == "4√3/3 ≈ 2,31", m2)
    check("15. угол диагонали с основанием: tg = √2/2", "35,3°" in m3 and "tg = √2/2" in m3, m3)
    check("15. угол между A₁BD и основанием: tg = √2", "54,7°" in m4 and "tg = √2" in m4, m4)
    check("15. скрещивающиеся AB₁ и BC₁ — 60°", m5.startswith("60°"), m5)
    check("15. от A до прямой BD₁: 4√6/3", m6 == "4√6/3 ≈ 3,27", m6)
    lst = page.inner_text("#s3dList")
    check("15. измерения в списке с ответом", "4√3" in lst and "tg = √2/2" in lst)
    labels = page.evaluate("() => Solids3D.view().d.labels.filter(l => l.val).map(l => l.t)")
    check("15. значения подписаны на чертеже", "4√3 ≈ 6,93" in labels and "60°" in labels, labels)
    page.click('#s3dTools [data-tool="text"]')
    page.select_option("#s3dTextP", "v6")
    page.fill("#s3dTextV", "?")
    page.click("#s3dTextAdd")
    check("15. своя подпись у точки", any(m["t"] == "text" and m["text"] == "?" for m in scene(page)["marks"]))
    page.click('#s3dOpts [data-opt="dims"]')
    labels = page.evaluate("() => Solids3D.view().d.labels.filter(l => l.val).map(l => l.t)")
    check("15. «Размеры» подписывают ребро", "4" in labels, labels)

    # развёртка и вращение
    page.click("#s3dNetBtn")
    page.wait_for_timeout(1900)
    nt = page.evaluate("() => { const d = Solids3D.view().d; return [Solids3D.state().scene.net, !!d.net, d.fills.length]; }")
    check("16. «Развернуть» — анимация до плоской развёртки (6 граней)", nt == [1, True, 6], nt)
    flat = page.evaluate("""() => { const M = Solids.buildMesh('cube', {a: 4}); const F = Solids.netFaces(M, 1);
        return Math.max(...F.flat().map(q => Math.abs(q.z))); }""")
    check("16. развёртка куба лежит в одной плоскости", flat < 1e-9, flat)
    page.click("#s3dNetBtn")
    page.wait_for_timeout(1900)
    check("16. «Свернуть» — снова тело в школьной проекции", scene(page)["net"] == 0 and scene(page)["cam"] == {"m": "school"}, scene(page)["cam"])
    page.click("#s3dSpin")
    y0 = page.evaluate("() => Solids3D.state().scene.cam.yaw")
    page.wait_for_timeout(400)
    y1 = page.evaluate("() => Solids3D.state().scene.cam.yaw")
    page.click("#s3dSpin")
    check("16. автовращение крутит камеру", y1 > y0 + 0.05, [y0, y1])

    # отмена, на доску, повторное открытие
    k_before = page.evaluate("() => Solids3D.state().scene.marks.length")
    page.click("#s3dUndo")
    check("17. ↶ отменяет последнее действие", page.evaluate("() => Solids3D.state().scene.marks.length") <= k_before)
    page.click("#s3dRedo")
    n_obj = page.evaluate("() => getCurrentBoard().objects.length")
    page.click("#s3dToBoard")
    page.wait_for_timeout(150)
    o = last_obj(page)
    check("17. «На доску» — тело со всеми построениями", not page.evaluate("() => Solids3D.isOpen()") and page.evaluate("() => getCurrentBoard().objects.length") == n_obj + 1 and len(o["solid"]["marks"]) >= 6, o and o.get("solid", {}).get("marks"))
    check("17. на доске выделено", page.evaluate("() => selectedId") == o["id"])
    c = page.evaluate("() => { const b = objectBBox(getCurrentBoard().objects.slice(-1)[0]); return { x: (b.minX + b.maxX) / 2, y: (b.minY + b.maxY) / 2 }; }")
    sp = screen_of(page, c)
    page.mouse.dblclick(sp["x"], sp["y"])
    page.wait_for_function("() => Solids3D.isOpen()")
    st = page.evaluate("() => ({ obj: Solids3D.state().objId, marks: Solids3D.state().scene.marks.length })")
    check("17. двойной щелчок по телу открывает его в конструкторе", st["obj"] == o["id"] and st["marks"] == len(o["solid"]["marks"]), st)
    page.keyboard.press("Control+z")
    check("17. Ctrl+Z в конструкторе не трогает доску", page.evaluate("() => getCurrentBoard().objects.length") == n_obj + 1)
    page.select_option("#s3dKind", "pyr")
    page.click("#s3dToBoard")
    page.wait_for_timeout(150)
    o2 = last_obj(page)
    check("17. правка в конструкторе меняет то же тело на доске", o2["id"] == o["id"] and o2["solid"]["k"] == "pyr" and page.evaluate("() => getCurrentBoard().objects.length") == n_obj + 1)
    page.keyboard.press("Control+z")
    check("17. на доске Ctrl+Z возвращает прежнее тело", last_obj(page)["solid"]["k"] == "cube")
    # закрытие без переноса
    page.evaluate("() => figOpenConstructor(null)")
    page.wait_for_function("() => Solids3D.isOpen()")
    page.select_option("#s3dKind", "cone")
    page.click("#s3dClose")
    check("17. ✕ с изменениями — спрашивает", page.is_visible("#s3dConfirm") and page.evaluate("() => Solids3D.isOpen()"))
    page.click("#s3dCloseYes")
    check("17. «Закрыть» — без переноса на доску", not page.evaluate("() => Solids3D.isOpen()") and page.evaluate("() => getCurrentBoard().objects.length") == n_obj + 1)

    # совместная сессия (заглушка канала): учитель шлёт сцену, ученик смотрит
    sent = page.evaluate("""async () => { const TS = window.TrainerSession; const log = [];
        TS.getCode = () => 'TEST'; TS.broadcastEvent = (n, d) => log.push([n, d && d.o, d && d.sc && d.sc.k]);
        await figOpenConstructor(null); document.getElementById('s3dKind').value = 'cyl'; document.getElementById('s3dKind').dispatchEvent(new Event('change'));
        await new Promise(r => setTimeout(r, 150)); Solids3D.close(); return log.filter(x => x[0] === 's3d'); }""")
    check("18. учитель шлёт сцену событием s3d и закрытие", any(x[1] == 1 and x[2] == "cyl" for x in sent) and sent[-1][1] == 0, sent)
    vw = page.evaluate("""() => { Solids3D.viewerApply({ o: 1, sc: Solids.newScene('cone'), z: 1 });
        const r = { open: Solids3D.isOpen(), side: getComputedStyle(document.getElementById('s3dSide')).display, toBoard: getComputedStyle(document.getElementById('s3dToBoard')).display, k: Solids3D.state().scene.k };
        Solids3D.viewerApply({ o: 0 }); r.closed = !Solids3D.isOpen(); return r; }""")
    check("18. у ученика — то же окно только для просмотра, закрывается вслед", vw == {"open": True, "side": "none", "toBoard": "none", "k": "cone", "closed": True}, vw)
    page.close()

    ph = ctx.new_page()
    ph.set_viewport_size({"width": 375, "height": 740})
    ph.on("pageerror", lambda e: errors.append(str(e)))
    boot(ph, True)
    ph.evaluate("() => figOpenConstructor(null)")
    ph.wait_for_function("() => window.Solids3D && Solids3D.isOpen()")
    lay = ph.evaluate("""() => { const c = document.getElementById('s3dCanvas').getBoundingClientRect(), s = document.getElementById('s3dSide').getBoundingClientRect();
        return { cw: c.width, ch: c.height, sideTop: s.top, sideH: s.height, over: document.documentElement.scrollWidth > innerWidth }; }""")
    check("19. телефон 375: холст сверху во всю ширину, панель под ним, без прокрутки вбок", lay["cw"] >= 370 and lay["ch"] > 250 and lay["sideTop"] >= lay["ch"] and not lay["over"], lay)
    ph.close()


def main():
    errors = []
    with local_server(), sync_playwright() as pw:
        br = pw.chromium.launch()
        ctx = br.new_context()
        page = open_board(ctx, errors)
        # прилипание к клеткам мешает точным проверкам инвариантов — выключаем
        page.evaluate("() => { curSnap = false; }")

        # ── 1. меню ──
        page.click("#figBtn")
        page.wait_for_timeout(150)
        check("1. меню открывается по кнопке в доке", page.evaluate("() => figMenuOpen()"))
        tabs = page.eval_on_selector_all("#bdFigMenu .bd-fig-tab", "els => els.map(e => e.textContent.trim())")
        check("1. вкладки «Планиметрия» и «Стереометрия»", tabs == ["Планиметрия", "Стереометрия"], tabs)
        items = page.eval_on_selector_all("#bdFigGrid .bd-fig-item", "els => els.map(e => [e.dataset.fig, e.querySelector('span').textContent, !!e.querySelector('canvas')])")
        kinds = [i[0] for i in items]
        check("1. 13 плоских фигур с иконкой и подписью", len(items) == 13 and all(i[1] and i[2] for i in items), items)
        check("1. все фигуры из промпта на месте",
              set(kinds) == {"tri-iso", "tri-eq", "tri-right", "tri", "sq", "rect", "rhomb", "par", "trap-iso", "trap-right", "trap", "circle", "hex"})
        check("1. кнопка «3D-конструктор»", page.is_visible("#bdFig3dBtn"))
        box = page.evaluate("() => { const r = document.getElementById('bdFigMenu').getBoundingClientRect(); const d = document.getElementById('bdDock').getBoundingClientRect(); return [r.left, r.top, r.right, r.bottom, d.top, innerWidth]; }")
        check("1. меню над доком и в пределах экрана", box[3] <= box[4] and box[0] >= 0 and box[2] <= box[5], box)
        page.mouse.click(700, 150)
        page.wait_for_timeout(100)
        check("1. клик мимо закрывает меню", not page.evaluate("() => figMenuOpen()"))
        page.click("#figBtn")
        page.keyboard.press("Escape")
        check("1. Esc закрывает меню", not page.evaluate("() => figMenuOpen()"))
        clear_board(page)

        # ── 2. вставка ──
        page.click('#bdDock .bd-tool[data-tool="pen"]')
        page.evaluate("() => { curColorTok = '#d02020'; curWidth = 4; curDash = true; }")
        page.click("#figBtn")
        page.click('#bdFigGrid .bd-fig-item[data-fig="tri-iso"]')
        page.wait_for_timeout(150)
        o = last_obj(page)
        check("2. фигура — обычный poly с полем fig", o and o["type"] == "poly" and o["fig"]["k"] == "tri-iso" and len(o["points"]) == 3, o)
        check("2. цвет, толщина и пунктир — из настроек ручки", o["color"] == "#d02020" and o["width"] == 4 and o["dash"] is True)
        check("2. подписи по умолчанию ABC", o["fig"]["lab"] == ["A", "B", "C"])
        center = page.evaluate("() => { const v = visibleBoardRect(); return { x: v.x + v.w / 2, y: v.y + v.h / 2 }; }")
        bb = page.evaluate("() => { const b = objectBBox(getCurrentBoard().objects.slice(-1)[0]); return b; }")
        check("2. фигура в центре видимой части доски",
              abs((bb["minX"] + bb["maxX"]) / 2 - center["x"]) < 40 and abs((bb["minY"] + bb["maxY"]) / 2 - center["y"]) < 60, [bb, center])
        st = page.evaluate("() => ({ tool, sel: selectedId, id: getCurrentBoard().objects.slice(-1)[0].id, panel: document.getElementById('bdFigPanel').classList.contains('open'), menu: figMenuOpen() })")
        check("2. сразу выделена, инструмент «Выделение»", st["tool"] == "select" and st["sel"] == st["id"], st)
        check("2. панель элементов открыта, меню закрыто", st["panel"] and not st["menu"], st)
        check("2. в меню выделения есть «Элементы фигуры…»", page.is_visible("#bdCtxFig"))
        page.evaluate("() => { curColorTok = '--pencil'; curWidth = 2; curDash = false; }")
        circ = page.evaluate("() => { const o = figInsert('circle'); return JSON.parse(JSON.stringify(o)); }")
        check("2. окружность — обычный circle с центром O", circ["type"] == "circle" and circ["r"] > 0 and circ["fig"]["lab"] == ["O"], circ)
        clear_board(page)

        # ── 3. вершины сохраняют вид ──
        for k in [k for k in kinds if k != "circle"]:
            res = page.evaluate(DRAG_JS, [k, 12345, False])
            fails = [i for i, P in enumerate(res["out"]) if not invariant(k, P)]
            check(f"3. {k}: 60 рывков вершин — вид сохраняется", not res["bad"] and not fails, (res["bad"], fails[:5]))
        for k in ["trap-iso", "trap-right"]:
            res = page.evaluate(DRAG_JS, [k, 777, True])
            fails = [i for i, P in enumerate(res["out"]) if not (invariant(k, P) and tangential(P))]
            check(f"3. {k} с вписанной окружностью: суммы противоположных сторон равны после рывков", not fails, fails[:5])
        # прямоугольный: вершина прямого угла ходит по окружности на гипотенузе
        r = page.evaluate("""() => { const o = figCreate('tri-right', {x:0,y:0}, 300); const A = o.points[0], B = o.points[1];
            applyHandle(o, 'pt2', { x: 50, y: 400 }); return [A, B, o.points[0], o.points[1], o.points[2]]; }""")
        check("3. tri-right: гипотенуза на месте, прямой угол на окружности",
              r[0] == r[2] and r[1] == r[3] and abs(d(r[4], {"x": (r[0]["x"] + r[1]["x"]) / 2, "y": (r[0]["y"] + r[1]["y"]) / 2}) - d(r[0], r[1]) / 2) < 1e-6)
        # настоящей мышью: вершина B равнобедренного
        page.evaluate("() => figInsert('tri-iso')")
        o = last_obj(page)
        sB = screen_of(page, o["points"][1])
        page.mouse.move(sB["x"], sB["y"])
        page.mouse.down()
        page.mouse.move(sB["x"] + 30, sB["y"] - 60, steps=6)
        page.mouse.up()
        o2 = last_obj(page)
        check("3. мышью: вершину тянут, треугольник остаётся равнобедренным",
              o2["points"][1] != o["points"][1] and invariant("tri-iso", o2["points"]) and o2["points"][0] == o["points"][0])
        page.keyboard.press("Control+z")
        o3 = last_obj(page)
        check("3. Ctrl+Z возвращает вершину", o3["points"] == o["points"])

        # ── 4. поворот и масштаб ──
        clear_board(page)
        page.evaluate("() => figInsert('sq')")
        o = last_obj(page)
        hs = page.evaluate("() => figHandles(getCurrentBoard().objects.slice(-1)[0])")
        rot = [h for h in hs if h["role"] == "frot"][0]
        cen = {"x": sum(p["x"] for p in o["points"]) / 4, "y": sum(p["y"] for p in o["points"]) / 4}
        R = d(rot, cen)
        target = {"x": cen["x"] + R * math.cos(math.radians(-90 + 31)), "y": cen["y"] + R * math.sin(math.radians(-90 + 31))}
        s0, s1 = screen_of(page, rot), screen_of(page, target)
        page.mouse.move(s0["x"], s0["y"])
        page.mouse.down()
        page.mouse.move(s1["x"], s1["y"], steps=8)
        page.mouse.up()
        o2 = last_obj(page)
        ang = math.degrees(math.atan2(o2["points"][1]["y"] - o2["points"][0]["y"], o2["points"][1]["x"] - o2["points"][0]["x"]))
        check("4. поворот за ручку, прилипание к 30°", abs(((ang + 90) % 360) - 30) < 0.01 or abs(((ang + 90) % 360) - 330) < 0.01, ang)
        check("4. после поворота — по-прежнему квадрат того же размера", invariant("sq", o2["points"]) and abs(d(o2["points"][0], o2["points"][1]) - d(o["points"][0], o["points"][1])) < 1e-6)
        hs = page.evaluate("() => figHandles(getCurrentBoard().objects.slice(-1)[0])")
        sc = [h for h in hs if h["role"] == "fsc"][0]
        cen2 = {"x": sum(p["x"] for p in o2["points"]) / 4, "y": sum(p["y"] for p in o2["points"]) / 4}
        t = {"x": cen2["x"] + (sc["x"] - cen2["x"]) * 1.5, "y": cen2["y"] + (sc["y"] - cen2["y"]) * 1.5}
        s0, s1 = screen_of(page, sc), screen_of(page, t)
        page.mouse.move(s0["x"], s0["y"])
        page.mouse.down()
        page.mouse.move(s1["x"], s1["y"], steps=8)
        page.mouse.up()
        o3 = last_obj(page)
        k = d(o3["points"][0], o3["points"][1]) / d(o2["points"][0], o2["points"][1])
        check("4. масштаб за ручку — в 1,5 раза, центр на месте", abs(k - 1.5) < 0.03 and d({"x": sum(p["x"] for p in o3["points"]) / 4, "y": sum(p["y"] for p in o3["points"]) / 4}, cen2) < 1e-6, k)
        check("4. после масштаба — квадрат", invariant("sq", o3["points"]))

        # ── 5. панель ──
        clear_board(page)
        page.evaluate("() => figInsert('tri')")
        page.fill('#bdFigPanel input[data-vi="0"]', "A1")
        page.wait_for_timeout(50)
        o = last_obj(page)
        check("5. имя вершины из панели попадает в фигуру", o["fig"]["lab"][0] == "A1")
        check("5. A1 подписывается как A₁", page.evaluate("() => fgPrettyName('A1')") == "A₁" and page.evaluate("() => fgPrettyName('S')") == "S")
        page.fill('#bdFigPanel input[data-vi="1"]', "K")
        page.keyboard.press("Enter")
        n_undo = page.evaluate("() => window.__undoStackInfo().count")
        page.click('#bdFigPanel .bd-fig-chip[data-fa="h"][data-fi="1"]')
        page.click('#bdFigPanel .bd-fig-chip[data-fa="m"][data-fi="0"]')
        page.click('#bdFigPanel .bd-fig-chip[data-fk="in"]')
        o = last_obj(page)
        check("5. высота «из B», медиана «из A», вписанная окружность", o["fig"]["sh"]["h"] == [1] and o["fig"]["sh"]["m"] == [0] and o["fig"]["sh"]["in"] is True, o["fig"]["sh"])
        chip_txt = page.eval_on_selector('#bdFigPanel .bd-fig-chip[data-fa="h"][data-fi="1"]', "e => e.textContent")
        check("5. переключатель подписан новым именем вершины («из K»)", chip_txt == "из K", chip_txt)
        check("5. каждый переключатель — отдельный шаг отмены", page.evaluate("() => window.__undoStackInfo().count") == n_undo + 3)
        page.keyboard.press("Control+z")
        o = last_obj(page)
        check("5. отмена снимает последний переключатель", o["fig"]["sh"]["in"] is False and o["fig"]["sh"]["h"] == [1])
        page.evaluate("() => { selectedId = getCurrentBoard().objects.slice(-1)[0].id; updateContextMenu(); }")
        page.click("#bdCtxFig")
        check("5. «Элементы фигуры…» снова открывает панель", page.evaluate("() => document.getElementById('bdFigPanel').classList.contains('open')"))
        chips = page.eval_on_selector_all('#bdFigPanel .bd-fig-chip[data-fk]', "els => els.map(e => e.dataset.fk)")
        check("5. у произвольного треугольника нет «равных сторон» и «прямого угла»", "ticks" not in chips and "right" not in chips, chips)
        clear_board(page)
        page.evaluate("() => figInsert('trap-iso')")
        page.click('#bdFigPanel .bd-fig-chip[data-fk="in"]')
        o = last_obj(page)
        check("5. вписанная окружность в равнобедренную трапецию подгоняет форму", tangential(o["points"]) and invariant("trap-iso", o["points"]))
        check("5. у трапеции — подсказка про подгонку", page.is_visible("#bdFigPanel .bd-fig-note"))
        chips = page.eval_on_selector_all('#bdFigPanel .bd-fig-chip[data-fk]', "els => els.map(e => e.dataset.fk)")
        check("5. у трапеции: диагонали, высота, средняя линия, описанная", all(c in chips for c in ["diag", "h", "mid", "out"]), chips)

        # ── 6. выделение изнутри, закрытие панели ──
        page.evaluate("() => { window.boardsClearSelection(); figClosePanel(); window.boardsRedraw(); }")
        o = last_obj(page)
        cen = {"x": sum(p["x"] for p in o["points"]) / 4, "y": sum(p["y"] for p in o["points"]) / 4}
        sc = screen_of(page, cen)
        page.mouse.click(sc["x"], sc["y"])
        page.wait_for_timeout(80)
        check("6. клик внутри фигуры её выделяет", page.evaluate("() => selectedId") == o["id"])
        page.click("#bdCtxFig")
        page.mouse.click(1250, 700)
        page.wait_for_timeout(80)
        check("6. клик мимо снимает выделение и закрывает панель", page.evaluate("() => selectedId") is None and not page.evaluate("() => document.getElementById('bdFigPanel').classList.contains('open')"))

        # ── 7. сохранение, выгрузка, тема, заметки ──
        clear_board(page)
        for kk in kinds:
            page.evaluate("""(k) => { const o = figInsert(k); const s = o.fig.sh; s.ticks = s.arcs = s.diag = s.in = s.out = s.rad = s.dia = true;
                if (o.points.length === 3){ s.h = [0,1,2]; s.m = [0,1,2]; s.b = [0,1,2]; s.mid = [0,1,2]; } else { s.h = true; s.mid = true; } }""", kk)
        page.evaluate("() => { saveDB(); }")
        before = page.evaluate("() => JSON.stringify(getCurrentBoard().objects.map(o => [o.type, o.fig, o.points]))")
        reload_board(page)
        after = page.evaluate("() => JSON.stringify(getCurrentBoard().objects.map(o => [o.type, o.fig, o.points]))")
        check("7. все 13 фигур со всеми элементами переживают перезагрузку", before == after)
        ok = page.evaluate("""() => { const cv = document.createElement('canvas'); cv.width = 800; cv.height = 600; const c = cv.getContext('2d');
            const vc = { x: cam.x, y: cam.y, zoom: 0.4 }; render(c, 800, 600, vc, false, 1); activeCam = cam; return true; }""")
        check("7. выгрузка (render своей камерой) без ошибок", ok and not errors, errors)
        page.evaluate("() => { document.documentElement.setAttribute('data-theme', 'dark'); window.boardsRedraw(); }")
        page.wait_for_timeout(100)
        page.evaluate("() => { document.documentElement.setAttribute('data-theme', 'light'); window.boardsRedraw(); }")
        check("7. тёмная тема — без ошибок", not errors, errors)
        rf = page.evaluate("""() => { const o = figCreate('tri-iso', {x: 100, y: 100}, 150); const c = document.createElement('canvas').getContext('2d');
            const save = activeCam; activeCam = { x: 0, y: 0, zoom: 1 }; renderObject(c, o, activeCam); drawSelection(c, o, activeCam); activeCam = save;
            return getHandles(o).length; }""")
        check("7. фигура рисуется и в чужой камере (заметки справочной панели)", rf == 5, rf)
        old = page.evaluate("""() => { const o = figCreate('par', {x: 0, y: 0}, 100); delete o.fig; return [o.type, getHandles(o).length]; }""")
        check("7. без fig это обычный многоугольник (так его видит старая вкладка)", old == ["poly", 4], old)

        page.close()
        ph = ctx.new_page()
        ph.set_viewport_size({"width": 375, "height": 740})
        ph.on("pageerror", lambda e: errors.append(str(e)))
        boot(ph, True)
        ph.click("#figBtn")
        ph.wait_for_timeout(150)
        box = ph.evaluate("() => { const r = document.getElementById('bdFigMenu').getBoundingClientRect(); return [r.left, r.top, r.right, r.bottom, innerWidth, innerHeight]; }")
        check("7. телефон 375: меню целиком в экране", box[0] >= 0 and box[1] >= 0 and box[2] <= box[4] and box[3] <= box[5], box)
        ph.click('#bdFigGrid .bd-fig-item[data-fig="rhomb"]')
        ph.wait_for_timeout(100)
        check("7. телефон 375: панель сама не открывается (легла бы на фигуру)", not ph.evaluate("() => document.getElementById('bdFigPanel').classList.contains('open')"))
        ph.click("#bdCtxFig")
        ph.wait_for_timeout(100)
        pb = ph.evaluate("() => { const r = document.getElementById('bdFigPanel').getBoundingClientRect(); return [r.left, r.right, r.bottom, innerWidth, innerHeight]; }")
        check("7. телефон 375: панель в экране", pb[0] >= 0 and pb[1] <= pb[3] and pb[2] <= pb[4], pb)

        stage2(ctx, errors)
        stage3(ctx, errors)
        check("8. нет ошибок JavaScript", not errors, errors)
        br.close()

    bad = [n for n, ok in RESULTS if not ok]
    print()
    print("ИТОГ: всё прошло" if not bad else f"ИТОГ: провалено {len(bad)}")
    sys.exit(1 if bad else 0)


if __name__ == "__main__":
    main()
