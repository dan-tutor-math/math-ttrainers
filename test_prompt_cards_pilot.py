"""
Задача 63, S0: карточки заданий ФИПИ — схема, сборщик, рендерер, пилот.
Пилот — по 10 карточек со страниц трёх форм: ОГЭ №9 (oge9, параметры генератора),
ОГЭ №19 (oge19, готовый текст), ЕГЭ профиль №1 (ege_prof, прототипы с TeX и рисунками).

  1. валидатор tools/cards/validate.py зелёный, в каждом пилотном файле 10 карточек;
  2. свежая сборка (build.py --limit 10 в отдельную папку) совпадает с лежащими
     cards/*.json и рисунками байт в байт — карточки не устарели относительно страниц;
  3. по каждой карточке живое задание открывается тем же openAt и это то же
     задание ФИПИ;
  4. ответ карточки = ответ живого задания (trainerTaskInfo, как у конструктора) —
     kind, поля, номера верных; value — запись для бланка;
  5. видимый текст карточки (CardRender) = видимый текст живого задания без
     интерфейса (кнопки, поле, «Источник», замены UI_TEXT семьи);
  6. формулы те же: TeX из KaTeX живой страницы = TeX в карточке;
  7. рисунок — отдельный файл, пиксели те же, что у картинки на странице,
     ширина на экране та же;
  8. в карточке нет элементов интерфейса (кнопки, поля, select), нет <img>
     в тексте; рендер по опциям: номер, источник, ответ, разбор, печать;
  9. плагины семей: у каждого FAMILY/PAGES/collect/normalize, страницы не
     пересекаются; README описывает интерфейс;
 10. нет ошибок JavaScript.
Снимки «живое | карточка» для сверки глазами — если задана переменная
CARDS_SHOTS=<папка>: туда кладутся <slug>-<ФИПИ>.png и сводный лист <slug>.png.
Запуск: python test_prompt_cards_pilot.py
"""
import filecmp
import importlib
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
# в пилоте остаются страницы, не собранные целиком: oge9 (S1b), ege_prof (S2e) ушли в свои тесты; oge19 — S1a
PILOT = {"oge19": "oge19.html"}
SHOTS = os.environ.get("CARDS_SHOTS")


def check(n, c, x=""):
    print(("[OK] " if c else "[FAIL] ") + n + (f" — {x}" if x and not c else ""))
    if not c:
        FAILS.append(n)


def squash(s):
    return re.sub(r"\s+", "", s or "")


def dircmp_equal(a, b):
    """Папки a и b одинаковы по составу и содержимому (рекурсивно)."""
    d = filecmp.dircmp(a, b)
    if d.left_only or d.right_only or d.diff_files or d.funny_files:
        return False, f"{a}: только тут {d.left_only}, только там {d.right_only}, разные {d.diff_files}"
    _, mism, err = filecmp.cmpfiles(a, b, d.common_files, shallow=False)
    if mism or err:
        return False, f"{a}: разные {mism + err}"
    for sub in d.common_dirs:
        ok, why = dircmp_equal(os.path.join(a, sub), os.path.join(b, sub))
        if not ok:
            return ok, why
    return True, ""


# живой видимый текст узла задания без интерфейса: прячем на миг то, что
# карточка не берёт (те же правила, что у collect.js), читаем innerText, возвращаем
LIVE_TEXT = """(tid) => {
  const el = CardCollect.mainNode(tid);
  const UI = 'button, input, select, textarea, .source-note, .ege-source, .tc-cur, .answer-area, .input-answer-row, .card-btn-row, .manual-note';
  const hid = [...el.querySelectorAll(UI)].map(x => [x, x.style.display]);
  hid.forEach(([x]) => { x.style.display = 'none'; });
  const text = el.innerText;
  const tex = [...el.querySelectorAll('annotation[encoding="application/x-tex"]')].map(a => a.textContent.trim());
  const imgs = [...el.querySelectorAll('img')].filter(i => i.offsetParent !== null).map(i => ({ src: i.currentSrc || i.src, w: Math.round(i.getBoundingClientRect().width) }));
  const width = Math.round(el.getBoundingClientRect().width);
  hid.forEach(([x, d]) => { x.style.display = d; });
  return { text, tex, imgs, width };
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
  if (document.fonts) await document.fonts.ready;
  const textNode = el.querySelector('.cr-text'), opts2 = el.querySelector('.cr-opts');
  return {
    text: textNode.innerText + (opts2 && !textNode.contains(opts2) ? '\\n' + opts2.innerText : ''),
    tex: [...el.querySelectorAll('annotation[encoding="application/x-tex"]')].map(a => a.textContent.trim()),
    imgs: [...el.querySelectorAll('img')].map(i => ({ src: i.currentSrc || i.src, w: Math.round(i.getBoundingClientRect().width), nw: i.naturalWidth })),
    ui: el.querySelectorAll('button, input, select, textarea, a').length,
    all: el.innerText,
  };
}"""


