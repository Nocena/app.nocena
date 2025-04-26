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
          <span className="absolute top-[-1px] left-0 text-nocena-pink font-thematic uppercase animate-glitch-pink">
            {text}
          </span>
          <span className="absolute top-[1px] left-0 text-nocena-blue font-thematic uppercase animate-glitch-blue">
            {text}
          </span>
        </>
      )}
      {/* Thematic Text */}
      <span
        className={`relative text-white font-thematic uppercase transition-all duration-300 ${
          isActive ? 'opacity-100' : 'opacity-70'
        }`}
      >
        {text}
      </span>
    </div>
  );
};

export default ThematicText;
