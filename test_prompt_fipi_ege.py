"""
Правка «банк ФИПИ ЕГЭ профиль»: в ЕГЭ профиль (ege_prof.html) — задания первой
части из открытого банка ФИПИ (ege.fipi.ru) без чертежей: №2 (векторы в
координатах), №4, №5 (вероятность), №7 (уравнения), №8 (вычисления), №10
(прикладные), №11 (текстовые) — номера ЕГЭ-2027. Механика страницы та же, что у
ОГЭ ч. 2 (test_prompt_fipi20.py / fipi21): оглавление ege-prof-fipi.js и файл на
номер, грузится по требованию.

Проверяет:
  1. данные: числа заданий по номерам, номера ФИПИ уникальны (с учётом строчных
     букв), у каждого группа из списка, условие, ответ, решение; непарных $ нет;
  2. формулы: КАЖДОЕ условие, идея группы и шаг решения — KaTeX без ошибок
     (throwOnError), ни одной неподставленной картинки «⟦»;
  3. ответы: КАЖДЫЙ эталон принимается полем части 1, испорченный — нет;
  4. список и задание (№5): демоверсия первой, разделы, карточки групп, шапка
     «группа · задание 1 из N», подпись источника с номером из строчных букв,
     ◀ ▶ внутри группы, верный ответ засчитан, решение открывается;
  5. снимок совместной сессии у ученика открывает то же задание;
  6. раздельный файл: на №1 файлы номеров не грузятся; стрелка к №8 с
     запомненным заданием грузит файл и открывает именно его;
  7. номера с чертежами (№1, №3, №9, №12) не задеты: только демоверсия;
  8. телефон 375 px — без прокрутки вбок.

Совместный режим здесь без сети: живьём его нужно перепроверять на сайте.

Запуск: python3 test_prompt_fipi_ege.py (сервер поднимается сам).
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

PORT = 9161
BASE = f"http://127.0.0.1:{PORT}"
HERE = os.path.dirname(os.path.abspath(__file__))
COUNTS = {"2": 26, "4": 60, "5": 50, "7": 54, "8": 60, "10": 58, "11": 62}
SRC_RE = re.compile(r"Источник: открытый банк заданий ФИПИ, задание ([0-9A-Za-z]{6})")


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
    def body(name, marker):
        src = open(os.path.join(HERE, name), encoding="utf-8").read()
        return json.loads(src[src.index(marker) + len(marker):].rstrip().rstrip(";"))
    F = body("ege-prof-fipi.js", "window.EGE_PROF_FIPI = ")
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
    check("данные: номера с файлами — 2, 4, 5, 7, 8, 10, 11", sorted(F["files"], key=int) == sorted(COUNTS, key=int), str(F["files"]))
    for n, cnt in COUNTS.items():
        t = F["tasks"][n]
        ps = t["protos"]
        gids = {g["id"] for g in t["groups"]}
        sids = {s["id"] for s in t["sections"]}
        check(f"данные №{n}: {cnt} заданий", len(ps) == cnt, str(len(ps)))
        check(f"данные №{n}: у каждого группа, условие, ответ, решение; группы в разделах",
              all(p["group"] in gids and p["text"] and p["answer"] and p["steps"] and p["id"] == f"{n}.fipi.{p['fipi']}" for p in ps)
              and all(g["section"] in sids and g["hint"] for g in t["groups"]))
        bad = [p["fipi"] for p in ps if p["text"].count("$") % 2 or any(s.count("$") % 2 for s in p["steps"]) or "⟦" in p["text"]
               or not re.fullmatch(r"-?\d+(,\d+)?", p["answer"])]
        check(f"данные №{n}: нет непарных $, картинок-меток, ответ по форме бланка", not bad, str(bad[:5]))
    ids = [p["fipi"] for t in F["tasks"].values() for p in t["protos"]]
    check("данные: номера ФИПИ уникальны во всех номерах", len(ids) == len(set(ids)))
    check("данные: есть номера со строчными буквами (грабля из русского)", any(re.search(r"[a-z]", i) for i in ids))


def test_katex(browser, F):
    ctx, page, errors = new_page(browser, f"{BASE}/ege_prof.html?n=2")
    chunks = []
    for n, t in F["tasks"].items():
        for g in t["groups"]:
            chunks.append((n, "группа " + g["id"], g["title"]))
            chunks.append((n, "идея " + g["id"], g["hint"]))
        for p in t["protos"]:
            chunks.append((n, p["fipi"], p["text"]))
            for s in p["steps"]:
                chunks.append((n, p["fipi"], s))
    bad = page.evaluate("""(chunks) => {
        const out = [];
        for (const [n, who, s] of chunks) {
            const parts = s.split(/(\\$\\$[\\s\\S]*?\\$\\$|\\$[^$]*\\$)/).filter(x => x.startsWith('$'));
            for (const m of parts) {
                const disp = m.startsWith('$$');
                const src = m.slice(disp ? 2 : 1, disp ? -2 : -1);
                try { katex.renderToString(src, { throwOnError: true, displayMode: disp }); }
                catch (e) { out.push(n + ' ' + who + ': ' + src.slice(0, 60) + ' — ' + String(e).slice(0, 80)); }
            }
        }
        return out;
    }""", chunks)
    check(f"формулы: все {len(chunks)} кусков текста — KaTeX без ошибок", not bad, str(bad[:4]))
    ctx.close()


def test_answers(browser, F):
    ctx, page, errors = new_page(browser, f"{BASE}/ege_prof.html?n=2")
    allbad = []
    for n in COUNTS:
        page.evaluate("(n) => new Promise(r => ensureFipi(n, r))", int(n))
        res = page.evaluate("""(n) => { S.n = n; return protos(n).filter(p => p.fipi).map(p => {
            const f = fieldsOf(p)[0], st = { yn: {} }, v = String(f.value);
            const wrong = v.startsWith('-') ? v.slice(1) : '-' + v;
            return [p.fipi, checkField(f, v, st), checkField(f, wrong, st)];
        }); }""", int(n))
        bad = [r for r in res if r[1:] != [True, False]]
        check(f"ответы №{n}: все {len(res)} эталонов приняты, со сменой знака — нет", len(res) == COUNTS[n] and not bad, str(bad[:3]))
        allbad += bad
    check("ответы: без ошибок JS", not errors, str(errors[:1]))
    ctx.close()


def test_picker_and_task(browser, F):
    t5 = F["tasks"]["5"]
    ctx, page, errors = new_page(browser, f"{BASE}/ege_prof.html?n=5")
    first = page.inner_text('#protoList .mode-card .mtitle')
    check("список №5: демоверсия первой (прототип 1)", first == 'Прототип 1', first)
    secs = page.eval_on_selector_all('#protoList .proto-section', 'es => es.map(e => e.textContent)')
    check("список №5: разделы по порядку", secs == [s["title"] for s in t5["sections"]], str(secs))
    gids = page.eval_on_selector_all('#protoList .mode-card[data-gid]', 'es => es.map(e => e.dataset.gid)')
    check("список №5: карточка на каждую группу", gids == [g["id"] for g in t5["groups"]], str(gids))
    g = t5["groups"][0]
    items = [p for p in t5["protos"] if p["group"] == g["id"]]
    page.click(f'.mode-card[data-gid="{g["id"]}"]')
    page.wait_for_timeout(400)
    head = page.inner_text('#taskTitle')
    check("задание: шапка «группа · задание 1 из N»", head == f"{g['title']} · задание 1 из {len(items)}", head)
    m = SRC_RE.search(page.inner_text('#egeQuestion'))
    check("задание: подпись источника", bool(m) and m.group(1) == items[0]["fipi"])
    seen = []
    for _ in range(len(items)):
        seen.append(page.evaluate("curProto.fipi"))
        page.click('#nextProtoBtn')
        page.wait_for_timeout(100)
    check("◀ ▶: по кругу внутри группы", seen == [p["fipi"] for p in items] and page.evaluate("curProto.fipi") == items[0]["fipi"])
    page.fill('#answerArea input.answer-input', items[0]["answer"])
    page.click('#answerArea .check-btn')
    page.wait_for_timeout(300)
    check("ответ засчитан", page.evaluate("S.answered && S.correct && totalSolved === 1"))
    sol = page.inner_text('body')
    check("решение открылось: «Ответ: …»", ('Ответ: ' + items[0]["answer"].replace('-', '−')) in sol or ('Ответ: ' + items[0]["answer"]) in sol)
    st = page.evaluate("tsGetState()")
    pid = page.evaluate("S.pid")
    check("без ошибок JS", not errors, str(errors[:1]))
    ctx.close()

    # строчные буквы в номере ФИПИ — подпись источника и открытие по id
    low = next(p for t in F["tasks"].values() for p in t["protos"] if re.search(r"[a-z]", p["fipi"]))
    n_low = low["id"].split(".")[0]
    ctx, page, errors = new_page(browser, f"{BASE}/ege_prof.html?n={n_low}")
    page.evaluate("(pid) => window.__examNav.open(%s, pid)" % n_low, low["id"])
    page.wait_for_timeout(600)
    m = SRC_RE.search(page.inner_text('#egeQuestion'))
    check(f"номер ФИПИ со строчными ({low['fipi']}): открывается, подпись верная", bool(m) and m.group(1) == low["fipi"])
    ctx.close()

    ctx, page, errors = new_page(browser, f"{BASE}/ege_prof.html?n=5")
    page.evaluate("(s) => tsApplyState(s)", st)
    page.wait_for_timeout(500)
    check("сессия: у ученика то же задание ФИПИ с подписью",
          page.evaluate("S.pid") == pid and bool(SRC_RE.search(page.inner_text('#egeQuestion'))))
    check("сессия: без ошибок JS", not errors, str(errors[:1]))
    ctx.close()


def test_lazy(browser, F):
    ctx = browser.new_context(viewport={"width": 1300, "height": 1000})
    page = ctx.new_page()
    errors, got = [], []
    page.on("pageerror", lambda e: errors.append(str(e)))
    page.on("request", lambda r: got.append(r.url.rsplit('/', 1)[-1]))
    page.route("https://**/*", lambda route: route.abort())
    page.goto(f"{BASE}/ege_prof.html?n=1")
    page.wait_for_timeout(1200)
    check("раздельно: на №1 файлы номеров не грузятся",
          'ege-prof-fipi.js' in got and not any(re.fullmatch(r"ege-prof-fipi\d+\.js", u) for u in got), str([u for u in got if 'fipi' in u]))
    p = F["tasks"]["8"]["protos"][17]
    page.evaluate("(pid) => window.__examNav.open(8, pid)", p["id"])
    page.wait_for_timeout(800)
    check("раздельно: стрелка к №8 с запомненным заданием — грузит файл и открывает его",
          'ege-prof-fipi8.js' in got and page.evaluate("curProto.fipi") == p["fipi"], page.evaluate("curProto && curProto.fipi"))
    check("раздельно: без ошибок JS", not errors, str(errors[:1]))
    ctx.close()


def test_untouched(browser):
    ctx, page, errors = new_page(browser, f"{BASE}/ege_prof.html?n=1")
    bad = []
    for n in (1, 3, 9, 12, 13):
        page.evaluate("(n) => new Promise(r => ensureFipi(n, r))", n)
        cnt = page.evaluate("(n) => protos(n).filter(p => p.fipi).length", n)
        if cnt:
            bad.append((n, cnt))
    check("номера с чертежами (1, 3, 9, 12) и №13 — без заданий ФИПИ", not bad, str(bad))
    ctx.close()


def test_phone(browser):
    ctx, page, errors = new_page(browser, f"{BASE}/ege_prof.html?n=8", width=375)
    over = page.evaluate("document.documentElement.scrollWidth - innerWidth")
    page.click('.mode-card[data-gid="trig_double"]')
    page.wait_for_timeout(400)
    over2 = page.evaluate("document.documentElement.scrollWidth - innerWidth")
    check("телефон 375: список и задание №8 без прокрутки вбок", over <= 0 and over2 <= 0, f"{over} / {over2}")
    ctx.close()


def main():
    F = load_fipi()
    test_data(F)
    with local_server(), sync_playwright() as pw:
        browser = pw.chromium.launch()
        test_katex(browser, F)
        test_answers(browser, F)
        test_picker_and_task(browser, F)
        test_lazy(browser, F)
        test_untouched(browser)
        test_phone(browser)
        browser.close()
    failed = [n for n, ok in results if not ok]
    print(f"\n{len(results) - len(failed)}/{len(results)} проверок прошло")
    sys.exit(1 if failed else 0)


if __name__ == "__main__":
    main()
