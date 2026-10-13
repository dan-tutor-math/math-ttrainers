"""
Правка «банк ФИПИ №21»: в ОГЭ, часть 2 (oge_part2.html?n=21) — все 190 текстовых
задач №21 из открытого банка ФИПИ, собранные в группы по сюжету. Механика
та же, что у №20 (test_prompt_fipi20.py), здесь — то, что своё у №21.

Проверяет:
  1. данные: 190 заданий, номера ФИПИ уникальны, у каждого группа, условие,
     одно числовое поле, ответ и решение; №20 в том же файле не задет (200);
  2. ответы: КАЖДОЕ из 190 — эталон принимается и с единицей измерения
     («14 км/ч»), и без неё, десятичный ответ — и с запятой, и с точкой;
     испорченный ответ — нет;
  3. список: демоверсия первой, разделы, карточки групп с числом заданий;
  4. задание: шапка «группа · задание 1 из N», подпись источника, ◀ ▶
     внутри группы, верный ответ засчитан, разбор с критериями №21;
  5. снимок совместной сессии у ученика открывает то же задание;
  6. раздельный файл: на другом номере задания №20/№21 не грузятся; стрелка
     к №21 и снимок сессии с заданием ФИПИ открывают именно его после загрузки;
  7. телефон 375 px — без прокрутки вбок.

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

PORT = 9152
BASE = f"http://127.0.0.1:{PORT}"
HERE = os.path.dirname(os.path.abspath(__file__))
TOTAL = 190
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
    t = F["tasks"]["21"]
    protos, groups = t["protos"], t["groups"]
    check(f"данные: {TOTAL} заданий №21", len(protos) == TOTAL, str(len(protos)))
    check("данные: №20 в том же файле на месте (200)", len(F["tasks"]["20"]["protos"]) == 200)
    ids = [p["fipi"] for p in protos]
    check("данные: номера ФИПИ уникальны", len(set(ids)) == len(ids) and all(re.fullmatch(r"[0-9A-F]{6}", i) for i in ids))
    gids = {g["id"] for g in groups}
    check("данные: у каждого задания группа, условие, числовое поле, ответ и решение",
          all(p["group"] in gids and p["text"] and len(p["fields"]) == 1 and p["fields"][0]["type"] == "num"
              and p["answerTex"] and len(p["steps"]) >= 2 for p in protos))
    bad = [p["fipi"] for p in protos if "$—$" in p["text"] or " ," in p["text"] or p["text"].count("$") % 2
           or any(s.count("$") % 2 for s in p["steps"])]
    check("данные: в условиях и решениях нет непарных $ и лишних пробелов", not bad, str(bad[:5]))
    check("данные: критерии №21 (2, 1, 0)", [c[0] for c in t["criteria"]] == [2, 1, 0] and 'модель' in t["criteria"][1][1])


def test_answers(browser, F):
    ctx, page, errors = new_page(browser, f"{BASE}/oge_part2.html?n=21")
    res = page.evaluate("""() => protos(21).filter(p => p.fipi).map(p => {
        const f = p.fields[0], st = { yn: {} }, v = String(f.value);
        const n = parseFloat(v.replace(',', '.'));
        return [p.fipi, checkField(f, v, st), checkField(f, v + (f.unit ? ' ' + f.unit : ''), st),
                checkField(f, v.replace(',', '.'), st), checkField(f, String(n + 1), st)];
    })""")
    good = [r for r in res if r[1:] == [True, True, True, False]]
    check(f"ответы: все {TOTAL} — эталон, с единицей, с точкой принимаются, испорченный — нет",
          len(good) == TOTAL, str([r for r in res if r[1:] != [True, True, True, False]][:3]))
    check("ответы: без ошибок JS", not errors, str(errors[:1]))
    ctx.close()


def test_picker_and_task(browser, F):
    t21 = F["tasks"]["21"]
    ctx, page, errors = new_page(browser, f"{BASE}/oge_part2.html?n=21")
    first = page.inner_text('#protoList .mode-card .mtitle')
    check("список: демоверсия первой", first == '№0. Задание из демоверсии ОГЭ 2027', first)
    secs = page.eval_on_selector_all('#protoList .proto-section', 'es => es.map(e => e.textContent)')
    check("список: разделы по порядку", secs == [s["title"] for s in t21["sections"]], str(secs))
    gids = page.eval_on_selector_all('#protoList .mode-card[data-gid]', 'es => es.map(e => e.dataset.gid)')
    check("список: карточка на каждую группу", gids == [g["id"] for g in t21["groups"]], str(gids))

    g = next(g for g in t21["groups"] if g["id"] == "boat")
    items = [p for p in t21["protos"] if p["group"] == "boat"]
    page.click('.mode-card[data-gid="boat"]')
    page.wait_for_timeout(400)
    head = page.inner_text('#taskTitle')
    check("задание: шапка «группа · задание 1 из N»", head == f"{g['title']} · задание 1 из {len(items)}", head)
    m = SRC_RE.search(page.inner_text('#egeQuestion'))
    check("задание: подпись источника", m and m.group(1) == items[0]["fipi"])
    check("задание: единица измерения у поля", page.inner_text('#answerArea .p2-unit') == 'км/ч')
    seen = []
    for _ in range(len(items)):
        seen.append(page.evaluate("curProto.fipi"))
        page.click('#nextProtoBtn')
        page.wait_for_timeout(100)
    check("◀ ▶: по кругу внутри группы", seen == [p["fipi"] for p in items] and page.evaluate("curProto.fipi") == items[0]["fipi"])
    page.fill('#answerArea input.answer-input', items[0]["fields"][0]["value"] + ' км/ч')
    page.click('#answerArea .check-btn')
    page.wait_for_timeout(300)
    check("ответ «… км/ч» засчитан", page.evaluate("S.answered && S.correct && totalSolved === 1"))
    crit = page.inner_text('#critTable')
    check("разбор: критерии №21 и ответ с единицей",
          'математическая модель' in crit and page.inner_text('#solAnswer').endswith('км/ч'), page.inner_text('#solAnswer'))
    st = page.evaluate("tsGetState()")
    pid = page.evaluate("S.pid")
    check("без ошибок JS", not errors, str(errors[:1]))
    ctx.close()

    ctx, page, errors = new_page(browser, f"{BASE}/oge_part2.html?n=21")
    page.evaluate("(s) => tsApplyState(s)", st)
    page.wait_for_timeout(500)
    check("сессия: у ученика то же задание ФИПИ с подписью",
          page.evaluate("S.pid") == pid and SRC_RE.search(page.inner_text('#egeQuestion')))
    check("сессия: без ошибок JS", not errors, str(errors[:1]))
    ctx.close()


def test_lazy(browser, F):
    """«раздельный файл»: задания номера грузятся, только когда номер открыли"""
    ctx = browser.new_context(viewport={"width": 1300, "height": 1000})
    page = ctx.new_page()
    errors, got = [], []
    page.on("pageerror", lambda e: errors.append(str(e)))
    page.on("request", lambda r: got.append(r.url.rsplit('/', 1)[-1]))
    page.route("https://**/*", lambda route: route.abort())
    page.goto(f"{BASE}/oge_part2.html?n=22")
    page.wait_for_timeout(1200)
    check("раздельно: на №22 файлы №20 и №21 не грузятся",
          'oge-part2-fipi.js' in got and not any(u.startswith('oge-part2-fipi2') for u in got), str([u for u in got if 'fipi' in u]))
    p = F["tasks"]["21"]["protos"][37]
    page.evaluate("(pid) => window.__examNav.open(21, pid)", p["id"])
    page.wait_for_timeout(800)
    check("раздельно: стрелка к №21 с запомненным заданием — грузит файл и открывает именно его",
          'oge-part2-fipi21.js' in got and page.evaluate("curProto.fipi") == p["fipi"], page.evaluate("curProto && curProto.fipi"))
    ctx.close()
    # ученик на другом номере получает снимок с заданием ФИПИ
    ctx, page, errors2 = new_page(browser, f"{BASE}/oge_part2.html?n=22")
    st = {"egeScreen": "task", "egeN": 21, "egePid": p["id"], "curSubMode": "exam", "cards": [], "marks": {}, "yn": {}}
    page.evaluate("(s) => tsApplyState(s)", st)
    page.wait_for_timeout(800)
    check("раздельно: снимок с заданием ФИПИ до загрузки файла — открыто именно оно",
          page.evaluate("S.n") == 21 and page.evaluate("curProto.fipi") == p["fipi"])
    check("раздельно: без ошибок JS", not errors and not errors2, str((errors + errors2)[:1]))
    ctx.close()


def test_phone(browser):
    ctx, page, errors = new_page(browser, f"{BASE}/oge_part2.html?n=21", width=375)
    over = page.evaluate("document.documentElement.scrollWidth - innerWidth")
    page.click('.mode-card[data-gid="vessels"]')
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
