"""Единое меню в заголовке: общий каталог, предметные палитры, память,
адаптивность, клавиатура, ошибка загрузки и переходы учителя/ученика.
Запуск: python3 test_prompt_unified_exam_nav.py. Realtime — на заглушке.
"""
import re
from pathlib import Path
from playwright.sync_api import sync_playwright
import test_prompt54_trainer_sync_and_cards as t54

PORT = 8987
t54.PORT = PORT
BASE = f'http://127.0.0.1:{PORT}'
SHOTS = Path('/private/tmp/unified-trainer-nav-shots')


def ready(page):
    page.locator('.exam-nav-text').wait_for()
    page.wait_for_function("() => !!document.querySelector('link[href$=\"exam-nav.css\"]').sheet")


def menu(page):
    ready(page)
    if page.locator('#examJumpMenu').is_hidden():
        page.locator('.exam-nav-text').click()
    page.locator('.exam-jump-number:visible').first.wait_for()


def subject(page, name):
    menu(page)
    page.locator(f'[data-subject-id="{name}"]').click()
    assert page.locator('#examJumpMenu').is_visible()
    assert page.locator('#examJumpMenu').get_attribute('data-subject') == name


def choose(page, name, trainer):
    subject(page, name)
    pick_number(page, trainer)


def pick_number(page, trainer):
    page.locator(f'.exam-jump-number[data-trainer="{trainer}"]').click()
    resume = page.locator(f'[data-continue="{trainer}"]')
    if page.locator('#examJumpMenu').is_visible() and resume.is_visible():
        resume.click()


def wait_url(page, path):
    page.wait_for_url(re.compile(re.escape(BASE + '/' + path)))
    ready(page)


def check_routes(browser, errors):
    ctx = browser.new_context()
    page = t54.new_page(ctx, errors)
    page.goto(BASE + '/oge6.html')
    menu(page)
    assert page.locator('.exam-jump-number').count() == 18
    assert page.locator('.exam-jump-number[aria-current="page"]').get_attribute('data-trainer') == 'oge6'
    assert page.locator('[data-trainer="oge6"]').inner_text().startswith('№6')
    # Не рисуем собственное задание: открываем штатный тип и сохраняем снимок.
    page.keyboard.press('Escape')
    page.locator('#pickerArea .mode-card[data-id="p3"]').click()
    page.wait_for_timeout(450)
    before = page.evaluate('JSON.stringify(tsGetState().curTask)')
    choose(page, 'rus', 'rus2')
    wait_url(page, 'rus_oge.html?n=2')
    page.wait_for_function('() => __examNav.n() === 2 && __examNav.pid()')
    loads = page.evaluate('window.__navLoadMark = Math.random()')
    choose(page, 'rus', 'rus5')
    page.wait_for_function('() => __examNav.n() === 5 && __examNav.pid()')
    assert page.evaluate('window.__navLoadMark') == loads
    assert page.locator('.exam-nav-text').evaluate('el => el === document.activeElement')
    choose(page, 'math', 'oge6')
    wait_url(page, 'oge6.html')
    page.wait_for_function('() => tsGetState().picker === false')
    assert page.evaluate('tsGetState().curMode') == 'p3'
    assert page.evaluate('JSON.stringify(tsGetState().curTask)') == before
    choose(page, 'soc', 'soc9')
    wait_url(page, 'soc_oge.html?n=9')
    page.wait_for_function('() => __examNav.n() === 9 && __examNav.pid()')
    choose(page, 'eng', 'eng20')
    wait_url(page, 'eng_oge.html?n=20')
    page.wait_for_function('() => __examNav.n() === 20 && __examNav.pid()')
    subject(page, 'math')
    page.locator('[data-exam-id="ege_prof"]').click()
    assert page.locator('.exam-jump-number').count() == 20
    pick_number(page, 'ege7')
    wait_url(page, 'ege_prof.html?n=7')
    page.wait_for_function('() => __examNav.n() === 7 && __examNav.pid()')
    menu(page)
    page.locator('[data-exam-id="ege_base"]').click()
    assert page.locator('.exam-jump-number').count() == 21
    pick_number(page, 'egeb15')
    wait_url(page, 'ege_base.html?n=15')
    page.wait_for_function('() => __examNav.n() === 15 && __examNav.pid()')
    choose(page, 'rus', 'rus1')
    wait_url(page, 'rus_oge01.html')
    choose(page, 'rus', 'rus13')
    wait_url(page, 'rus_oge13.html')
    ctx.close()
    print('A: четыре предмета, ОГЭ/ЕГЭ, переходы внутри страницы, память задания — OK', flush=True)


