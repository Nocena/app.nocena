// src/lib/pushNotifications.ts - Enhanced Push notification utilities with device sync

/**
 * Check if push notifications are supported
 */
export const isPushNotificationSupported = (): boolean => {
  return 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
};

/**
 * Request notification permission from user
 */
export const requestNotificationPermission = async (): Promise<NotificationPermission> => {
  if (!isPushNotificationSupported()) {
    console.log('Push notifications not supported');
    return 'denied';
  }

  if (Notification.permission === 'granted') {
    return 'granted';
  }

  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    return permission;
  }

  return Notification.permission;
};

/**
 * Register service worker and ensure it's ready
 */
export const registerServiceWorker = async (): Promise<ServiceWorkerRegistration | null> => {
  if (!('serviceWorker' in navigator)) {
    console.log('Service workers not supported');
    return null;
  }

  try {
    // Register the main service worker
    const registration = await navigator.serviceWorker.register('/sw.js', {
      scope: '/',
    });

    console.log('Service worker registered:', registration);

    // Wait for the service worker to be ready
    await navigator.serviceWorker.ready;

    return registration;
  } catch (error) {
    console.error('Service worker registration failed:', error);
    return null;
  }
};

/**
 * Get current device's push subscription
 */
export const getCurrentDeviceSubscription = async (): Promise<string | null> => {
  if (!isPushNotificationSupported()) {
    console.log('Push notifications not supported');
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();

    return subscription ? JSON.stringify(subscription) : null;
  } catch (error) {
    console.error('Error getting current device subscription:', error);
    return null;
  }
};

/**
 * Compare two push subscriptions to see if they match
 */
export const subscriptionsMatch = (sub1: string | null, sub2: string | null): boolean => {
  if (!sub1 || !sub2) return false;

  try {
    const parsed1 = JSON.parse(sub1);
    const parsed2 = JSON.parse(sub2);

    // Compare the endpoint which is unique per device/browser
    return parsed1.endpoint === parsed2.endpoint;
  } catch (error) {
    console.error('Error comparing subscriptions:', error);
    return false;
  }
};

/**
 * Get user's stored push subscription from database
 */
export const getUserStoredSubscription = async (userId: string): Promise<string | null> => {
  try {
    const query = `
      query GetUserPushSubscription($userId: String!) {
        getUser(id: $userId) {
          pushSubscription
        }
      }
    `;

    const response = await fetch(process.env.NEXT_PUBLIC_DGRAPH_ENDPOINT!, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(process.env.NEXT_PUBLIC_DGRAPH_API_KEY && {
          'X-Auth-Token': process.env.NEXT_PUBLIC_DGRAPH_API_KEY,
        }),
      },
      body: JSON.stringify({
        query,
        variables: { userId },
      }),
    });

    const data = await response.json();

    if (data.errors) {
      console.error('Error fetching user push subscription:', data.errors);
      return null;
    }

    return data.data?.getUser?.pushSubscription || null;
  } catch (error) {
    console.error('Network error fetching user push subscription:', error);
    return null;
  }
};

/**
 * Check if current device subscription matches what's stored in database
 */
export const checkSubscriptionSync = async (
  userId: string,
): Promise<{
  isInSync: boolean;
  currentDeviceSubscription: string | null;
  storedSubscription: string | null;
  needsUpdate: boolean;
}> => {
  console.log('🔔 SYNC: Checking subscription sync for user:', userId);

  try {
    // Get current device subscription
    const currentDeviceSubscription = await getCurrentDeviceSubscription();
    console.log('🔔 SYNC: Current device subscription:', currentDeviceSubscription ? 'EXISTS' : 'NONE');

    // Get stored subscription from database
    const storedSubscription = await getUserStoredSubscription(userId);
    console.log('🔔 SYNC: Stored subscription:', storedSubscription ? 'EXISTS' : 'NONE');

    // Compare subscriptions
    const isInSync = subscriptionsMatch(currentDeviceSubscription, storedSubscription);
    const needsUpdate = !isInSync && currentDeviceSubscription !== null;

    console.log('🔔 SYNC: Sync status:', {
      isInSync,
      needsUpdate,
      hasCurrentDevice: !!currentDeviceSubscription,
      hasStored: !!storedSubscription,
    });

    return {
      isInSync,
      currentDeviceSubscription,
      storedSubscription,
      needsUpdate,
    };
  } catch (error) {
    console.error('🔔 SYNC: Error checking subscription sync:', error);
    return {
      isInSync: false,
      currentDeviceSubscription: null,
      storedSubscription: null,
      needsUpdate: false,
    };
  }
};

