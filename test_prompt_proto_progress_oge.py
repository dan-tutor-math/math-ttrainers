"""Задача 59, этап 3. Счётчики сюжетов ОГЭ №1–5 и банка №19."""
from playwright.sync_api import expect, sync_playwright

import test_prompt_b4_captions as B

OTHER = {"id": "aaaaaaaa-0000-4000-8000-000000000005", "name": "Петя"}


def solve_current(page, slug):
    if slug == "oge19":
        choices = page.evaluate("curTask.statements.flatMap((s, i) => s.isTrue ? [i] : [])")
        for i in choices:
            page.locator(f'#stmtList .stmt[data-i="{i}"]').click()
        page.locator("#checkBtn").click()
    else:
        answer = page.evaluate("String(curTask.correctValue).replace('.', ',')")
        page.locator("#answerInput").fill(answer)
        page.locator("#checkAnswerBtn").click()
    return page.evaluate("curTask.fipi")


def check_picker(browser, slug, mode_id, bank, query=""):
    url = f"{B.BASE}/{slug}.html{query}"
    ctx, page, errors = B.new_page(browser, url, session=False)
    try:
        keys = page.evaluate(bank)
        total = len(set(keys))
        assert total > 2
        card = page.locator(f'#modesGrid .mode-card[data-id="{mode_id}"]')
        counter = card.locator(".picker-progress")
        all_counters = page.locator("#modesGrid .picker-progress")
        expect(all_counters).to_have_count(0)
        page.evaluate("s => StudentMemory.start(s)", B.STUDENT)
        expect(counter).to_have_text(f"Решено 0 из {total}")
        expect(card.locator(".complete")).to_have_count(0)

        card.click()
        solved = solve_current(page, slug)
        assert solved in keys
        page.locator("#backBtn").click()
        expect(counter).to_have_text(f"Решено 1 из {total}")

        second = next(fipi for fipi in keys if fipi != solved)
        result = page.evaluate("""f => StudentMemory.recordAttempt({fipi: f}, {ok:false})""", second)
        assert result["ok"]
        expect(counter).to_have_text(f"Решено 1 из {total}")
        page.evaluate("f => StudentMemory.recordAttempt({fipi: f}, {ok:true})", solved)
        expect(counter).to_have_text(f"Решено 1 из {total}")

        if slug == "oge19":
            # Кадр может записать решение, пока в основной вкладке открыт список.
            frame_element = page.evaluate_handle("""url => {
              const f = document.createElement('iframe');
              f.style.cssText = 'position:fixed;left:-1200px;width:900px;height:650px';
              f.src = url;
              document.body.append(f);
              return f;
            }""", url)
            frame = frame_element.content_frame()
            frame.wait_for_function("!!window.StudentMemory")
            assert frame.evaluate("f => StudentMemory.recordAttempt({fipi: f}, {ok:true})", second)["ok"]
            expect(counter).to_have_text(f"Решено 2 из {total}")
            frame_element.evaluate("f => f.remove()")

        page.evaluate("s => StudentMemory.start(s)", OTHER)
        expect(counter).to_have_text(f"Решено 0 из {total}")
        page.evaluate("s => StudentMemory.start(s)", B.STUDENT)
        expected = 2 if slug == "oge19" else 1
        expect(counter).to_have_text(f"Решено {expected} из {total}")
        page.reload()
        expect(counter).to_have_text(f"Решено {expected} из {total}")

        page.evaluate("""ids => ids.forEach(fipi => StudentMemory.recordAttempt({fipi}, {ok:true}))""", keys)
        expect(card.locator(".picker-progress.complete")).to_have_text(f"Решено {total} из {total}")
        # Генераторы в обеих страницах остаются без счётчика.
        expect(page.locator('#modesGrid [data-id="geom"] .picker-progress, #modesGrid [data-id="tire_set1"] .picker-progress')).to_have_count(0)
        page.evaluate("StudentMemory.end()")
        expect(all_counters).to_have_count(0)
        assert not errors, errors
        print(f"[OK] {slug} {mode_id}{query}: решения, счётчик, смена ученика")
    finally:
        ctx.close()


if __name__ == "__main__":
    with B.local_server(), sync_playwright() as p:
        browser = p.chromium.launch()
        check_picker(browser, "oge19", "fipi", "FIPI_BANK.tasks.map(t => t.fipi)")
        check_picker(browser, "oge1_5", "tire_fipi",
                     "FIPI15.tasks.filter(t => t.plot === 'tire' && t.checked).map(t => t.fipi)")
        check_picker(browser, "oge1_5", "tariff_fipi",
                     "FIPI15.tasks.filter(t => t.plot === 'tariff').map(t => t.fipi)", "?all=1")
