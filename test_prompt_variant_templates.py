"""
Этап 8 конструктора вариантов (works.html, #/build): пресеты и свои шаблоны.

Заглушка Supabase — из теста этапа 1 работ, с таблицей work_templates:
пока в базе-заглушке нет ключа work_templates, запрос к ней отвечает
«relation … does not exist» (как настоящая база до запуска
work-templates-schema.sql).

Проверяет:
  A. «Часть 1» ОГЭ кладёт в Набор №1–19 (все позиции part 1 из ExamSpec),
     «Часть 2» есть у ОГЭ и нет у ЕГЭ профиля (part неизвестен);
     «Домашка» — три первых номера ×3; пресет заменяет Набор, «Вернуть набор»;
  B. без таблицы: «Сохранить как шаблон» из 2 строк → шаблон в localStorage
     с пометкой «только на этом компьютере», в базе ничего;
  C. таблица появилась — шаблон сам уезжает в облако под тем же id;
  D. «Открыть» → Набор тот же (номер, прототип, по сколько), предпросмотр с ФИПИ 1–3;
  E. собрать из шаблона ×3 по порядку и сохранить работу → settings.templateId,
     у шаблона next_pos 3 (и номер ФИПИ на месте 3) у обеих строк;
  F. открыть шаблон снова → предпросмотр «ФИПИ 4–6», в дереве «с №4»;
  G. переименование и удаление (confirm) шаблона;
  H. нет ошибок JavaScript.

Запуск: python3 test_prompt_variant_templates.py
"""
import json
import sys

import test_prompt15_works_stage1 as S1
from test_prompt15_works_stage1 import (
    TEACHER, local_server, sync_playwright, new_context, watch_errors, db,
)

# свой порт: тесты работ других сессий сидят на 8960 одновременно с этим
S1.PORT = 8968
BASE = f"http://127.0.0.1:{S1.PORT}"

FAILS = []


def check(name, cond, extra=""):
    print(("[OK] " if cond else "[FAIL] ") + name + (f" — {extra}" if extra and not cond else ""))
    if not cond:
        FAILS.append(name)


# заглушка с таблицей work_templates (своя у учителя, как works)
FAKE = (S1.FAKE_SB_JS
        .replace("work_answers: r => atts.has(r.attempt_id) };",
                 "work_answers: r => atts.has(r.attempt_id), work_templates: r => r.owner === uid };")
        .replace("if (!uid) throw new Error('permission denied for table ' + this.t);",
                 "if (!uid) throw new Error('permission denied for table ' + this.t);\n"
                 "      if (this.t === 'work_templates' && !db.work_templates) throw new Error('relation \"public.work_templates\" does not exist');")
        .replace("if (this.t === 'works'){ r.owner = r.owner || uid;",
                 "if (this.t === 'work_templates') r.owner = r.owner || uid;\n          if (this.t === 'works'){ r.owner = r.owner || uid;"))
assert FAKE.count("work_templates") >= 4, "заглушка не пропатчилась"

PROMPT = {"text": ""}


def on_dialog(d):
    if d.type == "prompt":
        d.accept(PROMPT["text"])
    else:
        d.accept()


def idle(page, timeout=180000):
    page.wait_for_function("() => window.__works.gens.size === 0", timeout=timeout)
    page.wait_for_timeout(200)


def preview(page):
    return page.evaluate("() => [...document.querySelectorAll('#bdPreview .pl')].map(e => ({ ok: e.dataset.ok === '1', t: e.textContent }))")


def rows(page):
    return page.evaluate("() => window.VariantSet.all().map(r => [r.exam, r.slug, r.n, r.proto, r.count])")


def open_build(page):
    page.goto(f"{BASE}/works.html#/build")
    page.wait_for_selector("#scrBuild:not([hidden])")
    page.wait_for_function("() => window.__works.TPL.loaded")


def tpl_db():
    return db().get("work_templates")


