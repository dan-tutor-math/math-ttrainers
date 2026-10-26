"""
Меню «Ещё» в списке досок: «Выгрузить все доски», «Загрузить из файла»,
«Копии» и «Пересобрать хранилище» убраны из ряда кнопок в одно выпадающее
меню (кнопка со стрелкой вниз, не «⋯» — «⋯» уже есть в правом углу).

Проверяем:
  - в ряду этих четырёх кнопок не видно, видна кнопка «Ещё»;
  - щелчок открывает меню, в нём все четыре пункта, aria-expanded = true;
  - щелчок мимо и Escape закрывают меню;
  - пункты работают: «Выгрузить все доски» скачивает архив, «Копии»
    открывает окно копий, «Загрузить из файла» открывает выбор файла; после
    выбора пункта меню закрывается;
  - ход пересборки виден на кнопке «Ещё» (меню к этому времени закрыто).
"""
import sys

from test_prompt_boards_trash import local_server, BASE, sync_playwright, FAKE_SB_JS, BOOT_JS

ITEMS = ["blExportAll", "blImportBoard", "blSnapshots", "blRebuild"]


def main():
    failures = []

    def check(cond, name):
        print(("ok   " if cond else "FAIL ") + name)
        if not cond:
            failures.append(name)

    with local_server(), sync_playwright() as p:
        b = p.chromium.launch()
        ctx = b.new_context(viewport={"width": 1440, "height": 800}, accept_downloads=True)
        page = ctx.new_page()
        errors = []
        page.on("pageerror", lambda e: errors.append(str(e)))
        page.goto(f"{BASE}/boards.html")
        page.wait_for_timeout(500)
        page.evaluate(FAKE_SB_JS)
        page.evaluate(BOOT_JS)
        page.wait_for_selector("#blMoreBtn", state="visible")

        opened = lambda: page.evaluate("document.getElementById('blMorePop').classList.contains('open')")
        visible = lambda i: page.is_visible(f"#{i}")

        check(all(not visible(i) for i in ITEMS), "четыре редкие кнопки не видны в ряду")
        check("Ещё" in page.inner_text("#blMoreBtn"), "кнопка «Ещё» на месте")
        check(page.evaluate("document.getElementById('blMoreBtn').closest('.bl-head-actions') !== null"),
              "«Ещё» стоит в ряду кнопок шапки")

        page.click("#blMoreBtn")
        check(opened() and all(visible(i) for i in ITEMS), "меню открылось, в нём все четыре пункта")
        check(page.get_attribute("#blMoreBtn", "aria-expanded") == "true", "aria-expanded = true")
        page.mouse.click(700, 600)
        check(not opened(), "щелчок мимо закрывает меню")

        page.click("#blMoreBtn")
        page.keyboard.press("Escape")
        check(not opened() and page.get_attribute("#blMoreBtn", "aria-expanded") == "false", "Escape закрывает меню")

        # сортировка и «Ещё» не открыты одновременно
        page.click("#blMoreBtn")
        page.click("#blSortBtn")
        check(not opened(), "открытие сортировки закрывает «Ещё»")
        page.keyboard.press("Escape")
        page.mouse.click(700, 600)

        page.click("#blMoreBtn")
        with page.expect_download(timeout=10000) as dl:
            page.click("#blExportAll")
        check(dl.value.suggested_filename.endswith(".json"), "«Выгрузить все доски» скачивает архив")
        check(not opened(), "после выбора пункта меню закрылось")

        page.click("#blMoreBtn")
        with page.expect_file_chooser(timeout=5000) as fc:
            page.click("#blImportBoard")
        check(fc.value is not None, "«Загрузить из файла» открывает выбор файла")

        page.click("#blMoreBtn")
        page.click("#blSnapshots")
        page.wait_for_timeout(400)
        check(page.evaluate("""() => [...document.querySelectorAll('body *')].some(e =>
              /копи/i.test(e.textContent || '') && e.getBoundingClientRect().width > 200
              && getComputedStyle(e).position === 'fixed')"""), "«Копии» открывает окно копий")
        page.keyboard.press("Escape")

        page.evaluate("rebuildStatus('Копирую: 1 из 3')")
        check(page.inner_text("#blMoreLabel") == "Копирую: 1 из 3", "ход пересборки виден на кнопке «Ещё»")
        page.evaluate("rebuildStatus('')")
        check(page.inner_text("#blMoreLabel") == "Ещё", "после пересборки подпись снова «Ещё»")

        check(not errors, "ошибок JavaScript нет" + (f": {errors}" if errors else ""))
        b.close()

    print("\nИТОГ: " + ("всё прошло" if not failures else "ПРОВАЛЫ:\n - " + "\n - ".join(failures)))
    sys.exit(1 if failures else 0)


if __name__ == "__main__":
    main()
