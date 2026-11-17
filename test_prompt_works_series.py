"""
Этап 4 конструктора вариантов (задача 1, этап 1.3): группы заданий по
прототипу в работе — поле series у блока, рецепт gen.at, кнопки группы.

Заглушка Supabase и помощники — из теста этапа 1 работ.

Проверяет:
  A. window.__works.addSeries ×3 (ЕГЭ профиль №9 — два прототипа, ОГЭ ч. 2
     №20): задания сразу видны с «Создаётся задание…», потом заполняются;
     у каждого series {key, title, pos, fipi, total} и gen.at {proto, pos};
     три группы с заголовком «ЕГЭ №9 · … · ФИПИ 1–3 из N»;
     при листании картинки в хранилище не грузятся;
  B. «Следующие 3 ▶» — места 3–5, заголовок «ФИПИ 4–6»; задания — другие
     задачи банка (pid); «◀ Предыдущие 3» — снова 0–2, тем же снимком из кэша;
     «+ ещё» — четвёртое задание с местом 3; ввод номера и ◀ ▶ у задания;
     занятый номер — предупреждение, но ставится; ↑ группы — группа целиком
     выше и не разорвана; ✕ группы;
  C. сохранение: в базе series и gen.at на месте, картинки ушли в хранилище;
     повторное открытие работы — те же группы и места;
  D. ученик: работа по ссылке открывается, задания на месте (series страница
     ученика не читает);
  E. размер блока с live/exact в базе — для прикидки «ОГЭ × 4 варианта в 3 МБ»;
  F. нет ошибок JavaScript.

Запуск: python3 test_prompt_works_series.py
"""
import json
import sys

from test_prompt15_works_stage1 import (
    BASE, PORT, TEACHER, local_server, sync_playwright, new_context, watch_errors, db,
)

FAILS = []


def check(name, cond, extra=""):
    print(("[OK] " if cond else "[FAIL] ") + name + (f" — {extra}" if extra and not cond else ""))
    if not cond:
        FAILS.append(name)


def idle(page, timeout=90000):
    page.wait_for_function("() => window.__works.gens.size === 0", timeout=timeout)
    page.wait_for_timeout(150)


SER = """() => window.__works.E.blocks.map(b => b.series ? { key: b.series.key, pos: b.series.pos, fipi: b.series.fipi, total: b.series.total,
  title: b.series.title, at: b.gen && b.gen.at ? b.gen.at.pos : null, proto: b.gen && b.gen.at ? b.gen.at.proto : null,
  pid: b.gen ? b.gen.pid : null,
  // задание создано: снимок с картинкой или карточка ФИПИ (задача 63, у карточки картинок нет)
  img: !!(b.img && b.img.light && b.img.light.url) || b.type === 'card', gen: b._gen || null } : null)"""


def heads(page):
    return page.evaluate("() => [...document.querySelectorAll('#wkTasks .tg .tg-title')].map(e => e.textContent)")


def group_btn(page, gi, g):
    page.click(f"#wkTasks .tg:nth-of-type({gi + 1}) [data-g='{g}']")


