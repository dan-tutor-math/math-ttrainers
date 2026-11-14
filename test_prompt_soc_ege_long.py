"""ЕГЭ обществознание №17–25: условия, требования, тексты и критерии без образцов.
Запуск: ~/.venvs/trainers/bin/python test_prompt_soc_ege_long.py.
"""
import hashlib
import html
import json
from pathlib import Path
import re
import subprocess
import sys

from playwright.sync_api import sync_playwright
import test_prompt54_trainer_sync_and_cards as t54
import test_prompt_panel_subjects as panel
sys.path.insert(0,str(Path(__file__).resolve().parent/'tools'))
import soc_ege_long_export as export

HERE=Path(__file__).resolve().parent
DATA=HERE.parent/'fipi-pilot/full_ege_soc'
COUNTS={17:79,18:23,19:103,20:126,21:38,22:58,23:36,24:46,25:35}
POINTS={17:2,18:2,19:3,20:3,21:3,22:4,23:3,24:4,25:6}
BASE='http://127.0.0.1:8998'
SHOTS=HERE/'.impeccable/review'


def traps():
    cases=[
      ('Какие изменения произошли в XX в.? Что изменилось в XXI в.?',2,['XX в.?','XXI в.?']),
      ('Д.С. Лихачёв писал: «Культура объединяет людей». Подтвердите эту мысль двумя примерами.',1,['Д.С. Лихачёв']),
      ('В объявлении сказано: «Ищете работу? Звоните!» Какой вид безработицы описан?',1,['Какой вид']),
      ('Назовите формы участия. (Укажите любые две формы.)',1,['(Укажите любые две формы.)']),
      ('Составьте план. Для этого выделите основные фрагменты текста.',1,['Для этого']),
      ('Объясните значение семьи для а) человека и б) общества.',1,['а) человека и б) общества']),
      ('1) Обоснуйте утверждение. (Ответ — в нескольких предложениях.) 2) Назовите три вида. 3) Приведите три примера.',3,['1)','2)','3)']),
      ('Составьте сложный план. Сложный план должен содержать три пункта. (Укажите подпункты.)',1,['три пункта','подпункты']),
      ('Предложение выросло. (На графике P — цена; Q — количество.) Как изменилась равновесная цена?',1,['Как изменилась']),
    ]
    for text,count,parts in cases:
        got=export.requirements(text)
        assert len(got)==count and all(p in ' '.join(got) for p in parts),(text,got)
        if 'В объявлении' in text:assert 'Звоните' not in ' '.join(got)
    print('A: 9 ловушек нарезки из «Грабель», включая нумерацию №25 — OK',flush=True)


def settle(page):
    page.wait_for_function('() => !!window.__examNav && !__fipiBusy()')


def activate(page,n,pid=None):
    page.evaluate('''async x=>{await new Promise(r=>ensureFipi(x.n,r));openTask(x.n,x.id||protos(x.n)[0].id);}''',{'n':n,'id':pid})
    page.wait_for_function('n=>S.n===n&&!!S.pid&&!__fipiBusy()',arg=n)


