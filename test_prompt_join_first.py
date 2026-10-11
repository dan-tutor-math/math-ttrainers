"""
Панель «Совместный доступ»: главное — подключиться по коду.

Зачем. Панель открывает и ученик. Раньше первым в ней стоял крупный СВОЙ код
со «Скопировать», а поле «Есть код от другого человека?» пряталось внизу —
ученики думали, что их собственный код нужно куда-то вписать. Теперь сверху
крупный блок «Подключиться к занятию» с полем для кода от учителя; свой код
со ссылкой — ниже, под правами ученика; подсказки — в самом низу.

Проверяем:
  A. Учитель, тренажёр: порядок сверху вниз — заголовок, блок подключения,
     «Права ученика», свой код, ссылка и копирование, подсказки последними.
     Блок подключения виден без прокрутки, его кнопка — самая крупная.
  B. Пустое поле — «Впишите код от учителя», фокус в поле.
  C. Ученик: Enter в поле подключает (форма), у ученика над кодом
     «Код этого занятия», а не «Ваш код».
  D. Доски: тот же порядок.
  E. Узкий экран (телефон): блок подключения влезает по ширине.
  F. В поле подключения не подставляется код той сессии, где мы и так
     сейчас (браузер учителя помнит «последний код», под которым сам
     когда-то подключался), а чужой прошлый код — подставляется.
Снимки панели кладёт в /tmp/join_first_*.png (светлая и тёмная тема).

Заглушка Supabase — из тестов №54 и №11.
Запуск: python3 test_prompt_join_first.py
"""
import sys

from playwright.sync_api import sync_playwright

import test_prompt11_board_stage as BS
import test_prompt11_shared_screen as t11
import test_prompt11_stage_polish as P
import test_prompt54_trainer_sync_and_cards as t54

PORT = 8986
t11.PORT = PORT
t11.BASE = P.BASE = BS.BASE = BASE = f"http://127.0.0.1:{PORT}"
failures = t11.failures
errors = t11.errors
check = t11.check

# вертикальные места блоков панели (в порядке документа и по экрану)
ORDER = """() => { const pop = document.querySelector('.ts-share-pop');
  const y = (sel) => { const e = pop.querySelector(sel); if (!e || !e.offsetParent) return null;
    return e.getBoundingClientRect().top + pop.scrollTop; };
  const hints = [...pop.querySelectorAll(':scope > .ts-share-hint')].filter(e => e.offsetParent && e.id !== 'tsPeers');
  return { title: y('.ts-share-title'), join: y('#tsJoinForm'), perm: y('#tsPermSection'), code: y('#tsCode'),
           link: y('#tsLink'), hintTop: hints.length ? Math.min(...hints.map(e => e.getBoundingClientRect().top + pop.scrollTop)) : null,
           codeTitle: (pop.querySelector('#tsCodeTitle') || {}).textContent }; }"""


def open_panel(page):
    page.evaluate("() => { const p = document.querySelector('.ts-share-pop'); if (!p.classList.contains('open')) document.querySelector('.ts-share-btn').click(); }")
    page.wait_for_function("() => document.querySelector('.ts-share-pop').classList.contains('open')")
    page.wait_for_timeout(450)   # анимация «джинна» у меню


def check_order(page, tag):
    o = page.evaluate(ORDER)
    ok = all(o[k] is not None for k in ("title", "join", "perm", "code", "link", "hintTop"))
    check(f"{tag}: все блоки на месте", ok, str(o))
    if not ok:
        return o
    check(f"{tag}: подключение — сразу под заголовком, выше всего", o["title"] < o["join"] < o["perm"], str(o))
    check(f"{tag}: свой код — ниже прав ученика", o["perm"] < o["code"] < o["link"], str(o))
    check(f"{tag}: подсказки — в самом низу", o["hintTop"] > o["link"], str(o))
    return o


