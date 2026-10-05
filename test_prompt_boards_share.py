"""
«Совместный доступ» прямо на досках.

Урок часто идёт только на досках, а кнопки совместного доступа там не было:
за кодом для ученика приходилось уходить на главную. Теперь на странице
досок у учителя та же кнопка и та же панель, что на тренажёрах (код,
ссылка, сессии, ученики на связи, «Завершить», права), а у облачной кнопки
«Совместная работа» (общая доска по email) — свой значок, чтобы две кнопки
не путались.

Проверяем:
  A. Учитель открыл доски сам, без сессии с главной: кнопка есть, видна
     (не под верхней панелью и не под кнопками списка), панель открывается,
     код и ссылка boards.html?s=КОД, подсказка про доску.
  B. Открыл доску: кнопка видна поверх верхней панели; ссылка без
     #board=; значок облачной кнопки другой; рейл в верхней строке не
     наезжает на кнопку.
  C. Ученик по ссылке с досок — на сцене видит открытую доску учителя;
     у ученика кнопки нет; у учителя «Учеников на связи: 1».
  D. Обратный путь: «Назад к доскам» — ученик ждёт; «К тренажёрам» —
     ученик на главной; учитель в тренажёр и снова на доски — ученик
     следом, код тот же всё время.

Заглушка Supabase и помощники — из тестов №54 и №11 (доска на сцене).
Запуск: python3 test_prompt_boards_share.py
"""
import sys

from playwright.sync_api import sync_playwright

import test_prompt11_board_stage as BS
import test_prompt11_shared_screen as t11
import test_prompt11_stage_polish as P
import test_prompt54_trainer_sync_and_cards as t54

PORT = 8993
t11.PORT = PORT
t11.BASE = P.BASE = BS.BASE = BASE = f"http://127.0.0.1:{PORT}"
failures = t11.failures
errors = t11.errors
check = t11.check

# кнопка видна и нажимаема: в её центре сверху лежит она сама
ON_TOP = """() => { const b = document.querySelector('.ts-share-btn'); if (!b) return 'нет кнопки';
  const r = b.getBoundingClientRect(); if (!r.width) return 'не видна';
  const el = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
  return el && (el === b || b.contains(el)) ? true : (el ? (el.id || el.className || el.tagName) : 'пусто'); }"""


def rect(target, sel):
    return target.evaluate("""s => { const e = document.querySelector(s); if (!e) return null;
        const r = e.getBoundingClientRect(); return r.width ? [r.left, r.top, r.right, r.bottom] : null; }""", sel)


def overlap(a, b):
    return bool(a and b and a[0] < b[2] and b[0] < a[2] and a[1] < b[3] and b[1] < a[3])


