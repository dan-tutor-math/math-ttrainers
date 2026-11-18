"""Длинные ответы русского (часть семьи b_rus): ОГЭ №1 (сжатое изложение, аудио),
ОГЭ №13 (сочинение-рассуждение), ЕГЭ №27 (сочинение). У этих страниц нет
__trainerCatalog, поэтому задания берём прямо из банка (все, по одному на номер
ФИПИ), а критерии оценивания — из CRIT самой страницы (открываем её в кадре).

Карточка: условие, ответ kind 'long': value — эталон (образец ФИПИ-стиля из банка),
criteria — критерии оценивания страницы. Аудио в схеме карточки не предусмотрено:
в условии — строка с файлом записи (для учителя), расшифровка текста — в разборе.
У ЕГЭ №27 образцов в банке нет — value пустой (причина — в отчёте).
"""
import html as H
import re

from tools.cards.core import Skip, in_page

SLUGS = ["rus_oge01", "rus_oge13", "rus_ege27"]
_P = {
    "rus_oge01": ("RUS_OGE01", "__rusOge01", ["rus_oge01.html", "rus-oge01-fipi.js", "exam-spec.js"]),
    "rus_oge13": ("RUS_OGE13", "__rusOge13", ["rus_oge13.html", "rus-oge13-fipi.js", "exam-spec.js"]),
    "rus_ege27": ("RUS_EGE27", "__rusEge27", ["rus_ege27.html", "rus-ege27-fipi.js", "exam-spec.js"]),
}
PAGES = [{"slug": s, "href": s + ".html", "deps": _P[s][2]} for s in SLUGS]
e = lambda s: H.escape(s, quote=False)


def _open(page, href):
    page.evaluate("""async h => {
      const f = document.getElementById('f'); f.src = 'about:blank';
      await new Promise(r => setTimeout(r, 30));
      await new Promise(r => { f.onload = r; f.src = '../../' + h; });
      for (let i = 0; i < 60 && !(f.contentWindow.__rusOge01 || f.contentWindow.__rusOge13 || f.contentWindow.__rusEge27); i++)
        await new Promise(r => setTimeout(r, 100));
    }""", href)


def _crit_html(crit):
    out = []
    for c in crit:
        if c.get("g"):
            out.append('<div class="c-line"><b>%s</b></div>' % e(c["g"]))
        out.append('<div class="c-line"><b>%s</b> (до %d)</div>' % (e(c["name"]), c["max"]))
        out += ['<div class="c-line">%d — %s</div>' % (v, e(t)) for v, t in c["opts"]]
    return "".join(out)


def _sent(p):
    out = []
    for n, s in p:
        out.append("(%d)%s " % (n, e(s)) if n > 0 else e(s) + " ")
    return "<p>%s</p>" % "".join(out).strip()


def collect(page, slug, limit=None):
    var, win, deps = _P[slug]
    _open(page, slug + ".html")
    spec = page.evaluate("s => { const x = ExamSpec.find(s, null); return x ? JSON.parse(JSON.stringify(x)) : null; }", slug)
    crit = in_page(page, "window.%s.CRIT" % win)
    tasks = in_page(page, "window.%s.tasks" % var)
    texts = in_page(page, "window.%s.texts || {}" % var)
    crit_html = _crit_html(crit)
    raws = []
    for pos, t in enumerate(tasks[:limit] if limit else tasks):
        raws.append({"fipi": t["id"], "slug": slug, "spec": spec, "proto": "all", "pos": pos,
                     "task": t, "src": texts.get(t.get("t")), "crit": crit_html})
    return raws, len(tasks)


def _base(raw, text, value, solution):
    spec = raw["spec"] or {}
    if not spec.get("exam"):
        raise Skip("нет в exam-spec.js")
    n = spec.get("n") or int(re.search(r"\d+", spec["label"]).group(0))
    return {
        "v": 1, "id": "fipi:" + raw["fipi"], "exam": spec["exam"], "slug": raw["slug"], "n": n,
        "proto": "all", "pos": raw["pos"], "math": "html", "text": text, "figs": [], "table": None, "opts": None,
        "answer": {"kind": "long", "value": value, "criteria": raw["crit"]},
        "solution": solution or None,
        "source": "Открытый банк заданий ФИПИ, задание " + raw["fipi"],
    }


def normalize(raw):
    t, slug = raw["task"], raw["slug"]
    if slug == "rus_oge01":
        if not t.get("p") or not t.get("s"):
            raise Skip("нет текста или образца")
        text = ("<div><b>Прослушайте текст и напишите сжатое изложение.</b></div>"
                "<div>Аудиозапись: %s (%d мин %02d с), файл %s</div>"
                "<ul><li>Передайте главное содержание каждой из трёх микротем и всего текста.</li>"
                "<li>Сожмите текст: уберите подробности и примеры, обобщите однородное, упростите предложения.</li>"
                "<li>Каждая микротема — отдельный абзац.</li><li>Объём изложения — не менее 70 слов.</li></ul>"
                % (e(t["au"]), t["dur"] // 60, t["dur"] % 60, e(t["a"])))
        value = "".join("<p>%s</p>" % e(x["t"]) for x in t["s"])
        sol = ('<div class="c-line"><b>Текст аудиозаписи</b></div>' + "".join("<p>%s</p>" % e(p) for p in t["p"])
               + '<div class="c-line"><b>Микротемы</b></div>'
               + "".join('<div class="c-line">%d. %s</div>' % (i + 1, e(m)) for i, m in enumerate(t["mt"]))
               + '<div class="c-line"><b>Как сжато</b></div>'
               + "".join('<div class="c-line">%d. %s</div>' % (i + 1, e(x["k"])) for i, x in enumerate(t["s"])))
        return _base(raw, text, value, sol)
    if slug == "rus_oge13":
        x = raw["src"]
        if not x or not t.get("th") or not t.get("s"):
            raise Skip("нет текста, тем или образца")
        body = "".join(_sent(p) for p in x["p"])
        tail = "".join("<p>%s</p>" % e(l) for l in x.get("tail") or [])
        themes = "".join("<p><b>13.%d</b> %s</p>" % (k + 1, e(th)) for k, th in enumerate(t["th"]))
        text = ("<div><b>Прочитайте текст.</b></div><div>%s%s</div>"
                "<div><b>Выберите одну из предложенных тем сочинения и напишите сочинение-рассуждение. "
                "Приведите в сочинении два примера из прочитанного текста, подтверждающих Ваши рассуждения. "
                "Объём сочинения — не менее 70 слов.</b></div>%s" % (body, tail, themes))
        val = []
        for k, s in enumerate(t["s"]):
            if not s:
                continue
            val.append("<p><b>13.%d</b> %s</p>" % (k + 1, e(s["th"])))
            val += ["<p>%s</p>" % e(ex["t"]) for ex in s["e"]]
            val.append("<p>%s</p>" % e(s["c"]))
        if not val:
            raise Skip("образцов нет")
        return _base(raw, text, "".join(val), None)
    if slug == "rus_ege27":
        if not raw["src"]:
            raise Skip("нет текста")
        text = ("<div><b>Прочитайте текст.</b></div><div>%s</div><div><i>%s</i></div>%s"
                % (raw["src"], e(t.get("au") or ""), t["q"]))
        text = re.sub(r"<div><i></i></div>", "", re.sub(r"\s+", " ", text))
        return _base(raw, text, "", None)
    raise Skip("неизвестная страница")
