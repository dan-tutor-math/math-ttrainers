"""Семья b_oge18 — форма Б: ОГЭ №18 (клетчатая бумага; условие, разбор и ответ
готовыми в oge18-fipi-bank.js, рисунки ФИПИ — oge15_18-fipi/).

Страница задания — oge15_18.html (общая с №15–17, их берёт другая семья), поэтому
свой файл: cards/oge18.json, slug «oge18», n = 18, proto/pos — те же, что в
__trainerCatalog страницы oge15_18 (протоки fipi18_*). Конструктору для страницы
oge15_18 нужно читать оба файла.
Условие и разбор — из банка (там же ключ ans); ответ карточки — trainerTaskInfo
живого задания и сверяется с ans банка.
"""
from tools.cards.core import Skip, card_base, in_page
from tools.cards.families._b_common import conv, flatten_tables, vf_fix

FAMILY = "b_oge18"
PAGES = [
    {"slug": "oge18", "href": "oge15_18.html", "deps": ["oge15_18.html", "oge18-fipi-bank.js"]},
]
UI_TEXT = {}


def collect(page, slug, limit=None):
    meta = page.evaluate("h => CardCollect.open(h)", PAGES[0]["href"])
    protos = [p for p in page.evaluate("n => CardCollect.list(n)", meta["n"]) if p["id"].startswith("fipi18_")]
    bank = {t["fipi"]: t for t in in_page(page, "window.OGE18_FIPI.tasks")}
    pairs = [(p, i, f) for p in protos for i, f in enumerate(p["fipi"]) if f]
    total = len(pairs)
    if limit:
        pairs = pairs[::max(1, total // limit)][:limit]
    raws = []
    for p, pos, f in pairs:
        raw = dict(meta, href=PAGES[0]["href"], proto=p["id"], pos=pos, fipi=f)
        r = page.evaluate("([p, i, n]) => CardCollect.openAt(p, i, n)", [p["id"], pos, meta["n"]])
        if not r.get("ok") or r.get("fipi") != f:
            raw["err"] = "openAt не открыл задание: " + str(r)
        else:
            raw.update(page.evaluate("([t, o]) => CardCollect.grab(t, o)", [meta["tid"], {}]))
            t = bank.get(f)
            if not t:
                raw["err"] = "нет в банке OGE18_FIPI"
            else:
                raw["bank"] = {"ans": t["ans"], "checked": t.get("checked")}
                c = conv(page, flatten_tables(t["prompt"]))
                # условие — из банка, а не с живой страницы (там кнопки и поле ответа)
                raw.update(html=c["html"], figs=c["figs"], tables=c["tables"], tex=c["tex"])
                raw["solution"] = [conv(page, s)["html"] for s in t["sol"]]
        raws.append(raw)
    return raws, total


def normalize(raw):
    card = card_base(raw)
    card["n"], card["slug"] = 18, "oge18"
    if not card["figs"]:
        raise Skip("в условии нет рисунка")
    a = card["answer"]
    if a["kind"] != "fields" or abs(float(a["fields"][0]["value"]) - float(raw["bank"]["ans"])) > 1e-9:
        raise Skip("ответ страницы %s не совпал с банком %s" % (a.get("value"), raw["bank"]["ans"]))
    card["solution"] = "".join('<div class="c-line">%s</div>' % s for s in raw["solution"])
    card["math"] = "html"
    return card
