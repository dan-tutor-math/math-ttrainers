"""
Этап 7 конструктора вариантов (works.html): варианты без повторов, места за
концом банка (наш генератор «на основе ФИПИ»), «Следующая работа», метка
«уже было», «Для ученика» на экране «Собрать вариант».

Заглушка Supabase и помощники — из теста этапа 1 работ. Память ученика —
заглушка: window.StudentMemory подменяется при создании (listStudents,
fetchLog, keys), сеть журнала не нужна.

Проверяет:
  A. ОГЭ №9 p1 ×3, «Вариантов: 3» — места 0–2, 3–5, 6–8, без пересечений,
     номера ФИПИ разные, все задания созданы;
  B. ОГЭ №7 sign_diff_negative (банк из 7) ×3, 3 варианта — третий вариант:
     место 6 (ФИПИ) и 7, 8 — наш генератор, подпись «наше, на основе ФИПИ»;
  C. метка «уже было»: работа A сохранена, новая работа с той же группой —
     у заданий «было в «Работа A» от дд.мм», у другой группы метки нет;
  D. «Следующая работа»: у работы Б (группа ×2 + одиночное задание) группа
     сдвинута на следующие 2, одиночное то же; у работы A (3 варианта до места 8)
     образец встаёт на 9–11 — за всеми вариантами, варианты 2–3 дальше;
  E. «Для ученика»: выбран ученик с двумя решёнными заданиями ФИПИ —
     предпросмотр «пропущено 2 решённых», собраны места мимо решённых;
  F. нет ошибок JavaScript.

Запуск: python3 test_prompt_variants_next.py
"""
import datetime
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


def idle(page, timeout=180000):
    page.wait_for_function("() => window.__works.gens.size === 0", timeout=timeout)
    page.wait_for_timeout(200)


# места, номера ФИПИ и готовность заданий по вариантам
VARS = """() => window.__works.E.variants.map(v => v.blocks.map(b => ({ id: b.id, key: b.series ? b.series.key : null,
  pos: b.series ? b.series.pos : null, fipi: b.series ? b.series.fipi : null, total: b.series ? b.series.total : null,
  img: !!(b.img && b.img.light && b.img.light.url), url: b.img && b.img.light ? b.img.light.url : null, gen: b._gen || null })))"""

# заглушка памяти ученика: подменяем методы в момент, когда student-memory.js кладёт модуль
STUB_SM = """(() => {
  let sm = null;
  Object.defineProperty(window, 'StudentMemory', { configurable: true,
    get(){ return sm; },
    set(v){
      sm = v;
      if (!v) return;
      v.listStudents = async () => [{ id: 's1', name: 'Петя', boards: [] }];
      v.fetchLog = async id => (window.__solved || []).map((k, i) => ({ id: 'r' + i, task_key: k, event: 'ok', source: 'trainer', at: new Date().toISOString() }));
      v.keys = () => [];
    } });
})();"""


def build(page, rows_js, nvars=1, student=None):
    page.goto(f"{BASE}/works.html#/build")
    page.wait_for_selector("#scrBuild:not([hidden])")
    page.evaluate(rows_js)
    page.wait_for_selector("#bdPreview .pl")
    page.fill("#bdVars", str(nvars)); page.dispatch_event("#bdVars", "input")
    page.fill("#bdStart", "1"); page.dispatch_event("#bdStart", "input")
    if student is not None:
        page.wait_for_selector("#bdForBox:not([hidden])")
        page.select_option("#bdFor", student)
        page.wait_for_function("() => document.getElementById('bdGoNote').textContent.indexOf('Загружаем') < 0")
        page.wait_for_timeout(150)
    pv = page.evaluate("() => [...document.querySelectorAll('#bdPreview .pl')].map(e => ({ ok: e.dataset.ok === '1', t: e.textContent }))")
    page.click("#bdGo")
    page.wait_for_selector("#scrEdit:not([hidden])")
    page.wait_for_function(f"() => window.__works.E.variants.length === {nvars} && window.__works.E.blocks.length > 0", timeout=60000)
    idle(page)
    return pv


