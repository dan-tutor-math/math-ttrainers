"""
Промпт №73: стрелки между номерами заданий в экзаменационных тренажёрах —
ОГЭ (oge1_5 … oge19 и oge_part2?n=20…25), ЕГЭ база, ЕГЭ профиль
(exam-nav.js).

Проверяет:
  A. порядок номеров в exam-nav.js совпадает с каталогом на главной (ОГЭ,
     часть 1) и с банками (ЕГЭ база 1–21, профиль 1–20, ОГЭ часть 2 20–25);
  B. на всех 14 страницах у заголовка две круглые кнопки ◀ ▶: слева и справа
     от текста, на одной высоте с ним, вид как у стрелок прототипов
     (фон, рамка, цвет, шрифт); на первом номере экзамена неактивна левая,
     на последнем — правая; в карточке «+» (?card=1) стрелок нет; в режиме
     фокуса заголовок со стрелками сворачивается;
  C. ОГЭ целиком: от №1–5 стрелкой «вперёд» до №25 и обратно; впервые
     открытый номер — его первый прототип (первая карточка экрана выбора);
     там, где по пути сменили тип, возврат приводит на него же и на то же
     задание; решённое задание возвращается решённым, с ответом в поле;
     из ОГЭ не уходим ни в ЕГЭ, ни куда-то ещё;
  D. память номеров не сбивает память прототипов: в №7 тип A → тип B →
     №8 → назад: тип B с тем же заданием, «◀ Предыдущий тип» — тип A с его
     прежним заданием;
  E. ЕГЭ база и профиль — номер меняется без перезагрузки: адрес, заголовок,
     первый прототип нового номера, возврат на прототип, открытый в
     прошлый раз (в т. ч. после ухода со списка прототипов); на ЕГЭ
     из ЕГЭ не уходим в ОГЭ и обратно; заход по адресу без стрелок —
     по-прежнему список прототипов;
  F. совместная сессия (заглушка supabase-js из теста №54): учитель жмёт
     стрелку — ученик уходит следом на тот же номер и видит то же задание
     (ОГЭ — переход страницы, ЕГЭ — номер внутри страницы); у ученика
     стрелка не работает — «Учитель ограничил это действие»;
  G. 1024, 768, 600, 375 и 320 px: стрелки и заголовок в строке, стрелки
     не под круглыми кнопками в углах страницы, текст не обрезан,
     прокрутки вбок нет.

Живой realtime из песочницы не проверить — совместный режим перепроверяется
на сайте руками.

Запуск: python3 test_prompt73_exam_nav.py (сервер поднимается сам).
"""
import json
import re
import sys

from playwright.sync_api import sync_playwright

import test_prompt54_trainer_sync_and_cards as t54

PORT = 8973
t54.PORT = PORT
BASE = f"http://127.0.0.1:{PORT}"

OGE_SEQ = (["oge1_5.html", "oge6.html", "oge7.html", "oge8.html", "oge9.html", "oge10.html",
            "oge11.html", "oge12.html", "oge13.html", "oge14.html", "oge15_18.html", "oge19.html"]
           + [f"oge_part2.html?n={n}" for n in range(20, 26)])

# что открыто сейчас: номер (адрес), тип/прототип, задание
INFO = r"""() => {
  const h = window.__examNav;
  let s = null; try { s = window.tsGetState(); } catch (e) {}
  const eng = document.querySelector('#linEngineArea');
  let task = null;
  if (!h && s) task = s.curTask ? JSON.stringify(s.curTask) : ((eng && eng.innerText) || '');
  return {
    url: location.pathname.split('/').pop() + location.search.replace(/&?s=[A-Z0-9]+/, '').replace(/\?$/, ''),
    title: (document.querySelector('.exam-nav-text') || {}).textContent || '',
    prevDis: !!(document.getElementById('examPrevBtn') || {}).disabled,
    nextDis: !!(document.getElementById('examNextBtn') || {}).disabled,
    onTask: h ? !!h.pid() : !!(s && s.picker === false),
    type: h ? h.pid() : (s ? s.curMode : null),
    n: h ? h.n() : null,
    task: task,
  };
}"""
FIRST_CARD = """() => { const c = document.querySelector('#pickerArea .mode-card[data-id]:not(.random):not(.soon):not([data-id="random"])');
                       return c ? c.dataset.id : null; }"""


