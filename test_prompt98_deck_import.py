"""
Промпт №98: импорт PowerPoint (deck-io.js, HANDOFF.md раздел 6г).

Файл — test-files/deck_import.pptx (python-pptx, test-files/make_deck_import.py):
шесть слайдов 16:9 — титульный, список с уровнями, фигуры и группа,
таблица с объединением, повёрнутая обрезанная картинка на тёмном фоне,
оформление текста.

Проверяем:
  1. «Файл → Импорт»: окно с числом слайдов и размером, «Вместо всех» —
     ровно 6 слайдов настоящего размера (33,9 × 19,1 см = 67,7 × 38,1 клетки)
  2. Заполнители: заголовок и подзаголовок по месту макета, цвет подзаголовка
     из стиля макета (серый, tint в линейном RGB)
  3. Список: маркеры, второй уровень с отступом, жирный красный кусок и
     курсив в одном абзаце; заметки докладчика
  4. Фигуры: имена фигур PowerPoint, поворот звезды, градиент из стиля,
     белый текст стиля фигуры, соединительная прямая, группа — одна groupId
  5. Таблица: 4 × 3, объединение по вертикали, заголовок — заливка акцента
  6. Картинка: data:URL, поворот −8°, тёмный фон слайда — подложка «цвет»
  7. Текст: по центру и справа, Times New Roman, подчёркивание, интервал
     1,5, верхний индекс, прижим к низу
  8. Всё импортированное — заготовка (lay: 'base'); отмена убирает импорт
     одним шагом
  9. «Слайды картинками» — на слайдах только подложки-картинки
 10. «После текущего слайда» — новые слайды встают после текущего
 11. .ppt — подсказка сохранить как .pptx; нет ошибок на странице

Запуск: python3 test_prompt98_deck_import.py
"""
import os
import sys

from playwright.sync_api import sync_playwright

import test_prompt84_deck_slides as T

T.PORT = 8998
T.BASE = f"http://127.0.0.1:{T.PORT}"
HERE = os.path.dirname(os.path.abspath(__file__))
PPTX = os.path.join(HERE, "test-files", "deck_import.pptx")
fails = []


def check(cond, msg, extra=""):
    print(("OK   " if cond else "FAIL ") + msg + (f"  [{extra}]" if extra and not cond else ""))
    if not cond:
        fails.append(msg)


def do_import(page, path, mode="full", where="replace"):
    page.set_input_files("#deckImportFile", path)
    page.wait_for_selector(".io-dlg:not([hidden])", timeout=20000)
    info = page.inner_text("#ioInfo")
    page.check(f"input[name='ioMode'][value='{mode}']")
    page.check(f"input[name='ioWhere'][value='{where}']")
    page.click("#ioGo")
    page.wait_for_function("() => document.querySelector('.io-dlg').hidden", timeout=120000)
    page.wait_for_timeout(300)
    return info


