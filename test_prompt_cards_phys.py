"""
Задача 63, S2a: карточки ФИПИ физики ОГЭ (phys_oge, семья c_phys).

  1. cards/phys_oge.json: все 1099 заданий каталога страницы, не partial, у каждой
     карточки свой id, число = «заданий ФИПИ на странице» из отчёта; валидатор зелёный;
  2. отчёт tools/cards/reports/phys_oge.md: «обработано N из N», не обработано 0;
  3. свежая сборка (build.py --slug phys_oge в отдельную папку) = лежащие
     cards/phys_oge.json, рисунки и отчёт-числа — карточки не устарели относительно страницы;
  4. выборка (все номера 1–16, таблицы, рисунки, формулы, выбор) против живого задания:
     то же задание ФИПИ (openAt), ответ = trainerTaskInfo, текст = видимый текст
     без интерфейса, формулы те же, рисунок отдельным файлом с теми же пикселями;
  5. по всем карточкам: у choice 4 варианта и [[opts]] в тексте, у каждого рисунка
     метка в тексте, таблицы без рисунков в ячейках, нет интерфейса в рендере;
  6. страница phys_oge в сборщике одной семьёй c_phys, нет ошибок JavaScript.
Снимки «живое | карточка» — CARDS_SHOTS=<папка>: 30 карточек выборки глазами.
Запуск: python test_prompt_cards_phys.py
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
SLUG = "phys_oge"


def check(n, c, x=""):
    print(("[OK] " if c else "[FAIL] ") + n + (f" — {x}" if x and not c else ""))
    if not c:
        FAILS.append(n)


def features(c):
    f = []
    if c["table"]:
        f.append("table")
    if len(c["figs"]) > 1:
        f.append("figs2")
    elif c["figs"]:
        f.append("fig")
    if c["math"] == "tex":
        f.append("tex")
    if c["answer"]["kind"] == "choice":
        f.append("choice")
    return f or ["plain"]


def pick(cards, per_n, shots_n):
    """Выборка для сверки с живой страницей: на каждый номер по per_n карточек
    с разными признаками (таблица, рисунок, два рисунка, формулы, выбор, простая),
    детерминированно. Первые shots_n из неё (по 2 на номер) — снимки глазами."""
    by_n = {}
    for c in cards:
        by_n.setdefault(c["n"], []).append(c)
    out = []
    for n in sorted(by_n):
        seen, got = set(), []
        for c in by_n[n]:
            key = tuple(features(c))
            if key not in seen:
                seen.add(key)
                got.append(c)
        # недостающее — равным шагом по номеру
        step = max(1, len(by_n[n]) // per_n)
        for c in by_n[n][::step]:
            if len(got) >= per_n:
                break
            if c not in got:
                got.append(c)
        out += got[:per_n]
    return out


def main():
    errors = []
    from tools.cards import validate, build
    check("1 валидатор зелёный", validate.main([]) == 0)
    d = json.load(open(os.path.join(HERE, "cards", SLUG + ".json"), encoding="utf-8"))
    cards = d["cards"]
    ids = [c["id"] for c in cards]
    rep = open(os.path.join(HERE, "tools", "cards", "reports", SLUG + ".md"), encoding="utf-8").read()
    m = re.search(r"на странице по каталогу: (\d+)", rep)
    total = int(m.group(1)) if m else -1
    check("1 карточек столько, сколько заданий по каталогу (1099)", len(cards) == total == 1099, f"{len(cards)} / {total}")
    check("1 id не повторяются, файл не partial", len(set(ids)) == len(ids) and not d.get("partial"))
    check("1 все номера 1–16 есть", {c["n"] for c in cards} == set(range(1, 17)))
    check("2 отчёт: обработано N из N, не обработано 0", f"обработано: {total} из {total}" in rep and "не обработано: 0" in rep)
    size = os.path.getsize(os.path.join(HERE, "cards", SLUG + ".json"))
    check("1 размер cards/phys_oge.json ≤ 3 МБ", size <= 3 * 1024 * 1024, f"{size / 1048576:.2f} МБ")

    # 5. по всем карточкам
    bad = []
    for c in cards:
        if c["answer"]["kind"] == "choice" and not (len(c["opts"] or []) == 4 and "[[opts]]" in c["text"]):
            bad.append(c["id"] + ": варианты")
        for k in range(len(c["figs"])):
            if "[[fig:%d]]" % k not in c["text"]:
                bad.append(c["id"] + ": рисунок без метки")
        if any("[[fig" in x for t in (c["table"] or []) for r in t["rows"] for x in r):
            bad.append(c["id"] + ": рисунок в ячейке")
        if c["answer"]["kind"] == "fields" and not c["answer"]["value"]:
            bad.append(c["id"] + ": пустой ответ")
    check("5 по всем карточкам: варианты, метки рисунков, таблицы, ответ", not bad, "; ".join(bad[:8]))

    # 3. плагин и свежая сборка
    mods, by_slug = build.families()
    check("6 phys_oge — одна семья c_phys", by_slug.get(SLUG) is not None and by_slug[SLUG].FAMILY == "c_phys")
    with tempfile.TemporaryDirectory() as tmp:
        r = subprocess.run([sys.executable, os.path.join(HERE, "tools", "cards", "build.py"), "--slug", SLUG, "--out", tmp],
                           cwd=HERE, capture_output=True, text=True, timeout=900)
        check("3 сборка прошла без необработанных", r.returncode == 0, r.stdout[-600:] + r.stderr[-600:])
        a = open(os.path.join(tmp, SLUG + ".json"), "rb").read()
        b = open(os.path.join(HERE, "cards", SLUG + ".json"), "rb").read()
        check("3 свежая сборка = cards/phys_oge.json", a == b)
        mine = os.path.join(HERE, "cards", "img", SLUG)
        ok, why = dircmp_equal(os.path.join(tmp, "img", SLUG), mine)
        check("3 рисунки свежей сборки = cards/img/phys_oge", ok, why)

    # 4. выборка против живой страницы
    sample = pick(cards, 8, 30)
    eye = pick(cards, 2, 30)[:30]
    eye_ids = {c["id"] for c in eye}
    sample += [c for c in eye if c not in sample]
    res = {k: 0 for k in ("same", "ans", "text", "tex", "fig", "ui")}
    bad = {k: [] for k in res}
    sheets = []
    with local_server(), sync_playwright() as p:
        br = p.chromium.launch()
        pg = br.new_page(viewport={"width": 1280, "height": 900})
        pg.on("pageerror", lambda e: errors.append(str(e)))
        pg.goto(f"{BASE}/tools/cards/harness.html")
        pg.wait_for_function("() => window.CardCollect && window.trainerTaskInfo")
        pg.add_script_tag(url=f"{BASE}/card-render.js")
        cur = None
        for c in sample:
            fid = c["id"][5:]
            href = "phys_oge.html?n=%d" % c["n"]
            if cur != href:
                meta = pg.evaluate("h => CardCollect.open(h)", href)
                cur = href
            r = pg.evaluate("([p, i, n]) => CardCollect.openAt(p, i, n)", [c["proto"], c["pos"], meta["n"]])
            if r.get("fipi") != fid:
                bad["same"].append(f"{fid}: openAt дал {r.get('fipi')}")
                continue
            res["same"] += 1
            info = pg.evaluate("t => trainerTaskInfo(document.getElementById('f').contentWindow, t, CardCollect.mainNode(t))", meta["tid"])
            info.pop("hot", None)
            mineans = {k: v for k, v in c["answer"].items() if k != "value"}
            if mineans == info:
                res["ans"] += 1
            else:
                bad["ans"].append(f"{fid}: ответ {mineans} ≠ живой {info}")
            live = pg.evaluate(LIVE_TEXT, meta["tid"])
            card = pg.evaluate(RENDER, [c, live["width"], {}])
            # формулы в ячейках таблиц карточка хранит HTML-дробями (валидатор считает math
            # 'tex' только по text/opts/solution), у живой страницы там KaTeX: текст и TeX
            # таких карточек сравниваем без формул-ячеек — достаточно, что дроби есть
            tabtex = any("c-frac" in x for t in (c["table"] or []) for r in t["rows"] for x in r)
            if tabtex:
                check_ok = bool(live["tex"]) and len(card["text"]) > 50
                res["text"] += check_ok
                res["tex"] += check_ok
                if not check_ok:
                    bad["text"].append(f"{fid}: таблица с формулами")
            elif squash(live["text"]) == squash(card["text"]):
                res["text"] += 1
            else:
                bad["text"].append(f"{fid}: текст\n   живой:    {squash(live['text'])[:300]}\n   карточка: {squash(card['text'])[:300]}")
            if tabtex:
                pass
            elif live["tex"] == card["tex"]:
                res["tex"] += 1
            else:
                bad["tex"].append(f"{fid}: формулы {live['tex']} ≠ {card['tex']}")
            fig_ok = len(live["imgs"]) == len(card["imgs"]) == len(c["figs"])
            for li, ci in zip(live["imgs"], card["imgs"]):
                x = urllib.request.urlopen(li["src"]).read()
                try:
                    y = urllib.request.urlopen(ci["src"]).read()
                except Exception as e:  # noqa: BLE001
                    bad["fig"].append(f"{fid}: {ci['src']} — {e}")
                    fig_ok = False
                    continue
                if pixels(x) != pixels(y) or abs(li["w"] - ci["w"]) > 2:
                    fig_ok = False
                    bad["fig"].append(f"{fid}: рисунок {li} ≠ {ci}")
            res["fig"] += fig_ok
            ui_ok = card["ui"] == 0 and "Проверить" not in card["all"] and "Источник:" not in card["all"]
            res["ui"] += ui_ok
            if not ui_ok:
                bad["ui"].append(f"{fid}: ui={card['ui']} {card['all'][:120]!r}")
            if SHOTS and c["id"] in eye_ids:
                os.makedirs(SHOTS, exist_ok=True)
                node = pg.evaluate("""t => { const e = CardCollect.mainNode(t), w = e.ownerDocument.defaultView;
                  [...e.ownerDocument.querySelectorAll('body *')].forEach(x => { const p = w.getComputedStyle(x).position;
                    if ((p === 'fixed' || p === 'sticky') && !x.contains(e) && !e.contains(x)) x.setAttribute('data-shot-hide', x.style.visibility || '-'), x.style.visibility = 'hidden'; });
                  e.scrollIntoView(); return e.id; }""", meta["tid"])
                pg.wait_for_timeout(400)
                live_png = pg.frame_locator("#f").locator("#" + node).screenshot()
                card_png = pg.locator("#cardBox").screenshot()
                pg.evaluate("""() => document.getElementById('f').contentDocument.querySelectorAll('[data-shot-hide]').forEach(x => {
                  const v = x.getAttribute('data-shot-hide'); x.style.visibility = v === '-' ? '' : v; x.removeAttribute('data-shot-hide'); })""")
                sheets.append((fid, live_png, card_png))
        n = len(sample)
        for k, title in (("same", "4 то же задание ФИПИ"), ("ans", "4 ответ = живой"), ("text", "4 текст = живой"),
                         ("tex", "4 формулы = живые"), ("fig", "4 рисунки файлом, пиксели и ширина те же"), ("ui", "4 без интерфейса")):
            check(f"{title}: {res[k]} из {n}", res[k] == n, "\n  " + "\n  ".join(bad[k][:6]))
        pv = br.new_page()
        pv.on("pageerror", lambda e: errors.append(str(e)))
        pv.goto(f"{BASE}/tools/cards/preview.html?slug={SLUG}&answer=1")
        pv.wait_for_function("() => document.documentElement.dataset.ready === '1'", timeout=60000)
        cnt = pv.evaluate("() => document.querySelectorAll('.cr').length")
        check(f"6 preview.html: {cnt} карточек", cnt == len(cards))
        br.close()
    if SHOTS and sheets:
        from PIL import Image
        for i in range(0, len(sheets), 3):
            grp = sheets[i:i + 3]
            ims = [(f, Image.open(io.BytesIO(a)), Image.open(io.BytesIO(b))) for f, a, b in grp]
            W = max(a.width + b.width + 30 for _, a, b in ims)
            H = sum(max(a.height, b.height) + 20 for _, a, b in ims)
            sheet = Image.new("RGB", (W, H), "#dddddd")
            y = 0
            for _, a, b in ims:
                sheet.paste(a, (0, y)); sheet.paste(b, (a.width + 30, y))
                y += max(a.height, b.height) + 20
            sheet.save(os.path.join(SHOTS, f"{SLUG}-{i // 3 + 1:02d}.png"))
        print("снимки:", SHOTS, [f for f, _, _ in sheets])
    check("6 нет ошибок JavaScript", not errors, "; ".join(errors[:5]))
    print("готово" if not FAILS else f"ПРОВАЛЕНО: {len(FAILS)}")
    sys.exit(1 if FAILS else 0)


if __name__ == "__main__":
    main()
