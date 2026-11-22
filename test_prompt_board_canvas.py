"""
Цвет холста доски (board-canvas.js).

Зачем. Даниил 22.11: холст чаще нужен белым, чёрным или другим цветом,
независимо от темы и цвета предмета. По умолчанию — белый везде; своя
кнопка на доске; выбор для этой доски или для всех; при первой смене темы
на доске — подсказка, где менять. Перо по умолчанию — по холсту, не теме.

  1. новая доска, светлая и тёмная тема: холст белый, перо тёмное
  2. кнопка «Цвет холста» на верхней панели открывает окошко
  3. «Эта доска» + «Чёрный»: у доски свой цвет, перо светлое, пиксель
     листа на холсте чёрный
  4. «Все доски» + «Меловая»: выбор на устройстве, у доски свой снят;
     новая доска — тоже меловая
  5. «Как тема»: бумага и перо из темы
  6. подсказка: показывается при первой смене темы и только один раз
  7. презентация: холст не трогаем (у слайдов своя подложка)
  8. ошибок нет

Запуск: python3 test_prompt_board_canvas.py
"""
import http.server
import os
import sys
import threading

from playwright.sync_api import sync_playwright

ROOT = os.path.dirname(os.path.abspath(__file__))
PORT = 8996
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

    def handle(self):
        try:
            super().handle()
        except Exception:
            pass


srv = http.server.ThreadingHTTPServer(("127.0.0.1", PORT), Quiet)
threading.Thread(target=srv.serve_forever, daemon=True).start()

BOOT = """() => { const g = document.getElementById('authGate'); if (g) g.style.display = 'none';
  window.boardsAppBoot(); document.getElementById('screenList').style.display = 'flex'; }"""
# цвет пикселя листа в центре экрана (сам лист — вне линий клетки: среднее по квадрату 6×6)
PIXEL = """() => { const cv = document.getElementById('boardCv'); const c = cv.getContext('2d');
  const d = c.getImageData(Math.round(cv.width / 2) + 5, Math.round(cv.height / 2) + 5, 6, 6).data;
  let r = 0, g = 0, b = 0; for (let i = 0; i < d.length; i += 4) { r += d[i]; g += d[i + 1]; b += d[i + 2]; }
  const n = d.length / 4; return [Math.round(r / n), Math.round(g / n), Math.round(b / n)]; }"""


