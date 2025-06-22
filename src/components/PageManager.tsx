import React, { useEffect, useState, lazy, Suspense, useRef } from 'react';
import { useRouter } from 'next/router';

// Check if we're running in a browser environment
const isBrowser = typeof window !== 'undefined';

// Performance debugging
const enablePerformanceLogging = true;
const logPerf = (message: string) => {
  if (enablePerformanceLogging && isBrowser) {
    console.log(`[PERF] ${message}`);
  }
};

// Define proper types for page state
type PageStateSection = 'notifications' | 'feed' | 'challenges';

interface PageStateData<T = any> {
  data: T | null;
  lastFetched: number;
}

// Update GlobalPageState to allow string indexing
interface GlobalPageState {
  notifications: PageStateData;
  feed: PageStateData;
  challenges: PageStateData;
  // Allow dynamic string keys for custom sections (like profile data)
  [key: string]: PageStateData;
}

// Create a global state that persists between renders
const createPageState = (): GlobalPageState => {
  const state: GlobalPageState = {
    notifications: {
      data: [],
      lastFetched: 0,
    },
    feed: {
      data: [],
      lastFetched: 0,
    },
    challenges: {
      data: [],
      lastFetched: 0,
    },
  };

  // Load initial state from localStorage if available
  if (isBrowser) {
    try {
      const startTime = performance.now();
      const savedState = localStorage.getItem('nocena_page_state');
      if (savedState) {
        const parsedState = JSON.parse(savedState);
        Object.assign(state, parsedState);
        logPerf(`Loaded state from localStorage in ${(performance.now() - startTime).toFixed(2)}ms`);
      }
    } catch (error) {
      console.error('Failed to load page state', error);
    }
  }

  return state;
};

// Initialize global state
const globalPageState: GlobalPageState = createPageState();

// Create a custom event for page visibility changes
const createVisibilityEvent = (pageName: string, isVisible: boolean): CustomEvent => {
  return new CustomEvent('pageVisibilityChange', {
    detail: { pageName, isVisible },
  });
};

// Optimized skeleton loaders using inline components
const renderSkeleton = () => (
  <div className="w-full p-6 space-y-4">
    {Array(3)
      .fill(0)
      .map((_, i) => (
        <div key={i} className="w-full bg-[#1A2734] rounded-lg p-4 animate-pulse">
          <div className="flex items-center space-x-4">
            <div className="h-12 w-12 bg-gray-700 rounded-full"></div>
            <div className="flex-1">
              <div className="h-4 bg-gray-700 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-gray-700 rounded w-1/2"></div>
            </div>
          </div>
        </div>
      ))}
  </div>
);

// Direct inline fallbacks for each page to avoid component overhead
const HomeLoading = () => renderSkeleton();
const MapLoading = () => renderSkeleton();
const InboxLoading = () => renderSkeleton();
const SearchLoading = () => renderSkeleton();
const ProfileLoading = () => renderSkeleton();

// Lazy load the page components with performance tracking
const lazyLoadWithTracking = (importFn: () => Promise<any>, pageName: string) => {
  return lazy(() => {
    logPerf(`Starting lazy load of ${pageName}`);
    const startTime = performance.now();
    return importFn().then((module) => {
      logPerf(`Loaded ${pageName} in ${(performance.now() - startTime).toFixed(2)}ms`);
      return module;
    });
  });
};

// Lazy load the page components using their correct paths
const HomePage = lazyLoadWithTracking(
  () => import(/* webpackChunkName: "home-page" */ '../pages/home/index'),
  'HomePage',
);
const MapPage = lazyLoadWithTracking(() => import(/* webpackChunkName: "map-page" */ '../pages/map/index'), 'MapPage');
const InboxPage = lazyLoadWithTracking(
  () => import(/* webpackChunkName: "inbox-page" */ '../pages/inbox/index'),
  'InboxPage',
);
const SearchPage = lazyLoadWithTracking(
  () => import(/* webpackChunkName: "search-page" */ '../pages/search/index'),
  'SearchPage',
);
const ProfilePage = lazyLoadWithTracking(
  () => import(/* webpackChunkName: "profile-page" */ '../pages/profile/index'),
  'ProfilePage',
);

