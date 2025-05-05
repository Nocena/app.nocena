import React from 'react';
import MenuIcon from '../icons/menu';
import ProfileIcon from '../icons/profile';

interface TopNavbarProps {
  currentIndex: number;
  isUserProfile: boolean;
  isSpecialPage: boolean;
  handleMenuToggle: () => void;
  handleNavClick: (index: number) => void;
}

const TopNavbar: React.FC<TopNavbarProps> = ({
  currentIndex,
  isUserProfile,
  isSpecialPage,
  handleMenuToggle,
  handleNavClick,
}) => {
  // Determine if profile is active
  const isProfileActive = currentIndex === 4 && !isUserProfile && !isSpecialPage;

  return (
    <div
      className="flex justify-between items-center px-4 fixed top-0 left-0 right-0 z-50 pointer-events-none mt-4"
      style={{
        paddingTop: 'env(safe-area-inset-top)',
        paddingBottom: '0.5rem',
      }}
    >
      {/* Menu button - rotated 180 degrees */}
      <button 
        onClick={handleMenuToggle} 
        className="focus:outline-none p-2 pointer-events-auto transform rotate-180"
        aria-label="Menu"
      >
        <MenuIcon />
      </button>
      
      {/* Empty middle section */}
      <div className="flex-grow"></div>
      
      {/* Profile button with glassmorphic background */}
      <button 
        onClick={() => handleNavClick(4)}
        className="focus:outline-none p-2 pointer-events-auto"
        aria-label="Profile"
      >
        <div 
          className="w-12 h-12 rounded-full flex items-center justify-center"
          style={{
            background: 'rgba(255, 255, 255, 0.2)',
            backdropFilter: 'blur(8px)',
            border: '1px solid rgba(255, 255, 255, 0.5)'
          }}
        >
          <ProfileIcon 
            className="transition-colors duration-300"
            style={{ color: isProfileActive ? '#FF40A9' : 'white' }} 
          />
        </div>
      </button>
    </div>
  );
};

export default TopNavbar;