def info(page):
    return page.evaluate(INFO)


def arrow(page, which, navigates=True):
    sel = "#examNextBtn" if which == "next" else "#examPrevBtn"
    if navigates:
        with page.expect_navigation():
            page.click(sel)
    else:
        page.click(sel)
    page.wait_for_timeout(700)


def settle(page):
    page.wait_for_function("() => document.getElementById('examNextBtn')", timeout=8000)
    page.wait_for_timeout(500)


# ────────────────────────── A ──────────────────────────
def check_order(browser, failures, errors):
    ctx = browser.new_context()
    page = t54.new_page(ctx, errors)
    idx = open("index.html", encoding="utf-8").read()
    m = re.search(r"title: 'Часть 1 — краткий ответ', items: \[([^\]]*)\]", idx)
    part1 = re.findall(r"'([a-z0-9_]+)'", m.group(1)) if m else []
    for url, bank in (("ege_base.html?n=1", "EGE_BASE_BANK"), ("ege_prof.html?n=1", "EGE_PROF_BANK"),
                      ("oge_part2.html?n=20", "OGE_PART2_BANK")):
        page.goto(f"{BASE}/{url}")
        settle(page)
        res = page.evaluate(f"""() => ({{
            nav: ExamNav.list.map(p => p.slug + (p.n ? ':' + p.n : '')),
            bank: Object.keys(window.{bank}.tasks).map(Number).sort((a, b) => a - b),
        }})""")
        slug = url.split(".")[0]
        want = [f"{slug}:{n}" for n in res["bank"]]
        got = [x for x in res["nav"] if x.startswith(slug + ":")]
        if got != want:
            failures.append(f"A/{slug}: номера в exam-nav {got} не совпадают с банком {want}")
        if slug == "oge_part2":
            first = [x for x in res["nav"] if ":" not in x]
            if first != part1:
                failures.append(f"A: ОГЭ часть 1 в exam-nav {first}, в каталоге главной {part1}")
    print(f"  A: порядок номеров сверен с каталогом ({len(part1)} тренажёров части 1) и тремя банками")
    ctx.close()


# ────────────────────────── B ──────────────────────────
PAGES_B = [
    ("oge1_5.html", True, False), ("oge6.html", False, False), ("oge7.html", False, False),
    ("oge8.html", False, False), ("oge9.html", False, False), ("oge10.html", False, False),
    ("oge11.html", False, False), ("oge12.html", False, False), ("oge13.html", False, False),
    ("oge14.html", False, False), ("oge15_18.html", False, False), ("oge19.html", False, False),
    ("oge_part2.html?n=20", False, False), ("oge_part2.html?n=25", False, True),
    ("ege_base.html?n=1", True, False), ("ege_base.html?n=11", False, False), ("ege_base.html?n=21", False, True),
    ("ege_prof.html?n=1", True, False), ("ege_prof.html?n=20", False, True),
]
GEOM = r"""() => {
  const h1 = document.querySelector('h1.exam-nav-h1');
  const p = document.getElementById('examPrevBtn'), n = document.getElementById('examNextBtn');
  const t = h1 && h1.querySelector('.exam-nav-text');
  if (!h1 || !p || !n || !t) return null;
  const r = el => el.getBoundingClientRect();
  const rp = r(p), rn = r(n), rt = r(t);
  const ref = document.querySelector('.type-nav-btn');
  const cs = el => getComputedStyle(el);
  const pick = el => { const c = cs(el); return { bg: c.backgroundColor, border: c.borderTopColor, bw: c.borderTopWidth,
    color: c.color, font: c.fontFamily, weight: c.fontWeight, blur: c.backdropFilter || c.webkitBackdropFilter }; };
  return {
    order: [...h1.children].map(e => e.id || e.className),
    prev: { x1: rp.left, x2: rp.right, cy: (rp.top + rp.bottom) / 2, w: rp.width, h: rp.height, radius: cs(p).borderRadius, text: p.textContent },
    next: { x1: rn.left, x2: rn.right, cy: (rn.top + rn.bottom) / 2, w: rn.width, h: rn.height, radius: cs(n).borderRadius, text: n.textContent },
    text: { x1: rt.left, x2: rt.right, cy: (rt.top + rt.bottom) / 2, s: t.textContent },
    style: pick(p), ref: ref ? pick(ref) : null, pe: cs(p).pointerEvents,
  };
}"""


