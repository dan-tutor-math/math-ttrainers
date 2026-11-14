"""Темы ЕГЭ обществознания: редкие подтемы доступны, без «Других тем».
Запуск: ~/.venvs/trainers/bin/python test_prompt_soc_ege_topics.py.
"""
import collections
import json
from pathlib import Path
import re
import sys

from playwright.sync_api import sync_playwright
import test_prompt54_trainer_sync_and_cards as t54
sys.path.insert(0,str(Path(__file__).resolve().parent/'tools'))
from soc_ege_export import groups_for, TOPIC_TITLES

HERE=Path(__file__).resolve().parent
COUNTS={1:27,2:11,3:8,4:9,5:12,6:7,7:9,8:7,9:23,10:9,11:8,12:3,
        13:2,14:12,15:10,16:10,17:34,18:14,19:43,20:38,21:1,22:22,23:3,24:31,25:23}
BASE='http://127.0.0.1:8999'
SHOTS=HERE/'.impeccable/review'


def main():
    raw=json.loads((HERE.parent/'fipi-pilot/full_ege_soc/tasks.json').read_text())
    expected={}
    for n in COUNTS:
        ts=[t for t in raw if t['num27']==n]
        sections,groups,pick=groups_for(ts)
        by_code=collections.defaultdict(set)
        for t in ts:
            code=re.match(r'[\d.]+',t['kes'][0])[0].rstrip('.')
            if t['id']=='43555F':
                assert '«налоговая политика»' in t['stem']
                code='2.15'
            assert pick[t['id']]=='k'+code,t['id']
            by_code[code].add(t['id'])
        assert len(groups)==COUNTS[n]
        assert {g['kes'] for g in groups}==set(by_code)
        assert all(g['title']==TOPIC_TITLES[g['kes']] and g['title']!='Другие темы' for g in groups)
        expected[n]={g['id']:{'title':g['title'],'tasks':by_code[g['kes']]} for g in groups}
        if len({g['kes'].split('.')[0] for g in groups})>1:
            assert sections and all(g['section'] for g in groups)
    assert sum(COUNTS.values())==376
    # Первая фраза КЭС не должна скрывать другие важные части этого же пункта.
    assert 'гражданское общество' in TOPIC_TITLES['4.4']
    assert 'партии' in TOPIC_TITLES['4.9']
    assert 'Культура' in TOPIC_TITLES['1.10']
    try:
        groups_for([{'id':'missing','kes':[]}])
    except ValueError:pass
    else:raise AssertionError('Задание без темы не должно тихо попадать в остаток')
    print('A: 376 тематических групп, редкие темы сохранены; 1678 назначений, включая уточнение налоговой политики — OK',flush=True)

    t54.PORT=8999;errors=[]
    with t54.local_server(),sync_playwright() as pw:
        browser=pw.chromium.launch()
        ctx=browser.new_context(viewport={'width':1440,'height':1000})
        page=t54.new_page(ctx,errors)
        page.route('https://**/*',lambda r:r.abort())
        for filename,nums in [('soc_ege.html',range(1,17)),('soc_ege_long.html',range(17,26))]:
            page.goto(BASE+'/'+filename)
            page.wait_for_function('()=>!!window.__trainerCatalog&&!__fipiBusy()')
            actual=page.evaluate('''async nums=>{const out={};for(const n of nums)out[n]=await __trainerCatalog.list(n);return out;}''',list(nums))
            for n in nums:
                units=actual[str(n)]
                assert len(units)==COUNTS[n]
                assert {u['id'] for u in units}==set(expected[n])
                for u in units:
                    e=expected[n][u['id']]
                    assert u['title']==e['title'] and set(u['tasks'])==e['tasks'],(n,u['id'])
            sample=1 if filename=='soc_ege.html' else 25
            for width in (375,1440):
                page.set_viewport_size({'width':width,'height':1000})
                for theme in ('light','dark'):
                    page.evaluate('''x=>{S.n=x.n;showPicker();document.documentElement.dataset.theme=x.theme;scrollTo(0,0);}''',{'n':sample,'theme':theme})
                    cards=page.locator('#protoList .mode-card[data-gid]')
                    assert cards.count()==COUNTS[sample]
                    assert 'Другие темы' not in page.locator('#protoList').inner_text()
                    assert page.evaluate('document.documentElement.scrollWidth<=innerWidth+1')
                    assert page.evaluate('''()=>[...document.querySelectorAll('#protoList .mtitle')].every(e=>e.scrollWidth<=e.clientWidth+1&&e.scrollHeight<=e.clientHeight+1)''')
                    page.screenshot(path=str(SHOTS/f'soc-ege-topics-{sample}-{width}-{theme}.png'),full_page=True,animations='disabled')
            # Раньше тема с одним заданием была недоступна отдельно.
            rare=next(gid for gid,e in expected[sample].items() if len(e['tasks'])==1)
            page.locator(f'#protoList .mode-card[data-gid="{rare}"]').click()
            page.wait_for_function('gid=>curProto&&curProto.group===gid',arg=rare)
            assert page.evaluate('S.pid') in expected[sample][rare]['tasks']
            page.locator('.exam-nav-text').click()
            type_button=page.locator(f'#examJumpTypes [data-type="g:{rare}"]')
            type_button.wait_for(state='visible')
            assert type_button.inner_text().strip()==expected[sample][rare]['title']
            assert 'Другие темы' not in page.locator('#examJumpTypes').inner_text()
            type_button.click()
            page.wait_for_function('gid=>curProto&&curProto.group===gid',arg=rare)
        assert not errors,errors
        ctx.close();browser.close()
    print('B: все 25 номеров, списки и меню редких тем, 375/1440 px, обе темы — OK')
    print('Готово: темы ЕГЭ обществознания распределены.')


if __name__=='__main__':main()
