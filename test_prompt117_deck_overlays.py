"""
Промпт №117: режим презентации — окна поверх показа, задание на текущий слайд,
одно поле ответа при листании (deck-core.js, deck-toolbar.js, boards-core.js,
HANDOFF.md раздел 8).

Проверяет:
  1. Подключение телефона. Канал кода зависит от кода доски, а не от слайда.
     Запрос приходит в показе (приход имитируем подменой канала: websocket
     до Supabase из песочницы закрыт) — окно с кнопками видно внутри
     fullscreen-элемента и не перекрыто; «Разрешить» нажимается мышью, отвечает
     телефону и не листает слайд. Видны и окно с кодом, тост, очередь, призрак.
  2. Задание. После перелистывания на N-й слайд задание попадает именно на N-й,
     целиком внутри рамки и сразу отрисовано (пиксели холста, а не только поля).
     То же для настоящего снимка из тренажёра, маленького задания, полного
     слайда, сплошной прокрутки и открытой панели тренажёров.
  3. Поле ответа. В покое ровно одно поле и одна кнопка с текстом, внутри
     карточки. На середине прокрутки ползунком живых полей не видно, а на
     картинке слайда поле и кнопка с подписью есть, в её масштабе. После
     возврата поле снова на своём месте. Соседний слайд без заданий чист.
  4. Задания за рамкой (как их клала старая раскладка): плашка показывает их
     число, «Вернуть на слайды» переносит на ближайшие слайды без наезда на
     другие задания, отмена возвращает как было, обычные картинки не трогает,
     «×» скрывает плашку, в показе её нет.
  5. Нет ошибок JavaScript.

Запуск: ~/.venvs/trainers/bin/python test_prompt117_deck_overlays.py
Скриншоты — в папку SHOT_DIR (по умолчанию временная, путь печатается).
OLD_DIR=<папка со старыми файлами> подставляет их вместо текущих: так видно, что
тест ловит сами баги. Живой realtime здесь не проверить — только руками на сайте.
"""
import contextlib
import http.client
import json
import os
import subprocess
import sys
import tempfile
import time

from playwright.sync_api import sync_playwright

PORT = 9317
BASE = f"http://127.0.0.1:{PORT}"
SHOT_DIR = os.environ.get("SHOT_DIR") or tempfile.mkdtemp(prefix="deck117_")
OLD_DIR = os.environ.get("OLD_DIR")
OLD_FILES = ("boards-core.js", "deck-core.js", "deck-toolbar.js", "boards.html")
PREP_OGE6 = "document.querySelectorAll('.mode-card:not(.soon)')[1].click()"
FAILS = []


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
                conn.request("GET", "/boards.html")
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


# подмена канала: запоминаем обработчики, «приход» — прямой вызов обработчика
STUB_JS = """
window.__chans = {};
window.__bdLinkSupabase = () => ({
  channel(topic){
    const ch = { topic, subs: [], sent: [],
      on(type, filter, cb){ ch.subs.push(cb); return ch; },
      subscribe(cb){ setTimeout(() => cb('SUBSCRIBED'), 0); return ch; },
      send(m){ ch.sent.push(m.payload); return Promise.resolve('ok'); },
      fire(payload){ ch.subs.forEach(cb => cb({ payload })); } };
    window.__chans[topic] = ch;
    return ch;
  },
  removeChannel(ch){ delete window.__chans[ch.topic]; },
  storage: { from(){ return { list: async () => ({ data: [], error: null }) }; } },
});
"""
BOOT_JS = """() => { const g = document.getElementById('authGate'); if (g) g.style.display = 'none';
  window.boardsAppBoot(); document.getElementById('screenList').style.display = 'flex'; }"""

# картинка задания как у настоящего снимка: подложка поля и ПУСТАЯ синяя кнопка
# (bakeTaskRows). Розовая полоса — метка: по ней ищем задание в пикселях
TASK_JS = """async ({ w, h }) => {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const x = c.getContext('2d');
  x.fillStyle = '#fff'; x.fillRect(0, 0, w, h);
  x.fillStyle = '#ff00aa'; x.fillRect(0, 0, w, h * .3);
  x.strokeStyle = '#999'; x.lineWidth = 2; x.strokeRect(w * .125, h * .7, w * .25, h * .2);
  x.fillStyle = '#2e7de0'; x.fillRect(w * .4, h * .7, w * .34, h * .2);
  const task = { kind: 'fields', fields: [{ id: 'a', type: 'num', answer: '1' }],
    hot: { w, h, fields: [{ x: .125, y: .7, w: .25, h: .2 }], opts: [],
           check: { x: .4, y: .7, w: .34, h: .2 }, checkText: 'Проверить', style: { btnBg: '#2e7de0', btnFg: '#ffffff' } } };
  await boardLinkInsert({ img: c.toDataURL(), task, css: { w, h } }, { name: 'Телефон' });
  return B.objects[B.objects.length - 1].id;
}"""

