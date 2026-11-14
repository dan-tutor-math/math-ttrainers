"""
Поиск досок по названию — в шапке списка, справа от названия раздела.

Раньше поле стояло в боковой колонке над папками: его не замечали, а на
телефоне (уже 640 px) колонка скрыта вместе с ним.

Проверяем:
  1. Широкий экран: поле в шапке (.bl-head), в одной строке с «Все доски»
     и правее него; в боковой колонке поля больше нет.
  2. Поиск работает: «папке» находит только «Доска в папке», заголовок —
     «Результаты поиска», очистка возвращает список.
  3. Телефон (390 px): поле видно, стоит второй строкой — ниже заголовка
     и выше переключателя «Основные доски / Все доски и презентации /
     Презентации», на всю ширину шапки; поиск работает и здесь.
  Сервер (Supabase) в проверке не участвует.
"""
import sys
sys.path.insert(0, '.')
from test_prompt_boards_trash import local_server, BASE, sync_playwright, FAKE_SB_JS, BOOT_JS
from test_prompt113_boards_decks_split import SEED

BOX = "(s) => { const r = document.querySelector(s).getBoundingClientRect(); return {x:r.left, y:r.top, r:r.right, b:r.bottom, w:r.width, h:r.height}; }"


def run():
    failures = []

    def check(name, cond):
        print(f"[{'OK' if cond else 'FAIL'}] {name}")
        if not cond:
            failures.append(name)

    with local_server(), sync_playwright() as p:
        browser = p.chromium.launch()

        def open_list(width, height):
            ctx = browser.new_context(viewport={"width": width, "height": height})
            pg = ctx.new_page()
            errors = []
            pg.on("pageerror", lambda e: errors.append(str(e)))
            pg.goto(f"{BASE}/boards.html")
            pg.evaluate(SEED)
            pg.goto("about:blank")
            pg.goto(f"{BASE}/boards.html")
            pg.wait_for_timeout(500)
            pg.evaluate(FAKE_SB_JS)
            pg.evaluate(BOOT_JS)
            pg.wait_for_function("window.getDB && window.getDB().boards.length >= 4")
            pg.wait_for_timeout(500)
            return ctx, pg, errors

        ids = lambda pg: pg.evaluate("() => [...document.querySelectorAll('#blGrid .bl-card[data-board]')].map(c => c.dataset.board).sort()")
        mid = lambda b: b["y"] + b["h"] / 2

        def search_works(pg, tag):
            pg.fill("#blSearch", "папке")
            pg.wait_for_timeout(250)
            check(f"{tag}: «папке» находит только «Доска в папке»", ids(pg) == ["b2"])
            check(f"{tag}: заголовок — «Результаты поиска»", "Результаты поиска" in pg.inner_text("#blTitle"))
            pg.fill("#blSearch", "")
            pg.wait_for_timeout(250)
            check(f"{tag}: очистка возвращает список", ids(pg) == ["b1"])

        # ── 1–2. широкий экран ──
        ctx, pg, errors = open_list(1280, 860)
        check("поле поиска внутри шапки .bl-head", pg.evaluate("() => !!document.querySelector('.bl-head #blSearch')"))
        check("в боковой колонке поля нет", pg.evaluate("() => !document.querySelector('.bl-sidebar #blSearch')"))
        t, s = pg.evaluate(BOX, "#blTitle"), pg.evaluate(BOX, ".bl-head .bl-search")
        check("поле правее заголовка", s["x"] >= t["r"])
        check("поле в одной строке с заголовком", abs(mid(s) - mid(t)) < 8)
        check("поле не уже 180 px", s["w"] >= 180)
        search_works(pg, "широкий")
        check("ошибок на странице нет", not errors)
        ctx.close()

        # ── 3. телефон ──
        ctx, pg, errors = open_list(390, 844)
        check("телефон: поле видно", pg.is_visible("#blSearch"))
        t, s, k, head = (pg.evaluate(BOX, sel) for sel in ("#blTitle", ".bl-head .bl-search", "#blKindSwitch", ".bl-head"))
        check("телефон: поле второй строкой, ниже заголовка", s["y"] >= t["b"])
        check("телефон: поле выше переключателя видов", s["b"] <= k["y"])
        check("телефон: поле на всю ширину шапки", abs(s["w"] - head["w"]) < 2)
        check("телефон: страница не прокручивается вбок",
              pg.evaluate("() => document.documentElement.scrollWidth <= window.innerWidth"))
        search_works(pg, "телефон")
        check("телефон: ошибок на странице нет", not errors)
        ctx.close()
        browser.close()

    if failures:
        print(f"\nНЕ ПРОЙДЕНО: {len(failures)}")
        sys.exit(1)
    print("\nготово")


if __name__ == "__main__":
    run()