// Preload critical assets
if (isBrowser) {
  // Use requestIdleCallback for preloading to avoid competing with critical resources
  const preloadPages = () => {
    // Preload the most common pages in order of likely usage
    setTimeout(() => import(/* webpackChunkName: "home-page" */ '../pages/home/index'), 1000);
    setTimeout(() => import(/* webpackChunkName: "inbox-page" */ '../pages/inbox/index'), 2000);
    setTimeout(() => import(/* webpackChunkName: "profile-page" */ '../pages/profile/index'), 3000);
  };

  if ('requestIdleCallback' in window) {
    (window as any).requestIdleCallback(preloadPages, { timeout: 5000 });
  } else {
    setTimeout(preloadPages, 1000);
  }
}

// Interface for route change event
interface RouteChangeEvent {
  from: string;
  to: string;
}

// Track page load status
interface PageLoadStatus {
  home: boolean;
  map: boolean;
  inbox: boolean;
  search: boolean;
  profile: boolean;
}

const PageManager: React.FC = () => {
  const startRenderTime = performance.now();
  logPerf(`PageManager render started`);

  const router = useRouter();
  const [activeRoute, setActiveRoute] = useState('/home');
  const [loadedPages, setLoadedPages] = useState<string[]>([]);
  const [isRouterReady, setIsRouterReady] = useState(false);

  // Keep track of previous active route for transition effects
  const prevRouteRef = useRef(activeRoute);

  // Safe pathname access
  const currentPathname = router?.pathname || '';

  // Track when a page has fully loaded
  const [pageLoadStatus, setPageLoadStatus] = useState<PageLoadStatus>({
    home: false,
    map: false,
    inbox: false,
    search: false,
    profile: false,
  });

  // Functions to update page load status
  const onHomeLoaded = () => setPageLoadStatus((prev) => ({ ...prev, home: true }));
  const onMapLoaded = () => setPageLoadStatus((prev) => ({ ...prev, map: true }));
  const onInboxLoaded = () => setPageLoadStatus((prev) => ({ ...prev, inbox: true }));
  const onSearchLoaded = () => setPageLoadStatus((prev) => ({ ...prev, search: true }));
  const onProfileLoaded = () => setPageLoadStatus((prev) => ({ ...prev, profile: true }));

  // Track when component first mounts
  useEffect(() => {
    logPerf(`PageManager mounted at ${new Date().toLocaleTimeString()}`);
    return () => {
      logPerf(`PageManager unmounted at ${new Date().toLocaleTimeString()}`);
    };
  }, []);

  // Track router readiness
  useEffect(() => {
    if (router?.pathname && router?.isReady) {
      setIsRouterReady(true);
      logPerf(`PageManager: Router is ready with pathname: ${router.pathname}`);
    }
  }, [router?.pathname, router?.isReady]);

  // Update active route when router changes - WITH SAFETY CHECKS
  useEffect(() => {
    // Safety checks for router availability
    if (!isRouterReady || !currentPathname) {
      logPerf(`PageManager: Skipping route update - router not ready or no pathname`);
      return;
    }

    const transitionStart = performance.now();
    logPerf(`Route transition started: ${prevRouteRef.current} -> ${currentPathname}`);

    const prevRoute = prevRouteRef.current;
    setActiveRoute(currentPathname);
    prevRouteRef.current = currentPathname;

    // Show loading state immediately for better UX
    window.requestAnimationFrame(() => {
      // Fire visibility event first to prepare component
      if (isBrowser) {
        // Look up which component name corresponds to this route
        const routeToComponentName: Record<string, string> = {
          '/home': 'home',
          '/map': 'map',
          '/inbox': 'inbox',
          '/search': 'search',
          '/profile': 'profile',
        };

        const mainRoute = currentPathname.split('/')[1];
        const componentName = routeToComponentName[`/${mainRoute}`] || mainRoute;

        // Fire visibility event first for the new page
        if (componentName) {
          window.dispatchEvent(createVisibilityEvent(componentName, true));
        }

        // Then dispatch route change event
        window.dispatchEvent(
          new CustomEvent('routeChange', {
            detail: {
              from: prevRoute,
              to: currentPathname,
            } as RouteChangeEvent,
          }),
        );
      }
    });

    // Add this page to loaded pages if not already loaded
    if (!loadedPages.includes(currentPathname)) {
      setLoadedPages((prev) => [...prev, currentPathname]);
      logPerf(`Added route to loaded pages: ${currentPathname}`);
    }

    // Log complete transition time
    window.requestAnimationFrame(() => {
      logPerf(`Route transition completed in ${(performance.now() - transitionStart).toFixed(2)}ms`);
    });
  }, [isRouterReady, currentPathname, loadedPages]);

  // Preload adjacent pages after the first page is loaded
  useEffect(() => {
    if (!isBrowser) return;

    if (loadedPages.length === 1) {
      logPerf(`First page loaded, scheduling preload of other pages`);

      // After first page load, schedule preloading of other main pages
      // Use requestAnimationFrame to ensure it doesn't compete with current render
      window.requestAnimationFrame(() => {
        const timer = setTimeout(() => {
          const pagesToPreload = ['/home', '/map', '/inbox', '/search', '/profile'].filter(
            (page) => !loadedPages.includes(page),
          );

          if (pagesToPreload.length > 0) {
            logPerf(`Preloading pages: ${pagesToPreload.join(', ')}`);
            setLoadedPages((prevPages) => [...prevPages, ...pagesToPreload]);
          }
        }, 1000); // 1 second delay

        return () => clearTimeout(timer);
      });
    }
  }, [loadedPages]);

  // Notify pages about their visibility status
  useEffect(() => {
    if (!isBrowser || !isRouterReady) return;

    // Trigger visibility events for pages
    const routes = [
      { path: '/home', name: 'home' },
      { path: '/map', name: 'map' },
      { path: '/inbox', name: 'inbox' },
      { path: '/search', name: 'search' },
      { path: '/profile', name: 'profile' },
    ];

    routes.forEach((route) => {
      const isVisible =
        route.path === activeRoute || (route.path === '/profile' && activeRoute.startsWith('/profile/'));

      window.dispatchEvent(createVisibilityEvent(route.name, isVisible));
    });
  }, [activeRoute, isRouterReady]);

  // Save state to localStorage periodically
  useEffect(() => {
    if (!isBrowser) return;

    const saveInterval = setInterval(() => {
      try {
        localStorage.setItem('nocena_page_state', JSON.stringify(globalPageState));
      } catch (error) {
        console.error('Failed to save page state', error);
      }
    }, 10000); // Every 10 seconds to reduce overhead

    return () => clearInterval(saveInterval);
  }, []);

  // Handle active route that might contain dynamic segments (like /profile/[id])
  const isProfileRoute = activeRoute === '/profile' || activeRoute.startsWith('/profile/');
  const isHomeRoute = activeRoute === '/home';
  const isMapRoute = activeRoute === '/map';
  const isInboxRoute = activeRoute === '/inbox';
  const isSearchRoute = activeRoute === '/search';

  // Effect hooks to handle page loading status
  useEffect(() => {
    if (isHomeRoute) {
      onHomeLoaded();
    }
  }, [isHomeRoute]);

  useEffect(() => {
    if (isMapRoute) {
      onMapLoaded();
    }
  }, [isMapRoute]);

  useEffect(() => {
    if (isInboxRoute) {
      onInboxLoaded();
    }
  }, [isInboxRoute]);

  useEffect(() => {
    if (isSearchRoute) {
      onSearchLoaded();
    }
  }, [isSearchRoute]);

  useEffect(() => {
    if (isProfileRoute) {
      onProfileLoaded();
    }
  }, [isProfileRoute]);

  // Early return if router is not ready
  if (!isRouterReady) {
    logPerf(`PageManager: Waiting for router to be ready...`);
    return (
      <div className="w-full p-6 space-y-4">
        <div className="w-full bg-[#1A2734] rounded-lg p-4 animate-pulse">
          <div className="flex items-center space-x-4">
            <div className="h-12 w-12 bg-gray-700 rounded-full"></div>
            <div className="flex-1">
              <div className="h-4 bg-gray-700 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-gray-700 rounded w-1/2"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Pre-render the loading placeholders
  const homeLoadingPlaceholder = <HomeLoading />;
  const mapLoadingPlaceholder = <MapLoading />;
  const inboxLoadingPlaceholder = <InboxLoading />;
  const searchLoadingPlaceholder = <SearchLoading />;
  const profileLoadingPlaceholder = <ProfileLoading />;

  logPerf(`PageManager render completed in ${(performance.now() - startRenderTime).toFixed(2)}ms`);

  return (
    <div className="page-container">
      {/* Only render pages that have been loaded or are active */}

      {(loadedPages.includes('/home') || isHomeRoute) && (
        <div
          id="home-page-container"
          className="page-transition"
          style={{
            display: isHomeRoute ? 'block' : 'none',
            opacity: isHomeRoute ? 1 : 0,
            transition: 'opacity 0.2s ease-in-out',
          }}
        >
          <Suspense fallback={homeLoadingPlaceholder}>
            <HomePage />
          </Suspense>
        </div>
      )}

      {(loadedPages.includes('/map') || isMapRoute) && (
        <div
          id="map-page-container"
          className="page-transition"
          style={{
            display: isMapRoute ? 'block' : 'none',
            opacity: isMapRoute ? 1 : 0,
            transition: 'opacity 0.2s ease-in-out',
          }}
        >
          <Suspense fallback={mapLoadingPlaceholder}>
            <MapPage />
          </Suspense>
        </div>
      )}

      {(loadedPages.includes('/inbox') || isInboxRoute) && (
        <div
          id="inbox-page-container"
          className="page-transition"
          style={{
            display: isInboxRoute ? 'block' : 'none',
            opacity: isInboxRoute ? 1 : 0,
            transition: 'opacity 0.2s ease-in-out',
          }}
        >
          <Suspense fallback={inboxLoadingPlaceholder}>
            <InboxPage />
          </Suspense>
        </div>
      )}

      {(loadedPages.includes('/search') || isSearchRoute) && (
        <div
          id="search-page-container"
          className="page-transition"
          style={{
            display: isSearchRoute ? 'block' : 'none',
            opacity: isSearchRoute ? 1 : 0,
            transition: 'opacity 0.2s ease-in-out',
          }}
        >
          <Suspense fallback={searchLoadingPlaceholder}>
            <SearchPage />
          </Suspense>
        </div>
      )}

      {(loadedPages.includes('/profile') || isProfileRoute) && (
        <div
          id="profile-page-container"
          className="page-transition"
          style={{
            display: isProfileRoute ? 'block' : 'none',
            opacity: isProfileRoute ? 1 : 0,
            transition: 'opacity 0.2s ease-in-out',
          }}
        >
          <Suspense fallback={profileLoadingPlaceholder}>
            <ProfilePage />
          </Suspense>
        </div>
      )}

      {/* Export the global state to the window for debugging */}
      {isBrowser && (
        <div style={{ display: 'none' }} id="nocena-debug-state">
          {JSON.stringify(globalPageState)}
        </div>
      )}
    </div>
  );
};

// Export the global state for components to access
export const getPageState = (): GlobalPageState => globalPageState;

// Helper to update global state - expand to handle both main sections and dynamic keys
export const updatePageState = (section: string, data: any): void => {
  // Check if it's one of the main sections
  if (section === 'notifications' || section === 'feed' || section === 'challenges') {
    globalPageState[section].data = data;
    globalPageState[section].lastFetched = Date.now();
  } else {
    // Handle dynamic keys (like profile data)
    // Initialize the section if it doesn't exist
    if (!globalPageState[section]) {
      globalPageState[section] = {
        data: null,
        lastFetched: 0,
      };
    }

    // Update the data
    globalPageState[section].data = data;
    globalPageState[section].lastFetched = Date.now();
  }

  // Attempt to save immediately - but use a debounced approach
  if (isBrowser) {
    // Clear existing timeout if there is one
    if (window.nocenaSaveTimeout) {
      clearTimeout(window.nocenaSaveTimeout);
    }

    // Set a new timeout for 500ms
    window.nocenaSaveTimeout = setTimeout(() => {
      try {
        localStorage.setItem('nocena_page_state', JSON.stringify(globalPageState));
      } catch (error) {
        console.error('Failed to save page state update', error);
      }
    }, 500);
  }
};

// Add to global window for save debouncing
declare global {
  interface Window {
    nocenaSaveTimeout: ReturnType<typeof setTimeout>;
    nocena_app_timers: number[];
  }
}

export default PageManager;
