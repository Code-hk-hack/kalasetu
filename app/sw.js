const CACHE_NAME = 'kalasetu-ai-v3';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './styles.css',
  './manifest.json',
  './js/core/appState.js',
  './js/core/featureRegistry.js',
  './js/core/offlineStorage.js',
  './js/core/voiceService.js',
  './js/core/aiConfig.js',
  './js/core/aiService.js',
  './js/modules/voiceCataloger.js',
  './js/modules/pricingAssistant.js',
  './js/modules/hisabKitab.js',
  './js/modules/marketShowcase.js',
  './js/modules/settings.js',
  './js/landingTranslations.js',
  './assets/icon-192.png',
  './assets/icon-512.png',
  './landing.html',
  './landing.css'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE).catch(err => console.warn('Cache addAll error:', err));
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    }).then(() => self.clients.claim())
  );
});

// Network-First with Cache Fallback for robust offline support and fresh online updates
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      })
      .catch(() => {
        return caches.match(event.request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          if (event.request.mode === 'navigate') {
            return caches.match('./index.html');
          }
        });
      })
  );
});
