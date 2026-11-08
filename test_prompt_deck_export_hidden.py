"""
Выгрузка презентации пропускает скрытые слайды (slide.hide, deck-io.js).

Берём test-files/deck_import.pptx (6 слайдов), скрываем два и выгружаем.
Запуск: ~/.venvs/trainers/bin/python test_prompt_deck_export_hidden.py
"""
import io
import re
import sys
import zipfile

from playwright.sync_api import sync_playwright

import test_prompt84_deck_slides as T
from test_prompt98_deck_import import do_import
from test_prompt100_deck_export import export, PPTX

T.PORT = 9127
T.BASE = f"http://127.0.0.1:{T.PORT}"
fails = []


def check(cond, msg, extra=""):
    print(("OK   " if cond else "FAIL ") + msg + (f"  [{extra}]" if extra and not cond else ""))
    if not cond:
        fails.append(msg)


def main():
    errors = []
    with T.local_server(), sync_playwright() as p:
        browser = p.chromium.launch()
        ctx = browser.new_context(viewport={"width": 1400, "height": 900}, accept_downloads=True)
        page = ctx.new_page()
        page.on("pageerror", lambda e: errors.append(str(e)))
        page.goto(T.BASE + "/boards.html")
        page.evaluate(T.BOOT_JS)
        page.click("#blCreateDeck")
        page.wait_for_function("() => B && B.kind === 'deck' && boardActive")
        page.evaluate("() => deckIoEnsure()")
        do_import(page, PPTX)
        page.evaluate("() => { deckSlides()[1].hide = true; deckSlides()[3].hide = true; }")

        data, _ = export(page, "pptx")
        z = zipfile.ZipFile(io.BytesIO(data))
        slides = [n for n in z.namelist() if re.match(r"ppt/slides/slide\d+\.xml$", n)]
        check(len(slides) == 4, "PPTX: 4 слайда из 6", str(len(slides)))

        pdf, _ = export(page, "pdf")
        pages = len(re.findall(rb"/Type\s*/Page[^s]", pdf))
        check(pages == 4, "PDF: 4 страницы из 6", str(pages))

        page.evaluate("() => deckSlides().forEach(s => { s.hide = true; })")
        page.click("#deckFileBtn")
        page.click("#deckFileMenu [data-file='pdf']")
        page.wait_for_timeout(300)
        check("скрыты" in page.inner_text("#deckToast"), "все скрыты — подсказка")
        check(page.evaluate("() => document.querySelector('.io-dlg').hidden"), "все скрыты — окно выгрузки не открылось")
        browser.close()
    check(not errors, "нет ошибок на странице", "; ".join(errors[:3]))
    if fails:
        sys.exit(1)
    print("ГОТОВО")


if __name__ == "__main__":
    main()
