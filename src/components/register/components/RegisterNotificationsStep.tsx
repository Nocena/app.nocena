import { useState, useEffect } from 'react';
import PrimaryButton from '../../ui/PrimaryButton';
import LegalPopupModal from './LegalPopupModal';
import { subscribeToPushNotifications, requestNotificationPermission } from '../../../lib/pushNotifications';

interface Props {
  onNotificationsReady: (pushSubscription: string) => void;
  disabled?: boolean;
}

const RegisterNotificationsStep = ({ onNotificationsReady, disabled = false }: Props) => {
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>('default');
  const [pushSubscription, setPushSubscription] = useState<string | null>(null);
  const [isSettingUp, setIsSettingUp] = useState(false);
  const [error, setError] = useState('');

  // Legal agreement states
  const [notificationsAgreed, setNotificationsAgreed] = useState(false);
  const [termsAgreed, setTermsAgreed] = useState(false);
  const [privacyAgreed, setPrivacyAgreed] = useState(false);

  // Modal states
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);

  const allAgreementsAccepted = notificationsAgreed && termsAgreed && privacyAgreed;

  useEffect(() => {
    console.log('🔍 Component mounted, checking notification status...');
    console.log('Browser support:', 'Notification' in window);
    console.log('ServiceWorker support:', 'serviceWorker' in navigator);
    console.log('PushManager support:', 'PushManager' in window);

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
          })
          .catch((error) => {
            console.error('Error getting existing subscription:', error);
          });
      }
    } else {
      console.error('❌ Notifications not supported in this browser');
    }
  }, [disabled]);

  // Function to detect if we're in private/incognito mode
  const isPrivateBrowsing = async (): Promise<boolean> => {
    // This is a rough detection - not 100% reliable across all browsers
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

  const handleNotificationsToggle = async (checked: boolean) => {
    console.log('🔔 Notification toggle clicked:', { checked, disabled, pushSubscription });

    if (disabled) {
      console.log('⚠️ Notifications setup disabled, ignoring request');
      return;
    }

    if (!checked) {
      console.log('📴 Unchecking notifications agreement');
      setNotificationsAgreed(false);
      setError('');
      return;
    }

    // If checking and we already have a subscription, just update the agreement
    if (checked && pushSubscription) {
      console.log('✅ Already have subscription, just updating agreement');
      setNotificationsAgreed(true);
      setError('');
      return;
    }

    // Check for private browsing mode
    const isPrivate = await isPrivateBrowsing();
    if (isPrivate) {
      console.log('🕵️ Private browsing detected');
      setError('Notifications may not work in private/incognito mode. Please try in a regular browser window.');
      setNotificationsAgreed(false);
      return;
    }

    // If checking and we don't have a subscription, ALWAYS trigger permission request
    if (checked) {
      console.log('🚀 Starting notification setup process...');
      setIsSettingUp(true);
      setError('');

      try {
        console.log('📲 Requesting notification permission...');
        console.log(
          'Current Notification.permission:',
          'Notification' in window ? Notification.permission : 'Not supported',
        );
        console.log('About to call requestNotificationPermission()...');

        // Let's see what this function actually does
        const permission = await requestNotificationPermission();
        console.log('🎯 Permission result from requestNotificationPermission():', permission);
        console.log('Current Notification.permission after request:', Notification.permission);
        setNotificationPermission(permission);

        if (permission === 'granted') {
          console.log('✅ Permission granted, subscribing to push notifications...');
          console.log('About to call subscribeToPushNotifications()...');
          const subscription = await subscribeToPushNotifications();
          console.log('📨 Subscription result:', subscription);
          console.log('Subscription type:', typeof subscription);

          if (subscription) {
            setPushSubscription(subscription);
            setNotificationsAgreed(true);
            console.log('🎉 Notification setup completed successfully!');
          } else {
            console.error('❌ Failed to get push subscription - subscription is falsy');
            setError('Failed to setup notifications. Please try again.');
            setNotificationsAgreed(false);
          }
        } else if (permission === 'denied') {
          console.log('🚫 Permission denied by user');
          setError(
            "Notifications are blocked. If you're in private/incognito mode, please try in a regular window. Otherwise, check your browser notification settings.",
          );
          setNotificationsAgreed(false);
        } else {
          console.log('❓ Permission dismissed or default:', permission);
          setError('Please allow notifications when the browser asks, then try again.');
          setNotificationsAgreed(false);
        }
      } catch (error) {
        console.error('💥 Error setting up notifications:', error);
        console.error('Error details:', {
          error,
        });
        setNotificationsAgreed(false);
      } finally {
        console.log('🏁 Notification setup process finished');
        setIsSettingUp(false);
      }
    }
  };

  const handleComplete = () => {
    if (disabled) {
      console.log('⚠️ Registration disabled, ignoring complete request');
      return;
    }

    if (pushSubscription && allAgreementsAccepted) {
      onNotificationsReady(pushSubscription);
    }
  };

  const isInteractionDisabled = disabled || isSettingUp;
  const canProceed = pushSubscription && allAgreementsAccepted && !isInteractionDisabled;

  return (
    <div className="flex flex-col px-6 py-8">
      {/* Main Content */}
      <div className="space-y-6">
        {/* Error Display */}
        {error && !disabled && (
          <div className="bg-red-500/20 border border-red-500/50 rounded-xl p-4 mb-6">
            <p className="text-sm text-red-300 font-light">{error}</p>
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

        {/* Legal Agreements Section */}
        <div className="p-5 bg-gray-800/30 rounded-xl border border-gray-700">
          <h3 className="text-white font-semibold text-sm mb-4 flex items-center">
            <svg className="w-4 h-4 mr-2 text-nocenaPink" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            Required Agreements
          </h3>

          <div className="space-y-4">
            {/* Notifications Agreement */}
            <label className="flex items-start space-x-3 cursor-pointer group">
              <div className="relative flex-shrink-0 mt-0.5">
                <input
                  type="checkbox"
                  checked={notificationsAgreed}
                  onChange={(e) => handleNotificationsToggle(e.target.checked)}
                  disabled={isInteractionDisabled}
                  className="sr-only"
                />
                <div
                  className={`w-5 h-5 rounded border-2 transition-all duration-200 ${
                    notificationsAgreed
                      ? 'bg-nocenaPink border-nocenaPink'
                      : 'border-gray-500 group-hover:border-gray-400'
                  } ${isInteractionDisabled ? 'opacity-50' : ''}`}
                >
                  {notificationsAgreed && (
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
                {/* Loading indicator for notifications setup */}
                {isSettingUp && (
                  <div className="absolute -top-1 -right-1 w-3 h-3 border border-nocenaPink border-t-transparent rounded-full animate-spin"></div>
                )}
              </div>
              <div className="text-sm">
                <span className="text-gray-300">
                  {isSettingUp
                    ? 'Setting up notifications...'
                    : 'I consent to receive push notifications for challenges, rewards, and app updates.'}
                </span>
              </div>
            </label>

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
              </div>
            </label>
          </div>
        </div>
      </div>

      {/* Main Action Button */}
      <div className="mt-8">
        <PrimaryButton
          text={
            disabled
              ? 'Creating account...'
              : !notificationsAgreed
                ? 'Enable notifications to continue'
                : !pushSubscription
                  ? 'Setting up notifications...'
                  : !allAgreementsAccepted
                    ? 'Accept all agreements to continue'
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
