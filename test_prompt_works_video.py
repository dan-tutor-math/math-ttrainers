"""
«Видео в работах»: учитель добавляет в работу видео с платформы (весь ролик
или главу-отрывок), ученик смотрит его в нашем плеере над заданием, учитель
в результатах видит, кто открыл и сколько посмотрел.

Заглушка Supabase и помощники — из теста этапа 1 (её work_save_answer
повторяет works-schema.sql: видео — блок без ответа, «досмотрел» не
откатывается, после сдачи видео отмечается). Права в настоящей базе —
test_prompt15_works_schema.py, раздел N.

Видео в Chromium из playwright не играет (нет H.264), поэтому hls.js
подменён заглушкой: она записывает, с какой секунды плеер начал
(startPosition), а «просмотр» тест ведёт сам — зовёт onTime, который
страница работы отдала плееру, как это делал бы настоящий timeupdate.

Проверяет:
  A. конструктор: в каталоге раздел «Видео с платформы» (и при поиске
     «шины»); карточки роликов с главами; обложка — предпросмотр в плеере
     с начала главы; работу из одних видео не сохранить; видео в листе без
     номера, задания — 1, 2; ↑↓ двигают видео; в варианте 2 — те же видео
     (src на образец); сохранение;
  B. ученик (телефон 390): над заданием 1 — его видео-отрывок, номера только
     у заданий; «Смотреть» открывает плеер с начала главы; проигранное
     засчитывается, перемотка — нет; 51 % → «Посмотрено 51%», в базе
     pending; досмотрел до 90 % → «✓ Досмотрено», в базе ok; видео после
     последнего задания — под ним; «Списком» — оба видео на местах; время
     задания не идёт, пока открыт плеер; после сдачи — видео в итоге,
     досмотреть можно, отметка доходит до базы;
  C. результаты у учителя: столбцы ▶1 ▶2, «досмотрел» и доля, подробности;
     счёт — только по заданиям;
  D. старый вызов VideoPlayer.open(v) без отрывка — как раньше, с места
     остановки;
  E. телефон 320 без прокрутки вбок; нет ошибок JavaScript.

Запуск: python3 test_prompt_works_video.py
"""
import json
import os
import sys

from test_prompt15_works_stage1 import (
    BASE, TEACHER, local_server, sync_playwright, new_context, watch_errors, db,
    open_in_frame, back_to_catalog,
)

FAILS = []


def check(name, cond, extra=""):
    print(("[OK] " if cond else "[FAIL] ") + name + (f" — {extra}" if extra and not cond else ""))
    if not cond:
        FAILS.append(name)


# hls.js-заглушка: Chromium из playwright H.264 не играет, а cdnjs в тестах
# закрыт. Запоминает адрес и стартовую секунду, «разбирает плейлист» сразу
FAKE_HLS = r"""
window.Hls = class {
  constructor(cfg){ window.__hlsStart = cfg.startPosition; this.h = {}; this.levels = []; this.currentLevel = -1; this.autoLevelEnabled = true; }
  static isSupported(){ return true; }
  on(e, cb){ this.h[e] = cb; }
  loadSource(u){ window.__hlsSrc = u; }
  attachMedia(){ setTimeout(() => { if (this.h.hlsManifestParsed) this.h.hlsManifestParsed(); }, 0); }
  startLoad(){} recoverMediaError(){} destroy(){ window.__hlsDestroyed = (window.__hlsDestroyed || 0) + 1; }
};
window.Hls.Events = { ERROR: 'hlsError', MANIFEST_PARSED: 'hlsManifestParsed', LEVEL_SWITCHED: 'hlsLevelSwitched' };
window.Hls.ErrorTypes = { NETWORK_ERROR: 'networkError', MEDIA_ERROR: 'mediaError' };
"""

