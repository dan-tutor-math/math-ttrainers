"""
Тренажёр «ОГЭ. Обществознание» (soc_oge.html) — часть 1 с кратким ответом
(№2–4, 7–11, 13–20) из открытого банка ФИПИ.

Проверяет:
  1. данные soc-oge-fipi.js целы: номера только части 1, у выбора — четыре варианта
     и ключ 1–4, у №15 — цифры не больше числа пунктов справа, у №19 — четыре
     цифры 1–4, у №20 — непустая строка; в вариантах нет обрывков разметки ФИПИ;
  2. ученик видит только задания с ответом, принятым сайтом ФИПИ; ?all=1 —
     предпросмотр, адрес без номера уводит на главную к обществознанию;
  3. все четыре вида ответа: верный засчитывается и запоминается, неверный —
     красным; в «Экзамене» у выбора одна попытка, у №15, 19, 20 — три;
     «Тренировка»: попыток сколько угодно, «Показать ответ» показывает и прячет,
     подсмотренное не идёт в «верно»;
  4. №19: порядок внутри колонки — только подтверждённый ФИПИ, пока нет флага any;
     с флагом — любой; №20 — без регистра и «ё/е»;
  5. навигация: ◀ ▶ заданий по кругу, пара «Предыдущий / Следующий номер» (правило
     «кнопки типов»), адрес ?n=…&t=… открывает то же задание, «← все задания» — на
     index.html?subject=soc;
  6. главная: у обществознания номера ОГЭ, №2 ведёт на soc_oge.html?n=2,
     развёрнутые (№1, 5, 6, 12, 21–24) — «скоро»;
  7. тёмная тема и ширина телефона: без ошибок JS, без горизонтальной прокрутки,
     в №15 шапки колонок переезжают внутрь колонок; белый текст на залитых
     кнопках — контраст не ниже 4,5:1 в обеих темах.

Совместного режима у страницы нет — проверять на сайте руками нечего.

Запуск: ~/.venvs/trainers/bin/python test_prompt_soc_oge.py (сервер поднимается сам).
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

PORT = 8993
BASE = f"http://127.0.0.1:{PORT}"
HERE = os.path.dirname(os.path.abspath(__file__))
PART1 = [2, 3, 4, 7, 8, 9, 10, 11, 13, 14, 15, 16, 17, 18, 19, 20]


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
                conn.request("GET", "/soc_oge.html")
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
    s = open(os.path.join(HERE, "soc-oge-fipi.js"), encoding="utf-8").read()
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
        if t["n"] not in PART1: bad.append((t["id"], "номер"))
        if t["k"] == "one":
            if len(t.get("o") or []) != 4 or t["a"] not in "1234" or not t["a"]: bad.append((t["id"], "выбор"))
            if any(re.search(r"<td|<input|^\s*$", o) for o in t.get("o") or []): bad.append((t["id"], "вариант"))
        elif t["k"] == "match":
            if not re.fullmatch(r"\d{5}", t["a"]) or max(map(int, t["a"])) > t.get("m", 0): bad.append((t["id"], "соответствие"))
        elif t["k"] == "pair":
            if not re.fullmatch(r"[1-4]{4}", t["a"]) or len(set(t["a"])) != 4: bad.append((t["id"], "сравнение"))
        elif t["k"] == "text":
            if not t["a"].strip(): bad.append((t["id"], "строка"))
        else:
            bad.append((t["id"], "вид"))
    check(not bad, f"ключи нужной формы (ошибок: {len(bad)} {bad[:5]})")
    check(sorted({t["n"] for t in T}) == PART1, "в файле все номера части 1 с кратким ответом")
    check({t["k"] for t in T if t["n"] == 15} == {"match"} and {t["k"] for t in T if t["n"] == 19} == {"pair"}
          and {t["k"] for t in T if t["n"] == 20} == {"text"}, "№15 — соответствие, №19 — сравнение, №20 — строка")
    check(sum(t["ok"] for t in T) == len([t for t in T if t["a"]]), "ключ есть только у подтверждённых ФИПИ")


def first(D, n, ok=True):
    return next((t for t in D["tasks"] if t["n"] == n and (not ok or t["ok"])), None)


def answer(page, t, value=None):
    """Вводит ответ так, как это сделал бы ученик. value=None — верный ответ из ключа."""
    v = value if value is not None else t["a"]
    if t["k"] == "one":
        page.click(f'.opt[data-v="{v}"]')
    elif t["k"] in ("match", "pair"):
        for i, d in enumerate(v):
            page.select_option(f'#match select[data-i="{i}"]', d)
    else:
        page.fill("#answerInput", v)
    page.click("#checkBtn")


def wrong_value(t):
    if t["k"] == "one":
        return "1" if t["a"] != "1" else "2"
    if t["k"] == "match":
        return "".join("1" if d != "1" else "2" for d in t["a"])
    if t["k"] == "pair":
        return t["a"][2:] + t["a"][:2]   # сходства и различия перепутаны местами
    return "заведомо неверно"


def cur(pg):
    return pg.evaluate("window.__socOge.POOL[window.__socOge.S.n][window.__socOge.S.idx]")


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
        pg.goto(BASE + "/soc_oge.html")
        pg.wait_for_url(lambda u: "/index.html" in u, timeout=5000)
        check("/index.html" in pg.url, "soc_oge.html без номера уводит на главную")
        pg.wait_for_timeout(400)
        check(pg.evaluate("document.documentElement.getAttribute('data-subject')") == "soc", "главная открыта на обществознании")
        pg.goto(BASE + "/soc_oge.html?n=2")
        okall = pg.evaluate("Object.values(window.__socOge.POOL).every(l => l.every(t => t.ok))")
        check(okall, "в задания ученика не попало ни одного несверенного ответа")
        pg.goto(BASE + "/soc_oge.html?all=1")
        check(pg.eval_on_selector_all(".mode-card[data-n]:not([disabled])", "els => els.length") == 16, "?all=1 — открыты все 16 номеров")
        th = next(t for t in D["tasks"] if t.get("h"))
        pg.goto(BASE + f"/soc_oge.html?all=1&n={th['n']}&t={th['id']}")
        check("номер подобран автоматически" in pg.inner_text(".source-note"), "в предпросмотре эвристическая раскладка помечена")
        pg.goto(BASE + f"/soc_oge.html?n={th['n']}&t={th['id']}")
        check("автоматически" not in pg.inner_text(".source-note"), "у ученика этой пометки нет")

        print("3. виды ответа, «Экзамен» и «Тренировка»")
        for n in (3, 15, 19, 20):
            t = first(D, n)
            att = 1 if t["k"] == "one" else 3
            pg = new_page()
            pg.goto(BASE + f"/soc_oge.html?n={n}&t={t['id']}")
            pg.click("#tabExam")
            answer(pg, t)
            check(pg.inner_text("#feedback").strip() == "Верно!", f"№{n} ({t['k']}): верный ответ засчитан")
            check(pg.is_visible("#nextBtn"), f"№{n}: «Следующее задание» после верного ответа")
            res = pg.evaluate("JSON.parse(localStorage.getItem('socOge:results')||'{}')")
            check(res.get(t["id"]) == "ok", f"№{n}: итог запомнен как «верно»")

            pg.click("#nextBtnTop")
            t2 = cur(pg)
            check(("Одна попытка" in pg.inner_text("#modeHint")) == (att == 1), f"№{n}: подсказка режима про {att} попытк.")
            for k in range(att):
                answer(pg, t2, wrong_value(t2))
                if k < att - 1:
                    check(f"Осталось попыток: {att - 1 - k}" in pg.inner_text("#feedback"), f"№{n}: попытка {k + 1} — осталось {att - 1 - k}")
            check(pg.is_visible(".answer-box"), f"№{n}: после {att} неверн. попыток ответ открыт")
            check(pg.is_disabled("#checkBtn"), f"№{n}: задание закрыто")
            if t2["k"] == "one":
                check(pg.get_attribute(f'.opt[data-v="{t2["a"]}"]', "class").find("correct") >= 0, "верный вариант подсвечен зелёным")
                check(pg.locator(".opt.wrong").count() == 1, "выбранный неверный — красным")
            res = pg.evaluate("JSON.parse(localStorage.getItem('socOge:results')||'{}')")
            check(res.get(t2["id"]) == "bad", f"№{n}: итог запомнен как «не решено»")

            pg.click("#nextBtnTop")
            pg.click("#tabPractice")
            t3 = cur(pg)
            for _ in range(4):
                answer(pg, t3, wrong_value(t3))
            check(not pg.is_disabled("#checkBtn"), f"№{n}: в «Тренировке» попыток сколько угодно")
            pg.click("#showBtn")
            check(pg.is_visible(".answer-box"), f"№{n}: «Показать ответ» показывает ответ")
            pg.click("#showBtn")
            check(not pg.is_visible(".answer-box"), f"№{n}: и прячет его")
            pg.click("#showBtn")
            answer(pg, t3)
            res = pg.evaluate("JSON.parse(localStorage.getItem('socOge:results')||'{}')")
            check(res.get(t3["id"]) == "shown", f"№{n}: подсмотренный ответ не засчитан как «верно»")
            pg.context.close()

        print("4. №19 и №20: какие написания засчитываются")
        pg = new_page()
        pg.goto(BASE + "/soc_oge.html?n=19")
        r = pg.evaluate("""() => { const c = window.__socOge.checkAnswer; return [
            c({k:'pair', a:'1324'}, '1324'), c({k:'pair', a:'1324'}, '3142'),
            c({k:'pair', a:'1324', any:1}, '3142'), c({k:'pair', a:'1324', any:1}, '2413'),
            c({k:'text', a:'верховенство'}, '  Верховенство. '), c({k:'text', a:'объединение'}, 'обьединение'),
            c({k:'text', a:'учёба'}, 'учеба'), c({k:'text', a:'долг'}, '') ]; }""")
        check(r[:2] == [True, False], "№19 без флага: только порядок, принятый ФИПИ")
        check(r[2:4] == [True, False], "№19 с флагом any: любой порядок внутри колонок, но не перепутанные колонки")
        check(r[4] and not r[5] and r[6] and not r[7], "№20: без регистра, пробелов и «ё/е»; пустое и опечатка — неверно")
        t = first(D, 19)
        pg.goto(BASE + f"/soc_oge.html?n=19&t={t['id']}")
        pg.click("#tabPractice")
        pg.click("#showBtn")
        check(f"(в бланк: {t['a']})" in pg.inner_text(".answer-box") and "сходства:" in pg.inner_text(".answer-box"),
              "№19: ответ показан по колонкам и строкой для бланка")
        t15 = first(D, 15)
        pg.goto(BASE + f"/soc_oge.html?n=15&t={t15['id']}")
        opts = pg.eval_on_selector('#match select[data-i="0"]', "s => s.options.length - 1")
        check(opts == t15["m"], f"№15: в списке столько цифр, сколько пунктов справа ({opts})")
        pg.context.close()

        print("5. навигация")
        pg = new_page()
        L = [t for t in D["tasks"] if t["n"] == 7 and t["ok"]]
        pg.goto(BASE + f"/soc_oge.html?n=7&t={L[-1]['id']}")
        check(pg.evaluate("window.__socOge.S.idx") == len(L) - 1, "адрес ?n=…&t=… открывает то же задание")
        pg.click("#nextBtnTop")
        check(pg.evaluate("window.__socOge.S.idx") == 0, "▶ с последнего задания — на первое")
        pg.click("#prevBtn")
        check(pg.evaluate("window.__socOge.S.idx") == len(L) - 1, "◀ с первого — на последнее")
        check(pg.is_visible("#prevTypeBtn") and pg.is_visible("#nextTypeBtn"), "пара «Предыдущий / Следующий номер» на экране задания")
        pg.click("#nextTypeBtn")
        check(pg.evaluate("window.__socOge.S.n") == 8 and "n=8" in pg.url, "«Следующий номер ▶» — с №7 на №8")
        pg.click("#prevTypeBtn"); pg.click("#prevTypeBtn")
        check(pg.evaluate("window.__socOge.S.n") == 4, "«◀ Предыдущий номер» пропускает развёрнутые №5, 6")
        pg.goto(BASE + "/soc_oge.html?n=2")
        pg.click("#prevTypeBtn")
        check(pg.evaluate("window.__socOge.S.n") == 20, "по кругу: с №2 назад — на №20")
        pg.click("#backBtn")
        pg.wait_for_url(lambda u: "/index.html" in u, timeout=5000)
        check("/index.html" in pg.url, "«← все задания» — на главную")
        pg.context.close()

        print("6. главная")
        pg = new_page()
        pg.goto(BASE + "/index.html?subject=soc")
        pg.wait_for_timeout(400)
        txt = pg.inner_text("#topics")
        check("№2. Человек, общество, культура: понятия" in txt and "№20. Пропуск в таблице" in txt, "номера обществознания на главной")
        check("готовим" not in txt.split("ЕГЭ")[0] if "ЕГЭ" in txt else "Обществознание готовим" not in txt, "вместо «готовим» — список номеров")
        check(pg.locator('a.topic-item[href="soc_oge.html?n=2"]').count() == 1, "№2 ведёт на soc_oge.html?n=2")
        live = pg.eval_on_selector_all("a.topic-item[href^='soc_oge.html']", "els => els.length")
        check(live == 16, f"ссылок на номера части 1: {live}")
        soon = pg.eval_on_selector_all(".topic-item.soon .item-name", "els => els.map(e => e.textContent)")
        check(sorted(int(re.match(r"№(\d+)", s).group(1)) for s in soon) == [1, 5, 6, 12, 21, 22, 23, 24], f"развёрнутые — «скоро»: {soon}")
        pg.context.close()

        print("7. тёмная тема, телефон, контраст")
        for theme in ("light", "dark"):
            pg = new_page(375, 812, theme)
            for n in (15, 19, 20, 17):
                pg.goto(BASE + f"/soc_oge.html?n={n}")
                pg.wait_for_timeout(250)
                sw = pg.evaluate("document.documentElement.scrollWidth")
                check(sw <= 375, f"{theme}, телефон, №{n}: без горизонтальной прокрутки ({sw})")
            pg.goto(BASE + f"/soc_oge.html?n=15&t={first(D, 15)['id']}")
            heads = pg.eval_on_selector_all(".q .col-head", "els => els.filter(e => e.offsetParent).map(e => e.textContent.trim())")
            check(len(heads) == 2 and all(heads), f"{theme}: №15 на телефоне — шапки внутри колонок {heads}")
            ratios = pg.evaluate("""() => {
              const lum = c => { const m = c.match(/\\d+(\\.\\d+)?/g).slice(0, 3).map(x => +x / 255)
                .map(x => x <= .03928 ? x / 12.92 : ((x + .055) / 1.055) ** 2.4); return .2126*m[0] + .7152*m[1] + .0722*m[2]; };
              const css = getComputedStyle(document.documentElement);
              return ['--btn-1', '--btn-2', '--btn-ok'].map(v => {
                const d = document.createElement('div'); d.style.color = css.getPropertyValue(v); document.body.appendChild(d);
                const L = lum(getComputedStyle(d).color); d.remove(); return Math.round(105 / (L + .05)) / 100; });
            }""")
            check(all(r >= 4.5 for r in ratios), f"{theme}: белый на кнопках — контраст {ratios}")
            pg.context.close()

        b.close()
    check(not errors, f"ошибок JavaScript нет {errors[:3]}")
    print("\nИТОГ: " + ("всё прошло" if not FAILS else f"ошибок {len(FAILS)}"))
    sys.exit(1 if FAILS else 0)


if __name__ == "__main__":
    main()
