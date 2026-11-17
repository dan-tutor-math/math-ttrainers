"""
Кабинет, задача Б2: запись событий памяти заданий из тренажёров.

Страница решает задание, а StudentMemory.recordAttempt (задача 56) кладёт строку
в очередь записи (localStorage studentMem:queue:v1) с ключом из task-key.js:
bad — в момент ошибки, ok — при верном ответе (в том числе после ошибки). Сеть закрыта (Supabase недоступен),
поэтому очередь не уходит и её можно читать. Живая база и совместный режим
перепроверяются на сайте руками.

Проверяет:
  A. ОГЭ №6 и №9: задание с первого раза — строка ok с ключом fipi:oge:<номер>
     или gen:<страница>:<вид>; неверно, потом верно — bad, затем ok; в «вперемешку»
     ключ тоже есть (genKind);
  B. ege_prof: решено с первого раза — ok, ключ fipi:ege:<номер> (или gen:ege_prof:<id>);
     после ошибки — bad;
  C. вне сессии, на паузе — очередь пуста; follower (?s= в адресе) — пусто;
  E. StudentMemory.recordAttempt (задача 56): неверно → bad сразу, потом
     верно → ok (оба в очереди, по порядку); повтор bad в 10 минут — одной
     строкой; ключ тот же, что у recordTask; follower — отказ;
  D. остальные страницы из таблицы аудита (oge1_5, oge7, oge15_18, oge19, русский,
     копии ege_prof) открываются без ошибок и подключают task-key.js до student-memory.js.

Запуск: python3 test_prompt_b2_trainer_events.py (сервер поднимается сам).
"""
import contextlib
import http.client
import os
import re
import subprocess
import sys
import time

from playwright.sync_api import sync_playwright

HERE = os.path.dirname(os.path.abspath(__file__))
PORT = 8964
BASE = f"http://127.0.0.1:{PORT}"
FAILS = []
STUDENT = {"id": "aaaaaaaa-0000-4000-8000-000000000001", "name": "Ваня"}


def check(name, cond, extra=""):
    print(("[OK] " if cond else "[FAIL] ") + name + (f" — {extra}" if extra and not cond else ""))
    if not cond:
        FAILS.append(name)


