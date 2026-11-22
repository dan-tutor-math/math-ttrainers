"""
Правка «корни в ОГЭ №15–17 через KaTeX»: rad() в oge15_18-kinds.js рисует \\sqrt
(знак и черта слиты), а не «√» + отдельный span.rad.

Проверяет:
  1. у вида «Равносторонний: радиус вписанной» (сторона 6√3) условие содержит
     .katex с .sqrt, а старого span.rad нет; корень видимый (шрифты прогреты);
  2. разбор («Тренировка») тоже с KaTeX: корень внутри дроби и в решении;
  3. условие text(a) остаётся плоским «6√3» (сверка с ФИПИ идёт по тексту);
  4. без KaTeX (как в node) rad() отдаёт прежнюю разметку — запасной путь жив;
  5. телефон 375 px без прокрутки вбок, без ошибок JS.
Запуск: ~/.venvs/trainers/bin/python test_prompt_oge15_18_katex_root.py
"""
import os, sys
from playwright.sync_api import sync_playwright
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import test_prompt_fipi15_18 as T

res = []
def check(n, ok, extra=""):
    res.append(ok); print(f"[{'OK' if ok else 'FAIL'}] {n}" + (f": {extra}" if extra and not ok else ""))

def main():
    with T.local_server(), sync_playwright() as pw:
        b = pw.chromium.launch()
        for width in (1300, 375):
            ctx, page, errs = T.new_page(b, f"{T.BASE}/oge15_18.html?all=1", width=width)
            page.click('.mode-card[data-id="c_eq_r_from_a"]'); page.wait_for_timeout(300)
            # подставляем задание со стороной 6√3 — как на скриншоте Даниила
            page.evaluate("""() => { const G = window.GEOM_KINDS, k = G.byId['c_eq_r_from_a'];
              const t = G.build(k, ['6','3']); document.getElementById('questionPromptText').innerHTML = t.prompt;
              window.__t = t; }""")
            page.wait_for_timeout(100)
            n_k = page.eval_on_selector_all('#questionPromptText .katex .sqrt', 'e => e.length')
            n_old = page.eval_on_selector_all('#questionPromptText .rad', 'e => e.length')
            vis = page.evaluate("getComputedStyle(document.querySelector('#questionPromptText .katex')).visibility")
            check(f"{width}px: условие — корень KaTeX, старого .rad нет, виден", n_k == 1 and n_old == 0 and vis == 'visible', f"{n_k} {n_old} {vis}")
            lines = page.evaluate("window.__t.lines.join('')")
            check(f"{width}px: разбор содержит KaTeX-корни", 'mord sqrt' in lines and 'class="rad"' not in lines)
            if width == 1300:
                plain = page.evaluate("window.GEOM_KINDS.byId['c_eq_r_from_a'].text(['6','3'])")
                check("text(a) плоский «6√3»", '6√3' in plain and '<' not in plain, plain)
                page.screenshot(path=os.path.join(T.HERE, '..', 'claude-notes', 'oge15_18_katex_root.png')) if os.path.isdir(os.path.join(T.HERE, '..', 'claude-notes')) else None
            else:
                sw = page.evaluate("document.documentElement.scrollWidth <= innerWidth + 1")
                check("телефон 375 px без прокрутки вбок", sw)
            check(f"{width}px: без ошибок JS", not errs, str(errs))
            ctx.close()
        # запасной путь без KaTeX
        ctx, page, errs = T.new_page(b, f"{T.BASE}/oge15_18.html?all=1")
        old = page.evaluate("""() => { const k = window.katex; window.katex = undefined;
          const h = window.GEOM_KINDS.html('6√3'); window.katex = k; return h; }""")
        check("без KaTeX — прежняя разметка", 'class="rad"' in old, old)
        ctx.close(); b.close()
    ok = sum(res); print(f"\n{ok}/{len(res)} проверок прошло"); sys.exit(0 if ok == len(res) else 1)

if __name__ == '__main__':
    main()
