"""
Промпт №22 нового списка «ФИПИ и наши»: на экране выбора типа в каждом
тренажёре ОГЭ — две колонки, слева «ФИПИ» (задание из демоверсии и задания
открытого банка), справа «Наши»; с главной убрана метка «банк ФИПИ».

Проверяет:
  1. все 13 страниц ОГЭ (№1–5, 6–14, 15–18, 19, часть 2 — №20 и №22):
     колонки на месте, ни одна карточка не потерялась и не задвоилась,
     в «ФИПИ» — ровно задания ФИПИ, порядок внутри колонок — прежний,
     «Случайно» над колонками; без fipi-split.js страница — как раньше;
  2. шапки колонок — как вкладки на главной (та же полоса и та же «активная»
     вкладка: фон, цвет, шрифт, скругление, отступы);
  3. телефон 390: колонки друг под другом, «ФИПИ» сверху, без прокрутки вбок;
  4. нажатие на карточку в обеих колонках открывает тип; «← все типы» —
     снова две колонки; ◀ ▶ между типами ходят как раньше (из №0 ФИПИ в наш
     первый тип и обратно); в ОГЭ ч. 2 — группа ФИПИ и ◀ ▶ внутри неё;
  5. стрелки между номерами экзамена: первый заход — первая карточка
     (№0 демоверсии из колонки «ФИПИ»), возврат — тот прототип, что был;
  6. «+» на доске (ещё такое же) — того же типа и для типа ФИПИ (№19, банк),
     и для нашего, и для №0;
  7. ЕГЭ (та же страница, что ОГЭ ч. 2) колонок не получил;
  8. на главной метки «банк ФИПИ» нет.

Совместный режим здесь на заглушке: экран выбора у ученика рисуется тем же
renderPicker, но живьём (websocket к Supabase) это перепроверяется на сайте
руками.

Запуск: python3 test_prompt22_fipi_columns.py (сервер поднимается сам).
"""
import json
import os
import sys

from playwright.sync_api import sync_playwright

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import test_prompt14_log_trig_show as T14  # noqa: E402  доска, панель тренажёров, «+»

BASE = T14.BASE
results = []


def check(name, ok, extra=""):
    results.append((name, bool(ok)))
    print(f"[{'OK' if ok else 'FAIL'}] {name}" + (f": {extra}" if extra and not ok else ""))


# страница → какие карточки должны встать в «ФИПИ»
PAGES = {
    "oge1_5.html": ["tire_demo2027"],
    "oge6.html": ["demo2027"], "oge7.html": ["demo2027"], "oge8.html": ["demo2027"],
    "oge9.html": ["demo2027"], "oge10.html": ["type0"], "oge11.html": ["demo2027"],
    "oge12.html": ["demo2027"], "oge13.html": ["demo2027"], "oge14.html": ["demo2027"],
    "oge15_18.html": ["demo15", "demo16", "demo17", "demo18"],
    "oge19.html": ["demo2027", "fipi"],
    "oge_part2.html?n=20": None,   # вся группа номера — ФИПИ, своих нет
    "oge_part2.html?n=22": ["22.0"],
}
GRID = "document.querySelector('#modesGrid') || document.querySelector('#protoList')"
CARD_ID = "c => c.dataset.id || c.dataset.pid || c.dataset.gid || ('soon:' + c.textContent.trim())"
ORIG_JS = f"""() => {{ const g = {GRID};
  return [...g.querySelectorAll('.mode-card')].map({CARD_ID}); }}"""
SPLIT_JS = f"""() => {{ const g = {GRID}; const s = g.querySelector(':scope > .fs-split');
  if (!s) return null;
  const col = sel => {{ const c = s.querySelector(sel);
    return {{ head: c.querySelector('.fs-tab').textContent, ids: [...c.querySelectorAll('.mode-card')].map({CARD_ID}),
             empty: !!c.querySelector('.fs-empty') }}; }};
  return {{ fipi: col('.fs-fipi'), ours: col('.fs-ours'),
           top: [...g.children].filter(x => x.classList.contains('mode-card')).map({CARD_ID}),
           firstIsFipi: s.firstElementChild.classList.contains('fs-fipi') }}; }}"""


def fresh(browser, w=1280, h=900, block_split=False):
    ctx = browser.new_context(viewport={"width": w, "height": h})
    ctx.route("https://**/*", lambda r: r.abort())
    if block_split:
        ctx.route("**/fipi-split.js", lambda r: r.abort())
    page = ctx.new_page()
    errors = []
    page.on("pageerror", lambda e: errors.append(str(e)))
    return ctx, page, errors


