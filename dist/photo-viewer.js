(() => {
  'use strict';

  const viewer = document.getElementById('photo-viewer');
  if (!viewer || typeof viewer.showModal !== 'function') return;

  const fullImage = document.getElementById('photo-full-image');
  const title = document.getElementById('photo-viewer-title');
  const position = document.getElementById('photo-position');
  const originalLink = document.getElementById('photo-original');
  const previous = document.getElementById('previous-photo');
  const next = document.getElementById('next-photo');
  const triggerSelector = '.photo-open, [data-photo-open]';
  let photos = [];
  let index = 0;
  let opener;

  function showPhoto() {
    const trigger = photos[index];
    const image = trigger.querySelector('img');
    const original = trigger.getAttribute('href') || image.dataset.original || image.currentSrc || image.src;
    fullImage.src = original;
    fullImage.alt = image.alt;
    title.textContent = image.alt || 'Otel fotoğrafı';
    position.textContent = `${index + 1} / ${photos.length}`;
    originalLink.href = original;
  }

  document.addEventListener('click', event => {
    if (event.defaultPrevented || event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
    const trigger = event.target.closest(triggerSelector);
    const group = trigger?.closest('.gallery-panel, [data-photo-gallery]');
    if (!group || !trigger.querySelector('img')) return;
    event.preventDefault();
    opener = trigger;
    photos = [...group.querySelectorAll(triggerSelector)];
    index = photos.indexOf(trigger);
    previous.disabled = next.disabled = photos.length < 2;
    showPhoto();
    viewer.showModal();
  });

  function step(direction) {
    index = (index + direction + photos.length) % photos.length;
    showPhoto();
  }

  document.getElementById('close-viewer').addEventListener('click', () => viewer.close());
  viewer.addEventListener('close', () => opener?.focus({ preventScroll: true }));
  previous.addEventListener('click', () => step(-1));
  next.addEventListener('click', () => step(1));
  viewer.addEventListener('keydown', event => {
    if (photos.length < 2 || !['ArrowRight', 'ArrowLeft'].includes(event.key)) return;
    event.preventDefault();
    step(event.key === 'ArrowRight' ? 1 : -1);
  });
})();
