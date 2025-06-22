// components/MemoryOptimizer.tsx
import { useEffect } from 'react';

// Check if we're running in a browser environment
const isBrowser = typeof window !== 'undefined';

/**
 * This component optimizes the app's memory usage by cleaning up resources
 * when the app is in the background and handling app lifecycle events.
 *
 * It doesn't render anything visible but helps with performance.
 * SIMPLIFIED VERSION to avoid timer override conflicts.
 */
const MemoryOptimizer: React.FC = () => {
  useEffect(() => {
    if (!isBrowser) return; // Don't run in SSR

    // Handle app visibility changes (foreground/background)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        // App is in background
        console.log('[MemoryOptimizer] App went to background');

        // 1. Dispatch custom event for app going to background
        window.dispatchEvent(new Event('nocena_app_background'));

        // 2. Force save any app state to localStorage
        try {
          // Get the latest page state if it exists
          const debugElement = document.getElementById('nocena-debug-state');
          if (debugElement && debugElement.textContent) {
            localStorage.setItem('nocena_page_state', debugElement.textContent);
          }
        } catch (error) {
          console.error('Failed to save state in background', error);
        }

        // 3. Run garbage collection if available (Chrome DevTools)
        if ('gc' in window && typeof (window as any).gc === 'function') {
          try {
            (window as any).gc();
          } catch (error) {
            // Ignore gc errors
          }
        }
      } else if (document.visibilityState === 'visible') {
        // App is now visible
        console.log('[MemoryOptimizer] App came to foreground');
        window.dispatchEvent(new Event('nocena_app_foreground'));
      }
    };

    // Handle online/offline transitions
    const handleOnline = () => {
      console.log('[MemoryOptimizer] App is online');
      window.dispatchEvent(new Event('nocena_app_online'));
    };

    const handleOffline = () => {
      console.log('[MemoryOptimizer] App is offline');
      window.dispatchEvent(new Event('nocena_app_offline'));
    };

    // Handle beforeunload to save state
    const handleBeforeUnload = () => {
      try {
        // Save critical app state before page unload
        const debugElement = document.getElementById('nocena-debug-state');
        if (debugElement && debugElement.textContent) {
          localStorage.setItem('nocena_page_state', debugElement.textContent);
        }
      } catch (error) {
        console.error('Failed to save state before unload', error);
      }
    };

    // Set up event listeners
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('beforeunload', handleBeforeUnload);

    // Detect mobile device memory limitations
    if ('deviceMemory' in navigator) {
      const memory = (navigator as any).deviceMemory;
      if (memory && memory < 4) {
        console.log('[MemoryOptimizer] Low memory device detected, enabling memory optimization');
        // Here we could enable more aggressive optimizations for low-memory devices

        // Set up periodic cleanup for low-memory devices
        const cleanupInterval = setInterval(() => {
          if (document.visibilityState === 'visible') {
            // Only clean up when app is visible to avoid interfering with background tasks
            try {
              // Clear any large cached objects that aren't critical
              const cacheKeys = Object.keys(localStorage).filter(
                (key) => key.startsWith('nocena_cache_') && !key.includes('critical'),
              );

              if (cacheKeys.length > 10) {
                // Remove oldest cache entries if we have too many
                cacheKeys.slice(0, 5).forEach((key) => {
                  try {
                    localStorage.removeItem(key);
                  } catch (error) {
                    // Ignore individual cleanup errors
                  }
                });
              }
            } catch (error) {
              console.error('Cleanup error:', error);
            }
          }
        }, 60000); // Every minute

        // Clean up the interval when component unmounts
        return () => {
          clearInterval(cleanupInterval);
          document.removeEventListener('visibilitychange', handleVisibilityChange);
          window.removeEventListener('online', handleOnline);
          window.removeEventListener('offline', handleOffline);
          window.removeEventListener('beforeunload', handleBeforeUnload);
        };
      }
    }

    // Standard cleanup for normal memory devices
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);

  // This component doesn't render anything visible
  return null;
};

export default MemoryOptimizer;
