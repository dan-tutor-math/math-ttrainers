"""
Промпт №78 «демонстрация»: три правки совместного режима после живого урока.

  1. Справочные материалы (кнопка в правом нижнем углу доски, окошко с
     картинкой или текстом) ученику на демонстрации доски не было видно.
     Теперь кнопка у ученика есть, панель повторяет учительскую (открыта,
     вкладка, текст, картинки), ученик может сам открыть и свернуть её у
     себя; учитель открыл или свернул свою — у ученика снова как у учителя.
  2. Учитель перешёл с главной на доску — у ученика минутами крутилась
     загрузка. Причина: доска уходила залпом в буфер сокета учителя быстрее,
     чем его сеть отдаёт, «пульс» библиотеки застревал за ней, сокет рвался,
     а ученик просил всю доску заново. Теперь доска сжата, идёт в темпе сети
     (по забитости буфера), потерянная часть дозапрашивается по номеру,
     пришедший посреди рассылки не запускает её заново, видны проценты.
  3. Ученик в сессии менял себе светлую/тёмную тему, у учителя ничего не
     менялось. Теперь у ученика кнопки темы нет, тема всегда учительская.

Заглушка Supabase — из теста №11 (доработка сцены) плюс «медленная отдача
учителя»: сообщения уходят со скоростью __fakeUplinkBps байт в секунду, а
bufferedAmount сокета виден странице так же, как у настоящего.
Живой realtime отсюда недоступен — на сайте всё перепроверяется руками.

Запуск: python3 test_prompt78_demo_fixes.py
"""
import sys
import time

from playwright.sync_api import sync_playwright

import test_prompt11_shared_screen as t11
import test_prompt11_stage_polish as P
import test_prompt11_board_stage as BS
import test_prompt54_trainer_sync_and_cards as t54

PORT = 8978
t11.PORT = PORT
t11.BASE = P.BASE = BS.BASE = BASE = f"http://127.0.0.1:{PORT}"
failures = t11.failures
errors = t11.errors
check = t11.check
wait_js = BS.wait_js

# медленная отдача: очередь исходящих с подсчётом байт, как буфер сокета;
# __fakeDrop — выбросить сообщение (потерялось в сети)
FAKE = P.FAKE.replace(
    "const m = clone(msg);",
    "const m = clone(msg); window.__fakeCount && window.__fakeCount(m);"
    " if (window.__fakeDrop && window.__fakeDrop(m)) return Promise.resolve('ok');"
    " if (window.__fakeUplinkBps) { window.__fakeUp(bc, m); return Promise.resolve('ok'); }",
    1,
).replace(
    "removeChannel(ch){",
    "realtime: { socketAdapter: { socket: { conn: window.__fakeConn } } },\n    removeChannel(ch){",
    1,
)
assert "__fakeUp(bc" in FAKE and "socketAdapter" in FAKE
FAKE = r"""
window.__fakeConn = { bufferedAmount: 0 };
window.__fakeUp = (bc, m) => {
  const n = JSON.stringify(m).length, c = window.__fakeConn;
  c.bufferedAmount += n;
  window.__fakeMaxBuf = Math.max(window.__fakeMaxBuf || 0, c.bufferedAmount);
  const now = performance.now();
  const done = Math.max(now, window.__fakeUpFree || 0) + n / window.__fakeUplinkBps * 1000;
  window.__fakeUpFree = done;
  window.__fakeMaxWait = Math.max(window.__fakeMaxWait || 0, done - now);
  window.__fakeUpBytes = (window.__fakeUpBytes || 0) + n;
  setTimeout(() => { c.bufferedAmount -= n; try { bc.postMessage(m); } catch (e) {} }, done - now);
};
window.__fakeCount = (m) => {
  if (m.event !== 'ev' || !m.payload) return;
  const nm = m.payload.name, d = m.payload.data || {};
  const ev = (window.__fakeEvN = window.__fakeEvN || {});
  ev[nm] = (ev[nm] || 0) + 1;
  if (nm === 'bd_meta' && d.bid) (window.__fakeSyncs = window.__fakeSyncs || []).push(d.sync);
  if (nm === 'bd_chunk') (window.__fakeChunkIdx = window.__fakeChunkIdx || []).push(d.i);
};
""" + FAKE

