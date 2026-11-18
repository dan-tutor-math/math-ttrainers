"""
Задача 61, этап 2 (S4b задачи 63): печать и PDF варианта из карточек ФИПИ.
Карточки — выборка test-files/print-cards/ (длинные условия, дроби, KaTeX с корнем,
таблицы, рисунки PNG и SVG, варианты ответа), вариант собирается из блоков type:'card'
по формату memory/works.md плюс одно задание-снимок из настоящей работы.
  1. Печать: задание-карточка — текстом (div.cr), без картинки-снимка; снимок — картинкой,
     как раньше; номеров заданий столько, сколько заданий; элементов сайта нет;
  2. ничего не обрезано: каждый текст и рисунок внутри своей колонки;
  3. ничего не дублируется: фраза каждой карточки — ровно один раз;
  4. PDF книжный и альбомный через окно «Печать и PDF»: собран вектором
     (WorkPrint.lastPdf.mode), шрифты встроены (FontFile2), символов без шрифта нет;
  5. текст PDF (pdf.js): фразы всех карточек находятся, каждая один раз, конец длинного
     текста на месте, таблица текстом, подписей сайта («Проверить», «Источник») нет;
  6. страниц столько же, сколько листов; размер А4;
  7. нет ошибок JavaScript.
Листы PDF картинками — в /tmp/print_cards/ (или $PRINT_CARDS_OUT): смотреть глазами.
Запуск: python test_prompt_print_cards.py
"""
import base64, json, os, re, sys
from test_prompt15_works_stage1 import BASE, local_server, sync_playwright
from test_prompt_work_live_view import make_work, student

OUT = os.environ.get("PRINT_CARDS_OUT", "/tmp/print_cards")
FIX = "test-files/print-cards/"
FAILS = []
def check(n, c, x=""):
    print(("[OK] " if c else "[FAIL] ") + n + (f" — {x}" if x and not c else ""))
    if not c: FAILS.append(n)

# фраза каждой карточки — встречается в варианте ровно один раз
PHRASES = {
    "fipi:4F57B2": "Найдите корень уравнения",
    "fipi:45B944": "Диагональ трапеции делит её на два равных треугольника",
    "fipi:2933FB": "внешний",
    "fipi:84E9F2": "касается окружности с центром",
    "fipi:F2EFEB": "Шины какой наибольшей ширины можно устанавливать",
    "fipi:B2024C": "На сколько процентов увеличится пробег автомобиля",
    "fipi:760E4B": "Катеты прямоугольного треугольника равны 8 и 15",
    "fipi:86F9F5": "sin ∠ABC",
    "fipi:60DA89": "отмечено на числовой прямой точкой",
    "fipi:4BCAFD": "Решите уравнение",
    "fipi:ABF846": "Установите соответствие между пунктуационными правилами",
    "fipi:078075": "Ксения Андреевна шагнула вперёд и прикрыла собой ребят",
}
END_OF_LONG = "Выпишите это слово"          # последняя фраза самого длинного условия
TABLE_CELL = "235/55; 235/50"                # ячейка таблицы ОГЭ №1–5

def card_blocks():
    out = []
    for slug in ["oge9", "oge19", "ege_prof", "oge1_5", "oge15_18", "oge7", "oge_part2", "rus_oge"]:
        d = json.load(open(FIX + slug + ".json", encoding="utf-8"))
        for c in d["cards"]:
            t = {k: v for k, v in c["answer"].items() if k != "value"}
            out.append({"id": "c" + c["id"][5:], "type": "card", "card": c["id"], "slug": slug, "href": slug + ".html",
                        "tid": slug, "mode": "fipi", "name": "Задание " + c["id"], "task": t, "tkey": "fipi:" + d["exam"] + ":" + c["id"][5:],
                        "series": {"key": slug, "pos": c["pos"], "proto": c["proto"], "n": c["n"], "fipi": c["id"][5:], "total": 1}})
    return out

norm = lambda s: re.sub(r"\s+", " ", s or "")

