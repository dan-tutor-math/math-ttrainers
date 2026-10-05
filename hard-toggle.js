/* ═══════════════════════════════════════════════════════════════════════
   Промпт №18 нового списка: галочка усложнения числами.

   Первая — в ОГЭ №8 и «Степенях»: «Нулевые и отрицательные степени».
   Сделана общим компонентом, потому что такой же выбор нужен везде, где
   задание той же темы становится труднее не другим действием, а другими
   ЧИСЛАМИ: дроби вместо целых, отрицательные, иррациональности. Тема и
   приём решения те же — значит, это не новый тип и не уровень, а
   переключатель поверх любого типа.

   Правила одни на все тренажёры:
   - по умолчанию выключена — задания на «простых» числах;
   - выбор помнится на устройстве (localStorage «hardToggle:<ключ>») и не
     сбрасывается при смене типа, режима и при перезагрузке;
   - пришедшее снимком от собеседника (или доской в невидимый кадр)
     применяется без записи в localStorage: иначе чужая сессия или
     «ещё такое же» на доске меняли бы мой собственный выбор на этом
     устройстве.

   Подключение (галочку рисует модуль, что она значит — решает страница):
     const ht = HardToggle.mount({
       host: элемент, куда поставить,
       key: 'oge8', label: 'Нулевые и отрицательные степени',
       title: 'подсказка при наведении',
       wrap: fn => guardStudentAction('refreshAll', fn),   // необязательно
       onChange(on) { … },                                 // только по нажатию
     });
     ht.get() / ht.set(on, { persist:false }) / ht.setDisabled(true, 'почему')
   Состояние в снимок сессии кладёт страница (поле в tsGetState), модуль
   про сессию ничего не знает.
   ═══════════════════════════════════════════════════════════════════════ */
(function () {
  if (window.HardToggle) return;

  const CSS = `
    .hard-toggle{display:inline-flex;align-items:center;gap:9px;flex:0 0 auto;
      font-family:var(--font-ui);font-weight:600;font-size:14px;line-height:1.2;color:var(--muted-3);
      background:none;border:none;padding:6px 2px;margin:0;cursor:pointer;text-align:left;
      -webkit-tap-highlight-color:transparent;user-select:none;-webkit-user-select:none;}
    .hard-toggle .ht-box{width:20px;height:20px;flex:0 0 20px;box-sizing:border-box;border-radius:6px;
      border:1.5px solid var(--muted-1);background:var(--card);display:inline-flex;align-items:center;justify-content:center;
      transition:background .15s, border-color .15s, transform .15s;}
    .hard-toggle .ht-box svg{width:14px;height:14px;opacity:0;transform:scale(.6);transition:opacity .15s, transform .15s;}
    .hard-toggle:hover .ht-box{border-color:var(--ink);}
    .hard-toggle:active .ht-box{transform:scale(.9);}
    .hard-toggle[aria-checked="true"]{color:var(--ink);}
    .hard-toggle[aria-checked="true"] .ht-box{background:var(--ink);border-color:var(--ink);}
    .hard-toggle[aria-checked="true"] .ht-box svg{opacity:1;transform:none;}
    .hard-toggle:focus-visible{outline:2px solid var(--ink);outline-offset:2px;border-radius:8px;}
    .hard-toggle.ht-off{opacity:.45;cursor:default;}
    .hard-toggle.ht-off:hover .ht-box{border-color:var(--muted-1);}
  `;
  const CHECK = '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3.2 8.4l3 3 6.6-6.8" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>';

  function readPref(key) {
    try { return localStorage.getItem('hardToggle:' + key) === '1'; } catch (e) { return false; }
  }
  function writePref(key, on) {
    try { localStorage.setItem('hardToggle:' + key, on ? '1' : '0'); } catch (e) {}
  }

  function mount(opts) {
    if (!document.getElementById('hardToggleStyle')) {
      const st = document.createElement('style');
      st.id = 'hardToggleStyle';
      st.textContent = CSS;
      document.head.appendChild(st);
    }
    const key = opts.key;
    let on = readPref(key);
    let off = false;

    const el = document.createElement('button');
    el.type = 'button';
    el.className = 'hard-toggle';
    el.id = opts.id || 'hardToggle';
    el.setAttribute('role', 'checkbox');
    el.innerHTML = '<span class="ht-box">' + CHECK + '</span><span class="ht-label"></span>';
    el.querySelector('.ht-label').textContent = opts.label;
    const baseTitle = opts.title || '';
    if (opts.host) opts.host.appendChild(el);

    function paint() {
      el.setAttribute('aria-checked', on ? 'true' : 'false');
      el.classList.toggle('ht-off', off);
      el.setAttribute('aria-disabled', off ? 'true' : 'false');
    }
    paint();
    el.title = baseTitle;

    const click = () => {
      if (off) return;
      on = !on;
      writePref(key, on);
      paint();
      if (opts.onChange) opts.onChange(on);
    };
    el.addEventListener('click', opts.wrap ? opts.wrap(click) : click);

    return {
      el,
      get: () => on,
      // persist: false — пришло от собеседника или из снимка доски
      set(v, o) {
        v = !!v;
        if (o && o.persist) writePref(key, v);
        if (v === on) return;
        on = v;
        paint();
      },
      setDisabled(dis, why) {
        off = !!dis;
        el.title = off && why ? why : baseTitle;
        paint();
      },
    };
  }

  window.HardToggle = { mount, readPref };
})();
