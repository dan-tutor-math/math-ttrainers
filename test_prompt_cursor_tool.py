"""
«Курсор-инструмент»: у ученика на сцене курсор учителя — не красная стрелка,
а то, что учитель видит у себя: ручка (с цветом чернил), «рука», крестик у
фигур, текстовый курсор, кольцо ластика в его размере. Стрелка — только там,
где у учителя обычная стрелка («Выделение», панели).

Проверяем:
  A. Ручка — у ученика картинка ручки (та же, что у учителя), горячая точка
     на месте — кончик пера там, куда указывает учитель.
  B. Цвет чернил поменяли, мышь стоит — у ученика ручка перекрасилась сама.
  C. «Рука» — открытая ладонь; зажал — сжатая; «Прямая» — крестик;
     «Текст» — текстовый курсор.
  D. «Выделение» — прежняя красная стрелка. Нажатие — без кружка вокруг
     курсора (ни у стрелки, ни у ручки): он мигал на каждом штрихе.
  E. «Ластик» — стрелки нет, кольцо ластика в масштабе сцены (размер учителя
     × масштаб сцены), размер поменяли — кольцо тоже.
  F. Ученик подключился посреди урока, учитель с ручкой просто водит
     мышью — ручку видно и ему (вид пересылается раз в 2 с).
  G. Нет ошибок JavaScript.

Realtime отсюда — заглушка Supabase из теста №54 (BroadcastChannel между
вкладками); на живом сайте Даниил перепроверяет руками.
Запуск: python3 test_prompt_cursor_tool.py
"""
import sys
import urllib.parse

from playwright.sync_api import sync_playwright

import test_prompt11_shared_screen as t11
import test_prompt11_stage_polish as P
import test_prompt11_board_stage as BS

PORT = 9089
t11.PORT = PORT
t11.BASE = P.BASE = BS.BASE = BASE = f"http://127.0.0.1:{PORT}"
failures = t11.failures
errors = t11.errors
check = t11.check
wait_js = BS.wait_js

LOOK = """() => { const c = document.getElementById('cursor'); const l = c.querySelector('.look'); const img = l.querySelector('img');
  const e = c.querySelector('.erase');
  return { on: c.classList.contains('on'), down: c.classList.contains('down'),
    mode: c.classList.contains('look-on') ? 'look' : (c.classList.contains('look-none') ? 'none' : 'arrow'),
    img: img ? img.getAttribute('src') : '', svg: l.querySelector('svg') ? l.innerHTML.length : 0,
    left: l.style.left, top: l.style.top,
    arrow: getComputedStyle(c.querySelector('.arrow')).display, visible: [...c.children].filter(x => getComputedStyle(x).display !== 'none' && x.getBoundingClientRect().width > 0).map(x => x.getAttribute('class')),
    erase: getComputedStyle(e).display === 'none' ? 0 : parseFloat(e.style.width), key: window.__stageCursor.look().key }; }"""


def pick(teacher, t):
    teacher.evaluate(f"() => document.querySelector('#bdDock .bd-tool[data-tool=\"{t}\"]').click()")
    teacher.wait_for_timeout(60)


