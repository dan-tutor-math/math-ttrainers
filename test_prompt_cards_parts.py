"""
Задача 63, S7: карточки больших страниц лежат частями по номеру задания (tools/cards/split.py),
список частей — cards/index.json. Конструктор (works.html), страница ученика (work.html) и печать
берут только нужную часть.

Проверяет:
  A. файлы: split.py --check чист; index.json сходится с файлами (slug = имя файла = slug карточки,
     номера, id не повторяются по странице); число карточек по страницам не изменилось
     (rus_ege 1972, rus_oge 960, soc_oge 2668 = №1–16 + №18–21, soc_ege_long 544, eng_oge 458);
     часть не тяжелее 250 КБ в сжатом виде; старых файлов страниц нет; validate.py зелёный;
  B. конструктор: карточки обществознания ОГЭ №18–21 (раньше лежали в soc_oge_text.json, а
     конструктор искал cards/soc_oge.json) находятся: cardFor по месту каталога вернул карточку;
     rus_ege.html?n=19 тянет index.json и одну часть rus_ege_n19.json (а не мегабайт всей страницы);
     старый блок со slug страницы («rus_ege») собирается из всех частей; slug части открывается
     напрямую; страница без разбиения (oge9) — одним файлом, как раньше;
  C. страница ученика: блок с slug части — один файл; блок, сделанный до разбиения (slug
     страницы), открывается из частей; печать (work-print.js) — то же;
  D. нет ошибок JavaScript.

Запуск: python3 test_prompt_cards_parts.py
"""
import gzip
import json
import os
import subprocess
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)

import test_prompt_work_cards as wc          # заглушка сервера работ и помощники страницы ученика
import test_prompt15_works_stage1 as t15
from test_prompt15_works_stage1 import TEACHER, local_server, sync_playwright, new_context, watch_errors

FAILS = []
COUNTS = {"rus_ege": 1972, "rus_oge": 960, "soc_oge": 2668, "soc_ege_long": 544, "eng_oge": 458}
OLD_FILES = ["rus_ege", "rus_oge", "soc_oge", "soc_oge_text", "soc_ege_long", "eng_oge"]


def check(name, cond, extra=""):
    print(("[OK] " if cond else "[FAIL] ") + name + (f" — {extra}" if extra and not cond else ""))
    if not cond:
        FAILS.append(name)


def part_file(slug):
    return json.load(open(os.path.join(HERE, "cards", slug + ".json"), encoding="utf-8"))


def static_checks():
    from tools.cards import validate
    from tools.cards.split import LIMIT_GZ
    r = subprocess.run([sys.executable, os.path.join(HERE, "tools", "cards", "split.py"), "--check"], cwd=HERE, capture_output=True, text=True)
    check("A split.py --check: разбиение актуально", r.returncode == 0, r.stdout[-400:] + r.stderr[-400:])
    check("A validate.py зелёный", validate.main([]) == 0)
    idx = json.load(open(os.path.join(HERE, "cards", "index.json"), encoding="utf-8"))
    check("A index.json: v 1 и страницы", idx.get("v") == 1 and set(COUNTS) <= set(idx["pages"]), str(list(idx["pages"])))
    for page, parts in idx["pages"].items():
        ids, heavy, bad = set(), [], []
        for p in parts:
            d = part_file(p["slug"])
            if d["slug"] != p["slug"] or any(c["slug"] != p["slug"] for c in d["cards"]):
                bad.append(p["slug"])
            if sorted({c["n"] for c in d["cards"]}) != sorted(p["n"]):
                bad.append(p["slug"] + " n")
            ids |= {c["id"] for c in d["cards"]}
            raw = open(os.path.join(HERE, "cards", p["slug"] + ".json"), "rb").read()
            if len(gzip.compress(raw, 9)) > LIMIT_GZ:
                heavy.append(p["slug"])
        total = sum(len(part_file(p["slug"])["cards"]) for p in parts)
        check(f"A {page}: {len(parts)} частей, slug = файл = карточки", not bad, str(bad))
        check(f"A {page}: карточек {total} (ожидалось {COUNTS.get(page)}), id не повторяются", total == len(ids) and (page not in COUNTS or total == COUNTS[page]))
        check(f"A {page}: ни одна часть не тяжелее 250 КБ в сжатом виде", not heavy, str(heavy))
    check("A старых файлов страниц нет", not [f for f in OLD_FILES if os.path.exists(os.path.join(HERE, "cards", f + ".json"))])
    n18 = [p for p in idx["pages"]["soc_oge"] if p["n"] == [18]]
    check("A soc_oge: №18–21 внутри страницы (раньше в soc_oge_text)", len(n18) == 1 and n18[0]["slug"] == "soc_oge_n18")