def run():
    errors = []
    with sync_playwright() as p:
        br = p.chromium.launch()
        ctx = br.new_context(viewport={"width": 1300, "height": 820})
        pg = ctx.new_page()
        pg.on("pageerror", lambda e: errors.append(str(e)))
        pg.route("**/*", lambda r: r.continue_() if r.request.url.startswith(BASE) else r.abort())

        def new_board(theme, keep=False):
            pg.goto(BASE + "boards.html")
            if not keep:
                pg.evaluate("t => { localStorage.clear(); indexedDB.deleteDatabase && 0; localStorage.setItem('theme', t); }", theme)
            else:
                pg.evaluate("t => localStorage.setItem('theme', t)", theme)
            pg.goto(BASE + "boards.html")
            pg.evaluate(BOOT)
            pg.click("#blCreateBoard")
            pg.wait_for_function("() => typeof B !== 'undefined' && B && boardActive && window.BoardCanvas")
            pg.wait_for_timeout(500)

        ink = lambda: pg.evaluate("resolveColor('--pencil')").upper()
        paper = lambda: (pg.evaluate("BoardCanvas.paper()") or "").upper()

        # 1
        new_board("light")
        check("1a светлая тема: холст белый", paper() == "#FFFFFF", paper())
        check("1b перо тёмное", ink() == "#1D1D1F", ink())
        new_board("dark")
        check("1c тёмная тема: холст всё равно белый", paper() == "#FFFFFF", paper())
        check("1d перо тёмное на белом холсте", ink() == "#1D1D1F", ink())
        px = pg.evaluate(PIXEL)
        check("1e на холсте лист белый", min(px) > 235, px)

        # 2
        check("2a кнопка «Цвет холста» на панели", pg.is_visible("#bdCanvasBtn"))
        pg.click("#bdCanvasBtn")
        check("2b окошко открылось", pg.is_visible("#bdCanvasPop"))
        n = pg.evaluate("document.querySelectorAll('#bdCanvasPop .cv-sw').length")
        check("2c семь вариантов", n == 7, n)

        # 3
        pg.click("#bdCanvasPop [data-scope=board]")
        pg.click("#bdCanvasPop .cv-sw[data-id=black]")
        pg.wait_for_timeout(400)
        check("3a у доски свой цвет", pg.evaluate("B.canvasColor") == "black", pg.evaluate("B.canvasColor"))
        check("3b перо светлое на чёрном", ink() == "#F2F3F5", ink())
        px = pg.evaluate(PIXEL)
        check("3c лист на холсте чёрный", max(px) < 40, px)

        # 4
        pg.click("#bdCanvasPop [data-scope=all]")
        pg.click("#bdCanvasPop .cv-sw[data-id=chalk]")
        pg.wait_for_timeout(300)
        check("4a выбор «для всех» сохранён на устройстве", pg.evaluate("localStorage.getItem('boards:canvas')") == "chalk")
        check("4b у этой доски свой цвет снят", pg.evaluate("B.canvasColor") is None)
        check("4c холст меловой", paper() == "#1F3B30", paper())
        pg.keyboard.press("Escape")
        new_board("dark", keep=True)
        check("4d новая доска — тоже меловая", paper() == "#1F3B30", paper())

        # 5
        pg.click("#bdCanvasBtn")
        pg.click("#bdCanvasPop [data-scope=board]")
        pg.click("#bdCanvasPop .cv-sw[data-id=theme]")
        pg.wait_for_timeout(300)
        check("5a «Как тема»: своего цвета холста нет", pg.evaluate("BoardCanvas.paper()") is None)
        check("5b перо — из темы", ink() == pg.evaluate("themeVar('--pencil')").upper(), ink())
        pg.keyboard.press("Escape")

        # 6
        new_board("light")
        check("6a до смены темы подсказки нет", not pg.evaluate("!!document.querySelector('#bdCanvasHint.show')"))
        pg.evaluate("document.documentElement.setAttribute('data-theme', 'dark')")
        pg.wait_for_timeout(400)
        check("6b при первой смене темы — подсказка", pg.evaluate("!!document.querySelector('#bdCanvasHint.show')"))
        txt = pg.evaluate("(document.querySelector('#bdCanvasHint') || {}).textContent || ''")
        check("6c текст про цвет холста", "Цвет холста" in txt, txt)
        pg.click("#bdCanvasHint button")
        check("6d «Выбрать» открывает окошко", pg.is_visible("#bdCanvasPop"))
        pg.keyboard.press("Escape")
        # после перезагрузки доска может открыться сама — тогда кнопки создания не видно
        pg.reload(); pg.evaluate(BOOT); pg.wait_for_timeout(400)
        if pg.is_visible("#blCreateBoard"):
            pg.click("#blCreateBoard")
        pg.wait_for_function("() => typeof B !== 'undefined' && B && boardActive")
        pg.evaluate("document.documentElement.setAttribute('data-theme', 'light')")
        pg.wait_for_timeout(400)
        check("6e второй раз подсказки нет", not pg.evaluate("!!document.querySelector('#bdCanvasHint.show')"))

        # 7
        pg.goto(BASE + "boards.html"); pg.evaluate(BOOT); pg.wait_for_timeout(400)
        if not pg.is_visible("#blCreateDeck"):
            pg.evaluate("() => { const b = document.getElementById('bdBack'); if (b) b.click(); }")
            pg.wait_for_selector("#blCreateDeck", state="visible")
        pg.click("#blCreateDeck")
        pg.wait_for_function("() => typeof B !== 'undefined' && B && B.kind === 'deck' && boardActive")
        check("7 презентация: холст не трогаем", pg.evaluate("BoardCanvas.paper()") is None)

        br.close()
    check("8 ошибок нет", not errors, "; ".join(errors[:3]))


run()
srv.shutdown()
if failures:
    print(f"\nПРОВАЛЕНО: {len(failures)}")
    sys.exit(1)
print("\nготово")
