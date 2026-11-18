"""
Задача 63, S2b: карточки ФИПИ информатики ОГЭ (cards/inf_oge.json, семья c_inf).

  1. валидатор зелёный; карточек ровно столько, сколько заданий ФИПИ по каталогу
     страницы (906), id не повторяются, отчёт tools/cards/reports/inf_oge.md
     говорит «обработано 906 из 906»;
  2. свежая сборка (build.py --slug inf_oge в отдельную папку) совпадает с лежащими
     cards/inf_oge.json и рисунками байт в байт;
  3. по КАЖДОЙ карточке: живое задание открывается тем же openAt, это то же
     задание ФИПИ; ответ карточки = ответ живого задания (egeTaskInfo, как у
     страниц-копий ege_prof); видимый текст карточки (CardRender) = видимый текст
     живого задания без «Источник» — в нём и код программ, и таблицы;
  4. рисунок — отдельный файл, пиксели те же, что у картинки на странице, ширина та же;
  5. программы: у задания с таблицей colspan ни одна строка кода не потеряна
     (все языки на месте), в карточке нет <img> и интерфейса;
  6. рендер с ответом и разбором; нет ошибок JavaScript.
Снимки «живое | карточка» для сверки глазами — CARDS_SHOTS=<папка>: выборка 30
карточек (рисунки, таблицы, программы, слова) → <ФИПИ>.png и лист inf_oge.png.
Запуск: python test_prompt_cards_inf.py
"""
import io
import json
import os
import re
import subprocess
import sys
import tempfile
import urllib.request

from playwright.sync_api import sync_playwright
from test_prompt_cards_pilot import dircmp_equal, pixels, squash

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
FAILS = []
SLUG = "inf_oge"
SHOTS = os.environ.get("CARDS_SHOTS")


def check(n, c, x=""):
    print(("[OK] " if c else "[FAIL] ") + n + (f" — {x}" if x and not c else ""))
    if not c:
        FAILS.append(n)


LIVE = """() => {
  const w = document.getElementById('f').contentWindow, el = w.document.getElementById('questionText');
  const UI = 'button, input, select, textarea, .ege-source, .source-note';
  const hid = [...el.querySelectorAll(UI)].map(x => [x, x.style.display]);
  hid.forEach(([x]) => { x.style.display = 'none'; });
  const text = el.innerText;
  const imgs = [...el.querySelectorAll('img')].filter(i => i.offsetParent !== null).map(i => ({ src: i.currentSrc || i.src, w: Math.round(i.getBoundingClientRect().width) }));
  const width = Math.round(el.getBoundingClientRect().width);
  hid.forEach(([x, d]) => { x.style.display = d; });
  return { text, imgs, width, info: egeTaskInfo(w, -1, el) };
}"""

RENDER = """async ([card, width, opts]) => {
  await CardRender.ready(card, { root: '../../' });
  let box = document.getElementById('cardBox');
  if (!box) { box = document.createElement('div'); box.id = 'cardBox'; document.body.appendChild(box); }
  box.style.cssText = 'position:absolute;left:0;top:1500px;background:#fff;color:#1d1d1f;padding:0;width:' + width + 'px';
  box.innerHTML = '';
  const el = CardRender.render(card, Object.assign({ base: '../../cards/' }, opts || {}));
  box.appendChild(el);
  await Promise.all([...el.querySelectorAll('img')].map(i => i.complete ? 0 : new Promise(r => { i.onload = i.onerror = r; })));
  const textNode = el.querySelector('.cr-text');
  return {
    text: textNode.innerText,
    imgs: [...el.querySelectorAll('img')].map(i => ({ src: i.currentSrc || i.src, w: Math.round(i.getBoundingClientRect().width) })),
    ui: el.querySelectorAll('button, input, select, textarea, a').length,
    tables: el.querySelectorAll('table').length,
    all: el.innerText,
  };
}"""


def sample(cards):
    """30 карточек для глаз: по каждому номеру — с рисунком, с таблицей/программой, слово, обычная."""
    out, seen = [], set()

    def add(c):
        if c and c["id"] not in seen and len(out) < 30:
            seen.add(c["id"]); out.append(c)
    for n in range(1, 11):
        cs = [c for c in cards if c["n"] == n]
        add(next((c for c in cs if c["figs"]), None))
        add(next((c for c in cs if c["table"] and "Паскаль" in json.dumps(c["table"], ensure_ascii=False)), None))
        add(next((c for c in cs if c["table"] and c["id"] not in seen), None))
        add(next((c for c in cs if c["answer"]["fields"][0]["type"] == "word"), None))
    for i, c in enumerate(cards):
        if i % 31 == 0:
            add(c)
    return out


