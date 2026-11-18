"""Валидатор карточек ФИПИ (задача 63).

  python tools/cards/validate.py            # все cards/*.json
  python tools/cards/validate.py cards/oge9.json
Код выхода 0 — всё чисто, 1 — есть ошибки (каждая напечатана).

Проверяет:
- схему cards/_schema.json (подмножество JSON Schema: type, required, properties,
  additionalProperties, enum, const, pattern, minimum, minLength, minItems, items, $ref);
- разметку: только разрешённые теги и классы c-*, ни кнопок, ни полей, ни
  атрибутов кроме class, ни <img> внутри текста — рисунки только файлами;
- метки [[fig:k]] / [[table:k]] — в пределах figs/table, каждая не больше раза; [[opts]] — не больше раза и только при opts;
- TeX: $ парные; у math 'html' знаков $ нет;
- рисунки: файл есть, не пустой, размер совпадает с w×h (растр);
- ответ — тот же, что умеет проверить work.html: поля известных видов,
  choice/multi с номерами в пределах n, число вариантов = n;
- текста интерфейса нет («Проверить», «Источник:», «Показать решение»…);
- id карточек не повторяются между файлами; лишних файлов в cards/img нет.
"""
import glob
import json
import os
import re
import sys
from html.parser import HTMLParser

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(os.path.dirname(HERE))
CARDS = os.path.join(ROOT, "cards")
with open(os.path.join(CARDS, "_schema.json"), encoding="utf-8") as _f:
    SCHEMA = json.load(_f)

TAGS = {"b", "strong", "i", "em", "u", "s", "sub", "sup", "br", "p", "div", "span", "ol", "ul", "li", "nobr"}
CLASSES = {"c-eq", "c-frac", "c-num", "c-den", "c-op", "c-line"}
UI_WORDS = ["Проверить", "Показать решение", "Источник:", "В подборку", "Ответить", "Следующий шаг",
            "Изменить ответ", "Следующее задание", "отметьте", "Отметьте", "нажмите", "Нажмите"]
FIELD_TYPES = {"plain", "num", "nums", "set", "yesno", "pairs", "word", "term"}


def _type_ok(v, t):
    return {
        "object": isinstance(v, dict), "array": isinstance(v, list), "string": isinstance(v, str),
        "integer": isinstance(v, int) and not isinstance(v, bool), "boolean": isinstance(v, bool),
        "null": v is None, "number": isinstance(v, (int, float)) and not isinstance(v, bool),
    }[t]


def schema_errors(v, s, path="$"):
    if "$ref" in s:
        s = SCHEMA["$defs"][s["$ref"].split("/")[-1]]
    errs = []
    if "type" in s:
        ts = s["type"] if isinstance(s["type"], list) else [s["type"]]
        if not any(_type_ok(v, t) for t in ts):
            return [f"{path}: тип {type(v).__name__}, нужен {s['type']}"]
    if "const" in s and v != s["const"]:
        errs.append(f"{path}: должно быть {s['const']!r}")
    if "enum" in s and v not in s["enum"]:
        errs.append(f"{path}: {v!r} не из {s['enum']}")
    if isinstance(v, str):
        if "pattern" in s and not re.search(s["pattern"], v):
            errs.append(f"{path}: {v!r} не по образцу {s['pattern']}")
        if len(v) < s.get("minLength", 0):
            errs.append(f"{path}: пусто")
    if isinstance(v, (int, float)) and not isinstance(v, bool) and "minimum" in s and v < s["minimum"]:
        errs.append(f"{path}: меньше {s['minimum']}")
    if isinstance(v, list):
        if len(v) < s.get("minItems", 0):
            errs.append(f"{path}: меньше {s['minItems']} элементов")
        if "items" in s:
            for i, x in enumerate(v):
                errs += schema_errors(x, s["items"], f"{path}[{i}]")
    if isinstance(v, dict):
        for k in s.get("required", []):
            if k not in v:
                errs.append(f"{path}: нет поля {k}")
        props = s.get("properties", {})
        for k, x in v.items():
            if k in props:
                errs += schema_errors(x, props[k], f"{path}.{k}")
            elif s.get("additionalProperties") is False:
                errs.append(f"{path}: лишнее поле {k}")
            elif isinstance(s.get("additionalProperties"), dict):
                errs += schema_errors(x, s["additionalProperties"], f"{path}.{k}")
    return errs


