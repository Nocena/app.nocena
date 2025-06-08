// public/sw.js - Service Worker for Nocena PWA

const CACHE_NAME = 'nocena-v1';
const urlsToCache = [
  '/',
  '/home',
  '/map',
  '/search',
  '/profile',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  '/manifest.json',
];

// Install event - cache resources
self.addEventListener('install', function (event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function (cache) {
      console.log('Opened cache');
      return cache.addAll(urlsToCache);
    }),
  );
});

// Fetch event - serve from cache when possible
self.addEventListener('fetch', function (event) {
  event.respondWith(
    caches.match(event.request).then(function (response) {
      // Return cached version or fetch from network
      return response || fetch(event.request);
    }),
  );
});

// Push event - handle push notifications
self.addEventListener('push', function (event) {
  console.log('Push event received:', event);

  if (event.data) {
    const data = event.data.json();
    console.log('Push data:', data);

    const options = {
      body: data.body,
      icon: data.icon || '/icons/icon-192x192.png',
      badge: data.badge || '/icons/icon-192x192.png',
      data: data.data,
      actions: data.actions || [],
      tag: 'daily-challenge',
      renotify: true,
      requireInteraction: false,
      vibrate: [200, 100, 200],
    };

    event.waitUntil(self.registration.showNotification(data.title, options));
  } else {
    console.log('Push event but no data');
  }
});

// Notification click event
self.addEventListener('notificationclick', function (event) {
  console.log('Notification click received:', event);

  event.notification.close();

  // Handle action clicks
  if (event.action === 'open' || !event.action) {
    const urlToOpen = event.notification.data?.url || '/home';

    event.waitUntil(
      clients
        .matchAll({
          type: 'window',
          includeUncontrolled: true,
        })
        .then(function (clientList) {
          // Check if app is already open
          for (let client of clientList) {
            if (client.url.includes(self.location.origin) && 'focus' in client) {
              // Focus existing window and navigate
              client.focus();
              return client.navigate(urlToOpen);
            }
          }

          // Open new window if app not open
          if (clients.openWindow) {
            return clients.openWindow(urlToOpen);
          }
        }),
    );
  }
});

// Background sync for offline actions (optional)
self.addEventListener('sync', function (event) {
  if (event.tag === 'background-sync') {
    event.waitUntil(
      // Handle background sync
      console.log('Background sync triggered'),
    );
  }
});

// Handle service worker updates
self.addEventListener('activate', function (event) {
  event.waitUntil(
    caches.keys().then(function (cacheNames) {
      return Promise.all(
        cacheNames.map(function (cacheName) {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        }),
      );
    }),
  );
});
