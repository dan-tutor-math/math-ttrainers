"""
Тренажёр «ЕГЭ. Русский язык» (rus_ege.html, №1–26, и rus_ege27.html, сочинение №27)
из открытого банка ФИПИ, номера КИМ 2027.

Проверяет:
  1. данные rus-ege-fipi.js: номера 1–26, ключ нужной формы для галочек / соответствия /
     строки, у №26 номера предложений складываются в ключ, общие тексты на месте; спорные
     ключи (ok: 0) и старые формы (h: 1) есть, но ученику не идут;
  2. ученик видит только ok и не h; ?all=1 — все задания с пометкой; голый адрес — на главную;
  3. все виды ответа: верный засчитывается, неверный — красным; «Экзамен» — три попытки;
  4. порядок по демоверсии: №15, 17–21 — цифры в любом порядке; №26 — номера предложений:
     «2625», «26, 25» верно, а перестановка цифр «5262» — нет; слова — без регистра и ё/е;
  5. хук доски: №26 отдаёт точные перестановки номеров, а не «любой порядок цифр»;
  6. каталог и навигация: «ЕГЭ» у русского больше не «скоро», ruse1…ruse27 ведут на
     страницы, exam-nav знает rus_ege, task-key — свой экзамен ruse;
  7. сочинение №27: список текстов с названием «автор. «первые слова»», текст и задание
     ФИПИ, счётчик слов (150), «Сдать» → критерии К1–К10, итог из 22, правила демоверсии
     (меньше 150 слов — 0; К1 = 0 обнуляет К2 и К3), черновик переживает перезагрузку;
  8. тёмная тема и телефон 390 px — без ошибок JS и горизонтальной прокрутки.

Совместного режима (realtime) правка не меняет: страница — копия rus_oge.html.

Запуск: ~/.venvs/trainers/bin/python test_prompt_rus_ege.py (сервер поднимается сам).
"""
import contextlib
import http.client
import itertools
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


