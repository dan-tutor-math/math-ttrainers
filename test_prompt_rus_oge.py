"""
Тренажёр «ОГЭ. Русский язык» (rus_oge.html) — задания №2–12 из открытого банка ФИПИ.

Проверяет:
  1. данные rus-oge-fipi.js целы: у каждого задания номер 2–12, вид ответа
     (галочки / соответствие / строка), ключ нужной формы, общий текст на месте;
  2. по умолчанию ученик видит только задания с ответом, подтверждённым сайтом
     ФИПИ (ok), остальные номера на экране выбора выключены; ?all=1 —
     предпросмотр со всеми заданиями и пометкой «ответ ещё не сверен»;
  3. все три вида ответа: верный ответ из ключа засчитывается, «Следующее задание»
     появляется, итог запоминается; неверный — красным;
  4. «Экзамен»: после трёх неверных попыток ответ открывается и задание
     закрыто; «Тренировка»: попыток сколько угодно, «Показать ответ»
     показывает и прячет ответ, подсмотренное не идёт в «верно»;
  5. №5 и №7 принимают цифры в любом порядке, строковые ответы — без учёта
     регистра и «ё/е»;
  6. карточки №1 и №13 ведут на rus_oge01.html и rus_oge13.html; ◀ ▶ ходят по кругу, адрес ?n=…&t=… открывает то же задание;
  7. тёмная тема и ширина телефона — без ошибок JS и без горизонтальной прокрутки.

Совместного режима у этой страницы пока нет — проверять на сайте руками нечего.

Запуск: python3 test_prompt_rus_oge.py (сервер поднимается сам).
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

PORT = 8991
BASE = f"http://127.0.0.1:{PORT}"
HERE = os.path.dirname(os.path.abspath(__file__))


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
                conn.request("GET", "/rus_oge.html")
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
    s = open(os.path.join(HERE, "rus-oge-fipi.js"), encoding="utf-8").read()
    return json.loads(s[s.index("=") + 1:].strip().rstrip(";"))


FAILS = []


def check(cond, msg):
    print(("  ок  " if cond else "  ОШИБКА  ") + msg)
    if not cond:
        FAILS.append(msg)


def test_data(D):
    print("1. данные")
    T = D["tasks"]
    check(len(T) > 0, f"заданий в файле: {len(T)}")
    bad = []
    for t in T:
        if t["n"] not in range(2, 13): bad.append((t["id"], "номер"))
        if t["k"] == "mask":
            if len(t["a"]) != len(t.get("o") or []) or set(t["a"]) - {"0", "1"} or "1" not in t["a"]:
                bad.append((t["id"], "маска"))
        elif t["k"] == "match":
            if not re.fullmatch(r"[1-5]{2,5}", t["a"]): bad.append((t["id"], "соответствие"))
        elif t["k"] == "text":
            if not t["a"].strip(): bad.append((t["id"], "строка"))
        else:
            bad.append((t["id"], "вид"))
        if t.get("t") and t["t"] not in D["texts"]: bad.append((t["id"], "текст"))
    check(not bad, f"ключи и тексты нужной формы (ошибок: {len(bad)} {bad[:5]})")
    by_n = {}
    for t in T: by_n.setdefault(t["n"], []).append(t)
    check(sorted(by_n) == list(range(2, 13)), "в файле все номера 2–12")
    check(all(t.get("t") for t in T if t["n"] in (2, 3, 10, 11)), "№2, 3, 10, 11 привязаны к общему тексту")
    check(sum(t["ok"] for t in T) > 0, f"подтверждённых ФИПИ: {sum(t['ok'] for t in T)}")


def first(D, n, k=None, ok=True):
    for t in D["tasks"]:
        if t["n"] == n and (k is None or t["k"] == k) and (not ok or t["ok"]):
            return t
    return None


def answer(page, t, value=None):
    """Вводит ответ так, как это сделал бы ученик. value=None — верный ответ из ключа."""
    if t["k"] == "mask":
        mask = value if value is not None else t["a"]
        for i, c in enumerate(mask):
            if c == "1": page.click(f'.opt[data-i="{i}"]')
    elif t["k"] == "match":
        val = value if value is not None else t["a"]
        for i, d in enumerate(val):
            page.select_option(f'#match select[data-i="{i}"]', d)
    else:
        page.fill("#answerInput", value if value is not None else t["a"])
    page.click("#checkBtn")


def wrong_value(t):
    if t["k"] == "mask":
        # маска, отличная от ключа хотя бы одной галочкой, но не пустая
        m = list(t["a"]); m[0] = "0" if m[0] == "1" else "1"
        if "1" not in m: m[1] = "1"
        return "".join(m)
    if t["k"] == "match":
        return "".join("1" if d != "1" else "2" for d in t["a"])
    return "заведомо неверно"


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

        print("2. только подтверждённые ФИПИ")
        pg = new_page()
        pg.goto(BASE + "/rus_oge.html")
        ok_nums = sorted({t["n"] for t in D["tasks"] if t["ok"]})
        enabled = sorted(int(x) for x in pg.eval_on_selector_all(".mode-card[data-n]:not([disabled])", "els => els.map(e => e.dataset.n)"))
        check(enabled == ok_nums, f"включены номера с подтверждёнными ответами: {enabled}")
        check(pg.get_attribute("#essayLink", "href") == "rus_oge13.html", "карточка №13 ведёт на страницу сочинения")
        check(pg.get_attribute("#izlLink", "href") == "rus_oge01.html", "карточка №1 ведёт на страницу изложения")
        pool = pg.evaluate("Object.fromEntries(Object.entries(window.__rusOge.POOL).map(([k,v]) => [k, v.every(t => t.ok)]))")
        check(all(pool.values()), "в задания ученика не попало ни одного несверенного ответа")
        pg.goto(BASE + "/rus_oge.html?all=1")
        enabled_all = pg.eval_on_selector_all(".mode-card[data-n]:not([disabled])", "els => els.length")
        check(enabled_all == 11, "?all=1 — открыты все 11 номеров")
        t_un = next((t for t in D["tasks"] if not t["ok"]), None)
        if t_un:
            pg.goto(BASE + f"/rus_oge.html?all=1&n={t_un['n']}&t={t_un['id']}")
            check("ответ ещё не сверен" in pg.inner_text(".source-note"), "в предпросмотре несверенное задание помечено")

        print("3–4. виды ответа, «Экзамен» и «Тренировка»")
        for kind, n in (("mask", 2), ("match", 4), ("text", 8), ("text", 5)):
            t = first(D, n, kind, ok=True) or first(D, n, kind, ok=False)
            if not t:
                check(False, f"нет задания №{n} вида {kind}")
                continue
            q = "&all=1" if not t["ok"] else ""
            pg = new_page()
            pg.goto(BASE + f"/rus_oge.html?n={n}&t={t['id']}{q}")
            pg.click("#tabExam")
            answer(pg, t)
            check(pg.inner_text("#feedback").strip() == "Верно!", f"№{n} ({kind}): верный ответ засчитан")
            check(pg.is_visible("#nextBtn"), f"№{n}: «Следующее задание» после верного ответа")
            res = pg.evaluate("JSON.parse(localStorage.getItem('rusOge:results')||'{}')")
            check(res.get(t["id"]) == "ok", f"№{n}: итог запомнен как «верно»")
            check("Источник: открытый банк заданий ФИПИ" in pg.inner_text(".source-note"), f"№{n}: подпись источника")

            # «Экзамен»: три неверных попытки — ответ открывается
            pg.click("#nextBtnTop")
            t2 = pg.evaluate("window.__rusOge.POOL[window.__rusOge.S.n][window.__rusOge.S.idx]")
            for k in range(3):
                if t2["k"] == "mask":
                    pg.evaluate("document.querySelectorAll('.opt.picked').forEach(b => b.click())")
                answer(pg, t2, wrong_value(t2))
                if k < 2:
                    check(f"Осталось попыток: {2 - k}" in pg.inner_text("#feedback"), f"№{n}: попытка {k + 1} — осталось {2 - k}")
            check(pg.is_visible(".answer-box"), f"№{n}: после трёх попыток ответ открыт")
            check(pg.is_disabled("#checkBtn"), f"№{n}: задание закрыто")

            # «Тренировка»: показать ответ, верный ответ после этого — «подсмотрено»
            pg.click("#nextBtnTop")
            pg.click("#tabPractice")
            t3 = pg.evaluate("window.__rusOge.POOL[window.__rusOge.S.n][window.__rusOge.S.idx]")
            for _ in range(4):
                if t3["k"] == "mask":
                    pg.evaluate("document.querySelectorAll('.opt.picked').forEach(b => b.click())")
                answer(pg, t3, wrong_value(t3))
            check(not pg.is_disabled("#checkBtn"), f"№{n}: в «Тренировке» попыток сколько угодно")
            pg.click("#showBtn")
            check(pg.is_visible(".answer-box"), f"№{n}: «Показать ответ» показывает ответ")
            pg.click("#showBtn")
            check(not pg.is_visible(".answer-box"), f"№{n}: и прячет его")
            pg.click("#showBtn")
            if t3["k"] == "mask":
                pg.evaluate("document.querySelectorAll('.opt.picked').forEach(b => b.click())")
            answer(pg, t3)
            res = pg.evaluate("JSON.parse(localStorage.getItem('rusOge:results')||'{}')")
            check(res.get(t3["id"]) == "shown", f"№{n}: подсмотренный ответ не идёт в «верно»")

        print("5. форма ответа")
        pg = new_page()
        for n in (5, 7):
            t = first(D, n, "text", ok=False)
            pg.goto(BASE + f"/rus_oge.html?all=1&n={n}&t={t['id']}")
            pg.click("#tabPractice")
            answer(pg, t, t["a"][::-1])
            check(pg.inner_text("#feedback").strip() == "Верно!", f"№{n}: цифры в обратном порядке засчитаны ({t['a'][::-1]})")
        t = next(x for x in D["tasks"] if x["n"] == 8 and "ё" in x["a"])
        pg.goto(BASE + f"/rus_oge.html?all=1&n=8&t={t['id']}")
        answer(pg, t, t["a"].upper().replace("Ё", "Е"))
        check(pg.inner_text("#feedback").strip() == "Верно!", f"№8: «{t['a'].upper().replace('Ё', 'Е')}» засчитан как «{t['a']}»")

        print("6. навигация и адрес")
        pg.goto(BASE + "/rus_oge.html?all=1&n=6")
        first_id = pg.evaluate("window.__rusOge.POOL[6][window.__rusOge.S.idx].id")
        pg.click("#prevBtn")
        last_id = pg.evaluate("window.__rusOge.POOL[6][window.__rusOge.S.idx].id")
        pool6 = pg.evaluate("window.__rusOge.POOL[6].map(t => t.id)")
        check(pool6.index(last_id) == (pool6.index(first_id) - 1) % len(pool6), "◀ ходит по кругу")
        url = pg.url
        pg.goto(url)
        check(pg.evaluate("window.__rusOge.POOL[6][window.__rusOge.S.idx].id") == last_id, "адрес ?n=…&t=… открывает то же задание")
        pg.click("#backBtn")
        check(pg.is_visible("#modesGrid"), "«← все задания» возвращает к выбору номера")

        print("7. тёмная тема и телефон")
        pm = new_page(390, 844, "dark")
        for n in (4, 10, 6):
            pm.goto(BASE + f"/rus_oge.html?all=1&n={n}")
            sw = pm.evaluate("document.documentElement.scrollWidth")
            check(sw <= 390, f"№{n} на 390 px без горизонтальной прокрутки ({sw})")
        check(pm.evaluate("document.documentElement.getAttribute('data-theme')") == "dark", "тёмная тема применилась")
        b.close()
    check(not errors, f"ошибок JavaScript нет {errors[:3]}")
    print("\nИТОГ:", "всё прошло" if not FAILS else f"ошибок: {len(FAILS)}")
    sys.exit(1 if FAILS else 0)


if __name__ == "__main__":
    main()
