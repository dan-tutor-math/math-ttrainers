"""Разбиение больших файлов карточек на части по номеру задания (задача 63, S7).

  python tools/cards/build.py --family b_rus      # как раньше: файл на страницу
  python tools/cards/split.py                     # → cards/<страница>_n<N>.json + cards/index.json
  python tools/cards/split.py --check             # только проверить, что разбиение актуально

Зачем. Конструктор и страница ученика тянут файл целиком, а нужно одно-два
задания. Замер (Chromium, gzip, 4G 1,6 Мбит/с, процессор ×4): разбор JSON — 15 мс
даже у 5 МБ, всё время — в скачивании сжатого файла (rus_ege: 1,05 МБ → 5,8 с).
Поэтому делим по сжатому размеру: страницы тяжелее LIMIT_GZ, у которых больше
одного номера КИМ, режем на файлы «страница_n<N>» — по одному номеру. Работа
из одного номера тянет ~40 КБ вместо мегабайта; полный вариант тянет столько же,
сколько раньше, но параллельными запросами.

Как устроено.
- Часть — обычный файл карточек: slug = имя файла = «страница_n<N>», у каждой
  карточки тот же slug (блок работы хранит slug карточки и грузит cards/<slug>.json
  напрямую — ни ученику, ни печати список частей не нужен).
- Рисунки остаются где были (cards/img/<страница>/…): путь в карточке не меняется.
- cards/index.json — список частей по страницам: {"v":1,"pages":{"rus_ege":[{"slug":
  "rus_ege_n1","n":[1]},…]}}. По нему конструктор находит части страницы (rus_ege.html?n=19 →
  только rus_ege_n19), а старый блок со slug страницы («rus_ege», сделан до разбиения)
  собирается из всех частей.
- Источники страницы — файлы, которые отдаёт build.py (soc_oge: soc_oge.json №1–16 и
  soc_oge_text.json №18–21 → части soc_oge_n1…n21). Разбиение стирает источники: после
  build.py его надо запускать снова. Частично пересобрали один источник — переписываются
  только его номера, остальные части остаются.
"""
import argparse
import glob
import gzip
import json
import os
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
CARDS = os.path.join(ROOT, "cards")
INDEX = os.path.join(CARDS, "index.json")

# страница → файлы, которые для неё отдаёт build.py
SOURCES = {
    "rus_ege": ["rus_ege"],
    "rus_oge": ["rus_oge"],
    "soc_oge": ["soc_oge", "soc_oge_text"],
    "soc_ege_long": ["soc_ege_long"],
    "eng_oge": ["eng_oge"],
}
LIMIT_GZ = 250 * 1024     # файл тяжелее (в сжатом виде) и с несколькими номерами — режем


def part_slug(page, n):
    return f"{page}_n{n}"


def gz_size(path):
    with open(path, "rb") as fh:
        return len(gzip.compress(fh.read(), 9))


def dump(path, d):
    with open(path, "w", encoding="utf-8") as fh:
        json.dump(d, fh, ensure_ascii=False, indent=1)
        fh.write("\n")


def load_index():
    if not os.path.isfile(INDEX):
        return {"v": 1, "pages": {}}
    with open(INDEX, encoding="utf-8") as fh:
        return json.load(fh)


def load_page(page, cards_dir=None):
    """Страница как будто без разбиения: файл страницы или все её части по index.json →
    {"slug": страница, …шапка…, "cards": [все карточки]} (slug карточек остаётся slug части).
    Для тестов и скриптов, которым нужны все карточки страницы."""
    cards_dir = cards_dir or CARDS
    idx = os.path.join(cards_dir, "index.json")
    parts = None
    if os.path.isfile(idx):
        with open(idx, encoding="utf-8") as fh:
            parts = [p["slug"] for p in json.load(fh)["pages"].get(page, [])]
    out = None
    for slug in parts or [page]:
        with open(os.path.join(cards_dir, slug + ".json"), encoding="utf-8") as fh:
            d = json.load(fh)
        if out is None:
            out = dict(d, slug=page, cards=[])
        out["cards"] += d["cards"]
    return out


def canon(cards):
    """id → карточка без slug: сравнивать карточки свежей сборки с лежащими частями (slug у них разный)."""
    return {c["id"]: {k: v for k, v in c.items() if k != "slug"} for c in cards}


def split_page(page, sources, write):
    """Источники → части. Возвращает (список частей, что изменилось)."""
    heads, cards = {}, []
    for s in sources:
        p = os.path.join(CARDS, s + ".json")
        if not os.path.isfile(p):
            continue
        with open(p, encoding="utf-8") as fh:
            d = json.load(fh)
        heads[s] = d
        cards += d["cards"]
    if not heads:
        return None, []
    by_n = {}
    for c in cards:
        by_n.setdefault(c["n"], []).append(c)
    first = next(iter(heads.values()))
    src = {}
    for d in heads.values():
        src.update(d.get("src", {}))
    changed = []
    for n in sorted(by_n):
        slug = part_slug(page, n)
        part = {"v": 1, "slug": slug, "exam": first["exam"], "family": first["family"], "src": dict(sorted(src.items()))}
        if any(d.get("partial") for d in heads.values()):
            part["partial"] = True
        part["cards"] = [dict(c, slug=slug) for c in by_n[n]]
        path = os.path.join(CARDS, slug + ".json")
        old = None
        if os.path.isfile(path):
            with open(path, encoding="utf-8") as fh:
                old = json.load(fh)
        if old != part:
            changed.append(slug)
            if write:
                dump(path, part)
    return {"page": page, "ns": sorted(by_n), "sources": list(heads)}, changed


def main(argv=None):
    ap = argparse.ArgumentParser()
    ap.add_argument("--check", action="store_true", help="ничего не писать; код 1, если разбиение не актуально")
    ap.add_argument("--page", action="append", help="только эти страницы")
    a = ap.parse_args(argv)
    write = not a.check
    idx = load_index()
    pages = idx["pages"]
    stale = []
    for page, sources in SOURCES.items():
        if a.page and page not in a.page:
            continue
        # страница уже разбита, источников нет — ничего не делаем
        src_files = [s for s in sources if os.path.isfile(os.path.join(CARDS, s + ".json"))]
        if not src_files:
            continue
        # маленькую страницу не режем: источник лёгкий и одна страница — один файл
        if page not in pages:
            total = sum(gz_size(os.path.join(CARDS, s + ".json")) for s in src_files)
            if total <= LIMIT_GZ:
                continue
        info, changed = split_page(page, sources, write)
        if not info:
            continue
        stale += changed
        # номера, которые в этот раз не пересобирали, остаются в списке
        have = {p["slug"]: p["n"] for p in pages.get(page, [])}
        for n in info["ns"]:
            have[part_slug(page, n)] = [n]
        pages[page] = [{"slug": s, "n": have[s]} for s in sorted(have, key=lambda s: have[s][0])]
        if write:
            for s in info["sources"]:
                os.remove(os.path.join(CARDS, s + ".json"))
        else:
            stale += ["источник " + s for s in info["sources"]]
        print(f"{page}: {len(info['ns'])} частей, источники {', '.join(info['sources'])}"
              + (f", переписано {len(changed)}" if changed else ", без изменений"))
    if write:
        dump(INDEX, {"v": 1, "pages": dict(sorted(pages.items()))})
    elif stale:
        print("разбиение не актуально:", ", ".join(stale))
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
