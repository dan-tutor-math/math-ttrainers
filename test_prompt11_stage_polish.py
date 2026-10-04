"""
Промпт №11 нового списка, доработка «общего экрана» после проверки на живом сайте.

Что было:
  1. При переходе учителя на другую страницу у ученика экран на миг
     становился тёмным (кадр перезагружался при каждой смене размера —
     у длинной главной появляется полоса прокрутки), а при переходе стрелкой
     №11 → №12 сначала показывался список прототипов №12 и только потом
     прототип, открытый у учителя.
  2. Курсора учителя у ученика видно не было.
  3. Калькуляторы «Сложить/Вычесть/…», колонка «+», доска, тема и прочие
     панели, открытые учителем, у ученика на сцене оставались закрытыми.
  4. О связи ученик на сцене ничего не знал; учитель не видел, есть ли
     ученик на связи; молчаливый обрыв связи замечался только через
     полминуты.

Проверяем:
  J. Смена страницы без пустого экрана и без промежуточного экрана: запись
     того, что видно на сцене каждые 20 мс, пока учитель ходит стрелкой
     №11 → №12, на главную и обратно.
  K. Курсор учителя на сцене — там же, в масштабе сцены; прячется, когда
     мышь ушла из окна; учеников в обычном режиме курсор не касается.
  L. Открытое учителем открыто у ученика: калькулятор (и его закрытие),
     история калькулятора, история примеров, колонка «+», доска, «свернуть
     подсказки», тема.
  M. Кто на связи: у учителя «Учеников на связи: 1» и значок на кнопке;
     ученик в обычном режиме ушёл — учитель это видит сразу.
  N. Связь: обрыв канала — у ученика на сцене «Связь прервалась», затем
     «восстановлена», и действия учителя снова доходят; нет интернета — своя
     надпись; учитель пропал — «Учитель не на связи»; канал молча умер (ни
     статуса, ни сообщений) — ученик сам переподключается и догоняет.

Заглушка Supabase — из теста №54 с ручками для обрыва связи.
Запуск: python3 test_prompt11_stage_polish.py
"""
import sys
import time

from playwright.sync_api import sync_playwright

import test_prompt54_trainer_sync_and_cards as t54
import test_prompt11_shared_screen as t11

PORT = 8997
t11.PORT = PORT
t11.BASE = BASE = f"http://127.0.0.1:{PORT}"
failures = t11.failures
errors = t11.errors
check = t11.check

# ручки для обрыва связи: у каждого канала — «оборвать» (статус CLOSED, как
# у настоящего сокета), «оглохнуть» (сообщения не приходят, статуса нет — так
# выглядит молча умершая связь) и «онеметь» (свои не уходят)
FAKE = t54.FAKE_LIB.replace(
    "subscribe(cb){ setTimeout(() => { ch.state = 'joined'; if (cb) cb('SUBSCRIBED'); }, 10); return ch; },",
    "subscribe(cb){ ch.__cb = cb; setTimeout(() => { if (ch.state === 'closed') return; ch.state = 'joined'; if (cb) cb('SUBSCRIBED'); }, 10); return ch; },",
).replace(
    "send(msg){ const m = clone(msg);",
    "send(msg){ if (ch.__mute || window.__fakeMuteAll || ch.state === 'closed') return Promise.resolve('ok'); const m = clone(msg);",
).replace(
    "setTimeout(() => bc.postMessage(m), window.__fakeLatency || 0)",
    # __fakeBurstMs — «неровная сеть»: исходящие копятся и уходят залпом раз
    # в столько-то мс (так мобильный интернет отдаёт пакеты пачками)
    "setTimeout(() => { try { if (window.__fakeBurstMs) { (window.__fakeBurstQ = window.__fakeBurstQ || []).push([bc, m]);"
    " if (!window.__fakeBurstT) window.__fakeBurstT = setTimeout(() => { const q = window.__fakeBurstQ; window.__fakeBurstQ = [];"
    " window.__fakeBurstT = null; q.forEach(([b, x]) => { try { b.postMessage(x); } catch (e) {} }); }, window.__fakeBurstMs); }"
    " else bc.postMessage(m); } catch (e) {} }, window.__fakeLatency || 0)",
).replace(
    "bc.onmessage = (e) => {\n        const m = e.data;",
    "(window.__fakeChans = window.__fakeChans || []).push(ch);\n      bc.onmessage = (e) => {\n        if (ch.__deaf || ch.state === 'closed') return;\n        const m = e.data;",
)
assert FAKE.count("__fakeChans") == 2 and "__deaf" in FAKE and "__mute" in FAKE
FAKE += r"""
window.__fakeKill = () => (window.__fakeChans || []).forEach(c => {
  if (c.state !== 'joined') return; c.state = 'closed'; try { c.__bc.close(); } catch (e) {} if (c.__cb) c.__cb('CLOSED'); });
window.__fakeDeaf = () => (window.__fakeChans || []).forEach(c => { c.__deaf = true; });
"""


