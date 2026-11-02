"""
Панель тренажёров по предметам («„панель по предметам“», 02.11.2026).

Список тренажёров для досок и презентаций, панель на телефоне
(boards-panel.html) и каталог «Работ» (works.html) строятся из одного
каталога subjects-catalog.js — того же, что вкладки экзаменов на главной.

Проверяет:
  1. Доска: над списком переключатель «Математика / Русский /
     Обществознание / Английский»; по умолчанию — предмет главной
     (ogeNav:subject), без него — математика; у математики прежние разделы
     ОГЭ (18), ЕГЭ профиль (20), ЕГЭ база (21), Основа (14).
  2. Обществознание — ОГЭ, 20 номеров; русский — ОГЭ №2–12 (без изложения
     и сочинения); английский — 8 позиций, без аудирования. Выбор помнится
     после перезагрузки (ttPanel:subject).
  3. Поиск ищет по всем предметам, к заголовку раздела приписан предмет.
  4. Обществознание на доску: краткий ответ — живое задание с полем
     ответа; «Обновить пример» меняет задание того же номера; подпись для
     «Подборки» — «Обществознание ОГЭ №5. …».
  5. Английский и русский на доску: снимок ложится; у русского на снимке
     нет кнопки «Проверить» (strip), живая страница не тронута.
  6. Панель на телефоне и «Работы»: тот же переключатель, тот же список.
  7. Новый экзамен одной записью в каталоге появляется и в панели, и на
     главной.
  8. Нет ошибок JavaScript.

Запуск: ~/.venvs/trainers/bin/python test_prompt_panel_subjects.py
"""
import contextlib
import http.client
import json
import subprocess
import sys
import time

from playwright.sync_api import sync_playwright

PORT = 9241
BASE = f"http://127.0.0.1:{PORT}"
FAILS = []
FRAME = "document.getElementById('bdTrainersIframe')"


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
                conn.request("GET", "/index.html")
                conn.getresponse()
                break
            except Exception:
                time.sleep(0.1)
        yield
    finally:
        proc.terminate()
        proc.wait(timeout=5)


BOOT_JS = """() => { const g = document.getElementById('authGate'); if (g) g.style.display = 'none';
  document.getElementById('screenList').style.display = ''; window.boardsAppBoot(); }"""
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

# что показано в списке: [предмет кнопки «on», [[заголовок раздела, число пунктов, имена]]]
LIST_JS = """(sel) => { const root = document.querySelector(sel);
  const on = root.querySelector('.tt-subj.on');
  const tabs = [...root.querySelectorAll('.tt-subj')].map(b => b.textContent.trim());
  const groups = [...root.children].filter(d => !d.classList.contains('tt-subj-row')).map(d => {
    const t = d.querySelector('.bd-trainers-group-title, .cat-group-title');
    const items = [...d.querySelectorAll('.bd-trainers-item, .cat-item')];
    return t ? [t.textContent.trim(), items.length, items.map(i => i.dataset.id)] : null; }).filter(Boolean);
  return { on: on ? on.dataset.subj : null, tabs, groups }; }"""

# новый экзамен одной записью: у обществознания вместо заглушки «ЕГЭ» —
# один номер. Дописывается к самому subjects-catalog.js, как если бы его
# так и правили
EXTRA_EXAM = """
;(function(){ const C = window.MathhCatalog;
  C.trainers.socege1 = { name: '№1. Тестовый номер', href: 'soc_oge.html?n=2', subject: 'soc', cap: 'ege', eq: 'проверка' };
  const e = C.exams.find(x => x.subject === 'soc' && x.id === 'ege');
  e.soon = false; e.groups = [{ title: 'Часть 1', items: ['socege1'] }];
})();
"""


def new_ctx(browser, w=1400, h=900, extra_exam=False, local=None):
    ctx = browser.new_context(viewport={"width": w, "height": h})
    # всё наружу обрывается: иначе кадр заводит сессию в настоящей базе
    ctx.route("https://**/*", lambda r: r.abort())
    if extra_exam:
        def patch(route):
            resp = route.fetch()
            route.fulfill(response=resp, body=resp.text() + EXTRA_EXAM)
        ctx.route("**/subjects-catalog.js", patch)
    if local is not None:
        # только при первом открытии вкладки: перезагрузка должна видеть то,
        # что страница запомнила сама
        ctx.add_init_script("(() => { try { if (sessionStorage.getItem('__seeded')) return;"
                            " sessionStorage.setItem('__seeded', '1'); localStorage.clear(); const v = %s;"
                            " Object.keys(v).forEach(k => localStorage.setItem(k, v[k])); } catch (e) {} })()"
                            % json.dumps(local))
    page = ctx.new_page()
    errors = []
    page.on("pageerror", lambda e: errors.append(str(e)))
    return ctx, page, errors


