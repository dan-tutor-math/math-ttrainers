"""
Правка: при повторном редактировании готового текста старая версия
оставалась нарисованной на холсте под полем ввода — два текста накладывались.

Проверяем:
  1. Пока поле ввода открыто над готовым текстом, сам текст и его рамка
     выделения на холсте не рисуются (под полем пусто).
  2. После «Подтвердить» новый текст на месте, старого нет.
  3. «Отмена» и подтверждение пустого поля возвращают старый текст на холст.
  4. Чужие объекты рядом продолжают рисоваться; нет ошибок JavaScript.

Запуск: python3 test_prompt_text_reedit_overlap.py (сервер поднимается сам).
"""
import sys

from playwright.sync_api import sync_playwright

from test_prompt69_board_tools import local_server, open_board, ink_box

TEXT = {"id": "tx", "type": "text", "color": "--pencil", "fontSize": 28,
        "points": [{"x": 200, "y": 200}], "content": "Старый текст длинный", "boxW": 600}
PEN = {"id": "pn", "type": "pen", "color": "--pencil", "width": 3,
       "points": [{"x": 200, "y": 420}, {"x": 500, "y": 430}]}


def canvas_ink(page, x, y, w, h):
    """есть ли «чернила» в прямоугольнике холста (в CSS-пикселях экрана)"""
    return page.evaluate("""([x, y, w, h]) => {
        const r = canvas.getBoundingClientRect();
        const k = canvas.width / r.width;
        const d = ctx.getImageData((x - r.left) * k, (y - r.top) * k, w * k, h * k).data;
        let n = 0;
        for (let i = 0; i < d.length; i += 4) if (d[i+3] > 200 && d[i] + d[i+1] + d[i+2] < 330) n++;
        return n; }""", [x, y, w, h])


def text_rect(page, oid):
    return page.evaluate("""(id) => { const o = B.objects.find(x => x.id === id); measureTextObj(o);
        const r = canvas.getBoundingClientRect();
        return [r.left + (o.points[0].x - cam.x) * cam.zoom, r.top + (o.points[0].y - cam.y) * cam.zoom,
                o.w * cam.zoom, o.h * cam.zoom]; }""", oid)


def run():
    fails = []

    def check(name, cond, extra=""):
        print(("OK   " if cond else "FAIL ") + name + ("" if cond else "  " + str(extra)))
        if not cond:
            fails.append(name)

    with local_server(), sync_playwright() as p:
        browser = p.chromium.launch()
        ctx = browser.new_context()
        errors = []
        page = open_board(ctx, objects=[dict(TEXT), dict(PEN)], errors=errors)
        # камеру — на объекты (по умолчанию доска открывается далеко от 0,0)
        page.evaluate("() => { cam.x = 100; cam.y = 100; cam.zoom = 1; scheduleRedraw(); }")
        page.wait_for_timeout(120)
        r = text_rect(page, "tx")
        pen_y = page.evaluate("() => { const r = canvas.getBoundingClientRect(); return r.top + (425 - cam.y) * cam.zoom; }")
        pen_x = page.evaluate("() => { const r = canvas.getBoundingClientRect(); return r.left + (200 - cam.x) * cam.zoom; }")
        check("0. до правки текст на холсте виден", canvas_ink(page, *r) > 50)

        # открываем правку готового текста (как двойной клик / клик «Текстом»)
        page.evaluate("() => { selectedId = 'tx'; openTextEditor(B.objects.find(o => o.id === 'tx'), null); }")
        page.wait_for_selector(".bd-text-editor textarea")
        page.wait_for_timeout(150)
        check("1. пока поле открыто, старого текста на холсте нет", canvas_ink(page, *r) == 0, canvas_ink(page, *r))
        check("1. рамка выделения старого текста не рисуется",
              canvas_ink(page, r[0] - 14, r[1] - 14, r[2] + 28, r[3] + 28) == 0)
        check("4. соседний рисунок по-прежнему виден", canvas_ink(page, pen_x, pen_y - 8, 200, 16) > 20)

        # поле совпадает с местом текста — его пиксели (а не холста) дают текст на экране
        page.keyboard.press("Control+a")
        page.keyboard.type("Новый")
        page.wait_for_timeout(80)
        page.evaluate("() => document.querySelector('.bd-text-editor .bd-text-editor-ok').click()")
        page.wait_for_timeout(150)
        o = page.evaluate("() => B.objects.find(o => o.id === 'tx').content")
        check("2. после «Подтвердить» сохранён новый текст", o == "Новый", o)
        r2 = text_rect(page, "tx")
        check("2. новый текст нарисован", canvas_ink(page, *r2) > 20)
        tail = [r2[0] + r2[2] + 6, r[1], r[0] + r[2] - (r2[0] + r2[2]) - 6, r[3]]
        check("2. хвоста старого текста нет", canvas_ink(page, *tail) == 0, canvas_ink(page, *tail))

        # «Отмена» — текст возвращается
        page.evaluate("() => openTextEditor(B.objects.find(o => o.id === 'tx'), null)")
        page.wait_for_selector(".bd-text-editor textarea")
        page.wait_for_timeout(120)
        check("3. при правке спрятан", canvas_ink(page, *r2) == 0)
        page.evaluate("() => document.querySelector('.bd-text-editor .bd-text-editor-cancel').click()")
        page.wait_for_timeout(150)
        check("3. после «Отмена» текст снова на холсте", canvas_ink(page, *r2) > 20)

        # подтверждение пустого поля — старый текст остаётся и виден
        page.evaluate("() => openTextEditor(B.objects.find(o => o.id === 'tx'), null)")
        page.wait_for_selector(".bd-text-editor textarea")
        page.wait_for_timeout(100)
        page.keyboard.press("Control+a")
        page.keyboard.press("Backspace")
        page.evaluate("() => document.querySelector('.bd-text-editor .bd-text-editor-ok').click()")
        page.wait_for_timeout(150)
        check("3. пустое «Подтвердить» — текст на месте и виден",
              page.evaluate("() => B.objects.find(o => o.id === 'tx').content") == "Новый" and canvas_ink(page, *r2) > 20)

        check("4. нет ошибок JavaScript", not errors, errors)
        browser.close()

    print("\nИТОГ:", "всё прошло" if not fails else f"упало {len(fails)}")
    sys.exit(1 if fails else 0)


if __name__ == "__main__":
    run()
