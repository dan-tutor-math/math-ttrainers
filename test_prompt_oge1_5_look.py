"""
ОГЭ №1–5: вид таблиц, кнопки в левом верхнем углу, список тем (11.2026).

  1. таблицы условия: линии видны на светлой теме (не белые, как раньше
     --glass-border), на тёмной — свои светлые;
  2. «Все задания» и «← Назад» — в левом верхнем углу, одной ширины;
     «Назад» есть только в задании, ведёт к выбору тем и снова прячется;
     в шапке задания её больше нет;
  3. на телефоне 375 px кнопки угла не налезают на кнопки справа, страница
     не едет вбок;
  4. тарифов-генераторов нет (только «Тарифы · задания ФИПИ»); в «Шинах» —
     демоверсия, задания ФИПИ, потом прежняя «Шина 1» под названием «Шины».

Запуск: python3 test_prompt_oge1_5_look.py (сервер поднимается сам).
"""
import contextlib
import http.client
import os
import subprocess
import sys
import time

from playwright.sync_api import sync_playwright

PORT = 9141
BASE = f"http://127.0.0.1:{PORT}"
HERE = os.path.dirname(os.path.abspath(__file__))


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


def check(name, ok, info=""):
    results.append((name, bool(ok)))
    print(("[OK] " if ok else "[FAIL] ") + name + ("" if ok else f": {info}"))


def new_page(browser, w=1400, h=900, theme="light"):
    ctx = browser.new_context(viewport={"width": w, "height": h})
    ctx.add_init_script(f"try {{ localStorage.setItem('theme', '{theme}'); }} catch (e) {{}}")
    page = ctx.new_page()
    errors = []
    page.on("pageerror", lambda e: errors.append(str(e)))
    page.goto(BASE + "/oge1_5.html")
    page.wait_for_selector(".mode-card")
    return ctx, page, errors


def rect(page, sel):
    return page.eval_on_selector(sel, "e => { const r = e.getBoundingClientRect(); return [r.x, r.y, r.width, r.height]; }")


def line_color(page):
    # цвет внутренней линии видимой таблицы условия
    return page.evaluate("""() => { const t = [...document.querySelectorAll('#questionPromptText .data-table')].find(x => x.offsetHeight);
        return t ? getComputedStyle(t.querySelector('td')).borderTopColor : null; }""")


def test_tables(browser):
    ctx, page, errors = new_page(browser)
    page.evaluate("document.documentElement.dataset.theme = 'light'")
    page.click('.mode-card[data-id="tire_set1"]')
    page.wait_for_selector("#taskArea", state="visible")
    c = line_color(page)
    check("светлая тема: линии таблицы видны (не белые)", c and "255, 255, 255" not in c, c)
    page.evaluate("document.documentElement.dataset.theme = 'dark'")
    c2 = line_color(page)
    check("тёмная тема: у линий таблицы свой цвет", c2 and c2 != c, f"{c} / {c2}")
    check("таблицы: без ошибок JS", not errors, str(errors[:1]))
    ctx.close()


def test_corner(browser):
    ctx, page, errors = new_page(browser)
    check("выбор тем: «Назад» спрятана", not page.is_visible("#backBtn"))
    check("«Все задания» в левом верхнем углу, со значком выхода",
          rect(page, "#homeBtn")[:2] == [16, 16] and page.inner_text("#homeBtn").strip() == "Все задания"
          and page.locator("#homeBtn svg").count() == 1, str(rect(page, "#homeBtn")))
    page.click('.mode-card[data-id="tire_demo2027"]')
    page.wait_for_selector("#taskArea", state="visible")
    page.wait_for_timeout(100)
    h, b = rect(page, "#homeBtn"), rect(page, "#backBtn")
    check("задание: «Назад» под «Все задания», той же ширины",
          page.is_visible("#backBtn") and b[0] == h[0] and b[1] > h[1] and abs(b[2] - h[2]) < 0.5, f"{h} {b}")
    check("в шапке задания «Назад» больше нет", page.locator("#taskArea .back-btn").count() == 0)
    page.click("#backBtn")
    page.wait_for_timeout(100)
    check("«Назад» ведёт к выбору тем и прячется",
          page.is_visible("#pickerArea") and not page.is_visible("#taskArea") and not page.is_visible("#backBtn"))
    check("угол: без ошибок JS", not errors, str(errors[:1]))
    ctx.close()


def test_phone(browser):
    ctx, page, errors = new_page(browser, 375, 812)
    page.click('.mode-card[data-id="flat_fipi"]')
    page.wait_for_selector("#taskArea", state="visible")
    page.evaluate("scrollTo(0, 0)")
    page.wait_for_timeout(100)
    h, b = rect(page, "#homeBtn"), rect(page, "#backBtn")
    # кнопки справа вверху (тема, доска, поделиться) — все position:fixed у правого края
    right = page.evaluate("""() => Math.min(...[...document.querySelectorAll('button, a')].filter(e => {
        const r = e.getBoundingClientRect(); return getComputedStyle(e).position === 'fixed' && r.width && r.top < 120 && r.left > 187; })
        .map(e => e.getBoundingClientRect().left))""")
    check("375 px: кнопки угла столбиком, одной ширины",
          b[0] == h[0] and b[1] > h[1] and abs(b[2] - h[2]) < 0.5, f"{h} {b}")
    check("375 px: не налезают на кнопки справа", h[0] + h[2] < right and b[0] + b[2] < right, f"{h} {b} right={right}")
    check("375 px: страница не едет вбок", page.evaluate("document.documentElement.scrollWidth") <= 375)
    check("телефон: без ошибок JS", not errors, str(errors[:1]))
    ctx.close()


def test_list(browser):
    ctx, page, errors = new_page(browser)
    ids = page.eval_on_selector_all("#modesGrid .mode-card", "es => es.map(e => e.dataset.id)")
    check("тарифов-генераторов нет, тарифы ФИПИ есть",
          "tariff1" not in ids and "tariff2" not in ids and "tariff_fipi" in ids, str(ids))
    tires = page.eval_on_selector_all('#modesGrid .modes', 'gs => [...gs[0].querySelectorAll(".mode-card")].map(e => [e.dataset.id, e.innerText.trim()])')
    check("шины: демоверсия, задания ФИПИ, потом «Шины»",
          [t[0] for t in tires] == ["tire_demo2027", "tire_fipi", "tire_set1"]
          and tires[0][1].startswith("Шины · Демоверсия") and tires[2][1] == "Шины"
          and not any("Шина 0" in t[1] or "Шина 1" in t[1] for t in tires), str(tires))
    check("«Случайно» не берёт тарифы-генераторы",
          page.evaluate("RANDOM_MODES.every(m => !/^tariff[12]$/.test(m.id))"))
    check("список: без ошибок JS", not errors, str(errors[:1]))
    ctx.close()


def main():
    with local_server(), sync_playwright() as p:
        browser = p.chromium.launch()
        test_tables(browser)
        test_corner(browser)
        test_phone(browser)
        test_list(browser)
        browser.close()
    failed = [n for n, ok in results if not ok]
    print(f"\n{len(results) - len(failed)}/{len(results)} проверок прошло")
    sys.exit(1 if failed else 0)


if __name__ == "__main__":
    main()
