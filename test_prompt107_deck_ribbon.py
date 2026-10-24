"""
Промпт №107: «Лента» — вариант А панели презентации (deck-toolbar.js;
HANDOFF.md раздел 6д) и номер слайда в одну строку.

Проверяем:
  1. В настройках «Лента» без «скоро»; выбрали — вкладки «Главная»,
     «Вставка», «Показ», под ними группы крупных значков с подписями
  2. «Вставка»: значки с подписями, галерея фигур, вставка работает
  3. Выделили объект — появилась и открылась вкладка «Формат» с панелью
     оформления и «Упорядочить»; сняли — прежняя вкладка, «Формата» нет
  4. «Показ»: «С начала» и «С текущего»
  5. Свёрнута — только вкладки, слайд крупнее; щелчок по вкладке открывает
     её поверх слайда (слайд не двигается), команда или щелчок мимо прячет;
     двойной щелчок по вкладке — снова закреплена
  6. Вкладка помнится после перезагрузки
  7. Обратно в «одну строку» — всё как было, кнопки «С начала» нет
  8. Номер «10 / 13» — в одну строку и в строке, и в ленте
  9. Нет ошибок на странице

Запуск: python3 test_prompt107_deck_ribbon.py
"""
import sys

from playwright.sync_api import sync_playwright

import test_prompt84_deck_slides as T

T.PORT = 8977
T.BASE = f"http://127.0.0.1:{T.PORT}"
fails = []


def check(cond, msg, extra=""):
    print(("OK   " if cond else "FAIL ") + msg + (f"  [{extra}]" if extra and not cond else ""))
    if not cond:
        fails.append(msg)


VISIBLE = "(sel) => { const e = document.querySelector(sel); if (!e) return false; const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0 && getComputedStyle(e).display !== 'none' && !e.closest('[hidden]'); }"
TABS = "() => [...document.querySelectorAll('#deckNav .dtb-tab')].filter(b => !b.hidden).map(b => b.textContent)"
CUR_TAB = "() => { const b = document.querySelector('#deckNav .dtb-tab[aria-selected=\"true\"]'); return b ? b.dataset.tab : null; }"
NO_ONE_LINE = "() => { const e = document.getElementById('deckNo'); const lh = parseFloat(getComputedStyle(e).lineHeight) || 18; return e.getBoundingClientRect().height < lh * 1.6 && e.textContent.trim() === '10 / 13'; }"
MID = """() => { const r = deckSlideRect(deckCur()); const cv = document.getElementById('boardCv').getBoundingClientRect();
  return { x: cv.left + (r.x + r.w / 2 - cam.x) * cam.zoom, y: cv.top + (r.y + r.h / 2 - cam.y) * cam.zoom }; }"""


def tab(page, t):
    page.click(f"#deckNav .dtb-tab[data-tab='{t}']")
    page.wait_for_timeout(150)


def boot_deck(page):
    page.goto(T.BASE + "/boards.html")
    page.evaluate(T.BOOT_JS)
    page.click("#blCreateDeck")
    page.wait_for_function("() => B && B.kind === 'deck' && boardActive && typeof dtbApplyStyle === 'function'")
    page.wait_for_timeout(300)


