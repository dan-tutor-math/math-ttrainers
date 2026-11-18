"""Семья a_figs — форма А сложная: ОГЭ №1–5 (oge1_5: шины, планы, участки,
тарифы — пять заданий про один сюжет) и ОГЭ №15–18 (oge15_18: чертежи ФИПИ,
клетчатая бумага №18). Сессия S1c задачи 63.

Свой обход каталога вместо core.collect_catalog: между openAt и снятием узла
нужно подготовить страницу (раскладка таблиц, сюжет №1–5), а у collect_catalog
такой точки нет.

ОГЭ №1–5. Каждая часть сюжета — своё задание ФИПИ со своим номером, то есть
отдельная карточка (n — номер части, из id прототипа …_t1…_t5). Общий текст
сюжета (теория шин, описание и план участка, тарифы) страница показывает не
в условии, а в блоке «Теория» над ним; в схеме карточки поля для общего
текста нет, поэтому сюжет кладётся в начало text каждой части, первым <div>
(text = <div>сюжет</div><div>вопрос</div>): без него часть не решить, а
одинаковый первый <div> у частей одного сюжета даёт конструктору и печати
узнать общий текст. Рисунки сюжета — один файл на сюжет
(img/oge1_5/s_<сюжет>_<k>.png), а не копия на каждую из пяти частей.
У «Поездки в село» страница сама кладёт текст сюжета в условие (.fipi-ctx) —
его выбрасываем и берём тот же текст из теории, как у остальных.

Таблицы. У card.table ячейка — строка, объединений (colspan/rowspan) схема
не знает. Таблица с объединёнными ячейками раскладывается в сетку до снятия:
ячейка остаётся на своём месте, занятые объединением места — пустые ячейки
(текст не теряется и не повторяется). Таблица-подложка ФИПИ, где в ячейках
только рисунки (№18: клетчатый чертёж в <table>), — не таблица: рендерер не
рисует рисунок внутри ячейки, поэтому её содержимое ставится в текст.
Рисунок внутри ячейки таблицы с данными карточкой не передать — такое
задание не берём (причина в отчёте).

Рисунки — файлы ФИПИ (PNG/GIF → PNG, это делает build.py); холст и svg
страницы сохраняются тем же collect.js (canvas → PNG, svg → .svg).
"""
import re

from tools.cards.core import Skip, _spread, card_base, has_tex, in_page

FAMILY = "a_figs"
PAGES = [
    {"slug": "oge1_5", "href": "oge1_5.html", "deps": ["oge1_5.html", "oge1_5-fipi-bank.js"]},
    {"slug": "oge15_18", "href": "oge15_18.html",
     "deps": ["oge15_18.html", "oge15_18-kinds.js", "oge15_18-fipi-bank.js", "oge18-fipi-bank.js"]},
]
UI_TEXT = {}

# узел условия на обеих страницах (TRAINER_CAPTURE в trainer-tasks.js)
Q_SEL = "#questionPanel"

# Разметка страницы, которой нет в словаре карточки (collect.js CLASS_MAP):
# дробь .vf — два span без классов (числитель, знаменатель) → num/den, их
# collect.js переводит в c-num/c-den; корень .rad — черта сверху CSS-ом, у
# карточки класса для неё нет: без черты «√8² + 15²» читается неверно, поэтому
# подкоренное выражение из нескольких членов берётся в скобки.
_MARKUP_JS = r"""
function a_figsMarkup(root){
  root.querySelectorAll('.vf').forEach(v => {
    const k = [...v.children];
    if (k.length === 2) { k[0].classList.add('num'); k[1].classList.add('den'); }
  });
  root.querySelectorAll('.rad').forEach(r => {
    if (r.dataset.afigs) return;
    r.dataset.afigs = '1';
    if (/[\s+−\-·×:]/.test(r.textContent.trim())) { r.insertBefore(r.ownerDocument.createTextNode('('), r.firstChild); r.appendChild(r.ownerDocument.createTextNode(')')); }
  });
}
"""

