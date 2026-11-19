"""Отчёт по сессии на доске, в тренажёре и в кабинете. База на заглушке."""
import os
from datetime import datetime, timedelta, timezone
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from threading import Thread

from playwright.sync_api import expect, sync_playwright

import test_prompt_rus_board_check as board_fixture
from test_prompt_b1_student_memory import PETYA, VANYA, new_context

SHOT_DIR = os.environ.get("MATHH_REPORT_SCREENSHOTS")


class QuietHandler(SimpleHTTPRequestHandler):
    def log_message(self, *_args):
        pass


def start(page, student=VANYA, lesson=None):
    page.evaluate("""([id, name, lessonId]) => StudentMemory.start(
        { id, name, grade: 8, exam: 'oge' }, { lessonId })""",
                  [student, "Ваня" if student == VANYA else "Петя", lesson])
    page.wait_for_function("() => !!StudentMemory.reportOwner()")


def shot(page, name):
    if SHOT_DIR:
        target = Path(SHOT_DIR) / name
        target.parent.mkdir(parents=True, exist_ok=True)
        page.screenshot(path=target)


def report_panel(page):
    return page.get_by_role("region", name="Отчёт об уроке")


def end_button(page):
    return page.locator('#smBar [data-sm="end"]')


def choose(panel, name):
    panel.get_by_role("button", name=name, exact=True).click()


def check_board_and_history(browser):
    ctx = new_context(browser, bind="browser")
    page, errors = board_fixture.open_board(ctx)
    now = datetime.now(timezone.utc)
    page.clock.set_fixed_time(now)
    start(page)
    page.clock.set_fixed_time(now + timedelta(seconds=10))
    end_button(page).click()
    assert page.evaluate("StudentMemory.current()") is None
    assert not page.get_by_role("button", name="Заполнить отчёт").count(), "ровно 10 секунд"

    page.clock.set_fixed_time(now + timedelta(seconds=11))
    start(page)
    page.clock.set_fixed_time(now + timedelta(seconds=22))
    end_button(page).click()
    offer = page.get_by_role("button", name="Заполнить отчёт")
    expect(offer).to_be_visible()
    shot(page, "offer.png")
    offer.click()
    panel = report_panel(page)
    exam = panel.get_by_role("combobox", name="Экзамен")
    for key, count in [("oge", 25), ("ege_base", 21), ("ege_prof", 19), ("rus_oge", 13),
                       ("rus_ege", 27), ("soc_oge", 20), ("soc_ege", 25), ("eng_oge", 35),
                       ("eng_oge_oral", 3), ("eng_ege", 38), ("eng_ege_oral", 4),
                       ("phys_oge", 22), ("phys_ege", 26), ("inf_oge", 16), ("inf_ege", 27)]:
        exam.select_option(key)
        expect(panel.locator('[data-lr="choose"]')).to_have_count(count)
        expect(panel.get_by_role("button", name=f"№{count}", exact=True)).to_be_visible()
    exam.select_option("oge")
    choose(panel, "№9")
    panel.get_by_role("button", name="В мои темы: ОГЭ №9", exact=True).click()
    choose(panel, "По классам")
    panel.get_by_role("combobox", name="Класс").select_option("8")
    search = panel.get_by_role("searchbox")
    search.fill("квадратные уравнения")
    choose(panel, "Квадратные уравнения")
    panel.get_by_role("button", name="В мои темы: Квадратные уравнения", exact=True).click()
    expect(panel.get_by_role("button", name="В мои темы: Квадратные уравнения")).to_have_count(0)
    search.fill("несуществующая тема")
    expect(panel.get_by_text("Ничего не найдено")).to_be_visible()
    choose(panel, "Мои темы")
    expect(panel.get_by_role("button", name="Квадратные уравнения", exact=True)).to_be_visible()
    expect(panel.get_by_role("button", name="ОГЭ №9", exact=True)).to_be_visible()
    panel.get_by_role("textbox", name="Название своей темы").fill("Решение уравнений заменой")
    choose(panel, "Добавить")
    comment = panel.get_by_role("textbox", name="Комментарий")
    comment.fill("Решили два задания. Повторить замену переменной.")

    # Доска доступна с открытым редактором, клик снаружи его не закрывает.
    count = page.evaluate("getCurrentBoard().objects.length")
    page.mouse.move(940, 360)
    page.mouse.down()
    page.mouse.move(1020, 403, steps=8)
    page.mouse.up()
    page.wait_for_function("n => getCurrentBoard().objects.length > n", arg=count)
    expect(panel).to_be_visible()
    shot(page, "desktop.png")

    choose(panel, "Свернуть")
    expect(panel).to_have_count(0)
    page.get_by_role("button", name="Отчёт · Ваня").click()
    expect(comment).to_have_value("Решили два задания. Повторить замену переменной.")
    expect(panel.get_by_role("button", name="Убрать тему: ОГЭ №9", exact=True)).to_be_visible()
    panel.get_by_role("button", name="Закрыть", exact=True).focus()
    page.keyboard.press("Enter")
    expect(panel).to_have_count(0)
    return_button = page.locator('#smBar [data-sm="pick"]')
    expect(return_button).to_be_focused()
    assert return_button.evaluate("button => button.matches(':focus-visible')")
    shot(page, "focus.png")

    cabinet = ctx.new_page()
    cabinet.goto(f"{BASE}/cabinet.html#/students/{VANYA}")
    history = cabinet.get_by_role("region", name="Отчёты об уроках")
    expect(history).to_contain_text("Черновик")
    history.get_by_role("button", name="Продолжить").click()
    resumed = report_panel(cabinet)
    expect(resumed.get_by_role("textbox", name="Комментарий")).to_have_value("Решили два задания. Повторить замену переменной.")
    custom = resumed.get_by_role("textbox", name="Название своей темы")
    custom.fill("Ещё не добавленная тема")
    resumed.locator("form").evaluate("form => form.requestSubmit(form.querySelector('.lr-save'))")
    expect(resumed.get_by_role("status")).to_have_text("Отчёт сохранён")
    expect(resumed.get_by_role("button", name="Убрать тему: Ещё не добавленная тема")).to_have_count(0)
    cabinet.reload()
    expect(history).to_contain_text("ОГЭ №9 · Квадратные уравнения · Решение уравнений заменой")
    expect(history.get_by_role("button", name="Открыть")).to_have_count(1)
    history.scroll_into_view_if_needed()
    shot(cabinet, "history.png")
    cabinet.goto(f"{BASE}/cabinet.html#/students/{PETYA}")
    expect(history).to_contain_text("Отчётов пока нет")
    assert not errors, errors
    ctx.close()
    print("✓ Доска, порог 10 секунд, номера экзаменов, темы по классам, свои темы, черновик и история.")


