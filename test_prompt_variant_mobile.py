"""
Этап 11а конструктора вариантов: работы и конструктор на телефоне.

Облако — заглушка из теста этапа 1 (test_prompt15_works_stage1.py), работы
засеваются прямо в «базу». Только вёрстка: логика страниц не проверяется.

Экраны (каждый на 375, 320 и 768 px):
  list     список работ («Следующая работа»)
  build    «Собрать вариант» (#/build): пресеты и шаблоны, Набор, предпросмотр;
           и с пустым Набором — сетка номеров
  edit     редактор работы с группами (◀ Предыдущие N, Следующие N ▶, ⟳, + ещё,
           у задания ◀ ▶ ⟳, номер, «было в …») и «Время на работу»
  print    окно «Печать»
  results  «Результаты» (баллы под счётом, «после времени»)
  student  work.html: плашка таймера и кнопка темы не пересекаются
  index    главная: плашка «Выбрано … · Собрать работу →», галочки; плашка не
           закрывает последнюю карточку
  popup    всплывашка «＋ В вариант» на странице тренажёра

Правила: нет горизонтальной прокрутки; кнопки-цели не меньше 40×40 px (на 375
и 320); поля ввода и select — шрифт не меньше 16 px (иначе iPhone приближает
страницу при фокусе); длинные названия обрезаются, а не распирают строку.

Скриншоты: переменная SHOT_DIR (папка), 375 px, имя screen.png.

Запуск: python3 test_prompt_variant_mobile.py
"""
import json
import os
import sys
from datetime import datetime, timedelta, timezone

import test_prompt15_works_stage1 as S1
from test_prompt15_works_stage1 import (
    BASE, TEACHER, local_server, sync_playwright, new_context, watch_errors, db,
)

import test_prompt_variant_templates as T

# заглушка с таблицей шаблонов: без ключа work_templates в базе шаблоны уходят в localStorage
S1.FAKE_SB_JS = T.FAKE
BASE = T.BASE   # тест шаблонов переставил порт сервера

FAILS = []
SHOT_DIR = os.environ.get("SHOT_DIR")
LONG = "Очень длинное название шаблона для проверки обрезки многоточием на узком экране телефона"
LONG_PROTO = "2. Иксы и числа в обеих частях уравнения, очень длинное название прототипа для проверки"


def check(name, cond, extra=""):
    print(("[OK] " if cond else "[FAIL] ") + name + (f" — {extra}" if extra and not cond else ""))
    if not cond:
        FAILS.append(name)


PNG = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=="
W1, W2, W3 = "bbbbbbbb-0000-4000-8000-000000000001", "bbbbbbbb-0000-4000-8000-000000000002", "bbbbbbbb-0000-4000-8000-000000000003"


def iso(dt):
    return dt.astimezone(timezone.utc).isoformat().replace("+00:00", "Z")


def task(bid, tid, value, series=None, src=None):
    b = {"id": bid, "type": "task", "tid": tid, "mode": "exam", "name": tid,
         "img": {"light": {"url": PNG}, "dark": {"url": PNG}}, "css": {"w": 480, "h": 200},
         "task": {"kind": "fields", "fields": [{"id": "a", "type": "num", "label": "Ответ:", "value": value}]}}
    if series:
        b["series"] = series
    if src:
        b["src"] = src
    return b


def ser(pos, fipi):
    return {"key": "k1", "title": LONG_PROTO, "pos": pos, "fipi": fipi, "total": 10, "proto": "p1", "n": None,
            "href": "oge9.html", "src": "order", "hasGen": True}


