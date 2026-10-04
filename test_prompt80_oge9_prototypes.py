"""
Промпт №80: ОГЭ №9 переделан по прототипам — как остальные номера ОГЭ
(образец — oge6.html). Вместо движков линейных и квадратных уравнений и
дробно-рациональных с вариантами — 14 прототипов задания 9 и №0 из
демоверсии; сверху — блок «Научиться решать уравнения» со ссылками на
пошаговые тренажёры linear.html и quadratic.html.

Проверяет:
  A. экран выбора: блок «Научиться…» над типами, ссылки на linear.html и
     quadratic.html, сам он не карточка типа; №0 первым, 14 прототипов по
     порядку, «вперемешку» в группах; exam-nav открывает №0;
  B. генераторы: по 300 заданий каждого прототипа — ответ, пересчитанный
     здесь по исходным числам (meta), совпадает; ответ целый или до двух
     знаков после запятой; условие той же формы, что прототип (глагол,
     оговорка «больший/меньший»); у квадратных корни — как обещано; решение
     столбиком (.sol-line), дроби вертикальные, без «/»;
  C. ответ в интерфейсе: запятая, «−» и пробелы — верно; «5x» — не число;
     две ошибки — подставлен верный ответ с запятой; демоверсия −32;
  D. «вперемешку» и старые типы №9 (linear, quadratic, rational) из снимков
     открываются без ошибок нужным видом;
  E. доска: узел задания, ответ для живого поля, «ещё такое же» к
     заданию-движку, снятому до промпта №80;
  F. ссылка «Линейные уравнения» уводит на linear.html; совместная сессия —
     ученик видит то же задание (заглушка Supabase из теста №54);
  G. телефон 375 px: без прокрутки вбок.

Живой realtime из песочницы не проверить — совместный режим перепроверяется
на сайте руками.

Запуск: python3 test_prompt80_oge9_prototypes.py (сервер поднимается сам).
"""
import contextlib
import http.client
import math
import os
import re
import subprocess
import sys
import time
from fractions import Fraction

from playwright.sync_api import sync_playwright

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from test_prompt54_trainer_sync_and_cards import FAKE_LIB  # noqa: E402

PORT = 9000
BASE = f"http://127.0.0.1:{PORT}"

results = []


def check(name, ok, extra=""):
    results.append((name, ok))
    print(f"[{'OK' if ok else 'FAIL'}] {name}" + (f": {extra}" if extra and not ok else ""))


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
                conn.request("GET", "/index.html")
                conn.getresponse()
                break
            except Exception:
                time.sleep(0.1)
        else:
            raise RuntimeError("локальный сервер не поднялся")
        yield
    finally:
        proc.terminate()
        proc.wait(timeout=5)


def open_page(browser, width=1300, height=1000, fake=False, url="oge9.html", ready="() => window.__trainerState"):
    ctx = browser.new_context(viewport={"width": width, "height": height})
    page = ctx.new_page()
    errors = []
    page.on("pageerror", lambda e: errors.append(str(e)))
    if fake:
        page.add_init_script("try { localStorage.setItem('tsStage:direct', '1'); } catch (e) {}")
        page.route("**/supabase-js.umd.js", lambda route: route.fulfill(
            status=200, content_type="application/javascript", body=FAKE_LIB))
        page.route("**/fonts.googleapis.com/**", lambda route: route.abort())
        page.route("**/fonts.gstatic.com/**", lambda route: route.abort())
    else:
        page.route("https://**/*", lambda route: route.abort())
    page.goto(f"{BASE}/{url}")
    page.wait_for_function(ready)
    page.wait_for_timeout(300)
    return ctx, page, errors


