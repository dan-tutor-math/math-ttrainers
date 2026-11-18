"""Семья ege_prof — форма В: ЕГЭ профиль (ege_prof.html?n=…, банки
ege-prof-fipi<n>.js). Все номера, где у страницы есть задания ФИПИ (1–5, 7–12,
14, 16: 727 заданий); у №6, 13, 15, 17–20 в каталоге одни пустые места.
Развёрнутые №14 и №16 — answer.kind long: эталон ФИПИ (answerTex) и критерии.

Условие — #egeQuestion (текст с TeX, KaTeX страницы разворачивается обратно в
$…$), рисунок ФИПИ — отдельный файл, ответ — trainerTaskInfo живого задания,
разбор — steps прототипа (TeX), «Идея» группы не берём: это подсказка, а не
разбор задания.
"""
from tools.cards.core import Skip, card_base, collect_catalog, in_page

FAMILY = "ege_prof"
# slug один на все номера: файл cards/ege_prof.json — вся страница-экзамен
PAGES = [
    {"slug": "ege_prof", "href": "ege_prof.html?n=%d" % n,
     "deps": ["ege_prof.html", "ege-prof-fipi.js", "ege-prof-fipi%d.js" % n]}
    # №6, 13, 15, 17–20: у страницы нет заданий ФИПИ, только пустые места каталога
    for n in (1, 2, 3, 4, 5, 7, 8, 9, 10, 11, 12, 14, 16)
]
UI_TEXT = {}


def _extra(page, raw):
    p = in_page(page, "(function(){ const p = protoById(S.n, S.pid); return p ? { id: p.id, fipi: p.fipi, answer: p.answer, steps: p.steps || [], fields: p.fields || null, answerTex: p.answerTex || null, manual: p.manual || null, criteria: p.criteria || null } : null; })()")
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


def _norm(v):
    return str(v).replace(".", ",").replace(" ", "")


def _criteria_html(rows):
    """Критерии ФИПИ на весь номер: строка — баллы и условие их выставления."""
    return "".join('<div class="c-line"><b>%s</b> — %s</div>' % (pts, txt) for pts, txt in rows)


def normalize(raw):
    card = card_base(raw)
    b = raw["bank"]
    steps = b.get("steps") or []
    card["solution"] = "".join('<div class="c-line">%s</div>' % s for s in steps) or None
    a = card["answer"]
    if b.get("criteria"):
        # развёрнутый №14/16: сайт сам проверяет только числовую часть, а полный
        # ответ — эталон ФИПИ (answerTex) и критерии — оценивает человек
        if not b.get("answerTex"):
            raise Skip("у развёрнутого задания нет эталона")
        if a["kind"] != "fields":
            raise Skip("ответ живого развёрнутого задания не fields")
        live = [f["value"] for f in a["fields"]]
        bank = [f["value"] for f in (b.get("fields") or [])]
        if live != bank:
            raise Skip("ответ страницы %s не совпал с банком %s" % (live, bank))
        card["answer"] = {"kind": "long", "value": b["answerTex"], "criteria": _criteria_html(b["criteria"])}
    elif a["kind"] == "fields" and len(a["fields"]) == 1 and _norm(a["fields"][0]["value"]) != _norm(b.get("answer")):
        raise Skip("ответ страницы %r не совпал с банком %r" % (a["fields"][0]["value"], b.get("answer")))
    # формулы TeX бывают только в разборе или эталоне — тогда math тоже tex
    if any("$" in (x or "") for x in (card["text"], card["solution"], card["answer"].get("value"), card["answer"].get("criteria"))):
        card["math"] = "tex"
    return card
