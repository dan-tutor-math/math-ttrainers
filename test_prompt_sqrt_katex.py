"""
Правка «корни в ОГЭ №1–8, 19 через KaTeX» (sqrt-katex.js).
Проверяет на oge1_5, oge7, oge8, oge19 (+ oge6, он корней не содержит и не подключён):
  1. текст «√3», «2 − √3», «√(ab)», «√a · √b» в странице превращается в KaTeX-корни,
     простого «√» рядом с цифрой не остаётся;
  2. то же для узла, добавленного после загрузки (генераторы дорисовывают условие);
  3. поле ввода с «√» и готовый .katex не трогаются, текстовое значение поля цело;
  4. корень виден (шрифты прогреты), без ошибок JS, 375 px без прокрутки вбок.
Запуск: ~/.venvs/trainers/bin/python test_prompt_sqrt_katex.py
"""
import sys
from playwright.sync_api import sync_playwright
import test_prompt_fipi15_18 as T

res = []
def check(n, ok, extra=""):
    res.append(ok); print(f"[{'OK' if ok else 'FAIL'}] {n}" + (f": {extra}" if extra and not ok else ""))

PROBE = """() => {
  const d = document.createElement('div'); d.id = 'probe';
  d.innerHTML = '<p id="p1">a : b = √2, 2 − √3 и √(ab) · √a</p><input id="inp" value="72√3"><span id="p2" class="katex">√5</span>';
  document.body.appendChild(d);
}"""

def main():
    with T.local_server(), sync_playwright() as pw:
        b = pw.chromium.launch()
        for name in ("oge1_5", "oge7", "oge8", "oge19"):
            for width in (1300, 375):
                ctx, page, errs = T.new_page(b, f"{T.BASE}/{name}.html?all=1", width=width)
                page.evaluate(PROBE); page.wait_for_timeout(300)
                n = page.eval_on_selector_all('#p1 .sqrt-kx .sqrt', 'e => e.length')
                left = page.evaluate("(document.getElementById('p1').innerText.match(/√/g) || []).length")
                vis = page.evaluate("getComputedStyle(document.querySelector('#p1 .katex')).visibility")
                check(f"{name} {width}px: 4 корня KaTeX, «√» не осталось, видны", n == 4 and left == 0 and vis == 'visible', f"{n} {left} {vis}")
                if width == 1300:
                    # узел, добавленный после загрузки
                    page.evaluate("document.getElementById('probe').insertAdjacentHTML('beforeend','<i id=\"p3\">√7</i>')")
                    page.wait_for_timeout(300)
                    check(f"{name}: поздний узел преобразован", page.eval_on_selector_all('#p3 .sqrt', 'e => e.length') == 1)
                    check(f"{name}: поле ввода и готовый .katex целы",
                          page.input_value('#inp') == '72√3' and page.inner_text('#p2').count('√') == 0 or page.eval_on_selector_all('#p2 .sqrt-kx', 'e => e.length') == 0)
                else:
                    check(f"{name} 375px: без прокрутки вбок", page.evaluate("document.documentElement.scrollWidth <= innerWidth + 1"))
                check(f"{name} {width}px: без ошибок JS", not errs, str(errs))
                ctx.close()
        b.close()
    ok = sum(res); print(f"\n{ok}/{len(res)} проверок прошло"); sys.exit(0 if ok == len(res) else 1)

if __name__ == '__main__':
    main()
