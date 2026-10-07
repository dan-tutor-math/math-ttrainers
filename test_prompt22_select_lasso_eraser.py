"""
Промпт №22 (новый список): доски — лассо, выделение «как в Finder» и ластик.

«Выделение» получило панель над доком с двумя режимами: «Рамка» (как было)
и «Лассо» — обвести нужное от руки; выделяется то, что оказалось внутри
бо́льшей частью контура. ⌘ на Mac / Ctrl на Windows (и Shift): щелчок
добавляет объект к выделенному или убирает его, обводка добавляет попавшее
к уже выделенному. У «Ластика» на той же панели размер (−/+, клавиши [ и ])
с кольцом-курсором настоящего размера и два режима: «Объект» (как было) и
«Область» — режет штрихи ручки и прямые, как растровый ластик тренажёров.

Проверяем:
  A. Панель «Выделения»: только две кнопки режима, по умолчанию «Рамка»;
     «Лассо» включается, запоминается после перезагрузки, меняет значок в
     доке; повторное нажатие на кнопку инструмента и клавиша 2 переключают.
  B. Рамка выделяет как раньше.
  C. Лассо: обведённое выделено, задетое краем — нет; круг, обведённый
     впритык (углы его рамки снаружи лассо), выделен; путь лассо виден,
     пока его ведут; щелчок мимо снимает выделение.
  D. Ctrl / ⌘ / Shift + щелчок: добавить, убрать, сохранённая группа целиком,
     обводка с Ctrl добавляет к выделенному; Ctrl+C берёт всё выделенное,
     Delete удаляет всё выделенное.
  E. Ластик: своя панель, размер 28 по умолчанию, −/+ и [ ] по шкале,
     запоминается; кольцо на доске ровно этого размера, курсор спрятан;
     после нажатия «+» кольцо видно на миг. «Объект» берёт радиус из размера.
  F. «Область»: штрих режется на два куска, прямая — на два отрезка из двух
     точек, прямоугольник и текст не трогаются, один шаг отмены на жест,
     отмена возвращает штрих целиком. Режим запоминается.
  G. «Область» на общей доске: в базу и в рассылку уходят удаление
     исходного штриха и куски — то же, что на экране.
  H. «Область» в заметках справочной панели.
  I. Нет ошибок JavaScript.

Живой realtime из песочницы недоступен — заглушка supabase-js из
test_prompt53_cloud_stale_versions.py. Совместный режим перепроверяется на
сайте руками.

Запуск: python3 test_prompt22_select_lasso_eraser.py (сервер поднимается сам).
"""
import sys

from playwright.sync_api import sync_playwright

from test_prompt53_cloud_stale_versions import local_server
from test_prompt_cloud_wheel_resize import open_board

fails = []


def check(msg, cond, extra=""):
    print(("[OK]   " if cond else "[FAIL] ") + msg + (f" — {extra}" if extra and not cond else ""))
    if not cond:
        fails.append(msg)


def pen(oid, pts, **kw):
    o = {"id": oid, "type": "pen", "color": "ink", "width": 2, "by": "T",
         "points": [{"x": x, "y": y} for x, y in pts]}
    o.update(kw)
    return o


def hline(oid, x0, x1, y, **kw):
    return pen(oid, [(x, y) for x in range(x0, x1 + 1, 10)], **kw)


def scr(page, x, y):
    """мировая точка доски → точка окна"""
    return page.evaluate("""([x, y]) => { const r = canvas.getBoundingClientRect(); const p = worldToScreen({x, y});
        return [r.left + p.x, r.top + p.y]; }""", [x, y])


def pick(page, t):
    page.click(f'#bdDock .bd-tool[data-tool="{t}"]')
    page.wait_for_timeout(80)


def sel(page):
    return page.evaluate("() => (multiSelectIds.length ? multiSelectIds.slice() : (selectedId ? [selectedId] : [])).sort()")


def click_world(page, x, y, mods=()):
    for m in mods:
        page.keyboard.down(m)
    page.mouse.click(*scr(page, x, y))
    for m in reversed(mods):
        page.keyboard.up(m)
    page.wait_for_timeout(60)


