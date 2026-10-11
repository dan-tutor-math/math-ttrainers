"""
«Обновить страницу ученика»: учитель перезагружает ученику страницу сам, а
ученик, у которого доска учителя застряла на заставке, видит кнопку
«Обновить страницу».

Зачем. После живого урока: учитель открыл совместный доступ прямо с доски,
у ученика доска грузилась и так и не появилась. Ученик (часто ребёнок) не
знает, что нажать, а учитель не мог ему помочь, кроме как диктовать
«перезагрузи страницу». Теперь:
  - в панели учителя у каждого устройства ученика — «Обновить» рядом с
    «Отключить»: у ученика перезагружается вся сцена, он остаётся в том же
    занятии и видит то, что сейчас у учителя;
  - у ученика на заставке доски через 15 с без доски — пояснение и кнопка
    «Обновить страницу».

Проверяем:
  A. Учитель «глушит» рассылку доски (как будто она застряла в сети) —
     у ученика заставка, через 15 с кнопка «Обновить страницу» и пояснение.
  B. Ученик нажал кнопку — сцена перезагрузилась, код тот же, роль ученика;
     учитель «отпустил» рассылку — доска у ученика появилась, кнопки нет.
  C. Учитель: в панели у устройства кнопка «Обновить»; нажал — у ученика
     сцена перезагрузилась РОВНО один раз (команда уходит дважды), ученик
     снова видит доску, учитель снова видит «Учеников на связи: 1».
  D. «Учитель выбирает доску…» — не застревание: кнопки нет и через 15 с.
  E. В тренажёре (не на досках) «Обновить» учителя тоже перезагружает
     ученику сцену, он остаётся на том же тренажёре.
  F. Ученик подключился, а строка сессии в базе помнит главную (учитель
     уже на доске), и снимки учителя до ученика не доходят — раньше ученик
     так и оставался на главной, пока учитель не уйдёт с доски и не
     вернётся. Теперь учитель называет свою страницу в сигнале «на связи», и
     ученик сам приходит на доски и видит доску.
  G. Учитель-«застрявший»: буфер сокета будто бы полон навсегда (закрытый
     сокет) — части доски всё равно уходят, доска у ученика собирается.

Заглушка Supabase и помощники — из тестов №54 и №11 (доска на сцене).
Живой realtime отсюда не проверить: на сайте перепроверить руками.
Запуск: python3 test_prompt_reload_student.py
"""
import sys

from playwright.sync_api import sync_playwright

import test_prompt11_board_stage as BS
import test_prompt11_shared_screen as t11
import test_prompt11_stage_polish as P
import test_prompt54_trainer_sync_and_cards as t54

PORT = 8989
t11.PORT = PORT
t11.BASE = P.BASE = BS.BASE = BASE = f"http://127.0.0.1:{PORT}"
failures = t11.failures
errors = t11.errors
check = t11.check

# сколько раз загрузилась сама сцена ученика (счётчик во вкладке переживает перезагрузку)
COUNT_STAGE_LOADS = """
(() => { if (location.pathname.endsWith('/stage.html')) {
  try { sessionStorage.setItem('__stageLoads', String(+(sessionStorage.getItem('__stageLoads') || 0) + 1)); } catch (e) {} } })();
"""
STAGE_LOADS = "() => +(sessionStorage.getItem('__stageLoads') || 0)"

# «глушилка» рассылки доски у учителя: всё, что начинается на bd_, не уходит
MUTE_BOARD = """() => { const TS = window.TrainerSession; if (!TS.__origSend) TS.__origSend = TS.broadcastEvent;
  TS.broadcastEvent = function (n, d) { if (/^bd_/.test(n)) return; return TS.__origSend.apply(this, arguments); }; }"""
UNMUTE_BOARD = """() => { const TS = window.TrainerSession; if (TS.__origSend) TS.broadcastEvent = TS.__origSend; }"""

WAIT_STATE = """() => { const w = document.getElementById('bdViewerWait');
  const b = document.getElementById('bdViewerReload');
  return { shown: !w.classList.contains('hidden'), text: document.getElementById('bdViewerWaitText').textContent,
           note: document.getElementById('bdViewerWaitNote').textContent, btn: !!b && !b.hidden }; }"""


def frame_on(student, page):
    return BS.wait_js(student, """p => { const f = window.__stageActiveFrame && window.__stageActiveFrame(); try {
        return f && f.contentWindow.location.pathname.endsWith('/' + p) && !f.classList.contains('waiting'); } catch (e) { return false; } }""",
                      15000, page)


def sees_board(student, ids, timeout=15000):
    f = t11.stage_frame(student)
    return BS.wait_js(f, "ids => { const B = window.getCurrentBoard(); return B && B.objects && B.objects.map(o => o.id).join() === ids.join()"
                         " && document.getElementById('bdViewerWait').classList.contains('hidden'); }", timeout, ids)


