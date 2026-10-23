"""
Промпт №102: вставка со значками в панели презентации (deck-toolbar.js,
шаг 2 плана claude/presentations-toolbar-plan.md; HANDOFF.md раздел 6д).

Проверяем:
  1. «Фигуры ▾»: галерея по группам, каждая фигура вставляется своей
     (щелчок по слайду — размер по умолчанию, посередине щелчка)
  2. Протяжка задаёт размер, с Shift — квадрат; после вставки — «рука»
  3. «Линия ▾»: линия, стрелка (наконечник в конце), соединительная;
     протяжка задаёт концы, с Shift — угол кратен 45°
  4. «Таблица ▾»: сетка 8 × 8, выбранный размер (столбцы × строки)
  5. «Надпись»: протяжка задаёт ширину
  6. Вставка — один шаг отмены
  7. Пока ждём протяжку, перо не рисует; Esc и щелчок мимо слайда отменяют
  8. «Картинка», «Формула», «Задание» открывают свои окна
  9. Вид «Гибрид» — крупные галереи с подписями
 10. Нет ошибок на странице

Запуск: python3 test_prompt102_deck_insert.py
"""
import sys

from playwright.sync_api import sync_playwright

import test_prompt84_deck_slides as T

T.PORT = 8972
T.BASE = f"http://127.0.0.1:{T.PORT}"
fails = []


def check(cond, msg, extra=""):
    print(("OK   " if cond else "FAIL ") + msg + (f"  [{extra}]" if extra and not cond else ""))
    if not cond:
        fails.append(msg)


VISIBLE = "(sel) => { const e = document.querySelector(sel); if (!e) return false; const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0 && getComputedStyle(e).visibility !== 'hidden' && getComputedStyle(e).display !== 'none'; }"
# точка слайда (доли ширины и высоты) → экран
SPOT = """([fx, fy]) => { const r = deckSlideRect(deckCur()); const cv = document.getElementById('boardCv').getBoundingClientRect();
  return { x: cv.left + (r.x + r.w * fx - cam.x) * cam.zoom, y: cv.top + (r.y + r.h * fy - cam.y) * cam.zoom }; }"""
LAST = "() => { const o = B.objects[B.objects.length - 1]; return JSON.parse(JSON.stringify(o)); }"


def spot(page, fx, fy):
    return page.evaluate(SPOT, [fx, fy])


def drag(page, a, b, shift=False):
    if shift:
        page.keyboard.down("Shift")
    page.mouse.move(a["x"], a["y"])
    page.mouse.down()
    page.mouse.move((a["x"] + b["x"]) / 2, (a["y"] + b["y"]) / 2, steps=3)
    page.mouse.move(b["x"], b["y"], steps=3)
    page.mouse.up()
    if shift:
        page.keyboard.up("Shift")
    page.wait_for_timeout(150)


