"""ЕГЭ обществознание, часть 1: 1134 ключа ФИПИ, меню, ответы, медиа и доска.
Запуск: ~/.venvs/trainers/bin/python test_prompt_soc_ege.py. Realtime — заглушка.
"""
import collections
import hashlib
import json
from pathlib import Path
import re
import subprocess
import sys

from playwright.sync_api import sync_playwright
import test_prompt54_trainer_sync_and_cards as t54
import test_prompt_panel_subjects as panel

HERE = Path(__file__).resolve().parent
DATA = HERE.parent / 'fipi-pilot/full_ege_soc'
COUNTS = {1:85, 2:59, 3:60, 4:63, 5:76, 6:63, 7:141, 8:62,
          9:102, 10:63, 11:58, 12:84, 13:54, 14:54, 15:60, 16:50}
PORT = 8997
BASE = f'http://127.0.0.1:{PORT}'
SHOTS = HERE / '.impeccable/review'


def fresh(browser, errors, width=1440):
    ctx = browser.new_context(viewport={'width':width, 'height':1000})
    page = t54.new_page(ctx, errors)
    page.route('https://**/*', lambda r: r.abort())
    return ctx, page


def settle(page):
    page.wait_for_function('() => !!window.__examNav && !__fipiBusy()')


def open_task(page, n, pid=None):
    page.goto(f'{BASE}/soc_ege.html?n={n}' + (f'&t={pid}' if pid else ''))
    settle(page)
    if not pid:
        page.evaluate('n=>openTask(n,protos(n)[0].id)',n)
    page.locator('#answerArea .answer-input').wait_for(state='visible')


def all_data(page, nums=range(1,17)):
    return page.evaluate('''async nums => {
      const out = {};
      for (const n of nums) {
        await new Promise(r=>ensureFipi(n,r));
        out[n] = {points:task(n).points, groups:task(n).groups, protos:protos(n).map(p=>({
          ...p, passes:checkField(p.fields[0],p.fields[0].value,{yn:{}})===true
        }))};
      }
      return out;
    }''', list(nums))