def check_buttons(browser, failures, errors):
    ctx = browser.new_context()
    page = t54.new_page(ctx, errors)
    for url, first, last in PAGES_B:
        page.goto(f"{BASE}/{url}")
        settle(page)
        # курсор мог остаться над стрелкой с прошлой страницы — наведение
        # красит рамку, а сравниваем обычный вид
        page.mouse.move(2, 700)
        page.wait_for_timeout(200)
        g = page.evaluate(GEOM)
        if not g:
            failures.append(f"B/{url}: нет стрелок у заголовка")
            continue
        if g["order"] != ["examPrevBtn", "exam-nav-text", "examNextBtn"]:
            failures.append(f"B/{url}: порядок в заголовке {g['order']}")
        if not (g["prev"]["x2"] <= g["text"]["x1"] + 1 and g["next"]["x1"] >= g["text"]["x2"] - 1):
            failures.append(f"B/{url}: стрелки не по бокам текста: {g['prev']} {g['text']} {g['next']}")
        for side in ("prev", "next"):
            b = g[side]
            if abs(b["cy"] - g["text"]["cy"]) > 4:
                failures.append(f"B/{url}: {side} не на одной высоте с заголовком ({b['cy']:.0f} и {g['text']['cy']:.0f})")
            if abs(b["w"] - b["h"]) > 0.5 or b["radius"] != "50%":
                failures.append(f"B/{url}: {side} не круглая: {b['w']}×{b['h']}, radius {b['radius']}")
        if g["prev"]["text"] != "◀" or g["next"]["text"] != "▶":
            failures.append(f"B/{url}: стрелки {g['prev']['text']!r} {g['next']['text']!r}")
        if g["pe"] != "auto":
            failures.append(f"B/{url}: стрелки не ловят мышь (pointer-events {g['pe']})")
        if g["ref"]:
            diff = {k: (g["style"][k], g["ref"][k]) for k in g["ref"] if g["style"][k] != g["ref"][k]}
            if diff:
                failures.append(f"B/{url}: вид отличается от стрелок прототипов: {diff}")
        i = info(page)
        if i["prevDis"] != first or i["nextDis"] != last:
            failures.append(f"B/{url}: неактивны ◀={i['prevDis']} ▶={i['nextDis']}, ждали {first}/{last}")
        # неактивная стрелка никуда не ведёт
        if first or last:
            before = page.url
            page.click("#examPrevBtn" if first else "#examNextBtn", force=True)
            page.wait_for_timeout(500)
            if page.url != before:
                failures.append(f"B/{url}: неактивная стрелка увела на {page.url}")
        # режим фокуса: заголовок со стрелками сворачивается
        page.evaluate("() => document.documentElement.setAttribute('data-focus', 'on')")
        page.wait_for_timeout(450)
        hh = page.evaluate("() => document.querySelector('h1.exam-nav-h1').getBoundingClientRect().height")
        page.evaluate("() => document.documentElement.removeAttribute('data-focus')")
        if hh > 1:
            failures.append(f"B/{url}: в режиме фокуса заголовок со стрелками не свернулся ({hh:.0f}px)")
    # заход по адресу (с главной), а не стрелкой — как раньше, экран выбора.
    # Свой контекст на каждый адрес: ЕГЭ-страница, которую ведущий сессии уже
    # открывал на другом номере, по адресу открывает задание сразу — так было
    # и до №73 (снимок из базы + номер из адреса), это не про стрелки
    for url in ("oge7.html", "oge15_18.html", "ege_base.html?n=5", "oge_part2.html?n=23"):
        c2 = browser.new_context()
        p2 = t54.new_page(c2, errors)
        p2.goto(f"{BASE}/{url}")
        settle(p2)
        if info(p2)["onTask"]:
            failures.append(f"B/{url}: заход по адресу сразу открыл задание (ждали экран выбора)")
        c2.close()
    # карточка «+» — только задание
    for url in ("oge6.html?card=1", "ege_base.html?n=3&card=1", "oge_part2.html?n=22&card=1"):
        page.goto(f"{BASE}/{url}")
        page.wait_for_timeout(600)
        if page.evaluate("() => !!document.getElementById('examPrevBtn')"):
            failures.append(f"B/{url}: в карточке «+» появились стрелки")
    print(f"  B: {len(PAGES_B)} страниц — круглые стрелки по бокам заголовка, вид стрелок прототипов, "
          "края экзаменов неактивны, в карточках их нет")
    ctx.close()


