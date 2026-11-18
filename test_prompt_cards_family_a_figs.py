"""
Задача 63, S1c: карточки семьи a_figs — ОГЭ №1–5 (oge1_5, сюжеты из пяти частей)
и ОГЭ №15–18 (oge15_18, чертежи ФИПИ). Плагин tools/cards/families/a_figs.py.

  1. валидатор зелёный для cards/oge1_5.json и cards/oge15_18.json, файлы полные
     (не partial), в src — sha1 нынешних страницы и банков (карточки не устарели);
  2. покрытие: обработано + не обработано = заданий ФИПИ в каталоге страницы;
     у №1–5 не обработанных нет, у №15–18 причины только известные
     (строчный рисунок-обозначение fipi-inline) — по отчёту tools/cards/reports;
  3. рисунки: у каждой карточки с figs файл есть, не пустой, не одноцветный;
     в cards/img/<slug> нет файлов, на которые не ссылается ни одна карточка;
  4. №1–5 — связанные части: у каждого сюжета на каждом месте pos все пять частей
     (n = 1…5), первый <div> текста (общий текст сюжета) у них одинаковый,
     рисунки сюжета — общие файлы s_<сюжет>_<k>;
  5. таблицы: ни в одной ячейке нет рисунка; строки таблицы одной длины
     (объединения разложены в сетку);
  6. свежая сборка (build.py --family a_figs --limit 12 в отдельную папку) даёт
     те же карточки и те же файлы рисунков, что лежат в cards/;
  7. выборка живых заданий (по 30 со страницы + все части двух сюжетов):
     openAt открывает то же задание ФИПИ; ответ карточки = trainerTaskInfo живого;
     видимый текст карточки = текст живого (у №1–5 — сюжет из «Теории» + условие);
     рисунки — те же пиксели, их столько же;
  8. нет ошибок JavaScript.
Запуск: python test_prompt_cards_family_a_figs.py
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

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
FAILS = []
SLUGS = {"oge1_5": "oge1_5.html", "oge15_18": "oge15_18.html"}
# причины, с которыми задание законно остаётся без карточки (описаны в отчёте S1c)
KNOWN = ["рисунок-обозначение внутри строки (fipi-inline)"]


def check(n, c, x=""):
    print(("[OK] " if c else "[FAIL] ") + n + (f" — {x}" if x and not c else ""))
    if not c:
        FAILS.append(n)


def squash(s):
    # скобки — не сравниваем: подкоренное выражение карточка берёт в скобки (нет черты корня)
    return re.sub(r"[\s()]", "", s or "")


def pixels(data):
    from PIL import Image
    im = Image.open(io.BytesIO(data))
    im.seek(0)
    return im.convert("RGBA").tobytes(), im.size


def story_div(html):
    """Первый <div> верхнего уровня (общий текст сюжета) или None."""
    if not html.startswith("<div>"):
        return None
    depth = 0
    for m in re.finditer(r"<(/?)div\b[^>]*>", html):
        depth += -1 if m.group(1) else 1
        if depth == 0:
            return html[5:m.start()]
    return None


def load(slug):
    with open(os.path.join(HERE, "cards", slug + ".json"), encoding="utf-8") as fh:
        return json.load(fh)


LIVE = """([tid, story]) => {
  const w = document.getElementById('f').contentWindow, d = w.document;
  const el = CardCollect.mainNode(tid);
  const UI = 'button, input, select, textarea, .source-note, .answer-area, .input-answer-row, .card-btn-row, .manual-note, .fipi-ctx';
  const hid = [...el.querySelectorAll(UI)].map(x => [x, x.style.display]);
  hid.forEach(([x]) => { x.style.display = 'none'; });
  const nodes = (story ? [d.getElementById('theoryContent')] : []).concat([el]);
  const text = nodes.map(n => n.innerText).join('\\n');
  // строчные картинки-обозначения (ABC, AB, «1 × 1») карточка ставит текстом (a_figs.INLINE_TEXT) —
  // в рисунки живого задания они не входят, а в тексте их у живого нет: считаем отдельно
  const all = nodes.flatMap(n => [...n.querySelectorAll('img')]).filter(i => i.offsetParent !== null);
  const imgs = all.filter(i => !i.classList.contains('fipi-inline')).map(i => i.currentSrc || i.src);
  const inline = all.length - imgs.length;
  const width = Math.round(el.getBoundingClientRect().width);
  hid.forEach(([x, dd]) => { x.style.display = dd; });
  return { text, imgs, inline, width };
}"""

RENDER = """async ([card, width]) => {
  let box = document.getElementById('cardBox');
  if (!box) { box = document.createElement('div'); box.id = 'cardBox'; document.body.appendChild(box); }
  box.style.cssText = 'position:absolute;left:0;top:3000px;background:#fff;width:' + width + 'px';
  box.innerHTML = '';
  const el = CardRender.render(card, { base: '../../cards/' });
  box.appendChild(el);
  await Promise.all([...el.querySelectorAll('img')].map(i => i.complete ? 0 : new Promise(r => { i.onload = i.onerror = r; })));
  return { text: el.querySelector('.cr-text').innerText + '\\n' + [...el.querySelectorAll(':scope > .cr-table')].map(t => t.innerText).join('\\n'),
           imgs: [...el.querySelectorAll('img')].map(i => i.currentSrc || i.src),
           ui: el.querySelectorAll('button, input, select, textarea, a').length };
}"""


def main():
    from tools.cards import core, validate
    from tools.cards.families import a_figs
    data = {s: load(s) for s in SLUGS}

    # 1. валидатор, полнота, свежесть
    seen = {}
    for s in SLUGS:
        errs, _ = validate.check_file(os.path.join(HERE, "cards", s + ".json"), seen)
        check(f"1 {s}: валидатор без ошибок", not errs, "; ".join(map(str, errs))[:600])
        d = data[s]
        check(f"1 {s}: файл полный (не partial), семья a_figs", not d.get("partial") and d["family"] == "a_figs")
        stale = [f for f, h in d["src"].items() if core.sha1(f) != h]
        check(f"1 {s}: src = sha1 нынешних файлов", not stale, str(stale))

    # 2. покрытие по отчётам сборки
    for s in SLUGS:
        rep = open(os.path.join(HERE, "tools", "cards", "reports", s + ".md"), encoding="utf-8").read()
        total = int(re.search(r"заданий ФИПИ на странице по каталогу: (\d+)", rep).group(1))
        bad = re.findall(r"^\| ([0-9A-F]{6}) \| [^|]+ \| (.+) \|$", rep, re.M)
        n = len(data[s]["cards"])
        check(f"2 {s}: обработано {n} + не обработано {len(bad)} = {total}", n + len(bad) == total)
        unknown = [f"{f}: {why}" for f, why in bad if not any(k in why for k in KNOWN)]
        check(f"2 {s}: у необработанных только известные причины", not unknown, "; ".join(unknown[:5]))
        print(f"   {s}: обработано {n} из {total}")
    check("2 oge1_5: все 355 заданий — карточки", len(data["oge1_5"]["cards"]) == 355)

    # 3. файлы рисунков
    from PIL import Image
    for s in SLUGS:
        used, badf = set(), []
        for c in data[s]["cards"]:
            for f in c["figs"]:
                p = os.path.join(HERE, "cards", f["file"])
                used.add(os.path.normpath(p))
                if not os.path.isfile(p) or os.path.getsize(p) == 0:
                    badf.append(f["file"] + " нет/пустой")
                    continue
                if p.endswith(".png"):
                    with Image.open(p) as im:
                        if all(lo == hi for lo, hi in im.convert("RGB").getextrema()):
                            badf.append(f["file"] + " одноцветный")
        check(f"3 {s}: все рисунки — непустые файлы ({len(used)})", not badf, "; ".join(badf[:5]))
        d = os.path.join(HERE, "cards", "img", s)
        extra = [x for x in os.listdir(d) if os.path.normpath(os.path.join(d, x)) not in used]
        check(f"3 {s}: лишних файлов в cards/img/{s} нет", not extra, str(extra[:5]))

    # 4. связанные части №1–5
    cards15 = data["oge1_5"]["cards"]
    groups = {}
    for c in cards15:
        m = re.match(r"(.+)_t(\d)$", c["proto"])
        groups.setdefault((m.group(1), c["pos"]), []).append(c)
    bad = []
    for (sid, pos), parts in groups.items():
        ns = sorted(c["n"] for c in parts)
        heads = {story_div(c["text"]) for c in parts}
        sfig = {tuple(f["file"] for f in c["figs"] if "/s_" in f["file"]) for c in parts}
        if ns != [1, 2, 3, 4, 5] or len(heads) != 1 or None in heads or len(sfig) != 1:
            bad.append(f"{sid}@{pos}: n={ns}, сюжетов {len(heads)}, наборов рисунков сюжета {len(sfig)}")
    check(f"4 №1–5: {len(groups)} сюжетов-мест, в каждом пять частей с одним общим текстом", not bad, "; ".join(bad[:5]))

    # 5. таблицы
    bad = []
    for s in SLUGS:
        for c in data[s]["cards"]:
            for t in c["table"] or []:
                rows = ([t["head"]] if t.get("head") else []) + t["rows"]
                if any("[[fig" in x for r in rows for x in r):
                    bad.append(c["id"] + " рисунок в ячейке")
                if len({len(r) for r in rows}) > 1:
                    bad.append(c["id"] + " строки разной длины")
    check("5 таблицы: текстом, без рисунков в ячейках, сеткой", not bad, "; ".join(bad[:5]))
    tire = next(c for c in cards15 if c["id"] == "fipi:F2EFEB")
    check("5 шины: таблица с объединённой шапкой — 4 столбца, «Диаметр диска (дюймы)» в шапке",
          tire["table"] and tire["table"][0]["head"][:2] == ["Ширина шины (мм)", "Диаметр диска (дюймы)"] and len(tire["table"][0]["rows"][0]) == 4)

    # 6. свежая сборка = лежащая
    with tempfile.TemporaryDirectory() as tmp:
        r = subprocess.run([sys.executable, os.path.join(HERE, "tools", "cards", "build.py"), "--family", "a_figs", "--limit", "12", "--out", tmp],
                           cwd=HERE, capture_output=True, text=True, timeout=900)
        check("6 свежая сборка прошла", "обработано" in r.stdout, r.stdout[-600:] + r.stderr[-600:])
        for s in SLUGS:
            fresh = json.load(open(os.path.join(tmp, s + ".json"), encoding="utf-8"))["cards"]
            have = {c["id"]: c for c in data[s]["cards"]}
            diff = [c["id"] for c in fresh if have.get(c["id"]) != c]
            check(f"6 {s}: {len(fresh)} свежих карточек = лежащие", fresh and not diff, str(diff[:5]))
            fd = [f["file"] for c in fresh for f in c["figs"]
                  if open(os.path.join(tmp, f["file"]), "rb").read() != open(os.path.join(HERE, "cards", f["file"]), "rb").read()]
            check(f"6 {s}: рисунки свежей сборки = cards/img", not fd, str(fd[:5]))

    # 7. живые задания
    errors = []
    with local_server(), sync_playwright() as p:
        br = p.chromium.launch()
        pg = br.new_page(viewport={"width": 1280, "height": 900})
        pg.on("pageerror", lambda e: errors.append(str(e)))
        pg.goto(f"{BASE}/tools/cards/harness.html")
        pg.wait_for_function("() => window.CardCollect && window.trainerTaskInfo")
        pg.add_script_tag(url=f"{BASE}/card-render.js")
        for s, href in SLUGS.items():
            cs = data[s]["cards"]
            sample = cs[::max(1, len(cs) // 30)][:30]
            if s == "oge1_5":   # все пять частей двух сюжетов
                for key in list(groups)[:: max(1, len(groups) // 2)][:2]:
                    sample += [c for c in groups[key] if c not in sample]
            meta = pg.evaluate("h => CardCollect.open(h)", href)
            res = {k: 0 for k in ("same", "ans", "text", "fig", "ui")}
            bad = {k: [] for k in res}
            for c in sample:
                fid = c["id"][5:]
                r = pg.evaluate("([p, i, n]) => CardCollect.openAt(p, i, n)", [c["proto"], c["pos"], meta["n"]])
                if r.get("fipi") != fid:
                    bad["same"].append(f"{fid}: openAt дал {r.get('fipi')}")
                    continue
                res["same"] += 1
                info = pg.evaluate("t => trainerTaskInfo(document.getElementById('f').contentWindow, t, CardCollect.mainNode(t))", meta["tid"])
                info.pop("hot", None)
                mine = {k: v for k, v in c["answer"].items() if k != "value"}
                if mine == info:
                    res["ans"] += 1
                else:
                    bad["ans"].append(f"{fid}: {mine} ≠ {info}")
                story = s == "oge1_5"
                if story:
                    st = pg.evaluate("e => CardCollect.evalIn(e)", a_figs._STORY_EXPR % (c["proto"], c["pos"]))
                    pg.evaluate(a_figs._SHOW_STORY_JS, st["html"])
                live = pg.evaluate(LIVE, [meta["tid"], story])
                card = pg.evaluate(RENDER, [c, live["width"]])
                ct = squash(card["text"])
                if live.get("inline"):
                    # подставленные картинкой-текстом обозначения — из текста карточки долой, по одному на картинку
                    subs = sorted((squash(v["s"]) for v in a_figs.INLINE_TEXT.values()), key=len, reverse=True)
                    removed = 0
                    for sub in subs:
                        while sub in ct and removed < live["inline"]:
                            ct = ct.replace(sub, "", 1); removed += 1
                    if removed != live["inline"]:
                        bad["text"].append(f"{fid}: строчных картинок {live['inline']}, подставлено {removed}")
                if squash(live["text"]) == ct:
                    res["text"] += 1
                else:
                    bad["text"].append(f"{fid}:\n   живой:    {squash(live['text'])[:240]}\n   карточка: {squash(card['text'])[:240]}")
                ok = len(live["imgs"]) == len(card["imgs"]) == len(c["figs"])
                for a, b in zip(live["imgs"], card["imgs"]):
                    if pixels(urllib.request.urlopen(a).read()) != pixels(urllib.request.urlopen(b).read()):
                        ok = False
                        bad["fig"].append(f"{fid}: {a} ≠ {b}")
                if not ok and not bad["fig"]:
                    bad["fig"].append(f"{fid}: рисунков живых {len(live['imgs'])}, в карточке {len(card['imgs'])}")
                res["fig"] += ok
                res["ui"] += card["ui"] == 0
            n = len(sample)
            for k, what in (("same", "openAt — то же задание"), ("ans", "ответ = живой"), ("text", "текст = живой"),
                            ("fig", "рисунки — те же пиксели"), ("ui", "нет элементов интерфейса")):
                check(f"7 {s}: {what} {res[k]}/{n}", res[k] == n, "\n  " + "\n  ".join(bad[k][:4]))
        br.close()
    check("8 нет ошибок JavaScript", not errors, "; ".join(errors[:3]))

    print("\nготово" if not FAILS else f"\nПРОВАЛЕНО: {len(FAILS)}")
    sys.exit(1 if FAILS else 0)


if __name__ == "__main__":
    main()
