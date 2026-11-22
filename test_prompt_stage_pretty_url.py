"""
Сцена не открывает саму себя в кадре и при адресах без .html.

Зачем. Тестовый сайт (Cloudflare Pages, math-ttrainers-staging.pages.dev)
убирает .html из адреса: /stage.html → /stage. Проверка в targetUrl
(stage.html) искала только «/stage.html», и ?to=stage на тестовом сайте
пропускала сцену в кадр. На github.io адреса с .html, там всё как было.

Проверяем настоящую функцию targetUrl из stage.html (берём её текст из
файла) на странице, открытой и как /stage.html, и как /stage — сервер
здесь, как Cloudflare, отдаёт stage.html и по адресу без расширения:
  A. ?to=stage и ?to=stage.html — в кадр идёт index.html, не сцена
  B. ?to=boards и ?to=boards.html — остаются как есть, с кодом сессии
  C. чужой сайт в ?to= — index.html

Запуск: python3 test_prompt_stage_pretty_url.py
"""
import http.server
import os
import re
import sys
import threading

from playwright.sync_api import sync_playwright

ROOT = os.path.dirname(os.path.abspath(__file__))
PORT = 8991
failures = []


def check(name, ok, info=""):
    print(("OK   " if ok else "FAIL ") + name + ("" if ok else f"  [{info}]"))
    if not ok:
        failures.append(name)


class PrettyHandler(http.server.SimpleHTTPRequestHandler):
    # как Cloudflare Pages: /stage отдаёт stage.html
    def __init__(self, *a, **kw):
        super().__init__(*a, directory=ROOT, **kw)

    def translate_path(self, path):
        p = super().translate_path(path)
        if not os.path.exists(p) and os.path.exists(p + ".html"):
            return p + ".html"
        return p

    def log_message(self, *a):
        pass


def target_url_source():
    src = open(os.path.join(ROOT, "stage.html"), encoding="utf-8").read()
    m = re.search(r"function targetUrl\(raw\)\{.*?\n  \}\n", src, re.S)
    assert m, "targetUrl не найдена в stage.html"
    return m.group(0)


def run():
    srv = http.server.ThreadingHTTPServer(("127.0.0.1", PORT), PrettyHandler)
    threading.Thread(target=srv.serve_forever, daemon=True).start()
    fn = target_url_source()
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()
        # пустая страница с того же сайта, чтобы скрипты сцены не запускались
        page.route("**/blank-*", lambda r: r.fulfill(status=200, content_type="text/html", body="<!doctype html><title>x</title>"))
        for where in ("stage.html", "stage"):
            # открываем пустышку по пути сцены: location как у настоящей сцены
            page.route(f"**/{where}?probe=1", lambda r: r.fulfill(status=200, content_type="text/html", body="<!doctype html><title>x</title>"))
            page.goto(f"http://127.0.0.1:{PORT}/{where}?probe=1")
            res = page.evaluate("""(fn) => { const code = 'ABC123';
                const targetUrl = new Function('code', fn + '; return targetUrl;')(code);
                const r = {};
                for (const to of ['stage', 'stage.html', 'boards', 'boards.html', 'https://evil.example/x', '//evil.example/stage'])
                  r[to] = targetUrl(to).toString().replace(location.origin, '');
                return r; }""", fn)
            check(f"A [{where}]: ?to=stage — в кадре главная", res["stage"] == "/index.html?s=ABC123", res["stage"])
            check(f"A [{where}]: ?to=stage.html — в кадре главная", res["stage.html"] == "/index.html?s=ABC123", res["stage.html"])
            check(f"B [{where}]: ?to=boards остаётся", res["boards"] == "/boards?s=ABC123", res["boards"])
            check(f"B [{where}]: ?to=boards.html остаётся", res["boards.html"] == "/boards.html?s=ABC123", res["boards.html"])
            check(f"C [{where}]: чужой сайт — главная", res["https://evil.example/x"] == "/index.html?s=ABC123"
                  and res["//evil.example/stage"] == "/index.html?s=ABC123", str(res))
            page.unroute(f"**/{where}?probe=1")
        # сервер правда отдаёт сцену по адресу без .html, как Cloudflare
        r = page.goto(f"http://127.0.0.1:{PORT}/stage")
        check("сервер теста отдаёт /stage как stage.html", r.status == 200 and "targetUrl" in page.content())
        browser.close()
    srv.shutdown()
    if failures:
        print(f"\nПРОВАЛЕНО: {len(failures)}")
        sys.exit(1)
    print("\nготово")


if __name__ == "__main__":
    run()
