"""
Стрелки номеров русского ОГЭ (exam-nav.js, экзамен «ОГЭ русский») и
«◀ Предыдущий тип / Следующий тип ▶» рядом с ◀ ▶ заданий.

Проверяет:
  A. порядок: №1 rus_oge01.html → №2…12 rus_oge.html?n=N → №13 rus_oge13.html;
     стрелкой «вперёд» от №1 до №13 и обратно; на №1 неактивна левая, на №13 — правая;
     из русского не уходим в другие экзамены;
  B. внутри rus_oge.html номер меняется без перезагрузки (хук __examNav): адрес,
     открытое задание; возврат на номер — на то же задание, где остановились;
     rus_oge.html?n=N по адресу открывает номер N;
  C. стрелки по бокам заголовка, на одной высоте с ним, круглые; в кадре
     (iframe панели доски) и в карточке ?card=1 стрелок нет;
  D. «Предыдущий/Следующий тип»: у номера с подтемами (№9) — соседняя подтема по
     кругу; без подтем (№1, №2–4, №6–7, №10) кнопок типов нет; ◀ ▶ заданий
     по-прежнему ходят по кругу; у №13 типы — 13.1–13.3 с отдельными черновиками;
  E. ширина 375 и 320 — без горизонтальной прокрутки, стрелки не под кнопками в углах;
  F. ошибок JS нет.

Запуск: python3 test_prompt_rus_exam_nav.py (сервер поднимается сам).
"""
import sys

from playwright.sync_api import sync_playwright

import test_prompt54_trainer_sync_and_cards as t54

PORT = 8991
t54.PORT = PORT
BASE = f"http://127.0.0.1:{PORT}"

SEQ = (["rus_oge01.html"] + [f"rus_oge.html?n={n}" for n in range(2, 13)] + ["rus_oge13.html"])


def where(page):
    """Страница и номер по адресу (без t и tp)."""
    return page.evaluate("""() => {
      const f = location.pathname.split('/').pop();
      const n = new URLSearchParams(location.search).get('n');
      return f + (n ? '?n=' + n : '');
    }""")


def settle(page):
    page.wait_for_function("() => document.getElementById('examNextBtn')", timeout=8000)
    page.wait_for_timeout(500)


def arrow(page, which, navigates):
    sel = "#examNextBtn" if which == "next" else "#examPrevBtn"
    if navigates:
        with page.expect_navigation():
            page.click(sel)
    else:
        page.click(sel)
    page.wait_for_timeout(700)


def check_walk(browser, failures, errors):
    ctx = browser.new_context()
    page = t54.new_page(ctx, errors)
    page.goto(f"{BASE}/{SEQ[0]}")
    settle(page)
    st = page.evaluate("() => [document.getElementById('examPrevBtn').disabled, document.getElementById('examNextBtn').disabled]")
    if st != [True, False]:
        failures.append(f"A/№1: disabled prev/next = {st}, ждали [True, False]")
    seen = [where(page)]
    for i in range(1, len(SEQ)):
        cur = where(page)
        navigates = not (cur.startswith("rus_oge.html") and SEQ[i].startswith("rus_oge.html"))
        arrow(page, "next", navigates)
        settle(page)
        seen.append(where(page))
    if seen != SEQ:
        failures.append(f"A: вперёд прошли {seen}")
    st = page.evaluate("() => [document.getElementById('examPrevBtn').disabled, document.getElementById('examNextBtn').disabled]")
    if st != [False, True]:
        failures.append(f"A/№13: disabled prev/next = {st}, ждали [False, True]")
    back = [where(page)]
    for i in range(len(SEQ) - 2, -1, -1):
        cur = where(page)
        navigates = not (cur.startswith("rus_oge.html") and SEQ[i].startswith("rus_oge.html"))
        arrow(page, "prev", navigates)
        settle(page)
        back.append(where(page))
    if back != SEQ[::-1]:
        failures.append(f"A: назад прошли {back}")
    print("  A: №1 → №13 и обратно по порядку, крайние стрелки неактивны")
    ctx.close()


