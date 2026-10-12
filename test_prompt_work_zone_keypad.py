"""
Рабочая зона тренажёра в узком окне (панель тренажёров на доске).

Живой случай: на доске открыт тренажёр в панели. Сразу зона заданий во всю
ширину панели, но стоит потянуть её за край — она тут же схлопывается до
узкой полосы и обратно растягивается только чуть-чуть, хоть панель и
широкая.

Причина: clampWorkW не даёт краю зоны заезжать под плавающую клавиатуру.
На большом экране клавиатура стоит сбоку от зоны, и это верно. В узком
окне (iframe панели, пол-экрана) клавиатура висит поверх зоны уже по
умолчанию — и этот предел при первом же движении ручки сжимал зону.
Теперь клавиатура ограничивает зону, только если оставляет ей хотя бы
ширину по умолчанию.

Проверяем на всех девяти тренажёрах с растягиваемой зоной:
  1. Узкое окно (960 px): потянули наружу — зона не сужается, доходит до
     ширины окна; сузили и потянули обратно — снова под окно.
  2. Широкое окно (1700 px): растягивание по-прежнему останавливается
     перед клавиатурой.
"""
import sys

from playwright.sync_api import sync_playwright

from test_prompt53_cloud_stale_versions import BASE, FAKE_LIB, local_server

# третье — как открыть задание, если страница стартует с экрана выбора
PAGES = [
    ("oge8.html", "oge8", None), ("oge12.html", "oge12", None), ("powers.html", "powers", None),
    ("percent.html", "percent", "openProto('parts', 2)"),
    ("logarithms.html", "logarithms", "startRun([LOG_BANK.props[0].id], 1)"),
    ("trig_equations.html", "trig_equations", "startRun(['cos'])"),
    ("oge_part2.html", "oge_part2", None),
    ("ege_base.html?n=1", "ege_base", None), ("ege_prof.html?n=14", "ege_prof", None),
]

fails = []


def check(name, cond, extra=""):
    print(("OK   " if cond else "FAIL ") + name + (f"  {extra}" if extra else ""))
    if not cond:
        fails.append(name)


def open_trainer(browser, url, width, prep=None):
    ctx = browser.new_context(viewport={"width": width, "height": 900})
    page = ctx.new_page()
    page.route("**/supabase-js.umd.js", lambda route: route.fulfill(
        status=200, content_type="application/javascript", body=FAKE_LIB))
    page.goto(f"{BASE}/{url}")
    page.wait_for_timeout(400)
    if prep:
        page.evaluate(f"() => {{ {prep}; }}")
        page.wait_for_timeout(400)
    if not page.is_visible("#workZone"):
        for sel in ["#protoList .mode-card", "#modesGrid .mode-card:not(.random):not(.demo)", ".mode-card"]:
            loc = page.locator(sel)
            if loc.count() and loc.first.is_visible():
                loc.first.click()
                break
        page.wait_for_timeout(400)
    return ctx, page


def zone(page):
    return page.eval_on_selector("#workZone", "e => { const r = e.getBoundingClientRect(); return {l: r.left, r: r.right, w: r.width}; }")


def drag_right(page, dx):
    box = page.eval_on_selector("#workResizeRight", "e => { const r = e.getBoundingClientRect(); return {x: r.x + r.width / 2, y: r.y + 30}; }")
    page.mouse.move(box["x"], box["y"])
    page.mouse.down()
    steps = 8
    for i in range(1, steps + 1):
        page.mouse.move(box["x"] + dx * i / steps, box["y"])
    page.mouse.up()
    page.wait_for_timeout(100)


def keypad_left(page):
    return page.evaluate("""() => { const k = document.getElementById('keypadFloat');
        if (!k || getComputedStyle(k).display === 'none') return null;
        return k.getBoundingClientRect().left; }""")


with local_server(), sync_playwright() as p:
    browser = p.chromium.launch()
    for url, slug, prep in PAGES:
        # 1. узкое окно — как iframe панели тренажёров на доске
        ctx, page = open_trainer(browser, url, 960, prep)
        if not page.is_visible("#workResizeRight"):
            check(f"{slug}: ручка зоны видна", False)
            ctx.close()
            continue
        kp = keypad_left(page)
        w0 = zone(page)["w"]
        drag_right(page, 60)
        w1 = zone(page)["w"]
        check(f"{slug} 960: потянули наружу — зона не сжалась", w1 >= w0 - 2,
              f"было {w0:.0f}, стало {w1:.0f}, клавиатура слева {kp}")
        drag_right(page, 400)
        w2 = zone(page)["w"]
        check(f"{slug} 960: растягивается до ширины окна", w2 >= 960 - 24 - 2, f"{w2:.0f}")
        drag_right(page, -250)
        w3 = zone(page)["w"]
        check(f"{slug} 960: сужается", w3 < w2 - 100, f"{w3:.0f}")
        drag_right(page, 400)
        w4 = zone(page)["w"]
        check(f"{slug} 960: после сужения снова растягивается под окно", w4 >= 960 - 24 - 2, f"{w4:.0f}")
        ctx.close()

        # 2. широкое окно — клавиатура сбоку, край зоны перед ней
        ctx, page = open_trainer(browser, url, 1700, prep)
        page.evaluate(f"localStorage.removeItem('{slug}:workZoneW')")
        kp = keypad_left(page)
        drag_right(page, 900)
        z = zone(page)
        if kp is None:
            # у этого вида задания клавиатуры нет — предел только окно
            check(f"{slug} 1700: без клавиатуры зона упирается только в окно", z["w"] <= 1700 - 24 + 1, f"{z['w']:.0f}")
        else:
            check(f"{slug} 1700: край зоны остановился перед клавиатурой", z["r"] <= kp - 10,
                  f"край {z['r']:.0f}, клавиатура {kp:.0f}")
        ctx.close()
    browser.close()

print("\nвсего провалов:", len(fails))
sys.exit(1 if fails else 0)
