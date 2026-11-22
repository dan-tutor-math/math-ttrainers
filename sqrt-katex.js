/* Корни «√3», «√(ab)», «√n» в тексте страницы → KaTeX \sqrt (знак и черта слиты).
   Почему не правка каждой строки: корни здесь живут в банках ФИПИ (sol), в
   генераторах и в условиях, которые собирают разные функции, а текст должен
   остаться плоским — по нему идёт сверка с ФИПИ и проверка ответа. Поэтому
   модуль заменяет «√…» в уже нарисованных текстовых узлах и следит за новыми.
   Не трогает поля ввода, script/style, готовые .katex и разметку .rad
   (там корень уже нарисован отдельно). Без window.katex ничего не делает. */
(function () {
  'use strict';
  var RE = /√(\d+|[A-Za-zА-Яа-я]|\((?:[^()]|\([^()]*\))*\))/g;
  var SKIP = /^(SCRIPT|STYLE|TEXTAREA|INPUT|SELECT|OPTION|NOSCRIPT)$/;
  // шрифты KaTeX: до прогрева .katex скрыт, иначе корень на миг рисуется запасным шрифтом
  var st = document.createElement('style');
  st.textContent = '.sqrt-kx .katex{visibility:hidden}html.katex-fonts-ready .sqrt-kx .katex{visibility:visible}.sqrt-kx .katex{font-size:1.05em}';
  document.head.appendChild(st);
  function ready() { document.documentElement.classList.add('katex-fonts-ready'); }
  if (document.fonts && document.fonts.ready) { document.fonts.ready.then(ready, ready); setTimeout(ready, 1500); } else ready();

  function tex(x) {
    if (x.charAt(0) === '(') x = x.slice(1, -1);
    return x.replace(/(\d),(\d)/g, '$1{,}$2').replace(/%/g, '\\%').replace(/&/g, '\\&').replace(/#/g, '\\#').replace(/_/g, '\\_');
  }
  function render(x) {
    try { return window.katex.renderToString('\\sqrt{' + tex(x) + '}', { throwOnError: false, output: 'html' }); }
    catch (e) { return null; }
  }
  function okParent(el) {
    for (; el && el !== document.body; el = el.parentElement) {
      if (SKIP.test(el.tagName) || (el.classList && (el.classList.contains('katex') || el.classList.contains('rad') || el.isContentEditable))) return false;
    }
    return true;
  }
  function convert(node) {
    var txt = node.nodeValue;
    RE.lastIndex = 0;
    if (txt.indexOf('√') < 0 || !RE.test(txt)) return;
    var host = node.parentElement; if (!host || !okParent(host)) return;
    RE.lastIndex = 0;
    var out = '', last = 0, m, esc = function (s) { return s.replace(/&/g, '&amp;').replace(/</g, '&lt;'); };
    while ((m = RE.exec(txt))) {
      var h = render(m[1]); if (!h) return;
      out += esc(txt.slice(last, m.index)) + '<span class="sqrt-kx">' + h + '</span>';
      last = m.index + m[0].length;
    }
    out += esc(txt.slice(last));
    var span = document.createElement('span'); span.innerHTML = out;
    var frag = document.createDocumentFragment();
    while (span.firstChild) frag.appendChild(span.firstChild);
    node.parentNode.replaceChild(frag, node);
  }
  function scan(root) {
    if (!window.katex || !root) return;
    var w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null), list = [], n;
    while ((n = w.nextNode())) if (n.nodeValue.indexOf('√') >= 0) list.push(n);
    list.forEach(convert);
  }
  var queued = false;
  function later() {
    if (queued) return; queued = true;
    requestAnimationFrame(function () { queued = false; scan(document.body); });
  }
  function start() {
    scan(document.body);
    new MutationObserver(later).observe(document.body, { childList: true, subtree: true, characterData: true });
  }
  window.SqrtKatex = { scan: scan };
  if (document.body) start(); else document.addEventListener('DOMContentLoaded', start);
})();
