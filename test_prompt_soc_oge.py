"""
Тренажёр «ОГЭ обществознание» (soc_oge.html, краткий ответ) — номера КИМ 2027 из открытого банка
ФИПИ на той же странице, что ЕГЭ профиль / ЕГЭ база / ОГЭ ч. 2 / английский (sync_ege_pages.py).
Развёрнутые ответы той же страницы — test_prompt_soc_oge_long.py.

Проверяет:
  1. страница не разошлась с ege_prof.html (кроме блока настроек EXAM);
  2. данные: каждое задание экспорта (fipi-pilot/full_oge_soc/export_short.json) — на странице, с
     принятым ФИПИ ключом, флагом any у №3, числом пунктов №14, всеми вариантами; ключ проходит
     проверку самой страницы; нет «$» (съел бы KaTeX) и обрывков разметки ФИПИ; номера КИМ 2027;
  3. навигация как в математике: ◀ ▶ над названием по №1–20, «← все задания», «◀ Предыдущий тип /
     Следующий тип ▶» по видам внутри номера, «◀ Предыдущее / Следующее задание ▶», ⟳ — задание
     того же вида, 📥 «В подборку», счётчик и «История решённого» самой нижней кнопкой;
  4. ответы: выбор — нажатием на сам вариант, как в ОГЭ №7 (без строки «Ответ: 1 2 3 4»), одна
     попытка в «Экзамене» и две в «Тренировке», цифры 1–4 с клавиатуры и Enter, тот же st.yn у
     собеседника в совместной сессии; №2 без регистра и «ё/е», №3
     с перестановкой внутри колонки (и без неё, если нет флага), №14 — «1 балл из 2» без указания
     позиции, неполный ответ — просьба дописать, а не ошибка, разбор и ответ после решения;
  5. как в математике, но без калькулятора, клавиатуры, «+» и клетки на доске; цвет — зелёный
     обществознания; кнопки доски, полноэкранного режима, совместного доступа и конспекта на месте;
  6. мост состояния и подборка: снимок переносит номер, задание и результат; id позиции soc<номер>;
  7. главная и старые адреса: все 20 номеров ведут на soc_oge.html, ?n=…&t=… открывает то задание;
     прогресс прежней страницы переносится один раз;
  8. телефон и тёмная тема: без ошибок JS и горизонтальной прокрутки на всех заданиях №2, 3, 14,
     контраст белого на залитых кнопках не ниже 4,5:1.

Совместный режим здесь на заглушке (Supabase отрезан): живьём — на сайте руками.

Запуск: ~/.venvs/trainers/bin/python test_prompt_soc_oge.py (сервер поднимается сам).
"""
import contextlib
import http.client
import json
import os
import subprocess
import sys
import time

from playwright.sync_api import sync_playwright

PORT = 8993
BASE = f"http://127.0.0.1:{PORT}"
HERE = os.path.dirname(os.path.abspath(__file__))
EXPORT = os.path.join(os.path.dirname(HERE), "fipi-pilot", "full_oge_soc", "export_short.json")
SHORT = [2, 3, 4, 5, 6, 9, 10, 11, 13, 14, 15, 16]
COUNTS = {2: 82, 3: 87, 4: 123, 5: 233, 6: 287, 9: 193, 10: 98, 11: 97, 13: 50, 14: 91, 15: 223, 16: 210}
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


def settle(page):
    page.wait_for_function("() => !window.__fipiBusy || !window.__fipiBusy()")
    page.wait_for_timeout(150)


def open_n(page, n):
    page.goto(f"{BASE}/soc_oge.html?n={n}")
    settle(page)


def open_first_task(page, n):
    open_n(page, n)
    page.click("#protoList .mode-card")
    page.wait_for_selector("#taskArea", state="visible")
    page.wait_for_timeout(150)


def check_btn(page):
    page.click("#answerArea .check-btn")
    page.wait_for_timeout(150)


