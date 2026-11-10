"""
Правка «№1–5: поездка в село и план местности из банка ФИПИ» (10.11.2026):
в oge1_5 тема «🗺️ План местности» — «Поездка в село» (10 текстов по 10
заданий, у каждого свой план) и «План сельской местности» (Таня, 20 заданий).
Условие ФИПИ хранится как есть, рисунки — в oge1_5-fipi/. Собраны скриптом
fipi-pilot/tools/n15_plans.py по координатам, снятым с планов глазами. Ответы
ещё не сверены сайтом ФИПИ — ученику не видны, ?all=1 — предпросмотр.

Проверяет:
  1. банк: 100 заданий поездки (по 20 на номер, у каждого текста по 2) и 20
     заданий Тани (по 4 на номер); ответ КАЖДОГО задания посчитан здесь заново
     и независимо от скрипта сборки: поездка — по таблице ниже (цифры деревень
     и длины шоссе, снятые с планов, скорости из текста) своими формулами,
     магазины — по таблице цен прямо из условия; Таня — ответы вручную;
  2. каждый текст поездки — с планом, все рисунки на месте в oge1_5-fipi/;
  3. без ?all=1 «План местности» по-прежнему «скоро»; с ?all=1 — одна плашка
     с двумя темами;
  4. тема поездки: план в теории загрузился, задания 1–5 одного текста, верный
     ответ засчитан, «🔄 Другой текст ФИПИ» меняет текст и план, снимок сессии
     открывает у собеседника тот же текст; в кадре карточки «+» (?card=1) текст
     с планом идёт в само условие; Таня; телефон 375 px.

  5. квартира, участки, тарифы (n15_more2.py, Codex, ответы сверены ФИПИ):
     110 заданий, по номерам; темы открыты ученику без ?all=1; в каждой теме
     план или график загрузился, задание с картинкой засчитано, разбор по
     шагам; тарифы ФИПИ — в нашей плашке «📱 Тарифы».

Совместный режим здесь без сети: живьём его нужно перепроверять на сайте руками.

Запуск: python3 test_prompt_fipi1_5_plans.py (сервер поднимается сам).
"""
import contextlib
import html as H
import http.client
import json
import math
import os
import re
import subprocess
import sys
import time
from fractions import Fraction as Fr

from playwright.sync_api import sync_playwright

PORT = 9173
BASE = f"http://127.0.0.1:{PORT}"
HERE = os.path.dirname(os.path.abspath(__file__))
SRC_RE = re.compile(r"^Источник: открытый банк заданий ФИПИ, задание ([0-9A-Za-z]{6})")

