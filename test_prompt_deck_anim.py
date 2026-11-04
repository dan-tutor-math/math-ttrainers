"""
«„анимации по щелчку“» (05.11.2026): объекты слайда появляются по шагам —
deck-core.js (deckAnim…), меню «Анимация» в панели (deck-toolbar.js),
отрисовка и мышь (boards-core.js), ученик (board-stage.js, поле st в
bd_view), импорт HTML data-deck-step (deck-io-html-frame.js). HANDOFF 6б.

Проверяем:
  1. «Конструктор»: у выделенного меню «Анимация» — «Без анимации» и
     «Новый шаг 1»; назначение — одним шагом отмены; всё видно
  2. «Урок»: объекты с шагом спрятаны (не рисуются — по пикселям холста — и
     не ловятся мышью), снизу кружки «1 2»
  3. PageDown открывает шаг 1, потом 2, потом листает на следующий слайд;
     PageUp с него возвращает на первый со всеми открытыми шагами
  4. Кружки: щелчок по «1» — открыт только шаг 1, по нему же ещё раз —
     закрыт; в «Конструкторе» кружков нет
  5. Ученику уходит st (сколько шагов открыто); у ученика те же объекты
     спрятаны, без st — видно всё
  6. Показ: стрелка вправо сначала открывает шаг, кружки — в полосе показа
  7. Выгрузка и миниатюры — целиком (шаги не прячутся вне экрана)
  8. Импорт HTML с data-deck-step: «полностью» — объекты с шагами 1 и 2
     (карточка-фигура тоже), «картинками» — две картинки-шага поверх снимка,
     на снимке их нет
  9. Нет ошибок на странице

Запуск: python3 test_prompt_deck_anim.py
"""
import os
import sys

from playwright.sync_api import sync_playwright

import test_prompt84_deck_slides as T
from test_prompt98_deck_import import do_import, SLIDE

T.PORT = 8992
T.BASE = f"http://127.0.0.1:{T.PORT}"
HERE = os.path.dirname(os.path.abspath(__file__))
F = lambda n: os.path.join(HERE, "test-files", n)
fails = []


def check(cond, msg, extra=""):
    print(("OK   " if cond else "FAIL ") + msg + (f"  [{extra}]" if extra and not cond else ""))
    if not cond:
        fails.append(msg)


# три красных квадрата на первом слайде (0, 1, 2) и второй слайд
SETUP = """() => {
  const s = deckCur(), r = deckSlideRect(s);
  const mk = (i) => ({ id: 'anim' + i, type: 'box', geom: 'rect', points: [{ x: r.x + 100 + i * 400, y: r.y + 200 }], w: 300, h: 300,
    fill: { c: '#E00000' }, line: null, lay: 'base' });
  pushUndo();
  [0, 1, 2].forEach(i => B.objects.push(mk(i)));
  saveDB(); scheduleRedraw();
  deckAddSlide();
  deckGo(0, -1);
  return true;
}"""
# сколько красных пикселей холста в середине квадрата i
RED = """(i) => { const o = B.objects.find(x => x.id === 'anim' + i); const p = worldToScreen({ x: o.points[0].x + o.w / 2, y: o.points[0].y + o.h / 2 });
  const cv = document.getElementById('boardCv'); const k = cv.width / cv.getBoundingClientRect().width;
  const d = cv.getContext('2d').getImageData(Math.round(p.x * k) - 3, Math.round(p.y * k) - 3, 6, 6).data; let n = 0;
  for (let j = 0; j < d.length; j += 4) if (d[j] > 200 && d[j + 1] < 60) n++; return n; }"""
# заготовку в «Уроке» мышь и так не трогает (mayTouch) — проверяем только запрет шага
HIT = """(i) => { const o = B.objects.find(x => x.id === 'anim' + i); const mt = window.mayTouch; window.mayTouch = () => true;
  try { return hitTestObject(o, { x: o.points[0].x + o.w / 2, y: o.points[0].y + o.h / 2 }, 1); } finally { window.mayTouch = mt; } }"""


def frame(page, n=3):
    page.evaluate(f"() => new Promise(r => {{ let k = {n}; const f = () => (--k <= 0 ? r() : requestAnimationFrame(f)); requestAnimationFrame(f); }})")