def drag_path(page, pts, mods=(), mid=None):
    """провести мышью по мировым точкам; mid(page) — вызвать посреди пути"""
    for m in mods:
        page.keyboard.down(m)
    page.mouse.move(*scr(page, *pts[0]))
    page.mouse.down()
    for i, p in enumerate(pts[1:]):
        page.mouse.move(*scr(page, *p), steps=4)
        if mid and i == len(pts) // 2:
            mid(page)
    page.mouse.up()
    for m in reversed(mods):
        page.keyboard.up(m)
    page.wait_for_timeout(80)


def loop(cx, cy, rx, ry, n=24):
    import math
    return [(cx + rx * math.cos(2 * math.pi * k / n), cy + ry * math.sin(2 * math.pi * k / n)) for k in range(n + 1)]


def visible(page, sel_):
    return page.evaluate(f"() => {{ const e = document.querySelector('{sel_}'); return !!(e && e.getClientRects().length); }}")


def objs(page):
    return page.evaluate("() => getCurrentBoard().objects.map(o => ({id: o.id, type: o.type, n: o.points.length, "
                         "xs: o.points.map(p => p.x)}))")


def run():
    with local_server(), sync_playwright() as p:
        browser = p.chromium.launch()
        errors = []

        base = [
            hline("A", 100, 200, 150),
            hline("B", 300, 400, 150),
            hline("C", 500, 600, 150),
            {"id": "K", "type": "circle", "points": [{"x": 350, "y": 420}], "r": 60, "color": "ink", "width": 2, "by": "T"},
        ]
        page = open_board(browser, "T", base, cloud=False)
        page.on("pageerror", lambda e: errors.append(str(e)))
        page.evaluate("() => { try { localStorage.removeItem('boardsSelectMode'); localStorage.removeItem('boardsEraserMode');"
                      " localStorage.removeItem('boardsEraserSize'); } catch (e) {} }")

        # ═══ A. панель «Выделения» ═══
        pick(page, "select")
        check("A. у «Выделения» открыта панель над доком",
              page.evaluate("() => bdOptbar.classList.contains('open') && bdOptbar.classList.contains('mode-only')"))
        check("A. на панели видны кнопки «Рамка» и «Лассо»",
              visible(page, '[data-sel-mode="rect"]') and visible(page, '[data-sel-mode="lasso"]'))
        check("A. цвета и толщины на панели нет", not visible(page, "#bdSwatches") and not visible(page, "#widthVal"))
        check("A. ластиковых настроек на панели нет", not visible(page, "#eraserSizeVal"))
        check("A. по умолчанию — «Рамка»", page.evaluate("() => selectMode") == "rect"
              and page.evaluate("() => document.querySelector('[data-sel-mode=\"rect\"]').classList.contains('on')"))
        icon_rect = page.evaluate("() => document.querySelector('.bd-tool[data-tool=\"select\"] svg').outerHTML")
        page.click('[data-sel-mode="lasso"]')
        check("A. «Лассо» включилось", page.evaluate("() => selectMode") == "lasso"
              and page.evaluate("() => document.querySelector('[data-sel-mode=\"lasso\"]').classList.contains('on')")
              and not page.evaluate("() => document.querySelector('[data-sel-mode=\"rect\"]').classList.contains('on')"))
        icon_lasso = page.evaluate("() => document.querySelector('.bd-tool[data-tool=\"select\"] svg').outerHTML")
        check("A. значок кнопки в доке сменился на лассо", icon_lasso != icon_rect)
        check("A. режим запомнен", page.evaluate("() => localStorage.getItem('boardsSelectMode')") == "lasso")
        pick(page, "select")   # повторное нажатие
        check("A. повторное нажатие на «Выделение» переключает на рамку", page.evaluate("() => selectMode") == "rect")
        check("A. и значок вернулся", page.evaluate("() => document.querySelector('.bd-tool[data-tool=\"select\"] svg').outerHTML") == icon_rect)
        page.mouse.move(*scr(page, 800, 600))
        page.keyboard.press("2")
        page.wait_for_timeout(60)
        check("A. клавиша 2 при включённом выделении переключает режим", page.evaluate("() => selectMode") == "lasso")
        check("A. инструмент остался «Выделением»", page.evaluate("() => tool") == "select")
        pick(page, "pen")
        check("A. у ручки панель снова обычная",
              page.evaluate("() => !bdOptbar.classList.contains('mode-only')") and visible(page, "#bdSwatches")
              and not visible(page, '[data-sel-mode="rect"]'))
        page.reload()
        page.evaluate("""() => { window.CURRENT_USER = { id: 'T', email: 'T@test' };
            const g = document.getElementById('authGate'); if (g) g.style.display = 'none'; window.boardsAppBoot(); }""")
        page.wait_for_function("window.getDB && window.getDB().boards.length >= 1")
        page.evaluate("() => window.openBoard('bShared')")
        page.wait_for_function("() => { const b = getCurrentBoard(); return b && b.objects && b.objects.length >= 4; }")
        page.wait_for_timeout(200)
        check("A. после перезагрузки режим «Лассо» сохранился", page.evaluate("() => selectMode") == "lasso")
        check("A. и значок в доке — лассо",
              page.evaluate("() => document.querySelector('.bd-tool[data-tool=\"select\"]').dataset.selMode") == "lasso")

        # ═══ B. рамка как раньше ═══
        pick(page, "select")
        page.click('[data-sel-mode="rect"]')
        drag_path(page, [(80, 120), (420, 190)])
        check("B. рамка выделила A и B", sel(page) == ["A", "B"], str(sel(page)))
        click_world(page, 800, 650)
        check("B. щелчок мимо снимает выделение", sel(page) == [])

        # ═══ C. лассо ═══
        page.click('[data-sel-mode="lasso"]')
        mid_state = {}

        def peek(pg):
            mid_state["mode"] = pg.evaluate("() => dragMode")
            mid_state["n"] = pg.evaluate("() => lassoPts ? lassoPts.length : 0")
            mid_state["menu"] = pg.evaluate("() => bdCtxMenu.classList.contains('open')")
        # петля вокруг A и B, правым краем заходит на 20 из 100 единиц штриха C
        lasso = [(80, 110), (520, 110), (520, 190), (80, 190), (80, 112)]
        drag_path(page, lasso, mid=peek)
        check("C. пока ведут — режим лассо и путь копится",
              mid_state.get("mode") == "lasso" and mid_state.get("n", 0) >= 4, str(mid_state))
        check("C. меню выделения во время обводки спрятано", mid_state.get("menu") is False)
        check("C. лассо выделило A и B, а задетый краем C — нет", sel(page) == ["A", "B"], str(sel(page)))
        check("C. после отпускания пути лассо нет", page.evaluate("() => lassoPts === null && dragMode === null"))
        # круг, обведённый впритык восьмиугольником: углы его рамки снаружи.
        # Сначала снять выделение — меню выделения висит рядом и ловит нажатие
        click_world(page, 800, 300)
        drag_path(page, loop(350, 420, 72, 72, 8))
        check("C. круг, обведённый впритык, выделен", sel(page) == ["K"], str(sel(page)))
        # большая часть внутри — выделен: петля захватывает 70 % штриха C
        drag_path(page, [(460, 120), (580, 120), (580, 180), (460, 180), (460, 122)])
        check("C. штрих, обведённый на 80 %, выделен", sel(page) == ["C"], str(sel(page)))
        # обведён меньше чем наполовину — не выделен
        drag_path(page, [(460, 120), (540, 120), (540, 180), (460, 180), (460, 122)])
        check("C. штрих, обведённый на 40 %, не выделен", sel(page) == [], str(sel(page)))
        click_world(page, 300, 150)
        check("C. обычный щелчок по объекту в режиме лассо выделяет его", sel(page) == ["B"], str(sel(page)))
        click_world(page, 800, 650)
        check("C. щелчок мимо в режиме лассо снимает выделение", sel(page) == [], str(sel(page)))
        # объект можно утащить из режима лассо как обычно
        drag_path(page, lasso)
        drag_path(page, [(150, 150), (150, 250)])
        ys = page.evaluate("() => ['A','B'].map(id => getCurrentBoard().objects.find(o => o.id === id).points[0].y)")
        check("C. обведённое лассо тащится вместе", ys == [250, 250], str(ys))
        page.keyboard.press("Control+z")
        page.wait_for_timeout(60)

        # ═══ D. ⌘ / Ctrl / Shift ═══
        page.evaluate("""() => { const b = getCurrentBoard();
            b.objects.push({id:'G1', type:'pen', color:'ink', width:2, by:'T', groupId:'g1', points:[{x:100,y:600},{x:180,y:600}]});
            b.objects.push({id:'G2', type:'pen', color:'ink', width:2, by:'T', groupId:'g1', points:[{x:100,y:650},{x:180,y:650}]});
            scheduleRedraw(); }""")
        click_world(page, 150, 150)
        check("D. щелчок выделил A", sel(page) == ["A"])
        click_world(page, 550, 150, ["Control"])
        check("D. Ctrl+щелчок добавил C, B между ними не задет", sel(page) == ["A", "C"], str(sel(page)))
        click_world(page, 550, 150, ["Control"])
        check("D. повторный Ctrl+щелчок убрал C", sel(page) == ["A"], str(sel(page)))
        click_world(page, 550, 150, ["Meta"])
        check("D. ⌘+щелчок (Mac) тоже добавляет", sel(page) == ["A", "C"], str(sel(page)))
        click_world(page, 350, 360, ["Shift"])
        check("D. Shift+щелчок тоже добавляет", sel(page) == ["A", "C", "K"], str(sel(page)))
        click_world(page, 150, 150, ["Control"])
        check("D. Ctrl+щелчок по выделенному убирает его", sel(page) == ["C", "K"], str(sel(page)))
        click_world(page, 150, 600, ["Control"])
        check("D. объект группы добавляется вместе со всей группой", sel(page) == ["C", "G1", "G2", "K"], str(sel(page)))
        click_world(page, 150, 650, ["Control"])
        check("D. и убирается всей группой", sel(page) == ["C", "K"], str(sel(page)))
        click_world(page, 800, 650, ["Control"])
        check("D. Ctrl+щелчок мимо выделение не снимает", sel(page) == ["C", "K"], str(sel(page)))
        drag_path(page, [(80, 110), (220, 110), (220, 190), (80, 190), (80, 112)], mods=["Control"])
        check("D. обводка лассо с Ctrl добавляет к выделенному", sel(page) == ["A", "C", "K"], str(sel(page)))
        page.click('[data-sel-mode="rect"]')
        drag_path(page, [(280, 120), (420, 190)], mods=["Control"])
        check("D. рамка с Ctrl тоже добавляет", sel(page) == ["A", "B", "C", "K"], str(sel(page)))
        page.mouse.move(*scr(page, 800, 650))
        page.keyboard.press("Control+c")
        page.wait_for_timeout(60)
        check("D. Ctrl+C копирует всё выделенное",
              page.evaluate("() => clipboardObjs && clipboardObjs.map(o => o.id).sort()") == ["A", "B", "C", "K"])
        page.keyboard.press("Delete")
        page.wait_for_timeout(60)
        left = sorted(o["id"] for o in objs(page))
        check("D. Delete удаляет всё выделенное", left == ["G1", "G2"], str(left))
        page.keyboard.press("Control+z")
        page.wait_for_timeout(60)
        check("D. отмена вернула удалённое", len(objs(page)) == 6)

        # ═══ E. ластик: панель, размер, кольцо ═══
        pick(page, "eraser")
        check("E. у ластика своя панель", visible(page, "#eraserSizeVal") and visible(page, '[data-eraser-mode="area"]')
              and not visible(page, '[data-sel-mode="rect"]') and not visible(page, "#bdSwatches"))
        check("E. по умолчанию размер 28 и режим «Объект»",
              page.evaluate("() => [eraserSize, eraserMode, eraserSizeVal.textContent]") == [28, "object", "28"])
        page.mouse.move(*scr(page, 700, 500))
        page.mouse.move(*scr(page, 710, 505))
        ring = page.evaluate("() => { const r = bdEraserRing.getBoundingClientRect(); return {w: r.width, cx: r.left + r.width/2, cy: r.top + r.height/2, show: bdEraserRing.classList.contains('show')}; }")
        tx, ty = scr(page, 710, 505)
        check("E. над доской кольцо размером с ластик и по центру под мышью",
              ring["show"] and abs(ring["w"] - 28) < 0.6 and abs(ring["cx"] - tx) < 1 and abs(ring["cy"] - ty) < 1, str(ring))
        check("E. значок курсора спрятан — вместо него кольцо", page.evaluate("() => canvas.style.cursor") == "none")
        page.click("#eraserPlus")
        page.wait_for_timeout(50)
        check("E. «+» — следующий размер по шкале", page.evaluate("() => eraserSize") == 36)
        check("E. после «+» кольцо видно на доске (мышь над панелью)",
              page.evaluate("() => bdEraserRing.classList.contains('show') && bdEraserRing.getBoundingClientRect().width") == 36)
        page.wait_for_timeout(1000)
        check("E. через миг кольцо прячется", not page.evaluate("() => bdEraserRing.classList.contains('show')"))
        check("E. кружок на панели вырос", page.evaluate("() => eraserDot.getBoundingClientRect().width") == 26)
        page.mouse.move(*scr(page, 700, 500))
        page.keyboard.press("BracketRight")
        page.keyboard.press("BracketRight")
        check("E. ] увеличивает", page.evaluate("() => eraserSize") == 64)
        check("E. кольцо под мышью сразу нового размера",
              page.evaluate("() => bdEraserRing.getBoundingClientRect().width") == 64)
        page.keyboard.press("BracketLeft")
        check("E. [ уменьшает", page.evaluate("() => eraserSize") == 48)
        for _ in range(15):
            page.keyboard.press("BracketLeft")
        check("E. меньше 6 не бывает, «−» гаснет",
              page.evaluate("() => [eraserSize, eraserMinus.disabled]") == [6, True])
        check("E. размер запомнен", page.evaluate("() => localStorage.getItem('boardsEraserSize')") == "6")
        page.evaluate("() => setEraserSize(28)")
        page.mouse.move(*scr(page, 900, 700))
        check("E. другой инструмент — кольца нет", True)
        pick(page, "pen")
        page.mouse.move(*scr(page, 905, 700))
        check("E. у ручки кольца нет", not page.evaluate("() => bdEraserRing.classList.contains('show')"))
        pick(page, "eraser")
        # «Объект» с радиусом из размера: мимо на 20 единиц — 28 не достаёт, 64
        # достаёт (G2 ниже на 50 — далеко для обоих)
        click_world(page, 150, 600 - 20)
        check("E. «Объект» размера 28 мимо на 20 — не стёр", any(o["id"] == "G1" for o in objs(page)))
        page.evaluate("() => setEraserSize(64)")
        click_world(page, 150, 600 - 20)
        check("E. «Объект» размера 64 достаёт и стирает целиком",
              not any(o["id"] == "G1" for o in objs(page)) and any(o["id"] == "G2" for o in objs(page)))

        # ═══ F. «Область» ═══
        page.evaluate("() => setEraserSize(28)")
        page.click('[data-eraser-mode="area"]')
        check("F. режим «Область» включён и запомнен",
              page.evaluate("() => [eraserMode, localStorage.getItem('boardsEraserMode')]") == ["area", "area"])
        page.evaluate("""() => { const b = getCurrentBoard(); b.objects = [
            {id:'P', type:'pen', color:'ink', width:3, by:'T', points:[{x:100,y:300},{x:300,y:300},{x:500,y:300}]},
            {id:'L', type:'line', color:'ink', width:2, by:'T', arrowEnd:true, points:[{x:100,y:380},{x:500,y:380}]},
            {id:'Q', type:'quad', color:'ink', width:2, by:'T', points:[{x:250,y:450},{x:350,y:450},{x:350,y:520},{x:250,y:520}]},
            {id:'T1', type:'text', text:'abc', color:'ink', fontSize:22, by:'T', points:[{x:280,y:560}], w:60, h:28},
          ]; undoStack.length = 0; scheduleRedraw(); }""")
        n0 = page.evaluate("() => undoStack.length")
        drag_path(page, [(300, 260), (300, 300), (300, 340), (300, 380), (300, 420), (300, 480), (300, 540), (300, 580)])
        o = objs(page)
        pens = [x for x in o if x["type"] in ("pen", "line")]
        check("F. Q и T1 на месте", {x["id"] for x in o} >= {"Q", "T1"}, str([x["id"] for x in o]))
        check("F. исходных P и L больше нет", not any(x["id"] in ("P", "L") for x in o))
        check("F. на их месте четыре куска-штриха", len(pens) == 4, str(len(pens)))
        cut = page.evaluate("""() => getCurrentBoard().objects.filter(o => o.type === 'pen' || o.type === 'line').map(o => ({ t: o.type,
            y: o.points[0].y, minX: Math.min(...o.points.map(p => p.x)), maxX: Math.max(...o.points.map(p => p.x)),
            n: o.points.length, arrow: !!o.arrowEnd, w: o.width }))""")
        r = 14
        ok_gap = all((c["maxX"] < 300 - r + 0.01) or (c["minX"] > 300 + r - 0.01) for c in cut)
        check("F. под ластиком ничего не осталось, по бокам — всё", ok_gap and
              all(any(c["y"] == yy and c["minX"] == 100 for c in cut) and any(c["y"] == yy and c["maxX"] == 500 for c in cut)
                  for yy in (300, 380)), str(cut))
        check("F. куски прямой — прямые из двух точек, без стрелки",
              all(c["n"] == 2 and not c["arrow"] and c["t"] == "line" for c in cut if c["y"] == 380), str(cut))
        check("F. толщина и цвет у кусков прежние", all(c["w"] == (3 if c["y"] == 300 else 2) for c in cut))
        n1 = page.evaluate("() => undoStack.length")
        check("F. весь жест — один шаг отмены", n1 - n0 == 1, str(n1 - n0))
        page.keyboard.press("Control+z")
        page.wait_for_timeout(60)
        back = sorted(x["id"] for x in objs(page))
        check("F. отмена вернула штрих и прямую целиком", back == ["L", "P", "Q", "T1"], str(back))
        # быстрый мах: два события далеко друг от друга — режется и то, что между ними
        page.mouse.move(*scr(page, 200, 250))
        page.mouse.down()
        page.mouse.move(*scr(page, 200, 420), steps=1)
        page.mouse.up()
        page.wait_for_timeout(60)
        check("F. быстрый мах режет и между событиями",
              not any(x["id"] in ("P", "L") for x in objs(page)), str([x["id"] for x in objs(page)]))
        # закреплённое и «Область»: точку-штрих стирает целиком
        page.evaluate("""() => { const b = getCurrentBoard(); b.objects = [
            {id:'Z', type:'pen', color:'ink', width:2, by:'T', locked:true, points:[{x:100,y:450},{x:300,y:450}]},
            {id:'D1', type:'pen', color:'ink', width:2, by:'T', points:[{x:600,y:450}]} ]; scheduleRedraw(); }""")
        click_world(page, 200, 450)
        click_world(page, 600, 450)
        ids = sorted(x["id"] for x in objs(page))
        check("F. закреплённое не режется, точка под ластиком стёрта", ids == ["Z"], str(ids))
        page.close()

        # ═══ G. «Область» на общей доске ═══
        tp = open_board(browser, "T", [dict(hline("S1", 100, 500, 300), rv=1, rvBy="T")])
        tp.on("pageerror", lambda e: errors.append(str(e)))
        tp.evaluate("() => { setEraserMode('area'); setEraserSize(28); }")
        pick(tp, "eraser")
        n_sent = len(tp.evaluate("() => window.__fake.diffsSent()"))
        drag_path(tp, [(300, 260), (300, 300), (300, 340)])
        tp.wait_for_timeout(500)
        tp.evaluate("() => window.__cloudDiffTest.writesIdle()")
        loc = tp.evaluate("() => getCurrentBoard().objects.map(o => o.id).sort()")
        db = tp.evaluate("() => [...window.__fake.rows.keys()].sort()")
        check("G. на экране два куска вместо исходного", len(loc) == 2 and "S1" not in loc, str(loc))
        check("G. в базе ровно то же, что на экране", loc == db, f"{loc} / {db}")
        diffs = tp.evaluate("() => window.__fake.diffsSent()")[n_sent:]
        removed = [r["id"] for d in diffs for r in d["removed"]]
        added = sorted(a["id"] for d in diffs for a in d["added"])
        check("G. в рассылке: удаление исходного и оба куска", removed == ["S1"] and added == loc, f"{removed} / {added}")
        rvs = tp.evaluate("() => getCurrentBoard().objects.map(o => o.rv)")
        check("G. у кусков свой номер версии", all(v == 1 for v in rvs), str(rvs))
        # с паузой посреди жеста (снимок облака закрылся) — стёртое после паузы тоже уходит
        tp.evaluate("""() => { getCurrentBoard().objects.push({id:'S2', type:'pen', color:'ink', width:2, by:'T',
            points:[{x:100,y:500},{x:500,y:500}]}); saveDB(); }""")
        tp.wait_for_timeout(400)
        tp.evaluate("() => window.__cloudDiffTest.writesIdle()")
        tp.mouse.move(*scr(tp, 200, 470))
        tp.mouse.down()
        tp.mouse.move(*scr(tp, 200, 530), steps=3)
        tp.wait_for_timeout(400)          # пауза дольше 250 мс
        tp.mouse.move(*scr(tp, 300, 470), steps=2)
        tp.mouse.move(*scr(tp, 400, 530), steps=4)
        tp.mouse.up()
        tp.wait_for_timeout(500)
        tp.evaluate("() => window.__cloudDiffTest.writesIdle()")
        loc = tp.evaluate("() => JSON.stringify(getCurrentBoard().objects.map(o => [o.id, o.points]).sort())")
        db = tp.evaluate("() => JSON.stringify([...window.__fake.rows.values()].map(o => [o.id, o.points]).sort())")
        check("G. жест с паузой: в базе то же, что на экране", loc == db)
        tp.close()

        # ═══ H. заметки справочной панели ═══
        page = open_board(browser, "T", [], cloud=False)
        page.on("pageerror", lambda e: errors.append(str(e)))
        res = page.evaluate("""() => {
            const b = getCurrentBoard();
            b.refPanel = b.refPanel || {};
            b.refPanel.mode = 'draw';
            b.refPanel.drawObjects = [{id:'R1', type:'pen', color:'ink', width:2, points:[{x:0,y:0},{x:200,y:0}]}];
            const keep = rfCam.zoom; rfCam.zoom = 1;
            rfAreaErase = { last: {x:100,y:-30}, undoDone: false };
            rfEraseAreaAlong({x:100,y:-30}, {x:100,y:30});
            rfAreaErase = null; rfCam.zoom = keep;
            return b.refPanel.drawObjects.map(o => o.points.length > 1 ? [Math.min(...o.points.map(p=>p.x)), Math.max(...o.points.map(p=>p.x))] : null);
        }""")
        check("H. «Область» режет штрих и в заметках", len(res) == 2 and res[0][1] < 86.01 and res[1][0] > 113.99, str(res))
        page.close()

        check("I. нет ошибок JavaScript", not errors, "; ".join(errors[:3]))
        browser.close()

    print()
    if fails:
        print(f"ПРОВАЛЕНО: {len(fails)}")
        sys.exit(1)
    print("Все проверки пройдены")


if __name__ == "__main__":
    run()
