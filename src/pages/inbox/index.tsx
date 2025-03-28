// pages/inbox/index.tsx
import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { fetchNotifications } from "../../lib/api/dgraph";
import NotificationFollower from "./notifications/NotificationFollower";
import NotificationChallenge from "./notifications/NotificationChallenge";
import { getPageState, updatePageState } from "../../components/PageManager";

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
      <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
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
  const { user, isAuthenticated } = useAuth();
  const [notifications, setNotifications] = useState<NotificationBase[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [initialRenderComplete, setInitialRenderComplete] = useState(false);
  const [isPulling, setIsPulling] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const contentRef = useRef<HTMLDivElement>(null);
  const startY = useRef(0);
  const currentY = useRef(0);
  const pulling = useRef(false);
  
  // Register page visibility event listeners for PageManager
  useEffect(() => {
    const handlePageVisibility = (event: Event) => {
      const customEvent = event as CustomVisibilityEvent;
      if (customEvent.detail && customEvent.detail.pageName === 'inbox') {
        setIsVisible(customEvent.detail.isVisible);
      }
    };
    
    const handleRouteChange = (event: Event) => {
      const customEvent = event as CustomRouteEvent;
      if (customEvent.detail) {
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
    
    return () => {
      window.removeEventListener('pageVisibilityChange', handlePageVisibility);
      window.removeEventListener('routeChange', handleRouteChange);
    };
  }, []);
  
  // First load - check for cached data in PageManager and localStorage
  useEffect(() => {
    try {
      // First try PageManager state
      const pageState = getPageState();
      if (pageState && pageState.notifications) {
        const { data, lastFetched } = pageState.notifications;
        
        // Only use data if it's not too old (5 minutes)
        if (data && data.length > 0 && Date.now() - lastFetched < 300000) {
          setNotifications(data as NotificationBase[]);
        }
      } else {
        // Try localStorage if PageManager doesn't have data
        const cachedData = localStorage.getItem('nocena_cached_notifications');
        if (cachedData) {
          const { data, timestamp } = JSON.parse(cachedData);
          if (Date.now() - timestamp < 300000) {
            setNotifications(data);
            
            // Also update PageManager state
            updatePageState('notifications', data);
          }
        }
      }
    } catch (error) {
      console.error('Failed to load cached notifications', error);
    }
    
    setInitialRenderComplete(true);
  }, []);

  // Function to fetch notifications
  const fetchUserNotifications = useCallback(async (showLoading = true) => {
    if (!user?.id) return;
    
    if (showLoading) setIsLoading(true);
    
    try {
      const fetchedNotifications = await fetchNotifications(user.id);
      
      // Sort notifications by createdAt date (newest first)
      const sortedNotifications = [...fetchedNotifications].sort((a, b) => {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
      
      setNotifications(sortedNotifications);
      
      // Update both PageManager state and localStorage cache
      updatePageState('notifications', sortedNotifications);
      
      localStorage.setItem('nocena_cached_notifications', JSON.stringify({
        data: sortedNotifications,
        timestamp: Date.now()
      }));
      
      // Mark notifications as viewed
      localStorage.setItem('nocena_last_notification_view', Date.now().toString());
    } catch (error) {
      console.error("Failed to load notifications", error);
    } finally {
      if (showLoading) setIsLoading(false);
      setIsPulling(false);
      setPullDistance(0);
    }
  }, [user?.id]);

  // Handle data fetching based on component visibility and data freshness
  useEffect(() => {
    if (!user?.id || !initialRenderComplete) return;
    
    // Get the most recent data timestamp
    const pageState = getPageState();
    const lastFetched = pageState?.notifications?.lastFetched || 0;
    
    const shouldFetch = 
      notifications.length === 0 || // No data
      (Date.now() - lastFetched > 60000) || // Data is older than 1 minute
      (isVisible && Date.now() - lastFetched > 30000); // Page is visible and data older than 30 seconds
    
    if (shouldFetch) {
      // Only show loading indicator if we have no data yet
      fetchUserNotifications(notifications.length === 0);
    }
  }, [user?.id, isVisible, notifications.length, initialRenderComplete, fetchUserNotifications]);

  // Set up background refresh when page is visible
  useEffect(() => {
    if (!isVisible || !user?.id) return;
    
    // Use number type for interval ID
    const intervalId: number = window.setInterval(() => {
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

  // Memoize notification rendering to prevent unnecessary re-renders
  const notificationList = useMemo(() => {
    return notifications.map((notification) => {
      if (notification.notificationType === "follow") {
        return (
          <NotificationFollower
            key={notification.id}
            username={notification.triggeredBy?.username ?? "Unknown"}
            profilePicture={notification.triggeredBy?.profilePicture ?? "/images/profile.png"}
            id={notification.triggeredBy?.id}
          />
        );
      } else {
        return (
          <NotificationChallenge
            key={notification.id}
            title={notification.content ?? ""}
            challengerName={notification.triggeredBy?.username ?? "Unknown"}
            challengerProfile={notification.triggeredBy?.profilePicture ?? "/images/profile.png"}
            reward={notification.reward ?? 10}
          />
        );
      }
    });
  }, [notifications]);

  // For initial render with no data, show skeletons
  if (!initialRenderComplete && notifications.length === 0) {
    return (
      <div className="flex flex-col items-center w-full h-full max-w-md mx-auto">
        <div className="w-full space-y-4 p-6">
          {Array(3).fill(0).map((_, index) => (
            <NotificationSkeleton key={`skeleton-${index}`} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div 
      id="inbox-page" 
      ref={contentRef}
      className="flex flex-col items-center w-full h-full max-w-md mx-auto overflow-y-auto"
      style={{ 
        minHeight: '100%',
        paddingTop: `${pullDistance}px` // Dynamic padding based on pull distance
      }}
    >
      {/* Pull to refresh indicator */}
      {isPulling && (
        <div 
          className="absolute top-0 left-0 right-0 flex justify-center items-center"
          style={{ height: `${pullDistance}px` }}
        >
          <PullToRefreshSpinner />
        </div>
      )}
      
      {/* Notifications list */}
      <div className="w-full space-y-4 p-6 pb-32"> {/* Added bottom padding for scroll space */}
        {isLoading && notifications.length === 0 ? (
          // Show skeletons only when loading and we have no data
          Array(3).fill(0).map((_, index) => (
            <NotificationSkeleton key={`skeleton-${index}`} />
          ))
        ) : notifications.length === 0 ? (
          // Empty state when no notifications
          <EmptyState />
        ) : (
          // Actual notifications
          notificationList
        )}
      </div>
    </div>
  );
};

export default InboxView;