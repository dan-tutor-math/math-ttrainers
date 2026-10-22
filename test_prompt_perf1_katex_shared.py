"""
Скорость №1: KaTeX — общими файлами katex-0.18.5.js и katex-0.18.5.css
вместо копии внутри каждой из 10 страниц.

Зачем: копия KaTeX со шрифтами — около 620 КБ, и пока она лежала внутри
страницы, браузер не мог взять её из кэша и качал заново на каждой странице.

Что проверяем:
  - ни на одной из 10 страниц не осталось встроенной копии (ни шрифтов
    base64, ни скрипта), а подключены оба общих файла;
  - KaTeX работает: формула рисуется, показ формул открыт
    (html.katex-fonts-ready), все начертания из прогрева готовы — то есть
    шрифты из файла действительно применились, а не подменились запасными;
  - ширина одной и той же формулы такая же, как у KaTeX со своими
    шрифтами (запасной шрифт дал бы другую ширину);
  - доски: формула в картинку (rasterizeFormula, SVG foreignObject) по-прежнему
    рисуется шрифтами KaTeX. SVG-картинка не умеет грузить внешнее, поэтому
    стили вклеиваются в неё текстом, и шрифты в этом тексте должны быть
    внутри (base64). Сравниваем картинку с картинкой без стилей KaTeX —
    они обязаны отличаться;
  - ЕГЭ база и ОГЭ часть 2 не разошлись с ЕГЭ профиль (sync_ege_pages.py).

Запуск: python3 test_prompt_perf1_katex_shared.py (сервер поднимается сам).
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
PORT = 8981
BASE = f"http://127.0.0.1:{PORT}"
PAGES = ["boards", "ege_base", "ege_prof", "index", "logarithms",
         "oge12", "oge7", "oge8", "oge_part2", "powers"]
CSS = "katex-0.18.5.css"
JS = "katex-0.18.5.js"
WARM = [("400", "normal", "KaTeX_Main"), ("700", "normal", "KaTeX_Main"),
        ("400", "italic", "KaTeX_Main"), ("700", "italic", "KaTeX_Main"),
        ("400", "italic", "KaTeX_Math"), ("700", "italic", "KaTeX_Math"),
        ("400", "normal", "KaTeX_SansSerif"), ("700", "normal", "KaTeX_SansSerif"),
        ("400", "italic", "KaTeX_SansSerif")]
FORMULA = r"\frac{x^{2}-1}{\sqrt{3}}+\log_{2}8"

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
    for p in PAGES:
        s = open(os.path.join(HERE, p + ".html"), encoding="utf-8").read()
        check("data:font/woff2" not in s and '!function(e,t){"object"==typeof exports' not in s,
              f"{p}: встроенной копии KaTeX нет")
        check(f'href="{CSS}"' in s and f'src="{JS}"' in s, f"{p}: подключены {CSS} и {JS}")
    css = open(os.path.join(HERE, CSS), encoding="utf-8").read()
    check(len(re.findall(r"@font-face", css)) == 20 and "data:font/woff2" in css,
          "в CSS 20 шрифтов, все внутри файла (нужно для картинок досок)")
    r = subprocess.run([sys.executable, "sync_ege_pages.py", "--check"], cwd=HERE,
                       capture_output=True, text=True)
    check(r.returncode == 0, "ЕГЭ база и ОГЭ часть 2 совпадают с ЕГЭ профиль")


def run():
    static_checks()
    with local_server(), sync_playwright() as pw:
        b = pw.chromium.launch()
        widths = {}
        for p in PAGES:
            ctx = b.new_context()
            pg = ctx.new_page()
            errors = []
            pg.on("pageerror", lambda e: errors.append(str(e)))
            pg.route("https://**/*", lambda r: r.abort())
            pg.goto(f"{BASE}/{p}.html")
            pg.wait_for_function("document.documentElement.classList.contains('katex-fonts-ready')",
                                 timeout=10000)
            info = pg.evaluate("""([f, warm]) => {
                const d = document.createElement('div');
                d.style.cssText = 'position:absolute;left:0;top:0;font-size:20px';
                document.body.appendChild(d);
                katex.render(f, d);
                const w = d.querySelector('.katex').getBoundingClientRect().width;
                const vis = getComputedStyle(d.querySelector('.katex')).visibility;
                d.remove();
                const fonts = warm.map(([wt, st, fam]) => document.fonts.check(`${st} ${wt} 16px ${fam}`));
                return { w: Math.round(w * 10) / 10, vis, fonts };
            }""", [FORMULA, WARM])
            check(not errors, f"{p}: без ошибок JS" + (f" {errors[:1]}" if errors else ""))
            check(info["vis"] == "visible", f"{p}: формулы показаны")
            check(all(info["fonts"]), f"{p}: все начертания KaTeX загружены")
            widths[p] = info["w"]

            if p == "boards":
                res = pg.evaluate("""async (f) => {
                    const css = katexCssText();
                    const a = await rasterizeFormula(f, 32);
                    // та же формула без стилей KaTeX: подменяем источник текста стилей
                    const link = document.getElementById('katexCss');
                    link.id = 'katexCssOff'; katexCssCache = '';
                    const b = await rasterizeFormula(f, 32);
                    link.id = 'katexCss';
                    const px = async (url) => {
                        const im = new Image(); im.src = url; await im.decode();
                        const c = document.createElement('canvas'); c.width = im.width; c.height = im.height;
                        const x = c.getContext('2d'); x.drawImage(im, 0, 0);
                        const d = x.getImageData(0, 0, c.width, c.height).data;
                        let ink = 0; for (let i = 3; i < d.length; i += 4) if (d[i] > 128) ink++;
                        return { w: im.width, h: im.height, ink };
                    };
                    return { css: css.length, fonts: (css.match(/@font-face/g) || []).length,
                             withKatex: await px(a.dataUrl), without: await px(b.dataUrl) };
                }""", FORMULA)
                check(res["fonts"] == 20 and res["css"] > 300000,
                      f"доски: текст стилей KaTeX для картинок со шрифтами ({res['fonts']} шрифтов)")
                check(res["withKatex"]["ink"] > 500, f"доски: формула нарисована ({res['withKatex']})")
                check(res["withKatex"] != res["without"],
                      "доски: в картинке формулы действуют стили KaTeX (без них картинка другая)")
            ctx.close()
        b.close()
    check(len(set(widths.values())) == 1, f"одна и та же формула одной ширины на всех страницах: {widths}")
    print()
    if fails:
        print("ПРОВАЛЫ:", len(fails))
        sys.exit(1)
    print("ИТОГ: всё прошло")


if __name__ == "__main__":
    run()
