"""
Плашка сессии и переход на доску (17.11.2026): student-memory.js, boards-core.js, schedule.js.

  A. «Открыть доску» в панели занятия — в той же вкладке (сессия привязана к вкладке);
  B. на списке досок плашка сессии есть и не лежит на плашке входа («Даниил · …» / кружок «⋯»);
  C. на списке досок ссылка «на доску» (меняет только #board=) открывает доску.
Запуск: python3 test_prompt_session_board_nav.py (сервер поднимается сам).
"""
import sys

from playwright.sync_api import sync_playwright

import test_prompt_rus_board_check as R
from test_prompt_b3_board_memory import STUB_JS, VANYA

check = R.check


def main():
    with R.local_server(), sync_playwright() as p:
        browser = p.chromium.launch()
        ctx = browser.new_context()
        ctx.add_init_script("try{localStorage.setItem('smBarMini:v1','0')}catch(e){}")
        ctx.add_init_script(STUB_JS)
        # как на сайте: к ученику привязан ОБЛАЧНЫЙ id доски, у карточки — свой локальный (bA)
        ctx.add_init_script("window.__stubStudents[0].boards = ['cloud-A'];")
        page, errors = R.open_board(ctx)
        page.wait_for_timeout(2600)
        page.evaluate("() => { getDB().boards.find(b => b.id === 'bA').cloudBoardId = 'cloud-A'; }")
        page.evaluate("s => StudentMemory.start(s)", {"id": VANYA["id"], "name": VANYA["name"]})
        # назад к доскам
        page.evaluate("() => { const b = document.getElementById('bdBack') || document.querySelector('[data-act=back]'); if (b) b.click(); }")
        page.wait_for_function("() => document.getElementById('screenList').style.display !== 'none'", timeout=8000)
        # плашка входа, как в boards-cloud.js: слева внизу, 16/16
        page.evaluate("""() => { const d = document.createElement('div'); d.id = 'authUserPill'; d.className = 'ag-user-pill'; d.textContent = 'Даниил · доступ · выйти'; document.body.appendChild(d); }""")
        page.wait_for_selector("#smBar", timeout=6000)
        page.wait_for_timeout(2400)
        a = page.evaluate("() => { const r = document.getElementById('smBar').getBoundingClientRect(), q = document.getElementById('authUserPill').getBoundingClientRect();"
                          " return { overlap: !(r.right <= q.left || r.left >= q.right || r.bottom <= q.top || r.top >= q.bottom), vis: r.width > 0 }; }")
        check("B1 на списке досок плашка сессии видна", a["vis"])
        check("B2 плашка сессии не налезает на плашку входа", not a["overlap"], str(a))
        link = page.get_attribute("#smBar a.sm-board", "href")
        check("B3 в плашке «на доску» — облачный id доски ученика", link == "boards.html#board=cloud-A", str(link))
        page.wait_for_function("() => document.querySelector('.bl-card[data-board=bA]') && document.querySelector('.bl-card[data-board=bA]').classList.contains('sm-sess-board')", timeout=6000)
        check("B4 карточка доски ученика в списке подсвечена (по облачному id)", True)
        # E. плавность: плашка входа сменилась кружком — плашка сессии едет в тот же момент
        #    (событие agpillchange, как шлёт boards-cloud.js) и с переходом .24 с
        page.evaluate("""() => { const d = document.getElementById('authUserPill'); d.style.cssText = 'width:28px;height:28px;padding:0';
                              window.dispatchEvent(new Event('agpillchange')); }""")
        e = page.evaluate("""() => { const b = document.getElementById('smBar'), q = document.getElementById('authUserPill').getBoundingClientRect();
                              return { left: b.style.left, want: Math.round(q.right + 8) + 'px', tr: getComputedStyle(b).transitionDuration, cls: b.className }; }""")
        check("E1 плашка сессии сдвигается сразу по событию плашки входа", e["left"] == e["want"], str(e))
        check("E2 сдвиг плавный: переход 0,24 с", "0.24s" in e["tr"], str(e))
        page.click("#smBar .sm-hide")
        page.wait_for_function("() => document.getElementById('smBar').classList.contains('sm-out')", timeout=500)
        page.wait_for_function("() => document.getElementById('smBar').classList.contains('mini')", timeout=1500)
        check("E3 сворачивание плашки сессии идёт через плавный уход, потом точка", True)
        page.click("#smBar .sm-pip")
        page.wait_for_function("() => document.getElementById('smBar').classList.contains('sm-in')", timeout=500)
        check("E4 разворачивание плашки сессии — плавное раскрытие", True)
        # C. ссылка с тем же адресом страницы — меняется только #hash
        page.evaluate("h => { location.hash = h; }", "board=cloud-A")
        page.wait_for_function("() => boardActive === true", timeout=8000)
        check("C1 #board=<облачный id> на открытом списке открывает доску", True)
        check("C2 нет ошибок JavaScript", not errors, "; ".join(map(str, errors)))
        browser.close()
    print()
    print("ПРОВАЛЕНО: " + ", ".join(R.FAILS) if getattr(R, "FAILS", None) else "Все проверки прошли — готово")


main()
