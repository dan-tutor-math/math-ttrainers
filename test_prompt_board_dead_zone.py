"""
Доска поверх тренажёра: «мёртвая» зона под интерфейсом (ОГЭ №6).

Кнопка «История примеров» была на всю ширину карточки и при включённой доске
перехватывала нажатие — начать линию на её пустой части было нельзя.
Проверяем: справа от ярлыка кнопки нажатие уходит на холст доски и там
получается штрих; сама кнопка по-прежнему нажимается.

Запуск: python3 test_prompt_board_dead_zone.py (сервер поднимается сам).
"""
import sys

from playwright.sync_api import sync_playwright

import test_prompt66_board_live_tasks as T

EXE = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome'


def run():
    ok = True

    def check(name, cond):
        nonlocal ok
        print(('OK   ' if cond else 'FAIL ') + name)
        ok = ok and bool(cond)

    with T.local_server(), sync_playwright() as p:
        try:
            b = p.chromium.launch()
        except Exception:
            b = p.chromium.launch(executable_path=EXE, args=['--no-sandbox'])
        pg = b.new_page(viewport={'width': 1280, 'height': 800})
        pg.goto(T.BASE + '/oge6.html')
        pg.wait_for_timeout(1200)
        pg.click('.mode-card.random')
        pg.wait_for_timeout(600)
        pg.click('#boardVisibilityToggle')
        pg.wait_for_timeout(500)
        r = pg.evaluate("""()=>{const r=document.getElementById('exampleHistoryToggle').getBoundingClientRect();
            return {l:r.left,r:r.right,t:r.top,h:r.height,b:r.bottom}}""")
        y = r['t'] + r['h'] / 2
        x = r['r'] + 60  # пустая часть строки правее ярлыка
        hit = pg.evaluate("([x,y])=>{const e=document.elementFromPoint(x,y);return e&&(e.id||e.tagName)}", [x, y])
        check('пустая часть строки отдаёт нажатие холсту (' + str(hit) + ')', hit == 'boardCanvas')
        before = pg.evaluate("window.__boardGetState().strokes ? window.__boardGetState().strokes.length : 0") \
            if pg.evaluate("typeof window.__boardGetState==='function'") else 0
        pg.mouse.move(x, y)
        pg.mouse.down()
        pg.mouse.move(x + 40, y + 10, steps=5)
        pg.mouse.up()
        pg.wait_for_timeout(200)
        after = pg.evaluate("(window.__boardGetState().strokes||[]).length")
        check('штрих на пустой части строки появился (%s → %s)' % (before, after), after == before + 1)
        # сама кнопка остаётся рабочей
        n0 = pg.evaluate("getComputedStyle(document.getElementById('exampleHistoryPanel')).display")
        pg.click('#exampleHistoryToggle')
        n1 = pg.evaluate("getComputedStyle(document.getElementById('exampleHistoryPanel')).display")
        check('кнопка по-прежнему нажимается (%s → %s)' % (n0, n1), n0 != n1)
        b.close()
    sys.exit(0 if ok else 1)


if __name__ == '__main__':
    run()