def check_inpage(browser, failures, errors):
    ctx = browser.new_context()
    page = t54.new_page(ctx, errors)
    page.goto(f"{BASE}/rus_oge.html?n=5")
    settle(page)
    page.click("#modesGrid .mode-card[data-tp='']")
    # листаем в №5 на второе задание и запоминаем, какое открыто
    page.click("#nextBtnTop")
    page.wait_for_timeout(200)
    t5 = page.evaluate("() => new URLSearchParams(location.search).get('t')")
    page.evaluate("() => { window.__marker = 42; }")
    arrow(page, "next", False)      # №6 без перезагрузки
    if where(page) != "rus_oge.html?n=6":
        failures.append(f"B: после ▶ из №5 адрес {where(page)}")
    if page.evaluate("() => window.__marker") != 42:
        failures.append("B: №5 → №6 перезагрузил страницу")
    if page.evaluate("() => window.__rusOge.S.n") != 6:
        failures.append("B: S.n не 6")
    arrow(page, "prev", False)
    t5b = page.evaluate("() => new URLSearchParams(location.search).get('t')")
    if where(page) != "rus_oge.html?n=5" or t5b != t5:
        failures.append(f"B: возврат на №5 открыл {where(page)} t={t5b}, ждали t={t5}")
    # заход по адресу
    page.goto(f"{BASE}/rus_oge.html?n=11")
    settle(page)
    if page.evaluate("() => window.__examNav.n()") != 11:
        failures.append("B: ?n=11 по адресу не открыл №11")
    ctx.close()
    print("  B: номер внутри rus_oge.html меняется без перезагрузки, возврат — на то же задание")


def check_geom_and_frames(browser, failures, errors):
    ctx = browser.new_context()
    page = t54.new_page(ctx, errors)
    for url in ("rus_oge01.html", "rus_oge.html?n=3", "rus_oge13.html"):
        page.goto(f"{BASE}/{url}")
        settle(page)
        g = page.evaluate("""() => {
          const h1 = document.querySelector('h1.exam-nav-h1');
          if (!h1) return null;
          const r = e => e.getBoundingClientRect();
          const p = r(document.getElementById('examPrevBtn')), n = r(document.getElementById('examNextBtn')),
                t = r(h1.querySelector('.exam-nav-text'));
          return { order: [...h1.children].map(c => c.id || c.className), pr: p.right, tl: t.left, tr: t.right, nl: n.left,
                   dp: Math.abs((p.top + p.bottom) / 2 - (t.top + t.bottom) / 2), dn: Math.abs((n.top + n.bottom) / 2 - (t.top + t.bottom) / 2),
                   radius: getComputedStyle(document.getElementById('examPrevBtn')).borderRadius };
        }""")
        if not g:
            failures.append(f"C/{url}: нет стрелок у заголовка")
            continue
        if g["order"] != ["examPrevBtn", "exam-nav-text", "examNextBtn"]:
            failures.append(f"C/{url}: порядок {g['order']}")
        if g["pr"] > g["tl"] + 1 or g["nl"] < g["tr"] - 1 or g["dp"] > 4 or g["dn"] > 4 or g["radius"] != "50%":
            failures.append(f"C/{url}: геометрия {g}")
    # кадр панели доски и карточка «+»: страница в iframe / ?card=1 — стрелок нет
    for url in ("rus_oge.html?n=3", "rus_oge01.html", "rus_oge13.html"):
        page.goto(f"{BASE}/rus_oge.html?n=2")
        page.evaluate("(u) => { const f = document.createElement('iframe'); f.id='fr'; f.src = u; document.body.appendChild(f); }", url)
        page.wait_for_timeout(1200)
        fr = next(f for f in page.frames if f != page.main_frame)
        if fr.evaluate("() => !!document.getElementById('examPrevBtn') || !!document.querySelector('.exam-nav-h1')"):
            failures.append(f"C/кадр {url}: в iframe есть стрелки номеров")
        page.goto(f"{BASE}/{url}{'&' if '?' in url else '?'}card=1")
        page.wait_for_timeout(800)
        if page.evaluate("() => !!document.getElementById('examPrevBtn')"):
            failures.append(f"C/{url}?card=1: есть стрелки номеров")
    ctx.close()
    print("  C: стрелки по бокам заголовка; в кадре и карточке их нет")


