"""Библиотека на доске, материалы ученика и отдельное хранилище файлов."""

from hashlib import sha256
import json
from pathlib import Path

from playwright.sync_api import expect, sync_playwright

import test_prompt_rus_board_check as board_support
from test_prompt_b3_board_memory import STUB_JS, VANYA, PETYA


PROFILE_PDF = "reference-pdf/ege-math-profile-2027.pdf"
PROFILE_SHA = "e08ff193109ae29b7acc010c654716c8b15411a5387bbb2822ae961c62918e9c"
MATH = '[data-material="oge-math-2027-reference"]'
PHYSICS = '[data-material="oge-physics-2027-reference"]'
ROOT = Path(__file__).resolve().parent


def check_catalog_assets(page):
    catalog = json.loads((ROOT / "reference-catalog.json").read_text())
    rows = [material for subject in catalog for exam in subject["exams"] for material in exam["materials"]]
    assert len(catalog) == 6 and len(rows) == 12
    assert len({row["id"] for row in rows}) == len(rows)
    for row in rows:
        if "pdf" in row:
            response = page.request.get(f'{board_support.BASE}/{row["pdf"]}')
            assert response.ok and response.body().startswith(b"%PDF-"), row["id"]
        for image in row.get("pages", []):
            response = page.request.get(f'{board_support.BASE}/{image["src"]}')
            assert response.ok and response.headers["content-type"] == "image/webp", row["id"]


def assert_position(page, trigger, mobile=False):
    a, b = trigger.bounding_box(), page.locator("#lgMenuToggle").bounding_box()
    assert a["x"] + a["width"] <= b["x"] and a["y"] < b["y"] + b["height"], (a, b)
    for selector in ("#bdName", "#bdBasketBtn", "#bdTrainersToggle", "#bdGear", "#smBar"):
        other = page.locator(selector)
        rect = other.bounding_box() if other.count() else None
        if rect:
            overlap = (a["x"] < rect["x"] + rect["width"] and rect["x"] < a["x"] + a["width"]
                       and a["y"] < rect["y"] + rect["height"] and rect["y"] < a["y"] + a["height"])
            assert not overlap, (selector, a, rect)
    if mobile:
        assert page.evaluate("document.documentElement.scrollWidth <= innerWidth")


def reload_board(page):
    page.reload()
    page.evaluate(board_support.BOOT_JS)
    page.evaluate("boardsBootReady")
    if page.evaluate("!getCurrentBoard()"):
        page.evaluate("openBoard('bA')")
    page.wait_for_function("getCurrentBoard() && getCurrentBoard().id === 'bA'")


def show_student(page, student):
    page.evaluate("async student => { await StudentMemory.end(); await StudentMemory.start(student); }", student)


def upload(panel, filename, file, subject="Математика"):
    panel.get_by_role("button", name="Загрузить свой файл").click()
    panel.locator('input[name="file"]').set_input_files(file)
    panel.locator('input[name="title"]').fill(filename)
    panel.locator('input[name="subject"]').fill(subject)
    panel.get_by_role("button", name="Сохранить файл").click()


