"""
Промпт №15 (новый список): на досках в панели тренажёров рядом с
«Добавить на доску» — кнопка «Обновить пример».

Проверяет:
  1. Кнопки в одном ряду внизу кадра, «Обновить» сразу справа от «Добавить»
     (зазор в несколько пикселей), на одной высоте; помещаются и в широкой
     панели, и в самой узкой (300 px — подписи короче), и на телефоне.
     Пока в панели список тренажёров, кнопок нет. Плавающая клавиатура
     тренажёра в узком кадре поднята над рядом — «Ввод» не закрыт.
  2. Нажимает ту же кнопку, что ⟳ в самом тренажёре: сложение, ОГЭ №6,
     движок линейных ОГЭ №9 (#refreshBtn), дробно-рациональные ОГЭ №9
     (#mcqRefreshBtn), а с промпта №14 «логарифмы и тригонометрия» — и
     логарифмы с тригонометрией (у них появилась своя ⟳; уровень, вид
     задания и тип уравнения те же) — ловим нажатие и смену примера.
  3. Где ⟳ у основного задания нет — новый пример того же типа через
     __trainerState.newTask(): деление в столбик, «Проценты»; тип и
     уровень те же.
  4. ЕГЭ база — следующий прототип того же номера; у номера с одним
     прототипом (ЕГЭ профиль №6) — подсказка, задание не меняется.
  5. Экран выбора типа — подсказка «Сначала откройте задание», ничего не
     открывается.
  6. Сценарий урока: «Добавить» → «Обновить» → «Добавить» — на доске два
     разных задания. Пока задание снимается, «Обновить» недоступна.
  7. Нет ошибок JavaScript.

Запуск: python3 test_prompt15_board_refresh_btn.py (сервер поднимается сам).
Совместного режима кнопка не касается: тренажёр в панели к сессии не
подключается (пустышка TrainerSession у своих кадров, раздел 8 HANDOFF).
"""
import contextlib
import http.client
import json
import subprocess
import sys
import time

from playwright.sync_api import sync_playwright

PORT = 8999
BASE = f"http://127.0.0.1:{PORT}"
FRAME = "document.getElementById('bdTrainersIframe')"
FAILS = []


def check(name, ok, info=""):
    print(("[OK] " if ok else "[FAIL] ") + name + ("" if ok else f" — {info}"))
    if not ok:
        FAILS.append(name)


