"""
Конструктор работ (works.html): «Добавить N заданий» — выбрал тип, поставил
число, нажал «Добавить» — в работе N разных заданий этого типа.

Заглушка Supabase, вход учителя и тренажёр в кадре — из теста этапа 1
(test_prompt15_works_stage1.py).

Проверяет:
  A. поле числа рядом с кнопкой: по умолчанию 1 и обычная подпись кнопки;
     «+» и «−», границы 1…30; ввод цифрами меняет подпись («Добавить 10 в
     работу»); число помнится после перезагрузки;
  B. пачка из 6 заданий ОГЭ №6: ровно 6, все разные, тот же тренажёр и тип,
     у каждого ответ, места полей и картинки обеих тем; кнопка и поле снова
     доступны;
  C. вторая пачка того же типа продолжает работу — совпадений с первой нет;
  D. «Степени»: без галочки «Нулевые и отрицательные степени» во всех
     заданиях пачки ни одной степени ≤ 0 и hardNums = false, с галочкой —
     hardNums = true у всех и трудные встречаются;
  E. заданий не хватает: ЕГЭ база №8 (3 прототипа) на 30 — добавлено 3 и
     сообщение «Добавлено 3 из 30»; ЕГЭ профиль №6 (один прототип) — одно и
     сообщение про один прототип;
  F. «Остановить» посреди пачки: добавлено меньше заказанного, то, что
     успело, — в работе;
  G. 1 — как раньше: одно задание, без кнопки «Остановить»;
  H. нет ошибок JavaScript.

Живой Supabase отсюда не проверить — сохранение работы перепроверяется на
сайте руками.

Запуск: python3 test_prompt_works_batch_add.py (сервер поднимается сам).
"""
import json
import re

from test_prompt15_works_stage1 import (
    BASE, TEACHER, local_server, sync_playwright, new_context, watch_errors,
    open_in_frame, back_to_catalog,
)

FAILS = []


def check(name, cond, extra=""):
    print(("[OK] " if cond else "[FAIL] ") + name + (f" — {extra}" if extra and not cond else ""))
    if not cond:
        FAILS.append(name)


def set_count(page, n):
    page.fill("#addCount", str(n))
    page.dispatch_event("#addCount", "change")


def vblocks(page):
    return page.evaluate("""() => JSON.parse(JSON.stringify(window.__works.E.variants[0].blocks,
        (k, v) => (typeof v === 'string' && v.startsWith('data:')) ? 'data:' + v.length : v))""")


def sigs(page):
    return page.evaluate("() => window.__works.E.variants[0].blocks.map(b => b._sig || '')")


def key(b):
    return json.dumps([b.get("task"), b.get("exact")], sort_keys=True)


def press_add(page, timeout=150000):
    """Нажать «Добавить» и дождаться конца пачки."""
    page.click("#addBtn")
    page.wait_for_function("() => !document.getElementById('addBtn').disabled", timeout=timeout)
    page.wait_for_timeout(300)


def clear_work(page):
    page.evaluate("() => { window.__works.E.variants[0].blocks.length = 0; }")


def nonpos_exps(s):
    return [int(x) for x in re.findall(r"\^\{(-?\d+)\}", s) if int(x) <= 0]


