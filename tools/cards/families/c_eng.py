"""Семья c_eng — форма В: ОГЭ английский (eng_oge.html?n=…, банки eng-oge-fipi<n>.js).

Одиннадцать позиций КИМ: аудирование (№1–4, №5, №6–11), чтение (№12, №13–19),
грамматика (№20–28), словообразование (№29–34), письмо (№35), устная часть
(№1, №2, №3 = n 36–38). Один «прототип» — набор: одна запись или один текст со
всеми своими вопросами, поэтому у карточки несколько полей ответа.

Откуда что берётся:
- условие — разметка банка (p.text), а не снимок живого узла: у аудирования
  (n 1, 5, 6) нет задания в панели тренажёра (subjects-catalog: panel false), а
  у снимка пропадают пропуски (.eng-gap пустой). Разметку банка страница кладёт
  в #egeQuestion как есть, поэтому видимый текст тот же (сверяет тест);
- ответ — поля прототипа через fieldsOf страницы и ttTaskFields конструктора
  (тот же код, что делает trainerTaskInfo у живого задания);
- аудио — card.audio, пути mp3 от корня сайта; файл не копируется;
- письмо и устная часть (n 35–38) — kind 'long': в value план/расшифровка
  записи, в criteria — критерии оценивания ФИПИ; автопроверки нет;
- номера ФИПИ: у набора из нескольких заданий в банке «A, B, C, D» — id карточки
  берёт первый (схема даёт ровно 6 знаков), все номера — в source.
"""
import re
from html.parser import HTMLParser

from tools.cards import validate
from tools.cards.core import Skip, answer_value, exam_number, in_page, _spread

FAMILY = "c_eng"
_NS = [1, 5, 6, 12, 13, 20, 29, 35, 36, 37, 38]
PAGES = [
    {"slug": "eng_oge", "href": f"eng_oge.html?n={n}",
     "deps": ["eng_oge.html", "eng-oge-fipi.js", f"eng-oge-fipi{n}.js", "eng-oge-bank.js"]}
    for n in _NS
]
UI_TEXT = {}

GAP = "______"  # пропуск .eng-gap: пустой span с подчёркиванием из CSS страницы


def _esc(s):
    return s.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;").replace("$", "&#36;")


class _Conv(HTMLParser):
    """Разметка банка английского → разметка карточки. Классы страницы eng-* в
    карточке не живут: номер вопроса и слово-основа — жирным, примечание — курсивом,
    пропуск — подчёркиванием, таблица — в table карточки, audio — в card.audio."""

    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.out, self.stack, self.audio, self.tables = [], [], [], []
        self._rows = self._cells = self._saved = None

    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        cls = (a.get("class") or "").split()
        open_, close = "", ""
        if tag == "audio":
            if a.get("src"):
                self.audio.append(a["src"])
        elif tag == "div":
            if "eng-text" not in cls:
                open_, close = "<div>", "</div>"
        elif tag == "p":
            if "eng-note" in cls:
                open_, close = "<p><i>", "</i></p>"
            elif "eng-title" in cls:
                open_, close = "<p><b>", "</b></p>"
            else:
                open_, close = "<p>", "</p>"
        elif tag == "span":
            if "eng-gap" in cls:
                self.out.append(GAP)
            elif {"eng-num", "eng-letter", "eng-word"} & set(cls):
                open_, close = "<b>", "</b>"
        elif tag in ("b", "i"):
            open_, close = f"<{tag}>", f"</{tag}>"
        elif tag == "br":
            self.out.append("<br>")
            return
        elif tag == "table":
            self._rows = []
        elif tag == "tr":
            self._cells = []
        elif tag in ("td", "th"):
            self._saved, self.out = self.out, []
        elif tag in ("tbody", "thead"):
            pass
        else:
            raise Skip(f"в разметке банка тег <{tag}>, плагин его не знает")
        self.out.append(open_)
        self.stack.append((tag, close))

    def handle_endtag(self, tag):
        if tag == "br":
            return
        if not self.stack or self.stack[-1][0] != tag:
            raise Skip(f"разметка банка: лишний </{tag}>")
        _, close = self.stack.pop()
        if tag in ("td", "th"):
            self._cells.append("".join(self.out).strip())
            self.out, self._saved = self._saved, None
            return
        if tag == "tr":
            self._rows.append(self._cells)
            return
        if tag == "table":
            self.tables.append({"head": None, "rows": self._rows})
            self.out.append(f"[[table:{len(self.tables) - 1}]]")
            return
        self.out.append(close)

    def handle_data(self, d):
        self.out.append(_esc(d))