# объекты слайда номер i (с нуля) в координатах слайда
SLIDE = """(i) => { const s = deckSlides()[i], r = deckSlideRect(s);
  return deckSlotObjects(s).map(o => Object.assign(JSON.parse(JSON.stringify(o)), { x: o.points[0].x - r.x, y: o.points[0].y - r.y, plain: o.text ? bxPlainText(o.text) : null })); }"""


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
        page.click("#deckFileBtn")
        check(page.is_visible("#deckFileMenu [data-file='import']"), "в меню «Файл» есть импорт")
        page.keyboard.press("Escape")
        page.evaluate("() => deckIoEnsure()")

        print("1. Импорт «полностью», вместо всех")
        info = do_import(page, PPTX)
        check("6 слайдов" in info and "33,9 × 19,1" in info, "окно: 6 слайдов, 33,9 × 19,1 см", info)
        sl = page.evaluate("() => deckSlides().map(s => [s.w, s.h, s.bg && s.bg.k, s.bg && s.bg.f])")
        check(len(sl) == 6, "6 слайдов", str(len(sl)))
        check(all(abs(s[0] - 67.73) < 0.05 and abs(s[1] - 38.1) < 0.05 for s in sl), "размер 67,7 × 38,1 клетки", str(sl[0]))
        check(page.inner_text("#deckNo").strip() == "1 / 6", "открыт первый слайд", page.inner_text("#deckNo"))

        print("2. Титульный")
        s0 = page.evaluate(SLIDE, 0)
        title = next((o for o in s0 if o.get("plain") == "Квадратные уравнения"), None)
        sub = next((o for o in s0 if o.get("plain") == "Урок 5 · 8 класс"), None)
        check(title is not None and sub is not None, "заголовок и подзаголовок", str([o.get("plain") for o in s0]))
        if title and sub:
            check(sub["y"] > title["y"], "подзаголовок ниже заголовка")
            c = sub["text"]["paras"][0]["runs"][0]["c"]
            check(c in ("#898989", "#8A8A8A", "#888888", "#898A89"), "цвет подзаголовка из стиля макета — серый", c)
            check(sub["text"]["paras"][0].get("al") == "c", "подзаголовок по центру")

        print("3. Список")
        s1 = page.evaluate(SLIDE, 1)
        body = next((o for o in s1 if o.get("plain", "") and o["plain"].startswith("Повторим")), None)
        check(body is not None, "блок списка", str([o.get("plain") for o in s1]))
        if body:
            ps = body["text"]["paras"]
            check(len(ps) == 4, "4 абзаца", str(len(ps)))
            check(all(pp.get("bu") for pp in ps), "у всех абзацев маркер", str([pp.get("bu") for pp in ps]))
            check(ps[1].get("lvl") == 1 and ps[1].get("ind", 0) > ps[0].get("ind", 0), "второй уровень с бо́льшим отступом", str([ps[0].get("ind"), ps[1].get("ind")]))
            r = ps[2]["runs"]
            check(r[0]["t"] == "Важно: " and r[0].get("b") and r[0]["c"] == "#C00000", "«Важно:» жирный красный", str(r))
            check(len(r) > 1 and r[1].get("i") and "4ac" in r[1]["t"], "формула курсивом", str(r))
        check(page.evaluate("() => deckSlides()[1].notes") == "Спросить Петю про формулу", "заметки докладчика")

        print("4. Фигуры")
        s2 = page.evaluate(SLIDE, 2)
        geoms = sorted(o.get("geom") for o in s2 if o["type"] == "box")
        for g in ("rect", "roundRect", "ellipse", "star5", "rightArrow", "wedgeRectCallout", "triangle", "diamond", "line"):
            check(g in geoms, "фигура " + g, str(geoms))
        star = next((o for o in s2 if o.get("geom") == "star5"), {})
        check(abs((star.get("rot") or 0) - 20) < 0.1, "звезда повёрнута на 20°", str(star.get("rot")))
        rect = next((o for o in s2 if o.get("plain") == "Прямоугольник"), {})
        check(bool(rect.get("fill", {}).get("g")), "градиент из стиля темы", str(rect.get("fill")))
        check(rect.get("text", {}).get("paras", [{}])[0].get("runs", [{}])[0].get("c") == "#FFFFFF", "текст фигуры белый (стиль фигуры)")
        green = next((o for o in s2 if o.get("plain") == "Скруглённый"), {})
        check((green.get("fill") or {}).get("c") == "#70AD47", "своя заливка зелёная", str(green.get("fill")))
        oval = next((o for o in s2 if o.get("geom") == "ellipse"), {})
        check((oval.get("line") or {}).get("c") == "#000000" and abs((oval.get("line") or {}).get("w", 0) / page.evaluate("() => bxPxPerPt()") - 3) < 0.05, "контур овала 3 пт чёрный", str(oval.get("line")))
        line = next((o for o in s2 if o.get("geom") == "line"), {})
        check((line.get("line") or {}).get("c") == "#C00000", "прямая красная", str(line.get("line")))
        grp = [o for o in s2 if o.get("geom") in ("triangle", "diamond")]
        check(len(grp) == 2 and grp[0].get("groupId") and grp[0].get("groupId") == grp[1].get("groupId"), "группа — общая groupId", str([o.get("groupId") for o in grp]))

        print("5. Таблица")
        s3 = page.evaluate(SLIDE, 3)
        tb = next((o for o in s3 if o["type"] == "table"), None)
        check(tb is not None, "таблица есть")
        if tb:
            check(len(tb["cells"]) == 4 and len(tb["cells"][0]) == 3, "4 × 3", f"{len(tb['cells'])}x{len(tb['cells'][0])}")
            check(tb["cells"][1][2].get("rs") == 3 and tb["cells"][2][2].get("vm") and tb["cells"][3][2].get("vm"), "объединение по вертикали", str([tb["cells"][r][2].get("rs") or tb["cells"][r][2].get("vm") for r in range(1, 4)]))
            check((tb["cells"][0][0].get("fill") or {}).get("c") == "#4F81BD", "заголовок — цвет акцента 1", str(tb["cells"][0][0].get("fill")))
            hdr = tb["cells"][0][1]["text"]["paras"][0]["runs"]
            check(hdr and hdr[0]["c"] == "#FFFFFF" and hdr[0].get("b"), "текст заголовка белый жирный", str(hdr))

        print("6. Картинка и фон")
        s4 = page.evaluate(SLIDE, 4)
        img = next((o for o in s4 if o["type"] == "image" and not o.get("bgOf")), None)
        check(img is not None and img["src"].startswith("data:image/"), "картинка data:URL")
        if img:
            check(abs((img.get("rot") or 0) + 8) < 0.1, "поворот −8°", str(img.get("rot")))
            # обрезанная по 10 % с боков картинка растянута на рамку, как в PowerPoint
            check(abs(img["natW"] / img["natH"] - img["w"] / img["h"]) < 0.02, "обрезанная картинка — в пропорциях рамки", f"{img['natW']}x{img['natH']} {img['w']}x{img['h']}")
        check(sl[4][2] == "fill" and sl[4][3] == "#1F2A44", "тёмный фон — подложка «цвет»", str(sl[4]))
        sup = [r for o in s4 if o.get("text") for pp in o["text"]["paras"] for r in pp["runs"] if r.get("bl") == "sup"]
        check(sup and sup[0]["t"] == "2", "верхний индекс")
        ink = page.evaluate("() => { deckGo(4); return new Promise(r => setTimeout(() => r(deckInkOnDark), 400)); }")
        check(ink is True, "на тёмном фоне перо светлое")

        print("7. Оформление текста")
        s5 = page.evaluate(SLIDE, 5)
        tbx = next((o for o in s5 if o.get("plain", "").startswith("По центру")), None)
        check(tbx is not None, "надпись с абзацами")
        if tbx:
            ps = tbx["text"]["paras"]
            check(ps[0].get("al") == "c" and ps[1].get("al") == "r", "по центру и справа")
            check(ps[1]["runs"][0]["f"] == "Arial" and ps[2]["runs"][0]["f"] == "Times New Roman", "шрифты Arial и Times New Roman", str([ps[1]["runs"][0]["f"], ps[2]["runs"][0]["f"]]))
            check(ps[2]["runs"][0].get("u"), "подчёркнутый")
            check(abs((ps[3].get("ls") or 0) - 1.5) < 0.01, "интервал 1,5", str(ps[3].get("ls")))
            check(abs(ps[0]["runs"][0]["sz"] / page.evaluate("() => bxPxPerPt()") - 40) < 0.05, "40 пт", str(ps[0]["runs"][0]["sz"]))
        low = next((o for o in s5 if o.get("plain") == "Прижато к низу"), {})
        check(low.get("text", {}).get("anchor") == "b", "прижим к низу")

        print("8. Заготовка и отмена")
        check(page.evaluate("() => B.objects.filter(o => o.type !== 'deck').every(o => o.lay === 'base')"), "всё импортированное — заготовка")
        page.evaluate("() => doUndo()")
        page.wait_for_timeout(300)
        check(page.evaluate("() => deckSlides().length") == 1 and page.evaluate("() => B.objects.filter(o => o.type !== 'deck').length") == 0, "отмена убрала импорт одним шагом")

        print("9. Слайды картинками")
        do_import(page, PPTX, mode="img")
        objs = page.evaluate("() => B.objects.filter(o => o.type !== 'deck').map(o => [o.type, !!o.bgOf])")
        check(len(objs) == 6 and all(t == "image" and bg for t, bg in objs), "только 6 подложек-картинок", str(objs[:8]))

        print("10. После текущего слайда")
        page.evaluate("() => deckGo(1)")
        page.wait_for_timeout(200)
        before = page.evaluate("() => deckSlides().map(s => s.id)")
        do_import(page, PPTX, mode="full", where="after")
        after = page.evaluate("() => deckSlides().map(s => s.id)")
        check(len(after) == 12 and after[:2] == before[:2] and after[8:] == before[2:], "6 новых встали после второго", f"{len(after)}")
        check(page.inner_text("#deckNo").strip() == "3 / 12", "открыт первый новый", page.inner_text("#deckNo"))

        print("11. Старый .ppt и ошибки")
        page.evaluate("""() => { const f = new File([new Uint8Array([1, 2, 3])], 'старая.ppt'); return deckIoImportFile(f); }""")
        page.wait_for_timeout(200)
        check("pptx" in page.inner_text("#deckToast"), "подсказка про .pptx", page.inner_text("#deckToast"))
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
