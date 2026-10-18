"""
Промпт №90б: презентации вместе с переездом на сервер.

Проверяем: картинка-подложка слайда (bgOf) уезжает в хранилище ключом img:
и показывается; плитка своей подложки с ключом получает полный адрес;
облачная доска без kind становится презентацией, как только из базы
пришёл служебный объект слайдов (deckAdopt).
"""
import os
import subprocess
import sys
import time
import contextlib
import http.client
import json
import base64

from playwright.sync_api import sync_playwright

PORT = 9003
BASE = f"http://127.0.0.1:{PORT}"


@contextlib.contextmanager
def local_server():
    proc = subprocess.Popen(
        [sys.executable, "-m", "http.server", str(PORT)],
        stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL,
    )
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


BOOT_JS = """
() => {
  const gate = document.getElementById('authGate');
  if (gate) gate.style.display = 'none';
  window.boardsAppBoot();
  // список досок показывает вход в облако (boards-cloud.js); без него — сами
  document.getElementById('screenList').style.display = 'flex';
}
"""

fails = []

fails = []


def check(cond, msg):
    print(("OK   " if cond else "FAIL ") + msg)
    if not cond:
        fails.append(msg)


PNG = base64.b64decode("iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAIAAAD91JpzAAAAFklEQVR4nGP4z8DAwMDAxMDAwMDAAAANHQEDasKb6QAAAABJRU5ErkJggg==")
DATA = "data:image/png;base64," + base64.b64encode(PNG).decode()

STUB_JS = """() => {
  window.CURRENT_USER = { id: 'u1' };
  window.IMG_BASE_URL = 'http://localhost:9003/fakestore/';
  window.SB = { storage: { from: () => ({ upload: async (path) => ({ data: { path }, error: null }) }) } };
}"""


def main():
    exe = os.environ.get("PW_CHROMIUM") or None
    with local_server(), sync_playwright() as p:
        browser = p.chromium.launch(executable_path=exe)
        ctx = browser.new_context(viewport={"width": 1280, "height": 800})
        ctx.route("http://localhost:9003/fakestore/**", lambda r: r.fulfill(
            status=200, body=PNG, headers={"Content-Type": "image/png", "Access-Control-Allow-Origin": "*"}))
        page = ctx.new_page()
        errors = []
        page.on("pageerror", lambda e: errors.append(str(e)))
        page.goto(f"{BASE}/boards.html")
        page.evaluate(BOOT_JS)
        page.wait_for_timeout(400)

        # презентация с картинкой-подложкой слайда
        page.click("#blCreateDeck")
        page.wait_for_timeout(800)
        page.evaluate("(src) => { deckPutBgImg(deckCur(), src, { w: 2, h: 2 }); saveDB(); scheduleRedraw(); }", DATA)
        page.evaluate(STUB_JS)
        page.wait_for_function("() => ImageStore.pending() === 0", timeout=15000)
        bg = page.evaluate("() => { const o = B.objects.find(x => x.bgOf); return [o.src, deckCur().bg.img === o.id]; }")
        print("подложка:", bg)
        check(bg[0].startswith("img:u1/") and bg[1], "картинка-подложка слайда уехала в хранилище ключом, слайд её держит")
        page.wait_for_timeout(300)
        check(page.evaluate("() => { const o = B.objects.find(x => x.bgOf); const im = getImg(o.src); return im.complete && im.naturalWidth > 0; }"),
              "подложка по ключу показывается")

        # плитка своей подложки с ключом — полный адрес в CSS
        page.evaluate("""() => { deckPresets.bgs.unshift({ id: 'p1', name: 'фото', bg: { k: 'img' }, img: 'img:u1/x.png' }); deckRenderPresets(); }""")
        tile = page.evaluate("() => (document.querySelector('[data-ubg=\"p1\"] i') || {}).getAttribute ? document.querySelector('[data-ubg=\"p1\"] i').getAttribute('style') : ''")
        check("http://localhost:9003/fakestore/u1/x.png" in (tile or ""), "плитка своей подложки получает полный адрес картинки")

        # облачная доска без kind: служебный объект слайдов пришёл из базы позже
        page.evaluate("() => backToList()")
        page.wait_for_timeout(400)
        page.click("#blCreateBoard")
        page.wait_for_timeout(700)
        before = page.evaluate("() => [B.kind || '', document.getElementById('deckNav').hidden]")
        page.evaluate("""() => { B.objects = [{ id: 'deck', type: 'deck', points: [{ x: -1e7, y: -1e7 }],
          slides: [{ id: 's1', slot: 0, w: 64, h: 36, bg: { k: 'grid' } }, { id: 's2', slot: 1, w: 64, h: 36, bg: { k: 'grid' } }] }];
          window.deckAdopt(B); }""")
        page.wait_for_timeout(500)
        after = page.evaluate("() => [B.kind, document.getElementById('deckNav').hidden, deckSlides().length]")
        print("до/после:", before, after)
        check(before[0] == "" and after[0] == "deck" and after[1] is False and after[2] == 2,
              "доска стала презентацией сразу, как пришёл служебный объект слайдов")

        check(not errors, "без ошибок на странице" + (": " + "; ".join(errors[:3]) if errors else ""))
        browser.close()
    print("\nИТОГ:", "ВСЁ ХОРОШО" if not fails else f"ПРОВАЛОВ {len(fails)}")
    sys.exit(1 if fails else 0)


if __name__ == "__main__":
    main()
