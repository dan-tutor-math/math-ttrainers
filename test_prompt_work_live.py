"""
Живое задание в работе: у ученика вместо картинки — сам тренажёр в кадре с
тем же заданием (как на «Решу ЕГЭ»), масштаб меняется на лету, проверяет и
пишет в базу страница работы. Задания без пометки live (добавленные раньше)
и задания, разошедшиеся с тренажёром, остаются картинками.

Заглушка Supabase и помощники — из теста этапа 1.

Проверяет:
  A. конструктор: у ОГЭ №6, №7, №19, ЕГЭ база №8 и «Процентов» — пометка
     live с узлом задания, у столбика — нет (лист решения живёт шагами);
  B. ученик с телефона: картинка сменяется кадром тренажёра; в кадре только
     задание (без калькулятора, шапки, разбора), страница не шире экрана;
     высота кадра — по содержимому; «A+ / A−» — крупнее и мельче, кадр
     перестраивается, ширина колонки та же; смена темы — кадр не
     перезагружается, тема в нём новая;
  C. ответ в полях самого тренажёра: Enter и его «Проверить» перехвачены —
     тренажёр сам не проверяет и разбор не открывает, «Неверно», попытка;
     верный — «Верно!», в базе; выбор варианта ОГЭ №7 — сразу ответ;
     утверждения ОГЭ №19; ЕГЭ база №8 — поле по data-fid; «Проценты»;
     столбик — картинка с полем, как раньше;
  D. «Списком»: живых кадров не больше LIVE_MAX, у первого — кадр;
  E. запасной путь: задание без live — картинка; ответ в работе не совпал с
     заданием в тренажёре — картинка, кадра нет;
  F. нет ошибок JavaScript.

Запуск: python3 test_prompt_work_live.py
"""
import json
import re
import sys

import test_prompt15_works_stage1 as st1
from test_prompt15_works_stage1 import (
    BASE, PORT, TEACHER, local_server, sync_playwright, new_context, watch_errors, db,
    open_in_frame, add_task, back_to_catalog, correct_input, ans_of, overflow_x,
)

FAILS = []


def check(name, cond, extra=""):
    print(("[OK] " if cond else "[FAIL] ") + name + (f" — {extra}" if extra and not cond else ""))
    if not cond:
        FAILS.append(name)


LIVE_FR = ".titem.cur .live-box:not(.loading) iframe"


def wait_live(page, timeout=25000):
    page.wait_for_selector(LIVE_FR, timeout=timeout)
    page.wait_for_timeout(300)


def fr(page):
    return page.frame_locator(LIVE_FR)


def fr_eval(page, js):
    return page.evaluate("(js) => document.querySelector('" + LIVE_FR + "').contentWindow.eval(js)", js)


def start_student(browser, link, errors, tag):
    ctx = new_context(browser, live=True, viewport={"width": 390, "height": 844}, is_mobile=True, has_touch=True)
    sp = ctx.new_page()
    watch_errors(sp, errors, tag)
    sp.goto(link)
    sp.wait_for_selector("#scrStart:not([hidden])")
    sp.fill("#wName", "Петя")
    sp.click("#wStart")
    sp.wait_for_selector("#scrTask:not([hidden])")
    return ctx, sp


