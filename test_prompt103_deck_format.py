"""
Промпт №103: оформление выделенного — в полосе презентации (deck-toolbar.js,
шаг 3 плана claude/presentations-toolbar-plan.md; HANDOFF.md раздел 6д).

Проверяем:
  1. Выделили блок — правая часть полосы становится оформлением: панель
     .bx-bar внутри #deckNav, не плавает; «Слайд», режимы, «Показ» спрятаны,
     листание осталось. Сняли выделение — полоса как была
  2. Кнопки оформления работают из полосы: Ж, выравнивание из выпадающего
     списка; список закрывается после выбора
  3. Правка текста: кнопки полосы не закрывают поле правки
  4. «Упорядочить»: на передний / задний план, вперёд / назад (через
     перекрывающий объект), объекты подложки остаются внизу
  5. Повернуть на 90°, отразить
  6. Выровнять по левому краю, распределить по горизонтали
  7. Сгруппировать / разгруппировать
  8. Быстрые стили: заливка, контур и цвет текста
     (каждое действие — один шаг отмены)
  9. На обычной доске панель оформления плавает, как раньше
 10. Нет ошибок на странице

Запуск: python3 test_prompt103_deck_format.py
"""
import sys

from playwright.sync_api import sync_playwright

import test_prompt84_deck_slides as T

T.PORT = 8973
T.BASE = f"http://127.0.0.1:{T.PORT}"
fails = []


def check(cond, msg, extra=""):
    print(("OK   " if cond else "FAIL ") + msg + (f"  [{extra}]" if extra and not cond else ""))
    if not cond:
        fails.append(msg)


VISIBLE = "(sel) => { const e = document.querySelector(sel); if (!e) return false; const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0 && getComputedStyle(e).visibility !== 'hidden' && getComputedStyle(e).display !== 'none'; }"
# три блока на текущем слайде: x — доля ширины слайда, у всех одна высота
ADD = """([geom, fx, fy, w, h, text]) => { const r = deckSlideRect(deckCur());
  const o = bxInsert(geom, { x: r.x + r.w * fx, y: r.y + r.h * fy });
  o.w = w; o.h = h; o.points = [{ x: r.x + r.w * fx - w / 2, y: r.y + r.h * fy - h / 2 }];
  if (text) o.text = bxTextOf(text, { sz: 24, c: '#1D1D1F' });
  saveDB(); if (typeof bxCloseEditor === 'function') bxCloseEditor(false); return o.id; }"""
SELECT = "(ids) => { if (ids.length === 1){ selectedId = ids[0]; multiSelectIds = []; } else { selectedId = null; multiSelectIds = ids.slice(); } scheduleRedraw(); }"
IDX = "(id) => B.objects.findIndex(o => o.id === id)"
OBJ = "(id) => JSON.parse(JSON.stringify(B.objects.find(o => o.id === id)))"


def select(page, ids):
    page.evaluate(SELECT, ids)
    page.wait_for_timeout(200)


def arrange(page, act):
    page.click("#deckArrangeBtn")
    page.click(f"#dtbPopArrange [data-arr='{act}']")
    page.wait_for_timeout(120)


