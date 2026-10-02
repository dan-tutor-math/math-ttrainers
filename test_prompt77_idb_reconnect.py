"""
Промпт №77: «Доска не сохраняется (UnknownError)» у ученицы на iPad.

Место было (браузер отводил ~39 ГБ, занято ~112 МБ), то есть дело не в
объёме. Safari держит IndexedDB в отдельном процессе; когда вкладка постоит
в фоне, а система этот процесс выгрузит или перезапустит, открытое
соединение молча умирает: транзакции на нём падают с UnknownError
(«Connection to Indexed Database server lost») или InvalidStateError.
Доски открывали соединение один раз на всю жизнь страницы — после обрыва не
проходило ни одно сохранение до перезагрузки. Теперь мёртвое соединение
выбрасывается, открывается новое, операция повторяется один раз.

Настоящий обрыв процесса Safari из песочницы не устроить, поэтому две
имитации на Chromium:
  - соединение закрыто (db.close()) — транзакция бросает InvalidStateError,
    ровно как на умершем соединении;
  - transaction у текущего соединения бросает UnknownError с тем же текстом,
    что пишет Safari.
Проверяем:
  1. После «умершего» соединения штрих сохраняется на диск, плашки нет
  2. То же для UnknownError
  3. Хранилище сломано всерьёз (каждое новое соединение тоже падает) —
     плашка показывается, повтор один, без бесконечного цикла
  4. Хранилище ожило — следующее сохранение снимает плашку
  5. Не «обрывная» ошибка (QuotaExceededError) не повторяется и не глотается
  6. Текст плашки: у общей доски — «записи уходят в облако и не потеряются»,
     у обычной — «выгрузите эту доску в файл»
  7. Чтение (idbGet) тоже переживает обрыв
"""
import sys

from playwright.sync_api import sync_playwright

from test_prompt69_board_tools import local_server as local_server_69, open_board
from test_prompt10_shared_board_load import (
    local_server as local_server_10, open_shared, pen, LOADED,
)

ADD_AND_SAVE = """(id) => { const B = window.getCurrentBoard();
    B.objects.push({ id, type: 'pen', color: '--pencil', width: 2, points: [{x: 10, y: 10}, {x: 50, y: 40}] });
    window.saveDB(); }"""

# что реально лежит на диске — отдельным соединением, мимо кода досок
DISK_IDS = """(boardId) => new Promise(res => {
    const r = indexedDB.open('ogeBoardsDB', 1);
    r.onsuccess = () => { const db = r.result;
      const q = db.transaction('state').objectStore('state').get('boarddata:' + boardId);
      q.onsuccess = () => { res((q.result && q.result.objects || []).map(o => o.id)); db.close(); }; };
})"""

BANNER = "() => { const b = document.getElementById('saveFailBanner'); return b ? document.getElementById('saveFailText').textContent : null; }"

# соединение досок «умирает» так, как в Safari: следующая транзакция бросает
KILL_CLOSE = "() => idbOpen().then(db => { db.close(); return true; })"
KILL_UNKNOWN = """() => idbOpen().then(db => {
    db.transaction = () => { throw new DOMException('Connection to Indexed Database server lost. Refresh the page to try again', 'UnknownError'); };
    return true; })"""

# хранилище сломано целиком: любая транзакция на любом соединении бросает
BREAK_ALL = """(name) => { window.__txCalls = 0;
    window.__origTx = window.__origTx || IDBDatabase.prototype.transaction;
    IDBDatabase.prototype.transaction = function(){ window.__txCalls++;
      throw new DOMException('сломано (тест)', name); }; }"""
HEAL_ALL = "() => { if (window.__origTx) IDBDatabase.prototype.transaction = window.__origTx; }"


