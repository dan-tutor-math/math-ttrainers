"""
Новый тренажёр «Состав числа: домики» — sostav.html.

Проверяет:
  A. генератор всех девяти типов для чисел 2–10 с нулём и без: на этажах
     верные пары, «По порядку» идёт по возрастанию, в «Найди ошибку» ровно один
     неверный этаж, в «Пропавшем этаже» пропажа — недостающая пара, лишние
     карточки «Расселения» не совпадают с нужными, в «Чей жилец?» каждая пара
     принадлежит одному из двух домиков;
  B. настройка: по умолчанию домик 10, ⟳ сбрасывает выбор чисел и блокирует
     «Начать», выбор домиков на доске 1/3/6/9/12;
  C. доска: 12 разных домиков; если разных меньше (одно число + «По порядку»),
     листов меньше и есть предупреждение; ⟳ на листе меняет только свой домик;
  D. проверка: каждый тип решается через страницу и засчитывается, неверный
     ответ — красным; «Расселение» и «Чей жилец?» — нажатиями, без клавиатуры;
  E. выбор переживает перезагрузку, мусор в сохранении не роняет страницу;
  F. телефон 375 и 320 px без прокрутки вбок; в каталоге ссылка и вкладка
     «1 класс».

Запуск: python3 test_prompt_sostav.py (сервер поднимается сам).
"""
import contextlib
import http.client
import json
import os
import subprocess
import sys
import time

from playwright.sync_api import sync_playwright

HERE = os.path.dirname(os.path.abspath(__file__))
PORT = 8987
BASE = f"http://127.0.0.1:{PORT}"
MODES = ["pair", "order", "empty", "roof", "error", "family", "cards", "missing", "whose"]
results = []


def check(name, ok, extra=""):
    results.append((name, ok))
    print(f"[{'OK' if ok else 'FAIL'}] {name}" + (f": {extra}" if extra and not ok else ""))


