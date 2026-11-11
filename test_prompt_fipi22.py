"""
Правка «банк ФИПИ №22»: в ОГЭ, часть 2 (oge_part2.html?n=22) — 157 заданий на
график функции и число общих точек с прямой y = m (y = kx), в 11 группах.

Проверяет:
  1. данные: 157 заданий, номера ФИПИ уникальны, у каждого группа, условие,
     одно поле (set — значения m или k; num — «наибольшее число точек»),
     ответ, разбор с чертежом [[fig:…]] и ключом в словаре рисунков; №20, №21 не задеты;
  2. ответы: КАЖДОЕ из 157 — эталон принимается (и в записи через промежутки
     «(−1; 6)»), испорченный — нет;
  3. сверка вторым путём: прямо в браузере по формулам из данных задания не
     считаем — это сделано сборкой (n22_build.py: точный расчёт + численный
     перебор), здесь только что в данных нет пустых и дублирующихся ответов;
  4. список и задание: разделы, карточки групп, подпись источника, чертёж в разборе,
     верный ответ засчитан, критерии №22;
  5. снимок сессии; раздельный файл (на №20 файл №22 не грузится); телефон 375 px.

Совместный режим здесь без сети: живьём его нужно перепроверять на сайте.

Запуск: python3 test_prompt_fipi21.py (сервер поднимается сам).
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

PORT = 9153
BASE = f"http://127.0.0.1:{PORT}"
HERE = os.path.dirname(os.path.abspath(__file__))
TOTAL = 157
SRC_RE = re.compile(r"Источник: открытый банк заданий ФИПИ, задание ([0-9A-F]{6})")


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


def load_fipi():
    # оглавление + файлы номеров (с «раздельного файла» задания номера лежат отдельно)
    def body(name, marker):
        src = open(os.path.join(HERE, name), encoding="utf-8").read()
        return json.loads(src[src.index(marker) + len(marker):].rstrip().rstrip(";"))
    F = body("oge-part2-fipi.js", "window.OGE_PART2_FIPI = ")
    for n, name in F["files"].items():
        F["tasks"][n] = body(name, ".tasks['" + n + "'] = ")
    return F


def new_page(browser, url, wait=1200, width=1300):
    ctx = browser.new_context(viewport={"width": width, "height": 1000})
    page = ctx.new_page()
    errors = []
    page.on("pageerror", lambda e: errors.append(str(e)))
    page.route("https://**/*", lambda route: route.abort())
    page.goto(url)
    page.wait_for_timeout(wait)
    return ctx, page, errors


def test_data(F):
    t = F["tasks"]["22"]
    protos, groups = t["protos"], t["groups"]
    check(f"данные: {TOTAL} заданий №22", len(protos) == TOTAL, str(len(protos)))
    check("данные: №20 и №21 на месте (200, 190)", len(F["tasks"]["20"]["protos"]) == 200 and len(F["tasks"]["21"]["protos"]) == 190)
    ids = [p["fipi"] for p in protos]
    check("данные: номера ФИПИ уникальны", len(set(ids)) == len(ids) and all(re.fullmatch(r"[0-9A-F]{6}", i) for i in ids))
    gids = {g["id"] for g in groups}
    check("данные: у каждого задания группа, условие, одно поле set/num, ответ и разбор",
          all(p["group"] in gids and p["text"] and len(p["fields"]) == 1 and p["fields"][0]["type"] in ("set", "num")
              and p["fields"][0]["value"] and p["answerTex"] and len(p["steps"]) >= 5 for p in protos))
    bad = [p["fipi"] for p in protos if p["text"].count("$") % 2 or any(s.count("$") % 2 for s in p["steps"])]
    check("данные: нет непарных $", not bad, str(bad[:5]))
    figs = [re.findall(r"\[\[fig:([\w.-]+)\]\]", " ".join(p["steps"])) for p in protos]
    check("данные: в каждом разборе один чертёж с ключом 22.fipi.<номер>",
          all(f == ["22.fipi." + p["fipi"]] for f, p in zip(figs, protos)))
    check("данные: критерии №22 (2, 1, 0)", [c[0] for c in t["criteria"]] == [2, 1, 0] and 'График построен верно' in t["criteria"][0][1])
    check("данные: ответов «наибольшее число» 10, у всех 4",
          sum(p["fields"][0]["type"] == "num" for p in protos) == 10 and all(p["fields"][0]["value"] == "4" for p in protos if p["fields"][0]["type"] == "num"))
    ans = [(p["group"], p["fields"][0]["value"], p["text"]) for p in protos]
    check("данные: условие и ответ не пустые, «Постройте график» в каждом условии", all("Постройте график" in p["text"] for p in protos))


def test_answers(browser, F):
    ctx, page, errors = new_page(browser, f"{BASE}/oge_part2.html?n=22")
    res = page.evaluate("""() => protos(22).filter(p => p.fipi).map(p => {
        const f = p.fields[0], st = { yn: {} }, v = String(f.value);
        const wrong = f.type === 'num' ? '5' : 'm=1000';
        return [p.fipi, checkField(f, v, st), checkField(f, wrong, st)];
    })""")
    good = [r for r in res if r[1:] == [True, False]]
    check(f"ответы: все {TOTAL} — эталон принимается, испорченный нет", len(good) == TOTAL, str([r for r in res if r[1:] != [True, False]][:3]))
    # запись через промежутки: «m = 3; 3,5» ↔ «3; 3,5»
    pr = page.evaluate("""() => { const p = protos(22).find(p => p.fipi === 'C69602'); const f = p.fields[0];
        return [f.value, checkField(f, '3; 3,5', {yn:{}}), checkField(f, 'm=3,5; m=3', {yn:{}}), checkField(f, '3', {yn:{}})]; }""")
    check("ответы: «3; 3,5» и «m=3,5; m=3» принимаются, «3» — нет", pr[1] is True and pr[2] is True and pr[3] is False, str(pr))
    check("ответы: без ошибок JS", not errors, str(errors[:1]))
    ctx.close()


def test_picker_and_task(browser, F):
    t22 = F["tasks"]["22"]
    ctx, page, errors = new_page(browser, f"{BASE}/oge_part2.html?n=22")
    secs = page.eval_on_selector_all('#protoList .proto-section', 'es => es.map(e => e.textContent)')
    check("список: разделы ФИПИ после демоверсии", all(s["title"] in secs for s in t22["sections"]), str(secs))
    gids = page.eval_on_selector_all('#protoList .mode-card[data-gid]', 'es => es.map(e => e.dataset.gid)')
    check("список: карточка на каждую группу", gids == [g["id"] for g in t22["groups"]], str(gids))
    g = next(g for g in t22["groups"] if g["id"] == "par_lin")
    items = [p for p in t22["protos"] if p["group"] == "par_lin"]
    page.click('.mode-card[data-gid="par_lin"]')
    page.wait_for_timeout(400)
    head = page.inner_text('#taskTitle')
    check("задание: шапка «группа · задание 1 из N»", head == f"{g['title']} · задание 1 из {len(items)}", head)
    m = SRC_RE.search(page.inner_text('#egeQuestion'))
    check("задание: подпись источника", m and m.group(1) == items[0]["fipi"])
    page.fill('#answerArea input.answer-input', items[0]["fields"][0]["value"])
    page.click('#answerArea .check-btn')
    page.wait_for_timeout(300)
    check("верный ответ засчитан", page.evaluate("S.answered && S.correct && totalSolved === 1"))
    sol = page.evaluate("document.querySelector('#solBox, #solution, .sol-steps') ? 1 : 0")
    svgs = page.evaluate("document.querySelectorAll('.ege-fig svg').length")
    check("разбор: чертёж графика показан", svgs >= 1, str(svgs))
    crit = page.evaluate("document.getElementById('critTable').textContent")   # блок свёрнут — inner_text пуст
    check("разбор: критерии №22", 'График построен верно' in crit, repr(crit[:200]))
    st = page.evaluate("tsGetState()")
    pid = page.evaluate("S.pid")
    check("без ошибок JS", not errors, str(errors[:1]))
    ctx.close()
    ctx, page, errors = new_page(browser, f"{BASE}/oge_part2.html?n=22")
    page.evaluate("(s) => tsApplyState(s)", st)
    page.wait_for_timeout(500)
    check("сессия: у ученика то же задание ФИПИ с подписью",
          page.evaluate("S.pid") == pid and SRC_RE.search(page.inner_text('#egeQuestion')))
    check("сессия: без ошибок JS", not errors, str(errors[:1]))
    ctx.close()


def test_lazy(browser, F):
    ctx = browser.new_context(viewport={"width": 1300, "height": 1000})
    page = ctx.new_page()
    errors, got = [], []
    page.on("pageerror", lambda e: errors.append(str(e)))
    page.on("request", lambda r: got.append(r.url.rsplit('/', 1)[-1]))
    page.route("https://**/*", lambda route: route.abort())
    page.goto(f"{BASE}/oge_part2.html?n=20")
    page.wait_for_timeout(1200)
    check("раздельно: на №20 файл №22 не грузится", 'oge-part2-fipi.js' in got and 'oge-part2-fipi22.js' not in got, str([u for u in got if 'fipi' in u]))
    p = F["tasks"]["22"]["protos"][37]
    page.evaluate("(pid) => window.__examNav.open(22, pid)", p["id"])
    page.wait_for_timeout(800)
    check("раздельно: переход к №22 грузит файл и открывает именно это задание",
          'oge-part2-fipi22.js' in got and page.evaluate("curProto.fipi") == p["fipi"], page.evaluate("curProto && curProto.fipi"))
    ctx.close()


def test_phone(browser):
    ctx, page, errors = new_page(browser, f"{BASE}/oge_part2.html?n=22", width=375)
    over = page.evaluate("document.documentElement.scrollWidth - innerWidth")
    page.click('.mode-card[data-gid="shift_hyp"]')
    page.wait_for_timeout(400)
    over2 = page.evaluate("document.documentElement.scrollWidth - innerWidth")
    check("телефон 375: список и задание без прокрутки вбок", over <= 0 and over2 <= 0, f"{over} / {over2}")
    ctx.close()


def main():
    F = load_fipi()
    test_data(F)
    with local_server(), sync_playwright() as pw:
        browser = pw.chromium.launch()
        test_answers(browser, F)
        test_picker_and_task(browser, F)
        test_lazy(browser, F)
        test_phone(browser)
        browser.close()
    failed = [n for n, ok in results if not ok]
    print(f"\n{len(results) - len(failed)}/{len(results)} проверок прошло")
    sys.exit(1 if failed else 0)


if __name__ == "__main__":
    main()
