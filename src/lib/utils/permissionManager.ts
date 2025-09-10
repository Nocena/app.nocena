// lib/utils/permissionManager.ts

export interface PermissionState {
  camera: 'granted' | 'denied' | 'prompt' | 'unknown';
  microphone: 'granted' | 'denied' | 'prompt' | 'unknown';
  notifications: 'granted' | 'denied' | 'prompt' | 'unknown';
}

export interface PermissionHistory {
  camera: {
    lastGranted?: number;
    lastDenied?: number;
    attempts: number;
  };
  microphone: {
    lastGranted?: number;
    lastDenied?: number;
    attempts: number;
  };
  notifications: {
    lastGranted?: number;
    lastDenied?: number;
    attempts: number;
  };
}

export class PWAPermissionManager {
  private static instance: PWAPermissionManager;
  private permissionState: PermissionState;
  private permissionHistory: PermissionHistory;
  private listeners: Array<(state: PermissionState) => void> = [];
  private isInitialized = false;

  private constructor() {
    this.permissionState = {
      camera: 'unknown',
      microphone: 'unknown',
      notifications: 'unknown',
    };
    this.permissionHistory = this.loadPermissionHistory();
  }

  public static getInstance(): PWAPermissionManager {
    if (!PWAPermissionManager.instance) {
      PWAPermissionManager.instance = new PWAPermissionManager();
    }
    return PWAPermissionManager.instance;
  }

  /**
   * Initialize permission manager - call this early in app lifecycle
   */
  public async initialize(): Promise<void> {
    if (this.isInitialized) return;

    console.log('🔐 Initializing PWA Permission Manager...');

    // Check all permissions without triggering prompts
    await this.checkAllPermissions();

    // Set up permission change listeners
    this.setupPermissionListeners();

    // Handle service worker updates
    this.handleServiceWorkerUpdates();

    this.isInitialized = true;
    console.log('✅ Permission Manager initialized');
  }

  /**
   * Check all permissions status without triggering prompts
   */
  private async checkAllPermissions(): Promise<void> {
    const newState: PermissionState = {
      camera: await this.checkCameraPermission(),
      microphone: await this.checkMicrophonePermission(),
      notifications: await this.checkNotificationPermission(),
    };

    this.updatePermissionState(newState);
  }

  /**
   * Check camera permission using multiple fallback methods
   */
  private async checkCameraPermission(): Promise<PermissionState['camera']> {
    try {
      // Method 1: Try Permissions API (Chrome/Edge support)
      if ('permissions' in navigator && navigator.permissions.query) {
        try {
          const result = await navigator.permissions.query({ name: 'camera' as PermissionName });
          if (result.state !== 'prompt') {
            return result.state as 'granted' | 'denied';
          }
        } catch (error) {
          console.log('Permissions API not supported for camera');
        }
      }

      // Method 2: Try enumerateDevices (works if permission previously granted)
      if (navigator.mediaDevices && navigator.mediaDevices.enumerateDevices) {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = devices.filter((device) => device.kind === 'videoinput');

        // If we have device labels, permission was granted
        if (videoDevices.length > 0 && videoDevices[0].label) {
          return 'granted';
        }
      }

      // Method 3: Check localStorage history
      const history = this.permissionHistory.camera;
      if (history.lastGranted && Date.now() - history.lastGranted < 24 * 60 * 60 * 1000) {
        return 'granted'; // Assume still granted if granted within 24h
      }

      return 'prompt';
    } catch (error) {
      console.error('Error checking camera permission:', error);
      return 'unknown';
    }
  }

  /**
   * Check microphone permission using multiple fallback methods
   */
  private async checkMicrophonePermission(): Promise<PermissionState['microphone']> {
    try {
      // Method 1: Try Permissions API
      if ('permissions' in navigator && navigator.permissions.query) {
        try {
          const result = await navigator.permissions.query({ name: 'microphone' as PermissionName });
          if (result.state !== 'prompt') {
            return result.state as 'granted' | 'denied';
          }
        } catch (error) {
          console.log('Permissions API not supported for microphone');
        }
      }

      // Method 2: Try enumerateDevices
      if (navigator.mediaDevices && navigator.mediaDevices.enumerateDevices) {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const audioDevices = devices.filter((device) => device.kind === 'audioinput');

        if (audioDevices.length > 0 && audioDevices[0].label) {
          return 'granted';
        }
      }

      // Method 3: Check localStorage history
      const history = this.permissionHistory.microphone;
      if (history.lastGranted && Date.now() - history.lastGranted < 24 * 60 * 60 * 1000) {
        return 'granted';
      }

      return 'prompt';
    } catch (error) {
      console.error('Error checking microphone permission:', error);
      return 'unknown';
    }
  }

