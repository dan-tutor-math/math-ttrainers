"""Сборщик карточек заданий ФИПИ (задача 63).

Запуск из корня репозитория:
  python tools/cards/build.py                       # все семьи, все страницы
  python tools/cards/build.py --family a_simple     # одна семья
  python tools/cards/build.py --slug oge9 --limit 10  # пилот: 10 заданий страницы

Что делает: поднимает локальный сервер на корне сайта, открывает в Playwright
tools/cards/harness.html (тренажёр в кадре + trainer-tasks.js, как конструктор
работ), для каждой страницы семьи зовёт collect → сырые задания, сохраняет
рисунки в cards/img/<slug>/, зовёт normalize → карточка, проверяет её
validate.py. Пишет cards/<slug>.json и отчёт tools/cards/reports/<slug>.md
(обработано / не обработано / причина).

Плагин семьи — tools/cards/families/<семья>.py (README.md рядом): FAMILY,
PAGES, collect(page, slug, limit=None) -> (raws, total), normalize(raw) -> card.
Одна страница (slug) — ровно одна семья: сборщик откажется, если две семьи
объявили один slug.
"""
import argparse
import base64
import functools
import http.server
import importlib
import io
import json
import os
import pkgutil
import socketserver
import sys
import threading
import time
import urllib.request

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(os.path.dirname(HERE))
sys.path.insert(0, ROOT)

from tools.cards import core, validate  # noqa: E402

REPORTS = os.path.join(HERE, "reports")


def families():
    """Все плагины tools/cards/families/*.py (кроме _*), slug → модуль."""
    import tools.cards.families as pkg
    out, by_slug = [], {}
    for m in sorted(pkgutil.iter_modules(pkg.__path__), key=lambda m: m.name):
        if m.name.startswith("_"):
            continue
        mod = importlib.import_module("tools.cards.families." + m.name)
        for need in ("FAMILY", "PAGES", "collect", "normalize"):
            if not hasattr(mod, need):
                raise SystemExit(f"плагин {m.name}: нет {need}")
        for p in mod.PAGES:
            if p["slug"] in by_slug and by_slug[p["slug"]] is not mod:
                raise SystemExit(f"страницу {p['slug']} объявили две семьи: {by_slug[p['slug']].FAMILY} и {mod.FAMILY}")
            by_slug[p["slug"]] = mod
        out.append(mod)
    return out, by_slug


class _Quiet(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *a):
        pass


def serve():
    handler = functools.partial(_Quiet, directory=ROOT)
    srv = socketserver.ThreadingTCPServer(("127.0.0.1", 0), handler)
    srv.daemon_threads = True
    threading.Thread(target=srv.serve_forever, daemon=True).start()
    return srv, f"http://127.0.0.1:{srv.server_address[1]}"


def save_figs(raw, slug):
    """Рисунки сырого задания → файлы cards/img/<slug>/<ФИПИ>_<k>.<ext>.
    Растр (PNG, GIF, JPEG, холст) — PNG: печать и PDF берут его без перекодировки;
    svg — как есть, с вычисленными цветами (collect.js)."""
    from PIL import Image
    d = os.path.join(core.CARDS, "img", slug)
    if raw.get("figs"):
        os.makedirs(d, exist_ok=True)
    for k, f in enumerate(raw.get("figs") or []):
        name = f"{raw['fipi']}_{k + 1}"
        try:
            if f["kind"] == "svg":
                rel = f"img/{slug}/{name}.svg"
                with open(os.path.join(core.CARDS, rel), "w", encoding="utf-8") as fh:
                    fh.write(f["markup"])
                f.update(file=rel, w=int(f["nw"]), h=int(f["nh"]))
                continue
            if f["kind"] == "canvas":
                if not f.get("data"):
                    f["why"] = "холст не отдал картинку (toDataURL)"
                    continue
                data = base64.b64decode(f["data"].split(",", 1)[1])
            else:
                data = urllib.request.urlopen(f["src"], timeout=20).read()
            img = Image.open(io.BytesIO(data))
            rel = f"img/{slug}/{name}.png"
            path = os.path.join(core.CARDS, rel)
            if img.format == "PNG":
                with open(path, "wb") as fh:
                    fh.write(data)
            else:
                img.seek(0)
                img.convert("RGBA").save(path, "PNG", optimize=True)
            f.update(file=rel, w=img.width, h=img.height)
        except Exception as e:  # noqa: BLE001 — причина уходит в отчёт
            f["why"] = f"{type(e).__name__}: {e}"
        f.pop("data", None)
        f.pop("markup", None)