def run():
    errors = []
    with local_server(), sync_playwright() as p:
        browser = p.chromium.launch()

        # ═══ A. конструктор ═══
        print("\n— A. конструктор")
        tctx = new_context(browser, viewport={"width": 1440, "height": 950})
        tp = tctx.new_page()
        watch_errors(tp, errors, "works")
        tp.goto(f"{BASE}/works.html")
        tp.wait_for_selector("#scrAuth:not([hidden])")
        tp.fill("#auEmail", TEACHER["email"]); tp.fill("#auPass", TEACHER["password"])
        tp.click("#auGo")
        tp.wait_for_selector("#scrList:not([hidden])")
        tp.click("#newWork")
        tp.wait_for_selector("#scrEdit:not([hidden])")
        open_in_frame(tp, "oge6", "document.querySelectorAll('.mode-card:not(.soon)')[2].click()")
        add_task(tp, 1); back_to_catalog(tp)
        open_in_frame(tp, "oge7", "document.querySelectorAll('.mode-card:not(.soon)')[3].click()")
        add_task(tp, 2); back_to_catalog(tp)
        open_in_frame(tp, "oge19", "document.querySelectorAll('.mode-card:not(.soon)')[1].click()")
        add_task(tp, 3); back_to_catalog(tp)
        open_in_frame(tp, "egeb8", "document.querySelectorAll('.mode-card')[0].click()")
        add_task(tp, 4); back_to_catalog(tp)
        open_in_frame(tp, "percent", "openProto('parts', 2)")
        add_task(tp, 5); back_to_catalog(tp)
        open_in_frame(tp, "add_col", "curLevel = 3; newProblem();")
        add_task(tp, 6)
        lives = tp.evaluate("() => window.__works.E.blocks.map(b => b.live ? b.live.sel : null)")
        check("A1 пометка live у ОГЭ №6, №7, №19, ЕГЭ б. №8, «Процентов»",
              lives[:5] == ["#questionPanel", "#questionPanel", "#questionPanel", "#egeQuestion", "#pctQuestion"], str(lives))
        check("A2 у столбика пометки нет", lives[5] is None, str(lives))
        check("A3 картинка у живых тоже есть (превью и запасной путь)",
              tp.evaluate("() => window.__works.E.blocks.every(b => b.img && b.img.light && b.img.light.url)"))
        tp.fill("#wkTitle", "Живые задания")
        tp.click('#wkTries button[data-t="2"]')
        tp.click("#wkSave")
        tp.wait_for_function("() => !document.getElementById('wkLinkBox').hidden", timeout=30000)
        link = tp.input_value("#wkLink").replace("http://127.0.0.1:%d" % PORT, BASE)
        tasks = db()["work_variants"][0]["blocks"]
        check("A4 в базе пометка live сохранилась", [bool(b.get("live")) for b in tasks] == [True] * 5 + [False])

        # ═══ B. ученик: кадр вместо картинки ═══
        print("\n— B. ученик: живое задание")
        sctx, sp = start_student(browser, link, errors, "work")
        wait_live(sp)
        check("B1 картинка сменилась кадром тренажёра", sp.locator(".titem.cur .tc-wrap img").count() == 0
              and sp.locator(".titem.cur .tc-wrap .tc-in").count() == 0)
        vis = fr_eval(sp, """(() => { const v = s => { const e = document.querySelector(s); return !!e && getComputedStyle(e).display !== 'none' && e.getBoundingClientRect().height > 0; };
            return { q: v('#questionPanel'), inp: v('#answerInput'), calc: v('#calcTools'), h1: v('h1'), main: v('#mainPanel') }; })()""")
        check("B2 в кадре только задание с полем — без калькулятора, заголовка, разбора",
              vis["q"] and vis["inp"] and not vis["calc"] and not vis["h1"] and not vis["main"], str(vis))
        check("B3 страница не шире экрана", overflow_x(sp) <= 0, str(overflow_x(sp)))
        hh = sp.evaluate("""() => { const f = document.querySelector('""" + LIVE_FR + """'); const r = f.contentDocument.querySelector('[data-wl-root]').getBoundingClientRect();
            return [f.clientHeight, Math.ceil(r.bottom)]; }""")
        check("B4 высота кадра — по содержимому", abs(hh[0] - hh[1]) <= 4, str(hh))
        w0 = sp.evaluate("() => document.querySelector('.titem.cur .tc-wrap').getBoundingClientRect().width")
        iw0 = fr_eval(sp, "innerWidth")
        k0 = sp.evaluate("() => window.__work.views[0].k")
        sp.click("#wZoomIn"); sp.wait_for_timeout(250)
        iw1 = fr_eval(sp, "innerWidth")
        k1 = sp.evaluate("() => window.__work.views[0].k")
        w1 = sp.evaluate("() => document.querySelector('.titem.cur .tc-wrap').getBoundingClientRect().width")
        check("B5 «A+» — крупнее: кадр уже (перестроен), масштаб больше, колонка та же",
              iw1 < iw0 and k1 > k0 and abs(w1 - w0) <= 2, f"{iw0}→{iw1}, k {k0:.2f}→{k1:.2f}, w {w0}→{w1}")
        check("B6 масштаб помнится", sp.evaluate("() => JSON.parse(localStorage.getItem('work:lzoom'))") > 1)
        sp.click("#wZoomOut"); sp.wait_for_timeout(250)
        check("B7 «A−» — обратно", abs(fr_eval(sp, "innerWidth") - iw0) <= 2, str(fr_eval(sp, "innerWidth")))
        fr_eval(sp, "window.__mark = 7")
        sp.click("#themeToggle"); sp.wait_for_timeout(300)
        th = sp.evaluate("() => document.documentElement.getAttribute('data-theme')")
        check("B8 смена темы — кадр не перезагружен, тема в нём новая",
              fr_eval(sp, "window.__mark") == 7 and fr_eval(sp, "document.documentElement.getAttribute('data-theme')") == th)

        # ═══ C. ответы в полях тренажёра ═══
        print("\n— C. ответы")
        t1 = tasks[0]["task"]
        inp = fr(sp).locator("#answerInput")
        inp.fill("987654"); inp.press("Enter"); sp.wait_for_timeout(300)
        a = ans_of(sp, tasks[0]["id"])
        own = fr_eval(sp, "[getComputedStyle(document.getElementById('explainBox')).display, (tsGetState().totalErrors || 0)]")
        check("C1 Enter в поле тренажёра — проверила работа: «Неверно», попытка 1",
              a and a["tries"] == 1 and a["status"] == "pending" and "Неверно" in sp.inner_text(".titem.cur .wmsg"), str(a))
        check("C2 тренажёр сам не проверял и разбор не открыл", own[0] == "none" and own[1] == 0, str(own))
        check("C3 поле отмечено ошибкой", "bad" in (inp.get_attribute("class") or ""))
        inp.fill(str(t1["fields"][0]["value"]))
        fr(sp).locator("#checkAnswerBtn").click(); sp.wait_for_timeout(300)
        a = ans_of(sp, tasks[0]["id"])
        check("C4 «Проверить» тренажёра — «Верно!», поле заблокировано",
              a and a["status"] == "ok" and a["tries"] == 2 and "Верно" in sp.inner_text(".titem.cur .wmsg") and inp.is_disabled(), str(a))
        sp.click(".titem.cur .b-next")
        wait_live(sp)
        t2 = tasks[1]["task"]
        fr(sp).locator(".mcq-btn").nth(t2["correct"]).click(); sp.wait_for_timeout(300)
        a = ans_of(sp, tasks[1]["id"])
        check("C5 ОГЭ №7: выбор варианта в тренажёре — сразу «Верно!»", a and a["status"] == "ok", str(a))
        sp.click(".titem.cur .b-next")
        wait_live(sp)
        t3 = tasks[2]["task"]
        for i in t3["correct"]:
            fr(sp).locator(".stmt").nth(i).click()
        fr(sp).locator(".check-btn").first.click(); sp.wait_for_timeout(300)
        a = ans_of(sp, tasks[2]["id"])
        check("C6 ОГЭ №19: утверждения — верно", a and a["status"] == "ok", str(a))
        sp.click(".titem.cur .b-next")
        wait_live(sp)
        t4 = tasks[3]["task"]
        n_in = fr_eval(sp, "document.querySelectorAll('[data-wl-root] input.answer-input').length")
        for fid, v in correct_input(t4).items():
            fr(sp).locator(f'input[data-fid="{fid}"]').fill(str(v))
        if sp.locator(".titem.cur .below input").count():
            for fid, v in correct_input(t4).items():
                sp.fill(f'.titem.cur .below input[data-fid="{fid}"]', str(v))
            sp.click(".titem.cur .b-check")
        else:
            fr(sp).locator(".check-btn").first.click()
        sp.wait_for_timeout(300)
        a = ans_of(sp, tasks[3]["id"])
        check("C7 ЕГЭ база №8: поле тренажёра (data-fid) — верно", n_in >= 1 and a and a["status"] == "ok", f"{n_in} {a}")
        sp.click(".titem.cur .b-next")
        wait_live(sp)
        for fid, v in correct_input(tasks[4]["task"]).items():
            fr(sp).locator(f'input[data-fid="{fid}"]').fill(str(v))
        fr(sp).locator(".check-btn").first.click(); sp.wait_for_timeout(300)
        check("C8 «Проценты» — верно", (ans_of(sp, tasks[4]["id"]) or {}).get("status") == "ok", str(ans_of(sp, tasks[4]["id"])))
        sp.click(".titem.cur .b-next")
        sp.wait_for_timeout(1500)
        check("C9 столбик — картинка с живым полем, кадра нет",
              sp.locator(".titem.cur .tc-wrap img").count() == 1 and sp.locator(".titem.cur .tc-in").count() == 1
              and sp.locator(".titem.cur .live-box").count() == 0)
        sp.wait_for_function("() => window.__work.queue.length === 0", timeout=10000)
        rows = db()["work_answers"]
        check("C10 ответы живых заданий в базе", sum(1 for r in rows if r["status"] == "ok") >= 5, str([(r['task_id'][-4:], r['status']) for r in rows]))

        # ═══ D. списком ═══
        print("\n— D. списком")
        sp.click('#wView button[data-v="list"]')
        sp.wait_for_selector(".titem .live-box:not(.loading) iframe", timeout=25000)
        # «Списком» прокручивает к текущему (последнему) заданию — вернёмся к началу
        sp.evaluate("() => window.scrollTo(0, 0)")
        sp.wait_for_timeout(3500)
        n_live = sp.evaluate("() => window.__work.views.filter(v => v.live && (v.live.state === 'ready' || v.live.state === 'loading')).length")
        first = sp.evaluate("() => !!(window.__work.views[0].live && window.__work.views[0].live.state === 'ready')")
        check("D1 живых кадров не больше 4, у первого задания (наверху) — кадр", 1 <= n_live <= 4 and first, f"{n_live} {first}")
        check("D2 страница не шире экрана", overflow_x(sp) <= 0, str(overflow_x(sp)))
        sctx.close()

        # ═══ E. запасной путь ═══
        print("\n— E. запасной путь")
        d = db()
        bl = d["work_variants"][0]["blocks"]
        bl[0]["task"]["fields"][0]["value"] = "424242"   # в работе ответ не тот, что у задания в тренажёре
        del bl[1]["live"]                                 # задание, добавленное до правки
        st1.STATE["db"] = json.dumps(d)
        sctx2, sp2 = start_student(browser, link, errors, "work2")
        sp2.wait_for_timeout(6000)
        check("E1 ответ разошёлся с тренажёром — картинка с полем, кадра нет",
              sp2.locator(".titem.cur .tc-wrap img").count() == 1 and sp2.locator(".titem.cur .live-box").count() == 0
              and sp2.evaluate("() => window.__work.views[0].live.state") == "failed")
        sp2.click(".num[data-i='1']"); sp2.wait_for_timeout(2500)
        check("E2 задание без пометки live — картинка", sp2.locator(".titem.cur .tc-wrap img").count() == 1
              and sp2.locator(".titem.cur .live-box").count() == 0 and sp2.evaluate("() => window.__work.views[0].live") is None)
        sp2.click(".num[data-i='2']")
        wait_live(sp2)
        check("E3 остальные задания — живые", sp2.locator(LIVE_FR).count() == 1)
        sctx2.close()

        # ═══ F. ошибки ═══
        print("\n— F. ошибки JavaScript")
        check("F1 нет ошибок JavaScript", not errors, "; ".join(errors[:5]))
        browser.close()

    print("\n" + ("ВСЁ ПРОШЛО" if not FAILS else f"НЕ ПРОШЛО: {len(FAILS)} — " + ", ".join(FAILS)))
    sys.exit(1 if FAILS else 0)


if __name__ == "__main__":
    run()
