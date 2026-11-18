"""
Задача 63, S1b: карточки ФИПИ семьи a_simple — ОГЭ №6, 7, 8, 9, 14 целиком
(cards/oge6|7|8|9|14.json, рисунки cards/img/oge7/).

  1. валидатор tools/cards/validate.py зелёный;
  2. по каждой странице «обработано N из M»: N = M = число заданий каталога страницы,
     карточки без `partial`, каждое задание банка ФИПИ — ровно одна карточка;
  3. ответ карточки = ans банка у ВСЕХ карточек (скриптом: поле — число, choice — номер);
  4. свежая сборка семьи (build.py --family a_simple в отдельную папку) совпадает с
     лежащими cards/*.json и cards/img/oge7 байт в байт — карточки не устарели;
  5. выборка по 20 карточек на страницу (разные прототипы, равный шаг) совпадает с живым
     заданием: тот же openAt, ответ = trainerTaskInfo, видимый текст (с вариантами
     ответа №7), формулы TeX, разбор (explain страницы), число рисунков; у №7 числовая
     прямая — svg: те же подписи и места точек, что у div страницы;
  6. в карточке нет интерфейса, а рендер рисует рисунок и все варианты;
  7. нет ошибок JavaScript.
Время сборки каждой страницы и размер json — в отчётах tools/cards/reports/<slug>.md
(печатаются в конце). Запуск: python test_prompt_cards_family_a_simple.py
"""
import json
import os
import re
import subprocess
import sys
import tempfile

from test_prompt15_works_stage1 import BASE, local_server, sync_playwright
from test_prompt_cards_pilot import RENDER, dircmp_equal, squash

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
SLUGS = ["oge6", "oge7", "oge8", "oge9", "oge14"]
BANK_VAR = {"oge6": "OGE6_FIPI", "oge7": "OGE7_FIPI", "oge8": "OGE8_FIPI", "oge9": "OGE9_FIPI", "oge14": "OGE14_FIPI"}
SAMPLE = 20
FAILS = []


def check(n, c, x=""):
    print(("[OK] " if c else "[FAIL] ") + n + (f" — {x}" if x and not c else ""))
    if not c:
        FAILS.append(n)


def load_bank(slug):
    s = open(os.path.join(HERE, f"{slug}-fipi-bank.js"), encoding="utf-8").read()
    return json.loads(s[s.index("{"):s.rindex("}") + 1])["tasks"]


# видимый текст живого узла без интерфейса; у №7 числовая прямая — не текст (в карточке рисунок),
# варианты ответа — кнопки, их текст добавляется отдельно
LIVE_TEXT = """(tid) => {
  const el = CardCollect.mainNode(tid);
  const UI = 'button, input, select, textarea, .source-note, .ege-source, .tc-cur, .answer-area, .input-answer-row, .card-btn-row, .manual-note, .numline-wrap, .options-hint';
  const hid = [...el.querySelectorAll(UI)].map(x => [x, x.style.display]);
  hid.forEach(([x]) => { x.style.display = 'none'; });
  let text = el.innerText;
  const tex = [...el.querySelectorAll('annotation[encoding="application/x-tex"]')].map(a => a.textContent.trim());
  hid.forEach(([x, d]) => { x.style.display = d; });
  const opts = [...el.querySelectorAll('#mcqOptions .mcq-btn')];
  const optTex = opts.flatMap(b => [...b.querySelectorAll('annotation[encoding="application/x-tex"]')].map(a => a.textContent.trim()));
  const optText = opts.map(b => b.innerText).join('\\n');
  const nl = el.querySelector('.numline');
  const numline = nl ? { ticks: [...nl.querySelectorAll('.nl-tick')].map(t => [parseFloat(t.style.left) / 100, (t.querySelector('.nl-ticklabel') || {}).textContent || '']),
    pts: [...nl.querySelectorAll('.nl-point')].map(t => [parseFloat(t.style.left) / 100, (t.querySelector('.nl-plabel') || {}).textContent || '']),
    w: Math.round(nl.getBoundingClientRect().width) } : null;
  const w = el.ownerDocument.defaultView;
  const sol = w.eval('(typeof curTask !== "undefined" && curTask && curTask.explain) || ""');
  const box = document.createElement('div');
  box.style.cssText = 'position:absolute;left:0;top:3000px;width:600px';
  box.innerHTML = sol; document.body.appendChild(box);
  const solText = box.innerText; const solTex = [...box.querySelectorAll('annotation[encoding="application/x-tex"]')].map(a => a.textContent.trim());
  box.remove();
  return { text: text + '\\n' + optText, tex: tex, imgs: el.querySelectorAll('img, canvas, svg').length, numline, solText, solTex,
           width: Math.round(el.getBoundingClientRect().width) };
}"""

