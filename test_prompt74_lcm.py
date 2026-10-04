"""
Промпт №74: новый тренажёр «Наименьшее общее кратное (НОК)» — lcm.html,
по образу НОД (gcd.html, промпт №65).

Три раздела: перебор кратных, разложение на простые множители (берём все
множители первого числа и дописываем недостающие), НОК через НОД (формула
НОК = a · b : НОД, обратная задача НОД · НОК = a · b, три числа по очереди).
В каждом — краткая теория, четыре уровня и «Экзамен».

Проверяет:
  A. генераторы: 300 заданий на каждый уровень каждого раздела укладываются в
     обещанное (диапазон чисел, потолок НОК и длины строки кратных, три числа —
     НОК первых двух меньше общего, ловушки «взаимно простые» и «кратные»
     только там, где обещаны); примеры из теории считаются верно;
  B. каждый уровень каждого раздела решается через интерфейс до конца;
  C. проверка каждого шага и подсказки: не кратное, рано «Хватит», пропуск,
     не общее, не наименьшее, по одному на уровне 1; составной делитель,
     первая строка, лишний множитель (меньшая степень), не все дописаны,
     неверное произведение, три строки; не общий / не наибольший / слишком
     большой НОД, неверное деление, «перемножил и не разделил», три числа,
     обратная задача на b и на НОД; короткие подсказки в «Экзамене»;
     «ответ сразу» и ответ для доски (C4);
  D. «отменить шаг», запятая и «Ввод» на экранной клавиатуре;
  E. совместная сессия (заглушка Supabase из теста №54);
  F. карточка «+1»: тот же раздел и уровень, видно только задание;
  G. «В подборку», каталог на главной (6 класс, рядом с НОД), панель досок;
  H. телефон 375 и 320 px: без прокрутки вбок и обрезанных блоков.

Живой realtime из песочницы не проверить — совместный режим перепроверяется
на сайте руками.

Запуск: python3 test_prompt74_lcm.py (сервер поднимается сам).
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

PORT = 8995
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


def open_page(browser, width=1300, height=1000, fake=False, url="lcm.html"):
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
def lcm(a, b):
    return a // gcd(a, b) * b


def lcm_all(a):
    r = a[0]
    for x in a[1:]:
        r = lcm(r, x)
    return r


def extras_of(facts):
    """Недостающие множители по строкам: (строка, множитель) — сколько раз p
    в строке больше, чем в любой строке выше."""
    out = []
    for r in range(1, len(facts)):
        for p in sorted(set(facts[r])):
            cov = max(facts[j].count(p) for j in range(r))
            out += [(r, p)] * max(0, facts[r].count(p) - cov)
    return out


def answer_of(P):
    if P.get("inv") == "b":
        return P["nums"][1]
    if P.get("inv") == "g":
        return gcd(P["nums"][0], P["nums"][1])
    return lcm_all(P["nums"])


def solve_current(page):
    """Решить текущий пример правильными ответами, нажимая то же, что ученик."""
    for _ in range(400):
        s = st(page)
        P, S = s["P"], s["S"]
        if S["phase"] == "done":
            return True
        sec = P["sec"]
        L = lcm_all(P["nums"])
        if sec == 0:
            if S["step"] == "mults":
                n = P["nums"][S["cur"]]
                mults = list(range(n, L + 1, n))
                if P["lvl"] == 0:
                    for m in mults:
                        fill(page, "#ans", m)
                        tap(page, "#goBtn")
                else:
                    fill(page, "#ans", ", ".join(map(str, mults)))
                    tap(page, "#goBtn")
                tap(page, "#doneBtn")
            elif S["step"] == "common":
                tap(page, f'#work .dv-row:first-child .chip[data-v="{L}"]')
                tap(page, "#doneBtn")
            else:
                fill(page, "#ans", L)
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
                for r, p in extras_of(facts):
                    used = {q["k"] for q in st(page)["S"]["picks"] if q["r"] == r}
                    k = next(j for j, x in enumerate(facts[r]) if x == p and j not in used)
                    tap(page, f'#work .chip[data-r="{r}"][data-k="{k}"]')
                tap(page, "#doneBtn")
            else:
                fill(page, "#ans", L)
                tap(page, "#goBtn")
        elif P.get("inv"):
            a, b = P["nums"]
            g = gcd(a, b)
            if S["step"] == "prod":
                fill(page, "#lp", g * lcm(a, b) if P["inv"] == "b" else a * b)
            else:
                fill(page, "#lr", answer_of(P))
            tap(page, "#goBtn")
        else:
            c = S["chains"][S["ch"]]
            if S["step"] == "gcd":
                fill(page, "#lg", gcd(c["a"], c["b"]))
            elif S["step"] == "div":
                fill(page, "#lk", c["a"] // c["g"])
            else:
                fill(page, "#ll", c["k"] * c["b"])
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


def divides_any(nums):
    return any(i != j and y % x == 0 for i, x in enumerate(nums) for j, y in enumerate(nums))


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
    # (сколько чисел, от, до, потолок НОК, потолок длины строки кратных)
    rules = {
        "0:0": (2, 2, 12, 60, 6), "0:1": (2, 3, 20, None, 10), "0:2": (2, 12, 40, 250, 12), "0:3": (3, 2, 15, 120, 12),
        "1:1": (2, 12, 150, 3000, None), "1:2": (2, 100, 999, 20000, None), "1:3": (3, 12, 200, 6000, None),
        "2:0": (2, 10, 99, 1000, None), "2:1": (2, 12, 100, 2500, None), "2:2": (2, 6, 60, 600, None), "2:3": (3, 4, 40, 1000, None),
    }
    for key, items in data.items():
        bad = []
        coprime = multiple = inv_g = 0
        for it in items:
            nums = it["nums"]
            L = lcm_all(nums)
            if gcd_all(nums) == 1 and len(nums) == 2:
                coprime += 1
            if divides_any(nums):
                multiple += 1
            if key == "1:0":
                a, b = it["given"]
                pa = eval("*".join(map(str, a)))
                pb = eval("*".join(map(str, b)))
                if nums != [pa, pb] or a != sorted(a) or b != sorted(b) \
                        or any(factorize(x) != [x] for x in a + b) or pa % pb == 0 or pb % pa == 0 or L > 6000:
                    bad.append(it)
                continue
            cnt, lo, hi, maxL, maxK = rules[key]
            if len(nums) != cnt or len(set(nums)) != cnt or not all(lo <= x <= hi for x in nums):
                bad.append(it)
                continue
            if maxL and L > maxL or maxK and L // min(nums) > maxK:
                bad.append(it)
            if cnt == 3 and lcm(nums[0], nums[1]) == L:
                bad.append(it)
            if key != "0:1" and divides_any(nums):
                bad.append(it)
            if cnt == 2 and gcd_all(nums) == 1 and key not in ("0:1", "1:1", "2:1"):
                bad.append(it)
            if key.startswith("1:") and not all(len(factorize(x)) >= 3 for x in nums):
                bad.append(it)
            if key.startswith("1:") and nums != sorted(nums, reverse=True):
                bad.append(it)
            if key == "2:0" and not (it.get("gGiven") and gcd_all(nums) >= 4):
                bad.append(it)
            if key == "2:2":
                if it.get("inv") not in ("b", "g"):
                    bad.append(it)
                inv_g += it.get("inv") == "g"
            if key == "2:3" and (gcd(nums[0], nums[1]) < 2 or gcd(lcm(nums[0], nums[1]), nums[2]) < 2):
                bad.append(it)
        check(f"A: генератор {key} — 300 заданий по правилам уровня", not bad, str(bad[:2]))
        if key in ("1:1", "2:1"):
            check(f"A: генератор {key} — взаимно простые попадаются, но редко", 8 <= coprime <= 80, str(coprime))
        if key == "0:1":
            check("A: уровень 1.2 — и взаимно простые, и кратные друг другу, но не больше трети",
                  15 <= coprime <= 100 and 15 <= multiple <= 100, f"{coprime} {multiple}")
        if key == "2:2":
            check("A: обратная задача — и «найди b», и «найди НОД»", 50 <= inv_g <= 170, str(inv_g))
    ex = page.evaluate("""() => ({
        a: lcmAll([4, 6]), b: lcmAll([90, 84]), c: lcmAll([24, 36]), d: lcmAll([6, 8, 9]),
        e: extrasOf([[2,3,3,5],[2,2,3,7]]), f: extrasOf([[2,2,3],[2,3,3],[2,2,2,5]]),
        g: lcmAll([24, 8]), h: lcmAll([8, 15]),
    })""")
    check("A: примеры из теории считаются верно",
          ex == {"a": 12, "b": 1260, "c": 72, "d": 72, "e": [2, 7], "f": [2, 3, 5], "g": 24, "h": 120}, str(ex))
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
                P = st(page)["P"]
                ok = solve_current(page)
                s = st(page)["S"]
                word = ("b =" if P.get("inv") == "b" else "НОД") if P.get("inv") else "НОК"
                ok = ok and s["errTotal"] == 0 and int(page.inner_text("#stSolved")) == before + 1 \
                    and page.is_visible("#nextBtn") and word in page.inner_text("#work") \
                    and str(answer_of(P)) in page.inner_text("#work .lcm-result")
                ok_all = ok_all and ok
                tap(page, "#nextBtn")
            check(f"B: раздел {sec + 1}, уровень {lvl + 1 if lvl < 4 else 'Экзамен'} решается без ошибок", ok_all)
    check("B: серия без ошибок — все 36 примеров", page.evaluate("() => document.getElementById('stStreak').textContent") == "36")
    check("B: без ошибок JS", not errors, str(errors[:1]))
    ctx.close()


def set_task(page, sec, nums, given=None, exam=False, lvl=1, **extra):
    """Подставить конкретное задание вместо случайного."""
    page.evaluate("""([sec, nums, given, exam, lvl, extra]) => {
        curSection = sec; renderSections(); renderTheory(); renderLevels();
        P = Object.assign({ sec, lvl: exam ? 4 : lvl, base: lvl, nums }, extra);
        if (given) P.given = given;
        S = initState(P);
        setHint(''); renderAll();
    }""", [sec, nums, given, exam, lvl, extra])


def work(page):
    return re.sub(r"\s+", " ", page.inner_text("#work"))


# ─── C. проверка шагов и подсказки ───
def test_errors(browser):
    ctx, page, errors = open_page(browser)
    # раздел 1: 4 и 6 (пример из теории)
    set_task(page, 0, [4, 6])
    pr = page.inner_text("#prompt")
    check("C1: подсказка — выписывать, пока не появится делящееся на другое число", "делится и на 6" in pr, pr)
    fill(page, "#ans", "4, 8, 10")
    tap(page, "#goBtn")
    s = st(page)["S"]
    check("C1: не кратное отклонено, верные записаны", s["mults"][0] == [4, 8] and s["errTotal"] == 1
          and "10 — не кратно 4" in hint(page) and "остаток 2" in hint(page), hint(page))
    tap(page, "#doneBtn")
    check("C1: рано «Хватит» — ни одно не делится на 6", st(page)["S"]["cur"] == 0
          and "не делится на 6" in hint(page), hint(page))
    fill(page, "#ans", "16")
    tap(page, "#goBtn")
    tap(page, "#doneBtn")
    check("C1: пропуск в строке — «пропущено кратное 4 · 3 = 12»", st(page)["S"]["cur"] == 0
          and "4 · 3 = 12" in hint(page), hint(page))
    fill(page, "#ans", "12")
    tap(page, "#doneBtn")          # «Хватит» с набранным — сначала добавляет
    check("C1: «Хватит» забирает набранное и переходит ко второму числу", st(page)["S"]["cur"] == 1)
    fill(page, "#ans", "6, 12, 18, 24")
    tap(page, "#goBtn")
    tap(page, "#doneBtn")
    check("C1: этап общих кратных", st(page)["S"]["step"] == "common")
    tap(page, '#work .dv-row:nth-child(2) .chip[data-v="18"]')
    check("C1: 18 — не общее, объяснено", "18 нет среди кратных 4" in hint(page) and st(page)["S"]["common"] == [], hint(page))
    tap(page, '#work .dv-row:first-child .chip[data-v="12"]')
    marked = page.evaluate("() => [...document.querySelectorAll('#work .chip.common')].length")
    check("C1: общее кратное отмечается в обеих строках", marked == 2, str(marked))
    tap(page, "#doneBtn")
    check("C1: 12 — единственное общее среди выписанных (у 4 строка до 16)", st(page)["S"]["step"] == "answer")
    fill(page, "#ans", 24)
    tap(page, "#goBtn")
    check("C1: 24 не отмечено — «нужно наименьшее из отмеченных»", "наименьшее из отмеченных: 12" in hint(page), hint(page))
    fill(page, "#ans", 12)
    tap(page, "#goBtn")
    check("C1: НОК(4, 6) = 12 — решено", st(page)["S"]["phase"] == "done" and "НОК(4, 6) = 12" in work(page))

    # общее, но не наименьшее: строки выписаны дальше НОК
    set_task(page, 0, [4, 6])
    fill(page, "#ans", "4, 8, 12, 16, 20, 24")
    tap(page, "#goBtn")
    tap(page, "#doneBtn")
    fill(page, "#ans", "6, 12, 18, 24")
    tap(page, "#goBtn")
    tap(page, "#doneBtn")
    tap(page, '#work .dv-row:first-child .chip[data-v="12"]')
    tap(page, "#doneBtn")
    check("C1: отмечены не все общие — не пропускает", st(page)["S"]["step"] == "common" and "ещё 1" in hint(page), hint(page))
    tap(page, '#work .dv-row:first-child .chip[data-v="24"]')
    tap(page, "#doneBtn")
    fill(page, "#ans", 24)
    tap(page, "#goBtn")
    check("C1: общее, но не наименьшее", "не наименьшее" in hint(page), hint(page))

    # уровень 1: только по одному
    set_task(page, 0, [4, 6], lvl=0)
    fill(page, "#ans", "4, 8")
    tap(page, "#goBtn")
    s = st(page)["S"]
    check("C1: уровень 1 — список не принимается, просьба вписывать по одному",
          s["mults"][0] == [] and s["errTotal"] == 0 and "по одному" in hint(page)
          and "по одному" in page.inner_text("#prompt"), hint(page))

    # раздел 2: 90 и 84 (пример из теории)
    set_task(page, 1, [90, 84])
    fill(page, "#fdiv", 4)
    tap(page, "#goBtn")
    check("C2: составной делитель — «делим только на простые»", "составное" in hint(page), hint(page))
    for v in [2, 45, 3, 15, 3, 5, 5, 1, 2, 42, 2, 21, 3, 7, 7, 1]:
        fill(page, "#fdiv" if page.query_selector("#fdiv") else "#fquot", v)
        tap(page, "#goBtn")
    s = st(page)["S"]
    check("C2: оба числа разложены", s["step"] == "pick" and s["facts"] == [[2, 3, 3, 5], [2, 2, 3, 7]], str(s.get("facts")))
    tap(page, '#work .chip[data-r="0"][data-k="0"]')
    check("C2: касание первой строки — напоминание, не ошибка", "уже все в НОК" in hint(page) and st(page)["S"]["errTotal"] == 1, hint(page))
    tap(page, '#work .chip[data-r="1"][data-k="2"]')   # тройка у 84
    check("C2: тройка у 84 не нужна — у 90 их две", "у 90 множитель 3 встречается 2 раза" in hint(page)
          and st(page)["S"]["picks"] == [], hint(page))
    tap(page, '#work .chip[data-r="1"][data-k="0"]')   # одна двойка
    tap(page, '#work .chip[data-r="1"][data-k="1"]')   # вторая — лишняя
    check("C2: вторую двойку дописывать не нужно", "уже дописаны" in hint(page) and len(st(page)["S"]["picks"]) == 1, hint(page))
    tap(page, "#doneBtn")
    check("C2: дописаны не все — не пропускает", st(page)["S"]["step"] == "pick" and "ещё 1" in hint(page), hint(page))
    tap(page, '#work .chip[data-r="1"][data-k="0"]')   # снять двойку
    check("C2: повторное касание снимает", st(page)["S"]["picks"] == [])
    tap(page, '#work .chip[data-r="1"][data-k="1"]')
    tap(page, '#work .chip[data-r="1"][data-k="3"]')
    tap(page, "#doneBtn")
    check("C2: «НОК = 90 · 2 · 7 = ?»", "90 · 2 · 7" in page.inner_text("#prompt"), page.inner_text("#prompt"))
    fill(page, "#ans", 1200)
    tap(page, "#goBtn")
    check("C2: неверное произведение", "Проверь умножение" in hint(page) and st(page)["S"]["phase"] == "solve", hint(page))
    fill(page, "#ans", 1260)
    tap(page, "#goBtn")
    check("C2: НОК(90, 84) = 1260", "НОК(90, 84) = 90 · 2 · 7 = 1260" in work(page), work(page))

    # раздел 2, уровень 1: разложенные, произведение всех множителей
    set_task(page, 1, [60, 126], given=[[2, 2, 3, 5], [2, 3, 3, 7]], lvl=0)
    tl = page.inner_text("#taskLine")
    check("C2: условие из учебника построчно", "a = 2 · 2 · 3 · 5" in tl and "b = 2 · 3 · 3 · 7" in tl, tl)
    tap(page, '#work .chip[data-r="1"][data-k="2"]')   # вторая тройка — нужна
    tap(page, '#work .chip[data-r="1"][data-k="3"]')   # семёрка
    tap(page, "#doneBtn")
    fill(page, "#ans", 1260)
    tap(page, "#goBtn")
    check("C2: учебник — НОК(a, b) = 2 · 2 · 3 · 5 · 3 · 7 = 1260", "НОК(a, b) = 2 · 2 · 3 · 5 · 3 · 7 = 1260" in work(page), work(page))

    # три числа: у третьей строки сравниваем с максимумом двух выше
    set_task(page, 1, [12, 18, 40], given=[[2, 2, 3], [2, 3, 3], [2, 2, 2, 5]])
    tap(page, '#work .chip[data-r="2"][data-k="0"]')
    tap(page, '#work .chip[data-r="2"][data-k="1"]')
    check("C2: у 40 из трёх двоек дописываем одну — у a их уже две", len(st(page)["S"]["picks"]) == 1
          and "уже дописаны" in hint(page), hint(page))

    # раздел 3: 24 и 36, НОД ищем сами
    set_task(page, 2, [24, 36], lvl=1)
    fill(page, "#lg", 5)
    tap(page, "#goBtn")
    check("C3: 5 — не общий делитель", "5 — не общий делитель" in hint(page) and "остаток 4" in hint(page), hint(page))
    fill(page, "#lg", 6)
    tap(page, "#goBtn")
    check("C3: 6 — общий, но не наибольший", "не наибольший" in hint(page), hint(page))
    fill(page, "#lg", 30)
    tap(page, "#goBtn")
    check("C3: НОД больше меньшего числа", "больше меньшего" in hint(page), hint(page))
    fill(page, "#lg", 12)
    tap(page, "#goBtn")
    fill(page, "#lk", 3)
    tap(page, "#goBtn")
    check("C3: неверное деление", "24 : 12" in hint(page) and st(page)["S"]["step"] == "div", hint(page))
    fill(page, "#lk", 2)
    tap(page, "#goBtn")
    fill(page, "#ll", 864)
    tap(page, "#goBtn")
    check("C3: перемножил сами числа — «ещё делить на НОД»", "произведение самих чисел" in hint(page), hint(page))
    fill(page, "#ll", 72)
    tap(page, "#goBtn")
    w = work(page)
    check("C3: запись как в теории, НОК(24, 36) = 72",
          "НОД(24, 36) = 12" in w and "24 : 12 = 2" in w and "НОК(24, 36) = 2 · 36 = 72" in w, w)

    # уровень 1 — НОД дан в условии
    set_task(page, 2, [24, 36], lvl=0, gGiven=True)
    check("C3: НОД из условия — сразу деление", st(page)["S"]["step"] == "div"
          and "НОД(24, 36) = 12" in page.inner_text("#taskLine") and page.query_selector("#lk") is not None)

    # взаимно простые
    set_task(page, 2, [8, 15], lvl=1)
    fill(page, "#lg", 1)
    tap(page, "#goBtn")
    check("C3: НОД = 1 — подсказка про взаимно простые", "взаимно простые" in page.inner_text("#prompt"))

    # три числа: 24, 36, 10
    set_task(page, 2, [24, 36, 10], lvl=3)
    for sel, v in [("#lg", 12), ("#lk", 2), ("#ll", 72)]:
        fill(page, sel, v)
        tap(page, "#goBtn")
    pr = page.inner_text("#prompt")
    check("C3: три числа — после НОК(24, 36) = 72 ищем НОК(72, 10)", "НОК(24, 36) = 72" in pr and "НОД(72, 10)" in pr, pr)
    for sel, v in [("#lg", 2), ("#lk", 36), ("#ll", 360)]:
        fill(page, sel, v)
        tap(page, "#goBtn")
    check("C3: НОК(24, 36, 10) = 360", "НОК(24, 36, 10) = 360" in work(page), work(page))

    # обратная задача: найти b
    set_task(page, 2, [18, 24], lvl=2, inv="b")
    tl = page.inner_text("#taskLine")
    check("C3: обратная задача — условие столбиком", "a = 18" in tl and "НОД(a, b) = 6" in tl and "НОК(a, b) = 72" in tl, tl)
    fill(page, "#lp", 430)
    tap(page, "#goBtn")
    check("C3: неверное произведение НОД · НОК", "6 · 72" in hint(page), hint(page))
    fill(page, "#lp", 432)
    tap(page, "#goBtn")
    fill(page, "#lr", 23)
    tap(page, "#goBtn")
    check("C3: неверное деление", "432 : 18" in hint(page), hint(page))
    fill(page, "#lr", 24)
    tap(page, "#goBtn")
    check("C3: b = 432 : 18 = 24", "b = 432 : 18 = 24" in work(page) and st(page)["S"]["phase"] == "done", work(page))
    # найти НОД
    set_task(page, 2, [18, 24], lvl=2, inv="g")
    fill(page, "#lp", 432)
    tap(page, "#goBtn")
    fill(page, "#lr", 6)
    tap(page, "#goBtn")
    check("C3: НОД = 432 : 72 = 6", "НОД = 432 : 72 = 6" in work(page), work(page))

    # «Экзамен»: подсказки короткие
    set_task(page, 0, [4, 6], exam=True)
    fill(page, "#ans", "10")
    tap(page, "#goBtn")
    check("C: в «Экзамене» подсказка короткая", hint(page) == "10 — не кратно 4.", hint(page))
    set_task(page, 2, [24, 36], exam=True)
    fill(page, "#lg", 6)
    tap(page, "#goBtn")
    check("C: в «Экзамене» без разбора НОД", hint(page) == "НОД найден неверно.", hint(page))

    # D. отмена шага и клавиатура
    set_task(page, 2, [24, 36])
    fill(page, "#lg", 12)
    tap(page, "#goBtn")
    tap(page, "#undoBtn")
    s = st(page)["S"]
    check("D: «←» отменяет последний шаг", s["step"] == "gcd" and s["chains"][0]["g"] is None
          and page.query_selector("#lg") is not None, str(s["chains"]))
    set_task(page, 0, [4, 6])
    page.focus("#ans")
    for ch in ["4", ",", "8", ",", "1", "2"]:
        page.click(f'#keypadButtons button[data-key="{ch}"]')
    typed = page.input_value("#ans")
    page.click('#keypadButtons button[data-key="enter"]')
    check("D: запятая на клавиатуре — список «4, 8, 12»", typed == "4, 8, 12" and st(page)["S"]["mults"][0] == [4, 8, 12], typed)
    check("C/D: без ошибок JS", not errors, str(errors[:1]))
    ctx.close()


# ─── C4. ответ сразу ───
def test_quick(browser):
    ctx, page, errors = open_page(browser)
    set_task(page, 2, [18, 24], lvl=2, inv="b")
    page.wait_for_timeout(400)          # панель следит за P раз в 250 мс
    lab = page.inner_text(".qa-panel")
    check("C4: «ответ сразу» в обратной задаче спрашивает b", "b =" in lab, lab)
    set_task(page, 0, [4, 6])
    page.wait_for_timeout(400)
    lab = page.inner_text(".qa-panel")
    check("C4: обычно — «НОК =»", "НОК =" in lab, lab)
    info = page.evaluate("() => window.__boardTaskInfo(-1)")
    check("C4: доска получает ответ со страницы", info["fields"][0]["value"] == "12" and info["fields"][0]["label"] == "НОК =", str(info))
    check("C4: без ошибок JS", not errors, str(errors[:1]))
    ctx.close()


# ─── E. совместная сессия ───
def test_session(browser):
    ctx = browser.new_context(viewport={"width": 1300, "height": 1000})
    errors = []

    def mk(url):
        page = ctx.new_page()
        # ученик по ?s= без этого уходит на сцену stage.html (промпт №11 нового
        # списка); здесь проверяется сам тренажёр — «Обычный режим»
        page.add_init_script("try { localStorage.setItem('tsStage:direct', '1'); } catch (e) {}")
        page.route("**/supabase-js.umd.js", lambda route: route.fulfill(
            status=200, content_type="application/javascript", body=FAKE_LIB))
        page.route("**/fonts.googleapis.com/**", lambda route: route.abort())
        page.route("**/fonts.gstatic.com/**", lambda route: route.abort())
        page.on("pageerror", lambda e: errors.append(str(e)))
        page.goto(f"{BASE}/{url}")
        page.wait_for_function("() => window.__trainerState")
        return page

    teacher = mk("lcm.html")
    teacher.wait_for_function("() => window.TrainerSession && window.TrainerSession.getCode()", timeout=10000)
    code = teacher.evaluate("() => window.TrainerSession.getCode()")
    go_section(teacher, 2, 1)
    teacher.wait_for_timeout(500)
    student = mk(f"lcm.html?s={code}")
    student.wait_for_timeout(2000)
    t, s = st(teacher), st(student)
    check("E: ученик на том же разделе, уровне и примере",
          s["curSection"] == 2 and s["curLevel"] == 1 and s["P"] == t["P"], f"{s['curSection']} {s['curLevel']}")
    check("E: у ученика теория раздела 3", "Способ 3" in student.inner_text("#secTheory"))
    a, b = t["P"]["nums"]
    fill(teacher, "#lg", gcd(a, b))
    tap(teacher, "#goBtn")
    teacher.wait_for_timeout(900)
    check("E: шаг учителя доехал до ученика", st(student)["S"] == st(teacher)["S"]
          and student.query_selector("#lk") is not None)
    fill(student, "#lk", a // gcd(a, b))
    tap(student, "#goBtn")
    student.wait_for_timeout(900)
    check("E: шаг ученика доехал до учителя", st(teacher)["S"] == st(student)["S"]
          and st(teacher)["S"]["step"] == "mul")
    go_section(teacher, 0, 0)
    teacher.wait_for_timeout(900)
    check("E: смена раздела у учителя доехала", st(student)["curSection"] == 0 and st(student)["P"] == st(teacher)["P"]
          and "Способ 1" in student.inner_text("#secTheory"))
    check("E: без ошибок JS", not errors, str(errors[:1]))
    ctx.close()


# ─── F. карточка «+1» ───
def test_card(browser):
    ctx, page, errors = open_page(browser, fake=True)
    go_section(page, 1, 2)
    page.click("#addRailToggle")
    page.click('.add-qty-btn[data-n="1"]')
    page.wait_for_function("""() => { const f = document.querySelector('.tm-card iframe');
        try { const s = f && f.contentWindow.__trainerState && f.contentWindow.__trainerState.get();
              return !!(s && s.P); } catch (e) { return false; } }""", timeout=10000)
    frame = next(f for f in page.frames if "card=1" in f.url)
    cs = frame.evaluate("() => window.__trainerState.get()")
    check("F: карточка того же раздела и уровня", cs["curSection"] == 1 and cs["curLevel"] == 2, f"{cs['curSection']} {cs['curLevel']}")
    vis = frame.evaluate("""() => ({
        task: document.getElementById('taskLine').offsetParent !== null,
        work: document.getElementById('work').offsetParent !== null,
        sections: document.getElementById('sections').offsetParent !== null,
        theory: document.getElementById('secTheory').offsetParent !== null,
        desc: document.getElementById('lvlDesc').offsetParent !== null,
    })""")
    check("F: в карточке только задание", vis == {"task": True, "work": True, "sections": False, "theory": False, "desc": False}, str(vis))
    check("F: без ошибок JS", not errors, str(errors[:1]))
    ctx.close()


# ─── G. подборка, каталог, панель досок ───
def test_catalog(browser):
    ctx, page, errors = open_page(browser)
    page.evaluate("() => localStorage.removeItem('ogeBasket:v1')")
    go_section(page, 2, 1)
    nums = st(page)["P"]["nums"]
    tap(page, "#basketAddBtn")
    items = page.evaluate("() => window.Basket.all ? window.Basket.all() : JSON.parse(localStorage.getItem('ogeBasket:v1') || '[]')")
    items = items if isinstance(items, list) else items.get("items", [])
    last = items[-1] if items else {}
    check("G: «В подборку» уносит условие", bool(items) and f"НОК({nums[0]}, {nums[1]})" in (last.get("text") or "")
          and last.get("trainerId") == "lcm" and "через нод" in (last.get("modeTitle") or ""), str(last)[:200])
    ctx.close()

    ctx = browser.new_context(viewport={"width": 1300, "height": 1000})
    page = ctx.new_page()
    page.route("https://**/*", lambda route: route.abort())
    page.goto(f"{BASE}/index.html")
    page.wait_for_timeout(500)
    page.click('.nav-tab[data-id="grades"]')
    page.click('.nav-subtab[data-id="g6"]')
    page.wait_for_timeout(300)
    link = page.query_selector('a.topic-item[href="lcm.html"]')
    gcd_link = page.query_selector('a.topic-item[href="gcd.html"]')
    check("G: на главной в «6 класс» НОК рядом с НОД", link is not None and gcd_link is not None
          and "Наименьшее общее кратное" in link.inner_text()
          and page.evaluate("() => { const a = document.querySelector('a.topic-item[href=\"gcd.html\"]'), b = document.querySelector('a.topic-item[href=\"lcm.html\"]'); return !!(a.compareDocumentPosition(b) & 4); }"))
    if link:
        link.click()
        page.wait_for_function("() => window.__trainerState")
        check("G: ссылка с главной открывает тренажёр", page.url.endswith("lcm.html"))
    ctx.close()

    # каталог панели и карта узлов задания с промпта №15 «работы» — в trainer-tasks.js
    src = "".join(open(os.path.join(HERE, f), encoding="utf-8").read() for f in ("boards-core.js", "trainer-tasks.js"))
    check("G: доски — НОК в панели тренажёров, снимке задания и названиях",
          "href:'lcm.html'" in src and re.search(r"lcm:\s*\[ \{ sel:'#taskLine' \} \]", src) is not None
          and "lcm:'Наименьшее общее кратное (НОК)'" in src)


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
        screens = []
        for sec in range(3):
            for lvl in range(4):
                go_section(page, sec, lvl)
                page.wait_for_timeout(450)
                screens.append((f"{sec + 1}.{lvl + 1}", page.evaluate(OVERFLOW_JS), page.evaluate(CLIP_JS)))
        # длинные строки кратных: 12 клеток у меньшего числа
        set_task(page, 0, [7, 12], lvl=2)
        fill(page, "#ans", ", ".join(str(7 * i) for i in range(1, 13)))
        tap(page, "#goBtn")
        page.wait_for_timeout(400)
        screens.append(("строка из 12 кратных", page.evaluate(OVERFLOW_JS), page.evaluate(CLIP_JS)))
        # три числа через НОД целиком
        set_task(page, 2, [24, 36, 10], lvl=3)
        for sel, v in [("#lg", 12), ("#lk", 2), ("#ll", 72), ("#lg", 2), ("#lk", 36), ("#ll", 360)]:
            fill(page, sel, v)
            tap(page, "#goBtn")
        page.wait_for_timeout(400)
        screens.append(("через НОД, три числа", page.evaluate(OVERFLOW_JS), page.evaluate(CLIP_JS)))
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
        test_quick(browser)
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