# форма каждого прототипа: глагол условия, вид уравнения (по тексту без
# разметки), для квадратных — какой корень просят
PROTO = {
    "p1":  ("Найдите корень уравнения", r"^−?\d*x [+−] \d+ = −?\d*x$", None),
    "p2":  ("Решите уравнение", r"^(\d+)x − (\d+) = \d+ \+ \d+x$", None),
    "p3":  ("Найдите корень уравнения", r"^−?\d+ [+−] \d*x = −?\d*x [+−] \d+$", None),
    "p4":  ("Найдите корень уравнения", r"^\d+\(x \+ \d+\) = −?\d+$", None),
    "p5":  ("Найдите корень уравнения", r"^\d+\(x − \d+\) = −?\d+$", None),
    "p6":  ("Решите уравнение", r"^2\(x − (\d+)\) = x \+ (\d+)$", None),
    "p7":  ("Решите уравнение", r"^2\(x − (\d+)\) − x = (\d+)$", None),
    "p8":  ("Решите уравнение", r"^3\(x \+ (\d+)\) − 2\(x − (\d+)\) = (\d+)$", None),
    "p9":  ("Решите уравнение", r"^x2 − \d+ = 0$", "max"),
    "p10": ("Решите уравнение", r"^x2 − \d+ = 0$", "min"),
    "p11": ("Решите уравнение", r"^\d+x2 = −?\d+x$", "min"),
    "p12": ("Решите уравнение", r"^x2 [+−] \d*x [+−] \d+ = 0$", "max"),
    "p13": ("Решите уравнение", r"^x2 [+−] \d*x [+−] \d+ = 0$", "min"),
    "p14": ("Решите уравнение", r"^[245]x2 [+−] \d*x [+−] \d+ = 0$", "min"),
}


def two_places(v):
    return abs(round(v * 100) - v * 100) < 1e-6


# ─── A. экран выбора ───
def test_picker(browser):
    ctx, page, errors = open_page(browser)
    info = page.evaluate("""() => {
        const box = document.getElementById('learnBox');
        const area = document.getElementById('pickerArea');
        const first = area.firstElementChild;
        return {
          boxFirst: first === box,
          title: box.querySelector('.learn-title').textContent,
          links: [...box.querySelectorAll('a.learn-link')].map(a => [a.getAttribute('href'), a.textContent.trim()]),
          isCard: !!box.closest('.mode-card') || box.classList.contains('mode-card'),
          ids: [...document.querySelectorAll('#modesGrid .mode-card:not(.mix)')].map(c => c.dataset.id),
          mix: [...document.querySelectorAll('#modesGrid .mode-card.mix')].map(c => c.dataset.id),
          ex: document.querySelector('#modesGrid .mode-card[data-id="p8"] .msub').textContent,
          engines: !!document.getElementById('linEngineArea') || !!document.getElementById('quadEngineArea'),
          boxTop: box.getBoundingClientRect().top, cardsTop: document.querySelector('.mode-card').getBoundingClientRect().top,
        };
    }""")
    check("A: блок «Научиться решать уравнения» — первым на экране выбора",
          info["boxFirst"] and "Научиться решать уравнения" in info["title"] and info["boxTop"] < info["cardsTop"])
    check("A: ссылки на линейные и квадратные", info["links"] == [["linear.html", "Линейные уравнения →"],
                                                                   ["quadratic.html", "Квадратные уравнения →"]], str(info["links"]))
    check("A: блок не карточка типа", not info["isCard"])
    check("A: №0 первым, дальше 14 прототипов по порядку",
          info["ids"] == ["demo2027"] + [f"p{i}" for i in range(1, 15)], str(info["ids"]))
    check("A: «вперемешку» у линейных и квадратных", info["mix"] == ["randomLin", "randomQuad"], str(info["mix"]))
    check("A: у карточки пример уравнения", info["ex"] == "3(x + 4) − 2(x − 4) = 4", info["ex"])
    check("A: движков уравнений на странице нет", not info["engines"])
    check("A: без ошибок JS", not errors, str(errors[:1]))
    ctx.close()
    # стрелка с №8 открывает №9 на первом прототипе — №0, а не ссылку
    ctx, page, errors = open_page(browser, url="oge8.html", ready="() => document.getElementById('examNextBtn')")
    page.click("#examNextBtn")
    page.wait_for_url("**/oge9.html*")
    page.wait_for_function("() => window.__trainerState && document.getElementById('taskArea').style.display !== 'none'", timeout=10000)
    st = page.evaluate("() => window.__trainerState.get()")
    check("A: стрелка с №8 открывает №9 на №0", st["curMode"] == "demo2027" and not st["picker"], str(st.get("curMode")))
    check("A: стрелка — без ошибок JS", not errors, str(errors[:1]))
    ctx.close()


