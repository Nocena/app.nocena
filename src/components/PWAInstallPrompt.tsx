import { useState, useEffect } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const PWAInstallPrompt = () => {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handler);

    // Check if app is already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!installPrompt) return;

    installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    
    if (outcome === 'accepted') {
      console.log('App installed');
      setIsInstalled(true);
    } else {
      console.log('App install declined');
    }
    
    setInstallPrompt(null);
  };

  if (isInstalled) {
    return <div className="px-4 py-2 bg-green-100 text-green-800 rounded-md">App is installed</div>;
  }

  return installPrompt ? (
    <button
      onClick={handleInstallClick}
      className="px-4 py-2 bg-black text-white rounded-md font-medium hover:bg-gray-800 transition-colors"
    >
      Install Nocena App
    </button>
  ) : null;
};

export default PWAInstallPrompt;