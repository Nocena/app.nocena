import React, { useEffect, useRef, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import PrimaryButton from '../ui/PrimaryButton';

interface MenuProps {
  isOpen: boolean;
  onClose: () => void;
  onLogout: () => void;
}

const Menu: React.FC<MenuProps> = ({ isOpen, onClose, onLogout }) => {
  const { user } = useAuth();
  const walletAddress = user?.wallet || 'Not connected';
  const menuRef = useRef<HTMLDivElement>(null);
  const [touchStart, setTouchStart] = useState<number | null>(null);

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isOpen && menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose]);

  // Handle touch gestures
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.touches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!touchStart) return;

    const currentTouch = e.touches[0].clientX;
    const diff = touchStart - currentTouch;

    // Swipe left to close
    if (diff > 50) {
      onClose();
      setTouchStart(null);
    }
  };

  const handleTouchEnd = () => {
    setTouchStart(null);
  };

  return (
    <>
      {/* Overlay for clicking outside */}
      {isOpen && <div className="fixed inset-0 bg-black/50 z-9998" onClick={onClose} />}

      {/* Menu panel */}
      <div
        ref={menuRef}
        className={`fixed top-0 left-0 h-full bg-nocena-bg/90 text-white transform w-[70%] ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } transition-transform duration-300 ease-in-out z-9999 pt-[env(safe-area-inset-top)]`}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Close button - repositioned to respect safe area */}
        <div className="flex justify-end p-4">
          <button
            onClick={onClose}
            className="text-2xl h-10 w-10 flex items-center justify-center rounded-full bg-gray-800/50"
          >
            ✖
          </button>
        </div>

        {/* Wallet display */}
        <div className="p-4">
          <div className="mt-4 break-words">
            <span>Wallet: {walletAddress}</span>
          </div>

          {/* Logout button */}
          <div className="mt-4">
            <PrimaryButton text="Logout" onClick={onLogout} />
          </div>
        </div>
      </div>
    </>
  );
};

export default Menu;
