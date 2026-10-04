"""
Жидкое стекло на главной: меню «⋯», капсула слева, режимы «обычный»/«максимум».

Что проверяет:
- слева одна стеклянная капсула «Подборка · Доски · Работы» вместо трёх
  отдельных кнопок, значки — SVG из mathh-icons.js, не эмодзи;
- справа одна кнопка «⋯»; по нажатию раскрывается список: совместный
  доступ, тема, эффекты, сброс — с подписями; Escape и клик мимо закрывают;
- тема переключается из меню, значок и подпись меняются; если тему сменит
  session-share.js (он пишет в кнопку эмодзи) — значок возвращается;
- «Эффекты» включают «максимум»: data-fx="full" на <html>, выбор запоминается
  на устройстве, появляется плавающая подсветка, в Chromium у стекла
  включается преломление (url(#…) в backdrop-filter); выключаются обратно;
- в «максимуме» кнопки увеличиваются под курсором и капсула растёт вместе
  с ними, а при «Уменьшить движение» — нет; стекло без заливки;
- название кнопки появляется только у той, на которую навели (слева —
  подсказка у капсулы, справа — подпись в меню); на телефоне в открытом
  меню видны все подписи;
- нажатие на <canvas> временно снимает преломление (lg-paused);
- сброс прогресса из меню вызывает свой старый обработчик;
- панель совместного доступа открывается слева от капсулы и не закрывает меню;
- на телефоне левая капсула горизонтальная, страница не скроллится вбок,
  подписи меню не вылезают за экран.

Сеть наружу отрезана (как в test_prompt54): realtime отсюда не проверить,
совместный доступ здесь — только кнопка и панель.

Запуск: python3 test_prompt_glass_menu.py (сервер поднимается сам).
"""
import subprocess
import sys
import time
import contextlib
import http.client

from playwright.sync_api import sync_playwright

PORT = 8973
BASE = f"http://127.0.0.1:{PORT}"
fails = []


def check(cond, msg):
    print(("[OK]   " if cond else "[FAIL] ") + msg)
    if not cond:
        fails.append(msg)


