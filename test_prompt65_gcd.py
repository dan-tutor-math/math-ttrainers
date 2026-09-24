"""
Промпт №65: новый тренажёр «Наибольший общий делитель (НОД)» — gcd.html.

Три раздела по порядку: перебор делителей, разложение на простые множители
(«столбиком»), алгоритм Евклида. В каждом — краткая теория, четыре уровня и
«Экзамен».

Проверяет:
  A. генераторы: 300 заданий на каждый уровень каждого раздела укладываются в
     обещанное (диапазон чисел, НОД, длина цепочки Евклида, три числа — НОД
     первых двух больше общего); примеры из приложенных материалов считаются
     верно (975 и 750, 572 и 440, 80/140/56, 170/306/255, разложенные a и b);
  B. каждый уровень каждого раздела решается через интерфейс до конца —
     правильными ответами, по два примера (в «Экзамене» — по четыре), без
     ошибок JS, счёт «решено» растёт;
  C. проверка каждого шага и подсказки на ошибках: не делитель, неполный
     список, не общий делитель, не наибольший; составной делитель, не делится,
     неверное частное, не общий множитель, выбраны не все, неверное
     произведение; неверное частное, остаток больше делителя, не та пара,
     ноль вместо НОД; в «Экзамене» подсказки короткие;
  D. «отменить шаг», запятая и «Ввод» на экранной клавиатуре;
  E. совместная сессия (заглушка Supabase из теста №54): ученик видит тот же
     раздел, пример и ход решения; смена раздела у учителя доезжает;
  F. карточка «+1»: тот же раздел и уровень, видно только задание;
  G. «В подборку», каталог на главной (6 класс), панель тренажёров на доске;
  H. телефон 375 и 320 px: без прокрутки вбок и без обрезанных блоков во всех
     трёх разделах, включая разложение трёх чисел.

Живой realtime из песочницы не проверить — совместный режим перепроверяется
на сайте руками.

Запуск: python3 test_prompt65_gcd.py (сервер поднимается сам).
"""
import contextlib
import http.client
import os
import re
import subprocess
import sys
import time

from playwright.sync_api import sync_playwright

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from test_prompt54_trainer_sync_and_cards import FAKE_LIB  # noqa: E402

PORT = 8986
BASE = f"http://127.0.0.1:{PORT}"

results = []


def check(name, ok, extra=""):
    results.append((name, ok))
    print(f"[{'OK' if ok else 'FAIL'}] {name}" + (f": {extra}" if extra and not ok else ""))


@contextlib.contextmanager
def local_server():
    proc = subprocess.Popen(
        [sys.executable, "-m", "http.server", str(PORT)], cwd=HERE,
        stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL,
    )
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


def open_page(browser, width=1300, height=1000, fake=False, url="gcd.html"):
    ctx = browser.new_context(viewport={"width": width, "height": height})
    page = ctx.new_page()
    errors = []
    page.on("pageerror", lambda e: errors.append(str(e)))
    if fake:
        page.route("**/supabase-js.umd.js", lambda route: route.fulfill(
            status=200, content_type="application/javascript", body=FAKE_LIB))
        page.route("**/fonts.googleapis.com/**", lambda route: route.abort())
        page.route("**/fonts.gstatic.com/**", lambda route: route.abort())
    else:
        page.route("https://**/*", lambda route: route.abort())
    page.goto(f"{BASE}/{url}")
    page.wait_for_function("() => window.__trainerState")
    page.wait_for_timeout(300)
    return ctx, page, errors


def st(page):
    return page.evaluate("() => ({P, S, curSection, curLevel})")


def hint(page):
    return page.inner_text("#hint")


def go_section(page, sec, lvl=0):
    page.click(f'#sections .lvl[data-sec="{sec}"]')
    page.click(f'#levels .lvl[data-id="{lvl}"]')
    page.wait_for_timeout(100)


def set_task(page, sec, nums, given=None, exam=False):
    """Подставить конкретное задание (из приложенных примеров) вместо случайного."""
    page.evaluate("""([sec, nums, given, exam]) => {
        curSection = sec; renderSections(); renderTheory(); renderLevels();
        P = { sec, lvl: exam ? 4 : 1, base: 1, nums };
        if (given) P.given = given;
        S = initState(P);
        setHint(''); renderAll();
    }""", [sec, nums, given, exam])


def fill(page, sel, val):
    page.fill(sel, str(val))


def tap(page, sel):
    """Нажатие без координат. Лист и панель плавно меняют высоту после каждого
    шага (setupAutoHeightAnimation), кнопки под ними в это время едут вниз, и
    клик по координатам изредка попадал мимо — тест падал случайно. Человек
    жмёт по уже остановившейся кнопке, поэтому здесь событие шлётся прямо в
    элемент."""
    page.locator(sel).first.dispatch_event("click")


