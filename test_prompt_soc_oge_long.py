"""
Тренажёр «ОГЭ. Обществознание — развёрнутый ответ» (soc_oge_long.html): №1, 7, 8, 12,
18–20 по КИМ 2027 из открытого банка ФИПИ, самопроверка по критериям ФИПИ 2027.

Проверяет:
  1. данные soc-oge-long-fipi.js целы: только развёрнутые номера 2027, у каждого задания
     есть список «что должно быть в ответе» без описаний ситуации и цитат, у №18–20 —
     общий текст, у №7 и №12 — картинка, и файл картинки лежит в soc-oge-img/;
     в условии не осталось «Ответ запишите на бланке» и скриптов ФИПИ;
  2. задание: условие, картинка на белой подложке, текст к №18–20 в окне с прокруткой;
     черновик сохраняется и возвращается после перезагрузки;
  3. «Проверить себя»: список требований из условия, критерии номера с максимумом
     ФИПИ 2027, пометка у фото старого образца; выбор балла сохраняется, считается
     в «баллов из возможных», появляется «Следующее задание»; оценённое задание
     открывается сразу с самопроверкой;
  4. навигация: ◀ ▶ заданий по кругу, «Следующий номер» с №18 — №19 к тому же
     тексту, с №8 — на краткий №9 (soc_oge.html), с №20 по кругу — на №1;
     «← все задания» и адрес без номера — на главную;
  5. телефон и тёмная тема: без ошибок JS и горизонтальной прокрутки, картинка не
     шире экрана.

Совместного режима у страницы нет — проверять на сайте руками нечего.

Запуск: ~/.venvs/trainers/bin/python test_prompt_soc_oge_long.py (сервер поднимается сам).
"""
import contextlib
import http.client
import json
import os
import re
import subprocess
import sys
import time

from playwright.sync_api import sync_playwright

PORT = 8996
BASE = f"http://127.0.0.1:{PORT}"
HERE = os.path.dirname(os.path.abspath(__file__))
LONG = [1, 7, 8, 12, 18, 19, 20]
MAX = {1: 2, 7: 2, 8: 2, 12: 4, 18: 2, 19: 2, 20: 3}


@contextlib.contextmanager
def local_server():
    proc = subprocess.Popen(
        [sys.executable, "-m", "http.server", str(PORT)], cwd=HERE,
        stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL,
    )
    try:
        for _ in range(50):
            try:
                conn = http.client.HTTPConnection("127.0.0.1", PORT, timeout=0.2)
                conn.request("GET", "/soc_oge_long.html")
                conn.getresponse()
                break
            except Exception:
                time.sleep(0.1)
        else:
            raise RuntimeError("локальный сервер не поднялся")
        yield
    finally:
        proc.terminate()


def load_data():
    s = open(os.path.join(HERE, "soc-oge-long-fipi.js"), encoding="utf-8").read()
    return json.loads(s[s.index("=") + 1:].strip().rstrip(";"))


FAILS = []


def check(cond, msg):
    print(("  ок  " if cond else "  ОШИБКА  ") + msg)
    if not cond:
        FAILS.append(msg)


