"""
Кабинет, Б3+: метка «уже было у ученика» на заданиях самой доски (board-memory.js,
markTask из syncTaskOverlays в boards-core.js) и «✕ → Забыть».

Сценарий Даниила 17.11: задание №15–18 уже лежало на доске, сессию с учеником
начали потом, ответ проверили кнопкой «Проверить» на доске.

Supabase — заглушка (как в test_prompt_b3_board_memory.py), но удаление строк
журнала отвечает «успешно», чтобы проверить «Забыть». Живая база и совместный
режим перепроверяются на сайте руками.

Проверяет:
  A. Задание положено без сессии; сессия началась — метки нет (событий нет);
  B. «Проверить» в поле на доске во время сессии → строка ok в очереди и метка
     над заданием «Петя: верно …» с зелёной точкой;
  C. Метка не в данных доски (объект и IndexedDB) — только DOM;
  D. Подписи выключены (labels = off) — метки нет; включены — снова есть;
  E. «✕» → «Забыть» → строки по ключу удалены из очереди и копии журнала,
     метка пропала; «Нет» — метка остаётся;
  F. follower и конец сессии — меток нет;
  G. задача 56: на доске неверно, потом верно → в очереди bad и ok, метка
     «Петя: … неверно … → верно …», точка зелёная.

Запуск: python3 test_prompt_b3_board_marks.py (сервер поднимается сам).
"""
import json

from playwright.sync_api import sync_playwright

import test_prompt_rus_board_check as R
import test_prompt_b3_board_memory as B

check = R.check
# та же заглушка, но delete по журналу — успех (для «Забыть»)
STUB_JS = B.STUB_JS.replace(
    "q.then = (res, rej) => Promise.resolve(t === 'students'",
    "let del = false; q.delete = () => { del = true; return q; };\n"
    "      q.then = (res, rej) => Promise.resolve(del ? { data: null, error: null } : t === 'students'")


def mark(page, oid):
    return page.evaluate("""id => { const r = document.querySelector('.bd-task[data-id="' + id + '"] > .bd-mem');
        return r ? { text: r.textContent, last: r.dataset.last, vis: getComputedStyle(r).display !== 'none' } : null; }""", oid)


def frames(page, n=3):
    for _ in range(n):
        page.evaluate("scheduleRedraw()")
        page.wait_for_timeout(150)


