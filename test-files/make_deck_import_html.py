"""
Собирает HTML-презентации для теста импорта HTML (test_prompt_deck_html_import.py).

  deck_import_custom.html — «как делает ИИ»: слайды 1280 × 720 строит скрипт
      из массива, видим только слайд с классом active; фон-градиент, список,
      карточка с рамкой и скруглением, svg со стилем из CSS-класса, картинка,
      степень, заметки докладчика; на третьем слайде скрипт презентации
      пишет, дотянулся ли он до доски и её localStorage (должно быть «нет»)
  deck_import_reveal.html — настоящий reveal.js 5 (вшит в файл), 960 × 700,
      вертикальный слайд, «фрагменты», фон слайда через data-background-color
  deck_import_marp.html   — разметка как у Marp: svg[data-marpit-svg] >
      foreignObject > section
  deck_import_page.html   — обычная длинная страница без слайдов
  deck_import_stage.html  — как шаблон разборов: сцена 1920 × 1080, вписанная в
      окно transform: scale, слайды — только левая колонка, фишки, рамка
      камеры и подпись со значком <use href="#star"> вне слайдов, номер в
      фишке меняет функция листания (клавиши), фон — пятно radial-gradient
      до transparent, поверх кадра пустой холст для рисования
  deck_import_4k.html     — разметка по гайду (deck-guide.md), кадр 3840 × 2160,
      движок вписывает его в окно масштабом, служебная панель data-deck-ui
      внутри слайда
  deck_import_a4.html     — разметка по гайду, книжный А4 1240 × 1754
  deck_import_steps.html  — разметка по гайду и анимации по щелчку:
      data-deck-step="1" и "2" (второй — карточка-фигура с текстом)

reveal.js берётся из распакованного npm-пакета:
  npm pack reveal.js@5 && tar xzf reveal.js-*.tgz
  python3 make_deck_import_html.py путь/к/package
Без аргумента reveal-файл не пересобирается (лежит готовый).
"""
import base64
import os
import re
import struct
import sys
import zlib

HERE = os.path.dirname(os.path.abspath(__file__))


def png(w, h, rgb):
    raw = b"".join(b"\x00" + bytes(rgb) * w for _ in range(h))
    def chunk(t, d):
        return struct.pack(">I", len(d)) + t + d + struct.pack(">I", zlib.crc32(t + d) & 0xFFFFFFFF)
    data = b"\x89PNG\r\n\x1a\n" + chunk(b"IHDR", struct.pack(">IIBBBBB", w, h, 8, 2, 0, 0, 0)) + chunk(b"IDAT", zlib.compress(raw)) + chunk(b"IEND", b"")
    return "data:image/png;base64," + base64.b64encode(data).decode()


RED = png(40, 30, (220, 30, 30))

CUSTOM = """<!doctype html>
<html lang="ru"><head><meta charset="utf-8"><title>Степени — урок</title>
<style>
html,body{margin:0;height:100%;background:#111;font-family:Inter, "Helvetica Neue", Arial, sans-serif}
.deck{position:relative;width:100vw;height:100vh;overflow:hidden}
.slide{position:absolute;inset:0;display:flex;flex-direction:column;justify-content:center;padding:60px 80px;box-sizing:border-box;opacity:0;pointer-events:none;background:#FFFFFF;color:#1F2937}
.slide.active{opacity:1;pointer-events:auto}
.slide.title{background:linear-gradient(135deg,#1E3A8A,#7C3AED);color:#FFFFFF;align-items:center;text-align:center}
.title h1{font-size:64px;margin:0 0 16px}
.title p{font-size:28px;margin:0;opacity:.9}
h2{font-size:44px;margin:0 0 24px;color:#1E3A8A}
ul{font-size:28px;margin:0 0 20px;padding-left:40px}
li{margin:6px 0}
.card{width:520px;padding:18px 24px;background:#FFF3E0;border:2px solid #F57C00;border-radius:12px;font-size:24px;color:#7C2D12}
.dot{fill:#16A34A}
.pic{position:absolute;right:80px;top:60px;width:160px;height:120px}
.ring{position:absolute;right:120px;bottom:60px}
.notes{display:none}
.probe{font-size:22px;margin:24px 0 0;color:#6B7280}
@keyframes up{from{opacity:0;transform:translateY(40px)}to{opacity:1;transform:none}}
.slide.active h2{animation:up .6s ease both}
</style></head>
<body><div class="deck" id="deck"></div>
<script>
// слайды строит скрипт — проверка, что импорт их запускает
const S = [
  '<div class="slide title"><h1>Степени</h1><p>Урок 7 · 8 класс</p></div>',
  '<div class="slide"><h2>Свойства степени</h2><ul><li>Произведение степеней</li><li><b>Частное</b> степеней</li><li><i>Степень</i> степени</li></ul>'
    + '<div class="card">Запомни: a<sup>m</sup> · a<sup>n</sup> = a<sup>m+n</sup></div>'
    + '<img class="pic" src="RED" alt="">'
    + '<svg class="ring" width="100" height="100" viewBox="0 0 100 100"><circle class="dot" cx="50" cy="50" r="40"/></svg>'
    + '<aside class="notes">Спросить про нулевую степень</aside></div>',
  '<div class="slide"><h2>Пример</h2><ol><li>Упростите выражение</li><li>Найдите значение</li></ol><p class="probe">Доступ к доске: ' + leak() + '</p></div>',
];
// презентация пробует дотянуться до доски и её хранилища — должна получить отказ
function leak(){
  let a = 'нет', b = 'нет';
  try { if (parent.document && parent.document.body) a = 'есть'; } catch (e) {}
  try { localStorage.getItem('x'); b = 'есть'; } catch (e) {}
  return a + ', хранилище: ' + b;
}
const deck = document.getElementById('deck');
deck.innerHTML = S.join('');
let cur = 0;
const all = [...deck.querySelectorAll('.slide')];
function go(i){ all.forEach((s, k) => s.classList.toggle('active', k === i)); cur = i; }
go(0);
addEventListener('keydown', e => { if (e.key === 'ArrowRight') go(Math.min(all.length - 1, cur + 1)); if (e.key === 'ArrowLeft') go(Math.max(0, cur - 1)); });
</script></body></html>
""".replace("RED", RED)