# перехват open: тест сам ведёт «просмотр» через onTime, который страница отдала плееру
WRAP_OPEN = """() => { if (window.__vpWrapped) return; window.__vpWrapped = true;
  const o = VideoPlayer.open; VideoPlayer.open = (v, opts) => { window.__vpOpts = opts || null; window.__vpVideo = v; return o(v, opts); }; }"""


def play(page, t0, t1, step=0.5):
    """«Проиграть» отрывок t0 → t1: onTime с шагом step, как timeupdate."""
    page.evaluate(f"""() => {{ const o = window.__vpOpts; let t = {t0};
        while (t <= {t1} + 1e-9) {{ o.onTime(t, true); t = Math.round((t + {step}) * 1000) / 1000; }} }}""")


def ans_db(tid):
    rows = [a for a in db()["work_answers"] if a["task_id"] == tid]
    return rows[0] if rows else None


def wait_flush(page):
    page.wait_for_function("() => window.__work.queue.length === 0", timeout=15000)
    page.wait_for_timeout(200)


def run():
    errors = []
    with local_server(), sync_playwright() as p:
        browser = p.chromium.launch()

        # ═══ A. конструктор ═══
        print("\n— A. конструктор")
        tctx = new_context(browser, viewport={"width": 1440, "height": 950})
        tctx.add_init_script(FAKE_HLS)
        tp = tctx.new_page()
        watch_errors(tp, errors, "works")
        tp.goto(f"{BASE}/works.html")
        tp.wait_for_selector("#scrAuth:not([hidden])")
        tp.fill("#auEmail", TEACHER["email"]); tp.fill("#auPass", TEACHER["password"]); tp.click("#auGo")
        tp.wait_for_selector("#scrList:not([hidden])")
        tp.click("#newWork"); tp.wait_for_selector("#scrEdit:not([hidden])")
        tp.fill("#wkTitle", "Шины с разбором")

        vid_item = tp.locator(".cat-item.vid")
        check("A1 в каталоге раздел «Видео с платформы», роликов 2",
              vid_item.count() == 1 and vid_item.locator(".eq").inner_text() == "2", str(vid_item.count()))
        tp.fill("#catSearch", "шины")
        check("A2 поиск по названию ролика оставляет раздел видео", tp.locator(".cat-item.vid").count() == 1)
        tp.fill("#catSearch", "")
        tp.click(".cat-item.vid")
        tp.wait_for_selector("#vidList:not([hidden]) .vcard")
        cards = tp.locator(".vcard")
        tire = tp.locator('.vcard[data-slug="oge1-5-tire-razbor"]')
        check("A3 две карточки роликов, кадр тренажёра закрыт",
              cards.count() == 2 and tp.is_hidden("#frameWrap") and tp.is_hidden("#catList"), str(cards.count()))
        opts = tire.locator("select option").all_inner_texts()
        check("A4 выбор отрывка: «Весь ролик» и 8 глав со временем", len(opts) == 9 and opts[0] == "Весь ролик"
              and opts[3] == "3:10 — Задание 1 — ширина шины", str(opts[:4]))
        check("A5 у ролика длительность на обложке", tire.locator(".dur").inner_text() == "21:49", tire.locator(".dur").inner_text())

        tire.locator("select").select_option("2")
        tire.locator(".vposter").click()
        tp.wait_for_selector(".vp-overlay")
        tp.wait_for_function("() => window.__hlsStart !== undefined")
        check("A6 обложка — предпросмотр в плеере с начала главы (190 с)", tp.evaluate("window.__hlsStart") == 190,
              str(tp.evaluate("window.__hlsStart")))
        tp.evaluate("VideoPlayer.close()")

        tire.locator(".btn").click()
        tp.locator('.vcard[data-slug="oge8-stepeni-korni-razbor"] .btn').click()
        bl = tp.evaluate("() => window.__works.E.blocks")
        check("A7 два видео в работе: отрывок шин 190–268 и весь ролик №8",
              len(bl) == 2 and bl[0]["type"] == "video" and bl[0]["from"] == 190 and bl[0]["to"] == 268
              and bl[0]["chapter"] == "Задание 1 — ширина шины" and bl[1]["from"] == 0 and bl[1]["to"] is None
              and bl[1]["video"]["hls_url"].endswith("master.m3u8"), json.dumps(bl, ensure_ascii=False)[:300])
        tp.click("#wkSave")
        tp.wait_for_timeout(300)
        check("A8 работу из одних видео не сохранить", "задание" in tp.inner_text("#toast") and not db()["works"], tp.inner_text("#toast"))
        check("A9 «+ Новый вариант» без заданий неактивна", tp.is_disabled("#varAdd"))

        back_to_catalog(tp)
        check("A10 «← Тренажёры» возвращает каталог", tp.is_visible("#catList") and tp.is_hidden("#vidList"))
        open_in_frame(tp, "oge6", "document.querySelectorAll('.mode-card:not(.soon)')[2].click()")
        tp.click("#addBtn")
        tp.wait_for_function("() => window.__works.E.blocks.length >= 3", timeout=40000)
        tp.wait_for_function("() => !document.getElementById('addBtn').disabled", timeout=20000)
        tp.click("#refreshBtn2"); tp.wait_for_timeout(400)
        tp.click("#addBtn")
        tp.wait_for_function("() => window.__works.E.blocks.length >= 4", timeout=40000)
        tp.wait_for_function("() => !document.getElementById('addBtn').disabled", timeout=20000)
        # видео №8 — вниз дважды: после последнего задания
        for _ in range(2):
            tp.locator(".ti.vi").nth(1).locator('[data-a="down"]').click()
        order = tp.evaluate("() => window.__works.E.blocks.map(b => b.type)")
        check("A11 ↓ двигает видео: видео, задание, задание, видео", order == ["video", "task", "task", "video"], str(order))
        nums = tp.locator("#wkTasks .ti-num").all_inner_texts()
        check("A12 номера только у заданий, у видео — ▶", nums == ["▶", "1", "2", "▶"], str(nums))
        check("A13 счётчик «(2 + видео: 2)»", tp.inner_text("#wkCount") == "(2 + видео: 2)", tp.inner_text("#wkCount"))
        names = tp.locator(".ti.vi .ti-name").all_inner_texts()
        if os.environ.get("SHOT"): tp.screenshot(path=os.environ["SHOT"] + "/teacher.png")
        check("A14 подписи видео: над следующим заданием / после последнего",
              names == ["У ученика — над следующим заданием", "У ученика — после последнего задания"], str(names))

        tp.click("#varAdd")
        tp.wait_for_function("() => window.__works.gens.size === 0 && window.__works.E.variants[1].blocks.every(b => !b._gen)", timeout=90000)
        v2 = tp.evaluate("() => window.__works.E.variants[1].blocks.map(b => ({ type: b.type, src: b.src, slug: b.slug, from: b.from }))")
        m = tp.evaluate("() => window.__works.E.blocks.map(b => b.id)")
        check("A15 в варианте 2 те же видео на тех же местах, связь src с образцом",
              [x["type"] for x in v2] == order and v2[0]["src"] == m[0] and v2[0]["slug"] == "oge1-5-tire-razbor"
              and v2[0]["from"] == 190 and v2[3]["src"] == m[3], json.dumps(v2)[:300])
        check("A16 в варианте у видео нет ⟳ и ✕", tp.locator(".ti.vi [data-a]").count() == 0)
        tp.click('#wkVariants button[data-v="0"]')
        tp.click("#wkSave")
        tp.wait_for_function("() => document.getElementById('wkSaved').textContent.indexOf('Сохранено') === 0", timeout=60000)
        saved = db()["work_variants"]
        v1 = [v for v in saved if v["num"] == 1][0]
        check("A17 сохранено: видео в blocks без служебных полей",
              [b["type"] for b in v1["blocks"]] == order and not any(k.startswith("_") for b in v1["blocks"] for k in b))
        wlist = tp.evaluate("() => { location.hash = '#/'; return true; }")
        tp.wait_for_selector("#scrList:not([hidden]) .wcard")
        check("A18 в списке работ «Заданий: 2 · видео: 2»", "Заданий: 2 · видео: 2" in tp.inner_text(".wcard .wm"), tp.inner_text(".wcard .wm"))
        link = f"{BASE}/work.html?c={v1['code']}"
        vA, tA1, tA2, vB = [b["id"] for b in v1["blocks"]]

        # ═══ B. ученик ═══
        print("\n— B. ученик")
        sctx = new_context(browser, viewport={"width": 390, "height": 844}, is_mobile=True, has_touch=True)
        sctx.add_init_script(FAKE_HLS)
        sp = sctx.new_page()
        watch_errors(sp, errors, "work")
        sp.goto(link)
        sp.wait_for_selector("#scrStart:not([hidden])")
        check("B1 на старте «Заданий: 2» — видео не задания", "Заданий: 2" in sp.inner_text("#startMeta"), sp.inner_text("#startMeta"))
        sp.fill("#wName", "Оля"); sp.click("#wStart")
        sp.wait_for_selector("#scrTask:not([hidden]) .titem")
        check("B2 номера только у заданий", sp.locator("#wNums .num").count() == 2)
        card = sp.locator(f'.titem.cur .wvids:not(.after) .wvid[data-vid="{vA}"]')
        check("B3 над заданием 1 — его видео-отрывок", card.count() == 1 and sp.locator(".titem.cur .wvid").count() == 1)
        check("B4 видео идёт до задания на странице",
              sp.evaluate("() => { const t = document.querySelector('.titem.cur'); return t.querySelector('.wvids').compareDocumentPosition(t.querySelector('.tc-zone')) & 4; }") == 4)
        check("B5 на карточке глава и длина отрывка", "Видеоразбор · «Задание 1 — ширина шины» · 1:18" in card.locator(".vk").inner_text(), card.locator(".vk").inner_text())
        if os.environ.get("SHOT"): sp.screenshot(path=os.environ["SHOT"] + "/student.png")
        check("B6 «Учитель просит посмотреть»", card.locator(".vst").inner_text() == "Учитель просит посмотреть", card.locator(".vst").inner_text())

        sp.evaluate(WRAP_OPEN)
        card.locator(".btn").click()
        sp.wait_for_selector(".vp-overlay")
        sp.wait_for_function("() => window.__hlsStart !== undefined")
        check("B7 «Смотреть» — плеер с начала главы", sp.evaluate("window.__hlsStart") == 190, str(sp.evaluate("window.__hlsStart")))
        wait_flush(sp)
        a = ans_db(vA)
        check("B8 открыл — уже отметка в базе (0 %)", a and a["status"] == "pending" and a["value"]["w"] == 0 and a["value"]["d"] == 78, str(a))
        tm0 = sp.evaluate("() => window.__work.S.taskMs")
        sp.wait_for_timeout(2300)
        check("B9 пока открыт плеер, время задания не идёт", sp.evaluate("() => window.__work.S.taskMs") == tm0)
        play(sp, 190, 230)
        sp.evaluate("() => window.__vpOpts.onTime(260, true)")   # перемотка вперёд — не засчитывается
        sp.evaluate("() => window.__vpOpts.onTime(261, true)")
        sp.evaluate("VideoPlayer.close()")
        wait_flush(sp)
        a = ans_db(vA)
        check("B10 засчитано 41 с проигранного, перемотка — нет", a and a["value"]["w"] == 41 and a["status"] == "pending", str(a))
        check("B11 на карточке «Посмотрено 53%»", card.locator(".vst").inner_text() == "Посмотрено 53%", card.locator(".vst").inner_text())

        card.locator(".btn").click()
        sp.wait_for_selector(".vp-overlay")
        play(sp, 230, 262)
        wait_flush(sp)
        a = ans_db(vA)
        check("B12 до 90 % — «досмотрел» в базе, не дожидаясь закрытия", a and a["status"] == "ok" and a["value"]["w"] >= 71, str(a))
        sp.evaluate("VideoPlayer.close()")
        check("B13 на карточке «✓ Досмотрено»", card.locator(".vst").inner_text() == "✓ Досмотрено" and "seen" in card.get_attribute("class"))

        sp.click('#wNums .num[data-i="1"]')
        sp.wait_for_function("() => window.__work.S.cur === 1")
        check("B14 у задания 2: видео №8 под заданием, видео шин нет",
              sp.locator(f'.titem.cur .wvids.after .wvid[data-vid="{vB}"]').count() == 1 and sp.locator(f'.wvid[data-vid="{vA}"]').count() == 0)
        if sp.is_visible("#wView"):
            sp.click('#wView button[data-v="list"]')
            sp.wait_for_function("() => document.querySelectorAll('.titem').length === 2")
            pos = sp.evaluate(f"""() => {{ const it = [...document.querySelectorAll('.titem')];
                return [!!it[0].querySelector('.wvid[data-vid="{vA}"]'), !!it[1].querySelector('.wvids.after .wvid[data-vid="{vB}"]'),
                        document.querySelectorAll('.wvid').length]; }}""")
            check("B15 «Списком»: видео шин у задания 1, №8 — после задания 2", pos == [True, True, 2], str(pos))
            check("B16 досмотренное помнится в списке", sp.locator(f'.wvid[data-vid="{vA}"] .vst').inner_text() == "✓ Досмотрено")
            sp.click('#wView button[data-v="one"]')
        sp.reload()
        sp.wait_for_selector("#scrTask:not([hidden]) .titem")
        sp.click('#wNums .num[data-i="0"]')
        check("B17 после перезагрузки «✓ Досмотрено»", sp.locator(f'.wvid[data-vid="{vA}"] .vst').inner_text() == "✓ Досмотрено")

        sp.click("#wFinish"); sp.click("#wConfirmYes")
        sp.wait_for_selector("#scrDone:not([hidden])")
        items = sp.locator(".res-item.vid")
        check("B18 в итоге оба видео, счёт — по заданиям", items.count() == 2 and "из 2" in sp.inner_text("#dScore"), sp.inner_text("#dScore"))
        check("B19 в итоге: шины досмотрены, №8 не открывал", "Досмотрено" in items.nth(0).inner_text() and "Не открывал" in items.nth(1).inner_text())
        sp.evaluate(WRAP_OPEN)
        sp.evaluate("() => { window.__hlsStart = undefined; }")
        items.nth(1).locator(".btn").click()
        sp.wait_for_selector(".vp-overlay")
        sp.wait_for_function("() => window.__hlsStart !== undefined")
        check("B20 весь ролик — с нуля", sp.evaluate("window.__hlsStart") in (-1, 0), str(sp.evaluate("window.__hlsStart")))
        play(sp, 0, 120)
        sp.evaluate("VideoPlayer.close()")
        wait_flush(sp)
        a = ans_db(vB)
        check("B21 после сдачи видео досмотреть можно — отметка в базе", a and a["value"]["w"] == 120 and a["value"]["d"] == 4108, str(a))
        check("B22 итог обновился: «Посмотрено 3%»", "Посмотрено 3%" in sp.locator(".res-item.vid").nth(1).inner_text(), sp.locator(".res-item.vid").nth(1).inner_text())
        check("B23 сдача не сломалась (ответ на задание после сдачи не принят бы)", sp.is_visible("#scrDone"))

        # ═══ C. результаты ═══
        print("\n— C. результаты")
        wid = db()["works"][0]["id"]
        tp.evaluate(f"() => {{ location.hash = '#/results/{wid}'; }}")
        tp.wait_for_selector("#scrResults:not([hidden]) table.res tbody tr")
        heads = tp.locator("table.res thead th").all_inner_texts()
        check("C1 столбцы: задания 1, 2 и видео ▶1, ▶2", heads[3:7] == ["1", "2", "▶1", "▶2"], str(heads))
        cells = tp.locator("table.res tbody tr").first.locator(".cell.vid")
        check("C2 шины — «досмотрел» ✓, №8 — доля 3%",
              cells.count() == 2 and cells.nth(0).inner_text() == "✓" and "ok" in cells.nth(0).get_attribute("class")
              and cells.nth(1).inner_text() == "3%", str(cells.all_inner_texts()))
        if os.environ.get("SHOT"): tp.screenshot(path=os.environ["SHOT"] + "/results.png")
        check("C3 счёт — только по заданиям (… / 2)", tp.locator("table.res tbody td.score").inner_text().endswith("/ 2"))
        cells.nth(0).click()
        det = tp.inner_text("#rsDetail")
        check("C4 подробности: досмотрел, 1:18 отрывка", "Досмотрел(а)" in det and "из 1:18" in det and "Задание 1 — ширина шины" in det, det)
        cells.nth(1).click()
        check("C5 подробности №8: «Открывал(а), не досмотрел(а)», 2:00", "не досмотрел" in tp.inner_text("#rsDetail") and "посмотрено 2:00" in tp.inner_text("#rsDetail"), tp.inner_text("#rsDetail"))

        # ═══ D. старый вызов плеера ═══
        print("\n— D. плеер без отрывка")
        tp.evaluate("() => { localStorage.setItem('videoPos:oge8-stepeni-korni-razbor', JSON.stringify({ t: 500, at: Date.now() })); window.__hlsStart = undefined; }")
        tp.evaluate("() => VideoPlayer.open(VIDEO_LINKS.videos[1])")
        tp.wait_for_function("() => window.__hlsStart !== undefined")
        check("D1 open(v) без отрывка — с места остановки, как раньше", tp.evaluate("window.__hlsStart") == 500, str(tp.evaluate("window.__hlsStart")))
        tp.evaluate("VideoPlayer.close()")
        tp.evaluate("() => { window.__hlsStart = undefined; VideoPlayer.open(VIDEO_LINKS.videos[1], { start: 400, end: 900 }); }")
        tp.wait_for_function("() => window.__hlsStart !== undefined")
        check("D2 место остановки внутри отрывка — продолжает с него", tp.evaluate("window.__hlsStart") == 500)
        tp.evaluate("VideoPlayer.close()")
        tp.evaluate("() => { window.__hlsStart = undefined; VideoPlayer.open(VIDEO_LINKS.videos[1], { start: 1000, end: 1200 }); }")
        tp.wait_for_function("() => window.__hlsStart !== undefined")
        check("D3 место остановки вне отрывка — с начала отрывка", tp.evaluate("window.__hlsStart") == 1000)
        tp.evaluate("VideoPlayer.close()")

        # ═══ E. вёрстка и ошибки ═══
        print("\n— E. вёрстка")
        nctx = new_context(browser, viewport={"width": 320, "height": 700}, is_mobile=True, has_touch=True)
        np_ = nctx.new_page()
        watch_errors(np_, errors, "work-320")
        code2 = [v for v in db()["work_variants"] if v["num"] == 2][0]["code"]
        np_.goto(f"{BASE}/work.html?c={code2}")
        np_.wait_for_selector("#scrStart:not([hidden])")
        np_.fill("#wName", "Петя"); np_.click("#wStart")
        np_.wait_for_selector(".titem .wvid")
        ov = np_.evaluate("() => document.documentElement.scrollWidth - document.documentElement.clientWidth")
        check("E1 вариант 2 на телефоне 320: видео на месте, без прокрутки вбок", ov <= 0, str(ov))
        check("E2 нет ошибок JavaScript", not errors, "; ".join(errors[:5]))
        browser.close()

    print()
    if FAILS:
        print(f"ПРОВАЛЕНО: {len(FAILS)}")
        for f in FAILS:
            print("  - " + f)
        sys.exit(1)
    print("Все проверки пройдены")


if __name__ == "__main__":
    run()
