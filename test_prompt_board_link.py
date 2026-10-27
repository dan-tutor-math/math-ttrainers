"""
Сопряжение панели тренажёров с доской, этап 1 (board-link.js,
boards-panel.html, trainer-capture.js). Транспорт — BroadcastChannel, поэтому
доска и панель — страницы одного контекста браузера.

Проверяет:
  1. Панель без ключа открывается экраном подключения; код доски — 6 знаков
     из алфавита без путаемых символов, показан с разделителем, QR-код и
     ссылка на панель с кодом после «#».
  2. Ввод кода → на доске окошко «Подключить «имя»?»; до «Разрешить» ничего
     не принято. «Отклонить» → панель пишет об отказе, устройств 0. Второй
     запрос, пока висит первый, получает «занято».
  3. «Разрешить» → устройство в списке, панель «Подключено к доске».
  4. «Добавить на доску» с панели: на доске объект с теми же полями, что у
     вставки из встроенной панели (того же тренажёра), и тем же масштабом
     стопки; сохраняется в базу (виден после перезагрузки доски).
  5. Очередь: пока на доске открыто окно, задание ждёт («ещё 1 в очереди» на
     доске, «В очереди на доске» на панели), закрыли окно — легло.
  6. Индикатор: доску закрыли — «Доска не в сети»; задание не теряется
     («Ждут отправки»), доску открыли — задание легло, окошка подключения не
     было (повторное подключение молча). Перезагрузка панели — сразу
     подключена.
  7. Смена кода: старым кодом новое устройство не подключить (окошка нет),
     новым — можно; уже подключённое продолжает работать.
  8. «Отключить»: устройство пропало из списка, панель — «Доска отключила
     это устройство» и экран подключения; второе устройство в сети.
  9. «Открыть в новой вкладке» этого браузера — панель подключена без кода.
 10. Нет ошибок JavaScript.

Запуск: ~/.venvs/trainers/bin/python test_prompt_board_link.py
Живой realtime (телефон через Supabase) здесь не проверить — это этап 3 и
ручная проверка на сайте.
"""
import contextlib
import http.client
import json
import re
import subprocess
import sys
import time

from playwright.sync_api import sync_playwright

PORT = 9211
BASE = f"http://127.0.0.1:{PORT}"
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
ERRORS = []
# тип задания ОГЭ №6 — как в test_prompt15: без него на странице экран выбора
PICK = "document.querySelectorAll('.mode-card:not(.soon):not(.demo)')[1].click()"


def watch(page, tag):
    page.on("pageerror", lambda e: ERRORS.append(f"{tag}: {e}"))


def boot_board(page, seed):
    page.goto(f"{BASE}/boards.html")
    if seed:
        page.evaluate(SEED_JS, [[LITE], {"bA": {"objects": [], "imageLib": []}}])
        page.reload()
    page.evaluate(BOOT_JS)
    page.wait_for_function("() => window.getDB && window.getDB().boards.length >= 1")
    page.evaluate("() => window.openBoard('bA')")
    page.wait_for_function("() => window.getCurrentBoard() && Array.isArray(window.getCurrentBoard().objects)")
    page.wait_for_function("() => boardLink && boardLink.active", timeout=5000)


def objs(board):
    return board.evaluate("() => window.getCurrentBoard().objects.filter(o => o.type === 'image').length")


def open_panel(ctx, frag=""):
    p = ctx.new_page()
    watch(p, "панель")
    p.goto(f"{BASE}/boards-panel.html{frag}")
    p.wait_for_function("() => window.__boardPanel")
    return p


def panel_open_trainer(panel, tid, href):
    panel.evaluate(f"() => __boardPanel.openTrainer({json.dumps(tid)}, {json.dumps(href)}, {json.dumps(tid)})")
    panel.wait_for_function("""() => { try { const f = document.getElementById('bpIframe');
        return f.contentDocument.readyState === 'complete' && typeof f.contentWindow.tsGetState === 'function'; }
        catch (e) { return false; } }""", timeout=20000)
    panel.evaluate(f"() => document.getElementById('bpIframe').contentWindow.eval({json.dumps(PICK)})")
    panel.wait_for_timeout(800)


def status(panel):
    return panel.inner_text("#bpStatusText")


def wait_status(panel, text, timeout=12000):
    try:
        panel.wait_for_function(f"() => document.getElementById('bpStatusText').textContent.includes({json.dumps(text)})", timeout=timeout)
        return True
    except Exception:
        return False


def start_pair(panel, code, name):
    panel.fill("#bpName", name)
    panel.fill("#bpCode", code)
    panel.click("#bpPairBtn")