@contextlib.contextmanager
def local_server():
    proc = subprocess.Popen([sys.executable, "-m", "http.server", str(PORT)], cwd=HERE,
                            stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    try:
        for _ in range(50):
            try:
                conn = http.client.HTTPConnection("127.0.0.1", PORT, timeout=0.2)
                conn.request("GET", "/oge6.html")
                conn.getresponse()
                break
            except Exception:
                time.sleep(0.1)
        else:
            raise RuntimeError("локальный сервер не поднялся")
        yield
    finally:
        proc.terminate()
        proc.wait(timeout=5)


def new_page(browser, url, session=True, wait=1200):
    ctx = browser.new_context()
    page = ctx.new_page()
    errors = []
    page.on("pageerror", lambda e: errors.append(str(e)))
    page.route("https://**/*", lambda route: route.abort())
    page.goto(url)
    page.wait_for_timeout(wait)
    if session:
        page.evaluate("s => StudentMemory.start(s)", STUDENT)
    return ctx, page, errors


def queue(page):
    return page.evaluate("StudentMemory.queue()")


def start_oge_mode(page, mode_id=None):
    sel = f'#modesGrid .mode-card[data-id="{mode_id}"]' if mode_id else '#modesGrid .mode-card'
    page.click(sel + ' >> nth=0')
    page.wait_for_timeout(300)


def solve_input(page, wrong_first=False):
    """Решает задание ОГЭ с вводом ответа. Верный ответ — curTask.correctValue."""
    if wrong_first:
        page.fill('#answerInput', '-98765')
        page.click('#checkAnswerBtn')
        page.wait_for_timeout(100)
    page.fill('#answerInput', str(page.evaluate("curTask.correctValue")).replace('.', ','))
    page.click('#checkAnswerBtn')
    page.wait_for_timeout(300)


def skip_throttle(page):
    """Демо-задания подряд имеют один ключ; сдвигаем часы на 11 минут, чтобы
    ограничение «одно событие в 10 минут» не мешало проверять следующее задание."""
    page.evaluate("(() => { const o = Date.now; Date.now = () => o() + 11 * 60 * 1000; })()")


def test_oge(browser, page_name):
    ctx, page, errors = new_page(browser, f"{BASE}/{page_name}.html")
    check(f"{page_name}: до решения очередь пуста", queue(page) == [])
    start_oge_mode(page)
    exam_key = re.compile(r"^(fipi:oge:[0-9A-Za-z]{4,16}|gen:%s:[^:]+)$" % page_name)
    solve_input(page)
    q = queue(page)
    check(f"{page_name}: с первого раза — одна строка ok", len(q) == 1 and q[0]["event"] == "ok", str(q))
    check(f"{page_name}: ключ верный", bool(q) and bool(exam_key.match(q[0]["task_key"])), str(q))
    check(f"{page_name}: источник — тренажёр", bool(q) and q[0]["source"] == "trainer")
    fipi = page.evaluate("curTask.fipi || null")
    if fipi and q:
        check(f"{page_name}: у задания ФИПИ ключ содержит номер", q[0]["task_key"] == f"fipi:oge:{fipi}", q[0]["task_key"])
    # второе задание: сначала ошибка, потом верный ответ — bad, затем ok (задача 56)
    page.click('#nextBtn')
    page.wait_for_timeout(300)
    skip_throttle(page)
    solve_input(page, wrong_first=True)
    q = queue(page)
    check(f"{page_name}: неверно → bad, потом верно → ok, ключ тот же",
          len(q) == 3 and [e["event"] for e in q[1:]] == ["bad", "ok"] and q[1]["task_key"] == q[2]["task_key"], str(q))
    # пауза: ничего не пишется
    page.evaluate("StudentMemory.pause(true)")
    page.click('#nextBtn')
    page.wait_for_timeout(300)
    solve_input(page)
    check(f"{page_name}: на паузе очередь не растёт", len(queue(page)) == 3)
    check(f"{page_name}: без ошибок JS", not errors, str(errors[:1]))
    ctx.close()


def pick(page, page_name, right):
    """Выбор ответа на страницах без поля ввода: oge7 — кнопки вариантов, oge19 — утверждения."""
    if page_name == "oge7":
        page.evaluate("""r => { const b = [...document.querySelectorAll('.mcq-btn')];
            b[r ? curTask.correctIndex : b.findIndex((_, k) => k !== curTask.correctIndex)].click(); }""", right)
    else:
        page.evaluate("""r => { const el = [...document.querySelectorAll('.stmt')]; const ok = correctIndexSet();
            el.forEach((e, i) => { if (r ? ok.has(i) : (!ok.has(i) && !el.some((x, j) => !ok.has(j) && x.classList.contains('picked')))) e.click(); });
            document.getElementById('checkBtn').click(); }""", right)
    page.wait_for_timeout(300)


def test_oge_pick(browser, page_name):
    """oge7 (варианты ответа) и oge19 (выбор утверждений): задача 56, этап 2а."""
    ctx, page, errors = new_page(browser, f"{BASE}/{page_name}.html")
    check(f"{page_name}: до решения очередь пуста", queue(page) == [])
    start_oge_mode(page)
    pick(page, page_name, True)
    q = queue(page)
    check(f"{page_name}: сразу верно — только ok", len(q) == 1 and q[0]["event"] == "ok", str(q))
    page.click('#nextBtn')
    page.wait_for_timeout(300)
    skip_throttle(page)
    pick(page, page_name, False)
    q = queue(page)
    check(f"{page_name}: неверный ответ — bad сразу, в момент ошибки",
          len(q) == 2 and q[1]["event"] == "bad", str(q))
    page.click('#changeAnswerBtn')
    page.wait_for_timeout(200)
    pick(page, page_name, True)
    q = queue(page)
    check(f"{page_name}: неверно → bad, потом верно → ok, ключ тот же",
          len(q) == 3 and [e["event"] for e in q[1:]] == ["bad", "ok"] and q[1]["task_key"] == q[2]["task_key"], str(q))
    check(f"{page_name}: без ошибок JS", not errors, str(errors[:1]))
    ctx.close()


def test_oge_random(browser):
    ctx, page, errors = new_page(browser, f"{BASE}/oge6.html")
    page.click('.mode-card.random[data-id] >> nth=0')
    page.wait_for_timeout(300)
    solve_input(page)
    q = queue(page)
    check("oge6 «вперемешку»: строка ok с ключом выпавшего вида",
          len(q) == 1 and q[0]["event"] == "ok" and re.match(r"^(fipi:oge:\w+|gen:oge6:(?!random)[^:]+)$", q[0]["task_key"]), str(q))
    ctx.close()


def test_no_session(browser):
    ctx, page, errors = new_page(browser, f"{BASE}/oge6.html", session=False)
    start_oge_mode(page)
    solve_input(page)
    check("вне сессии ничего не пишется", queue(page) == [])
    ctx.close()


def test_follower(browser):
    ctx = browser.new_context()
    page = ctx.new_page()
    page.route("https://**/*", lambda route: route.abort())
    page.goto(f"{BASE}/oge6.html?s=ABCD")
    page.wait_for_timeout(1000)
    page.evaluate("s => { try { StudentMemory.start(s); } catch (e) {} }", STUDENT)
    # приглашение закрывает страницу, кликать нельзя: проверяем сам вызов записи
    r = page.evaluate("StudentMemory.recordTask({ fipi: 'ABC123' }, { page: 'oge6', clean: true })")
    check("follower: запись отклонена", r.get("ok") is False and r.get("reason") == "follower", str(r))
    check("follower: ничего не пишется", queue(page) == [])
    ctx.close()


def test_ege_prof(browser):
    ctx, page, errors = new_page(browser, f"{BASE}/ege_prof.html?n=4")
    page.evaluate("localStorage.removeItem('ogeProg:ege_prof:solved')")
    page.click('.mode-card:nth-of-type(1)')
    page.wait_for_timeout(400)
    pid = page.evaluate("S.pid")
    ans = page.evaluate("String(curProto.answer)").replace('.', ',')
    page.fill('input[data-fid="main"]', ans)
    page.click('#answerArea .check-btn')
    page.wait_for_timeout(300)
    q = queue(page)
    key_re = re.compile(r"^(fipi:ege:[0-9A-Za-z]{4,16}|gen:ege_prof:%s)$" % re.escape(pid))
    check("ege_prof: с первого раза — ok", len(q) == 1 and q[0]["event"] == "ok", str(q))
    check("ege_prof: ключ верный", bool(q) and bool(key_re.match(q[0]["task_key"])), str(q))
    # следующий прототип: ошибка, потом верно → bad
    page.click('#nextBtn')
    page.wait_for_timeout(300)
    page.fill('input[data-fid="main"]', '-98765')
    page.click('#answerArea .check-btn')
    page.wait_for_timeout(300)
    ans2 = page.evaluate("String(curProto.answer)").replace('.', ',')
    page.fill('input[data-fid="main"]', ans2)
    page.click('#answerArea .check-btn')
    page.wait_for_timeout(300)
    q = queue(page)
    # задача 56: ошибка пишется сразу (bad), верный ответ после неё — ok с тем же ключом
    check("ege_prof: неверно, потом верно — bad, затем ok",
          len(q) == 3 and q[1]["event"] == "bad" and q[2]["event"] == "ok", str(q))
    check("ege_prof: у второго задания другой ключ", len(q) == 3 and q[0]["task_key"] != q[1]["task_key"], str(q))
    check("ege_prof: bad и ok — один ключ", len(q) == 3 and q[1]["task_key"] == q[2]["task_key"], str(q))
    check("ege_prof: без ошибок JS", not errors, str(errors[:1]))
    ctx.close()


def test_record_attempt(browser):
    ctx, page, errors = new_page(browser, f"{BASE}/oge6.html")
    t = "{ fipi: 'ATT056' }"
    page.evaluate(f"StudentMemory.recordAttempt({t}, {{ page: 'oge6', ok: false }})")
    page.evaluate(f"StudentMemory.recordAttempt({t}, {{ page: 'oge6', ok: false }})")
    page.evaluate(f"StudentMemory.recordAttempt({t}, {{ page: 'oge6', ok: true }})")
    q = [(r["event"], r["task_key"]) for r in queue(page)]
    check("recordAttempt: неверно, неверно, верно → bad, ok (повтор bad склеен)",
          q == [("bad", "fipi:oge:ATT056"), ("ok", "fipi:oge:ATT056")], str(q))
    s = page.evaluate("StudentMemory.summary('fipi:oge:ATT056')")
    check("recordAttempt: в сводке порядок «неверно → верно»", [e["event"] for e in s["events"]] == ["bad", "ok"], str(s["events"]))
    r = page.evaluate("StudentMemory.recordAttempt({ id: 'x' }, { page: 'нет_такой', ok: true })")
    check("recordAttempt: без ключа — отказ no_key", r.get("ok") is False and r.get("reason") == "no_key", str(r))
    page.evaluate("sessionStorage.setItem('tsTab:role', 'follower')")
    r = page.evaluate("StudentMemory.recordAttempt({ fipi: 'ATT057' }, { page: 'oge6', ok: true })")
    check("recordAttempt: follower — отказ", r.get("ok") is False and r.get("reason") == "follower", str(r))
    check("recordAttempt: без ошибок JS", not errors, str(errors[:1]))
    ctx.close()


def test_other_pages(browser):
    pages = ["oge1_5", "oge7", "oge15_18", "oge19", "rus_oge", "rus_oge01", "rus_oge13",
             "ege_base", "oge_part2", "soc_oge", "eng_oge"]
    for name in pages:
        src = open(os.path.join(HERE, name + ".html"), encoding="utf-8").read()
        i, j = src.find('<script src="task-key.js"'), src.find('<script src="student-memory.js"')
        check(f"{name}: task-key.js подключён раньше student-memory.js", 0 <= i < j)
        ctx, page, errors = new_page(browser, f"{BASE}/{name}.html", session=False, wait=600)
        check(f"{name}: открывается без ошибок JS", not [e for e in errors if "TireMath" not in e], str(errors[:1]))
        check(f"{name}: StudentMemory.recordTask есть", page.evaluate("typeof StudentMemory.recordTask") == "function")
        ctx.close()


def main():
    with local_server(), sync_playwright() as pw:
        browser = pw.chromium.launch()
        for name in ("oge6", "oge9", "oge15_18", "oge1_5"):
            test_oge(browser, name)
        for name in ("oge7", "oge19"):
            test_oge_pick(browser, name)
        test_oge_random(browser)
        test_no_session(browser)
        test_follower(browser)
        test_ege_prof(browser)
        test_record_attempt(browser)
        test_other_pages(browser)
        browser.close()
    print("\nПровалено:", len(FAILS))
    sys.exit(1 if FAILS else 0)


if __name__ == "__main__":
    main()
