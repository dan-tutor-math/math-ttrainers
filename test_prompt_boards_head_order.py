"""
Шапка списка досок: самым верхним рядом — «К тренажёрам» и название
раздела, под ними — переключатель «Основные доски / Все доски и
презентации / Презентации», под ним — ряд кнопок («Создать доску», …,
«Ещё»), прижатый к левому краю.

Проверяем порядок в разметке и на экране (переключатель ниже шапки и не
наезжает на неё), а также что переключатель по-прежнему работает.
"""
from test_prompt_boards_trash import local_server, BASE, sync_playwright, FAKE_SB_JS, BOOT_JS

W, H = 1200, 700


def main():
    with local_server(), sync_playwright() as p:
        b = p.chromium.launch()
        page = b.new_page(viewport={"width": W, "height": H})
        page.goto(f"{BASE}/boards.html")
        page.wait_for_timeout(500)
        # список виден только после входа — сервер подменён заглушкой
        page.evaluate(FAKE_SB_JS)
        page.evaluate(BOOT_JS)
        page.wait_for_selector("#blKindSwitch", state="visible")
        r = page.evaluate("""() => {
          const head = document.querySelector('.bl-main .bl-head');
          const kind = document.getElementById('blKindSwitch');
          const back = document.getElementById('blToIndex');
          const main = document.querySelector('.bl-main');
          return {
            firstIsHead: main.firstElementChild === head,
            kindAfterHead: !!(head.compareDocumentPosition(kind) & Node.DOCUMENT_POSITION_FOLLOWING),
            backTop: back.getBoundingClientRect().top,
            headBottom: head.getBoundingClientRect().bottom,
            kindTop: kind.getBoundingClientRect().top,
            kindBottom: kind.getBoundingClientRect().bottom,
            kindLeft: kind.getBoundingClientRect().left,
            actsAfterKind: !!(kind.compareDocumentPosition(document.querySelector('.bl-head-actions')) & Node.DOCUMENT_POSITION_FOLLOWING),
            actsTop: document.querySelector('.bl-head-actions').getBoundingClientRect().top,
            createLeft: document.getElementById('blCreateBoard').getBoundingClientRect().left,
          };
        }""")
        assert r["firstIsHead"], r
        assert r["kindAfterHead"], r
        assert r["backTop"] < r["kindTop"], r
        assert r["kindTop"] >= r["headBottom"], f"переключатель наезжает на шапку: {r}"
        assert r["actsAfterKind"] and r["actsTop"] >= r["kindBottom"], f"ряд кнопок не под переключателем: {r}"
        assert abs(r["createLeft"] - r["kindLeft"]) <= 4, f"ряд кнопок не прижат влево: {r}"
        print("ok порядок:", r)
        page.click('#blKindSwitch [data-kind="decks"]')
        assert page.get_attribute('#blKindSwitch [data-kind="decks"]', "aria-selected") == "true"
        page.click('#blKindSwitch [data-kind="boards"]')
        assert page.get_attribute('#blKindSwitch [data-kind="boards"]', "aria-selected") == "true"
        print("ok переключатель работает")
        b.close()
    print("PASS")


if __name__ == "__main__":
    main()
