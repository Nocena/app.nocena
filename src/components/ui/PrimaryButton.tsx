import React from 'react';

interface Props {
  text: string;
  onPressed?: (e: React.FormEvent<HTMLButtonElement>) => void;
  className?: string;
  isActive?: boolean;
  disabled?: boolean;
}

const PrimaryButton: React.FC<Props> = ({ text, onPressed, className = '', isActive = false, disabled = false }) => {
  return (
    <div
      className={`w-full h-12 rounded-2xl flex items-center justify-center transition-all duration-300 ${
        disabled
          ? 'bg-gray-500 cursor-not-allowed'
          : isActive
          ? 'bg-white text-black'
          : 'bg-gradient-to-r from-nocenaBlue to-nocenaPink text-white'
      } ${className}`}
    >
      <button
        onClick={disabled ? undefined : onPressed}
        disabled={disabled}
        className="w-full h-full bg-transparent text-base font-medium font-montserrat cursor-pointer flex items-center justify-center focus:outline-none"
      >
        {text}
      </button>
    </div>
  );
};

export default PrimaryButton;
