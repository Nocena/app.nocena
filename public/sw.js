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
  const url = new URL(event.request.url);

  // CRITICAL: Don't cache or interfere with media-related requests
  if (
    event.request.url.includes('blob:') ||
    event.request.url.includes('mediastream:') ||
    event.request.url.includes('getUserMedia') ||
    event.request.url.includes('webrtc') ||
    url.protocol === 'blob:' ||
    url.protocol === 'mediastream:' ||
    // Don't cache API routes that might handle media
    event.request.url.includes('/api/') ||
    // Don't cache dynamic imports or chunks that might contain camera code
    event.request.url.includes('chunk') ||
    event.request.url.includes('_next/static/chunks/') ||
    // Don't cache the completing page where camera is used
    event.request.url.includes('/completing')
  ) {
    // Always fetch these from network, never cache
    return event.respondWith(fetch(event.request));
  }

  // For other requests, use cache-first strategy
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
  if (event.action === 'dismiss') {
    return; // Do nothing for dismiss
  }

  // Get the URL to navigate to
  const urlToOpen = event.notification.data?.url || '/home';
  console.log('Opening URL:', urlToOpen);

  event.waitUntil(
    clients
      .matchAll({
        type: 'window',
        includeUncontrolled: true,
      })
      .then(function (clientList) {
        console.log('Found clients:', clientList.length);

        // Check if app is already open
        for (let client of clientList) {
          console.log('Checking client URL:', client.url);
          // Check if it's our app (more flexible matching)
          if (client.url.includes('nocena') || client.url.includes('localhost') || client.url.includes('vercel.app')) {
            console.log('Focusing existing client and navigating to:', urlToOpen);
            return client.focus().then(() => {
              // Use postMessage instead of navigate for better compatibility
              return client.postMessage({
                type: 'NAVIGATE_TO',
                url: urlToOpen,
              });
            });
          }
        }

        // Open new window if app not open
        console.log('Opening new window to:', urlToOpen);
        if (clients.openWindow) {
          // Use relative URL to ensure it opens in the same origin
          return clients.openWindow(urlToOpen);
        }
      })
      .catch((error) => {
        console.error('Error handling notification click:', error);
        // Fallback: try to open the URL anyway
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      }),
  );
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