# Раскладка таблиц в живом узле страницы (в кадре harness). Возвращает
# {cellFig: n} — сколько таблиц с данными держат рисунок в ячейке.
_PREP_JS = r"""
([sel, hide]) => {
  """ + _MARKUP_JS + r"""
  const d = document.getElementById('f').contentWindow.document;
  const root = d.querySelector(sel);
  if (!root) return { err: 'нет узла ' + sel };
  a_figsMarkup(root);
  // строчный рисунок ФИПИ (обозначение ABC картинкой посреди фразы): карточка ставит
  // любой рисунок блоком — фраза рвётся, вид не совпадает с живым заданием
  if (root.querySelector('img.fipi-inline')) return { inlineFig: true };
  (hide || []).forEach(s => root.querySelectorAll(s).forEach(x => { x.style.display = 'none'; }));
  const media = 'img,canvas,svg';
  let cellFig = 0;
  [...root.querySelectorAll('table')].reverse().forEach(tb => {
    const cells = [...tb.querySelectorAll('td,th')];
    const withMedia = cells.filter(c => c.querySelector(media));
    // подложка ФИПИ: в ячейках только рисунки, или одна строка / один столбец с рисунком
    // («текст | чертёж») — содержимое в текст, строка таблицы — строкой
    const oneLine = tb.rows.length === 1 || [...tb.rows].every(tr => tr.cells.length <= 1);
    // рисунки с подписями «Рис. 1 | Рис. 2» строкой ниже — по столбцам: рисунок, под ним подпись
    const capRe = /^\s*(рис\.?|рисунок)\s*\d*\s*$/i;
    if (withMedia.length && !oneLine && cells.every(c => c.querySelector(media) || capRe.test(c.textContent) || !c.textContent.trim())) {
      const box = d.createElement('div');
      const ncol = Math.max(...[...tb.rows].map(tr => tr.cells.length));
      for (let j = 0; j < ncol; j++) {
        const col = d.createElement('div');
        [...tb.rows].forEach(tr => { const c = tr.cells[j]; if (c) { const line = d.createElement('div'); while (c.firstChild) line.appendChild(c.firstChild); col.appendChild(line); } });
        box.appendChild(col);
      }
      tb.replaceWith(box);
      return;
    }
    if (withMedia.length && (oneLine || cells.every(c => c.querySelector(media) || !c.textContent.trim()))) {
      const box = d.createElement('div');
      [...tb.rows].forEach(tr => {
        const line = d.createElement('div');
        [...tr.cells].forEach(c => { while (c.firstChild) line.appendChild(c.firstChild); });
        box.appendChild(line);
      });
      tb.replaceWith(box);
      return;
    }
    if (withMedia.length) cellFig++;
    // короткая строка (подзаголовок «После расходования пакетов:» в одну ячейку) —
    // дополняется пустыми ячейками: у card.table строки одной длины
    if (!cells.some(c => c.colSpan > 1 || c.rowSpan > 1)) {
      const wmax = Math.max(...[...tb.rows].map(tr => tr.cells.length));
      [...tb.rows].forEach(tr => { while (tr.cells.length < wmax) tr.appendChild(d.createElement(tr.cells[0] ? tr.cells[0].tagName.toLowerCase() : 'td')); });
    }
    // объединения → сетка: ячейка на своём месте, занятое объединением — пустая ячейка
    if (!cells.some(c => c.colSpan > 1 || c.rowSpan > 1)) return;
    const rows = [...tb.rows];
    const grid = rows.map(() => []);
    rows.forEach((tr, r) => {
      let col = 0;
      [...tr.cells].forEach(c => {
        while (grid[r][col]) col++;
        const cs = c.colSpan || 1, rs = c.rowSpan || 1;
        for (let i = 0; i < rs && r + i < rows.length; i++)
          for (let j = 0; j < cs; j++) grid[r + i][col + j] = (i || j) ? { fill: c.tagName } : { cell: c };
        col += cs;
      });
    });
    rows.forEach((tr, r) => {
      grid[r].forEach(g => {
        let el = g.cell;
        if (!el) el = d.createElement(g.fill.toLowerCase());
        el.removeAttribute('colspan'); el.removeAttribute('rowspan');
        tr.appendChild(el);   // перенос по порядку сетки
      });
    });
  });
  return { cellFig };
}
"""

