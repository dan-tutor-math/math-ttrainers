"""Семья a_simple — форма А простая: ОГЭ №6, 7, 8, 9, 14 (банк хранит параметры,
условие строит функция страницы). Пилот S0 — только ОГЭ №9; №6, 7, 8, 14
добавляет сессия S1b в этот же файл (PAGES и, если нужно, свои extra).

ОГЭ №9: условие — #questionPanel страницы (уравнение HTML-разметкой: курсив,
дроби .frac), ответ — trainerTaskInfo живого задания, разбор — explain банка
OGE9_FIPI (готовые строки .sol-line).
"""
from tools.cards.core import Skip, card_base, collect_catalog, convert_html, has_tex, in_page

FAMILY = "a_simple"
PAGES = [
    {"slug": "oge9", "href": "oge9.html", "deps": ["oge9.html", "oge9-fipi-bank.js"]},
]
# фразы интерфейса страницы, которых нет в карточке (live → card); по ним тест
# сверяет видимый текст живого задания с карточкой
UI_TEXT = {}


def _extra_oge9(page, raw):
    t = in_page(page, "(window.OGE9_FIPI.tasks.find(t => t.fipi === %r) || null)" % raw["fipi"])
    if not t:
        raise Skip("задания нет в банке OGE9_FIPI")
    raw["bank"] = {"ans": t.get("ans"), "checked": t.get("checked")}
    raw["solution"] = convert_html(page, t.get("explain") or "")


def collect(page, slug, limit=None):
    page_ = next(p for p in PAGES if p["slug"] == slug)
    extra = _extra_oge9 if slug == "oge9" else None
    return collect_catalog(page, page_["href"], limit=limit, extra=extra)


def normalize(raw):
    card = card_base(raw)
    if raw["slug"] == "oge9":
        sol = (raw.get("solution") or {}).get("html") or None
        card["solution"] = sol
        # ответ живого задания и ключ банка — одно и то же число (иначе карточку не берём)
        f = card["answer"]["fields"][0]
        if raw["bank"]["ans"] is None or abs(float(f["value"]) - float(raw["bank"]["ans"])) > 1e-9:
            raise Skip(f"ответ страницы {f['value']} не совпал с банком {raw['bank']['ans']}")
        card["math"] = "tex" if has_tex(card["text"], sol) else "html"
    return card
