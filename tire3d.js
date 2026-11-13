/* Размеры, маркировка и формулы используют одну палитру, чтобы цвет помогал
   ученику проследить величину от шины до вычисления. */
(function () {
  'use strict';
  const COLORS = Object.freeze({ B: '#2A5DBF', H: '#D45F23', R: '#A2A2A0', d: '#509B4C', D: '#7D5CDA' });
  const QUANTITY_BY_COLOR = Object.fromEntries(Object.entries(COLORS).map(([key, hex]) => {
    const channels = hex.slice(1).match(/../g).map(value => parseInt(value, 16));
    return [`rgb(${channels.join(', ')})`, key];
  }));
  const M = window.TireMath;
  const DEFAULT = Object.freeze({ width: 175, profile: 70, rim: 12 });
  const SECOND = Object.freeze({ width: 195, profile: 65, rim: 15 });
  const SCENES = ['width', 'side', 'rim', 'diam', 'run', 'compare'];
  const $ = id => document.getElementById(id);
  const host = $('modelHost'), overlay = $('dimensions');
  const embedded = new URLSearchParams(location.search).get('embed') === '1';
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const TURN = Math.PI * 2;
  const FIELD_OF_VIEW = 36;
  const ROLL_DURATION = 3600, COMPARE_DURATION = 900, SPREAD_DURATION = 450;
  const DIVISION_INTERVAL = 360;
  const THREAD_DURATION = ROLL_DURATION + 4 * DIVISION_INTERVAL;
  const PRESENTATION_DURATION = 320;
  const FORMULA_INTERVAL = 620;
  let THREE, controls, renderer, scene3, camera, content, wheels = [], raf = 0;
  let transition = null, lessonMotion = null, spreadMotion = null;
  let presentationMotion = null, solutionMotion = null;
  let formulaRows = [], formulaFocus = null, formulaLoopTimer = 0;
  let lessonProgress = 0, spreadAmount = 0, measureDrag = null;
  let fallback = false, disposed = false, frameCount = 0;
  let applying = false, ready = false, radial = false, cameraInteracting = false;
  let lastCameraSent = 0, cameraSendTimer = 0, snapshotTimer = 0;
  let lastLocalSig = '', lastRemoteSig = '', rev = -1, revBy = '';
  const ownBy = Math.random().toString(36).slice(2);
  let resolveReady;
  const readyPromise = new Promise(resolve => { resolveReady = resolve; });
  const validTire = t => t && Number.isInteger(t.width) && t.width >= 125 && t.width <= 355 && t.width % 5 === 0 && Number.isInteger(t.profile) && t.profile >= 25 && t.profile <= 85 && t.profile % 5 === 0 && Number.isInteger(t.rim) && t.rim >= 12 && t.rim <= 22;
  function cleanTire(t, def = DEFAULT) { return validTire(t) ? { width: t.width, profile: t.profile, rim: t.rim } : { ...def }; }
  function urlTire(q, suffix, def) {
    const keys = ['w', 'p', 'r'].map(k => k + suffix);
    if (!keys.some(k => q.has(k))) return { ...def };
    const t = { width: Number(q.get(keys[0])), profile: Number(q.get(keys[1])), rim: Number(q.get(keys[2])) };
    return cleanTire(t, def);
  }
  const q = new URLSearchParams(location.search);
  function cleanAngle(value, fallbackAngle) {
    if (!Number.isFinite(value)) return fallbackAngle;
    return value >= 0 && value < TURN ? value : (value % TURN + TURN) % TURN;
  }
  function urlAngle(key, fallbackAngle) {
    return q.has(key) ? cleanAngle(Number(q.get(key)), fallbackAngle) : fallbackAngle;
  }
  let savedStyle = 'real';
  try { savedStyle = localStorage.getItem('tire3d:style') || 'real'; } catch (e) {}
  const firstTire = urlTire(q, '', DEFAULT);
  // В демонстрации без второй маркировки сразу видна разница. Явно
  // заданные одинаковые шины всё равно можно сравнить.
  const secondDefault = M.mark(firstTire) === M.mark(SECOND) && !['w2', 'p2', 'r2'].some(key => q.has(key)) ? DEFAULT : SECOND;
  let state = { v: 1, tire: firstTire, tire2: urlTire(q, '2', secondDefault),
    scene: SCENES.includes(q.get('scene')) ? q.get('scene') : 'width', step: /^\d+$/.test(q.get('step') || '') ? Number(q.get('step')) : 0,
    style: ['real', 'glass'].includes(q.get('style')) ? q.get('style') : ['real', 'glass'].includes(savedStyle) ? savedStyle : 'real',
    cut: false, allDimensions: q.get('all') === '1', camera: null, measure: q.get('measure') === 'radius' ? 'radius' : 'diameter',
    spread: q.get('spread') === '1', sideAngle: urlAngle('hAngle', Math.PI / 2), widthAngle: urlAngle('bAngle', 0), demoReplay: 0,
    mode: q.get('mode') === 'interactive' ? 'interactive' : 'reference', showSolution: q.get('solution') === '1',
    formulaRow: /^\d+$/.test(q.get('line') || '') ? Number(q.get('line')) : null };
  const copy = o => JSON.parse(JSON.stringify(o));
  const color = (key, text) => `{\\color{${COLORS[key]}}{${text}}}`;
  const n = M.fmt;
  const b = t => color('B', t.width), p = t => color('H', t.profile), r = t => color('d', t.rim);
  const H = t => color('H', n(M.h100(t) / 100)), d = t => color('d', n(M.rim100(t) / 100)), D = t => color('D', n(M.d100(t) / 100));
  const letter = key => color(key, key);
  const dims = t => [
    `${letter('H')} = ${b(t)} \\cdot \\dfrac{${p(t)}}{100} = ${H(t)}\\;\\text{мм}`,
    `${letter('d')} = ${r(t)} \\cdot 25{,}4 = ${d(t)}\\;\\text{мм}`,
    `${letter('D')} = ${letter('d')} + 2${letter('H')} = ${d(t)} + 2 \\cdot ${H(t)} = ${D(t)}\\;\\text{мм}`
  ];
  function steps() {
    const a = state.tire, c = state.tire2, comp = M.compare(a, c);
    const signed = comp.delta < 0 ? '−' : '', raw = n(comp.raw1000 / 1000) + (comp.remainder ? '\\ldots' : '');
    const deltaFormula = `${letter('D')}_2 - ${letter('D')}_1 = ${D(c)} - ${D(a)} = ${signed}${color('D', n(comp.diff100 / 100))}\\;\\text{мм}`;
    return {
      width: [
        { title: 'B — ширина шины', text: `Первое число маркировки ${M.mark(a)} — ширина шины в миллиметрах. Нажмите на число или на протектор, чтобы вернуться к этому объяснению.`, f: [`${letter('B')} = ${b(a)}\\;\\text{мм}`] },
        { title: 'Измеряем поперёк протектора', text: 'Стрелка соединяет крайние точки боковин вдоль оси вращения. Потяните за B: в другом месте по окружности ширина останется такой же.', f: [`${letter('B')} = ${b(a)}\\;\\text{мм}`] },
        { title: 'Ширина не зависит от размера диска', text: 'Дюймы и проценты здесь переводить не нужно: первое число уже дано в миллиметрах. В задании 1 сначала найдите подходящий столбец диска в таблице, затем выберите требуемую ширину.', f: [`${letter('B')} = ${b(a)}\\;\\text{мм}`] }
      ],
      side: [
        { title: 'H — высота боковины', text: 'H измеряем от края диска до внешней поверхности протектора. Две одинаковые мерки лежат напротив друг друга. Потяните за любую H, чтобы перенести их вдоль обода.', f: [`${letter('D')} = ${letter('d')} + 2${letter('H')}`] },
        { title: 'H — это II % от I', text: `I — первое число (${a.width}), ширина в мм. II — второе число (${a.profile}), процент от ширины. Второе число не является высотой в миллиметрах.`, f: [`${letter('H')} = \\color{${COLORS.B}}{\\mathrm{I}} \\cdot \\dfrac{\\color{${COLORS.H}}{\\mathrm{II}}}{100}`] },
        { title: 'Переводим процент в долю', text: `Чтобы найти ${a.profile} % от ширины, делим процент на 100 и умножаем на ширину шины.`, f: [`\\dfrac{${p(a)}}{100} = ${color('H', n(a.profile / 100))}`, `${letter('H')} = ${b(a)} \\cdot \\dfrac{${p(a)}}{100}`] },
        { title: 'Вычисляем высоту боковины', text: 'Результат получаем в миллиметрах, поскольку ширина была в миллиметрах. У колеса две боковины вдоль диаметра: одна над диском, другая под ним.', f: [`${letter('H')} = ${b(a)} \\cdot ${color('H', n(a.profile / 100))} = ${H(a)}\\;\\text{мм}`] }
      ],
      rim: [
        { title: 'd — диаметр диска', text: `Последнее число маркировки — ${a.rim}. Это диаметр диска в дюймах. Буква R перед ним означает радиальную конструкцию, а не радиус.`, f: [`${letter('d')} = ${r(a)}\\;\\text{дюймов}`] },
        { title: 'Переводим дюймы в миллиметры', text: 'В одном дюйме ровно 25,4 мм. Умножаем число дюймов на 25,4.', f: [`1\\;\\text{дюйм} = 25{,}4\\;\\text{мм}`, `${letter('d')} = ${r(a)} \\cdot 25{,}4`] },
        { title: 'Размер диска в миллиметрах', text: 'Зелёная стрелка проходит через центр и соединяет края диска. Теперь d и H выражены в одних единицах.', f: [`${letter('d')} = ${r(a)} \\cdot 25{,}4 = ${d(a)}\\;\\text{мм}`] }
      ],
      diam: [
        { title: 'D — диаметр всего колеса', text: 'Тонкие линии ведут от краёв протектора к концам фиолетовой стрелки D. Они показывают, что длина D равна сумме трёх отрезков на колесе: H, d и H.', f: [`${letter('D')} = ${letter('H')} + ${letter('d')} + ${letter('H')}`] },
        { title: 'Две боковины по краям диска', text: 'Оранжевые отрезки — высоты боковин, зелёный — диаметр диска. Складываем отрезки вдоль одного диаметра.', f: [dims(a)[0], dims(a)[1]] },
        { title: 'Складываем H, d и H', text: 'Обе боковины одинаковы. Поэтому их общая высота равна 2H. Все длины уже в миллиметрах.', f: [`${letter('D')} = ${letter('d')} + 2${letter('H')}`, `${letter('D')} = ${d(a)} + 2 \\cdot ${H(a)}`] },
        { title: 'Получаем внешний диаметр', text: 'Это диаметр колеса, который нужен для сравнения шин и расчёта пробега за один оборот.', f: [`${letter('D')} = ${letter('d')} + 2${letter('H')}`, `2${letter('H')} = 2 \\cdot ${H(a)} = ${color('H', n(M.h100(a)*2/100))}\\;\\text{мм}`, `${letter('D')} = ${d(a)} + ${color('H', n(M.h100(a)*2/100))} = ${D(a)}\\;\\text{мм}`] }
      ],
      run: [
        { title: 'Один оборот — одна окружность', text: 'Намотаем нить на колесо ровно один раз. Колесо катится без проскальзывания, и нить остаётся позади на дороге. За один оборот колесо проходит ровно длину этой нити.', f: [`L = \\pi ${letter('D')}`] },
        { title: 'Сколько диаметров в длине нити?', text: 'За полный оборот колесо оставило на дороге нить длиной в одну окружность. В ней укладываются три диаметра целиком и ещё примерно 14 % диаметра. Число π показывает, во сколько раз окружность длиннее диаметра.', f: [`L = 3${letter('D')} + (\\pi - 3)${letter('D')}`, `L \\approx 3${letter('D')} + 0{,}14${letter('D')}`, `L = \\pi \\cdot ${D(a)}\\;\\text{мм}`] },
        { title: 'Пробег зависит только от D', text: 'Ширина B напрямую в эту формулу не входит. Высота боковины и размер диска влияют на пробег через диаметр D. Значение с π точное; десятичное — приближённое.', f: [dims(a)[2], `L = ${D(a)}\\pi\\;\\text{мм}`, `L \\approx ${n(Math.round(Math.PI * M.d100(a)) / 100)}\\;\\text{мм}`] },
        { title: 'Сравниваем пробег двух шин', text: 'Чтобы решить задание 5, сравним заводскую шину с новой. У обеих окружностей один и тот же множитель π, поэтому он сокращается.', f: [`\\dfrac{L_2-L_1}{L_1}\\cdot100\\% = \\dfrac{\\pi ${letter('D')}_2-\\pi ${letter('D')}_1}{\\pi ${letter('D')}_1}\\cdot100\\%`, `= \\dfrac{${letter('D')}_2-${letter('D')}_1}{${letter('D')}_1}\\cdot100\\%`] },
        { title: 'Находим оба диаметра', text: `Заводская шина — ${M.mark(a)}, новая — ${M.mark(c)}. Сначала вычисляем H, d и D для каждой.`, f: [...dims(a), ...dims(c)] },
        { title: 'Изменение пробега в процентах', text: `Основание сравнения — диаметр заводской шины D₁. Знак показывает направление изменения. ${comp.delta < 0 ? 'Пробег уменьшится' : comp.delta > 0 ? 'Пробег увеличится' : 'Пробег не изменится'}. Округляем до десятых: половину вверх.`, f: [deltaFormula, `\\dfrac{${letter('D')}_2-${letter('D')}_1}{${letter('D')}_1}\\cdot100\\% = \\dfrac{${signed}${n(comp.diff100 / 100)}}{${n(comp.d1 / 100)}}\\cdot100\\%`, `= ${signed}${raw}\\% \\approx ${signed}${n(comp.percent10 / 10)}\\%`] }
      ],
      compare: [
        { title: 'Две шины в одном масштабе', text: `Слева ${state.measure === 'radius' ? 'исходная' : 'заводская'} шина ${M.mark(a)}, справа новая ${M.mark(c)}. Обе опираются на одну линию. Верхние отметки сходятся посередине и показывают разницу диаметров.`, f: [`${letter('D')}_1 = ${D(a)}\\;\\text{мм}`, `${letter('D')}_2 = ${D(c)}\\;\\text{мм}`] },
        { title: state.measure === 'radius' ? 'Диаметр исходного колеса' : 'Диаметр заводского колеса', text: `Для ${M.mark(a)} берём ширину, процент и диаметр диска из её маркировки.`, f: dims(a) },
        { title: 'Диаметр нового колеса', text: `Для ${M.mark(c)} повторяем вычисления. Переводим дюймы в мм до сложения с боковинами.`, f: dims(c) },
        { title: state.measure === 'radius' ? 'Разность радиусов · задание 4' : 'Разность диаметров · задание 4', text: state.measure === 'radius' ? 'В этом задании демоверсии сравниваются радиусы. Стрелка показывает разность диаметров; разность радиусов вдвое меньше. Делим модуль разности диаметров на 2.' : `Вычитаем диаметр заводского колеса из нового. ${comp.delta < 0 ? 'Отрицательный результат означает уменьшение' : comp.delta > 0 ? 'Положительный результат означает увеличение' : 'Ноль означает, что диаметры равны'}. В ответе на вопрос «на сколько» записываем модуль разности.`, f: state.measure === 'radius' ? [deltaFormula, `\\dfrac{\\left|${letter('D')}_2-${letter('D')}_1\\right|}{2} = \\dfrac{${n(comp.diff100 / 100)}}{2} = ${n(comp.diff100 / 200)}\\;\\text{мм}`] : [deltaFormula, `\\left|${letter('D')}_2-${letter('D')}_1\\right| = ${n(comp.diff100 / 100)}\\;\\text{мм}`] },
        { title: 'Изменение пробега · задание 5', text: `Делим разность на исходный диаметр D₁, затем умножаем на 100 %. Множитель π сократился. ${comp.delta < 0 ? 'Уменьшение' : 'Увеличение'} составляет ${n(comp.percent10 / 10)} % после округления до десятых, половина вверх.`, f: [`\\dfrac{${letter('D')}_2-${letter('D')}_1}{${letter('D')}_1}\\cdot100\\% = \\dfrac{${signed}${n(comp.diff100 / 100)}}{${n(comp.d1 / 100)}}\\cdot100\\%`, `= ${signed}${raw}\\% \\approx ${signed}${n(comp.percent10 / 10)}\\%`] }
      ]
    }[state.scene];
  }
  const clampStep = value => Math.max(0, Math.min(steps().length - 1, Number.isInteger(value) ? value : 0));
  state.step = clampStep(state.step);
  function isCompare() { return state.scene === 'compare' || state.scene === 'run' && state.step >= 3; }
  function solutionOpen(s = state) { return s.mode === 'interactive' && s.showSolution; }
  function canControl() { return !window.__tireBoardReadOnly && (!window.TrainerSession || !window.TrainerSession.studentRestricted('board')); }
  function guard(fn) { return (...args) => { if (canControl()) return fn(...args); renderUI(); if (window.TrainerSession) window.TrainerSession.flashRestrictedHint(); }; }
  function getState() {
    const s = copy(state);
    // Во время интерполяции снимок описывает конечную камеру учителя,
    // иначе ученик отсылал бы промежуточные кадры как своё действие.
    if (!transition && camera && controls) s.camera = { position: camera.position.toArray().map(x => Math.round(x * 1e6) / 1e6), target: controls.target.toArray().map(x => Math.round(x * 1e6) / 1e6) };
    return s;
  }
  function validCamera(c) { return c && ['position', 'target'].every(k => Array.isArray(c[k]) && c[k].length === 3 && c[k].every(x => Number.isFinite(x) && Math.abs(x) <= 100000)) && Math.hypot(...c.position.map((v, i) => v - c.target[i])) > 1; }
  function cleanState(s) {
    const next = { v: 1, tire: cleanTire(s.tire), tire2: cleanTire(s.tire2, SECOND), scene: SCENES.includes(s.scene) ? s.scene : 'width', step: Number.isInteger(s.step) ? s.step : 0, style: ['real', 'glass'].includes(s.style) ? s.style : 'real', cut: !!s.cut, allDimensions: !!s.allDimensions, camera: validCamera(s.camera) ? copy(s.camera) : null, measure: s.measure === 'radius' ? 'radius' : 'diameter' };
    next.spread = !!s.spread;
    next.sideAngle = cleanAngle(s.sideAngle, Math.PI / 2);
    next.widthAngle = cleanAngle(s.widthAngle, 0);
    next.demoReplay = Number.isSafeInteger(s.demoReplay) && s.demoReplay >= 0 ? s.demoReplay : 0;
    next.mode = s.mode === 'interactive' ? 'interactive' : 'reference';
    next.showSolution = s.showSolution === true;
    next.formulaRow = Number.isSafeInteger(s.formulaRow) && s.formulaRow >= 0 ? s.formulaRow : null;
    return next;
  }
  function applyState(s, opts = {}) {
    if (!s || typeof s !== 'object') return;
    applying = true;
    const previous = state;
    state = cleanState(s); state.step = clampStep(state.step);
    const rebuild = previous.scene !== state.scene || previous.step !== state.step || previous.style !== state.style || previous.cut !== state.cut || previous.allDimensions !== state.allDimensions || previous.measure !== state.measure || JSON.stringify(previous.tire) !== JSON.stringify(state.tire) || JSON.stringify(previous.tire2) !== JSON.stringify(state.tire2);
    const layoutChanged = previous.mode !== state.mode || solutionOpen(previous) !== solutionOpen();
    radial = false;
    if (layoutChanged) renderPresentation(opts.animate === true);
    if (rebuild || layoutChanged || previous.spread !== state.spread || !ready) renderUI();
    else if (previous.formulaRow !== state.formulaRow) syncFormulaFocus();
    if (ready) {
      syncLessonMotion(previous, opts.animate === true);
      if (previous.spread !== state.spread) moveMeasures(opts.animate === true);
      if (rebuild) buildScene();
      if (rebuild || layoutChanged || JSON.stringify(previous.camera) !== JSON.stringify(state.camera)) {
        moveCamera(state.camera || preset(), opts.animate === true ? (previous.scene !== state.scene || previous.step !== state.step ? 600 : 140) : 0);
      }
      requestRender();
    }
    lastRemoteSig = JSON.stringify(getState()); lastLocalSig = lastRemoteSig;
    applying = false;
  }
  function syncRights() { if (controls) controls.enabled = canControl() && !measureDrag; }
  function versionedState() { return { ...getState(), __tsRev: rev, __tsBy: revBy }; }
  function applyFromPeer(s) {
    syncRights();
    if (!s || !s.tire) return;
    const incomingRev = Number.isInteger(s.__tsRev) ? s.__tsRev : -1, by = String(s.__tsBy || '');
    if (incomingRev < rev || incomingRev === rev && by < revBy) return;
    rev = incomingRev; revBy = by; applyState(s, { animate: true });
  }
  function receiveCamera(data) {
    if (!data || !validCamera(data.camera)) return;
    applyFromPeer({ ...getState(), camera: data.camera, __tsRev: data.rev, __tsBy: data.by });
  }
  function shareURL(s = getState(), embed = false) {
    const params = new URLSearchParams({ w: s.tire.width, p: s.tire.profile, r: s.tire.rim, w2: s.tire2.width, p2: s.tire2.profile, r2: s.tire2.rim, scene: s.scene, step: s.step, style: s.style });
    if (embed) params.set('embed', '1');
    if (s.measure === 'radius') params.set('measure', 'radius');
    if (s.allDimensions) params.set('all', '1');
    if (s.spread) params.set('spread', '1');
    if (s.sideAngle !== undefined && s.sideAngle !== Math.PI / 2) params.set('hAngle', s.sideAngle);
    if (s.widthAngle) params.set('bAngle', s.widthAngle);
    if (s.mode === 'interactive') params.set('mode', 'interactive');
    if (solutionOpen(s)) params.set('solution', '1');
    if (solutionOpen(s) && Number.isInteger(s.formulaRow)) params.set('line', s.formulaRow);
    return 'tire3d.html?' + params;
  }
  function publish(cameraOnly = false) {
    if (applying || !ready) return;
    if (!transition && camera && controls) state.camera = getState().camera;
    const sig = JSON.stringify(getState());
    if (sig === lastLocalSig || sig === lastRemoteSig) return;
    lastLocalSig = sig; lastRemoteSig = ''; rev++; revBy = ownBy;
    window.dispatchEvent(new CustomEvent('tire3d-change', { detail: getState() }));
    const TS = window.TrainerSession;
    if (TS && canControl()) {
      if (cameraOnly) TS.broadcastEvent('tire3d-camera', { camera: state.camera, rev, by: revBy });
      else TS.push();
    }
    if (embedded && parent !== window) {
      parent.postMessage({source:'mathh-tire3d',type:'state',state:getState()},location.origin);
      clearTimeout(snapshotTimer);
      snapshotTimer = setTimeout(() => sendBoardState(), cameraOnly ? 300 : 100);
    }
  }
  function cameraChanged() {
    requestRender();
    if (applying || transition || !cameraInteracting) return;
    const elapsed = performance.now() - lastCameraSent;
    if (elapsed >= 100) { lastCameraSent = performance.now(); publish(true); }
    else if (!cameraSendTimer) cameraSendTimer = setTimeout(() => { cameraSendTimer = 0; lastCameraSent = performance.now(); publish(true); }, 100 - elapsed);
  }
  function change(fn, animate = true) {
    const previous = { scene: state.scene, step: state.step, demoReplay: state.demoReplay };
    fn(); state.step = clampStep(state.step); state.camera = null;
    if (previous.scene !== state.scene || previous.step !== state.step) state.formulaRow = null;
    renderUI();
    if (ready) { syncLessonMotion(previous, animate); buildScene(); moveCamera(preset(), animate ? 600 : 0); requestRender(); }
    publish();
  }
  function chooseScene(value) { radial = false; change(() => { state.scene = value; state.step = 0; state.cut = false; }); }
  function radialHint() { radial = !radial; renderUI(); }
  function renderPresentation(animate = false) {
    const root = document.documentElement;
    const viewport = $('viewport');
    const lesson = $('tireLesson');
    const open = solutionOpen();
    const animateLayout = animate && ready && !reduced.matches && !document.hidden;
    const before = animateLayout ? viewport.getBoundingClientRect() : null;
    presentationMotion?.cancel();
    solutionMotion?.cancel();
    presentationMotion = solutionMotion = null;
    root.dataset.tireMode = state.mode;
    root.dataset.tireSolution = open ? 'open' : 'closed';
    lesson.hidden = state.mode === 'interactive' && !open;
    $('solutionToggle').hidden = state.mode !== 'interactive';
    $('solutionToggle').textContent = open ? 'Скрыть решение' : 'Показать решение';
    $('solutionToggle').setAttribute('aria-expanded', String(open));
    document.querySelectorAll('.presentation-modes [data-mode]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.mode === state.mode)));
    if (ready) resize();
    if (!before) return;

    // Сначала меняем размеры холста, затем анимируем только его положение
    // и масштаб. WebGL не пересоздаёт буфер на каждом кадре перехода.
    const after = viewport.getBoundingClientRect();
    const x = before.left + before.width / 2 - after.left - after.width / 2;
    const y = before.top + before.height / 2 - after.top - after.height / 2;
    const scale = before.height / after.height;
    const timing = { duration: PRESENTATION_DURATION, easing: 'cubic-bezier(0.16, 1, 0.3, 1)' };
    if (Math.abs(x) + Math.abs(y) + Math.abs(scale - 1) > .01) {
      presentationMotion = viewport.animate([
        { transform: `translate(${x}px, ${y}px) scale(${scale})` }, { transform: 'none' }
      ], timing);
      presentationMotion.onfinish = () => {
        presentationMotion = null;
        if (embedded) sendBoardState();
      };
    }
    if (open) solutionMotion = lesson.animate([{ opacity: 0 }, { opacity: 1 }], { ...timing, delay: 120, duration: 200, fill: 'backwards' });
  }
  function changePresentation(mode, showSolution = state.showSolution) {
    if (mode === state.mode && showSolution === state.showSolution) return;
    state.mode = mode;
    state.showSolution = showSolution;
    renderPresentation(true);
    renderUI();
    if (ready) moveCamera(preset(), 0);
    if (!embedded) {
      const url = new URL(location.href);
      if (mode === 'interactive') url.searchParams.set('mode', mode); else url.searchParams.delete('mode');
      if (solutionOpen()) url.searchParams.set('solution', '1'); else url.searchParams.delete('solution');
      history.replaceState(history.state, '', url);
    }
    publish();
  }
  function setFormulaFocus(frame) {
    if (formulaFocus === frame) return;
    formulaFocus = frame;
    Array.from($('formulas').children).forEach((row, index) => {
      const current = frame?.row === index;
      row.toggleAttribute('data-current-formula', current);
      if (row.hasAttribute('role')) row.setAttribute('aria-pressed', String(current && !frame.loop));
      row.querySelectorAll('[data-quantity]').forEach(term => {
        term.toggleAttribute('data-formula-term', current && frame.keys.includes(term.dataset.quantity));
      });
    });
    requestRender();
  }
  function syncFormulaFocus() {
    clearTimeout(formulaLoopTimer);
    formulaFocus = null;
    if (!solutionOpen() || !formulaRows.length) return;
    const selected = formulaRows[state.formulaRow];
    const first = formulaRows[0];
    if (selected || formulaRows.length > 1 || first.keys.length < 2 || reduced.matches || document.hidden) {
      setFormulaFocus(selected || first);
      return;
    }
    // Одиночное объяснение повторяется, как гифка. Между сменами мерок
    // WebGL не рисует кадры. В вычислениях строку выбирает сам ученик.
    let index = 0;
    function advance() {
      if (disposed || document.hidden) return;
      setFormulaFocus({ row: 0, keys: [first.keys[index]], loop: true });
      index = (index + 1) % first.keys.length;
      formulaLoopTimer = setTimeout(advance, FORMULA_INTERVAL);
    }
    advance();
  }
  function renderUI() {
    const a = state.tire, info = steps()[state.step];
    document.documentElement.dataset.material = state.style;
    Object.entries(COLORS).forEach(([k, v]) => document.documentElement.style.setProperty('--color-' + k, v));
    $('marking').innerHTML = `<button data-part="B" style="--dimension:${COLORS.B}" aria-label="Ширина ${a.width} мм">${a.width}</button><span class="slash">/</span><button data-part="H" style="--dimension:${COLORS.H}" aria-label="Высота боковины ${a.profile} процентов">${a.profile}</button><button data-part="R" style="--dimension:${COLORS.R}" aria-label="Радиальная конструкция">R</button><button data-part="d" style="--dimension:${COLORS.d}" aria-label="Диск ${a.rim} дюймов">${a.rim}</button>`;
    const pills = [['B', a.width, 'ширина шины B, мм'], ['H', a.profile, `высота боковины H — ${a.profile} % от ширины`], ['R', 'R', 'радиальная конструкция'], ['d', a.rim, 'диаметр диска d, дюймы']];
    const active = { width: 'B', side: 'H', rim: 'd', diam: 'D' }[state.scene];
    $('markPills').innerHTML = pills.map(([k, val, text]) => `<button data-part="${k}" class="${active === k || radial && k === 'R' ? 'active' : ''}" style="--dimension:${COLORS[k]};--tint:${COLORS[k]}15"><b>${val}</b><span>— ${text}</span></button>`).join('');
    document.querySelectorAll('[data-part]').forEach(el => { el.onclick = guard(() => el.dataset.part === 'R' ? radialHint() : chooseScene({ B: 'width', H: 'side', d: 'rim' }[el.dataset.part])); });
    document.querySelectorAll('[data-scene]').forEach(el => el.setAttribute('aria-pressed', String(el.dataset.scene === state.scene)));
    document.querySelectorAll('[data-style]').forEach(el => el.setAttribute('aria-pressed', String(el.dataset.style === state.style)));
    $('radialNote').hidden = !radial;
    $('cutToggle').checked = state.cut;
    $('allDimensions').checked = state.allDimensions;
    $('spreadMeasures').hidden = state.scene !== 'diam';
    $('spreadMeasures').textContent = state.spread ? 'Вернуть мерки на колесо' : 'Разнести мерки';
    $('spreadMeasures').setAttribute('aria-pressed', String(state.spread));
    $('playDemo').hidden = state.scene !== 'run' && state.scene !== 'compare';
    $('playDemo').textContent = isCompare() ? 'Показать сравнение' : state.step === 0 ? 'Размотать нить' : 'Повторить размотку';
    if (!fallback) {
      $('viewHint').textContent = ['side', 'width'].includes(state.scene)
        ? 'Потяните за букву, чтобы переместить мерку'
        : 'Поверните шину · приблизьте колёсиком или щипком';
    }
    const readings = t => Object.entries(M.values(t)).sort(([a],[b]) => ['B','H','d','D'].indexOf(a)-['B','H','d','D'].indexOf(b)).map(([key,value]) => `<span><b style="color:${COLORS[key]}">${key}</b> ${n(value)} <small>мм</small></span>`).join('');
    $('sizeReadout').innerHTML = `<div>${isCompare()?`<strong>${state.measure==='radius'?'Исходная':'Заводская'}</strong>`:''}${readings(a)}</div>${isCompare()?`<div><strong>Новая</strong>${readings(state.tire2)}</div>`:''}`;
    $('stepTitle').textContent = info.title; $('stepText').textContent = info.text;
    $('stepCount').textContent = `${state.step + 1} из ${steps().length}`;
    $('formulas').replaceChildren();
    const keys = info.f.map(tex => ['B', 'H', 'd', 'D'].filter(key => tex.includes(COLORS[key])));
    // Строка с переводом единиц или округлением может быть без цветной
    // буквы. В таком случае берём величину из соседней строки вычисления.
    formulaRows = keys.map((terms, row) => {
      let wheel = null;
      if (state.scene === 'compare' && state.step === 0) wheel = row + 1;
      if (state.scene === 'compare' && (state.step === 1 || state.step === 2)) wheel = state.step;
      if (state.scene === 'run' && state.step === 4) wheel = row < 3 ? 1 : 2;
      return { row, wheel, keys: terms.length ? terms :
        keys.slice(0, row).reverse().find(items => items.length) || keys.slice(row + 1).find(items => items.length) || [] };
    });
    info.f.forEach((tex, index) => {
      const el = document.createElement('div');
      el.className = 'formula';
      window.katex.render(tex.replace(/(\d),(\d)/g, '$1{,}$2'), el, { displayMode: true, throwOnError: true, strict: 'ignore', trust: false });
      if (solutionOpen()) {
        el.setAttribute('role', 'button');
        el.tabIndex = 0;
        el.title = info.f.length === 1 && keys[0].length > 1 ? 'Остановить или продолжить подсветку' : 'Подсветить величины этой строки';
        el.onclick = guard(() => {
          state.formulaRow = info.f.length === 1 && state.formulaRow === index ? null : index;
          syncFormulaFocus();
          publish();
        });
        el.onkeydown = event => {
          if (event.key !== 'Enter' && event.key !== ' ') return;
          event.preventDefault();
          el.click();
        };
        el.querySelectorAll('.katex-html [style*="color"]').forEach(term => {
          const key = QUANTITY_BY_COLOR[term.style.color];
          if (key) {
            term.dataset.quantity = key;
            term.style.setProperty('--quantity-tint', COLORS[key] + '26');
          }
        });
      }
      $('formulas').append(el);
    });
    syncFormulaFocus();
    $('stepDots').innerHTML = steps().map((_, i) => `<span class="${i === state.step ? 'current' : ''}"></span>`).join('');
    $('prevStep').disabled = state.step === 0; $('nextStep').disabled = state.step === steps().length - 1;
    $('secondSliders').hidden = !(isCompare() || state.scene === 'run');
    $('secondMark').textContent = M.mark(state.tire2);
    $('tireLabel').textContent = isCompare() || state.scene === 'run' ? (state.measure === 'radius' ? 'Исходная шина' : 'Заводская шина') : 'Маркировка шины';
    for (const [i, t] of [[1, a], [2, state.tire2]]) for (const key of ['width', 'profile', 'rim']) {
      const el = $(`slider-${i}-${key}`); if (el) { el.value = t[key]; $(`out-${i}-${key}`).textContent = t[key] + (key === 'width' ? ' мм' : key === 'profile' ? ' %' : '″'); }
    }
  }
  function sliders() {
    for (const i of [1, 2]) {
      const field = $(i === 1 ? 'firstSliders' : 'secondSliders');
      [['width', 'B · Ширина', 125, 355, 5, 'B'], ['profile', 'p · Высота от ширины', 25, 85, 5, 'H'], ['rim', 'r · Диаметр диска', 12, 22, 1, 'd']].forEach(([key, label, min, max, step, c]) => {
        const row = document.createElement('label'); row.className = 'slider-row'; row.style.setProperty('--dimension', COLORS[c]);
        row.innerHTML = `<span>${label}</span><output id="out-${i}-${key}" for="slider-${i}-${key}"></output><input id="slider-${i}-${key}" aria-label="${i === 1 ? 'Заводская' : 'Новая'} шина: ${label}" type="range" min="${min}" max="${max}" step="${step}">`;
        row.querySelector('input').addEventListener('input', guard(e => change(() => { state[i === 1 ? 'tire' : 'tire2'][key] = Number(e.target.value); }, false)));
        field.append(row);
      });
    }
  }
  function preset() {
    const diam = Math.max(M.values(state.tire).D, isCompare() ? M.values(state.tire2).D : 0);
    let position;
    switch (state.scene) {
      case 'width': position = state.step === 0 ? [diam * 1.65, diam * .5, diam * 1.1] : [diam * 1.9, diam * .12, diam * .08]; break;
      case 'side': position = [-diam * 1.3, diam * .42, diam * 1.6]; break;
      case 'rim': position = [diam * .15, diam * .1, diam * 2.05]; break;
      case 'diam': position = [0, 0, diam * 2.15]; break;
      case 'compare': position = [0, 0, diam * 3.6]; break;
      case 'run': position = isCompare() ? [0, 0, diam * 3.6] : [0, diam * .85, diam * 5.25]; break;
    }
    if (state.allDimensions && !isCompare() && !['diam', 'run'].includes(state.scene)) position = [-diam * 1.35, diam * .48, diam * 1.85];
    if (state.allDimensions && isCompare()) position = [diam * .7, diam * .45, diam * 4.1];
    if (state.allDimensions && state.scene === 'run' && !isCompare()) position = [diam * .8, diam * 1.55, diam * 5.6];
    const narrow = host.clientWidth < 500;
    if (narrow) position = position.map(v => v * (isCompare() ? 1.4 : 1.2));
    const rolling = state.scene === 'run' && !isCompare();
    if (rolling || solutionOpen()) {
      // В узкой сцене учитываем ширину всего действия, включая нить πD.
      const focal = host.clientHeight / (2 * Math.tan(FIELD_OF_VIEW * Math.PI / 360));
      const span = rolling ? Math.PI + 1 : isCompare() ? 2.75 : state.scene === 'diam' ? 1.5 : 1.3;
      const distance = Math.hypot(...position);
      const scale = Math.max(1, (focal * span * diam / Math.max(1, host.clientWidth - 40) + diam * .15) / (rolling ? position[2] : distance));
      position = position.map(v => v * scale);
    }
    return { position, target: [0, narrow ? diam * .035 : 0, 0] };
  }
  function moveCamera(next, duration) {
    state.camera = copy(next);
    if (!camera || !controls) return;
    if (duration && !reduced.matches && !document.hidden) transition = { start: performance.now(), duration, from: camera.position.clone(), target: controls.target.clone(), to: new THREE.Vector3(...next.position), toTarget: new THREE.Vector3(...next.target) };
    else { transition = null; camera.position.fromArray(next.position); controls.target.fromArray(next.target); controls.update(); }
    requestRender();
  }
  function requestRender() { if (!disposed && !document.hidden && !raf) raf = requestAnimationFrame(render); }
  function syncLessonMotion(previous, animate) {
    const changedStep = !previous || previous.scene !== state.scene || previous.step !== state.step;
    const replayed = previous && previous.demoReplay !== state.demoReplay;
    if (!changedStep && !replayed) return;
    lessonMotion = null;
    const compare = isCompare();
    const run = state.scene === 'run' && !compare;
    const replayCompare = compare && (replayed || !previous || previous.scene !== state.scene ||
      (state.scene === 'run' ? state.step === 3 : state.step === 0 || state.step === 3));
    const replayRun = run && (replayed || state.step === 1);
    lessonProgress = compare || run && state.step > 0 ? 1 : 0;
    if (animate && !reduced.matches && !document.hidden && (replayCompare || replayRun)) {
      lessonProgress = 0;
      lessonMotion = { start: performance.now(), duration: compare ? COMPARE_DURATION : THREAD_DURATION };
    }
  }
  function moveMeasures(animate) {
    const target = state.spread ? 1 : 0;
    spreadMotion = animate && !reduced.matches && !document.hidden
      ? { start: performance.now(), from: spreadAmount, target } : null;
    if (!spreadMotion) spreadAmount = target;
  }
  function rollPose(tire) {
    const radius = M.values(tire).D / 2;
    const length = TURN * radius;
    const time = lessonProgress * THREAD_DURATION;
    const progress = Math.min(1, time / ROLL_DURATION);
    const divisions = Math.floor((time - ROLL_DURATION) / DIVISION_INTERVAL);
    const start = -length / 2;
    const released = length * progress;
    return { radius, start, x: start + released, angle: -TURN * progress, released, divisions };
  }
  function updateWheelPose() {
    if (!wheels[0]) return;
    if (state.scene === 'run' && !isCompare()) {
      const pose = rollPose(state.tire);
      wheels[0].position.x = pose.x;
      wheels[0].rotation.z = pose.angle;
    }
  }
  function render(time) {
    raf = 0; if (disposed || document.hidden) return;
    let animationFinished = false;
    if (transition && camera) {
      const t = Math.min(1, (time - transition.start) / transition.duration), e = 1 - Math.pow(1 - t, 4);
      camera.position.lerpVectors(transition.from, transition.to, e); controls.target.lerpVectors(transition.target, transition.toTarget, e); controls.update();
      if (t === 1) { transition = null; animationFinished = true; }
    }
    if (lessonMotion) {
      // Время сцены управляет одновременно поворотом колеса и длиной нити.
      lessonProgress = reduced.matches ? 1 : Math.max(0, Math.min(1, (time - lessonMotion.start) / lessonMotion.duration));
      if (lessonProgress === 1) { lessonMotion = null; animationFinished = true; }
    }
    if (spreadMotion) {
      const t = reduced.matches ? 1 : Math.max(0, Math.min(1, (time - spreadMotion.start) / SPREAD_DURATION));
      const eased = t * t * (3 - 2 * t);
      spreadAmount = spreadMotion.from + (spreadMotion.target - spreadMotion.from) * eased;
      if (t === 1) { spreadMotion = null; animationFinished = true; }
    }
    updateWheelPose();
    if (renderer) { renderer.render(scene3, camera); frameCount++; }
    drawDimensions();
    if (animationFinished && embedded && !transition && !lessonMotion && !spreadMotion) { clearTimeout(snapshotTimer); snapshotTimer = setTimeout(sendBoardState, 100); }
    if (transition || lessonMotion || spreadMotion) requestRender();
  }
  function disposeTree(root) {
    if (!root) return;
    const materials = new Set(), geometries = new Set(), textures = new Set();
    root.traverse(o => { if (o.geometry) geometries.add(o.geometry); if (o.material) (Array.isArray(o.material) ? o.material : [o.material]).forEach(m => { materials.add(m); if (m.map) textures.add(m.map); }); });
    textures.forEach(t => t.dispose()); materials.forEach(m => m.dispose()); geometries.forEach(g => g.dispose());
    root.removeFromParent();
  }
  function tireProfile(t) {
    const { D, d } = M.values(t), R = D / 2, inner = d / 2, w = t.width / 2;
    return [[inner,-w*.87],[inner+5,-w*.94],[inner+(R-inner)*.55,-w],[R-12,-w*.91],[R-3,-w*.76],[R,-w*.58],[R,w*.58],[R-3,w*.76],[R-12,w*.91],[inner+(R-inner)*.55,w],[inner+5,w*.94],[inner,w*.87],[inner+9,w*.77],[R-18,w*.55],[R-17,-w*.55],[inner+9,-w*.77],[inner,-w*.87]];
  }
  function wheel(t, x = 0) {
    const group = new THREE.Group(); group.position.x = x;
    const { D, d } = M.values(t), R = D / 2, rim = d / 2, w = t.width;
    const glass = state.style === 'glass', active = { width: 'B', side: 'H', rim: 'd', diam: 'D', run: 'D', compare: 'D' }[state.scene];
    const plane = new THREE.Plane(new THREE.Vector3(1, 0, 0), -x);
    const clippingPlanes = state.cut ? [plane] : [];
    const material = new THREE.MeshPhysicalMaterial({ color: glass ? '#9bc9df' : '#22252b', roughness: glass ? .16 : .95, metalness: glass ? .15 : .03, transparent: glass, opacity: glass ? .23 : 1, depthWrite: !glass, side: THREE.DoubleSide, clippingPlanes });
    const profile = tireProfile(t).map(([r, z]) => new THREE.Vector2(r, z));
    const geom = new THREE.LatheGeometry(profile, 100); geom.rotateX(Math.PI / 2);
    const tire = new THREE.Mesh(geom, material); tire.userData.part = 'side'; group.add(tire);
    const treadColor = glass ? COLORS.D : '#12151b';
    // Канавки отделяют блоки протектора геометрией, а не наклеенной фотографией.
    const blocks = new THREE.InstancedMesh(new THREE.BoxGeometry(1,1,1), new THREE.MeshStandardMaterial({ color: treadColor, roughness: glass ? .2 : .9, metalness: glass ? .2 : .02, transparent: glass, opacity: glass ? .38 : 1, clippingPlanes }), 72 * 5);
    const dummy = new THREE.Object3D(); let index = 0;
    for (let row = 0; row < 5; row++) for (let i = 0; i < 72; i++) {
      const theta = (i + (row % 2) * .42) / 72 * Math.PI * 2, zz = (row - 2) * w * .127;
      dummy.position.set(Math.cos(theta) * (R - 1), Math.sin(theta) * (R - 1), zz); dummy.rotation.set(0,0,theta - Math.PI / 2); dummy.scale.set(R * .075, 5, w * .115); dummy.updateMatrix(); blocks.setMatrixAt(index++, dummy.matrix);
    }
    blocks.userData.part = 'width'; group.add(blocks);
    const metal = new THREE.MeshStandardMaterial({ color: glass ? '#b9dce5' : '#aab2bd', metalness: .86, roughness: .28, transparent: glass, opacity: glass ? .6 : 1, clippingPlanes });
    const ring = new THREE.Mesh(new THREE.TorusGeometry(rim-5, 6, 12, 100), metal); ring.position.z = w*.39; ring.userData.part = 'rim'; group.add(ring);
    const backRing = ring.clone(); backRing.position.z = -w*.39; group.add(backRing);
    const barrel = new THREE.Mesh(new THREE.CylinderGeometry(rim-5,rim-5,w*.78,80,1,true), metal); barrel.rotation.x=Math.PI/2; barrel.userData.part='rim';group.add(barrel);
    const hub = new THREE.Mesh(new THREE.CylinderGeometry(rim*.19,rim*.19,w*.35,32),metal);hub.rotation.x=Math.PI/2;hub.position.z=w*.22;hub.userData.part='rim';group.add(hub);
    for (let i=0;i<7;i++) {
      const theta=i*Math.PI*2/7;
      const spoke=new THREE.Mesh(new THREE.BoxGeometry(rim*.115,rim*.82,14),metal);
      spoke.rotation.z=theta;spoke.position.set(-Math.sin(theta)*rim*.52,Math.cos(theta)*rim*.52,w*.33);spoke.userData.part='rim';group.add(spoke);
      const bolt=new THREE.Mesh(new THREE.SphereGeometry(5,10,6),metal);bolt.position.set(Math.cos(theta)*rim*.125,Math.sin(theta)*rim*.125,w*.41);group.add(bolt);
    }
    const diskHighlight = new THREE.Mesh(new THREE.RingGeometry(rim-8,rim+2,100),new THREE.MeshBasicMaterial({ color:COLORS.d,transparent:true,opacity:active==='d'?.85:.15,side:THREE.DoubleSide,clippingPlanes })); diskHighlight.position.z=w*.48;group.add(diskHighlight);
    const rearHighlight = diskHighlight.clone();
    rearHighlight.position.z = -diskHighlight.position.z;
    group.add(rearHighlight);
    const stripe=new THREE.Mesh(new THREE.TorusGeometry(state.scene==='width'?R-2:(R+rim)/2,state.scene==='width'?2:3,8,100),new THREE.MeshBasicMaterial({color:COLORS[active],transparent:true,opacity:glass?.85:.52,clippingPlanes}));stripe.position.z=w*.475;group.add(stripe);
    const canvas=document.createElement('canvas');canvas.width=canvas.height=1024;const ctx=canvas.getContext('2d');
    ctx.translate(512,512);ctx.fillStyle=glass?'#d7edfa':'#b2b8bd';ctx.font='600 53px sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';
    const mark=M.mark(t);const radius=410;
    for(let i=0;i<mark.length;i++){ctx.save();ctx.rotate((i-(mark.length-1)/2)*.082);ctx.translate(0,-radius);ctx.fillText(mark[i],0,0);ctx.restore();}
    const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;
    const marking =new THREE.Mesh(new THREE.PlaneGeometry(R*2.15,R*2.15),new THREE.MeshBasicMaterial({map:texture,transparent:true,depthWrite:false,side:THREE.DoubleSide,clippingPlanes})); marking.position.z=w*.51;group.add(marking);
    if(glass){const edges=new THREE.LineSegments(new THREE.EdgesGeometry(geom,27),new THREE.LineBasicMaterial({color:'#bde2f3',transparent:true,opacity:.35,clippingPlanes}));group.add(edges);}
    if(state.cut){
      // Отсечение само по себе оставляет полую оболочку: закрываем срез
      // реальным профилем, чтобы H начиналась у края диска, как у ФИПИ.
      for(const sign of [1,-1]){
        const shape=new THREE.Shape();tireProfile(t).forEach(([radius,z],i)=>i?shape.lineTo(z,radius*sign):shape.moveTo(z,radius*sign));
        const cap=new THREE.Mesh(new THREE.ShapeGeometry(shape),new THREE.MeshStandardMaterial({color:COLORS.H,roughness:.88,side:THREE.DoubleSide,transparent:glass,opacity:glass?.5:1}));cap.rotation.y=Math.PI/2;cap.position.x=.35;cap.userData.part='side';group.add(cap);
      }
    }
    group.userData={tire:t,R,rim};return group;
  }
  function buildScene() {
    if(!THREE){requestRender();return;}
    disposeTree(content);content=new THREE.Group();scene3.add(content);wheels=[];
    const maxD=Math.max(M.values(state.tire).D,M.values(state.tire2).D);
    if(isCompare()){
      wheels.push(wheel(state.tire,-maxD*.64),wheel(state.tire2,maxD*.64));
      // Одинаковая линия дороги делает различие диаметров видимым, не
      // подменяя масштаб каждого колеса отдельной нормировкой.
      wheels.forEach(w=>{w.position.y=w.userData.R-maxD/2;content.add(w);});
    }else {wheels.push(wheel(state.tire));content.add(wheels[0]);}
    const ground=new THREE.Mesh(new THREE.PlaneGeometry(maxD*(isCompare()?3.6:state.scene==='run'?6:3),maxD*2.5),new THREE.MeshStandardMaterial({color:document.documentElement.dataset.theme==='dark'?'#1a263a':'#dce3ed',roughness:1,transparent:true,opacity:.5}));ground.rotation.x=-Math.PI/2;ground.position.y=-(isCompare()?maxD/2:M.values(state.tire).D/2)-6;content.add(ground);
    updateWheelPose();
    requestRender();
  }
  const svgNS='http://www.w3.org/2000/svg';
  function svg(tag, attrs={},text){const el=document.createElementNS(svgNS,tag);Object.entries(attrs).forEach(([k,v])=>el.setAttribute(k,v));if(text!==undefined)el.textContent=text;return el;}
  function project(v){
    if(camera){const p=new THREE.Vector3(...v).project(camera);return[(p.x+1)*host.clientWidth/2,(-p.y+1)*host.clientHeight/2];}
    const maxD=Math.max(M.values(state.tire).D,isCompare()?M.values(state.tire2).D:0),scale=Math.min(host.clientWidth/(isCompare()?maxD*3.2:state.scene==='run'?maxD*4.5:maxD*1.85),(host.clientHeight-120)/(maxD*1.2));
    return [host.clientWidth/2+(state.scene==='width'&&!state.allDimensions?v[2]:v[0]+(state.allDimensions?v[2]*.6:0))*scale,host.clientHeight/2+15-v[1]*scale];
  }
  function screenLine(parent, a, b, attrs) {
    parent.append(svg('line', { x1: a[0], y1: a[1], x2: b[0], y2: b[1], ...attrs }));
  }
  function badge(parent, x, y, label, fill, radius) {
    parent.append(svg('circle', { cx: x, cy: y, r: radius, fill, stroke: 'white', 'stroke-width': 1.5 }),
      svg('text', { x, y: y + radius * .4, fill: 'white', 'text-anchor': 'middle',
        'font-family': 'Onest,sans-serif', 'font-size': radius * 1.2, 'font-weight': 700 }, label));
  }
  function formulaUses(key, wheel) {
    return formulaFocus?.keys.includes(key) === true && (!formulaFocus.wheel || formulaFocus.wheel === wheel);
  }
  function arrow(a, b, key, label = key, options = {}) {
    const pa = project(a), pb = project(b), fill = COLORS[key];
    const group = svg('g', { 'data-dimension': key, 'aria-hidden': 'true', ...options.attrs });
    const active = formulaUses(key, options.wheel);
    if (options.wheel) group.setAttribute('data-measure-wheel', options.wheel);
    if (formulaFocus?.keys.length) group.setAttribute('data-formula-measure', active ? 'active' : 'secondary');
    const lineAttrs = { stroke: fill, 'stroke-width': active ? 4 : 2.5, 'stroke-linecap': 'round' };
    if (!options.noHeads) {
      lineAttrs['marker-start'] = `url(#arrow-${key})`;
      lineAttrs['marker-end'] = `url(#arrow-${key})`;
    }
    screenLine(group, pa, pb, lineAttrs);
    const x = (pa[0] + pb[0]) / 2, y = (pa[1] + pb[1]) / 2;
    const length = Math.hypot(pb[0] - pa[0], pb[1] - pa[1]);
    const radius = solutionOpen() ? Math.max(7, Math.min(12, length * .24, host.clientWidth * .045)) : 16;
    let labelX = x;
    if (solutionOpen() && (key === 'H' || key === 'd')) {
      const offset = radius + 6;
      labelX += x + offset + radius < host.clientWidth - 2 ? offset : -offset;
      screenLine(group, [x, y], [labelX, y], { stroke: fill, 'stroke-width': 1, 'stroke-opacity': .75 });
    }
    if (options.drag && canControl()) {
      group.removeAttribute('aria-hidden');
      const handle = svg('g', {
        'data-drag': options.drag, 'data-opposite': options.opposite ? '1' : '0',
        'data-depth': options.depth ?? 0, role: 'slider', tabindex: '0',
        'aria-label': options.drag === 'sideAngle' ? 'Угол мерки высоты боковины' : 'Угол мерки ширины шины',
        'aria-valuemin': '0', 'aria-valuemax': '359',
        'aria-valuenow': Math.floor(state[options.drag] * 360 / TURN)
      });
      badge(handle, labelX, y, label, fill, radius);
      group.append(handle);
    } else badge(group, labelX, y, label, fill, radius);
    overlay.append(group);
  }
  function labelAt(x,y,text){const p=project([x,y,0]);overlay.append(svg('text',{x:p[0],y:p[1]+21,fill:'var(--pencil)','text-anchor':'middle','font-family':'Onest,sans-serif','font-size':12,'font-weight':600},text));}
  function drawFallback(){
    const widthView=state.scene==='width'&&!state.allDimensions;
    const pose = state.scene === 'run' && !isCompare() ? rollPose(state.tire) : null;
    const tires=isCompare()?[[state.tire,-Math.max(M.values(state.tire).D,M.values(state.tire2).D)*.64],[state.tire2,Math.max(M.values(state.tire).D,M.values(state.tire2).D)*.64]]:[[state.tire,pose ? pose.x : 0]];
    const canvas=svg('svg',{width:'100%',height:'100%',viewBox:`0 0 ${host.clientWidth} ${host.clientHeight}`,role:'img','aria-label':'Чертёж шины с размерами'});
    const glass=state.style==='glass';
    tires.forEach(([t,x])=>{const v=M.values(t),R=v.D/2,ri=v.d/2,yy=isCompare()?R-Math.max(M.values(state.tire).D,M.values(state.tire2).D)/2:0,c=project([x,yy,0]),outer=c[1]-project([x,yy+R,0])[1],inner=outer*ri/R;
      if(widthView){const ww=Math.abs(project([0,0,t.width/2])[0]-project([0,0,-t.width/2])[0]);canvas.append(svg('rect',{x:c[0]-ww/2,y:c[1]-outer,width:ww,height:outer*2,rx:18,fill:glass?'#9bc9df55':'#303742',stroke:'#6b788b','stroke-width':2}));for(let i=1;i<5;i++)canvas.append(svg('line',{x1:c[0]-ww/2+ww*i/5,y1:c[1]-outer+12,x2:c[0]-ww/2+ww*i/5,y2:c[1]+outer-12,stroke:glass?'#bde2f3':'#151b24','stroke-width':3}));}
      else{canvas.append(svg('circle',{cx:c[0],cy:c[1],r:outer,fill:glass?'#9bc9df44':'#303742',stroke:'#708197','stroke-width':2}),svg('circle',{cx:c[0],cy:c[1],r:inner,fill:glass?'#b9dce555':'#b4bdc9',stroke:COLORS.d,'stroke-width':2}));for(let i=0;i<7;i++){let theta=i*TURN/7-(pose?.angle||0);canvas.append(svg('line',{x1:c[0],y1:c[1],x2:c[0]+Math.cos(theta)*inner*.9,y2:c[1]+Math.sin(theta)*inner*.9,stroke:glass?'#bde2f3':'#778392','stroke-width':5}));}if(state.cut)canvas.append(svg('path',{d:`M${c[0]},${c[1]-outer}V${c[1]-inner}M${c[0]},${c[1]+inner}V${c[1]+outer}`,stroke:COLORS.H,'stroke-width':8}));}
      canvas.append(svg('text',{x:c[0],y:c[1]+outer-15,fill:glass?'var(--pencil)':'white','text-anchor':'middle','font-size':12},M.mark(t)));
    });host.replaceChildren(canvas);
  }
  function faceDepth(tire) {
    return (camera && camera.position.z < 0 ? -1 : 1) * tire.width * .49;
  }
  function radialPoint(radius, angle, depth, x = 0, y = 0) {
    return [x + radius * Math.cos(angle), y + radius * Math.sin(angle), depth];
  }
  function widthRadius(outer, inner) { return inner + (outer - inner) * .55; }
  function drawWidth(tire, x, y, angle, draggable = false, wheel = null) {
    const { D, d } = M.values(tire), radius = widthRadius(D / 2, d / 2);
    arrow(radialPoint(radius, angle, -tire.width / 2, x, y),
      radialPoint(radius, angle, tire.width / 2, x, y), 'B', 'B',
      { drag: draggable ? 'widthAngle' : null, wheel });
  }
  function drawSide(tire, x, y, angle, draggable = false, opposite = false, wheel = null) {
    const { D, d } = M.values(tire), depth = faceDepth(tire);
    const at = angle + (opposite ? Math.PI : 0);
    arrow(radialPoint(d / 2, at, depth, x, y), radialPoint(D / 2, at, depth, x, y), 'H', 'H',
      { drag: draggable ? 'sideAngle' : null, opposite, depth, wheel });
  }
  function drawRim(tire, x, y, both = false, wheel = null) {
    const radius = M.values(tire).d / 2, depth = Math.sign(faceDepth(tire)) * tire.width * .39;
    // При взгляде с ребра видны обе мерки. Анфас оставляем ближнюю,
    // чтобы кружки d не закрывали друг друга в проекции.
    const view = both && camera ? camera.position.clone().sub(controls.target) : null;
    const depths = view && Math.abs(view.z) < view.length() * .5 ? [-depth, depth] : [depth];
    for (const z of depths) {
      arrow([x, y - radius, z], [x, y + radius, z], 'd', 'd',
        { wheel, attrs: { 'data-face': z < 0 ? 'rear' : 'front' } });
    }
  }
  function drawExtra(tire, x, y, wheel) {
    if (state.allDimensions || formulaUses('B', wheel)) drawWidth(tire, x, y, Math.PI * 1.2, false, wheel);
    if (state.allDimensions || formulaUses('H', wheel)) drawSide(tire, x, y, Math.PI / 2, false, false, wheel);
    if (state.allDimensions || formulaUses('d', wheel)) drawRim(tire, x, y, false, wheel);
  }
  function drawDiameter(tire) {
    const { D, d } = M.values(tire), outer = D / 2, inner = d / 2;
    const depth = Math.sign(faceDepth(tire)) * tire.width * .29;
    const partsX = -outer * 1.25 * spreadAmount;
    const totalX = outer * (1.2 + .02 * spreadAmount);
    // У мерок общие верхняя и нижняя границы, как на чертеже ФИПИ.
    for (const edge of [-outer, outer]) {
      screenLine(overlay, project([partsX, edge, depth]), project([totalX, edge, depth]),
        { stroke: formulaUses('D') ? COLORS.D : 'var(--muted)', 'stroke-width': formulaUses('D') ? 1.8 : 1.25,
          'stroke-opacity': .75, 'data-diameter-guide': '' });
    }
    arrow([totalX, -outer, depth], [totalX, outer, depth], 'D', 'D', {
      attrs: { 'data-measure': 'diameter-total' }
    });
    const parts = [[-outer, -inner, 'H'], [-inner, inner, 'd'], [inner, outer, 'H']];
    for (const [from, to, key] of parts) {
      arrow([partsX, from, depth], [partsX, to, depth], key, key,
        { noHeads: spreadAmount < .24, attrs: { 'data-measure': 'diameter-part' } });
    }
    if (state.allDimensions || formulaUses('B')) drawWidth(tire, 0, 0, Math.PI * 1.2);
  }
  function drawCompare(first, second) {
    const a = M.values(first).D, b = M.values(second).D;
    const maxD = Math.max(a, b), x = maxD * .64, ground = -maxD / 2;
    const guideColor = document.documentElement.dataset.theme === 'dark' ? '#b9a8ff' : '#5f43bc';
    const baseline = { stroke: guideColor, 'stroke-width': 1.5, 'stroke-opacity': .55 };
    screenLine(overlay, project([-x - a / 2, ground, 0]), project([x + b / 2, ground, 0]),
      { ...baseline, 'data-compare-ground': '' });
    arrow([-x - a * .55, ground, 0], [-x - a * .55, ground + a, 0], 'D', 'D₁', { wheel: 1 });
    arrow([x + b * .55, ground, 0], [x + b * .55, ground + b, 0], 'D', 'D₂', { wheel: 2 });
    labelAt(-x, ground, state.measure === 'radius' ? 'Исходная' : 'Заводская');
    labelAt(x, ground, 'Новая');
    drawExtra(first, -x, ground + a / 2, 1);
    drawExtra(second, x, ground + b / 2, 2);
    for (const [from, diameter] of [[-x, a], [x, b]]) {
      const y = ground + diameter;
      const start = project([from, y, 0]);
      const end = project([from * (1 - lessonProgress), y, 0]);
      screenLine(overlay, start, end, { stroke: guideColor, 'stroke-width': 2, 'stroke-dasharray': '5 4', 'data-compare-guide': '' });
      overlay.append(svg('circle', { cx: start[0], cy: start[1], r: 4, fill: guideColor, stroke: 'white', 'stroke-width': 1 }));
    }
    if (lessonProgress < 1) return;
    const diff100 = M.compare(first, second).diff100;
    const low = project([0, ground + Math.min(a, b), 0]);
    const high = project([0, ground + maxD, 0]);
    if (diff100) {
      screenLine(overlay, low, high, { stroke: guideColor, 'stroke-width': 5, 'stroke-linecap': 'round', 'data-compare-gap': '' });
      for (const point of [low, high]) {
        screenLine(overlay, [point[0] - 6, point[1]], [point[0] + 6, point[1]], { stroke: guideColor, 'stroke-width': 2 });
      }
    }
    overlay.append(svg('text', { x: high[0], y: high[1] - 14, fill: guideColor, 'text-anchor': 'middle',
      'font-size': 14, 'font-weight': 750, 'data-compare-label': '' }, diff100 ? n(diff100 / 100) + ' мм' : 'Диаметры равны'));
  }
  function drawRun(tire) {
    const { radius, start, x, angle, released, divisions } = rollPose(tire);
    const depth = Math.sign(faceDepth(tire)) * tire.width * .29;
    const along = length => project([start + length, -radius, depth]);
    const origin = along(0), contact = along(released);
    const bottom = -Math.PI / 2;
    const mark = project(radialPoint(radius, bottom + angle, depth, x));
    const thread = { stroke: COLORS.D, 'stroke-width': 4, 'stroke-linecap': 'round' };
    const wound = TURN + angle;
    if (wound > 0) {
      // Прямая и дуга соединяются у обода по касательной. При вращении
      // сколько нити уходит с дуги, столько же появляется на прямой.
      const samples = Math.ceil(wound / TURN * 96);
      const points = Array.from({ length: samples + 1 }, (_, i) =>
        project(radialPoint(radius, bottom + wound * i / samples, depth, x)).join(','));
      overlay.append(svg('polyline', { ...thread, points: points.join(' '), fill: 'none', 'data-run-wound': '' }));
    }
    if (released > 0) screenLine(overlay, origin, contact, { ...thread, 'data-run-thread': '' });
    overlay.append(svg('circle', { cx: origin[0], cy: origin[1], r: 5, fill: COLORS.D, stroke: 'white', 'stroke-width': 1.5, 'data-run-origin': '' }));
    overlay.append(svg('circle', { cx: contact[0], cy: contact[1], r: 5, fill: COLORS.D, stroke: 'white', 'stroke-width': 1.5, 'data-run-contact': '' }));
    arrow([x, -radius, depth], [x, radius, depth], 'D');
    if (state.allDimensions || formulaUses('B')) drawWidth(tire, x, 0, Math.PI * 1.15);
    if (state.allDimensions || formulaUses('H')) drawSide(tire, x, 0, Math.PI / 3);
    if (state.allDimensions || formulaUses('d')) {
      const inner = M.values(tire).d / 2;
      arrow([x - radius * .42, -inner, depth], [x - radius * .42, inner, depth], 'd');
    }
    overlay.append(svg('circle', { cx: mark[0], cy: mark[1], r: 7, fill: COLORS.D, stroke: 'white', 'stroke-width': 2, 'data-run-mark': '' }));
    if (divisions >= 0) {
      const mid = along(released / 2);
      overlay.append(svg('text', { x: mid[0], y: mid[1], fill: COLORS.D, 'text-anchor': 'middle',
        dy: 26, 'font-size': 20, 'font-weight': 750, 'data-run-length': '' }, 'πD'));
    }
    const diameter = 2 * radius;
    for (let i = 0; i < Math.min(divisions, 4); i++) {
      const from = i * diameter;
      const to = i === 3 ? released : from + diameter;
      const [cx, cy] = along((from + to) / 2);
      const [tx, ty] = along(to);
      screenLine(overlay, along(from), [tx, ty], {
        ...thread, 'stroke-width': i === 3 ? 3 : 6, 'stroke-opacity': i % 2 ? .75 : 1,
        'data-run-piece': i + 1, 'data-length-mm': to - from
      });
      screenLine(overlay, [tx, ty - 7], [tx, ty + 7], { stroke: COLORS.D, 'stroke-width': 2 });
      overlay.append(svg('text', { x: Math.min(cx, host.clientWidth - 34), y: cy + (i === 3 ? 24 : -13), fill: 'var(--pencil)',
        'text-anchor': 'middle', 'font-size': 13, 'font-weight': 750, 'data-run-piece-label': '' }, i === 3 ? '≈ 0,14D' : 'D'));
    }
  }
  function drawDimensions() {
    if (!ready || disposed || !host.clientWidth || !host.clientHeight) return;
    if (fallback) drawFallback();
    const focused = overlay.contains(document.activeElement) ? document.activeElement.dataset : null;
    overlay.replaceChildren();
    overlay.setAttribute('viewBox', `0 0 ${host.clientWidth} ${host.clientHeight}`);
    const defs = svg('defs');
    for (const [k, fill] of Object.entries(COLORS)) {
      const marker = svg('marker', { id: 'arrow-' + k, viewBox: '0 0 10 10', refX: 5, refY: 5,
        markerWidth: 5, markerHeight: 5, orient: 'auto-start-reverse' });
      marker.append(svg('path', { d: 'M0 0 L10 5 L0 10Z', fill }));
      defs.append(marker);
    }
    overlay.append(defs);
    const tire = state.tire;
    if (isCompare()) drawCompare(tire, state.tire2);
    else if (state.scene === 'run') drawRun(tire);
    else if (state.scene === 'diam') drawDiameter(tire);
    else {
      if (state.scene === 'width') drawWidth(tire, 0, 0, state.widthAngle, true);
      else if (state.allDimensions || formulaUses('B')) drawWidth(tire, 0, 0, Math.PI * 1.2);
      if (state.scene === 'side') {
        drawSide(tire, 0, 0, state.sideAngle, true);
        drawSide(tire, 0, 0, state.sideAngle, true, true);
      } else if (state.allDimensions || formulaUses('H')) drawSide(tire, 0, 0, Math.PI / 2);
      if (state.scene === 'rim' || state.allDimensions || formulaUses('d')) drawRim(tire, 0, 0, state.scene === 'rim');
      if (state.allDimensions || formulaUses('D')) {
        const radius = M.values(tire).D / 2, depth = faceDepth(tire);
        arrow([radius * 1.25, -radius, depth], [radius * 1.25, radius, depth], 'D');
      }
    }
    if (focused?.drag) {
      overlay.querySelector(`[data-drag="${focused.drag}"][data-opposite="${focused.opposite}"]`)?.focus({ preventScroll: true });
    }
  }
  function overlayPoint(event) {
    const box = overlay.getBoundingClientRect();
    return [(event.clientX - box.left) * host.clientWidth / box.width,
      (event.clientY - box.top) * host.clientHeight / box.height];
  }
  function measureCenter(drag, angle) {
    const { D, d } = M.values(state.tire);
    const side = drag.key === 'sideAngle';
    const radius = side ? (D + d) / 4 : widthRadius(D / 2, d / 2);
    const depth = side ? drag.depth : state.tire.width / 2;
    const at = angle + drag.offset;
    const a = project(radialPoint(radius, at, depth));
    const b = side ? a : project(radialPoint(radius, at, -depth));
    return [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
  }
  overlay.addEventListener('pointerdown', event => {
    const handle = event.target.closest('[data-drag]');
    if (!handle || event.button !== 0 || measureDrag || !canControl()) return;
    event.preventDefault();
    transition = null;
    const axis = handle.parentElement.querySelector('line');
    const [x, y] = overlayPoint(event);
    const key = handle.dataset.drag;
    measureDrag = { pointer: event.pointerId, key, start: state[key], depth: Number(handle.dataset.depth),
      offset: handle.dataset.opposite === '1' ? Math.PI : 0,
      dx: x - (axis.x1.baseVal.value + axis.x2.baseVal.value) / 2,
      dy: y - (axis.y1.baseVal.value + axis.y2.baseVal.value) / 2 };
    overlay.setPointerCapture(event.pointerId);
    overlay.classList.add('dragging');
    syncRights();
  });
  overlay.addEventListener('pointermove', event => {
    const drag = measureDrag;
    if (!drag || drag.pointer !== event.pointerId || !canControl()) return;
    const [x, y] = overlayPoint(event);
    // Мерка идёт по окружности модели. У вида с ребра есть две близкие
    // проекции; учитываем предыдущий угол, чтобы не прыгать на другую сторону.
    const previous = state[drag.key];
    let best = previous, distance = Infinity;
    for (let i = 0; i < 180; i++) {
      const angle = i * TURN / 180;
      const [cx, cy] = measureCenter(drag, angle);
      const score = (cx - x + drag.dx) ** 2 + (cy - y + drag.dy) ** 2 + 20 * (1 - Math.cos(angle - previous));
      if (score < distance) { distance = score; best = angle; }
    }
    state[drag.key] = best;
    requestRender();
  });
  function endMeasure(event) {
    const drag = measureDrag;
    if (!drag || drag.pointer !== event.pointerId) return;
    measureDrag = null;
    overlay.classList.remove('dragging');
    if (overlay.hasPointerCapture(event.pointerId)) overlay.releasePointerCapture(event.pointerId);
    syncRights();
    if (canControl() && state[drag.key] !== drag.start) publish();
  }
  for (const type of ['pointerup', 'pointercancel', 'lostpointercapture']) overlay.addEventListener(type, endMeasure);
  overlay.addEventListener('keydown', event => {
    const key = event.target.dataset.drag;
    if (!key || !canControl()) return;
    const direction = { ArrowRight: 1, ArrowUp: 1, ArrowLeft: -1, ArrowDown: -1 }[event.key];
    if (!direction) return;
    event.preventDefault();
    event.stopPropagation();
    state[key] = cleanAngle(state[key] + direction * TURN / 36, state[key]);
    requestRender();
    publish();
  });
  function resize(){
    const w=host.clientWidth,h=host.clientHeight;
    // При закрытии iframe или смене раскладки наблюдатель может получить
    // нулевой размер. Такая проекция испортила бы координаты всех мерок.
    if(disposed||!w||!h)return;
    if(renderer){renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();}
    requestRender();
  }
  async function start(){
    sliders();renderPresentation();renderUI();
    try{
      // Проверяем контекст до конструктора Three: отсутствие WebGL — обычный
      // режим страницы, а не ошибка в консоли ученика.
      const canvas=document.createElement('canvas');const gl=canvas.getContext('webgl2',{antialias:true,preserveDrawingBuffer:true})||canvas.getContext('webgl',{antialias:true,preserveDrawingBuffer:true});
      if(!gl)throw new Error('no-webgl');
      ({THREE,OrbitControls:window.TireOrbitControls}=await window.MathhLibs.loadThree());
      renderer=new THREE.WebGLRenderer({canvas,context:gl,antialias:true,alpha:true,preserveDrawingBuffer:true});renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.75));renderer.localClippingEnabled=true;renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.25;
      scene3=new THREE.Scene();camera=new THREE.PerspectiveCamera(FIELD_OF_VIEW,1,1,30000);scene3.add(new THREE.HemisphereLight('#f7fbff','#566177',2.3));
      const key=new THREE.DirectionalLight('#fff6e9',3.3);key.position.set(-800,1000,1600);scene3.add(key);const fill=new THREE.DirectionalLight('#91bded',2.2);fill.position.set(1000,500,-900);scene3.add(fill);
      host.replaceChildren(renderer.domElement);controls=new window.TireOrbitControls(camera,renderer.domElement);controls.enableDamping=false;controls.enablePan=false;controls.minDistance=250;controls.maxDistance=18000;controls.rotateSpeed=.65;controls.zoomSpeed=.8;
      controls.addEventListener('start',()=>{if(!canControl())return;cameraInteracting=true;transition=null;});controls.addEventListener('change',cameraChanged);controls.addEventListener('end',()=>{publish();cameraInteracting=false;if(canControl()&&window.TrainerSession)window.TrainerSession.push();});
      let down = null;
      renderer.domElement.addEventListener('pointerdown', e => { down = [e.clientX, e.clientY]; });
      renderer.domElement.addEventListener('pointerup', guard(e => {
        if (!down || Math.hypot(e.clientX - down[0], e.clientY - down[1]) > 5) return;
        const rect = renderer.domElement.getBoundingClientRect(), ray = new THREE.Raycaster();
        // Сценарий меняет геометрию до следующего кадра. Луч должен видеть
        // новые матрицы сразу, иначе быстрый клик попадает в прежний диск.
        content.updateMatrixWorld(true);
        camera.updateMatrixWorld(true);
        ray.setFromCamera(new THREE.Vector2((e.clientX - rect.left) / rect.width * 2 - 1,
          -(e.clientY - rect.top) / rect.height * 2 + 1), camera);
        const hit = ray.intersectObjects(wheels, true).find(h => {
          if (!h.object.userData.part) return false;
          if (!state.cut) return true;
          let owner = h.object;
          while (owner && !wheels.includes(owner)) owner = owner.parent;
          return !owner || h.point.x >= owner.position.x - .5;
        });
        if (hit) chooseScene(hit.object.userData.part);
      }));
      renderer.domElement.addEventListener('webglcontextlost',e=>{e.preventDefault();showFallback();});
    }catch(e){showFallback();}
    ready=true;moveMeasures(false);syncLessonMotion(null,true);buildScene();moveCamera(state.camera||preset(),0);resize();new ResizeObserver(resize).observe(host);
    cancelAnimationFrame(raf);raf=0;render(performance.now());
    lastLocalSig=JSON.stringify(getState());resolveReady();
    if(embedded&&parent!==window)parent.postMessage({source:'mathh-tire3d',type:'ready'},location.origin);
    document.dispatchEvent(new CustomEvent('tire3d-ready'));
  }
  function showFallback(){if(controls)controls.dispose();controls=null;camera=null;if(renderer){renderer.dispose();renderer.forceContextLoss();}renderer=null;THREE=null;fallback=true;$('fallbackNote').hidden=false;$('viewHint').textContent='Чертёж с теми же размерами и формулами';requestRender();}
  async function screenshot(full = false){
    await readyPromise;if(document.hidden)return null;
    if(full && presentationMotion) await presentationMotion.finished.catch(() => {});
    if(renderer)renderer.render(scene3,camera);drawDimensions();
    if(full && (embedded || solutionOpen())){
      const html2canvas=await window.MathhLibs.load('html2canvas');
      if(document.hidden||disposed)return null;
      if(!embedded){
        const cv=await html2canvas($('tireLesson').parentElement,{scale:1,backgroundColor:getComputedStyle(document.body).backgroundColor,logging:false});
        return cv.toDataURL('image/png');
      }
      const cv=await html2canvas(document.body,{width:innerWidth,height:innerHeight,windowWidth:innerWidth,windowHeight:innerHeight,scrollX:0,scrollY:0,x:0,y:0,scale:1,backgroundColor:getComputedStyle(document.body).backgroundColor,logging:false});
      return cv.toDataURL('image/png');
    }
    const canvas=document.createElement('canvas'),w=host.clientWidth,h=host.clientHeight;canvas.width=w;canvas.height=h;const ctx=canvas.getContext('2d');ctx.fillStyle=getComputedStyle(document.documentElement).getPropertyValue('--stage').trim();ctx.fillRect(0,0,w,h);
    if(renderer)ctx.drawImage(renderer.domElement,0,0,w,h);
    async function drawSVG(node){const text=new XMLSerializer().serializeToString(node.cloneNode(true));const blob=new Blob([text],{type:'image/svg+xml;charset=utf-8'}),url=URL.createObjectURL(blob);try{const img=new Image();img.src=url;await img.decode();ctx.drawImage(img,0,0,w,h);}finally{URL.revokeObjectURL(url);}}
    if(fallback)await drawSVG(host.querySelector('svg'));await drawSVG(overlay);return canvas.toDataURL('image/png');
  }
  async function sendBoardState(){if(parent!==window&&!window.__tireBoardReadOnly&&!transition&&!lessonMotion&&!spreadMotion&&!presentationMotion&&!cameraInteracting&&!measureDrag){const before=getState(),snap=await screenshot(true);if(snap&&!disposed&&JSON.stringify(before)===JSON.stringify(getState()))parent.postMessage({source:'mathh-tire3d',type:'state',state:before,png:snap},location.origin);}}
  function dispose(){disposed=true;cancelAnimationFrame(raf);clearTimeout(snapshotTimer);clearTimeout(cameraSendTimer);clearTimeout(formulaLoopTimer);if(controls)controls.dispose();disposeTree(content);if(renderer){renderer.dispose();renderer.forceContextLoss();}renderer=null;}
  document.querySelectorAll('[data-scene]').forEach(el=>el.onclick=guard(()=>chooseScene(el.dataset.scene)));
  document.querySelectorAll('.presentation-modes [data-mode]').forEach(el=>el.onclick=guard(()=>changePresentation(el.dataset.mode)));
  $('solutionToggle').onclick=guard(()=>changePresentation('interactive', !solutionOpen()));
  document.querySelectorAll('[data-style]').forEach(el=>el.onclick=guard(()=>{try{localStorage.setItem('tire3d:style',el.dataset.style);}catch(e){}change(()=>{state.style=el.dataset.style;},false);}));
  $('cutToggle').onchange=guard(()=>change(()=>{state.cut=$('cutToggle').checked;},false));
  $('allDimensions').onchange=guard(()=>change(()=>{state.allDimensions=$('allDimensions').checked;}));
  $('prevStep').onclick=guard(()=>change(()=>{state.step--;}));$('nextStep').onclick=guard(()=>change(()=>{state.step++;}));
  $('spreadMeasures').onclick=guard(()=>{
    state.spread=!state.spread;moveMeasures(true);renderUI();requestRender();publish();
  });
  $('playDemo').onclick=guard(()=>{
    if (!isCompare() && state.step === 0) { change(()=>{state.step=1;});return; }
    const previous={...state};state.demoReplay++;syncLessonMotion(previous,true);requestRender();publish();
  });
  $('resetView').onclick=guard(()=>{moveCamera(preset(),500);publish();});
  document.addEventListener('keydown',e=>{if($('tireLesson').hidden||e.target.matches('input,textarea,select')||e.altKey||e.metaKey||e.ctrlKey)return;if(e.key==='ArrowRight'&&state.step<steps().length-1){e.preventDefault();$('nextStep').click();}if(e.key==='ArrowLeft'&&state.step>0){e.preventDefault();$('prevStep').click();}});
  $('themeToggle').onclick=()=>{document.documentElement.dataset.theme=document.documentElement.dataset.theme==='dark'?'light':'dark';try{localStorage.setItem('theme',document.documentElement.dataset.theme);}catch(e){}buildScene();requestRender();};
  $('homeLink').onclick=e=>{if(window.TrainerSession){e.preventDefault();window.TrainerSession.guardStudentAction('navigate',()=>window.TrainerSession.navigateTo('index'))();}};
  $('addBoard').onclick=guard(async()=>{if(window.TrainerSession&&window.TrainerSession.studentRestricted('navigate')){window.TrainerSession.flashRestrictedHint();return;}const png=await screenshot(solutionOpen());if(!png)return;try{localStorage.setItem('tire3d:pending',JSON.stringify({state:getState(),png,at:Date.now()}));if(window.TrainerSession)window.TrainerSession.navigateTo('boards.html?tire3d=1');else location.href='boards.html?tire3d=1';}catch(e){$('status').textContent='Не удалось подготовить вставку. Откройте доску и добавьте модель из панели.';}});
  window.addEventListener('message',async e=>{if(e.origin!==location.origin||e.source!==parent||!e.data||e.data.source!=='mathh-tire3d-host')return;if(e.data.type==='apply'){await readyPromise;applyState(e.data.state,{animate:e.data.animate===true});sendBoardState();}if(e.data.type==='snapshot')sendBoardState();if(e.data.type==='dispose')dispose();if(e.data.type==='permissions'){window.__tireBoardReadOnly=!!e.data.readOnly;syncRights();requestRender();}});
  reduced.addEventListener('change', syncFormulaFocus);
  document.addEventListener('visibilitychange',()=>{if(document.hidden){cancelAnimationFrame(raf);raf=0;clearTimeout(formulaLoopTimer);}else{if(transition)moveCamera(state.camera||preset(),0);if(lessonMotion){lessonProgress=1;lessonMotion=null;}if(spreadMotion)moveMeasures(false);syncFormulaFocus();requestRender();}});
  window.addEventListener('pagehide',dispose,{once:true});
  window.Tire3D={COLORS,DEFAULT,getState,applyState,versionedState,applyFromPeer,receiveCamera,syncRights,shareURL,ready:readyPromise,screenshot,steps:()=>copy(steps()),metrics:()=>({...M.values(state.tire),...M.compare(state.tire,state.tire2)}),debug:()=>({webgl:!!renderer,fallback,frameCount,geometries:renderer?renderer.info.memory.geometries:0}),dispose};
  window.__trainerState={get:getState,apply:applyState};
  start();
})();
