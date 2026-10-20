"""
Правка «банк ФИПИ №6»: в oge6 — все 81 задание №6 из открытого банка ФИПИ
(КЭС 1.2/1.3, краткий ответ). Их 9 видов — ровно наши 9 прототипов, поэтому
список один: у каждого прототипа сначала задания ФИПИ, когда решены — наши
«на основе ФИПИ» (fipi-mix.js, правило из №9). В банке только числа задания:
условие и решение строит та же функция страницы (build_pN), что и генератор.

Проверяет:
  1. данные банка (oge6-fipi-bank.js): 81 задание, номера уникальны, 9 видов;
     ответ каждого пересчитан здесь заново по числам (Fraction); ответ —
     конечная десятичная, до двух знаков; все ответы приняты сайтом ФИПИ;
  2. страница строит каждое задание банка: тот же ответ, что в банке, решение
     столбиком, последняя строка решения — это ответ, без «/» и дефиса;
     генераторы всех 9 прототипов (по 150 заданий) — то же самое;
  3. экран выбора: №0 и 9 прототипов, «10+ заданий», у многоэтажной дроби —
     «1+ задание», фильтр «Задания ФИПИ / На основе ФИПИ»;
  4. прототип: сначала все задания ФИПИ своего вида без повторов, с подписью
     источника; верный ответ засчитан, неверный — ошибка; потом плашка и
     задания «на основе ФИПИ», на карточке «ФИПИ решено 10 из 10»; разбор в
     «Тренировке» — дроби вертикально; подпись едет в «Подборку»; ученик из
     снимка учителя получает то же задание с подписью;
  5. без файла банка — подписей и фильтра нет; неподтверждённые задания
     ученик не видит, ?all=1 — с пометкой; телефон 375 px.

Совместный режим здесь без сети: живьём (вебсокет к Supabase) его нужно
перепроверять на сайте руками.

Запуск: python3 test_prompt_fipi6.py (сервер поднимается сам).
"""
import contextlib
import http.client
import json
import os
import re
import subprocess
import sys
import time
from fractions import Fraction as F

from playwright.sync_api import sync_playwright

PORT = 9133
BASE = f"http://127.0.0.1:{PORT}"
HERE = os.path.dirname(os.path.abspath(__file__))
SRC_RE = re.compile(r"^Источник: открытый банк заданий ФИПИ, задание ([0-9A-F]{6})$")
GIDS = [f"fipi{i}" for i in range(1, 10)]


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
    src = open(os.path.join(HERE, "oge6-fipi-bank.js"), encoding="utf-8").read()
    body = src[src.index("window.OGE6_FIPI = ") + len("window.OGE6_FIPI = "):].rstrip().rstrip(";")
    return json.loads(body)


def value(g, a):
    """Ответ по числам задания — своими формулами, не теми, что у страницы."""
    n = int(g[4:])
    if n in (1, 2, 3, 4):
        x, y = F(a[0], a[1]), F(a[2], a[3])
        return [x + y, x - y, x * y, x / y][n - 1]
    if n in (5, 6, 7):
        x, y = F(a[0], 10), F(a[1], 10)
        return [x + y, x - y, x * y][n - 5]
    if n == 8:
        return F(a[0], 10) / F(a[1], 10)
    return 1 / (F(1, a[0]) + F(1, a[1]))


def test_bank_data(bank):
    tasks, groups = bank["tasks"], bank["groups"]
    check("банк: 81 задание, номера ФИПИ уникальны", len(tasks) == 81 and len({t["fipi"] for t in tasks}) == 81)
    check("банк: 9 видов, у каждого есть задания",
          [g["id"] for g in groups] == GIDS and all(any(t["g"] == g["id"] for t in tasks) for g in groups))
    bad = []
    for t in tasks:
        q = value(t["g"], t["args"])
        if abs(float(q) - t["ans"]) > 1e-9:
            bad.append((t["fipi"], float(q), t["ans"]))
        elif (q * 100).denominator != 1:
            bad.append((t["fipi"], "больше двух знаков", float(q)))
    check("банк: ответ каждого задания пересчитан по числам", not bad, str(bad[:3]))
    p9 = [t for t in tasks if t["g"] == "fipi9"]
    check("банк: многоэтажная дробь — одна, 1/(1/30 + 1/42) = 17,5",
          len(p9) == 1 and p9[0]["args"] == [30, 42] and p9[0]["ans"] == 17.5)
    check("банк: все ответы приняты сайтом ФИПИ", all(t["checked"] for t in tasks),
          str(sum(t["checked"] for t in tasks)))


