"""Новое меню в окнах и панелях доски; запуск: python3 test_prompt_exam_nav_surfaces.py.
Сопряжение проверяем локально через BroadcastChannel, без живого Supabase.
"""
from pathlib import Path
from playwright.sync_api import sync_playwright
import test_prompt54_trainer_sync_and_cards as t54
import test_prompt_unified_exam_nav as nav

PORT = 8988
BASE = f'http://127.0.0.1:{PORT}'
SHOTS = Path('/private/tmp/exam-nav-surfaces')
t54.PORT = PORT


def boot_board(page):
    page.goto(BASE + '/boards.html')
    page.evaluate("""() => new Promise((resolve,reject) => {
      const r=indexedDB.open('ogeBoardsDB',1);
      r.onupgradeneeded=()=>r.result.createObjectStore('state');
      r.onsuccess=()=>{const tx=r.result.transaction('state','readwrite'),s=tx.objectStore('state');
        s.put({__v:2,folders:[],deleted:[],sortMode:'my',boards:[{id:'bA',name:'Урок',folderId:null,createdAt:1000,updatedAt:1000,rev:1,cellSize:24,sheetCols:76,sheetRows:54,pageOrder:'h',view:{x:0,y:0,zoom:1}}]},'db');
        s.put({objects:[],imageLib:[]},'boarddata:bA');tx.oncomplete=()=>resolve();tx.onerror=()=>reject(tx.error);};
    })""")
    page.reload()
    page.evaluate("() => {document.getElementById('authGate').style.display='none';boardsAppBoot();}")
    page.wait_for_function("() => window.getDB && getDB().boards.length===1")
    page.evaluate("openBoard('bA')")
    page.wait_for_function("() => window.getCurrentBoard && getCurrentBoard() && boardLink && boardLink.active")


def frame_of(page, selector):
    frame = page.query_selector(selector).content_frame()
    frame.locator('.exam-nav-text').wait_for()
    return frame


def choose(frame, subject, trainer, token=None):
    nav.subject(frame, subject)
    frame.locator(f'.exam-jump-number[data-trainer="{trainer}"]').click()
    if token is None:
        button = frame.locator('#examJumpTypes .exam-jump-type').first
        token = button.get_attribute('data-type')
    else:
        button = frame.locator(f'#examJumpTypes [data-type="{token}"]')
    button.click()
    frame.wait_for_function("() => !location.search.includes('en_type=')")
    frame.locator('.exam-nav-text').wait_for()
    return token


def menu_fits(frame):
    nav.menu(frame)
    frame.wait_for_timeout(180)
    r = frame.locator('#examJumpMenu').evaluate("e => {const r=e.getBoundingClientRect();return {x:r.x,y:r.y,right:r.right,bottom:r.bottom,w:innerWidth,h:innerHeight,overflow:e.scrollWidth>e.clientWidth+1};}")
    assert r['x'] >= 0 and r['y'] >= 0 and r['right'] <= r['w'] + 1 and r['bottom'] <= r['h'] + 1, r
    assert not r['overflow'], r
    if frame.evaluate('innerWidth<=640') and frame.locator('.exam-jump-layout.is-expanded').count():
        assert frame.locator('.exam-jump-number:visible').count() == 1
    if frame.evaluate("matchMedia('(pointer:coarse)').matches"):
        hits = frame.evaluate("""() => {const f=window.frameElement,k=f?f.getBoundingClientRect().width/f.clientWidth:1;
          return [...document.querySelectorAll('#examJumpMenu button,.exam-nav-h1 button')].map(e=>e.getBoundingClientRect().height*k).filter(h=>h>0);}""")
        assert min(hits) >= 43.9, hits
    frame.locator('.exam-jump-close').click()


def add_and_check(board, panel, button, expected):
    before = board.evaluate("getCurrentBoard().objects.filter(o=>o.type==='image').length")
    task = panel.evaluate("""() => {const f=document.getElementById('bpIframe')||document.getElementById('bdTrainersIframe'),w=f.contentWindow;
      const it=ttPanelItemForLocation(w.location),el=collectTrainerCaptureNodes(w.document,it.id)[0].el;return trainerTaskInfo(w,it.id,el);}""")
    panel.locator(button).click()
    board.wait_for_function('(n) => getCurrentBoard().objects.filter(o=>o.type==="image").length===n', arg=before + 1, timeout=25000)
    got = board.evaluate("() => {const o=getCurrentBoard().objects.filter(o=>o.type==='image').at(-1),g=o.gen||{};return {tid:g.tid,mode:g.snap&&g.snap.curMode,n:g.n,pid:g.pid,img:o.src.startsWith('data:image/'),task:o.task};}")
    for key, value in expected.items():
        assert got[key] == value, (expected, got)
    assert got['img'] and got['task'], got
    for key, value in task.items():
        assert got['task'].get(key) == value, (key, value, got['task'])


