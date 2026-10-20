"""
«Найти участника» на общей доске (облачная «Совместная работа»).

Справа от кнопки «Совместная работа» в верхней панели доски — участники,
которые сейчас на этой доске. Каждое имя — кнопка: камера плавно едет к
курсору человека, а если мышь у него не над доской — к середине его экрана,
и там на миг расходится кольцо «вот он».

Живой realtime из песочницы закрыт, поэтому канал — заглушка из
test_prompt10 (сообщения собеседника подаём руками через __fake.emit,
отправленное смотрим в __fake.sent).

Проверяем:
  1. Пока на доске никого — полоска участников пустая и не видна
  2. Сам участник рассылает `here` с серединой своего экрана: раз в 5 с и
     сразу после заметного сдвига камеры
  3. Пришёл `here` от собеседника — кнопка с его именем справа от кнопки
     «Совместная работа», в той же верхней панели; имя — текстом, не HTML
  4. `ask` от новенького — ответ сразу, не через 5 с
  5. Кнопка без курсора — камера посередине видимой части холста у точки
     собеседника, масштаб свой, кольцо «вот он» на месте
  6. Курсор собеседника виден — кнопка ведёт к курсору, его подпись
     подсвечивается
  7. Человек сам сдвинул камеру посреди полёта — полёт прекращается
  8. Участник только с курсором (без `here`) тоже в списке
  9. `bye` — кнопка пропадает; молчит дольше 16 с — блёклая (№93)
 10. Узкий экран: остаётся квадратик с буквой, панель не залезает под «⋯»
 11. Уход с доски — список пуст, собеседникам ушёл `bye`
"""
import sys

from playwright.sync_api import sync_playwright

import test_prompt10_shared_board_load as base

PORT = 9132
base.PORT = PORT
base.BASE = f"http://127.0.0.1:{PORT}"

VIEW = "() => window.boardsViewCenter()"


def sent_here(page):
    return page.evaluate("() => window.__fake.sent.filter(m => m.event === 'here').map(m => m.payload)")


def emit(page, event, payload):
    page.evaluate("([e, p]) => window.__fake.emit(e, p)", [event, payload])


def settle(page, x, y):
    # полёт камеры — 0,4 с, но на занятом компьютере кадры реже: ждём, пока
    # доедет, а не фиксированное время (не доехала за 3 с — проверка ниже скажет)
    try:
        page.wait_for_function("""([x, y]) => { const v = window.boardsViewCenter();
            return Math.abs(v.x - x) < 2 && Math.abs(v.y - y) < 2; }""", arg=[x, y], timeout=3000)
    except Exception:
        pass
    page.wait_for_timeout(60)


