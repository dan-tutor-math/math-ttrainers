"""
Промпт №67: в пошаговых тренажёрах ответ можно вписать сразу, без решения.

Над панелью шагов — панель «Знаешь ответ — впиши сразу» с полем и
«Проверить» (как в ОГЭ). Проверяем на каждом тренажёре (столбики, уравнения,
дроби, НОД и оба движка уравнений в ОГЭ №9):
  1. Панель стоит прямо над панелью шагов и видна сразу, до «Начать».
  2. Верный ответ с первой попытки — зелёным, «решено» +1, серия +1, ★★★,
     появляется «Следующий пример», поле больше не правится.
  3. Первая ошибка — красным, серия обнуляется, можно исправить; верный
     после неё — засчитан, но не на три звезды.
  4. Вторая ошибка — верный ответ подставлен, «решено» не растёт.
  5. Разбор по шагам после ответа сразу второй раз не засчитывается
     (finish() под QuickAnswer.settled).
  6. Решено по шагам без ответа сразу — панель убирается.
  7. Итог в S.quick — уходит собеседнику со снимком S; чужой снимок с
     ответом показывает зелёное поле.
  8. Непонятная запись — подсказка, не ошибка; несокращённая дробь —
     просьба сократить; смешанное число, «нет корней», корни в любом порядке,
     частное и остаток двумя полями.
  9. Карточка «+» (?card=1) — панель тоже есть.

Запуск: python3 test_prompt67_quick_answer.py (сервер поднимается сам).
Совместный режим живьём отсюда не проверить (websocket до Supabase закрыт) —
перепроверьте на сайте руками: ответ ученика у учителя.
"""
import contextlib
import http.client
import json
import subprocess
import sys
import time
from fractions import Fraction
from math import gcd
from functools import reduce

from playwright.sync_api import sync_playwright

PORT = 8972
BASE = f"http://127.0.0.1:{PORT}"


