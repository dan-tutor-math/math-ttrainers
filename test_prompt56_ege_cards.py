"""
Промпт №56: «фишки» ОГЭ №8 в ЕГЭ профиле и «только задание» в карточках ОГЭ.

Проверяет:
  1. ЕГЭ: «+1…+10» дописывают карточки, в которых ТОЛЬКО задание (условие,
     поле ответа, свои кнопки) — ни вкладок, ни статистики, ни шапки;
     уже стоящие карточки и основное задание при этом не перерисовываются
     (набранный текст остаётся);
  2. ЕГЭ: карточка проверяется сама по себе, после ответа открывает разбор;
     «Показать решение и ответ» есть только в «Тренировке»; «⟳» меняет
     прототип, «− Убрать» и «Убрать все» убирают; колонки по числу заданий;
  3. ЕГЭ: медали за пятёрку (без ошибок — золото, с ошибкой — серебро),
     история решённого; и то и другое переживает перезагрузку;
  4. ЕГЭ: плавающая клавиатура — во второй части с π и √, пишет в поле,
     где стоял курсор, «Ввод» проверяет; рабочая зона растягивается;
  5. ЕГЭ: карточки едут в общем снимке сессии, повторный такой же снимок
     не пересоздаёт поля; смена прототипа набирает карточки заново;
  6. ЕГЭ: конспект урока снимает убранную карточку и сменённое задание;
     «В подборку» — по одной и все сразу; доска знает, что снимать;
  7. ОГЭ (кадры trainer-multi.js): в добавленной карточке видно только
     задание — у №19, №7, №9 и у арифметики.

Совместный режим здесь на заглушке: живьём (вебсокет к Supabase) его нужно
перепроверять на сайте руками.

Запуск: python3 test_prompt56_ege_cards.py (сервер поднимается сам).
"""
import contextlib
import http.client
import subprocess
import sys
import time

from playwright.sync_api import sync_playwright

PORT = 8976
BASE = f"http://127.0.0.1:{PORT}"


@contextlib.contextmanager
def local_server():
    proc = subprocess.Popen(
        [sys.executable, "-m", "http.server", str(PORT)],
        stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL,
    )
    try:
        for _ in range(50):
            try:
                conn = http.client.HTTPConnection("127.0.0.1", PORT, timeout=0.2)
                conn.request("GET", "/index.html")
                conn.getresponse()
                break
            except Exception:
                time.sleep(0.1)
        else:
            raise RuntimeError("локальный сервер не поднялся")
        yield
    finally:
        proc.terminate()
        proc.wait(timeout=5)


results = []


def check(name, ok, extra=""):
    results.append((name, ok))
    print(f"[{'OK' if ok else 'FAIL'}] {name}" + (f": {extra}" if extra and not ok else ""))


def new_page(browser, url, wait=1400, width=1400):
    ctx = browser.new_context(viewport={"width": width, "height": 1000})
    page = ctx.new_page()
    errors = []
    page.on("pageerror", lambda e: errors.append(str(e)))
    page.route("https://**/*", lambda route: route.abort())
    page.goto(url)
    page.wait_for_timeout(wait)
    return ctx, page, errors


def open_task(page, pid):
    page.click(f'.mode-card[data-pid="{pid}"]')
    page.wait_for_timeout(250)


def add_cards(page, n):
    """Добавить n карточек кнопками колонки (кнопок «+4» нет — складываем)."""
    if not page.evaluate("els.addRail.classList.contains('open')"):
        page.click('#addRailToggle')
    for step in (10, 5, 3, 2, 1):
        while n >= step:
            page.click(f'.add-qty-btn[data-n="{step}"]')
            n -= step
    page.wait_for_timeout(300)


def card(i):
    return f'.added-task-card[data-idx="{i}"]'


def answer_card(page, i, value=None):
    """Ответить в карточке i: по умолчанию верно (ответ из банка)."""
    if value is None:
        value = page.evaluate(f"protoById(S.n, S.cards[{i}].pid).answer")
    page.fill(f'{card(i)} input.answer-input', str(value))
    page.click(f'{card(i)} .check-btn')
    page.wait_for_timeout(150)


def answer_main(page, value=None):
    if value is None:
        value = page.evaluate("curProto.answer")
    page.fill('#answerArea input.answer-input', str(value))
    page.click('#answerArea .check-btn')
    page.wait_for_timeout(150)