# Поездка: по первому заданию текста — деревни с цифрами на плане в порядке
# «откуда, через, поворот, куда», длины шоссе в км (клетки × масштаб),
# скорости по шоссе и по прямой дороге, и чем задание 7 — по прямой или через поворот
TRIPS = {
    "C9CC62": (("Масловка", 1), ("Вёсенка", 2), ("Полянка", 3), ("Захарово", 4), 21, 15, 20, 20, 15, "straight"),
    "50AAED": (("Осиновка", 4), ("Зябликово", 2), ("Старая", 1), ("Николаево", 3), 20, 8, 15, 15, 10, "straight"),
    "9DA1CD": (("Грушёвка", 3), ("Таловка", 2), ("Новая", 1), ("Абрамово", 4), 18, 10, 24, 15, 12, "road"),
    "7B221C": (("Ёлочки", 4), ("Сосенки", 3), ("Жуки", 1), ("Кленовое", 2), 60, 24, 32, 80, 40, "straight"),
    "2C4E7E": (("Ясная", 1), ("Камышёвка", 2), ("Хомяково", 3), ("Майское", 4), 32, 10, 24, 20, 15, "road"),
    "0822A3": (("Васильково", 4), ("Камышино", 3), ("Журавушка", 1), ("Иваново", 2), 16, 5, 12, 20, 15, "straight"),
    "AC5E2C": (("Дивная", 1), ("Калиновка", 2), ("Ровное", 3), ("Ольгино", 4), 28, 20, 21, 15, 10, "road"),
    "9C3565": (("Васильевка", 2), ("Шарковка", 3), ("Рассвет", 4), ("Плодородное", 1), 27, 15, 36, 25, 18, "straight"),
    "40ACC2": (("Лягушкино", 4), ("Куровка", 1), ("Марусино", 3), ("Вятское", 2), 15, 6, 8, 25, 15, "road"),
    "A07F51": (("Пирожки", 4), ("Васильево", 1), ("Рябиновка", 3), ("Княжеское", 2), 30, 12, 16, 60, 40, "straight"),
}
# Таня: посчитано вручную. Шоссе: Антоновка — 8 — Егорка — 4 — Доломино —
# 8 — Ванютино (поворот), вниз Жилино 9, Горюново 15, Богданово 21;
# прямые: Е–Ж 15, Д–Г 17, А–Г 25, А–Б 29; 50 км/ч по шоссе, 30 — по просёлку
TANYA = {
    "EABF12": "4625", "1DAE55": "2435", "D7DA06": "7632", "40373A": "7425",
    "E30C8F": 8, "093985": 8, "ACE7E1": 6, "1DD53B": 21,
    "B8F7D9": 15, "BD19A3": 17, "95B15C": 25, "14EF59": 29,
    "FCA4C5": 57.2,   # 25 : 30 ч = 50 мин + 6 : 50 ч = 7,2 мин
    "44E538": 55.6,   # шоссе 12 + 6 = 18 км — 21,6 мин, просёлок 17 км — 34 мин
    "211095": 54,     # шоссе 8 + 12 = 20 км — 24 мин, просёлок 15 км — 30 мин
    "C23492": 58,     # 29 : 30 ч
    "DAD553": 9.2,    # 41 · 6,8 = 18 · 6,8 + 17x
    "D02C75": 8.2,    # 41 · 5,8 = 29x
    "3DE30E": 9.1,    # 41 · 6,5 = 6 · 6,5 + 25x
    "339932": 7.7,    # 41 · 5,5 = 20 · 5,5 + 15x
}


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
    results.append((name, bool(ok)))
    print(f"[{'OK' if ok else 'FAIL'}] {name}" + (f": {extra}" if extra and not ok else ""))


def load_bank():
    src = open(os.path.join(HERE, "oge1_5-fipi-bank.js"), encoding="utf-8").read()
    body = src[src.index("window.OGE1_5_FIPI = ") + len("window.OGE1_5_FIPI = "):].rstrip().rstrip(";")
    return json.loads(body)


def text_of(h):
    return re.sub(r"\s+", " ", H.unescape(re.sub(r"<[^>]+>", " ", h))).strip()


def shop_answer(prompt):
    """Цены — из таблицы условия (html), набор — из фразы «хотят купить»."""
    rows = [[text_of(c) for c in re.findall(r"<td>(.*?)</td>", r, re.S)] for r in re.findall(r"<tr>(.*?)</tr>", prompt, re.S)]
    price = {r[0].split()[0]: [int(x) for x in r[1:5]] for r in rows[1:]}
    s = text_of(prompt)
    buy = s[s.index("хотят купить") + 12:s.index(". В каком")]
    keys = {"молок": "Молоко", "хлеб": "Хлеб", "сыр": "Сыр", "говядин": "Говядина", "картоф": "Картофель"}
    cost = [Fr(0)] * 4
    found = 0
    for q, what in re.findall(r"(\d+(?:,\d+)?)?\s*(?:л|кг|батона|батонов|батон)\s+(молока|хлеба|сыра|говядины|картофеля)", buy):
        k = next(v for kk, v in keys.items() if what.startswith(kk))
        qq = Fr(q.replace(",", ".")) if q else Fr(1)
        cost = [cost[i] + qq * price[k][i] for i in range(4)]
        found += 1
    assert found == 3, buy
    return float(min(cost))


def trip_expect(tasks, p):
    (A, a), (B, b), (C, c), (D, d), AC, BC, CD, v1, v2, k7 = p
    num = {A: a, B: b, C: c, D: d}
    AD, BD = math.hypot(AC, CD), math.hypot(BC, CD)
    exp = []
    for i, t in enumerate(tasks):
        k = i + 1
        if k in (1, 2):
            names = re.findall(r"(?:д|с)\. (\S+?)</td>", t["prompt"])
            exp.append(int("".join(str(num[n]) for n in names)))
        elif k == 3:
            exp.append(AC + CD)
        elif k == 4:
            exp.append(BC + CD)
        elif k == 5:
            exp.append(AD)
        elif k == 6:
            exp.append(BD)
        elif k == 7:
            exp.append(AD / v2 * 60 if k7 == "straight" else (AC + CD) / v1 * 60)
        elif k == 8:
            exp.append((AC - BC) / v1 * 60 + BD / v2 * 60)
        else:
            exp.append(shop_answer(t["prompt"]))
    return exp


