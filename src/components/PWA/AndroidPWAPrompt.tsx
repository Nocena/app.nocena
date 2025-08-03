import React, { useState, useEffect } from 'react';

const AndroidPWAPrompt: React.FC = () => {
  const [showPrompt, setShowPrompt] = useState(false);
  const [promptDismissed, setPromptDismissed] = useState(false);

  useEffect(() => {
    // Check if the prompt has been dismissed recently
    const dismissedTime = localStorage.getItem('android-pwa-prompt-dismissed');
    if (dismissedTime) {
      const dismissedDate = new Date(parseInt(dismissedTime));
      const now = new Date();
      const hoursDifference = (now.getTime() - dismissedDate.getTime()) / (1000 * 60 * 60);
      if (hoursDifference < 24) {
        setPromptDismissed(true);
        return;
      }
    }

    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      return;
    }

    // Show the prompt after a short delay
    const timer = setTimeout(() => {
      setShowPrompt(true);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  const handleDismiss = () => {
    setShowPrompt(false);
    setPromptDismissed(true);
    localStorage.setItem('android-pwa-prompt-dismissed', Date.now().toString());
  };

  if (!showPrompt || promptDismissed) {
    return null;
  }

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-blue-400 to-purple-500 p-4 shadow-lg">
      <div className="flex items-center justify-between text-white">
        <div>
          <strong className="text-lg">Install Nocena</strong>
          <p className="text-sm">To install this app: tap the menu (⋮) and select "Add to Home screen"</p>
        </div>
        <button
          onClick={handleDismiss}
          className="p-2 hover:bg-white hover:bg-opacity-20 rounded-full"
          aria-label="Close"
        >
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

export default AndroidPWAPrompt;
