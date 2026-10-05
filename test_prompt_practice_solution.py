"""
«Тренировка» = «Экзамен» + кнопка «Показать решение и ответ» во всех
тренажёрах ОГЭ, где «Тренировка» была заглушкой «в разработке»:
№6, №9, №11, №13, №14, №15–18, №19.

Проверяет на каждой странице:
  1. «Экзамен» по умолчанию, кнопки разбора нет;
  2. «Тренировка» — то же задание и тот же экран, что в «Экзамене», плюс
     ровно одна кнопка «Показать решение и ответ» (сравнивается видимость
     всех элементов задания в обоих режимах); заглушки «в разработке» нет;
  3. набранный ответ и задание не теряются при переходе между режимами;
  4. кнопка раскрывает разбор с ответом и прячет его обратно; при открытом
     разборе ответ принимается как обычно, после ответа кнопки нет;
  5. «Следующий пример» — разбор снова закрыт;
  6. режим «Тренировка» сохраняется при смене типа; «Обучение» — по-прежнему
     заглушка, без кнопки; из него назад в «Тренировку» — задание на месте;
  7. совместная сессия: режим и раскрытый разбор едут в снимке и
     применяются у собеседника; закрытие разбора — тоже;
  8. карточка «+»: режим как у основной страницы, кнопка разбора есть,
     переключается вместе с основной страницей;
  9. «В подборку» уходит условие без кнопки.

Совместный режим здесь на заглушке: живьём (вебсокет к Supabase) его нужно
перепроверять на сайте руками.

Запуск: python3 test_prompt_practice_solution.py (сервер поднимается сам).
"""
import contextlib
import http.client
import os
import subprocess
import sys
import time

from playwright.sync_api import sync_playwright

PORT = 8983
BASE = f"http://127.0.0.1:{PORT}"
HERE = os.path.dirname(os.path.abspath(__file__))

PAGES = ['oge6', 'oge9', 'oge11', 'oge13', 'oge14', 'oge15_18', 'oge19']


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


def open_type(page, nth=0):
    page.locator('#modesGrid .mode-card:not(.demo)').nth(nth).click()
    page.wait_for_timeout(450)


# что видно в области задания: id всех видимых элементов. В «Тренировке» к
# этому списку должна добавиться только кнопка разбора (и её строка)
VISIBLE_JS = """() => [...document.querySelectorAll('#taskArea [id]')]
  .filter(e => e.offsetParent !== null || getComputedStyle(e).position === 'fixed' && getComputedStyle(e).display !== 'none')
  .map(e => e.id).sort()"""

VIEW_JS = """() => ({
  mode: curSubMode,
  tabs: [...document.querySelectorAll('.submode-tab.active')].map(b => b.id),
  soon: els.comingSoonPanel.style.display !== 'none',
  question: els.questionPanel.style.display !== 'none',
  solBtn: els.solBtnRow.style.display !== 'none',
  solText: els.showSolutionBtn.textContent,
  explain: els.mainPanel.style.display !== 'none' && els.explainBox.style.display !== 'none',
  next: els.nextBtn.style.display === 'block',
  answered: !!taskAnswered,
})"""


def view(page):
    return page.evaluate(VIEW_JS)


def task_json(page):
    return page.evaluate("JSON.stringify(curTask)")


def kind(page):
    return page.evaluate("""() => document.getElementById('stmtList') ? 'stmt'
      : (Array.isArray(curTask.options) ? 'mcq' : 'input')""")


def answer_right(page):
    """Верный ответ тем же путём, что у ученика."""
    k = kind(page)
    if k == 'mcq':
        ci = page.evaluate("curTask.correctIndex")
        page.click(f'#mcqOptions .mcq-btn[data-i="{ci}"]')
    elif k == 'stmt':
        idx = page.evaluate("curTask.statements.map((s, i) => s.isTrue ? i : -1).filter(i => i >= 0)")
        for i in idx:
            page.click(f'#stmtList .stmt[data-i="{i}"]')
        page.click('#checkBtn')
    else:
        val = page.evaluate("String(curTask.correctValue).replace('.', ',')")
        page.fill('#answerInput', val)
        page.click('#checkAnswerBtn')
    page.wait_for_timeout(350)


def expected_answer(page):
    k = kind(page)
    if k == 'mcq':
        return page.evaluate("`${curTask.correctIndex + 1}) ` + curTask.options[curTask.correctIndex]").split(')')[0] + ')'
    if k == 'stmt':
        return page.evaluate("curTask.statements.map((s, i) => s.isTrue ? i + 1 : 0).filter(Boolean).join(', ')")
    return None


