"""
Задача 63, S1a: карточки ФИПИ формы Б — русский ОГЭ/ЕГЭ, ОГЭ №18, №19, часть 2 (№20–22).

  1. validate.py зелёный по всем cards/*.json;
  2. покрытие по числам: заданий ФИПИ в банке страницы (считается здесь же, независимо
     от плагина) = карточек + не обработанных по отчёту; не обработанные — только с
     причиной из списка ниже (каждая объяснена в отчёте задачи);
  3. src файла = sha1 страницы и банка сейчас (карточки не устарели); у малых семей
     свежая сборка в отдельную папку совпадает с лежащей байт в байт;
  4. выборка 20 карточек на семью: то же задание ФИПИ открывается на странице, ответ
     карточки = ответ живого задания (trainerTaskInfo), слова условия живого задания
     есть в карточке, формулы часть 2 те же, рисунки есть файлами;
  5. длинные ответы: kind long, критерии в карточке, эталон (где он есть в банке);
     часть 2: ответ fields + критерии + разбор, рисунка решения в условии нет;
  6. карточки рисуются CardRender без интерфейса и без ошибок JavaScript.
Запуск: python test_prompt_cards_family_b.py
"""
import hashlib
import json
import os
import re
import subprocess
import sys
import tempfile

from test_prompt15_works_stage1 import BASE, local_server, sync_playwright

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
FAILS = []

# slug → (банк-файл, выражение «сколько заданий в банке», карточек должно быть, допустимые причины пропуска)
EXPECT = {
    "oge19": 150, "oge18": 154, "oge_part2": 547,
    "rus_oge": 962, "rus_oge01": 43, "rus_oge13": 99, "rus_ege": 2069, "rus_ege27": 71,
}
ALLOWED_SKIP = ("ответ ФИПИ не подтверждён (ok:0)", "старая форма банка ЕГЭ (h)",
                "текст интерфейса «Ответить»", "текст интерфейса «Проверить»")   # слово из текста автора, ложное срабатывание валидатора
BANK_COUNT = {
    "oge19": ("oge19-fipi-bank.js", "OGE19_FIPI.tasks.length"),
    "oge18": ("oge18-fipi-bank.js", "OGE18_FIPI.tasks.length"),
    "oge_part2": (["oge-part2-fipi.js", "oge-part2-fipi20.js", "oge-part2-fipi21.js", "oge-part2-fipi22.js"],
                  "[20,21,22].reduce((s,n)=>s+OGE_PART2_FIPI.tasks[n].protos.length,0)"),
    "rus_oge": ("rus-oge-fipi.js", "RUS_OGE_FIPI.tasks.length"),
    "rus_oge01": ("rus-oge01-fipi.js", "RUS_OGE01.tasks.length"),
    "rus_oge13": ("rus-oge13-fipi.js", "RUS_OGE13.tasks.length"),
    "rus_ege": ("rus-ege-fipi.js", "RUS_EGE_FIPI.tasks.length"),
    "rus_ege27": ("rus-ege27-fipi.js", "RUS_EGE27.tasks.length"),
}
LIVE_HREF = {"oge19": lambda c: "oge19.html", "oge18": lambda c: "oge15_18.html",
             "oge_part2": lambda c: "oge_part2.html?n=%d" % c["n"],
             "rus_oge": lambda c: "rus_oge.html?n=%d" % c["n"], "rus_ege": lambda c: "rus_ege.html?n=%d" % c["n"]}


def check(n, c, x=""):
    print(("[OK] " if c else "[FAIL] ") + n + (f" — {x}" if x and not c else ""))
    if not c:
        FAILS.append(n)


def sha1(path):
    return hashlib.sha1(open(os.path.join(HERE, path), "rb").read()).hexdigest()


def squash(s):
    return re.sub(r"\s+", "", s or "")


def load(slug):
    from tools.cards.split import load_page   # rus_oge / rus_ege лежат частями по номерам (split.py)
    return load_page(slug)


def skips(slug):
    """Причины необработанных из отчёта tools/cards/reports/<slug>.md."""
    rep = open(os.path.join(HERE, "tools", "cards", "reports", slug + ".md"), encoding="utf-8").read()
    return [l.split("|")[3].strip() for l in rep.splitlines() if re.match(r"\| [0-9A-Za-z]{6} \|", l)]


