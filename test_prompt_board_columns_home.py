"""
Доски, панель «Тренажёры»: выход из тренажёра и столбики.

Проверяет:
  1. Стрелка «Ко всем тренажёрам» в тренажёре, открытом в панели, ведёт в
     список тренажёров самой панели, а не в обычную главную внутри кадра.
     Если главная всё же открылась в кадре (переход из кода) — панель тоже
     возвращается к своему списку.
  2. Кадр сам перешёл в другой тренажёр (например, из ОГЭ №6 в деление) —
     доска понимает, что открыто на самом деле: заголовок, «Добавить на
     доску» и «Обновить пример» работают с новым тренажёром. Это и была
     ошибка «Не нашли текущее задание» / «Сначала откройте задание» на
     делении в столбик после перехода через главную.
  3. ЕГЭ: стрелки между номерами меняют ?n= без перезагрузки — «Добавить»
     берёт номер из адреса.
  4. Сложение, вычитание, умножение и деление в столбик ложатся на доску
     чистой записью столбиком (а не «87 + 6 = ?» в строку и не вопросом
     шага у деления), под записью — пустое место для решения, строка
     ответа с полем и «Проверить» — справа от записи, поле живое и
     проверяет ответ. До «Начать», во время решения и у деления с остатком
     (два поля). Состояние тренажёра при снимке не меняется.
  5. Нет ошибок JavaScript.

Запуск: python3 test_prompt_board_columns_home.py (сервер поднимается сам).
Совместного режима правка не касается (тренажёр в панели к сессии не
подключается), но на сайте всё равно проверить руками.
"""
import json
import sys

from playwright.sync_api import sync_playwright

import test_prompt15_board_refresh_btn as T

T.PORT = 9141
T.BASE = f"http://127.0.0.1:{T.PORT}"
FRAME = T.FRAME
FAILS = T.FAILS
check = T.check


def frame_ready(page, file):
    page.wait_for_function(f"""() => {{ try {{ const f = {FRAME};
        return f.contentWindow.location.pathname.endsWith({json.dumps(file)}) &&
          f.contentDocument.readyState === 'complete' && typeof f.contentWindow.tsGetState === 'function'; }}
        catch (e) {{ return false; }} }}""", timeout=20000)
    page.wait_for_timeout(500)


def panel_state(page):
    return page.evaluate(f"""() => ({{ id: trainersOpenId, href: trainersOpenHref,
        title: document.getElementById('bdTrainersTitle').textContent,
        inFrame: document.getElementById('bdTrainersPanel').classList.contains('bd-trainers-in-frame'),
        src: {FRAME}.getAttribute('src'),
        listVisible: document.getElementById('bdTrainersGroups').getClientRects().length > 0 }})""")


def add_count(page):
    return page.evaluate("() => getCurrentBoard().objects.length")


def press_add(page, wait=3000):
    n0 = add_count(page)
    page.click("#bdTrainersAddBtn")
    page.wait_for_function(f"() => getCurrentBoard().objects.length > {n0} || document.getElementById('bdTrainersToast').classList.contains('show')", timeout=20000)
    page.wait_for_timeout(300)
    return add_count(page) - n0


