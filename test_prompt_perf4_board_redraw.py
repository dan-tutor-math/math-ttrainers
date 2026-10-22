"""
Скорость №4: доска (trainer-board.js) перерисовывает холсты только когда
что-то изменилось, а не 60 раз в секунду.

Главная опасность — запись есть в данных, а на экране её нет. Поэтому
изменения вносим так, как их вносит «забывчивый» код: прямо в массивы
штрихов, БЕЗ вызова перерисовки, — и проверяем, что доска сама это заметила.

Что проверяем (ОГЭ №7 и «Сложение» — с несколькими заданиями и со столбиком):
  - в простое холсты не перерисовываются (раньше — каждый кадр);
  - штрих, дописанный прямо в массив фона и листа без вызова перерисовки,
    появляется на экране; массив, заменённый целиком (очистка, снимок
    собеседника), — тоже;
  - «линия» мышью: вторая точка меняется на месте, без новой точки, —
    на экране линия идёт за мышью, старое положение стирается;
  - прокрутка: записи фона едут вместе со страницей;
  - смена темы перекрашивает клетку фона;
  - смена размера окна (она стирает холст) — записи на месте.

Совместный режим живьём (запись учителя у ученика через Supabase) отсюда
не проверить: websocket до Supabase из песочницы закрыт. Это — руками.

Запуск: python3 test_prompt_perf4_board_redraw.py (сервер поднимается сам).
"""
import contextlib
import http.client
import os
import subprocess
import sys
import time

from playwright.sync_api import sync_playwright

HERE = os.path.dirname(os.path.abspath(__file__))
PORT = 8984
BASE = f"http://127.0.0.1:{PORT}"

fails = []


def check(cond, msg):
    print(("[OK]   " if cond else "[FAIL] ") + msg)
    if not cond:
        fails.append(msg)


