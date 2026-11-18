"""Группы вкладок учителя и независимые журналы. Запуск: python test_prompt_session_tab_groups.py."""
import json
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from threading import Thread

from playwright.sync_api import expect, sync_playwright

from test_prompt_b1_student_memory import PETYA, STATE, VANYA, fresh_db, new_context
from test_prompt_cabinet_links import FIXED_NOW_JS, L_NOON, open_lesson, seed


class QuietHandler(SimpleHTTPRequestHandler):
    def log_message(self, *args):
        pass


def start(page, student=VANYA, lesson="урок-1"):
    page.evaluate("""([id, name, lessonId]) => StudentMemory.start({id, name},
        {lessonId, lessonLabel:'18 ноября, 15:00'})""", [student, "Ваня" if student == VANYA else "Петя", lesson])


def current(page):
    return page.evaluate("StudentMemory.current()")


def groups(page):
    return page.evaluate("StudentMemory.groups()")


def child(ctx, source, url):
    with ctx.expect_page() as popup:
        source.evaluate("url => { window.open(StudentMemory.handoffUrl(url), '_blank'); }", url)
    p = popup.value
    p.wait_for_function("() => !!window.StudentMemory && !new URL(location.href).searchParams.has('sm')")
    return p


def counts(page, numbers):
    page.wait_for_function("""expected => StudentMemory.groups().map(g => g.tabs).sort().join() === expected""",
                           arg=",".join(map(str, sorted(numbers))))


def check_groups(ctx, base):
    url = base + "/neg_pos.html"
    a = ctx.new_page()
    a.goto(url)
    start(a)
    b = child(ctx, a, url)
    c = child(ctx, a, url)
    counts(a, [3])
    assert all(current(p)["id"] == VANYA for p in (a, b, c))
    gid = groups(a)[0]["gid"]
    raw = a.evaluate("JSON.parse(localStorage.getItem('studentMem:groups'))")
    assert raw[gid]["lessonId"] == "урок-1" and len(raw[gid]["tabs"]) == 3
    d = ctx.new_page()
    d.goto(url)
    assert current(d) is None
    start(d, PETYA, "урок-2")
    counts(d, [1, 3])
    for p, key in ((a, "a"), (d, "b")):
        assert p.evaluate("k => StudentMemory.record('gen:tabs:' + k, 'ok').ok", key)
    rows = a.evaluate("""StudentMemory.queue().filter(r => r.task_key.startsWith('gen:tabs:'))
                         .map(r => [r.student_id, r.lesson_id])""")
    # Очередь может уже уйти на сервер из вкладки кабинета.
    saved = json.loads(STATE["db"])["student_task_log"]
    rows += [[r["student_id"], r["lesson_id"]] for r in saved if r["task_key"].startswith("gen:tabs:")]
    assert [VANYA, "урок-1"] in rows and [PETYA, "урок-2"] in rows
    a.evaluate("() => { window.changed = []; StudentMemory.onChange(s => changed.push(s?.paused)); }")
    b.evaluate("StudentMemory.pause(true)")
    a.wait_for_function("changed.includes(true)")
    assert all(current(p)["paused"] for p in (a, b, c)) and not current(d)["paused"]
    start(c, lesson="новое занятие")
    assert current(a)["lessonId"] == current(b)["lessonId"] == "новое занятие"
    b.reload()
    counts(a, [1, 3])
    assert current(b)["id"] == VANYA
    print("✓ Два ученика, запись по своим занятиям, общая пауза, смена занятия и перезагрузка.")

    # Дубликат браузера копирует sessionStorage и открывается без opener.
    state = a.evaluate("Object.fromEntries(Object.entries(sessionStorage))")
    dup = ctx.new_page()
    dup.add_init_script("if(!sessionStorage.length || !sessionStorage.getItem('studentMem:gid')) Object.entries(" +
                        json.dumps(state) + ").forEach(([k,v])=>sessionStorage.setItem(k,v))")
    dup.goto(url)
    assert current(dup)["id"] == VANYA
    assert dup.evaluate("sessionStorage.getItem('studentMem:tabId')") != a.evaluate("sessionStorage.getItem('studentMem:tabId')")
    counts(a, [1, 4])
    dup.close()
    counts(a, [1, 3])
    with ctx.expect_page() as popup:
        a.evaluate("url => { window.open(url + '?tsnew=ABCD2222', '_blank'); }", url)
    new = popup.value
    new.wait_for_function("() => !!window.StudentMemory")
    assert current(new) is None and current(a)["id"] == VANYA
    with ctx.expect_page() as popup:
        a.evaluate("url => { window.open(url, '_blank'); }", url)
    plain = popup.value
    plain.wait_for_function("() => !!window.StudentMemory")
    assert current(plain) is None
    new.close()
    plain.close()
    print("✓ Дубликат получил свой номер. Обычная новая вкладка и «＋ Новая сессия» свободны.")

    # У зависшего процесса нет pagehide. Старим только его собственную отметку.
    stale = child(ctx, c, url)
    stale_id = stale.evaluate("sessionStorage.getItem('studentMem:tabId')")
    a.evaluate("""([g,t]) => localStorage.setItem('studentMem:member:'+g+':'+t, Date.now()-46000)""", [gid, stale_id])
    counts(a, [1, 3])
    stale.close()
    start(b, PETYA, "отдельно")
    counts(a, [1, 1, 2])
    assert current(b)["id"] == PETYA and current(c)["id"] == VANYA
    b.evaluate("StudentMemory.end()")
    e = child(ctx, a, url)
    e.evaluate("StudentMemory.end({scope:'here'})")
    assert current(e) is None and current(a) and current(c)
    old_url = a.evaluate("StudentMemory.handoffUrl('neg_pos.html?extra=1#lesson')")
    a.evaluate("StudentMemory.end({scope:'all'})")
    replay = ctx.new_page()
    replay.goto(old_url)
    assert current(replay) is None and replay.url.endswith("?extra=1#lesson")
    replay.close()
    assert all(current(p) is None for p in (a, c, e)) and current(d)["id"] == PETYA
    counts(d, [1])
    d.evaluate("StudentMemory.end()")
    for p in (a, b, c, d, e):
        p.close()
    print("✓ Таймаут участника, смена ученика, выход здесь и завершение группы работают независимо.")

    old = ctx.new_page()
    legacy = {"student": {"id": VANYA, "name": "Ваня"}, "paused": True, "lessonId": "старый урок", "startedAt": 100}
    old.add_init_script("if (!sessionStorage.getItem('migrated')) {sessionStorage.setItem('migrated','1');" +
                        "sessionStorage.setItem('studentMem:tab'," + json.dumps(json.dumps(legacy)) + ");}")
    old.goto(url)
    assert current(old)["lessonId"] == "старый урок" and current(old)["paused"]
    counts(old, [1])
    assert old.evaluate("sessionStorage.getItem('studentMem:tab')") is None
    blank = ctx.new_page()
    blank.goto(url)
    old.close()
    counts(blank, [])
    blank.close()
    print("✓ Старый урок восстановлен, последняя закрытая вкладка исчезла из списка.")


