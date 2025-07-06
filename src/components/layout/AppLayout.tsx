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
import ArrowBackIcon from '../icons/back';
import ThematicContainer from '../ui/ThematicContainer';

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

// BottomNavbar props interface
interface BottomNavbarProps {
  currentIndex: number;
  handleNavClick: (index: number) => Promise<void>;
  unreadCount: number;
  className?: string;
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
  const [hasCustomBackHandler, setHasCustomBackHandler] = useState(false);
  const [isRouterReady, setIsRouterReady] = useState(false);

  // Safe pathname access with fallback
  const currentPathname = router?.pathname || '';
  const currentQuery = router?.query || {};

  // Track when component first mounts
  useEffect(() => {
    logPerf(`AppLayout mounted at ${new Date().toLocaleTimeString()}`);
    return () => {
      logPerf(`AppLayout unmounted at ${new Date().toLocaleTimeString()}`);
    };
  }, []);

  // Track router readiness
  useEffect(() => {
    if (router?.pathname && router?.isReady) {
      setIsRouterReady(true);
      logPerf(`Router is ready with pathname: ${router.pathname}`);
    }
  }, [router?.pathname, router?.isReady]);

  // Listen for custom back handler registration
  useEffect(() => {
    const handleCustomBackRegistration = (event: CustomEvent) => {
      setHasCustomBackHandler(event.detail.hasCustomBack);
    };

    if (isBrowser) {
      window.addEventListener('nocena_register_custom_back', handleCustomBackRegistration as EventListener);
    }

    return () => {
      if (isBrowser) {
        window.removeEventListener('nocena_register_custom_back', handleCustomBackRegistration as EventListener);
      }
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

  // NEW: Listen for navigation messages from service worker
  useEffect(() => {
    // Listen for navigation messages from service worker
    if (isBrowser && 'serviceWorker' in navigator && router?.push) {
      const handleServiceWorkerMessage = (event: MessageEvent) => {
        console.log('🔔 Received message from SW:', event.data);

        if (event.data && event.data.type === 'NAVIGATE_TO') {
          console.log('🚀 Navigating to:', event.data.url);
          router.push(event.data.url);
        }
      };

      navigator.serviceWorker.addEventListener('message', handleServiceWorkerMessage);

      return () => {
        navigator.serviceWorker.removeEventListener('message', handleServiceWorkerMessage);
      };
    }
  }, [router?.push]);

  // Set the correct index based on the current path - WITH SAFETY CHECKS
  useEffect(() => {
    // Early return if router is not ready or pathname is not available
    if (!isRouterReady || !currentPathname) {
      logPerf(`Skipping index calculation - router not ready or no pathname`);
      return;
    }

    const pathToIndexMap: Record<string, number> = {
      '/home': 0,
      '/map': 1,
      '/inbox': 2,
      '/search': 3,
      '/profile': 4,
      '/completing': 5,
      '/createchallenge': 7, // Special index for create challenge page
      '/livestream': 8, // Special index for livestream page
      '/watch': 9, // Special index for watch index page
    };

    // Handle profile pages with IDs - WITH SAFETY CHECKS
    if (currentPathname.startsWith('/profile/')) {
      // Check if this is the user's own profile
      if (currentQuery.walletAddress === user?.wallet) {
        setCurrentIndex(4); // Own profile
      } else {
        setCurrentIndex(6); // Other user's profile
      }
      return;
    }

    // Handle watch pages with session IDs
    if (currentPathname.startsWith('/watch/')) {
      setCurrentIndex(10); // Special index for individual watch session page
      return;
    }

    // Check if the current path is in our mapping
    const index = pathToIndexMap[currentPathname];
    if (index !== undefined) {
      setCurrentIndex(index);
      logPerf(`Set current index to ${index} for path ${currentPathname}`);
    }
  }, [isRouterReady, currentPathname, currentQuery, user?.wallet]);

  // Safe checks for special page determination
  const isUserProfile = currentPathname.startsWith('/profile/') && currentQuery.walletAddress !== user?.wallet;
  const isSpecialPage =
    currentPathname === '/completing' ||
    currentPathname === '/createchallenge' ||
    currentPathname === '/livestream' ||
    currentPathname === '/watch' ||
    currentPathname.startsWith('/watch/');

  // Memoized navigation handler to prevent unnecessary rerenders
  const handleNavClick = useCallback(
    async (index: number) => {
      // Safety check for router
      if (!router?.push) {
        console.error('Router not available for navigation');
        return;
      }

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
        8: '/livestream',
        9: '/watch',
        10: '/watch', // Individual watch session pages will handle their own routing
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

      if (routeToComponentName[index] && isBrowser) {
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
      try {
        await router.push(route, undefined, { shallow: true });
      } catch (error) {
        console.error('Navigation failed:', error);
        return;
      }

      // After navigation, handle any operations that could block
      if (index === 2 && user?.id) {
        // For inbox, perform background operation after navigation
        window.requestAnimationFrame(async () => {
          try {
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
          } catch (error) {
            console.error('Failed to mark notifications as read:', error);
          }
        });
      }

      logPerf(`Navigation completed in ${(performance.now() - navigationStart).toFixed(2)}ms`);
    },
    [router?.push, user?.id, user?.wallet],
  );

  const handleMenuToggle = useCallback(() => {
    setIsMenuOpen((prev) => !prev);
  }, []);

  const handleMenuClose = useCallback(() => {
    setIsMenuOpen(false);
  }, []);

  // Handle going back from special pages
  const handleBack = useCallback(() => {
    if (!router?.back) {
      console.error('Router not available for back navigation');
      return;
    }

    if (hasCustomBackHandler) {
      // Dispatch custom back event for pages that need it
      if (isBrowser) {
        window.dispatchEvent(new CustomEvent('nocena_custom_back'));
      }
    } else {
      // Use default router.back() for normal pages
      router.back();
    }
  }, [router?.back, hasCustomBackHandler]);

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

  // Early return if router is not ready
  if (!isRouterReady) {
    logPerf(`Waiting for router to be ready...`);
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-[#121212]">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
      </div>
    );
  }

  // Determine whether to use PageManager or direct children
  const usePageManager =
    !currentPathname.startsWith('/completing') &&
    !currentPathname.startsWith('/createchallenge') &&
    !currentPathname.startsWith('/livestream') &&
    !currentPathname.startsWith('/watch') &&
    children === undefined;

  if (isBrowser) {
    logPerf(`AppLayout render completed in ${(performance.now() - startRenderTime).toFixed(2)}ms`);
  }

  // Determine if bottom navbar should be shown based on the current route
  const showBottomNavbar = !isSpecialPage;

  console.log('Current path:', currentPathname);
  console.log('showBottomNavbar:', showBottomNavbar);

  return (
    <div className="app-container min-h-screen w-full text-white flex flex-col relative">
      {/* Add the video background first */}
      <VideoBackground videoSrc="/AppBG.mp4" />

      {/* Add the memory optimizer for background/foreground handling */}
      <MemoryOptimizer />

      {/* Conditional rendering based on page type */}
      {isSpecialPage ? (
        /* Special Page Header with styled Back Button */
        <div
          className="flex justify-between items-center px-4 fixed top-0 left-0 right-0 z-50 pointer-events-none mt-4"
          style={{
            paddingTop: 'env(safe-area-inset-top)',
            paddingBottom: '0.5rem',
          }}
        >
          {/* Back button styled like the profile button */}
          <button onClick={handleBack} className="focus:outline-none pointer-events-auto" aria-label="Back">
            <ThematicContainer
              color="nocenaBlue"
              glassmorphic={true}
              asButton={false}
              rounded="full"
              className="w-12 h-12 flex items-center justify-center"
            >
              <ArrowBackIcon className="transition-colors duration-300" style={{ color: 'white' }} />
            </ThematicContainer>
          </button>
          {/* Empty middle and right sections to match TopNavbar layout */}
          <div className="flex-grow"></div>
          <div className="w-12"></div> {/* Empty space to balance the layout */}
        </div>
      ) : (
        /* Standard Top Navbar for regular pages */
        <TopNavbar
          currentIndex={currentIndex}
          isUserProfile={isUserProfile}
          isSpecialPage={false}
          handleMenuToggle={handleMenuToggle}
          handleNavClick={handleNavClick}
          isMenuOpen={isMenuOpen} // Add this new prop
        />
      )}

      {/* Side Menu - pass the new logout handler and showBottomNavbar prop */}
      <Menu
        isOpen={isMenuOpen}
        onClose={handleMenuClose}
        onLogout={handleAppLogout}
        showBottomNavbar={showBottomNavbar}
      />

      {/* Main Content - modified to adjust spacing based on page type */}
      <main
        className={`flex-grow relative z-10 ${currentPathname === '/map' || isSpecialPage ? 'pt-0 pb-0' : ''}`}
        style={{
          // Adjust margin-top for different page types
          marginTop:
            currentPathname === '/map'
              ? 0
              : isSpecialPage
                ? 'calc(env(safe-area-inset-top) + 56px)'
                : 'env(safe-area-inset-top)',
        }}
      >
        {usePageManager ? <PageManager /> : children}
      </main>

      {/* Bottom Navbar - only show for non-special pages with slide animation */}
      {showBottomNavbar && !isMenuOpen && (
        <BottomNavbar
          currentIndex={currentIndex}
          handleNavClick={handleNavClick}
          unreadCount={unreadCount}
          className="fixed bottom-0 left-0 right-0 z-10 transition-all duration-300 ease-in-out"
          style={{
            paddingBottom: 'env(safe-area-inset-bottom)',
          }}
        />
      )}
    </div>
  );
};

export default AppLayout;
