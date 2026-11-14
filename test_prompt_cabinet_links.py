"""
Связи «ученик ↔ расписание», задача В2 плана кабинета: карточка ученика,
боковая панель занятия, сессия из занятия.

Supabase — заглушка из test_prompt_b1_student_memory.py (журнал, upsert с
ignoreDuplicates, range) плюс gte/lte для расписания. Дата в браузере
подменена: среда 18.11.2026, 12:00 (FIXED_NOW_JS из теста расписания).

Проверяет:
  A. карточка ученика: «Ближайшее» — сегодняшнее занятие в 15:00; «Последние» —
     начавшиеся (сегодня в 09:00 и вчерашние) от новых к старым; у прошедшего
     раскрывается «Что решали» — только строки с lesson_id этого занятия
     (строки другого занятия и другого ученика не попадают);
  B. расписание: щелчок по занятию открывает панель; в паре — выбор ученика,
     карточка меняется; «Открыть карточку» ведёт на #/students/<id>;
     «Открыть доску» — привязанная доска ученика, у занятия со своей доской —
     доска занятия, без доски кнопка выключена; гость без карточки — без
     «Начать сессию»; Esc закрывает; «Править занятие» открывает прежнее окно;
  C. «Начать сессию» из занятия: сессия несёт lessonId, событие, записанное
     в сессии, доходит до «сервера» с lesson_id этого занятия; «Закончить
     сессию» её снимает; новое событие видно в карточке в «Что решали»;
  D. нет ошибок JavaScript.

Запуск: python3 test_prompt_cabinet_links.py (сервер поднимается сам).
"""
import json
import sys

from playwright.sync_api import sync_playwright

import test_prompt_b1_student_memory as B1
from test_prompt_b1_student_memory import (BASE, PETYA, STATE, TEACHER, VANYA, check, db, fresh_db,
                                           local_server)

# «сегодня» в браузере — среда 18.11.2026, 12:00, часы идут дальше (как в test_prompt_cabinet_schedule.py;
# тот файл при импорте сам запускает свой прогон, поэтому подмена Date повторена здесь)
FIXED_NOW_JS = r"""
(() => {
  const R = Date, OFF = new R(2026, 10, 18, 12, 0, 0).getTime() - R.now();
  class D extends R {
    constructor(...a){ if (a.length) super(...a); else super(R.now() + OFF); }
    static now(){ return R.now() + OFF; }
  }
  window.Date = D;
})();
"""

# в заглушке B1 нет gte/lte (их зовёт schedule-cloud.listRange)
B1.FAKE_SB_JS = B1.FAKE_SB_JS.replace(
    "    in(c, vs){",
    "    gte(c, v){ this.f.push(r => r[c] >= v); return this; }\n    lte(c, v){ this.f.push(r => r[c] <= v); return this; }\n    in(c, vs){", 1)

OWNER = TEACHER["id"]
L_OLD, L_YDAY, L_MORN, L_NOON, L_NEXT, L_GUEST, L_BOARD = "les-old", "les-yday", "les-morn", "les-noon", "les-next", "les-guest", "les-board"


def lesson(i, day, start, fmt="single", board=None, dur=60):
    return {"id": i, "owner": OWNER, "day": day, "start_min": start, "dur_min": dur, "format": fmt, "is_event": False,
            "title": "", "note": "", "board_id": board, "group_id": None, "from_slot": None, "ext_id": None,
            "created_at": "2026-01-01T00:00:00Z", "updated_at": "2026-01-01T00:00:00Z"}


def person(i, les, sid=None, status="plan", pos=0, guest=None):
    return {"id": i, "owner": OWNER, "lesson_id": les, "student_id": sid, "guest_name": guest, "status": status, "pos": pos}


