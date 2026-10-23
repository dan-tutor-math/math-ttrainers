"""
Лёгкие карточки «+» №1 (пилот): ОГЭ №7 — карточки рисуются прямо на
странице из данных задания (task-cards.js), а не копией всей страницы в
iframe (trainer-multi.js).

Что проверяем:
  - на странице нет trainer-multi.js и ни одного iframe-карточки;
  - +3 — три карточки сразу под заданием (после #mainPanel, выше
    калькулятора и счётчиков), задания того же типа, все разные;
  - выбор варианта: верно — зелёный и разбор, счётчик «решено»; неверно —
    красный, счётчик ошибок, можно выбрать ещё; вторая ошибка — показан
    верный вариант и разбор;
  - режимы: в «Экзамене» нет кнопки разбора, в «Тренировке» она есть и
    работает, в «Обучении» у карточки виден план;
  - ⟳ у карточки, «− Убрать», «⟳ Все», «Убрать все»;
  - «Следующий тип» — карточки пересоздаются под новый тип в том же числе;
    на экране выбора типа колонка «+» и карточки спрятаны;
  - решённая карточка попадает в историю примеров;
  - общий снимок сессии: вторая вкладка принимает карточки как есть;
    запоздавший снимок не откатывает свежий ответ; более новый список
    собеседника принимается, а свежий ответ на оставшейся карточке — нет;
  - +10 на «телефоне» (процессор ×4 медленнее) — сколько времени (печатаем).

Совместный режим живьём отсюда не проверить (websocket до Supabase закрыт) —
снимки передаём между вкладками руками, через те же функции, что и сессия.

Запуск: python3 test_prompt_cards1_oge7.py (сервер поднимается сам).
"""
import contextlib
import http.client
import os
import subprocess
import sys
import time

from playwright.sync_api import sync_playwright

HERE = os.path.dirname(os.path.abspath(__file__))
PORT = 8986
BASE = f"http://127.0.0.1:{PORT}"

fails = []


def check(cond, msg):
    print(("[OK]   " if cond else "[FAIL] ") + msg)
    if not cond:
        fails.append(msg)


