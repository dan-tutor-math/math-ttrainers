"""
Промпт №79: «Завершить сессию».

Учитель в панели «Совместный доступ» жмёт «Завершить сессию», подтверждает
— у учеников поверх страницы, на которой они были, «Занятие завершено.
Спасибо за урок, до свидания!» и кнопка «На главную»; их браузер забывает
код (следующий заход на сайт не уводит на сцену старого занятия). У учителя
сессия уходит из списка сессий, вкладка продолжает с новым кодом.

Проверяем:
  A. Подтверждение: «Завершить сессию» → «Отмена» ничего не завершает.
  B. Ученик на сцене: надпись поверх последнего экрана, кадр на той же
     странице, код стёрт; «Остаться» прячет надпись; «На главную» — обычная
     главная, без сцены и без старого кода.
  C. Ученик в обычном режиме (на доске учителя): та же надпись на странице.
  D. Учитель: новый код, старой сессии нет в списке, строка в базе
     помечена завершённой.
  E. Старая ссылка: на сцене и в обычном режиме — «Это занятие уже
     завершено»; код в поле «Подключиться» — «Эта сессия уже завершена».
  F. Ученик был без связи в момент завершения — узнаёт при переподключении.

Заглушка Supabase — из теста №11 (доработка сцены). Живьём на сайте всё
перепроверяется руками.

Запуск: python3 test_prompt79_end_session.py
"""
import sys

from playwright.sync_api import sync_playwright

import test_prompt11_shared_screen as t11
import test_prompt11_stage_polish as P
import test_prompt11_board_stage as BS
import test_prompt54_trainer_sync_and_cards as t54

PORT = 8979
t11.PORT = PORT
t11.BASE = P.BASE = BS.BASE = BASE = f"http://127.0.0.1:{PORT}"
failures = t11.failures
errors = t11.errors
check = t11.check
wait_js = BS.wait_js

ROW = "c => { const t = JSON.parse(localStorage.getItem('fakeTrainerSessions') || '{}'); return t[c] || null; }"
ENDED_ON = "() => document.getElementById('ended').classList.contains('on')"


def open_panel(page):
    if not page.evaluate("() => document.querySelector('.ts-share-pop').classList.contains('open')"):
        page.click(".ts-share-btn")
    page.wait_for_selector(".ts-share-pop.open")