def run_main(browser):
    ctx = browser.new_context()
    teacher, _ = BS.teacher_boards(ctx)

    # ── A. список досок ──
    check("A: на досках у учителя есть кнопка «Совместный доступ»",
          teacher.evaluate("() => !!document.querySelector('.ts-share-btn')"))
    v = teacher.evaluate(ON_TOP)
    check("A: кнопка видна и нажимаема на списке досок", v is True, str(v))
    btn = rect(teacher, ".ts-share-btn")
    check("A: не наезжает на кнопку темы", not overlap(btn, rect(teacher, "#themeToggle")))
    acts = teacher.evaluate("""() => [...document.querySelectorAll('.bl-head-actions > *')]
        .map(e => e.getBoundingClientRect()).filter(r => r.width).map(r => [r.left, r.top, r.right, r.bottom])""")
    check("A: не наезжает на кнопки списка («Создать доску» и др.)", not any(overlap(btn, a) for a in acts))
    code = t54.wait_code(teacher)
    teacher.click(".ts-share-btn")
    ok = BS.wait_js(teacher, "() => document.querySelector('.ts-share-pop').classList.contains('open')", 2000)
    check("A: панель открывается", ok)
    check("A: в панели код сессии", teacher.evaluate("() => document.getElementById('tsCode').textContent") == code)
    link = teacher.evaluate("() => document.getElementById('tsLink').value")
    check("A: ссылка — доски с кодом", link.endswith(f"/boards.html?s={code}"), link)
    hint = teacher.evaluate("() => document.querySelector('.ts-share-pop').textContent")
    check("A: подсказка — про доску", "увидит доску" in hint)
    check("A: «Завершить сессию» и «Новая сессия» на месте", teacher.evaluate(
        "() => !!document.getElementById('tsEnd') && !!document.getElementById('tsNewSess')"))
    teacher.mouse.click(600, 500)  # мимо панели — закрыть

    # ── B. открытая доска ──
    teacher.evaluate("() => window.openBoard('bA')")
    teacher.wait_for_function("() => window.getCurrentBoard() && window.getCurrentBoard().id === 'bA' && boardActive")
    teacher.wait_for_timeout(300)
    v = teacher.evaluate(ON_TOP)
    check("B: на доске кнопка видна поверх верхней панели", v is True, str(v))
    link = teacher.evaluate("() => TrainerSession.getShareUrl()")
    check("B: ссылка без номера доски (#board=)", "#" not in link and link.endswith(f"?s={code}"), link)
    icons = teacher.evaluate("""() => { const a = document.querySelector('#bdShareBtn svg'), b = document.querySelector('.ts-share-btn svg');
        return [a ? a.innerHTML : null, b ? b.innerHTML : null]; }""")
    if icons[0] is None:
        # облачного слоя в заглушке может не быть — сверяем исходники
        src = open("boards-cloud.js", encoding="utf-8").read()
        mine = open("session-share.js", encoding="utf-8").read()
        sess_path = 'M10.6 9.4L15 6.9'
        check("B: значок облачной «Совместной работы» другой (по исходникам)",
              sess_path in mine and sess_path not in src)
    else:
        check("B: значок облачной «Совместной работы» другой", icons[0] != icons[1])
        check("B: облачная кнопка не наезжает на «Совместный доступ»",
              not overlap(rect(teacher, "#bdShareBtn"), rect(teacher, ".ts-share-btn")))
    # рейл в верхней строке (так бывает, когда док у левого края)
    teacher.evaluate("() => { const r = document.querySelector('.bd-rail'); window.__railCls = r.className; r.classList.remove('pos-left'); r.classList.add('pos-top'); }")
    teacher.wait_for_timeout(100)
    check("B: рейл в верхней строке не наезжает на кнопку",
          not overlap(rect(teacher, ".bd-rail"), rect(teacher, ".ts-share-btn")),
          f"{rect(teacher, '.bd-rail')} / {rect(teacher, '.ts-share-btn')}")
    teacher.evaluate("() => { document.querySelector('.bd-rail').className = window.__railCls; }")

    # ── C. ученик по ссылке с досок ──
    student = P.participant(ctx, "S", 1000, 700)
    student.goto(link)
    f = t11.wait_stage(student)
    ok = BS.wait_js(student, """() => { const f = __stageActiveFrame(); try {
        return f.contentWindow.location.pathname.endsWith('/boards.html'); } catch (e) { return false; } }""", 12000)
    check("C: ученик по ссылке с досок — на сцене, на досках", ok)
    f = t11.stage_frame(student)
    tids = teacher.evaluate(BS.TEACHER_STATE)["ids"]
    ok = BS.wait_js(f, "ids => { const B = window.getCurrentBoard(); return B && B.objects && B.objects.map(o => o.id).join() === ids.join(); }",
                    15000, tids)
    check("C: ученик видит открытую доску учителя", ok)
    check("C: у ученика кнопки совместного доступа нет", f.evaluate("() => !document.querySelector('.ts-share-btn')"))
    check("C: у ученика экрана входа нет", f.evaluate("() => !document.getElementById('authGate')"))
    ok = BS.wait_js(teacher, "() => { document.querySelector('.ts-share-btn').click(); return /Учеников на связи: 1/.test(document.getElementById('tsPeers').textContent); }", 8000)
    check("C: у учителя в панели «Учеников на связи: 1»", ok,
          teacher.evaluate("() => document.getElementById('tsPeers').textContent"))
    ok = BS.wait_js(teacher, "() => document.querySelector('.ts-share-btn').classList.contains('ts-has-peers')", 3000)
    check("C: зелёный значок учеников на кнопке", ok)
    teacher.mouse.click(600, 400)

    # ── D. обратный путь ──
    teacher.click("#bdBack")
    ok = BS.wait_js(f, "() => document.getElementById('bdViewerWaitText').textContent.indexOf('выбирает') >= 0", 8000)
    check("D: «Назад к доскам» — у ученика «Учитель выбирает доску…»", ok)
    teacher.click("#blToIndex")
    teacher.wait_for_url("**/index.html")
    check("D: код тот же на главной", t54.wait_code(teacher) == code)
    ok = BS.wait_js(student, """() => { const f = __stageActiveFrame(); try {
        return f.contentWindow.location.pathname.endsWith('/index.html') && !f.classList.contains('waiting'); } catch (e) { return false; } }""", 12000)
    check("D: «К тренажёрам» — ученик на главной следом", ok)
    teacher.evaluate("() => TrainerSession.navigateTo('oge8.html')")
    teacher.wait_for_url("**/oge8.html")
    check("D: код тот же в тренажёре", t54.wait_code(teacher) == code)
    ok = BS.wait_js(student, """() => { const f = __stageActiveFrame(); try {
        return f.contentWindow.location.pathname.endsWith('/oge8.html') && !f.classList.contains('waiting'); } catch (e) { return false; } }""", 12000)
    check("D: ученик в тренажёре следом", ok)
    teacher.evaluate("() => TrainerSession.navigateTo('boards.html')")
    teacher.wait_for_url("**/boards.html")
    check("D: снова на досках — код тот же", t54.wait_code(teacher) == code)
    teacher.evaluate(BS.BOOT_JS)
    teacher.wait_for_function("() => window.getDB && window.getDB().boards.length >= 2")
    v = teacher.evaluate(ON_TOP)
    check("D: кнопка на досках снова на месте", v is True, str(v))
    ok = BS.wait_js(student, """() => { const f = __stageActiveFrame(); try {
        return f.contentWindow.location.pathname.endsWith('/boards.html') && !f.classList.contains('waiting'); } catch (e) { return false; } }""", 12000)
    check("D: ученик на досках следом", ok)
    teacher.evaluate("() => window.openBoard('bB')")
    f = t11.stage_frame(student)
    ok = BS.wait_js(f, "() => { const B = window.getCurrentBoard(); return B && B.objects && B.objects.length === 1 && B.objects[0].id === 'q1'; }", 15000)
    check("D: и видит доску, которую учитель открыл", ok)
    ctx.close()


def run():
    with t11.local_server(), sync_playwright() as p:
        browser = p.chromium.launch()
        print("Совместный доступ на досках")
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
