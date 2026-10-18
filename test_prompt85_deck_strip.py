"""
Промпт №85: лента миниатюр презентации (deck-core.js, HANDOFF.md раздел 6б).

Проверяем:
  1. Слева лента: по миниатюре на слайд, текущая выделена, «+ слайд» внизу
  2. Миниатюра рисуется тем же render(): штрих на слайде виден на ней
  3. Щелчок по миниатюре открывает слайд
  4. «⋯» → «Дублировать»: новый слайд после исходного, объекты скопированы
     в новый слот, у копий новые id
  5. «⋯» → «Переименовать»: имя под миниатюрой
  6. Перетаскивание миниатюры меняет только порядок слайдов — координаты
     объектов те же; отмена — одним шагом
  7. «⋯» → «Удалить» убирает слайд вместе с его объектами; последний
     слайд удалить нельзя
  8. Лента сворачивается, это помнится после перезагрузки, слайд при этом
     становится крупнее
"""
import os
import subprocess
import sys
import time
import contextlib
import http.client

from playwright.sync_api import sync_playwright

PORT = 8985
BASE = f"http://127.0.0.1:{PORT}"


@contextlib.contextmanager
def local_server():
    proc = subprocess.Popen(
        [sys.executable, "-m", "http.server", str(PORT)],
        stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL,
    )
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


BOOT_JS = """
() => {
  const gate = document.getElementById('authGate');
  if (gate) gate.style.display = 'none';
  window.boardsAppBoot();
  // список досок показывает вход в облако (boards-cloud.js); без него — сами
  document.getElementById('screenList').style.display = 'flex';
}
"""

fails = []


def check(cond, msg):
    print(("OK   " if cond else "FAIL ") + msg)
    if not cond:
        fails.append(msg)


def slide_no(page):
    return page.inner_text("#deckNo").strip()


def wait_no(page, want, timeout=2000):
    t0 = time.time()
    while time.time() - t0 < timeout / 1000:
        if slide_no(page) == want:
            return True
        page.wait_for_timeout(50)
    return False


def thumbs(page):
    return page.evaluate("() => [...document.querySelectorAll('#deckStripList .deck-thumb')].map(t => t.dataset.id)")


def slide_ids(page):
    return page.evaluate("() => B.objects.find(o => o.type === 'deck').slides.map(s => s.id)")


def menu(page, idx, act):
    page.locator("#deckStripList .deck-thumb").nth(idx).hover()
    page.locator("#deckStripList .deck-thumb-menu").nth(idx).click()
    page.wait_for_selector("#deckMenu:not([hidden])")
    page.click(f"#deckMenu [data-act='{act}']")
    page.wait_for_timeout(250)


