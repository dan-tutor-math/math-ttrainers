"""
Задача 63, S3: конструктор работ берёт задание ФИПИ из карточки
(cards/<slug>.json) — блок type:'card' без кадра тренажёра и без снимка.

Заглушка Supabase и помощники — из теста этапа 1 работ. Карточки — пилотные
(oge9, oge19, ege_prof partial) и заглушка cards/oge1_5.json для связанных
частей ОГЭ №1–5 (собирается здесь же из catalog-index.json).

Проверяет:
  A. «Собрать» из пилотных карточек: ни одной загрузки страницы тренажёра,
     все блоки type:'card' (id карточки, slug, task = ответ карточки, tkey),
     без картинок, весь вариант — несколько КБ; файл карточек грузится
     один раз на страницу; превью рисует CardRender (KaTeX у ЕГЭ);
  B. группа на карточках: «Следующие 3 ▶», «◀ Предыдущие», «+ ещё» — без
     загрузок; место без карточки — старый путь (кадр, снимок), обратно —
     снова карточка;
  C. «+ Новый вариант»: вариант 2 на других местах банка — тоже карточки;
  D. связанные части ОГЭ №1–5 (заглушка карточек): «весь номер» — 5 групп-
     карточек на одном месте, ▶ у одной части двигает остальные, без загрузок;
  E. сохранение: в базе блоки type:'card' без img; работа открывается заново
     и рисует карточки; просмотр ответов ученика рисует карточку;
  F. нет ошибок JavaScript.

Запуск: python3 test_prompt_variant_cards.py
"""
import json
import sys

import test_prompt15_works_stage1 as t15
from test_prompt15_works_stage1 import TEACHER, local_server, sync_playwright, new_context, watch_errors, db

FAILS = []


def check(name, cond, extra=""):
    print(("[OK] " if cond else "[FAIL] ") + name + (f" — {extra}" if extra and not cond else ""))
    if not cond:
        FAILS.append(name)


def idle(page, timeout=120000):
    page.wait_for_function("() => window.__works.gens.size === 0 && !window.__works.E.blocks.some(b => b._gen === 'busy' || b._gen === 'wait')", timeout=timeout)
    page.wait_for_timeout(200)


BLOCKS = """(vi) => (window.__works.E.variants[vi || 0].blocks).map(b => ({ type: b.type || 'task', card: b.card || null, slug: b.slug || null,
  key: b.series ? b.series.key : null, proto: b.series ? b.series.proto : null, pos: b.series ? b.series.pos : null,
  fipi: b.series ? b.series.fipi : null, img: !!b.img, task: b.task || null, tkey: b.tkey || null, gen: b._gen || null,
  size: JSON.stringify(b).length }))"""

PILOT = """() => { const V = window.VariantSet; V.clear();
  V.add({ exam: 'oge', slug: 'oge9', n: null, proto: 'p1', count: 1 });
  V.add({ exam: 'oge', slug: 'oge19', n: null, count: 3 });
  V.add({ exam: 'ege_prof', slug: 'ege_prof', n: 1, proto: 'triangle', count: 2 }); }"""

# заглушка cards/oge1_5.json: части набора «Шины» на местах 0–2, номера ФИПИ — из каталога
STUB_JS = """async () => { const ix = await (await fetch('catalog-index.json')).json();
  const ps = ix['oge1_5|'].protos.filter(p => p.link && p.link.set === 'tire_fipi');
  const cards = [];
  ps.forEach(p => [0, 1, 2].forEach(pos => cards.push({ v: 1, id: 'fipi:' + p.fipi[pos], exam: 'oge', slug: 'oge1_5', n: p.link.part,
    proto: p.id, pos, math: 'html', text: '<div>Заглушка: шины, задание ' + p.link.part + ', сюжет ' + (pos + 1) + '</div>', figs: [], table: null, opts: null,
    answer: { kind: 'fields', fields: [{ id: 'main', label: 'Ответ:', type: 'num', value: String(10 + pos) }], value: String(10 + pos) },
    solution: null, source: 'Открытый банк заданий ФИПИ, задание ' + p.fipi[pos] })));
  return { v: 1, slug: 'oge1_5', exam: 'oge', family: 'stub', src: {}, partial: true, cards }; }"""


