"""
Кнопка «на весь экран» на сцене ученика (stage.html).
Проверяем: где Fullscreen API есть — кнопка видна и включает/выключает полный
экран; где его нет (iPhone) — кнопки нет; в установленном веб-приложении
(display-mode: standalone) она тоже не нужна.
Запуск: python3 test_prompt_stage_fullscreen.py
"""
import sys

from playwright.sync_api import sync_playwright

import test_prompt11_shared_screen as t11

failures = t11.failures
check = t11.check
URL = None

NO_FS = """(() => {
  for (const k of ['requestFullscreen', 'webkitRequestFullscreen']) {
    try { delete Element.prototype[k]; } catch (e) {}
  }
})();"""


def open_stage(browser, init=None, **ctx_kw):
    ctx = browser.new_context(**ctx_kw)
    page = ctx.new_page()
    if init:
        page.add_init_script(init)
    page.goto(f"{t11.BASE}/stage.html?s=ABCD1234&to=index.html")
    page.wait_for_selector("#bar")
    return ctx, page


def run():
    with t11.local_server():
        with sync_playwright() as p:
            browser = p.chromium.launch()
            print("Полный экран")
            ctx, page = open_stage(browser, is_mobile=True, has_touch=True, viewport={"width": 390, "height": 844})
            hidden = page.evaluate("() => document.getElementById('fsBtn').hidden")
            check("где API есть — кнопка видна", hidden is False, hidden)
            page.click("#fsBtn")
            try:
                page.wait_for_function("() => !!document.fullscreenElement", timeout=4000)
                on = True
            except Exception:
                on = False
            check("нажатие — полный экран включился", on)
            check("кнопка «нажата», подпись «Выйти…»", page.evaluate(
                "() => { const b = document.getElementById('fsBtn'); return b.getAttribute('aria-pressed') === 'true' && b.title.indexOf('Выйти') === 0; }"))
            page.click("#fsBtn")
            try:
                page.wait_for_function("() => !document.fullscreenElement", timeout=4000)
                off = True
            except Exception:
                off = False
            check("второе нажатие — вышли из полного экрана", off)
            check("подпись вернулась к «На весь экран»", page.evaluate(
                "() => { const b = document.getElementById('fsBtn'); return b.getAttribute('aria-pressed') === 'false' && b.title === 'На весь экран'; }"))
            ctx.close()

            ctx, page = open_stage(browser, NO_FS, is_mobile=True, has_touch=True, viewport={"width": 390, "height": 844})
            check("iPhone (API нет) — кнопка скрыта", page.evaluate("() => document.getElementById('fsBtn').hidden") is True)
            ctx.close()
            browser.close()
    if failures:
        print(f"ИТОГ: {len(failures)} провалов")
        sys.exit(1)
    print("ИТОГ: всё прошло")


if __name__ == "__main__":
    run()
