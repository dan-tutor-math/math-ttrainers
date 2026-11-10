"""ОГЭ №14: 100 сверенных задач; охлаждение t4 остаётся генератором."""
from playwright.sync_api import sync_playwright
from fipi_test_utils import generator_contract,numeric_bank,server
COUNTS={**{f't{i}':10 for i in (1,2,3,5,6,8,9,10)},'t7':20}
def run():
    generator_contract('oge14','t','/* ═══════════════ реестр типов','test_prompt_fipi14_generators.json')
    with server(9234) as base,sync_playwright() as pw:
        browser=pw.chromium.launch();numeric_bank(browser,base,'oge14','OGE14_FIPI',100,COUNTS,'t1')
        ctx=browser.new_context();p=ctx.new_page();p.route('https://**/*',lambda r:r.abort());p.goto(base+'/oge14.html')
        assert p.evaluate("!ALL_MODES.find(m=>m.id==='t4').fipiList")
        assert p.evaluate('build_t10(4,2,25).correctValue')==6
        assert p.evaluate('build_t10(.1,2,20).correctValue')==1
        ctx.close();browser.close()
    print('готово')
if __name__=='__main__':run()
