"""
Этап 5 конструктора вариантов: Набор (variant-set.js) и экран «Собрать
вариант» в works.html (#/build, #/edit/<id>?build=1).

Заглушка Supabase и помощники — из теста этапа 1 работ.

Проверяет:
  A. VariantSet без входа и между двумя вкладками (событие variantset:change
     через storage, add / update / remove / clear);
  B. Набор из 3 строк (ЕГЭ №8 прототип ×3, ОГЭ №20 ×2, ОГЭ №9 ×2): дерево,
     предпросмотр текстом «ОГЭ №9 · … · ФИПИ 1–2 из 10» → «Собрать» → в новой
     работе 3 группы, задания созданы; Набор очищен, «Вернуть набор» в тосте
     его возвращает;
  C. «Полный вариант» ОГЭ — предпросмотр по всем номерам,
     oge8/oge12 и oge10/11/13 собираются (этапы 7 и 10б), «банк кончится»;
  D. #/edit/<id>?build=1 дописывает в сохранённую работу;
  E. 375 px: дерево над предпросмотром, без горизонтальной прокрутки;
  F. нет ошибок JavaScript.

Запуск: python3 test_prompt_variant_build.py
"""
import json
import sys

from test_prompt15_works_stage1 import (
    BASE, TEACHER, local_server, sync_playwright, new_context, watch_errors, db,
)

FAILS = []


def check(name, cond, extra=""):
    print(("[OK] " if cond else "[FAIL] ") + name + (f" — {extra}" if extra and not cond else ""))
    if not cond:
        FAILS.append(name)


def idle(page, timeout=120000):
    page.wait_for_function("() => window.__works.gens.size === 0", timeout=timeout)
    page.wait_for_timeout(150)


SER = """() => window.__works.E.blocks.map(b => ({ key: b.series ? b.series.key : null, pos: b.series ? b.series.pos : null,
  proto: b.series ? b.series.proto : null, fipi: b.series ? b.series.fipi : null, title: b.series ? b.series.title : null,
  // задание создано: снимок с картинкой или карточка ФИПИ (задача 63, у карточки картинок нет)
  img: !!(b.img && b.img.light && b.img.light.url) || b.type === 'card', gen: b._gen || null }))"""


def heads(page):
    return page.evaluate("() => [...document.querySelectorAll('#wkTasks .tg .tg-title')].map(e => e.textContent)")


def preview(page):
    return page.evaluate("() => [...document.querySelectorAll('#bdPreview .pl')].map(e => ({ ok: e.dataset.ok === '1', t: e.textContent }))")


THREE = """() => { const V = window.VariantSet; V.clear();
  V.add({ exam: 'ege_prof', slug: 'ege_prof', n: 8, proto: 'tangent', count: 3 });
  V.add({ exam: 'oge', slug: 'oge_part2', n: 20, count: 2 });
  V.add({ exam: 'oge', slug: 'oge9', n: null, count: 2 }); }"""


