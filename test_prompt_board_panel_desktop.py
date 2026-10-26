"""
Вкладка-панель (boards-panel.html): вид по устройству, одинаковый снимок
с любого устройства, шрифт задания на холсте.

Проверяет:
  1. Широкий экран (компьютер, отдельное окно): тренажёр во всю ширину, без
     масштаба; узкий (телефон) — кадр 420, вписанный масштабом.
  2. Снимок с широкого вида — той же ширины и того же вида, что с
     телефонного (кадр на время снимка сужается до 420 под плашкой и потом
     возвращается).
  3. Плотность снимка — как у доски, а не по экрану: на экране с
     плотностью 3 без доски берётся 2 (natW / css.w = 2); доска присылает
     своё число в pong (state().scale).
  4. Шрифт холста: в Chromium проверка видит, что веса различаются, и
     ничего не трогает; обычные файлы Onest (onest-static.css) рисуют те же
     веса, что вариативный — переключение на них в Safari ничего не меняет
     на вид, кроме того, что вес начинает работать.
  5. Нет ошибок JavaScript.

Запуск: ~/.venvs/trainers/bin/python test_prompt_board_panel_desktop.py
Сам сбой Safari на iPhone (холст рисует вариативный шрифт весом 400) в
эмуляции не воспроизводится — проверяется руками на телефоне.
"""
import contextlib
import http.client
import json
import subprocess
import sys
import time

from playwright.sync_api import sync_playwright

PORT = 9220
BASE = f"http://127.0.0.1:{PORT}"
FAILS = []
ERRORS = []
PICK = "document.querySelectorAll('.mode-card:not(.soon):not(.demo)')[1].click()"
# один и тот же пример в обоих видах: Math.random в кадре — с одного зерна
SEED = "(() => { let s = 4242; Math.random = () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; }; })();"


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
                conn.request("GET", "/boards-panel.html")
                conn.getresponse()
                break
            except Exception:
                time.sleep(0.1)
        yield
    finally:
        proc.terminate()
        proc.wait(timeout=5)


SNAP_JS = """async () => {
  const f = document.getElementById('bpIframe'); const out = [];
  await __boardPanel.withSnapLayout(() => ttSnapTrainerTasks(f.contentWindow, 'oge6', 'oge6.html', { widthFor: () => null, scale: __boardPanel.snapScale(),
    onShot: async (it) => { const im = new Image(); im.src = it.dataUrl; await im.decode();
      out.push({ css: it.shot.css, natW: im.naturalWidth, vw: it.gen && it.gen.vw, text: f.contentDocument.querySelector('#questionPanel').innerText.slice(0, 80) }); } }));
  return out[0]; }"""
FRAME_JS = """() => { const f = document.getElementById('bpIframe'), st = document.getElementById('bpStage');
  return { fw: parseFloat(f.style.width), sw: st.clientWidth, tr: f.style.transform, desktop: document.body.classList.contains('bp-desktop'),
           inner: f.contentWindow.innerWidth, cover: document.getElementById('bpSnapCover').classList.contains('show') }; }"""


def panel(browser, w, h, dpr, mobile):
    ctx = browser.new_context(viewport={"width": w, "height": h}, device_scale_factor=dpr, is_mobile=mobile, has_touch=mobile)
    ctx.route("https://**/*", lambda r: r.abort())
    ctx.add_init_script("localStorage.setItem('bdPanel:link', JSON.stringify({ key: 'k'.repeat(43), devId: 'd', name: 't', local: true }));")
    p = ctx.new_page()
    p.on("pageerror", lambda e: ERRORS.append(str(e)))
    p.goto(f"{BASE}/boards-panel.html")
    p.wait_for_function("() => window.__boardPanel")
    p.evaluate("() => __boardPanel.openTrainer('oge6', 'oge6.html', 'oge6')")
    p.wait_for_function("""() => { try { const f = document.getElementById('bpIframe');
        return f.contentDocument.readyState === 'complete' && typeof f.contentWindow.tsGetState === 'function'; } catch (e) { return false; } }""", timeout=20000)
    p.evaluate(f"() => document.getElementById('bpIframe').contentWindow.eval({json.dumps(SEED)})")
    p.evaluate(f"() => document.getElementById('bpIframe').contentWindow.eval({json.dumps(PICK)})")
    p.wait_for_timeout(1200)
    return ctx, p


