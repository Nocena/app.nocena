// hooks/usePermissions.ts
import { useState, useEffect, useCallback } from 'react';
import { permissionManager, PermissionState } from '../lib/utils/permissionManager';

export function usePermissions() {
  const [permissionState, setPermissionState] = useState<PermissionState>({
    camera: 'unknown',
    microphone: 'unknown',
    notifications: 'unknown',
  });

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Initialize permission manager
  useEffect(() => {
    const initializePermissions = async () => {
      try {
        await permissionManager.initialize();
        setPermissionState(permissionManager.getPermissionState());
        setIsLoading(false);
      } catch (err) {
        console.error('Failed to initialize permissions:', err);
        setError('Failed to initialize permissions');
        setIsLoading(false);
      }
    };

    initializePermissions();

    // Listen for permission changes
    const handlePermissionChange = (newState: PermissionState) => {
      setPermissionState(newState);
    };

    permissionManager.addListener(handlePermissionChange);

    return () => {
      permissionManager.removeListener(handlePermissionChange);
    };
  }, []);

  // Handle service worker messages
  useEffect(() => {
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
  }, []);

  const requestCameraPermission = useCallback(async () => {
    setError(null);
    try {
      const result = await permissionManager.requestCameraPermission();
      return result;
    } catch (err) {
      setError('Failed to request camera permission');
      return 'error' as const;
    }
  }, []);

  const requestMicrophonePermission = useCallback(async () => {
    setError(null);
    try {
      const result = await permissionManager.requestMicrophonePermission();
      return result;
    } catch (err) {
      setError('Failed to request microphone permission');
      return 'error' as const;
    }
  }, []);

  const requestNotificationPermission = useCallback(async () => {
    setError(null);
    try {
      const result = await permissionManager.requestNotificationPermission();
      return result;
    } catch (err) {
      setError('Failed to request notification permission');
      return 'error' as const;
    }
  }, []);

  const requestAllPermissions = useCallback(async () => {
    setError(null);
    try {
      const result = await permissionManager.requestAllPermissions();
      return result;
    } catch (err) {
      setError('Failed to request permissions');
      return permissionState;
    }
  }, [permissionState]);

  const shouldShowPrimer = useCallback((permission: 'camera' | 'microphone' | 'notifications') => {
    return permissionManager.shouldShowPermissionPrimer(permission);
  }, []);

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
