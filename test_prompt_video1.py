"""
Видео на платформе, этап 1: плеер HLS (video-player.js), привязка
(video-links.js), кнопка «Смотреть разбор» в ОГЭ №1–5 у блока «Шины» и
скрипт нарезки tools/video/hls-upload.sh.

Проверяет:
  1. скрипт нарезки на тестовом ролике ffmpeg testsrc (без загрузки):
     master.m3u8 с тремя качествами 1080/720/360, сегменты по 4 с, каждый
     начинается с ключевого кадра, H.264 + AAC, постер, длительность и
     главы в готовой записи для video-links.js;
  2. эта нарезка — фикстур: её отдаёт второй локальный сервер с CORS только
     для адреса тренажёра (как бакет Cloud.ru), video-links.js подменяется
     так, что у видео шин стоит ссылка на фикстур;
  3. с настоящим video-links.js (ссылки ещё нет) кнопки нет нигде;
  4. кнопка есть у «Шины 1», «Шины 0», «Шин · ФИПИ» и нет у «Тарифов»;
  5. окно открывается, видео играет (currentTime растёт), hls.js, метки глав
     на полосе, скорость 1,5×, перемотка кнопками и стрелками, пробел —
     пауза, качество 360p из меню, цифры не попадают в поле ответа под
     окном;
  6. Esc закрывает окно, задание не тронуто (условие, введённый ответ,
     заголовок, теория), место остановки запомнено, при новом открытии —
     «Продолжаем с …» и видео с того же места;
  7. localStorage бросает исключение — плеер всё равно играет;
  8. телефон 375 px: окно во всю ширину, без горизонтальной прокрутки,
     кнопки управления не уезжают за край.

Играет видео только в настоящем Chrome (channel="chrome"): в Chromium из
playwright нет H.264. Настоящее воспроизведение из Cloud.ru (Mac, iPhone
Safari, Android, с VPN и без) проверяется руками на сайте.

Запуск: ~/.venvs/trainers/bin/python test_prompt_video1.py
"""
import contextlib
import functools
import http.client
import http.server
import json
import os
import re
import shutil
import subprocess
import sys
import tempfile
import threading
import time

from playwright.sync_api import sync_playwright

PORT = 9242
VPORT = 9243
BASE = f"http://127.0.0.1:{PORT}"
VBASE = f"http://127.0.0.1:{VPORT}"
HERE = os.path.dirname(os.path.abspath(__file__))
# slug видео шин и есть ли у него ссылка — из настоящего video-links.js в main():
# сейчас там тестовый ролик, потом будет разбор, тест от этого не зависит
SLUG = None
REAL_HAS_URL = False

results = []


def check(name, ok, extra=""):
    results.append((name, ok))
    print(f"[{'OK' if ok else 'FAIL'}] {name}" + (f": {extra}" if extra and not ok else ""))


