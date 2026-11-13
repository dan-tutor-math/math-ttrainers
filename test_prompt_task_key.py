"""
Кабинет преподавателя, задача А1: ключ задания (task-key.js).

Ключ — «fipi:<экзамен>:<номер>» для банка ФИПИ и «gen:<страница>:<вид>» для
остальных. Проверяет для страниц oge1_5, oge6, oge7, oge9, oge15_18, oge19,
ege_prof (+ копии ege_base, oge_part2), rus_oge, rus_oge01, rus_oge13:
  1. из задания на экране: номер ФИПИ в снимке tsGetState (curTask.fipi) даёт
     ключ, совпадающий с подписью «Источник: … задание XXXXXX» на странице;
  2. из рецепта доски trainerGenInfo (тот же рецепт лежит в блоке работы):
     ключ тот же, что из задания;
  3. задание не из банка — gen-ключ с id типа; «вперемешку» — null (честно:
     страницы не хранят, какой тип выпал);
  4. русский язык: снимка и рецепта у страниц нет, ключ берётся из
     window.__examNav.pid() (id задания = номер ФИПИ), рецепт — null;
  5. модуль в одиночку: граничные случаи (пустое, чужие страницы, engine).

Совместный режим не затронут: страницы не менялись. Запуск:
python3 test_prompt_task_key.py (сервер поднимается сам).
"""
import contextlib
import http.client
import os
import re
import subprocess
import sys
import time

from playwright.sync_api import sync_playwright

PORT = 9302
BASE = f"http://127.0.0.1:{PORT}"
HERE = os.path.dirname(os.path.abspath(__file__))
results = []


def check(name, ok, extra=""):
    results.append((name, ok))
    print(f"[{'OK' if ok else 'FAIL'}] {name}" + (f": {extra}" if extra and not ok else ""))


