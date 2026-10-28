// Service Worker para FinanzFlow PWA
// Versión de caché offline-first v1.4.0 (Mejoras Móvil)
const CACHE_NAME = 'finanzflow-v1.4.0';

const PRECACHE_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './css/styles.css',
  './js/storage.js',
  './js/auth.js',
  './js/charts.js',
  './js/security.js',
  './js/transactions.js',
  './js/budgets.js',
  './js/goals.js',
  './js/calendar.js',
  './js/calculators.js',
  './js/app.js',
  './icons/icon.svg',
  './icons/favicon-64.png',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-maskable-192.png',
  './icons/icon-maskable-512.png'
];

// Instalación: Precargar recursos críticos
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[FinanzFlow SW] Precargando activos esenciales para modo offline');
      return cache.addAll(PRECACHE_ASSETS);
    }).then(() => self.skipWaiting())
  );
});

// Activación: Limpieza de cachés antiguas
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log('[FinanzFlow SW] Eliminando versión anterior de caché:', cache);
            return caches.delete(cache);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Intercepción de solicitudes de red: Stale-While-Revalidate para máxima velocidad offline
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  if (!event.request.url.startsWith('http')) return;

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      const fetchPromise = fetch(event.request).then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      }).catch((err) => {
        console.log('[FinanzFlow SW] Operando en modo offline para:', event.request.url);
        return cachedResponse;
      });

      return cachedResponse || fetchPromise;
    })
  );
});
