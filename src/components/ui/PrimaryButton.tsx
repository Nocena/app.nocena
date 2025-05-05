import React from 'react';

interface Props {
  disabled?: boolean;
  className?: string;
  isActive?: boolean;
  text: string;
  type?: HTMLButtonElement['type'];
  size?: 'sm' | 'md';
  onClick?: (e: React.FormEvent<HTMLButtonElement>) => void;
}

const PrimaryButton: React.FC<Props> = ({
  text,
  onClick,
  className = '',
  isActive = false,
  disabled = false,
  size = 'md',
  type = 'button',
}) => {
  const sizeClass = size === 'md' ? 'h-12 px-6 py-2' : 'h-8 px-3 py-1';
  const colorClass = disabled
    ? 'bg-gray-500'
    : isActive
      ? 'bg-white text-black'
      : 'bg-linear-to-r from-nocena-blue to-nocena-pink text-white';
  return (
    <button
      type={type}
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      className={`w-full ${sizeClass} inline-flex items-center justify-center ${colorClass} font-montserrat cursor-pointer rounded-full font-medium transition-all duration-300 focus:outline-hidden ${className} disabled:pointer-events-none`}
    >
      {text}
    </button>
  );
};

export default PrimaryButton;
