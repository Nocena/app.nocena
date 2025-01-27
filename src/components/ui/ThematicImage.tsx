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
          <div className="absolute inset-0 rounded-full border-[1px] border-nocenaPink transform -translate-x-[2px] -translate-y-[2px] animate-glitchPink z-10"></div>
          <div className="absolute inset-0 rounded-full border-[1px] border-nocenaBlue transform translate-x-[2px] translate-y-[2px] animate-glitchBlue z-10"></div>
        </>
      )}
      {/* Main Border */}
      <div className="absolute inset-0 border-[1px] border-nocenaPink rounded-full transform translate-y-[-3px] z-10"></div>
      <div className="absolute inset-0 border-[1px] border-nocenaBlue rounded-full transform translate-y-[3px] z-10"></div>
      {/* Content */}
      <div className="relative rounded-full border-[1px] border-white">
        {children}
      </div>
    </div>
  );
};

export default ThematicImage;
