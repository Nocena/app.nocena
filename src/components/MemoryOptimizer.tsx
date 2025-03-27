// components/MemoryOptimizer.tsx
import { useEffect } from 'react';

// Extend Window interface to allow for our custom properties
declare global {
  interface Window {
    nocena_app_timers: number[];
    __promisify__?: any; // To address the __promisify__ property issue
  }
}

/**
 * This component optimizes the app's memory usage by cleaning up resources
 * when the app is in the background and handling app lifecycle events.
 * 
 * It doesn't render anything visible but helps with performance.
 */
const MemoryOptimizer: React.FC = () => {
  useEffect(() => {
    // Store all interval IDs that should be paused when app is in background
    const intervalIds: number[] = [];
    
    // Custom tracker for app timers
    if (typeof window !== 'undefined') {
      // Add our custom global for tracking timers
      window.nocena_app_timers = window.nocena_app_timers || [];
    }
    
    // Safer type approach for setTimeout override
    type SetTimeoutFunction = typeof window.setTimeout;
    const originalSetTimeout: SetTimeoutFunction = window.setTimeout;
    
    // Use a more compatible function signature that matches Node's setTimeout exactly
    const newSetTimeout = function(
      handler: Parameters<SetTimeoutFunction>[0],
      timeout?: Parameters<SetTimeoutFunction>[1],
      ...args: any[]
    ): ReturnType<SetTimeoutFunction> {
      const timerId = originalSetTimeout(handler, timeout, ...args);
      if (typeof window !== 'undefined' && window.nocena_app_timers) {
        window.nocena_app_timers.push(timerId);
      }
      return timerId as unknown as ReturnType<SetTimeoutFunction>;
    };
    
    // Apply our override
    window.setTimeout = newSetTimeout as SetTimeoutFunction;
    
    // Similar approach for setInterval
    type SetIntervalFunction = typeof window.setInterval;
    const originalSetInterval: SetIntervalFunction = window.setInterval;
    
    const newSetInterval = function(
      handler: Parameters<SetIntervalFunction>[0],
      timeout?: Parameters<SetIntervalFunction>[1],
      ...args: any[]
    ): ReturnType<SetIntervalFunction> {
      const intervalId = originalSetInterval(handler, timeout, ...args);
      intervalIds.push(intervalId);
      return intervalId as unknown as ReturnType<SetTimeoutFunction>;
    };
    
    window.setInterval = newSetInterval as SetIntervalFunction;
    
    // Handle app visibility changes (foreground/background)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        // App is in background
        
        // 1. Dispatch custom event for app going to background
        window.dispatchEvent(new Event('nocena_app_background'));
        
        // 2. Force save any app state to localStorage
        try {
          // Get the latest page state if it exists
          if (typeof window !== 'undefined') {
            const debugElement = document.getElementById('nocena-debug-state');
            if (debugElement && debugElement.textContent) {
              localStorage.setItem('nocena_page_state', debugElement.textContent);
            }
          }
        } catch (error) {
          console.error('Failed to save state in background', error);
        }
        
        // 3. Pause non-essential timers to save battery
        if (typeof window !== 'undefined' && window.nocena_app_timers) {
          window.nocena_app_timers.forEach((timerId: number) => {
            window.clearTimeout(timerId);
          });
          window.nocena_app_timers = [];
        }
        
      } else if (document.visibilityState === 'visible') {
        // App is now visible
        window.dispatchEvent(new Event('nocena_app_foreground'));
      }
    };
    
    // Handle online/offline transitions
    const handleOnline = () => {
      console.log('App is online');
      window.dispatchEvent(new Event('nocena_app_online'));
    };
    
    const handleOffline = () => {
      console.log('App is offline');
      window.dispatchEvent(new Event('nocena_app_offline'));
    };
    
    // Set up event listeners
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    // Detect mobile device memory limitations
    if (typeof window !== 'undefined' && 'deviceMemory' in navigator) {
      const memory = (navigator as any).deviceMemory;
      if (memory && memory < 4) {
        console.log('Low memory device detected, enabling memory optimization');
        // Here we could enable more aggressive optimizations for low-memory devices
      }
    }
    
    // Clean up on component unmount
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      
      // Restore original setTimeout/setInterval
      window.setTimeout = originalSetTimeout;
      window.setInterval = originalSetInterval;
      
      // Clear any tracked intervals
      intervalIds.forEach(id => clearInterval(id));
    };
  }, []);
  
  // This component doesn't render anything visible
  return null;
};

export default MemoryOptimizer;