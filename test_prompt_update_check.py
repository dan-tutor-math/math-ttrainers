"""
Сигнал «есть обновление платформы» (update-check.js на boards.html).

Сервер отдаёт у boards-core.js ETag; update-check.js запоминает его при первой
удачной проверке и сверяет при возврате на вкладку и раз в 10 минут. Здесь
ответы на HEAD подменяются через page.route.

Проверяем:
  1. ETag "a", потом "b" — после visibilitychange плашка bdUpdate видна,
     страница сама не перезагрузилась
  2. Тот же ETag — плашки нет
  3. Ответ 500, пустой заголовок, обрыв сети — плашки нет
  4. Страница просмотра ?s=КОД — проверка не запускается вовсе

Запуск: ~/.venvs/trainers/bin/python test_prompt_update_check.py
"""
import sys

from playwright.sync_api import sync_playwright

import test_prompt48_unload_on_close as T48

T48.PORT = 9252
T48.BASE = BASE = "http://127.0.0.1:9252"

VISIBLE = "() => { document.dispatchEvent(new Event('visibilitychange')); }"
BANNER = """() => { const el = document.getElementById('bdUpdate');
  if (!el) return false; const r = el.getBoundingClientRect();
  return getComputedStyle(el).display !== 'none' && r.width > 0 && r.height > 0; }"""


def run():
    failures = []

    def check(name, cond):
        print(f"[{'OK' if cond else 'FAIL'}] {name}")
        if not cond:
            failures.append(name)

    def open_page(browser, answers, url="/boards.html"):
        """answers — список ответов на HEAD по порядку; последний повторяется.
        Ответ: ("ok", etag) | ("status", код) | ("empty",) | ("abort",)"""
        ctx = browser.new_context()
        page = ctx.new_page()
        errors = []
        page.on("pageerror", lambda e: errors.append(str(e)))
        heads = []

        def handle(route):
            if route.request.method != "HEAD":
                route.continue_()
                return
            a = answers[min(len(heads), len(answers) - 1)]
            heads.append(a)
            if a[0] == "ok":
                route.fulfill(status=200, headers={"ETag": a[1]}, body="")
            elif a[0] == "status":
                route.fulfill(status=a[1], body="")
            elif a[0] == "empty":
                route.fulfill(status=200, headers={}, body="")
            else:
                route.abort()

        page.route("**/boards-core.js", handle)
        page.goto(BASE + url)
        page.wait_for_timeout(500)
        page.evaluate("() => { window.__notReloaded = true; }")
        return ctx, page, heads, errors

    with T48.local_server(), sync_playwright() as p:
        browser = p.chromium.launch()

        print("1. Деплой случился — плашка, без перезагрузки")
        ctx, page, heads, errors = open_page(browser, [("ok", '"a"'), ("ok", '"b"')])
        check("1: первая проверка прошла при загрузке", len(heads) >= 1)
        check("1: до смены плашки нет", not page.evaluate(BANNER))
        page.evaluate(VISIBLE)
        page.wait_for_timeout(500)
        check("1: после возврата на вкладку плашка bdUpdate видна", page.evaluate(BANNER))
        check("1: текст плашки", "Есть обновление платформы" in page.inner_text("#bdUpdate"))
        check("1: кнопка «Обновить»", page.locator("#bdUpdate button").inner_text() == "Обновить")
        check("1: страница не перезагрузилась", page.evaluate("() => window.__notReloaded === true"))
        check("1: ошибок нет", not errors)
        ctx.close()

        print("2. Тот же ETag — тишина")
        ctx, page, heads, errors = open_page(browser, [("ok", '"a"')])
        page.evaluate(VISIBLE)
        page.wait_for_timeout(500)
        check("2: проверка была повторена", len(heads) >= 2)
        check("2: плашки нет", not page.evaluate(BANNER))
        ctx.close()

        for title, bad in (("500", ("status", 500)), ("пустой заголовок", ("empty",)), ("обрыв сети", ("abort",))):
            print(f"3. Ответ: {title} — тишина")
            ctx, page, heads, errors = open_page(browser, [("ok", '"a"'), bad])
            page.evaluate(VISIBLE)
            page.wait_for_timeout(500)
            check(f"3 ({title}): проверка была повторена", len(heads) >= 2)
            check(f"3 ({title}): плашки нет", not page.evaluate(BANNER))
            check(f"3 ({title}): ошибок на странице нет", not errors)
            ctx.close()

        print("3б. Первая проверка неудачна — сравнивать не с чем, запоминается следующая")
        ctx, page, heads, errors = open_page(browser, [("status", 500), ("ok", '"a"'), ("ok", '"a"')])
        page.evaluate(VISIBLE)
        page.wait_for_timeout(400)
        page.evaluate(VISIBLE)
        page.wait_for_timeout(400)
        check("3б: плашки нет", not page.evaluate(BANNER))
        ctx.close()

        print("4. Страница просмотра ?s=КОД")
        ctx, page, heads, errors = open_page(browser, [("ok", '"a"'), ("ok", '"b"')], "/boards.html?s=TEST01")
        page.evaluate(VISIBLE)
        page.wait_for_timeout(500)
        check("4: проверка не запускалась — запросов HEAD нет", len(heads) == 0)
        check("4: плашки нет", not page.evaluate(BANNER))
        ctx.close()

        browser.close()

    print()
    print("ИТОГ: всё прошло" if not failures else f"ИТОГ: {len(failures)} проверок провалено — {failures}")
    return not failures


if __name__ == "__main__":
    sys.exit(0 if run() else 1)