def check_types(browser, failures, errors):
    ctx = browser.new_context()
    page = t54.new_page(ctx, errors)
    # №9 с подтемами: соседняя подтема по кругу
    page.goto(f"{BASE}/rus_oge.html?n=9")
    settle(page)
    page.click("#modesGrid .mode-card[data-tp]:not([data-tp=''])")
    page.wait_for_timeout(300)
    tps = page.evaluate("() => window.__rusOge.topicsOf(9).map(t => t.id)")
    if len(tps) < 2:
        failures.append(f"D: у №9 меньше двух подтем {tps}")
    else:
        cur = page.evaluate("() => window.__rusOge.S.topic")
        page.click("#nextTypeBtn")
        page.wait_for_timeout(300)
        got = page.evaluate("() => window.__rusOge.S.topic")
        want = tps[(tps.index(cur) + 1) % len(tps)]
        if got != want:
            failures.append(f"D: №9 следующий тип {cur} → {got}, ждали {want}")
        page.click("#prevTypeBtn")
        page.wait_for_timeout(300)
        if page.evaluate("() => window.__rusOge.S.topic") != cur:
            failures.append("D: №9 «Предыдущий тип» не вернул подтему")
        # ◀ ▶ заданий по кругу остались
        n = page.evaluate("() => window.__rusOge.S.list.length")
        page.click("#prevBtn")
        page.wait_for_timeout(200)
        if page.evaluate("() => window.__rusOge.S.idx") != n - 1:
            failures.append("D: ◀ задания из первого не пошла по кругу")
    # Без подтем показываем только стрелки заданий; они не меняют номер.
    for n in (2, 3, 4, 6, 7, 10):
        page.goto(f"{BASE}/rus_oge.html?n={n}")
        settle(page)
        if page.locator("#prevTypeBtn:visible, #nextTypeBtn:visible").count():
            failures.append(f"D: у №{n} без подтем видны кнопки типов")
        first = page.evaluate("() => window.__rusOge.S.idx")
        page.click("#nextBtnTop")
        page.click("#prevBtn")
        if page.evaluate("() => [window.__rusOge.S.n, window.__rusOge.S.idx]") != [n, first]:
            failures.append(f"D: стрелки заданий №{n} не вернули исходное задание")
        # Даже программный клик по скрытой кнопке не должен менять номер.
        page.evaluate("() => document.getElementById('nextTypeBtn').click()")
        if page.evaluate("() => window.__rusOge.S.n") != n:
            failures.append(f"D: скрытая кнопка типа №{n} переключила номер")
    # Видимость пересчитывается при переходе стрелками номера без перезагрузки.
    page.goto(f"{BASE}/rus_oge.html?n=7")
    settle(page)
    for n in (8, 9, 10, 11, 12):
        page.click("#examNextBtn")
        page.wait_for_function("n => window.__rusOge.S.n === n", arg=n)
        visible = page.locator("#prevTypeBtn:visible, #nextTypeBtn:visible").count()
        if visible != (0 if n == 10 else 2):
            failures.append(f"D: после перехода на №{n} видно {visible} кнопок типов")
    # На №1 и №13 остаются стрелки текстов и отдельные стрелки номеров.
    for url in ("rus_oge01.html",):
        page.goto(f"{BASE}/{url}")
        settle(page)
        page.click("#textsGrid .mode-card")
        if page.locator("#prevTypeBtn:visible, #nextTypeBtn:visible").count():
            failures.append(f"D: {url} показывает типы вместо номеров")
        first = page.evaluate("() => new URLSearchParams(location.search).get('t')")
        page.click("#nextBtnTop")
        page.click("#prevBtn")
        if page.evaluate("() => new URLSearchParams(location.search).get('t')") != first:
            failures.append(f"D: {url} стрелки текстов не вернули исходный текст")
    # №13: типы сочинения меняются в том же тексте, у каждого свой черновик.
    page.goto(f"{BASE}/rus_oge13.html")
    settle(page)
    page.click("#textsGrid .mode-card")
    text = page.evaluate("() => new URLSearchParams(location.search).get('t')")
    page.click("#prevTypeBtn")
    if page.locator(".theme.picked").get_attribute("data-k") != "2":
        failures.append("D: №13 из пустого выбора назад не открыл 13.3")
    page.fill("#essay", "Черновик для 13.3")
    page.click("#nextTypeBtn")
    if page.locator(".theme.picked").get_attribute("data-k") != "0" or page.input_value("#essay"):
        failures.append("D: №13 следующий тип не открыл чистый 13.1 по кругу")
    page.fill("#essay", "Черновик для 13.1")
    page.click("#prevTypeBtn")
    if page.input_value("#essay") != "Черновик для 13.3":
        failures.append("D: №13 потерял черновик при смене типа")
    if page.evaluate("() => new URLSearchParams(location.search).get('t')") != text:
        failures.append("D: №13 смена типа переключила текст")
    page.click("#submitBtn")
    if not all(page.is_disabled("#" + b) for b in ("prevTypeBtn", "nextTypeBtn")):
        failures.append("D: №13 сданное сочинение допускает смену типа")
    # возврат стрелкой номера на №13 открывает последний открытый текст
    page.goto(f"{BASE}/rus_oge13.html")
    settle(page)
    page.click("#textsGrid .mode-card:nth-child(3)")
    page.wait_for_timeout(300)
    last = page.evaluate("() => new URLSearchParams(location.search).get('t')")
    page.goto(f"{BASE}/rus_oge.html?n=12")
    settle(page)
    with page.expect_navigation():
        page.click("#examNextBtn")
    page.wait_for_timeout(800)
    if page.evaluate("() => new URLSearchParams(location.search).get('t')") != last:
        failures.append("D: стрелка на №13 не вернула последний открытый текст")
    ctx.close()
    print("  D: «Предыдущий/Следующий тип» — только подтемы; без подтем скрыты; ◀ ▶ заданий по кругу")


