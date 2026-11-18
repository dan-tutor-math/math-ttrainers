"""
Задача 63, S2c2: карточки ФИПИ — обществознание ЕГЭ (семья c_soc_ege):
soc_ege (№1–16, 1134 задания) и soc_ege_long (№17–25, 544 задания, развёрнутый ответ).

  1. валидатор tools/cards/validate.py зелёный; число карточек = число заданий
     страницы минус перечисленные в отчёте необработанные (причина у каждого);
  2. свежая полная сборка (build.py --family c_soc_ege в отдельную папку) совпадает
     с лежащими cards/*.json и рисунками байт в байт;
  3. выборка (каждая STEP-я карточка + все с рисунком/таблицей): живое задание
     открывается тем же openAt; ответ карточки = ответ живого задания (короткая
     часть); видимый текст, формулы, рисунки — как на странице;
  4. развёрнутые: kind long, критерии ФИПИ в answer.criteria, автопроверки нет;
  5. в карточке нет интерфейса; плагин объявляет оба slug и ни один чужой;
  6. нет ошибок JavaScript.
Снимки «живое | карточка» — CARDS_SHOTS=<папка>. Запуск: python test_prompt_cards_soc_ege.py
"""
import io
import json
import os
import re
import subprocess
import sys
import tempfile
import urllib.request

from test_prompt15_works_stage1 import BASE, local_server, sync_playwright
from test_prompt_cards_pilot import LIVE_TEXT, RENDER, dircmp_equal, pixels, squash

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
FAILS = []
SHOTS = os.environ.get("CARDS_SHOTS")
STEP = int(os.environ.get("CARDS_STEP", "40"))
SLUGS = {"soc_ege": 1134, "soc_ege_long": 544}
SKIP_OK = {"soc_ege": 0, "soc_ege_long": 0}   # необработанных нет


def check(n, c, x=""):
    print(("[OK] " if c else "[FAIL] ") + n + (f" — {x}" if x and not c else ""))
    if not c:
        FAILS.append(n)


