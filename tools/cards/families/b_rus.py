"""Семья b_rus — форма Б: русский язык ОГЭ и ЕГЭ.

Страницы-экзамены (по файлу на страницу):
  rus_oge    — ОГЭ №2–12 (rus-oge-fipi.js, вопросы q / варианты o / текст t / ответ a)
  rus_ege    — ЕГЭ №1–26 (rus-ege-fipi.js)
  rus_oge01  — ОГЭ №1, сжатое изложение (аудио)           ┐ длинные ответы, у страниц нет
  rus_oge13  — ОГЭ №13, сочинение-рассуждение             │ __trainerCatalog — читаем банк
  rus_ege27  — ЕГЭ №27, сочинение                         ┘ напрямую (см. b_rus_long в этом файле)

Условие и варианты берутся из банка (на живой странице варианты и поле ответа стоят
вне снимаемого узла), ответ — trainerTaskInfo живого задания: ответ карточки = ответ
страницы. Исходный текст (texts[t]) входит в условие, как у ФИПИ. У русского нет
разбора в банке — solution = null.

Не берутся (причина — в отчёте): задания ok:0 (ответ ФИПИ не подтверждён — их нет
и на странице) и ЕГЭ-задания старой формы банка (h: номер КИМ-2027 подобран по
умению — на странице скрыты).
"""
import re

from tools.cards.core import Skip, card_base, collect_catalog, convert_html, in_page
from tools.cards.families import _rus_long

FAMILY = "b_rus"
_OGE = ["rus_oge.html", "rus-oge-fipi.js", "exam-spec.js"]
_EGE = ["rus_ege.html", "rus-ege-fipi.js", "exam-spec.js"]
PAGES = (
    [{"slug": "rus_oge", "href": "rus_oge.html?n=%d" % n, "deps": _OGE, "n": n} for n in range(2, 13)]
    + [{"slug": "rus_ege", "href": "rus_ege.html?n=%d" % n, "deps": _EGE, "n": n} for n in range(1, 27)]
    + _rus_long.PAGES
)
BANK = {"rus_oge": ("RUS_OGE_FIPI", "ОГЭ"), "rus_ege": ("RUS_EGE_FIPI", "ЕГЭ")}
UI_TEXT = {}

# JS в окне сборщика: разметка вопроса банка → части для карточки. Таблицы банка —
# обёртки и списки строк (первая ячейка пустая); сопоставление (match) — вложенные
# таблицы «буквы | цифры» → настоящая таблица карточки
JS = r"""
window.__rusQ = function (html) {
  const d = document.createElement('div'); d.innerHTML = html;
  const lab = td => td.textContent.replace(/\s+/g, '');
  const rows = [...d.querySelectorAll('tr')].filter(tr => !tr.querySelector('table') && tr.cells.length === 2);
  const L = rows.filter(tr => /^[А-ЯЁ]\)$/.test(lab(tr.cells[0])));
  const D = rows.filter(tr => /^\d\)$/.test(lab(tr.cells[0])));
  if (L.length >= 2 && D.length >= 2) {
    const heads = [...d.querySelectorAll('u')].map(u => u.textContent.trim()).filter(Boolean);
    const first = d.querySelector('table td');
    const item = tr => '<b>' + lab(tr.cells[0]) + '</b> ' + tr.cells[1].innerHTML;
    return { match: true, stem: first ? first.innerHTML : '', heads, left: L.map(item), right: D.map(item) };
  }
  d.querySelectorAll('table').forEach(t => {
    const parts = [...t.rows].map(tr => [...tr.cells].map(td => td.innerHTML.trim()).filter(x => x.replace(/<[^>]*>|&nbsp;|\s/g, '')).join(' ')).filter(Boolean);
    const box = document.createElement('div');
    box.innerHTML = parts.map(x => /^<p[ >]/.test(x) ? x : '<div>' + x + '</div>').join('');
    t.replaceWith(...box.childNodes);
  });
  return { match: false, html: d.innerHTML };
};
"""


def _clean(h):
    # пустые абзацы-«отбивки» банка
    for _ in range(3):
        h = re.sub(r"<(p|div|i|b)>\s*</\1>", "", h)
        h = re.sub(r"<p>\s*<i>\s*</i>\s*</p>", "", h)
    return re.sub(r"\s+", " ", h).strip()