def check_phone(browser, failures, errors):
    for w in (375, 320):
        ctx = browser.new_context(viewport={"width": w, "height": 740}, is_mobile=True, has_touch=True)
        page = t54.new_page(ctx, errors)
        for url in ("rus_oge01.html", "rus_oge.html?n=2", "rus_oge.html?n=5", "rus_oge.html?n=9", "rus_oge13.html"):
            page.goto(f"{BASE}/{url}")
            settle(page)
            if url == "rus_oge01.html" or url == "rus_oge13.html":
                page.click("#textsGrid .mode-card")
            elif url.endswith(("n=5", "n=9")):
                page.click("#modesGrid .mode-card[data-tp='']")
            page.wait_for_timeout(400)
            r = page.evaluate("""() => {
              const p = document.getElementById('examPrevBtn').getBoundingClientRect();
              const n = document.getElementById('examNextBtn').getBoundingClientRect();
              const hits = [];
              document.querySelectorAll('body *').forEach(el => {
                const cs = getComputedStyle(el);
                if (cs.position !== 'fixed' || cs.display === 'none' || cs.visibility === 'hidden') return;
                const b = el.getBoundingClientRect();
                if (!b.width || b.width > 80 || b.height > 80) return;
                [p, n].forEach(a => { if (a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom) hits.push(el.id || el.className); });
              });
              return { vw: document.documentElement.clientWidth, sw: document.documentElement.scrollWidth, hits };
            }""")
            if r["sw"] > r["vw"] or r["hits"]:
                failures.append(f"E/{w}/{url}: {r}")
        ctx.close()
    print("  E: 375 и 320 px — без горизонтальной прокрутки, стрелки не под кнопками")


def run():
    failures, errors = [], []
    with t54.local_server(), sync_playwright() as p:
        browser = p.chromium.launch()
        for fn in (check_walk, check_inpage, check_geom_and_frames, check_types, check_phone):
            fn(browser, failures, errors)
        browser.close()
    if errors:
        failures.extend("ошибка JS: " + e for e in errors)
    if failures:
        print("\nПРОВАЛ:")
        for f in failures:
            print("  - " + f)
        sys.exit(1)
    print("\nГотово: всё прошло.")


if __name__ == "__main__":
    run()
