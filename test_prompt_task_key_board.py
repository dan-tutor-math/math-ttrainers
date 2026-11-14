"""
А1, ключ задания на доске: объект, добавленный из панели тренажёров, получает
поле tkey (trainerTaskKey → task-key.js), не завися от рецепта gen.

Проверяет:
  1. русский (rus_oge, №6): tkey = fipi:rus:<id>, при этом gen у объекта НЕТ —
     «ещё такое же» у фиксированного задания не включается;
  2. ОГЭ (oge6, задание ФИПИ): tkey = fipi:oge:<номер>, gen есть;
  3. ОГЭ №6, демоверсия (не из банка): tkey = gen:oge6:demo2027.
Совместный режим не затронут (в сессию tkey не уходит).

Запуск: python3 test_prompt_task_key_board.py (сервер поднимается сам).
"""
import sys

from playwright.sync_api import sync_playwright

import test_prompt_rus_board_check as R

RUS_READY = R.RUS_READY


def main():
    T = R.load_rus()
    with R.local_server(), sync_playwright() as p:
        browser = p.chromium.launch()
        ctx = browser.new_context()
        page, errors = R.open_board(ctx)

        t = next(x for x in T if x["n"] == 6 and x.get("ok"))
        R.open_trainer(page, "rus6", f"rus_oge.html?n=6&t={t['id']}", RUS_READY)
        o = R.add_to_board(page)
        R.check("русский: tkey = fipi:rus:<id задания>", o.get("tkey") == f"fipi:rus:{t['id']}", str(o.get("tkey")))
        R.check("русский: рецепта gen нет — «ещё такое же» не включается", "gen" not in o, str(list(o)))

        R.open_trainer(page, "oge6", "oge6.html", "!!d.querySelector('.mode-card')",
                       prep_js="document.querySelector('.mode-card[data-id=\"p1\"]').click()")
        o = R.add_to_board(page)
        fipi = (o.get("gen") or {}).get("snap", {}).get("curTask", {}).get("fipi")
        R.check("ОГЭ №6: tkey = fipi:oge:<номер ФИПИ>", bool(fipi) and o.get("tkey") == f"fipi:oge:{fipi}", f"{o.get('tkey')} / {fipi}")
        R.check("ОГЭ №6: рецепт gen на месте", bool(o.get("gen")), str(list(o)))

        R.open_trainer(page, "oge6", "oge6.html", "!!d.querySelector('.mode-card')",
                       prep_js="document.querySelector('.mode-card[data-id=\"demo2027\"]').click()")
        o = R.add_to_board(page)
        R.check("ОГЭ №6 демо: tkey = gen:oge6:demo2027", o.get("tkey") == "gen:oge6:demo2027", str(o.get("tkey")))
        R.check("без ошибок JS", not errors, str(errors[:1]))
        browser.close()
    print(f"\nИтого: {len(R.failures)} провалов")
    sys.exit(1 if R.failures else 0)


if __name__ == "__main__":
    main()
