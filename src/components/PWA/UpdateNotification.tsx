import React, { useState, useEffect } from 'react';

interface UpdateNotificationProps {
  onUpdate?: () => void;
}

const UpdateNotification: React.FC<UpdateNotificationProps> = ({ onUpdate }) => {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      // Check for existing registration
      navigator.serviceWorker.getRegistration().then((reg) => {
        if (reg) {
          setRegistration(reg);

          // Check if there's already a waiting service worker
          if (reg.waiting) {
            setUpdateAvailable(true);
          }

          // Listen for new service worker installation
          reg.addEventListener('updatefound', () => {
            const newWorker = reg.installing;
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                // When the new service worker is installed and ready
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  setUpdateAvailable(true);
                }
              });
            }
          });
        }
      });

      // Listen for controller changes (when new SW takes over)
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        // Reload the page to get the new version
        window.location.reload();
      });

      // Manual check for updates (useful for testing)
      const checkForUpdates = () => {
        if (registration) {
          registration.update();
        }
      };

      // Check for updates when app becomes visible
      document.addEventListener('visibilitychange', () => {
        if (!document.hidden) {
          checkForUpdates();
        }
      });

      // Check for updates periodically (every 10 minutes)
      const updateInterval = setInterval(checkForUpdates, 10 * 60 * 1000);

      return () => {
        clearInterval(updateInterval);
      };
    }
  }, [registration]);

  const handleUpdate = () => {
    if (registration?.waiting) {
      // Tell the waiting service worker to skip waiting and become active
      registration.waiting.postMessage({ type: 'SKIP_WAITING' });
      setUpdateAvailable(false);
    }
    onUpdate?.();
  };

  const handleDismiss = () => {
    setUpdateAvailable(false);
    // Show again after 30 minutes
    setTimeout(
      () => {
        if (registration?.waiting) {
          setUpdateAvailable(true);
        }
      },
      30 * 60 * 1000,
    );
  };

  if (!updateAvailable) return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 z-50 mx-auto max-w-sm">
      <div className="bg-white border border-gray-200 rounded-xl shadow-lg p-4 backdrop-blur-sm bg-opacity-95">
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
              <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-900">New Update Available! 🚀</p>
            <p className="text-sm text-gray-600 mt-1">Get the latest features and improvements for Nocena</p>
          </div>
        </div>

        <div className="mt-4 flex space-x-2">
          <button
            onClick={handleUpdate}
            className="flex-1 bg-blue-600 text-white text-sm font-medium py-2.5 px-3 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
          >
            Update Now
          </button>
          <button
            onClick={handleDismiss}
            className="flex-1 bg-gray-100 text-gray-700 text-sm font-medium py-2.5 px-3 rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-colors"
          >
            Later
          </button>
        </div>
      </div>
    </div>
  );
};

export default UpdateNotification;