# где задание относительно ТЕКУЩЕГО слайда и есть ли его пиксели на холсте
WHERE_JS = """(id) => {
  const o = B.objects.find(x => x.id === id), s = deckCur(), r = deckSlideRect(s);
  const x = o.points[0].x, y = o.points[0].y, eps = .5;
  const inside = x >= r.x - eps && y >= r.y - eps && x + o.w <= r.x + r.w + eps && y + o.h <= r.y + r.h + eps;
  const p = worldToScreen({ x: x + o.w / 2, y: y + o.h * .15 });
  const cv = document.getElementById('boardCv'), k = cv.width / cssW;
  const d = cv.getContext('2d').getImageData(Math.round(p.x * k), Math.round(p.y * k), 1, 1).data;
  return { cur: deckCurIndex(), slot: deckSlotOf(o), curSlot: s.slot, inside, h: o.h,
           pink: d[0] > 200 && d[1] < 80 && d[2] > 120, px: Array.from(d) };
}"""

# живые поля и кнопки, которые реально видно, и рамка карточки на экране
LIVE_JS = """(id) => {
  const vis = e => e.checkVisibility({ visibilityProperty: true }) && e.getBoundingClientRect().width > 0;
  const ins = [...document.querySelectorAll('.bd-task-in')].filter(vis);
  const btn = [...document.querySelectorAll('.bd-task-btn')].filter(vis);
  const o = id && B.objects.find(x => x.id === id);
  const cv = document.getElementById('boardCv').getBoundingClientRect();
  const r = e => { const q = e.getBoundingClientRect(); return { l: q.left, t: q.top, r: q.right, b: q.bottom }; };
  let card = null;
  if (o){ const a = worldToScreen(o.points[0]), b = worldToScreen({ x: o.points[0].x + o.w, y: o.points[0].y + o.h });
    card = { l: cv.left + a.x, t: cv.top + a.y, r: cv.left + b.x, b: cv.top + b.y }; }
  return { ins: ins.map(r), btn: btn.map(r), text: btn.map(b => b.textContent.trim()), card, hidden: deckSlideHidden(),
           layer: getComputedStyle(document.getElementById('bdTaskLayer')).visibility };
}"""

# что нарисовано на картинке слайда в слое глубины: метка задания, синяя кнопка и
# светлые пиксели подписи на ней. Доли hot — те же, что у живой кнопки
CARD_JS = """({ slideIdx, id }) => {
  const s = deckSlides()[slideIdx], r = deckSlideRect(s);
  const el = document.querySelector('.deck-card[data-id="' + s.id + '"]');
  if (!el || !el.width) return { none: true };
  const c = el.getContext('2d'), k = el.width / r.w;
  const all = c.getImageData(0, 0, el.width, el.height).data;
  let pink = 0;
  for (let i = 0; i < all.length; i += 4) if (all[i] > 200 && all[i + 1] < 80 && all[i + 2] > 120) pink++;
  const out = { pink, op: parseFloat(el.style.opacity), cr: el.getBoundingClientRect().toJSON() };
  const o = id && B.objects.find(x => x.id === id);
  if (o){
    const q = o.task.hot.check;
    const x0 = (o.points[0].x + q.x * o.w - r.x) * k, y0 = (o.points[0].y + q.y * o.h - r.y) * k, w = q.w * o.w * k, h = q.h * o.h * k;
    const d = c.getImageData(Math.round(x0 + 2), Math.round(y0 + 2), Math.max(1, Math.round(w - 4)), Math.max(1, Math.round(h - 4))).data;
    let blue = 0, light = 0;
    for (let i = 0; i < d.length; i += 4){
      if (d[i] < 90 && d[i + 2] > 170) blue++;
      else if (d[i] > 170 && d[i + 1] > 170 && d[i + 2] > 170) light++;
    }
    out.blue = blue; out.light = light;
    // поле и кнопка в масштабе картинки: их место в долях совпадает с живыми
    out.btnFrac = { x: (x0 / el.width), y: (y0 / el.height) };
  }
  return out;
}"""