def test_data(D):
    print("1. данные")
    T = D["tasks"]
    check(sorted({t["n"] for t in T}) == LONG, f"номера — только развёрнутые КИМ 2027: {sorted({t['n'] for t in T})}")
    check(all(t["r"] for t in T), "у каждого задания есть список требований")
    descr = [t["id"] for t in T for r in t["r"] if not (re.sub(r"\s*\([^()]*\)\s*$", "", r).endswith("?") or re.search(r"(?i)\b(выпишите|объясните|приведите|сформулируйте|выскажите|укажите|назовите|составьте|раскройте|поясните|проиллюстрируйте|дайте|подтвердите|покажите|используя|озаглавьте|предположите|опишите|определите|"
                     r"конкретизируйте|докажите|аргументируйте|обоснуйте|выделите|найдите|сравните|охарактеризуйте)", r))]
    check(not descr, f"в требованиях нет описаний ситуации ({descr[:5]})")
    check(all(t.get("t") in D["texts"] for t in T if t["n"] in (18, 19, 20)), "у №18–20 есть общий текст")
    no_img = [t["id"] for t in T if t["n"] == 7 and "<img" not in t["q"]]
    check(not no_img, f"у каждого фото (№7) есть картинка ({no_img[:3]})")
    srcs = [m for t in T for m in re.findall(r'src="([^"]+)"', t["q"])]
    missing = [s for s in srcs if not os.path.exists(os.path.join(HERE, s))]
    check(srcs and not missing, f"файлы картинок на месте: {len(srcs)}, нет {missing[:3]}")
    junk = [t["id"] for t in T if "бланке ответов" in t["q"] or "ShowPicture" in t["q"] or "<script" in t["q"]]
    check(not junk, f"в условиях нет строки про бланк и скриптов ФИПИ ({junk[:3]})")
    check(any(t.get("o26") for t in T if t["n"] == 7), "фото старого образца помечены")


def first(D, n, pred=lambda t: True):
    return next(t for t in D["tasks"] if t["n"] == n and pred(t))


