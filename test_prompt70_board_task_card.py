"""
Промпт №70: задание, добавленное на доску из тренажёра, — чистая карточка.

Проверяем на снимках разных тренажёров (ОГЭ №6, №7, №19, №8 с карточкой «+»,
сложение в столбик, НОД, ЕГЭ база; светлая и тёмная тема тренажёра):
  1. Углы за скруглением полностью прозрачные (альфа 0), а не цвета страницы.
  2. Края карточки непрозрачные, по всему краю один цвет — без обрезанной
     тени снизу и без полос по краям.
  3. Нет лишней подложки внутри: полоса между краем карточки и
     содержимым — того же цвета, что край (раньше «стекло» панели давало
     серый прямоугольник по границе содержимого).
  4. В объекте записано скругление (obj.card), доска обрезает картинку
     векторным контуром: даже непрозрачный прямоугольный PNG рисуется со
     скруглёнными углами, край ровный при масштабе 0,5, 1 и 3, на светлой
     и тёмной доске.
  5. Живые поля по-прежнему на месте (поле на снимке совпадает с живым), в
     ЕГЭ строка ответа внутри карточки.
  6. Нет ошибок JavaScript.
  7. Размер задания: у выделенного задания маркеры по углам и по бокам.
     Боковой — только ширина: задание перестраивается (строк меньше/больше),
     масштаб текста прежний, пока тянут — черновик, объект не меняется;
     противоположный край на месте; минимальная ширина; поле ответа и
     «Проверить» после перестройки на своих местах и работают; отмена.
     Угловой — пропорциональный масштаб с пределами, живые поля едут с ним.
  8. Новое задание — в масштабе и ширине последнего добавленного (из панели
     и «ещё такое же»); на пустой доске — обычный размер.

Запуск: python3 test_prompt70_board_task_card.py (сервер поднимается сам).
"""
import base64
import io
import json
import sys

from PIL import Image

sys.path.insert(0, ".")
import test_prompt68_board_task_layout as T68  # noqa: E402
from playwright.sync_api import sync_playwright  # noqa: E402

T68.PORT = 8991
T68.BASE = f"http://127.0.0.1:{T68.PORT}"
FRAME = T68.FRAME


def png_of(page, oid):
    src = page.evaluate(f"() => getCurrentBoard().objects.find(o => o.id === {json.dumps(oid)}).src")
    return Image.open(io.BytesIO(base64.b64decode(src.split(",", 1)[1]))).convert("RGBA")


def close(a, b, tol=6):
    return all(abs(int(x) - int(y)) <= tol for x, y in zip(a[:3], b[:3]))


