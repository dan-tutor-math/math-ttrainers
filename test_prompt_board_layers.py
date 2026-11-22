"""
Порядок слоёв картинок и заданий на доске: «Поверх всех», «Вперёд»,
«Под всеми», «Назад» в меню выделения и Ctrl+] / Ctrl+[ (с Shift — до конца).

Проверяем:
  1. Строка «Слои» видна только при выделенной картинке/задании; кнопки гаснут,
     когда двигать некуда.
  2. Каждая команда переставляет только картинки, которые перекрываются с
     выделенной; штрих ручки и далёкая картинка остаются на своих местах.
  3. Отмена и повтор (своя доска) возвращают порядок.
  4. Порядок переживает перезагрузку страницы; zr совпадает с порядком массива.
  5. Живые поля задания, ушедшего под картинку, закрыты (вырез clip-path).
  6. 300 случайных команд на 4 взаимно перекрытых картинках совпадают с
     моделью (в том числе после исчерпания дробных zr — перенумерация).
  7. Общая доска на заглушке: порядок доезжает до второго участника,
     отмена возвращает у обоих.

Живой realtime из песочницы не проверить — совместную доску перепроверить
на сайте руками.
"""
import random
import sys

from playwright.sync_api import sync_playwright

from test_prompt53_cloud_stale_versions import PNG, local_server  # noqa: F401
from test_prompt_cloud_wheel_resize import open_board, BASE
from test_prompt_board_task_live import Relay


def img(oid, x, y, w=400, h=200):
    return {"id": oid, "type": "image", "src": PNG, "points": [{"x": x, "y": y}], "w": w, "h": h,
            "natW": 1, "natH": 1, "rv": 1, "rvBy": "T", "by": "T"}


def task(oid, x, y):
    o = img(oid, x, y)
    o["locked"] = True
    o["task"] = {"v": 1, "kind": "fields", "fields": [{"id": "a", "label": "", "type": "num", "value": "5"}],
                 "hot": {"w": 400, "h": 200, "fields": [{"x": .1, "y": .6, "w": .3, "h": .2}],
                         "check": {"x": .5, "y": .6, "w": .3, "h": .2}, "checkText": "Проверить"}}
    return o


PEN = {"id": "pen", "type": "pen", "color": "--pencil", "width": 2, "rv": 1, "rvBy": "T", "by": "T",
       "points": [{"x": 120, "y": 120}, {"x": 300, "y": 250}]}
# A, B и задание C перекрываются; D далеко
OBJS = [img("A", 100, 100), PEN, img("B", 150, 150), task("C", 200, 200), img("D", 3000, 3000)]

IDS = "() => getCurrentBoard().objects.map(o => o.id).join()"
# zr совпадает с порядком массива: applyLayerOrder на копии ничего не меняет
ZR_OK = """() => { const a = getCurrentBoard().objects.slice(); const ids = a.map(o => o.id).join();
    window.boardsApplyLayerOrder(a); return a.map(o => o.id).join() === ids; }"""
BTN = {"front": "#bdCtxLayerFront", "up": "#bdCtxLayerUp", "back": "#bdCtxLayerBack", "down": "#bdCtxLayerDown"}


def select(pg, oid):
    pg.evaluate(f"() => {{ selectedId = '{oid}'; multiSelectIds = []; updateContextMenu(); scheduleRedraw(); }}")
    pg.wait_for_timeout(60)


def disabled(pg):
    return pg.evaluate("""() => Object.fromEntries([['front','#bdCtxLayerFront'],['up','#bdCtxLayerUp'],
        ['back','#bdCtxLayerBack'],['down','#bdCtxLayerDown']].map(([k, s]) => [k, document.querySelector(s).disabled]))""")


def reopen(pg):
    """Перезагрузка без пересева базы: доска читается из IndexedDB."""
    pg.reload()
    pg.evaluate("""() => { window.CURRENT_USER = { id: 'T', email: 'T@test' };
        const g = document.getElementById('authGate'); if (g) g.style.display = 'none'; window.boardsAppBoot(); }""")
    pg.wait_for_function("window.getDB && window.getDB().boards.length >= 1")
    pg.evaluate("() => window.openBoard('bShared')")
    pg.wait_for_function("() => { const b = window.getCurrentBoard(); return b && Array.isArray(b.objects); }")
    pg.wait_for_timeout(300)


