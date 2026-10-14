"""
Главная (index.html): выбор предмета — Математика, Русский, Обществознание, Английский.

Проверяет:
  1. по умолчанию открыта математика, её дерево разделов прежнее (Экзамены,
     Классы, Основа; ОГЭ из двух частей, №20–25 в oge_part2.html, НОД и НОК в
     6 классе) — старые тесты главной на это опираются;
  2. метка «банк ФИПИ» — у №19–21 математики и у №2–12 русского, больше ни у кого;
  3. «Русский» перекрашивает страницу в малиновый, показывает ОГЭ: №1–13 со
     сквозной нумерацией, №2–12 ведут в rus_oge.html?n=…, №1 — в rus_oge01.html, №13 — в rus_oge13.html;
  4. у каждого предмета своя запомненная вкладка; предмет помнится после
     перезагрузки; математика хранит вкладку под прежним ключом ogeNav:state;
  5. обществознание и английский — свой текст «готовим»;
  6. ?subject=… открывает предмет и пропадает из адреса; мусор → математика;
  7. открытая «Подборка» закрывается выбором предмета;
  8. из списка русского — в тренажёр и кнопкой «←» обратно, на русский;
  9. тёмная тема — свой тон акцента; телефон 390 px — без горизонтальной
     прокрутки, капсула предметов в экране;
 10. ошибок JavaScript нет.

Совместный режим здесь не менялся: переход по карточке во время сессии идёт
через тот же обработчик на #topics. Websocket из песочницы закрыт — переход
учителя с учениками по карточке русского проверять на сайте руками.

Запуск: python3 test_prompt_index_subjects.py (сервер поднимается сам).
"""
import contextlib
import http.client
import os
import subprocess
import sys
import time

from playwright.sync_api import sync_playwright

PORT = 8992
BASE = f"http://127.0.0.1:{PORT}"
HERE = os.path.dirname(os.path.abspath(__file__))


@contextlib.contextmanager
def local_server():
    proc = subprocess.Popen(
        [sys.executable, "-m", "http.server", str(PORT)], cwd=HERE,
        stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL,
    )
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


FAILS = []


def check(cond, msg):
    print(("  ок  " if cond else "  ОШИБКА  ") + msg)
    if not cond:
        FAILS.append(msg)


INK = "getComputedStyle(document.documentElement).getPropertyValue('--ink').trim().toUpperCase()"
ITEMS = """() => [...document.querySelectorAll('#topics .topic-item')].map(e => ({
  href: e.getAttribute('href'), num: e.querySelector('.item-num').textContent,
  name: e.querySelector('.item-name').textContent, chip: !!e.querySelector('.item-chip'),
  soon: e.classList.contains('soon') }))"""


