"""
«„импорт HTML“» (04.11.2026): импорт HTML-презентаций в презентацию
(deck-io.js ioImportHtml + deck-io-html-frame.js; HANDOFF.md раздел 6г).

Файлы собирает test-files/make_deck_import_html.py.

Проверяем:
  1. В меню «Файл» — «Импорт из PowerPoint, PDF или HTML…», поле файла
     принимает .html
  2. Своя презентация «как у ИИ» (слайды строит скрипт, видим .active),
     «полностью»: 3 слайда 16:9 (67,7 × 38,1 клетки), заметки докладчика;
     заголовок крупный, белый, по центру; на подложке на его месте букв нет
  3. Слайд 2: заголовок с анимацией появления виден; список — три надписи
     с маркером «•», «Частное» жирным, «Степень» курсивом; карточка —
     скруглённая фигура с заливкой и рамкой, текст внутри, степени верхним
     индексом; картинка и svg — картинками (svg со стилем из CSS-класса)
  4. Слайд 3: нумерованный список (второй пункт — с 2); скрипт презентации
     не дотянулся ни до доски, ни до её localStorage; кадр импорта убран
  5. «Картинками»: на каждом слайде одна подложка, объектов нет
  6. reveal.js: 3 слайда 960 × 700 (вертикальные — отдельными), «фрагмент»
     виден, заметка, фон слайда из data-background-color
  7. Marp: 2 слайда, заголовок своим цветом
  8. Страница без слайдов: режется по высоте, каждый абзац ровно один раз
  9. Сцена как у шаблона разборов (deck_import_stage.html): слайд — вся сцена
     1920 × 1080, приведённая к 16:9 PowerPoint (67,7 × 38,1 клетки);
     номер в фишке — свой у каждого слайда (листание клавишами); фишки и
     рамка камеры — фигурами на каждом слайде, а не только на первом;
     значок <use> — картинкой с цветом; пустой холст поверх кадра — не
     объект; пятно градиента на снимке светлое, а не серое; Unbounded —
     шрифт доски
 10. Нет ошибок на странице

Запуск: python3 test_prompt_deck_html_import.py
"""
import os
import sys

from playwright.sync_api import sync_playwright

import test_prompt84_deck_slides as T
from test_prompt98_deck_import import do_import, SLIDE

T.PORT = 8996
T.BASE = f"http://127.0.0.1:{T.PORT}"
HERE = os.path.dirname(os.path.abspath(__file__))
F = lambda n: os.path.join(HERE, "test-files", n)
fails = []


def check(cond, msg, extra=""):
    print(("OK   " if cond else "FAIL ") + msg + (f"  [{extra}]" if extra and not cond else ""))
    if not cond:
        fails.append(msg)


def runs(o):
    return [r for p in o["text"]["paras"] for r in p["runs"]]


def boxes(objs):
    return [o for o in objs if o["type"] == "box" and o.get("text")]


def find(objs, start):
    return next((o for o in boxes(objs) if (o["plain"] or "").startswith(start)), None)


# цвет пикселя подложки слайда i в точке (доля ширины, доля высоты)
PIXEL = """([i, fx, fy]) => { const s = deckSlides()[i]; const o = B.objects.find(x => x.bgOf === s.id);
  const im = getImg(o.src); const cv = document.createElement('canvas'); cv.width = im.naturalWidth; cv.height = im.naturalHeight;
  const c = cv.getContext('2d'); c.drawImage(im, 0, 0); return [...c.getImageData(Math.round(cv.width * fx), Math.round(cv.height * fy), 1, 1).data].slice(0, 3); }"""
