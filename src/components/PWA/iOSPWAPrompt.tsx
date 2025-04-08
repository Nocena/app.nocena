import React, { useState, useEffect } from 'react';

const IOSPWAPrompt: React.FC = () => {
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOSDevice, setIsIOSDevice] = useState(false);
  const [isInStandaloneMode, setIsInStandaloneMode] = useState(false);
  const [promptDismissed, setPromptDismissed] = useState(false);

  useEffect(() => {
    // Check if it's an iOS device
    const ua = window.navigator.userAgent;
    const isIOS = /iPad|iPhone|iPod/.test(ua) && !(window as any).MSStream;
    setIsIOSDevice(isIOS);

    // Check if app is already installed (in standalone mode)
    const standalone = (window.navigator as any).standalone === true;
    setIsInStandaloneMode(standalone);

    // Check if user has dismissed the prompt recently
    const dismissedTime = localStorage.getItem('ios-pwa-prompt-dismissed');
    if (dismissedTime) {
      const dismissedDate = new Date(parseInt(dismissedTime));
      const now = new Date();
      const hoursDifference = (now.getTime() - dismissedDate.getTime()) / (1000 * 60 * 60);
      setPromptDismissed(hoursDifference < 24); // Don't show again for 24 hours
    }

    // Only show prompt for iOS devices that aren't in standalone mode and haven't dismissed recently
    setShowPrompt(isIOS && !standalone && !promptDismissed);
  }, []);

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem('ios-pwa-prompt-dismissed', Date.now().toString());
  };

  if (!showPrompt) return null;

  return (
    <div className="fixed top-0 left-0 right-0 bg-black text-white z-50 shadow-lg p-4">
      <div className="flex items-start">
        <div className="flex-grow">
          <p className="font-bold text-base mb-1">Install Nocena App</p>
          <p className="text-sm opacity-90">
            To get the full experience without the browser you should install this app on your iPhone: tap
            <span className="mx-1 inline-block">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="inline"
              >
                <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"></path>
                <polyline points="16 6 12 2 8 6"></polyline>
                <line x1="12" y1="2" x2="12" y2="15"></line>
              </svg>
            </span>
            then "Add to Home Screen"
          </p>
        </div>
        <button onClick={handleDismiss} className="text-white p-1" aria-label="Close">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>
    </div>
  );
};

export default IOSPWAPrompt;