def main():
    errors = []
    with local_server(), sync_playwright() as p:
        b = p.chromium.launch()
        # шрифты Google из песочницы не грузятся — не ждём их
        def blockfonts(route):
            route.abort()

        def new_ctx(w=1100, h=900, theme="light"):
            ctx = b.new_context(viewport={"width": w, "height": h})
            ctx.route("**/fonts.googleapis.com/**", blockfonts)
            ctx.route("**/fonts.gstatic.com/**", blockfonts)
            ctx.add_init_script(f"try{{if(!localStorage.getItem('theme'))localStorage.setItem('theme','{theme}')}}catch(e){{}}")
            return ctx

        def new_page(ctx):
            pg = ctx.new_page()
            pg.on("pageerror", lambda e: errors.append(str(e)))
            return pg

        def go(pg, path):
            pg.goto(BASE + path, wait_until="domcontentloaded")
            pg.wait_for_selector("#subjBar .subj-btn")
            pg.wait_for_timeout(150)

        def subj(pg, sid):
            pg.click(f'.subj-btn[data-id="{sid}"]')
            pg.wait_for_timeout(150)

        ctx = new_ctx()
        pg = new_page(ctx)

        print("1. математика по умолчанию, дерево прежнее")
        go(pg, "/index.html")
        check(pg.evaluate("document.documentElement.dataset.subject") == "math", "по умолчанию — математика")
        btns = pg.eval_on_selector_all(".subj-btn", "els => els.map(e => [e.dataset.id, e.innerText.trim(), e.classList.contains('active')])")
        check([x[1] for x in btns] == ["Математика", "Русский", "Обществознание", "Английский"], f"четыре предмета: {[x[1] for x in btns]}")
        check([x[0] for x in btns if x[2]] == ["math"], "активна только «Математика»")
        check(pg.evaluate(INK) == "#004C99", f"акцент математики прежний синий ({pg.evaluate(INK)})")
        tabs = pg.eval_on_selector_all("#mainTabs .nav-tab", "els => els.map(e => e.dataset.id)")
        check(tabs == ["exams", "grades", "base"], f"вкладки математики: {tabs}")
        pg.click('.nav-tab[data-id="exams"]')
        pg.click('.nav-subtab[data-id="oge"]')
        pg.wait_for_timeout(150)
        titles = pg.eval_on_selector_all("#topics .section-title", "els => els.map(e => e.textContent)")
        check(titles == ["Часть 1 — краткий ответ", "Часть 2 — развёрнутый ответ"], f"ОГЭ из двух частей: {titles}")
        items = pg.evaluate(ITEMS)
        part2 = [i for i in items if (i["href"] or "").startswith("oge_part2.html")]
        check([i["href"] for i in part2] == [f"oge_part2.html?n={n}" for n in range(20, 26)], "№20–25 ведут в oge_part2.html")
        check(part2[0]["num"] == "13" and part2[-1]["num"] == "18", "нумерация второй части продолжается (13–18)")

        print("2. метки «банк ФИПИ» больше нет (промпт №22)")
        chips = [i["href"] for i in items if i["chip"]]
        check(chips == [], f"у математики меток нет: {chips}")
        pg.click('.nav-tab[data-id="grades"]')
        pg.click('.nav-subtab[data-id="g6"]')
        pg.wait_for_timeout(150)
        hrefs = [i["href"] for i in pg.evaluate(ITEMS)]
        check("gcd.html" in hrefs and "lcm.html" in hrefs, "6 класс: НОД и НОК на месте")
        check(not any(i["chip"] for i in pg.evaluate(ITEMS)), "у тренажёров-генераторов метки нет")

        print("3. русский")
        subj(pg, "rus")
        check(pg.evaluate("document.documentElement.dataset.subject") == "rus", "data-subject = rus")
        check(pg.evaluate(INK) == "#9E2A47", f"акцент — малиновый ({pg.evaluate(INK)})")
        active_tab_bg = pg.eval_on_selector(".nav-tab.active", "e => getComputedStyle(e).backgroundColor")
        check(active_tab_bg == "rgb(158, 42, 71)", f"активная вкладка малиновая ({active_tab_bg})")
        check(pg.eval_on_selector_all("#mainTabs .nav-tab", "els => els.map(e => e.dataset.id)") == ["exams"], "у русского пока одна вкладка — «Экзамены»")
        subs = pg.eval_on_selector_all("#subTabs .nav-subtab", "els => els.map(e => [e.dataset.id, e.classList.contains('active')])")
        check(subs == [["oge", True], ["ege", False]], f"ОГЭ и ЕГЭ, открыт ОГЭ: {subs}")
        titles = pg.eval_on_selector_all("#topics .section-title", "els => els.map(e => e.textContent)")
        check(titles == ["Часть 1 — изложение", "Часть 2 — краткий ответ", "Часть 3 — сочинение"], f"три части: {titles}")
        items = pg.evaluate(ITEMS)
        check([i["num"] for i in items] == [f"{n:02d}" for n in range(1, 14)], "сквозная нумерация 01–13")
        check([i["href"] for i in items if i["href"]] == ["rus_oge01.html"] + [f"rus_oge.html?n={n}" for n in range(2, 13)] + ["rus_oge13.html"], "№1 — rus_oge01.html, №2–12 — rus_oge.html?n=…, №13 — rus_oge13.html")
        check(not any(i["soon"] for i in items), "у русского ОГЭ «скоро» больше нет")
        check(not any(i["chip"] for i in items), "у русского меток «банк ФИПИ» тоже нет (промпт №22)")
        check(items[4]["name"] == "№5. Расстановка запятых", f"названия как в rus_oge.html: {items[4]['name']}")
        cnt = pg.inner_text(".nav-tab.active")
        check("13" in cnt, f"счётчик вкладки — 13 готовых ({cnt.strip()})")
        check(pg.evaluate("localStorage.getItem('ogeNav:subject')") == "rus", "предмет запомнен")

        print("4. вкладки у каждого предмета свои")
        pg.click('.nav-subtab[data-id="ege"]')
        pg.wait_for_timeout(150)
        check("ЕГЭ по русскому" in pg.inner_text("#topics"), "ЕГЭ по русскому — «готовим»")
        go(pg, "/index.html")
        check(pg.evaluate("document.documentElement.dataset.subject") == "rus", "после перезагрузки — снова русский")
        check(pg.eval_on_selector(".nav-subtab.active", "e => e.dataset.id") == "ege", "и та же подвкладка ЕГЭ")
        subj(pg, "math")
        act = pg.eval_on_selector_all(".nav-tab.active, .nav-subtab.active", "els => els.map(e => e.dataset.id)")
        check(act == ["grades", "g6"], f"математика вернулась на свою вкладку (6 класс): {act}")
        st = pg.evaluate("JSON.parse(localStorage.getItem('ogeNav:state'))")
        check(st == {"tabId": "grades", "subtabId": "g6"}, f"у математики прежний ключ ogeNav:state: {st}")
        check(pg.evaluate("JSON.parse(localStorage.getItem('ogeNav:state:rus')).subtabId") == "ege", "у русского свой ключ")

        print("5. обществознание и английский")
        subj(pg, "soc")
        check(pg.evaluate(INK) == "#17694F", "обществознание — зелёный")
        check("Обществознание готовим" in pg.inner_text("#topics"), "обществознание — «готовим»")
        check(pg.inner_text(".nav-tab.active").strip() == "Экзамены", "у пустого раздела нет «· 0»")
        subj(pg, "eng")
        check(pg.evaluate(INK) == "#5B3596", "английский — фиолетовый")
        check("Английский готовим" in pg.inner_text("#topics"), "английский — «готовим»")

        print("6. предмет в адресе")
        go(pg, "/index.html?subject=rus")
        check(pg.evaluate("document.documentElement.dataset.subject") == "rus", "?subject=rus открывает русский")
        check("subject" not in pg.url, f"параметр убран из адреса ({pg.url})")
        check(pg.evaluate("localStorage.getItem('ogeNav:subject')") == "rus", "и запомнен")
        go(pg, "/index.html?subject=chem")
        check(pg.evaluate("document.documentElement.dataset.subject") == "math", "неизвестный предмет → математика")
        check(pg.eval_on_selector_all(".subj-btn.active", "els => els.map(e => e.dataset.id)") == ["math"], "и активна «Математика»")

        print("7. «Подборка» и предмет")
        pg.click("#basketToggle")
        pg.wait_for_timeout(150)
        check("Пока пусто" in pg.inner_text("#topics"), "«Подборка» открылась")
        subj(pg, "math")
        check(pg.query_selector("#topics .topic-item") is not None and not pg.evaluate("basketOpen"), "клик по текущему предмету закрывает «Подборку»")
        pg.click("#basketToggle")
        subj(pg, "rus")
        # у русского запомнена подвкладка ЕГЭ (шаг 4) — вместо списка там «готовим»
        check(not pg.evaluate("basketOpen") and "Пока пусто" not in pg.inner_text("#topics")
              and pg.evaluate("document.documentElement.dataset.subject") == "rus", "выбор другого предмета закрывает «Подборку»")
        pg.click('.nav-subtab[data-id="oge"]')

        print("8. в тренажёр и обратно")
        pg.click('a.topic-item[href="rus_oge.html?n=5"]')
        pg.wait_for_url("**/rus_oge.html?n=5*")
        pg.wait_for_timeout(400)
        check(pg.evaluate("window.__rusOge && window.__rusOge.S.n") == 5, "карточка №5 открыла задание №5")
        go(pg, "/index.html?subject=math")
        pg.goto(BASE + "/rus_oge.html?n=5", wait_until="domcontentloaded")
        pg.wait_for_timeout(300)
        pg.click("#homeBtn")
        pg.wait_for_selector("#subjBar .subj-btn")
        pg.wait_for_timeout(150)
        check(pg.evaluate("document.documentElement.dataset.subject") == "rus", "«←» из тренажёра — на главную, на русский")
        check(pg.url.endswith("/index.html"), f"адрес чистый ({pg.url})")
        ctx.close()

        print("9. тёмная тема и телефон")
        ctx = new_ctx(theme="dark")
        pg = new_page(ctx)
        go(pg, "/index.html?subject=rus")
        check(pg.evaluate("document.documentElement.dataset.theme") == "dark", "тёмная тема")
        check(pg.evaluate(INK) == "#C9506E", f"тёмный тон русского ({pg.evaluate(INK)})")
        col = pg.eval_on_selector(".subj-btn.active", "e => getComputedStyle(e).color")
        check(col == "rgb(255, 255, 255)", f"активный предмет в тёмной — белым ({col})")
        ctx.close()

        ctx = new_ctx(390, 844)
        pg = new_page(ctx)
        for s in ("math", "rus", "soc", "eng"):
            go(pg, f"/index.html?subject={s}")
            sw = pg.evaluate("document.documentElement.scrollWidth")
            r = pg.eval_on_selector("#subjBar", "e => { const b = e.getBoundingClientRect(); return [b.left, b.right]; }")
            check(sw <= 390 and r[0] >= 0 and r[1] <= 390, f"{s}: 390 px без прокрутки, капсула в экране ({sw}, {r})")
        top_h1 = pg.eval_on_selector("h1", "e => e.getBoundingClientRect().top")
        side_bottom = pg.eval_on_selector(".lg-side", "e => e.getBoundingClientRect().bottom")
        check(top_h1 >= side_bottom - 2, f"заголовок не под капсулой кнопок ({top_h1} ≥ {side_bottom})")
        ctx.close()
        b.close()
    check(not errors, f"ошибок JavaScript нет {errors[:3]}")
    print("\nИТОГ:", "всё прошло" if not FAILS else f"ошибок: {len(FAILS)}")
    sys.exit(1 if FAILS else 0)


if __name__ == "__main__":
    main()