def main():
    errors = []
    with T.local_server(), sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page(viewport={"width": 1400, "height": 900})
        page.on("pageerror", lambda e: errors.append(str(e)))
        page.goto(T.BASE + "/boards.html")
        page.evaluate(T.BOOT_JS)
        page.click("#blCreateDeck")
        page.wait_for_function("() => B && B.kind === 'deck' && boardActive")
        page.evaluate(SETUP)
        frame(page)

        print("1. «Конструктор»: меню «Анимация»")
        page.evaluate("() => { selectedId = 'anim1'; multiSelectIds = []; scheduleRedraw(); }")
        frame(page)
        page.evaluate("() => deckTbSync && deckTbSync()")
        frame(page)
        btn = page.locator("#deckAnimBtn")
        check(btn.count() == 1 and btn.is_visible(), "у выделенного есть «Анимация»")
        if btn.count():
            btn.click()
            items = page.eval_on_selector_all("#dtbPopAnim button[data-step]", "els => els.map(e => [e.dataset.step, e.innerText.replace(/\\s+/g, ' ').trim()])")
            check(items[:1] == [["0", "Без анимации видно сразу"]] and items[-1][0] == "1" and "Новый шаг 1" in items[-1][1], "пункты «Без анимации» и «Новый шаг 1»", str(items))
            page.click("#dtbPopAnim button[data-step='1']")
        page.evaluate("() => { selectedId = 'anim2'; deckAnimAssign([B.objects.find(o => o.id === 'anim2')], 2); selectedId = null; scheduleRedraw(); }")
        st = page.evaluate("() => ['anim0', 'anim1', 'anim2'].map(id => B.objects.find(o => o.id === id).step || 0)")
        check(st == [0, 1, 2], "шаги назначены: 0, 1, 2", str(st))
        page.evaluate("() => doUndo()")
        check(page.evaluate("() => B.objects.find(o => o.id === 'anim2').step || 0") == 0, "назначение — одним шагом отмены")
        page.evaluate("() => deckAnimAssign([B.objects.find(o => o.id === 'anim2')], 2)")
        frame(page)
        check(all(page.evaluate(RED, i) > 20 for i in range(3)), "в «Конструкторе» видно всё")
        check(page.evaluate("() => { const e = document.getElementById('deckAnimDots'); return !e || e.hidden; }"), "в «Конструкторе» кружков нет")

        print("2. «Урок»")
        page.evaluate("() => deckSetMode('lesson')")
        frame(page)
        reds = [page.evaluate(RED, i) for i in range(3)]
        check(reds[0] > 20 and reds[1] == 0 and reds[2] == 0, "шаги 1 и 2 спрятаны на холсте", str(reds))
        check(page.evaluate(HIT, 0) and not page.evaluate(HIT, 1) and not page.evaluate(HIT, 2), "спрятанное не ловится мышью")
        dots = page.eval_on_selector_all("#deckAnimDots button", "els => els.map(e => e.textContent)")
        check(dots == ["1", "2"] and page.is_visible("#deckAnimDots"), "снизу кружки «1 2»", str(dots))
        check(page.evaluate("() => deckAnimWire()") == 0, "ученику уходит st = 0")

        print("3. PageDown / PageUp")
        page.keyboard.press("PageDown")
        frame(page)
        reds = [page.evaluate(RED, i) for i in range(3)]
        check(reds[1] > 20 and reds[2] == 0 and page.evaluate("() => deckCurIndex()") == 0, "PageDown — шаг 1, слайд тот же", str(reds))
        page.keyboard.press("PageDown")
        frame(page)
        check(page.evaluate(RED, 2) > 20 and page.evaluate("() => deckCurIndex()") == 0, "ещё раз — шаг 2")
        page.keyboard.press("PageDown")
        frame(page, 6)
        check(page.evaluate("() => deckCurIndex()") == 1, "третий раз — следующий слайд")
        check(page.evaluate("() => { const e = document.getElementById('deckAnimDots'); return !e || e.hidden; }"), "на слайде без шагов кружков нет")
        page.keyboard.press("PageUp")
        frame(page, 6)
        check(page.evaluate("() => deckCurIndex()") == 0 and page.evaluate("() => deckAnimCur(deckCur())") == 2, "назад — со всеми открытыми шагами")

        print("4. Кружки")
        page.click("#deckAnimDots button[data-step='1']")
        frame(page)
        v = [page.evaluate("() => deckAnimCur(deckCur())"), page.evaluate(RED, 2), page.evaluate(RED, 1)]
        check(v[0] == 1 and v[1] == 0 and v[2] > 20, "«1» — открыт только шаг 1", str(v))
        page.click("#deckAnimDots button[data-step='1']")
        frame(page)
        check(page.evaluate("() => deckAnimCur(deckCur())") == 0 and page.evaluate(RED, 1) == 0, "«1» ещё раз — закрыт")
        check(page.evaluate("() => deckAnimWire()") == 0, "ученику — 0")

        print("5. Ученик")
        res = page.evaluate("""() => { const s = deckCur(); const o1 = B.objects.find(o => o.id === 'anim1'), o2 = B.objects.find(o => o.id === 'anim2');
          const was = window.deckViewerMode, ws = deckViewerSlide, wst = deckViewerStep;
          window.deckViewerMode = true; deckViewerSlide = s.id; deckViewerStep = 1;
          const a = [deckAnimHidden(o1), deckAnimHidden(o2)];
          deckViewerStep = null; const b = [deckAnimHidden(o1), deckAnimHidden(o2)];
          window.deckViewerMode = was; deckViewerSlide = ws; deckViewerStep = wst;
          return [a, b]; }""")
        check(res == [[False, True], [False, False]], "у ученика при st = 1 спрятан только шаг 2, без st — видно всё", str(res))

        print("6. Показ")
        page.evaluate("() => dtbShowStart(false)")
        frame(page, 6)
        check(page.evaluate("() => !!document.querySelector('#dtbShowBar #deckAnimDots')"), "кружки — в полосе показа")
        page.keyboard.press("ArrowRight")
        frame(page)
        check(page.evaluate("() => deckAnimCur(deckCur())") == 1 and page.evaluate("() => deckCurIndex()") == 0, "стрелка вправо — шаг, а не слайд")
        page.keyboard.press("Escape")
        frame(page, 4)
        check(page.evaluate("() => !!document.querySelector('#screenBoard > #deckAnimDots')"), "после показа кружки — снова у слайда")

        print("7. Выгрузка и миниатюры целиком")
        page.evaluate("() => deckSetMode('lesson')")
        frame(page)
        full = page.evaluate("""() => { const s = deckCur(); const cv = document.createElement('canvas'); cv.width = 400; cv.height = 225;
          const r = deckSlideRect(s); const z = 400 / r.w; render(cv.getContext('2d'), 400, 225, { x: r.x, y: r.y, zoom: z }, false, 1);
          const o = B.objects.find(x => x.id === 'anim2'); const px = (o.points[0].x + o.w / 2 - r.x) * z, py = (o.points[0].y + o.h / 2 - r.y) * z;
          const d = cv.getContext('2d').getImageData(Math.round(px), Math.round(py), 1, 1).data; return [d[0], d[1]]; }""")
        page.evaluate("() => { activeCam = cam; scheduleRedraw(); }")
        check(full[0] > 200 and full[1] < 60, "вне экрана (выгрузка, миниатюры) закрытый шаг нарисован", str(full))

        print("8. Импорт HTML с data-deck-step")
        page.evaluate("() => { deckSetMode('edit'); deckIoEnsure(); }")
        page.wait_for_function("() => typeof deckIoImportFile === 'function'")
        do_import(page, F("deck_import_steps.html"))
        objs = page.evaluate(SLIDE, 0)
        steps = {(o.get("plain") or o["type"]): o.get("step", 0) for o in objs if not o.get("bgOf")}
        check(steps.get("x = 3 или x = −3") == 1 and steps.get("Ответ: −3; 3") == 2 and steps.get("Решите уравнение") == 0, "«полностью»: шаги 1 и 2 у своих объектов", str(steps))
        ans = next((o for o in objs if o.get("plain") == "Ответ: −3; 3"), None)
        check(ans is not None and ans.get("fill", {}).get("c") == "#DFF5E1", "карточка-шаг — фигурой с заливкой")
        do_import(page, F("deck_import_steps.html"), mode="img")
        objs = page.evaluate(SLIDE, 0)
        imgs = sorted((o.get("step", 0), o["type"]) for o in objs if not o.get("bgOf"))
        check(imgs == [(1, "image"), (2, "image")], "«картинками»: две картинки-шага поверх снимка", str(imgs))
        green = page.evaluate("""() => { const s = deckSlides()[0]; const o = B.objects.find(x => x.bgOf === s.id); const im = getImg(o.src);
          const cv = document.createElement('canvas'); cv.width = 192; cv.height = 108; const c = cv.getContext('2d'); c.drawImage(im, 0, 0, 192, 108);
          const d = c.getImageData(0, 0, 192, 108).data; let n = 0; for (let i = 0; i < d.length; i += 4) if (d[i] < 120 && d[i + 1] > 130 && d[i + 2] < 120) n++; return n; }""")
        check(green == 0, "на снимке карточки-шага нет", str(green))
        page.evaluate("() => deckSetMode('lesson')")
        frame(page)
        check(page.evaluate("() => deckAnimMax(deckCur())") == 2 and page.is_visible("#deckAnimDots"), "импортированные шаги работают в «Уроке»")

        check(not errors, "нет ошибок на странице", " | ".join(errors[:3]))
        browser.close()
    print()
    if fails:
        print("ПРОВАЛЫ:")
        for f in fails:
            print(" -", f)
        sys.exit(1)
    print("ВСЁ ПРОШЛО")


if __name__ == "__main__":
    main()
