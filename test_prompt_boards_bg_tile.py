"""
Резкая синяя полоса при прокрутке списка досок вниз.

У html и body стоит height:100%, поэтому фон страницы — «кадр» высотой с
окно, и без background-repeat:no-repeat браузер повторял его плиткой: ниже
первого экрана снова начиналось синее свечение с резкой границей.

Проверяем в светлой и тёмной теме: страница длиннее трёх экранов, снимаем
её целиком и сравниваем пиксель левого края чуть ниже первого экрана (там
раньше начиналась вторая плитка со свечением) с пикселем далеко внизу —
должен быть один и тот же ровный цвет фона.
"""
import base64
import subprocess
import sys
import contextlib
import http.client

from playwright.sync_api import sync_playwright

PORT = 8981
BASE = f"http://127.0.0.1:{PORT}"
W, H = 1200, 700


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
            except OSError:
                import time
                time.sleep(0.1)
        yield
    finally:
        proc.terminate()


# пиксели снимка читаем в самой странице через canvas — Pillow не нужен
PIXELS_JS = """async ([png, pts]) => {
  const img = new Image();
  img.src = 'data:image/png;base64,' + png;
  await img.decode();
  const c = document.createElement('canvas');
  c.width = img.width; c.height = img.height;
  const ctx = c.getContext('2d');
  ctx.drawImage(img, 0, 0);
  return pts.map(([x, y]) => Array.from(ctx.getImageData(x, y, 1, 1).data.slice(0, 3)));
}"""


def check(page, theme):
    page.goto(f"{BASE}/boards.html")
    page.evaluate("t => { document.documentElement.setAttribute('data-theme', t); }", theme)
    # длинная страница, как при большом числе досок
    page.evaluate("""() => {
      const d = document.createElement('div');
      d.style.height = '3000px';
      document.body.appendChild(d);
    }""")
    page.wait_for_timeout(300)
    rep = page.evaluate("getComputedStyle(document.body).backgroundRepeat")
    assert "no-repeat" in rep, f"{theme}: background-repeat = {rep}"
    png = base64.b64encode(page.screenshot(full_page=True, animations="disabled")).decode()
    near_seam, far = page.evaluate(PIXELS_JS, [png, [[6, H + 8], [6, H * 3 + 200]]])
    diff = max(abs(a - b) for a, b in zip(near_seam, far))
    assert diff <= 3, f"{theme}: под первым экраном {near_seam}, далеко внизу {far} — фон повторяется плиткой"
    print(f"ok {theme}: {near_seam} == {far}")


def main():
    with local_server(), sync_playwright() as p:
        b = p.chromium.launch()
        page = b.new_page(viewport={"width": W, "height": H})
        for theme in ("light", "dark"):
            check(page, theme)
        b.close()
    print("PASS")


if __name__ == "__main__":
    main()
