"""
Главная (index.html), «Классы»: подвкладка «1–4 классы» с заглушками тем
начальной школы вместо прежней «1 класс».

Проверяет:
  1. подвкладки «Классов» — «1–4 классы», 5, 6, 7, 8, 9, 10, 11; у 5–11
     прежние названия и прежние тренажёры (ссылки по порядку);
  2. в «1–4 классах» четыре подзаголовка (1–4 класс), в каждом пять блоков,
     в первом блоке 1 класса темы ровно в заданном порядке, всего 88 тем;
  3. заглушки — не ссылки, подписаны «скоро», приглушены, не ловят нажатие:
     щелчок по заглушке никуда не ведёт;
  4. «Состав числа» живой: стоит третьим в «1 класс → Числа и величины»,
     открывает sostav.html; счётчик подвкладки — · 1 (заглушки не считаются);
  5. «Основа» не изменилась, заглушек в ней нет; в панели досок
     (TRAINERS_PANEL_GROUPS из trainer-tasks.js) заглушек нет;
  6. сохранённая старая вкладка g1 открывает «1–4 классы» и перезаписывается;
     мусорный subtabId не ломает загрузку;
  7. тёмная тема — подзаголовок класса светлый на тёмном; телефон 375 и
     320 px — без прокрутки вбок, «скоро» не наезжает на название;
  8. ошибок JavaScript нет.

Запуск: python3 test_prompt_grades_1_4.py (сервер поднимается сам).
"""
import contextlib
import http.client
import json
import os
import subprocess
import sys
import time

from playwright.sync_api import sync_playwright

PORT = 8994
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


# 5–11 класс — как было до правки; сверяем, что их не задели
OTHER_GRADES = {
    "g5": ("5 класс", ["addition.html", "subtraction.html", "multiplication.html", "division.html",
                       "fraction_multiply.html", "fraction_divide.html", "percent.html"]),
    "g6": ("6 класс", ["gcd.html", "lcm.html", "neg_pos.html", "fraction_multiply.html",
                       "fraction_divide.html", "oge6.html", "percent.html"]),
    "g7": ("7 класс", ["linear.html"]),
    "g8": ("8 класс", ["quadratic.html"]),
    "g9": ("9 класс", ["oge9.html", "oge10.html", "oge13.html", "oge14.html"]),
    "g10": ("10 класс", ["trig_equations.html", "logarithms.html"]),
    "g11": ("11 класс", ["trig_equations.html", "logarithms.html"]),
}
BASE_HREFS = ["sostav.html", "addition.html", "subtraction.html", "multiplication.html", "division.html",
              "neg_pos.html", "fraction_multiply.html", "fraction_divide.html", "oge6.html",
              "percent.html", "powers.html", "linear.html", "quadratic.html"]
BLOCKS = ["Числа и величины", "Арифметические действия", "Текстовые задачи",
          "Геометрические фигуры", "Математическая информация"]
G1_NUMBERS = ["Числа от 1 до 20: счёт, чтение, запись", "Сравнение чисел: больше, меньше, равно",
              "Состав числа: домики", "Порядок чисел, соседние числа", "Длина: сантиметр, дециметр"]

ITEMS = """() => [...document.querySelectorAll('#topics .topic-item')].map(e => ({
  tag: e.tagName, href: e.getAttribute('href'), name: e.querySelector('.item-name').textContent,
  soon: e.classList.contains('soon'), label: (e.querySelector('.item-soon')||{}).textContent || '' }))"""

SECTIONS = """() => [...document.querySelectorAll('#topics .grade-section')].map(s => ({
  id: s.dataset.grade, head: s.querySelector('.grade-head').textContent.trim(),
  blocks: [...s.querySelectorAll('.topic')].map(t => ({
    title: t.querySelector('.section-title').textContent.trim(),
    items: [...t.querySelectorAll('.topic-item')].map(e => ({
      name: e.querySelector('.item-name').textContent, href: e.getAttribute('href'),
      soon: e.classList.contains('soon') })) })) }))"""