def test_page(browser, name):
    ctx, page, errors = new_page(browser, f"{BASE}/{name}.html")
    open_type(page, 0)
    v = view(page)
    check(f"{name}: «Экзамен» по умолчанию, кнопки разбора нет",
          v["mode"] == 'exam' and v["tabs"] == ['tabExam'] and v["question"] and not v["solBtn"], str(v))
    exam_visible = page.evaluate(VISIBLE_JS)
    task = task_json(page)
    k = kind(page)
    if k == 'input':
        page.fill('#answerInput', '12345')

    page.click('#tabPractice')
    page.wait_for_timeout(300)
    v = view(page)
    check(f"{name}: «Тренировка» — без заглушки, с кнопкой «Показать решение и ответ»",
          v["mode"] == 'practice' and v["tabs"] == ['tabPractice'] and not v["soon"] and v["question"]
          and v["solBtn"] and v["solText"] == 'Показать решение и ответ' and not v["explain"], str(v))
    practice_visible = page.evaluate(VISIBLE_JS)
    added = sorted(set(practice_visible) - set(exam_visible))
    removed = sorted(set(exam_visible) - set(practice_visible))
    check(f"{name}: от «Экзамена» отличается только кнопкой разбора",
          added == ['showSolutionBtn', 'solBtnRow'] and removed == [], f"+{added} −{removed}")
    check(f"{name}: задание при переходе в «Тренировку» то же", task_json(page) == task)
    if k == 'input':
        check(f"{name}: набранный ответ не стёрся", page.input_value('#answerInput') == '12345')
        page.fill('#answerInput', '')

    page.click('#showSolutionBtn')
    page.wait_for_timeout(300)
    v = view(page)
    txt = page.inner_text('#explainBox')
    exp = expected_answer(page)
    # у части типов ответ уже записан в конце разбора — тогда номер варианта
    # второй строкой не повторяется
    own = page.evaluate("/Ответ/.test(String(curTask.explain || ''))")
    has_answer = ('Ответ' in txt or 'Верн' in txt) and (exp is None or own or exp in txt)
    check(f"{name}: кнопка раскрывает разбор с ответом",
          v["explain"] and not v["answered"] and not v["next"] and has_answer
          and v["solText"] == 'Скрыть решение и ответ', txt[:120])
    page.click('#showSolutionBtn')
    page.wait_for_timeout(250)
    check(f"{name}: повторное нажатие прячет разбор", not view(page)["explain"])

    page.click('#showSolutionBtn')
    page.wait_for_timeout(200)
    solved_before = page.evaluate("totalSolved")
    answer_right(page)
    v = view(page)
    check(f"{name}: при открытом разборе ответ принимается; после ответа кнопки нет, есть «Следующий пример»",
          v["answered"] and not v["solBtn"] and v["next"] and v["explain"]
          and page.evaluate("totalSolved") == solved_before + 1, str(v))

    page.click('#nextBtn')
    page.wait_for_timeout(350)
    v = view(page)
    check(f"{name}: в новом задании разбор закрыт, кнопка снова есть",
          v["mode"] == 'practice' and v["solBtn"] and not v["explain"] and not v["answered"], str(v))

    page.click('#tabExam')
    page.wait_for_timeout(250)
    check(f"{name}: в «Экзамене» кнопки снова нет", not view(page)["solBtn"])
    page.click('#tabPractice')
    page.wait_for_timeout(250)

    # смена типа: стрелкой, если она есть, иначе через список типов
    if page.locator('#nextTypeBtn').count() and page.is_visible('#nextTypeBtn'):
        page.click('#nextTypeBtn')
    else:
        page.click('#backBtn')
        page.wait_for_timeout(300)
        open_type(page, 1 if page.locator('#modesGrid .mode-card:not(.demo)').count() > 1 else 0)
    page.wait_for_timeout(400)
    v = view(page)
    check(f"{name}: при смене типа «Тренировка» сохраняется",
          v["mode"] == 'practice' and v["tabs"] == ['tabPractice'] and v["question"] and v["solBtn"], str(v))

    task = task_json(page)
    page.click('#tabLearn')
    page.wait_for_timeout(250)
    v = view(page)
    check(f"{name}: «Обучение» — по-прежнему заглушка, без кнопки разбора",
          v["soon"] and not v["question"] and not v["solBtn"], str(v))
    page.click('#tabPractice')
    page.wait_for_timeout(300)
    v = view(page)
    check(f"{name}: из «Обучения» назад в «Тренировку» — задание на экране, кнопка есть",
          v["question"] and v["solBtn"] and not v["soon"], str(v))

    # ключ подборки бывает и с кодом сессии (ogeBasket:v1:<код>) — чистим все
    page.evaluate("Object.keys(localStorage).filter(k => k.startsWith('ogeBasket:v1')).forEach(k => localStorage.removeItem(k))")
    page.click('#basketAddBtn')
    page.wait_for_timeout(200)
    item = page.evaluate("""() => { const k = Object.keys(localStorage).find(k => k.startsWith('ogeBasket:v1'));
      return k ? ((JSON.parse(localStorage.getItem(k) || '[]') || [])[0] || null) : null; }""")
    check(f"{name}: в подборку ушло условие без кнопки разбора",
          bool(item) and item["text"] and 'Показать решение' not in item["text"], str(item and item["text"][:60]))
    check(f"{name}: без ошибок JS", not errors, str(errors[:1]))
    ctx.close()


