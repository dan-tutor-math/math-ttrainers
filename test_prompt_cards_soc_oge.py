"""
Задача 63, S2c1: карточки ФИПИ — обществознание ОГЭ (cards/soc_oge.json (№1–16) и cards/soc_oge_text.json (№18–21), семья c_soc_oge).

  1. валидатор tools/cards/validate.py зелёный;
  2. карточек столько, сколько заданий ФИПИ в каталоге страницы (по номерам 1–21), id не
     повторяются, №17 (в банке заданий нет) — 0;
  3. свежая сборка (--limit 63 в отдельную папку) совпадает с лежащими карточками (по id)
     и рисунками байт в байт — карточки не устарели относительно страницы и банка;
  4. выборка (каждый ~16-й плюс по одному каждого вида: рисунок, таблица, развёрнутое):
     то же задание ФИПИ по openAt; ответ короткого = trainerTaskInfo живого задания;
     видимый текст карточки = живой (варианты ответа — у карточки в opts);
     рисунок — файл, пиксели те же;
  5. развёрнутые: образец ответа и критерии на месте, баллы по убыванию;
  6. предпросмотр рисует все 2668 карточек с ответом и разбором, без ошибок JavaScript.
Снимки «живое | карточка» — если задана CARDS_SHOTS=<папка>.
Запуск: python test_prompt_cards_soc_oge.py
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
from test_prompt_cards_pilot import LIVE_TEXT, RENDER, check, dircmp_equal, pixels, squash
import test_prompt_cards_pilot as T

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
SHOTS = os.environ.get("CARDS_SHOTS")
LIVE_N = 16  # шаг выборки


def main():
    errors = []
    from tools.cards import validate
    check("1 валидатор зелёный", validate.main([]) == 0)
    cards, parts = [], {}
    for slug in ("soc_oge", "soc_oge_text"):
        with open(os.path.join(HERE, "cards", slug + ".json"), encoding="utf-8") as fh:
            parts[slug] = json.load(fh)
        cards += parts[slug]["cards"]
    check("2 два файла: №1–16 и №18–21, slug карточки = файл",
          {c["n"] for c in parts["soc_oge"]["cards"]} <= set(range(1, 17)) and {c["n"] for c in parts["soc_oge_text"]["cards"]} == {18, 19, 20, 21}
          and all(c["slug"] == s for s, d in parts.items() for c in d["cards"]))
    check("2 каждый файл до ~3 МБ", all(os.path.getsize(os.path.join(HERE, "cards", s + ".json")) < 3.3 * 1024 * 1024 for s in parts))
    data = parts["soc_oge"]
    byn = {}
    for c in cards:
        byn.setdefault(c["n"], []).append(c)
    check("2 id не повторяются", len({c["id"] for c in cards}) == len(cards))
    check("2 файлы — не пилот", not any(d.get("partial") for d in parts.values()))

    # 3. свежая сборка (подмножество) = лежащая
    with tempfile.TemporaryDirectory() as tmp:
        r = subprocess.run([sys.executable, os.path.join(HERE, "tools", "cards", "build.py"), "--slug", "soc_oge", "--slug", "soc_oge_text",
                            "--limit", "63", "--out", tmp], cwd=HERE, capture_output=True, text=True, timeout=900)
        check("3 сборка прошла без необработанных", r.returncode == 0, r.stdout[-800:] + r.stderr[-800:])
        fresh = [c for sl in parts for c in json.load(open(os.path.join(tmp, sl + ".json"), encoding="utf-8"))["cards"]]
        mine = {c["id"]: c for c in cards}
        diff = [c["id"] for c in fresh if mine.get(c["id"]) != c]
        check(f"3 свежих {len(fresh)}, все как в лежащих файлах", fresh and not diff, str(diff[:5]))
        bad = []
        for c in fresh:
            for f in c["figs"]:
                a = open(os.path.join(tmp, f["file"]), "rb").read()
                b = open(os.path.join(HERE, "cards", f["file"]), "rb").read()
                if a != b:
                    bad.append(f["file"])
        check("3 рисунки свежей сборки = cards/img", not bad, str(bad[:5]))

    with local_server(), sync_playwright() as p:
        br = p.chromium.launch()
        pg = br.new_page(viewport={"width": 1280, "height": 900})
        pg.on("pageerror", lambda e: errors.append(str(e)))
        pg.goto(f"{BASE}/tools/cards/harness.html")
        pg.wait_for_function("() => window.CardCollect && window.trainerTaskInfo")
        pg.add_script_tag(url=f"{BASE}/card-render.js")

        # 2. по каталогу
        total = 0
        sheets = []
        res = {k: 0 for k in ("same", "ans", "text", "fig")}
        bad = {k: [] for k in res}
        tested = 0
        for n in range(1, 22):
            for attempt in range(8):  # кадр иногда ещё в переходе (cross-origin на миг)
                try:
                    meta = pg.evaluate("h => CardCollect.open(h)", f"soc_oge.html?n={n}")
                    break
                except Exception:
                    if attempt == 7:
                        raise
                    pg.wait_for_timeout(1500)
            tid = meta["tid"] or "soc20"
            protos = pg.evaluate("n => CardCollect.list(n)", n)
            want = sum(1 for q in protos for f in q["fipi"] if f)
            total += want
            check(f"2 №{n}: карточек {len(byn.get(n, []))} из {want} по каталогу", len(byn.get(n, [])) == want)
            fipis = {f for q in protos for f in q["fipi"] if f}
            check(f"2 №{n}: те же номера ФИПИ, что в каталоге", {c["id"][5:] for c in byn.get(n, [])} == fipis)
            mc = byn.get(n, [])
            pick = mc[::LIVE_N]
            for kind in (lambda c: c["figs"], lambda c: c["table"], lambda c: c["opts"], lambda c: c["answer"]["kind"] == "long"):
                x = next((c for c in mc if kind(c)), None)
                if x and x not in pick:
                    pick.append(x)
            for c in pick:
                tested += 1
                fid = c["id"][5:]
                r = pg.evaluate("([p, i, n]) => CardCollect.openAt(p, i, n)", [c["proto"], c["pos"], n])
                if r.get("fipi") != fid:
                    bad["same"].append(f"{fid}: openAt дал {r.get('fipi')}")
                    continue
                res["same"] += 1
                a = c["answer"]
                if a["kind"] != "long":
                    live = pg.evaluate("t => trainerTaskInfo(document.getElementById('f').contentWindow, t, CardCollect.mainNode(t))", tid)
                    live.pop("hot", None)
                    mine_a = {k: v for k, v in a.items() if k != "value"}
                    if mine_a == live:
                        res["ans"] += 1
                    else:
                        bad["ans"].append(f"{fid}: {mine_a} ≠ {live}")
                else:
                    res["ans"] += 1
                lv = pg.evaluate(LIVE_TEXT, tid)
                cd = pg.evaluate(RENDER, [c, lv["width"], {}])
                # у карточки номера вариантов рисует рендерер («1)»), у страницы — в самом тексте;
                # страница делит раскладку ФИПИ пробелами — сверяем по буквам и цифрам
                norm = lambda s: re.sub(r"[\s ]+|[1-4]\)|[А-ЯЁ][.)]", "", s or "")
                # две колонки №14: страница читает их столбцами, карточка — таблицей по строкам; состав текста тот же
                same_text = norm(lv["text"]) == norm(cd["text"]) or (bool(c["table"]) and sorted(norm(lv["text"])) == sorted(norm(cd["text"])))
                if same_text:
                    res["text"] += 1
                else:
                    bad["text"].append(f"{fid}: текст\n   живой:    {squash(lv['text'])[:260]}\n   карточка: {squash(cd['text'])[:260]}")
                fig_ok = len(lv["imgs"]) == len(cd["imgs"]) == len(c["figs"])
                for li, ci in zip(lv["imgs"], cd["imgs"]):
                    if pixels(urllib.request.urlopen(li["src"]).read()) != pixels(urllib.request.urlopen(ci["src"]).read()):
                        fig_ok = False
                res["fig"] += fig_ok
                if not fig_ok:
                    bad["fig"].append(fid)
                if SHOTS:
                    os.makedirs(SHOTS, exist_ok=True)
                    node = pg.evaluate("""t => { const e = CardCollect.mainNode(t), w = e.ownerDocument.defaultView;
                      [...e.ownerDocument.querySelectorAll('body *')].forEach(x => { const p = w.getComputedStyle(x).position;
                        if ((p === 'fixed' || p === 'sticky') && !x.contains(e) && !e.contains(x)) x.setAttribute('data-shot-hide', x.style.visibility || '-'), x.style.visibility = 'hidden'; });
                      e.scrollIntoView(); return e.id; }""", tid)
                    pg.wait_for_timeout(300)
                    lp = pg.frame_locator("#f").locator("#" + node).screenshot()
                    cp = pg.locator("#cardBox").screenshot()
                    sheets.append((f"n{n}-{fid}", lp, cp))
        check("2 всего по каталогу 2668", total == 2668 == len(cards), f"{total} / {len(cards)}")
        for k, title in (("same", "4 то же задание ФИПИ"), ("ans", "4 ответ = живой"), ("text", "4 текст = живой"), ("fig", "4 рисунки: файл, пиксели те же")):
            check(f"{title}: {res[k]} из {tested}", res[k] == tested, "\n  " + "\n  ".join(bad[k][:6]))

        # 5. развёрнутые
        longs = [c for c in cards if c["answer"]["kind"] == "long"]
        check("5 развёрнутые: только №1, 7, 8, 12, 18–21", {c["n"] for c in longs} == {1, 7, 8, 12, 18, 19, 20, 21})
        check("5 у каждого развёрнутого образец и критерии с баллами",
              all(c["answer"]["value"].strip() and re.search(r"бал", c["answer"].get("criteria") or "") for c in longs))
        def order_ok(c):
            pts = [int(x) for x in re.findall(r'<b>(\d+) бал', c["answer"]["criteria"])]
            return pts == sorted(pts, reverse=True) and pts and pts[-1] == 0
        check("5 баллы критериев по убыванию, последний — 0", all(order_ok(c) for c in longs))
        check("5 у №18–21 текст к заданиям в самой карточке",
              all("Текст к заданиям" in c["text"] and len(c["text"]) > 1000 for c in cards if c["n"] >= 18))
        check("5 у коротких нет критериев и «long»", all(c["answer"]["kind"] in ("fields", "choice", "multi") and not c["answer"].get("criteria") for c in cards if c["answer"]["kind"] != "long"))
        # 6. предпросмотр
        shown = 0
        for sl in parts:
            pv = br.new_page()
            pv.on("pageerror", lambda e: errors.append(str(e)))
            pv.goto(f"{BASE}/tools/cards/preview.html?slug={sl}&answer=1&solution=1")
            pv.wait_for_function("() => document.documentElement.dataset.ready === '1'", timeout=120000)
            shown += pv.evaluate("() => document.querySelectorAll('.cr').length")
            pv.close()
        check(f"6 preview.html: {shown} карточек", shown == 2668)
        br.close()
    if SHOTS and sheets:
        from PIL import Image
        for fid, a, b in sheets:
            a, b = Image.open(io.BytesIO(a)), Image.open(io.BytesIO(b))
            im = Image.new("RGB", (a.width + b.width + 30, max(a.height, b.height)), "white")
            im.paste(a, (0, 0)); im.paste(b, (a.width + 30, 0))
            im.save(os.path.join(SHOTS, fid + ".png"))
        print("снимки:", SHOTS)
    check("7 нет ошибок JavaScript", not errors, "; ".join(errors[:5]))
    print("готово" if not T.FAILS else f"ПРОВАЛЕНО: {len(T.FAILS)}")
    sys.exit(1 if T.FAILS else 0)


if __name__ == "__main__":
    main()