def run_main(browser):
    ctx = browser.new_context()
    teacher, _ = BS.teacher_boards(ctx)
    code = teacher.evaluate("() => TrainerSession.getCode()")
    teacher.evaluate("() => window.openBoard('bA')")
    teacher.wait_for_function("() => window.getCurrentBoard() && window.getCurrentBoard().id === 'bA' && boardActive")
    student = P.participant(ctx, "S", 1000, 700)
    student.goto(f"{BASE}/index.html?s={code}")
    t11.wait_stage(student)
    ok = wait_js(student, """() => { const f = __stageActiveFrame(); try {
        return f.contentWindow.location.pathname.endsWith('/boards.html') && !f.classList.contains('waiting'); } catch (e) { return false; } }""", 12000)
    check("подготовка: ученик на сцене видит доски", ok)
    teacher.wait_for_timeout(800)
    r = teacher.evaluate("() => { const b = document.getElementById('boardCv').getBoundingClientRect(); return [b.left, b.top, b.width, b.height]; }")
    cx, cy = r[0] + r[2] * 0.5, r[1] + r[3] * 0.5
    scale = student.evaluate("() => window.__stageScale")

    def move(dx=0, dy=0):
        teacher.mouse.move(cx + dx, cy + dy, steps=3)

    def look_when(js_cond, timeout=3000):
        wait_js(student, f"() => {{ const L = ({LOOK})(); return {js_cond}; }}", timeout)
        return student.evaluate(LOOK)

    # ── A. ручка ──
    pick(teacher, "pen")
    move(10, 10)
    lk = look_when("L.on && L.mode === 'look' && L.img")
    check("A: ручка — у ученика картинка, а не стрелка", lk["mode"] == "look" and lk["img"].startswith("data:image/svg+xml"), str(lk)[:200])
    tcss = teacher.evaluate("() => getComputedStyle(document.getElementById('boardCv')).cursor")
    check("A: та же картинка, что курсор учителя", lk["img"] and lk["img"] in urllib.parse.unquote(tcss) or lk["img"] in tcss, tcss[:80])
    check("A: горячая точка — кончик пера (9, 28)", lk["left"] == "-9px" and lk["top"] == "-28px", f"{lk['left']} {lk['top']}")
    check("A: красной стрелки не видно", lk["arrow"] == "none", lk["arrow"])
    want = [(cx + 10) * scale, (cy + 10) * scale]
    wait_js(student, """w => { const m = /translate\\(([-\\d.]+)px,\\s*([-\\d.]+)px\\)/.exec(document.getElementById('cursor').style.transform);
        return m && Math.abs(+m[1] - w[0]) < 2 && Math.abs(+m[2] - w[1]) < 2; }""", 3000, want)
    pos = student.evaluate("""() => { const m = /translate\\(([-\\d.]+)px,\\s*([-\\d.]+)px\\)/.exec(document.getElementById('cursor').style.transform);
        return m ? [+m[1], +m[2]] : null; }""")
    check("A: курсор там же, где у учителя (в масштабе сцены)",
          pos and abs(pos[0] - want[0]) < 2 and abs(pos[1] - want[1]) < 2, f"{pos} / {want}")

    teacher.mouse.down()
    move(30, 20)
    lk = look_when("L.down")
    check("A: пишет ручкой — кружка вокруг курсора нет, видна только ручка", lk["down"] and lk["visible"] == ["look"], str(lk["visible"]))
    teacher.mouse.up()
    teacher.keyboard.press("Control+z")
    move(10, 10)

    # ── B. цвет поменяли клавишами, мышь стоит ──
    before = lk["img"]
    teacher.evaluate("() => { curColorTok = '#0a7a3a'; updateCursor(); }")
    lk = look_when(f"L.img && L.img !== {before!r}", 2000)
    check("B: цвет чернил сменился без движения мыши — ручка у ученика перекрасилась",
          lk["img"] != before and "0a7a3a" in urllib.parse.unquote(lk["img"]).lower(), lk["img"][-120:])

    # ── C. рука, прямая, текст ──
    pick(teacher, "hand")
    move(20, 0)
    lk = look_when("L.mode === 'look' && L.svg && !L.img")
    check("C: «Рука» — значок ладони", lk["mode"] == "look" and lk["svg"] > 0 and '"grab"' in lk["key"], lk["key"][:80])
    teacher.mouse.down()
    move(40, 10)
    lk = look_when("L.key.indexOf('grabbing') >= 0")
    check("C: зажал «Рукой» — сжатая ладонь", "grabbing" in lk["key"], lk["key"][:80])
    teacher.mouse.up()
    pick(teacher, "line")
    move(0, 30)
    lk = look_when("L.key.indexOf('crosshair') >= 0 && L.mode === 'look'")
    check("C: «Прямая» — крестик", "crosshair" in lk["key"] and lk["mode"] == "look" and lk["left"] == "-12px", lk["key"][:80])
    pick(teacher, "text")
    move(0, 50)
    lk = look_when("L.key.indexOf('\"text\"') >= 0 && L.mode === 'look'")
    check("C: «Текст» — текстовый курсор", '"text"' in lk["key"] and lk["mode"] == "look", lk["key"][:80])
    teacher.keyboard.press("Escape")

    # ── D. выделение — стрелка ──
    pick(teacher, "select")
    move(-30, 60)
    lk = look_when("L.mode === 'arrow'")
    check("D: «Выделение» — прежняя красная стрелка", lk["mode"] == "arrow" and lk["arrow"] != "none", str(lk)[:160])
    teacher.mouse.down()
    lk = look_when("L.down")
    check("D: нажатие дошло до ученика", lk["down"])
    check("D: кружка вокруг стрелки при нажатии нет — видна только стрелка", lk["visible"] == ["arrow"], str(lk["visible"]))
    teacher.mouse.up()

    # ── E. ластик ──
    pick(teacher, "eraser")
    move(-50, 20)
    size = teacher.evaluate("() => eraserSize")
    lk = look_when("L.mode === 'none' && L.erase > 0")
    check("E: «Ластик» — стрелки нет", lk["mode"] == "none" and lk["arrow"] == "none", str(lk)[:160])
    check("E: кольцо ластика в масштабе сцены", abs(lk["erase"] - max(6, size * scale)) < 0.6, f"{lk['erase']} / {size}×{scale:.3f}")
    teacher.evaluate("() => setEraserSize(eraserSize * 2)")
    move(-40, 20)
    size2 = teacher.evaluate("() => eraserSize")
    lk = look_when(f"Math.abs(L.erase - {max(6, size2 * scale)}) < 0.6")
    check("E: размер ластика поменяли — кольцо тоже", size2 != size and abs(lk["erase"] - max(6, size2 * scale)) < 0.6,
          f"{lk['erase']} / {size2}×{scale:.3f}")
    pick(teacher, "select")
    move(-60, 20)
    lk = look_when("L.mode === 'arrow' && !L.erase")
    check("E: ушли с ластика — кольца больше нет", lk["erase"] == 0 and lk["mode"] == "arrow", str(lk)[:160])

    # ── F. ученик пришёл посреди урока ──
    pick(teacher, "pen")
    move(5, 5)
    teacher.wait_for_timeout(300)
    student2 = P.participant(ctx, "S2", 900, 650)
    student2.goto(f"{BASE}/index.html?s={code}")
    t11.wait_stage(student2)
    wait_js(student2, """() => { const f = __stageActiveFrame(); try {
        return f.contentWindow.location.pathname.endsWith('/boards.html') && !f.classList.contains('waiting'); } catch (e) { return false; } }""", 12000)
    teacher.wait_for_timeout(500)
    for i in range(30):                         # просто водит мышью ~3 с
        move(5 + (i % 6) * 8, 5 + (i % 4) * 6)
        teacher.wait_for_timeout(100)
    ok = wait_js(student2, f"() => {{ const L = ({LOOK})(); return L.on && L.mode === 'look' && L.img; }}", 3000)
    check("F: ученику, пришедшему позже, ручка тоже видна", ok, str(student2.evaluate(LOOK))[:160])
    ctx.close()


def run():
    with t11.local_server(), sync_playwright() as p:
        browser = p.chromium.launch()
        run_main(browser)
        browser.close()
    real = [e for e in errors if "fonts.g" not in e]
    check("G: нет ошибок JavaScript", not real, " | ".join(real[:5]))
    print()
    if failures:
        print("ПРОВАЛЫ:")
        for f in failures:
            print(" -", f)
        sys.exit(1)
    print("ИТОГ: всё прошло")


if __name__ == "__main__":
    run()
