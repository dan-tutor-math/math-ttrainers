"""
«Совместный доступ» прямо на досках и меню «⋯» как на главной.

Урок часто идёт только на досках, а кнопки совместного доступа там не было:
за кодом для ученика приходилось уходить на главную. Теперь на странице
досок у учителя та же панель, что на тренажёрах (код, ссылка, сессии,
ученики на связи, «Завершить», права), а у облачной кнопки «Совместная
работа» (общая доска по email) — свой значок, чтобы две кнопки не путались.
В правом верхнем углу досок — только «⋯»: в нём совместный доступ, тема и
эффекты, как на главной. Кнопка целиком внутри верхней панели доски (раньше
кнопки углов на 3 px заходили на холст).

Проверяем:
  A. Учитель открыл доски сам, без сессии с главной: в углу только «⋯»
     (тема и совместный доступ — внутри закрытого меню), «⋯» не наезжает на
     кнопки списка; меню открывается — совместный доступ, тема, эффекты;
     панель: код и ссылка boards.html?s=КОД, подсказка про доску; тема
     переключается из меню.
  B. Открыл доску: «⋯» видна поверх верхней панели и целиком внутри неё
     (как и рейл в верхней строке); ссылка без #board=; значок облачной
     кнопки другой; облачная кнопка и рейл не наезжают на «⋯».
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
ON_TOP = """() => { const b = document.getElementById('lgMenuToggle'); if (!b) return 'нет кнопки';
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
    teacher.wait_for_function("() => !!document.querySelector('.lg-menu .ts-share-btn')", timeout=5000)
    check("A: кнопка «Совместный доступ» на досках — внутри меню «⋯»",
          teacher.evaluate("() => !!document.querySelector('.lg-menu .ts-share-btn')"))
    check("A: кнопка темы — тоже в меню", teacher.evaluate("() => !!document.querySelector('.lg-menu #themeToggle')"))
    v = teacher.evaluate(ON_TOP)
    check("A: «⋯» видна и нажимаема на списке досок", v is True, str(v))
    hidden = teacher.evaluate("""() => ['#themeToggle', '.ts-share-btn'].every(s => {
        const e = document.querySelector(s); return getComputedStyle(e).visibility === 'hidden'; })""")
    check("A: пока меню закрыто, в углу только «⋯» (тема и доступ спрятаны)", hidden)
    btn = rect(teacher, "#lgMenuToggle")
    # список в заглушке прячет слой входа (вход по email не пройден) — для
    # проверки раскладки показываем его, как после входа
    teacher.evaluate("() => { const l = document.getElementById('screenList'); if (getComputedStyle(l).display === 'none') l.style.display = 'flex'; }")
    acts = teacher.evaluate("""() => [...document.querySelectorAll('.bl-head-actions > *')]
        .map(e => e.getBoundingClientRect()).filter(r => r.width).map(r => [r.left, r.top, r.right, r.bottom])""")
    check("A: «⋯» не наезжает на кнопки списка («Создать доску» и др.)", len(acts) >= 5 and not any(overlap(btn, a) for a in acts),
          f"{len(acts)} кнопок")
    for w in (1300, 1000, 760):
        teacher.set_viewport_size({"width": w, "height": 820})
        teacher.wait_for_timeout(150)
        acts = teacher.evaluate("""() => [...document.querySelectorAll('.bl-head-actions > *, .bl-title, #blToIndex')]
            .map(e => e.getBoundingClientRect()).filter(r => r.width).map(r => [r.left, r.top, r.right, r.bottom])""")
        btn = rect(teacher, ".lg-menu-glass")
        check(f"A: ширина {w}: «⋯» не наезжает на шапку списка", not any(overlap(btn, a) for a in acts))
    teacher.set_viewport_size({"width": 1300, "height": 820})
    teacher.wait_for_timeout(150)
    code = t54.wait_code(teacher)
    teacher.click("#lgMenuToggle")
    teacher.wait_for_timeout(400)
    order = teacher.evaluate("""() => [...document.querySelectorAll('#lgMenuItems .lg-item')].map(r => r.querySelector('.lg-label').textContent)""")
    check("A: в меню — совместный доступ, тема, эффекты", len(order) == 3 and order[0] == "Совместный доступ"
          and "тема" in order[1] and order[2].startswith("Эффекты"), str(order))
    before = teacher.evaluate("() => document.documentElement.getAttribute('data-theme') || 'light'")
    teacher.click("#themeToggle")
    after = teacher.evaluate("() => document.documentElement.getAttribute('data-theme')")
    check("A: тема переключается из меню", before != after, f"{before} → {after}")
    check("A: у кнопки темы значок, а не эмодзи", teacher.evaluate("() => !!document.querySelector('#themeToggle svg.mi')"))
    teacher.click("#themeToggle")
    check("A: меню после выбора темы не закрылось", teacher.evaluate("() => document.querySelector('.lg-menu').classList.contains('is-open')"))
    teacher.click(".lg-menu .ts-share-btn")
    ok = BS.wait_js(teacher, "() => document.querySelector('.ts-share-pop').classList.contains('open')", 2000)
    check("A: панель открывается", ok)
    check("A: в панели код сессии", teacher.evaluate("() => document.getElementById('tsCode').textContent") == code)
    link = teacher.evaluate("() => document.getElementById('tsLink').value")
    check("A: ссылка — доски с кодом", link.endswith(f"/boards.html?s={code}"), link)
    hint = teacher.evaluate("() => document.querySelector('.ts-share-pop').textContent")
    check("A: подсказка — про доску", "увидит доску" in hint)
    check("A: «Завершить сессию» и «Новая сессия» на месте", teacher.evaluate(
        "() => !!document.getElementById('tsEnd') && !!document.getElementById('tsNewSess')"))
    pop = rect(teacher, ".ts-share-pop")
    check("A: панель открылась слева от меню, не под ним",
          not overlap(pop, rect(teacher, ".lg-menu-glass")), f"{pop} / {rect(teacher, '.lg-menu-glass')}")
    teacher.mouse.click(600, 500)  # мимо панели — закрыть
    teacher.wait_for_timeout(300)

    # ── B. открытая доска ──
    teacher.evaluate("() => window.openBoard('bA')")
    teacher.wait_for_function("() => window.getCurrentBoard() && window.getCurrentBoard().id === 'bA' && boardActive")
    teacher.wait_for_timeout(300)
    v = teacher.evaluate(ON_TOP)
    check("B: на доске «⋯» видна поверх верхней панели", v is True, str(v))
    bar = rect(teacher, ".bd-topbar")
    glass = rect(teacher, ".lg-menu-glass")
    check("B: «⋯» целиком внутри верхней панели, на холст не заходит", glass[3] <= bar[3] and glass[1] >= 0,
          f"капсула {glass[1]:.0f}–{glass[3]:.0f}, панель до {bar[3]:.0f}")
    mid_bar, mid_btn = (bar[1] + bar[3]) / 2, (glass[1] + glass[3]) / 2
    check("B: и стоит по центру её высоты", abs(mid_bar - mid_btn) <= 2, f"{mid_btn:.1f} / {mid_bar:.1f}")
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
        check("B: облачная кнопка не наезжает на «⋯»",
              not overlap(rect(teacher, "#bdShareBtn"), rect(teacher, "#lgMenuToggle")))
    for w in (700, 390):
        teacher.set_viewport_size({"width": w, "height": 820})
        teacher.wait_for_timeout(200)
        gears = teacher.evaluate("""() => [...document.querySelectorAll('.bd-topbar > *')]
            .map(e => e.getBoundingClientRect()).filter(r => r.width).map(r => [r.left, r.top, r.right, r.bottom])""")
        check(f"B: ширина {w}: кнопки верхней панели не уходят под «⋯»",
              not any(overlap(rect(teacher, ".lg-menu-glass"), g) for g in gears[1:]))
    teacher.set_viewport_size({"width": 1300, "height": 820})
    teacher.wait_for_timeout(200)
    # рейл в верхней строке (так бывает, когда док у левого края)
    teacher.evaluate("() => { const r = document.querySelector('.bd-rail'); window.__railCls = r.className; r.classList.remove('pos-left'); r.classList.add('pos-top'); }")
    teacher.wait_for_timeout(100)
    check("B: рейл в верхней строке не наезжает на «⋯»",
          not overlap(rect(teacher, ".bd-rail"), rect(teacher, ".lg-menu-glass")),
          f"{rect(teacher, '.bd-rail')} / {rect(teacher, '.lg-menu-glass')}")
    rl = rect(teacher, ".bd-rail")
    check("B: рейл в верхней строке тоже внутри панели", rl[3] <= bar[3] and rl[1] >= 0, str(rl))
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
    check("C: и меню «⋯» нет", f.evaluate("() => !document.querySelector('.lg-menu')"))
    check("C: у ученика экрана входа нет", f.evaluate("() => !document.getElementById('authGate')"))
    ok = BS.wait_js(teacher, "() => document.querySelector('.lg-menu .lg-dot').classList.contains('is-ok')", 8000)
    check("C: при закрытом меню на «⋯» зелёная точка — ученик на связи", ok)
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
    check("D: «⋯» на досках снова на месте", v is True, str(v))
    ok = BS.wait_js(teacher, "() => !!document.querySelector('.lg-menu .ts-share-btn')", 5000)
    check("D: и совместный доступ снова в нём", ok)
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