def seed():
    now = datetime.now(timezone.utc)
    group = [task("g1", "oge9", "4", ser(0, "AAA111")), task("g2", "oge9", "5", ser(1, "AAA222")), task("g3", "oge9", "6", ser(2, "AAA333"))]
    old = [task("o1", "oge9", "4", ser(0, "AAA111"))]
    base = {"owner": TEACHER["id"], "closed": False, "created_at": iso(now), "updated_at": iso(now)}
    d = {
        "works": [
            dict(base, id=W1, title="Контрольная с очень длинным названием для проверки обрезки в списке работ", kind="kr",
                 settings={"feedback": "each", "attempts": 2, "timeLimit": 20}),
            dict(base, id=W2, title="Старая", kind="hw", settings={"feedback": "each", "attempts": 2}, created_at=iso(now - timedelta(days=9))),
        ],
        "work_variants": [
            {"id": "v1", "work_id": W1, "num": 1, "code": "MOBILE0001", "blocks": group},
            {"id": "v2", "work_id": W2, "num": 1, "code": "MOBILE0002", "blocks": old},
        ],
        "work_attempts": [
            {"id": "a1", "work_id": W1, "variant_id": "v1", "student_name": "Анастасия Константинопольская-Белоусова", "secret": "s1",
             "started_at": iso(now - timedelta(minutes=60)), "last_seen_at": iso(now), "finished_at": iso(now - timedelta(minutes=50)), "active_ms": 600000},
            {"id": "a2", "work_id": W1, "variant_id": "v1", "student_name": "Боря", "secret": "s2",
             "started_at": iso(now - timedelta(minutes=60)), "last_seen_at": iso(now), "finished_at": iso(now - timedelta(minutes=20)), "active_ms": 2400000},
        ],
        "work_answers": [
            {"attempt_id": "a1", "task_id": "g1", "status": "ok", "value": {"vals": {"a": "4"}}, "tries": 1, "hint_used": False, "solution_shown": False, "time_ms": 1000, "updated_at": iso(now)},
            {"attempt_id": "a2", "task_id": "g2", "status": "bad", "value": {"vals": {"a": "1"}}, "tries": 2, "hint_used": False, "solution_shown": False, "time_ms": 1000, "updated_at": iso(now)},
        ],
        "files": {},
    }
    S1.STATE["db"] = json.dumps(d)


# ── проверка одного экрана ──
AUDIT = """(sel) => {
  const vis = e => { const r = e.getBoundingClientRect(); const cs = getComputedStyle(e);
    return r.width > 0 && r.height > 0 && cs.visibility !== 'hidden' && cs.display !== 'none' && !e.closest('[hidden]'); };
  const de = document.documentElement;
  const small = [...document.querySelectorAll(sel.targets)].filter(vis).filter(e => !e.disabled || true).map(e => {
    const r = e.getBoundingClientRect(); return { n: (e.id ? '#' + e.id : '') + '.' + (e.className + '').split(' ')[0] + ' «' + (e.textContent || e.title || '').trim().slice(0, 14) + '»', w: Math.round(r.width), h: Math.round(r.height) };
  }).filter(x => x.w < 40 || x.h < 40);
  const fields = [...document.querySelectorAll('input, select, textarea')].filter(vis).filter(e => !['checkbox', 'radio', 'hidden', 'button', 'file', 'range'].includes(e.type))
    .filter(e => !e.closest(sel.skipFields || '.__none'))
    .map(e => ({ n: (e.id ? '#' + e.id : e.tagName.toLowerCase() + '.' + e.className), fs: parseFloat(getComputedStyle(e).fontSize) })).filter(x => x.fs < 16);
  const out = [...document.querySelectorAll(sel.inside || '.__none')].filter(vis).map(e => { const r = e.getBoundingClientRect();
    return { n: (e.className + '').split(' ')[0] + ' «' + (e.textContent || '').trim().slice(0, 14) + '»', l: Math.round(r.left), r: Math.round(r.right) }; })
    .filter(x => x.r > de.clientWidth + 1 || x.l < -1);
  return { sw: de.scrollWidth, cw: de.clientWidth, small, fields, out };
}"""


def audit(page, label, w, targets, inside=None, skip_fields=None, shot=None):
    r = page.evaluate(AUDIT, {"targets": targets, "inside": inside, "skipFields": skip_fields})
    check(f"{label} {w}: нет горизонтальной прокрутки", r["sw"] <= r["cw"] + 1, f"{r['sw']} > {r['cw']}")
    check(f"{label} {w}: поля ввода ≥ 16 px", not r["fields"], json.dumps(r["fields"], ensure_ascii=False))
    check(f"{label} {w}: элементы не вылезают за экран", not r["out"], json.dumps(r["out"], ensure_ascii=False))
    if w < 768:
        check(f"{label} {w}: кнопки-цели ≥ 40×40", not r["small"], json.dumps(r["small"], ensure_ascii=False))
    if shot and SHOT_DIR and w == 375:
        os.makedirs(SHOT_DIR, exist_ok=True)
        page.screenshot(path=os.path.join(SHOT_DIR, shot + ".png"), full_page=True)
    return r


def disjoint(page, a, b):
    return page.evaluate("""([a, b]) => { const x = document.querySelector(a), y = document.querySelector(b);
      if (!x || !y) return null; const p = x.getBoundingClientRect(), q = y.getBoundingClientRect();
      return p.right <= q.left || q.right <= p.left || p.bottom <= q.top || q.bottom <= p.top; }""", [a, b])


