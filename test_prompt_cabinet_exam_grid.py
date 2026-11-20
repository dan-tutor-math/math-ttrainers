"""Экзаменационная сетка в карточке ученика. База на заглушке."""
import os
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from threading import Thread

from playwright.sync_api import expect, sync_playwright

from test_prompt_b1_student_memory import PETYA, VANYA, new_context


class QuietHandler(SimpleHTTPRequestHandler):
    def log_message(self, *_args):
        pass


def open_student(page, base, student=VANYA):
    page.goto(f"{base}/cabinet.html#/students/{student}")
    expect(page.locator("#cName")).to_have_text("Ваня" if student == VANYA else "Петя")
    grid = page.get_by_role("region", name="Экзаменационная сетка")
    expect(grid).to_be_visible()
    return grid


def select_exam(page, exam):
    page.locator("#cExam").select_option(exam)
    page.locator("#cSave").click()
    expect(page.locator("#cMsg")).to_have_text("Сохранено")


def cell(grid, number, week):
    return grid.get_by_role("button", name=f"Задание №{number}, неделя {week},", exact=False)


def edit_week(grid, week, day):
    grid.get_by_role("button", name=f"Дата недели {week},", exact=False).click()
    dialog = grid.get_by_role("dialog")
    dialog.get_by_label("Дата недели").fill(day)
    dialog.get_by_role("button", name="Сохранить", exact=True).click()
    expect(dialog).to_be_hidden()


def edit_mark(grid, number, week, level, note=""):
    cell(grid, number, week).click()
    dialog = grid.get_by_role("dialog")
    dialog.get_by_label("Уровень освоения").select_option(level)
    dialog.get_by_label("Что делали").fill(note)
    dialog.get_by_role("button", name="Сохранить", exact=True).click()
    expect(dialog).to_be_hidden()


def shot(grid, name):
    if directory := os.environ.get("MATHH_GRID_SCREENSHOTS"):
        path = Path(directory) / name
        path.parent.mkdir(parents=True, exist_ok=True)
        grid.screenshot(path=path)


def check_history(context, base):
    first = context.new_page()
    errors = []
    first.on("pageerror", lambda error: errors.append(str(error)))
    grid = open_student(first, base)
    table = grid.get_by_role("table", name="Прогресс по неделям")
    expect(table.locator("tbody tr")).to_have_count(25)
    select_exam(first, "ege_prof")
    expect(table.locator("tbody tr")).to_have_count(19)
    expect(table.get_by_role("columnheader", name="Нед. 32")).to_have_count(1)
    expect(table.get_by_role("rowheader", name="Тема задания №1, Планиметрия")).to_be_visible()
    expect(table.get_by_role("rowheader", name="Тема задания №19, Числа и их свойства")).to_have_count(1)

    date = grid.get_by_role("button", name="Дата недели 1,", exact=False)
    date.focus()
    first.keyboard.press("ArrowDown")
    expect(cell(grid, 1, 1)).to_be_focused()
    first.keyboard.press("Enter")
    dialog = grid.get_by_role("dialog")
    expect(dialog).to_be_visible()
    first.keyboard.press("Escape")
    expect(dialog).to_be_hidden()
    expect(cell(grid, 1, 1)).to_be_focused()

    edit_week(grid, 1, "2026-11-04")
    edit_mark(grid, 1, 1, "1", "Решали задачи про окружности <на доске>")
    edit_mark(grid, 2, 1, "3")

    second = context.new_page()
    other_tab = open_student(second, base)
    edit_week(other_tab, 2, "2026-11-11")
    edit_mark(other_tab, 1, 2, "2", "Треугольники")
    expect(cell(grid, 1, 2)).to_have_text("2")
    expect(grid.get_by_role("button", name="Дата недели 2,", exact=False)).to_have_text("11.11.2026")
    edit_mark(grid, 2, 2, "0")
    expect(cell(other_tab, 2, 2)).to_have_text("0")
    rows = table.locator("tbody tr")
    expect(rows.nth(0).locator("[data-average]")).to_have_text("1,5")
    expect(rows.nth(0).locator("[data-current]")).to_have_text("2")
    expect(rows.nth(1).locator("[data-average]")).to_have_text("1,5")
    expect(rows.nth(1).locator("[data-current]")).to_have_text("0")
    expect(grid.locator("[data-overall]")).to_have_text("Средний текущий уровень 1")
    shot(grid, "desktop-light.png")

    view = grid.locator(".exam-grid__view")
    pinned = rows.nth(0).get_by_role("rowheader")
    left = pinned.bounding_box()["x"]
    assert pinned.evaluate("(node) => getComputedStyle(node).backgroundColor === 'rgb(255, 255, 255)'")
    grid.get_by_role("button", name="К итогам").click()
    expect(grid.get_by_role("button", name="К неделям")).to_be_visible()
    assert view.evaluate("(node) => node.scrollLeft > 0")
    assert abs(left - pinned.bounding_box()["x"]) <= 1
    shot(grid, "desktop-totals.png")
    grid.get_by_role("button", name="К неделям").click()
    expect(grid.get_by_role("button", name="К итогам")).to_be_visible()
    assert view.evaluate("(node) => node.scrollLeft === 0")

    first.reload()
    expect(table.locator("tbody tr")).to_have_count(19)
    expect(date).to_have_text("04.11.2026")
    cell(grid, 1, 1).click()
    expect(dialog.get_by_label("Что делали")).to_have_value("Решали задачи про окружности <на доске>")
    dialog.get_by_role("button", name="Отмена").click()
    second.close()

    other_student = open_student(first, base, PETYA)
    expect(table.locator("tbody tr")).to_have_count(25)
    expect(date).to_have_text("—")
    expect(cell(other_student, 1, 1)).to_be_empty()
    select_exam(first, "rus_ege")
    expect(table.locator("tbody tr")).to_have_count(27)
    expect(table.get_by_role("rowheader", name="Тема задания №27, Сочинение по тексту")).to_have_count(1)
    edit_mark(grid, 1, 1, "3")
    select_exam(first, "phys_ege")
    expect(table.locator("tbody tr")).to_have_count(26)
    expect(cell(grid, 1, 1)).to_be_empty()
    grid.get_by_role("button", name="Тема задания №1, не задана", exact=True).click()
    dialog.get_by_label("Тема задания").fill("Механика")
    dialog.get_by_role("button", name="Сохранить", exact=True).click()
    expect(grid.get_by_role("button", name="Тема задания №1, Механика")).to_be_visible()
    select_exam(first, "")
    expect(grid.get_by_text("Выберите экзамен в карточке ученика и сохраните.")).to_be_visible()

    grid = open_student(first, base)
    expect(cell(grid, 1, 1)).to_have_text("1")
    first.evaluate("CabinetCloud.signOut()")
    expect(first.locator("#scrAuth")).to_be_visible()
    expect(first.locator("#cardBox")).to_be_empty()
    assert not errors, errors
    print("✓ 32 недели, даты, уровни 0–3, итоги, закреплённые темы, перезагрузка и разные ученики")