# ─── B. генераторы ───
def test_generators(browser):
    ctx, page, errors = open_page(browser)
    data = page.evaluate("""() => {
        const out = {};
        const strip = h => { const d = document.createElement('div'); d.innerHTML = h; return d; };
        ALL_MODES.forEach(m => {
          out[m.id] = [];
          for (let i = 0; i < (m.demo ? 3 : 300); i++) {
            const t = m.gen();
            const d = strip(t.prompt);
            const ex = d.querySelector('.expr-display');
            const sol = strip(t.explain);
            out[m.id].push({
              v: t.correctValue, meta: t.meta,
              verb: d.firstChild && d.firstChild.textContent,
              eq: ex ? ex.textContent : '',
              note: (d.querySelector('.task-note') || {}).textContent || '',
              lines: sol.querySelectorAll('.sol-line').length,
              fracs: sol.querySelectorAll('.frac').length,
              slash: /\\//.test(sol.textContent),
              hyphen: /-/.test(ex ? ex.textContent : '') || /-/.test(sol.textContent),
            });
          }
        });
        return out;
    }""")
    for pid, (verb, form, which) in PROTO.items():
        bad = []
        for t in data[pid]:
            v, meta = t["v"], t["meta"]
            if meta["kind"] == "lin":
                (lx, lc), (rx, rc) = meta["L"], meta["R"]
                want = Fraction(rc - lc, lx - rx)
            else:
                a, b, c = meta["a"], meta["b"], meta["c"]
                D = b * b - 4 * a * c
                s = math.isqrt(D)
                if D < 0 or s * s != D:
                    bad.append(("D", meta)); continue
                roots = sorted({Fraction(-b - s, 2 * a), Fraction(-b + s, 2 * a)})
                if len(roots) != 2:
                    bad.append(("один корень", meta)); continue
                want = roots[-1] if meta["which"] == "max" else roots[0]
                if meta["which"] != which:
                    bad.append(("which", meta)); continue
            if abs(float(want) - v) > 1e-9:
                bad.append(("ответ", v, float(want), t["eq"]))
            elif not two_places(v):
                bad.append(("знаков", v, t["eq"]))
            elif not (t["verb"] or "").startswith(verb):
                bad.append(("глагол", t["verb"]))
            elif not re.match(form, t["eq"].strip()):
                bad.append(("форма", t["eq"]))
            elif which and ("больший" if which == "max" else "меньший") not in t["note"]:
                bad.append(("оговорка", t["note"]))
            elif t["lines"] < 3 or t["slash"] or t["hyphen"]:
                bad.append(("решение", t["lines"], t["slash"], t["hyphen"], t["eq"]))
        check(f"B: {pid} — 300 заданий: ответ, форма, решение", not bad, str(bad[:3]))
    # особенности отдельных прототипов
    p2 = all(re.match(PROTO["p2"][1], t["eq"]).group(1) == re.match(PROTO["p2"][1], t["eq"]).group(2) for t in data["p2"])
    check("B: в №2 одно число при x и свободном члене (7x − 7)", p2)
    p68 = all(len(set(re.match(PROTO[k][1], t["eq"]).groups())) == 1 for k in ("p6", "p7", "p8") for t in data[k])
    check("B: в №6–8 одно и то же число в скобках и справа", p68)
    frac_ans = sum(1 for k in ("p1", "p3", "p4", "p5") for t in data[k] if not float(t["v"]).is_integer())
    check("B: в №1, 3, 4, 5 бывают дробные ответы", frac_ans > 300, str(frac_ans))
    p14 = sum(1 for t in data["p14"] for _ in [0] if t["fracs"] >= 2)
    check("B: дискриминант — дроби столбиком", p14 == 300, str(p14))
    p11 = {t["v"] == 0 for t in data["p11"]}
    check("B: №11 — и ответ 0 (как в прототипе), и отрицательный", p11 == {True, False})
    demo = data["demo2027"][0]
    check("B: №0 — 3(x + 8) − 2(x − 8) = 8, ответ −32", demo["eq"].strip() == "3(x + 8) − 2(x − 8) = 8" and demo["v"] == -32, str(demo))
    check("B: без ошибок JS", not errors, str(errors[:1]))
    ctx.close()


def set_task(page, mode, task_js):
    page.evaluate(f"""() => {{ curMode = '{mode}'; openTask(); curTask = {task_js}; renderCurrentTask(); }}""")


