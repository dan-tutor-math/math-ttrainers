"""
Раскладка заданий из панели тренажёров по листу доски.

Было: стопка начиналась в левом верхнем углу экрана и столбики по 3 уходили
вправо без конца — поперёк границ листов. Стало (boards-core.js: stackSlot,
newStackSpot, snapIntoSheet):

Проверяет:
  1. Первое задание — в левом верхнем углу видимой части, если там оно не
     пересекает границу листа.
  2. Левый верхний угол экрана у правой границы листа (задание легло бы
     поперёк) — задание переезжает на лист справа, к его левому краю.
  3. То же по вертикали — на лист ниже, к его верхнему краю.
  4. Столбики по 3 идут вправо только до правого края листа, где стопка
     началась; дальше — новый ряд ниже от того же левого края, откуда
     начали (не от края листа); низ листа — продолжение на листе ниже, тоже
     от левого края стопки. Ни одно задание не пересекает границу листа,
     наложений нет.
  5. Угол экрана занят чужим заданием — новое всё равно на экране, на листе
     и без наложений.
  6. Нет ошибок JavaScript.

Запуск: python3 test_prompt_board_task_sheet_flow.py (сервер поднимается сам).
Совместный режим отсюда не проверить: как раскладка выглядит у собеседника
на общей доске — перепроверить на сайте руками.
"""
import json
import sys

import test_prompt68_board_task_layout as T68
from playwright.sync_api import sync_playwright

T68.PORT = 8995
T68.BASE = f"http://127.0.0.1:{T68.PORT}"
FAILS = []
EPS = 0.6


def check(name, ok, info=""):
    print(("[OK] " if ok else "[FAIL] ") + name + ("" if ok or not info else f" — {info}"))
    if not ok:
        FAILS.append(name)


def objs(page):
    return page.evaluate("() => JSON.parse(JSON.stringify(getCurrentBoard().objects, (k, v) => k === 'src' ? '…' : v))")


def clear(page):
    page.evaluate("() => { getCurrentBoard().objects = []; boardsRedraw(); }")


def view_at(page, zoom, vx, vy):
    """Масштаб zoom, левый верхний угол видимой части — в мировой точке (vx, vy)."""
    page.evaluate(f"() => {{ setZoom({zoom}, 30000, 30000, cssW / 2, cssH / 2); boardsRedraw(); }}")
    v = page.evaluate("() => visibleBoardRect()")
    cx, cy = 30000 + (vx - v["x"]), 30000 + (vy - v["y"])
    page.evaluate(f"() => {{ setZoom({zoom}, {cx}, {cy}, cssW / 2, cssH / 2); boardsRedraw(); }}")
    page.wait_for_timeout(120)
    return page.evaluate("() => visibleBoardRect()")


def add(page):
    T68.add_to_board(page)
    return T68.obj(page)