@contextlib.contextmanager
def local_server():
    proc = subprocess.Popen([sys.executable, "-m", "http.server", str(PORT)], cwd=HERE,
                            stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    try:
        for _ in range(50):
            try:
                conn = http.client.HTTPConnection("127.0.0.1", PORT, timeout=0.2)
                conn.request("GET", "/index.html")
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


def open_page(browser, url, ready):
    ctx = browser.new_context(viewport={"width": 1300, "height": 1000})
    page = ctx.new_page()
    errors = []
    page.on("pageerror", lambda e: errors.append(str(e)))
    # только ФИПИ-задания не нужны: режим выбирается карточкой, фильтр по умолчанию
    page.route("https://**/*", lambda route: route.abort())
    page.goto(f"{BASE}/{url}")
    page.wait_for_function(ready)
    page.wait_for_timeout(400)
    page.add_script_tag(url="task-key.js")
    page.add_script_tag(url="trainer-tasks.js")
    return ctx, page, errors


# снимок + рецепт доски + ключи из обоих
PROBE = """([tid, page]) => {
  const st = tsGetState();
  const rec = trainerGenInfo(window, tid, page + '.html', document.getElementById('questionPanel'));
  return {
    mode: st.curMode, fipi: st.curTask && st.curTask.fipi,
    kState: TaskKey.fromState(tid, st), kRecipe: TaskKey.fromRecipe(rec),
    kind: rec && rec.kind,
  };
}"""


def card(page, mode_id):
    page.evaluate("() => { const b = document.getElementById('backBtn'); if (b) b.click(); }")
    page.click(f'.mode-card[data-id="{mode_id}"]')
    page.wait_for_timeout(200)


# (страница, карточка с заданием ФИПИ, карточка без ФИПИ, ожидаемый вид gen-ключа)
OGE_PAGES = [
    ("oge1_5", "tariff_fipi", "tire_set1", "tire1_t1"),
    ("oge6", "p1", "demo2027", "demo2027"),
    ("oge7", "int_bracket", "demo2027", "demo2027"),
    ("oge9", "p1", "demo2027", "demo2027"),
    ("oge15_18", "t_hyp", "demo15", "demo15"),
    ("oge19", "fipi", "demo2027", "demo2027"),
]


def test_oge(browser):
    for pg, fipi_card, gen_card, gen_kind in OGE_PAGES:
        ctx, page, errors = open_page(browser, f"{pg}.html", "() => window.__trainerState")
        card(page, fipi_card)
        r = page.evaluate(PROBE, [pg, pg])
        want = f"fipi:oge:{r['fipi']}" if r["fipi"] else None
        check(f"{pg}: номер ФИПИ есть в снимке (curTask.fipi)", bool(r["fipi"]), str(r))
        check(f"{pg}: ключ из снимка fipi:oge:<номер>", r["kState"] == want, str(r))
        check(f"{pg}: ключ из рецепта доски совпадает", r["kRecipe"] == want and r["kind"] == "state", str(r))
        # номер в ключе — тот же, что человек видит под заданием
        src = page.evaluate("() => { const n = document.querySelector('#fipiNote, .fipi-note, #sourceNote, .source-note'); return n ? n.textContent : ''; }")
        if src:
            check(f"{pg}: ключ совпадает с подписью источника", r["fipi"] in src, src)
        card(page, gen_card)
        g = page.evaluate(PROBE, [pg, pg])
        check(f"{pg}: не из банка — gen:{pg}:{gen_kind}",
              g["kState"] == f"gen:{pg}:{gen_kind}" and g["kRecipe"] == g["kState"], str(g))
        check(f"{pg}: без ошибок JS", not [e for e in errors if "TireMath" not in e], str(errors[:1]))
        ctx.close()


def test_random_is_null(browser):
    ctx, page, errors = open_page(browser, "oge6.html", "() => window.__trainerState")
    card(page, "random")
    for _ in range(6):
        page.evaluate("() => newTask()")
        r = page.evaluate(PROBE, ["oge6", "oge6"])
        if r["fipi"]:
            check("oge6 «вперемешку», задание ФИПИ: ключ fipi", r["kRecipe"] == f"fipi:oge:{r['fipi']}", str(r))
        else:
            check("oge6 «вперемешку», своё задание: ключа нет (тип не сохранён страницей)",
                  r["kState"] is None and r["kRecipe"] is None, str(r))
            break
    ctx.close()


def test_ege_like(browser):
    for pg, tid, n in [("ege_prof", "ege1", 1), ("oge_part2", "oge20", 20), ("ege_base", "egeb1", 1)]:
        ctx, page, errors = open_page(browser, f"{pg}.html?n={n}", "() => typeof tsGetState === 'function' && !!window.BANK || typeof BANK !== 'undefined'")
        info = page.evaluate("""async (n) => {
          await new Promise(r => ensureFipi(n, r));
          const protos = BANK[n].protos;
          const f = protos.find(p => p.fipi), h = protos.find(p => !p.fipi);
          return { fipi: f && f.id, fipiNum: f && f.fipi, hand: h && h.id };
        }""", n)
        probe = """([tid, pid, n]) => {
          openTask(n, pid); if (typeof render === 'function') render();
          const rec = trainerGenInfo(window, tid, location.pathname.slice(1) + location.search, document.body);
          return { kState: TaskKey.fromState(tid, tsGetState()), kRecipe: TaskKey.fromRecipe(rec), kind: rec && rec.kind };
        }"""
        exam = {"ege_prof": "ege", "oge_part2": "oge", "ege_base": "egeb"}[pg]
        if info["fipi"]:
            r = page.evaluate(probe, [tid, info["fipi"], n])
            want = f"fipi:{exam}:{info['fipiNum']}"
            check(f"{pg}: ключ из снимка ({want})", r["kState"] == want, str(r))
            check(f"{pg}: ключ из рецепта доски (kind ege)", r["kRecipe"] == want and r["kind"] == "ege", str(r))
        else:
            print(f"[--] {pg}: в банке нет заданий ФИПИ в этой выгрузке, проверяем только gen")
        r = page.evaluate(probe, [tid, info["hand"], n])
        want = f"gen:{pg}:{info['hand']}"
        check(f"{pg}: авторское задание — {want}", r["kState"] == want and r["kRecipe"] == want, str(r))
        check(f"{pg}: без ошибок JS", not errors, str(errors[:1]))
        ctx.close()


def test_rus(browser):
    for pg, url, getter in [
        ("rus_oge", "rus_oge.html?n=2", None),
        ("rus_oge01", "rus_oge01.html", "__rusOge01"),
        ("rus_oge13", "rus_oge13.html", "__rusOge13"),
    ]:
        ctx, page, errors = open_page(browser, url, "() => window.__examNav")
        if getter:
            page.evaluate(f"() => __examNav.open(null, {getter}.TASKS[1].id)")
            page.wait_for_timeout(300)
        r = page.evaluate("""(pg) => { const pid = __examNav.pid();
          return { pid, key: TaskKey.fromTask(pg, { id: pid }),
                   hasState: typeof tsGetState === 'function' || !!window.__trainerState,
                   rec: trainerGenInfo(window, pg, pg + '.html', document.body) }; }""", pg)
        check(f"{pg}: id задания на экране есть (__examNav.pid)", bool(r["pid"]), str(r))
        check(f"{pg}: ключ fipi:rus:<id>", r["key"] == f"fipi:rus:{r['pid']}", str(r))
        # известный пробел (список правок в task-key-audit.md): рецепта доски у русского нет
        check(f"{pg}: рецепта доски нет (пробел зафиксирован аудитом)", r["rec"] is None and not r["hasState"], str(r))
        ctx.close()


def test_module(browser):
    ctx, page, errors = open_page(browser, "oge6.html", "() => window.__trainerState")
    r = page.evaluate("""() => ({
      a: TaskKey.fromTask('oge6', null), b: TaskKey.fromTask('index', { fipi: 'ABCDEF' }),
      c: TaskKey.fromRecipe(null), d: TaskKey.fromRecipe({ kind: 'engine', tid: 'oge9', mode: 'quadratic' }),
      e: TaskKey.fromTask('oge6.html?x=1', { fipi: '33FBF3' }), f: TaskKey.fromTask('oge6', { mode: 'random' }),
      g: TaskKey.fromTask('oge6', { mode: 'random', genKind: 'p4' }), h: TaskKey.fromRecipe({ kind: 'ege', tid: 'soc5', pid: '3B5147' }),
      i: TaskKey.fromTask('eng_oge', { id: '1.L01', fipi: '42BF66, 7D08A8' }), j: TaskKey.fromTask('ege_prof', { id: '1.fipi.2933FB' }),
    })""")
    check("модуль: пустое и чужая страница — null", r["a"] is None and r["b"] is None and r["c"] is None and r["d"] is None, str(r))
    check("модуль: адрес со страницей и ?, номер как есть", r["e"] == "fipi:oge:33FBF3", str(r))
    check("модуль: «вперемешку» без genKind — null, с genKind — gen", r["f"] is None and r["g"] == "gen:oge6:p4", str(r))
    check("модуль: id прототипа ЕГЭ с .fipi. даёт номер; список номеров (английский) — gen",
          r["j"] == "fipi:ege:2933FB" and r["i"] == "gen:eng_oge:1.L01", str(r))
    check("модуль: рецепт обществознания — fipi:soc", r["h"] == "fipi:soc:3B5147", str(r))
    ctx.close()


def main():
    with local_server(), sync_playwright() as p:
        browser = p.chromium.launch()
        for fn in (test_oge, test_random_is_null, test_ege_like, test_rus, test_module):
            try:
                fn(browser)
            except Exception as e:  # noqa: BLE001
                check(f"{fn.__name__}: исключение", False, repr(e)[:300])
        browser.close()
    bad = [n for n, ok in results if not ok]
    print(f"\nИтого: {len(results) - len(bad)} из {len(results)}")
    sys.exit(1 if bad else 0)


if __name__ == "__main__":
    main()
