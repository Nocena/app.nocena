// hooks/usePermissions.ts
import { useState, useEffect, useCallback } from 'react';
import { getPermissionManager, PermissionState, IPWAPermissionManager } from '../lib/utils/permissionManager';

export function usePermissions() {
  const [permissionState, setPermissionState] = useState<PermissionState>({
    camera: 'unknown',
    microphone: 'unknown',
    notifications: 'unknown',
  });

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [permissionManager, setPermissionManager] = useState<IPWAPermissionManager | null>(null);

  // Initialize permission manager
  useEffect(() => {
    // Only initialize on client side
    if (typeof window === 'undefined') return;

    const initializePermissions = async () => {
      try {
        const manager = getPermissionManager();
        setPermissionManager(manager);

        await manager.initialize();
        setPermissionState(manager.getPermissionState());
        setIsLoading(false);
      } catch (err) {
        console.error('Failed to initialize permissions:', err);
        setError('Failed to initialize permissions');
        setIsLoading(false);
      }
    };

    initializePermissions();
  }, []);

  // Set up permission change listener
  useEffect(() => {
    if (!permissionManager) return;

    // Listen for permission changes
    const handlePermissionChange = (newState: PermissionState) => {
      setPermissionState(newState);
    };

    permissionManager.addListener(handlePermissionChange);

    return () => {
      permissionManager.removeListener(handlePermissionChange);
    };
  }, [permissionManager]);

  // Handle service worker messages
  useEffect(() => {
    if (typeof window === 'undefined' || !permissionManager) return;

    const handleServiceWorkerMessage = (event: MessageEvent) => {
      if (event.data?.type === 'SW_UPDATED' && event.data?.preservePermissions) {
        console.log('Service worker updated, preserving permissions...');
        // Small delay to allow new SW to settle
        setTimeout(() => {
          permissionManager.forceRefresh();
        }, 1000);
      }

      if (event.data?.type === 'REFRESH_PERMISSIONS') {
        console.log('Service worker requested permission refresh');
        permissionManager.forceRefresh();
      }

      if (event.data?.type === 'PERIODIC_PERMISSION_CHECK') {
        // Silent refresh for periodic checks
        permissionManager.forceRefresh();
      }

      if (event.data?.type === 'CLEANUP_MEDIA_STREAMS') {
        // Cleanup any active media streams before SW update
        setError('Please close camera and try again after app update');
      }
    };

    navigator.serviceWorker?.addEventListener('message', handleServiceWorkerMessage);

    return () => {
      navigator.serviceWorker?.removeEventListener('message', handleServiceWorkerMessage);
    };
  }, [permissionManager]);

  const requestCameraPermission = useCallback(async () => {
    if (!permissionManager) return 'error' as const;

    setError(null);
    try {
      const result = await permissionManager.requestCameraPermission();
      return result;
    } catch (err) {
      setError('Failed to request camera permission');
      return 'error' as const;
    }
  }, [permissionManager]);

  const requestMicrophonePermission = useCallback(async () => {
    if (!permissionManager) return 'error' as const;

    setError(null);
    try {
      const result = await permissionManager.requestMicrophonePermission();
      return result;
    } catch (err) {
      setError('Failed to request microphone permission');
      return 'error' as const;
    }
  }, [permissionManager]);

  const requestNotificationPermission = useCallback(async () => {
    if (!permissionManager) return 'error' as const;

    setError(null);
    try {
      const result = await permissionManager.requestNotificationPermission();
      return result;
    } catch (err) {
      setError('Failed to request notification permission');
      return 'error' as const;
    }
  }, [permissionManager]);

  const requestAllPermissions = useCallback(async () => {
    if (!permissionManager) return permissionState;

    setError(null);
    try {
      const result = await permissionManager.requestAllPermissions();
      return result;
    } catch (err) {
      setError('Failed to request permissions');
      return permissionState;
    }
  }, [permissionManager, permissionState]);

  const shouldShowPrimer = useCallback(
    (permission: 'camera' | 'microphone' | 'notifications') => {
      if (!permissionManager) return false;
      return permissionManager.shouldShowPermissionPrimer(permission);
    },
    [permissionManager],
  );

  const hasAllRequiredPermissions = useCallback(() => {
    return (
      permissionState.camera === 'granted' &&
      permissionState.microphone === 'granted' &&
      permissionState.notifications === 'granted'
    );
  }, [permissionState]);

  const hasEssentialPermissions = useCallback(() => {
    // Camera and microphone are essential for core functionality
    return permissionState.camera === 'granted' && permissionState.microphone === 'granted';
  }, [permissionState]);

  return {
    permissionState,
    isLoading,
    error,
    requestCameraPermission,
    requestMicrophonePermission,
    requestNotificationPermission,
    requestAllPermissions,
    shouldShowPrimer,
    hasAllRequiredPermissions,
    hasEssentialPermissions,
    clearError: () => setError(null),
  };
}
