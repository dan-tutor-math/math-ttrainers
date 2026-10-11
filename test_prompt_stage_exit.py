"""
Выход ученика из занятия кнопкой-дверью на панели сцены; без «Остаться».

Зачем. Ученику, чтобы уйти с занятия, приходилось открывать панель
«Совместный доступ» и искать «Выйти из сессии». Теперь на панели сцены рядом
с «−», «100%», «+» и ✋ — дверь: только значок, квадратная, прозрачная, в
цвет капсулы (не красная). Нажатие открывает над панелью пузырь «Выйти из
занятия?» — «Выйти» / «Отмена» (на телефоне дверь легко задеть вместо
«руки»); выход — только после «Выйти». А на экранах «Занятие завершено» и
«Учитель отключил это устройство» кнопки «Остаться на этой странице» больше
нет — только «На главную».

Проверяем:
  A. Дверь на панели сцены, рядом с ✋, только значок (без текста),
     квадратная — как «+», цвет — как у остальных кнопок капсулы (не
     красный), фон прозрачный.
  B. Нажатие — пузырь «Выйти из занятия?» над панелью, внутри экрана;
     ученик всё ещё в занятии; «Отмена» закрывает, нажатие мимо — тоже,
     без ответа пузырь уходит сам через 6 с.
  C. «Выйти» — главная без сцены, учитель видит, что ученика нет, код и
     роль браузер забыл (на главной своя новая сессия, не сцена).
  F. Телефон: пузырь целиком на экране.
  D. Учитель отключил устройство — на сцене только «На главную».
  E. Ученик без сцены (обычный режим) — у надписи «Занятие завершено» одна
     кнопка «На главную».

Заглушка Supabase и помощники — из тестов №54 и №11.
Запуск: python3 test_prompt_stage_exit.py
"""
import sys

from playwright.sync_api import sync_playwright

import test_prompt11_board_stage as BS
import test_prompt11_shared_screen as t11
import test_prompt11_stage_polish as P
import test_prompt54_trainer_sync_and_cards as t54

PORT = 8983
t11.PORT = PORT
t11.BASE = P.BASE = BS.BASE = BASE = f"http://127.0.0.1:{PORT}"
failures = t11.failures
errors = t11.errors
check = t11.check


def students_online(teacher):
    return teacher.evaluate("() => TrainerSession.studentDevices().length")


