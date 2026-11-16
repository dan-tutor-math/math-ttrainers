"""
Этап 6 конструктора вариантов: кнопка «＋ В вариант» в тренажёрах (exam-nav.js,
каталог current()) и режим выбора номеров на главной (index.html).

Заглушка входа и помощники — из теста этапа 1 работ.

Проверяет:
  A. кнопки нет без входа и у ученика совместной сессии; у вошедшего учителя
     есть на oge9, ege_prof?n=9, oge_part2?n=20, soc_oge?n=1;
  B. current(): null на экране выбора, на открытом задании — proto/pos/fipi;
  C. «Это задание» кладёт fipi и место; повтор прибавляет count и говорит
     «уже в наборе, теперь ×2»; «Этот прототип ×N» и «Весь номер»; Shift;
  D. счётчик на кнопке меняется из другой вкладки;
  E. телефон 375 px: кнопка — значок, заголовок не уезжает на вторую строку;
  F. главная: режим выбора кладёт строки в Набор и открывает #/build, где они
     в дереве; без входа кнопки «Собрать вариант» нет;
  G. нет ошибок JavaScript.

Запуск: python3 test_prompt_variant_entry.py
"""
import json
import sys

from test_prompt15_works_stage1 import (
    BASE, TEACHER, local_server, sync_playwright, new_context, watch_errors,
)

FAILS = []


def check(name, cond, extra=""):
    print(("[OK] " if cond else "[FAIL] ") + name + (f" — {extra}" if extra and not cond else ""))
    if not cond:
        FAILS.append(name)


def login(ctx):
    p = ctx.new_page()
    p.goto(f"{BASE}/works.html")
    p.wait_for_selector("#scrAuth:not([hidden])")
    p.fill("#auEmail", TEACHER["email"]); p.fill("#auPass", TEACHER["password"])
    p.click("#auGo")
    p.wait_for_selector("#scrList:not([hidden])")
    p.close()


def btn_visible(page):
    page.wait_for_timeout(700)
    return page.evaluate("() => { const b = document.getElementById('examVariantBtn'); return !!b && !b.hidden && b.getBoundingClientRect().width > 0; }")


def open_first(page, n=None):
    """открывает на экране первое задание с номером ФИПИ в первом прототипе, где он есть"""
    return page.evaluate("""async (n) => {
      const c = window.__trainerCatalog; const list = await c.list(n);
      const u = list.find(x => (x.fipi || []).some(Boolean)) || list[0];
      if (!u) return null;
      const r = await c.openAt(u.id, 0, n);
      return { id: u.id, r };
    }""", n)