def pick_type(page, subject_id, trainer, token, exam=None):
    subject(page, subject_id)
    if exam:
        page.locator(f'[data-exam-id="{exam}"]').click()
    page.locator(f'.exam-jump-number[data-trainer="{trainer}"]').click()
    page.locator(f'#examJumpTypes [data-type="{token}"]').click()


def check_types(browser, errors):
    ctx = browser.new_context(viewport={'width': 1280, 'height': 900})
    page = t54.new_page(ctx, errors)
    page.goto(BASE + '/oge6.html')
    menu(page)
    assert page.locator('#examJumpTypes').is_visible()
    for width in (1280, 768, 390, 320):
        page.set_viewport_size({'width': width, 'height': 900})
        for theme in ('light', 'dark'):
            page.evaluate('t => document.documentElement.dataset.theme=t', theme)
            n6 = page.locator('.exam-jump-number[data-trainer="oge6"]')
            n6.locator('.exam-jump-disclosure').click()
            assert n6.get_attribute('aria-expanded') == 'false'
            assert page.locator('#examJumpTypes').is_hidden()
            page.wait_for_timeout(150)
            n6.click()
            assert n6.get_attribute('aria-expanded') == 'true'
            page.wait_for_timeout(150)
            assert page.locator('#examJumpTypes [data-type="m:p6"]').is_visible()
            assert page.evaluate('document.documentElement.scrollWidth <= innerWidth')
            if width in (1280, 320):
                SHOTS.mkdir(exist_ok=True)
                page.screenshot(path=str(SHOTS / f'types-{width}-{theme}.png'))
    # Нативные повторные клики не ждут окончания предыдущего перехода.
    page.evaluate("""async () => { for(let i=0;i<10;i++){document.querySelector('.exam-jump-number[data-trainer="oge6"]').dispatchEvent(new MouseEvent('click',{bubbles:true,detail:1}));await new Promise(r=>setTimeout(r,20));}}""")
    page.wait_for_timeout(150)
    assert page.locator('#examJumpTypes').is_visible()
    assert page.locator('.exam-jump-exit').count() == 0
    page.emulate_media(reduced_motion='reduce')
    page.locator('.exam-jump-number[data-trainer="oge6"]').click()
    assert page.locator('#examJumpMenu').evaluate('e => e.getAnimations({subtree:true}).every(a=>a.playState!=="running")')
    page.locator('.exam-jump-number[data-trainer="oge6"]').click()
    page.emulate_media(reduced_motion='no-preference')
    page.locator('#examJumpTypes [data-type="m:p6"]').click()
    page.wait_for_function("() => tsGetState().picker === false && tsGetState().curMode === 'p6'")
    previous = page.evaluate('JSON.stringify(tsGetState().curTask)')
    page.set_viewport_size({'width': 1280, 'height': 900})
    pick_type(page, 'math', 'oge9', 'm:p8')
    wait_url(page, 'oge9.html')
    page.wait_for_function("() => tsGetState().picker === false && tsGetState().curMode === 'p8'")
    choose(page, 'math', 'oge6')
    wait_url(page, 'oge6.html')
    page.wait_for_function("() => tsGetState().picker === false && tsGetState().curMode === 'p6'")
    assert page.evaluate('JSON.stringify(tsGetState().curTask)') == previous
    pick_type(page, 'rus', 'rus5', 'r:colon')
    wait_url(page, 'rus_oge.html?n=5')
    page.wait_for_function("() => __rusOge.S.n === 5 && __rusOge.S.topic === 'colon'")
    pick_type(page, 'rus', 'rus9', 'r:prim-upr')
    page.wait_for_function("() => __rusOge.S.n === 9 && __rusOge.S.topic === 'prim-upr'")
    pick_type(page, 'rus', 'rus13', 'w:2')
    wait_url(page, 'rus_oge13.html')
    page.wait_for_function('() => __rusOge13.S.k === 2')
    subject(page, 'soc')
    page.locator('[data-trainer="soc9"]').click()
    token = page.locator('#examJumpTypes .exam-jump-type').first.get_attribute('data-type')
    page.locator('#examJumpTypes .exam-jump-type').first.click()
    wait_url(page, 'soc_oge.html?n=9')
    page.wait_for_function('() => __examNav.n() === 9 && __examNav.pid()')
    menu(page)
    assert page.locator('#examJumpTypes .exam-jump-type[aria-current="page"]').get_attribute('data-type') == token
    # Выбор ученика не должен обходить guard через новую кнопку типа.
    ctx.close()
    print('E: типы математики, русского и обществознания; стрелка, 120 мс, память, быстрые клики, reduced-motion — OK', flush=True)


