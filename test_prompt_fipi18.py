"""ОГЭ №18: 154 задания, 12 видов, рисунки и второй круг без генератора."""
from playwright.sync_api import sync_playwright
from fipi_test_utils import numeric_bank,server,page
COUNTS={'fipi18_'+g:12 for g in ('parallelogram_area','trapezoid_area','triangle_midline','rhombus_area','triangle_area','triangle_long_leg','trapezoid_midline','rhombus_diagonal','point_distance')}
COUNTS.update(fipi18_triangle_ratio=8,fipi18_circle_ratio=15,fipi18_figure_length=23)
def run():
    with server(9231) as base,sync_playwright() as pw:
        b=pw.chromium.launch();numeric_bank(b,base,'oge15_18','OGE18_FIPI',154,COUNTS,'')
        ctx,p,errors=page(b,base,'oge15_18',375)
        bad=p.evaluate('''async()=>{const bad=[];const urls=[...new Set(OGE18_FIPI.tasks.flatMap(t=>[...t.prompt.matchAll(/src="([^"]+)"/g)].map(m=>m[1])))];await Promise.all(urls.map(src=>new Promise(resolve=>{const i=new Image();i.onload=()=>{if(!i.naturalWidth)bad.push(src);resolve()};i.onerror=()=>{bad.push(src);resolve()};i.src=src})));return bad}''')
        assert not bad,bad
        bad=p.evaluate('''()=>{const bad=[];for(const t of OGE18_FIPI.tasks){curMode=t.g;curTask={...fipiTask(t),fipi:t.fipi};renderCurrentTask();els.explainBox.innerHTML=curTask.explain;els.explainBox.style.display='block';if(document.documentElement.scrollWidth>innerWidth+1)bad.push(t.fipi);}return bad}''')
        assert not bad,bad
        p.evaluate("curMode='fipi18_triangle_ratio';openTask();for(const t of ALL_MODES.find(m=>m.id===curMode).fipiList)FipiMix.markDone(FIPI_PAGE,curMode,{fipi:t.fipi});newTask()")
        assert p.evaluate('!!curTask.fipi && !curTask.basedOnFipi && curTask.fipiCycle && !/на основе ФИПИ/.test(curTask.fipiNotice)')
        p.click('#backBtn');assert 'только задания ФИПИ' in p.locator('.mode-card[data-id="fipi18_triangle_ratio"]').inner_text()
        p.click('#fipiFilter .fm-btn');p.locator('.fm-pop input[data-k="fipi"]').uncheck()
        assert p.locator('.mode-card[data-id^="fipi18_"]').count()==0
        assert not errors,errors
        ctx.close();b.close()
    print('№18: 212 рисунков, все условия на 375 px, второй круг — готово')
if __name__=='__main__':run()
