"""Семья c_phys — ОГЭ физика (phys_oge.html?n=1…16, банки phys-oge-fipi<n>.js).

Страница устроена как обществознание: условие — #egeQuestion (текст с вариантами
.soc-opts, рисунки ФИПИ, таблицы), ответ — trainerTaskInfo живого задания,
разбор — steps прототипа. Все номера 1–16 краткие (развёрнутых заданий в банке
страницы нет, long не встречается). Заглушку «Ответ, принятый открытым банком
ФИПИ: …» разбором не считаем — это не разбор для ученика, solution = null.
"""
import re

from tools.cards.core import Skip, card_base, collect_catalog, in_page

FAMILY = "c_phys"
PAGES = [
    {"slug": "phys_oge", "href": "phys_oge.html?n=%d" % n,
     "deps": ["phys_oge.html", "phys-oge-fipi.js", "phys-oge-fipi%d.js" % n]}
    for n in range(1, 17)
]
UI_TEXT = {}


def _extra(page, raw):
    p = in_page(page, "(function(){ const p = protoById(S.n, S.pid); return p ? { id: p.id, fipi: p.fipi, fields: p.fields, steps: p.steps || [], answerTex: p.answerTex } : null; })()")
    if not p or p.get("fipi") != raw["fipi"]:
        raise Skip("прототип на экране не совпал с каталогом")
    raw["bank"] = p


def collect(page, slug, limit=None):
    raws, total = [], 0
    for pg in PAGES:
        if pg["slug"] != slug:
            continue
        r, t = collect_catalog(page, pg["href"], limit=limit, extra=_extra)
        raws += r
        total += t
    return raws, total


_STUB = re.compile(r"^Ответ, принятый открытым банком ФИПИ")
_REF = re.compile(r"\[\[table:(\d+)\]\]")


def _inline(c):
    """Ячейка таблицы банка: <p>…</p> → строки через <br>; пустое → ''."""
    ps = re.findall(r"<p>(.*?)</p>", c, re.S)
    parts = ps if ps else [c]
    parts = [re.sub(r"\s+", " ", x).strip() for x in parts]
    return "<br>".join(x for x in parts if x and x != "<b> </b>")


def _tex2html(s):
    """TeX единиц измерения в ячейке таблицы ($\\dfrac{\\text{Дж}}{\\text{кг}}$) → разметка
    карточки: дробь c-frac, степени sup/sub. Валидатор считает math 'tex' только по
    text/opts/solution, а формулы в таблицах там не учитываются — поэтому в таблицах
    только HTML. Не разобралось — Skip (остаток $ или \\)."""
    def conv(m):
        t = m.group(1)
        t = re.sub(r"\\,", "\u2009", t)
        t = t.replace("\\cdot", "·").replace("{}^\\circ", "°").replace("{,}", ",")
        for _ in range(8):
            t = re.sub(r"\\text\{([^{}]*)\}", r"\1", t)
            t = re.sub(r"\{([^{}]*)\}\^\{([^{}]*)\}", r"\1<sup>\2</sup>", t)
            t = re.sub(r"\{([^{}]*)\}_\{([^{}]*)\}", r"\1<sub>\2</sub>", t)
            t = re.sub(r"([^\s{}\\>])\^\{([^{}]*)\}", r"\1<sup>\2</sup>", t)
            t = re.sub(r"\\dfrac\{([^{}]*)\}\{([^{}]*)\}", r'<span class="c-frac"><span class="c-num">\1</span><span class="c-den">\2</span></span>', t)
            t = re.sub(r"\{([^{}]*)\}", r"\1", t)
        return t.strip()
    out = re.sub(r"\$([^$]*)\$", conv, s)
    if "$" in out or "\\" in out or "{" in out:
        raise Skip("TeX в ячейке таблицы не разобран: " + out[:80])
    return out


def _clean(h):
    h = re.sub(r"<p>(?:<b>)?(?:\s|&nbsp;)*(?:</b>)?</p>", "", h)
    h = h.replace("&nbsp;", " ")
    m = re.fullmatch(r"<div><div>(.*)</div></div>", h, re.S)
    return (m.group(1) if m else h).strip()