/**
 * Subscribe to push notifications and sync with database
 */
export const subscribeToPushNotifications = async (userId?: string): Promise<string | null> => {
  if (!isPushNotificationSupported()) {
    console.log('Push notifications not supported');
    return null;
  }

  try {
    // First request permission
    const permission = await requestNotificationPermission();
    if (permission !== 'granted') {
      console.log('Notification permission denied');
      return null;
    }

    // Register service worker
    const registration = await registerServiceWorker();
    if (!registration) {
      console.log('Service worker registration failed');
      return null;
    }

    // Wait for service worker to be ready
    await navigator.serviceWorker.ready;

    // Check if already subscribed
    const existingSubscription = await registration.pushManager.getSubscription();

    let subscription = existingSubscription;

    if (!subscription) {
      // Get VAPID key from environment
      const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!vapidPublicKey) {
        console.error('VAPID public key not configured');
        return null;
      }

      // Subscribe to push notifications
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
      });

      console.log('🔔 NEW: Created new push subscription');
    } else {
      console.log('🔔 EXISTING: Using existing push subscription');
    }

    const subscriptionString = JSON.stringify(subscription);

    // If userId provided, sync with database
    if (userId) {
      const syncResult = await syncSubscriptionWithDatabase(userId, subscriptionString);
      if (!syncResult) {
        console.warn('🔔 SYNC: Failed to sync subscription with database');
      }
    }

    return subscriptionString;
  } catch (error) {
    console.error('Error subscribing to push notifications:', error);
    return null;
  }
};

/**
 * Sync current device subscription with database
 */
export const syncSubscriptionWithDatabase = async (
  userId: string,
  deviceSubscription?: string | null,
): Promise<boolean> => {
  console.log('🔔 SYNC: Starting subscription sync for user:', userId);

  try {
    // Get device subscription if not provided
    const currentSubscription = deviceSubscription || (await getCurrentDeviceSubscription());

    if (!currentSubscription) {
      console.log('🔔 SYNC: No device subscription to sync');
      return false;
    }

    // Check current sync status
    const syncStatus = await checkSubscriptionSync(userId);

    if (syncStatus.isInSync) {
      console.log('🔔 SYNC: Subscriptions already in sync');
      return true;
    }

    if (syncStatus.needsUpdate) {
      console.log('🔔 SYNC: Updating database with current device subscription');
      return await updateUserPushSubscription(userId, currentSubscription);
    }

    return false;
  } catch (error) {
    console.error('🔔 SYNC: Error syncing subscription:', error);
    return false;
  }
};

/**
 * Initialize push notifications with automatic sync
 */
