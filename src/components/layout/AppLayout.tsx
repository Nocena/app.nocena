import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../../contexts/AuthContext';
import { fetchUnreadNotificationsCount, markNotificationsAsRead } from "../../lib/api/dgraph";

import Menu from './Menu';
import ThematicText from '../ui/ThematicText';
import ThematicIcon from '../ui/ThematicIcon';
import { ThematicIconProps } from '../ui/ThematicIcon';
import PageManager from '../PageManager';
import MemoryOptimizer from '../MemoryOptimizer'; // New component for memory optimization

interface AppLayoutProps {
  handleLogout: () => void;
  children?: React.ReactNode;
}

const AppLayout: React.FC<AppLayoutProps> = ({ handleLogout, children }) => {
  const router = useRouter();
  const { user } = useAuth();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [appIsVisible, setAppIsVisible] = useState(true);

  // More efficient unread notifications check with caching and visibility detection
  useEffect(() => {
    if (!user?.id) return;

    const checkUnreadNotifications = async () => {
      try {
        const count = await fetchUnreadNotificationsCount(user.id);
        setUnreadCount(count);
        
        // Cache the count in localStorage to show immediately on next app open
        localStorage.setItem('nocena_unread_count', JSON.stringify({
          count,
          timestamp: Date.now()
        }));
      } catch (error) {
        console.error('Failed to fetch unread count', error);
      }
    };

    // Try to get cached count first for instant display
    try {
      const cachedData = localStorage.getItem('nocena_unread_count');
      if (cachedData) {
        const { count, timestamp } = JSON.parse(cachedData);
        // Only use cache if less than 5 minutes old
        if (Date.now() - timestamp < 300000) {
          setUnreadCount(count);
        }
      }
    } catch (error) {
      console.error('Error reading cached notification count', error);
    }

    // Initial check
    checkUnreadNotifications();

    // Set up interval for checking unread notifications
    // Only run checks when app is visible to save battery
    const interval = setInterval(() => {
      if (appIsVisible) {
        checkUnreadNotifications();
      }
    }, 30000);
    
    return () => clearInterval(interval);
  }, [user?.id, appIsVisible]);

  // App visibility handler to optimize performance
  useEffect(() => {
    const handleVisibilityChange = () => {
      setAppIsVisible(document.visibilityState === 'visible');
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Also listen for our custom events
    const handleBackgroundEvent = () => setAppIsVisible(false);
    const handleForegroundEvent = () => {
      setAppIsVisible(true);
      // Refresh notification count when app comes to foreground
      if (user?.id) {
        fetchUnreadNotificationsCount(user.id)
          .then(count => setUnreadCount(count))
          .catch(error => console.error('Failed to refresh notifications', error));
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

  // Memoized navigation handler to prevent unnecessary rerenders
  const handleNavClick = useCallback(async (index: number) => {
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

    if (index === 2 && user?.id) {
      await markNotificationsAsRead(user.id);
      setUnreadCount(0);
      
      // Update the cache to reflect read notifications
      localStorage.setItem('nocena_unread_count', JSON.stringify({
        count: 0,
        timestamp: Date.now()
      }));
    }

    const route =
      index === 6 && user?.wallet
        ? `/profile/${user.id}`
        : routeMapping[index] || '/home';

    // Add shallow routing to prevent full page reload
    router.push(route, undefined, { shallow: true });
  }, [router, user?.id, user?.wallet]);

  const handleMenuToggle = () => {
    setIsMenuOpen((prev) => !prev);
  };

  const handleMenuClose = () => {
    setIsMenuOpen(false);
  };

  // Create a proper logout handler that ensures full page reload
  const handleAppLogout = () => {
    // First close the menu
    setIsMenuOpen(false);
    
    // Call the original logout handler from props
    handleLogout();
    
    // Clear any app state from localStorage before redirecting
    try {
      localStorage.removeItem('nocena_page_state');
      localStorage.removeItem('nocena_unread_count');
      localStorage.removeItem('nocena_cached_notifications');
    } catch (error) {
      console.error('Failed to clear cached data during logout', error);
    }
    
    // Force a full page navigation to ensure clean state
    window.location.href = '/login';
  };

  const getPageTitle = () => {
    if (isUserProfile) return 'USER PROFILE';

    const titles = [
      'HOME',
      'MAP',
      'INBOX',
      'SEARCH',
      'PROFILE',
      'COMPLETING CHALLENGE',
      'USER PROFILE',
      'CREATE CHALLENGE',
    ];
    return titles[currentIndex] || 'HOME';
  };

  // Determine whether to use PageManager or direct children
  const usePageManager = !router.pathname.startsWith('/completing') && 
                        !router.pathname.startsWith('/createchallenge') &&
                        children === undefined;

  return (
    <div className="app-container bg-nocenaBg min-h-screen w-full text-white flex flex-col">
      {/* Add the memory optimizer for background/foreground handling */}
      <MemoryOptimizer />
      
      {/* Top Navbar - with top safe area padding */}
      <div className="navbar-top flex justify-between items-center px-3 py-2 fixed top-0 left-0 right-0 z-50 bg-nocenaBg">
        <div className="flex items-center">
          <button onClick={handleMenuToggle} className="z-50">
            <ThematicIcon iconName="menu" isActive={isMenuOpen} />
          </button>
        </div>
        <div className="flex-grow text-center">
          <ThematicText text={getPageTitle()} isActive />
        </div>
        <div className="flex items-center">
          <button onClick={() => handleNavClick(4)}>
            <ThematicIcon iconName="profile" isActive={currentIndex === 4 && !isUserProfile} />
          </button>
        </div>
      </div>

      {/* Side Menu - pass the new logout handler */}
      <Menu isOpen={isMenuOpen} onClose={handleMenuClose} onLogout={handleAppLogout} />

      {/* Main Content - conditionally use PageManager or children */}
      <main className="flex-grow mt-[calc(3rem+env(safe-area-inset-top))] pt-3">
        {usePageManager ? <PageManager /> : children}
      </main>

      {/* Bottom Navbar - with bottom safe area padding */}
      <div className="navbar-bottom fixed bottom-0 left-0 right-0 flex justify-around bg-nocenaBg z-50 font-light">
        {(['home', 'map', 'inbox', 'search'] as ThematicIconProps['iconName'][]).map((item, index) => (
          <button
            key={item}
            onClick={() => handleNavClick(index)}
            className={`relative text-center flex-grow p-2 ${currentIndex === index && !isUserProfile ? 'text-active' : 'text-white'}`}
          >
            <ThematicIcon iconName={item} isActive={currentIndex === index && !isUserProfile} />
            
            {item === 'inbox' && unreadCount > 0 && (
              <span className="absolute top-1 right-6 w-2 h-2 bg-nocenaPink rounded-full animate-pulse transition-all duration-700 ease-in-out" />
            )}

            <div className="mt-2 capitalize">{item}</div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default AppLayout;