def save(page, title):
    page.fill("#wkTitle", title)
    page.click("#wkSave")
    page.wait_for_function("() => document.getElementById('wkSaved').textContent.indexOf('Сохранено ') === 0", timeout=120000)
    return page.evaluate("() => window.__works.E.id")


def run():
    errors = []
    today = datetime.date.today().strftime("%d.%m")
    with local_server(), sync_playwright() as p:
        browser = p.chromium.launch()
        tctx = new_context(browser, viewport={"width": 1440, "height": 950})
        tctx.add_init_script(STUB_SM)
        tp = tctx.new_page()
        tp.on("dialog", lambda d: d.accept())
        watch_errors(tp, errors, "works")
        tp.goto(f"{BASE}/works.html")
        tp.wait_for_selector("#scrAuth:not([hidden])")
        tp.fill("#auEmail", TEACHER["email"]); tp.fill("#auPass", TEACHER["password"])
        tp.click("#auGo")
        tp.wait_for_selector("#scrList:not([hidden])")
        fipi9 = tp.evaluate("async () => (await (await fetch('catalog-index.json')).json())['oge9|'].protos.find(x => x.id === 'p1').fipi")

        # ═══ A. 3 варианта из группы ×3 ═══
        print("\n— A. три варианта без повторов")
        build(tp, "() => { const V = window.VariantSet; V.clear(); V.add({ exam: 'oge', slug: 'oge9', n: null, proto: 'p1', count: 3 }); }", nvars=3)
        vs = tp.evaluate(VARS)
        poss = [[b["pos"] for b in v] for v in vs]
        check("A1 места по вариантам: 0–2, 3–5, 6–8", poss == [[0, 1, 2], [3, 4, 5], [6, 7, 8]], str(poss))
        fl = [b["fipi"] for v in vs for b in v]
        check("A2 номера ФИПИ — из банка по местам, все 9 разные", fl == fipi9[:9] and len(set(fl)) == 9, str(fl))
        check("A3 все задания созданы с картинкой", all(b["img"] and not b["gen"] for v in vs for b in v),
              json.dumps(vs, ensure_ascii=False)[:400])
        # вкладка «Вариант 2» — подпись «ФИПИ 4 из 10»
        tp.click('#wkVariants button[data-v="1"]')
        tp.wait_for_timeout(150)
        src = tp.evaluate("() => [...document.querySelectorAll('#wkTasks .ti-src')].map(e => e.textContent)")
        check("A4 у задания варианта 2 подпись места «ФИПИ 4 из 10»", len(src) == 3 and src[0].startswith("ФИПИ 4 из 10"), str(src))
        tp.click('#wkVariants button[data-v="0"]')
        wid_a = save(tp, "Работа A")
        check("A5 сохранено: 3 варианта в базе", len([v for v in db()["work_variants"] if v["work_id"] == wid_a]) == 3)

        # ═══ B. банк из 7: третий вариант — 6 и наш генератор ═══
        print("\n— B. банк из 7")
        pv = build(tp, "() => { const V = window.VariantSet; V.clear(); V.add({ exam: 'oge', slug: 'oge7', n: null, proto: 'sign_diff_negative', count: 3 }); }", nvars=3)
        check("B0 предпросмотр: «ФИПИ 1–3 из 7»", pv and pv[0]["ok"] and pv[0]["t"].endswith("ФИПИ 1–3 из 7"), json.dumps(pv, ensure_ascii=False))
        vs = tp.evaluate(VARS)
        poss = [[b["pos"] for b in v] for v in vs]
        check("B1 места: 0–2, 3–5, 6–8", poss == [[0, 1, 2], [3, 4, 5], [6, 7, 8]], str(poss))
        v3 = vs[2]
        check("B2 третий вариант: место 6 — задание ФИПИ, 7 и 8 — без номера ФИПИ (наш генератор)",
              v3[0]["fipi"] and not v3[1]["fipi"] and not v3[2]["fipi"] and all(b["total"] == 7 for b in v3), json.dumps(v3, ensure_ascii=False)[:300])
        check("B3 задания генератора созданы с картинкой", all(b["img"] and not b["gen"] for b in v3))
        tp.click('#wkVariants button[data-v="2"]')
        tp.wait_for_timeout(150)
        src = tp.evaluate("() => [...document.querySelectorAll('#wkTasks .ti')].map(e => (e.querySelector('.ti-src') || {}).textContent || '')")
        check("B4 подписи: «ФИПИ 7 из 7», «наше, на основе ФИПИ» ×2",
              src[0].startswith("ФИПИ 7 из 7") and "наше, на основе ФИПИ" in src[1] and "наше, на основе ФИПИ" in src[2], str(src))
        tp.click('#wkVariants button[data-v="0"]')
        tp.wait_for_timeout(100)
        # «Следующие 3 ▶» в образце не гаснет у прототипа с генератором: 3–5
        tp.locator("#wkTasks .tg [data-g='next']").click()
        idle(tp)
        vs = tp.evaluate(VARS)
        poss = [[b["pos"] for b in v] for v in vs]
        check("B5 «Следующие 3» в образце — варианты едут за ним без пересечений",
              poss[0] == [3, 4, 5] and len({p for v in poss for p in v}) == 9, str(poss))
        tp.evaluate("() => { window.__works.E.dirty = false; }")

        # ═══ C. метка «уже было» ═══
        print("\n— C. «уже было»")
        build(tp, """() => { const V = window.VariantSet; V.clear();
          V.add({ exam: 'oge', slug: 'oge9', n: null, proto: 'p1', count: 2 });
          V.add({ exam: 'oge', slug: 'oge9', n: null, proto: 'p2', count: 1 }); }""")
        tp.wait_for_function("() => document.querySelectorAll('#wkTasks .ti-src .was').length >= 2", timeout=10000)
        was = tp.evaluate("() => [...document.querySelectorAll('#wkTasks .ti')].map(e => (e.querySelector('.was') || {}).textContent || '')")
        check("C1 у заданий p1 — «было в «Работа A» от " + today + "»",
              was[0] == "было в «Работа A» от " + today and was[1] == was[0], str(was))
        check("C2 у задания p2 метки нет", was[2] == "", str(was))
        tp.evaluate("() => { window.__works.E.dirty = false; }")

        # ═══ D. «Следующая работа» ═══
        print("\n— D. «Следующая работа»")
        build(tp, "() => { const V = window.VariantSet; V.clear(); V.add({ exam: 'oge', slug: 'oge9', n: null, proto: 'p2', count: 2 }); }")
        # одиночное задание (не из группы) — копия снимка без series
        tp.evaluate("""() => { const W = window.__works, b = JSON.parse(JSON.stringify(W.E.blocks[0]));
          delete b.series; b.id = 'tsingle1'; if (b.gen) delete b.gen.at; W.E.variants[0].blocks.push(b); W.renderTasks(); }""")
        wid_b = save(tp, "Работа Б")
        tp.goto(f"{BASE}/works.html#/")
        tp.wait_for_selector("#scrList:not([hidden])")
        tp.wait_for_selector(f".wcard[data-id='{wid_b}'] [data-a='next']")
        before = tp.evaluate(VARS)[0]
        tp.click(f".wcard[data-id='{wid_b}'] [data-a='next']")
        tp.wait_for_selector("#scrEdit:not([hidden])")
        idle(tp)
        after = tp.evaluate(VARS)[0]
        check("D1 новая несохранённая работа «Работа Б (следующая)», адрес #/new",
              tp.evaluate("() => window.__works.E.id") is None and tp.input_value("#wkTitle") == "Работа Б (следующая)"
              and tp.evaluate("() => location.hash") == "#/new" and tp.evaluate("() => window.__works.E.dirty"))
        check("D2 группа сдвинута на следующие 2: места 2, 3", [b["pos"] for b in after[:2]] == [2, 3], str([b["pos"] for b in after]))
        check("D3 одиночное задание то же (id и картинка)", len(after) == 3 and after[2]["id"] == "tsingle1" and after[2]["key"] is None
              and after[2]["url"] == [b for b in db()["work_variants"] if b["work_id"] == wid_b][0]["blocks"][2]["img"]["light"]["url"],
              json.dumps(after, ensure_ascii=False)[:300])
        check("D4 в базе по-прежнему одна «Работа Б»", len([w for w in db()["works"] if w["title"].startswith("Работа Б")]) == 1)
        tp.evaluate("() => { window.__works.E.dirty = false; }")
        # работа A: 3 варианта занимали места 0–8 — следующая начинается с 9
        tp.goto(f"{BASE}/works.html#/")
        tp.wait_for_selector(f".wcard[data-id='{wid_a}'] [data-a='next']")
        tp.click(f".wcard[data-id='{wid_a}'] [data-a='next']")
        tp.wait_for_selector("#scrEdit:not([hidden])")
        tp.wait_for_function("() => window.__works.E.variants.length === 3")
        tp.evaluate("() => window.__works.E.variants.forEach(v => { window.__works.E.cur = window.__works.E.variants.indexOf(v); window.__works.renderTasks(); })")
        tp.evaluate("() => { window.__works.E.cur = 0; window.__works.renderTasks(); }")
        idle(tp)
        vs = tp.evaluate(VARS)
        poss = [[b["pos"] for b in v] for v in vs]
        allp = [p for v in poss for p in v]
        check("D5 следующая за работой A: образец 9–11, варианты дальше, без пересечений и без мест 0–8",
              poss[0] == [9, 10, 11] and len(set(allp)) == 9 and min(allp) >= 9, str(poss))
        check("D6 все задания следующей работы созданы", all(b["img"] and not b["gen"] for v in vs for b in v))
        tp.evaluate("() => { window.__works.E.dirty = false; }")

        # ═══ E. «Для ученика» ═══
        print("\n— E. память ученика")
        tp.evaluate("s => { window.__solved = s; }", ["fipi:oge:" + fipi9[1], "fipi:oge:" + fipi9[3], "gen:oge9:p1"])
        pv = build(tp, "() => { const V = window.VariantSet; V.clear(); V.add({ exam: 'oge', slug: 'oge9', n: null, proto: 'p1', count: 3 }); }", student="s1")
        check("E1 предпросмотр: «ФИПИ 1, 3, 5 из 10 · пропущено 2 решённых»",
              pv and pv[0]["ok"] and pv[0]["t"].endswith("ФИПИ 1, 3, 5 из 10 · пропущено 2 решённых"), json.dumps(pv, ensure_ascii=False))
        s = tp.evaluate(VARS)[0]
        check("E2 собраны места 0, 2, 4 — решённые пропущены", [b["pos"] for b in s] == [0, 2, 4]
              and fipi9[1] not in [b["fipi"] for b in s] and fipi9[3] not in [b["fipi"] for b in s], str([b["pos"] for b in s]))
        # без ученика — как раньше
        tp.evaluate("() => { window.__works.E.dirty = false; }")
        pv = build(tp, "() => { const V = window.VariantSet; V.clear(); V.add({ exam: 'oge', slug: 'oge9', n: null, proto: 'p1', count: 3 }); }", student="")
        check("E3 без ученика — «ФИПИ 1–3 из 10»", pv and pv[0]["t"].endswith("ФИПИ 1–3 из 10"), json.dumps(pv, ensure_ascii=False))
        tp.evaluate("() => { window.__works.E.dirty = false; }")

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
