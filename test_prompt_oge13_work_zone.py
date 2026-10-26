"""
ОГЭ №13 (неравенства): растягиваемая рабочая зона, как у ОГЭ №8.

Проверяет:
  1. У задания ручки слева и справа; потянули правую на 200 — карточка
     задания шире на 400 (зона по центру), шире страницы (820).
  2. Ширина помнится после перезагрузки (oge13:workZoneW).
  3. Ширина — в общем снимке сессии: tsGetState().workW, а tsApplyState с
     другой шириной её применяет.
  4. В карточке «+» (oge13.html?card=1) ручек нет.
  5. Телефон: зона не шире экрана, горизонтальной прокрутки нет.
  6. Вкладка-панель для доски: растянутое задание снимается растянутым.
  7. Нет ошибок JavaScript.

Запуск: ~/.venvs/trainers/bin/python test_prompt_oge13_work_zone.py
"""
import contextlib
import http.client
import json
import subprocess
import sys
import time

from playwright.sync_api import sync_playwright

PORT = 9226
BASE = f"http://127.0.0.1:{PORT}"
FAILS = []
ERRORS = []
PICK = "document.querySelectorAll('.mode-card:not(.soon):not(.demo)')[0].click()"


def check(name, ok, info=""):
    print(("[OK] " if ok else "[FAIL] ") + name + ("" if ok else f" — {info}"))
    if not ok:
        FAILS.append(name)


