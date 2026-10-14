"""
Правка «банк ФИПИ №9» и «„ФИПИ, потом на основе ФИПИ“»: в oge9 — все 111
заданий №9 из открытого банка ФИПИ (КЭС 3.1, краткий ответ). Их 14 групп —
ровно наши 14 прототипов, поэтому список один: у каждого прототипа сначала
задания ФИПИ, когда решены — наши «на основе ФИПИ» (fipi-mix.js).

Проверяет:
  1. данные банка (oge9-fipi-bank.js): 111 заданий, номера уникальны, 14 групп;
     ответ каждого задания пересчитан здесь заново по самому уравнению (без
     sympy: многочлен по трём точкам, корни по дискриминанту, «больший /
     меньший» по оговорке); ответ — целое или до двух знаков; решение
     столбиком, без «/» и дефиса вместо минуса; все ответы приняты сайтом ФИПИ;
  2. экран выбора: один список (колонок нет), №0 и 14 прототипов; на карточке
     «10+ заданий», у вида с одним заданием — «1+ задание»;
  3. фильтр: значок над списком, всплывашка с «Задания ФИПИ» и «На основе
     ФИПИ», (i) раскрывает пояснение, обе выключить нельзя, подписи карточек
     меняются, выбор помнится;
  4. прототип: сначала все задания ФИПИ своего вида подряд без повторов, с
     подписью «Источник: открытый банк заданий ФИПИ, задание …», верный ответ
     засчитан, неверный — ошибка; когда решены — плашка «Все … решены» один
     раз и задания «на основе ФИПИ»; на карточке «ФИПИ решено N из N»;
     «только ФИПИ» после всех решённых — второй круг с плашкой;
  5. квадратные — оговорка «больший / меньший» и разбор; подпись едет в
     «Подборку»; ученик из снимка учителя получает то же задание, подпись и
     плашку;
  6. без файла банка — подписей и фильтра нет, задания наши; задания без
     «принято ФИПИ» ученик не видит, ?all=1 показывает их с пометкой;
     колонок «ФИПИ / Наши» нет и в других тренажёрах ОГЭ; телефон 375 px.

Совместный режим здесь без сети: живьём (вебсокет к Supabase) его нужно
перепроверять на сайте руками.

Запуск: python3 test_prompt_fipi9.py (сервер поднимается сам).
"""
import contextlib
import http.client
import json
import math
import os
import re
import subprocess
import sys
import time
from fractions import Fraction

from playwright.sync_api import sync_playwright

PORT = 9132
BASE = f"http://127.0.0.1:{PORT}"
HERE = os.path.dirname(os.path.abspath(__file__))
SRC_RE = re.compile(r"^Источник: открытый банк заданий ФИПИ, задание ([0-9A-F]{6})$")
GIDS = [f"fipi{i}" for i in range(1, 15)]


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
    src = open(os.path.join(HERE, "oge9-fipi-bank.js"), encoding="utf-8").read()
    body = src[src.index("window.OGE9_FIPI = ") + len("window.OGE9_FIPI = "):].rstrip().rstrip(";")
    return json.loads(body)


def text(h):
    return re.sub(r"<[^>]+>", "", h)


def side(expr, x):
    """Значение части уравнения при x — своим разбором записи, а не тем, что
    строил скрипт сборки: «3(x + 8)», «7x», «x²», настоящий «−»."""
    s = expr.replace("−", "-").replace(" ", "").replace("²", "**2")
    s = re.sub(r"(\d)(x|\()", r"\1*\2", s)
    s = re.sub(r"\)(x|\()", r")*\1", s)
    return eval(s, {"x": x})


def recheck(t):
    eq = text(t["eq"].replace("<sup>2</sup>", "²"))
    L, R = eq.split("=")
    f = lambda v: side(L, Fraction(v)) - side(R, Fraction(v))
    c = f(0)
    s1, s2 = f(1), f(-1)
    a = (s1 + s2) / 2 - c
    b = (s1 - s2) / 2
    if f(2) != 4 * a + 2 * b + c:
        return None
    if a == 0:
        return [Fraction(-c, 1) / b]
    D = b * b - 4 * a * c
    r = math.isqrt(int(D)) if D.denominator == 1 and D >= 0 else -1
    if r * r != D:
        return None
    return sorted({(-b - r) / (2 * a), (-b + r) / (2 * a)})


