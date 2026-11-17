"""
Группы заданий в работе (works.html) из русского ОГЭ/ЕГЭ и ОГЭ №8, №12 — после этапа 10б
конструктора вариантов у этих страниц есть каталог, и конструктор должен собирать их
задания по местам банка.

Проверяет и две поломки, найденные при сведении волны 5:
  A. у русского нет tsGetState — невидимый кадр (genFrameFor, trainer-tasks.js) считал
     страницу незагруженной: «тренажёр не загрузился»;
  B. четыре разных тренажёра подряд, а кадров три: каталог четвёртого (catalogOf)
     открывался в обход очереди genQ и выкидывал кадр, где снималось задание, —
     «в тренажёре не нашлось задания».
Плюс предпросмотр «Собрать вариант» (planRow) по этим номерам.

Запуск: ~/.venvs/trainers/bin/python test_prompt_works_rus_series.py
"""
import json
import sys
import time

from playwright.sync_api import sync_playwright

import test_prompt84_deck_slides as T

T.PORT = 9137
T.BASE = f"http://127.0.0.1:{T.PORT}"
fails = []

# четыре тренажёра по 2 задания: больше, чем держит genFrames (3 кадра)
SERIES = [
    {"tid": "rus5", "href": "rus_oge.html?n=5", "exam": "ОГЭ русский", "n": 5, "proto": "dash"},
    {"tid": "ruse9", "href": "rus_ege.html?n=9", "exam": "ЕГЭ русский", "n": 9, "proto": "all"},
    {"tid": "oge8", "href": "oge8.html", "exam": "ОГЭ №8", "n": None, "proto": "p1"},
    {"tid": "oge12", "href": "oge12.html", "exam": "ОГЭ №12", "n": None, "proto": "f1"},
]
ROWS = [
    {"exam": "rus_oge", "slug": "rus_oge", "n": 5},
    {"exam": "rus_ege", "slug": "rus_ege", "n": 9},
    {"exam": "oge", "slug": "oge8", "n": None},
    {"exam": "oge", "slug": "oge12", "n": None},
]


def check(cond, msg, extra=""):
    print(("OK   " if cond else "FAIL ") + msg + (f"  [{extra}]" if extra and not cond else ""))
    if not cond:
        fails.append(msg)


def main():
    errors = []
    with T.local_server(), sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page(viewport={"width": 1280, "height": 900})
        page.on("pageerror", lambda e: errors.append(str(e)))
        page.goto(f"{T.BASE}/works.html#/new")
        page.wait_for_function("() => window.__works && window.__works.addSeries", timeout=15000)

        # предпросмотр: номера собираются, а не «нет каталога»
        pv = page.evaluate("""async (rows) => { await window.__works.openBuild(null);
            await new Promise(r => setTimeout(r, 1500));
            return rows.map(r => window.__works.planRow(Object.assign({ count: 2, source: 'order' }, r))); }""", ROWS)
        for r, x in zip(ROWS, pv):
            check(x["ok"], f"предпросмотр {r['slug']} {r['n'] or ''}: собирается", x.get("text", ""))
        check("ФИПИ 1–2 из" in pv[0]["text"], "предпросмотр русского: «ФИПИ 1–2 из …»", pv[0]["text"])
        check("наших на основе ФИПИ: 2" in pv[3]["text"], "предпросмотр №12 (банка нет): наш генератор", pv[3]["text"])

        page.goto(f"{T.BASE}/works.html#/new")
        page.wait_for_function("() => window.__works && window.__works.addSeries", timeout=15000)
        res = page.evaluate("""async (list) => { const out = [];
            for (const s of list) {
              try { await window.__works.addSeries(Object.assign({ count: 2, source: 'order', startPos: 0 }, s)); out.push('ok'); }
              catch (e) { out.push(e.message); } }
            return out; }""", SERIES)
        check(res == ["ok"] * 4, "addSeries по всем четырём тренажёрам", str(res))

        blocks = []
        for _ in range(90):
            blocks = page.evaluate("""() => window.__works.E.variants[0].blocks.map(b => ({ tid: b.tid,
                pos: b.series && b.series.pos, fipi: b.series && b.series.fipi, gen: b._gen || 'done',
                why: b._why || null, img: !!b.img }))""")
            if blocks and all(b["gen"] not in ("busy", "wait") for b in blocks):
                break
            time.sleep(1)
        check(len(blocks) == 8, "в работе 8 заданий", str(len(blocks)))
        bad = [b for b in blocks if b["gen"] != "done" or not b["img"]]
        check(not bad, "все 8 сняты, с картинкой (A: кадр русского готов, B: кадры не выкидываются)",
              json.dumps(bad, ensure_ascii=False))
        for tid in ("rus5", "ruse9", "oge8"):
            mine = [b for b in blocks if b["tid"] == tid]
            check([b["pos"] for b in mine] == [0, 1] and all(b["fipi"] for b in mine),
                  f"{tid}: места 1–2 банка с номерами ФИПИ", json.dumps(mine, ensure_ascii=False))
        o12 = [b for b in blocks if b["tid"] == "oge12"]
        check(all(b["fipi"] is None for b in o12), "oge12: задания нашего генератора (номера ФИПИ нет)",
              json.dumps(o12, ensure_ascii=False))
        browser.close()
    check(not errors, "нет ошибок JavaScript", "; ".join(errors[:3]))
    if fails:
        print("Провалы:", len(fails))
        sys.exit(1)
    print("готово")


if __name__ == "__main__":
    main()
