"""
Промпт №104: меню «Слайд ▾» в панели презентации (deck-toolbar.js, шаг 4
плана claude/presentations-toolbar-plan.md; HANDOFF.md раздел 6д).

Проверяем:
  1. «Слайд» открывает меню: пять макетов, шаблоны и формат, дублировать,
     скрыть, переименовать, удалить
  2. Новый слайд по макету — после текущего, с блоками-заполнителями на
     своих местах; один шаг отмены
  3. Подсказка заполнителя видна только в «Конструкторе» и не попадает в
     миниатюру; набрали текст — подсказки нет
  4. «Шаблоны, формат и подложка…» открывает прежнее окно
  5. Дублировать, скрыть из показа (миниатюра помечена, пункт меняется на
     «Показывать в показе»), то же — в меню «⋯» миниатюры
  6. Переименовать, удалить (последний слайд удалить нельзя)
  7. Нет ошибок на странице

Запуск: python3 test_prompt104_deck_slide_menu.py
"""
import sys

from playwright.sync_api import sync_playwright

import test_prompt84_deck_slides as T

T.PORT = 8974
T.BASE = f"http://127.0.0.1:{T.PORT}"
fails = []


def check(cond, msg, extra=""):
    print(("OK   " if cond else "FAIL ") + msg + (f"  [{extra}]" if extra and not cond else ""))
    if not cond:
        fails.append(msg)


VISIBLE = "(sel) => { const e = document.querySelector(sel); if (!e) return false; const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0 && getComputedStyle(e).display !== 'none'; }"
# доля «подсказочных» серых пикселей в рамке объекта на холсте
GREY = """(id) => { const o = B.objects.find(x => x.id === id), b = objectBBox(o);
  const cv = document.getElementById('boardCv'), k = cv.width / cv.getBoundingClientRect().width;
  const x0 = Math.round((b.minX - cam.x) * cam.zoom * k), y0 = Math.round((b.minY - cam.y) * cam.zoom * k);
  const w = Math.max(1, Math.round((b.maxX - b.minX) * cam.zoom * k)), h = Math.max(1, Math.round((b.maxY - b.minY) * cam.zoom * k));
  const d = cv.getContext('2d').getImageData(x0, y0, w, h).data; let n = 0;
  for (let i = 0; i < d.length; i += 4){ const r = d[i], g = d[i + 1], bb = d[i + 2]; if (r < 200 && r > 60 && Math.abs(r - g) < 25 && Math.abs(g - bb) < 30) n++; }
  return n; }"""


def open_menu(page):
    page.click("#deckSlideBtn")
    page.wait_for_timeout(100)


