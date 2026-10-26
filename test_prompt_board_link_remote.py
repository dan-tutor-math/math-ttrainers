"""
Сопряжение панели тренажёров с доской, этап 3: тот же протокол поверх
Supabase Realtime (board-link.js — sbTransport, shrinkPayload, Storage).

Из песочницы Supabase недоступен, поэтому вместо него — заглушка клиента
(window.__bdLinkSupabase): канал и хранилище идут через маленький
ретранслятор на Python. Он, как Realtime на плане Free, НЕ пропускает
сообщение больше 256 КБ. Доска и «телефон» — РАЗНЫЕ контексты браузера:
BroadcastChannel между ними не работает, всё идёт «через сервер».
Живой Supabase (websocket, права бакета, лимиты) проверяется руками на сайте.

Проверяет:
  1. Подключение по коду с «телефона» (QR-ссылка #pair=): окошко на доске,
     «Разрешить», индикатор «Подключено». Канал кода через сервер открыт,
     пока на доске открыто окно с кодом.
  2. Задание с телефона ложится на доску тем же объектом; трафик шёл через
     ретранслятор; ни одно сообщение не превысило лимит.
  3. Крупное задание: среднее уходит в WebP (без Storage), огромное — файлом
     в Storage; файл зашифрован (внутри нет data:image), доска его прочла и
     вставила, после ответа доски файл удалён.
  4. «Добавить вручную» с телефона: отмена → «Отменено на доске»,
     закрепление → «Закреплено на доске».
  5. Доска закрыта → «Доска не в сети», задание ждёт; доска открыта —
     задание легло, окошка подключения не было.
  6. «Отключить» на доске — телефон узнаёт об этом через сервер.
  7. Размеры PNG и WebP на реальных заданиях: ОГЭ №8, ЕГЭ №9 (график),
     ОГЭ №15–18 (геометрия) — печатаются числами.
  8. Нет ошибок JavaScript.

Запуск: ~/.venvs/trainers/bin/python test_prompt_board_link_remote.py
"""
import contextlib
import http.client
import json
import re
import subprocess
import sys
import threading
import urllib.parse
import time
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

from playwright.sync_api import sync_playwright

PORT = 9216
RELAY = 9217
BASE = f"http://127.0.0.1:{PORT}"
LIMIT = 256 * 1024
FAILS = []
ERRORS = []
PICK = "document.querySelectorAll('.mode-card:not(.soon):not(.demo)')[1].click()"


def check(name, ok, info=""):
    print(("[OK] " if ok else "[FAIL] ") + name + ("" if ok else f" — {info}"))
    if not ok:
        FAILS.append(name)


# ── ретранслятор: широковещательный канал + хранилище ──
R = {"n": 0, "msgs": [], "blobs": {}, "puts": 0, "deletes": 0, "rejected": 0, "max": 0, "topics": {}}
RL = threading.Lock()