def opt(val):
    """Вариант ответа — кнопка в самом условии (EXAM.optButtons), а не строка «Ответ: 1 2 3 4»"""
    return f'#questionText .soc-opts > .soc-opt[data-val="{val}"]'


def opt_state(page):
    """классы четырёх вариантов: ['sel', 'correct wrong', …]"""
    return page.evaluate("[...document.querySelectorAll('#questionText .soc-opts > .soc-opt')].map(e => "
                         "['sel', 'correct', 'wrong', 'disabled'].filter(c => e.classList.contains(c)).join(' '))")


def stats(page):
    return tuple(int(page.inner_text(s)) for s in ("#stSolved", "#stErrors", "#stStreak"))


def contrast_white(rgb):
    def lin(c):
        c /= 255
        return c / 12.92 if c <= 0.03928 else ((c + 0.055) / 1.055) ** 2.4
    lum = 0.2126 * lin(rgb[0]) + 0.7152 * lin(rgb[1]) + 0.0722 * lin(rgb[2])
    return 1.05 / (lum + 0.05)


def bg_rgb(page, selector):
    s = page.evaluate(f"getComputedStyle(document.querySelector('{selector}')).backgroundColor")
    return [float(x) for x in s[s.index("(") + 1:-1].split(",")[:3]]


