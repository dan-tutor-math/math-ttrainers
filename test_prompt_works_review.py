"""
Просмотр работы ученика из результатов (works.html) и выход из презентации
без полосы справа (boards.html).

Проверяет:
  A. «Смотреть работу»: все задания и видео по порядку, в полях — ответы ученика,
     цвет по итогу, верный ответ; ввод ученика не исполняется как разметка;
  B. щелчок по ячейке — эта задача одна; номера, стрелки, край списка;
     следующий ученик — его вариант; Esc возвращает фокус, страница снова активна;
  C. телефон 375 без прокрутки вбок, задание не уходит под шапку;
  D. презентация: <html> остаётся блоком, после выхода список во всю ширину окна,
     переключатель «Конструктор / Урок» не потерял оформление.

Запуск: python3 test_prompt_works_review.py
"""
import sys

from playwright.sync_api import sync_playwright

from test_prompt15_works_stage1 import BASE, local_server, new_context
import test_prompt84_deck_slides as T

FAILS = []


def check(name, cond, extra=""):
    print(("[OK] " if cond else "[FAIL] ") + name + (f" — {extra}" if extra and not cond else ""))
    if not cond:
        FAILS.append(name)


# Данные подаём прямо в WorksCloud: вход и база здесь ни при чём, их проверяют
# тесты этапов работ
SETUP = r"""
async () => {
  const img = t => { const u = 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="480" height="200"><text x="20" y="40">' + t + '</text></svg>'); return { light: { url: u }, dark: { url: u } }; };
  const css = { w: 480, h: 200 };
  const F = (id, src) => ({ id, src, type: 'task', name: 'Уравнение', mode: 'exam', img: img(id), css, hot: { w: 480, h: 200, fields: [{ x: .3, y: .55, w: .4, h: .25 }] }, task: { kind: 'fields', fields: [{ id: 'a', value: '12' }] } });
  const O = (id, src) => ({ id, src, type: 'task', name: 'Выбор', mode: 'exam', img: img(id), css, hot: { w: 480, h: 200, opts: [{ x: .05, y: .5, w: .4, h: .3 }, { x: .55, y: .5, w: .4, h: .3 }] }, task: { kind: 'choice', n: 2, correct: 1 } });
  const V = (id, src) => ({ id, src, type: 'video', title: 'Разбор' });
  const work = { id: 'w1', kind: 'hw', title: 'Т', settings: {}, closed: false, work_variants: [
    { id: 'v1', num: 1, code: 'AAA', blocks: [V('v0'), F('t1'), O('t2'), F('t3'), F('t4')] },
    { id: 'v2', num: 2, code: 'BBB', blocks: [V('w0', 'v0'), F('u1', 't1'), O('u2', 't2'), F('u3', 't3'), F('u4', 't4')] },
  ] };
  const rows = [
    { id: 'r1', variant_id: 'v1', student_name: 'Маша', started_at: '2026-11-07T10:00:00Z', finished_at: '2026-11-07T10:20:00Z', active_ms: 1200000, work_answers: [
      { task_id: 'v0', status: 'pending', value: { w: 30, d: 60 }, tries: 0, time_ms: 0 },
      { task_id: 't1', status: 'ok', value: { vals: { a: '12' } }, tries: 1, time_ms: 60000 },
      { task_id: 't2', status: 'bad', value: { pick: 0 }, tries: 1, time_ms: 30000 },
      { task_id: 't3', status: 'pending', value: { vals: { a: '<img src=x onerror=window.__xss=1>' } }, tries: 2, time_ms: 90000 },
    ] },
    { id: 'r2', variant_id: 'v2', student_name: 'Петя', started_at: '2026-11-07T11:00:00Z', finished_at: null, active_ms: 60000, work_answers: [
      { task_id: 'u1', status: 'bad', value: { vals: { a: '5' } }, tries: 3, time_ms: 9000 },
    ] },
  ];
  window.WorksCloud.getWork = async () => work;
  window.WorksCloud.results = async () => rows;
  await window.__works.openResults('w1');
}
"""


def open_results(ctx):
    page = ctx.new_page()
    page.goto(BASE + "/works.html")
    page.wait_for_selector("#scrAuth:not([hidden])")
    page.evaluate(SETUP)
    page.wait_for_selector("#rsTable tbody tr")
    return page


