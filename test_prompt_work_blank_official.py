"""
Задача 62: «Бланк ответов» выдаёт официальный образец ЕГЭ-2026 (blanks/ege2026,
источник — blanks/SOURCES.md).
  1. файлы бланков совпадают с записанными в SOURCES.md контрольными суммами;
  2. ЕГЭ профиль: пять официальных листов по порядку reg, o1, o2l1, o2l2, dop, все картинки загружены;
  3. ЕГЭ база: только регистрации и № 1;
  4. ОГЭ: официальных листов нет, остаётся наш бланк (.wp-brow);
  5. подпись в окне: ЕГЭ — «официальный образец ЕГЭ-2026», ОГЭ — «пока нет»;
  6. PDF альбомный: страницы заданий альбомные, листы бланков — книжные, как оригинал;
  7. повторная сборка выдаёт тот же набор (те же файлы);
  8. нет ошибок JavaScript.
Запуск: python test_prompt_work_blank_official.py
"""
import hashlib, os, re, sys
from test_prompt15_works_stage1 import BASE, local_server, sync_playwright
from test_prompt_work_live_view import make_work, student

FAILS = []
def check(n, c, x=""):
    print(("[OK] " if c else "[FAIL] ") + n + (f" — {x}" if x and not c else ""))
    if not c: FAILS.append(n)

HERE = os.path.dirname(os.path.abspath(__file__))
ORDER = ["reg", "o1", "o2l1", "o2l2", "dop"]

def with_exam(slug_href, n):
    return """async () => { const bl = window.__work.S.blocks.map(b => Object.assign({}, b, { series: { href: '%s', n: %s, key: 'k', pos: 0, total: 1 } }));
      const p = await WorkPrint.build({ title: 'x', variants: [{ num: 1, blocks: bl }] }, { tasks: false, blank: true }, 'portrait');
      const out = p.map(s => ({ off: s.classList.contains('wp-off'), form: s.dataset.form || null, nat: (s.querySelector('img') || {}).naturalWidth || 0, brow: s.querySelectorAll('.wp-brow').length }));
      document.getElementById('wpPrint').innerHTML = ''; return out; }""" % (slug_href, n)

def main():
    errors = []
    src = open(os.path.join(HERE, "blanks", "SOURCES.md"), encoding="utf-8").read()
    ok = True
    for f in ORDER:
        h = hashlib.sha256(open(os.path.join(HERE, "blanks", "ege2026", f + ".png"), "rb").read()).hexdigest()
        ok = ok and h in src
    check("1 файлы бланков совпадают с контрольными суммами в SOURCES.md", ok)
    with local_server(), sync_playwright() as p:
        b = p.chromium.launch()
        link = make_work(b)
        ctx, sp = student(b, link, errors, "уч", {"width": 1280, "height": 900}, False)
        r = sp.evaluate(with_exam("ege_prof.html?n=1", 1))
        check("2 ЕГЭ профиль: 5 официальных листов по порядку", [x["form"] for x in r] == ORDER and all(x["off"] for x in r), str(r))
        check("2 картинки загружены (≥ 1300 px)", all(x["nat"] >= 1300 for x in r), str([x["nat"] for x in r]))
        r = sp.evaluate(with_exam("ege_base.html", 1))
        check("3 ЕГЭ база: регистрации и № 1", [x["form"] for x in r] == ["reg", "o1"], str(r))
        r = sp.evaluate(with_exam("oge9.html", "null"))
        check("4 ОГЭ: официальных листов нет, наш бланк", r and not any(x["off"] for x in r) and r[0]["brow"] > 0, str(r))
        r2 = sp.evaluate(with_exam("ege_prof.html?n=1", 1))
        check("7 повторная сборка — тот же набор", [x["form"] for x in r2] == ORDER)
        # 5. подпись в окне (подмена заданий через getWork)
        for href, n, want in (("ege_prof.html?n=1", 1, "официальный образец ЕГЭ-2026"), ("oge9.html", "null", "пока нет")):
            sp.evaluate("""([h, n]) => { window.__realTB = window.__realTB || null; WorkPrint.ask(() => ({ title: 'x', variants: [{ num: 1, blocks: window.__work.S.blocks.map(b => Object.assign({}, b, { series: { href: h, n: n, key: 'k', pos: 0, total: 1 } })) }] }), { student: true }); }""", [href, None if n == "null" else n])
            t = sp.inner_text("#wpBlankNote")
            check(f"5 подпись у бланка ({href}): «{want}»", want in t, t)
            sp.evaluate("() => document.getElementById('wpDlg').remove()")
        # 6. PDF альбомный: книжные листы бланков
        sp.evaluate("""() => { const real = window.__work.S.blocks; window.__fake = real.map(b => Object.assign({}, b, { series: { href: 'ege_prof.html?n=1', n: 1, key: 'k', pos: 0, total: 1 } })); }""")
        sp.evaluate("""() => { WorkPrint.ask(() => ({ title: 'Тест ЕГЭ', variants: [{ num: 1, blocks: window.__fake }] }), { student: true }); }""")
        sp.wait_for_selector("#wpDlg")
        sp.check("input[name=wpOri][value=landscape]"); sp.check("#wpBlank")
        with sp.expect_download(timeout=120000) as dl: sp.click("#wpPdf")
        path = "/tmp/p62_ege.pdf"; dl.value.save_as(path)
        raw = open(path, "rb").read()
        boxes = [(round(float(a)), round(float(c))) for a, c in re.findall(rb"MediaBox\s*\[\s*0\s+0\s+([\d.]+)\s+([\d.]+)", raw)]
        land = [x for x in boxes if x[0] > x[1]]; port = [x for x in boxes if x[0] < x[1]]
        check("6 PDF: страницы заданий альбомные, 5 листов бланков книжные", len(port) == 5 and len(land) >= 1, str(boxes))
        check("8 нет ошибок JavaScript", not errors, "; ".join(errors[:5]))
        b.close()
    print("\n" + ("ВСЁ ПРОШЛО" if not FAILS else "НЕ ПРОШЛО: " + ", ".join(FAILS)))
    sys.exit(1 if FAILS else 0)
if __name__ == "__main__": main()