def main():
    print("1. страница — копия ege_prof.html")
    r = subprocess.run([sys.executable, "sync_ege_pages.py", "--check"], cwd=HERE, capture_output=True, text=True)
    check(r.returncode == 0, "sync_ege_pages.py --check: страницы не разошлись")
    check("soc_oge.html совпадает" in r.stdout, "soc_oge.html — среди копий")

    with local_server(), sync_playwright() as p:
        browser = p.chromium.launch()
        ctx, page, errors = new_page(browser)

        print("2. данные: ничего не потеряно")
        open_n(page, 2)
        dump = page.evaluate("""async (nums) => {
          const out = {};
          for (const n of nums) {
            await new Promise(r => ensureFipi(n, r));
            out[n] = { title: task(n).title, points: task(n).points, protos: protos(n).map(p => {
              const f = (p.fields || [])[0] || {};
              const st = { yn: { [f.id]: f.value } };
              return { id: p.id, fipi: p.fipi, type: f.type, value: f.value, anyCols: !!f.anyCols, hint: f.hint || '',
                       choices: f.choices || null, oneTry: !!f.oneTry, halfNote: !!f.halfNote, text: p.text,
                       group: p.group, passes: checkField(f, f.value, st) === true, steps: (p.steps || []).length, answerTex: p.answerTex };
            }) };
          }
          return out;
        }""", SHORT)
        export = json.load(open(EXPORT, encoding="utf-8"))["tasks"]
        by_id = {t["id"]: t for t in export}
        check(sum(len(dump[str(n)]["protos"]) for n in SHORT) == 1774, "на странице все 1774 задания с кратким ответом")
        for n in SHORT:
            check(len(dump[str(n)]["protos"]) == COUNTS[n], f"№{n}: {COUNTS[n]} заданий (номера КИМ 2027)")
        lost = []
        for n in SHORT:
            ps = dump[str(n)]["protos"]
            ids = {q["id"] for q in ps}
            lost += [t["id"] for t in export if t["n"] == n and t["id"] not in ids]
            for q in ps:
                t = by_id[q["id"]]
                if t["n"] != n:
                    lost.append(q["id"] + ": номер")
                if q["value"] != t["a"] or not t["ok"]:
                    lost.append(q["id"] + ": ключ")
                if not q["passes"] or not q["steps"] or not q["answerTex"] or q["fipi"] != q["id"]:
                    lost.append(q["id"] + ": проверка, разбор или источник")
                if t["k"] == "one":
                    if q["choices"] != [str(i + 1) for i in range(len(t["o"]))] or not q["oneTry"]:
                        lost.append(q["id"] + ": варианты")
                    if q["text"].count('class="soc-opt"') != len(t["o"]):
                        lost.append(q["id"] + ": варианты в условии")
                if t["k"] == "pair" and q["anyCols"] != bool(t.get("any")):
                    lost.append(q["id"] + ": флаг any")
                if t["k"] == "match" and (not q["halfNote"] or f"от 1 до {t['m']}" not in q["hint"]):
                    lost.append(q["id"] + ": №14")
                if "$" in q["text"] or any(x in q["text"] for x in ("ShowPicture", "MsoNormal", "files_location", "<span lang")):
                    lost.append(q["id"] + ": разметка в условии")
        check(not lost, f"ключи, варианты, флаги и подсказки совпадают с экспортом ({lost[:4]})")
        check(sum(1 for q in dump["3"]["protos"] if q["anyCols"]) == 87, "у всех 87 заданий №3 — флаг any")
        check(dump["14"]["points"] == 2 and dump["5"]["points"] == 1, "баллы: №14 — 2, остальные краткие — 1")
        check(all(q["group"] for n in SHORT for q in dump[str(n)]["protos"]), "у каждого задания есть вид")

        print("3. навигация как в математике")
        open_n(page, 5)
        check(page.inner_text("#pageTitle").strip() == "ОГЭ обществознание · №5", "заголовок «ОГЭ обществознание · №5»")
        check("1 балл" in page.inner_text("#pageSub"), "подзаголовок с названием номера и баллом")
        cards = page.locator("#protoList .mode-card")
        check(cards.count() > 3, f"в списке карточки видов ({cards.count()})")
        check(page.locator("#protoList .proto-section").count() > 1, "виды разложены по разделам")
        cards.nth(0).click()
        page.wait_for_timeout(200)
        check(page.inner_text("#backBtn").strip() == "← все задания", "кнопка «← все задания»")
        check(page.is_visible("#prevTypeBtn") and page.is_visible("#nextTypeBtn"), "«◀ Предыдущий тип / Следующий тип ▶»")
        check(page.inner_text("#prevProtoBtn").strip() == "◀ Предыдущее задание" and page.inner_text("#nextProtoBtn").strip() == "Следующее задание ▶",
              "«◀ Предыдущее задание / Следующее задание ▶»")
        g0, p0 = page.evaluate("[curProto.group, S.pid]")
        page.click("#nextProtoBtn")
        page.wait_for_timeout(150)
        check(page.evaluate("curProto.group") == g0 and page.evaluate("S.pid") != p0, "«Следующее задание ▶» — того же вида")
        page.click("#refreshBtn")
        page.wait_for_timeout(150)
        check(page.evaluate("curProto.group") == g0, "⟳ «Обновить задание» — другое задание того же вида")
        page.click("#nextTypeBtn")
        page.wait_for_timeout(150)
        g1 = page.evaluate("curProto.group")
        check(g1 != g0, "«Следующий тип ▶» — другой вид")
        page.click("#prevTypeBtn")
        page.wait_for_timeout(150)
        check(page.evaluate("curProto.group") == g0, "«◀ Предыдущий тип» — обратно")
        page.click("#backBtn")
        page.wait_for_timeout(150)
        check(page.is_visible("#protoList"), "«← все задания» — к списку видов")
        check(page.locator("#examPrevBtn").count() == 1 and page.locator("#examNextBtn").count() == 1, "стрелки ◀ ▶ над названием")
        order = page.evaluate("[...document.querySelectorAll('#examPrevBtn, #pageTitle, #examNextBtn')].map(e => e.id)")
        check(order == ["examPrevBtn", "pageTitle", "examNextBtn"], "стрелки по бокам названия")
        open_n(page, 1)
        check(page.is_disabled("#examPrevBtn"), "на №1 левая стрелка неактивна")
        page.click("#examNextBtn")
        page.wait_for_timeout(400)
        settle(page)
        check(page.evaluate("S.n") == 2 and "soc_oge.html" in page.url, "▶ с №1 (развёрнутый) — №2 (краткий) на той же странице")
        page.click("#examPrevBtn")
        page.wait_for_timeout(400)
        check(page.evaluate("S.n") == 1, "◀ — обратно на №1")
        open_n(page, 20)
        check(page.is_disabled("#examNextBtn"), "на №20 правая стрелка неактивна")
        open_n(page, 16)
        page.click("#examNextBtn")
        page.wait_for_timeout(400)
        check(page.evaluate("S.n") == 17, "▶ с №16 — №17, задание из демоверсии")

        print("4. ответы: выбор, №2, №3, №14")
        # выбор одного из четырёх — нажатием на сам вариант, как в ОГЭ №7
        open_first_task(page, 9)
        key = page.evaluate("fieldsOf(curProto)[0].value")
        wrong = next(c for c in "1234" if c != key)
        check(page.locator("#answerArea .yn-btn").count() == 0 and page.locator("#answerArea .p2-field").count() == 0,
              "строки «Ответ: 1 2 3 4» нет")
        check(page.locator("#questionText .soc-opts > div.soc-opt.opt-btn[role=button][data-bd-opt]").count() == 4
              and [page.get_attribute(f"#questionText .soc-opt >> nth={i}", "data-val") for i in range(4)] == list("1234"),
              "варианты — четыре кнопки (role=button) с пометкой data-bd-opt, по номерам 1–4")
        check(page.evaluate("document.querySelector('#questionText .soc-opt').textContent.trim().startsWith('1)')"),
              "в кнопке номер и текст варианта")
        check("Проверить" == page.inner_text("#answerArea .check-btn").strip(), "кнопка «Проверить» (для клавиатуры)")
        check_btn(page)
        check("Выбери" in page.inner_text("#answerArea .answer-msg") and stats(page)[1] == 0, "без выбора — просьба ответить, не ошибка")
        page.click(opt(wrong))
        page.wait_for_timeout(150)
        check(page.evaluate("S.answered && !S.correct") and stats(page)[1] == 1, "«Экзамен»: одна попытка на выбор, сразу ответ")
        st = opt_state(page)
        check(st[int(wrong) - 1] == "wrong disabled" and st[int(key) - 1] == "correct disabled",
              f"выбранный — красным, верный подсвечен, все закрыты ({st})")
        before = stats(page)
        page.click(opt(key), force=True)
        page.wait_for_timeout(100)
        check(stats(page) == before and page.evaluate("!S.correct"), "после ответа варианты не нажимаются")
        check(page.evaluate("S.yn.a") == wrong or page.evaluate("Object.values(S.yn)[0]") == wrong, "выбор лежит в S.yn (то же состояние, что у кнопок-номеров)")
        check(page.is_visible("#solSteps") and "Верный вариант" in page.inner_text("#solSteps"), "открыт верный вариант")
        check(page.is_visible("#solAnswer") and key in page.inner_text("#solAnswer"), "ответ под разбором")
        check("(1)" in page.inner_text("#exampleHistoryToggle"), "история решённого — 1")
        page.click("#nextBtn")
        page.wait_for_timeout(150)
        check(opt_state(page) == [""] * 4 and not page.evaluate("S.answered"), "в новом задании варианты чистые")
        page.click("#tabPractice")
        key = page.evaluate("fieldsOf(curProto)[0].value")
        wrong = next(c for c in "1234" if c != key)
        check(page.is_visible("#showSolutionBtn"), "«Тренировка»: кнопка «Показать решение и ответ»")
        page.click(opt(wrong))
        page.wait_for_timeout(150)
        check(not page.evaluate("S.answered"), "«Тренировка»: после ошибки можно ещё раз")
        st = opt_state(page)
        check(st[int(wrong) - 1] == "wrong" and st[int(key) - 1] == "", f"неверный — красным, верный пока не открыт ({st})")
        page.click(opt(key))
        page.wait_for_timeout(150)
        check(page.evaluate("S.answered && S.correct"), "вторая попытка верна — засчитано")
        st = opt_state(page)
        check(st[int(key) - 1] == "correct disabled", f"верный — зелёным ({st})")

        # клавиатура: цифра выбирает, Enter проверяет
        page.click("#nextBtn")
        page.wait_for_timeout(150)
        page.click("#tabExam")
        key = page.evaluate("fieldsOf(curProto)[0].value")
        wrong = next(c for c in "1234" if c != key)
        page.evaluate("document.activeElement && document.activeElement.blur()")
        page.keyboard.press("7")
        check(opt_state(page) == [""] * 4, "цифры вне 1–4 ничего не выбирают")
        page.keyboard.press("Enter")
        page.wait_for_timeout(100)
        check("Выбери" in page.inner_text("#answerArea .answer-msg") and not page.evaluate("S.answered"), "Enter без выбора — просьба выбрать")
        page.keyboard.press(wrong)
        check(page.evaluate("S.yn.a") == wrong and not page.evaluate("S.answered"), "цифра выбирает вариант, не проверяя")
        check(opt_state(page)[int(wrong) - 1] == "sel", "выбранный вариант с рамкой")
        check(page.evaluate("document.activeElement.dataset.val") == wrong, "фокус на выбранном варианте: Enter на нём проверяет")
        page.keyboard.press(key)
        check(page.evaluate("S.yn.a") == key and opt_state(page).count("sel") == 1, "другая цифра переносит выбор")
        page.keyboard.press("Enter")
        page.wait_for_timeout(150)
        check(page.evaluate("S.answered && S.correct"), "Enter — проверить: верно")
        st = opt_state(page)
        check(st[int(key) - 1] == "correct disabled", "верный выбранный зелёный")
        # цифра в поле ввода — это цифра в поле, а не выбор
        open_first_task(page, 3)
        page.click("#answerArea input.answer-input")
        page.keyboard.type("12")
        check(page.input_value("#answerArea input.answer-input") == "12" and not page.evaluate("Object.keys(S.yn).length"),
              "№3 (поле): цифры набираются в поле")

        # у всех заданий с выбором — кнопки, у остальных — прежнее поле
        bad = page.evaluate("""async (nums) => {
          const bad = [];
          for (const n of nums) {
            await new Promise(r => ensureFipi(n, r));
            for (const p of protos(n)) {
              openTask(n, p.id);
              const f = fieldsOf(p)[0];
              const btns = document.querySelectorAll('#questionText .soc-opts > div.soc-opt.opt-btn[role=button][data-bd-opt]').length;
              const rows = document.querySelectorAll('#answerArea .yn-btn').length;
              if (f.type === 'yesno') { if (btns !== f.choices.length || rows) bad.push(p.id + ': ' + btns + '/' + rows); }
              else if (btns || !document.querySelector('#answerArea input.answer-input')) bad.push(p.id + ': поле');
            }
          }
          return bad;
        }""", [4, 5, 6, 9, 10, 11, 13, 15, 16])
        check(not bad, f"№4, 5, 6, 9, 10, 11, 13, 15, 16: у каждого задания с выбором — кнопки-варианты, строки «Ответ» нет ({bad[:4]})")
        # №2: слово
        open_first_task(page, 2)
        key = page.evaluate("fieldsOf(curProto)[0].value")
        page.fill("#answerArea input.answer-input", "  " + key.upper().replace("Е", "Ё", 1) + ". ")
        check_btn(page)
        check(page.evaluate("S.correct"), f"№2: регистр, ё/е и точка не мешают («{key}»)")
        check(page.evaluate("document.querySelector('.soc-text table').classList.contains('grid')"), "№2: у таблицы с пропуском есть рамка")
        # №3
        open_first_task(page, 3)
        key = page.evaluate("fieldsOf(curProto)[0].value")
        check("сходства" in page.inner_text("#answerArea"), "№3: подсказка про сходства и различия")
        page.fill("#answerArea input.answer-input", key[1] + key[0] + key[3] + key[2])
        check_btn(page)
        check(page.evaluate("S.correct"), "№3: с флагом any перестановка внутри колонок — верно")
        check("сходства" in page.inner_text("#solAnswer"), "№3: ответ по колонкам")
        res = page.evaluate("""(key) => {
          const f = { type: 'plain', seq: true, exactLen: true, value: key };
          return [checkField(f, key, {}), checkField(f, key[1] + key[0] + key[2] + key[3], {}),
                  checkField(Object.assign({ anyCols: true }, f), key[2] + key[3] + key[0] + key[1], {})];
        }""", key)
        check(res == [True, False, False], "№3: без флага — только принятый порядок; между колонками менять нельзя и с флагом")
        # №14
        open_first_task(page, 14)
        key = page.evaluate("fieldsOf(curProto)[0].value")
        before = stats(page)
        page.fill("#answerArea input.answer-input", key[:-1])
        check_btn(page)
        check("подряд" in page.inner_text("#answerArea .answer-msg") and stats(page) == before, "№14: неполный ответ — просьба дописать, не ошибка")
        one_off = ("1" if key[0] != "1" else "2") + key[1:]
        page.fill("#answerArea input.answer-input", one_off)
        check_btn(page)
        msg = page.inner_text("#answerArea .answer-msg")
        check("1 балл из 2" in msg and "А" not in msg.replace("ОГЭ", ""), "№14: одна неверная буква — «1 балл из 2», без указания где")
        two_off = ("1" if key[0] != "1" else "2") + ("1" if key[1] != "1" else "2") + key[2:]
        page.fill("#answerArea input.answer-input", two_off)
        check_btn(page)
        check("1 балл" not in page.inner_text("#answerArea .answer-msg"), "№14: две неверные — приписки нет")
        check(page.evaluate("S.answered && !S.correct"), "№14: вторая неудачная попытка открывает ответ")
        check("А — " in page.inner_text("#solAnswer"), "№14: ответ по буквам")
        check(page.is_visible("#critBox") and "максимум 2" in page.inner_text("#critSummary"), "№14: критерии на 2 балла")
        opened = page.evaluate("""() => {
          const heads = protos(14).filter(p => /col-heads/.test(p.text));
          return [heads.length, heads.filter(p => (p.text.match(/class="col-head"/g) || []).length === 2).length];
        }""")
        check(opened[0] > 80 and opened[0] == opened[1], f"№14: копии шапки в обеих колонках ({opened})")

        print("5. как в математике, без лишнего; цвет обществознания")
        open_first_task(page, 5)
        check(not page.is_visible("#calcTools"), "кнопок «Сложить / Вычесть…» нет")
        check(page.locator("#answerArea .sym-bar").count() == 0, "символов π, √ нет")
        check(not page.is_visible("#keypadFloat") and not page.is_visible("#kpToggle"), "цифровой клавиатуры нет")
        check(not page.is_visible("#addRail"), "колонки «+» нет")
        ink = page.evaluate("getComputedStyle(document.documentElement).getPropertyValue('--ink').trim()")
        check(ink.upper() == "#17694F", f"зелёный обществознания, как на главной ({ink})")
        grid = page.evaluate("""() => {
          const c = document.getElementById('boardCanvasBg');
          const d = c.getContext('2d').getImageData(0, 0, c.width, Math.min(c.height, 200)).data;
          for (let i = 3; i < d.length; i += 4) if (d[i]) return true;
          return false;
        }""")
        check(not grid, "доска на тренажёре без клетчатой подложки")
        check(page.is_visible("#basketAddBtn") and page.is_visible("#refreshBtn"), "📥 и ⟳ в шапке задания")
        check(page.locator("#boardToolbar").count() == 1, "доска на месте")
        for sel, name in (("#tsShareBtn, .ts-share-btn", "совместный доступ"), ("#focusToggle", "полноэкранный режим"),
                          ("#lnBtn", "конспект"), ("#boardVisibilityToggle", "кнопка доски")):
            check(page.locator(sel).count() >= 1, f"{name} на месте")
        order = page.evaluate("""() => {
          const y = s => document.querySelector(s).getBoundingClientRect().top;
          return y('#questionPanel') < y('.stats') && y('.stats') < y('#exampleHistoryToggle');
        }""")
        check(order, "счётчик внизу, «История решённого» — самой нижней кнопкой")
        check([page.inner_text(f"#{t}").strip() for t in ("tabLearn", "tabPractice", "tabExam")] == ["Обучение", "Тренировка", "Экзамен"], "вкладки режимов как в математике")

        print("6. мост состояния и подборка")
        open_first_task(page, 10)
        page.click("#nextProtoBtn")
        page.wait_for_timeout(150)
        key10 = page.evaluate("fieldsOf(curProto)[0].value")
        page.click(opt(key10))
        page.wait_for_timeout(150)
        snap = page.evaluate("tsGetState()")
        ctx2, page2, err2 = new_page(browser)
        open_n(page2, 1)
        page2.evaluate("s => tsApplyState(s)", snap)
        page2.wait_for_timeout(800)
        check(page2.evaluate("S.n") == 10 and page2.evaluate("S.pid") == snap["egePid"], "снимок переносит номер и задание")
        check(page2.evaluate("S.answered && S.correct"), "и результат проверки")
        check(opt_state(page2)[int(key10) - 1] == "correct disabled" and page2.evaluate("Object.values(S.yn)[0]") == key10,
              "у собеседника верный вариант зелёный: тот же S.yn")
        # и наоборот: собеседник выбирает цифрой (ещё без проверки) — выбор виден первой вкладке
        page2.evaluate("openTask(S.n, protoNeighbour(1).id)")
        page2.wait_for_timeout(150)
        k2 = page2.evaluate("fieldsOf(curProto)[0].value")
        w2 = next(c for c in "1234" if c != k2)
        page2.keyboard.press(w2)
        snap2 = page2.evaluate("tsGetState()")
        page.evaluate("s => tsApplyState(s)", snap2)
        page.wait_for_timeout(400)
        check(page.evaluate("S.pid") == snap2["egePid"] and page.evaluate("Object.values(S.yn)[0]") == w2
              and opt_state(page)[int(w2) - 1] == "sel", "выбор собеседника виден на первой вкладке")
        check(not err2, f"на второй вкладке ошибок нет ({err2[:2]})")
        ctx2.close()
        page.click("#basketAddBtn")
        page.wait_for_timeout(300)
        items = page.evaluate("window.Basket ? Basket.all() : []")
        check(any(it.get("trainerId") == "soc10" for it in items), "«В подборку» — задание с id soc10")
        mine = next((it for it in items if it.get("trainerId") == "soc10"), {})
        check("<button" not in mine.get("html", "") and all(f'<div class="basket-block">{i})' in mine.get("html", "") for i in "1234")
              and "opt-btn" not in mine.get("html", ""), "в подборке варианты прежним списком, без кнопок")

        print("7. главная и старые адреса")
        page.goto(f"{BASE}/index.html?subject=soc")
        page.wait_for_timeout(400)
        check(page.locator('a.topic-item[href^="soc_oge.html"]').count() == 20, "все 20 номеров ведут на soc_oge.html")
        check(page.locator('a.topic-item[href^="soc_oge_long"]').count() == 0, "на soc_oge_long.html ссылок нет")
        for n in range(1, 21):
            page.goto(f"{BASE}/soc_oge.html?n={n}")
            settle(page)
            if page.evaluate("S.n") != n or not page.evaluate("protos(S.n).length"):
                check(False, f"№{n} не открылся")
        names = page.evaluate("Object.keys(BANK).length")
        check(names == 21, "в банке 20 номеров и блок «Дополнительно к тексту»")
        tid = dump["9"]["protos"][7]["id"]
        page.goto(f"{BASE}/soc_oge.html?n=9&t={tid}")
        settle(page)
        page.wait_for_timeout(200)
        check(page.evaluate("S.screen") == "task" and page.evaluate("S.pid") == tid, "старый адрес ?n=9&t=… открывает то же задание")
        check("t=" not in page.url, "дальше адрес показывает только номер")
        page.goto(f"{BASE}/soc_oge.html?n=9")
        settle(page)
        check(page.evaluate("S.screen") == "picker" and page.evaluate("S.n") == 9, "старый адрес ?n=9 — тот же номер")

        ctx3, page3, err3 = new_page(browser)
        page3.goto(f"{BASE}/index.html")
        ok_id = dump["9"]["protos"][3]["id"]
        page3.evaluate("""(id) => {
          localStorage.setItem('socOge:results', JSON.stringify({ [id]: 'ok', ZZZ: 'bad' }));
        }""", ok_id)
        open_n(page3, 9)
        res = page3.evaluate("(id) => [isSolved(id), isSolved('ZZZ'), localStorage.getItem('socOge:results')]", ok_id)
        check(res == [True, False, None], "прогресс старой страницы перенесён один раз: решённое — решено, старый ключ снят")
        ctx3.close()
        check(not errors, f"ошибок JS нет ({errors[:2]})")
        ctx.close()

        print("8. телефон и тёмная тема")
        ctx, page, errors = new_page(browser, 360, 800, theme="dark")
        for n in (2, 3, 5, 14, 16):
            open_first_task(page, n)
            sw = page.evaluate("document.documentElement.scrollWidth")
            check(sw <= 361, f"№{n}: без горизонтальной прокрутки ({sw})")
        wide = page.evaluate("""async () => {
          const bad = [];
          for (const n of [2, 3, 14]) {
            await new Promise(r => ensureFipi(n, r));
            for (const p of protos(n)) {
              openTask(n, p.id);
              const over = [...document.querySelectorAll('#questionText, #questionText *')].some(e => e.getBoundingClientRect().right > innerWidth + 1);
              if (document.documentElement.scrollWidth > innerWidth || over) bad.push(p.id);
            }
          }
          return bad;
        }""")
        check(not wide, f"все задания №2, 3, 14 помещаются в 360 px ({wide[:4]})")
        open_first_task(page, 14)
        check(page.evaluate("getComputedStyle(document.querySelector('.soc-text .col-head')).display") == "block", "№14: шапка у каждой колонки")
        check(page.evaluate("document.documentElement.dataset.theme") == "dark", "тёмная тема")
        ink = page.evaluate("getComputedStyle(document.documentElement).getPropertyValue('--ink').trim()")
        check(ink.upper() == "#2F8F70", f"тёмный зелёный, как на главной ({ink})")
        for sel in ("#tabExam", "#answerArea .check-btn"):
            c = contrast_white(bg_rgb(page, sel))
            check(c >= 4.5, f"белый на {sel}: контраст {c:.1f}")
        page.fill("#answerArea input.answer-input", page.evaluate("fieldsOf(curProto)[0].value"))
        check_btn(page)
        c = contrast_white(bg_rgb(page, "#nextBtn"))
        check(c >= 4.5, f"белый на «Следующее задание»: контраст {c:.1f}")
        check(not errors, f"ошибок JS нет ({errors[:2]})")
        ctx.close()
        browser.close()

    print("\nИТОГ:", "всё ок" if not FAILS else f"{len(FAILS)} ошибок")
    sys.exit(1 if FAILS else 0)


if __name__ == "__main__":
    main()