def run_main(browser):
    ctx = browser.new_context()
    teacher = P.participant(ctx, "T", 1280, 800)
    teacher.goto(f"{BASE}/oge11.html")
    old = t54.wait_code(teacher)
    teacher.click("#pickerArea .mode-card[data-id]:not(.random):not(.soon)")
    teacher.wait_for_timeout(400)

    student = P.participant(ctx, "S", 1000, 680)
    student.goto(f"{BASE}/oge11.html?s={old}")
    f = t11.wait_stage(student)
    plain = P.participant(ctx, "Q", 900, 640)
    plain.add_init_script("try { localStorage.setItem('Q:tsStage:direct', '1'); } catch (e) {}")
    plain.goto(f"{BASE}/oge11.html?s={old}")
    plain.wait_for_function("c => window.TrainerSession && window.TrainerSession.getCode() === c", arg=old, timeout=10000)
    # ещё один ученик — будет без связи в момент завершения (F)
    off = P.participant(ctx, "O", 900, 640)
    off.add_init_script("try { localStorage.setItem('O:tsStage:direct', '1'); } catch (e) {}")
    off.goto(f"{BASE}/oge11.html?s={old}")
    off.wait_for_function("c => window.TrainerSession && window.TrainerSession.getCode() === c", arg=old, timeout=10000)
    teacher.wait_for_function("() => document.querySelector('.ts-peers-badge').textContent === '3'", timeout=12000)

    print("A. Подтверждение")
    open_panel(teacher)
    check("A: у учителя есть «Завершить сессию»", teacher.is_visible("#tsEnd"))
    open_panel(plain)
    check("A: у ученика такой кнопки нет", not plain.is_visible("#tsEnd"))
    teacher.click("#tsEnd")
    check("A: нажал — появилось подтверждение", teacher.is_visible("#tsEndConfirm") and not teacher.is_visible("#tsEnd"))
    teacher.click("#tsEndNo")
    teacher.wait_for_timeout(600)
    check("A: «Отмена» — подтверждение спряталось, кнопка вернулась",
          not teacher.is_visible("#tsEndConfirm") and teacher.is_visible("#tsEnd"))
    check("A: и ничего не завершилось", teacher.evaluate("() => TrainerSession.getCode()") == old
          and not student.evaluate(ENDED_ON) and plain.evaluate("() => !!TrainerSession.getCode()"))

    print("B–D. Завершение")
    stage_path = f.evaluate("() => location.pathname")
    off.evaluate("() => window.__fakeDeaf()")      # этот ученик сейчас без связи
    teacher.click("#tsEnd")
    teacher.click("#tsEndYes")
    ok = wait_js(student, ENDED_ON, 6000)
    check("B: у ученика на сцене — «Занятие завершено»", ok)
    check("B: текст прощания", "до свидания" in student.inner_text("#ended"), student.inner_text("#ended"))
    check("B: кнопка «На главную» есть", student.is_visible("#endedHome"))
    f = t11.stage_frame(student)
    check("B: под надписью — та же страница, что была", f.evaluate("() => location.pathname") == stage_path)
    check("B: кадр сцены отключился от сессии", f.evaluate("() => TrainerSession.getCode()") is None)
    check("B: браузер ученика забыл код и роль", student.evaluate(
        "() => !localStorage.getItem('S:trainerSession:global') && !localStorage.getItem('S:trainerSession:global:role')"))
    check("B: и вкладка — тоже", f.evaluate("() => !sessionStorage.getItem('tsTab:code')"))

    ok = wait_js(plain, "() => !!document.getElementById('tsEnded')", 6000)
    check("C: ученик в обычном режиме — надпись поверх страницы", ok)
    check("C: та же надпись и «На главную»", plain.is_visible("#tsEndedHome") and "Занятие завершено" in plain.inner_text("#tsEnded"))
    check("C: страница та же", plain.url.split("?")[0].endswith("/oge11.html"), plain.url)
    plain.click("#tsEndedStay")
    check("C: «Остаться» — надпись убрана, страница на месте",
          not plain.evaluate("() => !!document.getElementById('tsEnded')") and plain.url.split("?")[0].endswith("/oge11.html"))
    check("C: ученик больше не в сессии", plain.evaluate("() => TrainerSession.getCode()") is None)

    teacher.wait_for_function("() => document.getElementById('tsMsg').textContent.indexOf('завершена') >= 0", timeout=8000)
    new = teacher.evaluate("() => TrainerSession.getCode()")
    check("D: у учителя новый код", new and new != old, f"{old} → {new}")
    check("D: учитель по-прежнему ведущий", teacher.evaluate("() => TrainerSession.isLeader()"))
    check("D: старой сессии нет в списке сессий", not teacher.evaluate(
        "c => JSON.parse(localStorage.getItem('tsSessions:v1') || '[]').some(e => e.code === c)", old))
    row = teacher.evaluate(ROW, old)
    check("D: строка старой сессии в базе помечена завершённой", bool(row and row.get("state", {}).get("__ended")), str(row)[:120])
    check("D: в панели — «Сессия завершена»", "завершена" in teacher.inner_text("#tsMsg"), teacher.inner_text("#tsMsg"))
    check("D: страница учителя та же, задание на месте", teacher.url.split("?")[0].endswith("/oge11.html")
          and teacher.evaluate("() => { const s = tsGetState(); return !!(s && s.picker !== undefined); }"))

    print("F. Ученик был без связи")
    check("F: пока связи нет, надписи нет", not off.evaluate("() => !!document.getElementById('tsEnded')"))
    off.evaluate("() => window.__fakeKill()")       # связь вернулась — переподключение
    ok = wait_js(off, "() => !!document.getElementById('tsEnded')", 10000)
    check("F: переподключился — узнал, что занятие завершено", ok)
    check("F: и код забыт", off.evaluate("() => TrainerSession.getCode()") is None)

    print("B. «На главную»")
    student.click("#endedStay")
    check("B: «Остаться» прячет надпись на сцене", not student.evaluate(ENDED_ON))
    student.evaluate("() => document.getElementById('ended').classList.add('on')")
    student.click("#endedHome")
    student.wait_for_url("**/index.html", timeout=8000)
    student.wait_for_function("() => window.TrainerSession && window.TrainerSession.getCode()", timeout=10000)
    student.wait_for_timeout(800)
    check("B: «На главную» — обычная главная, не сцена", "stage.html" not in student.url, student.url)
    sc = student.evaluate("() => TrainerSession.getCode()")
    check("B: ученик не вернулся в старую сессию", sc not in (old, new, "follower"), sc)

    print("E. Старая ссылка")
    late = P.participant(ctx, "L", 1000, 680)
    late.goto(f"{BASE}/oge11.html?s={old}")
    late.wait_for_url("**/stage.html?*", timeout=10000)
    ok = wait_js(late, ENDED_ON, 12000)
    check("E: на сцене — надпись", ok)
    check("E: «Это занятие уже завершено»", "уже завершено" in late.inner_text("#ended"), late.inner_text("#ended"))
    check("E: браузер код не запомнил", late.evaluate("() => !localStorage.getItem('L:trainerSession:global')"))
    late2 = P.participant(ctx, "M", 900, 640)
    late2.add_init_script("try { localStorage.setItem('M:tsStage:direct', '1'); } catch (e) {}")
    late2.goto(f"{BASE}/oge11.html?s={old}")
    ok = wait_js(late2, "() => !!document.getElementById('tsEnded')", 12000)
    check("E: в обычном режиме — тоже", ok and "уже завершено" in late2.inner_text("#tsEnded"))
    late2.wait_for_function("() => window.TrainerSession && window.TrainerSession.getCode()", timeout=10000)
    check("E: и в старую сессию не подключился", late2.evaluate("() => TrainerSession.getCode()") != old)
    late2.click("#tsEndedStay")
    open_panel(late2)
    late2.fill("#tsJoinInput", old)
    late2.click("#tsJoin")
    ok = wait_js(late2, "() => document.getElementById('tsMsg').textContent.indexOf('уже завершена') >= 0", 12000)
    check("E: код в «Подключиться» — «Эта сессия уже завершена»", ok, late2.inner_text("#tsMsg"))
    check("E: и ученик остался при своём", late2.evaluate("() => TrainerSession.getCode()") != old)

    print("D. Новая сессия учителя работает")
    nst = P.participant(ctx, "N", 900, 640)
    nst.add_init_script("try { localStorage.setItem('N:tsStage:direct', '1'); } catch (e) {}")
    nst.goto(f"{BASE}/oge11.html?s={new}")
    ok = wait_js(nst, f"() => window.TrainerSession && TrainerSession.getCode() === '{new}'", 10000)
    check("D: по новому коду ученик подключается", ok)
    ok = wait_js(teacher, "() => document.querySelector('.ts-peers-badge').textContent === '1'", 12000)
    check("D: и учитель видит его на связи", ok)
    ctx.close()


