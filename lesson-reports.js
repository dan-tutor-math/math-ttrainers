/* Отчёты преподавателя: локальные черновики, история ученика и панель без
   модального слоя. Идентификатор сессии общий у вкладок одного урока. */
(function(){
  'use strict';
  if (window.LessonReports || window.top !== window.self) return;

  const base = document.currentScript.src;
  const prefix = 'lessonReports:v1:';
  const changed = 'lessonreportschange';
  const esc = text => String(text ?? '').replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));
  const normalize = text => text.trim().toLocaleLowerCase('ru').replaceAll('ё', 'е');
  const dateFormat = new Intl.DateTimeFormat('ru-RU', { dateStyle:'medium', timeStyle:'short' });
  const scoped = owner => prefix + owner + ':';
  const keyFor = c => scoped(c.owner) + 'report:' + c.studentId + ':' + (c.reportId || c.startedAt);
  const topicPrefix = owner => scoped(owner) + 'topic:';
  const ownKey = (owner, topic) => topicPrefix(owner) + encodeURIComponent(topic.id);

  let active = null, dock = null, panel = null, offers = null, topicsLoad = null, opening = 0;
  const pending = new Map();

  const style = document.createElement('link');
  style.rel = 'stylesheet';
  style.href = new URL('lesson-reports.css', base).href;
  document.head.appendChild(style);

  function read(key, fallback = null){
    try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch (e) { return fallback; }
  }

  function scan(prefix){
    try { return Object.keys(localStorage).filter(key => key.startsWith(prefix)).map(key => read(key)).filter(Boolean); }
    catch (e) { return []; }
  }

  function write(key, value){
    try { localStorage.setItem(key, JSON.stringify(value)); }
    catch (e) { return false; }
    window.dispatchEvent(new CustomEvent(changed, { detail:key }));
    return true;
  }

  function blank(context){
    return { ...context, topics:[], note:'', rating:null, ratingScale:5, savedAt:null };
  }

  function loadTopics(){
    if (window.LessonReportTopics) return Promise.resolve(window.LessonReportTopics);
    if (!topicsLoad) topicsLoad = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = new URL('lesson-report-topics.js', base).href;
      script.onload = () => resolve(window.LessonReportTopics);
      script.onerror = () => { topicsLoad = null; script.remove(); reject(new Error()); };
      document.head.appendChild(script);
    });
    return topicsLoad;
  }

  function sessionAllowed(){
    return !window.StudentMemory?.isFollower();
  }

  function allowed(context){
    return sessionAllowed() && context.owner && context.owner === window.StudentMemory?.reportOwner?.();
  }

  function controls(){
    return '<div class="lr-controls">' +
      '<button class="lr-circle" type="button" data-lr="minimize" aria-label="Свернуть" title="Свернуть"></button>' +
      '<button class="lr-circle" type="button" data-lr="close" aria-label="Закрыть" title="Закрыть"></button></div>';
  }

  function dockNode(){
    if (!dock) {
      dock = document.createElement('div');
      dock.className = 'lr-dock';
      document.body.appendChild(dock);
    }
    return dock;
  }

  function renderOffers(){
    if (!offers && !pending.size) return;
    if (!offers) {
      offers = document.createElement('div');
      offers.className = 'lr-offers';
      offers.setAttribute('aria-live', 'polite');
      dockNode().appendChild(offers);
    }
    offers.replaceChildren();
    for (const [key, context] of pending){
      if (!allowed(context)) continue;
      const row = document.createElement('div');
      row.className = 'lr-offer';
      const saved = read(key);
      row.innerHTML = '<span>' + esc(context.studentName || 'Урок') + '</span>' +
        '<button type="button" class="lr-offer-open">' +
        (saved?.savedAt ? 'Открыть отчёт' : saved ? 'Продолжить отчёт' : 'Заполнить отчёт') + '</button>' +
        '<button class="lr-circle" type="button" data-lr="close" aria-label="Закрыть предложение" title="Закрыть"></button>';
      row.querySelector('.lr-offer-open').onclick = e => open(context, e.currentTarget);
      row.querySelector('[data-lr="close"]').onclick = () => {
        pending.delete(key);
        renderOffers();
        focusReturn();
      };
      offers.appendChild(row);
    }
  }

  function offer(context){
    if (!allowed(context)) return;
    const key = keyFor(context), stored = read(key);
    // Повторное завершение по другому пути не меняет записанное время конца.
    const endedAt = stored?.endedAt || active?.key === key && active.report.endedAt || context.endedAt;
    if (stored && !stored.endedAt) write(key, { ...stored, endedAt });
    if (active?.key === key) {
      active.report.endedAt = endedAt;
      renderMeta();
      return;
    }
    if (!pending.has(key)) pending.set(key, { ...context, endedAt });
    renderOffers();
  }

  function panelNode(){
    if (panel) return panel;
    panel = document.createElement('section');
    panel.className = 'lr-panel';
    panel.setAttribute('aria-labelledby', 'lrTitle');
    panel.addEventListener('click', handleClick);
    panel.addEventListener('submit', handleSubmit);
    panel.addEventListener('change', handleChange);
    panel.addEventListener('input', handleInput);
    // Клавиши редактирования в панели не должны запускать действия доски.
    panel.addEventListener('keydown', event => {
      if (event.target.name === 'search' && event.key === 'Enter') event.preventDefault();
      event.stopPropagation();
    });
    dockNode().prepend(panel);
    return panel;
  }

  async function open(context, trigger){
    if (!allowed(context)) return;
    const key = keyFor(context);
    if (active?.key === key) { expand(); return; }
    const token = ++opening;
    const stored = read(key);
    const first = stored?.topics[0]?.id || '';
    const topicExam = stored?.topics[0]?.exam;
    const schoolGrade = /^math:school:(\d+):/.exec(first)?.[1];
    const topicGrade = Number(schoolGrade || context.grade);
    const exam = topicExam || context.exam;
    active = {
      key, report:stored || blank(context), trigger,
      tab:first.startsWith('own:') ? 'own' : schoolGrade ? 'school' : exam ? 'exam' : 'school',
      exam:exam || 'oge', grade:topicGrade >= 5 && topicGrade <= 11 ? topicGrade : 9, query:'', topics:null,
      customText:'', minimized:false, storageError:false,
    };
    pending.delete(key);
    renderOffers();
    render();
    panel.querySelector('#lrTitle').focus({ preventScroll:true });
    try {
      const topics = await loadTopics();
      if (token !== opening || active?.key !== key) return;
      active.topics = topics;
      if (!topics.exams.some(exam => exam.id === active.exam)) active.exam = 'oge';
      renderFilters();
    } catch (e) {
      if (token === opening && active?.key === key && !active.minimized) {
        panel.querySelector('.lr-results').textContent = 'Каталог не загрузился. Проверьте подключение и откройте отчёт снова.';
      }
    }
  }

  function focusReturn(trigger){
    const fallback = offers?.querySelector('.lr-offer-open') ||
      document.querySelector('#smBar [data-sm="report"], #smBar [data-sm="expand"], #smBar [data-sm="pick"], #smBar [data-sm="start"]');
    (trigger?.isConnected ? trigger : fallback)?.focus({ preventScroll:true });
  }

  function close(restore = true){
    if (restore) focusReturn(active?.trigger);
    opening++;
    active = null;
    if (panel) { panel.hidden = true; panel.replaceChildren(); }
  }

  function accountChanged(owner){
    window.dispatchEvent(new Event('lessonreportownerchange'));
    let redraw = false;
    for (const [key, context] of pending){
      if (context.owner !== owner) { pending.delete(key); redraw = true; }
    }
    if (redraw) renderOffers();
    if (active && active.report.owner !== owner) close(false);
  }

  function renderMeta(){
    const meta = panel?.querySelector('.lr-meta');
    if (!meta || !active) return;
    const { studentName, startedAt, endedAt } = active.report;
    const time = endedAt ? dateFormat.format(startedAt) : 'Текущий урок';
    meta.textContent = [studentName, time].filter(Boolean).join(' · ');
  }

  function expand(){
    active.minimized = false;
    render();
    panel.querySelector('#lrTitle')?.focus();
  }

  function render(){
    const { report, minimized } = active;
    const box = panelNode();
    box.hidden = false;
    box.classList.toggle('lr-minimized', minimized);
    if (minimized) {
      box.innerHTML = '<button type="button" class="lr-restore" data-lr="expand" id="lrTitle">Отчёт · ' +
        esc(report.studentName || 'урок') + '</button>' +
        '<button type="button" class="lr-circle" data-lr="close" aria-label="Закрыть" title="Закрыть"></button>';
      return;
    }
    box.innerHTML = '<header class="lr-head"><div><h2 id="lrTitle" tabindex="-1">Отчёт об уроке</h2><p class="lr-meta"></p></div>' +
      controls() + '</header>' +
      '<form class="lr-form"><div class="lr-body"><div class="lr-selected"></div>' +
      '<div class="lr-tabs" role="group" aria-label="Источник тем">' +
      '<button type="button" data-lr="tab" data-tab="exam">Экзамены</button>' +
      '<button type="button" data-lr="tab" data-tab="school">По классам</button>' +
      '<button type="button" data-lr="tab" data-tab="own">Мои темы</button></div>' +
      '<div class="lr-filters"><label class="lr-select"></label>' +
      '<input class="lr-search" name="search" type="search" aria-label="Поиск по темам" placeholder="Найти тему" maxlength="140" autocomplete="off"></div>' +
      '<div class="lr-results" aria-label="Темы для выбора"></div>' +
      '<div class="lr-custom"><input name="custom" aria-label="Название своей темы" placeholder="Своя тема" maxlength="140" autocomplete="off">' +
      '<button type="submit" value="custom">Добавить</button></div>' +
      '<div class="lr-rating"><label for="lrRating">Оценка</label>' +
      '<select id="lrRating" name="rating"></select>' +
      '<select name="ratingScale" aria-label="Шкала оценки"><option value="5">из 5</option><option value="10">из 10</option></select></div>' +
      '<label class="lr-note-label">Комментарий <span>необязательно</span>' +
      '<textarea name="note" maxlength="1000" rows="2" placeholder="Что важно запомнить"></textarea></label></div>' +
      '<footer class="lr-foot"><div class="lr-status" role="status"></div><button type="submit" value="save" class="lr-save">Сохранить отчёт</button></footer></form>';
    box.querySelector('textarea').value = report.note;
    box.querySelector('[name="custom"]').value = active.customText;
    renderMeta();
    renderFilters();
    renderSelected();
  }

  function renderFilters(){
    if (active.minimized) return;
    const { topics, tab, exam, grade, query } = active;
    panel.querySelectorAll('[data-tab]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.tab === tab)));
    const select = panel.querySelector('.lr-select'), search = panel.querySelector('.lr-search');
    select.hidden = !topics || tab === 'own';
    select.parentElement.classList.toggle('lr-exam-filters', !select.hidden && tab === 'exam');
    if (!select.hidden) {
      if (tab === 'exam') {
        select.innerHTML = '<select name="exam" aria-label="Экзамен">' +
          topics.exams.map(item => '<option value="' + item.id + '">' + item.name + '</option>').join('') + '</select>';
        select.firstElementChild.value = exam;
      } else {
        select.innerHTML = '<select name="grade" aria-label="Класс">' +
          Object.keys(topics.school).map(value => '<option value="' + value + '">' + value + ' класс</option>').join('') + '</select>';
        select.firstElementChild.value = grade;
      }
    }
    search.value = query;
    search.placeholder = tab === 'exam' ? 'Номер' : 'Найти тему';
    search.setAttribute('aria-label', tab === 'exam' ? 'Поиск номера' : 'Поиск по темам');
    renderResults();
  }

  function options(){
    const { tab, topics, report, exam, grade } = active;
    if (tab === 'own') return scan(topicPrefix(report.owner)).sort((a, b) => a.label.localeCompare(b.label, 'ru'));
    if (!topics) return [];
    return tab === 'exam' ? topics.examTopics(exam) : topics.schoolTopics(grade);
  }

  function renderResults(keepPosition = false){
    const { tab, topics, report, query } = active;
    const list = panel.querySelector('.lr-results');
    const scroll = keepPosition ? list.scrollTop : 0;
    list.classList.toggle('lr-numbers', tab === 'exam');
    if (!topics && tab !== 'own') { list.textContent = 'Загружаем темы…'; return; }
    const saved = new Set(scan(topicPrefix(report.owner)).map(topic => topic.id));
    const selected = new Set(report.topics.map(topic => topic.id));
    const q = normalize(query).replace(/^№\s*/, '');
    const visible = options().filter(topic => normalize(topic.name).includes(q));
    list.innerHTML = visible.map(topic => {
      const checked = selected.has(topic.id);
      const favorite = tab === 'school' && !saved.has(topic.id)
        ? '<button type="button" class="lr-favorite" data-lr="favorite" data-topic="' + esc(topic.id) +
          '" aria-label="В мои темы: ' + esc(topic.name) + '" title="В мои темы"></button>' : '';
      return '<div class="lr-choice"><button type="button" data-lr="choose" data-topic="' + esc(topic.id) +
        '" aria-pressed="' + checked + '">' + esc(topic.name) + '</button>' + favorite + '</div>';
    }).join('');
    if (!visible.length) list.innerHTML = '<p class="lr-empty">' +
      (q ? 'Ничего не найдено' : 'Добавьте свою тему или сохраните тему из каталога.') + '</p>';
    list.scrollTop = scroll;
  }

  function renderRating(report){
    const scale = report.ratingScale === 10 ? 10 : 5;
    const rating = panel.querySelector('#lrRating');
    if (rating.options.length !== scale + 1) {
      rating.replaceChildren(new Option('—', ''));
      for (let value = 1; value <= scale; value++) rating.add(new Option(value, value));
    }
    rating.value = report.rating ?? '';
    panel.querySelector('[name="ratingScale"]').value = scale;
  }

  function renderSelected(){
    const { report, storageError } = active;
    const area = panel.querySelector('.lr-selected');
    area.innerHTML = report.topics.length ? '<div class="lr-chips">' + report.topics.map(topic => {
      const label = esc(topic.label), id = esc(topic.id);
      const favorite = topic.exam && !read(ownKey(report.owner, topic))
        ? '<button type="button" class="lr-favorite lr-chip-favorite" data-lr="favorite-selected" data-topic="' + id +
          '" aria-label="В мои темы: ' + label + '" title="В мои темы"></button>' : '';
      return '<div class="lr-chip-row"><button type="button" class="lr-chip" data-lr="remove" data-topic="' + id +
        '" aria-label="Убрать тему: ' + label + '">' + label + '</button>' + favorite + '</div>';
    }).join('') + '</div>' : '<p class="lr-empty">Выберите темы урока</p>';
    renderRating(report);
    const save = panel.querySelector('.lr-save');
    save.disabled = !report.topics.length && !report.rating;
    const status = panel.querySelector('.lr-status');
    status.textContent = storageError ? 'Не удалось сохранить в браузере. Повторите попытку.' :
      report.savedAt ? 'Отчёт сохранён' : report.topics.length || report.note || report.rating ? 'Черновик' : '';
    status.classList.toggle('lr-error', storageError);
  }

  function updateReport(change){
    const { key, report, storageError } = active;
    // Берём свежую запись и меняем только текущее поле: соседняя вкладка
    // могла сохранить тему, пока здесь дописывали комментарий.
    const stored = storageError ? null : read(key);
    const next = change({ ...(stored || report), endedAt:stored?.endedAt || report.endedAt || null });
    active.report = next;
    active.storageError = !write(key, next);
    renderSelected();
  }

  function changeTopic(topic, add){
    updateReport(report => {
      const topics = report.topics.filter(item => item.id !== topic.id);
      if (add) topics.push(topic);
      return { ...report, topics, savedAt:null };
    });
  }

  function remember(topic){
    const ok = write(ownKey(active.report.owner, topic), topic);
    if (!ok) {
      active.storageError = true;
      renderSelected();
    } else {
      panel.querySelector('.lr-status').textContent = 'Добавлено в «Мои темы»';
    }
    return ok;
  }

  function handleClick(event){
    const button = event.target.closest('button[data-lr]');
    if (!button || !active || !allowed(active.report)) return;
    const action = button.dataset.lr;
    if (action === 'close') { close(); return; }
    if (action === 'expand') { expand(); return; }
    if (action === 'minimize') { active.minimized = true; render(); panel.querySelector('.lr-restore').focus(); return; }
    if (action === 'tab') { active.tab = button.dataset.tab; active.query = ''; renderFilters(); return; }
    const id = button.dataset.topic;
    if (action === 'favorite-selected') {
      const topic = active.report.topics.find(item => item.id === id);
      if (topic && remember({ ...topic, name:topic.label })) {
        renderSelected();
        panel.querySelector('.lr-status').textContent = 'Добавлено в «Мои темы»';
        panel.querySelector('.lr-search').focus();
      }
      return;
    }
    if (action === 'remove') {
      changeTopic({ id }, false);
      renderResults(true);
      panel.querySelector('.lr-search').focus();
      return;
    }
    const topic = options().find(item => item.id === id);
    if (!topic) return;
    if (action === 'favorite') remember(topic);
    if (action === 'choose') changeTopic(topic, button.getAttribute('aria-pressed') !== 'true');
    renderResults(true);
    Array.from(panel.querySelectorAll('[data-lr="choose"]')).find(item => item.dataset.topic === id)?.focus({ preventScroll:true });
  }

  function handleChange(event){
    if (!active || !allowed(active.report)) return;
    if (event.target.name === 'ratingScale') {
      const ratingScale = Number(event.target.value);
      updateReport(report => {
        const rating = report.rating ?? null;
        return { ...report, ratingScale, rating:rating > ratingScale ? null : rating, savedAt:null };
      });
      return;
    }
    if (event.target.name === 'rating') {
      const rating = Number(event.target.value) || null;
      const ratingScale = Number(event.target.form.elements.ratingScale.value);
      updateReport(report => ({ ...report, rating, ratingScale, savedAt:null }));
      return;
    }
    if (event.target.name === 'grade') active.grade = Number(event.target.value);
    else if (event.target.name === 'exam') active.exam = event.target.value;
    else return;
    renderResults();
  }

  function handleInput(event){
    if (!active || !allowed(active.report)) return;
    if (event.target.name === 'search') { active.query = event.target.value; renderResults(); }
    if (event.target.name === 'note') updateReport(report => ({ ...report, note:event.target.value, savedAt:null }));
    if (event.target.name === 'custom') active.customText = event.target.value;
  }

  function handleSubmit(event){
    event.preventDefault();
    if (!active || !allowed(active.report)) return;
    const form = event.target;
    const field = form.elements.custom;
    const action = event.submitter?.value || (document.activeElement === field ? 'custom' : 'save');
    if (action === 'custom') {
      const name = field.value.trim();
      if (!name) { field.focus(); return; }
      const topic = { id:'own:' + normalize(name), name, label:name };
      if (remember(topic)) {
        changeTopic(topic, true);
        field.value = active.customText = '';
        renderResults(true);
      }
    } else if (active.report.topics.length || active.report.rating) {
      updateReport(report => ({ ...report, note:report.note.trim(), savedAt:Date.now() }));
    }
  }

  function mountHistory(box, student, owner){
    const prefixForStudent = scoped(owner) + 'report:' + student.id + ':';
    function render(){
      if (!allowed({ owner })) { box.replaceChildren(); return; }
      const reports = scan(prefixForStudent)
        .filter(report => report.topics.length || report.note.trim() || report.rating)
        .sort((a, b) => b.startedAt - a.startedAt);
      const selectedKey = document.activeElement?.dataset.reportKey;
      const trigger = active?.trigger;
      const triggerKey = trigger && box.contains(trigger) ? trigger.dataset.reportKey : null;
      box.innerHTML = '<section class="memory lr-history" aria-label="Отчёты об уроках"><div class="mhead"><b>Отчёты об уроках</b></div>' +
        (reports.length ? reports.map(report => {
          const summary = report.topics.map(topic => topic.label);
          if (report.rating) summary.push('Оценка ' + report.rating + '/' + report.ratingScale);
          return '<div class="lr-history-row"><div><time datetime="' +
            new Date(report.startedAt).toISOString() + '">' + esc(dateFormat.format(report.startedAt)) + '</time>' +
            (report.savedAt ? '' : '<span class="lr-draft">Черновик</span>') +
            (summary.length ? '<p>' + esc(summary.join(' · ')) + '</p>' : '') + '</div>' +
            '<button type="button" class="btn quiet small" data-report-key="' + esc(keyFor(report)) + '">' +
            (report.savedAt ? 'Открыть' : 'Продолжить') + '</button></div>';
        }).join('') :
          '<p class="hint">Отчётов пока нет.</p>') + '</section>';
      for (const button of box.querySelectorAll('[data-report-key]')) {
        if (button.dataset.reportKey === selectedKey) button.focus();
        if (button.dataset.reportKey === triggerKey) active.trigger = button;
      }
    }
    function onChange(event){
      if ((event.detail || event.key || '').startsWith(prefixForStudent)) render();
    }
    function onClick(event){
      const button = event.target.closest('[data-report-key]');
      if (!button || !button.dataset.reportKey.startsWith(prefixForStudent)) return;
      const report = read(button.dataset.reportKey);
      if (report) open(report, button);
    }
    box.addEventListener('click', onClick);
    window.addEventListener(changed, onChange);
    window.addEventListener('storage', onChange);
    window.addEventListener('lessonreportownerchange', render);
    render();
    return () => {
      box.removeEventListener('click', onClick);
      window.removeEventListener(changed, onChange);
      window.removeEventListener('storage', onChange);
      window.removeEventListener('lessonreportownerchange', render);
    };
  }

  window.LessonReports = { open, offer, mountHistory, accountChanged };
})();
