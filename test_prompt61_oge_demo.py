"""
Промпт №61: задания демоверсии ОГЭ-2027 в тренажёрах ОГЭ.

Проверяет:
  1. №6–19: в каждом тренажёре есть нулевой тип — задание из демоверсии
     (в №7 он «00», в №10 — «Тип 0», в №15–18 — в каждой из четырёх групп,
     в №19 появился экран выбора типа). Условие — как в демоверсии, верный
     ответ из ключа ФИПИ засчитывается, задание не меняется от «обновить»;
  2. в «Случайно» нулевой тип не попадает;
  3. №9: уравнение 3(x + 8) − 2(x − 8) = 8 решается по шагам в линейном
     движке до x = −32 (обе скобки слева, деление на 1 пропущено);
  4. №1–5: «Шина 0 · Демоверсия ОГЭ 2027» — пять заданий с теорией
     демоверсии, ответы из ключа ФИПИ; «Шина 1» на месте и не тронута;
     присоединившийся к сессии получает теорию Шины 0 по одному id задания;
  5. №19: экран выбора и тип едут в общем снимке сессии;
  6. №20–25: на главной вкладка ОГЭ разбита на две части, у второй шесть
     номеров, каждый открывает oge_part2.html с заданием из демоверсии;
     эталонные ответы засчитываются, неверный — ошибка; №24 (доказательство)
     только открывает доказательство и не меняет счёт; рисунки решений на
     месте; oge_part2.html совпадает с ege_prof.html кроме настроек;
  7. доски: номера 20–25 в панели тренажёров, снимок задания и подписи;
  8. ответы ключа пересчитаны здесь же независимо (арифметика демоверсии).

Совместный режим здесь без сети: живьём (вебсокет к Supabase) его нужно
перепроверять на сайте руками.

Запуск: python3 test_prompt61_oge_demo.py (сервер поднимается сам).
"""
import contextlib
import http.client
import math
import os
import subprocess
import sys
import time

from playwright.sync_api import sync_playwright

PORT = 8984
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


results = []


def check(name, ok, extra=""):
    results.append((name, ok))
    print(f"[{'OK' if ok else 'FAIL'}] {name}" + (f": {extra}" if extra and not ok else ""))


def new_page(browser, url, wait=1200, width=1300):
    ctx = browser.new_context(viewport={"width": width, "height": 1000})
    page = ctx.new_page()
    errors = []
    page.on("pageerror", lambda e: errors.append(str(e)))
    page.route("https://**/*", lambda route: route.abort())
    page.goto(url)
    page.wait_for_timeout(wait)
    return ctx, page, errors


def open_type(page, type_id, wait=500):
    page.click(f'.mode-card[data-id="{type_id}"]')
    page.wait_for_timeout(wait)