def build_slug(page, mod, pg, limit):
    slug = pg["slug"]
    t0 = time.time()
    raws, total = mod.collect(page, slug, limit=limit)
    cards, bad = [], []
    for raw in raws:
        if not raw.get("err"):
            save_figs(raw, slug)
        try:
            card = mod.normalize(raw)
        except core.Skip as e:
            bad.append((raw.get("fipi") or "?", raw.get("proto"), str(e)))
            continue
        errs = validate.check_card(card)
        if errs:
            bad.append((raw["fipi"], raw.get("proto"), "валидатор: " + "; ".join(errs)))
            continue
        cards.append(card)
    deps = sorted({d for p in mod.PAGES if p["slug"] == slug for d in p.get("deps", [])})
    out = {
        "v": 1, "slug": slug, "exam": cards[0]["exam"] if cards else "", "family": mod.FAMILY,
        "src": {d: core.sha1(d) for d in deps},
    }
    if limit:
        out["partial"] = True
    out["cards"] = cards
    path = os.path.join(core.CARDS, slug + ".json")
    with open(path, "w", encoding="utf-8") as fh:
        json.dump(out, fh, ensure_ascii=False, indent=1)
        fh.write("\n")
    dt = time.time() - t0
    size = os.path.getsize(path)
    lines = [
        f"# Карточки {slug} (семья {mod.FAMILY})", "",
        f"- заданий ФИПИ на странице по каталогу: {total}",
        f"- взято в сборку: {len(raws)}" + (f" (--limit {limit})" if limit else ""),
        f"- обработано: {len(cards)} из {len(raws)}",
        f"- не обработано: {len(bad)}",
        f"- файл cards/{slug}.json: {size / 1024:.1f} КБ, в среднем {size / max(1, len(cards)) / 1024:.2f} КБ на карточку",
        f"- время сборки: {dt:.1f} с",
        "",
    ]
    if bad:
        lines += ["## Не обработано", "", "| ФИПИ | прототип | причина |", "|---|---|---|"]
        lines += [f"| {f} | {p} | {why} |" for f, p, why in bad]
    os.makedirs(REPORTS, exist_ok=True)
    with open(os.path.join(REPORTS, slug + ".md"), "w", encoding="utf-8") as fh:
        fh.write("\n".join(lines) + "\n")
    print(f"{slug}: обработано {len(cards)} из {len(raws)} (на странице {total}), не обработано {len(bad)}, {dt:.1f} с")
    for f, p, why in bad:
        print(f"  не обработано {f} ({p}): {why}")
    return len(bad) == 0


def main():
    ap = argparse.ArgumentParser(description="Сборка карточек ФИПИ")
    ap.add_argument("--family")
    ap.add_argument("--slug", action="append", help="страница; можно несколько раз")
    ap.add_argument("--limit", type=int, help="не больше N заданий со страницы (пилот)")
    ap.add_argument("--out", help="папка вместо cards/ (тест: сравнить свежую сборку с лежащей в репозитории)")
    a = ap.parse_args()
    global REPORTS
    if a.out:
        core.CARDS = validate.CARDS = os.path.abspath(a.out)
        REPORTS = os.path.join(core.CARDS, "reports")
    mods, by_slug = families()
    todo = []
    for mod in mods:
        if a.family and mod.FAMILY != a.family:
            continue
        seen = set()
        for pg in mod.PAGES:
            if pg["slug"] in seen or (a.slug and pg["slug"] not in a.slug):
                continue
            seen.add(pg["slug"])
            todo.append((mod, pg))
    if not todo:
        raise SystemExit("нечего собирать: проверь --family / --slug")
    from playwright.sync_api import sync_playwright
    srv, base = serve()
    ok = True
    try:
        with sync_playwright() as p:
            b = p.chromium.launch()
            page = b.new_page(viewport={"width": 1280, "height": 900})
            page.goto(base + "/tools/cards/harness.html")
            page.wait_for_function("() => window.CardCollect && window.trainerTaskInfo")
            for mod, pg in todo:
                ok = build_slug(page, mod, pg, a.limit) and ok
            b.close()
    finally:
        srv.shutdown()
    sys.exit(0 if ok else 1)


if __name__ == "__main__":
    main()