def main():
    errors = []
    from tools.cards import validate, build
    rc = validate.main([])
    check("1 валидатор зелёный", rc == 0)
    cards = {}
    for slug, total in SLUGS.items():
        cards[slug] = json.load(open(os.path.join(HERE, "cards", slug + ".json"), encoding="utf-8"))
        n = len(cards[slug]["cards"])
        check(f"1 {slug}: {n} карточек из {total}", n == total - SKIP_OK[slug], str(n))
        check(f"1 {slug}: не partial", not cards[slug].get("partial"))
        rep = open(os.path.join(HERE, "tools", "cards", "reports", slug + ".md"), encoding="utf-8").read()
        check(f"1 {slug}: отчёт «обработано {n} из {total}»", f"обработано: {n} из {total}" in rep)
    mods, by_slug = build.families()
    check("5 оба slug в одной семье c_soc_ege", all(by_slug[s].FAMILY == "c_soc_ege" for s in SLUGS))
    check("5 семья c_soc_ege не объявляет чужих slug", {p["slug"] for p in by_slug["soc_ege"].PAGES} == set(SLUGS))
    with tempfile.TemporaryDirectory() as tmp:
        r = subprocess.run([sys.executable, os.path.join(HERE, "tools", "cards", "build.py"), "--family", "c_soc_ege", "--out", tmp],
                           cwd=HERE, capture_output=True, text=True, timeout=900)
        for slug in SLUGS:
            a = open(os.path.join(tmp, slug + ".json"), "rb").read()
            b = open(os.path.join(HERE, "cards", slug + ".json"), "rb").read()
            check(f"2 {slug}: свежая сборка = cards/{slug}.json", a == b, r.stdout[-600:] + r.stderr[-600:])
            ok, why = dircmp_equal(os.path.join(tmp, "img", slug), os.path.join(HERE, "cards", "img", slug)) \
                if os.path.isdir(os.path.join(tmp, "img", slug)) else (False, "нет img")
            check(f"2 {slug}: рисунки свежей сборки = cards/img/{slug}", ok, why)
    for c in cards["soc_ege_long"]["cards"]:
        a = c["answer"]
        if a["kind"] != "long" or not (a.get("criteria") or "").strip():
            check("4 long: kind long и критерии", False, c["id"])
            break
    else:
        check("4 long: у всех kind long и критерии ФИПИ", True)
    check("4 short: нет kind long", all(c["answer"]["kind"] != "long" for c in cards["soc_ege"]["cards"]))
    with local_server(), sync_playwright() as p:
        br = p.chromium.launch()
        pg = br.new_page(viewport={"width": 1280, "height": 900})
        pg.on("pageerror", lambda e: errors.append(str(e)))
        pg.goto(f"{BASE}/tools/cards/harness.html")
        pg.wait_for_function("() => window.CardCollect && window.trainerTaskInfo")
        pg.add_script_tag(url=f"{BASE}/card-render.js")
        reorder = {k: 0 for k in SLUGS}
        for slug in SLUGS:
            res = {k: 0 for k in ("same", "ans", "text", "tex", "fig", "ui")}
            bad = {k: [] for k in res}
            sample = [c for i, c in enumerate(cards[slug]["cards"]) if i % STEP == 0 or c["figs"] or c["table"]]
            by_n = {}
            for c in sample:
                by_n.setdefault(c["n"], []).append(c)
            for n, lst in sorted(by_n.items()):
                href = [x["href"] for x in by_slug[slug].PAGES if x["slug"] == slug and x["href"].endswith("n=%d" % n)][0]
                meta = pg.evaluate("h => CardCollect.open(h)", href)
                for c in lst:
                    fid = c["id"][5:]
                    r = pg.evaluate("([p, i, n]) => CardCollect.openAt(p, i, n)", [c["proto"], c["pos"], n])
                    if r.get("fipi") == fid:
                        res["same"] += 1
                    else:
                        bad["same"].append(f"{fid}: openAt дал {r.get('fipi')}")
                        continue
                    live_info = pg.evaluate("t => trainerTaskInfo(document.getElementById('f').contentWindow, t, CardCollect.mainNode(t))", meta["tid"])
                    mine = {k: v for k, v in c["answer"].items() if k not in ("value", "criteria")}
                    if live_info:
                        live_info.pop("hot", None)
                    if (slug == "soc_ege_long" and mine == {"kind": "long"}) or mine == live_info:
                        res["ans"] += 1
                    else:
                        bad["ans"].append(f"{fid}: ответ {mine} ≠ живой {live_info}")
                    live = pg.evaluate(LIVE_TEXT, meta["tid"])
                    card = pg.evaluate(RENDER, [c, live["width"], {}])
                    # свёрнутый блок «Текст к заданиям» и номера вариантов рисует рендерер — сравниваем без пробелов
                    lt, ct = squash(live["text"]), squash(card["text"])
                    if lt == ct:
                        res["text"] += 1
                    elif sorted(lt) == sorted(ct) and "Установите соответствие" in live["text"]:
                        # соответствие (№3, 13): живая страница читается по строкам двух колонок,
                        # карточка — колонка за колонкой; состав текста тот же, порядок чтения иной
                        res["text"] += 1
                        reorder[slug] += 1
                    else:
                        bad["text"].append(f"{fid}: текст\n   живой:    {squash(live['text'])[:300]}\n   карточка: {squash(card['text'])[:300]}")
                    if live["tex"] == card["tex"]:
                        res["tex"] += 1
                    else:
                        bad["tex"].append(f"{fid}: формулы {live['tex']} ≠ {card['tex']}")
                    fig_ok = len(live["imgs"]) == len(card["imgs"]) == len(c["figs"])
                    for li, ci in zip(live["imgs"], card["imgs"]):
                        a = urllib.request.urlopen(li["src"]).read()
                        b = urllib.request.urlopen(ci["src"]).read()
                        if pixels(a) != pixels(b) or abs(li["w"] - ci["w"]) > 2:
                            fig_ok = False
                            bad["fig"].append(f"{fid}: рисунок {li} ≠ {ci}")
                    res["fig"] += fig_ok
                    res["ui"] += card["ui"] == 0 and "Проверить" not in card["all"] and "Источник:" not in card["all"]
            tot = len(sample)
            print(f"   {slug}: соответствий с иным порядком чтения колонок: {reorder[slug]}")
            for k, title in (("same", "3 то же задание ФИПИ"), ("ans", "3 ответ = живой"), ("text", "3 текст = живой"),
                             ("tex", "3 формулы = живые"), ("fig", "3 рисунки файлом, пиксели те же"), ("ui", "5 без интерфейса")):
                check(f"{title}: {slug} {res[k]} из {tot}", res[k] == tot, "\n  " + "\n  ".join(bad[k][:6]))
        for slug in SLUGS:
            pv = br.new_page()
            pv.on("pageerror", lambda e: errors.append(str(e)))
            pv.goto(f"{BASE}/tools/cards/preview.html?slug={slug}&answer=1&solution=1")
            pv.wait_for_function("() => document.documentElement.dataset.ready === '1'", timeout=60000)
            n = pv.evaluate("() => document.querySelectorAll('.cr').length")
            check(f"5 preview.html {slug}: {n} карточек", n == len(cards[slug]["cards"]))
            pv.close()
        br.close()
    check("6 нет ошибок JavaScript", not errors, "; ".join(errors[:5]))
    print("готово" if not FAILS else f"ПРОВАЛЕНО: {len(FAILS)}")
    sys.exit(1 if FAILS else 0)


if __name__ == "__main__":
    main()