def main():
    errors = []
    with T.local_server(), sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page(viewport={"width": 1400, "height": 900})
        page.on("pageerror", lambda e: errors.append(str(e)))
        page.on("dialog", lambda d: d.accept("Решение задачи") if d.type == "prompt" else d.accept())
        page.goto(T.BASE + "/boards.html")
        page.evaluate(T.BOOT_JS)
        page.click("#blCreateDeck")
        page.wait_for_function("() => B && B.kind === 'deck' && boardActive && typeof dtbSlideMenu === 'function'")
        page.wait_for_timeout(400)

        print("1. Меню")
        open_menu(page)
        check(page.evaluate(VISIBLE, "#dtbPopSlide"), "«Слайд» открывает меню")
        check(not page.evaluate(VISIBLE, "#deckSlidePop"), "а не сразу окно формата")
        lays = page.evaluate("() => [...document.querySelectorAll('#dtbPopSlide [data-layout]')].map(b => b.dataset.layout)")
        check(lays == ["blank", "title", "titleText", "twoCols", "titleOnly"], "пять макетов", str(lays))
        items = page.inner_text("#dtbPopSlide")
        for t in ["Шаблоны, формат и подложка", "Дублировать слайд", "Скрыть из показа", "Переименовать", "Удалить слайд"]:
            check(t in items, f"есть пункт «{t}»")
        check(page.evaluate("() => document.querySelector('#dtbPopSlide [data-sl=\"del\"]').disabled"), "единственный слайд удалить нельзя")
        open_menu(page)
        check(not page.evaluate(VISIBLE, "#dtbPopSlide"), "второй щелчок закрывает меню")

        print("2. Новый слайд по макету")
        n0 = page.evaluate("() => B.objects.length")
        open_menu(page)
        page.click("#dtbPopSlide [data-layout='twoCols']")
        page.wait_for_timeout(500)
        check(page.evaluate("() => deckSlides().length") == 2 and page.evaluate("() => deckCurIndex()") == 1, "новый слайд — вторым и текущим")
        boxes = page.evaluate("""() => { const r = deckSlideRect(deckCur());
          return deckSlotObjects(deckCur()).filter(o => o.type === 'box').map(o => ({ ph: o.ph, fx: (o.points[0].x - r.x) / r.w, fy: (o.points[0].y - r.y) / r.h, fw: o.w / r.w })); }""")
        check([b["ph"] for b in boxes] == ["Заголовок слайда", "Текст слева", "Текст справа"], "три заполнителя", str(boxes))
        check(abs(boxes[1]["fx"] - 0.06) < 0.01 and abs(boxes[2]["fx"] - 0.515) < 0.01 and abs(boxes[1]["fw"] - 0.425) < 0.01, "колонки на своих местах")
        check(page.evaluate("() => deckSlotObjects(deckCur()).every(o => o.lay === 'base')"), "в «Конструкторе» — заготовка")
        page.click("#undoBtn")
        page.wait_for_timeout(300)
        check(page.evaluate("() => deckSlides().length") == 1 and page.evaluate("() => B.objects.length") == n0, "отмена убирает слайд вместе с блоками")
        open_menu(page)
        page.click("#dtbPopSlide [data-layout='titleText']")
        page.wait_for_timeout(500)
        tid = page.evaluate("() => deckSlotObjects(deckCur()).find(o => o.ph === 'Заголовок слайда').id")
        open_menu(page)
        page.click("#dtbPopSlide [data-layout='blank']")
        page.wait_for_timeout(400)
        check(page.evaluate("() => deckSlides().length") == 3 and page.evaluate("() => deckSlotObjects(deckCur()).length") == 0, "пустой макет — без блоков")

        print("3. Подсказка заполнителя")
        page.evaluate("() => deckGo(1, -1)")
        page.wait_for_timeout(600)
        page.evaluate("() => scheduleRedraw()")
        page.wait_for_timeout(150)
        g1 = page.evaluate(GREY, tid)
        check(g1 > 200, "в «Конструкторе» подсказка видна", str(g1))
        page.evaluate("() => deckSetMode('lesson')")
        page.wait_for_timeout(200)
        g2 = page.evaluate(GREY, tid)
        check(g2 < g1 / 5, "в «Уроке» подсказки нет", f"{g2} при {g1}")
        page.evaluate("() => deckSetMode('edit')")
        page.wait_for_timeout(200)
        thumb = page.evaluate("""(id) => { const c = document.querySelector(`#deckStripList .deck-thumb[data-id="${deckCur().id}"] canvas`);
          const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data; let n = 0;
          for (let i = 0; i < d.length; i += 4){ const r = d[i], g = d[i + 1], b = d[i + 2]; if (r < 200 && r > 60 && Math.abs(r - g) < 25 && Math.abs(g - b) < 30) n++; } return n; }""", tid)
        check(thumb < 15, "в миниатюре подсказки нет", str(thumb))
        page.evaluate("(id) => { const o = B.objects.find(x => x.id === id); o.text = Object.assign({}, o.text, { paras: [{ runs: [{ t: 'Дроби', sz: 40, c: '#1D1D1F', f: BX_DEF_FONT }], esz: 40, al: 'l' }] }); saveDB(); scheduleRedraw(); }", tid)
        page.wait_for_timeout(200)
        check(not page.evaluate("(id) => bxShowHints(B.objects.find(x => x.id === id)) && !bxHasText(B.objects.find(x => x.id === id).text)", tid), "набрали текст — подсказки нет")

        print("4. Шаблоны, формат и подложка")
        open_menu(page)
        page.click("#dtbPopSlide [data-sl='pop']")
        page.wait_for_timeout(150)
        check(page.evaluate(VISIBLE, "#deckSlidePop"), "открылось прежнее окно")
        check(page.evaluate(VISIBLE, "#deckTplList"), "в нём — шаблоны")
        page.keyboard.press("Escape")
        page.wait_for_timeout(100)

        print("5. Дублировать и скрыть")
        cid = page.evaluate("() => deckCur().id")
        nobj = page.evaluate("() => deckSlotObjects(deckCur()).length")
        open_menu(page)
        page.click("#dtbPopSlide [data-sl='dup']")
        page.wait_for_timeout(500)
        check(page.evaluate("() => deckSlides().length") == 4 and page.evaluate("() => deckCurIndex()") == 2, "дубликат — следующим")
        check(page.evaluate("() => deckSlotObjects(deckCur()).length") == nobj, "с теми же блоками")
        page.evaluate("(id) => deckGo(deckSlides().findIndex(s => s.id === id), -1)", cid)
        page.wait_for_timeout(500)
        open_menu(page)
        page.click("#dtbPopSlide [data-sl='hide']")
        page.wait_for_timeout(300)
        check(page.evaluate("(id) => deckSlides().find(s => s.id === id).hide", cid) is True, "слайд скрыт из показа")
        check(page.evaluate(f"() => document.querySelector('#deckStripList .deck-thumb[data-id=\"{cid}\"]').classList.contains('hid')"), "миниатюра помечена")
        check(page.evaluate(VISIBLE, f"#deckStripList .deck-thumb[data-id='{cid}'] .deck-thumb-hid"), "значок «скрыт»")
        open_menu(page)
        check(page.inner_text("#dtbPopSlide [data-sl='hide']").strip() == "Показывать в показе", "пункт меню сменился")
        open_menu(page)
        page.click("#undoBtn")
        page.wait_for_timeout(300)
        check(not page.evaluate("(id) => deckSlides().find(s => s.id === id).hide", cid), "отмена — снова виден")
        page.click(f"#deckStripList .deck-thumb[data-id='{cid}'] .deck-thumb-menu")
        page.wait_for_timeout(100)
        check(page.inner_text("#deckMenu [data-act='hide']").strip() == "Скрыть из показа", "в меню «⋯» миниатюры тоже есть")
        page.click("#deckMenu [data-act='hide']")
        page.wait_for_timeout(200)
        check(page.evaluate("(id) => deckSlides().find(s => s.id === id).hide", cid) is True, "и работает")

        print("6. Переименовать и удалить")
        open_menu(page)
        page.click("#dtbPopSlide [data-sl='ren']")
        page.wait_for_timeout(200)
        check(page.evaluate("() => deckCur().name") == "Решение задачи", "переименован")
        n = page.evaluate("() => deckSlides().length")
        open_menu(page)
        page.click("#dtbPopSlide [data-sl='del']")
        page.wait_for_timeout(400)
        check(page.evaluate("() => deckSlides().length") == n - 1, "удалён")
        check(not page.evaluate("(id) => deckSlides().some(s => s.id === id)", cid), "именно текущий")

        browser.close()
    check(not errors, "нет ошибок на странице", "; ".join(errors[:3]))
    print("\nИтог:", "всё хорошо" if not fails else f"{len(fails)} провал(ов)")
    sys.exit(1 if fails else 0)


if __name__ == "__main__":
    main()