def test_bank(bank):
    trip = [t for t in bank["tasks"] if t["plot"] == "trip"]
    plan = [t for t in bank["tasks"] if t["plot"] == "plan"]
    ids = [t["fipi"] for t in trip + plan]
    check("банк: 100 заданий поездки и 20 Тани, номера уникальны", len(trip) == 100 and len(plan) == 20 and len(set(ids)) == 120, f"{len(trip)} {len(plan)}")
    vs = sorted({t["v"] for t in trip})
    per = {v: [t["n"] for t in trip if t["v"] == v] for v in vs}
    check("банк: 10 текстов поездки, в каждом по 2 задания на номер 1–5",
          len(vs) == 10 and all(sorted(x) == [1, 1, 2, 2, 3, 3, 4, 4, 5, 5] for x in per.values()), str(per)[:200])
    check("банк: у Тани по 4 задания на номер", sorted(t["n"] for t in plan) == sorted([1, 2, 3, 4, 5] * 4))
    bad = []
    for v in vs:
        ts = [t for t in trip if t["v"] == v]
        key = ts[0]["fipi"]
        if key not in TRIPS:
            bad.append(("нет текста", key))
            continue
        for t, e in zip(ts, trip_expect(ts, TRIPS[key])):
            if abs(t["ans"] - e) > 1e-9:
                bad.append((t["fipi"], t["ans"], e))
    check("банк: ответ каждого задания поездки совпал с посчитанным здесь", not bad, str(bad[:4]))
    bad = [(t["fipi"], t["ans"]) for t in plan if abs(t["ans"] - float(TANYA[t["fipi"]])) > 1e-9]
    check("банк: ответ каждого задания Тани совпал с посчитанным вручную", not bad, str(bad[:4]))
    pv = bank["plots"]["trip"]["vars"]
    imgs = [re.findall(r'src="(oge1_5-fipi/[^"]+)"', x["theory"]) for x in pv] + [re.findall(r'src="(oge1_5-fipi/[^"]+)"', bank["plots"]["plan"]["theory"])]
    check("банк: у каждого текста поездки и у Тани — план-рисунок", all(len(x) == 1 for x in imgs), str(imgs)[:200])
    miss = [x[0] for x in imgs if not os.path.exists(os.path.join(HERE, x[0]))]
    check("банк: все планы лежат в oge1_5-fipi/", not miss, str(miss))
    junk = [t["fipi"] for t in trip + plan if re.search(r"MsoNormal|<m:|&nbsp;|<script", t["prompt"])]
    check("банк: условие вычищено", not junk, str(junk[:3]))
    first_line = [t["fipi"] for t in trip + plan if not t["sol"] or not any(ch.isdigit() for ch in " ".join(t["sol"]))]
    check("банк: у каждого задания решение по шагам", not first_line, str(first_line[:3]))


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


def theory_img(page):
    page.wait_for_timeout(300)
    return page.evaluate("""() => { const i = document.querySelector('#theoryContent img.fipi-fig');
        return i ? [i.getAttribute('src'), i.naturalWidth] : null; }""")


