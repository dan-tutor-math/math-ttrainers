"""
Кабинет, задача Б3: память заданий ученика на доске (board-memory.js).

Supabase подменён заглушкой (window.CabinetCloud.client до загрузки страницы):
вход есть, таблица students отдаёт двух учеников, запись журнала всегда
«нет сети» — поэтому очередь studentMem:queue:v1 не уходит и её можно читать.
Живая база и совместный режим перепроверяются на сайте руками.

Проверяет:
  A. Открытие доски сессию не начинает; на доске, привязанной к ученику
     (students.boards), кнопка «Начать сессию: Ваня» начинает с ним;
  B. Сессия с Петей на доске Вани («чужая доска»): задание ФИПИ из панели
     тренажёров → строка board ученику сессии (Пете), ключ fipi:oge:<номер>,
     source board, src_ref — id доски;
  C. Подпись у текущего задания в панели: «Новое для Петя» до добавления,
     «на доске …» после; при labels = off — нет;
  D. Проверка ответа в поле на доске: неверно → bad; верно с первого раза → ok;
     итог, пришедший от собеседника (boardsApplyTaskLive) → ok;
  E. Задание с телефона-панели (boardLinkInsert): tkey из посылки → объект и
     событие board; кривой tkey отбрасывается;
  F. В данных доски (объекты в памяти и запись в IndexedDB) ничего о памяти:
     ни id ученика, ни имени, поля объектов — только известные;
  G. follower (tsTab:role): нет подписи, нет плашки, событие не пишется.

Запуск: python3 test_prompt_b3_board_memory.py (сервер поднимается сам).
"""
import json
import sys

from playwright.sync_api import sync_playwright

import test_prompt_rus_board_check as R

VANYA = {"id": "aaaaaaaa-0000-4000-8000-000000000001", "name": "Ваня", "boards": ["bA"]}
PETYA = {"id": "aaaaaaaa-0000-4000-8000-000000000002", "name": "Петя", "boards": ["bOther"]}

STUB_JS = """
(() => {
  window.__stubStudents = %s;
  const STUB = {
    auth: {
      getSession: async () => ({ data: { session: { user: { id: 'teacher-1' } } } }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe(){} } } }),
    },
    from(t){
      const q = {};
      ['select','order','eq','in','like','range','upsert','insert','delete'].forEach(m => { q[m] = () => q; });
      q.then = (res, rej) => Promise.resolve(t === 'students'
        ? { data: window.__stubStudents.map(s => Object.assign({ archived_at: null }, s)), error: null }
        : { data: null, error: { message: 'нет сети (заглушка)' } }).then(res, rej);
      return q;
    },
  };
  window.CabinetCloud = { client: () => STUB };
})();
""" % json.dumps([VANYA, PETYA], ensure_ascii=False)

PNG = ("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==")
OBJ_KEYS = {"id", "type", "src", "points", "w", "h", "natW", "natH", "locked", "task", "gen", "card", "css",
            "sol", "tkey", "stack", "gap", "addedAt"}

check = R.check


def queue(page):
    return page.evaluate("StudentMemory.queue()")


def rows(page, event=None):
    return [r for r in queue(page) if event is None or r["event"] == event]


def label(page):
    return page.evaluate("(() => { const e = document.getElementById('bdTrainersMem'); return e ? e.textContent : null; })()")


def answer_of(o):
    f = (o.get("task") or {}).get("fields") or []
    if not f:
        return None
    v = f[0].get("value")
    return str(v).replace(".", ",") if isinstance(v, (int, float)) else str(v)


def add_oge6(page):
    R.open_trainer(page, "oge6", "oge6.html", "!!d.querySelector('.mode-card')",
                   prep_js="document.querySelector('.mode-card[data-id=\"p1\"]').click()")
    return R.add_to_board(page)