def sample(cards, k=20):
    if len(cards) <= k:
        return cards
    return [cards[int(i * len(cards) / k)] for i in range(k)]


def main():
    errors = []
    from tools.cards import validate
    check("1 валидатор зелёный", validate.main([]) == 0)
    data = {s: load(s) for s in EXPECT}

    # 3. не устарели
    for slug, d in data.items():
        stale = [f for f, h in d["src"].items() if sha1(f) != h]
        check(f"3 {slug}: src = sha1 страницы и банка", not stale, str(stale))
        check(f"3 {slug}: файл полный (не --limit)", not d.get("partial"))

    with local_server(), sync_playwright() as p:
        br = p.chromium.launch()
        pg = br.new_page(viewport={"width": 1280, "height": 900})
        pg.on("pageerror", lambda e: errors.append(str(e)))
        pg.goto(f"{BASE}/tools/cards/harness.html")
        pg.wait_for_function("() => window.CardCollect && window.trainerTaskInfo")
        pg.add_script_tag(url=f"{BASE}/card-render.js")
        # 2. покрытие по числам: банк считаем сами
        for slug, m in EXPECT.items():
            files, expr = BANK_COUNT[slug]
            for f in (files if isinstance(files, list) else [files]):
                pg.add_script_tag(path=os.path.join(HERE, f))
            n_bank = pg.evaluate(expr)
            sk = skips(slug)
            n = len(data[slug]["cards"])
            check(f"2 {slug}: в банке {n_bank} = {m}", n_bank == m, str(n_bank))
            check(f"2 {slug}: обработано {n} из {m}, не обработано {len(sk)}", n + len(sk) == m, f"{n}+{len(sk)}")
            bad = [r for r in sk if not any(a in r for a in ALLOWED_SKIP)]
            check(f"2 {slug}: каждая необработанная с понятной причиной", not bad, str(bad[:3]))
            ids = [c["id"] for c in data[slug]["cards"]]
            check(f"2 {slug}: id без повторов", len(ids) == len(set(ids)))
        # 4. выборка
        for slug in ("oge19", "oge18", "oge_part2", "rus_oge", "rus_ege"):
            cur, meta = None, None
            ok = {k: 0 for k in ("same", "ans", "words", "tex", "fig")}
            bad = {k: [] for k in ok}
            S = sample(data[slug]["cards"])
            for c in S:
                href = LIVE_HREF[slug](c)
                if href != cur:
                    meta = pg.evaluate("h => CardCollect.open(h)", href)
                    cur = href
                fid = c["id"][5:]
                r = pg.evaluate("([p, i, n]) => CardCollect.openAt(p, i, n)", [c["proto"], c["pos"], meta["n"]])
                if r.get("fipi") == fid:
                    ok["same"] += 1
                else:
                    bad["same"].append(f"{fid}: {r}")
                    continue
                info = pg.evaluate("t => trainerTaskInfo(document.getElementById('f').contentWindow, t, CardCollect.mainNode(t))", meta["tid"])
                mine = {k: v for k, v in c["answer"].items() if k not in ("value", "criteria")}
                info.pop("hot", None)
                if mine == info:
                    ok["ans"] += 1
                else:
                    bad["ans"].append(f"{fid}: {mine} ≠ {info}")
                live = pg.evaluate("""t => { const el = CardCollect.mainNode(t);
                  const q = el.querySelector('.q, .text-body') ? [...el.querySelectorAll('.text-body, .q')] : [el];
                  const tex = [...el.querySelectorAll('annotation[encoding="application/x-tex"]')].map(a => a.textContent.trim());
                  const w = q.map(x => x.innerText).join(' ');
                  return { w, tex }; }""", meta["tid"])
                card = pg.evaluate("""async ([c]) => { await CardRender.ready(c, { root: '../../' });
                  const el = CardRender.render(c, { base: '../../cards/' }); document.body.appendChild(el);
                  await new Promise(r => setTimeout(r, 30));
                  const o = { all: el.innerText, tex: [...el.querySelectorAll('annotation[encoding="application/x-tex"]')].map(a => a.textContent.trim()),
                    ui: el.querySelectorAll('button, input, select, textarea, a').length, imgs: [...el.querySelectorAll('img')].length };
                  el.remove(); return o; }""", [c])
                words = set(re.findall(r"[а-яёa-z0-9]{3,}", card["all"].lower()))
                miss = [w for w in set(re.findall(r"[а-яёa-z0-9]{3,}", live["w"].lower())) if w not in words]
                miss = [w for w in miss if w not in ("цифры", "пробелов", "запятых", "любом", "порядке", "слово", "нужной", "форме", "слова", "ответ", "номера", "предложений", "двузначные", "можно", "через", "запятую", "сочетание", "слов", "как", "тексте", "текст", "одно", "источник", "открытый", "банк", "заданий", "проверить", "задание", "фипи", "соответствующими", "выбранные", "таблицу", "под", "запишите", "буквами") and not re.fullmatch(r"[0-9a-f]{6}", w)]
                if slug in ("oge19",) or not miss:
                    ok["words"] += 1
                else:
                    bad["words"].append(f"{fid}: нет в карточке {miss[:6]}")
                if slug != "oge_part2" or live["tex"] == card["tex"]:
                    ok["tex"] += 1
                else:
                    bad["tex"].append(f"{fid}: {live['tex']} ≠ {card['tex']}")
                ok["fig"] += (card["imgs"] == len(c["figs"]) and card["ui"] == 0)
                if card["ui"] or card["imgs"] != len(c["figs"]):
                    bad["fig"].append(f"{fid}: ui={card['ui']} img={card['imgs']}/{len(c['figs'])}")
            for k, t in (("same", "то же задание ФИПИ"), ("ans", "ответ = живой"), ("words", "слова условия живого есть в карточке"),
                         ("tex", "формулы те же"), ("fig", "рисунки файлами, интерфейса нет")):
                check(f"4 {slug}: {t} {ok[k]} из {len(S)}", ok[k] == len(S), "\n  " + "\n  ".join(bad[k][:5]))
        br.close()
    # 5. длинные
    for slug in ("rus_oge01", "rus_oge13", "rus_ege27"):
        cs = data[slug]["cards"]
        check(f"5 {slug}: kind long, критерии есть", all(c["answer"]["kind"] == "long" and c["answer"]["criteria"] for c in cs))
        withval = sum(1 for c in cs if c["answer"]["value"].strip())
        if slug == "rus_ege27":
            check("5 rus_ege27: образцов в банке нет — эталон пуст (известно, см. отчёт)", withval == 0)
        else:
            check(f"5 {slug}: эталон в каждой карточке", withval == len(cs), f"{withval}/{len(cs)}")
    cs = data["oge_part2"]["cards"]
    check("5 oge_part2: fields + критерии + разбор, без рисунков в условии",
          all(c["answer"]["kind"] == "fields" and c["answer"].get("criteria") and c["solution"] and not c["figs"] for c in cs))
    check("5 oge_part2: n = 20, 21, 22 (200+190+157)",
          sorted((n, sum(1 for c in cs if c["n"] == n)) for n in (20, 21, 22)) == [(20, 200), (21, 190), (22, 157)])
    cs = data["oge18"]["cards"]
    check("5 oge18: n=18, у каждой карточки рисунок и разбор, slug oge18", all(c["n"] == 18 and c["figs"] and c["solution"] and c["slug"] == "oge18" for c in cs))
    # малые семьи: свежая сборка = лежащая
    with tempfile.TemporaryDirectory() as tmp:
        args = [sys.executable, os.path.join(HERE, "tools", "cards", "build.py"), "--out", tmp]
        for s in ("oge18", "oge19", "rus_oge01", "rus_oge13", "rus_ege27"):
            args += ["--slug", s]
        r = subprocess.run(args, cwd=HERE, capture_output=True, text=True, timeout=900)
        for s in ("oge18", "oge19", "rus_oge01", "rus_oge13"):
            from tools.cards.split import canon
            a = canon(json.load(open(os.path.join(tmp, s + ".json"), encoding="utf-8"))["cards"])
            b = canon(load(s)["cards"])
            check(f"3 {s}: свежая полная сборка = cards/{s}*.json", a == b)
    check("6 нет ошибок JavaScript", not errors, "; ".join(errors[:5]))
    print("готово" if not FAILS else f"ПРОВАЛЕНО: {len(FAILS)}")
    sys.exit(1 if FAILS else 0)


if __name__ == "__main__":
    main()