MARP = """<!doctype html>
<html><head><meta charset="utf-8"><title>marp</title>
<style>
body{margin:0;background:#000}
svg[data-marpit-svg]{display:block;width:100vw;height:100vh}
section{width:1280px;height:720px;box-sizing:border-box;padding:70px;background:#FAFAFA;color:#222;font-family:Georgia, serif}
section h1{font-size:56px;margin:0 0 20px;color:#B91C1C}
section p{font-size:30px;margin:0}
</style></head><body>
<div class="marpit">
<svg data-marpit-svg viewBox="0 0 1280 720"><foreignObject width="1280" height="720"><section><h1>Первый слайд Marp</h1><p>Текст первого слайда</p></section></foreignObject></svg>
<svg data-marpit-svg viewBox="0 0 1280 720"><foreignObject width="1280" height="720"><section><h1>Второй слайд</h1><p>Ещё текст</p></section></foreignObject></svg>
</div></body></html>
"""

PAGE = """<!doctype html>
<html><head><meta charset="utf-8"><title>Конспект</title>
<style>body{margin:0;padding:40px;font-family:Arial, sans-serif;font-size:22px;color:#000}h1{font-size:40px}p{margin:0 0 20px;width:900px}</style>
</head><body><h1>Конспект урока</h1>
""" + "".join(f"<p>Абзац номер {i}: дроби, проценты и степени — повторение перед контрольной.</p>\n" for i in range(1, 41)) + """
</body></html>
"""

STAGE = """<!doctype html>
<html lang="ru"><head><meta charset="utf-8"><title>сцена</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
html,body{height:100%;background:#000;overflow:hidden}
.stage{position:absolute;left:50%;top:50%;width:1920px;height:1080px;overflow:hidden;font-family:Arial, sans-serif;color:#1D1D1F;
  background:radial-gradient(circle at 8% 0%, rgba(120,150,255,.30) 0%, transparent 34%), #EEF1F7;transform-origin:center center}
.abs{position:absolute}
.top{left:56px;top:56px;display:flex;gap:12px}
.chip{border-radius:999px;padding:16px 28px;font-size:26px;background:rgba(255,255,255,.72);border:2px solid rgba(255,255,255,.85)}
.cam{left:1424px;top:56px;width:440px;height:760px;border-radius:40px;background:#FFFFFF}
.author{left:1424px;top:840px;width:440px;text-align:center;font-size:52px}
.star{width:40px;height:40px;fill:#004C99;vertical-align:middle}
.slide{position:absolute;left:56px;top:152px;width:1336px;bottom:56px;display:none;flex-direction:column;gap:24px}
.slide.on{display:flex}
.card{border-radius:32px;padding:30px 40px;font-size:30px;background:#FFFFFF}
#ink{position:absolute;left:0;top:0;width:1920px;height:1080px;z-index:5}
</style></head><body>
<div class="stage" id="stage">
  <svg width="0" height="0" style="position:absolute"><symbol id="star" viewBox="0 0 40 40"><path d="M20 0L26 14L40 20L26 26L20 40L14 26L0 20L14 14Z"/></symbol></svg>
  <div class="abs top"><div class="chip">Mathh.</div><div class="chip" id="num"></div></div>
  <div class="abs cam"></div>
  <div class="abs author"><svg class="star"><use href="#star"/></svg> Даня</div>
  <div id="slides">
    <section class="slide"><div class="card">Первый слайд: условие задачи</div></section>
    <section class="slide"><div class="card">Второй слайд: решение</div></section>
  </div>
  <canvas id="ink" width="3840" height="2160"></canvas>
</div>
<script>
const els = [...document.querySelectorAll('.slide')];
let cur = 0;
function go(i){ cur = Math.max(0, Math.min(els.length - 1, i)); els.forEach((e, k) => e.classList.toggle('on', k === cur)); document.getElementById('num').textContent = 'Слайд ' + (cur + 1); }
addEventListener('keydown', e => { if (e.key === 'ArrowRight') go(cur + 1); if (e.key === 'ArrowLeft') go(cur - 1); });
function layout(){ const s = Math.min(innerWidth / 1920, innerHeight / 1080); document.getElementById('stage').style.transform = 'translate(-50%,-50%) scale(' + s + ')'; }
addEventListener('resize', layout); layout(); go(0);
</script></body></html>
"""

