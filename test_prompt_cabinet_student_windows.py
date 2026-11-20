"""Карточки ученика и занятия в кабинете. Все ученики и уроки тестовые."""
import json
import os
from functools import partial
from http.server import ThreadingHTTPServer
from pathlib import Path
from threading import Thread

from playwright.sync_api import expect, sync_playwright

import test_prompt_b1_student_memory as fixture
from test_prompt_cabinet_exam_grid import QuietHandler
from test_prompt_cabinet_links import lesson, person, seed, FIXED_NOW_JS


TRACK_MOTION = """() => {
  window.windowMotions = [];
  const animate = Element.prototype.animate;
  Element.prototype.animate = function(frames, options) {
    if (this.classList.contains('cab-float')) {
      windowMotions.push({ frames, options, width:this.offsetWidth, height:this.offsetHeight });
    }
    return animate.call(this, frames, options);
  };
}"""


def boot(context, base, tab):
    context.add_init_script(FIXED_NOW_JS)
    context.add_init_script("localStorage.setItem('cabinet:schedule:view', 'grid')")
    context.add_init_script(f"({TRACK_MOTION})()")
    page = context.new_page()
    page.goto(base + "/cabinet.html#/" + tab)
    return page


def shot(target, name):
    if directory := os.environ.get("MATHH_WINDOW_SHOTS"):
        path = Path(directory) / name
        path.parent.mkdir(parents=True, exist_ok=True)
        target.screenshot(path=path)


def settled(window):
    window.evaluate("(node) => Promise.all(node.getAnimations().map(animation => animation.finished.catch(() => {})))")


def drag_window(page, window, dx, dy):
    head = window.locator("[data-cab-drag]").bounding_box()
    assert head
    before = window.bounding_box()
    point = (head["x"] + 18, head["y"] + head["height"] / 2)
    page.mouse.move(*point)
    page.mouse.down()
    page.mouse.move(point[0] + dx, point[1] + dy, steps=8)
    page.mouse.up()
    after = window.bounding_box()
    assert abs(after["x"] - before["x"] - dx) <= 2, (before, after)
    assert abs(after["y"] - before["y"] - dy) <= 2, (before, after)


def assert_origin(page, rect, at_start):
    frame_index = 0 if at_start else -1
    center = page.evaluate("""index => {
        const animation = windowMotions.at(-1);
        const matrix = new DOMMatrix(animation.frames.at(index).transform);
        return [matrix.e + animation.width * matrix.a / 2,
                matrix.f + animation.height * matrix.d / 2, matrix.a, matrix.d];
    }""", frame_index)
    assert center[2] < 1 or center[3] < 1, center
    assert abs(center[0] - rect["x"] - rect["width"] / 2) < 3, (center, rect)
    assert abs(center[1] - rect["y"] - rect["height"] / 2) < 3, (center, rect)


def check_list(browser, base):
    with fixture.new_context(browser, bar_open=False) as context:
        page = boot(context, base, "students")
        page.set_viewport_size({"width": 1300, "height": 1100})
        errors = []
        page.on("pageerror", lambda error: errors.append(str(error)))
        row = page.locator(f'[data-sid="{fixture.VANYA}"]')
        link = row.get_by_role("link", name="Открыть карточку")
        expect(link).to_be_visible()
        expect(link).to_contain_text("Карточка")
        origin = link.bounding_box()
        shot(row.locator(".cs-nmw"), "list-entry.png")
        link.click()
        card = page.get_by_role("dialog", name="Карточка ученика")
        expect(card.locator("#cName")).to_have_text("Ваня")
        expect(page.locator("#stuHost")).to_be_visible()
        settled(card)
        assert_origin(page, origin, True)
        drag_window(page, card, -54, 47)
        shot(page, "student-card.png")
        card.get_by_role("button", name="Закрыть карточку").click()
        expect(card).to_be_hidden()
        assert_origin(page, origin, False)
        expect(link).to_be_focused()
        assert page.url.endswith("#/students")
        # Ссылка из другого раздела или закладки открывает самостоятельную карточку.
        page.goto(f"{base}/cabinet.html#/students/{fixture.PETYA}")
        expect(page.locator("#cName")).to_have_text("Петя")
        expect(page.locator("#stuHost")).to_be_hidden()
        expect(page.locator("#cFloatBar")).to_be_hidden()
        assert not errors, errors
    print("✓ Кнопка в списке, окно из своего ученика, перетаскивание, возврат фокуса и прямая ссылка")