def goto_slide(page, n):
    page.locator("#deckStripList .deck-thumb").nth(n).click()
    page.wait_for_function(f"() => deckCurIndex() === {n} && !deckSlideHidden()")
    page.wait_for_timeout(120)


def inside(a, b, eps=1.5):
    return a["l"] >= b["l"] - eps and a["t"] >= b["t"] - eps and a["r"] <= b["r"] + eps and a["b"] <= b["b"] + eps


def test_pairing(page):
    print("— подключение телефона")
    # настоящий fullscreen: нужен щелчок пользователя, поэтому до показа
    page.click("#railFullscreen")
    page.wait_for_function("() => !!document.fullscreenElement", timeout=3000)
    fs = page.evaluate("() => document.fullscreenElement === document.documentElement")
    check("Во весь экран разворачивается всё окно (documentElement), а не контейнер слайда", fs)
    page.evaluate("() => openLinkModal()")
    code = page.evaluate("() => boardLink.code")
    topic = "bdlink:p-" + code
    qr_url = page.evaluate("() => boardLinkPanelUrl(boardLink.code)")
    check("В QR тот же код, что у канала", qr_url.endswith("#pair=" + code), qr_url)
    check("Канал кода открыт и в презентации", page.evaluate(f"() => !!window.__chans[{json.dumps(topic)}]"))
    check("Приём привязан к открытой презентации", page.evaluate("() => boardLink.active && boardLink.boardId === B.id"))
    page.evaluate("() => closeLinkModal()")
    goto_slide(page, 3)
    goto_slide(page, 1)
    check("Перелистывание не трогает канал кода", page.evaluate(f"() => !!window.__chans[{json.dumps(topic)}]"))

    page.evaluate("() => dtbShowStart(false)")
    page.wait_for_function("() => document.documentElement.classList.contains('deck-show')")
    page.wait_for_timeout(250)
    no_before = page.evaluate("() => deckCurIndex()")
    hello = """async (topic) => {
      const kp = await crypto.subtle.generateKey({ name: 'ECDH', namedCurve: 'P-256' }, false, ['deriveBits']);
      const raw = new Uint8Array(await crypto.subtle.exportKey('raw', kp.publicKey));
      let s = ''; raw.forEach(b => { s += String.fromCharCode(b); });
      const pub = btoa(s).replace(/\\+/g, '-').replace(/\\//g, '_').replace(/=+$/, '');
      window.__chans[topic].fire({ t: 'hello', mid: 'h' + Math.random(), from: 'phone1', name: 'Телефон', pub, nonce: 'n1' });
    }"""
    page.evaluate(hello, topic)
    page.wait_for_function("() => boardLink.asking !== null", timeout=2000)
    page.wait_for_timeout(100)
    vis = page.evaluate("""() => {
      const e = document.getElementById('linkAsk'), r = e.getBoundingClientRect();
      const b = document.getElementById('linkAskAllow').getBoundingClientRect();
      const t = document.elementFromPoint(b.left + b.width / 2, b.top + b.height / 2);
      return { w: r.width, h: r.height, inFs: !!document.fullscreenElement && document.fullscreenElement.contains(e),
               onTop: !!t && e.contains(t), text: e.textContent };
    }""")
    check("В показе окно запроса видно (не display:none)", vis["w"] > 0 and vis["h"] > 0, vis)
    check("Окно запроса внутри fullscreen-элемента", vis["inFs"], vis)
    check("Кнопку «Разрешить» ничто не перекрывает", vis["onTop"], vis)
    check("В окне имя устройства", "Телефон" in vis["text"], vis)
    page.screenshot(path=os.path.join(SHOT_DIR, "1_запрос_в_показе.png"))
    if vis["w"] > 0:
        page.click("#linkAskAllow")
        page.wait_for_timeout(300)
        sent = page.evaluate(f"() => window.__chans[{json.dumps(topic)}].sent.map(m => m.t)")
        check("«Разрешить» уходит телефону", "approve" in sent, sent)
        check("Устройство подключено", page.evaluate("() => boardLink.devices().length") == 1)
        check("Щелчок по окну не листает слайд", page.evaluate("() => deckCurIndex()") == no_before)
    else:
        page.evaluate("() => { if (linkAskResolve) linkAskResolve(false); }")

    # те же окна без инструментов доски в показе — там другое CSS-правило
    page.evaluate("() => dtbShowSetToolsVisible(false, false)")
    page.wait_for_timeout(150)
    state = page.evaluate("""() => {
      const show = id => { const e = document.getElementById(id); return getComputedStyle(e).display !== 'none' && e.getBoundingClientRect().width > 0; };
      showLinkToast('Задание на доске'); openLinkModal();
      linkAskEl.classList.add('show'); linkQueueEl.classList.add('show'); linkQueueEl.textContent = 'x';
      const r = { toast: show('linkToast'), queue: show('linkQueue'), modal: show('linkModalBackdrop'), ask: show('linkAsk'),
        askOver: +getComputedStyle(linkAskEl).zIndex > +getComputedStyle(linkModalEl).zIndex };
      linkAskEl.classList.remove('show'); linkQueueEl.classList.remove('show'); closeLinkModal();
      return r;
    }""")
    check("Без инструментов видны окно запроса, окно с кодом, тост и очередь", all(state.values()), state)

    # призрак ручного размещения с телефона: невидимый — очередь ждала бы вечно
    ghost = page.evaluate("""async () => {
      const c = document.createElement('canvas'); c.width = 300; c.height = 150;
      c.getContext('2d').fillRect(0, 0, 300, 150);
      const pr = placeTaskManually({ img: c.toDataURL(), task: null, gen: null, cw: null, shot: { css: { w: 300, h: 150 } } }, 'Телефон');
      await new Promise(r => setTimeout(r, 300));
      const l = document.getElementById('bdGhostLayer');
      const out = !!l && getComputedStyle(l).display !== 'none' && l.getBoundingClientRect().width > 0 && !!placeGhost;
      if (typeof cancelPlaceGhost === 'function') cancelPlaceGhost(); else if (placeGhost) document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
      return out;
    }""")
    check("Призрак ручного размещения виден в показе", ghost)
    page.evaluate("() => { if (placeGhost && placeGhost.resolve) { placeGhost.el && placeGhost.el.remove(); placeGhost.resolve('cancelled'); placeGhost = null; } }")
    page.evaluate("() => dtbShowSetToolsVisible(true, false)")
    page.keyboard.press("Escape")
    page.wait_for_function("() => !document.documentElement.classList.contains('deck-show')")
    page.evaluate("() => document.exitFullscreen && document.fullscreenElement && document.exitFullscreen()")
    page.wait_for_timeout(400)


