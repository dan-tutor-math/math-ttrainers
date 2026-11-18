"""Задача 59, этап 4. Прогресс номеров и подтем русского в журнале ученика."""
from playwright.sync_api import expect, sync_playwright

import test_prompt_b4_captions as B
import test_prompt_rus_ege as EGE
import test_prompt_rus_oge as OGE


OTHER = {"id": "aaaaaaaa-0000-4000-8000-000000000005", "name": "Петя"}


def check_topics(page, base):
    page.locator('.mode-card[data-n="5"]').click()
    all_badge = page.locator('.mode-card[data-tp=""] .mprog')
    data = page.evaluate("""() => {
      const {topicsOf, POOL} = __rusOge;
      const all = POOL[5];
      const topic = topicsOf(5).find(t => all.filter(p => p.tp?.includes(t.id)).length > 1);
      return {total: all.length, topic: topic.id, tasks: all.filter(p => p.tp?.includes(topic.id))};
    }""")
    tasks, total = data["tasks"], data["total"]
    topic_badge = page.locator(f'.mode-card[data-tp="{data["topic"]}"] .mprog')
    expect(all_badge).to_have_text(f"Решено 0 из {total}")
    expect(topic_badge).to_have_text(f"Решено 0 из {len(tasks)}")
    # У одного номера ФИПИ может быть несколько подтем. В «Все задания» он один.
    assert page.evaluate("id => StudentMemory.record(TaskKey.fromTask('rus5', {id}), 'ok')", tasks[0]["id"])["ok"]
    expect(all_badge).to_have_text(f"Решено 1 из {total}")
    expect(topic_badge).to_have_text(f"Решено 1 из {len(tasks)}")
    page.evaluate("s => StudentMemory.start(s)", OTHER)
    expect(topic_badge).to_have_text(f"Решено 0 из {len(tasks)}")
    page.evaluate("s => StudentMemory.start(s)", B.STUDENT)
    page.evaluate("items => items.forEach(t => StudentMemory.recordAttempt(t, {ok:true}))", tasks[1:])
    expect(topic_badge).to_have_text(f"Решено {len(tasks)} из {len(tasks)}")
    expect(topic_badge).not_to_have_class("mprog progress-pending")

    page.locator('.mode-card[data-tp=""]').click()
    expect(page.locator("#statDone")).to_have_text(f"{len(tasks)} из {total}")
    page.locator("#backBtn").click()
    page.locator("#topicsBack").click()
    expect(page.locator('.mode-card[data-n="5"] .mprog')).to_have_text(f"Решено {len(tasks)} из {total}")
    assert page.url == base, page.url


def check_picker(browser, slug, api, results_key, answer, essay):
    url = f"{B.BASE}/{slug}.html"
    ctx, page, errors = B.new_page(browser, url + "?n=2", session=False)
    try:
        task, total = page.evaluate(f"() => [{api}.S.list[{api}.S.idx], {api}.S.list.length]")
        page.evaluate("([key, id]) => localStorage.setItem(key, JSON.stringify({[id]:'ok'}))", [results_key, task["id"]])
        page.reload()
        stat = page.locator("#statDone")
        expect(stat).to_have_text(f"1 из {total}")
        page.evaluate("s => StudentMemory.start(s)", B.STUDENT)
        expect(stat).to_have_text(f"0 из {total}")

        page.locator("#backBtn").click()
        number = page.locator('.mode-card[data-n="2"]')
        badge = number.locator(".mprog")
        expect(badge).to_have_text(f"Решено 0 из {total}")
        expect(badge).to_have_class("mprog progress-pending")
        expect(page.locator("#essayLink")).to_have_attribute("href", essay)
        if slug == "rus_oge":
            expect(page.locator("#izlLink")).to_have_attribute("href", "rus_oge01.html")

        number.click()
        answer(page, task)
        expect(page.locator("#feedback")).to_contain_text("Верно")
        expect(stat).to_have_text(f"1 из {total}")
        page.locator("#backBtn").click()
        expect(badge).to_have_text(f"Решено 1 из {total}")

        second = page.evaluate(f"() => {api}.POOL[2].find(t => t.id !== {api}.S.list[{api}.S.idx].id)")
        assert page.evaluate("t => StudentMemory.recordAttempt(t, {ok:false})", second)["ok"]
        expect(badge).to_have_text(f"Решено 1 из {total}")
        assert not page.evaluate("t => StudentMemory.recordAttempt(t, {ok:true})", task)["ok"]
        expect(badge).to_have_text(f"Решено 1 из {total}")
        page.evaluate("s => StudentMemory.start(s)", OTHER)
        expect(badge).to_have_text(f"Решено 0 из {total}")
        page.evaluate("s => StudentMemory.start(s)", B.STUDENT)
        page.reload()
        expect(badge).to_have_text(f"Решено 1 из {total}")

        if slug == "rus_oge":
            check_topics(page, url)

        page.evaluate("StudentMemory.end()")
        expect(badge).to_have_text(f"✓ 1 из {total}")
        expect(page.locator("#modesGrid")).not_to_contain_text("Решено")
        number.click()
        page.locator("#backBtn").click()
        page.wait_for_url("**/index.html?subject=rus")
        assert not errors, errors
        print(f"[OK] {slug}: счётчики по журналу, возврат к выбору и прежняя навигация без сессии")
    finally:
        ctx.close()


if __name__ == "__main__":
    with B.local_server(), sync_playwright() as p:
        browser = p.chromium.launch()
        check_picker(browser, "rus_oge", "__rusOge", "rusOge:results", OGE.answer, "rus_oge13.html")
        check_picker(browser, "rus_ege", "__rusEge", "rusEge:results", EGE.answer, "rus_ege27.html")
