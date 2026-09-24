/* ═══════════════════════════════════════════════════════════════════════
   Промпт №67: «сразу ответ» в пошаговых тренажёрах.

   В ОГЭ и ЕГЭ ответ можно вписать сразу, без решения. В тренажёрах, где
   решают по шагам (столбики, уравнения, дроби, НОД, уравнения в ОГЭ №9), до
   этой правки к ответу вёл только разбор по шагам. Теперь над панелью шагов
   стоит панель «Ответ: [поле] [Проверить]» того же вида, что в ОГЭ, и та же
   проверка: верно — зелёным и засчитано; первая ошибка — красным, можно
   исправить или решать по шагам; вторая — подставляется верный ответ,
   пример засчитан как ошибка. Шаги после этого остаются — это и есть разбор.

   Итог хранится в самом состоянии примера (S.quick): тренажёры рассылают
   собеседнику S целиком (таймер 300 мс, tsWatchSig), значит и ответ,
   данный сразу, уходит тем же путём — без отдельного канала. Счёт (решено,
   серия, звёзды, медали) у каждого тренажёра свой, поэтому его ведёт сама
   страница в хуках onRight/onWrong/onFail; модуль знает только поле и
   проверку.

   Подключение (в том же <script>, где живут P и S):
     QuickAnswer.mount({
       fields: P => [{ id, label, type: 'num'|'nums'|'frac', value }] | null,
       getP: () => P, getS: () => S,
       active: () => true,              // необязательно: движки ОГЭ №9
       onRight(), onWrong(), onFail(),
     });
   Своё finish() страница не должна засчитывать повторно:
   QuickAnswer.settled(S) — ответ уже засчитан (верно или по второй ошибке).
   ═══════════════════════════════════════════════════════════════════════ */
