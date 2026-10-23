"""
Промпт №99: импорт PDF (deck-io.js, pdf.js; HANDOFF.md раздел 6г).

Файл — test-files/deck_import.pdf: лист самостоятельной работы А4 (заголовок
по центру, курсив, жирное «Задание 1.» с длинным абзацем в несколько строк,
таблица, красная строка).

Проверяем:
  1. Окно: «1 страница», размер 21 × 29,7 см; диапазон страниц
  2. «Полностью»: слайд А4 (42 × 59,4 клетки), подложка — страница без
     текста (закреплённая картинка), поверх — текстовые блоки
  3. Заголовок по центру, крупнее остального; «Тема…» курсивом
  4. «Задание 1. Решите…» — один абзац из нескольких строк PDF, «Задание 1.»
     жирным, остальное обычным
  5. «Внимание:» красным и жирным, дальше красным
  6. Ячейки строки таблицы — отдельными блоками, а не одной строкой
  7. Под текстом на подложке букв нет (их рисуют блоки)
  8. «Картинками» — на слайде одна подложка, блоков нет
  9. Нет ошибок на странице

Запуск: python3 test_prompt99_deck_pdf_import.py
"""
import os
import sys

from playwright.sync_api import sync_playwright

import test_prompt84_deck_slides as T
from test_prompt98_deck_import import do_import, SLIDE

T.PORT = 8999
T.BASE = f"http://127.0.0.1:{T.PORT}"
HERE = os.path.dirname(os.path.abspath(__file__))
PDF = os.path.join(HERE, "test-files", "deck_import.pdf")
fails = []


def check(cond, msg, extra=""):
    print(("OK   " if cond else "FAIL ") + msg + (f"  [{extra}]" if extra and not cond else ""))
    if not cond:
        fails.append(msg)


def main():
    errors = []
    with T.local_server(), sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page(viewport={"width": 1400, "height": 900})
        page.on("pageerror", lambda e: errors.append(str(e)))
        page.goto(T.BASE + "/boards.html")
        page.evaluate(T.BOOT_JS)
        page.click("#blCreateDeck")
        page.wait_for_function("() => B && B.kind === 'deck' && boardActive")
        page.evaluate("() => deckIoEnsure()")

        print("1–2. Импорт «полностью»")
        info = do_import(page, PDF)
        check("1 страница" in info and "21 × 29,7" in info, "окно: 1 страница А4", info)
        sl = page.evaluate("() => deckSlides().map(s => [s.w, s.h, s.bg && s.bg.k])")
        check(len(sl) == 1 and abs(sl[0][0] - 42) < 0.1 and abs(sl[0][1] - 59.4) < 0.1, "слайд А4", str(sl))
        objs = page.evaluate(SLIDE, 0)
        bg = [o for o in objs if o.get("bgOf")]
        boxes = [o for o in objs if o["type"] == "box"]
        check(len(bg) == 1 and bg[0]["locked"], "подложка — закреплённая картинка страницы")
        check(len(boxes) >= 8, "текстовые блоки", str(len(boxes)))
        texts = [o["plain"] for o in boxes]
        print("       блоки:", texts)

        print("3. Заголовок и тема")
        h = next((o for o in boxes if o["plain"].startswith("Самостоятельная работа")), None)
        check(h is not None, "заголовок")
        sizes = [r["sz"] for o in boxes for pp in o["text"]["paras"] for r in pp["runs"]]
        if h:
            hs = h["text"]["paras"][0]["runs"][0]["sz"]
            check(hs == max(sizes), "заголовок — самый крупный", f"{hs} / {max(sizes)}")
            mid = h["x"] + h["w"] / 2
            check(abs(mid - sl[0][0] * 24 / 2) < 40, "заголовок посередине страницы", str(mid))
        th = next((o for o in boxes if o["plain"].startswith("Тема:")), None)
        check(th is not None and th["text"]["paras"][0]["runs"][0].get("i"), "«Тема…» курсивом")

        print("4. Абзац из нескольких строк")
        z1 = next((o for o in boxes if o["plain"].startswith("Задание 1.")), None)
        check(z1 is not None, "блок «Задание 1.»", str(texts))
        if z1:
            check("при импорте" in z1["plain"] and "\n" not in z1["plain"], "строки PDF склеены в один абзац", z1["plain"])
            r = z1["text"]["paras"][0]["runs"]
            check(r[0]["t"].startswith("Задание 1.") and r[0].get("b"), "«Задание 1.» жирным", str(r[:2]))
            check(len(r) > 1 and not r[1].get("b"), "дальше обычным")
            check(z1["text"].get("fit") == "shrink", "блок ужимает текст, если не влезет")

        print("5. Красная строка")
        w = next((o for o in boxes if o["plain"].startswith("Внимание:")), None)
        check(w is not None, "блок «Внимание»")
        if w:
            r = w["text"]["paras"][0]["runs"]
            check(r[0]["c"] == "#C00000" and r[0].get("b"), "«Внимание:» красным жирным", str(r[0]))
            check(all(x["c"] == "#C00000" for x in r), "вся строка красная", str([x["c"] for x in r]))

        print("6. Ячейки таблицы")
        cells = [t for t in texts if t in ("−2", "−1", "0", "1")]
        check(len(cells) == 4, "−2, −1, 0, 1 — четыре блока", str([t for t in texts if "−" in t or t in ("0", "1")]))

        print("7. Подложка без букв")
        page.wait_for_timeout(500)
        dark = page.evaluate("""(id) => { const o = B.objects.find(x => x.id === id); const im = getImg(o.src);
          const cv = document.createElement('canvas'); cv.width = im.naturalWidth; cv.height = im.naturalHeight; const c = cv.getContext('2d'); c.drawImage(im, 0, 0);
          // полоса, где на странице заголовок (верхняя пятая часть)
          const d = c.getImageData(0, Math.round(cv.height * 0.02), cv.width, Math.round(cv.height * 0.08)).data; let n = 0;
          for (let i = 0; i < d.length; i += 4) if (d[i] + d[i + 1] + d[i + 2] < 300) n++; return n; }""", bg[0]["id"]) if bg else -1
        check(dark == 0, "на месте заголовка на подложке пусто", str(dark))

        print("8. Картинками")
        do_import(page, PDF, mode="img")
        objs = page.evaluate("() => B.objects.filter(o => o.type !== 'deck').map(o => [o.type, !!o.bgOf])")
        check(objs == [["image", True]], "одна подложка, блоков нет", str(objs))

        check(not errors, "нет ошибок на странице", " | ".join(errors[:3]))
        browser.close()
    print()
    if fails:
        print("ПРОВАЛЫ:")
        for f in fails:
            print(" -", f)
        sys.exit(1)
    print("ВСЁ ПРОШЛО")


if __name__ == "__main__":
    main()
