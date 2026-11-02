"""
Правка «банк ФИПИ №15–18, без сайта»: oge15_18.html переделан с выбора
вариантов на ввод числа (как на экзамене и как в №6, №9), в №15–17 — 70 видов
заданий открытого банка ФИПИ (oge15_18-kinds.js) и 824 задания банка, условие
которых целиком в тексте (oge15_18-fipi-bank.js). Ответы ещё не сверены сайтом
ФИПИ (до 27.10 банк закрыт) — ученику не видны, ?all=1 — предпросмотр.

Проверяет:
  1. банк: 824 задания, номера уникальны, вид каждого есть в oge15_18-kinds.js;
     условие и ответ каждого задания строит вид страницы, ответ совпадает с
     ответом сборки (n1518_build.py), без «undefined», «NaN», плоских «[p/q]» и
     «√(»; ответ — целый или до двух знаков; решение столбиком;
  2. генераторы «на основе ФИПИ»: по 100 заданий каждого вида — ответ
     положительный, до двух знаков, условие и решение без «undefined»;
  3. экран выбора: группы №15–18, №0 демоверсии первым в каждой, «вперемешку»
     у №15–17; без ?all=1 у видов нет «N+ заданий» (ответы не сверены),
     с ?all=1 — есть;
  4. вид с ?all=1: сначала все задания ФИПИ своего вида без повторов, с
     подписью и пометкой «ответ ещё не сверен», неверный ответ — ошибка, верный
     с запятой засчитан; потом плашка и «на основе ФИПИ»;
  5. №0 демоверсии и «по клеткам» — ввод числа (вариантов нет), рисунок на месте;
  6. старые типы и задания с вариантами: память «tri» открывает «Третий угол»,
     снимок сессии с типом «circ» и с заданием-вариантами не ломает страницу,
     ответ берётся из верного варианта;
  7. «Тренировка»: разбор с дробью и корнем вёрсткой; чертёж ФИПИ (поле img)
     показывается под условием; «Подборка» уносит подпись; снимок сессии даёт
     ученику то же задание; телефон 375 px без прокрутки вбок.

Совместный режим здесь без сети: живьём (вебсокет к Supabase) его нужно
перепроверять на сайте руками.

Запуск: python3 test_prompt_fipi15_18.py (сервер поднимается сам).
"""
import contextlib
import http.client
import json
import os
import re
import subprocess
import sys
import time

from playwright.sync_api import sync_playwright

PORT = 9171
BASE = f"http://127.0.0.1:{PORT}"
HERE = os.path.dirname(os.path.abspath(__file__))
SRC_RE = re.compile(r"^Источник: открытый банк заданий ФИПИ, задание ([0-9A-Fa-f]{6})")