def check_layout(browser, errors):
    SHOTS.mkdir(exist_ok=True)
    colors = {'math': 'rgb(0, 76, 153)', 'rus': 'rgb(158, 42, 71)', 'soc': 'rgb(23, 105, 79)', 'eng': 'rgb(91, 53, 150)'}
    ctx = browser.new_context()
    page = t54.new_page(ctx, errors)
    for width in (1440, 768, 390, 320):
        page.set_viewport_size({'width': width, 'height': 850})
        for path in ('oge6.html', 'rus_oge.html?n=5', 'soc_oge.html?n=9', 'eng_oge.html?n=20'):
            page.goto(BASE + '/' + path)
            for theme in ('light', 'dark'):
                page.evaluate("theme => document.documentElement.dataset.theme = theme", theme)
                menu(page)
                for name, count in (('math', 18), ('rus', 13), ('soc', 20), ('eng', 11)):
                    url = page.url
                    subject(page, name)
                    assert page.url == url
                    assert page.locator('.exam-jump-number').count() == count
                    if theme == 'light':
                        assert page.locator('.exam-jump-number-label').first.evaluate('el => getComputedStyle(el).color') == colors[name]
                    last = page.locator('.exam-jump-number').last
                    last.scroll_into_view_if_needed()
                    geometry = page.evaluate("""() => {
                      const m = document.getElementById('examJumpMenu'), r = m.getBoundingClientRect();
                      return {left:r.left,right:r.right,bottom:r.bottom,top:r.top,w:innerWidth,h:innerHeight,
                        overflow:document.documentElement.scrollWidth > innerWidth,menuOverflow:m.scrollWidth > m.clientWidth};
                    }""")
                    assert not geometry['overflow'] and not geometry['menuOverflow'], (path, width, geometry)
                    assert geometry['left'] >= 0 and geometry['right'] <= geometry['w'] + 1
                    assert geometry['top'] >= 0 and geometry['bottom'] <= geometry['h'] + 1
                    assert last.bounding_box()['height'] >= 44
                subject(page, 'soc')
                page.wait_for_timeout(220)
                if path.startswith('soc') and width in (1440, 390, 320):
                    page.screenshot(path=str(SHOTS / f'soc-{width}-{theme}.png'))
                page.keyboard.press('Escape')
                assert page.locator('#examJumpMenu').is_hidden()
                assert page.locator('.exam-nav-text').evaluate('el => el === document.activeElement')
                page.keyboard.press('Enter')
                page.locator('.exam-jump-number:visible').first.wait_for()
                page.locator('.exam-jump-close').click()
                assert page.locator('#examJumpMenu').is_hidden()
    page.goto(BASE + '/oge6.html?card=1')
    assert page.locator('.exam-nav-text').count() == 0
    page.goto(BASE + '/index.html')
    page.evaluate("""() => { const f=document.createElement('iframe'); f.src='oge6.html'; f.id='navFrame'; document.body.appendChild(f); }""")
    frame = page.frame_locator('#navFrame')
    frame.locator('h1').wait_for()
    assert frame.locator('.exam-nav-text').count() == 0
    ctx.close()
    print('B: 4 предмета × 4 ширины × 2 темы, все номера доступны, клавиатура, кадры — OK', flush=True)


