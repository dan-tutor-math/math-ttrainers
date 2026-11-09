"""
Каталог прототипов для конструктора работ: ЕГЭ и ОГЭ ч. 2 (__trainerCatalog).

Запуск: ~/.venvs/trainers/bin/python test_prompt_catalog_ege.py
"""
import sys

from playwright.sync_api import sync_playwright

import test_prompt84_deck_slides as T

T.PORT = 9130
T.BASE = f"http://127.0.0.1:{T.PORT}"
PAGES = ["ege_prof.html?n=9", "ege_base.html?n=7", "oge_part2.html?n=20"]
fails = []


def check(cond, msg, extra=""):
    print(("OK   " if cond else "FAIL ") + msg + (f"  [{extra}]" if extra and not cond else ""))
    if not cond:
        fails.append(msg)


def run_page(browser, url, errors):
    page = browser.new_page(viewport={"width": 1400, "height": 900})
    page.on("pageerror", lambda e: errors.append(url + ": " + str(e)))
    page.goto(f"{T.BASE}/{url}")
    page.wait_for_function("() => window.__trainerCatalog")

    first = page.evaluate("() => __trainerCatalog.list()")
    second = page.evaluate("() => __trainerCatalog.list()")
    check(len(first) > 0, url + ": каталог не пустой")
    check(first == second, url + ": порядок постоянный")
    best = max(first, key=lambda x: len(x["tasks"]))
    total = len(best["tasks"])

    for pos in range(min(3, total)):
        r = page.evaluate("([id, pos]) => __trainerCatalog.openAt(id, pos)", [best["id"], pos])
        check(r["ok"] and r["pid"] == best["tasks"][pos], f"{url}: задача на месте {pos}", str(r))
        pid = page.evaluate("() => S.pid")
        check(pid == best["tasks"][pos], f"{url}: на экране задача места {pos}", str(pid))
        check(page.is_visible("#taskArea"), f"{url}: открыт экран задания")

    r = page.evaluate("([id, pos]) => __trainerCatalog.openAt(id, pos)", [best["id"], total])
    check(not r["ok"] and r["reason"] == "end", url + ": за концом банка — end", str(r))
    r = page.evaluate("() => __trainerCatalog.openAt('нет-такого', 0)")
    check(not r["ok"] and r["reason"] == "unknown", url + ": неизвестный прототип", str(r))
    page.close()


def main():
    errors = []
    with T.local_server(), sync_playwright() as p:
        browser = p.chromium.launch()
        for url in PAGES:
            run_page(browser, url, errors)
        browser.close()
    check(not errors, "нет ошибок на странице", "; ".join(errors[:3]))
    if fails:
        sys.exit(1)
    print("ГОТОВО")


if __name__ == "__main__":
    main()