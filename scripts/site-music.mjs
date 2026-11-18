export const musicHead = prefix =>
  `<link rel="stylesheet" href="${prefix}site-music.css?v=3"><script src="${prefix}site-music.js?v=3" defer></script>`;

export const musicCredit = '<span class="music-credit">Müzik: <a href="https://incompetech.com/music/royalty-free/index.html?isrc=USUAN1100181">Laid Back Guitars – Kevin MacLeod</a> · <a href="https://creativecommons.org/licenses/by/4.0/">CC BY 4.0</a> · Web için sıkıştırıldı</span>';

export const musicPlayer = prefix => `<div class="site-music">
  <button class="site-music-button" id="music-toggle" type="button" aria-controls="hotel-music" hidden><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><path d="M9 18V5l12-2v13M9 18c0 1.1-1.3 2-3 2s-3-.9-3-2 1.3-2 3-2 3 .9 3 2Zm12-2c0 1.1-1.3 2-3 2s-3-.9-3-2 1.3-2 3-2 3 .9 3 2Z"/></svg><span>Müziği aç</span></button>
  <audio id="hotel-music" preload="none" data-src="${prefix}assets/laid-back-guitars.mp3?v=web-1"></audio>
  <p class="site-music-status" id="music-status" role="status"></p>
</div>`;
