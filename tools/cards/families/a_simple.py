"""Семья a_simple — форма А простая: ОГЭ №6, 7, 8, 9, 14 (банк хранит параметры g и args
(у №9 — ещё готовый разбор explain), условие строит функция страницы).

ОГЭ №9: условие — #questionPanel страницы (уравнение HTML-разметкой: курсив,
дроби .frac), ответ — trainerTaskInfo живого задания, разбор — explain банка
OGE9_FIPI (готовые строки .sol-line).
"""
from tools.cards.core import Skip, card_base, collect_catalog, convert_html, has_tex, in_page

FAMILY = "a_simple"
# страница → переменная банка ФИПИ в окне тренажёра
BANKS = {"oge6": "OGE6_FIPI", "oge7": "OGE7_FIPI", "oge8": "OGE8_FIPI",
         "oge9": "OGE9_FIPI", "oge14": "OGE14_FIPI"}
PAGES = [
    {"slug": s, "href": s + ".html", "deps": [s + ".html", s + "-fipi-bank.js"]}
    for s in BANKS
]
# фразы интерфейса страницы, которых нет в карточке (live → card); по ним тест
# сверяет видимый текст живого задания с карточкой
UI_TEXT = {}


# №7: числовая прямая на странице — набор div с абсолютными позициями (CSS страницы), в
# карточку они не переносятся. Из тех же div (left в %, подписи) собирается svg на месте
# прямой, потом задание снимается заново — рисунок уходит обычным путём (collect.js → build.py)
NUMLINE_TO_SVG = """(() => {
  const host = document.getElementById('questionNumlineHost');
  const line = host && host.querySelector('.numline');
  if (!line) return false;
  const cs = (e, p) => getComputedStyle(e).getPropertyValue(p);
  const ticks = [...line.querySelectorAll('.nl-tick')].map(t => ({ x: parseFloat(t.style.left) / 100, label: (t.querySelector('.nl-ticklabel') || {}).textContent || '' }));
  const pts = [...line.querySelectorAll('.nl-point')].map(t => ({ x: parseFloat(t.style.left) / 100, label: (t.querySelector('.nl-plabel') || {}).textContent || '' }));
  const dot = line.querySelector('.nl-dot'), tl = line.querySelector('.nl-ticklabel') || line, pl = line.querySelector('.nl-plabel') || line;
  const ink = cs(line, 'background-color');
  const dotColor = dot ? cs(dot, 'background-color') : ink;
  const W = Math.round(line.getBoundingClientRect().width) + 16, H = 84, Y = 44, M = 8, L = W - 2 * M;
  const NS = 'http://www.w3.org/2000/svg';
  const el = (n, a, txt) => { const e = document.createElementNS(NS, n); for (const k in a) e.setAttribute(k, a[k]); if (txt != null) e.textContent = txt; return e; };
  const svg = el('svg', { viewBox: '0 0 ' + W + ' ' + H, 'aria-label': 'Числовая прямая' });
  svg.style.cssText = 'display:block;width:' + W + 'px;height:' + H + 'px';
  svg.appendChild(el('line', { x1: M, y1: Y, x2: W - 2, y2: Y, stroke: ink, 'stroke-width': 2 }));
  svg.appendChild(el('path', { d: 'M' + (W - 11) + ' ' + (Y - 5) + ' L' + (W - 1) + ' ' + Y + ' L' + (W - 11) + ' ' + (Y + 5) + ' Z', fill: ink }));
  ticks.forEach(t => {
    const x = M + t.x * L;
    svg.appendChild(el('line', { x1: x, y1: Y - 4, x2: x, y2: Y + 6, stroke: ink, 'stroke-width': 2 }));
    svg.appendChild(el('text', { x, y: Y + 24, 'text-anchor': 'middle', fill: cs(tl, 'color'), 'font-size': cs(tl, 'font-size'), 'font-family': cs(tl, 'font-family') }, t.label));
  });
  pts.forEach(t => {
    const x = M + t.x * L;
    svg.appendChild(el('circle', { cx: x, cy: Y, r: 5, fill: dotColor, stroke: cs(host.closest('.panel') || host, 'background-color'), 'stroke-width': 3 }));
    svg.appendChild(el('text', { x, y: Y - 14, 'text-anchor': 'middle', fill: cs(pl, 'color'), 'font-size': cs(pl, 'font-size'), 'font-weight': cs(pl, 'font-weight'), 'font-family': cs(pl, 'font-family') }, t.label));
  });
  host.innerHTML = '';
  host.appendChild(svg);
  return true;
})()"""
OPTIONS = "[...document.querySelectorAll('#mcqOptions .mcq-btn')].map(b => b.lastElementChild.innerHTML)"


def _extra(page, raw):
    """Задание банка по номеру ФИПИ (ключ ans — для сверки), разбор страницы,
    у №7 ещё прямая и варианты ответа."""
    slug = raw["slug"]
    var = BANKS[slug]
    t = in_page(page, "(window.%s.tasks.find(t => t.fipi === %r) || null)" % (var, raw["fipi"]))
    if not t:
        raise Skip("задания нет в банке " + var)
    raw["bank"] = {"ans": t.get("ans"), "checked": t.get("checked"), "g": t.get("g")}
    # разбор: у №9 — explain банка, у остальных — explain задания, как его строит страница
    expl = t.get("explain") if slug == "oge9" else in_page(page, "(curTask && curTask.explain) || ''")
    if expl:
        raw["solution"] = convert_html(page, expl)
    if slug == "oge7":
        if in_page(page, NUMLINE_TO_SVG):
            raw.update(page.evaluate("t => CardCollect.grab(t)", raw["tid"]))
        raw["options"] = [convert_html(page, h) for h in in_page(page, OPTIONS)]


def collect(page, slug, limit=None):
    page_ = next(p for p in PAGES if p["slug"] == slug)
    return collect_catalog(page, page_["href"], limit=limit, extra=_extra)


def _same_answer(ans, bank_ans):
    """Ответ живого задания (task блока работы) = ans банка ФИПИ."""
    if bank_ans is None:
        return False, "в банке нет ans"
    k = ans.get("kind")
    if k == "choice":
        ok = ans["correct"] + 1 == int(bank_ans)
        return ok, f"выбор: страница {ans['correct'] + 1}, банк {bank_ans}"
    if k == "fields" and len(ans["fields"]) == 1:
        try:
            v = float(str(ans["fields"][0]["value"]).replace(",", "."))
        except ValueError:
            return False, "ответ страницы не число: " + str(ans["fields"][0]["value"])
        return abs(v - float(bank_ans)) <= 1e-9, f"страница {ans['fields'][0]['value']}, банк {bank_ans}"
    return False, "вид ответа " + str(k) + " не умею сверять с банком"


def normalize(raw):
    card = card_base(raw)
    sol = (raw.get("solution") or {}).get("html") or None
    card["solution"] = sol
    ok, why = _same_answer(card["answer"], raw["bank"]["ans"])
    if not ok:
        raise Skip("ответ страницы не совпал с банком: " + why)
    if raw["slug"] == "oge7":
        opts = raw.get("options") or []
        if len(opts) != card["answer"]["n"]:
            raise Skip(f"вариантов на странице {len(opts)}, в ответе {card['answer']['n']}")
        if any(o["figs"] or o["tables"] for o in opts):
            raise Skip("в варианте ответа рисунок или таблица")
        card["opts"] = [o["html"] for o in opts]
        card["text"] += "[[opts]]"
        tex = has_tex(card["text"], sol, *card["opts"])
    else:
        tex = has_tex(card["text"], sol)
    card["math"] = "tex" if tex else "html"
    return card
