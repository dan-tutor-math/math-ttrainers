"""
Сцена ученика на телефоне: щипок, перетаскивание пальцами, экран не гаснет.

Зачем. На iPhone ученик увеличил экран учителя щипком — страница
перезагрузилась, а со второго раза Safari написал «На странице повторно
возникла проблема». Родной масштаб браузера перерисовывал кадр с холстами
доски в полном разрешении экрана, памяти не хватало. На Android щипком над
кадром увеличить было нельзя вовсе. Теперь масштаб браузера на сцене
запрещён, а щипок и перетаскивание делает сама сцена; холсты в кадре
рисуются с той плотностью, что реально видна; экран не гаснет.

Проверяем (телефон: касания, плотность экрана 3; жесты — настоящими
касаниями через CDP Input.dispatchTouchEvent):
  A. На сцене: масштаб браузера запрещён (viewport), кадру сообщена
     уменьшенная плотность (devicePixelRatio), холст доски в тренажёре
     меньше, чем был бы при плотности 3.
  B. Щипок над кадром (тренажёр) — сцена увеличилась (> 150 %), браузер
     страницу не увеличил (visualViewport.scale = 1), точка между пальцами
     осталась под пальцами.
  C. Двумя пальцами двигаем — сцена сдвинулась. Плотность в кадре выросла
     вместе с масштабом.
  D. В тренажёре одним пальцем сцена НЕ двигается (там ученик вводит
     ответы), с «рукой» ✋ — двигается.
  E. Сведённые пальцы — снова 100 %.
  F. Доски: одним пальцем увеличенная доска учителя двигается.
  G. Экран не гаснет: сцена просит wakeLock('screen'); учитель, у
     которого на связи ученик, — тоже; после «сворачивания» и возврата к
     вкладке — просит заново.
  H. Без ошибок JavaScript.

Заглушка Supabase и помощники — из тестов №54 и №11.
Запуск: python3 test_prompt_stage_pinch.py
"""
import sys

from playwright.sync_api import sync_playwright

import test_prompt11_board_stage as BS
import test_prompt11_shared_screen as t11
import test_prompt11_stage_polish as P
import test_prompt54_trainer_sync_and_cards as t54

PORT = 8985
t11.PORT = PORT
t11.BASE = P.BASE = BS.BASE = BASE = f"http://127.0.0.1:{PORT}"
failures = t11.failures
errors = t11.errors
check = t11.check

# заглушка wakeLock: считает просьбы (в Chromium без экрана настоящий может отказать)
WAKE_STUB = """
(() => { window.__wake = { req: 0, held: 0 };
  try { Object.defineProperty(navigator, 'wakeLock', { configurable: true, value: { request: async (t) => {
    window.__wake.req++; window.__wake.held++;
    const ls = []; const s = { type: t, released: false, addEventListener: (n, f) => ls.push(f),
      release: async () => { if (!s.released) { s.released = true; window.__wake.held--; ls.forEach(f => f()); } } };
    window.__wakeSentinel = s; return s; } } }); } catch (e) {} })();
"""


class Touch:
    """касания пальцами через CDP — так же, как их получает браузер телефона"""
    def __init__(self, page):
        self.cdp = page.context.new_cdp_session(page)

    def send(self, kind, pts):
        self.cdp.send("Input.dispatchTouchEvent", {
            "type": kind, "touchPoints": [{"x": x, "y": y, "id": i} for i, (x, y) in enumerate(pts)]})

    def gesture(self, start, end, steps=12):
        """пальцы из start в end (списки точек одинаковой длины)"""
        self.send("touchStart", start)
        for k in range(1, steps + 1):
            t = k / steps
            self.send("touchMove", [(a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t) for a, b in zip(start, end)])
        self.send("touchEnd", [])


STATE = """() => ({ zoom: parseInt(document.getElementById('zoomLabel').textContent), scale: window.__stageScale,
  sl: document.getElementById('vp').scrollLeft, st: document.getElementById('vp').scrollTop,
  vv: window.visualViewport ? visualViewport.scale : 1, want: window.__stageDpr && window.__stageDpr() })"""
# точка кадра (в пикселях окна учителя) под точкой экрана сцены
UNDER = """([x, y]) => { const f = window.__stageActiveFrame(); const r = f.getBoundingClientRect();
  const k = r.width / f.offsetWidth; return [(x - r.left) / k, (y - r.top) / k]; }"""