def test_placement(page):
    print("— задание на текущий слайд")
    ids = {}
    for n in (2, 4, 1):
        goto_slide(page, n)
        oid = page.evaluate(TASK_JS, {"w": 800, "h": 500})
        page.wait_for_timeout(200)   # следующий кадр: сразу, без листания
        w = page.evaluate(WHERE_JS, oid)
        check(f"Слайд {n + 1}: задание на нём (слот {w['slot']} = {w['curSlot']})", w["slot"] == w["curSlot"] and w["cur"] == n, w)
        check(f"Слайд {n + 1}: целиком в рамке", w["inside"], w)
        check(f"Слайд {n + 1}: содержимое на холсте сразу", w["pink"], w)
        ids[n] = oid
    # маленькое задание: раньше его середина оказывалась в слоте предыдущего слайда
    goto_slide(page, 6)
    oid = page.evaluate(TASK_JS, {"w": 400, "h": 60})
    page.wait_for_timeout(200)
    w = page.evaluate(WHERE_JS, oid)
    check("Маленькое задание не уходит в слот предыдущего слайда", w["slot"] == w["curSlot"], w)
    check("Маленькое задание в рамке и нарисовано", w["inside"] and w["pink"], w)
    # полный слайд: дальше внахлёст, но не за край
    goto_slide(page, 0)
    many = [page.evaluate(TASK_JS, {"w": 800, "h": 500}) for _ in range(14)]
    page.wait_for_timeout(200)
    bad = [i for i, x in enumerate(many) if not page.evaluate(WHERE_JS, x)["inside"]]
    check("14 заданий подряд: все в рамке слайда", not bad, bad)
    # сплошная прокрутка: там камера в координатах текущего слайда
    page.evaluate("() => deckSetFlow('scroll')")
    page.wait_for_timeout(300)
    page.evaluate("() => deckGo(5, 0)")
    page.wait_for_timeout(300)
    oid = page.evaluate(TASK_JS, {"w": 800, "h": 500})
    page.wait_for_timeout(200)
    w = page.evaluate(WHERE_JS, oid)
    check("Сплошная прокрутка: задание на текущем слайде и в рамке", w["slot"] == w["curSlot"] and w["inside"], w)
    page.evaluate("() => deckSetFlow('v')")
    page.wait_for_timeout(300)
    return ids