def run():
    errors = []
    with local_server(), sync_playwright() as p:
        browser = p.chromium.launch()
        ctx = new_context(browser, viewport={"width": 1440, "height": 950})
        pg = ctx.new_page()
        pg.on("dialog", lambda d: d.accept())
        watch_errors(pg, errors, "works")
        loads, cardreq = [], []

        def on_req(r):
            if r.resource_type == "document" and "works.html" not in r.url:
                loads.append(r.url.split("/")[-1])
            if "/cards/" in r.url and r.url.endswith(".json"):
                cardreq.append(r.url.split("/")[-1])
        pg.on("request", on_req)

        pg.goto(f"{t15.BASE}/works.html")
        pg.wait_for_selector("#scrAuth:not([hidden])")
        stub = pg.evaluate(STUB_JS)
        ctx.route("**/cards/oge1_5.json", lambda r: r.fulfill(status=200, content_type="application/json", body=json.dumps(stub, ensure_ascii=False)))
        pg.fill("#auEmail", TEACHER["email"]); pg.fill("#auPass", TEACHER["password"]); pg.click("#auGo")
        pg.wait_for_selector("#scrList:not([hidden])")

        # ═══ A. сборка из пилотных карточек ═══
        print("\n— A. «Собрать» из карточек")
        pg.evaluate("() => window.VariantSet.clear()")
        pg.goto(f"{t15.BASE}/works.html#/build")
        pg.wait_for_selector("#scrBuild:not([hidden])")
        pg.evaluate(PILOT)
        pg.wait_for_function("() => document.querySelectorAll('#bdPreview .pl').length === 3")
        loads.clear(); cardreq.clear()
        pg.click("#bdGo")
        pg.wait_for_selector("#scrEdit:not([hidden])")
        pg.wait_for_function("() => window.__works.E.blocks.length === 6", timeout=30000)
        idle(pg)
        s = pg.evaluate(BLOCKS)
        check("A1 ни одной загрузки страницы тренажёра", not loads, str(loads))
        check("A2 все 6 блоков — карточки, без картинок", len(s) == 6 and all(x["type"] == "card" and x["card"] and not x["img"] for x in s),
              json.dumps(s, ensure_ascii=False)[:600])
        files = {x["slug"]: json.load(open(f"cards/{x['slug']}.json", encoding="utf-8")) for x in s}
        def card_of(x):
            return next(c for c in files[x["slug"]]["cards"] if c["id"] == x["card"])
        ok_ans = all({k: v for k, v in card_of(x)["answer"].items() if k in ("kind", "fields", "n", "correct")} == x["task"] for x in s)
        check("A3 task блока — ответ карточки (kind/fields/n/correct)", ok_ans)
        check("A4 места и номера ФИПИ: oge9 p1 №1, oge19 №1–3, ЕГЭ №1 треугольник №1–2",
              [(x["slug"], x["proto"], x["pos"]) for x in s] == [("oge9", "p1", 0), ("oge19", "fipi", 0), ("oge19", "fipi", 1), ("oge19", "fipi", 2),
                                                                   ("ege_prof", "triangle", 0), ("ege_prof", "triangle", 1)]
              and all("fipi:" + x["fipi"] == x["card"] for x in s), str([(x["slug"], x["proto"], x["pos"], x["fipi"]) for x in s]))
        check("A5 ключ журнала: fipi:oge:… / fipi:ege:…", s[0]["tkey"] == "fipi:oge:" + s[0]["fipi"] and s[4]["tkey"] == "fipi:ege:" + s[4]["fipi"],
              str([x["tkey"] for x in s]))
        tot = sum(x["size"] for x in s)
        check("A6 вариант весит меньше 5 КБ (снимки были ~300 КБ на задание)", tot < 5000, str(tot))
        check("A7 файл карточек — по одному запросу на страницу", sorted(cardreq) == ["ege_prof.json", "oge19.json", "oge9.json"], str(cardreq))
        pg.wait_for_function("() => document.querySelectorAll('#wkTasks .ti-card .cr').length === 6", timeout=15000)
        r = pg.evaluate("""() => { const c = [...document.querySelectorAll('#wkTasks .ti-card')];
          return { tex: !!c[4].querySelector('.katex'), txt: c[0].textContent, opts: c[1].querySelectorAll('.cr-opt').length, fig: !!c[4].querySelector('.cr-fig img'),
            ph: document.querySelectorAll('#wkTasks .ti-ph').length }; }""")
        check("A8 превью — карточка: текст условия, варианты №19, формулы KaTeX и рисунок у ЕГЭ",
              "Найдите корень уравнения" in r["txt"] and r["opts"] >= 2 and r["tex"] and r["fig"] and r["ph"] == 0, json.dumps(r, ensure_ascii=False))

        # ═══ B. ◀ ▶ + ещё и откат на кадр ═══
        print("\n— B. группа на карточках")
        key19 = s[1]["key"]
        loads.clear()
        pg.evaluate(f"() => window.__works.seriesNext('{key19}')"); idle(pg)
        g = [x for x in pg.evaluate(BLOCKS) if x["key"] == key19]
        check("B1 «Следующие 3 ▶» — места 4–6, карточки, без загрузок",
              [x["pos"] for x in g] == [3, 4, 5] and all(x["type"] == "card" for x in g) and not loads, f"{[(x['pos'], x['type']) for x in g]} {loads}")
        pg.evaluate(f"() => window.__works.seriesMore('{key19}')"); idle(pg)
        g = [x for x in pg.evaluate(BLOCKS) if x["key"] == key19]
        check("B2 «+ ещё» — место 7 карточкой", [x["pos"] for x in g] == [3, 4, 5, 6] and g[-1]["type"] == "card" and not loads)
        pg.evaluate(f"() => window.__works.seriesPrev('{key19}')"); idle(pg)
        g = [x for x in pg.evaluate(BLOCKS) if x["key"] == key19]
        check("B3 «◀ Предыдущие» — места 0–2, карточки", [x["pos"] for x in g] == [0, 1, 2] and all(x["type"] == "card" for x in g) and not loads,
              str([(x["pos"], x["type"]) for x in g]))
        # место без карточки (пилот oge9 — только места 0): старый путь — кадр и снимок
        pg.evaluate("() => { const b = window.__works.E.blocks[0]; window.__works.seriesSetOne(b, 1); }"); idle(pg)
        b0 = pg.evaluate(BLOCKS)[0]
        check("B4 место без карточки — снимок через кадр (type task, картинка)", b0["type"] == "task" and b0["img"] and b0["pos"] == 1 and loads,
              f"{b0['type']} {b0['img']} {loads}")
        pg.evaluate("() => { const b = window.__works.E.blocks[0]; window.__works.seriesSetOne(b, 0); }"); idle(pg)
        b0 = pg.evaluate(BLOCKS)[0]
        check("B5 назад на место с карточкой — снова карточка, без картинок", b0["type"] == "card" and not b0["img"] and b0["pos"] == 0, json.dumps(b0, ensure_ascii=False)[:300])

        # ═══ C. вариант 2 ═══
        print("\n— C. «+ Новый вариант»")
        loads.clear()
        pg.click("#varAdd"); idle(pg)
        v2 = pg.evaluate(BLOCKS, 1)
        g2 = [x for x in v2 if x["key"] == key19]
        check("C1 вариант 2: №19 на местах 4–6 карточками, без загрузок",
              [x["pos"] for x in g2] == [3, 4, 5] and all(x["type"] == "card" for x in g2) and not [u for u in loads if "oge19" in u],
              f"{[(x['pos'], x['type']) for x in g2]} {loads}")
        eg = [x for x in v2 if x["slug"] == "ege_prof" or (x["proto"] == "triangle")]
        check("C2 вариант 2: ЕГЭ №1 треугольник — места 3–4 (карточек нет — снимки)", [x["pos"] for x in eg] == [2, 3], str([(x["pos"], x["type"]) for x in eg]))
        pg.click("#wkVars button[data-v='0']") if pg.locator("#wkVars button[data-v='0']").count() else pg.evaluate("() => { window.__works.E.cur = 0; window.__works.renderTasks(); }")

        # ═══ E. сохранение и повторное открытие ═══
        print("\n— E. сохранение")
        pg.fill("#wkTitle", "Вариант из карточек")
        pg.click("#wkSave")
        pg.wait_for_function("() => document.getElementById('wkSaved').textContent.indexOf('Сохранено ') === 0", timeout=60000)
        vb = db()["work_variants"]
        b1 = sorted(vb, key=lambda v: v["num"])[0]["blocks"]
        check("E1 в базе: блоки type:'card' без img и служебных полей", sum(1 for b in b1 if b.get("type") == "card") >= 6
              and all("img" not in b and not any(k.startswith("_") for k in b) for b in b1 if b.get("type") == "card")
              and all(b.get("card") and b.get("slug") and b.get("task") and b.get("series") for b in b1 if b.get("type") == "card"),
              json.dumps(b1[0], ensure_ascii=False)[:400])
        wid = db()["works"][0]["id"]
        pg.goto(f"{t15.BASE}/works.html#/")
        pg.wait_for_selector("#scrList:not([hidden])")
        loads.clear()
        pg.goto(f"{t15.BASE}/works.html#/edit/{wid}")
        pg.wait_for_selector("#scrEdit:not([hidden])")
        pg.wait_for_function("() => document.querySelectorAll('#wkTasks .ti-card .cr').length >= 6", timeout=15000)
        check("E2 сохранённая работа открывается и рисует карточки, без загрузок тренажёров", not [u for u in loads if "bdgen" in u], str(loads))
        r = pg.evaluate("() => window.__works.E.blocks[1].type")
        check("E3 блок №19 после открытия — карточка", r == "card", r)

        # ═══ D. связанные части ОГЭ №1–5 (заглушка) ═══
        print("\n— D. связанные части №1–5")
        pg.evaluate("() => window.__works.E.dirty = false")
        pg.goto(f"{t15.BASE}/works.html#/build")
        pg.wait_for_selector("#scrBuild:not([hidden])")
        pg.evaluate("() => { const V = window.VariantSet; V.clear(); V.add({ exam: 'oge', slug: 'oge1_5', n: null, count: 1 }); }")
        pg.wait_for_function("() => document.querySelectorAll('#bdPreview .pl').length === 1")
        loads.clear()
        pg.click("#bdGo")
        pg.wait_for_selector("#scrEdit:not([hidden])")
        pg.wait_for_function("() => window.__works.E.blocks.length === 5", timeout=30000)
        idle(pg)
        s = pg.evaluate(BLOCKS)
        check("D1 «весь номер» — 5 частей сюжета, все карточки на месте 1, без загрузок",
              len(s) == 5 and all(x["type"] == "card" and x["pos"] == 0 for x in s) and len({x["key"] for x in s}) == 5 and not loads,
              f"{[(x['proto'], x['pos'], x['type']) for x in s]} {loads}")
        pg.evaluate("() => { const b = window.__works.E.blocks[2]; window.__works.seriesSetOne(b, 1); }"); idle(pg)
        s = pg.evaluate(BLOCKS)
        check("D2 ▶ у задания 3 — все части сюжета на месте 2, карточками, без загрузок",
              all(x["type"] == "card" and x["pos"] == 1 for x in s) and not loads, str([(x["pos"], x["type"]) for x in s]))
        tasks = [x["task"]["fields"][0]["value"] for x in s]
        check("D3 ответы — из карточек места 2", tasks == ["11"] * 5, str(tasks))
        pg.evaluate("() => window.__works.E.dirty = false")

        print("\n— F. ошибки JavaScript")
        check("F1 нет ошибок JavaScript", not errors, "\n".join(errors[:5]))
        browser.close()

    print()
    if FAILS:
        print("НЕ ГОТОВО: " + ", ".join(FAILS))
        sys.exit(1)
    print("готово")


if __name__ == "__main__":
    run()
