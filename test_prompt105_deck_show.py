"""
Промпт №105: режим показа презентации (deck-toolbar.js, шаг 5 плана
claude/presentations-toolbar-plan.md; HANDOFF.md раздел 6д).

Проверяем:
  1. «Показ» — интерфейс доски спрятан, фон тёмный, слайд на всю вкладку,
     снизу полоса показа; в показе — «Урок»
  2. Листание: стрелки, пробел, PageDown/PageUp, щелчок по правой и левой
     половине, свайп; скрытые слайды пропускаются, номер считает только
     показываемые; в конце — подсказка
  3. Перо и маркер рисуют пометки (не заготовку), «Очистить» их стирает,
     ластик — инструмент доски
  4. Полоса прячется через 2 с без движения мыши
  5. Esc — выход: интерфейс, режим «Конструктор», инструмент и цвет пера
     как были; F5 — с начала, Shift+F5 — с текущего
  6. Из сплошной прокрутки показ листает по одному, выбор учителя не меняется
  7. Ученик: признак показа в bd_view ставит ему тот же вид (deckViewerView)
     — живой realtime здесь не проверить, только обработку сообщения
  8. Нет ошибок на странице

Запуск: python3 test_prompt105_deck_show.py
"""
import sys

from playwright.sync_api import sync_playwright

import test_prompt84_deck_slides as T

T.PORT = 8975
T.BASE = f"http://127.0.0.1:{T.PORT}"
fails = []


def check(cond, msg, extra=""):
    print(("OK   " if cond else "FAIL ") + msg + (f"  [{extra}]" if extra and not cond else ""))
    if not cond:
        fails.append(msg)


VISIBLE = "(sel) => { const e = document.querySelector(sel); if (!e) return false; const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0 && getComputedStyle(e).display !== 'none'; }"
SHOW = "() => document.documentElement.classList.contains('deck-show')"
CUR = "() => deckCurIndex()"
SLIDE_SCR = """() => { const r = deckSlideRect(deckCur()); const cv = document.getElementById('boardCv').getBoundingClientRect();
  return { l: cv.left + (r.x - cam.x) * cam.zoom, t: cv.top + (r.y - cam.y) * cam.zoom, w: r.w * cam.zoom, h: r.h * cam.zoom }; }"""


def key(page, k, wait=250):
    page.keyboard.press(k)
    page.wait_for_timeout(wait)


