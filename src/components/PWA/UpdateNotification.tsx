import React, { useState, useEffect } from 'react';
import ThematicContainer from '../ui/ThematicContainer';
import PrimaryButton from '../ui/PrimaryButton';

interface UpdateNotificationProps {
  onUpdate?: () => void;
}

const UpdateNotification: React.FC<UpdateNotificationProps> = ({ onUpdate }) => {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);
  const [newVersion, setNewVersion] = useState<string>('');

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      const cleanupFunctions: (() => void)[] = [];

      const initializeServiceWorker = async () => {
        try {
          // Get existing registration
          let reg = await navigator.serviceWorker.getRegistration('/');

          if (!reg) {
            // If no registration exists, register it
            reg = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
          }

          setRegistration(reg);

          // Check if there's already a waiting service worker
          if (reg.waiting) {
            setUpdateAvailable(true);
          }

          // Listen for new service worker installation
          const handleUpdateFound = () => {
            console.log('🔄 Service worker update found');
            const newWorker = reg!.installing;

            if (newWorker) {
              const handleStateChange = () => {
                console.log('📱 SW State:', newWorker.state);

                // When the new service worker is installed and ready
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  console.log('✅ New service worker ready, showing update notification');
                  setUpdateAvailable(true);
                }
              };

              newWorker.addEventListener('statechange', handleStateChange);
              cleanupFunctions.push(() => {
                newWorker.removeEventListener('statechange', handleStateChange);
              });
            }
          };

          reg.addEventListener('updatefound', handleUpdateFound);
          cleanupFunctions.push(() => {
            reg!.removeEventListener('updatefound', handleUpdateFound);
          });

          // Listen for service worker messages (including version info)
          const handleMessage = (event: MessageEvent) => {
            if (event.data && event.data.type === 'SW_UPDATED') {
              console.log('🚀 Service worker updated to:', event.data.version);
              setNewVersion(event.data.version);
              setUpdateAvailable(true);
            }
          };

          navigator.serviceWorker.addEventListener('message', handleMessage);
          cleanupFunctions.push(() => {
            navigator.serviceWorker.removeEventListener('message', handleMessage);
          });

          // Manual check for updates
          const checkForUpdates = async () => {
            try {
              if (reg) {
                console.log('🔍 Checking for updates...');
                await reg.update();
              }
            } catch (error) {
              console.error('❌ Update check failed:', error);
            }
          };

          // Check for updates when app becomes visible
          const handleVisibilityChange = () => {
            if (!document.hidden) {
              checkForUpdates();
            }
          };

          document.addEventListener('visibilitychange', handleVisibilityChange);
          cleanupFunctions.push(() => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
          });

          // Check for updates periodically (every 10 minutes)
          const updateInterval = setInterval(checkForUpdates, 10 * 60 * 1000);
          cleanupFunctions.push(() => {
            clearInterval(updateInterval);
          });

          // Initial update check
          await checkForUpdates();
        } catch (error) {
          console.error('❌ Service worker initialization failed:', error);
        }
      };

      initializeServiceWorker();

      // Cleanup function
      return () => {
        cleanupFunctions.forEach((cleanup) => cleanup());
      };
    }
  }, []);

  // Listen for controller changes (when new SW takes over)
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      const handleControllerChange = () => {
        console.log('🔄 Service worker controller changed, reloading...');
        // Small delay to ensure the new SW is fully ready
        setTimeout(() => {
          window.location.reload();
        }, 100);
      };

      navigator.serviceWorker.addEventListener('controllerchange', handleControllerChange);

      return () => {
        navigator.serviceWorker.removeEventListener('controllerchange', handleControllerChange);
      };
    }
  }, []);

  const handleUpdate = () => {
    console.log('🔄 User requested update');

    if (registration?.waiting) {
      // Tell the waiting service worker to skip waiting and become active
      registration.waiting.postMessage({ type: 'SKIP_WAITING' });
      setUpdateAvailable(false);
    } else if (registration) {
      // Force an update check
      registration.update().then(() => {
        if (registration.waiting) {
          registration.waiting.postMessage({ type: 'SKIP_WAITING' });
        } else {
          // If no update is waiting, just reload
          window.location.reload();
        }
      });
    }

    onUpdate?.();
  };

  const handleDismiss = () => {
    console.log('⏭️ User dismissed update notification');
    setUpdateAvailable(false);

    // Show again after 30 minutes if there's still an update waiting
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
    <div className="fixed bottom-24 left-4 right-4 z-50 mx-auto max-w-sm">
      <ThematicContainer color="nocenaPurple" glassmorphic={true} asButton={false} rounded="2xl" className="p-6">
        {/* Icon */}
        <div className="flex justify-center mb-4">
          <div className="w-12 h-12 bg-nocenaPurple/20 rounded-full flex items-center justify-center border border-nocenaPurple/30">
            <div className="w-6 h-6 border-2 border-nocenaPurple border-t-transparent rounded-full animate-spin"></div>
          </div>
        </div>

        {/* Content */}
        <div className="text-center mb-6">
          <h3 className="text-lg font-bold text-white mb-2">App Update Ready</h3>
          <p className="text-gray-300 text-sm">
            {newVersion ? `Version ${newVersion} is available` : 'Get the latest features and improvements'}
          </p>
        </div>

        {/* Buttons */}
        <div className="space-y-3">
          <PrimaryButton text="Update Now" onClick={handleUpdate} className="w-full" isActive={true} />

          <button
            onClick={handleDismiss}
            className="w-full text-sm text-gray-400 hover:text-gray-300 transition-colors py-2"
          >
            Remind me later
          </button>
        </div>
      </ThematicContainer>
    </div>
  );
};

export default UpdateNotification;