# обвязка тренажёра, которой не место в добавленной карточке
CHROME_IN_CARD_JS = """(root) => {
  const sel = ['.submode-tabs', '.submode-row', '.stats', '.task-head', '.calc-tools',
    '.example-history-toggle', '.medal-tray', '.keypad-float', '.add-rail', '.type-nav',
    '#pickerArea', 'h1'];
  return sel.filter(s => root.querySelector(s)).join(', ');
}"""


def test_cards_only_task(browser):
    ctx, page, errors = new_page(browser, f"{BASE}/ege_prof.html?n=7")
    open_task(page, "7.1")
    check("карточки: до «+» колонка одна", page.evaluate("S.cards.length") == 0)

    # набираем, но не проверяем — после добавления текст должен остаться
    page.fill('#answerArea input.answer-input', '12')
    page.evaluate("document.querySelector('#answerArea input').__mark = 1")
    add_cards(page, 3)
    check("карточки: «+3» добавил три карточки",
          page.evaluate("S.cards.length") == 3 and page.eval_on_selector_all('.added-task-card', 'e => e.length') == 3)
    chrome = page.eval_on_selector(card(0), CHROME_IN_CARD_JS)
    check("карточки: в карточке только задание, без обвязки тренажёра", chrome == "", chrome)
    parts = page.eval_on_selector(card(0), """e => ({
      q: !!e.querySelector('.added-card-question .ege-text'), inp: !!e.querySelector('input.answer-input'),
      check: !!e.querySelector('.check-btn'), refresh: !!e.querySelector('.added-refresh-btn'),
      rm: !!e.querySelector('.added-remove-btn'), basket: !!e.querySelector('.added-basket-btn') })""")
    check("карточки: условие, поле, «Проверить», ⟳, 📥, «− Убрать»", all(parts.values()), str(parts))
    check("карточки: прототипы идут подряд за основным",
          page.evaluate("S.cards.map(c => c.pid).join()") == "7.2,7.3,7.1")
    check("карточки: интерфейс тренажёра не задвоился",
          page.eval_on_selector_all('.submode-tabs', 'e => e.length') == 1
          and page.eval_on_selector_all('.stats', 'e => e.length') == 1
          and page.eval_on_selector_all('#keypadFloat', 'e => e.length') == 1)

    page.fill(f'{card(0)} input.answer-input', '5')
    page.evaluate(f"document.querySelector('{card(0)}').__mark = 1")
    add_cards(page, 1)
    check("карточки: добавление не перерисовало основное задание",
          page.evaluate("document.querySelector('#answerArea input').__mark") == 1
          and page.eval_on_selector('#answerArea input.answer-input', 'e => e.value') == '12')
    check("карточки: добавление не перерисовало стоящие карточки",
          page.evaluate(f"document.querySelector('{card(0)}').__mark") == 1
          and page.eval_on_selector(f'{card(0)} input.answer-input', 'e => e.value') == '5')
    check("карточки: пять заданий — две колонки",
          page.eval_on_selector('#tasksColumns', 'e => e.style.gridTemplateColumns') == 'repeat(2, 1fr)')
    add_cards(page, 2)
    check("карточки: семь заданий — три колонки",
          page.eval_on_selector('#tasksColumns', 'e => e.style.gridTemplateColumns') == 'repeat(3, 1fr)')
    page.set_viewport_size({"width": 500, "height": 900})
    page.wait_for_timeout(200)
    check("карточки: на телефоне одна колонка",
          page.eval_on_selector('#tasksColumns', 'e => e.style.gridTemplateColumns') == 'repeat(1, 1fr)')
    page.set_viewport_size({"width": 1400, "height": 1000})
    page.wait_for_timeout(200)
    check("карточки: без ошибок JS", not errors, str(errors[:1]))
    ctx.close()


