"""
Промпт №109: два замечания аудита impeccable в ОГЭ №8.

Проверяет:
  1. на телефоне (375 и 320 px) плавающая клавиатура не закрывает задание:
     строка ответа и «Проверить» лежат над ней, кнопку «Проверить» ничто не
     перекрывает — для нескольких типов, в том числе «Случайно»; если
     карточка помещается над закреплённой «+», условие не лежит под ней;
  2. под клавиатурой есть запас: прокрутив страницу до конца, счёт видно
     целиком, а не из-под панели;
  3. клавиатуру утащили в верхнюю половину — страница при новом задании
     сама не прокручивается (место выбрал учитель);
  4. на широком экране страница не прыгает: прокрутка остаётся 0;
  5. карточки типов доступны с клавиатуры: role="button", tabindex="0",
     до них доходит Tab, Enter и пробел открывают задание, есть видимая
     рамка фокуса;
  6. ошибок JavaScript нет.

Запуск: python3 test_prompt109_oge8_keypad_a11y.py (сервер поднимается сам).
"""
import contextlib
import http.client
import os
import subprocess
import sys
import time

from playwright.sync_api import sync_playwright

PORT = 9198
BASE = f"http://127.0.0.1:{PORT}"
URL = f"{BASE}/oge8.html"
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


def new_page(browser, width, height, touch=False):
    ctx = browser.new_context(viewport={"width": width, "height": height},
                              has_touch=touch, is_mobile=touch)
    page = ctx.new_page()
    errors = []
    page.on("pageerror", lambda e: errors.append(str(e)))
    page.route("https://**/*", lambda route: route.abort())
    page.goto(URL)
    page.wait_for_timeout(700)
    return ctx, page, errors


# Плавная прокрутка + рост панели: ждём, пока всё встанет
SETTLE = 1300

COVER_JS = """() => {
  const kp = document.getElementById('keypadFloat');
  const k = kp.getBoundingClientRect();
  const row = document.getElementById('inputAnswerArea').getBoundingClientRect();
  const btn = document.getElementById('checkAnswerBtn');
  const b = btn.getBoundingClientRect();
  const top = document.elementFromPoint(b.left + b.width / 2, b.top + b.height / 2);
  const overlap = !(row.right <= k.left || row.left >= k.right || row.bottom <= k.top || row.top >= k.bottom);
  const q = document.getElementById('card1Question').getBoundingClientRect();
  const railEl = document.querySelector('.add-rail');
  // у position:fixed offsetParent всегда null — видимость только по размеру
  const rr0 = railEl && railEl.getBoundingClientRect();
  const rr = rr0 && rr0.height > 0 ? rr0 : null;
  // «+» мешает, только если карточка вообще помещается над ней
  const railFits = rr && q.height <= rr.top - 20;
  const railOverlap = !!railFits && !(q.right <= rr.left || q.left >= rr.right || q.bottom <= rr.top || q.top >= rr.bottom);
  return { shown: getComputedStyle(kp).display !== 'none', overlap, railOverlap, railSeen: !!rr,
           btnOnTop: !!top && (top === btn || btn.contains(top)),
           rowBottom: Math.round(row.bottom), kpTop: Math.round(k.top),
           rowTop: Math.round(row.top) };
}"""


def open_type(page, selector):
    page.click(selector)
    page.wait_for_timeout(SETTLE)


def back_to_list(page):
    page.click("#backBtn")          # «← все типы»
    page.wait_for_timeout(500)


# ─── 1–2. телефон: задание над клавиатурой, под ней есть запас ───
def test_phone(browser, width, height):
    ctx, page, errors = new_page(browser, width, height, touch=True)
    ids = page.eval_on_selector_all("#modesGrid .mode-card", "es => es.map(e => e.dataset.id)")
    picks = ['.mode-card.random[data-id="random"]'] + [f'#modesGrid .mode-card[data-id="{i}"]' for i in ids[:1] + ids[4:5] + ids[-1:]]
    for sel in picks:
        open_type(page, sel)
        r = page.evaluate(COVER_JS)
        check(f"{width}px {sel}: клавиатура видна", r["shown"])
        check(f"{width}px {sel}: строка ответа не под клавиатурой", not r["overlap"], str(r))
        check(f"{width}px {sel}: «Проверить» ничем не закрыта", r["btnOnTop"], str(r))
        check(f"{width}px {sel}: поле ответа в пределах экрана", r["rowTop"] >= 0, str(r))
        # без этой проверки следующая проходила бы впустую, не найдя «+»
        check(f"{width}px {sel}: «+» слева есть на экране", r["railSeen"], str(r))
        check(f"{width}px {sel}: «+» слева не лежит на условии", not r["railOverlap"], str(r))
        back_to_list(page)

    open_type(page, f'#modesGrid .mode-card[data-id="{ids[4]}"]')
    page.evaluate("() => window.scrollTo(0, document.documentElement.scrollHeight)")
    page.wait_for_timeout(300)
    stats = page.evaluate("""() => {
      const k = document.getElementById('keypadFloat').getBoundingClientRect();
      const s = [...document.querySelectorAll('.stats')].find(e => e.offsetParent);
      if (!s) return null;
      const r = s.getBoundingClientRect();
      return { statsBottom: Math.round(r.bottom), kpTop: Math.round(k.top) };
    }""")
    check(f"{width}px: в конце страницы счёт над клавиатурой",
          stats is not None and stats["statsBottom"] <= stats["kpTop"], str(stats))
    check(f"{width}px: без ошибок JS", not errors, "; ".join(errors))
    ctx.close()