class Relay(BaseHTTPRequestHandler):
    def log_message(self, *a):
        pass

    def _send(self, code, body=b"", ctype="application/json"):
        self.send_response(code)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "*")
        self.send_header("Content-Type", ctype)
        self.end_headers()
        self.wfile.write(body)

    def do_OPTIONS(self):
        self._send(204)

    def _body(self):
        n = int(self.headers.get("Content-Length") or 0)
        return self.rfile.read(n) if n else b""

    def do_GET(self):
        if self.path == "/now":
            with RL:
                return self._send(200, json.dumps({"n": R["n"]}).encode())
        if self.path.startswith("/poll?"):
            q = dict(x.split("=", 1) for x in self.path.split("?", 1)[1].split("&"))
            topic = urllib.parse.unquote(q["topic"])
            since, me = int(q["since"]), q["me"]
            with RL:
                out = [m["payload"] for m in R["msgs"] if m["n"] > since and m["topic"] == topic and m["from"] != me]
                return self._send(200, json.dumps({"n": R["n"], "msgs": out}).encode())
        if self.path.startswith("/blob/"):
            key = self.path[len("/blob/"):]
            with RL:
                b = R["blobs"].get(key)
            return self._send(200, b, "application/octet-stream") if b is not None else self._send(404, b"{}")
        if self.path.startswith("/list/"):
            pre = self.path[len("/list/"):] + "/"
            with RL:
                items = [{"name": k[len(pre):], "created_at": "2000-01-01T00:00:00Z"} for k in R["blobs"] if k.startswith(pre)]
            return self._send(200, json.dumps(items).encode())
        self._send(404, b"{}")

    def do_POST(self):
        if self.path == "/send":
            raw = self._body()
            with RL:
                R["max"] = max(R["max"], len(raw))
                if len(raw) > LIMIT:
                    R["rejected"] += 1
                    return self._send(413, b"{}")
                m = json.loads(raw)
                R["n"] += 1
                R["msgs"].append({"n": R["n"], "topic": m["topic"], "from": m["from"], "payload": m["payload"]})
                R["topics"][m["topic"]] = R["topics"].get(m["topic"], 0) + 1
            return self._send(200, b"{}")
        self._send(404, b"{}")

    def do_PUT(self):
        key = self.path[len("/blob/"):]
        body = self._body()
        with RL:
            R["blobs"][key] = body
            R["puts"] += 1
        self._send(200, b"{}")

    def do_DELETE(self):
        key = self.path[len("/blob/"):]
        with RL:
            if R["blobs"].pop(key, None) is not None:
                R["deletes"] += 1
        self._send(200, b"{}")


FAKE_SB = """(() => {
  const R = 'http://127.0.0.1:%d';
  window.__bdLinkSupabase = () => ({
    channel(topic){
      const subs = []; let since = 0, timer = null, closed = false;
      const me = Math.random().toString(36).slice(2);
      async function poll(){
        if (closed) return;
        try {
          const j = await (await fetch(R + '/poll?topic=' + encodeURIComponent(topic) + '&since=' + since + '&me=' + me)).json();
          since = j.n; j.msgs.forEach(p => subs.forEach(cb => cb({ payload: p })));
        } catch (e) {}
        timer = setTimeout(poll, 120);
      }
      const ch = {
        on(type, filter, cb){ subs.push(cb); return ch; },
        subscribe(cb){ fetch(R + '/now').then(r => r.json()).then(j => { since = j.n; cb('SUBSCRIBED'); poll(); }); return ch; },
        send(msg){ return fetch(R + '/send', { method: 'POST', body: JSON.stringify({ topic, from: me, payload: msg.payload }) }); },
        _close(){ closed = true; clearTimeout(timer); },
      };
      return ch;
    },
    removeChannel(ch){ ch._close(); },
    storage: { from(b){ return {
      upload: async (path, blob) => { const r = await fetch(R + '/blob/' + b + '/' + path, { method: 'PUT', body: blob }); return r.ok ? { data: { path }, error: null } : { data: null, error: { message: 'upload' } }; },
      download: async (path) => { const r = await fetch(R + '/blob/' + b + '/' + path); return r.ok ? { data: await r.blob(), error: null } : { data: null, error: { message: '404' } }; },
      remove: async (paths) => { for (const p of paths) await fetch(R + '/blob/' + b + '/' + p, { method: 'DELETE' }); return { data: null, error: null }; },
      list: async (dir) => ({ data: await (await fetch(R + '/list/' + b + '/' + dir)).json(), error: null }),
    }; } },
  });
})();""" % RELAY