def test_bank_data(bank):
    tasks, groups = bank["tasks"], bank["groups"]
    check("банк: 111 заданий, номера ФИПИ уникальны", len(tasks) == 111 and len({t["fipi"] for t in tasks}) == 111)
    check("банк: 14 групп, у каждой есть задания",
          [g["id"] for g in groups] == GIDS and all(any(t["g"] == g["id"] for t in tasks) for g in groups))
    bad = []
    for t in tasks:
        roots = recheck(t)
        if not roots:
            bad.append((t["fipi"], "разбор")); continue
        want = roots[0] if t["which"] == "min" or len(roots) == 1 else roots[-1]
        if (len(roots) == 2) != bool(t["which"]):
            bad.append((t["fipi"], "оговорка", roots))
        elif abs(float(want) - t["ans"]) > 1e-9:
            bad.append((t["fipi"], "ответ", float(want), t["ans"]))
        elif abs(round(t["ans"] * 100) - t["ans"] * 100) > 1e-6:
            bad.append((t["fipi"], "знаков", t["ans"]))
    check("банк: ответ каждого задания пересчитан по уравнению", not bad, str(bad[:3]))
    sol_bad = [t["fipi"] for t in tasks
               if t["explain"].count("sol-line") < 2 or "/" in text(t["explain"]) or "-" in text(t["explain"] + t["eq"])]
    check("банк: решение столбиком, без «/» и дефиса вместо минуса", not sol_bad, str(sol_bad[:3]))
    check("банк: глагол как у ФИПИ", all(t["verb"] in ("Решите уравнение", "Найдите корень уравнения") for t in tasks))
    check("банк: все ответы приняты сайтом ФИПИ", all(t["checked"] for t in tasks),
          str(sum(t["checked"] for t in tasks)))
    demo = [t for t in tasks if t["fipi"] == "811946"]
    check("банк: задание демоверсии есть и в банке (811946, −32)",
          demo and text(demo[0]["eq"]) == "3(x + 8) − 2(x − 8) = 8" and demo[0]["ans"] == -32)


def new_page(browser, url, wait=1200, block_bank=False, width=1300, init=None):
    ctx = browser.new_context(viewport={"width": width, "height": 1000})
    page = ctx.new_page()
    errors = []
    page.on("pageerror", lambda e: errors.append(str(e)))
    page.route("https://**/*", lambda route: route.abort())
    if block_bank:
        page.route("**/oge9-fipi-bank.js", lambda route: route.abort())
    if init:
        page.add_init_script(init)
    page.goto(url)
    page.wait_for_timeout(wait)
    return ctx, page, errors


def card(page, mid):
    return page.inner_text(f'.mode-card[data-id="{mid}"]')


def src(page):
    return page.inner_text('#sourceNote').strip() if page.is_visible('#sourceNote') else ''


def notice(page):
    return page.inner_text('#fipiNotice').strip() if page.is_visible('#fipiNotice') else ''


def answer(page, value):
    page.fill('#answerInput', str(value).replace(".", ",").replace("-", "−"))
    page.click('#checkAnswerBtn')
    page.wait_for_timeout(150)


def test_picker_filter(browser):
    ctx, page, errors = new_page(browser, f"{BASE}/oge9.html")
    ids = page.eval_on_selector_all('#modesGrid .mode-card:not(.mix)', 'es => es.map(e => e.dataset.id)')
    check("выбор: один список — №0 и 14 прототипов, колонок нет",
          ids == ["demo2027"] + [f"p{i}" for i in range(1, 15)] and not page.query_selector('.fs-split'), str(ids))
    check("выбор: на карточке «10+ заданий»", "10+ заданий" in card(page, "p8"), card(page, "p8"))
    check("выбор: у вида с одним заданием — «1+ задание»", "1+ задание" in card(page, "p14"), card(page, "p14"))
    check("выбор: у №0 подписи нет", "заданий" not in card(page, "demo2027"))
    check("фильтр: значок над списком", page.is_visible('#fipiFilter .fm-btn'))
    page.click('#fipiFilter .fm-btn')
    page.wait_for_timeout(100)
    labels = page.eval_on_selector_all('.fm-pop label', 'ls => ls.map(l => [l.innerText.trim(), l.querySelector("input").checked])')
    check("фильтр: «Задания ФИПИ» и «На основе ФИПИ», обе включены",
          labels == [["Задания ФИПИ", True], ["На основе ФИПИ", True]], str(labels))
    page.click('.fm-info')
    check("фильтр: (i) раскрывает пояснение", "меняет только числа" in page.inner_text('.fm-pop'))
    page.click('.fm-pop input[data-k="own"]')
    page.wait_for_timeout(100)
    check("фильтр: «только ФИПИ» — «10 заданий ФИПИ»", "10 заданий ФИПИ" in card(page, "p8"), card(page, "p8"))
    check("фильтр: на значке отметка, что фильтр включён", page.eval_on_selector('.fm-btn', 'b => b.classList.contains("on")'))
    page.click('.fm-pop input[data-k="fipi"]')
    page.wait_for_timeout(100)
    both = page.eval_on_selector_all('.fm-pop input', 'is => is.map(i => i.checked)')
    check("фильтр: обе выключить нельзя", both == [True, False], str(both))
    page.click('.fm-pop input[data-k="own"]')
    page.click('.fm-pop input[data-k="fipi"]')
    page.wait_for_timeout(100)
    check("фильтр: «только на основе ФИПИ»", "на основе ФИПИ" in card(page, "p8") and "10" not in card(page, "p8"), card(page, "p8"))
    page.mouse.click(5, 5)
    page.wait_for_timeout(100)
    check("фильтр: щелчок мимо закрывает всплывашку", not page.query_selector('.fm-pop'))
    page.reload()
    page.wait_for_timeout(1000)
    check("фильтр: выбор помнится после перезагрузки", "на основе ФИПИ" in card(page, "p8"))
    page.evaluate("localStorage.removeItem('fipiMix:filter')")
    check("без ошибок JS", not errors, str(errors[:1]))
    ctx.close()


