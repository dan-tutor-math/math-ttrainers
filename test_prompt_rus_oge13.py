"""
Тренажёр «ОГЭ. Русский язык, №13 — сочинение-рассуждение» (rus_oge13.html).

Проверяет:
  1. данные rus-oge13-fipi.js целы: 99 заданий, у каждого текст с номерами
     предложений и три темы (13.1–13.3), к каждой теме образец — ответ,
     два примера, вывод, не меньше 70 слов; цитата каждого примера дословно
     есть в тех предложениях, на которые он ссылается;
  2. экран выбора: 99 карточек, карточка открывает текст, адрес ?t=… открывает
     тот же текст, ◀ ▶ ходят по кругу, «←» к списку, «домой» — на русский;
  3. тема выбирается, у каждой темы свой черновик, черновик переживает
     перезагрузку, счётчик слов предупреждает про 70 слов;
  4. «Тренировка»: образец открывается и прячется, пример образца подсвечивает
     свои предложения в тексте; самопроверка по СК1–СК4 считает итог, меньше
     70 слов — 0, итог виден в списке текстов;
  5. «Экзамен»: таймер идёт с первой буквы, «Сдать» закрывает поле и темы,
     показывает критерии и образец;
  6. тёмная тема и ширина телефона — без ошибок JS и без горизонтальной прокрутки.

Совместного режима у этой страницы нет — проверять на сайте руками нечего.

Запуск: python3 test_prompt_rus_oge13.py (сервер поднимается сам).
"""
import contextlib
import http.client
import os
import re
import subprocess
import sys
import time

from playwright.sync_api import sync_playwright

PORT = 8993
BASE = f"http://127.0.0.1:{PORT}"
HERE = os.path.dirname(os.path.abspath(__file__))
FAILS = []


def check(cond, msg):
    print(("  ok  " if cond else "  FAIL ") + msg)
    if not cond:
        FAILS.append(msg)


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
                conn.request("GET", "/rus_oge13.html")
                conn.getresponse()
                break
            except Exception:
                time.sleep(0.1)
        else:
            raise RuntimeError("локальный сервер не поднялся")
        yield
    finally:
        proc.terminate()


def norm(s):
    # кавычки, тире и многоточия в цитате и в тексте ФИПИ бывают разные — сравниваем буквы
    s = s.lower().replace("ё", "е")
    return " ".join(re.findall(r"[0-9a-zа-я]+", s))


def words(s):
    return len(re.findall(r"[0-9A-Za-zА-Яа-яЁё]+(?:-[0-9A-Za-zА-Яа-яЁё]+)*", s))


ESSAY = ("Автор показывает, что настоящий человек не сдаётся перед трудностями. "
         "Это видно из первого примера, где герой поступает смело и честно. "
         "Во втором примере герой помогает другу, хотя ему самому тяжело. "
         "Оба примера дополняют друг друга и показывают силу характера. ") * 2 + \
        "Таким образом, сила человека проявляется в его поступках, а не в словах."


