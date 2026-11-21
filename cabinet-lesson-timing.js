/* Время и дата одного занятия. Один редактор используется во всех карточках кабинета. */
(function(){
  'use strict';

  const MONTHS = ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'];
  const WEEK = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
  const labels = { start:'начала', end:'окончания' };
  const pad = number => String(number).padStart(2, '0');
  const hm = minute => pad(Math.floor(minute / 60)) + ':' + pad(minute % 60);
  const ymd = date => date.getFullYear() + '-' + pad(date.getMonth() + 1) + '-' + pad(date.getDate());
  const esc = text => String(text).replace(/[&<>"]/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;' }[c]));
  const eventName = 'cabinet:lesson-timing';
  let active = null;

  function pairButtons(kind, value){
    const [hours, minutes] = hm(value).split(':');
    return '<span class="cab-timing-pair">' +
      '<button type="button" data-lesson-timing="' + kind + '-hours" aria-label="Часы ' + labels[kind] + ', ' + hours + '">' + hours + '</button>' +
      '<span>:</span><button type="button" data-lesson-timing="' + kind + '-minutes" aria-label="Минуты ' + labels[kind] + ', ' + minutes + '">' + minutes + '</button></span>';
  }

  function buttons(lesson, dateText){
    const time = lesson.start_min == null
      ? '<button type="button" data-lesson-timing="start-hours">Задать время</button>'
      : pairButtons('start', lesson.start_min) + '<span class="cab-timing-dash">–</span>' +
        pairButtons('end', Math.min(1440, lesson.start_min + lesson.dur_min));
    return '<div class="cab-timing">' +
      '<button type="button" data-lesson-timing="day" aria-label="Изменить дату, ' + esc(dateText) + '">' + esc(dateText) + '</button>' +
      '<span class="cab-timing-time">' + time + '</span></div>';
  }

  function notify(id, values){
    const patch = {};
    for (const key of ['day', 'start_min', 'dur_min']) if (key in values) patch[key] = values[key];
    if (Object.keys(patch).length) window.dispatchEvent(new CustomEvent(eventName, { detail:{ id, patch } }));
  }

  function open(lesson, trigger, save, findTrigger){
    if (!lesson || active) return;
    const mode = trigger.dataset.lessonTiming;
    const dateMode = mode === 'day';
    const dialog = document.createElement('dialog');
    dialog.className = 'panel cab-timing-dialog';
    dialog.setAttribute('aria-label', dateMode ? 'Дата занятия' : 'Время занятия');
    const title = dateMode ? 'Дата занятия' : 'Время занятия';
    dialog.innerHTML = '<h2>' + title + '</h2><div class="cab-timing-content"></div>' +
      '<p class="form-msg" role="status"></p><div class="row-btns cab-timing-actions">' +
      '<button type="button" class="btn quiet small" data-cancel>Отмена</button>' +
      (dateMode ? '' : '<button class="btn small" type="submit" form="cabTimingForm">Сохранить</button>') + '</div>';
    document.body.append(dialog);
    const content = dialog.querySelector('.cab-timing-content');
    const status = dialog.querySelector('[role="status"]');
    const cancel = dialog.querySelector('[data-cancel]');
    const actions = dialog.querySelectorAll('.cab-timing-actions button');
    const session = active = { dialog, busy:false };
    dialog.addEventListener('close', () => {
      dialog.remove();
      if (active === session) active = null;
      (trigger.isConnected ? trigger : findTrigger?.())?.focus({ preventScroll:true });
    }, { once:true });
    dialog.addEventListener('cancel', e => { if (session.busy) e.preventDefault(); });
    cancel.addEventListener('click', () => dialog.close());

    async function commit(patch){
      if (session.busy) return;
      if (Object.keys(patch).every(key => patch[key] === lesson[key])) { dialog.close(); return; }
      const focused = document.activeElement;
      session.busy = true;
      dialog.setAttribute('aria-busy', 'true');
      content.inert = true;
      actions.forEach(button => { button.disabled = true; });
      status.textContent = 'Сохраняем…';
      try {
        await save(lesson, patch);
        dialog.close();
      } catch (e) {
        status.textContent = 'Не сохранилось: ' + e.message;
      } finally {
        session.busy = false;
        dialog.removeAttribute('aria-busy');
        content.inert = false;
        actions.forEach(button => { button.disabled = false; });
        if (dialog.open) focused?.focus();
      }
    }

    if (dateMode) calendar(content, lesson.day, day => commit({ day }));
    else timeForm(content, lesson, mode, status, start_min => commit({ start_min }));
    dialog.showModal();
    dialog.querySelector(dateMode ? '[aria-pressed="true"]' : '[data-part="' + mode + '"]')?.focus();
  }

  function calendar(content, selected, choose){
    const [year, month] = selected.split('-').map(Number);
    let first = new Date(year, month - 1, 1);
    function paint(){
      const y = first.getFullYear(), m = first.getMonth();
      const offset = (first.getDay() + 6) % 7;
      const count = new Date(y, m + 1, 0).getDate();
      const week = WEEK.map(label => '<span class="cab-timing-week">' + label + '</span>').join('');
      const days = Array.from({ length:count }, (_, i) => {
        const value = ymd(new Date(y, m, i + 1));
        return '<button type="button" data-day="' + value + '" aria-label="' + value + '" aria-pressed="' + (value === selected) + '">' + (i + 1) + '</button>';
      }).join('');
      content.innerHTML = '<div class="cab-timing-month">' +
        '<button type="button" class="btn quiet small" data-month="-1" aria-label="Предыдущий месяц">‹</button>' +
        '<strong aria-live="polite">' + MONTHS[m] + ' ' + y + '</strong>' +
        '<button type="button" class="btn quiet small" data-month="1" aria-label="Следующий месяц">›</button></div>' +
        '<div class="cab-timing-calendar">' + week + '<span></span>'.repeat(offset) + days + '</div>';
    }
    content.addEventListener('click', e => {
      const button = e.target.closest('button');
      if (button?.dataset.day) choose(button.dataset.day);
      else if (button?.dataset.month) {
        const direction = button.dataset.month;
        first = new Date(first.getFullYear(), first.getMonth() + Number(direction), 1);
        paint();
        content.querySelector('[data-month="' + direction + '"]').focus();
      }
    });
    paint();
  }

  function timeForm(content, lesson, mode, status, choose){
    const group = (kind, title) => '<fieldset class="cab-timing-field"><legend>' + title + '</legend>' +
      '<input class="field" inputmode="numeric" maxlength="2" placeholder="00" aria-label="Часы ' + labels[kind] + '" data-part="' + kind + '-hours">' +
      '<span aria-hidden="true">:</span><input class="field" inputmode="numeric" maxlength="2" placeholder="00" aria-label="Минуты ' + labels[kind] +
      '" data-part="' + kind + '-minutes" enterkeyhint="done"></fieldset>';
    content.innerHTML = '<form class="cab-timing-form" id="cabTimingForm">' +
      group('start', 'Начало') + group('end', 'Конец') + '</form>';
    const form = content.firstElementChild;
    const input = name => form.querySelector('[data-part="' + name + '"]');
    const set = (kind, minute) => {
      const [hours, minutes] = minute == null ? ['', ''] : hm(minute).split(':');
      input(kind + '-hours').value = hours;
      input(kind + '-minutes').value = minutes;
    };
    const duration = lesson.dur_min;
    let edited = mode.split('-')[0];
    set('start', lesson.start_min);
    set('end', lesson.start_min == null ? null : Math.min(1440, lesson.start_min + duration));

    function read(){
      const hh = input(edited + '-hours').value, mm = input(edited + '-minutes').value;
      if (!hh || !mm || Number(mm) > 59 || Number(hh) > 24 || (hh === '24' && mm !== '00')) return null;
      return Number(hh) * 60 + Number(mm);
    }
    function startFrom(value){ return edited === 'start' ? value : value - duration; }
    function fits(start){ return start >= 0 && start + duration <= 1440; }
    function sync(){
      const value = read(), other = edited === 'start' ? 'end' : 'start';
      if (value == null || !fits(startFrom(value))) set(other, null);
      else set(other, edited === 'start' ? value + duration : value - duration);
      status.textContent = '';
    }

    form.querySelectorAll('input').forEach(field => {
      const [kind, part] = field.dataset.part.split('-');
      field.addEventListener('focus', () => field.select());
      field.addEventListener('click', () => field.select());
      field.addEventListener('input', () => {
        field.value = field.value.replace(/\D/g, '').slice(0, 2);
        edited = kind;
        sync();
        if (part === 'hours' && field.value.length === 2) input(kind + '-minutes').focus();
      });
      field.addEventListener('blur', () => { if (field.value.length === 1) field.value = pad(field.value); });
      field.addEventListener('paste', e => {
        const value = e.clipboardData.getData('text').trim();
        if (!/^\d{2}:?\d{2}$/.test(value)) return;
        e.preventDefault();
        const digits = value.replace(':', '');
        input(kind + '-hours').value = digits.slice(0, 2);
        input(kind + '-minutes').value = digits.slice(2);
        edited = kind;
        sync();
        input(kind + '-minutes').focus();
      });
    });
    form.addEventListener('submit', e => {
      e.preventDefault();
      const value = read();
      if (value == null) { status.textContent = 'Введите часы и минуты.'; return; }
      const start = startFrom(value);
      if (!fits(start)) { status.textContent = 'Занятие с этой длительностью должно помещаться в один день.'; return; }
      choose(start);
    });
  }

  window.CabinetLessonTiming = { buttons, open, notify, eventName, close:() => active?.dialog.close() };
})();
