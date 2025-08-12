// Self-contained Service Worker for Nocena App (no external dependencies)
// Version for cache busting - UPDATE THIS ON EACH DEPLOY
const CACHE_VERSION = 'v1.2.1';
const CACHE_NAME = `nocena-cache-${CACHE_VERSION}`;

console.log('SW: Loading Nocena Service Worker', CACHE_VERSION);

// Enable immediate activation and control
self.skipWaiting();

// Handle update messages from the main thread
self.addEventListener('message', (event) => {
  console.log('SW: Received message:', event.data);
  if (event.data && event.data.type === 'SKIP_WAITING') {
    console.log('SW: Received SKIP_WAITING message');
    self.skipWaiting();
  }
});

// Enhanced install event
self.addEventListener('install', (event) => {
  console.log('SW: Installing new version...', CACHE_VERSION);

  // Force activation immediately
  self.skipWaiting();
});

// Enhanced activate event with thorough cleanup
self.addEventListener('activate', (event) => {
  console.log('SW: Activating new version...', CACHE_VERSION);

  event.waitUntil(
    Promise.all([
      // Take control of all clients immediately
      self.clients.claim(),

      // Clean up old caches
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((cacheName) => {
              // Delete any cache that doesn't match our current version
              return cacheName.includes('nocena-cache') && cacheName !== CACHE_NAME;
            })
            .map((cacheName) => {
              console.log('SW: Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }),
        );
      }),

      // Notify all clients about the update
      self.clients.matchAll().then((clients) => {
        clients.forEach((client) => {
          client.postMessage({
            type: 'SW_UPDATED',
            version: CACHE_VERSION,
          });
        });
      }),
    ]).then(() => {
      console.log('SW: Activation complete');
    }),
  );
});

// Simple cache-first strategy for static assets
const cacheFirst = async (request) => {
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
    console.error('SW: Cache first error:', error);
    return fetch(request);
  }
};

// Simple network-first strategy for pages
const networkFirst = async (request) => {
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.status === 200) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    console.log('SW: Network failed, trying cache');
    const cache = await caches.open(CACHE_NAME);
    const cachedResponse = await cache.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    throw error;
  }
};

// Network-only strategy (no caching)
const networkOnly = async (request) => {
  return fetch(request);
};

// Main fetch event handler
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // NEVER cache POST, PUT, DELETE, PATCH requests
  if (request.method !== 'GET') {
    event.respondWith(networkOnly(request));
    return;
  }

  // Handle different types of requests
  if (request.mode === 'navigate') {
    // Pages - network first
    event.respondWith(networkFirst(request));
  } else if (url.pathname.startsWith('/api/')) {
    // API calls - network only
    event.respondWith(networkOnly(request));
  } else if (
    url.pathname.startsWith('/_next/static/') ||
    request.destination === 'script' ||
    request.destination === 'style' ||
    request.destination === 'image'
  ) {
    // Static assets - cache first
    event.respondWith(cacheFirst(request));
  } else if (url.hostname === 'fonts.googleapis.com') {
    // Google Fonts - cache first
    event.respondWith(cacheFirst(request));
  } else if (url.hostname === 'gateway.pinata.cloud') {
    // Pinata - cache first
    event.respondWith(cacheFirst(request));
  } else {
    // Everything else - network first
    event.respondWith(networkFirst(request));
  }
});

// Enhanced error handling
self.addEventListener('error', (event) => {
  console.error('SW: Service Worker error:', event.error);
});

self.addEventListener('unhandledrejection', (event) => {
  console.error('SW: Unhandled promise rejection:', event.reason);
});

// Periodic cache cleanup
const performMaintenanceTasks = async () => {
  try {
    const cacheNames = await caches.keys();

    // Keep only the current cache and clean up old ones
    const oldCaches = cacheNames.filter((name) => name.includes('nocena-cache') && name !== CACHE_NAME);

    if (oldCaches.length > 0) {
      await Promise.all(oldCaches.map((name) => caches.delete(name)));
      console.log('SW: Cleaned up old caches:', oldCaches);
    }

    // Limit cache size
    const currentCache = await caches.open(CACHE_NAME);
    const requests = await currentCache.keys();

    if (requests.length > 100) {
      // Remove oldest entries
      const toDelete = requests.slice(0, requests.length - 100);
      await Promise.all(toDelete.map((req) => currentCache.delete(req)));
      console.log('SW: Cache size limited, removed', toDelete.length, 'entries');
    }
  } catch (error) {
    console.error('SW: Maintenance error:', error);
  }
};

// Run maintenance tasks after 1 minute
setTimeout(performMaintenanceTasks, 60000);
