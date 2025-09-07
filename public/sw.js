// public/sw.js - Main Service Worker for Nocena
// Version for cache busting and updates
const SW_VERSION = 'v1.3.3';
const CACHE_NAME = `nocena-cache-${SW_VERSION}`;

console.log('🔧 Nocena SW:', SW_VERSION, 'starting...');

// Install event - cache essential resources
self.addEventListener('install', (event) => {
  console.log('📦 SW Installing:', SW_VERSION);

  // Skip waiting to activate immediately
  self.skipWaiting();

  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('💾 Caching essential resources');
      return cache
        .addAll([
          '/',
          '/offline',
          '/manifest.json',
          '/icons/icon-192x192.png',
          '/icons/icon-512x512.png',
          '/logo/LogoDark.png',
        ])
        .catch((err) => {
          console.warn('⚠️ Cache preload failed:', err);
          // Don't fail installation if caching fails
        });
    }),
  );
});

// Activate event - cleanup and take control
self.addEventListener('activate', (event) => {
  console.log('🚀 SW Activating:', SW_VERSION);

  event.waitUntil(
    Promise.all([
      // Take control of all pages immediately
      self.clients.claim(),

      // Clean up old caches
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((cacheName) => cacheName.includes('nocena-cache') && cacheName !== CACHE_NAME)
            .map((cacheName) => {
              console.log('🗑️ Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }),
        );
      }),

      // Notify clients about the update
      self.clients.matchAll().then((clients) => {
        clients.forEach((client) => {
          client.postMessage({
            type: 'SW_UPDATED',
            version: SW_VERSION,
          });
        });
      }),
    ]).then(() => {
      console.log('✅ SW Activation complete');
    }),
  );
});

// Push notification event handler
self.addEventListener('push', (event) => {
  console.log('📱 Push received:', event);

  let notificationData = {
    title: 'Nocena',
    body: 'You have a new notification',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-192x192.png',
    tag: 'nocena-notification',
    data: {
      url: '/',
    },
  };

  if (event.data) {
    try {
      const payload = event.data.json();
      notificationData = {
        ...notificationData,
        ...payload,
        icon: payload.icon || notificationData.icon,
        badge: payload.badge || notificationData.badge,
        data: {
          url: payload.url || '/',
          challengeId: payload.challengeId,
          userId: payload.userId,
          ...payload.data,
        },
      };
    } catch (error) {
      console.error('📱 Error parsing push data:', error);
      notificationData.body = event.data.text() || notificationData.body;
    }
  }

  event.waitUntil(
    self.registration.showNotification(notificationData.title, {
      body: notificationData.body,
      icon: notificationData.icon,
      badge: notificationData.badge,
      tag: notificationData.tag,
      data: notificationData.data,
      requireInteraction: false,
      actions: [
        {
          action: 'open',
          title: 'Open App',
          icon: '/icons/icon-192x192.png',
        },
      ],
    }),
  );
});

// Notification click handler
self.addEventListener('notificationclick', (event) => {
  console.log('📱 Notification clicked:', event);

  event.notification.close();

  const urlToOpen = event.notification.data?.url || '/';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      // Check if there's already a window/tab open with the target URL
      for (const client of clients) {
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus();
        }
      }

      // If no window is open, open a new one
      if (self.clients.openWindow) {
        return self.clients.openWindow(urlToOpen);
      }
    }),
  );
});

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  console.log('🔄 Background sync:', event.tag);

  if (event.tag === 'challenge-completion') {
    event.waitUntil(syncChallengeCompletions());
  }
});

// Message handler for communication with main thread
self.addEventListener('message', (event) => {
  console.log('💬 SW Message received:', event.data);

  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }

  if (event.data && event.data.type === 'GET_VERSION') {
    event.ports[0].postMessage({ version: SW_VERSION });
  }
});

// Fetch event handler with caching strategy
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Only handle GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Handle different types of requests
  if (request.mode === 'navigate') {
    // Pages - network first, fallback to cache
    event.respondWith(networkFirstStrategy(request));
  } else if (url.pathname.startsWith('/api/')) {
    // API calls - network only (don't cache)
    event.respondWith(fetch(request));
  } else if (
    url.pathname.startsWith('/_next/static/') ||
    url.pathname.startsWith('/icons/') ||
    url.pathname.startsWith('/logo/') ||
    request.destination === 'image'
  ) {
    // Static assets - cache first
    event.respondWith(cacheFirstStrategy(request));
  } else if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'gateway.pinata.cloud') {
    // External resources - cache first
    event.respondWith(cacheFirstStrategy(request));
  } else {
    // Everything else - network first
    event.respondWith(networkFirstStrategy(request));
  }
});

// Caching strategies
async function networkFirstStrategy(request) {
  try {
    const networkResponse = await fetch(request);

    if (networkResponse.status === 200) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }

    return networkResponse;
  } catch (error) {
    console.log('🌐 Network failed, trying cache for:', request.url);

    const cache = await caches.open(CACHE_NAME);
    const cachedResponse = await cache.match(request);

    if (cachedResponse) {
      return cachedResponse;
    }

    // If it's a navigation request, return offline page
    if (request.mode === 'navigate') {
      return cache.match('/offline') || new Response('Offline');
    }

    throw error;
  }
}

async function cacheFirstStrategy(request) {
  try {
    const cache = await caches.open(CACHE_NAME);
    const cachedResponse = await cache.match(request);

    if (cachedResponse) {
      return cachedResponse;
    }

    const networkResponse = await fetch(request);

    if (networkResponse.status === 200) {
      cache.put(request, networkResponse.clone());
    }

    return networkResponse;
  } catch (error) {
    console.error('💾 Cache strategy failed for:', request.url, error);
    throw error;
  }
}

// Sync offline challenge completions
async function syncChallengeCompletions() {
  try {
    // Get stored offline completions from IndexedDB or localStorage
    // This would sync with your backend when online
    console.log('🔄 Syncing offline challenge completions...');

    // Implementation depends on your offline storage strategy
    // For now, just log that sync was attempted
  } catch (error) {
    console.error('🔄 Sync failed:', error);
  }
}

// Periodic maintenance
setInterval(() => {
  console.log('🧹 Running SW maintenance...');

  // Clean up old caches
  caches.keys().then((cacheNames) => {
    cacheNames
      .filter((cacheName) => cacheName.includes('nocena-cache') && cacheName !== CACHE_NAME)
      .forEach((cacheName) => caches.delete(cacheName));
  });
}, 300000); // Every 5 minutes

console.log('✅ Nocena SW ready:', SW_VERSION);
