"""
Промпт №46: рендер доски (render() в boards-core.js) раньше на КАЖДЫЙ кадр
перебирал ВСЕ объекты доски и вызывал renderObject() для каждого — включая
те, что лежат на других страницах, далеко за пределами экрана. На доске из
десятков рисунков (как у пользователя) это означало сотни лишних отрисовок
на каждое движение пера во время рисования — отсюда сильная нагрузка на
процессор именно в момент, когда пишешь на доске.

Проверяем: после добавления отсечения по видимой области (viewport culling)
на кадр реально вызывается renderObject() только для объектов, чей
bounding box попадает в экран (+небольшой запас), а объекты далеко за
кадром не рендерятся вообще.

Нужен локальный http-сервер (см. HANDOFF, раздел 9) — поднимается сам,
как и в остальных test_prompt*.py.
"""
import subprocess
import sys
import time
import contextlib
import http.client

from playwright.sync_api import sync_playwright

PORT = 8964
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
}
"""


def boot_page(page):
    page.goto(f"{BASE}/boards.html")
    page.evaluate(BOOT_JS)
    page.wait_for_function("window.getDB && Array.isArray(window.getDB().boards)")


def near_obj(i):
    # заведомо внутри экрана при view = {x:0,y:0,zoom:1}
    return {"id": f"near{i}", "type": "pen", "points": [{"x": 40 + i, "y": 40 + i}, {"x": 45 + i, "y": 45 + i}]}



# доска — сетка 200×200 листов по 76×54 клетки, клетка 24px (см. SHEET_COLS/
# SHEET_ROWS в boards-core.js) — берём точку на дальнем листе (col=150,row=150),
# она далеко от начала координат, но ещё внутри общих границ полотна, иначе
# clampCam() в самом коде (камера не может уйти за пределы холста) не даст
# камере вообще туда добраться и проверка ничего не покажет
FAR_X, FAR_Y = 150 * 76 * 24, 150 * 54 * 24


def far_obj(i):
    return {"id": f"far{i}", "type": "pen", "points": [{"x": FAR_X + i, "y": FAR_Y + i}, {"x": FAR_X + 5 + i, "y": FAR_Y + 5 + i}]}


def run():
    failures = []

    def check(name, cond):
        status = "OK" if cond else "FAIL"
        print(f"[{status}] {name}")
        if not cond:
            failures.append(name)

    n_near, n_far = 5, 500

    with local_server(), sync_playwright() as p:
        browser = p.chromium.launch()
        context = browser.new_context()
        page = context.new_page()
        boot_page(page)

        # кладём тестовую доску прямо в память приложения (DB.boards — те же
        # объекты, что видит B после openBoard) и открываем её с известной
        # камерой (view), чтобы точно знать, что попадает в кадр
        page.evaluate(
            """([nearCount, farCount, near, far]) => {
                const board = {
                  id: 'cullTest', name: 'Тест отсечения', folderId: null,
                  createdAt: 1000, updatedAt: 1000, lastOpenedAt: null, rev: 1,
                  cellSize: 24, sheetCols: 76, sheetRows: 54, pageOrder: 'h',
                  objects: near.concat(far), recentColors: [], colorUsage: {},
                  imageLib: [], view: { x: 0, y: 0, zoom: 1 },
                };
                window.getDB().boards.push(board);
                window.__renderCalls = 0;
                const orig = window.renderObject;
                window.renderObject = function(c, o, camv){ window.__renderCalls++; return orig(c, o, camv); };
                window.openBoard('cullTest');
            }""",
            [n_near, n_far, [near_obj(i) for i in range(n_near)], [far_obj(i) for i in range(n_far)]],
        )
        # openBoard планирует resizeCanvas()+scheduleRedraw() через requestAnimationFrame —
        # даём этому осесть, потом берём один «чистый» кадр отдельно
        page.wait_for_timeout(300)
        page.evaluate("window.__renderCalls = 0; window.boardsRedraw();")
        page.wait_for_timeout(100)

        calls_after_open = page.evaluate("window.__renderCalls")
        check(
            f"при открытии доски рендерятся только видимые объекты ({calls_after_open} из {n_near + n_far}, ожидали {n_near})",
            calls_after_open == n_near,
        )

        # ещё один, «чистый» кадр — на случай, если открытие вызывает рендер
        # несколько раз, проверяем именно устоявшееся поведение одного кадра
        page.evaluate("window.__renderCalls = 0; window.boardsRedraw();")
        page.wait_for_timeout(100)
        calls_one_frame = page.evaluate("window.__renderCalls")
        check(
            f"один обычный кадр редактирования тоже рисует только видимое ({n_near} объектов, не {n_near + n_far})",
            calls_one_frame == n_near,
        )

        # сдвигаем камеру точно на «дальние» объекты — они должны появиться,
        # а «ближние» пропасть: отсечение должно быть по РЕАЛЬНОМУ положению
        # камеры, а не просто «рисовать первые N». camera (cam) — внутренняя
        # переменная, не на window; проще заново открыть доску — openBoard
        # читает B.view и выставляет по нему камеру (см. FAR_X/FAR_Y выше —
        # координаты внутри общих границ полотна, чтобы clampCam их не срезал)
        page.evaluate(
            f"""() => {{
                window.getCurrentBoard().view = {{ x: {FAR_X} - 20, y: {FAR_Y} - 20, zoom: 1 }};
                window.__renderCalls = 0;
                window.openBoard('cullTest');
            }}"""
        )
        page.wait_for_timeout(300)
        # пока камера «доезжает» до новой позиции, могло проскочить несколько
        # кадров со старой и новой камерой вперемешку (это нормально и не
        # относится к отсечению) — берём один кадр уже после того, как всё
        # устаканилось, как и в предыдущей проверке
        page.evaluate("window.__renderCalls = 0; window.boardsRedraw();")
        page.wait_for_timeout(100)
        calls_far_view = page.evaluate("window.__renderCalls")
        check(
            f"после переноса камеры к дальним объектам рисуются они, а не ближние ({calls_far_view} из {n_near + n_far}, ожидали {n_far})",
            calls_far_view == n_far,
        )

        context.close()
        browser.close()

    print()
    if failures:
        print(f"ИТОГ: {len(failures)} проверок провалено — {failures}")
    else:
        print("ИТОГ: всё прошло")
    return not failures


if __name__ == "__main__":
    ok = run()
    sys.exit(0 if ok else 1)