def convert(src):
    """→ (html, audio, tables)"""
    c = _Conv()
    c.feed(src or "")
    c.close()
    if c.stack:
        raise Skip(f"разметка банка: не закрыты {[t for t, _ in c.stack]}")
    h = re.sub(r"\s+", " ", "".join(c.out))
    h = re.sub(r"\s*(</?(?:div|p)\b[^>]*>)\s*", r"\1", h).strip()
    return h, c.audio, c.tables


def _step_html(step):
    """Строка steps банка: «Заголовок:<div class=eng-text>…</div>» → заголовок жирным + содержимое."""
    head, sep, rest = step.partition('<div class="eng-text">')
    if not sep:
        return convert("<p>" + step + "</p>")[0]
    out = ("<p><b>%s</b></p>" % _esc(head.strip())) if head.strip() else ""
    return out + convert('<div class="eng-text">' + rest)[0]


def _criteria_html(rows):
    return "".join('<div class="c-line"><b>%s</b> — %s</div>' % (_esc(a), _esc(b)) for a, b in rows or [])


def collect(page, slug, limit=None):
    raws, total = [], 0
    for pg in PAGES:
        if pg["slug"] != slug:
            continue
        meta = page.evaluate("h => CardCollect.open(h)", pg["href"])
        n = meta["n"]
        protos = [p for p in page.evaluate("n => CardCollect.list(n)", n) if any(p.get("fipi") or [])]
        total += sum(1 for p in protos for f in p["fipi"] if f)
        crit = in_page(page, "(ENG_OGE_FIPI.tasks[%r] || {}).criteria || null" % str(n))
        for p, pos in _spread(protos, limit):
            raw = dict(meta, href=pg["href"], proto=p["id"], pos=pos, fipi=p["fipi"][pos], crit=crit)
            pid = p["tasks"][pos]
            d = in_page(page, "(function(){ const p = protoById(%d, %r); let f = null; "
                              "try { f = fieldsOf(p); } catch (e) {} return { p: p, f: f }; })()" % (n, pid))
            if not d or not d.get("p"):
                raw["err"] = "прототип %s не найден в банке страницы" % pid
            else:
                raw["bank"] = d["p"]
                raw["fieldsList"] = d["f"]
                if d["f"] and n < 35:
                    raw["fields"] = page.evaluate("l => ttTaskFields(l, 'en')", d["f"])
            raws.append(raw)
    return raws, total


def normalize(raw):
    if raw.get("err"):
        raise Skip(raw["err"])
    p = raw["bank"]
    n = exam_number(raw.get("spec"))
    if not n:
        raise Skip("номер КИМ не найден в exam-spec.js")
    ids = [x.strip() for x in str(raw["fipi"]).split(",") if x.strip()]
    if not ids or not all(re.fullmatch(r"[0-9A-Za-z]{6}", x) for x in ids):
        raise Skip("номер ФИПИ не разобрался: %r" % raw["fipi"])
    text, audio, tables = convert(p.get("text"))
    if not text:
        raise Skip("пустое условие")
    steps = [_step_html(s) for s in p.get("steps") or []]
    if n >= 35:
        # письмо, устная часть: автопроверки нет — план/расшифровка и критерии ФИПИ
        answer = {"kind": "long", "value": "".join(steps), "criteria": _criteria_html(raw.get("crit")) or None}
        solution = None
        for k in ("value", "criteria"):
            # «отметьте трудные слова» в плане подготовки — совет ученику, а не подпись кнопки страницы
            for e in validate.html_errors(answer[k] or "", "answer." + k, "html"):
                if "текст интерфейса" not in e:
                    raise Skip(e)
    else:
        fields = raw.get("fields")
        if not fields:
            raise Skip("у набора нет полей ответа (fieldsOf / ttTaskFields дали null)")
        info = {"kind": "fields", "fields": fields}
        answer = dict(info, value=answer_value(info))
        solution = "".join('<div class="c-line">%s</div>' % s for s in steps) or None
    card = {
        "v": 1,
        "id": "fipi:" + ids[0],
        "exam": (raw.get("spec") or {}).get("exam") or "",
        "slug": raw["slug"],
        "n": n,
        "proto": raw["proto"],
        "pos": raw["pos"],
        "math": "html",
        "text": text,
        "figs": [],
        "table": tables or None,
        "opts": None,
        "answer": answer,
        "solution": solution,
        "source": "Открытый банк заданий ФИПИ, " + ("задание " if len(ids) == 1 else "задания ") + ", ".join(ids),
    }
    if audio:
        card["audio"] = audio
    return card
