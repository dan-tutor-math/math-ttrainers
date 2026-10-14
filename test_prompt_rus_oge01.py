"""
Тренажёр «ОГЭ. Русский язык, №1 — сжатое изложение» (rus_oge01.html).

Проверяет:
  1. данные rus-oge01-fipi.js целы: 43 задания, у каждого аудио ФИПИ на месте,
     текст из трёх абзацев-микротем, формулировка каждой микротемы, образец из
     трёх абзацев не меньше 70 слов и заметно короче текста;
  2. экран выбора: 43 карточки с автором и длиной записи, начала текста нет;
     карточка и адрес ?t=… открывают запись, ◀ ▶ по кругу, «←» к списку;
  3. «Экзамен»: прослушать можно ровно два раза, без паузы и перемотки, таймер
     идёт с первого прослушивания; «Сдать» закрывает поле и открывает текст по
     микротемам, образец и критерии;
  4. «Тренировка»: пауза и перемотка работают, слушать можно сколько угодно;
     «Показать текст», «Показать образец», микротема образца подсвечивает свой
     абзац; самопроверка ИК1–ИК3 считает итог из 6, меньше 70 слов — 0;
     черновик и заметки переживают перезагрузку;
  5. тёмная тема и ширина телефона — без ошибок JS и без горизонтальной прокрутки.

Совместного режима у этой страницы нет — проверять на сайте руками нечего.
Звук в безголовом браузере не слышен, но играет по-настоящему: проверяем по
currentTime и событию ended.

Запуск: python3 test_prompt_rus_oge01.py (сервер поднимается сам).
"""
import contextlib
import http.client
import os
import re
import subprocess
import sys
import time

from playwright.sync_api import sync_playwright

PORT = 8995
BASE = f"http://127.0.0.1:{PORT}"
HERE = os.path.dirname(os.path.abspath(__file__))
FAILS = []


def check(cond, msg):
    print(("  ok  " if cond else "  FAIL ") + msg)
    if not cond:
        FAILS.append(msg)


# Встроенный http.server не умеет Range-запросы, а без них браузер не перематывает
# аудио (GitHub Pages умеет). Поэтому сервер свой: тот же http.server плюс Range.
RANGE_SERVER = r"""
import http.server, os, re, sys
class H(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *a): pass
    def send_head(self):
        rng = self.headers.get('Range')
        path = self.translate_path(self.path)
        if not rng or not os.path.isfile(path):
            return super().send_head()
        size = os.path.getsize(path)
        m = re.match(r'bytes=(\d*)-(\d*)', rng)
        a = int(m.group(1) or 0); b = int(m.group(2)) if m.group(2) else size - 1
        b = min(b, size - 1)
        f = open(path, 'rb'); f.seek(a)
        self.send_response(206)
        self.send_header('Content-Type', self.guess_type(path))
        self.send_header('Accept-Ranges', 'bytes')
        self.send_header('Content-Range', f'bytes {a}-{b}/{size}')
        self.send_header('Content-Length', str(b - a + 1))
        self.end_headers()
        self._left = b - a + 1
        return f
    def copyfile(self, src, dst):
        left = getattr(self, '_left', None)
        if left is None: return super().copyfile(src, dst)
        while left > 0:
            chunk = src.read(min(65536, left))
            if not chunk: break
            dst.write(chunk); left -= len(chunk)
http.server.ThreadingHTTPServer(('127.0.0.1', int(sys.argv[1])), H).serve_forever()
"""


@contextlib.contextmanager
def local_server():
    proc = subprocess.Popen(
        [sys.executable, "-c", RANGE_SERVER, str(PORT)], cwd=HERE,
        stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL,
    )
    try:
        for _ in range(50):
            try:
                conn = http.client.HTTPConnection("127.0.0.1", PORT, timeout=0.2)
                conn.request("GET", "/rus_oge01.html")
                conn.getresponse()
                break
            except Exception:
                time.sleep(0.1)
        else:
            raise RuntimeError("локальный сервер не поднялся")
        yield
    finally:
        proc.terminate()


def words(s):
    return len(re.findall(r"[0-9A-Za-zА-Яа-яЁё]+(?:-[0-9A-Za-zА-Яа-яЁё]+)*", s))