@contextlib.contextmanager
def local_server():
    proc = subprocess.Popen([sys.executable, "-m", "http.server", str(PORT)],
                            stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    try:
        for _ in range(50):
            try:
                c = http.client.HTTPConnection("127.0.0.1", PORT, timeout=0.2)
                c.request("GET", "/index.html"); c.getresponse()
                break
            except Exception:
                time.sleep(0.1)
        yield
    finally:
        proc.terminate(); proc.wait(timeout=5)


def open_page(browser, width=1280, height=800, fx=None, reduced=False, touch=False):
    ctx = browser.new_context(viewport={"width": width, "height": height},
                              reduced_motion="reduce" if reduced else "no-preference",
                              has_touch=touch, is_mobile=touch)
    page = ctx.new_page()
    errors = []
    page.on("pageerror", lambda e: errors.append(str(e)))
    page.route("https://**/*", lambda r: r.abort())
    init = "localStorage.setItem('theme','light');"
    if fx:
        init += f"localStorage.setItem('mathh-fx','{fx}');"
    page.add_init_script(init)
    page.goto(f"{BASE}/index.html")
    page.wait_for_timeout(900)
    return ctx, page, errors


def labels(page):
    return page.evaluate("[...document.querySelectorAll('.lg-menu .lg-label')].map(e=>e.textContent.trim())")


def run():
    with local_server(), sync_playwright() as p:
        b = p.chromium.launch()

        # ── обычный режим, раскладка ──
        ctx, page, errors = open_page(b)
        check(page.evaluate("!document.documentElement.hasAttribute('data-fx')"), "по умолчанию — обычный режим")
        side = page.evaluate("""() => { const s=document.querySelector('.lg-side'); const r=s.getBoundingClientRect();
            return {n:s.querySelectorAll(':scope > a, :scope > button').length, mi:s.querySelectorAll('svg.mi').length,
                    left:r.left, top:r.top, emoji:/[\\u{1F300}-\\u{1FAFF}]/u.test(s.textContent)} }""")
        check(side["n"] == 3 and side["mi"] == 3, f"слева капсула из трёх кнопок со значками-SVG ({side})")
        check(side["left"] == 16 and side["top"] == 16, "капсула в левом верхнем углу")
        check(page.evaluate("document.querySelectorAll('.basket-toggle,.boards-toggle,.works-toggle').length") == 3,
              "кнопки сохранили свои классы (на них ссылается код страницы)")
        check(page.evaluate("!!document.querySelector('.lg-menu #themeToggle') && !!document.querySelector('.lg-menu #resetProgressBtn')"),
              "тема и сброс перенесены в меню со своими id")
        check(page.evaluate("!!document.querySelector('.lg-menu .ts-share-btn')"), "кнопка совместного доступа — в меню")
        vis = page.evaluate("getComputedStyle(document.querySelector('.lg-menu-items')).visibility")
        check(vis == "hidden", "меню закрыто: список спрятан")

        page.click("#lgMenuToggle"); page.wait_for_timeout(400)
        check(page.evaluate("document.querySelector('.lg-menu').classList.contains('is-open')")
              and page.get_attribute("#lgMenuToggle", "aria-expanded") == "true", "«⋯» открывает меню")
        check(labels(page) == ["Совместный доступ", "Тёмная тема", "Эффекты: обычные", "Сбросить прогресс"],
              f"пункты меню и подписи: {labels(page)}")
        h = page.evaluate("document.querySelector('.lg-menu-glass').getBoundingClientRect().height")
        check(h > 200, f"стекло меню вытянулось под список ({h:.0f}px)")
        check(page.evaluate("document.querySelector('#themeToggle').hasAttribute('title')") is False,
              "у кнопок меню нет системной подсказки title — есть своя подпись")

        # названия — только у кнопки под курсором
        op = "[...document.querySelectorAll('.lg-menu .lg-label')].map(e=>+getComputedStyle(e).opacity)"
        page.mouse.move(640, 500); page.wait_for_timeout(300)
        check(max(page.evaluate(op)) == 0, "с мышью подписи меню спрятаны, пока ни на что не навели")
        page.hover("#fxToggle"); page.wait_for_timeout(400)
        ops = page.evaluate(op)
        check(ops[2] == 1 and ops[0] == 0 and ops[1] == 0 and ops[3] == 0,
              f"видна подпись только у кнопки под курсором ({ops})")
        page.mouse.move(640, 500)
        top = "[...document.querySelectorAll('.lg-side .lg-tip')].map(e=>[e.textContent, +getComputedStyle(e).opacity])"
        tips0 = page.evaluate(top)
        check([t[0] for t in tips0] == ["Подборка", "Доски", "Работы"] and all(t[1] == 0 for t in tips0),
              f"у левой капсулы есть названия, спрятанные до наведения ({tips0})")
        page.hover(".works-toggle"); page.wait_for_timeout(400)
        tips1 = page.evaluate(top)
        check(tips1[2][1] == 1 and tips1[0][1] == 0 and tips1[1][1] == 0, f"название появляется у кнопки под курсором ({tips1})")
        tr = page.evaluate("document.querySelector('.works-toggle .lg-tip').getBoundingClientRect().left")
        sr = page.evaluate("document.querySelector('.lg-side').getBoundingClientRect().right")
        check(tr > sr, "название — справа от капсулы, не на ней")
        check(not page.evaluate("document.querySelector('.works-toggle').hasAttribute('title')"),
              "у кнопок капсулы убрана системная подсказка title")
        page.mouse.move(640, 500)

        # тема
        page.click("#themeToggle"); page.wait_for_timeout(200)
        check(page.evaluate("document.documentElement.getAttribute('data-theme')") == "dark", "тема переключается из меню")
        check("Светлая тема" in labels(page), "подпись темы сменилась на «Светлая тема»")
        check(page.evaluate("!!document.querySelector('#themeToggle svg.mi')"), "у темы значок-SVG, не эмодзи")
        page.evaluate("document.getElementById('themeToggle').textContent='☀️'")
        page.wait_for_timeout(100)
        check(page.evaluate("!!document.querySelector('#themeToggle svg.mi')"),
              "эмодзи от session-share.js сразу заменяется обратно на значок")
        check(page.evaluate("document.querySelector('.lg-menu').classList.contains('is-open')"), "после смены темы меню не закрылось")

        # Escape и клик мимо
        page.keyboard.press("Escape"); page.wait_for_timeout(100)
        check(not page.evaluate("document.querySelector('.lg-menu').classList.contains('is-open')"), "Escape закрывает меню")
        page.click("#lgMenuToggle"); page.wait_for_timeout(200)
        page.click("h1"); page.wait_for_timeout(200)
        check(not page.evaluate("document.querySelector('.lg-menu').classList.contains('is-open')"), "клик мимо закрывает меню")

        # сброс — старый обработчик
        msgs = []
        page.on("dialog", lambda d: (msgs.append(d.message), d.accept()))
        page.click("#lgMenuToggle"); page.wait_for_timeout(200)
        page.click("#resetProgressBtn"); page.wait_for_timeout(200)
        check(any("Прогресс уже пуст" in m for m in msgs), "сброс прогресса из меню работает по-старому")

        # совместный доступ: панель слева от капсулы, меню не закрывается
        page.click("#lgMenuToggle"); page.wait_for_timeout(300)
        page.click(".lg-menu .ts-share-btn"); page.wait_for_timeout(300)
        pop = page.evaluate("""() => { const p=document.querySelector('.ts-share-pop'), m=document.querySelector('.lg-menu-glass');
            return {open:p.classList.contains('open'), right:p.getBoundingClientRect().right, menuLeft:m.getBoundingClientRect().left,
                    menuOpen:document.querySelector('.lg-menu').classList.contains('is-open')} }""")
        check(pop["open"] and pop["menuOpen"], "панель совместного доступа открылась, меню осталось открытым")
        check(pop["right"] <= pop["menuLeft"], "панель совместного доступа не налезает на капсулу меню")
        page.click(".ts-share-pop .ts-share-title"); page.wait_for_timeout(150)
        check(page.evaluate("document.querySelector('.lg-menu').classList.contains('is-open')"),
              "клик внутри панели совместного доступа не закрывает меню")
        check(not errors, f"нет ошибок JavaScript ({errors[:2]})")
        ctx.close()

        # ── «максимум» ──
        ctx, page, errors = open_page(b)
        page.click("#lgMenuToggle"); page.wait_for_timeout(300)
        page.click("#fxToggle"); page.wait_for_timeout(700)
        check(page.evaluate("document.documentElement.getAttribute('data-fx')") == "full", "«Эффекты» включают максимум")
        check(page.evaluate("localStorage.getItem('mathh-fx')") == "full", "выбор запомнен на устройстве")
        check("Эффекты: максимум" in labels(page) and page.get_attribute("#fxToggle", "aria-pressed") == "true",
              "подпись и состояние кнопки эффектов обновились")
        check(page.evaluate("!!document.querySelector('.lg-ambient')"), "появилась плавающая подсветка фона")
        ready = page.evaluate("document.querySelectorAll('.lg-r-ready').length")
        bf = page.evaluate("getComputedStyle(document.querySelector('.lg-side .lg-glass')).backdropFilter")
        check(ready >= 5 and "url(" in bf, f"в Chromium включилось преломление ({ready} элементов, {bf})")
        page.wait_for_timeout(300)
        bg = page.evaluate("getComputedStyle(document.querySelector('.lg-side .lg-glass')).backgroundColor")
        check(bg in ("rgba(0, 0, 0, 0)", "transparent"), f"стекло в максимуме без заливки ({bg})")
        topic_bf = page.evaluate("getComputedStyle(document.querySelector('.topic')).backdropFilter")
        check("url(" in topic_bf, "преломляют и панели страницы (список тем)")
        # список тем пересоздаётся при смене вкладки — новые панели тоже стеклянные
        page.keyboard.press("Escape")
        page.click("#mainTabs .nav-tab:nth-child(2)"); page.wait_for_timeout(500)
        check(page.evaluate("[...document.querySelectorAll('.topic')].every(t => t.classList.contains('lg-r'))"),
              "после смены вкладки новые панели тоже преломляют")

        # увеличение под курсором
        r = page.evaluate("(()=>{const e=document.querySelector('.boards-toggle').getBoundingClientRect();return [e.left+e.width/2,e.top+e.height/2]})()")
        page.mouse.move(r[0], r[1]); page.wait_for_timeout(250)
        mag = page.evaluate("parseFloat(document.querySelector('.boards-toggle').style.getPropertyValue('--lg-mag'))")
        mag_n = page.evaluate("parseFloat(document.querySelector('.works-toggle').style.getPropertyValue('--lg-mag'))")
        check(mag > 1.25 and 1 < mag_n < mag, f"кнопка под курсором увеличилась сильнее соседней ({mag}, {mag_n})")
        sz = page.evaluate("[document.querySelector('.boards-toggle').getBoundingClientRect().width, document.querySelector('.lg-side').getBoundingClientRect().width, document.querySelector('.lg-side .lg-glass').getBoundingClientRect().width]")
        check(sz[0] > 50 and sz[1] >= sz[0] + 6 and abs(sz[2] - sz[1]) < 1,
              f"капсула и её стекло растут вместе с кнопкой ({sz})")
        page.mouse.move(640, 500); page.wait_for_timeout(200)
        check(page.evaluate("document.querySelector('.boards-toggle').style.getPropertyValue('--lg-mag')") == "",
              "курсор ушёл — кнопки вернулись к обычному размеру")

        # упругое нажатие — на «⋯»: ссылки капсулы увели бы со страницы
        r2 = page.evaluate("(()=>{const e=document.querySelector('#lgMenuToggle').getBoundingClientRect();return [e.left+e.width/2,e.top+e.height/2]})()")
        page.mouse.move(r2[0], r2[1]); page.mouse.down(); page.wait_for_timeout(60)
        pressing = page.evaluate("document.querySelector('#lgMenuToggle').classList.contains('lg-pressing')")
        ripple = page.evaluate("!!document.querySelector('#lgMenuToggle .lg-ripple')")
        page.mouse.up(); page.wait_for_timeout(60)
        jelly = page.evaluate("document.querySelector('#lgMenuToggle').classList.contains('lg-jelly')")
        check(pressing and ripple and jelly, "нажатие: кнопка сжимается, вспыхивает свет и пружинит обратно")
        page.keyboard.press("Escape")

        # рисование на холсте снимает преломление
        page.evaluate("""() => { const c=document.createElement('canvas'); c.id='tcv';
            c.style.cssText='position:fixed;left:300px;top:300px;width:200px;height:200px;z-index:999'; document.body.appendChild(c); }""")
        page.mouse.move(400, 400); page.mouse.down(); page.wait_for_timeout(50)
        check(page.evaluate("document.documentElement.classList.contains('lg-paused')"), "пока рисуют на холсте — преломление снято")
        bf_paused = page.evaluate("getComputedStyle(document.querySelector('.topic')).backdropFilter")
        check("url(" not in bf_paused, "во время штриха у стекла обычное размытие")
        page.mouse.up(); page.wait_for_timeout(500)
        check(not page.evaluate("document.documentElement.classList.contains('lg-paused')"), "после штриха преломление вернулось")

        # выбор сохраняется после перезагрузки
        page.reload(); page.wait_for_timeout(900)
        check(page.evaluate("document.documentElement.getAttribute('data-fx')") == "full", "после перезагрузки остаётся максимум")
        page.click("#lgMenuToggle"); page.wait_for_timeout(300)
        page.click("#fxToggle"); page.wait_for_timeout(300)
        check(page.evaluate("!document.documentElement.hasAttribute('data-fx')")
              and page.evaluate("document.querySelectorAll('.lg-r-ready').length") == 0
              and "url(" not in page.evaluate("getComputedStyle(document.querySelector('.topic')).backdropFilter"),
              "выключение возвращает обычное стекло без преломления")
        check(not errors, f"нет ошибок JavaScript в максимуме ({errors[:2]})")
        ctx.close()

        # ── «Уменьшить движение» ──
        ctx, page, errors = open_page(b, fx="full", reduced=True)
        r = page.evaluate("(()=>{const e=document.querySelector('.boards-toggle').getBoundingClientRect();return [e.left+e.width/2,e.top+e.height/2]})()")
        page.mouse.move(r[0], r[1]); page.wait_for_timeout(200)
        check(page.evaluate("document.querySelector('.boards-toggle').style.getPropertyValue('--lg-mag')") == "",
              "при «Уменьшить движение» кнопки не увеличиваются")
        check(page.evaluate("getComputedStyle(document.querySelector('.lg-ambient i')).animationName") == "none",
              "при «Уменьшить движение» подсветка фона не плавает")
        ctx.close()

        # ── телефон ──
        ctx, page, errors = open_page(b, width=390, height=800, touch=True)
        check(page.evaluate("getComputedStyle(document.querySelector('.lg-side')).flexDirection") == "row",
              "на телефоне левая капсула горизонтальная")
        check(page.evaluate("document.documentElement.scrollWidth") <= 390, "на телефоне нет прокрутки вбок")
        page.click("#lgMenuToggle"); page.wait_for_timeout(500)
        lmin = page.evaluate("Math.min(...[...document.querySelectorAll('.lg-menu .lg-label')].map(e=>e.getBoundingClientRect().left))")
        check(lmin >= 0, f"подписи меню помещаются на экране телефона (левый край {lmin:.0f})")
        check(min(page.evaluate("[...document.querySelectorAll('.lg-menu .lg-label')].map(e=>+getComputedStyle(e).opacity)")) == 1,
              "на телефоне (без наведения) в открытом меню видны все подписи")
        h1 = page.evaluate("document.querySelector('h1').getBoundingClientRect().top")
        side_bottom = page.evaluate("document.querySelector('.lg-side').getBoundingClientRect().bottom")
        check(side_bottom <= h1, "капсула не налезает на заголовок")
        check(not errors, f"нет ошибок JavaScript на телефоне ({errors[:2]})")
        ctx.close()
        b.close()

    print()
    if fails:
        print("ПРОВАЛЫ:\n- " + "\n- ".join(fails))
        sys.exit(1)
    print("ИТОГ: всё прошло")


if __name__ == "__main__":
    run()
