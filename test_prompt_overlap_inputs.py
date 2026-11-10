"""
Задания внахлёст на доске: верхняя карточка закрывает живые элементы нижней.

Живой случай: карточки правильно перекрывают друг друга на холсте, но поле
ввода и «Проверить» нижней лежали в DOM-слое над холстом и рисовались поверх
верхней карточки (и ловили клики). Теперь syncTaskOverlays вырезает из
нижнего задания прямоугольники карточек выше (clip-path).

Проверяем на масштабах 100% и 250%:
  1. В центре поля и в центре кнопки нижней карточки elementFromPoint
     возвращает не её input/button.
  2. Клик в этих точках не меняет значение и не ставит фокус в нижнее поле.
  3. Нижнее поле вне перекрытия по-прежнему кликабельно (вырез не шире карточки).
  4. В поле верхней карточки можно ввести ответ, «Проверить» показывает итог.

Порядок слоёв у второго участника совместной сессии из песочницы не проверить
(realtime — заглушка): перепроверять на сайте руками.
"""
import sys

from playwright.sync_api import sync_playwright

from test_prompt53_cloud_stale_versions import PNG, local_server  # noqa: F401
from test_prompt_cloud_wheel_resize import open_board
from test_prompt_board_task_live import Relay


def card(oid, x, y, answer):
    return {"id": oid, "type": "image", "src": PNG, "points": [{"x": x, "y": y}], "w": 400, "h": 200,
            "natW": 1, "natH": 1, "rv": 1, "rvBy": "T", "by": "T", "locked": True,
            "task": {"v": 1, "kind": "fields", "fields": [{"id": "a", "label": "", "type": "num", "value": answer}],
                     "hot": {"w": 400, "h": 200, "fields": [{"x": .1, "y": .6, "w": .3, "h": .2}],
                             "check": {"x": .5, "y": .6, "w": .3, "h": .2}, "checkText": "Проверить"}}}


# нижняя — первая в B.objects; верхняя сдвинута на 60 вниз и закрывает поле и кнопку нижней целиком
OBJS = [card("low", 100, 100, "84"), card("top", 100, 160, "7")]

CENTER = """(sel) => { const e = document.querySelector(sel); const r = e.getBoundingClientRect();
    const el = document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2);
    return { x: r.x + r.width / 2, y: r.y + r.height / 2,
             inLow: !!(el && el.closest('.bd-task[data-id="low"]') && el.closest('.bd-task-in,.bd-task-btn')) }; }"""