@contextlib.contextmanager
def servers():
    relay = ThreadingHTTPServer(("127.0.0.1", RELAY), Relay)
    threading.Thread(target=relay.serve_forever, daemon=True).start()
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
        yield
    finally:
        proc.terminate()
        proc.wait(timeout=5)
        relay.shutdown()


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
IMAGES = "window.getCurrentBoard().objects.filter(o => o.type === 'image')"
# картинка-«шум»: в WebP почти не сжимается — проверка пути через Storage;
# плавный градиент: PNG крупный, WebP маленький — путь «только WebP»
BIG_JS = """(kind) => { const c = document.createElement('canvas'); c.width = 900; c.height = 700;
  const x = c.getContext('2d');
  if (kind === 'noise'){ const d = x.createImageData(900, 700); for (let i = 0; i < d.data.length; i++) d.data[i] = (Math.random() * 256) | 0; x.putImageData(d, 0, 0); }
  else { const d = x.createImageData(900, 700);
         for (let y = 0; y < 700; y++) for (let X = 0; X < 900; X++){ const i = (y * 900 + X) * 4, n = (Math.random() * 8) | 0;
           d.data[i] = (X / 4 + n) | 0; d.data[i + 1] = (y / 3 + n) | 0; d.data[i + 2] = 160 + n; d.data[i + 3] = 255; }
         x.putImageData(d, 0, 0); }
  return c.toDataURL('image/png'); }"""


def watch(page, tag):
    page.on("pageerror", lambda e: ERRORS.append(f"{tag}: {e}"))


def count(board):
    return board.evaluate(f"() => {IMAGES}.length")


def wait_count(board, n, timeout=25000):
    board.wait_for_function(f"() => {IMAGES}.length === {n}", timeout=timeout)


def new_board(ctx, seed):
    b = ctx.new_page()
    watch(b, "доска")
    b.goto(f"{BASE}/boards.html")
    if seed:
        b.evaluate(SEED_JS, [[LITE], {"bA": {"objects": [], "imageLib": []}}])
        b.reload()
    b.evaluate(BOOT_JS)
    b.wait_for_function("() => window.getDB && window.getDB().boards.length >= 1")
    b.evaluate("() => window.openBoard('bA')")
    b.wait_for_function("() => window.getCurrentBoard() && Array.isArray(window.getCurrentBoard().objects)")
    b.wait_for_function("() => boardLink && boardLink.active", timeout=8000)
    return b


def wait_text(page, sel, text, timeout=15000):
    try:
        page.wait_for_function(f"() => (document.querySelector({json.dumps(sel)}) || {{}}).textContent.includes({json.dumps(text)})", timeout=timeout)
        return True
    except Exception:
        return False


def open_trainer(panel, tid, href, pick=True):
    panel.evaluate(f"() => __boardPanel.openTrainer({json.dumps(tid)}, {json.dumps(href)}, {json.dumps(tid)})")
    panel.wait_for_function("""() => { try { const f = document.getElementById('bpIframe');
        return f.contentDocument.readyState === 'complete' && typeof f.contentWindow.tsGetState === 'function'; }
        catch (e) { return false; } }""", timeout=25000)
    panel.wait_for_timeout(700)
    has = panel.evaluate(f"() => collectTrainerCaptureNodes(document.getElementById('bpIframe').contentDocument, {json.dumps(tid)}).filter(n => n.el.id !== 'theoryContent').length")
    if not has and pick:
        panel.evaluate(f"() => document.getElementById('bpIframe').contentWindow.eval({json.dumps(PICK)})")
        panel.wait_for_timeout(1200)


