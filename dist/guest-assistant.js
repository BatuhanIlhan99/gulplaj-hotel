(() => {
  'use strict';
  if (new URLSearchParams(location.search).get('admin-preview') === '1') return;

  const launch = document.getElementById('guest-assistant-launch');
  const panel = document.getElementById('guest-assistant-panel');
  launch.addEventListener('click', () => panel.showModal());
  panel.querySelector('.guest-assistant-close').addEventListener('click', () => panel.close());
  panel.addEventListener('close', () => launch.focus({ preventScroll: true }));
  launch.hidden = false;
})();