@contextlib.contextmanager
def local_server():
    proc = subprocess.Popen([sys.executable, "-m", "http.server", str(PORT)],
                            cwd=HERE, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    try:
        for _ in range(50):
            try:
                c = http.client.HTTPConnection("127.0.0.1", PORT, timeout=0.2)
                c.request("GET", "/index.html")
                c.getresponse()
                break
            except Exception:
                time.sleep(0.1)
        yield
    finally:
        proc.terminate()
        proc.wait(timeout=5)


def open_page(b, errors, **ctx_kw):
    ctx = b.new_context(**ctx_kw)
    pg = ctx.new_page()
    pg.on("pageerror", lambda e: errors.append(str(e)))
    pg.route("https://**/*", lambda r: r.abort())
    pg.goto(f"{BASE}/oge7.html")
    pg.wait_for_function("() => !!window.TaskCards && !!document.querySelector('#addRail')")
    return ctx, pg


def open_type(pg, n):
    """n-й тип из списка (не «вперемешку» и не демоверсия)."""
    pg.evaluate("""(n) => { const c = [...document.querySelectorAll('.mode-card[data-id]')]
        .filter(e => e.dataset.id !== 'random' && !e.classList.contains('demo'))[n]; c.click(); }""", n)
    pg.wait_for_timeout(200)


def add(pg, n):
    if not pg.evaluate("document.getElementById('addRail').classList.contains('open')"):
        pg.click("#addRailToggle")
    pg.click(f'.add-qty-btn[data-n="{n}"]')
    pg.wait_for_timeout(100)


CARDS = "() => TaskCards._cards().map(c => ({ id: c.id, p: c.task.prompt, a: c.answered, w: c.wrong, s: c.sol }))"
# начало условия без разметки — по нему видно тип задания
HEAD = """(sel) => [...document.querySelectorAll(sel)].map(e => e.textContent.replace(/\\s+/g, ' ').trim().slice(0, 14))"""
STATS = "() => [+stSolved.textContent, +stErrors.textContent]"


def run():
    with local_server(), sync_playwright() as pw:
        b = pw.chromium.launch()
        errors = []
        ctx, pg = open_page(b, errors, viewport={"width": 1280, "height": 900})

        check(pg.evaluate("!document.querySelector('script[src=\"trainer-multi.js\"]')"),
              "trainer-multi.js на странице не подключён")
        check(not pg.evaluate("document.getElementById('addRail').offsetParent"),
              "на экране выбора типа колонки «+» не видно")

        open_type(pg, 0)
        add(pg, 3)
        cards = pg.evaluate(CARDS)
        check(len(cards) == 3 and pg.evaluate("document.querySelectorAll('.tc-card').length") == 3,
              "+3 — три карточки")
        check(pg.evaluate("document.querySelectorAll('iframe[src*=\"card=1\"], .tm-card').length") == 0,
              "ни одной карточки-кадра")
        main = pg.evaluate("document.getElementById('questionPromptText').innerHTML")
        check(len({c["p"] for c in cards} | {main}) == 4, "задания в карточках разные и не повторяют основное")
        heads = pg.evaluate(HEAD, ".tc-card .prompt")
        main_head = pg.evaluate(HEAD, "#questionPromptText")[0]
        check(all(h == main_head for h in heads), f"карточки того же типа, что основное: {main_head!r} / {heads}")
        order = pg.evaluate("""() => { const w = document.getElementById('tcCards');
            return [w.previousElementSibling && w.previousElementSibling.id, w.nextElementSibling && w.nextElementSibling.id]; }""")
        check(order == ["mainPanel", "calcTools"], f"карточки сразу под заданием, выше калькулятора {order}")

        # ── ответы ──
        s0 = pg.evaluate(STATS)
        ci = pg.evaluate("TaskCards._cards()[0].task.correctIndex")
        pg.click(f'.tc-card:nth-child(1) .mcq-btn[data-i="{ci}"]')
        s1 = pg.evaluate(STATS)
        st = pg.evaluate("""() => { const c = document.querySelector('.tc-card:nth-child(1)');
            return [c.querySelector('.mcq-btn.correct') && +c.querySelector('.mcq-btn.correct').dataset.i,
                    !!c.querySelector('.explain')]; }""")
        check(st == [ci, True] and s1[0] == s0[0] + 1, f"верный выбор: зелёный, разбор, «решено» +1 ({st}, {s0}→{s1})")
        ci2 = pg.evaluate("TaskCards._cards()[1].task.correctIndex")
        wrong = [i for i in range(4) if i != ci2]
        pg.click(f'.tc-card:nth-child(2) .mcq-btn[data-i="{wrong[0]}"]')
        s2 = pg.evaluate(STATS)
        st2 = pg.evaluate("""() => { const c = document.querySelector('.tc-card:nth-child(2)');
            return [!!c.querySelector('.mcq-btn.wrong'), !!c.querySelector('.mcq-btn.correct'), !!c.querySelector('.explain')]; }""")
        check(st2 == [True, False, False] and s2[1] == s1[1] + 1,
              f"первая ошибка: красный, верный не показан, ошибок +1 ({st2})")
        pg.click(f'.tc-card:nth-child(2) .mcq-btn[data-i="{wrong[1]}"]')
        st3 = pg.evaluate("""() => { const c = document.querySelector('.tc-card:nth-child(2)');
            return [c.querySelectorAll('.mcq-btn.wrong').length, !!c.querySelector('.mcq-btn.correct'), !!c.querySelector('.explain')]; }""")
        check(st3 == [2, True, True], f"вторая ошибка: показан верный вариант и разбор ({st3})")
        hist = pg.evaluate("document.getElementById('exampleHistoryToggle').textContent")
        check("(2)" in hist, f"решённые карточки — в истории примеров ({hist.strip()})")

        # ── режимы ──
        check(pg.evaluate("document.querySelectorAll('.tc-card .tc-sol').length") == 0,
              "«Экзамен»: у карточек нет кнопки разбора")
        pg.click("#tabPractice")
        pg.wait_for_timeout(450)
        check(pg.evaluate("!!document.querySelector('.tc-card:nth-child(3) .tc-sol')"),
              "«Тренировка»: у нерешённой карточки есть кнопка разбора")
        pg.click(".tc-card:nth-child(3) .tc-sol")
        check(pg.evaluate("!!document.querySelector('.tc-card:nth-child(3) .explain .answer-line')"),
              "«Тренировка»: разбор с ответом открывается")
        pg.click("#tabLearn")
        pg.wait_for_timeout(450)
        has_plan = pg.evaluate("!!TaskCards._cards()[2].task.plan")
        if has_plan:
            check(pg.evaluate("!!document.querySelector('.tc-card:nth-child(3) .plan')"), "«Обучение»: у карточки виден план")
        pg.click("#tabExam")
        pg.wait_for_timeout(450)

        # ── ⟳, убрать, всё ──
        before = pg.evaluate(CARDS)
        pg.click(".tc-card:nth-child(1) .tc-refresh")
        after = pg.evaluate(CARDS)
        check(after[0]["p"] != before[0]["p"] and not after[0]["a"] and after[1]["id"] == before[1]["id"],
              "⟳ у карточки — новое задание только в ней")
        pg.click(".tc-card:nth-child(2) .tc-remove")
        check(len(pg.evaluate(CARDS)) == 2, "«− Убрать» убирает одну карточку")
        pg.click("#tcRefreshAll")
        ref = pg.evaluate(CARDS)
        check(len(ref) == 2 and not ({c["p"] for c in ref} & {c["p"] for c in after}), "«⟳ Все» — новые задания во всех")

        # ── смена типа и экран выбора ──
        pg.click("#nextTypeBtn")
        pg.wait_for_timeout(700)
        nt = pg.evaluate(CARDS)
        heads = pg.evaluate(HEAD, ".tc-card .prompt")
        main_head = pg.evaluate(HEAD, "#questionPromptText")[0]
        check(len(nt) == 2 and all(h == main_head for h in heads) and not ({c["p"] for c in nt} & {c["p"] for c in ref}),
              f"«Следующий тип» — карточки того же числа под новый тип ({main_head!r} / {heads})")
        pg.click("#backBtn")
        pg.wait_for_timeout(450)
        check(not pg.evaluate("document.getElementById('addRail').offsetParent")
              and not pg.evaluate("document.getElementById('tcCards').offsetParent"),
              "экран выбора типа: колонка «+» и карточки спрятаны")
        pg.click("#tcClearBtn") if pg.evaluate("document.getElementById('tcClearBtn').offsetParent") else None

        # ── общий снимок сессии ──
        open_type(pg, 2)
        pg.wait_for_timeout(450)
        add(pg, 2)
        snap_old = pg.evaluate("JSON.stringify(window.__trainerState.get())")
        errors2 = []
        ctx2, pg2 = open_page(b, errors2, viewport={"width": 1280, "height": 900})
        pg2.evaluate("(s) => window.__trainerState.apply(JSON.parse(s))", snap_old)
        pg2.wait_for_timeout(450)
        same = pg2.evaluate(CARDS) == pg.evaluate(CARDS) and pg2.evaluate("document.querySelectorAll('.tc-card').length") == len(pg.evaluate(CARDS))
        check(same, "вторая вкладка приняла карточки из снимка как есть")
        # ученик отвечает во второй вкладке, учитель получает его снимок
        ci = pg2.evaluate("TaskCards._cards()[0].task.correctIndex")
        pg2.click(f'.tc-card:nth-child(1) .mcq-btn[data-i="{ci}"]')
        snap_ans = pg2.evaluate("JSON.stringify(window.__trainerState.get())")
        pg.evaluate("(s) => window.__trainerState.apply(JSON.parse(s))", snap_ans)
        check(pg.evaluate("TaskCards._cards()[0].answered") is True, "ответ собеседника на карточке доходит")
        # запоздавший снимок (до ответа) не откатывает ответ
        pg2.evaluate("(s) => window.__trainerState.apply(JSON.parse(s))", snap_old)
        check(pg2.evaluate("TaskCards._cards()[0].answered") is True, "запоздавший снимок не откатывает свежий ответ")
        # учитель добавил карточку (список новее), а ответ ученика — свежее его копии
        n_before = len(pg.evaluate(CARDS))
        pg.click('.add-qty-btn[data-n="1"]') if pg.evaluate("document.getElementById('addRail').classList.contains('open')") else add(pg, 1)
        pg.evaluate("TaskCards._cards()[0].answered = false; TaskCards._cards()[0].rev = 0")  # у учителя ответ «не дошёл»
        snap_list = pg.evaluate("JSON.stringify(window.__trainerState.get())")
        pg2.evaluate("(s) => window.__trainerState.apply(JSON.parse(s))", snap_list)
        c2 = pg2.evaluate(CARDS)
        check(len(c2) == n_before + 1 and c2[0]["a"] is True,
              "новый список собеседника принят, свежий ответ на оставшейся карточке сохранён")
        check(not errors and not errors2, f"без ошибок JS {errors[:1]} {errors2[:1]}")
        ctx.close(); ctx2.close()

        # ── +10 на «телефоне» ──
        errors = []
        ctx, pg = open_page(b, errors, viewport={"width": 390, "height": 844}, device_scale_factor=3)
        cdp = ctx.new_cdp_session(pg)
        cdp.send("Emulation.setCPUThrottlingRate", {"rate": 4})
        open_type(pg, 0)
        pg.wait_for_timeout(500)
        t = time.time()
        add(pg, 10)
        pg.wait_for_function("document.querySelectorAll('.tc-card').length === 10")
        dt = time.time() - t
        print(f"[--]   +10 на телефоне (процессор ×4): {dt:.2f} с (с кадрами было ~4 с)")
        check(not errors, f"телефон: без ошибок JS {errors[:1]}")
        ctx.close()
        b.close()
    print()
    if fails:
        print("ПРОВАЛЫ:", len(fails))
        sys.exit(1)
    print("ИТОГ: всё прошло")


if __name__ == "__main__":
    run()
