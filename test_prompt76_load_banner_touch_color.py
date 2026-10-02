"""
Промпт №76: плашка «доска загружена не полностью» и «свой цвет» на планшете.

1. Живой случай (доска Юли). До промпта №10 база отдавала при входе только
   первую тысячу объектов: 19 сентября на доске стало 1325 объектов, и
   последние 325 (конец урока) у учителя 25-го не показались. Низ доски
   выглядел пустым — там же написали новый урок, а когда загрузка
   починилась, два урока легли друг на друга. Потолок №10 снял, но
   неполная загрузка возможна и сейчас (связь, сбой базы), а видно это было
   только в консоли. Теперь на доске плашка:
     - загрузка затянулась — спокойная «загружается»;
     - ответ неполный, идут повторы — жёлтая;
     - повторы кончились — красная с «Повторить», держится до полной загрузки
       и не сменяется спокойной на время очередной попытки.

2. На планшете не открывалась палитра «свой цвет»: «+» звал .click() у
   спрятанного поля цвета, мобильные браузеры такой клик не выполняют.
   Теперь настоящее поле лежит прозрачным слоем поверх «+», палец попадает
   прямо в него.

Живой realtime и настоящую базу из песочницы не проверить — заглушка
supabase-js та же, что в test_prompt10 (постраничная выдача, потолок строк,
сбои отдельных запросов). Системную палитру браузера тест не открывает:
проверяется, что касание доходит до настоящего поля (событие isTrusted),
а выбор цвета — событиями 'input'/'change', как их шлёт само поле.
"""
import sys

from playwright.sync_api import sync_playwright

from test_prompt10_shared_board_load import (
    local_server, open_shared, pen, board_ids, LOADED,
)

BANNER = """() => { const el = document.getElementById('bdCloudLoad');
    if (!el || !el.classList.contains('open')) return null;
    const r = el.getBoundingClientRect();
    return { kind: ['wait', 'warn', 'bad'].find(k => el.classList.contains(k)) || '',
             text: el.querySelector('.bd-cl-text').textContent,
             retry: !el.querySelector('.bd-cl-retry').hidden,
             retryText: el.querySelector('.bd-cl-retry').textContent,
             retryDisabled: el.querySelector('.bd-cl-retry').disabled,
             visible: r.width > 0 && r.height > 0 && getComputedStyle(el).display !== 'none' }; }"""

STATE = "() => window.__cloudDiffTest.loadState()"


