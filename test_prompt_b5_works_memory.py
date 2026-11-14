"""
Кабинет, задача Б5: память заданий в работах (works.html).

Заглушка Supabase и вход учителя — из test_prompt15_works_stage1.py; журнал
ученика — локальная копия StudentMemory (сеть закрыта).
Проверяет:
  A. вне сессии: строки «Журнал ученика», галочки «не решённые» и подписей нет;
  B. в сессии: строка видна, три положения переключателя, кнопка «Выдано: имя»;
     у решённого задания работы — точка с событием; «не подписывать» — точки нет;
     у текущего задания кадра в панели добавления — точка;
  C. «не брать уже решённые»: добавление из кадра при решённом задании на
     экране не кладёт его в работу; новый вариант получает не решённое;
  D. «Выдано»: событие hw по каждому заданию варианта с верными ключами,
     повтор не дублирует, ученик запомнился в settings (только id, без имени),
     после конца сессии кнопка работает по запомненному ученику;
  E. нет ошибок JavaScript.

Запуск: python3 test_prompt_b5_works_memory.py (сервер поднимается сам).
"""
import json

from test_prompt15_works_stage1 import (
    BASE, TEACHER, local_server, sync_playwright, new_context, watch_errors, open_in_frame,
)

FAILS = []
STUDENT = {"id": "aaaaaaaa-0000-4000-8000-000000000005", "name": "Ваня"}


def check(name, cond, extra=""):
    print(("[OK] " if cond else "[FAIL] ") + name + (f" — {extra}" if extra and not cond else ""))
    if not cond:
        FAILS.append(name)


def dots_in_work(page):
    return page.evaluate("document.querySelectorAll('#wkTasks [data-tc-dot]').length")


def hw_rows(page):
    return page.evaluate("StudentMemory.queue().filter(r => r.event === 'hw').map(r => ({k: r.task_key, s: r.student_id, src: r.source}))")


