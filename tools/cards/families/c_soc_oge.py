"""Семья c_soc_oge — форма В: ОГЭ обществознание (soc_oge.html?n=1…21, банки
soc-oge-fipi<n>.js).

Что здесь особенного:
- Короткие ответы (№2–6, 9–11, 13–16): ответ — trainerTaskInfo живого задания;
  варианты 1–4 страница ставит кнопками внутри условия — в карточке они идут
  в opts (номера рисует рендерер), а из текста убираются.
- Развёрнутые (№1, 7, 8, 12, 18–21): автопроверки нет, у страницы trainerTaskInfo
  пуст. Ответ — answer.kind 'long': value — образец ответа страницы
  («Образец ответа на N балла»), criteria — критерии оценивания ФИПИ
  (баллы и описание), solution — «что должно быть в ответе».
- №18–21 идут к одному тексту: текст («Текст к заданиям 18–20») лежит в условии
  каждой карточки целиком — карточка самодостаточна.
- Вёрстка таблиц ФИПИ — вложенные таблицы-«раскладки» (№3, 6, 14 и др.): перед
  снятием раскладки разворачиваются, списки «1) …» становятся строками, два
  столбца №14 — настоящей таблицей. Пустой каталог у №17 (на сайте у него
  заданий ФИПИ нет) — в отчёте «0 заданий».
- №21 на странице есть (в банке 127 заданий), но в exam-spec.js и в
  TRAINER_CAPTURE его нет: узел берём по tid soc20 (тот же #egeQuestion), номер
  и экзамен ставим сами. ExamSpec.find('soc_oge', 21) → null — конструктору это
  надо поправить в общем коде (в отчёте).
"""
import html as H
import re

from tools.cards.core import Skip, _spread, card_base, convert_html, in_page

FAMILY = "c_soc_oge"
NUMS = list(range(1, 22))
# Два файла, а не один: №18–21 несут целый текст к заданиям в каждой карточке (3 МБ из 6,3),
# а схема связывает slug с именем файла. №1–16 — cards/soc_oge.json, №18–21 — cards/soc_oge_text.json
TEXT_SLUG = "soc_oge_text"
PAGES = [
    {"slug": TEXT_SLUG if n >= 18 else "soc_oge", "href": "soc_oge.html?n=%d" % n,
     "deps": ["soc_oge.html", "soc-oge-fipi.js", "soc-oge-fipi%d.js" % n]}
    for n in NUMS
    if n != 17  # soc-oge-fipi17.js нет: заданий ФИПИ у номера нет
]
UI_TEXT = {}

