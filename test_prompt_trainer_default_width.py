"""Ширина по умолчанию в обычной вкладке, в том числе со старым снимком.

Совместный урок проверяется через заглушку Supabase. Снимок для доски
проверяет test_prompt_oge13_work_zone.py.
"""
import json

from playwright.sync_api import expect, sync_playwright

from sync_ege_pages import TARGETS
from test_prompt54_trainer_sync_and_cards import BASE, FAKE_LIB, local_server
from test_prompt55_ege_prof import BOOT_JS, SEED_JS


PROFILE = "ege_prof.html?n=12&t=12-extrema.fipi.A3D342"
PROFILE_KEY = "ege_prof:workZoneW"
PAGES = [name for name, _ in TARGETS] + [
    "ege_prof.html", "logarithms.html", "oge8.html", "oge12.html", "oge13.html",
    "percent.html", "powers.html", "trig_equations.html",
]
PREPARE = {
    "logarithms.html": "startRun([LOG_BANK.props[0].id], 1)",
    "percent.html": "openProto('parts', 2)",
    "trig_equations.html": "startRun(['cos'])",
}
MEASURE = """() => {
  const zone = document.querySelector('#workZone');
  const row = zone.parentElement.querySelector('.submode-row, .submode-tabs') || zone.parentElement;
  const rect = el => [el.getBoundingClientRect().left, el.getBoundingClientRect().right];
  return {zone: rect(zone), row: rect(row), card: rect(document.querySelector('#questionPanel'))};
}"""


def context(browser, width=1449, shared=False):
    mobile = width == 375
    ctx = browser.new_context(viewport={"width": width, "height": 860}, is_mobile=mobile, has_touch=mobile)
    ctx.route("https://**/*", lambda route: route.abort())
    ctx.route("**/supabase-js.umd.js", lambda route: route.fulfill(
        content_type="application/javascript", body=FAKE_LIB if shared else ""))
    return ctx


def expect_aligned(page):
    expect(page.locator("#questionPanel")).to_be_visible()
    bounds = page.evaluate(MEASURE)
    for element in ("zone", "card"):
        assert all(abs(a - b) < 1 for a, b in zip(bounds[element], bounds["row"])), (page.url, bounds)


def check_aligned_trainers(browser):
    for width in (1449, 375):
        with context(browser, width) as ctx:
            ctx.add_init_script("""if (location.protocol === 'http:') {
              const key = location.pathname.split('/').pop().replace('.html', '') + ':workZoneW';
              localStorage.setItem(key, '430');
            }""")
            page = ctx.new_page()
            for filename in PAGES:
                page.goto(f"{BASE}/{filename}")
                if filename in PREPARE:
                    page.evaluate(PREPARE[filename])
                else:
                    page.locator("#protoList .mode-card:visible, #modesGrid .mode-card:not(.demo):not(.soon):visible").first.click()
                expect_aligned(page)
                assert page.eval_on_selector("#workZone", "z => z.style.getPropertyValue('--work-w')") == "", filename
        print(f"[OK] {len(PAGES)} страниц со старой настройкой, окно {width} px")


def drag_right(page, dx):
    handle = page.locator("#workResizeRight").bounding_box()
    x, y = handle["x"] + handle["width"] / 2, handle["y"] + 20
    page.mouse.move(x, y)
    page.mouse.down()
    page.mouse.move(x + dx, y, steps=8)
    page.mouse.up()


