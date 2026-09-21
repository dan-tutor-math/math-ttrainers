"""
Промпт №60: ЕГЭ база — заметки поверх задания и калькулятор в столбик в сессии.

Что было сломано (во всех тренажёрах, чиним сначала в ЕГЭ базе):
  1. С включённой доской не нажимались «Проверить» и поле ответа: холст
     листа (#boardCanvas) лежит выше .wrap и перехватывал нажатия.
  2. Заметки поверх задания «гуляли» при прокрутке: trainer-board.js ставит
     холст в координатах документа, а в CSS у холста position:fixed.
  3. «Сложить / Вычесть / Умножить / Поделить / История» открывались только
     у нажавшего.

Правка включается флагами EXAM.boardPinned и EXAM.calcShared — пока только в
ege_base.html. Поэтому здесь же проверяем, что профиль остался как был.

Проверяем:
  A. база, доска включена: мышью в поле ответа, «Проверить» — ответ проверен;
     по условию рисуется штрих; после прокрутки холст стоит ровно на рабочей
     зоне (заметка едет вместе с заданием);
  B. сессия: «Сложить» у учителя — у ученика то же окно; «Умножить» у ученика
     — у учителя; «История» открывается и закрывается у обоих; ✕ закрывает у
     обоих; чужой снимок (штрих доски) не перезагружает открытый калькулятор,
     набранный пример не стирается; подключение ученика не сбивает учителя;
  C. профиль: флаги выключены — холст по-прежнему fixed, калькулятор в
     снимок не попадает.

Живой realtime из песочницы недоступен: заглушка supabase-js из теста №54.
Живьём совместный режим нужно перепроверить на сайте.

Запуск: python3 test_prompt60_ege_base_notes_calc.py (сервер поднимается сам).
"""
import sys

from playwright.sync_api import sync_playwright

import test_prompt54_trainer_sync_and_cards as t54

PORT = 8981
t54.PORT = PORT
BASE = f"http://127.0.0.1:{PORT}"

failures, errors = [], []


def check(name, ok, extra=""):
    print(("[OK] " if ok else "[FAIL] ") + name + (f" — {extra}" if extra else ""))
    if not ok:
        failures.append(name + (f" — {extra}" if extra else ""))


def center(page, sel):
    el = page.locator(sel).first
    el.scroll_into_view_if_needed()
    b = el.bounding_box()
    return b["x"] + b["width"] / 2, b["y"] + b["height"] / 2


def board_on(page):
    page.click("#boardVisibilityToggle")
    page.wait_for_function("() => document.documentElement.getAttribute('data-board') === 'on'")
    page.wait_for_timeout(200)


def wait_code(page):
    page.wait_for_function("() => window.TrainerSession && window.TrainerSession.getCode()", timeout=10000)
    return page.evaluate("() => window.TrainerSession.getCode()")


def calc_view(page):
    return page.evaluate("""() => ({
        op: (document.querySelector('.calc-tool-btn[data-op].active') || {dataset: {}}).dataset.op || null,
        open: document.getElementById('calcPanel').style.display === 'block',
        title: document.getElementById('calcPanelTitle').textContent,
        hist: document.getElementById('calcHistoryPanel').style.display === 'block',
    })""")


def wait_calc(page, op, hist=None, timeout=5000):
    try:
        page.wait_for_function("""([op, hist]) => {
            const a = document.querySelector('.calc-tool-btn[data-op].active');
            const cur = a ? a.dataset.op : null;
            const open = document.getElementById('calcPanel').style.display === 'block';
            const h = document.getElementById('calcHistoryPanel').style.display === 'block';
            return cur === op && open === !!op && (hist === null || h === hist);
        }""", arg=[op, hist], timeout=timeout)
        return True
    except Exception:
        return False


def part_a(browser):
    ctx = browser.new_context(viewport={"width": 1400, "height": 800})
    page = t54.new_page(ctx, errors)
    page.goto(f"{BASE}/ege_base.html?n=1")
    page.wait_for_function("() => typeof openTask === 'function'")
    page.click("#protoList .mode-card")          # прототип 1.1, ответ 14
    board_on(page)

    x, y = center(page, ".answer-input")
    top = page.evaluate("([x, y]) => document.elementFromPoint(x, y).className", [x, y])
    check("A: поле ответа не закрыто холстом", "answer-input" in top, top)
    page.mouse.click(x, y)
    page.keyboard.type("14")
    x, y = center(page, ".check-btn")
    page.mouse.click(x, y)
    page.wait_for_timeout(300)
    st = page.evaluate("() => tsGetState()")
    check("A: «Проверить» с включённой доской сработало", st["answered"] and st["correct"], str(st["answered"]))

    before = page.evaluate("() => window.__boardGetState().strokes.length")
    x, y = center(page, "#questionText")
    page.mouse.move(x - 60, y)
    page.mouse.down()
    for i in range(1, 8):
        page.mouse.move(x - 60 + i * 15, y + (i % 2) * 6)
    page.mouse.up()
    page.wait_for_timeout(200)
    after = page.evaluate("() => window.__boardGetState().strokes.length")
    check("A: по условию задания рисуется заметка", after == before + 1, f"{before} → {after}")

    def offset():
        return page.evaluate("""() => {
            const c = document.getElementById('boardCanvas').getBoundingClientRect();
            const z = document.getElementById('workZone').getBoundingClientRect();
            return [Math.round(c.top - z.top), Math.round(c.left - z.left), scrollY]; }""")
    page.evaluate("() => scrollTo(0, 0)")
    page.wait_for_timeout(150)
    o0 = offset()
    page.mouse.wheel(0, 350)
    page.wait_for_timeout(400)
    o1 = offset()
    check("A: после прокрутки холст стоит на рабочей зоне (заметки не гуляют)",
          o1[2] > 0 and o0[:2] == [0, 0] and o1[:2] == [0, 0], f"до {o0}, после {o1}")
    ctx.close()