def test_real_capture(page):
    print("— настоящий снимок из тренажёра, кнопка «Добавить на доску»")
    goto_slide(page, 4)
    before = page.evaluate("() => B.objects.length")
    page.evaluate("() => document.getElementById('bdTrainersPanel').classList.add('open')")
    page.evaluate("""() => openTrainerInPanel('oge6', 'oge6.html', 'x')""")
    frame = "document.getElementById('bdTrainersIframe')"
    page.wait_for_function(f"""() => {{ try {{ const f = {frame};
        return f.contentDocument.readyState === 'complete' && typeof f.contentWindow.tsGetState === 'function'; }}
        catch (e) {{ return false; }} }}""", timeout=20000)
    page.wait_for_timeout(600)
    page.evaluate(f"() => {frame}.contentWindow.eval({json.dumps(PREP_OGE6)})")
    page.wait_for_timeout(500)
    page.evaluate("() => document.getElementById('bdTrainersAddBtn').click()")
    page.wait_for_function(f"() => B.objects.length > {before}", timeout=30000)
    page.wait_for_timeout(400)
    r = page.evaluate("""() => { const o = B.objects[B.objects.length - 1], s = deckCur(), f = deckSlideRect(s), e = .5;
      const x = o.points[0].x, y = o.points[0].y;
      const p = worldToScreen({ x: x + o.w / 2, y: y + o.h / 2 });
      const cv = document.getElementById('boardCv'), k = cv.width / cssW;
      const d = cv.getContext('2d').getImageData(Math.round((p.x - o.w * cam.zoom / 2.5) * k), Math.round((p.y - o.h * cam.zoom / 2.5) * k), Math.round(o.w * cam.zoom * .8 * k), Math.round(o.h * cam.zoom * .8 * k)).data;
      let dark = 0; for (let i = 0; i < d.length; i += 4) if (d[i + 3] > 200 && d[i] + d[i + 1] + d[i + 2] < 300) dark++;
      return { cur: deckCurIndex(), slot: deckSlotOf(o), curSlot: s.slot, inside: x >= f.x - e && y >= f.y - e && x + o.w <= f.x + f.w + e && y + o.h <= f.y + f.h + e, dark };
    }""")
    check("Снимок из тренажёра: на текущем слайде (панель открыта, слайд сдвинут)", r["cur"] == 4 and r["slot"] == r["curSlot"], r)
    check("Снимок из тренажёра: в рамке и текст нарисован", r["inside"] and r["dark"] > 50, r)
    page.evaluate("() => document.getElementById('bdTrainersPanel').classList.remove('open')")
    page.evaluate("() => scheduleRedraw()")
    page.wait_for_timeout(300)


def scrub_mid(page):
    """Ползунок: нажать на ручку и увести на середину перехода, не отпуская."""
    k = page.locator("#deckKnob").bounding_box()
    x, y = k["x"] + k["width"] / 2, k["y"] + k["height"] / 2
    page.mouse.move(x, y)
    page.mouse.down()
    page.mouse.move(x, y + 12, steps=3)
    page.mouse.move(x, y + 34, steps=5)
    return x, y


