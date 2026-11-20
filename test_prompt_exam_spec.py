"""
Этап 1 конструктора вариантов: exam-spec.js — структура экзаменов в одном месте.

Проверяет:
  A. у каждого экзамена номера подряд (по каждой странице), у каждого
     номера есть slug, label, part (1/2/null), points (число/null), answer;
  B. сумма первичных баллов совпадает с максимумом: ОГЭ математика 31,
     ЕГЭ база 21, ЕГЭ профиль 32 (у экзаменов, где баллы не подтверждены, —
     везде null, а не догадка);
  C. ExamSpec.find(slug, n) находит номер и экзамен;
  D. exam-nav на oge9, ege_prof, rus_oge видит тот же экзамен и тот же
     список номеров, что и раньше (список до выноса — ниже, зафиксирован).

Запуск: python3 test_prompt_exam_spec.py (сервер поднимается сам).
"""
import sys

from playwright.sync_api import sync_playwright

import test_prompt54_trainer_sync_and_cards as t54

PORT = 8975
t54.PORT = PORT
BASE = f"http://127.0.0.1:{PORT}"

# максимум первичного балла по спецификациям КИМ 2027 (fipi-pilot/demo); у экзаменов,
# где наши позиции покрывают весь КИМ, сумма должна совпасть
MAX_POINTS = {"oge": 31, "ege_base": 21, "ege_prof": 32, "soc_oge": 32, "soc_ege": 58, "rus_ege": 50, "eng_oge": 68}
# неполные (на сайте не все номера КИМ): сумма по имеющимся позициям — физика ОГЭ №1–16
# из 22 (23 из 39; №17–22 развёрнутые, 16 баллов), информатика ОГЭ №1–10 из 16 (10 из 21)
PARTIAL_POINTS = {"phys_oge": 23, "inf_oge": 10}
# экзамены без документа 2027 — баллы остаются null: ОГЭ русский
NO_DOC = {"rus_oge"}

# список номеров, который exam-nav.js держал у себя до выноса в exam-spec.js
OLD_OGE = (["oge1_5", "oge6", "oge7", "oge8", "oge9", "oge10", "oge11", "oge12", "oge13", "oge14",
            "oge15_18", "oge19"] + [f"oge_part2:{n}" for n in range(20, 26)])
OLD_RUS = ["rus_oge01"] + [f"rus_oge:{n}" for n in range(2, 13)] + ["rus_oge13"]
OLD_PROF = [f"ege_prof:{n}" for n in range(1, 20)]  # утверждённый КИМ ЕГЭ-2027

# страница → (экзамен, список номеров до выноса)
NAV_PAGES = [("oge9.html", "oge", OLD_OGE), ("ege_prof.html?n=1", "ege_prof", OLD_PROF),
             ("rus_oge.html?n=2", "rus_oge", OLD_RUS),
             ("phys_oge.html?n=1", "phys_oge", [f"phys_oge:{n}" for n in range(1, 17)]),
             ("soc_ege.html?n=1", "soc_ege", [f"{'soc_ege' if n <= 16 else 'soc_ege_long'}:{n}" for n in range(1, 26)]),
             ("rus_ege.html?n=1", "rus_ege", [f"rus_ege:{n}" for n in range(1, 27)] + ["rus_ege27"])]

# все экзамены, у которых до выноса были стрелки, и число их позиций
OLD_COUNTS = {"oge": 18, "ege_base": 21, "ege_prof": 19, "soc_oge": 20, "phys_oge": 16, "inf_oge": 10,
              "soc_ege": 25, "rus_oge": 13, "rus_ege": 27, "eng_oge": 11}