def run():
    with sync_playwright() as pw:
        browser = pw.chromium.launch()
        ctx_b = browser.new_context(viewport={"width": 1400, "height": 900})
        ctx_p = browser.new_context(viewport={"width": 390, "height": 820}, is_mobile=True, has_touch=True, device_scale_factor=3)  # как у iPhone: снимок втрое плотнее
        for c in (ctx_b, ctx_p):
            c.route("https://**/*", lambda r: r.abort())
            c.add_init_script(FAKE_SB)
        board = new_board(ctx_b, seed=True)

        # 1. подключение по коду через сервер
        board.evaluate("() => setTrainersPanel('open')")
        board.click("#bdTrainersLinkBtn")
        check("1. окно с кодом открыто — канал кода и через сервер", board.evaluate("() => boardLink.pairRemote"))
        url = board.evaluate("() => boardLinkPanelUrl(boardLink.code)")
        code = board.evaluate("() => boardLink.code")
        frag = url[url.index("#"):]
        phone = ctx_p.new_page()
        watch(phone, "телефон")
        phone.goto(f"{BASE}/boards-panel.html{frag}")
        phone.wait_for_function("() => window.__boardPanel")
        check("1. QR-ссылка подставила код", phone.input_value("#bpCode") == code[:3] + "-" + code[3:], phone.input_value("#bpCode"))
        check("1. из адреса код убран", "pair=" not in phone.url, phone.url)
        phone.fill("#bpName", "Телефон Дани")
        phone.click("#bpPairBtn")
        board.wait_for_selector("#linkAsk.show", timeout=15000)
        check("1. на доске окошко с именем телефона", "«Телефон Дани»" in board.inner_text("#linkAskText"))
        board.click("#linkAskAllow")
        check("1. телефон подключён", wait_text(phone, "#bpStatusText", "Подключено к доске"), phone.inner_text("#bpStatusText"))
        check("1. рукопожатие шло через сервер", R["topics"].get("bdlink:p-" + code, 0) >= 2, str(R["topics"]))
        board.click("#linkModalClose")
        dev = board.evaluate("() => boardLink.devices()[0]")

        # 2. задание с телефона
        open_trainer(phone, "oge6", "oge6.html")
        n0 = count(board)
        phone.click("#bpAddBtn")
        wait_count(board, n0 + 1)
        o = board.evaluate(f"() => {IMAGES}[{n0}]")
        for k in ("task", "gen", "css", "card", "stack", "gap", "locked", "addedAt"):
            check(f"2. есть поле {k}", k in o, str(sorted(o.keys())))
        check("2. «Добавлено на доску» на телефоне", wait_text(phone, "#bpToast", "Добавлено на доску"))
        work_topics = [t for t in R["topics"] if t.startswith("bdlink:w-")]
        check("2. рабочий канал — через сервер", len(work_topics) == 1, str(R["topics"]))
        check("2. ни одно сообщение не превысило лимит", R["rejected"] == 0 and R["max"] <= LIMIT, f"max {R['max']}, отклонено {R['rejected']}")

        # 3. крупные задания: WebP и Storage
        mid = phone.evaluate(BIG_JS, "smooth")
        big = phone.evaluate(BIG_JS, "noise")
        sh = phone.evaluate("async ([a, b]) => { const s = __boardPanel.client; const k = JSON.parse(localStorage.getItem('bdPanel:link')).key;"
                            " const r1 = await BoardLink.shrinkPayload({ img: a, css: { w: 450, h: 350 } }, k);"
                            " const r2 = await BoardLink.shrinkPayload({ img: b, css: { w: 450, h: 350 } }, k);"
                            " if (r1.path) await (window.__bdLinkSupabase().storage.from('board-link').remove([r1.path]));"
                            " if (r2.path) await (window.__bdLinkSupabase().storage.from('board-link').remove([r2.path]));"
                            " return [r1.how, r1.bytes, r2.how, r2.bytes]; }", [mid, big])
        print(f"   градиент: PNG {len(mid)*3//4//1024} КБ → {sh[0]} {sh[1]//1024} КБ; шум: PNG {len(big)*3//4//1024} КБ → {sh[2]}")
        check("3. среднее — сжато в WebP, без Storage", sh[0] == "webp" and sh[1] <= 200 * 1024, str(sh[:2]))
        check("3. огромное — через Storage", sh[2] == "blob", str(sh[2:]))
        puts0, n1 = R["puts"], count(board)
        phone.evaluate("(img) => { window.__bigRes = null; __boardPanel.client.send('add-task', { img, css: { w: 450, h: 350 } }).then(r => { window.__bigRes = r; }); }", big)
        board.wait_for_function(f"() => {IMAGES}.length === {n1 + 1}", timeout=30000)
        ob = board.evaluate(f"() => {{ const o = {IMAGES}[{n1}]; return {{ src: o.src.slice(0, 16), w: o.w, h: o.h, css: o.css }}; }}")
        check("3. огромное задание легло на доску", ob["css"]["w"] == 450, str(ob))
        check("3. картинка пришла в WebP", ob["src"].startswith("data:image/webp"), ob["src"])
        check("3. файл в Storage залит один раз", R["puts"] == puts0 + 1, f"{R['puts']} / {puts0}")
        phone.wait_for_function("() => window.__bigRes === 'ok'", timeout=15000)
        for _ in range(50):
            with RL:
                left = [k for k in R["blobs"]]
            if not left:
                break
            time.sleep(0.1)
        check("3. после ответа доски файл удалён", not left, str(left))
        check("3. сообщения в пределах лимита", R["rejected"] == 0, f"отклонено {R['rejected']}, max {R['max']}")
        # шифрование: заливаем ещё раз вручную и смотрим, что лежит на сервере
        enc = phone.evaluate("async (img) => { const k = JSON.parse(localStorage.getItem('bdPanel:link')).key;"
                             " const r = await BoardLink.shrinkPayload({ img, css: { w: 1, h: 1 } }, k); return r.path; }", big)
        with RL:
            raw = R["blobs"].get("board-link/" + enc, b"")
        check("3. файл в Storage зашифрован", len(raw) > 1000 and b"data:image" not in raw and b"css" not in raw, str(raw[:40]))
        back = board.evaluate("async ([path, key]) => { const sb = window.__bdLinkSupabase(); const { data } = await sb.storage.from('board-link').download(path);"
                              " const p = await BoardLink.openJson(await data.arrayBuffer(), key); return p.css; }",
                              [enc, phone.evaluate("() => JSON.parse(localStorage.getItem('bdPanel:link')).key")])
        check("3. доска расшифровывает файл общим ключом", back == {"w": 1, "h": 1}, str(back))
        with RL:
            R["blobs"].clear()

        # 4. ручное размещение с телефона
        phone.evaluate("() => document.getElementById('bpRefreshBtn').click()")
        phone.wait_for_timeout(500)
        n2 = count(board)
        phone.click("#bpManualBtn")
        board.wait_for_function("() => !!placeGhost", timeout=25000)
        check("4. призрак с подписью телефона", "Телефон Дани" in board.inner_text(".bd-ghost-who"), board.inner_text(".bd-ghost-who"))
        check("4. телефон — «Размещаем на доске…»", wait_text(phone, "#bpPending", "Размещаем на доске"))
        board.click(".bd-ghost-bar .bd-ghost-cancel")
        check("4. «Отмена» — телефон «Отменено на доске»", wait_text(phone, "#bpToast", "Отменено на доске"))
        check("4. ничего не вставлено", count(board) == n2)
        phone.wait_for_timeout(400)
        phone.click("#bpManualBtn")
        board.wait_for_function("() => !!placeGhost", timeout=25000)
        board.wait_for_timeout(300)
        board.click(".bd-ghost-bar .bd-ghost-pin")
        wait_count(board, n2 + 1)
        check("4. «Закрепить» — телефон «Закреплено на доске»", wait_text(phone, "#bpToast", "Закреплено на доске"))

        # 5. доска закрыта (сначала даём доске дописать сохранение — оно с задержкой)
        board.wait_for_timeout(900)
        n3 = count(board)
        board.close()
        check("5. доска закрыта — «Доска не в сети»", wait_text(phone, "#bpStatusText", "Доска не в сети", 15000), phone.inner_text("#bpStatusText"))
        phone.evaluate("() => document.getElementById('bpRefreshBtn').click()")
        phone.wait_for_timeout(500)
        phone.click("#bpAddBtn")
        check("5. телефон — «Ждут отправки: 1»", wait_text(phone, "#bpPending", "Ждут отправки: 1"))
        board = new_board(ctx_b, seed=False)
        wait_count(board, n3 + 1, 30000)
        check("5. доска открылась — отложенное задание легло", True)
        check("5. окошка подключения не было", not board.evaluate("() => document.getElementById('linkAsk').classList.contains('show')"))
        check("5. снова «Подключено»", wait_text(phone, "#bpStatusText", "Подключено к доске"))

        # 7. размеры на реальных заданиях
        print("\n   Размеры снимков (PNG → WebP q=0.9; сообщение целиком, байты JSON):")
        sizes = []
        for tid, href, label in (("oge8", "oge8.html", "ОГЭ №8"), ("ege9", "ege_prof.html?n=9", "ЕГЭ №9 (график)"),
                                 ("oge15_18", "oge15_18.html", "ОГЭ №15–18 (геометрия)")):
            open_trainer(phone, tid, href)
            res = phone.evaluate(f"""async () => {{
                const f = document.getElementById('bpIframe'); const out = [];
                await ttSnapTrainerTasks(f.contentWindow, {json.dumps(tid)}, {json.dumps(href)}, {{ widthFor: () => null,
                  onShot: async (it) => {{
                    const p = {{ img: it.dataUrl, task: it.task, gen: it.gen, card: it.shot.card, css: it.shot.css, sol: it.shot.sol, cw: it.cw }};
                    const webp = await BoardLink.toWebp(it.dataUrl);
                    const r = await BoardLink.shrinkPayload(p, null);
                    out.push({{ png: Math.round(it.dataUrl.length * 3 / 4), webp: Math.round(webp.length * 3 / 4),
                      msg: BoardLink.jsonBytes(p), how: r.how, after: r.bytes, html: (it.gen && it.gen.html || '').length,
                      sol: !!it.shot.sol, w: it.shot.css.w, h: it.shot.css.h }});
                  }} }});
                return out; }}""")
            for r in res[:1]:
                sizes.append((label, r))
                print(f"   {label}: {r['w']:.0f}×{r['h']:.0f} css px; PNG {r['png']/1024:.0f} КБ, WebP {r['webp']/1024:.0f} КБ; "
                      f"сообщение {r['msg']/1024:.0f} КБ → {r['how']} {r['after']/1024:.0f} КБ (вёрстка gen.html {r['html']/1024:.0f} КБ)")
            check(f"7. {label}: снимок снят", bool(res), str(res))
            check(f"7. {label}: после сжатия в пределах 200 КБ или через Storage",
                  bool(res) and (res[0]["how"] in ("as-is", "webp") or res[0]["how"] == "too-big"), str(res[:1]))

        # 6. отключение — телефон узнаёт через сервер
        board.evaluate(f"() => boardLink.disconnect({json.dumps(dev['id'])})")
        check("6. «Отключить» — телефон «Доска отключила это устройство»", wait_text(phone, "#bpStatusText", "Доска отключила", 12000), phone.inner_text("#bpStatusText"))
        check("6. телефон — экран подключения", phone.evaluate("() => document.body.classList.contains('bp-pairing')"))

        check("8. нет ошибок JavaScript", not ERRORS, "\n".join(ERRORS[:5]))
        browser.close()


with servers():
    run()
print(f"\n   Ретранслятор: сообщений {R['n']}, самое крупное {R['max']/1024:.0f} КБ, отклонено по лимиту {R['rejected']}, файлов залито {R['puts']}")
print("\nИТОГ: " + ("всё прошло" if not FAILS else f"упало {len(FAILS)}: " + "; ".join(FAILS)))
sys.exit(1 if FAILS else 0)
