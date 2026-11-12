"""Снимок типов для быстрого меню без загрузки тренажёров в скрытых кадрах.
Источник — действующая разметка и штатный каталог страниц. Названия вручную
не редактируются: python3 sync_exam_types.py --write / --check.
"""
import argparse
import json
from pathlib import Path
from urllib.parse import urlsplit, parse_qs
from playwright.sync_api import sync_playwright
import test_prompt54_trainer_sync_and_cards as t54

PORT = 8995
BASE = f'http://127.0.0.1:{PORT}'
OUTPUT = Path(__file__).with_name('exam-types.js')

CARDS = """() => {
 const clean=e=>{const c=e.cloneNode(true);c.querySelectorAll('.katex-mathml,.mode-medals,.mdone').forEach(x=>x.remove());return c.textContent.replace(/\\s+/g,' ').trim();};
 let modeGroups={};
 if(typeof GROUPS!=='undefined'&&Array.isArray(GROUPS))GROUPS.forEach(g=>(g.modes||[]).forEach(m=>modeGroups[m.id]=g.title||''));
 return [...document.querySelectorAll('#pickerArea .mode-card[data-id]:not(.soon):not(.random):not([data-id="random"]),#protoList .mode-card[data-pid],#protoList .mode-card[data-gid]')].map(c=>({
  token:c.dataset.id?'m:'+c.dataset.id:c.dataset.gid?'g:'+c.dataset.gid:'p:'+c.dataset.pid,
  title:clean(c.querySelector('.mtitle')||c),group:c.dataset.id?(modeGroups[c.dataset.id]||''):''
 }));
}"""


def collect():
    t54.PORT = PORT
    result = {}
    with t54.local_server(), sync_playwright() as p:
        browser = p.chromium.launch()
        ctx = browser.new_context()
        errors = []
        page = t54.new_page(ctx, errors)
        # Чтение каталога не должно подключаться к уроку или получать его снимок.
        page.route('**/supabase-config.js', lambda r: r.fulfill(status=200, content_type='application/javascript', body='window.SUPABASE_CONFIG = {};'))
        page.route('https://**/*', lambda r: r.abort())
        page.goto(BASE + '/index.html')
        entries = page.evaluate("""() => [...new Set(MathhCatalog.exams.filter(e=>!e.soon).flatMap(e=>e.groups.flatMap(g=>g.items)))].map(id=>({id,...MathhCatalog.trainers[id]}))""")
        groups = {}
        for entry in entries:
            groups.setdefault(urlsplit(entry['href']).path, []).append(entry)
        for filename, trainers in groups.items():
            if filename == 'rus_oge01.html':
                result[trainers[0]['id']] = []
                continue
            page.goto(BASE + '/' + trainers[0]['href'])
            if filename == 'rus_oge.html':
                page.wait_for_function('() => !!window.__rusOge')
                for trainer in trainers:
                    n = int(parse_qs(urlsplit(trainer['href']).query)['n'][0])
                    result[trainer['id']] = page.evaluate("""n => __rusOge.topicsOf(n).map(t=>({token:'r:'+t.id,title:t.title,group:''}))""", n)
            elif filename == 'rus_oge13.html':
                page.wait_for_function('() => !!window.__rusOge13')
                count = page.evaluate('__rusOge13.TASKS[0].th.length')
                result[trainers[0]['id']] = [{'token': 'w:' + str(i), 'title': 'Сочинение 13.' + str(i + 1), 'group': ''} for i in range(count)]
            elif page.evaluate('() => !!window.__trainerCatalog'):
                for trainer in trainers:
                    n = int(parse_qs(urlsplit(trainer['href']).query)['n'][0])
                    units = page.evaluate('n => __trainerCatalog.list(n)', n)
                    if not units:
                        result[trainer['id']] = []
                        continue
                    page.evaluate('n => __examNav.open(n)', n)
                    page.wait_for_function('n => __examNav.n() === n && !__fipiBusy()', arg=n)
                    result[trainer['id']] = page.evaluate(CARDS)
            else:
                page.wait_for_selector('#pickerArea .mode-card[data-id]', state='attached')
                result[trainers[0]['id']] = page.evaluate(CARDS)
            print(filename, sum(len(result[t['id']]) for t in trainers), flush=True)
        browser.close()
        assert not errors, errors
    assert all(len({t['token'] for t in ts}) == len(ts) for ts in result.values())
    assert all(t['title'] for ts in result.values() for t in ts)
    return result


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--write', action='store_true')
    parser.add_argument('--check', action='store_true')
    args = parser.parse_args()
    data = collect()
    text = '/* Сгенерировано sync_exam_types.py из страниц тренажёров; вручную не менять. */\nwindow.MathhExamTypes = ' + json.dumps(data, ensure_ascii=False, separators=(',', ':')) + ';\n'
    if args.write:
        OUTPUT.write_text(text)
    else:
        assert OUTPUT.read_text() == text, 'Типы изменились — выполните sync_exam_types.py --write'
    print(f'Готово: {len(data)} номеров, {sum(map(len, data.values()))} типов, ' + ('каталог записан' if args.write else 'каталог совпал'))


if __name__ == '__main__':
    main()