def run():
    errors = []
    with local_server(), sync_playwright() as p:
        browser = p.chromium.launch()
        tctx = new_context(browser, viewport={"width": 1440, "height": 950})
        tp = tctx.new_page()
        tp.on("dialog", lambda d: d.accept())
        watch_errors(tp, errors, "works")

        # ═══ A. VariantSet между вкладками ═══
        print("\n— A. VariantSet")
        tp.goto(f"{BASE}/works.html")
        tp.wait_for_selector("#scrAuth:not([hidden])")
        t2 = tctx.new_page()
        watch_errors(t2, errors, "tab2")
        t2.goto(f"{BASE}/works.html")
        t2.wait_for_selector("#scrAuth:not([hidden])")
        t2.evaluate("() => { window.__ev = 0; window.addEventListener('variantset:change', () => window.__ev++); }")
        r = tp.evaluate("""() => { const V = window.VariantSet; V.clear();
          const a = V.add({ exam: 'oge', slug: 'oge9', n: null, count: '2', proto: 'p1' });
          V.update(a.id, { count: 4 });
          return { a, all: V.all(), n: V.count() }; }""")
        check("A1 add/update без входа, строка с нужными полями",
              r["n"] == 1 and r["all"][0]["count"] == 4 and r["all"][0]["proto"] == "p1" and r["all"][0]["pos"] is None
              and all(k in r["a"] for k in ["id", "exam", "slug", "n", "tid", "href", "proto", "pos", "fipi", "count", "source", "from", "addedAt"]),
              json.dumps(r, ensure_ascii=False))
        t2.wait_for_function("() => window.__ev > 0", timeout=3000)
        check("A2 вторая вкладка получила variantset:change и видит строку",
              t2.evaluate("() => window.VariantSet.count()") == 1)
        t2.evaluate("() => window.VariantSet.add({ exam: 'oge', slug: 'oge6', count: 1 })")
        tp.wait_for_timeout(200)
        check("A3 строка из второй вкладки видна в первой", tp.evaluate("() => window.VariantSet.count()") == 2)
        t2.evaluate("() => { const V = window.VariantSet; V.remove(V.all()[0].id); }")
        tp.wait_for_timeout(200)
        check("A4 remove — в первой вкладке одна строка, oge6",
              tp.evaluate("() => window.VariantSet.all().map(x => x.slug)") == ["oge6"])
        t2.evaluate("() => window.VariantSet.clear()")
        tp.wait_for_timeout(200)
        check("A5 clear", tp.evaluate("() => window.VariantSet.count()") == 0)
        t2.close()

        # вход
        tp.fill("#auEmail", TEACHER["email"]); tp.fill("#auPass", TEACHER["password"])
        tp.click("#auGo")
        tp.wait_for_selector("#scrList:not([hidden])")

        # ═══ B. Набор из трёх строк → «Собрать» ═══
        print("\n— B. три строки → Собрать")
        tp.evaluate(THREE)
        tp.click("#buildOpen")
        tp.wait_for_selector("#scrBuild:not([hidden])")
        tp.wait_for_selector("#bdPreview .pl")
        rows = tp.locator("#bdTree .bd-row").count()
        nums = tp.evaluate("() => [...document.querySelectorAll('#bdTree .bd-num-t')].map(e => e.textContent)")
        check("B1 дерево: 3 строки, номера ЕГЭ №8, ОГЭ №20, ОГЭ №9", rows == 3 and len(nums) == 3
              and "ЕГЭ №8" in nums[0] and "ОГЭ №20" in nums[1] and "ОГЭ №9" in nums[2], str(nums))
        check("B2 сетка номеров скрыта при непустом Наборе", tp.is_hidden("#bdGridBox"))
        pv = preview(tp)
        check("B3 предпросмотр: 3 строки, все собираются", len(pv) == 3 and all(x["ok"] for x in pv), json.dumps(pv, ensure_ascii=False))
        check("B4 «ЕГЭ №8 · Производная по касательной · ФИПИ 1–3 из …»", pv[0]["t"].startswith("ЕГЭ №8 · Производная по касательной · ФИПИ 1–3 из "), pv[0]["t"])
        check("B5 «ОГЭ №9 · 1. Иксы в обеих частях · ФИПИ 1–2 из 10»", pv[2]["t"] == "ОГЭ №9 · 1. Иксы в обеих частях · ФИПИ 1–2 из 10", pv[2]["t"])
        # степпер и «с какого номера банка» меняют предпросмотр
        tp.locator("#bdTree .bd-row").nth(2).locator("[data-r='plus']").click()
        tp.wait_for_timeout(100)
        check("B6 + в строке — ×3, «ФИПИ 1–3 из 10»", preview(tp)[2]["t"].endswith("ФИПИ 1–3 из 10"), preview(tp)[2]["t"])
        tp.locator("#bdTree .bd-row").nth(2).locator("[data-r='minus']").click()
        tp.fill("#bdStart", "9"); tp.dispatch_event("#bdStart", "input")
        pv = preview(tp)
        check("B7 с №9: «ФИПИ 9–10 из 10», у ОГЭ №9 предупреждения нет", pv[2]["t"].startswith("ОГЭ №9 · 1. Иксы в обеих частях · ФИПИ 9–10 из 10") and "банк кончится" not in pv[2]["t"], pv[2]["t"])
        tp.fill("#bdStart", "10"); tp.dispatch_event("#bdStart", "input")
        check("B8 с №10 ×2 — «банк кончится»", "банк кончится" in preview(tp)[2]["t"], preview(tp)[2]["t"])
        tp.fill("#bdStart", "1"); tp.dispatch_event("#bdStart", "input")
        tp.click("#bdGo")
        tp.wait_for_selector("#scrEdit:not([hidden])")
        tp.wait_for_function("() => window.__works.E.blocks.length === 7", timeout=60000)
        check("B9 Набор очищен, в тосте «Вернуть набор»", tp.evaluate("() => window.VariantSet.count()") == 0 and tp.is_visible("#toastAct"))
        idle(tp)
        s = tp.evaluate(SER)
        check("B10 в работе 7 заданий, все созданы с картинкой", len(s) == 7 and all(x["img"] and not x["gen"] for x in s), json.dumps(s, ensure_ascii=False)[:500])
        keys = [x["key"] for x in s]
        check("B11 три группы по порядку набора: 3 + 2 + 2", len(set(keys)) == 3 and keys[0] == keys[2] and keys[3] == keys[4] and keys[5] == keys[6]
              and [x["proto"] for x in s][:3] == ["tangent"] * 3 and s[5]["proto"] == "p1", str([x["proto"] for x in s]))
        h = heads(tp)
        check("B12 заголовки групп", len(h) == 3 and h[0].startswith("ЕГЭ №8 · Производная по касательной") and h[1].startswith("ОГЭ №20 · ")
              and h[2].startswith("ОГЭ №9 · 1. Иксы в обеих частях"), str(h))
        check("B13 адрес — #/new, работа не сохранена (название подставлено)", tp.evaluate("() => location.hash") == "#/new"
              and tp.input_value("#wkTitle").startswith("Вариант"), tp.evaluate("() => location.hash"))
        tp.click("#toastAct")
        check("B14 «Вернуть набор» — снова 3 строки", tp.evaluate("() => window.VariantSet.count()") == 3)
        tp.evaluate("() => window.VariantSet.clear()")
        tp.fill("#wkTitle", "Собранный вариант")
        tp.click("#wkSave")
        tp.wait_for_function("() => !document.getElementById('wkLinkBox').hidden", timeout=60000)
        wid = db()["works"][0]["id"]
        check("B15 сохранилось: в базе 7 заданий с series", len(db()["work_variants"][0]["blocks"]) == 7
              and all(b.get("series") for b in db()["work_variants"][0]["blocks"]))

        # Эмулируем сохранённую группу до перенумерации: касательные были в №9.
        tp.evaluate("""() => {
          const W = window.__works;
          const rows = W.E.blocks.filter(b => b.series.proto === 'tangent');
          rows.forEach(b => {
            b.tid = 'ege9';
            Object.assign(b.series, { n:9, href:'ege_prof.html?n=9', title:'ЕГЭ №9 · Производная по касательной' });
          });
          W.seriesNext(rows[0].series.key);
        }""")
        idle(tp)
        moved = tp.evaluate("""() => window.__works.E.blocks.filter(b => b.series.proto === 'tangent')
           .map(b => [b.series.n, b.series.pos, b.tid, b.type])""")
        check("B16 соседние задания старой группы подбираются из №8", moved == [[8, i, 'ege8', 'task'] for i in (3, 4, 5)], str(moved))
        card_ctx = new_context(browser, cards=True)
        card_page = card_ctx.new_page()
        card_page.goto(f"{BASE}/works.html")
        card_page.wait_for_function("() => window.__works && window.__works.cardFor")
        check("B17 новая карточка №12 есть в конструкторе", card_page.evaluate("""async () =>
          (await window.__works.cardFor('ege_prof.html?n=12', { n:12, proto:'local-max', pos:0 }))?.n === 12"""))
        card_ctx.close()
        tp.evaluate("() => { window.__works.E.dirty = false; }")

        # ═══ G. задание по номеру ФИПИ; несобираемые строки остаются в Наборе ═══
        print("\n— G. «это задание» по номеру ФИПИ, остаток Набора")
        tp.goto(f"{BASE}/works.html#/build")
        tp.wait_for_selector("#scrBuild:not([hidden])")
        f3 = tp.evaluate("""async () => { const ix = await (await fetch('catalog-index.json')).json();
          const p = ix['oge9|'].protos.find(x => x.id === 'p1'); const V = window.VariantSet; V.clear();
          // место 7 устарело (банк «перевыгружен») — собрать надо по номеру ФИПИ, он на месте 2
          V.add({ exam: 'oge', slug: 'oge9', proto: 'p1', pos: 7, fipi: p.fipi[2], count: 1 });
          // изложение ОГЭ русского — каталога нет (oge8 с этапа 10б собирается)
          V.add({ exam: 'rus_oge', slug: 'rus_oge01', count: 1 });
          return p.fipi[2]; }""")
        tp.wait_for_function("() => document.querySelectorAll('#bdPreview .pl').length === 2")
        pv = preview(tp)
        check("G1 предпросмотр берёт место по номеру ФИПИ: «ФИПИ 3 из 10», изложение не собирается",
              pv[0]["ok"] and "ФИПИ 3 из 10" in pv[0]["t"] and not pv[1]["ok"], json.dumps(pv, ensure_ascii=False))
        tp.click("#bdGo")
        tp.wait_for_selector("#scrEdit:not([hidden])")
        tp.wait_for_function("() => window.__works.E.blocks.length === 1", timeout=60000)
        idle(tp)
        g = tp.evaluate(SER)
        check("G2 собрано то самое задание ФИПИ", len(g) == 1 and g[0]["fipi"] == f3 and g[0]["pos"] == 2, json.dumps(g, ensure_ascii=False)[:300])
        left = tp.evaluate("() => window.VariantSet.all().map(x => x.slug)")
        check("G3 несобранная строка (изложение) осталась в Наборе", left == ["rus_oge01"], str(left))
        tp.evaluate("() => { window.VariantSet.clear(); window.__works.E.dirty = false; }")

        # ═══ C. «Полный вариант» ОГЭ ═══
        print("\n— C. полный вариант ОГЭ")
        tp.goto(f"{BASE}/works.html#/build")
        tp.wait_for_selector("#scrBuild:not([hidden])")
        check("C1 пустой Набор — сетка номеров видна", tp.is_visible("#bdGrid .bd-cell"))
        tp.select_option("#bdExam", "oge")
        cells = tp.locator("#bdGrid .bd-cell").count()
        check("C2 сетка ОГЭ: 18 позиций (12 страниц ч. 1 + №20–25)", cells == 18, str(cells))
        # галочка с ×N
        cell = tp.locator("#bdGrid .bd-cell[data-slug='oge6']")
        cell.locator("input[type=number]").fill("3")
        cell.locator("input[type=checkbox]").check()
        tp.wait_for_timeout(100)
        check("C3 галочка в сетке — строка в Наборе ×3", tp.evaluate("() => window.VariantSet.all().map(r => [r.slug, r.count])") == [["oge6", 3]])
        tp.evaluate("() => window.VariantSet.clear()")
        tp.click("#bdFull")
        tp.wait_for_timeout(150)
        pv = preview(tp)
        by = {x["t"].split(" ")[1]: x for x in pv}
        check("C4 предпросмотр по всем 18 позициям", len(pv) == 18, str(len(pv)))
        # этап 10б: у oge8 и oge12 появился каталог — №8 из банка ФИПИ, №12 (банка нет) — наш генератор
        check("C5 oge8 — «ФИПИ 1 из …», oge12 — «наших на основе ФИПИ: 1»",
              by["№8"]["ok"] and "ФИПИ 1 из" in by["№8"]["t"] and by["№12"]["ok"] and "наших на основе ФИПИ: 1" in by["№12"]["t"],
              json.dumps([by.get("№8"), by.get("№12")], ensure_ascii=False))
        # №10 уже с банком, №11 и №13 пока собираются из генератора.
        check("C6 oge10 — «ФИПИ 1 из …», oge11, 13 — «наших на основе ФИПИ: 1»",
              by["№10"]["ok"] and "ФИПИ 1 из 16" in by["№10"]["t"]
              and all(by[k]["ok"] and "наших на основе ФИПИ: 1" in by[k]["t"] for k in ["№11", "№13"]),
              json.dumps([by.get(k) for k in ["№10", "№11", "№13"]], ensure_ascii=False))
        check("C7 остальные номера собираются, с «ФИПИ … из …»",
              all(x["ok"] and " из " in x["t"] for k, x in by.items() if k not in ["№12", "№10", "№11", "№13"]),
              json.dumps([x for k, x in by.items() if not x["ok"]], ensure_ascii=False)[:500])
        check("C8 итог под предпросмотром: 18 групп, ничего не пропущено", "Групп: 18" in tp.inner_text("#bdGoNote") and "пропущено" not in tp.inner_text("#bdGoNote"),
              tp.inner_text("#bdGoNote"))
        # перетаскивание номера целиком: последний (№25) — перед №23 (оба на экране: через прокрутку drag_to ненадёжен)
        src = tp.locator("#bdTree .bd-num").nth(17)
        dst = tp.locator("#bdTree .bd-num").nth(15)
        dst.scroll_into_view_if_needed()
        src.drag_to(dst, source_position={"x": 20, "y": 8}, target_position={"x": 20, "y": 8})
        tp.wait_for_timeout(150)
        last3 = tp.evaluate("() => [...document.querySelectorAll('#bdTree .bd-num-t')].slice(-3).map(e => e.textContent.replace('⠿ ', ''))")
        check("C9 перетаскивание: №25 встал перед №23", last3 == ["ОГЭ №25", "ОГЭ №23", "ОГЭ №24"], str(last3))
        check("C9a порядок предпросмотра — тот же", [x["t"].split(" · ")[0] for x in preview(tp)][-3:] == ["ОГЭ №25", "ОГЭ №23", "ОГЭ №24"])
        tp.locator("#bdTree .bd-row").first.locator("[data-r='del']").click()
        check("C10 ✕ — строка убрана", tp.evaluate("() => window.VariantSet.count()") == 17)

        # ═══ E. 375 px ═══
        print("\n— E. 375 px")
        tp.set_viewport_size({"width": 375, "height": 800})
        tp.wait_for_timeout(200)
        g = tp.evaluate("""() => ({ tree: document.getElementById('bdSetBox').getBoundingClientRect().bottom,
          pv: document.getElementById('bdPreview').getBoundingClientRect().top,
          sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth })""")
        check("E1 дерево над предпросмотром", g["tree"] <= g["pv"], str(g))
        check("E2 без горизонтальной прокрутки", g["sw"] <= g["cw"] + 1, str(g))
        tp.set_viewport_size({"width": 1440, "height": 950})

        # ═══ D. #/edit/<id>?build=1 ═══
        print("\n— D. дописать в сохранённую работу")
        tp.evaluate("""() => { const V = window.VariantSet; V.clear(); V.add({ exam: 'oge', slug: 'oge9', n: null, proto: 'p2', count: 2 }); }""")
        tp.goto(f"{BASE}/works.html#/edit/{wid}?build=1")
        tp.wait_for_selector("#scrBuild:not([hidden])")
        tp.wait_for_selector("#bdPreview .pl")
        check("D1 экран сборки поверх работы: «Дописать в работу»", tp.inner_text("#bdGo") == "Дописать в работу"
              and "Собранный вариант" in tp.inner_text("#bdHead"), tp.inner_text("#bdHead"))
        check("D2 предпросмотр «ОГЭ №9 · 2. Иксы и числа в обеих частях · ФИПИ 1–2 из 10»",
              preview(tp)[0]["t"] == "ОГЭ №9 · 2. Иксы и числа в обеих частях · ФИПИ 1–2 из 10", preview(tp)[0]["t"])
        tp.click("#bdGo")
        tp.wait_for_selector("#scrEdit:not([hidden])")
        tp.wait_for_function("() => window.__works.E.blocks.length === 9", timeout=60000)
        idle(tp)
        s = tp.evaluate(SER)
        check("D3 та же работа, 7 старых + 2 новых, 4 группы", tp.evaluate("() => window.__works.E.id") == wid and len(s) == 9
              and len({x["key"] for x in s}) == 4 and [x["proto"] for x in s][-2:] == ["p2", "p2"] and all(x["img"] for x in s),
              str([x["proto"] for x in s]))
        check("D4 адрес — #/edit/<id> без ?build", tp.evaluate("() => location.hash") == "#/edit/" + wid)
        tp.click("#wkSave")
        tp.wait_for_function("() => document.getElementById('wkSaved').textContent.indexOf('Сохранено ') === 0", timeout=60000)
        check("D5 в базе 9 заданий", len(db()["work_variants"][0]["blocks"]) == 9 and len(db()["works"]) == 1, str(len(db()["work_variants"][0]["blocks"])))
        # «Собрать вариант» из редактора и «← Назад» — правки не теряются
        tp.click("#edBuild")
        tp.wait_for_selector("#scrBuild:not([hidden])")
        tp.click("#bdBack")
        tp.wait_for_selector("#scrEdit:not([hidden])")
        check("D6 «← Назад» — в ту же работу, 9 заданий", tp.evaluate("() => window.__works.E.blocks.length") == 9
              and tp.evaluate("() => location.hash") == "#/edit/" + wid)

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