def main():
    with local_server(), sync_playwright() as p:
        browser = p.chromium.launch()
        ctx = new_context(browser, viewport={"width": 1200, "height": 800})
        page = open_results(ctx)
        errors = []
        page.on("pageerror", lambda e: errors.append(str(e)))

        print("— A. вся работа")
        page.click('[data-view="0"]')
        check("A1 все задания", page.locator(".rv-card").count() == 4)
        check("A2 видео на своём месте, первым", "rv-vid" in page.evaluate("() => document.getElementById('rvBody').firstChild.className"))
        check("A3 в поле — ответ, зелёный", page.inner_text('.rv-card[data-ti="0"] .rv-in') == "12"
              and "good" in page.get_attribute('.rv-card[data-ti="0"] .rv-in', "class"))
        opts = page.evaluate("""() => [...document.querySelectorAll('.rv-card[data-ti="1"] .rv-opt')].map(o => o.className)""")
        check("A4 выбор: неверный красный, верный зелёный", "bad" in opts[0] and "good" in opts[1], str(opts))
        check("A5 верный ответ подписан", page.inner_text('.rv-card[data-ti="1"] .rv-right') == "вариант 2")
        check("A6 ввод ученика — текст, не разметка", page.locator(".rv-in img").count() == 0
              and page.evaluate("() => !window.__xss") and "onerror" in page.inner_text('.rv-card[data-ti="2"] .rv-in'))
        check("A7 не открытое задание", "Не открывал" in page.inner_text('.rv-card[data-ti="3"] .rv-st'))
        page.click("#rvClose")
        check("A8 закрыто, страница активна", page.is_hidden("#rv") and page.evaluate("() => document.querySelector('.wrap').inert === false"))

        print("— B. одна задача")
        page.click('#rsTable tbody tr:nth-child(1) .cell[data-t="2"]')
        check("B1 открылась нажатая задача, одна", page.locator(".rv-card").count() == 1 and page.get_attribute(".rv-card", "data-ti") == "2")
        page.keyboard.press("ArrowRight")
        check("B2 стрелка — следующая", page.get_attribute(".rv-card", "data-ti") == "3")
        page.keyboard.press("ArrowRight")
        check("B3 у края список не уходит", page.get_attribute(".rv-card", "data-ti") == "3")
        page.locator("#rvNums .cell").nth(0).click()
        check("B4 номер — та задача", page.get_attribute(".rv-card", "data-ti") == "0")
        page.click("#rvNextS")
        check("B5 следующий ученик — ответ его варианта", page.inner_text("#rvName") == "Петя"
              and page.inner_text(".rv-in") == "5" and page.is_disabled("#rvNextS"))
        page.keyboard.press("Escape")
        check("B6 Esc закрывает и возвращает фокус на ячейку", page.is_hidden("#rv")
              and page.evaluate("() => document.activeElement.classList.contains('cell')"))
        page.keyboard.press("Enter")
        check("B6а Enter на ячейке снова открывает задачу", page.is_visible("#rv") and page.locator(".rv-card").count() == 1)
        page.keyboard.press("Escape")
        check("B7 нет ошибок страницы", not errors, "; ".join(errors))
        ctx.close()

        print("— C. телефон")
        ctx = new_context(browser, viewport={"width": 375, "height": 812})
        page = open_results(ctx)
        page.click('[data-view="0"]')
        page.locator("#rvNums .cell").nth(2).click()
        m = page.evaluate("""() => { const r = document.getElementById('rv'); return {
          sw: r.scrollWidth, cw: r.clientWidth,
          top: document.querySelector('.rv-card[data-ti="2"]').getBoundingClientRect().top,
          bar: document.querySelector('.rv-bar').getBoundingClientRect().bottom }; }""")
        check("C1 нет прокрутки вбок", m["sw"] <= m["cw"], str(m))
        check("C2 задание под шапкой, а не за ней", m["top"] >= m["bar"], str(m))
        ctx.close()
        browser.close()

    T.PORT = 8979
    T.BASE = f"http://127.0.0.1:{T.PORT}"
    with T.local_server(), sync_playwright() as p:
        print("— D. выход из презентации")
        browser = p.chromium.launch()
        page = browser.new_page(viewport={"width": 1781, "height": 978})
        page.goto(T.BASE + "/boards.html")
        page.evaluate(T.BOOT_JS)
        page.click("#blCreateDeck")
        page.wait_for_function("() => B && B.kind === 'deck' && boardActive")
        page.wait_for_timeout(300)
        check("D1 <html> презентации — блок", page.evaluate("() => getComputedStyle(document.documentElement).display") == "block")
        seg = page.evaluate("() => { const c = getComputedStyle(document.getElementById('deckModeSeg')); return [c.paddingLeft, c.borderRadius]; }")
        check("D2 оформление переключателя на месте", seg == ["2px", "11px"], str(seg))
        page.click("#bdBack")
        page.wait_for_timeout(300)
        w = page.evaluate("""() => ({ inner: document.documentElement.clientWidth,
          body: document.body.getBoundingClientRect().width,
          list: document.getElementById('screenList').getBoundingClientRect().width })""")
        check("D3 список во всю ширину окна", w["body"] == w["inner"] and w["list"] == w["inner"], str(w))
        browser.close()

    print("\nИтог:", "ВСЁ ХОРОШО" if not FAILS else "ПРОВАЛЕНО: " + ", ".join(FAILS))
    sys.exit(1 if FAILS else 0)


if __name__ == "__main__":
    main()