def check_mobile_and_storage(context, base):
    page = context.new_page()
    page.set_viewport_size({"width": 320, "height": 780})
    grid = open_student(page, base)
    page.evaluate("document.documentElement.dataset.theme = 'dark'")
    select_exam(page, "ege_prof")
    edit_week(grid, 1, "2026-11-04")
    edit_mark(grid, 1, 1, "2")
    assert page.evaluate("document.documentElement.scrollWidth <= innerWidth")
    assert cell(grid, 1, 1).bounding_box()["height"] >= 44
    view = grid.locator(".exam-grid__view")
    assert view.evaluate("(node) => node.scrollWidth > node.clientWidth && node.scrollHeight > node.clientHeight")
    shot(grid, "mobile-dark.png")
    grid.get_by_role("button", name="К итогам").click()
    expect(grid.get_by_role("button", name="К неделям")).to_be_visible()
    last_header = grid.get_by_role("columnheader", name="Текущий уровень")
    topic_header = grid.get_by_role("columnheader", name="Тема задания")
    assert last_header.evaluate("(node) => node.getBoundingClientRect().left") >= (
        topic_header.evaluate("(node) => node.getBoundingClientRect().right")
    )
    grid.get_by_role("button", name="К неделям").click()

    page.evaluate("""() => {
        const setItem = Storage.prototype.setItem;
        Storage.prototype.setItem = function(key, value) {
            if (key.startsWith('cabinet:exam-grid:')) throw new DOMException('Quota', 'QuotaExceededError');
            return setItem.call(this, key, value);
        };
    }""")
    cell(grid, 1, 1).click()
    dialog = grid.get_by_role("dialog")
    dialog.get_by_label("Уровень освоения").select_option("3")
    dialog.get_by_label("Что делали").fill("ДлиннаяТема" * 14)
    shot(dialog, "mobile-dark-editor.png")
    dialog.get_by_role("button", name="Сохранить", exact=True).click()
    expect(dialog.get_by_text("Не удалось сохранить запись в браузере.")).to_be_visible()
    expect(dialog.get_by_label("Что делали")).to_have_value("ДлиннаяТема" * 14)
    dialog.get_by_role("button", name="Отмена").click()
    expect(cell(grid, 1, 1)).to_have_text("2")
    print("✓ Ширина 320 px, тёмная тема и сохранение черновика при ошибке браузера")


if __name__ == "__main__":
    handler = partial(QuietHandler, directory=Path(__file__).resolve().parent)
    with ThreadingHTTPServer(("127.0.0.1", 0), handler) as server, sync_playwright() as playwright:
        base = f"http://127.0.0.1:{server.server_port}"
        Thread(target=server.serve_forever, daemon=True).start()
        try:
            browser = playwright.chromium.launch()
            with new_context(browser, bar_open=False) as context:
                check_history(context, base)
            with new_context(browser, bar_open=False) as context:
                check_mobile_and_storage(context, base)
            browser.close()
        finally:
            server.shutdown()
