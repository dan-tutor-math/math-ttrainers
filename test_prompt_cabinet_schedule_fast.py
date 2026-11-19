"""
Быстрое открытие расписания кабинета (16.11.2026): schedule.js, schedule-cloud.js,
cabinet.html.

Старое приложение открывается сразу — рисует из своей копии. Кабинет ждал
около пяти запросов к Supabase подряд. Теперь:
  - неделя лежит в localStorage (ключ по аккаунту) и рисуется сразу, без
    «Загружаем», свежие данные подменяют её молча;
  - без копии (первый раз) — как раньше, «Загружаем»;
  - группы и шаблоны читаются параллельно, а не цепочкой;
  - «Выйти» стирает копию; копия другого аккаунта не видна;
  - база не ответила при показанной копии — копия остаётся на экране.

«Медленная сеть» — заглушка базы держит ответы, пока тест их не отпустит.
Обвязка (заглушка Supabase, сервер, вход) — из test_prompt_cabinet_schedule.py.

Запуск: ~/.venvs/trainers/bin/python test_prompt_cabinet_schedule_fast.py
"""
import json
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
# test_prompt_cabinet_schedule.py зовёт main() без проверки __name__ — берём
# из него только обвязку, всё до def main()
_src = open(os.path.join(HERE, "test_prompt_cabinet_schedule.py"), encoding="utf-8").read()
exec(compile(_src[:_src.index("def main():")], "test_prompt_cabinet_schedule.py", "exec"))

PORT = 8973
BASE = f"http://127.0.0.1:{PORT}"
HOLD = {"on": False, "fail": False, "routes": []}


def lesson(lid, day, start, sid, pid):
    return ({"id": lid, "owner": TEACHER["id"], "day": day, "start_min": start, "dur_min": 60, "format": "single", "is_event": False,
             "title": "", "note": "", "board_id": None, "group_id": None, "from_slot": None, "ext_id": None,
             "created_at": "2026-01-01T00:00:00Z", "updated_at": "2026-01-01T00:00:00Z"},
            {"id": pid, "owner": TEACHER["id"], "lesson_id": lid, "student_id": sid, "guest_name": None, "status": "plan", "pos": 0})


def seed():
    d = fresh_db()
    for l, p in [lesson("les-1", "2026-11-17", 600, "st-masha", "ls-1"), lesson("les-2", "2026-11-18", 900, "st-petya", "ls-2")]:
        d["lessons"].append(l)
        d["lesson_students"].append(p)
    d["student_groups"] = [{"id": "grp-1", "owner": TEACHER["id"], "name": "Пара", "format": "pair", "dur_min": None, "archived_at": None,
                            "ext_id": None, "created_at": "2026-01-01T00:00:00Z", "updated_at": "2026-01-01T00:00:00Z"}]
    d["student_group_members"] = [{"group_id": "grp-1", "owner": TEACHER["id"], "student_id": "st-petya", "pos": 1},
                                  {"group_id": "grp-1", "owner": TEACHER["id"], "student_id": "st-masha", "pos": 0},
                                  {"group_id": "grp-x", "owner": TEACHER["id"], "student_id": "st-masha", "pos": 0}]
    return d


def slow_db(route, request):
    # держим ответы базы, пока тест не отпустит, — так видно, что рисуется до сети
    if HOLD["fail"] and request.method == "GET":
        route.fulfill(status=500, body="down", headers=CORS)
    elif HOLD["on"]:
        HOLD["routes"].append((route, request))
    else:
        handle_db(route, request)


def release():
    HOLD["on"] = False
    rs, HOLD["routes"] = HOLD["routes"], []
    for r, q in rs:
        handle_db(r, q)


def ctx_slow(browser):
    ctx = new_context(browser, viewport={"width": 1280, "height": 1200})
    ctx.unroute("https://fakesb.test/db")
    ctx.route("https://fakesb.test/db", slow_db)
    return ctx


def body_text(p):
    return p.inner_text("#scBody")


