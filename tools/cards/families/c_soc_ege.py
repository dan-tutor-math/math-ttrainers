"""Семья c_soc_ege — форма В: обществознание ЕГЭ. Две страницы:
soc_ege (№1–16, краткий ответ; банки soc-ege-fipi<n>.js) и
soc_ege_long (№17–25, развёрнутый ответ; банки soc-ege-long-fipi<n>.js).

Условие — #egeQuestion живого задания (текст ФИПИ, таблицы, рисунки; у №17–20 —
общий текст к заданиям); ответ короткой части — trainerTaskInfo, разбор — steps
прототипа. У развёрнутых автопроверки нет: answer.kind = long, эталона в банке
нет («без образцов ответов»), поэтому в answer.value пусто, а в разбор идёт
«Что должно быть в ответе» (steps), в answer.criteria — критерии ФИПИ по баллам.
"""
import html as _html
import re

from tools.cards.core import Skip, card_base, collect_catalog, convert_html, has_tex, in_page

FAMILY = "c_soc_ege"
PAGES = (
    [{"slug": "soc_ege", "href": "soc_ege.html?n=%d" % n,
      "deps": ["soc_ege.html", "soc-ege-bank.js", "soc-ege-figs.js", "soc-ege-fipi%d.js" % n]} for n in range(1, 17)]
    + [{"slug": "soc_ege_long", "href": "soc_ege_long.html?n=%d" % n,
        "deps": ["soc_ege_long.html", "soc-ege-long-bank.js", "soc-ege-long-figs.js", "soc-ege-long-fipi%d.js" % n]}
       for n in range(17, 26)]
)
UI_TEXT = {}

_PROTO = ("(function(){ const p = protoById(S.n, S.pid); return p ? { id: p.id, fipi: p.fipi, proof: !!p.proof,"
          " steps: p.steps || [], criteria: p.criteria || null, s: p.s || '', fields: p.fields || null } : null; })()")


def _extra(page, raw):
    p = in_page(page, _PROTO)
    if not p or p.get("fipi") != raw["fipi"]:
        raise Skip("прототип на экране не совпал с каталогом")
    raw["bank"] = p
    if raw["slug"] == "soc_ege_long":
        raw["info"] = {"kind": "long", "value": ""}
    steps = p["steps"]
    if raw["slug"] == "soc_ege_long":
        # вопросы-флажки «Что должно быть в ответе» → строки списка без интерфейса
        steps = [re.sub(r'<label class="soc-req"><input type="checkbox"><span>(.*?)</span></label>',
                        r'<div class="c-line">\1</div>', s, flags=re.S) for s in steps]
    raw["solution"] = convert_html(page, "".join(steps)) if steps else None


def collect(page, slug, limit=None):
    raws, total = [], 0
    for pg in PAGES:
        if pg["slug"] != slug:
            continue
        r, t = collect_catalog(page, pg["href"], limit=limit, extra=_extra)
        raws += r
        total += t
    return raws, total


def _criteria_html(crit):
    out = []
    for score, text in crit:
        t = _html.escape(str(text), quote=False)
        if score == "":
            if "автоматически не оцениваются" in text:
                continue  # подпись интерфейса страницы, не критерий
            out.append('<div class="c-line"><i>%s</i></div>' % t)
        else:
            w = "балл" if score == 1 else ("балла" if 2 <= score <= 4 else "баллов")
            out.append('<div class="c-line"><b>%s %s.</b> %s</div>' % (score, w, t))
    return "".join(out)


_LABEL = re.compile(r"\[\[(table|fig):(\d+)\]\]")


def _flatten_tables(text, tables):
    """collect.js превращает вложенные таблицы-«раскладку» ФИПИ в таблицу, ячейки которой
    содержат метки другой таблицы или рисунка. Карточка такого не умеет, поэтому:
    - таблица 1×1 (рамка вокруг абзаца или рисунка) → её содержимое прямо в текст;
    - таблица, в ячейках которой метки (два столбца соответствия) → обход по столбцам:
      заголовок столбца абзацем, затем его таблица. Настоящие таблицы остаются таблицами."""
    final = []          # настоящие таблицы в порядке появления в тексте

    def cell_html(x):
        x = _LABEL.sub(lambda m: expand(int(m.group(2))) if m.group(1) == "table" else m.group(0), x)
        return x

    def expand(k):
        t = tables[k]
        rows = ([t["head"]] if t.get("head") else []) + t["rows"]
        has_label = any("[[" in c for r in rows for c in r)
        if len(rows) == 1 and len(rows[0]) == 1:
            return cell_html(rows[0][0])
        if not has_label:
            final.append(t)
            return "[[table:@%d]]" % (len(final) - 1)
        out = []
        for c in range(max(len(r) for r in rows)):
            for r in rows:
                x = r[c] if c < len(r) else ""
                if not re.sub(r"<[^>]+>|&nbsp;|\s", "", re.sub(r"\[\[[^\]]+\]\]", "L", x)):
                    continue
                x = cell_html(x)
                out.append(x if re.match(r"\s*(<p|<div|\[\[)", x) else "<p>%s</p>" % x)
        return "".join(out)

    new_text = _LABEL.sub(lambda m: expand(int(m.group(2))) if m.group(1) == "table" else m.group(0), text)
    used = {int(m.group(1)) for m in re.finditer(r"\[\[table:@(\d+)\]\]", new_text)}
    for k, t in enumerate(final):   # таблица, на которую текст не ссылался, остаётся последней
        if k not in used:
            new_text += "[[table:@%d]]" % k
    new_text = re.sub(r"\[\[table:@(\d+)\]\]", lambda m: "[[table:%s]]" % m.group(1), new_text)
    return new_text, (final or None)


def normalize(raw):
    card = card_base(raw)
    # пункт ФИПИ «<b>1)</b><p>текст</p>» в карточке (p — блок) ломал строку: номер отдельно от текста
    card["text"] = re.sub(r"<div>(<b>[^<]{1,4}</b>)<p>(.*?)</p></div>", r"<p>\1 \2</p>", card["text"], flags=re.S)
    if card["table"]:
        card["text"], card["table"] = _flatten_tables(card["text"], card["table"])
    b = raw["bank"]
    sol = (raw.get("solution") or {}).get("html") or ""
    if raw["slug"] == "soc_ege":
        if (raw.get("solution") or {}).get("figs"):
            raise Skip("в разборе рисунок")
        a = card["answer"]
        if b.get("fields") and a["kind"] == "fields":
            want = [str(f.get("value")) for f in b["fields"]]
            if want != [f["value"] for f in a["fields"]]:
                raise Skip("ответ страницы не совпал с банком")
        card["solution"] = sol or None
    else:
        if not b.get("criteria"):
            raise Skip("нет критериев ФИПИ")
        card["answer"]["criteria"] = _criteria_html(b["criteria"])
        card["solution"] = sol or None
        if b.get("s"):
            card["answer"]["value"] = b["s"]
    card["math"] = "tex" if has_tex(card["text"], card["solution"], card["answer"].get("criteria")) else "html"
    return card