def run_board(browser):
    """C. ученик в обычном режиме на доске учителя"""
    ctx = browser.new_context()
    teacher, _ = BS.teacher_boards(ctx)
    code = teacher.evaluate("() => TrainerSession.getCode()")
    teacher.evaluate("() => window.openBoard('bA')")
    plain = P.participant(ctx, "Q", 900, 640)
    plain.add_init_script("try { localStorage.setItem('Q:tsStage:direct', '1'); } catch (e) {}")
    plain.goto(f"{BASE}/boards.html?s={code}")
    wait_js(plain, "() => document.getElementById('bdViewerWait').classList.contains('hidden')", 12000)
    # у досок своей кнопки нет — завершаем тем же, что зовёт кнопка
    teacher.evaluate("() => TrainerSession.endSession()")
    ok = wait_js(plain, "() => !!document.getElementById('tsEnded')", 6000)
    check("C: ученик на доске учителя — надпись «Занятие завершено»", ok)
    check("C: доска под надписью на месте", plain.evaluate("() => window.getCurrentBoard() && window.getCurrentBoard().objects.length > 0"))
    ctx.close()


def run():
    with t11.local_server(), sync_playwright() as p:
        browser = p.chromium.launch()
        run_main(browser)
        print("C. Доска")
        run_board(browser)
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
