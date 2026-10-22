"""
Скорость №3: html2canvas и jsPDF больше не держат показ страницы —
lazy-libs.js догружает их в фоне сразу после загрузки страницы, а каждое
место использования при необходимости их дожидается.

Опасность этой правки — тихая: раньше код проверял «библиотека есть?» и
молча ничего не делал, если её нет. Поэтому главное здесь — сценарий
«нажали в первую секунду», когда библиотека ещё не пришла. Его воспроизводим,
придерживая ответ сервера на файл библиотеки.

Что проверяем:
  - на 12 страницах нет прежних <script> библиотек, есть lazy-libs.js с
    нужным списком в data-preload;
  - библиотеки не загружены к моменту показа страницы, но приходят сами
    вскоре после загрузки — и html2canvas ровно одним тегом (его догружают и
    lazy-libs.js, и lesson-notes.js);
  - ОГЭ №8: снимок в историю урока, запрошенный до прихода html2canvas,
    не теряется — и в нём записи доски, сделанные ДО того, как задание
    сменилось (записи копируются сразу, а не после ожидания);
  - (заодно) записи доски вообще попадают в снимок истории урока: до этой
    правки html2canvas оставлял на холсте сдвиг, и они уходили за край;
  - ОГЭ №8: «скачать PDF истории» до прихода jsPDF — файл всё равно скачивается;
  - конспект (notes.html) и доски: jsPDF дожидается по требованию;
  - доски: снимок задания (captureTrainerNode) до прихода html2canvas ждёт
    библиотеку, а не падает;
  - сбой сети не запоминается навсегда: после ошибки следующий вызов
    скачивает заново.

Запуск: python3 test_prompt_perf3_lazy_libs.py (сервер поднимается сам).
"""
import contextlib
import http.client
import os
import subprocess
import sys
import time

from playwright.sync_api import sync_playwright

HERE = os.path.dirname(os.path.abspath(__file__))
PORT = 8983
BASE = f"http://127.0.0.1:{PORT}"
PAGES = {
    "boards": "html2canvas jspdf", "ege_base": "html2canvas jspdf", "ege_prof": "html2canvas jspdf",
    "logarithms": "html2canvas jspdf", "oge12": "html2canvas jspdf", "oge8": "html2canvas jspdf",
    "oge_part2": "html2canvas jspdf", "percent": "html2canvas jspdf", "powers": "html2canvas jspdf",
    "trig_equations": "html2canvas jspdf", "notes": "jspdf", "works": "html2canvas",
}

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


def static_checks():
    for p, want in PAGES.items():
        s = open(os.path.join(HERE, p + ".html"), encoding="utf-8").read()
        check('src="jspdf.umd.min.js"' not in s and 'src="html2canvas.min.js"' not in s
              and f'<script src="lazy-libs.js" data-preload="{want}"></script>' in s,
              f"{p}: библиотеки через lazy-libs.js ({want})")


class Hold:
    """Придерживает ответ на файлы библиотек: запросы копятся и уходят на
    сервер только по release(). Ждать внутри обработчика нельзя — в
    синхронном playwright он работает в том же потоке, что и тест."""
    def __init__(self, page, names):
        self.waiting, self.open = [], False
        for n in names:
            page.route(f"**/{n}", self._handle)

    def _handle(self, route):
        if self.open:
            route.continue_()
        else:
            self.waiting.append(route)

    def release(self):
        self.open = True
        for r in self.waiting:
            r.continue_()
        self.waiting = []


def new_page(b, errors):
    ctx = b.new_context(accept_downloads=True)
    pg = ctx.new_page()
    pg.on("pageerror", lambda e: errors.append(str(e)))
    pg.route("https://**/*", lambda r: r.abort())
    return ctx, pg