@contextlib.contextmanager
def local_server():
    proc = subprocess.Popen([sys.executable, "-m", "http.server", str(PORT)],
                            stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    try:
        for _ in range(50):
            try:
                conn = http.client.HTTPConnection("127.0.0.1", PORT, timeout=0.2)
                conn.request("GET", "/addition.html")
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


def fmt(x):
    if isinstance(x, Fraction):
        return f"{x.numerator}/{x.denominator}" if x.denominator != 1 else str(x.numerator)
    if float(x) == int(float(x)):
        return str(int(float(x)))
    return str(x).replace(".", ",")


def answer_for(page_name, P):
    """Верный ответ так, как его впишет ученик: список значений по полям."""
    if page_name == "addition":
        return [fmt(P["topVal"] + P["bottomVal"])]
    if page_name == "subtraction":
        return [fmt(P["topVal"] - P["bottomVal"])]
    if page_name == "multiplication":
        return [fmt(P["topVal"] * P["bottomVal"])]
    if page_name == "division":
        if P.get("q") is not None and int(P.get("r") or 0) > 0:
            return [str(P["q"]), str(P["r"])]
        return [str(P["q"]).replace(".", ",")]
    if page_name in ("linear", "lin"):
        return [fmt(P["x0"])]
    if page_name in ("quadratic", "quad"):
        if isinstance(P.get("roots"), list):
            roots = P["roots"]
        elif P.get("kind") == "noB":
            roots = [P["r"], -P["r"]] if P.get("hasRoots") else []
        else:
            roots = [P["x1"], P["x2"]]
        return ["; ".join(fmt(r) for r in reversed(roots)) if roots else "нет корней"]
    if page_name.startswith("fraction"):
        fr = Fraction(P["sim"]["resultNum"], P["sim"]["resultDen"])
        return [fmt(fr)]
    if page_name == "gcd":
        return [str(reduce(gcd, P["nums"]))]
    raise ValueError(page_name)


def wrong_for(values):
    out = []
    for v in values:
        if v == "нет корней":
            out.append("1; 2")
        elif ";" in v:
            out.append("123; 456")
        else:
            out.append("98765")
    return out


def fill(page, values):
    ins = page.query_selector_all(".qa-panel .qa-input")
    assert len(ins) == len(values), (len(ins), values)
    for inp, v in zip(ins, values):
        inp.fill(v)
    page.click(".qa-panel .qa-check")
    page.wait_for_timeout(150)


def stats(page, prefix=""):
    return page.evaluate("""() => ({
        solved: document.getElementById('stSolved').textContent,
        streak: document.getElementById('stStreak').textContent,
        stars: document.getElementById('stStars').textContent,
        next: getComputedStyle(document.querySelector('.qa-panel').nextElementSibling.querySelector('.next-btn')).display,
    })""")


# тренажёр → (адрес, как получить P, как начать новый пример)
PAGES = {
    "addition": ("addition.html", "() => tsGetState().P", "() => newProblem()"),
    "subtraction": ("subtraction.html", "() => tsGetState().P", "() => newProblem()"),
    "multiplication": ("multiplication.html", "() => tsGetState().P", "() => newProblem()"),
    "division": ("division.html", "() => tsGetState().P", "() => newProblem()"),
    "linear": ("linear.html", "() => tsGetState().P", "() => newProblem()"),
    "quadratic": ("quadratic.html", "() => tsGetState().P", "() => newProblem()"),
    "fraction_multiply": ("fraction_multiply.html", "() => tsGetState().P", "() => newProblem()"),
    "fraction_divide": ("fraction_divide.html", "() => tsGetState().P", "() => newProblem()"),
    "gcd": ("gcd.html", "() => tsGetState().P", "() => newProblem()"),
    # движки ОГЭ №9 закрыты в функциях: пример — через хуки промпта №66,
    # новый пример — кнопкой ⟳
    "lin": ("oge9.html", "() => window.__boardLinP()", "() => document.getElementById('refreshBtn').click()"),
    "quad": ("oge9.html", "() => window.__boardQuadP()", "() => document.getElementById('refreshBtn').click()"),
}


def open_page(ctx, name, errors):
    url, getp, newp = PAGES[name]
    page = ctx.new_page()
    page.on("pageerror", lambda e: errors.append(f"{name}: {e}"))
    page.route("https://**/*", lambda r: r.abort())
    page.goto(f"{BASE}/{url}")
    page.wait_for_timeout(600)
    if name == "lin":
        page.evaluate("() => document.querySelectorAll('.mode-card:not(.soon)')[1].click()")
    if name == "quad":
        page.evaluate("() => document.querySelectorAll('.mode-card:not(.soon)')[2].click()")
    page.wait_for_selector(".qa-panel .qa-input", timeout=5000)
    return page


def run():
    failures = []

    def check(name, cond):
        print(f"[{'OK' if cond else 'FAIL'}] {name}")
        if not cond:
            failures.append(name)

    with local_server(), sync_playwright() as p:
        browser = p.chromium.launch()
        ctx = browser.new_context(viewport={"width": 1300, "height": 1000})
        errors = []

        for name, (url, getp, newp) in PAGES.items():
            page = open_page(ctx, name, errors)
            place = page.evaluate("""() => { const qa = document.querySelector('.qa-panel');
                const next = qa.nextElementSibling;
                return { beforeSteps: !!(next && next.querySelector('#prompt')), visible: qa.offsetParent !== null }; }""")
            check(f"{name}: 1. панель ответа стоит над панелью шагов и видна сразу",
                  place["beforeSteps"] and place["visible"])

            # 2. верно с первой попытки
            P = page.evaluate(getp)
            right = answer_for(name, P)
            s0 = stats(page)
            fill(page, right)
            q = page.evaluate("() => { const s = (typeof S !== 'undefined' && S) ? S : null; return null; }")
            st = stats(page)
            green = page.evaluate("() => [...document.querySelectorAll('.qa-panel .qa-input')].every(i => i.classList.contains('good') && i.disabled)")
            check(f"{name}: 2. верно сразу — зелёным, засчитано, серия, ★★★, «Следующий пример»",
                  green and int(st["solved"]) == int(s0["solved"]) + 1 and int(st["streak"]) == int(s0["streak"]) + 1
                  and st["stars"] == "★★★" and st["next"] != "none")

            # 5. finish() после ответа сразу — второй раз не считает (у движков
            # №9 finish в замыкании — там это проверяет разбор кода, здесь нет)
            if name not in ("lin", "quad"):
                before = page.evaluate("() => document.getElementById('stSolved').textContent")
                page.evaluate("() => { try { finish(0, false); } catch (e) { finish(); } }")
                after = page.evaluate("() => document.getElementById('stSolved').textContent")
                check(f"{name}: 5. разбор по шагам после ответа сразу не засчитан второй раз", before == after)
                sq = page.evaluate("() => tsGetState().S.quick")
                check(f"{name}: 7. итог ответа сразу лежит в снимке S для собеседника", bool(sq) and sq.get("res") == "ok")

            # 3. ошибка, потом верно
            page.evaluate(newp)
            page.wait_for_timeout(400)
            P = page.evaluate(getp)
            right = answer_for(name, P)
            fill(page, wrong_for(right))
            st = stats(page)
            red = page.evaluate("() => document.querySelector('.qa-panel .qa-input').classList.contains('bad')")
            check(f"{name}: 3. первая ошибка — красным, серия обнулена", red and st["streak"] == "0")
            solved_before = int(st["solved"])
            fill(page, right)
            st = stats(page)
            check(f"{name}: 3. верно после ошибки — засчитано, но не на три звезды",
                  int(st["solved"]) == solved_before + 1 and st["stars"] != "★★★" and st["streak"] == "0")

            # 4. две ошибки
            page.evaluate(newp)
            page.wait_for_timeout(400)
            P = page.evaluate(getp)
            right = answer_for(name, P)
            s0 = stats(page)
            fill(page, wrong_for(right))
            fill(page, wrong_for(right))
            st = stats(page)
            shown = page.evaluate("() => [...document.querySelectorAll('.qa-panel .qa-input')].map(i => i.value)")
            norm = lambda v: v.replace("−", "-").replace(" ", "")
            check(f"{name}: 4. вторая ошибка — подставлен верный ответ, «решено» не растёт",
                  int(st["solved"]) == int(s0["solved"]) and st["next"] != "none"
                  and (name in ("quadratic", "quad") or [norm(x) for x in shown] == [norm(x) for x in right]))
            page.close()

        # ── 6. решено по шагам — панель убирается ──────────────────────
        page = open_page(ctx, "addition", errors)
        page.evaluate("() => { S.phase = 'solve'; finish(); }")
        page.wait_for_timeout(400)
        check("6. решено по шагам без ответа сразу — панель убрана", page.query_selector(".qa-panel") is None)

        # ── 7. снимок собеседника с ответом сразу ───────────────────────
        page.evaluate("() => newProblem()")
        page.wait_for_timeout(400)
        state = page.evaluate("() => { const s = JSON.parse(JSON.stringify(tsGetState())); return s; }")
        right = answer_for("addition", state["P"])
        state["S"]["quick"] = {"res": "ok", "vals": {"main": right[0]}, "tries": 1}
        page2 = open_page(ctx, "addition", errors)
        page2.evaluate("(st) => tsApplyState(st)", state)
        page2.wait_for_timeout(600)
        got = page2.evaluate("() => { const i = document.querySelector('.qa-panel .qa-input'); return { v: i.value, good: i.classList.contains('good') }; }")
        check("7. у собеседника ответ сразу — зелёное поле с тем же ответом", got["good"] and got["v"] == right[0])
        page2.close()

        # ── 8. разбор записей ───────────────────────────────────────────
        cases = page.evaluate("""() => {
            const f = (type, value) => ({ id: 'm', type, value });
            const c = (fld, v) => QuickAnswer.checkField(fld, v).ok;
            return {
              reduce: c(f('frac', '6/8'), '6/8'),
              reduced: c(f('frac', '6/8'), '3/4'),
              mixed: c(f('frac', '15/8'), '1 7/8'),
              improper: c(f('frac', '15/8'), '15/8'),
              fracDec: c(f('frac', '1/2'), '0,5'),
              fracWrong: c(f('frac', '1/2'), '1/3'),
              comma: c(f('num', '12.5'), '12,5'),
              minus: c(f('num', '-32'), '−32'),
              garbage: c(f('num', '3'), 'три'),
              noRoots: c(f('nums', ''), 'нет корней'),
              noRootsWrong: c(f('nums', '2; -2'), 'нет корней'),
              anyOrder: c(f('nums', '4; 2'), '2; 4'),
              doubleRoot: c(f('nums', '-1; -1'), '-1'),
              commaSep: c(f('nums', '4; 2'), '2, 4'),
              frac2: QuickAnswer.prettyValue(f('frac', '45/90')),
            };
        }""")
        check("8. несокращённая дробь — просьба сократить, не ошибка", cases["reduce"] is None)
        check("8. сокращённая дробь — верно", cases["reduced"] is True)
        check("8. смешанное число и неправильная дробь — обе записи верны", cases["mixed"] is True and cases["improper"] is True)
        check("8. десятичная запись дроби — верно, другая дробь — неверно", cases["fracDec"] is True and cases["fracWrong"] is False)
        check("8. запятая и длинный минус", cases["comma"] is True and cases["minus"] is True)
        check("8. слово вместо числа — просьба переписать", cases["garbage"] is None)
        check("8. «нет корней» — только когда корней нет", cases["noRoots"] is True and cases["noRootsWrong"] is False)
        check("8. корни в любом порядке, двойной корень один раз, через запятую",
              cases["anyOrder"] is True and cases["doubleRoot"] is True and cases["commaSep"] is True)
        check("8. подставленная дробь — сокращённой", cases["frac2"] == "1/2")

        # деление с остатком — два поля
        page3 = open_page(ctx, "division", errors)
        page3.evaluate("() => { curLevel = 3; newProblem(); }")
        page3.wait_for_timeout(500)
        P = page3.evaluate("() => tsGetState().P")
        n_fields = page3.evaluate("() => document.querySelectorAll('.qa-panel .qa-input').length")
        check("8. деление с остатком — поля «частное» и «остаток»", n_fields == (2 if int(P["r"]) > 0 else 1))
        page3.close()

        # квадратное без корней
        page4 = open_page(ctx, "quadratic", errors)
        found = page4.evaluate("""() => { for (let k = 0; k < 200; k++) { curLevel = 1; newProblem();
            if (tsGetState().P.hasRoots === false) return true; } return false; }""")
        if found:
            page4.wait_for_timeout(400)
            fill(page4, ["нет корней"])
            check("8. квадратное без корней: «нет корней» засчитано", page4.evaluate("() => S.quick.res") == "ok")
        page4.close()

        # ── 9. карточка «+» ──────────────────────────────────────────────
        page5 = ctx.new_page()
        page5.route("https://**/*", lambda r: r.abort())
        page5.goto(f"{BASE}/linear.html?card=1")
        page5.wait_for_timeout(800)
        check("9. в карточке «+» панель ответа сразу тоже есть", page5.query_selector(".qa-panel .qa-input") is not None)
        page5.close()

        check("нет ошибок JavaScript", not errors)
        if errors:
            print("   ", errors[:4])
        browser.close()

    print()
    if failures:
        print(f"ПРОВАЛЕНО: {len(failures)}")
        for f in failures:
            print("  -", f)
        sys.exit(1)
    print("Все проверки прошли")


if __name__ == "__main__":
    run()