def open_board(browser, **kw):
    ctx, page, errors = new_ctx(browser, **kw)
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


def board_list(page):
    return page.evaluate(LIST_JS, "#bdTrainersGroups")


def pick_subject(page, root, subj):
    page.click(f"{root} .tt-subj[data-subj='{subj}']")
    page.wait_for_timeout(100)


def open_trainer(page, tid, href, prep_js=None, wait_fn="typeof f.contentWindow.tsGetState === 'function'"):
    page.evaluate(f"() => openTrainerInPanel({json.dumps(tid)}, {json.dumps(href)}, {json.dumps(tid)})")
    page.wait_for_function(f"""() => {{ try {{ const f = {FRAME};
        return f.contentDocument.readyState === 'complete' && {wait_fn}; }}
        catch (e) {{ return false; }} }}""", timeout=20000)
    page.wait_for_timeout(700)
    if prep_js:
        page.evaluate(f"() => {FRAME}.contentWindow.eval({json.dumps(prep_js)})")
        page.wait_for_timeout(900)


def fx(page, expr):
    return page.evaluate(f"() => {FRAME}.contentWindow.eval({json.dumps(expr)})")


def add_to_board(page, n_before):
    page.click("#bdTrainersAddBtn")
    page.wait_for_function(f"() => getCurrentBoard().objects.length > {n_before} && !document.getElementById('bdTrainersAddBtn').disabled",
                           timeout=40000)
    return page.evaluate("() => { const o = getCurrentBoard().objects.slice(-1)[0];"
                         " return { type: o.type, w: o.w, h: o.h, src: !!o.src, task: o.task || null, tid: o.trainerId || (o.gen && o.gen.tid) || null }; }")


def test_switch(browser):
    ctx, page, errors = open_board(browser, local={})
    L = board_list(page)
    check("1. переключатель: четыре предмета", L["tabs"] == ["Математика", "Русский", "Обществознание", "Английский"], str(L["tabs"]))
    check("1. по умолчанию — математика", L["on"] == "math", str(L["on"]))
    check("1. математика — прежние разделы", [(g[0], g[1]) for g in L["groups"]]
          == [("ОГЭ", 18), ("ЕГЭ профиль", 20), ("ЕГЭ база", 21), ("Основа", 14)], str([(g[0], g[1]) for g in L["groups"]]))

    pick_subject(page, "#bdTrainersGroups", "soc")
    L = board_list(page)
    check("2. обществознание: ОГЭ, 20 номеров", L["on"] == "soc" and [(g[0], g[1]) for g in L["groups"]] == [("ОГЭ", 20)], str(L))
    pick_subject(page, "#bdTrainersGroups", "rus")
    L = board_list(page)
    ids = L["groups"][0][2] if L["groups"] else []
    check("2. русский: №2–12, без изложения и сочинения", ids == ["rus%d" % n for n in range(2, 13)], str(ids))
    pick_subject(page, "#bdTrainersGroups", "eng")
    L = board_list(page)
    ids = L["groups"][0][2] if L["groups"] else []
    check("2. английский: 8 позиций, без аудирования", len(ids) == 8 and not {"eng1", "eng5", "eng6"} & set(ids), str(ids))
    pick_subject(page, "#bdTrainersGroups", "soc")
    page.reload()
    page.evaluate(BOOT_JS)
    page.wait_for_function("() => window.getDB && window.getDB().boards.length >= 1")
    page.evaluate("() => { window.openBoard('bA'); setTrainersPanel('open'); }")
    page.wait_for_timeout(400)
    check("2. выбор предмета помнится после перезагрузки", board_list(page)["on"] == "soc", str(board_list(page)["on"]))

    page.fill("#bdTrainersSearch", "Экономика")
    page.wait_for_timeout(150)
    L = board_list(page)
    check("3. поиск по всем предметам, предмет в заголовке раздела",
          [g[0] for g in L["groups"]] == ["Обществознание · ОГЭ"] and set(L["groups"][0][2]) == {"soc9", "soc10"}, str(L["groups"]))
    page.fill("#bdTrainersSearch", "Прогрессии")
    page.wait_for_timeout(150)
    L = board_list(page)
    check("3. из обществознания находится и математика", [g[0] for g in L["groups"]] == ["Математика · ОГЭ"], str(L["groups"]))
    check("1–3. без ошибок JS", not errors, "; ".join(errors[:2]))
    ctx.close()

    ctx, page, errors = open_board(browser, local={"ogeNav:subject": "eng"})
    check("1. без своего выбора панель берёт предмет главной", board_list(page)["on"] == "eng", str(board_list(page)["on"]))
    ctx.close()


