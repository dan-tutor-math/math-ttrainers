"""
Промпт №116: анимации презентации у ученика — листание, стопка за ползунком,
переезд кадра (deck-core.js, board-stage.js, deck-toolbar.js, boards-core.js;
HANDOFF.md, раздел 6б).

Проверяем (учитель и ученик — две страницы, канал сессии подменён; ползунок
учителя тянем настоящей мышью):
  1. Смена слайда: появляется слой карточек, на это время холст прозрачный,
     старый слайд уезжает в свою сторону, новая карточка стоит ровно там, где
     потом будет слайд; через время анимации слоя нет. По сети ничего лишнего
  2. Стопка за ползунком: ученик идёт за позицией учителя, неподвижная ручка не
     обрывает стопку, отпустили — встаёт на тот же слайд. Оба уровня эффектов
  3. Обрыв потока — выход через 1 с на последний слайд; нет связи — тоже; позиция
     после конца стопку не открывает
  4. «Выкл» и «Листание»: что идёт и чего не идёт
  5. prefers-reduced-motion у ученика — без анимаций при любой настройке учителя
  6. Сплошная прокрутка — переезд кадра без карточек, слайд едет непрерывно
  7. Смена режима и поля — переезд; изменение окна — сразу
  8. Показ — проявление без карточек; учитель без новых полей — без анимаций
  9. Меню «Анимации у ученика», запоминание; у ученика нет ленты, меню и полосы;
     предпросмотр показывает только итоговый кадр

Живой realtime отсюда недоступен (заглушка Supabase из теста №78): плавность по
реальной сети проверяется на сайте.

Запуск: ~/.venvs/trainers/bin/python test_prompt116_deck_viewer_anim.py
"""
import sys

from playwright.sync_api import sync_playwright

import test_prompt115_deck_viewer_frame as T

PORT = 9232
t11, D, BS = T.t11, T.D, T.BS
t11.PORT = PORT
t11.BASE = D.BASE = BS.BASE = T.BASE = BASE = f"http://127.0.0.1:{PORT}"
D.P.BASE = BASE
failures, errors, check, wait_js, near = t11.failures, t11.errors, t11.check, T.wait_js, T.near

# шесть слайдов, чтобы стопке было куда идти; на третьем — пометка
T.SEED_JS = """() => new Promise((resolve, reject) => {
  const lite = (id, name, extra) => Object.assign({ id, name, folderId: null, createdAt: 1000, updatedAt: 1000, lastOpenedAt: null, rev: 1,
    cellSize: 24, sheetCols: 76, sheetRows: 54, pageOrder: 'h', recentColors: [], colorUsage: {} }, extra || {});
  const ids = ['s0', 's1', 's2', 's3', 's4', 's5'];
  const deck = { id: 'deck', type: 'deck', points: [{ x: -1e7, y: -1e7 }],
    slides: ids.map((id, i) => ({ id, slot: i, w: 64, h: 36, bg: { k: i % 2 ? 'dark' : 'plain' } })) };
  const mark = { id: 'm1', type: 'quad', rect: true, color: '#E0322B', width: 6, points: [{ x: 100, y: 2 * 3072 + 100 }, { x: 400, y: 2 * 3072 + 100 }, { x: 400, y: 2 * 3072 + 300 }, { x: 100, y: 2 * 3072 + 300 }] };
  const pen = { id: 'p1', type: 'pen', color: '--pencil', width: 3, points: [{ x: 2000, y: 1500 }, { x: 2100, y: 1550 }] };
  const req = indexedDB.open('ogeBoardsDB', 1);
  req.onupgradeneeded = () => req.result.createObjectStore('state');
  req.onsuccess = () => {
    const tx = req.result.transaction('state', 'readwrite'), st = tx.objectStore('state');
    st.put({ __v: 2, folders: [], deleted: [], sortMode: 'my', boards: [lite('bPlain', 'Обычная'), lite('bDeck', 'Урок', { kind: 'deck' })] }, 'db');
    st.put({ objects: [pen], imageLib: [] }, 'boarddata:bPlain');
    st.put({ objects: [deck, mark], imageLib: [] }, 'boarddata:bDeck');
    tx.oncomplete = () => resolve(true);
    tx.onerror = () => reject(tx.error);
  };
  req.onerror = () => reject(req.error);
})"""

