"""
Каталог прототипов на страницах ОГЭ ч. 1 (__trainerCatalog): список, задача по месту,
браузер учителя при этом не меняется.

Запуск: ~/.venvs/trainers/bin/python test_prompt_catalog_oge.py
Банк ФИПИ с задачами по месту проверяет ещё test_prompt_catalog_fipi_mix.py.
oge8 и oge12 пропущены: у них нет __trainerState, каталога нет.
"""
import sys

from playwright.sync_api import sync_playwright

import test_prompt84_deck_slides as T

T.PORT = 9132
T.BASE = f"http://127.0.0.1:{T.PORT}"
PAGES = ["oge1_5", "oge6", "oge7", "oge9", "oge10", "oge11", "oge13", "oge14", "oge15_18", "oge19"]
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

    lst = page.evaluate("() => __trainerCatalog.list()")
    check(len(lst) > 0, slug + ": каталог не пустой", str(len(lst)))
    check(lst == page.evaluate("() => __trainerCatalog.list()"), slug + ": порядок постоянный")
    check(not any("demo" in x["id"] for x in lst), slug + ": без демоверсии")
    first = lst[0]
    banked = [x for x in lst if x["fipi"]]
    # со страницы, где банк разбит на много прототипов (№1–5), берём все — сюжеты строятся по-разному
    protos = [first] + (banked if slug == "oge1_5" else [max(banked, key=lambda x: len(x["fipi"]))] if banked else [])

    before = page.evaluate(STORE)
    for proto in protos:
        last = max(len(proto["fipi"]) - 1, 0)
        for pos in (0, last):
            r = page.evaluate("([id, pos]) => __trainerCatalog.openAt(id, pos)", [proto["id"], pos])
            want = proto["fipi"][pos] if proto["fipi"] else None
            check(r["ok"] and r["fipi"] == want, f"{slug}: {proto['id']} место {pos}", str(r))
            check(page.evaluate("() => (curTask && curTask.fipi) || null") == want,
                  f"{slug}: {proto['id']} на экране задача места {pos}")
            check(page.is_visible("#questionPanel"), f"{slug}: {proto['id']} экран задания открыт")
        if proto["fipi"] and proto["hasGen"]:
            r = page.evaluate("([id, pos]) => __trainerCatalog.openAt(id, pos)", [proto["id"], len(proto["fipi"])])
            check(r["ok"] and r["fipi"] is None, f"{slug}: {proto['id']} за концом банка — наш генератор", str(r))
            check(page.evaluate("() => curTask.basedOnFipi === true"), f"{slug}: подпись «на основе ФИПИ»")
        elif proto["fipi"]:
            # у сюжетов ФИПИ №1–5 своего генератора нет: за концом банка — end
            r = page.evaluate("([id, pos]) => __trainerCatalog.openAt(id, pos)", [proto["id"], len(proto["fipi"])])
            check(not r["ok"] and r["reason"] == "end", f"{slug}: {proto['id']} за концом банка без генератора — end", str(r))
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
