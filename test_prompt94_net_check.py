"""
№94 «Проверка связи» (net-check.js).

Окно проверки отвечает, почему у ученика не обновляется доска: его сеть
режет связь с сервером доски (Cloudflare) или дело на нашей стороне. Один и
тот же файл качается с нашего сайта и с cdnjs (Cloudflare), потом — сервер
доски, данные доски, картинка и живая связь.

Настоящие серверы из песочницы недоступны, поэтому всё — свой сервер на
127.0.0.1: отдаёт файлы репозитория и «серверы», которые отвечают целиком,
обрываются после 16 КБ или отвечают 500 «statement timeout». Живая связь —
заглушка supabase-js (эхо целиком / эхо обрывается / не подключается).

Проверяем:
  A. Измерения и итог (минимальная страница, только net-check.js):
     1. всё отвечает — «Связь с серверами доски в порядке», байты посчитаны
     2. сайт целиком, Cloudflare обрывается на ~16 КБ — «Провайдер режет
        связь», в строке Cloudflare «оборвалось на 16 КБ»
     3. Cloudflare целиком, а данные доски обрываются — «Связь с сервером
        доски обрывается»
     4. база отвечает 500 «statement timeout» — «База доски отвечает
        медленно», жёлтая строка, а не красная
     5. живая связь не подключается при живом остальном — «Живая связь не
        поднимается»
     6. ничего не открывается — «Нет интернета»
     7. данные доски запрашиваются с токеном вошедшего; нет общей доски —
        строки доски и картинок пропущены, а не провалены
     8. окно: строки, итог, «Скопировать результат» — текст с итогом
  B. На досках (заглушка из test_prompt10):
     1. в меню «⋯» есть «Проверка связи», нажатие открывает окно
     2. в плашке «Нет связи с доской» — кнопка «Проверить связь», она
        открывает окно; в обычной «загружается…» кнопки нет
"""
import sys
import threading
import time
import os
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler

from playwright.sync_api import sync_playwright

import test_prompt10_shared_board_load as base

PORT = 9196          # доски (заглушка test_prompt10)
NET_PORT = 9197      # свой сервер для части A
base.PORT = PORT
base.BASE = f"http://127.0.0.1:{PORT}"
NET = f"http://127.0.0.1:{NET_PORT}"
REPO = os.path.dirname(os.path.abspath(__file__))

BIG = b"x" * 300000
SEEN_AUTH = []


class NetHandler(SimpleHTTPRequestHandler):
    def __init__(self, *a, **k):
        super().__init__(*a, directory=REPO, **k)

    def log_message(self, *a):
        pass

    def end_headers(self):
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Headers", "*")
        super().end_headers()

    def do_OPTIONS(self):
        self.send_response(204)
        self.end_headers()

    def body(self, data, status=200, ctype="application/octet-stream"):
        self.send_response(status)
        self.send_header("Content-Type", ctype)
        self.send_header("Content-Length", str(len(data)))
        self.end_headers()
        self.wfile.write(data)

    def cut(self):
        # как у режущего провайдера: заголовки, первые 16 КБ — и тишина
        self.send_response(200)
        self.send_header("Content-Length", str(len(BIG)))
        self.end_headers()
        self.wfile.write(BIG[:16384])
        self.wfile.flush()
        time.sleep(3)

    def do_GET(self):
        path = self.path.split("?")[0]
        try:
            if path == "/__nc.html":
                return self.body(b'<!doctype html><meta charset="utf-8"><title>nc</title>'
                                 b'<script src="/net-check.js"></script>', ctype="text/html; charset=utf-8")
            if path.startswith("/net/"):
                kind = path.split("/")[2]
                return self.cut() if kind == "cut" else self.body(BIG)
            if path.startswith("/sb-"):
                kind = path.split("/")[1][3:]          # ok | cut | slow
                if "/auth/v1/settings" in path:
                    return self.body(b'{"external":{}}', ctype="application/json")
                if "/rest/v1/board_objects" in path:
                    SEEN_AUTH.append(self.headers.get("Authorization"))
                    if kind == "cut":
                        return self.cut()
                    if kind == "slow":
                        return self.body(b'{"code":"57014","message":"canceling statement due to statement timeout"}',
                                         500, "application/json")
                    return self.body(b"[" + b",".join([b'{"obj_id":"a","data":{"x":"' + b"y" * 200 + b'"}}'] * 300) + b"]",
                                     ctype="application/json")
            if path.startswith("/img-"):
                return self.cut() if path.startswith("/img-cut/") else self.body(BIG[:100000], ctype="image/png")
        except (BrokenPipeError, ConnectionResetError):
            return
        return super().do_GET()