def new_page(browser, url, wait=1200, block_bank=False, width=1300, init=None):
    ctx = browser.new_context(viewport={"width": width, "height": 1000})
    page = ctx.new_page()
    errors = []
    page.on("pageerror", lambda e: errors.append(str(e)))
    page.route("https://**/*", lambda route: route.abort())
    if block_bank:
        page.route("**/oge6-fipi-bank.js", lambda route: route.abort())
    if init:
        page.add_init_script(init)
    page.goto(url)
    page.wait_for_timeout(wait)
    return ctx, page, errors


# одно задание → то, что видит ученик в решении: строки, последняя — ответ
CHECK_JS = """(t) => {
  const d = document.createElement('div'); d.innerHTML = t.explain;
  const lines = [...d.querySelectorAll('.sol-line')].map(l => l.textContent.replace(/\\s+/g, ' ').trim());
  const last = lines[lines.length - 1] || '';
  const want = String(Math.round(t.correctValue * 100) / 100).replace('.', ',').replace('-', '−');
  const tail = last.split('=').pop().trim();
  return { n: lines.length, tail, want, slash: /\\//.test(d.textContent + t.prompt.replace(/<[^>]+>/g, '')),
           dash: /-/.test(d.textContent + t.prompt.replace(/<[^>]+>/g, '')),
           vfrac: d.querySelectorAll('.frac').length };
}"""


def test_builders(browser, bank):
    ctx, page, errors = new_page(browser, f"{BASE}/oge6.html")
    bad = []
    for t in bank["tasks"]:
        r = page.evaluate("(t) => { const x = FIPI_BUILD['p' + t.g.slice(4)](...t.args); return x; }", t)
        c = page.evaluate(CHECK_JS, r)
        if abs(r["correctValue"] - t["ans"]) > 1e-9 or c["tail"] != c["want"] or c["slash"] or c["dash"]:
            bad.append((t["fipi"], r["correctValue"], t["ans"], c))
        n = int(t["g"][4:])
        if n in (1, 2, 3, 4, 8, 9) and not c["vfrac"]:
            bad.append((t["fipi"], "нет вертикальных дробей"))
    check("страница: каждое задание банка — тот же ответ, решение кончается ответом", not bad, str(bad[:2]))
    gbad = []
    for i in range(1, 10):
        for _ in range(150):
            r = page.evaluate(f"() => gen_p{i}_" + ["frac_add", "frac_sub", "frac_mul", "frac_div", "dec_add",
                                                     "dec_sub", "dec_mul", "dec_div", "nested"][i - 1] + "()")
            c = page.evaluate(CHECK_JS, r)
            if c["tail"] != c["want"] or c["slash"] or c["dash"] or c["n"] < 1:
                gbad.append((i, re.sub(r"<[^>]+>", " ", r["prompt"])[-40:], c))
                break
    check("генераторы 9 прототипов: решение столбиком, кончается ответом, без «/»", not gbad, str(gbad[:2]))
    check("без ошибок JS", not errors, str(errors[:1]))
    ctx.close()


def card(page, mid):
    return page.inner_text(f'.mode-card[data-id="{mid}"]')


def src(page):
    return page.inner_text('#sourceNote').strip() if page.is_visible('#sourceNote') else ''


def notice(page):
    return page.inner_text('#fipiNotice').strip() if page.is_visible('#fipiNotice') else ''


