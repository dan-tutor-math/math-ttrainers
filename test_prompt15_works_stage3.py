"""
Промпт №15 «работы», доработки после проверки (этап 3): теория к заданию,
естественный размер и уголок «сузить / растянуть», заметки ученика, вид
«по одному / списком» и запрет переключать, превью поменьше, «вверх / вниз»
для нового задания, своё число попыток.

Заглушка Supabase и помощники — из теста этапа 1.

Проверяет:
  A. конструктор: превью заданий не выше 130 px; «↑» — новое задание в
     начало списка, «↓» — в конец, выбор помнится; своё число попыток
     (7) между 5 и ∞, кнопки при этом не выделены, снова «2» — поле
     пустое; «Как ученик видит задания» и «может переключать»;
  B. теория: задание ОГЭ №1–5 («Шина 1») уносит в работу теорию картинкой
     в двух темах, в превью — пометка, у варианта — теория образца;
  C. ученик, «по одному» с разрешением переключать: теория над заданием
     открыта; карточка в естественном размере (масштаб 1, не растянута);
     уголок сужает и растягивает, размер помнится после перезагрузки,
     двойной щелчок — обратно к естественному; «Списком» — все задания,
     выбор помнится; номер в списке — прокрутка к заданию;
  D. заметки: включить — холст ловит перо, штрих сохраняется и переживает
     перезагрузку, поле для записей под карточкой, ластик стирает штрих,
     выключить — поле ответа снова нажимается; окно «Подсказки и решение»
     тянется за край (resize);
  E. «списком» без права переключать: все задания сразу, переключателя нет,
     ответ в любом задании, попытки — своё число (7);
  F. нет ошибок JavaScript.

Запуск: python3 test_prompt15_works_stage3.py
"""
import json
import sys

from test_prompt15_works_stage1 import (
    BASE, TEACHER, local_server, sync_playwright, new_context, watch_errors, db,
    open_in_frame, add_task, back_to_catalog, type_fields, correct_input, wrong_input,
)

FAILS = []


def check(name, cond, extra=""):
    print(("[OK] " if cond else "[FAIL] ") + name + (f" — {extra}" if extra and not cond else ""))
    if not cond:
        FAILS.append(name)


def wait_gens(page, timeout=90000):
    page.wait_for_function("() => window.__works.gens.size === 0 && window.__works.E.variants.every(v => v.blocks.every(b => !b._gen || b._gen === 'fail'))", timeout=timeout)
    page.wait_for_timeout(200)


def save(tp):
    tp.click("#wkSave")
    tp.wait_for_function("() => document.getElementById('wkSaved').textContent.indexOf('Сохранено') === 0", timeout=60000)


def wrap_w(page, sel=".titem.cur .tc-wrap"):
    return page.evaluate(f"() => document.querySelector('{sel}').getBoundingClientRect().width")


