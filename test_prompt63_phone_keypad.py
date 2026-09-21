"""
Промпт №63: мелочи, замеченные при правке №61, — телефон и клавиатура.

Проверяет:
  1. на экранной клавиатуре ОГЭ №1–5 и №7 есть запятая: дробный ответ шины
     (107,25) и шаг «8,5² = 72,25» в №7 набираются кнопками и засчитываются;
     набранное кнопками в №1–5 уходит событием input (его ловит совместная
     сессия); в тренажёрах, где запятая была, она на месте;
  2. на телефоне (375 и 320 px) ни одна страница не прокручивается вбок —
     ни экран выбора, ни задание двух первых типов: шапка задания («◀ ▶
     тип», название, 📥, ⟳) переносится на следующую строку;
  3. на широком экране шапка осталась в одну строку;
  4. на телефоне ничего не обрезано у сворачиваемых блоков (заголовок,
     подзаголовок, счёт, вкладки, навигация по заданиям Шины, уровни):
     в ОГЭ №1–5 кнопка «Следующее задание» видна и нажимается, три карточки
     счёта на 320 px помещаются.

Запуск: python3 test_prompt63_phone_keypad.py (сервер поднимается сам).
"""
import contextlib
import http.client
import os
import subprocess
import sys
import time

from playwright.sync_api import sync_playwright

PORT = 8983
BASE = f"http://127.0.0.1:{PORT}"
HERE = os.path.dirname(os.path.abspath(__file__))

TRAINERS = ["oge1_5", "oge6", "oge7", "oge8", "oge9", "oge10", "oge11", "oge12", "oge13",
            "oge14", "oge15_18", "oge19", "powers", "ege_prof", "ege_base", "oge_part2",
            "addition", "subtraction", "multiplication", "division", "linear", "quadratic",
            "fraction_multiply", "fraction_divide"]


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


def new_page(browser, url, width=1300, height=1000, wait=900):
    ctx = browser.new_context(viewport={"width": width, "height": height})
    page = ctx.new_page()
    errors = []
    page.on("pageerror", lambda e: errors.append(str(e)))
    page.route("https://**/*", lambda route: route.abort())
    page.goto(url)
    page.wait_for_timeout(wait)
    return ctx, page, errors


def url_of(slug):
    if slug == "oge_part2":
        return f"{BASE}/oge_part2.html?n=20"
    if slug.startswith("ege"):
        return f"{BASE}/{slug}.html?n=7"
    return f"{BASE}/{slug}.html"


CARDS = "#modesGrid .mode-card:not(.soon), #protoList .mode-card, #pickerArea .modes .mode-card"

OVERFLOW_JS = "() => document.documentElement.scrollWidth - window.innerWidth"

CLIP_JS = """() => { const out = [];
  document.querySelectorAll('h1, .sub, .stats, .submode-tabs, .submode-row, .taskset-nav, .example-history-toggle, .levels').forEach(e => {
    const cs = getComputedStyle(e);
    if (cs.display === 'none' || e.offsetParent === null) return;
    if (cs.overflow === 'hidden' && e.scrollHeight > e.clientHeight + 2)
      out.push((e.id || String(e.className).split(' ')[0] || e.tagName) + ' ' + e.clientHeight + '/' + e.scrollHeight);
  });
  return out; }"""


