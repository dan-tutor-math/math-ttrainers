"""
Работа: вид задания при листании один и тот же (задача «вид всегда один»).

Раньше в «По одному» каждый переход строил блок задания заново: сначала
снимок-картинка, через секунды — кадр тренажёра, свёрстанный иначе (другие
переносы, высота, подложка-рамка), а оба растягивались картинкой с 440 px.

Проверяет (ноутбук 1440 и телефон 390):
  1. первое задание — пока кадр грузится, место «Загружаю…», а не картинка;
  2. 1→2→3→2: задание сразу живое (следующее загружено заранее), картинки нет,
     за 2 с после показа высота не меняется больше чем на 4 px;
  3. возврат к №2 — тот же кадр, не перезагружен (метка в окне кадра цела);
  4. кадр свёрстан по ширине карточки (ширина окна кадра = ширине задания,
     масштаб 1), а не растянут картинкой;
  5. в кадре нет подложки и панели: фон body, фон/тень/рамка узла задания
     прозрачны;
  6. «Списком» после «По одному»: спрятанных блоков не осталось, все задания
     на месте; страница не шире экрана;
  7. нет ошибок JavaScript.

Запуск: ~/.venvs/trainers/bin/python test_prompt_work_live_view.py
"""
import sys

from test_prompt15_works_stage1 import (
    BASE, PORT, TEACHER, local_server, sync_playwright, new_context, watch_errors,
    open_in_frame, add_task, back_to_catalog, overflow_x,
)

FAILS = []
JUMP = 4


def check(name, cond, extra=""):
    print(("[OK] " if cond else "[FAIL] ") + name + (f" — {extra}" if extra and not cond else ""))
    if not cond:
        FAILS.append(name)


STATE = """() => { const v = window.__work.views[0]; const w = v.wrap; const f = w.querySelector('.live-box iframe');
  return { live: v.live ? v.live.state : null, img: w.querySelectorAll('img').length, wait: !!w.querySelector('.tc-wait'),
    h: Math.round(w.getBoundingClientRect().height), ww: Math.round(w.getBoundingClientRect().width),
    iw: f && f.contentWindow ? f.contentWindow.innerWidth : 0, k: v.k,
    mark: f && f.contentWindow ? f.contentWindow.__mark || null : null }; }"""

CHROME = """() => { const f = window.__work.views[0].wrap.querySelector('.live-box iframe'); const w = f.contentWindow, d = w.document;
  const b = w.getComputedStyle(d.body), r = w.getComputedStyle(d.querySelector('[data-wl-root]'));
  const clear = c => c === 'rgba(0, 0, 0, 0)' || c === 'transparent';
  return { body: clear(b.backgroundColor) && b.backgroundImage === 'none', rootBg: clear(r.backgroundColor) && r.backgroundImage === 'none',
    rootShadow: r.boxShadow === 'none', rootBorder: parseFloat(r.borderTopWidth) === 0 }; }"""


def make_work(browser):
    tctx = new_context(browser, viewport={"width": 1440, "height": 950})
    tp = tctx.new_page()
    tp.goto(f"{BASE}/works.html")
    tp.wait_for_selector("#scrAuth:not([hidden])")
    tp.fill("#auEmail", TEACHER["email"]); tp.fill("#auPass", TEACHER["password"])
    tp.click("#auGo")
    tp.wait_for_selector("#scrList:not([hidden])")
    tp.click("#newWork")
    tp.wait_for_selector("#scrEdit:not([hidden])")
    open_in_frame(tp, "oge6", "document.querySelectorAll('.mode-card:not(.soon)')[2].click()"); add_task(tp, 1); back_to_catalog(tp)
    open_in_frame(tp, "oge7", "document.querySelectorAll('.mode-card:not(.soon)')[3].click()"); add_task(tp, 2); back_to_catalog(tp)
    open_in_frame(tp, "oge19", "document.querySelectorAll('.mode-card:not(.soon)')[1].click()"); add_task(tp, 3)
    tp.fill("#wkTitle", "Вид заданий")
    tp.click("#wkSave")
    tp.wait_for_function("() => !document.getElementById('wkLinkBox').hidden", timeout=30000)
    link = tp.input_value("#wkLink").replace("http://127.0.0.1:%d" % PORT, BASE)
    tctx.close()
    return link


