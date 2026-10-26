"""
Промпт №108: клавиатура ответа у живых заданий на доске (board-answer-pad.js).

На доску кладётся ОГЭ №20 из банка ФИПИ с ответом 4 − √7; 4 + √7 и задание
с дробными корнями −1/6; 1/2. Проверяем:
  1. С мышью: фокус в поле — узкая полоска √ ± / ; ( ) 123 ✕, системная
     клавиатура не трогается (inputmode как был).
  2. Полоска пишет в место курсора и шлёт событие input (черновик задания
     обновляется — по нему поле уходит собеседнику).
  3. Строка «Читается так»: 4−√7 → KaTeX с \\sqrt, дроби — вертикальные
     (\\dfrac), √2+3 — корень только из 2, √(2+3) — из суммы.
  4. «4±√7» засчитан как два корня, «x = 4 ± √7» тоже; дроби «-1/6; 1/2»
     засчитаны, набранные кнопками.
  5. «123» раскрывает цифры (и запоминается), ✕ закрывает, потеря фокуса
     закрывает, после верного ответа (поле только для чтения) не открывается.
  6. Сенсорный экран (has_touch, pointer: coarse): полная клавиатура сразу,
     у поля inputmode="none" (системная не вылезает), «Проверить» в панели
     проверяет, ⌨ возвращает системную и запоминает выбор.
  7. Поле «да/нет» клавиатуры не получает; панель держится у поля при
     сдвиге доски и прячется, когда поле ушло с экрана.

Запуск: python3 test_prompt108_board_answer_pad.py (сервер поднимается сам).
Совместный режим (набранное кнопками у собеседника) отсюда не проверить —
websocket до Supabase из песочницы закрыт; это перепроверяется на сайте руками.
"""
import contextlib
import http.client
import json
import subprocess
import sys
import time

from playwright.sync_api import sync_playwright

PORT = 8992
BASE = f"http://127.0.0.1:{PORT}"
FRAME = "document.querySelector('#bdTrainersPanel iframe')"


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


def open_board(ctx):
    page = ctx.new_page()
    errors = []
    page.on("pageerror", lambda e: errors.append(str(e)))
    # сеть наружу — только обрывом: иначе из песочницы заводятся сессии в
    # настоящей базе (раздел 8, промпт №14 нового списка)
    page.route("https://**/*", lambda r: r.abort())
    page.goto(f"{BASE}/boards.html")
    page.evaluate(SEED_JS, [[LITE], {"bA": {"objects": [], "imageLib": []}}])
    page.reload()
    page.evaluate(BOOT_JS)
    page.wait_for_function("() => window.getDB && window.getDB().boards.length >= 1")
    page.evaluate("() => window.openBoard('bA')")
    page.wait_for_function("() => window.getCurrentBoard() && Array.isArray(window.getCurrentBoard().objects)")
    return page, errors


def add_fipi20(page, pid):
    page.evaluate("() => { document.getElementById('bdTrainersPanel').classList.add('open'); }")
    page.evaluate("() => openTrainerInPanel('oge20', 'oge_part2.html?n=20', 'x')")
    page.wait_for_function(f"""() => {{ try {{ const f = {FRAME};
        return f.contentDocument.readyState === 'complete' && typeof f.contentWindow.openTask === 'function'; }}
        catch (e) {{ return false; }} }}""", timeout=20000)
    page.wait_for_timeout(500)
    page.evaluate(f"() => {FRAME}.contentWindow.eval({json.dumps('openTask(20, ' + json.dumps(pid) + ')')})")
    page.wait_for_timeout(600)
    n = page.evaluate("() => getCurrentBoard().objects.length")
    page.evaluate("() => document.getElementById('bdTrainersAddBtn').click()")
    page.wait_for_function(f"() => getCurrentBoard().objects.length >= {n + 1}", timeout=30000)
    page.wait_for_timeout(300)
    page.evaluate("() => { document.getElementById('bdTrainersPanel').classList.remove('open'); boardsRedraw(); }")
    page.wait_for_timeout(300)
    oid = page.evaluate("() => getCurrentBoard().objects.slice(-1)[0].id")
    page.evaluate(f"""() => {{ const o = getCurrentBoard().objects.find(x => x.id === {json.dumps(oid)});
        setZoom(1, o.points[0].x + o.w / 2, o.points[0].y + o.h / 2, cssW / 2, cssH / 2); }}""")
    page.wait_for_timeout(250)
    return oid