def run():
    errors = []
    static_checks()
    with local_server(), sync_playwright() as p:
        browser = p.chromium.launch()
        # ═══ B. конструктор ═══
        print("\n— B. конструктор")
        ctx = new_context(browser, cards=True, viewport={"width": 1440, "height": 950})
        pg = ctx.new_page()
        watch_errors(pg, errors, "works")
        reqs = []
        pg.on("request", lambda r: reqs.append(r.url.split("/cards/")[1].split("?")[0]) if "/cards/" in r.url and r.url.split("?")[0].endswith(".json") else None)
        pg.goto(f"{t15.BASE}/works.html")
        pg.wait_for_selector("#scrAuth:not([hidden])")
        pg.fill("#auEmail", TEACHER["email"]); pg.fill("#auPass", TEACHER["password"]); pg.click("#auGo")
        pg.wait_for_selector("#scrList:not([hidden])")

        reqs.clear()
        r = pg.evaluate("async () => { const cs = await window.__works.cardsOf('rus_ege', 19); return { n: cs ? cs.byId.size : -1, ns: cs ? [...new Set([...cs.byId.values()].map(c => c.n))] : [] }; }")
        check("B rus_ege, №19: 127 карточек, только №19", r == {"n": part_n("rus_ege_n19"), "ns": [19]}, str(r))
        check("B rus_ege, №19: загружены index.json и одна часть rus_ege_n19.json", sorted(reqs) == ["index.json", "rus_ege_n19.json"], str(reqs))
        reqs.clear()
        pg.evaluate("() => window.__works.cardsOf('rus_ege', 19)")
        check("B повторное обращение — из памяти, без запросов", reqs == [], str(reqs))

        # №18–21 обществознания: раньше лежали в soc_oge_text.json, конструктор их не находил
        d = part_file("soc_oge_n19")
        c0 = d["cards"][40]
        reqs.clear()
        got = pg.evaluate("async ([href, at]) => { const c = await window.__works.cardFor(href, at); return c ? { id: c.id, slug: c.slug } : null; }",
                          ["soc_oge.html?n=19", {"proto": c0["proto"], "pos": c0["pos"], "n": 19}])
        check("B soc_oge №19: cardFor находит карточку (раньше — null)", got == {"id": c0["id"], "slug": "soc_oge_n19"}, str(got))
        check("B soc_oge №19: загружена одна часть soc_oge_n19.json", [x for x in reqs if x != "index.json"] == ["soc_oge_n19.json"], str(reqs))
        # №1–16 той же страницы — свои части
        d3 = part_file("soc_oge_n3")
        c3 = d3["cards"][5]
        got = pg.evaluate("async ([href, at]) => { const c = await window.__works.cardFor(href, at); return c ? c.id : null; }", ["soc_oge.html?n=3", {"proto": c3["proto"], "pos": c3["pos"], "n": 3}])
        check("B soc_oge №3: cardFor находит карточку", got == c3["id"], str(got))

        # cardByKey идёт по href с ?n=
        info = c3["answer"]
        got = pg.evaluate("async ([href, key, info]) => { const c = await window.__works.cardByKey(href, key, info); return c ? c.id : null; }",
                          ["soc_oge.html?n=3", "fipi:oge:" + c3["id"].split(":")[1], info])
        check("B cardByKey по href ?n=3", got == c3["id"], str(got))

        # старый блок: slug страницы без номера → все части
        reqs.clear()
        r = pg.evaluate("async () => { const cs = await window.__works.cardsOf('rus_oge'); return cs ? cs.byId.size : -1; }")
        check("B старый slug страницы (rus_oge): все 960 карточек из 11 частей", r == COUNTS["rus_oge"] and len([x for x in reqs if x != "index.json"]) == 11, f"{r} {reqs}")
        # slug части — напрямую
        reqs.clear()
        r = pg.evaluate("async () => { const cs = await window.__works.cardsOf('rus_ege_n7'); return cs ? [...cs.byId.values()].every(c => c.slug === 'rus_ege_n7') : null; }")
        check("B slug части (rus_ege_n7) открывается напрямую", r is True and [x for x in reqs if x != "index.json"] == ["rus_ege_n7.json"], f"{r} {reqs}")
        # страница без разбиения — один файл, как раньше
        reqs.clear()
        r = pg.evaluate("async () => { const cs = await window.__works.cardsOf('oge9', null); return cs ? cs.byId.size : -1; }")
        check("B oge9 (без разбиения) — один файл oge9.json", r > 0 and [x for x in reqs if x != "index.json"] == ["oge9.json"], f"{r} {reqs}")
        # номера, которого нет ни в одной части → карточек нет (старый путь через кадр)
        r = pg.evaluate("async () => await window.__works.cardsOf('rus_ege', 99)")
        check("B номер без частей → null (путь через кадр)", r is None, str(r))
        # нет index.json → работает как раньше (страница одним файлом)
        ctx2 = new_context(browser, cards=True, viewport={"width": 1440, "height": 950})
        ctx2.route("**/cards/index.json", lambda rt: rt.fulfill(status=404, body="no"))
        p2 = ctx2.new_page()
        watch_errors(p2, errors, "works-noindex")
        p2.goto(f"{t15.BASE}/works.html")
        p2.wait_for_selector("#scrAuth:not([hidden])")
        r = p2.evaluate("async () => { const a = await window.__works.cardsOf('oge9', null); const b = await window.__works.cardsOf('rus_ege', 19); return [a ? a.byId.size > 0 : false, b]; }")
        check("B без index.json: oge9 грузится, у разбитой страницы — null (кадр), без ошибок", r == [True, None], str(r))
        ctx2.close()
        ctx.close()

        # ═══ C. страница ученика ═══
        print("\n— C. страница ученика")
        legacy = part_file("rus_ege_n19")["cards"][3]
        legacy_old = dict(legacy, slug="rus_ege")      # блок, сделанный до разбиения: slug страницы
        new = part_file("rus_ege_n7")["cards"][2]
        soc = part_file("soc_oge_n20")["cards"][1]
        blocks = [wc.card_block(legacy, 0), wc.card_block(legacy_old, 1), wc.card_block(new, 2), wc.card_block(soc, 3)]
        blocks[1]["card"] = legacy["id"]
        link = wc.set_db(blocks, {"view": "list", "viewSwitch": True})
        sreqs = []
        sctx, sp = wc.student(browser, link, errors, "ученик", {"width": 1440, "height": 950}, False, sreqs)
        sp.click('#wView button[data-v="list"]')
        wc.wait_all_ready(sp, 4)
        st = sp.evaluate(wc.ST)
        check("C все 4 карточки отрисованы (CardRender)", len(st) == 4 and all(x["cr"] for x in st), str(st))
        js = sorted({u.split("/cards/")[1].split("?")[0] for u in sreqs if "/cards/" in u and u.split("?")[0].endswith(".json")})
        # legacy-блок (slug rus_ege) тянет 26 частей через index.json; три новых — свои части
        check("C блок до разбиения (slug rus_ege) собран из частей через index.json", "index.json" in js and len([x for x in js if x.startswith("rus_ege_n")]) == 26, str(js))
        check("C блоки с slug части — свой файл (soc_oge_n20)", "soc_oge_n20.json" in js, str(js))
        sctx.close()
        # один блок со slug части: ни index.json, ни чужих частей
        link = wc.set_db([wc.card_block(new, 0)], {"view": "list", "viewSwitch": True})
        sreqs = []
        sctx, sp = wc.student(browser, link, errors, "ученик-1", {"width": 1440, "height": 950}, False, sreqs)
        sp.click('#wView button[data-v="list"]')
        wc.wait_all_ready(sp, 1)
        js = sorted({u.split("/cards/")[1].split("?")[0] for u in sreqs if "/cards/" in u and u.split("?")[0].endswith(".json")})
        check("C один блок со slug части: загружен один файл rus_ege_n7.json", js == ["rus_ege_n7.json"], str(js))
        sctx.close()

        # печать: те же правила (work-print.js)
        pctx = new_context(browser, cards=True, viewport={"width": 1000, "height": 800})
        pp = pctx.new_page()
        watch_errors(pp, errors, "печать")
        pp.goto(f"{t15.BASE}/works.html")
        pp.wait_for_selector("#scrAuth:not([hidden])")
        r = pp.evaluate("""async (bl) => {
            const work = { title: 'Печать', variants: [{ num: 1, blocks: bl }] };
            await WorkPrint.build(work, { tasks: true }, 'portrait');
            const root = document.getElementById('wpPrint');
            return { cr: root.querySelectorAll('.wp-card .cr').length, noimg: root.querySelectorAll('.wp-card .wp-noimg').length };
        }""", [blocks[1], blocks[2], blocks[3]])
        check("C печать: блок до разбиения (slug rus_ege) и блоки со slug части — все три с условием (длинное задание может уйти в хвост — ещё один .cr)", r["cr"] >= 3 and r["noimg"] == 0, str(r))
        pctx.close()
        browser.close()
    check("D нет ошибок JavaScript", not errors, "; ".join(errors[:4]))


def part_n(slug):
    return len(part_file(slug)["cards"])


if __name__ == "__main__":
    run()
    print("\nПРОВАЛЕНО: %d" % len(FAILS) if FAILS else "\nИТОГО: ВСЁ ЗЕЛЁНОЕ")
    sys.exit(1 if FAILS else 0)