def check_tab_groups(browser):
    ctx = new_context(browser)
    page = ctx.new_page()
    url = f"{BASE}/index.html"
    page.goto(url)
    now = datetime.now(timezone.utc)
    page.clock.set_fixed_time(now)
    start(page, lesson="урок-из-расписания")
    sibling = ctx.new_page()
    link = page.evaluate("url => StudentMemory.handoffUrl(url)", url)
    sibling.goto(link)
    sibling.clock.set_fixed_time(now + timedelta(seconds=11))
    page.clock.set_fixed_time(now + timedelta(seconds=11))
    page.wait_for_function("() => StudentMemory.groups().some(group => group.tabs === 2)")
    end_button(sibling).click()
    sibling.get_by_role("button", name="Закончить здесь").click()
    assert not sibling.locator(".lr-offer").count()
    assert page.evaluate("StudentMemory.current().id") == VANYA

    # Открываем отчёт в ходе урока, затем завершаем код совместной
    # сессии и сессию ученика. Оба пути ведут к одной записи.
    page.locator('#smBar [data-sm="report"]').click()
    panel = report_panel(page)
    choose(panel, "№6")
    choose(panel, "Сохранить отчёт")
    choose(panel, "Закрыть")
    page.wait_for_function("() => !!TrainerSession.getCode()")
    assert page.evaluate("TrainerSession.endSession()")
    page.get_by_role("button", name="Открыть отчёт").wait_for()
    sibling.goto(link)
    page.wait_for_function("() => StudentMemory.groups().some(group => group.tabs === 2)")
    end_button(page).click()
    page.get_by_role("button", name="Закончить везде (2 вкладки)").click()
    sibling.wait_for_function("() => StudentMemory.current() === null")
    expect(page.get_by_role("button", name="Открыть отчёт")).to_have_count(1)
    page.get_by_role("button", name="Открыть отчёт").click()
    expect(panel.get_by_role("button", name="Убрать тему: ОГЭ №6")).to_be_visible()
    assert page.evaluate("""() => Object.keys(localStorage).filter(key => key.includes(':report:'))
        .map(key => JSON.parse(localStorage.getItem(key)).lessonId)""") == ["урок-из-расписания"]
    ctx.close()
    print("✓ Выход из одной вкладки, завершение совместного доступа, отчёт во время урока и один отчёт на сессию.")


