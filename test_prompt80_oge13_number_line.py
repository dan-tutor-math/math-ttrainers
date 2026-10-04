"""
Промпт №80: ОГЭ №13, «Система неравенств тип 3» — ответ рисунком на прямой.

Прототип из открытого банка (решу ОГЭ): система двух линейных неравенств,
варианты ответа — рисунки множества решений на координатной прямой (и
иногда «система не имеет решений»).

Проверяет:
  1. тип есть в группе «Системы неравенств» сразу после типа 2, попадает в
     «Случайно», стрелки «тип» проходят через него;
  2. 3000 сгенерированных заданий: тест САМ разбирает строки системы из
     текста условия (не из данных генератора), решает каждое неравенство и
     сверяет: верный вариант изображает ровно множество решений, ни один
     неверный — нет, все четыре варианта разные, подписи точек — границы,
     выколотые точки — у строгих неравенств, «рисунок N» в разборе — номер
     верного варианта; встречаются все формы ответа, дроби, десятичные,
     отрицательный коэффициент, строгие и нестрогие;
  3. рисунок: у дробной границы подпись вертикальная (числитель над
     знаменателем), выколотых кружков столько, сколько строгих границ на
     рисунке, прямая под выколотой точкой разорвана;
  4. интерфейс: неверный вариант — ошибка, «Изменить ответ», верный —
     засчитан, разбор с вертикальной дробью; на телефоне (390 px) ничего не
     вылезает за экран;
  5. задание — чистые данные: снимок сессии (JSON) на второй странице
     рисует те же условие и варианты; «Подборка» уносит условие (рисунки
     она вырезает у всех тренажёров — так устроен basket-core.js).

Совместный режим здесь без сети: живьём (вебсокет к Supabase) его нужно
перепроверять на сайте руками.

Запуск: python3 test_prompt80_oge13_number_line.py (сервер поднимается сам).
"""
import contextlib
import http.client
import json
import os
import re
import subprocess
import sys
import time
from fractions import Fraction

from playwright.sync_api import sync_playwright

PORT = 8962
BASE = f"http://127.0.0.1:{PORT}"
HERE = os.path.dirname(os.path.abspath(__file__))


@contextlib.contextmanager
def local_server():
    proc = subprocess.Popen(
        [sys.executable, "-m", "http.server", str(PORT)], cwd=HERE,
        stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL,
    )
    try:
        for _ in range(50):
            try:
                conn = http.client.HTTPConnection("127.0.0.1", PORT, timeout=0.2)
                conn.request("GET", "/index.html")
                conn.getresponse()
                break
            except Exception:
                time.sleep(0.1)
        else:
            raise RuntimeError("локальный сервер не поднялся")
        yield
    finally:
        proc.terminate()
        proc.wait(timeout=5)


results = []


def check(name, ok, extra=""):
    results.append((name, ok))
    print(f"[{'OK' if ok else 'FAIL'}] {name}" + (f": {extra}" if extra and not ok else ""))


def new_page(browser, url, width=1300):
    ctx = browser.new_context(viewport={"width": width, "height": 1000})
    page = ctx.new_page()
    errors = []
    page.on("pageerror", lambda e: errors.append(str(e)))
    page.route("https://**/*", lambda route: route.abort())
    page.goto(url)
    page.wait_for_timeout(900)
    return ctx, page, errors


# ─── независимое решение: строка условия → множество решений ───

def num(s):
    return Fraction(s.replace("−", "-").replace(",", "."))


def parse_side(expr):
    """«7 − 3x», «−35 + 5x», «5x + 13», «x», «−x» → (a, k) для a·x + k."""
    e = expr.replace("−", "-").replace(" ", "")
    terms = re.findall(r"[+-]?[^+-]+", e)
    a, k = Fraction(0), Fraction(0)
    for t in terms:
        if t.endswith("x"):
            c = t[:-1]
            a += Fraction(-1) if c == "-" else Fraction(1) if c in ("", "+") else num(c)
        else:
            k += num(t)
    return a, k


def solve_line(line):
    """«7 − 3x ≤ 1,» → ('≥', 2): x rel bound."""
    line = line.strip().rstrip(",.")
    m = re.match(r"^(.*?)\s*(≤|≥|<|>)\s*(\S+)$", line)
    assert m, line
    a, k = parse_side(m.group(1))
    c = num(m.group(3))
    assert a != 0, line
    rel = m.group(2)
    if a < 0:
        rel = {"<": ">", ">": "<", "≤": "≥", "≥": "≤"}[rel]
    return rel, (c - k) / a