def test_task_flow(browser, bank):
    ctx, page, errors = new_page(browser, f"{BASE}/oge9.html")
    by_id = {t["fipi"]: t for t in bank["tasks"]}
    group = [t for t in bank["tasks"] if t["g"] == "fipi3"]
    page.click('.mode-card[data-id="p3"]')
    page.wait_for_timeout(300)
    seen, ok_all = [], True
    for k in range(len(group)):
        m = SRC_RE.match(src(page))
        t = by_id.get(m.group(1)) if m else None
        prompt = page.inner_text('#questionPromptText')
        if not t or t["g"] != "fipi3" or text(t["eq"]) not in prompt or not prompt.startswith(t["verb"]) or notice(page):
            ok_all = False
            check("прототип: задание ФИПИ своего вида с подписью", False, f"{src(page)} | {prompt}")
            break
        seen.append(t["fipi"])
        if k == 0:
            answer(page, 12345)
            check("ответ: неверный — ошибка", page.evaluate("totalErrors") == 1)
        answer(page, t["ans"])
        if not page.evaluate("taskAnswered") or page.evaluate("totalErrors") != 1:
            ok_all = False
            check("ответ: верный с запятой и «−» засчитан", False, str(t["ans"]))
            break
        page.click('#refreshBtn')
        page.wait_for_timeout(150)
    check("прототип: сначала все 10 заданий ФИПИ, без повторов", ok_all and len(set(seen)) == len(group), str(len(set(seen))))
    check("после ФИПИ: плашка «Все 10 заданий ФИПИ этого вида решены»",
          notice(page).startswith("Все 10 заданий ФИПИ этого вида решены"), notice(page))
    check("после ФИПИ: задание на основе ФИПИ", src(page) == "Задание на основе ФИПИ" and page.evaluate("!curTask.fipi"), src(page))
    st = page.evaluate("window.__trainerState.get()")
    answer(page, page.evaluate("curTask.correctValue"))
    page.click('#refreshBtn')
    page.wait_for_timeout(150)
    check("после ФИПИ: плашка — только один раз", not notice(page) and src(page) == "Задание на основе ФИПИ")
    page.click('#backBtn')
    page.wait_for_timeout(150)
    check("карточка: «ФИПИ решено 10 из 10»", "ФИПИ решено 10 из 10" in card(page, "p3"), card(page, "p3"))

    # «только ФИПИ» и всё решено — второй круг
    page.evaluate("localStorage.setItem('fipiMix:filter', JSON.stringify({ fipi: true, own: false }))")
    page.click('.mode-card[data-id="p3"]')
    page.wait_for_timeout(200)
    page.click('#refreshBtn')
    page.wait_for_timeout(150)
    check("«только ФИПИ», всё решено: второй круг с плашкой",
          "второй круг" in notice(page) and SRC_RE.match(src(page)) is not None, notice(page))
    page.click('#refreshBtn')
    page.wait_for_timeout(150)
    check("второй круг: дальше задания ФИПИ без плашки", not notice(page) and SRC_RE.match(src(page)) is not None)
    page.evaluate("localStorage.removeItem('fipiMix:filter')")

    # квадратные
    page.click('#backBtn'); page.wait_for_timeout(150)
    page.click('.mode-card[data-id="p12"]'); page.wait_for_timeout(300)
    check("квадратные: оговорка «больший из корней» и подпись ФИПИ",
          "в ответ запишите больший из корней" in page.inner_text('#questionPromptText') and SRC_RE.match(src(page)))
    page.click('#tabPractice'); page.wait_for_timeout(150)
    page.click('#showSolutionBtn'); page.wait_for_timeout(150)
    sol = page.inner_text('#explainBox')
    check("«Тренировка»: разбор — дискриминант, корни, Виета", "D =" in sol and "Больший корень" in sol and "Виета" in sol, sol[:200])
    page.click('#showSolutionBtn')
    rich = page.evaluate("window.Basket.extractFromSelectorsRich(['#questionPanel']).text")
    check("подборка: подпись источника уходит вместе с заданием", "Источник: открытый банк заданий ФИПИ" in rich)
    check("без ошибок JS", not errors, str(errors[:1]))
    ctx.close()

    # ученик получает снимок с плашкой «решены» — та же плашка и подпись
    ctx, page, errors = new_page(browser, f"{BASE}/oge9.html")
    page.evaluate("(s) => window.__trainerState.apply(s)", st)
    page.wait_for_timeout(400)
    check("сессия: у ученика то же задание, подпись и плашка",
          page.evaluate("curTask.prompt") == st["curTask"]["prompt"] and src(page) == "Задание на основе ФИПИ"
          and notice(page).startswith("Все 10 заданий"), notice(page))
    check("сессия: без ошибок JS", not errors, str(errors[:1]))
    ctx.close()


