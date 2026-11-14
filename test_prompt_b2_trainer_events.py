"""
Кабинет, задача Б2: запись событий памяти заданий из тренажёров.

Страница решает задание, а StudentMemory.recordTask кладёт строку в очередь
записи (localStorage studentMem:queue:v1) с ключом из task-key.js и итогом:
ok — с первого раза, bad — после ошибки. Сеть закрыта (Supabase недоступен),
поэтому очередь не уходит и её можно читать. Живая база и совместный режим
перепроверяются на сайте руками.

Проверяет:
  A. ОГЭ №6 и №9: задание с первого раза — строка ok с ключом fipi:oge:<номер>
     или gen:<страница>:<вид>; после неверного ответа — bad; в «вперемешку»
     ключ тоже есть (genKind);
  B. ege_prof: решено с первого раза — ok, ключ fipi:ege:<номер> (или gen:ege_prof:<id>);
     после ошибки — bad;
  C. вне сессии, на паузе — очередь пуста; follower (?s= в адресе) — пусто;
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
    # второе задание: сначала ошибка, потом верный ответ — bad
    page.click('#nextBtn')
    page.wait_for_timeout(300)
    solve_input(page, wrong_first=True)
    q = queue(page)
    check(f"{page_name}: после ошибки — строка bad", len(q) == 2 and q[1]["event"] == "bad", str(q))
    # пауза: ничего не пишется
    page.evaluate("StudentMemory.pause(true)")
    page.click('#nextBtn')
    page.wait_for_timeout(300)
    solve_input(page)
    check(f"{page_name}: на паузе очередь не растёт", len(queue(page)) == 2)
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
    page.wait_for_timeout(150)
    ans2 = page.evaluate("String(curProto.answer)").replace('.', ',')
    page.fill('input[data-fid="main"]', ans2)
    page.click('#answerArea .check-btn')
    page.wait_for_timeout(300)
    q = queue(page)
    check("ege_prof: после ошибки — bad", len(q) == 2 and q[1]["event"] == "bad", str(q))
    check("ege_prof: у второго задания другой ключ", len(q) == 2 and q[0]["task_key"] != q[1]["task_key"], str(q))
    check("ege_prof: без ошибок JS", not errors, str(errors[:1]))
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
        test_oge_random(browser)
        test_no_session(browser)
        test_follower(browser)
        test_ege_prof(browser)
        test_other_pages(browser)
        browser.close()
    print("\nПровалено:", len(FAILS))
    sys.exit(1 if FAILS else 0)


if __name__ == "__main__":
    main()
