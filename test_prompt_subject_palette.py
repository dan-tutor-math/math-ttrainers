"""
Цвет всего интерфейса по предмету (subject-palette.js).

Зачем. Синий был прописан в :root каждой страницы, и обществознание,
английский, доски, кабинет, «Работы» оставались синими. Теперь общий
скрипт ставит html[data-palette] и перекрывает --ink и его производные.
Решение Даниила 18.11: педагог может выбрать предмет палитры сам, выбор
хранится в teacher_settings.cabinetPalette (копия в localStorage),
ученик в сессии видит цвет педагога.

  A. «По предмету»: обществознание зелёное (светлая и тёмная тема),
     математика и русский — свои цвета без перекрытия
  B. выбор без входа (mathh:palette): математика красная, русский синий
  C. выбор аккаунта (cabinetPalette с owner = вошедший) — берётся;
     чужого аккаунта — нет
  D. доски/кабинет/«Работы» в режиме «по предмету» — цвет последнего
     открытого предмета
  E. палитра педагога в сессии (setRemote) перекрывает выбор
  F. фон «по предмету» (bg-style.js) идёт от палитры: клетка у математики
  G. пункт «Цвет» в меню «⋯» главной переключает палитру по кругу
  H. кабинет: «Цвет интерфейса», первый вариант «По предмету»
  I. без ошибок в консоли

Запуск: python3 test_prompt_subject_palette.py
"""
import http.server
import json
import os
import sys
import threading

from playwright.sync_api import sync_playwright

ROOT = os.path.dirname(os.path.abspath(__file__))
PORT = 8993
BASE = f"http://127.0.0.1:{PORT}/"
failures = []


def check(name, ok, info=""):
    print(("OK   " if ok else "FAIL ") + name + ("" if ok else f"  [{info}]"))
    if not ok:
        failures.append(name)


class Quiet(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *a, **kw):
        super().__init__(*a, directory=ROOT, **kw)

    def log_message(self, *a):
        pass


srv = http.server.ThreadingHTTPServer(("127.0.0.1", PORT), Quiet)
threading.Thread(target=srv.serve_forever, daemon=True).start()

INK = "getComputedStyle(document.documentElement).getPropertyValue('--ink').trim().toUpperCase()"