def test_page(browser, bank):
    by = {t["fipi"]: t for t in bank["tasks"]}
    unverified = not all(t.get("checked") for t in bank["tasks"] if t["plot"] in ("trip", "plan"))
    ctx, page, errors = new_page(browser, f"{BASE}/oge1_5.html")
    titles = page.eval_on_selector_all('#modesGrid .group-title', 'es => es.map(e => e.textContent.trim())')
    if unverified:
        check("без ?all=1: «План местности» — «скоро» (ответы не сверены)",
              "🗺️ План местности" in titles and not page.query_selector('.mode-card[data-id="trip_fipi"]'), str(titles))
    check("без ?all=1: без ошибок JS", not errors, str(errors[:1]))
    ctx.close()

    ctx, page, errors = new_page(browser, f"{BASE}/oge1_5.html?all=1")
    titles = page.eval_on_selector_all('#modesGrid .group-title', 'es => es.map(e => e.textContent.trim())')
    check("?all=1: одна плашка «План местности» с поездкой и Таней",
          titles.count("🗺️ План местности") == 1 and page.query_selector('.mode-card[data-id="trip_fipi"]')
          and page.query_selector('.mode-card[data-id="plan_fipi"]'), str(titles))
    page.click('.mode-card[data-id="trip_fipi"]'); page.wait_for_timeout(400)
    nav = page.evaluate("curTasksetRef.tasks.map(t => t.id)")
    check("поездка: задания 1–5", nav == [f"tripfipi_t{i}" for i in range(1, 6)], str(nav))
    page.click('#theoryToggleBtn')
    img1 = theory_img(page)
    check("поездка: в теории план, картинка загрузилась", img1 and img1[1] > 0, str(img1))
    v0 = page.evaluate("curPlotVar.trip")
    vs_seen = set()
    for i in range(1, 6):
        page.evaluate(f"setCurMode('tripfipi_t{i}'); openTask()"); page.wait_for_timeout(200)
        t = by[SRC_RE.match(src(page)).group(1)]
        vs_seen.add(t["v"])
        if i == 1:
            answer(page, "999")
            check("поездка: неверный ответ — ошибка", page.evaluate("totalErrors") >= 1)
        answer(page, fmt(t["ans"]) if t["kind"] != "match" else str(int(t["ans"])))
        check(f"поездка, задание {i}: верный ответ засчитан, есть разбор",
              page.evaluate("taskAnswered") and "Ответ" in page.inner_text('#explainBox'), t["fipi"])
    check("поездка: все 5 заданий — из открытого текста", vs_seen == {v0}, str(vs_seen))
    st = page.evaluate("window.__trainerState.get()")
    check("снимок сессии: открытый текст поездки в снимке", st.get("plotVar", {}).get("trip") == v0, str(st.get("plotVar")))
    page.click('#newTireBtn'); page.wait_for_timeout(400)
    btn = page.inner_text('#newTireBtn')
    v1 = page.evaluate("curPlotVar.trip")
    img2 = theory_img(page)
    t = by[SRC_RE.match(src(page)).group(1)]
    check("«🔄 Другой текст ФИПИ»: другой текст, другой план, задание 1 из него",
          "Другой текст" in btn and v1 != v0 and img2 and img2[0] != img1[0] and t["v"] == v1 and t["n"] == 1, f"{btn} {v0}->{v1} {img2}")
    check("поездка: без ошибок JS", not errors, str(errors[:1]))
    ctx.close()

    ctx, page, errors = new_page(browser, f"{BASE}/oge1_5.html?all=1")
    page.evaluate("(s) => window.__trainerState.apply(s)", st)
    page.wait_for_timeout(500)
    check("сессия: у собеседника тот же текст поездки и то же задание",
          page.evaluate("curPlotVar.trip") == v0 and page.evaluate("curTask && curTask.prompt") == st["curTask"]["prompt"]
          and img1[0] in page.evaluate("document.getElementById('theoryContent').innerHTML"))
    ctx.close()

    # кадр карточки «+»: теории нет — текст с планом в самом условии
    ctx, page, errors = new_page(browser, f"{BASE}/oge1_5.html?all=1&card=1")
    pr = page.evaluate("plotFipiTask('trip', 3).prompt")
    check("кадр карточки: у задания поездки в условии текст и план", "fipi-ctx" in pr and 'img class="fipi-fig"' in pr and "по прямой" in pr, pr[:150])
    ctx.close()

    ctx, page, errors = new_page(browser, f"{BASE}/oge1_5.html?all=1")
    page.click('.mode-card[data-id="plan_fipi"]'); page.wait_for_timeout(400)
    page.click('#theoryToggleBtn')
    img = theory_img(page)
    check("Таня: план в теории загрузился, кнопки «другой текст» нет",
          img and img[1] > 0 and not page.is_visible('#newTireBtn'), str(img))
    for i in (1, 4, 5):
        page.evaluate(f"setCurMode('planfipi_t{i}'); openTask()"); page.wait_for_timeout(200)
        t = by[SRC_RE.match(src(page)).group(1)]
        answer(page, str(TANYA[t["fipi"]]).replace(".", ","))
        check(f"Таня, задание {i}: засчитано", page.evaluate("taskAnswered"), t["fipi"])
    check("Таня: без ошибок JS", not errors, str(errors[:1]))
    ctx.close()

    ctx, page, errors = new_page(browser, f"{BASE}/oge1_5.html?all=1", width=375)
    page.click('.mode-card[data-id="trip_fipi"]'); page.wait_for_timeout(300)
    page.click('#theoryToggleBtn'); page.wait_for_timeout(300)
    for i in (1, 5):
        page.evaluate(f"setCurMode('tripfipi_t{i}'); openTask()"); page.wait_for_timeout(200)
        page.click('#theoryToggleBtn'); page.wait_for_timeout(200)
        w = page.evaluate("() => document.documentElement.scrollWidth")
        check(f"телефон 375 px: поездка, задание {i} (план, таблица) без прокрутки вбок", w <= 375, str(w))
    ctx.close()


