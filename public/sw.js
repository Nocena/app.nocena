// public/sw.js - Enhanced Service Worker for Nocena with Permission Management
// Version for cache busting and updates
const SW_VERSION = 'v1.4.0';
const CACHE_NAME = `nocena-cache-${SW_VERSION}`;

console.log('🔧 Nocena SW:', SW_VERSION, 'starting...');

// Install event - cache essential resources
self.addEventListener('install', (event) => {
  console.log('📦 SW Installing:', SW_VERSION);

  // Skip waiting to activate immediately but handle gracefully
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

      // Notify clients about the update with permission preservation flag
      self.clients.matchAll().then((clients) => {
        clients.forEach((client) => {
          client.postMessage({
            type: 'SW_UPDATED',
            version: SW_VERSION,
            preservePermissions: true, // Signal to preserve permissions
            timestamp: Date.now(),
          });
        });
      }),
    ]).then(() => {
      console.log('✅ SW Activation complete');
    }),
  );
});

// Enhanced message handler for permission management
self.addEventListener('message', (event) => {
  console.log('💬 SW Message received:', event.data);

  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }

  if (event.data && event.data.type === 'GET_VERSION') {
    event.ports[0].postMessage({
      version: SW_VERSION,
      timestamp: Date.now(),
    });
  }

  // Handle permission state preservation
  if (event.data && event.data.type === 'PRESERVE_PERMISSIONS') {
    handlePermissionPreservation(event.data.permissions);
  }

  // Handle camera stream cleanup requests
  if (event.data && event.data.type === 'CLEANUP_CAMERA_STREAMS') {
    // Notify all clients to cleanup camera streams before update
    self.clients.matchAll().then((clients) => {
      clients.forEach((client) => {
        if (client !== event.source) {
          client.postMessage({
            type: 'CLEANUP_MEDIA_STREAMS',
            reason: 'service_worker_update',
          });
        }
      });
    });
  }
});

// Handle permission preservation across updates
async function handlePermissionPreservation(permissions) {
  try {
    // Store permission state in cache for retrieval after update
    const cache = await caches.open(CACHE_NAME);
    const permissionData = {
      permissions,
      timestamp: Date.now(),
      swVersion: SW_VERSION,
    };

    // Store as a synthetic response
    const response = new Response(JSON.stringify(permissionData), {
      headers: { 'Content-Type': 'application/json' },
    });

    await cache.put('/permission-state', response);
    console.log('💾 Permissions preserved for update');
  } catch (error) {
    console.error('❌ Failed to preserve permissions:', error);
  }
}

// Push notification event handler with enhanced permission checking
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
    // Check if we can show notifications before attempting
    checkNotificationPermission()
      .then((canShow) => {
        if (canShow) {
          return self.registration.showNotification(notificationData.title, {
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
          });
        } else {
          console.log('📱 Notification permission not available');
        }
      })
      .catch((error) => {
        console.error('📱 Failed to show notification:', error);
      }),
  );
});

// Check notification permission
async function checkNotificationPermission() {
  try {
    // Check if notifications are supported
    if (!self.registration || !self.registration.showNotification) {
      return false;
    }

    // For service workers, we assume permission is granted if push was received
    return true;
  } catch (error) {
    console.error('Error checking notification permission:', error);
    return false;
  }
}

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

  if (event.tag === 'permission-refresh') {
    event.waitUntil(syncPermissionState());
  }
});

// Enhanced fetch event handler with permission-aware caching
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Only handle GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Special handling for permission-sensitive resources
  if (url.pathname.includes('/completing') || url.pathname.includes('/camera')) {
    event.respondWith(networkFirstWithPermissionCheck(request));
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

// Permission-aware network strategy
async function networkFirstWithPermissionCheck(request) {
  try {
    const networkResponse = await fetch(request);

    if (networkResponse.status === 200) {
      const cache = await caches.open(CACHE_NAME);

      // Clone response for caching
      const responseToCache = networkResponse.clone();

      // Notify clients that camera page is being loaded
      if (request.url.includes('/completing')) {
        notifyClientsAboutCameraPage();
      }

      cache.put(request, responseToCache);
    }

    return networkResponse;
  } catch (error) {
    console.log('🌐 Network failed for permission-sensitive page:', request.url);

    const cache = await caches.open(CACHE_NAME);
    const cachedResponse = await cache.match(request);

    if (cachedResponse) {
      // Notify that we're serving from cache
      notifyClientsAboutCacheLoad();
      return cachedResponse;
    }

    // If it's a navigation request, return offline page
    if (request.mode === 'navigate') {
      return cache.match('/offline') || new Response('Offline - Camera features require connection');
    }

    throw error;
  }
}

// Notify clients about camera page loading
function notifyClientsAboutCameraPage() {
  self.clients.matchAll().then((clients) => {
    clients.forEach((client) => {
      client.postMessage({
        type: 'CAMERA_PAGE_LOADING',
        timestamp: Date.now(),
      });
    });
  });
}

// Notify clients about cache load
function notifyClientsAboutCacheLoad() {
  self.clients.matchAll().then((clients) => {
    clients.forEach((client) => {
      client.postMessage({
        type: 'SERVING_FROM_CACHE',
        timestamp: Date.now(),
      });
    });
  });
}

// Standard caching strategies
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
    console.log('🔄 Syncing offline challenge completions...');
    // Implementation depends on your offline storage strategy
  } catch (error) {
    console.error('🔄 Sync failed:', error);
  }
}

// Sync permission state
async function syncPermissionState() {
  try {
    console.log('🔄 Syncing permission state...');

    // Notify all clients to refresh permissions
    const clients = await self.clients.matchAll();
    clients.forEach((client) => {
      client.postMessage({
        type: 'REFRESH_PERMISSIONS',
        timestamp: Date.now(),
      });
    });
  } catch (error) {
    console.error('🔄 Permission sync failed:', error);
  }
}

// Enhanced periodic maintenance with permission awareness
setInterval(() => {
  console.log('🧹 Running SW maintenance...');

  // Clean up old caches
  caches.keys().then((cacheNames) => {
    cacheNames
      .filter((cacheName) => cacheName.includes('nocena-cache') && cacheName !== CACHE_NAME)
      .forEach((cacheName) => caches.delete(cacheName));
  });

  // Trigger permission state sync if needed
  self.clients.matchAll().then((clients) => {
    if (clients.length > 0) {
      // Only sync if there are active clients
      if (self.registration && self.registration.sync) {
        self.registration.sync.register('permission-refresh').catch(() => {
          // Sync not supported, use message instead
          clients.forEach((client) => {
            client.postMessage({
              type: 'PERIODIC_PERMISSION_CHECK',
              timestamp: Date.now(),
            });
          });
        });
      } else {
        // Fallback to direct messaging
        clients.forEach((client) => {
          client.postMessage({
            type: 'PERIODIC_PERMISSION_CHECK',
            timestamp: Date.now(),
          });
        });
      }
    }
  });
}, 300000); // Every 5 minutes

console.log('✅ Nocena SW ready:', SW_VERSION);