def test_answer_field(page, ids):
    print("— поле ответа при листании")
    goto_slide(page, 2)
    oid = ids[2]
    page.wait_for_timeout(300)
    rest = page.evaluate(LIVE_JS, oid)
    check("В покое одно поле и одна кнопка", len(rest["ins"]) == 1 and len(rest["btn"]) == 1, rest)
    check("На кнопке есть текст", rest["text"] == ["Проверить"], rest["text"])
    check("В покое поле и кнопка внутри карточки", inside(rest["ins"][0], rest["card"]) and inside(rest["btn"][0], rest["card"]), rest)
    page.screenshot(path=os.path.join(SHOT_DIR, "2_до_прокрутки.png"))

    for fx in ("", "full"):
        name = "«максимум эффектов»" if fx else "обычные эффекты"
        page.evaluate(f"() => document.documentElement.setAttribute('data-fx', {json.dumps(fx or 'normal')})")
        x, y = scrub_mid(page)
        page.wait_for_function("() => deckFast", timeout=2000)
        page.wait_for_timeout(700)   # вход в обзор закончился, картинка дорисована
        mid = page.evaluate(LIVE_JS, oid)
        check(f"{name}: на середине прокрутки поле не висит отдельно от слайда", len(mid["ins"]) == 0 and len(mid["btn"]) == 0, mid)
        card = page.evaluate(CARD_JS, {"slideIdx": 2, "id": oid})
        check(f"{name}: на картинке слайда кнопка с подписью", not card.get("none") and card.get("blue", 0) > 20 and card.get("light", 0) > 5, card)
        check(f"{name}: на картинке есть само задание", card.get("pink", 0) > 50, card)
        if not fx:
            page.screenshot(path=os.path.join(SHOT_DIR, "3_середина_прокрутки.png"))
        # назад на ту же отметку
        page.mouse.move(x, y, steps=6)
        page.mouse.up()
        page.wait_for_function("() => !deckSlideHidden()", timeout=4000)
        page.wait_for_timeout(350)
        back = page.evaluate(LIVE_JS, oid)
        check(f"{name}: после возврата снова одно поле и одна кнопка", len(back["ins"]) == 1 and len(back["btn"]) == 1, back)
        if back["ins"]:
            check(f"{name}: поле снова внутри карточки", inside(back["ins"][0], back["card"]) and inside(back["btn"][0], back["card"]), back)
            d = max(abs(back["ins"][0][q] - rest["ins"][0][q]) for q in "ltrb")
            check(f"{name}: поле вернулось на то же место (сдвиг {d:.1f} px)", d < 1.5, (back, rest))
            check(f"{name}: на кнопке есть текст", back["text"] == ["Проверить"], back["text"])
    page.screenshot(path=os.path.join(SHOT_DIR, "4_после_прокрутки.png"))

    # обычное перелистывание: поля уезжают сразу и не остаются поверх нового слайда
    page.evaluate("() => { document.documentElement.setAttribute('data-fx', 'normal'); deckStep(1); }")
    page.wait_for_timeout(60)
    flight = page.evaluate(LIVE_JS, None)
    check("Во время перелистывания живых полей не видно", flight["hidden"] and not flight["ins"], flight)
    page.wait_for_function("() => !deckSlideHidden()", timeout=2000)
    page.wait_for_timeout(250)
    slide4 = page.evaluate("""() => { const f = deckCurRect(); return B.objects.filter(o => o.type === 'image' && o.task && o.points[0].y >= f.y && o.points[0].y < f.y + f.h).length; }""")
    after = page.evaluate(LIVE_JS, None)
    check("После перелистывания полей ровно столько, сколько заданий на этом слайде", len(after["ins"]) == slide4, (after, slide4))

    # соседний слайд без заданий не показывает чужую копию
    goto_slide(page, 2)
    x, y = scrub_mid(page)
    page.wait_for_function("() => deckFast", timeout=2000)
    page.wait_for_timeout(900)
    near = page.evaluate(CARD_JS, {"slideIdx": 3, "id": None})
    check("Пустой соседний слайд без копии чужого задания", near.get("none") or near.get("pink", 0) == 0, near)
    page.mouse.move(x, y, steps=4)
    page.mouse.up()
    page.wait_for_function("() => !deckSlideHidden()", timeout=4000)


