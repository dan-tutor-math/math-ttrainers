"""Переход в кабинет из рабочих разделов, на компьютере и узком экране."""
import json
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from threading import Thread

from playwright.sync_api import expect, sync_playwright

from test_prompt96_deck_separate import BOOT_JS, SEED_JS
from test_prompt_cabinet_payments import B1, FIXED_NOW_JS, seed


class QuietHandler(SimpleHTTPRequestHandler):
    def log_message(self, *args):
        pass

    def copyfile(self, source, outputfile):
        # При переходе на следующую страницу браузер отменяет догрузку банков и шрифтов.
        try:
            super().copyfile(source, outputfile)
        except (BrokenPipeError, ConnectionResetError):
            pass


def clickable(control):
    expect(control).to_be_visible()
    problem = control.evaluate("""el => {
      const r = el.getBoundingClientRect();
      const hit = document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2);
      if (r.left >= 0 && r.right <= innerWidth && r.top >= 0 && r.bottom <= innerHeight && el.contains(hit)) return null;
      return {bounds: r.toJSON(), hit: hit?.outerHTML.slice(0, 300), viewport: innerWidth};
    }""")
    assert not problem, f"Кнопка за краем или перекрыта: {control}, {problem}"


def check_link(page, base):
    link = page.get_by_role("link", name="Кабинет", exact=True)
    expect(link).to_have_count(1)
    clickable(link)
    source = page.url
    with page.expect_popup() as opened:
        link.click()
    cabinet = opened.value
    expect(cabinet).to_have_url(base + "/cabinet.html#/schedule")
    expect(cabinet.locator("#auGo")).to_be_visible()
    cabinet.close()
    assert page.url == source


def check_boards(page, base):
    page.goto(base + "/boards.html")
    check_link(page, base)
    page.evaluate(SEED_JS)
    page.reload()
    page.evaluate(BOOT_JS)
    page.locator("#blGrid .bl-card").filter(has_text="Обычная").wait_for()
    check_link(page, base)
    page.locator("#blGrid .bl-card").filter(has_text="Обычная").click()
    expect(page.locator("#bdName")).to_have_value("Обычная")
    check_link(page, base)
    page.locator("#bdBack").click()
    page.locator('#blKindSwitch [data-kind="decks"]').click()
    check_link(page, base)
    page.locator("#blGrid .bl-card").filter(has_text="Урок слайдами").click()
    expect(page.locator("#deckImpBtn")).to_be_visible()
    check_link(page, base)
    for button in ["#bdBack", "#deckImpBtn", "#bdGear", "#bdShareBtn", ".bd-topbar .rl-trigger", "#lgMenuToggle"]:
        clickable(page.locator(button))
    page.evaluate("dtbShowStart()")
    expect(page.locator("#dtbShowBar")).to_be_visible()
    check_link(page, base)


def check_sections(page, base):
    page.goto(base + "/index.html")
    home_link = page.get_by_role("link", name="Кабинет", exact=True)
    expect(home_link).to_have_count(1)
    home_link.click()
    expect(page).to_have_url(base + "/cabinet.html#/schedule")
    for path in ["oge6.html", "ege_prof.html?n=5", "rus_oge.html?n=5", "neg_pos.html",
                 "addition_embed.html", "tire3d.html", "works.html", "work.html",
                 "deck-guide.html", "boards-panel.html", "notes.html"]:
        page.goto(base + "/" + path)
        check_link(page, base)
        if path == "neg_pos.html" and page.viewport_size["width"] <= 620:
            assert page.locator("h1").first.bounding_box()["y"] >= 56
    page.locator("#slNew").click()
    expect(page.locator("#edBack")).to_be_visible()
    check_link(page, base)


def check_teacher_schedule(browser, base):
    B1.STATE["db"] = json.dumps(seed())
    ctx = B1.new_context(browser, bar_open=False)
    ctx.add_init_script(FIXED_NOW_JS)
    ctx.add_init_script("localStorage.setItem('cabinet:schedule:view', 'list')")
    page = ctx.new_page()
    page.goto(base + "/oge6.html")
    with page.expect_popup() as opened:
        page.get_by_role("link", name="Кабинет", exact=True).click()
    cabinet = opened.value
    expect(cabinet.locator("#tabSchedule")).to_be_visible()
    expect(cabinet.locator('.rw-row[data-id="L17"]')).to_be_visible()
    ctx.close()
    print("Готово — у вошедшего преподавателя открылось расписание с тестовым занятием.")


def check_page_coverage(page, base):
    # На сцене работает рамка урока, font-check — технический образец шрифтов.
    excluded = {"stage.html", "font-check.html", "cabinet.html"}
    pages = sorted(f.name for f in Path(__file__).parent.glob("*.html") if f.name not in excluded)
    for name in pages:
        query = "?n=5" if name in {"rus_oge.html", "rus_ege.html", "soc_oge_long.html"} else ""
        page.goto(f"{base}/{name}{query}")
        link = page.get_by_role("link", name="Кабинет", exact=True)
        expect(link).to_have_count(1)
        expect(link).to_have_attribute("href", "cabinet.html#/schedule")
        clickable(link)
    print(f"Кнопка доступна на {len(pages)} страницах, включая старые ссылки.")


def check_embedded(page, base):
    page.goto(base + "/addition_embed.html?embed=1")
    expect(page.locator(".cabinet-link")).to_have_count(0)
    page.goto(base + "/boards.html?s=TEST")
    expect(page.locator(".cabinet-link")).to_have_count(0)
    page.goto(base + "/notes.html")
    with page.expect_event("framenavigated", predicate=lambda frame: frame.url.endswith("/oge6.html")):
        page.evaluate("""() => {
          const frame = document.createElement('iframe');
          frame.src = 'oge6.html'; document.body.append(frame);
        }""")
    frame = page.frames[1]
    frame.wait_for_load_state()
    expect(frame.locator(".cabinet-link")).to_have_count(0)


def run():
    handler = partial(QuietHandler, directory=Path(__file__).resolve().parent)
    with ThreadingHTTPServer(("127.0.0.1", 0), handler) as server, sync_playwright() as pw:
        Thread(target=server.serve_forever, daemon=True).start()
        base = f"http://127.0.0.1:{server.server_port}"
        try:
            browser = pw.chromium.launch()
            for width in (1280, 390, 320):
                ctx = browser.new_context(viewport={"width": width, "height": 820})
                ctx.route("https://**/*", lambda route: route.abort())
                page = ctx.new_page()
                page.set_default_timeout(8000)
                check_boards(page, base)
                check_sections(page, base)
                check_embedded(page, base)
                if width == 390:
                    check_page_coverage(page, base)
                ctx.close()
                print(f"Готово — переходы и доступность кнопок при ширине {width} px.")
            check_teacher_schedule(browser, base)
            browser.close()
        finally:
            server.shutdown()


if __name__ == "__main__":
    run()