def run():
    static_checks()
    with local_server(), sync_playwright() as pw:
        b = pw.chromium.launch()

        # ── обычная загрузка: не ждём при показе, приходят сами, один тег ──
        errors = []
        ctx, pg = new_page(b, errors)
        pg.goto(f"{BASE}/oge8.html", wait_until="domcontentloaded")
        at_dom = pg.evaluate("[!!window.html2canvas, !!window.jspdf]")
        check(at_dom == [False, False], f"ОГЭ №8: к показу страницы библиотек ещё нет {at_dom}")
        pg.wait_for_function("!!(window.html2canvas && window.jspdf)", timeout=8000)
        n = pg.evaluate("document.querySelectorAll('script[src=\"html2canvas.min.js\"]').length")
        check(n == 1, f"ОГЭ №8: библиотеки догрузились сами, html2canvas одним тегом ({n})")
        check(not errors, f"ОГЭ №8: без ошибок JS {errors[:1]}")
        ctx.close()

        # ── снимок и PDF истории до прихода библиотек ──
        errors = []
        ctx, pg = new_page(b, errors)
        gate = Hold(pg, ["html2canvas.min.js", "jspdf.umd.min.js"])
        pg.goto(f"{BASE}/oge8.html", wait_until="load")
        pg.wait_for_timeout(500)
        state = pg.evaluate("""() => {
            const el = document.querySelector('.wrap') || document.body;
            // запись на доске поверх задания — как будто учитель что-то написал
            const ink = window.__boardCanvasEl && window.__boardCanvasEl().bg.inkCanvas;
            if (ink) { const c = ink.getContext('2d'); c.setTransform(1,0,0,1,0,0);
                       c.fillStyle = '#ff0000'; c.fillRect(0, 0, ink.width, ink.height); }
            window.__shot = window.LessonHistory.capture('single', el);
            // задание сменилось: записи стёрлись раньше, чем пришла библиотека
            if (ink) ink.getContext('2d').clearRect(0, 0, ink.width, ink.height);
            return { lib: !!window.html2canvas, hasInk: !!ink };
        }""")
        check(state["lib"] is False, "ОГЭ №8: снимок запрошен, пока html2canvas ещё не пришёл")
        pg.wait_for_timeout(300)
        gate.release()
        snap = pg.evaluate("""async () => {
            const s = await window.__shot;
            if (!s) return null;
            const im = new Image(); im.src = s.dataUrl; await im.decode();
            const c = document.createElement('canvas'); c.width = im.width; c.height = im.height;
            const x = c.getContext('2d'); x.drawImage(im, 0, 0);
            const d = x.getImageData(0, 0, c.width, c.height).data;
            let red = 0; for (let i = 0; i < d.length; i += 4) if (d[i] > 200 && d[i+1] < 60 && d[i+2] < 60) red++;
            return { w: s.w, h: s.h, red, count: window.LessonHistory.getCount() };
        }""")
        check(bool(snap) and snap["count"] == 1, f"ОГЭ №8: ранний снимок не потерялся {snap and {k: snap[k] for k in ('w','h','count')}}")
        if state["hasInk"]:
            check(bool(snap) and snap["red"] > 1000,
                  f"ОГЭ №8: в раннем снимке записи доски, сделанные до смены задания (красных точек {snap and snap['red']})")
        ctx.close()

        errors = []
        ctx, pg = new_page(b, errors)
        gate = Hold(pg, ["jspdf.umd.min.js"])
        pg.goto(f"{BASE}/oge8.html", wait_until="load")
        pg.wait_for_function("!!window.html2canvas", timeout=8000)
        pg.evaluate("window.LessonHistory.capture('single', document.querySelector('.wrap') || document.body)")
        pg.wait_for_function("window.LessonHistory.getCount() === 1", timeout=8000)
        check(pg.evaluate("!window.jspdf"), "ОГЭ №8: PDF просят, пока jsPDF ещё не пришёл")
        with pg.expect_download(timeout=15000) as dl:
            pg.evaluate("() => { window.__pdf = window.LessonHistory.downloadPdf(); }")
            pg.wait_for_timeout(300)
            gate.release()
        check(dl.value.suggested_filename.endswith(".pdf"), f"ОГЭ №8: PDF истории скачан ({dl.value.suggested_filename})")
        check(pg.evaluate("window.__pdf.then(v => v)") is True, "ОГЭ №8: downloadPdf вернул успех")
        check(not errors, f"ОГЭ №8: без ошибок JS {errors[:1]}")
        ctx.close()

        # ── конспект и доски: jsPDF по требованию, html2canvas у досок ──
        for p in ["notes", "boards"]:
            errors = []
            ctx, pg = new_page(b, errors)
            gate = Hold(pg, ["jspdf.umd.min.js", "html2canvas.min.js"])
            pg.goto(f"{BASE}/{p}.html", wait_until="load")
            pg.evaluate("() => { window.__j = window.MathhLibs.load('jspdf').then(l => typeof l.jsPDF); }")
            if p == "boards":
                pg.evaluate("""() => { window.__cap = (async () => {
                    const el = document.createElement('div');
                    el.style.cssText = 'position:absolute;left:0;top:0;width:200px;padding:20px;background:#fff';
                    el.textContent = 'Задание 1'; document.body.appendChild(el);
                    try { const r = await captureTrainerNode(el, null, {}); return !!r; }
                    catch (e) { return 'ошибка: ' + e.message; } finally { el.remove(); }
                })(); }""")
            pg.wait_for_timeout(300)
            gate.release()
            check(pg.evaluate("window.__j.then(v => v)") == "function", f"{p}: jsPDF дождались по требованию")
            if p == "boards":
                cap = pg.evaluate("window.__cap.then(v => v)")
                check(cap is True, f"доски: снимок задания дождался html2canvas ({cap})")
            check(not errors, f"{p}: без ошибок JS {errors[:1]}")
            ctx.close()

        # ── сбой сети не запоминается навсегда ──
        errors = []
        ctx, pg = new_page(b, errors)
        broken = {"on": True}
        pg.route("**/jspdf.umd.min.js",
                 lambda r: r.fulfill(status=503, body="") if broken["on"] else r.continue_())
        pg.goto(f"{BASE}/notes.html", wait_until="load")
        first = pg.evaluate("window.MathhLibs.load('jspdf').then(() => 'ok', e => 'ошибка')")
        broken["on"] = False
        second = pg.evaluate("window.MathhLibs.load('jspdf').then(l => typeof l.jsPDF, e => 'ошибка')")
        check(first == "ошибка" and second == "function",
              f"после сбоя сети следующая попытка скачивает заново ({first} → {second})")
        ctx.close()
        b.close()
    print()
    if fails:
        print("ПРОВАЛЫ:", len(fails))
        sys.exit(1)
    print("ИТОГ: всё прошло")


if __name__ == "__main__":
    run()
