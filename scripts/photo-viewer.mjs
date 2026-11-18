export const photoViewerScript = prefix =>
  `<script src="${prefix}photo-viewer.js?v=1" defer></script>`;

export const photoViewerMarkup = `<dialog id="photo-viewer" class="photo-viewer" aria-labelledby="photo-viewer-title">
  <div class="viewer-heading">
    <h2 id="photo-viewer-title">Otel fotoğrafı</h2>
    <button type="button" id="close-viewer" class="viewer-control" autofocus>Kapat</button>
  </div>
  <img id="photo-full-image" class="photo-full-image" alt="Büyütülen otel fotoğrafı" decoding="async">
  <div class="viewer-controls">
    <button type="button" id="previous-photo" class="viewer-control">Önceki</button>
    <p id="photo-position" aria-live="polite"></p>
    <button type="button" id="next-photo" class="viewer-control">Sonraki</button>
    <a id="photo-original" target="_blank" rel="noopener noreferrer">Özgün dosyayı aç</a>
  </div>
</dialog>`;