# снимаем каждый кадр: сколько карточек, виден ли слой, что с холстом
SAMPLE_JS = """(ms) => new Promise((res) => { const out = [], t0 = performance.now(); const L = document.getElementById('deckDepth'), cv = document.getElementById('boardCv');
  (function tick() {
    const a = cv.getContext('2d').getImageData(2, 2, 1, 1).data[3];
    out.push({ t: Math.round(performance.now() - t0), on: !L.hidden && getComputedStyle(L).display !== 'none', n: L.querySelectorAll('.deck-card').length, hid: deckSlideHidden(),
      cur: deckCur() && deckCur().id, alpha: a, glide: __bdView.gliding(), z: cam.zoom, x: cam.x, y: cam.y });
    if (performance.now() - t0 < ms) requestAnimationFrame(tick); else res(out); })(); })"""
REST_JS = "() => { const L = document.getElementById('deckDepth'); return L.hidden && L.children.length === 0 && !deckSlideHidden() && !deckFast && !deckFx && document.getElementById('boardCv').getContext('2d').getImageData(2, 2, 1, 1).data[3] === 255; }"
# считаем у учителя, что уходит в сеть
SPY_JS = """() => { if (window.__sent) { window.__sent.length = 0; return; } window.__sent = []; window.__drop = false; const TS = window.TrainerSession, o = TS.broadcastEvent;
  TS.broadcastEvent = function (n, d) { if (n === 'bd_live' && d && d.fast) { window.__sent.push(d.fast); if (window.__drop) return; } return o.apply(this, arguments); }; }"""


def setting(teacher, anim, mode="slide"):
    teacher.evaluate("([a, m]) => { localStorage.setItem('boardsDeckStudentAnim', a); localStorage.setItem('boardsDeckStudentView', m); scheduleRedraw(); }", [anim, mode])


def grab_knob(teacher):
    k = teacher.locator("#deckKnob").bounding_box()
    x, y = k["x"] + k["width"] / 2, k["y"] + k["height"] / 2
    teacher.mouse.move(x, y)
    teacher.mouse.down()
    teacher.mouse.move(x, y + 12, steps=2)
    return x, y


