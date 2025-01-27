import React from 'react';

interface Props {
  text: string;
  onPressed?: (e: React.FormEvent<HTMLButtonElement>) => void;
  className?: string; // Add className as an optional prop
}

const PrimaryButton: React.FC<Props> = ({ text, onPressed, className = '' }) => {
  return (
    <div className={`w-full h-12 rounded-2xl bg-gradient-to-r from-nocenaBlue to-nocenaPink flex items-center justify-center ${className}`}>
      <button
        onClick={onPressed}
        className="w-full h-full bg-transparent text-white text-base font-medium font-montserrat cursor-pointer flex items-center justify-center focus:outline-none"
      >
        {text}
      </button>
    </div>
  );
};

export default PrimaryButton;
