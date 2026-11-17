"""Общие помощники сборщика карточек ФИПИ (задача 63).

Плагины семей (tools/cards/families/<семья>.py) импортируют отсюда:
  Skip             — исключение «задание не обработано», текст — причина в отчёт
  collect_catalog  — обход __trainerCatalog страницы: openAt + снятие узла
  convert_html     — готовая разметка банка → разметка карточки
  in_page          — выражение в окне тренажёра (банк, прототип)
  card_base        — общие поля карточки из сырого задания
  answer_value     — ответ для бланка из task (fields/choice/multi)
Сами файлы картинок пишет build.py (save_figs) — normalize ничего не пишет.
"""
import hashlib
import os
import re

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
CARDS = os.path.join(ROOT, "cards")


class Skip(Exception):
    """Задание не превращается в карточку; str(e) — причина для отчёта."""


def sha1(path):
    with open(os.path.join(ROOT, path), "rb") as f:
        return hashlib.sha1(f.read()).hexdigest()


def in_page(page, expr):
    """Значение выражения в окне тренажёра (JSON-копия). Ошибка → Skip."""
    r = page.evaluate("e => CardCollect.evalIn(e)", expr)
    if isinstance(r, dict) and "__err" in r:
        raise Skip("в странице не вычислилось " + expr[:60] + ": " + r["__err"])
    return r


def convert_html(page, html, opts=None):
    """Разметка банка (разбор, утверждение) → {html, figs, tables, tex} в словаре карточки."""
    return page.evaluate("([h, o]) => CardCollect.convertHtml(h, o)", [html, opts or {}])


def _spread(protos, limit):
    """Порядок обхода. Без limit — все задания подряд, как в каталоге. С limit
    (пилот) — разные виды: прототипы берутся через равный шаг по всему списку
    и по кругу, пока не наберётся limit."""
    queues = [[(p, pos) for pos, f in enumerate(p["fipi"]) if f] for p in protos]
    if not limit:
        return [x for q in queues for x in q]
    order = list(range(len(queues)))
    if len(queues) > limit:
        first = sorted({int(i * len(queues) / limit) for i in range(limit)})
        order = first + [i for i in order if i not in first]
    pairs = []
    while len(pairs) < limit and any(queues):
        for i in order:
            if queues[i] and len(pairs) < limit:
                pairs.append(queues[i].pop(0))
    return pairs


def collect_catalog(page, href, limit=None, grab_opts=None, extra=None):
    """Обход страницы через её __trainerCatalog — общий для всех семей.

    href — адрес страницы от корня сайта ('oge9.html', 'ege_prof.html?n=1').
    extra(page, raw) — что семья добавляет в сырое задание (банк, разбор).
    Возвращает (raws, total): raws — сырые задания, total — сколько заданий
    ФИПИ на странице по каталогу (для «обработано N из M»).
    Каждое raw: href, tid, slug, n, spec, proto, pos, fipi, html, figs, tables,
    tex, info (ответ живого задания), sel; при сбое — err.
    """
    meta = page.evaluate("h => CardCollect.open(h)", href)
    n = meta["n"]
    protos = page.evaluate("n => CardCollect.list(n)", n)
    protos = [p for p in protos if any(p.get("fipi") or [])]
    total = sum(1 for p in protos for f in p["fipi"] if f)
    raws = []
    for p, pos in _spread(protos, limit):
        raw = dict(meta, href=href, proto=p["id"], pos=pos, fipi=p["fipi"][pos], proto_title=p.get("title"))
        r = page.evaluate("([p, i, n]) => CardCollect.openAt(p, i, n)", [p["id"], pos, n])
        if not r.get("ok"):
            raw["err"] = "openAt не открыл: " + str(r.get("reason"))
        elif r.get("fipi") and r["fipi"] != raw["fipi"]:
            raw["err"] = f"openAt открыл {r['fipi']}, а в каталоге {raw['fipi']}"
        else:
            raw.update(page.evaluate("([t, o]) => CardCollect.grab(t, o)", [meta["tid"], grab_opts or {}]))
            if extra and not raw.get("err"):
                try:
                    extra(page, raw)
                except Skip as e:
                    raw["err"] = str(e)
        raws.append(raw)
    return raws, total


def exam_number(spec):
    """Номер задания в КИМ по exam-spec.js: n у страниц-копий, иначе из подписи «№9»."""
    if not spec:
        return None
    if spec.get("n"):
        return int(spec["n"])
    m = re.search(r"\d+", spec.get("label") or "")
    return int(m.group(0)) if m else None


def answer_value(info):
    """Ответ в записи для бланка: десятичная запятая, номера утверждений подряд."""
    k = info.get("kind")
    if k == "fields":
        vals = [str(f.get("value", "")).replace(".", ",") for f in info["fields"]]
        return "; ".join(vals)
    if k == "choice":
        return str(info["correct"] + 1)
    if k == "multi":
        return "".join(str(i + 1) for i in info["correct"])
    return ""


def card_base(raw):
    """Общие поля карточки. Семья дописывает text/opts/solution и т. п."""
    if raw.get("err"):
        raise Skip(raw["err"])
    if not raw.get("fipi"):
        raise Skip("нет номера ФИПИ")
    info = raw.get("info")
    if not info:
        raise Skip("у живого задания нет ответа для проверки (trainerTaskInfo → null)")
    n = exam_number(raw.get("spec"))
    if not n:
        raise Skip("номер КИМ не найден в exam-spec.js")
    answer = dict(info)
    answer.pop("hot", None)
    answer["value"] = answer_value(info)
    figs = []
    for f in raw.get("figs") or []:
        if not f.get("file"):
            raise Skip("рисунок не сохранён: " + str(f.get("why") or f.get("kind")))
        fig = {"file": f["file"], "w": f["w"], "h": f["h"], "alt": f.get("alt") or ""}
        if f.get("dw"):
            fig["maxw"] = int(f["dw"])
        figs.append(fig)
    return {
        "v": 1,
        "id": "fipi:" + raw["fipi"],
        "exam": (raw.get("spec") or {}).get("exam") or "",
        "slug": raw["slug"],
        "n": n,
        "proto": raw["proto"],
        "pos": raw["pos"],
        "math": "tex" if raw.get("tex") else "html",
        "text": raw.get("html") or "",
        "figs": figs,
        "table": raw.get("tables") or None,
        "opts": None,
        "answer": answer,
        "solution": None,
        "source": "Открытый банк заданий ФИПИ, задание " + raw["fipi"],
    }


def has_tex(*parts):
    return any(p and re.search(r"(?<!\\)\$", p) for p in parts)