(function () {
  if (window.QuickAnswer) return;

  const CSS = `
    .qa-panel .qa-title{font-family:var(--font-ui);font-weight:500;font-size:15px;color:var(--muted-6);margin-bottom:10px;}
    .qa-row{display:flex;align-items:center;gap:10px;flex-wrap:wrap;}
    .qa-row + .qa-row{margin-top:8px;}
    .qa-label{font-family:var(--font-ui);font-weight:600;font-size:16px;color:var(--ink);white-space:nowrap;}
    .qa-input{
      font-family:var(--font-mono);font-size:19px;color:var(--ink);
      background:var(--card);border:1.5px solid var(--glass-border);border-radius:14px;
      padding:11px 14px;width:130px;box-sizing:border-box;
    }
    .qa-input.wide{width:220px;}
    .qa-input:focus{outline:none;border-color:var(--ink)}
    .qa-input.good{border-color:var(--ok);background:var(--ok-tint);color:var(--ok);}
    .qa-input.bad{border-color:var(--teacher);background:rgba(255,59,48,.1);color:var(--teacher);}
    .qa-input:disabled{opacity:1;-webkit-text-fill-color:currentColor;}
    @keyframes qaShake{20%{transform:translateX(-6px)}40%{transform:translateX(6px)}60%{transform:translateX(-4px)}80%{transform:translateX(4px)}}
    .qa-input.shake{animation:qaShake .35s;}
    .qa-check{font-family:var(--font-ui);font-weight:600;font-size:15px;background:var(--ink);color:#fff;border:none;border-radius:14px;padding:11px 22px;cursor:pointer;transition:transform .15s;}
    .qa-check:active{transform:scale(.98)}
    .qa-check:disabled{opacity:.5;cursor:default}
    .qa-msg{font-family:var(--font-ui);font-size:14px;line-height:1.45;color:var(--muted-6);margin-top:10px;min-height:0;}
    .qa-msg:empty{display:none;}
    .qa-msg.good{color:var(--ok);font-weight:600;}
    .qa-msg.bad{color:var(--teacher);}
    @media (max-width:560px){ .qa-input,.qa-input.wide{width:100%;flex:1 1 140px;} }
     /* в ОГЭ №9 движки уравнений живут под сбросом «#linEngineArea * { margin:0;
       padding:0 }» — у него вес id, и без !important поле и кнопка слипались */
    .qa-panel .qa-title{margin:0 0 10px !important;}
    .qa-panel .qa-input{padding:11px 14px !important;margin:0 !important;border:1.5px solid var(--glass-border) !important;}
    .qa-panel .qa-input:focus{border-color:var(--ink) !important;}
    .qa-panel .qa-input.good{border-color:var(--ok) !important;}
    .qa-panel .qa-input.bad{border-color:var(--teacher) !important;}
    .qa-panel .qa-check{padding:11px 22px !important;margin:0 !important;}
    .qa-panel .qa-row + .qa-row{margin-top:8px !important;}
    .qa-panel .qa-msg{margin:10px 0 0 !important;}
  `;

  /* ── разбор записи ─────────────────────────────────────────────────── */
  const normMinus = s => String(s).replace(/[−–—‐‑]/g, '-');
  const strip = s => String(s).replace(/[\s   ]/g, '');
  function gcd(a, b){ a = Math.abs(a); b = Math.abs(b); while (b) { [a, b] = [b, a % b]; } return a; }

  // число или простое выражение: 12, −3,5, 3/4, 2^3, √16 → число; NaN — не разобрали
  function evalExpr(src){
    let s = strip(normMinus(src)).toLowerCase();
    s = s.replace(/sqrt|корень/g, '√').replace(/[·×\*]/g, '*').replace(/[:÷]/g, '/').replace(/,/g, '.');
    if (!s) return NaN;
    let i = 0;
    const peek = () => s[i];
    function number(){ const m = /^\d+(\.\d+)?/.exec(s.slice(i)); if (!m) return null; i += m[0].length; return parseFloat(m[0]); }
    function primary(){
      const c = peek();
      if (c === '(') { i++; const v = expr(); if (peek() !== ')') throw 0; i++; return v; }
      if (c === '√') { i++; const v = power(); if (v < 0) throw 0; return Math.sqrt(v); }
      const n = number(); if (n === null) throw 0; return n;
    }
    function power(){ const b = primary(); if (peek() === '^') { i++; return Math.pow(b, unary()); } return b; }
    function unary(){ if (peek() === '-') { i++; return -unary(); } if (peek() === '+') { i++; return unary(); } return power(); }
    function term(){
      let v = unary();
      for (;;) { const c = peek(); if (c === '*') { i++; v *= unary(); } else if (c === '/') { i++; v /= unary(); } else break; }
      return v;
    }
    function expr(){
      let v = term();
      for (;;) { const c = peek(); if (c === '+') { i++; v += term(); } else if (c === '-') { i++; v -= term(); } else break; }
      return v;
    }
    try { const v = expr(); return i === s.length && isFinite(v) ? v : NaN; } catch (e) { return NaN; }
  }
  const sameNum = (a, b) => Math.abs(a - b) <= 1e-9 * Math.max(1, Math.abs(b));

  // обыкновенная дробь: «3/4», «−7/2», «1 5/8» (смешанное), «2», «0,5».
  // → { v: значение, reducible: можно ли сократить } или null
  function parseFrac(raw){
    const s = normMinus(String(raw)).trim().replace(/\s+/g, ' ');
    let m = /^(-)?\s*(\d+)\s+(\d+)\s*\/\s*(\d+)$/.exec(s);          // смешанное число
    if (m) {
      const w = +m[2], n = +m[3], d = +m[4];
      if (!d || n >= d) return null;
      const v = (w + n / d) * (m[1] ? -1 : 1);
      return { v, reducible: gcd(n, d) > 1 };
    }
    m = /^(-)?\s*(\d+)\s*\/\s*(-?\d+)$/.exec(s);
    if (m) {
      const n = +m[2], d = +m[3];
      if (!d) return null;
      return { v: (m[1] ? -1 : 1) * n / d, reducible: gcd(n, d) > 1 };
    }
    const v = evalExpr(s);
    return isNaN(v) ? null : { v, reducible: false };
  }
  function splitItems(src){
    return normMinus(src).split(/;|(?<!\d),|,(?!\d)|\s+и\s+/).map(x => x.trim()).filter(Boolean);
  }
  const NO_ROOTS = /^(нет|нет\s+корней|корней\s+нет|∅|пусто)\.?$/i;

  // → { ok: true|false } или { ok: null, why } — «запиши иначе», это не ошибка
  function checkField(f, raw){
    const val = String(raw || '').trim();
    if (!val) return { ok: null, why: 'Сначала впиши ответ' };
    if (f.type === 'frac') {
      const p = parseFrac(val);
      if (!p) return { ok: null, why: 'Запиши дробью, например 3/4 или 1 5/8' };
      if (p.reducible) return { ok: null, why: 'Дробь можно сократить — сократи до конца' };
      const want = parseFrac(f.value);
      return { ok: !!want && sameNum(p.v, want.v) };
    }
    if (f.type === 'nums') {
      const expectNone = !String(f.value || '').trim();
      if (NO_ROOTS.test(val)) return { ok: expectNone };
      const items = splitItems(val).map(evalExpr);
      if (!items.length || items.some(isNaN)) return { ok: null, why: 'Корни через «;», например: −2; 5' };
      if (expectNone) return { ok: false };
      const uniq = arr => arr.slice().sort((a, b) => a - b).filter((v, k, all) => k === 0 || !sameNum(v, all[k - 1]));
      const a = uniq(items), b = uniq(splitItems(f.value).map(evalExpr));
      return { ok: a.length === b.length && a.every((v, k) => sameNum(v, b[k])) };
    }
    const v = evalExpr(val);
    if (isNaN(v)) return { ok: null, why: 'Запиши ответ числом' };
    return { ok: sameNum(v, evalExpr(f.value)) };
  }
  // как показать верный ответ после второй ошибки: запятая в десятичной
  // дроби, дробь — сокращённой
  function prettyValue(f){
    if (f.type === 'nums') return String(f.value || '').trim() ? normMinus(f.value).replace(/-/g, '−').replace(/\./g, ',') : 'нет корней';
    if (f.type === 'frac') {
      const m = /^(-?\d+)\/(-?\d+)$/.exec(strip(f.value));
      if (m) {
        let n = +m[1], d = +m[2];
        if (d < 0) { n = -n; d = -d; }
        const g = gcd(n, d) || 1; n /= g; d /= g;
        return (d === 1 ? String(n) : n + '/' + d).replace(/-/g, '−');
      }
    }
    return String(f.value).replace(/-/g, '−').replace(/\./g, ',');
  }

  function hashOf(x){
    const s = JSON.stringify(x) || '';
    let h = 0;
    for (let k = 0; k < s.length; k++) h = (h * 31 + s.charCodeAt(k)) | 0;
    return (h >>> 0).toString(36);
  }
  const settled = S => !!(S && S.quick && (S.quick.res === 'ok' || S.quick.res === 'fail'));

  function mount(opts){
    if (!document.getElementById('qaStyle')) {
      const st = document.createElement('style');
      st.id = 'qaStyle'; st.textContent = CSS;
      document.head.appendChild(st);
    }
    const ctl = { panel: null, key: null, lastSig: null, msg: '' , msgCls: '' };

    function anchor(){
      const pr = document.getElementById('prompt');
      return pr ? pr.closest('.panel') : null;
    }
    function fieldsNow(){
      const P = opts.getP();
      if (!P) return null;
      try { return opts.fields(P); } catch (e) { return null; }
    }
    function drop(){
      if (ctl.panel) { ctl.panel.remove(); ctl.panel = null; }
      if (window.TrainerSession && window.TrainerSession.unregisterFieldsWithPrefix) window.TrainerSession.unregisterFieldsWithPrefix('qa:');
      ctl.key = null;
    }

    function build(fields, key, host){
      drop();
      const panel = document.createElement('div');
      panel.className = 'panel qa-panel';
      panel.innerHTML = '<div class="qa-title">Знаешь ответ — впиши сразу. Или реши по шагам ниже.</div>' +
        fields.map((f, i) => `
          <div class="qa-row">
            ${f.label ? `<span class="qa-label">${f.label}</span>` : ''}
            <input class="qa-input${f.type === 'nums' ? ' wide' : ''}" data-fid="${f.id}" type="text"
              inputmode="${f.type === 'num' ? 'decimal' : 'text'}" autocomplete="off" autocapitalize="off" autocorrect="off" spellcheck="false"
              placeholder="${f.type === 'nums' ? 'например: −2; 5' : (f.type === 'frac' ? 'например: 3/4' : '?')}">
            ${i === fields.length - 1 ? '<button class="qa-check" type="button">Проверить</button>' : ''}
          </div>`).join('') +
        '<div class="qa-msg"></div>';
      host.parentNode.insertBefore(panel, host);
      panel.querySelectorAll('.qa-input').forEach(inp => {
        inp.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); check(); } });
        inp.addEventListener('input', () => { inp.classList.remove('bad'); });
        // набранное видит и собеседник, как поле ответа в ОГЭ; в id — сам
        // пример, иначе ответ от прошлого примера подставился бы в новый
        if (window.TrainerSession && window.TrainerSession.registerField) window.TrainerSession.registerField('qa:' + key + ':' + inp.dataset.fid, inp);
      });
      panel.querySelector('.qa-check').addEventListener('click', check);
      ctl.panel = panel; ctl.key = key; ctl.msg = ''; ctl.msgCls = '';
    }

    function applyState(fields){
      const S = opts.getS(), q = (S && S.quick) || null;
      const done = settled(S);
      ctl.panel.querySelectorAll('.qa-input').forEach(inp => {
        const f = fields.find(x => x.id === inp.dataset.fid);
        if (q && q.vals && q.vals[inp.dataset.fid] != null && (done || document.activeElement !== inp)) inp.value = q.vals[inp.dataset.fid];
        inp.classList.toggle('good', done);
        inp.classList.toggle('bad', !!q && q.res === 'bad' && inp.value === (q.vals || {})[inp.dataset.fid]);
        inp.disabled = done;
        if (!f) return;
      });
      ctl.panel.querySelector('.qa-check').disabled = done;
      let text = ctl.msg, cls = ctl.msgCls;
      if (q && q.res === 'ok') { text = 'Верно! Засчитано. Решение по шагам — ниже, если хочешь его разобрать.'; cls = 'good'; }
      else if (q && q.res === 'fail') { text = 'Верный ответ подставлен. Разбери решение по шагам ниже.'; cls = 'bad'; }
      else if (q && q.res === 'bad' && !text) { text = 'Неверно. Исправь ответ или реши по шагам.'; cls = 'bad'; }
      const m = ctl.panel.querySelector('.qa-msg');
      m.textContent = text || '';
      m.className = 'qa-msg' + (cls ? ' ' + cls : '');
      // «Следующий пример» — когда пример закрыт ответом: и у того, кто
      // ответил, и у собеседника, которому ответ пришёл снимком
      if (done) { const nb = anchor() && anchor().querySelector('.next-btn'); if (nb) nb.style.display = 'block'; }
    }

    function render(force){
      const S = opts.getS();
      const host = anchor();
      const active = opts.active ? opts.active() : true;
      const fields = active && host ? fieldsNow() : null;
      // решено по шагам без «сразу ответа» — панель больше не нужна
      if (!fields || !S || (S.phase === 'done' && !S.quick)) { drop(); ctl.lastSig = null; return; }
      const key = hashOf([opts.getP(), fields]);
      if (!ctl.panel || ctl.key !== key || !ctl.panel.isConnected || ctl.panel.nextElementSibling !== host) build(fields, key, host);
      const sig = JSON.stringify([key, S.quick || null, S.phase, ctl.msg]);
      if (!force && sig === ctl.lastSig) return;
      ctl.lastSig = sig;
      applyState(fields);
    }

    function flash(text, cls){ ctl.msg = text; ctl.msgCls = cls || ''; render(true); }

    function check(){
      const S = opts.getS();
      const fields = fieldsNow();
      if (!S || !fields || settled(S) || !ctl.panel) return;
      const vals = {}, res = [];
      ctl.panel.querySelectorAll('.qa-input').forEach(inp => { vals[inp.dataset.fid] = inp.value.trim(); });
      for (const f of fields) {
        const r = checkField(f, vals[f.id]);
        if (r.ok === null) {
          const inp = ctl.panel.querySelector('.qa-input[data-fid="' + f.id + '"]');
          if (inp) { inp.classList.remove('shake'); void inp.offsetWidth; inp.classList.add('shake'); inp.focus(); }
          flash(r.why, 'bad');
          return;
        }
        res.push(r.ok);
      }
      ctl.msg = ''; ctl.msgCls = '';
      const tries = ((S.quick && S.quick.tries) || 0) + 1;
      if (res.every(Boolean)) {
        S.quick = { res: 'ok', vals, tries };
        if (opts.onRight) opts.onRight();
      } else if (S.quick && S.quick.res === 'bad') {
        // вторая ошибка — как в ОГЭ: подставляем верный ответ
        const right = {};
        fields.forEach(f => { right[f.id] = prettyValue(f); });
        S.quick = { res: 'fail', vals: right, tries, wrong: vals };
        if (opts.onFail) opts.onFail();
      } else {
        S.quick = { res: 'bad', vals, tries };
        if (opts.onWrong) opts.onWrong();
      }
      render(true);
    }

    // состояние меняют и шаги решения, и снимок собеседника, и «новый пример» —
    // следим так же, как сами тренажёры следят за S для рассылки
    setInterval(() => { try { render(false); } catch (e) {} }, 250);
    ctl.render = () => { try { render(true); } catch (e) { console.error('[quick-answer]', e); } };
    ctl.check = check;
    ctl.render();
    return ctl;
  }

  window.QuickAnswer = { mount, settled, checkField, parseFrac, evalExpr, prettyValue };
})();
