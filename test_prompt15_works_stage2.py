"""
Промпт №15 «работы», этап 2: «Новый вариант» и ⟳ «другие числа» у заданий
(works.html), результаты учеников разных вариантов в одной таблице.

Заглушка Supabase и помощники — из теста этапа 1
(test_prompt15_works_stage1.py): общая «база» у теста, вход учителя,
тренажёр в кадре конструктора.

Проверяет:
  A. работа из четырёх заданий: «Проценты», ОГЭ №6 (обычный тип), ЕГЭ база
     №8 (готовые прототипы), ОГЭ №6 «Демоверсия» (задание одно);
  B. «+ Новый вариант»: столько же заданий, тот же порядок, тренажёры и
     режимы, связь с образцом (src); числа другие («Проценты», №6), у ЕГЭ —
     другой прототип, у «Демоверсии» — честная пометка «других чисел нет»;
     в варианте нельзя переставлять и удалять — это делается в образце;
  C. ⟳ у задания варианта — другие числа, номер задания прежний;
  D. ⟳ у задания образца — другие числа, связь вариантов не рвётся;
  E. режим, поменянный в образце, — и в варианте;
  F. задание, добавленное в образец, пока открыт вариант 2, создаётся и в
     варианте; G. убранное из образца уходит из варианта;
  H. сохранение: два варианта, разные коды, связь src, без служебных полей
     и без PNG внутри;
  I. вариант 3: удаление до сохранения и после — в базе снова два;
  J. ученик по ссылке варианта 2 видит задания варианта 2, ответ варианта 2
     верен;
  K. результаты: метка «В2», ячейка на месте задания образца, подробности с
     ответом своего варианта, ссылки всех вариантов;
  L. карточка в списке: «вариантов: 2», «Ссылки» — все ссылки строками;
  M. повторное открытие работы: варианты загружаются, задания не
     пересоздаются;
  N. нет ошибок JavaScript.

Запуск: python3 test_prompt15_works_stage2.py
"""
import json
import re
import sys

from test_prompt15_works_stage1 import (
    BASE, TEACHER, local_server, sync_playwright, new_context, watch_errors, db,
    open_in_frame, add_task, back_to_catalog, type_fields, press_check, correct_input,
)

FAILS = []


def check(name, cond, extra=""):
    print(("[OK] " if cond else "[FAIL] ") + name + (f" — {extra}" if extra and not cond else ""))
    if not cond:
        FAILS.append(name)


def E(page, expr):
    return page.evaluate(f"() => {{ const E = window.__works.E; return JSON.parse(JSON.stringify({expr}, (k, v) => (typeof v === 'string' && v.startsWith('data:')) ? 'data:' + v.length : v)); }}")


def wait_gens(page, timeout=90000):
    page.wait_for_function("() => window.__works.gens.size === 0 && window.__works.E.variants.every(v => v.blocks.every(b => !b._gen || b._gen === 'fail'))", timeout=timeout)
    page.wait_for_timeout(200)


def tab(page, i):
    page.click(f'#wkVariants button[data-v="{i}"]')
    page.wait_for_timeout(150)