def test_without_bank_and_unchecked(browser):
    ctx, page, errors = new_page(browser, f"{BASE}/oge9.html", block_bank=True)
    page.click('.mode-card[data-id="p8"]'); page.wait_for_timeout(300)
    check("без файла банка: наши задания без подписи, фильтра нет",
          not src(page) and not page.query_selector('#fipiFilter .fm-btn') and page.evaluate("!!curTask.meta"))
    check("без файла банка: без ошибок JS", not errors, str(errors[:1]))
    ctx.close()
    # задания p14 без «принято ФИПИ»: ученик их не видит, ?all=1 — с пометкой
    hide = """Object.defineProperty(window, 'OGE9_FIPI', { configurable: true,
          set(v) { v.tasks.filter(t => t.g === 'fipi14').forEach(t => t.checked = false);
                   Object.defineProperty(window, 'OGE9_FIPI', { value: v, writable: true }); } });"""
    ctx, page, errors = new_page(browser, f"{BASE}/oge9.html", init=hide)
    check("неподтверждённые задания ученик не видит", "задани" not in card(page, "p14"), card(page, "p14"))
    ctx.close()
    ctx, page, errors = new_page(browser, f"{BASE}/oge9.html?all=1", init=hide)
    page.click('.mode-card[data-id="p14"]'); page.wait_for_timeout(300)
    check("?all=1: неподтверждённое задание видно с пометкой", "ещё не сверен" in src(page), src(page))
    ctx.close()
    for slug in ("oge8", "oge19", "oge15_18"):
        ctx, page, errors = new_page(browser, f"{BASE}/{slug}.html")
        check(f"{slug}: колонок «ФИПИ / Наши» нет, без ошибок JS", not page.query_selector('.fs-split') and not errors, str(errors[:1]))
        ctx.close()


def test_phone(browser):
    ctx, page, errors = new_page(browser, f"{BASE}/oge9.html", width=375)
    page.click('#fipiFilter .fm-btn'); page.wait_for_timeout(100)
    w1 = page.evaluate("() => document.documentElement.scrollWidth")
    page.mouse.click(5, 5)
    page.click('.mode-card[data-id="p8"]'); page.wait_for_timeout(300)
    w2 = page.evaluate("() => document.documentElement.scrollWidth")
    check("телефон 375 px: фильтр и задание без прокрутки вбок", w1 <= 375 and w2 <= 375, f"{w1} {w2}")
    ctx.close()


def main():
    bank = load_bank()
    test_bank_data(bank)
    with local_server(), sync_playwright() as pw:
        browser = pw.chromium.launch()
        test_picker_filter(browser)
        test_task_flow(browser, bank)
        test_without_bank_and_unchecked(browser)
        test_phone(browser)
        browser.close()
    failed = [n for n, ok in results if not ok]
    print(f"\n{len(results) - len(failed)}/{len(results)} проверок прошло")
    sys.exit(1 if failed else 0)


if __name__ == "__main__":
    main()
