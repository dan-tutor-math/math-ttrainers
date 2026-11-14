"""
Кабинет, задача Б4: подписи «уже было у ученика» и переключатель в тренажёрах.

Журнал ученика — локальная копия StudentMemory (сеть закрыта), события кладём
через StudentMemory.record. Проверяет:
  A. ОГЭ №9 (FipiMix): вне сессии — ни переключателя, ни точек; в сессии
     переключатель на три положения виден рядом с фильтром; у текущего решённого
     задания ФИПИ есть точка с событием и датой; «не подписывать» — точки нет;
     «скрывать решённые» — FipiMix.next не отдаёт задание с событием, а счётчик на
     карточке «осталось N из M»; «забыть это задание» убирает событие;
  B. ege_prof: в списке у решённого задания точка; «не подписывать» — нет;
     «скрывать решённые» — следующий/случайный выбор его не отдаёт, заголовок
     «осталось N из M»; копия (ege_base) работает так же;
  C. follower (?s= в адресе): active() — false, переключатель и точек нет;
  D. начальное положение берётся из настройки преподавателя (teacher:settings:v1).

Запуск: python3 test_prompt_b4_captions.py (сервер поднимается сам).
"""
import contextlib
import http.client
import os
import subprocess
import sys
import time

from playwright.sync_api import sync_playwright

HERE = os.path.dirname(os.path.abspath(__file__))
PORT = 8967
BASE = f"http://127.0.0.1:{PORT}"
FAILS = []
STUDENT = {"id": "aaaaaaaa-0000-4000-8000-000000000004", "name": "Ваня"}


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
                conn.request("GET", "/oge9.html")
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


CORS = {"access-control-allow-origin": "*", "access-control-allow-headers": "*", "access-control-allow-methods": "*"}


def db_route(route):
    # сервер журнала отвечает «удалено»: без ответа «забыть» честно не удаляет
    if "student_task_log" in route.request.url:
        route.fulfill(status=204, headers=CORS)
    else:
        route.abort()


def new_page(browser, url, session=True, settings=None):
    ctx = browser.new_context()
    page = ctx.new_page()
    errors = []
    page.on("pageerror", lambda e: errors.append(str(e)))
    page.route("https://**/*", db_route)
    if settings:
        page.add_init_script("localStorage.setItem('teacher:settings:v1', %r)" % settings)
    page.goto(url)
    page.wait_for_timeout(1200)
    if session:
        page.evaluate("s => StudentMemory.start(s)", STUDENT)
        page.wait_for_timeout(200)
    return ctx, page, errors


def toggle_visible(page):
    return page.evaluate("""() => {
        const t = document.querySelector('[data-tc-toggle]');
        return !!t && t.getBoundingClientRect().height > 0;
    }""")


def set_mode(page, mode):
    page.evaluate("m => document.querySelector('[data-tc-toggle] button[data-mode=\"'+m+'\"]').click()", mode)
    page.wait_for_timeout(150)


def dots(page):
    return page.evaluate("document.querySelectorAll('[data-tc-dot]').length")


