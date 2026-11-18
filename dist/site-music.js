(() => {
  'use strict';
  const button = document.getElementById('music-toggle');
  const track = document.getElementById('hotel-music');
  const label = button.querySelector('span');
  const status = document.getElementById('music-status');

  function updateButton() {
    label.textContent = track.paused ? 'Müziği aç' : 'Müziği durdur';
  }

  track.volume = 0.25;
  for (const event of ['play', 'pause', 'ended']) {
    track.addEventListener(event, updateButton);
  }

  button.addEventListener('click', async () => {
    status.textContent = '';
    if (!track.paused) {
      track.pause();
      updateButton();
      return;
    }

    if (!track.hasAttribute('src')) track.src = track.dataset.src;
    try {
      await track.play();
    } catch (error) {
      if (error.name !== 'AbortError') {
        status.textContent = 'Müzik yüklenemedi. Tekrar deneyebilirsiniz.';
        track.removeAttribute('src');
        track.load();
      }
    }
    updateButton();
  });

  button.hidden = false;
})();
