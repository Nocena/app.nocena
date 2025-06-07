// pages/inbox/index.tsx
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { fetchNotifications } from '../../lib/api/dgraph';
import NotificationFollower from './notifications/NotificationFollower';
import NotificationChallenge from './notifications/NotificationChallenge';
import NotificationInviteReward from './notifications/NotificationInviteReward';
import { getPageState, updatePageState } from '../../components/PageManager';

// Performance debugging - global timer for overall page load
const startTime = Date.now();
console.log(`[PERF] InboxView started initializing at ${new Date().toISOString()}`);

// Type definitions for notifications
interface NotificationBase {
  id: string;
  content?: string;
  createdAt: string;
  notificationType: string;
  triggeredBy?: {
    id?: string;
    username?: string;
    profilePicture?: string;
  };
  reward?: number;
  // Add challenge reference properties
  privateChallenge?: {
    id: string;
    title: string;
    description: string;
  };
  publicChallenge?: {
    id: string;
    title: string;
    description: string;
  };
  aiChallenge?: {
    id: string;
    title: string;
    description: string;
    frequency: string;
  };
}

// Skeleton component for loading states
const NotificationSkeleton = () => (
  <div className="w-full bg-[#1A2734] rounded-lg p-4 animate-pulse">
    <div className="flex items-center space-x-4">
      <div className="h-12 w-12 bg-gray-700 rounded-full"></div>
      <div className="flex-1">
        <div className="h-4 bg-gray-700 rounded w-3/4 mb-2"></div>
        <div className="h-3 bg-gray-700 rounded w-1/2"></div>
      </div>
    </div>
  </div>
);

// Empty state component
const EmptyState = () => (
  <div className="flex flex-col items-center justify-center py-10 text-center">
    <div className="text-gray-400 mb-2">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-12 w-12 mx-auto mb-4"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
        />
      </svg>
      <p>No notifications yet</p>
    </div>
  </div>
);

// Pull-to-refresh spinner
const PullToRefreshSpinner = () => (
  <div className="w-full flex justify-center items-center py-3">
    <div className="animate-spin rounded-full h-5 w-5 border-2 border-blue-500 border-t-transparent"></div>
  </div>
);

// Custom event type for PageVisibilityChange
interface CustomVisibilityEvent extends CustomEvent {
  detail: {
    pageName: string;
    isVisible: boolean;
  };
}

// Custom event type for RouteChange
interface CustomRouteEvent extends CustomEvent {
  detail: {
    from: string;
    to: string;
  };
}

