"""
«„импорт на виду и гайд“» (04.11.2026): кнопка «Импорт» в верхней строке
презентации, гайд HTML-презентаций (deck-guide.md + deck-guide.html),
разметка по гайду в импорте, таблицы, шрифты доски (HANDOFF.md раздел 6г).

Проверяем:
  1. У презентации в верхней строке — «Импорт», у обычной доски его нет;
     меню: «PowerPoint или PDF» и «HTML» с «Гайд (и для нейросети)» рядом;
     «HTML» открывает выбор только .html, «PowerPoint или PDF» — .pptx и .pdf;
     из гайда «← К презентации» — назад во вкладку презентации (или в неё
     же, если вкладки нет), чужой адрес в from не принимается
  2. Страница гайда: гайд показан, образец достаётся из гайда; тема — как
     на сайте (не системная), кнопка темы переключает и запоминает
  3. Образец из гайда «полностью»: «✓ Разметка по гайду», 3 слайда 16:9,
     заметки у своих слайдов, служебная кнопка data-deck-ui не попала,
     шапка — надписью, список — с маркерами, таблица — таблицей доски
     (2 × 5, шапка своим цветом), шрифт Montserrat — свой у доски;
     карточка «Запомни» — шаг 1 анимации по щелчку
  4. Кадр 4K по разметке: окно говорит 3840 × 2160, слайд 16:9 обычного
     размера, панель автора не на слайде, снимок «картинками» — 3840 px
  5. Книжный А4 по разметке: слайд книжный в пропорции 1240 : 1754
  6. Файл без разметки — предупреждение и ссылка на гайд
  7. Шрифты гайда (19) — у доски свои, файлы на месте
  8. Нет ошибок на странице

Запуск: python3 test_prompt_deck_guide.py
"""
import os
import re
import sys
import tempfile

from playwright.sync_api import sync_playwright

import test_prompt84_deck_slides as T
from test_prompt98_deck_import import do_import, SLIDE

T.PORT = 8995
T.BASE = f"http://127.0.0.1:{T.PORT}"
HERE = os.path.dirname(os.path.abspath(__file__))
F = lambda n: os.path.join(HERE, "test-files", n)
fails = []
GUIDE_FONTS = ["Unbounded", "Montserrat", "Inter", "Roboto", "Open Sans", "Manrope", "Nunito", "Rubik", "Comfortaa",
               "Lora", "Playfair Display", "Caveat", "PT Sans", "PT Serif", "Arial", "Times New Roman", "Calibri", "Cambria", "Courier New"]


def check(cond, msg, extra=""):
    print(("OK   " if cond else "FAIL ") + msg + (f"  [{extra}]" if extra and not cond else ""))
    if not cond:
        fails.append(msg)


def boxes(objs):
    return [o for o in objs if o["type"] == "box" and o.get("text")]


def find(objs, start):
    return next((o for o in boxes(objs) if (o["plain"] or "").startswith(start)), None)