export const initializePushNotifications = async (
  userId: string,
): Promise<{
  success: boolean;
  subscription: string | null;
  wasUpdated: boolean;
  error?: string;
}> => {
  console.log('🔔 INIT: Initializing push notifications for user:', userId);

  try {
    // Check if notifications are supported
    if (!isPushNotificationSupported()) {
      return {
        success: false,
        subscription: null,
        wasUpdated: false,
        error: 'Push notifications not supported on this device',
      };
    }

    // Check current permission status
    if (Notification.permission === 'denied') {
      return {
        success: false,
        subscription: null,
        wasUpdated: false,
        error: 'Notification permission was denied',
      };
    }

    // Get or create subscription
    const subscription = await subscribeToPushNotifications(userId);

    if (!subscription) {
      return {
        success: false,
        subscription: null,
        wasUpdated: false,
        error: 'Failed to create push subscription',
      };
    }

    // Check if database was updated during subscription process
    const syncStatus = await checkSubscriptionSync(userId);

    return {
      success: true,
      subscription,
      wasUpdated: !syncStatus.isInSync,
    };
  } catch (error) {
    console.error('🔔 INIT: Error initializing push notifications:', error);
    return {
      success: false,
      subscription: null,
      wasUpdated: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
};

/**
 * Unsubscribe from push notifications and update database
 */
export const unsubscribeFromPushNotifications = async (userId?: string): Promise<boolean> => {
  if (!isPushNotificationSupported()) {
    return false;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();

    if (subscription) {
      const successful = await subscription.unsubscribe();
      console.log('Unsubscribed from push notifications:', successful);

      // Update database if userId provided
      if (userId && successful) {
        await updateUserPushSubscription(userId, null);
      }

      return successful;
    }

    return true;
  } catch (error) {
    console.error('Error unsubscribing from push notifications:', error);
    return false;
  }
};

/**
 * Get current push subscription
 */
export const getCurrentPushSubscription = async (): Promise<string | null> => {
  return getCurrentDeviceSubscription();
};

/**
 * Check service worker version and handle updates
 */
export const checkForServiceWorkerUpdate = async (): Promise<string | null> => {
  if (!('serviceWorker' in navigator)) {
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.getRegistration('/');
    if (registration) {
      // Force check for updates
      await registration.update();

      // Get current version from service worker
      return new Promise((resolve) => {
        const messageChannel = new MessageChannel();
        messageChannel.port1.onmessage = (event) => {
          resolve(event.data.version || null);
        };

        if (registration.active) {
          registration.active.postMessage({ type: 'GET_VERSION' }, [messageChannel.port2]);
        } else {
          resolve(null);
        }
      });
    }
    return null;
  } catch (error) {
    console.error('Error checking service worker version:', error);
    return null;
  }
};

/**
 * Force service worker update
 */
export const forceServiceWorkerUpdate = async (): Promise<boolean> => {
  if (!('serviceWorker' in navigator)) {
    return false;
  }

  try {
    const registration = await navigator.serviceWorker.getRegistration('/');
    if (registration) {
      await registration.update();

      // Send skip waiting message to new service worker
      if (registration.waiting) {
        registration.waiting.postMessage({ type: 'SKIP_WAITING' });
        return true;
      }
    }
    return false;
  } catch (error) {
    console.error('Error forcing service worker update:', error);
    return false;
  }
};

/**
 * Listen for service worker updates
 */
export const onServiceWorkerUpdate = (callback: (version: string) => void): (() => void) => {
  if (!('serviceWorker' in navigator)) {
    return () => {};
  }

  const handleMessage = (event: MessageEvent) => {
    if (event.data && event.data.type === 'SW_UPDATED') {
      callback(event.data.version);
    }
  };

  navigator.serviceWorker.addEventListener('message', handleMessage);

  // Return cleanup function
  return () => {
    navigator.serviceWorker.removeEventListener('message', handleMessage);
  };
};

/**
 * Convert VAPID key to Uint8Array
 */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

/**
 * Show a test notification (for debugging)
 */
export const showTestNotification = async (): Promise<void> => {
  const permission = await requestNotificationPermission();

  if (permission === 'granted') {
    new Notification('🎯 Nocena Test', {
      body: 'Push notifications are working!',
      icon: '/icons/icon-192x192.png',
      badge: '/icons/icon-192x192.png',
    });
  }
};

/**
 * Update user's push subscription in the database
 */
export const updateUserPushSubscription = async (userId: string, subscription: string | null): Promise<boolean> => {
  try {
    const mutation = `
        mutation UpdateUserPushSubscription($userId: String!, $subscription: String) {
          updateUser(input: { 
            filter: { id: { eq: $userId } }, 
            set: { pushSubscription: $subscription } 
          }) {
            user {
              id
              pushSubscription
            }
          }
        }
      `;

    const response = await fetch(process.env.NEXT_PUBLIC_DGRAPH_ENDPOINT!, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(process.env.NEXT_PUBLIC_DGRAPH_API_KEY && {
          'X-Auth-Token': process.env.NEXT_PUBLIC_DGRAPH_API_KEY,
        }),
      },
      body: JSON.stringify({
        query: mutation,
        variables: { userId, subscription },
      }),
    });

    const data = await response.json();

    if (data.errors) {
      console.error('Error updating push subscription:', data.errors);
      return false;
    }

    console.log('🔔 DB: Push subscription updated successfully');
    return true;
  } catch (error) {
    console.error('Network error updating push subscription:', error);
    return false;
  }
};

/**
 * Get notification status for UI display
 */
export const getNotificationStatus = async (
  userId?: string,
): Promise<{
  permission: NotificationPermission;
  isSubscribed: boolean;
  isInSync: boolean;
  needsUpdate: boolean;
}> => {
  const permission = Notification.permission;

  if (!isPushNotificationSupported() || permission === 'denied') {
    return {
      permission,
      isSubscribed: false,
      isInSync: false,
      needsUpdate: false,
    };
  }

  const currentSubscription = await getCurrentDeviceSubscription();
  const isSubscribed = !!currentSubscription;

  if (!userId || !isSubscribed) {
    return {
      permission,
      isSubscribed,
      isInSync: !userId, // If no userId, we can't check sync
      needsUpdate: false,
    };
  }

  const syncStatus = await checkSubscriptionSync(userId);

  return {
    permission,
    isSubscribed,
    isInSync: syncStatus.isInSync,
    needsUpdate: syncStatus.needsUpdate,
  };
};
