"""
Промпт №82: ученик на сцене — поля и шаги, выход из сессии, отключение
учителем, без автовхода в закончившееся занятие, без «Обычного режима».

Проверяем:
  A. ОГЭ №10, «Тренировка»: учитель жмёт «Решить по шагам» — шаги открываются
     и у ученика; набранное в дроби видно у ученика, «ОК» учителя переводит
     ученика на следующий шаг; набранное учеником в шаге видно учителю.
     Ответ внизу: ученик набирает и жмёт Enter — у обоих задание решено.
  B. ОГЭ №7, «Обучение»: поле шага и «ОК» учителя — у ученика тот же шаг.
  C. Поле ответа на странице, где тренажёр его сам не регистрирует (ОГЭ №10,
     упрощённый тип), — в обе стороны.
  D. Устройства у учителя: «Устройство 1 · компьютер»; проба браузера ученика
     в список не попадает; «Отключить» — у ученика надпись, код забыт,
     у учителя устройств нет.
  E. «Выйти из сессии» у ученика: сцена уходит на главную, код забыт, заход
     на сайт — обычная страница, у учителя устройство пропадает.
  F. Ученик открывает сайт сам: учитель на связи — сцена занятия; учитель
     закрыл вкладку (без «Завершить») — обычная страница, код забыт.
  G. Кнопки «Обычный режим» нет ни на сцене, ни в панели.

Живой realtime из песочницы недоступен — заглушка Supabase из теста №54.
На сайте совместный режим — руками.

Запуск: python3 test_prompt82_stage_student.py
"""
import sys

from playwright.sync_api import sync_playwright

import test_prompt54_trainer_sync_and_cards as t54
import test_prompt11_shared_screen as t11

PORT = 8944
t11.PORT = PORT
t11.BASE = f"http://127.0.0.1:{PORT}"
BASE = t11.BASE
failures, errors = [], []


def check(name, ok, detail=""):
    print(("  ok   " if ok else "  FAIL ") + name + ("" if ok else f"  [{detail}]"))
    if not ok:
        failures.append(f"{name}: {detail}")


def participant(ctx, tag, w, h):
    p = ctx.new_page()
    p.add_init_script(f"window.__fakeLatency = 0; window.__fakeSelectDelay = 0;")
    p.add_init_script(t11.PARTICIPANT_STORAGE % repr(tag + ":"))
    p.set_viewport_size({"width": w, "height": h})
    p.on("pageerror", lambda e: errors.append(f"{p.url}: {e}"))
    return p


# Заглушка №54 отправляет через setTimeout — у закрывающейся страницы он уже
# не сработает, и прощание («bye») не уходило бы. Настоящая библиотека
# кладёт сообщение в сокет сразу, поэтому здесь без задержки шлём сразу
_SEND_OLD = "send(msg){ const m = clone(msg); setTimeout(() => bc.postMessage(m), window.__fakeLatency || 0); return Promise.resolve('ok'); },"
_SEND_NEW = "send(msg){ const m = clone(msg); if (window.__fakeLatency) setTimeout(() => bc.postMessage(m), window.__fakeLatency); else bc.postMessage(m); return Promise.resolve('ok'); },"
assert _SEND_OLD in t54.FAKE_LIB
FAKE_LIB = t54.FAKE_LIB.replace(_SEND_OLD, _SEND_NEW)


def setup(ctx):
    ctx.route("**/supabase-js.umd.js", lambda r: r.fulfill(
        status=200, content_type="application/javascript", body=FAKE_LIB))
    ctx.route("**/fonts.googleapis.com/**", lambda r: r.abort())
    ctx.route("**/fonts.gstatic.com/**", lambda r: r.abort())


def code_of(page):
    page.wait_for_function("() => window.TrainerSession && window.TrainerSession.getCode()", timeout=10000)
    return page.evaluate("() => TrainerSession.getCode()")


def student_on_stage(ctx, tag, url):
    s = participant(ctx, tag, 1100, 760)
    s.goto(url)
    f = t11.wait_stage(s)
    return s, f


def frame(s):
    return t11.stage_frame(s)


def open_steps_type(teacher):
    """первый тип ОГЭ №10, решаемый по шагам (не «упрощённый»)"""
    for i in range(1, 17):
        teacher.evaluate(f"() => startMode('type{i}')")
        teacher.wait_for_timeout(250)
        if teacher.evaluate("() => curSubMode !== 'exam' && !curTask.simple && els.showSolutionBtn.style.display === 'block'"):
            return f"type{i}"
    return None