def run():
    failures = []

    def check(cond, label, extra=""):
        print(("[OK] " if cond else "[FAIL] ") + label + (("  — " + str(extra)) if (extra and not cond) else ""))
        if not cond:
            failures.append(label)

    with sync_playwright() as p:
        browser = p.chromium.launch()

        with local_server_69():
            ctx = browser.new_context()
            errors = []
            page = open_board(ctx, errors=errors)
            page.wait_for_timeout(500)

            # ── 1. закрытое («умершее») соединение ───────────────────────
            page.evaluate(KILL_CLOSE)
            page.evaluate(ADD_AND_SAVE, "s1")
            page.wait_for_timeout(900)
            check(page.evaluate(BANNER) is None, "1. соединение умерло — плашки «не сохраняется» нет",
                  page.evaluate(BANNER))
            check("s1" in page.evaluate(DISK_IDS, "bA"), "1. штрих после обрыва лёг на диск")
            page.evaluate(ADD_AND_SAVE, "s1b")
            page.wait_for_timeout(900)
            check("s1b" in page.evaluate(DISK_IDS, "bA"), "1. и следующие штрихи сохраняются (новое соединение в работе)")

            # ── 2. UnknownError, как в Safari ────────────────────────────
            page.evaluate(KILL_UNKNOWN)
            page.evaluate(ADD_AND_SAVE, "s2")
            page.wait_for_timeout(900)
            check(page.evaluate(BANNER) is None, "2. UnknownError «Connection … lost» — плашки нет", page.evaluate(BANNER))
            check("s2" in page.evaluate(DISK_IDS, "bA"), "2. штрих после UnknownError лёг на диск")

            # ── 7. чтение тоже переживает обрыв ──────────────────────────
            page.evaluate(KILL_CLOSE)
            got = page.evaluate("() => idbGet('boarddata:bA').then(v => (v && v.objects || []).length, e => 'ошибка: ' + e.name)")
            check(isinstance(got, int) and got >= 3, "7. чтение после обрыва проходит", got)

            # ── 3. сломано всерьёз — плашка, один повтор, без цикла ──────
            page.evaluate(BREAK_ALL, "UnknownError")
            page.evaluate(ADD_AND_SAVE, "s3")
            page.wait_for_timeout(900)
            calls = page.evaluate("() => window.__txCalls")
            text = page.evaluate(BANNER)
            check(text is not None and "UnknownError" in text, "3. хранилище сломано — плашка «не сохраняется» есть", text)
            page.wait_for_timeout(1500)
            check(page.evaluate("() => window.__txCalls") == calls, "3. после сбоя не крутится в цикле", calls)
            check(text is not None and "выгрузите эту доску в файл" in text, "6. у обычной доски — совет выгрузить в файл", text)

            # ── 4. ожило — следующее сохранение снимает плашку ───────────
            page.evaluate(HEAL_ALL)
            page.evaluate(ADD_AND_SAVE, "s4")
            page.wait_for_timeout(900)
            check(page.evaluate(BANNER) is None, "4. хранилище ожило — плашка ушла сама")
            disk = page.evaluate(DISK_IDS, "bA")
            check("s3" in disk and "s4" in disk, "4. и несохранённое при сбое дописалось", disk)

            # ── 5. настоящая (не обрывная) ошибка не повторяется ─────────
            page.evaluate(BREAK_ALL, "QuotaExceededError")
            page.evaluate(ADD_AND_SAVE, "s5")
            page.wait_for_timeout(900)
            # одно сохранение — несколько операций хранилища (индекс, снимок…);
            # при обрыве каждая повторяется ровно один раз, при Quota — ни одна
            q_calls = page.evaluate("() => window.__txCalls")
            check(q_calls >= 1 and calls == 2 * q_calls,
                  "3/5. обрыв — каждая операция повторена ровно один раз, QuotaExceededError — без повтора",
                  (calls, q_calls))
            check(page.evaluate(BANNER) is not None, "5. QuotaExceededError — плашка показана")
            page.evaluate(HEAL_ALL)
            check(not errors, "без ошибок на странице", errors)
            page.close()
            ctx.close()

        # ── 6. общая доска — спокойный текст ─────────────────────────────
        with local_server_10():
            ctx = browser.new_context()
            page = open_shared(ctx, "T", [pen(1)], [pen(1)])
            page.evaluate(BREAK_ALL, "UnknownError")
            # жест так, как его видит облачный модуль: начало, правка, сохранение, отпускание
            page.evaluate("() => window.pushUndo()")
            page.evaluate(ADD_AND_SAVE, "c1")
            page.evaluate("() => window.dispatchEvent(new Event('pointerup'))")
            page.wait_for_timeout(1500)
            text = page.evaluate(BANNER)
            check(text is not None and "записи уходят в облако и не потеряются" in text,
                  "6. у общей доски — «записи уходят в облако и не потеряются»", text)
            check(text is not None and "выгрузите эту доску в файл" not in text,
                  "6. у общей доски нет пугающего «выгрузите, иначе потеряется»", text)
            check("c1" in page.evaluate("() => Array.from(window.__fake.rows.keys())"),
                  "6. штрих на общей доске ушёл в облако, хотя на диск не лёг")
            page.evaluate(HEAL_ALL)
            page.close()
            ctx.close()
        browser.close()

    print()
    if failures:
        print("ПРОВАЛЕНО:", len(failures))
        for f in failures:
            print(" -", f)
        sys.exit(1)
    print("Все проверки пройдены")


if __name__ == "__main__":
    run()