def check_week(browser, base):
    with fixture.new_context(browser, bar_open=False) as context:
        page = boot(context, base, "schedule/2026-11-16")
        sun = page.locator('.sc-col[data-day="2026-11-22"]')
        sunday = sun.locator('[data-id="sun-early"] [data-p]')
        expect(sunday).to_be_visible()
        sunday.scroll_into_view_if_needed()
        sunday.click()
        origin = sunday.bounding_box()
        small = page.get_by_role("dialog", name="Ученик на занятии")
        expect(small).to_be_visible()
        settled(small)
        assert_origin(page, origin, True)
        sr, cr = small.bounding_box(), sun.bounding_box()
        assert sr["x"] + sr["width"] <= cr["x"] - 6, (sr, cr)
        next_student = sun.locator('[data-id="sun-late"] [data-p]')
        assert next_student.evaluate("""node => {
          const point = node.getBoundingClientRect();
          return node.contains(document.elementFromPoint(point.x + point.width/2, point.y + point.height/2));
        }""")
        shot(page, "sunday-card.png")
        small.get_by_role("button", name="Открыть занятие").click()
        panel = page.get_by_role("dialog", name="Занятие", exact=True)
        expect(panel).to_be_visible()
        settled(panel)
        assert panel.bounding_box()["x"] + panel.bounding_box()["width"] <= cr["x"] - 6
        drag_window(page, panel, -68, -36)
        panel.get_by_role("button", name="Закрыть", exact=True).click()
        expect(panel).to_be_hidden()
        assert_origin(page, sunday.bounding_box(), False)

        mon = page.locator('.sc-col[data-day="2026-11-16"]')
        monday = mon.locator('[data-id="mon-test"] .sc-pt')
        monday.click()
        expect(panel).to_be_visible()
        settled(panel)
        assert panel.bounding_box()["x"] >= mon.bounding_box()["x"] + mon.bounding_box()["width"] + 6
        page.keyboard.press("Escape")
        expect(panel).to_be_hidden()
    print("✓ Воскресенье открывается слева, понедельник справа, соседний урок виден, окно занятия перетаскивается")


def overlap(a, b):
    return (a["x"] < b["x"] + b["width"] and a["x"] + a["width"] > b["x"] and
            a["y"] < b["y"] + b["height"] and a["y"] + a["height"] > b["y"])