def open_simple_type(teacher):
    for i in range(1, 17):
        teacher.evaluate(f"() => startMode('type{i}')")
        teacher.wait_for_timeout(250)
        if teacher.evaluate("() => !!curTask.simple"):
            return f"type{i}"
    return None


def part_a_c(browser):
    print("A. ОГЭ №10 — «Решить по шагам» и поля")
    ctx = browser.new_context()
    setup(ctx)
    T = participant(ctx, "T", 1180, 820)
    T.goto(BASE + "/oge10.html")
    code = code_of(T)
    S, f = student_on_stage(ctx, "S", f"{BASE}/oge10.html?s={code}")
    T.wait_for_timeout(600)
    tid = open_steps_type(T)
    check("A0 нашёлся тип с решением по шагам", tid is not None)
    T.wait_for_timeout(1200)
    f = frame(S)
    check("A1 ученик на том же задании",
          f.evaluate("() => curTask && curTask.prompt") == T.evaluate("() => curTask.prompt"))
    T.click("#showSolutionBtn")
    T.wait_for_timeout(900)
    f = frame(S)
    check("A2 «Решить по шагам» открыл шаги и у ученика",
          f.evaluate("() => els.fracPanel.style.display") == "block"
          and f.evaluate("() => els.finalPanel.style.display") == "none",
          (f.evaluate("() => els.fracPanel.style.display"), f.evaluate("() => els.finalPanel.style.display")))
    fav, tot = T.evaluate("() => [curTask.favorable, curTask.total]")
    T.click("#pfNum")
    T.keyboard.type(str(fav))
    T.click("#pfDen")
    T.keyboard.type(str(tot))
    T.wait_for_timeout(600)
    check("A3 набранное учителем в дроби видно ученику",
          f.evaluate("() => [document.getElementById('pfNum').value, document.getElementById('pfDen').value]") == [str(fav), str(tot)],
          f.evaluate("() => [document.getElementById('pfNum').value, document.getElementById('pfDen').value]"))
    T.click("#pfGo")
    T.wait_for_timeout(1300)
    check("A4 «ОК» учителя — у ученика следующий шаг (деление в столбик)",
          f.evaluate("() => stepIdx") == 1 == T.evaluate("() => stepIdx")
          and f.evaluate("() => els.qaPanel.style.display") == "block",
          (f.evaluate("() => stepIdx"), T.evaluate("() => stepIdx")))
    # ученик пишет в шаге — видно учителю
    f.evaluate("() => { const i = document.getElementById('stepInput'); i.focus(); }")
    S.keyboard.type("7")
    S.wait_for_timeout(600)
    check("A5 набранное учеником в шаге видно учителю", T.evaluate("() => document.getElementById('stepInput').value") == "7",
          T.evaluate("() => document.getElementById('stepInput').value"))
    # ответ внизу: пропускаем деление у обоих сразу — проверяем сам ответ
    T.evaluate("() => { stepIdx = 99; runStep(); }")
    f.evaluate("() => { stepIdx = 99; runStep(); }")
    T.wait_for_timeout(300)
    ans = T.evaluate("() => String(curTask.answer).replace('.', ',')")
    f.evaluate("() => document.getElementById('finalInput').focus()")
    S.keyboard.type(ans)
    S.wait_for_timeout(500)
    check("A6 ответ ученика внизу виден учителю", T.evaluate("() => els.finalInput.value") == ans,
          (T.evaluate("() => els.finalInput.value"), ans))
    S.keyboard.press("Enter")
    S.wait_for_timeout(1200)
    check("A7 Enter ученика — задание решено у обоих",
          T.evaluate("() => taskAnswered") and f.evaluate("() => taskAnswered"),
          (T.evaluate("() => taskAnswered"), f.evaluate("() => taskAnswered")))

    print("C. Поле ответа упрощённого типа — в обе стороны")
    sid = open_simple_type(T)
    check("C0 нашёлся упрощённый тип", sid is not None)
    T.wait_for_timeout(1200)
    f = frame(S)
    T.click("#finalInput")
    T.keyboard.type("0,3")
    T.wait_for_timeout(600)
    check("C1 учитель → ученик", f.evaluate("() => els.finalInput.value") == "0,3", f.evaluate("() => els.finalInput.value"))
    f.evaluate("() => els.finalInput.focus()")
    S.keyboard.press("Backspace")
    S.keyboard.type("5")
    # учитель только что сам печатал в этом поле — чужое ставится после паузы
    S.wait_for_timeout(1600)
    check("C2 ученик → учитель", T.evaluate("() => els.finalInput.value") == "0,5", T.evaluate("() => els.finalInput.value"))
    # «Показать решение и ответ» (упрощённый тип) — и у ученика
    T.click("#showSolutionBtn")
    T.wait_for_timeout(700)
    check("C3 «Показать решение» учителя открыло решение у ученика",
          f.evaluate("() => els.explainBox.style.display") == "block", f.evaluate("() => els.explainBox.style.display"))

    print("G. «Обычного режима» нет")
    check("G1 на сцене нет кнопки «Обычный режим»", S.locator("#exitBtn").count() == 0)
    f.click(".ts-share-btn")
    f.wait_for_timeout(200)
    check("G2 в панели ученика нет переключателя режима", f.locator("#tsStageToggle").count() == 0)
    check("G3 в панели ученика — «Выйти из сессии»", f.locator("#tsLeave").is_visible())
    ctx.close()


