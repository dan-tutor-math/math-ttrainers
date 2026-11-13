"""3D-шина: точные ответы, сценарии, WebGL/SVG и снимки состояния.

Запуск: python3 test_prompt_tire3d.py [--stage1]
Транспорт realtime проверяется отдельно на сайте, здесь сеть Supabase закрыта.
"""
import contextlib
import http.client
import itertools
import math
import os
from pathlib import Path
import subprocess
import sys
import time
from urllib.parse import urlparse, parse_qs
from fractions import Fraction

if Path('/private/tmp/tire3d-browsers').exists():
    os.environ.setdefault('PLAYWRIGHT_BROWSERS_PATH', '/private/tmp/tire3d-browsers')
from playwright.sync_api import sync_playwright

HERE = Path(__file__).resolve().parent
PORT = int(os.environ.get('TIRE3D_TEST_PORT', '9148'))
BASE = f'http://127.0.0.1:{PORT}'
SHOTS = HERE / 'test-files' / 'tire3d'
TIRES = [(175, 70, 13), (195, 65, 15), (205, 55, 16), (225, 45, 17), (175, 70, 12)]
SCENES = ['width', 'side', 'rim', 'diam', 'run', 'compare']
INIT = "window.SUPABASE_CONFIG={}; localStorage.removeItem('trainerSession:global'); sessionStorage.clear();"


def check(label, condition):
    assert condition, label
    print('OK:', label, flush=True)