def intersect(rels):
    """Пересечение лучей → (lo, lo_open, hi, hi_open) или None; None-границы — бесконечность."""
    lo = lo_open = hi = hi_open = None
    for rel, b in rels:
        if rel in (">", "≥"):
            op = rel == ">"
            if lo is None or b > lo or (b == lo and op):
                lo, lo_open = b, op
        else:
            op = rel == "<"
            if hi is None or b < hi or (b == hi and op):
                hi, hi_open = b, op
    if lo is not None and hi is not None and (lo > hi or (lo == hi and (lo_open or hi_open))):
        return None
    return (lo, lo_open, hi, hi_open)


def label_val(label):
    if "/" in label:
        p, q = label.split("/")
        return num(p) / int(q)
    return num(label)


def desc_set(d, meta):
    """Какое множество изображает рисунок-описание (segSwap — не множество)."""
    lo = (label_val(meta["lo"]["label"]), meta["lo"]["open"])
    hi = (label_val(meta["hi"]["label"]), meta["hi"]["open"])
    return {
        "seg": (lo[0], lo[1], hi[0], hi[1]),
        "rayRlo": (lo[0], lo[1], None, None),
        "rayRhi": (hi[0], hi[1], None, None),
        "rayLlo": (None, None, lo[0], lo[1]),
        "rayLhi": (None, None, hi[0], hi[1]),
        "none": None,
        "outer": "outer",
        "segSwap": "swap",
    }[d]


def test_registry(browser):
    ctx, page, errors = new_page(browser, f"{BASE}/oge13.html")
    groups = page.evaluate("GROUPS.map(g => [g.title, g.modes.map(m => m.id)])")
    sysg = [g for g in groups if g[0] == "Системы неравенств"]
    check("тип 3 в группе «Системы неравенств» после типа 2", sysg and sysg[0][1] == ["S1", "S2", "S3"], str(groups))
    check("тип 3 попадает в «Случайно»", page.evaluate("RANDOM_MODES.some(m => m.id === 'S3')"))
    card = page.query_selector('.mode-card[data-id="S3"]')
    check("карточка типа на экране выбора", card is not None and "Система неравенств тип 3" in card.inner_text())
    page.click('.mode-card[data-id="S2"]')
    page.wait_for_timeout(300)
    page.click('#nextTypeBtn')
    page.wait_for_timeout(300)
    check("«Следующий тип» из типа 2 ведёт в тип 3",
          page.evaluate("curMode") == "S3" and page.inner_text('#taskTitle') == "Система неравенств тип 3")
    check("без ошибок JS (реестр)", not errors, str(errors[:1]))
    ctx.close()


