"""
Инструменты доски в режиме показа презентации (deck-toolbar.js,
dtbShowSetToolsVisible; HANDOFF.md раздел 6д, «№105»).

Проверяем:
  1. В показе видна панель инструментов доски (#bdDock) и доп. панель
     цвета и толщины; остальной интерфейс спрятан; слайд не заходит под панель
  2. Инструмент с панели (прямая) рисует пометку, щелчок не листает слайд
  3. Текстом в показе можно набирать пробел — слайд не листается
  4. «Скрыть» на панели прячет её, слайд вписывается шире; «Инструменты»
     в полосе показа возвращает; выбор помнится до следующего показа
  5. Esc — выход, интерфейс как был; нет ошибок на странице

Запуск: python3 test_prompt_deck_show_tools.py
"""
import sys

from playwright.sync_api import sync_playwright

import test_prompt84_deck_slides as T

T.PORT = 8976
T.BASE = f"http://127.0.0.1:{T.PORT}"
fails = []


def check(cond, msg, extra=""):
    print(("OK   " if cond else "FAIL ") + msg + (f"  [{extra}]" if extra and not cond else ""))
    if not cond:
        fails.append(msg)


VISIBLE = "(sel) => { const e = document.querySelector(sel); if (!e) return false; const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0 && getComputedStyle(e).display !== 'none'; }"
CUR = "() => deckCurIndex()"
SLIDE_SCR = """() => { const r = deckSlideRect(deckCur()); const cv = document.getElementById('boardCv').getBoundingClientRect();
  return { l: cv.left + (r.x - cam.x) * cam.zoom, t: cv.top + (r.y - cam.y) * cam.zoom, w: r.w * cam.zoom, h: r.h * cam.zoom }; }"""


def main():
    errors = []
    with T.local_server(), sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page(viewport={"width": 1400, "height": 800})
        page.on("pageerror", lambda e: errors.append(str(e)))
        page.goto(T.BASE + "/boards.html")
        page.evaluate("() => localStorage.removeItem('boardsDeckShowTools')")
        page.evaluate(T.BOOT_JS)
        page.click("#blCreateDeck")
        page.wait_for_function("() => B && B.kind === 'deck' && boardActive && typeof dtbShowStart === 'function'")
        page.wait_for_timeout(300)
        page.evaluate("() => { for (let i = 0; i < 3; i++) deckAddSlide(); deckGo(1, 0); }")
        page.wait_for_timeout(300)

        print("1. Показ с инструментами")
        page.click("#dtb-show")
        page.wait_for_timeout(500)
        check(page.evaluate("() => document.documentElement.classList.contains('deck-show-tools')"), "инструменты включены по умолчанию")
        check(page.evaluate(VISIBLE, "#bdDock"), "панель инструментов доски видна")
        check(page.evaluate(VISIBLE, "#dtbDockHide"), "на панели — «Скрыть»")
        check(page.inner_text("#dtbDockHide").strip() == "Скрыть", "подпись «Скрыть»")
        for sel in [".bd-topbar", "#deckStrip", "#deckNav", "#bdRail"]:
            check(not page.evaluate(VISIBLE, sel), f"{sel} спрятан")
        dock = page.evaluate("() => document.getElementById('bdDock').getBoundingClientRect().toJSON()")
        r = page.evaluate(SLIDE_SCR)
        check(r["t"] + r["h"] <= dock["top"] + 1, "слайд не заходит под панель", f"{r} {dock}")
        bar = page.evaluate("() => document.getElementById('dtbShowBar').getBoundingClientRect().toJSON()")
        check(bar["bottom"] < dock["top"], "полоса показа не наложилась на панель", f"{bar} {dock}")
        page.click(".bd-tool[data-tool='pen']")
        page.wait_for_timeout(200)
        check(page.evaluate(VISIBLE, "#bdOptbar"), "у ручки видна панель цвета и толщины")
        check(page.evaluate("() => dtbShowTool") == "board", "в полосе показа указатель снят")

        print("2. Прямая с панели")
        page.click(".bd-tool[data-tool='line']")
        n0 = page.evaluate("() => B.objects.length")
        page.mouse.move(500, 300)
        page.mouse.down()
        page.mouse.move(800, 420, steps=6)
        page.mouse.up()
        page.wait_for_timeout(300)
        o = page.evaluate("() => B.objects[B.objects.length - 1]")
        check(page.evaluate("() => B.objects.length") == n0 + 1 and o["type"] == "line", "прямая нарисована", str(o and o.get("type")))
        check(o.get("lay") is None, "это пометка, не заготовка")
        page.mouse.click(1100, 400)
        page.wait_for_timeout(250)
        check(page.evaluate(CUR) == 1, "щелчок с инструментом не листает")
        page.click(".bd-tool[data-tool='hand']")
        check(page.evaluate("() => dtbShowTool") == "nav", "рука = указатель показа")
        page.mouse.click(1100, 400)
        page.wait_for_timeout(300)
        check(page.evaluate(CUR) == 2, "указателем щелчок листает")

        print("3. Пробел в поле ввода не листает")
        page.evaluate("""() => { const i = document.createElement('textarea'); i.id = 'tstTa'; document.body.appendChild(i); i.focus(); }""")
        page.keyboard.press(" ")
        page.wait_for_timeout(200)
        check(page.evaluate(CUR) == 2, "пробел в поле — слайд тот же")
        page.evaluate("() => { const i = document.getElementById('tstTa'); i.blur(); i.remove(); }")

        print("4. Скрыть / вернуть")
        w_tools = page.evaluate(SLIDE_SCR)
        page.click("#dtbDockHide")
        page.wait_for_timeout(400)
        check(not page.evaluate(VISIBLE, "#bdDock"), "«Скрыть» убирает панель")
        check(not page.evaluate(VISIBLE, "#bdOptbar"), "и панель цвета")
        w_no = page.evaluate(SLIDE_SCR)
        check(w_no["h"] > w_tools["h"] + 10, "слайд вписался крупнее", f"{w_tools} {w_no}")
        check(page.evaluate("() => localStorage.getItem('boardsDeckShowTools')") == "0", "выбор запомнен")
        page.mouse.move(700, 400)
        page.click("#dtbShowBar [data-sh='tools']")
        page.wait_for_timeout(400)
        check(page.evaluate(VISIBLE, "#bdDock"), "«Инструменты» возвращает панель")
        check(page.get_attribute("#dtbShowBar [data-sh='tools']", "aria-pressed") == "true", "кнопка нажата")
        page.click("#dtbDockHide")
        page.keyboard.press("Escape")
        page.wait_for_timeout(400)
        page.click("#dtb-show")
        page.wait_for_timeout(400)
        check(not page.evaluate(VISIBLE, "#bdDock"), "следующий показ — без панели, как выбрали")

        print("5. Выход")
        page.keyboard.press("Escape")
        page.wait_for_timeout(400)
        check(not page.evaluate("() => document.documentElement.classList.contains('deck-show-tools')"), "признак снят")
        check(page.evaluate(VISIBLE, "#bdDock") and page.evaluate(VISIBLE, ".bd-topbar"), "интерфейс доски вернулся")
        check(not page.evaluate(VISIBLE, "#dtbDockHide"), "вне показа «Скрыть» нет")
        check(not errors, "нет ошибок на странице", "; ".join(errors[:3]))
        browser.close()
    print("\nИТОГ:", "всё прошло" if not fails else f"провалов {len(fails)}")
    sys.exit(1 if fails else 0)


if __name__ == "__main__":
    main()