def open_panel(teacher):
    teacher.evaluate("() => { const p = document.querySelector('.ts-share-pop'); if (!p || !p.classList.contains('open')) document.querySelector('.ts-share-btn').click(); }")


def run_boards(browser):
    ctx = browser.new_context()
    teacher, _ = BS.teacher_boards(ctx)
    code = teacher.evaluate("() => TrainerSession.getCode()")
    teacher.evaluate("() => window.openBoard('bA')")
    teacher.wait_for_function("() => window.getCurrentBoard() && window.getCurrentBoard().id === 'bA' && boardActive")
    tids = teacher.evaluate(BS.TEACHER_STATE)["ids"]
    link = teacher.evaluate("() => TrainerSession.getShareUrl()")

    # ── A. доска «застряла» ──
    teacher.evaluate(MUTE_BOARD)
    student = P.participant(ctx, "S", 1000, 700)
    student.add_init_script(COUNT_STAGE_LOADS)
    student.goto(link)
    t11.wait_stage(student)
    check("A: ученик по ссылке с досок — на сцене, на досках", frame_on(student, "boards.html"))
    f = t11.stage_frame(student)
    st = f.evaluate(WAIT_STATE)
    check("A: сначала — заставка без кнопки", st["shown"] and not st["btn"], str(st))
    ok = BS.wait_js(f, "() => { const b = document.getElementById('bdViewerReload'); return b && !b.hidden; }", 22000)
    st = f.evaluate(WAIT_STATE)
    check("A: через 15 с без доски — кнопка «Обновить страницу»", ok, str(st))
    check("A: и пояснение, что можно обновить и остаться на занятии", "обновить страницу" in st["note"], st["note"])
    # кнопку на заставке ничто не перекрывает (у ученика весь интерфейс досок без нажатий)
    top = f.evaluate("""() => { const b = document.getElementById('bdViewerReload'); const r = b.getBoundingClientRect();
        const el = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2); return el === b; }""")
    check("A: кнопка сверху и нажимается", top)
    loads0 = student.evaluate(STAGE_LOADS)

    # ── B. ученик нажал «Обновить страницу» ──
    f.click("#bdViewerReload")
    ok = BS.wait_js(student, f"() => +(sessionStorage.getItem('__stageLoads') || 0) === {loads0 + 1}", 10000)
    check("B: сцена перезагрузилась", ok, str(student.evaluate(STAGE_LOADS)))
    t11.wait_stage(student)
    check("B: после перезагрузки — снова на досках", frame_on(student, "boards.html"))
    f = t11.stage_frame(student)
    check("B: код тот же", f.evaluate("() => TrainerSession.getCode()") == code)
    check("B: роль — ученик", f.evaluate("() => !TrainerSession.isLeader()"))
    teacher.evaluate(UNMUTE_BOARD)
    check("B: учитель «отпустил» доску — у ученика она появилась", sees_board(student, tids))
    check("B: кнопки больше нет", not t11.stage_frame(student).evaluate(WAIT_STATE)["btn"])

    # ── C. «Обновить» у учителя ──
    open_panel(teacher)
    ok = BS.wait_js(teacher, "() => !!document.querySelector('#tsDevList .ts-dev-reload')", 10000)
    check("C: в панели у устройства ученика есть «Обновить»", ok)
    row = teacher.evaluate("() => [...document.querySelectorAll('#tsDevList .ts-dev-row button')].map(b => b.textContent)")
    check("C: рядом с «Отключить»", row == ["Обновить", "Отключить"], str(row))
    loads1 = student.evaluate(STAGE_LOADS)
    teacher.click("#tsDevList .ts-dev-reload")
    check("C: на кнопке — «Обновляем…»", teacher.evaluate("() => document.querySelector('#tsDevList .ts-dev-reload').textContent") == "Обновляем…")
    ok = BS.wait_js(student, f"() => +(sessionStorage.getItem('__stageLoads') || 0) >= {loads1 + 1}", 10000)
    check("C: у ученика сцена перезагрузилась", ok)
    t11.wait_stage(student)
    check("C: ученик снова видит доску учителя", sees_board(student, tids))
    student.wait_for_timeout(2500)   # второй экземпляр команды уже пришёл
    n = student.evaluate(STAGE_LOADS)
    check("C: перезагрузка ровно одна (команда уходит дважды)", n == loads1 + 1, f"{loads1} → {n}")
    ok = BS.wait_js(teacher, "() => /Учеников на связи: 1/.test(document.getElementById('tsPeers').textContent)", 10000)
    check("C: у учителя снова «Учеников на связи: 1»", ok, teacher.evaluate("() => document.getElementById('tsPeers').textContent"))
    f = t11.stage_frame(student)
    check("C: код тот же", f.evaluate("() => TrainerSession.getCode()") == code)

    # ── D. учитель на списке досок — это не застревание ──
    teacher.mouse.click(600, 400)
    teacher.click("#bdBack")
    ok = BS.wait_js(f, "() => document.getElementById('bdViewerWaitText').textContent.indexOf('выбирает') >= 0", 8000)
    check("D: «Учитель выбирает доску…»", ok)
    f.wait_for_timeout(16500)
    st = f.evaluate(WAIT_STATE)
    check("D: и через 15 с кнопки «Обновить страницу» нет", st["shown"] and not st["btn"] and not st["note"], str(st))

    # ── E. «Обновить» в тренажёре ──
    teacher.evaluate("() => TrainerSession.navigateTo('oge8.html')")
    teacher.wait_for_url("**/oge8.html")
    t54.wait_code(teacher)
    check("E: ученик в тренажёре следом", frame_on(student, "oge8.html"))
    open_panel(teacher)
    ok = BS.wait_js(teacher, "() => !!document.querySelector('#tsDevList .ts-dev-reload')", 10000)
    check("E: в тренажёре у устройства тоже «Обновить»", ok)
    loads2 = student.evaluate(STAGE_LOADS)
    teacher.click("#tsDevList .ts-dev-reload")
    ok = BS.wait_js(student, f"() => +(sessionStorage.getItem('__stageLoads') || 0) >= {loads2 + 1}", 10000)
    check("E: у ученика сцена перезагрузилась", ok)
    t11.wait_stage(student)
    check("E: и он снова в том же тренажёре", frame_on(student, "oge8.html"))
    check("E: в той же сессии", t11.stage_frame(student).evaluate("() => TrainerSession.getCode()") == code)
    ctx.close()