# сколько почти белых пикселей в полосе подложки (доли высоты y0..y1, середина по ширине)
WHITE = """([i, y0, y1]) => { const s = deckSlides()[i]; const o = B.objects.find(x => x.bgOf === s.id);
  const im = getImg(o.src); const cv = document.createElement('canvas'); cv.width = im.naturalWidth; cv.height = im.naturalHeight;
  const c = cv.getContext('2d'); c.drawImage(im, 0, 0);
  const d = c.getImageData(Math.round(cv.width * 0.3), Math.round(cv.height * y0), Math.round(cv.width * 0.4), Math.round(cv.height * (y1 - y0))).data;
  let n = 0; for (let k = 0; k < d.length; k += 4) if (d[k] > 220 && d[k + 1] > 220 && d[k + 2] > 220) n++; return n; }"""


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

        print("1. Меню")
        page.click("#deckFileBtn")
        lbl = page.inner_text("#deckFileMenu [data-file='import']")
        check("HTML" in lbl, "в меню «Импорт из PowerPoint, PDF или HTML…»", lbl)
        page.keyboard.press("Escape")
        acc = page.get_attribute("#deckImportFile", "accept")
        check(".html" in acc and ".pptx" in acc and ".pdf" in acc, "поле файла принимает .html", acc)
        page.evaluate("() => deckIoEnsure()")

        print("2. Своя презентация, «полностью»")
        info = do_import(page, F("deck_import_custom.html"))
        check("3 слайда" in info and "1280 × 720" in info, "окно: 3 слайда, 1280 × 720 px", info)
        check(page.inner_text("#ioPagesSec .deck-pop-h") == "Слайды", "диапазон подписан «Слайды»")
        sl = page.evaluate("() => deckSlides().map(s => [s.w, s.h, s.notes || ''])")
        check(len(sl) == 3 and all(abs(s[0] - 67.73) < 0.1 and abs(s[1] - 38.1) < 0.1 for s in sl), "3 слайда 16:9 в настоящем размере", str(sl))
        check(len(sl) == 3 and sl[1][2] == "Спросить про нулевую степень", "заметки докладчика — у слайда 2", str([s[2] for s in sl]))
        o0 = page.evaluate(SLIDE, 0)
        check(sum(1 for o in o0 if o.get("bgOf")) == 1, "у слайда подложка-картинка")
        h = find(o0, "Степени")
        check(h is not None, "заголовок «Степени»", str([o["plain"] for o in boxes(o0)]))
        if h:
            r = runs(h)[0]
            check(r["c"] == "#FFFFFF" and r.get("b"), "заголовок белый жирный", str(r))
            check(abs(r["sz"] - 64 * 0.75 * 2 * 24 * 2.54 / 72) < 0.5, "размер 64 px → 48 пт", str(r["sz"]))
            check(h["text"]["paras"][0].get("al") == "c", "по центру")
            check(abs(h["x"] + h["w"] / 2 - 67.733 * 24 / 2) < 30, "посередине слайда", str(h["x"] + h["w"] / 2))
        page.wait_for_timeout(400)
        white = page.evaluate(WHITE, [0, 0.38, 0.55])
        check(white < 20, "на подложке на месте заголовка букв нет", str(white))
        grad = page.evaluate(PIXEL, [0, 0.05, 0.05])
        check(grad[2] > 120 and grad[0] < 80, "фон-градиент остался на подложке", str(grad))

        print("3. Слайд 2")
        o1 = page.evaluate(SLIDE, 1)
        hd = find(o1, "Свойства степени")
        check(hd is not None and runs(hd)[0]["c"] == "#1E3A8A", "заголовок с анимацией появления виден, свой цвет", str([o["plain"] for o in boxes(o1)]))
        li = [find(o1, t) for t in ("Произведение", "Частное", "Степень степени")]
        check(all(li), "три пункта списка — отдельные надписи")
        if all(li):
            check(all(o["text"]["paras"][0].get("bu", {}).get("ch") == "•" for o in li), "у пунктов маркер «•»")
            check(runs(li[1])[0]["t"].startswith("Частное") and runs(li[1])[0].get("b") and not runs(li[1])[-1].get("b"), "«Частное» жирным, дальше обычным", str(runs(li[1])))
            check(runs(li[2])[0].get("i"), "«Степень» курсивом", str(runs(li[2])))
        card = find(o1, "Запомни")
        check(card is not None, "карточка «Запомни»")
        if card:
            check(card["geom"] == "roundRect" and card["fill"]["c"] == "#FFF3E0" and card["line"]["c"] == "#F57C00", "скруглённая фигура с заливкой и рамкой", str([card["geom"], card["fill"], card["line"]]))
            check(card["text"]["anchor"] == "m", "текст в карточке по середине высоты", card["text"]["anchor"])
            sups = [r for r in runs(card) if r.get("bl") == "sup"]
            check([r["t"] for r in sups] == ["m", "n", "m+n"], "степени — верхним индексом", str(runs(card)))
        imgs = [o for o in o1 if o["type"] == "image" and not o.get("bgOf")]
        check(len(imgs) == 2, "картинка и svg — две картинки", str(len(imgs)))
        svg = next((o for o in imgs if o["src"].startswith("data:image/svg")), None)
        check(svg is not None and "22%2C%20163%2C%2074" in svg["src"], "svg — со стилем из CSS-класса (зелёная заливка)", svg["src"][:200] if svg else "")
        red = next((o for o in imgs if o is not svg), None)
        if red:
            px = page.evaluate("""(id) => { const o = B.objects.find(x => x.id === id); const im = getImg(o.src);
              const cv = document.createElement('canvas'); cv.width = 4; cv.height = 4; const c = cv.getContext('2d'); c.drawImage(im, 0, 0, 4, 4); return [...c.getImageData(2, 2, 1, 1).data].slice(0, 3); }""", red["id"])
            check(px[0] > 200 and px[1] < 60, "картинка — та самая красная", str(px))

        print("4. Слайд 3 и изоляция")
        o2 = page.evaluate(SLIDE, 2)
        n2 = find(o2, "Найдите")
        check(n2 is not None and n2["text"]["paras"][0].get("bu", {}).get("num") == "arabicPeriod" and n2["text"]["paras"][0]["bu"].get("start") == 2, "нумерованный список, второй — с 2", str(n2["text"]["paras"][0].get("bu") if n2 else None))
        pr = find(o2, "Доступ к доске")
        check(pr is not None and pr["plain"] == "Доступ к доске: нет, хранилище: нет", "скрипт презентации не видит ни доску, ни её localStorage", pr["plain"] if pr else "")
        check(page.evaluate("() => document.querySelectorAll('iframe.io-html-frame').length") == 0, "кадр импорта убран")

        print("5. «Картинками»")
        do_import(page, F("deck_import_custom.html"), mode="img")
        objs = page.evaluate("() => B.objects.filter(o => o.type !== 'deck').map(o => [o.type, !!o.bgOf])")
        check(objs == [["image", True]] * 3, "по одной подложке на слайд, объектов нет", str(objs))
        title_white = page.evaluate(WHITE, [0, 0.38, 0.55])
        check(title_white > 100, "заголовок нарисован на снимке", str(title_white))

        print("6. reveal.js")
        info = do_import(page, F("deck_import_reveal.html"))
        check("3 слайда" in info and "960 × 700" in info, "окно: 3 слайда 960 × 700 (вертикальные — отдельно)", info)
        sl = page.evaluate("() => deckSlides().map(s => [s.w, s.h, s.notes || ''])")
        check(len(sl) == 3 and abs(sl[0][0] - 50.8) < 0.1, "размер слайда как в reveal.js", str(sl))
        check(len(sl) == 3 and sl[2][2] == "Заметка reveal", "заметка reveal — у своего слайда", str([s[2] for s in sl]))
        r1 = page.evaluate(SLIDE, 1)
        check(find(r1, "Появляется по щелчку") is not None, "«фрагмент» виден", str([o["plain"] for o in boxes(r1)]))
        page.wait_for_timeout(300)
        teal = page.evaluate(PIXEL, [0, 0.1, 0.1])
        check(abs(teal[0] - 0x0F) < 20 and abs(teal[1] - 0x76) < 20 and abs(teal[2] - 0x6E) < 20, "фон слайда из data-background-color", str(teal))

        print("7. Marp")
        info = do_import(page, F("deck_import_marp.html"))
        check("2 слайда" in info and "1280 × 720" in info, "окно: 2 слайда", info)
        m0 = page.evaluate(SLIDE, 0)
        mh = find(m0, "Первый слайд Marp")
        check(mh is not None and runs(mh)[0]["c"] == "#B91C1C", "заголовок Marp своим цветом", str([o["plain"] for o in boxes(m0)]))

        print("8. Страница без слайдов")
        info = do_import(page, F("deck_import_page.html"))
        check("разрезана" in info, "окно говорит, что страница разрезана", info)
        n = page.evaluate("() => deckSlides().length")
        texts = []
        for i in range(n):
            texts += [o["plain"] for o in boxes(page.evaluate(SLIDE, i))]
        nums = sorted(int(t.split(":")[0].split()[-1]) for t in texts if t.startswith("Абзац номер"))
        check(n >= 2 and nums == list(range(1, 41)), "каждый из 40 абзацев ровно один раз", f"{n} слайдов, {nums}")

        print("9. Сцена 1920 × 1080")
        info = do_import(page, F("deck_import_stage.html"))
        check("2 слайда" in info and "1920 × 1080" in info, "окно: 2 слайда, размер сцены", info)
        sl = page.evaluate("() => deckSlides().map(s => [s.w, s.h])")
        check(len(sl) == 2 and all(abs(a - 67.73) < 0.1 and abs(b - 38.1) < 0.1 for a, b in sl), "слайд — вся сцена, к 16:9 PowerPoint", str(sl))
        for i in (0, 1):
            o = page.evaluate(SLIDE, i)
            num = find(o, "Слайд ")
            check(num is not None and num["plain"] == f"Слайд {i + 1}" and num.get("fill"), f"слайд {i + 1}: фишка со своим номером и фоном", num["plain"] if num else str([b["plain"] for b in boxes(o)]))
            cam = [b for b in o if b["type"] == "box" and not b.get("text") and (b.get("fill") or {}).get("c") == "#FFFFFF" and b["h"] > 300]
            check(len(cam) == 1, f"слайд {i + 1}: рамка камеры — фигурой", str(len(cam)))
            imgs = [b for b in o if b["type"] == "image" and not b.get("bgOf")]
            check(len(imgs) == 1 and "0%2C%2076%2C%20153" in imgs[0]["src"] and imgs[0]["w"] < 60, f"слайд {i + 1}: значок <use> — синей картинкой, пустого холста нет", str([(b["w"], b["src"][:60]) for b in imgs]))
        do_import(page, F("deck_import_stage.html"), mode="img")
        page.wait_for_timeout(300)
        blob = page.evaluate(PIXEL, [0, 0.03, 0.03])
        check(sum(blob) > 640 and blob[2] > 235, "пятно градиента светлое, без серого", str(blob))
        check(page.evaluate("() => bxFace('Unbounded')") == "MX Unbounded" and "Unbounded" in page.evaluate("() => BX_FONT_MENU"), "Unbounded — свой шрифт доски и есть в списке")

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