def test_strays(page):
    print("— задания за рамкой слайдов")
    goto_slide(page, 3)
    check("Пока всё в рамке, плашки нет", page.locator("#deckStrays").is_hidden())
    # места — как у старого кода: выше слайда 4 (маленькое — середина в слоте слайда 3),
    # ниже слайда 2 и за правым краем слайда 7. Картинка без задания — своё решение учителя
    made = page.evaluate("""async () => {
      const c = document.createElement('canvas'); c.width = 400; c.height = 250;
      const x = c.getContext('2d'); x.fillStyle = '#ff00aa'; x.fillRect(0, 0, 400, 250);
      const src = c.toDataURL();
      await new Promise(r => { const im = getImg(src); if (im.complete) r(); else im.addEventListener('load', r, { once: true }); });
      const R = i => deckSlideRect(deckSlides()[i]);
      const task = () => ({ kind: 'fields', fields: [{ id: 'a', type: 'num', answer: '1' }],
        hot: { w: 400, h: 250, fields: [{ x: .1, y: .7, w: .3, h: .2 }], opts: [], check: { x: .45, y: .7, w: .4, h: .2 }, checkText: 'Проверить', style: {} } });
      const put = (x, y, w, h, extra) => { const o = Object.assign({ id: uid(), type: 'image', src, points: [{ x, y }], w, h, natW: 400, natH: 250, locked: true, addedAt: Date.now() }, extra);
        B.objects.push(o); return o.id; };
      pushUndo();
      const r = { above: put(100, R(3).y - 400, 480, 300, { task: task(), stack: { id: 's1', i: 0, x0: 100, y0: R(3).y - 400, c: 0, b: 0 }, css: { w: 400, h: 250 } }),
        small: put(700, R(3).y - 200, 300, 90, { task: task() }),
        below: put(200, R(1).y + R(1).h + 50, 480, 300, { task: task() }),
        right: put(R(6).w - 100, R(6).y + 200, 480, 300, { task: task() }),
        pic: put(100, R(3).y - 900, 200, 120, {}) };
      saveDB(); scheduleRedraw();
      return r;
    }""")
    page.wait_for_timeout(300)
    box = page.locator("#deckStrays")
    check("Плашка появилась сама", box.is_visible())
    check("Плашка считает только задания, а не картинку", page.inner_text("#deckStraysNo") == "4", page.inner_text("#deckStraysNo"))
    pos = page.evaluate("""() => { const q = document.getElementById('deckStrays').getBoundingClientRect(), s = deckCurRect();
      const t = worldToScreen({ x: s.x, y: s.y }).y; return { b: q.bottom, t }; }""")
    check("Плашка не закрывает слайд", pos["b"] <= pos["t"] + 1, pos)
    page.screenshot(path=os.path.join(SHOT_DIR, "5_плашка_за_рамкой.png"))
    was = page.evaluate("() => JSON.stringify(B.objects.filter(o => o.type === 'image').map(o => [o.id, o.points[0].x, o.points[0].y, o.w, o.h]))")

    page.click("#deckStraysClose")
    page.wait_for_timeout(150)
    check("«×» скрывает плашку", box.is_hidden())
    check("«×» ничего не двигает", page.evaluate("() => JSON.stringify(B.objects.filter(o => o.type === 'image').map(o => [o.id, o.points[0].x, o.points[0].y, o.w, o.h]))") == was)
    page.evaluate("() => { deckStrayDismissed = -1; deckStraySig = null; scheduleRedraw(); }")
    page.wait_for_timeout(150)
    page.evaluate("() => dtbShowStart(false)")
    page.wait_for_timeout(300)
    check("В показе плашки нет", box.is_hidden())
    page.keyboard.press("Escape")
    page.wait_for_function("() => !document.documentElement.classList.contains('deck-show')")
    page.wait_for_timeout(300)
    goto_slide(page, 3)

    page.click("#deckStraysBtn")
    page.wait_for_timeout(300)
    res = page.evaluate("""(m) => { const out = {};
      const on = (o, i) => { const f = deckSlideRect(deckSlides()[i]), x = o.points[0].x, y = o.points[0].y, e = .5;
        return x >= f.x - e && y >= f.y - e && x + o.w <= f.x + f.w + e && y + o.h <= f.y + f.h + e; };
      const get = id => B.objects.find(o => o.id === id);
      out.above = on(get(m.above), 3); out.small = on(get(m.small), 3); out.below = on(get(m.below), 1); out.right = on(get(m.right), 6);
      out.picY = get(m.pic).points[0].y === deckSlideRect(deckSlides()[3]).y - 900;
      out.noStack = !get(m.above).stack;
      const fx = o => ({ x0: o.points[0].x, y0: o.points[0].y, x1: o.points[0].x + o.w, y1: o.points[0].y + o.h });
      const list = B.objects.filter(o => o.type === 'image' && o.task && deckSlotOf(o) === deckSlides()[3].slot).map(fx);
      out.overlap = list.some((a, i) => list.some((b, j) => j > i && a.x0 < b.x1 && b.x0 < a.x1 && a.y0 < b.y1 && b.y0 < a.y1));
      return out; }""", made)
    check("Задание над слайдом вернулось на него", res["above"], res)
    check("Маленькое (середина в чужом слоте) — тоже на свой слайд", res["small"], res)
    check("Задание под слайдом вернулось на него", res["below"], res)
    check("Задание за правым краем вернулось", res["right"], res)
    check("Вернувшиеся не наезжают друг на друга", not res["overlap"], res)
    check("Обычная картинка за рамкой на месте", res["picY"], res)
    check("Старая стопка отвязана: новое задание начнёт свою", res["noStack"], res)
    check("После возврата плашки нет", box.is_hidden())
    w = page.evaluate(WHERE_JS, made["above"])
    check("Вернувшееся задание сразу на холсте", w["pink"], w)
    live = page.evaluate(LIVE_JS, None)
    check("У вернувшихся заданий есть живые поля", len(live["ins"]) == 2, live)
    page.screenshot(path=os.path.join(SHOT_DIR, "6_после_возврата.png"))
    # миниатюры обновляются не чаще раза в секунду
    page.wait_for_timeout(1600)
    thumb = page.evaluate("""() => { const c = document.querySelectorAll('#deckStripList .deck-thumb')[3].querySelector('canvas');
      const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data; let pink = 0;
      for (let i = 0; i < d.length; i += 4) if (d[i] > 200 && d[i + 1] < 80 && d[i + 2] > 120) pink++;
      return pink; }""")
    check("Миниатюра слайда показывает вернувшиеся задания", thumb > 20, thumb)

    page.evaluate("() => doUndo()")
    page.wait_for_timeout(300)
    now = page.evaluate("() => JSON.stringify(B.objects.filter(o => o.type === 'image').map(o => [o.id, o.points[0].x, o.points[0].y, o.w, o.h]))")
    check("Отмена возвращает всё как было, одним шагом", now == was)
    check("После отмены плашка снова видна", box.is_visible())
    page.evaluate("() => doRedo && doRedo()")
    page.wait_for_timeout(200)
    check("Повтор снова возвращает на слайды", box.is_hidden())
    # обычная доска: плашка презентации не должна на ней остаться
    page.evaluate("() => { deckStrayCount = 1; deckStrayDismissed = -1; document.getElementById('deckStrays').hidden = false; deckOnOpen({ id: 'x', objects: [] }); deckOnOpen(B); }")
    check("Открытие другой доски убирает плашку", box.is_hidden())


