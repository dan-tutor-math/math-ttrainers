"""Карточки ученика и занятия в кабинете. Все ученики и уроки тестовые."""
import json
import os
from functools import partial
from http.server import ThreadingHTTPServer
from pathlib import Path
from threading import Thread

from playwright.sync_api import expect, sync_playwright

import test_prompt_b1_student_memory as fixture
from test_prompt_cabinet_exam_grid import QuietHandler, cell, edit_mark
from test_prompt_cabinet_links import lesson, person, seed, FIXED_NOW_JS


TRACK_MOTION = """() => {
  window.windowMotions = {};
  const drawImage = CanvasRenderingContext2D.prototype.drawImage;
  CanvasRenderingContext2D.prototype.drawImage = function(image, ...args) {
    if (this.canvas.classList.contains('cab-genie') && args.length === 8) {
      const matrix = this.getTransform();
      const phase = this.canvas.dataset.direction;
      const track = windowMotions[phase] ||= { bend:false, xs:[], ys:[], frames:0 };
      track.frames += args[0] === 0 && args[1] === 0 ? 1 : 0;
      track.bend ||= Math.abs(matrix.b) > .08 || Math.abs(matrix.c) > .08;
      if (this.globalAlpha < .06) {
        track.xs.push(matrix.e + args[6] * matrix.a / 2 + args[7] * matrix.c / 2);
        track.ys.push(matrix.f + args[6] * matrix.b / 2 + args[7] * matrix.d / 2);
      }
    }
    return drawImage.call(this, image, ...args);
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
    expect(window.page.locator(".cab-genie")).to_be_hidden()


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
    expect(page.locator(".cab-genie")).to_be_hidden()
    track = page.evaluate("(direction) => windowMotions[direction]", "open" if at_start else "close")
    assert track and track["frames"] > 4 and track["bend"], track
    for axis, pos, size in (("xs", "x", "width"), ("ys", "y", "height")):
        center = (min(track[axis]) + max(track[axis])) / 2
        assert abs(center - rect[pos] - rect[size] / 2) < 9, (center, rect, track)


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
        expect(page.locator(".cab-genie")).to_be_visible()
        link.click()
        expect(card.locator("#cName")).to_have_text("Ваня")
        settled(card)
        expect(page.locator(".cab-student-window")).to_have_count(1)
        page.evaluate("delete windowMotions.close")
        link.click()
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
        page.evaluate("windowMotions = {}")
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
        page.evaluate("windowMotions = {}")
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


def check_stacked_lessons(browser, base):
    db = json.loads(fixture.STATE["db"])
    db["lessons"] += [
        lesson("wed-1545", "2026-11-18", 945), lesson("wed-1600", "2026-11-18", 960),
    ]
    db["lesson_students"] += [
        person("we1", "wed-1545", fixture.VANYA, "done"), person("we2", "wed-1600", fixture.PETYA, "done"),
    ]
    fixture.STATE["db"] = json.dumps(db)
    with fixture.new_context(browser, bar_open=False) as context:
        page = boot(context, base, "schedule/2026-11-16")
        page.set_viewport_size({"width": 1440, "height": 960})
        early = page.locator('.sc-plate[data-id="wed-1545"]')
        late = page.locator('.sc-plate[data-id="wed-1600"]')
        early.evaluate("el => el.scrollIntoView({block:'center', inline:'center'})")
        layer = early.evaluate("el => getComputedStyle(el).zIndex")

        def front_tile():
            return early.evaluate("""el => {
              const a = el.getBoundingClientRect();
              const b = el.parentElement.querySelector('[data-id="wed-1600"]').getBoundingClientRect();
              const x = (Math.max(a.left,b.left) + Math.min(a.right,b.right)) / 2;
              const y = (Math.max(a.top,b.top) + Math.min(a.bottom,b.bottom)) / 2;
              return document.elementFromPoint(x,y)?.closest('.sc-plate')?.dataset.id;
            }""")

        assert front_tile() == "wed-1600"
        early.locator(".sc-pt").click()
        panel = page.get_by_role("dialog", name="Занятие", exact=True)
        expect(panel).to_be_visible()
        assert front_tile() == "wed-1545"
        expect(early).to_have_css("outline-style", "solid")
        assert early.evaluate("""el => {
          const style = getComputedStyle(el);
          const pixels = document.createElement('canvas').getContext('2d');
          function rgb(color) {
            pixels.clearRect(0,0,1,1);
            pixels.fillStyle = color;
            pixels.fillRect(0,0,1,1);
            return pixels.getImageData(0,0,1,1).data;
          }
          const edge = rgb(style.borderColor), ring = rgb(style.outlineColor);
          return edge[1] > edge[0] && [0,1,2].every(i => Math.abs(edge[i] - ring[i]) < 4);
        }""")
        page.evaluate("Schedule.reload()")
        assert front_tile() == "wed-1545"
        panel.get_by_role("button", name="Закрыть", exact=True).click()
        expect(panel).to_be_hidden()
        assert front_tile() == "wed-1600"
        expect(early).to_have_css("z-index", layer)

        late.locator("[data-p]").click()
        quick = page.get_by_role("dialog", name="Ученик на занятии")
        settled(quick)
        early.locator(".sc-pt").click()
        settled(panel)
        tray = page.get_by_role("group", name="Открытые окна")
        tray.get_by_role("button", name="Петя", exact=True).click()
        assert front_tile() == "wed-1600"
        tray.get_by_role("button", name="Ваня", exact=True).click()
        assert front_tile() == "wed-1545"
        page.keyboard.press("Escape")
        expect(panel).to_be_hidden()
        assert front_tile() == "wed-1600"
        page.keyboard.press("Escape")
        expect(quick).to_be_hidden()
        expect(page.locator(".sc-plate.cab-window-source")).to_have_count(0)
    print("✓ Наложение в среду, цвет обводки, обновление сетки, переключение окон и возврат слоя")


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
        assert page.evaluate("Object.keys(windowMotions).length === 0")
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


def resize_window(page, card, edge, dx, dy):
    lever = card.locator(f'[data-edge="{edge}"]')
    box = lever.bounding_box()
    x, y = box["x"] + box["width"] / 2, box["y"] + box["height"] / 2
    page.mouse.move(x, y)
    page.mouse.down()
    page.mouse.move(x + dx, y + dy, steps=6)
    page.mouse.up()


def check_five(browser, base):
    with fixture.new_context(browser, bar_open=False) as context:
        page = boot(context, base, "students")
        page.set_viewport_size({"width": 1360, "height": 1000})
        links = page.locator("#stuHost [data-student-card]")
        expect(links).to_have_count(6)
        def open_id(student, mouse=False):
            source = links.and_(page.locator(f'[data-student-card="{student}"]'))
            if mouse:
                source.click()
            else:
                source.press("Enter")

        open_id(fixture.VANYA)
        first = page.locator(".cab-student-window").first
        expect(first.get_by_label("Имя", exact=True)).to_have_value("Ваня")
        before = first.bounding_box()
        resize_window(page, first, "e", 58, 0)
        widened = first.bounding_box()
        assert abs(widened["width"] - before["width"] - 58) <= 2 and widened["x"] == before["x"], (before, widened)
        resize_window(page, first, "nw", -35, -35)
        expanded = first.bounding_box()
        assert abs(expanded["x"] - widened["x"] + 35) <= 2, (widened, expanded)
        assert abs(expanded["y"] - widened["y"] + 35) <= 2, (widened, expanded)
        assert abs(expanded["width"] + expanded["x"] - widened["width"] - widened["x"]) <= 2
        first.get_by_role("button", name="Изменить размер окна стрелками").press("ArrowDown")
        assert abs(first.bounding_box()["height"] - expanded["height"] - 10) <= 2

        open_id(fixture.PETYA)
        cards = page.locator(".cab-student-window")
        second = cards.nth(1)
        expect(second.get_by_label("Имя", exact=True)).to_have_value("Петя")
        first.get_by_label("Заметка").fill("Несохранённая заметка Вани")
        tray = page.get_by_role("group", name="Открытые окна")
        tray.get_by_role("button", name="Петя", exact=True).click()
        second.get_by_label("Заметка").fill("Заметка Пети")
        second.get_by_role("button", name="Сохранить", exact=True).click()
        expect(second.get_by_role("status").filter(has_text="Сохранено")).to_be_visible()
        expect(first.get_by_label("Заметка")).to_have_value("Несохранённая заметка Вани")
        second_grid = second.get_by_role("region", name="Экзаменационная сетка")
        edit_mark(second_grid, 1, 1, "2", "Только у Пети")
        expect(cell(first.get_by_role("region", name="Экзаменационная сетка"), 1, 1)).to_be_empty()
        mocks = second.get_by_role("region", name="Анализ пробников")
        mocks.get_by_role("button", name="Добавить пробник").click()
        edit = mocks.get_by_role("dialog")
        expect(edit.get_by_label("Дата пробника")).to_be_visible()
        edit.get_by_label("Название варианта", exact=False).fill("Пробник Пети")
        edit.get_by_role("button", name="Сохранить", exact=True).click()
        expect(mocks.get_by_text("Пробник Пети", exact=False)).to_be_visible()
        expect(first.get_by_text("Пробник Пети", exact=False)).to_have_count(0)
        assert page.evaluate("""() => {
          const ids = [...document.querySelectorAll('.cab-student-window [id]')].map(el => el.id);
          return new Set(ids).size === ids.length;
        }""")

        for student in ["extra-2", "extra-3", "extra-4", "extra-5"]:
            open_id(student, mouse=True)
        expect(cards).to_have_count(5)
        expect(page.locator("#toast")).to_contain_text("Открыто пять окон")
        tray.get_by_role("button", name="Ваня", exact=True).click()
        expect(tray.get_by_role("button", name="Ваня", exact=True)).to_have_attribute("aria-pressed", "true")
        assert first.evaluate("el => +el.style.zIndex") > second.evaluate("el => +el.style.zIndex")
        expect(page.locator(".cab-genie")).to_be_hidden()
        motion = tray.get_by_role("button", name="Анимация")
        enabled = motion.get_attribute("aria-pressed") == "true"
        motion.click()
        expect(motion).to_have_attribute("aria-pressed", str(not enabled).lower())
        if not enabled:
            motion.click()
            expect(motion).to_have_attribute("aria-pressed", "false")
        first.get_by_role("button", name="Закрыть карточку").click()
        expect(cards).to_have_count(4)
        expect(page.locator(".cab-genie")).to_be_hidden()
        page.reload()
        expect(cards).to_have_count(0)
        assert page.evaluate("localStorage.getItem('mathh:cabinet:window-motion') === 'off'")
    print("✓ Пять окон, ограничение шестого, изменение размеров, фокус, отдельные записи сетки и пробников")


def check_touch_limits(browser, base):
    with fixture.new_context(browser, bar_open=False) as context:
        page = boot(context, base, "schedule/2026-11-16")
        page.set_viewport_size({"width": 1200, "height": 940})
        context.add_init_script("localStorage.setItem('mathh:cabinet:window-motion', 'off')")
        page.reload()
        sun = page.locator('.sc-col[data-day="2026-11-22"]')
        sunday = sun.locator('[data-id="sun-early"] [data-p]')
        late = sun.locator('[data-id="sun-late"] [data-p]')
        sunday.click()
        late.click()
        quick = page.locator(".sc-scard")
        expect(quick).to_have_count(2)
        expect(quick.first.locator(".sc-sc-name")).to_have_text("Ваня")
        expect(quick.last.locator(".sc-sc-name")).to_have_text("Петя")
        # Ширина окна на настольном браузере может быть как у смартфона.
        page.set_viewport_size({"width": 390, "height": 844})
        expect(quick).to_have_count(2)
        expect(quick.last.locator(".sc-sc-name")).to_have_text("Петя")

    for width, height, expected in [(820, 1180, 2), (844, 390, 1), (390, 844, 1)]:
        context = browser.new_context(viewport={"width": width, "height": height}, is_mobile=True, has_touch=True)
        try:
            context.route("https://**/*", lambda route: route.abort())
            context.route("https://fakesb.test/db", fixture.handle_db)
            context.route("**/supabase-js.umd.js", lambda route: route.fulfill(
                status=200, content_type="application/javascript", body=fixture.FAKE_SB_JS))
            context.add_init_script("localStorage.setItem('__fakesb_session', " + json.dumps(fixture.SESSION_JSON) + ")")
            context.add_init_script("localStorage.setItem('mathh:cabinet:window-motion', 'off')")
            page = boot(context, base, "students")
            for student in [fixture.VANYA, fixture.PETYA]:
                page.locator(f'#stuHost [data-student-card="{student}"]').press("Enter")
            cards = page.locator(".cab-student-window")
            expect(cards).to_have_count(expected)
            expect(cards.last.get_by_label("Имя", exact=True)).to_have_value("Петя")
            if expected == 2:
                before = cards.last.bounding_box()
                handle = cards.last.locator('[data-edge="se"]').bounding_box()
                x, y = (handle["x"] + handle["width"] / 2, handle["y"] + handle["height"] / 2)
                touch = context.new_cdp_session(page)
                touch.send("Input.dispatchTouchEvent", {"type":"touchStart", "touchPoints":[{"x":x, "y":y}]})
                touch.send("Input.dispatchTouchEvent", {"type":"touchMove", "touchPoints":[{"x":x - 55, "y":y - 70}]})
                touch.send("Input.dispatchTouchEvent", {"type":"touchEnd", "touchPoints":[]})
                after = cards.last.bounding_box()
                assert abs(after["width"] - before["width"] + 55) <= 2, (before, after)
                assert abs(after["height"] - before["height"] + 70) <= 2, (before, after)
                assert after["x"] == before["x"] and after["y"] == before["y"]
        finally:
            context.close()
    print("✓ Планер с двумя учениками, планшет с сенсорным растягиванием, телефон в обеих ориентациях с одним окном")


def check_desktop_sources(browser, base):
    with fixture.new_context(browser, bar_open=False) as context:
        context.add_init_script("localStorage.setItem('mathh:cabinet:window-motion', 'off')")

        def sync_hook(route):
            response = route.fetch()
            route.fulfill(response=response, body=response.text() + """
                const originalInit = ScheduleSync.init;
                ScheduleSync.init = options => {
                  window.notifyScheduleSync = options.onChanged;
                  return originalInit(options);
                };
            """)

        context.route("**/schedule-sync.js", sync_hook)
        page = boot(context, base, "students")
        page.set_viewport_size({"width": 550, "height": 960})
        open_vanya = page.locator(f'#stuHost [data-student-card="{fixture.VANYA}"]')
        open_petya = page.locator(f'#stuHost [data-student-card="{fixture.PETYA}"]')
        open_vanya.click()
        open_petya.click()
        cards = page.locator(".cab-student-window")
        expect(cards).to_have_count(2)
        expect(cards.first.get_by_label("Имя", exact=True)).to_have_value("Ваня")
        expect(cards.last.get_by_label("Имя", exact=True)).to_have_value("Петя")
        cards.last.get_by_label("Заметка").fill("Черновик Пети")
        page.evaluate("notifyScheduleSync()")
        expect(page.locator("#stuHost")).to_be_visible()
        expect(cards).to_have_count(2)
        expect(cards.last.get_by_label("Заметка")).to_have_value("Черновик Пети")
        open_vanya.click()
        expect(cards).to_have_count(1)
        expect(cards.last.get_by_label("Заметка")).to_have_value("Черновик Пети")
        open_petya.click()
        expect(cards).to_have_count(0)
        print("✓ Две карточки по щелчку мышью при ширине окна 550 px, сохранение окон при синхронизации, закрытие своей кнопкой")


def check_lesson_sources(browser, base):
    with fixture.new_context(browser, bar_open=False) as context:
        context.add_init_script("localStorage.setItem('mathh:cabinet:window-motion', 'off')")
        page = boot(context, base, "schedule/2026-11-16")
        page.set_viewport_size({"width": 1280, "height": 940})
        morning = page.locator('.sc-plate[data-id="sun-early"]')
        later = page.locator('.sc-plate[data-id="sun-late"]')
        quick = page.locator(".sc-scard")
        morning.locator("[data-p]").click()
        later.locator("[data-p]").click()
        expect(quick).to_have_count(2)
        morning.locator("[data-p]").click()
        expect(quick).to_have_count(1)
        expect(quick.locator(".sc-sc-name")).to_have_text("Петя")
        later.locator("[data-p]").click()
        expect(quick).to_have_count(0)

        morning.locator(".sc-pt").click()
        later.locator(".sc-pt").click()
        details = page.locator(".sc-side")
        expect(details).to_have_count(2)
        expect(details.first.locator(".sc-sp-name")).to_have_text("Ваня")
        expect(details.last.locator(".sc-sp-name")).to_have_text("Петя")
        assert page.evaluate("""() => {
          const ids = [...document.querySelectorAll('.sc-side [id]')].map(el => el.id);
          return new Set(ids).size === ids.length;
        }""")

        first_profile = details.first.get_by_role("link", name="Открыть карточку")
        second_profile = details.last.get_by_role("link", name="Открыть карточку")
        tray = page.get_by_role("group", name="Открытые окна")
        tray.get_by_role("button", name="Ваня", exact=True).click()
        first_profile.click()
        profiles = page.locator(".cab-student-window")
        expect(profiles.first.get_by_label("Имя", exact=True)).to_have_value("Ваня")
        tray.get_by_role("button", name="Петя", exact=True).click()
        second_profile.click()
        expect(profiles).to_have_count(2)
        expect(profiles.last.get_by_label("Имя", exact=True)).to_have_value("Петя")
        assert page.url.endswith("#/schedule/2026-11-16")
        tray.get_by_role("button", name="Петя", exact=True).first.click()
        second_profile.click()
        expect(profiles).to_have_count(1)
        expect(profiles.first.get_by_label("Имя", exact=True)).to_have_value("Ваня")
        tray.get_by_role("button", name="Ваня", exact=True).first.click()
        first_profile.click()
        expect(profiles).to_have_count(0)
        morning.locator(".sc-pt").click()
        expect(details).to_have_count(1)
        expect(details.first.locator(".sc-sp-name")).to_have_text("Петя")
        later.locator(".sc-pt").click()
        expect(details).to_have_count(0)
        print("✓ По повторному щелчку закрываются окна ученика и занятия. Полные карточки открываются поверх планера")


if __name__ == "__main__":
    db = seed()
    db["students"][0]["exam"] = "ege_prof"
    for i in range(2, 6):
        db["students"].append({**db["students"][1], "id": f"extra-{i}", "name": f"Ученик {i}"})
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
            check_five(browser, base)
            check_touch_limits(browser, base)
            check_desktop_sources(browser, base)
            check_lesson_sources(browser, base)
            check_stacked_lessons(browser, base)
            browser.close()
        finally:
            server.shutdown()