def check_embedded(board):
    board.evaluate("() => {setTrainersPanel('open');openTrainerInPanel('oge6','oge6.html','№6');sessionStorage.setItem('examNav:mem:v1',JSON.stringify({sentinel:'main'}));}")
    frame = frame_of(board, '#bdTrainersIframe')
    choose(frame, 'math', 'oge6', 'm:p6')
    frame.wait_for_function("() => tsGetState().curMode==='p6' && !tsGetState().picker")
    menu_fits(frame)
    add_and_check(board, board, '#bdTrainersAddBtn', {'tid': 'oge6', 'mode': 'p6'})
    choose(frame, 'math', 'oge9', 'm:p8')
    frame.wait_for_function("() => typeof tsGetState==='function' && tsGetState().curMode==='p8' && !tsGetState().picker")
    add_and_check(board, board, '#bdTrainersAddBtn', {'tid': 'oge9', 'mode': 'p8'})
    choose(frame, 'rus', 'rus5', 'r:colon')
    frame.wait_for_function("() => window.__rusOge && __rusOge.S.n===5 && __rusOge.S.topic==='colon'")
    menu_fits(frame)
    nav.menu(frame)
    assert frame.locator('[data-trainer="rus1"],[data-trainer="rus13"]').count() == 0
    frame.locator('.exam-jump-close').click()
    assert frame.locator('#examPrevBtn').is_enabled()
    # Стрелки идут только по доступным панели номерам и не уводят в сочинение.
    frame.evaluate('__examNav.open(12)')
    frame.wait_for_timeout(350)
    assert frame.locator('#examNextBtn').is_disabled()
    assert board.evaluate("JSON.parse(sessionStorage.getItem('examNav:mem:v1')).sentinel") == 'main'
    print('A: встроенная панель — номер, тип, предмет, вставка выбранных №6/9, отдельная память — OK', flush=True)


def check_popup(board, ctx):
    board.locator('#bdTrainersLinkBtn').click()
    with board.expect_popup() as info:
        board.locator('#linkOpenWin').click()
    panel = info.value
    panel.wait_for_function('() => window.__boardPanel && __boardPanel.client.state().paired')
    panel.evaluate("__boardPanel.openTrainer('oge6','oge6.html','№6')")
    frame = frame_of(panel, '#bpIframe')
    choose(frame, 'math', 'oge6', 'm:p3')
    frame.wait_for_function("() => tsGetState().curMode==='p3' && !tsGetState().picker")
    menu_fits(frame)
    add_and_check(board, panel, '#bpAddBtn', {'tid': 'oge6', 'mode': 'p3'})
    choose(frame, 'soc', 'soc9')
    frame.wait_for_function("() => window.__examNav && __examNav.n()===9 && __examNav.pid()")
    pid = frame.evaluate('__examNav.pid()')
    add_and_check(board, panel, '#bpAddBtn', {'tid': 'soc9', 'n': 9, 'pid': pid})
    nav.menu(frame)
    frame.wait_for_timeout(220)
    SHOTS.mkdir(exist_ok=True)
    panel.screenshot(path=str(SHOTS / 'popup-desktop.png'))
    frame.locator('.exam-jump-close').click()
    assert panel.url.endswith('boards-panel.html')
    print('B: настоящее отдельное окно с доски — математика/обществознание, вставка выбранного типа — OK', flush=True)
    panel.close()


