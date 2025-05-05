import React from 'react';

export interface ThematicImageProps {
  className?: string;
  children: React.ReactNode;
}

const ThematicImage: React.FC<ThematicImageProps> = ({ className = '', children }) => {
  return (
    <div className={`border-nocena-pink relative inline-block rounded-full border-[1px] p-1 ${className}`}>
      {children}
    </div>
  );
};

export default ThematicImage;