def check_profile_trainer(browser):
    for width, height, touch in ((1280, 820, False), (375, 812, True)):
        with browser.new_context(viewport={"width": width, "height": height}, is_mobile=touch, has_touch=touch) as context:
            context.route("https://**/*", lambda route: route.abort())
            page = context.new_page()
            errors = []
            page.on("pageerror", lambda error: errors.append(str(error)))
            href = f"{board_support.BASE}/ege_prof.html?n=12"
            page.goto(href, wait_until="domcontentloaded")
            trigger = page.get_by_role("button", name="Справочные материалы", exact=True)
            expect(trigger).to_be_visible()
            trigger.click()
            panel = page.get_by_role("dialog", name="Справочные материалы")
            expect(panel).to_be_visible()
            link = panel.get_by_role("link", name="Открыть полную демоверсию ЕГЭ-2027 (PDF)")
            expect(link).to_have_attribute("href", PROFILE_PDF)
            expect(link).to_have_attribute("target", "_blank")
            page.wait_for_function("document.querySelector('.rp-page img')?.naturalWidth >= 680")
            image = panel.locator(".rp-page")
            original_width = image.bounding_box()["width"]
            image.click()
            expect(image).to_have_attribute("aria-pressed", "true")
            assert image.bounding_box()["width"] > original_width
            if touch:
                assert panel.bounding_box() == {"x": 0, "y": 0, "width": width, "height": height}
                expect(link).to_be_in_viewport()
            response = page.request.get(f"{board_support.BASE}/{PROFILE_PDF}")
            assert response.ok and sha256(response.body()).hexdigest() == PROFILE_SHA
            panel.get_by_role("button", name="Закрыть справочные материалы").click()
            expect(trigger).to_be_focused()
            page.goto(href + "&card=1", wait_until="domcontentloaded")
            expect(page.locator("#egeProfReferenceToggle")).to_have_count(0)
            assert not errors, errors
    print("OK справка профильного ЕГЭ, формулы и подлинный PDF на компьютере и телефоне")


