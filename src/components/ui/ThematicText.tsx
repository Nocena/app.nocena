import React from 'react';

interface ThematicTextProps {
  text: string;
  isActive?: boolean;
}

const ThematicText: React.FC<ThematicTextProps> = ({ text, isActive = false }) => {
  return (
    <div className="relative inline-block">
      {/* Glitch Effect */}
      {isActive && (
        <>
          <span className="absolute top-[-1px] left-0 text-nocenaPink font-thematic uppercase animate-glitchPink">
            {text}
          </span>
          <span className="absolute top-[1px] left-0 text-nocenaBlue font-thematic uppercase animate-glitchBlue">
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