def main():
    errors = []
    with local_server(), sync_playwright() as p:
        b = p.chromium.launch()

        def new_page(w=1100, h=900, theme="light", mode=None):
            ctx = b.new_context(viewport={"width": w, "height": h})
            pg = ctx.new_page()
            pg.on("pageerror", lambda e: errors.append(str(e)))
            init = f"try{{localStorage.setItem('theme','{theme}')"
            if mode:
                init += f";if(!sessionStorage.getItem('m')){{localStorage.setItem('rusOge13:mode','\"{mode}\"');sessionStorage.setItem('m','1')}}"
            pg.add_init_script(init + "}catch(e){}")
            return pg

        print("1. данные")
        pg = new_page()
        pg.goto(BASE + "/rus_oge13.html")
        D = pg.evaluate("window.RUS_OGE13")
        tasks = D["tasks"]
        check(len(tasks) == 99, f"заданий 99 ({len(tasks)})")
        check(len({t["id"] for t in tasks}) == len(tasks), "id заданий не повторяются")
        bad = []
        for t in tasks:
            x = D["texts"].get(t["t"])
            if not x or len(t["th"]) != 3 or len(t.get("s") or []) != 3:
                bad.append(t["id"] + " структура")
                continue
            sent = {}
            for par in x["p"]:
                for n, s in par:
                    if n:
                        sent[abs(n)] = sent.get(abs(n), "") + " " + s
            nums = sorted(sent)
            if nums != list(range(1, len(nums) + 1)):
                bad.append(t["id"] + " нумерация предложений")
            for k, smp in enumerate(t["s"]):
                if len(smp["e"]) != 2:
                    bad.append(f"{t['id']}/{k} примеров не два")
                    continue
                body = " ".join([smp["th"]] + [e["t"] for e in smp["e"]] + [smp["c"]])
                if words(body) < 70:
                    bad.append(f"{t['id']}/{k} меньше 70 слов")
                for e in smp["e"]:
                    src = norm(" ".join(sent.get(n, "") for n in e["s"]))
                    if not e["s"] or norm(e["q"]) not in src or norm(e["q"]) not in norm(e["t"]):
                        bad.append(f"{t['id']}/{k} цитата «{e['q'][:30]}»")
        check(not bad, f"у всех 99 текстов три образца, цитаты на месте {bad[:5]}")

        print("2. список, адрес, навигация")
        check(pg.eval_on_selector_all("#textsGrid .mode-card", "els => els.length") == 99, "в списке 99 текстов")
        check(pg.get_attribute("#homeBtn", "href") == "index.html?subject=rus", "«домой» — на русский язык главной")
        first = pg.inner_text("#textsGrid .mode-card .mtitle")
        check(first == "Ю.М. Нагибин. «В нашей паре я был…»", f"название «И.О. Фамилия. «Первые слова…»» ({first})")
        names = pg.eval_on_selector_all("#textsGrid .mode-card .mtitle", "els => els.map(e => e.textContent)")
        odd = [n for n in names if not re.match(r"^(?:[А-ЯЁ]\.)+ [А-ЯЁ][а-яё]+(?:-[А-ЯЁ][а-яё]+)?\. «.+»$", n)]
        check(not odd, f"все 99 названий в одном формате {odd[:5]}")
        check(not [n for n in names if "По " in n.split(".")[0] or "*" in n], "автор в именительном, без «По» и звёздочки")
        for want in ("В.А. Осеева-Хмелёва. «Динка огляделась»", "Т.Н. Толстая. «", "Л.Н. Толстой. «", "Л.А. Кассиль. «",
                     "О.Ю. Рой. «", "К.Г. Паустовский. «", "Е. Чепилка. «", "С.А. Лубенец. «", "Ю.М. Нагибин. «Мама, смотри!»"):
            check(any(n.startswith(want) for n in names), f"есть название {want}…")
        pg.click("#textsGrid .mode-card[data-i='2']")
        check(f"t={tasks[2]['id']}" in pg.url, "карточка открывает текст, адрес с ?t=")
        check(pg.inner_text("#taskTitle") == "текст 3 из 99", "заголовок «текст 3 из 99»")
        check(pg.eval_on_selector_all(".snt[data-s]", "els => els.length") > 10, "в тексте размечены предложения")
        check(pg.eval_on_selector_all(".theme", "els => els.length") == 3, "три темы")
        pg.goto(BASE + f"/rus_oge13.html?t={tasks[0]['id']}")
        check(pg.evaluate("window.__rusOge13.S.idx") == 0, "?t= открывает нужный текст")
        pg.click("#prevBtn")
        check(pg.evaluate("window.__rusOge13.S.idx") == 98, "◀ с первого — на последний")
        pg.click("#nextBtnTop")
        check(pg.evaluate("window.__rusOge13.S.idx") == 0, "▶ с последнего — на первый")
        pg.click("#backBtn")
        check(pg.is_visible("#pickerArea") and "t=" not in pg.url, "«←» возвращает к списку")

        print("3. темы и черновики")
        pg = new_page(mode="practice")
        tid = tasks[5]["id"]
        pg.goto(BASE + f"/rus_oge13.html?t={tid}")
        check(pg.query_selector("#essay") is None, "пока тема не выбрана, поля нет")
        pg.click(".theme[data-k='1']")
        check(pg.is_visible("#essay"), "тема выбрана — появилось поле")
        pg.fill("#essay", "Короткий черновик по второй теме")
        check("нужно не меньше 70" in pg.inner_text("#wc"), "счётчик предупреждает про 70 слов")
        pg.click(".theme[data-k='2']")
        check(pg.input_value("#essay") == "", "у другой темы свой пустой черновик")
        pg.click(".theme[data-k='1']")
        check(pg.input_value("#essay") == "Короткий черновик по второй теме", "черновик первой темы вернулся")
        pg.reload()
        check(pg.input_value("#essay") == "Короткий черновик по второй теме", "после перезагрузки та же тема и черновик")

        print("4. «Тренировка»: образец и самопроверка")
        pg.click("#sampleBtn")
        check(pg.eval_on_selector_all("#sampleArea .sp", "els => els.length") == 4, "образец: ответ, два примера, вывод")
        check(pg.inner_text("#sampleBtn") == "Скрыть образец", "кнопка «Скрыть образец»")
        ex = tasks[5]["s"][1]["e"][0]["s"]
        pg.click("#sampleArea .tag.ex")
        hl = sorted({int(x) for x in pg.eval_on_selector_all(".snt.hl", "els => els.map(e => e.dataset.s)")})
        check(hl == sorted(ex), f"пример подсветил свои предложения {hl}")
        pg.click("#sampleBtn")
        check(pg.inner_text("#sampleArea") == "" and pg.eval_on_selector_all(".snt.hl", "e => e.length") == 0, "образец спрятан, подсветка снята")
        pg.click("#checkBtn")
        check(pg.eval_on_selector_all(".crit-row", "els => els.length") == 4, "четыре критерия СК1–СК4")
        check(pg.is_visible(".short-warn"), "короткое сочинение — предупреждение")
        for c in ("ck1", "ck2", "ck3", "ck4"):
            pg.click(f".crit-opt[data-c='{c}']")  # первый вариант — максимум
        check(pg.inner_text("#critTotal") == "Итого: 0 из 7", "меньше 70 слов — 0 баллов")
        pg.fill("#essay", ESSAY)
        check("нужно" not in pg.inner_text("#wc"), f"длинное сочинение — без предупреждения ({pg.inner_text('#wc')})")
        pg.click("#checkBtn")
        for c in ("ck1", "ck2", "ck3", "ck4"):
            pg.click(f".crit-opt[data-c='{c}']")
        check(pg.inner_text("#critTotal") == "Итого: 7 из 7", "все критерии на максимум — 7 из 7")
        pg.click(".crit-opt[data-c='ck2'][data-v='1']")
        check(pg.inner_text("#critTotal") == "Итого: 5 из 7", "СК2 = 1 — 5 из 7")
        res = pg.evaluate("JSON.parse(localStorage.getItem('rusOge13:results'))")
        check(res.get(tid, {}).get("sc") == 5 and res[tid]["k"] == 1, f"итог сохранён {res.get(tid)}")
        pg.click("#backBtn")
        prog = pg.inner_text(f"#textsGrid .mode-card[data-i='5'] .mprog")
        check("13.2" in prog and "5 из 7" in prog, f"в списке отметка у текста ({prog})")

        print("5. «Экзамен»")
        pg = new_page(mode="exam")
        pg.goto(BASE + f"/rus_oge13.html?t={tasks[10]['id']}")
        check(pg.query_selector("#sampleBtn") is None and pg.query_selector("#checkBtn") is None, "в экзамене нет образца и проверки до сдачи")
        pg.click(".theme[data-k='0']")
        pg.click("#submitBtn")
        check(pg.inner_text("#wc") == "Сначала напиши сочинение", "пустое не сдаётся")
        pg.fill("#essay", ESSAY)
        pg.wait_for_timeout(1100)
        check(re.match(r"⏱ 00:0[0-9]", pg.inner_text("#timer") or "") is not None, f"таймер идёт ({pg.inner_text('#timer')})")
        pg.click("#submitBtn")
        check(pg.evaluate("document.getElementById('essay').readOnly"), "после «Сдать» поле закрыто")
        check(pg.eval_on_selector_all(".theme:not([disabled])", "els => els.length") == 0, "темы больше не выбрать")
        check(pg.inner_text("#submitBtn") == "Сдано", "кнопка «Сдано»")
        check(pg.eval_on_selector_all(".crit-row", "els => els.length") == 4, "открылись критерии")
        check(pg.is_visible("#sampleArea .sample"), "открылся образец")
        check(pg.is_visible("#nextBtn"), "есть «Следующий текст»")

        print("6. тёмная тема и телефон")
        for theme in ("light", "dark"):
            pg = new_page(390, 800, theme, mode="practice")
            pg.goto(BASE + "/rus_oge13.html")
            sw = pg.evaluate("document.documentElement.scrollWidth")
            check(sw <= 390, f"{theme}: список без горизонтальной прокрутки ({sw})")
            pg.goto(BASE + f"/rus_oge13.html?t={tasks[40]['id']}")
            pg.click(".theme[data-k='2']")
            pg.fill("#essay", ESSAY)
            pg.click("#sampleBtn")
            pg.click("#checkBtn")
            sw = pg.evaluate("document.documentElement.scrollWidth")
            check(sw <= 390, f"{theme}: сочинение с образцом и критериями без прокрутки ({sw})")
            check(pg.evaluate("document.documentElement.dataset.theme") == theme, f"тема {theme} применилась")
        b.close()

    check(not errors, f"ошибок JS нет {errors[:3]}")
    print("\nИТОГ:", "всё прошло" if not FAILS else f"провалов {len(FAILS)}")
    sys.exit(1 if FAILS else 0)


if __name__ == "__main__":
    main()
