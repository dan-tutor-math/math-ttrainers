"""
Промпт №14 (новый список): экранная клавиатура во всех тренажёрах — одна,
лучшая раскладка (keypad.js):

    7 8 9 / 4 5 6 / 1 2 3 / , 0 − / [свои клавиши] / ⌫ Стереть / Ввод ↵

Проверяет:
  1. Во всех тренажёрах с полями ввода (29 страниц, в ОГЭ №9 — оба движка,
     в ЕГЭ — первая и вторая часть) клавиатура на экране, раскладка ровно
     такая, «Стереть» и «Ввод» — во всю ширину, свои клавиши на месте.
  2. Кнопки живые: «7» попадает в поле (с событием input — по нему поле
     уходит собеседнику в сессии), «Стереть» его убирает. Ловит то, что было
     в ОГЭ №9: кнопки движков ни к чему не были привязаны.
  3. «Ответ сразу» в пошаговых тренажёрах: клавиатура видна до «Начать»,
     пишет в поле ответа, «Ввод» проверяет; после верного ответа, когда полей
     больше нет, клавиатура прячется; после «Начать» пишет в поле шага.
  4. Свои клавиши: «/» и пробел в дробях, «;» и «нет» в квадратных, запятая
     в НОД по-прежнему ставит «, ».
  5. Ввод как с настоящей клавиатуры: в место курсора, «Стереть» — символ
     перед курсором, maxlength соблюдается.
  6. ОГЭ №11, №13, №15–18, №19 — ответ выбирают кнопками, полей ввода нет ни
     в одном типе: клавиатура там не нужна (тест следит, чтобы так и было).
  7. Телефон 375 px: клавиатура целиком на экране, прокрутки вбок нет.

Запуск: python3 test_prompt14_keypad_everywhere.py (сервер поднимается сам).
"""
import contextlib
import http.client
import os
import subprocess
import sys
import time

from playwright.sync_api import sync_playwright

PORT = 8994
BASE = f"http://127.0.0.1:{PORT}"
HERE = os.path.dirname(os.path.abspath(__file__))

STD = ['7', '8', '9', '4', '5', '6', '1', '2', '3', ',', '0', '-']
FR = ['/', ' ']
X = ['x']
QX = ['x', ';', 'none']
PART2 = ['π', '√', '∞', '≤', '≥', '∪', '(', ')', ';']

# страница → (как открыть задание, свои клавиши, чем вставляется минус)
PAGES = {
    "addition": ("intro", [], '-'), "subtraction": ("intro", [], '-'),
    "multiplication": ("intro", [], '-'), "division": ("intro", [], '-'),
    "addition_embed": ("intro", [], '-'), "subtraction_embed": ("intro", [], '-'),
    "multiplication_embed": ("intro", [], '-'), "division_embed": ("intro", [], '-'),
    "fraction_multiply": ("intro", FR, '-'), "fraction_divide": ("intro", FR, '-'),
    "linear": ("intro", X, '-'), "quadratic": ("intro", QX, '-'),
    "gcd": ("intro", [], '-'), "lcm": ("intro", [], '-'),
    "oge1_5": ("cards", [], '-'), "oge6": ("cards", [], '-'), "oge7": ("cards", [], '-'),
    "oge8": ("cards", [], '-'), "oge10": ("cards", [], '-'), "oge12": ("cards", [], '-'),
    "oge14": ("cards", [], '-'), "powers": ("cards", [], '-'),
    "oge9#lin": ("oge9:linear", X, '-'), "oge9#quad": ("oge9:quadratic", QX, '-'),
    "ege_prof.html?n=7": ("cards", [], '-'), "ege_prof.html?n=15": ("cards", PART2, '-'),
    "ege_base.html?n=7": ("cards", [], '-'), "oge_part2.html?n=20": ("cards", PART2, '-'),
    "percent": ("tile", FR, '-'), "logarithms": ("tiles", ['/'], '−'),
    "trig_equations": ("tile:egeArg", ['/'], '−'),
}
CHOICE_ONLY = ["oge11", "oge13", "oge15_18", "oge19"]

