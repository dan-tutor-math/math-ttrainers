"""Семья c_inf — информатика ОГЭ (inf_oge.html?n=1…10, банки inf-oge-fipi<n>.js).

Страницы inf_oge нет в панели тренажёров конструктора (tid = null, записи в
TRAINER_CAPTURE нет), поэтому общий collect_catalog здесь не годится: снимаем
узел условия #questionText сами тем же CardCollect.convert, а ответ берём тем
же egeTaskInfo (trainer-tasks.js), что у страниц-копий ege_prof, — fieldsOf
страницы, а не пересчёт сборщиком.
Условие — готовая разметка банка (p, b, i, u, sub, br, таблицы grid, рисунки
inf-oge-img/*.png); KaTeX нет, math = html. Разбор — steps прототипа.

Таблица в таблице (обёртка вокруг условия и вариантов) разворачивается в блоки.
Таблицы с colspan (ОГЭ №6: программа на пяти языках, последняя строка — C++
на всю ширину): в таблице карточки colspan нет, поэтому строки с colspan
выносятся в свою таблицу прямо в живом DOM перед снятием — текст программы не
теряется и не прячется в узкую колонку. Код программ — строки <p> в ячейках, как
на странице (отступов в банке нет: у строк по одному пробелу, который вёрстка
сворачивает; моноширинного начертания в разметке карточки нет).
"""
from tools.cards.core import Skip, card_base, convert_html, in_page, _spread

FAMILY = "c_inf"
_BANKS = ["inf_oge.html", "inf-oge-fipi.js"] + ["inf-oge-fipi%d.js" % i for i in range(1, 11)]
PAGES = [{"slug": "inf_oge", "href": "inf_oge.html?n=%d" % n, "deps": _BANKS} for n in range(1, 11)]
UI_TEXT = {}

_GRAB = """([n]) => {
  const w = document.getElementById('f').contentWindow;
  const el = w.document.getElementById('questionText');
  if (!el) return { err: 'нет #questionText' };
  // таблица-обёртка с таблицей внутри (ОГЭ №7: условие и «1) tasks 2) .rar…» в
  // оболочке) → ячейки становятся блоками: в карточке таблица в таблице не держится
  [...el.querySelectorAll('table')].forEach(o => {
    if (!o.isConnected || !o.querySelector('table')) return;
    [...o.rows].forEach(r => [...r.cells].forEach(c => {
      const d = o.ownerDocument.createElement('div');
      while (c.firstChild) d.appendChild(c.firstChild);
      o.parentNode.insertBefore(d, o);
    }));
    o.remove();
  });
  // таблицы с colspan → отдельные таблицы по подряд идущим строкам
  [...el.querySelectorAll('table')].forEach(t => {
    const rows = [...t.rows], sp = r => [...r.cells].some(c => c.colSpan > 1);
    if (!rows.some(sp)) return;
    const groups = [];
    rows.forEach(r => { const g = groups[groups.length - 1]; if (g && g.sp === sp(r)) g.rows.push(r); else groups.push({ sp: sp(r), rows: [r] }); });
    groups.forEach(g => {
      const nt = t.cloneNode(false), tb = t.ownerDocument.createElement('tbody');
      g.rows.forEach(r => tb.appendChild(r));
      nt.appendChild(tb);
      t.parentNode.insertBefore(nt, t);
    });
    t.remove();
  });
  const conv = CardCollect.convert(el, {});
  let info = null;
  try { info = egeTaskInfo(w, -1, el); } catch (e) { return Object.assign(conv, { err: 'egeTaskInfo: ' + e }); }
  return Object.assign(conv, { info: info ? JSON.parse(JSON.stringify(info)) : null, sel: '#questionText' });
}"""


def collect(page, slug, limit=None):
    raws, total = [], 0
    for pg in PAGES:
        if pg["slug"] != slug:
            continue
        meta = page.evaluate("h => CardCollect.open(h)", pg["href"])
        n = meta["n"]
        protos = [p for p in page.evaluate("n => CardCollect.list(n)", n) if any(p.get("fipi") or [])]
        total += sum(1 for p in protos for f in p["fipi"] if f)
        pairs = _spread(protos, limit)
        for p, pos in pairs:
            raw = dict(meta, href=pg["href"], proto=p["id"], pos=pos, fipi=p["fipi"][pos], proto_title=p.get("title"))
            r = page.evaluate("([p, i, n]) => CardCollect.openAt(p, i, n)", [p["id"], pos, n])
            if not r.get("ok"):
                raw["err"] = "openAt не открыл: " + str(r.get("reason"))
            elif r.get("fipi") and r["fipi"] != raw["fipi"]:
                raw["err"] = "openAt открыл %s, а в каталоге %s" % (r["fipi"], raw["fipi"])
            else:
                raw.update(page.evaluate(_GRAB, [n]))
                if not raw.get("err"):
                    try:
                        _extra(page, raw)
                    except Skip as e:
                        raw["err"] = str(e)
            raws.append(raw)
        if limit and len(raws) >= limit:
            break
    return raws, total


def _extra(page, raw):
    p = in_page(page, "(function(){ const p = protoById(S.n, S.pid); return p ? { id: p.id, fipi: p.fipi, answer: p.answer, steps: p.steps || [], text: p.text } : null; })()")
    if not p or p.get("fipi") != raw["fipi"]:
        raise Skip("прототип на экране не совпал с каталогом")
    raw["bank"] = p
    raw["steps"] = [convert_html(page, s) for s in p["steps"]]


def normalize(raw):
    card = card_base(raw)
    steps = raw.get("steps") or []
    if any(x["figs"] or x["tables"] for x in steps):
        raise Skip("в разборе рисунок или таблица — схема разбора их не держит")
    card["solution"] = "".join('<div class="c-line">%s</div>' % x["html"] for x in steps) or None
    a = card["answer"]
    if a["kind"] != "fields" or len(a["fields"]) != 1:
        raise Skip("ответ не одно поле: " + a["kind"])
    bank = raw["bank"].get("answer")
    if bank is not None and a["fields"][0]["value"] != str(bank):
        raise Skip("ответ страницы не совпал с банком")
    return card
