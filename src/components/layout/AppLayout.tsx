import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../../contexts/AuthContext';
import { fetchUnreadNotificationsCount, markNotificationsAsRead } from "../../lib/api/dgraph";

import Menu from './Menu';
import ThematicText from '../ui/ThematicText';
import ThematicIcon from '../ui/ThematicIcon';
import { ThematicIconProps } from '../ui/ThematicIcon';

interface AppLayoutProps {
  handleLogout: () => void;
  children: React.ReactNode;
}

const AppLayout: React.FC<AppLayoutProps> = ({ handleLogout, children }) => {
  const router = useRouter();
  const { user } = useAuth();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!user?.id) return;

    const checkUnreadNotifications = async () => {
      const count = await fetchUnreadNotificationsCount(user.id);
      setUnreadCount(count);
    };

    checkUnreadNotifications();

    const interval = setInterval(checkUnreadNotifications, 30000);
    return () => clearInterval(interval);
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

    // Check if the current path is in our mapping
    const index = pathToIndexMap[router.pathname];
    if (index !== undefined) {
      setCurrentIndex(index);
    }
  }, [router.pathname]);

  const isUserProfile = router.pathname.startsWith('/profile/') && router.query.walletAddress !== user?.wallet;

  const handleNavClick = async (index: number) => {
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
    }

    const route =
      index === 6 && user?.wallet
        ? `/profile/${user.id}`
        : routeMapping[index] || '/home';

    router.push(route);
  };

  const handleMenuToggle = () => {
    setIsMenuOpen((prev) => !prev);
  };

  const handleMenuClose = () => {
    setIsMenuOpen(false);
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

  return (
    <div className="app-container bg-nocenaBg min-h-screen w-full text-white flex flex-col">
      {/* Top Navbar - with top safe area padding */}
      <div className="navbar-top flex justify-between items-center px-3 py-2 fixed top-0 left-0 right-0 z-50 bg-nocenaBg pt-[env(safe-area-inset-top)]">
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

      {/* Side Menu */}
      <Menu isOpen={isMenuOpen} onClose={handleMenuClose} onLogout={handleLogout} />

      {/* Main Content - with margin to account for top navbar + safe area */}
      <main className="flex-grow mt-[calc(3rem+env(safe-area-inset-top))] pt-3">
        {children}
      </main>

      {/* Bottom Navbar - with bottom safe area padding */}
      <div className="navbar-bottom fixed bottom-0 left-0 right-0 py-8 flex justify-around bg-nocenaBg z-50 font-light pb-[env(safe-area-inset-bottom)]">
        {(['home', 'map', 'inbox', 'search'] as ThematicIconProps['iconName'][]).map((item, index) => (
          <button
            key={item}
            onClick={() => handleNavClick(index)}
            className={`relative text-center flex-grow ${currentIndex === index && !isUserProfile ? 'text-active' : 'text-white'}`}
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