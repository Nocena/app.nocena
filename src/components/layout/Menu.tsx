import React, { useEffect, useRef, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import PrimaryButton from '../ui/PrimaryButton';
import ThematicImage from '../ui/ThematicImage';
import ThematicContainer from '../ui/ThematicContainer';
import InviteFriends from './menu/InviteFriends';
import Image from 'next/image';

interface MenuProps {
  isOpen: boolean;
  onClose: () => void;
  onLogout: () => void;
  showBottomNavbar?: boolean;
}

const Menu: React.FC<MenuProps> = ({ isOpen, onClose, onLogout, showBottomNavbar = false }) => {
  const { user } = useAuth();
  const menuRef = useRef<HTMLDivElement>(null);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [activeSection, setActiveSection] = useState<string | null>(null);

  const defaultProfilePic = '/images/profile.png';

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

    if (diff > 50) {
      onClose();
      setTouchStart(null);
    }
  };

  const handleTouchEnd = () => {
    setTouchStart(null);
  };

  const MenuItem = ({
    icon,
    title,
    onClick,
    description,
  }: {
    icon: React.ReactNode;
    title: string;
    onClick: () => void;
    description?: string;
  }) => (
    <button
      onClick={onClick}
      className="w-full flex items-center py-4 px-6 hover:bg-white/10 transition-all duration-200 cursor-pointer group text-left rounded-lg"
    >
      <div className="flex-shrink-0 w-5 h-5 text-white/70 group-hover:text-white transition-colors">{icon}</div>
      <div className="flex-1 ml-4">
        <div className="text-white font-medium text-base">{title}</div>
        {description && <div className="text-white/60 text-sm mt-0.5">{description}</div>}
      </div>
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        className="text-white/50 group-hover:text-white/80 transition-colors"
      >
        <polyline points="9,18 15,12 9,6" />
      </svg>
    </button>
  );

  const renderMainMenu = () => (
    <div className="flex flex-col h-full">
      {/* User Info */}
      <div className="text-center py-8 px-6 border-b border-white/20">
        <div className="w-20 h-20 mx-auto mb-4">
          <ThematicImage className="w-full h-full z-999">
            <Image
              src={user?.profilePicture || defaultProfilePic}
              alt="Profile"
              width={80}
              height={80}
              className="w-full h-full object-cover rounded-full"
            />
          </ThematicImage>
        </div>
        <h3 className="text-white font-semibold text-xl mb-1">{user?.username || 'User'}</h3>
        <p className="text-white/70 text-sm mb-4">{user?.bio || 'No bio yet'}</p>
        <PrimaryButton
          text="Logout"
          onClick={onLogout}
          className="max-w-[50%] ml-[24%] bg-red-500/20 hover:bg-red-500/30 text-red-300 hover:text-white border-red-500/30"
        />
      </div>

      {/* Menu Items */}
      <div className="flex-1 py-4 px-3 space-y-2">
        <MenuItem
          icon={
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="11" width="18" height="10" rx="2" ry="2" />
              <circle cx="12" cy="16" r="1" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
          }
          title="Wallet"
          description="Manage your tokens and rewards"
          onClick={() => setActiveSection('wallet')}
        />

        <MenuItem
          icon={
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 6v6l4 2" />
            </svg>
          }
          title="Nocenix"
          description="Your token balance and history"
          onClick={() => setActiveSection('nocenix')}
        />

        {/* Special Invite Friends Item */}
        <div className="mx-3 mb-4 relative">
          {/* Glow effect background */}
          <div className="absolute inset-0 bg-gradient-to-r from-nocenaBlue/20 to-nocenaPurple/20 rounded-xl blur-md"></div>

          <button
            onClick={() => setActiveSection('invite')}
            className="relative w-full flex items-center py-4 px-6 bg-gradient-to-r from-nocenaBlue/10 to-nocenaPurple/10 hover:from-nocenaBlue/20 hover:to-nocenaPurple/20 transition-all duration-300 cursor-pointer group text-left rounded-xl border border-nocenaBlue/30"
          >
            <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-nocenaBlue to-nocenaPurple rounded-lg flex items-center justify-center">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            </div>
            <div className="flex-1 ml-4">
              <div className="text-white font-semibold text-base flex items-center">
                Invite Friends
                <ThematicContainer asButton={false} color="nocenaPink" className="ml-4 px-2 ">
                  <div className="flex items-center space-x-1">
                    <span className="text-lg font-semibold">50</span>
                    <Image src="/nocenix.ico" alt="Nocenix" width={24} height={24} />
                  </div>
                </ThematicContainer>
              </div>
              <div className="text-white/70 text-sm mt-0.5">Share and earn together</div>
            </div>
          </button>
        </div>

        <MenuItem
          icon={
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 12l2 2 4-4" />
              <path d="M21 12c-1 0-3-1-3-3s2-3 3-3 3 1 3 3-2 3-3 3" />
              <path d="M3 12c1 0 3-1 3-3s-2-3-3-3-3 1-3 3 2 3 3 3" />
              <path d="M13 12h3" />
              <path d="M8 12H5" />
            </svg>
          }
          title="Verification"
          description="Account verification status"
          onClick={() => setActiveSection('verification')}
        />

        <MenuItem
          icon={
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1 1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
          }
          title="Settings"
          description="App preferences and notifications"
          onClick={() => setActiveSection('settings')}
        />

        <MenuItem
          icon={
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
          }
          title="FAQ"
          description="Frequently asked questions"
          onClick={() => setActiveSection('faq')}
        />

        <MenuItem
          icon={
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
              <polyline points="22,6 12,13 2,6" />
            </svg>
          }
          title="Contact Us"
          description="Get help and support"
          onClick={() => setActiveSection('contact')}
        />
      </div>

      {/* Social Links & Logout */}
      <div className="px-6 py-4 border-t border-white/20 space-y-4">
        <div>
          <p className="text-white/70 text-sm mb-4 text-center">Connect with us</p>
          <div className="flex justify-center space-x-4">
            <div
              onClick={() => window.open('https://x.com/nocena', '_blank')}
              className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 hover:from-blue-600 hover:to-blue-800 flex items-center justify-center transition-all duration-200 cursor-pointer shadow-lg"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
                <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" />
              </svg>
            </div>
            <div
              onClick={() => window.open('https://discord.gg/nocena', '_blank')}
              className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-purple-700 hover:from-purple-600 hover:to-purple-800 flex items-center justify-center transition-all duration-200 cursor-pointer shadow-lg"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
                <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
              </svg>
            </div>
            <div
              onClick={() => window.open('https://t.me/nocena', '_blank')}
              className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 hover:from-blue-500 hover:to-blue-700 flex items-center justify-center transition-all duration-200 cursor-pointer shadow-lg"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
                <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-.962 6.502-.542 1.06-1.097 1.117-1.816.75-.293-.149-.677-.363-1.077-.598-.358-.208-.954-.44-1.155-.596-.177-.138-.362-.301-.244-.615.09-.23.827-.96 1.529-1.681.388-.396.47-.688.215-.702-.154-.008-.22.176-.373.297-.409.32-1.302.952-1.821 1.22-.562.292-.78.07-1.295-.11-.538-.188-1.058-.398-1.058-.398s-.375-.336.263-.695c.865-.488 1.673-.912 1.673-.912l-.003-.004zm.716 5.827c.209.138.49.304.49.304l-.003-.004z" />
              </svg>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderSectionContent = () => {
    switch (activeSection) {
      case 'wallet':
        return (
          <div className="p-6">
            <button
              onClick={() => setActiveSection(null)}
              className="flex items-center text-white/70 hover:text-white mb-6 transition-colors"
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
            </button>
            <h2 className="text-white text-2xl font-bold mb-4">Wallet</h2>
            <p className="text-white/70 text-base leading-relaxed">Wallet details page will be implemented here...</p>
          </div>
        );
      case 'nocenix':
        return (
          <div className="p-6">
            <button
              onClick={() => setActiveSection(null)}
              className="flex items-center text-white/70 hover:text-white mb-6 transition-colors"
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
            </button>
            <h2 className="text-white text-2xl font-bold mb-4">Nocenix</h2>
            <p className="text-white/70 text-base leading-relaxed">
              Token balance and history page will be implemented here...
            </p>
          </div>
        );
      case 'invite':
        return <InviteFriends onBack={() => setActiveSection(null)} />;
      case 'verification':
        return (
          <div className="p-6">
            <button
              onClick={() => setActiveSection(null)}
              className="flex items-center text-white/70 hover:text-white mb-6 transition-colors"
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
            </button>
            <h2 className="text-white text-2xl font-bold mb-4">Verification</h2>
            <p className="text-white/70 text-base leading-relaxed">
              Account verification page will be implemented here...
            </p>
          </div>
        );
      case 'settings':
        return (
          <div className="p-6">
            <button
              onClick={() => setActiveSection(null)}
              className="flex items-center text-white/70 hover:text-white mb-6 transition-colors"
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
            </button>
            <h2 className="text-white text-2xl font-bold mb-4">Settings</h2>
            <p className="text-white/70 text-base leading-relaxed">Settings page will be implemented here...</p>
          </div>
        );
      case 'faq':
        return (
          <div className="p-6">
            <button
              onClick={() => setActiveSection(null)}
              className="flex items-center text-white/70 hover:text-white mb-6 transition-colors"
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
            </button>
            <h2 className="text-white text-2xl font-bold mb-4">FAQ</h2>
            <p className="text-white/70 text-base leading-relaxed">FAQ page will be implemented here...</p>
          </div>
        );
      case 'contact':
        return (
          <div className="p-6">
            <button
              onClick={() => setActiveSection(null)}
              className="flex items-center text-white/70 hover:text-white mb-6 transition-colors"
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
            </button>
            <h2 className="text-white text-2xl font-bold mb-4">Contact Us</h2>
            <p className="text-white/70 text-base leading-relaxed">Contact page will be implemented here...</p>
          </div>
        );
      default:
        return renderMainMenu();
    }
  };

  return (
    <>
      {/* Menu panel */}
      <div
        ref={menuRef}
        className={`fixed top-0 left-0 h-full w-[85%] max-w-sm transform ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } transition-transform duration-300 ease-in-out z-[9990]`}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{ paddingTop: 'env(safe-area-inset-top)' }}
      >
        {/* Clean glassmorphic background - single unified container */}
        <div className="h-full bg-black/30 backdrop-blur-xl border-r border-white/20">
          {/* Close button */}
          <div className="flex absolute justify-end p-4 pb-2 bg-transparent right-0">
            <button
              onClick={onClose}
              className="w-10 h-10 flex items-center justify-center rounded-full bg-white/15 hover:bg-white/25 transition-all duration-200"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          {/* Content */}
          <div className="h-full overflow-y-auto pb-4">{renderSectionContent()}</div>
        </div>
      </div>
    </>
  );
};

export default Menu;
