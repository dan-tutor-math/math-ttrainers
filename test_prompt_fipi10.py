"""ОГЭ №10: точность входа банка, задачи в типах, фильтр и каталог."""
import json
from pathlib import Path

from playwright.sync_api import expect, sync_playwright

import test_prompt_t54_task_nav as server

ROOT = Path(__file__).resolve().parent


def open_page(browser, width=1180):
    page = browser.new_page(viewport={'width': width, 'height': 850})

    def route(request):
        if request.request.url.startswith(server.BASE):
            request.continue_()
        else:
            request.abort()

    page.route('**/*', route)
    page.goto(f'{server.BASE}/oge10.html')
    return page


def test_catalog(page):
    protos = page.evaluate('() => __trainerCatalog.list()')
    ids = [qid for group in protos for qid in group['fipi']]
    assert len(ids) == len(set(ids)) == 211
    assert len(protos) == 16 and all(p['hasGen'] for p in protos)
    index = json.loads((ROOT / 'catalog-index.json').read_text())['oge10|']['protos']
    assert index == [{k: p[k] for k in ('id', 'title', 'fipi', 'hasGen')} for p in protos]
    assert page.evaluate("""async () => {
        const protos = await __trainerCatalog.list();
        const before = localStorage.getItem('fipiMix:done:oge10');
        const bank = Object.fromEntries(OGE10_FIPI.tasks.map(task => [task.fipi, task]));
        return protos.every(proto =>
            proto.fipi.every((qid, i) => {
                const result = __trainerCatalog.openAt(proto.id, i);
                return result.ok && result.fipi === qid && curTask.fipi === qid
                    && curTask.answer === Number(bank[qid].answer.replace(',', '.'))
                    && bank[qid].type === proto.id && !!curTask.explain;
            })
        ) && localStorage.getItem('fipiMix:done:oge10') === before;
    }""")
    for kind, qid, answer, diagram in [
        ('type9', '546631', 0.42, None),
        ('type13', '98F2BF', 0.9, None),
        ('type14', '3E7FF9', 0.75, '.tree-svg'),
        ('type15', '921C71', 0.8, '.euler-svg'),
        ('type16', '00B922', 0.8, '.euler-svg'),
    ]:
        proto = next(p for p in protos if p['id'] == kind)
        page.evaluate('([kind, i]) => __trainerCatalog.openAt(kind, i)', [kind, proto['fipi'].index(qid)])
        expect(page.locator('#sourceNote')).to_contain_text(qid)
        assert page.evaluate('curTask.answer') == answer
        if diagram:
            expect(page.locator('#questionPromptText ' + diagram)).to_be_visible()
        if qid == '3E7FF9':
            labels = page.locator('.tree-svg text').all_text_contents()
            assert {'0,375', '0,625', '0,875', '0,125'} <= set(labels)


def test_training(page):
    page.locator('.mode-card[data-id="type4"]').click()
    expect(page.locator('#sourceNote')).to_contain_text('27FFA4')
    page.locator('#finalInput').fill('0,25')
    page.locator('#finalGo').click()
    expect(page.locator('#explainBox')).to_contain_text('6 · 6 = 36')
    assert page.evaluate("JSON.parse(localStorage.getItem('fipiMix:done:oge10')).type4.done") == ['27FFA4']
    page.locator('#nextBtn').click()
    expect(page.locator('#sourceNote')).to_have_text('Задание на основе ФИПИ')
    expect(page.locator('#fipiNotice')).to_contain_text('решен')
    page.locator('#backBtn').click()
    page.locator('#fipiFilter .fm-btn').click()
    page.locator('#fipiFilter input[data-k="own"]').uncheck()
    page.locator('#fipiFilter .fm-btn').click()
    page.locator('.mode-card[data-id="random"]').click()
    expect(page.locator('#sourceNote')).to_contain_text('Источник: открытый банк заданий ФИПИ')
    page.locator('#backBtn').click()
    page.locator('.mode-card[data-id="type4"]').click()
    expect(page.locator('#sourceNote')).to_contain_text('27FFA4')
    expect(page.locator('#fipiNotice')).to_contain_text('второй круг')
    page.locator('#backBtn').click()
    page.locator('#fipiFilter .fm-btn').click()
    page.locator('#fipiFilter input[data-k="own"]').check()
    page.locator('#fipiFilter input[data-k="fipi"]').uncheck()
    page.locator('#fipiFilter .fm-btn').click()
    page.locator('.mode-card[data-id="type4"]').click()
    expect(page.locator('#sourceNote')).to_have_text('Задание на основе ФИПИ')


def test_demo_and_snapshot(browser, page):
    page.locator('.mode-card[data-id="type0"]').click()
    expect(page.locator('#questionPromptText')).to_contain_text('200 ручек')
    assert page.evaluate('curTask.answer') == 0.42
    page.locator('#backBtn').click()
    page.locator('.mode-card[data-id="type14"]').click()
    snapshot = page.evaluate('() => __trainerState.get()')
    peer = open_page(browser, 390)
    peer.evaluate('snapshot => __trainerState.apply(snapshot)', snapshot)
    expect(peer.locator('#sourceNote')).to_contain_text(snapshot['curTask']['fipi'])
    expect(peer.locator('.tree-svg')).to_be_visible()
    peer.close()


def main():
    with server.local_server(), sync_playwright() as playwright:
        browser = playwright.chromium.launch()
        page = open_page(browser)
        errors = []
        page.on('pageerror', lambda error: errors.append(str(error)))
        test_catalog(page)
        assert not errors, errors
        page.close()

        page = open_page(browser)
        test_demo_and_snapshot(browser, page)
        page.close()

        page = open_page(browser, 390)
        page.on('pageerror', lambda error: errors.append(str(error)))
        test_training(page)
        assert not errors, errors
        page.close()
        browser.close()
    print('ГОТОВО: 211 мест в каталоге, рисунки, сверенные ответы, режимы показа и прогресс.')


if __name__ == '__main__':
    main()