def check_mobile(browser, base):
    with browser.new_context(viewport={"width": 375, "height": 820}, is_mobile=True, has_touch=True,
                             reduced_motion="reduce") as context:
        context.route("https://**/*", lambda route: route.abort())
        context.route("https://fakesb.test/db", fixture.handle_db)
        context.route("**/supabase-js.umd.js", lambda route: route.fulfill(
            status=200, content_type="application/javascript", body=fixture.FAKE_SB_JS))
        context.add_init_script("localStorage.setItem('__fakesb_session', " + json.dumps(fixture.SESSION_JSON) + ")")
        page = boot(context, base, "schedule/2026-11-16")
        sunday = page.locator('.sc-plate[data-id="sun-early"] [data-p]')
        sunday.scroll_into_view_if_needed()
        sunday.tap()
        protected = page.locator('.sc-plate[data-id="sun-early"]').bounding_box()
        small = page.get_by_role("dialog", name="Ученик на занятии")
        expect(small).to_be_visible()
        settled(small)
        box = small.bounding_box()
        assert not overlap(box, protected), (box, protected)
        assert box["x"] >= 0 and box["x"] + box["width"] <= 375
        assert page.evaluate("windowMotions.at(-1).frames.every(frame => !frame.transform)")
        shot(page, "mobile-sunday.png")
        header = small.locator("[data-cab-drag]").bounding_box()
        x, y = header["x"] + 18, header["y"] + header["height"] / 2
        touch = context.new_cdp_session(page)
        touch.send("Input.dispatchTouchEvent", {"type":"touchStart", "touchPoints":[{"x":x, "y":y}]})
        touch.send("Input.dispatchTouchEvent", {"type":"touchMove", "touchPoints":[{"x":x - 20, "y":y - 26}]})
        touch.send("Input.dispatchTouchEvent", {"type":"touchEnd", "touchPoints":[]})
        moved = small.bounding_box()
        assert abs(moved["x"] - box["x"] + 20) < 2 and abs(moved["y"] - box["y"] + 26) < 2, (box, moved)
        small.get_by_role("button", name="Закрыть", exact=True).tap()
        expect(small).to_be_hidden()

        page.set_viewport_size({"width": 320, "height": 820})
        sunday.scroll_into_view_if_needed()
        sunday.tap()
        expect(small).to_be_visible()
        settled(small)
        status = small.locator(".sc-sc-status")
        buttons = small.get_by_role("group", name="Статус").get_by_role("button")
        expect(status).to_have_text("запланировано")
        expect(buttons).to_have_text(["План", "Пров.", "Перенос", "Отмена"])
        assert buttons.evaluate_all("""nodes => {
            const boxes = nodes.map(node => node.getBoundingClientRect());
            return boxes.length === 4 && boxes.every(box => box.top === boxes[0].top && box.height >= 44)
                && nodes.every(node => node.scrollWidth <= node.clientWidth);
        }""")
        expect(buttons.first).to_have_attribute("aria-pressed", "true")
        shot(page, "mobile-statuses-320.png")
        for name in ["проведено", "перенос", "отменено", "запланировано"]:
            option = small.get_by_role("button", name=name, exact=True)
            option.tap()
            expect(status).to_have_text(name)
            expect(option).to_have_attribute("aria-pressed", "true")
            expect(small.locator('[data-set][aria-pressed="true"]')).to_have_count(1)
        small.get_by_role("button", name="перенос", exact=True).tap()
        small.get_by_role("button", name="Закрыть", exact=True).tap()
        expect(small).to_be_hidden()
        sunday.tap()
        expect(status).to_have_text("перенос")
    print("✓ Узкий экран: перетаскивание и сокращение движения. На 320 px четыре статуса в один ряд и текущий виден после повторного открытия")


if __name__ == "__main__":
    db = seed()
    db["students"][0]["exam"] = "ege_prof"
    db["lessons"] += [
        lesson("mon-test", "2026-11-16", 615),
        lesson("sun-early", "2026-11-22", 615),
        lesson("sun-late", "2026-11-22", 702),
    ]
    db["lesson_students"] += [
        person("mo1", "mon-test", fixture.VANYA), person("su1", "sun-early", fixture.VANYA),
        person("su2", "sun-late", fixture.PETYA),
    ]
    fixture.STATE["db"] = json.dumps(db)
    handler = partial(QuietHandler, directory=Path(__file__).resolve().parent)
    with ThreadingHTTPServer(("127.0.0.1", 0), handler) as server, sync_playwright() as playwright:
        base = f"http://127.0.0.1:{server.server_port}"
        Thread(target=server.serve_forever, daemon=True).start()
        try:
            browser = playwright.chromium.launch()
            check_list(browser, base)
            check_week(browser, base)
            check_mobile(browser, base)
            browser.close()
        finally:
            server.shutdown()