def run():
    failures = []

    def check(name, cond):
        print(f"[{'OK' if cond else 'FAIL'}] {name}")
        if not cond:
            failures.append(name)

    with T68.local_server(), sync_playwright() as p:
        browser = p.chromium.launch()
        ctx = browser.new_context()
        page, errors = T68.open_board(ctx)
        T68.open_panel(page)

        cases = [
            ("oge6", "oge6.html", "document.querySelectorAll('.mode-card:not(.soon)')[1].click()", True),
            ("oge7", "oge7.html", "document.querySelectorAll('.mode-card:not(.soon)')[1].click()", True),
            ("oge19", "oge19.html", "document.querySelectorAll('.mode-card:not(.soon)')[1].click()", True),
            ("oge8", "oge8.html", "document.querySelectorAll('.mode-card:not(.soon)')[0].click(); appendAddedTasks(1);", True),
            ("add_col", "addition.html", None, False),
            ("gcd", "gcd.html", None, False),
            ("egeb8", "ege_base.html?n=8", "document.querySelectorAll('.mode-card')[0].click()", False),
            ("oge6", "oge6.html", "document.documentElement.setAttribute('data-theme','dark'); document.querySelectorAll('.mode-card:not(.soon)')[2].click()", True),
        ]
        added = []
        for tid, href, prep, own in cases:
            T68.open_trainer(page, tid, href, prep)
            n = T68.add_to_board(page)
            objs = page.evaluate(f"() => JSON.parse(JSON.stringify(getCurrentBoard().objects.slice(-{n}), (k, v) => k === 'src' ? '…' : v))")
            for o in objs:
                added.append((tid + (" (тёмная)" if "dark" in (prep or "") else ""), o, own))

        for name, o, own in added:
            im = png_of(page, o["id"])
            W, H = im.size
            corners = [im.getpixel(xy)[3] for xy in [(0, 0), (W - 1, 0), (0, H - 1), (W - 1, H - 1), (2, 2), (W - 3, H - 3)]]
            check(f"1. {name}: углы за скруглением прозрачные", all(a == 0 for a in corners))
            card = o.get("card") or {}
            r_px = card.get("r", 0) * W
            check(f"4. {name}: скругление записано в объект", r_px >= 8)
            # края — непрозрачные и одного цвета (средние точки сторон и
            # точки на краю поближе к углам, но уже за скруглением)
            m = int(r_px) + 4
            edge = [im.getpixel(xy) for xy in [(W // 2, 5), (W // 2, H - 6), (5, H // 2), (W - 6, H // 2),
                                                (m, 5), (W - m, 5), (m, H - 6), (W - m, H - 6)]]
            check(f"2. {name}: край непрозрачный", all(px[3] == 255 for px in edge))
            check(f"2. {name}: край одного цвета (нет тени и полос)", all(close(px, edge[0]) for px in edge))
            # полоса у края: 3..10 CSS-пикселей внутрь — тот же цвет по всей длине
            band_ok = True
            for d in (6, 12):
                for t in [i / 20 for i in range(3, 18)]:
                    for xy in [(int(W * t), d), (d, int(H * t)), (W - 1 - d, int(H * t))]:
                        if not close(im.getpixel(xy), edge[0], 5):
                            band_ok = False
            check(f"3. {name}: у края нет лишних подложек и прямоугольников", band_ok)

        # ЕГЭ: строка ответа внутри карточки, поле живое на своём месте
        ege = [o for n, o, _ in added if n == "egeb8"][0]
        hot = ege["task"]["hot"]
        f = hot["fields"][0]
        check("5. ЕГЭ: поле ответа внутри карточки (с полем от края)",
              f["x"] > 0.02 and f["y"] + f["h"] < 0.99 and f["x"] + f["w"] < 0.99)
        page.evaluate("() => setTrainersPanel('closed')")
        page.wait_for_timeout(250)
        for name, o, _ in added[:1] + [a for a in added if a[0] == "egeb8"]:
            page.evaluate(f"""() => {{ const o = getCurrentBoard().objects.find(x => x.id === {json.dumps(o['id'])});
                setZoom(1, o.points[0].x + o.w / 2, o.points[0].y + o.h / 2, cssW / 2, cssH / 2); }}""")
            page.wait_for_timeout(200)
            geo = page.evaluate(f"""() => {{
                const o = getCurrentBoard().objects.find(x => x.id === {json.dumps(o['id'])});
                const inp = document.querySelector('.bd-task[data-id="' + o.id + '"] .bd-task-in');
                const cv = document.getElementById('boardCv').getBoundingClientRect();
                const p0 = window.__w2s(o.points[0]);
                const r = inp.getBoundingClientRect(), f = o.task.hot.fields[0];
                return {{ dx: Math.abs((r.left - cv.left) - (p0.x + f.x * o.w)), dy: Math.abs((r.top - cv.top) - (p0.y + f.y * o.h)) }};
            }}""")
            check(f"5. {name}: живое поле совпадает с полем на картинке", geo["dx"] < 2 and geo["dy"] < 2)

        # ── 4. векторный контур на доске ────────────────────────────────
        # Непрозрачный красный прямоугольник как src: если доска правда режет
        # контуром, углы на экране — цвет доски, а не красные
        red = "data:image/png;base64," + base64.b64encode(
            (lambda b: (Image.new("RGBA", (200, 100), (255, 0, 0, 255)).save(b, "PNG"), b.getvalue())[1])(io.BytesIO())).decode()
        page.evaluate(f"""() => {{ const B = getCurrentBoard();
            B.objects.push({{ id: 'redcard', type: 'image', src: {json.dumps(red)}, points: [{{ x: 3000, y: 2000 }}], w: 200, h: 100,
                              natW: 200, natH: 100, locked: true, card: {{ r: 0.1 }} }});
            boardsRedraw(); }}""")
        page.wait_for_timeout(300)
        for theme in ("light", "dark"):
            page.evaluate(f"() => {{ document.documentElement.setAttribute('data-theme', {json.dumps(theme)}); boardsRedraw(); }}")
            for zoom in (0.5, 1, 3):
                page.evaluate(f"() => setZoom({zoom}, 3100, 2050, cssW / 2, cssH / 2)")
                page.wait_for_timeout(250)
                res = page.evaluate("""() => {
                    const cv = document.getElementById('boardCv'), c = cv.getContext('2d');
                    const d = cv.width / cv.getBoundingClientRect().width;
                    const p0 = window.__w2s({x: 3000, y: 2000}), p1 = window.__w2s({x: 3200, y: 2100});
                    const px = (x, y) => Array.from(c.getImageData(Math.round(x * d), Math.round(y * d), 1, 1).data);
                    const R = 0.1 * (p1.x - p0.x);
                    // угол: точка внутри прямоугольника, но за скруглением
                    const corner = px(p0.x + R * 0.12, p0.y + R * 0.12);
                    const outside = px(p0.x - 6, p0.y - 6);
                    const mid = px((p0.x + p1.x) / 2, (p0.y + p1.y) / 2);
                    // ровность края: по диагонали через дугу угла — сколько
                    // «промежуточных» пикселей между фоном и красным
                    let inter = 0;
                    const cx = p0.x + R, cy = p0.y + R;
                    for (let t = R * 0.6; t < R * 1.4; t += 1 / d) {
                      const q = px(cx - t / Math.SQRT2, cy - t / Math.SQRT2);
                      const isRed = q[0] > 240 && q[1] < 20 && q[2] < 20;
                      const isBg = Math.abs(q[0] - outside[0]) < 4 && Math.abs(q[1] - outside[1]) < 4 && Math.abs(q[2] - outside[2]) < 4;
                      if (!isRed && !isBg) inter++;
                    }
                    return { corner, outside, mid, inter, d };
                }""")
                same_bg = close(res["corner"], res["outside"], 4)
                red_mid = res["mid"][0] > 240 and res["mid"][1] < 20
                check(f"4. {theme}, масштаб {zoom}: угол за скруглением — фон доски, середина — картинка", same_bg and red_mid)
                check(f"4. {theme}, масштаб {zoom}: край на скруглении чёткий (≤ 3 промежуточных пикселя)", res["inter"] <= 3)

        check("6. нет ошибок JavaScript на странице досок", not errors)
        if errors:
            print("\n".join(errors[:5]))
        # ── 7–8. размер задания ─────────────────────────────────────────
        page.close()
        page, errors = T68.open_board(ctx)
        T68.open_panel(page)
        T68.open_trainer(page, "oge6", "oge6.html", "document.querySelectorAll('.mode-card:not(.soon)')[1].click()")
        T68.add_to_board(page)
        a = T68.obj(page)
        nat = page.evaluate(f"() => {{ const o = getCurrentBoard().objects.find(x => x.id === {json.dumps(a['id'])}); return [o.natW, o.natH]; }}")
        check("8. пустая доска — обычный размер (не крупнее 520)", abs(max(a["w"], a["h"]) - min(520, max(nat))) < 1)
        page.evaluate("() => setTrainersPanel('closed')")
        page.wait_for_timeout(250)

        def focus(o, zoom=1):
            page.evaluate(f"""() => {{ const o = getCurrentBoard().objects.find(x => x.id === {json.dumps(o['id'])});
                setZoom({zoom}, o.points[0].x + o.w / 2, o.points[0].y + o.h / 2, cssW / 2, cssH / 2); }}""")
            page.wait_for_timeout(150)

        def select(o):
            page.click('.bd-tool[data-tool="select"]')
            sr = T68.screen_rect(page, o)
            page.mouse.click(sr["x"] + sr["w"] * 0.5, sr["y"] + 6)
            page.wait_for_timeout(150)
            return page.evaluate("() => selectedId") == o["id"]

        def handles(o):
            return page.evaluate(f"""() => {{ const o = getCurrentBoard().objects.find(x => x.id === {json.dumps(o['id'])});
                const cv = document.getElementById('boardCv').getBoundingClientRect();
                const out = {{}}; getHandles(o).forEach(h => {{ const s = window.__w2s(h); out[h.role] = [cv.left + s.x, cv.top + s.y]; }}); return out; }}""")

        def drag(xy, dx, dy, steps=12, mid=None):
            page.mouse.move(*xy)
            page.mouse.down()
            for i in range(1, steps + 1):
                page.mouse.move(xy[0] + dx * i / steps, xy[1] + dy * i / steps)
                page.wait_for_timeout(16)
            if mid:
                mid()
            page.mouse.up()

        def get(o):
            return page.evaluate(f"() => JSON.parse(JSON.stringify(getCurrentBoard().objects.find(x => x.id === {json.dumps(o['id'])}), (k, v) => k === 'src' ? v.length : v))")

        focus(a)
        check("7. задание выделяется", select(a))
        hs = handles(a)
        check("7. маркеры по четырём углам и по бокам", all(k in hs for k in ("nw", "ne", "se", "sw", "iw", "ie")))
        s0 = a["w"] / a["css"]["w"]
        seen = {}

        def during():
            seen["pv"] = page.evaluate(f"() => taskWidthPreview.has({json.dumps(a['id'])})")
            seen["w"] = get(a)["w"]
            seen["vis"] = page.evaluate(f"() => document.querySelector('.bd-task[data-id=\"{a['id']}\"]').style.visibility")
        drag(hs["ie"], 260, 0, mid=during)
        check("7. пока тянут — черновик, сам объект не меняется", seen.get("pv") and abs(seen["w"] - a["w"]) < 0.01)
        check("7. пока тянут — живые поля старого снимка спрятаны", seen.get("vis") == "hidden")
        page.wait_for_function(f"() => !taskWidthPreview.has({json.dumps(a['id'])})", timeout=30000)
        page.wait_for_timeout(300)
        a2 = get(a)
        check("7. ширина выросла на протянутое", abs(a2["w"] - (a["w"] + 260)) < 3)
        check("7. масштаб текста прежний (перестройка, а не растяжение)", abs(a2["w"] / a2["css"]["w"] - s0) < 1e-6)
        check("7. левый край на месте", abs(a2["points"][0]["x"] - a["points"][0]["x"]) < 0.01)
        check("7. записана новая ширина узла", a2["css"].get("cw") and a2["css"]["cw"] > a["css"]["w"])
        check("7. снимок новый", a2["src"] != a["src"] or a2["natW"] != a["natW"])
        # поле ответа внутри карточки и работает
        geo = page.evaluate(f"""() => {{ const o = getCurrentBoard().objects.find(x => x.id === {json.dumps(a['id'])});
            const cv = document.getElementById('boardCv').getBoundingClientRect(), p0 = window.__w2s(o.points[0]);
            const box = {{ l: cv.left + p0.x, t: cv.top + p0.y, r: cv.left + p0.x + o.w * cam.zoom, b: cv.top + p0.y + o.h * cam.zoom }};
            const els = [...document.querySelectorAll('.bd-task[data-id="' + o.id + '"] .bd-task-in, .bd-task[data-id="' + o.id + '"] .bd-task-btn')];
            const f = o.task.hot.fields[0], inp = els[0].getBoundingClientRect();
            return {{ n: els.length, inside: els.every(e => {{ const r = e.getBoundingClientRect(); return r.left >= box.l - 1 && r.right <= box.r + 1 && r.top >= box.t - 1 && r.bottom <= box.b + 1; }}),
                      dx: Math.abs(inp.left - (box.l + f.x * o.w * cam.zoom)), dy: Math.abs(inp.top - (box.t + f.y * o.h * cam.zoom)) }}; }}""")
        check("7. поле и «Проверить» после перестройки — внутри карточки и на местах поля снимка", geo["n"] == 2 and geo["inside"] and geo["dx"] < 2 and geo["dy"] < 2)
        right = a2["task"]["fields"][0]["value"]
        sel = f'.bd-task[data-id="{a["id"]}"]'
        page.fill(f"{sel} .bd-task-in", str(right).replace(".", ","))
        page.click(f"{sel} .bd-task-btn")
        page.wait_for_timeout(200)
        check("7. после перестройки ответ проверяется", (get(a)["task"].get("st") or {}).get("res") == "ok")
        # левый маркер, сужаем до упора: минимальная ширина, правый край на месте
        select(a)
        hs = handles(a)
        right_edge = a2["points"][0]["x"] + a2["w"]
        drag(hs["iw"], 1200, 0)
        page.wait_for_function(f"() => !taskWidthPreview.has({json.dumps(a['id'])})", timeout=30000)
        page.wait_for_timeout(300)
        a3 = get(a)
        check("7. минимальная ширина карточки соблюдена", abs(a3["css"]["w"] - 220) < 2)
        check("7. при левом маркере правый край на месте", abs(a3["points"][0]["x"] + a3["w"] - right_edge) < 0.5)
        check("7. узкая карточка стала выше (строки перенеслись)", a3["h"] > a2["h"])
        page.evaluate("() => doUndo()")
        page.wait_for_timeout(200)
        a4 = get(a)
        check("7. отмена возвращает прежнюю ширину", abs(a4["w"] - a2["w"]) < 0.01 and a4["src"] == a2["src"])
        # угол: пропорционально, с пределами
        select(a)
        hs = handles(a)
        ratio = a4["w"] / a4["h"]
        drag(hs["se"], 180, 40)
        page.wait_for_timeout(200)
        a5 = get(a)
        check("7. угол — пропорциональный масштаб", a5["w"] > a4["w"] + 100 and abs(a5["w"] / a5["h"] - ratio) < 0.01)
        geo = page.evaluate(f"""() => {{ const o = getCurrentBoard().objects.find(x => x.id === {json.dumps(a['id'])});
            const cv = document.getElementById('boardCv').getBoundingClientRect(), p0 = window.__w2s(o.points[0]);
            const inp = document.querySelector('.bd-task[data-id="' + o.id + '"] .bd-task-in').getBoundingClientRect(), f = o.task.hot.fields[0];
            return {{ dw: Math.abs(inp.width - f.w * o.w * cam.zoom), dx: Math.abs(inp.left - (cv.left + p0.x + f.x * o.w * cam.zoom)) }}; }}""")
        check("7. живое поле масштабируется вместе с карточкой", geo["dw"] < 2 and geo["dx"] < 2)
        select(a)
        hs = handles(a)
        drag(hs["se"], -2000, -2000)
        page.wait_for_timeout(200)
        a6 = get(a)
        check("7. минимальный масштаб при уменьшении за угол", abs(a6["w"] / a6["css"]["w"] - 0.45) < 0.01)
        select(a)
        hs = handles(a)
        drag(hs["se"], 300, 300)
        page.wait_for_timeout(200)
        a7 = get(a)
        s7, cw7 = a7["w"] / a7["css"]["w"], a7["css"].get("cw")

        # ── 8. новое задание — в масштабе и ширине последнего ─────────
        T68.open_panel(page)
        T68.open_trainer(page, "oge7", "oge7.html", "document.querySelectorAll('.mode-card:not(.soon)')[1].click()")
        T68.add_to_board(page)
        b1 = T68.obj(page)
        check("8. из панели — тот же масштаб, что у последнего", abs(b1["w"] / b1["css"]["w"] - s7) < 1e-6)
        check("8. из панели — та же ширина, что у последнего", b1["css"].get("cw") == cw7 and abs(b1["css"]["w"] - a7["css"]["w"]) < 2)
        page.evaluate("() => setTrainersPanel('closed')")
        page.wait_for_timeout(200)
        focus(b1, 0.6)
        b2 = T68.more(page, b1, "right")
        check("8. «ещё такое же» — тот же масштаб и ширина", abs(b2["w"] / b2["css"]["w"] - s7) < 1e-6 and b2["css"].get("cw") == cw7)
        check("6. нет ошибок JavaScript (размер)", not errors)

        if errors:
            print("\n".join(errors[:5]))
        browser.close()

    print()
    if failures:
        print(f"Не прошло: {len(failures)}")
        for f in failures:
            print(" -", f)
        sys.exit(1)
    print("Все проверки прошли")


if __name__ == "__main__":
    run()