RENDER_SOL = """async ([card, width]) => {
  await CardRender.ready(card, { root: '../../' });
  const box = document.createElement('div');
  box.style.cssText = 'position:absolute;left:0;top:5000px;width:' + width + 'px';
  const el = CardRender.render(card, { base: '../../cards/', solution: true, answer: true });
  box.appendChild(el); document.body.appendChild(box);
  const s = el.querySelector('.cr-sol');
  const r = { solText: s ? s.innerText.replace(/^\\s*Решение\\s*/, '') : '', solTex: s ? [...s.querySelectorAll('annotation[encoding="application/x-tex"]')].map(a => a.textContent.trim()) : [],
              ans: (el.querySelector('.cr-ans') || {}).textContent || '', nopts: el.querySelectorAll('[data-opt]').length,
              imgs: [...el.querySelectorAll('img')].map(i => ({ ok: i.complete && i.naturalWidth > 0 })) };
  box.remove();
  return r;
}"""


def sample(cards, k):
    """k карточек через равный шаг по списку, отсортированному по прототипу (все виды заданий)."""
    cs = sorted(cards, key=lambda c: (c["proto"], c["pos"]))
    if len(cs) <= k:
        return cs
    return [cs[int(i * len(cs) / k)] for i in range(k)]


def main():
    errors = []
    from tools.cards import validate
    check("1 валидатор зелёный", validate.main([]) == 0)

    cards, banks = {}, {}
    for s in SLUGS:
        cards[s] = json.load(open(os.path.join(HERE, "cards", s + ".json"), encoding="utf-8"))
        banks[s] = load_bank(s)
    # 2. обработано N из M
    for s in SLUGS:
        d, bank = cards[s], banks[s]
        ids = [c["id"][5:] for c in d["cards"]]
        check(f"2 {s}: обработано {len(ids)} из {len(bank)} (банк)", len(ids) == len(bank) and set(ids) == {t["fipi"] for t in bank} and len(set(ids)) == len(ids))
        check(f"2 {s}: файл целый (не --limit)", not d.get("partial"))
        rep = open(os.path.join(HERE, "tools", "cards", "reports", s + ".md"), encoding="utf-8").read()
        m = re.search(r"заданий ФИПИ на странице по каталогу: (\d+)", rep)
        o = re.search(r"обработано: (\d+) из (\d+)", rep)
        check(f"2 {s}: отчёт «обработано {len(ids)} из {len(ids)}», на странице {len(bank)}",
              bool(m and o) and int(m.group(1)) == len(bank) and int(o.group(1)) == int(o.group(2)) == len(ids) and "не обработано: 0" in rep)
    # 3. ответ = ans банка
    for s in SLUGS:
        ans = {t["fipi"]: t["ans"] for t in banks[s]}
        bad = []
        for c in cards[s]["cards"]:
            a, b = c["answer"], ans[c["id"][5:]]
            if a["kind"] == "choice":
                ok = a["correct"] + 1 == int(b) and a["value"] == str(int(b))
            else:
                ok = len(a["fields"]) == 1 and abs(float(a["fields"][0]["value"]) - float(b)) < 1e-9 \
                    and float(a["value"].replace(",", ".")) == float(b)
            if not ok:
                bad.append(f"{c['id']}: {a} ≠ банк {b}")
        check(f"3 {s}: ответ = ans банка у всех {len(ans)}", not bad, "\n  " + "\n  ".join(bad[:5]))
    # 4. свежая сборка = лежащая
    with tempfile.TemporaryDirectory() as tmp:
        r = subprocess.run([sys.executable, os.path.join(HERE, "tools", "cards", "build.py"), "--family", "a_simple", "--out", tmp],
                           cwd=HERE, capture_output=True, text=True, timeout=900)
        check("4 сборка семьи без необработанных", r.returncode == 0, r.stdout[-800:] + r.stderr[-800:])
        for s in SLUGS:
            a = open(os.path.join(tmp, s + ".json"), "rb").read()
            b = open(os.path.join(HERE, "cards", s + ".json"), "rb").read()
            check(f"4 {s}: свежая сборка = cards/{s}.json", a == b)
        ok, why = dircmp_equal(os.path.join(tmp, "img", "oge7"), os.path.join(HERE, "cards", "img", "oge7"))
        check("4 рисунки №7 свежей сборки = cards/img/oge7", ok, why)
        check("4 рисунков только у №7", sorted(os.listdir(os.path.join(tmp, "img"))) == ["oge7"], str(os.listdir(os.path.join(tmp, "img"))))

    # 5–6. выборка с живыми заданиями
    with local_server(), sync_playwright() as p:
        br = p.chromium.launch()
        pg = br.new_page(viewport={"width": 1280, "height": 900})
        pg.on("pageerror", lambda e: errors.append(str(e)))
        pg.goto(f"{BASE}/tools/cards/harness.html")
        pg.wait_for_function("() => window.CardCollect && window.trainerTaskInfo")
        pg.add_script_tag(url=f"{BASE}/card-render.js")
        for s in SLUGS:
            meta = pg.evaluate("h => CardCollect.open(h)", s + ".html")
            sm = sample(cards[s]["cards"], SAMPLE)
            res = {k: 0 for k in ("same", "ans", "text", "tex", "sol", "fig", "ui")}
            bad = {k: [] for k in res}
            for c in sm:
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
                    bad["ans"].append(f"{fid}: {mine} ≠ живой {info}")
                live = pg.evaluate(LIVE_TEXT, meta["tid"])
                card = pg.evaluate(RENDER, [c, live["width"], {}])
                if squash(live["text"]) == squash(card["text"]):
                    res["text"] += 1
                else:
                    bad["text"].append(f"{fid}:\n   живой:    {squash(live['text'])[:300]}\n   карточка: {squash(card['text'])[:300]}")
                if live["tex"] == card["tex"]:
                    res["tex"] += 1
                else:
                    bad["tex"].append(f"{fid}: {live['tex']} ≠ {card['tex']}")
                cs = pg.evaluate(RENDER_SOL, [c, live["width"]])
                if squash(live["solText"]) == squash(cs["solText"]) and live["solTex"] == cs["solTex"] and live["solText"]:
                    res["sol"] += 1
                else:
                    bad["sol"].append(f"{fid}: разбор\n   живой:    {squash(live['solText'])[:200]}\n   карточка: {squash(cs['solText'])[:200]}")
                # рисунок: у живого — числовая прямая div (№7) или ничего; у карточки — svg-файл
                fig_ok = True
                nl = live["numline"]
                if nl is None:
                    fig_ok = not c["figs"] and not card["imgs"]
                else:
                    fig_ok = len(c["figs"]) == 1 and len(card["imgs"]) == 1 and card["imgs"][0]["nw"] > 0 and cs["imgs"][0]["ok"]
                    if fig_ok:
                        svg = open(os.path.join(HERE, "cards", c["figs"][0]["file"]), encoding="utf-8").read()
                        M, W = 8, nl["w"] + 16
                        L = W - 2 * M
                        texts = re.findall(r'<text x="([\d.]+)"[^>]*>([^<]*)</text>', svg)
                        got = sorted((round((float(x) - M) / L, 2), t) for x, t in texts)
                        want = sorted((round(x, 2), t) for x, t in nl["ticks"] + nl["pts"] if t)
                        fig_ok = got == want and f'viewBox="0 0 {W} 84"' in svg
                        if not fig_ok:
                            bad["fig"].append(f"{fid}: подписи {got} ≠ {want}")
                if fig_ok:
                    res["fig"] += 1
                elif not bad["fig"]:
                    bad["fig"].append(f"{fid}: рисунков {len(c['figs'])}, живых {live['imgs']}")
                mcq_ok = (c["opts"] is None) or cs["nopts"] == len(c["opts"]) == c["answer"]["n"]
                res["ui"] += card["ui"] == 0 and mcq_ok and "Проверить" not in card["all"] and "Источник" not in card["all"]
                if not (card["ui"] == 0 and mcq_ok):
                    bad["ui"].append(fid)
            n = len(sm)
            for k, title in (("same", "5 то же задание ФИПИ"), ("ans", "5 ответ = живой"), ("text", "5 текст (с вариантами) = живой"),
                             ("tex", "5 формулы = живые"), ("sol", "5 разбор = explain страницы"), ("fig", "5 рисунок = живой"),
                             ("ui", "6 без интерфейса, варианты на месте")):
                check(f"{title}: {s} {res[k]} из {n}", res[k] == n, "\n  " + "\n  ".join(bad[k][:5]))
        # 6. все карточки №7 рисуются без ошибок, рисунок грузится
        r = pg.evaluate("""async (cs) => { let bad = []; for (const c of cs) { await CardRender.ready(c, { root: '../../' });
            const el = CardRender.render(c, { base: '../../cards/', solution: true, answer: true }); document.body.appendChild(el);
            await Promise.all([...el.querySelectorAll('img')].map(i => i.complete ? 0 : new Promise(r => { i.onload = i.onerror = r; })));
            const imgs = [...el.querySelectorAll('img')]; if (imgs.length !== c.figs.length || imgs.some(i => !i.naturalWidth) || el.querySelectorAll('[data-opt]').length !== c.opts.length) bad.push(c.id); el.remove(); }
            return bad; }""", cards["oge7"]["cards"])
        check("6 №7: все 182 карточки рисуются, рисунок загружен, варианты на месте", r == [], str(r[:5]))
        br.close()
    # итог: время и размер
    for s in SLUGS:
        rep = open(os.path.join(HERE, "tools", "cards", "reports", s + ".md"), encoding="utf-8").read()
        t = re.search(r"время сборки: ([\d.]+) с", rep).group(1)
        size = os.path.getsize(os.path.join(HERE, "cards", s + ".json")) / 1024
        print(f"  {s}: {len(cards[s]['cards'])} карточек, сборка {t} с, {s}.json {size:.0f} КБ")
    check("7 нет ошибок JavaScript", not errors, "; ".join(errors[:5]))
    print("готово" if not FAILS else f"ПРОВАЛЕНО: {len(FAILS)}")
    sys.exit(1 if FAILS else 0)


if __name__ == "__main__":
    main()
