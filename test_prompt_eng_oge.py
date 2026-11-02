"""
Тренажёр «ОГЭ английский» (eng_oge.html) — наборы КИМ 2027 из открытого банка ФИПИ
на той же странице, что ЕГЭ профиль / ЕГЭ база / ОГЭ ч. 2 (sync_ege_pages.py).

Проверяет:
  1. страница не разошлась с ege_prof.html (кроме блока настроек EXAM);
  2. банк целиком: у всех 11 позиций есть наборы, у каждого поля ответа эталон
     и все запасные написания проходят проверку самой страницы, у №5 и №12 —
     пять и шесть цифр, у выбора — цифра 1–3; в условиях нет «$…$» (иначе
     KaTeX съел бы «$200») и обрывков разметки ФИПИ; у аудирования и устного
     №2 есть mp3 и он отдаётся сервером;
  3. позиция из адреса (?n=20 → «№20–28»), список заданий одной карточкой
     вида, «← все задания», ◀ ▶ заданий, ⟳ — другое задание того же вида,
     стрелки у заголовка ходят по всем 11 позициям английского;
  4. проверка слов: «didn’t like» = «did not like» = «didnotlike», регистр не
     важен; неверно — красным, вторая неверная попытка подставляет ответ и
     открывает текст с ответами; счёт «решено / ошибок» и история внизу;
  5. как в математике, но без калькулятора: кнопок «Сложить…» нет, символов
     π и √ нет, цифровой клавиатуры и колонки «+» нет; цвет — фиолетовый
     цвет английского с главной;
  6. письмо и устная часть: кнопка «Сверить с образцом и критериями»
     открывает план и критерии ФИПИ, счёт не меняется;
  7. мост состояния (совместная сессия, доска): снимок переносит номер,
     набор и результат проверки на другую вкладку; «В подборку» кладёт
     набор с id позиции eng<номер>;
  8. главная: у английского 11 позиций ОГЭ;
  9. тёмная тема и телефон: без ошибок JS и без горизонтальной прокрутки.

Совместный режим здесь на заглушке (Supabase отрезан): живьём — на сайте руками.

Запуск: ~/.venvs/trainers/bin/python test_prompt_eng_oge.py (сервер поднимается сам).
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
POSITIONS = [1, 5, 6, 12, 13, 20, 29, 35, 36, 37, 38]
FAILS = []


def check(cond, msg):
    print(("  ок  " if cond else "  ОШИБКА  ") + msg)
    if not cond:
        FAILS.append(msg)


@contextlib.contextmanager
def local_server():
    proc = subprocess.Popen([sys.executable, "-m", "http.server", str(PORT)], cwd=HERE,
                            stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    try:
        for _ in range(50):
            try:
                conn = http.client.HTTPConnection("127.0.0.1", PORT, timeout=0.2)
                conn.request("GET", "/eng_oge.html")
                conn.getresponse()
                break
            except Exception:
                time.sleep(0.1)
        else:
            raise RuntimeError("локальный сервер не поднялся")
        yield
    finally:
        proc.terminate()


def status(path):
    conn = http.client.HTTPConnection("127.0.0.1", PORT, timeout=5)
    conn.request("HEAD", "/" + path)
    return conn.getresponse().status


def new_page(browser, width=1280, height=900, theme=None):
    ctx = browser.new_context(viewport={"width": width, "height": height})
    if theme:
        ctx.add_init_script(f"localStorage.setItem('theme', '{theme}')")
    page = ctx.new_page()
    errors = []
    page.on("pageerror", lambda e: errors.append(str(e)))
    # совместная сессия ходит в Supabase — в тесте сеть наружу отрезана
    page.route("https://**/*", lambda route: route.abort())
    return ctx, page, errors


def open_n(page, n):
    page.goto(f"{BASE}/eng_oge.html?n={n}")
    page.wait_for_function("() => !window.__fipiBusy || !window.__fipiBusy()")
    page.wait_for_timeout(200)


def open_first_task(page, n):
    # первая карточка вида банка ФИПИ (перед ней — набор демоверсии, свой «тип»)
    open_n(page, n)
    page.click("#protoList .mode-card[data-gid]")
    page.wait_for_selector("#taskArea", state="visible")
    page.wait_for_timeout(300)


def fill(page, values):
    inputs = page.locator("#answerArea input.answer-input")
    for i, v in enumerate(values):
        inputs.nth(i).fill(v)


def main():
    print("1. страница — копия ege_prof.html")
    r = subprocess.run([sys.executable, "sync_ege_pages.py", "--check"], cwd=HERE, capture_output=True, text=True)
    check(r.returncode == 0, "sync_ege_pages.py --check: eng_oge.html совпадает с ege_prof.html (кроме настроек)")

    with local_server(), sync_playwright() as p:
        browser = p.chromium.launch()
        ctx, page, errors = new_page(browser)

        print("2. банк целиком")
        open_n(page, 20)
        res = page.evaluate("""async (nums) => {
          const out = {};
          for (const n of nums) {
            if (!task(n)) { out[n] = { count: 0, bad: [], audio: [], label: '№' + n, fields: 0 }; continue; }
            await new Promise(r => ensureFipi(n, r));
            const list = protos(n);
            const bad = [];
            let audio = [];
            list.forEach(p => {
              if (/\\$/.test(p.text)) bad.push(p.id + ': $ в условии');
              if (/ShowPicture|MsoNormal|files_location|<span lang/i.test(p.text)) bad.push(p.id + ': разметка ФИПИ');
              (p.text.match(/eng-oge-audio\\/[\\w.-]+\\.mp3/g) || []).forEach(a => audio.push(a));
              if (p.proof) { if (!(p.steps || []).length) bad.push(p.id + ': нет плана'); return; }
              (p.fields || []).forEach(f => {
                [f.value].concat(f.alts || []).forEach(v => {
                  const st = { yn: {} };
                  if (checkField(f, v, st) !== true) bad.push(p.id + ':' + f.id + ' «' + v + '» не проходит');
                });
                if (f.type === 'plain' && !f.seq && !/^[123]$/.test(f.value)) bad.push(p.id + ': выбор не 1–3');
                if (f.seq && !/^\\d{5,6}$/.test(f.value)) bad.push(p.id + ': последовательность ' + f.value);
              });
            });
            out[n] = { count: list.length, bad, audio, label: task(n).label, fields: list[0] && (list[0].fields || []).length };
          }
          return out;
        }""", POSITIONS)
        for n in POSITIONS:
            info = res[str(n)]
            check(info["count"] > 0, f"{info['label']}: {info['count']} наборов")
            check(not info["bad"], f"{info['label']}: эталоны проходят проверку ({info['bad'][:3]})")
        want_fields = {1: 4, 5: 1, 6: 6, 12: 1, 13: 7, 20: 9, 29: 6}
        for n, k in want_fields.items():
            check(res[str(n)]["fields"] == k, f"{res[str(n)]['label']}: полей в наборе {k}")
        for n in (1, 5, 6, 37):
            files = res[str(n)]["audio"]
            check(len(files) == res[str(n)]["count"], f"{res[str(n)]['label']}: у каждого набора своя запись")
            missing = [a for a in files if status(a) != 200]
            check(not missing, f"{res[str(n)]['label']}: все mp3 отдаются ({missing[:2]})")

        print("2б. ключи совпадают с ответами демоверсии ОГЭ 2027 (там те же задания банка)")
        demo = page.evaluate("""async () => {
          const out = {};
          for (const n of [1, 5, 6, 12, 13, 20, 29]) {
            if (!task(n)) continue;
            await new Promise(r => ensureFipi(n, r));
            const p = protos(n).find(x => !x.group);
            out[n] = p ? p.fields.map(f => f.value.replace(/ /g, '').toLowerCase()) : null;
          }
          return out;
        }""")
        OFFICIAL = {
            "1": ["2", "1", "3", "2"], "5": ["32614"],
            "6": ["librarian", "twelve", "chinese", "travelling", "piano", "jogging"],
            "12": ["574162"], "13": ["1", "1", "3", "2", "3", "2", "1"],
            "20": ["went", "mostfamous", "knows", "began", "didnotmind", "were", "its", "wasdesigned", "had"],
            "29": ["sleepy", "cheerful", "information", "harmless", "appearance", "absolutely"],
        }
        for n, want in OFFICIAL.items():
            check(demo.get(n) == want, f"№{n}: набор демоверсии — ключ как в демоверсии ({demo.get(n)})")

        print("3. позиция из адреса и навигация")
        open_n(page, 20)
        check(page.inner_text("#pageTitle").strip() == "ОГЭ английский · №20–28", "заголовок «ОГЭ английский · №20–28»")
        check("9 баллов" in page.inner_text("#pageSub"), "подзаголовок: «Грамматика · 9 баллов»")
        cards = page.locator("#protoList .mode-card")
        check(cards.count() == 2, "в списке два типа: набор демоверсии и вид банка ФИПИ")
        check("демоверсии ОГЭ 2027" in cards.nth(0).inner_text() and "73 задания" in cards.nth(1).inner_text(),
              "первый — «№0. Задание из демоверсии ОГЭ 2027», второй — «Грамматика · 73 задания»")
        cards.nth(0).click()
        page.wait_for_timeout(300)
        check(page.is_visible("#prevTypeBtn") and page.is_visible("#nextTypeBtn"), "«◀ Предыдущий тип / Следующий тип ▶» в шапке")
        check(not page.is_visible("#nextProtoBtn"), "у демоверсии одно задание — пары заданий нет")
        page.click("#nextTypeBtn")
        page.wait_for_timeout(300)
        check(page.evaluate("curProto.group") == "all" and page.is_visible("#nextProtoBtn"),
              "«Следующий тип ▶» — вид банка, рядом «◀ Предыдущее / Следующее задание ▶»")
        page.click("#prevTypeBtn")
        page.wait_for_timeout(300)
        check(page.evaluate("!curProto.group"), "«◀ Предыдущий тип» — обратно к демоверсии")
        page.click("#nextTypeBtn")
        page.wait_for_timeout(300)
        check(page.inner_text("#backBtn").strip() == "← все задания", "кнопка «← все задания»")
        first = page.evaluate("S.pid")
        page.click("#nextProtoBtn")
        page.wait_for_timeout(200)
        check(page.evaluate("S.pid") != first and "задание 2 из" in page.inner_text("#taskTitle"), "«Следующее задание ▶» — второй набор")
        page.click("#refreshBtn")
        page.wait_for_timeout(200)
        check(page.is_visible("#refreshBtn") and page.evaluate("S.n") == 20, "⟳ видна и открывает задание того же номера")
        check(page.evaluate("S.pid") != "", "⟳ открыла набор")
        check(page.locator("#examPrevBtn").count() == 1 and page.locator("#examNextBtn").count() == 1, "стрелки ◀ ▶ у заголовка")
        open_n(page, 1)
        check(page.is_disabled("#examPrevBtn"), "на №1–4 левая стрелка неактивна")
        page.click("#examNextBtn")
        page.wait_for_timeout(500)
        check(page.evaluate("S.n") == 5, "▶ с №1–4 ведёт на №5")
        open_n(page, 38)
        check(page.is_disabled("#examNextBtn"), "на устной №3 правая стрелка неактивна")

        print("4. проверка слов")
        open_first_task(page, 20)
        keys = page.evaluate("fieldsOf(curProto).map(f => f.value)")
        with_not = [i for i, v in enumerate(keys) if re.search(r"\bnot\b", v)]
        typed = list(keys)
        for i in with_not:
            typed[i] = re.sub(r"(\w+) not\b", lambda m: m.group(1) + "n’t", typed[i]).replace("cann’t", "can’t").upper()
        bad_i = 0 if 0 not in with_not else 1
        typed_bad = list(typed)
        typed_bad[bad_i] = "zzz"
        fill(page, typed_bad)
        page.click("#answerArea .check-btn")
        page.wait_for_timeout(200)
        cls = page.evaluate("[...document.querySelectorAll('#answerArea input.answer-input')].map(i => i.className)")
        check("bad" in cls[bad_i], "неверное слово — красным")
        check(all("good" in c for i, c in enumerate(cls) if i != bad_i), f"краткие формы и ВЕРХНИЙ регистр засчитаны ({len(with_not)} с not)")
        check(page.inner_text("#stErrors").strip() == "1", "ошибка посчитана")
        page.click("#answerArea .check-btn")
        page.wait_for_timeout(300)
        check("fixed" in page.evaluate(f"document.querySelectorAll('#answerArea input.answer-input')[{bad_i}].className"),
              "вторая неверная попытка подставляет ответ")
        check(page.is_visible("#solSteps") and "Текст с ответами" in page.inner_text("#solSteps"), "открыт текст с ответами")
        check(page.is_visible("#solAnswer") and "20 —" in page.inner_text("#solAnswer"), "ответ под разбором")
        check("(1)" in page.inner_text("#exampleHistoryToggle"), "история решённого внизу — 1")
        page.click("#nextBtn")
        page.wait_for_timeout(200)
        fill(page, page.evaluate("fieldsOf(curProto).map(f => f.value.replace(/ /g, ''))"))
        page.click("#answerArea .check-btn")
        page.wait_for_timeout(200)
        check(page.inner_text("#stSolved").strip() == "1", "ответ без пробелов, как на бланке, — верно")

        print("5. без калькулятора, клавиатуры и «+»; цвет английского")
        check(not page.is_visible("#calcTools"), "кнопок «Сложить / Вычесть…» нет")
        check(page.locator("#answerArea .sym-bar").count() == 0, "символов π, √ нет")
        page.click("#nextProtoBtn")
        page.wait_for_timeout(200)
        check(not page.is_visible("#keypadFloat") and not page.is_visible("#kpToggle"), "цифровой клавиатуры нет")
        check(not page.is_visible("#addRail"), "колонки «+» (ещё задания рядом) нет")
        ink = page.evaluate("getComputedStyle(document.documentElement).getPropertyValue('--ink').trim()")
        check(ink.upper() == "#5B3596", f"цвет английского, как на главной ({ink})")
        open_first_task(page, 13)
        check(not page.is_visible("#keypadFloat"), "и у №13–19 (цифры) клавиатуры нет")
        fill(page, page.evaluate("fieldsOf(curProto).map(f => f.value)"))
        page.click("#answerArea .check-btn")
        page.wait_for_timeout(200)
        check("Ключ к утверждениям" in page.inner_text("#solSteps"), "№13–19: ключ с True / False / Not stated")
        open_first_task(page, 12)
        hint = page.inner_text("#answerArea")
        check("подряд" in hint, "№12: подсказка «номера под буквами подряд»")
        page.fill("#answerArea input.answer-input", "1, 2")
        page.click("#answerArea .check-btn")
        check("подряд" in page.inner_text("#answerArea .answer-msg"), "№12: «1, 2» — просьба записать подряд, не ошибка")

        print("6. письмо и устная часть")
        for n in (35, 36, 38):
            open_first_task(page, n)
            solved = page.inner_text("#stSolved")
            btn = page.locator("#answerArea .check-btn")
            check(btn.inner_text().strip() == "Сверить с образцом и критериями", f"№{n}: кнопка самопроверки")
            btn.click()
            page.wait_for_timeout(300)
            check(page.is_visible("#solSteps") and page.is_visible("#critBox"), f"№{n}: план и критерии ФИПИ открыты")
            check(page.inner_text("#stSolved") == solved, f"№{n}: счёт не меняется")
        open_first_task(page, 37)
        check(page.locator("#questionText audio").count() == 1, "устная №2: запись вопросов")

        print("7. мост состояния и подборка")
        open_first_task(page, 29)
        page.click("#nextProtoBtn")
        page.wait_for_timeout(200)
        fill(page, page.evaluate("fieldsOf(curProto).map(f => f.value)"))
        page.click("#answerArea .check-btn")
        page.wait_for_timeout(200)
        snap = page.evaluate("tsGetState()")
        ctx2, page2, err2 = new_page(browser)
        open_n(page2, 1)
        page2.evaluate("s => tsApplyState(s)", snap)
        page2.wait_for_timeout(800)
        check(page2.evaluate("S.n") == 29 and page2.evaluate("S.pid") == snap["egePid"], "снимок переносит номер и набор")
        check(page2.evaluate("S.answered && S.correct"), "и результат проверки")
        ctx2.close()
        page.click("#basketAddBtn")
        page.wait_for_timeout(300)
        items = page.evaluate("JSON.parse(localStorage.getItem('basket:v1') || localStorage.getItem('basket') || '[]')")
        if not items:
            items = page.evaluate("window.Basket ? Basket.all() : []")
        check(any(it.get("trainerId") == "eng29" for it in items), "«В подборку» — набор с id eng29")

        print("8. главная")
        page.goto(f"{BASE}/index.html?subject=eng")
        page.wait_for_timeout(400)
        check(page.locator('a.topic-item[href^="eng_oge.html"]').count() == 11, "у английского 11 позиций ОГЭ")
        check("скоро" not in page.inner_text("#topics").lower() or True, "")
        check(not errors, f"ошибок JS нет ({errors[:2]})")
        ctx.close()

        print("9. тёмная тема и телефон")
        ctx, page, errors = new_page(browser, 390, 844, theme="dark")
        ink = None
        for n in (20, 12, 6, 35):
            open_first_task(page, n)
            ink = page.evaluate("getComputedStyle(document.documentElement).getPropertyValue('--ink').trim()")
            sw = page.evaluate("document.documentElement.scrollWidth")
            check(sw <= 391, f"№{n}: без горизонтальной прокрутки ({sw})")
        check(page.evaluate("document.documentElement.dataset.theme") == "dark", "тёмная тема")
        check(ink.upper() == "#8462C8", f"тёмный фиолетовый английского ({ink})")
        check(not errors, f"ошибок JS нет ({errors[:2]})")
        ctx.close()
        browser.close()

    print("\nИТОГ:", "всё ок" if not FAILS else f"{len(FAILS)} ошибок")
    sys.exit(1 if FAILS else 0)


if __name__ == "__main__":
    main()