# ─── C. ответ в интерфейсе ───
def test_answer(browser):
    ctx, page, errors = open_page(browser)
    page.click('.mode-card[data-id="p4"]')
    page.wait_for_timeout(200)
    v = page.evaluate("() => curTask.correctValue")
    typed = str(v).replace(".", ",").replace("-", "− ")
    page.fill("#answerInput", typed)
    page.click("#checkAnswerBtn")
    page.wait_for_timeout(200)
    check("C: «−», запятая и пробел — верно", page.evaluate("() => taskAnswered && document.getElementById('answerInput').classList.contains('good')"), typed)
    check("C: решение открыто, строки столбиком", page.locator("#explainBox .sol-line").count() >= 4)
    page.click("#nextBtn")
    page.wait_for_timeout(200)
    v = page.evaluate("() => curTask.correctValue")
    page.fill("#answerInput", f"{v}x")
    page.click("#checkAnswerBtn")
    page.wait_for_timeout(100)
    check("C: «5x» — не число, неверно", page.evaluate("() => !taskAnswered && hadWrongPick"))
    page.fill("#answerInput", "100500")
    page.click("#checkAnswerBtn")
    page.wait_for_timeout(200)
    shown = page.input_value("#answerInput")
    check("C: две ошибки — подставлен верный ответ как в бланке",
          shown == str(v).replace(".", ",").replace("-", "−"), shown)
    page.click("#backBtn")
    page.click('.mode-card[data-id="demo2027"]')
    page.wait_for_timeout(200)
    page.fill("#answerInput", "-32")
    page.press("#answerInput", "Enter")
    page.wait_for_timeout(200)
    check("C: демоверсия решается ответом −32", page.evaluate("() => taskAnswered && !hadWrongPick"))
    page.click("#backBtn")
    page.wait_for_timeout(200)
    check("C: медали и история — свои у прототипа",
          page.evaluate("() => JSON.parse(localStorage.getItem('ogeProg:oge9:p4')).history.length") == 2)
    check("C: без ошибок JS", not errors, str(errors[:1]))
    ctx.close()


# ─── D. «вперемешку» и старые типы ───
def test_mix_legacy(browser):
    ctx, page, errors = open_page(browser)
    lin = {m for m in page.evaluate("() => GROUPS[1].modes.map(m => m.id)")}
    page.click('.mode-card[data-id="randomQuad"]')
    page.wait_for_timeout(200)
    seen = page.evaluate("""() => { const s = new Set(); for (let i = 0; i < 60; i++) { newTask(); s.add(curTask.meta.kind); } return [...s]; }""")
    check("D: «Квадратные вперемешку» — только квадратные", seen == ["quad"], str(seen))
    check("D: заголовок и без стрелок типов", page.inner_text("#taskTitle") == "Квадратные вперемешку"
          and not page.is_visible("#prevTypeBtn"))
    for old, want, kind in [("linear", "randomLin", "lin"), ("quadratic", "randomQuad", "quad"), ("rational", "random", None)]:
        page.evaluate("() => { document.getElementById('backBtn').click(); }")
        page.evaluate(f"""() => tsApplyState({{ picker: false, curMode: '{old}', curSubMode: 'exam',
                          curTask: {{ prompt: 'старое', options: ['1', '2'], correctIndex: 0 }} }})""")
        page.wait_for_timeout(150)
        st = page.evaluate("() => ({ m: curMode, k: curTask && curTask.meta && curTask.meta.kind, p: curTask && curTask.prompt })")
        check(f"D: старый тип «{old}» открывается как {want}",
              st["m"] == want and (kind is None or st["k"] == kind) and st["p"] != "старое", str(st))
    check("D: без ошибок JS", not errors, str(errors[:1]))
    ctx.close()


# ─── E. доска ───
def test_board(browser):
    ctx, page, errors = open_page(browser)
    page.add_script_tag(url="trainer-tasks.js")
    page.click('.mode-card[data-id="p5"]')
    page.wait_for_timeout(200)
    r = page.evaluate("""() => {
        const nodes = collectTrainerCaptureNodes(document, 'oge9');
        nodes.forEach(n => n.restore && n.restore());
        const info = trainerTaskInfo(window, 'oge9', document.getElementById('questionPanel'));
        const gen = trainerGenInfo(window, 'oge9', 'oge9.html', document.getElementById('questionPanel'));
        return { ids: nodes.map(n => n.el.id), info, v: curTask.correctValue, gen };
    }""")
    check("E: на доску снимается #questionPanel", r["ids"] == ["questionPanel"], str(r["ids"]))
    f = (r["info"] or {}).get("fields") or [{}]
    check("E: живое поле с ответом задания", r["info"] and r["info"]["kind"] == "fields"
          and abs(float(str(f[0].get("value", "nan")).replace(",", ".").replace("−", "-")) - r["v"]) < 1e-9, str(r["info"]))
    check("E: «ещё такое же» — снимок типа", r["gen"] and r["gen"]["kind"] == "state" and r["gen"]["snap"]["curMode"] == "p5")
    page.evaluate("() => genNewTaskInFrame(window, { kind: 'engine', mode: 'quadratic', lvl: 3 })")
    page.wait_for_timeout(600)
    st = page.evaluate("() => ({ m: curMode, k: curTask.meta.kind })")
    check("E: «ещё такое же» к старому заданию-движку — квадратные вперемешку", st == {"m": "randomQuad", "k": "quad"}, str(st))
    check("E: без ошибок JS", not errors, str(errors[:1]))
    ctx.close()


