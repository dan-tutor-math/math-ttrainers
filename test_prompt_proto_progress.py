"""
Прогресс ученика сессии на экране выбора прототипов (задача 59): fipi-mix.js, task-captions.js.

У вида с заданиями ФИПИ рядом с «N заданий ФИПИ» — «Решено K из N» по памяти ученика
ТЕКУЩЕЙ сессии. Считаются разные задания (повтор не прибавляет), неверный итог не считается,
ученики не смешиваются, без сессии чужого прогресса нет, подпись обновляется сама.
Запуск: python3 test_prompt_proto_progress.py (сервер поднимается сам).
"""
import sys

from playwright.sync_api import sync_playwright

import test_prompt_b4_captions as B

check = B.check
VANYA = {"id": "aaaaaaaa-0000-4000-8000-000000000004", "name": "Ваня"}
PETYA = {"id": "aaaaaaaa-0000-4000-8000-000000000005", "name": "Петя"}


def label(page, mid):
    return page.evaluate("id => { const c = document.querySelector('#modesGrid .mode-card[data-id=\"'+id+'\"] .fipi-count'); return c ? c.textContent : null; }", mid)


def main():
    with B.local_server(), sync_playwright() as p:
        browser = p.chromium.launch()
        for name in ("oge15_18", "oge9"):
            ctx, page, errors = B.new_page(browser, f"{B.BASE}/{name}.html", session=False)
            info = page.evaluate("""() => { const m = ALL_MODES.find(x => x.fipiList && x.fipiList.length >= 3);
                                            return { id: m.id, n: m.fipiList.length, list: m.fipiList.map(f => f.fipi) }; }""")
            mid, n, fl = info["id"], info["n"], info["list"]
            check(f"{name}: без сессии подписи «Решено» нет", "Решено" not in (label(page, mid) or ""), str(label(page, mid)))

            page.evaluate("s => StudentMemory.start(s)", VANYA)
            page.wait_for_timeout(500)
            check(f"{name}: сессия началась — «Решено 0 из {n}»", f"Решено 0 из {n}" in (label(page, mid) or ""), str(label(page, mid)))
            k = lambda f: "fipi:oge:" + f
            page.evaluate("k => StudentMemory.record(k, 'ok')", k(fl[0]))
            page.wait_for_timeout(500)
            check(f"{name}: решил одно — «Решено 1 из {n}» без перерисовки руками", f"Решено 1 из {n}" in (label(page, mid) or ""), str(label(page, mid)))
            page.evaluate("k => StudentMemory.record(k, 'bad')", k(fl[1]))
            page.evaluate("k => StudentMemory.record(k, 'ok')", k(fl[2]))
            page.wait_for_timeout(500)
            check(f"{name}: неверный итог не считается, второе решённое — «Решено 2 из {n}»", f"Решено 2 из {n}" in (label(page, mid) or ""), str(label(page, mid)))
            page.evaluate("k => { StudentMemory.record(k, 'ok'); }", k(fl[0]))
            page.wait_for_timeout(400)
            check(f"{name}: то же задание ещё раз — счётчик не растёт", f"Решено 2 из {n}" in (label(page, mid) or ""), str(label(page, mid)))

            page.evaluate("s => StudentMemory.start(s)", PETYA)
            page.wait_for_timeout(500)
            check(f"{name}: другой ученик — свой прогресс «Решено 0 из {n}»", f"Решено 0 из {n}" in (label(page, mid) or ""), str(label(page, mid)))
            page.evaluate("s => StudentMemory.start(s)", VANYA)
            page.wait_for_timeout(500)
            check(f"{name}: вернулись к первому — «Решено 2 из {n}»", f"Решено 2 из {n}" in (label(page, mid) or ""), str(label(page, mid)))
            page.evaluate("() => StudentMemory.end()")
            page.wait_for_timeout(500)
            check(f"{name}: сессию закончили — чужой прогресс пропал", "Решено" not in (label(page, mid) or ""), str(label(page, mid)))
            check(f"{name}: без ошибок JS", not errors, str(errors[:1]))
            ctx.close()
        browser.close()
    print()
    print("ПРОВАЛЕНО: " + ", ".join(B.FAILS) if B.FAILS else "Все проверки прошли — готово")
    sys.exit(1 if B.FAILS else 0)


main()