def seed():
    d = fresh_db()
    d["students"][0]["boards"] = ["bd-vanya"]
    d["students"][0]["note"] = "Слабо знает дроби"
    d["students"][0]["grade"] = "9"
    d["lessons"] = [
        lesson(L_OLD, "2026-11-12", 900),                           # давнее, без записей
        lesson(L_YDAY, "2026-11-17", 900, "pair"),                  # вчера, пара: Ваня и Петя
        lesson(L_MORN, "2026-11-18", 540),                          # сегодня 09:00 — уже началось
        lesson(L_NOON, "2026-11-18", 900),                          # сегодня 15:00 — ближайшее
        lesson(L_NEXT, "2026-11-20", 600),
        lesson(L_GUEST, "2026-11-19", 600),                         # только гость
        lesson(L_BOARD, "2026-11-21", 600, board="bd-lesson"),      # доска занятия
    ]
    d["lesson_students"] = [
        person("p1", L_OLD, VANYA, "done"),
        person("p2", L_YDAY, VANYA, "done", 0), person("p3", L_YDAY, PETYA, "done", 1),
        person("p4", L_MORN, VANYA, "done"),
        person("p5", L_NOON, VANYA, "plan"),
        person("p6", L_NEXT, VANYA, "plan"),
        person("p7", L_GUEST, None, "plan", 0, "Гость Гошин"),
        person("p8", L_BOARD, VANYA, "plan"),
    ]
    mk = lambda i, sid, k, e, at, les: {"id": i, "owner": OWNER, "student_id": sid, "task_key": k, "event": e,
                                        "source": "trainer", "src_ref": "x", "at": at, "lesson_id": les}
    d["student_task_log"] = [
        mk("g1", VANYA, "fipi:oge:2933FB", "ok", "2026-11-17T12:05:00Z", L_YDAY),
        mk("g2", VANYA, "gen:oge9:p3", "bad", "2026-11-17T12:20:00Z", L_YDAY),
        mk("g3", PETYA, "fipi:oge:5", "ok", "2026-11-17T12:25:00Z", L_YDAY),     # другой ученик — не в карточке Вани
        mk("g4", VANYA, "gen:oge9:p1", "ok", "2026-11-18T06:10:00Z", L_MORN),
        mk("g5", VANYA, "fipi:oge:777", "hw", "2026-11-10T10:00:00Z", None),       # без занятия
    ]
    return d



def open_lesson(p, lid):
    # «Строки» (редизайн 14.11): панель занятия — из меню «⋯» строки
    sel = f'.rw-row[data-id="{lid}"]'
    if p.locator(".sc-side").count():                 # открытая панель закрывает правый край строк
        p.keyboard.press("Escape")
        p.wait_for_selector(".sc-side", state="detached")
    p.hover(sel)
    p.click(sel + " .rw-more")
    p.click(".gm-menu.on .gm-item:has-text('Открыть занятие')")