  /**
   * Check notification permission (most reliable across browsers)
   */
  private async checkNotificationPermission(): Promise<PermissionState['notifications']> {
    try {
      if ('Notification' in window) {
        const permission = Notification.permission;
        if (permission === 'default') return 'prompt';
        return permission as 'granted' | 'denied';
      }
      return 'unknown';
    } catch (error) {
      console.error('Error checking notification permission:', error);
      return 'unknown';
    }
  }

  /**
   * Request camera permission with proper error handling
   */
  public async requestCameraPermission(): Promise<'granted' | 'denied' | 'error'> {
    try {
      console.log('📷 Requesting camera permission...');

      // iOS specific handling - request camera only first
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);

      let constraints: MediaStreamConstraints;
      if (isIOS) {
        // On iOS, request camera first, then microphone separately
        constraints = { video: true, audio: false };
      } else {
        // On other platforms, request both together
        constraints = {
          video: { facingMode: 'environment' },
          audio: true,
        };
      }

      const stream = await navigator.mediaDevices.getUserMedia(constraints);

      // Clean up stream immediately
      stream.getTracks().forEach((track) => track.stop());

      // Update history
      this.permissionHistory.camera.lastGranted = Date.now();
      this.permissionHistory.camera.attempts += 1;
      this.savePermissionHistory();

      // Update state
      await this.checkAllPermissions();

      console.log('✅ Camera permission granted');
      return 'granted';
    } catch (error: any) {
      console.error('❌ Camera permission denied:', error);

      this.permissionHistory.camera.lastDenied = Date.now();
      this.permissionHistory.camera.attempts += 1;
      this.savePermissionHistory();

      if (error.name === 'NotAllowedError') {
        await this.checkAllPermissions();
        return 'denied';
      }

      return 'error';
    }
  }

  /**
   * Request microphone permission separately (for iOS compatibility)
   */
  public async requestMicrophonePermission(): Promise<'granted' | 'denied' | 'error'> {
    try {
      console.log('🎤 Requesting microphone permission...');

      const stream = await navigator.mediaDevices.getUserMedia({
        video: false,
        audio: true,
      });

      stream.getTracks().forEach((track) => track.stop());

      this.permissionHistory.microphone.lastGranted = Date.now();
      this.permissionHistory.microphone.attempts += 1;
      this.savePermissionHistory();

      await this.checkAllPermissions();

      console.log('✅ Microphone permission granted');
      return 'granted';
    } catch (error: any) {
      console.error('❌ Microphone permission denied:', error);

      this.permissionHistory.microphone.lastDenied = Date.now();
      this.permissionHistory.microphone.attempts += 1;
      this.savePermissionHistory();

      if (error.name === 'NotAllowedError') {
        await this.checkAllPermissions();
        return 'denied';
      }

      return 'error';
    }
  }

  /**
   * Request notification permission
   */
  public async requestNotificationPermission(): Promise<'granted' | 'denied' | 'error'> {
    try {
      console.log('🔔 Requesting notification permission...');

      if (!('Notification' in window)) {
        return 'error';
      }

      const permission = await Notification.requestPermission();

      if (permission === 'granted') {
        this.permissionHistory.notifications.lastGranted = Date.now();
      } else {
        this.permissionHistory.notifications.lastDenied = Date.now();
      }

      this.permissionHistory.notifications.attempts += 1;
      this.savePermissionHistory();

      await this.checkAllPermissions();

      console.log(`✅ Notification permission: ${permission}`);
      return permission === 'granted' ? 'granted' : 'denied';
    } catch (error) {
      console.error('❌ Notification permission error:', error);
      return 'error';
    }
  }

  /**
   * Request all permissions in the optimal order for the platform
   */
  public async requestAllPermissions(): Promise<PermissionState> {
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);

    if (isIOS) {
      // iOS: Request permissions separately to avoid issues
      await this.requestCameraPermission();
      await this.requestMicrophonePermission();
      await this.requestNotificationPermission();
    } else {
      // Other platforms: Can request camera+mic together
      try {
        // Try to request camera and microphone together
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });
        stream.getTracks().forEach((track) => track.stop());

        // Update history for both
        this.permissionHistory.camera.lastGranted = Date.now();
        this.permissionHistory.microphone.lastGranted = Date.now();
        this.savePermissionHistory();
      } catch (error) {
        // Fallback to individual requests
        await this.requestCameraPermission();
        await this.requestMicrophonePermission();
      }

      await this.requestNotificationPermission();
    }

    // Re-check all permissions
    await this.checkAllPermissions();
    return this.permissionState;
  }

  /**
   * Set up permission change listeners
   */
  private setupPermissionListeners(): void {
    // Listen for permission changes using Permissions API where supported
    if ('permissions' in navigator) {
      ['camera', 'microphone', 'notifications'].forEach(async (permission) => {
        try {
          const result = await navigator.permissions.query({ name: permission as PermissionName });
          result.addEventListener('change', () => {
            console.log(`🔄 ${permission} permission changed to: ${result.state}`);
            this.checkAllPermissions();
          });
        } catch (error) {
          // Permission not supported in Permissions API
        }
      });
    }

    // Listen for visibility changes (iOS Safari)
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) {
        // Re-check permissions when app becomes visible
        setTimeout(() => this.checkAllPermissions(), 1000);
      }
    });

    // Listen for focus events
    window.addEventListener('focus', () => {
      setTimeout(() => this.checkAllPermissions(), 1000);
    });
  }

  /**
   * Handle service worker updates that might reset permissions
   */
  private handleServiceWorkerUpdates(): void {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data && event.data.type === 'SW_UPDATED') {
          console.log('🔄 Service worker updated, re-checking permissions...');
          // Delay to allow page to settle
          setTimeout(() => this.checkAllPermissions(), 2000);
        }
      });
    }
  }

  /**
   * Get current permission state
   */
  public getPermissionState(): PermissionState {
    return { ...this.permissionState };
  }

  /**
   * Get permission history
   */
  public getPermissionHistory(): PermissionHistory {
    return { ...this.permissionHistory };
  }

  /**
   * Add listener for permission state changes
   */
  public addListener(callback: (state: PermissionState) => void): void {
    this.listeners.push(callback);
  }

  /**
   * Remove listener
   */
  public removeListener(callback: (state: PermissionState) => void): void {
    const index = this.listeners.indexOf(callback);
    if (index > -1) {
      this.listeners.splice(index, 1);
    }
  }

  /**
   * Update permission state and notify listeners
   */
  private updatePermissionState(newState: PermissionState): void {
    const hasChanged = JSON.stringify(this.permissionState) !== JSON.stringify(newState);

    this.permissionState = newState;

    if (hasChanged) {
      console.log('🔄 Permission state updated:', newState);
      this.listeners.forEach((callback) => callback(newState));
    }
  }

  /**
   * Load permission history from storage
   */
  private loadPermissionHistory(): PermissionHistory {
    try {
      const stored = localStorage.getItem('nocena_permission_history');
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.error('Error loading permission history:', error);
    }

    return {
      camera: { attempts: 0 },
      microphone: { attempts: 0 },
      notifications: { attempts: 0 },
    };
  }

  /**
   * Save permission history to storage
   */
  private savePermissionHistory(): void {
    try {
      localStorage.setItem('nocena_permission_history', JSON.stringify(this.permissionHistory));
    } catch (error) {
      console.error('Error saving permission history:', error);
    }
  }

  /**
   * Check if we should show permission primer
   */
  public shouldShowPermissionPrimer(permission: 'camera' | 'microphone' | 'notifications'): boolean {
    const history = this.permissionHistory[permission];
    const state = this.permissionState[permission];

    // Show primer if:
    // 1. Permission is in prompt state
    // 2. AND (first time OR last attempt was > 24h ago)
    if (state !== 'prompt') return false;

    if (history.attempts === 0) return true;

    const lastAttempt = Math.max(history.lastGranted || 0, history.lastDenied || 0);
    const dayAgo = Date.now() - 24 * 60 * 60 * 1000;

    return lastAttempt < dayAgo;
  }

  /**
   * Force refresh all permissions (for debugging)
   */
  public async forceRefresh(): Promise<void> {
    console.log('🔄 Force refreshing all permissions...');
    await this.checkAllPermissions();
  }
}

// Export singleton instance
export const permissionManager = PWAPermissionManager.getInstance();
