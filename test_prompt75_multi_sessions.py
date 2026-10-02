"""
Промпт №75: несколько независимых совместных сессий в одном браузере.

Учитель ведёт параллельные занятия с одного компьютера: у каждой вкладки своя
сессия со своим кодом, и она держится на любых переходах внутри вкладки.

Проверяем:
  A. Первая вкладка — «Сессия 1». «＋ Новая сессия» открывает новую вкладку
     с новым кодом («Сессия 2»), там сразу открыта панель; код первой не меняется.
  B. Переходы внутри вкладок (ОГЭ, ЕГЭ, основы, доски, главная, перезагрузка)
     не меняют код, вкладки не смешиваются.
  C. Ученики: у каждой сессии свой ученик, переход учителя в одной вкладке
     уводит только своего ученика.
  D. Подборка своя у каждой сессии; старая общая подборка переезжает в одну.
  E. Переименование по клику на имя: имя в списке, в заголовке вкладки, у соседей.
  F. «Перейти» на открытую сессию из той же «семьи» вкладок — переключение без
     новой вкладки; из чужой — заголовок нужной вкладки мигает.
  G. Закрытая вкладка: в списке «закрыта», «Открыть» возвращает её на ту же
     страницу, с тем же кодом, именем и состоянием задания.
  H. Дубль вкладки (скопированный код и номер участника) заводит свою сессию.
  I. «Сменить код» оставляет имя и подборку.
  J. Новая вкладка, открытая вручную, не перехватывает сессию соседней.

Живой realtime из песочницы недоступен — заглушка Supabase из теста №54
(BroadcastChannel + localStorage). На сайте совместный режим — руками.

Запуск: python3 test_prompt75_multi_sessions.py
"""
import contextlib
import http.client
import subprocess
import sys
import time

from playwright.sync_api import sync_playwright

import test_prompt54_trainer_sync_and_cards as t54
from test_prompt11_shared_screen import PARTICIPANT_STORAGE

PORT = 8991
BASE = f"http://127.0.0.1:{PORT}"
failures, errors = [], []


def check(name, ok, detail=""):
    print(("  ok   " if ok else "  FAIL ") + name + ("" if ok else f"  [{detail}]"))
    if not ok:
        failures.append(f"{name}: {detail}")


