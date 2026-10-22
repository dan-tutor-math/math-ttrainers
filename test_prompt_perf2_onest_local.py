"""
Скорость №2: шрифт Onest — локально (onest.css + fonts/onest-*.woff2)
вместо Google Fonts.

Зачем: стили с fonts.googleapis.com задерживали показ каждой страницы
примерно на секунду и делали сайт зависимым от стороннего CDN.

Что проверяем (сеть наружу отрезана — как и должно быть, всё своё):
  - ни в одной странице и ни в одном скрипте не осталось ссылок на
    fonts.googleapis.com / fonts.gstatic.com;
  - на страницах Onest реально загружается и применяется: шрифт готов во
    всех используемых весах, и текст им рисуется иначе, чем запасным
    шрифтом (сравниваем ширину одной строки);
  - нет ни одного запроса, который вернул ошибку (опечатка в пути к файлу);
  - заранее подгружаемые файлы (preload) действительно используются —
    иначе браузер ругается в консоли, а мы качаем лишнее;
  - ЕГЭ база и ОГЭ часть 2 не разошлись с ЕГЭ профиль.

Запуск: python3 test_prompt_perf2_onest_local.py (сервер поднимается сам).
"""
import contextlib
import http.client
import os
import subprocess
import sys
import time

from playwright.sync_api import sync_playwright

HERE = os.path.dirname(os.path.abspath(__file__))
PORT = 8982
BASE = f"http://127.0.0.1:{PORT}"
# разные по устройству страницы: тренажёры, ЕГЭ, главная, доски, конспект,
# калькулятор в кадре и две страницы, где раньше был урезанный набор весов
PAGES = ["oge8", "addition", "ege_prof", "index", "boards", "notes",
         "rus_oge", "neg_pos", "sostav", "addition_embed", "works"]

fails = []


def check(cond, msg):
    print(("[OK]   " if cond else "[FAIL] ") + msg)
    if not cond:
        fails.append(msg)


@contextlib.contextmanager
def local_server():
    proc = subprocess.Popen([sys.executable, "-m", "http.server", str(PORT)],
                            cwd=HERE, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    try:
        for _ in range(50):
            try:
                c = http.client.HTTPConnection("127.0.0.1", PORT, timeout=0.2)
                c.request("GET", "/index.html")
                c.getresponse()
                break
            except Exception:
                time.sleep(0.1)
        yield
    finally:
        proc.terminate()
        proc.wait(timeout=5)


def static_checks():
    files = subprocess.run(["git", "ls-files", "*.html", "*.js", "*.css"], cwd=HERE,
                           capture_output=True, text=True).stdout.split()
    files = [f for f in files if not f.startswith("test_")]
    bad = [f for f in files
           if "fonts.googleapis.com" in open(os.path.join(HERE, f), encoding="utf-8", errors="ignore").read()
           or "fonts.gstatic.com" in open(os.path.join(HERE, f), encoding="utf-8", errors="ignore").read()]
    check(not bad, f"ссылок на Google Fonts не осталось {bad[:5]}")
    for name in ["cyrillic", "latin", "cyrillic-ext", "latin-ext", "math", "symbols"]:
        check(os.path.exists(os.path.join(HERE, "fonts", f"onest-{name}.woff2")),
              f"файл fonts/onest-{name}.woff2 на месте")
    r = subprocess.run([sys.executable, "sync_ege_pages.py", "--check"], cwd=HERE,
                       capture_output=True, text=True)
    check(r.returncode == 0, "ЕГЭ база и ОГЭ часть 2 совпадают с ЕГЭ профиль")


def run():
    static_checks()
    with local_server(), sync_playwright() as pw:
        b = pw.chromium.launch()
        for p in PAGES:
            ctx = b.new_context()
            pg = ctx.new_page()
            bad_resp, console = [], []
            pg.on("response", lambda r: bad_resp.append(f"{r.status} {r.url}")
                  if r.status >= 400 and r.url.startswith(BASE) else None)
            pg.on("console", lambda m: console.append(m.text) if "preload" in m.text else None)
            pg.route("https://**/*", lambda r: r.abort())
            pg.goto(f"{BASE}/{p}.html")
            pg.wait_for_timeout(1500)  # предупреждение о неиспользованном preload приходит через ~1 с
            info = pg.evaluate("""async () => {
                await document.fonts.ready;
                const weights = [300, 400, 500, 600, 700, 900];
                // check() отвечает «готов» и для шрифта, который вообще не объявлен,
                // поэтому сначала убеждаемся, что Onest в списке шрифтов страницы есть
                const declared = [...document.fonts].some(f => f.family.replace(/["']/g, '') === 'Onest');
                await Promise.all(weights.map(w => document.fonts.load(`${w} 16px Onest`, 'Ая1')));
                const loaded = [...document.fonts].filter(f => f.family.replace(/["']/g, '') === 'Onest'
                                                           && f.status === 'loaded').length;
                const m = (fam) => { const s = document.createElement('span');
                    s.style.cssText = `font:500 20px ${fam};position:absolute;white-space:nowrap;visibility:hidden`;
                    s.textContent = 'Задание 12: найдите значение 3,75'; document.body.appendChild(s);
                    const w = s.getBoundingClientRect().width; s.remove(); return w; };
                return { declared, loaded, onest: m("'Onest', serif"), fallback: m('serif'),
                         bodyFont: getComputedStyle(document.body).fontFamily };
            }""")
            check(info["declared"] and info["loaded"] >= 2,
                  f"{p}: Onest объявлен и загружен (наборов символов: {info['loaded']})")
            check(abs(info["onest"] - info["fallback"]) > 2,
                  f"{p}: текст рисуется именно Onest ({info['onest']:.0f} против {info['fallback']:.0f})")
            check(not bad_resp, f"{p}: все свои файлы отдаются без ошибок {bad_resp[:3]}")
            check(not console, f"{p}: preload без предупреждений {console[:1]}")
            ctx.close()
        b.close()
    print()
    if fails:
        print("ПРОВАЛЫ:", len(fails))
        sys.exit(1)
    print("ИТОГ: всё прошло")


if __name__ == "__main__":
    run()
