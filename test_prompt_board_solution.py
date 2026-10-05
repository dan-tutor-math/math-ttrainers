"""
Доска: «Показать решение и ответ» у заданий «Тренировки» и «Добавить теорию
на доску» у ОГЭ №1–5.

Проверяем:
  1. ОГЭ №8, «Тренировка»: у задания на доске есть разбор (obj.sol) и ряд с
     кнопкой внизу карточки; поверх ряда — живая кнопка. Тренажёрная кнопка
     «Показать решение» на снимок не попадает (карточка ниже, чем была бы с
     ней, — сверяем по высоте с «Экзаменом» не получится, поэтому смотрим,
     что в клоне она спрятана: hideDeadSolutionButtons).
  2. Клик — разбор раскрывается под карточкой (картинка загружена, ширина как
     у карточки), подпись «Скрыть решение и ответ», в объекте open = true;
     второй клик прячет; отмена возвращает раскрытый.
  3. В самом тренажёре ничего не нажималось: разбор там по-прежнему скрыт
     (в совместной сессии ученик иначе увидел бы ответ).
  4. «Экзамен» — разбора и кнопки нет.
  5. ОГЭ №7 (варианты): в разборе есть строка «Ответ: N) …». У всех ОГЭ с
     «Тренировкой» (№1–5, 6, 9–15–18, 19, «Степени») — поле и разбор; где у
     тренажёра своя solutionHTML(), разбор — ровно её текст.
  6. ЕГЭ профиль: основное задание и карточка «+» — у обеих свой разбор;
     ОГЭ ч. 2 №24 (доказательство) — поля ответа нет, а разбор есть.
  7. «Проценты», логарифмы (метки свойств с color-mix — html2canvas их не
     понимал), тригонометрия — разбор есть (по умолчанию там «Тренировка»).
  8. «Ещё такое же» к заданию с разбором — у нового тоже разбор.
  9. Только просмотр — кнопка не нажимается.
 10. ОГЭ №1–5: рядом с «Показать теорию» — «Добавить теорию на доску»;
     «Добавить на доску» кладёт ОДНО задание без теории, кнопка теории —
     теорию; свёрнутая теория в кадре остаётся свёрнутой. У набора без
     теории кнопки не видно.

Запуск: python3 test_prompt_board_solution.py (сервер поднимается сам).
Общий раскрытый разбор у ученика отсюда не проверить — websocket до
Supabase из песочницы закрыт; это перепроверяется на сайте руками.
"""
import json
import sys

from playwright.sync_api import sync_playwright

import test_prompt66_board_live_tasks as T

T.PORT = 8945
T.BASE = f"http://127.0.0.1:{T.PORT}"
from test_prompt66_board_live_tasks import local_server, open_board, FRAME  # noqa: E402


def open_trainer(page, tid, href, prep_js=None):
    page.evaluate("() => document.getElementById('bdTrainersPanel').classList.add('open')")
    page.evaluate(f"() => openTrainerInPanel({json.dumps(tid)}, {json.dumps(href)}, 'x')")
    page.wait_for_function(f"""() => {{ try {{ const f = {FRAME};
        return f.contentDocument.readyState === 'complete' && typeof f.contentWindow.tsGetState === 'function'
          && f.contentWindow.location.href.indexOf({json.dumps(href.split('?')[0])}) >= 0; }}
        catch (e) {{ return false; }} }}""", timeout=20000)
    page.wait_for_timeout(600)
    if prep_js:
        page.evaluate(f"() => {FRAME}.contentWindow.eval({json.dumps(prep_js)})")
        page.wait_for_timeout(700)


def add(page):
    n0 = page.evaluate("() => getCurrentBoard().objects.length")
    page.evaluate("() => document.getElementById('bdTrainersAddBtn').click()")
    page.wait_for_function(f"() => getCurrentBoard().objects.length > {n0} && !document.getElementById('bdTrainersAddBtn').disabled", timeout=40000)
    page.wait_for_timeout(300)
    return page.evaluate(f"""() => getCurrentBoard().objects.slice({n0}).map(o => ({{
        id: o.id, task: o.task ? o.task.kind : null, hot: !!(o.task && o.task.hot),
        sol: o.sol ? {{ hot: o.sol.hot, css: o.sol.css, open: o.sol.open, png: o.sol.src.indexOf('data:image/png') === 0 }} : null,
        h: o.h, w: o.w, css: o.css }}))""")


