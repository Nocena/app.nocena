import React from 'react';

import HomeIcon from '../icons/home';
import MapIcon from '../icons/map';
import InboxIcon from '../icons/inbox';
import SearchIcon from '../icons/search';
import ProfileIcon from '../icons/profile';
import MenuIcon from '../icons/menu';
import PenIcon from '../icons/pen';
import SaveIcon from '../icons/save';

// Define props for the component
export interface ThematicIconProps {
  iconName: 'home' | 'map' | 'inbox' | 'search' | 'profile' | 'menu' | 'pen' | 'save';
  isActive?: boolean;
  className?: string;
  onClick?: () => void;
}

// Map icon names to React components
const iconMap: Record<ThematicIconProps['iconName'], React.FC<React.SVGProps<SVGSVGElement>>> = {
  home: HomeIcon,
  map: MapIcon,
  inbox: InboxIcon,
  search: SearchIcon,
  profile: ProfileIcon,
  menu: MenuIcon,
  pen: PenIcon,
  save: SaveIcon,
};

const ThematicIcon: React.FC<ThematicIconProps> = ({ iconName, isActive = false }) => {
  // Get the React component for the given iconName
  const IconComponent = iconMap[iconName];

  return (
    <div className="relative flex items-center justify-center">
      {/* Glitch Effect */}
      {isActive && (
        <>
          <IconComponent className="absolute -translate-x-[2px] -translate-y-[2px] text-nocena-pink animate-glitch-pink" />
          <IconComponent className="absolute translate-x-[2px] translate-y-[2px] text-nocena-blue animate-glitch-blue" />
        </>
      )}
      {/* Primary Icon */}
      <IconComponent
        className={`relative transition-opacity duration-300 ${isActive ? 'opacity-100' : 'opacity-70'}`}
      />
    </div>
  );
};

export default ThematicIcon;
