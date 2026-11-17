"""Семья b_oge19 — форма Б: ОГЭ №19 (утверждения ФИПИ готовым текстом,
oge19-fipi-bank.js). Пилот S0; полную сборку и другие семьи формы Б
(русский, №18, часть 2) сессия S1a кладёт в свои файлы b_*.py.

Карточка: условие — вопрос задания, утверждения — opts (номера рисует
рендерер), ответ — multi как у живого задания (trainerTaskInfo: у задания
с одним верным утверждением тоже multi с одним номером), разбор — пояснения
банка к каждому утверждению.
"""
import html as H

from tools.cards.core import Skip, card_base, collect_catalog, in_page

FAMILY = "b_oge19"
PAGES = [
    {"slug": "oge19", "href": "oge19.html", "deps": ["oge19.html", "oge19-fipi-bank.js"]},
]
# Вопрос на странице дописан под нажатие («— отметьте его», «Отметьте все
# истинные»), а запись ответа стоит до утверждений. В карточке — как в банке ФИПИ
# (oge.fipi.ru, сверено по всем 150 заданиям, fipi-pilot/oge_math/tasks.json):
# вопрос, утверждения, после них — как записать ответ. Формулировка одна на все
# задания своего вида.
FIPI_TEXT = {
    False: ("Какое из следующих утверждений является истинным высказыванием?",
            "В ответ запишите номер истинного высказывания."),
    True: ("Какие из следующих утверждений являются истинными высказываниями?",
           "В ответ запишите номера истинных высказываний без пробелов, запятых и других дополнительных символов."),
}
# для теста: (фраза только на странице, на что заменить) и ("", фраза только в карточке)
UI_TEXT = {
    "oge19": [
        (" В ответ запишите номер истинного высказывания — отметьте его.", ""),
        ("Отметьте все истинные.", ""),
        ("Утверждения:", ""),
        ("", FIPI_TEXT[False][1]),
        ("", FIPI_TEXT[True][1]),
    ],
}


def _extra(page, raw):
    t = in_page(page, "(window.OGE19_FIPI.tasks.find(t => t.fipi === %r) || null)" % raw["fipi"])
    if not t:
        raise Skip("задания нет в банке OGE19_FIPI")
    st = in_page(page, "window.OGE19_FIPI.statements")
    raw["bank"] = {"answer": t["answer"], "multi": t["multi"],
                   "stmts": [st[i] for i in t["s"]]}
    raw["prompt"] = in_page(page, "els.questionPromptText.textContent")


def collect(page, slug, limit=None):
    return collect_catalog(page, PAGES[0]["href"], limit=limit, extra=_extra)


def normalize(raw):
    card = card_base(raw)
    b = raw["bank"]
    question, tail = FIPI_TEXT[bool(b["multi"])]
    # вопрос на странице должен быть того же вида, что в банке (иначе формулировка не та)
    if not (raw.get("prompt") or "").startswith(question):
        raise Skip("вопрос на странице не того вида: " + (raw.get("prompt") or "")[:60])
    card["text"] = "<div>%s</div>[[opts]]<div>%s</div>" % (question, tail)
    card["opts"] = [H.escape(s["text"], quote=False) for s in b["stmts"]]
    a = card["answer"]
    if a["kind"] != "multi" or a["n"] != len(card["opts"]):
        raise Skip("ответ живого задания не multi по утверждениям")
    if a["value"] != str(b["answer"]):
        raise Skip(f"ответ страницы {a['value']} не совпал с банком {b['answer']}")
    card["solution"] = "".join(
        '<div class="c-line">%d) %s</div>' % (i + 1, H.escape(s.get("explain") or "", quote=False))
        for i, s in enumerate(b["stmts"]))
    card["math"] = "html"
    return card