def main():
    D = load_data()
    test_data(D)
    errors = []
    with local_server(), sync_playwright() as p:
        b = p.chromium.launch()

        def new_page(w=1100, h=900, theme="light"):
            ctx = b.new_context(viewport={"width": w, "height": h})
            pg = ctx.new_page()
            pg.on("pageerror", lambda e: errors.append(str(e)))
            pg.add_init_script(f"try{{localStorage.setItem('theme','{theme}')}}catch(e){{}}")
            return pg

        print("2. задание и черновик")
        pg = new_page()
        t7 = first(D, 7, lambda t: t.get("o26"))
        pg.goto(BASE + f"/soc_oge_long.html?n=7&t={t7['id']}")
        check(pg.locator(".q img.fig").count() == 1, "№7: фото в условии")
        nat = pg.eval_on_selector(".q img.fig", "i => i.complete && i.naturalWidth")
        check(bool(nat), "картинка загрузилась")
        check(pg.eval_on_selector(".q img.fig", "i => getComputedStyle(i).backgroundColor") == "rgb(255, 255, 255)", "картинка на белой подложке")
        pg.fill("#draft", "Функция семьи — воспитательная.")
        pg.reload()
        check(pg.input_value("#draft") == "Функция семьи — воспитательная.", "черновик возвращается после перезагрузки")
        t19 = first(D, 19)
        pg.goto(BASE + f"/soc_oge_long.html?n=19&t={t19['id']}")
        check(pg.is_visible(".text-box .text-body"), "№19: общий текст на экране")
        check(pg.eval_on_selector(".text-body", "e => getComputedStyle(e).overflowY") == "auto", "текст — в окне с прокруткой")

        print("3. самопроверка")
        pg.goto(BASE + f"/soc_oge_long.html?n=7&t={t7['id']}")
        check(not pg.is_visible("#nextBtn"), "до самопроверки «Следующее задание» нет")
        pg.click("#checkBtn")
        reqs = pg.eval_on_selector_all(".req span", "els => els.map(e => e.textContent)")
        check(reqs == t7["r"], "список «что должно быть в ответе» — из условия задания")
        check(pg.is_visible(".old-note"), "у фото старого образца — пометка про ОГЭ-2027")
        check(pg.locator(".score-btn").count() == MAX[7] + 1, "баллы 0…2 у №7")
        check("максимум 2 балла" in pg.inner_text(".check-block h3 >> nth=1"), "критерии с максимумом ФИПИ 2027")
        pg.click('.score-btn[data-b="1"]')
        check("1 из 2" in pg.inner_text("#scoreSaved"), "оценка сохранена")
        check(pg.is_visible("#nextBtn"), "после оценки — «Следующее задание»")
        check(pg.inner_text("#statScore").strip() == "1 из 2", "баллы считаются в номере")
        sc = pg.evaluate("JSON.parse(localStorage.getItem('socOgeLong:scores'))")
        check(sc.get(t7["id"]) == 1, "оценка запомнена")
        pg.reload()
        check(pg.is_visible(".check-panel") and "active" in pg.get_attribute('.score-btn[data-b="1"]', "class"), "оценённое задание открывается с самопроверкой")
        for n in LONG:
            pg.goto(BASE + f"/soc_oge_long.html?n={n}")
            if pg.is_visible("#checkBtn"):  # у №7 откроется уже оценённое задание — без кнопки
                pg.click("#checkBtn")
            check(pg.locator(".score-btn").count() == MAX[n] + 1, f"№{n}: шкала 0…{MAX[n]}")

        print("4. навигация")
        L = [t for t in D["tasks"] if t["n"] == 18]
        pg.goto(BASE + f"/soc_oge_long.html?n=18&t={L[-1]['id']}")
        pg.click("#nextBtnTop")
        check(pg.evaluate("window.__socOgeLong.S.idx") == 0, "▶ с последнего задания — на первое")
        pg.click("#prevBtn")
        tx = pg.evaluate("window.__socOgeLong.S.list[window.__socOgeLong.S.idx].t")
        pg.click("#nextTypeBtn")
        cur = pg.evaluate("window.__socOgeLong.S.list[window.__socOgeLong.S.idx]")
        check(cur["n"] == 19 and cur["t"] == tx, "«Следующий номер» с №18 — №19 к тому же тексту")
        pg.goto(BASE + "/soc_oge_long.html?n=20")
        pg.click("#nextTypeBtn")
        check(pg.evaluate("window.__socOgeLong.S.n") == 1, "с №20 вперёд по кругу — на №1")
        pg.goto(BASE + "/soc_oge_long.html?n=8")
        pg.click("#nextTypeBtn")
        pg.wait_for_url(lambda u: "soc_oge.html" in u, timeout=5000)
        check("soc_oge.html?n=9" in pg.url, "с №8 вперёд — на краткий №9")
        pg.goto(BASE + "/soc_oge_long.html?n=12")
        pg.click("#backBtn")
        pg.wait_for_url(lambda u: "/index.html" in u, timeout=5000)
        check("subject=soc" in pg.url or "/index.html" in pg.url, "«← все задания» — на главную")
        pg.goto(BASE + "/soc_oge_long.html")
        pg.wait_for_url(lambda u: "/index.html" in u, timeout=5000)
        check("/index.html" in pg.url, "адрес без номера — на главную")
        pg.context.close()

        print("5. телефон и тёмная тема")
        for theme in ("light", "dark"):
            pg = new_page(375, 812, theme)
            for n in LONG:
                pg.goto(BASE + f"/soc_oge_long.html?n={n}")
                pg.wait_for_timeout(200)
                pg.click("#checkBtn")
                sw = pg.evaluate("document.documentElement.scrollWidth")
                check(sw <= 375, f"{theme}, телефон, №{n}: без горизонтальной прокрутки ({sw})")
            pg.goto(BASE + f"/soc_oge_long.html?n=12&t={first(D, 12, lambda t: '<img' in t['q'])['id']}")
            pg.wait_for_timeout(300)
            w = pg.eval_on_selector(".q img.fig", "i => i.getBoundingClientRect().width")
            check(w <= 375, f"{theme}: диаграмма не шире экрана ({w})")
            pg.context.close()
        b.close()
    check(not errors, f"ошибок JavaScript нет {errors[:3]}")
    print("\nИТОГ: " + ("всё прошло" if not FAILS else f"ошибок {len(FAILS)}"))
    sys.exit(1 if FAILS else 0)


if __name__ == "__main__":
    main()