# Сюжет №1–5: тот же HTML, что страница ставит в «Теорию» (renderCurrentTask),
# по прототипу и месту в банке. key — один на текст сюжета.
_STORY_EXPR = r"""
(() => {
  const p = catalogProtos().find(x => x.id === %r);
  const t = catalogBank(p)[%d];
  if (p.set.id === 'tire_fipi') {
    const v = TIRE_FIPI.find(v => v.v === t.v);
    return { key: 'tire_' + v.v, html: buildTireTheoryHTML(tireOf(v.factory)), ans: t.ans, n: null };
  }
  const plot = p.set.id.replace(/_fipi$/, '');
  const vs = plotVars(plot);
  const th = vs ? vs.find(x => x.v === t.v).theory : FIPI15.plots[plot].theory;
  return { key: plot + (vs ? '_' + t.v : ''), html: '<div class="fipi-plot-text">' + th + '</div>', ans: t.ans, n: t.n };
})()
"""

# показать сюжет в «Теории» страницы, дождаться картинок; снимать его будет convert
_SHOW_STORY_JS = r"""
async (html) => {
  const w = document.getElementById('f').contentWindow, d = w.document;
  const block = d.getElementById('theoryBlock'), box = d.getElementById('theoryContent');
  block.style.display = 'block';
  box.innerHTML = html;
  box.style.display = 'block';
  await new Promise(r => w.requestAnimationFrame(() => w.requestAnimationFrame(r)));
  const t0 = Date.now();
  while ([...box.querySelectorAll('img')].some(i => !i.complete) && Date.now() - t0 < 8000)
    await new Promise(r => setTimeout(r, 50));
  return true;
}
"""
_GRAB_STORY_JS = r"""
() => {
  const d = document.getElementById('f').contentWindow.document;
  const box = d.getElementById('theoryContent');
  const r = CardCollect.convert(box, {});
  box.style.display = 'none';
  d.getElementById('theoryBlock').style.display = 'none';
  return r;
}
"""


def _prep(page, sel, hide=None):
    r = page.evaluate(_PREP_JS, [sel, hide or []])
    if r.get("err"):
        raise Skip(r["err"])
    if r.get("inlineFig"):
        raise Skip("рисунок-обозначение внутри строки (fipi-inline): у рисунка карточки нет вида «в строке», фраза рвётся")
    if r.get("cellFig"):
        raise Skip("рисунок внутри ячейки таблицы с данными — card.table держит только текст")


def _story(page, raw, cache):
    """Сюжет №1–5 → {key, html, figs, tables}; рисунки сохраняются один раз на сюжет."""
    s = in_page(page, _STORY_EXPR % (raw["proto"], raw["pos"]))
    raw["bank_ans"] = s.get("ans")
    if s["key"] in cache:
        return cache[s["key"]]
    page.evaluate(_SHOW_STORY_JS, s["html"])
    _prep(page, "#theoryContent")
    conv = page.evaluate(_GRAB_STORY_JS)
    # рисунки сюжета — общие для пяти частей: свой файл s_<сюжет>_<k>
    from tools.cards import build
    fake = {"fipi": "s_" + s["key"], "figs": conv["figs"]}
    build.save_figs(fake, raw["slug"])
    figs = []
    for f in conv["figs"]:
        if not f.get("file"):
            raise Skip("рисунок сюжета не сохранён: " + str(f.get("why") or f.get("kind")))
        fig = {"file": f["file"], "w": f["w"], "h": f["h"], "alt": f.get("alt") or ""}
        if f.get("dw"):
            fig["maxw"] = int(f["dw"])
        figs.append(fig)
    st = {"key": s["key"], "html": conv["html"], "figs": figs, "tables": conv["tables"], "tex": conv["tex"]}
    cache[s["key"]] = st
    return st


def _solution(page, raw):
    """Разбор живого задания (curTask.explain) — той же разметкой карточки."""
    ex = in_page(page, "(curTask && curTask.explain) || ''")
    if not ex:
        return None
    conv = page.evaluate("""(h) => {""" + _MARKUP_JS + """
      const box = document.createElement('div'); box.innerHTML = h; a_figsMarkup(box);
      return CardCollect.convertHtml(box.innerHTML, {}); }""", ex)
    # рисунок или таблица в разборе: метки [[fig]] / [[table]] в solution схема не связывает
    # с figs/table карточки — такой разбор не берём, а не теряем его части молча
    if conv["figs"] or conv["tables"]:
        raw["sol_dropped"] = "в разборе рисунок или таблица"
        return None
    return conv


def _n_oge15_18(page, proto, cache):
    if proto not in cache:
        t = in_page(page, "(GROUPS.find(g => g.modes.some(m => m.id === %r)) || {}).title || ''" % proto)
        m = re.match(r"№(\d+)", t)
        cache[proto] = int(m.group(1)) if m else None
    return cache[proto]