def close_panel(page):
    page.evaluate("() => { document.getElementById('bdTrainersPanel').classList.remove('open'); boardsRedraw(); }")
    page.wait_for_timeout(300)


def focus_on(page, obj_id):
    page.evaluate(f"""() => {{ const o = getCurrentBoard().objects.find(x => x.id === {json.dumps(obj_id)});
        setZoom(1, o.points[0].x + o.w / 2, o.points[0].y + o.h / 2, cssW / 2, cssH / 2); }}""")
    page.wait_for_timeout(250)
    # под нагрузкой панель тренажёров закрывается с задержкой и сдвигает
    # холст — ждём, пока живой слой встанет на место после перерисовки
    page.evaluate("() => boardsRedraw()")
    page.wait_for_timeout(300)


SOL_HTML_JS = """(tid) => { const w = {FRAME}.contentWindow;
    const el = collectTrainerCaptureNodes(w.document, tid).map(n => n.el).find(e => e.id !== 'theoryContent');
    return trainerSolutionHTML(w, tid, el); }""".replace("{FRAME}", FRAME)


def run():
    failures = []

    def check(name, cond, extra=""):
        print(f"[{'OK' if cond else 'FAIL'}] {name}" + (f"  ({extra})" if extra and not cond else ""))
        if not cond:
            failures.append(name)

    with local_server(), sync_playwright() as p:
        browser = p.chromium.launch()
        ctx = browser.new_context()
        page, errors = open_board(ctx)

        # ── 1–3. ОГЭ №8, «Тренировка» ───────────────────────────────────
        open_trainer(page, "oge8", "oge8.html",
                     "document.querySelectorAll('.mode-card:not(.soon)')[3].click(); document.getElementById('tabPractice').click()")
        btn_in_frame = page.evaluate(f"() => {{ const b = {FRAME}.contentDocument.getElementById('showSolutionBtn'); return b && b.getClientRects().length > 0; }}")
        check("1. в тренажёре «Тренировка» — кнопка разбора видна (иначе тест ничего не проверяет)", btn_in_frame)
        o8 = add(page)[0]
        check("1. у задания есть поле ответа и разбор", o8["hot"] and o8["sol"] is not None and o8["sol"]["png"])
        s = o8["sol"] or {}
        check("1. ряд кнопки — внизу карточки, по левому краю содержимого",
              s.get("hot") and s["hot"]["y"] > 0.6 and s["hot"]["y"] + s["hot"]["h"] < 1 and 0 < s["hot"]["x"] < 0.15, str(s.get("hot")))
        check("1. разбор шириной с карточку", s.get("css") and abs(s["css"]["w"] - o8["css"]["w"]) < 2, f"{s.get('css')} vs {o8['css']}")
        dead = page.evaluate(f"""() => {{ const d = {FRAME}.contentDocument; const c = d.getElementById('questionPanel').cloneNode(true);
            d.body.appendChild(c); hideDeadSolutionButtons(c);
            const b = c.querySelector('#showSolutionBtn'); const r = getComputedStyle(b).display; c.remove(); return r; }}""")
        check("1. тренажёрная кнопка разбора в снимок не попадает", dead == "none", dead)
        close_panel(page)
        focus_on(page, o8["id"])
        sel = f'.bd-task[data-id="{o8["id"]}"]'
        geo = page.evaluate(f"""() => {{ const o = getCurrentBoard().objects.find(x => x.id === '{o8["id"]}');
            const b = document.querySelector('{sel} .bd-task-solbtn'); if (!b) return null;
            const cv = document.getElementById('boardCv').getBoundingClientRect(); const p0 = window.__w2s(o.points[0]);
            const r = b.getBoundingClientRect(), f = o.sol.hot;
            return {{ dx: Math.abs((r.left - cv.left) - (p0.x + f.x * o.w)), dy: Math.abs((r.top - cv.top) - (p0.y + f.y * o.h)), dw: Math.abs(r.width - f.w * o.w) }}; }}""")
        check("1. живая кнопка лежит ровно на нарисованном ряду", geo and geo["dx"] < 2 and geo["dy"] < 2 and geo["dw"] < 2, str(geo))
        panel_hidden = page.evaluate(f"() => getComputedStyle(document.querySelector('{sel} .bd-task-sol')).display")
        check("2. до клика разбор скрыт", panel_hidden == "none")
        page.click(f"{sel} .bd-task-solbtn")
        page.wait_for_timeout(400)
        st = page.evaluate(f"""() => {{ const o = getCurrentBoard().objects.find(x => x.id === '{o8["id"]}');
            const p = document.querySelector('{sel} .bd-task-sol'), img = p.querySelector('img'), b = document.querySelector('{sel} .bd-task-solbtn');
            const root = document.querySelector('{sel}').getBoundingClientRect(), pr = p.getBoundingClientRect();
            return {{ open: o.sol.open, shown: getComputedStyle(p).display !== 'none', loaded: img.complete && img.naturalWidth > 0,
                     text: b.textContent, below: pr.top >= root.bottom - 1, wk: pr.width / root.width }}; }}""")
        check("2. клик раскрывает разбор под карточкой", st["open"] and st["shown"] and st["loaded"] and st["below"], str(st))
        check("2. подпись — «Скрыть решение и ответ»", st["text"] == "Скрыть решение и ответ", st["text"])
        check("2. разбор в масштабе задания (ширина как у карточки)", 0.95 < st["wk"] < 1.05, str(st["wk"]))
        frame_sol = page.evaluate(f"() => {{ const d = {FRAME}.contentDocument; return [d.getElementById('mainPanel').style.display, d.getElementById('showSolutionBtn').textContent]; }}")
        check("3. в самом тренажёре разбор не раскрывался", frame_sol[0] == "none" and frame_sol[1].startswith("Показать"), str(frame_sol))
        check("3. невидимый узел разбора из кадра убран", page.evaluate(f"() => {FRAME}.contentDocument.querySelectorAll('body > [aria-hidden=\"true\"] .panel').length") == 0)
        page.click(f"{sel} .bd-task-solbtn")
        page.wait_for_timeout(300)
        st2 = page.evaluate(f"() => [getCurrentBoard().objects.find(x => x.id === '{o8['id']}').sol.open, getComputedStyle(document.querySelector('{sel} .bd-task-sol')).display]")
        check("2. второй клик прячет", st2[0] is False and st2[1] == "none", str(st2))
        page.evaluate("() => doUndo()")
        page.wait_for_timeout(300)
        check("2. отмена возвращает раскрытый разбор", page.evaluate(f"() => getCurrentBoard().objects.find(x => x.id === '{o8['id']}').sol.open") is True)

        # ── 4. «Экзамен» — без разбора ──────────────────────────────────
        open_trainer(page, "oge8", "oge8.html",
                     "document.querySelectorAll('.mode-card:not(.soon)')[3].click(); document.getElementById('tabExam').click()")
        oe = add(page)[0]
        check("4. «Экзамен»: поле есть, разбора нет", oe["hot"] and oe["sol"] is None)

        # ── 5. ОГЭ №7: ответ в разборе ──────────────────────────────────
        open_trainer(page, "oge7", "oge7.html",
                     "document.querySelectorAll('.mode-card:not(.soon)')[3].click(); document.getElementById('tabPractice').click()")
        sh7 = page.evaluate(SOL_HTML_JS, "oge7") or {}
        right = page.evaluate(f"() => {{ const t = {FRAME}.contentWindow.tsGetState().curTask; return (t.correctIndex + 1) + ') '; }}")
        check("5. ОГЭ №7: в разборе строка «Ответ: N) …»", "<b>Ответ:</b> " + right in (sh7.get("html") or ""), (sh7.get("html") or "")[-120:])
        o7 = add(page)[0]
        check("5. ОГЭ №7: варианты живые, разбор есть", o7["task"] == "choice" and o7["hot"] and o7["sol"])

        # ── 5б. все ОГЭ с «Тренировкой» ─────────────────────────────────
        for tid in ("oge1_5", "oge6", "oge9", "oge10", "oge11", "oge12", "oge13", "oge14", "oge15_18", "oge19", "powers"):
            open_trainer(page, tid, tid + ".html",
                         "(m => m[Math.min(2, m.length - 1)].click())(document.querySelectorAll('.mode-card:not(.soon)')); document.getElementById('tabPractice').click()")
            o = add(page)[0]
            own = page.evaluate(f"() => typeof {FRAME}.contentWindow.solutionHTML === 'function'")
            sh = page.evaluate(SOL_HTML_JS, tid) or {}
            same = (not own) or sh.get("html") == page.evaluate(f"() => {FRAME}.contentWindow.solutionHTML()")
            check(f"5б. {tid} «Тренировка»: поле и разбор (как по кнопке тренажёра)", o["hot"] and o["sol"] is not None and same,
                  f"hot={o['hot']} sol={bool(o['sol'])} same={same}")

        # ── 6. ЕГЭ: основное задание и карточка «+», №24 ─────────────────
        open_trainer(page, "ege3", "ege_prof.html?n=3",
                     "openTask(S.n, S.pid); S.mode = 'practice'; render(); appendCards(1);")
        objs = add(page)
        check("6. ЕГЭ «Тренировка»: два задания — оба с полем и разбором",
              len(objs) == 2 and all(o["hot"] and o["sol"] for o in objs), json.dumps([(o["hot"], bool(o["sol"])) for o in objs]))
        open_trainer(page, "ege3", "ege_prof.html?n=3", "openTask(S.n, S.pid); S.mode = 'exam'; render();")
        check("6. ЕГЭ «Экзамен»: без разбора", add(page)[0]["sol"] is None)
        open_trainer(page, "oge24", "oge_part2.html?n=24", "openTask(S.n, S.pid); S.mode = 'practice'; render();")
        o24 = add(page)[0]
        check("6. №24 (доказательство): поля нет, разбор есть", o24["task"] is None and o24["sol"] is not None)
        close_panel(page)
        focus_on(page, o24["id"])
        check("6. №24: живая кнопка разбора есть и без поля ответа",
              page.evaluate(f"() => !!document.querySelector('.bd-task[data-id=\"{o24['id']}\"] .bd-task-solbtn')"))

        # ── 7. «Проценты», логарифмы, тригонометрия ─────────────────────
        for tid in ("percent", "logarithms", "trig_equations"):
            open_trainer(page, tid, tid + ".html", "__trainerState.newTask()")
            o = add(page)[0]
            check(f"7. {tid}: поле и разбор", o["hot"] and o["sol"] is not None and o["sol"]["png"])

        # ── 8. «ещё такое же» ───────────────────────────────────────────
        close_panel(page)
        n1 = page.evaluate("() => getCurrentBoard().objects.length")
        page.evaluate(f"() => makeSimilarTask({json.dumps(o8['id'])}, 'down')")
        page.wait_for_function(f"() => getCurrentBoard().objects.length > {n1}", timeout=40000)
        page.wait_for_timeout(300)
        sim = page.evaluate("() => { const o = getCurrentBoard().objects.slice(-1)[0]; return { hot: !!(o.task && o.task.hot), sol: !!o.sol, open: o.sol && o.sol.open }; }")
        check("8. «ещё такое же» к заданию с разбором — тоже с разбором (закрытым)", sim["hot"] and sim["sol"] and sim["open"] is False, str(sim))

        # ── 9. только просмотр ──────────────────────────────────────────
        focus_on(page, o8["id"])
        page.evaluate("() => { boardAccess = 'view'; document.documentElement.setAttribute('data-access', 'view'); }")
        before = page.evaluate(f"() => getCurrentBoard().objects.find(x => x.id === '{o8['id']}').sol.open")
        page.evaluate(f"() => taskToggleSolution({json.dumps(o8['id'])})")
        pe = page.evaluate(f"() => getComputedStyle(document.querySelector('.bd-task[data-id=\"{o8['id']}\"] .bd-task-solbtn')).pointerEvents")
        after = page.evaluate(f"() => getCurrentBoard().objects.find(x => x.id === '{o8['id']}').sol.open")
        check("9. только просмотр — кнопка не нажимается", before == after and pe == "none", f"{before}->{after}, {pe}")
        page.evaluate("() => { boardAccess = 'full'; document.documentElement.setAttribute('data-access', 'full'); }")

        # ── 10. ОГЭ №1–5: теория своей кнопкой ──────────────────────────
        open_trainer(page, "oge1_5", "oge1_5.html")
        sets = page.evaluate(f"() => [...{FRAME}.contentDocument.querySelectorAll('.mode-card:not(.soon)')].map(c => c.textContent.trim().slice(0, 30))")
        tire = next(i for i, t in enumerate(sets) if "Шина 1" in t)
        page.evaluate(f"() => {FRAME}.contentWindow.eval(\"document.querySelectorAll('.mode-card:not(.soon)')[{tire}].click()\")")
        page.wait_for_timeout(700)
        tb = page.evaluate(f"""() => {{ const d = {FRAME}.contentDocument, b = d.getElementById('bdTheoryAddBtn'), t = d.getElementById('theoryToggleBtn');
            return b ? {{ vis: b.getClientRects().length > 0, text: b.textContent, next: t.nextElementSibling === b }} : null; }}""")
        check("10. рядом с «Показать теорию» — «Добавить теорию на доску»", tb and tb["vis"] and tb["next"] and "Добавить теорию на доску" in tb["text"], str(tb))
        added = add(page)
        check("10. «Добавить на доску» кладёт одно задание, без теории", len(added) == 1 and added[0]["hot"], str(len(added)))
        n2 = page.evaluate("() => getCurrentBoard().objects.length")
        page.evaluate(f"() => {FRAME}.contentDocument.getElementById('bdTheoryAddBtn').click()")
        page.wait_for_function(f"() => getCurrentBoard().objects.length > {n2}", timeout=30000)
        page.wait_for_timeout(300)
        th = page.evaluate("() => { const o = getCurrentBoard().objects.slice(-1)[0]; return { task: !!o.task, gen: !!o.gen, locked: o.locked, h: o.css && o.css.h }; }")
        check("10. кнопка теории кладёт теорию (без поля, закреплённой)", not th["task"] and not th["gen"] and th["locked"] and th["h"] > 200, str(th))
        check("10. теория в кадре осталась свёрнутой", page.evaluate(f"() => {FRAME}.contentDocument.getElementById('theoryContent').style.display") == "none")
        page.evaluate(f"() => {FRAME}.contentWindow.eval(\"document.getElementById('backBtn').click()\")")
        page.wait_for_timeout(400)
        nott = next((i for i, t in enumerate(sets) if "тариф" in t.lower()), None)
        if nott is not None:
            page.evaluate(f"() => {FRAME}.contentWindow.eval(\"document.querySelectorAll('.mode-card:not(.soon)')[{nott}].click()\")")
            page.wait_for_timeout(600)
            has_th = page.evaluate(f"() => !!{FRAME}.contentWindow.eval('curTasksetTheory')")
            vis = page.evaluate(f"() => {FRAME}.contentDocument.getElementById('bdTheoryAddBtn').getClientRects().length > 0")
            check("10. кнопка теории видна ровно тогда, когда у набора есть теория", vis == has_th, f"{vis} {has_th}")

        check("нет ошибок JavaScript", not errors, str(errors[:3]))
        browser.close()

    print()
    if failures:
        print(f"ПРОВАЛЕНО: {len(failures)}")
        sys.exit(1)
    print("Все проверки пройдены")


if __name__ == "__main__":
    run()
