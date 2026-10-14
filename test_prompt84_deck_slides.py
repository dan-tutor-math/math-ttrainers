"""
Промпт №84: вид доски «Презентация» (deck-core.js, HANDOFF.md раздел 6б).

Проверяем:
  1. «Создать презентацию» в списке досок создаёт доску kind:'deck' с
     объектом deck и одним слайдом 16:9 (64×36 клеток), полоса листания видна
  2. «+ слайд» добавляет слайд после текущего и переходит на него
  3. Листание: PageUp/PageDown, Home/End, колесо (один жест — один слайд),
     стрелки по направлению ленты; в «Галерее» ←/→, а ↑/↓ не листают
  4. Штрих лежит в слоте своего слайда и на другом слайде не виден
  5. Инструменты доски работают на слайде: ручка, прямоугольник,
     выделение и перетаскивание, отмена
  6. Объект deck не ловится ни ластиком, ни выделением, не рисуется
  7. После перезагрузки презентация открывается на том же слайде
  8. Обычная доска не изменилась: полосы листания нет, колесо двигает полотно
"""
import os
import subprocess
import sys
import time
import contextlib
import http.client

from playwright.sync_api import sync_playwright

PORT = 8984
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


def check(cond, msg):
    print(("OK   " if cond else "FAIL ") + msg)
    if not cond:
        fails.append(msg)


def slide_no(page):
    return page.inner_text("#deckNo").strip()


def wait_no(page, want, timeout=2000):
    t0 = time.time()
    while time.time() - t0 < timeout / 1000:
        if slide_no(page) == want:
            return True
        page.wait_for_timeout(50)
    return False