def run():
    errors = []
    with local_server(), sync_playwright() as p:
        browser = p.chromium.launch()
        tctx = new_context(browser, viewport={"width": 1440, "height": 950})
        tctx.route("**/supabase-js.umd.js", lambda r: r.fulfill(status=200, content_type="application/javascript", body=FAKE))
        tp = tctx.new_page()
        tp.on("dialog", on_dialog)
        watch_errors(tp, errors, "works")
        tp.goto(f"{BASE}/works.html")
        tp.wait_for_selector("#scrAuth:not([hidden])")
        tp.fill("#auEmail", TEACHER["email"]); tp.fill("#auPass", TEACHER["password"])
        tp.click("#auGo")
        tp.wait_for_selector("#scrList:not([hidden])")
        cat = tp.evaluate("async () => await (await fetch('catalog-index.json')).json()")
        fipi9 = next(x for x in cat["oge9|"]["protos"] if x["id"] == "p1")["fipi"]
        fipi7 = next(x for x in cat["oge7|"]["protos"] if x["id"] == "sign_diff_negative")["fipi"]

        # ═══ A. пресеты ═══
        print("\n— A. пресеты")
        open_build(tp)
        tp.evaluate("() => window.VariantSet.clear()")
        tp.select_option("#bdExam", "oge")
        check("A1 у ОГЭ есть «Часть 1» и «Часть 2»", tp.is_visible("#bdPart1") and tp.is_visible("#bdPart2"))
        tp.click("#bdPart1")
        tp.wait_for_timeout(150)
        want = tp.evaluate("() => ExamSpec.exams.oge.list.filter(p => p.part === 1).map(p => [p.slug, p.n == null ? null : p.n, p.label])")
        got = rows(tp)
        check("A2 «Часть 1» ОГЭ — все позиции №1–19 (12 строк)",
              [[r[1], r[2]] for r in got] == [[w[0], w[1]] for w in want] and len(got) == 12
              and want[0][2] == "№1–5" and want[-1][2] == "№19", f"{got} / {want}")
        tp.click("#bdHw")
        tp.wait_for_timeout(150)
        got = rows(tp)
        check("A3 «Домашка» — три первых номера ×3", [[r[1], r[4]] for r in got] == [[w[0], 3] for w in want[:3]], str(got))
        check("A4 пресет заменил Набор — в тосте «Вернуть набор»", tp.is_visible("#toastAct"))
        tp.click("#toastAct")
        tp.wait_for_timeout(150)
        check("A5 «Вернуть набор» — снова «Часть 1»", len(rows(tp)) == 12, str(len(rows(tp))))
        tp.select_option("#bdExam", "ege_prof")
        check("A6 у ЕГЭ профиля (part неизвестен) кнопок частей нет", tp.is_hidden("#bdPart1") and tp.is_hidden("#bdPart2"))
        tp.select_option("#bdExam", "oge")

        # ═══ B. шаблон без таблицы ═══
        print("\n— B. шаблон без таблицы")
        tp.evaluate("""() => { const V = window.VariantSet; V.clear();
          V.add({ exam: 'oge', slug: 'oge9', n: null, proto: 'p1', count: 3 });
          V.add({ exam: 'oge', slug: 'oge7', n: null, proto: 'sign_diff_negative', count: 3 }); }""")
        orig = rows(tp)
        tp.fill("#bdVars", "1"); tp.dispatch_event("#bdVars", "input")
        tp.fill("#bdStart", "1"); tp.dispatch_event("#bdStart", "input")
        PROMPT["text"] = "Мой шаблон"
        tp.click("#bdTplSave")
        tp.wait_for_selector(".bd-tpl")
        loc = tp.evaluate("() => JSON.parse(localStorage.getItem('workTemplates:v1') || '[]')")
        check("B1 шаблон в localStorage, 2 строки", len(loc) == 1 and len(loc[0]["items"]) == 2 and loc[0]["title"] == "Мой шаблон", json.dumps(loc, ensure_ascii=False)[:300])
        check("B2 пометка «только на этом компьютере»", "только на этом компьютере" in tp.inner_text(".bd-tpl"), tp.inner_text(".bd-tpl"))
        check("B3 в базе шаблонов нет (таблицы нет)", tpl_db() is None)
        check("B4 шаблон в список работ не попал", not db()["works"])
        tid_local = loc[0]["id"]

        # ═══ C. таблица появилась — перенос в облако ═══
        print("\n— C. перенос в облако")
        d = db(); d["work_templates"] = []; S1.STATE["db"] = json.dumps(d)
        tp.reload()
        tp.wait_for_selector("#scrBuild:not([hidden])")
        tp.wait_for_function("() => window.__works.TPL.loaded")
        cl = tpl_db()
        check("C1 шаблон уехал в облако под тем же id", cl and len(cl) == 1 and cl[0]["id"] == tid_local and cl[0]["owner"] == TEACHER["id"], json.dumps(cl, ensure_ascii=False)[:300])
        check("C2 в localStorage пусто, пометки нет",
              tp.evaluate("() => JSON.parse(localStorage.getItem('workTemplates:v1') || '[]').length") == 0
              and tp.locator(".bd-tpl .tpl-local").count() == 0)

        # ═══ D. открыть шаблон ═══
        print("\n— D. открыть шаблон")
        tp.click("#bdHw")   # другой Набор, чтобы шаблон его заменил
        tp.wait_for_timeout(100)
        tp.click(".bd-tpl [data-t='open']")
        tp.wait_for_timeout(200)
        check("D1 Набор тот же (номер, прототип, по сколько)", rows(tp) == orig, f"{rows(tp)} / {orig}")
        pv = preview(tp)
        check("D2 предпросмотр: ФИПИ 1–3 у обеих строк",
              len(pv) == 2 and all(x["ok"] for x in pv) and pv[0]["t"].endswith("ФИПИ 1–3 из " + str(len(fipi9))) and pv[1]["t"].endswith("ФИПИ 1–3 из " + str(len(fipi7))),
              json.dumps(pv, ensure_ascii=False))

        # ═══ E. собрать из шаблона и сохранить ═══
        print("\n— E. собрать и сохранить")
        tp.click("#bdGo")
        tp.wait_for_selector("#scrEdit:not([hidden])")
        tp.wait_for_function("() => window.__works.E.blocks.length === 6", timeout=60000)
        idle(tp)
        info = tp.evaluate("() => ({ tpl: window.__works.E.settings.templateId, rows: window.__works.E.blocks.map(b => b.series ? [b.series.tplRow, b.series.pos] : null) })")
        check("E1 работа помнит шаблон, группы — строку шаблона",
              info["tpl"] == tid_local and info["rows"] == [[0, 0], [0, 1], [0, 2], [1, 0], [1, 1], [1, 2]], json.dumps(info))
        # листание «Следующие» не двигает шаблон — только «Сохранить»
        before = tpl_db()[0]["items"]
        check("E2 до «Сохранить» next_pos не сдвинут", all(it.get("next_pos") is None for it in before), json.dumps(before, ensure_ascii=False)[:300])
        tp.fill("#wkTitle", "Из шаблона")
        tp.click("#wkSave")
        tp.wait_for_function("() => document.getElementById('wkSaved').textContent.indexOf('Сохранено ') === 0", timeout=120000)
        items = tpl_db()[0]["items"]
        check("E3 у шаблона next_pos 3 у обеих строк", [it.get("next_pos") for it in items] == [3, 3], json.dumps(items, ensure_ascii=False)[:400])
        check("E4 и номер ФИПИ места 3", [it.get("next_fipi") for it in items] == [fipi9[3], fipi7[3]], str([it.get("next_fipi") for it in items]))
        w = db()["works"]
        check("E5 работа сохранена с settings.templateId", len(w) == 1 and w[0]["settings"].get("templateId") == tid_local)

        # ═══ F. открыть снова — с места 4 ═══
        print("\n— F. продолжение")
        open_build(tp)
        tp.click(".bd-tpl [data-t='open']")
        tp.wait_for_timeout(200)
        pv = preview(tp)
        check("F1 предпросмотр «ФИПИ 4–6» у обеих строк",
              len(pv) == 2 and all(x["ok"] and "ФИПИ 4–6" in x["t"] for x in pv), json.dumps(pv, ensure_ascii=False))
        check("F2 в дереве «с №4»", tp.locator("#bdTree .bd-row", has_text="с №4").count() == 2)

        # ═══ G. переименование и удаление ═══
        print("\n— G. переименование и удаление")
        PROMPT["text"] = "Домашка 9 класс"
        tp.click(".bd-tpl [data-t='ren']")
        tp.wait_for_function("() => document.querySelector('.bd-tpl b') && document.querySelector('.bd-tpl b').textContent === 'Домашка 9 класс'")
        check("G1 переименован в базе", tpl_db()[0]["title"] == "Домашка 9 класс")
        tp.click(".bd-tpl [data-t='del']")
        tp.wait_for_function("() => !document.querySelector('.bd-tpl')")
        check("G2 удалён из базы", tpl_db() == [])
        check("G3 работа из шаблона на месте", len(db()["works"]) == 1)

        check("H нет ошибок JavaScript", not errors, "; ".join(errors[:5]))
        browser.close()
    print("\nготово" if not FAILS else f"\nПРОВАЛЕНО: {len(FAILS)} — {FAILS}")
    return not FAILS


if __name__ == "__main__":
    sys.exit(0 if run() else 1)
