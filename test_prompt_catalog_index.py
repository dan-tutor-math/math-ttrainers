"""
Индекс каталога (catalog-index*.json) совпадает с живыми страницами: ловит банк,
перевыгруженный без пересборки индекса. Пересобрать: tools/build_catalog_index.py

Запуск: ~/.venvs/trainers/bin/python test_prompt_catalog_index.py
"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent / "tools"))
import build_catalog_index as B
from playwright.sync_api import sync_playwright

fails = []


def check(cond, msg, extra=""):
    print(("OK   " if cond else "FAIL ") + msg + (f"  [{extra}]" if extra and not cond else ""))
    if not cond:
        fails.append(msg)


def main():
    disk = B.load_on_disk()
    check(len(disk) > 0, "индекс на диске не пустой")
    check(all(set(v) == {"title", "protos"} for v in disk.values()), "у записей поля title и protos")
    check(all(set(p) == {"id", "title", "fipi", "hasGen"} for v in disk.values() for p in v["protos"]),
          "у прототипов поля id, title, fipi, hasGen")
    for name in sorted(p.name for p in B.ROOT.glob("catalog-index*.json")):
        check((B.ROOT / name).stat().st_size <= B.LIMIT, f"{name} не больше 300 КБ")

    srv = B.server()
    try:
        with sync_playwright() as p:
            browser = p.chromium.launch()
            seen = 0
            for slug in B.PAGES:
                live = B.extract_page(browser, slug)
                if live is None:
                    check(not any(k.startswith(slug + "|") for k in disk), f"{slug}: каталога нет — и записей нет")
                    continue
                seen += 1
                mine = {k: v for k, v in disk.items() if k.startswith(slug + "|")}
                check(mine == live, f"{slug}: индекс совпадает с list() страницы",
                      f"ключи диска {len(mine)}, живые {len(live)}")
            check(seen > 0, "хотя бы одна страница с каталогом")
            browser.close()
    finally:
        srv.kill()
    if fails:
        sys.exit(1)
    print("ГОТОВО")


if __name__ == "__main__":
    main()