def main():
    errors = []
    with local_server(), sync_playwright() as p:
        b = p.chromium.launch()

        def new_ctx(w=1100, h=900, theme="light", nav_state=None):
            ctx = b.new_context(viewport={"width": w, "height": h})
            # шрифты и CDN из песочницы не грузятся — не ждём их
            ctx.route("https://**/*", lambda r: r.abort())
            init = f"try{{if(!localStorage.getItem('theme'))localStorage.setItem('theme','{theme}');"
            if nav_state is not None:
                # только при первом заходе: иначе перезагрузка снова подложила бы старое
                init += (f"if(!sessionStorage.getItem('_seeded')){{sessionStorage.setItem('_seeded','1');"
                         f"localStorage.setItem('ogeNav:state', {json.dumps(json.dumps(nav_state))});}}")
            init += "}catch(e){}"
            ctx.add_init_script(init)
            return ctx

        def new_page(ctx):
            pg = ctx.new_page()
            pg.on("pageerror", lambda e: errors.append(str(e)))
            return pg

        def go(pg, path="/index.html"):
            pg.goto(BASE + path, wait_until="domcontentloaded")
            pg.wait_for_selector("#mainTabs .nav-tab")
            pg.wait_for_timeout(150)

        def open_sub(pg, sid):
            pg.click('.nav-tab[data-id="grades"]')
            pg.click(f'.nav-subtab[data-id="{sid}"]')
            pg.wait_for_timeout(120)

        ctx = new_ctx()
        pg = new_page(ctx)
        go(pg)

        print("1. подвкладки «Классов»")
        pg.click('.nav-tab[data-id="grades"]')
        pg.wait_for_timeout(120)
        subs = pg.eval_on_selector_all("#subTabs .nav-subtab", "els => els.map(e => [e.dataset.id, e.innerText.trim()])")
        check([s[0] for s in subs] == ["g1_4", "g5", "g6", "g7", "g8", "g9", "g10", "g11"], f"порядок подвкладок: {[s[0] for s in subs]}")
        check(subs[0][1].replace(" ", " ") == "1–4 классы · 1", f"первая — «1–4 классы · 1»: {subs[0][1]!r}")
        check(pg.locator('.nav-subtab[data-id="g1"]').count() == 0, "отдельной «1 класс» больше нет")
        for sid, (title, hrefs) in OTHER_GRADES.items():
            open_sub(pg, sid)
            label = pg.inner_text(f'.nav-subtab[data-id="{sid}"]')
            items = pg.evaluate(ITEMS)
            check(label.startswith(title) and [i["href"] for i in items] == hrefs and not any(i["soon"] for i in items),
                  f"{title}: без изменений ({[i['href'] for i in items]})")
            check(pg.locator("#topics .grade-head").count() == 0, f"{title}: подзаголовков классов нет")

        print("2. «1–4 классы»: четыре класса, блоки, темы")
        open_sub(pg, "g1_4")
        secs = pg.evaluate(SECTIONS)
        check([s["head"] for s in secs] == ["1 класс", "2 класс", "3 класс", "4 класс"], f"подзаголовки: {[s['head'] for s in secs]}")
        check(all([bl["title"] for bl in s["blocks"]] == BLOCKS for s in secs), "в каждом классе пять блоков по порядку")
        per = [sum(len(bl["items"]) for bl in s["blocks"]) for s in secs]
        check(per == [19, 24, 21, 24], f"тем по классам 19/24/21/24: {per}")
        check([i["name"] for i in secs[0]["blocks"][0]["items"]] == G1_NUMBERS, "1 класс → Числа и величины: темы ровно по порядку")
        names = [i["name"] for s in secs for bl in s["blocks"] for i in bl["items"]]
        check("Дроби: доли и дроби, сравнение, сложение и вычитание дробей с одинаковыми знаменателями" in names
              and "Логические задачи и олимпиадные темы" == names[-1], "последние темы 4 класса на месте")

        print("3. заглушки")
        items = pg.evaluate(ITEMS)
        stubs = [i for i in items if i["soon"]]
        live = [i for i in items if not i["soon"]]
        check(len(stubs) == 87 and len(live) == 1, f"87 заглушек и 1 живой: {len(stubs)} / {len(live)}")
        check(all(i["tag"] == "DIV" and i["href"] is None for i in stubs), "заглушки — не ссылки, без href")
        check(all(i["label"] == "скоро" for i in stubs), "у каждой заглушки подпись «скоро»")
        st = pg.eval_on_selector("#topics .topic-item.soon", "e => [getComputedStyle(e).opacity, getComputedStyle(e).pointerEvents]")
        check(float(st[0]) < 1 and st[1] == "none", f"заглушка приглушена и не ловит нажатие: {st}")
        url0 = pg.url
        box = pg.locator("#topics .topic-item.soon").nth(5).bounding_box()
        pg.mouse.click(box["x"] + box["width"] / 2, box["y"] + box["height"] / 2)
        pg.wait_for_timeout(300)
        check(pg.url == url0, "щелчок по заглушке никуда не ведёт")
        pg.locator("#topics .topic-item.soon").first.click(force=True)
        pg.wait_for_timeout(300)
        check(pg.url == url0, "и принудительный щелчок тоже")

        print("4. «Состав числа» живой")
        third = secs[0]["blocks"][0]["items"][2]
        check(third["href"] == "sostav.html" and not third["soon"], "третьим в «Числах и величинах» — ссылка на sostav.html")
        pg.click('#topics a[href="sostav.html"]')
        pg.wait_for_load_state("domcontentloaded")
        pg.wait_for_timeout(400)
        check(pg.url.endswith("/sostav.html"), f"открылся sostav.html: {pg.url}")
        check(pg.locator("#start").count() == 1, "страница состава числа загрузилась")

        print("5. «Основа» и панель досок")
        go(pg)
        pg.click('.nav-tab[data-id="base"]')
        pg.wait_for_timeout(120)
        items = pg.evaluate(ITEMS)
        check([i["href"] for i in items] == BASE_HREFS, f"«Основа» без изменений: {[i['href'] for i in items]}")
        check(not any(i["soon"] for i in items), "в «Основе» заглушек нет")
        pg.add_script_tag(url=BASE + "/trainer-tasks.js")
        panel = pg.evaluate("() => TRAINERS_PANEL_GROUPS.flatMap(g => g.items.map(i => ({name: i.name, href: i.href})))")
        stub_names = {i["name"] for i in stubs}
        check(len(panel) > 10 and all(i["href"] for i in panel), f"в панели досок только тренажёры со ссылкой ({len(panel)})")
        check(not any(i["name"] in stub_names for i in panel), "заглушек в панели досок нет")
        ctx.close()

        print("6. сохранённая старая вкладка g1")
        ctx = new_ctx(nav_state={"tabId": "grades", "subtabId": "g1"})
        pg = new_page(ctx)
        go(pg)
        act = pg.eval_on_selector_all(".nav-tab.active, .nav-subtab.active", "els => els.map(e => e.dataset.id)")
        check(act == ["grades", "g1_4"], f"открылись «1–4 классы»: {act}")
        check(pg.locator("#topics .grade-head").count() == 4, "четыре подзаголовка на месте")
        stv = pg.evaluate("JSON.parse(localStorage.getItem('ogeNav:state'))")
        check(stv == {"tabId": "grades", "subtabId": "g1_4"}, f"в хранилище уже новый id: {stv}")
        pg.reload(wait_until="domcontentloaded")
        pg.wait_for_timeout(200)
        act = pg.eval_on_selector_all(".nav-tab.active, .nav-subtab.active", "els => els.map(e => e.dataset.id)")
        check(act == ["grades", "g1_4"], f"после перезагрузки тоже: {act}")
        ctx.close()
        ctx = new_ctx(nav_state={"tabId": "grades", "subtabId": "zzz"})
        pg = new_page(ctx)
        go(pg)
        act = pg.eval_on_selector_all(".nav-tab.active, .nav-subtab.active", "els => els.map(e => e.dataset.id)")
        check(act == ["grades", "g1_4"], f"мусорный subtabId → первая подвкладка: {act}")
        ctx.close()

        print("7. тёмная тема и телефон")
        for theme in ("light", "dark"):
            ctx = new_ctx(theme=theme, nav_state={"tabId": "grades", "subtabId": "g1_4"})
            pg = new_page(ctx)
            go(pg)
            col = pg.eval_on_selector(".grade-head", "e => getComputedStyle(e).color")
            rgb = [int(x) for x in col[col.index("(") + 1:col.index(")")].split(",")[:3]]
            lum = sum(rgb) / 3
            check((lum > 170) if theme == "dark" else (lum < 110), f"{theme}: подзаголовок читается ({col})")
            ctx.close()
        for w in (375, 320):
            for theme in ("light", "dark"):
                ctx = new_ctx(w=w, h=800, theme=theme, nav_state={"tabId": "grades", "subtabId": "g1_4"})
                pg = new_page(ctx)
                go(pg)
                sw = pg.evaluate("document.documentElement.scrollWidth")
                check(sw <= w, f"{w}px {theme}: без прокрутки вбок ({sw})")
                bad = pg.evaluate("""() => [...document.querySelectorAll('#topics .topic-item.soon')].filter(e => {
                    const r = e.getBoundingClientRect(), n = e.querySelector('.item-name').getBoundingClientRect(),
                          s = e.querySelector('.item-soon').getBoundingClientRect();
                    return n.right > s.left + 0.5 || s.right > r.right + 0.5 || r.right > innerWidth + 0.5;
                  }).length""")
                check(bad == 0, f"{w}px {theme}: «скоро» не наезжает на название и не вылезает ({bad})")
                heads = pg.eval_on_selector_all(".grade-head", "els => els.map(e => e.getBoundingClientRect().right <= innerWidth)")
                check(len(heads) == 4 and all(heads), f"{w}px {theme}: подзаголовки в экране")
                ctx.close()

        print("7б. фон вверху не зависит от длины списка")
        # пятна фона раньше считались от высоты body: на длинном списке верх
        # темнел. Пустой кусок фона слева сверху должен совпадать попиксельно
        for theme in ("light", "dark"):
            for w, h in ((1140, 1100), (390, 844)):
                ctx = new_ctx(w=w, h=h, theme=theme)
                pg = new_page(ctx)
                go(pg)
                clip = {"x": 0, "y": 0, "width": min(140, w // 4), "height": 60}
                oge = pg.screenshot(clip=clip)
                pg.click('.nav-tab[data-id="grades"]')
                pg.wait_for_timeout(200)
                tall = pg.evaluate("document.body.offsetHeight")
                g14 = pg.screenshot(clip=clip)
                check(tall > 5000 and oge == g14, f"{theme} {w}px: угол фона на «1–4 классах» ({tall}px) как на «ОГЭ»")
                ctx.close()

        print("8. ошибки JavaScript")
        check(not errors, f"ошибок нет: {errors}")
        b.close()

    print(f"\nИтого: ошибок {len(FAILS)}")
    sys.exit(1 if FAILS else 0)


if __name__ == "__main__":
    main()