def main():
    errors = []
    with T.local_server(), sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page(viewport={"width": 1400, "height": 900})
        page.on("pageerror", lambda e: errors.append(str(e)))
        page.goto(T.BASE + "/boards.html")
        page.evaluate(T.BOOT_JS)
        page.click("#blCreateDeck")
        page.wait_for_function("() => B && B.kind === 'deck' && boardActive && typeof deckTbSelTick === 'function'")
        page.wait_for_timeout(400)
        a = page.evaluate(ADD, ["rect", 0.3, 0.5, 300, 160, "Альфа"])
        b = page.evaluate(ADD, ["ellipse", 0.38, 0.55, 300, 160, ""])
        c = page.evaluate(ADD, ["rect", 0.75, 0.3, 200, 120, ""])
        select(page, [])

        print("1. Полоса в режиме оформления")
        check(not page.evaluate("() => document.getElementById('deckNav').classList.contains('dtb-fmt')"), "без выделения — обычная полоса")
        check(page.evaluate(VISIBLE, "#deckSlideBtn"), "видна «Слайд»")
        select(page, [a])
        check(page.evaluate("() => document.getElementById('deckNav').classList.contains('dtb-fmt')"), "выделили — режим оформления")
        check(page.evaluate("() => !!document.querySelector('#deckNav .bx-bar')"), "панель оформления — внутри полосы")
        check(page.evaluate(VISIBLE, "#deckNav .bx-bar [data-bx='b']"), "кнопка «Ж» видна в полосе")
        check(page.evaluate("() => getComputedStyle(document.querySelector('.bx-bar')).position") == "static", "панель не плавает")
        top1 = page.evaluate("() => document.querySelector('.bx-bar').getBoundingClientRect().top")
        for sel in ["#deckSlideBtn", "#deckModeSeg", "#deckFlowV", "#dtb-show"]:
            check(not page.evaluate(VISIBLE, sel), f"в режиме оформления {sel} спрятана")
        check(page.evaluate(VISIBLE, "#deckNo"), "номер слайда остался")
        check(page.evaluate(VISIBLE, "#deckArrangeBtn") and page.evaluate(VISIBLE, "#deckStylesBtn"), "«Упорядочить» и «Стили» видны")
        nb = page.evaluate("() => document.getElementById('deckNav').getBoundingClientRect().height")
        check(nb < 60, "полоса осталась в одну строку", str(nb))
        w = page.evaluate("() => document.getElementById('deckNav').getBoundingClientRect().right")
        check(w <= 1400 - 10, "полоса влезает в экран", str(w))
        check(page.evaluate(VISIBLE, "#deckLinesBtn") and page.evaluate(VISIBLE, "#dtb-task") and not page.evaluate(VISIBLE, "#dtbMoreBtn"),
              "на 1400 px вставка тоже видна целиком, без «⋯»")
        select(page, [c])
        top2 = page.evaluate("() => document.querySelector('.bx-bar').getBoundingClientRect().top")
        check(abs(top1 - top2) < 1, "у другого объекта панель на том же месте", f"{top1} {top2}")
        select(page, [])
        check(not page.evaluate("() => document.getElementById('deckNav').classList.contains('dtb-fmt')"), "сняли выделение — полоса как была")
        check(page.evaluate(VISIBLE, "#deckSlideBtn") and page.evaluate(VISIBLE, "#dtb-show"), "«Слайд» и «Показ» вернулись")
        check(not page.evaluate(VISIBLE, ".bx-bar"), "панели оформления не видно")

        print("2. Кнопки оформления")
        select(page, [a])
        page.click("#deckNav .bx-bar [data-bx='b']")
        check(page.evaluate("(id) => B.objects.find(o => o.id === id).text.paras.every(p => p.runs.every(r => r.b))", a), "«Ж» сделала текст жирным")
        check(not page.evaluate(VISIBLE, ".bx-bar [data-bx='al-c']"), "выравнивание спрятано в список")
        page.click(".bx-bar .dtb-dd[data-dd='al'] .dtb-dd-btn")
        check(page.evaluate(VISIBLE, ".bx-bar [data-bx='al-c']"), "список выравнивания открылся")
        check("По центру" in page.inner_text(".bx-bar .dtb-dd[data-dd='al'] .dtb-dd-menu"), "в списке подписи словами")
        page.click(".bx-bar [data-bx='al-c']")
        page.wait_for_timeout(100)
        check(page.evaluate("(id) => B.objects.find(o => o.id === id).text.paras.every(p => p.al === 'c')", a), "по центру")
        check(not page.evaluate(VISIBLE, ".bx-bar [data-bx='al-c']"), "список закрылся")
        check(page.evaluate(VISIBLE, ".bx-bar [data-bx='fill'] svg"), "заливка — значком")

        print("3. Правка текста")
        select(page, [a])
        page.evaluate("(id) => bxOpenEditor(B.objects.find(o => o.id === id))", a)
        page.wait_for_selector(".bx-ed")
        page.keyboard.press("End")
        page.keyboard.type("!")
        page.click(".bx-bar .dtb-dd[data-dd='list'] .dtb-dd-btn")
        check(page.evaluate("() => !!bxEd"), "щелчок по списку в полосе не закрыл поле правки")
        page.click(".bx-bar .dtb-dd[data-dd='list'] .dtb-dd-btn")
        # «Упорядочить» и «Стили» меняют сам объект — правку текста они
        # сохраняют и закрывают (board-boxes.js), выделение остаётся
        page.click("#deckArrangeBtn")
        check(not page.evaluate("() => !!bxEd") and page.evaluate("() => selectedId") == a, "«Упорядочить» сохранил правку, блок выделен")
        page.click("#deckArrangeBtn")
        page.wait_for_timeout(150)
        check(page.evaluate("(id) => B.objects.find(o => o.id === id).text.paras.map(p => p.runs.map(r => r.t).join('')).join('')", a).endswith("!"), "набранное сохранилось")

        print("4. Порядок")
        select(page, [a])
        n0 = page.evaluate("() => B.objects.length")
        arrange(page, "front")
        check(page.evaluate(IDX, a) == n0 - 1, "на передний план — последний")
        arrange(page, "back")
        floor = page.evaluate("() => { let k = 0; B.objects.forEach((o, i) => { if (o.type === 'deck' || o.bgOf) k = i + 1; }); return k; }")
        check(page.evaluate(IDX, a) == floor, "на задний план — сразу над подложкой", f"{page.evaluate(IDX, a)} vs {floor}")
        check(page.evaluate("() => B.objects[0].type") == "deck", "служебный объект слайдов — первый")
        # a и b перекрываются, c — в стороне
        arrange(page, "forward")
        ia, ib, ic = page.evaluate(IDX, a), page.evaluate(IDX, b), page.evaluate(IDX, c)
        check(ia == ib + 1, "вперёд — сразу над перекрывающим b", f"{ia} {ib} {ic}")
        page.click("#deckArrangeBtn")
        page.click("#dtbPopArrange [data-arr='forward']")
        page.wait_for_timeout(150)
        check("Выше" in page.inner_text("#deckToast"), "выше перекрывающих нет — подсказка")
        arrange(page, "backward")
        check(page.evaluate(IDX, a) < page.evaluate(IDX, b), "назад — под b")
        page.click("#undoBtn")
        page.wait_for_timeout(120)
        check(page.evaluate(IDX, a) == page.evaluate(IDX, b) + 1, "отмена — один шаг")

        print("5. Поворот и отражение")
        select(page, [b])
        arrange(page, "rotr")
        check(page.evaluate(OBJ, b).get("rot") == 90, "вправо на 90°")
        arrange(page, "rotl")
        check(not page.evaluate(OBJ, b).get("rot"), "влево — снова 0")
        arrange(page, "flipH")
        check(page.evaluate(OBJ, b).get("flipH") is True, "отражение слева направо")
        page.click("#undoBtn")
        page.wait_for_timeout(120)
        check(not page.evaluate(OBJ, b).get("flipH"), "отмена отражения")

        print("6. Выравнивание")
        select(page, [a, b, c])
        page.click("#deckArrangeBtn")
        check(not page.evaluate("() => document.querySelector('#dtbPopArrange [data-arr=\"al-l\"]').disabled"), "с тремя объектами выравнивание доступно")
        page.click("#deckArrangeBtn")  # Esc сняло бы выделение — закрываем той же кнопкой
        arrange(page, "al-l")
        xs = page.evaluate("(ids) => ids.map(id => objectBBox(B.objects.find(o => o.id === id)).minX)", [a, b, c])
        check(max(xs) - min(xs) < 0.5, "по левому краю", str(xs))
        page.click("#undoBtn")
        page.wait_for_timeout(120)
        xs2 = page.evaluate("(ids) => ids.map(id => objectBBox(B.objects.find(o => o.id === id)).minX)", [a, b, c])
        check(max(xs2) - min(xs2) > 10, "отмена вернула места")
        select(page, [a, b, c])  # отмена снимает выделение
        arrange(page, "dist-h")
        bb = page.evaluate("(ids) => ids.map(id => { const b = objectBBox(B.objects.find(o => o.id === id)); return [b.minX, b.maxX]; }).sort((p, q) => p[0] - q[0])", [a, b, c])
        g1, g2 = bb[1][0] - bb[0][1], bb[2][0] - bb[1][1]
        check(abs(g1 - g2) < 0.5, "распределено по горизонтали — промежутки равны", f"{g1:.1f} {g2:.1f}")
        select(page, [a])
        page.click("#deckArrangeBtn")
        check(page.evaluate("() => document.querySelector('#dtbPopArrange [data-arr=\"al-l\"]').disabled"), "с одним объектом выравнивание погашено")
        page.keyboard.press("Escape")

        print("7. Группа")
        select(page, [a, c])
        arrange(page, "group")
        ga, gc = page.evaluate(OBJ, a).get("groupId"), page.evaluate(OBJ, c).get("groupId")
        check(ga and ga == gc, "сгруппировали")
        arrange(page, "ungroup")
        check(not page.evaluate(OBJ, a).get("groupId") and not page.evaluate(OBJ, c).get("groupId"), "разгруппировали")

        print("8. Быстрые стили")
        select(page, [a])
        page.click("#deckStylesBtn")
        check(page.evaluate("() => document.querySelectorAll('#dtbPopStyles [data-arr]').length") == 8, "восемь стилей")
        page.click("#dtbPopStyles [data-arr='style-1']")
        o = page.evaluate(OBJ, a)
        check(o["fill"]["c"] == "#ED7D31" and o["line"]["c"] == "#C55A11", "заливка и контур — оранжевые")
        check(all(r["c"] == "#FFFFFF" for p_ in o["text"]["paras"] for r in p_["runs"]), "текст белый")
        page.click("#deckStylesBtn")
        page.click("#dtbPopStyles [data-arr='style-7']")
        o = page.evaluate(OBJ, a)
        check(o["fill"] is None and o["line"]["c"] == "#4472C4", "«только контур» — без заливки")
        page.click("#undoBtn")
        page.wait_for_timeout(120)
        check(page.evaluate(OBJ, a)["fill"]["c"] == "#ED7D31", "отмена стиля — один шаг")

        print("9. Обычная доска")
        select(page, [])
        page.evaluate("() => document.getElementById('bdBack').click()")
        page.wait_for_function("() => document.getElementById('screenList').style.display === 'flex'")
        page.click("#blCreateBoard")
        page.wait_for_function("() => B && !B.kind && boardActive")
        oid = page.evaluate("() => { const o = bxInsert('rect', { x: cam.x + 400 / cam.zoom, y: cam.y + 400 / cam.zoom }); return o.id; }")
        page.wait_for_timeout(300)
        check(page.evaluate("() => !document.querySelector('#deckNav .bx-bar')"), "на обычной доске панель не в полосе")
        check(page.evaluate("() => getComputedStyle(document.querySelector('.bx-bar')).position") == "fixed", "плавает, как раньше")
        check(page.evaluate(VISIBLE, ".bx-bar [data-bx='al-c']"), "выравнивание — прямо в панели, без списка")
        check(not page.evaluate(VISIBLE, ".bx-bar .dtb-dd-btn"), "кнопок списков нет")

        browser.close()
    check(not errors, "нет ошибок на странице", "; ".join(errors[:3]))
    print("\nИтог:", "всё хорошо" if not fails else f"{len(fails)} провал(ов)")
    sys.exit(1 if fails else 0)


if __name__ == "__main__":
    main()
