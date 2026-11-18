"""Задача 59, этап 2. Playwright проверяет шаблон ЕГЭ и все его копии."""
from playwright.sync_api import expect, sync_playwright

import test_prompt_b4_captions as B


OTHER = {"id": "aaaaaaaa-0000-4000-8000-000000000005", "name": "Петя"}
CASES = (
    ("ege_base", 1, "egeb1", False),
    ("ege_prof", 1, "ege1", True),
    ("oge_part2", 20, "oge20", True),
    ("eng_oge", 5, "eng5", True),
    ("soc_oge", 1, "soc1", True),
    ("soc_ege", 1, "soce1", True),
    ("soc_ege_long", 17, "soce17", True),
    ("inf_oge", 1, "inf1", True),
    ("phys_oge", 1, "phys1", True),
)


def check_picker(browser, slug, number, trainer_id, grouped):
    url = f"{B.BASE}/{slug}.html?n={number}"
    ctx, page, errors = B.new_page(browser, url, session=False)
    try:
        page.wait_for_function("!fipiPending(S.n)")
        data = page.evaluate("""grouped => {
          const list = protos(S.n);
          const group = grouped && groupsOf(S.n).find(g =>
            list.filter(p => p.group === g.id && (p.fipi || /^демоверсия/i.test(p.src || ''))).length > 1);
          const items = list.filter(p => (p.fipi || /^демоверсия/i.test(p.src || '')) &&
            (!grouped || group && p.group === group.id));
          return { group: group && group.id, tasks: items.map(p => ({id: p.id, fipi: p.fipi})) };
        }""", grouped)
        tasks = data["tasks"]
        total = len(tasks)
        assert total >= 2, (slug, data)
        first, second = tasks[:2]
        if grouped:
            card = page.locator(f'.mode-card[data-gid="{data["group"]}"]')
            counter = card
            full_badge = card.locator(".mdone")
        else:
            counter = page.locator("#pickerTitle")
            solved_card = page.locator(f'.mode-card[data-pid="{first["id"]}"] .mdone')
            device_card = page.locator(f'.mode-card[data-pid="{second["id"]}"] .mdone')

        page.evaluate("id => { markSolved(id); renderPicker(); }", second["id"])
        assert "Решено" not in counter.inner_text()
        if not grouped:
            expect(device_card).to_have_text("✓ решено")

        page.evaluate("s => StudentMemory.start(s)", B.STUDENT)
        expect(counter).to_contain_text(f"Решено 0 из {total}")
        if grouped:
            expect(card.locator(".mcount")).to_have_text(f"Решено 0 из {total}")
        else:
            expect(device_card).to_have_count(0)

        record = """([task, ok]) => StudentMemory.recordAttempt(task, {ok})"""
        assert page.evaluate(record, [first, False])["ok"]
        expect(counter).to_contain_text(f"Решено 0 из {total}")
        assert page.evaluate(record, [first, True])["ok"]
        expect(counter).to_contain_text(f"Решено 1 из {total}")
        if not grouped:
            expect(solved_card).to_have_text("✓ решено")
            expect(device_card).to_have_count(0)

        # Запись с ключом доски в другой вкладке должна обновить открытый выбор.
        other_page = ctx.new_page()
        other_page.route("https://**/*", B.db_route)
        other_page.goto(url)
        from_board = """([tid, pid]) => StudentMemory.record(
          TaskKey.fromRecipe({kind: 'ege', tid, pid}), 'ok', {source:'board'})"""
        assert other_page.evaluate(from_board, [trainer_id, second["id"]])["ok"]
        expect(counter).to_contain_text(f"Решено 2 из {total}")
        if not grouped:
            expect(device_card).to_have_text("✓ решено")

        # У наборов английского могут быть оба ключа. Они не дают два решения.
        if slug == "eng_oge":
            assert page.evaluate(record, [second, True])["ok"]
        else:
            assert not page.evaluate(record, [first, True])["ok"]
        expect(counter).to_contain_text(f"Решено 2 из {total}")
        other_page.close()

        page.evaluate("s => StudentMemory.start(s)", OTHER)
        expect(counter).to_contain_text(f"Решено 0 из {total}")
        page.evaluate("s => StudentMemory.start(s)", B.STUDENT)
        expect(counter).to_contain_text(f"Решено 2 из {total}")
        page.reload()
        expect(counter).to_contain_text(f"Решено 2 из {total}")

        page.evaluate("items => items.forEach(p => StudentMemory.recordAttempt(p, {ok:true}))", tasks[2:])
        expect(counter).to_contain_text(f"Решено {total} из {total}")
        if grouped:
            expect(full_badge).to_have_text(f"Решено {total} из {total}")

        page.evaluate("StudentMemory.end()")
        expect(counter).not_to_contain_text("Решено")
        if not grouped:
            expect(solved_card).to_have_count(0)
            expect(device_card).to_have_text("✓ решено")
        assert not errors, (slug, errors)
        print(f"[OK] {slug} №{number}: прогресс сессии и запись из другой вкладки")
    finally:
        ctx.close()


if __name__ == "__main__":
    with B.local_server(), sync_playwright() as p:
        browser = p.chromium.launch()
        for case in CASES:
            check_picker(browser, *case)