# большая доска: 2500 штрихов по 40 точек с «грязными» координатами, как из
# событий мыши, — несколько мегабайт; и маленькая — для справочной панели
SEED_JS = """() => new Promise((resolve, reject) => {
  let s = 11; const rnd = () => { s = (s * 1103515245 + 12345) & 0x7fffffff; return s / 0x7fffffff; };
  const pen = (id, x, y, n) => ({ id, type: 'pen', color: '--pencil', width: 3,
    points: Array.from({ length: n }, (_, i) => ({ x: x + i * 4 + rnd() * 0.987654321, y: y + Math.sin(i / 4) * 12 + rnd() * 0.123456789 })) });
  const lite = (id, name) => ({ id, name, folderId: null, createdAt: 1000, updatedAt: 1000, lastOpenedAt: null, rev: 1,
    cellSize: 24, sheetCols: 76, sheetRows: 54, pageOrder: 'h', recentColors: [], colorUsage: {} });
  const big = [];
  for (let k = 0; k < 2500; k++) big.push(pen('b' + k, 1800 + (k % 50) * 40, 1100 + Math.floor(k / 50) * 30, 40));
  const req = indexedDB.open('ogeBoardsDB', 1);
  req.onupgradeneeded = () => req.result.createObjectStore('state');
  req.onsuccess = () => {
    const tx = req.result.transaction('state', 'readwrite');
    const st = tx.objectStore('state');
    st.put({ __v: 2, folders: [], deleted: [], sortMode: 'my', boards: [lite('bBig', 'Большая'), lite('bSmall', 'Маленькая')] }, 'db');
    st.put({ objects: big, imageLib: [] }, 'boarddata:bBig');
    st.put({ objects: [pen('q1', 2500, 1400, 40)], imageLib: [] }, 'boarddata:bSmall');
    tx.oncomplete = () => resolve(JSON.stringify(big).length);
    tx.onerror = () => reject(tx.error);
  };
  req.onerror = () => reject(req.error);
})"""

SMALL_PNG = """() => { const cv = document.createElement('canvas'); cv.width = 160; cv.height = 90;
  const c = cv.getContext('2d'); c.fillStyle = '#1565c0'; c.fillRect(0, 0, 160, 90);
  c.fillStyle = '#fff'; c.font = 'bold 40px sans-serif'; c.fillText('x²', 40, 60); return cv.toDataURL('image/png'); }"""

BOARD_IDS = "() => { const B = window.getCurrentBoard(); return B && B.objects ? B.objects.length + ':' + (B.objects[0] || {}).id + ':' + (B.objects[B.objects.length - 1] || {}).id : ''; }"


def participant(ctx, tag, w, h, init=""):
    page = t11.participant(ctx, tag, w, h)
    if init:
        page.add_init_script(init)
    page.route("**/supabase-js.umd.js", lambda route: route.fulfill(
        status=200, content_type="application/javascript", body=FAKE))
    return page


def visible(target, sel):
    return target.evaluate("""s => { const e = document.querySelector(s); if (!e) return false;
        const cs = getComputedStyle(e); if (cs.display === 'none' || cs.visibility === 'hidden') return false;
        const b = e.getBoundingClientRect(); return b.width > 0 && b.height > 0 && b.right <= innerWidth + 1 && b.bottom <= innerHeight + 1; }""", sel)


def ref_state(target):
    return target.evaluate("""() => { const p = document.getElementById('bdRefPanel'); const B = window.getCurrentBoard();
        return { open: p.classList.contains('open'), mode: p.dataset.mode || '', text: document.getElementById('bdRefTextarea').value,
                 imgs: B && B.refPanel ? (B.refPanel.imageObjects || []).map(o => (o.src || '').length) : [] }; }""")


