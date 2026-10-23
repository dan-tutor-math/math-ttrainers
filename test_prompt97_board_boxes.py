"""
Промпт №97: блоки, таблицы и поворот «как в презентации» (board-boxes.js,
HANDOFF.md раздел 6в).

Проверяем:
  1. «Вставить → Надпись»: поле правки открывается, набор, Enter — два
     абзаца; выделенное слово жирным и красным с панели — в модели свой кусок
  2. Текст рисуется на холсте (в рамке блока есть «чернила»), шрифт свой
     (Carlito вместо Calibri) подгружается
  3. Отмена возвращает текст до правки одним шагом
  4. Backspace в поле правки стирает букву, а не выделенный блок
  5. Без поля правки кнопки панели меняют весь текст блока (Ж — все куски)
  6. Фигура: ручка поворота поворачивает, повёрнутую ловит щелчок внутри,
     угловая ручка тянет повёрнутую рамку (противоположный угол на месте)
  7. Таблица: набор в ячейке, «+ столбец», «+ строка», длинный текст
     растит строку
  8. Картинка: ручка поворота, у повёрнутой рамка шире
  9. Прямая (geom line) — две ручки на концах
 10. Блок на обычной (не презентации) доске рисуется
 11. Нет ошибок на странице

Запуск: python3 test_prompt97_board_boxes.py
"""
import sys

from playwright.sync_api import sync_playwright

import test_prompt84_deck_slides as T

T.PORT = 8997
T.BASE = f"http://127.0.0.1:{T.PORT}"
fails = []


def check(cond, msg, extra=""):
    print(("OK   " if cond else "FAIL ") + msg + (f"  [{extra}]" if extra and not cond else ""))
    if not cond:
        fails.append(msg)


SCREEN = """(p) => { const cv = document.getElementById('boardCv').getBoundingClientRect();
  return { x: cv.left + (p.x - cam.x) * cam.zoom, y: cv.top + (p.y - cam.y) * cam.zoom }; }"""

INK = """(id) => { const o = B.objects.find(x => x.id === id); const b = objectBBox(o);
  const cv = document.getElementById('boardCv'), k = cv.width / cv.getBoundingClientRect().width;
  const x0 = Math.round((b.minX - cam.x) * cam.zoom * k), y0 = Math.round((b.minY - cam.y) * cam.zoom * k);
  const w = Math.max(1, Math.round((b.maxX - b.minX) * cam.zoom * k)), h = Math.max(1, Math.round((b.maxY - b.minY) * cam.zoom * k));
  const d = cv.getContext('2d').getImageData(x0, y0, w, h).data; let n = 0;
  for (let i = 0; i < d.length; i += 4) if (d[i] + d[i + 1] + d[i + 2] < 300) n++;
  return n; }"""


def handle(page, obj_id, role):
    return page.evaluate("""([id, role]) => { const o = B.objects.find(x => x.id === id);
      const h = getHandles(o).find(h => h.role === role); const cv = document.getElementById('boardCv').getBoundingClientRect();
      return h ? { x: cv.left + (h.x - cam.x) * cam.zoom, y: cv.top + (h.y - cam.y) * cam.zoom } : null; }""", [obj_id, role])