def test_home(browser):
    ctx, page, errors = T.open_board(browser)
    T.open_trainer(page, "oge6", "oge6.html")
    # стрелка в самом тренажёре
    page.frame_locator("#bdTrainersIframe").locator("#homeBtn").click()
    page.wait_for_timeout(800)
    st = panel_state(page)
    check("1. стрелка «Ко всем тренажёрам» → список панели", not st["inFrame"] and st["id"] is None and st["listVisible"], str(st))
    check("1. обычная главная в кадр не грузилась", st["src"] == "about:blank", str(st))

    # переход на главную из кода страницы — панель тоже возвращается к списку
    T.open_trainer(page, "add_col", "addition.html")
    page.evaluate(f"() => {{ {FRAME}.contentWindow.location.href = 'index.html'; }}")
    page.wait_for_function("() => !document.getElementById('bdTrainersPanel').classList.contains('bd-trainers-in-frame')", timeout=10000)
    st = panel_state(page)
    check("1. главная, открытая в кадре из кода, → список панели", st["id"] is None and st["listVisible"], str(st))

    # кадр сам ушёл в другой тренажёр: ОГЭ №6 → деление
    T.open_trainer(page, "oge6", "oge6.html")
    page.evaluate(f"() => {{ {FRAME}.contentWindow.location.href = 'division.html'; }}")
    frame_ready(page, "division.html")
    st = panel_state(page)
    check("2. переход в кадре в деление: доска знает, что открыто деление",
          st["id"] == "div_col" and st["href"] == "division.html" and "Деление" in st["title"], str(st))
    added = press_add(page)
    check("2. «Добавить на доску» после перехода — задание легло", added == 1, T.toast(page))
    T.press_refresh(page)
    check("2. «Обновить пример» после перехода — без «Сначала откройте задание»", "Сначала" not in T.toast(page), T.toast(page))

    # даже если id устарел, а событие загрузки ещё не пришло — нажатие сверяется с адресом
    page.evaluate("() => { trainersOpenId = 'oge6'; trainersOpenHref = 'oge6.html'; }")
    added = press_add(page)
    check("2. устаревший id: «Добавить» сверяется с адресом кадра", added == 1 and page.evaluate("() => trainersOpenId") == "div_col", T.toast(page))

    # ЕГЭ: номер меняется в адресе без перезагрузки
    T.open_trainer(page, "ege1", "ege_prof.html?n=1")
    page.evaluate(f"() => {{ const w = {FRAME}.contentWindow; w.history.replaceState(null, '', 'ege_prof.html?n=7'); }}")
    page.evaluate("() => syncTrainersFrame()")
    check("3. ЕГЭ: номер из адреса кадра (?n=7)", page.evaluate("() => trainersOpenId") == "ege7", page.evaluate("() => trainersOpenId"))
    check("1–3. без ошибок JS", not errors, "; ".join(errors[:2]))
    ctx.close()


COLS = [
    ("add_col", "addition.html", "mrow"),
    ("sub_col", "subtraction.html", "mrow"),
    ("mul_col", "multiplication.html", "mrow"),
    ("div_col", "division.html", "row"),
]

LAST_JS = """() => { const o = getCurrentBoard().objects[getCurrentBoard().objects.length - 1];
  return { css: o.css, task: o.task ? { kind: o.task.kind, n: o.task.fields.length, hot: o.task.hot } : null, gen: o.gen && o.gen.node,
           html: o.gen && o.gen.html }; }"""


def column_shape(page):
    """Где на снимке стоит запись — замер по самому временному узлу (до снимка)."""
    return page.evaluate(f"""() => {{ const d = {FRAME}.contentDocument;
      const ns = collectTrainerCaptureNodes(d, trainersOpenId);
      const el = ns[0] && ns[0].el; if (!el) {{ ns.forEach(n => n.restore && n.restore()); return null; }}
      const r = el.getBoundingClientRect();
      const out = {{ id: el.id, w: r.width, h: r.height, rows: el.children.length,
        text: el.innerText.replace(/\\s+/g, ''), inBody: !!el.closest('body') }};
      ns.forEach(n => n.restore && n.restore());
      out.left = !!d.getElementById('bdColumn');
      return out; }}""")


