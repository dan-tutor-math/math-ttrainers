"""
Клавиатура ответа на досках: ∞, +∞, −∞, ∪, ∩ — для ответов к неравенствам,
например (−∞; 3) ∪ (5; +∞).

Проверяем:
  1. Полная раскладка: новый ряд ∞ +∞ −∞ ∪ ∩ стоит между рядом «−  0  ,  (  )»
     и нижним рядом (⌨ / Проверить / ✕); кнопки той же ширины, что «0».
  2. Узкая полоска (с мышью, без цифр): те же пять кнопок вторым рядом.
  3. Каждая кнопка вставляет своё: ∞, +∞, -∞ (дефис — как кнопка «−», так
     его читают все разборы), ∪, ∩; подпись у третьей — «−∞».
  4. Строка «Читается так» понимает промежутки и ∪ / ∩, не пишет
     «Пока не разобрать».
  5. Проверка ответа (taCheckField, тип set): ∞ и ∪ засчитываются, а ∩ —
     пересечение двух промежутков считается, как на бумаге.

Запуск: python3 test_prompt111_pad_infinity_sets.py (сервер поднимается сам).
Совместный режим (набранное кнопками у собеседника) отсюда не проверить —
websocket до Supabase из песочницы закрыт; это перепроверяется на сайте руками.
"""
import contextlib
import http.client
import os
import subprocess
import sys
import time

from playwright.sync_api import sync_playwright

PORT = 8994
HERE = os.path.dirname(os.path.abspath(__file__))
HARNESS = """<!doctype html><meta charset="utf-8">
<link rel="stylesheet" href="liquid-glass.css"><link rel="stylesheet" href="katex-0.18.5.css">
<body style="margin:0;padding:200px 40px"><input id="a" style="width:260px;height:40px">
<script src="katex-0.18.5.js"></script>
<script src="trainer-tasks.js"></script>
<script src="board-answer-pad.js"></script>
<script>
  BoardAnswerPad.attach(document.getElementById('a'), { onCheck() {} });
</script>"""


