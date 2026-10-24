"""
Промпт №106: выгрузка в PPTX презентации со слайдами разного размера
(deck-io.js; HANDOFF.md раздел 6г).

Было: размер PPTX брался с первого слайда — альбомная презентация с одним
книжным первым слайдом выгружалась вся книжной, а фон альбомных слайдов
растягивался на всю книжную страницу.

Проверяем:
  1. В окне выгрузки — выбор размера, по умолчанию у большинства слайдов
  2. PPTX по умолчанию — альбомный; книжный слайд вписан: фон страницы —
     тёмные поля, его фон — картинкой по его месту, пропорции книжные
  3. Альбомные слайды — фон на всю страницу, как раньше
  4. Выбрали книжный — файл книжный
  5. PDF: у каждой страницы размер своего слайда, выбора размера нет
  6. Все слайды одного размера — выбора размера нет
  7. Нет ошибок на странице

Запуск: python3 test_prompt106_deck_export_sizes.py
"""
import io
import re
import sys
import zipfile

from playwright.sync_api import sync_playwright

import test_prompt84_deck_slides as T

T.PORT = 8976
T.BASE = f"http://127.0.0.1:{T.PORT}"
fails = []


def check(cond, msg, extra=""):
    print(("OK   " if cond else "FAIL ") + msg + (f"  [{extra}]" if extra and not cond else ""))
    if not cond:
        fails.append(msg)


def open_export(page, kind):
    page.click("#deckFileBtn")
    page.click(f"#deckFileMenu [data-file='{kind}']")
    page.wait_for_selector(".io-dlg:not([hidden])", timeout=20000)


def download(page):
    with page.expect_download(timeout=120000) as dl:
        page.click("#ioGo")
    with open(dl.value.path(), "rb") as f:
        return f.read()


def sld_size(data):
    z = zipfile.ZipFile(io.BytesIO(data))
    m = re.search(r'<p:sldSz cx="(\d+)" cy="(\d+)"', z.read("ppt/presentation.xml").decode())
    return int(m.group(1)), int(m.group(2)), z


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
        # первый слайд книжный (А4), за ним три альбомных 16:9; у книжного —
        # тёмная заливка, чтобы по фону было видно, где он
        page.evaluate("""() => { for (let i = 0; i < 3; i++) deckAddSlide();
          const sl = deckSlides(); sl[0].w = 40; sl[0].h = 57; sl[0].bg = { k: 'fill', f: '#14213D' };
          sl.slice(1).forEach(s => { s.w = 64; s.h = 36; s.bg = { k: 'fill', f: '#FFFFFF' }; });
          saveDB(); deckGo(0, 0); }""")
        page.wait_for_timeout(300)
        page.evaluate("() => deckIoEnsure()")
        page.wait_for_function("() => typeof deckIoExportPptx === 'function'")

        print("1. Выбор размера")
        open_export(page, "pptx")
        check(page.is_visible("#ioSizeSec"), "в окне — размер слайдов")
        labels = page.evaluate("() => [...document.querySelectorAll('#ioSizeSec .io-opt span')].map(s => s.textContent)")
        check(len(labels) == 2 and labels[0].startswith("Альбомный 16:9") and "3 слайда" in labels[0] and labels[1].startswith("Книжный"), "два размера, альбомный первым", str(labels))
        check(page.is_checked("input[name='ioSize'][value='0']"), "по умолчанию — у большинства слайдов")
        check(not page.is_visible("#ioPagesSec") and not page.is_visible("input[name='ioWhere']"), "разделов импорта («Страницы», «Куда») в окне выгрузки нет")

        print("2. PPTX по умолчанию")
        data = download(page)
        cx, cy, z = sld_size(data)
        check(abs(cx / cy - 16 / 9) < 0.01, "файл альбомный 16:9", f"{cx}×{cy}")
        s1 = z.read("ppt/slides/slide1.xml").decode()
        check('1B1B1F' in s1, "у книжного слайда фон страницы — тёмные поля")
        rect = re.search(r'name="mx:bg".*?<a:off x="(\d+)" y="(\d+)"/><a:ext cx="(\d+)" cy="(\d+)"/>.*?<a:srgbClr val="([0-9A-F]+)"', s1, re.S)
        check(rect is not None, "его фон — прямоугольником по его месту")
        if rect:
            x, y, w, h, col = int(rect.group(1)), int(rect.group(2)), int(rect.group(3)), int(rect.group(4)), rect.group(5)
            check(abs(h / w - 57 / 40) < 0.02, "пропорции книжные", f"{w}×{h}")
            check(abs(h - cy) < cy * 0.01 and abs(x - (cx - w) / 2) < cx * 0.01, "вписан по высоте, по центру", f"x={x} w={w} cx={cx}")
            check(col == "14213D", "цвет его фона", col)
        s2 = z.read("ppt/slides/slide2.xml").decode()
        check("<p:bg>" in s2 and 'name="mx:bg"' not in s2, "у альбомного — обычный фон на всю страницу")
        page.wait_for_timeout(500)

        print("3. Выбрали книжный")
        open_export(page, "pptx")
        page.check("input[name='ioSize'][value='1']")
        cx2, cy2, _ = sld_size(download(page))
        check(abs(cy2 / cx2 - 57 / 40) < 0.01, "файл книжный", f"{cx2}×{cy2}")
        page.wait_for_timeout(500)

        print("4. PDF")
        open_export(page, "pdf")
        check(not page.is_visible("input[name='ioSize']"), "в PDF выбора размера нет")
        check("свой размер" in page.inner_text("#ioSizeSec") or "размер своего слайда" in page.inner_text("#ioSizeSec"), "подсказка про PDF")
        pdf = download(page)
        boxes = re.findall(rb"/MediaBox \[0 0 ([\d.]+) ([\d.]+)\]", pdf)
        kinds = [float(w) > float(h) for w, h in boxes]
        check(len(boxes) == 4 and kinds == [False, True, True, True], "страницы своих размеров", str(boxes))
        page.wait_for_timeout(500)

        print("5. Один размер")
        page.evaluate("() => { deckSlides()[0].w = 64; deckSlides()[0].h = 36; saveDB(); }")
        open_export(page, "pptx")
        check(not page.is_visible("#ioSizeSec"), "все слайды одного размера — выбора нет")
        page.click("#ioCancel")

        browser.close()
    check(not errors, "нет ошибок на странице", "; ".join(errors[:3]))
    print("\nИтог:", "всё хорошо" if not fails else f"{len(fails)} провал(ов)")
    sys.exit(1 if fails else 0)


if __name__ == "__main__":
    main()