ESSAY = ("Автор размышляет о том, что важно для каждого человека. "
         "Он считает, что главное — уметь видеть и ценить то, что рядом. ") * 3 + \
        "\n\nВторая мысль текста связана с тем, что человек меняется, когда помогает другим. " * 2 + \
        "\n\nТаким образом, автор приходит к выводу, что доброта и внимание делают жизнь лучше."


def play_to_end(pg):
    # дослушивать три минуты незачем: перематываем изнутри к самому концу и ждём ended
    pg.wait_for_function("window.__rusOge01.audio.duration > 0 && !window.__rusOge01.audio.paused", timeout=10000)
    pg.evaluate("(() => { const a = window.__rusOge01.audio; a.currentTime = a.duration - 0.3; })()")
    pg.wait_for_function("!window.__rusOge01.S.playing", timeout=10000)


def main():
    errors = []
    with local_server(), sync_playwright() as p:
        b = p.chromium.launch(args=["--autoplay-policy=no-user-gesture-required"])

        def new_page(w=1100, h=900, theme="light", mode=None):
            ctx = b.new_context(viewport={"width": w, "height": h})
            pg = ctx.new_page()
            pg.on("pageerror", lambda e: errors.append(str(e)))
            init = f"try{{localStorage.setItem('theme','{theme}')"
            if mode:
                init += f";if(!sessionStorage.getItem('m')){{localStorage.setItem('rusOge01:mode','\"{mode}\"');sessionStorage.setItem('m','1')}}"
            pg.add_init_script(init + "}catch(e){}")
            return pg

        print("1. данные")
        pg = new_page()
        pg.goto(BASE + "/rus_oge01.html")
        D = pg.evaluate("window.RUS_OGE01")
        tasks = D["tasks"]
        check(len(tasks) == 43, f"заданий 43 ({len(tasks)})")
        check(len({t["id"].lower() for t in tasks}) == len(tasks), "id не совпадают даже без учёта регистра (имена mp3 на Маке)")
        bad = []
        for t in tasks:
            if not os.path.exists(os.path.join(HERE, t["a"])):
                bad.append(t["id"] + " нет mp3")
            if len(t["p"]) != 3 or len(t["mt"]) != 3 or len(t.get("s") or []) != 3:
                bad.append(t["id"] + " не три микротемы")
                continue
            tw, sw = words(" ".join(t["p"])), words(" ".join(x["t"] for x in t["s"]))
            if sw < 70:
                bad.append(f"{t['id']} образец {sw} слов")
            if sw > tw * 0.75:
                bad.append(f"{t['id']} образец почти не сжат ({sw} из {tw})")
            # автора называют не во всех записях («По материалам интернета» или никак) — au может быть пустым
            if any(not x["k"] for x in t["s"]) or any(not m for m in t["mt"]) or not t.get("dur"):
                bad.append(t["id"] + " пустые поля")
        check(not bad, f"у всех 43 аудио, три микротемы и сжатый образец {bad[:5]}")
        sizes = [os.path.getsize(os.path.join(HERE, t["a"])) for t in tasks if os.path.exists(os.path.join(HERE, t["a"]))]
        check(sizes and max(sizes) < 2_000_000, f"аудио сжато для сайта (самое большое {max(sizes or [0]) // 1024} КБ)")

        print("2. список и навигация")
        check(pg.eval_on_selector_all("#textsGrid .mode-card", "els => els.length") == 43, "в списке 43 записи")
        card = pg.inner_text("#textsGrid .mode-card[data-i='0']")
        check("аудио" in card and "Л.В. Успенский. «С самого раннего детства и…»" in card,
              f"в карточке название «И.О. Фамилия. «Первые слова…»» и длина ({card.strip()[:70]})")
        names = pg.eval_on_selector_all("#textsGrid .mode-card .mtitle", "els => els.map(e => e.textContent)")
        odd = [n for n in names if not re.match(r"^(?:(?:[А-ЯЁ]\.)+ [А-ЯЁ][а-яё]+\. )?«.+»$", n)]
        check(not odd, f"все 43 названия в одном формате {odd[:5]}")
        check("Н.П. Крыщук. «Испытания ждут дружбу всегда»" in names, "автор, которого нет в записи ФИПИ, дописан (Крыщук)")
        check("И.А. Ефремов. «Мне повезло с учителями»" in names, "первые слова — только из первого предложения")
        check(pg.get_attribute("#homeBtn", "href") == "index.html?subject=rus", "«домой» — на русский язык главной")
        pg.click("#textsGrid .mode-card[data-i='3']")
        check(f"t={tasks[3]['id']}" in pg.url and pg.inner_text("#taskTitle") == "текст 4 из 43", "карточка открывает запись, адрес с ?t=")
        pg.goto(BASE + f"/rus_oge01.html?t={tasks[0]['id']}")
        pg.click("#prevBtn")
        check(pg.evaluate("window.__rusOge01.S.idx") == 42, "◀ с первой — на последнюю")
        pg.click("#nextBtnTop")
        check(pg.evaluate("window.__rusOge01.S.idx") == 0, "▶ с последней — на первую")
        pg.click("#backBtn")
        check(pg.is_visible("#pickerArea") and "t=" not in pg.url, "«←» возвращает к списку")

        print("3. «Экзамен»: два прослушивания")
        pg = new_page(mode="exam")
        t = tasks[1]
        pg.goto(BASE + f"/rus_oge01.html?t={t['id']}")
        check(pg.is_disabled("#plBar"), "перемотки нет")
        check(pg.query_selector("#textBtn") is None and pg.query_selector("#sampleBtn") is None, "текста и образца до сдачи нет")
        pg.click("#playBtn")
        pg.wait_for_function("window.__rusOge01.audio.currentTime > 0.3", timeout=10000)
        check(pg.evaluate("window.__rusOge01.audio.src").endswith(t["a"]), "играет запись этого задания")
        pg.click("#playBtn")
        pg.wait_for_timeout(300)
        check(not pg.evaluate("window.__rusOge01.audio.paused"), "паузы нет: повторное нажатие не останавливает")
        check("Прослушивание 1 из 2" in pg.inner_text("#plLabel"), "подпись «1 из 2»")
        check(pg.inner_text("#timer").startswith("⏱"), "таймер пошёл с первого прослушивания")
        play_to_end(pg)
        check(pg.inner_text("#plLabel") == "Прослушать второй раз", "после первого — «Прослушать второй раз»")
        check(pg.eval_on_selector_all("#plays i.on", "e => e.length") == 1, "отмечено одно прослушивание")
        pg.click("#playBtn")
        pg.wait_for_function("window.__rusOge01.audio.currentTime > 0.3 && window.__rusOge01.audio.currentTime < 5", timeout=10000)
        check(True, "второе прослушивание — с начала")
        play_to_end(pg)
        check(pg.is_disabled("#playBtn") and "два раза" in pg.inner_text("#plLabel"), "после двух прослушиваний кнопка выключена")
        pg.click("#submitBtn", force=True)
        check(pg.inner_text("#wc") == "Сначала напиши изложение", "пустое не сдаётся")
        pg.fill("#essay", ESSAY)
        pg.click("#submitBtn")
        check(pg.evaluate("document.getElementById('essay').readOnly") and pg.inner_text("#submitBtn") == "Сдано", "после «Сдать» поле закрыто")
        check(pg.eval_on_selector_all("#textArea .mt", "e => e.length") == 3, "открылся текст по трём микротемам")
        check(pg.is_visible("#sampleArea .sample") and pg.eval_on_selector_all(".crit-row", "e => e.length") == 3, "открылись образец и критерии ИК1–ИК3")
        check(pg.is_visible("#nextBtn"), "есть «Следующий текст»")

        print("4. «Тренировка»")
        pg = new_page(mode="practice")
        t = tasks[2]
        pg.goto(BASE + f"/rus_oge01.html?t={t['id']}")
        check(not pg.is_disabled("#plBar") and pg.query_selector("#plays") is None, "перемотка есть, счётчика прослушиваний нет")
        pg.click("#playBtn")
        pg.wait_for_function("window.__rusOge01.audio.currentTime > 0.3", timeout=10000)
        pg.click("#playBtn")
        check(pg.evaluate("window.__rusOge01.audio.paused"), "пауза работает")
        pg.eval_on_selector("#plBar", "e => { e.value = 500; e.dispatchEvent(new Event('input')); }")
        pos = pg.evaluate("window.__rusOge01.audio.currentTime / window.__rusOge01.audio.duration")
        check(0.45 < pos < 0.55, f"перемотка на середину ({pos:.2f})")
        pg.click("#playBtn")
        play_to_end(pg)
        pg.click("#playBtn")
        pg.wait_for_function("window.__rusOge01.audio.currentTime > 0.3 && window.__rusOge01.audio.currentTime < 5", timeout=10000)
        check(True, "дослушал — можно слушать снова с начала")
        pg.click("#textBtn")
        heads = pg.eval_on_selector_all(".mt-sum", "els => els.map(e => e.textContent)")
        check(heads == t["mt"], "текст открыт по микротемам с их формулировками")
        pg.click("#sampleBtn")
        check(pg.eval_on_selector_all("#sampleArea .sp", "e => e.length") == 3, "образец из трёх абзацев")
        pg.click("#sampleArea .tag.ex[data-k='2']")
        check(pg.eval_on_selector_all(".mt.hl", "els => els.map(e => e.dataset.k)") == ["2"], "микротема образца подсвечивает свой абзац")
        check(not pg.is_visible("#notes"), "заметки свёрнуты, пока пустые")
        pg.click(".notes-box summary")
        pg.fill("#notes", "заметка")
        pg.fill("#essay", "Коротко.")
        pg.click("#checkBtn")
        for c in ("ik1", "ik2", "ik3"):
            pg.click(f".crit-opt[data-c='{c}']")
        check(pg.inner_text("#critTotal") == "Итого: 0 из 6", "меньше 70 слов — 0")
        pg.fill("#essay", ESSAY)
        pg.click("#checkBtn")
        for c in ("ik1", "ik2", "ik3"):
            pg.click(f".crit-opt[data-c='{c}']")
        check(pg.inner_text("#critTotal") == "Итого: 6 из 6", "всё на максимум — 6 из 6")
        pg.click(".crit-opt[data-c='ik2'][data-v='1']")
        check(pg.inner_text("#critTotal") == "Итого: 5 из 6", "ИК2 = 1 — 5 из 6")
        res = pg.evaluate("JSON.parse(localStorage.getItem('rusOge01:results'))")
        check(res.get(t["id"], {}).get("sc") == 5, f"итог сохранён {res.get(t['id'])}")
        pg.reload()
        check(pg.input_value("#essay") == ESSAY and pg.input_value("#notes") == "заметка" and pg.is_visible("#notes"),
              "черновик и заметки пережили перезагрузку, непустые заметки раскрыты")
        pg.click("#backBtn")
        check("5 из 6" in pg.inner_text("#textsGrid .mode-card[data-i='2'] .mprog"), "в списке отметка у записи")
        pg.click("#textsGrid .mode-card[data-i='2']")
        pg.click("#playBtn")
        pg.wait_for_function("window.__rusOge01.audio.currentTime > 0.3", timeout=10000)
        pg.click("#backBtn")
        check(pg.evaluate("window.__rusOge01.audio.paused"), "уход к списку останавливает звук")

        print("5. тёмная тема и телефон")
        for theme in ("light", "dark"):
            pg = new_page(390, 800, theme, mode="practice")
            pg.goto(BASE + "/rus_oge01.html")
            check(pg.evaluate("document.documentElement.scrollWidth") <= 390, f"{theme}: список без горизонтальной прокрутки")
            pg.goto(BASE + f"/rus_oge01.html?t={tasks[20]['id']}")
            pg.fill("#essay", ESSAY)
            pg.click("#textBtn"); pg.click("#sampleBtn"); pg.click("#checkBtn")
            sw = pg.evaluate("document.documentElement.scrollWidth")
            check(sw <= 390, f"{theme}: изложение с текстом, образцом и критериями без прокрутки ({sw})")
        b.close()

    check(not errors, f"ошибок JS нет {errors[:3]}")
    print("\nИТОГ:", "всё прошло" if not FAILS else f"провалов {len(FAILS)}")
    sys.exit(1 if FAILS else 0)


if __name__ == "__main__":
    main()