def run():
    errors = []
    with local_server(), sync_playwright() as p:
        browser = p.chromium.launch()
        tctx = new_context(browser, viewport={"width": 1440, "height": 950})
        tp = tctx.new_page()
        watch_errors(tp, errors, "works")
        tp.goto(f"{BASE}/works.html")
        tp.wait_for_selector("#scrAuth:not([hidden])")
        tp.fill("#auEmail", TEACHER["email"]); tp.fill("#auPass", TEACHER["password"]); tp.click("#auGo")
        tp.wait_for_selector("#scrList:not([hidden])")
        tp.click("#newWork"); tp.wait_for_selector("#scrEdit:not([hidden])")

        # ═══ A ═══
        print("\n— A. конструктор")
        check("A1 по умолчанию новое задание — вниз", "active" in tp.get_attribute('#addPos button[data-p="end"]', "class"))
        open_in_frame(tp, "oge6", "document.querySelectorAll('.mode-card:not(.soon)')[2].click()"); add_task(tp, 1); back_to_catalog(tp)
        open_in_frame(tp, "add_col", "curLevel = 2; newProblem();"); add_task(tp, 2)
        check("A2 «↓» — в конец", tp.evaluate("() => window.__works.E.blocks.map(b => b.tid)") == ["oge6", "add_col"])
        tp.click('#addPos button[data-p="start"]')
        tp.click("#refreshBtn2"); tp.wait_for_timeout(300)
        add_task(tp, 3)
        check("A3 «↑» — в начало", tp.evaluate("() => window.__works.E.blocks.map(b => b.tid)") == ["add_col", "oge6", "add_col"])
        tp.reload(); tp.wait_for_selector("#scrEdit:not([hidden]), #scrList:not([hidden])")
        check("A4 выбор «↑» помнится", "active" in tp.get_attribute('#addPos button[data-p="start"]', "class"))
        # после перезагрузки несохранённая работа пропала — собираем заново
        tp.evaluate("() => { location.hash = '#/new'; }"); tp.wait_for_selector("#scrEdit:not([hidden])")
        open_in_frame(tp, "oge6", "document.querySelectorAll('.mode-card:not(.soon)')[2].click()")
        tp.click('#addPos button[data-p="end"]')
        add_task(tp, 1); back_to_catalog(tp)
        open_in_frame(tp, "oge7", "document.querySelectorAll('.mode-card:not(.soon)')[3].click()"); add_task(tp, 2); back_to_catalog(tp)
        mh = tp.evaluate("() => Math.max(...[...document.querySelectorAll('.ti-img img')].map(i => i.getBoundingClientRect().height))")
        check("A5 превью не выше 130 px", mh <= 131, str(mh))
        tp.fill("#wkTriesOwn", "7")
        check("A6 своё число попыток — 7", tp.evaluate("() => window.__works.E.settings.attempts") == 7
              and "active" in tp.get_attribute("#wkTriesOwn", "class")
              and tp.locator("#wkTries button.active").count() == 0)
        tp.click('#wkTries button[data-t="2"]')
        check("A7 снова «2» — поле своего числа пустое", tp.evaluate("() => window.__works.E.settings.attempts") == 2 and tp.input_value("#wkTriesOwn") == "")
        tp.fill("#wkTriesOwn", "7")
        tp.click('.switch .side[data-v="end"]')
        check("A8 при «в конце» своё число неактивно", tp.is_disabled("#wkTriesOwn"))
        tp.click('.switch .side[data-v="each"]')
        check("A9 по умолчанию — «по одному», переключать можно",
              "active" in tp.get_attribute('#wkView button[data-v="one"]', "class") and tp.is_checked("#wkViewSwitch"))

        # ═══ B ═══
        print("\n— B. теория к заданию (ОГЭ №1–5)")
        open_in_frame(tp, "oge1_5", "enterTaskset(GROUPS.flatMap(g => g.modes).find(x => x.id === 'tire_set1'))")
        add_task(tp, 3)
        b3 = tp.evaluate("() => { const b = window.__works.E.blocks[2]; return { tid: b.tid, th: !!b.theory, l: b.theory && b.theory.img.light.url.slice(0, 10), d: b.theory && b.theory.img.dark.url.slice(0, 10), w: b.theory && b.theory.css.w, same: b.theory && b.theory.img.light.url === b.theory.img.dark.url }; }")
        check("B1 «Шина 1» — теория снята в двух темах", b3["tid"] == "oge1_5" and b3["th"] and b3["l"].startswith("data:") and b3["d"] and not b3["same"], str(b3))
        check("B2 теория не шире ~480 px", (b3["w"] or 999) <= 480, str(b3["w"]))
        check("B3 в превью — «с теорией»", "с теорией" in tp.inner_text(".ti >> nth=2"))
        check("B4 у других заданий теории нет", tp.evaluate("() => window.__works.E.blocks.slice(0, 2).every(b => !b.theory)"))
        frame_theory_hidden = tp.evaluate("() => document.getElementById('trFrame').contentDocument.getElementById('theoryContent').style.display")
        check("B5 в кадре теория снова свёрнута, как была", frame_theory_hidden == "none", frame_theory_hidden)
        tp.click("#varAdd"); wait_gens(tp)
        check("B6 у варианта — теория к заданию тоже есть", tp.evaluate("() => !!window.__works.E.variants[1].blocks[2].theory"))
        tp.evaluate("() => document.querySelector('#wkVariants button[data-v=\"0\"]').click()")
        tp.fill("#wkTitle", "Доработки")
        save(tp)
        vs = sorted(db()["work_variants"], key=lambda v: v["num"])
        bl = vs[0]["blocks"]
        check("B7 в базе теория — ссылками, не PNG", bl[2].get("theory") and not bl[2]["theory"]["img"]["light"]["url"].startswith("data:image/png"))
        w = db()["works"][0]
        check("B8 настройки в базе: попытки 7, вид «по одному», переключать можно",
              w["settings"].get("attempts") == 7 and w["settings"].get("view") == "one" and w["settings"].get("viewSwitch") is True, json.dumps(w["settings"]))
        code1 = vs[0]["code"]

        # ═══ C ═══
        print("\n— C. ученик: размер, теория, вид")
        sctx = new_context(browser, viewport={"width": 1200, "height": 900})
        sp = sctx.new_page()
        watch_errors(sp, errors, "work")
        sp.goto(f"{BASE}/work.html?c={code1}")
        sp.wait_for_selector("#scrStart:not([hidden])")
        sp.fill("#wName", "Оля"); sp.click("#wStart")
        sp.wait_for_selector("#scrTask:not([hidden])")
        W0 = bl[0]["hot"]["w"]
        w_nat = wrap_w(sp)
        check("C1 карточка в естественном размере (масштаб 1)", abs(w_nat - W0) < 1.5, f"{w_nat} vs {W0}")
        check("C2 переключатель вида есть", sp.is_visible("#wView") and "active" in sp.get_attribute('#wView button[data-v="one"]', "class"))
        check("C3 попыток — 7", "7 из 7" in sp.inner_text(".titem.cur .tries"))
        # уголок
        rz = sp.locator(".titem.cur .tc-resize").bounding_box()
        sp.mouse.move(rz["x"] + rz["width"] / 2, rz["y"] + rz["height"] / 2); sp.mouse.down()
        sp.mouse.move(rz["x"] - 120, rz["y"] + 10, steps=6); sp.mouse.up()
        w_small = wrap_w(sp)
        check("C4 уголок сужает", w_small < w_nat - 100, f"{w_nat} → {w_small}")
        rz = sp.locator(".titem.cur .tc-resize").bounding_box()
        sp.mouse.move(rz["x"] + rz["width"] / 2, rz["y"] + rz["height"] / 2); sp.mouse.down()
        sp.mouse.move(rz["x"] + 260, rz["y"] + 10, steps=6); sp.mouse.up()
        w_big = wrap_w(sp)
        check("C5 и растягивает больше естественного", w_big > w_nat + 80, f"{w_nat} → {w_big}")
        sp.reload(); sp.wait_for_selector("#scrTask:not([hidden])")
        check("C6 размер помнится после перезагрузки", abs(wrap_w(sp) - w_big) < 2)
        sp.dblclick(".titem.cur .tc-resize")
        check("C7 двойной щелчок — естественный размер", abs(wrap_w(sp) - W0) < 1.5)
        # теория
        sp.click(".num[data-i='2']")
        th = sp.evaluate("() => { const d = document.querySelector('.titem.cur details.theory'); return d ? [d.open, d.querySelector('img').src.slice(0, 30)] : null; }")
        check("C8 у задания «Шина 1» — теория над карточкой, открыта", th and th[0] is True, str(th))
        sp.click("#themeToggle"); sp.wait_for_timeout(200)
        src = sp.evaluate("() => document.querySelector('.titem.cur details.theory img').src")
        check("C10 тёмная тема — тёмная картинка теории", src == bl[2]["theory"]["img"]["dark"]["url"])
        sp.click("#themeToggle")
        # вид «списком»
        sp.click('#wView button[data-v="list"]'); sp.wait_for_timeout(200)
        check("C11 «Списком» — все три задания на странице", sp.locator(".titem").count() == 3)
        sp.reload(); sp.wait_for_selector("#scrTask:not([hidden])")
        check("C12 выбор «Списком» помнится", sp.locator(".titem").count() == 3)
        sp.click(".num[data-i='1']"); sp.wait_for_timeout(700)
        top = sp.evaluate("() => document.querySelector('.titem[data-i=\"1\"]').getBoundingClientRect().top")
        check("C13 номер — прокрутка к заданию, оно текущее", top < 300 and "cur" in sp.get_attribute('.titem[data-i="1"]', "class"), str(top))
        t1 = bl[1]["task"]
        sp.click(f".titem[data-i='1'] .tc-opt[data-i='{t1['correct']}']"); sp.wait_for_timeout(300)
        check("C14 ответ в списке засчитан", "Верно" in sp.inner_text(".titem[data-i='1'] .wmsg"))
        sp.click('#wView button[data-v="one"]'); sp.wait_for_timeout(200)
        check("C15 обратно «по одному» — одно задание, текущее", sp.locator(".titem").count() == 1 and sp.inner_text(".titem.cur .tnum").startswith("Задание 2"))

        # ═══ D ═══
        print("\n— D. заметки")
        sp.click(".num[data-i='0']")
        check("D1 поле для записей скрыто, пока заметки выключены", sp.is_hidden(".titem.cur .scratch"))
        sp.click("#wNotes")
        check("D2 заметки включены — поле для записей и инструменты", sp.is_visible(".titem.cur .scratch") and sp.is_visible(".titem.cur .notes-bar"))
        cv = sp.locator(".titem.cur .notes-cv").bounding_box()
        sp.mouse.move(cv["x"] + 30, cv["y"] + 30); sp.mouse.down()
        sp.mouse.move(cv["x"] + 120, cv["y"] + 60, steps=8); sp.mouse.up()
        tid0 = bl[0]["id"]
        n = sp.evaluate(f"() => (window.__work.S.notes[{json.dumps(tid0)}] || []).length")
        check("D3 штрих пером сохранён", n == 1, str(n))
        # штрих на поле для записей
        sc = sp.locator(".titem.cur .scratch").bounding_box()
        sp.mouse.move(sc["x"] + 40, sc["y"] + 40); sp.mouse.down(); sp.mouse.move(sc["x"] + 140, sc["y"] + 70, steps=6); sp.mouse.up()
        sp.reload(); sp.wait_for_selector("#scrTask:not([hidden])")
        n = sp.evaluate(f"() => (window.__work.S.notes[{json.dumps(tid0)}] || []).length")
        check("D4 заметки пережили перезагрузку (2 штриха), режим помнится", n == 2 and "on" in sp.get_attribute("#wNotes", "class"), str(n))
        px = sp.evaluate("""() => { const c = document.querySelector('.titem.cur .notes-cv'); const x = c.getContext('2d').getImageData(0, 0, c.width, c.height).data;
            let k = 0; for (let i = 3; i < x.length; i += 4) if (x[i] > 0) k++; return k; }""")
        check("D5 штрихи нарисованы на холсте", px > 50, str(px))
        sp.click(".titem.cur .notes-bar .er")
        cv = sp.locator(".titem.cur .notes-cv").bounding_box()
        sp.mouse.move(cv["x"] + 60, cv["y"] + 35); sp.mouse.down(); sp.mouse.move(cv["x"] + 80, cv["y"] + 45, steps=4); sp.mouse.up()
        n = sp.evaluate(f"() => (window.__work.S.notes[{json.dumps(tid0)}] || []).length")
        check("D6 ластик стёр штрих целиком", n == 1, str(n))
        hit = sp.evaluate("() => { const i = document.querySelector('.titem.cur .tc-in'); const r = i.getBoundingClientRect(); return document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2) === i; }")
        check("D7 пока заметки включены — поле под холстом", hit is False)
        sp.click("#wNotes")
        hit = sp.evaluate("() => { const i = document.querySelector('.titem.cur .tc-in'); const r = i.getBoundingClientRect(); return document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2) === i; }")
        check("D8 выключили — поле ответа снова нажимается", hit is True)
        check("D9 штрих на поле записей виден и при выключенных заметках", sp.is_visible(".titem.cur .scratch"))
        rs = sp.evaluate("() => getComputedStyle(document.querySelector('.titem.cur .trainer-box .tb-body')).resize")
        check("D10 окно «Подсказки и решение» тянется за край", rs == "vertical", rs)

        # ═══ E ═══
        print("\n— E. списком без права переключать")
        tp.click('#wkView button[data-v="list"]')
        tp.uncheck("#wkViewSwitch")
        save(tp)
        w = db()["works"][0]
        check("E1 в базе: «списком», переключать нельзя", w["settings"].get("view") == "list" and w["settings"].get("viewSwitch") is False)
        ectx = new_context(browser, viewport={"width": 390, "height": 844}, is_mobile=True, has_touch=True)
        ep = ectx.new_page()
        watch_errors(ep, errors, "work-list")
        ep.goto(f"{BASE}/work.html?c={code1}")
        ep.wait_for_selector("#scrStart:not([hidden])")
        ep.evaluate(f"() => localStorage.setItem('work:view:{code1}', JSON.stringify('one'))")
        ep.fill("#wName", "Петя"); ep.click("#wStart")
        ep.wait_for_selector("#scrTask:not([hidden])")
        check("E2 все задания сразу, переключателя нет (свой выбор в браузере не действует)",
              ep.locator(".titem").count() == 3 and ep.is_hidden("#wView"))
        t0 = bl[0]["task"]
        ep.fill(".titem[data-i='0'] .tc-in", "987654")
        ep.click(".titem[data-i='0'] .tc-btn")
        ep.wait_for_timeout(300)
        check("E3 неверно — «Попыток: 6 из 7»", "6 из 7" in ep.inner_text(".titem[data-i='0'] .tries"))
        ep.fill(".titem[data-i='0'] .tc-in", str(t0["fields"][0]["value"]))
        ep.click(".titem[data-i='0'] .tc-btn"); ep.wait_for_timeout(300)
        check("E4 верно со 2-й попытки", "2-й" in ep.inner_text(".titem[data-i='0'] .wmsg"))
        ow = ep.evaluate("() => document.documentElement.scrollWidth - document.documentElement.clientWidth")
        check("E5 телефон: без прокрутки вбок", ow <= 0, str(ow))
        browser.close()

    print("\n— F. ошибки JavaScript")
    check("F1 нет ошибок JavaScript", not errors, "; ".join(errors[:5]))


if __name__ == "__main__":
    run()
    print()
    if FAILS:
        print(f"ПРОВАЛЕНО: {len(FAILS)}")
        for f in FAILS:
            print("  - " + f)
        sys.exit(1)
    print("Все проверки прошли")