def check_phone(browser, width):
    errors = []
    ctx = browser.new_context(viewport={'width': width, 'height': 844}, is_mobile=True, has_touch=True, device_scale_factor=2)
    isolate(ctx, errors)
    board = ctx.new_page()
    boot_board(board)
    board.evaluate('boardLink.linkLocalPanel()')
    panel = ctx.new_page()
    panel.goto(BASE + '/boards-panel.html')
    panel.wait_for_function('() => window.__boardPanel && __boardPanel.client.state().paired')
    panel.evaluate("__boardPanel.openTrainer('oge6','oge6.html','№6')")
    frame = frame_of(panel, '#bpIframe')
    for theme in ('light', 'dark'):
        frame.evaluate('t => document.documentElement.dataset.theme=t', theme)
        menu_fits(frame)
        nav.menu(frame)
        row = frame.locator('.exam-jump-number[data-trainer="oge6"]')
        row.locator('.exam-jump-disclosure').tap()
        frame.wait_for_timeout(160)
        assert frame.locator('#examJumpTypes').is_hidden()
        assert frame.locator('.exam-jump-number:visible').count() == 18
        row.tap()
        frame.wait_for_timeout(160)
        assert frame.locator('#examJumpTypes').is_visible()
        assert frame.locator('.exam-jump-number:visible').count() == 1
        frame.locator('#examJumpTypes [data-type="m:p6"]').tap()
        frame.wait_for_function("() => tsGetState().curMode==='p6' && !tsGetState().picker")
    add_and_check(board, panel, '#bpAddBtn', {'tid': 'oge6', 'mode': 'p6'})
    choose(frame, 'rus', 'rus5', 'r:colon')
    frame.wait_for_function("() => window.__rusOge && __rusOge.S.n===5 && __rusOge.S.topic==='colon'")
    add_and_check(board, panel, '#bpAddBtn', {})
    choose(frame, 'soc', 'soc9')
    frame.wait_for_function("() => window.__examNav && __examNav.n()===9 && __examNav.pid()")
    add_and_check(board, panel, '#bpAddBtn', {'tid': 'soc9', 'n': 9, 'pid': frame.evaluate('__examNav.pid()')})
    choose(frame, 'eng', 'eng20')
    frame.wait_for_function("() => window.__examNav && __examNav.n()===20 && __examNav.pid()")
    pid = frame.evaluate('__examNav.pid()')
    add_and_check(board, panel, '#bpAddBtn', {'tid': 'eng20', 'n': 20, 'pid': pid})
    nav.menu(frame)
    assert frame.locator('[data-trainer="eng1"],[data-trainer="eng5"],[data-trainer="eng6"]').count() == 0
    frame.wait_for_timeout(220)
    SHOTS.mkdir(exist_ok=True)
    panel.screenshot(path=str(SHOTS / f'panel-{width}.png'))
    frame.locator('.exam-jump-close').tap()
    # Телефонный экран меньшей высоты: меню остаётся прокручиваемым.
    panel.set_viewport_size({'width': 844, 'height': width})
    menu_fits(frame)
    # Обычная страница тренажёра на телефоне тоже сохраняет полное меню.
    standalone = ctx.new_page()
    standalone.goto(BASE + '/oge6.html')
    choose(standalone, 'math', 'oge6', 'm:p6')
    standalone.wait_for_function("() => tsGetState().curMode==='p6' && !tsGetState().picker")
    menu_fits(standalone)
    nav.subject(standalone, 'rus')
    assert standalone.locator('[data-trainer="rus1"],[data-trainer="rus13"]').count() == 2
    standalone.wait_for_timeout(220)
    standalone.screenshot(path=str(SHOTS / f'standalone-{width}.png'))
    assert not errors, errors
    ctx.close()
    print(f'C: телефон {width}px — касания, обе темы, четыре предмета, четыре вставки на доску, поворот — OK', flush=True)


def check_excluded(ctx):
    page = ctx.new_page()
    page.goto(BASE + '/oge6.html?card=1')
    assert page.locator('.exam-nav-text').count() == 0
    page.goto(BASE + '/oge6.html?bdgen=1')
    assert page.locator('.exam-nav-text').count() == 0
    page.goto(BASE + '/index.html')
    page.evaluate("() => {const f=document.createElement('iframe');f.src='oge6.html';document.body.appendChild(f);}")
    frame = page.query_selector('iframe').content_frame()
    frame.wait_for_url(BASE + '/oge6.html')
    frame.wait_for_load_state()
    assert frame.locator('.exam-nav-text').count() == 0
    page.close()
    print('D: карточка, фоновый генератор и обычный iframe по-прежнему без меню — OK', flush=True)


def isolate(ctx, errors):
    ctx.route('https://**/*', lambda route: route.abort())
    ctx.route('**/supabase-config.js', lambda route: route.fulfill(content_type='application/javascript', body='window.SUPABASE_CONFIG = {};'))
    ctx.on('page', lambda page: page.on('pageerror', lambda error: errors.append(str(error))))


def run():
    with t54.local_server(), sync_playwright() as p:
        browser = p.chromium.launch()
        errors = []
        ctx = browser.new_context(viewport={'width': 1400, 'height': 950})
        isolate(ctx, errors)
        board = ctx.new_page()
        boot_board(board)
        check_embedded(board)
        check_popup(board, ctx)
        check_excluded(ctx)
        assert not errors, errors
        ctx.close()
        for width in (320, 390):
            check_phone(browser, width)
        browser.close()
    print('Готово: навигация в отдельных окнах, панелях и на телефоне; выбранные задания добавлены на доску.')


if __name__ == '__main__':
    run()