def run():
    errors = []
    with local_server(), sync_playwright() as p:
        browser = p.chromium.launch()
        ctx = new_context(browser, viewport={"width": 1440, "height": 950})
        pg = ctx.new_page()
        watch_errors(pg, errors, "works")
        pg.goto(f"{BASE}/works.html")
        pg.wait_for_selector("#scrAuth:not([hidden])")
        pg.fill("#auEmail", TEACHER["email"]); pg.fill("#auPass", TEACHER["password"]); pg.click("#auGo")
        pg.wait_for_selector("#scrList:not([hidden])")
        pg.click("#newWork"); pg.wait_for_selector("#scrEdit:not([hidden])")

        # ═══ A. вне сессии ═══
        print("\n— A. вне сессии")
        open_in_frame(pg, "oge6", "document.querySelector('.mode-card[data-id=\"p1\"]').click()")
        check("A1 строки «Журнал ученика» нет", pg.is_hidden("#wkMemRow"))
        check("A2 галочки в панели добавления нет", pg.is_hidden("#addSkipBox"))
        num = pg.evaluate("() => document.getElementById('trFrame').contentWindow.tsGetState().curTask.fipi")
        check("A3 в кадре задание ФИПИ", bool(num), str(num))
        key = f"fipi:oge:{num}"
        pg.click("#addBtn")
        pg.wait_for_function("() => window.__works.E.blocks.length >= 1", timeout=60000)
        pg.wait_for_function("() => !document.getElementById('addBtn').disabled", timeout=30000)
        b0 = pg.evaluate("() => window.__works.E.blocks[0].tkey")
        check("A4 у блока ключ ФИПИ (tkey)", b0 == key, f"{b0} != {key}")
        check("A5 точек нет", dots_in_work(pg) == 0)

        # ═══ B. в сессии ═══
        print("\n— B. в сессии")
        pg.evaluate("s => StudentMemory.start(s)", STUDENT)
        pg.wait_for_timeout(500)
        check("B1 строка «Журнал ученика» видна", pg.is_visible("#wkMemRow"))
        modes = pg.evaluate("Array.from(document.querySelectorAll('#wkCapToggle button')).map(b => b.dataset.mode)")
        check("B2 переключатель на три положения", modes == ["show", "off", "hide_solved"], str(modes))
        check("B3 кнопка «Выдано: Ваня»", "Выдано: Ваня" in pg.inner_text("#wkIssued"), pg.inner_text("#wkIssued"))
        check("B4 галочка в панели добавления видна", pg.is_visible("#addSkipBox"))
        check("B5 пока событий нет — точки нет", dots_in_work(pg) == 0)
        r = pg.evaluate("k => StudentMemory.record(k, 'ok')", key)
        check("B6 событие записано", r.get("ok") is True, str(r))
        pg.click('#wkCapToggle button[data-mode="off"]'); pg.click('#wkCapToggle button[data-mode="show"]')
        pg.wait_for_timeout(300)
        check("B7 у решённого задания работы — точка", dots_in_work(pg) == 1, str(dots_in_work(pg)))
        pg.click('#wkTasks [data-tc-dot]')
        pg.wait_for_timeout(200)
        pop = pg.evaluate("document.querySelector('.tc-pop') ? document.querySelector('.tc-pop').innerText : ''")
        check("B8 всплывашка с событием", "Верно" in pop, pop)
        pg.mouse.click(5, 5)
        pg.wait_for_function("() => document.querySelectorAll('#addCap [data-tc-dot]').length === 1", timeout=5000)
        check("B9 у задания в кадре (панель добавления) точка", True)
        pg.click('#wkCapToggle button[data-mode="off"]')
        pg.wait_for_timeout(300)
        check("B10 «не подписывать»: точек нет ни в работе, ни в панели",
              dots_in_work(pg) == 0 and pg.evaluate("document.querySelectorAll('#addCap [data-tc-dot]').length") == 0)
        pg.click('#wkCapToggle button[data-mode="show"]')

        # ═══ C. не брать решённые ═══
        print("\n— C. не брать решённые")
        pg.evaluate("() => { window.__works.E.variants[0].blocks.length = 0; }")
        pg.check("#addSkip")
        check("C1 галочка в конструкторе тоже стоит", pg.is_checked("#wkSkipSolved"))
        check("C2 в кадре всё ещё решённое", pg.evaluate("() => document.getElementById('trFrame').contentWindow.tsGetState().curTask.fipi") == num)
        pg.click("#addBtn")
        pg.wait_for_function("() => !document.getElementById('addBtn').disabled", timeout=90000)
        pg.wait_for_timeout(300)
        keys = pg.evaluate("() => window.__works.E.variants[0].blocks.map(b => b.tkey)")
        check("C3 решённое в работу не попало", key not in keys, str(keys))
        check("C4 вместо него добавлено другое задание", len(keys) == 1, str(keys))
        # вариант: образец с решённым заданием (ставим решённый ключ вручную), новый вариант — другое
        pg.evaluate("k => { const b = window.__works.E.variants[0].blocks[0]; b.tkey = k; }", key)
        pg.click("#varAdd")
        pg.wait_for_function("() => { const v = window.__works.E.variants[1]; return v && v.blocks.length && v.blocks.every(b => !b._gen); }", timeout=90000)
        vk = pg.evaluate("() => window.__works.E.variants[1].blocks.map(b => b.tkey)")
        check("C5 в новом варианте нет решённого", key not in vk, str(vk))
        pg.click("#wkVariants button:first-child")
        pg.wait_for_timeout(300)

        # ═══ D. «Выдано» ═══
        print("\n— D. «Выдано»")
        pg.evaluate("""() => { const E = window.__works.E; E.variants[0].blocks.length = 0; E.variants.length = 1; E.cur = 0;
            const mk = (id, k) => ({ id, type: 'task', mode: 'exam', tid: 'oge6', tkey: k });
            E.variants[0].blocks.push(mk('t1', 'fipi:oge:AAA111'), mk('t2', 'gen:oge6:p3'), { id: 't3', type: 'task', mode: 'exam', tid: 'oge6' });
        }""")
        pg.click("#wkCapToggle button[data-mode='show']")   # перерисовать
        pg.evaluate("() => document.getElementById('wkIssued').disabled = false")
        pg.click("#wkIssued")
        pg.wait_for_timeout(200)
        rows = hw_rows(pg)
        got = sorted(r["k"] for r in rows)
        check("D1 hw по заданиям с ключом", got == ["fipi:oge:AAA111", "gen:oge6:p3"], str(got))
        check("D2 ученик и источник верные", all(r["s"] == STUDENT["id"] and r["src"] == "work" for r in rows), str(rows))
        note = pg.inner_text("#wkIssuedNote")
        check("D3 сообщение: 2 из 3, один без ключа", "2 из 3" in note and "без ключа" in note, note)
        iss = pg.evaluate("() => window.__works.E.settings.issuedTo")
        check("D4 ученик запомнен в settings (id)", iss == STUDENT["id"], str(iss))
        check("D5 имени в settings нет", "Ваня" not in pg.evaluate("() => JSON.stringify(window.__works.E.settings)"))
        pg.click("#wkIssued")
        check("D6 повтор не дублирует", len(hw_rows(pg)) == 2, str(len(hw_rows(pg))))
        pg.evaluate("() => StudentMemory.end()")
        pg.wait_for_timeout(300)
        check("D7 без сессии кнопка осталась (запомненный ученик)", pg.is_visible("#wkIssued") and "Ваня" in pg.inner_text("#wkIssued"), pg.inner_text("#wkIssued"))
        check("D8 без сессии галочки и подписей нет", pg.is_hidden("#addSkipBox") and dots_in_work(pg) == 0)
        pg.evaluate("() => { const b = window.__works.E.variants[0].blocks; b.push({ id: 't4', type: 'task', mode: 'exam', tid: 'oge6', tkey: 'fipi:oge:CCC333' }); }")
        pg.click("#wkIssued")
        pg.wait_for_timeout(200)
        late = [r for r in hw_rows(pg) if r["k"] == "fipi:oge:CCC333"]
        check("D9 без сессии «Выдано» пишет запомненному ученику", len(late) == 1 and late[0]["s"] == STUDENT["id"], str(late))

        check("E нет ошибок JavaScript", not errors, str(errors[:2]))
        browser.close()


if __name__ == "__main__":
    run()
    print("\nИтого:", "всё зелёное" if not FAILS else f"упало {len(FAILS)}: {FAILS}")
    raise SystemExit(1 if FAILS else 0)
