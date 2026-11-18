"""Перенос сессии из кабинета на доску. Запуск: python test_prompt_cabinet_session_tabs.py."""
import json

from playwright.sync_api import expect, sync_playwright

from test_prompt_b1_student_memory import BASE, PETYA, STATE, VANYA, db, local_server, new_context
from test_prompt_cabinet_links import FIXED_NOW_JS, L_BOARD, L_NOON, L_YDAY, seed
from test_prompt_rus_board_check import BOOT_JS, LITE, SEED_JS


WEEK = f"{BASE}/cabinet.html#/schedule/2026-11-16"
SETTINGS = f"{BASE}/cabinet.html#/settings"
HANDOFF_KEYS = "Object.keys(localStorage).filter(k => k.startsWith('studentMem:handoff:'))"


def schedule(page, lesson):
    page.goto(WEEK)
    page.wait_for_selector(".rw-time")
    expect(page.locator("#scSteps")).to_contain_text("Облако обновлено")
    if page.locator(".sc-side").count():
        page.keyboard.press("Escape")
        expect(page.locator(".sc-side")).to_have_count(0)
    row = page.locator(f'.rw-row[data-id="{lesson}"]')
    row.hover()
    row.locator(".rw-more").click()
    page.get_by_role("menuitem", name="Открыть занятие").press("Enter")
    expect(page.locator("#spSession")).to_be_visible()


def session(page, student, lesson):
    page.wait_for_function("""([id, lesson]) => { const s = window.StudentMemory?.current();
        return s && s.id === id && s.lessonId === lesson; }""", arg=[student, lesson])
    return page.evaluate("StudentMemory.current()")


def board_ready(page, board_id):
    page.wait_for_url(f"**/boards.html**#board={board_id}")
    page.wait_for_function("() => !!window.StudentMemory && !new URL(location.href).searchParams.has('sm')")
    page.evaluate(BOOT_JS)
    page.wait_for_function("id => window.getCurrentBoard()?.id === id", arg=board_id)


def main():
    STATE.update(db=json.dumps(seed()), offline=False)
    with local_server(), sync_playwright() as pw:
        browser = pw.chromium.launch()
        ctx = new_context(browser, bind="tab", bar_open=False)
        ctx.set_default_timeout(8000)
        ctx.add_init_script(FIXED_NOW_JS + "\nlocalStorage.setItem('cabinet:schedule:view', 'list');")
        page = ctx.new_page()
        page.goto(SETTINGS)
        setting = page.get_by_label("Открывать доску в новой вкладке", exact=True)
        expect(setting).not_to_be_checked()
        ids = ["bd-lesson", "bd-vanya"]
        page.evaluate(SEED_JS, [[dict(LITE, id=i) for i in ids], {i: {"objects": [], "imageLib": []} for i in ids}])
        schedule(page, L_NOON)
        page.click("#spBoard")
        board_ready(page, "bd-vanya")
        assert len(ctx.pages) == 1
        print("✓ По умолчанию доска открывается в той же вкладке.")

        page.goto(SETTINGS)
        setting.check()
        expect(page.locator("#saveNote")).to_have_text("Сохранено")
        assert db()["teacher_settings"][0]["settings"]["boardNewTab"] is True
        page.reload()
        expect(setting).to_be_checked()
        schedule(page, L_BOARD)
        page.click("#spSession")
        original = session(page, VANYA, L_BOARD)
        page.evaluate("StudentMemory.pause(true)")
        with ctx.expect_page() as popup:
            page.click("#spBoard")
        board = popup.value
        board_ready(board, "bd-lesson")
        moved = session(board, VANYA, L_BOARD)
        assert moved["paused"] and moved["startedAt"] == original["startedAt"]
        page.wait_for_function("() => !StudentMemory.current()")
        assert page.url == WEEK and page.evaluate(HANDOFF_KEYS) == []
        board.evaluate("window.name = 'tsSess:TESTCODE'")
        board.evaluate("window.__openedBoard = true")
        page.click("#spBoard")
        assert len(ctx.pages) == 2 and board.evaluate("window.__openedBoard")
        page.reload()
        schedule(page, L_BOARD)
        page.click("#spBoard")
        session(board, VANYA, L_BOARD)
        assert len(ctx.pages) == 2
        print("✓ Настройка сохранена. Ученик, занятие и пауза перешли на доску занятия. Повторный щелчок вернул ту же вкладку.")

        page.evaluate("TeacherSettings.set({boardNewTab:false, sessionGoHome:true})")
        schedule(page, L_YDAY)
        page.click(f'[data-pick="{PETYA}"]')
        expect(page.locator("#spSessionBoard")).to_be_hidden()
        schedule(page, L_NOON)
        with ctx.expect_page() as popup:
            page.click("#spSessionBoard")
        split = popup.value
        board_ready(split, "bd-vanya")
        session(split, VANYA, L_NOON)
        page.wait_for_function("() => !StudentMemory.current()")
        assert page.url == WEEK
        print("✓ Стрелка расписания открывает доску даже при выключенной галочке и включённом переходе на главную.")
        split.close()

        page.goto(f"{BASE}/cabinet.html#/students/{PETYA}")
        expect(page.locator("#cSession")).to_be_visible()
        expect(page.locator("#cSessionBoard")).to_be_hidden()
        page.goto(f"{BASE}/cabinet.html#/students/{VANYA}")
        expect(page.locator("#cSessionBoard")).to_be_visible()
        page.evaluate("() => { window.realOpen = window.open; window.open = () => null; }")
        page.click("#cSessionBoard")
        expect(page.locator("#toast")).to_contain_text("Разрешите открытие")
        session(page, VANYA, None)
        assert page.evaluate(HANDOFF_KEYS) == []
        page.evaluate("() => { window.open = window.realOpen; }")
        with ctx.expect_page() as popup:
            page.click("#cSessionBoard")
        session(popup.value, VANYA, None)
        page.wait_for_function("() => !StudentMemory.current()")
        assert len(ctx.pages) == 3 and page.url.endswith(f"#/students/{VANYA}")
        print("✓ Стрелка карточки сохранила сессию при блокировке окна и перенесла её при повторном нажатии.")

        ctx.close()
        STATE["db"] = json.dumps(seed())
        ctx = new_context(browser, bind="browser", bar_open=False)
        ctx.add_init_script(FIXED_NOW_JS + "\nlocalStorage.setItem('cabinet:schedule:view', 'list');")
        page = ctx.new_page()
        page.goto(SETTINGS)
        page.evaluate("TeacherSettings.set({boardNewTab:true, sessionGoHome:true})")
        schedule(page, L_NOON)
        with ctx.expect_page() as popup:
            page.click("#spSessionBoard")
        shared = popup.value
        assert session(page, VANYA, L_NOON) == session(shared, VANYA, L_NOON)
        assert page.url == WEEK and page.evaluate(HANDOFF_KEYS) == []
        assert page.evaluate("StudentMemory.handoffUrl('boards.html#board=bd-vanya')") == "boards.html#board=bd-vanya"
        print("✓ В режиме «Весь браузер» обе вкладки продолжают одну сессию.")
        browser.close()
    print("Все проверки прошли — готово")


if __name__ == "__main__":
    main()