def run_main(browser):
    ctx = browser.new_context()
    # учитель с медленной отдачей (300 КБ/с — обычная домашняя) и одной
    # потерянной частью доски
    teacher = participant(ctx, "T", 1300, 820, """
        window.__fakeUplinkBps = 300000;
        window.__fakeDrop = (m) => m.event === 'ev' && m.payload && m.payload.name === 'bd_chunk'
            && m.payload.data.i === 1 && !window.__dropped && (window.__dropped = true);""")
    teacher.goto(f"{BASE}/boards.html")
    teacher.wait_for_function("() => window.TrainerSession && window.TrainerSession.getCode()")
    raw_len = teacher.evaluate(SEED_JS)
    teacher.reload()
    teacher.wait_for_function("() => window.TrainerSession && window.TrainerSession.getCode()")
    teacher.evaluate(BS.BOOT_JS)
    teacher.wait_for_function("() => window.getDB && window.getDB().boards.length >= 2")
    code = teacher.evaluate("() => TrainerSession.getCode()")

    # ── ученик на сцене, учитель уходит с главной на доски ──
    teacher.evaluate("() => TrainerSession.navigateTo('index.html')")
    teacher.wait_for_url("**/index.html")
    t54.wait_code(teacher)
    student = participant(ctx, "S", 1000, 700)
    student.add_init_script(BS.COUNT_PUTS)
    student.goto(f"{BASE}/index.html?s={code}")
    t11.wait_stage(student)
    student.wait_for_timeout(1500)

    print("3. Тема у ученика (главная)")
    f = t11.stage_frame(student)
    check("3: у учителя кнопка темы есть", visible(teacher, "#themeToggle"))
    check("3: у ученика на сцене кнопки темы нет", not visible(f, "#themeToggle"))

    teacher.click("a.boards-toggle")
    teacher.wait_for_url("**/boards.html")
    teacher.wait_for_function("() => window.TrainerSession && window.TrainerSession.getCode()")
    teacher.evaluate(BS.BOOT_JS)
    ok = wait_js(student, """() => { const f = __stageActiveFrame(); try {
        return f.contentWindow.location.pathname.endsWith('/boards.html') && !f.classList.contains('waiting'); } catch (e) { return false; } }""", 12000)
    check("2: ученик на сцене перешёл на доски", ok)
    f = t11.stage_frame(student)
    wait_js(f, "() => document.getElementById('bdViewerWaitText').textContent.indexOf('выбирает') >= 0", 8000)
    f.evaluate("() => { window.__waitTexts = []; window.__waitRec = setInterval(() => window.__waitTexts.push(document.getElementById('bdViewerWaitText').textContent), 100); }")
    teacher.evaluate("() => { window.__fakeMaxBuf = 0; window.__fakeMaxWait = 0; window.__fakeUpBytes = 0; }")

    print("2. Большая доска при медленной отдаче учителя")
    t0 = time.time()
    teacher.evaluate("() => window.openBoard('bBig')")
    teacher.wait_for_function("() => window.getCurrentBoard() && window.getCurrentBoard().id === 'bBig' && boardActive")
    want = teacher.evaluate(BOARD_IDS)
    # посреди рассылки подключается второй ученик (обычный режим, без сцены)
    ok = wait_js(f, "() => { const p = window.__bdView && window.__bdView.progress(); return !!(p && p.count >= 2 && p.count < p.n - 1); }", 15000)
    check("2: доска едет частями (видно, сколько пришло)", ok, str(f.evaluate("() => window.__bdView.progress()")))
    late = participant(ctx, "Q", 900, 640)
    late.add_init_script("try { localStorage.setItem('Q:tsStage:pref', 'off'); } catch (e) {}")
    late.goto(f"{BASE}/boards.html?s={code}")

    ok = wait_js(f, "w => { const B = window.getCurrentBoard(); return B && B.objects && (B.objects.length + ':' + B.objects[0].id + ':' + B.objects[B.objects.length - 1].id) === w; }", 40000, want)
    dt = time.time() - t0
    check("2: у ученика на сцене вся доска", ok, f.evaluate(BOARD_IDS))
    print(f"       (доска {round(raw_len / 1024)} КБ, отдача учителя 300 КБ/с: у ученика за {dt:.1f} с)")
    check("2: и быстро — меньше 25 секунд", dt < 25, f"{dt:.1f} с")
    ok = wait_js(late, "w => { const B = window.getCurrentBoard(); return B && B.objects && (B.objects.length + ':' + B.objects[0].id + ':' + B.objects[B.objects.length - 1].id) === w; }", 40000, want)
    check("2: второй ученик, пришедший посреди рассылки, тоже получил всю доску", ok, late.evaluate(BOARD_IDS))
    texts = f.evaluate("() => { clearInterval(window.__waitRec); return window.__waitTexts; }")
    pct = [t for t in texts if "%" in t]
    check("2: у ученика видны проценты загрузки", bool(pct), str(sorted(set(texts))[:6]))
    if pct:
        print(f"       (например: «{pct[len(pct) // 2]}»)")
    st = teacher.evaluate("() => ({ syncs: window.__fakeSyncs || [], ev: window.__fakeEvN || {}, buf: window.__fakeMaxBuf, wait: window.__fakeMaxWait,"
                          " bytes: window.__fakeUpBytes, idx: window.__fakeChunkIdx || [], dropped: !!window.__dropped })")
    print(f"       (ушло {round(st['bytes'] / 1024)} КБ вместо {round(raw_len / 1024)} КБ; частей отправлено {st['ev'].get('bd_chunk', 0)};"
          f" буфер сокета максимум {round(st['buf'] / 1024)} КБ; дольше всего сообщение ждало в буфере {st['wait']:.0f} мс)")
    check("2: одна часть терялась — и всё равно доска собралась", st["dropped"])
    check("2: доска не начиналась заново: одна рассылка на всех", len(set(st["syncs"])) == 1, str(st["syncs"]))
    check("2: потерянная часть отправлена ещё раз по запросу", st["idx"].count(1) >= 2, str(st["idx"]))
    check("2: доска едет сжатой — в сеть ушло меньше трети исходного", st["bytes"] < raw_len / 3, f"{st['bytes']} / {raw_len}")
    check("2: буфер сокета учителя не разбухает (меньше 260 КБ)", st["buf"] < 260000, str(st["buf"]))
    check("2: ни одно сообщение не ждёт в буфере дольше 2,5 с (пульс библиотеки — 10 с)", st["wait"] < 2500, f"{st['wait']:.0f}")
    check("2: заставка убрана", f.evaluate("() => document.getElementById('bdViewerWait').classList.contains('hidden')"))
    student.wait_for_timeout(300)
    share, info = BS.diff_share(BS.canvas_png(teacher), BS.canvas_png(f))
    check("2: холст ученика совпадает с учительским (координаты в дорогу округлены до сотых)", share < 0.01, f"{share:.4f} {info}")

    # дальше — обычная сеть
    teacher.evaluate("() => { window.__fakeUplinkBps = 0; }")
    teacher.evaluate("() => window.openBoard('bSmall')")
    ok = wait_js(f, "() => { const B = window.getCurrentBoard(); return B && B.objects && B.objects.map(o => o.id).join() === 'q1'"
                    " && document.getElementById('bdViewerWait').classList.contains('hidden'); }", 10000)
    check("2: учитель открыл другую доску — ученик видит её", ok)

    print("1. Справочные материалы у ученика")
    check("1: у ученика на сцене кнопка справочных материалов видна", visible(f, "#bdRefToggle"))
    br = f.evaluate("() => { const b = document.getElementById('bdRefToggle').getBoundingClientRect(); return [innerWidth - b.right, innerHeight - b.bottom]; }")
    check("1: в правом нижнем углу, там же, где у учителя", abs(br[0] - 16) < 3 and abs(br[1] - 16) < 3, str(br))
    check("1: у ученика в обычном режиме — тоже", visible(late, "#bdRefToggle"))
    teacher.evaluate("""() => { const rp = getCurrentBoard().refPanel; rp.mode = 'text'; rp.textMode = 'type';
        rp.text = 'a² + b² = c²'; rp.open = true; applyRefPanel(); saveDB(); }""")
    ok = wait_js(f, "() => { const p = document.getElementById('bdRefPanel'); return p.classList.contains('open')"
                    " && document.getElementById('bdRefTextarea').value === 'a² + b² = c²'; }", 5000)
    check("1: учитель открыл текст — у ученика панель открыта, текст тот же", ok, str(ref_state(f)))
    check("1: текст ученику не изменить", f.evaluate("() => document.getElementById('bdRefTextarea').readOnly"))
    src = teacher.evaluate(SMALL_PNG)
    teacher.evaluate("s => rfAddImageFromSrc(s)", src)
    ok = wait_js(f, f"() => {{ const B = getCurrentBoard(); return document.getElementById('bdRefPanel').dataset.mode === 'image'"
                    f" && B.refPanel.imageObjects.length === 1 && (B.refPanel.imageObjects[0].src || '').length === {len(src)}; }}", 8000)
    check("1: картинка в справочной панели — у ученика та же", ok, str(ref_state(f)))
    student.wait_for_timeout(400)
    blue = f.evaluate("""() => { const c = document.getElementById('bdRefDrawCanvas'); const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data;
        let n = 0; for (let i = 0; i < d.length; i += 4) if (d[i] < 60 && d[i+1] > 70 && d[i+1] < 130 && d[i+2] > 160) n++; return n; }""")
    check("1: и она нарисована в панели у ученика", blue > 500, str(blue))
    tsz = teacher.evaluate("() => { const b = document.getElementById('bdRefPanel').getBoundingClientRect(); return [Math.round(b.width), Math.round(b.height)]; }")
    ssz = f.evaluate("() => { const b = document.getElementById('bdRefPanel').getBoundingClientRect(); return [Math.round(b.width), Math.round(b.height)]; }")
    check("1: панель того же размера, что у учителя (сцена — окно учителя)", tsz == ssz, f"{tsz} / {ssz}")
    check("1: ручек размера и «+ Изображение» у ученика нет",
          not visible(f, "#bdRefResize") and not visible(f, "#bdRefAddImageBtn"))

    teacher.click("#bdRefClose")
    ok = wait_js(f, "() => !document.getElementById('bdRefPanel').classList.contains('open')", 5000)
    check("1: учитель свернул — у ученика свернулось", ok)
    # ученик сам открывает (обычный режим — настоящий клик мышью)
    late.click("#bdRefToggle")
    ok = wait_js(late, "() => document.getElementById('bdRefPanel').classList.contains('open')", 3000)
    check("1: ученик сам открыл справочные материалы кнопкой", ok)
    check("1: у учителя при этом свёрнуто", not teacher.evaluate("() => getCurrentBoard().refPanel.open"))
    late.wait_for_timeout(1200)
    check("1: и у ученика не закрывается само", late.evaluate("() => document.getElementById('bdRefPanel').classList.contains('open')"))
    late.click("#bdRefClose")
    ok = wait_js(late, "() => !document.getElementById('bdRefPanel').classList.contains('open')", 3000)
    check("1: и свернул обратно", ok)
    late.click("#bdRefToggle")
    wait_js(late, "() => document.getElementById('bdRefPanel').classList.contains('open')", 3000)
    teacher.click("#bdRefToggle")
    teacher.wait_for_timeout(300)
    teacher.click("#bdRefToggle")
    ok = wait_js(late, "() => !document.getElementById('bdRefPanel').classList.contains('open')", 5000)
    check("1: учитель открыл и свернул свою — у ученика снова как у учителя", ok)
    # на сцене — клик ученика по кнопке внутри кадра
    try:
        f.locator("#bdRefToggle").click(timeout=3000)
        ok = wait_js(f, "() => document.getElementById('bdRefPanel').classList.contains('open')", 3000)
    except Exception as e:
        ok = False
    check("1: ученик на сцене тоже открывает кнопкой", ok)
    teacher.evaluate("() => backToList()")
    ok = wait_js(f, "() => document.getElementById('bdViewerWaitText').textContent.indexOf('выбирает') >= 0", 5000)
    check("1: учитель ушёл к списку досок — у ученика кнопки нет", ok and not visible(f, "#bdRefToggle"))
    check("1: ученик ничего не записал в своё хранилище досок", student.evaluate("() => window.__idbWrites || 0") == 0,
          str(student.evaluate("() => window.__idbWrites || 0")))

    print("3. Тема у ученика (доски)")
    teacher.evaluate("() => window.openBoard('bSmall')")
    wait_js(f, "() => document.getElementById('bdViewerWait').classList.contains('hidden')", 8000)
    check("3: у ученика на досках кнопки темы нет — ни на сцене", not visible(f, "#themeToggle"))
    check("3: ни в обычном режиме", not visible(late, "#themeToggle"))
    check("3: у учителя на досках кнопка есть", visible(teacher, "#themeToggle"))
    teacher.click("#themeToggle")
    tth = teacher.evaluate("() => document.documentElement.getAttribute('data-theme')")
    ok = wait_js(f, "t => document.documentElement.getAttribute('data-theme') === t", 4000, tth)
    check(f"3: учитель переключил тему ({tth}) — у ученика на сцене та же", ok)
    ok = wait_js(late, "t => document.documentElement.getAttribute('data-theme') === t", 4000, tth)
    check("3: и у ученика в обычном режиме", ok)
    other = "light" if tth == "dark" else "dark"
    f.evaluate("t => document.documentElement.setAttribute('data-theme', t)", other)
    late.evaluate("t => document.documentElement.setAttribute('data-theme', t)", other)
    ok = wait_js(f, "t => document.documentElement.getAttribute('data-theme') === t", 2000, tth)
    check("3: тема у ученика сменилась сама — через миг снова учительская", ok)
    ok = wait_js(late, "t => document.documentElement.getAttribute('data-theme') === t", 2000, tth)
    check("3: (и в обычном режиме)", ok)
    teacher.click("#themeToggle")
    tth2 = teacher.evaluate("() => document.documentElement.getAttribute('data-theme')")
    ok = wait_js(f, "t => document.documentElement.getAttribute('data-theme') === t", 4000, tth2)
    check("3: учитель вернул тему — и у ученика", ok)
    teacher.evaluate("() => backToList()")
    teacher.wait_for_timeout(300)
    teacher.click("#blToIndex")
    teacher.wait_for_url("**/index.html")
    ok = wait_js(student, """() => { const f = __stageActiveFrame(); try {
        return f.contentWindow.location.pathname.endsWith('/index.html') && !f.classList.contains('waiting'); } catch (e) { return false; } }""", 10000)
    f = t11.stage_frame(student)
    check("3: вернулись на главную — у ученика кнопки темы по-прежнему нет", ok and not visible(f, "#themeToggle"))
    check("3: у учителя — есть", visible(teacher, "#themeToggle"))
    ctx.close()


