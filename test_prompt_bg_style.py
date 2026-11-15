"""
Единый фон (bg-style.js): главная и все тренажёры.

Проверяет:
  1. по умолчанию («по предмету») клетка у математики (index, lcm, oge8, oge7),
     у русского, обществознания и английского — чистый фон без узора;
  2. на главной переключение предмета на «Русский» убирает клетку, обратно — возвращает;
  3. выбранный пресет (точки, крупная клетка, чистый) одинаково применяется
     на главной и в тренажёрах любого предмета и переживает перезагрузку;
  4. кнопка «Фон: …» в меню «⋯» главной листает пресеты по кругу;
  5. цветные пятна остались при любом пресете; ошибок JavaScript нет.

Запуск: python3 test_prompt_bg_style.py (сервер поднимается сам).
"""
import contextlib, http.client, os, subprocess, sys, time
from playwright.sync_api import sync_playwright

PORT = 8993
BASE = f"http://127.0.0.1:{PORT}"
HERE = os.path.dirname(os.path.abspath(__file__))
fails = []


def check(cond, msg):
    print(("OK   " if cond else "FAIL ") + msg)
    if not cond:
        fails.append(msg)


@contextlib.contextmanager
def server():
    p = subprocess.Popen([sys.executable, "-m", "http.server", str(PORT), "--bind", "127.0.0.1"],
                         cwd=HERE, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    try:
        for _ in range(50):
            try:
                c = http.client.HTTPConnection("127.0.0.1", PORT, timeout=1)
                c.request("GET", "/index.html")
                c.getresponse()
                break
            except OSError:
                time.sleep(0.1)
        yield
    finally:
        p.terminate()


def img(page):
    return page.evaluate("getComputedStyle(document.body).backgroundImage")


def kind(page):
    """grid / big / dots / lines / none — по атрибуту и по реальному фону."""
    bg = page.evaluate("document.documentElement.getAttribute('data-bg')")
    css = img(page)
    n_lin = css.count("linear-gradient")
    n_rad = css.count("radial-gradient")
    if bg == "none":
        check(n_lin == 0 and n_rad == 2, f"  без узора только пятна ({n_rad} radial, {n_lin} linear)")
    elif bg in ("grid", "big"):
        check(n_lin == 2 and n_rad == 2, f"  клетка в стиле: {n_lin} linear, {n_rad} radial")
    elif bg == "dots":
        check(n_rad == 3 and n_lin == 0, f"  точки в стиле: {n_rad} radial")
    elif bg == "lines":
        check(n_lin == 1 and n_rad == 2, f"  линейка в стиле: {n_lin} linear")
    return bg


with server(), sync_playwright() as pw:
    b = pw.chromium.launch()
    ctx = b.new_context(viewport={"width": 1100, "height": 800})
    errs = []
    page = ctx.new_page()
    page.on("pageerror", lambda e: errs.append(str(e)))
    ctx.route("**/*", lambda r: r.continue_() if r.request.url.startswith(BASE) else r.abort())

    def open_(name):
        page.goto(f"{BASE}/{name}")
        page.wait_for_timeout(300)
        return kind(page)

    print("1. по умолчанию")
    for name, want in [("index.html", "grid"), ("lcm.html", "grid"), ("oge8.html", "grid"), ("oge7.html", "grid"),
                       ("rus_oge.html?n=2", "none"), ("soc_oge.html?n=1", "none"), ("eng_oge.html?n=1", "none"),
                       ("phys_oge.html?n=1", "grid"), ("inf_oge.html?n=1", "none")]:
        got = open_(name)
        check(got == want, f"{name}: {got} (ждём {want})")

    print("2. предмет на главной")
    page.goto(f"{BASE}/index.html?subject=rus"); page.wait_for_timeout(300)
    check(kind(page) == "none", "index русский — чистый фон")
    page.evaluate("document.documentElement.setAttribute('data-subject','math')"); page.wait_for_timeout(100)
    check(kind(page) == "grid", "index → математика: клетка вернулась")
    page.evaluate("document.documentElement.setAttribute('data-subject','soc')"); page.wait_for_timeout(100)
    check(kind(page) == "none", "index → обществознание: клетки нет")
    page.evaluate("document.documentElement.setAttribute('data-subject','phys')"); page.wait_for_timeout(100)
    check(kind(page) == "grid", "index → физика: клетка")
    page.evaluate("document.documentElement.setAttribute('data-subject','inf')"); page.wait_for_timeout(100)
    check(kind(page) == "none", "index → информатика: клетки нет")

    print("3. выбранный пресет везде")
    for preset, files in [("dots", ["index.html", "lcm.html", "rus_oge.html?n=2", "eng_oge.html?n=1"]),
                          ("big", ["oge8.html", "soc_oge.html?n=1"]),
                          ("none", ["lcm.html", "oge7.html"])]:
        page.goto(f"{BASE}/index.html"); page.evaluate(f"MathhBg.set('{preset}')")
        for f in files:
            got = open_(f)
            check(got == preset, f"{preset} → {f}: {got}")
    page.reload(); page.wait_for_timeout(200)
    check(kind(page) == "none", "выбор пережил перезагрузку")

    print("4. меню «⋯»")
    page.goto(f"{BASE}/index.html"); page.evaluate("MathhBg.set('auto')")
    page.click("#lgMenuToggle"); page.wait_for_timeout(500)
    label = lambda: page.evaluate("document.querySelector('#bgToggle').getAttribute('aria-label')")
    seen = [label()]
    for _ in range(6):
        page.evaluate("document.querySelector('#bgToggle').click()"); page.wait_for_timeout(80)
        seen.append(label())
    print("   ", seen)
    check(seen[0] == "Фон: по предмету" and seen[-1] == seen[0] and len(set(seen)) == 6, "кнопка листает 6 пресетов по кругу")
    page.evaluate("MathhBg.set('lines')"); check(kind(page) == "lines", "линейка")

    print("5. тёмная тема")
    page.evaluate("MathhBg.set('grid'); document.documentElement.setAttribute('data-theme','dark')")
    line = page.evaluate("getComputedStyle(document.documentElement).getPropertyValue('--bgp-line').trim()")
    check(line.lower() == "#232a44", f"цвет линий в тёмной теме {line}")

    check(not errs, f"ошибок JavaScript нет {errs}")
    b.close()

print("\nГОТОВО" if not fails else f"\nПРОВАЛЕНО: {len(fails)}")
sys.exit(1 if fails else 0)
