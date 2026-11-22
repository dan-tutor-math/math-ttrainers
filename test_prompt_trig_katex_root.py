"""
Правка «корни в тригонометрических уравнениях через KaTeX»: в trig-bank.js корень из
числа (√2, √3) рисует KaTeX, прежняя разметка .rt остаётся для сложного подкоренного
и для страницы без KaTeX.
Проверяет: 1) на странице render(['sqrt',3]) даёт .katex .sqrt и не даёт .rt;
2) корень внутри дроби (√3/2) — KaTeX внутри .frac; 3) корень видим; 4) без KaTeX —
.rt; 5) сложное подкоренное — .rt; 6) 375 px без прокрутки вбок, без ошибок JS.
Запуск: ~/.venvs/trainers/bin/python test_prompt_trig_katex_root.py
"""
import sys
from playwright.sync_api import sync_playwright
import test_prompt_fipi15_18 as T

res = []
def check(n, ok, extra=""):
    res.append(ok); print(f"[{'OK' if ok else 'FAIL'}] {n}" + (f": {extra}" if extra and not ok else ""))

def main():
    with T.local_server(), sync_playwright() as pw:
        b = pw.chromium.launch()
        for width in (1300, 375):
            ctx, page, errs = T.new_page(b, f"{T.BASE}/trig_equations.html", width=width)
            B = "window.TRIG_BANK"
            has = page.evaluate(f"typeof {B}.render")
            check(f"{width}px: bank.render есть", has == 'function', has)
            page.evaluate(f"""() => {{ const d = document.createElement('div'); d.id = 'probe';
              d.innerHTML = {B}.render(['sqrt', 3]) + '<hr>' + {B}.render(['/', ['sqrt', 3], 2]) + '<hr>' + {B}.render(['sqrt', ['+', 1, 2]]);
              document.body.appendChild(d); }}""")
            page.wait_for_timeout(200)
            html = page.inner_html('#probe').split('<hr>')
            check(f"{width}px: √3 — KaTeX, без .rt", 'mord sqrt' in html[0] and 'class="rt"' not in html[0])
            check(f"{width}px: √3/2 — KaTeX внутри дроби", 'mord sqrt' in html[1] and 'class="frac"' in html[1])
            check(f"{width}px: сложное подкоренное — прежний .rt", 'class="rt"' in html[2])
            vis = page.evaluate("getComputedStyle(document.querySelector('#probe .katex')).visibility")
            check(f"{width}px: корень виден", vis == 'visible', vis)
            if width == 375:
                check("375 px без прокрутки вбок", page.evaluate("document.documentElement.scrollWidth <= innerWidth + 1"))
            else:
                old = page.evaluate(f"() => {{ const k = window.katex; window.katex = undefined; const h = {B}.render(['sqrt', 3]); window.katex = k; return h; }}")
                check("без KaTeX — прежний .rt", 'class="rt"' in old)
            check(f"{width}px: без ошибок JS", not errs, str(errs))
            ctx.close()
        b.close()
    ok = sum(res); print(f"\n{ok}/{len(res)} проверок прошло"); sys.exit(0 if ok == len(res) else 1)

if __name__ == '__main__':
    main()