def main():
    with R.local_server(), sync_playwright() as p:
        browser = p.chromium.launch()
        ctx = browser.new_context()
        ctx.add_init_script(STUB_JS)
        page, errors = R.open_board(ctx)
        page.wait_for_timeout(2600)   # плашка сверяется раз в 2 с, список учеников грузится

        # A. открытие доски ничего не начинает; привязанный ученик — в кнопке
        check("A: открытие доски сессию не начинает", page.evaluate("StudentMemory.current()") is None)
        bar = page.evaluate("(() => { const b = document.getElementById('smBar'); return b ? b.textContent : null; })()")
        check("A: на доске Вани кнопка «Начать сессию: Ваня»", bool(bar) and "Ваня" in bar and "Начать сессию" in bar, str(bar))
        page.click("#smBar [data-sm=start]")
        page.wait_for_timeout(300)
        cur = page.evaluate("StudentMemory.current()")
        check("A: кнопка начинает сессию с привязанным учеником", bool(cur) and cur["id"] == VANYA["id"], str(cur))
        page.evaluate("StudentMemory.end()")

        # B. сессия с Петей, доска Вани
        page.evaluate("s => StudentMemory.start(s)", {"id": PETYA["id"], "name": PETYA["name"]})
        page.wait_for_timeout(300)
        R.open_trainer(page, "oge6", "oge6.html", "!!d.querySelector('.mode-card')",
                       prep_js="document.querySelector('.mode-card[data-id=\"p1\"]').click()")
        page.wait_for_timeout(1300)
        lb = label(page)
        check("C: подпись в панели до добавления — «Новое для Петя»", lb == "Новое для Петя", str(lb))
        n0 = page.evaluate("getCurrentBoard().objects.length")
        page.evaluate("() => document.getElementById('bdTrainersAddBtn').click()")
        page.wait_for_function(f"() => getCurrentBoard().objects.length > {n0} && !document.getElementById('bdTrainersAddBtn').disabled", timeout=40000)
        page.wait_for_timeout(1300)
        lb = label(page)
        check("C: после добавления подпись — «на доске …»", bool(lb) and lb.startswith("на доске"), str(lb))
        page.evaluate("localStorage.setItem('teacher:settings:v1', JSON.stringify({ labels: 'off' }))")
        page.wait_for_timeout(1300)
        check("C: подписи выключены (labels = off) — подписи нет", label(page) is None, str(label(page)))
        page.evaluate("localStorage.removeItem('teacher:settings:v1')")
        R.close_panel(page)
        o1 = page.evaluate("() => JSON.parse(JSON.stringify(getCurrentBoard().objects.slice(-1)[0], (k, v) => k === 'src' ? '…' : v))")
        fipi = (o1.get("gen") or {}).get("snap", {}).get("curTask", {}).get("fipi")
        key1 = f"fipi:oge:{fipi}"
        b = rows(page, "board")
        check("B: событие board ушло в очередь", len(b) == 1, str(b))
        if b:
            r = b[0]
            check("B: ключ fipi:oge:<номер> = tkey объекта", bool(fipi) and r["task_key"] == key1 == o1.get("tkey"), f"{r['task_key']} / {o1.get('tkey')}")
            check("B: на чужой доске событие — ученику сессии (Пете)", r["student_id"] == PETYA["id"], r["student_id"])
            check("B: source board, src_ref — id доски", r["source"] == "board" and r["src_ref"] == "bA", f"{r['source']} {r['src_ref']}")

        # D. проверка ответа в поле на доске
        R.focus_on(page, o1["id"])
        st = R.fill_check(page, o1["id"], ["987654321"])
        bad = rows(page, "bad")
        check("D: неверный ответ на доске → bad", st.get("res") == "bad" and len(bad) == 1 and bad[0]["task_key"] == key1, f"{st} {bad}")
        o2 = add_oge6(page)
        ans = answer_of(o2)
        R.focus_on(page, o2["id"])
        st = R.fill_check(page, o2["id"], [ans or ""])
        ok = rows(page, "ok")
        key2 = o2.get("tkey")
        check("D: верно с первого раза → ok", st.get("res") == "ok" and len(ok) == 1 and ok[0]["task_key"] == key2, f"{ans} {st} {ok}")
        # итог от собеседника на общей доске (ученик проверил у себя)
        # своё задание с отдельным ключом: ФИПИ в панели могло выпасть то же,
        # а повтор ok по одному ключу в 10 минут StudentMemory отсекает
        page.evaluate("p => boardLinkInsert(p, { name: 'Телефон' })",
                      {"img": PNG, "css": {"w": 200, "h": 100}, "tkey": "fipi:oge:LIVE01",
                       "task": {"v": 1, "kind": "choice", "n": 4, "correct": 1}})
        page.wait_for_timeout(200)
        o3 = {"id": page.evaluate("() => getCurrentBoard().objects.slice(-1)[0].id"), "tkey": "fipi:oge:LIVE01"}
        n_ok = len(rows(page, "ok"))
        page.evaluate("id => window.boardsApplyTaskLive({ id, vals: {}, st: { res: 'ok', vals: {}, marks: {}, tries: 1 } })", o3["id"])
        ok = rows(page, "ok")
        check("D: итог от собеседника (boardsApplyTaskLive) → ok",
              len(ok) == n_ok + 1 and ok[-1]["task_key"] == o3.get("tkey") and ok[-1]["student_id"] == PETYA["id"], str(ok[-1:]))
        page.evaluate("id => window.boardsApplyTaskLive({ id, vals: {}, st: { res: 'ok', vals: {}, marks: {}, tries: 1 } })", o3["id"])
        check("D: повтор того же состояния — не новое событие", len(rows(page, "ok")) == n_ok + 1)

        # E. телефон-панель (выше уже было одно задание оттуда — LIVE01)
        nb = len(rows(page, "board"))
        page.evaluate("p => boardLinkInsert(p, { name: 'Телефон' })",
                      {"img": PNG, "css": {"w": 200, "h": 100}, "tkey": "fipi:oge:TEST01"})
        page.wait_for_timeout(200)
        last = page.evaluate("() => getCurrentBoard().objects.slice(-1)[0].tkey || null")
        b = rows(page, "board")
        check("E: телефон-панель: tkey в объекте", last == "fipi:oge:TEST01", str(last))
        check("E: телефон-панель: событие board", len(b) == nb + 1 and b[-1]["task_key"] == "fipi:oge:TEST01", str(b[-1:]))
        page.evaluate("p => boardLinkInsert(p, { name: 'Телефон' })",
                      {"img": PNG, "css": {"w": 200, "h": 100}, "tkey": "плохой ключ <x>"})
        page.wait_for_timeout(200)
        last = page.evaluate("() => 'tkey' in getCurrentBoard().objects.slice(-1)[0]")
        check("E: кривой tkey отброшен, события нет", last is False and len(rows(page, "board")) == nb + 1)

        # F. в данных доски о памяти ничего
        page.wait_for_timeout(1500)
        objs = page.evaluate("() => JSON.stringify(getCurrentBoard().objects, (k, v) => k === 'src' ? '…' : v)")
        extra = page.evaluate("() => getCurrentBoard().objects.flatMap(o => Object.keys(o))")
        idb = page.evaluate("""() => new Promise(res => { const r = indexedDB.open('ogeBoardsDB');
            r.onsuccess = () => { const g = r.result.transaction('state').objectStore('state').get('boarddata:bA');
              g.onsuccess = () => res(JSON.stringify(g.result || null, (k, v) => k === 'src' ? '…' : v)); }; })""")
        for name, blob in (("объекты доски", objs), ("запись IndexedDB", idb)):
            leak = [s for s in (PETYA["id"], VANYA["id"], "Петя", "studentMem", "student") if s in blob]
            check(f"F: {name} — ни ученика, ни памяти", not leak, str(leak))
        check("F: у объектов только известные поля", set(extra) <= OBJ_KEYS, str(set(extra) - OBJ_KEYS))

        # G. follower
        page.evaluate("sessionStorage.setItem('tsTab:role', 'follower')")
        n = len(queue(page))
        page.evaluate("p => boardLinkInsert(p, { name: 'Телефон' })",
                      {"img": PNG, "css": {"w": 200, "h": 100}, "tkey": "fipi:oge:TEST02"})
        R.open_trainer(page, "oge6", "oge6.html", "!!d.querySelector('.mode-card')",
                       prep_js="document.querySelector('.mode-card[data-id=\"p1\"]').click()")
        page.wait_for_timeout(2300)
        check("G: follower — событие не пишется", len(queue(page)) == n, str(queue(page)[n:]))
        check("G: follower — подписи в панели нет", label(page) is None, str(label(page)))
        check("G: follower — плашки сессии нет", page.evaluate("!document.getElementById('smBar')"))
        R.close_panel(page)

        check("без ошибок JS", not errors, str(errors[:2]))
        browser.close()
    print(f"\nИтого: {len(R.failures)} провалов")
    sys.exit(1 if R.failures else 0)


if __name__ == "__main__":
    main()