def main():
    errors = []
    STATE["db"] = json.dumps(seed())
    with local_server(), sync_playwright() as pw:
        browser = pw.chromium.launch()
        ctx = ctx_slow(browser)
        p = ctx.new_page()
        PAGE["p"] = p
        p.on("pageerror", lambda e: errors.append(str(e)))
        signed_in(p, "list")

        # 1. Первый раз копии нет — «Загружаем», пока база молчит
        HOLD["on"] = True
        p.goto(f"{BASE}/cabinet.html#/schedule/{WEEK}")
        p.reload()
        p.wait_for_selector("#scHost .sc-body", timeout=5000)
        p.wait_for_timeout(400)
        check("1 без копии и без ответа базы — «Загружаем»", "Загружаем" in body_text(p), body_text(p)[:80])
        release()
        p.wait_for_function("() => document.querySelectorAll('.rw-row').length === 2", timeout=8000)
        check("1a база ответила — два занятия", True)
        key = "cabinet:schedule:cache:" + TEACHER["id"]
        p.wait_for_function("(k) => !!localStorage.getItem(k)", arg=key, timeout=3000)
        c = p.evaluate("(k) => JSON.parse(localStorage.getItem(k))", key)
        check("2 копия недели в localStorage по аккаунту: неделя, ученики, группы",
              WEEK in c["weeks"] and len(c["weeks"][WEEK]["lessons"]) == 2 and len(c["students"]) >= 2 and len(c["groups"]) == 1, json.dumps(c)[:200])
        g = c["groups"][0]
        check("3 группы одним заходом: участники по порядку, чужая группа не прилипла", g["members"] == ["st-masha", "st-petya"], str(g["members"]))

        # 4. Повторное открытие: база молчит, а неделя уже на экране
        d = json.loads(STATE["db"])
        l3, p3 = lesson("les-3", "2026-11-19", 1020, "st-masha", "ls-3")
        d["lessons"].append(l3)
        d["lesson_students"].append(p3)
        STATE["db"] = json.dumps(d)            # на «сервере» появилось третье занятие
        HOLD["on"] = True
        p.reload()
        p.wait_for_selector("#scHost .sc-body", timeout=5000)
        p.wait_for_timeout(400)
        check("4 копия есть — неделя сразу, без «Загружаем», пока база молчит",
              "Загружаем" not in body_text(p) and p.locator(".rw-row").count() == 2 and len(HOLD["routes"]) > 0,
              f"rows={p.locator('.rw-row').count()} held={len(HOLD['routes'])}")
        release()
        p.wait_for_function("() => document.querySelectorAll('.rw-row').length === 3", timeout=8000)
        check("5 свежие данные подменили копию молча: три занятия", "Загружаем" not in body_text(p))
        p.wait_for_function("(k) => JSON.parse(localStorage.getItem(k)).weeks['" + WEEK + "'].lessons.length === 3", arg=key, timeout=3000)
        check("5a копия обновилась", True)

        # 6. База упала, копия на экране — копия остаётся
        HOLD["fail"] = True
        p.reload()
        p.wait_for_selector("#scHost .sc-body", timeout=5000)
        p.wait_for_timeout(1200)
        check("6 база не ответила — неделя из копии остаётся на экране", p.locator(".rw-row").count() == 3, body_text(p)[:120])
        HOLD["fail"] = False

        # 7. Счётчик записей: по нему загрузка видит правку, сделанную во время обновления
        p.reload()
        p.wait_for_function("() => document.querySelectorAll('.rw-row').length === 3", timeout=8000)
        p.wait_for_timeout(500)
        p.evaluate("""async () => { const SC = window.ScheduleCloud; const w0 = SC.writes();
                                    await SC.updateLesson('les-1', { note: 'x' }); window.__w = SC.writes() - w0; }""")
        check("7 счётчик записей: +2 на правку (начало и конец)", p.evaluate("window.__w") == 2)

        # 8. Чужой аккаунт копию не видит, «Выйти» её стирает
        other = p.evaluate("() => Object.keys(localStorage).filter(k => k.indexOf('cabinet:schedule:cache:') === 0)")
        check("8 ключ копии один и с id аккаунта", other == [key], str(other))
        p.click("#tabs a[data-tab=settings]")
        p.click("#cabAccount summary")
        p.click("#auOut")
        p.wait_for_selector("#scrAuth:not([hidden])", timeout=5000)
        left = p.evaluate("() => Object.keys(localStorage).filter(k => k.indexOf('cabinet:schedule:cache:') === 0)")
        check("9 «Выйти» стирает копию расписания", left == [], str(left))

        check("10 нет ошибок JavaScript", not errors, "; ".join(errors))
        browser.close()

    print()
    print("ПРОВАЛЕНО: " + ", ".join(FAILS) if FAILS else "Все проверки прошли — готово")
    sys.exit(1 if FAILS else 0)


main()