def check_retry(browser, errors):
    ctx = browser.new_context()
    page = t54.new_page(ctx, errors)
    page.route('**/subjects-catalog.js', lambda route: route.abort())
    page.goto(BASE + '/oge6.html')
    ready(page)
    page.locator('.exam-nav-text').click()
    page.get_by_text('Не удалось загрузить список.').wait_for()
    page.unroute('**/subjects-catalog.js')
    page.get_by_role('button', name='Повторить', exact=True).click()
    page.locator('[data-trainer="oge6"]').wait_for()
    ctx.close()
    print('C: повтор после ошибки загрузки каталога — OK', flush=True)


def check_session(browser, errors):
    ctx = browser.new_context()
    teacher = t54.new_page(ctx, errors)
    teacher.goto(BASE + '/oge6.html')
    teacher.wait_for_function('() => TrainerSession.getCode()')
    code = teacher.evaluate('TrainerSession.getCode()')
    teacher.locator('#pickerArea .mode-card[data-id="p1"]').click()
    student = t54.new_page(ctx, errors)
    student.goto(BASE + '/oge6.html?s=' + code)
    student.wait_for_function('() => TrainerSession && !TrainerSession.isLeader()')
    before = student.url
    choose(student, 'soc', 'soc9')
    student.wait_for_timeout(300)
    assert student.url == before
    assert student.locator('#tsRestrictedHint').evaluate("el => el.style.opacity === '1'")
    student.keyboard.press('Escape')
    # Русский пока не подключает session-share.js; проверяем оба перехода
    # на обществознании, где мост совместной сессии уже реализован.
    choose(teacher, 'soc', 'soc9')
    wait_url(teacher, 'soc_oge.html?n=9')
    wait_url(student, 'soc_oge.html?n=9')
    teacher.wait_for_function('() => __examNav.n() === 9 && __examNav.pid()')
    student.wait_for_function('() => __examNav.n() === 9 && __examNav.pid()')
    choose(teacher, 'soc', 'soc10')
    teacher.wait_for_function('() => __examNav.n() === 10 && __examNav.pid()')
    student.wait_for_function('() => __examNav.n() === 10 && __examNav.pid()', timeout=10000)
    assert student.evaluate('__examNav.pid()') == teacher.evaluate('__examNav.pid()')
    pick_type(teacher, 'math', 'oge9', 'm:p8')
    wait_url(teacher, 'oge9.html')
    wait_url(student, 'oge9.html')
    teacher.wait_for_function("() => tsGetState().curMode === 'p8' && tsGetState().picker === false")
    student.wait_for_function("() => tsGetState().curMode === 'p8' && tsGetState().picker === false", timeout=10000)
    menu(student)
    student.locator('#examJumpTypes [data-type="m:p3"]').click()
    assert student.evaluate('tsGetState().curMode') == 'p8'
    assert student.locator('#tsRestrictedHint').evaluate("el => el.style.opacity === '1'")
    pick_type(teacher, 'math', 'oge9', 'm:p5')
    student.wait_for_function("() => tsGetState().curMode === 'p5'", timeout=10000)
    ctx.close()
    print('D: ограничения ученика, смена предмета и номера учителем — OK (заглушка)', flush=True)


def run():
    errors = []
    with t54.local_server(), sync_playwright() as p:
        browser = p.chromium.launch()
        for check in (check_routes, check_types, check_layout, check_retry, check_session):
            check(browser, errors)
        browser.close()
    assert not errors, errors
    print('Готово: единое меню проверено.')


if __name__ == '__main__':
    run()
