// src/components/UpdatePrompt.tsx
import { useEffect, useState } from 'react';

interface UpdatePromptProps {
  className?: string;
}

export default function UpdatePrompt({ className = '' }: UpdatePromptProps) {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
      return;
    }

    let registration: ServiceWorkerRegistration;

    const handleServiceWorkerUpdate = () => {
      // Listen for controller changes (when new SW takes control)
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        console.log('Service Worker controller changed - reloading page');
        window.location.reload();
      });

      // Listen for messages from service worker
      navigator.serviceWorker.addEventListener('message', (event) => {
        console.log('Received message from SW:', event.data);
        
        if (event.data?.type === 'SW_UPDATED') {
          console.log('Service Worker updated to version:', event.data.version);
          // Could show a subtle notification here
        }
        
        if (event.data?.type === 'NAVIGATE_TO') {
          // Handle navigation from notifications
          window.history.pushState(null, '', event.data.url);
          window.dispatchEvent(new PopStateEvent('popstate'));
        }
      });

      // Check for updates
      navigator.serviceWorker.ready.then((reg) => {
        registration = reg;
        
        // Check if there's an update waiting
        if (reg.waiting) {
          console.log('Update available - service worker waiting');
          setUpdateAvailable(true);
        }

        // Listen for new updates
        reg.addEventListener('updatefound', () => {
          const newWorker = reg.installing;
          console.log('New service worker installing');
          
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              console.log('New service worker state:', newWorker.state);
              
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                console.log('New service worker installed - update available');
                setUpdateAvailable(true);
              }
            });
          }
        });

        // Periodically check for updates (every 30 minutes)
        setInterval(() => {
          console.log('Checking for service worker updates...');
          reg.update();
        }, 30 * 60 * 1000);
      });
    };

    handleServiceWorkerUpdate();
  }, []);

  const handleUpdate = async () => {
    try {
      setIsUpdating(true);
      
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.ready;
        
        if (registration.waiting) {
          console.log('Telling waiting service worker to skip waiting');
          registration.waiting.postMessage({ type: 'SKIP_WAITING' });
        } else {
          // If no waiting worker, just reload to get the latest version
          window.location.reload();
        }
      }
    } catch (error) {
      console.error('Error updating app:', error);
      setIsUpdating(false);
      // Fallback: just reload the page
      window.location.reload();
    }
  };

  const handleDismiss = () => {
    setUpdateAvailable(false);
  };

  if (!updateAvailable) {
    return null;
  }

  return (
    <div className={`fixed bottom-4 left-4 right-4 z-50 ${className}`}>
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4 rounded-lg shadow-lg border border-white/20">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <h3 className="font-semibold text-sm">New Version Available! 🚀</h3>
            <p className="text-xs opacity-90 mt-1">
              Update Nocena to get the latest features and improvements.
            </p>
          </div>
          
          <div className="flex gap-2 ml-4">
            <button
              onClick={handleDismiss}
              className="px-3 py-1 text-xs bg-white/20 hover:bg-white/30 rounded transition-colors"
              disabled={isUpdating}
            >
              Later
            </button>
            
            <button
              onClick={handleUpdate}
              disabled={isUpdating}
              className="px-4 py-1 text-xs bg-white text-blue-600 hover:bg-gray-100 rounded font-medium transition-colors disabled:opacity-50"
            >
              {isUpdating ? 'Updating...' : 'Update Now'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}