def main():
    errors = []
    with T.local_server(), sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page(viewport={"width": 1400, "height": 900})
        page.on("pageerror", lambda e: errors.append(str(e)))
        boot_deck(page)
        page.evaluate("() => { for (let i = 0; i < 12; i++) deckAddSlide(); deckGo(9, 0); }")
        page.wait_for_timeout(300)

        print("8а. Номер слайда в строке")
        check(page.evaluate(NO_ONE_LINE), "«10 / 13» в одну строку (1400 px)")
        page.set_viewport_size({"width": 1000, "height": 800})
        page.wait_for_timeout(300)
        check(page.evaluate(NO_ONE_LINE), "и на узком экране (1000 px)")
        # полосу поджали вплотную (как на Mac с более широким шрифтом) — номер
        # всё равно не переносится
        # шрифт на Mac шире: разрядка 2 px его изображает; без правки (nowrap,
        # flex: none) номер здесь переносился на две строки
        page.evaluate("() => { const n = document.getElementById('deckNav'); document.getElementById('deckNo').style.letterSpacing = '2px'; n.style.maxWidth = (n.scrollWidth - 40) + 'px'; }")
        check(page.evaluate("() => document.getElementById('deckNo').getBoundingClientRect().height") < 24, "и когда шрифт шире, а полосу поджали")
        page.evaluate("() => { document.getElementById('deckNo').style.letterSpacing = ''; dtbLayout(); }")
        page.set_viewport_size({"width": 1400, "height": 900})
        page.wait_for_timeout(300)
        zoom_line = page.evaluate("() => cam.zoom")

        print("1. Выбор ленты")
        page.click("#bdGear")
        lbl = page.inner_text("#dtbStyleRow [data-dtbstyle='ribbon']")
        check("скоро" not in lbl, "«Лента» без пометки «скоро»", lbl)
        page.click("#dtbStyleRow [data-dtbstyle='ribbon']")
        page.click("#bdGear")
        page.wait_for_timeout(300)
        check(page.evaluate("() => document.getElementById('deckNav').classList.contains('dtb-ribbon')"), "полоса стала лентой")
        check(page.evaluate(TABS) == ["Главная", "Вставка", "Показ"], "вкладки без «Формата»", str(page.evaluate(TABS)))
        check(page.evaluate(CUR_TAB) == "home", "открыта «Главная»")
        for sel in ["#deckSlideBtn", "#deckFileBtn", "#deckModeSeg", "#deckNo", "#deckFlowV"]:
            check(page.evaluate(VISIBLE, sel), f"на «Главной» есть {sel}")
        check(not page.evaluate(VISIBLE, "#dtb-text"), "вставки на «Главной» нет")
        check(page.evaluate(VISIBLE, "#deckFlowV .dtb-lbl-r") and page.inner_text("#deckFlowV .dtb-lbl-r") == "По одному", "у значков подписи")
        h = page.evaluate("() => document.getElementById('deckSlideBtn').getBoundingClientRect().height")
        check(h >= 50, "значки крупные", str(h))
        check(page.evaluate(NO_ONE_LINE), "«10 / 13» в одну строку и в ленте")
        nav_b = page.evaluate("() => document.getElementById('deckNav').getBoundingClientRect().bottom")
        top = page.evaluate("() => { const r = deckSlideRect(deckCur()), cv = document.getElementById('boardCv').getBoundingClientRect(); return cv.top + (r.y - cam.y) * cam.zoom; }")
        check(top >= nav_b, "слайд под лентой", f"{top} < {nav_b}")
        check(page.evaluate("() => cam.zoom") < zoom_line, "лента выше строки — слайд чуть меньше")

        print("2. Вставка")
        tab(page, "insert")
        check(page.evaluate(CUR_TAB) == "insert", "открыта «Вставка»")
        for sel, t in [("#dtb-text", "Надпись"), ("#deckShapesBtn", "Фигуры"), ("#deckTableBtn", "Таблица"), ("#dtb-task", "Задание")]:
            check(page.evaluate(VISIBLE, sel) and t in page.inner_text(sel), f"«{t}» с подписью")
        check(not page.evaluate(VISIBLE, "#deckSlideBtn"), "«Главной» не видно")
        page.click("#deckShapesBtn")
        check(page.evaluate(VISIBLE, "#dtbPopShapes"), "галерея фигур открылась")
        page.click("#dtbPopShapes [data-geom='star5']")
        m = page.evaluate(MID)
        page.mouse.click(m["x"], m["y"])
        page.wait_for_timeout(300)
        check(page.evaluate("() => B.objects.some(o => o.geom === 'star5')"), "звезда вставлена")

        print("3. Формат")
        check(page.evaluate(TABS) == ["Главная", "Вставка", "Формат", "Показ"], "выделили — появился «Формат»", str(page.evaluate(TABS)))
        check(page.evaluate(CUR_TAB) == "format", "и открылся")
        check(page.evaluate(VISIBLE, "#deckNav .bx-bar [data-bx='b']") and page.evaluate(VISIBLE, "#deckArrangeBtn"), "оформление и «Упорядочить» в ленте")
        page.click("#deckArrangeBtn")
        page.click("#dtbPopArrange [data-arr='rotr']")
        page.wait_for_timeout(150)
        check(page.evaluate("() => B.objects.find(o => o.geom === 'star5').rot") == 90, "«Упорядочить» работает из ленты")
        page.evaluate("() => { selectedId = null; multiSelectIds = []; scheduleRedraw(); }")
        page.wait_for_timeout(250)
        check(page.evaluate(CUR_TAB) == "insert" and "Формат" not in page.evaluate(TABS), "сняли выделение — снова «Вставка», «Формата» нет")

        print("4. Показ")
        tab(page, "show")
        check(page.evaluate(VISIBLE, "#dtb-showFirst") and page.evaluate(VISIBLE, "#dtb-show"), "«С начала» и «С текущего»")
        check("С текущего" in page.inner_text("#dtb-show"), "подпись «С текущего»")
        page.evaluate("() => deckGo(5, 0)")
        page.wait_for_timeout(200)
        page.click("#dtb-showFirst")
        page.wait_for_timeout(400)
        check(page.evaluate("() => document.documentElement.classList.contains('deck-show') && deckCurIndex() === 0"), "«С начала» — показ с первого")
        page.keyboard.press("Escape")
        page.wait_for_timeout(300)
        page.evaluate("() => deckGo(5, 0)")
        page.wait_for_timeout(200)
        page.click("#dtb-show")
        page.wait_for_timeout(400)
        check(page.evaluate("() => deckCurIndex()") == 5, "«С текущего» — с шестого")
        page.keyboard.press("Escape")
        page.wait_for_timeout(300)

        print("5. Свёрнутая лента")
        zoom_open = page.evaluate("() => cam.zoom")
        page.click("#dtbFoldBtn")
        page.wait_for_timeout(400)
        check(not page.evaluate(VISIBLE, "#dtb-show") and page.evaluate(TABS) == ["Главная", "Вставка", "Показ"], "свёрнута — только вкладки")
        zoom_closed = page.evaluate("() => cam.zoom")
        check(zoom_closed > zoom_open, "слайд крупнее", f"{zoom_open} → {zoom_closed}")
        tab(page, "home")
        check(page.evaluate(VISIBLE, "#deckFlowS"), "щелчок по вкладке — её значки поверх")
        check(abs(page.evaluate("() => cam.zoom") - zoom_closed) < 1e-6, "слайд при этом не двигается")
        page.click("#deckFlowS")
        page.wait_for_timeout(300)
        check(page.evaluate("() => deckFlow()") == "scroll" and not page.evaluate(VISIBLE, "#deckFlowS"), "команда выполнена — значки спрятались")
        page.evaluate("() => deckSetFlow('v')")
        tab(page, "insert")
        check(page.evaluate(VISIBLE, "#dtb-text"), "снова открыли")
        page.mouse.click(700, 600)
        page.wait_for_timeout(200)
        check(not page.evaluate(VISIBLE, "#dtb-text"), "щелчок мимо — спрятались")
        page.dblclick("#deckNav .dtb-tab[data-tab='insert']")
        page.wait_for_timeout(400)
        check(page.evaluate("() => !document.getElementById('deckNav').classList.contains('dtb-closed')") and page.evaluate(VISIBLE, "#dtb-text"), "двойной щелчок по вкладке — лента закреплена")

        print("6. Вкладка помнится")
        page.wait_for_timeout(800)
        bid = page.evaluate("() => B.id")
        page.reload()
        page.evaluate(T.BOOT_JS)
        page.wait_for_timeout(600)
        if not page.evaluate("() => typeof boardActive !== 'undefined' && boardActive"):
            page.evaluate("(id) => openBoard(id)", bid)
        page.wait_for_function("() => typeof dtbApplyStyle === 'function' && boardActive && B && B.kind === 'deck'", timeout=8000)
        page.wait_for_timeout(400)
        check(page.evaluate("() => document.getElementById('deckNav').classList.contains('dtb-ribbon')"), "после перезагрузки — лента")
        check(page.evaluate(CUR_TAB) == "insert", "и та же вкладка", str(page.evaluate(CUR_TAB)))

        print("7. Обратно в строку")
        page.evaluate("() => { localStorage.setItem('boardsDeckBarStyle', 'line'); deckTbSync(); }")
        page.wait_for_timeout(300)
        check(not page.evaluate("() => document.getElementById('deckNav').classList.contains('dtb-ribbon')"), "лента снята")
        check(not page.evaluate(VISIBLE, "#deckNav .dtb-tab"), "вкладок нет")
        check(page.evaluate(VISIBLE, "#dtb-text") and page.evaluate(VISIBLE, "#deckSlideBtn") and page.evaluate(VISIBLE, "#dtb-show"), "все группы снова в одной строке")
        check(not page.evaluate(VISIBLE, "#dtb-showFirst"), "кнопки «С начала» в строке нет")
        check(not page.evaluate(VISIBLE, "#dtb-text .dtb-lbl-r"), "подписей под значками нет")
        hh = page.evaluate("() => document.getElementById('deckNav').getBoundingClientRect().height")
        check(hh < 60, "строка — одной строкой", str(hh))

        browser.close()
    check(not errors, "нет ошибок на странице", "; ".join(errors[:3]))
    print("\nИтог:", "всё хорошо" if not fails else f"{len(fails)} провал(ов)")
    sys.exit(1 if fails else 0)


if __name__ == "__main__":
    main()
