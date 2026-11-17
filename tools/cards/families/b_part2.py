"""Семья b_part2 — форма Б: ОГЭ, часть 2, №20–22 (oge_part2.html?n=20…22;
банки oge-part2-fipi20/21/22.js — условие и ход решения готовым TeX).

Карточка: условие — с живой страницы (формулы KaTeX → $TeX$), ответ — trainerTaskInfo
живого задания (итоговый ответ проверяется как у страницы; для «развёрнутого»
задания это эталон), разбор — steps банка, критерии оценивания ФИПИ (0–2 балла) —
answer.criteria. №23–25 в банке ФИПИ нет (только наши задания) — карточек нет.

Не перенесено: графики к разбору №22 ([[fig:ключ]] в steps, 157 SVG из
OGE_PART2_FIGS) — у схемы нет рисунков решения: рисунок в figs показался бы под
условием и выдал ответ. Метки из разбора убираются, число таких карточек — в отчёте
(нужна правка схемы: solfigs, согласовать).
"""
import re

from tools.cards.core import Skip, card_base, collect_catalog, in_page

FAMILY = "b_part2"
_DEPS = ["oge_part2.html", "oge-part2-fipi.js", "oge-part2-figs.js", "exam-spec.js"]
PAGES = [
    {"slug": "oge_part2", "href": "oge_part2.html?n=%d" % n, "deps": _DEPS + ["oge-part2-fipi%d.js" % n]}
    for n in (20, 21, 22)
]
UI_TEXT = {}
_BANK = {}


def _bank(page, n):
    if n not in _BANK:
        _BANK[n] = {p["fipi"]: p for p in in_page(page, "window.OGE_PART2_FIPI.tasks[%d].protos" % n)}
        _BANK[(n, "crit")] = in_page(page, "window.OGE_PART2_FIPI.tasks[%d].criteria" % n)
    return _BANK[n], _BANK[(n, "crit")]


def _extra(page, raw):
    n = raw["spec"]["n"] if raw.get("spec") and raw["spec"].get("n") else None
    bank, crit = _bank(page, n)
    p = bank.get(raw["fipi"])
    if not p:
        raise Skip("нет в банке OGE_PART2_FIPI")
    raw["bank"] = {"steps": p["steps"], "fields": p["fields"], "text": p["text"], "crit": crit, "n": n}


def collect(page, slug, limit=None):
    raws, total, seen = [], 0, set()
    for pg in PAGES:
        if pg["slug"] != slug:
            continue
        r, t = collect_catalog(page, pg["href"], limit=limit, extra=_extra)
        total += t
        for x in r:
            if x["fipi"] not in seen:
                seen.add(x["fipi"])
                raws.append(x)
    return raws, total


def normalize(raw):
    card = card_base(raw)
    b = raw["bank"]
    if card["figs"]:
        raise Skip("в условии неожиданный рисунок")
    if card["answer"]["kind"] != "fields":
        raise Skip("ответ живого задания не fields: " + card["answer"]["kind"])
    live = card["answer"]["fields"][0]["value"]
    if live != b["fields"][0]["value"]:
        raise Skip("ответ страницы %r не совпал с банком %r" % (live, b["fields"][0]["value"]))
    steps = [re.sub(r"\s*\[\[fig:[\w.-]+\]\]", "", s) for s in b["steps"]]
    card["solution"] = "".join('<div class="c-line">%s</div>' % s for s in steps)
    card["answer"]["criteria"] = "".join(
        '<div class="c-line"><b>%d б.</b> %s</div>' % (pts, t) for pts, t in b["crit"])
    card["math"] = "tex"
    card["n"] = b["n"]
    return card