PDF_TEXT = """async b64 => {
  const lib = await MathhLibs.load('pdfjs');
  lib.GlobalWorkerOptions.workerSrc = 'pdf.worker.min.js';
  const raw = Uint8Array.from(atob(b64), c => c.charCodeAt(0));
  const doc = await lib.getDocument({ data: raw }).promise;
  const pages = [], pngs = [];
  for (let i = 1; i <= doc.numPages; i++) {
    const p = await doc.getPage(i);
    const tc = await p.getTextContent();
    pages.push({ text: tc.items.map(x => x.str + (x.hasEOL ? '\\n' : '')).join(''), w: p.view[2], h: p.view[3] });
    const vp = p.getViewport({ scale: 1.6 });
    const cv = document.createElement('canvas'); cv.width = vp.width; cv.height = vp.height;
    await p.render({ canvasContext: cv.getContext('2d'), viewport: vp }).promise;
    pngs.push(cv.toDataURL('image/png').split(',')[1]);
  }
  return { pages, pngs };
}"""

def main():
    os.makedirs(OUT, exist_ok=True)
    errors = []
    with local_server(), sync_playwright() as p:
        b = p.chromium.launch()
        link = make_work(b)
        ctx, sp = student(b, link, errors, "уч", {"width": 1280, "height": 900}, False)
        sp.evaluate("() => { window.__printed = 0; window.print = () => { window.__printed++; }; }")
        sp.evaluate("([fix, cards]) => { WorkPrint.cardBase = fix; window.__cards = cards; }", [FIX, card_blocks()])
        # вариант: карточки + одно задание-снимок из настоящей работы
        mkwork = "() => ({ title: 'Вариант из карточек', variants: [{ num: 1, blocks: window.__cards.concat([window.__work.S.blocks[0]]) }] })"
        n_tasks = len(PHRASES) + 1

        # 1–3: печать
        sp.evaluate("mk => WorkPrint.ask(eval(mk), { student: true })", mkwork)
        sp.wait_for_selector("#wpDlg"); sp.check("input[name=wpOri][value=portrait]"); sp.click("#wpGo")
        sp.wait_for_function("() => window.__printed === 1", timeout=30000)
        d = sp.evaluate("""() => { const R = document.getElementById('wpPrint'); const sh = [...R.querySelectorAll('.wp-sheet.wp-tasks')];
          const bad = [];
          sh.forEach((s, si) => s.querySelectorAll('.wp-col').forEach(col => {
            const c = col.getBoundingClientRect();
            const w = document.createTreeWalker(col, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT);
            let n; const rg = document.createRange();
            while ((n = w.nextNode())) {
              let rs = [];
              if (n.nodeType === 3) { if (!/\\S/.test(n.data) || n.parentElement.closest('.katex-mathml')) continue; rg.selectNodeContents(n); rs = [...rg.getClientRects()]; }
              else if (n.tagName === 'IMG') rs = [n.getBoundingClientRect()];
              rs.forEach(r => { if (r.width && (r.bottom > c.bottom + 1 || r.top < c.top - 1 || r.right > c.right + 2)) bad.push(si + ': ' + (n.data || n.src || '').slice(0, 40)); });
            }
          }));
          return { sheets: sh.length, nums: [...R.querySelectorAll('.wp-task:not(.wp-cont) > .wp-n')].map(x => x.textContent),
            cards: R.querySelectorAll('.wp-task .cr').length, cardIds: [...new Set([...R.querySelectorAll('.cr[data-card]')].map(x => x.dataset.card))].length,
            snapImgs: [...R.querySelectorAll('.wp-task:not(.wp-card) .wp-body > img')].length, cardSnap: R.querySelectorAll('.wp-card .wp-body > img').length,
            tex: [...R.querySelectorAll('.cr')].some(x => /\\$/.test(x.textContent)), katex: R.querySelectorAll('.cr .katex').length,
            ctl: [...R.querySelectorAll('button, input, select, textarea')].length, noCard: R.querySelectorAll('.wp-card .wp-noimg').length,
            text: [...R.querySelectorAll('.wp-sheet')].map(s => s.innerText).join('\\n'), bad }; }""")
        check("1 номера заданий 1…N по порядку", d["nums"] == [str(i + 1) for i in range(n_tasks)], str(d["nums"]))
        check("1 карточки — текстом: все %d нашлись, снимков у карточек нет" % len(PHRASES), d["cardIds"] == len(PHRASES) and d["cardSnap"] == 0 and d["noCard"] == 0, str({k: d[k] for k in ("cardIds", "cardSnap", "noCard")}))
        check("1 формулы TeX свёрстаны KaTeX (нет «$»)", d["katex"] > 5 and not d["tex"], str((d["katex"], d["tex"])))
        check("1 задание-снимок — картинкой, как раньше", d["snapImgs"] == 1, str(d["snapImgs"]))
        check("1 элементов управления сайта нет", d["ctl"] == 0, str(d["ctl"]))
        check("2 ничего не обрезано: текст и рисунки внутри колонок", not d["bad"], "; ".join(d["bad"][:5]))
        t = norm(d["text"])
        dup = {k: t.count(v) for k, v in PHRASES.items() if t.count(v) != 1}
        check("3 каждая карточка ровно один раз", not dup, str(dup))
        check("3 конец длинного условия на месте", END_OF_LONG in t)
        sp.evaluate("() => { document.getElementById('wpPrint').innerHTML = ''; document.body.classList.remove('wp-on'); }")

        # 4–6: PDF
        for orient, size in (("portrait", (595, 842)), ("landscape", (842, 595))):
            tag = "книжный" if orient == "portrait" else "альбомный"
            sp.evaluate("mk => WorkPrint.ask(eval(mk), { student: true })", mkwork)
            sp.wait_for_selector("#wpDlg"); sp.check(f"input[name=wpOri][value={orient}]")
            with sp.expect_download(timeout=120000) as dl: sp.click("#wpPdf")
            path = os.path.join(OUT, f"cards_{orient}.pdf"); dl.value.save_as(path)
            raw = open(path, "rb").read()
            lp = sp.evaluate("WorkPrint.lastPdf")
            check(f"4 PDF {tag}: вектором", lp and lp.get("mode") == "vector", str(lp))
            check(f"4 PDF {tag}: шрифты встроены, символов без шрифта нет", b"/FontFile2" in raw and lp and lp.get("missing") == [], str(lp and lp.get("missing")))
            r = sp.evaluate(PDF_TEXT, base64.b64encode(raw).decode())
            for i, png in enumerate(r["pngs"]):
                open(os.path.join(OUT, f"{orient}_{i + 1}.png"), "wb").write(base64.b64decode(png))
            pt = norm(" ".join(x["text"] for x in r["pages"]))
            miss = [v for v in PHRASES.values() if v not in pt]
            dup = {v: pt.count(v) for v in PHRASES.values() if pt.count(v) > 1}
            check(f"5 PDF {tag}: текст карточек ищется ({len(PHRASES)} фраз)", not miss, str(miss))
            check(f"5 PDF {tag}: без повторов", not dup, str(dup))
            check(f"5 PDF {tag}: конец длинного условия и таблица текстом", END_OF_LONG in pt and TABLE_CELL in pt)
            check(f"5 PDF {tag}: подписей сайта нет", not any(x in pt for x in ["Проверить", "Источник", "Сдать работу"]))
            check(f"6 PDF {tag}: страниц = листов ({lp and lp.get('sheets')})", lp and len(r["pages"]) == lp.get("sheets") == lp.get("pages"), str(len(r["pages"])))
            check(f"6 PDF {tag}: А4 {size[0]}×{size[1]}", all(abs(x["w"] - size[0]) <= 2 and abs(x["h"] - size[1]) <= 2 for x in r["pages"]), str([(x["w"], x["h"]) for x in r["pages"]][:3]))
        check("7 нет ошибок JavaScript", not errors, "; ".join(errors[:5]))
        b.close()
    print("Листы PDF картинками: " + OUT)
    print("\n" + ("ВСЁ ПРОШЛО" if not FAILS else "НЕ ПРОШЛО: " + ", ".join(FAILS)))
    sys.exit(1 if FAILS else 0)
if __name__ == "__main__": main()
