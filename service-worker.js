// Alien Apocalypse - PWA Service Worker for Offline Play & Standalone App
const CACHE_NAME = 'alien-apocalypse-v1';

const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/css/style.css',
  '/manifest.json',
  '/js/constants.js',
  '/js/audio.js',
  '/js/pixelart.js',
  '/js/buildings.js',
  '/js/world.js',
  '/js/entities.js',
  '/js/weapons.js',
  '/js/inventory.js',
  '/js/lab.js',
  '/js/daynight.js',
  '/js/savegame.js',
  '/js/mobile.js',
  '/js/game.js',
  '/assets/icons/icon-192.png',
  '/assets/icons/icon-512.png',
  // Absolute paths support according to User Rules
  '/c:/Go/demo/index.html',
  '/c:/Go/demo/css/style.css',
  '/c:/Go/demo/manifest.json',
  '/c:/Go/demo/js/constants.js',
  '/c:/Go/demo/js/audio.js',
  '/c:/Go/demo/js/pixelart.js',
  '/c:/Go/demo/js/buildings.js',
  '/c:/Go/demo/js/world.js',
  '/c:/Go/demo/js/entities.js',
  '/c:/Go/demo/js/weapons.js',
  '/c:/Go/demo/js/inventory.js',
  '/c:/Go/demo/js/lab.js',
  '/c:/Go/demo/js/daynight.js',
  '/c:/Go/demo/js/savegame.js',
  '/c:/Go/demo/js/mobile.js',
  '/c:/Go/demo/js/game.js',
  '/c:/Go/demo/assets/icons/icon-192.png',
  '/c:/Go/demo/assets/icons/icon-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[Service Worker] Caching core game assets for offline play...');
      return cache.addAll(ASSETS_TO_CACHE).catch((err) => {
        console.warn('[Service Worker] Cache addAll partial warning:', err);
      });
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keyList) => {
      return Promise.all(
        keyList.map((key) => {
          if (key !== CACHE_NAME) {
            console.log('[Service Worker] Removing old cache version:', key);
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  // Stale-while-revalidate or Cache first strategy
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        // Return cache hit, update cache in background
        fetch(event.request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, networkResponse);
            });
          }
        }).catch(() => {/* Offline */});

        return cachedResponse;
      }

      // Not in cache, fetch from network
      return fetch(event.request).catch(() => {
        // Fallback to index.html for navigation
        if (event.request.mode === 'navigate') {
          return caches.match('/index.html') || caches.match('/c:/Go/demo/index.html');
        }
      });
    })
  );
});
