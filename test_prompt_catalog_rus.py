"""
Каталог прототипов (__trainerCatalog) у русского ОГЭ/ЕГЭ и у ОГЭ №8, №12 (этап 10б
конструктора вариантов): список не пуст, openAt открывает задание с номером ФИПИ из
list и повторно — то же самое, current() совпадает, а браузер учителя не меняется
(fipiMix:done, прогресс, журнал) и в совместную сессию ничего не уходит.

Запуск: ~/.venvs/trainers/bin/python test_prompt_catalog_rus.py
"""
import sys

from playwright.sync_api import sync_playwright

import test_prompt84_deck_slides as T

T.PORT = 9133
T.BASE = f"http://127.0.0.1:{T.PORT}"
# адрес без номера уводит русский на главную — открываем с номером, как ученик с главной
PAGES = [("oge8", ""), ("oge12", ""), ("rus_oge", "?n=2"), ("rus_ege", "?n=1")]
# ключи совместной сессии страница заводит сама по таймеру, к каталогу они не относятся
STORE = """() => JSON.stringify(Object.keys(localStorage).sort()
  .filter(k => !k.startsWith('trainerSession') && !k.startsWith('tsSessions'))
  .map(k => [k, localStorage.getItem(k)]))"""
# рассылку в сессию считаем подменой push: openAt её звать не должен
SPY = """() => { window.__pushes = 0; if (window.TrainerSession) {
  const orig = TrainerSession.push; TrainerSession.push = function(){ window.__pushes++; return orig && orig.apply(this, arguments); }; } }"""
fails = []


def check(cond, msg, extra=""):
    print(("OK   " if cond else "FAIL ") + msg + (f"  [{extra}]" if extra and not cond else ""))
    if not cond:
        fails.append(msg)


def nums_of(page):
    # у русского номера отдаёт сам каталог, у №8 и №12 номер один (n пустой)
    return page.evaluate("() => __trainerCatalog.nums ? __trainerCatalog.nums().map(m => m.n) : [null]")