def build_q(page, q):
    """вопрос банка → (html, table|None, tex)."""
    r = page.evaluate("q => window.__rusQ(q)", q)
    if not r["match"]:
        c = convert_html(page, r["html"])
        return _clean(c["html"]), None, c["tex"]
    # в формулировке сопоставления бывает вложенная таблица-обёртка — разворачиваем
    stem = _clean(convert_html(page, re.sub(r"</?(table|tbody|tr|td)[^>]*>", "", r["stem"]))["html"])
    # метка «А)» и текст — в одну строку: абзацы <p> внутри ячейки убираем
    unp = lambda x: re.sub(r"</?p[^>]*>", "", x)
    left = [_clean(convert_html(page, unp(x))["html"]) for x in r["left"]]
    right = [_clean(convert_html(page, unp(x))["html"]) for x in r["right"]]
    n = max(len(left), len(right))
    rows = [[left[i] if i < len(left) else "", right[i] if i < len(right) else ""] for i in range(n)]
    head = r["heads"][:2] if len(r["heads"]) == 2 else None
    table = {"head": head, "rows": rows}
    return "<div>%s</div>[[table:0]]" % stem, table, []


def _extra(page, raw):
    var = BANK[raw["slug"]][0]
    t = in_page(page, "(%s.tasks.find(t => t.id === %r) || null)" % (var, raw["fipi"]))
    if not t:
        raise Skip("нет в банке")
    html, table, tex = build_q(page, t["q"])
    raw["cond"] = {"q": html, "table": table, "tex": list(tex)}
    if t.get("t"):
        src = in_page(page, "%s.texts[%r]" % (var, t["t"]))
        # таблица в тексте — обёртка (текст в одной ячейке): разворачиваем в блоки
        src = re.sub(r"<td[^>]*>", "<div>", re.sub(r"</?(table|tbody|tr)[^>]*>", "", src)).replace("</td>", "</div>")
        c = convert_html(page, src)
        raw["cond"]["src"] = _clean(c["html"])
        raw["cond"]["tex"] += c["tex"]
    if t["k"] == "mask":
        # вариант — одна строка после номера: абзацы <p> внутри него убираем
        raw["cond"]["opts"] = [_clean(convert_html(page, re.sub(r"</?p[^>]*>", "", o))["html"]) for o in t["o"]]
    raw["bank"] = {k: t[k] for k in ("k", "a", "n", "id")}


def _hidden(page, slug):
    """Задания банка, которых нет в каталоге страницы, — с причиной."""
    var = BANK[slug][0]
    ts = in_page(page, "%s.tasks.map(t => ({id: t.id, n: t.n, ok: t.ok, h: t.h || 0}))" % var)
    out = {}
    for t in ts:
        if not t["ok"]:
            out[t["id"]] = "ответ ФИПИ не подтверждён (ok:0) — задания нет и на странице"
        elif t["h"]:
            out[t["id"]] = "старая форма банка ЕГЭ (h): номер КИМ-2027 подобран по умению, на странице скрыто"
    return out, len(ts)


def collect(page, slug, limit=None):
    if slug in _rus_long.SLUGS:
        return _rus_long.collect(page, slug, limit)
    page.evaluate(JS)
    raws, seen = [], set()
    pages = [p for p in PAGES if p["slug"] == slug]
    for pg in pages:
        r, _ = collect_catalog(page, pg["href"], limit=limit, extra=_extra)
        for x in r:
            if x["fipi"] not in seen:     # задание в двух подтемах — одна карточка
                seen.add(x["fipi"])
                raws.append(x)
    hidden, total = _hidden(page, slug)
    if not limit:
        for fid, why in hidden.items():
            raws.append({"fipi": fid, "slug": slug, "proto": "-", "pos": 0, "err": why})
    return raws, total


def normalize(raw):
    if raw["slug"] in _rus_long.SLUGS:
        return _rus_long.normalize(raw)
    raw["figs"] = []                      # у русского рисунков нет; живой снимок не берём
    card = card_base(raw)
    c, b = raw["cond"], raw["bank"]
    head = "<div><b>Прочитайте текст.</b></div><div>%s</div>" % c["src"] if c.get("src") else ""
    card["text"] = head + c["q"]
    card["table"] = [c["table"]] if c["table"] else None
    a = card["answer"]
    if b["k"] == "mask":
        card["opts"] = c["opts"]
        if a["kind"] != "multi" or a["n"] != len(c["opts"]):
            raise Skip("ответ живого задания не multi по вариантам")
        if a["value"] != "".join(str(i + 1) for i, ch in enumerate(b["a"]) if ch == "1"):
            raise Skip("ответ страницы %s не совпал с банком %s" % (a["value"], b["a"]))
    elif a["kind"] != "fields":
        raise Skip("ответ живого задания не fields")
    elif b["k"] == "match" and a["value"] != b["a"]:
        raise Skip("ответ страницы %s не совпал с банком %s" % (a["value"], b["a"]))
    card["math"] = "tex" if c["tex"] else "html"
    card["solution"] = None
    return card
