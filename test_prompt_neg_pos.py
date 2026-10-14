"""
Новый тренажёр «Положительные и отрицательные числа» — neg_pos.html.

Проверяет:
  A. генераторы всех восьми типов, с целыми и с десятичными: ответ в странице
     совпадает с независимым пересчётом (Fraction), первое число без скобок,
     отрицательное второе — в скобках, двойных знаков без скобок нет, типы
     соответствуют названию плитки, в режиме дробей числа не целые;
  B. выбор: плитки с мультивыбором, тумблер дробей, «Начать» заблокирована без
     выбора; на доске 3, 5, 10 листов, примеры на доске не повторяются;
  C. ⟳ на листе меняет только свой пример, «Обновить все» — все;
  D. автопроверка: верный ответ с запятой и точкой, минус-знаки разных видов,
     неверный ответ, «не число»; решённый лист закрепляется;
  E. из двух плашек сразу — примеры вперемешку (и сложение, и умножение);
  F. телефон 375 и 320 px без прокрутки вбок; ссылка на странице в каталоге.

Запуск: python3 test_prompt_neg_pos.py (сервер поднимается сам).
"""
import contextlib
import http.client
import os
import re
import subprocess
import sys
import time
from fractions import Fraction

from playwright.sync_api import sync_playwright

HERE = os.path.dirname(os.path.abspath(__file__))
PORT = 8991
BASE = f"http://127.0.0.1:{PORT}"
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


def evaluate(text):
    """Независимый пересчёт текста примера."""
    t = text.replace("−", "-").replace(",", ".").replace("·", "*").replace(":", "/")
    t = re.sub(r"\d+(?:\.\d+)?", lambda m: f"Fraction('{m.group(0)}')", t)
    return eval(t, {"Fraction": Fraction})


def open_page(browser, width=1000, height=900):
    ctx = browser.new_context(viewport={"width": width, "height": height})
    page = ctx.new_page()
    errors = []
    page.on("pageerror", lambda e: errors.append(str(e)))
    page.goto(f"{BASE}/neg_pos.html", wait_until="domcontentloaded")
    page.evaluate("localStorage.clear()")
    page.reload(wait_until="domcontentloaded")
    return page, errors


def select_only(page, sections_ks):
    """sections_ks: {'as': [0,1], 'md': [..]} — выбрать ровно эти плитки."""
    page.click("#none") if False else None
    for sec in ("as", "md"):
        page.click(f'#sections [data-sec="{sec}"]')
        page.click("#none")
        for k in sections_ks.get(sec, []):
            page.click(f'.tile[data-k="{k}"]')


def board_texts(page):
    return page.eval_on_selector_all(".leaf .task", "els => els.map(e => e.textContent)")