def part_b(browser):
    print("B. ОГЭ №7 — шаги «Обучения»")
    ctx = browser.new_context()
    setup(ctx)
    T = participant(ctx, "T", 1180, 820)
    T.goto(BASE + "/oge7.html")
    code = code_of(T)
    S, f = student_on_stage(ctx, "S", f"{BASE}/oge7.html?s={code}")
    T.wait_for_timeout(600)
    # тип с делением в столбик среди шагов
    found = None
    ids = T.evaluate("() => MODES.filter(m => !m.demo).map(m => m.id)")
    for i in ids:
        T.evaluate(f"() => startMode('{i}')")
        T.wait_for_timeout(250)
        T.evaluate("() => setSubMode('learn')")
        T.wait_for_timeout(700)
        if T.evaluate("() => els.qaPanel.style.display === 'block' && !els.stepInput.disabled && curTask.steps[stepIdx] && curTask.steps[stepIdx].type === 'div'"):
            found = i
            break
    check("B0 нашёлся тип с делением в столбик на первом шаге", found is not None)
    if found is None:
        ctx.close()
        return
    T.wait_for_timeout(1200)
    f = frame(S)
    check("B1 у ученика тот же шаг", f.evaluate("() => [curSubMode, stepIdx, els.qaPanel.style.display]") == ["learn", 0, "block"],
          f.evaluate("() => [curSubMode, stepIdx, els.qaPanel.style.display]"))
    before = f.evaluate("() => els.qaPrompt.textContent")
    # верный ответ первого подшага деления берём из подсказки виджета: вводим
    # то, что ждёт виджет учителя, — и он, и ученик должны продвинуться одинаково
    T.click("#stepInput")
    T.keyboard.type("1")
    T.wait_for_timeout(500)
    check("B2 набранное учителем в шаге видно ученику", f.evaluate("() => els.stepInput.value") == "1",
          f.evaluate("() => els.stepInput.value"))
    T.click("#stepGo")
    T.wait_for_timeout(1000)
    check("B3 «ОК» учителя — у ученика тот же отклик шага",
          f.evaluate("() => [els.qaPrompt.textContent, els.stepHint.textContent]")
          == T.evaluate("() => [els.qaPrompt.textContent, els.stepHint.textContent]"),
          (f.evaluate("() => [els.qaPrompt.textContent, els.stepHint.textContent]"),
           T.evaluate("() => [els.qaPrompt.textContent, els.stepHint.textContent]"), before))
    ctx.close()


def teacher_devices(T):
    T.evaluate("() => { const p = document.querySelector('.ts-share-pop'); if (!p.classList.contains('open')) document.querySelector('.ts-share-btn').click(); }")
    T.wait_for_timeout(300)
    return T.evaluate("() => Array.from(document.querySelectorAll('#tsDevList .ts-dev-row')).filter(r => r.offsetParent).map(r => r.querySelector('.ts-dev-name').textContent)")