@contextlib.contextmanager
def local_server():
    proc = subprocess.Popen([sys.executable, "-m", "http.server", str(PORT)],
                            cwd=HERE, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    try:
        for _ in range(50):
            try:
                c = http.client.HTTPConnection("127.0.0.1", PORT, timeout=0.2)
                c.request("GET", "/index.html")
                c.getresponse()
                break
            except Exception:
                time.sleep(0.1)
        yield
    finally:
        proc.terminate()
        proc.wait(timeout=5)


# цвет пикселя видимого холста фона в точке окна (x, y)
PX_BG = """([x, y]) => { const c = document.getElementById('boardCanvasBg');
    const k = c.width / c.getBoundingClientRect().width;
    return Array.from(c.getContext('2d').getImageData(Math.round(x * k), Math.round(y * k), 1, 1).data); }"""
RED = lambda p: p[0] > 200 and p[1] < 80 and p[2] < 80 and p[3] > 200


def frames(pg, n=3):
    pg.evaluate(f"() => new Promise(r => {{ let i = 0; const f = () => (++i >= {n}) ? r() : requestAnimationFrame(f); requestAnimationFrame(f); }})")


def run():
    with local_server(), sync_playwright() as pw:
        b = pw.chromium.launch()
        for slug in ["oge7", "addition"]:
            ctx = b.new_context(viewport={"width": 1200, "height": 800})
            pg = ctx.new_page()
            errors = []
            pg.on("pageerror", lambda e: errors.append(str(e)))
            pg.route("https://**/*", lambda r: r.abort())
            pg.goto(f"{BASE}/{slug}.html")
            pg.wait_for_function("() => !!window.__boardGetState")
            pg.wait_for_timeout(800)

            # ── простой ──
            idle = pg.evaluate("""() => new Promise(r => {
                let n = 0; const o = CanvasRenderingContext2D.prototype.clearRect;
                CanvasRenderingContext2D.prototype.clearRect = function (...a) { n++; return o.apply(this, a); };
                setTimeout(() => { CanvasRenderingContext2D.prototype.clearRect = o; r(n); }, 2000);
            })""")
            check(idle <= 2, f"{slug}: в простое 2 с холсты не перерисовываются (стираний: {idle}, раньше ~240)")

            # ── штрих прямо в массив фона, без вызова перерисовки ──
            # мировые координаты фона = координаты документа при масштабе 1
            pg.evaluate("""() => { const st = window.__boardGetState();
                st.bgStrokes.push({ tool: 'pen', color: '#ff0000', width: 14,
                    points: [{ x: 40, y: 300 }, { x: 160, y: 300 }] }); }""")
            frames(pg)
            check(RED(pg.evaluate(PX_BG, [100, 300])),
                  f"{slug}: штрих фона, дописанный без вызова перерисовки, виден")

            # ── прокрутка: запись фона едет со страницей ──
            can_scroll = pg.evaluate("() => document.documentElement.scrollHeight > innerHeight + 120")
            if can_scroll:
                pg.evaluate("() => window.scrollTo(0, 100)")
                frames(pg)
                check(RED(pg.evaluate(PX_BG, [100, 200])) and not RED(pg.evaluate(PX_BG, [100, 300])),
                      f"{slug}: после прокрутки на 100 запись фона сдвинулась вверх на 100")
                pg.evaluate("() => window.scrollTo(0, 0)")
                frames(pg)

            # ── смена размера окна стирает холст — запись должна вернуться ──
            pg.set_viewport_size({"width": 1100, "height": 760})
            frames(pg, 4)
            check(RED(pg.evaluate(PX_BG, [100, 300])), f"{slug}: после смены размера окна запись фона на месте")
            pg.set_viewport_size({"width": 1200, "height": 800})
            frames(pg, 4)

            # ── тема: клетка фона перекрашивается ──
            grid = pg.evaluate("""() => { const c = document.getElementById('boardCanvasBg');
                const x = c.getContext('2d'); const d = x.getImageData(0, 0, c.width, Math.min(c.height, 400)).data;
                // самый частый непрозрачный цвет — это клетка
                const cnt = {}; for (let i = 0; i < d.length; i += 4) if (d[i+3] > 0 && !(d[i] > 200 && d[i+1] < 80)) {
                    const k = d[i] + ',' + d[i+1] + ',' + d[i+2]; cnt[k] = (cnt[k] || 0) + 1; }
                return Object.entries(cnt).sort((a, b) => b[1] - a[1])[0]; }""")
            dark = "light" if pg.evaluate("document.documentElement.getAttribute('data-theme')") == "dark" else "dark"
            pg.evaluate(f"() => document.documentElement.setAttribute('data-theme', '{dark}')")
            frames(pg)
            grid2 = pg.evaluate("""() => { const c = document.getElementById('boardCanvasBg');
                const x = c.getContext('2d'); const d = x.getImageData(0, 0, c.width, Math.min(c.height, 400)).data;
                const cnt = {}; for (let i = 0; i < d.length; i += 4) if (d[i+3] > 0 && !(d[i] > 200 && d[i+1] < 80)) {
                    const k = d[i] + ',' + d[i+1] + ',' + d[i+2]; cnt[k] = (cnt[k] || 0) + 1; }
                return Object.entries(cnt).sort((a, b) => b[1] - a[1])[0]; }""")
            check(bool(grid) and bool(grid2) and grid[0] != grid2[0],
                  f"{slug}: смена темы перекрасила клетку фона ({grid and grid[0]} → {grid2 and grid2[0]})")
            # тему возвращаем: в тёмной клетка тёмная и спутала бы проверку «линии» ниже
            pg.evaluate(f"() => document.documentElement.setAttribute('data-theme', '{'light' if dark == 'dark' else 'dark'}')")
            frames(pg)

            # ── массив заменён целиком (полная очистка у собеседника) ──
            pg.evaluate("""() => { const st = window.__boardGetState();
                window.__boardApplyState({ __boardClear: (st.__boardClear || 0) + 1 }); }""")
            frames(pg)
            check(not RED(pg.evaluate(PX_BG, [100, 300])), f"{slug}: после очистки собеседником запись фона исчезла")

            # ── лист (если на странице есть видимый лист с холстом) ──
            sheet = pg.evaluate("""() => { const b = window.__boardCanvasEl(); const r = b.sheet.rect();
                return r.width > 60 && r.height > 60 ? [r.left, r.top, r.width, r.height] : null; }""")
            if sheet:
                pg.evaluate("""() => { const st = window.__boardGetState();
                    st.strokes.push({ tool: 'pen', color: '#ff0000', width: 14,
                        points: [{ x: 10, y: 30 }, { x: 50, y: 30 }] }); }""")
                frames(pg)
                px = pg.evaluate("""() => { const b = window.__boardCanvasEl(); const c = b.sheet.inkCanvas;
                    const k = c.width / b.sheet.rect().width;
                    return Array.from(c.getContext('2d').getImageData(Math.round(30 * k), Math.round(30 * k), 1, 1).data); }""")
                check(RED(px), f"{slug}: штрих листа, дописанный без вызова перерисовки, виден")
            else:
                print(f"[--]   {slug}: видимого листа нет — проверка листа пропущена")

            # ── «линия» мышью: вторая точка меняется на месте ──
            if pg.evaluate("document.documentElement.getAttribute('data-board') !== 'on'"):
                pg.click("#boardVisibilityToggle")
            pg.click('.board-tool-btn[data-tool="line"]')
            # свободное поле фона ищем честно: точка должна приходиться на сам холст
            free = pg.evaluate("""() => {
                const ok = (x, y) => { const e = document.elementFromPoint(x, y); return e && e.id === 'boardCanvasBg'; };
                for (let y = innerHeight - 30; y > 160; y -= 20) for (let x = 20; x < innerWidth - 160; x += 20)
                    if ([[0,0],[70,-70],[140,0],[35,-35],[105,-35],[70,0]].every(([dx,dy]) => ok(x+dx, y+dy))) return [x, y];
                return null; }""")
            ink_at = """([x, y]) => { const c = document.getElementById('boardCanvasBg');
                const k = c.width / c.getBoundingClientRect().width; const d = c.getContext('2d')
                  .getImageData(Math.round(x * k) - 3, Math.round(y * k) - 3, 6, 6).data;
                let ink = 0; for (let i = 0; i < d.length; i += 4) if (d[i+3] > 0 && d[i] < 120 && d[i+1] < 120 && d[i+2] < 120) ink++;
                return ink; }"""
            # не нашлось целиком свободного места (на экране всплывающая панель) —
            # берём левое поле: итог всё равно проверяется по чернилам на холсте
            x0, y0 = free if free else (20, 700)
            pg.mouse.move(x0, y0)
            pg.mouse.down()
            pg.mouse.move(x0 + 70, y0 - 70, steps=4)
            frames(pg)
            mid = pg.evaluate(ink_at, [x0 + 35, y0 - 35])
            pg.mouse.move(x0 + 140, y0, steps=4)
            frames(pg)
            mid2 = pg.evaluate(ink_at, [x0 + 35, y0 - 35])
            end = pg.evaluate(ink_at, [x0 + 105, y0])
            pg.mouse.up()
            check(mid > 0 and mid2 == 0 and end > 0,
                  f"{slug}: «линия» идёт за мышью, старое положение стёрто (чернил в старом месте {mid} → {mid2}, в новом {end})")
            check(not errors, f"{slug}: без ошибок JS {errors[:1]}")
            ctx.close()
        b.close()
    print()
    if fails:
        print("ПРОВАЛЫ:", len(fails))
        sys.exit(1)
    print("ИТОГ: всё прошло")


if __name__ == "__main__":
    run()
