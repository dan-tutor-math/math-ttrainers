"""Общие проверки банков: локальная страница, контроль генератора до переноса построения."""
import contextlib,http.client,json,os,re,subprocess,sys,time
from pathlib import Path
HERE=Path(__file__).resolve().parent
@contextlib.contextmanager
def server(port):
    p=subprocess.Popen([sys.executable,'-m','http.server',str(port)],cwd=HERE,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
    try:
        for _ in range(60):
            try:
                c=http.client.HTTPConnection('127.0.0.1',port,timeout=.2);c.request('GET','/index.html');c.getresponse();break
            except OSError: time.sleep(.1)
        else: raise RuntimeError('Сервер не поднялся')
        yield f'http://127.0.0.1:{port}'
    finally:p.terminate();p.wait(timeout=5)
def page(browser,base,slug,width=1280):
    ctx=browser.new_context(viewport={'width':width,'height':950});p=ctx.new_page();errors=[]
    p.on('pageerror',lambda e:errors.append(str(e)));p.route('https://**/*',lambda r:r.abort())
    p.goto(f'{base}/{slug}.html');p.wait_for_function("typeof tsGetState === 'function'");p.wait_for_timeout(350)
    return ctx,p,errors

def generator_contract(slug,prefix,stop,fixture):
    s=(HERE/f'{slug}.html').read_text();code=s[s.index('const ri ='):s.index(stop)]
    names=re.findall(r'function (gen_'+prefix+r'\d+_\w+)\(',code)
    js="const crypto=require('crypto');let seed=9137;Math.random=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296);const katex={renderToString:s=>'$'+s+'$'};"+code+'\nconst out={};\n'
    js+='\n'.join(f"for(const nat of [true,false]) out['{name}:'+nat]=Array.from({{length:80}},()=>{name}(nat));" for name in names)
    js+="\nprocess.stdout.write(JSON.stringify(Object.fromEntries(Object.entries(out).map(([k,v])=>[k,crypto.createHash('sha256').update(JSON.stringify(v)).digest('hex')]))));"
    r=subprocess.run(['node','-e',js],capture_output=True,text=True);assert r.returncode==0,r.stderr
    expected=json.loads((HERE/fixture).read_text());actual=json.loads(r.stdout)
    assert actual==expected,[k for k in expected if expected[k]!=actual.get(k)]
    print(f'Генераторы {slug}: {len(names)*160} результатов совпали с исходными')

def numeric_bank(browser,base,slug,bank_name,total,counts,own_mode):
    ctx,p,errors=page(browser,base,slug)
    bank=p.evaluate(f'window.{bank_name}')
    from collections import Counter
    assert len(bank['tasks'])==total and len({t['fipi'] for t in bank['tasks']})==total
    assert dict(Counter(t['g'] for t in bank['tasks']))==counts
    assert all(t['checked'] for t in bank['tasks'])
    assert p.locator('#fipiFilter .fm-btn').is_visible()
    p.evaluate("curMode='"+own_mode+"';openTask();playMedalAnimation=()=>{}")
    bad=p.evaluate('''(bank)=>{const bad=[];for(const t of bank.tasks){
      curMode=t.g;curTask=Object.assign(fipiTask(t),{fipi:t.fipi});curProg=freshProg();taskAnswered=false;hadWrongPick=false;
      renderCurrentTask();if(/NaN|Infinity|undefined/.test(curTask.explain))bad.push([t.fipi,'разбор']);if(Math.abs(curTask.correctValue-t.ans)>1e-8)bad.push([t.fipi,'build']);
      els.answerInput.value=String(t.ans).replace('.',',').replace('-','−');submitInputAnswer();
      if(!taskAnswered || !els.answerInput.classList.contains('good'))bad.push([t.fipi,'ответ']);
      if(!document.getElementById('sourceNote').textContent.includes(t.fipi))bad.push([t.fipi,'источник']);
      if(/<(?:m:)?math/.test((t.prompt||'')+(t.sol||[]).join('')))bad.push([t.fipi,'сырой MathML']);
    }return bad;}''',bank)
    assert not bad,bad[:5]
    print(f'{slug}: все {total} построены, каждый ответ засчитан')
    if own_mode:
        p.evaluate("curMode='"+own_mode+"';newTask()")
        assert p.evaluate('curTask.basedOnFipi && !curTask.fipi && !!curTask.fipiNotice')
        p.click('#backBtn');assert f'ФИПИ решено {counts[own_mode]} из {counts[own_mode]}' in p.locator(f'.mode-card[data-id="{own_mode}"]').inner_text()
    p.click('#fipiFilter .fm-btn');p.locator('.fm-pop input[data-k="fipi"]').uncheck()
    assert p.evaluate('!FipiMix.filter().fipi && FipiMix.filter().own')
    assert p.locator('.fm-pop label').all_text_contents()==['Задания ФИПИ','На основе ФИПИ']
    if own_mode:
        p.evaluate("curMode='"+own_mode+"';newTask()")
        assert p.evaluate('curTask.basedOnFipi && !curTask.fipi')
    p.evaluate("localStorage.setItem('fipiMix:filter',JSON.stringify({fipi:true,own:false}));curMode='"+(own_mode or bank['tasks'][0]['g'])+"';openTask();newTask()")
    assert p.evaluate('!!curTask.fipi && !curTask.basedOnFipi')
    state=p.evaluate('tsGetState()');ctx2,peer,err2=page(browser,base,slug)
    peer.evaluate('(s)=>tsApplyState(s)',state)
    assert peer.evaluate('curTask')==p.evaluate('curTask')
    assert peer.locator('#questionPromptText').inner_html()==p.locator('#questionPromptText').inner_html()
    assert peer.locator('#sourceNote').inner_text()==p.locator('#sourceNote').inner_text()
    assert not errors+err2,errors+err2
    ctx2.close();ctx.close()
    ctx,p,errors=page(browser,base,slug,375)
    for mid in counts:
        p.evaluate('(id)=>{curMode=id;openTask();switchSubMode("practice");}',mid)
        if p.locator('#showSolutionBtn').is_visible():p.click('#showSolutionBtn')
        assert p.evaluate('document.documentElement.scrollWidth<=innerWidth+1'),mid
    p.screenshot(path=f'/private/tmp/{slug}-fipi-phone.png',full_page=True)
    p.evaluate("document.documentElement.dataset.theme='dark'")
    p.screenshot(path=f'/private/tmp/{slug}-fipi-dark.png',full_page=True)
    assert not errors,errors
    ctx.close();print(f'{slug}: фильтр, переход к генератору, снимок сессии, 375 px, JS — готово')