# ─── F. ссылка и сессия ───
def test_link_session(browser):
    ctx, page, errors = open_page(browser, fake=True)
    page.click("#learnBox a[href='linear.html']")
    page.wait_for_url("**/linear.html*", timeout=10000)
    check("F: «Линейные уравнения» открывает linear.html", "linear.html" in page.url, page.url)
    ctx.close()

    ctx = browser.new_context(viewport={"width": 1300, "height": 1000})
    errs = []

    def mk(url):
        p = ctx.new_page()
        p.add_init_script("try { localStorage.setItem('tsStage:direct', '1'); } catch (e) {}")
        p.route("**/supabase-js.umd.js", lambda route: route.fulfill(
            status=200, content_type="application/javascript", body=FAKE_LIB))
        p.route("**/fonts.googleapis.com/**", lambda route: route.abort())
        p.route("**/fonts.gstatic.com/**", lambda route: route.abort())
        p.on("pageerror", lambda e: errs.append(str(e)))
        p.goto(f"{BASE}/{url}")
        p.wait_for_function("() => window.__trainerState")
        return p

    teacher = mk("oge9.html")
    teacher.wait_for_function("() => window.TrainerSession && window.TrainerSession.getCode()", timeout=10000)
    code = teacher.evaluate("() => window.TrainerSession.getCode()")
    teacher.click('.mode-card[data-id="p12"]')
    teacher.wait_for_timeout(500)
    student = mk(f"oge9.html?s={code}")
    student.wait_for_timeout(2000)
    t = teacher.evaluate("() => curTask")
    s = student.evaluate("() => ({ m: curMode, t: curTask })")
    check("F: ученик на том же прототипе и задании", s["m"] == "p12" and s["t"] == t, str(s["m"]))
    student.click("#learnBox a[href='quadratic.html']") if student.is_visible("#learnBox") else None
    student.wait_for_timeout(500)
    check("F: ученик сам по ссылке не уходит", "oge9.html" in student.url, student.url)
    teacher.click("#refreshBtn")
    teacher.wait_for_timeout(900)
    check("F: новое задание учителя доехало", student.evaluate("() => curTask") == teacher.evaluate("() => curTask"))
    check("F: без ошибок JS", not errs, str(errs[:1]))
    ctx.close()


# ─── G. телефон ───
def test_phone(browser):
    for width in (375, 320):
        ctx, page, errors = open_page(browser, width=width, height=800)
        over = page.evaluate("() => document.documentElement.scrollWidth - window.innerWidth")
        check(f"G: {width}px — экран выбора без прокрутки вбок", over <= 0, str(over))
        page.click('.mode-card[data-id="p14"]')
        page.wait_for_timeout(300)
        page.evaluate("() => { document.getElementById('answerInput').value = '1'; submitInputAnswer(); document.getElementById('answerInput').value = '1'; submitInputAnswer(); }")
        page.wait_for_timeout(400)
        over = page.evaluate("() => document.documentElement.scrollWidth - window.innerWidth")
        check(f"G: {width}px — задание с решением без прокрутки вбок", over <= 0, str(over))
        check(f"G: {width}px — без ошибок JS", not errors, str(errors[:1]))
        ctx.close()


def run():
    with local_server(), sync_playwright() as p:
        browser = p.chromium.launch()
        test_picker(browser)
        test_generators(browser)
        test_answer(browser)
        test_mix_legacy(browser)
        test_board(browser)
        test_link_session(browser)
        test_phone(browser)
        browser.close()
    bad = [n for n, ok in results if not ok]
    print()
    if bad:
        print(f"ПРОВАЛЫ ({len(bad)} из {len(results)}):")
        for n in bad:
            print("  -", n)
        sys.exit(1)
    print(f"ИТОГ: всё прошло ({len(results)} проверок)")


if __name__ == "__main__":
    run()
