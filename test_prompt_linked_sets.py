"""
Связанные задания в конструкторе вариантов: ОГЭ математика №1–5 (шины, планы,
тарифы… — пять заданий про один сюжет).

Связь берётся из каталога страницы (oge1_5.html → __trainerCatalog.list: link
и grp), а не перечисляется руками: новый сюжет в банке подхватывается сам.
Место pos во всех частях набора — один и тот же источник.

Проверяет:
  A. каталог: у каждого набора ФИПИ все части одной длины и ключи источников
     (grp) на каждом месте совпадают — этот тест падает, если новая выгрузка
     банка развела части набора;
  B. «Собрать вариант»: строка oge1_5 «весь номер» ×2 → 5 групп (по части на
     группу), места у групп одни и те же, у блока series.link;
  C. смена места у одного задания / «Следующие» у группы двигает остальные
     части сюжета; кнопка 🔗 связь отключает;
  D. нет ошибок JavaScript.

Запуск: python3 test_prompt_linked_sets.py
"""
import json
import sys

from test_prompt15_works_stage1 import (
    BASE, TEACHER, local_server, sync_playwright, new_context, watch_errors,
)

FAILS = []


def check(name, cond, extra=""):
    print(("[OK] " if cond else "[FAIL] ") + name + (f" — {extra}" if extra and not cond else ""))
    if not cond:
        FAILS.append(name)


def idle(page, timeout=180000):
    page.wait_for_function("() => window.__works.gens.size === 0", timeout=timeout)
    page.wait_for_timeout(200)


GROUPS = """() => { const m = new Map();
  window.__works.E.variants[0].blocks.forEach(b => { if (!b.series) return;
    if (!m.has(b.series.key)) m.set(b.series.key, { part: b.series.link && b.series.link.part, set: b.series.link && b.series.link.set, proto: b.series.proto, pos: [] });
    m.get(b.series.key).pos.push(b.series.pos); });
  return [...m.values()]; }"""