@contextlib.contextmanager
def server():
    proc = subprocess.Popen([sys.executable, '-m', 'http.server', str(PORT), '--bind', '127.0.0.1'], cwd=HERE, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    try:
        for _ in range(60):
            try:
                c = http.client.HTTPConnection('127.0.0.1', PORT, timeout=.2)
                c.request('GET', '/tire3d.html')
                if c.getresponse().status == 200:
                    c.close()
                    break
            except OSError:
                time.sleep(.1)
        else:
            raise RuntimeError('Не поднялся сервер')
        yield
    finally:
        proc.terminate()
        proc.wait(timeout=5)


def page_open(browser, url='tire3d.html', width=1280, init=INIT):
    ctx = browser.new_context(viewport={'width': width, 'height': 1000}, reduced_motion='reduce')
    ctx.add_init_script(init)
    ctx.route('https://**/*', lambda route: route.abort())
    page = ctx.new_page()
    errors = []
    page.on('pageerror', lambda e: errors.append(str(e)))
    page.on('console', lambda msg: errors.append(msg.text) if msg.type == 'error' else None)
    page.route('**/supabase-config.js', lambda route: route.fulfill(status=200, content_type='application/javascript', body='window.SUPABASE_CONFIG = {};'))
    page.goto(BASE + '/' + url)
    if url.startswith('tire3d'):
        page.wait_for_function('window.Tire3D && window.Tire3D.debug().webgl || window.Tire3D && window.Tire3D.debug().fallback')
        page.evaluate('() => Tire3D.ready')
        page.wait_for_timeout(100)
    return ctx, page, errors


def tire(t):
    return dict(zip(['width', 'profile', 'rim'], t))


def test_model(browser):
    ctx, page, errors = page_open(browser, 'tire3d.html?w=195&p=65&r=15&scene=side&step=3&style=glass')
    check('WebGL SwiftShader включён', page.evaluate('Tire3D.debug().webgl'))
    check('H открывается с целой шиной',not page.evaluate('Tire3D.getState().cut'))
    check('все четыре значения и единицы видны сразу',page.locator('#sizeReadout b').count()==4 and page.locator('#sizeReadout small').all_text_contents()==['мм']*4)
    page.locator('#allDimensions').check()
    page.wait_for_function('new Set([...document.querySelectorAll("[data-dimension]")].map(e=>e.dataset.dimension)).size===4')
    check('переключатель показывает B, H, d, D вместе',set(page.locator('[data-dimension]').evaluate_all('(es)=>es.map(e=>e.dataset.dimension)'))=={'B','H','d','D'})
    page.locator('#allDimensions').uncheck()
    for sc in SCENES:
        page.locator(f'[data-scene="{sc}"]').click()
        page.locator('#allDimensions').check()
        page.wait_for_function('new Set([...document.querySelectorAll("[data-dimension]")].map(e=>e.dataset.dimension)).size===4')
        check('все размеры работают в сценарии '+sc,True)
    page.locator('#allDimensions').uncheck()
    page.goto(BASE+'/tire3d.html?w=195&p=65&r=15&scene=side&step=3&style=glass')
    page.evaluate('()=>Tire3D.ready')
    state = page.evaluate('Tire3D.getState()')
    check('параметры адреса', state['tire'] == tire(TIRES[1]) and state['scene'] == 'side' and state['step'] == 3 and state['style'] == 'glass')
    refctx, ref, _ = page_open(browser, 'oge1_5.html?all=1')
    ref.wait_for_function('typeof build_tire_run === "function"')
    for a in TIRES:
        s = dict(state, tire=tire(a), tire2=tire(TIRES[1]))
        page.evaluate('(s) => Tire3D.applyState(s)', s)
        m = page.evaluate('Tire3D.metrics()')
        w, p, r = a
        check(f'точные H, d, D {a}', [m['H'], m['d'], m['D']] == [float(Fraction(w*p, 100)), float(Fraction(r*254, 10)), float(Fraction(2*w*p+r*2540,100))])
        out = ref.evaluate('(t) => [build_tire_side(t).correctValue, build_tire_diam(t).correctValue]', tire(a))
        check('совпадает с build_tire_side/diam', out == [m['H'], m['D']])
    pairs = [[tire(a), tire(b)] for a,b in itertools.product(TIRES, TIRES)]
    # Все 25 состояний применяются в одной задаче браузера: арифметике не
    # нужно заставлять SwiftShader рисовать между независимыми проверками.
    actual = page.evaluate('(pairs)=>pairs.map(([a,b])=>{const s=Tire3D.getState();s.tire=a;s.tire2=b;Tire3D.applyState(s);return Tire3D.metrics()})',pairs)
    expected = ref.evaluate('(pairs)=>pairs.map(([a,b])=>[build_tire_ddiam(a,b).correctValue,build_tire_run(a,b).correctValue])',pairs)
    for (a,b),m,out in zip(pairs,actual,expected):
        assert out == [m['diff100']/100, m['percent10']/10], (a,b,m,out)
    check('25 пар: разность и округлённый процент совпадают с build_tire_*', True)
    # Ровно 1,25 % должно дать 1,3, а не зависеть от представления double.
    check('половина вверх на точной границе', ref.evaluate('TireMath.compare({width:100,profile:50,rim:0},{width:125,profile:40.5,rim:0}).percent10') == 13)
    refctx.close()
    for sc in SCENES:
        page.locator(f'[data-scene="{sc}"]').click()
        count = page.evaluate('Tire3D.steps().length')
        for i in range(count):
            assert page.evaluate('Tire3D.getState().step') == i
            assert page.locator('#formulas .katex').count()
            assert not page.locator('.katex-error').count()
            assert '/' not in page.locator('#formulas .katex-html').all_text_contents()[0]
            if i < count - 1:
                page.locator('#nextStep').click()
        for i in reversed(range(count-1)):
            page.keyboard.press('ArrowLeft')
            assert page.evaluate('Tire3D.getState().step') == i
        check(f'все шаги вперёд/назад и KaTeX: {sc}', True)
    for part, sc in [('B','width'),('H','side'),('d','rim')]:
        for root in ['#marking','#markPills']:
            page.locator(f'{root} [data-part="{part}"]').click()
            assert page.evaluate('Tire3D.getState().scene') == sc
    page.locator('#marking [data-part="R"]').click()
    check('клики маркировки и пилюль; R не радиус', page.locator('#radialNote').is_visible())
    page.locator('[data-scene="side"]').click()
    page.locator('#nextStep').click()
    check('вертикальная дробь', page.locator('#formulas .mfrac').count() > 0)
    colors = page.evaluate('Tire3D.COLORS')
    check('единая палитра B/H/R/d/D', colors == {'B':'#2A5DBF','H':'#D45F23','R':'#A2A2A0','d':'#509B4C','D':'#7D5CDA'})
    for k, value in colors.items():
        check(f'цвет {k} у маркировки', page.locator(f'#marking [data-part="{k}"]').evaluate('(e) => e.style.getPropertyValue("--dimension")').lower() == value.lower()) if k != 'D' else None
    check('цвета формулы совпадают', page.evaluate('Array.from(document.querySelectorAll("#formulas .katex-html [style]" )).some(e=>e.style.color==="rgb(42, 93, 191)")'))
    page.locator('[data-scene="diam"]').click()
    rect=page.locator('#modelHost').bounding_box()
    page.mouse.click(rect['x']+rect['width']/2,rect['y']+rect['height']/2)
    check('WebGL остаётся живым после всех сценариев',page.evaluate('Tire3D.debug().webgl'))
    check('клик по диску открывает d',page.evaluate('Tire3D.getState().scene')=='rim')
    for style in ['real','glass']:
        page.locator(f'[data-style="{style}"]').click()
        page.reload(); page.evaluate('() => Tire3D.ready')
        assert page.evaluate('Tire3D.getState().style') == 'glass'  # style в URL приоритетнее памяти
        page.goto(BASE+'/tire3d.html'); page.evaluate('() => Tire3D.ready')
        assert page.evaluate('Tire3D.getState().style') == style
        page.goto(BASE+'/tire3d.html?style=glass'); page.evaluate('() => Tire3D.ready')
    check('стиль запоминается; URL имеет приоритет', True)
    page.locator('[data-scene="diam"]').click()
    page.wait_for_timeout(100)
    before = page.evaluate('Tire3D.debug().frameCount');page.wait_for_timeout(500)
    check('нет постоянного цикла отрисовки', before == page.evaluate('Tire3D.debug().frameCount'))
    page.locator('#spreadMeasures').click()
    s = page.evaluate('({...Tire3D.getState(),sideAngle:1,widthAngle:2,demoReplay:3})')
    ctx2, other, other_errors = page_open(browser)
    other.evaluate('(s) => Tire3D.applyState(s)', s)
    check('get/apply в другой странице', s == other.evaluate('Tire3D.getState()'))
    check('PNG-снимок модели', page.evaluate('async()=> (await Tire3D.screenshot()).startsWith("data:image/png;base64,")'))
    page.goto(BASE+'/tire3d.html?w=oops&p=-1&r=100&scene=nope&step=-10&style=oops')
    page.evaluate('() => Tire3D.ready')
    s=page.evaluate('Tire3D.getState()')
    check('неверные параметры — демоверсия',s['tire']==tire((175,70,12)) and s['scene']=='width' and s['step']==0)
    page.goto(BASE+'/tire3d.html?w=195&p=65&r=15&scene=compare')
    page.wait_for_selector('[data-compare-label]')
    check('пример сравнения без второй маркировки показывает разницу',page.evaluate('Tire3D.metrics().diff100')>0)
    check('нет ошибок консоли', not errors and not other_errors)
    ctx2.close();ctx.close()


def test_fallback(browser):
    ctx, page, errors = page_open(browser, 'tire3d.html?scene=side', init=INIT+"const original=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(kind,...args){return /webgl/.test(kind)?null:original.call(this,kind,...args)};")
    check('без WebGL: SVG с двумя H и формулами', page.evaluate('Tire3D.debug().fallback') and page.locator('#modelHost svg').count()==1 and page.locator('[data-dimension="H"]').count()==2 and page.locator('.katex').count()>0)
    page.locator('[data-scene="diam"]').click()
    page.wait_for_selector('[data-dimension="D"]')
    check('SVG: D состоит из H,d,H и отдельной D',page.locator('[data-dimension="H"]').count()==2 and page.locator('[data-dimension="d"]').count()==1 and page.locator('[data-dimension="D"]').count()==1)
    check('SVG тоже экспортируется в PNG',page.evaluate('async()=> (await Tire3D.screenshot()).startsWith("data:image/png;base64,")'))
    check('без WebGL нет ошибок консоли',not errors);ctx.close()


def screenshots(browser):
    SHOTS.mkdir(parents=True,exist_ok=True)
    for style, width, sc in itertools.product(['real','glass'],[1280,375],['side','diam']):
        ctx,page,errors=page_open(browser,f'tire3d.html?w=195&p=65&r=15&scene={sc}&step=3&style={style}',width)
        page.wait_for_timeout(200)
        check(f'нет горизонтального переполнения {style}/{width}/{sc}',page.evaluate('document.documentElement.scrollWidth<=innerWidth'))
        name=f'{style}-{width}-{sc}.png'
        if style=='real' and width==1280 and sc=='side':
            page.locator('#viewport').evaluate('(el)=>el.style.display="none"')
            page.wait_for_timeout(80)
            page.locator('#viewport').evaluate('(el)=>el.style.display=""')
            page.wait_for_timeout(80)
            check('проекция восстанавливается после нулевого размера сцены',not errors)
        page.screenshot(path=str(SHOTS/name),full_page=True)
        check('скриншот '+name+(': '+str(errors) if errors else ''), not errors)
        ctx.close()


def extra_shots(browser):
    SHOTS.mkdir(parents=True,exist_ok=True)
    for sc,step in [('compare',3),('run',2)]:
        ctx,page,errors=page_open(browser,f'tire3d.html?w=175&p=70&r=13&w2=205&p2=55&r2=16&scene={sc}&step={step}&all=1&style=real')
        page.wait_for_function('new Set([...document.querySelectorAll("[data-dimension]")].map(e=>e.dataset.dimension)).size===4')
        if sc=='compare':
            check('подпись разности D: ровно 56,7 мм', '56,7 мм' in page.locator('#dimensions text').all_text_contents())
        page.screenshot(path=str(SHOTS/f'{sc}-all.png'),full_page=True)
        check(f'{sc}-all.png — все четыре стрелки без ошибок консоли',not errors)
        ctx.close()


def test_presentation(browser):
    for width in [1280, 375]:
        ctx,page,errors=page_open(browser,'tire3d.html?w=195&p=65&r=15&scene=diam',width)
        lesson=page.locator('#tireLesson')
        viewport=page.locator('#viewport')
        reference=viewport.bounding_box()
        check(f'{width}: справка показывает решение ниже модели',lesson.bounding_box()['y']>reference['y']+reference['height'])
        page.locator('[data-mode="interactive"]').click()
        check(f'{width}: интерактив начинается с модели',lesson.is_hidden() and page.locator('#solutionToggle').is_visible())
        before=viewport.bounding_box()
        if width==1280:
            page.emulate_media(reduced_motion='no-preference')
        animations=page.evaluate('''()=>{document.getElementById('solutionToggle').click();
          return [document.getElementById('viewport').getAnimations().length,document.getElementById('tireLesson').getAnimations().length]}''')
        check(f'{width}: переход учитывает настройку движения',animations==([1,1] if width==1280 else [0,0]))
        page.wait_for_function('!document.getElementById("viewport").getAnimations().length')
        after=viewport.bounding_box()
        text=lesson.bounding_box()
        check(f'{width}: решение слева на одной высоте с уменьшенной моделью',
              abs(after['y']-text['y'])<2 and text['x']+text['width']<=after['x'] and
              after['width']<before['width'] and after['height']<before['height'] and
              page.evaluate('document.documentElement.scrollWidth===innerWidth'))
        check(f'{width}: кружки H и d меньше и вынесены правее мерок',page.evaluate('''()=>
          [...document.querySelectorAll('[data-measure="diameter-part"]')].every(group=>{
            const line=group.querySelector('line'), dot=group.querySelector('circle');
            return dot.r.baseVal.value<16 && dot.cx.baseVal.value-dot.r.baseVal.value>(line.x1.baseVal.value+line.x2.baseVal.value)/2;
          })'''))
        rows=lesson.locator('.formula')
        if width==1280:
            page.evaluate('''()=>{window.__loopMeasures=[];
              new MutationObserver(()=>{
                const key=[...new Set([...document.querySelectorAll('[data-formula-measure="active"]')].map(e=>e.dataset.dimension))].join('');
                if(key && __loopMeasures.at(-1)!==key) __loopMeasures.push(key);
              }).observe(document.getElementById('dimensions'),{childList:true});} ''')
            page.wait_for_function('__loopMeasures.length>=4')
            cycle=page.evaluate('__loopMeasures.slice(0,4)')
            check('вводная подсветка повторяет H, d и D',set(cycle[:3])=={'H','d','D'} and cycle[0]==cycle[3])
            rows.first.click()
            page.wait_for_function('''document.querySelectorAll('[data-formula-measure="active"]').length===4''')
            page.wait_for_timeout(720)
            check('клик по вводной формуле останавливает цикл',rows.first.get_attribute('aria-pressed')=='true' and page.locator('[data-formula-measure="active"]').count()==4)
            rows.first.click()
            check('повторный клик возвращает цикл',rows.first.get_attribute('aria-pressed')=='false')
        else:
            check('без движения вводная формула показывает все мерки',page.locator('[data-formula-measure="active"]').count()==4)
        page.locator('#nextStep').click()
        check(f'{width}: на месте открывается следующий шаг с формулами',page.locator('#stepCount').inner_text()=='2 из 4' and lesson.locator('.katex').count()>0)
        page.wait_for_timeout(720)
        check(f'{width}: H и B остаются выделены, пока не выбрана другая строка',
              rows.first.get_attribute('aria-pressed')=='true' and
              set(page.locator('[data-formula-measure="active"]').evaluate_all('(es)=>es.map(e=>e.dataset.dimension)'))=={'B','H'})
        rows.nth(1).press('Enter')
        page.wait_for_function('''()=>[...document.querySelectorAll('[data-formula-measure="active"]')].map(e=>e.dataset.dimension).join('')==='d' ''')
        check(f'{width}: по клавиатуре можно выделить строку d',rows.nth(1).get_attribute('aria-pressed')=='true' and lesson.locator('[data-formula-term][data-quantity="d"]').count()>0)
        rows.first.click()
        check(f'{width}: можно снова вернуться к строке H',rows.first.get_attribute('aria-pressed')=='true')
        rows.nth(1).click()
        state=page.evaluate('Tire3D.getState()')
        share=page.evaluate('Tire3D.shareURL()')
        page.goto(BASE+'/'+share)
        page.evaluate('()=>Tire3D.ready')
        check(f'{width}: ссылка открывает тот же шаг и режим',lesson.is_visible() and page.evaluate('Tire3D.getState().step')==state['step'] and rows.nth(1).get_attribute('aria-pressed')=='true')
        page.locator('#solutionToggle').click()
        check(f'{width}: решение скрывается по кнопке',lesson.is_hidden())
        page.locator('[data-mode="reference"]').click()
        check(f'{width}: можно вернуться к справке',lesson.is_visible() and page.locator('#solutionToggle').is_hidden() and not errors)
        if width==1280:
            page.goto(BASE+'/tire3d.html?mode=interactive&solution=1&scene=compare')
            page.evaluate('()=>Tire3D.ready')
            active='[data-formula-measure="active"][data-measure-wheel]'
            check('в сравнении первая формула выделяет D₁',page.locator(active).get_attribute('data-measure-wheel')=='1')
            rows.nth(1).click()
            page.wait_for_function('''()=>document.querySelector('[data-formula-measure="active"][data-measure-wheel="2"]')''')
            check('вторая формула выделяет только D₂',page.locator(active).get_attribute('data-measure-wheel')=='2')
        ctx.close()


def main():
    with server(), sync_playwright() as p:
        browser=p.chromium.launch(executable_path=os.environ.get('TIRE3D_BROWSER_EXECUTABLE'), args=['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'])
        if '--presentation-only' in sys.argv:
            test_presentation(browser)
            browser.close()
            print('готово',flush=True)
            return
        if '--motion-only' in sys.argv:
            test_motion(browser)
            browser.close()
            print('готово',flush=True)
            return
        if '--stage2-only' not in sys.argv and '--stage3-only' not in sys.argv and '--board-session-only' not in sys.argv:
            test_model(browser);test_presentation(browser);test_motion(browser);test_fallback(browser);screenshots(browser);extra_shots(browser)
        if '--stage3-only' in sys.argv:
            test_board(browser)
            test_board_session(browser)
        elif '--board-session-only' in sys.argv:
            test_board_session(browser)
        elif '--stage1' not in sys.argv:
            test_integrations(browser)
        browser.close()
    print('готово', flush=True)


def test_integrations(browser):
    test_links(browser)
    test_session(browser)
    if '--stage2' not in sys.argv and '--stage2-only' not in sys.argv:
        test_board(browser)
        test_board_session(browser)


def test_motion(browser):
    ctx,page,errors=page_open(browser,'tire3d.html?scene=rim')
    page.emulate_media(reduced_motion='no-preference')
    # У SwiftShader время кадра зависит от нагрузки. Двигаем часы RAF
    # равномерно, чтобы видеть промежуточные кадры и на медленной машине.
    page.evaluate('''()=>{const raf=window.requestAnimationFrame;let time=performance.now();
      Object.defineProperty(performance,'now',{configurable:true,value:()=>time});
      window.__testRAF=cb=>raf(()=>cb(time+=130));window.__motionLengths=[];
      window.requestAnimationFrame=cb=>__testRAF(time=>{cb(time);const e=document.querySelector('[data-dimension="B"] line');if(e)__motionLengths.push(Math.hypot(e.x2.baseVal.value-e.x1.baseVal.value,e.y2.baseVal.value-e.y1.baseVal.value));});}''')
    page.locator('[data-scene="width"]').click()
    page.wait_for_function('__motionLengths.length>=4')
    lengths=page.evaluate('__motionLengths')
    check('камера плавно меняет вид между шагами',len(lengths)>=2 and max(lengths)-min(lengths)>2)
    page.evaluate('()=>{window.requestAnimationFrame=__testRAF}')
    page.evaluate('Object.defineProperty(document,"hidden",{configurable:true,value:true});document.dispatchEvent(new Event("visibilitychange"))')
    before=page.evaluate('Tire3D.debug().frameCount')
    page.evaluate('()=>{const s=Tire3D.getState();s.style="glass";Tire3D.applyState(s)}')
    page.wait_for_timeout(180)
    check('скрытая вкладка не рисуется даже при изменении состояния',before==page.evaluate('Tire3D.debug().frameCount'))
    page.evaluate('delete document.hidden;document.dispatchEvent(new Event("visibilitychange"))')
    page.wait_for_function('(n)=>Tire3D.debug().frameCount>n',arg=before)
    page.locator('[data-scene="diam"]').click()
    axes = '''() => [...document.querySelectorAll('[data-measure] > line:first-child')]
      .map(e=>['x1','y1','x2','y2'].map(k=>+e.getAttribute(k)))'''
    center = page.locator('#modelHost').evaluate('(el)=>el.clientWidth/2')
    page.wait_for_function(f'''() => {{ const a=({axes})();return a.length===4 &&
        a.slice(1).every(([x1,y1,x2])=>Math.abs(x1-{center})<.01 && Math.abs(x2-{center})<.01) &&
        Math.abs(a[0][1]-a[1][1])<.01 && Math.abs(a[0][3]-a[3][3])<.01 }}''')
    total, bottom, disk, top = page.evaluate(axes)
    guides = page.locator('[data-diameter-guide]').evaluate_all(
        "(es)=>es.map(e=>['x1','y1','x2','y2'].map(k=>+e.getAttribute(k)))")
    check('H+d+H по центру, D справа, выносные линии соединяют концы',
          all(abs(line[0]-center)<.1 for line in [bottom,disk,top]) and total[0]>center+50 and
          all(abs(a-b)<.01 for a,b in zip([bottom[1],bottom[3],disk[3],top[3]],[total[1],disk[1],top[1],total[3]])) and
          guides==[[bottom[0],bottom[1],total[0],total[1]],[top[2],top[3],total[2],total[3]]])
    page.locator('#spreadMeasures').click()
    page.wait_for_function(f'() => {{ const a=({axes})();return a[1][0]<{center}-100 }}')
    spread = page.evaluate(axes)
    check('кнопка разносит мерки по сторонам', spread[1][0]<center<spread[0][0])
    page.locator('#spreadMeasures').click()
    page.wait_for_function(f'() => {{ const a=({axes})();return Math.abs(a[1][0]-{center})<.1 }}')
    check('кнопка возвращает H+d+H на колесо, D остаётся справа',
          all(abs(a-b)<.01 for line,expected in zip(page.evaluate(axes),[total,bottom,disk,top]) for a,b in zip(line,expected)))

    page.emulate_media(reduced_motion='reduce')
    for scene,key in [('side','sideAngle'),('width','widthAngle')]:
        page.locator(f'[data-scene="{scene}"]').click()
        handles=page.locator(f'[data-drag="{key}"]')
        handles.first.wait_for()
        check(f'{scene}: ручки мерок на колесе',handles.count()==(2 if scene=='side' else 1))
        initial=page.evaluate('Tire3D.getState()')
        dot=handles.first.locator('circle').bounding_box()
        x,y=dot['x']+dot['width']/2,dot['y']+dot['height']/2
        page.mouse.move(x,y);page.mouse.down();page.mouse.move(x-70,y+55,steps=7);page.mouse.up()
        page.wait_for_function('([k,a])=>Math.abs(Tire3D.getState()[k]-a)>.1',arg=[key,initial[key]])
        changed=page.evaluate('Tire3D.getState()')
        check(f'{scene}: перетаскивание переносит мерку без движения камеры',changed['camera']==initial['camera'] and changed['tire']==initial['tire'])
        handles.first.focus();page.keyboard.press('ArrowRight')
        check(f'{scene}: стрелка клавиатуры двигает мерку, шаг прежний',page.evaluate('Tire3D.getState()')[key]!=changed[key] and page.evaluate('Tire3D.getState().step')==changed['step'])
    page.locator('[data-scene="rim"]').click()
    page.wait_for_selector('[data-face="front"]')
    page.evaluate('()=>{const s=Tire3D.getState();s.camera.position=[0,0,-1500];Tire3D.applyState(s)}')
    page.wait_for_selector('[data-face="rear"]')
    check('зелёный d виден и с лица, и с тыла',page.locator('[data-face="rear"] line').get_attribute('stroke')=='#509B4C')
    page.evaluate('()=>{const s=Tire3D.getState();s.camera.position=[1500,0,0];Tire3D.applyState(s)}')
    page.wait_for_selector('[data-face="front"]')
    check('с ребра видны обе мерки d',page.locator('[data-face]').count()==2)

    page.locator('[data-scene="run"]').click()
    page.wait_for_selector('[data-run-origin]')
    check('до оборота вся нить на колесе',page.locator('[data-dimension="D"]').count()==1 and page.locator('[data-run-wound]').count()==1 and page.locator('[data-run-thread],[data-run-length]').count()==0)
    page.emulate_media(reduced_motion='no-preference')
    page.evaluate('''()=>{window.__runFrames=[];window.__compareFrames=[];
      window.requestAnimationFrame=cb=>__testRAF(time=>{cb(time);
        const at=(s,k)=>+document.querySelector(s)?.getAttribute(k);
        if(document.querySelector('[data-run-thread]')) __runFrames.push([
          at('[data-run-thread]','x2')-at('[data-run-thread]','x1'),
          document.querySelector('[data-run-wound]')?.points.numberOfItems || 0,
          at('[data-run-mark]','cx')-at('[data-run-contact]','cx'),
          at('[data-run-mark]','cy')-at('[data-run-contact]','cy'),
          document.querySelectorAll('[data-run-piece]').length,
          at('[data-run-origin]','cx'),at('[data-run-contact]','cx'),
          at('[data-run-contact]','cx')-at('[data-dimension="D"] line','x1'),
          at('[data-run-contact]','cy')-at('[data-dimension="D"] line','y1')]);
        if(document.querySelector('[data-compare-guide]')) __compareFrames.push([
          Math.abs(at('[data-compare-guide]','x2')-at('[data-compare-guide]','x1')),
          !!document.querySelector('[data-compare-label]')]);
      });}''')
    page.locator('#playDemo').click()
    page.wait_for_selector('[data-run-piece="4"]',state='attached')
    frames=page.evaluate('__runFrames')
    end=frames[-1]
    wound_frames=[f for f in frames if f[1]]
    check('размотанная нить растёт, дуга на колесе укорачивается',
          len(wound_frames)>1 and wound_frames[0][0]<wound_frames[-1][0]<end[0] and wound_frames[0][1]>wound_frames[-1][1] and end[1]==0)
    check('колесо движется вперёд, нить начинается на месте и доходит до точки касания',
          end[6]>frames[0][6]+100 and all(abs(f[5]-end[5])<.1 and abs(f[6]-f[5]-f[0])<.1 and
          abs(f[7])<.1 and abs(f[8])<.1 for f in frames))
    check('отмеченный конец возвращается к касательной после оборота',
          any(abs(f[3])>20 for f in wound_frames) and abs(end[2])<.1 and abs(end[3])<.1)
    lengths=page.locator('[data-run-piece]').evaluate_all('(es)=>es.map(e=>Number(e.dataset.lengthMm))')
    diameter=page.evaluate('Tire3D.metrics().D')
    check('после оборота по очереди видны три D и остаток (π−3)D',
          {f[4] for f in frames if not f[1]}=={0,1,2,3,4} and lengths[:3]==[diameter]*3 and
          abs(sum(lengths)/diameter-math.pi)<1e-12 and page.locator('[data-run-length]').text_content()=='πD' and
          page.locator('[data-run-piece-label]').all_text_contents()==['D','D','D','≈ 0,14D'])
    page.locator('[data-scene="compare"]').click()
    page.wait_for_selector('[data-compare-label]')
    guides=page.evaluate('__compareFrames')
    check('сравнение: общая опора, отметки сходятся и появляется разница',
          page.locator('[data-compare-ground]').count()==1 and page.locator('[data-compare-guide]').count()==2 and page.locator('[data-compare-gap]').count()==1 and
          any(0 < width < guides[-1][0]*.85 and not done for width,done in guides) and guides[-1][1])
    page.evaluate('()=>{window.requestAnimationFrame=__testRAF}')
    page.locator('#allDimensions').check()
    page.locator('[data-scene="side"]').click()
    page.wait_for_timeout(700)
    page.locator('#themeToggle').click()
    page.wait_for_timeout(100)
    check('тёмная тема сохраняет все размеры',page.evaluate('document.documentElement.dataset.theme')=='dark' and page.locator('#sizeReadout b').count()==4)
    SHOTS.mkdir(parents=True,exist_ok=True)
    page.screenshot(path=str(SHOTS/'all-dimensions-dark.png'),full_page=True)
    check('анимация и скрытая вкладка без ошибок JS',not errors)
    ctx.close()


def test_links(browser):
    ctx,page,errors=page_open(browser,'oge1_5.html?all=1')
    page.wait_for_function('typeof enterTaskset === "function"')
    for group,prefix in [('tire_demo2027','tire0_t'),('tire_set1','tire1_t'),('tire_fipi','tirefipi_t')]:
        page.evaluate('(id)=>enterTaskset(GROUPS.flatMap(g=>g.modes).find(m=>m.id===id))',group)
        for i,sc in enumerate(['width','side','diam','compare','run'],1):
            page.evaluate('(id)=>{setCurMode(id);openTask()}',prefix+str(i))
            data=page.evaluate('({task:curTask, state:tsGetState(), theory:document.getElementById("tire3dTheoryLink").getAttribute("href"), link:document.getElementById("tire3dSolutionLink").getAttribute("href")})')
            model=data['task']['tireModel'];q=parse_qs(urlparse(data['link']).query)
            assert q['scene']==[sc] and [int(q[k][0]) for k in ['w','p','r']]==list(model['tire'].values()),(group,i,q,model)
            values=page.evaluate('(m)=>({v:TireMath.values(m.tire),c:m.tire2?TireMath.compare(m.tire,m.tire2):null})',model)
            expected=[values['v']['B'],values['v']['H'],values['v']['D'],None,None][i-1]
            if i==4: expected=values['c']['diff100']/(200 if model.get('measure')=='radius' else 100)
            if i==5: expected=values['c']['percent10']/10
            assert expected==data['task']['correctValue'],(group,i,expected,data['task']['correctValue'])
            if i>=3 and group!='tire_demo2027':
                assert model['tire']==data['task']['factoryTire']
            assert data['theory'] and 'scene=width' in data['theory']
        check('ссылки и числа всех пяти заданий: '+group,True)
    page.evaluate("switchSubMode('practice')")
    page.locator('#showSolutionBtn').click()
    check('ссылка рядом с решением видна',page.locator('#tire3dSolutionLink').is_visible())
    with page.expect_navigation():
        page.locator('#tire3dSolutionLink').click()
    page.evaluate('()=>Tire3D.ready')
    check('кнопка открывает именно выбранный сценарий',page.evaluate('Tire3D.getState().scene')=='run')
    page.goto(BASE+'/index.html')
    page.wait_for_timeout(200)
    # Вкладка ОГЭ может быть не выбрана: проверяем построение той же строки каталога.
    check('ссылка на главной у №1–5',page.evaluate('itemHTML(TRAINERS.oge1_5,0,0).includes("tire3d.html")'))
    check('интеграция ссылок без ошибок JS',not errors);ctx.close()


def test_session(browser):
    import test_prompt54_trainer_sync_and_cards as fake
    ctx=browser.new_context(viewport={'width':1280,'height':1000},reduced_motion='reduce')
    errors=[]
    leader=fake.new_page(ctx,errors)
    leader.goto(BASE+'/tire3d.html?w=195&p=65&r=15&scene=side')
    leader.evaluate('()=>Tire3D.ready')
    leader.wait_for_function('window.TrainerSession && TrainerSession.getCode().length===8')
    code=leader.evaluate('TrainerSession.getCode()')
    follower=fake.new_page(ctx,errors)
    follower.goto(BASE+'/tire3d.html?s='+code)
    follower.evaluate('()=>Tire3D.ready')
    follower.wait_for_function('TrainerSession.isLeader()===false')
    leader.locator('[data-scene="diam"]').click()
    follower.wait_for_function('Tire3D.getState().scene==="diam"')
    leader.locator('#nextStep').click()
    follower.wait_for_function('Tire3D.getState().step===1')
    check('сессия на заглушке: сценарий и шаг',True)
    leader.locator('#spreadMeasures').click()
    follower.wait_for_function('Tire3D.getState().spread')
    check('ученик видит разнесённые мерки D',follower.locator('#spreadMeasures').get_attribute('aria-pressed')=='true')
    leader.locator('[data-mode="interactive"]').click()
    follower.wait_for_function('document.getElementById("tireLesson").hidden')
    leader.locator('#solutionToggle').click()
    follower.wait_for_function('document.documentElement.dataset.tireSolution==="open"')
    check('ученик видит раскрытие решения рядом с моделью',follower.locator('#tireLesson').is_visible())
    leader.locator('#formulas .formula').nth(1).click()
    follower.wait_for_function('Tire3D.getState().formulaRow===1')
    check('выбранная строка решения передаётся ученику',follower.locator('#formulas .formula').nth(1).get_attribute('aria-pressed')=='true')
    leader.evaluate('TrainerSession.setPermission("board",false)')
    follower.wait_for_function('TrainerSession.studentRestricted("board")')
    before=follower.evaluate('Tire3D.getState()')
    follower.locator('[data-scene="width"]').click()
    box=follower.locator('#modelHost').bounding_box()
    follower.mouse.move(box['x']+box['width']*.5,box['y']+box['height']*.5)
    follower.mouse.down();follower.mouse.move(box['x']+box['width']*.7,box['y']+box['height']*.6,steps=8);follower.mouse.up()
    check('наблюдатель не сбивает сценарий и камеру',before==follower.evaluate('Tire3D.getState()'))
    leader.evaluate('window.__cameraPackets=0; const original=TrainerSession.broadcastEvent;TrainerSession.broadcastEvent=(name,data)=>{if(name==="tire3d-camera")window.__cameraPackets++;return original(name,data)}')
    box=leader.locator('#modelHost').bounding_box()
    leader.mouse.move(box['x']+box['width']*.5,box['y']+box['height']*.55);leader.mouse.down()
    t0=time.monotonic()
    for i in range(15):
        leader.mouse.move(box['x']+box['width']*(.5+i*.012),box['y']+box['height']*.55)
        leader.wait_for_timeout(30)
    leader.mouse.up()
    follower.wait_for_timeout(350)
    packets=leader.evaluate('__cameraPackets')
    check('камера не чаще 10 раз/с',0<packets<=int((time.monotonic()-t0)*10)+2)
    a,b=leader.evaluate('Tire3D.getState().camera'),follower.evaluate('Tire3D.getState().camera')
    check('камера учителя дошла до ученика',all(abs(a[k][i]-b[k][i])<.01 for k in a for i in range(3)))
    leader.evaluate('TrainerSession.setPermission("board",true)')
    follower.wait_for_function('!TrainerSession.studentRestricted("board")')
    follower.locator('[data-scene="rim"]').click()
    leader.wait_for_function('Tire3D.getState().scene==="rim"')
    check('ученик управляет после разрешения',True)
    current=leader.evaluate('Tire3D.versionedState()')
    leader.evaluate('(s)=>Tire3D.applyFromPeer({...s,scene:"width",__tsRev:-99})',current)
    check('старый снимок не откатывает модель',leader.evaluate('Tire3D.getState().scene')=='rim')
    check('сессия без ошибок JS',not errors)
    ctx.close()


def test_board(browser):
    import test_prompt66_board_live_tasks as old
    old.BASE=BASE
    ctx=browser.new_context(viewport={'width':1400,'height':1000},reduced_motion='reduce')
    page,errors=old.open_board(ctx)
    page.wait_for_function('!!window.BoardTire3D')
    # Существующий тип изображения и фигура остаются обычными объектами.
    page.evaluate('B.objects.push({id:"legacy",type:"line",points:[{x:0,y:0},{x:100,y:100}],color:"#004C99",width:2});saveDB()')
    before=page.evaluate('JSON.stringify(B.objects.find(o=>o.id==="legacy"))')
    page.locator('#bdAddTire3D').click()
    page.wait_for_function('B.objects.filter(o=>o.tire3d).length===1 && BoardTire3D.activeId()')
    first=page.evaluate('BoardTire3D.activeId()')
    iframe=page.frame_locator('.bd-tire-frame')
    iframe.locator('[data-scene="side"]').click()
    iframe.locator('#nextStep').click()
    iframe.locator('[data-style="glass"]').click()
    iframe.locator('[data-mode="interactive"]').click()
    page.evaluate('''()=>window.addEventListener('message', e=>{
      if(e.source===document.querySelector('.bd-tire-frame')?.contentWindow && e.data?.source==='mathh-tire3d' &&
         e.data.state?.showSolution && e.data.png) window.__solutionSnapshot=e.data.png;
    })''')
    iframe.locator('#solutionToggle').click()
    page.wait_for_function('(id)=>{const s=B.objects.find(o=>o.id===id).tire3d.state;return s.scene==="side" && s.step===1 && s.style==="glass" && s.mode==="interactive" && s.showSolution}',arg=first)
    check('кнопка панели вставила элемент, изменения iframe сохраняются',True)
    page.wait_for_function('(id)=>window.__solutionSnapshot && B.objects.find(o=>o.id===id).src===window.__solutionSnapshot',arg=first,timeout=30000)
    check('PNG обновился после изменения модели',True)
    saved=page.evaluate('(id)=>JSON.parse(JSON.stringify(B.objects.find(o=>o.id===id).tire3d.state))',first)
    # Перемещение и изменение размера — существующие ручки image, поля
    # x/y/w/h и снимок не зависят от наличия активного iframe.
    page.evaluate('BoardTire3D.close()')
    handles=page.evaluate('(id)=>{const o=B.objects.find(o=>o.id===id);return getHandles(o).length}',first)
    check('элемент имеет стандартные ручки картинки',handles>=4)
    page.evaluate('(id)=>{const o=B.objects.find(o=>o.id===id);o.points[0].x+=60;o.w=820;o.h=610;saveDB();scheduleRedraw()}',first)
    page.evaluate('()=>idbSaveDB()')
    page.reload();page.evaluate(old.BOOT_JS)
    page.evaluate('()=>openBoard("bA")')
    page.wait_for_function('(id)=>B&&B.objects&&B.objects.some(o=>o.id===id)',arg=first)
    check('состояние модели пережило перезагрузку',saved==page.evaluate('(id)=>B.objects.find(o=>o.id===id).tire3d.state',first))
    check('размер пережил перезагрузку',page.evaluate('(id)=>B.objects.find(o=>o.id===id).w',first)==820)
    check('старый объект не изменился',before==page.evaluate('JSON.stringify(B.objects.find(o=>o.id==="legacy"))'))
    second=page.evaluate('()=>BoardTire3D.insert()')
    # Разводим изображения, чтобы кнопки и кадры не закрывали друг друга.
    page.evaluate('([a,b])=>{const o=B.objects.find(o=>o.id===b);const p=B.objects.find(o=>o.id===a);o.points[0].x=p.points[0].x+p.w+40;cam.zoom=.55;saveDB();scheduleRedraw()}',[first,second])
    page.evaluate('(id)=>BoardTire3D.activate(id)',first)
    page.wait_for_selector('.bd-tire-frame')
    page.frame_locator('.bd-tire-frame').locator('#nextStep').wait_for()
    check('после перезагрузки интерактив открывается с решением',page.frame_locator('.bd-tire-frame').locator('#solutionToggle').get_attribute('aria-expanded')=='true')
    old_frame=page.locator('.bd-tire-frame').element_handle()
    page.evaluate('window.__oldTireAPI=document.querySelector(".bd-tire-frame").contentWindow.Tire3D')
    page.evaluate('(id)=>BoardTire3D.activate(id)',second)
    page.wait_for_function('(id)=>BoardTire3D.activeId()===id',arg=second)
    check('два элемента — ровно один живой iframe',page.locator('.bd-tire-frame').count()==1)
    check('предыдущий iframe удалён',old_frame.evaluate('(e)=>!e.isConnected'))
    check('предыдущий WebGL освобождён',page.evaluate('!__oldTireAPI.debug().webgl'))
    page.frame_locator('.bd-tire-frame').locator('[data-scene="diam"]').click()
    page.wait_for_function('(id)=>B.objects.find(o=>o.id===id).tire3d.state.scene==="diam"',arg=second)
    page.evaluate('setBoardAccess("view")')
    page.wait_for_timeout(100)
    readonly=page.evaluate('(id)=>JSON.stringify(B.objects.find(o=>o.id===id).tire3d.state)',second)
    page.frame_locator('.bd-tire-frame').locator('[data-scene="width"]').click()
    page.wait_for_timeout(150)
    check('просмотр общей доски не меняет модель',readonly==page.evaluate('(id)=>JSON.stringify(B.objects.find(o=>o.id===id).tire3d.state)',second))
    page.evaluate('setBoardAccess("full")')
    # Стандартный экспорт получает PNG как у любой картинки, без живого WebGL.
    check('элемент совместим с экспортом изображения',page.evaluate('(id)=>{const o=B.objects.find(o=>o.id===id);return o.type==="image"&&o.src.startsWith("data:image/png;base64,")}',second))
    page.evaluate('backToList()')
    page.wait_for_function('!BoardTire3D.activeId()')
    check('выход с доски освобождает WebGL',page.locator('.bd-tire-frame').count()==0)
    check('доска без ошибок JS',not errors)
    # Путь с самой страницы: переносится снимок, включая произвольную камеру.
    page.route('**/supabase-config.js',lambda route:route.fulfill(status=200,content_type='application/javascript',body='window.SUPABASE_CONFIG={};'))
    page.goto(BASE+'/tire3d.html?w=195&p=65&r=15&scene=side&step=2&style=glass&mode=interactive&solution=1')
    page.evaluate('()=>Tire3D.ready')
    payload=page.evaluate('Tire3D.getState()')
    with page.expect_navigation():page.locator('#addBoard').click()
    page.evaluate(old.BOOT_JS);page.evaluate('()=>openBoard("bA")')
    page.wait_for_function('B&&B.objects&&B.objects.filter(o=>o.tire3d).length===3')
    imported=page.evaluate('B.objects.filter(o=>o.tire3d).at(-1).tire3d.state')
    check('«Добавить на доску» переносит полный снимок страницы',imported==payload)
    ctx.close()


def test_board_session(browser):
    import test_prompt66_board_live_tasks as old
    import test_prompt54_trainer_sync_and_cards as fake
    ctx=browser.new_context(viewport={'width':1400,'height':1000},reduced_motion='reduce')
    errors=[]
    teacher=fake.new_page(ctx,errors)
    teacher.goto(BASE+'/boards.html')
    teacher.evaluate(old.SEED_JS,[[old.LITE],{'bA':{'objects':[],'imageLib':[]}}])
    teacher.reload();teacher.evaluate(old.BOOT_JS)
    teacher.wait_for_function('TrainerSession.getCode().length===8')
    teacher.evaluate('()=>openBoard("bA")')
    teacher.wait_for_function('B&&B.objects&&boardsViewCenter()')
    code=teacher.evaluate('TrainerSession.getCode()')
    student=fake.new_page(ctx,errors)
    student.goto(BASE+'/boards.html?s='+code)
    student.wait_for_function('window.__boardViewer && boardActive')
    model=teacher.evaluate('()=>BoardTire3D.insert()')
    student.wait_for_function('(id)=>B&&B.objects.some(o=>o.id===id&&o.tire3d)',arg=model)
    check('совместная доска: элемент приходит стандартной разницей',True)
    teacher.evaluate('(id)=>BoardTire3D.activate(id)',model)
    teacher.frame_locator('.bd-tire-frame').locator('[data-scene="side"]').click()
    teacher.frame_locator('.bd-tire-frame').locator('#nextStep').click()
    student.wait_for_function('(id)=>{const o=B.objects.find(o=>o.id===id);return o&&o.tire3d.state.scene==="side"&&o.tire3d.state.step===1}',arg=model)
    student.wait_for_selector('.bd-tire-frame')
    student.frame_locator('.bd-tire-frame').locator('[data-scene="side"][aria-pressed="true"]').wait_for()
    check('совместная доска: ученик видит живую модель и тот же шаг',True)
    count=student.evaluate('B.objects.length')
    student.frame_locator('.bd-tire-frame').locator('[data-scene="diam"]').click()
    student.wait_for_timeout(100)
    check('наблюдатель доски не меняет состояние модели',student.evaluate('B.objects.find(o=>o.tire3d).tire3d.state.scene')=='side' and student.evaluate('B.objects.length')==count)
    SHOTS.mkdir(parents=True,exist_ok=True)
    teacher.screenshot(path=str(SHOTS/'board-desktop.png'),full_page=True)
    teacher.evaluate('backToList()')
    student.wait_for_function('!boardActive')
    student.wait_for_function('!BoardTire3D.activeId()')
    check('при выходе учителя WebGL освобождается и у ученика',student.locator('.bd-tire-frame').count()==0)
    check('совместная доска без ошибок JS',not errors)
    ctx.close()


if __name__=='__main__':
    main()