K4 = """<!doctype html>
<html><head><meta charset="utf-8"><meta name="deck" content="3840x2160"><title>4k</title>
<style>
body{margin:0;background:#000;overflow:hidden}
.wrap{position:absolute;left:0;top:0;transform-origin:0 0}
[data-deck-slide]{width:3840px;height:2160px;background:#102A43;color:#F0F4F8;font-family:Rubik, sans-serif;padding:200px;box-sizing:border-box;display:none}
[data-deck-slide].cur{display:block}
h1{font-size:200px;margin:0}
.ui{position:absolute;right:40px;bottom:40px;font-size:60px;background:#F00;color:#FFF;padding:20px}
</style></head><body>
<div class="wrap" id="w">
<section data-deck-slide class="cur"><h1>Кадр 4K</h1><div class="ui" data-deck-ui>ПАНЕЛЬ АВТОРА</div></section>
<section data-deck-slide><h1>Второй</h1><aside data-deck-notes>Заметка 4K</aside></section>
</div>
<script>const k = Math.min(innerWidth / 3840, innerHeight / 2160); document.getElementById('w').style.transform = 'scale(' + k + ')';</script>
</body></html>
"""

A4 = """<!doctype html>
<html><head><meta charset="utf-8"><meta name="deck" content="1240x1754"><title>a4</title>
<style>body{margin:0}[data-deck-slide]{width:1240px;height:1754px;padding:100px;box-sizing:border-box;font-family:Lora, serif;background:#FFFFFF}
h1{font-size:64px;margin:0 0 30px}p{font-size:32px}</style></head><body>
<section data-deck-slide><h1>Лист заданий</h1><p>Решите уравнения.</p></section>
</body></html>
"""

STEPS = """<!doctype html>
<html><head><meta charset="utf-8"><meta name="deck" content="1920x1080"><title>шаги</title>
<style>body{margin:0}[data-deck-slide]{width:1920px;height:1080px;padding:120px;box-sizing:border-box;font-family:Arial, sans-serif;background:#FFFFFF}
h2{font-size:64px;margin:0 0 40px}p{font-size:48px;margin:0 0 30px}.ans{background:#DFF5E1;border:3px solid #2E9E5B;border-radius:24px;padding:24px 40px;font-size:48px;width:700px}</style></head><body>
<section data-deck-slide>
  <h2>Решите уравнение</h2>
  <p>x<sup>2</sup> = 9</p>
  <p data-deck-step="1">x = 3 или x = −3</p>
  <div class="ans" data-deck-step="2">Ответ: −3; 3</div>
</section>
</body></html>
"""

REVEAL = """<!doctype html>
<html><head><meta charset="utf-8"><title>reveal</title>
<style>@@CSS@@</style></head>
<body><div class="reveal"><div class="slides">
<section data-background-color="#0F766E"><h1 style="color:#FFFFFF">Reveal: титул</h1></section>
<section><section><h2>Вертикаль 1</h2><p class="fragment">Появляется по щелчку</p></section><section><h2>Вертикаль 2</h2><aside class="notes">Заметка reveal</aside></section></section>
</div></div>
<script>@@JS@@</script>
<script>Reveal.initialize({ hash: false, width: 960, height: 700 });</script>
</body></html>
"""


def main():
    out = lambda name, text: open(os.path.join(HERE, name), "w", encoding="utf-8").write(text)
    out("deck_import_custom.html", CUSTOM)
    out("deck_import_marp.html", MARP)
    out("deck_import_page.html", PAGE)
    out("deck_import_stage.html", STAGE)
    out("deck_import_4k.html", K4)
    out("deck_import_a4.html", A4)
    out("deck_import_steps.html", STEPS)
    if len(sys.argv) > 1:
        pkg = sys.argv[1]
        rd = lambda p: open(os.path.join(pkg, "dist", p), encoding="utf-8").read()
        # без обращения к чужим серверам: @import шрифтов темы убираем
        css = rd("reveal.css") + "\n" + re.sub(r"@import[^;]+;", "", rd("theme/white.css"))
        js = rd("reveal.js").replace("</script", "<\\/script")
        out("deck_import_reveal.html", REVEAL.replace("@@CSS@@", css).replace("@@JS@@", js))
    print("готово")


if __name__ == "__main__":
    main()