@contextlib.contextmanager
def local_server():
    proc = subprocess.Popen([sys.executable, "-m", "http.server", str(PORT)], cwd=HERE,
                            stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    try:
        for _ in range(50):
            try:
                conn = http.client.HTTPConnection("127.0.0.1", PORT, timeout=0.2)
                conn.request("GET", "/rus_ege.html")
                conn.getresponse()
                break
            except Exception:
                time.sleep(0.1)
        else:
            raise RuntimeError("локальный сервер не поднялся")
        yield
    finally:
        proc.terminate()


def load(name):
    s = open(os.path.join(HERE, name), encoding="utf-8").read()
    s = s[s.index("window."):]   # в шапке-комментарии тоже бывает «=»
    return json.loads(s[s.index("=") + 1:].strip().rstrip(";"))


FAILS = []


def check(cond, msg):
    print(("  ок  " if cond else "  ОШИБКА  ") + msg)
    if not cond:
        FAILS.append(msg)


def test_data(D, E):
    print("1. данные")
    T = D["tasks"]
    bad = []
    for t in T:
        if t["n"] not in range(1, 27): bad.append((t["id"], "номер"))
        if t["k"] == "mask":
            if len(t["a"]) != len(t.get("o") or []) or set(t["a"]) - {"0", "1"} or "1" not in t["a"]:
                bad.append((t["id"], "маска"))
        elif t["k"] == "match":
            if not re.fullmatch(r"[1-9]{4,5}", t["a"]) or t["n"] not in (8, 22): bad.append((t["id"], "соответствие"))
        elif t["k"] == "text":
            if not t["a"].strip(): bad.append((t["id"], "строка"))
            if t.get("u") and "".join(t["u"]) != t["a"]: bad.append((t["id"], "номера №26"))
        else:
            bad.append((t["id"], "вид"))
        if t.get("t") and t["t"] not in D["texts"]: bad.append((t["id"], "текст"))
    check(len(T) == 2069, f"в файле все 2069 кратких заданий ({len(T)})")
    check(not bad, f"ключи и тексты нужной формы (ошибок: {len(bad)} {bad[:5]})")
    check(sorted({t['n'] for t in T}) == list(range(1, 27)), "в файле все номера 1–26")
    check(all(t.get("u") for t in T if t["n"] == 26), "у всех №26 номера предложений отдельно (u)")
    check(all(t.get("d") == 1 for t in T if t["n"] in (15, 17, 18, 19, 20, 21) and t["k"] == "text"),
          "№15, 17–21: порядок цифр не важен (по демоверсии 2027)")
    sporno = {t["id"] for t in T if not t["ok"]}
    check(sporno == {"79B0A0", "6E2A0F", "682A9C"}, f"спорных ключей ровно три из разбора ({sorted(sporno)})")
    check(sum(1 for t in T if t.get("h")) == 94, "94 задания старой формы помечены h")
    check(len(E["tasks"]) == 71 and all(t["t"] in E["texts"] for t in E["tasks"]), "№27: 71 текст на месте")


def first(D, n, k=None, pred=None):
    for t in D["tasks"]:
        if t["n"] == n and t["ok"] and not t.get("h") and (k is None or t["k"] == k) and (pred is None or pred(t)):
            return t
    return None


def answer(page, t, value=None):
    if t["k"] == "mask":
        for i, c in enumerate(value if value is not None else t["a"]):
            if c == "1": page.click(f'.opt[data-i="{i}"]')
    elif t["k"] == "match":
        for i, d in enumerate(value if value is not None else t["a"]):
            page.select_option(f'#match select[data-i="{i}"]', d)
    else:
        page.fill("#answerInput", value if value is not None else t["a"])
    page.click("#checkBtn")


def main():
    D, E = load("rus-ege-fipi.js"), load("rus-ege27-fipi.js")
    test_data(D, E)
    errors = []
    with local_server(), sync_playwright() as p:
        b = p.chromium.launch()

        def new_page(w=1100, h=900, theme="light"):
            ctx = b.new_context(viewport={"width": w, "height": h})
            pg = ctx.new_page()
            pg.on("pageerror", lambda e: errors.append(str(e)))
            pg.add_init_script(f"try{{localStorage.setItem('theme','{theme}')}}catch(e){{}}")
            return pg

        print("2. что видит ученик")
        pg = new_page()
        pg.goto(BASE + "/rus_ege.html")
        pg.wait_for_url(lambda u: "/index.html" in u, timeout=5000)
        check("/index.html" in pg.url, "rus_ege.html без номера уводит на главную")
        pg.goto(BASE + "/rus_ege.html?n=1")
        clean = pg.evaluate("Object.values(window.__rusEge.POOL).flat().every(t => t.ok && !t.h)")
        check(clean, "у ученика нет спорных ключей и старых форм")
        check(pg.evaluate("window.__rusEge.POOL[26].some(t => t.id === '682A9C')") is False, "спорный 682A9C ученику не показан")
        pg.goto(BASE + "/rus_ege.html?all=1")
        check(pg.eval_on_selector_all(".mode-card[data-n]:not([disabled])", "els => els.length") == 26, "?all=1 — открыты все 26 номеров")
        check(pg.get_attribute("#essayLink", "href") == "rus_ege27.html", "карточка №27 ведёт на страницу сочинения")
        pg.goto(BASE + "/rus_ege.html?all=1&n=26&t=682A9C")
        check("спорный ключ" in pg.inner_text(".source-note"), "в предпросмотре спорное задание помечено")
        th = next(t for t in D["tasks"] if t.get("h"))
        pg.goto(BASE + f"/rus_ege.html?all=1&n={th['n']}&t={th['id']}")
        check("старая форма" in pg.inner_text(".source-note"), "в предпросмотре старая форма помечена")

        print("3. виды ответа и попытки")
        for n, k in ((2, "mask"), (8, "match"), (4, "text"), (22, "match")):
            t = first(D, n, k)
            pg = new_page()
            pg.goto(BASE + f"/rus_ege.html?n={n}&t={t['id']}")
            if t.get("t"):
                check(pg.is_visible(".text-box"), f"№{n}: общий текст показан")
            answer(pg, t)
            check(pg.is_visible("#nextBtn") and "Верно" in pg.inner_text("#feedback"), f"№{n} ({k}): верный ответ засчитан")
            stored = pg.evaluate("JSON.parse(localStorage.getItem('rusEge:results'))")
            check(stored.get(t["id"]) == "ok", f"№{n}: итог запомнен под rusEge:results")
        t = first(D, 5)
        pg = new_page()
        pg.goto(BASE + f"/rus_ege.html?n=5&t={t['id']}")
        for i in range(3):
            pg.fill("#answerInput", "неверно" + str(i)); pg.click("#checkBtn")
        check(pg.is_visible(".answer-box") and t["a"] in pg.inner_text(".answer-box"), "«Экзамен»: после 3 попыток открыт ответ")
        check(pg.evaluate("document.querySelector('#answerInput').classList.contains('wrong')"), "неверный ответ — красным")
        t8 = first(D, 8, "match")
        pg.goto(BASE + f"/rus_ege.html?n=8&t={t8['id']}")
        check(pg.eval_on_selector_all('#match select[data-i="0"] option', "els => els.length") == 10, "№8: в списке цифры 1–9")

        print("4. порядок и написание")
        ev = lambda tid, v: pg.evaluate("([id, v]) => { const t = __rusEge.POOL[Object.keys(__rusEge.POOL).find(n => __rusEge.POOL[n].some(x => x.id === id))].find(x => x.id === id); return __rusEge.checkAnswer(t, v); }", [tid, v])
        t15 = first(D, 15, "text", lambda t: len(t["a"]) >= 2)
        check(ev(t15["id"], t15["a"][::-1]), f"№15: «{t15['a'][::-1]}» вместо «{t15['a']}» — верно")
        t26 = next(t for t in D["tasks"] if t["id"] == "8cD68D")
        check(ev("8cD68D", "2625") and ev("8cD68D", "25, 26") and ev("8cD68D", "2526"), "№26: 2526, 2625 и «25, 26» — верно")
        check(not ev("8cD68D", "5262") and not ev("8cD68D", "25"), "№26: перестановка цифр 5262 и неполный ответ — неверно")
        t26b = next(t for t in D["tasks"] if t["n"] == 26 and t["ok"] and t["u"] == ["8"])
        check(ev(t26b["id"], "8") and not ev(t26b["id"], "18"), "№26 с одним номером: 8 верно, 18 — нет")
        tw = next(t for t in D["tasks"] if t["id"] == "C26BDA")
        check(ev("C26BDA", "прозорлива") and ev("C26BDA", "Прозорлива "), "слово — без регистра и пробелов")
        te = first(D, 9, "text", lambda t: "Е" in t["a"])
        if te:
            check(ev(te["id"], te["a"].replace("Е", "Ё", 1).lower()), "ё и е не различаются")

        print("5. хук доски")
        pg.goto(BASE + "/rus_ege.html?n=26&t=8cD68D")
        info = pg.evaluate("window.__boardTaskInfo(-1)")
        f = info and info["fields"][0]
        check(f and not f["anyOrder"] and sorted([f["value"]] + f["alts"]) == ["2526", "2625"], f"№26 на доске: точные перестановки номеров ({f})")
        pg.goto(BASE + f"/rus_ege.html?n=15&t={t15['id']}")
        f = pg.evaluate("window.__boardTaskInfo(-1)")["fields"][0]
        check(f["anyOrder"] is True, "№15 на доске: цифры в любом порядке")

        print("6. каталог, навигация, ключ задания")
        pg.goto(BASE + "/index.html?subject=rus")
        cat = pg.evaluate("""() => { const e = MathhCatalog.exams.find(e => e.subject === 'rus' && e.id === 'ege');
          return { soon: !!e.soon, items: e.groups.flatMap(g => g.items),
                   hrefs: ['ruse1', 'ruse26', 'ruse27'].map(id => MathhCatalog.trainers[id].href),
                   panel: MathhCatalog.panelGroups().flatMap(g => g.items.map(i => i.id)).filter(id => /^ruse/.test(id)).length }; }""")
        check(not cat["soon"] and len(cat["items"]) == 27, "у русского ЕГЭ больше не «скоро», 27 номеров")
        check(cat["hrefs"] == ["rus_ege.html?n=1", "rus_ege.html?n=26", "rus_ege27.html"], f"номера ведут на страницы ({cat['hrefs']})")
        check(cat["panel"] == 26, "в панель досок идут №1–26, сочинение — нет")
        pg.goto(BASE + "/rus_ege.html?n=26&t=8cD68D")
        key = pg.evaluate("TaskKey.fromTask('rus_ege', {id: '8cD68D'})")
        check(key == "fipi:ruse:8cD68D", f"task-key: свой экзамен ruse ({key})")
        pg.goto(BASE + "/rus_ege.html?n=4")
        pg.wait_for_selector("#examNextBtn", timeout=5000)
        pg.click("#examNextBtn")
        pg.wait_for_timeout(400)
        check(pg.evaluate("__rusEge.S.n") == 5, "стрелка заголовка: №4 → №5 без перезагрузки")
        pg.goto(BASE + "/rus_ege.html?n=26")
        pg.click("#examNextBtn")
        pg.wait_for_url(lambda u: "rus_ege27.html" in u, timeout=5000)
        check("rus_ege27.html" in pg.url, "с №26 стрелка ведёт на сочинение №27")

        print("7. сочинение №27")
        pe = new_page()
        pe.goto(BASE + "/rus_ege27.html")
        cards = pe.eval_on_selector_all("#textsGrid .mode-card", "els => els.map(e => e.textContent)")
        check(len(cards) == 71, f"в списке 71 текст ({len(cards)})")
        check(sum(1 for c in cards if re.search(r"[А-ЯЁ]\.\s?[А-ЯЁ]?\.?\s?[А-ЯЁ][а-яё]+\. «", c)) >= 60, "названия — «автор. «первые слова»»")
        pe.click('#textsGrid .mode-card[data-i="0"]')
        check(pe.is_visible("#textBody") and "(1)" in pe.inner_text("#textBody"), "текст с номерами предложений показан")
        check("сочинение" in pe.inner_text("#taskQ").lower(), "задание ФИПИ показано")
        check(pe.locator("#prevTypeBtn").count() == 0, "кнопок типов нет: тип у №27 один")
        pe.fill("#essay", "слово " * 120)
        check("нужно не меньше 150" in pe.inner_text("#wc"), "счётчик: 120 слов — мало")
        pe.click("#submitBtn")
        check(pe.is_visible(".short-warn"), "короткое сочинение — предупреждение о нуле")
        for c in range(1, 11):
            pe.click(f'.crit-opt[data-c="k{c}"] >> nth=0')
        check("0 из 22" in pe.inner_text("#critTotal"), "меньше 150 слов — итог 0 из 22")
        sc = pe.evaluate("""() => { const f = __rusEge27.score;
          const full = {k1:1,k2:3,k3:2,k4:1,k5:2,k6:1,k7:3,k8:3,k9:3,k10:3};
          return [f(full, 200), f(Object.assign({}, full, {k1:0}), 200), __rusEge27.MAX_SCORE]; }""")
        check(sc == [22, 16, 22], f"максимум 22; К1 = 0 обнуляет К2 и К3 ({sc})")
        tid = pe.evaluate("__rusEge27.TASKS[1].id")
        pe.goto(BASE + f"/rus_ege27.html?t={tid}")
        pe.fill("#essay", "черновик сочинения")
        pe.reload()
        check(pe.input_value("#essay") == "черновик сочинения", "черновик переживает перезагрузку")

        print("8. тёмная тема и телефон")
        pm = new_page(390, 844, "dark")
        for url in ("/rus_ege.html?all=1&n=8", "/rus_ege.html?n=22", "/rus_ege.html?n=26", "/rus_ege.html?n=2", f"/rus_ege27.html?t={tid}"):
            pm.goto(BASE + url)
            pm.wait_for_timeout(200)
            sw = pm.evaluate("document.documentElement.scrollWidth")
            check(sw <= 390, f"{url} на 390 px без горизонтальной прокрутки ({sw})")
        check(pm.evaluate("document.documentElement.getAttribute('data-theme')") == "dark", "тёмная тема применилась")
        b.close()
    check(not errors, f"ошибок JavaScript нет {errors[:3]}")
    print("\nИТОГ:", "всё прошло" if not FAILS else f"ошибок: {len(FAILS)}")
    sys.exit(1 if FAILS else 0)


if __name__ == "__main__":
    main()