def main():
    exe = os.environ.get("PW_CHROMIUM") or None
    with local_server(), sync_playwright() as p:
        browser = p.chromium.launch(executable_path=exe)
        ctx = browser.new_context(viewport={"width": 1280, "height": 800})
        page = ctx.new_page()
        errors = []
        page.on("pageerror", lambda e: errors.append(str(e)))
        page.goto(f"{BASE}/boards.html")
        page.evaluate(BOOT_JS)
        page.wait_for_selector("#blCreateDeck")

        # 1. создание
        page.click("#blCreateDeck")
        page.wait_for_function("() => typeof B !== 'undefined' && B && B.kind === 'deck' && boardActive")
        page.wait_for_timeout(300)
        info = page.evaluate("""() => {
          const d = B.objects.find(o => o.type === 'deck');
          return { n: d.slides.length, w: d.slides[0].w, h: d.slides[0].h, slot: d.slides[0].slot,
                   navHidden: document.getElementById('deckNav').hidden };
        }""")
        check(info["n"] == 1 and info["w"] == 64 and info["h"] == 36 and info["slot"] == 0,
              f"новая презентация: один слайд 64×36 в слоте 0 ({info})")
        check(not info["navHidden"], "полоса листания видна")
        check(slide_no(page) == "1 / 1", "счётчик 1 / 1")

        # 2. «+ слайд»
        page.click("#deckAdd")
        page.click("#deckAdd")
        check(wait_no(page, "3 / 3"), "после двух «+ слайд» стоим на 3 / 3")
        slots = page.evaluate("() => B.objects.find(o => o.type === 'deck').slides.map(s => s.slot)")
        check(slots == [0, 1, 2], f"слоты 0, 1, 2 ({slots})")

        # 4. штрих ручкой на слайде 3
        page.evaluate("() => { const b = document.querySelector('[data-tool=\"pen\"]'); if (b) b.click(); }")
        page.mouse.move(560, 380)
        page.mouse.down()
        for i in range(10):
            page.mouse.move(560 + i * 12, 380 + i * 4)
        page.mouse.up()
        page.wait_for_timeout(200)
        pen = page.evaluate("""() => {
          const o = B.objects.find(o => o.type === 'pen');
          if (!o) return null;
          const s = B.objects.find(x => x.type === 'deck').slides[2];
          const r = deckSlideRect(s);
          return { inSlot: o.points.every(p => p.y >= r.y && p.y <= r.y + r.h && p.x >= r.x && p.x <= r.x + r.w) };
        }""")
        check(pen is not None and pen["inSlot"], f"штрих ручкой лёг на слайд 3 ({pen})")

        # 3. клавиши
        page.keyboard.press("PageUp")
        check(wait_no(page, "2 / 3"), "PageUp → 2 / 3")
        hidden = page.evaluate("""() => {
          const o = B.objects.find(o => o.type === 'pen'), b = objectBBox(o);
          const vx0 = cam.x, vy0 = cam.y, vx1 = cam.x + cssW / cam.zoom, vy1 = cam.y + cssH / cam.zoom;
          return b.maxX < vx0 || b.minX > vx1 || b.maxY < vy0 || b.minY > vy1;
        }""")
        check(hidden, "штрих слайда 3 не виден на слайде 2")
        page.keyboard.press("PageDown")
        check(wait_no(page, "3 / 3"), "PageDown → 3 / 3")
        page.keyboard.press("Home")
        check(wait_no(page, "1 / 3"), "Home → 1 / 3")
        page.keyboard.press("End")
        check(wait_no(page, "3 / 3"), "End → 3 / 3")
        page.keyboard.press("ArrowUp")
        check(wait_no(page, "2 / 3"), "↑ в ленте → 2 / 3")
        page.keyboard.press("ArrowDown")
        check(wait_no(page, "3 / 3"), "↓ в ленте → 3 / 3")

        # колесо: серия событий одного жеста листает ровно один слайд. События
        # шлём из самой страницы с шагом 20 мс, как тачпад: mouse.wheel в
        # браузере без экрана ждёт кадра, а кадры при анимации слоя глубины
        # там идут медленно — паузы выходили больше 180 мс
        page.evaluate("""() => new Promise(res => {
          const cv = document.getElementById('boardCv'); let n = 0;
          const tick = () => {
            cv.dispatchEvent(new WheelEvent('wheel', { deltaY: -60, clientX: 640, clientY: 400, bubbles: true, cancelable: true }));
            if (++n < 6) setTimeout(tick, 20); else setTimeout(res, 400);
          };
          tick();
        })""")
        check(slide_no(page) == "2 / 3", f"жест колесом вверх — ровно один слайд ({slide_no(page)})")
        page.evaluate("""() => document.getElementById('boardCv').dispatchEvent(new WheelEvent('wheel', { deltaY: 120, clientX: 640, clientY: 400, bubbles: true, cancelable: true }))""")
        page.wait_for_timeout(400)
        check(slide_no(page) == "3 / 3", "колесо вниз → 3 / 3")

        # галерея: ←/→ листают, ↑/↓ — нет
        page.click("#deckFlowH")
        page.keyboard.press("ArrowLeft")
        check(wait_no(page, "2 / 3"), "← в галерее → 2 / 3")
        page.keyboard.press("ArrowDown")
        page.wait_for_timeout(200)
        check(slide_no(page) == "2 / 3", "↓ в галерее не листает")
        page.keyboard.press("ArrowRight")
        check(wait_no(page, "3 / 3"), "→ в галерее → 3 / 3")
        page.click("#deckFlowV")

        # 5. прямоугольник, выделение, перетаскивание, отмена
        page.evaluate("() => document.querySelector('[data-tool=\"quad\"]').click()")
        page.mouse.move(420, 300)
        page.mouse.down()
        page.mouse.move(470, 330)
        page.mouse.move(520, 360)
        page.mouse.up()
        page.wait_for_timeout(200)
        rect = page.evaluate("() => { const o = B.objects.find(o => o.type === 'quad'); return o ? o.points.map(p => ({x: p.x, y: p.y})) : null; }")
        check(rect is not None, "прямоугольник нарисован на слайде")
        if rect:
            page.evaluate("() => document.querySelector('[data-tool=\"select\"]').click()")
            # точка на левой стороне прямоугольника — в экранных координатах
            # (прямоугольник прилипает к сетке, поэтому не там, где тянули)
            edge = page.evaluate("""() => {
              const b = objectBBox(B.objects.find(o => o.type === 'quad'));
              const s = worldToScreen({ x: b.minX, y: (b.minY + b.maxY) / 2 });
              const r = document.getElementById('boardCv').getBoundingClientRect();
              return { x: s.x + r.left, y: s.y + r.top };
            }""")
            page.mouse.move(edge["x"], edge["y"])
            page.mouse.down()
            page.mouse.move(edge["x"] + 30, edge["y"] + 10)
            page.mouse.move(edge["x"] + 60, edge["y"] + 20)
            page.mouse.up()
            page.wait_for_timeout(200)
            moved = page.evaluate("() => B.objects.find(o => o.type === 'quad').points[0].x")
            check(abs(moved - rect[0]["x"]) > 10, f"прямоугольник перетащили ({rect[0]['x']:.0f} → {moved:.0f})")
            page.keyboard.press("Escape")
            page.mouse.click(1100, 700)
            page.keyboard.press("Control+z")
            page.wait_for_timeout(200)
            back = page.evaluate("() => { const o = B.objects.find(o => o.type === 'quad'); return o ? o.points[0].x : -1; }")
            check(abs(back - rect[0]["x"]) < 1, f"отмена вернула прямоугольник ({back:.0f})")
            check(slide_no(page) == "3 / 3", "после отмены остались на том же слайде")

        # 6. объект deck не ловится и не рисуется
        svc = page.evaluate("""() => {
          const d = B.objects.find(o => o.type === 'deck');
          return { hit: hitTestObject(d, d.points[0], 1000), n: B.objects.filter(o => o.type === 'deck').length };
        }""")
        check(svc["hit"] is False and svc["n"] == 1, f"объект deck не ловится ({svc})")

        # 7. перезагрузка — тот же слайд
        page.keyboard.press("PageUp")
        check(wait_no(page, "2 / 3"), "перед перезагрузкой на 2 / 3")
        page.wait_for_timeout(1200)
        page.reload()
        page.evaluate(BOOT_JS)
        page.wait_for_function("() => typeof B !== 'undefined' && B && B.kind === 'deck' && boardActive", timeout=5000)
        page.wait_for_timeout(500)
        check(slide_no(page) == "2 / 3", f"после перезагрузки снова 2 / 3 ({slide_no(page)})")
        n = page.evaluate("() => B.objects.filter(o => o.type === 'pen').length")
        check(n == 1, "штрих сохранился")

        # 8. обычная доска как раньше
        page.evaluate("() => document.getElementById('bdBack').click()")
        page.wait_for_function("() => document.getElementById('screenList').style.display === 'flex'")
        page.click("#blCreateBoard")
        page.wait_for_function("() => B && !B.kind && boardActive")
        page.wait_for_timeout(300)
        check(page.evaluate("() => document.getElementById('deckNav').hidden"), "у обычной доски полосы листания нет")
        y0 = page.evaluate("() => cam.y")
        page.mouse.move(640, 400)
        page.mouse.wheel(0, 200)
        page.wait_for_timeout(200)
        y1 = page.evaluate("() => cam.y")
        check(y1 > y0, "колесо на обычной доске двигает полотно")

        check(not errors, f"нет ошибок на странице ({errors[:3]})")
        browser.close()

    if fails:
        print(f"\nПРОВАЛЕНО: {len(fails)}")
        sys.exit(1)
    print("\nВСЁ ПРОШЛО")


if __name__ == "__main__":
    main()