def check_spec(page, failures):
    page.goto(f"{BASE}/ege_prof.html?n=1")
    page.wait_for_function("() => window.ExamSpec")
    spec = page.evaluate("() => JSON.parse(JSON.stringify(window.ExamSpec.exams))")
    if sorted(spec) != sorted(OLD_COUNTS):
        failures.append(f"A: набор экзаменов {sorted(spec)}")
    for eid, cnt in OLD_COUNTS.items():
        if eid in spec and len(spec[eid]["list"]) != cnt:
            failures.append(f"A/{eid}: {len(spec[eid]['list'])} позиций, до выноса было {cnt}")
    for eid, ex in spec.items():
        by_slug = {}
        for p in ex["list"]:
            for k in ("slug", "label", "part", "points", "answer"):
                if k not in p:
                    failures.append(f"A/{eid}/{p.get('slug')}: нет поля {k}")
            if p["part"] not in (1, 2, None):
                failures.append(f"A/{eid}/{p['slug']}: part={p['part']}")
            if p["answer"] not in ("short", "long", None):
                failures.append(f"A/{eid}/{p['slug']}: answer={p['answer']}")
            if p["points"] is not None and not isinstance(p["points"], int):
                failures.append(f"A/{eid}/{p['slug']}: points={p['points']}")
            if "n" in p:
                by_slug.setdefault(p["slug"], []).append(p["n"])
        if eid != "eng_oge":  # в английском n — первый номер набора, не по порядку
            for slug, ns in by_slug.items():
                if ns != list(range(ns[0], ns[0] + len(ns))):
                    failures.append(f"A/{eid}/{slug}: номера не подряд {ns}")
        pts = [p["points"] for p in ex["list"]]
        if eid in MAX_POINTS:
            if None in pts or sum(pts) != MAX_POINTS[eid]:
                failures.append(f"B/{eid}: сумма баллов {sum(x or 0 for x in pts)}, нужно {MAX_POINTS[eid]}")
        elif eid in PARTIAL_POINTS:
            if None in pts or sum(pts) != PARTIAL_POINTS[eid]:
                failures.append(f"B/{eid}: сумма баллов {sum(x or 0 for x in pts)}, нужно {PARTIAL_POINTS[eid]}")
        elif eid in NO_DOC and any(x is not None for x in pts):
            failures.append(f"B/{eid}: документа 2027 нет — баллы должны быть null")
        # answer у экзаменов с документом задан везде
        if eid in MAX_POINTS or eid in PARTIAL_POINTS:
            if any(p["answer"] is None for p in ex["list"]):
                failures.append(f"B/{eid}: у позиции нет answer")
    # точечные сверки с документом
    def pt(eid, slug, n=None):
        return next(p for p in spec[eid]["list"] if p["slug"] == slug and (n is None or p.get("n") == n))
    if (pt("soc_oge", "soc_oge", 12)["points"], pt("soc_oge", "soc_oge", 14)["points"],
            pt("soc_oge", "soc_oge", 14)["answer"], pt("soc_oge", "soc_oge", 12)["answer"]) != (4, 2, "short", "long"):
        failures.append("B: ОГЭ обществознание №12 / №14")
    if (pt("rus_ege", "rus_ege27")["points"], pt("rus_ege", "rus_ege27")["part"], pt("rus_ege", "rus_ege", 8)["points"]) != (22, 2, 2):
        failures.append("B: ЕГЭ русский №8 / №27")
    if sum(p["points"] for p in spec["soc_ege"]["list"] if p["part"] == 1) != 28 or \
            sum(p["points"] for p in spec["soc_ege"]["list"] if p["part"] == 2) != 30:
        failures.append("B: ЕГЭ обществознание части 28 + 30")
    if sum(p["points"] for p in spec["eng_oge"]["list"] if p["part"] == 1) != 53 or \
            sum(p["points"] for p in spec["eng_oge"]["list"] if p["part"] == 2) != 15:
        failures.append("B: ОГЭ английский письменная 53 + устная 15")
    print(f"  A, B: {len(spec)} экзаменов, номера подряд, суммы баллов {MAX_POINTS}, неполные {PARTIAL_POINTS}")
    f = page.evaluate("""() => [ExamSpec.find('oge_part2', 22), ExamSpec.find('oge9'), ExamSpec.find('ege_prof', 13),
                              ExamSpec.find('rus_oge', 5), ExamSpec.find('oge_part2', 99), ExamSpec.find('nope')]""")
    ok = (f[0] and f[0]["exam"] == "oge" and f[0]["part"] == 2 and f[0]["answer"] == "long"
          and f[1] and f[1]["exam"] == "oge" and f[1]["points"] == 1
          and f[2] and f[2]["exam"] == "ege_prof"
          and f[3] and f[3]["exam"] == "rus_oge" and f[4] is None and f[5] is None)
    if not ok:
        failures.append(f"C: find() вернул {f}")
    print("  C: find(slug, n) находит номер и экзамен")


def check_nav(browser, failures, errors):
    for url, title, old in NAV_PAGES:
        ctx = browser.new_context()
        page = t54.new_page(ctx, errors)
        page.goto(f"{BASE}/{url}")
        page.wait_for_function("() => window.ExamNav && document.getElementById('examNextBtn')", timeout=8000)
        res = page.evaluate("""() => ({ list: ExamNav.list.map(p => p.slug + (p.n ? ':' + p.n : '')),
            id: ExamNav.exam })""")
        if res["list"] != old:
            failures.append(f"D/{url}: список exam-nav {res['list']} != прежний {old}")
        if res["id"] != title:
            failures.append(f"D/{url}: экзамен {res['id']} != {title}")
        ctx.close()
    print("  D: exam-nav на oge9, ege_prof, rus_oge, phys_oge, soc_ege, rus_ege видит прежний список номеров")


def run():
    failures, errors = [], []
    with t54.local_server(), sync_playwright() as p:
        browser = p.chromium.launch()
        ctx = browser.new_context()
        page = t54.new_page(ctx, errors)
        check_spec(page, failures)
        ctx.close()
        check_nav(browser, failures, errors)
        browser.close()
    failures.extend("ошибка JS: " + e for e in errors)
    if failures:
        print("\nПРОВАЛ:")
        for f in failures:
            print("  - " + f)
        sys.exit(1)
    print("\nВсё прошло.")


if __name__ == "__main__":
    run()
