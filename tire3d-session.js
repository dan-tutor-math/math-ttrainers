/* Снимки и эфемерная камера идут через существующий API сессии: правила
   доставки и восстановления канала остаются общими для всей платформы. */
(function () {
  'use strict';
  const api = window.Tire3D, session = window.TrainerSession;
  if (!api || !session) return;
  api.ready.then(() => {
    session.init({ trainer: 'tire3d', getState: api.versionedState, applyState: api.applyFromPeer });
    session.onEvent('tire3d-camera', api.receiveCamera);
    session.mountShareButton();
    const host = document.getElementById('modelHost');
    // Проверяем права до обработчика OrbitControls: запрещённый жест не
    // должен даже на мгновение сдвигать камеру наблюдателя.
    ['pointerdown', 'wheel', 'touchstart'].forEach(type => host.addEventListener(type, e => {
      api.syncRights();
      if (session.studentRestricted('board')) { e.preventDefault(); e.stopImmediatePropagation(); session.flashRestrictedHint(); }
    }, { capture: true, passive: false }));
  });
})();