@contextlib.contextmanager
def local_server():
    proc = subprocess.Popen([sys.executable, "-m", "http.server", str(PORT)],
                            stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    try:
        for _ in range(50):
            try:
                conn = http.client.HTTPConnection("127.0.0.1", PORT, timeout=0.2)
                conn.request("GET", "/oge13.html")
                conn.getresponse()
                break
            except Exception:
                time.sleep(0.1)
        yield
    finally:
        proc.terminate()
        proc.wait(timeout=5)


M = """() => { const z = document.getElementById('workZone'), q = document.getElementById('questionPanel');
  const r = id => { const e = document.getElementById(id); const b = e.getBoundingClientRect(); return { x: b.left + b.width / 2, y: b.top + Math.min(b.height / 2, 40), w: b.width, vis: getComputedStyle(e).display !== 'none' && b.width > 0 }; };
  return { zone: Math.round(z.getBoundingClientRect().width), q: Math.round(q.getBoundingClientRect().width), L: r('workResizeLeft'), R: r('workResizeRight'),
           sw: document.documentElement.scrollWidth, iw: innerWidth }; }"""


def open13(ctx, path="oge13.html"):
    p = ctx.new_page()
    p.on("pageerror", lambda e: ERRORS.append(f"{path}: {e}"))
    p.goto(f"{BASE}/{path}")
    p.wait_for_function("() => typeof tsGetState === 'function'")
    p.evaluate(PICK)
    p.wait_for_timeout(700)
    return p


def run():
    with sync_playwright() as pw:
        browser = pw.chromium.launch()
        ctx = browser.new_context(viewport={"width": 1400, "height": 900})
        ctx.route("https://**/*", lambda r: r.abort())
        p = open13(ctx)
        a = p.evaluate(M)
        check("1. ручки слева и справа", a["L"]["vis"] and a["R"]["vis"], str(a))
        check("1. по умолчанию — ширина страницы (820)", a["zone"] == 820 and a["q"] == 820, str(a))
        p.mouse.move(a["R"]["x"], a["R"]["y"])
        p.mouse.down()
        p.mouse.move(a["R"]["x"] + 200, a["R"]["y"], steps=8)
        p.mouse.up()
        p.wait_for_timeout(300)
        b = p.evaluate(M)
        check("1. правую на 200 — задание шире на 400", abs(b["zone"] - 1220) <= 2 and abs(b["q"] - 1220) <= 2, str(b))
        p.mouse.move(b["L"]["x"], b["L"]["y"])
        p.mouse.down()
        p.mouse.move(b["L"]["x"] + 300, b["L"]["y"], steps=8)
        p.mouse.up()
        p.wait_for_timeout(300)
        c = p.evaluate(M)
        check("1. левую внутрь на 300 — уже на 600", abs(c["zone"] - 620) <= 2, str(c))
        p.reload()
        p.wait_for_function("() => typeof tsGetState === 'function'")
        p.evaluate(PICK)
        p.wait_for_timeout(500)
        d = p.evaluate(M)
        check("2. ширина помнится после перезагрузки", abs(d["zone"] - c["zone"]) <= 2, f"{c['zone']} / {d['zone']}")
        st = p.evaluate("() => tsGetState()")
        check("3. ширина в снимке сессии (workW)", abs((st.get("workW") or 0) - d["zone"]) <= 2, str(st.get("workW")))
        p.evaluate("() => tsApplyState(Object.assign(tsGetState(), { workW: 900 }))")
        p.wait_for_timeout(200)
        check("3. tsApplyState применяет ширину собеседника", abs(p.evaluate(M)["zone"] - 900) <= 2, str(p.evaluate(M)))

        cp = ctx.new_page()
        cp.on("pageerror", lambda e: ERRORS.append(f"card: {e}"))
        cp.goto(f"{BASE}/oge13.html?card=1")
        cp.wait_for_timeout(800)
        hid = cp.evaluate("() => ['workResizeLeft', 'workResizeRight'].every(id => getComputedStyle(document.getElementById(id)).display === 'none')")
        check("4. в карточке «+» ручек нет", hid)
        ctx.close()

        mctx = browser.new_context(viewport={"width": 375, "height": 800}, is_mobile=True, has_touch=True)
        mctx.route("https://**/*", lambda r: r.abort())
        mp = open13(mctx)
        m = mp.evaluate(M)
        check("5. телефон: зона не шире экрана, без горизонтальной прокрутки", m["zone"] <= m["iw"] and m["sw"] <= m["iw"], str(m))
        mctx.close()

        # 6. вкладка-панель: растянутое задание снимается растянутым
        pctx = browser.new_context(viewport={"width": 1400, "height": 900})
        pctx.route("https://**/*", lambda r: r.abort())
        pctx.add_init_script("localStorage.setItem('oge13:workZoneW', '1100');")
        pp = pctx.new_page()
        pp.on("pageerror", lambda e: ERRORS.append(f"панель: {e}"))
        pp.goto(f"{BASE}/boards-panel.html")
        pp.wait_for_function("() => window.__boardPanel")
        pp.evaluate("() => document.body.classList.remove('bp-pairing')")
        pp.evaluate("() => __boardPanel.openTrainer('oge13', 'oge13.html', 'oge13')")
        pp.wait_for_function("""() => { try { const f = document.getElementById('bpIframe');
            return f.contentDocument.readyState === 'complete' && typeof f.contentWindow.tsGetState === 'function'; } catch (e) { return false; } }""", timeout=20000)
        pp.evaluate(f"() => document.getElementById('bpIframe').contentWindow.eval({json.dumps(PICK)})")
        pp.wait_for_timeout(900)
        w = pp.evaluate("""async () => { const f = document.getElementById('bpIframe'); let css = null;
            await ttSnapTrainerTasks(f.contentWindow, 'oge13', 'oge13.html', { widthFor: () => null, scale: 2, onShot: async (it) => { css = it.shot.css; } });
            return css; }""")
        check("6. снимок растянутого задания — шириной зоны (1100)", w and abs(w["w"] - 1100) < 30, str(w))
        pctx.close()

        check("7. нет ошибок JavaScript", not ERRORS, "\n".join(ERRORS[:5]))
        browser.close()


with local_server():
    run()
print("\nИТОГ: " + ("всё прошло" if not FAILS else f"упало {len(FAILS)}: " + "; ".join(FAILS)))
sys.exit(1 if FAILS else 0)
