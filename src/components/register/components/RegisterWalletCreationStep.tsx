import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import PrimaryButton from '../../ui/PrimaryButton';
import ThematicContainer from '../../ui/ThematicContainer';
import {
  subscribeToPushNotifications,
  requestNotificationPermission,
} from '../../../lib/pushNotifications';
import { User, useAuth } from '../../../contexts/AuthContext';

interface Props {
  wallet: {
    address: string;
    privateKey: string;
  };
  onPushSubscriptionReady: (pushSubscription: string) => void;
  onComplete?: () => void;
}

const RegisterWalletCreationStep = ({ wallet, onPushSubscriptionReady, onComplete }: Props) => {
  const router = useRouter();
  const [copiedAddress, setCopiedAddress] = useState(false);
  const [copiedPrivateKey, setCopiedPrivateKey] = useState(false);
  const [step, setStep] = useState(1);
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>('default');
  const [pushSubscription, setPushSubscription] = useState<string | null>(null);
  const [isSettingUpNotifications, setIsSettingUpNotifications] = useState(false);
  const [notificationError, setNotificationError] = useState('');
  const [canProceed, setCanProceed] = useState(false);

  useEffect(() => {
    // Check current notification permission on component mount
    if ('Notification' in window) {
      setNotificationPermission(Notification.permission);
      // If already granted, we still need to get the subscription
      if (Notification.permission === 'granted') {
        handleEnableNotifications();
      }
    }
  }, []);

  const copyToClipboard = (text: string, type: 'address' | 'privateKey') => {
    navigator.clipboard.writeText(text).then(() => {
      if (type === 'address') {
        setCopiedAddress(true);
        setTimeout(() => setCopiedAddress(false), 2000);
      } else {
        setCopiedPrivateKey(true);
        setTimeout(() => setCopiedPrivateKey(false), 2000);
      }
    });
  };

  const handleNext = () => {
    if (step < 3) {
      setStep(step + 1);
    } else if (step === 3 && canProceed && pushSubscription) {
      // Final step - create the user profile with push subscription
      onPushSubscriptionReady(pushSubscription);
    }
  };

  const handleEnableNotifications = async () => {
    setIsSettingUpNotifications(true);
    setNotificationError('');

    try {
      console.log('🔔 Requesting notification permission...');
      
      const permission = await requestNotificationPermission();
      setNotificationPermission(permission);

      if (permission === 'granted') {
        console.log('🔔 Permission granted, subscribing to push notifications...');
        const subscription = await subscribeToPushNotifications();
        
        if (subscription) {
          console.log('🔔 Got subscription:', subscription);
          setPushSubscription(subscription);
          setCanProceed(true);
        } else {
          console.error('🔔 Failed to get push subscription');
          setNotificationError('Failed to setup notifications. Please try again.');
          setCanProceed(false);
        }
      } else {
        console.log('🔔 Permission denied:', permission);
        setNotificationError('Notifications are required to complete registration. Please allow notifications and try again.');
        setCanProceed(false);
      }
    } catch (error) {
      console.error('🔔 Error setting up notifications:', error);
      setNotificationError('Failed to setup notifications. Please try again.');
      setCanProceed(false);
    } finally {
      setIsSettingUpNotifications(false);
    }
  };

  const handleSkipNotifications = () => {
    // This is no longer allowed - show explanation
    setNotificationError('Notifications are required to use Nocena and receive daily challenges. Please enable them to continue.');
  };

  if (step === 1) {
    return (
      <div className="flex flex-col justify-center items-center px-6 py-8">
        <div className="text-center mb-8">
          <div className="relative mb-6">
            <div className="w-24 h-24 mx-auto bg-gradient-to-br from-nocenaBlue via-nocenaPurple to-nocenaPink rounded-full flex items-center justify-center animate-pulse">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5">
                <path d="M12 2L2 7l10 5 10-5-10-5z" />
                <path d="M2 17l10 5 10-5" />
                <path d="M2 12l10 5 10-5" />
              </svg>
            </div>
            <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-24 h-24 bg-gradient-to-br from-nocenaPink to-nocenaBlue rounded-full opacity-20 animate-ping"></div>
          </div>

          <h1 className="text-2xl font-bold text-white mb-3">🎉 Amazing!</h1>
          <p className="text-base text-gray-300 mb-2">You just created your first crypto wallet</p>
          <p className="text-sm text-gray-400">It's like getting a special account for earning rewards</p>
        </div>

        <div className="w-full">
          <PrimaryButton text="Show me how it works →" onClick={handleNext} className="w-full text-base py-3" />
        </div>
      </div>
    );
  }

  if (step === 2) {
    return (
      <div className="flex flex-col px-6 py-8">
        <div className="text-center mb-6">
          <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-nocenaBlue to-nocenaPink rounded-2xl flex items-center justify-center">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
              <path d="M12 2L2 7l10 5 10-5-10-5z" />
              <path d="M2 17l10 5 10-5" />
              <path d="M2 12l10 5 10-5" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Your Reward Account</h2>
          <p className="text-gray-400 text-sm leading-relaxed">
            This is where all your earned tokens from completing daily challenges will appear.
            <br />
            <span className="text-nocenaPink">Think of it like your points balance in a game.</span>
          </p>
        </div>

        <ThematicContainer color="nocenaBlue" asButton={false} glassmorphic={true} rounded="xl" className="p-4 mb-6">
          <div className="text-center">
            <div className="flex justify-between items-center mb-3">
              <span className="text-sm text-gray-300">Your Account ID</span>
              <button
                onClick={() => wallet && copyToClipboard(wallet.address, 'address')}
                className={`text-xs px-2 py-1 rounded-full transition-all ${
                  copiedAddress ? 'bg-white text-nocenaBlue' : 'bg-white bg-opacity-20 text-white hover:bg-opacity-30'
                }`}
              >
                {copiedAddress ? '✓ Copied' : 'Copy'}
              </button>
            </div>

            <div className="bg-black bg-opacity-30 p-3 rounded-lg mb-3">
              <p className="text-xs font-mono text-white break-all leading-relaxed">{wallet?.address}</p>
            </div>

            <div className="flex items-center justify-center space-x-2 text-xs text-gray-300">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
              </svg>
              <span>Safe to share • Others can send you tokens with this</span>
            </div>
          </div>
        </ThematicContainer>

        <PrimaryButton text="Got it! What's next? →" onClick={handleNext} className="w-full" />
      </div>
    );
  }

  return (
    <div className="flex flex-col px-6 py-8">
      <div className="text-center mb-4">
        <div className="w-14 h-14 mx-auto mb-3 bg-gradient-to-br from-nocenaPink to-nocenaPurple rounded-2xl flex items-center justify-center">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
            <rect x="3" y="11" width="18" height="10" rx="2" ry="2" />
            <circle cx="12" cy="16" r="1" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
        </div>
        <h2 className="text-lg font-bold text-white mb-2">Your Secret Recovery Key</h2>
        <p className="text-gray-400 text-sm">This is like your master password - keep it super safe!</p>
      </div>

      <ThematicContainer color="nocenaPink" asButton={false} glassmorphic={true} rounded="xl" className="p-4 mb-4">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm text-white font-medium">Recovery Key</span>
          <button
            onClick={() => wallet && copyToClipboard(wallet.privateKey, 'privateKey')}
            className={`text-xs px-2 py-1 rounded-full transition-all ${
              copiedPrivateKey ? 'bg-white text-nocenaPink' : 'bg-white bg-opacity-20 text-white hover:bg-opacity-30'
            }`}
          >
            {copiedPrivateKey ? '✓ Saved' : 'Copy'}
          </button>
        </div>

        <div className="bg-black bg-opacity-40 p-3 rounded-lg mb-3">
          <p className="text-xs font-mono text-white break-all leading-relaxed">{wallet?.privateKey}</p>
        </div>

        <div className="space-y-1.5">
          <div className="flex items-start space-x-2 text-xs text-gray-200">
            <span className="text-nocenaPink mt-0.5">🔒</span>
            <span>Copy this and save it somewhere safe</span>
          </div>
          <div className="flex items-start space-x-2 text-xs text-gray-200">
            <span className="text-nocenaPink mt-0.5">🚫</span>
            <span>Never share this with anyone</span>
          </div>
          <div className="flex items-start space-x-2 text-xs text-gray-200">
            <span className="text-nocenaPink mt-0.5">⚡</span>
            <span>You'll only see this once!</span>
          </div>
        </div>
      </ThematicContainer>

      {/* Push Notifications Section - Now Mandatory */}
      <ThematicContainer 
        color={pushSubscription ? "nocenaPink" : "nocenaBlue"} 
        asButton={false} 
        glassmorphic={true} 
        rounded="xl" 
        className="p-4 mb-4"
      >
        <div className="text-center">
          <div className="flex items-center justify-center mb-3">
            <div className={`w-8 h-8 bg-gradient-to-br ${pushSubscription ? 'from-green-500 to-green-600' : 'from-nocenaBlue to-nocenaPink'} rounded-full flex items-center justify-center mr-3`}>
              {pushSubscription ? (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                  <polyline points="20,6 9,17 4,12" />
                </svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                  <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                </svg>
              )}
            </div>
            <div className="text-left">
              <h3 className="text-sm font-medium text-white flex items-center">
                Enable Notifications
                <span className="ml-2 text-xs bg-red-500 text-white px-2 py-0.5 rounded-full">Required</span>
              </h3>
              <p className="text-xs text-gray-300">Get daily challenges and earn rewards</p>
            </div>
          </div>

          {pushSubscription ? (
            <div className="flex items-center justify-center space-x-2 text-xs text-green-400">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="20,6 9,17 4,12" />
              </svg>
              <span>Notifications enabled! You're all set.</span>
            </div>
          ) : (
            <div className="space-y-3">
              {notificationError && (
                <div className="bg-red-500 bg-opacity-20 border border-red-500 rounded-lg p-3">
                  <p className="text-xs text-red-300">{notificationError}</p>
                </div>
              )}

              <div className="bg-yellow-500 bg-opacity-20 border border-yellow-500 rounded-lg p-3 mb-3">
                <div className="flex items-start space-x-2">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#FFC107" strokeWidth="2" className="mt-0.5">
                    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                    <line x1="12" y1="9" x2="12" y2="13" />
                    <line x1="12" y1="17" x2="12.01" y2="17" />
                  </svg>
                  <div className="text-xs text-yellow-200">
                    <p className="font-medium mb-1">Notifications are required</p>
                    <p>Nocena needs notifications to send you daily challenges and updates. Without them, you won't be able to participate in the challenge system.</p>
                  </div>
                </div>
              </div>

              <button
                onClick={handleEnableNotifications}
                disabled={isSettingUpNotifications}
                className="w-full text-sm py-3 px-4 bg-gradient-to-r from-nocenaBlue to-nocenaPink text-white rounded-lg hover:shadow-lg transition-all disabled:opacity-50 font-medium"
              >
                {isSettingUpNotifications ? (
                  <div className="flex items-center justify-center space-x-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Setting up notifications...</span>
                  </div>
                ) : (
                  'Enable Notifications to Continue'
                )}
              </button>
            </div>
          )}
        </div>
      </ThematicContainer>

      <div className="space-y-2">
        <PrimaryButton
          text={pushSubscription ? "I've saved it safely!" : "Enable notifications to continue"}
          onClick={pushSubscription ? handleNext : handleEnableNotifications}
          className={`w-full ${!pushSubscription ? 'opacity-50 cursor-not-allowed' : ''}`}
          disabled={!canProceed || isSettingUpNotifications}
        />
        
        {!pushSubscription && (
          <div className="text-center">
            <p className="text-xs text-gray-500 mb-2">Notifications are required to create your account</p>
            <button
              onClick={handleSkipNotifications}
              className="text-xs text-gray-400 underline hover:text-gray-300"
            >
              Why are notifications required?
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default RegisterWalletCreationStep;