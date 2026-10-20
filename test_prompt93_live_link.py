"""
№93 «связь с доской».

Живой случай (урок 19.10.2026): у ученика на общей доске жёлтая плашка «Связь
с базой сбоит — догружаю доску» висела до конца урока, новое на доске больше
не появлялось, картинка задания — «Загрузка…», а у учителя кнопка ученика
справа сверху и его курсор то появлялись, то пропадали.

Причина — не в доске: Supabase стоит за Cloudflare, а часть российских
провайдеров пропускает к Cloudflare только первые ~16 КБ соединения, дальше
запрос висит без ошибки. Доска это переживала плохо: зависший запрос держал
загрузку (а с ней и сверку) и очередь записей навсегда, обрывы живой связи
были не видны, после переподключения пропущенное приходило только сверкой.

Живой realtime из песочницы закрыт: канал — заглушка из test_prompt10, но с
ответами о подписке (__fake.status), а «режущий» провайдер — свой маленький
сервер, который отдаёт заголовки и замолкает.

Проверяем:
  A. Сторож запросов (sbGuardedFetch, supabase-config.js) — на настоящей
     supabase-js и сервере-заглушке:
     1. обычный ответ проходит, тело и заголовки на месте
     2. молчит до заголовков — обрыв через idleMs, обрыв записан в stalls
     3. заголовки пришли, тело встало — тоже обрыв (встроенный таймаут
        библиотеки этот случай не ловит)
     4. медленный, но живой ответ (по байту) не обрывается, хоть идёт
        дольше idleMs
     5. хранилище картинок (/storage/) сторож не трогает
     6. отмена самим вызывающим работает и обрывом связи не считается
     7. ответ без тела (204) отдаётся как есть
     8. supabase-js со сторожем: зависший select возвращает ошибку, а не
        висит; обычный select читает строки
  B. Доска (заглушка канала):
     1. клиент базы создан со сторожем
     2. связь так и не поднялась — плашка «Нет связи с доской»
     3. подключились — плашки нет, ушёл `here` с `ask`
     4. связь пропала — плашка не сразу, а через LIVE_BANNER_MS
     5. вернулась — плашка ушла сразу, сделанное собеседником за это время
        забрано из базы сверкой
     6. рвётся не первый раз — в плашке совет сменить сеть
     7. канал закрылся сам (CLOSED) — через 2 с открыт заново
     8. уход с доски — канал заново не открывается, плашки нет
     9. собеседник замолчал — кнопка блёклая, а не пропала; заговорил —
        снова обычная; долгая тишина — пропала
"""
import sys
import threading
import time
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

from playwright.sync_api import sync_playwright

import test_prompt10_shared_board_load as base

PORT = 9193
STALL_PORT = 9194
base.PORT = PORT
base.BASE = f"http://127.0.0.1:{PORT}"
STALL = f"http://127.0.0.1:{STALL_PORT}"

# заглушка канала из test_prompt10: ответы о подписке подаёт сам тест
# (__fake.manualSubscribe, __fake.status('SUBSCRIBED' | 'CHANNEL_ERROR' |
# 'CLOSED')), state канала — как у настоящего (по нему rtGuard не шлёт без
# связи); плюс счётчик каналов и параметры, с которыми создан клиент
FAKE_LIB = base.FAKE_LIB.replace(
    "channel(){",
    "channel(){ F.channels++;",
).replace(
    "removeChannel(){ F.handlers = []; },",
    "removeChannel(){ F.handlers = []; F.removed++; },",
).replace(
    "auth, from: builder,",
    "auth, from: builder, __opts: opts,",
).replace(
    "window.supabase = { createClient(){",
    "F.channels = 0; F.removed = 0;\n  window.supabase = { createClient(url, key, opts){",
)
assert FAKE_LIB.count("F.channels++") == 1 and "__opts: opts" in FAKE_LIB and "F.subs.push" in FAKE_LIB
base.FAKE_LIB = FAKE_LIB