def test_card_flow(browser):
    ctx, page, errors = new_page(browser, f"{BASE}/ege_prof.html?n=7")
    open_task(page, "7.1")
    add_cards(page, 2)
    check("проверка: в «Экзамене» у карточки нет решения",
          page.eval_on_selector(f'{card(0)} .added-solution-btn', 'e => e.style.display') == 'none'
          and page.eval_on_selector(f'{card(0)} .added-explain', 'e => e.style.display') == 'none')

    answer_card(page, 0)
    check("проверка: верный ответ в карточке засчитан",
          page.evaluate("S.cards[0].answered && S.cards[0].correct") and page.evaluate("totalSolved") == 1)
    check("проверка: основное задание от этого не изменилось", page.evaluate("S.answered") is False)
    check("проверка: у решённой карточки открылся разбор",
          page.eval_on_selector(f'{card(0)} .added-explain', 'e => e.style.display') == 'block'
          and 'Ответ' in page.inner_text(f'{card(0)} .added-explain'))
    check("проверка: поле решённой карточки заперто",
          page.eval_on_selector(f'{card(0)} input.answer-input', 'e => e.disabled'))

    answer_card(page, 1, "-100500")
    check("проверка: первая ошибка — поле красное, разбора нет",
          page.evaluate("S.cards[1].hadWrong && !S.cards[1].answered")
          and page.eval_on_selector(f'{card(1)} .added-explain', 'e => e.style.display') == 'none')
    answer_card(page, 1, "-100500")
    right = page.evaluate("protoById(S.n, S.cards[1].pid).answer")
    check("проверка: вторая ошибка — подставлен верный ответ",
          page.evaluate("S.cards[1].answered")
          and page.eval_on_selector(f'{card(1)} input.answer-input', 'e => e.value') == right)
    check("проверка: счёт общий на страницу", page.evaluate("totalErrors") == 2 and page.evaluate("totalSolved") == 1)

    add_cards(page, 1)
    page.click('#tabPractice')
    page.wait_for_timeout(150)
    check("тренировка: у нерешённой карточки есть «Показать решение и ответ»",
          page.eval_on_selector(f'{card(2)} .added-solution-btn', 'e => e.style.display') != 'none')
    page.click(f'{card(2)} .added-solution-btn')
    page.wait_for_timeout(150)
    check("тренировка: решение карточки раскрылось",
          page.eval_on_selector(f'{card(2)} .added-explain', 'e => e.style.display') == 'block')
    page.click('#tabExam')
    page.wait_for_timeout(150)
    check("экзамен: раскрытое решение снова спрятано",
          page.eval_on_selector(f'{card(2)} .added-explain', 'e => e.style.display') == 'none')

    before = page.evaluate("S.cards[2].pid")
    page.click(f'{card(2)} .added-refresh-btn')
    page.wait_for_timeout(200)
    check("⟳: карточка сменила прототип", page.evaluate("S.cards[2].pid") != before)
    page.click(f'{card(0)} .added-remove-btn')
    page.wait_for_timeout(200)
    check("− Убрать: карточка убрана, остальные сдвинулись",
          page.evaluate("S.cards.length") == 2 and page.eval_on_selector_all('.added-task-card', 'e => e.length') == 2
          and page.evaluate("S.cards[0].hadWrong"))
    check("карточки: «Следующее задание» спрятано, пока рядом есть карточки",
          page.eval_on_selector('#nextBtn', 'e => e.style.display') == 'none')
    page.click('#addClearBtn')
    page.wait_for_timeout(200)
    check("Убрать все: остаётся одно основное задание",
          page.evaluate("S.cards.length") == 0 and page.eval_on_selector_all('.added-task-card', 'e => e.length') == 0
          and page.eval_on_selector('#addClearBtn', 'e => e.style.display') == 'none')
    check("проверка: без ошибок JS", not errors, str(errors[:1]))
    ctx.close()