def _tables(raw):
    """Условие + таблицы банка → (text, data_tables). Таблицы-обёртки вёрстки ФИПИ
    (рисунок в одной ячейке, таблица в таблице) разворачиваются в текст, настоящие
    таблицы данных остаются таблицами карточки (метки [[table:k]] — с нуля)."""
    tabs = raw["tables"]
    data = []

    def text_of(s):
        return _REF.sub(lambda m: expand(int(m.group(1))), s)

    def lst(k):
        t = tabs[k]
        if any(_REF.search(c) for row in t["rows"] for c in row) or any(len(r) != 2 for r in t["rows"]):
            raise Skip("список в таблице вёрстки неизвестного вида")
        return "".join("<div>%s %s</div>" % (_inline(a), _inline(b)) for a, b in t["rows"])

    def expand(k):
        rows = tabs[k]["rows"]
        if len(rows) == 1 and len(rows[0]) == 1:
            return text_of(rows[0][0])
        if any(_REF.search(c) for r in rows for c in r):
            nonempty = [c.strip() for r in rows for c in r if c.strip()]
            if len(rows) == 1 and all(_REF.fullmatch(c) for c in nonempty):
                return "".join(expand(int(_REF.fullmatch(c).group(1))) for c in nonempty)
            if len(rows) == 2 and all(_REF.fullmatch(c.strip()) or not c.strip() for c in rows[1]):
                cols = [i for i in range(len(rows[0])) if rows[0][i].strip() or rows[1][i].strip()]
                head = [re.sub(r"<[^>]+>", "", rows[0][i]).strip() for i in cols]
                body = [lst(int(_REF.fullmatch(rows[1][i].strip()).group(1))) for i in cols]
                data.append({"head": head, "rows": [body]})
                return "[[table:%d]]" % (len(data) - 1)
            raise Skip("вложенные таблицы неизвестного вида")
        if len(rows[0]) == 1 and all(len(r) > 1 for r in rows[1:]):
            data.append({"head": None, "rows": [[_inline(c) for c in r] for r in rows[1:]]})
            return "<p>%s</p>[[table:%d]]" % (_inline(rows[0][0]), len(data) - 1)
        cells = [[_inline(c) for c in r] for r in rows]
        if any("[[fig:" in c for r in cells for c in r):
            # рисунки с подписями, сложенные ФИПИ в таблицу: у ячейки таблицы карточки нет
            # места для рисунка (метки [[fig]] — только в text), поэтому по столбцам в text
            w = max(len(r) for r in cells)
            return "".join("<div>%s</div>" % r[j] for j in range(w) for r in cells if j < len(r) and r[j])
        data.append({"head": None, "rows": cells})
        return "[[table:%d]]" % (len(data) - 1)

    return text_of(raw["html"]), data


def _split_opts(text, n):
    """Блок вариантов <div><div><b>1)</b>…</div>…</div> → (текст с меткой [[opts]], opts)."""
    i = text.find("<div><div><b>1)</b>")
    if i < 0:
        raise Skip("у задания с выбором нет блока вариантов")
    depth, j = 0, i
    for m in re.finditer(r"</?div>", text[i:]):
        depth += 1 if m.group(0) == "<div>" else -1
        if depth == 0:
            j = i + m.end()
            break
    inner = text[i + 5:j - 6]
    items = re.findall(r"<div><b>(\d+)\)</b>(.*?)</div>(?=<div><b>|\Z)", inner, re.S)
    if [int(k) for k, _ in items] != list(range(1, len(items) + 1)) or len(items) != n:
        raise Skip("варианты не разобрались: %d из %d" % (len(items), n))
    opts = []
    for _, h in items:
        h = h.strip()
        m = re.fullmatch(r"<p>(.*)</p>", h, re.S)
        if m and "<p>" not in m.group(1):
            h = m.group(1).strip()
        opts.append(re.sub(r"\s+", " ", h))
    return text[:i] + "[[opts]]" + text[j:], opts


def normalize(raw):
    card = card_base(raw)
    text, data = _tables(raw)
    text = _clean(text)
    opts = None
    a = card["answer"]
    if a["kind"] in ("choice", "multi"):
        text, opts = _split_opts(text, a["n"])
    for t in data:
        t["rows"] = [[_tex2html(c) for c in r] for r in t["rows"]]
        if t["head"]:
            t["head"] = [_tex2html(c) for c in t["head"]]
    card["text"] = text
    card["opts"] = opts
    card["table"] = data or None
    card["math"] = "tex" if re.search(r"(?<!\\)\$", text + "".join(opts or [])) else "html"
    # разбор: у всей банка физики ОГЭ шаг один — «Ответ, принятый открытым банком ФИПИ»,
    # это не разбор для ученика; solution = null, пока в банке нет настоящих разборов
    steps = [x for x in (raw["bank"].get("steps") or []) if not _STUB.match(x)]
    card["solution"] = "".join('<div class="c-line">%s</div>' % x for x in steps) or None
    bf = raw["bank"].get("fields") or []
    if a["kind"] == "fields" and len(bf) == len(a["fields"]):
        for f, b in zip(a["fields"], bf):
            if str(f.get("value")) != str(b.get("value")):
                raise Skip("ответ страницы не совпал с банком")
    return card
