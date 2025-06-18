import React from 'react';

interface NocenixMenuProps {
  onBack: () => void;
}

const NocenixMenu: React.FC<NocenixMenuProps> = ({ onBack }) => {
  return (
    <div className="p-6">
      <div
        onTouchStart={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onBack();
        }}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onBack();
        }}
        className="flex items-center text-white/70 hover:text-white mb-6 transition-colors cursor-pointer select-none"
        role="button"
        tabIndex={0}
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className="mr-2"
        >
          <polyline points="15,18 9,12 15,6" />
        </svg>
        Back to Menu
      </div>
      <h2 className="text-white text-2xl font-bold mb-4">Nocenix</h2>
      <p className="text-white/70 text-base leading-relaxed">
        Token balance and history page will be implemented here...
      </p>
    </div>
  );
};

export default NocenixMenu;
