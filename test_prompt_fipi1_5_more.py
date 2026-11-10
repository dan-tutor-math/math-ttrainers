"""
Правка «банк ФИПИ №15–18 и №1–5, без сайта»: в oge1_5 — сюжеты «Листы
бумаги» (20 заданий, по 4 на номер) и «Печь для бани» (8 заданий, по 2 на
номера 1–5; задание 5 — радиус арки по рисунку, добавлено 10.11.2026) из
открытого банка ФИПИ. Условие ФИПИ хранится в банке как есть (с таблицами),
решение — строками. Ответы ещё не сверены сайтом ФИПИ — ученику не видны,
?all=1 — предпросмотр.

Проверяет:
  1. банк: 28 заданий листов и бани, номера уникальны, у листов по 4 задания
     на каждый номер 1–5, у бани по 2 на номера 1–4; ответ КАЖДОГО задания
     сверен с ответом, посчитанным здесь заново вручную (таблица ниже —
     независимо от скрипта сборки);
  2. без ?all=1 — темы по-прежнему «скоро»; с ?all=1 — группы «📄 Листы
     бумаги» и «🔥 Печь для бани», в бане задания 1–4;
  3. тема: текст ФИПИ в «теории» (у бани — таблица печей), задание с таблицей,
     подпись источника с пометкой «не сверен», неверный ответ — ошибка, верный
     (и «2413», и «312,5») засчитан, разбор столбиком с ответом; снимок сессии
     открывает у собеседника то же задание и тот же текст; телефон 375 px.

Совместный режим здесь без сети: живьём его нужно перепроверять на сайте руками.

Запуск: python3 test_prompt_fipi1_5_more.py (сервер поднимается сам).
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

PORT = 9172
BASE = f"http://127.0.0.1:{PORT}"
HERE = os.path.dirname(os.path.abspath(__file__))
SRC_RE = re.compile(r"^Источник: открытый банк заданий ФИПИ, задание ([0-9A-Za-z]{6})")

# ответы, посчитанные вручную по определению форматов (А0 — 1 кв. м, стороны
# в отношении √2, А0 1189 × 841 мм) и по таблице печей
EXPECT = {
    "187F35": 2413, "9A494F": 1243, "CC9C1C": 2143, "4B0911": 3124,      # соответствие форматов
    "703F88": 2, "AFAB20": 4, "707AE8": 4, "1DFDCC": 8,                  # сколько листов
    "3860EB": 1250, "8972EA": 312.5, "6C743F": 840, "C8C2FC": 210,       # площадь, ширина
    "B1753A": 840, "637C7B": 150, "A7FCE1": 0.7, "C08FA1": 1.4,          # длина, отношение
    "EA5C1C": 1250, "CC70B9": 4800, "B8AF15": 21, "07E7B1": 11,          # масса пачки, шрифт
    "30DDBA": 312, "74CB1E": 321, "CD3CFF": 15.4, "2789BB": 7.7,         # баня
    "888F31": 2000, "908015": 4500, "8A06F1": 16200, "FEDFE6": 17550,
    # радиус арки: R² = (ширина / 2)² + высота стенки², размеры с рисунка 2
    "BE99C7": 65,    # 25² + 60² = 4225 = 65²
    "59DCD0": 50,    # 30² + 40² = 2500 = 50²
}
ARCH = {"BE99C7", "59DCD0"}


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
    src = open(os.path.join(HERE, "oge1_5-fipi-bank.js"), encoding="utf-8").read()
    body = src[src.index("window.OGE1_5_FIPI = ") + len("window.OGE1_5_FIPI = "):].rstrip().rstrip(";")
    return json.loads(body)


def new_page(browser, url, wait=1000, width=1300):
    ctx = browser.new_context(viewport={"width": width, "height": 1000})
    page = ctx.new_page()
    errors = []
    page.on("pageerror", lambda e: errors.append(str(e)))
    page.route("https://**/*", lambda route: route.abort())
    page.goto(url)
    page.wait_for_timeout(wait)
    return ctx, page, errors


def src(page):
    return page.inner_text('#sourceNote').strip() if page.is_visible('#sourceNote') else ''


def fmt(x):
    s = ("%.2f" % x).rstrip("0").rstrip(".")
    return s.replace(".", ",")


def answer(page, v):
    page.fill('#answerInput', v)
    page.click('#checkAnswerBtn')
    page.wait_for_timeout(200)


def test_bank(bank):
    more = [t for t in bank["tasks"] if t["plot"] in ("paper", "bath")]
    check("банк: 30 заданий листов и бани, номера уникальны", len(more) == 30 and len({t["fipi"] for t in more}) == 30, str(len(more)))
    per = {(p, n): sum(1 for t in more if t["plot"] == p and t["n"] == n) for p in ("paper", "bath") for n in range(1, 6)}
    check("банк: у листов по 4 задания на номер 1–5, у бани по 2 на 1–5",
          all(per[("paper", n)] == 4 for n in range(1, 6)) and all(per[("bath", n)] == 2 for n in range(1, 6)), str(per))
    bad = [(t["fipi"], t["ans"], EXPECT.get(t["fipi"])) for t in more if EXPECT.get(t["fipi"]) is None or abs(t["ans"] - EXPECT[t["fipi"]]) > 1e-9]
    check("банк: ответ каждого задания совпал с посчитанным вручную", not bad, str(bad[:3]))
    check("банк: у бани ничего не ждёт картинок", bank["plots"]["bath"]["wait"] == [], str(bank["plots"]["bath"].get("wait")))
    arch = [t for t in more if t["fipi"] in ARCH]
    check("банк: у радиуса арки в условии оба рисунка ФИПИ",
          len(arch) == 2 and all(t["prompt"].count('<img class="fipi-fig" src="oge1_5-fipi/') == 2 for t in arch))
    junk = [t["fipi"] for t in more if re.search(r"MsoNormal|<m:|</p>\s*<p>\s*</td>|&nbsp;|<script", t["prompt"])]
    check("банк: условие ФИПИ вычищено (без MsoNormal, MathML, скриптов)", not junk, str(junk[:3]))


def test_page(browser, bank):
    ctx, page, errors = new_page(browser, f"{BASE}/oge1_5.html")
    soon = page.eval_on_selector_all('#modesGrid .group-title', 'es => es.map(e => e.textContent.trim())')
    # после сверки 02.11.2026 листы и баня открыты ученику; до неё — «скоро»
    more = [t for t in bank["tasks"] if t["plot"] in ("paper", "bath")]
    verified = all(t.get("checked") for t in more if t["fipi"] not in ARCH)
    if verified:
        check("без ?all=1: листы и баня открыты (ответы сверены ФИПИ)",
              page.query_selector('.mode-card[data-id="paper_fipi"]') and page.query_selector('.mode-card[data-id="bath_fipi"]'), str(soon))
    else:
        check("без ?all=1: листы и баня — «скоро» (ответы не сверены)",
              "📄 Листы бумаги" in soon and not page.query_selector('.mode-card[data-id="paper_fipi"]'), str(soon))
    ctx.close()

    ctx, page, errors = new_page(browser, f"{BASE}/oge1_5.html?all=1")
    titles = page.eval_on_selector_all('#modesGrid .group-title', 'es => es.map(e => e.textContent.trim())')
    check("?all=1: группы «Листы бумаги» и «Печь для бани», в «скоро» их нет",
          titles.count("📄 Листы бумаги") == 1 and titles.count("🔥 Печь для бани") == 1
          and page.query_selector('.mode-card[data-id="paper_fipi"]') and page.query_selector('.mode-card[data-id="bath_fipi"]'), str(titles))
    by = {t["fipi"]: t for t in bank["tasks"]}
    page.click('.mode-card[data-id="paper_fipi"]'); page.wait_for_timeout(300)
    m = SRC_RE.match(src(page))
    t = by.get(m.group(1)) if m else None
    check("листы, задание 1: соответствие форматов, таблица, подпись (пометка «не сверен» — только до сверки)",
          t and t["n"] == 1 and page.query_selector('#questionPromptText table.data-table')
          and (("не сверен" in src(page)) == (not t.get("checked"))), src(page))
    page.click('#theoryToggleBtn'); page.wait_for_timeout(150)
    th = page.inner_text('#theoryContent')
    check("листы: текст ФИПИ в теории", "Лист формата А0 имеет форму прямоугольника площадью 1 кв. м" in th, th[:120])
    answer(page, "1111")
    check("листы: неверный ответ — ошибка", page.evaluate("totalErrors") == 1)
    answer(page, str(EXPECT[t["fipi"]]))
    exp = page.inner_text('#explainBox')
    check("листы: верный ответ засчитан, разбор с форматами и ответом",
          page.evaluate("taskAnswered") and "Ответ" in exp and "А0" in exp, exp[:120])
    # задание 3 (площадь / ширина) — пока не выпадет площадь А5 с ответом 312,5
    page.evaluate("setCurMode('paperfipi_t3'); openTask()"); page.wait_for_timeout(200)
    for _ in range(30):
        if page.evaluate("curTask.fipi") == "8972EA":
            break
        page.click('#refreshBtn'); page.wait_for_timeout(80)
    if page.evaluate("curTask.fipi") == "8972EA":
        answer(page, "312,5")
        check("листы: десятичный ответ 312,5 засчитан", page.evaluate("taskAnswered"))
    st = page.evaluate("window.__trainerState.get()")
    check("листы: без ошибок JS", not errors, str(errors[:1]))
    ctx.close()

    ctx, page, errors = new_page(browser, f"{BASE}/oge1_5.html?all=1")
    page.evaluate("(s) => window.__trainerState.apply(s)", st)
    page.wait_for_timeout(400)
    check("сессия: у собеседника то же задание и текст листов",
          page.evaluate("curTask && curTask.prompt") == st["curTask"]["prompt"]
          and "А0" in page.evaluate("document.getElementById('theoryContent').textContent"))
    ctx.close()

    ctx, page, errors = new_page(browser, f"{BASE}/oge1_5.html?all=1")
    page.click('.mode-card[data-id="bath_fipi"]'); page.wait_for_timeout(300)
    nav = page.evaluate("curTasksetRef.tasks.map(t => t.id)")
    check("баня (?all=1): задания 1–5", nav == ["bathfipi_t1", "bathfipi_t2", "bathfipi_t3", "bathfipi_t4", "bathfipi_t5"], str(nav))
    th = page.evaluate("document.getElementById('theoryContent').innerHTML")
    check("баня: в теории таблица печей", "data-table" in th and "электрическая" in th and "9–15,5" in th)
    t = by[SRC_RE.match(src(page)).group(1)]
    answer(page, fmt(EXPECT[t["fipi"]]))
    check("баня: задание 1 (соответствие) засчитано", page.evaluate("taskAnswered"), t["fipi"])
    page.evaluate("setCurMode('bathfipi_t5'); openTask()"); page.wait_for_timeout(400)
    t = by[SRC_RE.match(src(page)).group(1)]
    imgs = page.eval_on_selector_all('#questionPromptText img.fipi-fig', 'es => es.map(e => e.naturalWidth)')
    check("баня, задание 5: оба рисунка загрузились", len(imgs) == 2 and all(w > 0 for w in imgs), str(imgs))
    answer(page, str(EXPECT[t["fipi"]]))
    check("баня, задание 5: радиус засчитан", page.evaluate("taskAnswered"), t["fipi"])
    check("баня: без ошибок JS", not errors, str(errors[:1]))
    ctx.close()

    ctx, page, errors = new_page(browser, f"{BASE}/oge1_5.html?all=1", width=375)
    page.click('.mode-card[data-id="paper_fipi"]'); page.wait_for_timeout(300)
    w = page.evaluate("() => document.documentElement.scrollWidth")
    check("телефон 375 px: задание с таблицами без прокрутки вбок", w <= 375, str(w))
    ctx.close()


def main():
    bank = load_bank()
    test_bank(bank)
    with local_server(), sync_playwright() as pw:
        browser = pw.chromium.launch()
        test_page(browser, bank)
        browser.close()
    failed = [n for n, ok in results if not ok]
    print(f"\n{len(results) - len(failed)}/{len(results)} проверок прошло")
    sys.exit(1 if failed else 0)


if __name__ == "__main__":
    main()
