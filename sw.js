// ── sw.js — Service Worker cache offline ────────────────────────────────────

const CACHE = 'johanna-v10';

const PRECACHE = [
  './',
  './index.html',
  './css/app.css',
  './js/stories.js',
  './js/reader.js',
  './js/game.js',
  './js/fireflies.js',
  './js/animals.js',
  './js/memory.js',
  './js/morpion.js',
  './js/runner.js',
  './js/app.js',
  './manifest.json',
  './audio/berceuse.mp3',
  './audio/chouette.wav',
  './audio/chat.wav',
  './audio/grenouille.wav',
  './audio/criquet.wav',
  './audio/loup.wav',
  './audio/rossignol.wav',
  './audio/gecko.wav',
  './audio/singe.wav',
  // Images
  './images/scene1_coton_ciel.jpg',
  './images/scene2_coton_foret.jpg',
  './images/scene3_coton_canards.jpg',
  './images/scene4_coton_moutons.jpg',
  './images/scene5_coton_lune.jpg',
  './images/scene1_etoile_intro.jpg',
  './images/scene2_etoile_brise.jpg',
  './images/scene3_etoile_chouette.jpg',
  './images/scene4_etoile_doudou.jpg',
  './images/scene1_pompon_foret.jpg',
  './images/scene2_pompon_chemin.jpg',
  './images/scene3_pompon_maman.jpg',
  './images/scene4_pompon_dodo.jpg',
  './images/scene1_train_gare.jpg',
  './images/scene2_train_doudous.jpg',
  './images/scene3_train_lait.jpg',
  './images/scene4_train_etoiles.jpg',
  './images/scene5_train_chambre.jpg',
  './images/scene1_gouttelette_intro.jpg',
  './images/scene2_gouttelette_ballons.jpg',
  './images/scene3_gouttelette_nuage.jpg',
  './images/scene4_gouttelette_repos.jpg',
  './images/scene1_chocolat_foret.jpg',
  './images/scene2_chocolat_bisous.jpg',
  './images/scene3_chocolat_doudou.jpg',
  './images/scene4_chocolat_sommeil.jpg',
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE).then(cache => cache.addAll(PRECACHE))
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // Google Fonts : network-first avec fallback cache
  if (url.hostname.includes('googleapis.com') || url.hostname.includes('gstatic.com')) {
    event.respondWith(
      fetch(event.request).catch(() => caches.match(event.request))
    );
    return;
  }

  // Assets locaux : cache-first
  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;
      return fetch(event.request).then(response => {
        if (response && response.status === 200 && response.type !== 'opaque') {
          const clone = response.clone();
          caches.open(CACHE).then(cache => cache.put(event.request, clone));
        }
        return response;
      });
    })
  );
});
