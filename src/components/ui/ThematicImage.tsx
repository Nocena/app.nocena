import React from 'react';

export interface ThematicImageProps {
  className?: string;
  children: React.ReactNode;
}

const ThematicImage: React.FC<ThematicImageProps> = ({ className = '', children }) => {
  return (
    <div className={`relative inline-block rounded-full border-[1px] border-nocenaPink p-1 ${className}`}>
      {children}
    </div>
  );
};

export default ThematicImage;