def test_session(browser, name):
    ctx1, teacher, err1 = new_page(browser, f"{BASE}/{name}.html")
    ctx2, student, err2 = new_page(browser, f"{BASE}/{name}.html")
    open_type(teacher, 0)
    teacher.click('#tabPractice')
    teacher.wait_for_timeout(200)
    teacher.click('#showSolutionBtn')
    teacher.wait_for_timeout(200)
    snap = teacher.evaluate("JSON.parse(JSON.stringify(tsGetState()))")
    check(f"{name}: сессия — режим и раскрытый разбор в снимке",
          snap.get("curSubMode") == 'practice' and snap.get("solShown") is True)
    check(f"{name}: сессия — раскрытие разбора видно таймеру рассылки",
          teacher.evaluate("tsWatchSig(tsGetState())") != teacher.evaluate(
              "tsWatchSig(Object.assign(tsGetState(), { solShown: false }))"))
    student.evaluate("s => tsApplyState(s)", snap)
    student.wait_for_timeout(350)
    v = view(student)
    check(f"{name}: сессия — у ученика тот же режим, задание и открытый разбор",
          v["mode"] == 'practice' and v["tabs"] == ['tabPractice'] and v["explain"] and v["solBtn"]
          and student.evaluate("JSON.stringify(curTask)") == JSON_dump(snap["curTask"]), str(v))
    teacher.click('#showSolutionBtn')
    teacher.wait_for_timeout(200)
    student.evaluate("s => tsApplyState(s)", teacher.evaluate("JSON.parse(JSON.stringify(tsGetState()))"))
    student.wait_for_timeout(250)
    check(f"{name}: сессия — закрытие разбора тоже доходит", not view(student)["explain"])
    teacher.click('#tabExam')
    teacher.wait_for_timeout(200)
    student.evaluate("s => tsApplyState(s)", teacher.evaluate("JSON.parse(JSON.stringify(tsGetState()))"))
    student.wait_for_timeout(250)
    v = view(student)
    check(f"{name}: сессия — переход в «Экзамен» у ученика, задание то же",
          v["mode"] == 'exam' and not v["solBtn"] and v["question"]
          and student.evaluate("JSON.stringify(curTask)") == teacher.evaluate("JSON.stringify(curTask)"), str(v))
    check(f"{name}: сессия — без ошибок JS", not err1 and not err2, str((err1 or err2)[:1]))
    ctx1.close(); ctx2.close()


def JSON_dump(obj):
    import json
    return json.dumps(obj, ensure_ascii=False, separators=(',', ':'))


def card_frames(page):
    return [f for f in page.frames if 'card=1' in f.url]


def add_card(page):
    if not page.evaluate("document.getElementById('addRail').classList.contains('open')"):
        page.click('#addRailToggle')
    page.click('.add-qty-btn[data-n="1"]')
    page.wait_for_function(
        "() => [...document.querySelectorAll('.tm-card iframe')].some(f => f.contentWindow && f.contentWindow.document"
        " && f.contentWindow.document.getElementById('questionPanel')"
        " && f.contentWindow.document.getElementById('questionPanel').style.display === 'block')", timeout=15000)
    page.wait_for_timeout(900)


def test_card(browser, name):
    ctx, page, errors = new_page(browser, f"{BASE}/{name}.html")
    open_type(page, 0)
    page.click('#tabPractice')
    page.wait_for_timeout(200)
    add_card(page)
    fr = card_frames(page)[0]
    check(f"{name}: карточка «+» — режим как у основной страницы, кнопка разбора есть",
          fr.evaluate("curSubMode") == 'practice' and fr.evaluate("els.solBtnRow.style.display") == 'flex')
    fr.click('#showSolutionBtn')
    page.wait_for_timeout(250)
    check(f"{name}: карточка «+» — разбор раскрывается", fr.evaluate("els.mainPanel.style.display") == 'block')
    page.click('#tabExam')
    page.wait_for_timeout(1000)
    check(f"{name}: карточка «+» переключается вместе с основной страницей",
          fr.evaluate("curSubMode") == 'exam' and fr.evaluate("els.solBtnRow.style.display") == 'none'
          and fr.evaluate("els.mainPanel.style.display") == 'none')
    check(f"{name}: карточка — без ошибок JS", not errors, str(errors[:1]))
    ctx.close()


def run():
    with local_server(), sync_playwright() as p:
        browser = p.chromium.launch()
        for name in (sys.argv[1:] or PAGES):
            test_page(browser, name)
            test_session(browser, name)
            test_card(browser, name)
        browser.close()
    print()
    failed = [name for name, ok in results if not ok]
    if failed:
        print("ПРОВАЛЫ:", "; ".join(failed))
        sys.exit(1)
    print(f"ИТОГ: всё прошло ({len(results)} проверок)")


if __name__ == "__main__":
    run()
