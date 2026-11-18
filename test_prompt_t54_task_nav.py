"""
Задача 54: экран задания в тренажёрах ОГЭ математики — как в русском.

Для каждой страницы из аргументов (без аргументов — все из PAGES):
  1. в левом верхнем углу «Все задания» и «Все типы»; «Все типы» видна только
     на экране задания и ведёт к выбору типов, как «← все типы» в шапке;
  2. в шапке «◀ Предыдущее задание / Следующее задание ▶» рядом с типами;
     «◀» недоступна, пока листать назад некуда;
  3. «Следующее» даёт новое задание, «◀» возвращает прежнее (то же самое),
     «▶» после «◀» — снова то, что было, а не новое; дальше — новое;
  4. ⟳ тоже кладёт задание в историю: «◀» после ⟳ возвращает его;
  5. «◀ Предыдущий / Следующий тип ▶» — только если у номера больше одного типа;
  6. в «Обучении» (если вкладка есть и прячет ⟳) пары нет;
  7. ?card=1 — ни угла, ни пары;
  8. телефон 375 px: нет прокрутки вбок, угол не налезает на кнопку темы;
  9. №15–18 (oge15_18): возврат задания ФИПИ не меняет память fipiMix:* и
     подпись «уже было» (TaskCaptions.showCurrent) получает возвращённое задание.

Запуск из папки тренажёры: ~/.venvs/trainers/bin/python test_prompt_t54_task_nav.py oge9
"""
import contextlib
import http.client
import json
import os
import subprocess
import sys
import time

from playwright.sync_api import sync_playwright

PORT = 9454
BASE = f"http://127.0.0.1:{PORT}"
HERE = os.path.dirname(os.path.abspath(__file__))

# страница → сколько типов у номера должно давать кнопки типов (None — не проверять)
# oge1_5 — свой этап 54.4: там все типы — наборы «Задание N из 5» со своей парой
PAGES = ["oge6", "oge7", "oge8", "oge9", "oge10", "oge11", "oge12",
         "oge13", "oge14", "oge15_18", "oge19"]

# тип с заданиями ФИПИ для п. 9 выбирает сама страница
FIPI_TYPE_JS = "(ALL_MODES.find(m => m.fipiList && m.fipiList.length > 3) || {}).id || null"

# первый обычный тип на экране выбора: не «вперемешку», не демоверсия
TYPE_CARD = ".mode-card[data-id]:not(.random):not(.mix):not(.demo)"


