"""ОГЭ №8: 281 задание в прототипах, 40 в пяти типах без генератора."""
from playwright.sync_api import sync_playwright
from fipi_test_utils import generator_contract,numeric_bank,server
COUNTS={**{f'p{i}':10 for i in range(1,34) if i not in (10,14,15,16,31,32,33)},'p14':3,'p16':7,'p31':1,'p32':5,'p33':5,'new_composite_denominator':10,'new_composite_numerator':10,'new_conjugate_reciprocals':1,'new_perfect_square_fraction':10,'new_root_var_ratio':9}
def run():
    generator_contract('oge8','p','/* ═══════════════ реестр типов','test_prompt_fipi8_generators.json')
    with server(9238) as base,sync_playwright() as pw:
        browser=pw.chromium.launch();numeric_bank(browser,base,'oge8','OGE8_FIPI',321,COUNTS,'p1');browser.close()
    print('готово')
if __name__=='__main__':run()