CARDS = "#modesGrid .mode-card:not(.soon), #protoList .mode-card, #pickerArea .modes .mode-card"
VISIBLE_KP = "() => [...document.querySelectorAll('.keypad-float')].find(f => getComputedStyle(f).display !== 'none') || null"

FAILS = []


def new_ctx(browser, **kw):
    # Всё наружу обрывается: открытая «как есть» страница из песочницы идёт в
    # настоящую базу и заводит там сессию (раздел 8 HANDOFF). Клавиатуре
    # сеть не нужна
    ctx = browser.new_context(**kw)
    ctx.route("https://**/*", lambda route: route.abort())
    return ctx


def check(name, ok, info=""):
    print(("[OK] " if ok else "[FAIL] ") + name + ("" if ok else f" — {info}"))
    if not ok:
        FAILS.append(name)


@contextlib.contextmanager
def local_server():
    proc = subprocess.Popen([sys.executable, "-m", "http.server", str(PORT)], cwd=HERE,
                            stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
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


def url_of(key):
    slug = key.split('#')[0]
    return f"{BASE}/{slug}" if '.html' in slug else f"{BASE}/{slug}.html"


def kp_visible(page):
    return page.evaluate(f"() => !!({VISIBLE_KP})()")


def open_task(page, key, how):
    page.goto(url_of(key))
    page.wait_for_timeout(700)
    if how == "intro":
        return
    if how.startswith("oge9:"):
        page.evaluate("(id) => openModeById(id)", how.split(':')[1])
        page.wait_for_timeout(700)
        return
    if how.startswith("tile"):
        # в тригонометрии простейшие уравнения — с выбором серии корней, поле
        # ввода (а с ним клавиатура) начинается с №14 ЕГЭ
        sel = ".tile[data-pid='" + how.split(':')[1] + "']" if ':' in how else ".tile:not(.mix)"
        page.click(sel)
        page.wait_for_timeout(300)
        if not kp_visible(page) and page.query_selector("#pkStart"):
            page.click("#pkStart")
            page.wait_for_timeout(700)
        # в логарифмах часть заданий — с выбором варианта: берём следующее,
        # пока не попадётся задание с полем ответа
        for _ in range(15):
            if kp_visible(page) or not page.evaluate("typeof newTask === 'function'"):
                break
            page.evaluate("newTask()")
            page.wait_for_timeout(250)
        return
    # ОГЭ и ЕГЭ: первый тип, где ответ вписывают (в ОГЭ №7 и №10 бывают типы
    # с выбором варианта — там клавиатура не нужна, и это правильно)
    n = len(page.query_selector_all(CARDS))
    for k in range(n):
        if k:
            page.goto(url_of(key))
            page.wait_for_timeout(600)
        cards = page.query_selector_all(CARDS)
        if len(cards) <= k:
            break
        cards[k].evaluate("e => e.click()")
        page.wait_for_timeout(600)
        if kp_visible(page):
            return
        # ОГЭ №7: поле ввода — в шагах «Обучения», в «Экзамене» только варианты
        if page.query_selector("#tabLearn") and page.is_visible("#tabLearn"):
            page.click("#tabLearn")
            page.wait_for_timeout(600)
            if kp_visible(page):
                return


LAYOUT_JS = """() => {
  const f = (%s)();
  if (!f) return null;
  const btns = [...f.querySelectorAll('.keypad button')];
  const grid = f.querySelector('.keypad').getBoundingClientRect();
  const r = b => b.getBoundingClientRect();
  const back = btns.find(b => b.dataset.key === 'back'), enter = btns.find(b => b.dataset.key === 'enter');
  const minus = btns[11];
  const fr = r(f);
  return {
    keys: btns.map(b => b.dataset.key),
    backText: back ? back.textContent : '', backFull: back ? r(back).width >= grid.width - 2 : false,
    enterFull: enter ? r(enter).width >= grid.width - 2 : false,
    backBelowDigits: back ? r(back).top > r(btns[9]).bottom : false,
    minusLabel: minus ? minus.textContent : '',
    onScreen: fr.left >= 0 && fr.right <= innerWidth && fr.top >= 0 && fr.bottom <= innerHeight,
  };
}""" % VISIBLE_KP


def press(page, key):
    page.evaluate(f"""(k) => {{ const f = ({VISIBLE_KP})();
        f.querySelector('.keypad button[data-key="' + CSS.escape(k) + '"]').click(); }}""", key)
    page.wait_for_timeout(60)


ARM_JS = """() => { window.__kpInputs = 0;
  if (!window.__kpArmed) { window.__kpArmed = 1; document.addEventListener('input', () => { window.__kpInputs++; }, true); } }"""
# поле, в которое ушёл ввод: то, где курсор, а если фокус где-то потерялся —
# то, чьё значение изменилось с последнего снимка
SNAP_JS = """() => { window.__kpSnap = new Map([...document.querySelectorAll('input')].map(i => [i, i.value])); }"""
FOCUSED_JS = """() => { let a = document.activeElement;
  if (!a || a.tagName !== 'INPUT') a = [...document.querySelectorAll('input')].find(i => (window.__kpSnap || new Map()).get(i) !== i.value) || null;
  if (!a && window.__kpTarget && window.__kpTarget.isConnected) a = window.__kpTarget;
  if (a) window.__kpTarget = a;
  return a ? { v: a.value, cls: a.className, id: a.id, inputs: window.__kpInputs } : null; }"""


# ─── 1, 2. раскладка и живые кнопки везде ───
def test_all(browser):
    for key, (how, extras, minus) in PAGES.items():
        ctx = new_ctx(browser, viewport={"width": 1400, "height": 900})
        page = ctx.new_page()
        errors = []
        page.on("pageerror", lambda e: errors.append(str(e)))
        open_task(page, key, how)
        lay = page.evaluate(LAYOUT_JS)
        check(f"{key}: клавиатура на экране", lay is not None)
        if lay is None:
            ctx.close()
            continue
        want = STD[:11] + [minus] + extras + ['back', 'enter']
        check(f"{key}: раскладка 789/456/123/,0−/свои/Стереть/Ввод", lay["keys"] == want, f"{lay['keys']} ≠ {want}")
        check(f"{key}: «⌫ Стереть» отдельной кнопкой во всю ширину под цифрами",
              lay["backFull"] and lay["backBelowDigits"] and "Стереть" in lay["backText"], str(lay))
        check(f"{key}: «Ввод» во всю ширину", lay["enterFull"], str(lay))
        check(f"{key}: на кнопке минуса «−»", lay["minusLabel"] == '−', lay["minusLabel"])
        # живые кнопки
        page.evaluate(ARM_JS)
        page.evaluate(SNAP_JS)
        press(page, '7')
        a = page.evaluate(FOCUSED_JS)
        check(f"{key}: «7» попала в поле, событие input есть", bool(a) and '7' in a["v"] and a["inputs"] > 0, str(a))
        if a:
            before = a["v"]
            press(page, 'back')
            b = page.evaluate(FOCUSED_JS)
            check(f"{key}: «Стереть» убирает последний символ", bool(b) and b["v"] == before[:-1], f"{before!r} → {b}")
            # перед запятой цифра: в НОД и НОК запятая разделяет делители и в
            # пустое поле не ставится
            press(page, '7')
            press(page, ',')
            press(page, minus)
            c = page.evaluate(FOCUSED_JS)
            check(f"{key}: запятая и минус набираются", bool(c) and ',' in c["v"] and minus in c["v"], str(c))
        check(f"{key}: без ошибок JS", not errors, "; ".join(errors[:2]))
        ctx.close()


# ─── 3, 4. «ответ сразу» и свои клавиши ───
def test_quick_answer(browser):
    ctx = new_ctx(browser, viewport={"width": 1400, "height": 900})
    page = ctx.new_page()
    page.goto(f"{BASE}/addition.html")
    page.wait_for_timeout(700)
    check("Сложение: до «Начать» клавиатура видна (есть поле «ответ сразу»)", kp_visible(page))
    ans = page.evaluate("String(P.topVal + P.bottomVal)")
    for ch in ans:
        press(page, ch)
    v = page.evaluate("document.querySelector('.qa-panel .qa-input').value")
    check("Сложение: цифры ушли в поле «ответ сразу»", v == ans, f"{v!r} ≠ {ans!r}")
    press(page, 'enter')
    page.wait_for_timeout(300)
    check("Сложение: «Ввод» проверяет ответ сразу — засчитан", page.evaluate("S.quick && S.quick.res") == 'ok',
          str(page.evaluate("S.quick")))
    page.wait_for_timeout(500)
    check("Сложение: ответ засчитан, полей нет — клавиатура спряталась", not kp_visible(page))

    # после «Начать» клавиатура пишет в поле шага, даже если курсор был в «ответ сразу».
    # Новый контекст: решённый пример страница помнит и после перезагрузки
    ctx.close()
    ctx = new_ctx(browser, viewport={"width": 1400, "height": 900})
    page = ctx.new_page()
    page.goto(f"{BASE}/addition.html")
    page.wait_for_timeout(700)
    page.click('.qa-panel .qa-input')
    page.click('#goBtn')
    page.wait_for_timeout(400)
    press(page, '3')
    st = page.evaluate("""() => ({ qa: document.querySelector('.qa-panel .qa-input').value,
        step: [...document.querySelectorAll('.panel input')].filter(i => !i.classList.contains('qa-input') && i.offsetParent).map(i => i.value) })""")
    check("Сложение: после «Начать» «3» — в поле шага, а не в «ответ сразу»", st["qa"] == '' and '3' in st["step"], str(st))

    # дроби: «/» и пробел
    page.goto(f"{BASE}/fraction_multiply.html")
    page.wait_for_timeout(700)
    for ch in ['1', ' ', '3', '/', '4']:
        press(page, ch)
    v = page.evaluate("document.querySelector('.qa-panel .qa-input').value")
    check("Умножение дробей: «1 3/4» набирается с клавиатуры", v == '1 3/4', repr(v))

    # квадратные: «;» и «нет»
    page.goto(f"{BASE}/quadratic.html")
    page.wait_for_timeout(700)
    for ch in ['2', ';', '-', '5']:
        press(page, ch)
    v = page.evaluate("document.querySelector('.qa-panel .qa-input').value")
    check("Квадратные: корни через «;»", v == '2;-5', repr(v))
    press(page, 'none')
    v = page.evaluate("document.querySelector('.qa-panel .qa-input').value")
    check("Квадратные: «нет» пишет «нет корней» вместо набранного", v == 'нет корней', repr(v))

    # ОГЭ №9, движок линейных: «ответ сразу» и шаги — кнопки движка живые
    page.goto(f"{BASE}/oge9.html")
    page.wait_for_timeout(700)
    page.evaluate("openModeById('linear')")
    page.wait_for_timeout(700)
    check("ОГЭ №9: у линейных есть «ответ сразу»", page.evaluate("!!document.querySelector('.qa-panel')"))
    press(page, '4')
    v = page.evaluate("document.querySelector('.qa-panel .qa-input').value")
    check("ОГЭ №9: кнопка движка пишет в поле (раньше была не привязана)", v == '4', repr(v))

    # НОД: запятая по-прежнему разделяет делители «, »
    page.goto(f"{BASE}/gcd.html")
    page.wait_for_timeout(700)
    if page.query_selector('#goBtn') and page.is_visible('#goBtn'):
        page.click('#goBtn')
    page.wait_for_timeout(300)
    own = page.evaluate("document.getElementById(activeInputId) && document.getElementById(activeInputId).offsetParent ? activeInputId : null")
    if own:
        page.click('#' + own)
        page.evaluate("document.getElementById(activeInputId).value = ''")
        press(page, '1')
        press(page, ',')
        press(page, '2')
        v = page.evaluate("document.getElementById(activeInputId).value")
        check("НОД: запятая в поле шага ставит «, »", v == '1, 2', repr(v))
    else:
        check("НОД: есть поле шага", False, "не нашли")
    ctx.close()


# ─── 5. ввод в место курсора и maxlength ───
def test_caret(browser):
    ctx = new_ctx(browser, viewport={"width": 1400, "height": 900})
    page = ctx.new_page()
    open_task(page, "oge8", "cards")
    page.evaluate("() => { const i = document.getElementById('answerInput'); i.value = '12'; i.focus(); i.setSelectionRange(1, 1); }")
    press(page, '5')
    v = page.evaluate("document.getElementById('answerInput').value")
    check("ОГЭ №8: цифра встаёт в место курсора (1|2 → 152)", v == '152', repr(v))
    page.evaluate("() => document.getElementById('answerInput').setSelectionRange(2, 2)")
    press(page, 'back')
    v = page.evaluate("document.getElementById('answerInput').value")
    check("ОГЭ №8: «Стереть» убирает символ перед курсором (15|2 → 12)", v == '12', repr(v))
    r = page.evaluate("""() => { const i = document.createElement('input'); i.maxLength = 3; i.value = '123';
        document.body.appendChild(i); Keypad.insert(i, '4'); const v = i.value; i.remove(); return v; }""")
    check("maxlength соблюдается", r == '123', repr(r))
    ctx.close()


# ─── 6. тренажёры с выбором ответа: полей ввода нет ───
def test_choice_only(browser):
    ctx = new_ctx(browser, viewport={"width": 1400, "height": 900})
    page = ctx.new_page()
    for slug in CHOICE_ONLY:
        page.goto(f"{BASE}/{slug}.html")
        page.wait_for_timeout(600)
        n = len(page.query_selector_all(CARDS))
        found = []
        for k in range(n):
            page.goto(f"{BASE}/{slug}.html")
            page.wait_for_timeout(400)
            cards = page.query_selector_all(CARDS)
            if len(cards) <= k:
                break
            # после перезагрузки страница открывает последний тип, и список
            # типов скрыт — жмём карточку из кода, обработчик тот же
            cards[k].evaluate("e => e.click()")
            page.wait_for_timeout(400)
            found += page.evaluate("""() => [...document.querySelectorAll('input, textarea')].filter(i =>
                i.offsetParent && !/^cp[RGB]$/.test(i.id) && !i.closest('.ts-share-pop, .board-toolbar')).map(i => i.id || i.className)""")
        check(f"{slug}: во всех {n} типах ответ выбирают кнопками — полей ввода нет", n > 0 and not found, str(found[:5]))
    ctx.close()


# ─── 7. телефон ───
def test_phone(browser):
    for key in ["addition", "fraction_multiply", "quadratic", "oge8", "ege_prof.html?n=15", "logarithms", "oge9#quad"]:
        how = PAGES[key][0]
        ctx = new_ctx(browser, viewport={"width": 375, "height": 800}, has_touch=True, is_mobile=True)
        page = ctx.new_page()
        open_task(page, key, how)
        lay = page.evaluate(LAYOUT_JS)
        over = page.evaluate("document.documentElement.scrollWidth - innerWidth")
        check(f"375px {key}: клавиатура целиком на экране", bool(lay) and lay["onScreen"], str(lay and lay.get("onScreen")))
        check(f"375px {key}: без прокрутки вбок", over <= 0, str(over))
        ctx.close()


def main():
    with local_server(), sync_playwright() as p:
        browser = p.chromium.launch()
        test_all(browser)
        test_quick_answer(browser)
        test_caret(browser)
        test_choice_only(browser)
        test_phone(browser)
        browser.close()
    print()
    if FAILS:
        print(f"ИТОГ: {len(FAILS)} проверок не прошло")
        sys.exit(1)
    print("ИТОГ: всё прошло")


if __name__ == "__main__":
    main()