@contextlib.contextmanager
def local_server():
    proc = subprocess.Popen([sys.executable, "-m", "http.server", str(PORT)],
                            stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
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


def setup_context(ctx):
    # маршруты — на весь контекст: вкладки, открытые кнопкой (window.open),
    # иначе пошли бы в настоящую базу (см. «Грабли», тест №64)
    ctx.route("**/supabase-js.umd.js", lambda r: r.fulfill(
        status=200, content_type="application/javascript", body=t54.FAKE_LIB))
    ctx.route("**/fonts.googleapis.com/**", lambda r: r.abort())
    ctx.route("**/fonts.gstatic.com/**", lambda r: r.abort())
    ctx.route("https://**/*", lambda r: r.abort())
    ctx.add_init_script("window.__fakeLatency = 0; window.__fakeSelectDelay = 0;")
    ctx.on("page", lambda p: p.on("pageerror", lambda e: errors.append(f"{p.url}: {e}")))


def code_of(page, timeout=10000):
    page.wait_for_function("() => window.TrainerSession && window.TrainerSession.getCode()", timeout=timeout)
    return page.evaluate("() => window.TrainerSession.getCode()")


def wait_code(page, expect, timeout=10000):
    page.wait_for_function("(c) => window.TrainerSession && window.TrainerSession.getCode() === c",
                           arg=expect, timeout=timeout)


def goto(page, path):
    page.goto(BASE + "/" + path)
    page.wait_for_load_state("domcontentloaded")


def open_panel(page):
    if not page.evaluate("() => document.querySelector('.ts-share-pop').classList.contains('open')"):
        page.click(".ts-share-btn")
    page.wait_for_timeout(450)   # опрос вкладок (250 мс) + отрисовка


def close_panel(page):
    page.evaluate("() => document.querySelector('.ts-share-pop').classList.remove('open')")


def rows(page):
    return page.evaluate("""() => Array.from(document.querySelectorAll('#tsSessList .ts-sess-row')).map(r => ({
        code: r.dataset.code, name: (r.querySelector('.ts-sess-name') || {}).textContent || '',
        here: r.classList.contains('here'), on: r.querySelector('.ts-sess-dot').classList.contains('on'),
        go: (r.querySelector('.ts-sess-go') || {}).textContent || '', sub: r.querySelector('.ts-sess-sub').textContent }))""")


def reg(page):
    return page.evaluate("() => JSON.parse(localStorage.getItem('tsSessions:v1') || '[]')")


def student(ctx, tag, url):
    p = ctx.new_page()
    p.add_init_script(PARTICIPANT_STORAGE % repr(tag + ":"))
    p.add_init_script("try { localStorage.setItem('" + tag + ":tsStage:pref', 'off'); } catch (e) {}")
    p.goto(url)
    return p


def run():
    with local_server(), sync_playwright() as pw:
        browser = pw.chromium.launch()
        ctx = browser.new_context(viewport={"width": 1280, "height": 860})
        setup_context(ctx)
        # старая общая подборка от прежней версии
        ctx.add_init_script("""try { if (location.pathname.endsWith('index.html') && !localStorage.getItem('seededOnce')) {
            localStorage.setItem('ogeBasket:v1', JSON.stringify([{id:'legacy', text:'старое'}]));
            localStorage.setItem('seededOnce', '1'); } } catch (e) {}""")

        print("A. Новая сессия в новой вкладке")
        t1 = ctx.new_page()
        goto(t1, "index.html")
        a = code_of(t1)
        open_panel(t1)
        r = rows(t1)
        check("A1 первая вкладка — «Сессия 1», отмечена как эта", len(r) == 1 and r[0]["name"] == "Сессия 1" and r[0]["here"], r)
        with ctx.expect_page() as pinfo:
            t1.click("#tsNewSess")
        t2 = pinfo.value
        t2.wait_for_load_state("domcontentloaded")
        b = code_of(t2)
        check("A2 у новой вкладки свой код", b and b != a, (a, b))
        check("A3 метка tsnew убрана из адреса", "tsnew" not in t2.url, t2.url)
        t2.wait_for_function("() => document.querySelector('.ts-share-pop').classList.contains('open')", timeout=5000)
        check("A4 в новой вкладке сразу открыта панель с кодом",
              t2.evaluate("() => document.getElementById('tsCode').textContent") == b)
        check("A5 у первой код прежний", t1.evaluate("() => TrainerSession.getCode()") == a)
        check("A6 вторая — «Сессия 2»", t2.evaluate("() => TrainerSession.getSessionName()") == "Сессия 2",
              t2.evaluate("() => TrainerSession.getSessionName()"))
        check("A7 номер участника у новой вкладки свой",
              t1.evaluate("() => sessionStorage.getItem('tsClientId')") != t2.evaluate("() => sessionStorage.getItem('tsClientId')"))
        check("A8 «семья» вкладок общая",
              t1.evaluate("() => sessionStorage.getItem('tsTab:group')") == t2.evaluate("() => sessionStorage.getItem('tsTab:group')"))
        check("A9 имя окна — по коду", t2.evaluate("() => window.name") == "tsSess:" + b)
        open_panel(t1)
        r = rows(t1)
        check("A10 в первой вкладке видны обе сессии, обе открыты",
              [x["code"] for x in r] == [a, b] and all(x["on"] for x in r) and r[1]["go"] == "Перейти", r)
        close_panel(t1)
        t1.wait_for_timeout(300)
        check("A11 при двух сессиях в заголовке имя", t1.title().startswith("Сессия 1 · "), t1.title())

        print("B. Переходы внутри вкладок")
        for path in ["oge8.html", "ege_prof.html?n=4", "addition.html", "boards.html", "oge6.html", "index.html"]:
            goto(t2, path)
            ok = True
            try:
                wait_code(t2, b)
            except Exception:
                ok = False
            check("B вкладка 2 на " + path + " — та же сессия", ok, t2.evaluate("() => window.TrainerSession && TrainerSession.getCode()"))
        for path in ["oge9.html", "linear.html"]:
            goto(t1, path)
            ok = True
            try:
                wait_code(t1, a)
            except Exception:
                ok = False
            check("B вкладка 1 на " + path + " — та же сессия", ok)
        t1.reload()
        wait_code(t1, a)
        check("B перезагрузка оставляет код", True)

        print("C. У каждой сессии свой ученик")
        goto(t1, "oge8.html"); wait_code(t1, a)
        goto(t2, "oge9.html"); wait_code(t2, b)
        s1 = student(ctx, "S1", f"{BASE}/oge8.html?s={a}")
        s2 = student(ctx, "S2", f"{BASE}/oge9.html?s={b}")
        wait_code(s1, a)
        wait_code(s2, b)
        t1.wait_for_timeout(600)
        t1.evaluate("() => TrainerSession.navigateTo('oge6')")
        s1.wait_for_url("**/oge6.html*", timeout=8000)
        wait_code(t1, a)
        s2.wait_for_timeout(800)
        check("C1 ученик 1 ушёл за своим учителем", "oge6.html" in s1.url, s1.url)
        check("C2 ученик 2 остался на месте", "oge9.html" in s2.url, s2.url)
        t2.evaluate("() => TrainerSession.navigateTo('linear')")
        s2.wait_for_url("**/linear.html*", timeout=8000)
        wait_code(t2, b)
        s1.wait_for_timeout(800)
        check("C3 ученик 2 ушёл за вторым учителем", "linear.html" in s2.url, s2.url)
        check("C4 ученик 1 остался", "oge6.html" in s1.url, s1.url)
        check("C5 ученики остаются в своих сессиях",
              s1.evaluate("() => TrainerSession.getCode()") == a and s2.evaluate("() => TrainerSession.getCode()") == b)
        check("C6 ученик в список сессий не попадает", not any(x.get("code") == "x" for x in reg(t1)) and len(reg(t1)) == 2, reg(t1))
        s1.close(); s2.close()

        print("D. Подборка своя у каждой сессии")
        n1 = t1.evaluate("() => Basket.all().map(x => x.id)")
        n2 = t2.evaluate("() => Basket.all().map(x => x.id)")
        check("D1 старая общая подборка уехала ровно в одну сессию",
              (n1 == ["legacy"]) != (n2 == ["legacy"]) and t1.evaluate("() => localStorage.getItem('ogeBasket:v1')") is None, (n1, n2))
        t1.evaluate("() => Basket.clear()"); t2.evaluate("() => Basket.clear()")
        t1.evaluate("() => Basket.add({text: 'Ване'})")
        t2.evaluate("() => { Basket.add({text: 'Пете'}); Basket.add({text: 'Пете 2'}); }")
        check("D2 у первой — своё", t1.evaluate("() => Basket.all().map(x => x.text)") == ["Ване"])
        check("D3 у второй — своё", t2.evaluate("() => Basket.all().map(x => x.text)") == ["Пете", "Пете 2"])
        goto(t2, "index.html"); wait_code(t2, b)
        check("D4 подборка держится на переходе", t2.evaluate("() => Basket.count()") == 2)

        print("E. Переименование")
        open_panel(t2)
        t2.click(f"#tsSessList .ts-sess-row[data-code='{b}'] .ts-sess-name")
        t2.fill("#tsSessList .ts-sess-input", "Петя")
        t2.keyboard.press("Enter")
        t2.wait_for_timeout(200)
        check("E1 имя в списке", any(x["name"] == "Петя" and x["here"] for x in rows(t2)), rows(t2))
        close_panel(t2)
        check("E2 имя в заголовке своей вкладки", t2.title().startswith("Петя · "), t2.title())
        t1.wait_for_timeout(300)
        open_panel(t1)
        check("E3 соседняя вкладка видит новое имя", any(x["name"] == "Петя" and x["code"] == b for x in rows(t1)), rows(t1))
        # Esc — отмена
        t1.click(f"#tsSessList .ts-sess-row[data-code='{a}'] .ts-sess-name")
        t1.fill("#tsSessList .ts-sess-input", "что-то")
        t1.keyboard.press("Escape")
        check("E4 Esc не переименовывает", t1.evaluate("() => TrainerSession.getSessionName()") == "Сессия 1")
        t1.click(f"#tsSessList .ts-sess-row[data-code='{a}'] .ts-sess-name")
        t1.fill("#tsSessList .ts-sess-input", "Ваня")
        t1.click(".ts-share-title")   # уход фокуса — сохранить
        t1.wait_for_timeout(200)
        check("E5 потеря фокуса сохраняет имя", t1.evaluate("() => TrainerSession.getSessionName()") == "Ваня")

        print("F. Переключение на открытую вкладку")
        pages_before = len(ctx.pages)
        open_panel(t1)
        t1.click(f"#tsSessList .ts-sess-row[data-code='{b}'] .ts-sess-go")
        t1.wait_for_timeout(300)
        check("F1 переключение на ту же вкладку, без новой",
              t1.evaluate("() => window.__tsSwitchResult") == "focused" and len(ctx.pages) == pages_before,
              (t1.evaluate("() => window.__tsSwitchResult"), len(ctx.pages), pages_before))
        close_panel(t1)

        print("J. Вкладка, открытая вручную")
        t3 = ctx.new_page()
        goto(t3, "index.html")
        c = code_of(t3)
        check("J1 ручная вкладка не перехватывает чужую сессию", c not in (a, b), (a, b, c))
        check("J2 и получает следующий номер", t3.evaluate("() => TrainerSession.getSessionName()") == "Сессия 3",
              t3.evaluate("() => TrainerSession.getSessionName()"))
        check("J3 своя «семья» (не открыта кнопкой)",
              t3.evaluate("() => sessionStorage.getItem('tsTab:group')") != t1.evaluate("() => sessionStorage.getItem('tsTab:group')"))
        # в безголовом браузере все вкладки «в фокусе» — а мигает вкладка,
        # на которую ещё не переключились. Изображаем её фоновой
        t1.evaluate("() => { document.hasFocus = () => false; }")
        open_panel(t3)
        pages_before = len(ctx.pages)
        t3.click(f"#tsSessList .ts-sess-row[data-code='{a}'] .ts-sess-go")
        t3.wait_for_timeout(1400)
        check("F2 из чужой семьи — нужная вкладка мигает, новых нет",
              t3.evaluate("() => window.__tsSwitchResult") == "flash" and len(ctx.pages) == pages_before
              and "мигает" in t3.evaluate("() => document.getElementById('tsSessMsg').textContent"),
              (t3.evaluate("() => window.__tsSwitchResult"), len(ctx.pages)))
        seen = t1.evaluate("""() => new Promise(res => { const seen = new Set([document.title]);
            const t = setInterval(() => seen.add(document.title), 100);
            setTimeout(() => { clearInterval(t); res(Array.from(seen)); }, 1500); })""")
        check("F3 заголовок вкладки «Ваня» мигает", any(s.startswith("● Ваня — сюда") for s in seen), seen)
        close_panel(t3)
        t3.close()

        print("G. Закрытая вкладка открывается там же")
        goto(t2, "oge8.html"); wait_code(t2, b)
        t2.wait_for_timeout(500)
        # задание на странице: запомним, что именно открыто
        t2.evaluate("() => TrainerSession.push()")
        t2.wait_for_timeout(600)
        url_b = t2.url
        task_b = t2.evaluate("() => JSON.stringify(window.tsGetState ? tsGetState() : null)")
        t2.close()
        t1.wait_for_timeout(300)
        open_panel(t1)
        rb = [x for x in rows(t1) if x["code"] == b]
        check("G1 сессия Пети — закрыта, кнопка «Открыть»", rb and not rb[0]["on"] and rb[0]["go"] == "Открыть", rows(t1))
        with ctx.expect_page() as pinfo:
            t1.click(f"#tsSessList .ts-sess-row[data-code='{b}'] .ts-sess-go")
        t2b = pinfo.value
        t2b.wait_for_load_state("domcontentloaded")
        wait_code(t2b, b)
        check("G2 открылась та же страница", t2b.url.split("?")[0] == url_b.split("?")[0] and "tsresume" not in t2b.url, (t2b.url, url_b))
        check("G3 то же имя", t2b.evaluate("() => TrainerSession.getSessionName()") == "Петя")
        check("G4 та же подборка", t2b.evaluate("() => Basket.count()") == 2)
        t2b.wait_for_timeout(800)
        task_b2 = t2b.evaluate("() => JSON.stringify(window.tsGetState ? tsGetState() : null)")
        check("G5 то же состояние тренажёра", task_b == task_b2, (task_b[:200] if task_b else task_b, task_b2[:200] if task_b2 else task_b2))
        close_panel(t1)
        t1.wait_for_timeout(200)
        open_panel(t1)
        rb = [x for x in rows(t1) if x["code"] == b]
        check("G6 снова «открыта»", rb and rb[0]["on"] and rb[0]["go"] == "Перейти", rows(t1))
        pages_before = len(ctx.pages)
        t1.click(f"#tsSessList .ts-sess-row[data-code='{b}'] .ts-sess-go")
        t1.wait_for_timeout(300)
        check("G7 на переоткрытую — переключение без новой вкладки",
              t1.evaluate("() => window.__tsSwitchResult") == "focused" and len(ctx.pages) == pages_before)
        close_panel(t1)

        print("H. Дубль вкладки")
        cid1 = t1.evaluate("() => sessionStorage.getItem('tsClientId')")
        grp1 = t1.evaluate("() => sessionStorage.getItem('tsTab:group')")
        dup = ctx.new_page()
        dup.add_init_script(f"""try {{ if (location.protocol === 'http:' && !sessionStorage.getItem('dupDone')) {{ sessionStorage.setItem('dupDone','1');
            sessionStorage.setItem('tsTab:code', '{a}'); sessionStorage.setItem('tsTab:role', 'leader');
            sessionStorage.setItem('tsClientId', '{cid1}'); sessionStorage.setItem('tsTab:group', '{grp1}'); }} }} catch (e) {{}}""")
        goto(dup, "linear.html")
        d = code_of(dup)
        check("H1 дубль заводит свою сессию", d not in (a, b), (a, b, d))
        check("H2 номер участника у дубля свой", dup.evaluate("() => sessionStorage.getItem('tsClientId')") != cid1)
        check("H3 у оригинала код прежний", t1.evaluate("() => TrainerSession.getCode()") == a)
        dup.close()

        print("I. Сменить код")
        t2b.evaluate("() => Basket.add({text:'Пете 3'})")
        open_panel(t2b)
        t2b.click("#tsReset")
        t2b.wait_for_function("(b) => TrainerSession.getCode() && TrainerSession.getCode() !== b", arg=b, timeout=8000)
        nb = t2b.evaluate("() => TrainerSession.getCode()")
        check("I0 подборка видна сразу после нажатия", t2b.evaluate("() => Basket.count()") == 3)
        t2b.wait_for_function("(c) => window.name === 'tsSess:' + c", arg=nb, timeout=8000)
        check("I1 имя осталось", t2b.evaluate("() => TrainerSession.getSessionName()") == "Петя")
        check("I2 подборка переехала", t2b.evaluate("() => Basket.count()") == 3)
        check("I3 в списке одна запись Пети, со старым кодом её нет",
              [e["code"] for e in reg(t1) if e.get("name") == "Петя"] == [nb], reg(t1))
        check("I4 имя окна — по новому коду", t2b.evaluate("() => window.name") == "tsSess:" + nb)

        browser.close()


if __name__ == "__main__":
    run()
    if errors:
        print("\nОшибки JavaScript:")
        for e in errors:
            print("  " + e)
    print()
    if failures or errors:
        print(f"ИТОГ: {len(failures)} провалов, {len(errors)} ошибок JS")
        sys.exit(1)
    print("ИТОГ: всё прошло")