# ────────────────────────── C ──────────────────────────
def switch_type(page, url):
    """Сменить тип на странице ОГЭ на не первый (так, как это сделал бы учитель)."""
    if url.startswith("oge9"):
        page.click("#backBtn") if page.evaluate("() => document.getElementById('taskArea').style.display !== 'none'") \
            else page.click("#linBackBtn")
        page.wait_for_timeout(300)
        page.click('#pickerArea .mode-card[data-id="rational"]')
    elif url.startswith("oge19"):
        page.click("#backBtn")
        page.wait_for_timeout(300)
        page.click('#pickerArea .mode-card[data-id="geom"]')
    else:
        page.click("#nextTypeBtn")
    page.wait_for_timeout(500)


def answer_oge6(page):
    page.evaluate("""() => { const v = String(tsGetState().curTask.correctValue).replace('.', ',');
        const i = document.getElementById('answerInput'); i.value = v; i.dispatchEvent(new Event('input', {bubbles: true}));
        document.getElementById('checkAnswerBtn').click(); }""")
    page.wait_for_timeout(400)
    return page.evaluate("() => ({ v: document.getElementById('answerInput').value, good: document.getElementById('answerInput').classList.contains('good'), answered: tsGetState().taskAnswered })")


def check_oge_walk(browser, failures, errors):
    ctx = browser.new_context()
    page = t54.new_page(ctx, errors)
    page.goto(f"{BASE}/oge1_5.html")
    settle(page)
    # №1–5 открыт по адресу и не тронут — он «ещё не открывался»
    seen = {}
    changed = {"oge6.html", "oge7.html", "oge9.html", "oge10.html", "oge12.html", "oge19.html"}
    answered = None
    for k, url in enumerate(OGE_SEQ[1:], 1):
        arrow(page, "next")
        i = info(page)
        if i["url"] != url:
            failures.append(f"C: «вперёд» с {OGE_SEQ[k - 1]} привела на {i['url']}, ждали {url}")
            break
        if not i["onTask"]:
            failures.append(f"C/{url}: впервые открытый номер — не задание, а экран выбора")
        if "?n=" not in url:
            # первый прототип — первая карточка экрана выбора
            page.evaluate("() => { const b = document.getElementById('backBtn'); }")
            want_first = page.evaluate(FIRST_CARD)
            first_type = i["type"]
            # в №1–5 первая карточка — тема «Шина 0», тип — её первое задание
            ok = first_type == want_first or (url == "oge1_5.html")
            if not ok:
                failures.append(f"C/{url}: впервые открыт тип {first_type}, первая карточка — {want_first}")
        else:
            n = int(url.split("=")[1])
            if i["type"] != f"{n}.0" and not (i["type"] or "").startswith(f"{n}."):
                failures.append(f"C/{url}: открыт прототип {i['type']}")
        if url in changed:
            switch_type(page, url)
            i = info(page)
            if url == "oge6.html":
                answered = answer_oge6(page)
                if not answered["answered"]:
                    failures.append(f"C/oge6: не удалось решить задание для проверки: {answered}")
                i = info(page)
        seen[url] = i
    last = info(page)
    if last["url"] != OGE_SEQ[-1] or not last["nextDis"]:
        failures.append(f"C: в конце ОГЭ {last['url']}, ▶ неактивна={last['nextDis']}")
    # назад до №1–5: везде то же, что оставили
    for url in reversed(OGE_SEQ[:-1]):
        arrow(page, "prev")
        i = info(page)
        if i["url"] != url:
            failures.append(f"C: «назад» привела на {i['url']}, ждали {url}")
            break
        if url == "oge1_5.html":
            if not i["onTask"] or not i["prevDis"]:
                failures.append(f"C/oge1_5: {i}")
            continue
        was = seen.get(url)
        if not was:
            continue
        if i["type"] != was["type"]:
            failures.append(f"C/{url}: вернулись на тип {i['type']}, а был {was['type']}")
        elif i["task"] != was["task"]:
            failures.append(f"C/{url}: задание другое: {str(i['task'])[:90]} … было {str(was['task'])[:90]}")
        if url == "oge6.html" and answered:
            a = page.evaluate("() => ({ v: document.getElementById('answerInput').value, good: document.getElementById('answerInput').classList.contains('good'), answered: tsGetState().taskAnswered })")
            if not a["answered"] or not a["good"] or not a["v"]:
                failures.append(f"C/oge6: решённое задание вернулось не решённым: {a}")
    # и ещё раз вперёд — память не одноразовая
    for url in OGE_SEQ[1:6]:
        arrow(page, "next")
        i = info(page)
        was = seen.get(url)
        if was and (i["type"], i["task"]) != (was["type"], was["task"]):
            failures.append(f"C/{url}: на втором проходе {i['type']}, было {was['type']}")
    print(f"  C: ОГЭ пройден стрелками от №1–5 до №25 и обратно — первые прототипы, возвраты "
          f"на тот же тип и задание ({len(changed)} страниц со сменой типа, решённое — решённым)")
    ctx.close()