@contextlib.contextmanager
def local_server():
    proc = subprocess.Popen([sys.executable, "-m", "http.server", str(PORT)], cwd=HERE,
                            stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    try:
        for _ in range(50):
            try:
                c = http.client.HTTPConnection("127.0.0.1", PORT, timeout=0.2)
                c.request("GET", "/index.html")
                c.getresponse()
                break
            except Exception:
                time.sleep(0.1)
        else:
            raise RuntimeError("сервер не поднялся")
        yield
    finally:
        proc.terminate()
        proc.wait(timeout=5)


def open_page(browser, width=1000, height=900, state=None):
    ctx = browser.new_context(viewport={"width": width, "height": height})
    page = ctx.new_page()
    errors = []
    page.on("pageerror", lambda e: errors.append(str(e)))
    page.route("https://fonts.**", lambda r: r.abort())
    page.goto(f"{BASE}/sostav.html", wait_until="domcontentloaded")
    page.evaluate("localStorage.clear()")
    if state is not None:
        page.evaluate("s => localStorage.setItem('sostav_state', JSON.stringify(s))", state)
    page.reload(wait_until="domcontentloaded")
    return page, errors


def pairs(n, z):
    lo = 0 if z else 1
    return [[i, n - i] for i in range(lo, n - lo + 1)]


def check_generator(pg):
    bad = {m: [] for m in MODES}
    for mode in MODES:
        for n in range(2, 11):
            for z in (False, True):
                for _ in range(15):
                    h = pg.evaluate("a => SOSTAV.make(a[0], a[1], a[2], a[3])", [n, mode, z, [n]])
                    P = pairs(n, z)
                    fl = [[f["l"], f["r"]] for f in h.get("floors", [])]
                    m = h["mode"]
                    if m != mode and not (mode in ("error", "missing") and len(P) < 3 and m == "pair"):
                        bad[mode].append(("тип", n, z, m))
                        continue
                    err = None
                    if m in ("pair", "empty") and sorted(fl) != sorted(P):
                        err = "этажи"
                    if m == "pair" and any(f["show"] not in ("l", "r") for f in h["floors"]):
                        err = "одно окошко"
                    if m == "order" and (fl != P or any(f["show"] != "l" for f in h["floors"])):
                        err = "порядок"
                    if m in ("roof", "family") and (not fl or any(a + b != n for a, b in fl) or len(fl) > 3):
                        err = "суммы"
                    if m == "error":
                        wrong = [k for k, (a, b) in enumerate(fl) if a + b != n]
                        if wrong != [h["wrong"]] or min(min(p) for p in fl) < 0:
                            err = f"ошибка {wrong}"
                    if m == "missing":
                        if sorted(fl + [h["miss"]]) != sorted(P) or h["miss"] in fl:
                            err = "пропажа"
                    if m == "cards":
                        need = [f["r"] if f["show"] == "l" else f["l"] for f in h["floors"]]
                        spare = list(h["cards"])
                        for v in need:
                            spare.remove(v)
                        lo = 0 if z else 1
                        if not (len(P) and all(a + b == n for a, b in fl)) or not (1 <= len(spare) <= 2) \
                                or any(v in need or v < lo or v > n for v in spare):
                            err = f"карточки {need} {spare}"
                    if m == "whose":
                        ns = h["Ns"]
                        if ns[0] == ns[1] or n not in ns or not (2 <= len(h["cards"]) <= 5) \
                                or any(c["l"] + c["r"] not in ns for c in h["cards"]):
                            err = f"жильцы {ns}"
                    if err:
                        bad[mode].append((err, n, z, fl))
    for mode in MODES:
        check(f"A. генератор «{mode}»", not bad[mode], str(bad[mode][:2]))


def start(pg, nums, modes, cnt):
    pg.evaluate("s => localStorage.setItem('sostav_state', JSON.stringify(s))",
                {"nums": nums, "modes": modes, "zero": False, "dots": True, "cnt": cnt})
    pg.reload(wait_until="domcontentloaded")
    pg.click("#start")


def solve(pg, leaf, h, right=True):
    """Решает лист через страницу. right=False — заведомо неверный ответ."""
    m = h["mode"]
    floors = leaf.locator(".body .floor")
    if m in ("pair", "order"):
        for k, f in enumerate(h["floors"]):
            side = 1 if f["show"] == "l" else 0
            v = f["r"] if f["show"] == "l" else f["l"]
            floors.nth(k).locator(".win").nth(side).locator("input").fill(str(v if right else v + 1))
    elif m == "empty":
        for k, f in enumerate(h["floors"]):
            ins = floors.nth(k).locator("input")
            ins.nth(0).fill(str(f["l"]))
            ins.nth(1).fill(str(f["r"] if right else f["r"] + 1))
    elif m == "roof":
        leaf.locator(".roof input").fill(str(h["N"] if right else h["N"] + 1))
    elif m == "error":
        k = h["wrong"] if right else (h["wrong"] + 1) % len(h["floors"])
        floors.nth(k).click()
    elif m == "family":
        f = h["floors"][0]
        rows = leaf.locator(".eq")
        vals = [(f["l"], f["r"]), (f["r"], f["l"]), (f["l"], f["r"]), (f["r"], f["l"])]
        if not right:
            vals[1] = vals[0] if f["l"] != f["r"] else (f["l"] + 1, f["r"])
        for k, (a, b) in enumerate(vals):
            rows.nth(k).locator("input").nth(0).fill(str(a))
            rows.nth(k).locator("input").nth(1).fill(str(b))
    elif m == "cards":
        need = [f["r"] if f["show"] == "l" else f["l"] for f in h["floors"]]
        if not right:
            spare = list(h["cards"])
            for v in need:
                spare.remove(v)
            need[0] = spare[0]  # в первое окошко — лишняя карточка
        used = set()
        for v in need:
            cards = leaf.locator(".card")
            for ci in range(cards.count()):
                if ci not in used and cards.nth(ci).inner_text() == str(v):
                    used.add(ci)
                    cards.nth(ci).click()
                    break
        if not right:  # оставшиеся окошки заполняем чем осталось, чтобы проверка была полной
            while leaf.locator(".slot:not(.filled)").count():
                leaf.locator(".card:not(.used)").first.click()
    elif m == "missing":
        a, b = h["miss"]
        ins = leaf.locator(".lostfloor input")
        ins.nth(0).fill(str(a))
        ins.nth(1).fill(str(b if right else b + 1))
    elif m == "whose":
        targets = leaf.locator(".house.target")
        for ci, c in enumerate(h["cards"]):
            s = c["l"] + c["r"]
            hi = h["Ns"].index(s)
            if not right and ci == 0:
                hi = 1 - hi
            leaf.locator(".card").nth(ci).click()
            targets.nth(hi).click()
    leaf.locator(".check").click()


def main():
    with local_server(), sync_playwright() as p:
        browser = p.chromium.launch()
        pg, errors = open_page(browser)

        check_generator(pg)

        # B. настройка
        check("B. по умолчанию выбран домик 10",
              pg.locator("#nums .num.on").all_inner_texts() == ["10"])
        check("B. девять плиток типов", pg.locator("#tiles .tile").count() == 9)
        check("B. домиков на доске: 1, 3, 6, 9, 12",
              pg.locator("#cnt1 .pill").all_inner_texts() == ["1", "3", "6", "9", "12"])
        pg.click('#nums [data-n="7"]')
        pg.click("#resetNums")
        check("B. ⟳ сбрасывает выбор чисел", pg.locator("#nums .num.on").count() == 0)
        check("B. без чисел «Начать» заблокирована и ⟳ бледнеет",
              pg.is_disabled("#start") and pg.is_disabled("#resetNums"))

        # C. доска
        start(pg, [5, 10], MODES, 12)
        keys = pg.evaluate("SOSTAV.houses().map(h => h.key)")
        check("C. 12 домиков, все разные", len(keys) == 12 and len(set(keys)) == 12, str(len(keys)))
        check("C. без предупреждения", pg.inner_text("#short") == "")
        modes_on_board = set(pg.evaluate("SOSTAV.houses().map(h => h.mode)"))
        check("C. типы вперемешку", len(modes_on_board) >= 3, str(modes_on_board))
        before = pg.evaluate("SOSTAV.houses().map(h => h.key)")
        pg.locator('.leaf[data-i="4"] .rf').click()
        after = pg.evaluate("SOSTAV.houses().map(h => h.key)")
        check("C. ⟳ на листе меняет только свой домик",
              after[4] != before[4] and after[:4] == before[:4] and after[5:] == before[5:])
        check("C. номера листов на месте", pg.locator(".leaf").nth(4).locator(".no").inner_text() == "домик №5")
        pg.click("#refAll")
        check("C. «Новые домики» меняет доску", pg.evaluate("SOSTAV.houses().map(h => h.key)") != after)

        start(pg, [10], ["order"], 6)
        check("C. одно число + «По порядку»: один лист, не копии", pg.locator(".leaf").count() == 1)
        check("C. предупреждение о нехватке разных домиков", "только 1" in pg.inner_text("#short"))

        # D. проверка каждого типа через страницу
        for mode in MODES:
            for right in (True, False):
                ok_all = True
                for n in ([10, 9] if mode == "whose" else [10]):
                    start(pg, [n], [mode], 1)
                    leaf = pg.locator(".leaf").first
                    h = pg.evaluate("SOSTAV.houses()[0]")
                    solve(pg, leaf, h, right)
                    cls = leaf.get_attribute("class")
                    ok_all &= ("ok" in cls.split()) == right and ("bad" in cls.split()) == (not right)
                check(f"D. «{mode}»: {'верное решение засчитано' if right else 'ошибка подсвечена'}", ok_all,
                      leaf.inner_text().replace("\n", " ")[:160])
        start(pg, [10], ["pair"], 3)
        leaf = pg.locator(".leaf").first
        solve(pg, leaf, pg.evaluate("SOSTAV.houses()[0]"))
        check("D. счётчик построенных домиков", pg.inner_text("#score") == "Построено домиков: 1")
        leaf.locator(".check").click()
        check("D. повторная проверка не накручивает счётчик", pg.inner_text("#score") == "Построено домиков: 1")
        start(pg, [10], ["cards"], 1)
        leaf = pg.locator(".leaf").first
        first_card = leaf.locator(".card").first
        v = first_card.inner_text()
        first_card.click()
        leaf.locator(".slot.filled").first.click()
        check("D. «Расселение»: нажатие на окошко возвращает карточку",
              leaf.locator(".slot.filled").count() == 0 and leaf.locator(".card.used").count() == 0, v)
        leaf.locator(".check").click()
        check("D. «Расселение»: пустые окошки — подсказка, а не «неверно»",
              "пустые" in leaf.locator(".verdict").inner_text() and "bad" not in leaf.get_attribute("class").split())
        start(pg, [10], ["family"], 1)
        leaf = pg.locator(".leaf").first
        h = pg.evaluate("SOSTAV.houses()[0]")
        f = h["floors"][0]
        if f["l"] != f["r"]:
            rows = leaf.locator(".eq")
            for k, (a, b) in enumerate([(f["l"], f["r"])] * 2 + [(f["l"], f["r"]), (f["r"], f["l"])]):
                rows.nth(k).locator("input").nth(0).fill(str(a))
                rows.nth(k).locator("input").nth(1).fill(str(b))
            leaf.locator(".check").click()
            check("D. «Домик и примеры»: повтор примера — подсказка поменять местами",
                  "поменяй" in leaf.locator(".verdict").inner_text())

        # E. сохранение
        pg2, errs2 = open_page(browser)
        pg2.click('#nums [data-n="4"]')
        pg2.click('#tiles [data-mode="whose"]')
        pg2.click("#zero")
        pg2.click('#cnt1 [data-cnt="9"]')
        pg2.reload(wait_until="domcontentloaded")
        st = json.loads(pg2.evaluate("localStorage.getItem('sostav_state')"))
        check("E. выбор переживает перезагрузку",
              sorted(st["nums"]) == [4, 10] and "whose" in st["modes"] and st["zero"] and st["cnt"] == 9
              and pg2.locator('#nums [data-n="4"]').get_attribute("aria-pressed") == "true"
              and pg2.get_attribute("#zero", "aria-checked") == "true", str(st))
        pg3, errs3 = open_page(browser, state={"nums": [1, 15, "x", 6], "modes": ["nope", "roof"], "cnt": 7})
        check("E. мусор в сохранении отброшен",
              pg3.locator("#nums .num.on").all_inner_texts() == ["6"]
              and pg3.locator("#tiles .tile.on").count() == 1
              and pg3.locator("#cnt1 .pill.on").inner_text() == "3")
        pg3.click("#start")
        check("E. после мусора доска строится", pg3.locator(".leaf").count() == 3 and not errs3, str(errs3))

        # F. телефон и каталог
        for w in (375, 320):
            pm, em = open_page(browser, width=w, height=800, state={"nums": [9, 10], "modes": MODES, "cnt": 12})
            sw1 = pm.evaluate("document.documentElement.scrollWidth")
            pm.click("#start")
            sw2 = pm.evaluate("document.documentElement.scrollWidth")
            check(f"F. {w}px без прокрутки вбок", sw1 <= w and sw2 <= w, f"{sw1} {sw2}")
            check(f"F. {w}px без ошибок JS", not em, str(em))
        idx = open(os.path.join(HERE, "index.html"), encoding="utf-8").read()
        check("F. в каталоге есть ссылка", "href: 'sostav.html'" in idx)
        # с правки «1–4 классы» состав числа живёт в CURRICULUM (1 класс → Числа и величины)
        check("F. «1–4 классы» с составом числа", "{ id: 'g1_4', title: '1–4 классы'" in idx and "{ id: 'sostav' }" in idx)
        pi = browser.new_page()
        pi.route("https://**/*", lambda r: r.abort())
        pi.goto(f"{BASE}/index.html")
        pi.wait_for_timeout(800)
        pi.click('.nav-tab[data-id="grades"]')
        pi.wait_for_timeout(300)
        check("F. на главной в «Классах» есть «Состав числа»",
              pi.locator('a[href="sostav.html"]').count() > 0)

        check("G. без ошибок JS", not errors and not errs2, str(errors + errs2))
        browser.close()

    bad = [n for n, ok in results if not ok]
    print(f"\nИтого: {len(results) - len(bad)}/{len(results)}")
    sys.exit(1 if bad else 0)


if __name__ == "__main__":
    main()