def wait_picker(page, url):
    page.goto(f"{BASE}/{url}")
    page.wait_for_function(f"() => {{ const g = {GRID}; return g && g.querySelector('.mode-card'); }}")
    # у ОГЭ ч. 2 задания ФИПИ приходят отдельным файлом — ждём, пока он придёт
    page.wait_for_function("() => !window.__fipiBusy || !window.__fipiBusy()")
    page.wait_for_timeout(400)


def test_columns(browser):
    errs = []
    for url, want_fipi in PAGES.items():
        ctx, page, errors = fresh(browser, block_split=True)
        wait_picker(page, url)
        orig = page.evaluate(ORIG_JS)
        no_split = page.evaluate("() => !document.querySelector('.fs-split')")
        errs += errors
        ctx.close()
        ctx, page, errors = fresh(browser)
        wait_picker(page, url)
        sp = page.evaluate(SPLIT_JS)
        errs += errors
        ctx.close()
        name = url.replace(".html", "")
        check(f"1. {name}: без модуля — один список, как раньше", no_split and orig, str(orig[:3]))
        if not sp:
            check(f"1. {name}: колонки на месте", False)
            continue
        all_ids = sp["top"] + sp["fipi"]["ids"] + sp["ours"]["ids"]
        # у карточек «скоро» (№1–5) нет id, а текст одинаковый — их считаем только числом
        real = [x for x in all_ids if not x.startswith("soon:")]
        check(f"1. {name}: ни одна карточка не потерялась и не задвоилась",
              sorted(all_ids) == sorted(orig) and len(set(real)) == len(real), f"{all_ids} vs {orig}")
        want = want_fipi if want_fipi is not None else [x for x in orig if x != "random"]
        check(f"1. {name}: в «ФИПИ» — {want[:4]}{'…' if len(want) > 4 else ''}", sp["fipi"]["ids"] == want, str(sp["fipi"]["ids"]))
        rest = [x for x in orig if x not in sp["fipi"]["ids"] and x not in sp["top"]]
        check(f"1. {name}: «Наши» — остальные в прежнем порядке", sp["ours"]["ids"] == rest, f"{sp['ours']['ids'][:5]} vs {rest[:5]}")
        check(f"1. {name}: шапки «ФИПИ» и «Наши», «ФИПИ» первой",
              sp["fipi"]["head"].startswith("ФИПИ") and sp["ours"]["head"].startswith("Наши") and sp["firstIsFipi"],
              f"{sp['fipi']['head']} / {sp['ours']['head']}")
        check(f"1. {name}: «Случайно» над колонками, а не в них",
              all(x == "random" for x in sp["top"]) and "random" not in sp["fipi"]["ids"] + sp["ours"]["ids"], str(sp["top"]))
        if want_fipi is None or url.endswith("n=22"):
            check(f"1. {name}: пустая колонка «Наши» — с пояснением, а не пустая", sp["ours"]["empty"] and not sp["ours"]["ids"])
    check("1. без ошибок JavaScript", not errs, str(errs[:2]))


TAB_JS = """(sel) => { const e = document.querySelector(sel); const s = getComputedStyle(e);
  return [s.backgroundColor, s.color, s.fontSize, s.fontWeight, s.borderRadius, s.paddingTop, s.paddingLeft, s.fontFamily]; }"""
BAR_JS = """(sel) => { const e = document.querySelector(sel); const s = getComputedStyle(e);
  return [s.borderRadius, s.paddingTop, s.borderTopWidth, s.backdropFilter || s.webkitBackdropFilter]; }"""


def test_heads(browser):
    ctx, page, _ = fresh(browser)
    page.goto(f"{BASE}/index.html")
    page.wait_for_selector(".nav-tab.active")
    tab = page.evaluate(TAB_JS, ".nav-tab.active")
    bar = page.evaluate(BAR_JS, ".nav-tabs")
    for url in ("oge6.html", "oge19.html", "oge_part2.html?n=20"):
        wait_picker(page, url)
        t = page.evaluate(TAB_JS, ".fs-fipi .fs-tab")
        b = page.evaluate(BAR_JS, ".fs-fipi .fs-head")
        check(f"2. {url}: шапка колонки — как активная вкладка главной", t == tab, f"{t} vs {tab}")
        check(f"2. {url}: полоса шапки — как полоса вкладок главной", b == bar, f"{b} vs {bar}")
    ctx.close()