# ─── 8. ключ демоверсии, пересчитанный независимо ───
def test_key_arithmetic():
    check("ключ: №6 5,2 · 3,1 = 16,12", abs(5.2 * 3.1 - 16.12) < 1e-9)
    check("ключ: №7 √77 — точка D (между 8,5 и 9)", 8.5 < math.sqrt(77) < 9)
    check("ключ: №8 7⁸ · 10⁶ / 70⁶ = 49", 7 ** 8 * 10 ** 6 // 70 ** 6 == 49 and 7 ** 8 * 10 ** 6 % 70 ** 6 == 0)
    x = -32
    check("ключ: №9 x = −32", 3 * (x + 8) - 2 * (x - 8) == 8)
    blue_black = 200 - 31 - 25 - 38
    check("ключ: №10 (31 + 53) / 200 = 0,42", blue_black % 2 == 0 and (31 + blue_black // 2) / 200 == 0.42)
    check("ключ: №12 R = 361,25 / 8,5² = 5", abs(361.25 / 8.5 ** 2 - 5) < 1e-12)
    check("ключ: №14 200 / 2⁴ = 12,5", 200 / 2 ** (32 // 8) == 12.5)
    A, C = 50, 25
    check("ключ: №15 ∠B = 105°", 180 - A - C == 105 and A == 2 * C)
    check("ключ: №16 S = 14² = 196", (2 * 7) ** 2 == 196)
    check("ключ: №17 больший отрезок 9 / 2 = 4,5", max(2 / 2, 9 / 2) == 4.5)
    check("ключ: №18 √(4² + 3²) = 5", math.hypot(4, 3) == 5)
    # шины: 175/70 R12 с завода
    D1 = 12 * 25.4 + 2 * 175 * 0.70
    D2 = 13 * 25.4 + 2 * 175 * 0.65
    check("ключ: шины №2 165 · 0,65 = 107,25", abs(165 * 0.65 - 107.25) < 1e-9)
    check("ключ: шины №3 D = 549,8", abs(D1 - 549.8) < 1e-9)
    check("ключ: шины №4 113,75 − 111 = 2,75", abs(175 * 0.65 - 185 * 0.60 - 2.75) < 1e-9)
    check("ключ: шины №5 ≈ 1,4 %", round((D2 - D1) / D1 * 100, 1) == 1.4)
    # часть 2
    ok20 = True
    for i in range(-400, 401):
        t = i / 50
        if t == 0:
            continue
        want = t <= 9 / t + 1e-12
        got = t <= -3 or (0 < t <= 3)
        ok20 = ok20 and want == got
    check("ключ: №20 x ≤ 9/x ⟺ (−∞; −3] ∪ (0; 3]", ok20)
    check("ключ: №21 224/14 − 224/16 = 2", 224 / 14 - 224 / 16 == 2)

    def roots(m):
        # y = (x + 1)² при x ≥ −2 и y = x + 6 при x < −2
        n = 0
        if m >= 0:
            n += sum(1 for r in {-1 + math.sqrt(m), -1 - math.sqrt(m)} if r >= -2)
        if m - 6 < -2:
            n += 1
        return n
    ms = [k / 4 for k in range(-20, 30)]
    two = [m for m in ms if roots(m) == 2]
    want = [m for m in ms if m == 0 or 1 < m < 4]
    check("ключ: №22 ровно две общие точки при m = 0 и 1 < m < 4", two == want, str(two))
    check("ключ: №23 AB = √(12² + 5²) = 13", math.hypot(12, 5) == 13)
    # №25 в координатах: A(0; 0), D(32; 0), B(0; 16), C(2; 16) — CD = 34 и
    # биссектриса угла D проходит через середину AB
    cd = math.hypot(32 - 2, 16)
    ux, uy = -1 - 30 / 34, 16 / 34
    y_at_0 = 0 + uy * (0 - 32) / ux
    check("ключ: №25 трапеция с AB = 16, CD = 34, BC = 2 существует", abs(cd - 34) < 1e-9 and abs(y_at_0 - 8) < 1e-9)
    check("ключ: №25 S = (32 + 2) / 2 · 16 = 272", (32 + 2) / 2 * 16 == 272)


def test_pages_in_sync():
    r = subprocess.run([sys.executable, os.path.join(HERE, 'sync_ege_pages.py'), '--check'],
                       capture_output=True, text=True)
    check("страницы: oge_part2.html и ege_base.html совпадают с ege_prof.html, кроме настроек",
          r.returncode == 0, (r.stdout + r.stderr)[-400:])


# ─── 1–2. нулевой тип в тренажёрах с полем ответа ───
INPUT_PAGES = [
    # slug, id типа, кусок условия, ответ
    ("oge6", "demo2027", "5,2", "16,12"),
    ("oge8", "demo2027", "Найдите значение выражения", "49"),
    ("oge12", "demo2027", "361,25", "5"),
    ("oge14", "demo2027", "каждые 8 минут", "12,5"),
]


def test_input_pages(browser):
    for slug, mid, frag, ans in INPUT_PAGES:
        ctx, page, errors = new_page(browser, f"{BASE}/{slug}.html")
        card = page.query_selector(f'#modesGrid .mode-card[data-id="{mid}"]')
        first = page.eval_on_selector('#modesGrid .mode-card', 'e => e.dataset.id')
        check(f"{slug}: нулевой тип первым в списке, выделен",
              card is not None and first == mid and 'demo' in (card.get_attribute('class') or ''), first)
        check(f"{slug}: подпись «№0. … демоверсии ОГЭ 2027»",
              card is not None and card.inner_text().startswith('№0.') and 'демоверсии ОГЭ 2027' in card.inner_text())
        rnd = page.evaluate("RANDOM_MODES.every(m => !m.demo) && ALL_MODES.some(m => m.demo) && RANDOM_MODES.length === ALL_MODES.length - 1")
        check(f"{slug}: в «Случайно» нулевого типа нет", rnd)
        open_type(page, mid)
        prompt = page.inner_text('#questionPromptText')
        check(f"{slug}: условие из демоверсии", frag in prompt, prompt[:80])
        page.click('#refreshBtn')
        page.wait_for_timeout(300)
        check(f"{slug}: «обновить» даёт то же задание", page.inner_text('#questionPromptText') == prompt)
        page.fill('#answerInput', ans)
        page.click('#checkAnswerBtn')
        page.wait_for_timeout(500)
        st = page.evaluate("({a: taskAnswered, e: totalErrors, s: totalSolved})")
        check(f"{slug}: ответ {ans} засчитан", st["a"] and st["e"] == 0 and st["s"] == 1, str(st))
        check(f"{slug}: разбор показан", page.eval_on_selector('#explainBox', 'e => e.style.display') == 'block')
        check(f"{slug}: без ошибок JS", not errors, str(errors[:1]))
        ctx.close()


# ─── 1–2. нулевой тип в тренажёрах с выбором варианта ───
MCQ_PAGES = [
    ("oge11", "demo2027", "Установите соответствие", 1),
    ("oge13", "demo2027", "Укажите решение системы неравенств", 1),
    ("oge15_18", "demo15", "биссектриса AK", 1),
    ("oge15_18", "demo16", "радиуса 7", 3),
    ("oge15_18", "demo17", "Основания трапеции равны 2 и 9", 2),
    ("oge15_18", "demo18", "клетки 1×1", 1),
]


def test_mcq_pages(browser):
    for slug, mid, frag, ci in MCQ_PAGES:
        ctx, page, errors = new_page(browser, f"{BASE}/{slug}.html")
        rnd = page.evaluate("RANDOM_MODES.every(m => !m.demo) && ALL_MODES.some(m => m.demo)")
        check(f"{slug}/{mid}: в «Случайно» нулевого типа нет", rnd)
        open_type(page, mid)
        prompt = page.inner_text('#questionPromptText')
        check(f"{slug}/{mid}: условие из демоверсии", frag in prompt, prompt[:80])
        got_ci = page.evaluate("curTask.correctIndex")
        check(f"{slug}/{mid}: верный вариант — №{ci + 1}, как в ключе", got_ci == ci, str(got_ci))
        # сначала неверный — считается ошибкой, потом «изменить» и верный
        wrong = 0 if ci != 0 else 1
        page.click(f'#mcqOptions .mcq-btn[data-i="{wrong}"]')
        page.wait_for_timeout(300)
        check(f"{slug}/{mid}: неверный вариант — ошибка", page.evaluate("totalErrors") == 1)
        page.click('#changeAnswerBtn')
        page.wait_for_timeout(200)
        page.click(f'#mcqOptions .mcq-btn[data-i="{ci}"]')
        page.wait_for_timeout(400)
        check(f"{slug}/{mid}: верный вариант засчитан",
              page.evaluate("taskAnswered") and page.query_selector(f'#mcqOptions .mcq-btn[data-i="{ci}"].correct') is not None)
        if slug in ("oge11", "oge13", "oge15_18"):
            svg = page.evaluate("document.querySelectorAll('#questionPanel svg').length")
            check(f"{slug}/{mid}: рисунки на месте", svg >= (3 if slug == "oge11" else 1), str(svg))
        check(f"{slug}/{mid}: без ошибок JS", not errors, str(errors[:1]))
        ctx.close()

    # №15–18: нулевой тип первым в каждой из четырёх групп
    ctx, page, errors = new_page(browser, f"{BASE}/oge15_18.html")
    firsts = page.eval_on_selector_all('#modesGrid .modes', 'gs => gs.map(g => g.querySelector(".mode-card").dataset.id)')
    check("oge15_18: в каждой группе нулевой тип первым", firsts == ["demo15", "demo16", "demo17", "demo18"], str(firsts))
    ctx.close()


def test_oge7(browser):
    ctx, page, errors = new_page(browser, f"{BASE}/oge7.html")
    nums = page.eval_on_selector_all('#modesGrid .mode-card:not(.random) .mnum', 'es => es.map(e => e.textContent)')
    check("oge7: нулевой тип — «00», дальше «01», «02»… как раньше",
          nums[:3] == ['00', '01', '02'] and nums[-1] == '16', str(nums[:3] + nums[-1:]))
    open_type(page, 'demo2027')
    t = page.evaluate("({o: curTask.options, ci: curTask.correctIndex, ticks: document.querySelectorAll('#questionPanel .nl-tick').length})")
    check("oge7: варианты «точка A…D», верный — 4) точка D, на прямой 7, 8, 9",
          t["o"] == ['точка A', 'точка B', 'точка C', 'точка D'] and t["ci"] == 3 and t["ticks"] == 3, str(t))
    page.click('#mcqOptions .mcq-btn[data-i="3"]')
    page.wait_for_timeout(400)
    check("oge7: ответ засчитан", page.evaluate("taskAnswered && totalErrors === 0"))
    # «Обучение»: 8², 9² и 8,5²
    page.click('#refreshBtn')
    page.wait_for_timeout(300)
    page.click('#tabLearn')
    page.wait_for_timeout(500)
    asked = []
    for ans in ['64', '81', '72,25']:
        asked.append(page.inner_text('#qaPrompt'))
        page.fill('#stepInput', ans)
        page.click('#stepGo')
        page.wait_for_timeout(900)
    check("oge7: шаги «Обучения» — 8², 9², 8,5²",
          '8²' in asked[0] and '9²' in asked[1] and '8,5²' in asked[2], str([a[-30:] for a in asked]))
    # «Случайно» не выдаёт задание из демоверсии
    demo_hits = page.evaluate("""() => { curMode = 'random'; let hits = 0;
      for (let i = 0; i < 60; i++) { newTask(); if ((curTask.options || [])[0] === 'точка A') hits++; }
      return hits; }""")
    check("oge7: в «Случайно» демоверсии нет (60 заданий)", demo_hits == 0, str(demo_hits))
    check("oge7: без ошибок JS", not errors, str(errors[:1]))
    ctx.close()


def test_oge10(browser):
    ctx, page, errors = new_page(browser, f"{BASE}/oge10.html")
    first = page.eval_on_selector('#modesGrid .mode-card:not(.random)', 'e => [e.dataset.id, e.innerText, e.className]')
    check("oge10: «Тип 0 · Демоверсия ОГЭ 2027» первым, выделен",
          first[0] == 'type0' and 'Тип 0' in first[1] and 'demo' in first[2], str(first))
    open_type(page, 'type0')
    prompt = page.inner_text('#questionPromptText')
    check("oge10: условие из демоверсии", 'красной или чёрной' in prompt and '200 ручек' in prompt, prompt[:60])
    steps = page.evaluate("(curTask.steps || []).map(s => [s.type, s.num || s.dividend, s.den || s.divisor])")
    check("oge10: «Решить по шагам» — дробь 84/200 и деление 84 : 200",
          steps[:1] == [['fracfill2', 84, 200]] and steps[1][0] == 'div', str(steps))
    page.fill('#finalInput', '0,42')
    page.click('#finalGo')
    page.wait_for_timeout(500)
    check("oge10: ответ 0,42 засчитан", page.evaluate("taskAnswered"))
    hits = page.evaluate("""() => { curMode = 'random'; let hits = 0;
      for (let i = 0; i < 80; i++) { newTask(); if (/красной или чёрной/.test(curTask.prompt)) hits++; }
      return hits; }""")
    check("oge10: в «Случайно» демоверсии нет (80 заданий)", hits == 0, str(hits))
    check("oge10: без ошибок JS", not errors, str(errors[:1]))
    ctx.close()


# ─── 3. №9: линейное уравнение из демоверсии по шагам ───
def test_oge9(browser):
    ctx, page, errors = new_page(browser, f"{BASE}/oge9.html")
    first = page.eval_on_selector('#pickerArea .mode-card', 'e => [e.dataset.id, e.innerText]')
    check("oge9: нулевой тип первым на экране выбора", first[0] == 'demo2027' and '№0.' in first[1], str(first))
    open_type(page, 'demo2027', wait=800)
    eq = page.inner_text('#live')
    check("oge9: уравнение 3(x + 8) − 2(x − 8) = 8", eq.strip() == '3(x + 8) − 2(x − 8) = 8', eq)
    active = page.inner_text('.lvl.active')
    check("oge9: открыт уровень «0. Демоверсия 2027»", active.strip().startswith('0. Демоверсия 2027'), active)
    page.click('#goBtn')
    page.wait_for_timeout(700)
    prompts = []
    for ans in ['3x', '24', '-2x', '16']:
        prompts.append(page.inner_text('#prompt'))
        page.fill('#brAns', ans)
        page.click('#goBtn')
        page.wait_for_timeout(1000)
    check("oge9: фонтанчики — сначала первая скобка, потом вторая",
          'в первой скобке' in prompts[0] and 'во второй скобке' in prompts[2] and '−2 · x' in prompts[2],
          str([p[:40] for p in prompts]))
    live = page.evaluate("[...document.querySelectorAll('#liveEq .term')].map(e => [e.dataset.side, e.textContent])")
    check("oge9: после скобок слева 3x + 24 − 2x + 16, справа 8",
          [t for s, t in live if s == 'L'] == ['3x', '+ 24', '− 2x', '+ 16'] and [t for s, t in live if s == 'R'] == ['8'], str(live))
    for txt in ['+ 24', '+ 16']:
        page.evaluate("""(t) => { const el = [...document.querySelectorAll('#liveEq .term')].find(e => e.dataset.side === 'L' && e.textContent === t); el.click(); }""", txt)
        page.wait_for_timeout(900)
    page.click('#goBtn')
    page.wait_for_timeout(900)
    page.fill('#inK', 'x')
    page.fill('#inM', '-32')
    page.click('#goBtn')
    page.wait_for_timeout(700)
    frozen = page.inner_text('#frozen')
    check("oge9: решено, x = −32, деление на 1 пропущено",
          'x=−32' in frozen.replace(' ', '').replace('\n', '') and 'обе части равны 8' in frozen and ':' not in frozen.split('Проверка')[0][-40:],
          frozen[-120:])
    check("oge9: звёзды за решение", page.inner_text('#stStars') == '★★★')
    check("oge9: обычные уровни на месте, «Экзамен» демоверсию не берёт",
          page.evaluate("[...document.querySelectorAll('.lvl')].map(b => b.textContent.trim().slice(0, 2)).join('|')").startswith('0.|1.|2.|3.|4.|5.'))
    check("oge9: без ошибок JS", not errors, str(errors[:1]))
    ctx.close()


def test_oge19(browser):
    ctx, page, errors = new_page(browser, f"{BASE}/oge19.html")
    cards = page.eval_on_selector_all('#modesGrid .mode-card', 'es => es.map(e => [e.dataset.id, e.innerText])')
    check("oge19: экран выбора — нулевой тип и прежний", [c[0] for c in cards] == ['demo2027', 'geom'], str(cards))
    check("oge19: задания до выбора типа не видно", page.eval_on_selector('#taskArea', 'e => e.style.display') == 'none')
    st = page.evaluate("window.__trainerState.get()")
    check("oge19: экран выбора в общем снимке", st.get("picker") is True and st.get("curMode") is None, str(st)[:80])
    open_type(page, 'demo2027')
    t = page.evaluate("curTask")
    check("oge19: три утверждения демоверсии, верное первое",
          [s["isTrue"] for s in t["statements"]] == [True, False, False] and 'Диагонали ромба равны' in t["statements"][1]["text"], str(t)[:100])
    check("oge19: вопрос из демоверсии", 'истинным высказыванием' in page.inner_text('#questionPromptText'))
    page.click('#stmtList .stmt[data-i="0"]')
    page.click('#checkBtn')
    page.wait_for_timeout(400)
    check("oge19: ответ 1 засчитан", page.evaluate("taskAnswered && totalErrors === 0"))
    check("oge19: разбор «Верное утверждение: 1»", 'Верное утверждение: 1' in page.inner_text('#explainBox'))
    st = page.evaluate("window.__trainerState.get()")
    check("oge19: тип в общем снимке", st.get("picker") is False and st.get("curMode") == 'demo2027')
    page.click('#backBtn')
    page.wait_for_timeout(200)
    open_type(page, 'geom')
    n = page.evaluate("curTask.statements.length")
    check("oge19: прежний тип — 5 случайных утверждений", n == 5, str(n))
    check("oge19: без ошибок JS", not errors, str(errors[:1]))
    ctx.close()

    # ученик: снимок учителя открывает у него тот же тип с тем же заданием
    ctx, page, errors = new_page(browser, f"{BASE}/oge19.html")
    page.evaluate("""() => window.__trainerState.apply({ picker: false, curMode: 'demo2027', curSubMode: 'exam',
      curTask: genDemoTask(), picked: [2], taskAnswered: false, hadWrongPick: false, wrongShown: false })""")
    page.wait_for_timeout(300)
    got = page.evaluate("({m: curMode, title: els.taskTitle.textContent, vis: els.taskArea.style.display, picked: [...pickedSet]})")
    check("oge19: снимок учителя открывает у ученика нулевой тип",
          got["m"] == 'demo2027' and 'демоверсии' in got["title"] and got["vis"] == 'block' and got["picked"] == [2], str(got))
    page.evaluate("() => window.__trainerState.apply({ picker: true, curMode: 'demo2027', curSubMode: 'exam' })")
    page.wait_for_timeout(200)
    check("oge19: учитель вернулся к списку — ученик тоже",
          page.eval_on_selector('#pickerArea', 'e => e.style.display') == 'block')
    check("oge19: ученик без ошибок JS", not errors, str(errors[:1]))
    ctx.close()


# ─── 4. №1–5: шина из демоверсии ───
TIRE_ANS = ["195", "107,25", "549,8", "2,75", "1,4"]


def test_tires(browser):
    ctx, page, errors = new_page(browser, f"{BASE}/oge1_5.html")
    tires = page.eval_on_selector_all('#modesGrid .modes', 'gs => [...gs[0].querySelectorAll(".mode-card")].map(e => [e.dataset.id, e.innerText])')
    check("oge1_5: в «Шинах» две темы — Шина 0 (демоверсия) и прежняя Шина 1",
          [t[0] for t in tires] == ['tire_demo2027', 'tire_set1'] and 'Демоверсия ОГЭ 2027' in tires[0][1]
          and tires[1][1].startswith('Шина 1'), str(tires))
    check("oge1_5: в «Случайно» заданий демоверсии нет",
          page.evaluate("RANDOM_MODES.every(m => !m.demo) && ALL_MODES.filter(m => m.demo).length === 5"))
    open_type(page, 'tire_demo2027', wait=700)
    page.click('#theoryToggleBtn')
    page.wait_for_timeout(200)
    theory = page.inner_text('#theoryContent')
    check("oge1_5: теория из демоверсии — завод ставит 175/70 R12",
          '175/70 R12' in theory and '126,75' in theory and page.evaluate("document.querySelectorAll('#theoryContent img').length") == 2,
          theory[-120:])
    check("oge1_5: у Шины 0 нет кнопки «Новая шина»",
          page.eval_on_selector('#newTireBtn', 'e => e.style.display') == 'none')
    prompts = []
    for i, ans in enumerate(TIRE_ANS):
        label = page.inner_text('#tasksetNavLabel')
        prompts.append(page.inner_text('#questionPromptText'))
        page.fill('#answerInput', ans)
        page.click('#checkAnswerBtn')
        page.wait_for_timeout(400)
        ok = page.evaluate("taskAnswered") and page.evaluate("totalErrors") == 0
        check(f"oge1_5: {label} — ответ {ans} засчитан", ok and label == f'Задание {i + 1} из 5', label)
        if i < 4:
            page.click('#nextTaskBtn')
            page.wait_for_timeout(500)
    check("oge1_5: условия заданий демоверсии",
          '13 дюймам' in prompts[0] and 'Ширина шины (мм)' in prompts[0] and '165/65 R14' in prompts[1] and 'выходящего с завода' in prompts[2]
          and '185/60 R13' in prompts[3] and '175/65 R13' in prompts[4], str([p[:30] for p in prompts]))
    page.click('#prevTaskBtn')
    page.wait_for_timeout(300)
    check("oge1_5: задание не меняется при возврате", page.inner_text('#questionPromptText') == prompts[3])
    check("oge1_5: без ошибок JS", not errors, str(errors[:1]))
    ctx.close()

    # Шина 1 работает как раньше: своя заводская шина и кнопка «Новая шина»
    ctx, page, errors = new_page(browser, f"{BASE}/oge1_5.html")
    open_type(page, 'tire_set1', wait=700)
    check("oge1_5: Шина 1 — прежняя: есть «Новая шина», теория со случайной шиной",
          page.eval_on_selector('#newTireBtn', 'e => e.style.display') != 'none'
          and page.evaluate("!!curFactoryTire && curTasksetRef.id === 'tire_set1'"))
    check("oge1_5: Шина 1 без ошибок JS", not errors, str(errors[:1]))
    ctx.close()

    # ученик получает по сессии только id задания — теория Шины 0 восстанавливается
    ctx, page, errors = new_page(browser, f"{BASE}/oge1_5.html")
    page.evaluate("""() => window.__trainerState.apply({ picker: false, curMode: 'tire0_t3', curSubMode: 'exam',
      curTask: gen_tire_demo3(), taskAnswered: false, hadWrongPick: false })""")
    page.wait_for_timeout(400)
    got = page.evaluate("""({ theory: els.theoryBlock.style.display, label: els.tasksetNavLabel.textContent,
      has: els.theoryContent.innerHTML.indexOf('175/70 R12') >= 0 })""")
    check("oge1_5: у ученика теория Шины 0 и «Задание 3 из 5»",
          got["theory"] == 'block' and got["label"] == 'Задание 3 из 5' and got["has"], str(got))
    check("oge1_5: ученик без ошибок JS", not errors, str(errors[:1]))
    ctx.close()


# ─── 6. №20–25 ───
PART2 = {
    20: ("x \\le", ["(-∞;-3); (0;3)", "(-∞;-3]∪(0;3]"]),
    21: ("224-километровый", ["16", "14"]),
    22: ("прямая", ["m>1", "1<m<4; m=0"]),
    23: ("Биссектрисы углов", ["12", "13"]),
    25: ("Биссектриса угла", ["280", "272"]),
}


def test_catalog(browser):
    ctx, page, errors = new_page(browser, f"{BASE}/index.html")
    page.click('.nav-tab[data-id="exams"]')
    page.click('.nav-subtab[data-id="oge"]')
    page.wait_for_timeout(200)
    titles = page.eval_on_selector_all('#topics .section-title', 'els => els.map(e => e.textContent)')
    check("каталог: ОГЭ разбит на две части",
          titles == ['Часть 1 — краткий ответ', 'Часть 2 — развёрнутый ответ'], str(titles))
    items = page.eval_on_selector_all('#topics a.topic-item', 'els => els.map(e => [e.getAttribute("href"), e.innerText])')
    part2 = [i for i in items if i[0].startswith('oge_part2.html')]
    check("каталог: 12 тренажёров первой части на месте", len(items) - len(part2) == 12, str(len(items)))
    check("каталог: №20–25 ведут в oge_part2.html?n=…",
          [p[0] for p in part2] == [f'oge_part2.html?n={n}' for n in range(20, 26)], str(part2[:2]))
    check("каталог: нумерация карточек продолжается (13–18)",
          part2[0][1].startswith('13') and part2[-1][1].startswith('18') and '№20.' in part2[0][1], str(part2[:1]))
    names = page.evaluate("[20,21,22,23,24,25].map(n => TRAINERS['oge' + n].name.split('. ')[1])")
    check("каталог: без ошибок JS", not errors, str(errors[:1]))
    ctx.close()

    ctx, page, errors = new_page(browser, f"{BASE}/oge_part2.html?n=20")
    bank = page.evaluate("NUMS.map(n => BANK[n].title)")
    check("каталог: названия номеров совпадают с банком", names == bank, str(list(zip(names, bank))[:2]))
    check("банк: номера 20–25, вторая часть по 2 балла",
          page.evaluate("NUMS.join() === '20,21,22,23,24,25' && NUMS.every(n => BANK[n].part === 2 && BANK[n].points === 2)"))
    ok = page.evaluate("""() => NUMS.every(n => BANK[n].protos.length === 1 && BANK[n].protos[0].src === 'Демоверсия ОГЭ 2027'
      && BANK[n].protos[0].title === '№0. Задание из демоверсии ОГЭ 2027' && BANK[n].protos[0].criteria.length === 3)""")
    check("банк: в каждом номере одно задание из демоверсии, критерии ФИПИ", ok)
    ref = page.evaluate("""() => { const bad = [];
      NUMS.forEach(n => { S.n = n; const p = BANK[n].protos[0];
        (p.fields || []).forEach(f => { if (checkField(f, f.value, { yn: {} }) !== true) bad.push(n + ':' + f.id); }); });
      return bad; }""")
    check("банк: эталонные ответы проходят свою же проверку", ref == [], str(ref))
    figs = page.evaluate("['s22','s23','s24','s25'].filter(k => !FIGS[k])")
    check("банк: рисунки решений 22–25 на месте", figs == [], str(figs))
    check("страница: без ошибок JS", not errors, str(errors[:1]))
    ctx.close()


def test_part2(browser):
    for n, (frag, (wrong, right)) in PART2.items():
        ctx, page, errors = new_page(browser, f"{BASE}/oge_part2.html?n={n}")
        pt = page.eval_on_selector('#pickerTitle', 'e => e.textContent')   # на экране — заглавными (CSS)
        card = page.inner_text('#protoList .mode-card .mtitle')
        check(f"№{n}: список — «№0. Задание из демоверсии ОГЭ 2027»",
              card == '№0. Задание из демоверсии ОГЭ 2027' and 'демоверсия ОГЭ 2027' in pt, pt + ' / ' + card)
        page.click('#protoList .mode-card')
        page.wait_for_timeout(400)
        check(f"№{n}: заголовок «ОГЭ · №{n}», в шапке название прототипа",
              page.inner_text('#pageTitle') == f'ОГЭ · №{n}' and page.inner_text('#taskTitle') == card,
              page.inner_text('#pageTitle') + ' / ' + page.inner_text('#taskTitle'))
        text = page.evaluate("curProto.text")
        check(f"№{n}: условие из демоверсии", frag in text, text[:60])
        page.fill('#answerArea input.answer-input', wrong)
        page.click('#answerArea .check-btn')
        page.wait_for_timeout(300)
        check(f"№{n}: неверный ответ {wrong!r} — ошибка", page.evaluate("totalErrors === 1 && !S.answered"))
        page.fill('#answerArea input.answer-input', right)
        page.click('#answerArea .check-btn')
        page.wait_for_timeout(400)
        check(f"№{n}: ответ {right!r} засчитан", page.evaluate("S.answered && S.correct && totalSolved === 1"))
        shown = page.evaluate("[...document.querySelectorAll('#solSteps .sol-step')].every(e => e.style.display === 'flex')")
        check(f"№{n}: после ответа — решение ФИПИ и критерии",
              shown and page.eval_on_selector('#critBox', 'e => e.style.display') == 'block'
              and page.eval_on_selector('#solAnswer', 'e => e.style.display') == 'block')
        if n in (22, 23, 25):
            check(f"№{n}: рисунок в решении", page.evaluate("document.querySelectorAll('#solSteps .ege-fig svg').length") == 1)
        check(f"№{n}: без ошибок JS", not errors, str(errors[:1]))
        ctx.close()

    # №24 — доказательство: проверять нечего, счёт не меняется
    ctx, page, errors = new_page(browser, f"{BASE}/oge_part2.html?n=24")
    page.click('#protoList .mode-card')
    page.wait_for_timeout(400)
    check("№24: полей ответа нет, кнопка «Сверить с доказательством»",
          page.evaluate("document.querySelectorAll('#answerArea input').length") == 0
          and page.inner_text('#answerArea .check-btn') == 'Сверить с доказательством')
    check("№24: пояснение про самопроверку", 'доказательство' in page.inner_text('#manualNote'))
    check("№24: до нажатия доказательство скрыто", page.eval_on_selector('#mainPanel', 'e => e.style.display') == 'none')
    page.click('#answerArea .check-btn')
    page.wait_for_timeout(400)
    st = page.evaluate("({a: S.answered, s: totalSolved, e: totalErrors, h: curProg.history.length})")
    check("№24: доказательство и критерии открыты, счёт не изменился",
          st == {"a": True, "s": 0, "e": 0, "h": 0}
          and page.evaluate("[...document.querySelectorAll('#solSteps .sol-step')].every(e => e.style.display === 'flex')")
          and page.eval_on_selector('#critBox', 'e => e.style.display') == 'block', str(st))
    check("№24: пустой строки «Ответ.» нет", page.eval_on_selector('#solAnswer', 'e => e.style.display') == 'none')
    check("№24: рисунок в доказательстве", page.evaluate("document.querySelectorAll('#solSteps .ege-fig svg').length") == 1)
    # «+» — карточка с тем же доказательством, у неё та же кнопка
    page.click('#addRailToggle')
    page.click('.add-qty-btn[data-n="1"]')
    page.wait_for_timeout(500)
    btn = page.inner_text('.added-task-card .check-btn')
    page.click('.added-task-card .check-btn')
    page.wait_for_timeout(400)
    check("№24: карточка «+» — та же самопроверка, счёт не меняется",
          btn == 'Сверить с доказательством' and page.evaluate("S.cards[0].answered && totalSolved === 0 && totalErrors === 0"))
    check("№24: без ошибок JS", not errors, str(errors[:1]))
    ctx.close()

    # ЕГЭ не задело: у прототипов без названия — «Прототип N», «ФИПИ» заглавными
    ctx, page, errors = new_page(browser, f"{BASE}/ege_prof.html?n=7")
    t = page.eval_on_selector('#pickerTitle', 'e => e.textContent')
    c = page.inner_text('#protoList .mode-card .mtitle')
    check("ЕГЭ: прототипы по-прежнему «Прототип 1», в подписи «демоверсия ФИПИ 2027»",
          c == 'Прототип 1' and 'демоверсия ФИПИ 2027' in t, t + ' / ' + c)
    ctx.close()


SEED_JS = """([boards, payloads]) => new Promise((resolve, reject) => {
    const req = indexedDB.open('ogeBoardsDB', 1);
    req.onupgradeneeded = () => req.result.createObjectStore('state');
    req.onsuccess = () => {
      const tx = req.result.transaction('state', 'readwrite');
      const st = tx.objectStore('state');
      st.put({ __v: 2, folders: [], boards, deleted: [], sortMode: 'my' }, 'db');
      Object.keys(payloads).forEach(id => st.put(payloads[id], 'boarddata:' + id));
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => reject(tx.error);
    };
    req.onerror = () => reject(req.error);
})"""

BOOT_JS = """() => {
  const gate = document.getElementById('authGate');
  if (gate) gate.style.display = 'none';
  window.boardsAppBoot();
}"""


def test_boards(browser):
    ctx, page, errors = new_page(browser, f"{BASE}/boards.html", wait=1800)
    got = page.evaluate("""() => ({
      capture: [20,21,22,23,24,25].every(n => !!TRAINER_CAPTURE['oge' + n]),
      oge: TRAINERS_PANEL_GROUPS[0].title,
      items: TRAINERS_PANEL_GROUPS[0].items.map(i => i.id + '|' + i.href),
      name: TRAINER_NAMES['oge24'] || ''
    })""")
    check("доски: снимок задания настроен для №20–25", got["capture"])
    check("доски: в разделе «ОГЭ» после №19 — №20–25",
          got["oge"] == 'ОГЭ' and got["items"][-7].startswith('oge19|')
          and got["items"][-6:] == [f'oge{n}|oge_part2.html?n={n}' for n in range(20, 26)], str(got["items"][-7:]))
    check("доски: подпись для подборки", got["name"] == '№24. Геометрическая задача на доказательство', got["name"])
    ctx.close()

    # сам снимок №22 на доску
    ctx = browser.new_context()
    page = ctx.new_page()
    errors = []
    page.on("pageerror", lambda e: errors.append(str(e)))
    page.route("https://**/*", lambda route: route.abort())
    page.goto(f"{BASE}/boards.html")
    board = {"id": "bO", "name": "ОГЭ", "folderId": None, "createdAt": 1000, "updatedAt": 1000,
             "lastOpenedAt": None, "rev": 1, "cellSize": 24, "sheetCols": 76, "sheetRows": 54,
             "pageOrder": "h", "recentColors": [], "colorUsage": {}, "view": {"x": 0, "y": 0, "zoom": 1}}
    page.evaluate(SEED_JS, [[board], {"bO": {"objects": [], "imageLib": []}}])
    page.reload()
    page.evaluate(BOOT_JS)
    page.wait_for_function("() => window.getDB && window.getDB().boards.length >= 1")
    page.evaluate("() => window.openBoard('bO')")
    page.wait_for_function("() => window.getCurrentBoard() && window.getCurrentBoard().id === 'bO'")
    page.evaluate("() => document.getElementById('bdTrainersToggle').click()")
    page.wait_for_timeout(400)
    page.evaluate('() => document.querySelector(\'.bd-trainers-item[data-id="oge22"]\').click()')
    page.wait_for_timeout(3000)
    page.frame_locator('#bdTrainersIframe').locator('.mode-card').first.click()
    page.wait_for_timeout(1500)
    page.evaluate("() => document.getElementById('bdTrainersAddBtn').click()")
    try:
        page.wait_for_function("() => (window.getCurrentBoard().objects || []).length > 0", timeout=25000)
        ok = True
    except Exception:
        ok = False
    obj = page.evaluate("""() => {
      const o = (window.getCurrentBoard().objects || [])[0];
      return o ? { type: o.type, w: o.w || 0, h: o.h || 0 } : null;
    }""")
    check("доски: задание №22 легло на доску картинкой", ok and obj and obj["type"] == "image" and obj["w"] > 40, str(obj))
    check("доски: снимок без ошибок JS", not errors, str(errors[:1]))
    ctx.close()


def test_phone(browser):
    """Телефон: рисунки нулевых типов не вылезают за экран."""
    for slug, mid in [("oge11", "demo2027"), ("oge13", "demo2027"), ("oge15_18", "demo15"), ("oge15_18", "demo18")]:
        ctx, page, errors = new_page(browser, f"{BASE}/{slug}.html", width=375)
        open_type(page, mid)
        # с №63 шапка задания на телефоне переносится — меряем всю страницу
        over = page.evaluate("document.documentElement.scrollWidth - window.innerWidth")
        check(f"телефон: {slug}/{mid} — без прокрутки вбок", over <= 0, str(over))
        ctx.close()
    ctx, page, errors = new_page(browser, f"{BASE}/oge_part2.html?n=22", width=375)
    page.click('#protoList .mode-card')
    page.click('#tabPractice')
    page.click('#showSolutionBtn')
    page.wait_for_timeout(400)
    over = page.evaluate("document.documentElement.scrollWidth > window.innerWidth + 1")
    check("телефон: №22 с решением без горизонтальной прокрутки", not over)
    ctx.close()


def run():
    test_key_arithmetic()
    test_pages_in_sync()
    with local_server(), sync_playwright() as p:
        browser = p.chromium.launch()
        test_input_pages(browser)
        test_mcq_pages(browser)
        test_oge7(browser)
        test_oge10(browser)
        test_oge9(browser)
        test_oge19(browser)
        test_tires(browser)
        test_catalog(browser)
        test_part2(browser)
        test_boards(browser)
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
