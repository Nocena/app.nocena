import React from 'react';

type ThematicColor = 'nocenaPink' | 'nocenaPurple' | 'nocenaBlue';

interface Props {
  disabled?: boolean;
  className?: string;
  isActive?: boolean;
  children?: React.ReactNode;
  color: ThematicColor;
  type?: HTMLButtonElement['type'];
  onClick?: (e: React.FormEvent<HTMLElement>) => void;
  asButton?: boolean; // Whether to render as a button or div
  rounded?: 'full' | 'xl'; // Specify border radius
  glassmorphic?: boolean; // New prop to toggle glassmorphic effect
}

const ThematicContainer: React.FC<Props> = ({
  children,
  onClick,
  className = '',
  isActive = false,
  disabled = false,
  color,
  type = 'button',
  asButton = true,
  rounded = 'full', // Default to full
  glassmorphic = false, // Default to false for backward compatibility
}) => {
  const getHexColor = () => {
    switch (color) {
      case 'nocenaPink':
        return '#FF15C9';
      case 'nocenaPurple':
        return '#6024FB';
      case 'nocenaBlue':
        return '#2353FF';
      default:
        return '#2353FF';
    }
  };

  const getContainerClasses = () => {
    let classes = 'relative text-lg font-medium font-sans transition-all duration-300';

    // Add rounded classes based on prop
    classes += rounded === 'full' ? ' rounded-full' : ' rounded-3xl';

    // Add border classes - thinner for glassmorphic
    if (glassmorphic) {
      classes += ' border border-white/20'; // Thin, semi-transparent white border for glass effect
    } else {
      classes += ' border-[1.5px]'; // Original border width
    }

    if (disabled) {
      classes += ' border-gray-700 text-gray-500 cursor-not-allowed';
    } else if (isActive) {
      classes += glassmorphic ? ' border-white/30 text-white' : ' border-transparent text-white';
      classes += asButton ? ' cursor-pointer' : '';
    } else {
      classes += glassmorphic ? ' border-white/20 text-white' : ' border-gray-700 text-white';
      classes += asButton ? ' cursor-pointer' : '';
    }

    // Add backdrop-blur for glassmorphic effect
    if (glassmorphic) {
      classes += ' backdrop-blur-md';
    }

    return classes;
  };

  const getBackgroundStyle = () => {
    if (disabled) {
      return glassmorphic ? { background: 'rgba(30, 30, 60, 0.3)' } : {};
    }

    if (isActive) {
      // For active state
      if (glassmorphic) {
        // Semi-transparent color when active and glassmorphic
        const hexColor = getHexColor();
        // Convert hex to rgba with 0.6 opacity
        const r = parseInt(hexColor.slice(1, 3), 16);
        const g = parseInt(hexColor.slice(3, 5), 16);
        const b = parseInt(hexColor.slice(5, 7), 16);
        return {
          background: `rgba(${r}, ${g}, ${b}, 0.6)`,
        };
      } else {
        // Solid color when active but not glassmorphic
        return {
          backgroundColor: getHexColor(),
        };
      }
    }

    // Default state background
    if (glassmorphic) {
      return {
        background: 'linear-gradient(to bottom, rgba(59, 60, 152, 0.2), rgba(37, 37, 90, 0.3))',
      };
    } else {
      // Original gradient
      return {
        background: 'linear-gradient(to bottom, #101010, #000740)',
      };
    }
  };

  const getGlowEffect = () => {
    if (disabled) return null;

    if (isActive && !glassmorphic) return null;

    return (
      <div
        className="absolute inset-x-0 top-0 h-[3px] overflow-hidden pointer-events-none"
        style={{
          top: glassmorphic ? '-1px' : '-1.5px',
          borderRadius: rounded === 'full' ? '9999px' : '16px',
        }}
      >
        <div
          className="absolute left-0 top-0 w-full h-full"
          style={{
            background: `radial-gradient(ellipse 50% 100% at center, ${getHexColor()} 0%, transparent 50%)`,
            filter: 'blur(1px)',
          }}
        />
      </div>
    );
  };

  // This adds the milky glass overlay for glassmorphic containers
  const getMilkyOverlay = () => {
    if (!glassmorphic || disabled) return null;

    return (
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.1), rgba(143, 164, 252, 0.05))',
          borderRadius: rounded === 'full' ? '9999px' : '16px',
          zIndex: -1,
        }}
      />
    );
  };

  const commonProps = {
    className: `${getContainerClasses()} ${className}`,
    style: getBackgroundStyle(),
  };

  if (asButton) {
    return (
      <div className="inline-block">
        <button type={type} onClick={disabled ? undefined : onClick} disabled={disabled} {...commonProps}>
          {getGlowEffect()}
          {getMilkyOverlay()}
          {children}
        </button>
      </div>
    );
  } else {
    // Render as a div
    return (
      <div {...commonProps} onClick={onClick ? (disabled ? undefined : onClick) : undefined}>
        {getGlowEffect()}
        {getMilkyOverlay()}
        {children}
      </div>
    );
  }
};

export default ThematicContainer;
