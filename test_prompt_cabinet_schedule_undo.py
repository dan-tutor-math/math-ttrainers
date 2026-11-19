"""Отмена правок расписания в браузере на заглушке Supabase."""

import json
import sys

from playwright.sync_api import expect, sync_playwright

from test_prompt_cabinet_payments import B1, FIXED_NOW_JS, seed, wait_db
from test_prompt_b1_student_memory import BASE, STATE, db, local_server


def row_by_id(data, table, row_id):
    return next(row for row in data[table] if row["id"] == row_id)


def main():
    STATE["db"] = json.dumps(seed())
    errors = []
    with local_server(), sync_playwright() as pw:
        browser = pw.chromium.launch()
        ctx = B1.new_context(browser, bar_open=False)
        ctx.add_init_script(FIXED_NOW_JS)
        ctx.add_init_script("""
          localStorage.setItem('cabinet:schedule:view', 'grid');
          localStorage.setItem('cabinet:schedule:look', JSON.stringify({hh:126, cw:156, span:'week'}));
        """)
        p = ctx.new_page()
        p.on("pageerror", lambda error: errors.append(str(error)))
        p.set_viewport_size({"width": 1280, "height": 900})
        p.goto(f"{BASE}/cabinet.html#/schedule/2026-11-16")
        undo = p.locator("#scUndo")
        menu = p.locator(".gm-look.on")

        def look_field(key):
            return p.evaluate("(key) => JSON.parse(localStorage.getItem('cabinet:schedule:look'))[key]", key)

        def shortcut(keys):
            p.locator("body").press(keys)

        p.wait_for_selector(".sc-col.today")
        expect(undo).to_be_disabled()
        p.click("#scLook")
        menu.get_by_text("Масштаб по умолчанию", exact=True).click()
        assert look_field("hh") is None and look_field("cw") is None
        shortcut("Meta+z")
        assert look_field("hh") == 126 and look_field("cw") == 156
        expect(undo).to_be_disabled()

        grid_lesson = p.locator('.sc-plate[data-id="L17"]')
        old_grid_color = grid_lesson.evaluate("el => getComputedStyle(el).backgroundColor")
        p.click("#scLook")
        menu.get_by_text("Яркая", exact=True).click()
        assert grid_lesson.evaluate("el => getComputedStyle(el).backgroundColor") != old_grid_color
        menu.get_by_text("Начало и конец", exact=True).click()
        p.keyboard.press("Escape")
        p.click('.sc-views button[data-v="list"]')
        row = p.locator('.rw-row[data-id="L17"]')
        expect(row.locator(".rw-time")).to_have_text("15:00–16:00")
        color = row.evaluate("el => getComputedStyle(el).backgroundColor")
        assert color != "rgba(0, 0, 0, 0)"
        shortcut("Control+z")
        expect(row.locator(".rw-time")).to_have_text("15:00")
        undo.click()
        assert look_field("pal") == "contrast"
        assert row.evaluate("el => getComputedStyle(el).backgroundColor") != color
        expect(undo).to_be_disabled()
        print("[OK] Сброс масштаба и палитра обоих режимов отменяются в порядке правок")

        row.locator(".rw-time").click()
        field = row.locator(".rw-in-time")
        field.fill("1615")
        field.press("Enter")
        p.keyboard.press("Escape")
        assert wait_db(p, lambda data: row_by_id(data, "lessons", "L17")["start_min"] == 975)
        expect(undo).to_be_enabled()

        row.locator("[data-rst]").click()
        assert wait_db(p, lambda data: all(row_by_id(data, "lesson_students", pid)["status"] == "move" for pid in ("v17", "p17")))
        expect(undo).to_be_enabled()

        row.locator('[data-why="p17"]').click()
        p.get_by_role("button", name="Своя причина").click()
        reason = p.locator("#pcCustom")
        reason.press_sequentially("Exam")
        reason.press("Meta+z" if sys.platform == "darwin" else "Control+z")
        expect(reason).not_to_have_value("Exam")
        assert row_by_id(db(), "lesson_students", "p17")["status"] == "move"
        reason.fill("Экзамен")
        p.locator("#pcCustomForm button").click()
        assert wait_db(p, lambda data: row_by_id(data, "lesson_students", "p17")["reason"] == "Экзамен")
        p.keyboard.press("Escape")
        expect(undo).to_be_enabled()
        shortcut("Control+z")
        assert wait_db(p, lambda data: row_by_id(data, "lesson_students", "p17")["reason"] is None)
        expect(undo).to_be_enabled()
        undo.click()
        assert wait_db(p, lambda data: all(row_by_id(data, "lesson_students", pid)["status"] == "done" for pid in ("v17", "p17")))
        expect(undo).to_be_enabled()
        shortcut("Meta+z")
        assert wait_db(p, lambda data: row_by_id(data, "lessons", "L17")["start_min"] == 900)
        expect(undo).to_be_disabled()
        expect(row.locator(".rw-time")).to_have_text("15:00")
        print("[OK] Отмена причины, группового статуса и времени сохраняется в базе")

        row.locator('[data-pst="p17"]').click()
        assert wait_db(p, lambda data: row_by_id(data, "lesson_students", "p17")["status"] == "move")
        expect(undo).to_be_enabled()
        p.evaluate("() => ScheduleCloud.setStatus('p17', 'skip')")
        undo.click()
        expect(undo).to_be_disabled()
        assert row_by_id(db(), "lesson_students", "p17")["status"] == "skip"
        expect(row.locator('[data-pst="p17"]')).to_have_class("rw-ic sm st-skip")
        assert not errors, errors
        print("[OK] Отмена сохраняет более свежую правку того же поля")
        browser.close()


if __name__ == "__main__":
    main()
