"""Кнопка и панель справки во всех тренажёрах ОГЭ по математике."""

from contextlib import contextmanager
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from threading import Thread

from playwright.sync_api import expect, sync_playwright


PAGES = "oge1_5 oge6 oge7 oge8 oge9 oge10 oge11 oge12 oge13 oge14 oge15_18 oge19 oge_part2".split()
OTHER_EXAMS = "ege_prof ege_base eng_oge soc_oge soc_ege soc_ege_long rus_oge phys_oge inf_oge".split()
ROOT = Path(__file__).resolve().parent


class QuietHandler(SimpleHTTPRequestHandler):
    def log_message(self, *args):
        pass


@contextmanager
def site():
    handler = partial(QuietHandler, directory=str(ROOT))
    with ThreadingHTTPServer(("127.0.0.1", 0), handler) as server:
        thread = Thread(target=server.serve_forever, daemon=True)
        thread.start()
        try:
            yield f"http://127.0.0.1:{server.server_address[1]}"
        finally:
            server.shutdown()
            thread.join()


def test():
    with site() as base, sync_playwright() as playwright:
        browser = playwright.chromium.launch()
        with browser.new_context(viewport={"width": 1280, "height": 820}) as context:
            context.route("https://**/*", lambda route: route.abort())
            context.add_init_script("localStorage.setItem('theme', 'dark')")
            page = context.new_page()
            errors = []
            page.on("pageerror", lambda error: errors.append(str(error)))
            trigger = page.locator("#ogeReferenceToggle")
            panel = page.get_by_role("dialog", name="Справочные материалы")
            for slug in PAGES:
                url = f"{base}/{slug}.html"
                page.goto(url, wait_until="domcontentloaded")
                expect(page.locator("html")).to_have_attribute("data-theme", "dark")
                expect(trigger).to_have_accessible_name("Справочные материалы")
                trigger_rect = trigger.bounding_box()
                for selector in ("#themeToggle", "#boardVisibilityToggle", "#focusToggle", "#kpToggle", "#smBar"):
                    rect = page.locator(selector).first.bounding_box() if page.locator(selector).count() else None
                    if rect:
                        a, b = trigger_rect, rect
                        overlap = (a["x"] < b["x"] + b["width"] and b["x"] < a["x"] + a["width"]
                                   and a["y"] < b["y"] + b["height"] and b["y"] < a["y"] + a["height"])
                        assert not overlap, (slug, selector, a, b)
                progress_before = page.evaluate("JSON.stringify({...localStorage})")
                trigger.click()
                expect(panel).to_be_visible()
                rect = panel.bounding_box()
                assert abs(rect["x"] + rect["width"] / 2 - 640) < 1, slug
                page.wait_for_function("""() => {
                    const pages = [...document.querySelectorAll('.rp-page img')];
                    return pages.length === 4 && pages.every(p => p.complete && p.naturalWidth > 0);
                }""")
                first = panel.locator(".rp-page").first
                width = first.bounding_box()["width"]
                first.click()
                expect(first).to_have_attribute("aria-pressed", "true")
                assert first.bounding_box()["width"] > width
                page.keyboard.press("Escape")
                expect(panel).to_have_count(0)
                expect(trigger).to_be_focused()
                trigger.click()
                panel.get_by_role("button", name="Закрыть справочные материалы").click()
                expect(panel).to_have_count(0)
                trigger.click()
                page.mouse.click(5, 5)
                expect(panel).to_have_count(0)
                assert page.evaluate("JSON.stringify({...localStorage})") == progress_before, slug
                page.goto(url + "?card=1", wait_until="domcontentloaded")
                expect(trigger).to_have_count(0)
                print("OK", slug)
            for slug in OTHER_EXAMS:
                page.goto(f"{base}/{slug}.html", wait_until="domcontentloaded")
                expect(trigger).to_have_count(0)
            page.goto(f"{base}/oge6.html?bdgen=1", wait_until="domcontentloaded")
            expect(trigger).to_have_count(0)
            page.evaluate("""() => {
                const frame = document.createElement('iframe');
                frame.id = 'bdTrainersIframe';
                frame.src = 'oge9.html';
                document.body.append(frame);
            }""")
            page.frame_locator("#bdTrainersIframe").locator("#themeToggle").wait_for(state="attached")
            expect(page.frame_locator("#bdTrainersIframe").locator("#ogeReferenceToggle")).to_have_count(0)
            assert not errors, errors

        with browser.new_context(viewport={"width": 375, "height": 812}, is_mobile=True, has_touch=True) as context:
            context.route("https://**/*", lambda route: route.abort())
            page = context.new_page()
            page.goto(f"{base}/oge6.html", wait_until="domcontentloaded")
            page.locator("#ogeReferenceToggle").tap()
            panel = page.get_by_role("dialog")
            assert panel.bounding_box() == {"x": 0, "y": 0, "width": 375, "height": 812}
            first = panel.locator(".rp-page").first
            first.tap()
            scroll = panel.locator(".rp-content")
            assert scroll.evaluate("el => el.scrollWidth > el.clientWidth && el.scrollHeight > el.clientHeight")
            expect(panel.get_by_role("button", name="Закрыть справочные материалы")).to_be_in_viewport()
        browser.close()
    print("готово")


if __name__ == "__main__":
    test()
