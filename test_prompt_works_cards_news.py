"""
Задача 63 (S6): разовый тост для учителя при первом открытии конструктора
после перехода на карточки ФИПИ (works.html, функция noteNewCards).

Заглушка Supabase и вход — из теста этапа 1 (test_prompt15_works_stage1.py).

Проверяет:
  A. первое открытие конструктора («Новая работа») — тост с текстом про
     карточки, ключ localStorage works:newsCards = '1';
  B. после перезагрузки страницы и нового открытия конструктора тоста нет,
     ключ на месте;
  C. нет ошибок JavaScript.

Запуск: python3 test_prompt_works_cards_news.py
"""
import sys

import test_prompt15_works_stage1 as S
from playwright.sync_api import sync_playwright

TOAST_TEXT = "ФИПИ-задания теперь собираются мгновенно и печатаются как в КИМ; ранее созданные работы не меняются"
TOAST_SHOWN_JS = """() => { const t = document.getElementById('toast');
  return !!t && t.classList.contains('show') && t.textContent === %s; }""" % repr(TOAST_TEXT)


def login(page):
    page.goto(f"{S.BASE}/works.html")
    page.wait_for_selector("#scrAuth:not([hidden]), #scrList:not([hidden])")
    if page.is_visible("#scrAuth"):
        page.fill("#auEmail", S.TEACHER["email"])
        page.fill("#auPass", S.TEACHER["password"])
        page.click("#auGo")
    page.wait_for_selector("#scrList:not([hidden])")


def open_constructor(page):
    page.click("#newWork")
    page.wait_for_selector("#scrEdit:not([hidden])")


def run():
    errors = []
    with S.local_server(), sync_playwright() as p:
        browser = p.chromium.launch()
        ctx = S.new_context(browser, viewport={"width": 1440, "height": 950})
        page = ctx.new_page()
        page.on("pageerror", lambda e: errors.append(str(e)))

        print("\n— A. первое открытие конструктора")
        S.STATE["db"] = S.json.dumps(S.EMPTY_DB)
        login(page)
        open_constructor(page)
        shown = True
        try:
            page.wait_for_function(TOAST_SHOWN_JS, timeout=3000)
        except Exception:
            shown = False
        S.check("A1 тост про карточки показан при первом открытии", shown)
        S.check("A2 ключ works:newsCards записан",
                page.evaluate("() => localStorage.getItem('works:newsCards')") == "1")

        print("\n— B. после перезагрузки тоста нет")
        page.reload()
        login(page)
        open_constructor(page)
        page.wait_for_timeout(1500)
        again = page.evaluate(TOAST_SHOWN_JS)
        S.check("B1 после перезагрузки тост не повторяется", not again)

        ctx.close()
        browser.close()

    print("\n— C. ошибки JavaScript")
    S.check("C1 нет ошибок JavaScript", not errors, "; ".join(errors[:5]))


if __name__ == "__main__":
    run()
    print()
    if S.FAILS:
        print(f"ПРОВАЛЕНО: {len(S.FAILS)}")
        for f in S.FAILS:
            print("  - " + f)
        sys.exit(1)
    print("Все проверки прошли")