def main():
    errors = []
    with T.local_server(), sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page(viewport={"width": 1400, "height": 900})
        page.on("pageerror", lambda e: errors.append(str(e)))
        page.goto(T.BASE + "/boards.html")
        page.evaluate(T.BOOT_JS)
        page.click("#blCreateDeck")
        page.wait_for_function("() => B && B.kind === 'deck' && boardActive && typeof dtbShowStart === 'function'")
        page.wait_for_timeout(300)
        # пять слайдов, третий скрыт; на первом — заготовка
        page.evaluate("""() => { for (let i = 0; i < 4; i++) deckAddSlide(); deckGo(0, 0);
          const r = deckSlideRect(deckCur()); const o = bxInsert('rect', { x: r.x + r.w / 2, y: r.y + r.h / 2 }); bxCloseEditor && bxCloseEditor(false);
          deckSlides()[2].hide = true; saveDB(); selectedId = null; scheduleRedraw(); }""")
        page.wait_for_timeout(400)
        page.evaluate("() => deckGo(1, 0)")
        page.wait_for_timeout(300)
        page.evaluate("() => { curColorTok = '#123456'; curWidth = 5; }")
        tool0 = page.evaluate("() => tool")

        print("1. Вход в показ")
        page.click("#dtb-show")
        page.wait_for_timeout(400)
        check(page.evaluate(SHOW), "режим показа включён")
        check(page.evaluate(CUR) == 1, "с текущего слайда")
        for sel in [".bd-topbar", "#bdDock", "#deckStrip", "#deckNav", "#deckScrub", "#bdRail"]:
            check(not page.evaluate(VISIBLE, sel), f"{sel} спрятан")
        check(page.evaluate(VISIBLE, "#dtbShowBar"), "полоса показа есть")
        bg = page.evaluate("() => getComputedStyle(document.getElementById('screenBoard')).backgroundColor")
        check(bg == "rgb(18, 20, 24)", "фон тёмный", bg)
        r = page.evaluate(SLIDE_SCR)
        check(r["w"] >= 1380 or r["h"] >= 880, "слайд на всю вкладку", str(r))
        check(abs(r["l"] + r["w"] / 2 - 700) < 3, "по центру", str(r))
        check(page.evaluate("() => deckLessonMode()"), "в показе — «Урок»")
        check(page.inner_text("#dtbShowNo").strip() == "2 / 4", "номер среди показываемых", page.inner_text("#dtbShowNo"))

        print("2. Листание")
        n_start = page.evaluate("() => B.objects.length")
        key(page, "ArrowRight")
        check(page.evaluate(CUR) == 3, "→ перескочил скрытый третий", str(page.evaluate(CUR)))
        check(page.inner_text("#dtbShowNo").strip() == "3 / 4", "номер 3 / 4")
        key(page, "ArrowLeft")
        check(page.evaluate(CUR) == 1, "← обратно мимо скрытого")
        key(page, " ")
        check(page.evaluate(CUR) == 3, "пробел — дальше")
        key(page, "PageDown")
        check(page.evaluate(CUR) == 4, "PageDown — дальше")
        key(page, "ArrowRight")
        check(page.evaluate(CUR) == 4 and "Конец показа" in page.inner_text("#deckToast"), "в конце — подсказка, слайд тот же")
        key(page, "PageUp")
        check(page.evaluate(CUR) == 3, "PageUp — назад")
        page.mouse.click(1100, 400)
        page.wait_for_timeout(250)
        check(page.evaluate(CUR) == 4, "щелчок справа — дальше")
        page.mouse.click(300, 400)
        page.wait_for_timeout(250)
        check(page.evaluate(CUR) == 3, "щелчок слева — назад")
        page.mouse.move(900, 400)
        page.mouse.down()
        page.mouse.move(600, 410, steps=5)
        page.mouse.up()
        page.wait_for_timeout(250)
        check(page.evaluate(CUR) == 4, "свайп влево — дальше")
        check(page.evaluate("() => B.objects.length") == n_start, "щелчки указателем ничего не рисуют")
        key(page, "Home")
        check(page.evaluate(CUR) == 0, "Home — первый")
        key(page, "End")
        check(page.evaluate(CUR) == 4, "End — последний")
        page.click("#dtbShowBar [data-sh='prev']")
        page.wait_for_timeout(200)
        check(page.evaluate(CUR) == 3, "‹ на полосе")

        print("3. Пометки")
        page.click("#dtbShowBar [data-tool-show='pen']")
        check(page.evaluate("() => tool") == "pen" and page.evaluate("() => curColorTok") == "#E0322B", "перо — красное")
        n0 = page.evaluate("() => B.objects.length")
        page.mouse.move(500, 300)
        page.mouse.down()
        page.mouse.move(650, 380, steps=6)
        page.mouse.up()
        page.wait_for_timeout(250)
        o = page.evaluate("() => B.objects[B.objects.length - 1]")
        check(page.evaluate("() => B.objects.length") == n0 + 1 and o["type"] == "pen", "перо нарисовало штрих")
        check("lay" not in o or o.get("lay") is None, "штрих — пометка, не заготовка")
        check(page.evaluate(CUR) == 3, "пером слайд не листается")
        page.click("#dtbShowBar [data-tool-show='marker']")
        check(page.evaluate("() => curOpacity") is True and page.evaluate("() => curColorTok") == "#FFD400", "маркер — жёлтый полупрозрачный")
        page.mouse.move(500, 500)
        page.mouse.down()
        page.mouse.move(700, 500, steps=6)
        page.mouse.up()
        page.wait_for_timeout(250)
        check(page.evaluate("() => B.objects[B.objects.length - 1].opacity") is not None, "штрих маркера полупрозрачный")
        page.click("#dtbShowBar [data-tool-show='eraser']")
        check(page.evaluate("() => tool") == "eraser", "ластик")
        page.click("#dtbShowBar [data-sh='clear']")
        page.wait_for_timeout(200)
        check(page.evaluate("() => deckNotes(deckCur()).length") == 0, "«Очистить» стёр пометки слайда")
        page.click("#dtbShowBar [data-tool-show='laser']")
        page.mouse.move(400, 400)
        page.mouse.move(420, 410)
        check(page.evaluate(VISIBLE, "#dtbLaser"), "лазерная указка видна")
        page.click("#dtbShowBar [data-tool-show='nav']")
        check(not page.evaluate("() => !!document.getElementById('dtbLaser')"), "указка убрана")

        print("4. Полоса прячется")
        page.mouse.move(700, 300)
        page.wait_for_timeout(2400)
        check(page.evaluate("() => document.documentElement.classList.contains('dtb-show-idle')"), "через 2 с без движения — спрятана")
        page.mouse.move(710, 320)
        page.wait_for_timeout(100)
        check(not page.evaluate("() => document.documentElement.classList.contains('dtb-show-idle')"), "мышь двинули — снова видна")

        print("5. Выход и горячие клавиши")
        key(page, "Escape", 400)
        check(not page.evaluate(SHOW), "Esc — выход")
        check(page.evaluate(VISIBLE, "#deckNav") and page.evaluate(VISIBLE, "#bdDock"), "интерфейс вернулся")
        check(not page.evaluate("() => deckLessonMode()"), "снова «Конструктор»")
        check(page.evaluate("() => tool") == tool0 and page.evaluate("() => curColorTok") == "#123456" and page.evaluate("() => curWidth") == 5, "инструмент и перо как были")
        check(page.evaluate(CUR) == 3, "остались на последнем показанном слайде")
        r2 = page.evaluate(SLIDE_SCR)
        check(r2["t"] >= page.evaluate("() => document.getElementById('deckNav').getBoundingClientRect().bottom"), "слайд снова под полосой")
        key(page, "F5", 400)
        check(page.evaluate(SHOW) and page.evaluate(CUR) == 0, "F5 — с первого слайда")
        key(page, "Escape", 300)
        page.evaluate("() => deckGo(3, 0)")
        page.wait_for_timeout(200)
        key(page, "Shift+F5", 400)
        check(page.evaluate(SHOW) and page.evaluate(CUR) == 3, "Shift+F5 — с текущего")
        key(page, "Escape", 300)
        page.evaluate("() => deckGo(2, 0)")
        page.wait_for_timeout(200)
        key(page, "Shift+F5", 400)
        check(page.evaluate(CUR) == 3, "со скрытого — с ближайшего показываемого")
        key(page, "Escape", 300)

        print("6. Из сплошной прокрутки")
        page.click("#deckFlowS")
        page.wait_for_timeout(300)
        page.click("#dtb-show")
        page.wait_for_timeout(400)
        check(page.evaluate("() => deckFlow()") == "v", "в показе — по одному слайду")
        c0 = page.evaluate(CUR)
        key(page, "ArrowRight")
        check(page.evaluate(CUR) == c0 + 1 or page.evaluate(CUR) == 4, "листается по одному")
        key(page, "Escape", 400)
        check(page.evaluate("() => deckFlow()") == "scroll" and page.evaluate("() => localStorage.getItem('boardsDeckFlow')") == "scroll", "после — снова сплошная прокрутка")
        page.click("#deckFlowV")

        print("7. Ученик")
        page.click("#dtb-show")
        page.wait_for_timeout(300)
        check(page.evaluate("() => dtbShowOn()"), "признак показа для bd_view (sendView шлёт sh)")
        key(page, "Escape", 300)
        st = page.evaluate("() => { window.deckViewerMode = true; deckViewerView({ sh: 1 }); const a = document.documentElement.classList.contains('deck-show');"
                           " deckViewerView({}); const b = document.documentElement.classList.contains('deck-show'); deckViewerView({ sh: 1 }); deckViewerClose();"
                           " const c = document.documentElement.classList.contains('deck-show'); deckTbSync(); return [a, b, c]; }")
        check(st == [True, False, False], "у ученика вид показа включается и снимается по сообщению учителя", str(st))

        browser.close()
    check(not errors, "нет ошибок на странице", "; ".join(errors[:3]))
    print("\nИтог:", "всё хорошо" if not fails else f"{len(fails)} провал(ов)")
    sys.exit(1 if fails else 0)


if __name__ == "__main__":
    main()