def old_file(path):
    return lambda route: route.fulfill(path=path)


def main():
    print("Скриншоты:", SHOT_DIR)
    with local_server(), sync_playwright() as p:
        browser = p.chromium.launch()
        ctx = browser.new_context(viewport={"width": 1440, "height": 900})
        page = ctx.new_page()
        errors = []
        page.on("pageerror", lambda e: errors.append(str(e)))
        page.add_init_script(STUB_JS)
        if OLD_DIR:
            for name in OLD_FILES:
                page.route(f"**/{name}*", old_file(os.path.join(OLD_DIR, name)))
        page.route("https://**/*", lambda r: r.abort())
        page.goto(f"{BASE}/boards.html")
        page.evaluate(BOOT_JS)
        page.wait_for_selector("#blCreateDeck")
        page.click("#blCreateDeck")
        page.wait_for_function("() => typeof B !== 'undefined' && B && B.kind === 'deck' && boardActive")
        # 0 — полный, 1 и 4 — по заданию, 2 — проверка поля, 3 — пустой сосед,
        # 5 — сплошная прокрутка, 6 — маленькое задание
        for _ in range(6):
            page.click("#deckAdd")
        page.wait_for_timeout(500)

        test_pairing(page)
        ids = test_placement(page)
        test_real_capture(page)
        test_answer_field(page, ids)
        if not OLD_DIR:   # кнопки возврата в старом коде нет
            test_strays(page)

        check("Нет ошибок JavaScript", not errors, errors[:3])
        browser.close()
    print()
    print("ИТОГ:", "всё прошло" if not FAILS else f"не прошло {len(FAILS)}: " + "; ".join(FAILS))
    sys.exit(1 if FAILS else 0)


if __name__ == "__main__":
    main()