def test_phone(browser):
    for url in ("oge6.html", "oge7.html", "oge15_18.html", "oge19.html", "oge_part2.html?n=20"):
        ctx, page, _ = fresh(browser, 390, 800)
        wait_picker(page, url)
        m = page.evaluate("""() => { const f = document.querySelector('.fs-fipi').getBoundingClientRect(),
            o = document.querySelector('.fs-ours').getBoundingClientRect();
            return { fBottom: f.bottom, oTop: o.top, fw: f.width, ow: o.width,
                     over: document.documentElement.scrollWidth - innerWidth }; }""")
        check(f"3. 390 px {url}: «ФИПИ» сверху, «Наши» под ней, на всю ширину",
              m["fBottom"] <= m["oTop"] and abs(m["fw"] - m["ow"]) < 1 and m["fw"] > 300, str(m))
        check(f"3. 390 px {url}: без прокрутки вбок", m["over"] <= 0, str(m))
        ctx.close()
    ctx, page, _ = fresh(browser, 1280, 900)
    wait_picker(page, "oge6.html")
    m = page.evaluate("""() => { const f = document.querySelector('.fs-fipi').getBoundingClientRect(),
        o = document.querySelector('.fs-ours').getBoundingClientRect(); return [f.left < o.left, Math.abs(f.top - o.top)]; }""")
    check("3. компьютер: «ФИПИ» слева, «Наши» справа, на одной высоте", m[0] and m[1] < 1, str(m))
    ctx.close()


def visible(page, sel):
    return page.evaluate(f"() => {{ const e = document.querySelector({json.dumps(sel)}); return !!e && e.offsetParent !== null; }}")


def test_open(browser):
    ctx, page, errors = fresh(browser)
    # №19: тип банка ФИПИ из левой колонки и наш из правой
    wait_picker(page, "oge19.html")
    page.click('.fs-fipi .mode-card[data-id="fipi"]')
    page.wait_for_timeout(300)
    src = page.evaluate("() => document.getElementById('sourceNote').textContent")
    check("4. №19: карточка банка ФИПИ открывает тип, подпись источника есть",
          visible(page, "#taskArea") and src.startswith("Источник: открытый банк заданий ФИПИ"), src)
    page.click("#backBtn")
    page.wait_for_timeout(200)
    check("4. №19: «← все типы» — снова две колонки", visible(page, ".fs-split") and page.evaluate("() => document.querySelectorAll('.fs-col').length") == 2)
    page.click('.fs-ours .mode-card[data-id="geom"]')
    page.wait_for_timeout(300)
    check("4. №19: наш тип открывается, подписи источника нет",
          page.evaluate("() => tsGetState().curMode") == "geom" and not visible(page, "#sourceNote"))
    # №6: ◀ ▶ между типами — из №0 (ФИПИ) в первый наш и обратно
    wait_picker(page, "oge6.html")
    page.click('.fs-fipi .mode-card[data-id="demo2027"]')
    page.wait_for_timeout(300)
    page.click("#nextTypeBtn")
    page.wait_for_timeout(300)
    a = page.evaluate("() => tsGetState().curMode")
    page.click("#prevTypeBtn")
    page.wait_for_timeout(300)
    b = page.evaluate("() => tsGetState().curMode")
    page.click("#prevTypeBtn")
    page.wait_for_timeout(300)
    c = page.evaluate("() => tsGetState().curMode")
    check("4. №6: «Следующий тип» из №0 — первый наш, «Предыдущий» — обратно, по кругу — последний наш",
          (a, b, c) == ("p1", "demo2027", "p9"), str((a, b, c)))
    page.click("#backBtn")
    page.wait_for_timeout(200)
    page.click('.fs-ours .mode-card[data-id="p4"]')
    page.wait_for_timeout(300)
    check("4. №6: карточка из «Наших» открывает свой тип", page.evaluate("() => tsGetState().curMode") == "p4")
    # №7 и №10: «Случайно» внутри списка осталось рабочим
    for url in ("oge7.html", "oge10.html"):
        wait_picker(page, url)
        page.click('#modesGrid > .mode-card.random')
        page.wait_for_timeout(300)
        check(f"4. {url}: «Случайно» над колонками работает", page.evaluate("() => tsGetState().curMode") == "random")
    # ОГЭ ч. 2: группа ФИПИ, ◀ ▶ внутри группы
    wait_picker(page, "oge_part2.html?n=20")
    gid = page.evaluate("() => document.querySelector('.fs-fipi .mode-card[data-gid]').dataset.gid")
    page.click(f'.fs-fipi .mode-card[data-gid="{gid}"]')
    page.wait_for_timeout(400)
    p1 = page.evaluate("() => S.pid")
    page.click("#nextProtoBtn")
    page.wait_for_timeout(300)
    p2 = page.evaluate("() => S.pid")
    grp = page.evaluate("(ids) => ids.map(id => (protos(20).find(p => p.id === id) || {}).group)", [p1, p2])
    check("4. ОГЭ ч. 2 №20: группа ФИПИ открывается, ◀ ▶ — внутри группы",
          p1 != p2 and grp == [gid, gid] and visible(page, ".ege-source"), f"{p1} {p2} {grp}")
    check("4. без ошибок JavaScript", not errors, str(errors[:2]))
    ctx.close()