def answer(page, v):
    page.fill('#answerInput', str(v).replace(".", ",").replace("-", "−"))
    page.click('#checkAnswerBtn')
    page.wait_for_timeout(150)


def test_picker(browser, q=""):
    ctx, page, errors = new_page(browser, f"{BASE}/oge6.html{q}")
    ids = page.eval_on_selector_all('#modesGrid .mode-card', 'es => es.map(e => e.dataset.id)')
    check("выбор: №0 и 9 прототипов", ids == ["demo2027"] + [f"p{i}" for i in range(1, 10)], str(ids))
    check("выбор: на карточке «10+ заданий»", "10+ заданий" in card(page, "p1"), card(page, "p1"))
    check("выбор: у многоэтажной дроби — «1+ задание»", "1+ задание" in card(page, "p9"), card(page, "p9"))
    check("выбор: у №0 подписи нет", "задани" not in card(page, "demo2027"))
    check("фильтр: значок над списком", page.is_visible('#fipiFilter .fm-btn'))
    page.click('#fipiFilter .fm-btn')
    page.wait_for_timeout(100)
    labels = page.eval_on_selector_all('.fm-pop label', 'ls => ls.map(l => [l.innerText.trim(), l.querySelector("input").checked])')
    check("фильтр: «Задания ФИПИ» и «На основе ФИПИ», обе включены",
          labels == [["Задания ФИПИ", True], ["На основе ФИПИ", True]], str(labels))
    page.click('.fm-pop input[data-k="own"]')
    page.wait_for_timeout(100)
    check("фильтр: «только ФИПИ» — «10 заданий ФИПИ»", "10 заданий ФИПИ" in card(page, "p1"), card(page, "p1"))
    page.evaluate("localStorage.removeItem('fipiMix:filter')")
    check("без ошибок JS", not errors, str(errors[:1]))
    ctx.close()


def test_task_flow(browser, bank, q=""):
    ctx, page, errors = new_page(browser, f"{BASE}/oge6.html{q}")
    by_id = {t["fipi"]: t for t in bank["tasks"]}
    group = [t for t in bank["tasks"] if t["g"] == "fipi4"]
    page.click('.mode-card[data-id="p4"]')
    page.wait_for_timeout(300)
    seen, ok_all = [], True
    for k in range(len(group)):
        m = SRC_RE.match(src(page).replace(" (ответ ещё не сверен с сайтом ФИПИ)", ""))
        t = by_id.get(m.group(1)) if m else None
        prompt = page.inner_text('#questionPromptText')
        nums = [str(x) for x in t["args"]] if t else []
        if not t or t["g"] != "fipi4" or not all(n in prompt for n in nums) or notice(page):
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
            check("ответ: верный с запятой засчитан", False, str(t["ans"]))
            break
        page.click('#refreshBtn')
        page.wait_for_timeout(150)
    check("прототип: сначала все 10 заданий ФИПИ, без повторов", ok_all and len(set(seen)) == len(group), str(len(set(seen))))
    check("после ФИПИ: плашка «Все 10 заданий ФИПИ этого вида решены»",
          notice(page).startswith("Все 10 заданий ФИПИ этого вида решены"), notice(page))
    check("после ФИПИ: задание на основе ФИПИ", src(page) == "Задание на основе ФИПИ" and page.evaluate("!curTask.fipi"), src(page))
    page.click('#backBtn')
    page.wait_for_timeout(150)
    check("карточка: «ФИПИ решено 10 из 10»", "ФИПИ решено 10 из 10" in card(page, "p4"), card(page, "p4"))

    # многоэтажная дробь: задание ФИПИ, разбор в «Тренировке» с вертикальными дробями
    page.click('.mode-card[data-id="p9"]'); page.wait_for_timeout(300)
    check("многоэтажная: задание ФИПИ D39BF5", "D39BF5" in src(page), src(page))
    page.click('#tabPractice'); page.wait_for_timeout(150)
    page.click('#showSolutionBtn'); page.wait_for_timeout(150)
    sol = page.inner_text('#explainBox')
    fr = page.eval_on_selector_all('#explainBox .sol .frac', 'es => es.length')
    check("«Тренировка»: разбор столбиком, дроби вертикально, ответ 17,5",
          page.eval_on_selector_all('#explainBox .sol-line', 'es => es.length') >= 3 and fr >= 6 and "17,5" in sol and "/" not in sol,
          sol[:200])
    page.click('#showSolutionBtn')
    rich = page.evaluate("window.Basket.extractFromSelectorsRich(['#questionPanel']).text")
    check("подборка: подпись источника уходит вместе с заданием", "Источник: открытый банк заданий ФИПИ" in rich)
    st = page.evaluate("window.__trainerState.get()")
    check("без ошибок JS", not errors, str(errors[:1]))
    ctx.close()

    ctx, page, errors = new_page(browser, f"{BASE}/oge6.html{q}")
    page.evaluate("(s) => window.__trainerState.apply(s)", st)
    page.wait_for_timeout(400)
    check("сессия: у ученика то же задание и подпись",
          page.evaluate("curTask.prompt") == st["curTask"]["prompt"] and "D39BF5" in src(page), src(page))
    check("сессия: без ошибок JS", not errors, str(errors[:1]))
    ctx.close()