def check_reload_during_move(ctx, base):
    page = ctx.new_page()
    page.goto(base + "/neg_pos.html")
    start(page)
    # При перезагрузке исходного кабинета событие storage может быть пропущено.
    page.evaluate("""() => window.addEventListener('storage', e => {
        if (e.key?.startsWith('studentMem:received:')) e.stopImmediatePropagation();
    }, true)""")
    url = page.evaluate("StudentMemory.handoffUrl('neg_pos.html', {move:true})")
    dest = ctx.new_page()
    dest.goto(url)
    assert current(dest)["id"] == VANYA
    page.reload()
    assert current(page) is None and current(dest)["id"] == VANYA
    counts(dest, [1])
    dest.evaluate("StudentMemory.end()")
    dest.close()
    page.close()
    print("✓ Перезагрузка расписания во время переноса не оставляет второй активной сессии.")


def check_dialog(ctx, base):
    page = ctx.new_page()
    page.set_viewport_size({"width": 1280, "height": 800})
    page.goto(f"{base}/cabinet.html#/students/{VANYA}")
    page.click("#cSession")
    page.click("#cSession")
    assert current(page) is None
    expect(page.locator("#smEndDialog")).to_have_count(0)

    page.goto(f"{base}/cabinet.html#/schedule/2026-11-16")
    expect(page.locator("#scSteps")).to_contain_text("Облако обновлено")
    open_lesson(page, L_NOON)
    page.click("#spSession")
    board = child(ctx, page, base + "/boards.html")
    # Настоящая кнопка панели тренажёров: доска сама строит адрес и открывает окно.
    with ctx.expect_page() as popup:
        board.locator("#linkOpenTab").dispatch_event("click")
    panel = popup.value
    panel.wait_for_function("() => !!window.StudentMemory && !new URL(location.href).searchParams.has('sm')")
    assert current(panel)["lessonId"] == L_NOON
    counts(page, [3])
    expect(page.locator("#spHint")).to_contain_text("ещё в 2 вкладках")
    other = ctx.new_page()
    other.goto(f"{base}/cabinet.html#/students/{PETYA}")
    other.click("#cSession")
    other.evaluate("StudentMemory.pause(true)")
    page.click("#spSession")
    dialog = page.locator("#smEndDialog")
    expect(dialog).to_be_visible()
    expect(dialog.get_by_role("heading", name="Закончить сессию с Ваня?")).to_be_visible()
    expect(dialog.get_by_role("button", name="Закончить везде (3 вкладки)")).to_be_visible()
    expect(dialog.locator("li")).to_have_count(2)
    expect(dialog.locator("li").first).to_contain_text("эта вкладка")
    expect(dialog.locator("li").first).to_contain_text("18 ноября, 15:00")
    expect(dialog.locator("li").last).to_contain_text("пауза")
    page.keyboard.press("Escape")
    expect(dialog).to_have_count(0)
    counts(page, [1, 3])
    print("✓ Все идущие сессии, занятие, число вкладок и пауза в окне расписания. Esc оставляет оба урока.")

    page.goto(f"{base}/cabinet.html#/students/{VANYA}")
    expect(page.locator("#cSessionHint")).to_contain_text("ещё в 2 вкладках")
    page.set_viewport_size({"width": 375, "height": 667})
    page.click("#cSession")
    expect(dialog).to_be_visible()
    page.wait_for_function("() => getComputedStyle(document.querySelector('#smEndDialog')).maxWidth === 'none'")
    rect = dialog.bounding_box()
    assert rect["x"] >= 15.5 and rect["x"] + rect["width"] <= 359.5
    light = dialog.evaluate("el => getComputedStyle(el).backgroundColor")
    page.evaluate("document.documentElement.dataset.theme = 'dark'")
    assert light != dialog.evaluate("el => getComputedStyle(el).backgroundColor")
    page.mouse.click(2, 2)
    expect(dialog).to_have_count(0)
    counts(page, [1, 3])
    page.click("#cSession")
    dialog.locator("[data-cancel]").click()
    expect(dialog).to_have_count(0)
    page.click("#cSession")
    dialog.get_by_role("button", name="Закончить сессию с Петя").click()
    assert current(other) is None
    expect(dialog.locator("li")).to_have_count(1)
    expect(dialog.locator("li")).to_contain_text("Ваня")
    dialog.get_by_role("button", name="Закончить здесь").click()
    assert current(page) is None and current(panel)["id"] == VANYA and current(board)["id"] == VANYA
    print("✓ Карточка ученика, ширина 375 px и тёмная тема. Чужую сессию и текущую вкладку можно закончить отдельно.")

    board.locator('#smBar [data-sm="end"]').click()
    bd_dialog = board.locator("#smEndDialog")
    bd_dialog.get_by_role("button", name="Закончить везде (2 вкладки)").click()
    assert current(board) is None and current(panel) is None
    page.evaluate("TeacherSettings.set({sessionBind:'browser'})")
    page.click("#cSession")
    page.click("#cSession")
    assert current(page) is None
    expect(dialog).to_have_count(0)
    print("✓ Плашка доски завершает всю группу; в режиме браузера завершение сразу.")


def main():
    STATE.update(db=json.dumps(fresh_db()), offline=False)
    handler = partial(QuietHandler, directory=str(Path(__file__).parent))
    with ThreadingHTTPServer(("127.0.0.1", 0), handler) as srv, sync_playwright() as pw:
        Thread(target=srv.serve_forever, daemon=True).start()
        try:
            base = f"http://127.0.0.1:{srv.server_port}"
            browser = pw.chromium.launch()
            ctx = new_context(browser, bind="tab")
            ctx.set_default_timeout(8000)
            check_groups(ctx, base)
            check_reload_during_move(ctx, base)
            ctx.close()
            STATE["db"] = json.dumps(seed())
            ctx = new_context(browser, bind="tab")
            ctx.add_init_script(FIXED_NOW_JS + "\nlocalStorage.setItem('cabinet:schedule:view','list')")
            ctx.set_default_timeout(8000)
            check_dialog(ctx, base)
            browser.close()
        finally:
            srv.shutdown()
    print("Все проверки прошли — готово")


if __name__ == "__main__":
    main()
