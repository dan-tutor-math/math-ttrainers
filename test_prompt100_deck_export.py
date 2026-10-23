"""
Промпт №100: выгрузка презентации в PPTX и PDF (deck-io.js, pptxgenjs,
jsPDF; HANDOFF.md раздел 6г).

Берём test-files/deck_import.pptx (импорт проверен в №98), на первом слайде
дописываем пометку пером, и выгружаем.

Проверяем:
  1. PPTX «с пометками»: 6 слайдов, размер слайда как в исходном (16:9),
     тексты на месте, у каждого абзаца ровно один <a:pPr> и он первый
     (pptxgenjs пишет его перед каждым куском — чиним), маркеры списка,
     градиент фигуры, заметки докладчика, пометка пером — картинкой
  2. PPTX «только заготовка» — без картинки пометки
  3. Обратно: выгруженный PPTX снова импортируется — 6 слайдов, тексты,
     таблица 4 × 3
  4. PDF: страниц столько же, сколько слайдов, страница 16:9 (960 × 540 пт)
  5. Кнопка «PDF» в таблетке презентации открывает выгрузку по слайдам
  6. Нет ошибок на странице

Запуск: python3 test_prompt100_deck_export.py
"""
import io
import os
import re
import sys
import zipfile

from playwright.sync_api import sync_playwright

import test_prompt84_deck_slides as T
from test_prompt98_deck_import import do_import, SLIDE

T.PORT = 9000
T.BASE = f"http://127.0.0.1:{T.PORT}"
HERE = os.path.dirname(os.path.abspath(__file__))
PPTX = os.path.join(HERE, "test-files", "deck_import.pptx")
fails = []


def check(cond, msg, extra=""):
    print(("OK   " if cond else "FAIL ") + msg + (f"  [{extra}]" if extra and not cond else ""))
    if not cond:
        fails.append(msg)


def export(page, kind, base=False, via_pill=False):
    if via_pill:
        page.click("#railPdf")
    else:
        page.click("#deckFileBtn")
        page.click(f"#deckFileMenu [data-file='{kind}']")
    page.wait_for_selector(".io-dlg:not([hidden])", timeout=20000)
    page.check("input[name='ioEx'][value='" + ("base" if base else "all") + "']")
    with page.expect_download(timeout=120000) as dl:
        page.click("#ioGo")
    path = dl.value.path()
    with open(path, "rb") as f:
        return f.read(), dl.value.suggested_filename


def main():
    errors = []
    tmp = os.path.join(HERE, "__pycache__")
    os.makedirs(tmp, exist_ok=True)
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
        # пометка — в режиме «Урок» (в «Конструкторе» всё новое — заготовка)
        page.evaluate("""() => { deckSetMode('lesson'); deckGo(0); const r = deckSlideRect(deckCur());
          B.objects.push({ id: 'note1', type: 'pen', color: '#C00000', width: 6, points: [{ x: r.x + 100, y: r.y + 500 }, { x: r.x + 400, y: r.y + 560 }, { x: r.x + 700, y: r.y + 500 }] }); saveDB(); }""")

        print("1. PPTX с пометками")
        data, name = export(page, "pptx")
        check(name.endswith(".pptx"), "имя файла .pptx", name)
        z = zipfile.ZipFile(io.BytesIO(data))
        slides = sorted(n for n in z.namelist() if re.match(r"ppt/slides/slide\d+\.xml$", n))
        check(len(slides) == 6, "6 слайдов", str(len(slides)))
        pres = z.read("ppt/presentation.xml").decode()
        m = re.search(r'<p:sldSz cx="(\d+)" cy="(\d+)"', pres)
        check(m and abs(int(m.group(1)) / int(m.group(2)) - 16 / 9) < 0.01, "размер слайда 16:9", m and m.group(0))
        xml = {n: z.read(n).decode() for n in slides}
        allx = "".join(xml.values())
        for t in ("Квадратные уравнения", "План урока", "Важно: ", "Прямоугольник", "Таблица значений", "Прижато к низу"):
            check(t in allx, "текст «" + t + "»")
        bad = 0
        for x in xml.values():
            for para in re.findall(r"<a:p>(.*?)</a:p>", x, re.S):
                n = para.count("<a:pPr")
                if n > 1 or (n == 1 and not para.startswith("<a:pPr")):
                    bad += 1
        check(bad == 0, "у каждого абзаца не больше одного <a:pPr>, и он первый", str(bad))
        s2 = xml["ppt/slides/slide2.xml"]
        check(s2.count("<a:buChar") >= 4, "маркеры списка", str(s2.count("<a:buChar")))
        check("<a:gradFill" in xml["ppt/slides/slide3.xml"], "градиент фигуры сохранён")
        notes = [n for n in z.namelist() if n.startswith("ppt/notesSlides/") and n.endswith(".xml")]
        check(any("Спросить Петю" in z.read(n).decode() for n in notes), "заметки докладчика")
        pics1 = xml["ppt/slides/slide1.xml"].count("<p:pic>")
        check(pics1 >= 1, "пометка пером — картинкой на первом слайде", str(pics1))
        out = os.path.join(tmp, "export_check.pptx")
        with open(out, "wb") as f:
            f.write(data)

        print("2. Только заготовка")
        data2, _ = export(page, "pptx", base=True)
        z2 = zipfile.ZipFile(io.BytesIO(data2))
        check(z2.read("ppt/slides/slide1.xml").decode().count("<p:pic>") == 0, "без пометок — картинки пера нет")

        print("3. Обратно в презентацию")
        do_import(page, out)
        sl = page.evaluate("() => deckSlides().length")
        check(sl == 6, "6 слайдов после повторного импорта", str(sl))
        plain = page.evaluate("() => B.objects.filter(o => o.type === 'box').map(o => bxPlainText(o.text)).join('|')")
        check("Квадратные уравнения" in plain and "План урока" in plain and "Прижато к низу" in plain, "тексты вернулись", plain[:200])
        tb = page.evaluate("() => { const t = B.objects.find(o => o.type === 'table'); return t ? [t.cells.length, t.cells[0].length] : null; }")
        check(tb == [4, 3], "таблица 4 × 3", str(tb))
        bul = page.evaluate("() => B.objects.filter(o => o.type === 'box' && o.text && o.text.paras.some(p => p.bu)).length")
        check(bul >= 1, "маркеры вернулись", str(bul))

        print("4. PDF")
        pdf, name = export(page, "pdf")
        check(name.endswith(".pdf"), "имя файла .pdf", name)
        pages = len(re.findall(rb"/Type\s*/Page[^s]", pdf))
        check(pages == 6, "6 страниц", str(pages))
        mb = re.search(rb"/MediaBox\s*\[\s*0\s+0\s+([\d.]+)\s+([\d.]+)\s*\]", pdf)
        check(mb and abs(float(mb.group(1)) - 960) < 2 and abs(float(mb.group(2)) - 540) < 2, "страница 960 × 540 пт", mb and mb.group(0))

        print("5. Кнопка «PDF» в таблетке")
        pdf2, _ = export(page, "pdf", via_pill=True)
        check(len(re.findall(rb"/Type\s*/Page[^s]", pdf2)) == 6, "та же выгрузка по слайдам")

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