def run_main(browser):
    ctx = browser.new_context()
    teacher = P.participant(ctx, "T", 1300, 820)
    teacher.goto(f"{BASE}/oge8.html")
    code = t54.wait_code(teacher)
    student = P.participant(ctx, "S", 1000, 700)
    student.goto(f"{BASE}/oge8.html?s={code}")
    t11.wait_stage(student)
    BS.wait_js(teacher, "() => TrainerSession.studentDevices().length === 1", 8000)

    # ── A ──
    info = student.evaluate("""() => { const b = document.getElementById('leaveBtn'), p = document.getElementById('panBtn');
        if (!b) return null; const cs = getComputedStyle(b), ps = getComputedStyle(p);
        const kids = [...document.getElementById('bar').children].filter(e => e.offsetParent || e.tagName === 'SPAN');
        return { color: cs.color, panColor: ps.color, bg: cs.backgroundColor, svg: !!b.querySelector('svg'),
                 afterPan: kids.indexOf(b) > kids.indexOf(p), visible: !!b.offsetParent }; }""")
    check("A: на панели сцены есть дверь, со значком", bool(info) and info["svg"] and info["visible"], info)
    check("A: она после ✋, в той же капсуле", bool(info) and info["afterPan"], info)
    check("A: цвет — как у кнопок капсулы, не красный", bool(info) and info["color"] == info["panColor"], info)
    check("A: фон прозрачный", bool(info) and info["bg"] in ("rgba(0, 0, 0, 0)", "transparent"), info)
    sz = student.evaluate("""() => { const b = document.getElementById('leaveBtn').getBoundingClientRect(), z = document.getElementById('zoomIn').getBoundingClientRect();
        return { w: b.width, h: b.height, zw: z.width, text: document.getElementById('leaveBtn').textContent.trim() }; }""")
    check("A: только значок, без текста", sz["text"] == "", sz)
    check("A: квадратная, как «+»", abs(sz["w"] - sz["h"]) < 1 and abs(sz["w"] - sz["zw"]) < 1, sz)

    # ── B ──
    ASK = "() => !document.getElementById('leaveAsk').hidden"
    student.click("#leaveBtn")
    check("B: нажатие — пузырь «Выйти из занятия?»", student.evaluate(ASK) and "Выйти из занятия?" in student.inner_text("#leaveAsk"))
    pos = student.evaluate("""() => { const a = document.getElementById('leaveAsk').getBoundingClientRect(), b = document.getElementById('bar').getBoundingClientRect();
        return { above: a.bottom <= b.top + 1, inside: a.left >= 0 && a.right <= innerWidth && a.top >= 0 }; }""")
    check("B: пузырь над панелью, на экране", pos["above"] and pos["inside"], pos)
    student.wait_for_timeout(500)
    check("B: ученик всё ещё в занятии", "stage.html" in student.url and students_online(teacher) == 1)
    student.click("#leaveNo")
    check("B: «Отмена» закрывает", not student.evaluate(ASK))
    student.click("#leaveBtn")
    student.mouse.click(30, 30)
    check("B: нажатие мимо — закрывает", not student.evaluate(ASK))
    student.click("#leaveBtn")
    ok = BS.wait_js(student, "() => document.getElementById('leaveAsk').hidden", 7500)
    check("B: без ответа пузырь уходит сам", ok)
    check("B: и ученик всё ещё в занятии", "stage.html" in student.url and students_online(teacher) == 1)

    # ── F. телефон ──
    student.set_viewport_size({"width": 390, "height": 760})
    student.wait_for_timeout(400)
    student.click("#leaveBtn")
    r = student.evaluate("() => { const a = document.getElementById('leaveAsk').getBoundingClientRect(); return [a.left, a.right, a.top, a.bottom, innerWidth, innerHeight]; }")
    check("F: на телефоне пузырь целиком на экране", r[0] >= 0 and r[1] <= r[4] and r[2] >= 0 and r[3] <= r[5], str(r))
    student.screenshot(path="/tmp/stage_exit_phone.png")
    student.click("#leaveNo")
    student.set_viewport_size({"width": 1000, "height": 700})
    student.wait_for_timeout(300)

    # ── C ──
    student.click("#leaveBtn")
    student.click("#leaveYes")
    try:
        student.wait_for_url("**/index.html", timeout=8000)
        ok = True
    except Exception:
        ok = False
    check("C: «Выйти» — главная", ok, student.url)
    student.wait_for_function("() => window.TrainerSession && TrainerSession.getCode()", timeout=10000)
    student.wait_for_timeout(800)
    check("C: главная обычная, не сцена", "stage.html" not in student.url, student.url)
    check("C: ученик не вернулся в занятие", student.evaluate("() => TrainerSession.getCode()") != code)
    ok = BS.wait_js(teacher, "() => TrainerSession.studentDevices().length === 0", 6000)
    check("C: у учителя ученика на связи больше нет (попрощался)", ok)

    # ── D. отключил учитель ──
    s2 = P.participant(ctx, "S2", 1000, 700)
    s2.goto(f"{BASE}/oge8.html?s={code}")
    t11.wait_stage(s2)
    BS.wait_js(teacher, "() => TrainerSession.studentDevices().length === 1", 8000)
    uid = teacher.evaluate("() => TrainerSession.studentDevices()[0].uid")
    teacher.evaluate("u => TrainerSession.kickDevice(u)", uid)
    ok = BS.wait_js(s2, "() => document.getElementById('ended').classList.contains('on')", 8000)
    check("D: «Учитель отключил это устройство» на сцене", ok and "отключил" in s2.inner_text("#endedTitle"))
    btns = s2.evaluate("() => [...document.querySelectorAll('#ended button')].map(b => b.textContent.trim())")
    check("D: только «На главную»", btns == ["На главную"], str(btns))

    # ── E. без сцены ──
    s3 = P.participant(ctx, "S3", 900, 640)
    s3.add_init_script("try { localStorage.setItem('S3:tsStage:direct', '1'); } catch (e) {}")
    s3.goto(f"{BASE}/oge8.html?s={code}")
    s3.wait_for_function("c => window.TrainerSession && TrainerSession.getCode() === c", arg=code, timeout=12000)
    teacher.evaluate("() => TrainerSession.endSession()")
    ok = BS.wait_js(s3, "() => !!document.getElementById('tsEnded')", 8000)
    btns = s3.evaluate("() => [...document.querySelectorAll('#tsEnded button')].map(b => b.textContent.trim())") if ok else None
    check("E: «Занятие завершено» без сцены — только «На главную»", btns == ["На главную"], str(btns))
    ctx.close()


def run():
    with t11.local_server(), sync_playwright() as p:
        browser = p.chromium.launch()
        print("Сцена: дверь «выйти», без «Остаться»")
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
