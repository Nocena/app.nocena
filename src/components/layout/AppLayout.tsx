import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../../contexts/AuthContext'; // Import AuthContext for user
import HomeView from '@pages/home';
import MapView from '@pages/map';
import ChallengesView from '@pages/challenges';
import SearchView from '@pages/search';
import ProfileView from '@pages/profile';
import OtherProfileView from '@pages/profile/[walletAddress]';
import CompletingView from '@pages/completing';
import CreateChallengeView from '@pages/createchallenge';

import Menu from './Menu';
import ThematicText from '../ui/ThematicText';
import ThematicIcon from '../ui/ThematicIcon';
import { ThematicIconProps } from '../ui/ThematicIcon';

// Define a props type that includes children.
interface AppLayoutProps {
  handleLogout: () => void;
  children: React.ReactNode;
}

const AppLayout: React.FC<AppLayoutProps> = ({ handleLogout, children }) => {
  const router = useRouter();
  const { user } = useAuth(); // Access user from context
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    // Map route paths to current index for navigation highlighting
    const routeMapping: Record<string, number> = {
      '/home': 0,
      '/map': 1,
      '/challenges': 2,
      '/search': 3,
      '/profile': 4,
      '/completing': 5,
      '/profile/': 6, // Matches dynamic routes like /profile/:walletAddress
      '/createchallenge': 7,
    };

    const matchedRoute = Object.keys(routeMapping).find((path) =>
      router.pathname === path || (path.endsWith('/') && router.pathname.startsWith(path))
    );

    setCurrentIndex(routeMapping[matchedRoute || '/home'] || 0);
  }, [router.pathname]);

  const handleNavClick = (index: number) => {
    setCurrentIndex(index);

    const routeMapping: Record<number, string> = {
      0: '/home',
      1: '/map',
      2: '/challenges',
      3: '/search',
      4: '/profile',
      5: '/completing',
      6: '/profile',
      7: '/createchallenge',
    };

    // Use dynamic routing for OtherProfileView
    const route =
      index === 6 && user?.wallet
        ? `/profile/${user.wallet}` // Use wallet from context
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
    const titles = [
      'HOME',
      'MAP',
      'CHALLENGES',
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
      {/* Top Navbar */}
      <div className="navbar-top flex justify-between items-center px-3 py-2 fixed top-0 left-0 right-0 z-50 bg-nocenaBg">
        <div className="flex items-center">
          <button onClick={handleMenuToggle} className="z-9999">
            <ThematicIcon iconName="menu" isActive={isMenuOpen} />
          </button>
        </div>
        <div className="flex-grow text-center">
          <ThematicText text={getPageTitle()} isActive />
        </div>
        <div className="flex items-center">
          <button onClick={() => handleNavClick(4)}>
            <ThematicIcon iconName="profile" isActive={currentIndex === 4} />
          </button>
        </div>
      </div>

      {/* Side Menu */}
      <Menu isOpen={isMenuOpen} onClose={handleMenuClose} onLogout={handleLogout} />

      {/* Main Content */}
      <main className="flex-grow mt-12 pt-3">
        {children}
      </main>

      {/* Bottom Navbar */}
      <div className="navbar-bottom fixed bottom-0 left-0 right-0 py-8 flex justify-around bg-nocenaBg z-50 font-light">
        {(['home', 'map', 'challenges', 'search'] as ThematicIconProps['iconName'][]).map((item, index) => (
          <button
            key={item}
            onClick={() => handleNavClick(index)}
            className={`text-center flex-grow ${currentIndex === index ? 'text-active' : 'text-white'}`}
          >
            <ThematicIcon iconName={item} isActive={currentIndex === index} />
            <div className="mt-2 capitalize">{item}</div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default AppLayout;