def part_b(browser):
    ctx = browser.new_context(viewport={"width": 1400, "height": 900})
    teacher = t54.new_page(ctx, errors)
    teacher.goto(f"{BASE}/ege_base.html?n=1")
    code = wait_code(teacher)
    teacher.click("#protoList .mode-card")
    teacher.wait_for_timeout(500)
    student = t54.new_page(ctx, errors, latency=30)
    student.goto(f"{BASE}/ege_base.html?n=1&s={code}")
    wait_code(student)
    student.wait_for_function("() => document.getElementById('questionText').innerText.trim().length > 0", timeout=8000)
    teacher.wait_for_timeout(900)
    check("B: подключение ученика не сбило учителя с задания",
          teacher.evaluate("() => S.screen === 'task' && S.pid === '1.1'"))

    teacher.click('.calc-tool-btn[data-op="add"]')
    check("B: «Сложить» у учителя — открылось у ученика", wait_calc(student, "add"), str(calc_view(student)))
    check("B: у ученика тот же заголовок калькулятора",
          calc_view(student)["title"] == calc_view(teacher)["title"])

    # набранный пример не должен стираться чужим снимком: метка внутри кадра
    teacher.wait_for_function("() => { try { return document.getElementById('calcIframe').contentDocument.readyState === 'complete'; } catch (e) { return false; } }")
    teacher.evaluate("() => { document.getElementById('calcIframe').contentWindow.__marker = 42; }")
    # штрих ученика — снимок уходит учителю
    x, y = center(student, "#questionText")
    student.mouse.move(x, y)
    board_on(student)
    student.mouse.move(x - 40, y)
    student.mouse.down()
    for i in range(1, 6):
        student.mouse.move(x - 40 + i * 12, y + 4)
    student.mouse.up()
    student.wait_for_timeout(1200)
    marker = teacher.evaluate("() => { try { return document.getElementById('calcIframe').contentWindow.__marker; } catch (e) { return null; } }")
    check("B: чужой снимок не перезагрузил открытый калькулятор", marker == 42, str(marker))
    check("B: калькулятор у учителя остался открыт", wait_calc(teacher, "add", timeout=1500))

    student.click('.calc-tool-btn[data-op="mul"]')
    check("B: «Умножить» у ученика — открылось у учителя", wait_calc(teacher, "mul"), str(calc_view(teacher)))

    teacher.click("#calcHistoryBtn")
    check("B: «История» у учителя — открылась у ученика", wait_calc(student, "mul", True))
    student.click("#calcHistoryClose")
    check("B: ✕ истории у ученика — закрылась у учителя", wait_calc(teacher, "mul", False))

    teacher.click("#calcPanelClose")
    check("B: ✕ калькулятора у учителя — закрылся у ученика", wait_calc(student, None, False))

    # смена прототипа не трогает калькулятор и доезжает как раньше
    teacher.click('.calc-tool-btn[data-op="div"]')
    wait_calc(student, "div")
    teacher.click("#nextProtoBtn")
    try:
        student.wait_for_function("() => S.pid === '1.2'", timeout=5000)
        ok = True
    except Exception:
        ok = False
    check("B: смена прототипа доезжает, калькулятор остаётся открытым у обоих",
          ok and wait_calc(student, "div", timeout=1500) and wait_calc(teacher, "div", timeout=1500))
    ctx.close()


def part_c(browser):
    ctx = browser.new_context(viewport={"width": 1400, "height": 800})
    page = t54.new_page(ctx, errors)
    page.goto(f"{BASE}/ege_prof.html?n=1")
    page.wait_for_function("() => typeof openTask === 'function'")
    page.click("#protoList .mode-card")
    board_on(page)
    pos = page.evaluate("() => getComputedStyle(document.getElementById('boardCanvas')).position")
    check("C: профиль не тронут — холст по-прежнему fixed", pos == "fixed", pos)
    page.click('.calc-tool-btn[data-op="add"]')
    st = page.evaluate("() => tsGetState()")
    check("C: профиль не тронут — калькулятор не в снимке", "calcOp" not in st)
    ctx.close()


def run():
    with t54.local_server(), sync_playwright() as p:
        browser = p.chromium.launch()
        part_a(browser)
        part_b(browser)
        part_c(browser)
        browser.close()
    check("без ошибок JS", not errors, "; ".join(errors[:3]))
    if failures:
        print(f"\nИТОГ: провалено {len(failures)}")
        sys.exit(1)
    print("\nИТОГ: всё прошло")


if __name__ == "__main__":
    run()
