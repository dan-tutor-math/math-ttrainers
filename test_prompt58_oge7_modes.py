"""
Промпт №58: режимы «Обучение / Тренировка / Экзамен» в ОГЭ №7 (oge7.html)
и карточки «+», которые больше не теряют ответ при добавлении новой.

Проверяет:
  1. вкладки режимов на месте, по умолчанию «Экзамен»: только условие и
     варианты — ни плана, ни решения по шагам, ни клавиатуры;
  2. «Экзамен»: верный ответ — разбор; первая неверная попытка — красным и
     «Изменить ответ», ответ не раскрыт; вторая неверная — верный вариант и
     разбор;
  3. «Тренировка»: кнопка «Показать решение и ответ» раскрывает и прячет
     разбор с ответом, варианты при этом работают; после ответа кнопки нет;
  4. «Обучение»: как было — план, решение по шагам, клавиатура; после ошибки
     вторая неверная попытка до конца шагов ответ не раскрывает;
  5. смена режима не меняет задание и не сбрасывает ответ; шаги, вставленные
     выбором дроби, при повторном прохождении не задваиваются (и после
     перезагрузки страницы тоже); режим сохраняется при смене типа;
  6. совместная сессия: режим и раскрытый в «Тренировке» разбор едут в
     общем снимке и применяются у собеседника;
  7. карточки «+»: режим как у основной страницы и меняется вместе с ним;
     добавление новой карточки не стирает ответ в уже стоящей (№7 и №13);
  8. «В подборку» уходит условие без кнопки «Показать решение».

Совместный режим здесь на заглушке: живьём (вебсокет к Supabase) его нужно
перепроверять на сайте руками.

Запуск: python3 test_prompt58_oge7_modes.py (сервер поднимается сам).
"""
import contextlib
import http.client
import os
import subprocess
import sys
import time

from playwright.sync_api import sync_playwright

PORT = 8979
BASE = f"http://127.0.0.1:{PORT}"
HERE = os.path.dirname(os.path.abspath(__file__))