def test_generator(browser):
    ctx, page, errors = new_page(browser, f"{BASE}/oge13.html")
    tasks = page.evaluate("""() => {
      const box = document.createElement('div');
      document.body.appendChild(box);
      return Array.from({length: 3000}, () => {
        const t = gen_S3();
        box.innerHTML = t.prompt;
        const lines = [...box.querySelectorAll('.sys-line')].map(e => e.textContent);
        const pics = t.options.map(o => {
          box.innerHTML = o;
          const svg = box.querySelector('svg');
          if (!svg) return { text: box.textContent };
          return { open: svg.querySelectorAll('circle[fill="none"]').length,
                   dots: svg.querySelectorAll('circle').length,
                   texts: [...svg.querySelectorAll('text')].map(e => e.textContent) };
        });
        box.innerHTML = '';
        return { lines, pics, opts: t.options, ci: t.correctIndex, explain: t.explain, meta: t.meta };
      });
    }""")
    bad_answer, bad_distr, bad_bounds, bad_dots, bad_num, dup, bad_lines = [], [], [], [], [], [], []
    shapes, kinds, neg, strict_mix = set(), set(), 0, set()
    for t in tasks:
        meta = t["meta"]
        if len(t["lines"]) != 2:
            bad_lines.append(t["lines"])
            continue
        rels = [solve_line(l) for l in t["lines"]]
        truth = intersect(rels)
        descs = meta["descs"]
        # верный рисунок — ровно множество решений, неверные — нет
        if desc_set(descs[t["ci"]], meta) != truth:
            bad_answer.append((t["lines"], descs, t["ci"], meta["lo"], meta["hi"]))
        for i, d in enumerate(descs):
            if i != t["ci"] and desc_set(d, meta) == truth:
                bad_distr.append((t["lines"], d))
        # подписи точек — те самые границы, выколотые — у строгих
        bounds = sorted(rels, key=lambda r: r[1])
        lo_ok = label_val(meta["lo"]["label"]) == bounds[0][1] and meta["lo"]["open"] == (bounds[0][0] in "<>")
        hi_ok = label_val(meta["hi"]["label"]) == bounds[1][1] and meta["hi"]["open"] == (bounds[1][0] in "<>")
        if not (lo_ok and hi_ok) or bounds[0][1] == bounds[1][1]:
            bad_bounds.append((t["lines"], meta["lo"], meta["hi"]))
        # кружки на рисунке: сколько точек и сколько из них выколотых
        for d, pic in zip(descs, t["pics"]):
            if d == "none":
                if pic.get("text") != "система не имеет решений":
                    bad_dots.append((d, pic))
                continue
            pts = {"seg": ["lo", "hi"], "segSwap": ["lo", "hi"], "outer": ["lo", "hi"],
                   "rayRlo": ["lo"], "rayLlo": ["lo"], "rayRhi": ["hi"], "rayLhi": ["hi"]}[d]
            if pic["dots"] != len(pts) or pic["open"] != sum(meta[p]["open"] for p in pts):
                bad_dots.append((d, pic, meta["lo"], meta["hi"]))
        if len(set(t["opts"])) != 4:
            dup.append(descs)
        word = "вариант" if descs[t["ci"]] == "none" else "рисунок"
        if not t["explain"].rstrip().endswith(f"Это {word} {t['ci'] + 1}."):
            bad_num.append(t["explain"][-40:])
        shapes.add(meta["shape"])
        for b in (meta["lo"], meta["hi"]):
            kinds.add("frac" if "/" in b["label"] else "dec" if "," in b["label"] else "int")
        if any(parse_side(re.split(r"[≤≥<>]", l)[0])[0] < 0 for l in t["lines"]):
            neg += 1
        strict_mix.add(tuple(sorted(r[0] in "<>" for r in rels)))
    check("каждое задание — система из двух строк", not bad_lines, str(bad_lines[:2]))
    check("3000 заданий: верный рисунок — ровно множество решений", not bad_answer, str(bad_answer[:2]))
    check("ни один неверный вариант не изображает множество решений", not bad_distr, str(bad_distr[:2]))
    check("подписи точек — границы неравенств, выколотые — у строгих", not bad_bounds, str(bad_bounds[:2]))
    check("на рисунках нужное число точек и выколотых кружков", not bad_dots, str(bad_dots[:2]))
    check("четыре варианта всегда разные", not dup, str(dup[:2]))
    check("в разборе «Это рисунок N» — номер верного варианта", not bad_num, str(bad_num[:2]))
    check("встречаются все формы ответа: отрезок, луч, нет решений", shapes == {"seg", "ray", "none"}, str(shapes))
    check("границы бывают целые, дробные и десятичные", kinds == {"int", "frac", "dec"}, str(kinds))
    check("часто встречается отрицательный коэффициент при x", neg > 600, str(neg))
    check("строгие, нестрогие и смешанные системы", len(strict_mix) == 3, str(strict_mix))
    check("без ошибок JS (генератор)", not errors, str(errors[:1]))
    ctx.close()


def find_task(page, cond, tries=150):
    for _ in range(tries):
        if page.evaluate(f"(() => {{ const m = curTask.meta; return {cond}; }})()"):
            return True
        page.click('#refreshBtn')
        page.wait_for_timeout(40)
    return False


