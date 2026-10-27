"""
Шрифты кадра тренажёра — в снимок задания (trainer-tasks.js, ttSyncFrameFonts).

html2canvas рисует текст шрифтами страницы, где запущен, а не кадра. На
вкладке-панели (boards-panel.html) стилей формул KaTeX не было — формулы с
телефона ложились на доску запасным шрифтом: «x» опущен, дробь срезана
(ОГЭ ч. 2 №20, задания ФИПИ F5A849 и «x ≤ 9/x»).

Проверяет:
  1. Снимок с панели совпадает с эталоном — тем же снимком, сделанным, когда
     стили KaTeX на странице панели уже есть (оба задания).
  2. На панели после снимка есть описания шрифтов KaTeX и они загружены.
  3. На доске, где KaTeX уже подключён, ничего не добавляется.
  4. Нет ошибок JavaScript.

Запуск: ~/.venvs/trainers/bin/python test_prompt_board_panel_fonts.py
"""
import base64
import contextlib
import http.client
import io
import json
import subprocess
import sys
import time

from PIL import Image, ImageChops
from playwright.sync_api import sync_playwright

PORT = 9235
BASE = f"http://127.0.0.1:{PORT}"
FAILS = []
ERRORS = []
TASKS = [("20.fipi.F5A849", "(4 − x)(x² + x − 20) ≥ 0"), (None, "первый прототип №20 (x ≤ 9/x)")]


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


SNAP = """async (sel) => { const f = document.querySelector(sel); let u = null;
  await ttSnapTrainerTasks(f.contentWindow, 'oge20', 'oge_part2.html?n=20', { widthFor: () => null, scale: 2, onShot: async (it) => { u = it.dataUrl; } });
  return u; }"""
KATEX_FIRST = """async () => { const l = document.createElement('link'); l.rel = 'stylesheet'; l.href = 'katex-0.18.5.css';
  await new Promise(r => { l.onload = r; document.head.appendChild(l); });
  const fams = ['KaTeX_Main', 'KaTeX_Math', 'KaTeX_Size1', 'KaTeX_Size2', 'KaTeX_AMS'];
  await Promise.all(fams.flatMap(f => ['normal 400', 'italic 400', 'normal 700'].map(s => document.fonts.load(s + ' 20px ' + f, 'x1234≥()−+').catch(() => {})))); }"""


def img(url):
    return Image.open(io.BytesIO(base64.b64decode(url.split(",")[1]))).convert("RGBA")


def panel_shots(browser, katex_first):
    ctx = browser.new_context(viewport={"width": 1280, "height": 820})
    ctx.route("https://**/*", lambda r: r.abort())
    ctx.add_init_script("localStorage.setItem('bdPanel:link', JSON.stringify({ key: 'k'.repeat(43), devId: 'd', name: 't', local: true }));"
                        "localStorage.setItem('bdPanel:frameW', '420');")
    p = ctx.new_page()
    p.on("pageerror", lambda e: ERRORS.append(str(e)))
    p.goto(f"{BASE}/boards-panel.html")
    p.wait_for_function("() => window.__boardPanel")
    if katex_first:
        p.evaluate(KATEX_FIRST)
    p.evaluate("() => __boardPanel.openTrainer('oge20', 'oge_part2.html?n=20', 'oge20')")
    p.wait_for_function("""() => { try { const f = document.getElementById('bpIframe');
        return f.contentDocument.readyState === 'complete' && typeof f.contentWindow.openTask === 'function'; } catch (e) { return false; } }""", timeout=20000)
    p.wait_for_timeout(1500)
    out = []
    for pid, _ in TASKS:
        p.evaluate(f"() => document.getElementById('bpIframe').contentWindow.openTask(20{', ' + json.dumps(pid) if pid else ''})")
        p.wait_for_timeout(1500)
        out.append(img(p.evaluate(SNAP, "#bpIframe")))
    fonts = p.evaluate("""() => ({ style: !!document.querySelector('style.tt-frame-fonts'),
        math: document.fonts.check('italic 400 20px KaTeX_Math', 'x'), main: document.fonts.check('400 20px KaTeX_Main', '4') })""")
    ctx.close()
    return out, fonts


def run():
    with sync_playwright() as pw:
        browser = pw.chromium.launch()
        ref, _ = panel_shots(browser, True)
        got, fonts = panel_shots(browser, False)
        for (pid, label), a, b in zip(TASKS, ref, got):
            same_size = a.size == b.size
            diff = ImageChops.difference(a, b).convert("L") if same_size else None
            bad = sum(1 for v in diff.getdata() if v > 40) if diff else -1
            check(f"1. {label}: снимок с панели совпадает с эталоном", same_size and bad < a.size[0] * a.size[1] * 0.002,
                  f"размер {a.size} / {b.size}, отличающихся пикселей {bad}")
        check("2. на панели появились описания шрифтов KaTeX", fonts["style"], str(fonts))
        check("2. шрифты формул загружены", fonts["math"] and fonts["main"], str(fonts))

        # 3. доска: KaTeX уже подключён — ничего не добавляем
        ctx = browser.new_context(viewport={"width": 1400, "height": 900})
        ctx.route("https://**/*", lambda r: r.abort())
        b = ctx.new_page()
        b.on("pageerror", lambda e: ERRORS.append("доска: " + str(e)))
        b.goto(f"{BASE}/boards.html")
        b.wait_for_timeout(800)
        r = b.evaluate("""async () => { const fr = document.createElement('iframe'); fr.style.cssText = 'position:fixed;left:-3000px;width:420px;height:900px';
            fr.src = 'oge_part2.html?n=20'; document.body.appendChild(fr);
            await new Promise(res => fr.addEventListener('load', res, { once: true }));
            await new Promise(res => setTimeout(res, 1500));
            const q = fr.contentDocument.querySelector('#egeQuestion') || fr.contentDocument.body;
            await ttSyncFrameFonts(q);
            return document.querySelectorAll('style.tt-frame-fonts').length; }""")
        check("3. на доске (KaTeX уже есть) лишних шрифтов не добавлено", r == 0, str(r))
        ctx.close()

        check("4. нет ошибок JavaScript", not ERRORS, "\n".join(ERRORS[:5]))
        browser.close()


with local_server():
    run()
print("\nИТОГ: " + ("всё прошло" if not FAILS else f"упало {len(FAILS)}: " + "; ".join(FAILS)))
sys.exit(1 if FAILS else 0)