def run_page(browser, slug, query, errors):
    page = browser.new_page(viewport={"width": 1400, "height": 900})
    page.on("pageerror", lambda e: errors.append(slug + ": " + str(e)))
    page.goto(f"{T.BASE}/{slug}.html{query}")
    page.wait_for_function("() => window.__trainerCatalog")
    page.wait_for_timeout(500)
    page.evaluate(SPY)
    before = page.evaluate(STORE)

    nums = nums_of(page)
    check(len(nums) > 0, slug + ": номера есть", str(nums))
    # у русского проверяем первый номер, номер с подтемами и последний
    if len(nums) > 1:
        topical = [n for n in nums if len(page.evaluate("n => __trainerCatalog.list(n)", n)) > 1]
        nums = list(dict.fromkeys([nums[0]] + topical[:1] + [nums[-1]]))
    for n in nums:
        tag = f"{slug}{'' if n is None else ' №' + str(n)}"
        lst = page.evaluate("n => __trainerCatalog.list(n)", n)
        check(len(lst) > 0, tag + ": list() не пуст", str(len(lst)))
        check(lst == page.evaluate("n => __trainerCatalog.list(n)", n), tag + ": порядок постоянный")
        check(not any("demo" in x["id"] for x in lst), tag + ": без демоверсии")
        protos = [lst[0]] + ([lst[-1]] if len(lst) > 1 else [])
        for proto in protos:
            want = proto["fipi"][0] if proto["fipi"] else None
            r1 = page.evaluate("([id, n]) => __trainerCatalog.openAt(id, 0, n)", [proto["id"], n])
            check(r1["ok"] and r1["fipi"] == want, f"{tag}: {proto['id']} место 0 — ФИПИ {want}", str(r1))
            cur = page.evaluate("() => __trainerCatalog.current()")
            check(bool(cur) and cur["proto"] == proto["id"] and cur["fipi"] == want
                  and cur["pos"] == (0 if want else None) and cur["n"] == n,
                  f"{tag}: {proto['id']} current() после openAt", str(cur))
            r2 = page.evaluate("([id, n]) => __trainerCatalog.openAt(id, 0, n)", [proto["id"], n])
            if want:
                check(r2["ok"] and r2["fipi"] == want and page.evaluate("() => __trainerCatalog.current()") == cur,
                      f"{tag}: {proto['id']} второй openAt — то же задание", str(r2))
            else:
                # №12 без банка ФИПИ: место ничего не выбирает, каждый раз — наш генератор
                check(r2["ok"] and proto["hasGen"], f"{tag}: {proto['id']} без банка — наш генератор", str(r2))
            if proto["fipi"]:
                last = len(proto["fipi"]) - 1
                r = page.evaluate("([id, pos, n]) => __trainerCatalog.openAt(id, pos, n)", [proto["id"], last, n])
                check(r["ok"] and r["fipi"] == proto["fipi"][last], f"{tag}: {proto['id']} последнее место", str(r))
                r = page.evaluate("([id, pos, n]) => __trainerCatalog.openAt(id, pos, n)", [proto["id"], last + 1, n])
                if proto["hasGen"]:
                    check(r["ok"] and r["fipi"] is None, f"{tag}: {proto['id']} за концом банка — наш генератор", str(r))
                else:
                    check(not r["ok"] and r["reason"] == "end", f"{tag}: {proto['id']} за концом банка — end", str(r))
        # экран задания действительно открыт
        visible = "#taskArea" if slug.startswith("rus") else "#questionPanel"
        check(page.is_visible(visible), tag + ": экран задания открыт")
    r = page.evaluate("() => __trainerCatalog.openAt('нет-такого', 0, %s)" % ("null" if nums[0] is None else nums[0]))
    check(not r["ok"] and r["reason"] == "unknown", slug + ": неизвестный прототип", str(r))
    if slug.startswith("rus"):
        check(page.evaluate("() => __trainerCatalog.list().then(l => l.length)") > 0, slug + ": list() без n — номер на экране")
    check(page.evaluate(STORE) == before, slug + ": память и журнал не тронуты (fipiMix:done, прогресс)")
    check(page.evaluate("() => window.__pushes") == 0, slug + ": в сессию ничего не ушло (TrainerSession.push)")
    page.close()


def run_frame(browser, slug, errors):
    """В невидимом кадре конструктора страница без номера не уводит на главную."""
    page = browser.new_page()
    page.on("pageerror", lambda e: errors.append(slug + " (кадр): " + str(e)))
    page.goto(f"{T.BASE}/boards.html")
    page.evaluate("src => { const f = document.createElement('iframe'); f.id = 'cat'; f.src = src; document.body.appendChild(f); }",
                  f"{slug}.html")
    page.wait_for_timeout(1500)
    fr = next((f for f in page.frames if f.url.split("?")[0].endswith(f"/{slug}.html")), None)
    check(fr is not None, slug + ": в кадре без номера осталась сама страница", str([f.url for f in page.frames]))
    if fr:
        n = fr.evaluate("() => __trainerCatalog.nums()[0].n")
        lst = fr.evaluate("n => __trainerCatalog.list(n)", n)
        r = fr.evaluate("([id, n]) => __trainerCatalog.openAt(id, 0, n)", [lst[0]["id"], n])
        check(r["ok"] and r["fipi"] == lst[0]["fipi"][0], slug + ": openAt в кадре", str(r))
    page.close()


def main():
    errors = []
    with T.local_server(), sync_playwright() as p:
        browser = p.chromium.launch()
        for slug, query in PAGES:
            run_page(browser, slug, query, errors)
        for slug in ("rus_oge", "rus_ege"):
            run_frame(browser, slug, errors)
        browser.close()
    check(not errors, "нет ошибок на странице", "; ".join(errors[:3]))
    if fails:
        sys.exit(1)
    print("ГОТОВО")


if __name__ == "__main__":
    main()