def close_editor(page):
    page.keyboard.press("Escape")
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
        page.wait_for_function("() => B && B.kind === 'deck' && boardActive && typeof dtbArm === 'function'")
        page.wait_for_timeout(500)
        zoom = page.evaluate("() => cam.zoom")

        print("1. Галерея фигур")
        page.click("#deckShapesBtn")
        check(page.evaluate(VISIBLE, "#dtbPopShapes"), "галерея открылась")
        heads = page.evaluate("() => [...document.querySelectorAll('#dtbPopShapes .dtb-pop-h')].map(h => h.textContent)")
        check(heads[:3] == ["Основные", "Звёзды", "Стрелки"] and "Блок-схемы" in heads and "Математические знаки" in heads, "группы как в PowerPoint", str(heads))
        geoms = page.evaluate("() => [...document.querySelectorAll('#dtbPopShapes [data-geom]')].map(b => b.dataset.geom)")
        check(len(geoms) >= 60, "фигур в галерее не меньше 60", str(len(geoms)))
        empty = page.evaluate("() => [...document.querySelectorAll('#dtbPopShapes [data-geom]')].filter(b => !b.querySelector('svg path')).map(b => b.dataset.geom)")
        check(not empty, "у каждой фигуры есть значок", str(empty))
        page.keyboard.press("Escape")
        bad = []
        for i, g in enumerate(geoms):
            page.click("#deckShapesBtn")
            page.click(f"#dtbPopShapes [data-geom='{g}']")
            pt = spot(page, 0.2 + 0.6 * ((i % 8) / 7), 0.25 + 0.5 * ((i // 8 % 6) / 5))
            page.mouse.click(pt["x"], pt["y"])
            o = page.evaluate(LAST)
            if o.get("type") != "box" or o.get("geom") != g:
                bad.append(g)
        check(not bad, f"все {len(geoms)} фигур вставляются своей формой", str(bad[:6]))
        page.evaluate("() => { B.objects = B.objects.filter(o => o.type === 'deck' || o.bgOf); saveDB(); scheduleRedraw(); }")

        print("2. Протяжка")
        page.click("#deckShapesBtn")
        page.click("#dtbPopShapes [data-geom='ellipse']")
        check(page.evaluate("() => document.documentElement.classList.contains('dtb-placing')"), "крестик: ждём протяжку")
        check(page.evaluate("() => getComputedStyle(document.getElementById('boardCv')).cursor") == "crosshair", "курсор — крестик")
        a, b = spot(page, 0.2, 0.2), spot(page, 0.2, 0.2)
        b = {"x": a["x"] + 200, "y": a["y"] + 100}
        drag(page, a, b)
        o = page.evaluate(LAST)
        check(o["geom"] == "ellipse", "протянули — овал")
        check(abs(o["w"] - 200 / zoom) < 3 and abs(o["h"] - 100 / zoom) < 3, "размер по протяжке", f"{o['w']:.1f}×{o['h']:.1f} при {200/zoom:.1f}×{100/zoom:.1f}")
        w0 = page.evaluate("(p) => screenToWorld(p.x - document.getElementById('boardCv').getBoundingClientRect().left, p.y - document.getElementById('boardCv').getBoundingClientRect().top)", a)
        check(abs(o["points"][0]["x"] - w0["x"]) < 2 and abs(o["points"][0]["y"] - w0["y"]) < 2, "левый верхний угол — где начали тянуть")
        check(page.evaluate("() => tool") == "hand", "после вставки — «рука»")
        check(not page.evaluate("() => document.documentElement.classList.contains('dtb-placing')"), "крестик снят")
        page.click("#deckShapesBtn")
        page.click("#dtbPopShapes [data-geom='rect']")
        a = spot(page, 0.6, 0.6)
        drag(page, {"x": a["x"] + 150, "y": a["y"] + 60}, a, shift=True)
        o = page.evaluate(LAST)
        check(abs(o["w"] - o["h"]) < 0.5 and abs(o["w"] - 150 / zoom) < 3, "с Shift — квадрат, тянуть можно и влево-вверх", f"{o['w']:.1f}×{o['h']:.1f}")

        print("3. Линии")
        page.click("#deckLinesBtn")
        kinds = page.evaluate("() => [...document.querySelectorAll('#dtbPopLines [data-line]')].map(b => b.dataset.line)")
        check(kinds == ["line", "arrow", "elbow"], "линия, стрелка, соединительная", str(kinds))
        page.click("#dtbPopLines [data-line='line']")
        a = spot(page, 0.3, 0.7)
        b = {"x": a["x"] - 160, "y": a["y"] - 90}
        drag(page, a, b)
        sc = page.evaluate("""() => { const cv = document.getElementById('boardCv').getBoundingClientRect();
          return bxLineEnds(B.objects[B.objects.length - 1]).map(p => ({ x: cv.left + (p.x - cam.x) * cam.zoom, y: cv.top + (p.y - cam.y) * cam.zoom })); }""")
        check(abs(sc[0]["x"] - a["x"]) < 2 and abs(sc[0]["y"] - a["y"]) < 2 and abs(sc[1]["x"] - b["x"]) < 2 and abs(sc[1]["y"] - b["y"]) < 2,
              "концы линии — где начали и закончили", f"{sc} {a} {b}")
        page.click("#deckLinesBtn")
        page.click("#dtbPopLines [data-line='arrow']")
        a = spot(page, 0.5, 0.5)
        drag(page, a, {"x": a["x"] + 200, "y": a["y"] + 30}, shift=True)
        o = page.evaluate(LAST)
        check(o["geom"] == "straightConnector1" and o["line"].get("te") == "triangle", "стрелка с наконечником на конце")
        check(o["h"] < 0.5, "с Shift — ровно по горизонтали", str(o["h"]))
        page.click("#deckLinesBtn")
        page.click("#dtbPopLines [data-line='elbow']")
        pt = spot(page, 0.7, 0.3)
        page.mouse.click(pt["x"], pt["y"])
        o = page.evaluate(LAST)
        check(o["geom"] == "bentConnector3" and abs(o["w"] - 320) < 1, "соединительная щелчком — по умолчанию", f"{o.get('geom')} {o.get('w')} {o.get('type')}")

        print("4. Таблица")
        page.click("#deckTableBtn")
        check(page.evaluate("() => document.querySelectorAll('#dtbPopTable .dtb-tgrid i').length") == 64, "сетка 8 × 8")
        page.hover("#dtbPopTable i[data-r='4'][data-c='5']")
        check(page.inner_text("#dtbTblSize").strip() == "Таблица 5 × 4", "подпись размера при наведении", page.inner_text("#dtbTblSize"))
        check(page.evaluate("() => document.querySelectorAll('#dtbPopTable i.on').length") == 20, "подсвечено 20 клеток")
        page.click("#dtbPopTable i[data-r='4'][data-c='5']")
        page.wait_for_timeout(200)
        o = page.evaluate(LAST)
        check(o["type"] == "table" and len(o["cols"]) == 5 and len(o["rows"]) == 4 and len(o["cells"]) == 4 and all(len(r) == 5 for r in o["cells"]),
              "таблица 5 столбцов × 4 строки")
        inside = page.evaluate("() => { const o = B.objects[B.objects.length - 1], r = deckSlideRect(deckCur()); return o.points[0].x >= r.x && o.points[0].x + o.w <= r.x + r.w; }")
        check(inside, "таблица целиком на слайде")
        close_editor(page)

        print("5. Надпись")
        page.click("#dtb-text")
        a = spot(page, 0.1, 0.1)
        drag(page, a, {"x": a["x"] + 300, "y": a["y"] + 20})
        page.wait_for_timeout(150)
        o = page.evaluate(LAST)
        check(o["type"] == "box" and o.get("text") and abs(o["w"] - 300 / zoom) < 3, "ширина надписи — по протяжке", str(o.get("w")))
        check(page.evaluate(VISIBLE, ".bx-ed"), "поле правки открылось")
        close_editor(page)

        print("6. Отмена")
        n = page.evaluate("() => B.objects.length")
        page.click("#deckShapesBtn")
        page.click("#dtbPopShapes [data-geom='star5']")
        a = spot(page, 0.45, 0.45)
        drag(page, a, {"x": a["x"] + 120, "y": a["y"] + 120})
        check(page.evaluate("() => B.objects.length") == n + 1, "звезда добавилась")
        page.click("#undoBtn")
        page.wait_for_timeout(150)
        check(page.evaluate("() => B.objects.length") == n and not page.evaluate("() => B.objects.some(o => o.geom === 'star5')"), "одна отмена убирает вставку целиком")

        print("7. Отмена протяжки")
        page.click(".bd-tool[data-tool='pen']")
        n = page.evaluate("() => B.objects.length")
        page.click("#deckShapesBtn")
        page.click("#dtbPopShapes [data-geom='rect']")
        page.keyboard.press("Escape")
        check(not page.evaluate("() => document.documentElement.classList.contains('dtb-placing')"), "Esc снимает крестик")
        page.click("#dtb-text")
        page.click("#dtb-text")
        check(not page.evaluate("() => document.documentElement.classList.contains('dtb-placing')"), "второй щелчок по «Надпись» — отмена")
        page.click("#deckShapesBtn")
        page.click("#dtbPopShapes [data-geom='rect']")
        page.click(".bd-tool[data-tool='pen']")
        check(not page.evaluate("() => document.documentElement.classList.contains('dtb-placing')"), "щелчок по доку — отмена")
        a = spot(page, 0.8, 0.8)
        drag(page, a, {"x": a["x"] + 40, "y": a["y"] + 10})
        o = page.evaluate(LAST)
        check(o["type"] != "box", "после отмены перо рисует как обычно", o["type"])

        print("8. Картинка, формула, задание")
        page.click("#dtb-image")
        page.wait_for_timeout(150)
        check(page.evaluate("() => document.getElementById('bdImgSrcPop').classList.contains('open')"), "«Картинка» открыла выбор источника")
        top = page.evaluate("() => document.getElementById('bdImgSrcPop').getBoundingClientRect().top")
        bb = page.evaluate("() => document.getElementById('dtb-image').getBoundingClientRect().bottom")
        check(top >= bb, "окошко — под кнопкой панели", f"{top} < {bb}")
        page.mouse.click(700, 600)
        check(not page.evaluate("() => document.getElementById('bdImgSrcPop').classList.contains('open')"), "щелчок мимо закрыл")
        page.click("#dtb-formula")
        page.wait_for_timeout(150)
        check(page.evaluate("() => getComputedStyle(document.getElementById('bdFormulaEditor')).display") == "flex", "«Формула» открыла редактор формул")
        page.keyboard.type("x^2")
        page.keyboard.press("Enter")
        page.wait_for_function("() => B.objects.some(o => o.latex === 'x^2')", timeout=5000)
        check(True, "формула вставлена")
        page.click("#dtb-task")
        page.wait_for_timeout(300)
        check(page.evaluate("() => trainersPanelIsOpen()"), "«Задание» открыло панель тренажёров")
        page.click("#dtb-task")
        page.wait_for_timeout(200)

        print("9. Гибрид")
        page.evaluate("() => { localStorage.setItem('boardsDeckBarStyle', 'hybrid'); deckTbSync(); }")
        page.click("#deckShapesBtn")
        check(page.evaluate("() => document.getElementById('dtbPopShapes').classList.contains('big')"), "галерея крупная")
        check(page.evaluate(VISIBLE, "#dtbPopShapes [data-geom='rect'] .dtb-cap"), "с подписями")
        bw = page.evaluate("() => document.querySelector('#dtbPopShapes [data-geom=\"rect\"]').getBoundingClientRect().width")
        check(bw >= 70, "крупные клетки", str(bw))
        page.click("#dtbPopShapes [data-geom='hexagon']")
        pt = spot(page, 0.5, 0.3)
        page.mouse.click(pt["x"], pt["y"])
        check(page.evaluate(LAST)["geom"] == "hexagon", "из крупной галереи вставляется так же")
        page.evaluate("() => { localStorage.setItem('boardsDeckBarStyle', 'line'); deckTbSync(); }")
        page.click("#deckShapesBtn")
        check(not page.evaluate("() => document.getElementById('dtbPopShapes').classList.contains('big')"), "в «одной строке» — компактная")
        page.keyboard.press("Escape")

        browser.close()
    check(not errors, "нет ошибок на странице", "; ".join(errors[:3]))
    print("\nИтог:", "всё хорошо" if not fails else f"{len(fails)} провал(ов)")
    sys.exit(1 if fails else 0)


if __name__ == "__main__":
    main()
