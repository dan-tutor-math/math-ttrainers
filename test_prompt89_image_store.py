"""
Промпт №89: картинки досок — файлами в хранилище Supabase (image-store.js).

Хранилище файлов подменено заглушкой (№89, №89б — ключ img: вместо адреса), картинка по ссылке отдаётся с другого
адреса (как настоящий бакет, с CORS). Проверяем: вставленная картинка
уезжает в хранилище и в доске становится ссылкой — и на доске, и в разборе
задания (sol); одинаковые картинки заливаются один раз; в хранилище
браузера лежит ссылка, а не base64; холст после этого не «запачкан»
(экспорт PNG работает); без бакета картинки остаются как были.
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

PORT = 9001
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


# маленький настоящий PNG 2×2
PNG = base64.b64decode("iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAIAAAD91JpzAAAAFklEQVR4nGP4z8DAwMDAxMDAwMDAAAANHQEDasKb6QAAAABJRU5ErkJggg==")
DATA = "data:image/png;base64," + base64.b64encode(PNG).decode()

STUB_JS = """(fail) => {
  window.CURRENT_USER = { id: 'u1' };
  window.IMG_BASE_URL = 'http://localhost:9001/fakestore/';
  window.__up = [];
  window.SB = { storage: { from: () => ({
    upload: async (path, blob) => { if (fail) return { data: null, error: { message: 'Bucket not found' } };
      window.__up.push(path); return { data: { path }, error: null }; },
    getPublicUrl: (path) => ({ data: { publicUrl: 'http://localhost:9001/fakestore/' + path } }),
  }) } };
}"""

ADD_JS = """(src) => {
  const a = { id: uid(), type: 'image', src, points: [{ x: 100, y: 100 }], w: 80, h: 80 };
  const b = { id: uid(), type: 'image', src, points: [{ x: 300, y: 100 }], w: 80, h: 80,
              sol: { v: 1, src, css: { w: 10, h: 10 } } };
  B.objects.push(a, b); saveDB(); scheduleRedraw();
}"""


def main():
    exe = os.environ.get("PW_CHROMIUM") or None
    with local_server(), sync_playwright() as p:
        browser = p.chromium.launch(executable_path=exe)
        ctx = browser.new_context(viewport={"width": 1280, "height": 800})
        # «бакет»: любая картинка по ссылке — наш PNG, с разрешением CORS
        ctx.route("http://localhost:9001/fakestore/**", lambda r: r.fulfill(
            status=200, body=PNG, headers={"Content-Type": "image/png", "Access-Control-Allow-Origin": "*"}))
        page = ctx.new_page()
        errors = []
        page.on("pageerror", lambda e: errors.append(str(e)))
        page.goto(f"{BASE}/boards.html")
        page.evaluate(BOOT_JS)
        page.wait_for_timeout(400)
        page.click("#blCreateBoard")
        page.wait_for_timeout(700)

        page.evaluate(STUB_JS, False)
        page.evaluate(ADD_JS, DATA)
        check(page.evaluate("() => ImageStore.pending()") == 3, "до переноса: три картинки текстом (две на доске, одна в разборе)")
        page.wait_for_function("() => ImageStore.pending() === 0", timeout=15000)
        st = page.evaluate("""() => { const im = B.objects.filter(o => o.type === 'image');
          return { srcs: im.map(o => o.src), sol: im[1].sol.src, up: window.__up.slice() }; }""")
        print("загружено:", st["up"])
        check(all(s.startswith("img:u1/") for s in st["srcs"]) and st["sol"] == st["srcs"][0],
              "картинки и разбор задания стали ключами img: в папке пользователя (адреса сервера в доске нет)")
        check(len(st["up"]) == 1 and st["up"][0].endswith(".png"), "одинаковая картинка залита один раз, имя — по содержимому")

        page.wait_for_timeout(800)
        saved = page.evaluate("async () => { const h = await idbGet('boarddata:' + B.id); return JSON.stringify(h.objects); }")
        check("data:image" not in saved and "img:u1/" in saved and "fakestore" not in saved, "в хранилище браузера ключ, а не base64 и не адрес")

        # полные адреса, записанные до №89б, переписываются в ключи
        page.evaluate("() => { B.objects.push({ id: uid(), type: 'image', src: IMG_BASE_URL + 'u1/old.png', points: [{ x: 500, y: 100 }], w: 40, h: 40 }); saveDB(); }")
        page.wait_for_function("() => B.objects.some(o => o.src === 'img:u1/old.png')", timeout=8000)
        check(True, "старый полный адрес переписан в ключ img:")

        page.evaluate("() => scheduleRedraw()")
        page.wait_for_timeout(400)
        tainted = page.evaluate("() => { try { document.getElementById('boardCv').toDataURL(); return false; } catch (e) { return String(e); } }")
        check(tainted is False, "холст не запачкан — экспорт PNG работает с картинками по ссылке")
        check(page.evaluate("() => { const o = B.objects.find(o => o.type === 'image'); const im = getImg(o.src); return im.complete && im.naturalWidth > 0; }"),
              "картинка по ссылке отрисована")

        # бакета нет — переносчик выключается, картинки остаются как были
        page.evaluate("() => backToList()")
        page.wait_for_timeout(400)
        page.click("#blCreateBoard")
        page.wait_for_timeout(700)
        page.evaluate(STUB_JS, True)
        other = page.evaluate("() => { const c = document.createElement('canvas'); c.width = c.height = 3; c.getContext('2d').fillRect(0, 0, 2, 2); return c.toDataURL(); }")
        page.evaluate(ADD_JS, other)
        page.wait_for_timeout(5000)
        check(page.evaluate("() => ImageStore.isOff() && ImageStore.pending() === 3"), "без бакета: переносчик выключился, картинки на месте текстом")

        check(not errors, "без ошибок на странице" + (": " + "; ".join(errors[:3]) if errors else ""))
        browser.close()
    print("\nИТОГ:", "ВСЁ ХОРОШО" if not fails else f"ПРОВАЛОВ {len(fails)}")
    sys.exit(1 if fails else 0)


if __name__ == "__main__":
    main()