def test_medals_history(browser):
    ctx, page, errors = new_page(browser, f"{BASE}/ege_prof.html?n=7")
    open_task(page, "7.1")
    add_cards(page, 4)
    answer_main(page)
    for i in range(4):
        answer_card(page, i)
    page.wait_for_timeout(2200)  # полёт медали до полки
    check("медали: пять без ошибок — золото",
          page.evaluate("curProg.medals.gold") == 1 and "🥇" in page.inner_text('#medalBadgeRow'))
    check("медали: медаль села на полку внизу",
          page.eval_on_selector('#medalTray', 'e => e.classList.contains("show")')
          and page.eval_on_selector_all('.medal-tray-icon', 'e => e.length') == 1)
    check("история: пять решённых с ответами",
          page.eval_on_selector_all('.example-history-row', 'e => e.length') == 5
          and "(5)" in page.inner_text('#exampleHistoryToggle'))
    page.click('#exampleHistoryToggle')
    page.wait_for_timeout(150)
    check("история: панель открывается, ответы видны",
          page.eval_on_selector('#exampleHistoryPanel', 'e => e.style.display') == 'block'
          and "Ответ" in page.inner_text('#exampleHistoryList'))

    # следующая пятёрка с одной ошибкой — серебро
    page.click('#addClearBtn')
    page.wait_for_timeout(150)
    page.click('#nextProtoBtn')
    page.wait_for_timeout(250)
    add_cards(page, 4)
    answer_main(page, "-100500")
    answer_main(page)
    for i in range(4):
        answer_card(page, i)
    page.wait_for_timeout(2200)
    check("медали: пятёрка с одной ошибкой — серебро", page.evaluate("curProg.medals.silver") == 1)

    page.reload()
    page.wait_for_timeout(1400)
    open_task(page, "7.1")
    check("медали: переживают перезагрузку", "🥇×1" in page.inner_text('#medalBadgeRow')
          and "🥈×1" in page.inner_text('#medalBadgeRow'))
    check("история: переживает перезагрузку", page.evaluate("curProg.history.length") == 8)
    check("медали: у другого номера свой счёт",
          page.evaluate("loadProgFor(8).medals.gold") == 0)
    check("медали: без ошибок JS", not errors, str(errors[:1]))
    ctx.close()


def test_keypad_and_zone(browser):
    ctx, page, errors = new_page(browser, f"{BASE}/ege_prof.html?n=7")
    open_task(page, "7.1")
    keys = page.eval_on_selector_all('#keypadButtons button', 'es => es.map(e => e.dataset.key)')
    check("клавиатура: в первой части цифры, запятая и минус, без π", "π" not in keys and "," in keys and "-" in keys)
    check("клавиатура: видна, пока есть незапертое поле",
          page.eval_on_selector('#keypadFloat', 'e => e.style.display') == 'block')
    add_cards(page, 1)
    page.click(f'{card(0)} input.answer-input')
    ans = page.evaluate("protoById(S.n, S.cards[0].pid).answer")
    for ch in str(ans).replace('.', ','):
        page.click(f'#keypadButtons button[data-key="{ch}"]')
    check("клавиатура: пишет в поле, где стоял курсор (в карточку)",
          page.eval_on_selector(f'{card(0)} input.answer-input', 'e => e.value') == str(ans).replace('.', ',')
          and page.eval_on_selector('#answerArea input.answer-input', 'e => e.value') == '')
    page.click('#keypadButtons button[data-key="enter"]')
    page.wait_for_timeout(150)
    check("клавиатура: «Ввод» проверяет ту карточку", page.evaluate("S.cards[0].answered"))
    page.click('#kpClose')
    check("клавиатура: ✕ прячет, ⌨ возвращает",
          page.eval_on_selector('#keypadFloat', 'e => e.style.display') == 'none'
          and page.eval_on_selector('#kpToggle', 'e => e.style.display') == 'flex')
    page.click('#kpToggle')

    w0 = page.eval_on_selector('#workZone', 'e => e.getBoundingClientRect().width')
    box = page.eval_on_selector('#workResizeLeft', 'e => { const r = e.getBoundingClientRect(); return {x: r.x + r.width / 2, y: r.y + 40}; }')
    page.mouse.move(box["x"], box["y"])
    page.mouse.down()
    page.mouse.move(box["x"] - 60, box["y"], steps=5)
    page.mouse.up()
    page.wait_for_timeout(150)
    w1 = page.eval_on_selector('#workZone', 'e => e.getBoundingClientRect().width')
    check("рабочая зона: тянется за край в обе стороны", w1 > w0 + 100, f"{w0} → {w1}")
    check("рабочая зона: ширина запомнилась",
          abs(float(page.evaluate("localStorage.getItem('ege_prof:workZoneW')") or 0) - w1) < 2)

    page.goto(f"{BASE}/ege_prof.html?n=14")
    page.wait_for_timeout(1400)
    open_task(page, "14.1")
    keys = page.eval_on_selector_all('#keypadButtons button', 'es => es.map(e => e.dataset.key)')
    check("клавиатура: во второй части есть π, √, ∞ и знаки промежутков",
          all(k in keys for k in ["π", "√", "∞", "≤", "∪", ";"]))
    page.click('#answerArea input.answer-input')
    page.click('#keypadButtons button[data-key="π"]')
    page.click('#keypadButtons button[data-key="2"]')
    page.click('#keypadButtons button[data-key="back"]')
    check("клавиатура: π вставляется, ⌫ стирает последний знак",
          page.eval_on_selector('#answerArea input.answer-input', 'e => e.value') == 'π')
    page.set_viewport_size({"width": 390, "height": 844})
    page.wait_for_timeout(200)
    kb = page.eval_on_selector('#keypadFloat', 'e => { const r = e.getBoundingClientRect(); return {top: r.top, bottom: r.bottom}; }')
    check("клавиатура: на телефоне опускается в нижний угол, а не на задание",
          844 - kb["bottom"] < 40 and kb["top"] > 300, str(kb))
    check("клавиатура: без ошибок JS", not errors, str(errors[:1]))
    ctx.close()


