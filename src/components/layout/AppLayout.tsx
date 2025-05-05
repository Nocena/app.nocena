import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../../contexts/AuthContext';
import { fetchUnreadNotificationsCount, markNotificationsAsRead } from '../../lib/api/dgraph';

import Menu from './Menu';
import MemoryOptimizer from '../MemoryOptimizer';
import PageManager from '../PageManager';
import TopNavbar from './TopNavbar';
import BottomNavbar from './BottomNavbar';
import VideoBackground from './BackgroundVideo';

// Check if we're running in a browser environment
const isBrowser = typeof window !== 'undefined';

// Enable performance logging
const enablePerformanceLogging = true;
const logPerf = (message: string) => {
  if (enablePerformanceLogging && isBrowser) {
    console.log(`[PERF-AppLayout] ${message}`);
  }
};

interface AppLayoutProps {
  handleLogout: () => void;
  children?: React.ReactNode;
}

const AppLayout: React.FC<AppLayoutProps> = ({ handleLogout, children }) => {
  const startRenderTime = isBrowser ? performance.now() : 0;
  logPerf(`AppLayout render started`);

  const router = useRouter();
  const { user } = useAuth();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [appIsVisible, setAppIsVisible] = useState(true);

  // Track when component first mounts
  useEffect(() => {
    logPerf(`AppLayout mounted at ${new Date().toLocaleTimeString()}`);
    return () => {
      logPerf(`AppLayout unmounted at ${new Date().toLocaleTimeString()}`);
    };
  }, []);

  // Refs to store cached data
  const cachedUnreadCount = useRef<{ count: number; timestamp: number } | null>(null);

  // More efficient unread notifications check with caching and visibility detection
  useEffect(() => {
    if (!user?.id || !isBrowser) return;

    logPerf(`Setting up notifications check`);
    const checkUnreadNotifications = async () => {
      logPerf(`Checking unread notifications`);
      try {
        const fetchStart = performance.now();
        const count = await fetchUnreadNotificationsCount(user.id);
        logPerf(`Fetched unread count in ${(performance.now() - fetchStart).toFixed(2)}ms: ${count}`);

        setUnreadCount(count);

        // Cache the count in localStorage to show immediately on next app open
        try {
          // Update memory cache first
          cachedUnreadCount.current = {
            count,
            timestamp: Date.now(),
          };

          // Then persist to localStorage
          localStorage.setItem('nocena_unread_count', JSON.stringify(cachedUnreadCount.current));
        } catch (error) {
          console.error('Failed to cache unread count', error);
        }
      } catch (error) {
        console.error('Failed to fetch unread count', error);
      }
    };

    // Try to get cached count first for instant display
    try {
      logPerf(`Checking for cached unread count`);
      // First check memory cache
      if (cachedUnreadCount.current && Date.now() - cachedUnreadCount.current.timestamp < 300000) {
        setUnreadCount(cachedUnreadCount.current.count);
        logPerf(`Using memory-cached unread count: ${cachedUnreadCount.current.count}`);
      } else {
        // Try localStorage as fallback
        const cachedData = localStorage.getItem('nocena_unread_count');
        if (cachedData) {
          const parsedData = JSON.parse(cachedData);
          // Only use cache if less than 5 minutes old
          if (Date.now() - parsedData.timestamp < 300000) {
            setUnreadCount(parsedData.count);
            // Also update memory cache
            cachedUnreadCount.current = parsedData;
            logPerf(`Using localStorage-cached unread count: ${parsedData.count}`);
          }
        }
      }
    } catch (error) {
      console.error('Error reading cached notification count', error);
    }

    // Initial check - but wait a moment to not block page render
    const initialCheckTimer = setTimeout(() => {
      checkUnreadNotifications();
    }, 500);

    // Set up interval for checking unread notifications
    // Only run checks when app is visible to save battery
    const interval = setInterval(() => {
      if (appIsVisible) {
        checkUnreadNotifications();
      }
    }, 30000);

    return () => {
      clearTimeout(initialCheckTimer);
      clearInterval(interval);
    };
  }, [user?.id, appIsVisible]);

  // App visibility handler to optimize performance
  useEffect(() => {
    if (!isBrowser) return;

    const handleVisibilityChange = () => {
      const newVisibility = document.visibilityState === 'visible';
      logPerf(`App visibility changed to: ${newVisibility ? 'visible' : 'hidden'}`);
      setAppIsVisible(newVisibility);
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Also listen for our custom events
    const handleBackgroundEvent = () => {
      logPerf(`App went to background`);
      setAppIsVisible(false);
    };

    const handleForegroundEvent = () => {
      logPerf(`App came to foreground`);
      setAppIsVisible(true);
      // Refresh notification count when app comes to foreground
      if (user?.id) {
        fetchUnreadNotificationsCount(user.id)
          .then((count) => setUnreadCount(count))
          .catch((error) => console.error('Failed to refresh notifications', error));
      }
    };

    window.addEventListener('nocena_app_background', handleBackgroundEvent);
    window.addEventListener('nocena_app_foreground', handleForegroundEvent);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('nocena_app_background', handleBackgroundEvent);
      window.removeEventListener('nocena_app_foreground', handleForegroundEvent);
    };
  }, [user?.id]);

  // Set the correct index based on the current path
  useEffect(() => {
    const pathToIndexMap: Record<string, number> = {
      '/home': 0,
      '/map': 1,
      '/inbox': 2,
      '/search': 3,
      '/profile': 4,
      '/completing': 5,
      '/createchallenge': 7, // Special index for create challenge page
    };

    // Handle profile pages with IDs
    if (router.pathname.startsWith('/profile/')) {
      // Check if this is the user's own profile
      if (router.query.walletAddress === user?.wallet) {
        setCurrentIndex(4); // Own profile
      } else {
        setCurrentIndex(6); // Other user's profile
      }
      return;
    }

    // Check if the current path is in our mapping
    const index = pathToIndexMap[router.pathname];
    if (index !== undefined) {
      setCurrentIndex(index);
    }
  }, [router.pathname, router.query, user?.wallet]);

  const isUserProfile = router.pathname.startsWith('/profile/') && router.query.walletAddress !== user?.wallet;
  const isSpecialPage = router.pathname === '/completing' || router.pathname === '/createchallenge';

  // Memoized navigation handler to prevent unnecessary rerenders
  const handleNavClick = useCallback(
    async (index: number) => {
      logPerf(`Navigation clicked: index ${index}`);
      const navigationStart = performance.now();

      // Update the current tab index immediately for UI feedback
      setCurrentIndex(index);

      const routeMapping: Record<number, string> = {
        0: '/home',
        1: '/map',
        2: '/inbox',
        3: '/search',
        4: '/profile',
        5: '/completing',
        6: '/profile',
        7: '/createchallenge',
      };

      // Determine the target route
      const route = index === 6 && user?.wallet ? `/profile/${user.id}` : routeMapping[index] || '/home';

      // Update visibility state immediately before navigation
      // This helps make the page load appear faster
      const routeToComponentName: Record<number, string> = {
        0: 'home',
        1: 'map',
        2: 'inbox',
        3: 'search',
        4: 'profile',
      };

      if (routeToComponentName[index]) {
        const visibilityEvent = new CustomEvent('pageVisibilityChange', {
          detail: {
            pageName: routeToComponentName[index],
            isVisible: true,
          },
        });
        window.dispatchEvent(visibilityEvent);
      }

      // Perform route push first for faster response
      // Add shallow routing to prevent full page reload
      router.push(route, undefined, { shallow: true });

      // After navigation, handle any operations that could block
      if (index === 2 && user?.id) {
        // For inbox, perform background operation after navigation
        window.requestAnimationFrame(async () => {
          // Mark notifications as read
          await markNotificationsAsRead(user.id);
          setUnreadCount(0);

          // Update the cache to reflect read notifications
          if (isBrowser) {
            try {
              const updatedCache = {
                count: 0,
                timestamp: Date.now(),
              };
              // Update memory cache first
              cachedUnreadCount.current = updatedCache;
              // Then persist to localStorage
              localStorage.setItem('nocena_unread_count', JSON.stringify(updatedCache));
            } catch (error) {
              console.error('Failed to update unread count cache', error);
            }
          }
        });
      }

      logPerf(`Navigation completed in ${(performance.now() - navigationStart).toFixed(2)}ms`);
    },
    [router, user?.id, user?.wallet],
  );

  const handleMenuToggle = useCallback(() => {
    setIsMenuOpen((prev) => !prev);
  }, []);

  const handleMenuClose = useCallback(() => {
    setIsMenuOpen(false);
  }, []);

  // Create a proper logout handler that ensures full page reload
  const handleAppLogout = useCallback(() => {
    // First close the menu
    setIsMenuOpen(false);

    // Call the original logout handler from props
    handleLogout();

    // Clear any app state from localStorage before redirecting
    if (isBrowser) {
      try {
        localStorage.removeItem('nocena_page_state');
        localStorage.removeItem('nocena_unread_count');
        localStorage.removeItem('nocena_cached_notifications');
      } catch (error) {
        console.error('Failed to clear cached data during logout', error);
      }
    }

    // Force a full page navigation to ensure clean state
    if (isBrowser) {
      window.location.href = '/login';
    }
  }, [handleLogout]);

  // Determine whether to use PageManager or direct children
  const usePageManager =
    !router.pathname.startsWith('/completing') &&
    !router.pathname.startsWith('/createchallenge') &&
    children === undefined;

  if (isBrowser) {
    logPerf(`AppLayout render completed in ${(performance.now() - startRenderTime).toFixed(2)}ms`);
  }

  // Determine if bottom navbar should be shown based on the current route
  const showBottomNavbar = true;

  console.log("Current path:", router.pathname);
  console.log("showBottomNavbar:", showBottomNavbar);

// In your AppLayout.tsx file

// 1. Make sure you update the BottomNavbar props interface to include className
interface BottomNavbarProps {
  currentIndex: number;
  handleNavClick: (index: number) => Promise<void>;
  unreadCount: number;
  // Add className to the interface
  className?: string;
}

// Now your return statement can use the correct props
return (
  <div className="app-container min-h-screen w-full text-white flex flex-col relative">
    {/* Add the video background first */}
    <VideoBackground videoSrc="/AppBG.mp4" />

    {/* Add the memory optimizer for background/foreground handling */}
    <MemoryOptimizer />

    {/* Top Navbar - extracted to its own component */}
    <TopNavbar
      currentIndex={currentIndex}
      isUserProfile={isUserProfile}
      isSpecialPage={isSpecialPage}
      handleMenuToggle={handleMenuToggle}
      handleNavClick={handleNavClick}
    />

    {/* Side Menu - pass the new logout handler */}
    <Menu isOpen={isMenuOpen} onClose={handleMenuClose} onLogout={handleAppLogout} />

    {/* Main Content - modified to remove spacing for map and special pages */}
    <main
      className={`grow relative z-10 ${
        router.pathname === '/map' || isSpecialPage ? 'pt-0 pb-0' : 'pt-3 pb-16'
      }`}
      style={{
        // Remove the margin-top for map and special pages
        marginTop: router.pathname === '/map' || isSpecialPage ? 0 : 'env(safe-area-inset-top)',
      }}
    >
      {usePageManager ? <PageManager /> : children}
    </main>

    {/* Bottom Navbar - using className instead of style */}
    {showBottomNavbar && (
      <BottomNavbar
        currentIndex={currentIndex}
        handleNavClick={handleNavClick}
        unreadCount={unreadCount}
        className="relative z-10"
      />
    )}
  </div>
);
};

export default AppLayout;