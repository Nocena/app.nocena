import React, { useEffect, useState, lazy, Suspense, useRef } from 'react';
import { useRouter } from 'next/router';

// Define proper types for page state
type PageStateSection = 'notifications' | 'feed' | 'challenges';

interface PageStateData<T = any> {  // Changed from any[] to any
  data: T | null;  // Added | null to allow null values
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

// Track page load status
interface PageLoadStatus {
  home: boolean;
  map: boolean;
  inbox: boolean;
  search: boolean;
  profile: boolean;
}

// Create a global state that persists between renders
const createPageState = (): GlobalPageState => {
  const state: GlobalPageState = {
    notifications: {
      data: [],
      lastFetched: 0
    },
    feed: {
      data: [],
      lastFetched: 0
    },
    challenges: {
      data: [],
      lastFetched: 0 
    }
  };
  
  // Load initial state from localStorage if available
  try {
    const savedState = localStorage.getItem('nocena_page_state');
    if (savedState) {
      const parsedState = JSON.parse(savedState);
      Object.assign(state, parsedState);
    }
  } catch (error) {
    console.error('Failed to load page state', error);
  }
  
  return state;
};

// Initialize global state
const globalPageState: GlobalPageState = createPageState();

// Create a custom event for page visibility changes
const createVisibilityEvent = (pageName: string, isVisible: boolean): CustomEvent => {
  return new CustomEvent('pageVisibilityChange', {
    detail: { pageName, isVisible }
  });
};

// Simple loading skeletons for each page
const HomeLoading = () => <div className="p-4 animate-pulse h-screen bg-nocenaBg opacity-50"></div>;
const MapLoading = () => <div className="p-4 animate-pulse h-screen bg-nocenaBg opacity-50"></div>;
const InboxLoading = () => <div className="p-4 animate-pulse h-screen bg-nocenaBg opacity-50"></div>;
const SearchLoading = () => <div className="p-4 animate-pulse h-screen bg-nocenaBg opacity-50"></div>;
const ProfileLoading = () => <div className="p-4 animate-pulse h-screen bg-nocenaBg opacity-50"></div>;

// Lazy load the page components using their correct paths
const HomePage = lazy(() => import('../pages/home/index'));
const MapPage = lazy(() => import('../pages/map/index'));
const InboxPage = lazy(() => import('../pages/inbox/index'));
const SearchPage = lazy(() => import('../pages/search/index'));
const ProfilePage = lazy(() => import('../pages/profile/index'));

// Interface for route change event
interface RouteChangeEvent {
  from: string;
  to: string;
}

const PageManager: React.FC = () => {
  const router = useRouter();
  const [activeRoute, setActiveRoute] = useState('/home');
  const [loadedPages, setLoadedPages] = useState<string[]>([]);
  
  // Keep track of previous active route for transition effects
  const prevRouteRef = useRef(activeRoute);
  
  // Track when a page has fully loaded
  const [pageLoadStatus, setPageLoadStatus] = useState<PageLoadStatus>({
    home: false,
    map: false,
    inbox: false,
    search: false,
    profile: false
  });
  
  useEffect(() => {
    // Update active route when router changes
    if (router.pathname) {
      const prevRoute = prevRouteRef.current;
      setActiveRoute(router.pathname);
      prevRouteRef.current = router.pathname;
      
      // Dispatch route change event for components to detect
      window.dispatchEvent(new CustomEvent('routeChange', {
        detail: {
          from: prevRoute,
          to: router.pathname
        } as RouteChangeEvent
      }));
      
      // Add this page to loaded pages if not already loaded
      if (!loadedPages.includes(router.pathname)) {
        setLoadedPages(prev => [...prev, router.pathname]);
      }
    }
  }, [router.pathname, loadedPages]);

  // Preload adjacent pages after the first page is loaded
  useEffect(() => {
    if (loadedPages.length === 1) {
      // After first page load, schedule preloading of other main pages
      const timer = setTimeout(() => {
        const pagesToPreload = ['/home', '/map', '/inbox', '/search', '/profile']
          .filter(page => !loadedPages.includes(page));
          
        if (pagesToPreload.length > 0) {
          setLoadedPages(prevPages => [...prevPages, ...pagesToPreload]);
        }
      }, 1000); // Reduce to 1 second for faster preloading
      
      return () => clearTimeout(timer);
    }
  }, [loadedPages]);
  
  // Notify pages about their visibility status
  useEffect(() => {
    // Trigger visibility events for pages
    const routes = [
      { path: '/home', name: 'home' }, 
      { path: '/map', name: 'map' }, 
      { path: '/inbox', name: 'inbox' }, 
      { path: '/search', name: 'search' }, 
      { path: '/profile', name: 'profile' }
    ];
    
    routes.forEach(route => {
      const isVisible = 
        route.path === activeRoute || 
        (route.path === '/profile' && activeRoute.startsWith('/profile/'));
      
      window.dispatchEvent(createVisibilityEvent(route.name, isVisible));
    });
  }, [activeRoute]);
  
  // Save state to localStorage periodically
  useEffect(() => {
    const saveInterval = setInterval(() => {
      try {
        localStorage.setItem('nocena_page_state', JSON.stringify(globalPageState));
      } catch (error) {
        console.error('Failed to save page state', error);
      }
    }, 5000); // Every 5 seconds
    
    return () => clearInterval(saveInterval);
  }, []);

  // Handle active route that might contain dynamic segments (like /profile/[id])
  const isProfileRoute = activeRoute === '/profile' || activeRoute.startsWith('/profile/');
  const isHomeRoute = activeRoute === '/home';
  const isMapRoute = activeRoute === '/map';
  const isInboxRoute = activeRoute === '/inbox';
  const isSearchRoute = activeRoute === '/search';
  
  // Component render callbacks 
  const onHomeLoaded = () => setPageLoadStatus(prev => ({ ...prev, home: true }));
  const onMapLoaded = () => setPageLoadStatus(prev => ({ ...prev, map: true }));
  const onInboxLoaded = () => setPageLoadStatus(prev => ({ ...prev, inbox: true }));
  const onSearchLoaded = () => setPageLoadStatus(prev => ({ ...prev, search: true }));
  const onProfileLoaded = () => setPageLoadStatus(prev => ({ ...prev, profile: true }));

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
            transition: 'opacity 0.2s ease-in-out'
          }}
        >
          <Suspense fallback={<HomeLoading />}>
            <HomePage />
          </Suspense>
          {isHomeRoute && <div style={{ display: 'none' }} onLoad={onHomeLoaded} />}
        </div>
      )}
      
      {(loadedPages.includes('/map') || isMapRoute) && (
        <div 
          id="map-page-container"
          className="page-transition"
          style={{ 
            display: isMapRoute ? 'block' : 'none',
            opacity: isMapRoute ? 1 : 0,
            transition: 'opacity 0.2s ease-in-out'
          }}
        >
          <Suspense fallback={<MapLoading />}>
            <MapPage />
          </Suspense>
          {isMapRoute && <div style={{ display: 'none' }} onLoad={onMapLoaded} />}
        </div>
      )}
      
      {(loadedPages.includes('/inbox') || isInboxRoute) && (
        <div 
          id="inbox-page-container"
          className="page-transition"
          style={{ 
            display: isInboxRoute ? 'block' : 'none',
            opacity: isInboxRoute ? 1 : 0,
            transition: 'opacity 0.2s ease-in-out'
          }}
        >
          <Suspense fallback={<InboxLoading />}>
            <InboxPage />
          </Suspense>
          {isInboxRoute && <div style={{ display: 'none' }} onLoad={onInboxLoaded} />}
        </div>
      )}
      
      {(loadedPages.includes('/search') || isSearchRoute) && (
        <div 
          id="search-page-container"
          className="page-transition"
          style={{ 
            display: isSearchRoute ? 'block' : 'none',
            opacity: isSearchRoute ? 1 : 0,
            transition: 'opacity 0.2s ease-in-out'
          }}
        >
          <Suspense fallback={<SearchLoading />}>
            <SearchPage />
          </Suspense>
          {isSearchRoute && <div style={{ display: 'none' }} onLoad={onSearchLoaded} />}
        </div>
      )}
      
      {(loadedPages.includes('/profile') || isProfileRoute) && (
        <div 
          id="profile-page-container"
          className="page-transition"
          style={{ 
            display: isProfileRoute ? 'block' : 'none',
            opacity: isProfileRoute ? 1 : 0,
            transition: 'opacity 0.2s ease-in-out'
          }}
        >
          <Suspense fallback={<ProfileLoading />}>
            <ProfilePage />
          </Suspense>
          {isProfileRoute && <div style={{ display: 'none' }} onLoad={onProfileLoaded} />}
        </div>
      )}
      
      {/* Export the global state to the window for debugging */}
      <div style={{ display: 'none' }} id="nocena-debug-state">
        {JSON.stringify(globalPageState)}
      </div>
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
        lastFetched: 0
      };
    }
    
    // Update the data
    globalPageState[section].data = data;
    globalPageState[section].lastFetched = Date.now();
  }
  
  // Attempt to save immediately
  try {
    localStorage.setItem('nocena_page_state', JSON.stringify(globalPageState));
  } catch (error) {
    console.error('Failed to save page state update', error);
  }
};

export default PageManager;