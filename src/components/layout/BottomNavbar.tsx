import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import MapIcon from '../icons/map';
import InboxIcon from '../icons/inbox';
import SearchIcon from '../icons/search';
import ThematicContainer from '../ui/ThematicContainer';

interface BottomNavbarProps {
  currentIndex: number;
  handleNavClick: (index: number) => void;
  unreadCount: number;
  className?: string;
  style?: React.CSSProperties;
}

// Navigation items configuration
const NAV_ITEMS = [
  { 
    name: 'Home', 
    icon: 'home',
    label: 'Home',
    color: '#000000',
    gradientColor: '#00006A',
    thematicColor: 'nocenaBlue'
  },
  { 
    name: 'Map', 
    icon: 'map',
    label: 'Map',
    color: '#FF40A9',
    gradientColor: '#F95FD6',
    thematicColor: 'nocenaPink'
  },
  { 
    name: 'Inbox', 
    icon: 'inbox',
    label: 'Inbox',
    color: '#6A4CFF',
    gradientColor: '#8965FF',
    thematicColor: 'nocenaPurple'
  },
  { 
    name: 'Search', 
    icon: 'search',
    label: 'Search',
    color: '#2353FF',
    gradientColor: '#002ED3',
    thematicColor: 'nocenaBlue'
  }
];

const BottomNavbar: React.FC<BottomNavbarProps> = ({
  currentIndex,
  handleNavClick,
  unreadCount,
}) => {
  const [isMobile, setIsMobile] = useState(false);

  // Handle responsive behavior
  useEffect(() => {
    const checkScreenSize = () => setIsMobile(window.innerWidth < 768);
    
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  // Get the current thematic color based on active tab
  const getThematicColor = () => {
    if (currentIndex >= 0 && currentIndex < NAV_ITEMS.length) {
      return NAV_ITEMS[currentIndex].thematicColor as any; // Cast to any to avoid type issues
    }
    return 'nocenaPurple'; // Default color
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[9990]">
      <div className="flex justify-center items-center p-1 pb-3">
        {/* Using ThematicContainer as a wrapper with dynamic color */}
        <ThematicContainer
          color={getThematicColor()}
          glassmorphic={true}
          asButton={false}
          rounded="full"
          className="p-1 flex items-center justify-center"
        >
          {NAV_ITEMS.map((item, index, array) => {
            const isActive = currentIndex === index;
            const isFirst = index === 0;
            const isLast = index === array.length - 1;
            
            return (
              <div
                key={item.name}
                onClick={() => handleNavClick(index)}
                className={`
                  relative flex items-center justify-center cursor-pointer overflow-hidden
                  transition-all duration-300 ease-in-out rounded-full
                  ${isFirst ? 'ml-0' : 'ml-1'} ${isLast ? 'mr-0' : 'mr-1'}
                  ${isActive ? 'shadow-lg z-10' : `z-${5-index}`}
                `}
                style={{ 
                  width: isActive ? (isMobile ? 120 : 150) : 48,
                  height: 48
                }}
              >
                {/* Active state with label */}
                {isActive && (
                  <div 
                    className="absolute inset-0 rounded-full flex items-center"
                    style={{ 
                      background: `linear-gradient(270deg, ${item.color} 0%, ${item.gradientColor} 100%)`
                    }}
                  >
                    <div className="font-medium text-lg text-white absolute" style={{ left: '56px' }}>
                      {item.label}
                    </div>
                  </div>
                )}
                
                {/* Icon circle - always visible */}
                <div 
                  className={`
                    absolute left-0 top-0 flex items-center justify-center rounded-full
                    ${isActive ? 'z-20 shadow-md' : 'z-10'}
                  `}
                  style={{
                    width: 48,
                    height: 48,
                    backgroundColor: item.color
                  }}
                >
                  {renderIcon(item, unreadCount)}
                </div>
              </div>
            );
          })}
        </ThematicContainer>
      </div>
    </div>
  );
};

// Helper function to render the appropriate icon
function renderIcon(item: typeof NAV_ITEMS[0], unreadCount: number) {
  switch (item.icon) {
    case 'home':
      return (
        <div className="relative w-8 h-8">
          <Image 
            src="/nocena_dark.ico" 
            alt="Home" 
            width={32}
            height={32}
            className="object-contain scale-150"
          />
        </div>
      );
    
    case 'map':
      return <MapIcon />;
    
    case 'inbox':
      return (
        <div className="relative">
          <InboxIcon />
          {unreadCount > 0 && (
            <div className="absolute top-0 -right-0.5 w-2 h-2 bg-pink-500 rounded-full" />
          )}
        </div>
      );
    
    case 'search':
      return <SearchIcon />;
    
    default:
      return null;
  }
}

export default BottomNavbar;