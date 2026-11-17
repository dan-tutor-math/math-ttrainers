"""
Задача 61, этап 1: «Печать / PDF» у ученика в открытой работе.
  1. кнопка есть; в окне «Задания» и «Бланк ответов», без «Ключа для учителя»;
     есть «Скачать PDF», «Книжная», «Альбомная»;
  2. «Печатать»: вызвана печать браузера, листы А4, ключа и ответов в листах нет,
     в шапке название, поля «Фамилия, имя» и «Класс», внизу «Страница i из N»;
  3. картинка задания подготовлена: без поля ответа и «Проверить» (ниже обрезано);
  4. PDF книжный: файл .pdf, страница 595×842 pt, страниц столько же, сколько листов;
  5. PDF альбомный: 842×595 pt; в альбомной две колонки;
  6. выбранная ориентация запоминается;
  7. нет ошибок JavaScript.
Запуск: python test_prompt_work_print_student.py
"""
import re, sys
from test_prompt15_works_stage1 import BASE, local_server, sync_playwright
from test_prompt_work_live_view import make_work, student

FAILS = []
def check(n, c, x=""):
    print(("[OK] " if c else "[FAIL] ") + n + (f" — {x}" if x and not c else ""))
    if not c: FAILS.append(n)

def pdf_info(path):
    raw = open(path, "rb").read()
    mb = re.search(rb"MediaBox\s*\[\s*0\s+0\s+([\d.]+)\s+([\d.]+)", raw)
    pages = len(re.findall(rb"/Type\s*/Page[^s]", raw)) or len(re.findall(rb"/Type\s*/Page\b(?!s)", raw))
    return raw[:5], (round(float(mb.group(1))), round(float(mb.group(2)))) if mb else None, pages

def main():
    errors = []
    with local_server(), sync_playwright() as p:
        b = p.chromium.launch()
        link = make_work(b)
        ctx, sp = student(b, link, errors, "уч", {"width": 1280, "height": 900}, False)
        sp.evaluate("() => { window.__printed = 0; window.print = () => { window.__printed++; }; }")
        check("1 кнопка «Печать / PDF» есть", sp.locator("#wPrint").count() == 1)
        sp.click("#wPrint"); sp.wait_for_selector("#wpDlg")
        t = sp.inner_text("#wpDlg")
        check("1 окно: задания, бланк, PDF, ориентация", all(x in t for x in ["Задания", "Бланк ответов", "Скачать PDF", "Книжная", "Альбомная"]), t)
        check("1 ключа для учителя нет", "Ключ" not in t and sp.locator("#wpKey").count() == 0)
        sp.check("#wpBlank"); sp.click("#wpGo")
        sp.wait_for_function("() => window.__printed === 1", timeout=20000)
        d = sp.evaluate("""() => { const R = document.getElementById('wpPrint'); const sh = [...R.querySelectorAll('.wp-sheet')];
          return { n: sh.length, key: R.querySelectorAll('.wp-kt, .wp-key').length, ctl: [...R.querySelectorAll('button, input, select')].filter(e => !e.closest('.bf-sheet')).length,
            head: sh[0].querySelector('.wp-head').innerText, who: sh[0].querySelector('.wp-who').innerText, foot: sh.filter(s => !s.classList.contains('wp-off')).map(s => s.querySelector('.wp-foot').textContent), nOwn: sh.filter(s => !s.classList.contains('wp-off')).length,
            task: sh.filter(s => s.classList.contains('wp-tasks')).reduce((a, s) => a + s.querySelectorAll('.wp-task').length, 0), cols: sh[0].querySelectorAll('.wp-col').length }; }""")
        check("2 листов > 0, ключа нет, элементов управления сайта нет", d["n"] >= 2 and d["key"] == 0 and d["ctl"] == 0, str(d))
        check("2 шапка, «Фамилия, имя», «Класс», 3 задания", d["head"] and "Фамилия, имя" in d["who"] and "Класс" in d["who"] and d["task"] == 3, str(d))
        check("2 «Страница i из N»", d["foot"][0] == "Страница 1 из %d" % d["nOwn"] and d["foot"][-1] == "Страница %d из %d" % (d["nOwn"], d["nOwn"]), str(d["foot"]))
        check("2 книжная — одна колонка", d["cols"] == 1)
        # 3: подготовленная картинка короче исходной
        r = sp.evaluate("""async () => { const b = window.__work.S.blocks[0]; const o = b.img.light.url; const im = new Image(); im.src = o; await im.decode();
          const p = await WorkPrint.build({ title: 'x', variants: [{ num: 1, blocks: [b] }] }, { tasks: true }, 'portrait');
          const pi = p[0].querySelector('.wp-task img'); await pi.decode(); const out = { oh: im.naturalHeight, ow: im.naturalWidth, ph: pi.naturalHeight, pw: pi.naturalWidth, png: pi.src.startsWith('data:image/png') };
          document.getElementById('wpPrint').innerHTML = ''; return out; }""")
        check("3 картинка подготовлена: ниже поля ответа обрезано", r["png"] and r["ph"] < r["oh"] - 20, str(r))
        for orient, size, tag in (("portrait", (595, 842), "4"), ("landscape", (842, 595), "5")):
            sp.click("#wPrint"); sp.wait_for_selector("#wpDlg")
            sp.check(f"input[name=wpOri][value={orient}]"); sp.check("#wpBlank")
            with sp.expect_download(timeout=90000) as dl: sp.click("#wpPdf")
            path = f"/tmp/p61_student_{orient}.pdf"; dl.value.save_as(path)
            magic, mb, pages = pdf_info(path)
            n = sp.evaluate("async o => { const p = await WorkPrint.build({ title: 'x', variants: [{ num: 1, blocks: window.__work.S.blocks }] }, { tasks: true, blank: true }, o); const k = [p.length, p[0].querySelectorAll('.wp-col').length]; document.getElementById('wpPrint').innerHTML = ''; return k; }", orient)
            check(f"{tag} PDF {orient}: файл .pdf", dl.value.suggested_filename.endswith(".pdf") and magic == b"%PDF-", dl.value.suggested_filename)
            check(f"{tag} размер страницы {size[0]}×{size[1]} pt", mb and abs(mb[0] - size[0]) <= 2 and abs(mb[1] - size[1]) <= 2, str(mb))
            check(f"{tag} страниц столько же, сколько листов ({n[0]})", pages == n[0], f"{pages} vs {n}")
            if orient == "landscape": check("5 альбомная — две колонки", n[1] == 2, str(n))
        sp.click("#wPrint"); sp.wait_for_selector("#wpDlg")
        check("6 ориентация запомнена", sp.is_checked("input[name=wpOri][value=landscape]"))
        check("7 нет ошибок JavaScript", not errors, "; ".join(errors[:5]))
        b.close()
    print("\n" + ("ВСЁ ПРОШЛО" if not FAILS else "НЕ ПРОШЛО: " + ", ".join(FAILS)))
    sys.exit(1 if FAILS else 0)
if __name__ == "__main__": main()