def run():
    failures = []

    def check(cond, label):
        print(("[OK] " if cond else "[FAIL] ") + label)
        if not cond:
            failures.append(label)

    with base.local_server(), sync_playwright() as p:
        browser = p.chromium.launch()
        ctx = browser.new_context(viewport={"width": 1280, "height": 800})
        page = base.open_shared(ctx, "T", [], [])
        errors = []
        page.on("pageerror", lambda e: errors.append(str(e)))

        # ── 1 ───────────────────────────────────────────────────────────
        check(page.evaluate("() => !!document.getElementById('bdPeers')"), "1. полоска участников есть в панели")
        check(not page.is_visible("#bdPeers"), "1. пока никого — полоска не видна")

        # ── 2 ───────────────────────────────────────────────────────────
        page.evaluate("() => { window.__fake.sent.length = 0; }")
        page.wait_for_timeout(6600)   # проверка раз в секунду — между двумя `here` до 6 с
        h = sent_here(page)
        check(len(h) >= 1 and all(m["uid"] == "T" for m in h), "2. раз в 5 с уходит `here`")
        v = page.evaluate(VIEW)
        check(bool(h) and abs(h[-1]["cx"] - v["x"]) < 1 and abs(h[-1]["cy"] - v["y"]) < 1,
              "2. в `here` — середина своего экрана")
        page.evaluate("() => { window.__fake.sent.length = 0; }")
        page.mouse.move(640, 450)
        page.mouse.wheel(0, 400)          # колесо двигает доску
        page.wait_for_timeout(800)
        h = sent_here(page)
        check(len(h) >= 1, "2. сдвинул камеру — `here` ушёл сразу, не через 5 с")

        # ── 3, 4 ────────────────────────────────────────────────────────
        page.evaluate("() => { window.__fake.sent.length = 0; }")
        emit(page, "here", {"uid": "S", "name": "Аня <b>x</b>", "cx": 1100, "cy": 900, "z": 1, "ask": True})
        page.wait_for_timeout(450)
        check(page.is_visible("#bdPeers .bd-peer[data-uid='S']"), "3. появилась кнопка собеседника")
        name = page.inner_text("#bdPeers .bd-peer[data-uid='S'] .bd-peer-name")
        check(name == "Аня <b>x</b>", "3. имя — текстом, не HTML")
        geo = page.evaluate("""() => {
            const s = document.getElementById('bdShareBtn').getBoundingClientRect();
            const c = document.querySelector('#bdPeers .bd-peer').getBoundingClientRect();
            const bar = document.querySelector('.bd-topbar').getBoundingClientRect();
            return { sr: s.right, sy: s.top + s.height / 2, cl: c.left, cy: c.top + c.height / 2,
                     ct: c.top, cb: c.bottom, bt: bar.top, bb: bar.bottom,
                     same: document.getElementById('bdShareBtn').nextElementSibling.id };
        }""")
        check(geo["cl"] >= geo["sr"] and abs(geo["cy"] - geo["sy"]) < 2 and geo["same"] == "bdPeers",
              "3. кнопка — справа от «Совместной работы», на одной линии")
        check(geo["ct"] >= geo["bt"] and geo["cb"] <= geo["bb"], "3. кнопка целиком в верхней панели")
        h = sent_here(page)
        check(len(h) >= 1 and not h[-1].get("ask"), "4. на `ask` ответили сразу")

        # ── 5 ───────────────────────────────────────────────────────────
        z0 = page.evaluate(VIEW)["zoom"]
        page.click("#bdPeers .bd-peer[data-uid='S']")
        settle(page, 1100, 900)
        v = page.evaluate(VIEW)
        check(abs(v["x"] - 1100) < 2 and abs(v["y"] - 900) < 2, f"5. камера у середины экрана собеседника ({v['x']:.0f}, {v['y']:.0f})")
        check(abs(v["zoom"] - z0) < 1e-6, "5. масштаб свой")
        page.wait_for_timeout(150)   # кольцо переставляется в следующем кадре
        ping = page.evaluate("""() => { const el = document.querySelector('.bd-peer-ping');
            if (!el) return null; const r = el.getBoundingClientRect(); return { x: r.left, y: r.top }; }""")
        exp = page.evaluate("() => window.__w2s({ x: 1100, y: 900 })")
        check(ping is not None and abs(ping["x"] - exp["x"]) < 3 and abs(ping["y"] - exp["y"]) < 3,
              "5. кольцо «вот он» в точке собеседника")
        check(abs(exp["y"] - (53 + 800) / 2) < 2, "5. точка посередине видимой части (под верхней панелью)")

        # ── 6 ───────────────────────────────────────────────────────────
        emit(page, "cursor", {"uid": "S", "name": "Аня <b>x</b>", "x": 700, "y": 500, "drawing": False})
        page.wait_for_timeout(100)
        page.click("#bdPeers .bd-peer[data-uid='S']")
        page.wait_for_timeout(150)
        found = page.evaluate("() => document.querySelector(\".bd-remote-cursor[data-uid='S']\").classList.contains('is-found')")
        settle(page, 700, 500)
        v = page.evaluate(VIEW)
        check(abs(v["x"] - 700) < 2 and abs(v["y"] - 500) < 2, f"6. курсор виден — камера у курсора ({v['x']:.0f}, {v['y']:.0f})")
        check(found, "6. подпись курсора подсвечена")

        # ── 7 ───────────────────────────────────────────────────────────
        emit(page, "cursor", {"uid": "S", "x": 1500, "y": 1000, "drawing": False})
        # нажатие и колесо — одним заходом в страницу: при занятом
        # компьютере полёт (0,4 с) иначе успевал бы закончиться до колеса
        mid = page.evaluate("""async () => {
            const raf = () => new Promise(r => requestAnimationFrame(r));
            document.querySelector("#bdPeers .bd-peer[data-uid='S']").click();
            await raf(); await raf();
            document.getElementById('boardCv').dispatchEvent(new WheelEvent('wheel',
                { deltaY: -300, clientX: 640, clientY: 450, bubbles: true, cancelable: true }));
            await raf(); await raf();
            return window.boardsViewCenter();
        }""")
        page.wait_for_timeout(600)
        v = page.evaluate(VIEW)
        check(abs(v["x"] - mid["x"]) < 1 and abs(v["y"] - mid["y"]) < 1 and abs(v["x"] - 1500) > 50,
              "7. сам сдвинул камеру посреди полёта — полёт прекратился")

        # ── 8 ───────────────────────────────────────────────────────────
        emit(page, "cursor", {"uid": "K", "name": "Коля", "x": 200, "y": 200, "drawing": False})
        page.wait_for_timeout(100)
        check(page.is_visible("#bdPeers .bd-peer[data-uid='K']"), "8. участник только с курсором — в списке")

        # ── 9 ───────────────────────────────────────────────────────────
        emit(page, "here", {"uid": "K", "bye": True})
        page.wait_for_timeout(100)
        check(page.locator("#bdPeers .bd-peer[data-uid='K']").count() == 0, "9. `bye` — кнопка пропала")
        emit(page, "here", {"uid": "Q", "name": "Маша", "cx": 500, "cy": 500, "z": 1})
        page.wait_for_timeout(100)
        check(page.locator("#bdPeers .bd-peer[data-uid='Q']").count() == 1, "9. третий участник появился")
        cols = page.evaluate("""() => Array.from(document.querySelectorAll('#bdPeers .bd-peer-dot')).map(d => d.style.background)""")
        check(len(cols) == len(set(cols)), "9. у присутствующих разные цвета")

        # ── 10 ──────────────────────────────────────────────────────────
        page.set_viewport_size({"width": 600, "height": 800})
        page.wait_for_timeout(200)
        narrow = page.evaluate("""() => {
            const c = document.querySelector('#bdPeers .bd-peer');
            const n = c.querySelector('.bd-peer-name');
            const menu = document.querySelector('.lg-menu');
            const peersR = document.getElementById('bdPeers').getBoundingClientRect();
            const m = menu ? menu.getBoundingClientRect() : { left: 1e9 };
            return { nameShown: getComputedStyle(n).display !== 'none', w: c.getBoundingClientRect().width,
                     right: peersR.right, menuLeft: m.left };
        }""")
        check(not narrow["nameShown"] and narrow["w"] <= 34, "10. узкий экран — только квадратик с буквой")
        check(narrow["right"] <= narrow["menuLeft"], "10. полоска не залезает под «⋯»")
        page.set_viewport_size({"width": 1280, "height": 800})

        # молчит дольше 16 с — пропадает (Маша больше ничего не шлёт;
        # Аню держим живой, как настоящую)
        for _ in range(4):
            page.wait_for_timeout(4500)
            emit(page, "here", {"uid": "S", "name": "Аня", "cx": 1100, "cy": 900, "z": 1})
        page.wait_for_timeout(1200)
        # №93: замолчавший не пропадает, а становится блёклым («нет связи») —
        # при рвущейся связи кнопка иначе мигала; пропадает после долгой
        # тишины (проверено в test_prompt93_live_link.py)
        q = page.locator("#bdPeers .bd-peer[data-uid='Q']")
        check(q.count() == 1 and "is-stale" in (q.get_attribute("class") or ""),
              "9. молчит дольше 16 с — кнопка блёклая, не пропала")
        check("is-stale" not in (page.get_attribute("#bdPeers .bd-peer[data-uid='S']", "class") or ""),
              "9. живой участник — обычная кнопка")
        check(page.locator("#bdPeers .bd-peer[data-uid='S']").count() == 1, "9. живой участник остался")
        check(page.inner_text("#bdPeers .bd-peer[data-uid='S'] .bd-peer-name") == "Аня", "9. новое имя подхватилось")

        # ── 11 ──────────────────────────────────────────────────────────
        page.evaluate("() => { window.__fake.sent.length = 0; window.onBoardClosed(); }")
        page.wait_for_timeout(100)
        check(page.locator("#bdPeers .bd-peer").count() == 0, "11. ушёл с доски — список пуст")
        check(any(m.get("bye") for m in sent_here(page)), "11. собеседникам ушёл `bye`")

        check(not errors, "без ошибок JavaScript: " + "; ".join(errors[:3]))
        browser.close()

    print()
    if failures:
        print(f"ПРОВАЛЕНО: {len(failures)}")
        sys.exit(1)
    print("Всё прошло")


if __name__ == "__main__":
    run()