def main():
    traps()
    raw=json.loads((DATA/'tasks.json').read_text())
    texts=json.loads((DATA/'texts.json').read_text())
    ts={t['id']:t for t in raw if t['num27'] in COUNTS}
    # Реальные задания: инициалы и скобки; перечисление а)/б); три требования №25.
    r=export.requirements(ts['CCEE18']['stem'])
    assert len(r)==4 and '(Укажите любые три других налога/сбора этого вида.)' in r[2]
    assert all('К.Л.' not in x and '13%' not in x for x in r)
    r=export.requirements(ts['CE94FE']['stem'])
    assert len(r)==1 and all(x in r[0] for x in ('а)','б)','в)','каждого из этих'))
    r=export.requirements(ts['42C7AA']['stem'])
    assert len(r)==3 and all(r[i].startswith(str(i+1)+')') for i in range(3))
    hashes={p:hashlib.sha256((DATA/p).read_bytes()).hexdigest() for p in ('tasks.json','texts.json','verify.json')}
    subprocess.run([sys.executable,'tools/soc_ege_long_export.py','--check'],cwd=HERE,check=True)
    subprocess.run([sys.executable,'sync_ege_pages.py','--check'],cwd=HERE,check=True)
    export.core.IMG='soc-ege-long-img'
    t54.PORT=8998
    errors=[]
    with t54.local_server(),sync_playwright() as pw:
        browser=pw.chromium.launch()
        ctx=browser.new_context(viewport={'width':1440,'height':1000})
        page=t54.new_page(ctx,errors)
        page.route('https://**/*',lambda r:r.abort())
        page.goto(BASE+'/index.html?subject=soc')
        page.locator('.nav-subtab[data-id="ege"]').click()
        links=page.locator('a[href^="soc_ege_long.html?n="]')
        assert links.count()==9
        links.first.click();settle(page)
        dump=page.evaluate('''async nums=>{const out={};for(const n of nums){await new Promise(r=>ensureFipi(n,r));out[n]={points:task(n).points,protos:protos(n)};}return out;}''',list(COUNTS))
        seen,images,used=set(),set(),set()
        for n,count in COUNTS.items():
            ps=dump[str(n)]['protos']
            assert len(ps)==len({p['id'] for p in ps})==count,(n,len(ps))
            assert dump[str(n)]['points']==POINTS[n]
            for p in ps:
                tid=p['id'];t=ts[tid]
                assert t['num27']==n and p['fipi']==tid and p['proof'] and p['s']=='',tid
                q=export.core.clean(t['stem_html']);r=export.requirements(t['stem'])
                assert p['q']==q and q in p['text'] and p['r']==r and r,tid
                rendered=html.unescape(' '.join(p['steps']))
                assert all(req in rendered for req in r),tid
                assert 'soc-sample' not in rendered and 'Образец ответа' not in rendered
                assert p['h']==int(t['conf27']=='heur')
                assert p['criteria']==export.criteria(n),tid
                assert not any(x in p['text'] for x in ('<script','ShowPicture','files_location','MsoNormal','$')),tid
                paths=list(t['images'])
                if t.get('text_id'):
                    x=texts[t['text_id']]
                    assert p['t']==t['text_id'] and export.core.clean(x['html']).replace('<p>Прочитайте текст и выполните задания.</p>','') in p['text'],tid
                    used.add(t['text_id']);paths+=x['images']
                    if n in (24,25):assert 'Тема доклада' in p['text'] and 'Вам необходимо подготовить доклад' in html.unescape(re.sub('<[^>]+>',' ',p['text']))
                for path in paths:
                    name='soc-ege-long-img/'+Path(path).name
                    assert name in p['text'] and (HERE/name).read_bytes()==(DATA/'media'/path).read_bytes(),tid
                    images.add(name)
                seen.add(tid)
        assert seen==set(ts) and len(seen)==544
        assert len(used)==len(texts)==114
        assert sum(p['h'] for d in dump.values() for p in d['protos'])==310
        assert page.evaluate('SOC_EGE_LONG_FIPI.criteriaSource.sha256')==export.DEMO_SHA256
        assert all(page.evaluate('''async paths=>Promise.all(paths.map(src=>new Promise(resolve=>{const i=new Image();i.onload=()=>resolve(i.naturalWidth>0);i.onerror=()=>resolve(false);i.src=src;})))''',sorted(images)))
        print(f'B: 9 номеров, 544 условия/требования, 114 общих текстов, {len(images)} рисунков; s пусто — OK',flush=True)

        for n in COUNTS:
            pid=dump[str(n)]['protos'][0]['id']
            activate(page,n,pid)
            draft=page.locator('#answerArea .proof-draft')
            draft.fill('Проверочный черновик №'+str(n))
            totals=page.evaluate('[totalSolved,totalErrors]')
            page.locator('#answerArea .check-btn').click()
            assert page.locator('#critBox').is_visible(),n
            assert page.locator('#solSteps .soc-req').count()==len(ts[pid] and export.requirements(ts[pid]['stem']))
            assert page.evaluate('[totalSolved,totalErrors]')==totals
            assert page.locator('.proof-score-btn').count()==POINTS[n]+1
            page.locator(f'.proof-score-btn[data-b="{POINTS[n]}"]').click()
            assert 'Оценка сохранена' in page.locator('.proof-score-saved').inner_text()
        pid=dump['25']['protos'][0]['id']
        page.goto(BASE+f'/soc_ege_long.html?n=25&t={pid}');settle(page)
        page.wait_for_function('id=>S.n===25&&S.pid===id&&!__fipiBusy()',arg=pid)
        assert page.locator('.proof-draft').input_value()=='Проверочный черновик №25',page.evaluate('({pid:S.pid,draft:document.querySelector(".proof-draft").value,saved:localStorage.getItem(DRAFT_PREFIX+S.pid)})')
        assert page.locator('#critBox').is_visible()
        crit=page.locator('#critTable').inner_text()
        assert all(s in crit for s in ('25.1','25.2','25.3','6 баллов','одно предложение','дополнительных'))
        activate(page,24)
        if not page.evaluate('S.answered'):page.locator('#answerArea .check-btn').click()
        crit=page.locator('#critTable').inner_text()
        assert all(s in crit for s in ('24.1','24.2','только при 3 баллах','не менее трёх','4 балла'))
        print('C: критерии 2027, пределы баллов, черновик и самооценка всех 9 номеров — OK',flush=True)

        # У общего текста переход внутри части 2 сохраняет привязку к группе.
        common=next(tid for tid in used if any(p.get('t')==tid for p in dump['17']['protos']) and any(p.get('t')==tid for p in dump['18']['protos']))
        pid=next(p['id'] for p in dump['17']['protos'] if p.get('t')==common)
        activate(page,17,pid)
        page.locator('#examNextBtn').click()
        page.wait_for_function('() => S.n===18 && !!S.pid && !__fipiBusy()')
        assert page.evaluate('curProto.t')==common
        page.locator('.exam-nav-text').click()
        page.locator('.exam-jump-number[data-trainer="soce25"]').wait_for(state='visible')
        assert page.locator('.exam-jump-number').count()==25
        page.keyboard.press('Escape')
        page.goto(BASE+'/soc_ege.html?n=16');settle(page)
        page.locator('#examNextBtn').click()
        page.wait_for_url('**/soc_ege_long.html?n=17*');settle(page)
        page.locator('#examPrevBtn').click()
        page.wait_for_url('**/soc_ege.html?n=16*');settle(page)
        page.goto(BASE+'/soc_ege_long.html?n=21');settle(page)
        activate(page,21)
        print('D: каталог, все 25 номеров меню, переход между частями и общий текст — OK',flush=True)

        for width in (375,1440):
            page.set_viewport_size({'width':width,'height':1000})
            for theme in ('light','dark'):
                page.evaluate('t=>document.documentElement.dataset.theme=t',theme)
                for n in COUNTS:
                    activate(page,n)
                    bad=page.evaluate('''ps=>{const e=document.querySelector('#questionText'),saved=e.innerHTML,bad=[];for(const p of ps){e.innerHTML=p.text;if(document.documentElement.scrollWidth>innerWidth+1)bad.push(p.id);}e.innerHTML=saved;return bad;}''',dump[str(n)]['protos'])
                    assert not bad,(width,theme,n,bad[:4])
                activate(page,21)
                page.wait_for_function("() => [...document.querySelectorAll('#questionText img')].every(i=>i.complete&&i.naturalWidth>0)")
                page.evaluate('scrollTo(0,0)');page.wait_for_timeout(1800)
                page.screenshot(path=str(SHOTS/f'soc-ege-long-{width}-{theme}.png'),full_page=True,animations='disabled')
                activate(page,24)
                if not page.evaluate('S.answered'):page.locator('#answerArea .check-btn').click()
                assert page.evaluate('document.documentElement.scrollWidth<=innerWidth+1')
                page.locator('#critBox').screenshot(path=str(SHOTS/f'soc-ege-long-criteria-{width}-{theme}.png'),animations='disabled',style='button,a,canvas{visibility:hidden!important}')
        # В панели развёрнутый ответ вставляется снимком — общей проверке нечего сверять.
        panel.BASE=BASE
        bc,bp,be=panel.open_board(browser,local={'ttPanel:subject':'soc'})
        panel.open_trainer(bp,'soce21','soc_ege_long.html?n=21','openTask(21,protos(21)[0].id)')
        obj=panel.add_to_board(bp,0)
        assert obj['src'] and not obj['task'],obj
        assert not be,be
        bc.close()
        assert not errors,errors
        ctx.close();browser.close()
    assert hashes=={p:hashlib.sha256((DATA/p).read_bytes()).hexdigest() for p in hashes}
    print('E: все 544 задания на 375/1440 px в обеих темах, рисунки и снимок на доску — OK')
    print('Готово: ЕГЭ обществознание, часть 2.')


if __name__=='__main__':main()