def check_reopen_and_shared(browser):
    with context(browser, shared=True) as ctx:
        teacher = ctx.new_page()
        teacher.goto(f"{BASE}/{PROFILE}")
        expect_aligned(teacher)
        teacher.wait_for_function("TrainerSession.getCode() && S.pid === '12-extrema.fipi.A3D342'")
        code = teacher.evaluate("TrainerSession.getCode()")
        teacher.evaluate("key => localStorage.setItem(key, '470')", PROFILE_KEY)
        teacher.locator("#tabPractice").click()
        drag_right(teacher, -215)
        teacher.wait_for_function("document.querySelector('#questionPanel').offsetWidth === 430")
        assert teacher.evaluate("key => localStorage.getItem(key)", PROFILE_KEY) == "470"
        teacher.wait_for_function("""code => {
          const state = JSON.parse(localStorage.getItem('fakeTrainerSessions'))[code]?.state;
          return state?.workW === 430 && state.curSubMode === 'practice';
        }""", arg=code)

        teacher.goto(f"{BASE}/{PROFILE}")
        # Вкладка «Тренировка» подтверждает, что собственный снимок уже применился.
        teacher.wait_for_function("code => TrainerSession.getCode() === code && S.mode === 'practice'", arg=code)
        expect_aligned(teacher)
        assert not teacher.evaluate("TrainerSession.isShared()")

        # Две вкладки ведут себя как преподаватель и ученик, только канал подменён.
        drag_right(teacher, -215)
        teacher.wait_for_function("document.querySelector('#questionPanel').offsetWidth === 430")
        teacher.wait_for_function("code => JSON.parse(localStorage.getItem('fakeTrainerSessions'))[code]?.state?.workW === 430", arg=code)
        ctx.add_init_script("if (location.protocol === 'http:') localStorage.setItem('tsStage:direct', '1');")
        student = ctx.new_page()
        student.goto(f"{BASE}/ege_prof.html?s={code}")
        student.wait_for_function("TrainerSession.isShared() && document.querySelector('#questionPanel').offsetWidth === 430")
        teacher.wait_for_function("TrainerSession.isShared()")
        teacher.bring_to_front()
        drag_right(teacher, 35)
        width = teacher.locator("#questionPanel").evaluate("panel => panel.offsetWidth")
        assert width == 500, (width, teacher.evaluate(MEASURE))
        assert teacher.evaluate("key => localStorage.getItem(key)", PROFILE_KEY) == "500"
        student.wait_for_function("document.querySelector('#questionPanel').offsetWidth === 500", timeout=6000)
    print("[OK] Перетаскивание, повторное открытие со старым снимком и две вкладки совместного урока")


def check_board_contexts(browser):
    with context(browser) as ctx:
        ctx.add_init_script(f"""if (location.protocol === 'http:') {{
          localStorage.setItem({json.dumps(PROFILE_KEY)}, '430');
          localStorage.setItem('bdTrainersPanel:w', '700');
        }}""")
        page = ctx.new_page()
        page.goto(f"{BASE}/{PROFILE}&bdgen=1")
        page.wait_for_function("document.querySelector('#questionPanel').offsetWidth === 430")

        page.goto(f"{BASE}/boards.html")
        board = {"id": "bE", "name": "ЕГЭ", "folderId": None, "createdAt": 1000, "updatedAt": 1000,
                 "rev": 1, "cellSize": 24, "sheetCols": 76, "sheetRows": 54, "pageOrder": "h",
                 "view": {"x": 0, "y": 0, "zoom": 1}}
        page.evaluate(SEED_JS, [[board], {"bE": {"objects": [], "imageLib": []}}])
        page.reload()
        page.evaluate(BOOT_JS)
        page.wait_for_function("window.getDB && getDB().boards.some(board => board.id === 'bE')")
        page.evaluate("openBoard('bE')")
        page.wait_for_function("window.getCurrentBoard && getCurrentBoard()?.id === 'bE'")
        page.evaluate("""path => {
          setTrainersPanel('open');
          openTrainerInPanel('ege12', path, 'ЕГЭ №12');
        }""", PROFILE)
        frame = page.frame_locator("#bdTrainersIframe")
        expect(frame.locator("#questionText")).to_contain_text("A3D342", timeout=10000)
        expect(frame.locator("#questionPanel")).to_be_visible()
        assert frame.locator("#questionPanel").evaluate("panel => panel.offsetWidth") == 430
    print("[OK] Встроенная панель на доске и создание задания для доски сохраняют прежнюю ширину")


if __name__ == "__main__":
    with local_server(), sync_playwright() as p:
        browser = p.chromium.launch()
        check_aligned_trainers(browser)
        check_reopen_and_shared(browser)
        check_board_contexts(browser)
        browser.close()