def run():
    with sync_playwright() as pw:
        browser = pw.chromium.launch()
        ctx = browser.new_context(viewport={"width": 1400, "height": 900})
        # всё наружу обрывается: кадр тренажёра иначе заводит сессию в
        # настоящей базе (раздел 8 HANDOFF)
        ctx.route("https://**/*", lambda r: r.abort())
        board = ctx.new_page()
        watch(board, "доска")
        boot_board(board, seed=True)

        # 1. экран подключения, код, QR
        panel = open_panel(ctx)
        check("1. панель без ключа — экран подключения", panel.evaluate("() => document.body.classList.contains('bp-pairing')"))
        code = board.evaluate("() => boardLink.code")
        check("1. код — 6 знаков без путаемых символов", bool(re.fullmatch(r"[ABCDEFGHJKMNPQRSTUVWXYZ2-9]{6}", code)), code)
        board.evaluate("() => setTrainersPanel('open')")
        board.click("#bdTrainersLinkBtn")
        shown = board.inner_text("#linkCode")
        check("1. код на доске с разделителем", shown == code[:3] + "-" + code[3:], shown)
        qr = board.evaluate("() => document.querySelector('#linkQr svg') ? document.querySelector('#linkQr svg path').getAttribute('d').length : 0")
        check("1. QR-код нарисован", qr > 100, str(qr))
        url = board.evaluate("() => boardLinkPanelUrl(boardLink.code)")
        check("1. ссылка QR — boards-panel.html#pair=КОД", url.endswith("boards-panel.html#pair=" + code), url)
        board.click("#linkModalClose")

        # 2. запрос → окошко; отказ; «занято» для второго запроса
        start_pair(panel, code[:3].lower() + "-" + code[3:].lower(), "Тестовый телефон")
        board.wait_for_selector("#linkAsk.show", timeout=5000)
        check("2. на доске окошко с именем устройства", board.inner_text("#linkAskText") == "Подключить «Тестовый телефон»?", board.inner_text("#linkAskText"))
        check("2. до «Разрешить» устройств нет", board.evaluate("() => boardLink.devices().length") == 0)
        panel2 = open_panel(ctx)
        r2 = panel2.evaluate(f"() => __boardPanel.client.pair({json.dumps(code)}, 'Чужой')")
        check("2. второй запрос, пока висит первый, — «занято»", r2 == "busy", r2)
        panel2.close()
        board.click("#linkAskDeny")
        panel.wait_for_function("() => document.getElementById('bpPairMsg').textContent.includes('отказали')", timeout=5000)
        check("2. «Отклонить» — панель пишет об отказе", True)
        check("2. после отказа устройств 0", board.evaluate("() => boardLink.devices().length") == 0)

        # 3. разрешение (не раньше, чем через PROMPT_GAP_MS после прошлого окошка)
        board.wait_for_timeout(4200)
        start_pair(panel, code, "Тестовый телефон")
        board.wait_for_selector("#linkAsk.show", timeout=5000)
        board.click("#linkAskAllow")
        check("3. панель подключена", wait_status(panel, "Подключено к доске"), status(panel))
        check("3. имя доски в индикаторе", "«Урок»" in status(panel), status(panel))
        devs = board.evaluate("() => boardLink.devices()")
        check("3. устройство в списке доски", len(devs) == 1 and devs[0]["name"] == "Тестовый телефон", str(devs))
        check("3. панель вышла с экрана подключения", not panel.evaluate("() => document.body.classList.contains('bp-pairing')"))
        dev_a = devs[0]["id"]

        # 4. задание с панели — те же поля, что из встроенной панели
        oge6 = "oge6.html"
        board.evaluate(f"() => openTrainerInPanel('oge6', {json.dumps(oge6)}, 'oge6')")
        board.wait_for_function("""() => { try { const f = document.getElementById('bdTrainersIframe');
            return f.contentDocument.readyState === 'complete' && typeof f.contentWindow.tsGetState === 'function'; }
            catch (e) { return false; } }""", timeout=20000)
        board.evaluate(f"() => document.getElementById('bdTrainersIframe').contentWindow.eval({json.dumps(PICK)})")
        board.wait_for_timeout(800)
        board.click("#bdTrainersAddBtn")
        board.wait_for_function("() => window.getCurrentBoard().objects.filter(o => o.type === 'image').length === 1", timeout=20000)
        board.wait_for_timeout(300)
        panel_open_trainer(panel, "oge6", oge6)
        n0 = objs(board)
        panel.click("#bpAddBtn")
        board.wait_for_function(f"() => window.getCurrentBoard().objects.filter(o => o.type === 'image').length === {n0 + 1}", timeout=20000)
        a, b = board.evaluate("""() => { const im = window.getCurrentBoard().objects.filter(o => o.type === 'image');
            return [im[0], im[1]]; }""")
        check("4. поля объекта те же, что у встроенной панели", sorted(a.keys()) == sorted(b.keys()), f"{sorted(a.keys())} / {sorted(b.keys())}")
        for k in ("task", "gen", "css", "card", "stack", "gap", "locked", "addedAt"):
            check(f"4. есть поле {k}", k in b, str(sorted(b.keys())))
        check("4. картинка PNG", b["src"].startswith("data:image/png"), b["src"][:30])
        check("4. та же стопка", a["stack"]["id"] == b["stack"]["id"], f"{a['stack']} / {b['stack']}")
        ka, kb = a["w"] / a["css"]["w"], b["w"] / b["css"]["w"]
        check("4. тот же масштаб стопки", abs(ka - kb) < 1e-6, f"{ka} / {kb}")
        # панель здесь во всю ширину окна — снимок таким, как виден в её кадре
        pvw = panel.evaluate("() => document.getElementById('bpIframe').contentWindow.innerWidth")
        check("4. снимок в кадре той ширины, что на экране панели", b["gen"].get("vw") == pvw, f"{b['gen'].get('vw')} / {pvw}")
        check("4. gen.node и ответ задания", b["gen"].get("node") == a["gen"].get("node") and b["task"].get("kind") == a["task"].get("kind"), f"{b['gen'].get('node')} {b['task'].get('kind')}")
        panel.wait_for_function("() => document.getElementById('bpToast').textContent.includes('Добавлено на доску')", timeout=8000)
        check("4. панель — «Добавлено на доску»", True)

        # 5. очередь, пока открыто окно
        board.click("#bdTrainersLinkBtn")
        n1 = objs(board)
        panel.evaluate("() => document.getElementById('bpRefreshBtn').click()")
        panel.wait_for_timeout(400)
        panel.click("#bpAddBtn")
        board.wait_for_selector("#linkQueue.show", timeout=15000)
        check("5. на доске «ещё 1 в очереди»", "ещё 1 в очереди" in board.inner_text("#linkQueue"), board.inner_text("#linkQueue"))
        check("5. пока окно открыто — не вставлено", objs(board) == n1)
        panel.wait_for_function("() => document.getElementById('bpPending').textContent.includes('В очереди на доске: 1')", timeout=8000)
        check("5. панель — «В очереди на доске: 1»", True)
        board.click("#linkModalClose")
        board.wait_for_function(f"() => window.getCurrentBoard().objects.filter(o => o.type === 'image').length === {n1 + 1}", timeout=8000)
        check("5. окно закрыли — задание легло", True)
        check("5. очередь пуста", not board.evaluate("() => document.getElementById('linkQueue').classList.contains('show')"))

        # сохранено в базу: после перезагрузки доски задания на месте
        board.wait_for_timeout(800)
        n2 = objs(board)
        board.close()

        # 6. доска не в сети — задание ждёт; доска вернулась — легло без окошка
        check("6. доска закрыта — «Доска не в сети»", wait_status(panel, "не в сети", 12000), status(panel))
        panel.evaluate("() => document.getElementById('bpRefreshBtn').click()")
        panel.wait_for_timeout(400)
        panel.click("#bpAddBtn")
        panel.wait_for_function("() => document.getElementById('bpPending').textContent.includes('Ждут отправки: 1')", timeout=15000)
        check("6. панель — «Ждут отправки: 1»", True)
        board = ctx.new_page()
        watch(board, "доска")
        boot_board(board, seed=False)
        check("6. после перезагрузки доски задания на месте", objs(board) >= n2, f"{objs(board)} / {n2}")
        board.wait_for_function(f"() => window.getCurrentBoard().objects.filter(o => o.type === 'image').length === {n2 + 1}", timeout=15000)
        check("6. доска вернулась — отложенное задание легло", True)
        check("6. окошка подключения не было", not board.evaluate("() => document.getElementById('linkAsk').classList.contains('show')"))
        check("6. снова «Подключено»", wait_status(panel, "Подключено к доске"), status(panel))
        panel.wait_for_timeout(500)
        check("6. счётчик ожидающих пуст", not panel.evaluate("() => document.getElementById('bpPending').classList.contains('show')"), panel.inner_text("#bpPending"))
        panel.reload()
        panel.wait_for_function("() => window.__boardPanel")
        check("6. перезагрузка панели — без экрана подключения", not panel.evaluate("() => document.body.classList.contains('bp-pairing')"))
        check("6. перезагрузка панели — сразу подключена", wait_status(panel, "Подключено к доске"), status(panel))

        # 7. смена кода
        board.evaluate("() => setTrainersPanel('open')")
        board.click("#bdTrainersLinkBtn")
        board.click("#linkChangeCode")
        code2 = board.evaluate("() => boardLink.code")
        check("7. код сменился", code2 != code and board.inner_text("#linkCode") == code2[:3] + "-" + code2[3:], f"{code} → {code2}")
        board.click("#linkModalClose")
        panel_b = open_panel(ctx)
        # у нового устройства своего ключа нет — убираем ключ панели A из
        # общего localStorage (сама A держит его в памяти и остаётся в сети)
        panel_b.evaluate("() => { localStorage.removeItem('bdPanel:link'); }")
        panel_b.reload()
        panel_b.wait_for_function("() => window.__boardPanel")
        board.wait_for_timeout(4200)
        panel_b.evaluate(f"() => {{ window.__oldPair = __boardPanel.client.pair({json.dumps(code)}, 'Планшет'); }}")
        board.wait_for_timeout(2500)
        check("7. старым кодом — окошка нет", not board.evaluate("() => document.getElementById('linkAsk').classList.contains('show')"))
        start_pair(panel_b, code2, "Планшет")
        board.wait_for_selector("#linkAsk.show", timeout=5000)
        check("7. новым кодом — окошко", "«Планшет»" in board.inner_text("#linkAskText"), board.inner_text("#linkAskText"))
        board.click("#linkAskAllow")
        check("7. второе устройство подключено", wait_status(panel_b, "Подключено к доске"), status(panel_b))
        check("7. на доске два устройства", board.evaluate("() => boardLink.devices().length") == 2)
        check("7. первое устройство осталось в сети", wait_status(panel, "Подключено к доске", 6000), status(panel))
        n3 = objs(board)
        panel_open_trainer(panel, "oge6", oge6)   # после перезагрузки панели — снова список
        panel.click("#bpAddBtn")
        board.wait_for_function(f"() => window.getCurrentBoard().objects.filter(o => o.type === 'image').length === {n3 + 1}", timeout=15000)
        check("7. первое устройство после смены кода добавляет задания", True)

        # 8. отключение и переименование
        board.click("#bdTrainersLinkBtn")
        board.fill(f".bd-link-dev[data-id='{dev_a}'] input", "Телефон Ани")
        board.press(f".bd-link-dev[data-id='{dev_a}'] input", "Enter")
        board.evaluate(f"() => document.querySelector(\".bd-link-dev[data-id='{dev_a}'] input\").blur()")
        board.wait_for_timeout(200)
        names = board.evaluate("() => boardLink.devices().map(d => d.name)")
        check("8. переименование устройства", "Телефон Ани" in names, str(names))
        board.click(f".bd-link-dev[data-id='{dev_a}'] .bd-link-btn")
        check("8. устройство пропало из списка", board.evaluate(f"() => !boardLink.devices().some(d => d.id === {json.dumps(dev_a)})"))
        check("8. панель — «Доска отключила это устройство»", wait_status(panel, "Доска отключила", 8000), status(panel))
        check("8. панель — экран подключения", panel.evaluate("() => document.body.classList.contains('bp-pairing')"))
        check("8. второе устройство в сети", wait_status(panel_b, "Подключено к доске", 6000), status(panel_b))
        board.click("#linkModalClose")

        # 9. своя вкладка этого браузера — без кода
        board.evaluate("() => boardLink.linkLocalPanel()")
        panel_c = open_panel(ctx)
        check("9. вкладка этого браузера — без экрана подключения", not panel_c.evaluate("() => document.body.classList.contains('bp-pairing')"))
        check("9. вкладка этого браузера — подключена", wait_status(panel_c, "Подключено к доске"), status(panel_c))
        check("9. в списке «Вкладка этого браузера»", "Вкладка этого браузера" in board.evaluate("() => boardLink.devices().map(d => d.name)"))

        check("10. нет ошибок JavaScript", not ERRORS, "\n".join(ERRORS[:5]))
        browser.close()


with local_server():
    run()
print("\nИТОГ: " + ("всё прошло" if not FAILS else f"упало {len(FAILS)}: " + "; ".join(FAILS)))
sys.exit(1 if FAILS else 0)