# ─── 1. запятая на клавиатуре ───
def test_keypad(browser):
    ctx, page, errors = new_page(browser, f"{BASE}/oge1_5.html")
    page.click('.mode-card[data-id="tire_demo2027"]')
    page.wait_for_timeout(600)
    page.click('#nextTaskBtn')          # задание 2: 165/65 R14 → 107,25
    page.wait_for_timeout(500)
    keys = page.eval_on_selector_all('#keypadButtons button', 'es => es.map(e => e.dataset.key)')
    check("№1–5: на клавиатуре есть запятая", ',' in keys, str(keys))
    page.evaluate("""() => { window.__inputs = 0;
      els.answerInput.addEventListener('input', () => window.__inputs++); }""")
    for ch in ['1', '0', '7', ',', '2', '5']:
        page.click(f'#keypadButtons button[data-key="{ch}"]')
    check("№1–5: кнопками набрано 107,25", page.input_value('#answerInput') == '107,25', page.input_value('#answerInput'))
    check("№1–5: набранное кнопками идёт событием input (для сессии)", page.evaluate("window.__inputs") == 6)
    # пока ответ не проверен, клавиатура на экране — меряем раскладку сейчас
    comma = page.eval_on_selector('#keypadButtons .kp-comma', 'e => e.getBoundingClientRect().toJSON()')
    enter = page.eval_on_selector('#keypadButtons .kp-enter', 'e => e.getBoundingClientRect().toJSON()')
    check("№1–5: запятая и «Ввод» в одном ряду", comma["height"] > 0 and abs(comma["top"] - enter["top"]) < 2
          and enter["width"] > 80, str((comma, enter)))
    page.click('#keypadButtons button[data-key="enter"]')
    page.wait_for_timeout(400)
    check("№1–5: ответ 107,25 с клавиатуры засчитан", page.evaluate("taskAnswered && totalErrors === 0"))
    check("№1–5: без ошибок JS", not errors, str(errors[:1]))
    ctx.close()

    ctx, page, errors = new_page(browser, f"{BASE}/oge7.html")
    page.click('.mode-card[data-id="demo2027"]')
    page.wait_for_timeout(400)
    page.click('#tabLearn')
    page.wait_for_timeout(500)
    for ans in ['64', '81']:
        page.fill('#stepInput', ans)
        page.click('#stepGo')
        page.wait_for_timeout(900)
    prompt = page.inner_text('#qaPrompt')
    page.click('#stepInput')
    for ch in ['7', '2', ',', '2', '5']:
        page.click(f'#keypadButtons button[data-key="{ch}"]')
    typed = page.input_value('#stepInput')
    page.click('#keypadButtons button[data-key="enter"]')
    page.wait_for_timeout(900)
    st = page.evaluate("({idx: stepIdx, n: curTask.steps.length, dis: els.stepInput.disabled, hint: els.stepHint.textContent})")
    check("№7: шаг «8,5²» — 72,25 набирается кнопками и засчитывается",
          '8,5²' in prompt and typed == '72,25' and st["idx"] == st["n"] == 3 and st["dis"]
          and 'Правильный ответ' not in st["hint"], f"{typed} / {st}")
    check("№7: без ошибок JS", not errors, str(errors[:1]))
    ctx.close()

    # где запятая была — осталась
    for slug in ["oge6", "oge8", "oge10", "oge12", "oge14", "powers"]:
        ctx, page, errors = new_page(browser, f"{BASE}/{slug}.html", wait=700)
        keys = page.eval_on_selector_all('#keypadButtons button', 'es => es.map(e => e.dataset.key)')
        check(f"{slug}: запятая на клавиатуре на месте", ',' in keys, str(keys))
        ctx.close()


# ─── 2, 4. телефон ───
def test_phone(browser):
    for width in (375, 320):
        for slug in TRAINERS:
            ctx, page, errors = new_page(browser, url_of(slug), width=width, height=800, wait=800)
            screens = [("выбор", page.evaluate(OVERFLOW_JS), page.evaluate(CLIP_JS))]
            n = len(page.query_selector_all(CARDS))
            for k in range(min(n, 2)):
                if k:
                    page.goto(url_of(slug))
                    page.wait_for_timeout(700)
                cards = page.query_selector_all(CARDS)
                if len(cards) <= k:
                    break
                cards[k].click()
                page.wait_for_timeout(700)
                screens.append((f"тип {k + 1}", page.evaluate(OVERFLOW_JS), page.evaluate(CLIP_JS)))
            bad_over = [(s, o) for s, o, c in screens if o > 0]
            bad_clip = [(s, c) for s, o, c in screens if c]
            check(f"{width}px {slug}: без прокрутки вбок", not bad_over, str(bad_over))
            check(f"{width}px {slug}: ничего не обрезано", not bad_clip, str(bad_clip))
            if errors:
                check(f"{width}px {slug}: без ошибок JS", False, str(errors[:1]))
            ctx.close()

    # Шина: «Следующее задание» видна целиком и нажимается
    for width in (320, 375, 480):
        ctx, page, errors = new_page(browser, f"{BASE}/oge1_5.html", width=width, height=800)
        page.click('.mode-card[data-id="tire_demo2027"]')
        page.wait_for_timeout(600)
        inside = page.evaluate("""() => { const n = document.getElementById('tasksetNav').getBoundingClientRect();
          const b = document.getElementById('nextTaskBtn').getBoundingClientRect(); return b.bottom <= n.bottom + 0.5; }""")
        page.click('#nextTaskBtn')
        page.wait_for_timeout(400)
        check(f"{width}px №1–5: «Следующее задание» видна и работает",
              inside and page.inner_text('#tasksetNavLabel') == 'Задание 2 из 5', page.inner_text('#tasksetNavLabel'))
        ctx.close()


# ─── 3. широкий экран: шапка в одну строку, как была ───
def test_wide(browser):
    for slug, card in [("oge6", "p1"), ("oge11", "signs"), ("oge15_18", "tri"), ("oge19", "geom"), ("oge1_5", "tariff1")]:
        ctx, page, errors = new_page(browser, f"{BASE}/{slug}.html")
        page.click(f'.mode-card[data-id="{card}"]')
        page.wait_for_timeout(500)
        h = page.eval_on_selector('#taskArea .task-head', 'e => e.getBoundingClientRect().height')
        check(f"широкий экран, {slug}: шапка задания в одну строку", h < 50, str(h))
        ctx.close()


def run():
    with local_server(), sync_playwright() as p:
        browser = p.chromium.launch()
        test_keypad(browser)
        test_phone(browser)
        test_wide(browser)
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