# ─── решатель через интерфейс ───
def solve_current(page):
    """Решить текущий пример правильными ответами, нажимая то же, что ученик."""
    for _ in range(400):
        s = st(page)
        P, S = s["P"], s["S"]
        if S["phase"] == "done":
            return True
        sec = P["sec"]
        if sec == 0:
            if S["step"] == "divs":
                n = P["nums"][S["cur"]]
                divs = [d for d in range(1, n + 1) if n % d == 0]
                if P["sec"] == 0 and P["lvl"] == 0:
                    # уровень 1 — строго по одному делителю
                    for d in divs:
                        fill(page, "#ans", d)
                        tap(page, "#goBtn")
                else:
                    fill(page, "#ans", ", ".join(map(str, divs)))
                    tap(page, "#goBtn")
                tap(page, "#doneBtn")
            elif S["step"] == "common":
                g = gcd_all(P["nums"])
                for d in range(1, g + 1):
                    if g % d == 0:
                        tap(page, f'#work .dv-row:first-child .chip[data-v="{d}"]')
                tap(page, "#doneBtn")
            else:
                fill(page, "#ans", gcd_all(P["nums"]))
                tap(page, "#goBtn")
        elif sec == 1:
            if S["step"] == "fact":
                c = S["cols"][S["cur"]]
                m = c["rows"][-1]
                if S["sub"] == "div":
                    fill(page, "#fdiv", smallest_prime(m))
                else:
                    fill(page, "#fquot", m // c["divs"][-1])
                tap(page, "#goBtn")
            elif S["step"] == "pick":
                facts = S["facts"]
                common = common_factors(facts)
                for v in common:
                    s2 = st(page)["S"]
                    used = {g["idx"][0] for g in s2["groups"]}
                    k = next(j for j, x in enumerate(facts[0]) if x == v and j not in used)
                    tap(page, f'#work .chip[data-r="0"][data-k="{k}"]')
                tap(page, "#doneBtn")
            else:
                prod = 1
                for g in S["groups"]:
                    prod *= g["v"]
                fill(page, "#ans", prod)
                tap(page, "#goBtn")
        else:
            c = S["chains"][S["ch"]]
            row = c["rows"][-1]
            if S["step"] == "div":
                fill(page, "#eq", row["x"] // row["y"])
                fill(page, "#er", row["x"] % row["y"])
                tap(page, "#goBtn")
            elif S["step"] == "pair":
                fill(page, "#ex", row["y"])
                fill(page, "#ey", row["r"])
                tap(page, "#goBtn")
            else:
                fill(page, "#ans", row["y"])
                tap(page, "#goBtn")
    return False


def gcd(a, b):
    while b:
        a, b = b, a % b
    return a


def gcd_all(a):
    g = a[0]
    for x in a[1:]:
        g = gcd(g, x)
    return g


def smallest_prime(m):
    p = 2
    while m % p:
        p += 1
    return p


def factorize(n):
    f, p = [], 2
    while p * p <= n:
        while n % p == 0:
            f.append(p)
            n //= p
        p += 1
    if n > 1:
        f.append(n)
    return f


def common_factors(lists):
    out = []
    for p in sorted(set(lists[0])):
        k = min(lst.count(p) for lst in lists)
        out += [p] * k
    return out


def euclid_len(a, b):
    x, y, n = max(a, b), min(a, b), 0
    while y:
        x, y = y, x % y
        n += 1
    return n


# ─── A. генераторы ───
def test_generators(browser):
    ctx, page, errors = open_page(browser)
    data = page.evaluate("""() => {
        const out = {};
        for (let s = 0; s < 3; s++) for (let l = 0; l < 4; l++) {
            const a = [];
            for (let i = 0; i < 300; i++) a.push(SECTIONS[s].levels[l].gen());
            out[s + ':' + l] = a;
        }
        return out;
    }""")
    rules = {
        "0:0": (2, 6, 30), "0:1": (2, 12, 60), "0:2": (2, 40, 100), "0:3": (3, 12, 60),
        "1:1": (2, 24, 150), "1:2": (2, 200, 999), "1:3": (3, 40, 400),
        "2:0": (2, 20, 100), "2:1": (2, 60, 300), "2:2": (2, 200, 999), "2:3": (3, 40, 400),
    }
    for key, items in data.items():
        bad = []
        coprime = 0
        for it in items:
            nums = it["nums"]
            g = gcd_all(nums)
            if g == 1:
                coprime += 1
            if key == "1:0":
                a, b = it["given"]
                if nums != [eval("*".join(map(str, a))), eval("*".join(map(str, b)))] or a != sorted(a) \
                        or any(factorize(x) != [x] for x in a + b) or len(a) > 7 or len(b) > 7:
                    bad.append(it)
                continue
            cnt, lo, hi = rules[key]
            if len(nums) != cnt or len(set(nums)) != cnt or not all(lo <= x <= hi for x in nums):
                bad.append(it)
                continue
            if cnt == 3 and gcd(nums[0], nums[1]) == g:
                bad.append(it)
            if g == 1 and key not in ("0:1", "1:1", "2:1"):
                bad.append(it)
            if key.startswith("1:") and not all(len(factorize(x)) >= 3 and max(factorize(x)) <= 17 for x in nums):
                bad.append(it)
            if key == "1:2" and g < 6:
                bad.append(it)
            if key.startswith("2:"):
                k = euclid_len(nums[0], nums[1])
                lim = {"2:0": (2, 3), "2:1": (3, 4), "2:2": (3, 6), "2:3": (1, 4)}[key]
                if not lim[0] <= k <= lim[1]:
                    bad.append(it)
                if key == "2:3" and euclid_len(gcd(nums[0], nums[1]), nums[2]) > 4:
                    bad.append(it)
        check(f"A: генератор {key} — 300 заданий по правилам уровня", not bad, str(bad[:2]))
        if key in ("0:1", "1:1", "2:1"):
            check(f"A: генератор {key} — взаимно простые попадаются, но редко", 10 <= coprime <= 90, str(coprime))
    # примеры из приложенных материалов
    ex = page.evaluate("""() => ({
        a: gcdAll([975, 750]), b: gcdAll([572, 440]), c: gcdAll([80, 140, 56]), d: gcdAll([170, 306, 255]),
        e: prod(commonFactors([[2,2,3,3,5,7,19],[2,3,11,13]])), f: prod(commonFactors([[2,3,3,5,5,5,11],[3,5,5,7]])),
        g: gcdAll([84, 60]), h: gcdAll([36, 60]), i: gcdAll([48, 18]), j: gcdAll([8, 15]),
        pf: powForm([2,2,3,7]),
    })""")
    check("A: примеры из материалов считаются верно",
          ex == {"a": 75, "b": 44, "c": 4, "d": 17, "e": 6, "f": 75, "g": 12, "h": 12, "i": 6, "j": 1, "pf": "2² · 3 · 7"}, str(ex))
    check("A: без ошибок JS", not errors, str(errors[:1]))
    ctx.close()


# ─── B. все уровни решаются ───
def test_solve_all(browser):
    ctx, page, errors = open_page(browser)
    for sec in range(3):
        for lvl in range(5):
            go_section(page, sec, lvl)
            ok_all = True
            for _ in range(4 if lvl == 4 else 2):
                before = int(page.inner_text("#stSolved"))
                ok = solve_current(page)
                s = st(page)["S"]
                ok = ok and s["errTotal"] == 0 and int(page.inner_text("#stSolved")) == before + 1 \
                    and page.is_visible("#nextBtn") and "НОД" in page.inner_text("#work")
                ok_all = ok_all and ok
                tap(page, "#nextBtn")
            check(f"B: раздел {sec + 1}, уровень {lvl + 1 if lvl < 4 else 'Экзамен'} решается без ошибок", ok_all)
    check("B: звёзды за чистое решение", page.evaluate("() => document.getElementById('stStreak').textContent") == "36")
    check("B: без ошибок JS", not errors, str(errors[:1]))
    ctx.close()


# ─── C. проверка шагов и подсказки ───
def test_errors(browser):
    ctx, page, errors = open_page(browser)
    # раздел 1: 12 и 18
    set_task(page, 0, [12, 18])
    fill(page, "#ans", "1, 2, 5")
    tap(page, "#goBtn")
    s = st(page)["S"]
    check("C1: не делитель отклонён, верные записаны", s["divs"][0] == [1, 2] and s["errTotal"] == 1
          and "5 — не делитель 12" in hint(page) and "остаток 2" in hint(page), hint(page))
    tap(page, "#doneBtn")
    check("C1: неполный список — подсказка про пары", st(page)["S"]["cur"] == 0 and "парами" in hint(page)
          and "12 ÷ 1 = 12" in hint(page), hint(page))
    fill(page, "#ans", "3 4 6 12")
    tap(page, "#doneBtn")          # «Все выписаны» с набранным — сначала добавляет
    check("C1: «Все выписаны» забирает набранное и переходит ко второму числу", st(page)["S"]["cur"] == 1)
    fill(page, "#ans", "1,2,3,6,9,18")
    tap(page, "#goBtn")
    tap(page, "#doneBtn")
    check("C1: этап общих делителей", st(page)["S"]["step"] == "common")
    tap(page, '#work .dv-row:first-child .chip[data-v="4"]')
    check("C1: 4 — не общий, объяснено", "4 нет среди делителей 18" in hint(page) and st(page)["S"]["common"] == [], hint(page))
    for v in (1, 2, 6):
        tap(page, f'#work .dv-row:first-child .chip[data-v="{v}"]')
    common_marked = page.evaluate("() => [...document.querySelectorAll('#work .chip.common')].length")
    check("C1: общий делитель отмечается в обеих строках", common_marked == 6, str(common_marked))
    tap(page, "#doneBtn")
    check("C1: отмечены не все общие — не пропускает", st(page)["S"]["step"] == "common" and "ещё 1" in hint(page), hint(page))
    tap(page, '#work .dv-row:nth-child(2) .chip[data-v="3"]')
    tap(page, "#doneBtn")
    fill(page, "#ans", 3)
    tap(page, "#goBtn")
    check("C1: общий, но не наибольший", "не наибольший" in hint(page), hint(page))
    fill(page, "#ans", 6)
    tap(page, "#goBtn")
    check("C1: НОД(12, 18) = 6 — решено", st(page)["S"]["phase"] == "done" and "НОД(12, 18) = 6" in page.inner_text("#work"))

    # раздел 1, уровень 1: делители только по одному
    page.evaluate("""() => { curSection = 0; renderSections(); renderTheory(); renderLevels();
        P = { sec: 0, lvl: 0, base: 0, nums: [12, 18] }; S = initState(P); setHint(''); renderAll(); }""")
    fill(page, "#ans", "1, 2")
    tap(page, "#goBtn")
    s = st(page)["S"]
    check("C1: уровень 1 — список не принимается, просьба вписывать по одному",
          s["divs"][0] == [] and s["errTotal"] == 0 and "по одному" in hint(page)
          and "по одному" in page.inner_text("#prompt"), hint(page))
    fill(page, "#ans", 5)
    tap(page, "#goBtn")
    fill(page, "#ans", 4)
    tap(page, "#goBtn")
    s = st(page)["S"]
    check("C1: уровень 1 — каждый делитель проверяется сразу",
          s["divs"][0] == [4] and s["errTotal"] == 1, str(s["divs"]))

    # раздел 2: 84 и 60 (пример из теории)
    set_task(page, 1, [84, 60])
    fill(page, "#fdiv", 4)
    tap(page, "#goBtn")
    check("C2: составной делитель — «делим только на простые»", "составное" in hint(page) and "4 = 2 · 2" in hint(page), hint(page))
    fill(page, "#fdiv", 5)
    tap(page, "#goBtn")
    check("C2: не делится на 5 — признак делимости", "оканчивается на 4" in hint(page), hint(page))
    fill(page, "#fdiv", 2)
    tap(page, "#goBtn")
    fill(page, "#fquot", 41)
    tap(page, "#goBtn")
    check("C2: неверное частное", "84 ÷ 2" in hint(page) and st(page)["S"]["sub"] == "quot", hint(page))
    for p_, q_ in [(2, 42), (2, 21), (3, 7)]:
        if p_ != 2 or q_ != 42:
            fill(page, "#fdiv", p_)
            tap(page, "#goBtn")
        fill(page, "#fquot", q_)
        tap(page, "#goBtn")
    fill(page, "#fdiv", 3)
    tap(page, "#goBtn")
    check("C2: 7 не делится на 3 — сумма цифр", "сумма цифр" in hint(page), hint(page))
    fill(page, "#fdiv", 7)
    tap(page, "#goBtn")
    fill(page, "#fquot", 1)
    tap(page, "#goBtn")
    col = page.inner_text("#work")
    check("C2: столбик 84 доведён до 1, под ним разложение",
          "84 = 2 · 2 · 3 · 7" in col and st(page)["S"]["cur"] == 1, col)
    check("C2: после разложения подсказка со степенью", "2² · 3 · 7" in hint(page), hint(page))
    # столбик 60 через клавиатуру: 2, 30, 2, 15, 3, 5, 5, 1
    for v in ["2", "30", "2", "15", "3", "5", "5", "1"]:
        for ch in v:
            page.click(f'#keypadButtons button[data-key="{ch}"]')
        page.click('#keypadButtons button[data-key="enter"]')
    s = st(page)["S"]
    check("C2: второе число разложено с экранной клавиатуры", s["step"] == "pick" and s["facts"] == [[2, 2, 3, 7], [2, 2, 3, 5]], str(s.get("facts")))
    tap(page, '#work .chip[data-r="0"][data-k="3"]')   # 7
    check("C2: 7 не общий множитель", "нет множителя 7" in hint(page), hint(page))
    tap(page, '#work .chip[data-r="1"][data-k="0"]')   # двойка из второй строки
    tap(page, '#work .chip[data-r="0"][data-k="1"]')   # вторая двойка из первой
    s = st(page)["S"]
    check("C2: двойки встают в пары по одной", len(s["groups"]) == 2
          and sorted(g["idx"][0] for g in s["groups"]) == [0, 1] and sorted(g["idx"][1] for g in s["groups"]) == [0, 1], str(s["groups"]))
    tap(page, "#doneBtn")
    check("C2: выбраны не все — не пропускает", st(page)["S"]["step"] == "pick" and "ещё 1" in hint(page), hint(page))
    tap(page, '#work .chip[data-r="1"][data-k="2"]')   # 3
    tap(page, '#work .chip[data-r="0"][data-k="0"]')   # снять двойку
    check("C2: повторное касание снимает пару", len(st(page)["S"]["groups"]) == 2)
    tap(page, '#work .chip[data-r="0"][data-k="0"]')
    tap(page, "#doneBtn")
    check("C2: «НОД = 2 · 2 · 3 = ?»", "2 · 2 · 3" in page.inner_text("#prompt"), page.inner_text("#prompt"))
    fill(page, "#ans", 10)
    tap(page, "#goBtn")
    check("C2: неверное произведение", "Перемножь" in hint(page) and st(page)["S"]["phase"] == "solve", hint(page))
    fill(page, "#ans", 12)
    tap(page, "#goBtn")
    check("C2: НОД(84, 60) = 12", "НОД(84, 60) = 2 · 2 · 3 = 12" in page.inner_text("#work"), page.inner_text("#work"))

    # раздел 2, уровень 1 — задание из учебника: a = 2·3·3·5·5·5·11, b = 3·5·5·7
    set_task(page, 1, [2 * 3 * 3 * 5 * 5 * 5 * 11, 3 * 5 * 5 * 7], given=[[2, 3, 3, 5, 5, 5, 11], [3, 5, 5, 7]])
    tl = page.inner_text("#taskLine")
    check("C2: условие из учебника построчно", "a = 2 · 3 · 3 · 5 · 5 · 5 · 11" in tl and "b = 3 · 5 · 5 · 7" in tl, tl)
    for k in (3, 4, 5):
        tap(page, f'#work .chip[data-r="0"][data-k="{k}"]')
    check("C2: третья пятёрка у b лишняя", "все множители 5 уже взяты в пару" in hint(page) and len(st(page)["S"]["groups"]) == 2, hint(page))
    tap(page, '#work .chip[data-r="0"][data-k="1"]')
    tap(page, "#doneBtn")
    fill(page, "#ans", 75)
    tap(page, "#goBtn")
    check("C2: учебник б) — НОД = 75", "НОД(a, b) = 3 · 5 · 5 = 75" in page.inner_text("#work"), page.inner_text("#work"))

    # взаимно простые: 8 и 15
    set_task(page, 1, [8, 15], given=[[2, 2, 2], [3, 5]])
    tap(page, "#doneBtn")
    check("C2: общих нет — «взаимно простые»", "взаимно простые" in page.inner_text("#prompt"))
    fill(page, "#ans", 0)
    tap(page, "#goBtn")
    fill(page, "#ans", 1)
    tap(page, "#goBtn")
    check("C2: НОД(8, 15) = 1", st(page)["S"]["phase"] == "done" and st(page)["S"]["errTotal"] == 1)

    # раздел 3: 48 и 18
    set_task(page, 2, [48, 18])
    fill(page, "#eq", 3)
    fill(page, "#er", 0)
    tap(page, "#goBtn")
    check("C3: частное велико — «уже больше 48»", "54" in hint(page) and "больше 48" in hint(page), hint(page))
    fill(page, "#eq", 2)
    fill(page, "#er", 30)
    tap(page, "#goBtn")
    check("C3: остаток больше делителя", "меньше делителя 18" in hint(page), hint(page))
    fill(page, "#eq", 2)
    fill(page, "#er", 12)
    tap(page, "#goBtn")
    check("C3: этап «что делим на что»", st(page)["S"]["step"] == "pair")
    fill(page, "#ex", 48)
    fill(page, "#ey", 12)
    tap(page, "#goBtn")
    check("C3: не та пара", "делитель (18) на остаток (12)" in hint(page), hint(page))
    # пара и следующая строка с клавиатуры: Ввод в первом поле переводит во второе
    page.focus("#ex")
    for ch in "18":
        page.click(f'#keypadButtons button[data-key="{ch}"]')
    page.click('#keypadButtons button[data-key="enter"]')
    focused = page.evaluate("() => document.activeElement.id")
    for ch in "12":
        page.click(f'#keypadButtons button[data-key="{ch}"]')
    page.click('#keypadButtons button[data-key="enter"]')
    check("D: «Ввод» на клавиатуре переводит ко второму полю, потом проверяет",
          focused == "ey" and st(page)["S"]["step"] == "div", focused)
    fill(page, "#eq", 1)
    fill(page, "#er", 6)
    tap(page, "#goBtn")
    fill(page, "#ex", 12)
    fill(page, "#ey", 6)
    tap(page, "#goBtn")
    fill(page, "#eq", 2)
    fill(page, "#er", 0)
    tap(page, "#goBtn")
    fill(page, "#ans", 0)
    tap(page, "#goBtn")
    check("C3: ноль вместо НОД — объяснено", "последний НЕнулевой" in hint(page), hint(page))
    fill(page, "#ans", 6)
    tap(page, "#goBtn")
    work = re.sub(r"\s+", " ", page.inner_text("#work"))
    check("C3: цепочка как в теории, НОД(48, 18) = 6",
          "48 ÷ 18 = 2 (остаток 12)" in work and "18 ÷ 12 = 1 (остаток 6)" in work
          and "12 ÷ 6 = 2 (остаток 0)" in work and "НОД(48, 18) = 6" in work, work)

    # три числа: 80, 140, 56
    set_task(page, 2, [80, 140, 56])
    page.wait_for_timeout(50)
    for q, r in [(1, 60)]:
        fill(page, "#eq", q)
        fill(page, "#er", r)
        tap(page, "#goBtn")
    for x, y, q, r in [(80, 60, 1, 20), (60, 20, 3, 0)]:
        fill(page, "#ex", x)
        fill(page, "#ey", y)
        tap(page, "#goBtn")
        fill(page, "#eq", q)
        fill(page, "#er", r)
        tap(page, "#goBtn")
    fill(page, "#ans", 20)
    tap(page, "#goBtn")
    pr = page.inner_text("#prompt")
    check("C3: три числа — после НОД(80, 140) = 20 ищем НОД(20, 56)",
          "НОД(80, 140) = 20" in pr and "НОД(20, 56)" in pr and "56 ÷ 20" in pr, pr)
    for x, y, q, r in [(None, None, 2, 16), (20, 16, 1, 4), (16, 4, 4, 0)]:
        if x:
            fill(page, "#ex", x)
            fill(page, "#ey", y)
            tap(page, "#goBtn")
        fill(page, "#eq", q)
        fill(page, "#er", r)
        tap(page, "#goBtn")
    fill(page, "#ans", 4)
    tap(page, "#goBtn")
    check("C3: НОД(80, 140, 56) = 4", "НОД(80, 140, 56) = 4" in page.inner_text("#work"), page.inner_text("#work"))

    # «Экзамен»: подсказки короткие
    set_task(page, 0, [12, 18], exam=True)
    fill(page, "#ans", "5")
    tap(page, "#goBtn")
    check("C: в «Экзамене» подсказка короткая", hint(page) == "5 — не делитель 12.", hint(page))
    set_task(page, 2, [48, 18], exam=True)
    fill(page, "#eq", 3)
    fill(page, "#er", 0)
    tap(page, "#goBtn")
    check("C: в «Экзамене» без разбора частного", hint(page) == "Неполное частное неверно.", hint(page))

    # D. отмена шага
    set_task(page, 1, [84, 60])
    fill(page, "#fdiv", 2)
    tap(page, "#goBtn")
    fill(page, "#fquot", 42)
    tap(page, "#goBtn")
    rows_before = st(page)["S"]["cols"][0]["rows"]
    tap(page, "#undoBtn")
    s = st(page)["S"]
    check("D: «←» отменяет последний шаг", rows_before == [84, 42] and s["cols"][0]["rows"] == [84] and s["sub"] == "quot"
          and page.query_selector("#fquot") is not None, str(s["cols"][0]))
    set_task(page, 0, [12, 18])
    page.focus("#ans")
    for ch in ["1", ",", "2", ",", "3"]:
        page.click(f'#keypadButtons button[data-key="{ch}"]')
    typed = page.input_value("#ans")
    page.click('#keypadButtons button[data-key="enter"]')
    check("D: запятая на клавиатуре — список «1, 2, 3»", typed == "1, 2, 3" and st(page)["S"]["divs"][0] == [1, 2, 3], typed)
    check("C/D: без ошибок JS", not errors, str(errors[:1]))
    ctx.close()


# ─── E. совместная сессия ───
def test_session(browser):
    ctx = browser.new_context(viewport={"width": 1300, "height": 1000})
    errors = []

    def mk(url):
        page = ctx.new_page()
        page.route("**/supabase-js.umd.js", lambda route: route.fulfill(
            status=200, content_type="application/javascript", body=FAKE_LIB))
        page.route("**/fonts.googleapis.com/**", lambda route: route.abort())
        page.route("**/fonts.gstatic.com/**", lambda route: route.abort())
        page.on("pageerror", lambda e: errors.append(str(e)))
        page.goto(f"{BASE}/{url}")
        page.wait_for_function("() => window.__trainerState")
        return page

    teacher = mk("gcd.html")
    teacher.wait_for_function("() => window.TrainerSession && window.TrainerSession.getCode()", timeout=10000)
    code = teacher.evaluate("() => window.TrainerSession.getCode()")
    go_section(teacher, 1, 2)
    teacher.wait_for_timeout(500)
    student = mk(f"gcd.html?s={code}")
    student.wait_for_timeout(2000)
    t, s = st(teacher), st(student)
    check("E: ученик на том же разделе, уровне и примере",
          s["curSection"] == 1 and s["curLevel"] == 2 and s["P"] == t["P"], f"{s['curSection']} {s['curLevel']}")
    check("E: у ученика теория и кнопки раздела 2",
          "Способ 2" in student.inner_text("#secTheory")
          and student.get_attribute('#sections .lvl[data-sec="1"]', "class").count("active") == 1)
    # учитель делает шаг — у ученика тот же столбик
    m = t["S"]["cols"][0]["rows"][-1]
    fill(teacher, "#fdiv", smallest_prime(m))
    tap(teacher, "#goBtn")
    teacher.wait_for_timeout(900)
    check("E: шаг учителя доехал до ученика", st(student)["S"] == st(teacher)["S"]
          and student.query_selector("#fquot") is not None)
    # ученик отвечает — доезжает до учителя
    fill(student, "#fquot", m // smallest_prime(m))
    tap(student, "#goBtn")
    student.wait_for_timeout(900)
    check("E: шаг ученика доехал до учителя", st(teacher)["S"] == st(student)["S"]
          and st(teacher)["S"]["cols"][0]["rows"][-1] == m // smallest_prime(m))
    # смена раздела у учителя
    go_section(teacher, 2, 0)
    teacher.wait_for_timeout(900)
    check("E: смена раздела у учителя доехала", st(student)["curSection"] == 2 and st(student)["P"] == st(teacher)["P"]
          and "Способ 3" in student.inner_text("#secTheory"))
    check("E: без ошибок JS", not errors, str(errors[:1]))
    ctx.close()


# ─── F. карточка «+1» ───
def test_card(browser):
    ctx, page, errors = open_page(browser, fake=True)
    go_section(page, 2, 1)
    page.click("#addRailToggle")
    page.click('.add-qty-btn[data-n="1"]')
    page.wait_for_function("""() => { const f = document.querySelector('.tm-card iframe');
        try { const s = f && f.contentWindow.__trainerState && f.contentWindow.__trainerState.get();
              return !!(s && s.P); } catch (e) { return false; } }""", timeout=10000)
    frame = next(f for f in page.frames if "card=1" in f.url)
    cs = frame.evaluate("() => window.__trainerState.get()")
    check("F: карточка того же раздела и уровня", cs["curSection"] == 2 and cs["curLevel"] == 1, f"{cs['curSection']} {cs['curLevel']}")
    vis = frame.evaluate("""() => ({
        task: document.getElementById('taskLine').offsetParent !== null,
        work: document.getElementById('work').offsetParent !== null,
        sections: document.getElementById('sections').offsetParent !== null,
        theory: document.getElementById('secTheory').offsetParent !== null,
        desc: document.getElementById('lvlDesc').offsetParent !== null,
    })""")
    check("F: в карточке только задание (без разделов, теории, описания уровня)",
          vis == {"task": True, "work": True, "sections": False, "theory": False, "desc": False}, str(vis))
    check("F: без ошибок JS", not errors, str(errors[:1]))
    ctx.close()


# ─── G. подборка, каталог, панель досок ───
def test_catalog(browser):
    ctx, page, errors = open_page(browser)
    page.evaluate("() => localStorage.removeItem('ogeBasket:v1')")
    go_section(page, 2, 0)
    nums = st(page)["P"]["nums"]
    tap(page, "#basketAddBtn")
    items = page.evaluate("() => window.Basket.all ? window.Basket.all() : JSON.parse(localStorage.getItem('ogeBasket:v1') || '[]')")
    items = items if isinstance(items, list) else items.get("items", [])
    last = items[-1] if items else {}
    check("G: «В подборку» уносит условие", bool(items) and f"НОД({nums[0]}, {nums[1]})" in (last.get("text") or "")
          and last.get("trainerId") == "gcd" and "евклида" in (last.get("modeTitle") or ""), str(last)[:200])
    ctx.close()

    ctx = browser.new_context(viewport={"width": 1300, "height": 1000})
    page = ctx.new_page()
    page.route("https://**/*", lambda route: route.abort())
    page.goto(f"{BASE}/index.html")
    page.wait_for_timeout(500)
    page.click('.nav-tab[data-id="grades"]')
    page.click('.nav-subtab[data-id="g6"]')
    page.wait_for_timeout(300)
    link = page.query_selector('a.topic-item[href="gcd.html"]')
    check("G: на главной в «6 класс» есть НОД", link is not None and "Наибольший общий делитель" in link.inner_text())
    if link:
        link.click()
        page.wait_for_function("() => window.__trainerState")
        check("G: ссылка с главной открывает тренажёр", page.url.endswith("gcd.html"))
    ctx.close()

    src = open(os.path.join(HERE, "boards-core.js"), encoding="utf-8").read()
    check("G: доски — НОД в панели тренажёров, снимке задания и названиях",
          "href:'gcd.html'" in src and re.search(r"gcd:\s*\[ \{ sel:'#taskLine' \} \]", src) is not None
          and "gcd:'Наибольший общий делитель (НОД)'" in src)


# ─── H. телефон ───
CLIP_JS = """() => { const out = [];
  document.querySelectorAll('h1, .sub, .stats, .levels, .lvl-desc, .theory, .hint').forEach(e => {
    const cs = getComputedStyle(e);
    if (cs.display === 'none' || e.offsetParent === null) return;
    if (cs.overflow === 'hidden' && e.scrollHeight > e.clientHeight + 2)
      out.push((e.id || String(e.className).split(' ').join('.')) + ' ' + e.clientHeight + '/' + e.scrollHeight);
  });
  return out; }"""
OVERFLOW_JS = "() => document.documentElement.scrollWidth - window.innerWidth"


def test_phone(browser):
    for width in (375, 320):
        ctx, page, errors = open_page(browser, width=width, height=800)
        bad = []
        screens = []
        for sec in range(3):
            for lvl in range(4):
                go_section(page, sec, lvl)
                page.wait_for_timeout(450)
                screens.append((f"{sec + 1}.{lvl + 1}", page.evaluate(OVERFLOW_JS), page.evaluate(CLIP_JS)))
        # разложение трёх чисел в середине: три столбика рядом
        set_task(page, 1, [170, 306, 255])
        for v in (2, 85, 5, 17, 17, 1, 2, 153, 3, 51, 3, 17):
            sel = "#fdiv" if page.query_selector("#fdiv") else "#fquot"
            fill(page, sel, v)
            tap(page, "#goBtn")
        page.wait_for_timeout(400)
        screens.append(("разложение трёх чисел", page.evaluate(OVERFLOW_JS), page.evaluate(CLIP_JS)))
        set_task(page, 1, [2 * 3 * 3 * 5 * 7 * 19, 2 * 3 * 11 * 13], given=[[2, 2, 3, 3, 5, 7, 19], [2, 3, 11, 13]])
        page.wait_for_timeout(300)
        screens.append(("учебник а)", page.evaluate(OVERFLOW_JS), page.evaluate(CLIP_JS)))
        bad = [(n, o, c) for n, o, c in screens if o > 0 or c]
        check(f"H: {width}px — без прокрутки вбок и обрезанных блоков", not bad, str(bad))
        check(f"H: {width}px — без ошибок JS", not errors, str(errors[:1]))
        ctx.close()


def run():
    with local_server(), sync_playwright() as p:
        browser = p.chromium.launch()
        test_generators(browser)
        test_solve_all(browser)
        test_errors(browser)
        test_session(browser)
        test_card(browser)
        test_catalog(browser)
        test_phone(browser)
        browser.close()
    bad = [n for n, ok in results if not ok]
    print()
    if bad:
        print(f"ПРОВАЛЫ ({len(bad)} из {len(results)}):")
        for n in bad:
            print("  -", n)
        sys.exit(1)
    print(f"ИТОГ: всё прошло ({len(results)} проверок)")


if __name__ == "__main__":
    run()