def _bank_ans_oge15_18(page, fipi):
    return in_page(page, "((window.OGE15_18_FIPI.tasks.find(t => t.fipi === %r)) || "
                         "(window.OGE18_FIPI.tasks.find(t => t.fipi === %r)) || {}).ans ?? null" % (fipi, fipi))


def collect(page, slug, limit=None):
    pg = next(p for p in PAGES if p["slug"] == slug)
    meta = page.evaluate("h => CardCollect.open(h)", pg["href"])
    protos = [p for p in page.evaluate("n => CardCollect.list(n)", meta["n"]) if any(p.get("fipi") or [])]
    total = sum(1 for p in protos for f in p["fipi"] if f)
    by_id = {p["id"]: p for p in protos}
    raws, stories, ncache = [], {}, {}
    for p, pos in _spread(protos, limit):
        raw = dict(meta, href=pg["href"], proto=p["id"], pos=pos, fipi=p["fipi"][pos], proto_title=p.get("title"))
        raws.append(raw)
        r = page.evaluate("([p, i, n]) => CardCollect.openAt(p, i, n)", [p["id"], pos, meta["n"]])
        if not r.get("ok"):
            raw["err"] = "openAt не открыл: " + str(r.get("reason"))
            continue
        if r.get("fipi") and r["fipi"] != raw["fipi"]:
            raw["err"] = f"openAt открыл {r['fipi']}, а в каталоге {raw['fipi']}"
            continue
        try:
            if slug == "oge1_5":
                m = re.search(r"_t(\d)$", p["id"])
                raw["kim_n"] = int(m.group(1)) if m else None
                raw["link"] = by_id[p["id"]].get("link")
                _prep(page, Q_SEL, [".fipi-ctx"])
                raw.update(page.evaluate("([t, o]) => CardCollect.grab(t, o)", [meta["tid"], {"drop": [".fipi-ctx"]}]))
                raw["story"] = _story(page, raw, stories)
            else:
                raw["kim_n"] = _n_oge15_18(page, p["id"], ncache)
                _prep(page, Q_SEL)
                raw.update(page.evaluate("([t, o]) => CardCollect.grab(t, o)", [meta["tid"], {}]))
                raw["bank_ans"] = _bank_ans_oge15_18(page, raw["fipi"])
            if not raw.get("err"):
                raw["solution"] = _solution(page, raw)
        except Skip as e:
            raw["err"] = str(e)
    return raws, total


def _shift(html, kind, by):
    """[[fig:k]] / [[table:k]] вопроса → номера после рисунков и таблиц сюжета."""
    if not by:
        return html
    return re.sub(r"\[\[" + kind + r":(\d+)\]\]", lambda m: "[[%s:%d]]" % (kind, int(m.group(1)) + by), html)


def _num(s):
    try:
        return float(str(s).replace(",", ".").replace("−", "-"))
    except (TypeError, ValueError):
        return None


def normalize(raw):
    card = card_base(raw)
    if not raw.get("kim_n"):
        raise Skip("номер КИМ не определён по прототипу " + str(raw.get("proto")))
    card["n"] = raw["kim_n"]
    # ответ живого задания и ключ банка — одно число (иначе карточку не берём)
    fs = card["answer"].get("fields") or []
    live = _num(fs[0]["value"]) if len(fs) == 1 else None
    bank = _num(raw.get("bank_ans"))
    if live is None or bank is None or abs(live - bank) > 1e-9:
        raise Skip(f"ответ страницы {fs[0]['value'] if fs else '?'} не совпал с банком {raw.get('bank_ans')}")
    st = raw.get("story")
    if st:
        q = _shift(_shift(card["text"], "fig", len(st["figs"])), "table", len(st["tables"]))
        card["text"] = "<div>" + st["html"] + "</div><div>" + q + "</div>"
        card["figs"] = st["figs"] + card["figs"]
        tables = st["tables"] + (card["table"] or [])
        card["table"] = tables or None
    sol = raw.get("solution")
    card["solution"] = sol["html"] if sol and sol.get("html") else None
    tables_txt = [x for t in card["table"] or [] for r in ([t.get("head")] if t.get("head") else []) + t["rows"] for x in r]
    card["math"] = "tex" if has_tex(card["text"], card["solution"], *tables_txt) else "html"
    return card
