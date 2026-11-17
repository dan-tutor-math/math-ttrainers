"""Семья ege_prof — форма В: ЕГЭ профиль (ege_prof.html?n=…, банки
ege-prof-fipi<n>.js). Пилот S0 — только №1; остальные номера добавляет
сессия S2e в этот же файл (PAGES: по href на номер, slug один — ege_prof).

Условие — #egeQuestion (текст с TeX, KaTeX страницы разворачивается обратно в
$…$), рисунок ФИПИ — отдельный файл, ответ — trainerTaskInfo живого задания,
разбор — steps прототипа (TeX), «Идея» группы не берём: это подсказка, а не
разбор задания.
"""
from tools.cards.core import Skip, card_base, collect_catalog, in_page

FAMILY = "ege_prof"
# slug один на все номера: файл cards/ege_prof.json — вся страница-экзамен
PAGES = [
    {"slug": "ege_prof", "href": "ege_prof.html?n=1", "deps": ["ege_prof.html", "ege-prof-fipi1.js"]},
]
UI_TEXT = {}


def _extra(page, raw):
    p = in_page(page, "(function(){ const p = protoById(S.n, S.pid); return p ? { id: p.id, fipi: p.fipi, answer: p.answer, steps: p.steps || [] } : null; })()")
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


def normalize(raw):
    card = card_base(raw)
    steps = raw["bank"].get("steps") or []
    card["solution"] = "".join('<div class="c-line">%s</div>' % s for s in steps) or None
    a = card["answer"]
    if a["kind"] == "fields" and len(a["fields"]) == 1 and a["fields"][0]["value"] != str(raw["bank"].get("answer")):
        raise Skip("ответ страницы не совпал с банком")
    return card