def test_without_bank_and_unchecked(browser):
    ctx, page, errors = new_page(browser, f"{BASE}/oge6.html", block_bank=True)
    page.click('.mode-card[data-id="p7"]'); page.wait_for_timeout(300)
    check("без файла банка: наши задания без подписи, фильтра нет",
          not src(page) and not page.query_selector('#fipiFilter .fm-btn') and page.evaluate("!!curTask.prompt"))
    check("без файла банка: без ошибок JS", not errors, str(errors[:1]))
    ctx.close()
    hide = """Object.defineProperty(window, 'OGE6_FIPI', { configurable: true,
          set(v) { v.tasks.filter(t => t.g === 'fipi9').forEach(t => t.checked = false);
                   Object.defineProperty(window, 'OGE6_FIPI', { value: v, writable: true }); } });"""
    ctx, page, errors = new_page(browser, f"{BASE}/oge6.html", init=hide)
    check("неподтверждённые задания ученик не видит", "задани" not in card(page, "p9"), card(page, "p9"))
    ctx.close()
    ctx, page, errors = new_page(browser, f"{BASE}/oge6.html?all=1", init=hide)
    page.click('.mode-card[data-id="p9"]'); page.wait_for_timeout(300)
    check("?all=1: неподтверждённое задание видно с пометкой", "ещё не сверен" in src(page), src(page))
    ctx.close()


def test_phone(browser, q=""):
    ctx, page, errors = new_page(browser, f"{BASE}/oge6.html{q}", width=375)
    page.click('.mode-card[data-id="p9"]'); page.wait_for_timeout(300)
    page.click('#tabPractice'); page.wait_for_timeout(150)
    page.click('#showSolutionBtn'); page.wait_for_timeout(150)
    w = page.evaluate("() => document.documentElement.scrollWidth")
    check("телефон 375 px: задание и разбор без прокрутки вбок", w <= 375, str(w))
    ctx.close()


def main():
    bank = load_bank()
    test_bank_data(bank)
    # пока сайт ФИПИ не сверил ответы, страница показывает задания банка только с ?all=1
    q = "" if all(t["checked"] for t in bank["tasks"]) else "?all=1"
    with local_server(), sync_playwright() as pw:
        browser = pw.chromium.launch()
        test_builders(browser, bank)
        test_picker(browser, q)
        test_task_flow(browser, bank, q)
        test_without_bank_and_unchecked(browser)
        test_phone(browser, q)
        browser.close()
    failed = [n for n, ok in results if not ok]
    print(f"\n{len(results) - len(failed)}/{len(results)} проверок прошло")
    sys.exit(1 if failed else 0)


if __name__ == "__main__":
    main()
