"""
Замер скорости приложения досок на БОЛЬШОЙ доске («„скорость досок“»).

Зачем: доски тормозили на больших досках даже на Mac mini M4 — при письме,
стирании, прокрутке и зуме. Ученики сидят на слабых ноутбуках, поэтому
замер идёт с замедлением процессора в 4 раза (Emulation.setCPUThrottlingRate
через Chrome DevTools Protocol) — так M4 изображает слабую машину.

Тестовая доска генерируется прямо в странице, детерминированно (свой
генератор случайных чисел с зерном): ~5000 штрихов по 50–300 точек,
несколько десятков текстов и фигур, 15 картинок, всё разбросано по
площади 6×6 листов. Отдельно два ряда по 20 вертикальных штрихов — по ним
ведут ластик «Объект» и «Область».

Сценарии (ввод — настоящий, через CDP Input.*, как от мыши):
  pen_long   — один длинный штрих пером (~3 с);
  pen_30     — 30 штрихов подряд (видно, растёт ли цена с каждым штрихом);
  erase_obj  — ластик «Объект» одним махом через 20 штрихов;
  erase_area — ластик «Область» через другие 20 штрихов;
  scroll     — прокрутка колесом/тачпадом на несколько экранов;
  zoom_wheel — зум колесом с Ctrl в обе стороны;
  zoom_pinch — зум щипком тачпада (Ctrl+колесо мелкими шагами) в обе стороны.

Что меряем: время кадра (промежутки между requestAnimationFrame — медиана
и 95-й перцентиль), долю времени скриптов (Performance.getMetrics), и
сколько миллисекунд на одно действие уходит на pushUndo, saveDB, render
(кадр доски) и запись в IndexedDB (синхронная часть idbPut — там
сериализация). Обёртки ставятся снаружи на глобальные функции; если
функции нет (после переделок) — просто 0.

Запуск:
  python3 bench_boards_perf.py                 — таблица в консоль
  python3 bench_boards_perf.py --out a.json    — и сохранить цифры
  python3 bench_boards_perf.py --cmp a.json b.json — таблица «до / после»
  python3 bench_boards_perf.py --headed        — в настоящем окне Chrome (с видеокартой)
"""
import argparse
import asyncio
import contextlib
import http.client
import json
import math
import os
import random
import statistics
import subprocess
import sys
import time

HERE = os.path.dirname(os.path.abspath(__file__))
PORT = 8771
BASE = f"http://127.0.0.1:{PORT}"
VIEW_W, VIEW_H, DPR = 1440, 900, 2
THROTTLE = 4