def run_main(browser):
    ctx = browser.new_context()
    teacher, code = T.open_teacher(ctx)
    teacher.evaluate(SPY_JS)
    st = T.open_student(ctx, code, "S", 1000, 700)
    wait_js(st, "() => __bdView.view().an === 2", 5000)

    print("1. Смена слайда")
    check("1: по умолчанию «Листание и ползунок»", st.evaluate("() => __bdView.view().an") == 2)
    check("1: в покое карточек нет, холст непрозрачный", st.evaluate(REST_JS))
    st.evaluate(f"() => {{ window.__s = ({SAMPLE_JS})(650); }}")
    teacher.evaluate("() => deckGo(1, 1)")
    # в середине пути: старая карточка уходит вверх, новая стоит на месте слайда
    ok = wait_js(st, "() => deckSlideHidden() && document.querySelectorAll('#deckDepth .deck-card').length >= 2", 3000)
    check("1: слой карточек появился", ok)
    mid = st.evaluate("""() => { const q = (id) => document.querySelector('#deckDepth .deck-card[data-id="' + id + '"]');
      const a = q('s0'), b = q('s1'); return { old: a && a.getBoundingClientRect().top, cur: b && b.getBoundingClientRect().top, painted: b && b.width > 0 }; }""")
    check("1: старый слайд уходит вверх — учитель листнул вперёд", mid["old"] is not None and mid["cur"] is not None and mid["old"] < mid["cur"], str(mid))
    check("1: у входящей карточки уже есть картинка", mid["painted"], str(mid))
    samples = st.evaluate("() => window.__s")
    during = [x for x in samples if x["hid"]]
    check("1: на время анимации холст прозрачный", any(x["alpha"] == 0 for x in during), str(during[:2]))
    check("1: слой виден всё это время", all(x["on"] and x["n"] > 0 for x in during if x["alpha"] == 0))
    dur = during[-1]["t"] - during[0]["t"] if during else 0
    check("1: анимация около 330 мс", 220 <= dur <= 460, str(dur))
    check("1: слайд правильный", st.evaluate("() => deckCur().id") == "s1")
    check("1: после анимации слоя нет", wait_js(st, REST_JS, 2000))
    z = st.evaluate("() => { const r = deckSlideRect(deckCur()); return [(r.x - cam.x) * cam.zoom, cssW - (r.x + r.w - cam.x) * cam.zoom]; }")
    check("1: слайд стоит по центру кадра", near(z[0], z[1], 1), str(z))
    # карточка в конце анимации совпадает со слайдом на холсте
    teacher.evaluate("() => deckGo(2, 1)")
    wait_js(st, "() => deckCur().id === 's2' && deckSlideHidden()", 3000)
    st.wait_for_timeout(300)
    cmp = st.evaluate("""() => { const c = document.querySelector('#deckDepth .deck-card[data-id="s2"]'); if (!c) return null; const b = c.getBoundingClientRect(), r = deckSlideRect(deckCur());
      return { l: b.left, sl: (r.x - cam.x) * cam.zoom, w: b.width, sw: r.w * cam.zoom, t: b.top, st: (r.y - cam.y) * cam.zoom }; }""")
    check("1: карточка встаёт ровно на слайд", cmp and near(cmp["l"], cmp["sl"], 3) and near(cmp["w"], cmp["sw"], 3) and near(cmp["t"], cmp["st"], 3), str(cmp))
    wait_js(st, REST_JS, 2000)
    pix = st.evaluate("""() => { const cv = document.getElementById('boardCv'), k = cv.width / cv.getBoundingClientRect().width; const c = deckSlideRect(deckCur());
      const d = cv.getContext('2d').getImageData(Math.round((c.x + 250 - cam.x) * cam.zoom * k), Math.round((c.y + 100 - cam.y) * cam.zoom * k), 1, 1).data; return [d[0], d[1], d[2]]; }""")
    check("1: на холсте снова слайд с пометкой", pix[0] > 180 and pix[1] < 100, str(pix))
    # назад: направление обратное
    teacher.evaluate("() => deckGo(1, -1)")
    wait_js(st, "() => deckCur().id === 's1' && deckSlideHidden()", 3000)
    back = st.evaluate("""() => { const q = (id) => document.querySelector('#deckDepth .deck-card[data-id="' + id + '"]').getBoundingClientRect().top; return [q('s2'), q('s1')]; }""")
    check("1: назад — старый уходит вниз", back[0] > back[1], str(back))
    wait_js(st, REST_JS, 2000)
    check("1: при обычном листании позиция по сети не шла", teacher.evaluate("() => window.__sent.length") == 0)
    # №105-поля и лента
    hidden = "() => ['deckNav', 'deckStrip', 'deckScrub'].every(id => { const e = document.getElementById(id); return !e || e.hidden || !e.getBoundingClientRect().width; }) && isDeckBoard() === false"
    check("9: у ученика нет ленты, полосы и ползунка в покое", st.evaluate(hidden))
    teacher.evaluate("() => deckGo(2, 1)")
    wait_js(st, "() => deckSlideHidden()", 3000)
    check("9: и во время анимации", st.evaluate(hidden))
    wait_js(st, REST_JS, 2000)

    print("2. Стопка за ползунком: обычный уровень эффектов")
    teacher.evaluate("() => { deckGo(0, 0); document.documentElement.removeAttribute('data-fx'); scheduleRedraw(); }")
    wait_js(st, "() => deckCur().id === 's0'", 3000)
    st.wait_for_timeout(500)
    teacher.evaluate(SPY_JS)
    x, y = grab_knob(teacher)
    ok = wait_js(st, "() => deckFast === true", 3000)
    check("2: стопка открылась", ok)
    check("2: уровень эффектов учителя", st.evaluate("() => deckMaxFx()") is False)
    sc = teacher.locator("#deckScrub").bounding_box()
    teacher.mouse.move(x, sc["y"] + sc["height"] * .6, steps=6)
    ok = wait_js(st, "() => deckCur().id === 's3'", 3000)
    check("2: ученик идёт за текущим слайдом учителя", ok, st.evaluate("() => deckCur().id"))
    check("2: карточки на экране", st.evaluate("() => { const L = document.getElementById('deckDepth'); return !L.hidden && L.querySelectorAll('.deck-card').length >= 3; }"))
    teacher.mouse.up()
    check("2: отпустили — стопка закрылась", wait_js(st, "() => !deckFast", 3000))
    check("2: и слой исчез после выхода", wait_js(st, REST_JS, 2500))
    check("2: тот же слайд", st.evaluate("() => deckCur().id") == teacher.evaluate("() => deckCur().id"))

    print("2б. Стопка за ползунком: «максимум эффектов»")
    teacher.evaluate("() => { document.documentElement.setAttribute('data-fx', 'full'); deckGo(0, 0); }")
    wait_js(st, "() => __bdView.view().fx === 1 && deckCur().id === 's0'", 3000)
    st.wait_for_timeout(500)
    teacher.evaluate(SPY_JS)
    x, y = grab_knob(teacher)
    check("2б: у ученика deckFx как у учителя", wait_js(st, "() => deckMaxFx() && deckFast && !!deckFx", 3000))
    # 2,4 между слайдами: вне магнита
    teacher.mouse.move(x, sc["y"] + sc["height"] * 2.4 / 5, steps=6)
    tp = teacher.evaluate("() => deckFastPos")
    ok = wait_js(st, f"() => deckFastPos !== null && Math.abs(deckFastPos - {tp}) < .02", 3000)
    check("2б: дробная позиция дошла", ok, f"{tp} {st.evaluate('() => deckFastPos')}")
    ok = wait_js(st, f"() => deckFx && Math.abs(deckFx.pos - {tp}) < .05", 3000)
    check("2б: стопка догнала позицию плавно", ok, str(st.evaluate("() => deckFx && deckFx.pos")))
    filt = st.evaluate("() => { const c = [...document.querySelectorAll('#deckDepth .deck-card')].map(e => e.style.filter); return c.filter(f => f.includes('blur')).length; }")
    check("2б: у соседей размытие из «максимума»", filt >= 1, str(filt))
    # неподвижная ручка дольше секунды: стопка не закрывается
    n0 = teacher.evaluate("() => window.__sent.length")
    st.wait_for_timeout(1500)
    check("2б: ручка стоит — стопка держится", st.evaluate("() => deckFast && !!deckFx"))
    n1 = teacher.evaluate("() => window.__sent.length")
    check("2б: и связь подтверждается реже, чем при движении", 3 <= n1 - n0 <= 10, str(n1 - n0))
    # частота: не чаще раза в 30–50 мс при движении
    teacher.evaluate("() => { window.__sent.length = 0; }")
    for i in range(30):
        teacher.mouse.move(x, sc["y"] + sc["height"] * (.3 + i * .01))
    teacher.wait_for_timeout(300)
    sent = teacher.evaluate("() => window.__sent.length")
    check("2б: позиция уходит только при изменении", sent >= 3, str(sent))
    teacher.mouse.up()
    check("2б: отпустили — конец дошёл", wait_js(st, "() => !deckFast", 3000))
    cur_t = teacher.evaluate("() => deckCur().id")
    check("2б: стопка доехала и слой исчез", wait_js(st, REST_JS, 3000), str(st.evaluate("() => [deckFx && deckFx.pos, deckSlideHidden()]")))
    check("2б: слайд как у учителя", st.evaluate("() => deckCur().id") == cur_t)
    e = st.evaluate(T.EDGES_JS)
    check("2б: кадр на месте", near(e["l"], e["r"], 2) and near(e["t"], e["b"], 2), str(e))

    print("3. Обрыв")
    teacher.evaluate("() => deckGo(0, 0)")
    wait_js(st, "() => deckCur().id === 's0'", 3000)
    st.wait_for_timeout(500)
    teacher.evaluate(SPY_JS)
    x, y = grab_knob(teacher)
    teacher.mouse.move(x, sc["y"] + sc["height"] * .6, steps=4)
    wait_js(st, "() => deckFast && deckCur().id === 's3'", 3000)
    teacher.evaluate("() => { window.__drop = true; }")
    t0 = st.evaluate("() => performance.now()")
    ok = wait_js(st, "() => !deckFast", 4000)
    gone = st.evaluate(f"() => performance.now() - {t0}")
    check("3: поток оборвался — вышел из стопки", ok)
    check("3: примерно через секунду", 700 <= gone <= 1700, str(gone))
    check("3: не завис в обзоре", wait_js(st, REST_JS, 3000))
    check("3: на последнем слайде", st.evaluate("() => deckCur().id") == "s3", st.evaluate("() => [deckCur().id, __bdView.view().ds, deckViewerSlide].join()") + " учитель " + teacher.evaluate("() => deckCur().id"))
    teacher.mouse.up()
    teacher.evaluate("() => { window.__drop = false; }")
    teacher.wait_for_timeout(300)
    # поздняя позиция после конца не открывает стопку снова
    st.evaluate("() => { deckViewerFast({ n: 777, end: 1, ds: 's3' }); deckViewerFast({ n: 777, p: 1, f: 0 }); }")
    check("3: позиция после конца не открывает стопку", st.evaluate("() => !deckFast && !deckVF"))
    # нет связи
    st.evaluate("() => { deckViewerFast({ n: 888, p: 2, f: 0 }); }")
    check("3: стопка от сообщения открылась", st.evaluate("() => deckFast"))
    st.evaluate("() => { window.__gc = TrainerSession.getConnState; TrainerSession.getConnState = () => 'offline'; }")
    check("3: нет связи — вышел сразу", wait_js(st, "() => !deckFast", 700))
    st.evaluate("() => { TrainerSession.getConnState = window.__gc; }")
    wait_js(st, REST_JS, 3000)

    print("4. «Выкл» и «Листание»")
    teacher.evaluate("() => { deckGo(0, 0); document.documentElement.removeAttribute('data-fx'); }")
    setting(teacher, "off")
    wait_js(st, "() => __bdView.view().an === 0 && deckCur().id === 's0'", 3000)
    st.wait_for_timeout(450)
    st.evaluate(f"() => {{ window.__s = ({SAMPLE_JS})(450); }}")
    teacher.evaluate("() => deckGo(1, 1)")
    check("4: «Выкл» — слайд сменился", wait_js(st, "() => deckCur().id === 's1'", 3000))
    s = st.evaluate("() => window.__s")
    # прозрачность холста здесь не показатель: если учитель как раз разослал доску
    # заново, resizeCanvas очищает холст на один кадр (при любых настройках)
    check("4: «Выкл» — карточек не было", all(x["n"] == 0 and not x["on"] and not x["hid"] for x in s), str([x for x in s if x["n"] or x["on"] or x["hid"]][:2]))
    teacher.evaluate(SPY_JS)
    x, y = grab_knob(teacher)
    teacher.mouse.move(x, y + 60, steps=3)
    teacher.wait_for_timeout(200)
    check("4: «Выкл» — позиция не идёт", teacher.evaluate("() => window.__sent.length") == 0)
    teacher.mouse.up()
    teacher.wait_for_timeout(700)

    setting(teacher, "flip")
    wait_js(st, "() => __bdView.view().an === 1", 3000)
    st.wait_for_timeout(300)
    i = st.evaluate("() => deckCurIndex()")
    teacher.evaluate("() => deckGo(deckCurIndex() + (deckCurIndex() < 3 ? 1 : -1), 1)")
    check("4: «Листание» — карточки есть", wait_js(st, "() => deckSlideHidden() && document.querySelectorAll('#deckDepth .deck-card').length > 0", 3000))
    wait_js(st, REST_JS, 2000)
    teacher.evaluate(SPY_JS)
    x, y = grab_knob(teacher)
    teacher.mouse.move(x, y + 40, steps=3)
    teacher.wait_for_timeout(200)
    check("4: «Листание» — позиция ползунка не идёт", teacher.evaluate("() => window.__sent.length") == 0)
    check("4: «Листание» — у ученика нет стопки", st.evaluate("() => !deckFast"))
    teacher.mouse.up()
    teacher.wait_for_timeout(700)
    setting(teacher, "all")
    wait_js(st, "() => __bdView.view().an === 2", 3000)
    wait_js(st, REST_JS, 2000)

    print("6. Сплошная прокрутка")
    teacher.evaluate("() => { deckSetFlow('scroll'); deckGo(1); }")
    wait_js(st, "() => __bdView.view().fl === 'scroll' && __bdView.view().ds === 's1'", 4000)
    st.wait_for_timeout(600)
    st.evaluate("""() => { window.__tops = []; const t0 = performance.now(); (function tick() { const r = deckSlideRect(deckSlides().find(s => s.id === 's2')), L = deckScrollLayout(), c = deckCur();
        const o = L.off.get(c.id), o2 = L.off.get('s2'); window.__tops.push({ t: performance.now() - t0, top: (o2.top - (cam.y + o.y)) * cam.zoom, glide: __bdView.gliding(), n: document.querySelectorAll('#deckDepth .deck-card').length, on: !document.getElementById('deckDepth').hidden }); if (performance.now() - t0 < 700) requestAnimationFrame(tick); })(); }""")
    teacher.evaluate("() => deckGo(2)")
    check("6: кадр поехал", wait_js(st, "() => __bdView.gliding()", 3000))
    st.wait_for_timeout(800)
    tops = st.evaluate("() => window.__tops")
    gl = [x for x in tops if x["glide"]]
    check("6: карточек нет", all(x["n"] == 0 and not x["on"] for x in tops))
    dur = gl[-1]["t"] - gl[0]["t"] if gl else 0
    check("6: около 0,35 с", 250 <= dur <= 450, str(dur))
    vals = [x["top"] for x in gl]
    check("6: слайд едет к верху непрерывно, без скачка", len(vals) > 4 and vals[0] > vals[-1] and all(vals[i] >= vals[i + 1] - .5 for i in range(len(vals) - 1)) and max(vals[i] - vals[i + 1] for i in range(len(vals) - 1)) < abs(vals[0] - vals[-1]) * .6, str(vals[:6]))
    check("6: приехал и кадр на месте", st.evaluate("() => !__bdView.gliding() && deckCur().id === 's2'"))
    e = st.evaluate("() => { const c = deckFrameCam(__bdView.frame(), cssW, cssH); return [c.x - cam.x, c.y - cam.y, c.zoom - cam.zoom]; }")
    check("6: точно по кадру", all(abs(v) < .01 for v in e), str(e))
    bg = st.evaluate("""() => { const c = deckSlideRect(deckCur()); const cv = document.getElementById('boardCv'), k = cv.width / cv.getBoundingClientRect().width;
       const d = cv.getContext('2d').getImageData(Math.round((c.x + c.w / 2 - cam.x) * cam.zoom * k), 2, 1, 1).data; return [d[0], d[1], d[2]]; }""")
    teacher.evaluate("() => { deckSetFlow('v'); deckGo(1, 0); }")
    wait_js(st, "() => __bdView.view().fl === 'v' && deckCur().id === 's1'", 3000)
    wait_js(st, REST_JS, 2000)

    print("7. Смена режима и поля")
    st.evaluate(f"() => {{ window.__s = ({SAMPLE_JS})(600); }}")
    setting(teacher, "all", "margin")
    check("7: «Слайд с полем» — кадр поехал", wait_js(st, "() => __bdView.gliding()", 3000))
    s = st.evaluate("() => window.__s")
    zs = [x["z"] for x in s if x["glide"]]
    check("7: масштаб меняется плавно", len(zs) > 4 and all(zs[i] >= zs[i + 1] - 1e-6 for i in range(len(zs) - 1)) and zs[0] > zs[-1], str(zs[:5]))
    check("7: карточек нет", all(x["n"] == 0 for x in s))
    st.wait_for_timeout(200)
    check("7: доехал до кадра", st.evaluate("() => { const c = deckFrameCam(__bdView.frame(), cssW, cssH); return !__bdView.gliding() && Math.abs(c.zoom - cam.zoom) < 1e-6; }"))
    teacher.evaluate("() => { localStorage.setItem('boardsDeckStudentMargin', '30'); scheduleRedraw(); }")
    check("7: поле изменилось — кадр поехал", wait_js(st, "() => __bdView.gliding()", 3000))
    st.set_viewport_size({"width": 700, "height": 900})
    check("7: окно изменилось — сразу по новому окну", wait_js(st, "() => { const c = deckFrameCam(__bdView.frame(), cssW, cssH); return !__bdView.gliding() && cssW === 700 && Math.abs(c.zoom - cam.zoom) < 1e-6; }", 2000))
    setting(teacher, "all", "mine")
    check("7: «Как у меня» — тоже едет", wait_js(st, "() => __bdView.gliding()", 3000))
    teacher.wait_for_timeout(600)
    tc, sc2 = teacher.evaluate(T.CAM_JS), st.evaluate(T.CAM_JS)
    check("7: и приехал к камере учителя", near(tc["x"], sc2["x"], .05) and near(tc["zoom"], sc2["zoom"], .001), f"{tc} {sc2}")
    setting(teacher, "all", "slide")
    wait_js(st, "() => __bdView.view().fm === 'slide' && !__bdView.gliding()", 3000)
    st.set_viewport_size({"width": 1000, "height": 700})
    st.wait_for_timeout(500)

    print("8. Показ и старый учитель")
    teacher.evaluate("() => dtbShowStart(false)")
    wait_js(st, "() => document.documentElement.classList.contains('deck-show')", 4000)
    st.wait_for_timeout(500)
    st.evaluate(f"() => {{ window.__s = ({SAMPLE_JS})(300); }}")
    teacher.evaluate("() => dtbShowStep(1)")
    ok = wait_js(st, "() => document.getElementById('boardCv').classList.contains('dtb-show-in')", 3000)
    check("8: показ — проявление", ok)
    check("8: анимация проявления настоящая", st.evaluate("() => getComputedStyle(document.getElementById('boardCv')).animationName") != "none", st.evaluate("() => getComputedStyle(document.getElementById('boardCv')).animationName"))
    st.wait_for_timeout(350)
    s = st.evaluate("() => window.__s")
    check("8: показ — карточек нет", all(x["n"] == 0 for x in s))
    teacher.evaluate("() => dtbShowStop()")
    wait_js(st, "() => !document.documentElement.classList.contains('deck-show')", 4000)
    st.wait_for_timeout(500)
    # учитель со страницей из кэша: полей an, fm нет
    cur = st.evaluate("() => deckCur().id")
    other = "s0" if cur != "s0" else "s1"
    st.evaluate(f"() => {{ window.__s = ({SAMPLE_JS})(300); }}")
    teacher.evaluate(f"() => TrainerSession.broadcastEvent('bd_view', {{ x: 5, y: 5, zoom: .5, inset: 0, ds: '{other}', fl: 'v' }})")
    check("8: старый учитель — слайд сменился", wait_js(st, f"() => deckCur().id === '{other}' && cam.zoom === .5", 3000))
    check("8: старый учитель — анимаций нет", st.evaluate("() => deckViewerAn === 0 && !deckCanAnimate()"))
    st.wait_for_timeout(320)
    check("8: старый учитель — без карточек", all(x["n"] == 0 for x in st.evaluate("() => window.__s")))
    setting(teacher, "flip")
    wait_js(st, "() => __bdView.view().an === 1", 3000)
    setting(teacher, "all")
    wait_js(st, "() => __bdView.view().an === 2", 3000)
    wait_js(st, REST_JS, 2000)

    print("9. Меню и предпросмотр")
    teacher.set_viewport_size({"width": 1500, "height": 860})
    teacher.evaluate("() => { localStorage.removeItem('boardsDeckStudentAnim'); dtbLayout(); }")
    teacher.click("#dtb-student")
    txt = teacher.inner_text("#dtbSvPop")
    check("9: в меню «Анимации у ученика»", "Анимации у ученика" in txt and "Выкл" in txt and "Листание и ползунок" in txt, txt)
    check("9: по умолчанию «Листание и ползунок»", teacher.get_attribute("[data-svan=all]", "aria-checked") == "true")
    box = teacher.evaluate("() => { const r = document.getElementById('dtbSvPop').getBoundingClientRect(); return [r.top, r.bottom, innerHeight]; }")
    check("9: меню целиком в окне", box[0] >= 0 and box[1] <= box[2], str(box))
    teacher.click("[data-svan=flip]")
    check("9: выбор в localStorage", teacher.evaluate("() => localStorage.getItem('boardsDeckStudentAnim')") == "flip")
    check("9: выбор ушёл ученику с видом", wait_js(st, "() => __bdView.view().an === 1", 3000))
    teacher.click("[data-svan=all]")
    wait_js(st, "() => __bdView.view().an === 2", 3000)
    # предпросмотр рисует только итог: карточек у него нет, новый слайд сразу
    teacher.click("#dtbSvPreviewBtn")
    teacher.keyboard.press("Escape")
    teacher.wait_for_timeout(300)
    cards = teacher.evaluate("() => document.querySelectorAll('#dtbSvPreview .deck-card').length")
    a = teacher.evaluate("() => document.getElementById('dtbSvCanvas').toDataURL().length")
    teacher.evaluate("() => deckGo(deckCurIndex() === 2 ? 3 : 2, 1)")
    teacher.wait_for_timeout(260)
    b = teacher.evaluate("() => document.getElementById('dtbSvCanvas').toDataURL().length")
    check("9: предпросмотр без карточек, сразу итоговый кадр", cards == 0 and a != b, f"{cards} {a} {b}")
    ctx.close()


