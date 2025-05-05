import React from 'react';

interface ThematicTextProps {
  text: string;
  isActive?: boolean;
  className?: string;
}

const ThematicText: React.FC<ThematicTextProps> = ({ text, isActive = false }) => {
  return (
    <div className="relative inline-block">
      {/* Glitch Effect */}
      {isActive && (
        <>
          <span className="text-nocena-pink font-thematic animate-glitch-pink absolute top-[-1px] left-0 uppercase">
            {text}
          </span>
          <span className="text-nocena-blue font-thematic animate-glitch-blue absolute top-[1px] left-0 uppercase">
            {text}
          </span>
        </>
      )}
      {/* Thematic Text */}
      <span
        className={`font-thematic relative text-white uppercase transition-all duration-300 ${
          isActive ? 'opacity-100' : 'opacity-70'
        }`}
      >
        {text}
      </span>
    </div>
  );
};

export default ThematicText;