CODEX = {"flat": (40, 8, "🏠 Квартира"), "plot_sosnovka": (20, 4, "🏡 Участок"), "plot_avdeevo": (10, 2, "🏡 Участок"),
         "plot_pribor": (10, 2, "🏡 Участок"), "tariff": (30, 6, "📱 Тарифы")}


def test_codex(browser, bank):
    for plot, (total, per, group) in CODEX.items():
        ts = [t for t in bank["tasks"] if t["plot"] == plot]
        check(f"банк {plot}: {total} заданий, по {per} на номер, все сверены ФИПИ",
              len(ts) == total and all(sum(1 for t in ts if t["n"] == n) == per for n in range(1, 6))
              and all(t["checked"] for t in ts), str(len(ts)))
        img = re.findall(r'src="(oge1_5-fipi/[^"]+)"', bank["plots"][plot]["theory"])
        check(f"банк {plot}: рисунок сюжета на месте", len(img) == 1 and os.path.exists(os.path.join(HERE, img[0])), str(img))
        short = [t["fipi"] for t in ts if len(t["sol"]) < 3]
        check(f"банк {plot}: разбор по шагам (не короче 3 строк)", not short, str(short[:3]))
    ctx, page, errors = new_page(browser, f"{BASE}/oge1_5.html")
    titles = page.eval_on_selector_all('#modesGrid .group-title', 'es => es.map(e => e.textContent.trim())')
    soon = page.evaluate("SOON_THEMES")
    check("без ?all=1: квартира и участок открыты, не «скоро»; тарифы ФИПИ — в «📱 Тарифы»",
          "🏠 Квартира" not in soon and "🏡 Участок" not in soon and titles.count("📱 Тарифы") == 1
          and all(page.query_selector(f'.mode-card[data-id="{p}_fipi"]') for p in CODEX), f"{titles} {soon}")
    by = {t["fipi"]: t for t in bank["tasks"]}
    for plot in CODEX:
        page.evaluate("showPicker ? showPicker() : null") if page.evaluate("typeof showPicker === 'function'") else None
        page.wait_for_timeout(200)
        page.click(f'.mode-card[data-id="{plot}_fipi"]'); page.wait_for_timeout(300)
        page.click('#theoryToggleBtn')
        img = theory_img(page)
        page.evaluate(f"setCurMode('{plot}fipi_t3'); openTask()"); page.wait_for_timeout(200)
        t = by[SRC_RE.match(src(page)).group(1)]
        answer(page, fmt(t["ans"]) if t["kind"] != "match" else str(int(t["ans"])))
        check(f"{plot}: план в теории загрузился, задание 3 засчитано, разбор показан",
              img and img[1] > 0 and page.evaluate("taskAnswered") and len(page.inner_text('#explainBox')) > 80, f"{img} {t['fipi']}")
        page.click('#backBtn'); page.wait_for_timeout(200)
    check("квартира, участки, тарифы: без ошибок JS", not errors, str(errors[:1]))
    ctx.close()


def main():
    bank = load_bank()
    test_bank(bank)
    with local_server(), sync_playwright() as p:
        browser = p.chromium.launch()
        test_page(browser, bank)
        test_codex(browser, bank)
        browser.close()
    ok = sum(1 for _, x in results if x)
    print(f"\n{ok}/{len(results)} проверок прошло")
    sys.exit(0 if ok == len(results) else 1)


if __name__ == "__main__":
    main()
