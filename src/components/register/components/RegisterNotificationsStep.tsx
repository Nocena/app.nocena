import { useState, useEffect } from 'react';
import PrimaryButton from '../../ui/PrimaryButton';
import LegalPopupModal from './LegalPopupModal';
import { subscribeToPushNotifications, requestNotificationPermission } from '../../../lib/pushNotifications';

interface Props {
  onNotificationsReady: (pushSubscription: string | null) => void;
  disabled?: boolean;
}

const RegisterNotificationsStep = ({ onNotificationsReady, disabled = false }: Props) => {
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>('default');
  const [pushSubscription, setPushSubscription] = useState<string | null>(null);
  const [isSettingUp, setIsSettingUp] = useState(false);
  const [error, setError] = useState('');
  const [hasTriedNotifications, setHasTriedNotifications] = useState(false);

  // Legal agreement states
  const [termsAgreed, setTermsAgreed] = useState(false);
  const [privacyAgreed, setPrivacyAgreed] = useState(false);

  // Modal states
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);

  const allAgreementsAccepted = termsAgreed && privacyAgreed;
  const notificationsEnabled = pushSubscription !== null;

  useEffect(() => {
    console.log('🔍 Component mounted, checking notification status...');

    // Check current notification permission on component mount
    if ('Notification' in window) {
      const currentPermission = Notification.permission;
      console.log('Current permission on mount:', currentPermission);
      setNotificationPermission(currentPermission);

      if (currentPermission === 'granted' && !disabled) {
        console.log('✅ Permission already granted, attempting to get existing subscription...');
        // If already granted, just get the subscription
        subscribeToPushNotifications()
          .then((subscription) => {
            console.log('Existing subscription result:', subscription ? 'Found' : 'Not found');
            if (subscription) {
              setPushSubscription(subscription);
            }
            setHasTriedNotifications(true);
          })
          .catch((error) => {
            console.error('Error getting existing subscription:', error);
            setHasTriedNotifications(true);
          });
      } else {
        // Auto-trigger notification setup on mount if not disabled and not already tried
        if (!disabled && currentPermission === 'default') {
          handleEnableNotifications();
        } else {
          setHasTriedNotifications(true);
        }
      }
    } else {
      setHasTriedNotifications(true);
    }
  }, [disabled]);

  // Function to detect if we're in private/incognito mode
  const isPrivateBrowsing = async (): Promise<boolean> => {
    try {
      if ('storage' in navigator && 'estimate' in navigator.storage) {
        const estimate = await navigator.storage.estimate();
        return (estimate.quota || 0) < 120000000;
      }
      return false;
    } catch {
      return false;
    }
  };

  const handleEnableNotifications = async () => {
    console.log('🔔 Enable notifications clicked');

    if (disabled) {
      console.log('⚠️ Notifications setup disabled, ignoring request');
      return;
    }

    // If we already have a subscription, don't do anything
    if (pushSubscription) {
      console.log('✅ Already have subscription');
      return;
    }

    // If notifications are denied, we can't trigger the popup again
    // The browser blocks repeated requests after denial
    if (notificationPermission === 'denied') {
      console.log('🚫 Notifications denied, cannot trigger popup again');
      setError(
        'Notifications are blocked in your browser. You can continue without notifications or enable them manually:\n\n' +
          '• Chrome: Click the lock icon in the address bar → Notifications → Allow\n' +
          '• Safari: Go to Settings → Websites → Notifications → Allow for this site\n' +
          '• Firefox: Click the shield icon → Turn off blocking for Notifications',
      );
      setHasTriedNotifications(true);
      return;
    }

    // Check for private browsing mode
    const isPrivate = await isPrivateBrowsing();
    if (isPrivate) {
      console.log('🕵️ Private browsing detected');
      setError('Notifications may not work in private/incognito mode. You can continue without notifications or try in a regular browser window.');
      setHasTriedNotifications(true);
      return;
    }

    console.log('🚀 Starting notification setup process...');
    setIsSettingUp(true);
    setError('');

    try {
      console.log('📲 Requesting notification permission...');
      const permission = await requestNotificationPermission();
      console.log('🎯 Permission result:', permission);
      setNotificationPermission(permission);

      if (permission === 'granted') {
        console.log('✅ Permission granted, subscribing to push notifications...');
        const subscription = await subscribeToPushNotifications();
        console.log('📨 Subscription result:', subscription);

        if (subscription) {
          setPushSubscription(subscription);
          console.log('🎉 Notification setup completed successfully!');
        } else {
          console.error('❌ Failed to get push subscription');
          setError('Failed to setup notifications. You can continue without notifications or try again.');
        }
      } else if (permission === 'denied') {
        console.log('🚫 Permission denied by user');
        setError(
          'Notifications were blocked. You can continue without notifications or enable them manually:\n\n' +
            '• Chrome: Click the lock icon in the address bar → Notifications → Allow\n' +
            '• Safari: Go to Settings → Websites → Notifications → Allow for this site\n' +
            '• Firefox: Click the shield icon → Turn off blocking for Notifications',
        );
      } else {
        console.log('❓ Permission dismissed or default:', permission);
        setError('Notification permission was dismissed. You can continue without notifications or try again.');
      }
    } catch (error) {
      console.error('💥 Error setting up notifications:', error);
      setError('Failed to setup notifications. You can continue without notifications or try again.');
    } finally {
      console.log('🏁 Notification setup process finished');
      setIsSettingUp(false);
      setHasTriedNotifications(true);
    }
  };

  const handleComplete = () => {
    if (disabled) {
      console.log('⚠️ Registration disabled, ignoring complete request');
      return;
    }

    if (allAgreementsAccepted) {
      // Pass the subscription (which could be null if notifications failed/were blocked)
      onNotificationsReady(pushSubscription);
    }
  };

  const handleSkipNotifications = () => {
    if (disabled) return;
    
    setError('');
    setHasTriedNotifications(true);
    console.log('⏭️ User chose to skip notifications');
  };

  const isInteractionDisabled = disabled || isSettingUp;
  const canProceed = allAgreementsAccepted && !isInteractionDisabled;

  return (
    <div className="flex flex-col px-6 py-8">
      {/* Main Content */}
      <div className="space-y-6">
        {/* Error Display */}
        {error && !disabled && (
          <div className="bg-yellow-500/20 border border-yellow-500/50 rounded-xl p-4 mb-6">
            <div className="flex items-start space-x-3">
              <svg
                className="w-5 h-5 text-yellow-400 mt-0.5 flex-shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.232 15.5c-.77.833.192 2.5 1.732 2.5z"
                />
              </svg>
              <div>
                <p className="text-sm text-yellow-300 font-medium mb-1">Notification Setup</p>
                <pre className="text-sm text-yellow-200 font-light whitespace-pre-line">{error}</pre>
              </div>
            </div>
          </div>
        )}

        {/* Registration Status */}
        {disabled && (
          <div className="bg-blue-500/20 border border-blue-500/50 rounded-xl p-4 mb-6">
            <div className="flex items-center justify-center space-x-3">
              <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-sm text-blue-300 font-light">Creating your account, please wait...</p>
            </div>
          </div>
        )}

        {/* Notifications Section */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center w-16 h-16 mx-auto bg-nocenaPink/20 rounded-full">
            {notificationsEnabled ? (
              <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            ) : hasTriedNotifications ? (
              <svg className="w-8 h-8 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01" />
              </svg>
            ) : (
              <svg className="w-8 h-8 text-nocenaPink" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5z" />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 3v1.5l-3 .75v11.25a.75.75 0 001.5 0V6l8.25-2.25v7.5"
                />
              </svg>
            )}
          </div>

          <div>
            <h3 className="text-xl font-semibold text-white mb-2">
              {notificationsEnabled 
                ? 'Notifications Enabled' 
                : hasTriedNotifications 
                  ? 'Notifications (Optional)'
                  : 'Enable Notifications'
              }
            </h3>
            <p className="text-gray-300 text-sm leading-relaxed">
              {notificationsEnabled
                ? "Great! You'll receive notifications about new challenges, friend activities, and rewards."
                : hasTriedNotifications
                  ? "You can still use Nocena without notifications. You can enable them later in settings."
                  : 'Get notified about new challenges, friend activities, and rewards so you never miss out on the action.'}
            </p>
          </div>

          {/* Notification controls */}
          {!notificationsEnabled && !hasTriedNotifications && (
            <PrimaryButton
              text={isSettingUp ? 'Setting up notifications...' : 'Enable notifications'}
              onClick={handleEnableNotifications}
              disabled={isInteractionDisabled}
              className="w-full"
            />
          )}

          {!notificationsEnabled && hasTriedNotifications && !isSettingUp && (
            <div className="space-y-3">
              <PrimaryButton
                text="Try enabling notifications again"
                onClick={handleEnableNotifications}
                disabled={isInteractionDisabled}
                className="w-full bg-nocenaPink/20 hover:bg-nocenaPink/30 text-nocenaPink border border-nocenaPink/50"
              />
              <button
                onClick={handleSkipNotifications}
                disabled={isInteractionDisabled}
                className="text-sm text-gray-400 hover:text-gray-300 transition-colors underline"
              >
                Continue without notifications
              </button>
            </div>
          )}
        </div>

        {/* Legal Agreements Section */}
        <div className="space-y-4">
          <h4 className="text-white font-medium text-center">Legal Agreements</h4>

          <div className="space-y-3">
            {/* Terms & Conditions */}
            <label className="flex items-start space-x-3 cursor-pointer group">
              <div className="relative flex-shrink-0 mt-0.5">
                <input
                  type="checkbox"
                  checked={termsAgreed}
                  onChange={(e) => setTermsAgreed(e.target.checked)}
                  disabled={isInteractionDisabled}
                  className="sr-only"
                />
                <div
                  className={`w-5 h-5 rounded border-2 transition-all duration-200 ${
                    termsAgreed ? 'bg-nocenaPink border-nocenaPink' : 'border-gray-500 group-hover:border-gray-400'
                  } ${isInteractionDisabled ? 'opacity-50' : ''}`}
                >
                  {termsAgreed && (
                    <svg
                      className="w-3 h-3 text-white absolute top-0.5 left-0.5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
              </div>
              <div className="text-sm">
                <span className="text-gray-300">I agree to the </span>
                <button
                  type="button"
                  onClick={() => setShowTermsModal(true)}
                  disabled={isInteractionDisabled}
                  className="text-nocenaPink hover:text-nocenaPink/80 underline font-medium transition-colors"
                >
                  Terms & Conditions
                </button>
                <span className="text-red-400 ml-1">*</span>
              </div>
            </label>

            {/* Privacy Policy */}
            <label className="flex items-start space-x-3 cursor-pointer group">
              <div className="relative flex-shrink-0 mt-0.5">
                <input
                  type="checkbox"
                  checked={privacyAgreed}
                  onChange={(e) => setPrivacyAgreed(e.target.checked)}
                  disabled={isInteractionDisabled}
                  className="sr-only"
                />
                <div
                  className={`w-5 h-5 rounded border-2 transition-all duration-200 ${
                    privacyAgreed ? 'bg-nocenaPink border-nocenaPink' : 'border-gray-500 group-hover:border-gray-400'
                  } ${isInteractionDisabled ? 'opacity-50' : ''}`}
                >
                  {privacyAgreed && (
                    <svg
                      className="w-3 h-3 text-white absolute top-0.5 left-0.5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
              </div>
              <div className="text-sm">
                <span className="text-gray-300">I acknowledge the </span>
                <button
                  type="button"
                  onClick={() => setShowPrivacyModal(true)}
                  disabled={isInteractionDisabled}
                  className="text-nocenaPink hover:text-nocenaPink/80 underline font-medium transition-colors"
                >
                  Privacy Policy
                </button>
                <span className="text-red-400 ml-1">*</span>
              </div>
            </label>
          </div>

          <p className="text-xs text-gray-400 text-center">
            <span className="text-red-400">*</span> Required to continue
          </p>
        </div>
      </div>

      {/* Complete Setup Button */}
      <div className="mt-8">
        <PrimaryButton
          text={
            disabled
              ? 'Creating account...'
              : !allAgreementsAccepted
                ? 'Accept legal agreements to continue'
                : 'Complete setup'
          }
          onClick={canProceed ? handleComplete : undefined}
          className={`w-full ${!canProceed ? 'opacity-50' : ''}`}
          disabled={!canProceed}
        />
      </div>

      {/* Legal Modals */}
      <LegalPopupModal
        isOpen={showTermsModal}
        onClose={() => setShowTermsModal(false)}
        title="Terms & Conditions"
        type="terms"
      />

      <LegalPopupModal
        isOpen={showPrivacyModal}
        onClose={() => setShowPrivacyModal(false)}
        title="Privacy Policy"
        type="privacy"
      />
    </div>
  );
};

export default RegisterNotificationsStep;