class StallHandler(BaseHTTPRequestHandler):
    """Сервер «как у режущего провайдера»: отвечает и замолкает"""

    def log_message(self, *a):
        pass

    def cors(self):
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Headers", "*")
        self.send_header("Access-Control-Allow-Methods", "*")
        self.send_header("Access-Control-Expose-Headers", "*")

    def do_OPTIONS(self):
        self.send_response(204)
        self.cors()
        self.end_headers()

    def do_GET(self):
        path = self.path.split("?")[0]
        try:
            if path == "/guard.html":
                # страница с того же адреса, что «сервер базы»: иначе Chrome
                # режет запросы правилами локальной сети, а не сторож
                page = GUARD_PAGE.encode("utf-8")
                self.send_response(200)
                self.send_header("Content-Type", "text/html; charset=utf-8")
                self.send_header("Content-Length", str(len(page)))
                self.end_headers()
                self.wfile.write(page)
                return
            if path.endswith("/stall-head"):
                time.sleep(4)
                return
            if path.endswith("/nobody"):
                self.send_response(204)
                self.cors()
                self.end_headers()
                return
            body = b'[{"obj_id":"a"},{"obj_id":"b"}]'
            self.send_response(200)
            self.cors()
            self.send_header("Content-Type", "application/json")
            self.send_header("X-Test", "yes")
            if path.endswith("/stall-body") or path.endswith("/board_objects"):
                # заголовки и кусок тела, дальше — тишина
                self.send_header("Content-Length", "100000")
                self.end_headers()
                self.wfile.write(b'[{"obj_id":"a"},')
                self.wfile.flush()
                time.sleep(4)
                return
            if path.endswith("/trickle"):
                self.send_header("Content-Length", "10")
                self.end_headers()
                for _ in range(10):
                    self.wfile.write(b"x")
                    self.wfile.flush()
                    time.sleep(0.3)
                return
            self.send_header("Content-Length", str(len(body)))
            self.end_headers()
            self.wfile.write(body)
        except (BrokenPipeError, ConnectionResetError):
            pass


GUARD_PAGE = f"""<!doctype html><meta charset="utf-8"><title>guard</title>
<script src="{base.BASE}/supabase-js.umd.js"></script><script src="{base.BASE}/supabase-config.js"></script>"""

TIMED = """async ([url, opts]) => {
    const t0 = performance.now();
    try {
      const r = await window.sbGuardedFetch(url, opts || {});
      const text = r.status === 204 ? '' : await r.text();
      return { ok: true, status: r.status, text, x: r.headers.get('X-Test'), ms: performance.now() - t0 };
    } catch (e) {
      return { ok: false, name: e && e.name, ms: performance.now() - t0 };
    }
}"""


def part_a(ctx, check):
    page = ctx.new_page()
    errors = []
    page.on("pageerror", lambda e: errors.append(str(e)))
    page.goto(f"{STALL}/guard.html")
    page.wait_for_function("() => window.sbGuardedFetch && window.supabase && window.supabase.createClient")
    page.evaluate("() => { window.sbGuardedFetch.idleMs = 800; window.sbGuardedFetch.stalls.length = 0; }")

    r = page.evaluate(TIMED, [f"{STALL}/rest/v1/ok", None])
    check(r["ok"] and r["status"] == 200 and r["text"] == '[{"obj_id":"a"},{"obj_id":"b"}]' and r["x"] == "yes",
          "A1. обычный ответ проходит, тело и заголовки на месте")

    r = page.evaluate(TIMED, [f"{STALL}/rest/v1/stall-head", None])
    stalls = page.evaluate("() => window.sbGuardedFetch.stalls.length")
    check(not r["ok"] and r["name"] == "AbortError" and r["ms"] < 2500,
          f"A2. молчит до заголовков — обрыв ({r['ms']:.0f} мс)")
    check(stalls == 1, "A2. обрыв записан в stalls")

    r = page.evaluate(TIMED, [f"{STALL}/rest/v1/stall-body", None])
    check(not r["ok"] and r["name"] == "AbortError" and r["ms"] < 2500,
          f"A3. тело встало — обрыв ({r['ms']:.0f} мс)")

    r = page.evaluate(TIMED, [f"{STALL}/rest/v1/trickle", None])
    check(r["ok"] and r["text"] == "x" * 10 and r["ms"] > 2000,
          f"A4. медленный, но живой ответ не оборван ({r['ms']:.0f} мс)")

    pending = page.evaluate("""async (url) => {
        // без сторожа fetch отдаёт ответ по заголовкам, а тело ждёт сколько угодно
        const p = window.sbGuardedFetch(url).then(r => r.text()).then(() => 'done', () => 'fail');
        const t = new Promise(r => setTimeout(() => r('pending'), 1600));
        return await Promise.race([p, t]);
    }""", f"{STALL}/storage/v1/stall-body")
    check(pending == "pending", "A5. хранилище картинок сторож не трогает")

    page.evaluate("() => { window.sbGuardedFetch.stalls.length = 0; }")
    r = page.evaluate("""async (url) => {
        const ac = new AbortController();
        setTimeout(() => ac.abort(), 150);
        const t0 = performance.now();
        try { await window.sbGuardedFetch(url, { signal: ac.signal }); return { ok: true }; }
        catch (e) { return { ok: false, name: e.name, ms: performance.now() - t0 }; }
    }""", f"{STALL}/rest/v1/stall-head")
    stalls = page.evaluate("() => window.sbGuardedFetch.stalls.length")
    check(not r["ok"] and r["ms"] < 700 and stalls == 0, "A6. отмена вызывающим работает и обрывом связи не считается")

    r = page.evaluate(TIMED, [f"{STALL}/rest/v1/nobody", None])
    check(r["ok"] and r["status"] == 204, "A7. ответ без тела (204) отдаётся как есть")

    res = page.evaluate("""async (url) => {
        const sb = window.supabase.createClient(url, 'anon-test',
          { global: { fetch: window.sbGuardedFetch }, auth: { persistSession: false, autoRefreshToken: false } });
        const t0 = performance.now();
        const bad = await sb.from('board_objects').select('obj_id');
        const ms = performance.now() - t0;
        const good = await sb.from('okrows').select('obj_id');
        return { badErr: !!bad.error, badMsg: bad.error && bad.error.message, ms,
                 goodErr: good.error && good.error.message, n: good.data ? good.data.length : -1 };
    }""", STALL)
    check(res["badErr"] and res["ms"] < 3000,
          f"A8. supabase-js: зависший select — ошибка через {res['ms']:.0f} мс, не зависание ({res['badMsg']})")
    check(not res["goodErr"] and res["n"] == 2, "A8. supabase-js: обычный select читает строки через сторожа")
    check(not errors, "A. без ошибок JavaScript: " + "; ".join(errors[:3]))
    page.close()


