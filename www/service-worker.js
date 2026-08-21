const CACHE_NAME = 'xiaoyu-app-v6';
const ASSETS = [
  'index.html',
  'manifest.json',
  'css/app.css',
  'js/api.js',
  'js/store.js',
  'js/components.js',
  'js/router.js',
  'js/lib/trash.js',
  'js/lib/summary.js',
  'js/lib/plan.js',
  'js/lib/media.js',
  'js/lib/dev.js',
  'js/lib/consulting.js',
  'js/lib/fitness.js',
  'js/lib/fitnessRecommended.js',
  'js/lib/diet.js',
  'js/lib/foodDb.js',
  'js/lib/novels.js',
  'js/lib/dataDevice.js',
  'js/lib/export.js',
  'js/lib/homeConfig.js',
  'js/lib/search.js',
  'js/views/home.js',
  'js/views/plan.js',
  'js/views/media.js',
  'js/views/dev.js',
  'js/views/consulting.js',
  'js/views/fitness.js',
  'js/views/diet.js',
  'js/views/novels.js',
  'js/views/dataDevice.js',
  'js/app.js',
  'icons/icon-192.png',
  'icons/icon-512.png',
  'icons/icon-maskable-512.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  if (req.mode === 'navigate') {
    event.respondWith(
      caches.match('index.html').then((cached) => cached || fetch(req))
    );
    return;
  }

  event.respondWith(
    caches.match(req).then((cached) => {
      const network = fetch(req)
        .then((res) => {
          if (res && res.status === 200) {
            const copy = res.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(req, copy));
          }
          return res;
        })
        .catch(() => cached);
      return cached || network;
    })
  );
});


