/// <reference lib="webworker" />
/* eslint-disable no-restricted-globals */
declare const self: ServiceWorkerGlobalScope;

import { clientsClaim } from 'workbox-core';
import { precacheAndRoute } from 'workbox-precaching';
import { registerRoute } from 'workbox-routing';
import { StaleWhileRevalidate } from 'workbox-strategies';

clientsClaim();

// Injected by Workbox at build if you use precaching (optional):
// self.__WB_MANIFEST is populated with hashed assets.
precacheAndRoute(self.__WB_MANIFEST || []);

const APP_VERSION = (self as any).APP_VERSION || '<APP_VERSION_REPLACED_AT_BUILD>';
const RUNTIME_CACHE = `nocena-cache-${APP_VERSION}`;

console.log('SW: Loading Nocena Service Worker', APP_VERSION);

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
  console.log('SW: Installing new version...', APP_VERSION);

  // Force activation immediately
  self.skipWaiting();
});

// Enhanced activate event with thorough cleanup
self.addEventListener('activate', (event) => {
  console.log('SW: Activating new version...', APP_VERSION);

  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys.filter((k) => k.startsWith('nocena-cache-') && k !== RUNTIME_CACHE).map((k) => caches.delete(k)),
      );
      await self.clients.claim();
    })(),
  );

  // event.waitUntil(
  //   Promise.all([
  //     // Take control of all clients immediately
  //     self.clients.claim(),

  //     // Clean up old caches
  //     caches.keys().then((cacheNames) => {
  //       return Promise.all(
  //         cacheNames
  //           .filter((cacheName) => {
  //             // Delete any cache that doesn't match our current version
  //             return cacheName.includes('nocena-cache') && cacheName !== CACHE_NAME;
  //           })
  //           .map((cacheName) => {
  //             console.log('SW: Deleting old cache:', cacheName);
  //             return caches.delete(cacheName);
  //           }),
  //       );
  //     }),

  //     // Notify all clients about the update
  //     self.clients.matchAll().then((clients) => {
  //       clients.forEach((client) => {
  //         client.postMessage({
  //           type: 'SW_UPDATED',
  //           version: APP_VERSION,
  //         });
  //       });
  //     }),
  //   ]).then(() => {
  //     console.log('SW: Activation complete');
  //   }),
  // );
});

// Basic runtime caching example
registerRoute(
  ({ request }) =>
    request.destination === 'document' || request.destination === 'script' || request.destination === 'style',
  new StaleWhileRevalidate({
    cacheName: RUNTIME_CACHE,
  }),
);

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
    const oldCaches = cacheNames.filter((name) => name.includes('nocena-cache') && name !== RUNTIME_CACHE);

    if (oldCaches.length > 0) {
      await Promise.all(oldCaches.map((name) => caches.delete(name)));
      console.log('SW: Cleaned up old caches:', oldCaches);
    }

    // Limit cache size
    const currentCache = await caches.open(RUNTIME_CACHE);
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