def test_exam_nav(browser):
    ctx, page, errors = fresh(browser)
    wait_picker(page, "oge6.html")
    page.click('.fs-ours .mode-card[data-id="p3"]')
    page.wait_for_timeout(400)
    page.evaluate("() => document.querySelectorAll('.exam-nav-btn')[1].click()")   # → №7
    page.wait_for_url("**/oge7.html*")
    page.wait_for_function("() => typeof tsGetState === 'function' && tsGetState().curMode", timeout=10000)
    page.wait_for_timeout(500)
    first = page.evaluate("() => tsGetState().curMode")
    check("5. первый заход на №7 стрелкой — первая карточка, №0 из колонки «ФИПИ»", first == "demo2027", str(first))
    page.evaluate("() => document.querySelectorAll('.exam-nav-btn')[0].click()")   # ← №6
    page.wait_for_url("**/oge6.html*")
    page.wait_for_function("() => typeof tsGetState === 'function' && tsGetState().curMode", timeout=10000)
    page.wait_for_timeout(500)
    back = page.evaluate("() => tsGetState().curMode")
    check("5. возврат на №6 — тот же прототип из «Наших», что был", back == "p3", str(back))
    check("5. без ошибок JavaScript", not errors, str(errors[:2]))
    ctx.close()


def test_board_plus(browser):
    cases = [
        ("oge19", "oge19.html", '.fs-fipi .mode-card[data-id="fipi"]', "fipi",
         "!!(curTask && curTask.fipi) && document.getElementById('sourceNote').textContent.indexOf('Источник') === 0"),
        ("oge19", "oge19.html", '.fs-ours .mode-card[data-id="geom"]', "geom", "!(curTask && curTask.fipi)"),
        ("oge6", "oge6.html", '.fs-fipi .mode-card[data-id="demo2027"]', "demo2027", "true"),
        ("oge6", "oge6.html", '.fs-ours .mode-card[data-id="p2"]', "p2", "true"),
    ]
    bad, errs = [], []
    for tid, href, sel, want, extra in cases:
        ctx, page, errors = T14.open_board(browser)
        try:
            T14.open_trainer(page, tid, href)
            T14.fx(page, f"document.querySelector({json.dumps(sel)}).click()")
            page.wait_for_timeout(600)
            oid = T14.add_to_board(page)[0]
            nid = T14.plus(page, oid)
            got = T14.gen_eval(page, "tsGetState().curMode") if nid else "нет +"
            ok_extra = T14.gen_eval(page, extra) if nid else False
            if got != want or ok_extra is not True:
                bad.append(f"{tid}/{want}: → {got} ({ok_extra})")
        except Exception as e:  # noqa: BLE001
            bad.append(f"{tid}/{want}: {repr(e)[:160]}")
        errs += errors
        ctx.close()
    check("6. «+» на доске — того же типа: банк ФИПИ №19, наш №19, №0 и наш №6", not bad, "; ".join(bad))
    check("6. без ошибок JavaScript", not errs, str(errs[:2]))


def test_ege_and_index(browser):
    ctx, page, errors = fresh(browser)
    for url in ("ege_prof.html?n=1", "ege_base.html?n=1"):
        page.goto(f"{BASE}/{url}")
        page.wait_for_selector("#protoList .mode-card")
        page.wait_for_timeout(300)
        check(f"7. {url}: колонок нет — список как был", page.evaluate("() => !document.querySelector('.fs-split')"))
    page.goto(f"{BASE}/index.html")
    page.wait_for_selector(".topic-item")
    page.click('.nav-tab[data-id="exams"]')
    page.click('.nav-subtab[data-id="oge"]')
    page.wait_for_timeout(200)
    html = page.content()
    check("8. на главной нет метки «банк ФИПИ»", "item-chip" not in html and "банк ФИПИ</span>" not in html)
    check("7–8. без ошибок JavaScript", not errors, str(errors[:2]))
    ctx.close()


def run():
    with T14.local_server(), sync_playwright() as p:
        browser = p.chromium.launch()
        for fn in (test_columns, test_heads, test_phone, test_open, test_exam_nav, test_board_plus, test_ege_and_index):
            try:
                fn(browser)
            except Exception as e:  # noqa: BLE001
                check(f"{fn.__name__}: исключение", False, repr(e)[:300])
        browser.close()
    failed = [n for n, ok in results if not ok]
    print()
    print("ИТОГ:", "всё прошло" if not failed else f"упало {len(failed)} из {len(results)}")
    sys.exit(1 if failed else 0)


if __name__ == "__main__":
    run()