def test_session_state(browser):
    ctx1, teacher, err1 = new_page(browser, f"{BASE}/ege_prof.html?n=7")
    ctx2, student, err2 = new_page(browser, f"{BASE}/ege_prof.html?n=7")
    open_task(teacher, "7.1")
    add_cards(teacher, 2)
    answer_card(teacher, 0)
    snap = teacher.evaluate("JSON.parse(JSON.stringify(tsGetState()))")
    check("сессия: карточки в общем снимке", len(snap.get("cards", [])) == 2 and snap["cards"][0]["answered"])
    check("сессия: сигнатура наблюдателя видит карточки", "7.2" in teacher.evaluate("tsWatchSig(tsGetState())"))

    student.evaluate("s => tsApplyState(s)", snap)
    student.wait_for_timeout(250)
    check("сессия: у ученика те же карточки",
          student.evaluate("S.cards.map(c => c.pid).join()") == "7.2,7.3"
          and student.eval_on_selector_all('.added-task-card', 'e => e.length') == 2)
    check("сессия: решённая карточка решена и у ученика, с разбором",
          student.evaluate("S.cards[0].answered")
          and student.eval_on_selector(f'{card(0)} .added-explain', 'e => e.style.display') == 'block')

    student.fill(f'{card(1)} input.answer-input', '42')
    student.evaluate(f"document.querySelector('{card(1)}').__mark = 1")
    student.evaluate("s => tsApplyState(s)", snap)
    student.wait_for_timeout(150)
    check("сессия: такой же снимок не пересоздаёт поля (набранное не пропадает)",
          student.evaluate(f"document.querySelector('{card(1)}').__mark") == 1
          and student.eval_on_selector(f'{card(1)} input.answer-input', 'e => e.value') == '42')

    teacher.click('#nextProtoBtn')
    teacher.wait_for_timeout(250)
    check("смена прототипа: карточек столько же, набраны от нового задания",
          teacher.evaluate("S.pid") == "7.2" and teacher.evaluate("S.cards.map(c => c.pid).join()") == "7.3,7.1"
          and not teacher.evaluate("S.cards.some(c => c.answered)"))
    student.evaluate("s => tsApplyState(s)", teacher.evaluate("JSON.parse(JSON.stringify(tsGetState()))"))
    student.wait_for_timeout(250)
    check("сессия: ученик переехал на новый прототип вместе с карточками",
          student.evaluate("S.pid") == "7.2" and student.evaluate("S.cards.map(c => c.pid).join()") == "7.3,7.1")
    check("сессия: без ошибок JS", not err1 and not err2, str((err1 or err2)[:1]))
    ctx1.close(); ctx2.close()