def model(order, sel, cmd):
    """Все картинки перекрываются друг с другом: шаг — обмен с соседом."""
    o = order[:]
    i = o.index(sel)
    o.pop(i)
    if cmd == "front":
        o.append(sel)
    elif cmd == "back":
        o.insert(0, sel)
    elif cmd == "up":
        o.insert(min(i + 1, len(o)), sel)
    else:
        o.insert(max(i - 1, 0), sel)
    return o


def run():
    failures = []

    def check(name, cond, extra=""):
        print(f"[{'OK' if cond else 'FAIL'}] {name}" + (f" — {extra}" if extra and not cond else ""))
        if not cond:
            failures.append(name)

    with local_server(), sync_playwright() as p:
        browser = p.chromium.launch()
        pg = open_board(browser, "T", OBJS, cloud=False)
        errors = []
        pg.on("pageerror", lambda e: errors.append(str(e)))
        pg.evaluate("() => setZoom(1, 350, 300, cssW / 2, cssH / 2)")
        ids = lambda: pg.evaluate(IDS)

        # ── 1. видимость и доступность кнопок ──
        select(pg, "pen")
        vis = pg.evaluate("() => getComputedStyle(document.getElementById('bdCtxLayers')).display")
        check("штрих: строки «Слои» нет", vis == "none", vis)
        select(pg, "A")
        vis = pg.evaluate("() => getComputedStyle(document.getElementById('bdCtxLayers')).display")
        check("картинка: строка «Слои» видна", vis == "grid", vis)
        d = disabled(pg)
        check("нижняя A: «Под всеми» и «Назад» погашены, вверх — нет",
              d == {"front": False, "up": False, "back": True, "down": True}, str(d))
        select(pg, "D")
        d = disabled(pg)
        check("далёкая D без перекрытий: все кнопки погашены", all(d.values()), str(d))

        # ── 2. команды ──
        select(pg, "A")
        pg.click(BTN["up"])
        pg.wait_for_timeout(100)
        check("«Вперёд» у A: A над B, штрих и D на местах", ids() == "B,pen,A,C,D", ids())
        check("zr совпадает с порядком", pg.evaluate(ZR_OK))
        check("у D zr не появился", pg.evaluate("() => getCurrentBoard().objects.find(o => o.id === 'D').zr === undefined"))
        select(pg, "A")
        pg.keyboard.press("Control+Shift+BracketRight")
        pg.wait_for_timeout(100)
        check("Ctrl+Shift+] у A: поверх всех", ids() == "B,pen,C,A,D", ids())
        d = disabled(pg)
        check("A сверху: «Поверх всех» и «Вперёд» погашены", d["front"] and d["up"] and not d["back"], str(d))

        # ── 3. отмена / повтор ──
        pg.keyboard.press("Control+z"); pg.wait_for_timeout(100)
        check("Ctrl+Z: шаг назад", ids() == "B,pen,A,C,D", ids())
        pg.keyboard.press("Control+z"); pg.wait_for_timeout(100)
        check("Ctrl+Z ещё раз: исходный порядок", ids() == "A,pen,B,C,D", ids())
        pg.keyboard.press("Control+y"); pg.wait_for_timeout(100)
        check("Ctrl+Y: повтор", ids() == "B,pen,A,C,D", ids())
        check("zr совпадает с порядком после отмены/повтора", pg.evaluate(ZR_OK))

        # ── задание под всеми ──
        select(pg, "C")
        pg.click(BTN["back"])
        pg.wait_for_timeout(250)
        check("«Под всеми» у задания C", ids() == "C,pen,B,A,D", ids())
        select(pg, "C")
        pg.keyboard.press("Control+BracketLeft")
        pg.wait_for_timeout(100)
        check("Ctrl+[ у нижнего C ничего не меняет", ids() == "C,pen,B,A,D", ids())
        pg.evaluate("() => { selectedId = null; multiSelectIds = []; updateContextMenu(); scheduleRedraw(); }")
        pg.wait_for_timeout(250)
        clip = pg.evaluate("() => (document.querySelector('.bd-task[data-id=\"C\"]') || {style:{}}).style.clipPath || ''")
        check("поля задания под картинками вырезаны", "evenodd" in clip, clip)

        # ── 4. перезагрузка ──
        pg.wait_for_timeout(800)
        reopen(pg)
        check("после перезагрузки порядок тот же", ids() == "C,pen,B,A,D", ids())
        check("после перезагрузки zr совпадает с порядком", pg.evaluate(ZR_OK))

        # ── несколько выделенных ──
        pg.evaluate("() => { selectedId = null; multiSelectIds = ['C', 'B']; updateContextMenu(); scheduleRedraw(); }")
        pg.click(BTN["front"])
        pg.wait_for_timeout(100)
        check("два выделенных поверх всех, их порядок сохранён", ids() == "A,pen,C,B,D", ids())
        check("ошибок страницы нет", not errors, str(errors))

        # ── 6. случайная серия против модели ──
        quad = [img("q1", 0, 0), img("q2", 50, 50), img("q3", 100, 100), img("q4", 150, 150)]
        pq = open_board(browser, "T", quad, cloud=False)
        pq.on("pageerror", lambda e: errors.append(str(e)))
        rnd = random.Random(7)
        order = ["q1", "q2", "q3", "q4"]
        bad = None
        for step in range(300):
            # первая сотня — туда-сюда одной пары, чтобы исчерпать дробные zr
            if step < 100:
                sel, cmd = "q2", ("up" if step % 2 == 0 else "down")
            else:
                sel, cmd = rnd.choice(order), rnd.choice(["front", "back", "up", "down"])
            order = model(order, sel, cmd)
            got = pq.evaluate(f"""() => {{ selectedId = '{sel}'; multiSelectIds = []; window.boardsMoveLayer('{cmd}');
                return getCurrentBoard().objects.map(o => o.id).join(); }}""")
            if got != ",".join(order) or not pq.evaluate(ZR_OK):
                bad = f"шаг {step}: {sel} {cmd} → {got}, ждали {','.join(order)}"
                break
        check("300 случайных команд совпадают с моделью, zr в порядке", bad is None, str(bad))
        mx = pq.evaluate("() => Math.max(...getCurrentBoard().objects.map(o => Math.abs(o.zr || 0)))")
        check("zr остаются конечными", mx < 1e6, str(mx))

        # ── 7. общая доска ──
        cobjs = [img("A", 100, 100), PEN, img("B", 150, 150), task("C", 200, 200)]
        T = open_board(browser, "T", cobjs)
        S = open_board(browser, "S", cobjs)
        T.on("pageerror", lambda e: errors.append(str(e)))
        S.on("pageerror", lambda e: errors.append(str(e)))
        cid = lambda page: page.evaluate(IDS)
        r = Relay(T, S)
        select(T, "A")
        T.click(BTN["front"])
        T.wait_for_timeout(1200)
        check("облако: у себя A поверх всех", cid(T) == "B,pen,C,A", cid(T))
        r.flush("a"); S.wait_for_timeout(400)
        s_img = ",".join(i for i in cid(S).split(",") if i != "pen")
        check("облако: у второго участника картинки в том же порядке", s_img == "B,C,A", cid(S))
        T.keyboard.press("Control+z")
        T.wait_for_timeout(1200)
        t_img = ",".join(i for i in cid(T).split(",") if i != "pen")
        check("облако: Ctrl+Z возвращает у себя", t_img == "A,B,C", cid(T))
        r.flush("a"); S.wait_for_timeout(400)
        s_img = ",".join(i for i in cid(S).split(",") if i != "pen")
        check("облако: Ctrl+Z доезжает до второго", s_img == "A,B,C", cid(S))
        check("ошибок страниц нет", not errors, str(errors))
        browser.close()
    print("ГОТОВО" if not failures else f"ПРОВАЛЕНО: {failures}")
    return 1 if failures else 0


if __name__ == "__main__":
    sys.exit(run())
