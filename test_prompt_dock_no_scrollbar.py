"""
Панель инструментов доски — без полос прокрутки при любых условиях.

Зачем. У ряда инструментов overflow-x:auto (узкий экран — листать жестом),
а overflow по одной оси включает прокрутку и по второй. В режиме эффектов
«максимум» кнопка под курсором растёт, ряд на миг не помещается, и справа
вылезала белая полоса прокрутки (скриншот Даниила 22.11). Полосы спрятаны
у .bd-dock-tools и у всех рядов с увеличением (.lg-mag).

  1. «Максимум», панель снизу: наводим на каждую кнопку — у ряда нет места
     под полосу (offset − client = 0) ни по ширине, ни по высоте, и полоса
     выключена стилем (scrollbar-width: none). Второе нужно потому, что в
     безэкранном Chromium полосы накладные и места не занимают — по одним
     размерам старый код тест проходил
  2. то же на узком окне 700 px, где ряд не помещается и листается
  3. панель слева и справа
  4. ряд по-прежнему листается колесом на узком окне
  5. ошибок на странице нет

Запуск: python3 test_prompt_dock_no_scrollbar.py [папка сайта]
"""
import http.server
import os
import sys
import threading

from playwright.sync_api import sync_playwright

ROOT = sys.argv[1] if len(sys.argv) > 1 else os.path.dirname(os.path.abspath(__file__))
PORT = 8995
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
# место под полосу прокрутки у ряда; полоса есть — разница больше нуля
GAP = """() => { const t = document.querySelector('.bd-dock-tools');
  return { w: t.offsetWidth - t.clientWidth - (parseFloat(getComputedStyle(t).borderLeftWidth) + parseFloat(getComputedStyle(t).borderRightWidth)),
           h: t.offsetHeight - t.clientHeight - (parseFloat(getComputedStyle(t).borderTopWidth) + parseFloat(getComputedStyle(t).borderBottomWidth)),
           sw: t.scrollWidth, cw: t.clientWidth }; }"""


def run():
    errors = []
    with sync_playwright() as p:
        br = p.chromium.launch()
        for width, pos in ((1300, "bottom"), (700, "bottom"), (1300, "left"), (1300, "right")):
            pg = br.new_page(viewport={"width": width, "height": 800})
            pg.on("pageerror", lambda e: errors.append(str(e)))
            pg.route("**/*", lambda r: r.continue_() if r.request.url.startswith(BASE) else r.abort())
            pg.goto(BASE + "boards.html")
            pg.evaluate("p => { localStorage.setItem('" + KEY + "', 'full'); localStorage.setItem('theme', 'dark'); }", pos)
            pg.goto(BASE + "boards.html")
            pg.evaluate(BOOT)
            pg.click("#blCreateBoard")
            pg.wait_for_selector(".bd-dock-tools .bd-tool", state="visible")
            pg.evaluate("""p => { const d = document.querySelector('.bd-dock');
              if (p !== 'bottom') { d.classList.remove('pos-bottom'); d.classList.add('pos-' + p); } }""", pos)
            pg.wait_for_timeout(300)
            worst = {"w": 0, "h": 0}
            for b in pg.query_selector_all(".bd-dock-tools > .bd-tool"):
                if not b.is_visible():
                    continue
                try:
                    b.hover(timeout=1000)
                except Exception:
                    continue
                pg.wait_for_timeout(60)
                g = pg.evaluate(GAP)
                worst["w"] = max(worst["w"], g["w"]); worst["h"] = max(worst["h"], g["h"])
            check(f"{pos}, {width} px, «максимум»: полос прокрутки нет при наведении", worst["w"] <= 0 and worst["h"] <= 0, worst)
            sw = pg.evaluate("getComputedStyle(document.querySelector('.bd-dock-tools')).scrollbarWidth")
            check(f"{pos}, {width} px: полоса выключена стилем", sw == "none", sw)
            if width == 700:
                g = pg.evaluate(GAP)
                if g["sw"] > g["cw"]:
                    pg.mouse.move(350, 760)
                    pg.evaluate("() => { document.querySelector('.bd-dock-tools').scrollLeft = 0; }")
                    before = pg.evaluate("document.querySelector('.bd-dock-tools').scrollLeft")
                    pg.evaluate("() => document.querySelector('.bd-dock-tools').scrollBy(120, 0)")
                    after = pg.evaluate("document.querySelector('.bd-dock-tools').scrollLeft")
                    check("узкое окно: ряд по-прежнему листается", after > before, f"{before} → {after}")
                else:
                    check("узкое окно: ряд помещается (листать нечего)", True)
            pg.close()
        br.close()
    check("ошибок на странице нет", not errors, "; ".join(errors[:3]))


KEY = ""
src = open(os.path.join(ROOT, "liquid-glass.js"), encoding="utf-8").read()
import re
KEY = re.search(r"KEY\s*=\s*'([^']+)'", src).group(1)
run()
srv.shutdown()
if failures:
    print(f"\nПРОВАЛЕНО: {len(failures)}")
    sys.exit(1)
print("\nготово")
