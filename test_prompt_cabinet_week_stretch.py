"""
Вид «Строки» (кабинет): карточки дней одной строки сетки тянутся по самой
высокой, а «за день» у всех стоит на одном уровне (schedule.css, .sc-days / .sc-dfoot).
"""
import json
import sys

from playwright.sync_api import sync_playwright

from test_prompt_cabinet_payments import B1, FIXED_NOW_JS
from test_prompt_cabinet_stats import stats_seed
from test_prompt_b1_student_memory import BASE, STATE, check, local_server


def main():
    errors = []
    STATE["db"] = json.dumps(stats_seed())
    STATE["offline"] = False
    with local_server(), sync_playwright() as pw:
        browser = pw.chromium.launch()
        ctx = B1.new_context(browser, signed_in=True, bind="tab")
        ctx.add_init_script(FIXED_NOW_JS)
        ctx.add_init_script("try{localStorage.setItem('cabinet:schedule:view','list')}catch(e){}")
        p = ctx.new_page()
        B1.PUMP["page"] = p
        p.on("pageerror", lambda e: errors.append(str(e)))
        p.set_viewport_size({"width": 1280, "height": 900})
        p.goto(f"{BASE}/cabinet.html#/schedule/2026-11-18")
        p.wait_for_selector(".sc-days .sc-day")
        rows = p.evaluate("""() => {
          const out = {};
          document.querySelectorAll('.sc-days .sc-day').forEach(d => {
            const r = d.getBoundingClientRect(), f = d.querySelector('.sc-dfoot').getBoundingClientRect();
            const k = Math.round(r.top);
            (out[k] = out[k] || []).push([Math.round(r.height), Math.round(f.bottom - r.top)]);
          });
          return Object.values(out);
        }""")
        check("S1 в сетке есть строка из нескольких дней", any(len(r) > 1 for r in rows), str(rows))
        check("S2 высоты карточек в строке равны", all(len({h for h, _ in r}) == 1 for r in rows), str(rows))
        check("S3 «за день» на одном уровне", all(len({f for _, f in r}) == 1 for r in rows), str(rows))
        check("S4 нет ошибок JS", not errors, str(errors))
        browser.close()


if __name__ == "__main__":
    main()