def test():
    with board_support.local_server(), sync_playwright() as playwright:
        browser = playwright.chromium.launch()
        with browser.new_context() as context:
            context.add_init_script(STUB_JS)
            page, errors = board_support.open_board(context)
            trigger = page.locator("#boardReferenceToggle")
            panel = page.get_by_role("dialog", name="Справочные материалы")
            close = panel.get_by_role("button", name="Закрыть справочные материалы")
            preview = panel.locator(".rl-preview")
            score = lambda: page.evaluate("JSON.stringify(getCurrentBoard())")
            before = score()

            assert_position(page, trigger)
            trigger.click()
            expect(panel.get_by_role("heading", name="Каталог материалов")).to_be_visible()
            expect(panel.locator(".rl-list h4")).to_have_count(6)
            panel.locator(MATH).click()
            page.wait_for_function("document.querySelector('.rl-preview img').naturalWidth > 0")
            expect(preview.locator(".rp-page img")).to_have_count(4)
            first = preview.locator(".rp-page").first
            width = first.bounding_box()["width"]
            first.click()
            assert first.bounding_box()["width"] > width
            panel.locator('[data-material="ege-math-profile-2027"]').click()
            expect(preview.get_by_role("link", name="Открыть демоверсию (PDF)")).to_have_attribute("href", PROFILE_PDF)
            expect(preview.locator("iframe")).to_have_attribute("src", PROFILE_PDF)
            search = panel.get_by_role("searchbox")
            search.fill("Физика")
            expect(panel.locator(".rl-list h4")).to_have_text(["Физика"])
            panel.locator(PHYSICS).click()
            expect(preview.locator(".rp-page img")).to_have_count(2)
            panel.locator('[data-material="oge-physics-2027"]').click()
            expect(preview.get_by_role("link", name="Открыть демоверсию (PDF)")).to_have_attribute("target", "_blank")
            check_catalog_assets(page)
            close.click()
            expect(panel).to_have_count(0)
            assert score() == before, "Просмотр изменил данные доски"
            print("OK каталог, поиск, изображения, PDF и положение кнопки")

            show_student(page, VANYA)
            trigger.click()
            expect(panel.get_by_role("heading", name="Для ученика: Ваня")).to_be_visible()
            add = panel.get_by_role("button", name="Добавить ещё материалы")
            done = panel.get_by_role("button", name="Готово", exact=True)
            math_checkbox = panel.get_by_role("checkbox", name="Справочные материалы ОГЭ 2027")
            add.click()
            math_checkbox.check()
            done.click()
            expect(panel.locator(MATH)).to_be_visible()
            page.keyboard.press("Escape")
            expect(panel).to_have_count(0)
            assert score() == before, "Подборка ученика изменила данные доски"

            reload_board(page)
            before = score()
            trigger.click()
            expect(panel.get_by_role("heading", name="Для ученика: Ваня")).to_be_visible()
            expect(panel.locator(MATH)).to_be_visible()
            close.click()
            show_student(page, PETYA)
            trigger.click()
            expect(panel.get_by_role("heading", name="Для ученика: Петя")).to_be_visible()
            expect(panel.locator(MATH)).to_have_count(0)
            close.click()
            show_student(page, VANYA)
            trigger.click()
            add.click()
            expect(math_checkbox).to_be_checked()
            math_checkbox.uncheck()
            done.click()
            expect(panel.locator(MATH)).to_have_count(0)
            close.click()
            assert page.evaluate("JSON.parse(localStorage.getItem('refLib:student:' + StudentMemory.current().id))") == []
            print("OK сохранение после перезагрузки, удаление из подборки и изоляция двух учеников")

            page.evaluate("StudentMemory.end()")
            trigger.click()
            upload(panel, "Неверный файл", {"name": "test.png", "mimeType": "image/png", "buffer": b"not an image"})
            expect(panel.get_by_role("status")).to_contain_text("Выберите PDF или изображение")
            panel.locator('input[name="file"]').evaluate("""input => {
                const transfer = new DataTransfer();
                transfer.items.add(new File([new ArrayBuffer(10 * 1024 * 1024 + 1)], 'large.png'));
                input.files = transfer.files;
            }""")
            panel.get_by_role("button", name="Сохранить файл").click()
            expect(panel.get_by_role("status")).to_contain_text("до 10 МБ")
            upload(panel, "Мой лист формул", ROOT / "reference-img/oge-math-2027-3.webp")
            expect(preview.get_by_role("heading", name="Мой лист формул")).to_be_visible()
            page.wait_for_function("document.querySelector('.rl-preview img').naturalWidth > 0")
            upload(panel, "Мой файл PDF", ROOT / "reference-pdf/ege-russian-2027.pdf", "Русский язык")
            expect(preview.get_by_role("link", name="Открыть PDF в новой вкладке")).to_be_visible()
            assert score() == before, "Загрузка файлов изменила данные доски"

            reload_board(page)
            before = score()
            trigger.click()
            personal_image = panel.locator(".rl-list").get_by_role("button", name="Мой лист формул", exact=False)
            personal_pdf = panel.locator(".rl-list").get_by_role("button", name="Мой файл PDF", exact=False)
            expect(personal_image).to_be_visible()
            expect(personal_pdf).to_be_visible()
            for control in (personal_image, personal_pdf):
                control.click()
                page.once("dialog", lambda confirmation: confirmation.dismiss())
                preview.get_by_role("button", name="Удалить файл").click()
                expect(control).to_be_visible()
                page.once("dialog", lambda confirmation: confirmation.accept())
                preview.get_by_role("button", name="Удалить файл").click()
                expect(control).to_have_count(0)
            assert score() == before, "Удаление файлов изменило данные доски"
            close.click()
            print("OK загрузка WebP и PDF, контроль типа и размера, хранение и подтверждение удаления")

            for width in (375, 320):
                page.set_viewport_size({"width": width, "height": 812})
                assert_position(page, trigger, mobile=True)
                trigger.click()
                assert panel.bounding_box() == {"x": 0, "y": 0, "width": width, "height": 812}
                close.click()
            trigger.click()
            page.evaluate("setBoardAccess('view', 'student')")
            expect(panel).to_have_count(0)
            expect(trigger).to_be_hidden()
            page.evaluate("setBoardAccess('own', 'student')")
            expect(trigger).to_be_hidden()
            page.evaluate("setBoardAccess('full', 'teacher')")
            expect(trigger).to_be_visible()
            page.evaluate("document.documentElement.classList.add('ts-follower')")
            expect(trigger).to_be_hidden()
            viewer = context.new_page()
            viewer.route("https://**/*", lambda route: route.abort())
            viewer.goto(f"{board_support.BASE}/boards.html?s=demo", wait_until="domcontentloaded")
            expect(viewer.locator("#boardReferenceToggle")).to_have_count(0)
            assert not errors, errors
            print("OK узкий экран, ограниченный доступ и режим ученика")
        check_profile_trainer(browser)
        browser.close()
    print("готово")


if __name__ == "__main__":
    test()