def check_mobile(browser):
    ctx = new_context(browser)
    page, errors = board_fixture.open_board(ctx)
    page.set_viewport_size({"width": 390, "height": 700})
    page.evaluate("document.documentElement.setAttribute('data-theme', 'dark')")
    start(page)
    page.locator('#smBar [data-sm="report"]').click()
    panel = report_panel(page)
    choose(panel, "По классам")
    panel.get_by_role("combobox", name="Класс").select_option("8")
    panel.get_by_role("searchbox").fill("пифагор")
    choose(panel, "Теорема Пифагора")
    bounds = panel.bounding_box()
    assert bounds["x"] >= 0 and bounds["x"] + bounds["width"] <= 390
    assert bounds["y"] > 0 and bounds["y"] + bounds["height"] < 700
    rail = page.locator("#bdRail").bounding_box()
    assert bounds["x"] >= rail["x"] + rail["width"]
    custom = panel.get_by_role("textbox", name="Название своей темы")
    custom.fill("Незаконченная тема")
    shot(page, "mobile.png")
    choose(panel, "Свернуть")
    page.get_by_role("button", name="Отчёт · Ваня").click()
    expect(custom).to_have_value("Незаконченная тема")
    choose(panel, "Свернуть")
    page.locator(".lr-panel.lr-minimized").get_by_role("button", name="Закрыть").click()
    expect(page.locator(".lr-panel")).to_be_hidden()
    assert not errors, errors
    page.goto(f"{BASE}/index.html?s=ABCD2222")
    expect(page.locator(".lr-dock")).to_have_count(0)
    ctx.close()
    print("✓ Узкий экран, тёмная тема, сворачивание, закрытие и отсутствие отчёта у ученика.")


def check_other_end_routes(browser):
    ctx = new_context(browser, bind="browser")
    notes = ctx.new_page()
    notes.goto(f"{BASE}/oge11.html")
    now = datetime.now(timezone.utc)
    notes.clock.set_fixed_time(now)
    start(notes)
    notes.evaluate("NotesStore.startNew()")
    notes.clock.set_fixed_time(now + timedelta(seconds=11))
    notes.locator("#lnBtn").click()
    notes.locator('#lnPop [data-act="end"]').click()
    expect(notes.get_by_role("button", name="Заполнить отчёт")).to_be_visible()
    assert notes.evaluate("StudentMemory.current().id") == VANYA

    tire = ctx.new_page()
    tire.clock.set_fixed_time(now + timedelta(seconds=11))
    tire.goto(f"{BASE}/tire3d.html")
    tire.wait_for_function("() => !!TrainerSession.getCode() && !!StudentMemory.reportOwner()")
    assert tire.evaluate("TrainerSession.endSession()")
    expect(tire.get_by_role("button", name="Заполнить отчёт")).to_be_visible()
    ctx.close()
    print("✓ Кнопка завершения в конспекте и завершение доступа на странице 3D-шины.")


if __name__ == "__main__":
    handler = partial(QuietHandler, directory=Path(__file__).resolve().parent)
    with ThreadingHTTPServer(("127.0.0.1", 0), handler) as server, sync_playwright() as playwright:
        BASE = board_fixture.BASE = f"http://127.0.0.1:{server.server_port}"
        Thread(target=server.serve_forever, daemon=True).start()
        try:
            browser = playwright.chromium.launch()
            check_board_and_history(browser)
            check_tab_groups(browser)
            check_mobile(browser)
            check_other_end_routes(browser)
            browser.close()
        finally:
            server.shutdown()
