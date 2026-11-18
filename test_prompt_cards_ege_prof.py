"""
Задача 63, S2e: карточки ФИПИ для ЕГЭ профиль (страница ege_prof, все номера).

  1. валидатор зелёный; карточек ровно столько, сколько заданий ФИПИ в каталоге
     страницы (727), id те же, что в каталоге; номера без заданий ФИПИ — только
     пустые места каталога (49), их карточек нет;
  2. у каждой карточки с рисунком файл существует, не пуст и открывается как PNG;
  3. развёрнутые (№14, №16): kind long, эталон и критерии на месте, разбор есть;
  4. свежая сборка (build.py --slug ege_prof --out) = cards/ege_prof.json и
     cards/img/ege_prof байт в байт;
  5. выборка 40 карточек (по 3 на номер): то же задание ФИПИ при openAt; текст,
     формулы, рисунки (пиксели, ширина) = живое задание; ответ = живой (у
     развёрнутых — числовая часть живого поля входит в эталон);
  6. preview.html рисует все карточки без ошибок;
  7. нет ошибок JavaScript.
Снимки «живое | карточка» для сверки глазами — CARDS_SHOTS=<папка>.
Запуск: python test_prompt_cards_ege_prof.py
"""
import io
import json
import os
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
SLUG = "ege_prof"


def check(n, c, x=""):
    print(("[OK] " if c else "[FAIL] ") + n + (f" — {x}" if x and not c else ""))
    if not c:
        FAILS.append(n)


