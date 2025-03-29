import { useState, useEffect } from 'react';

// Global variable to store the installation event
let deferredPrompt: any = null;

const DebugPWAInstaller: React.FC = () => {
  const [isInstallable, setIsInstallable] = useState(false);
  const [debugInfo, setDebugInfo] = useState<string[]>([]);

  // Add debug message
  const addDebug = (message: string) => {
    setDebugInfo((prev) => [...prev, message]);
    alert(`DEBUG: ${message}`);
  };

  useEffect(() => {
    // Check browser compatibility
    const ua = navigator.userAgent.toLowerCase();
    const isChrome = /chrome|chromium|crios/.test(ua);
    const isAndroid = /android/.test(ua);
    const isHttps = window.location.protocol === 'https:';

    addDebug(`Browser check: Chrome=${isChrome}, Android=${isAndroid}, HTTPS=${isHttps}`);

    // Check manifest
    fetch('/manifest.json')
      .then((response) => {
        if (response.ok) {
          addDebug('✅ Manifest file found');
          return response.json();
        } else {
          addDebug('❌ manifest.json not found');
          throw new Error('Manifest not found');
        }
      })
      .then((data) => {
        // Check required manifest fields
        const hasName = !!data.name;
        const hasIcons = Array.isArray(data.icons) && data.icons.length > 0;
        const hasStart = !!data.start_url;
        const hasDisplay = data.display === 'standalone' || data.display === 'fullscreen';

        addDebug(`Manifest check: name=${hasName}, icons=${hasIcons}, start_url=${hasStart}, display=${hasDisplay}`);
      })
      .catch((err) => {
        addDebug(`Manifest error: ${err}`);
      });

    // Check service worker registration
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .getRegistration()
        .then((registration) => {
          if (registration) {
            addDebug('✅ Service worker is registered');
          } else {
            addDebug('❌ No service worker registration found');
          }
        })
        .catch((err) => {
          addDebug(`Service worker check error: ${err}`);
        });
    } else {
      addDebug('❌ Service workers not supported');
    }

    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      addDebug('App is already installed (standalone mode)');
      return;
    }

    // The crucial beforeinstallprompt handler
    const handleBeforeInstallPrompt = (e: Event) => {
      // Prevent Chrome from automatically showing the prompt
      e.preventDefault();

      // Save the event for later
      deferredPrompt = e;

      addDebug('🎉 beforeinstallprompt event fired!');
      setIsInstallable(true);
    };

    addDebug('Adding beforeinstallprompt listener...');
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Also listen for appinstalled event
    window.addEventListener('appinstalled', () => {
      addDebug('🎉 App was installed successfully!');
      deferredPrompt = null;
      setIsInstallable(false);
    });

    // Try to force show install button after 5 seconds
    const timerId = setTimeout(() => {
      if (!isInstallable) {
        addDebug('⏱️ No beforeinstallprompt event after 5 seconds');
        setIsInstallable(true);
      }
    }, 5000);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      clearTimeout(timerId);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      addDebug('Triggering install prompt...');

      try {
        // Show the install prompt
        deferredPrompt.prompt();

        // Wait for the user to respond to the prompt
        const choiceResult = await deferredPrompt.userChoice;
        addDebug(`User choice: ${choiceResult.outcome}`);

        if (choiceResult.outcome === 'accepted') {
          deferredPrompt = null;
        }
      } catch (err) {
        addDebug(`Error with prompt: ${err}`);
      }
    } else {
      addDebug('No installation prompt available');

      // Check if we can use the manual method
      if (/android/i.test(navigator.userAgent) && /chrome/i.test(navigator.userAgent)) {
        addDebug('You can try manual installation: Menu > Add to Home Screen');
      }
    }
  };

  // Alternative manual install button for when deferredPrompt is null
  const handleManualInstall = () => {
    addDebug(
      "To install manually:\n1. Tap the menu (⋮) in Chrome\n2. Tap 'Add to Home screen'\n3. Tap 'Add' when prompted",
    );
  };

  return (
    <div className="fixed inset-x-0 bottom-0 bg-white border-t border-gray-200 shadow-lg p-4 z-50">
      <div className="flex flex-col space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="mr-3 bg-black p-2 rounded-lg">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-8 w-8 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"
                />
              </svg>
            </div>
            <div>
              <h3 className="font-bold">Install Nocena App</h3>
              <p className="text-sm text-gray-600">Get the full app experience</p>
            </div>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={handleInstallClick}
              className="px-4 py-2 bg-gradient-to-r from-blue-400 to-purple-500 text-white rounded-md font-medium"
            >
              Install App
            </button>
            <button
              onClick={handleManualInstall}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md font-medium"
            >
              Manual Install
            </button>
          </div>
        </div>

        {/* Show diagnostic info */}
        <div className="text-xs text-gray-500 border-t pt-2 mt-2">
          <p>Diagnostic Info:</p>
          <ul>
            {debugInfo.map((info, index) => (
              <li key={index}>{info}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default DebugPWAInstaller;