def crosses(r, sw, sh):
    """Пересекает ли прямоугольник границу листа (по вертикали или горизонтали)."""
    x, y, w, h = r
    return int((x + 1e-6) // sw) != int((x + w - 1e-6) // sw) or int((y + 1e-6) // sh) != int((y + h - 1e-6) // sh)


def no_overlaps(rs):
    return all(not T68.overlap(rs[i], rs[j]) for i in range(len(rs)) for j in range(i + 1, len(rs)))


def run():
    with T68.local_server(), sync_playwright() as p:
        browser = p.chromium.launch()
        page, errors = T68.open_board(browser.new_context())
        T68.open_panel(page)
        T68.open_trainer(page, "oge6", "oge6.html", "document.querySelectorAll('.mode-card:not(.soon)')[1].click()")
        sw, sh = page.evaluate("() => [sheetWpx(), sheetHpx()]")

        # ── 1. угол экрана внутри листа — туда же ───────────────────────
        v = view_at(page, 1, 10 * sw + 300, 10 * sh + 200)
        a = add(page)
        g = a["gap"]
        check("1. первое — в левом верхнем углу видимой части",
              abs(a["points"][0]["x"] - (v["x"] + g)) < 1 and abs(a["points"][0]["y"] - (v["y"] + g)) < 1,
              (a["points"][0], v))
        check("1. не пересекает границу листа", not crosses(T68.rect(a), sw, sh))

        # ── 2. поперёк вертикальной границы — на лист справа ───────────
        clear(page)
        w0 = a["w"]
        v = view_at(page, 1, 12 * sw - w0 / 2, 10 * sh + 200)
        b = add(page)
        check("2. у правой границы листа — на лист справа, к его левому краю",
              abs(b["points"][0]["x"] - (12 * sw + b["gap"])) < 1 and abs(b["points"][0]["y"] - (v["y"] + b["gap"])) < 1,
              (b["points"][0], 12 * sw))
        check("2. не пересекает границу листа", not crosses(T68.rect(b), sw, sh))

        # ── 3. поперёк горизонтальной границы — на лист ниже ───────────
        clear(page)
        v = view_at(page, 1, 10 * sw + 300, 12 * sh - a["h"] / 2)
        c = add(page)
        check("3. у нижней границы листа — на лист ниже, к его верхнему краю",
              abs(c["points"][0]["y"] - (12 * sh + c["gap"])) < 1 and abs(c["points"][0]["x"] - (v["x"] + c["gap"])) < 1,
              (c["points"][0], 12 * sh))
        check("3. задание целиком видно (камера подъехала)",
              page.evaluate(f"""() => {{ const v = visibleBoardRect(); const o = getCurrentBoard().objects.find(x => x.id === {json.dumps(c['id'])});
                  return o.points[0].y + o.h <= v.y + v.h + 0.6 && o.points[0].y >= v.y - 0.6; }}"""))

        # ── 4. раскладка: до правого края листа, дальше ряд ниже, потом лист ниже
        clear(page)
        # начало в середине листа по ширине: от края стопки до правого края
        # листа помещается не больше двух-трёх столбиков
        v = view_at(page, 1, 20 * sw + sw * 0.45, 20 * sh + 40)
        ts = [add(page)]
        for _ in range(17):
            ts.append(add(page))
        ts = [o for o in objs(page) if o.get("stack")]
        ts.sort(key=lambda o: o["stack"]["i"])
        rs = [T68.rect(o) for o in ts]
        g = ts[0]["gap"]
        x0 = rs[0][0]
        pcol = int(x0 // sw)
        right = (pcol + 1) * sw - g
        check("4. восемнадцать заданий — одна стопка", len(ts) == 18 and len({o["stack"]["id"] for o in ts}) == 1, len(ts))
        check("4. ни одно не пересекает границу листа", not any(crosses(r, sw, sh) for r in rs),
              [r for r in rs if crosses(r, sw, sh)][:2])
        check("4. все — на листах того же столбца листов, правее края не уходят",
              all(int(r[0] // sw) == pcol and r[0] + r[2] <= right + EPS for r in rs), (pcol, [r[0] + r[2] for r in rs][:6], right))
        check("4. левее начала стопки не уходят", all(r[0] >= x0 - EPS for r in rs))
        bands = {}
        for o, r in zip(ts, rs):
            bands.setdefault(o["stack"]["b"], []).append(r)
        check("4. больше одного ряда столбиков", len(bands) >= 3, list(bands))
        check("4. каждый ряд начинается от левого края стопки",
              all(abs(min(r[0] for r in rr) - x0) < EPS for rr in bands.values()))
        check("4. в ряду не больше трёх заданий в столбике",
              all(sum(1 for o in ts if o["stack"]["c"] == cc) <= 3 for cc in {o["stack"]["c"] for o in ts}))
        bl = sorted(bands)
        check("4. следующий ряд — ниже предыдущего",
              all(min(r[1] for r in bands[bl[k + 1]]) >= max(r[1] + r[3] for r in bands[bl[k]]) + g - EPS for k in range(len(bl) - 1)))
        prow = {int(r[1] // sh) for r in rs}
        check("4. лист кончился — продолжение на листе ниже", len(prow) >= 2, prow)
        first_lower = min(int(r[1] // sh) for r in rs) + 1
        lower = [r for r in rs if int(r[1] // sh) == first_lower]
        check("4. на листе ниже — с верхнего края и от левого края стопки",
              lower and abs(min(r[1] for r in lower) - (first_lower * sh + g)) < EPS and abs(min(r[0] for r in lower) - x0) < EPS,
              lower[:2])
        check("4. наложений нет", no_overlaps(rs))

        # ── 5. угол экрана занят чужим заданием ────────────────────────
        clear(page)
        v = view_at(page, 1, 30 * sw + 200, 30 * sh + 100)
        page.evaluate(f"""() => {{ getCurrentBoard().objects.push({{ id: 'obst', type: 'image', src: {json.dumps(T68.PIX)},
            points: [{{ x: {v['x']}, y: {v['y']} }}], w: 300, h: 300, natW: 1, natH: 1 }}); boardsRedraw(); }}""")
        d = add(page)
        rd = T68.rect(d)
        vv = page.evaluate("() => visibleBoardRect()")
        check("5. занято — новое на экране, на листе, без наложений",
              not crosses(rd, sw, sh) and no_overlaps([T68.rect(o) for o in objs(page)])
              and rd[0] >= vv["x"] - EPS and rd[0] + rd[2] <= vv["x"] + vv["w"] + EPS, (rd, vv))

        check("6. нет ошибок JavaScript", not errors, errors[:3])
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