# заглушка supabase-js только для живой связи: MODE.join — подключается ли,
# MODE.echo — сколько сообщений вернётся (Infinity — все)
FAKE_LIVE = """(mode) => {
  window.__LIVE = mode;
  window.supabase = { createClient(){ return {
    realtime: { disconnect(){} }, removeChannel(){},
    channel(){ const hs = []; let n = 0; const ch = {
      on(t, f, cb){ hs.push(cb); return ch; },
      subscribe(cb){ setTimeout(() => cb(window.__LIVE.join ? 'SUBSCRIBED' : 'CHANNEL_ERROR'), 10); return ch; },
      send(m){ if (n++ < window.__LIVE.echo) setTimeout(() => hs.forEach(h => h({ payload: m.payload })), 5);
        return Promise.resolve('ok'); } }; return ch; } }; } };
}"""

SETUP = """([net, sb, cdn, img, board]) => {
  const o = window.MathhNetCheck.opts;
  o.idleMs = 1200; o.totalMs = 8000; o.liveMs = 1500;
  o.cdnUrl = net + '/net/' + cdn;
  o.siteFile = '/net/ok';
  window.SUPABASE_CONFIG = { url: net + '/sb-' + sb, anonKey: 'anon' };
  window.IMG_BASE_URL = net + '/img-' + img + '/';
  window.SB = { auth: { getSession: async () => ({ data: { session: { access_token: 'tok-user' } } }) } };
  window.getCurrentBoard = board ? () => ({ cloudBoardId: 'cb1', objects: [{ id: 'i', src: 'img:k1.png' }] }) : () => null;
}"""


def run_check(page, sb="ok", cdn="ok", img="ok", board=True, join=True, echo=10**9):
    page.evaluate(FAKE_LIVE, {"join": join, "echo": echo})
    page.evaluate(SETUP, [NET, sb, cdn, img, board])
    return page.evaluate("() => window.MathhNetCheck.run()")


def part_a(ctx, check):
    page = ctx.new_page()
    errors = []
    page.on("pageerror", lambda e: errors.append(str(e)))
    page.goto(f"{NET}/__nc.html")
    page.wait_for_function("() => !!window.MathhNetCheck")

    R = run_check(page)
    check(R["verdict"]["kind"] == "ok" and "в порядке" in R["verdict"]["title"], "A1. всё отвечает — «в порядке»")
    check(R["site"]["bytes"] == 300000 and R["cdn"]["bytes"] == 300000 and R["img"]["bytes"] == 100000,
          "A1. байты посчитаны точно")
    check(R["live"]["ok"] and R["live"]["got"] == 20, "A1. живая связь: все 20 сообщений вернулись")

    R = run_check(page, cdn="cut", sb="cut", img="cut", echo=2)
    check("Провайдер режет" in R["verdict"]["title"] and R["verdict"]["kind"] == "bad",
          f"A2. Cloudflare обрывается — «{R['verdict']['title']}»")
    check(R["cdn"]["stalled"] and R["cdn"]["bytes"] == 16384, "A2. Cloudflare: оборвалось ровно на 16 КБ")
    check("другая сеть" in R["verdict"]["text"] or "Помогает другая сеть" in R["verdict"]["text"],
          "A2. совет — другая сеть")

    R = run_check(page, sb="cut")
    check("обрывается" in R["verdict"]["title"] and "Провайдер" not in R["verdict"]["title"],
          f"A3. Cloudflare целиком, доска обрывается — «{R['verdict']['title']}»")

    R = run_check(page, sb="slow")
    check(R["data"]["dbTimeout"] and "медленно" in R["verdict"]["title"] and R["verdict"]["kind"] == "warn",
          f"A4. 500 statement timeout — «{R['verdict']['title']}»")

    R = run_check(page, join=False)
    check("Живая связь не поднимается" in R["verdict"]["title"] and R["live"]["error"] == "join",
          f"A5. живая связь не подключается — «{R['verdict']['title']}»")

    page.evaluate(FAKE_LIVE, {"join": False, "echo": 0})
    page.evaluate("""() => { const o = window.MathhNetCheck.opts; o.idleMs = 1200; o.liveMs = 800;
        o.cdnUrl = 'http://127.0.0.1:1/x'; o.siteFile = '/nonexistent-file.js';
        window.SUPABASE_CONFIG = { url: 'http://127.0.0.1:1', anonKey: 'anon' }; window.getCurrentBoard = () => null; }""")
    R = page.evaluate("() => window.MathhNetCheck.run()")
    check("Нет интернета" in R["verdict"]["title"], f"A6. ничего не открывается — «{R['verdict']['title']}»")

    SEEN_AUTH.clear()
    run_check(page)
    check(SEEN_AUTH and SEEN_AUTH[-1] == "Bearer tok-user", "A7. данные доски — с токеном вошедшего")
    R = run_check(page, board=False)
    check(R["data"] is None and R["img"] is None and R["verdict"]["kind"] == "ok",
          "A7. нет общей доски — строки пропущены, итог не портят")

    # ── окно ───────────────────────────────────────────────────────────
    page.evaluate(FAKE_LIVE, {"join": True, "echo": 10**9})
    page.evaluate(SETUP, [NET, "ok", "cut", "ok", True])
    page.evaluate("() => window.MathhNetCheck.open()")
    page.wait_for_selector("#mnCheck.open")
    page.wait_for_selector("#mnCheck .mn-verdict.open", timeout=15000)
    st = page.evaluate("""() => Array.from(document.querySelectorAll('#mnCheck .mn-row')).map(r => [r.dataset.id, r.dataset.s,
        r.querySelector('.mn-det').textContent])""")
    m = {i: (s, d) for i, s, d in st}
    check(len(st) == 6 and m["site"][0] == "ok" and m["cdn"][0] == "bad" and "оборвалось на 16 КБ" in m["cdn"][1],
          "A8. окно: шесть строк, Cloudflare красная «оборвалось на 16 КБ»")
    v = page.inner_text("#mnCheck .mn-verdict")
    check("Провайдер режет" in v, "A8. окно: итог виден")
    txt = page.evaluate("() => window.MathhNetCheck.reportText()")
    check(txt and "Провайдер режет" in txt and "Серверы Cloudflare: оборвалось на 16 КБ" in txt,
          "A8. «Скопировать результат» — текст с итогом и строками")
    page.click("#mnCheck .mn-close")
    check(not page.is_visible("#mnCheck"), "A8. окно закрывается")
    check(not errors, "A. без ошибок JavaScript: " + "; ".join(errors[:3]))
    page.close()