def main():
    exe = os.environ.get("PW_CHROMIUM") or None
    with local_server(), sync_playwright() as p:
        browser = p.chromium.launch(executable_path=exe)
        ctx = browser.new_context(viewport={"width": 1280, "height": 800})
        page = ctx.new_page()
        errors = []
        page.on("pageerror", lambda e: errors.append(str(e)))
        page.goto(f"{BASE}/boards.html")
        page.evaluate(BOOT_JS)
        page.wait_for_selector("#blCreateDeck")
        page.click("#blCreateDeck")
        page.wait_for_function("() => typeof B !== 'undefined' && B && B.kind === 'deck' && boardActive")
        page.wait_for_timeout(400)

        # 1. лента
        check(page.is_visible("#deckStrip"), "лента миниатюр видна")
        rail = page.evaluate("""() => {
          const r = document.getElementById('bdRail'), rr = r.getBoundingClientRect();
          const back = document.getElementById('bdBack').getBoundingClientRect();
          const name = document.getElementById('bdName').getBoundingClientRect();
          return { top: r.classList.contains('pos-top'), afterBack: rr.left >= back.right,
                   beforeName: rr.right <= name.left, inBar: rr.bottom <= 60 };
        }""")
        check(all(rail.values()), f"таблетка в верхней строке между «Назад» и названием ({rail})")
        check(len(thumbs(page)) == 1, "одна миниатюра")
        page.click("#deckAdd")
        page.click("#deckAdd")
        check(wait_no(page, "3 / 3"), "«+ слайд» внизу ленты добавляет слайды")
        page.wait_for_timeout(200)
        ids = slide_ids(page)
        check(thumbs(page) == ids, "миниатюры в порядке слайдов")
        cur = page.evaluate("() => document.querySelector('#deckStripList .deck-thumb.cur')?.dataset.id")
        check(cur == ids[2], "текущая миниатюра — третья")

        # 2. штрих виден на миниатюре (миниатюра в ~13 раз мельче слайда: штрих
        # бледный, поэтому ищем точки, заметно отличные от цвета бумаги в углу)
        page.evaluate("() => document.querySelector('[data-tool=\"pen\"]').click()")
        page.mouse.move(600, 350)
        page.mouse.down()
        for i in range(16):
            page.mouse.move(600 + i * 15, 350 + (i % 4) * 25)
        page.mouse.up()
        page.wait_for_timeout(1500)
        inked = page.evaluate("""(id) => {
          const cv = document.querySelector(`#deckStripList .deck-thumb[data-id="${id}"] canvas`);
          if (!cv || !cv.width) return -1;
          const d = cv.getContext('2d').getImageData(0, 0, cv.width, cv.height).data;
          let dark = 0;
          for (let i = 0; i < d.length; i += 4) if (Math.abs(d[i]-d[0]) + Math.abs(d[i+1]-d[1]) + Math.abs(d[i+2]-d[2]) > 40) dark++;
          return dark;
        }""", ids[2])
        check(inked > 3, f"штрих виден на миниатюре слайда 3 (тёмных точек: {inked})")
        blank = page.evaluate("""(id) => {
          const cv = document.querySelector(`#deckStripList .deck-thumb[data-id="${id}"] canvas`);
          const d = cv.getContext('2d').getImageData(0, 0, cv.width, cv.height).data;
          let dark = 0;
          for (let i = 0; i < d.length; i += 4) if (Math.abs(d[i]-d[0]) + Math.abs(d[i+1]-d[1]) + Math.abs(d[i+2]-d[2]) > 40) dark++;
          return dark;
        }""", ids[0])
        check(blank == 0, f"на миниатюре пустого слайда 1 штриха нет ({blank})")

        # 3. щелчок по миниатюре
        page.locator("#deckStripList .deck-thumb").nth(0).click()
        check(wait_no(page, "1 / 3"), "щелчок по первой миниатюре → 1 / 3")

        # 4. дублировать слайд 3
        pen0 = page.evaluate("() => B.objects.filter(o => o.type === 'pen').map(o => o.points.map(p => [p.x, p.y]))")
        menu(page, 2, "dup")
        check(wait_no(page, "4 / 4"), "после «Дублировать» стоим на копии 4 / 4")
        dup = page.evaluate("""() => {
          const d = B.objects.find(o => o.type === 'deck');
          const pens = B.objects.filter(o => o.type === 'pen');
          const src = d.slides[2], cp = d.slides[3];
          return { n: pens.length, ids: new Set(pens.map(o => o.id)).size,
                   slotsDiffer: src.slot !== cp.slot,
                   slots: pens.map(o => deckSlotOf(o)).sort(), want: [src.slot, cp.slot].sort() };
        }""")
        check(dup["n"] == 2 and dup["ids"] == 2, f"штрих скопирован с новым id ({dup})")
        check(dup["slotsDiffer"] and dup["slots"] == dup["want"], "копия лежит в новом слоте")

        # 5. переименовать
        page.once("dialog", lambda d: d.accept("Теория"))
        menu(page, 0, "ren")
        name = page.evaluate("() => B.objects.find(o => o.type === 'deck').slides[0].name")
        check(name == "Теория", f"слайд переименован ({name})")
        page.wait_for_timeout(200)
        check("Теория" in page.inner_text("#deckStripList"), "имя видно в ленте")

        # 6. перетаскивание: четвёртый слайд — в начало
        before = slide_ids(page)
        pts_before = page.evaluate("() => JSON.stringify(B.objects.filter(o => o.type !== 'deck').map(o => o.points))")
        src = page.locator("#deckStripList .deck-thumb").nth(3).bounding_box()
        dst = page.locator("#deckStripList .deck-thumb").nth(0).bounding_box()
        page.mouse.move(src["x"] + 60, src["y"] + 40)
        page.mouse.down()
        page.mouse.move(src["x"] + 60, src["y"] + 20, steps=4)
        page.mouse.move(dst["x"] + 60, dst["y"] + 8, steps=10)
        page.wait_for_timeout(250)
        mid = page.evaluate("""() => {
          const t = [...document.querySelectorAll('#deckStripList .deck-thumb')];
          return { lifted: t[3].classList.contains('lifted'),
                   moved: t[3].style.transform.includes('scale'),
                   shifted: t.slice(0, 3).every(el => (el.style.transform.startsWith('translateY(') && !el.style.transform.startsWith('translateY(-'))) };
        }""")
        check(mid["lifted"] and mid["moved"], f"миниатюра поднялась и едет за курсором ({mid})")
        check(mid["shifted"], "остальные миниатюры расступились вниз")
        page.mouse.up()
        page.wait_for_timeout(400)
        check(page.evaluate("() => !document.querySelector('#deckStripList .lifted, #deckStripList .settling') && [...document.querySelectorAll('#deckStripList .deck-thumb')].every(el => !el.style.transform)"),
              "после отпускания сдвиги сняты")
        after = slide_ids(page)
        check(after == [before[3], before[0], before[1], before[2]], "четвёртый слайд перетащили в начало")
        pts_after = page.evaluate("() => JSON.stringify(B.objects.filter(o => o.type !== 'deck').map(o => o.points))")
        check(pts_before == pts_after, "координаты объектов не изменились")
        check(thumbs(page) == after, "лента перестроилась в новом порядке")
        page.keyboard.press("Control+z")
        page.wait_for_timeout(300)
        check(slide_ids(page) == before, "отмена вернула порядок одним шагом")

        # 7. удалить копию (четвёртый слайд) вместе со штрихом
        menu(page, 3, "del")
        res = page.evaluate("""() => ({ n: B.objects.find(o => o.type === 'deck').slides.length,
                                        pens: B.objects.filter(o => o.type === 'pen').length })""")
        check(res["n"] == 3 and res["pens"] == 1, f"слайд удалён вместе со своим штрихом ({res})")
        check(slide_no(page).endswith("/ 3"), f"счётчик показывает 3 слайда ({slide_no(page)})")
        menu(page, 2, "del")
        menu(page, 1, "del")
        check(len(slide_ids(page)) == 1, "остался один слайд")
        page.locator("#deckStripList .deck-thumb").nth(0).hover()
        page.locator("#deckStripList .deck-thumb-menu").nth(0).click()
        page.wait_for_selector("#deckMenu:not([hidden])")
        check(page.is_disabled("#deckMenu [data-act='del']"), "последний слайд удалить нельзя")
        page.keyboard.press("Escape")
        page.wait_for_timeout(100)
        check(page.is_hidden("#deckMenu"), "Esc закрывает меню")

        # 7б. ленту растягивают: по умолчанию миниатюры влезают целиком
        fit = page.evaluate("""() => { const l = document.getElementById('deckStripList'), lr = l.getBoundingClientRect();
          const boxes = [...l.querySelectorAll('.deck-thumb-box')].map(b => b.getBoundingClientRect().right);
          return { over: l.scrollWidth > l.clientWidth + 1, inside: boxes.every(r => r <= lr.right + 0.5), tw: deckThumbW }; }""")
        check(not fit["over"] and fit["inside"], f"по умолчанию миниатюры помещаются в ленту целиком ({fit})")
        st0 = page.locator("#deckStrip").bounding_box()
        hx = page.locator("#deckStrip [data-rs='x']").bounding_box()
        page.mouse.move(hx["x"] + 5, hx["y"] + hx["height"] / 2)
        page.mouse.down()
        page.mouse.move(hx["x"] + 85, hx["y"] + hx["height"] / 2, steps=6)
        page.mouse.up()
        page.wait_for_timeout(400)
        st1 = page.locator("#deckStrip").bounding_box()
        tw1 = page.evaluate("() => deckThumbW")
        check(abs(st1["width"] - st0["width"] - 80) < 3, f"правый край — ширина ({st0['width']:.0f} → {st1['width']:.0f})")
        check(tw1 > fit["tw"] + 60, f"миниатюры стали крупнее ({fit['tw']} → {tw1})")
        hy = page.locator("#deckStrip [data-rs='y']").bounding_box()
        page.mouse.move(hy["x"] + hy["width"] / 2, hy["y"] + 5)
        page.mouse.down()
        page.mouse.move(hy["x"] + hy["width"] / 2, hy["y"] - 150, steps=6)
        page.mouse.up()
        page.wait_for_timeout(300)
        st2 = page.locator("#deckStrip").bounding_box()
        check(abs(st2["height"] - (st1["height"] - 155)) < 6, f"нижний край — высота ({st1['height']:.0f} → {st2['height']:.0f})")
        # две перезагрузки за 4 с — защита от краш-цикла (№49) не откроет
        # доску сама; её метку снимаем
        page.evaluate("() => sessionStorage.clear()")
        page.reload()
        page.evaluate(BOOT_JS)
        page.wait_for_function("() => typeof B !== 'undefined' && B && B.kind === 'deck' && boardActive", timeout=5000)
        page.wait_for_timeout(400)
        st3 = page.locator("#deckStrip").bounding_box()
        check(abs(st3["width"] - st1["width"]) < 2 and abs(st3["height"] - st2["height"]) < 2, "размер ленты помнится после перезагрузки")
        page.dblclick("#deckStrip [data-rs='x']")
        page.dblclick("#deckStrip [data-rs='y']")
        page.wait_for_timeout(300)
        st4 = page.locator("#deckStrip").bounding_box()
        check(abs(st4["width"] - st0["width"]) < 2 and abs(st4["height"] - st0["height"]) < 2, "двойной щелчок по краю — размер по умолчанию")

        # 8. свернуть ленту
        z_open = page.evaluate("() => cam.zoom")
        page.click("#deckStripToggle")
        page.wait_for_timeout(300)
        check(page.evaluate("() => document.getElementById('deckStrip').classList.contains('collapsed')"), "лента свернулась")
        z_closed = page.evaluate("() => cam.zoom")
        check(z_closed >= z_open, f"слайд не стал мельче ({z_open:.3f} → {z_closed:.3f})")
        page.wait_for_timeout(800)
        # две перезагрузки за 4 с — защита от краш-цикла (№49) не откроет
        # доску сама; её метку снимаем
        page.evaluate("() => sessionStorage.clear()")
        page.reload()
        page.evaluate(BOOT_JS)
        page.wait_for_function("() => typeof B !== 'undefined' && B && B.kind === 'deck' && boardActive", timeout=5000)
        page.wait_for_timeout(300)
        check(page.evaluate("() => document.getElementById('deckStrip').classList.contains('collapsed')"), "свёрнутая лента помнится после перезагрузки")
        page.click("#deckStripToggle")
        page.wait_for_timeout(300)
        check(page.evaluate("() => !document.getElementById('deckStrip').classList.contains('collapsed')"), "лента разворачивается обратно")

        check(not errors, f"нет ошибок на странице ({errors[:3]})")
        browser.close()

    if fails:
        print(f"\nПРОВАЛЕНО: {len(fails)}")
        sys.exit(1)
    print("\nВСЁ ПРОШЛО")


if __name__ == "__main__":
    main()
