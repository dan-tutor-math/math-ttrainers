"""
Правка «банк ФИПИ №1–5»: в oge1_5 — сюжет «Шины» из открытого банка ФИПИ
(20 текстов, 99 заданий) группой «Шины · задания ФИПИ», и починка заводской
шины «Шины 1» в снимке задания.

Проверяет:
  1. данные банка (oge1_5-fipi-bank.js): 99 заданий, 20 текстов, номера
     уникальны; ответ каждого пересчитан здесь заново по числам (Fraction):
     ширина по таблице, высота боковины, диаметр, разность диаметров,
     пробег в процентах с округлением до десятых;
  2. страница строит каждое задание банка (build_tire_*): тот же ответ, числа
     ФИПИ в условии, решение столбиком, дроби вертикально, без «/100»;
     генераторы «Шины 1» (по 100 заданий) — ответ в решении совпадает с
     проверяемым;
  3. экран выбора: «Шины · задания ФИПИ — 20 текстов ФИПИ»; без ?all=1, пока
     ответы не сверены сайтом ФИПИ, группы у ученика нет;
  4. группа: теория — по заводской шине открытого текста, задания 3–5 считаны
     от неё же и называют её в условии; подпись источника; неверный ответ —
     ошибка, верный с запятой засчитан; «Следующий пример» — следующее задание
     того же текста; ⟳ — то же задание другого текста (теория меняется);
     «Другой текст ФИПИ» — с задания 1; тексты не повторяются, пока не
     пройдены все;
  5. заводская шина «Шины 1»: в снимке задания, кадр карточки «+» считает
     задание 3 от той же шины, что у основной страницы (раньше — от
     случайной), собеседник получает ту же теорию; без снимка — шина из
     памяти вкладки;
  6. телефон 375 px.

Совместный режим здесь без сети: живьём (вебсокет к Supabase) его нужно
перепроверять на сайте руками.

Запуск: python3 test_prompt_fipi1_5.py (сервер поднимается сам).
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

PORT = 9139
BASE = f"http://127.0.0.1:{PORT}"
HERE = os.path.dirname(os.path.abspath(__file__))
SRC_RE = re.compile(r"^Источник: открытый банк заданий ФИПИ, задание ([0-9A-Za-z]{6})")
INCH = F(254, 10)


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


def D(w, p, r):
    return 2 * F(w * p, 100) + r * INCH


def value(v, t):
    """Ответ задания — своими формулами, не теми, что у страницы."""
    a, fac = t["args"], v["factory"]
    if t["kind"] == "width":
        tab = v["table"]
        ok = [w for w in tab["widths"] if tab["cells"].get(f"{w},{a[0]}")]
        return F(max(ok) if a[1] else min(ok))
    if t["kind"] == "side":
        return F(a[0] * a[1], 100)
    if t["kind"] == "diam":
        return D(*fac)
    d1, d2 = D(*fac), D(*a[:3])
    if (d2 > d1) != bool(a[3]):
        return None
    if t["kind"] == "ddiam":
        return abs(d2 - d1)
    x = abs(d2 - d1) / d1 * 1000
    return F(int(x + F(1, 2)), 10)


def test_bank_data(bank):
    tasks, tires = bank["tasks"], bank["plots"]["tire"]
    check("банк: 99 заданий, 20 текстов, номера ФИПИ уникальны",
          len(tasks) == 99 and len(tires) == 20 and len({t["fipi"] for t in tasks}) == 99)
    kinds = {k: sum(t["kind"] == k for t in tasks) for k in ("width", "side", "diam", "ddiam", "run")}
    check("банк: задания 1–5 по видам (в одном тексте нет задания 4)",
          kinds == {"width": 20, "side": 20, "diam": 20, "ddiam": 19, "run": 20}, str(kinds))
    vs = {v["v"]: v for v in tires}
    bad = [(t["fipi"], t["ans"]) for t in tasks if value(vs[t["v"]], t) is None
           or abs(float(value(vs[t["v"]], t)) - t["ans"]) > 1e-9]
    check("банк: ответ каждого задания пересчитан по числам", not bad, str(bad[:3]))
    print(f"[--] банк: ответов принято сайтом ФИПИ {sum(t['checked'] for t in tasks)} из {len(tasks)}")


def new_page(browser, url, wait=1200, width=1300, init=None, ctx=None):
    own = ctx is None
    ctx = ctx or browser.new_context(viewport={"width": width, "height": 1000})
    page = ctx.new_page()
    errors = []
    page.on("pageerror", lambda e: errors.append(str(e)))
    page.route("https://**/*", lambda route: route.abort())
    if init:
        page.add_init_script(init)
    page.goto(url)
    page.wait_for_timeout(wait)
    return (ctx if own else None), page, errors


LOOK_JS = """(t) => {
  const d = document.createElement('div'); d.innerHTML = t.explain;
  const lines = [...d.querySelectorAll('.sol-line')].length;
  const txt = d.textContent.replace(/\\s+/g, ' ');
  const ans = (txt.match(/Ответ: ([0-9,−]+)/) || [])[1] || '';
  return { lines, vf: d.querySelectorAll('.vf').length, slash100: /\\/\\s*100|\\)\\s*\\//.test(txt),
           ans, prompt: t.prompt.replace(/<[^>]+>/g, ' '), cv: t.correctValue };
}"""


def fmt(x):
    s = ("%.2f" % x).rstrip("0").rstrip(".")
    return s.replace(".", ",")


def test_builders(browser, bank):
    ctx, page, errors = new_page(browser, f"{BASE}/oge1_5.html?all=1")
    vs = {v["v"]: v for v in bank["plots"]["tire"]}
    bad = []
    for t in bank["tasks"]:
        r = page.evaluate("(t) => tireFipiTaskOf(TIRE_FIPI.find(v => v.v === t.v), t)", t)
        c = page.evaluate(LOOK_JS, r)
        a, fac = t["args"], vs[t["v"]]["factory"]
        need = {"width": a[:1], "side": a[:3], "diam": fac, "ddiam": a[:3] + fac, "run": a[:3] + fac}[t["kind"]]
        if (abs(c["cv"] - t["ans"]) > 1e-9 or c["ans"] != fmt(t["ans"]) or c["slash100"] or c["lines"] < 2
                or not all(str(x) in c["prompt"] for x in need)
                or (t["kind"] != "width" and not c["vf"]) or r.get("fipi") != t["fipi"]):
            bad.append((t["fipi"], t["kind"], c))
    check("страница: каждое задание банка — тот же ответ, числа ФИПИ, решение столбиком, дроби вертикально",
          not bad, str(bad[:2]))
    gbad = []
    for i in range(1, 6):
        for _ in range(100):
            c = page.evaluate(LOOK_JS, page.evaluate(f"() => gen_tire_task{i}()"))
            if c["ans"] != fmt(c["cv"]) or c["slash100"]:
                gbad.append((i, c))
                break
    check("генераторы «Шины 1» через build_tire_*: ответ в решении совпадает с проверяемым", not gbad, str(gbad[:1]))
    check("без ошибок JS", not errors, str(errors[:1]))
    ctx.close()


def src(page):
    return page.inner_text('#sourceNote').strip() if page.is_visible('#sourceNote') else ''


def answer(page, v):
    page.fill('#answerInput', fmt(v))
    page.click('#checkAnswerBtn')
    page.wait_for_timeout(200)


def cur(page):
    return page.evaluate("({ fipi: curTask.fipi, v: curTask.tireVar, cv: curTask.correctValue, mode: curMode,"
                         " theory: document.getElementById('theoryContent').textContent,"
                         " prompt: curTask.prompt.replace(/<[^>]+>/g, ' ') })")


def test_picker(browser):
    ctx, page, errors = new_page(browser, f"{BASE}/oge1_5.html?all=1")
    t = page.inner_text('.mode-card[data-id="tire_fipi"]') if page.query_selector('.mode-card[data-id="tire_fipi"]') else ''
    check("выбор: «Шины · задания ФИПИ — 20 текстов ФИПИ»", "Шины · задания ФИПИ" in t and "20 текстов ФИПИ" in t, t)
    ctx.close()
    bank = load_bank()
    # листы бумаги и баня — свой тест (test_prompt_fipi1_5_more.py), здесь только шины
    bank["tasks"] = [t for t in bank["tasks"] if t["plot"] == "tire"]
    if not all(x["checked"] for x in bank["tasks"]):
        ctx, page, errors = new_page(browser, f"{BASE}/oge1_5.html")
        check("ответы не сверены сайтом ФИПИ — у ученика группы нет", not page.query_selector('.mode-card[data-id="tire_fipi"]'))
        ctx.close()
    hide = """Object.defineProperty(window, 'OGE1_5_FIPI', { configurable: true,
          set(v) { v.tasks.forEach(t => t.checked = t.v !== 0);
                   Object.defineProperty(window, 'OGE1_5_FIPI', { value: v, writable: true }); } });"""
    ctx, page, errors = new_page(browser, f"{BASE}/oge1_5.html", init=hide)
    t = page.inner_text('.mode-card[data-id="tire_fipi"]') if page.query_selector('.mode-card[data-id="tire_fipi"]') else ''
    check("ученик видит только тексты с принятыми ответами: 19 текстов", "19 текстов ФИПИ" in t, t)
    check("без ошибок JS", not errors, str(errors[:1]))
    ctx.close()


def test_flow(browser, bank):
    ctx, page, errors = new_page(browser, f"{BASE}/oge1_5.html?all=1")
    vs = {v["v"]: v for v in bank["plots"]["tire"]}
    by = {t["fipi"]: t for t in bank["tasks"]}
    page.click('.mode-card[data-id="tire_fipi"]'); page.wait_for_timeout(400)
    c = cur(page)
    v = vs[c["v"]]
    mark = "%d/%d R%d" % tuple(v["factory"])
    m = SRC_RE.match(src(page))
    check("группа: задание 1 открытого текста с подписью источника",
          c["mode"] == "tirefipi_t1" and m and by[m.group(1)]["v"] == c["v"] and by[m.group(1)]["kind"] == "width", src(page))
    check("группа: теория — с заводской шиной этого текста",
          ("%d/%d" % tuple(v["factory"][:2])) in c["theory"] and ("R%d" % v["factory"][2]) in c["theory"], c["theory"][-120:])
    answer(page, 1)
    check("ответ: неверный — ошибка", page.evaluate("totalErrors") == 1)
    answer(page, by[c["fipi"]]["ans"])
    check("ответ: верный засчитан", page.evaluate("taskAnswered"))
    page.click('#nextBtn'); page.wait_for_timeout(300)
    c2 = cur(page)
    check("«Следующий пример» — задание 2 того же текста", c2["mode"] == "tirefipi_t2" and c2["v"] == c["v"], str(c2["mode"]))
    page.click('#nextTaskBtn'); page.wait_for_timeout(300)
    c3 = cur(page)
    check("задание 3 — от заводской шины этого текста, она названа в условии",
          c3["v"] == c["v"] and mark in c3["prompt"] and abs(c3["cv"] - by[c3["fipi"]]["ans"]) < 1e-9, c3["prompt"][:80])
    seen = {c["v"]}
    ok_rot = True
    for _ in range(19):
        page.click('#refreshBtn'); page.wait_for_timeout(200)
        x = cur(page)
        vx = vs[x["v"]]
        if x["mode"] != "tirefipi_t3" or x["v"] in seen or ("%d/%d R%d" % tuple(vx["factory"])) not in x["prompt"] \
                or ("%d/%d" % tuple(vx["factory"][:2])) not in x["theory"]:
            ok_rot = False
            break
        seen.add(x["v"])
    check("⟳ — задание 3 другого текста, теория вместе с ним; 20 текстов без повторов", ok_rot and len(seen) == 20, str(len(seen)))
    page.click('#newTireBtn'); page.wait_for_timeout(300)
    x = cur(page)
    check("«Другой текст ФИПИ» — с задания 1", x["mode"] == "tirefipi_t1" and page.inner_text('#newTireBtn').startswith("🔄 Другой текст"),
          x["mode"])
    rich = page.evaluate("window.Basket.extractFromSelectorsRich(['#questionPanel']).text")
    check("подборка: подпись источника уходит вместе с заданием", "Источник: открытый банк заданий ФИПИ" in rich)
    st = page.evaluate("window.__trainerState.get()")
    check("без ошибок JS", not errors, str(errors[:1]))
    ctx.close()

    ctx, page, errors = new_page(browser, f"{BASE}/oge1_5.html?all=1")
    page.evaluate("(s) => window.__trainerState.apply(s)", st)
    page.wait_for_timeout(400)
    y = cur(page)
    vy = vs[st["tireFipiVar"]]
    check("сессия: у ученика то же задание, тот же текст и его теория",
          y["fipi"] == st["curTask"]["fipi"] and ("%d/%d" % tuple(vy["factory"][:2])) in y["theory"], str(y["fipi"]))
    check("сессия: без ошибок JS", not errors, str(errors[:1]))
    ctx.close()


def add_one_card(page):
    page.click("#addRailToggle")
    page.click('.add-qty-btn[data-n="1"]')
    page.wait_for_function("""() => {
        const f = document.querySelector('.tm-card iframe');
        const c = window.__cardsGetState && window.__cardsGetState().__cards;
        try { const s = f && f.contentWindow.__trainerState && f.contentWindow.__trainerState.get();
              return !!(s && s.curTask) && !!(c && c[0] && c[0].state); } catch (e) { return false; }
    }""", timeout=10000)
    for f in page.frames:
        if "card=1" in f.url:
            return f
    return None


def test_factory_tire(browser):
    ctx = browser.new_context(viewport={"width": 1300, "height": 1000})
    _, page, errors = new_page(browser, f"{BASE}/oge1_5.html", ctx=ctx)
    page.click('.mode-card[data-id="tire_set1"]'); page.wait_for_timeout(300)
    page.click('#nextTaskBtn'); page.click('#nextTaskBtn'); page.wait_for_timeout(300)
    main = page.evaluate("({ ft: curFactoryTire, cv: curTask.correctValue, mode: curMode })")
    st = page.evaluate("window.__trainerState.get()")
    check("«Шина 1»: заводская шина в снимке задания", st.get("factoryTire") == main["ft"] and main["mode"] == "tire1_t3", str(st.get("factoryTire")))
    # другая шина в памяти вкладки у кадра — раньше кадр брал случайную; теперь он берёт шину из снимка
    other = {"width": 175, "profile": 70, "rim": 13} if main["ft"]["width"] != 175 else {"width": 215, "profile": 55, "rim": 17}
    frame = add_one_card(page)
    fc = frame.evaluate("({ ft: curFactoryTire, cv: curTask.correctValue, p: curTask.prompt })")
    check("карточка «+» у задания 3 — от той же шины, тот же ответ, что у основного",
          fc["ft"] == main["ft"] and abs(fc["cv"] - main["cv"]) < 1e-9, f"{fc['ft']} / {main['ft']}")
    page.evaluate("(t) => { curFactoryTire = null; localStorage.setItem('ogeProg:oge1_5:factoryTire', JSON.stringify(t)); }", other)
    cv = page.evaluate("gen_tire_task3().correctValue")
    want = float(D(other["width"], other["profile"], other["rim"]))
    check("без снимка — шина из памяти вкладки, а не случайная", abs(cv - want) < 1e-9, f"{cv} / {want}")
    check("без ошибок JS", not errors, str(errors[:1]))
    ctx.close()

    ctx, peer, errors = new_page(browser, f"{BASE}/oge1_5.html")
    peer.evaluate("(s) => window.__trainerState.apply(s)", st)
    peer.wait_for_timeout(400)
    th = peer.evaluate("document.getElementById('theoryContent').textContent")
    ft = st["factoryTire"]
    check("собеседник: теория «Шины 1» с шиной учителя",
          ("%d/%d" % (ft["width"], ft["profile"])) in th and peer.evaluate("curFactoryTire.width") == ft["width"], th[-100:])
    check("собеседник: без ошибок JS", not errors, str(errors[:1]))
    ctx.close()


def test_fipi_card(browser, bank):
    vs = {v["v"]: v for v in bank["plots"]["tire"]}
    ctx, page, errors = new_page(browser, f"{BASE}/oge1_5.html?all=1")
    page.click('.mode-card[data-id="tire_fipi"]'); page.wait_for_timeout(300)
    page.click('#nextTaskBtn'); page.click('#nextTaskBtn'); page.wait_for_timeout(300)
    main = cur(page)
    frame = add_one_card(page)
    fc = frame.evaluate("({ fipi: curTask.fipi, v: curTask.tireVar, mode: curMode, p: curTask.prompt.replace(/<[^>]+>/g, ' '),"
                        " note: document.getElementById('sourceNote').textContent })")
    vf = vs[fc["v"]]
    check("«Шины · ФИПИ», «+» у задания 3 — задание 3 другого текста, его заводская шина в условии, с подписью",
          fc["mode"] == "tirefipi_t3" and fc["fipi"] != main["fipi"] and fc["v"] != main["v"]
          and ("%d/%d R%d" % tuple(vf["factory"])) in fc["p"] and fc["fipi"] in fc["note"], str(fc)[:200])
    check("без ошибок JS", not errors, str(errors[:1]))
    ctx.close()


def test_phone(browser):
    ctx, page, errors = new_page(browser, f"{BASE}/oge1_5.html?all=1", width=375)
    page.click('.mode-card[data-id="tire_fipi"]'); page.wait_for_timeout(300)
    page.click('#tabPractice'); page.wait_for_timeout(150)
    page.click('#showSolutionBtn'); page.wait_for_timeout(150)
    w = page.evaluate("() => document.documentElement.scrollWidth")
    check("телефон 375 px: задание с таблицей и разбор без прокрутки вбок", w <= 375, str(w))
    ctx.close()


def main():
    bank = load_bank()
    bank["tasks"] = [t for t in bank["tasks"] if t["plot"] == "tire"]
    test_bank_data(bank)
    with local_server(), sync_playwright() as pw:
        browser = pw.chromium.launch()
        test_builders(browser, bank)
        test_picker(browser)
        test_flow(browser, bank)
        test_factory_tire(browser)
        test_fipi_card(browser, bank)
        test_phone(browser)
        browser.close()
    failed = [n for n, ok in results if not ok]
    print(f"\n{len(results) - len(failed)}/{len(results)} проверок прошло")
    sys.exit(1 if failed else 0)


if __name__ == "__main__":
    main()