# ────────────────────────── D ──────────────────────────
def check_proto_memory(browser, failures, errors):
    ctx = browser.new_context()
    page = t54.new_page(ctx, errors)
    page.goto(f"{BASE}/oge6.html")
    settle(page)
    arrow(page, "next")                      # №7, впервые — первый тип
    page.click("#nextTypeBtn")               # тип A
    page.wait_for_timeout(400)
    a = info(page)
    page.click("#nextTypeBtn")               # тип B
    page.wait_for_timeout(400)
    b = info(page)
    if a["type"] == b["type"]:
        failures.append("D: не удалось сменить тип в №7")
    arrow(page, "next")                      # №8
    arrow(page, "prev")                      # назад в №7
    back = info(page)
    if (back["type"], back["task"]) != (b["type"], b["task"]):
        failures.append(f"D: в №7 вернулись на {back['type']} (ждали {b['type']} с тем же заданием)")
    page.click("#prevTypeBtn")
    page.wait_for_timeout(400)
    a2 = info(page)
    if (a2["type"], a2["task"]) != (a["type"], a["task"]):
        failures.append(f"D: «◀ Предыдущий тип» после возврата: {a2['type']} и "
                        f"{'то же' if a2['task'] == a['task'] else 'другое'} задание — память прототипов сбилась")
    print("  D: №7 тип A → тип B → №8 → назад: тип B с его заданием, «◀ тип» — A с его прежним заданием")
    ctx.close()


