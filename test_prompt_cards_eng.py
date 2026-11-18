"""
Задача 63, S2d: карточки ФИПИ для английского ОГЭ (eng_oge, семья c_eng).

  1. валидатор зелёный, 458 карточек, по каждой из 11 позиций столько же, сколько
     заданий в каталоге страницы; id не повторяются;
  2. свежая сборка (build.py --family c_eng в отдельную папку) = лежащий cards/eng_oge.json;
  3. по каждой карточке живое задание открывается тем же openAt, и это то же задание;
  4. ответ: у краткого — те же поля, что даёт страница (fieldsOf → ttTaskFields), у
     панельных — ровно trainerTaskInfo; у письма и устной части kind 'long' с критериями
     (у живого trainerTaskInfo null — автопроверки нет);
  5. видимый текст карточки = видимый текст #egeQuestion живой страницы (пропуск — «______»);
  6. аудио: card.audio = src плееров живого задания; файл есть, отдаётся, не пуст;
     рендерер ставит плеер, в печати плеера нет;
  7. таблицы соответствия (№6–11) — таблицей карточки, числом строк как на странице;
  8. схема: audio принимает mp3 по пути от корня и отвергает прочее; validate ловит
     несуществующий файл;
  9. размер eng_oge.json не больше 3 МБ; нет ошибок JavaScript.
Снимки «живое | карточка» (выборка 30 карточек) — если задана CARDS_SHOTS=<папка>.
Запуск: python test_prompt_cards_eng.py
"""
import io
import json
import os
import re
import subprocess
import sys
import tempfile
import urllib.request

from test_prompt15_works_stage1 import BASE, local_server, sync_playwright

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
FAILS = []
SHOTS = os.environ.get("CARDS_SHOTS")
NS = [1, 5, 6, 12, 13, 20, 29, 35, 36, 37, 38]
EXPECT = {1: 19, 5: 19, 6: 19, 12: 38, 13: 28, 20: 74, 29: 73, 35: 81, 36: 38, 37: 39, 38: 30}


def check(n, c, x=""):
    print(("[OK] " if c else "[FAIL] ") + n + (f" — {x}" if x and not c else ""))
    if not c:
        FAILS.append(n)


def squash(s):
    return re.sub(r"\s+", "", s or "")


# живой #egeQuestion: текст без интерфейса, плееры и строки таблиц
LIVE = """() => {
  const w = document.getElementById('f').contentWindow, q = w.document.getElementById('egeQuestion');
  if (!q) return null;
  const c = q.cloneNode(true);
  c.querySelectorAll('.source-note, .ege-source, button, input, select, textarea').forEach(x => x.remove());
  return { text: c.textContent, audio: [...q.querySelectorAll('audio')].map(a => a.getAttribute('src')),
           rows: q.querySelectorAll('table tr').length };
}"""

# ответ живой страницы: поля прототипа так, как их превращает конструктор
LIVE_FIELDS = """(n) => {
  const w = document.getElementById('f').contentWindow;
  const p = w.protoById(n, w.eval('S.pid'));
  let f = null; try { f = w.fieldsOf(p); } catch (e) {}
  return (f && f.length) ? ttTaskFields(JSON.parse(JSON.stringify(f)), 'en') : null;
}"""

RENDER = """async ([card, opts]) => {
  let box = document.getElementById('cardBox');
  if (!box) { box = document.createElement('div'); box.id = 'cardBox'; document.body.appendChild(box); }
  box.style.cssText = 'position:absolute;left:0;top:1500px;background:#fff;color:#1d1d1f;padding:0;width:760px';
  box.innerHTML = '';
  const el = CardRender.render(card, Object.assign({ base: '../../cards/', root: '../../' }, opts || {}));
  box.appendChild(el);
  const t = el.querySelector('.cr-text');
  return { text: t.textContent, audio: [...el.querySelectorAll('audio')].map(a => a.getAttribute('src').replace('../../', '')),
           rows: el.querySelectorAll('table tr').length, ui: el.querySelectorAll('button, input, select, textarea').length,
           crit: !!el.querySelector('.cr-crit'), all: el.textContent };
}"""