def main():
    with local_server(), sync_playwright() as p:
        browser = p.chromium.launch()
        page, errors = open_page(browser)

        # ── A. генераторы ────────────────────────────────────────────────
        names = ["один знак", "разные знаки", "+ (−)", "− (−)", "× одинак.", "× разные", "÷ одинак.", "÷ разные"]
        for dec in (False, True):
            bad = []
            for idx in range(8):
                sec, k = ("as", idx) if idx < 4 else ("md", idx - 4)
                samples = page.evaluate(
                    "([s,k,d]) => Array.from({length:300}, () => { const r = NEGPOS.gen(s,k,d); return [r.text, r.ans, r.sc]; })",
                    [sec, k, dec])
                for text, ans, sc in samples:
                    val = evaluate(text)
                    if Fraction(ans, int(sc)) != val: bad.append((names[idx], text, "ответ"))
                    if text.startswith("("): bad.append((names[idx], text, "скобка у первого"))
                    if re.search(r"[+−·:] −", text): bad.append((names[idx], text, "двойной знак без скобок"))
                    nums = [Fraction(x.replace(",", ".")) for x in re.findall(r"\d+(?:,\d+)?", text)]
                    second_neg = re.search(r"\(−", text) is not None
                    first_neg = text.startswith("−")
                    if idx in (0, 1) and second_neg: bad.append((names[idx], text, "второе отрицательное"))
                    if idx == 0 and (first_neg != (" − " in text)): bad.append((names[idx], text, "не один знак"))
                    if idx == 1 and (first_neg != (" + " in text)): bad.append((names[idx], text, "не разные знаки"))
                    if idx in (2, 3) and not second_neg: bad.append((names[idx], text, "нет (−)"))
                    if idx == 2 and " + (" not in text: bad.append((names[idx], text, "не плюс"))
                    if idx == 3 and " − (" not in text: bad.append((names[idx], text, "не минус"))
                    if idx in (4, 6) and (first_neg != second_neg): bad.append((names[idx], text, "знаки разные"))
                    if idx in (5, 7) and (first_neg == second_neg): bad.append((names[idx], text, "знаки одинаковые"))
                    if idx >= 4 and first_neg and not text.startswith("−"): bad.append((names[idx], text, "?"))
                    if dec and idx < 4 and all(n.denominator == 1 for n in nums): bad.append((names[idx], text, "все числа целые"))
                    if dec and idx < 4 and not any(n.denominator != 1 for n in nums): bad.append((names[idx], text, "нет дроби"))
                    if not dec and any(n.denominator != 1 for n in nums): bad.append((names[idx], text, "дробь в режиме целых"))
            check(f"A. генераторы {'дроби' if dec else 'целые'}: 8 типов × 300 верны", not bad, str(bad[:4]))

        # ── B. выбор и доска ─────────────────────────────────────────────
        page.click('#sections [data-sec="as"]')
        page.click("#none")
        page.click('#sections [data-sec="md"]')
        page.click("#none")
        check("B. без выбора «Начать» заблокирована", page.is_disabled("#start"))
        page.click('#sections [data-sec="as"]')
        page.click("#all")
        check("B. «Выбрать все» ставит 4 галочки", page.locator(".tile.on").count() == 4)
        check("B. «Начать» доступна после выбора", not page.is_disabled("#start"))
        page.click('#dec')
        check("B. тумблер дробей включается", page.get_attribute("#dec", "aria-checked") == "true")
        ex = page.eval_on_selector_all(".tile .exl", "els => els.map(e => e.textContent)")
        check("B. на плитках по два примера, с запятыми", len(ex) == 8 and all("," in e for e in ex), str(ex))
        page.click('#dec')

        for n in (3, 5, 10):
            page.click(f'#cnt1 [data-cnt="{n}"]')
            page.click("#start")
            ts = board_texts(page)
            check(f"B. на доске {n} листов без повторов", len(ts) == n and len(set(ts)) == n, str(ts))
            page.click("#back")
        # повторы не случаются и при узком наборе: один тип, 10 листов, целые
        select_only(page, {"as": [0]})
        page.click('#cnt1 [data-cnt="10"]')
        uniq_ok = True
        for _ in range(15):
            page.click("#start")
            ts = board_texts(page)
            uniq_ok &= len(set(ts)) == len(ts) == 10
            page.click("#refAll")
            ts = board_texts(page)
            uniq_ok &= len(set(ts)) == 10
            page.click("#back")
        check("B. 10 листов одного типа: повторов нет (15 доск)", uniq_ok)

        # ── C. обновление ────────────────────────────────────────────────
        select_only(page, {"as": [0, 1, 2, 3], "md": [0, 1, 2, 3]})
        page.click('#cnt1 [data-cnt="5"]')
        page.click("#start")
        before = board_texts(page)
        page.click('.leaf[data-i="2"] .rf')
        after = board_texts(page)
        check("C. ⟳ меняет только свой лист",
              after[2] != before[2] and [after[i] for i in (0, 1, 3, 4)] == [before[i] for i in (0, 1, 3, 4)], f"{before} → {after}")
        check("C. после ⟳ повторов нет", len(set(after)) == 5)
        page.click("#refAll")
        after_all = board_texts(page)
        check("C. «Обновить все» меняет все листы", sum(a != b for a, b in zip(after, after_all)) >= 4 and len(set(after_all)) == 5)

        # ── D. автопроверка ──────────────────────────────────────────────
        page.click("#back")
        select_only(page, {"as": [2]})
        page.click('#cnt1 [data-cnt="3"]')
        page.click("#start")
        ts = board_texts(page)
        leaf = lambda i: page.locator(f'.leaf[data-i="{i}"]')

        def fmt_ans(v, sep, minus):
            s = str(float(v)) if v.denominator != 1 else str(int(v))
            s = re.sub(r"\.0$", "", s).replace(".", sep)
            return s.replace("-", minus)

        v0 = evaluate(ts[0]); v1 = evaluate(ts[1]); v2 = evaluate(ts[2])
        leaf(0).locator("input").fill(fmt_ans(v0, ",", "−"))
        leaf(0).locator(".chk").click()
        check("D. верный ответ с запятой и знаком «−»", "ok" in leaf(0).get_attribute("class"))
        leaf(1).locator("input").fill(fmt_ans(v1, ".", "-"))
        leaf(1).locator("input").press("Enter")
        check("D. верный ответ с точкой и дефисом, Enter", "ok" in leaf(1).get_attribute("class"))
        leaf(2).locator("input").fill(fmt_ans(v2 + 1, ",", "-"))
        leaf(2).locator(".chk").click()
        check("D. неверный ответ — «Неверно»", "bad" in leaf(2).get_attribute("class")
              and "Неверно" in leaf(2).locator(".verdict").inner_text())
        leaf(2).locator("input").fill("abc")
        leaf(2).locator(".chk").click()
        check("D. не число — просьба ввести число", "Введите число" in leaf(2).locator(".verdict").inner_text())
        check("D. решённый лист закреплён (поле только для чтения)", leaf(0).locator("input").get_attribute("readonly") is not None)
        check("D. счётчик решённых", "Решено: 2 из 3" in page.inner_text("#boardNote"))
        page.click('#cnt2 [data-cnt="5"]')
        check("D. смена количества сохраняет решённое",
              len(board_texts(page)) == 5 and board_texts(page)[:3] == ts and "ok" in leaf(0).get_attribute("class"))

        # ── E. вперемешку из двух плашек ─────────────────────────────────
        page.click("#back")
        select_only(page, {"as": [3], "md": [0]})
        page.click('#cnt1 [data-cnt="10"]')
        seen_as = seen_md = False
        for _ in range(6):
            page.click("#start")
            for t in board_texts(page):
                seen_as |= " − (" in t
                seen_md |= ("·" in t) or (" : " in t)
            page.click("#back")
        check("E. примеры из обеих плашек идут вперемешку", seen_as and seen_md)

        # ── F. телефон и каталог ─────────────────────────────────────────
        for w in (375, 320):
            pg, errs = open_page(browser, width=w, height=800)
            pg.click('#sections [data-sec="md"]')
            pg.click("#all")
            ov1 = pg.evaluate("document.documentElement.scrollWidth > innerWidth")
            pg.click('#cnt1 [data-cnt="10"]')
            pg.click("#start")
            ov2 = pg.evaluate("document.documentElement.scrollWidth > innerWidth")
            check(f"F. {w} px: без прокрутки вбок (выбор и доска)", not ov1 and not ov2)
            check(f"F. {w} px: без ошибок JS", not errs, str(errs))
        idx = open(os.path.join(HERE, "index.html"), encoding="utf-8").read()
        check("F. в каталоге на главной есть ссылка", "href: 'neg_pos.html'" in idx)
        check("A. страница без ошибок JS", not errors, str(errors))
        browser.close()

    bad = [n for n, ok in results if not ok]
    print(f"\nИтого: {len(results) - len(bad)}/{len(results)}")
    sys.exit(1 if bad else 0)


if __name__ == "__main__":
    main()