def run():
    failures = []

    def check(name, cond, extra=""):
        print(f"[{'OK' if cond else 'FAIL'}] {name}" + (f" — {extra}" if extra and not cond else ""))
        if not cond:
            failures.append(name)

    with local_server(), sync_playwright() as p:
        browser = p.chromium.launch()
        pg = open_board(browser, "T", OBJS, cloud=False)
        errors = []
        pg.on("pageerror", lambda e: errors.append(str(e)))
        for zoom in (1, 2.5):
            pg.evaluate(f"""() => setZoom({zoom}, 300, 230, cssW / 2, cssH / 2)""")
            pg.wait_for_timeout(250)
            tag = f"{int(zoom * 100)}%"
            inp = pg.evaluate(CENTER, '.bd-task[data-id="low"] .bd-task-in')
            btn = pg.evaluate(CENTER, '.bd-task[data-id="low"] .bd-task-btn')
            check(f"{tag}: центр поля нижней закрыт верхней", not inp["inLow"])
            check(f"{tag}: центр кнопки нижней закрыт верхней", not btn["inLow"])
            pg.mouse.click(inp["x"], inp["y"])
            pg.keyboard.type("9")
            focused_low = pg.evaluate("() => !!document.activeElement.closest('.bd-task[data-id=\"low\"]')")
            low_val = pg.evaluate("() => document.querySelector('.bd-task[data-id=\"low\"] .bd-task-in').value")
            check(f"{tag}: клик в закрытое поле не вводит в нижнее", not focused_low and low_val == "", low_val)
            pg.mouse.click(btn["x"], btn["y"])
            st = pg.evaluate("() => getCurrentBoard().objects.find(o => o.id === 'low').task.st || null")
            check(f"{tag}: клик в закрытую кнопку не проверяет нижнее", st is None, str(st))
            # поле нижней вне перекрытия: верхняя начинается на 60 ниже верха нижней,
            # значит верхний край нижней карточки (над верхней) кликабелен — проверяем вырез
            clip = pg.evaluate("() => document.querySelector('.bd-task[data-id=\"low\"]').style.clipPath")
            check(f"{tag}: у нижней задан вырез", "evenodd" in clip, clip)
            # верхняя: ввод и «Проверить»
            pg.fill('.bd-task[data-id="top"] .bd-task-in', "7")
            pg.click('.bd-task[data-id="top"] .bd-task-btn')
            pg.wait_for_timeout(200)
            good = pg.evaluate("() => document.querySelector('.bd-task[data-id=\"top\"] .bd-task-in').classList.contains('good')")
            check(f"{tag}: верхняя принимает ответ и показывает итог", good)
            # сброс для следующего масштаба
            pg.evaluate("""() => { const o = getCurrentBoard().objects.find(o => o.id === 'top'); delete o.task.st;
                const i = document.querySelector('.bd-task[data-id="top"] .bd-task-in'); i.value = ''; }""")
        # ── клик по видимой части поднимает карточку целиком ──
        pg.evaluate("() => { tool = 'hand'; }")   # клик по карточке работает в «руке», а не пером
        order = lambda: pg.evaluate("() => getCurrentBoard().objects.map(o => o.id).filter(i => i === 'low' || i === 'top').join()")
        for zoom in (1, 2.5):
            tag = f"{int(zoom * 100)}%"
            pg.evaluate(f"() => setZoom({zoom}, 300, 230, cssW / 2, cssH / 2)")
            pg.wait_for_timeout(250)
            if order() != "low,top":
                pg.evaluate("""() => { const b = getCurrentBoard(); b.objects.sort((a, c) => a.id === 'low' ? -1 : 1); scheduleRedraw(); }""")
                pg.wait_for_timeout(200)
            # видимая полоска нижней: выше верхней карточки (мир y 100..160), x = 300
            pt = pg.evaluate("""() => { const r = document.getElementById('boardCv').getBoundingClientRect();
                const p = worldToScreen({ x: 300, y: 130 }); return { x: r.x + p.x, y: r.y + p.y }; }""")
            pg.mouse.click(pt["x"], pt["y"])
            pg.wait_for_timeout(250)
            check(f"{tag}: клик по видимому краю нижней поднимает её", order() == "top,low", order())
            inp = pg.evaluate(CENTER, '.bd-task[data-id="low"] .bd-task-in')
            check(f"{tag}: теперь поле нижней под курсором", inp["inLow"])
            # а верхняя теперь закрыта нижней; клик по её видимой части (мир y 320) возвращает её наверх
            pt2 = pg.evaluate("""() => { const r = document.getElementById('boardCv').getBoundingClientRect();
                const p = worldToScreen({ x: 300, y: 330 }); return { x: r.x + p.x, y: r.y + p.y }; }""")
            pg.mouse.click(pt2["x"], pt2["y"])
            pg.wait_for_timeout(250)
            check(f"{tag}: клик по видимой части верхней возвращает порядок", order() == "low,top", order())
        # ── ручное размещение: призрак двигает только левая кнопка, колесо и правая — панорама ──
        pg.evaluate("""() => { window.__pp = placeTaskManually({ img: '%s' }, 'тест'); }""" % PNG)
        pg.wait_for_selector('.bd-ghost')
        pg.evaluate("() => { setZoom(1, 300, 230, cssW / 2, cssH / 2); Object.assign(placeGhost, { x: cam.x + 300, y: cam.y + 300, w: 400, h: 200, ratio: 2 }); syncPlaceGhost(); }")
        pg.wait_for_timeout(200)
        gh = lambda: pg.evaluate("() => ({ x: placeGhost.x, y: placeGhost.y, cx: cam.x, cy: cam.y })")
        box = pg.evaluate("() => { const r = document.querySelector('.bd-ghost').getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 }; }")
        for btn in ("middle", "right"):
            a = gh()
            pg.mouse.move(box["x"], box["y"]); pg.mouse.down(button=btn)
            pg.mouse.move(box["x"] - 60, box["y"] - 40, steps=4); pg.mouse.up(button=btn)
            pg.wait_for_timeout(150)
            b = gh()
            check(f"призрак: {btn} кнопка не двигает карточку", (a["x"], a["y"]) == (b["x"], b["y"]), f"{a} {b}")
            check(f"призрак: {btn} кнопка двигает доску", (a["cx"], a["cy"]) != (b["cx"], b["cy"]), f"{a} {b}")
            box = pg.evaluate("() => { const r = document.querySelector('.bd-ghost').getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 }; }")
        a = gh()
        pg.mouse.move(box["x"], box["y"]); pg.mouse.down()
        pg.mouse.move(box["x"] + 50, box["y"] + 30, steps=4); pg.mouse.up()
        b = gh()
        check("призрак: левая кнопка двигает карточку, а не доску", (a["x"], a["y"]) != (b["x"], b["y"]) and (a["cx"], a["cy"]) == (b["cx"], b["cy"]), f"{a} {b}")
        pg.evaluate("() => endPlaceGhost('cancelled')")
        # убрали перекрытие — вырез снимается
        pg.evaluate("""() => { getCurrentBoard().objects.find(o => o.id === 'top').points[0].y = 900; scheduleRedraw(); }""")
        pg.wait_for_timeout(250)
        clip = pg.evaluate("() => document.querySelector('.bd-task[data-id=\"low\"]').style.clipPath")
        check("без перекрытия выреза нет", clip in ("", "none"), clip)
        check("ошибок страницы нет", not errors, str(errors))
        # ── общая доска: подъём карточки доезжает до второго участника (zr) ──
        T = open_board(browser, "T", OBJS)
        S = open_board(browser, "S", OBJS)
        for pg2 in (T, S):
            pg2.evaluate("() => { tool = 'hand'; }")
        ids = lambda page: page.evaluate("() => getCurrentBoard().objects.map(o => o.id).filter(i => i === 'low' || i === 'top').join()")
        check("облако: исходный порядок у обоих low,top", ids(T) == ids(S) == "low,top", f"{ids(T)} {ids(S)}")
        r = Relay(T, S)
        n0 = len(T.evaluate("() => window.__fake.sent"))
        pt = T.evaluate("""() => { const rc = document.getElementById('boardCv').getBoundingClientRect();
            const p = worldToScreen({ x: 300, y: 130 }); return { x: rc.x + p.x, y: rc.y + p.y }; }""")
        T.mouse.click(pt["x"], pt["y"])
        T.wait_for_timeout(1500)
        check("облако: у себя нижняя поднялась", ids(T) == "top,low", ids(T))
        new = r.flush("a")
        S.wait_for_timeout(300)
        check("облако: у второго участника порядок тот же", ids(S) == "top,low", ids(S))
        zr = T.evaluate("() => getCurrentBoard().objects.filter(o => typeof o.zr === 'number').length")
        check("облако: zr поставлен только двум карточкам", zr == 2, str(zr))
        browser.close()
    print("ГОТОВО" if not failures else f"ПРОВАЛЕНО: {failures}")
    return 1 if failures else 0


if __name__ == "__main__":
    sys.exit(run())