def main():
    errors = []
    from tools.cards import build, validate
    # 1. валидатор и состав
    rc = validate.main([])
    check("1 валидатор зелёный", rc == 0)
    path = os.path.join(HERE, "cards", "eng_oge.json")
    d = json.load(open(path, encoding="utf-8"))
    cards = d["cards"]
    check("1 458 карточек", len(cards) == 458, str(len(cards)))
    by_n = {}
    for c in cards:
        by_n[c["n"]] = by_n.get(c["n"], 0) + 1
    check("1 по позициям как в каталоге страницы", by_n == EXPECT, str(by_n))
    check("1 id уникальны", len({c["id"] for c in cards}) == len(cards))
    check("1 partial нет (собрана вся страница)", not d.get("partial"))
    # 9. размер
    size = os.path.getsize(path)
    check(f"9 eng_oge.json {size / 1024:.0f} КБ не больше 3 МБ", size <= 3 * 1024 * 1024)
    # 2. свежая сборка = лежащая
    with tempfile.TemporaryDirectory() as tmp:
        r = subprocess.run([sys.executable, os.path.join(HERE, "tools", "cards", "build.py"), "--family", "c_eng", "--out", tmp],
                           cwd=HERE, capture_output=True, text=True, timeout=600)
        check("2 сборка прошла без необработанных", r.returncode == 0, r.stdout[-800:] + r.stderr[-800:])
        a = open(os.path.join(tmp, "eng_oge.json"), "rb").read()
        check("2 свежая сборка = cards/eng_oge.json", a == open(path, "rb").read())
    # 8. схема и валидатор про audio
    base = next(c for c in cards if c.get("audio"))
    import copy
    for bad, label in (("x/y.wav", "не mp3"), ("../x/y.mp3", "выход из корня"), ("nofile.mp3", "без папки")):
        c = copy.deepcopy(base); c["audio"] = [bad]
        check(f"8 audio {bad!r} ({label}) отвергнут", bool(validate.check_card(c)))
    c = copy.deepcopy(base); c["audio"] = ["eng-oge-audio/нет-такого.mp3"]
    check("8 audio с несуществующим файлом отвергнут", bool(validate.check_card(c)))
    c = copy.deepcopy(base); c["audio"] = "eng-oge-audio/L01-1.mp3"
    check("8 audio не списком отвергнут", bool(validate.check_card(c)))
    check("8 карточка без audio проходит как раньше", not validate.check_card(next(c for c in cards if not c.get("audio"))))

    with local_server(), sync_playwright() as p:
        br = p.chromium.launch()
        pg = br.new_page(viewport={"width": 1280, "height": 900})
        pg.on("pageerror", lambda e: errors.append(str(e)))
        pg.goto(f"{BASE}/tools/cards/harness.html")
        pg.wait_for_function("() => window.CardCollect && window.trainerTaskInfo")
        pg.add_script_tag(url=f"{BASE}/card-render.js")
        res = {k: 0 for k in ("same", "ans", "text", "audio", "rows", "ui", "long")}
        bad = {k: [] for k in res}
        n_long = n_audio = 0
        audio_files = set()
        sample = []
        for n in NS:
            meta = pg.evaluate("h => CardCollect.open(h)", f"eng_oge.html?n={n}")
            for c in [c for c in cards if c["n"] == n]:
                fid = c["id"][5:]
                r = pg.evaluate("([p, i, n]) => CardCollect.openAt(p, i, n)", [c["proto"], c["pos"], n])
                first = (r.get("fipi") or "").split(",")[0].strip()
                if r.get("ok") and first == fid:
                    res["same"] += 1
                else:
                    bad["same"].append(f"{fid}: openAt дал {r}")
                    continue
                # 4. ответ
                if c["answer"]["kind"] == "long":
                    n_long += 1
                    info = pg.evaluate("t => t ? trainerTaskInfo(document.getElementById('f').contentWindow, t, CardCollect.mainNode(t)) : null", meta["tid"])
                    ok = (n >= 35 and info is None and c["answer"].get("criteria") and c["answer"]["value"]
                          and c["solution"] is None)
                    res["long"] += bool(ok)
                    if not ok:
                        bad["long"].append(f"{fid}: long {info}")
                    res["ans"] += bool(ok)
                else:
                    live = pg.evaluate(LIVE_FIELDS, n)
                    mine = c["answer"]["fields"]
                    ok = live == mine and n < 35
                    if ok and meta["tid"]:
                        info = pg.evaluate("t => trainerTaskInfo(document.getElementById('f').contentWindow, t, CardCollect.mainNode(t))", meta["tid"])
                        info.pop("hot", None)
                        ok = info == {k: v for k, v in c["answer"].items() if k != "value"}
                    res["ans"] += bool(ok)
                    if not ok:
                        bad["ans"].append(f"{fid}: {mine} ≠ {live}")
                # 5–7. текст, аудио, таблицы, интерфейс
                lv = pg.evaluate(LIVE)
                cd = pg.evaluate(RENDER, [c, {"answer": True, "solution": True}])
                if lv is None:
                    bad["text"].append(f"{fid}: нет #egeQuestion")
                    continue
                if squash(lv["text"]) == squash(cd["text"].replace("______", "")):
                    res["text"] += 1
                else:
                    bad["text"].append(f"{fid}: текст\n   живой:    {squash(lv['text'])[:250]}\n   карточка: {squash(cd['text'].replace('______', ''))[:250]}")
                want = c.get("audio") or []
                if lv["audio"] == want and cd["audio"] == want:
                    res["audio"] += 1
                else:
                    bad["audio"].append(f"{fid}: живой {lv['audio']}, карточка {want}, рендер {cd['audio']}")
                n_audio += len(want)
                audio_files.update(want)
                if lv["rows"] == cd["rows"] == sum(len(t["rows"]) for t in (c["table"] or [])):
                    res["rows"] += 1
                else:
                    bad["rows"].append(f"{fid}: строк таблицы живых {lv['rows']}, в рендере {cd['rows']}")
                res["ui"] += cd["ui"] == 0 and "Проверить" not in cd["all"] and "Источник" not in cd["all"]
                if c["answer"]["kind"] == "long" and not cd["crit"]:
                    bad["long"].append(f"{fid}: критерии не показаны при opts.answer")
                if SHOTS and (len(sample) < 30) and (len([x for x in cards if x["n"] == n and x["id"] < c["id"]]) % 7 == 0 or n >= 35) and \
                        sum(1 for s in sample if s[2] == n) < 3:
                    os.makedirs(SHOTS, exist_ok=True)
                    pg.evaluate("() => document.getElementById('f').contentWindow.document.getElementById('egeQuestion').scrollIntoView()")
                    live_png = pg.frame_locator("#f").locator("#egeQuestion").screenshot()
                    card_png = pg.locator("#cardBox").screenshot()
                    sample.append((fid, live_png, n, card_png))
        total = len(cards)
        for k, title in (("same", "3 то же задание ФИПИ"), ("ans", "4 ответ = страница"), ("text", "5 текст = живой"),
                         ("audio", "6 аудио = плееры живого"), ("rows", "7 таблицы"), ("ui", "5 без интерфейса")):
            check(f"{title}: {res[k]} из {total}", res[k] == total, "\n  " + "\n  ".join(bad[k][:5]))
        check(f"4 письмо и устная часть — long: {n_long} (№35–38 = {sum(EXPECT[n] for n in (35, 36, 37, 38))})",
              n_long == sum(EXPECT[n] for n in (35, 36, 37, 38)) and not bad["long"], "\n  " + "\n  ".join(bad["long"][:5]))
        # 6. файлы аудио
        check(f"6 аудио: {n_audio} ссылок, {len(audio_files)} файлов", n_audio == 96 and len(audio_files) == 96, f"{n_audio}/{len(audio_files)}")
        notok = []
        for a in sorted(audio_files):
            try:
                resp = urllib.request.urlopen(f"{BASE}/{a}", timeout=20)
                body = resp.read(4)
                if resp.status != 200 or len(body) < 4 or not (body[:3] == b"ID3" or body[0] == 0xFF):
                    notok.append(a)
            except Exception as e:  # noqa: BLE001
                notok.append(f"{a}: {e}")
        check("6 все mp3 по ссылкам отдаются и начинаются как mp3", not notok, "; ".join(notok[:5]))
        # плеер реально грузится (если у браузера есть mp3)
        can = pg.evaluate("() => document.createElement('audio').canPlayType('audio/mpeg')")
        if can:
            dur = pg.evaluate("""async (src) => { const a = new Audio(src); a.preload = 'metadata';
                await new Promise(r => { a.onloadedmetadata = r; a.onerror = r; setTimeout(r, 8000); }); return a.duration; }""", f"{BASE}/{sorted(audio_files)[0]}")
            check("6 аудио открывается плеером, длительность > 0", bool(dur) and dur > 0, str(dur))
        else:
            print("[--] 6 браузер Playwright не играет mp3 — длительность не проверена (файлы проверены по заголовку)")
        # печать: без плеера
        pa = pg.evaluate(RENDER, [base, {"print": True}])
        check("6 в печати плеера нет, на экране есть", pa["audio"] == [] and pg.evaluate(RENDER, [base, {}])["audio"] == base["audio"])
        # №6–11: таблица соответствия — table карточки, [[table:k]] на месте
        t6 = next(c for c in cards if c["n"] == 6)
        check("7 №6–11: table у карточки, 6 строк, метка в тексте", t6["table"] and len(t6["table"][0]["rows"]) == 6 and "[[table:0]]" in t6["text"])
        # предпросмотр
        pv = br.new_page()
        pv.on("pageerror", lambda e: errors.append(str(e)))
        pv.goto(f"{BASE}/tools/cards/preview.html?slug=eng_oge&answer=1&solution=1")
        pv.wait_for_function("() => document.documentElement.dataset.ready === '1'", timeout=30000)
        n_pv = pv.evaluate("() => document.querySelectorAll('.cr').length")
        check(f"9 preview.html eng_oge: {n_pv} карточек", n_pv == 458)
        pv.close()
        br.close()
    if SHOTS and sample:
        from PIL import Image
        for fid, a, n, b in sample:
            ia, ib = Image.open(io.BytesIO(a)), Image.open(io.BytesIO(b))
            im = Image.new("RGB", (ia.width + ib.width + 30, max(ia.height, ib.height)), "white")
            im.paste(ia, (0, 0)); im.paste(ib, (ia.width + 30, 0))
            im.save(os.path.join(SHOTS, f"eng_oge-n{n}-{fid}.png"))
        print("снимки:", SHOTS, len(sample))
    check("9 нет ошибок JavaScript", not errors, "; ".join(errors[:5]))
    print("готово" if not FAILS else f"ПРОВАЛЕНО: {len(FAILS)}")
    sys.exit(1 if FAILS else 0)


if __name__ == "__main__":
    main()
