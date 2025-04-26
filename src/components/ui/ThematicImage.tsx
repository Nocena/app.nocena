import React from 'react';

export interface ThematicImageProps {
  className?: string;
  isActive?: boolean;
  children: React.ReactNode;
}

const ThematicImage: React.FC<ThematicImageProps> = ({ className = '', isActive = false, children }) => {
  return (
    <div className={`relative inline-block ${className}`}>
      {/* Glitch Effect */}
      {isActive && (
        <>
          <div className="absolute inset-0 rounded-full border-[1px] border-nocena-pink transform -translate-x-[2px] -translate-y-[2px] animate-glitch-pink z-10"></div>
          <div className="absolute inset-0 rounded-full border-[1px] border-nocena-blue transform translate-x-[2px] translate-y-[2px] animate-glitch-blue z-10"></div>
        </>
      )}
      {/* Main Border */}
      <div className="absolute inset-0 border-[1px] border-nocena-pink rounded-full transform translate-y-[-3px] z-10"></div>
      <div className="absolute inset-0 border-[1px] border-nocena-blue rounded-full transform translate-y-[3px] z-10"></div>
      {/* Content */}
      <div className="relative rounded-full border-[1px] border-white">{children}</div>
    </div>
  );
};

export default ThematicImage;