@contextlib.contextmanager
def local_server():
    proc = subprocess.Popen([sys.executable, "-m", "http.server", str(PORT)], cwd=HERE,
                            stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    try:
        for _ in range(50):
            try:
                conn = http.client.HTTPConnection("127.0.0.1", PORT, timeout=0.2)
                conn.request("GET", "/index.html")
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


class VideoHandler(http.server.SimpleHTTPRequestHandler):
    """Как бакет: CORS только для адреса тренажёра, свои Content-Type."""
    extensions_map = dict(http.server.SimpleHTTPRequestHandler.extensions_map,
                          **{".m3u8": "application/vnd.apple.mpegurl", ".ts": "video/mp2t"})

    def end_headers(self):
        if self.headers.get("Origin") == BASE:
            self.send_header("Access-Control-Allow-Origin", BASE)
            self.send_header("Access-Control-Expose-Headers", "Content-Length, Content-Range, Content-Type, ETag, Accept-Ranges")
        super().end_headers()

    def log_message(self, *a):
        pass


@contextlib.contextmanager
def video_server(root):
    srv = http.server.ThreadingHTTPServer(("127.0.0.1", VPORT), functools.partial(VideoHandler, directory=root))
    th = threading.Thread(target=srv.serve_forever, daemon=True)
    th.start()
    try:
        yield
    finally:
        srv.shutdown()


def make_fixture(tmp):
    """Тестовый ролик и нарезка тем же скриптом, что для настоящих видео."""
    src = os.path.join(tmp, "test.mp4")
    subprocess.run(["ffmpeg", "-hide_banner", "-loglevel", "error", "-y",
                    "-f", "lavfi", "-i", "testsrc2=size=1920x1080:rate=30:duration=20",
                    "-f", "lavfi", "-i", "sine=frequency=440:duration=20",
                    "-c:v", "libx264", "-pix_fmt", "yuv420p", "-c:a", "aac", "-shortest", src], check=True)
    ch = os.path.join(tmp, "chapters.txt")
    with open(ch, "w", encoding="utf-8") as f:
        f.write("0:00 Задание 1 — ширина\n0:06 Задание 2 — боковина\n0:12 Задание 3 — диаметр\n")
    out_root = os.path.join(tmp, "out")
    env = dict(os.environ, MATHH_VIDEO_OUT=out_root)
    r = subprocess.run([os.path.join(HERE, "tools", "video", "hls-upload.sh"), src, SLUG, "--chapters", ch, "--no-upload"],
                       env=env, capture_output=True, text=True)
    check("скрипт: нарезка без загрузки завершилась без ошибки", r.returncode == 0, r.stderr[-400:])
    vers = os.listdir(os.path.join(out_root, SLUG))
    d = os.path.join(out_root, SLUG, vers[0])
    master = open(os.path.join(d, "master.m3u8")).read()
    check("скрипт: master.m3u8 — 1080p, 720p, 360p",
          all(f"{h}p/index.m3u8" in master for h in (1080, 720, 360))
          and "RESOLUTION=1920x1080" in master and "RESOLUTION=640x360" in master, master)
    bw = [int(x) for x in re.findall(r"AVERAGE-BANDWIDTH=(\d+)", master)]
    check("скрипт: средний битрейт качеств не выше потолков 2,5 / 1,2 / 0,5 Мбит/с (+звук)",
          len(bw) == 3 and bw[0] < 2_900_000 and bw[1] < 1_450_000 and bw[2] < 700_000, str(bw))
    pl = open(os.path.join(d, "720p", "index.m3u8")).read()
    durs = [float(x) for x in re.findall(r"#EXTINF:([\d.]+)", pl)]
    check("скрипт: сегменты по 4 с, плейлист VOD",
          len(durs) == 5 and all(abs(x - 4) < 0.05 for x in durs) and "#EXT-X-PLAYLIST-TYPE:VOD" in pl, str(durs))
    # первый кадр каждого сегмента — ключевой: иначе перемотка и смена качества промахиваются
    bad = []
    for q in ("1080p", "360p"):
        for seg in sorted(x for x in os.listdir(os.path.join(d, q)) if x.endswith(".ts")):
            # флаг K у первого пакета; pict_type не годится — у первого сегмента
            # ffprobe дописывает к нему побочные данные через запятую
            fr = subprocess.run(["ffprobe", "-v", "error", "-select_streams", "v:0", "-show_entries", "packet=flags",
                                 "-of", "csv=p=0", "-read_intervals", "%+#1", os.path.join(d, q, seg)],
                                capture_output=True, text=True).stdout.split()
            if not fr or not fr[0].startswith("K"):
                bad.append(q + "/" + seg)
    check("скрипт: каждый сегмент начинается с ключевого кадра", not bad, str(bad))
    codecs = subprocess.run(["ffprobe", "-v", "error", "-show_entries", "stream=codec_name,profile", "-of", "csv=p=0",
                             os.path.join(d, "720p", "seg_0000.ts")], capture_output=True, text=True).stdout
    check("скрипт: H.264 High и AAC", "h264,High" in codecs and "aac" in codecs, codecs)
    check("скрипт: постер jpg", os.path.getsize(os.path.join(d, "poster.jpg")) > 2000)
    check("скрипт: длительность 20 с и главы в записи для video-links.js",
          "duration: 20," in r.stdout and "{ t: 6, title: 'Задание 2 — боковина' }" in r.stdout
          and f"https://mathh-video.s3.cloud.ru/{SLUG}/{vers[0]}/master.m3u8" in r.stdout, r.stdout[-600:])
    return out_root, f"{SLUG}/{vers[0]}"


def tire_video(src):
    """Запись videos, к которой сейчас привязан блок шин, — (начало, конец, текст)."""
    slug = re.search(r"video_slug: '([^']+)', page: 'oge1_5', block_key: 'tire'", src).group(1)
    i = src.index(f"{{ slug: '{slug}'")
    j = src.index("] },", i) + len("] },")
    return i, j, src[i:j]


def patched_links(rel):
    """video-links.js, где у видео шин ссылка на локальный фикстур (какой бы ролик ни был привязан)."""
    src = open(os.path.join(HERE, "video-links.js"), encoding="utf-8").read()
    i, j, entry = tire_video(src)
    entry = re.sub(r"hls_url: '[^']*'", f"hls_url: '{VBASE}/{rel}/master.m3u8'", entry)
    entry = re.sub(r"poster_url: '[^']*'", f"poster_url: '{VBASE}/{rel}/poster.jpg'", entry)
    entry = re.sub(r"title: '[^']*'", "title: 'Шины: разбор заданий 1–5'", entry, count=1)
    entry = re.sub(r"duration: \d+", "duration: 20", entry)
    entry = re.sub(r"chapters: \[.*\] \},$", "chapters: [{ t: 0, title: 'Задание 1 — ширина' }, { t: 6, title: 'Задание 2 — боковина' }, { t: 12, title: 'Задание 3 — диаметр' }] },", entry, flags=re.S)
    src = src[:i] + entry + src[j:]
    assert VBASE in src
    return src


def open_mode(page, mode_id):
    page.goto(BASE + "/oge1_5.html")
    page.wait_for_selector(f'.mode-card[data-id="{mode_id}"]')
    page.click(f'.mode-card[data-id="{mode_id}"]')
    page.wait_for_selector("#taskArea", state="visible")


def btn_visible(page):
    return page.evaluate("() => { const r = document.getElementById('videoRow'); const b = document.getElementById('videoBtn');"
                         " return !!(r && !r.hidden && b && b.offsetParent && b.style.display !== 'none'); }")


def vt(page):
    return page.evaluate("() => document.querySelector('.vp-video').currentTime")


def wait_time(page, cond, timeout=8):
    t0 = time.time()
    while time.time() - t0 < timeout:
        if cond(vt(page)):
            return True
        time.sleep(0.1)
    return False


def main():
    global SLUG, REAL_HAS_URL
    real = open(os.path.join(HERE, "video-links.js"), encoding="utf-8").read()
    entry = tire_video(real)[2]
    SLUG = re.search(r"slug: '([^']+)'", entry).group(1)
    REAL_HAS_URL = not re.search(r"hls_url: ''", entry)
    tmp = tempfile.mkdtemp(prefix="video1_")
    try:
        root, rel = make_fixture(tmp)
        links_js = patched_links(rel)
        with local_server(), video_server(root), sync_playwright() as p:
            browser = p.chromium.launch(channel="chrome")
            errors = []

            # 3. настоящий конфиг: кнопка у шин есть ровно тогда, когда у их видео есть ссылка
            ctx = browser.new_context()
            page = ctx.new_page()
            page.on("pageerror", lambda e: errors.append(str(e)))
            open_mode(page, "tire_set1")
            check("настоящий video-links.js: кнопка у шин — только если у видео есть ссылка",
                  btn_visible(page) == REAL_HAS_URL)
            ctx.close()

            # 4–6. с фикстуром
            ctx = browser.new_context()
            ctx.route("**/video-links.js", lambda r: r.fulfill(body=links_js, content_type="text/javascript; charset=utf-8"))
            page = ctx.new_page()
            page.on("pageerror", lambda e: errors.append(str(e)))
            for mid in ("tire_set1", "tire_demo2027"):
                open_mode(page, mid)
                check(f"кнопка «Смотреть разбор» есть у {mid}", btn_visible(page)
                      and page.inner_text("#videoBtn").strip() == "Смотреть разбор")
            # «Шины · ФИПИ» — только с ?all=1, пока ответы не сверены
            page.goto(BASE + "/oge1_5.html?all=1")
            page.click('.mode-card[data-id="tire_fipi"]')
            page.wait_for_selector("#taskArea", state="visible")
            check("кнопка есть у «Шин · ФИПИ»", btn_visible(page))
            open_mode(page, "tariff1")
            check("у «Тарифов» кнопки нет (видео не привязано)", not btn_visible(page))
            page.click("#backBtn")
            page.click('.mode-card[data-id="tire_set1"]')
            check("назад и снова в шины — кнопка вернулась", btn_visible(page))

            # состояние задания до открытия
            page.click("#theoryToggleBtn")
            before = page.evaluate("""() => ({ prompt: document.getElementById('questionPromptText').innerHTML,
                title: document.getElementById('taskTitle').textContent,
                theory: document.getElementById('theoryContent').style.display })""")
            inp_visible = page.is_visible("#answerInput")
            if inp_visible:
                page.fill("#answerInput", "123")

            page.click("#videoBtn")
            page.wait_for_selector("#videoPlayer")
            ok = page.wait_for_function("() => window.VideoPlayer.mode() === 'hls.js' && document.querySelector('.vp-video').readyState >= 1",
                                        timeout=15000)
            check("окно открылось, видео подключено через hls.js", bool(ok))
            check("заголовок окна — название видео", page.inner_text(".vp-title") == "Шины: разбор заданий 1–5")
            check("на полосе две метки глав (глава с нуля — не метка)", page.locator(".vp-tick").count() == 2)
            page.click(".vp-play")
            check("видео играет: currentTime растёт", wait_time(page, lambda t: t > 1.0))

            page.click(".vp-rate")
            items = page.eval_on_selector_all(".vp-menu:not([hidden]) button", "bs => bs.map(b => b.textContent)")
            check("скорость: 0,75× … 2×", items == ["0,75×", "1×", "1,25×", "1,5×", "1,75×", "2×"], str(items))
            page.click('.vp-menu:not([hidden]) button[data-value="1.5"]')
            rate = page.evaluate("() => [document.querySelector('.vp-video').playbackRate, localStorage.getItem('videoRate')]")
            check("скорость 1,5× включена и запомнена", rate == [1.5, "1.5"], str(rate))

            page.click(".vp-quality")
            qs = page.eval_on_selector_all(".vp-menu:not([hidden]) button", "bs => bs.map(b => b.textContent)")
            check("качество: Авто, 1080p, 720p, 360p", qs == ["Авто", "1080p", "720p", "360p"], str(qs))
            page.click('.vp-menu:not([hidden]) button:has-text("360p")')
            page.wait_for_timeout(300)
            check("качество 360p выбрано", page.inner_text(".vp-quality").strip() == "360p", page.inner_text(".vp-quality"))

            # перемотка кнопкой и стрелками
            t0 = vt(page)
            page.click(".vp-fwd")
            check("+10 с кнопкой", wait_time(page, lambda t: t >= t0 + 9.5, 3), f"{t0} → {vt(page)}")
            t1 = vt(page)
            page.keyboard.press("ArrowLeft")
            check("← назад на 10 с", wait_time(page, lambda t: t <= t1 - 9 and t >= t1 - 11, 3), f"{t1} → {vt(page)}")
            page.keyboard.press("ArrowRight")
            check("→ вперёд на 10 с", wait_time(page, lambda t: t >= t1 - 0.5, 3), f"{t1} → {vt(page)}")
            page.keyboard.press(" ")
            page.wait_for_timeout(200)
            check("пробел — пауза", page.evaluate("() => document.querySelector('.vp-video').paused"))
            page.keyboard.press(" ")
            page.wait_for_timeout(200)
            check("пробел — снова играет", not page.evaluate("() => document.querySelector('.vp-video').paused"))
            if inp_visible:
                page.keyboard.press("7")
                check("цифра при открытом окне не попадает в ответ под ним", page.input_value("#answerInput") == "123")

            # пауза на известном месте и Esc
            page.keyboard.press(" ")
            page.evaluate("() => { const v = document.querySelector('.vp-video'); v.currentTime = 8.4; }")
            page.wait_for_timeout(400)
            page.keyboard.press("Escape")
            page.wait_for_timeout(200)
            check("Esc закрыл окно", page.locator("#videoPlayer").count() == 0 and not page.evaluate("() => VideoPlayer.isOpen()"))
            after = page.evaluate("""() => ({ prompt: document.getElementById('questionPromptText').innerHTML,
                title: document.getElementById('taskTitle').textContent,
                theory: document.getElementById('theoryContent').style.display })""")
            check("задание после закрытия не тронуто (условие, заголовок, открытая теория)", after == before)
            if inp_visible:
                check("введённый ответ на месте", page.input_value("#answerInput") == "123")
            check("страница снова прокручивается", not page.evaluate("() => document.documentElement.classList.contains('vp-lock')"))
            pos = page.evaluate(f"() => JSON.parse(localStorage.getItem('videoPos:{SLUG}') || 'null')")
            check("место остановки запомнено", bool(pos) and pos["t"] == 8, str(pos))

            page.click("#videoBtn")
            page.wait_for_selector(".vp-resume:not([hidden])", timeout=15000)
            check("при новом открытии — «Продолжаем с 0:08»", page.inner_text(".vp-resume span") == "Продолжаем с 0:08")
            page.wait_for_function("() => document.querySelector('.vp-video').readyState >= 1", timeout=15000)
            check("видео стоит на запомненном месте", wait_time(page, lambda t: 7.5 <= t <= 9, 5), str(vt(page)))
            check("скорость 1,5× помнится между открытиями",
                  page.evaluate("() => document.querySelector('.vp-video').playbackRate") == 1.5)
            page.click(".vp-close")
            check("✕ закрывает окно", page.locator("#videoPlayer").count() == 0)
            ctx.close()

            # 7. localStorage бросает исключение
            ctx = browser.new_context()
            ctx.route("**/video-links.js", lambda r: r.fulfill(body=links_js, content_type="text/javascript; charset=utf-8"))
            ctx.add_init_script("""(() => { const bad = () => { throw new Error('storage off'); };
                Storage.prototype.getItem = bad; Storage.prototype.setItem = bad; Storage.prototype.removeItem = bad; })();""")
            page = ctx.new_page()
            errs7 = []
            page.on("pageerror", lambda e: errs7.append(str(e)))
            open_mode(page, "tire_set1")
            page.click("#videoBtn")
            page.wait_for_function("() => document.querySelector('.vp-video') && document.querySelector('.vp-video').readyState >= 1", timeout=15000)
            page.click(".vp-play")
            ok7 = wait_time(page, lambda t: t > 0.8)
            page.keyboard.press("Escape")
            vp_errs = [e for e in errs7 if "vp-" in e or "VideoPlayer" in e or "video-player" in e]
            check("без localStorage плеер играет и закрывается без ошибок", ok7 and not vp_errs, str(errs7))
            ctx.close()

            # 8. телефон
            ctx = browser.new_context(viewport={"width": 375, "height": 740}, is_mobile=True, has_touch=True)
            ctx.route("**/video-links.js", lambda r: r.fulfill(body=links_js, content_type="text/javascript; charset=utf-8"))
            page = ctx.new_page()
            page.on("pageerror", lambda e: errors.append(str(e)))
            open_mode(page, "tire_set1")
            check("телефон: кнопка видна", btn_visible(page))
            page.tap("#videoBtn")
            page.wait_for_selector("#videoPlayer")
            page.wait_for_timeout(500)
            geo = page.evaluate("""() => { const b = document.querySelector('.vp-box').getBoundingClientRect();
                const btns = [...document.querySelectorAll('.vp-controls .vp-btn, .vp-close')].filter(x => x.offsetParent);
                return { w: b.width, left: b.left, sw: document.documentElement.scrollWidth,
                         out: btns.filter(x => { const r = x.getBoundingClientRect(); return r.right > 375.5 || r.left < -0.5 || r.bottom > innerHeight; }).length,
                         small: btns.filter(x => x.getBoundingClientRect().height < 44).length }; }""")
            check("телефон: окно во всю ширину, без горизонтальной прокрутки",
                  abs(geo["w"] - 375) < 1 and abs(geo["left"]) < 1 and geo["sw"] <= 375, str(geo))
            check("телефон: кнопки управления в экране и не меньше 44 px", geo["out"] == 0 and geo["small"] == 0, str(geo))
            ctx.close()

            vp_errs = [e for e in errors if "vp-" in e or "VideoPlayer" in e or "video" in e.lower()]
            check("нет ошибок JavaScript от плеера", not vp_errs, str(errors[:5]))
            browser.close()
    finally:
        shutil.rmtree(tmp, ignore_errors=True)

    failed = [n for n, ok in results if not ok]
    print(f"\n{len(results) - len(failed)}/{len(results)} OK")
    sys.exit(1 if failed else 0)


if __name__ == "__main__":
    main()