@contextlib.contextmanager
def local_server():
    proc = subprocess.Popen([sys.executable, "-m", "http.server", str(PORT)],
                            stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    try:
        for _ in range(50):
            try:
                conn = http.client.HTTPConnection("127.0.0.1", PORT, timeout=0.2)
                conn.request("GET", "/boards.html")
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


BOOT_JS = """() => { const g = document.getElementById('authGate'); if (g) g.style.display = 'none'; window.boardsAppBoot(); }"""
SEED_JS = """([boards, payloads]) => new Promise((resolve, reject) => {
    const req = indexedDB.open('ogeBoardsDB', 1);
    req.onupgradeneeded = () => req.result.createObjectStore('state');
    req.onsuccess = () => {
      const tx = req.result.transaction('state', 'readwrite');
      const st = tx.objectStore('state');
      st.put({ __v: 2, folders: [], boards, deleted: [], sortMode: 'my' }, 'db');
      Object.keys(payloads).forEach(id => st.put(payloads[id], 'boarddata:' + id));
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => reject(tx.error);
    };
    req.onerror = () => reject(req.error);
})"""
LITE = {"id": "bA", "name": "Урок", "folderId": None, "createdAt": 1000, "updatedAt": 1000,
        "lastOpenedAt": None, "rev": 1, "cellSize": 24, "sheetCols": 76, "sheetRows": 54,
        "pageOrder": "h", "recentColors": [], "colorUsage": {}, "view": {"x": 0, "y": 0, "zoom": 1}}


def open_board(browser, w=1400, h=900, mobile=False):
    kw = {"viewport": {"width": w, "height": h}}
    if mobile:
        kw.update(is_mobile=True, has_touch=True)
    ctx = browser.new_context(**kw)
    # всё наружу обрывается — и у доски, и у тренажёра в кадре: иначе кадр
    # заводит сессию в настоящей базе (раздел 8 HANDOFF)
    ctx.route("https://**/*", lambda r: r.abort())
    page = ctx.new_page()
    errors = []
    page.on("pageerror", lambda e: errors.append(str(e)))
    page.goto(f"{BASE}/boards.html")
    page.evaluate(SEED_JS, [[LITE], {"bA": {"objects": [], "imageLib": []}}])
    page.reload()
    page.evaluate(BOOT_JS)
    page.wait_for_function("() => window.getDB && window.getDB().boards.length >= 1")
    page.evaluate("() => window.openBoard('bA')")
    page.wait_for_function("() => window.getCurrentBoard() && Array.isArray(window.getCurrentBoard().objects)")
    page.evaluate("() => setTrainersPanel('open')")
    page.wait_for_timeout(300)
    return ctx, page, errors


def open_trainer(page, tid, href, prep_js=None):
    page.evaluate(f"() => openTrainerInPanel({json.dumps(tid)}, {json.dumps(href)}, {json.dumps(tid)})")
    page.wait_for_function(f"""() => {{ try {{ const f = {FRAME};
        return f.contentDocument.readyState === 'complete' && typeof f.contentWindow.tsGetState === 'function'; }}
        catch (e) {{ return false; }} }}""", timeout=20000)
    page.wait_for_timeout(500)
    if prep_js:
        page.evaluate(f"() => {FRAME}.contentWindow.eval({json.dumps(prep_js)})")
        page.wait_for_timeout(600)


def fx(page, expr):
    return page.evaluate(f"() => {FRAME}.contentWindow.eval({json.dumps(expr)})")


# текст текущего задания — тот же узел, что снимает «Добавить на доску»
SIG_JS = f"""() => {{ const d = {FRAME}.contentDocument;
  const ns = collectTrainerCaptureNodes(d, trainersOpenId); ns.forEach(n => n.restore && n.restore());
  const m = ns.find(n => n.el.id !== 'theoryContent'); return m ? m.el.innerText.replace(/\\s+/g, ' ').trim() : null; }}"""


def sig(page):
    return page.evaluate(SIG_JS)


def toast(page):
    return page.evaluate("() => { const t = document.getElementById('bdTrainersToast'); return t.classList.contains('show') ? t.textContent : ''; }")


def press_refresh(page, wait=500):
    page.click("#bdTrainersRefreshBtn")
    page.wait_for_timeout(wait)


def refresh_changes(page, tries=4):
    """Новый пример бывает случайно таким же — даём несколько нажатий."""
    before = sig(page)
    for _ in range(tries):
        press_refresh(page)
        after = sig(page)
        if after and after != before:
            return before, after
    return before, sig(page)


SPY_JS = """(id) => { const d = %s.contentDocument; const b = d.getElementById(id);
  if (!b) return false; b.addEventListener('click', () => { d.defaultView.__spy = (d.defaultView.__spy || 0) + 1; }); return true; }""" % FRAME
API_SPY_JS = """() => { const w = %s.contentWindow; const api = w.__trainerState; const f = api.newTask;
  w.__apiSpy = 0; api.newTask = function(){ w.__apiSpy++; return f.apply(this, arguments); }; return true; }""" % FRAME


def layout(page):
    return page.evaluate("""() => {
      const a = document.getElementById('bdTrainersAddBtn').getBoundingClientRect();
      const r = document.getElementById('bdTrainersRefreshBtn').getBoundingClientRect();
      const p = document.getElementById('bdTrainersFrameWrap').getBoundingClientRect();
      return { gap: r.left - a.right, dy: Math.abs((a.top + a.height / 2) - (r.top + r.height / 2)),
               inside: a.left >= p.left && r.right <= p.right && a.bottom <= p.bottom + 1,
               visible: a.width > 0 && r.width > 0, oneLine: a.height < 60 && r.height < 60,
               refreshText: document.getElementById('bdTrainersRefreshBtn').innerText.trim() }; }""")


def test_layout(browser):
    ctx, page, errors = open_board(browser)
    vis = page.evaluate("() => document.getElementById('bdTrainersRefreshBtn').getClientRects().length > 0")
    check("1. пока в панели список тренажёров — кнопок нет", not vis)
    open_trainer(page, "add_col", "addition.html")
    L = layout(page)
    check("1. «Обновить пример» сразу справа от «Добавить на доску», на одной высоте",
          L["visible"] and 0 <= L["gap"] <= 12 and L["dy"] < 2, str(L))
    check("1. 420 px: обе кнопки в кадре, подпись полная", L["inside"] and L["oneLine"] and "Обновить пример" in L["refreshText"], str(L))
    page.evaluate("() => { document.getElementById('bdTrainersPanel').style.setProperty('--tp-w', '300px'); }")
    page.wait_for_timeout(300)
    L = layout(page)
    check("1. 300 px: обе кнопки помещаются в одну строку", L["inside"] and L["oneLine"] and 0 <= L["gap"] <= 12, str(L))
    check("1. без ошибок JS", not errors, "; ".join(errors[:2]))
    ctx.close()

    ctx, page, errors = open_board(browser, 375, 800, mobile=True)
    open_trainer(page, "add_col", "addition.html")
    L = layout(page)
    check("1. телефон 375: обе кнопки в кадре, в ряд", L["inside"] and L["oneLine"] and 0 <= L["gap"] <= 12 and L["dy"] < 2, str(L))
    ctx.close()

    # клавиатура тренажёра в узком кадре — над рядом кнопок, «Ввод» не закрыт
    for w in (420, 300):
        ctx, page, errors = open_board(browser)
        page.evaluate(f"() => document.getElementById('bdTrainersPanel').style.setProperty('--tp-w', '{w}px')")
        open_trainer(page, "oge6", "oge6.html", "document.querySelectorAll('.mode-card:not(.soon):not(.demo)')[1].click()")
        r = page.evaluate(f"""() => {{ const f = {FRAME}; const fr = f.getBoundingClientRect();
          const kp = f.contentDocument.getElementById('keypadFloat');
          const k = kp.getBoundingClientRect(); const row = document.getElementById('bdTrainersActions').getBoundingClientRect();
          return {{ shown: getComputedStyle(kp).display !== 'none', kpBottom: fr.top + k.bottom, rowTop: row.top }}; }}""")
        check(f"1. {w} px: клавиатура тренажёра в кадре — над кнопками, «Ввод» не закрыт",
              r["shown"] and r["kpBottom"] <= r["rowTop"], str(r))
        ctx.close()


def test_own_button(browser):
    ctx, page, errors = open_board(browser)
    cases = [
        ("Сложение", "add_col", "addition.html", None, "refreshBtn"),
        ("ОГЭ №6", "oge6", "oge6.html", "document.querySelectorAll('.mode-card:not(.soon):not(.demo)')[1].click()", "refreshBtn"),
        ("ОГЭ №9, линейные", "oge9", "oge9.html", "openModeById('linear')", "refreshBtn"),
        ("ОГЭ №9, дробно-рациональные", "oge9", "oge9.html", "openModeById('rational')", "mcqRefreshBtn"),
        # промпт №14 «логарифмы и тригонометрия»: своя ⟳ — тот же уровень и вид / тип
        ("Логарифмы", "logarithms", "logarithms.html",
         "document.querySelector('.tile[data-pid=\"prod\"]').click(); document.querySelector('.tile[data-pid=\"quot\"]').click(); document.getElementById('pkStart').click(); setLevel(2)",
         "refreshBtn"),
        ("Тригонометрия", "trig_equations", "trig_equations.html",
         "document.querySelector('.tile[data-pid=\"egeArg\"]').click(); document.querySelector('.tile[data-pid=\"kx\"]').click(); document.getElementById('pkStart').click()",
         "refreshBtn"),
    ]
    kinds = {"logarithms": "S.props.join() + '/' + S.task.lvl + '/' + S.task.type", "trig_equations": "S.props.join() + '/' + S.task.pid"}
    for name, tid, href, prep, btn in cases:
        open_trainer(page, tid, href, prep)
        page.evaluate(SPY_JS, btn)
        kind0 = fx(page, kinds[tid]) if tid in kinds else None
        before, after = refresh_changes(page)
        spy = fx(page, "window.__spy || 0")
        check(f"2. {name}: нажата ⟳ самого тренажёра (#{btn})", spy >= 1, str(spy))
        check(f"2. {name}: пример сменился", bool(before) and after != before, f"{before!r} → {after!r}")
        if tid in kinds:
            check(f"2. {name}: тип и уровень те же", fx(page, kinds[tid]) == kind0, f"{kind0} → {fx(page, kinds[tid])}")
    check("2. без ошибок JS", not errors, "; ".join(errors[:2]))
    ctx.close()


def test_new_task(browser):
    ctx, page, errors = open_board(browser)
    cases = [
        ("Деление в столбик", "div_col", "division.html", None, "curLevel"),
        ("Проценты", "percent", "percent.html", "openProto('parts', 2)", "S.pid + '/' + S.lvl"),
    ]
    for name, tid, href, prep, kind_expr in cases:
        open_trainer(page, tid, href, prep)
        kind0 = fx(page, kind_expr)
        page.evaluate(API_SPY_JS)
        before, after = refresh_changes(page)
        spy = fx(page, "window.__apiSpy")
        check(f"3. {name}: новый пример через __trainerState.newTask()", spy >= 1, str(spy))
        check(f"3. {name}: пример сменился", bool(before) and after != before, f"{before!r} → {after!r}")
        check(f"3. {name}: тип и уровень те же", fx(page, kind_expr) == kind0, f"{kind0} → {fx(page, kind_expr)}")
    check("3. без ошибок JS", not errors, "; ".join(errors[:2]))
    ctx.close()


def test_ege_and_picker(browser):
    ctx, page, errors = open_board(browser)
    open_trainer(page, "egeb8", "ege_base.html?n=8", "document.querySelectorAll('.mode-card')[0].click()")
    n0, pid0 = fx(page, "S.n"), fx(page, "S.pid")
    press_refresh(page)
    n1, pid1 = fx(page, "S.n"), fx(page, "S.pid")
    check("4. ЕГЭ база №8: следующий прототип того же номера", n1 == n0 and pid1 != pid0, f"{n0}/{pid0} → {n1}/{pid1}")
    # у ЕГЭ профиля №6 и всех номеров ОГЭ ч. 2 прототип один
    open_trainer(page, "ege6", "ege_prof.html?n=6", "document.querySelectorAll('.mode-card')[0].click()")
    single = fx(page, "protos(S.n).length") == 1
    s0 = sig(page)
    press_refresh(page, 300)
    check("4. ЕГЭ профиль №6 (один прототип): подсказка, задание то же",
          single and "один прототип" in toast(page) and sig(page) == s0, toast(page))

    open_trainer(page, "oge6", "oge6.html")
    on_picker = fx(page, "els.taskArea.style.display === 'none'")
    press_refresh(page, 300)
    check("5. экран выбора типа: «Сначала откройте задание», тип не открылся",
          on_picker and "Сначала откройте задание" in toast(page) and fx(page, "els.taskArea.style.display === 'none'"), toast(page))
    check("4–5. без ошибок JS", not errors, "; ".join(errors[:2]))
    ctx.close()


# в ОГЭ берём обычный тип, не «Демоверсию»: у неё задание одно, и ⟳ самого
# тренажёра даёт то же самое — это так и задумано (раздел 4 HANDOFF)
def test_lesson_flow(browser):
    ctx, page, errors = open_board(browser)
    open_trainer(page, "oge6", "oge6.html", "document.querySelectorAll('.mode-card:not(.soon):not(.demo)')[1].click()")
    page.click("#bdTrainersAddBtn")
    busy = page.evaluate("() => document.getElementById('bdTrainersRefreshBtn').disabled")
    page.wait_for_function("() => getCurrentBoard().objects.length === 1 && !document.getElementById('bdTrainersAddBtn').disabled", timeout=30000)
    check("6. пока задание снимается, «Обновить» недоступна", busy)
    check("6. после снимка «Обновить» снова доступна", not page.evaluate("() => document.getElementById('bdTrainersRefreshBtn').disabled"))
    refresh_changes(page)
    page.click("#bdTrainersAddBtn")
    page.wait_for_function("() => getCurrentBoard().objects.length === 2 && !document.getElementById('bdTrainersAddBtn').disabled", timeout=30000)
    objs = page.evaluate("() => getCurrentBoard().objects.map(o => ({ src: o.src ? o.src.length + ':' + o.src.slice(-80) : '', ans: o.task ? JSON.stringify(o.task.fields || o.task.correct) : '' }))")
    check("6. «Добавить» → «Обновить» → «Добавить»: на доске два разных задания",
          len(objs) == 2 and objs[0]["src"] != objs[1]["src"], str(objs)[:300])
    check("6. без ошибок JS", not errors, "; ".join(errors[:2]))
    ctx.close()


def main():
    with local_server(), sync_playwright() as p:
        browser = p.chromium.launch()
        test_layout(browser)
        test_own_button(browser)
        test_new_task(browser)
        test_ege_and_picker(browser)
        test_lesson_flow(browser)
        browser.close()
    print()
    if FAILS:
        print(f"ИТОГ: {len(FAILS)} проверок не прошло")
        sys.exit(1)
    print("ИТОГ: всё прошло")


if __name__ == "__main__":
    main()
