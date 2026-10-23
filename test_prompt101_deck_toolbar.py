"""
Промпт №101: панель инструментов презентации (deck-toolbar.js, шаг 1 плана
claude/presentations-toolbar-plan.md; HANDOFF.md раздел 6д).

Проверяем:
  1. У обычной доски полосы нет, у презентации есть (вид «одна строка»),
     кнопки «Вставить» больше нет
  2. Слайд вписывается под полосу
  3. Каждая кнопка вставки создаёт свой объект: надпись, таблица, все фигуры
     из «Фигуры ▾»; кнопки гаснут без права рисовать
  4. «Файл» открывает импорт и выгрузку
  5. «Показ» пока только место — сообщение «скоро»
  6. Сворачивание кнопкой и двойным щелчком, слайд крупнее; свёрнутость
     помнится после перезагрузки
  7. Вид панели в настройках (шестерёнка) сохраняется после перезагрузки
  8. Узкий экран: лишнее уходит в «⋯», команда из «⋯» работает
  9. У ученика в просмотре (deckViewerMode) полосы нет
 10. Нет ошибок на странице

Живой совместный режим здесь не проверить (websocket до Supabase закрыт) —
у ученика проверяем признак deckViewerMode, как его ставит board-stage.js.

Запуск: python3 test_prompt101_deck_toolbar.py
"""
import sys

from playwright.sync_api import sync_playwright

import test_prompt84_deck_slides as T

T.PORT = 8971
T.BASE = f"http://127.0.0.1:{T.PORT}"
fails = []


def check(cond, msg, extra=""):
    print(("OK   " if cond else "FAIL ") + msg + (f"  [{extra}]" if extra and not cond else ""))
    if not cond:
        fails.append(msg)


VISIBLE = "(sel) => { const e = document.querySelector(sel); if (!e) return false; const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0 && getComputedStyle(e).visibility !== 'hidden'; }"
NAV_BOTTOM = "() => document.getElementById('deckNav').getBoundingClientRect().bottom"
SLIDE_TOP = """() => { const r = deckSlideRect(deckCur()); const cv = document.getElementById('boardCv').getBoundingClientRect();
  return cv.top + (r.y - cam.y) * cam.zoom; }"""
COUNT = "(t) => B.objects.filter(o => o.type === t).length"


def close_editor(page):
    page.keyboard.press("Escape")
    page.wait_for_timeout(150)


def open_deck_after_reload(page):
    # настройки полосы — в localStorage; доску после перезагрузки открываем
    # сами, если адрес #board= уже сменился (проверяем не это)
    bid = page.evaluate("() => B.id")
    page.wait_for_timeout(800)
    page.reload()
    page.evaluate(T.BOOT_JS)
    page.wait_for_timeout(600)
    if not page.evaluate("() => typeof boardActive !== 'undefined' && boardActive"):
        page.evaluate("(id) => openBoard(id)", bid)
    page.wait_for_function("() => typeof deckTbSync === 'function' && boardActive && B && B.kind === 'deck'", timeout=8000)
    page.wait_for_timeout(400)