def run_gz_fallback(browser):
    """ученик без DecompressionStream (старый Safari) — учитель шлёт несжатой"""
    ctx = browser.new_context()
    teacher = participant(ctx, "T", 1200, 760)
    teacher.goto(f"{BASE}/boards.html")
    teacher.wait_for_function("() => window.TrainerSession && window.TrainerSession.getCode()")
    teacher.evaluate(SEED_JS)
    teacher.reload()
    teacher.wait_for_function("() => window.TrainerSession && window.TrainerSession.getCode()")
    teacher.evaluate(BS.BOOT_JS)
    teacher.wait_for_function("() => window.getDB && window.getDB().boards.length >= 2")
    code = teacher.evaluate("() => TrainerSession.getCode()")
    teacher.evaluate("() => window.openBoard('bBig')")
    teacher.wait_for_function("() => window.getCurrentBoard() && window.getCurrentBoard().id === 'bBig' && boardActive")
    want = teacher.evaluate(BOARD_IDS)
    old = participant(ctx, "O", 900, 640, "try { delete window.DecompressionStream; window.DecompressionStream = undefined; } catch (e) {}")
    old.add_init_script("try { localStorage.setItem('O:tsStage:pref', 'off'); } catch (e) {}")
    old.goto(f"{BASE}/boards.html?s={code}")
    ok = wait_js(old, "w => { const B = window.getCurrentBoard(); return B && B.objects && (B.objects.length + ':' + B.objects[0].id + ':' + B.objects[B.objects.length - 1].id) === w; }", 30000, want)
    check("2: ученик, не умеющий распаковывать, получает доску несжатой", ok, old.evaluate(BOARD_IDS))
    ctx.close()


def run():
    with t11.local_server(), sync_playwright() as p:
        browser = p.chromium.launch()
        run_main(browser)
        print("2. Старый браузер ученика")
        run_gz_fallback(browser)
        browser.close()
    real = [e for e in errors if "fonts.g" not in e]
    if real:
        failures.append("ошибки JS на странице: " + " | ".join(real[:5]))
    print()
    if failures:
        print("ПРОВАЛЫ:")
        for x in failures:
            print(" -", x)
        sys.exit(1)
    print("ИТОГ: всё прошло")


if __name__ == "__main__":
    run()