# ── A. ОГЭ №9 ──
def test_oge9(browser):
    # вне сессии
    ctx, page, errors = new_page(browser, f"{BASE}/oge9.html", session=False)
    check("oge9 вне сессии: переключателя нет", not toggle_visible(page))
    check("oge9 вне сессии: активности нет", page.evaluate("TaskCaptions.active()") is False)
    ctx.close()

    ctx, page, errors = new_page(browser, f"{BASE}/oge9.html")
    check("oge9 в сессии: переключатель виден", toggle_visible(page))
    btns = page.evaluate("Array.from(document.querySelectorAll('[data-tc-toggle] button')).map(b => b.dataset.mode)")
    check("oge9: три положения", btns == ["show", "off", "hide_solved"], str(btns))
    check("oge9: начальное положение — «подписывать» (настройка по умолчанию)", page.evaluate("TaskCaptions.mode()") == "show")

    # вид с несколькими заданиями ФИПИ
    info = page.evaluate("""() => {
        const m = ALL_MODES.find(x => x.fipiList && x.fipiList.length >= 3);
        return m ? { id: m.id, n: m.fipiList.length, list: m.fipiList.map(f => f.fipi) } : null;
    }""")
    check("oge9: есть вид с заданиями ФИПИ", bool(info))
    mid, fl = info["id"], info["list"]
    solved = fl[0]
    key = "fipi:oge:" + solved

    # открываем вид; пока события нет — точки нет
    page.evaluate("""id => { document.querySelector('#modesGrid .mode-card[data-id="'+id+'"]').click(); }""", mid)
    page.wait_for_timeout(300)
    # подменяем текущее задание на решённое ФИПИ и показываем подпись как страница
    page.evaluate("""s => { curTask.fipi = s; TaskCaptions.showCurrent(document.getElementById('sourceNote'), curTask, curMode); }""", solved)
    check("oge9: без событий точки нет", dots(page) == 0)
    r = page.evaluate("k => StudentMemory.record(k, 'ok')", key)
    page.wait_for_timeout(200)
    check("oge9: событие записано", r.get("ok") is True, str(r))
    check("oge9: у текущего решённого задания есть точка", page.evaluate("document.querySelectorAll('.tc-cur [data-tc-dot]').length") == 1)
    page.hover('.tc-cur [data-tc-dot]')
    page.wait_for_timeout(200)
    pop = page.evaluate("document.querySelector('.tc-pop') ? document.querySelector('.tc-pop').innerText : ''")
    check("oge9: всплывашка с событием и датой", "Верно" in pop and "." in pop and "Забыть" in pop, pop)
    page.mouse.move(5, 5)
    page.wait_for_timeout(400)

    # «не подписывать»
    set_mode(page, "off")
    check("oge9: «не подписывать» — точки пропали", dots(page) == 0)
    # «скрывать решённые»
    set_mode(page, "hide_solved")
    got = page.evaluate("""([page, id, list]) => {
        const m = ALL_MODES.find(x => x.id === id);
        const seen = {};
        for (let i = 0; i < 60; i++) { const t = FipiMix.next(page, id, m.fipiList, () => ({ own: true })); seen[t.fipi || 'own'] = 1; }
        return Object.keys(seen);
    }""", ["oge9", mid, fl])
    check("oge9: «скрывать» не отдаёт решённое", solved not in got, str(got))
    check("oge9: «скрывать» отдаёт остальные", any(g in fl[1:] for g in got), str(got))
    label = page.evaluate("([id]) => FipiMix.countLabel('oge9', id, ALL_MODES.find(x => x.id === id).fipiList)", [mid])
    check("oge9: счётчик «осталось N из M»", ("осталось %d из %d" % (len(fl) - 1, len(fl))) in label, label)
    # в «показывать» решённое выпадает (список не пуст — выпадет хотя бы раз из 200)
    set_mode(page, "show")
    got = page.evaluate("""([id]) => {
        const m = ALL_MODES.find(x => x.id === id), seen = {};
        for (let i = 0; i < 200; i++) { const t = FipiMix.next('oge9', id, m.fipiList, () => ({ own: true })); seen[t.fipi || 'own'] = 1; }
        return Object.keys(seen);
    }""", [mid])
    check("oge9: «подписывать» не прячет решённое", solved in got, str(got))

    # забыть
    page.hover('.tc-cur [data-tc-dot]')
    page.wait_for_timeout(200)
    page.click('.tc-pop [data-tc-forget]')
    page.wait_for_timeout(400)
    check("oge9: «забыть» — события нет", page.evaluate("k => StudentMemory.summary(k).total", key) == 0)
    check("oge9: «забыть» — точка пропала", dots(page) == 0)
    check("oge9: без ошибок JS", not errors, str(errors[:1]))
    ctx.close()