# ─── 3. клавиатура в верхней половине — страницу не трогаем ───
def test_keypad_moved_up(browser):
    ctx, page, errors = new_page(browser, 375, 812, touch=True)
    ids = page.eval_on_selector_all("#modesGrid .mode-card", "es => es.map(e => e.dataset.id)")
    open_type(page, f'#modesGrid .mode-card[data-id="{ids[0]}"]')
    # так её ставит makeKeypadDraggable после перетаскивания
    page.evaluate("""() => { const kp = document.getElementById('keypadFloat');
      kp.style.top = '20px'; kp.style.bottom = 'auto'; kp.style.left = '150px'; kp.style.right = 'auto'; }""")
    back_to_list(page)
    open_type(page, f'#modesGrid .mode-card[data-id="{ids[1]}"]')
    y = page.evaluate("() => window.scrollY")
    check("клавиатура наверху: страница сама не прокрутилась", y == 0, f"scrollY={y}")
    ctx.close()


# ─── 4. широкий экран: без прыжков ───
def test_wide(browser):
    ctx, page, errors = new_page(browser, 1300, 1000)
    ids = page.eval_on_selector_all("#modesGrid .mode-card", "es => es.map(e => e.dataset.id)")
    open_type(page, f'#modesGrid .mode-card[data-id="{ids[4]}"]')
    y = page.evaluate("() => window.scrollY")
    r = page.evaluate(COVER_JS)
    check("1300px: прокрутка осталась 0", y == 0, f"scrollY={y}")
    check("1300px: клавиатура не на строке ответа", not r["overlap"], str(r))
    ctx.close()


# ─── 5. карточки типов с клавиатуры ───
def test_keyboard(browser):
    ctx, page, errors = new_page(browser, 1300, 1000)
    attrs = page.eval_on_selector_all(
        "#pickerArea .mode-card", "es => es.map(e => [e.getAttribute('role'), e.getAttribute('tabindex')])")
    check("у всех карточек role=button и tabindex=0",
          len(attrs) > 5 and all(a == ["button", "0"] for a in attrs), str(attrs[:3]))

    reached = False
    for _ in range(60):
        page.keyboard.press("Tab")
        if page.evaluate("() => document.activeElement.classList.contains('mode-card')"):
            reached = True
            break
    check("Tab доходит до карточки типа", reached)
    ring = page.evaluate("() => getComputedStyle(document.activeElement).outlineStyle")
    check("у карточки в фокусе видна рамка", ring not in ("none", ""), ring)
    page.keyboard.press("Enter")
    page.wait_for_timeout(600)
    check("Enter открывает задание", page.is_visible("#questionPanel"))

    back_to_list(page)
    ids = page.eval_on_selector_all("#modesGrid .mode-card", "es => es.map(e => e.dataset.id)")
    page.focus(f'#modesGrid .mode-card[data-id="{ids[2]}"]')
    page.keyboard.press(" ")
    page.wait_for_timeout(600)
    check("пробел открывает задание", page.is_visible("#questionPanel"))
    cur = page.evaluate("() => typeof curMode !== 'undefined' ? curMode : null")
    check("открылся именно выбранный тип", cur == ids[2], f"{cur} != {ids[2]}")
    check("без ошибок JS", not errors, "; ".join(errors))
    ctx.close()


def main():
    with local_server(), sync_playwright() as p:
        browser = p.chromium.launch()
        test_phone(browser, 375, 812)
        test_phone(browser, 320, 568)
        test_keypad_moved_up(browser)
        test_wide(browser)
        test_keyboard(browser)
        browser.close()
    failed = [n for n, ok in results if not ok]
    print(f"\n{len(results) - len(failed)}/{len(results)} проверок прошло")
    sys.exit(1 if failed else 0)


if __name__ == "__main__":
    main()