def drag(page, a, b):
    page.mouse.move(a["x"], a["y"])
    page.mouse.down()
    page.mouse.move((a["x"] + b["x"]) / 2, (a["y"] + b["y"]) / 2, steps=4)
    page.mouse.move(b["x"], b["y"], steps=4)
    page.mouse.up()
    page.wait_for_timeout(150)


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

        print("1. Надпись и правка")
        page.click("#deckInsertBtn")
        page.click("#deckInsertMenu [data-ins='text']")
        page.wait_for_selector(".bx-ed")
        tid = page.evaluate("() => B.objects[B.objects.length - 1].id")
        page.keyboard.press("Control+a")
        page.keyboard.type("Привет мир")
        page.keyboard.press("Enter")
        page.keyboard.type("вторая строка")
        page.evaluate("""() => { const p = document.querySelector('.bx-ed-in .bx-p'); const tn = p.querySelector('span') ? p.querySelector('span').firstChild : p.firstChild;
          const r = document.createRange(); r.setStart(tn, 7); r.setEnd(tn, 10); const s = getSelection(); s.removeAllRanges(); s.addRange(r); }""")
        page.click(".bx-bar [data-bx='b']")
        page.click(".bx-bar [data-bx='color']")
        page.click(".bx-pal [data-c='#C00000']")
        page.keyboard.press("Escape")
        page.wait_for_timeout(300)
        paras = page.evaluate("(id) => B.objects.find(o => o.id === id).text.paras.map(p => p.runs.map(r => [r.t, !!r.b, r.c]))", tid)
        check(len(paras) == 2, "два абзаца", str(paras))
        check(any(r[0] == "мир" and r[1] and r[2] == "#C00000" for r in paras[0]), "«мир» жирный и красный", str(paras))
        check(any(r[0].startswith("Привет") and not r[1] for r in paras[0]), "«Привет» обычный", str(paras))
        check(paras[1] and paras[1][0][0] == "вторая строка", "второй абзац", str(paras))

        print("2. Рисование и шрифт")
        page.wait_for_timeout(600)
        page.evaluate("() => scheduleRedraw()")
        page.wait_for_timeout(200)
        check(page.evaluate(INK, tid) > 30, "текст нарисован на холсте")
        check(page.evaluate("() => [...document.fonts].some(f => f.family.replace(/\"/g, '') === 'MX Carlito' && f.status === 'loaded')"), "шрифт Carlito загружен")

        print("3. Отмена")
        page.evaluate("() => doUndo()")
        page.wait_for_timeout(200)
        txt = page.evaluate("(id) => { const o = B.objects.find(o => o.id === id); return o ? bxPlainText(o.text) : null; }", tid)
        check(txt == "Текст", "отмена вернула текст до правки", str(txt))
        page.evaluate("() => doRedo()")
        page.wait_for_timeout(200)

        print("4. Backspace в поле правки")
        page.evaluate("(id) => { selectedId = id; bxOpenEditor(B.objects.find(o => o.id === id), null); }", tid)
        page.wait_for_selector(".bx-ed")
        page.keyboard.press("Backspace")
        page.keyboard.press("Escape")
        page.wait_for_timeout(200)
        txt = page.evaluate("(id) => { const o = B.objects.find(o => o.id === id); return o ? bxPlainText(o.text) : null; }", tid)
        check(txt == "Привет мир\nвторая строк", "Backspace стёр букву, блок на месте", str(txt))

        print("5. Панель без поля правки")
        page.evaluate("(id) => { selectedId = id; multiSelectIds = []; scheduleRedraw(); }", tid)
        page.wait_for_timeout(300)
        check(page.evaluate("() => !document.querySelector('.bx-bar').hidden"), "панель видна у выделенного блока")
        page.click(".bx-bar [data-bx='b']")
        allb = page.evaluate("(id) => B.objects.find(o => o.id === id).text.paras.every(p => p.runs.every(r => r.b))", tid)
        check(allb, "Ж — весь текст жирный")
        page.click(".bx-bar [data-bx='al-c']")
        check(page.evaluate("(id) => B.objects.find(o => o.id === id).text.paras.every(p => p.al === 'c')", tid), "по центру — все абзацы")

        print("6. Фигура: поворот и размер")
        page.click("#deckInsertBtn")
        page.click("#deckInsertMenu [data-ins='star5']")
        page.wait_for_timeout(300)
        sid = page.evaluate("() => B.objects[B.objects.length - 1].id")
        c = page.evaluate("(id) => { const o = B.objects.find(o => o.id === id); return bxCenter(o); }", sid)
        cs = page.evaluate(SCREEN, c)
        drag(page, handle(page, sid, "bx-rot"), {"x": cs["x"] + 200, "y": cs["y"]})
        rot = page.evaluate("(id) => B.objects.find(o => o.id === id).rot", sid)
        check(rot is not None and abs(rot - 90) < 1, "поворот 90°", str(rot))
        # «рука» щелчком тащит, не выделяя, — выделяет инструмент «Выделение»
        page.click(".bd-tool[data-tool='select']")
        page.evaluate("() => { selectedId = null; scheduleRedraw(); }")
        page.mouse.click(cs["x"], cs["y"])
        page.wait_for_timeout(150)
        check(page.evaluate("() => selectedId") == sid, "повёрнутую фигуру выделяет щелчок в середину")
        nw0 = page.evaluate("(id) => { const o = B.objects.find(o => o.id === id); const h = getHandles(o).find(h => h.role === 'bx-nw'); return { x: h.x, y: h.y }; }", sid)
        se = handle(page, sid, "bx-se")
        drag(page, se, {"x": se["x"] + 40, "y": se["y"] + 40})
        res = page.evaluate("(id) => { const o = B.objects.find(o => o.id === id); const h = getHandles(o).find(h => h.role === 'bx-nw'); return { x: h.x, y: h.y, w: o.w, h: o.h }; }", sid)
        check(abs(res["x"] - nw0["x"]) < 1 and abs(res["y"] - nw0["y"]) < 1, "противоположный угол на месте", f"{nw0} {res}")
        check(res["w"] != 240 or res["h"] != 240, "размер изменился", str(res))

        print("7. Таблица")
        page.click("#deckInsertBtn")
        page.click("#deckInsertMenu [data-ins='table']")
        page.wait_for_selector(".bx-ed")
        tbid = page.evaluate("() => B.objects[B.objects.length - 1].id")
        page.keyboard.type("x")
        page.click(".bx-bar [data-bx='col+']")
        page.wait_for_timeout(150)
        page.click(".bx-bar [data-bx='row+']")
        page.wait_for_timeout(150)
        page.keyboard.type(" — очень длинный текст в ячейке, чтобы строка таблицы выросла по высоте")
        page.keyboard.press("Escape")
        page.wait_for_timeout(200)
        t = page.evaluate("""(id) => { const o = B.objects.find(o => o.id === id); const L = bxTableLayout(o);
          return { r: o.cells.length, c: o.cells[0].length, cols: o.cols.length, rows: o.rows.length, t: bxPlainText(o.cells[0][0].text), grown: L.rowH[0] > o.rows[0] + 1 }; }""", tbid)
        check(t["r"] == 4 and t["c"] == 4 and t["cols"] == 4 and t["rows"] == 4, "таблица 4 × 4 после «+ столбец» и «+ строка»", str(t))
        check(t["t"].startswith("x — очень"), "текст в ячейке", str(t))
        check(t["grown"], "строка выросла под текст", str(t))

        print("8. Поворот картинки")
        iid = page.evaluate("""() => { const cv = document.createElement('canvas'); cv.width = 200; cv.height = 100; const c = cv.getContext('2d'); c.fillStyle = '#1565c0'; c.fillRect(0, 0, 200, 100);
          const r = deckSlideRect(deckCur()); const o = { id: 'img1', type: 'image', src: cv.toDataURL(), points: [{ x: r.x + 100, y: r.y + 100 }], w: 200, h: 100, natW: 200, natH: 100 };
          B.objects.push(o); selectedId = 'img1'; saveDB(); scheduleRedraw(); return o.id; }""")
        page.wait_for_timeout(200)
        h = handle(page, iid, "bx-rot")
        check(h is not None, "у картинки есть ручка поворота")
        ic = page.evaluate(SCREEN, page.evaluate("() => bxCenter(B.objects.find(o => o.id === 'img1'))"))
        b0 = page.evaluate("() => objectBBox(B.objects.find(o => o.id === 'img1'))")
        drag(page, h, {"x": ic["x"] + 120, "y": ic["y"] - 120})
        r2 = page.evaluate("() => { const o = B.objects.find(o => o.id === 'img1'); return { rot: o.rot, b: objectBBox(o), roles: getHandles(o).map(h => h.role).join(',') }; }")
        check(r2["rot"] is not None and abs(r2["rot"] - 45) < 1, "картинка повёрнута на 45°", str(r2["rot"]))
        check((r2["b"]["maxY"] - r2["b"]["minY"]) > (b0["maxY"] - b0["minY"]) + 20, "рамка повёрнутой шире", str(r2))
        check("bx-se" in r2["roles"] and "iw" not in r2["roles"], "у повёрнутой — угловые ручки рамки", r2["roles"])

        print("9. Прямая")
        lid = page.evaluate("""() => { const r = deckSlideRect(deckCur()); const o = { id: 'ln1', type: 'box', geom: 'line', points: [{ x: r.x + 300, y: r.y + 600 }], w: 300, h: 100, line: { c: '#C00000', w: 4 } };
          B.objects.push(o); selectedId = 'ln1'; scheduleRedraw(); return o.id; }""")
        roles = page.evaluate("() => getHandles(B.objects.find(o => o.id === 'ln1')).map(h => h.role)")
        check(roles == ["bx-p0", "bx-p1"], "две ручки на концах", str(roles))
        p1 = handle(page, lid, "bx-p1")
        drag(page, p1, {"x": p1["x"] - 400, "y": p1["y"]})
        ln = page.evaluate("() => { const o = B.objects.find(o => o.id === 'ln1'); return { flipH: !!o.flipH, ends: bxLineEnds(o) }; }")
        check(ln["flipH"] and ln["ends"][1]["x"] < ln["ends"][0]["x"], "конец перетащен левее начала — прямая отражена", str(ln))

        print("10. Блок на обычной доске")
        page.evaluate("() => backToList()")
        page.click("#blCreateBoard")
        page.wait_for_function("() => B && !B.kind && boardActive")
        page.wait_for_timeout(300)
        page.evaluate("""() => { const c = { x: cam.x + cssW / 2 / cam.zoom, y: cam.y + cssH / 2 / cam.zoom };
          B.objects.push({ id: 'nb1', type: 'box', geom: 'ellipse', points: [{ x: c.x - 150, y: c.y - 80 }], w: 300, h: 160, fill: { c: '#2F5597' }, line: null,
            text: bxTextOf('Овал', { sz: 30, c: '#FFFFFF' }) }); scheduleRedraw(); }""")
        page.wait_for_timeout(300)
        check(page.evaluate(INK, "nb1") > 200, "блок нарисован на обычной доске")

        print("11. Ошибки")
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