def main():
    errors = []
    with T.local_server(), sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page(viewport={"width": 1400, "height": 900})
        page.on("pageerror", lambda e: errors.append(str(e)))
        page.goto(T.BASE + "/boards.html")
        page.evaluate(T.BOOT_JS)

        print("1. Полоса только у презентации")
        page.click("#blCreateBoard")
        page.wait_for_function("() => B && !B.kind && boardActive")
        page.wait_for_timeout(200)
        check(page.evaluate("() => document.getElementById('deckNav').hidden"), "у обычной доски полосы нет")
        page.evaluate("() => document.getElementById('bdBack').click()")
        page.wait_for_function("() => document.getElementById('screenList').style.display === 'flex'")
        page.click("#blCreateDeck")
        page.wait_for_function("() => B && B.kind === 'deck' && boardActive && typeof deckTbSync === 'function'")
        page.wait_for_timeout(500)
        check(page.evaluate(VISIBLE, "#deckNav"), "у презентации полоса есть")
        check(page.evaluate("() => document.getElementById('deckNav').dataset.style") == "line", "вид по умолчанию — одна строка")
        check(page.evaluate("() => !document.getElementById('deckInsertBtn')"), "кнопки «Вставить» больше нет")
        groups = page.evaluate("() => [...document.querySelectorAll('#deckNav .dtb-grp:not([hidden])')].map(g => g.dataset.g)")
        check(groups[:4] == ["insert", "slide", "mode", "nav"], "группы слева направо: вставка, слайд/файл, режим, листание", str(groups))
        for sel in ["#dtb-text", "#dtb-table", "#deckShapesBtn", "#deckSlideBtn", "#deckFileBtn", "#deckModeSeg", "#deckPrev", "#deckNo", "#deckNext", "#deckFlowV", "#dtb-show", "#dtbFoldBtn"]:
            check(page.evaluate(VISIBLE, sel), f"в полосе видно {sel}")
        check(not page.evaluate(VISIBLE, "#dtbMoreBtn"), "на широком экране «⋯» не нужна")

        print("2. Слайд под полосой")
        nb, st = page.evaluate(NAV_BOTTOM), page.evaluate(SLIDE_TOP)
        check(st >= nb, "верх слайда ниже полосы", f"{st} < {nb}")
        a = page.evaluate("() => deckArea()")
        check(a["y"] >= nb, "deckArea начинается под полосой", f"{a['y']} < {nb}")

        print("3. Вставка")
        page.click("#dtb-text")
        page.wait_for_timeout(250)
        n = page.evaluate("() => B.objects.filter(o => o.type === 'box' && o.text && o.geom === 'rect' && !o.fill).length")
        check(n == 1, "«Надпись» вставила надпись", str(n))
        close_editor(page)
        page.click("#dtb-table")
        page.wait_for_timeout(250)
        check(page.evaluate(COUNT, "table") == 1, "«Таблица» вставила таблицу")
        close_editor(page)
        kinds = page.evaluate("() => [...document.querySelectorAll('#deckInsertMenu [data-ins]')].map(b => b.dataset.ins)")
        check(len(kinds) >= 6 and "text" not in kinds and "table" not in kinds, "в «Фигуры ▾» только фигуры", str(kinds))
        for k in kinds:
            page.click("#deckShapesBtn")
            ok = page.evaluate(VISIBLE, "#deckInsertMenu")
            page.click(f"#deckInsertMenu [data-ins='{k}']")
            page.wait_for_timeout(120)
            got = page.evaluate("(k) => B.objects.some(o => o.type === 'box' && o.geom === k)", k)
            check(ok and got, f"фигура {k} вставлена")
        check(not page.evaluate(VISIBLE, "#deckInsertMenu"), "меню фигур закрылось после выбора")
        page.click("#deckShapesBtn")
        page.click("#deckShapesBtn")
        check(not page.evaluate(VISIBLE, "#deckInsertMenu"), "второй щелчок по «Фигуры» закрывает меню")
        # слайд рамкой не меняем: объекты должны лечь в середину текущего слайда
        mid = page.evaluate("""() => { const r = deckSlideRect(deckCur()); const o = B.objects.filter(o => o.type === 'table')[0];
          return Math.abs(o.points[0].x + o.w / 2 - (r.x + r.w / 2)) < 1 && Math.abs(o.points[0].y + o.h / 2 - (r.y + r.h / 2)) < 1; }""")
        check(mid, "вставленное — посередине слайда")
        dis = page.evaluate("() => { const old = window.mayDraw; window.mayDraw = () => false; deckTbSync(); const d = ['dtb-text', 'dtb-table', 'deckShapesBtn'].map(id => document.getElementById(id).disabled); window.mayDraw = old; deckTbSync(); return d; }")
        check(all(dis), "без права рисовать кнопки вставки погашены", str(dis))

        print("4. Файл")
        page.click("#deckFileBtn")
        check(page.evaluate(VISIBLE, "#deckFileMenu [data-file='import']"), "в «Файл» есть импорт")
        check(page.evaluate(VISIBLE, "#deckFileMenu [data-file='pdf']") and page.evaluate(VISIBLE, "#deckFileMenu [data-file='pptx']"), "в «Файл» есть выгрузка PDF и PPTX")
        page.keyboard.press("Escape")
        page.mouse.click(700, 500)

        print("5. Показ — пока место")
        page.click("#dtb-show")
        page.wait_for_timeout(150)
        check("Режим показа" in page.inner_text("#deckToast"), "«Показ» сообщает, что режим скоро")

        print("6. Сворачивание")
        zoom_open = page.evaluate("() => cam.zoom")
        y_open = page.evaluate("() => deckArea().y")
        page.click("#dtbFoldBtn")
        page.wait_for_timeout(300)
        check(page.evaluate("() => document.getElementById('deckNav').classList.contains('dtb-closed')"), "кнопка свернула полосу")
        check(page.evaluate("() => localStorage.getItem('boardsDeckBarOpen')") == "0", "свёрнутость записана")
        check(not page.evaluate(VISIBLE, "#dtb-text"), "в свёрнутой полосе значков нет")
        check(page.evaluate("() => deckArea().y") < y_open, "места под слайд стало больше")
        check(page.evaluate("() => cam.zoom") > zoom_open, "слайд вписан заново и стал крупнее")
        check(page.evaluate(SLIDE_TOP) >= page.evaluate(NAV_BOTTOM), "слайд ниже свёрнутой полоски")
        page.click("#dtbFoldBtn")
        page.wait_for_timeout(300)
        check(page.evaluate(VISIBLE, "#dtb-text"), "кнопка развернула полосу")
        # двойной щелчок по пустому месту — по краю полосы, мимо кнопок
        r = page.evaluate("() => { const g = document.querySelector('#deckNav .dtb-grp[data-g=\"nav\"]').getBoundingClientRect(); const n = document.getElementById('deckNav').getBoundingClientRect(); return { x: g.left + 1, y: n.top + 2 }; }")
        page.mouse.dblclick(r["x"], r["y"])
        page.wait_for_timeout(300)
        check(page.evaluate("() => document.getElementById('deckNav').classList.contains('dtb-closed')"), "двойной щелчок по пустому месту свернул")
        page.mouse.dblclick(*page.evaluate("() => { const n = document.getElementById('deckNav').getBoundingClientRect(); return [n.left + 3, n.top + 3]; }"))
        page.wait_for_timeout(300)
        check(not page.evaluate("() => document.getElementById('deckNav').classList.contains('dtb-closed')"), "и развернул обратно")
        page.dblclick("#deckModeEdit")
        check(not page.evaluate("() => document.getElementById('deckNav').classList.contains('dtb-closed')"), "двойной щелчок по кнопке не сворачивает")
        page.click("#dtbFoldBtn")
        page.wait_for_timeout(1200)
        open_deck_after_reload(page)
        check(page.evaluate("() => document.getElementById('deckNav').classList.contains('dtb-closed')"), "после перезагрузки полоса свёрнута")
        page.click("#dtbFoldBtn")
        page.wait_for_timeout(200)

        print("7. Настройка вида панели")
        page.click("#bdGear")
        check(page.evaluate(VISIBLE, "#dtbStyleRow"), "в настройках есть «Вид панели презентации»")
        labels = page.evaluate("() => [...document.querySelectorAll('#dtbStyleRow [data-dtbstyle]')].map(b => b.textContent)")
        check(len(labels) == 3 and "скоро" in labels[0] and "скоро" in labels[2] and "скоро" not in labels[1], "три вида, лента и гибрид — «скоро»", str(labels))
        page.click("#dtbStyleRow [data-dtbstyle='hybrid']")
        check(page.evaluate("() => localStorage.getItem('boardsDeckBarStyle')") == "hybrid", "выбор записан")
        check("запомнили" in page.inner_text("#dtbStyleNote"), "подсказка: появится позже")
        check(page.evaluate(VISIBLE, "#dtb-text"), "пока «гибрид» — полоса прежняя, одной строкой")
        open_deck_after_reload(page)
        check(page.evaluate("() => document.querySelector('#dtbStyleRow [data-dtbstyle=\"hybrid\"]').classList.contains('active')"), "после перезагрузки выбран «Гибрид»")
        page.evaluate("() => localStorage.setItem('boardsDeckBarStyle', 'line')")
        page.evaluate("() => { const b = B; backToList(); openBoard(b.id); }")
        page.wait_for_function("() => boardActive && B.kind === 'deck'")
        page.wait_for_timeout(300)
        page.evaluate("() => document.getElementById('bdBack').click()")
        page.wait_for_function("() => document.getElementById('screenList').style.display === 'flex'")
        page.click("#blCreateBoard")
        page.wait_for_function("() => B && !B.kind && boardActive")
        page.click("#bdGear")
        check(not page.evaluate(VISIBLE, "#dtbStyleRow"), "у обычной доски пункта нет")
        page.keyboard.press("Escape")
        page.evaluate("() => document.getElementById('bdBack').click()")
        page.wait_for_function("() => document.getElementById('screenList').style.display === 'flex'")
        page.click("#blCreateDeck")
        page.wait_for_function("() => B && B.kind === 'deck' && boardActive")
        page.wait_for_timeout(300)

        print("8. Узкий экран")
        page.set_viewport_size({"width": 720, "height": 900})
        page.wait_for_timeout(400)
        page.evaluate("() => deckSetMode('lesson')")
        page.wait_for_timeout(200)
        w = page.evaluate("() => document.getElementById('deckNav').getBoundingClientRect().width")
        check(w <= 720 - 24 + 1, "полоса влезает в экран", str(w))
        check(page.evaluate(VISIBLE, "#dtbMoreBtn"), "появилась «⋯»")
        check(page.evaluate(VISIBLE, "#deckModeSeg") and page.evaluate(VISIBLE, "#deckNo"), "режим и номер слайда остались на месте")
        page.click("#dtbMoreBtn")
        items = page.evaluate("() => [...document.querySelectorAll('#dtbMoreMenu [data-cmd]')].map(b => b.dataset.cmd)")
        check("flowH" in items and "clear" in items, "в «⋯» ушли режимы ленты и пометки", str(items))
        page.click("#dtbMoreMenu [data-cmd='flowH']")
        page.wait_for_timeout(200)
        check(page.evaluate("() => deckFlow()") == "h", "«Листать вбок» из «⋯» сработало")
        page.set_viewport_size({"width": 1400, "height": 900})
        page.wait_for_timeout(400)
        check(not page.evaluate(VISIBLE, "#dtbMoreBtn"), "на широком экране всё вернулось в полосу")
        page.evaluate("() => deckSetFlow('v')")

        print("9. Ученик")
        hidden = page.evaluate("() => { window.deckViewerMode = true; deckTbSync(); const h = document.getElementById('deckNav').hidden; window.deckViewerMode = false; deckTbSync(); return h; }")
        check(hidden, "в просмотре у ученика полосы нет")

        browser.close()
    check(not errors, "нет ошибок на странице", "; ".join(errors[:3]))
    print("\nИтог:", "всё хорошо" if not fails else f"{len(fails)} провал(ов)")
    sys.exit(1 if fails else 0)


if __name__ == "__main__":
    main()