@contextlib.contextmanager
def local_server():
    proc = subprocess.Popen([sys.executable, "-m", "http.server", str(PORT), "-d", HERE],
                            stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    try:
        for _ in range(50):
            try:
                http.client.HTTPConnection("127.0.0.1", PORT, timeout=0.2).request("GET", "/")
                break
            except Exception:
                time.sleep(0.1)
        yield
    finally:
        proc.terminate()
        proc.wait(timeout=5)


fails = []


def check(name, ok):
    print(("PASS " if ok else "FAIL ") + name)
    if not ok:
        fails.append(name)


NEW = ["∞", "+∞", "-∞", "∪", "∩"]


def keys(page):
    return page.evaluate("() => [...document.querySelectorAll('#bdAnsPad.open .bap-grid button')].map(b => b.dataset.k)")


def open_pad(page, full):
    page.evaluate(f"() => {{ localStorage.setItem('bdPadFull', '{1 if full else 0}'); document.getElementById('a').blur(); }}")
    page.wait_for_timeout(250)
    page.fill("#a", "")
    page.click("#a")
    page.wait_for_timeout(200)


def tap(page, k):
    page.click(f'#bdAnsPad.open button[data-k="{k}"]')


with local_server(), sync_playwright() as p:
    br = p.chromium.launch()
    page = br.new_page(viewport={"width": 900, "height": 700})
    page.route("**/__harness.html", lambda r: r.fulfill(body=HARNESS, content_type="text/html"))
    page.goto(f"http://127.0.0.1:{PORT}/__harness.html")

    # 1. полная раскладка
    open_pad(page, True)
    ks = keys(page)
    i0 = ks.index("-")
    check("1. ряд ∞ +∞ −∞ ∪ ∩ идёт после ряда «− 0 , ( )»", ks[i0 + 5:i0 + 10] == NEW)
    # с мышью вместо ⌨ — «свернуть» (digits), как в тесте №108
    check("1. под ним нижний ряд ⌄ / Проверить / ✕", ks[i0 + 10:i0 + 13] == ["digits", "check", "close"])
    w = page.evaluate("""() => { const r = k => document.querySelector('#bdAnsPad button[data-k="' + k + '"]').getBoundingClientRect().width;
        return { zero: Math.round(r('0')), inf: Math.round(r('∞')), plus: Math.round(r('+∞')), minus: Math.round(r('-∞')), cup: Math.round(r('∪')) }; }""")
    check(f"1. кнопки ряда шириной с «0» ({w})", w["inf"] == w["zero"] == w["plus"] == w["minus"] == w["cup"])
    label = page.evaluate("() => document.querySelector('#bdAnsPad button[data-k=\"-∞\"]').textContent")
    check("3. подпись у кнопки «−∞» — настоящий минус", label == "−∞")

    f = page.evaluate("""() => ['∪', '∩'].map(k => { const c = getComputedStyle(document.querySelector('#bdAnsPad button[data-k="' + k + '"]'));
        return c.fontFamily + '|' + c.fontWeight + '|' + c.fontSize; })""")
    check(f"3. ∪ и ∩ одного шрифта, толщины и размера ({f[0]})", f[0] == f[1] and "STIX" in f[0])

    # 3. что вставляет каждая кнопка
    for k, want in zip(NEW, ["∞", "+∞", "-∞", "∪", "∩"]):
        page.fill("#a", "")
        page.click("#a")
        tap(page, k)
        check(f"3. «{k}» вставляет {want}", page.input_value("#a") == want)

    # 2. узкая полоска
    open_pad(page, False)
    ks = keys(page)
    check("2. узкая полоска: √ ± / ; ( ) 123 ✕ и вторым рядом ∞ +∞ −∞ ∪ ∩",
          ks == ["√", "±", "/", ";", "(", ")", "digits", "close"] + NEW)
    page.fill("#a", "")
    page.click("#a")
    for k in ["(", "-∞", ";"]:
        tap(page, k)
    page.keyboard.type("3")
    tap(page, ")")
    tap(page, "∪")
    check("2. в узкой полоске кнопки пишут в поле", page.input_value("#a") == "(-∞; 3)∪")

    # 4. строка «Читается так»
    def prev(text):
        page.fill("#a", text)
        page.dispatch_event("#a", "input")
        page.wait_for_timeout(120)
        return page.evaluate("""() => { const b = document.querySelector('#bdAnsPad .bap-prev');
            return { on: b.classList.contains('on'), txt: b.textContent, katex: b.querySelectorAll('.katex').length }; }""")
    for src in ["(-∞;3)∪(5;+∞)", "(1;5]∩(3;8)", "[-2;3)", "(-∞;+∞)"]:
        r = prev(src)
        check(f"4. «{src}» читается без «Пока не разобрать»", r["on"] and r["katex"] == 1 and "Пока не разобрать" not in r["txt"])
    r = prev("(-∞;3)∪(5;+∞)")
    check("4. в строке есть ∞ и ∪", "∞" in r["txt"] and "∪" in r["txt"])
    r = prev("(1;5]∩(3;8)")
    check("4. в строке есть ∩ и скобка ]", "∩" in r["txt"] and "]" in r["txt"])
    r = prev("(2;+∞)")
    check("4. +∞ в строке остаётся с плюсом", "+" in r["txt"] and "∞" in r["txt"])
    r = prev("4-√7; 4+√7")
    check("4. старое не сломалось: два корня читаются", r["katex"] == 1 and "Пока не разобрать" not in r["txt"])

    # 5. проверка ответа
    def chk(value, answer):
        return page.evaluate("([v, a]) => taCheckField({ type: 'set', value: v }, a)", [value, answer])
    A = "(-∞;3)∪(5;+∞)"
    check("5. (−∞; 3) ∪ (5; +∞) засчитан", chk(A, "(−∞; 3) ∪ (5; +∞)") is True)
    check("5. +∞ и ∞ — одно и то же", chk(A, "(-∞;3)∪(5;∞)") is True)
    check("5. закрытая скобка у 3 — неверно", chk(A, "(-∞;3]∪(5;+∞)") is False)
    check("5. (−∞; 5) ∩ (−∞; 3) = (−∞; 3)", chk("(-∞;3)", "(-∞;5)∩(-∞;3)") is True)
    check("5. (1; 5) ∩ (3; 8) = (3; 5)", chk("(3;5)", "(1;5)∩(3;8)") is True)
    check("5. [1; 5] ∩ [5; 8] = {5}", chk("{5}", "[1;5]∩[5;8]") is True)
    check("5. (1; 5) ∩ (3; 8) ∪ (10; 12)", chk("(3;5)∪(10;12)", "(1;5)∩(3;8)∪(10;12)") is True)
    check("5. неверное пересечение — неверно", chk("(3;5)", "(1;5)∩(4;8)") is False)
    check("5. пересечение без второй части — «запишите иначе», не «неверно»", chk("(3;5)", "(1;5)∩") is None)

    br.close()

print("\nОК" if not fails else f"\nПровалено: {len(fails)}")
sys.exit(1 if fails else 0)
