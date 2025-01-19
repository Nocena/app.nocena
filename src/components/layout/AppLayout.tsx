import React, { useState } from 'react';
import { useRouter } from 'next/router';
import Menu from './Menu';
import ThematicText from '../ui/ThematicText';
import ThematicIcon from '../ui/ThematicIcon';
import { ThematicIconProps } from '../ui/ThematicIcon';

interface AppLayoutProps {
  user: any;
  handleLogout: () => void;
  children: React.ReactNode;
}

const AppLayout: React.FC<AppLayoutProps> = ({ user, handleLogout, children }) => {
  const router = useRouter();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleNavClick = (index: number) => {
    const routeMapping: Record<number, string> = {
      0: '/home',
      1: '/map',
      2: '/challenges',
      3: '/search',
      4: '/profile',
    };

    router.push(routeMapping[index] || '/home');
    setCurrentIndex(index);
  };

  const handleMenuToggle = () => setIsMenuOpen((prev) => !prev);
  const handleMenuClose = () => setIsMenuOpen(false);

  const getPageTitle = (): string => {
    const titles = ['HOME', 'MAP', 'CHALLENGES', 'SEARCH', 'PROFILE'];
    return titles[currentIndex] || 'HOME';
  };

  return (
    <div className="app-container bg-nocenaBg min-h-screen w-full text-white flex flex-col">
      {/* Top Navbar */}
      <div className="navbar-top flex justify-between items-center px-3 py-2 fixed top-0 left-0 right-0 z-50 bg-nocenaBg">
        <button onClick={handleMenuToggle} className="z-9999">
          <ThematicIcon iconName="menu" isActive={isMenuOpen} />
        </button>
        <div className="flex-grow text-center">
          <ThematicText text={getPageTitle()} isActive />
        </div>
        <button onClick={() => handleNavClick(4)}>
          <ThematicIcon iconName="profile" isActive={currentIndex === 4} />
        </button>
      </div>

      {/* Side Menu */}
      <Menu isOpen={isMenuOpen} onClose={handleMenuClose} onLogout={handleLogout} />

      {/* Main Content */}
      <main className="flex-grow mt-12 pt-3">{children}</main>

      {/* Bottom Navbar */}
      <div className="navbar-bottom fixed bottom-0 left-0 right-0 py-8 flex justify-around bg-nocenaBg z-50 font-light">
        {(['home', 'map', 'challenges', 'search'] as ThematicIconProps['iconName'][]).map(
          (item, index) => (
            <button
              key={item}
              onClick={() => handleNavClick(index)}
              className={`text-center flex-grow ${
                currentIndex === index ? 'text-active' : 'text-white'
              }`}
            >
              <ThematicIcon iconName={item} isActive={currentIndex === index} />
              <div className="mt-2 capitalize">{item}</div>
            </button>
          )
        )}
      </div>
    </div>
  );
};

export default AppLayout;