def run():
    failures = []

    def check(cond, label, extra=""):
        print(("[OK] " if cond else "[FAIL] ") + label + (("  — " + str(extra)) if (extra and not cond) else ""))
        if not cond:
            failures.append(label)

    many = [pen(i) for i in range(1500)]
    all_ids = {o["id"] for o in many}

    with local_server(), sync_playwright() as p:
        browser = p.chromium.launch()

        # ═══ 1. Плашка загрузки ═══════════════════════════════════════════
        ctx = browser.new_context(viewport={"width": 1280, "height": 800})

        # 1а. быстрая загрузка — плашки нет совсем (не мелькает на каждом входе)
        page = open_shared(ctx, "T", many, many, setup_js="""() => {
            window.__bannerSeen = false;
            new MutationObserver(() => { const el = document.getElementById('bdCloudLoad');
              if (el && el.classList.contains('open')) window.__bannerSeen = true; })
              .observe(document.body, { subtree: true, childList: true, attributes: true, attributeFilter: ['class'] });
        }""")
        page.wait_for_timeout(900)
        check(page.evaluate(BANNER) is None, "1а. доска загрузилась быстро — плашки нет")
        check(not page.evaluate("() => window.__bannerSeen"), "1а. плашка не мелькнула ни разу")
        page.close()

        # 1б. загрузка затянулась — спокойная плашка, после загрузки исчезает
        page = open_shared(ctx, "T", many, many, wait_loaded=False,
                           setup_js="() => { window.__fake.delays.select = [2500, 2500, 2500]; }")
        page.wait_for_timeout(1200)
        b = page.evaluate(BANNER)
        check(b is not None and b["kind"] == "wait" and "загружается" in b["text"] and b["visible"],
              "1б. долгая загрузка — видна спокойная плашка «загружается»", b)
        check(b is not None and not b["retry"], "1б. у спокойной плашки нет кнопки «Повторить»", b)
        page.wait_for_function(LOADED, timeout=20000)
        page.wait_for_timeout(100)
        check(page.evaluate(BANNER) is None, "1б. загрузилось — плашка исчезла")
        check(board_ids(page) == all_ids, "1б. доска целиком")
        page.close()

        # 1в. одна страница ответа сбоит — жёлтая плашка, повтор догружает, плашка уходит
        page = open_shared(ctx, "T", [], many, wait_loaded=False,
                           setup_js="() => { window.__fake.selectErrors = [false, true]; }")
        page.wait_for_function("() => window.__cloudDiffTest.loadState() === 'retry'", timeout=10000)
        b = page.evaluate(BANNER)
        check(b is not None and b["kind"] == "warn" and "не видна" in b["text"] and b["visible"],
              "1в. неполный ответ — жёлтая плашка «часть записей может быть не видна»", b)
        page.wait_for_function(LOADED, timeout=15000)
        page.wait_for_timeout(100)
        check(page.evaluate(BANNER) is None, "1в. повтор догрузил — плашка исчезла")
        check(board_ids(page) == all_ids, "1в. после повтора доска целиком")
        page.close()

        # 1г. база не отвечает совсем — после всех повторов красная плашка с
        # «Повторить»; по кнопке, когда связь вернулась, доска догружается
        page = open_shared(ctx, "T", many[:200], many, wait_loaded=False,
                           setup_js="() => { window.__fake.selectErrors = Array(5000).fill(true); }")
        page.wait_for_function("() => window.__cloudDiffTest.loadState() === 'retry'", timeout=10000)
        check(page.evaluate(BANNER)["kind"] == "warn", "1г. первые сбои — жёлтая плашка")
        page.wait_for_function("() => window.__cloudDiffTest.loadState() === 'failed'", timeout=30000)
        b = page.evaluate(BANNER)
        check(b is not None and b["kind"] == "bad" and "не полностью" in b["text"] and "Не пишите" in b["text"],
              "1г. повторы кончились — красная плашка «загружена не полностью, не пишите на пустых местах»", b)
        check(b is not None and b["retry"] and b["retryText"] == "Повторить" and not b["retryDisabled"],
              "1г. на красной плашке кнопка «Повторить»", b)
        check(len(board_ids(page)) == 200, "1г. своё с устройства на месте, ничего не удалено")
        # очередная попытка (сверка раз в полминуты) снова неудачна — красная не
        # сменяется спокойной, пока пробуем
        page.evaluate("() => { window.__fake.delays.select = [1500]; }")
        page.evaluate("() => window.__cloudDiffTest.reconcileNow()")
        page.wait_for_function("() => window.__cloudDiffTest.loadState() === 'loading'", timeout=5000)
        b = page.evaluate(BANNER)
        check(b is not None and b["kind"] == "bad", "1г. во время повторной попытки плашка остаётся красной", b)
        check(b is not None and b["retryDisabled"] and b["retryText"] == "Пробую…",
              "1г. пока попытка идёт, кнопка «Пробую…» и не нажимается", b)
        page.wait_for_function("() => window.__cloudDiffTest.loadState() === 'failed'", timeout=10000)
        check(page.evaluate(BANNER)["kind"] == "bad", "1г. попытка не удалась — по-прежнему красная")
        # связь вернулась — «Повторить»
        page.evaluate("() => { window.__fake.selectErrors = []; window.__fake.delays.select = []; }")
        page.click("#bdCloudLoad .bd-cl-retry")
        page.wait_for_function(LOADED, timeout=15000)
        page.wait_for_timeout(100)
        check(page.evaluate(BANNER) is None, "1г. «Повторить» догрузил доску — плашка исчезла")
        check(board_ids(page) == all_ids, "1г. после «Повторить» доска целиком")
        check(not page.evaluate("() => window.__fake.deletes().length"), "1г. в базу не ушло ни одного удаления")

        # 1д. ушли на список досок — плашки нет; красная плашка не переходит на
        # другую доску (новое открытие начинает с чистого листа)
        page.evaluate("() => { window.__fake.selectErrors = Array(5000).fill(true); }")
        page.evaluate("() => window.backToList()")
        page.wait_for_timeout(300)
        check(page.evaluate(BANNER) is None, "1д. на списке досок плашки нет")
        page.evaluate("() => { window.__fake.selectErrors = []; }")
        page.evaluate("() => window.openBoard('bShared')")
        page.wait_for_function(LOADED, timeout=15000)
        page.wait_for_timeout(100)
        check(page.evaluate(BANNER) is None, "1д. повторный вход без сбоев — плашки нет")
        page.close()

        # 1е. обычная (не общая) доска — плашки нет вовсе
        page = open_shared(ctx, "T", many[:10], [], wait_loaded=False,
                           setup_js="() => { window.__fake.selectErrors = Array(5000).fill(true); }")
        page.evaluate("""() => { const b = window.getCurrentBoard(); window.backToList(); }""")
        page.wait_for_timeout(300)
        page.evaluate("""() => { const d = window.getDB(); const b = d.boards.find(x => x.id === 'bShared');
            delete b.cloudBoardId; delete b.cloudRole; }""")
        page.evaluate("() => window.openBoard('bShared')")
        page.wait_for_timeout(2500)
        check(page.evaluate(BANNER) is None, "1е. на обычной доске плашки нет")
        page.close()
        ctx.close()

        # ═══ 2. «Свой цвет» на планшете ═══════════════════════════════════
        tab = browser.new_context(viewport={"width": 1024, "height": 768}, has_touch=True, is_mobile=True)
        page = open_shared(tab, "T", many[:5], many[:5])
        errors = []
        page.on("pageerror", lambda e: errors.append(str(e)))
        page.tap('#bdDock .bd-tool[data-tool="pen"]')
        page.wait_for_timeout(150)
        check(page.evaluate("() => document.getElementById('bdOptbar').classList.contains('open')"),
              "2. на планшете касание «Ручки» открывает панель цветов")
        hit = page.evaluate("""() => { const r = document.getElementById('bdSwatchAdd').getBoundingClientRect();
            const el = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
            const ri = document.getElementById('bdColorInput').getBoundingClientRect();
            return { id: el && el.id, same: Math.abs(r.left - ri.left) < 1 && Math.abs(r.top - ri.top) < 1
                     && Math.abs(r.width - ri.width) < 1 && Math.abs(r.height - ri.height) < 1, w: r.width }; }""")
        check(hit["id"] == "bdColorInput", "2. палец на «+» попадает в настоящее поле цвета, а не в кнопку", hit)
        check(hit["same"] and hit["w"] > 10, "2. поле цвета ровно накрывает «+»", hit)
        # касание доходит до поля как настоящее (isTrusted) — значит, палитру
        # откроет сам браузер, без программного .click()
        page.evaluate("""() => { window.__colorTaps = [];
            document.getElementById('bdColorInput').addEventListener('click', (e) => window.__colorTaps.push(e.isTrusted)); }""")
        base = page.evaluate("() => B.recentColors.slice()")
        page.tap("#bdColorInput")
        page.wait_for_timeout(150)
        check(page.evaluate("() => window.__colorTaps") == [True], "2. касание «+» — настоящий клик по полю цвета",
              page.evaluate("() => window.__colorTaps"))
        page.evaluate("""() => { const inp = document.getElementById('bdColorInput');
            ['#123456', '#2468ac'].forEach(h => { inp.value = h; inp.dispatchEvent(new Event('input', { bubbles: true })); });
            inp.dispatchEvent(new Event('change', { bubbles: true })); }""")
        pal = page.evaluate("() => B.recentColors.slice()")
        check(pal == base + ["#2468ac"], "2. выбранный цвет — одна новая ячейка в конце", pal)
        check(page.evaluate("() => curColorTok") == "#2468ac", "2. выбранный цвет стал цветом ручки")
        # полная палитра: поле выключено, касание ничего не добавляет
        page.evaluate("""() => { const inp = document.getElementById('bdColorInput');
            for (let k = 0; B.recentColors.length < 12; k++){ inp.dispatchEvent(new MouseEvent('click'));
              inp.value = '#7700' + (10 + k); inp.dispatchEvent(new Event('input', { bubbles: true }));
              inp.dispatchEvent(new Event('change', { bubbles: true })); } }""")
        check(page.evaluate("() => B.recentColors.length") == 12, "2. палитра заполнена до 12")
        check(page.evaluate("() => document.getElementById('bdColorInput').disabled && document.getElementById('bdSwatchAdd').disabled"),
              "2. на полной палитре выключены и «+», и поле цвета")
        # на сенсорном экране наведения нет — крестик «убрать» виден у выбранного цвета
        hover_none = page.evaluate("() => matchMedia('(hover:none)').matches")
        check(hover_none, "2. эмуляция планшета: (hover:none)")
        page.tap('#bdSwatches .bd-swatch:last-child')
        page.wait_for_timeout(100)
        xs = page.evaluate("""() => Array.from(document.querySelectorAll('#bdSwatches .bd-swatch')).map(s =>
            getComputedStyle(s.querySelector('.bd-swatch-x')).display)""")
        check(xs[-1] == "flex" and all(x == "none" for x in xs[:-1]),
              "2. на планшете крестик виден у выбранного цвета (и только у него)", xs)
        page.tap('#bdSwatches .bd-swatch:last-child .bd-swatch-x')
        page.wait_for_timeout(100)
        check(page.evaluate("() => B.recentColors.length") == 11, "2. касание крестика убирает цвет")
        check(page.evaluate("() => !document.getElementById('bdColorInput').disabled"),
              "2. после удаления цвета поле снова доступно")
        check(not errors, "2. без ошибок на странице", errors)
        page.close()
        tab.close()

        # ═══ 3. Компьютер: то же поле, фон текста и цвет клетки ════════════
        ctx = browser.new_context(viewport={"width": 1280, "height": 800})
        page = open_shared(ctx, "T", many[:5], many[:5])
        errors = []
        page.on("pageerror", lambda e: errors.append(str(e)))
        page.click('#bdDock .bd-tool[data-tool="pen"]')
        page.evaluate("""() => { window.__colorTaps = [];
            document.getElementById('bdColorInput').addEventListener('click', (e) => window.__colorTaps.push(e.isTrusted)); }""")
        r = page.evaluate("() => { const r = document.getElementById('bdSwatchAdd').getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; }")
        page.mouse.click(r["x"], r["y"])
        page.wait_for_timeout(150)
        check(page.evaluate("() => window.__colorTaps") == [True], "3. мышью по «+» — тоже настоящий клик по полю цвета")
        check(not page.evaluate("() => matchMedia('(hover:none)').matches") and
              page.evaluate("""() => Array.from(document.querySelectorAll('#bdSwatches .bd-swatch-x'))
                  .every(x => getComputedStyle(x).display === 'none')"""),
              "3. на компьютере крестики по-прежнему только при наведении")
        # фон текста: поле поверх своей «+»
        bg = page.evaluate("""() => { const b = document.getElementById('bdBgSwatchAdd'), i = document.getElementById('bdBgColorInput');
            return { sameParent: b.parentElement === i.parentElement && b.parentElement.classList.contains('bd-color-hit'),
                     pos: getComputedStyle(i).position, op: getComputedStyle(i).opacity, pe: getComputedStyle(i).pointerEvents }; }""")
        check(bg["sameParent"] and bg["pos"] == "absolute" and bg["op"] == "0" and bg["pe"] != "none",
              "3. «свой цвет фона» текста — поле поверх «+»", bg)
        page.evaluate("""() => { const inp = document.getElementById('bdBgColorInput');
            inp.value = '#abcdef'; inp.dispatchEvent(new Event('input', { bubbles: true })); }""")
        check(page.evaluate("() => curBgTok") == "#abcdef", "3. выбор цвета фона текста работает")
        # цвет клетки: поле не пересоздаётся, пока палитра открыта (перерисовка на каждое 'input')
        page.evaluate("() => { document.getElementById('bdGridColorInput').__mark = 1; }")
        page.evaluate("""() => { const inp = document.getElementById('bdGridColorInput');
            ['#111111', '#334455'].forEach(h => { inp.value = h; inp.dispatchEvent(new Event('input', { bubbles: true })); }); }""")
        g = page.evaluate("""() => { const i = document.getElementById('bdGridColorInput'), a = document.getElementById('bdGridSwatchAdd');
            return { mark: i.__mark, grid: B.gridColor, active: a.classList.contains('active'), bg: a.style.background,
                     txt: a.textContent, presets: document.querySelectorAll('#bdGridPresets .bd-grid-swatch').length,
                     inside: !!i.closest('#bdGridSwatches') }; }""")
        check(g["mark"] == 1 and g["inside"], "3. цвет клетки: поле то же самое, не пересоздано при выборе", g)
        check(g["grid"] == "#334455" and g["active"] and g["txt"] == "", "3. свой цвет клетки выбран и показан на «+»", g)
        check(g["presets"] > 0, "3. готовые цвета клетки на месте", g)
        page.evaluate("() => document.querySelector('#bdGridPresets .bd-grid-swatch').click()")
        g2 = page.evaluate("() => { const a = document.getElementById('bdGridSwatchAdd'); return { active: a.classList.contains('active'), txt: a.textContent }; }")
        check(not g2["active"] and g2["txt"] == "+", "3. готовый цвет клетки — «+» снова пустой", g2)
        check(not errors, "3. без ошибок на странице", errors)
        page.close()
        ctx.close()
        browser.close()

    print()
    if failures:
        print("ПРОВАЛЕНО:", len(failures))
        for f in failures:
            print(" -", f)
        sys.exit(1)
    print("Все проверки пройдены")


if __name__ == "__main__":
    run()
