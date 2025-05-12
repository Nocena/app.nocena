import React from 'react';
import MenuIcon from '../icons/menu';
import ProfileIcon from '../icons/profile';
import ThematicContainer from '../ui/ThematicContainer'; // Import ThematicContainer

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
      
      {/* Profile button using ThematicContainer */}
      <button 
        onClick={() => handleNavClick(4)}
        className="focus:outline-none pointer-events-auto"
        aria-label="Profile"
      >
        <ThematicContainer
          color={isProfileActive ? "nocenaPink" : "nocenaBlue"}
          glassmorphic={true}
          asButton={false}
          rounded="full"
          className="w-12 h-12 flex items-center justify-center"
        >
          <ProfileIcon 
            className="transition-colors duration-300"
            style={{ color: 'white' }}
          />
        </ThematicContainer>
      </button>
    </div>
  );
};

export default TopNavbar;