def main():
    errors = []
    from tools.cards import build, validate
    check("1 валидатор зелёный", validate.main([]) == 0)
    with open(os.path.join(HERE, "cards", SLUG + ".json"), encoding="utf-8") as fh:
        data = json.load(fh)
    cards = data["cards"]
    ids = [c["id"] for c in cards]
    check("1 id не повторяются", len(set(ids)) == len(ids))
    check("1 это не пилот (partial нет)", not data.get("partial"))
    rep = open(os.path.join(HERE, "tools", "cards", "reports", SLUG + ".md"), encoding="utf-8").read()
    m = re.search(r"обработано: (\d+) из (\d+)", rep)
    check("1 отчёт: обработано N из M, M по каталогу", bool(m) and int(m.group(1)) == len(cards), rep[:300])
    mods, by_slug = build.families()
    check("1 страницу inf_oge ведёт семья c_inf", by_slug.get(SLUG) and by_slug[SLUG].FAMILY == "c_inf")
    size = os.path.getsize(os.path.join(HERE, "cards", SLUG + ".json"))
    print(f"размер cards/{SLUG}.json: {size / 1048576:.2f} МБ")

    with tempfile.TemporaryDirectory() as tmp:
        r = subprocess.run([sys.executable, os.path.join(HERE, "tools", "cards", "build.py"), "--slug", SLUG, "--out", tmp],
                           cwd=HERE, capture_output=True, text=True, timeout=900)
        check("2 сборка прошла без необработанных", r.returncode == 0, r.stdout[-800:] + r.stderr[-800:])
        a = open(os.path.join(tmp, SLUG + ".json"), "rb").read()
        b = open(os.path.join(HERE, "cards", SLUG + ".json"), "rb").read()
        check("2 свежая сборка = cards/inf_oge.json", a == b)
        ok, why = dircmp_equal(os.path.join(tmp, "img", SLUG), os.path.join(HERE, "cards", "img", SLUG))
        check("2 рисунки свежей сборки = cards/img/inf_oge", ok, why)

    shot_ids = {c["id"] for c in sample(cards)} if SHOTS else set()
    sheets = []
    # свой сервер на свободном порту: на 8960 может стоять сервер другой сессии с другим деревом файлов
    srv, BASE = build.serve()
    with sync_playwright() as p:
        br = p.chromium.launch()
        pg = br.new_page(viewport={"width": 1280, "height": 900})
        pg.on("pageerror", lambda e: errors.append(str(e)))
        pg.goto(f"{BASE}/tools/cards/harness.html")
        pg.wait_for_function("() => window.CardCollect && window.trainerTaskInfo")
        pg.add_script_tag(url=f"{BASE}/card-render.js")
        total = 0
        res = {k: 0 for k in ("same", "ans", "text", "fig", "ui", "code")}
        bad = {k: [] for k in res}
        for n in range(1, 11):
            pg.evaluate("h => CardCollect.open(h)", f"inf_oge.html?n={n}")
            protos = pg.evaluate("n => CardCollect.list(n)", n)
            total += sum(1 for pr in protos for f in pr["fipi"] if f)
            for c in [c for c in cards if c["n"] == n]:
                fid = c["id"][5:]
                r = pg.evaluate("([p, i, n]) => CardCollect.openAt(p, i, n)", [c["proto"], c["pos"], n])
                if r.get("fipi") != fid:
                    bad["same"].append(f"{fid}: openAt дал {r.get('fipi')}")
                    continue
                res["same"] += 1
                live = pg.evaluate(LIVE)
                mine = {k: v for k, v in c["answer"].items() if k != "value"}
                li = dict(live["info"] or {})
                li.pop("hot", None)
                if mine == li:
                    res["ans"] += 1
                else:
                    bad["ans"].append(f"{fid}: ответ {mine} ≠ живой {li}")
                card = pg.evaluate(RENDER, [c, live["width"], {}])
                if squash(live["text"]) == squash(card["text"]):
                    res["text"] += 1
                else:
                    bad["text"].append(f"{fid}:\n   живой:    {squash(live['text'])[:300]}\n   карточка: {squash(card['text'])[:300]}")
                fig_ok = len(live["imgs"]) == len(card["imgs"]) == len(c["figs"])
                for lim, cim in zip(live["imgs"], card["imgs"]):
                    x = urllib.request.urlopen(lim["src"]).read()
                    y = urllib.request.urlopen(cim["src"]).read()
                    if pixels(x) != pixels(y) or abs(lim["w"] - cim["w"]) > 2:
                        fig_ok = False
                        bad["fig"].append(f"{fid}: рисунок {lim} ≠ {cim}")
                res["fig"] += fig_ok
                res["ui"] += card["ui"] == 0 and "Проверить" not in card["all"] and "Источник" not in card["all"] and "<img" not in c["text"]
                # программы: все языки и все строки кода на месте — число таблиц и непустых строк <p>
                lines = lambda h: len([x for x in re.findall(r"<p>(.*?)</p>", h) if x.strip()])
                code_ok = True
                if "Паскаль" in json.dumps(c["table"] or [], ensure_ascii=False):
                    langs = ["Алгоритмический", "Паскаль", "Бейсик", "Python", "C++"]
                    flat = json.dumps(c["table"], ensure_ascii=False)
                    code_ok = all(l in flat for l in langs) and all(l in card["text"] for l in langs)
                    code_ok = code_ok and sum(lines(cell) for t in c["table"] for row in t["rows"] for cell in row) >= 20
                res["code"] += code_ok
                if not code_ok:
                    bad["code"].append(fid)
                if SHOTS and c["id"] in shot_ids:
                    os.makedirs(SHOTS, exist_ok=True)
                    node = pg.evaluate("""() => { const w = document.getElementById('f').contentWindow, e = w.document.getElementById('questionText');
                      [...w.document.querySelectorAll('body *')].forEach(x => { const p = w.getComputedStyle(x).position;
                        if ((p === 'fixed' || p === 'sticky') && !x.contains(e) && !e.contains(x)) x.setAttribute('data-shot-hide', x.style.visibility || '-'), x.style.visibility = 'hidden'; });
                      e.scrollIntoView(); return 1; }""")
                    pg.wait_for_timeout(300)
                    live_png = pg.frame_locator("#f").locator("#questionText").screenshot()
                    card_png = pg.locator("#cardBox").screenshot()
                    pg.evaluate("""() => document.getElementById('f').contentDocument.querySelectorAll('[data-shot-hide]').forEach(x => {
                      const v = x.getAttribute('data-shot-hide'); x.style.visibility = v === '-' ? '' : v; x.removeAttribute('data-shot-hide'); })""")
                    sheets.append((fid, live_png, card_png))
        N = len(cards)
        check(f"1 карточек {N} = заданий ФИПИ по каталогу {total}", N == total == 906, f"{N} / {total}")
        for k, title in (("same", "3 то же задание ФИПИ"), ("ans", "3 ответ = живой"), ("text", "3 текст (код, таблицы) = живой"),
                         ("fig", "4 рисунки файлом, пиксели и ширина те же"), ("ui", "5 без интерфейса и <img>"),
                         ("code", "5 программы: все языки и строки")):
            check(f"{title}: {res[k]} из {N}", res[k] == N, "\n  " + "\n  ".join(bad[k][:6]))
        # 6. рендер с ответом и разбором
        c = next(x for x in cards if x["figs"])
        r = pg.evaluate("""([c]) => { const el = CardRender.render(c, { base: '../../cards/', num: 2, source: true, answer: true, solution: true });
            return { src: (el.querySelector('.cr-src') || {}).textContent, ans: (el.querySelector('.cr-ans') || {}).textContent,
                     sol: (el.querySelector('.cr-sol') || {}).textContent }; }""", [c])
        check("6 рендер: источник, ответ, разбор", c["id"][5:] in (r["src"] or "") and c["answer"]["value"] in (r["ans"] or "") and len(r["sol"] or "") > 20, str(r))
        br.close()
    srv.shutdown()
    if SHOTS and sheets:
        from PIL import Image
        os.makedirs(SHOTS, exist_ok=True)
        ims = [(f, Image.open(io.BytesIO(a)), Image.open(io.BytesIO(b))) for f, a, b in sheets]
        for f, a, b in ims:
            im = Image.new("RGB", (a.width + b.width + 30, max(a.height, b.height)), "white")
            im.paste(a, (0, 0)); im.paste(b, (a.width + 30, 0))
            im.save(os.path.join(SHOTS, f"{SLUG}-{f}.png"))
        print("снимки:", SHOTS, len(ims))
    check("6 нет ошибок JavaScript", not errors, "; ".join(errors[:5]))
    print("готово" if not FAILS else f"ПРОВАЛЕНО: {len(FAILS)}")
    sys.exit(1 if FAILS else 0)


if __name__ == "__main__":
    main()