@contextlib.contextmanager
def local_server():
    proc = subprocess.Popen([sys.executable, "-m", "http.server", str(PORT)], cwd=HERE,
                            stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    try:
        for _ in range(50):
            try:
                conn = http.client.HTTPConnection("127.0.0.1", PORT, timeout=0.2)
                conn.request("GET", "/index.html")
                conn.getresponse()
                break
            except Exception:
                time.sleep(0.1)
        else:
            raise RuntimeError("локальный сервер не поднялся")
        yield
    finally:
        proc.terminate()
        proc.wait(timeout=5)


results = []


def check(name, ok, info=""):
    results.append((name, bool(ok)))
    print(("[OK] " if ok else "[FAIL] ") + name + ("" if ok else f": {info}"))


def visible(page, sel):
    # кнопки угла бывают position:fixed — видимость по размеру, не по offsetParent
    return page.evaluate("""s => { const e = document.querySelector(s);
        if (!e) return false; const r = e.getBoundingClientRect();
        return r.height > 0 && r.width > 0 && getComputedStyle(e).visibility !== 'hidden'; }""", sel)


def task_sig(page):
    return page.evaluate("JSON.stringify(curTask)")


def open_first_type(page, slug):
    page.goto(f"{BASE}/{slug}.html", wait_until="load")
    page.wait_for_timeout(400)
    if slug == "oge15_18":
        tid = page.evaluate(FIPI_TYPE_JS)
        card = page.locator(f'.mode-card[data-id="{tid}"]').first
    else:
        card = page.locator(TYPE_CARD).first
    card.scroll_into_view_if_needed()
    card.click()
    page.wait_for_timeout(400)


def run_page(browser, slug):
    ctx = browser.new_context(viewport={"width": 1400, "height": 900})
    page = ctx.new_page()
    errors = []
    page.on("pageerror", lambda e: errors.append(str(e)))
    open_first_type(page, slug)

    # 1. угол
    check(f"{slug}: угол есть, «Все задания» в нём", page.evaluate(
        "!!document.querySelector('#cornerNav #homeBtn')"))
    types_sel = "#cornerTypesBtn" if slug != "oge1_5" else "#cornerNav #backBtn"
    check(f"{slug}: «Все типы» в углу видна на экране задания", visible(page, types_sel))
    check(f"{slug}: подпись «Все типы»", "Все типы" in page.locator(types_sel).inner_text(),
          page.locator(types_sel).inner_text())

    # 2–3. пара заданий
    check(f"{slug}: пара заданий видна", visible(page, "#tnPrevTask") and visible(page, "#tnNextTask"))
    s1 = task_sig(page)
    check(f"{slug}: «◀» недоступна в начале", page.locator("#tnPrevTask").is_disabled())
    page.click("#tnNextTask"); page.wait_for_timeout(300)
    s2 = task_sig(page)
    check(f"{slug}: «Следующее» даёт новое задание", s2 != s1)
    check(f"{slug}: «◀» стала доступна", not page.locator("#tnPrevTask").is_disabled())
    page.click("#tnPrevTask"); page.wait_for_timeout(300)
    check(f"{slug}: «◀» вернула прежнее задание", task_sig(page) == s1)
    page.click("#tnNextTask"); page.wait_for_timeout(300)
    check(f"{slug}: «▶» после «◀» — то, что было, а не новое", task_sig(page) == s2)
    page.click("#tnNextTask"); page.wait_for_timeout(300)
    s3 = task_sig(page)
    check(f"{slug}: дальше истории — новое задание", s3 not in (s1, s2))

    # 4. ⟳ тоже в историю
    if visible(page, "#refreshBtn"):
        page.click("#refreshBtn"); page.wait_for_timeout(300)
        s4 = task_sig(page)
        page.click("#tnPrevTask"); page.wait_for_timeout(300)
        check(f"{slug}: «◀» после ⟳ возвращает задание до ⟳", task_sig(page) == s3,
              f"{s4[:60]}")

    # 5. кнопки типов
    n_types = page.evaluate("""() => {
        const all = typeof ALL_MODES !== 'undefined' ? ALL_MODES : (typeof MODES !== 'undefined' ? MODES : []);
        return all.length; }""")
    if n_types > 1 and slug != "oge1_5":
        check(f"{slug}: кнопки типов видны (типов {n_types})",
              visible(page, "#prevTypeBtn") and visible(page, "#nextTypeBtn"))

    # 9. №15–18: память ФИПИ и подпись «уже было»
    if slug == "oge15_18":
        page.evaluate("""() => { window.__shown = [];
            if (window.TaskCaptions) { const o = TaskCaptions.showCurrent;
              TaskCaptions.showCurrent = function(a, t, m){ window.__shown.push(JSON.stringify(t)); return o.apply(this, arguments); }; } }""")
        mem_before = page.evaluate("JSON.stringify(Object.keys(localStorage).filter(k => k.startsWith('fipiMix:')).sort().map(k => [k, localStorage.getItem(k)]))")
        before = task_sig(page)
        page.click("#tnPrevTask"); page.wait_for_timeout(300)
        back = task_sig(page)
        mem_after = page.evaluate("JSON.stringify(Object.keys(localStorage).filter(k => k.startsWith('fipiMix:')).sort().map(k => [k, localStorage.getItem(k)]))")
        check("oge15_18: возврат не меняет память fipiMix", mem_before == mem_after,
              f"{mem_before[:120]} → {mem_after[:120]}")
        shown = page.evaluate("window.__shown")
        check("oge15_18: подпись «уже было» получила возвращённое задание",
              bool(shown) and shown[-1] == back, f"{len(shown)} вызовов")
        check("oge15_18: возвращённое задание другое", back != before)

    # 6. «Обучение»
    if page.locator("#tabLearn").count() and visible(page, "#tabLearn"):
        page.click("#tabLearn"); page.wait_for_timeout(300)
        if not visible(page, "#refreshBtn"):
            check(f"{slug}: в «Обучении» пары нет", not visible(page, "#tnNextTask"))
        page.click("#tabExam"); page.wait_for_timeout(300)

    # 1. «Все типы» в углу ведёт к выбору и прячется
    page.click(types_sel); page.wait_for_timeout(300)
    check(f"{slug}: «Все типы» открыла выбор типов",
          page.evaluate("document.getElementById('taskArea').style.display === 'none'"))
    check(f"{slug}: на выборе «Все типы» в углу нет", not visible(page, types_sel))
    check(f"{slug}: без ошибок на странице", not errors, "; ".join(errors[:3]))
    ctx.close()

    # 7. кадр карточки
    ctx = browser.new_context(viewport={"width": 900, "height": 900})
    page = ctx.new_page()
    page.goto(f"{BASE}/{slug}.html?card=1", wait_until="load")
    page.wait_for_timeout(400)
    if slug != "oge1_5":
        check(f"{slug}: в кадре карточки угла нет", not page.evaluate("!!document.getElementById('cornerNav')"))
    check(f"{slug}: в кадре карточки пары нет", not visible(page, "#tnNextTask"))
    ctx.close()

    # 8. телефон
    ctx = browser.new_context(viewport={"width": 375, "height": 812}, is_mobile=True, has_touch=True)
    page = ctx.new_page()
    open_first_type(page, slug)
    over = page.evaluate("document.documentElement.scrollWidth - window.innerWidth")
    check(f"{slug}: 375 px — без прокрутки вбок", over <= 0, f"лишние {over}px")
    # кнопки угла против кнопок темы и доски справа (сам столбик может быть шире кнопок)
    hit = page.evaluate("""() => { const nav = document.getElementById('cornerNav');
        if (!nav) return false;
        const right = ['themeToggle', 'boardVisibilityToggle'].map(id => document.getElementById(id)).filter(Boolean)
          .map(e => e.getBoundingClientRect()).filter(r => r.width > 0);
        return [...nav.children].map(e => e.getBoundingClientRect()).filter(r => r.width > 0).some(r1 =>
          right.some(r2 => !(r1.right <= r2.left || r2.right <= r1.left || r1.bottom <= r2.top || r2.bottom <= r1.top))); }""")
    check(f"{slug}: 375 px — угол не налезает на кнопку темы", not hit)
    ctx.close()


def run_part2(browser):
    """ОГЭ ч. 2: пагинация как в обществознании, «Все типы» в углу, типы — только если их больше одного."""
    ctx = browser.new_context(viewport={"width": 1400, "height": 900})
    page = ctx.new_page()
    errors = []
    page.on("pageerror", lambda e: errors.append(str(e)))
    page.goto(f"{BASE}/oge_part2.html?n=20", wait_until="load")
    page.wait_for_timeout(600)
    # карточка вида (группы заданий ФИПИ): внутри неё листают ◀ ▶, между видами — кнопки типов
    page.locator(".mode-card[data-gid]").first.click()
    page.wait_for_timeout(400)
    check("oge_part2: кнопки типов видны (видов больше одного)",
          visible(page, "#prevTypeBtn") and visible(page, "#nextTypeBtn"))
    check("oge_part2: «Все типы» в углу видна", visible(page, "#cornerTypesBtn"))
    check("oge_part2: ◀ ▶ у счётчика", page.evaluate(
        "!!document.querySelector('.corner .task-pagination #prevProtoBtn') && !!document.querySelector('.task-pagination #nextProtoBtn')"))
    title = page.inner_text("#taskTitle")
    check("oge_part2: счётчик «задание N из M»", title.startswith("задание ") and " из " in title, title)
    check("oge_part2: стрелки без слов", page.inner_text("#nextProtoBtn").strip() == "▶", page.inner_text("#nextProtoBtn"))
    pid = page.evaluate("S.pid")
    page.click("#nextProtoBtn"); page.wait_for_timeout(400)
    check("oge_part2: ▶ — следующее задание", page.evaluate("S.pid") != pid)
    page.click("#cornerTypesBtn"); page.wait_for_timeout(400)
    check("oge_part2: «Все типы» открыла список", visible(page, "#pickerArea") and not visible(page, "#taskArea"))
    check("oge_part2: без ошибок на странице", not errors, "; ".join(errors[:3]))
    ctx.close()
    for n in (23, 24, 25):
        # свой контекст: иначе страница открывает прежнее задание №20 из памяти
        ctx = browser.new_context(viewport={"width": 1400, "height": 900})
        page = ctx.new_page()
        page.goto(f"{BASE}/oge_part2.html?n={n}", wait_until="load")
        page.wait_for_timeout(800)
        # номер мог сразу открыться на прежнем задании (exam-nav помнит его) — тогда список не нужен
        if not visible(page, "#taskArea"):
            page.locator("#protoList .mode-card:visible").first.click()
            page.wait_for_timeout(400)
        check(f"oge_part2: №{n} — задание открыто", visible(page, "#taskArea"))
        check(f"oge_part2: №{n} — открыт этот номер", page.evaluate("S.n") == n)
        check(f"oge_part2: №{n} — один тип, кнопок типов нет", not visible(page, "#prevTypeBtn"))
        ctx.close()
    ctx = browser.new_context(viewport={"width": 375, "height": 812}, is_mobile=True, has_touch=True)
    page = ctx.new_page()
    page.goto(f"{BASE}/oge_part2.html?n=20", wait_until="load")
    page.wait_for_timeout(600)
    page.locator(".mode-card[data-gid]").first.click()
    page.wait_for_timeout(400)
    over = page.evaluate("document.documentElement.scrollWidth - window.innerWidth")
    check("oge_part2: 375 px — без прокрутки вбок", over <= 0, f"лишние {over}px")
    ctx.close()


def run_1_5(browser):
    for width in (1400, 375):
        with browser.new_context(viewport={"width": width, "height": 900},
                                 is_mobile=width == 375, has_touch=width == 375) as ctx:
            page = ctx.new_page()
            page.goto(f"{BASE}/oge1_5.html")
            page.locator('.mode-card[data-id="tire_set1"]').click()
            nav = page.locator("#taskArea .type-nav #tasksetNav")
            nav.wait_for()
            check(f"oge1_5/{width}: угол «Все задания / Все типы»",
                  page.inner_text("#homeBtn").strip() == "Все задания"
                  and page.inner_text("#backBtn").strip() == "Все типы")
            check(f"oge1_5/{width}: кнопки заданий рядом с кнопками типов",
                  nav.locator("#prevTaskBtn").is_visible() and nav.locator("#nextTaskBtn").is_visible()
                  and visible(page, "#prevTypeBtn") and visible(page, "#nextTypeBtn"))
            check(f"oge1_5/{width}: назад недоступна в начале", nav.locator("#prevTaskBtn").is_disabled())
            nav.locator("#nextTaskBtn").click()
            check(f"oge1_5/{width}: следующее задание того же набора",
                  page.evaluate("curTasksetRef.id") == "tire_set1"
                  and nav.locator("#tasksetNavLabel").inner_text() == "Задание 2 из 5")
            page.locator("#nextTypeBtn").click()
            check(f"oge1_5/{width}: следующий тип в группе «Шины»",
                  page.evaluate("curTasksetRef.id") == "tire_demo2027"
                  and nav.locator("#tasksetNavLabel").inner_text() == "Задание 1 из 5")
            page.locator("#prevTypeBtn").click()
            check(f"oge1_5/{width}: предыдущий тип в группе «Шины»",
                  page.evaluate("curTasksetRef.id") == "tire_set1")
            check(f"oge1_5/{width}: без прокрутки вбок",
                  page.evaluate("document.documentElement.scrollWidth <= innerWidth"))
            page.locator("#backBtn").click()
            check(f"oge1_5/{width}: «Все типы» открыла выбор", visible(page, "#pickerArea"))


def main():
    pages = sys.argv[1:] or PAGES + ["oge_part2", "oge1_5"]
    with local_server(), sync_playwright() as p:
        browser = p.chromium.launch()
        for slug in pages:
            if slug == "oge_part2":
                run_part2(browser)
            elif slug == "oge1_5":
                run_1_5(browser)
            else:
                run_page(browser, slug)
        browser.close()
    bad = [n for n, ok in results if not ok]
    print(f"\n{len(results) - len(bad)} из {len(results)} проверок прошли")
    if bad:
        print("FAIL")
        sys.exit(1)
    print("готово")


if __name__ == "__main__":
    main()
