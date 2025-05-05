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
    let classes = 'relative border-[1.5px] text-lg font-medium font-sans transition-all duration-300';
    
    // Add rounded classes based on prop
    classes += rounded === 'full' ? ' rounded-full' : ' rounded-3xl';
    
    if (disabled) {
      classes += ' border-gray-700 text-gray-500 cursor-not-allowed';
    } else if (isActive) {
      classes += ' border-transparent text-white';
      classes += asButton ? ' cursor-pointer' : '';
    } else {
      classes += ' border-gray-700 text-white';
      classes += asButton ? ' cursor-pointer' : '';
    }
    
    return classes;
  };

  const getBackgroundStyle = () => {
    if (disabled) {
      return {};
    }
    
    if (isActive) {
      // Solid color when active
      return {
        backgroundColor: getHexColor(),
      };
    }
    
    // Linear gradient background for default state (top to bottom)
    return {
      background: 'linear-gradient(to bottom, #101010, #000740)',
    };
  };

  const getGlowEffect = () => {
    if (disabled || isActive) return null;
    
    return (
      <div
        className="absolute inset-x-0 top-0 h-[3px] overflow-hidden rounded-full pointer-events-none"
        style={{ top: '-1.5px' }}
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

  const commonProps = {
    className: `${getContainerClasses()} ${className}`,
    style: getBackgroundStyle(),
  };

  if (asButton) {
    return (
      <div className="inline-block">
        <button
          type={type}
          onClick={disabled ? undefined : onClick}
          disabled={disabled}
          {...commonProps}
        >
          {getGlowEffect()}
          {children}
        </button>
      </div>
    );
  } else {
    // Render as a div
    return (
      <div
        {...commonProps}
        onClick={onClick ? (disabled ? undefined : onClick) : undefined}
      >
        {getGlowEffect()}
        {children}
      </div>
    );
  }
};

export default ThematicContainer;