def run():
    errors = []
    with local_server(), sync_playwright() as p:
        browser = p.chromium.launch()
        ctx = new_context(browser, viewport={"width": 1440, "height": 950})
        pg = ctx.new_page()
        watch_errors(pg, errors, "works")
        pg.goto(f"{BASE}/works.html")
        pg.wait_for_selector("#scrAuth:not([hidden])")
        pg.fill("#auEmail", TEACHER["email"]); pg.fill("#auPass", TEACHER["password"]); pg.click("#auGo")
        pg.wait_for_selector("#scrList:not([hidden])")
        pg.click("#newWork"); pg.wait_for_selector("#scrEdit:not([hidden])")

        # ═══ A. поле числа ═══
        print("\n— A. поле числа")
        open_in_frame(pg, "oge6", "document.querySelectorAll('.mode-card:not(.soon)')[2].click()")
        check("A1 поле числа видно рядом с кнопкой, по умолчанию 1",
              pg.is_visible("#addCount") and pg.input_value("#addCount") == "1" and pg.is_visible("#cntMinus") and pg.is_visible("#cntPlus"))
        check("A2 при 1 — прежняя подпись кнопки", pg.inner_text("#addBtn").strip() == "＋ Добавить в работу", pg.inner_text("#addBtn"))
        check("A3 при 1 «−» неактивна", pg.is_disabled("#cntMinus"))
        pg.click("#cntPlus"); pg.click("#cntPlus")
        check("A4 «+» дважды — 3, подпись кнопки с числом", pg.input_value("#addCount") == "3" and "Добавить 3 в работу" in pg.inner_text("#addBtn"), pg.inner_text("#addBtn"))
        pg.click("#cntMinus")
        check("A5 «−» — 2", pg.input_value("#addCount") == "2")
        set_count(pg, 99)
        check("A6 больше 30 не бывает", pg.input_value("#addCount") == "30" and pg.is_disabled("#cntPlus"), pg.input_value("#addCount"))
        set_count(pg, 0)
        check("A7 меньше 1 не бывает", pg.input_value("#addCount") == "1")
        pg.fill("#addCount", "10")
        check("A8 цифрами: подпись «Добавить 10 в работу» сразу, без ухода из поля", "Добавить 10 в работу" in pg.inner_text("#addBtn"), pg.inner_text("#addBtn"))
        pg.dispatch_event("#addCount", "change")
        pg.reload(); pg.wait_for_function("() => window.__works && document.getElementById('addCount')")
        pg.wait_for_selector("#scrEdit:not([hidden]), #scrList:not([hidden])")
        if pg.is_visible("#scrList"):
            pg.click("#newWork"); pg.wait_for_selector("#scrEdit:not([hidden])")
        check("A9 число помнится после перезагрузки", pg.input_value("#addCount") == "10", pg.input_value("#addCount"))

        # ═══ G. единица — как раньше ═══
        print("\n— G. один")
        open_in_frame(pg, "oge6", "document.querySelectorAll('.mode-card:not(.soon)')[2].click()")
        set_count(pg, 1)
        pg.click("#addBtn")
        check("G1 при 1 кнопки «Остановить» нет", pg.is_hidden("#batchStop"))
        pg.wait_for_function("() => !document.getElementById('addBtn').disabled", timeout=60000)
        check("G2 добавлено одно задание", len(vblocks(pg)) == 1)

        # ═══ B. пачка ═══
        print("\n— B. пачка из 6")
        clear_work(pg)
        set_count(pg, 6)
        pg.click("#addBtn")
        check("B0 пока идёт пачка: поле выключено, «Остановить» видна", pg.is_disabled("#addCount") and pg.is_visible("#batchStop"))
        pg.wait_for_function("() => !document.getElementById('addBtn').disabled", timeout=150000)
        pg.wait_for_timeout(300)
        bl = vblocks(pg)
        check("B1 добавлено ровно 6", len(bl) == 6, str(len(bl)))
        check("B2 все 6 разные", len({key(b) for b in bl}) == 6)
        check("B3 тот же тренажёр и тот же тип", {b["tid"] for b in bl} == {"oge6"} and len({b["exact"]["curMode"] for b in bl}) == 1,
              str({b["exact"].get("curMode") for b in bl}))
        check("B4 у каждого ответ, места полей, картинки светлой и тёмной темы",
              all(b.get("task") and b.get("hot") and b["img"]["light"]["url"] and b["img"]["dark"]["url"] for b in bl))
        check("B5 после пачки поле и кнопка снова доступны, подпись прежняя",
              pg.is_enabled("#addCount") and pg.is_enabled("#addBtn") and "Добавить 6 в работу" in pg.inner_text("#addBtn") and pg.is_hidden("#batchStop"))
        check("B6 в списке работы 6 заданий", pg.locator("#wkTasks .ti").count() == 6, str(pg.locator("#wkTasks .ti").count()))
        check("B7 сообщение «Добавлено заданий: 6»", "Добавлено заданий: 6" in pg.inner_text("#toast"), pg.inner_text("#toast"))

        # ═══ C. вторая пачка ═══
        print("\n— C. вторая пачка")
        set_count(pg, 4)
        press_add(pg)
        bl2 = vblocks(pg)
        check("C1 стало 10", len(bl2) == 10, str(len(bl2)))
        check("C2 все 10 разные — вторая пачка не повторяет первую", len({key(b) for b in bl2}) == 10)
        # те же задания, но порядок ключей, как у пришедших из базы, — всё равно «то же»
        check("C3 сверка не зависит от порядка ключей (как после загрузки из базы)",
              pg.evaluate("""() => { const b = window.__works.E.variants[0].blocks[0];
                 const rev = o => (o && typeof o === 'object' && !Array.isArray(o)) ? Object.fromEntries(Object.keys(o).reverse().map(k => [k, rev(o[k])])) : o;
                 const canon = window.__works.canon; const keys = (t, e) => canon(t) + '|' + canon(e);
                 return keys(b.task, b.exact) === keys(rev(b.task), rev(b.exact)); }"""))
        back_to_catalog(pg)

        # ═══ D. «Степени»: ограничения ═══
        print("\n— D. «Степени»: галочка")
        clear_work(pg)
        open_in_frame(pg, "powers", "curMode = 'p2'; curSubMode = 'exam'; openTask();")
        set_count(pg, 14)
        was = pg.evaluate("() => document.getElementById('trFrame').contentWindow.eval('hardCtl.get()')")
        check("D0 галочка по умолчанию выключена", was is False, str(was))
        press_add(pg, 200000)
        off = vblocks(pg); off_s = sigs(pg)
        check("D1 без галочки добавлено 14 разных", len(off) == 14 and len({key(b) for b in off}) == 14, f"{len(off)} / {len({key(b) for b in off})}")
        check("D2 без галочки hardNums = false у всех", all(b["exact"].get("hardNums") is False for b in off), str([b["exact"].get("hardNums") for b in off]))
        bad = [nonpos_exps(s) for s in off_s if nonpos_exps(s)]
        check("D3 без галочки ни одной степени ≤ 0 в условиях", not bad, str(bad[:3]))
        clear_work(pg)
        pg.evaluate("() => document.getElementById('trFrame').contentDocument.getElementById('hardToggle').click()")
        pg.wait_for_timeout(500)
        check("D4 галочка в кадре включена", pg.evaluate("() => document.getElementById('trFrame').contentWindow.eval('hardCtl.get()')") is True)
        set_count(pg, 20)
        press_add(pg, 240000)
        on = vblocks(pg); on_s = sigs(pg)
        check("D5 с галочкой добавлено 20 разных", len(on) == 20 and len({key(b) for b in on}) == 20, f"{len(on)} / {len({key(b) for b in on})}")
        check("D6 с галочкой hardNums = true у всех", all(b["exact"].get("hardNums") is True for b in on))
        hard = [s for s in on_s if nonpos_exps(s)]
        check("D7 с галочкой трудные задания (степень ≤ 0) встречаются", len(hard) >= 1, f"{len(hard)} из {len(on_s)}")
        pg.evaluate("() => document.getElementById('trFrame').contentDocument.getElementById('hardToggle').click()")  # вернуть
        back_to_catalog(pg)

        # ═══ E. заданий не хватает ═══
        print("\n— E. заданий не хватает")
        clear_work(pg)
        open_in_frame(pg, "egeb8", "document.querySelectorAll('.mode-card')[0].click()")
        set_count(pg, 30)
        press_add(pg, 200000)
        eg = vblocks(pg)
        check("E1 ЕГЭ база №8: добавлено 3 (прототипов три), все разные",
              len(eg) == 3 and len({b["gen"]["pid"] for b in eg}) == 3, str([b["gen"]["pid"] for b in eg]))
        t = pg.inner_text("#toast")
        check("E2 сообщение «Добавлено 3 из 30: …больше нет»", "Добавлено 3 из 30" in t and "больше нет" in t, t)
        # повторное нажатие — новых нет, но и дублей тоже
        press_add(pg, 200000)
        check("E3 повторная пачка не добавляет дублей и говорит, что новых нет",
              len(vblocks(pg)) == 3 and "уже в работе" in pg.inner_text("#toast"), f"{len(vblocks(pg))}: {pg.inner_text('#toast')}")
        back_to_catalog(pg)
        clear_work(pg)
        open_in_frame(pg, "ege6", "document.querySelectorAll('.mode-card')[0].click()")
        set_count(pg, 30)
        press_add(pg, 120000)
        t = pg.inner_text("#toast")
        check("E4 ЕГЭ профиль №6 (один прототип): одно задание и понятное сообщение",
              len(vblocks(pg)) == 1 and "из 30" in t and "один прототип" in t, f"{len(vblocks(pg))}: {t}")
        back_to_catalog(pg)

        # ═══ F. «Остановить» ═══
        print("\n— F. «Остановить»")
        clear_work(pg)
        open_in_frame(pg, "oge6", "document.querySelectorAll('.mode-card:not(.soon)')[2].click()")
        set_count(pg, 30)
        pg.click("#addBtn")
        # задания попадают в работу в конце пачки, поэтому ход пачки видно по надписи на заслонке
        pg.wait_for_function("() => { const m = /задание (\\d+) из 30/.exec(document.getElementById('frameCoverText').textContent); return !!m && +m[1] >= 3; }", timeout=60000)
        pg.click("#batchStop")
        pg.wait_for_function("() => !document.getElementById('addBtn').disabled", timeout=60000)
        pg.wait_for_timeout(300)
        n = len(vblocks(pg))
        t = pg.inner_text("#toast")
        check("F1 остановлено: добавлено меньше 30, но не ноль", 2 <= n < 30, str(n))
        check("F2 сообщение «Добавлено K из 30: остановлено»", f"Добавлено {n} из 30" in t and "остановлено" in t, t)
        check("F3 «Остановить» спрятана, поле доступно", pg.is_hidden("#batchStop") and pg.is_enabled("#addCount"))

        check("H нет ошибок JavaScript", not errors, str(errors[:2]))
        browser.close()

    print("\nСбои:", FAILS if FAILS else "нет")
    raise SystemExit(1 if FAILS else 0)


if __name__ == "__main__":
    run()
