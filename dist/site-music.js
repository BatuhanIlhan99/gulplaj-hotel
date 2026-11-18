(() => {
  'use strict';
  if (new URLSearchParams(location.search).get('admin-preview') === '1') return;

  const button = document.getElementById('music-toggle');
  const track = document.getElementById('hotel-music');
  const label = button.querySelector('span');
  const status = document.getElementById('music-status');
  const storageKey = 'gulplaj-music-playback';
  let stopped = false;
  let resumeAt = 0;

  function rememberPlayback() {
    const position = track.ended ? 0 : (track.currentTime || resumeAt);
    try {
      sessionStorage.setItem(storageKey, JSON.stringify({ position, stopped }));
    } catch { /* Playback also works without browser storage. */ }
  }

  function restorePlayback() {
    try {
      const saved = JSON.parse(sessionStorage.getItem(storageKey) || 'null');
      stopped = saved?.stopped === true;
      resumeAt = Number.isFinite(saved?.position) && saved.position > 0 ? saved.position : 0;
    } catch { /* Start at the beginning if browser storage is unavailable. */ }
  }

  function updateButton() {
    label.textContent = track.paused ? 'Müziği aç' : 'Müziği durdur';
  }

  async function start({ automatic = false } = {}) {
    status.textContent = '';
    if (!track.hasAttribute('src')) track.src = track.dataset.src;
    if (resumeAt > 0) {
      track.currentTime = resumeAt;
    }
    try {
      await track.play();
      resumeAt = 0;
    } catch (error) {
      if (automatic && error.name === 'NotAllowedError') {
        document.addEventListener('click', startAfterInteraction, true);
      } else if (error.name !== 'NotAllowedError' && error.name !== 'AbortError') {
        status.textContent = 'Müzik yüklenemedi. Tekrar deneyebilirsiniz.';
        track.removeAttribute('src');
        track.load();
      }
    }
    updateButton();
  }

  function startAfterInteraction(event) {
    if (!event.isTrusted) return;
    document.removeEventListener('click', startAfterInteraction, true);
    if (!button.contains(event.target)) void start();
  }

  track.volume = 0.25;
  for (const event of ['play', 'pause', 'ended']) {
    track.addEventListener(event, updateButton);
  }

  button.addEventListener('click', () => {
    document.removeEventListener('click', startAfterInteraction, true);
    if (track.paused) {
      stopped = false;
      void start();
    } else {
      stopped = true;
      track.pause();
      rememberPlayback();
      updateButton();
    }
  });

  button.hidden = false;
  restorePlayback();
  if (!stopped) void start({ automatic: true });

  window.addEventListener('pagehide', () => {
    rememberPlayback();
    document.removeEventListener('click', startAfterInteraction, true);
    track.pause();
  });

  window.addEventListener('pageshow', event => {
    if (!event.persisted) return;
    restorePlayback();
    if (track.hasAttribute('src')) track.currentTime = resumeAt;
    if (!stopped) void start({ automatic: true });
    else updateButton();
  });
})();