@contextlib.contextmanager
def local_server():
    proc = subprocess.Popen([sys.executable, "-m", "http.server", str(PORT)], cwd=HERE,
                            stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    try:
        for _ in range(80):
            try:
                c = http.client.HTTPConnection("127.0.0.1", PORT, timeout=0.2)
                c.request("GET", "/boards.html"); c.getresponse(); break
            except Exception:
                time.sleep(0.1)
        yield
    finally:
        proc.terminate(); proc.wait(timeout=5)


# Генератор большой доски — в странице, чтобы не гонять десятки мегабайт
# JSON через playwright. Кладёт индекс и boarddata:<id> прямо в IndexedDB
GEN_JS = r"""
async () => {
  let s = 12345;
  const rnd = () => { s = (s * 1103515245 + 12345) & 0x7fffffff; return s / 0x7fffffff; };
  const SW = 76 * 24, SH = 54 * 24;              // лист по умолчанию
  const midCol = 100, midRow = 100;
  const X0 = (midCol - 2.5) * SW, Y0 = (midRow - 2.5) * SH, AW = 6 * SW, AH = 6 * SH;
  const cols = ['--pencil', '--accent', '--red', '--green', '--blue'];
  const objs = [];
  let id = 0;
  for (let i = 0; i < 5000; i++){
    const n = 50 + Math.floor(rnd() * 251);
    let x = X0 + rnd() * AW, y = Y0 + rnd() * AH;
    let a = rnd() * Math.PI * 2;
    const pts = [];
    for (let k = 0; k < n; k++){
      a += (rnd() - 0.5) * 0.6;
      x += Math.cos(a) * 2.2; y += Math.sin(a) * 2.2;
      pts.push({ x: Math.round(x * 100) / 100, y: Math.round(y * 100) / 100 });
    }
    objs.push({ id: 'g' + (id++), type: 'pen', color: cols[i % cols.length], width: 2 + (i % 3), dash: false, points: pts });
  }
  for (let i = 0; i < 40; i++){
    const x = X0 + rnd() * AW, y = Y0 + rnd() * AH;
    objs.push({ id: 't' + i, type: 'text', color: '--pencil', content: 'Текст номер ' + i + '\nвторая строка', fontSize: 22, points: [{ x, y }], w: 180, h: 55 });
  }
  for (let i = 0; i < 40; i++){
    const x = X0 + rnd() * AW, y = Y0 + rnd() * AH, k = i % 4;
    const base = { id: 'f' + i, color: cols[i % 5], width: 2, dash: i % 7 === 0, fill: false };
    if (k === 0) objs.push(Object.assign(base, { type: 'line', points: [{ x, y }, { x: x + 200, y: y + 80 }] }));
    if (k === 1) objs.push(Object.assign(base, { type: 'ellipse', points: [{ x, y }], rx: 90, ry: 50 }));
    if (k === 2) objs.push(Object.assign(base, { type: 'circle', points: [{ x, y }], r: 70 }));
    if (k === 3) objs.push(Object.assign(base, { type: 'quad', rect: true, points: [{ x, y }, { x: x + 150, y }, { x: x + 150, y: y + 100 }, { x, y: y + 100 }] }));
  }
  // картинки: шум + надпись, чтобы PNG весил как настоящий скриншот
  const imgs = [];
  for (let i = 0; i < 15; i++){
    const cv = document.createElement('canvas'); cv.width = 480; cv.height = 320;
    const c = cv.getContext('2d');
    const im = c.createImageData(480, 320);
    for (let p = 0; p < im.data.length; p += 4){ im.data[p] = rnd() * 255; im.data[p + 1] = 200; im.data[p + 2] = (p / 4) % 255; im.data[p + 3] = 255; }
    c.putImageData(im, 0, 0);
    c.fillStyle = '#000'; c.font = '40px sans-serif'; c.fillText('Картинка ' + i, 40, 160);
    imgs.push(cv.toDataURL('image/png'));
  }
  imgs.forEach((src, i) => {
    const x = X0 + rnd() * AW, y = Y0 + rnd() * AH;
    objs.push({ id: 'im' + i, type: 'image', src, points: [{ x, y }], w: 360, h: 240, natW: 480, natH: 320 });
  });
  // два ряда по 20 штрихов в стартовом виде — по ним ведут ластик
  const cx = (midCol + 0.5) * SW, cy = (midRow + 0.5) * SH;
  for (const [pref, dy] of [['eo', -200], ['ea', 200]]){
    for (let i = 0; i < 20; i++){
      const x = cx - 600 + i * 60, pts = [];
      for (let k = 0; k < 80; k++) pts.push({ x: x + Math.sin(k / 6) * 6, y: cy + dy - 120 + k * 3 });
      objs.push({ id: pref + i, type: 'pen', color: '--pencil', width: 3, dash: false, points: pts });
    }
  }
  const board = {
    id: 'big', name: 'Большая доска', folderId: null, createdAt: 1000, updatedAt: 1000, lastOpenedAt: null, rev: 1,
    cellSize: 24, sheetCols: 76, sheetRows: 54, pageOrder: 'h', recentColors: [], colorUsage: {},
    view: { x: cx - VW / 2 / Z, y: cy - VH / 2 / Z, zoom: Z, cx, cy, at: Date.now() },
  };
  await new Promise((resolve, reject) => {
    const req = indexedDB.open('ogeBoardsDB', 1);
    req.onupgradeneeded = () => { if (!req.result.objectStoreNames.contains('state')) req.result.createObjectStore('state'); };
    req.onsuccess = () => {
      const tx = req.result.transaction('state', 'readwrite');
      const st = tx.objectStore('state');
      st.put({ __v: 2, folders: [], boards: [board], deleted: [], sortMode: 'my' }, 'db');
      st.put({ objects: objs, imageLib: [] }, 'boarddata:big');
      tx.oncomplete = () => { req.result.close(); resolve(); };
      tx.onerror = () => reject(tx.error);
    };
    req.onerror = () => reject(req.error);
  });
  return { objects: objs.length, cx, cy };
}
"""

# Обёртки-счётчики. Ставятся на window.* после загрузки: внутренние вызовы в
# boards-core.js идут через глобальные имена и тоже попадают в обёртку
INSTR_JS = r"""
() => {
  const P = window.__perf = { t: {}, n: {}, frames: [], rec: false };
  const wrap = (name) => {
    const f = window[name];
    if (typeof f !== 'function' || f.__wrapped) return;
    const w = function(){
      const t0 = performance.now();
      try { return f.apply(this, arguments); }
      finally { if (P.rec){ P.t[name] = (P.t[name] || 0) + performance.now() - t0; P.n[name] = (P.n[name] || 0) + 1; } }
    };
    w.__wrapped = true;
    window[name] = w;
  };
  ['pushUndo', 'saveDB', 'render', 'renderScreen', 'idbSaveDB', 'eraseAt', 'eraseAreaAlong'].forEach(wrap);
  // запись в IndexedDB: put() идёт внутри idbRun уже асинхронно, поэтому
  // обёртка idbPut ничего не намерила бы. Сериализация (structured clone)
  // всей доски — синхронно в самом put(): его и меряем
  const op = IDBObjectStore.prototype.put;
  IDBObjectStore.prototype.put = function(){
    const t0 = performance.now();
    try { return op.apply(this, arguments); }
    finally { if (P.rec){ P.t.idbPut = (P.t.idbPut || 0) + performance.now() - t0; P.n.idbPut = (P.n.idbPut || 0) + 1; } }
  };
  // кадр доски нарисован — отмечаем: pframes — промежутки только между
  // кадрами, где доска правда перерисовалась (без простоя между событиями)
  ['render', 'renderScreen'].forEach(name => {
    const f = window[name]; if (typeof f !== 'function') return;
    const w = function(){ P.painted = true; return f.apply(this, arguments); };
    w.__wrapped = true; window[name] = w;
  });
  let last = performance.now(), lastPaint = 0;
  const loop = (t) => {
    if (P.rec){ P.frames.push(t - last); if (P.painted){ if (lastPaint) P.pframes.push(t - lastPaint); lastPaint = t; } }
    P.painted = false; last = t; requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);
  window.__perfStart = () => { P.t = {}; P.n = {}; P.frames = []; P.pframes = []; P.rec = true; last = performance.now(); lastPaint = 0; };
  window.__perfStop = () => { P.rec = false; return { t: P.t, n: P.n, frames: P.frames, pframes: P.pframes }; };
}
"""


def pct(arr, q):
    if not arr:
        return 0.0
    a = sorted(arr)
    i = min(len(a) - 1, max(0, int(math.ceil(q * len(a))) - 1))
    return a[i]


class Bench:
    """Ввод — асинхронно: события летят ровно с заданной частотой и не ждут
    подтверждения от страницы, как от настоящей мыши. Синхронный CDP ждал
    ответа на каждое событие, ввод шёл реже 60 Гц, и кадры «разбавлялись»
    простоем — медиана выходила лучше настоящей"""
    def __init__(self, page, cdp):
        self.page, self.cdp = page, cdp
        self.pending = []

    async def metrics(self):
        m = {x["name"]: x["value"] for x in (await self.cdp.send("Performance.getMetrics"))["metrics"]}
        return m.get("ScriptDuration", 0.0), m.get("TaskDuration", 0.0)

    def fire(self, params):
        self.pending.append(asyncio.ensure_future(self.cdp.send("Input.dispatchMouseEvent", params)))

    def mouse(self, typ, x, y, buttons=0, button="none"):
        self.fire({"type": typ, "x": x, "y": y, "button": button, "buttons": buttons,
                   "clickCount": 1 if button != "none" else 0, "pointerType": "mouse"})

    def wheel(self, x, y, dx, dy, ctrl=False):
        self.fire({"type": "mouseWheel", "x": x, "y": y, "deltaX": dx, "deltaY": dy,
                   "modifiers": 2 if ctrl else 0, "pointerType": "mouse"})

    async def flush(self):
        if self.pending:
            await asyncio.gather(*self.pending)
        self.pending = []

    async def ticks(self, items, fn, hz=60):
        """fn(item) на каждый тик с постоянным шагом по часам, без накопления опоздания"""
        t0 = time.perf_counter()
        for i, it in enumerate(items):
            fn(it)
            dt = t0 + (i + 1) / hz - time.perf_counter()
            await asyncio.sleep(max(0, dt))

    async def drag(self, pts, hz=60):
        x, y = pts[0]
        self.mouse("mouseMoved", x, y)
        self.mouse("mousePressed", x, y, 1, "left")
        await self.ticks(pts[1:], lambda p: self.mouse("mouseMoved", p[0], p[1], 1, "left"), hz)
        x, y = pts[-1]
        self.mouse("mouseReleased", x, y, 0, "left")
        await self.flush()

    async def run(self, name, body, actions):
        await self.page.evaluate("() => window.__perfStart()")
        s0, _ = await self.metrics(); w0 = time.perf_counter()
        extra = (await body()) or {}
        await self.flush()
        await asyncio.sleep(0.3)    # кадры, догоняющие жест
        cut = await self.page.evaluate("() => [window.__perf.frames.length, window.__perf.pframes.length]")
        s1, _ = await self.metrics(); w1 = time.perf_counter()
        # хвост: сохранение после жеста (оно может ждать паузы) — его цена
        # идёт в столбцы pushUndo/saveDB/idbPut, но не в кадры: кадры
        # простоя только разбавили бы медиану
        await asyncio.sleep(2.5)
        r = await self.page.evaluate("() => window.__perfStop()")
        fr = [f for f in r["frames"][:cut[0]] if f > 0]
        pf = [f for f in r["pframes"][:cut[1]] if f > 0]
        per = lambda k: (r["t"].get(k, 0.0) / actions) if actions else 0.0
        nr = r["n"].get("renderScreen", 0) + r["n"].get("render", 0)
        res = {
            "name": name, "frames": len(pf),
            "med": statistics.median(pf) if pf else 0, "p95": pct(pf, 0.95), "max": max(fr) if fr else 0,
            "amed": statistics.median(fr) if fr else 0, "ap95": pct(fr, 0.95),
            "script_share": (s1 - s0) / max(1e-6, (w1 - w0)),
            "pushUndo": per("pushUndo"), "saveDB": per("saveDB"),
            "render": (r["t"].get("renderScreen", 0.0) + r["t"].get("render", 0.0)) / max(1, nr),
            "idb": per("idbPut"),
            "calls": r["n"],
        }
        res.update(extra)
        return res


def stroke_path(x0, y0, n, seed, amp=60):
    rnd = random.Random(seed)
    pts, a = [], rnd.random() * 6.28
    x, y = x0, y0
    for _ in range(n):
        a += (rnd.random() - 0.5) * 0.5
        x = min(VIEW_W - 120, max(160, x + math.cos(a) * 9))
        # штрихи — ниже рядов для ластика (они на экране по y 290–610)
        y = min(VIEW_H - 30, max(660, y + math.sin(a) * 9))
        pts.append((x, y))
    return pts


async def main_async(out_path, headed=False):
    from playwright.async_api import async_playwright
    results = []
    async with async_playwright() as p:
        browser = await p.chromium.launch(channel="chromium", headless=not headed, args=["--disable-background-timer-throttling", "--disable-renderer-backgrounding"])
        ctx = await browser.new_context(viewport={"width": VIEW_W, "height": VIEW_H}, device_scale_factor=DPR)
        page = await ctx.new_page()
        errors = []
        page.on("pageerror", lambda e: errors.append(str(e)))
        await page.goto(f"{BASE}/boards.html")
        info = await page.evaluate(GEN_JS.replace("VW", str(VIEW_W)).replace("VH", str(VIEW_H)).replace("Z,", "0.5,").replace("/ Z", "/ 0.5"))
        print("доска:", info, flush=True)
        await page.reload()
        await page.evaluate("() => { const g = document.getElementById('authGate'); if (g) g.style.display = 'none'; window.boardsAppBoot(); }")
        await page.wait_for_function("window.getDB && window.getDB().boards.length === 1")
        await page.evaluate("() => window.openBoard('big')")
        await page.wait_for_function("window.getCurrentBoard() && window.getCurrentBoard().objects && window.getCurrentBoard().objects.length > 5000", timeout=60000)
        await page.wait_for_timeout(1500)
        await page.evaluate(INSTR_JS)
        cdp = await ctx.new_cdp_session(page)
        await cdp.send("Performance.enable")
        await cdp.send("Emulation.setCPUThrottlingRate", {"rate": THROTTLE})
        b = Bench(page, cdp)

        async def tool(t):
            await page.evaluate(f"() => document.querySelector('.bd-tool[data-tool=\"{t}\"]').click()")
        await page.wait_for_timeout(800)

        # 1. длинный штрих
        await tool("pen")

        async def pen_long():
            await b.drag(stroke_path(500, 760, 180, 1))
        results.append(await b.run("pen_long", pen_long, 1))
        print("pen_long готово", flush=True)

        # 2. 30 штрихов подряд — по каждому своя медиана кадра (кадры от
        # нажатия до отпускания) и время кадра отпускания
        async def pen30():
            per = []
            for i in range(30):
                n0 = await page.evaluate("() => window.__perf.frames.length")
                await b.drag(stroke_path(250 + (i % 6) * 170, 680 + (i // 6) * 40, 24, 100 + i, 30))
                await asyncio.sleep(0.3)
                fr = await page.evaluate(f"() => window.__perf.frames.slice({n0})")
                per.append(max(fr) if fr else 0)
            return {"per_stroke_med": per}
        r = await b.run("pen_30", pen30, 30)
        per = r["per_stroke_med"]
        r["first5"] = statistics.mean(per[:5]); r["last5"] = statistics.mean(per[-5:])
        results.append(r)
        print("pen_30 готово", flush=True)

        # координаты рядов ластика на экране (cam, canvas, worldToScreen —
        # глобальные имена boards-core.js, evaluate их видит)
        geo = await page.evaluate("""() => {
          const r = canvas.getBoundingClientRect();
          const pos = (id) => { const o = B.objects.find(x => x.id === id); const s = worldToScreen(o.points[40]); return { x: s.x + r.left, y: s.y + r.top }; };
          return { eo0: pos('eo0'), eo19: pos('eo19'), ea0: pos('ea0'), ea19: pos('ea19') };
        }""")

        def sweep(a, c, n=60):
            return [(a["x"] - 20 + (c["x"] - a["x"] + 40) * k / n, a["y"] + math.sin(k / 5) * 8) for k in range(n + 1)]

        await tool("eraser")
        await page.evaluate("() => window.setEraserMode && window.setEraserMode('object')")
        before = await page.evaluate("() => window.getCurrentBoard().objects.filter(o => /^eo/.test(o.id)).length")

        async def er_obj():
            await b.drag(sweep(geo["eo0"], geo["eo19"]))
        r = await b.run("erase_obj", er_obj, 20)
        r["erased"] = before - await page.evaluate("() => window.getCurrentBoard().objects.filter(o => /^eo/.test(o.id)).length")
        results.append(r)
        print("erase_obj готово, стёрто", r["erased"], flush=True)

        await page.evaluate("() => window.setEraserMode && window.setEraserMode('area')")

        async def er_area():
            await b.drag(sweep(geo["ea0"], geo["ea19"]))
        r = await b.run("erase_area", er_area, 20)
        r["erased"] = 20 - await page.evaluate("() => window.getCurrentBoard().objects.filter(o => /^ea/.test(o.id)).length")
        results.append(r)
        print("erase_area готово, разрезано", r["erased"], flush=True)
        await page.evaluate("() => window.setEraserMode && window.setEraserMode('object')")

        await tool("hand")
        cx, cy = VIEW_W / 2, VIEW_H / 2

        async def scroll():
            await b.ticks(range(90), lambda _: b.wheel(cx, cy, 0, 30))
            await b.ticks(range(90), lambda _: b.wheel(cx, cy, 30, 0))
            await b.ticks(range(90), lambda _: b.wheel(cx, cy, -20, -30))
        results.append(await b.run("scroll", scroll, 270))
        print("scroll готово", flush=True)

        async def zoom_wheel():
            # колесо прокручивают быстро: щелчки идут чаще кадров (60 Гц) — так
            # видна цена кадра, а не промежуток между щелчками
            await b.ticks([100] * 8 + [-100] * 12 + [100] * 4, lambda d: b.wheel(cx, cy, 0, d, ctrl=True), hz=60)
        results.append(await b.run("zoom_wheel", zoom_wheel, 24))
        print("zoom_wheel готово", flush=True)

        async def zoom_pinch():
            await b.ticks([4] * 60 + [-4] * 90 + [4] * 30, lambda d: b.wheel(cx, cy, 0, d, ctrl=True))
        results.append(await b.run("zoom_pinch", zoom_pinch, 180))
        print("zoom_pinch готово", flush=True)

        await cdp.send("Emulation.setCPUThrottlingRate", {"rate": 1})
        if errors:
            print("ОШИБКИ JS:", errors[:5])
        await ctx.close(); await browser.close()
    return results


def main_run(out_path, headed=False):
    with local_server():
        results = asyncio.run(main_async(out_path, headed))
    if out_path:
        with open(out_path, "w") as f:
            json.dump(results, f, ensure_ascii=False, indent=1)
    print_table(results)
    return results


def print_table(res, other=None):
    hdr = f"{'сценарий':<11} {'кадр мед':>8} {'p95':>7} {'макс':>7} {'все.мед':>7} {'все.p95':>7} {'скрипты':>7} {'pushUndo':>8} {'saveDB':>7} {'render':>7} {'idbPut':>7}"
    print(hdr)
    for r in res:
        extra = ""
        if "first5" in r:
            extra = f"   худший кадр штриха: первые 5 — {r['first5']:.0f} мс, последние 5 — {r['last5']:.0f} мс"
        if "erased" in r:
            extra += f"   стёрто/осталось: {r['erased']}"
        print(f"{r['name']:<11} {r['med']:>8.1f} {r['p95']:>7.1f} {r['max']:>7.1f} {r.get('amed',0):>7.1f} {r.get('ap95',0):>7.1f} {r['script_share']*100:>6.0f}% "
              f"{r['pushUndo']:>8.2f} {r['saveDB']:>7.2f} {r['render']:>7.2f} {r['idb']:>7.2f}{extra}")


def cmp(a_path, b_path):
    A = {r["name"]: r for r in json.load(open(a_path))}
    Bm = {r["name"]: r for r in json.load(open(b_path))}
    print(f"{'сценарий':<11} | {'кадр мед, мс':>15} | {'p95, мс':>15} | {'скрипты':>11} | {'pushUndo':>13} | {'saveDB':>13} | {'render':>13} | {'idbPut':>13}")
    for k in A:
        a, b = A[k], Bm.get(k)
        if not b:
            continue
        f = lambda key, fmt="{:.1f}": f"{fmt.format(a[key])} → {fmt.format(b[key])}"
        print(f"{k:<11} | {f('med'):>15} | {f('p95'):>15} | {a['script_share']*100:>4.0f}% → {b['script_share']*100:.0f}% | "
              f"{f('pushUndo','{:.2f}'):>13} | {f('saveDB','{:.2f}'):>13} | {f('render','{:.2f}'):>13} | {f('idb','{:.2f}'):>13}")
        if "first5" in a and "first5" in b:
            print(f"{'':<11}   рост при письме подряд: первые 5 / последние 5 штрихов — "
                  f"{a['first5']:.1f}/{a['last5']:.1f} → {b['first5']:.1f}/{b['last5']:.1f} мс")


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--out")
    ap.add_argument("--cmp", nargs=2)
    # настоящее окно Chrome с видеокартой: headless рисует холст программно,
    # и растягивание/копирование больших картинок там дороже, чем в браузере
    ap.add_argument("--headed", action="store_true")
    a = ap.parse_args()
    if a.cmp:
        cmp(*a.cmp)
    else:
        main_run(a.out, a.headed)