def test_soc_to_board(browser):
    ctx, page, errors = open_board(browser, local={"ttPanel:subject": "soc"})
    open_trainer(page, "soc5", "soc_oge.html?n=5", "document.querySelectorAll('.mode-card')[0].click()")
    obj = add_to_board(page, 0)
    fields = (obj["task"] or {}).get("fields") or []
    check("4. обществознание №5 на доске — живое задание с полем ответа",
          obj["src"] and obj["task"] and obj["task"].get("kind") == "fields" and len(fields) >= 1, str(obj)[:300])
    pid0 = fx(page, "S.pid")
    for _ in range(4):
        page.click("#bdTrainersRefreshBtn")
        page.wait_for_timeout(700)
        if fx(page, "S.pid") != pid0:
            break
    check("4. «Обновить пример» — другое задание того же номера", fx(page, "S.n") == 5 and fx(page, "S.pid") != pid0,
          f"{pid0} → {fx(page, 'S.pid')}")
    check("4. подпись «Подборки» с предметом", page.evaluate("() => TRAINER_NAMES.soc5") ==
          "Обществознание ОГЭ №5. Человек, общество, культура: ситуация", page.evaluate("() => TRAINER_NAMES.soc5"))

    open_trainer(page, "soc18", "soc_oge.html?n=18", "document.querySelectorAll('.mode-card')[0].click()")
    obj = add_to_board(page, 1)
    check("4. развёрнутый ответ (№18) ложится картинкой", obj["src"] and not obj["task"], str(obj)[:200])
    check("4. без ошибок JS", not errors, "; ".join(errors[:2]))
    ctx.close()


def test_eng_rus_to_board(browser):
    ctx, page, errors = open_board(browser, local={"ttPanel:subject": "eng"})
    open_trainer(page, "eng20", "eng_oge.html?n=20", "document.querySelectorAll('.mode-card')[0].click()")
    obj = add_to_board(page, 0)
    check("5. английский (грамматика) на доске", obj["src"] and obj["h"] > 40, str(obj)[:200])

    # у №5 подтем нет — страница сама открывает первое задание номера
    open_trainer(page, "rus5", "rus_oge.html?n=5",
                 wait_fn="!!f.contentDocument.querySelector('#taskArea') && f.contentDocument.getElementById('taskArea').style.display !== 'none'")
    check("5. русский: задание открыто", fx(page, "document.getElementById('taskArea').style.display !== 'none'"))
    obj = add_to_board(page, 1)
    check("5. русский №5 на доске", obj["src"] and obj["h"] > 40, str(obj)[:200])
    live_btn = fx(page, "(() => { const b = document.getElementById('checkBtn'); return !!b && getComputedStyle(b).display !== 'none'; })()")
    check("5. живая страница русского не тронута — «Проверить» на месте", live_btn)
    strip = page.evaluate("""() => { const d = %s.contentDocument;
      const ns = collectTrainerCaptureNodes(d, 'rus5'); return ns.length ? ns[0].el.getAttribute('data-bd-strip') : null; }""" % FRAME)
    check("5. у снимка русского кнопки и отзыв прячутся", bool(strip) and ".check-btn" in strip, str(strip))
    check("5. без ошибок JS", not errors, "; ".join(errors[:2]))
    ctx.close()


