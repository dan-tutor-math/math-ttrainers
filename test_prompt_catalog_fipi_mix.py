"""
Каталог прототипов на страницах ОГЭ с fipi-mix.js: задача ФИПИ по месту в банке.

Запуск: ~/.venvs/trainers/bin/python test_prompt_catalog_fipi_mix.py
"""
import sys

from playwright.sync_api import sync_playwright

import test_prompt84_deck_slides as T

T.PORT = 9131
T.BASE = f"http://127.0.0.1:{T.PORT}"
PAGES = ["oge6", "oge9", "oge15_18", "oge14", "oge7"]
# ключи совместной сессии страница заводит сама по таймеру, к каталогу они не относятся
STORE = """() => JSON.stringify(Object.keys(localStorage).sort()
  .filter(k => !k.startsWith('trainerSession') && !k.startsWith('tsSessions'))
  .map(k => [k, localStorage.getItem(k)]))"""
fails = []


def check(cond, msg, extra=""):
    print(("OK   " if cond else "FAIL ") + msg + (f"  [{extra}]" if extra and not cond else ""))
    if not cond:
        fails.append(msg)


def run_page(browser, slug, errors):
    page = browser.new_page(viewport={"width": 1400, "height": 900})
    page.on("pageerror", lambda e: errors.append(slug + ": " + str(e)))
    page.goto(f"{T.BASE}/{slug}.html")
    page.wait_for_function("() => window.__trainerCatalog")
    page.wait_for_timeout(500)

    first = page.evaluate("() => __trainerCatalog.list()")
    second = page.evaluate("() => __trainerCatalog.list()")
    check(first == second, slug + ": порядок постоянный")
    check(not any(x["id"].startswith("demo") for x in first), slug + ": без демоверсии")
    best = max(first, key=lambda x: len(x["fipi"]))
    check(len(best["fipi"]) >= 3, slug + ": в прототипе есть задачи банка", str(len(best["fipi"])))

    before = page.evaluate(STORE)
    prompts = []
    for pos in range(3):
        r = page.evaluate("([id, pos]) => __trainerCatalog.openAt(id, pos)", [best["id"], pos])
        want = best["fipi"][pos]
        check(r["ok"] and r["fipi"] == want, f"{slug}: задача банка на месте {pos}", str(r))
        check(page.evaluate("() => curTask.fipi") == want, f"{slug}: на экране задача места {pos}")
        check(page.is_visible("#questionPanel"), f"{slug}: экран задания открыт")
        prompts.append(page.evaluate("() => curTask.prompt"))
    check(len(set(prompts)) == 3, slug + ": три разные задачи")

    page.evaluate("([id]) => __trainerCatalog.openAt(id, 1)", [best["id"]])
    check(page.evaluate("() => curTask.prompt") == prompts[1], slug + ": то же место — та же задача")

    end = len(best["fipi"])
    r = page.evaluate("([id, pos]) => __trainerCatalog.openAt(id, pos)", [best["id"], end])
    check(r["ok"] and r["fipi"] is None, slug + ": за концом банка — наш генератор", str(r))
    check(page.evaluate("() => curTask.basedOnFipi === true"), slug + ": подпись «на основе ФИПИ»")

    r = page.evaluate("() => __trainerCatalog.openAt('нет-такого', 0)")
    check(not r["ok"] and r["reason"] == "unknown", slug + ": неизвестный прототип", str(r))
    check(page.evaluate(STORE) == before, slug + ": браузер учителя не изменён")
    page.close()


def main():
    errors = []
    with T.local_server(), sync_playwright() as p:
        browser = p.chromium.launch()
        for slug in PAGES:
            run_page(browser, slug, errors)
        browser.close()
    check(not errors, "нет ошибок на странице", "; ".join(errors[:3]))
    if fails:
        sys.exit(1)
    print("ГОТОВО")


if __name__ == "__main__":
    main()