def banner(page):
    return page.evaluate("""() => { const el = document.getElementById('bdCloudLoad');
        return el && el.classList.contains('open') ? { cls: el.className, text: el.querySelector('.bd-cl-text').textContent } : null; }""")


def wait_banner(page, cond, timeout=4000):
    t0 = time.time()
    while time.time() - t0 < timeout / 1000:
        b = banner(page)
        if cond(b):
            return b
        page.wait_for_timeout(100)
    return banner(page)


def part_b(ctx, check):
    setup = "() => { window.__fake.manualSubscribe = true; window.__cloudDiffTest.setLiveTimes(1000, 1500, 4000); }"
    page = base.open_shared(ctx, "T", [base.pen(1)], [base.pen(1)], setup_js=setup)
    errors = []
    page.on("pageerror", lambda e: errors.append(str(e)))

    ok = page.evaluate("() => !!(window.SB.__opts && window.SB.__opts.global && window.SB.__opts.global.fetch === window.sbGuardedFetch)")
    check(ok, "B1. клиент базы создан со сторожем запросов")

    b = wait_banner(page, lambda b: b is not None and "Нет связи с доской" in b["text"], 3000)
    check(b is not None and "Нет связи с доской" in b["text"] and "warn" in b["cls"],
          "B2. связь так и не поднялась — плашка «Нет связи с доской»")

    page.evaluate("() => { window.__fake.sent.length = 0; window.__fake.status('SUBSCRIBED'); }")
    page.wait_for_timeout(150)
    check(banner(page) is None, "B3. подключились — плашки нет")
    asks = page.evaluate("() => window.__fake.sent.filter(m => m.event === 'here' && m.payload.ask).length")
    check(asks >= 1, "B3. ушёл `here` с `ask`")

    page.evaluate("() => window.__fake.status('CHANNEL_ERROR')")
    page.wait_for_timeout(300)
    check(banner(page) is None, "B4. связь пропала — плашка не сразу (короткий обрыв не мигает)")
    b = wait_banner(page, lambda b: b is not None, 3000)
    check(b is not None and "Нет связи с доской" in b["text"], "B4. связи нет дольше порога — плашка")
    check("другая сеть" not in (b or {}).get("text", ""), "B4. первый обрыв — без совета сменить сеть")

    # пока связи не было, собеседник нарисовал — в базе есть, рассылка пропала
    page.evaluate("(o) => window.__fake.rows.set(o.id, o)", base.pen(77777, by="S"))
    sel0 = page.evaluate("() => window.__fake.selects.length")
    page.evaluate("() => window.__fake.status('SUBSCRIBED')")
    page.wait_for_timeout(150)
    check(banner(page) is None, "B5. связь вернулась — плашка ушла сразу")
    try:
        page.wait_for_function("() => window.getCurrentBoard().objects.some(o => o.id === 'p77777')", timeout=3000)
        got = True
    except Exception:
        got = False
    sels = page.evaluate("(n) => window.__fake.selects.slice(n).map(s => s.sel)", sel0)
    check(got, "B5. сделанное собеседником без связи забрано из базы сразу, не через полминуты")
    check(any("rv:data->rv" in s for s in sels), "B5. после переподключения — сверка по номерам и версиям")

    page.evaluate("() => window.__fake.status('CHANNEL_ERROR')")
    b = wait_banner(page, lambda b: b is not None, 3000)
    check(b is not None and "другая сеть" in b["text"], "B6. рвётся не первый раз — в плашке совет сменить сеть")
    page.evaluate("() => window.__fake.status('SUBSCRIBED')")
    page.wait_for_timeout(150)

    ch0 = page.evaluate("() => window.__fake.channels")
    subs0 = page.evaluate("() => window.__fake.subs.length")
    page.evaluate("() => window.__fake.status('CLOSED')")
    page.wait_for_timeout(1000)
    check(page.evaluate("() => window.__fake.channels") == ch0, "B7. закрылся — не сразу (ждём 2 с)")
    page.wait_for_timeout(1500)
    ch1 = page.evaluate("() => window.__fake.channels")
    subs1 = page.evaluate("() => window.__fake.subs.length")
    hs = page.evaluate("() => window.__fake.handlers.filter(h => h.type === 'broadcast').map(h => h.filter.event)")
    check(ch1 == ch0 + 1 and subs1 == subs0 + 1, "B7. канал, закрытый сам, открыт заново")
    check(all(e in hs for e in ["cursor", "here", "board_diff", "task_live", "board_ready"]),
          "B7. у нового канала все обработчики")
    page.evaluate("() => window.__fake.status('SUBSCRIBED')")
    page.wait_for_timeout(150)
    check(page.evaluate("() => window.__cloudDiffTest.live().live") is True and banner(page) is None,
          "B7. новый канал подключился — связь есть, плашки нет")

    # ── 9: собеседник замолчал ─────────────────────────────────────────
    base_emit = "([e, p]) => window.__fake.emit(e, p)"
    page.evaluate(base_emit, ["here", {"uid": "S", "name": "Андрей", "cx": 300, "cy": 300, "z": 1}])
    page.wait_for_timeout(200)
    cls = page.evaluate("() => (document.querySelector(\"#bdPeers .bd-peer[data-uid='S']\") || {}).className")
    check(cls == "bd-peer", "B9. собеседник на связи — обычная кнопка")
    page.wait_for_timeout(2200)
    info = page.evaluate("""() => { const b = document.querySelector("#bdPeers .bd-peer[data-uid='S']");
        return b ? { cls: b.className, title: b.title, op: getComputedStyle(b).opacity } : null; }""")
    check(info is not None and "is-stale" in info["cls"] and float(info["op"]) < 0.9 and "нет связи" in info["title"],
          "B9. замолчал — кнопка осталась, но блёклая, в подсказке «нет связи»")
    page.evaluate(base_emit, ["cursor", {"uid": "S", "name": "Андрей", "x": 310, "y": 310, "drawing": False}])
    page.wait_for_timeout(200)
    cls = page.evaluate("() => (document.querySelector(\"#bdPeers .bd-peer[data-uid='S']\") || {}).className")
    check(cls == "bd-peer", "B9. снова пришло от него — кнопка обычная")
    page.wait_for_timeout(5200)
    check(page.locator("#bdPeers .bd-peer[data-uid='S']").count() == 0, "B9. долгая тишина — кнопка пропала")

    # ── 8: уход с доски ───────────────────────────────────────────────
    ch2 = page.evaluate("() => window.__fake.channels")
    page.evaluate("() => { window.__fake.status('CLOSED'); window.onBoardClosed(); }")
    page.wait_for_timeout(2600)
    check(page.evaluate("() => window.__fake.channels") == ch2, "B8. ушёл с доски — канал заново не открывается")
    check(banner(page) is None, "B8. после ухода с доски плашки нет")

    check(not errors, "B. без ошибок JavaScript: " + "; ".join(errors[:3]))
    page.close()


def run():
    failures = []

    def check(cond, label):
        print(("[OK] " if cond else "[FAIL] ") + label)
        if not cond:
            failures.append(label)

    srv = ThreadingHTTPServer(("127.0.0.1", STALL_PORT), StallHandler)
    srv.daemon_threads = True
    threading.Thread(target=srv.serve_forever, daemon=True).start()
    try:
        with base.local_server(), sync_playwright() as p:
            browser = p.chromium.launch()
            ctx = browser.new_context(viewport={"width": 1280, "height": 800})
            part_a(ctx, check)
            part_b(ctx, check)
            browser.close()
    finally:
        srv.shutdown()

    print()
    if failures:
        print(f"ПРОВАЛЕНО: {len(failures)}")
        sys.exit(1)
    print("Всё прошло")


if __name__ == "__main__":
    run()