# В живом узле: раскладка ФИПИ → то, что карточка умеет (текст, строки списков,
# настоящая таблица). Узел страницы меняется на месте — следующий openAt его
# перерисует.
PREP_JS = r"""
([tid]) => {
  const el = CardCollect.mainNode(tid);
  if (!el) return { err: 'нет узла задания (TRAINER_CAPTURE ' + tid + ')' };
  const doc = el.ownerDocument;
  const clean = s => (s || '').replace(/[\s ]+/g, ' ').trim();
  const blank = c => !clean(c.textContent);
  const unwrapP = node => { node.querySelectorAll('p').forEach(p => { const s = doc.createElement('span'); while (p.firstChild) s.appendChild(p.firstChild); p.replaceWith(s); }); };
  // 0. заголовок раскрывающегося блока («Текст к заданиям 18–20») — жирной строкой
  el.querySelectorAll('summary').forEach(s => { const d = doc.createElement('div'); const b = doc.createElement('b'); b.textContent = clean(s.textContent); d.appendChild(b); s.replaceWith(d); });
  // 1. два столбца с шапкой (№14: ПРИМЕРЫ / ВИДЫ) → одна таблица, строки по парам
  el.querySelectorAll('tr.col-heads').forEach(hr => {
    const tbl = hr.closest('table'); if (!tbl) return;
    const body = [...tbl.rows].find(r => r !== hr); if (!body) return;
    const cols = [...body.cells].filter(c => c.querySelector('table'));
    const lists = cols.map(c => ({ head: clean((c.querySelector('.col-head') || {}).textContent), rows: [...c.querySelector('table').rows].map(r => ({ lab: clean(r.cells[0].textContent), html: r.cells[1] ? r.cells[1].innerHTML : '' })) }));
    if (!lists.length) return;
    const t = doc.createElement('table');
    const th = t.createTHead().insertRow();
    lists.forEach(l => { const c = doc.createElement('th'); c.textContent = l.head; th.appendChild(c); });
    const tb = t.createTBody();
    const n = Math.max(...lists.map(l => l.rows.length));
    for (let i = 0; i < n; i++) {
      const tr = tb.insertRow();
      lists.forEach(l => { const c = tr.insertCell(); const r = l.rows[i]; if (r) { c.innerHTML = '<b>' + r.lab + '</b> ' + r.html; unwrapP(c); } });
    }
    tbl.replaceWith(t);
  });
  // 2. таблица-раскладка (одна клетка / одна непустая клетка в единственной строке) → её содержимое
  for (let again = true; again;) {
    again = false;
    for (const t of [...el.querySelectorAll('table')]) {
      if (t.tHead) continue;
      const cells = [...t.rows].flatMap(r => [...r.cells]);
      const full = cells.filter(c => !blank(c) || c.querySelector('img,svg,canvas'));
      if (t.rows.length === 1 && full.length <= 1) {
        const c = full[0];
        if (c) while (c.firstChild) t.parentNode.insertBefore(c.firstChild, t);
        t.remove(); again = true; break;
      }
    }
  }
  // 3. список «1) …», «А. …» из двух столбцов → строки
  el.querySelectorAll('table').forEach(t => {
    if (t.tHead || !t.rows.length) return;
    const ok = [...t.rows].every(r => r.cells.length === 2 && /^[А-ЯЁA-Z0-9]{1,2}[.)]$/.test(clean(r.cells[0].textContent)));
    if (!ok) return;
    const box = doc.createElement('div');
    [...t.rows].forEach(r => {
      const d = doc.createElement('div'); const b = doc.createElement('b'); b.textContent = clean(r.cells[0].textContent);
      d.appendChild(b); d.appendChild(doc.createTextNode(' '));
      const s = r.cells[1].cloneNode(true); unwrapP(s); while (s.firstChild) d.appendChild(s.firstChild);
      box.appendChild(d);
    });
    t.replaceWith(box);
  });
  // варианты ответа кнопками: каждый — свой html без номера
  const opts = [], figsInOpts = [];
  el.querySelectorAll('.soc-opt').forEach(o => {
    const sp = o.querySelector('span') || o;
    const c = CardCollect.convert(sp);
    opts.push(c.html);
    if (c.figs.length || c.tables.length) figsInOpts.push(1);
  });
  const full = CardCollect.grab(tid, {});
  const noopts = CardCollect.grab(tid, { drop: ['.soc-opts'] });
  return { full, noopts, opts, optFigs: figsInOpts.length };
}
"""


def _extra(page, raw):
    b = in_page(page, "(function(){ const p = protoById(S.n, S.pid); return p ? { id: p.id, fipi: p.fipi, proof: !!p.proof, steps: p.steps || [], criteria: p.criteria || null } : null; })()")
    if not b or b.get("fipi") != raw["fipi"]:
        raise Skip("прототип на экране не совпал с каталогом")
    raw["bank"] = b