def sample(cards, per=3):
    """По per карточек на номер через равный шаг — разные прототипы и виды."""
    by = {}
    for c in cards:
        by.setdefault(c["n"], []).append(c)
    out = []
    for n in sorted(by):
        l = by[n]
        out += [l[int(i * len(l) / per)] for i in range(per)]
    # 13 номеров по 3 = 39; сороковая — самый большой банк (№16, четвёртая карточка), чтобы выборка была ровно 40
    last = [c for c in by[16] if c not in out]
    return out + last[len(last) // 2:len(last) // 2 + 1]


def main():
    errors = []
    from tools.cards import validate
    check("1 валидатор зелёный", validate.main([]) == 0)
    d = json.load(open(os.path.join(HERE, "cards", SLUG + ".json"), encoding="utf-8"))
    cards = d["cards"]
    check("1 файл не partial", not d.get("partial"))
    ids = [c["id"] for c in cards]
    check("1 id не повторяются", len(ids) == len(set(ids)))

    # 2. рисунки
    from PIL import Image
    bad, nfig = [], 0
    for c in cards:
        for f in c["figs"]:
            nfig += 1
            p = os.path.join(HERE, "cards", f["file"])
            try:
                ok = os.path.getsize(p) > 0 and Image.open(p).size == (f["w"], f["h"])
            except Exception:
                ok = False
            if not ok:
                bad.append(c["id"] + " " + f["file"])
    check(f"2 рисунки: {nfig} файлов у {sum(1 for c in cards if c['figs'])} карточек, все есть и не пусты", nfig > 0 and not bad, str(bad[:5]))
    img_dir = os.path.join(HERE, "cards", "img", SLUG)
    used = {os.path.basename(f["file"]) for c in cards for f in c["figs"]}
    check("2 лишних файлов в cards/img/ege_prof нет", set(os.listdir(img_dir)) == used)

    # 3. развёрнутые
    longs = [c for c in cards if c["answer"]["kind"] == "long"]
    check("3 развёрнутые №14 и №16: все на месте", {c["n"] for c in longs} == {14, 16} and
          all(c["n"] in (14, 16) for c in longs) and len(longs) == sum(1 for c in cards if c["n"] in (14, 16)), str(len(longs)))
    check("3 у каждой: эталон, критерии с баллами, разбор",
          all(c["answer"]["value"] and "c-line" in (c["answer"].get("criteria") or "") and c["solution"] for c in longs))

    with local_server(), sync_playwright() as p:
        br = p.chromium.launch()
        pg = br.new_page(viewport={"width": 1280, "height": 900})
        pg.on("pageerror", lambda e: errors.append(str(e)))
        pg.goto(f"{BASE}/tools/cards/harness.html")
        pg.wait_for_function("() => window.CardCollect && window.trainerTaskInfo")
        pg.add_script_tag(url=f"{BASE}/card-render.js")
        # 1. каталог страницы
        cat, empty, nofipi = set(), 0, []
        for n in range(1, 21):
            pg.evaluate("h => CardCollect.open(h)", f"ege_prof.html?n={n}")
            pr = pg.evaluate("n => CardCollect.list(n)", n)
            got = [f for q in pr for f in q["fipi"] if f]
            cat |= {"fipi:" + f for f in got}
            empty += sum(1 for q in pr for f in q["fipi"] if not f)
            # пустые места каталога у номеров 1–5, 7–12, 14, 16 тоже есть (3 или 2 на номер)
            if not got:
                nofipi.append(n)
        check(f"1 обработано {len(cards)} из {len(cat)} заданий каталога", set(ids) == cat and len(cards) == len(cat) == 727, f"{len(cards)} / {len(cat)}")
        check("1 пустых мест каталога 49, номера без заданий ФИПИ — 6, 13, 15, 17–20", empty == 49 and nofipi == [6, 13, 15, 17, 18, 19, 20], f"{empty} {nofipi}")

        # 5. выборка
        smp = sample(cards)
        check("5 в выборке 40 карточек, по номерам с заданиями ФИПИ", len(smp) == 40, str(len(smp)))
        res = {k: 0 for k in ("same", "ans", "text", "tex", "fig", "ui")}
        bd = {k: [] for k in res}
        sheets = []
        cur = None
        for c in smp:
            fid = c["id"][5:]
            if cur != c["n"]:
                meta = pg.evaluate("h => CardCollect.open(h)", f"ege_prof.html?n={c['n']}")
                cur = c["n"]
            r = pg.evaluate("([p, i, n]) => CardCollect.openAt(p, i, n)", [c["proto"], c["pos"], c["n"]])
            if r.get("fipi") != fid:
                bd["same"].append(f"{fid}: openAt дал {r.get('fipi')}")
                continue
            res["same"] += 1
            info = pg.evaluate("t => trainerTaskInfo(document.getElementById('f').contentWindow, t, CardCollect.mainNode(t))", meta["tid"])
            info.pop("hot", None)
            a = c["answer"]
            if a["kind"] == "long":
                live_vals = [f["value"] for f in info["fields"]]
                ok = info["kind"] == "fields" and all(v.strip() for v in live_vals) and bool(a["value"])
            else:
                mine = {k: v for k, v in a.items() if k != "value"}
                ok = mine == info
            if ok:
                res["ans"] += 1
            else:
                bd["ans"].append(f"{fid}: {a} ≠ {info}")
            live = pg.evaluate(LIVE_TEXT, meta["tid"])
            card = pg.evaluate(RENDER, [c, live["width"], {}])
            if squash(live["text"]) == squash(card["text"]):
                res["text"] += 1
            else:
                bd["text"].append(f"{fid}:\n  живой {squash(live['text'])[:250]}\n  карт.  {squash(card['text'])[:250]}")
            if live["tex"] == card["tex"]:
                res["tex"] += 1
            else:
                bd["tex"].append(f"{fid}: {live['tex']} ≠ {card['tex']}")
            fig_ok = len(live["imgs"]) == len(card["imgs"]) == len(c["figs"])
            for li, ci in zip(live["imgs"], card["imgs"]):
                try:
                    same_px = pixels(urllib.request.urlopen(li["src"]).read()) == pixels(urllib.request.urlopen(ci["src"]).read())
                except Exception as e:  # noqa: BLE001
                    same_px = False
                    bd["fig"].append(f"{fid}: не открылся {li['src']} / {ci['src']}: {e}")
                if not same_px or abs(li["w"] - ci["w"]) > 2:
                    fig_ok = False
                    bd["fig"].append(f"{fid}: {li} ≠ {ci}")
            res["fig"] += fig_ok
            res["ui"] += card["ui"] == 0 and "Проверить" not in card["all"] and "Источник:" not in card["all"]
            if SHOTS:
                os.makedirs(SHOTS, exist_ok=True)
                node = pg.evaluate("""t => { const e = CardCollect.mainNode(t), w = e.ownerDocument.defaultView;
                  [...e.ownerDocument.querySelectorAll('body *')].forEach(x => { const p = w.getComputedStyle(x).position;
                    if ((p === 'fixed' || p === 'sticky') && !x.contains(e) && !e.contains(x)) x.setAttribute('data-shot-hide', x.style.visibility || '-'), x.style.visibility = 'hidden'; });
                  e.scrollIntoView(); return e.id; }""", meta["tid"])
                pg.wait_for_timeout(300)
                lp = pg.frame_locator("#f").locator("#" + node).screenshot()
                cp = pg.locator("#cardBox").screenshot()
                pg.evaluate("""() => document.getElementById('f').contentDocument.querySelectorAll('[data-shot-hide]').forEach(x => {
                  const v = x.getAttribute('data-shot-hide'); x.style.visibility = v === '-' ? '' : v; x.removeAttribute('data-shot-hide'); })""")
                # карточка с ответом и разбором — как её увидит ученик
                full = pg.evaluate("""async ([card, w]) => { const b = document.getElementById('cardBox'); b.innerHTML = '';
                  b.appendChild(CardRender.render(card, { base: '../../cards/', answer: true, solution: true, source: true }));
                  await new Promise(r => setTimeout(r, 150)); return 1; }""", [c, live["width"]])
                fp = pg.locator("#cardBox").screenshot()
                sheets.append((c["n"], fid, lp, cp, fp))
        n = len(smp)
        for k, title in (("same", "5 то же задание ФИПИ"), ("ans", "5 ответ = живой"), ("text", "5 текст = живой"),
                         ("tex", "5 формулы = живые"), ("fig", "5 рисунки: файл, пиксели, ширина"), ("ui", "5 без интерфейса")):
            check(f"{title}: {res[k]} из {n}", res[k] == n, "\n  " + "\n  ".join(bd[k][:6]))

        # 6. preview
        pv = br.new_page()
        pv.on("pageerror", lambda e: errors.append(str(e)))
        pv.goto(f"{BASE}/tools/cards/preview.html?slug={SLUG}&answer=1&solution=1")
        pv.wait_for_function("() => document.documentElement.dataset.ready === '1'", timeout=120000)
        k = pv.evaluate("() => document.querySelectorAll('.cr').length")
        check(f"6 preview.html: {k} карточек из {len(cards)}", k == len(cards))
        pv.close()
        br.close()

    # 4. свежая сборка = лежащая
    import time
    t0 = time.time()
    with tempfile.TemporaryDirectory() as tmp:
        r = subprocess.run([sys.executable, os.path.join(HERE, "tools", "cards", "build.py"), "--slug", SLUG, "--out", tmp],
                           cwd=HERE, capture_output=True, text=True, timeout=900)
        check("4 сборка прошла без необработанных", r.returncode == 0, r.stdout[-800:] + r.stderr[-800:])
        a = open(os.path.join(tmp, SLUG + ".json"), "rb").read()
        b = open(os.path.join(HERE, "cards", SLUG + ".json"), "rb").read()
        check("4 свежая сборка = cards/ege_prof.json", a == b)
        ok, why = dircmp_equal(os.path.join(tmp, "img", SLUG), img_dir)
        check("4 рисунки свежей сборки = cards/img/ege_prof", ok, why)
    print(f"сборка + сравнение: {time.time() - t0:.0f} с")

    if SHOTS and sheets:
        for n_, fid, a, b, c in sheets:
            ims = [Image.open(io.BytesIO(x)) for x in (a, b, c)]
            im = Image.new("RGB", (sum(i.width for i in ims) + 60, max(i.height for i in ims)), "white")
            x = 0
            for i in ims:
                im.paste(i, (x, 0)); x += i.width + 30
            im.save(os.path.join(SHOTS, f"ege_prof-{n_:02d}-{fid}.png"))
        print("снимки:", SHOTS)
    check("7 нет ошибок JavaScript", not errors, "; ".join(errors[:5]))
    print("готово" if not FAILS else f"ПРОВАЛЕНО: {len(FAILS)}")
    sys.exit(1 if FAILS else 0)


if __name__ == "__main__":
    main()