def run():
    errors = []
    with local_server(), sync_playwright() as p:
        browser = p.chromium.launch()
        tctx = new_context(browser, viewport={"width": 1440, "height": 950})
        tp = tctx.new_page()
        watch_errors(tp, errors, "works")
        tp.goto(f"{BASE}/works.html")
        tp.wait_for_selector("#scrAuth:not([hidden])")
        tp.fill("#auEmail", TEACHER["email"]); tp.fill("#auPass", TEACHER["password"])
        tp.click("#auGo")
        tp.wait_for_selector("#scrList:not([hidden])")
        tp.click("#newWork")
        tp.wait_for_selector("#scrEdit:not([hidden])")

        # ═══ A. addSeries ×3 ═══
        print("\n— A. addSeries ×3")
        tp.evaluate("""async () => {
          await window.__works.addSeries({ tid: 'ege9', exam: 'ege', n: 9, proto: 'tangent', count: 3, source: 'order', startPos: 0 });
          window.__busyAfterAdd = document.querySelectorAll('#wkTasks .ti-gen').length;
          await window.__works.addSeries({ tid: 'ege9', exam: 'ege', n: 9, proto: 'marks', count: 3, source: 'order', startPos: 0 });
          await window.__works.addSeries({ tid: 'oge20', exam: 'oge', n: 20, proto: 'grouping', count: 3, source: 'order', startPos: 0 });
        }""")
        check("A1 задания видны сразу с «Создаётся задание…»", tp.evaluate("() => window.__busyAfterAdd") == 3,
              str(tp.evaluate("() => window.__busyAfterAdd")))
        idle(tp)
        s = tp.evaluate(SER)
        check("A2 девять заданий, все созданы и с картинкой", len(s) == 9 and all(x and x["img"] and not x["gen"] for x in s), json.dumps(s, ensure_ascii=False)[:600])
        check("A3 места 0–2 в каждой группе, gen.at = место", [x["pos"] for x in s] == [0, 1, 2] * 3 and all(x["at"] == x["pos"] for x in s), str([(x["pos"], x["at"]) for x in s]))
        check("A4 у групп разные ключи, прототип в gen.at", len({x["key"] for x in s}) == 3
              and [x["proto"] for x in s] == ["tangent"] * 3 + ["marks"] * 3 + ["grouping"] * 3, str([x["proto"] for x in s]))
        check("A5 номер ФИПИ у задания", all(x["fipi"] for x in s), str([x["fipi"] for x in s]))
        check("A6 задания группы — разные задачи банка", len({x["pid"] for x in s[:3]}) == 3, str([x["pid"] for x in s[:3]]))
        h = heads(tp)
        tot = s[0]["total"]
        check("A7 три заголовка «ЕГЭ №9 · Производная по касательной · ФИПИ 1–3 из N»",
              len(h) == 3 and h[0] == f"ЕГЭ №9 · Производная по касательной · ФИПИ 1–3 из {tot}" and h[2].startswith("ОГЭ №20 · "), str(h))
        check("A8 при добавлении картинки в хранилище не грузились", len(db()["files"]) == 0, str(len(db()["files"])))

        # ═══ B. кнопки ═══
        print("\n— B. кнопки группы и задания")
        pid0 = [x["pid"] for x in s[:3]]
        group_btn(tp, 0, "next")
        check("B1 «Следующие 3» — задания снова создаются", tp.locator("#wkTasks .tg:nth-of-type(1) .ti-gen").count() == 3)
        idle(tp)
        s = tp.evaluate(SER)
        check("B2 «Следующие 3 ▶» — места 3–5", [x["pos"] for x in s[:3]] == [3, 4, 5] and [x["at"] for x in s[:3]] == [3, 4, 5], str([x["pos"] for x in s[:3]]))
        check("B3 заголовок «ФИПИ 4–6»", heads(tp)[0].endswith(f"ФИПИ 4–6 из {tot}"), heads(tp)[0])
        check("B4 другие задания банка", not set(x["pid"] for x in s[:3]) & set(pid0), str([x["pid"] for x in s[:3]]))
        check("B5 остальные группы не тронуты", [x["pos"] for x in s[3:]] == [0, 1, 2] * 2)
        group_btn(tp, 0, "prev")
        tp.wait_for_function("() => window.__works.gens.size === 0", timeout=3000)
        s = tp.evaluate(SER)
        check("B6 «◀ Предыдущие» — места 0–2 сразу (из кэша)", [x["pos"] for x in s[:3]] == [0, 1, 2] and [x["pid"] for x in s[:3]] == pid0, str([x["pid"] for x in s[:3]]))
        check("B7 у начала банка «◀ Предыдущие» неактивна", tp.is_disabled("#wkTasks .tg:nth-of-type(1) [data-g='prev']"))
        group_btn(tp, 0, "more")
        idle(tp)
        s = tp.evaluate(SER)
        check("B8 «+ ещё» — четвёртое задание с местом 3 в той же группе", [x["pos"] for x in s[:4]] == [0, 1, 2, 3] and s[3]["key"] == s[0]["key"]
              and "Предыдущие 4" in tp.inner_text("#wkTasks .tg:nth-of-type(1) .tg-head"), str([x["pos"] for x in s[:5]]))
        # ▶ у задания и ввод номера
        tp.click("#wkTasks .tg:nth-of-type(1) .ti:nth-of-type(2) [data-a='np']")
        idle(tp)
        s = tp.evaluate(SER)
        check("B9 ▶ у задания — следующее место", s[0]["pos"] == 1, str([x["pos"] for x in s[:4]]))
        inp = tp.locator("#wkTasks .tg:nth-of-type(1) .ti:nth-of-type(2) .ti-pos input")
        inp.fill("8"); inp.dispatch_event("change")
        idle(tp)
        s = tp.evaluate(SER)
        check("B10 ввод номера 8 — место 7", s[0]["pos"] == 7, str([x["pos"] for x in s[:4]]))
        inp = tp.locator("#wkTasks .tg:nth-of-type(1) .ti:nth-of-type(2) .ti-pos input")
        inp.fill("2"); inp.dispatch_event("change")
        tp.wait_for_timeout(100)
        toast = tp.evaluate("() => (document.querySelector('.toast, #toast') || {}).textContent || ''")
        idle(tp)
        s = tp.evaluate(SER)
        check("B11 занятый номер — предупреждение, но ставится", s[0]["pos"] == 1 and s[1]["pos"] == 1 and "уже есть" in toast, f"{[x['pos'] for x in s[:4]]} {toast!r}")
        check("B12 подпись вразнобой — номера через запятую", "ФИПИ 2, 2, 3, 4 из" in heads(tp)[0] or "ФИПИ 2, 3, 4" in heads(tp)[0], heads(tp)[0])
        # «Следующие» — от самого большого номера
        group_btn(tp, 0, "next")
        idle(tp)
        s = tp.evaluate(SER)
        check("B13 «Следующие» — от самого большого номера (4 → 5–8)", [x["pos"] for x in s[:4]] == [4, 5, 6, 7], str([x["pos"] for x in s[:4]]))
        # ↑ у третьей группы
        k3 = s[-1]["key"]
        group_btn(tp, 2, "up")
        s = tp.evaluate(SER)
        keys = [x["key"] for x in s]
        check("B14 ↑ — группа целиком выше и не разорвана", keys[4:7] == [k3] * 3 and keys[7:] == [s[7]["key"]] * 3 and len(heads(tp)) == 3, str(keys))
        group_btn(tp, 1, "down")
        s = tp.evaluate(SER)
        check("B15 ↓ — обратно", [x["key"] for x in s][-3:] == [k3] * 3, str([x["key"] for x in s]))
        # одиночное задание рядом с группой ↑ не разрывает группу
        tp.evaluate("""() => { const W = window.__works; W.E.blocks.push({ id: 'tX', type: 'task', mode: 'exam', name: 'x', tid: 'ege9',
          img: { light: { url: 'https://x.test/a.webp' }, dark: { url: 'https://x.test/a.webp' } }, task: { kind: 'fields', fields: [{ answer: '1' }] } }); }""")
        tp.evaluate("() => window.__works.renderTasks()")
        tp.click("#wkTasks > .ti:last-child [data-a='up']")
        keys = [b and b["key"] for b in tp.evaluate(SER)]
        check("B16 ↑ у одиночного задания перепрыгивает группу целиком", keys[-4] is None and keys[-3:] == [k3] * 3 and len(heads(tp)) == 3, str(keys))
        tp.click("#wkTasks > .ti [data-a='rm']")
        group_btn(tp, 0, "rm")
        s = tp.evaluate(SER)
        check("B17 ✕ группы — убрана вся группа", len(s) == 6 and len(heads(tp)) == 2, str(len(s)))
        check("B18 картинки по-прежнему не грузились", len(db()["files"]) == 0, str(len(db()["files"])))

        # ═══ C. сохранение и повторное открытие ═══
        print("\n— C. сохранение")
        before = tp.evaluate(SER)
        tp.fill("#wkTitle", "Группы")
        tp.click("#wkSave")
        tp.wait_for_function("() => !document.getElementById('wkLinkBox').hidden", timeout=60000)
        link = tp.input_value("#wkLink").replace("http://127.0.0.1:%d" % PORT, BASE)
        bl = db()["work_variants"][0]["blocks"]
        check("C1 в базе series и gen.at", all(b.get("series") and b["gen"].get("at") for b in bl) and [b["series"]["pos"] for b in bl] == [x["pos"] for x in before],
              str([b.get("series", {}).get("pos") for b in bl]))
        check("C2 служебных полей в базе нет", not any(k.startswith("_") for b in bl for k in b))
        # заглушка хранилища отдаёт адрес файла как data: — считаем по файлам и по пометке _up
        check("C3 картинки ушли в хранилище при сохранении", len(db()["files"]) == 2 * len(bl)
              and tp.evaluate("() => window.__works.E.blocks.every(b => !b._up)"), str(len(db()["files"])))
        wid = db()["works"][0]["id"]
        tp.goto(f"{BASE}/works.html#/")
        tp.wait_for_selector("#scrList:not([hidden])")
        tp.goto(f"{BASE}/works.html#/edit/{wid}")
        tp.wait_for_selector("#scrEdit:not([hidden])")
        tp.wait_for_timeout(400)
        after = tp.evaluate(SER)
        check("C4 повторное открытие — те же группы и места", [(x["key"], x["pos"], x["fipi"]) for x in after] == [(x["key"], x["pos"], x["fipi"]) for x in before]
              and len(heads(tp)) == 2, str(heads(tp)))
        group_btn(tp, 0, "next")
        idle(tp)
        s = tp.evaluate(SER)
        check("C5 после открытия «Следующие» работает", [x["pos"] for x in s[:3]] == [3, 4, 5], str([x["pos"] for x in s[:3]]))

        # ═══ E. размер блока ═══
        print("\n— E. размер блока")
        # адрес картинки в настоящем хранилище — ~140 знаков, а не data: заглушки
        URL = "https://nctwdjyxlwnsbdkmisje.supabase.co/storage/v1/object/public/work-images/" + "u" * 36 + "/" + "h" * 40 + ".webp"
        def real(b):
            b = json.loads(json.dumps(b))
            for t in ("light", "dark"):
                b["img"][t]["url"] = URL
            return b
        sizes = [len(json.dumps(real(b), ensure_ascii=False).encode()) for b in bl]
        avg = sum(sizes) // len(sizes)
        # полный вариант ОГЭ (25 заданий) × 4 варианта — в 3 МБ work_variants.blocks?
        print(f"   ОГЭ 25 заданий: ~{25 * avg // 1024} КБ на вариант, ×4 = ~{4 * 25 * avg // 1024} КБ (предел 3 МБ — на каждый вариант)")
        live = [b for b in bl if b.get("live") or b.get("exact")]
        print(f"   блок в базе: средний {sum(sizes) // len(sizes)} Б, наибольший {max(sizes)} Б, с live/exact {len(live)} из {len(bl)}")
        check("E1 блок с exact меньше 60 КБ", max(sizes) < 60000, str(max(sizes)))

        # ═══ D. ученик ═══
        print("\n— D. ученик")
        sctx = new_context(browser, viewport={"width": 390, "height": 844}, is_mobile=True, has_touch=True)
        sp = sctx.new_page()
        watch_errors(sp, errors, "work")
        sp.goto(link)
        sp.wait_for_selector("#scrStart:not([hidden])")
        sp.fill("#wName", "Петя")
        sp.click("#wStart")
        sp.wait_for_selector("#scrTask:not([hidden])")
        n = sp.evaluate("() => window.__work.S.blocks.length")
        check("D1 у ученика работа открылась, все задания на месте", n == len(bl), f"{n} из {len(bl)}")
        sctx.close()

        # ═══ E. ОГЭ ч. 1: каталог без поля tasks (только fipi) ═══
        print("\n— E. группа на ОГЭ №9")
        before = tp.evaluate("() => window.__works.E.blocks.length")
        tp.evaluate("""async () => { await window.__works.addSeries({ tid: 'oge9', href: 'oge9.html', exam: 'oge', proto: 'p1',
          count: 2, source: 'order', startPos: 0 }); }""")
        idle(tp)
        s = tp.evaluate(SER)[before:]
        check("E1 два задания ОГЭ №9 созданы, с картинкой и номером ФИПИ",
              len(s) == 2 and all(x and x["img"] and not x["gen"] and x["fipi"] for x in s), json.dumps(s, ensure_ascii=False)[:400])
        check("E2 места 0–1 и размер банка из fipi", [x["pos"] for x in s] == [0, 1] and s[0]["total"] > 1, str([(x["pos"], x["total"]) for x in s]))
        tctx.close()
        browser.close()

    print("\n— F. ошибки JavaScript")
    check("F1 нет ошибок", not errors, "; ".join(errors[:5]))
    print("\nготово" if not FAILS else f"\nУПАЛО: {len(FAILS)} — " + ", ".join(FAILS))
    return 0 if not FAILS else 1


if __name__ == "__main__":
    sys.exit(run())
