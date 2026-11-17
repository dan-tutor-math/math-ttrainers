"""
Работа «По одному» на 12 заданиях (задача 60): листание 1→12→1 — высота
показанного задания не прыгает (≤ 4 px за 1.5 с), вернувшееся задание — тот
же кадр (метка цела). Запуск: python test_prompt_work_one_stable.py
"""
import sys
from test_prompt15_works_stage1 import BASE, local_server, sync_playwright
import test_prompt_work_preload as pre
from test_prompt_work_live_view import student

FAILS = []
def check(n, c, x=""):
    print(("[OK] " if c else "[FAIL] ") + n + (f" — {x}" if x and not c else ""))
    if not c: FAILS.append(n)

ST = "() => { const v = window.__work.views[0]; const f = v.wrap.querySelector('.live-box iframe'); return { s: v.live ? v.live.state : null, h: Math.round(v.wrap.getBoundingClientRect().height), m: f && f.contentWindow ? f.contentWindow.__m || null : null }; }"

def run_one(b, link, errors, tag, vp, mobile):
    print(f"\n— {tag}")
    ctx, sp = student(b, link, errors, tag, vp, mobile)
    sp.wait_for_function("() => window.__work.views[0].live && window.__work.views[0].live.state === 'ready'", timeout=40000)
    seq = list(range(pre.N)) + list(range(pre.N - 2, -1, -1))
    marks = {}
    for i in seq:
        sp.click(f".num[data-i='{i}']"); sp.wait_for_timeout(250)
        a = sp.evaluate(ST)
        if a["s"] != "ready":
            try: sp.wait_for_function("() => window.__work.views[0].live && window.__work.views[0].live.state === 'ready'", timeout=30000)
            except Exception: pass
            a = sp.evaluate(ST)
        sp.wait_for_timeout(1300)
        c = sp.evaluate(ST)
        check(f"{tag} №{i + 1}: высота не прыгает", abs(a["h"] - c["h"]) <= 4, f"{a['h']}→{c['h']}")
        if i in marks: check(f"{tag} №{i + 1}: кадр тот же", c["m"] == marks[i], str(c))
        else:
            sp.evaluate(f"() => {{ window.__work.views[0].wrap.querySelector('.live-box iframe').contentWindow.__m = 'm{i}'; }}")
            marks[i] = f"m{i}"
    ctx.close()

def main():
    errors = []
    with local_server(), sync_playwright() as p:
        b = p.chromium.launch()
        link = pre.make_big(b)
        run_one(b, link, errors, "ноутбук", {"width": 1440, "height": 950}, False)
        run_one(b, link, errors, "телефон", {"width": 390, "height": 844}, True)
        check("нет ошибок JavaScript", not errors, "; ".join(errors[:5]))
        b.close()
    print("\n" + ("ВСЁ ПРОШЛО" if not FAILS else f"НЕ ПРОШЛО: {len(FAILS)} — " + ", ".join(FAILS[:6])))
    sys.exit(1 if FAILS else 0)
if __name__ == "__main__": main()