def main():
    raw = json.loads((DATA/'tasks.json').read_text())
    verify = json.loads((DATA/'verify.json').read_text())
    source = {t['id']:t for t in raw if t.get('num27') in COUNTS}
    before = {p:hashlib.sha256((DATA/p).read_bytes()).hexdigest() for p in ('tasks.json','texts.json','verify.json')}
    subprocess.run([sys.executable, 'tools/soc_ege_export.py', '--check'], cwd=HERE, check=True)
    subprocess.run([sys.executable, 'sync_ege_pages.py', '--check'], cwd=HERE, check=True)
    t54.PORT = PORT
    errors = []
    SHOTS.mkdir(parents=True, exist_ok=True)
    with t54.local_server(), sync_playwright() as pw:
        browser = pw.chromium.launch()
        ctx, page = fresh(browser, errors)
        page.goto(BASE+'/index.html?subject=soc')
        page.locator('.nav-subtab[data-id="ege"]').click()
        links = page.locator('a[href^="soc_ege.html?n="]')
        assert links.count() == 16, links.count()
        links.first.click()
        settle(page)
        dump = all_data(page)
        seen, images = set(), set()
        for n,count in COUNTS.items():
            ps = dump[str(n)]['protos']
            assert len(ps) == count and len({p['id'] for p in ps}) == count, n
            assert dump[str(n)]['points'] == (1 if n in (1,3,9,12) else 2)
            for p in ps:
                tid = p['id']; t = source[tid]
                assert t['num27'] == n and p['fipi'] == tid and p['ok'] == 1
                assert p['fields'][0]['value'] == str(verify[tid]['ok']) and p['passes'], tid
                assert p['h'] == int(t['conf27']=='heur'), tid
                assert not any(s in p['text'] for s in ('<script', 'ShowPicture', 'MsoNormal', 'files_location', '$')), tid
                assert p['fields'][0]['anyOrder'] == (t['input'] != 'select')
                assert p['text'].count('class="soc-opt"') == len(t['variants']), tid
                for path in t.get('images', []):
                    name = 'soc-ege-img/'+Path(path).name
                    assert name in p['text'], tid
                    assert (HERE/name).read_bytes() == (DATA/'media'/path).read_bytes(), name
                    images.add(name)
                seen.add(tid)
        assert seen == set(source) == set(verify) and len(seen) == 1134
        assert sum(p['h'] for d in dump.values() for p in d['protos']) == 400
        assert not any(t.get('text_id') for t in source.values()), 'Общие тексты части 1 требуют подключения'
        loaded = page.evaluate('''async paths=>Promise.all(paths.map(src=>new Promise(resolve=>{
          const img=new Image(); img.onload=()=>resolve(img.naturalWidth>0);img.onerror=()=>resolve(false);img.src=src;
        })))''', sorted(images))
        assert all(loaded), 'Не все рисунки загрузились'
        print(f'A: 16 номеров, 1134 принятых ключа, 400 флагов h, {len(images)} рисунков — OK', flush=True)

        for n in (1,2,3):
            open_task(page,n)
            key = page.evaluate('curProto.fields[0].value')
            wrong = ('9' if key[0]!='9' else '8') + key[1:]
            page.fill('#answerArea .answer-input', wrong)
            page.click('#answerArea .check-btn')
            assert page.evaluate('S.hadWrong && !S.correct'), n
            open_task(page,n)
            page.fill('#answerArea .answer-input', key)
            page.click('#answerArea .check-btn')
            assert page.evaluate('S.correct && S.answered'), n
        print('B: выбор, соответствие и последовательность: верный/неверный ответы — OK', flush=True)

        page.locator('.exam-nav-text').click()
        page.locator('.exam-jump-number[data-trainer="soce16"]').wait_for(state='visible')
        assert page.locator('[data-exam-id="ege"][aria-pressed="true"]').count() == 1
        assert page.locator('.exam-jump-number').count() == 16
        page.locator('.exam-jump-number[data-trainer="soce16"]').click()
        page.locator('#examJumpTypes [data-type]').first.click()
        page.wait_for_function('() => __examNav.n() === 16 && __examNav.pid()')
        assert page.url.split('?')[0].endswith('/soc_ege.html')
        print('C: главная, общее меню номеров/типов и переход к №16 — OK', flush=True)

        # Штатный мост переносит задание, результат и рисунок доски.
        open_task(page,3)
        page.fill('#answerArea .answer-input', page.evaluate('curProto.fields[0].value'))
        page.click('#answerArea .check-btn')
        assert page.locator('#boardToolbar').count()==1
        if page.evaluate('document.documentElement.dataset.board!=="on"'):
            page.locator('#boardVisibilityToggle').click()
        canvas = page.locator('#boardCanvas')
        canvas.wait_for(state='visible')
        page.mouse.move(20,400)
        page.mouse.down()
        page.mouse.move(100,450,steps=8)
        page.mouse.up()
        snapshot = page.evaluate('tsGetState()')
        assert snapshot['egeN']==3 and snapshot['answered'] and snapshot['correct']
        assert snapshot['strokes'] or snapshot['bgStrokes'], 'Штрих на доске не записался'
        ctx2, peer = fresh(browser, errors)
        peer.goto(BASE+'/soc_ege.html?n=1');settle(peer)
        peer.evaluate('s=>tsApplyState(s)',snapshot)
        peer.wait_for_function('() => S.n===3 && S.answered && S.correct && !__fipiBusy()')
        assert peer.evaluate('S.pid')==snapshot['egePid']
        assert peer.evaluate('JSON.stringify(__boardGetState())')==page.evaluate('JSON.stringify(__boardGetState())')
        assert page.evaluate("document.documentElement.hasAttribute('data-no-board-grid')")
        page.locator('#basketAddBtn').click()
        assert page.evaluate('Basket.all().some(t=>t.trainerId==="soce3")')
        ctx2.close()
        print('D: доска, рисунок, состояние у собеседника и подборка — OK (заглушка)', flush=True)

        for width in (375,1440):
            page.set_viewport_size({'width':width,'height':1000})
            for theme in ('light','dark'):
                if page.evaluate('document.documentElement.dataset.board==="on"'):
                    page.locator('#boardVisibilityToggle').click()
                page.evaluate('t=>document.documentElement.dataset.theme=t',theme)
                # Длинные таблицы всех соответствий проверяются в реальной разметке.
                for n in (1,3,6,9,13,15):
                    ps=dump[str(n)]['protos']
                    page.evaluate('n=>openTask(n,protos(n)[0].id)',n)
                    bad=page.evaluate('''ps=>{
                      const box=document.querySelector('#questionText'),saved=box.innerHTML,bad=[];
                      for(const p of ps){box.innerHTML=p.text;if(document.documentElement.scrollWidth>innerWidth+1)bad.push(p.id);}
                      box.innerHTML=saved;return bad;
                    }''',ps)
                    assert not bad,(width,theme,n,bad[:4])
                img_task=next(p for d in dump.values() for p in d['protos'] if '<img' in p['text'])
                n=source[img_task['id']]['num27']
                page.evaluate('x=>openTask(x.n,x.id)',{'n':n,'id':img_task['id']})
                page.wait_for_function("() => [...document.querySelectorAll('#questionText img')].every(i=>i.complete&&i.naturalWidth>0)")
                page.evaluate('t=>document.documentElement.dataset.theme=t',theme)
                page.wait_for_timeout(1800)
                assert page.evaluate('document.documentElement.scrollWidth<=innerWidth+1')
                page.evaluate('scrollTo(0,0)')
                page.screenshot(path=str(SHOTS/f'soc-ege-{width}-{theme}.png'),full_page=True,animations='disabled')
        page.goto(BASE+'/soc_ege.html?n=1&all=1');settle(page)
        h=next(t for t in source.values() if t['conf27']=='heur')
        page.evaluate('''async x=>{await new Promise(r=>ensureFipi(x.n,r));openTask(x.n,x.id);}''',{'n':h['num27'],'id':h['id']})
        assert 'h: номер определён эвристикой' in page.locator('#egeQuestion').inner_text()
        panel.BASE=BASE
        board_ctx, board, board_errors = panel.open_board(browser, local={'ttPanel:subject':'soc'})
        panel.open_trainer(board,'soce3','soc_ege.html?n=3','openTask(3,protos(3)[0].id)')
        obj=panel.add_to_board(board,0)
        assert obj['src'] and obj['task'] and obj['task']['kind']=='fields',obj
        assert obj['task']['fields'][0]['value']==panel.fx(board,'curProto.fields[0].value')
        assert not board_errors,board_errors
        board_ctx.close()
        print('F: вставка из панели boards.html: живое задание с принятым ключом — OK',flush=True)
        assert not errors,errors
        ctx.close();browser.close()
    assert before == {p:hashlib.sha256((DATA/p).read_bytes()).hexdigest() for p in before}
    print('E: 375/1440 px, обе темы, все таблицы, предпросмотр с флагами, исходники неизменны — OK')
    print('Готово: ЕГЭ обществознание, часть 1.')


if __name__ == '__main__':
    main()