def part_b(ctx, check):
    setup = "() => { window.__fake.manualSubscribe = true; window.__cloudDiffTest.setLiveTimes(800, 16000, 90000); }"
    page = base.open_shared(ctx, "T", [base.pen(1)], [base.pen(1)], setup_js=setup)
    errors = []
    page.on("pageerror", lambda e: errors.append(str(e)))
    # без сети: всё качаем со своего же сервера, живая связь — без эха
    page.evaluate("""() => { const o = window.MathhNetCheck.opts; o.idleMs = 800; o.liveMs = 600;
        o.cdnUrl = location.origin + '/jspdf.umd.min.js'; }""")

    has = page.evaluate("() => !!document.getElementById('mnCheckBtn') && !!document.getElementById('mnCheckBtn').closest('.lg-menu')")
    check(has, "B1. в меню «⋯» есть «Проверка связи»")
    page.click("#lgMenuToggle")
    page.wait_for_timeout(400)
    page.click("#mnCheckBtn")
    page.wait_for_selector("#mnCheck.open", timeout=3000)
    check(page.is_visible("#mnCheck"), "B1. нажатие открывает окно")
    page.wait_for_selector("#mnCheck .mn-verdict.open", timeout=20000)
    page.click("#mnCheck .mn-close")

    page.wait_for_function("""() => { const el = document.getElementById('bdCloudLoad');
        return el && el.classList.contains('open') && /Нет связи/.test(el.textContent); }""", timeout=5000)
    vis = page.is_visible("#bdCloudLoad .bd-cl-check")
    check(vis, "B2. в плашке «Нет связи» — кнопка «Проверить связь»")
    page.click("#bdCloudLoad .bd-cl-check")
    page.wait_for_selector("#mnCheck.open", timeout=3000)
    check(page.is_visible("#mnCheck"), "B2. кнопка в плашке открывает окно")
    page.wait_for_selector("#mnCheck .mn-verdict.open", timeout=20000)
    page.click("#mnCheck .mn-close")

    # обычная «загружается…» (не сбой) — без кнопки проверки: открываем
    # доску заново с медленной базой, плашку о связи отодвигаем
    page.evaluate("""() => { window.__cloudDiffTest.setLiveTimes(60000, 16000, 90000);
        window.__fake.delays.select = [2500, 2500, 2500]; window.onBoardOpened(window.getCurrentBoard()); }""")
    try:
        page.wait_for_function("""() => { const el = document.getElementById('bdCloudLoad');
            return el && el.classList.contains('wait') && el.classList.contains('open'); }""", timeout=3000)
        waited = True
    except Exception:
        waited = False
    check(waited and not page.is_visible("#bdCloudLoad .bd-cl-check"),
          "B2. в обычной «загружается…» кнопки проверки нет")
    check(not errors, "B. без ошибок JavaScript: " + "; ".join(errors[:3]))
    page.close()


def run():
    failures = []

    def check(cond, label):
        print(("[OK] " if cond else "[FAIL] ") + label)
        if not cond:
            failures.append(label)

    srv = ThreadingHTTPServer(("127.0.0.1", NET_PORT), NetHandler)
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