def run_main(browser):
    ctx = browser.new_context(viewport={"width": 1300, "height": 820})
    teacher = t54.new_page(ctx, errors)
    teacher.goto(f"{BASE}/oge8.html")
    code = t54.wait_code(teacher)
    open_panel(teacher)
    check_order(teacher, "A")
    vis = teacher.evaluate("""() => { const f = document.getElementById('tsJoinForm').getBoundingClientRect();
        return f.top >= 0 && f.bottom <= innerHeight; }""")
    check("A: блок подключения виден без прокрутки", vis)
    sizes = teacher.evaluate("""() => [...document.querySelectorAll('.ts-share-pop button')].filter(b => b.offsetParent)
        .map(b => ({ id: b.id, h: b.getBoundingClientRect().height, fs: parseFloat(getComputedStyle(b).fontSize) }))""")
    join = next(s for s in sizes if s["id"] == "tsJoin")
    check("A: «Подключиться» — самая крупная кнопка панели",
          all(join["fs"] >= s["fs"] and join["h"] >= s["h"] - 0.5 for s in sizes), str(sizes))
    check("A: над кодом — «Ваш код — отправьте его ученику»", teacher.inner_text("#tsCodeTitle").startswith("Ваш код"))
    teacher.locator(".ts-share-pop").screenshot(path="/tmp/join_first_teacher_light.png")

    # ── B. пустое поле ──
    teacher.fill("#tsJoinInput", "")
    teacher.click("#tsJoin")
    check("B: пустой код — подсказка", "Впишите код" in teacher.inner_text("#tsMsg"), teacher.inner_text("#tsMsg"))
    check("B: фокус в поле", teacher.evaluate("() => document.activeElement.id") == "tsJoinInput")
    check("B: код учителя не сменился", teacher.evaluate("() => TrainerSession.getCode()") == code)

    # ── C. ученик подключается Enter-ом ──
    s = t54.new_page(ctx, errors)
    s.add_init_script("try { localStorage.setItem('tsStage:direct', '1'); } catch (e) {}")
    s.goto(f"{BASE}/oge8.html")
    t54.wait_code(s)
    open_panel(s)
    s.fill("#tsJoinInput", code.lower())
    s.press("#tsJoinInput", "Enter")
    ok = BS.wait_js(s, "c => window.TrainerSession && TrainerSession.getCode() === c && !TrainerSession.isLeader()", 12000, code)
    check("C: Enter в поле — ученик подключился", ok)
    s.wait_for_load_state()
    t54.wait_code(s)
    open_panel(s)
    check("C: у ученика над кодом — «Код этого занятия»", s.inner_text("#tsCodeTitle") == "Код этого занятия",
          s.inner_text("#tsCodeTitle"))
    o = s.evaluate(ORDER)
    check("C: у ученика подключение тоже сверху, код ниже", o["join"] is not None and o["code"] is not None and o["join"] < o["code"], str(o))
    s.locator(".ts-share-pop").screenshot(path="/tmp/join_first_student.png")
    s.close()

    # ── F. «последний код» = свой — в поле его нет ──
    teacher.evaluate("c => { localStorage.setItem('trainerSession:lastJoinCode', c); }", code)
    teacher.evaluate("() => { document.querySelector('.ts-share-btn').click(); }")   # закрыть
    teacher.wait_for_timeout(500)
    open_panel(teacher)
    check("F: свой код в поле подключения не подставляется", teacher.input_value("#tsJoinInput") == "",
          teacher.input_value("#tsJoinInput"))
    teacher.evaluate("() => { localStorage.setItem('trainerSession:lastJoinCode', 'ABCDEFGH'); }")
    teacher.evaluate("() => { document.querySelector('.ts-share-btn').click(); }")
    teacher.wait_for_timeout(500)
    open_panel(teacher)
    check("F: чужой прошлый код подставляется, как раньше", teacher.input_value("#tsJoinInput") == "ABCDEFGH",
          teacher.input_value("#tsJoinInput"))
    teacher.evaluate("() => { localStorage.removeItem('trainerSession:lastJoinCode'); }")
    teacher.fill("#tsJoinInput", "")

    # тёмная тема
    teacher.evaluate("() => { document.documentElement.setAttribute('data-theme', 'dark'); }")
    teacher.wait_for_timeout(200)
    teacher.locator(".ts-share-pop").screenshot(path="/tmp/join_first_teacher_dark.png")

    # ── E. телефон ──
    teacher.set_viewport_size({"width": 390, "height": 780})
    teacher.wait_for_timeout(300)
    open_panel(teacher)
    w = teacher.evaluate("""() => { const p = document.querySelector('.ts-share-pop').getBoundingClientRect();
        const f = document.getElementById('tsJoinForm').getBoundingClientRect();
        const b = document.getElementById('tsJoin').getBoundingClientRect();
        return { p: [p.left, p.right], f: [f.left, f.right], b: [b.left, b.right], vw: innerWidth }; }""")
    check("E: на телефоне блок подключения внутри панели и экрана",
          w["p"][0] >= 0 and w["p"][1] <= w["vw"] and w["f"][0] >= w["p"][0] and w["f"][1] <= w["p"][1] and w["b"][1] <= w["f"][1], str(w))
    teacher.locator(".ts-share-pop").screenshot(path="/tmp/join_first_phone.png")
    ctx.close()

    # ── D. доски ──
    ctx = browser.new_context(viewport={"width": 1300, "height": 820})
    t, _ = BS.teacher_boards(ctx)
    t.evaluate("() => window.openBoard('bA')")
    t.wait_for_timeout(400)
    open_panel(t)
    check_order(t, "D")
    t.locator(".ts-share-pop").screenshot(path="/tmp/join_first_boards.png")
    ctx.close()


def run():
    with t11.local_server(), sync_playwright() as p:
        browser = p.chromium.launch()
        print("Совместный доступ: сначала подключиться по коду")
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