def test_history_basket_board(browser):
    ctx, page, errors = new_page(browser, f"{BASE}/ege_prof.html?n=8")
    page.evaluate("window.TrainerSession.setAutosaveHistory(true)")
    open_task(page, "8.1")
    add_cards(page, 2)
    page.click(f'{card(0)} .added-remove-btn')
    page.wait_for_timeout(1500)
    check("конспект: убранная карточка снята", page.evaluate("LessonHistory.getCount()") == 1)
    page.click('#nextProtoBtn')
    page.wait_for_timeout(1800)
    check("конспект: сменённое задание снято", page.evaluate("LessonHistory.getCount()") == 2)
    check("конспект: счётчик и «Скачать PDF» в панели совместного доступа",
          "2" in page.eval_on_selector('#tsHistoryCount', 'e => e.textContent')
          and page.eval_on_selector('#tsHistoryDownload', 'e => !e.disabled'))

    page.evaluate("localStorage.removeItem('ogeBasket:v1')")
    page.click(f'{card(0)} .added-basket-btn')
    page.wait_for_timeout(200)
    items = page.evaluate("JSON.parse(localStorage.getItem('ogeBasket:v1') || '[]')")
    check("подборка: 📥 карточки кладёт одно её задание",
          len(items) == 1 and items[0]["trainerId"] == "ege8" and "прототип" in items[0]["modeTitle"])
    page.evaluate("localStorage.removeItem('ogeBasket:v1')")
    page.click('#addToBasketAllBtn')
    page.wait_for_timeout(200)
    items = page.evaluate("JSON.parse(localStorage.getItem('ogeBasket:v1') || '[]')")
    check("подборка: «📥 Все» — основное и все карточки", len(items) == 2)
    check("подборка: в подборку ушло условие без полей ответа",
          all("Проверить" not in (it.get("text") or "") and "Ответ:" not in (it.get("text") or "") for it in items))
    check("конспект и подборка: без ошибок JS", not errors, str(errors[:1]))
    ctx.close()

    ctx, page, errors = new_page(browser, f"{BASE}/boards.html", wait=1800)
    cap = page.evaluate("JSON.stringify(TRAINER_CAPTURE['ege14'])")
    check("доски: у ЕГЭ снимаются и добавленные карточки", ".added-card-question" in cap, cap)
    ctx.close()


def test_oge_cards_only_task(browser):
    """Кадры trainer-multi.js: в добавленной карточке ОГЭ — только задание."""
    for slug in ["oge19", "oge7", "oge9", "addition"]:
        ctx, page, errors = new_page(browser, f"{BASE}/{slug}.html", wait=1500)
        # у ОГЭ сначала экран выбора типа — открываем первый тип, как ученик
        if page.evaluate("!!document.querySelector('#pickerArea .mode-card:not(.demo), .modes .mode-card:not(.demo)')"):
            page.click('#pickerArea .mode-card:not(.demo), .modes .mode-card:not(.demo)')
            page.wait_for_timeout(400)
        page.click('#addRailToggle')
        page.click('.add-qty-btn[data-n="1"]')
        page.wait_for_function("""() => {
          const f = document.querySelector('.tm-card iframe');
          return f && f.contentWindow && f.contentWindow.document.readyState === 'complete'
            && f.contentWindow.document.documentElement.getAttribute('data-card') === '1';
        }""", timeout=15000)
        page.wait_for_timeout(1200)
        frame = page.frame_locator('.tm-card iframe').first
        visible = page.evaluate("""() => {
          const d = document.querySelector('.tm-card iframe').contentWindow.document;
          const sel = ['h1', '.task-head', '.submode-row', '.submode-tabs', '.stats', '.calc-tools',
            '.focus-toggle', '.keypad-float', '.example-history-toggle', '.medal-tray', '.add-rail',
            '.home-btn', '.theme-toggle', '.board-toolbar', '#pickerArea', '.corner'];
          const shown = el => { const s = d.defaultView.getComputedStyle(el); return s.display !== 'none' && s.visibility !== 'hidden' && el.getClientRects().length > 0; };
          return sel.filter(s => [...d.querySelectorAll(s)].some(shown)).join(', ');
        }""")
        check(f"ОГЭ {slug}: в карточке нет обвязки тренажёра", visible == "", visible)
        has_task = page.evaluate("""() => {
          const d = document.querySelector('.tm-card iframe').contentWindow.document;
          return !!d.querySelector('input, button.check-btn, .input-answer-row, #board, #prompt');
        }""")
        check(f"ОГЭ {slug}: само задание в карточке есть", has_task)
        check(f"ОГЭ {slug}: без ошибок JS", not errors, str(errors[:1]))
        ctx.close()


def run():
    with local_server(), sync_playwright() as p:
        browser = p.chromium.launch()
        test_cards_only_task(browser)
        test_card_flow(browser)
        test_medals_history(browser)
        test_keypad_and_zone(browser)
        test_session_state(browser)
        test_history_basket_board(browser)
        test_oge_cards_only_task(browser)
        browser.close()
    print()
    failed = [name for name, ok in results if not ok]
    if failed:
        print("ПРОВАЛЫ:", "; ".join(failed))
        sys.exit(1)
    print(f"ИТОГ: всё прошло ({len(results)} проверок)")


if __name__ == "__main__":
    run()