def run():
    errors = []
    with local_server(), sync_playwright() as p:
        browser = p.chromium.launch()

        # ═══ A. кому видно ═══
        print("\n— A. кому видно")
        anon = new_context(browser, viewport={"width": 1440, "height": 950})
        ap = anon.new_page(); watch_errors(ap, errors, "anon")
        ap.goto(f"{BASE}/oge9.html")
        check("A1 без входа кнопки нет", not btn_visible(ap))
        ap.close(); anon.close()

        ctx = new_context(browser, viewport={"width": 1440, "height": 950})
        login(ctx)
        pages = [("oge9.html", None), ("ege_prof.html?n=9", 9), ("oge_part2.html?n=20", 20), ("soc_oge.html?n=1", 1)]
        for url, n in pages:
            pg = ctx.new_page(); watch_errors(pg, errors, url)
            pg.goto(f"{BASE}/{url}")
            check(f"A2 {url}: у вошедшего учителя кнопка есть", btn_visible(pg))
            pg.close()

        fol = new_context(browser, viewport={"width": 1440, "height": 950})
        login(fol)
        fol.add_init_script("try { sessionStorage.setItem('tsTab:role', 'follower'); } catch (e) {}")
        fp = fol.new_page(); watch_errors(fp, errors, "follower")
        fp.goto(f"{BASE}/oge9.html")
        check("A3 у ученика совместной сессии кнопки нет", not btn_visible(fp))
        fp.close(); fol.close()

        # ═══ B–D. oge9 ═══
        print("\n— B. current() и добавление (oge9)")
        pg = ctx.new_page(); watch_errors(pg, errors, "oge9")
        pg.goto(f"{BASE}/oge9.html")
        pg.evaluate("() => window.VariantSet.clear()")
        check("B1 на экране выбора current() — null", pg.evaluate("() => window.__trainerCatalog.current()") is None)
        pg.wait_for_timeout(700)
        pg.click("#examVariantBtn")
        check("B2 на экране выбора «Это задание» неактивна, «Весь номер» активна",
              pg.is_disabled("#vbAddTask") and pg.is_disabled("#vbAddProto") and not pg.is_disabled("#vbAddAll"))
        pg.click("#examVariantBtn")
        o = open_first(pg)
        cur = pg.evaluate("() => window.__trainerCatalog.current()")
        check("B3 на задании current() даёт proto, pos и fipi как у openAt",
              cur and cur["proto"] == o["id"] and cur["pos"] == 0 and cur["fipi"] == o["r"]["fipi"] and o["r"]["fipi"],
              json.dumps([cur, o], ensure_ascii=False))
        pg.click("#examVariantBtn")
        pg.click("#vbAddTask")
        rows = pg.evaluate("() => window.VariantSet.all()")
        check("C1 «Это задание»: строка oge9 с fipi, proto, pos и count 1",
              len(rows) == 1 and rows[0]["slug"] == "oge9" and rows[0]["exam"] == "oge" and rows[0]["n"] is None
              and rows[0]["fipi"] == cur["fipi"] and rows[0]["proto"] == cur["proto"] and rows[0]["pos"] == 0 and rows[0]["count"] == 1,
              json.dumps(rows, ensure_ascii=False))
        check("C2 подпись строки «ОГЭ №9, ФИПИ …»", rows[0]["from"] == "ОГЭ №9, ФИПИ " + cur["fipi"], rows[0]["from"])
        pg.click("#vbAddTask")
        rows = pg.evaluate("() => window.VariantSet.all()")
        check("C3 повтор не дублирует: одна строка, count 2", len(rows) == 1 and rows[0]["count"] == 2, json.dumps(rows))
        check("C4 сказано «уже в наборе, теперь ×2»", "уже в наборе, теперь ×2" in pg.inner_text("#vbMsg"), pg.inner_text("#vbMsg"))
        check("C5 счётчик на кнопке — 1 строка", pg.inner_text("#examVariantBtn .vb-badge") == "1")
        # прототип ×N
        check("C6 по умолчанию ×3", pg.inner_text("#vbCountVal") == "×3")
        pg.click("#vbPlus"); pg.click("#vbPlus"); pg.click("#vbMinus")
        check("C7 степпер: ×4", pg.inner_text("#vbCountVal") == "×4")
        pg.click("#vbAddProto")
        rows = pg.evaluate("() => window.VariantSet.all()")
        pr = [r for r in rows if r["pos"] is None and r["fipi"] is None and r["proto"]]
        check("C8 «Этот прототип ×4»: строка без pos и fipi, count 4", len(pr) == 1 and pr[0]["count"] == 4, json.dumps(rows, ensure_ascii=False))
        pg.click("#vbAddAll")
        rows = pg.evaluate("() => window.VariantSet.all()")
        al = [r for r in rows if not r["proto"]]
        check("C9 «Весь номер»: строка без proto, count 1", len(al) == 1 and al[0]["count"] == 1 and len(rows) == 3, json.dumps(rows, ensure_ascii=False))
        check("C10 счётчик в окне — «В наборе: 3», ссылка на #/build",
              "3" in pg.inner_text("#vbCount") and pg.get_attribute("#vbGo", "href") == "works.html#/build")
        pg.keyboard.press("Escape")
        pg.evaluate("() => window.VariantSet.clear()")
        pg.wait_for_timeout(200)
        # Shift — сразу «Это задание»
        pg.click("#examVariantBtn", modifiers=["Shift"])
        rows = pg.evaluate("() => window.VariantSet.all()")
        check("C11 Shift+нажатие кладёт «Это задание» сразу", len(rows) == 1 and rows[0]["fipi"] == cur["fipi"], json.dumps(rows, ensure_ascii=False))
        pg.keyboard.press("Escape")

        # ═══ D. счётчик из другой вкладки ═══
        print("\n— D. другая вкладка")
        t2 = ctx.new_page(); watch_errors(t2, errors, "tab2")
        t2.goto(f"{BASE}/oge6.html")
        t2.evaluate("() => window.VariantSet.add({ exam: 'oge', slug: 'oge6', count: 2 })")
        pg.wait_for_function("() => document.querySelector('#examVariantBtn .vb-badge').textContent === '2'", timeout=4000)
        check("D1 счётчик на кнопке стал 2 после добавления в другой вкладке", True)
        t2.evaluate("() => window.VariantSet.clear()")
        pg.wait_for_function("() => document.querySelector('#examVariantBtn .vb-badge').hidden", timeout=4000)
        check("D2 после очистки значок счётчика скрыт", True)
        t2.close()

        # ═══ ЕГЭ: ege_prof?n=9 ═══
        print("\n— ЕГЭ и ОГЭ часть 2")
        eg = ctx.new_page(); watch_errors(eg, errors, "ege")
        eg.goto(f"{BASE}/ege_prof.html?n=9")
        eg.evaluate("() => window.VariantSet.clear()")
        check("B4 ege_prof: на экране прототипов current() — null", eg.evaluate("() => window.__trainerCatalog.current()") is None)
        o = open_first(eg, 9)
        cur = eg.evaluate("() => window.__trainerCatalog.current()")
        check("B5 ege_prof?n=9: current() даёт n, proto, pos, fipi",
              cur and cur["n"] == 9 and cur["proto"] == o["id"] and cur["pos"] == 0 and cur["fipi"] == o["r"]["fipi"],
              json.dumps([cur, o], ensure_ascii=False))
        eg.wait_for_timeout(700)
        eg.click("#examVariantBtn")
        eg.click("#vbAddTask")
        rows = eg.evaluate("() => window.VariantSet.all()")
        check("C12 ege_prof?n=9: строка exam ege_prof, n 9, fipi задания",
              len(rows) == 1 and rows[0]["exam"] == "ege_prof" and rows[0]["slug"] == "ege_prof" and rows[0]["n"] == 9
              and rows[0]["fipi"] == cur["fipi"] and rows[0]["proto"] == cur["proto"], json.dumps(rows, ensure_ascii=False))
        eg.evaluate("() => window.VariantSet.clear()")
        eg.close()

        for url, n, exam in [("oge_part2.html?n=20", 20, "oge"), ("soc_oge.html?n=1", 1, "soc_oge")]:
            q = ctx.new_page(); watch_errors(q, errors, url)
            q.goto(f"{BASE}/{url}")
            q.evaluate("() => window.VariantSet.clear()")
            q.wait_for_timeout(700)
            q.click("#examVariantBtn")
            q.click("#vbAddAll")
            rows = q.evaluate("() => window.VariantSet.all()")
            check(f"C13 {url}: «Весь номер» — строка exam {exam}, n {n}",
                  len(rows) == 1 and rows[0]["exam"] == exam and rows[0]["n"] == n and not rows[0]["proto"], json.dumps(rows, ensure_ascii=False))
            q.evaluate("() => window.VariantSet.clear()")
            q.close()

        # ═══ E. телефон ═══
        print("\n— E. 375 px")
        pg.close()
        m = new_context(browser, viewport={"width": 375, "height": 800})
        login(m)
        for url in ["oge15_18.html", "oge9.html"]:
            hs = {}
            for who in ("anon", "teacher"):
                mc = m if who == "teacher" else new_context(browser, viewport={"width": 375, "height": 800})
                mp = mc.new_page(); watch_errors(mp, errors, "m-" + url)
                mp.goto(f"{BASE}/{url}")
                mp.wait_for_timeout(900)
                hs[who] = mp.evaluate("""() => { const h = document.querySelector('h1.exam-nav-h1'); const b = document.getElementById('examVariantBtn');
                  return { h: h.getBoundingClientRect().height, w: b ? b.getBoundingClientRect().width : 0, label: b ? getComputedStyle(b.querySelector('.vb-label')).display : null,
                    scroll: document.documentElement.scrollWidth <= innerWidth }; }""")
                mp.close()
                if who == "anon": mc.close()
            check(f"E1 {url}: на телефоне кнопка — значок, заголовок не выше, чем без неё",
                  hs["teacher"]["w"] <= 32 and hs["teacher"]["label"] == "none" and hs["teacher"]["h"] <= hs["anon"]["h"] + 1 and hs["teacher"]["scroll"],
                  json.dumps(hs))
        m.close()

        # ═══ F. главная ═══
        print("\n— F. главная")
        anon = new_context(browser, viewport={"width": 1440, "height": 950})
        ip = anon.new_page(); watch_errors(ip, errors, "index-anon")
        ip.goto(f"{BASE}/index.html")
        ip.wait_for_timeout(700)
        check("F1 без входа «Собрать вариант» нет", ip.locator("#vbToggle").count() == 0)
        ip.close(); anon.close()

        ip = ctx.new_page(); watch_errors(ip, errors, "index")
        ip.goto(f"{BASE}/index.html")
        ip.evaluate("() => window.VariantSet.clear()")
        ip.evaluate("""() => { localStorage.removeItem('ogeNav:state'); }""")
        ip.reload()
        # вкладка «Экзамены», подвкладка ОГЭ — первая
        ip.wait_for_selector("#vbToggle", timeout=5000)
        check("F2 у вошедшего в шапке экзаменационной вкладки «Собрать вариант»", ip.inner_text("#vbToggle") == "Собрать вариант")
        ip.click("#vbToggle")
        ip.wait_for_selector("#vbPlate")
        ip.wait_for_function("() => document.querySelectorAll('.topic-item .vb-box').length > 0")
        check("F3 режим выбора: у карточек галочки, плашка «Выбрано 0 номеров · 0 заданий»",
              "Выбрано 0 номеров · 0 заданий" in ip.inner_text("#vbPlate"), ip.inner_text("#vbPlate"))
        ip.click("a.topic-item[href='oge9.html']")
        ip.fill("a.topic-item[href='oge9.html'] .vb-cnt", "2")
        ip.click("a.topic-item[href='oge6.html']")
        check("F4 отметка не уводит со страницы, плашка «Выбрано 2 номера · 3 задания»",
              ip.url.endswith("index.html") and "Выбрано 2 номера · 3 задания" in ip.inner_text("#vbPlate"), ip.inner_text("#vbPlate") + " " + ip.url)
        off = ip.evaluate("() => document.querySelector('a.topic-item[href=\"oge8.html\"]').classList.contains('vb-off')")
        check("F5 номер без каталога (oge8) отмечать нельзя", off)
        ip.click("#vbFull")
        n_full = ip.evaluate("() => document.querySelectorAll('.topic-item.vb-sel').length")
        check("F6 «Полный вариант» отмечает все номера с каталогом (больше двух)", n_full > 2, str(n_full))
        ip.click("a.topic-item[href='oge1_5.html']")   # снять
        ip.click("#vbBuild")
        ip.wait_for_selector("#scrBuild:not([hidden])", timeout=8000)
        ip.wait_for_selector("#bdTree .bd-row")
        check("F7 «Собрать работу» открыла works.html#/build", "works.html" in ip.url and "#/build" in ip.url, ip.url)
        rows = ip.evaluate("() => window.VariantSet.all()")
        by = {r["slug"]: r for r in rows}
        check("F8 в Наборе строки «весь номер»: oge9 ×2, oge6 ×1, oge1_5 нет, oge8 нет",
              by.get("oge9", {}).get("count") == 2 and by.get("oge6", {}).get("count") == 1 and "oge1_5" not in by and "oge8" not in by
              and all(not r["proto"] and r["pos"] is None for r in rows), json.dumps([(r["slug"], r["count"]) for r in rows]))
        tree = ip.evaluate("() => [...document.querySelectorAll('#bdTree .bd-num-t')].map(e => e.textContent)")
        check("F9 строки видны в дереве сборки", any("ОГЭ №9" in t for t in tree) and any("ОГЭ №6" in t for t in tree), str(tree))
        ip.close()

        ctx.close()
        browser.close()

    print("\n— G. ошибки JavaScript")
    # заглушка входа не умеет upsert: им пишет память учеников (student-memory.js), к этапу это не относится
    errors = [e for e in errors if "upsert is not a function" not in e
              and not (e.startswith("index:") and "reading 'filter'" in e)]   # заглушка: в её базе нет таблицы, которую читает works.html при входе
    check("G1 нет ошибок JavaScript", not errors, "; ".join(errors[:5]))
    print("\nГОТОВО" if not FAILS else f"\nПРОВАЛЕНО: {len(FAILS)}")
    return 1 if FAILS else 0


if __name__ == "__main__":
    sys.exit(run())