def main():
    errors = []
    STATE["db"] = json.dumps(seed())
    STATE["offline"] = False
    with local_server(), sync_playwright() as pw:
        browser = pw.chromium.launch()
        ctx = B1.new_context(browser, signed_in=True, bind="tab")
        ctx.add_init_script(FIXED_NOW_JS)
        p = ctx.new_page()
        p.on("pageerror", lambda e: errors.append(str(e)))
        p.set_viewport_size({"width": 1280, "height": 800})

        # ── A. карточка ученика ──
        p.goto(f"{BASE}/cabinet.html#/students/{VANYA}")
        p.wait_for_selector(".les", timeout=10000)
        p.wait_for_function("() => document.querySelectorAll('.les').length >= 4", timeout=8000)
        box = p.inner_text("#lesBox")
        next_row = p.locator(".les").first.inner_text()
        check("A1 «Ближайшее» — сегодня 15:00", "18 ноября" in next_row and "15:00" in next_row, next_row)
        pasts = p.eval_on_selector_all(".les", "els => els.map(e => e.dataset.lesson)")
        check("A2 «Последние»: сегодняшнее утро, вчера, давнее — от новых к старым", pasts[1:] == [L_MORN, L_YDAY, L_OLD], str(pasts))
        check("A3 будущее занятие 20.11 не среди последних", L_NEXT not in pasts)
        p.click(f'[data-tg="{L_YDAY}"]')
        body = p.inner_text(f'.les[data-lesson="{L_YDAY}"] .les-body')
        check("A4 «Что решали» вчерашнего: ФИПИ верно и вид неверно", "2933FB" in body and "решено верно" in body and "решено неверно" in body, body)
        check("A5 строка Пети и чужого занятия не попала", "fipi:oge:5" not in body and "· 5" not in body and "p1" not in body
              and p.locator(f'.les[data-lesson="{L_YDAY}"] .mrow').count() == 2, body)
        p.click(f'[data-tg="{L_OLD}"]')
        check("A6 занятие без записей объясняет это", "ничего не записано" in p.inner_text(f'.les[data-lesson="{L_OLD}"] .les-body'))
        check("A7 счётчик на кнопке", "Что решали: 2" in p.inner_text(f'[data-tg="{L_YDAY}"]'))
        p.click(f'[data-tg="{L_YDAY}"]')
        check("A8 повторный щелчок сворачивает", p.locator(f'.les[data-lesson="{L_YDAY}"] .les-body').count() == 0)

        # ── B. расписание: боковая панель ──
        p.goto(f"{BASE}/cabinet.html#/schedule/2026-11-16")
        p.evaluate("() => localStorage.setItem('cabinet:schedule:view', 'list')")
        p.reload()
        p.wait_for_selector(".rw-time", timeout=10000)
        open_lesson(p, L_YDAY)
        p.wait_for_selector(".sc-side")
        check("B1 панель открылась, в паре есть выбор ученика",
              p.locator(".sc-sp-pick button").count() == 2 and "Ваня" in p.inner_text(".sc-sp-card"), p.inner_text(".sc-side"))
        check("B2 краткая карточка: класс, экзамен, заметка", "9 класс" in p.inner_text(".sc-sp-card") and "ОГЭ" in p.inner_text(".sc-sp-card")
              and "дроби" in p.inner_text(".sc-sp-card"))
        check("B3 «Открыть карточку» ведёт на ученика", p.get_attribute("#spCard", "href") == f"#/students/{VANYA}")
        check("B4 доска ученика: ссылка на boards.html#board=", p.get_attribute("#spBoard", "href") == "boards.html#board=bd-vanya")
        p.click(f'.sc-sp-pick button[data-pick="{PETYA}"]')
        check("B5 выбран Петя — карточка и ссылка поменялись", "Петя" in p.inner_text(".sc-sp-card") and p.get_attribute("#spCard", "href") == f"#/students/{PETYA}")
        check("B6 у Пети доски нет — кнопка выключена", p.is_disabled("#spBoard"))
        p.keyboard.press("Escape")
        check("B7 Esc закрывает панель", p.locator(".sc-side").count() == 0)

        open_lesson(p, L_BOARD)
        p.wait_for_selector(".sc-side")
        check("B8 у занятия своя доска — она важнее доски ученика", p.get_attribute("#spBoard", "href") == "boards.html#board=bd-lesson")
        open_lesson(p, L_GUEST)
        p.wait_for_selector(".sc-side")
        check("B9 только гость: сессии нет, гость назван", p.locator("#spSession").count() == 0 and "Гость Гошин" in p.inner_text(".sc-side"))
        p.click("#spEdit")
        p.wait_for_selector(".sc-modal #edFmt")
        check("B10 «Править занятие» — прежнее окно правки", True)
        p.click(".sc-modal .sc-x")

        # ── C. сессия из занятия ──
        open_lesson(p, L_NOON)
        p.wait_for_selector("#spSession")
        check("C1 кнопка «Начать сессию»", p.inner_text("#spSession") == "Начать сессию")
        p.click("#spSession")
        p.wait_for_function("() => { const c = StudentMemory.current(); return !!c; }", timeout=8000)
        cur = p.evaluate("() => StudentMemory.current()")
        check("C2 сессия с Ваней и занятием", cur["id"] == VANYA and cur["lessonId"] == L_NOON, str(cur))
        check("C3 кнопка стала «Закончить сессию»", p.inner_text("#spSession") == "Закончить сессию")
        res = p.evaluate("() => StudentMemory.record('gen:oge9:p7', 'ok', { source: 'trainer', srcRef: 'oge9.html' })")
        check("C4 событие записано", res.get("ok") is True, str(res))
        p.evaluate("() => StudentMemory.flush()")
        for _ in range(40):
            rows = [r for r in db().get("student_task_log", []) if r["task_key"] == "gen:oge9:p7"]
            if rows:
                break
            p.wait_for_timeout(150)
        check("C5 на «сервер» событие ушло с lesson_id занятия", len(rows) == 1 and rows[0]["lesson_id"] == L_NOON and rows[0]["student_id"] == VANYA, str(rows))
        p.click("#spSession")
        p.wait_for_function("() => !StudentMemory.current()", timeout=5000)
        check("C6 «Закончить сессию» снимает сессию", p.inner_text("#spSession") == "Начать сессию")

        # из занятия пары — именно выбранный ученик
        p.keyboard.press("Escape")
        open_lesson(p, L_YDAY)
        p.wait_for_selector(".sc-sp-pick")
        p.click(f'.sc-sp-pick button[data-pick="{PETYA}"]')
        p.click("#spSession")
        p.wait_for_function("() => !!StudentMemory.current()", timeout=8000)
        cur = p.evaluate("() => StudentMemory.current()")
        check("C7 пара: сессия с выбранным Петей, а не с первым", cur["id"] == PETYA and cur["lessonId"] == L_YDAY, str(cur))
        p.evaluate("() => StudentMemory.end()")

        # новое событие видно в карточке
        p.goto(f"{BASE}/cabinet.html#/students/{VANYA}")
        p.wait_for_selector(".les")
        p.wait_for_function("() => document.querySelectorAll('.les').length >= 4", timeout=8000)
        p.click(f'[data-tg="{L_NOON}"]') if p.locator(f'[data-tg="{L_NOON}"]').count() else None
        check("C8 сегодняшнее занятие со своей записью раскрывается", p.locator(f'[data-tg="{L_NOON}"]').count() == 1
              and "Что решали: 1" in p.inner_text(f'[data-tg="{L_NOON}"]'), p.inner_text("#lesBox"))
        check("C9 строка с событием сессии", "oge9" in p.inner_text(f'.les[data-lesson="{L_NOON}"] .les-body') or "№9" in p.inner_text(f'.les[data-lesson="{L_NOON}"] .les-body'),
              p.inner_text(f'.les[data-lesson="{L_NOON}"]'))

        # панель уходит со вкладки «Расписание»
        p.goto(f"{BASE}/cabinet.html#/schedule/2026-11-16")
        p.wait_for_selector(".rw-time")
        open_lesson(p, L_NEXT) if p.locator(f'.rw-row[data-id="{L_NEXT}"]').count() else open_lesson(p, L_YDAY)
        p.wait_for_selector(".sc-side")
        p.evaluate("() => { location.hash = '#/settings'; }")
        p.wait_for_function("() => !document.querySelector('.sc-side')", timeout=3000)
        check("C10 панель не остаётся на других вкладках", p.locator(".sc-side").count() == 0)

        check("D нет ошибок JavaScript", not errors, "; ".join(errors))
        browser.close()
    print("\nИТОГ:", "всё зелёное" if not B1.FAILS else "есть падения: " + ", ".join(B1.FAILS))
    sys.exit(1 if B1.FAILS else 0)


if __name__ == "__main__":
    main()