@contextlib.contextmanager
def local_server():
    proc = subprocess.Popen(
        [sys.executable, "-m", "http.server", str(PORT)], cwd=HERE,
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


def new_page(browser, url, wait=1300):
    ctx = browser.new_context(viewport={"width": 1300, "height": 1000})
    page = ctx.new_page()
    errors = []
    page.on("pageerror", lambda e: errors.append(str(e)))
    page.route("https://**/*", lambda route: route.abort())
    page.goto(url)
    page.wait_for_timeout(wait)
    return ctx, page, errors


def open_type(page, type_id):
    page.click(f'.mode-card[data-id="{type_id}"]')
    page.wait_for_timeout(400)


VIEW_JS = """() => ({
  mode: curSubMode,
  plan: els.planPanel.style.display !== 'none',
  steps: els.qaPanel.style.display !== 'none' || els.sheetArea.style.display !== 'none',
  keypad: document.getElementById('keypadFloat').style.display !== 'none',
  solBtn: els.solBtnRow.style.display !== 'none',
  explain: els.mainPanel.style.display !== 'none',
  answered: taskAnswered,
  correct: document.querySelectorAll('#mcqOptions .mcq-btn.correct').length,
  wrong: document.querySelectorAll('#mcqOptions .mcq-btn.wrong').length,
  change: els.changeAnswerBtn.style.display === 'block',
  tabs: [...document.querySelectorAll('.submode-tab.active')].map(b => b.id),
})"""


def view(page):
    return page.evaluate(VIEW_JS)


def pick(page, i):
    page.click(f'#mcqOptions .mcq-btn[data-i="{i}"]')
    page.wait_for_timeout(350)


def wrong_index(page):
    ci = page.evaluate("curTask.correctIndex")
    return ci, (0 if ci != 0 else 1)


def test_exam(browser):
    ctx, page, errors = new_page(browser, f"{BASE}/oge7.html")
    open_type(page, 'int_bracket')
    v = view(page)
    check("вкладки: «Обучение», «Тренировка», «Экзамен» на месте",
          page.eval_on_selector_all('.submode-tab', 'es => es.map(e => e.textContent)') == ['Обучение', 'Тренировка', 'Экзамен'])
    check("экзамен: включён по умолчанию", v["mode"] == 'exam' and v["tabs"] == ['tabExam'], str(v))
    check("экзамен: только условие и варианты — без плана, шагов и клавиатуры",
          not v["plan"] and not v["steps"] and not v["keypad"] and not v["solBtn"] and not v["explain"], str(v))
    ci, w = wrong_index(page)
    pick(page, w)
    v = view(page)
    check("экзамен: первая неверная — красным и «Изменить ответ», ответ не раскрыт",
          v["wrong"] == 1 and v["change"] and v["correct"] == 0 and not v["answered"] and not v["explain"], str(v))
    page.click('#changeAnswerBtn')
    pick(page, w)
    page.wait_for_timeout(300)
    v = view(page)
    check("экзамен: вторая неверная — показан верный вариант и разбор",
          v["answered"] and v["correct"] == 1 and v["explain"], str(v))
    check("экзамен: ошибки посчитаны", page.evaluate("totalErrors") == 2)

    page.click('#refreshBtn')
    page.wait_for_timeout(300)
    ci, w = wrong_index(page)
    pick(page, ci)
    page.wait_for_timeout(300)
    v = view(page)
    check("экзамен: верный ответ — решено, разбор и «Следующий пример»",
          v["answered"] and v["correct"] == 1 and v["explain"]
          and page.eval_on_selector('#nextBtn', 'e => e.style.display') == 'block', str(v))
    check("экзамен: без ошибок JS", not errors, str(errors[:1]))
    ctx.close()


def test_practice(browser):
    ctx, page, errors = new_page(browser, f"{BASE}/oge7.html")
    open_type(page, 'sqrt_bracket')
    page.click('#tabPractice')
    page.wait_for_timeout(200)
    v = view(page)
    check("тренировка: есть «Показать решение и ответ», шагов нет",
          v["solBtn"] and not v["plan"] and not v["steps"] and not v["explain"], str(v))
    page.click('#showSolutionBtn')
    page.wait_for_timeout(250)
    v = view(page)
    txt = page.inner_text('#explainBox')
    ci = page.evaluate("curTask.correctIndex")
    check("тренировка: разбор раскрыт вместе с ответом",
          v["explain"] and 'Решение' in txt and f'Ответ: {ci + 1})' in txt and not v["answered"], txt[:80])
    check("тренировка: кнопка стала «Скрыть решение и ответ»",
          page.inner_text('#showSolutionBtn') == 'Скрыть решение и ответ')
    page.click('#showSolutionBtn')
    page.wait_for_timeout(200)
    check("тренировка: разбор прячется обратно", not view(page)["explain"])
    page.click('#showSolutionBtn')
    page.wait_for_timeout(200)
    pick(page, ci)
    page.wait_for_timeout(300)
    v = view(page)
    check("тренировка: варианты работают и при открытом разборе; после ответа кнопки нет",
          v["answered"] and not v["solBtn"] and page.eval_on_selector('#nextBtn', 'e => e.style.display') == 'block', str(v))
    page.click('#nextBtn')
    page.wait_for_timeout(300)
    v = view(page)
    check("тренировка: в новом задании разбор снова закрыт", v["solBtn"] and not v["explain"], str(v))
    check("тренировка: без ошибок JS", not errors, str(errors[:1]))
    ctx.close()


def test_learn(browser):
    ctx, page, errors = new_page(browser, f"{BASE}/oge7.html")
    open_type(page, 'int_bracket')
    page.click('#tabLearn')
    page.wait_for_timeout(400)
    v = view(page)
    check("обучение: план, решение по шагам и клавиатура — как раньше",
          v["plan"] and v["steps"] and v["keypad"] and not v["solBtn"], str(v))
    check("обучение: первый шаг — деление в столбик",
          'Сколько первых цифр' in page.inner_text('#qaPrompt'), page.inner_text('#qaPrompt')[:60])
    ci, w = wrong_index(page)
    pick(page, w)
    page.click('#changeAnswerBtn')
    pick(page, w)
    v = view(page)
    check("обучение: до конца шагов вторая неверная ответ не раскрывает",
          not v["answered"] and v["correct"] == 0 and v["change"], str(v))
    check("обучение: без ошибок JS", not errors, str(errors[:1]))
    ctx.close()


def test_switching(browser):
    ctx, page, errors = new_page(browser, f"{BASE}/oge7.html")
    open_type(page, 'point_on_line_int')
    prompt = page.evaluate("curTask.prompt")
    page.click('#tabLearn')
    page.wait_for_timeout(400)
    # выбор дроби вставляет в шаги деление и смешанное число
    page.click('#mixedFill .candidate-chip')
    page.wait_for_timeout(500)
    n_after_choice = page.evaluate("curTask.steps.length")
    page.click('#tabExam')
    page.wait_for_timeout(200)
    page.click('#tabLearn')
    page.wait_for_timeout(400)
    steps = page.evaluate("curTask.steps.map(s => s.type)")
    check("смена режима: задание то же", page.evaluate("curTask.prompt") == prompt)
    check("смена режима: решение по шагам заново, вставленные шаги не задвоились",
          n_after_choice == 3 and steps == ['choice'] and page.evaluate("stepIdx") == 0, f"{n_after_choice} {steps}")
    # вставленные шаги могли уйти в сохранённый прогресс — после перезагрузки
    # решение по шагам тоже начинается с чистого задания
    page.click('#mixedFill .candidate-chip')
    page.wait_for_timeout(400)
    ci, w = wrong_index(page)
    pick(page, w)  # неверный выбор сохраняет прогресс (вместе с шагами)
    page.reload()
    page.wait_for_timeout(1200)
    open_type(page, 'point_on_line_int')
    page.click('#tabLearn')
    page.wait_for_timeout(400)
    check("продолжение после перезагрузки: то же задание, шаги без повторов",
          page.evaluate("curTask.prompt") == prompt and page.evaluate("curTask.steps.map(s => s.type)") == ['choice'],
          str(page.evaluate("curTask.steps.map(s => s.type)")))

    ci, w = wrong_index(page)
    page.click('#tabExam')
    page.wait_for_timeout(200)
    if view(page)["change"]:
        page.click('#changeAnswerBtn')
    pick(page, ci)
    page.wait_for_timeout(300)
    page.click('#tabLearn')
    page.wait_for_timeout(300)
    v = view(page)
    check("смена режима: решённое задание остаётся решённым, шаги не запускаются",
          v["answered"] and v["correct"] == 1 and not v["steps"] and v["explain"], str(v))
    page.click('#nextTypeBtn')
    page.wait_for_timeout(400)
    check("смена типа: режим сохраняется", view(page)["mode"] == 'learn' and view(page)["steps"])
    check("смена режима: без ошибок JS", not errors, str(errors[:1]))
    ctx.close()


def test_session(browser):
    ctx1, teacher, err1 = new_page(browser, f"{BASE}/oge7.html")
    ctx2, student, err2 = new_page(browser, f"{BASE}/oge7.html")
    open_type(teacher, 'sqrt_segment')
    teacher.click('#tabPractice')
    teacher.click('#showSolutionBtn')
    teacher.wait_for_timeout(200)
    snap = teacher.evaluate("JSON.parse(JSON.stringify(tsGetState()))")
    check("сессия: режим и раскрытый разбор в снимке", snap.get("curSubMode") == 'practice' and snap.get("solShown") is True)
    check("сессия: смена режима видна таймеру рассылки", 'practice' in teacher.evaluate("tsWatchSig(tsGetState())"))
    student.evaluate("s => tsApplyState(s)", snap)
    student.wait_for_timeout(300)
    v = view(student)
    check("сессия: у ученика тот же режим, задание и открытый разбор",
          v["mode"] == 'practice' and v["tabs"] == ['tabPractice'] and v["explain"]
          and student.evaluate("curTask.prompt") == snap["curTask"]["prompt"], str(v))
    teacher.click('#tabLearn')
    teacher.wait_for_timeout(300)
    student.evaluate("s => tsApplyState(s)", teacher.evaluate("JSON.parse(JSON.stringify(tsGetState()))"))
    student.wait_for_timeout(300)
    v = view(student)
    check("сессия: переход учителя в «Обучение» — у ученика решение по шагам",
          v["mode"] == 'learn' and v["steps"] and not v["explain"], str(v))
    check("сессия: без ошибок JS", not err1 and not err2, str((err1 or err2)[:1]))
    ctx1.close(); ctx2.close()


def card_frames(page):
    return [f for f in page.frames if 'card=1' in f.url]


def add_card(page, n_before):
    if not page.evaluate("document.getElementById('addRail').classList.contains('open')"):
        page.click('#addRailToggle')
    page.click('.add-qty-btn[data-n="1"]')
    page.wait_for_function(
        "(n) => [...document.querySelectorAll('.tm-card iframe')].filter(f => f.contentWindow && f.contentWindow.document"
        " && f.contentWindow.document.querySelector('.mcq-btn')).length > n", arg=n_before, timeout=15000)
    page.wait_for_timeout(1200)


def test_cards(browser):
    ctx, page, errors = new_page(browser, f"{BASE}/oge7.html")
    open_type(page, 'sqrt_bracket')
    page.click('#tabPractice')
    page.wait_for_timeout(200)
    add_card(page, 0)
    fr = card_frames(page)[0]
    check("карточка: режим как у основной страницы", fr.evaluate("curSubMode") == 'practice')
    check("карточка: своих вкладок нет, кнопка решения есть",
          fr.evaluate("getComputedStyle(document.querySelector('.submode-tabs')).display") == 'none'
          and fr.evaluate("els.solBtnRow.style.display") == 'flex')
    page.click('#tabExam')
    page.wait_for_timeout(1000)
    check("карточка: переключается вместе с основной страницей",
          fr.evaluate("curSubMode") == 'exam' and fr.evaluate("els.solBtnRow.style.display") == 'none')

    ci = fr.evaluate("curTask.correctIndex")
    fr.click(f'#mcqOptions .mcq-btn[data-i="{ci}"]')
    page.wait_for_timeout(500)
    add_card(page, 1)
    check("карточка: новая «+» не стирает ответ в уже стоящей",
          fr.evaluate("taskAnswered") is True
          and fr.evaluate("document.querySelectorAll('#mcqOptions .mcq-btn.correct').length") == 1)
    check("карточки: без ошибок JS", not errors, str(errors[:1]))
    ctx.close()

    # та же поломка была во всех тренажёрах с карточками-кадрами — проверяем
    # на соседнем, у которого своих режимов обучения нет
    ctx, page, errors = new_page(browser, f"{BASE}/oge13.html")
    page.click('#modesGrid .mode-card')
    page.wait_for_timeout(500)
    add_card(page, 0)
    fr = card_frames(page)[0]
    ci = fr.evaluate("curTask.correctIndex")
    fr.click(f'#mcqOptions .mcq-btn[data-i="{ci}"]')
    page.wait_for_timeout(500)
    add_card(page, 1)
    check("карточка ОГЭ №13: новая «+» не стирает ответ в уже стоящей",
          fr.evaluate("taskAnswered") is True)
    check("карточки ОГЭ №13: без ошибок JS", not errors, str(errors[:1]))
    ctx.close()


def test_basket(browser):
    ctx, page, errors = new_page(browser, f"{BASE}/oge7.html")
    open_type(page, 'int_bracket')
    page.click('#tabPractice')
    page.wait_for_timeout(200)
    page.evaluate("localStorage.removeItem('ogeBasket:v1')")
    page.click('#basketAddBtn')
    page.wait_for_timeout(200)
    item = page.evaluate("(JSON.parse(localStorage.getItem('ogeBasket:v1') || '[]') || [])[0] || null")
    check("подборка: условие с вариантами ушло, кнопки «Показать решение» в нём нет",
          bool(item) and 'Между какими' in item["text"] and 'Показать' not in item["text"], str(item and item["text"][:80]))
    ctx.close()


def run():
    with local_server(), sync_playwright() as p:
        browser = p.chromium.launch()
        test_exam(browser)
        test_practice(browser)
        test_learn(browser)
        test_switching(browser)
        test_session(browser)
        test_cards(browser)
        test_basket(browser)
        browser.close()
    print()
    failed = [name for name, ok in results if not ok]
    if failed:
        print("ПРОВАЛЫ:", "; ".join(failed))
        sys.exit(1)
    print(f"ИТОГ: всё прошло ({len(results)} проверок)")


if __name__ == "__main__":
    run()