def main():
    errors = []
    md = open(os.path.join(HERE, "deck-guide.md"), encoding="utf-8").read()
    sample = re.search(r"```html\n([\s\S]*?)```", md).group(1)
    tmp = tempfile.mkdtemp()
    sample_path = os.path.join(tmp, "deck-sample.html")
    open(sample_path, "w", encoding="utf-8").write(sample)

    with T.local_server(), sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page(viewport={"width": 1400, "height": 900})
        page.on("pageerror", lambda e: errors.append(str(e)))

        print("2. Страница гайда")
        page.goto(T.BASE + "/deck-guide.html")
        page.wait_for_selector("#doc h1", timeout=10000)
        check("HTML-презентации" in page.inner_text("#doc h1"), "гайд показан", page.inner_text("#doc h1"))
        check(page.locator("#doc table").count() >= 1 and page.locator("#doc pre").count() >= 1, "таблица размеров и образец кода на странице")
        # тема — сайта, а не системы: светлая на сайте → светлый гайд, кнопка меняет и запоминает
        page.emulate_media(color_scheme="dark")
        page.evaluate("() => localStorage.setItem('theme', 'light')")
        page.reload()
        page.wait_for_selector("#doc h1")
        bg = page.evaluate("() => getComputedStyle(document.body).backgroundColor")
        check(page.evaluate("() => document.documentElement.dataset.theme") == "light" and bg == "rgb(238, 241, 247)", "при светлой теме сайта гайд светлый (хотя система тёмная)", bg)
        page.click("#themeToggle")
        check(page.evaluate("() => [document.documentElement.dataset.theme, localStorage.getItem('theme'), getComputedStyle(document.body).backgroundColor]") == ["dark", "dark", "rgb(11, 14, 26)"], "кнопка темы — тёмная и запомнена")
        page.click("#themeToggle")
        page.emulate_media(color_scheme="light")
        smp = page.evaluate("() => sample()")
        check('<meta name="deck" content="1920x1080">' in smp and smp.count("data-deck-slide>") == 3, "«Скачать образец» берёт образец из гайда")

        page.goto(T.BASE + "/boards.html")
        page.evaluate(T.BOOT_JS)

        print("1. Кнопка «Импорт»")
        page.click("#blCreateDeck")
        page.wait_for_function("() => B && B.kind === 'deck' && boardActive")
        check(page.is_visible("#deckImpBtn") and "Импорт" in page.inner_text("#deckImpBtn"), "у презентации в верхней строке «Импорт»")
        page.click("#deckImpBtn")
        page.wait_for_selector("#deckImpMenu:not([hidden])")
        items = page.eval_on_selector_all("#deckImpMenu [data-imp]", "els => els.map(e => [e.dataset.imp, e.innerText.replace(/\\s+/g, ' ').trim()])")
        check([i[0] for i in items] == ["office", "html"] and "PowerPoint или PDF" in items[0][1] and "HTML" in items[1][1], "пункты «PowerPoint или PDF» и «HTML»", str(items))
        g = page.eval_on_selector("#deckImpGuide", "e => [e.getAttribute('href'), e.innerText.replace(/\\s+/g, ' ').trim()]")
        check(g[0] == "deck-guide.html" and "Гайд" in g[1] and "нейросети" in g[1], "рядом с HTML — «Гайд (и для нейросети)»", str(g))
        # какие файлы предлагает выбор: открытие окна выбора подменяем
        page.evaluate("() => { const i = document.getElementById('deckImportFile'); window.__acc = []; i.click = () => window.__acc.push(i.accept); }")
        page.click("#deckImpMenu [data-imp='html']")
        page.click("#deckImpBtn")
        page.click("#deckImpMenu [data-imp='office']")
        acc = page.evaluate("() => window.__acc")
        check(len(acc) == 2 and acc[0].startswith(".html") and ".pdf" not in acc[0] and ".pptx" in acc[1] and ".html" not in acc[1], "HTML — только .html, PowerPoint или PDF — .pptx и .pdf", str(acc))
        check(page.is_hidden("#deckImpMenu"), "меню закрылось")
        page.evaluate("() => deckIoEnsure()")

        print("1б. Из гайда — назад в презентацию")
        bid = page.evaluate("() => B.id")
        page.click("#deckImpBtn")
        with page.context.expect_page() as pi:
            page.click("#deckImpGuide")
        gp = pi.value
        gp.wait_for_selector("#doc h1")
        bl = gp.eval_on_selector("#backLink", "a => [a.getAttribute('href'), a.textContent]")
        check(bl == ["boards.html#board=" + bid, "← К презентации"], "в гайде «← К презентации» с адресом этой презентации", str(bl))
        gp.click("#backLink")
        page.wait_for_timeout(500)
        check(gp.is_closed(), "«← К презентации» закрывает вкладку гайда — презентация в своей вкладке")
        g2 = browser.new_page()
        g2.goto(T.BASE + "/deck-guide.html?from=" + "boards.html%23board%3D" + bid)
        g2.wait_for_selector("#doc h1")
        g2.click("#backLink")
        g2.wait_for_url("**/boards.html#board=" + bid, timeout=10000)
        check(True, "без вкладки-источника — переходит в ту же презентацию")
        g2.goto(T.BASE + "/deck-guide.html?from=" + "https%3A%2F%2Fexample.com")
        g2.wait_for_selector("#doc h1")
        check(g2.eval_on_selector("#backLink", "a => [a.getAttribute('href'), a.textContent]") == ["boards.html", "← К доскам"], "чужой адрес в from не принимается")
        g2.close()

        print("3. Образец из гайда «полностью»")
        info = do_import(page, sample_path)
        check("✓ Разметка по гайду" in info and "3 слайда" in info and "1920 × 1080" in info, "окно: по гайду, 3 слайда 1920 × 1080", info)
        sl = page.evaluate("() => deckSlides().map(s => [s.w, s.h, s.notes || ''])")
        check(len(sl) == 3 and all(abs(a - 67.73) < 0.1 and abs(b - 38.1) < 0.1 for a, b, _ in sl), "3 слайда 16:9", str(sl))
        check(len(sl) == 3 and sl[0][2].startswith("Начать с вопроса") and sl[1][2] == "" and sl[2][2].startswith("Попросить"), "заметки — у своих слайдов", str([s[2] for s in sl]))
        all_txt = [o["plain"] for i in range(len(sl)) for o in boxes(page.evaluate(SLIDE, i))]
        check(not any("▼" in t for t in all_txt), "служебная кнопка data-deck-ui на слайды не попала", str(all_txt))
        o1 = page.evaluate(SLIDE, 1)
        check(find(o1, "Алгебра · 8 класс") is not None, "шапка внутри слайда — надписью")
        li = [o for o in boxes(o1) if o["text"]["paras"][0].get("bu")]
        check(len(li) == 3, "список — три пункта с маркерами", str(len(li)))
        card = find(o1, "Запомни")
        check(card is not None and card.get("step") == 1 and not any(o.get("step") for o in li), "в образце карточка «Запомни» — шаг 1 анимации, свойства видны сразу")
        r0 = find(o1, "Свойства степени")
        check(r0 is not None and r0["text"]["paras"][0]["runs"][0]["f"] == "Montserrat" and page.evaluate("() => bxFace('Montserrat')") == "MX Montserrat", "шрифт Montserrat — свой у доски", str(r0["text"]["paras"][0]["runs"][0] if r0 else ""))
        o2 = page.evaluate(SLIDE, 2)
        tb = [o for o in o2 if o["type"] == "table"]
        check(len(tb) == 1 and len(tb[0]["cols"]) == 5 and len(tb[0]["rows"]) == 2, "таблица — таблицей доски 2 × 5", str([(len(t["cols"]), len(t["rows"])) for t in tb]))
        if tb:
            c00 = tb[0]["cells"][0][0]["text"]["paras"][0]["runs"][0]
            c10 = tb[0]["cells"][1][0]["text"]["paras"][0]["runs"]
            check(c00["t"] == "n" and c00["c"] == "#B4441C", "шапка таблицы — своим цветом", str(c00))
            check(any(r.get("bl") == "sup" for r in c10), "степень в ячейке — верхним индексом", str(c10))
            check(tb[0]["cells"][0][0].get("bd", {}).get("l", {}).get("c") == "#E8D9C4", "границы ячеек — своего цвета", str(tb[0]["cells"][0][0].get("bd")))
        check(not find(o2, "n") or find(o2, "Степени двойки") is not None, "заголовок слайда отдельно от таблицы")

        print("4. Кадр 4K")
        info = do_import(page, F("deck_import_4k.html"))
        check("✓ Разметка по гайду" in info and "2 слайда" in info and "3840 × 2160" in info, "окно: 2 слайда 3840 × 2160", info)
        sl = page.evaluate("() => deckSlides().map(s => [s.w, s.h, s.notes || ''])")
        check(len(sl) == 2 and abs(sl[0][0] - 67.73) < 0.1 and abs(sl[0][1] - 38.1) < 0.1, "слайд 16:9 обычного размера", str(sl))
        check(len(sl) == 2 and sl[1][2] == "Заметка 4K", "заметка у второго слайда")
        k0 = page.evaluate(SLIDE, 0)
        check(find(k0, "Кадр 4K") is not None and not find(k0, "ПАНЕЛЬ АВТОРА"), "заголовок есть, панели автора нет", str([b["plain"] for b in boxes(k0)]))
        do_import(page, F("deck_import_4k.html"), mode="img")
        nat = page.evaluate("() => B.objects.filter(o => o.bgOf).map(o => o.natW)")
        check(nat and all(n == 3840 for n in nat), "снимок «картинками» — 3840 px", str(nat))
        red = page.evaluate("""() => { const s = deckSlides()[0]; const o = B.objects.find(x => x.bgOf === s.id); const im = getImg(o.src);
          const cv = document.createElement('canvas'); cv.width = 384; cv.height = 216; const c = cv.getContext('2d'); c.drawImage(im, 0, 0, 384, 216);
          const d = c.getImageData(300, 180, 80, 30).data; let n = 0; for (let i = 0; i < d.length; i += 4) if (d[i] > 200 && d[i + 1] < 60) n++; return n; }""")
        check(red == 0, "на снимке нет красной панели автора", str(red))

        print("5. Книжный А4")
        info = do_import(page, F("deck_import_a4.html"))
        sl = page.evaluate("() => deckSlides().map(s => [s.w, s.h])")
        check("1240 × 1754" in info and len(sl) == 1 and abs(sl[0][1] / sl[0][0] - 1754 / 1240) < 0.01, "слайд книжный 1240 : 1754", str(sl))
        a0 = find(page.evaluate(SLIDE, 0), "Лист заданий")
        check(a0 is not None and a0["text"]["paras"][0]["runs"][0]["f"] == "Lora", "шрифт Lora — свой у доски")

        print("6. Файл без разметки")
        info = do_import(page, F("deck_import_custom.html"))
        check("Без разметки по гайду" in info, "предупреждение «без разметки»", info)
        check(page.evaluate("() => !!document.querySelector('#ioInfo a[href^=\"deck-guide.html?from=boards.html\"]')"), "в окне ссылка на гайд — с адресом этой презентации")

        print("7. Шрифты")
        faces = page.evaluate("(names) => names.map(n => [n, bxFace(n), BX_FONT_MENU.includes(n)])", GUIDE_FONTS)
        bad = [f for f in faces if f[1] == "MX Arimo" and f[0] not in ("Arial",) or not f[2] and f[0] not in ("Calibri", "Arial", "Times New Roman", "Cambria", "Courier New", "PT Sans", "PT Serif")]
        check(not bad, "у каждого шрифта гайда — свой файл доски", str(bad))
        menu = page.evaluate("() => BX_FONT_MENU")
        check(all(f in menu for f in GUIDE_FONTS), "все 19 — в списке шрифтов надписей", str([f for f in GUIDE_FONTS if f not in menu]))
        st = page.evaluate("""async () => { const r = []; for (const f of ['caveat-cyrillic-700-normal', 'playfair-display-latin-400-italic', 'open-sans-cyrillic-400-normal']) r.push((await fetch('fonts/' + f + '.woff2')).status); return r; }""")
        check(st == [200, 200, 200], "файлы шрифтов на месте", str(st))
        loaded = page.evaluate("""async () => { bxRegisterFonts(); await document.fonts.load('400 20px "MX Caveat"', 'Привет'); return document.fonts.check('400 20px "MX Caveat"', 'Привет'); }""")
        check(loaded, "Caveat с кириллицей загружается")

        check(not errors, "нет ошибок на странице", " | ".join(errors[:3]))
        browser.close()
    print()
    if fails:
        print("ПРОВАЛЫ:")
        for f in fails:
            print(" -", f)
        sys.exit(1)
    print("ВСЁ ПРОШЛО")


if __name__ == "__main__":
    main()