# ── B. ege_prof и копия ──
def test_ege(browser, name):
    ctx, page, errors = new_page(browser, f"{BASE}/{name}.html?n=4")
    page.wait_for_timeout(500)
    check(f"{name}: переключатель виден в списке", toggle_visible(page))
    info = page.evaluate("""() => {
        const l = protos(S.n).filter(p => TaskCaptions.keyOfTask(p));
        return { ids: l.map(p => p.id), keys: l.map(p => TaskCaptions.keyOfTask(p)), n: S.n };
    }""")
    ids, keys = info["ids"], info["keys"]
    check(f"{name}: в номере есть задания с ключом", len(ids) >= 3, str(len(ids)))
    # решённое — первое задание с ключом fipi:
    idx = next((i for i, k in enumerate(keys) if k.startswith("fipi:")), 0)
    pid, key = ids[idx], keys[idx]
    check(f"{name}: до события точек нет", dots(page) == 0)
    page.evaluate("k => StudentMemory.record(k, 'bad')", key)
    page.wait_for_timeout(300)
    # список перерисовываем как страница при возврате к нему
    page.evaluate("showPicker()")
    page.wait_for_timeout(200)
    n_dot = page.evaluate("p => document.querySelectorAll('.mode-card[data-pid=\"'+p+'\"] [data-tc-dot], .mode-card[data-gid] [data-tc-dot]').length", pid)
    check(f"{name}: у решённого задания точка", n_dot >= 1, str(n_dot))
    set_mode(page, "off")
    check(f"{name}: «не подписывать» — точек нет", dots(page) == 0)
    set_mode(page, "hide_solved")
    title = page.evaluate("document.getElementById('pickerTitle').textContent")
    is_fipi = key.startswith("fipi:")   # у копий без банка ФИПИ (ege_base) пропускать нечего
    if is_fipi:
        check(f"{name}: заголовок «осталось N из M»", "осталось" in title and " из " in title, title)
    # выбор соседа и случайного: решённое не отдаётся
    page.evaluate("p => openTask(S.n, p)", ids[(idx + len(ids) - 1) % len(ids)])
    page.wait_for_timeout(200)
    nxt = page.evaluate("freshNeighbour(1).id")
    if is_fipi:
        check(f"{name}: следующее не отдаёт решённое", nxt != pid, nxt)
    else:
        check(f"{name}: не из банка ФИПИ — не пропускается", nxt == page.evaluate("protoNeighbour(1).id"), nxt)
    check(f"{name}: без события следующее — обычный сосед",
          page.evaluate("p => { TaskCaptions.setMode('off'); const r = freshNeighbour(1).id === protoNeighbour(1).id; TaskCaptions.setMode('hide_solved'); return r; }", pid))
    check(f"{name}: без ошибок JS", not errors, str(errors[:1]))
    ctx.close()


# ── C. follower ──
def test_follower(browser):
    ctx = browser.new_context()
    page = ctx.new_page()
    page.route("https://**/*", lambda route: route.abort())
    page.goto(f"{BASE}/oge9.html?s=ABCD")
    page.wait_for_timeout(1000)
    page.evaluate("s => { try { StudentMemory.start(s); } catch (e) {} }", STUDENT)
    check("follower: активности нет", page.evaluate("TaskCaptions.active()") is False)
    check("follower: переключателя нет", not toggle_visible(page))
    check("follower: точек нет", dots(page) == 0)
    ctx.close()


# ── D. настройка преподавателя ──
def test_settings(browser):
    ctx, page, _ = new_page(browser, f"{BASE}/oge9.html", settings='{"labels":"hide_solved"}')
    check("настройка: начальное положение «скрывать решённые»", page.evaluate("TaskCaptions.mode()") == "hide_solved")
    pressed = page.evaluate("document.querySelector('[data-tc-toggle] button[aria-pressed=\"true\"]').dataset.mode")
    check("настройка: переключатель стоит в нём", pressed == "hide_solved", pressed)
    ctx.close()
    ctx, page, _ = new_page(browser, f"{BASE}/oge9.html", settings='{"labels":"off"}')
    check("настройка: «не подписывать» из кабинета", page.evaluate("TaskCaptions.mode()") == "off")
    ctx.close()


def main():
    with local_server(), sync_playwright() as p:
        browser = p.chromium.launch()
        test_oge9(browser)
        test_ege(browser, "ege_prof")
        test_ege(browser, "ege_base")
        test_follower(browser)
        test_settings(browser)
        browser.close()
    print()
    print("ПРОВАЛЕНО: " + "; ".join(FAILS) if FAILS else "ВСЁ ЗЕЛЁНОЕ")
    sys.exit(1 if FAILS else 0)


if __name__ == "__main__":
    main()