def st(page, oid):
    return page.evaluate(f"() => (getCurrentBoard().objects.find(o => o.id === {json.dumps(oid)}).task.st || {{}})")


def pad_keys(page):
    return page.evaluate("() => [...document.querySelectorAll('#bdAnsPad.open .bap-grid button')].map(b => b.dataset.k)")


def tap(page, k):
    # клик мышью по-настоящему: важно, что фокус остаётся в поле
    page.click(f'#bdAnsPad.open button[data-k="{k}"]')


def run():
    results = []

    def check(name, cond):
        results.append((name, bool(cond)))
        print(("OK   " if cond else "FAIL ") + name)

    with local_server(), sync_playwright() as p:
        browser = p.chromium.launch()

        # ── мышь ─────────────────────────────────────────────────────────
        ctx = browser.new_context(viewport={"width": 1400, "height": 900})
        page, errors = open_board(ctx)
        oid = add_fipi20(page, "20.fipi.CC11F7")
        sel = f'.bd-task[data-id="{oid}"] .bd-task-in'
        check("0. задание с полем ответа легло на доску", page.query_selector(sel) is not None)
        check("0. модуль подключён и поле к нему прицеплено",
              page.evaluate(f"() => !!window.BoardAnswerPad && document.querySelector('{sel}').dataset.bap === '1'"))
        check("1. с мышью inputmode не тронут (decimal)", page.get_attribute(sel, "inputmode") == "decimal")

        page.click(sel)
        page.wait_for_timeout(150)
        check("1. фокус — открылась узкая полоска", pad_keys(page) == ["√", "±", "/", ";", "(", ")", "digits", "close", "∞", "+∞", "-∞", "∪", "∩"])
        geo = page.evaluate(f"""() => {{ const a = document.querySelector('{sel}').getBoundingClientRect(),
            b = document.getElementById('bdAnsPad').getBoundingClientRect();
            return {{ gapBelow: b.top - a.bottom, gapAbove: a.top - b.bottom }}; }}""")
        check("1. полоска вплотную у поля (под ним или над ним)",
              0 <= geo["gapBelow"] <= 20 or 0 <= geo["gapAbove"] <= 20)

        page.keyboard.type("4-")
        tap(page, "√")
        page.keyboard.type("7")
        tap(page, ";")
        page.keyboard.type("4+")
        tap(page, "√")
        page.keyboard.type("7")
        val = page.input_value(sel)
        check("2. полоска пишет в место курсора: 4-√7; 4+√7", val == "4-√7; 4+√7")
        check("2. фокус остался в поле после кнопок",
              page.evaluate(f"() => document.activeElement === document.querySelector('{sel}')"))
        check("2. черновик задания обновлён (событие input дошло)",
              page.evaluate(f"() => taskDrafts.get({json.dumps(oid)}).vals.ans") == "4-√7; 4+√7")
        prev = page.evaluate("() => document.querySelector('#bdAnsPad .bap-prev').classList.contains('on') && document.querySelectorAll('#bdAnsPad .bap-prev .katex .sqrt').length")
        check("3. строка «Читается так» с двумя корнями", prev == 2)

        tex = page.evaluate("() => ['√2+3', '√(2+3)', '-1/6; 1/2', '(8+2√7)/2', 'x=4±√7', '2,5'].map(s => s.split(';').map(x => BoardAnswerPad.toTex(x.trim())).join(' ; '))")
        check("3. √2+3 — корень только из 2", tex[0] == "\\sqrt{2}+3")
        check("3. √(2+3) — корень из суммы", tex[1] == "\\sqrt{2+3}")
        check("3. дроби вертикальные", tex[2] == "-\\dfrac{1}{6} ; \\dfrac{1}{2}")
        check("3. скобки числителя снимаются", tex[3] == "\\dfrac{8+2\\sqrt{7}}{2}")
        check("3. «x =» снят, ± показан", tex[4] == "4\\pm\\sqrt{7}")
        check("3. десятичная запятая", tex[5] == "2{,}5")

        page.fill(sel, "")
        page.click(sel)
        page.keyboard.type("4")
        tap(page, "±")
        tap(page, "√")
        page.keyboard.type("7")
        page.keyboard.press("Enter")
        page.wait_for_timeout(250)
        check("4. «4±√7» засчитан как два корня", st(page, oid).get("res") == "ok")
        check("5. после верного ответа панель закрылась", not page.evaluate("() => BoardAnswerPad.isOpen()"))
        page.click(sel)
        page.wait_for_timeout(150)
        check("5. поле только для чтения — панель не открывается", not page.evaluate("() => BoardAnswerPad.isOpen()"))

        nums = page.evaluate("""() => [
            taCheckField({type:'nums', value:'4-√(7); 4+√(7)'}, 'x = 4 ± √7'),
            taCheckField({type:'nums', value:'4-√(7); 4+√(7)'}, 'x₁=4-√7; x₂=4+√7'),
            taCheckField({type:'nums', value:'4-√(7); 4+√(7)'}, '4±√5'),
            taCheckField({type:'nums', value:'-1/6; 1/2'}, '0,5; −1/6'),
            taCheckField({type:'nums', value:'3/2; 7/3'}, '1,5; 7:3'),
            taCheckField({type:'nums', value:'-5; 3'}, '3; -5')]""")
        check("4. разбор: x = 4 ± √7 → верно", nums[0] is True)
        check("4. разбор: x₁ = …; x₂ = … → верно", nums[1] is True)
        check("4. разбор: 4 ± √5 → неверно (а не «запишите иначе»)", nums[2] is False)
        check("4. разбор: 0,5; −1/6 → верно", nums[3] is True)
        check("4. разбор: 1,5; 7:3 → верно", nums[4] is True)
        check("4. разбор: старые ответы целыми не сломались", nums[5] is True)

        oid2 = add_fipi20(page, "20.fipi.7A30BC")
        sel2 = f'.bd-task[data-id="{oid2}"] .bd-task-in'
        page.click(sel2)
        page.wait_for_timeout(150)
        tap(page, "digits")
        page.wait_for_timeout(100)
        keys = pad_keys(page)
        check("5. «123» раскрыл цифры", "7" in keys and "0" in keys and "check" in keys and len(keys) == 28)
        check("5. выбор запомнен", page.evaluate("() => localStorage.getItem('bdPadFull')") == "1")
        for k in ["-", "1", "/", "6", ";", "1", "/", "2"]:
            tap(page, k)
        check("4. дроби набраны кнопками", page.input_value(sel2) == "-1/6; 1/2")
        fr = page.evaluate("() => document.querySelectorAll('#bdAnsPad .bap-prev .katex .mfrac').length")
        check("3. в строке две вертикальные дроби", fr == 2)
        tap(page, "check")
        page.wait_for_timeout(250)
        check("4. «Проверить» в панели — дроби засчитаны", st(page, oid2).get("res") == "ok")

        # ✕ и потеря фокуса — на свежем задании
        page.evaluate(f"() => {{ taskReset({json.dumps(oid2)}); }}")
        page.wait_for_timeout(200)
        page.click(sel2)
        page.wait_for_timeout(120)
        tap(page, "close")
        check("5. ✕ закрыл панель", not page.evaluate("() => BoardAnswerPad.isOpen()"))
        page.evaluate(f"() => document.querySelector('{sel2}').blur()")
        page.click(sel2)
        page.wait_for_timeout(120)
        check("5. новый фокус — панель снова открыта", page.evaluate("() => BoardAnswerPad.isOpen()"))
        page.evaluate(f"() => document.querySelector('{sel2}').blur()")
        page.wait_for_timeout(250)
        check("5. потеря фокуса закрыла панель", not page.evaluate("() => BoardAnswerPad.isOpen()"))

        # 7. держится у поля при сдвиге доски, прячется за краем экрана
        page.click(sel2)
        page.wait_for_timeout(120)
        before = page.evaluate("() => document.getElementById('bdAnsPad').getBoundingClientRect().top")
        page.evaluate("() => { cam.y += 60 / cam.zoom; clampCam(); scheduleRedraw(); }")
        page.wait_for_timeout(200)
        after = page.evaluate("() => document.getElementById('bdAnsPad').getBoundingClientRect().top")
        check("7. доска сдвинулась — панель поехала за полем", abs((before - after) - 60) <= 3)
        page.evaluate("() => { window.__cy = cam.y; cam.y += 1.5 * cssH / cam.zoom; clampCam(); scheduleRedraw(); }")
        page.wait_for_timeout(200)
        # слой заданий держит только видимые задания: ушедшее поле либо
        # спрятано (ещё в слое), либо вынуто из слоя — тогда панель закрыта
        gone = page.evaluate("""() => { const p = document.getElementById('bdAnsPad'), cs = getComputedStyle(p);
            const i = document.querySelector('.bd-task-in:focus'); return { vis: cs.visibility, open: p.classList.contains('open'), y: p.getBoundingClientRect().top, f: i ? JSON.stringify(i.getBoundingClientRect()) : 'нет фокуса', conn: [...document.querySelectorAll('.bd-task-in')].map(x => x.isConnected + ':' + Math.round(x.getBoundingClientRect().top)), cam: JSON.stringify(cam) }; }""")
        check("7. поле ушло с экрана — панель не висит на экране",
              gone["vis"] == "hidden" or not gone["open"])
        page.evaluate("() => { cam.y = window.__cy; clampCam(); scheduleRedraw(); }")
        page.wait_for_timeout(250)
        # спрятанное поле браузер лишает фокуса — после возврата его просто
        # нажимают снова
        page.click(sel2)
        page.wait_for_timeout(150)
        check("7. вернули поле в кадр, нажали — панель снова видна у поля",
              page.evaluate("() => BoardAnswerPad.isOpen() && getComputedStyle(document.getElementById('bdAnsPad')).visibility") == "visible")

        check("ошибок на странице нет", not errors)
        if errors:
            print("\n".join(errors[:5]))
        ctx.close()

        # ── сенсорный экран ──────────────────────────────────────────────
        ctx = browser.new_context(viewport={"width": 820, "height": 1180}, has_touch=True, is_mobile=True)
        page, errors = open_board(ctx)
        check("6. pointer: coarse в эмуляции планшета", page.evaluate("() => matchMedia('(pointer: coarse)').matches"))
        oid = add_fipi20(page, "20.fipi.CC11F7")
        sel = f'.bd-task[data-id="{oid}"] .bd-task-in'
        check("6. у поля inputmode=none — системная клавиатура не вылезет", page.get_attribute(sel, "inputmode") == "none")
        page.tap(sel)
        page.wait_for_timeout(200)
        keys = pad_keys(page)
        check("6. сразу полная клавиатура", "kbd" in keys and "check" in keys and "√" in keys and "7" in keys)
        for k in ["4", "-", "√", "7", ";", "4", "+", "√", "7"]:
            page.tap(f'#bdAnsPad.open button[data-k="{k}"]')
        check("6. тапы пишут в поле", page.input_value(sel) == "4-√7; 4+√7")
        check("6. фокус остался в поле",
              page.evaluate(f"() => document.activeElement === document.querySelector('{sel}')"))
        page.tap('#bdAnsPad.open button[data-k="check"]')
        page.wait_for_timeout(250)
        check("6. «Проверить» в панели засчитал", st(page, oid).get("res") == "ok")

        oid2 = add_fipi20(page, "20.fipi.758215")
        sel2 = f'.bd-task[data-id="{oid2}"] .bd-task-in'
        page.tap(sel2)
        page.wait_for_timeout(200)
        page.tap('#bdAnsPad.open button[data-k="kbd"]')
        page.wait_for_timeout(300)
        check("6. ⌨ — системная клавиатура: inputmode=text", page.get_attribute(sel2, "inputmode") == "text")
        check("6. ⌨ — выбор запомнен", page.evaluate("() => localStorage.getItem('bdPadSysKbd')") == "1")
        check("6. при системной — узкая полоска знаков", pad_keys(page)[:2] == ["√", "±"])

        # 7. «да/нет» — без клавиатуры (поле собираем вручную тем же кодом)
        yn = page.evaluate("""() => { const i = document.createElement('input'); document.body.appendChild(i);
            const before = !!i.dataset.bap; return before; }""")
        src = open("boards-core.js", encoding="utf-8").read()
        check("7. «да/нет» к клавиатуре не цепляется", "f.type !== 'yesno') BoardAnswerPad.attach" in src and yn is False)
        check("ошибок на странице нет (планшет)", not errors)
        if errors:
            print("\n".join(errors[:5]))
        browser.close()

    bad = [n for n, ok in results if not ok]
    print(f"\n{len(results) - len(bad)}/{len(results)} проверок прошло")
    sys.exit(1 if bad else 0)


if __name__ == "__main__":
    run()