def student(browser, link, errors, tag, vp, mobile):
    ctx = new_context(browser, live=True, viewport=vp, is_mobile=mobile, has_touch=mobile)
    sp = ctx.new_page()
    watch_errors(sp, errors, tag)
    sp.goto(link)
    sp.wait_for_selector("#scrStart:not([hidden])")
    sp.fill("#wName", "Петя")
    sp.click("#wStart")
    sp.wait_for_selector("#scrTask:not([hidden])")
    return ctx, sp


def run_one(browser, link, errors, tag, vp, mobile):
    print(f"\n— {tag}")
    ctx, sp = student(browser, link, errors, tag, vp, mobile)
    s0 = sp.evaluate(STATE)
    check(f"{tag} 1 пока грузится — место «Загружаю…», не картинка", s0["img"] == 0 and (s0["wait"] or s0["live"] == "ready"), str(s0))
    sp.wait_for_function("() => window.__work.views[0].live && window.__work.views[0].live.state === 'ready'", timeout=25000)
    sp.wait_for_timeout(1500)
    for i in (1, 2, 1):
        sp.click(f".num[data-i='{i}']")
        sp.wait_for_timeout(150)
        a = sp.evaluate(STATE)
        if a["mark"] is None and a["live"] == "ready":
            sp.evaluate("() => { window.__work.views[0].wrap.querySelector('.live-box iframe').contentWindow.__mark = 'n' + window.__work.views[0].i; }")
        sp.wait_for_timeout(2000)
        b = sp.evaluate(STATE)
        check(f"{tag} 2 №{i + 1}: сразу живое, без картинки", a["live"] == "ready" and a["img"] == 0 and not a["wait"], str(a))
        check(f"{tag} 2 №{i + 1}: высота не прыгает (≤ {JUMP} px)", abs(a["h"] - b["h"]) <= JUMP, f"{a['h']}→{b['h']}")
        check(f"{tag} 4 №{i + 1}: кадр по ширине задания, масштаб 1", abs(b["iw"] - b["ww"]) <= 2 and abs(b["k"] - 1) < 0.02, str(b))
        if i == 1 and a["mark"]:
            check(f"{tag} 3 возврат к №2 — тот же кадр, не перезагружен", a["mark"] == "n1", str(a))
    check(f"{tag} 3 возврат к №2 — метка была", sp.evaluate(STATE)["mark"] == "n1")
    ch = sp.evaluate(CHROME)
    check(f"{tag} 5 в кадре нет подложки, фона, тени и рамки панели", all(ch.values()), str(ch))
    check(f"{tag} 6а страница не шире экрана", overflow_x(sp) <= 0, str(overflow_x(sp)))
    sp.click('#wView button[data-v="list"]')
    sp.wait_for_timeout(1500)
    n = sp.evaluate("() => [document.querySelectorAll('#wHost .titem').length, document.querySelectorAll('#wHost .parked').length]")
    check(f"{tag} 6 «Списком»: все 3 задания, спрятанных нет", n == [3, 0], str(n))
    sp.click('#wView button[data-v="one"]')
    sp.wait_for_timeout(500)
    n = sp.evaluate("() => [document.querySelectorAll('#wHost .titem:not(.parked)').length, document.querySelectorAll('#wHost .titem.cur').length]")
    check(f"{tag} 6б снова «По одному»: на экране одно задание", n == [1, 1], str(n))
    ctx.close()


def run():
    errors = []
    with local_server(), sync_playwright() as p:
        browser = p.chromium.launch()
        link = make_work(browser)
        run_one(browser, link, errors, "ноутбук", {"width": 1440, "height": 950}, False)
        run_one(browser, link, errors, "телефон", {"width": 390, "height": 844}, True)
        print("\n— ошибки JavaScript")
        check("7 нет ошибок JavaScript", not errors, "; ".join(errors[:5]))
        browser.close()
    print("\n" + ("ВСЁ ПРОШЛО" if not FAILS else f"НЕ ПРОШЛО: {len(FAILS)} — " + ", ".join(FAILS)))
    sys.exit(1 if FAILS else 0)


if __name__ == "__main__":
    run()
