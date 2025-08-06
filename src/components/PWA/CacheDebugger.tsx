'use client';

import React, { useState, useEffect } from 'react';

interface CacheInfo {
  cacheNames: string[];
  swStatus: string;
  swVersion: string | null;
  lastUpdate: string | null;
}

const CacheDebugger: React.FC = () => {
  const [cacheInfo, setCacheInfo] = useState<CacheInfo>({
    cacheNames: [],
    swStatus: 'Not available',
    swVersion: null,
    lastUpdate: null,
  });
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    loadCacheInfo();

    // Listen for service worker updates
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      const messageHandler = (event: MessageEvent) => {
        if (event.data?.type === 'SW_UPDATED') {
          loadCacheInfo();
        }
      };

      navigator.serviceWorker.addEventListener('message', messageHandler);

      return () => {
        navigator.serviceWorker.removeEventListener('message', messageHandler);
      };
    }
  }, []);

  const loadCacheInfo = async () => {
    if (typeof window === 'undefined') return;

    try {
      // Get cache names
      const cacheNames = await caches.keys();

      // Get service worker status
      let swStatus = 'Not available';
      const swVersion = null;

      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.getRegistration();
        if (registration) {
          if (registration.active) {
            swStatus = 'Active';
          } else if (registration.installing) {
            swStatus = 'Installing';
          } else if (registration.waiting) {
            swStatus = 'Waiting';
          }
        }
      }

      setCacheInfo({
        cacheNames: cacheNames.sort(),
        swStatus,
        swVersion,
        lastUpdate: new Date().toLocaleTimeString(),
      });
    } catch (error) {
      console.error('Failed to load cache info:', error);
    }
  };

  const clearAllCaches = async () => {
    if (typeof window === 'undefined') return;

    try {
      const cacheNames = await caches.keys();
      await Promise.all(cacheNames.map((name) => caches.delete(name)));

      // Also try to unregister service worker
      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        await Promise.all(registrations.map((reg) => reg.unregister()));
      }

      alert('All caches cleared! Please refresh the page.');
      loadCacheInfo();
    } catch (error) {
      console.error('Failed to clear caches:', error);
      alert('Failed to clear caches. See console for details.');
    }
  };

  const forceUpdate = async () => {
    if (typeof window === 'undefined') return;

    try {
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.getRegistration();
        if (registration) {
          await registration.update();
          loadCacheInfo();
          alert('Update check triggered!');
        }
      }
    } catch (error) {
      console.error('Failed to force update:', error);
    }
  };

  const emergencyCacheClear = async () => {
    if (typeof window === 'undefined') return;

    try {
      const response = await fetch('/api/emergency-cache-clear');
      const data = await response.json();

      if (data.success) {
        alert('Emergency cache clear initiated! Follow the instructions:\n\n' + data.instructions.join('\n'));
      } else {
        alert('Emergency cache clear failed: ' + data.message);
      }
    } catch (error) {
      console.error('Emergency cache clear failed:', error);
      alert('Failed to trigger emergency cache clear');
    }
  };

  // Only show in development or when accessed with special query param
  if (typeof window !== 'undefined') {
    if (process.env.NODE_ENV === 'production' && !window.location.search.includes('debug=true')) {
      return null;
    }
  }

  return (
    <>
      {/* Debug toggle button */}
      <button
        onClick={() => setIsVisible(!isVisible)}
        className="fixed top-20 left-2 z-50 bg-red-500 text-white text-xs px-2 py-1 rounded"
        type="button"
      >
        🐛 Cache Debug
      </button>

      {/* Debug panel */}
      {isVisible && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-4 max-w-md w-full max-h-96 overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-lg">Cache Debug Info</h3>
              <button onClick={() => setIsVisible(false)} className="text-gray-500 hover:text-gray-700" type="button">
                ✕
              </button>
            </div>

            <div className="space-y-4 text-sm">
              {/* Service Worker Status */}
              <div>
                <strong>Service Worker:</strong> {cacheInfo.swStatus}
                <br />
                <strong>Last Update:</strong> {cacheInfo.lastUpdate || 'Never'}
              </div>

              {/* Cache Names */}
              <div>
                <strong>Active Caches ({cacheInfo.cacheNames.length}):</strong>
                <ul className="list-disc list-inside mt-1 text-xs">
                  {cacheInfo.cacheNames.map((name) => (
                    <li key={name} className="truncate">
                      {name}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Action buttons */}
              <div className="flex flex-col gap-2 pt-4 border-t">
                <button
                  onClick={loadCacheInfo}
                  className="bg-blue-500 text-white px-3 py-1 rounded text-sm"
                  type="button"
                >
                  Refresh Info
                </button>

                <button
                  onClick={forceUpdate}
                  className="bg-green-500 text-white px-3 py-1 rounded text-sm"
                  type="button"
                >
                  Force SW Update
                </button>

                <button
                  onClick={emergencyCacheClear}
                  className="bg-orange-500 text-white px-3 py-1 rounded text-sm"
                  type="button"
                >
                  Emergency Clear (Server)
                </button>

                <button
                  onClick={clearAllCaches}
                  className="bg-red-500 text-white px-3 py-1 rounded text-sm"
                  type="button"
                >
                  ⚠️ Clear All Caches
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default CacheDebugger;