# у ученика не доходят снимки учителя ('state'): как будто их нет вовсе —
# на досках учитель их почти и не шлёт
DROP_STATE = """
(() => { const BC = window.BroadcastChannel; if (!BC) return;
  window.BroadcastChannel = function (name) { const bc = new BC(name);
    if (!String(name).startsWith('fakeRT:')) return bc;
    let h = null;
    Object.defineProperty(bc, 'onmessage', { set(f) { const first = !h; h = f; if (!first) return;
        bc.addEventListener('message', (e) => { if (e.data && e.data.event === 'state') return; if (h) h(e); }); },
      get() { return h; } });
    return bc; };
})();
"""


def run_follow(browser):
    ctx = browser.new_context()
    teacher, _ = BS.teacher_boards(ctx)
    code = teacher.evaluate("() => TrainerSession.getCode()")
    teacher.evaluate("() => window.openBoard('bA')")
    teacher.wait_for_function("() => window.getCurrentBoard() && window.getCurrentBoard().id === 'bA' && boardActive")
    tids = teacher.evaluate(BS.TEACHER_STATE)["ids"]
    teacher.wait_for_timeout(1500)   # своё учитель в базу уже записал
    # строка помнит главную — как будто учитель пришёл на доски мимо сессии
    teacher.evaluate("""c => { const t = JSON.parse(localStorage.getItem('fakeTrainerSessions') || '{}');
        t[c].trainer = 'index'; if (t[c].state) t[c].state.__trainer = 'index';
        localStorage.setItem('fakeTrainerSessions', JSON.stringify(t)); }""", code)
    student = P.participant(ctx, "S", 1000, 700)
    student.add_init_script(DROP_STATE)
    student.goto(f"{BASE}/index.html?s={code}")
    t11.wait_stage(student)
    ok = frame_on(student, "boards.html")
    check("F: ученик с главной сам пришёл туда, где учитель, — на доски", ok,
          student.evaluate("() => { try { return __stageActiveFrame().contentWindow.location.pathname; } catch (e) { return '?'; } }"))
    check("F: и видит доску учителя", sees_board(student, tids))
    ctx.close()


def run_stuck_socket(browser):
    ctx = browser.new_context()
    teacher, _ = BS.teacher_boards(ctx)
    teacher.evaluate("() => window.openBoard('bA')")
    teacher.wait_for_function("() => window.getCurrentBoard() && window.getCurrentBoard().id === 'bA' && boardActive")
    tids = teacher.evaluate(BS.TEACHER_STATE)["ids"]
    # буфер сокета учителя «полон» и не пустеет никогда
    teacher.evaluate("() => { TrainerSession.socketBacklog = () => 10 * 1024 * 1024; }")
    link = teacher.evaluate("() => TrainerSession.getShareUrl()")
    student = P.participant(ctx, "S", 1000, 700)
    student.goto(link)
    t11.wait_stage(student)
    check("G: «полный» буфер учителя — доска у ученика всё равно собралась", sees_board(student, tids, 30000))
    ctx.close()


def run():
    with t11.local_server(), sync_playwright() as p:
        browser = p.chromium.launch()
        print("«Обновить страницу ученика»")
        only = set(sys.argv[1:])   # можно прогнать часть: boards follow stuck
        if not only or "boards" in only:
            run_boards(browser)
        if not only or "follow" in only:
            run_follow(browser)
        if not only or "stuck" in only:
            run_stuck_socket(browser)
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
