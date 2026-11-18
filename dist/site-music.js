(() => {
  'use strict';
  if (new URLSearchParams(location.search).get('admin-preview') === '1') return;

  const button = document.getElementById('music-toggle');
  const track = document.getElementById('hotel-music');
  const label = button.querySelector('span');
  const status = document.getElementById('music-status');

  function updateButton() {
    label.textContent = track.paused ? 'Müziği aç' : 'Müziği durdur';
  }

  async function start({ automatic = false } = {}) {
    status.textContent = '';
    if (!track.hasAttribute('src')) track.src = track.dataset.src;
    try {
      await track.play();
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
      void start();
    } else {
      track.pause();
      updateButton();
    }
  });

  button.hidden = false;
  void start({ automatic: true });
})();
