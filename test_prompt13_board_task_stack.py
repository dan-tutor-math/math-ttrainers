"""
Промпт №13 «размер и раскладка заданий» (после №15 нового списка):
задания, добавленные на доску из панели тренажёров, — стопкой.

Проверяет:
  1. Первое задание новой стопки подбирается под экран: три задания с
     отступами помещаются в видимой высоте (и при сильном приближении два
     задания не занимают весь экран), задание целиком видно, лежит в левом
     верхнем углу видимой части. На обычном масштабе — мельче прежнего
     (раньше до 520 по большей стороне).
  2. Раскладка: столбики по 3, четвёртое — новый столбик справа от первого
     сверху, пятое под ним, седьмое — третий столбик; отступы одинаковые,
     наложений нет. Кнопка «+» у задания, справа от которого вплотную
     другое, — в углу своей карточки, а не на соседнем.
  3. Следующие в стопке — в масштабе первого, хоть масштаб доски между
     добавлениями меняли (приблизили, отдалили — стопка на экране).
  4. Изменили размер последнего добавленного — следующие берут новый;
     изменили не последнее — не влияет.
  5. Сильно отдалённая доска (видна страница и больше): задание не больше
     шестой части листа (2 столбика по 3 на листе), при дальнейшем
     отдалении крупнее не становится.
  6. Ушли в другое место доски (стопки на экране нет) — новая стопка там,
     в размере под текущий экран.
  7. «Ещё такое же» («+») — в масштабе и ширине исходного задания, отступ
     как у него; и когда исходное — не последнее, и когда последнее
     увеличили руками.
  8. Чужое задание на месте следующего — стопка обходит его, без наложений.
  9. Вставленная копия задания стопки — не часть стопки.
 10. Телефон: задание помещается в ширину видимой части.
 11. Нет ошибок JavaScript.

Запуск: python3 test_prompt13_board_task_stack.py (сервер поднимается сам).
Совместный режим отсюда не проверить (websocket до Supabase закрыт): как
стопка выглядит у собеседника на общей доске — перепроверить на сайте руками.
"""
import json
import sys

import test_prompt68_board_task_layout as T68
from playwright.sync_api import sync_playwright

T68.PORT = 8993
T68.BASE = f"http://127.0.0.1:{T68.PORT}"
FAILS = []
EPS = 0.6


def check(name, ok, info=""):
    print(("[OK] " if ok else "[FAIL] ") + name + ("" if ok or not info else f" — {info}"))
    if not ok:
        FAILS.append(name)


def objs(page):
    return page.evaluate("() => JSON.parse(JSON.stringify(getCurrentBoard().objects, (k, v) => k === 'src' ? '…' : v))")


def get(page, o):
    return page.evaluate(f"() => JSON.parse(JSON.stringify(getCurrentBoard().objects.find(x => x.id === {json.dumps(o['id'])}), (k, v) => k === 'src' ? '…' : v))")


def scale(o):
    return o["w"] / o["css"]["w"]


def vis(page):
    return page.evaluate("() => visibleBoardRect()")


def inside(r, v):
    x, y, w, h = r
    return x >= v["x"] - EPS and y >= v["y"] - EPS and x + w <= v["x"] + v["w"] + EPS and y + h <= v["y"] + v["h"] + EPS


def clear(page):
    page.evaluate("() => { getCurrentBoard().objects = []; boardsRedraw(); }")


def look(page, zoom, wx, wy):
    """Масштаб zoom, мировая точка (wx, wy) — в центре оставшейся части экрана."""
    page.evaluate(f"() => {{ setZoom({zoom}, {wx}, {wy}, cssW / 2, cssH / 2); boardsRedraw(); }}")
    page.wait_for_timeout(120)


def add(page):
    T68.add_to_board(page)
    return T68.obj(page)


def no_overlaps(rs):
    return all(not T68.overlap(rs[i], rs[j]) for i in range(len(rs)) for j in range(i + 1, len(rs)))


