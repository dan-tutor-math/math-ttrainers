"""Стрелки примеров ОГЭ №1–5. Запуск из этой папки с установленным Playwright."""
from playwright.sync_api import sync_playwright

from test_prompt_oge1_5_look import BASE, local_server


def open_page(browser, width=1280):
    page = browser.new_page(viewport={"width": width, "height": 900})
    page.route("https://**/*", lambda route: route.abort())
    page.goto(BASE + "/oge1_5.html")
    return page


def check_bank(page):
    # Проходим весь круг по каждой клетке: проверяем порядок по данным ФИПИ
    # независимо от массива, который использует сам переключатель.
    return page.evaluate("""() => {
      let count = 0;
      for (const group of GROUPS) for (const set of group.modes.filter(s => s.fipi)) {
        document.querySelector('.mode-card[data-id="' + set.id + '"]').click();
        for (const [i, task] of set.tasks.entries()) {
          if (i) els.nextTaskBtn.click();
          const plot = set.id.replace(/_fipi$/, '');
          const rows = FIPI15.tasks.filter(t => t.plot === plot && t.checked &&
            (plot === 'tire' ? t.kind === TIRE_KINDS[i] : t.n === i + 1));
          for (const tab of [els.tabLearn, els.tabPractice, els.tabExam]) {
            tab.click();
            const start = rows.findIndex(r => r.fipi === curTask.fipi);
            for (let j = 1; j <= rows.length; j++) {
              els.nextExample.click();
              const idx = (start + j) % rows.length, r = rows[idx];
              if (curMode !== task.id || !tab.classList.contains('active') ||
                  curTask.fipi !== r.fipi || els.exampleCount.textContent !== (idx+1)+' из '+rows.length ||
                  els.questionPromptText.innerHTML === '' || !els.questionPanel.offsetHeight ||
                  (tab === els.tabLearn && !els.explainBox.offsetHeight) ||
                  (isTextSet() && (plot === 'tire' ? curTireFipiVar : curPlotVar[plot]) !== r.v) ||
                  els.theoryContent.innerHTML !== (() => {const d=document.createElement('div'); d.innerHTML=set.theory();return d.innerHTML;})())
                throw new Error([set.id, task.id, tab.id, idx, r.fipi, curTask.fipi].join(' '));
              count++;
            }
            els.prevExample.click();
            if (curTask.fipi !== rows[(start-1+rows.length)%rows.length].fipi) throw Error('назад');
          }
        }
        els.backBtn.click();
      }
      return count;
    }""")


def check_generators(page):
    page.locator('[data-id="tire_set1"]').click()
    for i in range(5):
        if i:
            page.click("#nextTaskBtn")
        original = page.evaluate("curTask.prompt")
        page.click("#nextExampleTop")
        assert page.evaluate("curTask.prompt") != original
        page.click("#prevExample")
        assert page.evaluate("curTask.prompt") == original
    page.click("#backBtn")
    page.locator('[data-id="tire_demo2027"]').click()
    for i in range(5):
        if i:
            page.click("#nextTaskBtn")
        assert page.inner_text("#exampleCount") == "1 из 1"
        assert page.is_disabled("#prevExample") and page.is_disabled("#nextExampleTop")
    page.click("#backBtn")
    page.click(".mode-card.random")
    initial = page.evaluate("curTask")
    page.click("#nextExampleTop")
    assert page.evaluate("curTask.genKind") == initial["genKind"]
    page.click("#prevExample")
    assert page.evaluate("curTask.prompt") == initial["prompt"]
    page.click("#backBtn")


def check_linked_text(page, peer):
    page.locator('[data-id="trip_fipi"]').click()
    page.click("#nextTaskBtn")
    page.click("#prevTaskBtn")
    previous = page.evaluate("curPlotVar.trip")
    for _ in range(20):
        page.click("#nextExampleTop")
        if page.evaluate("curPlotVar.trip") != previous:
            break
    variant = page.evaluate("curPlotVar.trip")
    assert previous != variant
    page.click("#nextTaskBtn")
    assert page.evaluate("FIPI15.tasks.find(t => t.fipi === curTask.fipi).v") == variant
    page.click("#tabLearn")
    peer.evaluate("s => tsApplyState(s)", page.evaluate("tsGetState()"))
    assert peer.is_visible("#explainBox") and peer.is_visible("#prevExample")
    assert peer.inner_html("#theoryContent") == page.inner_html("#theoryContent")
    assert peer.inner_text("#exampleCount") == page.inner_text("#exampleCount")
    page.click("#backBtn")


def check_cards_and_session(page, peer):
    page.locator('[data-id="tariff_fipi"]').click()
    for _ in range(3):
        page.click("#nextTaskBtn")
    page.click("#refreshBtn")
    assert page.inner_text("#tasksetNavLabel") == "Задание 4 из 5"
    for width in (1280, 820, 375, 320):
        page.set_viewport_size({"width": width, "height": 900})
        assert page.evaluate("document.documentElement.scrollWidth <= innerWidth")
        assert page.is_visible("#examplePager")
        if width >= 820:
            refresh = page.locator("#refreshBtn").bounding_box()
            pager = page.locator("#examplePager").bounding_box()
            assert pager["x"] >= refresh["x"] + refresh["width"]
            assert abs(pager["y"] - refresh["y"]) < 5
    page.click("#nextExampleTop")
    page.set_viewport_size({"width": 1280, "height": 900})
    page.click(".add-rail-toggle")
    page.click('.add-qty-btn[data-n="1"]')
    frame = page.frame_locator(".tm-card iframe")
    frame.locator("#nextExampleTop").wait_for()
    main_id = page.evaluate("curTask.fipi")
    snapshot = page.evaluate("tsGetState()")
    peer.evaluate("s => tsApplyState(s)", snapshot)
    peer_frame = peer.frame_locator(".tm-card iframe")
    peer_frame.locator("#nextExampleTop").wait_for()
    card_id = frame.locator("#sourceNote").inner_text()
    frame.locator("#nextExampleTop").click()
    changed = frame.locator("#sourceNote").inner_text()
    assert changed != card_id and page.evaluate("curTask.fipi") == main_id
    peer.evaluate("s => tsApplyState(s)", page.evaluate("tsGetState()"))
    assert peer_frame.locator("#sourceNote").inner_text() == changed
    assert peer.evaluate("curTask.fipi") == main_id
    frame.locator("#prevExample").click()
    assert frame.locator("#sourceNote").inner_text() == card_id
    page.reload()
    page.locator('[data-id="tariff_fipi"]').click()
    for _ in range(3):
        page.click("#nextTaskBtn")
    assert page.evaluate("curTask.fipi") == main_id


if __name__ == "__main__":
    with local_server(), sync_playwright() as p:
        browser = p.chromium.launch()
        page, peer = open_page(browser), open_page(browser)
        errors = []
        for tab in (page, peer):
            tab.on("pageerror", lambda error: errors.append(str(error)))
        count = check_bank(page)
        check_generators(page)
        check_linked_text(page, peer)
        check_cards_and_session(page, peer)
        assert not errors, errors
        print(f"{count} переходов по банку, генераторы, карточка и снимок сессии — готово")
        browser.close()