def main():
    with R.local_server(), sync_playwright() as p:
        br = p.chromium.launch()
        ctx = br.new_context()
        ctx.add_init_script("try{if(!localStorage.getItem('smBarMini:v1'))localStorage.setItem('smBarMini:v1','1')}catch(e){}")
        ctx.add_init_script(STUB_JS)
        page, errors = R.open_board(ctx)
        page.wait_for_timeout(1500)

        # A. задание на доске до сессии
        R.open_trainer(page, "oge15_18", "oge15_18.html", "!!d.querySelector('.mode-card')",
                       prep_js="document.querySelector('.mode-card').click()")
        o = R.add_to_board(page)
        key = o.get("tkey")
        check("A: у задания №15–18 есть ключ", bool(key) and key.startswith("fipi:oge:"), str(key))
        page.evaluate("s => StudentMemory.start(s)", {"id": B.PETYA["id"], "name": B.PETYA["name"]})
        R.focus_on(page, o["id"])
        frames(page)
        check("A: сессия началась после — метки нет, событий нет", mark(page, o["id"]) is None and not B.queue(page), str(mark(page, o["id"])))

        # B. «Проверить» во время сессии
        st = R.fill_check(page, o["id"], [B.answer_of(o) or "1"])
        frames(page)
        q = [r for r in B.queue(page) if r["task_key"] == key]
        check("B: «Проверить» в сессии → событие ok", st.get("res") == "ok" and [r["event"] for r in q] == ["ok"], f"{st} {q}")
        mk = mark(page, o["id"])
        check("B: над заданием метка «Петя: верно …»", bool(mk) and mk["vis"] and mk["text"].startswith("Петя: верно"), str(mk))
        check("B: точка метки зелёная (последнее — ok)", bool(mk) and mk["last"] == "ok", str(mk))
        page.screenshot(path="test_b3_board_marks.png")

        # C. в данных доски метки нет
        page.wait_for_timeout(1200)
        blob = page.evaluate("() => JSON.stringify(getCurrentBoard().objects, (k, v) => k === 'src' ? '…' : v)")
        check("C: в объектах доски ни ученика, ни метки", not any(s in blob for s in ("Петя", B.PETYA["id"], "bd-mem")))

        # D. подписи выключены
        page.evaluate("localStorage.setItem('teacher:settings:v1', JSON.stringify({ labels: 'off' }))")
        page.wait_for_timeout(1100)
        frames(page)
        check("D: labels = off — метки нет", mark(page, o["id"]) is None, str(mark(page, o["id"])))
        page.evaluate("localStorage.removeItem('teacher:settings:v1')")
        page.wait_for_timeout(1100)
        frames(page)
        check("D: подписи снова включены — метка вернулась", mark(page, o["id"]) is not None)

        # E. «✕» → «Нет», потом «✕» → «Забыть»
        sel = f'.bd-task[data-id="{o["id"]}"] > .bd-mem'
        page.click(sel + " [data-mem-x]")
        check("E: «✕» спрашивает «Забыть …?»", "Забыть это задание у Петя?" in (mark(page, o["id"]) or {}).get("text", ""))
        page.click(sel + " [data-mem-no]")
        frames(page)
        check("E: «Нет» — метка на месте, журнал цел", (mark(page, o["id"]) or {}).get("text", "").startswith("Петя: верно")
              and page.evaluate("k => StudentMemory.summary(k).total", key) == 1)
        page.click(sel + " [data-mem-x]")
        page.click(sel + " [data-mem-yes]")
        page.wait_for_timeout(400)
        frames(page)
        left = [r for r in B.queue(page) if r["task_key"] == key]
        check("E: «Забыть» — строки из очереди и копии журнала ушли",
              not left and page.evaluate("k => StudentMemory.summary(k).total", key) == 0, str(left))
        check("E: метка пропала", mark(page, o["id"]) is None, str(mark(page, o["id"])))

        # F. follower и конец сессии
        page.evaluate("p => StudentMemory.record(p, 'ok', { source: 'board' })", key)
        frames(page)
        check("F: снова событие — метка есть", mark(page, o["id"]) is not None)
        page.evaluate("StudentMemory.end()")
        page.wait_for_timeout(1100)
        frames(page)
        check("F: сессия закончена — меток нет", mark(page, o["id"]) is None)
        page.evaluate("s => StudentMemory.start(s)", {"id": B.PETYA["id"], "name": B.PETYA["name"]})
        page.evaluate("sessionStorage.setItem('tsTab:role', 'follower')")
        page.wait_for_timeout(1100)
        frames(page)
        check("F: follower — меток нет", mark(page, o["id"]) is None)

        # G. неверно, потом верно — в истории оба (задача 56)
        page.evaluate("sessionStorage.removeItem('tsTab:role')")
        page.wait_for_timeout(1100)
        o2 = B.add_oge6(page)
        k2 = o2.get("tkey")
        R.focus_on(page, o2["id"])
        st = R.fill_check(page, o2["id"], ["987654321"])
        st = R.fill_check(page, o2["id"], [B.answer_of(o2) or ""])
        frames(page)
        ev = [r["event"] for r in B.queue(page) if r["task_key"] == k2 and r["event"] in ("ok", "bad")]
        check("G: неверно, потом верно → bad, затем ok", st.get("res") == "ok" and ev == ["bad", "ok"], f"{st} {ev}")
        mk = mark(page, o2["id"]) or {}
        check("G: метка цепочкой «неверно … → верно …»", "неверно" in mk.get("text", "") and "→ верно" in mk.get("text", ""), str(mk))
        check("G: точка зелёная — последнее верно", mk.get("last") == "ok", str(mk))

        check("без ошибок JS", not errors, str(errors[:2]))
        br.close()


if __name__ == "__main__":
    main()
    print(f"\nИтого: {len(R.failures)} провалов")