def participant(ctx, tag, w, h):
    page = t11.participant(ctx, tag, w, h)
    # свой маршрут поверх маршрута теста №54: последний зарегистрированный — первый
    page.route("**/supabase-js.umd.js", lambda route: route.fulfill(
        status=200, content_type="application/javascript", body=FAKE))
    return page


def frame_js(page, js):
    """выполнить в кадре, который сейчас на экране сцены"""
    return t11.stage_frame(page).evaluate(js)


RECORDER = """() => {
  window.__rec = [];
  window.__recTimer = setInterval(() => {
    const f = window.__stageActiveFrame && window.__stageActiveFrame();
    if (!f || f.classList.contains('waiting')) { window.__rec.push(['—', null]); return; }
    let path = '?', picker = null;
    try { path = f.contentWindow.location.pathname.split('/').pop(); } catch (e) {}
    try { const s = f.contentWindow.tsGetState && f.contentWindow.tsGetState(); picker = s ? s.picker : null; } catch (e) {}
    window.__rec.push([path, picker]);
  }, 20);
}"""


def part_j(browser):
    ctx = browser.new_context()
    teacher = participant(ctx, "T", 1280, 800)
    # У учителя на главной — видимая полоса прокрутки, как на Windows или на
    # Mac с «всегда показывать полосы»: ширина вёрстки главной на 15 px
    # меньше, чем у тренажёра. Именно это давало тёмную вспышку у ученика
    teacher.add_init_script("""if (location.pathname.endsWith('/index.html')) document.addEventListener('DOMContentLoaded', () => {
        const st = document.createElement('style');
        st.textContent = 'html{overflow-y:scroll}html::-webkit-scrollbar{width:15px;background:#ddd}';
        document.head.appendChild(st); });""")
    teacher.goto(f"{BASE}/oge11.html")
    code = t54.wait_code(teacher)
    teacher.click("#pickerArea .mode-card[data-id]:not(.random):not(.soon)")
    teacher.wait_for_timeout(400)
    student = participant(ctx, "S", 900, 640)
    student.goto(f"{BASE}/oge11.html?s={code}")
    t11.wait_stage(student)
    frame_js(student, "() => 0")
    student.wait_for_timeout(600)
    student.evaluate(RECORDER)

    # стрелкой на №12 — у учителя сразу прототип (первый: номер впервые)
    teacher.click("#examNextBtn")
    teacher.wait_for_url("**/oge12.html", timeout=8000)
    t54.wait_code(teacher)
    teacher.wait_for_function("() => tsGetState().picker === false", timeout=8000)
    try:
        student.wait_for_function("""() => { const f = __stageActiveFrame();
            try { return f.contentWindow.location.pathname.endsWith('/oge12.html')
                   && !f.classList.contains('waiting') && f.contentWindow.tsGetState().picker === false; }
            catch (e) { return false; } }""", timeout=10000)
        ok = True
    except Exception:
        ok = False
    check("J: ученик на сцене перешёл на №12 и видит прототип учителя", ok)
    student.wait_for_timeout(400)
    rec = student.evaluate("() => window.__rec")
    blank = sum(1 for p, _ in rec if p == "—")
    picker12 = sum(1 for p, pk in rec if p == "oge12.html" and pk is True)
    check("J: пустого экрана при переходе не было ни на миг", blank == 0, f"{blank} замеров по 20 мс")
    check("J: списка прототипов №12 у ученика не мелькало", picker12 == 0, f"{picker12} замеров по 20 мс")
    same = teacher.evaluate("() => { const s = tsGetState(); return [s.curMode, s.picker]; }") == \
        frame_js(student, "() => { const s = tsGetState(); return [s.curMode, s.picker]; }")
    check("J: тот же прототип, что у учителя", same)
    check("J: старый кадр убран", student.evaluate("() => document.querySelectorAll('.stage-frame').length") == 1)

    # на главную и обратно: у главной длинная страница — может появиться
    # полоса прокрутки и поменять ширину окна учителя
    student.evaluate("() => { window.__rec = []; }")
    teacher.evaluate("() => window.TrainerSession.navigateTo('index.html')")
    teacher.wait_for_url("**/index.html", timeout=8000)
    t54.wait_code(teacher)
    try:
        student.wait_for_function("""() => { const f = __stageActiveFrame();
            try { return f.contentWindow.location.pathname.endsWith('/index.html') && !f.classList.contains('waiting'); }
            catch (e) { return false; } }""", timeout=10000)
        ok = True
    except Exception:
        ok = False
    check("J: учитель на главной — ученик тоже", ok)
    tw = teacher.evaluate("() => [innerWidth, document.documentElement.clientWidth]")
    check("J: (у учителя на главной видна полоса прокрутки)", tw[0] - tw[1] >= 10, str(tw))
    check("J: ширина вёрстки главной у ученика — как у учителя, без полосы",
          frame_js(student, "() => document.documentElement.clientWidth") == tw[1],
          str(frame_js(student, "() => document.documentElement.clientWidth")))
    teacher.evaluate("() => scrollTo(0, 400)")
    try:
        student.wait_for_function("() => Math.abs(__stageActiveFrame().contentWindow.scrollY - 400) < 3", timeout=5000)
        ok = True
    except Exception:
        ok = False
    check("J: на главной прокрутка учителя повторяется (там нет доски)", ok,
          str(frame_js(student, "() => scrollY")))
    teacher.evaluate("() => window.TrainerSession.navigateTo('oge12.html')")
    teacher.wait_for_url("**/oge12.html", timeout=8000)
    t54.wait_code(teacher)
    try:
        student.wait_for_function("""() => { const f = __stageActiveFrame();
            try { return f.contentWindow.location.pathname.endsWith('/oge12.html') && !f.classList.contains('waiting'); }
            catch (e) { return false; } }""", timeout=10000)
        ok = True
    except Exception:
        ok = False
    check("J: и обратно на тренажёр", ok)
    student.wait_for_timeout(1500)
    rec = student.evaluate("() => { clearInterval(window.__recTimer); return window.__rec; }")
    blank = sum(1 for p, _ in rec if p == "—")
    check("J: главная и обратно — без пустого (тёмного) экрана", blank == 0, f"{blank} замеров по 20 мс")
    tw = teacher.evaluate("() => document.documentElement.clientWidth")
    check("J: ширина вёрстки и после переходов как у учителя",
          frame_js(student, "() => document.documentElement.clientWidth") == tw)
    ctx.close()