@contextlib.contextmanager
def local_server():
    proc = subprocess.Popen([sys.executable, "-m", "http.server", str(PORT)], cwd=HERE,
                            stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
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


def load_bank():
    src = open(os.path.join(HERE, "oge15_18-fipi-bank.js"), encoding="utf-8").read()
    body = src[src.index("window.OGE15_18_FIPI = ") + len("window.OGE15_18_FIPI = "):].rstrip().rstrip(";")
    return json.loads(body)


def new_page(browser, url, wait=1000, width=1300, init=None):
    ctx = browser.new_context(viewport={"width": width, "height": 1000})
    page = ctx.new_page()
    errors = []
    page.on("pageerror", lambda e: errors.append(str(e)))
    page.route("https://**/*", lambda route: route.abort())
    if init:
        page.add_init_script(init)
    page.goto(url)
    page.wait_for_timeout(wait)
    return ctx, page, errors


def src(page):
    return page.inner_text('#sourceNote').strip() if page.is_visible('#sourceNote') else ''


def notice(page):
    return page.inner_text('#fipiNotice').strip() if page.is_visible('#fipiNotice') else ''


def answer(page, value):
    page.fill('#answerInput', str(value).replace(".", ",").replace("-", "−"))
    page.click('#checkAnswerBtn')
    page.wait_for_timeout(120)


def card(page, mid):
    return page.inner_text(f'.mode-card[data-id="{mid}"]')


def test_bank(browser, bank):
    tasks = bank["tasks"]
    check("банк: 824 задания, номера ФИПИ уникальны", len(tasks) == 824 and len({t["fipi"] for t in tasks}) == 824, str(len(tasks)))
    check("банк: ждут картинок — по номерам 15, 16, 17, 18", sorted(bank["wait"]) == ["15", "16", "17", "18"] and bank["wait"]["18"] == 154, str(bank["wait"]))
    ctx, page, errors = new_page(browser, f"{BASE}/oge15_18.html")
    res = page.evaluate("""(tasks) => {
      const G = window.GEOM_KINDS, bad = [];
      for (const t of tasks) {
        const k = G.byId[t.k];
        if (!k) { bad.push([t.fipi, 'нет вида', t.k]); continue; }
        const b = G.build(k, t.a), plain = b.prompt.replace(/<[^>]+>/g, '');
        const want = parseFloat(t.ans.replace(',', '.'));
        if (Math.abs(b.correctValue - want) > 1e-9) bad.push([t.fipi, 'ответ', b.correctValue, t.ans]);
        else if (/undefined|NaN|\\[|√\\(/.test(plain + b.lines.join(''))) bad.push([t.fipi, 'запись', plain]);
        else if (Math.abs(Math.round(want * 100) - want * 100) > 1e-6 || want <= 0) bad.push([t.fipi, 'бланк', t.ans]);
        else if (b.lines.length < 1) bad.push([t.fipi, 'решение']);
      }
      return { bad: bad.slice(0, 5), n: bad.length, kinds: G.list.length };
    }""", tasks)
    check("банк: условие и ответ каждого задания строит вид, ответ совпадает со сборкой", res["n"] == 0, str(res["bad"]))
    check("виды: 70", res["kinds"] == 70, str(res["kinds"]))
    gen = page.evaluate("""() => {
      const G = window.GEOM_KINDS, bad = [];
      for (const k of G.list) for (let i = 0; i < 100; i++) {
        const b = G.build(k, k.gen()), all = b.prompt + b.lines.join('');
        if (!G.blank(b.correctValue) || /undefined|NaN/.test(all)) { bad.push([k.id, b.prompt, b.correctValue]); break; }
      }
      return bad;
    }""")
    check("генераторы: по 100 заданий каждого вида — ответ для бланка, без «undefined»", not gen, str(gen[:2]))
    check("банк: без ошибок JS", not errors, str(errors[:1]))
    ctx.close()


VERIFIED = False


def test_picker(browser):
    ctx, page, errors = new_page(browser, f"{BASE}/oge15_18.html")
    groups = page.eval_on_selector_all('#modesGrid .group-title', 'es => es.map(e => e.textContent.trim())')
    check("выбор: группы №15–18", groups == ["№15. Треугольники", "№16. Окружность", "№17. Четырёхугольники", "№18. Клетчатая бумага"], str(groups))
    firsts = page.eval_on_selector_all('#modesGrid .modes', 'ms => ms.map(m => m.querySelector(".mode-card").dataset.id)')
    check("выбор: №0 демоверсии первым в каждой группе", firsts == ["demo15", "demo16", "demo17", "demo18"], str(firsts))
    mixes = page.eval_on_selector_all('#modesGrid .mode-card.mix', 'es => es.map(e => e.dataset.id)')
    check("выбор: «вперемешку» у №15–17", mixes == ["random15", "random16", "random17"], str(mixes))
    # после сверки 02.11.2026 ученику видны все задания банка, до неё — ни одного
    if VERIFIED:
        check("выбор: ответы сверены — у вида «12+ заданий» и без ?all=1", "12+ заданий" in card(page, "t_hyp"), card(page, "t_hyp"))
    else:
        check("выбор: ответы не сверены — у видов нет «N+ заданий»", "задани" not in card(page, "t_hyp"), card(page, "t_hyp"))
    page.click('.mode-card[data-id="random16"]'); page.wait_for_timeout(200)
    check("«Окружность вперемешку»: задание из №16", page.evaluate("/окружност|Четырёхугольник ABCD вписан|Угол A четырёхугольника|трапеции ABCD с основаниями AD и BC, вписанной|диаметр/.test(curTask.prompt)"),
          page.evaluate("curTask.prompt")[:80])
    check("выбор: без ошибок JS", not errors, str(errors[:1]))
    ctx.close()
    ctx, page, errors = new_page(browser, f"{BASE}/oge15_18.html?all=1")
    check("?all=1: у вида «12+ заданий»", "12+ заданий" in card(page, "t_hyp"), card(page, "t_hyp"))
    ctx.close()


def test_flow(browser, bank):
    ctx, page, errors = new_page(browser, f"{BASE}/oge15_18.html?all=1")
    by_id = {t["fipi"]: t for t in bank["tasks"]}
    group = [t for t in bank["tasks"] if t["k"] == "c_cyc_two"]
    page.click('.mode-card[data-id="c_cyc_two"]'); page.wait_for_timeout(250)
    seen, ok = [], True
    for i in range(len(group)):
        m = SRC_RE.match(src(page))
        t = by_id.get(m.group(1)) if m else None
        # пометка «ещё не сверен» — только пока сайт ФИПИ не принял ответ
        if not t or t["k"] != "c_cyc_two" or (("ещё не сверен" in src(page)) != (not t.get("checked"))):
            ok = False; check("вид: задание ФИПИ своего вида с подписью и пометкой", False, src(page)); break
        seen.append(t["fipi"])
        if i == 0:
            answer(page, 12345)
            check("ответ: неверный — ошибка", page.evaluate("totalErrors") == 1)
        answer(page, t["ans"])
        if not page.evaluate("taskAnswered"):
            ok = False; check("ответ: верный засчитан", False, t["ans"]); break
        page.click('#refreshBtn'); page.wait_for_timeout(120)
    check(f"вид: сначала все {len(group)} заданий ФИПИ без повторов", ok and len(set(seen)) == len(group), str(len(set(seen))))
    check("после ФИПИ: плашка и задание на основе ФИПИ",
          notice(page).startswith(f"Все {len(group)} заданий ФИПИ") and src(page) == "Задание на основе ФИПИ", notice(page))
    # десятичный ответ с запятой
    page.click('#backBtn'); page.wait_for_timeout(120)
    page.click('.mode-card[data-id="c_inscr"]'); page.wait_for_timeout(250)
    t = by_id[SRC_RE.match(src(page)).group(1)]
    answer(page, t["ans"])
    check("ответ: десятичный с запятой засчитан", page.evaluate("taskAnswered"), t["ans"])
    check("вид: без ошибок JS", not errors, str(errors[:1]))
    ctx.close()


def test_demo_and_legacy(browser):
    ctx, page, errors = new_page(browser, f"{BASE}/oge15_18.html")
    for mid, val, svg in [("demo15", "105", True), ("demo16", "196", True), ("demo17", "4,5", True), ("demo18", "5", True), ("grid", None, True)]:
        page.click('#backBtn') if page.is_visible('#backBtn') else None
        page.wait_for_timeout(100)
        page.click(f'.mode-card[data-id="{mid}"]'); page.wait_for_timeout(200)
        v = val or page.evaluate("fmtAnswer(curTask.correctValue)")
        has_svg = page.evaluate("!!document.querySelector('#questionPromptText svg')")
        no_opts = page.evaluate("!curTask.options") and page.is_visible('#answerInput')
        answer(page, v)
        check(f"{mid}: ввод числа, рисунок на месте, ответ {v} засчитан", has_svg and no_opts and page.evaluate("taskAnswered"))
    ctx.close()
    # память старого типа «tri» с заданием-вариантами
    old = json.dumps({"task": {"prompt": "В треугольнике два угла равны 40° и 60°. Найдите третий угол.", "options": ["80", "100", "120", "90"],
                               "correctIndex": 0, "explain": "старое"}, "answered": False, "hadWrongPick": False, "history": [],
                      "medals": {"gold": 0, "silver": 0, "bronze": 0}, "lastActiveAt": int(time.time() * 1000)})
    init = f"try {{ localStorage.setItem('ogeProg:oge15_18:demo15', {json.dumps(old)}); }} catch (e) {{}}"
    ctx, page, errors = new_page(browser, f"{BASE}/oge15_18.html", init=init)
    page.click('.mode-card[data-id="demo15"]'); page.wait_for_timeout(200)
    check("старое задание с вариантами в памяти: ответ из верного варианта",
          page.evaluate("curTask.correctValue === 80 && !curTask.options") and page.is_visible('#answerInput'))
    page.evaluate("""() => window.__trainerState.apply({ picker: false, curMode: 'circ', curSubMode: 'exam',
        curTask: { prompt: 'Центральный угол 80°', options: ['40','80','160','35'], correctIndex: 0, explain: '' }, taskAnswered: false })""")
    page.wait_for_timeout(300)
    check("снимок старой вкладки с типом «circ»: открыт вид «Вписанный и центральный угол»",
          page.evaluate("curMode") == "c_inscr" and page.evaluate("!curTask.options"), page.evaluate("curMode"))
    page.evaluate("""() => window.__trainerState.apply({ picker: false, curMode: 'demo16', curSubMode: 'exam',
        curTask: { prompt: 'Найдите площадь квадрата', options: ['49','98','154','196'], correctIndex: 3, explain: '' }, taskAnswered: false })""")
    page.wait_for_timeout(300)
    check("снимок с заданием-вариантами: ответ 196 из верного варианта", page.evaluate("curTask.correctValue") == 196)
    page.evaluate("localStorage.setItem('examNav:oge15_18', 'tri')")
    check("старый тип «tri» → «Третий угол треугольника»", page.evaluate("normMode('tri')") == "t_third" and page.evaluate("normMode('quadarea')") == "q_trap_area")
    check("старое: без ошибок JS", not errors, str(errors[:1]))
    ctx.close()


def test_practice_img_session_phone(browser, bank):
    # чертёж: подставляем картинку первому заданию вида t_hyp (до 27.10 картинок ФИПИ нет)
    init = """Object.defineProperty(window, 'OGE15_18_FIPI', { configurable: true,
        set(v) { v.tasks.forEach(t => { if (t.k === 't_hyp') t.img = 'favicon.svg'; });
                 Object.defineProperty(window, 'OGE15_18_FIPI', { value: v, writable: true }); } });"""
    ctx, page, errors = new_page(browser, f"{BASE}/oge15_18.html?all=1", init=init)
    page.click('.mode-card[data-id="t_hyp"]'); page.wait_for_timeout(250)
    check("чертёж ФИПИ под условием", page.evaluate("!!document.querySelector('#questionPromptText img.fipi-fig')"))
    page.click('#backBtn'); page.wait_for_timeout(120)
    page.click('.mode-card[data-id="t_trig_side"]'); page.wait_for_timeout(250)
    check("условие: дробь вертикально", page.evaluate("!!document.querySelector('#questionPromptText .frac .den')"))
    page.click('#tabPractice'); page.wait_for_timeout(120)
    page.click('#showSolutionBtn'); page.wait_for_timeout(150)
    sol = page.inner_text('#explainBox')
    check("«Тренировка»: разбор столбиком и ответ", page.evaluate("document.querySelectorAll('#explainBox .sol-line').length >= 2") and "Ответ" in sol, sol[:120])
    rich = page.evaluate("window.Basket.extractFromSelectorsRich(['#questionPanel']).text")
    check("подборка: подпись источника уходит вместе с заданием", "Источник: открытый банк заданий ФИПИ" in rich)
    page.click('#backBtn'); page.wait_for_timeout(120)
    page.click('.mode-card[data-id="c_sq_mid"]'); page.wait_for_timeout(250)
    st = page.evaluate("window.__trainerState.get()")
    check("без ошибок JS", not errors, str(errors[:1]))
    ctx.close()
    ctx, page, errors = new_page(browser, f"{BASE}/oge15_18.html")
    page.evaluate("(s) => window.__trainerState.apply(s)", st)
    page.wait_for_timeout(400)
    check("сессия: у ученика то же задание и подпись",
          page.evaluate("curTask.prompt") == st["curTask"]["prompt"] and SRC_RE.match(src(page)) is not None, src(page))
    answer(page, page.evaluate("fmtAnswer(curTask.correctValue)"))
    check("сессия: ученик решает задание ФИПИ из снимка", page.evaluate("taskAnswered"))
    check("сессия: без ошибок JS", not errors, str(errors[:1]))
    ctx.close()
    ctx, page, errors = new_page(browser, f"{BASE}/oge15_18.html?all=1", width=375)
    page.click('.mode-card[data-id="t_midline"]'); page.wait_for_timeout(250)
    w = page.evaluate("() => document.documentElement.scrollWidth")
    check("телефон 375 px: длинное условие без прокрутки вбок", w <= 375, str(w))
    ctx.close()


def main():
    bank = load_bank()
    global VERIFIED
    VERIFIED = all(t.get("checked") for t in bank["tasks"])
    with local_server(), sync_playwright() as pw:
        browser = pw.chromium.launch()
        test_bank(browser, bank)
        test_picker(browser)
        test_flow(browser, bank)
        test_demo_and_legacy(browser)
        test_practice_img_session_phone(browser, bank)
        browser.close()
    failed = [n for n, ok in results if not ok]
    print(f"\n{len(results) - len(failed)}/{len(results)} проверок прошло")
    sys.exit(1 if failed else 0)


if __name__ == "__main__":
    main()