const InboxView = () => {
  console.time('inbox-render-total');
  console.log(`[PERF] InboxView component function started at ${Date.now() - startTime}ms`);

  // Debug PageManager state on initialization
  console.log('[PERF] Initial PageManager state:', getPageState());
  if (getPageState()?.notifications?.data) {
    console.log(
      '[PERF] Found notifications in PageManager:',
      getPageState().notifications.data.length,
      'Last fetched:',
      new Date(getPageState().notifications.lastFetched).toLocaleString(),
    );
  }

  const { user, isAuthenticated } = useAuth();
  // Start with loading true for immediate skeleton display
  const [notifications, setNotifications] = useState<NotificationBase[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isVisible, setIsVisible] = useState(true);
  const [initialRenderComplete, setInitialRenderComplete] = useState(false);
  const [isPulling, setIsPulling] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const contentRef = useRef<HTMLDivElement>(null);
  const startY = useRef(0);
  const currentY = useRef(0);
  const pulling = useRef(false);
  const dataFetchedRef = useRef(false);

  // Monitor component lifecycle
  useEffect(() => {
    console.log(`[PERF] InboxView mounted at ${new Date().toLocaleTimeString()}`);
    return () => {
      console.log(`[PERF] InboxView unmounted at ${new Date().toLocaleTimeString()}`);
    };
  }, []);

  // Register page visibility event listeners for PageManager
  useEffect(() => {
    console.time('visibility-setup');

    const handlePageVisibility = (event: Event) => {
      const customEvent = event as CustomVisibilityEvent;
      if (customEvent.detail && customEvent.detail.pageName === 'inbox') {
        console.log(`[PERF] Inbox visibility changed to: ${customEvent.detail.isVisible}`);
        setIsVisible(customEvent.detail.isVisible);
      }
    };

    const handleRouteChange = (event: Event) => {
      const customEvent = event as CustomRouteEvent;
      if (customEvent.detail) {
        console.log(`[PERF] Route changed: ${customEvent.detail.from} -> ${customEvent.detail.to}`);
        if (customEvent.detail.to === '/inbox') {
          setIsVisible(true);

          // Mark that user has viewed notifications when navigating to inbox
          localStorage.setItem('nocena_last_notification_view', Date.now().toString());
        } else if (customEvent.detail.from === '/inbox') {
          setIsVisible(false);
        }
      }
    };

    window.addEventListener('pageVisibilityChange', handlePageVisibility);
    window.addEventListener('routeChange', handleRouteChange);

    // Initialize visibility based on current route
    setIsVisible(window.location.pathname === '/inbox');

    console.timeEnd('visibility-setup');

    return () => {
      window.removeEventListener('pageVisibilityChange', handlePageVisibility);
      window.removeEventListener('routeChange', handleRouteChange);
    };
  }, []);

  // First load - check for cached data in PageManager and localStorage
  useEffect(() => {
    console.time('initial-data-load');

    // Mark initial render as complete immediately
    setInitialRenderComplete(true);

    try {
      console.time('cache-check');
      // First try PageManager state
      const pageState = getPageState();
      if (pageState && pageState.notifications) {
        const { data, lastFetched } = pageState.notifications;

        // Only use data if it's not too old (5 minutes)
        if (data && data.length > 0 && Date.now() - lastFetched < 300000) {
          console.log('[PERF] Using cached notifications from PageManager');
          setNotifications(data as NotificationBase[]);
          setIsLoading(false); // Stop loading immediately when we have cached data
          dataFetchedRef.current = true;
        }
      } else {
        // Try localStorage if PageManager doesn't have data
        console.time('localStorage-read');
        const cachedData = localStorage.getItem('nocena_cached_notifications');
        console.timeEnd('localStorage-read');

        if (cachedData) {
          console.time('localStorage-parse');
          const { data, timestamp } = JSON.parse(cachedData);
          console.timeEnd('localStorage-parse');

          if (Date.now() - timestamp < 300000) {
            console.log('[PERF] Using cached notifications from localStorage');
            setNotifications(data);
            setIsLoading(false); // Stop loading immediately when we have cached data
            dataFetchedRef.current = true;

            // Also update PageManager state
            console.time('update-page-state');
            updatePageState('notifications', data);
            console.timeEnd('update-page-state');
          }
        }
      }
      console.timeEnd('cache-check');
    } catch (error) {
      console.error('[PERF] Failed to load cached notifications', error);
    }

    console.timeEnd('initial-data-load');
    console.timeEnd('inbox-render-total');
  }, []);

  // Function to fetch notifications
  const fetchUserNotifications = useCallback(
    async (showLoadingState = true) => {
      if (!user?.id) {
        console.log('[PERF] fetchUserNotifications aborted - no user ID');
        return;
      }

      console.time('fetch-notifications-total');

      if (showLoadingState && !dataFetchedRef.current) {
        setIsLoading(true);
      }

      try {
        console.time('network-request');
        console.log('[PERF] Starting API request to fetch notifications');
        const fetchedNotifications = await fetchNotifications(user.id);
        console.timeEnd('network-request');
        console.log(`[PERF] API returned ${fetchedNotifications.length} notifications`);

        console.time('process-notifications');
        // Sort notifications by createdAt date (newest first)
        const sortedNotifications = [...fetchedNotifications].sort((a, b) => {
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        });

        setNotifications(sortedNotifications);
        setIsLoading(false);
        dataFetchedRef.current = true;
        console.timeEnd('process-notifications');

        // Update both PageManager state and localStorage cache
        console.time('update-state');
        updatePageState('notifications', sortedNotifications);

        try {
          localStorage.setItem(
            'nocena_cached_notifications',
            JSON.stringify({
              data: sortedNotifications,
              timestamp: Date.now(),
            }),
          );
        } catch (storageError) {
          console.error('[PERF] LocalStorage write failed', storageError);
        }

        // Mark notifications as viewed
        localStorage.setItem('nocena_last_notification_view', Date.now().toString());
        console.timeEnd('update-state');
      } catch (error) {
        console.error('[PERF] Failed to load notifications', error);
        setIsLoading(false);
      } finally {
        if (showLoadingState) setIsLoading(false);
        setIsPulling(false);
        setPullDistance(0);
        console.timeEnd('fetch-notifications-total');
      }
    },
    [user?.id],
  );

  // Handle data fetching based on component visibility and data freshness
  useEffect(() => {
    if (!user?.id || !initialRenderComplete) {
      console.log(`[PERF] Data fetch check skipped - user: ${!!user?.id}, initialRender: ${initialRenderComplete}`);
      return;
    }

    console.time('should-fetch-check');
    // Get the most recent data timestamp
    const pageState = getPageState();
    const lastFetched = pageState?.notifications?.lastFetched || 0;

    const shouldFetch =
      notifications.length === 0 || // No data
      Date.now() - lastFetched > 60000 || // Data is older than 1 minute
      (isVisible && Date.now() - lastFetched > 30000); // Page is visible and data older than 30 seconds

    console.log(`[PERF] Should fetch data: ${shouldFetch}`, {
      notificationsLength: notifications.length,
      lastFetchedAge: Date.now() - lastFetched,
      isVisible,
    });

    if (shouldFetch) {
      // Only show loading indicator if we have no data yet
      fetchUserNotifications(notifications.length === 0);
    }
    console.timeEnd('should-fetch-check');
  }, [user?.id, isVisible, notifications.length, initialRenderComplete, fetchUserNotifications]);

  // Set up background refresh when page is visible
  useEffect(() => {
    if (!isVisible || !user?.id) return;

    console.log('[PERF] Setting up background refresh interval');

    // Use number type for interval ID
    const intervalId: number = window.setInterval(() => {
      console.log('[PERF] Background refresh triggered');
      fetchUserNotifications(false); // Silent background refresh
    }, 30000); // Check every 30 seconds when visible

    // Add to tracking for memory optimization
    if (typeof window !== 'undefined' && window.nocena_app_timers) {
      window.nocena_app_timers.push(intervalId);
    }

    return () => window.clearInterval(intervalId);
  }, [isVisible, user?.id, fetchUserNotifications]);

  // Listen for app foreground/background events
  useEffect(() => {
    const handleAppForeground = () => {
      console.log('[PERF] App came to foreground');
      if (isVisible && user?.id) {
        // Refresh data when app comes to foreground and this page is visible
        fetchUserNotifications(false);
      }
    };

    window.addEventListener('nocena_app_foreground', handleAppForeground);

    return () => {
      window.removeEventListener('nocena_app_foreground', handleAppForeground);
    };
  }, [isVisible, user?.id, fetchUserNotifications]);

  // Setup pull-to-refresh functionality
  useEffect(() => {
    if (!contentRef.current) return;

    console.log('[PERF] Setting up pull-to-refresh handlers');
    const container = contentRef.current;

    const handleTouchStart = (e: TouchEvent) => {
      // Only enable pull-to-refresh when scrolled to top
      if (container.scrollTop <= 0) {
        startY.current = e.touches[0].clientY;
        pulling.current = true;
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!pulling.current) return;

      currentY.current = e.touches[0].clientY;
      const pullDist = Math.max(0, currentY.current - startY.current);

      // Resistance factor - the pull distance isn't 1:1 with finger movement
      const resistance = 0.4;
      const displayDistance = Math.round(pullDist * resistance);

      if (displayDistance > 0) {
        e.preventDefault(); // Prevent default scrolling
        setPullDistance(displayDistance);

        // Show visual indicator when pulled enough to refresh
        if (displayDistance > 60) {
          setIsPulling(true);
        }
      }
    };

    const handleTouchEnd = () => {
      if (!pulling.current) return;

      // If pulled far enough, trigger refresh
      if (pullDistance > 60) {
        fetchUserNotifications(true);
      } else {
        // Reset pull state
        setIsPulling(false);
        setPullDistance(0);
      }

      pulling.current = false;
    };

    container.addEventListener('touchstart', handleTouchStart, { passive: true });
    container.addEventListener('touchmove', handleTouchMove, { passive: false });
    container.addEventListener('touchend', handleTouchEnd);

    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
    };
  }, [pullDistance, fetchUserNotifications]);

  // Helper function to determine reward amount based on notification type
  const getRewardForNotification = (notification: NotificationBase) => {
    // Default reward
    let reward = 10;

    // Try to get reward from challenge if available
    if (notification.privateChallenge) {
      // Assume private challenges have a standard reward of 15
      reward = 15;
    } else if (notification.publicChallenge) {
      // Assume public challenges have a standard reward of 20
      reward = 20;
    } else if (notification.aiChallenge) {
      // Assign reward based on frequency
      switch (notification.aiChallenge.frequency) {
        case 'daily':
          reward = 5;
          break;
        case 'weekly':
          reward = 15;
          break;
        case 'monthly':
          reward = 25;
          break;
        default:
          reward = 10;
      }
    }

    return reward;
  };

  // Memoize notification rendering to prevent unnecessary re-renders
  const notificationList = useMemo(() => {
    console.time('render-notification-list');
    const result = notifications.map((notification) => {
      // Handle invite reward notifications
      if (notification.notificationType === 'invite_used') {
        return (
          <NotificationInviteReward
            key={notification.id}
            friendUsername={notification.triggeredBy?.username ?? 'Unknown'}
            friendProfilePicture={notification.triggeredBy?.profilePicture ?? '/images/profile.png'}
            friendId={notification.triggeredBy?.id}
            notification={notification}
          />
        );
      }
      // Handle follow notifications
      else if (notification.notificationType === 'follow') {
        return (
          <NotificationFollower
            key={notification.id}
            username={notification.triggeredBy?.username ?? 'Unknown'}
            profilePicture={notification.triggeredBy?.profilePicture ?? '/images/profile.png'}
            id={notification.triggeredBy?.id}
            notification={notification}
          />
        );
      }
      // Handle challenge and other notification types
      else {
        let challengeTitle = notification.content ?? '';

        // Use the title from the specific challenge if available
        if (notification.privateChallenge) {
          challengeTitle = notification.privateChallenge.title || challengeTitle;
        } else if (notification.publicChallenge) {
          challengeTitle = notification.publicChallenge.title || challengeTitle;
        } else if (notification.aiChallenge) {
          challengeTitle = notification.aiChallenge.title || challengeTitle;
        }

        // Get reward amount - could be determined by challenge type
        const rewardAmount = getRewardForNotification(notification);

        return (
          <NotificationChallenge
            key={notification.id}
            title={challengeTitle}
            challengerName={notification.triggeredBy?.username ?? 'Unknown'}
            challengerProfile={notification.triggeredBy?.profilePicture ?? '/images/profile.png'}
            reward={rewardAmount}
            notification={notification}
          />
        );
      }
    });
    console.timeEnd('render-notification-list');
    return result;
  }, [notifications]);

  // For initial render with no data, show skeletons
  console.log(`[PERF] Render decision - isLoading: ${isLoading}, notifications: ${notifications.length}`);

  if (isLoading) {
    console.log('[PERF] Rendering skeleton view');
    return (
      <div className="text-white p-4 min-h-screen flex items-center justify-center mt-20">
        <div className="flex flex-col items-center w-full h-full max-w-md mx-auto">
          <div className="w-full space-y-4 p-6">
            {Array(3)
              .fill(0)
              .map((_, index) => (
                <NotificationSkeleton key={`skeleton-${index}`} />
              ))}
          </div>
        </div>
      </div>
    );
  }

  console.log('[PERF] Rendering main inbox content');
  return (
    <div className="text-white p-4 min-h-screen mt-20">
      <div
        id="inbox-page"
        ref={contentRef}
        className="max-w-md mx-auto"
        style={{
          paddingTop: `${pullDistance}px`, // Only pull distance for pull-to-refresh
        }}
      >
        {/* Pull to refresh indicator */}
        {isPulling && (
          <div
            className="absolute top-20 left-0 right-0 flex justify-center items-center z-10"
            style={{ height: `${pullDistance}px` }}
          >
            <PullToRefreshSpinner />
          </div>
        )}

        {/* Notifications list */}
        <div className="w-full space-y-4 pb-32">
          {notifications.length === 0 ? (
            // Empty state when no notifications
            <EmptyState />
          ) : (
            // Actual notifications
            notificationList
          )}
        </div>
      </div>
    </div>
  );
};

export default InboxView;