def test_phone_panel_and_works(browser):
    ctx, page, errors = new_ctx(browser, w=390, h=844, local={"ttPanel:subject": "rus"})
    page.goto(f"{BASE}/boards-panel.html")
    page.wait_for_timeout(500)
    L = page.evaluate(LIST_JS, "#bpGroups")
    check("6. панель на телефоне: переключатель и русский", len(L["tabs"]) == 4 and L["on"] == "rus"
          and L["groups"] and L["groups"][0][1] == 11, str(L)[:300])
    # пока устройство не подключено, список спрятан за экраном кода —
    # нажимаем кнопку из скрипта: проверяем список, а не экран подключения
    page.evaluate("() => document.querySelector('#bpGroups .tt-subj[data-subj=soc]').click()")
    L = page.evaluate(LIST_JS, "#bpGroups")
    check("6. панель на телефоне: переключение на обществознание", L["on"] == "soc" and L["groups"][0][1] == 20, str(L)[:200])
    check("6. панель на телефоне: без ошибок JS", not errors, "; ".join(errors[:2]))
    ctx.close()



# «Работы» — с заглушкой Supabase и входом учителя из теста этапа 1
def test_works():
    import test_prompt15_works_stage1 as w
    with w.local_server(), w.sync_playwright() as p:
        browser = p.chromium.launch()
        ctx = w.new_context(browser, viewport={"width": 1440, "height": 950})
        ctx.add_init_script("(() => { try { if (sessionStorage.getItem('__seeded')) return; sessionStorage.setItem('__seeded', '1');"
                            " localStorage.setItem('ttPanel:subject', 'eng'); } catch (e) {} })()")
        page = ctx.new_page()
        errors = []
        page.on("pageerror", lambda e: errors.append(str(e)))
        page.goto(f"{w.BASE}/works.html")
        page.wait_for_selector("#scrAuth:not([hidden])")
        page.fill("#auEmail", w.TEACHER["email"]); page.fill("#auPass", w.TEACHER["password"]); page.click("#auGo")
        page.wait_for_selector("#scrList:not([hidden])")
        page.click("#newWork"); page.wait_for_selector("#scrEdit:not([hidden])")
        L = page.evaluate(LIST_JS, "#catList")
        check("6. «Работы»: переключатель, английский", len(L["tabs"]) == 4 and L["on"] == "eng" and L["groups"] and L["groups"][0][1] == 8, str(L)[:200])
        page.click("#catList .tt-subj[data-subj='math']")
        L = page.evaluate(LIST_JS, "#catList")
        check("6. «Работы»: математика — прежние разделы", [g[0] for g in L["groups"]] == ["ОГЭ", "ЕГЭ профиль", "ЕГЭ база", "Основа"], str(L["groups"])[:200])
        page.click("#catList .tt-subj[data-subj='soc']")
        page.click("#catList .cat-item[data-id='soc9']")
        page.wait_for_timeout(1500)
        check("6. «Работы»: обществознание открывается в кадре", page.inner_text("#catTitle").strip() == "№9. Экономика", page.inner_text("#catTitle"))
        check("6. «Работы»: без ошибок JS", not errors, "; ".join(errors[:2]))
        ctx.close()
        browser.close()


def test_new_exam(browser):
    ctx, page, errors = open_board(browser, extra_exam=True, local={"ttPanel:subject": "soc"})
    L = board_list(page)
    check("7. новый экзамен в каталоге — сам появился в панели", [(g[0], g[1]) for g in L["groups"]] == [("ОГЭ", 20), ("ЕГЭ", 1)], str(L["groups"]))
    check("7. и снимается на доску как страница ЕГЭ", page.evaluate("() => !!TRAINER_CAPTURE.socege1 && isEgeLikeTrainer('socege1')"))
    ctx.close()
    ctx, page, errors = new_ctx(browser, extra_exam=True, local={})
    page.goto(f"{BASE}/index.html?subject=soc")
    page.wait_for_timeout(500)
    st = page.evaluate("() => SUBJECTS.find(s => s.id === 'soc').nav[0].subtabs.find(t => t.id === 'ege')")
    check("7. и на главной: вкладка ЕГЭ обществознания с номером", st and not st.get("soon") and st["groups"][0]["items"] == ["socege1"], str(st))
    check("7. без ошибок JS", not errors, "; ".join(errors[:2]))
    ctx.close()


def main():
    with local_server(), sync_playwright() as p:
        browser = p.chromium.launch()
        test_switch(browser)
        test_soc_to_board(browser)
        test_eng_rus_to_board(browser)
        test_phone_panel_and_works(browser)
        test_new_exam(browser)
        browser.close()
    test_works()
    print()
    if FAILS:
        print(f"ПРОВАЛЫ ({len(FAILS)}):")
        for n in FAILS:
            print("  -", n)
        sys.exit(1)
    print("ИТОГ: всё прошло")


if __name__ == "__main__":
    main()