def part_d_e_f(browser):
    print("D. Устройства и «Отключить»")
    ctx = browser.new_context()
    setup(ctx)
    T = participant(ctx, "T", 1180, 820)
    T.goto(BASE + "/oge6.html")
    code = code_of(T)
    S, f = student_on_stage(ctx, "S", f"{BASE}/oge6.html?s={code}")
    T.wait_for_timeout(1500)
    devs = teacher_devices(T)
    check("D1 у учителя одно устройство с подписью", devs == ["Устройство 1 · компьютер"], devs)
    # ученик сам открывает главную в новой вкладке — проба «учитель здесь?»
    S2 = participant(ctx, "S", 1100, 760)
    S2.goto(BASE + "/index.html")
    t11.wait_stage(S2)
    check("F1 учитель на связи — ученик, открывший сайт сам, попадает на сцену", "stage.html" in S2.url, S2.url)
    T.wait_for_timeout(1500)
    devs = teacher_devices(T)
    check("D2 проба не считается учеником, у второй вкладки — своё устройство",
          devs == ["Устройство 1 · компьютер", "Устройство 2 · компьютер"], devs)
    S2.close(run_before_unload=True)   # как закрытие вкладки человеком: с pagehide
    T.wait_for_timeout(500)
    T.locator("#tsDevList .ts-dev-kick").first.click()
    S.wait_for_timeout(1200)
    check("D3 у ученика — «Учитель отключил это устройство»",
          S.evaluate("() => document.getElementById('ended').classList.contains('on') && document.getElementById('endedTitle').textContent")
          == "Учитель отключил это устройство",
          S.evaluate("() => document.getElementById('endedTitle').textContent"))
    check("D4 код у ученика забыт", S.evaluate("() => localStorage.getItem('trainerSession:global')") is None)
    T.wait_for_timeout(1500)
    devs = teacher_devices(T)
    check("D5 у учителя устройств нет", devs == [], devs)
    check("D6 и счётчик учеников — ноль", T.evaluate("() => document.querySelector('.ts-peers-badge').textContent") in ("0", ""),
          T.evaluate("() => document.querySelector('.ts-peers-badge').textContent"))
    S.goto(BASE + "/index.html")
    code_of(S)
    check("D7 отключённый, открыв сайт, — на обычной странице", "stage.html" not in S.url and S.evaluate("() => TrainerSession.isLeader()"), S.url)
    # по ссылке снова можно войти
    S.goto(f"{BASE}/oge6.html?s={code}")
    t11.wait_stage(S)
    T.wait_for_timeout(1500)
    check("D8 по ссылке снова в занятии, у учителя виден", len(teacher_devices(T)) == 1, teacher_devices(T))

    print("E. «Выйти из сессии»")
    f = frame(S)
    f.click(".ts-share-btn")
    f.wait_for_timeout(200)
    f.click("#tsLeave")
    S.wait_for_url("**/index.html", timeout=8000)
    code_of(S)
    check("E1 сцена ушла на главную, обычная страница", "stage.html" not in S.url and S.evaluate("() => TrainerSession.isLeader()"), S.url)
    check("E2 код занятия забыт — у вкладки своя сессия", S.evaluate("() => TrainerSession.getCode()") != code)
    T.wait_for_timeout(800)
    check("E3 у учителя устройство пропало сразу", teacher_devices(T) == [], teacher_devices(T))

    print("F. Учитель закрыл вкладку без «Завершить»")
    S.goto(f"{BASE}/oge6.html?s={code}")
    t11.wait_stage(S)
    S.wait_for_timeout(800)
    T.close()
    S3 = participant(ctx, "S", 1100, 760)
    S3.goto(BASE + "/index.html")
    code_of(S3)
    S3.wait_for_timeout(1000)
    check("F2 учителя нет — ученик на обычной странице, а не на сцене", "stage.html" not in S3.url, S3.url)
    check("F3 код прошлого занятия забыт", S3.evaluate("() => TrainerSession.getCode()") != code
          and S3.evaluate("() => localStorage.getItem('trainerSession:global')") != code)
    ctx.close()


def run():
    with t11.local_server(), sync_playwright() as pw:
        browser = pw.chromium.launch()
        part_a_c(browser)
        part_b(browser)
        part_d_e_f(browser)
        browser.close()


if __name__ == "__main__":
    run()
    if errors:
        print("\nОшибки JavaScript:")
        for e in errors:
            print("  " + e)
    print()
    if failures or errors:
        print(f"ИТОГ: {len(failures)} провалов, {len(errors)} ошибок JS")
        sys.exit(1)
    print("ИТОГ: всё прошло")