def part_k_l_m(browser):
    ctx = browser.new_context()
    teacher = participant(ctx, "T", 1280, 800)
    teacher.goto(f"{BASE}/oge8.html")
    code = t54.wait_code(teacher)
    teacher.click("#pickerArea .mode-card[data-id]:not(.random):not(.soon)")
    teacher.wait_for_timeout(300)
    student = participant(ctx, "S", 640, 480)
    student.goto(f"{BASE}/oge8.html?s={code}")
    t11.wait_stage(student)
    student.wait_for_timeout(1200)   # первый сигнал «я здесь» от ученика

    # ── M. кто на связи ──
    teacher.click(".ts-share-btn")
    try:
        teacher.wait_for_function("() => document.getElementById('tsPeers').textContent.indexOf('Учеников на связи: 1') === 0",
                                  timeout=7000)
        ok = True
    except Exception:
        ok = False
    check("M: у учителя «Учеников на связи: 1»", ok, teacher.inner_text("#tsPeers"))
    check("M: значок с числом на кнопке", teacher.evaluate(
        "() => document.querySelector('.ts-share-btn').classList.contains('ts-has-peers')"
        " && document.querySelector('.ts-peers-badge').textContent === '1'"))
    teacher.click(".ts-share-btn")
    frame_js(student, "() => document.querySelector('.ts-share-btn').click()")
    check("M: у ученика «Учитель на связи»",
          frame_js(student, "() => document.getElementById('tsPeers').textContent") == "Учитель на связи")
    frame_js(student, "() => document.querySelector('.ts-share-btn').click()")

    # ── K. курсор ──
    teacher.mouse.move(400, 300)
    teacher.mouse.move(500, 320)
    try:
        student.wait_for_function("() => document.getElementById('cursor').classList.contains('on')", timeout=4000)
        ok = True
    except Exception:
        ok = False
    check("K: курсор учителя виден на сцене", ok)
    student.wait_for_timeout(200)
    pos = student.evaluate("""() => { const m = /translate\\(([-\\d.]+)px,\\s*([-\\d.]+)px\\)/.exec(document.getElementById('cursor').style.transform);
        return m ? [+m[1], +m[2], window.__stageScale] : null; }""")
    check("K: курсор там же, где у учителя, в масштабе сцены",
          pos and abs(pos[0] - 500 * pos[2]) < 1.5 and abs(pos[1] - 320 * pos[2]) < 1.5, str(pos))
    teacher.mouse.down()
    try:
        student.wait_for_function("() => document.getElementById('cursor').classList.contains('down')", timeout=3000)
        ok = True
    except Exception:
        ok = False
    check("K: нажатие учителя видно (кружок у курсора)", ok)
    teacher.mouse.up()
    teacher.evaluate("() => window.dispatchEvent(new MouseEvent('mouseout', { relatedTarget: null }))")
    try:
        student.wait_for_function("() => !document.getElementById('cursor').classList.contains('on')", timeout=3000)
        ok = True
    except Exception:
        ok = False
    check("K: мышь ушла из окна учителя — курсор спрятан", ok)

    # ── L. открытое учителем открыто у ученика ──
    def wait_frame(js, name, timeout=5000):
        try:
            t11.stage_frame(student).wait_for_function(js, timeout=timeout)
            ok = True
        except Exception:
            ok = False
        check(name, ok)

    teacher.click('.calc-tool-btn[data-op="add"]')
    wait_frame("() => document.getElementById('calcPanel').style.display === 'block'"
               " && document.querySelector('.calc-tool-btn[data-op=\"add\"]').classList.contains('active')",
               "L: «Сложить» — калькулятор открылся и у ученика")
    teacher.click('.calc-tool-btn[data-op="mul"]')
    wait_frame("() => document.querySelector('.calc-tool-btn[data-op=\"mul\"]').classList.contains('active')",
               "L: переключение на «Умножить» тоже")
    teacher.click("#calcPanelClose")
    wait_frame("() => document.getElementById('calcPanel').style.display !== 'block'",
               "L: закрыл калькулятор — закрылся и у ученика")
    teacher.click("#calcHistoryBtn")
    wait_frame("() => document.getElementById('calcHistoryPanel').style.display === 'block'",
               "L: история калькулятора")
    teacher.click("#calcHistoryBtn")
    wait_frame("() => document.getElementById('calcHistoryPanel').style.display !== 'block'",
               "L: история калькулятора закрылась")
    teacher.click("#exampleHistoryToggle")
    wait_frame("() => document.getElementById('exampleHistoryPanel').style.display === 'block'",
               "L: история примеров")
    teacher.click("#addRailToggle")
    wait_frame("() => document.getElementById('addRail').classList.contains('open')", "L: колонка «+» открылась")
    teacher.click("#boardVisibilityToggle")
    wait_frame("() => document.documentElement.getAttribute('data-board') === 'on'", "L: доска включена и у ученика")
    teacher.click("#focusToggle")
    wait_frame("() => document.documentElement.getAttribute('data-focus') === 'on'", "L: «свернуть подсказки»")
    teacher.click("#themeToggle")
    wait_frame("() => document.documentElement.getAttribute('data-theme') === 'dark'", "L: тёмная тема")
    teacher.click("#themeToggle")
    wait_frame("() => document.documentElement.getAttribute('data-theme') === 'light'", "L: и обратно светлая")
    teacher.click("#addRailToggle")
    wait_frame("() => !document.getElementById('addRail').classList.contains('open')", "L: колонка «+» закрылась")
    # сам ученик на сцене ничего не открывал — ученик в обычном режиме
    # открывает своё сам (проверка: у обычного ученика колонка не открылась)
    plain = participant(ctx, "P", 1000, 700)
    plain.add_init_script("try { localStorage.setItem('P:tsStage:direct', '1'); } catch (e) {}")
    plain.goto(f"{BASE}/oge8.html?s={code}")
    t54.wait_code(plain)
    plain.wait_for_timeout(800)
    check("L: ученик в обычном режиме — не на сцене", "stage.html" not in plain.url, plain.url)
    teacher.click("#addRailToggle")
    plain.wait_for_timeout(1200)
    check("L: у ученика в обычном режиме учитель ничего не открывает",
          not plain.evaluate("() => document.getElementById('addRail').classList.contains('open')"))
    teacher.click(".ts-share-btn")
    try:
        teacher.wait_for_function("() => document.getElementById('tsPeers').textContent.indexOf('Учеников на связи: 2') === 0",
                                  timeout=7000)
        ok = True
    except Exception:
        ok = False
    check("M: второй ученик — «Учеников на связи: 2»", ok, teacher.inner_text("#tsPeers"))
    plain.close()
    try:
        teacher.wait_for_function("() => document.getElementById('tsPeers').textContent.indexOf('Учеников на связи: 1') === 0",
                                  timeout=4000)
        ok = True
    except Exception:
        ok = False
    check("M: ученик закрыл вкладку — учитель видит это сразу", ok, teacher.inner_text("#tsPeers"))
    ctx.close()