def run():
    with T68.local_server(), sync_playwright() as p:
        browser = p.chromium.launch()
        ctx = browser.new_context()
        page, errors = T68.open_board(ctx)
        T68.open_panel(page)
        T68.open_trainer(page, "oge6", "oge6.html", "document.querySelectorAll('.mode-card:not(.soon)')[1].click()")

        # ── 1–2. обычный масштаб: три в столбик, дальше новые столбики ───
        look(page, 1, 3000, 2000)
        v = vis(page)
        ts = [add(page)]
        a = ts[0]
        g = a.get("gap")
        check("1. у задания записан отступ стопки", isinstance(g, (int, float)) and g > 0, a.get("gap"))
        check("1. первое: три с отступами помещаются в видимой высоте, высота — около трети",
              3 * a["h"] + 4 * g <= v["h"] + 1 and a["h"] > v["h"] * 0.25, (a["h"], g, v["h"]))
        check("1. первое — в левом верхнем углу видимой части",
              abs(a["points"][0]["x"] - (v["x"] + g)) < 1 and abs(a["points"][0]["y"] - (v["y"] + g)) < 1,
              (a["points"][0], v))
        check("1. на обычном масштабе — мельче прежнего (было до 520)", max(a["w"], a["h"]) < 520 * 0.9, (a["w"], a["h"]))
        for _ in range(6):
            ts.append(add(page))
        ts = [get(page, t) for t in ts]
        rs = [T68.rect(t) for t in ts]
        x0, y0 = rs[0][0], rs[0][1]
        check("1. первые три целиком на экране", all(inside(r, vis(page)) for r in rs[:3]) or all(inside(r, v) for r in rs[:3]))
        check("2. первые три — один столбик (левый край общий)", all(abs(r[0] - x0) < EPS for r in rs[:3]))
        check("2. второе под первым, третье под вторым, отступ одинаковый",
              abs(rs[1][1] - (rs[0][1] + rs[0][3] + g)) < EPS and abs(rs[2][1] - (rs[1][1] + rs[1][3] + g)) < EPS)
        col0_right = max(r[0] + r[2] for r in rs[:3])
        check("2. четвёртое — новый столбик справа от первого, сверху",
              abs(rs[3][0] - (col0_right + g)) < EPS and abs(rs[3][1] - y0) < EPS, (rs[3], col0_right, y0))
        check("2. пятое и шестое — под четвёртым",
              abs(rs[4][0] - rs[3][0]) < EPS and abs(rs[4][1] - (rs[3][1] + rs[3][3] + g)) < EPS
              and abs(rs[5][0] - rs[3][0]) < EPS and abs(rs[5][1] - (rs[4][1] + rs[4][3] + g)) < EPS)
        col1_right = max(r[0] + r[2] for r in rs[3:6])
        check("2. седьмое — третий столбик сверху", abs(rs[6][0] - (col1_right + g)) < EPS and abs(rs[6][1] - y0) < EPS)
        check("2. наложений нет", no_overlaps(rs))
        check("2. все семь — одна стопка, номера по порядку",
              len({t["stack"]["id"] for t in ts}) == 1 and [t["stack"]["i"] for t in ts] == list(range(7)))
        check("3. все в масштабе первого", all(abs(scale(t) - scale(ts[0])) < 1e-6 for t in ts))
        # кнопка «+» левого столбика не ложится на задание правого
        look(page, 1, rs[3][0], rs[0][1] + rs[0][3])
        mb = page.evaluate(f"""() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(() => {{
            const q = id => document.querySelector('.bd-task[data-id="' + id + '"]');
            const b = q({json.dumps(ts[0]['id'])}).querySelector('.bd-task-more').getBoundingClientRect();
            const t4 = getCurrentBoard().objects.find(x => x.id === {json.dumps(ts[3]['id'])});
            const cv = document.getElementById('boardCv').getBoundingClientRect();
            const p = window.__w2s(t4.points[0]);
            const r4 = {{ x: cv.left + p.x, y: cv.top + p.y, w: t4.w * cam.zoom, h: t4.h * cam.zoom }};
            const c1 = q({json.dumps(ts[0]['id'])}).getBoundingClientRect();
            r({{ hit: b.left < r4.x + r4.w && b.right > r4.x && b.top < r4.y + r4.h && b.bottom > r4.y,
                 inCard: b.left >= c1.left && b.right <= c1.right && b.top >= c1.top,
                 freeIn: q({json.dumps(ts[6]['id'])}).classList.contains('more-in') }});
        }})))""")
        check("2. «+» у задания левого столбика — внутри своей карточки, не на соседнем", not mb["hit"] and mb["inCard"], mb)
        check("2. справа свободно — «+» на прежнем месте, за краем", not mb["freeIn"], mb)

        # ── 3. масштаб доски меняли между добавлениями ──────────────────
        s0 = scale(ts[0])
        look(page, 2.5, rs[1][0] + rs[1][2] / 2, rs[1][1] + rs[1][3] / 2)
        t8 = add(page)
        look(page, 0.35, rs[0][0] + 300, rs[0][1] + 300)
        t9 = add(page)
        check("3. приблизили — следующее в масштабе первого", abs(scale(t8) - s0) < 1e-6, (scale(t8), s0))
        check("3. отдалили — следующее в масштабе первого", abs(scale(t9) - s0) < 1e-6, (scale(t9), s0))
        check("3. стопка та же, восьмое и девятое — под седьмым",
              t8["stack"]["id"] == ts[0]["stack"]["id"] and abs(t8["points"][0]["x"] - rs[6][0]) < EPS
              and abs(t8["points"][0]["y"] - (rs[6][1] + rs[6][3] + g)) < EPS
              and abs(t9["points"][0]["y"] - (t8["points"][0]["y"] + t8["h"] + g)) < EPS)

        # ── 4. размер последнего изменили руками ────────────────────────
        page.evaluate(f"""() => {{ const o = getCurrentBoard().objects.find(x => x.id === {json.dumps(t9['id'])});
            o.w *= 1.3; o.h *= 1.3; boardsRedraw(); }}""")
        t10 = add(page)
        check("4. изменили последнее — следующее в новом размере", abs(scale(t10) - s0 * 1.3) < 1e-6, (scale(t10), s0 * 1.3))
        page.evaluate(f"""() => {{ const o = getCurrentBoard().objects.find(x => x.id === {json.dumps(ts[0]['id'])});
            o.w *= 0.8; o.h *= 0.8; boardsRedraw(); }}""")
        t11 = add(page)
        check("4. изменили не последнее — не влияет", abs(scale(t11) - s0 * 1.3) < 1e-6, scale(t11))
        allr = [T68.rect(o) for o in objs(page)]
        check("4. и после этого наложений нет", no_overlaps(allr))

        # ── 7. «ещё такое же» — масштаб и ширина исходного ───────────────
        page.evaluate("() => setTrainersPanel('collapsed')")
        page.wait_for_timeout(200)
        src = get(page, ts[1])   # не последнее, прежний масштаб s0
        look(page, 1, src["points"][0]["x"] + src["w"] / 2, src["points"][0]["y"] + src["h"] / 2)
        m1 = T68.more(page, src, "right")
        check("7. «+» от не последнего — его масштаб, а не последнего", abs(scale(m1) - scale(src)) < 1e-6, (scale(m1), scale(src)))
        check("7. «+» — отступ исходного", abs(m1["gap"] - src["gap"]) < 1e-9)
        check("7. «+» — помечено стопкой исходного, но без места в столбиках",
              m1.get("stack", {}).get("id") == src["stack"]["id"] and "i" not in m1.get("stack", {}))
        big = get(page, t11)
        look(page, 1, big["points"][0]["x"] + big["w"] / 2, big["points"][0]["y"] + big["h"] / 2)
        m2 = T68.more(page, big, "down")
        check("7. «+» от увеличенного — его масштаб", abs(scale(m2) - scale(big)) < 1e-6, (scale(m2), scale(big)))
        rb, r2 = T68.rect(get(page, big)), T68.rect(m2)
        check("7. «+» вниз — вплотную под исходным с его отступом",
              abs(r2[0] - rb[0]) < EPS and r2[1] >= rb[1] + rb[3] + big["gap"] - EPS)
        # ширину узла тоже от исходного
        page.evaluate(f"""() => {{ const o = getCurrentBoard().objects.find(x => x.id === {json.dumps(ts[2]['id'])});
            o.css.cw = 300; }}""")
        src3 = get(page, ts[2])
        look(page, 1, src3["points"][0]["x"] + src3["w"] / 2, src3["points"][0]["y"] + src3["h"] / 2)
        m3 = T68.more(page, src3, "left")
        check("7. «+» — ширина узла исходного", m3["css"].get("cw") == 300, m3["css"])
        T68.open_panel(page)

        # ── 6. ушли в другое место — новая стопка под текущий экран ─────
        look(page, 1.6, 12000, 9000)
        v6 = vis(page)
        n1 = add(page)
        check("6. новая стопка (другой id)", n1["stack"]["id"] != ts[0]["stack"]["id"] and n1["stack"]["i"] == 0)
        check("6. размер — под текущий экран, а не прежней стопки",
              abs(n1["h"] - page.evaluate("() => TASK_VIEW_K") * v6["h"] / (3 + 4 * 0.06)) < 1 and abs(scale(n1) - s0 * 1.3) > 1e-3, (n1["h"], v6["h"]))
        check("6. левый верхний угол видимой части",
              abs(n1["points"][0]["x"] - (v6["x"] + n1["gap"])) < 1 and abs(n1["points"][0]["y"] - (v6["y"] + n1["gap"])) < 1)
        check("6. в старой стопке ничего не прибавилось",
              sum(1 for o in objs(page) if (o.get("stack") or {}).get("id") == ts[0]["stack"]["id"]) == 11 + 3)

        # ── 1. сильное приближение ──────────────────────────────────────
        clear(page)
        look(page, 4, 5000, 5000)
        vz = vis(page)
        z1, z2 = add(page), add(page)
        check("1. приближение ×4: три с отступами помещаются в видимой высоте",
              3 * z1["h"] + 4 * z1["gap"] <= vz["h"] + 0.5, (z1["h"], vz["h"]))
        check("1. приближение ×4: два задания не занимают весь экран",
              (z1["h"] + z2["h"] + z1["gap"]) < vz["h"] * 0.75)
        check("1. приближение ×4: оба целиком на экране", inside(T68.rect(z1), vis(page)) and inside(T68.rect(z2), vis(page)))
        check("1. приближение ×4: второе вплотную под первым",
              abs(z2["points"][0]["y"] - (z1["points"][0]["y"] + z1["h"] + z1["gap"])) < EPS)

        # ── 5. сильное отдаление: не больше шестой части листа ──────────
        clear(page)
        look(page, 0.15, 20000, 20000)
        f1 = add(page)
        mx = page.evaluate("() => taskMaxBox()")
        sh = page.evaluate("() => ({ w: sheetWpx(), h: sheetHpx() })")
        check("5. отдалили: высота упёрлась в предел (треть листа с отступами)",
              f1["h"] <= mx["h"] + EPS and (abs(f1["h"] - mx["h"]) < 1 or abs(f1["w"] - mx["w"]) < 1), (f1["w"], f1["h"], mx))
        check("5. на листе помещаются 2 столбика по 3",
              3 * f1["h"] + 4 * f1["gap"] <= sh["h"] + 1 and 2 * f1["w"] + 3 * f1["gap"] <= sh["w"] + 1, (f1["w"], f1["h"], sh))
        clear(page)
        look(page, 0.1, 40000, 40000)
        f2 = add(page)
        check("5. отдалили ещё сильнее — задание не крупнее", abs(f2["w"] - f1["w"]) < 1e-6 and abs(f2["h"] - f1["h"]) < 1e-6,
              (f1["w"], f2["w"]))
        # видна страница целиком (с полями) — уже предельный размер
        clear(page)
        page.evaluate("() => { const v = visibleBoardRect(); const z = cam.zoom * v.h / (sheetHpx() * 1.15); setZoom(z, 30000, 30000, cssW / 2, cssH / 2); boardsRedraw(); }")
        page.wait_for_timeout(120)
        f3 = add(page)
        check("5. видна целая страница — максимальный размер", abs(f3["h"] - f1["h"]) < 1 and abs(f3["w"] - f1["w"]) < 1, (f3["h"], f1["h"]))

        # ── 8. чужое задание на месте следующего ────────────────────────
        clear(page)
        look(page, 1, 8000, 3000)
        b1 = add(page)
        gb = b1["gap"]
        page.evaluate(f"""() => {{ const B = getCurrentBoard();
            B.objects.push({{ id: 'obst', type: 'image', src: {json.dumps(T68.PIX)},
              points: [{{ x: {b1['points'][0]['x']} + 20, y: {b1['points'][0]['y'] + b1['h'] + gb} + 10 }}], w: 120, h: 60, natW: 1, natH: 1 }});
            boardsRedraw(); }}""")
        b2 = add(page)
        rs8 = [T68.rect(o) for o in objs(page)]
        check("8. чужое на месте следующего — ниже него, тот же столбик",
              abs(b2["points"][0]["x"] - b1["points"][0]["x"]) < EPS and no_overlaps(rs8), rs8)

        # ── 9. вставленная копия — не часть стопки ──────────────────────
        page.evaluate(f"""() => {{ const o = getCurrentBoard().objects.find(x => x.id === {json.dumps(b1['id'])});
            setClipboard([o], getCurrentBoard().name); pasteClipboard(); }}""")
        page.wait_for_timeout(250)
        cp = [o for o in objs(page) if o.get("css") and o["id"] not in (b1["id"], b2["id"])]
        check("9. копия вставилась и без пометки стопки", len(cp) == 1 and "stack" not in cp[0], [o.get("stack") for o in cp])

        check("11. нет ошибок JavaScript", not errors, errors[:3])
        page.close()

        # ── 10. телефон ─────────────────────────────────────────────────
        mctx = browser.new_context(viewport={"width": 390, "height": 844}, is_mobile=True, has_touch=True)
        mp, merr = T68.open_board(mctx, 390, 844)
        T68.open_panel(mp)
        T68.open_trainer(mp, "oge6", "oge6.html", "document.querySelectorAll('.mode-card:not(.soon)')[1].click()")
        mp.evaluate("() => { setZoom(1, 3000, 2000, cssW / 2, cssH / 2); boardsRedraw(); }")
        T68.add_to_board(mp)
        mo = T68.obj(mp)
        mv = mp.evaluate("() => visibleBoardRect()")
        check("10. телефон: задание помещается в ширину видимой части", mo["w"] <= mv["w"] + EPS and inside(T68.rect(mo), mv),
              (mo["w"], mv))
        check("11. телефон: нет ошибок JavaScript", not merr, merr[:3])
        browser.close()

    print()
    if FAILS:
        print(f"Не прошло: {len(FAILS)}")
        for f in FAILS:
            print(" -", f)
        sys.exit(1)
    print("Все проверки прошли")


if __name__ == "__main__":
    run()