def collect(page, slug, limit=None):
    raws, total = [], 0
    for pg in PAGES:
        if pg["slug"] != slug:
            continue
        meta = page.evaluate("h => CardCollect.open(h)", pg["href"])
        n = meta["n"]
        if not meta.get("tid"):
            # №21: страница есть, а записи в каталоге тренажёров нет — узел тот же, что у №20
            meta["tid"] = "soc20"
        if not meta.get("spec"):
            meta["spec"] = {"exam": "soc_oge", "n": n, "label": "№%d" % n}
        protos = [p for p in page.evaluate("n => CardCollect.list(n)", n) if any(p.get("fipi") or [])]
        total += sum(1 for p in protos for f in p["fipi"] if f)
        lim = max(1, limit // len(PAGES)) if limit else None
        for p, pos in _spread(protos, lim):
            raw = dict(meta, slug=slug, href=pg["href"], proto=p["id"], pos=pos, fipi=p["fipi"][pos])
            r = page.evaluate("([p, i, n]) => CardCollect.openAt(p, i, n)", [p["id"], pos, n])
            if not r.get("ok"):
                raw["err"] = "openAt не открыл: " + str(r.get("reason"))
            elif r.get("fipi") != raw["fipi"]:
                raw["err"] = "openAt открыл %s, а в каталоге %s" % (r.get("fipi"), raw["fipi"])
            else:
                try:
                    _extra(page, raw)
                    g = page.evaluate(PREP_JS, [meta["tid"]])
                    if g.get("err"):
                        raise Skip(g["err"])
                    full, noopts = g["full"], g["noopts"]
                    info = full.get("info")
                    use = full
                    if info and info.get("kind") in ("choice", "multi") and g["opts"] and not g["optFigs"] \
                            and len(g["opts"]) == info.get("n"):
                        use = noopts
                        raw["opts"] = g["opts"]
                    raw.update({k: use.get(k) for k in ("html", "figs", "tables", "tex", "info", "sel", "err")})
                    if not raw.get("info") and raw["bank"]["proof"]:
                        raw["info"] = {"kind": "long"}
                    if raw["info"] and raw["info"]["kind"] == "long":
                        _long(page, raw)
                    else:
                        raw["sol"] = [convert_html(page, st)["html"] for st in raw["bank"]["steps"]]
                except Skip as e:
                    raw["err"] = str(e)
            raws.append(raw)
    return raws, total


def _plural(n):
    return "%d %s" % (n, "балл" if n == 1 else "балла" if 2 <= n <= 4 else "баллов")


def _long(page, raw):
    """Эталон, критерии и «что должно быть в ответе» развёрнутого задания."""
    b = raw["bank"]
    steps = "".join(b["steps"])
    m = re.search(r'<div class="soc-sample-text">(.*?)</div>', steps, re.S)
    if not m:
        raise Skip("в разборе нет образца ответа (soc-sample-text)")
    c = convert_html(page, m.group(1))
    if c["figs"] or c["tables"]:
        raise Skip("в образце ответа рисунок или таблица")
    raw["sample"] = c["html"]
    reqs = re.findall(r'<span>(.*?)</span></label>', steps, re.S)
    raw["reqs"] = [convert_html(page, r)["html"] for r in reqs]
    if not b["criteria"]:
        raise Skip("нет критериев оценивания")
    raw["crit"] = [(int(s) if str(s) != "" else None, convert_html(page, t)["html"]) for s, t in b["criteria"]]


def normalize(raw):
    card = card_base(raw)
    card["text"] = card["text"].replace("<b></b>", "")  # пустая жирная метка в исходнике ФИПИ
    a = card["answer"]
    if raw.get("opts"):
        card["opts"] = raw["opts"]
    if a["kind"] == "long":
        a["value"] = raw["sample"]
        # баллы по убыванию, потом примечания без балла (как у страницы)
        a["criteria"] = "".join(
            '<div class="c-line"><b>%s</b> — %s</div>' % (_plural(s), t)
            for s, t in sorted((x for x in raw["crit"] if x[0] is not None), key=lambda x: -x[0])
        ) + "".join('<div><i>%s</i></div>' % t for s, t in raw["crit"] if s is None)
        card["solution"] = ("<div><b>Что должно быть в ответе</b></div><ol>%s</ol>" % "".join("<li>%s</li>" % r for r in raw["reqs"])) if raw["reqs"] else None
    else:
        card["solution"] = "".join('<div class="c-line">%s</div>' % s for s in raw.get("sol") or []) or None
    return card