def run():
    with sync_playwright() as pw:
        browser = pw.chromium.launch()
        ctx_d, d = panel(browser, 1280, 860, 1, False)
        fd = d.evaluate(FRAME_JS)
        check("1. компьютер: тренажёр во всю ширину, без масштаба", fd["desktop"] and abs(fd["fw"] - fd["sw"]) < 1 and fd["tr"] == "none" and fd["inner"] > 1000, str(fd))
        sd = d.evaluate(SNAP_JS)
        fd2 = d.evaluate(FRAME_JS)
        check("2. после снимка кадр снова во всю ширину, плашка убрана", fd2["desktop"] and abs(fd2["fw"] - fd2["sw"]) < 1 and not fd2["cover"], str(fd2))
        check("2. снимок сделан в кадре 420 (как во встроенной панели)", sd["vw"] == 420, str(sd))

        ctx_m, m = panel(browser, 390, 820, 3, True)
        fm = m.evaluate(FRAME_JS)
        check("1. телефон: кадр 420, вписан масштабом", not fm["desktop"] and fm["fw"] == 420 and "scale" in fm["tr"] and fm["inner"] == 420, str(fm))
        sm = m.evaluate(SNAP_JS)
        check("2. тот же пример в обоих видах", sd["text"] == sm["text"], f"{sd['text']!r} / {sm['text']!r}")
        check("2. снимок той же ширины с компьютера и с телефона", abs(sd["css"]["w"] - sm["css"]["w"]) < 0.5 and abs(sd["css"]["h"] - sm["css"]["h"]) < 0.5, f"{sd['css']} / {sm['css']}")
        check("3. плотность снимка 2 на экране с плотностью 3 (доски нет)", m.evaluate("() => __boardPanel.snapScale()") == 2 and abs(sm["natW"] / sm["css"]["w"] - 2) < 0.02, f"{sm['natW']} / {sm['css']['w']}")
        check("3. с плотностью компьютера — тоже 2", abs(sd["natW"] / sd["css"]["w"] - 2) < 0.02, f"{sd['natW']} / {sd['css']['w']}")

        # 4. шрифт холста
        r = d.evaluate("""async () => { const res = await ttCanvasFontFix();
          const cv = document.createElement('canvas'); cv.width = 240; cv.height = 60; const c = cv.getContext('2d');
          const v = [400, 600].map(w => ttCanvasInk(c, w));
          const before = !!document.getElementById('ttOnestStatic');
          await ttUseStaticOnest();
          const s = [400, 600].map(w => ttCanvasInk(c, w));
          return { res, v, s, before, disabled: [...document.querySelectorAll('link[href$="onest.css"]')].every(l => l.disabled) }; }""")
        check("4. Chromium: холст различает веса — ничего не переключали", r["res"] == "ok" and not r["before"], str(r))
        # совпадение до долей процента: сглаживание краёв округляется по-разному
        check("4. обычные файлы Onest рисуют те же веса, что вариативный", all(abs(a - b) <= a * 0.001 for a, b in zip(r["v"], r["s"])), str(r))
        check("4. вариативный onest.css при переключении отключён", r["disabled"], str(r))
        sd2 = d.evaluate(SNAP_JS)
        check("4. снимок на обычных файлах Onest — того же размера", abs(sd2["css"]["w"] - sd["css"]["w"]) < 0.5, f"{sd2['css']} / {sd['css']}")
        ctx_d.close(); ctx_m.close()

        check("5. нет ошибок JavaScript", not ERRORS, "\n".join(ERRORS[:5]))
        browser.close()


with local_server():
    run()
print("\nИТОГ: " + ("всё прошло" if not FAILS else f"упало {len(FAILS)}: " + "; ".join(FAILS)))
sys.exit(1 if FAILS else 0)