# ────────────────────────── E ──────────────────────────
def check_ege(browser, failures, errors):
    for slug, last_n, exam in (("ege_base", 21, "ЕГЭ база"), ("ege_prof", 20, "ЕГЭ профиль")):
        ctx = browser.new_context()
        page = t54.new_page(ctx, errors)
        page.goto(f"{BASE}/{slug}.html?n=1")
        settle(page)
        loads = page.evaluate("() => (window.__loadMark = Math.random())")
        arrow(page, "next", navigates=False)          # №2 — впервые
        i = info(page)
        if i["n"] != 2 or i["type"] != page.evaluate("() => EGE_%s_BANK.tasks[2].protos[0].id" % ("BASE" if slug == "ege_base" else "PROF")):
            failures.append(f"E/{slug}: «вперёд» с №1: номер {i['n']}, прототип {i['type']}")
        if not i["url"].endswith("?n=2") or f"{exam} · №2" not in i["title"]:
            failures.append(f"E/{slug}: адрес {i['url']}, заголовок {i['title']!r}")
        if page.evaluate("() => window.__loadMark") != loads:
            failures.append(f"E/{slug}: страница перезагрузилась при смене номера")
        page.click("#nextProtoBtn")                   # №2, прототип 2
        page.wait_for_timeout(300)
        p2 = info(page)["type"]
        arrow(page, "prev", navigates=False)          # №1 — открывали только список → первый прототип
        i = info(page)
        first1 = page.evaluate("() => window.__examNav && protos(1)[0].id")
        if i["n"] != 1 or i["type"] != first1 or not i["prevDis"]:
            failures.append(f"E/{slug}: «назад» на №1: {i}")
        page.click("#nextProtoBtn")
        page.wait_for_timeout(400)
        page.click("#nextProtoBtn")
        page.wait_for_timeout(400)
        p1 = info(page)["type"]
        page.click("#backBtn")                        # ушли на список — помним последний открытый
        page.wait_for_timeout(1200)
        arrow(page, "next", navigates=False)
        i = info(page)
        if (i["n"], i["type"]) != (2, p2):
            failures.append(f"E/{slug}: вернулись на №2 с прототипом {i['type']}, ждали {p2}")
        arrow(page, "prev", navigates=False)
        i = info(page)
        if (i["n"], i["type"]) != (1, p1):
            failures.append(f"E/{slug}: вернулись на №1 с прототипом {i['type']}, ждали {p1}")
        # последний номер: правая неактивна, из ЕГЭ никуда не уходим
        page.goto(f"{BASE}/{slug}.html?n={last_n - 1}")
        settle(page)
        arrow(page, "next", navigates=False)
        i = info(page)
        if i["n"] != last_n or not i["nextDis"] or not i["onTask"]:
            failures.append(f"E/{slug}: последний номер: {i}")
        page.click("#examNextBtn", force=True)
        page.wait_for_timeout(500)
        if not page.url.split("/")[-1].startswith(slug):
            failures.append(f"E/{slug}: с последнего номера ушли на {page.url}")
        ctx.close()
    # ОГЭ часть 2: внутри страницы, а с краёв — на соседние страницы ОГЭ
    ctx = browser.new_context()
    page = t54.new_page(ctx, errors)
    page.goto(f"{BASE}/oge_part2.html?n=21")
    settle(page)
    arrow(page, "prev", navigates=False)
    i = info(page)
    if i["n"] != 20 or i["prevDis"]:
        failures.append(f"E/oge_part2: с №21 назад: {i}")
    arrow(page, "prev")
    i = info(page)
    if i["url"] != "oge19.html" or not i["onTask"]:
        failures.append(f"E/oge_part2: с №20 назад привело на {i['url']} (onTask={i['onTask']})")
    arrow(page, "next")
    i = info(page)
    if i["url"] != "oge_part2.html?n=20" or i["type"] != "20.0":
        failures.append(f"E/oge_part2: с №19 вперёд: {i['url']} {i['type']}")
    print("  E: ЕГЭ база и профиль — номер без перезагрузки, первый прототип, возврат на прежний; "
          "ОГЭ часть 2 стыкуется с №19")
    ctx.close()


# ────────────────────────── F ──────────────────────────
def wait_code(page):
    page.wait_for_function("() => window.TrainerSession && window.TrainerSession.getCode()", timeout=10000)
    return page.evaluate("() => window.TrainerSession.getCode()")


def check_session(browser, failures, errors):
    ctx = browser.new_context()
    teacher = t54.new_page(ctx, errors)
    teacher.goto(f"{BASE}/oge6.html")
    code = wait_code(teacher)
    teacher.click('#pickerArea .mode-card[data-id]:not(.random)')
    teacher.wait_for_timeout(500)
    student = t54.new_page(ctx, errors, latency=30)
    student.goto(f"{BASE}/oge6.html?s={code}")
    wait_code(student)
    student.wait_for_timeout(1200)
    # ученик: стрелка ограничена
    before = student.url
    student.click("#examNextBtn")
    student.wait_for_timeout(600)
    hint = student.evaluate("() => { const h = document.getElementById('tsRestrictedHint'); return h ? h.style.opacity : null; }")
    if student.url != before or hint != "1":
        failures.append(f"F: у ученика стрелка сработала (адрес {student.url}, подсказка {hint})")
    # учитель: вперёд — ученик следом
    with student.expect_navigation(timeout=8000):
        with teacher.expect_navigation():
            teacher.click("#examNextBtn")
    teacher.wait_for_timeout(800)
    try:
        student.wait_for_function(
            "(w) => { try { const s = tsGetState(); return !s.picker && s.curMode === w.m && JSON.stringify(s.curTask) === w.t; } catch (e) { return false; } }",
            arg={"m": info(teacher)["type"], "t": info(teacher)["task"]}, timeout=8000)
    except Exception:
        failures.append(f"F: ученик на {info(student)['url']} / {info(student)['type']}, учитель на "
                        f"{info(teacher)['url']} / {info(teacher)['type']}")
    if not info(student)["url"].startswith("oge7.html"):
        failures.append(f"F: ученик не ушёл за учителем: {student.url}")
    ctx.close()

    # ЕГЭ: номер меняется внутри страницы — ученик на том же номере и прототипе
    ctx = browser.new_context()
    teacher = t54.new_page(ctx, errors)
    teacher.goto(f"{BASE}/ege_base.html?n=3")
    code = wait_code(teacher)
    teacher.click("#protoList .mode-card")
    student = t54.new_page(ctx, errors, latency=30)
    student.goto(f"{BASE}/ege_base.html?n=3&s={code}")
    wait_code(student)
    student.wait_for_timeout(1200)
    teacher.click("#examNextBtn")
    teacher.wait_for_timeout(300)
    teacher.click("#nextProtoBtn")
    want = info(teacher)
    try:
        student.wait_for_function("(w) => __examNav.n() === w.n && __examNav.pid() === w.p",
                                  arg={"n": want["n"], "p": want["type"]}, timeout=6000)
    except Exception:
        got = info(student)
        failures.append(f"F/ege_base: у ученика №{got['n']} {got['type']}, у учителя №{want['n']} {want['type']}")
    if info(student)["title"] != want["title"]:
        failures.append(f"F/ege_base: заголовок ученика {info(student)['title']!r}, учителя {want['title']!r}")
    print("  F: сессия — ученик уходит за учителем на тот же номер и задание (ОГЭ и ЕГЭ), "
          "у ученика стрелки ограничены")
    ctx.close()