def test_ui(browser):
    ctx, page, errors = new_page(browser, f"{BASE}/oge13.html")
    page.click('.mode-card[data-id="S3"]')
    page.wait_for_timeout(400)
    got = find_task(page, "m.shape === 'seg' && (m.lo.label.includes('/') || m.hi.label.includes('/')) && (m.lo.open || m.hi.open)")
    check("нашлось задание с дробной границей и выколотой точкой", got)
    q = page.inner_text('#questionPromptText')
    check("условие — как в банке", "Решите систему неравенств" in q and "На каком рисунке изображено множество её решений?" in q, q)
    ci = page.evaluate("curTask.correctIndex")
    seg_i = ci
    # дробная подпись на рисунке — вертикально: числитель выше знаменателя, черта между
    frac = page.evaluate(f"""(() => {{
      const svg = document.querySelectorAll('#mcqOptions .mcq-btn')[{seg_i}].querySelector('svg');
      const m = curTask.meta, f = m.lo.label.includes('/') ? m.lo.label : m.hi.label;
      const [p, q] = f.replace('−', '').split('/');
      // только части дроби (они мельче): подпись целой границы может
      // совпасть с числителем или знаменателем — «5» рядом с −4/5
      const ts = [...svg.querySelectorAll('text[font-size="11.5"]')];
      const tp = ts.find(t => t.textContent === p), tq = ts.find(t => t.textContent === q);
      const bar = [...svg.querySelectorAll('line')].length;
      return {{ ok: !!(tp && tq), up: tp && tq && tp.getBBox().y + tp.getBBox().height <= tq.getBBox().y + 1, bar }};
    }})()""")
    check("дробь на рисунке вертикально: числитель над знаменателем, есть черта", frac["ok"] and frac["up"] and frac["bar"] >= 1, str(frac))
    # прямая под выколотой точкой разорвана: в пути прямой есть кусок, кончающийся у кружка
    gap = page.evaluate(f"""(() => {{
      const svg = document.querySelectorAll('#mcqOptions .mcq-btn')[{seg_i}].querySelector('svg');
      const c = svg.querySelector('circle[fill="none"]');
      const d = svg.querySelector('path').getAttribute('d');
      const cx = +c.getAttribute('cx'), r = +c.getAttribute('r');
      return d.includes('H' + (cx - r)) && d.includes('M' + (cx + r) + ' ');
    }})()""")
    check("прямая под выколотой точкой разорвана, а не закрашена фоном", gap)
    wrong = 0 if ci != 0 else 1
    page.click(f'#mcqOptions .mcq-btn[data-i="{wrong}"]')
    page.wait_for_timeout(300)
    check("неверный вариант — ошибка и «Изменить ответ»",
          page.evaluate("totalErrors") == 1 and page.is_visible('#changeAnswerBtn'))
    page.click('#changeAnswerBtn')
    page.wait_for_timeout(200)
    page.click(f'#mcqOptions .mcq-btn[data-i="{ci}"]')
    page.wait_for_timeout(400)
    check("верный вариант засчитан и подсвечен",
          page.evaluate("taskAnswered") and page.query_selector(f'#mcqOptions .mcq-btn[data-i="{ci}"].correct') is not None)
    check("разбор открыт, дробь в нём вертикальная",
          page.is_visible('#explainBox') and page.query_selector('#explainBox .vfrac') is not None)
    vf = page.evaluate("""(() => { const s = document.querySelectorAll('#explainBox .vfrac')[0].children;
      return s[0].getBoundingClientRect().bottom <= s[1].getBoundingClientRect().top + 1; })()""")
    check("в разборе числитель над знаменателем", vf)
    check("в истории примеров ответ — рисунок", page.evaluate("curProg.history[0].answer.includes('<svg')"))
    # «Подборка» уносит условие вместе с рисунками
    page.evaluate("localStorage.removeItem('ogeBasket:v1')")
    page.click('#basketAddBtn')
    page.wait_for_timeout(300)
    basket = page.evaluate("localStorage.getItem('ogeBasket:v1') || ''")
    # рисунки подборка вырезает у всех тренажёров (GRAPHIC_STRIP_SELECTORS в
    # basket-core.js) — здесь проверяем только, что условие с системой уходит
    check("в подборку ушло условие с системой", "систему неравенств" in basket and "Варианты ответа" in basket, basket[:120])

    # снимок сессии — чистые данные: вторая страница рисует то же
    state = page.evaluate("JSON.stringify(tsGetState())")
    ctx2, p2, err2 = new_page(browser, f"{BASE}/oge13.html")
    p2.evaluate(f"tsApplyState(JSON.parse({json.dumps(state)}))")
    p2.wait_for_timeout(400)
    check("снимок сессии: у собеседника тот же тип и то же условие",
          p2.evaluate("curMode") == "S3" and p2.inner_text('#questionPromptText') == page.inner_text('#questionPromptText'))
    check("снимок сессии: у собеседника те же рисунки",
          p2.evaluate("[...document.querySelectorAll('#mcqOptions svg')].map(s => s.outerHTML).join()") ==
          page.evaluate("[...document.querySelectorAll('#mcqOptions svg')].map(s => s.outerHTML).join()"))
    check("без ошибок JS (вторая страница)", not err2, str(err2[:1]))
    ctx2.close()
    check("без ошибок JS (интерфейс)", not errors, str(errors[:1]))
    ctx.close()


def test_phone(browser):
    ctx, page, errors = new_page(browser, f"{BASE}/oge13.html", width=390)
    page.click('.mode-card[data-id="S3"]')
    page.wait_for_timeout(400)
    worst = 0
    for _ in range(25):
        w = page.evaluate("""(() => { const p = document.getElementById('questionPanel').getBoundingClientRect();
          let m = 0; document.querySelectorAll('#questionPanel svg, #questionPanel .sys-line, #questionPanel .mcq-btn').forEach(e => {
            m = Math.max(m, e.getBoundingClientRect().right - p.right); }); return Math.max(m, document.documentElement.scrollWidth - innerWidth); })()""")
        worst = max(worst, w)
        page.click('#refreshBtn')
        page.wait_for_timeout(40)
    check("телефон 390 px: условие и рисунки не вылезают за экран", worst <= 0.5, str(worst))
    check("без ошибок JS (телефон)", not errors, str(errors[:1]))
    ctx.close()


def main():
    with local_server(), sync_playwright() as p:
        browser = p.chromium.launch()
        test_registry(browser)
        test_generator(browser)
        test_ui(browser)
        test_phone(browser)
        browser.close()
    failed = [n for n, ok in results if not ok]
    print(f"\nИтого: {len(results) - len(failed)} из {len(results)} проверок прошли")
    sys.exit(1 if failed else 0)


if __name__ == "__main__":
    main()
