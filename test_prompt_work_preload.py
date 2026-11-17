"""
Работа «Списком»: весь вариант грузится сразу, прокрутка не перезагружает кадры
(задача 60). Проверяет (ноутбук и телефон):
  1. без прокрутки все задания становятся живыми (очередь livePreload);
  2. метка в окне кадра переживает проход вниз и вверх — кадры не пересозданы;
  3. после прохода картинок вместо кадров нет;
  4. нет ошибок JavaScript.
Запуск: python test_prompt_work_preload.py
"""
import sys
from test_prompt15_works_stage1 import BASE, PORT, local_server, sync_playwright, watch_errors
from test_prompt_work_live_view import make_work, student
from test_prompt15_works_stage1 import new_context, open_in_frame, add_task, TEACHER
import test_prompt_work_live_view as lv
N = 12


FAILS = []
def check(n, c, x=""):
    print(("[OK] " if c else "[FAIL] ") + n + (f" — {x}" if x and not c else ""))
    if not c: FAILS.append(n)

ST = "() => window.__work.views.map(v => ({ s: v.live ? v.live.state : null, img: v.wrap.querySelectorAll('img').length }))"
MARK = "() => window.__work.views.map(v => { const f = v.wrap.querySelector('.live-box iframe'); return f && f.contentWindow ? f.contentWindow.__m || null : null; })"

def make_big(browser):
    tctx = new_context(browser, viewport={"width": 1440, "height": 950})
    tp = tctx.new_page()
    tp.goto(f"{BASE}/works.html")
    tp.wait_for_selector("#scrAuth:not([hidden])")
    tp.fill("#auEmail", TEACHER["email"]); tp.fill("#auPass", TEACHER["password"]); tp.click("#auGo")
    tp.wait_for_selector("#scrList:not([hidden])"); tp.click("#newWork"); tp.wait_for_selector("#scrEdit:not([hidden])")
    open_in_frame(tp, "oge6", "document.querySelectorAll('.mode-card:not(.soon)')[2].click()")
    for k in range(1, N + 1): add_task(tp, k)
    tp.fill("#wkTitle", "Большой вариант"); tp.click("#wkSave")
    tp.wait_for_function("() => !document.getElementById('wkLinkBox').hidden", timeout=30000)
    link = tp.input_value("#wkLink").replace("http://127.0.0.1:%d" % PORT, BASE)
    tctx.close(); return link

def run_one(browser, link, errors, tag, vp, mobile):
    print(f"\n— {tag}")
    ctx, sp = student(browser, link, errors, tag, vp, mobile)
    sp.click('#wView button[data-v="list"]')
    try:
        sp.wait_for_function(f"() => window.__work.views.length === {N} && window.__work.views.every(v => v.live && v.live.state === 'ready')", timeout=120000)
    except Exception:
        print(sp.evaluate(ST)); raise
    check(f"{tag} 1 все задания живые без прокрутки", True)
    sp.evaluate("() => window.__work.views.forEach((v, i) => { v.wrap.querySelector('.live-box iframe').contentWindow.__m = 'm' + i; })")
    for y in ("document.body.scrollHeight", "0", "document.body.scrollHeight", "0"):
        sp.evaluate(f"() => window.scrollTo(0, {y})"); sp.wait_for_timeout(700)
    # 5. смена высоты карточки выше экрана не двигает читаемое: сдвиг страницы = разнице высот
    sp.evaluate("() => window.scrollTo(0, document.documentElement.scrollHeight)"); sp.wait_for_timeout(400)
    r = sp.evaluate("""() => { const v = window.__work.views[window.__work.views.length - 1]; const t0 = v.root.getBoundingClientRect().top;
      const f = window.__work.views[0]; f.H += 120; window.__work.fitView(f); return [t0, v.root.getBoundingClientRect().top]; }""")
    check(f"{tag} 5 карточка выше экрана выросла — читаемое не уехало (±2 px)", abs(r[0] - r[1]) <= 2, str(r))
    m = sp.evaluate(MARK); st = sp.evaluate(ST)
    check(f"{tag} 2 кадры не пересозданы", m == [f"m{i}" for i in range(N)], str(m))
    check(f"{tag} 3 все ready, картинок нет", all(x["s"] == "ready" and x["img"] == 0 for x in st), str(st))
    ctx.close()

def main():
    errors = []
    with local_server(), sync_playwright() as p:
        b = p.chromium.launch()
        link = make_big(b)
        run_one(b, link, errors, "ноутбук", {"width": 1440, "height": 950}, False)
        run_one(b, link, errors, "телефон", {"width": 390, "height": 844}, True)
        check("4 нет ошибок JavaScript", not errors, "; ".join(errors[:5]))
        b.close()
    print("\n" + ("ВСЁ ПРОШЛО" if not FAILS else "НЕ ПРОШЛО: " + ", ".join(FAILS)))
    sys.exit(1 if FAILS else 0)
if __name__ == "__main__": main()