def test_columns(browser, mid_solve=False):
    ctx, page, errors = T.open_board(browser, 1500, 950)
    for tid, href, rowcls in COLS:
        T.open_trainer(page, tid, href)
        if mid_solve:
            # «Начать» и один шаг решения: на живом листе подсветка и цифры
            T.fx(page, "var g = document.getElementById('goBtn'); if (g) g.click(); 1")
            page.wait_for_timeout(300)
        P = T.fx(page, "JSON.parse(JSON.stringify(P))")
        state_before = T.fx(page, "JSON.stringify(tsGetState())")
        shape = column_shape(page)
        label = tid + (" (во время решения)" if mid_solve else "")
        if tid == "div_col":
            want = str(P["dividend"]) + str(P["divisor"])
        elif tid == "mul_col":
            want = str(P["topVal"]) + "×" + str(P["bottomVal"])
        else:
            sign = "+" if tid == "add_col" else "−"
            want = str(P["topVal"]) + sign + str(P["bottomVal"])
        check(f"4. {label}: на снимке запись столбиком «{want}», без «= ?» и вопроса шага",
              shape and shape["text"] == want, str(shape))
        check(f"4. {label}: временный узел убран после снимка", shape and not shape["left"], str(shape))
        added = press_add(page)
        check(f"4. {label}: задание легло на доску", added == 1, T.toast(page))
        o = page.evaluate(LAST_JS)
        hot = o["task"] and o["task"]["hot"]
        ok = bool(hot and hot["fields"])
        check(f"4. {label}: живое поле ответа есть", ok, str(o["task"]))
        if ok:
            f0 = hot["fields"][0]
            last = hot["fields"][-1]
            chk = hot["check"]
            # поле справа от записи: левый край поля правее середины карточки,
            # верх — в верхней части карточки; под записью пусто
            check(f"4. {label}: строка ответа справа от записи, а не под ней",
                  f0["x"] > 0.35 and f0["y"] < 0.35 and chk and chk["x"] > f0["x"], json.dumps(hot["fields"]))
            col_h = shape["h"] if shape else 0
            card_h = o["css"]["h"]
            check(f"4. {label}: высота карточки — по записи с местом для решения, не выше",
                  abs(card_h - (col_h + 2 * o["css"]["pad"])) < 4, f"карточка {card_h}, запись {col_h}")
            check(f"4. {label}: под записью есть пустые строки для решения", shape["rows"] >= 4, str(shape))
        if tid == "div_col" and o["task"]:
            want_n = 2 if int(P["r"] or 0) > 0 else 1
            check(f"4. {label}: у деления полей столько, сколько в ответе (частное/остаток)", o["task"]["n"] == want_n, str(o["task"]["n"]))
        state_after = T.fx(page, "JSON.stringify(tsGetState())")
        check(f"4. {label}: снимок не поменял состояние тренажёра", state_before == state_after)
    # живое поле на доске проверяет ответ: сложение — вписываем сумму
    page.evaluate("() => setTrainersPanel('closed')")
    page.wait_for_timeout(400)
    check("4–5. без ошибок JS", not errors, "; ".join(errors[:2]))
    ctx.close()


def test_live_answer(browser):
    ctx, page, errors = T.open_board(browser, 1500, 950)
    T.open_trainer(page, "div_col", "division.html")
    # деление с остатком — уровень «С остатком»
    T.fx(page, "__trainerState.apply(Object.assign({}, tsGetState(), { curLevel: 3 })); __trainerState.newTask(); 1")
    page.wait_for_timeout(500)
    P = T.fx(page, "JSON.parse(JSON.stringify(P))")
    press_add(page)
    page.evaluate("() => setTrainersPanel('closed')")
    page.wait_for_timeout(500)
    o = page.evaluate("() => { const o = getCurrentBoard().objects.slice(-1)[0]; return { id: o.id, fields: o.task && o.task.fields }; }")
    inputs = page.locator("#bdTaskLayer input")
    n = inputs.count()
    check("4. деление на доске: живые поля поверх картинки", n == len(o["fields"] or []), f"{n} / {o['fields']}")
    if n:
        vals = [str(P["q"])] + ([str(P["r"])] if n > 1 else [])
        for i, v in enumerate(vals):
            inputs.nth(i).fill(v)
        page.locator("#bdTaskLayer button").filter(has_text="Проверить").first.click()
        page.wait_for_timeout(400)
        res = page.evaluate("() => { const o = getCurrentBoard().objects.slice(-1)[0]; return o.task.st && o.task.st.res; }")
        check("4. деление на доске: верный ответ засчитан", res == "ok", str(res))
    check("4. без ошибок JS", not errors, "; ".join(errors[:2]))
    ctx.close()


def main():
    with T.local_server(), sync_playwright() as p:
        browser = p.chromium.launch()
        try:
            test_home(browser)
            test_columns(browser)
            test_columns(browser, mid_solve=True)
            test_live_answer(browser)
        finally:
            browser.close()
    print()
    print("ИТОГ: " + ("всё прошло" if not FAILS else f"провалов: {len(FAILS)}"))
    sys.exit(1 if FAILS else 0)


if __name__ == "__main__":
    main()