# ────────────────────────── G ──────────────────────────
def check_phone(browser, failures, errors):
    for w in (1280, 1066, 1024, 768, 600, 375, 320):
        mobile = w < 700
        ctx = browser.new_context(viewport={"width": w, "height": 740}, is_mobile=mobile, has_touch=mobile)
        page = t54.new_page(ctx, errors)
        for url in ("oge12.html", "oge15_18.html", "oge7.html", "oge_part2.html?n=24",
                    "ege_prof.html?n=12", "ege_base.html?n=21"):
            page.goto(f"{BASE}/{url}")
            settle(page)
            r = page.evaluate("""() => {
                const h1 = document.querySelector('h1.exam-nav-h1');
                const p = document.getElementById('examPrevBtn').getBoundingClientRect();
                const n = document.getElementById('examNextBtn').getBoundingClientRect();
                const t = h1.querySelector('.exam-nav-text').getBoundingClientRect();
                // круглые кнопки в углах страницы (домой, тема, доступ, доска, фокус) —
                // position:fixed; стрелки не должны ложиться под них
                const hits = [];
                document.querySelectorAll('body *').forEach(el => {
                  const cs = getComputedStyle(el);
                  if (cs.position !== 'fixed' || cs.display === 'none' || cs.visibility === 'hidden' || +cs.opacity === 0) return;
                  const b = el.getBoundingClientRect();
                  if (!b.width || b.width > 80 || b.height > 80) return;
                  [p, n].forEach((a, k) => {
                    if (a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom)
                      hits.push((k ? '▶' : '◀') + ' под ' + (el.id || el.className));
                  });
                });
                return { clipped: h1.scrollHeight > h1.clientHeight + 1, pl: p.left, nr: n.right,
                         vw: document.documentElement.clientWidth, sw: document.documentElement.scrollWidth,
                         sameRow: Math.abs((p.top + p.bottom) - (n.top + n.bottom)) < 2,
                         textOut: t.right > n.left + 1 || t.left < p.right - 1, hits };
            }""")
            if (r["clipped"] or r["pl"] < 0 or r["nr"] > r["vw"] or r["sw"] > r["vw"] or not r["sameRow"]
                    or r["textOut"] or r["hits"]):
                failures.append(f"G/{w}/{url}: {r}")
        ctx.close()
    print("  G: 1280, 1066, 1024, 768, 600, 375 и 320 px — стрелки в строке с заголовком и не под кнопками в углах, "
          "текст не обрезан, вбок не прокручивается")


def run():
    failures, errors = [], []
    only = sys.argv[1:]
    with t54.local_server(), sync_playwright() as p:
        browser = p.chromium.launch()
        for name, fn in (("A", check_order), ("B", check_buttons), ("C", check_oge_walk),
                         ("D", check_proto_memory), ("E", check_ege), ("F", check_session), ("G", check_phone)):
            if only and name not in only:
                continue
            fn(browser, failures, errors)
        browser.close()
    if errors:
        failures.extend("ошибка JS: " + e for e in errors)
    if failures:
        print("\nПРОВАЛ:")
        for f in failures:
            print("  - " + f)
        sys.exit(1)
    print("\nВсё прошло.")


if __name__ == "__main__":
    run()