def fingerprint(b):
    """Чем задание отличается от «такого же»: само задание из снимка моста."""
    ex = b.get("exact") or {}
    for k in ("task", "curTask", "P"):
        if k in ex:
            return json.dumps(ex[k], sort_keys=True)
    return json.dumps(b.get("task"), sort_keys=True)


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
        print("\n— A. работа из четырёх заданий")
        check("A1 «+ Новый вариант» недоступен, пока заданий нет", tp.is_disabled("#varAdd"))
        open_in_frame(tp, "percent", "openProto('parts', 2)"); add_task(tp, 1); back_to_catalog(tp)
        open_in_frame(tp, "oge6", "document.querySelectorAll('.mode-card:not(.soon)')[2].click()"); add_task(tp, 2); back_to_catalog(tp)
        open_in_frame(tp, "egeb8", "document.querySelectorAll('.mode-card')[0].click()"); add_task(tp, 3); back_to_catalog(tp)
        open_in_frame(tp, "oge6", "document.querySelectorAll('.mode-card:not(.soon)')[1].click()"); add_task(tp, 4)
        tp.evaluate("() => document.querySelectorAll('.ti')[0].querySelector('[data-m=\"train\"]').click()")
        tp.fill("#wkTitle", "Варианты")
        check("A2 вкладка «Вариант 1» и «+ Новый вариант»", tp.inner_text("#wkVariants").split("\n")[:2] == ["Вариант 1", "+ Новый вариант"] or "Вариант 1" in tp.inner_text("#wkVariants"))

        # ═══ B ═══
        print("\n— B. новый вариант")
        tp.click("#varAdd")
        check("B1 открылась вкладка «Вариант 2»", "active" in tp.get_attribute('#wkVariants button[data-v="1"]', "class") and tp.is_visible("#varTools"))
        check("B2 задания варианта создаются («Создаётся…»)", "Создаётся" in tp.inner_text("#wkTasks"))
        wait_gens(tp)
        m = E(tp, "E.variants[0].blocks")
        v2 = E(tp, "E.variants[1].blocks")
        check("B3 столько же заданий, в том же порядке, те же тренажёры", len(v2) == 4 and [b["src"] for b in v2] == [b["id"] for b in m]
              and [b["tid"] for b in v2] == [b["tid"] for b in m], str([b.get('tid') for b in v2]))
        check("B4 режимы — как в образце", [b["mode"] for b in v2] == [b["mode"] for b in m] == ["train", "exam", "exam", "exam"], str([b['mode'] for b in v2]))
        check("B5 у каждого задания варианта — свои картинки обеих тем и ответ", all(b.get("img", {}).get("light", {}).get("url") and b["img"].get("dark") and b.get("task") for b in v2))
        check("B6 «Проценты» — другое задание того же прототипа и уровня",
              fingerprint(v2[0]) != fingerprint(m[0]) and v2[0]["exact"]["pid"] == m[0]["exact"]["pid"] and v2[0]["exact"]["lvl"] == m[0]["exact"]["lvl"],
              f"{fingerprint(v2[0])[:80]} / {fingerprint(m[0])[:80]}")
        check("B7 ОГЭ №6 — другое задание того же типа", fingerprint(v2[1]) != fingerprint(m[1]) and v2[1]["exact"]["curMode"] == m[1]["exact"]["curMode"])
        check("B8 ЕГЭ база №8 — другой прототип того же номера", v2[2]["gen"]["pid"] != m[2]["gen"]["pid"] and v2[2]["gen"]["n"] == m[2]["gen"]["n"] == 8,
              f"{v2[2]['gen'].get('pid')} / {m[2]['gen'].get('pid')}")
        check("B9 «Демоверсия» — пометка «других чисел нет»", v2[3].get("same") is True and "других чисел нет" in tp.inner_text("#wkTasks"))
        check("B10 у остальных пометки нет", not any(b.get("same") for b in v2[:3]))
        check("B11 в варианте нет ↑ ↓ ✕ и переключателя режима, есть ⟳",
              tp.locator('#wkTasks [data-a="up"]').count() == 0 and tp.locator('#wkTasks [data-a="rm"]').count() == 0
              and tp.locator('#wkTasks [data-m]').count() == 0 and tp.locator('#wkTasks [data-a="rr"]').count() == 4)
        check("B12 режим в варианте — подписью", tp.inner_text(".ti >> nth=0").find("Тренировка") >= 0)

        # ═══ C ═══
        print("\n— C. ⟳ у задания варианта")
        before = v2[1]
        tp.click('.ti >> nth=1 >> [data-a="rr"]')
        wait_gens(tp)
        after = E(tp, "E.variants[1].blocks[1]")
        check("C1 другие числа, номер задания и связь прежние", fingerprint(after) != fingerprint(before) and after["id"] == before["id"] and after["src"] == before["src"])
        check("C2 тип тот же", after["exact"]["curMode"] == before["exact"]["curMode"])
        ege_before = E(tp, "E.variants[1].blocks[2]")
        tp.click('.ti >> nth=2 >> [data-a="rr"]')
        wait_gens(tp)
        ege_after = E(tp, "E.variants[1].blocks[2]")
        check("C3 ЕГЭ: ⟳ — следующий прототип", ege_after["gen"]["pid"] != ege_before["gen"]["pid"], f"{ege_before['gen']['pid']} → {ege_after['gen']['pid']}")

        # ═══ D ═══
        print("\n— D. ⟳ у задания образца")
        tab(tp, 0)
        check("D1 в образце снова ↑ ↓ ✕ и режимы", tp.locator('#wkTasks [data-a="up"]').count() == 4 and tp.locator('#wkTasks [data-m]').count() == 8)
        m0 = E(tp, "E.variants[0].blocks[0]")
        tp.click('.ti >> nth=0 >> [data-a="rr"]')
        wait_gens(tp)
        m0b = E(tp, "E.variants[0].blocks[0]")
        check("D2 другие числа в образце, id прежний", fingerprint(m0b) != fingerprint(m0) and m0b["id"] == m0["id"] and m0b["mode"] == "train")
        check("D3 вариант 2 по-прежнему связан с ним", E(tp, "E.variants[1].blocks[0].src") == m0["id"])

        # ═══ E ═══
        print("\n— E. режим из образца")
        tp.evaluate("() => document.querySelectorAll('.ti')[1].querySelector('[data-m=\"train\"]').click()")
        tab(tp, 1)
        check("E1 режим задания 2 в варианте — «Тренировка»", E(tp, "E.variants[1].blocks[1].mode") == "train" and "Тренировка" in tp.inner_text(".ti >> nth=1"))

        # ═══ F ═══
        print("\n— F. добавление в образец при открытом варианте")
        back_to_catalog(tp)
        open_in_frame(tp, "add_col", "curLevel = 2; newProblem();")
        add_task(tp, 5)
        wait_gens(tp)
        m = E(tp, "E.variants[0].blocks")
        v2 = E(tp, "E.variants[1].blocks")
        check("F1 задание ушло в образец (5) и создалось в варианте (5)", len(m) == 5 and len(v2) == 5 and v2[4]["src"] == m[4]["id"] and v2[4]["tid"] == "add_col")
        check("F2 в варианте — другой пример", fingerprint(v2[4]) != fingerprint(m[4]))
        check("F3 вкладка не сменилась", "active" in tp.get_attribute('#wkVariants button[data-v="1"]', "class"))

        # ═══ G ═══
        print("\n— G. убрали из образца")
        tab(tp, 0)
        removed = m[2]["id"]
        tp.click('.ti >> nth=2 >> [data-a="rm"]')
        tab(tp, 1)
        v2 = E(tp, "E.variants[1].blocks")
        check("G1 из варианта ушло то же задание", len(v2) == 4 and removed not in [b["src"] for b in v2])

        # ═══ H ═══
        print("\n— H. сохранение")
        tp.click("#wkSave")
        tp.wait_for_function("() => document.getElementById('wkSaved').textContent.indexOf('Сохранено') === 0", timeout=60000)
        d = db()
        vs = sorted(d["work_variants"], key=lambda v: v["num"])
        check("H1 в базе два варианта с разными кодами", len(vs) == 2 and vs[0]["code"] != vs[1]["code"] and [v["num"] for v in vs] == [1, 2])
        check("H2 связь src и порядок сохранены", [b["src"] for b in vs[1]["blocks"]] == [b["id"] for b in vs[0]["blocks"]])
        allb = vs[0]["blocks"] + vs[1]["blocks"]
        # в заглушке хранилище отдаёт загруженное как data:image/webp — PNG
        # снимка (data:image/png) в базе значит «не загрузили»
        keys = sorted({k for b in allb for k in b if k.startswith("_")})
        pngs = sum(1 for b in allb for t in ("light", "dark") if b["img"][t]["url"].startswith("data:image/png"))
        check("H3 без служебных полей и без PNG внутри", not keys and not pngs, f"{keys} / png: {pngs}")
        link2 = tp.input_value("#wkLink")
        check("H4 у варианта 2 — своя ссылка", link2.endswith("c=" + vs[1]["code"]), link2)
        tab(tp, 0)
        check("H5 у варианта 1 — своя", tp.input_value("#wkLink").endswith("c=" + vs[0]["code"]))

        # ═══ I ═══
        print("\n— I. вариант 3 и удаление")
        tp.click("#varAdd"); wait_gens(tp)
        tp.once("dialog", lambda dlg: dlg.accept())
        tp.click("#varDel"); tp.wait_for_timeout(200)
        check("I1 удалён до сохранения — вкладок снова две", tp.locator('#wkVariants button[data-v]').count() == 2)
        tp.click("#varAdd"); wait_gens(tp)
        tp.click("#wkSave")
        tp.wait_for_function("() => document.getElementById('wkSaved').textContent.indexOf('Сохранено') === 0", timeout=60000)
        check("I2 сохранён третий", len(db()["work_variants"]) == 3)
        tp.once("dialog", lambda dlg: dlg.accept())
        tp.click("#varDel"); tp.wait_for_timeout(200)
        tp.click("#wkSave")
        tp.wait_for_function("() => document.getElementById('wkSaved').textContent.indexOf('Сохранено') === 0", timeout=60000)
        tp.wait_for_timeout(300)
        check("I3 удалён после сохранения — в базе снова два", sorted(v["num"] for v in db()["work_variants"]) == [1, 2])
        tp.click("#varAdd"); wait_gens(tp)
        nums = tp.evaluate("() => window.__works.E.variants.map(v => v.num)")
        check("I4 новый вариант — следующий номер", nums == [1, 2, 3], str(nums))
        tp.once("dialog", lambda dlg: dlg.accept())
        tp.click("#varDel"); tp.wait_for_timeout(200)
        tp.click("#wkSave")
        tp.wait_for_function("() => document.getElementById('wkSaved').textContent.indexOf('Сохранено') === 0", timeout=60000)

        # ═══ J ═══
        print("\n— J. ученик по ссылке варианта 2")
        vs = sorted(db()["work_variants"], key=lambda v: v["num"])
        sctx = new_context(browser, viewport={"width": 390, "height": 844}, is_mobile=True, has_touch=True)
        sp = sctx.new_page()
        watch_errors(sp, errors, "work")
        sp.goto(f"{BASE}/work.html?c={vs[1]['code']}")
        sp.wait_for_selector("#scrStart:not([hidden])")
        sp.fill("#wName", "Вася"); sp.click("#wStart")
        sp.wait_for_selector("#scrTask:not([hidden])")
        src = sp.evaluate("() => document.querySelector('.titem.cur .tc-wrap img').src")
        check("J1 у ученика — задания варианта 2", src == vs[1]["blocks"][0]["img"]["light"]["url"])
        type_fields(sp, correct_input(vs[1]["blocks"][0]["task"])); press_check(sp); sp.wait_for_timeout(300)
        check("J2 ответ варианта 2 — верно", "Верно" in sp.inner_text(".titem.cur .wmsg"))
        sp.click("#wFinish"); sp.click("#wConfirmYes")
        sp.wait_for_selector("#scrDone:not([hidden])")

        # ═══ K ═══
        print("\n— K. результаты")
        wid = db()["works"][0]["id"]
        tp.evaluate("() => { window.__works.E.dirty = false; }")
        tp.evaluate(f"() => {{ location.hash = '#/results/{wid}'; }}")
        tp.wait_for_selector("#scrResults:not([hidden])")
        row = tp.inner_text("#rsTable tbody tr:nth-child(1)")
        check("K1 метка варианта и итог 1 / 4", "В2" in row and "1 / 4" in row, row)
        cells = tp.evaluate("() => [...document.querySelectorAll('#rsTable tbody tr:nth-child(1) .cell')].map(c => c.className.replace('cell ', ''))")
        check("K2 ячейка — на месте задания 1", cells[0] == "ok" and len(cells) == 4, str(cells))
        tp.click("#rsTable tbody tr:nth-child(1) .cell >> nth=0")
        det = tp.inner_text("#rsDetail")
        want = str(vs[1]["blocks"][0]["task"]["fields"][0]["value"])
        check("K3 подробности — ответ своего варианта", "вариант 2" in det and want in det, det)
        check("K4 ссылки обоих вариантов", tp.input_value("#rsLink").endswith(vs[0]["code"])
              and tp.locator("#rsMoreLinks input").count() == 1 and tp.input_value("#rsMoreLinks input").endswith(vs[1]["code"]))

        # ═══ L ═══
        print("\n— L. список")
        tp.evaluate("() => { location.hash = '#/'; }")
        tp.wait_for_selector("#scrList:not([hidden])")
        card = tp.inner_text("#workList")
        check("L1 «вариантов: 2», кнопка «Ссылки»", "вариантов: 2" in card and "Ссылки" in card, card)
        tctx.grant_permissions(["clipboard-read", "clipboard-write"], origin=BASE)
        tp.click('[data-a="copy"]'); tp.wait_for_timeout(300)
        clip = tp.evaluate("() => navigator.clipboard.readText()")
        check("L2 скопированы все ссылки строками", clip.count("\n") == 1 and "Вариант 1: " in clip and "Вариант 2: " in clip and vs[1]["code"] in clip, clip)

        # ═══ M ═══
        print("\n— M. повторное открытие")
        tp.evaluate(f"() => {{ location.hash = '#/edit/{wid}'; }}")
        tp.wait_for_selector("#scrEdit:not([hidden])")
        tp.wait_for_timeout(400)
        check("M1 две вкладки вариантов", tp.locator('#wkVariants button[data-v]').count() == 2)
        tab(tp, 1)
        tp.wait_for_timeout(400)
        ids = tp.evaluate("() => window.__works.E.variants[1].blocks.map(b => b.id)")
        check("M2 задания варианта загружены, не пересоздаются", ids == [b["id"] for b in vs[1]["blocks"]] and tp.evaluate("() => window.__works.gens.size") == 0)
        check("M3 изменений нет — «Сохранено»", "Сохранено" in tp.inner_text("#wkSaved"))
        browser.close()

    print("\n— N. ошибки JavaScript")
    check("N1 нет ошибок JavaScript", not errors, "; ".join(errors[:5]))


if __name__ == "__main__":
    run()
    print()
    if FAILS:
        print(f"ПРОВАЛЕНО: {len(FAILS)}")
        for f in FAILS:
            print("  - " + f)
        sys.exit(1)
    print("Все проверки прошли")
