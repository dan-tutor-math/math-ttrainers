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