def part_n(browser):
    ctx = browser.new_context()
    teacher = participant(ctx, "T", 1280, 800)
    teacher.goto(f"{BASE}/oge6.html")
    code = t54.wait_code(teacher)
    teacher.click("#modesGrid .mode-card:not(.random):not(.demo)")
    teacher.wait_for_timeout(300)
    student = participant(ctx, "S", 900, 640)
    student.goto(f"{BASE}/oge6.html?s={code}")
    t11.wait_stage(student)
    student.wait_for_timeout(1000)

    def conn():
        return student.evaluate("() => [document.getElementById('conn').className, document.getElementById('conn').textContent]")

    # ── обрыв канала ──
    frame_js(student, "() => window.__fakeKill()")
    try:
        student.wait_for_function("() => document.getElementById('conn').textContent.indexOf('Связь прервалась') === 0", timeout=4000)
        ok = True
    except Exception:
        ok = False
    check("N: обрыв — у ученика «Связь прервалась — переподключаемся»", ok, str(conn()))
    try:
        student.wait_for_function("() => document.getElementById('conn').textContent === 'Связь восстановлена'", timeout=8000)
        ok = True
    except Exception:
        ok = False
    check("N: переподключился — «Связь восстановлена»", ok, str(conn()))
    teacher.click("#nextBtn") if teacher.locator("#nextBtn").is_visible() else teacher.evaluate("() => newTask()")
    teacher.wait_for_timeout(200)
    want = teacher.evaluate("() => JSON.stringify(tsGetState().curTask || tsGetState())")
    try:
        t11.stage_frame(student).wait_for_function(
            "w => JSON.stringify(tsGetState().curTask || tsGetState()) === w", arg=want, timeout=6000)
        ok = True
    except Exception:
        ok = False
    check("N: после обрыва действия учителя снова доходят", ok)

    # ── нет интернета ──
    ctx.set_offline(True)
    try:
        student.wait_for_function("() => document.getElementById('conn').textContent.indexOf('Нет интернета') === 0", timeout=4000)
        ok = True
    except Exception:
        ok = False
    check("N: нет интернета — своя надпись", ok, str(conn()))
    ctx.set_offline(False)
    try:
        student.wait_for_function("() => document.getElementById('conn').textContent.indexOf('Нет интернета') !== 0", timeout=8000)
        ok = True
    except Exception:
        ok = False
    check("N: сеть вернулась — надпись ушла", ok, str(conn()))

    # ── канал молча умер: ни статуса, ни сообщений ──
    frame_js(student, "() => window.__fakeDeaf()")
    t0 = time.time()
    teacher.evaluate("() => newTask()")
    want = teacher.evaluate("() => JSON.stringify(tsGetState().curTask || tsGetState())")
    try:
        t11.stage_frame(student).wait_for_function(
            "w => JSON.stringify(tsGetState().curTask || tsGetState()) === w", arg=want, timeout=40000)
        ok = True
    except Exception:
        ok = False
    check("N: молчаливый обрыв — ученик сам переподключился и догнал учителя", ok,
          f"{round(time.time() - t0)} с")
    print(f"       (догнал через {round(time.time() - t0)} с)")

    # ── учитель пропал: его сообщения не уходят ──
    teacher.evaluate("() => { window.__fakeMuteAll = true; }")
    t0 = time.time()
    try:
        student.wait_for_function("() => document.getElementById('conn').textContent.indexOf('Учитель не на связи') === 0",
                                  timeout=30000)
        ok = True
    except Exception:
        ok = False
    check("N: учитель пропал — «Учитель не на связи»", ok, str(conn()))
    print(f"       (заметил через {round(time.time() - t0)} с)")
    teacher.evaluate("() => { window.__fakeMuteAll = false; }")
    try:
        student.wait_for_function("() => document.getElementById('conn').textContent === 'Связь восстановлена'"
                                  " || document.getElementById('conn').classList.contains('hidden')", timeout=12000)
        ok = True
    except Exception:
        ok = False
    check("N: учитель вернулся — надпись ушла", ok, str(conn()))
    ctx.close()


def run():
    only = sys.argv[1:]
    with t11.local_server(), sync_playwright() as p:
        # Без --hide-scrollbars, которое Playwright добавляет по умолчанию:
        # полосы прокрутки как у настоящего браузера на Windows/Linux (15 px) —
        # у длинных страниц ширина вёрстки меньше окна, и сцена должна это
        # пережить без мигания
        browser = p.chromium.launch(ignore_default_args=["--hide-scrollbars"])
        if not only or "J" in only:
            print("J. Смена страницы без мигания")
            part_j(browser)
        if not only or "K" in only:
            print("K, L, M. Курсор, открытое учителем, кто на связи")
            part_k_l_m(browser)
        if not only or "N" in only:
            print("N. Связь")
            part_n(browser)
        browser.close()
    real = [e for e in errors if "fonts.g" not in e]
    if real:
        failures.append("ошибки JS на странице: " + " | ".join(real[:5]))
    print()
    if failures:
        print("ПРОВАЛЫ:")
        for f in failures:
            print(" -", f)
        sys.exit(1)
    print("ИТОГ: всё прошло")


if __name__ == "__main__":
    run()