def run():
    errors = []
    with sync_playwright() as p:
        br = p.chromium.launch()
        ctx = br.new_context()
        # сеть наружу не нужна: Supabase и шрифты — мимо
        ctx.route("**/*", lambda r: r.continue_() if r.request.url.startswith(BASE) else r.abort())
        pg = ctx.new_page()
        pg.on("pageerror", lambda e: errors.append(f"{pg.url}: {e}"))

        def open_(page, store=None, session=None, theme="light"):
            pg.goto(BASE + "index.html?subject=math")
            pg.evaluate("""([s, t]) => { localStorage.clear(); sessionStorage.clear();
                localStorage.setItem('theme', t);
                for (const k in s) localStorage.setItem(k, s[k]); }""", [store or {}, theme])
            if session:
                pg.evaluate("s => { for (const k in s) sessionStorage.setItem(k, s[k]); }", session)
            pg.goto(BASE + page)
            pg.wait_for_function("window.MathhPalette")
            return pg.evaluate(INK), pg.evaluate("document.documentElement.getAttribute('data-palette')")

        # A
        ink, attr = open_("soc_oge.html")
        check("A1 обществознание зелёное (своя палитра страницы)", ink == "#17694F" and attr is None, f"{ink} {attr}")
        ink, attr = open_("soc_oge.html", theme="dark")
        check("A2 обществознание в тёмной теме", ink == "#2F8F70", ink)
        ink, attr = open_("lcm.html")
        check("A3 математика без перекрытия", ink == "#004C99" and attr is None, f"{ink} {attr}")
        ink, attr = open_("rus_oge.html")
        check("A4 русский свой красный", ink == "#9E2A47" and attr is None, f"{ink} {attr}")
        ink, attr = open_("eng_oge.html")
        check("A5 английский фиолетовый", ink == "#5B3596", ink)

        # B
        ink, attr = open_("lcm.html", {"mathh:palette": "rus"})
        check("B1 математика в палитре русского", ink == "#9E2A47" and attr == "rus", f"{ink} {attr}")
        ink, attr = open_("rus_oge.html", {"mathh:palette": "math"})
        check("B2 русский в палитре математики", ink == "#004C99" and attr == "math", f"{ink} {attr}")
        ink, _ = open_("lcm.html", {"mathh:palette": "rus"}, theme="dark")
        check("B3 тёмная тема палитры русского", ink == "#C9506E", ink)

        # C
        auth = json.dumps({"user": {"id": "u1"}})
        ts = lambda owner, subj: json.dumps({"cabinetPalette": {"owner": owner, "subject": subj}})
        ink, _ = open_("lcm.html", {"sb-x-auth-token": auth, "teacher:settings:v1": ts("u1", "eng")})
        check("C1 выбор своего аккаунта", ink == "#5B3596", ink)
        ink, _ = open_("lcm.html", {"sb-x-auth-token": auth, "teacher:settings:v1": ts("u2", "eng")})
        check("C2 выбор чужого аккаунта не берётся", ink == "#004C99", ink)
        ink, _ = open_("soc_oge.html", {"sb-x-auth-token": auth, "teacher:settings:v1": ts("u1", "neutral"),
                                        "mathh:palette": "rus"})
        check("C3 «по предмету» аккаунта сильнее выбора устройства", ink == "#17694F", ink)

        # D
        for page in ("works.html", "cabinet.html", "boards.html", "notes.html"):
            open_("soc_oge.html")
            pg.goto(BASE + page)
            pg.wait_for_function("window.MathhPalette")
            ink = pg.evaluate(INK)
            check(f"D {page} — цвет последнего предмета (общество)", ink == "#17694F", ink)
        ink, attr = open_("works.html")
        check("D works.html без предмета — синий", ink == "#004C99" and attr is None, f"{ink} {attr}")

        # E
        ink, _ = open_("lcm.html", {"mathh:palette": "rus"}, {"mathh:palette:remote": "phys"})
        check("E1 палитра педагога в сессии", ink == "#A3480F", ink)
        pg.evaluate("MathhPalette.setRemote(null)")
        check("E2 без сессии — свой выбор", pg.evaluate(INK) == "#9E2A47", pg.evaluate(INK))

        # F
        open_("rus_oge.html", {"mathh:palette": "math"})
        check("F1 русский в палитре математики — клетка", pg.evaluate("document.documentElement.dataset.bg") == "grid",
              pg.evaluate("document.documentElement.dataset.bg"))
        open_("lcm.html", {"mathh:palette": "rus"})
        check("F2 математика в палитре русского — чистый фон", pg.evaluate("document.documentElement.dataset.bg") == "none",
              pg.evaluate("document.documentElement.dataset.bg"))

        # G
        open_("index.html?subject=math")
        pg.wait_for_selector("#paletteToggle", state="attached")
        label = lambda: pg.evaluate("document.getElementById('paletteToggle').getAttribute('aria-label')")
        check("G1 пункт «Цвет: по предмету»", label() == "Цвет: по предмету", label())
        pg.click("#lgMenuToggle")
        pg.click("#paletteToggle")
        check("G2 первый щелчок — математика", label() == "Цвет: математика" and pg.evaluate("localStorage.getItem('mathh:palette')") == "math", label())
        pg.click("#paletteToggle")
        check("G3 второй — информатика, интерфейс перекрашен",
              label() == "Цвет: информатика" and pg.evaluate(INK) == "#0B6577", f"{label()} {pg.evaluate(INK)}")
        pg.goto(BASE + "lcm.html")
        pg.wait_for_function("window.MathhPalette")
        check("G4 выбор действует на тренажёре", pg.evaluate(INK) == "#0B6577", pg.evaluate(INK))

        # H
        open_("cabinet.html")
        txt = pg.evaluate("document.getElementById('cabPaletteLabel').textContent")
        first = pg.evaluate("document.querySelector('#cabPalettes button').textContent")
        check("H кабинет: «Цвет интерфейса» / «По предмету»", txt == "Цвет интерфейса" and first == "По предмету", f"{txt} {first}")

        br.close()
    check("I без ошибок на страницах", not errors, "; ".join(errors[:3]))


run()
srv.shutdown()
if failures:
    print(f"\nПРОВАЛЕНО: {len(failures)}")
    sys.exit(1)
print("\nготово")