def run_main(browser):
    ctx = browser.new_context(has_touch=True, is_mobile=True, device_scale_factor=3,
                              viewport={"width": 390, "height": 760})
    ctx.add_init_script(WAKE_STUB)
    teacher = P.participant(ctx, "T", 1300, 820)
    teacher.goto(f"{BASE}/oge8.html")
    code = t54.wait_code(teacher)
    student = P.participant(ctx, "S", 390, 760)
    student.goto(f"{BASE}/oge8.html?s={code}")
    f = t11.wait_stage(student)
    student.wait_for_timeout(900)

    # ── A ──
    vpmeta = student.evaluate("() => document.querySelector('meta[name=viewport]').content")
    check("A: масштаб браузера на сцене запрещён", "user-scalable=no" in vpmeta and "maximum-scale=1" in vpmeta, vpmeta)
    fd = f.evaluate("() => window.devicePixelRatio")
    check("A: кадру сообщена уменьшенная плотность", 1 <= fd < 2, str(fd))
    cv = f.evaluate("""() => { const c = [...document.querySelectorAll('canvas')].sort((a, b) => b.width * b.height - a.width * a.height)[0];
        return c ? { w: c.width, cssw: c.getBoundingClientRect().width } : null; }""")
    check("A: холст в тренажёре — по видимой плотности, не втрое", cv and cv["w"] <= cv["cssw"] * 2 + 2, str(cv))

    touch = Touch(student)
    s0 = student.evaluate(STATE)
    # ── B. щипок над кадром ──
    cx, cy = 195, 380
    under0 = student.evaluate(UNDER, [cx, cy])
    touch.gesture([(cx - 30, cy), (cx + 30, cy)], [(cx - 110, cy), (cx + 110, cy)])
    student.wait_for_timeout(500)
    s1 = student.evaluate(STATE)
    check("B: щипок увеличил сцену", s1["zoom"] > 150, f"{s0['zoom']} → {s1['zoom']}")
    check("B: страницу браузер не увеличил", abs(s1["vv"] - 1) < 1e-3, str(s1["vv"]))
    under1 = student.evaluate(UNDER, [cx, cy])
    check("B: точка между пальцами осталась под пальцами",
          abs(under1[0] - under0[0]) < 25 and abs(under1[1] - under0[1]) < 25, f"{under0} → {under1}")
    check("B: страница в кадре на месте (не перезагрузилась)", t11.stage_frame(student).evaluate("() => !!window.TrainerSession"))

    # ── C. двумя пальцами двигаем ──
    touch.gesture([(150, 400), (240, 400)], [(90, 330), (180, 330)])
    student.wait_for_timeout(500)
    s2 = student.evaluate(STATE)
    check("C: двумя пальцами сцена сдвинулась", s2["sl"] > s1["sl"] + 30 and s2["st"] > s1["st"] + 30, f"{s1} → {s2}")
    check("C: масштаб при этом почти тот же", abs(s2["zoom"] - s1["zoom"]) <= 15, f"{s1['zoom']} → {s2['zoom']}")
    ok = BS.wait_js(t11.stage_frame(student), "w => window.devicePixelRatio > w + 0.2", 3000, fd)
    check("C: плотность в кадре выросла вместе с масштабом", ok,
          f"{fd} → {t11.stage_frame(student).evaluate('() => window.devicePixelRatio')}")

    # ── D. один палец в тренажёре ──
    student.evaluate("() => { const v = document.getElementById('vp'); v.scrollLeft = (v.scrollWidth - v.clientWidth) / 2; v.scrollTop = (v.scrollHeight - v.clientHeight) / 2; }")
    s2 = student.evaluate(STATE)
    touch.gesture([(200, 450)], [(120, 360)], steps=8)
    student.wait_for_timeout(300)
    s3 = student.evaluate(STATE)
    check("D: в тренажёре одним пальцем сцена не двигается", abs(s3["sl"] - s2["sl"]) < 2 and abs(s3["st"] - s2["st"]) < 2, f"{s2} → {s3}")
    student.click("#panBtn")
    student.evaluate("() => { const v = document.getElementById('vp'); v.scrollLeft = (v.scrollWidth - v.clientWidth) / 2; v.scrollTop = (v.scrollHeight - v.clientHeight) / 2; }")
    s3 = student.evaluate(STATE)
    touch.gesture([(200, 450)], [(120, 360)], steps=8)
    student.wait_for_timeout(300)
    s4 = student.evaluate(STATE)
    check("D: с «рукой» — двигается", s4["sl"] > s3["sl"] + 40 and s4["st"] > s3["st"] + 20, f"{s3} → {s4}")
    check("D: и ровно на путь пальца (по горизонтали)", abs((s4["sl"] - s3["sl"]) - 80) < 6, f"{s3} → {s4}")
    student.click("#panBtn")

    # ── E. свели пальцы ──
    touch.gesture([(80, 380), (310, 380)], [(180, 380), (210, 380)])
    student.wait_for_timeout(500)
    s5 = student.evaluate(STATE)
    check("E: свели пальцы — снова 100 %", s5["zoom"] == 100, str(s5))

    # ── G. экран не гаснет ──
    w = student.evaluate("() => window.__wake")
    check("G: сцена держит экран (wakeLock 'screen')", w["held"] >= 1, str(w))
    ok = BS.wait_js(teacher, "() => window.__wake && window.__wake.held >= 1", 8000)
    check("G: учитель с учеником на связи — тоже", ok, str(teacher.evaluate("() => window.__wake")))
    # браузер сам отпустил (вкладку свернули) — при возврате берём заново
    student.evaluate("() => window.__wakeSentinel.release()")
    student.evaluate("() => document.dispatchEvent(new Event('visibilitychange'))")
    ok = BS.wait_js(student, "() => window.__wake.held >= 1 && window.__wake.req >= 2", 3000)
    check("G: отпустил браузер — после возврата снова держим", ok, str(student.evaluate("() => window.__wake")))
    req_frames = f.evaluate("() => window.__wake.req")
    check("G: кадр сцены сам не просит (просит сцена)", req_frames == 0, str(req_frames))

    # ── F. доски: один палец двигает доску учителя ──
    teacher.evaluate("() => TrainerSession.navigateTo('boards.html')")
    teacher.wait_for_url("**/boards.html")
    teacher.wait_for_function("() => window.TrainerSession && window.TrainerSession.getCode()")
    teacher.evaluate(BS.BOOT_JS)
    teacher.evaluate("""() => { const b = window.createBoard ? window.createBoard('Урок') : null; }""")
    ok = BS.wait_js(student, """() => { const f = __stageActiveFrame(); try {
        return f.contentWindow.location.pathname.endsWith('/boards.html') && !f.classList.contains('waiting'); } catch (e) { return false; } }""", 15000)
    check("F: ученик на досках", ok)
    student.wait_for_timeout(600)
    touch.gesture([(170, 380), (220, 380)], [(90, 380), (300, 380)])
    student.wait_for_timeout(400)
    b1 = student.evaluate(STATE)
    check("F: на досках щипок тоже работает", b1["zoom"] > 150, str(b1))
    student.evaluate("() => { const v = document.getElementById('vp'); v.scrollLeft = (v.scrollWidth - v.clientWidth) / 2; v.scrollTop = (v.scrollHeight - v.clientHeight) / 2; }")
    b1 = student.evaluate(STATE)
    touch.gesture([(250, 450)], [(170, 380)], steps=8)
    student.wait_for_timeout(300)
    b2 = student.evaluate(STATE)
    check("F: на доске одним пальцем сцена двигается (без «руки»)", b2["sl"] > b1["sl"] + 40 and b2["st"] > b1["st"], f"{b1} → {b2}")
    check("F: страницу браузер так и не увеличил", abs(b2["vv"] - 1) < 1e-3, str(b2["vv"]))
    ctx.close()


def run():
    with t11.local_server(), sync_playwright() as p:
        browser = p.chromium.launch()
        print("Сцена на телефоне: щипок, пальцы, экран не гаснет")
        run_main(browser)
        browser.close()
    real = [e for e in errors if "fonts.g" not in e]
    if real:
        failures.append("ошибки JS на странице: " + " | ".join(real[:5]))
    print()
    if failures:
        print("ПРОВАЛЫ:")
        for x in failures:
            print(" -", x)
        sys.exit(1)
    print("ИТОГ: всё прошло")


if __name__ == "__main__":
    run()
