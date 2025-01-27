import React from 'react';

import HomeIcon from '../icons/home';
import MapIcon from '../icons/map';
import ChallengesIcon from '../icons/challenges';
import SearchIcon from '../icons/search';
import ProfileIcon from '../icons/profile';
import MenuIcon from '../icons/menu';
import PenIcon from '../icons/pen';
import SaveIcon from '../icons/save';

// Define props for the component
export interface ThematicIconProps {
  iconName: 'home' | 'map' | 'challenges' | 'search' | 'profile' | 'menu' | 'pen' | 'save';
  isActive?: boolean;
  className?: string;
  onClick?: () => void; 
}

// Map icon names to React components
const iconMap: Record<ThematicIconProps['iconName'], React.FC<React.SVGProps<SVGSVGElement>>> = {
  home: HomeIcon,
  map: MapIcon,
  challenges: ChallengesIcon,
  search: SearchIcon,
  profile: ProfileIcon,
  menu: MenuIcon,
  pen: PenIcon,
  save: SaveIcon
};

const ThematicIcon: React.FC<ThematicIconProps> = ({ iconName, isActive = false }) => {
  // Get the React component for the given iconName
  const IconComponent = iconMap[iconName];

  return (
    <div className="relative flex items-center justify-center">
      {/* Glitch Effect */}
      {isActive && (
        <>
          <IconComponent
            className="absolute -translate-x-[2px] -translate-y-[2px] text-nocenaPink animate-glitchPink"
          />
          <IconComponent
            className="absolute translate-x-[2px] translate-y-[2px] text-nocenaBlue animate-glitchBlue"
          />
        </>
      )}
      {/* Primary Icon */}
      <IconComponent
        className={`relative transition-opacity duration-300 ${
          isActive ? 'opacity-100' : 'opacity-70'
        }`}
      />
    </div>
  );
};

export default ThematicIcon;
