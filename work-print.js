/* Печать работы (этап 9 конструктора) и то общее, что нужно и странице
   ученика (work.html), и кабинету учителя (works.html).

   - correctText(task) — верный ответ строкой. Тот же, что ученик видит после
     проверки: ключ учителя не должен расходиться с тем, что увидит ученик.
     Поэтому функция здесь, а work.html берёт её отсюда, а не держит копию.
   - info(block) — позиция экзамена по ExamSpec: балл и тип ответа (краткий /
     развёрнутый). Позиция ищется по странице тренажёра и номеру; не нашлась —
     краткий ответ, 1 балл. Это подсказка для бланка, ключа и суммы баллов —
     проверку ответа она не меняет.
   - render / print / ask — печать: задания по вариантам, бланк ответов, ключ.
     Печать — окно браузера (window.print) и @media print: на экране блок
     #wpPrint скрыт, при печати скрыто всё, кроме него. Стили — здесь же, чтобы
     не раздувать works.html.

   Нужны раньше: trainer-tasks.js (taPlainLabel), subjects-catalog.js
   (страница тренажёра по tid), exam-spec.js. Без них работает с запасными
   значениями (ответ без подписи поля, 1 балл, краткий). */
(function () {
  'use strict';
  if (window.WorkPrint) return;

  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const plain = l => (typeof window.taPlainLabel === 'function' ? window.taPlainLabel(l) : String(l || '').replace(/<[^>]*>/g, '').trim());
  const isTask = b => (b.type || 'task') === 'task';

  function correctText(t) {
    if (!t) return '';
    if (t.kind === 'fields') return (t.fields || []).map(f => {
      const lbl = plain(f.label);
      const val = String(f.value == null ? '' : f.value) || 'нет корней';
      return (t.fields.length > 1 || (lbl && lbl !== 'Ответ:') ? (lbl ? lbl + ' ' : '') : '') + val + (f.unit ? ' ' + f.unit : '');
    }).join('; ');
    if (t.kind === 'choice') return 'вариант ' + (t.correct + 1);
    if (t.kind === 'multi') return (t.correct || []).map(i => i + 1).join(', ') || 'ни одного';
    return '';
  }

  // страница тренажёра задания: у группы по прототипу — в series, иначе по tid из каталога
  function hrefOf(b) {
    const s = b.series || {};
    if (s.href) return s.href;
    if (b.href) return b.href;
    const T = (window.MathhCatalog && window.MathhCatalog.trainers) || {};
    if (b.tid && T[b.tid] && T[b.tid].href) return T[b.tid].href;
    try {
      // eslint-disable-next-line no-undef
      const groups = typeof TRAINERS_PANEL_GROUPS !== 'undefined' ? TRAINERS_PANEL_GROUPS : [];
      const it = groups.flatMap(g => g.items || []).find(x => x.id === b.tid);
      if (it && it.href) return it.href;
    } catch (e) {}
    return '';
  }
  function specOf(b) {
    if (!window.ExamSpec || !b) return null;
    const href = hrefOf(b);
    if (!href) return null;
    const m = /([^/?#]+)\.html(?:\?([^#]*))?/.exec(href);
    if (!m) return null;
    let n = (b.series && b.series.n != null) ? Number(b.series.n) : null;
    if (n == null && m[2]) { const q = new URLSearchParams(m[2]).get('n'); if (q != null && q !== '') n = Number(q); }
    if (n == null && b.gen && b.gen.n != null) n = Number(b.gen.n);
    return window.ExamSpec.find(m[1], n) || null;
  }
  // балл и тип одного задания. Позиция-диапазон (ОГЭ «№1–5», «№15–18»: одна
  // страница на несколько номеров, у позиции — сумма баллов) — задание одно,
  // значит 1 балл. Балл не подтверждён документом (null) — 1
  function info(b) {
    const sp = specOf(b);
    const range = !!(sp && /\d\s*[–-]\s*\d/.test(sp.label || ''));
    const pts = sp && sp.points > 0 && !range ? sp.points : 1;
    const long = !!(sp && sp.answer === 'long');
    return { spec: sp, points: pts, long, label: sp ? sp.label : '' };
  }

  /* ── разметка печати ── */
  const head = (title, v, many) => '<div class="wp-head"><b>' + esc(title || 'Работа') + (many || v.num > 1 ? ' · Вариант ' + v.num : '') + '</b></div>';
  const who = '<div class="wp-who"><span>Фамилия, имя <i class="wp-line"></i></span><span>Класс <i class="wp-line short"></i></span></div>';
  const imgOf = x => { const im = (x && x.img) || {}; const o = im.light || im.dark; return o && o.url ? o.url : ''; };

  function tasksHtml(title, v, many) {
    const list = (v.blocks || []).filter(isTask);
    return '<section class="wp-page wp-tasks">' + head(title, v, many) + who
      + list.map((b, i) => {
        const th = b.theory && imgOf(b.theory) ? '<img class="wp-theory" alt="Теория" src="' + esc(imgOf(b.theory)) + '">' : '';
        const src = imgOf(b);
        return '<div class="wp-task"><div class="wp-n">' + (i + 1) + '</div><div class="wp-body">' + th
          + (src ? '<img alt="Задание ' + (i + 1) + '" src="' + esc(src) + '">' : '<div class="wp-noimg">' + esc(b.name || 'Задание') + '</div>') + '</div></div>';
      }).join('') + '</section>';
  }
  function blankHtml(title, v, many) {
    const list = (v.blocks || []).filter(isTask);
    const cells = '<span class="wp-cells">' + '<i></i>'.repeat(14) + '</span>';
    return '<section class="wp-page wp-blank">' + head(title, v, many) + '<div class="wp-sub">Бланк ответов</div>' + who
      + '<table class="wp-bt"><tbody>' + list.map((b, i) => {
        const f = info(b);
        return '<tr><td class="n">' + (i + 1) + '</td><td>' + (f.long ? '<span class="wp-long">решение на отдельном листе</span>' : cells) + '</td></tr>';
      }).join('') + '</tbody></table></section>';
  }
  function keyHtml(title, vs) {
    return '<section class="wp-page wp-key"><div class="wp-head"><b>' + esc(title || 'Работа') + ' · ключ для учителя</b></div><div class="wp-keys">'
      + vs.map(v => {
        const list = (v.blocks || []).filter(isTask);
        let sum = 0;
        const rows = list.map((b, i) => {
          const f = info(b); sum += f.points;
          const a = correctText(b.task);
          return '<tr><td class="n">' + (i + 1) + '</td><td class="a">' + esc(a || '—') + '</td><td class="p">' + f.points + '</td></tr>';
        }).join('');
        return '<table class="wp-kt"><caption>Вариант ' + v.num + '</caption><thead><tr><th>№</th><th>Ответ</th><th>Балл</th></tr></thead><tbody>'
          + rows + '</tbody><tfoot><tr><td></td><td>Всего</td><td class="p">' + sum + '</td></tr></tfoot></table>';
      }).join('') + '</div></section>';
  }
  // what: { tasks, blank, key } — что печатать
  function render(work, what) {
    const vs = (work.variants || []).filter(v => (v.blocks || []).some(isTask));
    const many = vs.length > 1;
    let html = '';
    if (what.tasks) html += vs.map(v => tasksHtml(work.title, v, many)).join('');
    if (what.blank) html += vs.map(v => blankHtml(work.title, v, many)).join('');
    if (what.key) html += keyHtml(work.title, vs);
    return html;
  }

  const CSS = `
#wpPrint{display:none}
.wp-dlg{position:fixed;inset:0;z-index:500;background:rgba(0,0,0,.35);display:flex;align-items:center;justify-content:center;padding:16px}
.wp-dlg .box{background:var(--bg,#fff);color:var(--pencil,#1D1D1F);border-radius:16px;padding:20px 22px;max-width:380px;width:100%;box-shadow:0 10px 40px rgba(0,0,0,.25)}
.wp-dlg h3{margin:0 0 12px;font-size:18px}
.wp-dlg label{display:flex;gap:10px;align-items:flex-start;margin:10px 0;font-size:15px;line-height:1.3;cursor:pointer}
.wp-dlg label small{display:block;color:var(--muted-2,#6E6E73);font-size:12.5px}
.wp-dlg .row{display:flex;gap:8px;justify-content:flex-end;margin-top:16px}
.wp-dlg .note{color:var(--warn,#B25000);font-size:13px;min-height:16px}
@media print{
  body.wp-on > *:not(#wpPrint){display:none !important}
  body.wp-on{background:#fff !important;padding:0 !important;margin:0 !important}
  body.wp-on #wpPrint{display:block;color:#000;font:13px/1.35 'Onest',Arial,sans-serif}
  #wpPrint .wp-page{break-after:page;page-break-after:always}
  #wpPrint .wp-page:last-child{break-after:auto;page-break-after:auto}
  #wpPrint .wp-head{font-size:16px;margin-bottom:6px}
  #wpPrint .wp-sub{font-weight:700;margin-bottom:4px}
  #wpPrint .wp-who{display:flex;gap:24px;margin:4px 0 12px}
  #wpPrint .wp-line{display:inline-block;width:230px;border-bottom:1px solid #000;height:14px;vertical-align:bottom}
  #wpPrint .wp-line.short{width:60px}
  #wpPrint .wp-task{display:flex;gap:8px;margin:0 0 10px;break-inside:avoid;page-break-inside:avoid}
  #wpPrint .wp-n{flex:none;width:26px;height:26px;border:1.5px solid #000;border-radius:50%;text-align:center;line-height:23px;font-weight:700}
  #wpPrint .wp-body{flex:1;min-width:0}
  #wpPrint .wp-body img{display:block;max-width:100%;max-height:120mm}
  #wpPrint .wp-theory{margin-bottom:6px}
  #wpPrint table{border-collapse:collapse}
  #wpPrint .wp-bt td{border:1px solid #000;padding:5px 8px;height:28px}
  #wpPrint .wp-bt td.n{width:30px;text-align:center;font-weight:700}
  #wpPrint .wp-cells{display:inline-flex}
  #wpPrint .wp-cells i{display:inline-block;width:18px;height:22px;border:1px solid #000;margin-left:-1px}
  #wpPrint .wp-long{font-style:italic}
  #wpPrint .wp-keys{display:flex;flex-wrap:wrap;gap:14px;align-items:flex-start}
  #wpPrint .wp-kt{break-inside:avoid;page-break-inside:avoid;font-size:12px}
  #wpPrint .wp-kt caption{font-weight:700;text-align:left;padding-bottom:2px}
  #wpPrint .wp-kt th, #wpPrint .wp-kt td{border:1px solid #000;padding:2px 6px}
  #wpPrint .wp-kt td.n, #wpPrint .wp-kt td.p{text-align:center}
}`;
  function ensureStyle() {
    if (document.getElementById('wpStyle')) return;
    const st = document.createElement('style'); st.id = 'wpStyle'; st.textContent = CSS;
    document.head.appendChild(st);
  }
  function print(work, what) {
    ensureStyle();
    let root = document.getElementById('wpPrint');
    if (!root) { root = document.createElement('div'); root.id = 'wpPrint'; document.body.appendChild(root); }
    root.innerHTML = render(work, what);
    document.body.classList.add('wp-on');
    // класс снимаем после печати: иначе Ctrl+P позже напечатает этот же лист
    const off = () => { document.body.classList.remove('wp-on'); window.removeEventListener('afterprint', off); };
    window.addEventListener('afterprint', off);
    // картинки успевают загрузиться до окна печати
    const imgs = [...root.querySelectorAll('img')].filter(i => !i.complete);
    const ready = Promise.race([
      Promise.all(imgs.map(i => new Promise(r => { i.onload = i.onerror = r; }))),
      new Promise(r => setTimeout(r, 4000)),
    ]);
    return ready.then(() => { window.print(); });
  }
  // окно «что печатать»; getWork() — свежая работа на момент нажатия
  function ask(getWork) {
    ensureStyle();
    const old = document.querySelector('.wp-dlg'); if (old) old.remove();
    const d = document.createElement('div'); d.className = 'wp-dlg'; d.id = 'wpDlg';
    d.innerHTML = '<div class="box" role="dialog" aria-modal="true" aria-labelledby="wpDlgH"><h3 id="wpDlgH">Печать</h3>'
      + '<label><input type="checkbox" id="wpTasks" checked><span>Задания<small>каждый вариант с новой страницы, поля «Фамилия, имя» и «Класс»</small></span></label>'
      + '<label><input type="checkbox" id="wpBlank"><span>Бланк ответов<small>клетки для ответа; у развёрнутых — «решение на отдельном листе»</small></span></label>'
      + '<label><input type="checkbox" id="wpKey"><span>Ключ для учителя<small>все варианты: № → ответ → балл</small></span></label>'
      + '<div class="note" id="wpNote"></div>'
      + '<div class="row"><button class="btn quiet" id="wpCancel">Отмена</button><button class="btn" id="wpGo">Печатать</button></div></div>';
    document.body.appendChild(d);
    const close = () => d.remove();
    d.addEventListener('click', e => { if (e.target === d) close(); });
    d.querySelector('#wpCancel').addEventListener('click', close);
    d.addEventListener('keydown', e => { if (e.key === 'Escape') close(); });
    d.querySelector('#wpGo').addEventListener('click', () => {
      const what = { tasks: d.querySelector('#wpTasks').checked, blank: d.querySelector('#wpBlank').checked, key: d.querySelector('#wpKey').checked };
      if (!what.tasks && !what.blank && !what.key) { d.querySelector('#wpNote').textContent = 'Отметьте, что печатать'; return; }
      const w = getWork();
      if (typeof w === 'string') { d.querySelector('#wpNote').textContent = w; return; }
      close();
      print(w, what);
    });
    d.querySelector('#wpGo').focus();
    return d;
  }

  window.WorkPrint = { correctText, info, specOf, render, print, ask };
})();