def run():
    errors = []
    with local_server(), sync_playwright() as p:
        browser = p.chromium.launch()
        ctx = new_context(browser, viewport={"width": 1440, "height": 950})
        tp = ctx.new_page()
        tp.on("dialog", lambda d: d.accept())
        watch_errors(tp, errors, "works")

        # ═══ A. каталог ═══
        print("\n— A. каталог: части набора выровнены")
        cp = ctx.new_page()
        watch_errors(cp, errors, "catalog")
        cp.goto(f"{BASE}/oge1_5.html")
        cp.wait_for_function("() => window.__trainerCatalog && typeof window.__trainerCatalog.list === 'function'")
        protos = cp.evaluate("async () => await window.__trainerCatalog.list()")
        sets = {}
        for pr in protos:
            if pr.get("link"):
                sets.setdefault(pr["link"]["set"], []).append(pr)
        check("A1 связанных наборов ФИПИ не меньше десяти (шины + сюжеты)", len(sets) >= 10, str(list(sets)))
        bad = []
        for sid, parts in sets.items():
            parts.sort(key=lambda x: x["link"]["part"])
            n = parts[0]["link"]["parts"]
            if len(parts) != n:
                bad.append(f"{sid}: частей {len(parts)} из {n}")
                continue
            if any(len(x["fipi"]) != len(parts[0]["fipi"]) or x["grp"] != parts[0]["grp"] for x in parts):
                bad.append(f"{sid}: части разной длины или с разными источниками")
            if not parts[0]["fipi"]:
                bad.append(f"{sid}: пустой банк")
        check("A2 у каждого набора части одной длины, источники на местах совпадают", not bad, "; ".join(bad))
        check("A3 у наборов без банка ФИПИ (свой генератор) связи нет",
              all(not pr.get("link") for pr in protos if pr["id"].startswith("tire1_")))
        cp.close()

        # вход
        tp.goto(f"{BASE}/works.html")
        tp.wait_for_selector("#scrAuth:not([hidden])")
        tp.fill("#auEmail", TEACHER["email"]); tp.fill("#auPass", TEACHER["password"]); tp.click("#auGo")
        tp.wait_for_selector("#scrList:not([hidden])")

        # ═══ B. сборка ═══
        print("\n— B. «Собрать вариант»: сюжет целиком")
        tp.evaluate("() => { const V = window.VariantSet; V.clear(); V.add({ exam: 'oge', slug: 'oge1_5', n: null, count: 2 }); }")
        tp.click("#buildOpen")
        tp.wait_for_selector("#scrBuild:not([hidden])")
        tp.wait_for_selector("#bdPreview .pl")
        pv = tp.evaluate("() => [...document.querySelectorAll('#bdPreview .pl')].map(e => ({ ok: e.dataset.ok === '1', t: e.textContent }))")
        check("B1 предпросмотр: строка собирается, написано «сюжет целиком»", len(pv) == 1 and pv[0]["ok"] and "сюжет целиком" in pv[0]["t"], json.dumps(pv, ensure_ascii=False))
        tp.click("#bdGo")
        tp.wait_for_selector("#scrEdit:not([hidden])")
        tp.wait_for_function("() => window.__works.E.blocks.length === 10", timeout=60000)
        idle(tp)
        g = tp.evaluate(GROUPS)
        check("B2 пять групп — по части набора, по два задания", len(g) == 5 and all(len(x["pos"]) == 2 for x in g), json.dumps(g)[:300])
        check("B3 части 1…5 по порядку, один набор", [x["part"] for x in g] == [1, 2, 3, 4, 5] and len({x["set"] for x in g}) == 1)
        check("B4 места во всех группах одни и те же", all(x["pos"] == g[0]["pos"] for x in g), json.dumps([x["pos"] for x in g]))
        check("B5 задания сняты (картинки есть)", tp.evaluate("() => window.__works.E.blocks.every(b => b.img && b.img.light && b.img.light.url)"))

        # ═══ C. изменение места ═══
        print("\n— C. связь при правке")
        keys = tp.evaluate("() => { const k = []; window.__works.E.variants[0].blocks.forEach(b => { if (!k.includes(b.series.key)) k.push(b.series.key); }); return k; }")
        tp.evaluate("([k]) => window.__works.seriesNext(k)", [keys[0]])
        idle(tp)
        g = tp.evaluate(GROUPS)
        check("C1 «Следующие 2» у части 1 — все части на новых местах", all(x["pos"] == g[0]["pos"] for x in g) and g[0]["pos"] == [2, 3], json.dumps([x["pos"] for x in g]))
        bid = tp.evaluate("() => window.__works.E.variants[0].blocks.filter(b => b.series.link.part === 3)[0].id")
        tp.evaluate("([id]) => { const b = window.__works.E.variants[0].blocks.find(x => x.id === id); window.__works.seriesSetOne(b, 7); }", [bid])
        idle(tp)
        firsts = tp.evaluate("() => { const out = {}; window.__works.E.variants[0].blocks.forEach(b => { if (!(b.series.link.part in out)) out[b.series.link.part] = b.series.pos; }); return out; }")
        check("C2 одно задание части 3 на место 8 — первые задания всех частей там же", all(v == 7 for v in firsts.values()), json.dumps(firsts))
        # отключить связь у части 2
        tp.evaluate("([k]) => { window.__works.E.variants[0].blocks.filter(b => b.series.key === k).forEach(b => { b.series.link.off = true; }); }", [keys[1]])
        tp.evaluate("([k]) => window.__works.seriesNext(k)", [keys[0]])
        idle(tp)
        g = tp.evaluate(GROUPS)
        check("C3 у части 2 связь выключена — она остаётся на месте, остальные ушли", g[1]["pos"] != g[0]["pos"] and g[2]["pos"] == g[0]["pos"] and g[4]["pos"] == g[0]["pos"], json.dumps([x["pos"] for x in g]))
        # + ещё: в связанные группы добавляется по заданию
        tp.evaluate("([k]) => window.__works.seriesMore(k)", [keys[0]])
        idle(tp)
        g = tp.evaluate(GROUPS)
        check("C4 «+ ещё» добавил задание во все связанные группы, кроме отключённой", [len(x["pos"]) for x in g] == [3, 2, 3, 3, 3], json.dumps([x["pos"] for x in g]))

        check("D1 нет ошибок JavaScript", not errors, "; ".join(errors[:3]))
    print()
    if FAILS:
        print("НЕ ПРОШЛО:", len(FAILS), "—", ", ".join(FAILS))
        sys.exit(1)
    print("Все проверки прошли")


if __name__ == "__main__":
    run()
