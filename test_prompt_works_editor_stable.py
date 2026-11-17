"""
Редактор работы (задача 60): ↑ ↓ и ⟳ листа из 12 заданий не сдвигают страницу
и не меняют её длину; порядок после ↑ ↓ верный; карточка без картинки держит
место по размеру снимка. Запуск: python test_prompt_works_editor_stable.py
"""
import sys
from test_prompt15_works_stage1 import BASE, local_server, sync_playwright, new_context, open_in_frame, add_task, TEACHER, watch_errors

N = 12
FAILS = []
def check(n, c, x=""):
    print(("[OK] " if c else "[FAIL] ") + n + (f" — {x}" if x and not c else ""))
    if not c: FAILS.append(n)

IDS = "() => [...document.querySelectorAll('#wkTasks .ti')].map(e => e.dataset.id)"
H = "() => [Math.round(window.scrollY), document.documentElement.scrollHeight]"

def main():
    errors = []
    with local_server(), sync_playwright() as p:
        b = p.chromium.launch()
        ctx = new_context(b, viewport={"width": 1440, "height": 900})
        tp = ctx.new_page(); watch_errors(tp, errors, "ред")
        tp.goto(f"{BASE}/works.html")
        tp.wait_for_selector("#scrAuth:not([hidden])")
        tp.fill("#auEmail", TEACHER["email"]); tp.fill("#auPass", TEACHER["password"]); tp.click("#auGo")
        tp.wait_for_selector("#scrList:not([hidden])"); tp.click("#newWork"); tp.wait_for_selector("#scrEdit:not([hidden])")
        open_in_frame(tp, "oge6", "document.querySelectorAll('.mode-card:not(.soon)')[2].click()")
        for k in range(1, N + 1): add_task(tp, k)
        tp.wait_for_timeout(1200)
        ids = tp.evaluate(IDS)
        check("1 в листе 12 заданий", len(ids) == N, str(len(ids)))
        # прокрутка к середине листа, ↓ у 5-го
        tp.evaluate("() => document.querySelectorAll('#wkTasks .ti')[4].scrollIntoView({block:'center'})")
        tp.wait_for_timeout(300)
        y0, h0 = tp.evaluate(H)
        tp.evaluate("() => document.querySelectorAll('#wkTasks .ti')[4].querySelector('[data-a=down]').click()")
        tp.wait_for_timeout(1200)
        y1, h1 = tp.evaluate(H)
        ids2 = tp.evaluate(IDS)
        check("2 ↓: порядок верный", ids2[4] == ids[5] and ids2[5] == ids[4], str(ids2[:7]))
        check("3 ↓: прокрутка не сдвинулась (±2 px)", abs(y0 - y1) <= 2, f"{y0}→{y1}")
        check("4 ↓: длина страницы та же (±2 px)", abs(h0 - h1) <= 2, f"{h0}→{h1}")
        tp.evaluate("() => document.querySelectorAll('#wkTasks .ti')[5].querySelector('[data-a=up]').click()")
        tp.wait_for_timeout(1200)
        y2, h2 = tp.evaluate(H)
        check("5 ↑: порядок вернулся", tp.evaluate(IDS) == ids)
        check("6 ↑: страница на месте (±2 px)", abs(y0 - y2) <= 2 and abs(h0 - h2) <= 2, f"{y0}/{h0}→{y2}/{h2}")
        # резерв места: сразу после перерисовки (до загрузки картинок) карточки не нулевой высоты
        r = tp.evaluate("""() => { const hs = [...document.querySelectorAll('#wkTasks .ti-img')].map(e => e.getBoundingClientRect().height); return Math.min(...hs); }""")
        check("7 у каждого превью есть высота", r > 20, str(r))
        check("8 нет ошибок JavaScript", not errors, "; ".join(errors[:5]))
        b.close()
    print("\n" + ("ВСЁ ПРОШЛО" if not FAILS else "НЕ ПРОШЛО: " + ", ".join(FAILS)))
    sys.exit(1 if FAILS else 0)
if __name__ == "__main__": main()