def pixels(data):
    from PIL import Image
    im = Image.open(io.BytesIO(data))
    im.seek(0)
    im = im.convert("RGBA")
    return im.size, im.tobytes()


def main():
    errors = []
    # 1. валидатор
    from tools.cards import validate
    rc = validate.main([])
    check("1 валидатор зелёный", rc == 0)
    cards = {}
    for slug in PILOT:
        with open(os.path.join(HERE, "cards", slug + ".json"), encoding="utf-8") as fh:
            cards[slug] = json.load(fh)
        if slug == "oge19":   # S1a: файл теперь полный (150), полное покрытие — в test_prompt_cards_family_b.py
            check("1 oge19: 150 карточек (полная сборка S1a)", len(cards[slug]["cards"]) == 150)
            cards[slug]["cards"] = cards[slug]["cards"][:10]
            continue
        check(f"1 {slug}: 10 карточек", len(cards[slug]["cards"]) == 10, str(len(cards[slug]["cards"])))
    # 9. плагины
    from tools.cards import build
    mods, by_slug = build.families()
    check("9 у каждой страницы пилота своя семья", all(s in by_slug for s in PILOT), str(sorted(by_slug)))
    check("9 у плагинов FAMILY/PAGES/collect/normalize/UI_TEXT", all(all(hasattr(m, k) for k in ("FAMILY", "PAGES", "collect", "normalize", "UI_TEXT")) for m in mods))
    readme = open(os.path.join(HERE, "tools", "cards", "README.md"), encoding="utf-8").read()
    check("9 README описывает интерфейс плагина", all(w in readme for w in ("collect(page, slug", "normalize(raw)", "Skip", "families/")))
    # 2. свежая сборка = лежащая
    with tempfile.TemporaryDirectory() as tmp:
        # только страницы пилота: у других семей файлы собраны целиком, не --limit 10
        slugs = [a for s in PILOT for a in ("--slug", s)]
        r = subprocess.run([sys.executable, os.path.join(HERE, "tools", "cards", "build.py"), "--limit", "10", "--out", tmp] + slugs,
                           cwd=HERE, capture_output=True, text=True, timeout=600)
        check("2 сборка прошла без необработанных", r.returncode == 0, r.stdout[-800:] + r.stderr[-800:])
        for slug in PILOT:
            if slug == "oge19":
                continue
            a = open(os.path.join(tmp, slug + ".json"), "rb").read()
            b = open(os.path.join(HERE, "cards", slug + ".json"), "rb").read()
            check(f"2 {slug}: свежая сборка = cards/{slug}.json", a == b)
        for slug in PILOT:
            a, b = os.path.join(tmp, "img", slug), os.path.join(HERE, "cards", "img", slug)
            if os.path.isdir(a) or os.path.isdir(b):
                ok, why = dircmp_equal(a, b) if os.path.isdir(a) and os.path.isdir(b) else (False, "папки нет с одной стороны")
                check(f"2 {slug}: рисунки свежей сборки = cards/img/{slug}", ok, why)

    with local_server(), sync_playwright() as p:
        br = p.chromium.launch()
        pg = br.new_page(viewport={"width": 1280, "height": 900})
        pg.on("pageerror", lambda e: errors.append(str(e)))
        pg.goto(f"{BASE}/tools/cards/harness.html")
        pg.wait_for_function("() => window.CardCollect && window.trainerTaskInfo")
        pg.add_script_tag(url=f"{BASE}/card-render.js")
        sheets = {}
        for slug, href in PILOT.items():
            mod = by_slug[slug]
            ui_text = mod.UI_TEXT.get(slug, [])
            meta = pg.evaluate("h => CardCollect.open(h)", href)
            res = {k: 0 for k in ("same", "ans", "text", "tex", "fig", "ui")}
            bad = {k: [] for k in res}
            for c in cards[slug]["cards"]:
                fid = c["id"][5:]
                r = pg.evaluate("([p, i, n]) => CardCollect.openAt(p, i, n)", [c["proto"], c["pos"], meta["n"]])
                if r.get("fipi") == fid:
                    res["same"] += 1
                else:
                    bad["same"].append(f"{fid}: openAt дал {r.get('fipi')}")
                    continue
                el_info = pg.evaluate("t => trainerTaskInfo(document.getElementById('f').contentWindow, t, CardCollect.mainNode(t))", meta["tid"])
                mine = {k: v for k, v in c["answer"].items() if k != "value"}
                el_info.pop("hot", None)
                if mine == el_info:
                    res["ans"] += 1
                else:
                    bad["ans"].append(f"{fid}: ответ {mine} ≠ живой {el_info}")
                live = pg.evaluate(LIVE_TEXT, meta["tid"])
                card = pg.evaluate(RENDER, [c, live["width"], {}])
                lt, ct = live["text"], card["text"]
                for a, b in ui_text:   # (фраза страницы, замена) или ("", фраза только карточки)
                    if a:
                        lt = lt.replace(a, b)
                    else:
                        ct = ct.replace(b, "")
                if squash(lt) == squash(ct):
                    res["text"] += 1
                else:
                    bad["text"].append(f"{fid}: текст\n   живой:    {squash(lt)[:300]}\n   карточка: {squash(ct)[:300]}")
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
                res["ui"] += card["ui"] == 0 and "Проверить" not in card["all"] and "Источник" not in card["all"]
                if SHOTS:
                    os.makedirs(SHOTS, exist_ok=True)
                    # плавающие панели тренажёра (калькулятор, счётчики) перекрывают узел на снимке — прячем на миг
                    node = pg.evaluate("""t => { const e = CardCollect.mainNode(t), w = e.ownerDocument.defaultView;
                      [...e.ownerDocument.querySelectorAll('body *')].forEach(x => { const p = w.getComputedStyle(x).position;
                        const r = x.getBoundingClientRect(), q = e.getBoundingClientRect();
                        const over = p !== 'static' && !x.contains(e) && !e.contains(x) && r.bottom > q.top && r.top < q.bottom && r.right > q.left && r.left < q.right;
                        if ((p === 'fixed' || p === 'sticky' || over) && !x.contains(e) && !e.contains(x)) x.setAttribute('data-shot-hide', x.style.visibility || '-'), x.style.visibility = 'hidden'; });
                      e.scrollIntoView(); return e.id; }""", meta["tid"])
                    pg.wait_for_timeout(400)   # панель задания появляется с анимацией
                    live_png = pg.frame_locator("#f").locator("#" + node).screenshot()
                    card_png = pg.locator("#cardBox").screenshot()
                    pg.evaluate("""() => document.getElementById('f').contentDocument.querySelectorAll('[data-shot-hide]').forEach(x => {
                      const v = x.getAttribute('data-shot-hide'); x.style.visibility = v === '-' ? '' : v; x.removeAttribute('data-shot-hide'); })""")
                    sheets.setdefault(slug, []).append((fid, live_png, card_png))
            for k, title in (("same", "3 то же задание ФИПИ"), ("ans", "4 ответ = живой"), ("text", "5 текст = живой"),
                             ("tex", "6 формулы = живые"), ("fig", "7 рисунки файлом, пиксели и ширина те же"),
                             ("ui", "8 без интерфейса")):
                check(f"{title}: {slug} {res[k]} из 10", res[k] == len(cards[slug]["cards"]), "\n  " + "\n  ".join(bad[k][:6]))
            # value — запись для бланка
            vals = [c["answer"]["value"] for c in cards[slug]["cards"]]
            check(f"4 {slug}: value — запись для бланка (запятая, номера подряд)",
                  all(re.fullmatch(r"-?\d+(,\d+)?", v) for v in vals), str(vals))
        # 8. опции рендера
        with open(os.path.join(HERE, "cards", "ege_prof.json"), encoding="utf-8") as fh:
            c = next(x for x in json.load(fh)["cards"] if x["id"] == "fipi:2933FB")
        r = pg.evaluate("""async ([c]) => { await CardRender.ready(c, { root: '../../' }); const el = CardRender.render(c, { base: '../../cards/', num: 3, source: true, answer: true, solution: true, print: true });
            document.body.appendChild(el); const o = { num: (el.querySelector('.cr-num') || {}).textContent, src: (el.querySelector('.cr-src') || {}).textContent,
            ans: (el.querySelector('.cr-ans') || {}).textContent, sol: !!el.querySelector('.cr-sol .katex'), print: el.classList.contains('cr-print'),
            dollars: /\\$/.test(el.querySelector('.cr-sol').innerText) }; el.remove(); return o; }""", [c])
        check("8 рендер: номер, источник, ответ, разбор с формулами, печать",
              r["num"] == "3." and "2933FB" in (r["src"] or "") and "174" in (r["ans"] or "") and r["sol"] and r["print"] and not r["dollars"], str(r))
        c19 = cards["oge19"]["cards"][3]
        r = pg.evaluate("([c]) => { const el = CardRender.render(c, {}); return [...el.querySelectorAll('[data-opt]')].map(x => x.dataset.opt); }", [c19])
        check("8 варианты №19 с data-opt по порядку", r == ["0", "1", "2"], str(r))
        # №19 как в КИМ: вопрос → утверждения → «В ответ запишите…» (список на месте [[opts]])
        order = []
        for c19 in cards["oge19"]["cards"]:
            order.append(pg.evaluate("""([c]) => { const el = CardRender.render(c, {}); const t = el.querySelector('.cr-text');
                const kids = [...t.children].map(x => x.classList.contains('cr-opts') ? 'opts' : x.textContent.startsWith('В ответ') ? 'tail' : 'q');
                return kids.join(','); }""", [c19]))
        check("8 №19: вопрос, утверждения, затем «В ответ запишите…»", all(o == "q,opts,tail" for o in order), str(order))
        # предпросмотр открывается и рисует все карточки
        for slug in PILOT:
            pv = br.new_page()
            pv.on("pageerror", lambda e: errors.append(str(e)))
            pv.goto(f"{BASE}/tools/cards/preview.html?slug={slug}&answer=1&solution=1")
            pv.wait_for_function("() => document.documentElement.dataset.ready === '1'", timeout=15000)
            n = pv.evaluate("() => document.querySelectorAll('.cr').length")
            check(f"8 preview.html {slug}: {n} карточек", n == (150 if slug == "oge19" else 10))
            pv.close()
        br.close()
    if SHOTS and sheets:
        from PIL import Image
        for slug, rows in sheets.items():
            ims = [(fid, Image.open(io.BytesIO(a)), Image.open(io.BytesIO(b))) for fid, a, b in rows]
            for fid, a, b in ims:
                w = a.width + b.width + 30
                im = Image.new("RGB", (w, max(a.height, b.height)), "white")
                im.paste(a, (0, 0)); im.paste(b, (a.width + 30, 0))
                im.save(os.path.join(SHOTS, f"{slug}-{fid}.png"))
            W = max(a.width + b.width + 30 for _, a, b in ims)
            H = sum(max(a.height, b.height) + 20 for _, a, b in ims)
            sheet = Image.new("RGB", (W, H), "#dddddd")
            y = 0
            for _, a, b in ims:
                sheet.paste(a, (0, y)); sheet.paste(b, (a.width + 30, y))
                y += max(a.height, b.height) + 20
            sheet.save(os.path.join(SHOTS, f"{slug}.png"))
        print("снимки:", SHOTS)
    check("10 нет ошибок JavaScript", not errors, "; ".join(errors[:5]))
    print("готово" if not FAILS else f"ПРОВАЛЕНО: {len(FAILS)}")
    sys.exit(1 if FAILS else 0)


if __name__ == "__main__":
    main()