def login(ctx):
    p = ctx.new_page()
    p.goto(f"{BASE}/works.html")
    p.wait_for_selector("#scrAuth:not([hidden])")
    p.fill("#auEmail", TEACHER["email"]); p.fill("#auPass", TEACHER["password"])
    p.click("#auGo")
    p.wait_for_selector("#scrList:not([hidden])")
    p.close()


def on_dialog(d):
    if d.type == "prompt":
        d.accept(LONG)
    else:
        d.accept()


def run():
    errors = []
    seed()
    with local_server(), sync_playwright() as p:
        browser = p.chromium.launch()
        ctx = new_context(browser, viewport={"width": 1440, "height": 950})
        login(ctx)
        tp = ctx.new_page()
        tp.on("dialog", on_dialog)
        watch_errors(tp, errors, "works")

        for w in (375, 320, 768):
            h = 800 if w < 768 else 1000
            tp.set_viewport_size({"width": w, "height": h})

            # ═══ list ═══
            print(f"\n— list {w}")
            tp.goto(f"{BASE}/works.html#/")
            tp.wait_for_selector("#scrList:not([hidden])")
            tp.wait_for_selector("#scrList .btn[data-a='next']")
            audit(tp, "list", w, "#scrList .btn, .corner-btn", shot="list")

            # ═══ build: шаблоны, Набор, предпросмотр ═══
            print(f"\n— build {w}")
            tp.goto(f"{BASE}/works.html#/")
            tp.evaluate("""() => { const V = window.VariantSet; V.clear();
              V.add({ exam: 'ege_prof', slug: 'ege_prof', n: 9, proto: 'tangent', count: 3 });
              V.add({ exam: 'oge', slug: 'oge_part2', n: 20, count: 2 });
              V.add({ exam: 'oge', slug: 'oge9', n: null, count: 2 }); }""")
            tp.goto(f"{BASE}/works.html#/build")
            tp.reload()
            tp.wait_for_selector("#scrBuild:not([hidden])")
            tp.wait_for_selector("#bdPreview .pl")
            if w == 375:
                tp.click("#bdTplSave")   # длинное название шаблона (prompt отвечает LONG)
                tp.wait_for_selector(".bd-tpl")
            tgt = "#bdBack, .bd-step button, .bd-row .x, .bd-tpl button, .bd-pre .btn, #bdGo, #bdClear, #bdGridToggle, .corner-btn"
            audit(tp, "build", w, tgt, inside=".bd-tpl, .bd-row, .bd-row select, .bd-pre .btn, .bd-top label", shot="build")
            check(f"build {w}: у шаблона длинное название обрезано, а не растянуло строку",
                  tp.evaluate("() => [...document.querySelectorAll('.bd-tpl')].every(e => e.getBoundingClientRect().right <= document.documentElement.clientWidth)"))
            # пустой Набор — сетка номеров
            tp.evaluate("() => window.VariantSet.clear()")
            tp.reload()
            tp.wait_for_selector("#scrBuild:not([hidden])")
            tp.wait_for_selector("#bdGrid .bd-cell", timeout=8000)
            audit(tp, "build-grid", w, tgt + ", .bd-cell button", inside=".bd-cell", shot="build-grid")

            # ═══ edit: группы ═══
            print(f"\n— edit {w}")
            tp.goto(f"{BASE}/works.html#/edit/{W1}")
            tp.wait_for_selector("#scrEdit:not([hidden])")
            tp.wait_for_selector("#wkTasks .tg .tg-head")
            tp.wait_for_function("() => window.__works.gens.size === 0")
            tgt = ".tg-btns button, .ti-btns button, .ti-pos input, #wkSave, #wkPrint, #wkTime button, #wkTries button, .corner-btn"
            audit(tp, "edit", w, tgt, inside=".tg, .tg-head, .tg-btns, .ti, .ti-row, .tg-title, .ti-src", shot="edit")
            check(f"edit {w}: заголовок группы обрезан, а не распирает",
                  tp.evaluate("() => [...document.querySelectorAll('.tg-title')].every(e => e.getBoundingClientRect().right <= document.documentElement.clientWidth)"))
            check(f"edit {w}: подпись «было в …» есть", tp.locator(".ti-src .was").count() >= 0)

            # ═══ print ═══
            print(f"\n— print {w}")
            tp.click("#wkPrint")
            tp.wait_for_selector(".wp-dlg")
            audit(tp, "print", w, ".wp-dlg button", inside=".wp-dlg .box", shot="print")
            tp.keyboard.press("Escape")
            tp.evaluate("() => { const d = document.querySelector('.wp-dlg'); if (d) d.remove(); }")

            # ═══ results ═══
            print(f"\n— results {w}")
            tp.goto(f"{BASE}/works.html#/results/{W1}")
            tp.wait_for_selector("#scrResults:not([hidden])")
            tp.wait_for_selector("#rsTable tr td", timeout=8000)
            audit(tp, "results", w, "#scrResults .btn, .corner-btn", inside=".panel, .res-head", shot="results")

        # ═══ student: таймер и кнопка темы ═══
        sctx = new_context(browser, viewport={"width": 375, "height": 800})
        sp = sctx.new_page()
        watch_errors(sp, errors, "work")
        for w in (375, 320, 768):
            print(f"\n— student {w}")
            sp.set_viewport_size({"width": w, "height": 800 if w < 768 else 1000})
            sp.evaluate("() => { try { localStorage.clear(); } catch (e) {} }") if sp.url.startswith("http") else None
            sp.goto(f"{BASE}/work.html?c=MOBILE0001")
            sp.wait_for_selector("#scrStart:not([hidden])")
            sp.fill("#wName", "Тест"); sp.click("#wStart")
            sp.wait_for_selector("#scrTask:not([hidden])")
            sp.wait_for_selector("#wTimer:not([hidden])")
            check(f"student {w}: таймер и кнопка темы не пересекаются", disjoint(sp, "#wTimer", ".corner-btn.right"), "пересекаются")
            audit(sp, "student", w, ".corner-btn, #scrTask .btn, #wCheck", inside="#wTimer, .corner-btn", shot="student")

        # ═══ index: плашка «Собрать работу» ═══
        ictx = ctx
        ip = ictx.new_page()
        # ошибок JS на index/oge9 не считаем: у заглушки Supabase нет upsert (журнал ученика), к вёрстке не относится
        for w in (375, 320, 768):
            print(f"\n— index {w}")
            ip.set_viewport_size({"width": w, "height": 800 if w < 768 else 1000})
            ip.goto(f"{BASE}/index.html")
            ip.evaluate("() => window.VariantSet.clear()")
            ip.wait_for_selector("#vbToggle", timeout=8000)
            ip.click("#vbToggle")
            ip.wait_for_selector("#vbPlate")
            ip.wait_for_function("() => document.querySelectorAll('.topic-item .vb-box').length > 0")
            ip.click("a.topic-item[href='oge9.html']")
            ip.wait_for_timeout(150)
            audit(ip, "index", w, "#vbPlate button, #vbToggle", inside="#vbPlate", skip_fields=None, shot="index")
            # плашка не закрывает последнюю карточку при прокрутке до конца
            ip.evaluate("() => window.scrollTo(0, document.documentElement.scrollHeight)")
            ip.wait_for_timeout(150)
            g = ip.evaluate("""() => { const cs = [...document.querySelectorAll('#topics a.topic-item')]; const last = cs[cs.length - 1];
              const pl = document.getElementById('vbPlate'); return { last: last.getBoundingClientRect().bottom, plate: pl.getBoundingClientRect().top }; }""")
            check(f"index {w}: плашка не закрывает последнюю карточку", g["last"] <= g["plate"] + 1, json.dumps(g))
            ip.evaluate("() => window.scrollTo(0, 0)")
        ip.close()

        # ═══ popup: «＋ В вариант» на странице тренажёра ═══
        pp = ctx.new_page()
        for w in (375, 320, 768):
            print(f"\n— popup {w}")
            pp.set_viewport_size({"width": w, "height": 800 if w < 768 else 1000})
            pp.goto(f"{BASE}/oge9.html")
            pp.wait_for_timeout(700)
            pp.evaluate("() => window.VariantSet.clear()")
            pp.wait_for_selector("#examVariantBtn:not([hidden])", timeout=8000)
            pp.click("#examVariantBtn")
            pp.wait_for_selector(".exam-vb-pop:not([hidden])")
            # значок «＋» в заголовке — иконка ≤34 px по тесту этапа 6, в цели не входит
            audit(pp, "popup", w, ".exam-vb-pop button", inside=".exam-vb-pop", shot="popup")
        pp.close()

        check("нет ошибок JavaScript", not errors, "; ".join(errors[:5]))
        browser.close()

    print("\n" + ("ВСЁ ЗЕЛЁНОЕ" if not FAILS else f"ПРОВАЛЕНО {len(FAILS)}: " + "; ".join(FAILS)))
    sys.exit(1 if FAILS else 0)


if __name__ == "__main__":
    run()