class _Html(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.errs, self.stack, self.text = [], [], []

    def handle_starttag(self, tag, attrs):
        if tag not in TAGS:
            self.errs.append(f"тег <{tag}> не разрешён")
        for k, v in attrs:
            if k != "class":
                self.errs.append(f"атрибут {k} у <{tag}>")
            else:
                bad = [c for c in (v or "").split() if c not in CLASSES]
                if bad:
                    self.errs.append(f"класс {' '.join(bad)} у <{tag}>")
        if tag != "br":
            self.stack.append(tag)

    def handle_endtag(self, tag):
        if tag == "br":
            return
        if not self.stack or self.stack[-1] != tag:
            self.errs.append(f"незакрытый или лишний </{tag}>")
        else:
            self.stack.pop()

    def handle_data(self, d):
        self.text.append(d)


def html_errors(src, where, math):
    p = _Html()
    p.feed(src)
    p.close()
    errs = [f"{where}: {e}" for e in p.errs]
    if p.stack:
        errs.append(f"{where}: не закрыты {p.stack}")
    raw = re.sub(r"\\\$", "", src)
    if math == "html" and "$" in raw:
        errs.append(f"{where}: знак $ при math 'html' (литеральный доллар — &#36;)")
    if math == "tex":
        dollars = raw.count("$") - 2 * raw.count("$$")
        if raw.count("$$") % 2 or dollars % 2:
            errs.append(f"{where}: непарные $")
    text = "".join(p.text)
    for w in UI_WORDS:
        # «Следующий шаг» — подпись кнопки, а не фраза в середине предложения (в тексте ФИПИ
        # №17–20 обществознания: «Следующий шаг – выявление специфики…»): только целиком в узле
        hit = re.search(r"(^|>)\s*Следующий шаг\s*(<|$)", text) if w == "Следующий шаг" else w in text
        if hit:
            errs.append(f"{where}: текст интерфейса «{w}»")
    return errs


def answer_errors(a, opts):
    errs = []
    k = a.get("kind")
    if k == "fields":
        fs = a.get("fields") or []
        if not fs:
            errs.append("answer: нет полей")
        for f in fs:
            if f.get("type") not in FIELD_TYPES:
                errs.append(f"answer: поле {f.get('id')} вида {f.get('type')} work.html не проверит")
            if not str(f.get("value", "")).strip() and f.get("type") != "nums":
                errs.append(f"answer: у поля {f.get('id')} пустой ответ")
    elif k in ("choice", "multi"):
        n, c = a.get("n"), a.get("correct")
        if not isinstance(n, int) or n < 1:
            errs.append("answer: нет n")
        elif k == "choice" and not (isinstance(c, int) and 0 <= c < n):
            errs.append("answer: correct вне вариантов")
        elif k == "multi" and not (isinstance(c, list) and c and all(isinstance(i, int) and 0 <= i < n for i in c) and c == sorted(set(c))):
            errs.append("answer: correct у multi — номера по возрастанию в пределах n")
        if opts is not None and isinstance(n, int) and len(opts) != n:
            errs.append(f"answer: n={n}, а вариантов {len(opts)}")
        if opts is None:
            errs.append("answer: у choice/multi нет opts")
    elif k == "long":
        pass
    if k != "long" and not str(a.get("value", "")).strip():
        errs.append("answer: пустой value")
    return errs


def check_card(c, check_files=True):
    """Ошибки одной карточки (пустой список — карточка годна)."""
    errs = schema_errors(c, SCHEMA["$defs"]["card"], c.get("id", "?") if isinstance(c, dict) else "?")
    if errs:
        return errs
    math = c["math"]
    errs += html_errors(c["text"], "text", math)
    for i, o in enumerate(c["opts"] or []):
        errs += html_errors(o, f"opts[{i}]", math)
    if c["solution"]:
        errs += html_errors(c["solution"], "solution", math)
    for i, t in enumerate(c["table"] or []):
        for r in ([t.get("head")] if t.get("head") else []) + t["rows"]:
            for x in r:
                errs += html_errors(x, f"table[{i}]", math)
    if "<img" in c["text"]:
        errs.append("text: картинка внутри текста — нужна в figs")
    for kind, lst in (("fig", c["figs"]), ("table", c["table"] or [])):
        used = re.findall(r"\[\[" + kind + r":(\d+)\]\]", c["text"])
        for k in used:
            if int(k) >= len(lst):
                errs.append(f"text: [[{kind}:{k}]] — нет такого")
        if len(used) != len(set(used)):
            errs.append(f"text: [[{kind}:k]] повторяется")
    n_opts = c["text"].count("[[opts]]")
    if n_opts > 1 or (n_opts and not c["opts"]):
        errs.append("text: [[opts]] больше одного раза или без opts")
    if math == "tex" and not any(re.search(r"(?<!\\)\$", x or "") for x in [c["text"], c["solution"]] + (c["opts"] or [])):
        errs.append("math 'tex', а формул TeX нет")
    errs += answer_errors(c["answer"], c["opts"])
    if check_files:
        for f in c["figs"]:
            path = os.path.join(CARDS, f["file"])
            if not os.path.isfile(path) or os.path.getsize(path) == 0:
                errs.append(f"рисунок {f['file']}: файла нет или он пустой")
            elif f["file"].endswith(".png"):
                from PIL import Image
                with Image.open(path) as im:
                    if (im.width, im.height) != (f["w"], f["h"]):
                        errs.append(f"рисунок {f['file']}: {im.width}×{im.height}, а в карточке {f['w']}×{f['h']}")
        for a in c.get("audio") or []:
            path = os.path.join(ROOT, a)
            if not os.path.isfile(path) or os.path.getsize(path) == 0:
                errs.append(f"аудио {a}: файла нет или он пустой")
    return errs


def check_file(path, seen):
    with open(path, encoding="utf-8") as fh:
        d = json.load(fh)
    errs = schema_errors({k: v for k, v in d.items() if k != "cards"}, dict(SCHEMA, required=[r for r in SCHEMA["required"] if r != "cards"]), os.path.basename(path))
    name = os.path.basename(path)[:-5]
    if d.get("slug") != name:
        errs.append(f"{name}: slug {d.get('slug')} не совпал с именем файла")
    files = set()
    seen = {}   # id уникален внутри файла страницы: конструктор и ученик ищут карточку по (slug, id); ФИПИ-номера у разных экзаменов совпадают случайно, а ОГЭ №18 есть и на oge18, и на oge15_18
    for c in d.get("cards", []):
        for e in check_card(c):
            errs.append(f"{c.get('id')}: {e}")
        if c.get("slug") != d.get("slug"):
            errs.append(f"{c.get('id')}: slug карточки {c.get('slug')} ≠ {d.get('slug')}")
        if c.get("id") in seen:
            errs.append(f"{c.get('id')}: id уже есть в {seen[c['id']]}")
        seen[c.get("id")] = name
        files |= {f["file"] for f in c.get("figs", [])}
    img_dir = os.path.join(CARDS, "img", name)
    if os.path.isdir(img_dir):
        for fn in sorted(os.listdir(img_dir)):
            if f"img/{name}/{fn}" not in files:
                errs.append(f"{name}: файл img/{name}/{fn} не нужен ни одной карточке")
    return errs, len(d.get("cards", []))


def main(argv):
    paths = argv or sorted(p for p in glob.glob(os.path.join(CARDS, "*.json")) if not os.path.basename(p).startswith("_"))
    seen, bad, total = {}, 0, 0
    for p in paths:
        errs, n = check_file(p, seen)
        total += n
        print(f"{os.path.basename(p)}: карточек {n}, ошибок {len(errs)}")
        for e in errs:
            print("  " + e)
        bad += len(errs)
    print("готово" if not bad else f"ошибок: {bad}")
    return 1 if bad else 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