def run_reduced(browser):
    print("5. prefers-reduced-motion у ученика")
    ctx = browser.new_context()
    teacher, code = T.open_teacher(ctx)
    teacher.evaluate(SPY_JS)
    st = T.open_student(ctx, code, "R", 1000, 700)
    st.emulate_media(reduced_motion="reduce")
    wait_js(st, "() => __bdView.view().an === 2", 5000)
    check("5: учитель разрешил, а у ученика нельзя", st.evaluate("() => !deckCanAnimate()"))
    st.evaluate(f"() => {{ window.__s = ({SAMPLE_JS})(450); }}")
    teacher.evaluate("() => deckGo(1, 1)")
    check("5: слайд сменился", wait_js(st, "() => deckCur().id === 's1'", 3000))
    st.wait_for_timeout(420)
    s = st.evaluate("() => window.__s")
    check("5: карточек не было", all(x["n"] == 0 and not x["on"] and not x["hid"] for x in s))
    grab_knob(teacher)
    wait_js(teacher, "() => window.__sent.length > 0", 3000)
    st.wait_for_timeout(200)
    check("5: стопка не открывается", st.evaluate("() => !deckFast && !deckFx"))
    teacher.mouse.up()
    setting(teacher, "all", "margin")
    wait_js(st, "() => __bdView.view().fm === 'margin'", 3000)
    check("5: смена режима — без переезда", st.evaluate("() => { const c = deckFrameCam(__bdView.frame(), cssW, cssH); return !__bdView.gliding() && Math.abs(c.zoom - cam.zoom) < 1e-6; }"))
    ctx.close()


def run_fx(browser):
    print("2в. Эффекты ученика не важны — важны учителя")
    ctx = browser.new_context()
    teacher, code = T.open_teacher(ctx)
    st = T.open_student(ctx, code, "F", 1000, 700)
    st.evaluate("() => document.documentElement.setAttribute('data-fx', 'full')")
    wait_js(st, "() => __bdView.view().an === 2", 5000)
    teacher.evaluate("() => deckGo(1, 1)")
    wait_js(st, "() => deckSlideHidden() && document.querySelector('#deckDepth .deck-card')", 3000)
    check("2в: у учителя обычный уровень — ученику тоже", st.evaluate("() => deckMaxFx()") is False)
    f = st.evaluate("() => getComputedStyle(document.querySelector('#deckDepth .deck-card.k1')).filter")
    check("2в: размытия нет, хотя у ученика своё «максимум»", f == "none", f)
    ctx.close()


def run():
    with t11.local_server(), sync_playwright() as p:
        browser = p.chromium.launch()
        run_main(browser)
        run_reduced(browser)
        run_fx(browser)
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
