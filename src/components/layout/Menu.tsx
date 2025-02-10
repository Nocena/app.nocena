import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import PrimaryButton from '../ui/PrimaryButton';

interface MenuProps {
  isOpen: boolean;
  onClose: () => void;
  onLogout: () => void;
}

const Menu: React.FC<MenuProps> = ({ isOpen, onClose, onLogout }) => {
  const { user } = useAuth(); // Access user from context
  const walletAddress = user?.wallet || 'Not connected'; // Get wallet address or default message

  return (
    <div
      className={`fixed top-0 left-0 h-full bg-nocenaBg/90 text-white transform w-[60%] ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      } transition-transform duration-300 ease-in-out z-[9999]`}
    >
      {/* Close button */}
      <div className="flex justify-end p-4">
        <button onClick={onClose} className="text-2xl">
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
          <PrimaryButton text="Logout" onPressed={onLogout} />
        </div>
      </div>
    </div>
  );
};

export default Menu;
