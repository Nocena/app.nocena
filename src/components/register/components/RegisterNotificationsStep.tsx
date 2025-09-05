import { useState, useEffect } from 'react';
import PrimaryButton from '../../ui/PrimaryButton';
import ThematicContainer from '../../ui/ThematicContainer';
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
        setHasTriedNotifications(true);
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
    if (notificationPermission === 'denied') {
      console.log('🚫 Notifications denied, cannot trigger popup again');
      setError('Notifications are blocked in your browser. You can enable them later in settings.');
      setHasTriedNotifications(true);
      return;
    }

    // Check for private browsing mode
    const isPrivate = await isPrivateBrowsing();
    if (isPrivate) {
      console.log('🕵️ Private browsing detected');
      setError('Notifications may not work in private/incognito mode. You can enable them later in settings.');
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
        try {
          const subscription = await subscribeToPushNotifications();
          console.log('📨 Subscription result:', subscription);

          if (subscription) {
            setPushSubscription(subscription);
            console.log('🎉 Notification setup completed successfully!');
          } else {
            console.warn('⚠️ Failed to get push subscription, but permission was granted');
            setError('Notifications enabled but subscription failed. You can try again later in settings.');
          }
        } catch (subscriptionError) {
          console.error('❌ Push subscription error:', subscriptionError);
          setError('Notifications enabled but subscription failed. You can try again later in settings.');
        }
      } else if (permission === 'denied') {
        console.log('🚫 Permission denied by user');
        setError('Notifications were blocked. You can enable them later in settings.');
      } else {
        console.log('❓ Permission dismissed or default:', permission);
        setError('Notification permission was dismissed. You can enable them later in settings.');
      }
    } catch (error) {
      console.error('💥 Error setting up notifications:', error);
      setError('Failed to setup notifications. You can enable them later in settings.');
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

  const isInteractionDisabled = disabled || isSettingUp;
  const canProceed = allAgreementsAccepted && !isInteractionDisabled;

  return (
    <div className="w-full max-w-md mx-auto space-y-6">
      <ThematicContainer color="nocenaPink" glassmorphic={true} asButton={false} rounded="2xl" className="p-8">
        {/* Registration Status */}
        {disabled && (
          <div className="bg-blue-500/20 border border-blue-500/30 rounded-xl p-4 mb-6">
            <div className="flex items-center justify-center space-x-3">
              <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-sm text-blue-300">Creating your account, please wait...</p>
            </div>
          </div>
        )}

        {/* Error Display */}
        {error && !disabled && (
          <div className="bg-yellow-500/20 border border-yellow-500/30 rounded-xl p-4 mb-6">
            <div className="flex items-start space-x-3">
              <div className="w-5 h-5 bg-yellow-500/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
              </div>
              <div>
                <p className="text-sm text-yellow-300 font-medium mb-1">Notification Setup</p>
                <p className="text-sm text-yellow-200">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Notifications Section */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-nocenaPink/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-nocenaPink/30">
            {notificationsEnabled ? (
              <div className="w-6 h-6 bg-green-400 rounded-full flex items-center justify-center">
                <div className="w-2 h-2 bg-white rounded-full"></div>
              </div>
            ) : hasTriedNotifications ? (
              <div className="w-6 h-6 bg-yellow-400/20 rounded-full flex items-center justify-center border border-yellow-400/30">
                <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
              </div>
            ) : (
              <div className="w-6 h-6 border-2 border-nocenaPink border-dashed rounded-full"></div>
            )}
          </div>

          <h3 className="text-xl font-bold text-white mb-2">
            {notificationsEnabled ? 'Notifications Enabled' : 'Notifications (Optional)'}
          </h3>
          <p className="text-gray-300 text-sm mb-6">
            {notificationsEnabled
              ? "Great! You'll receive notifications about new challenges and rewards."
              : 'You can still use Nocena without notifications. You can enable them later in settings.'}
          </p>

          {/* Notification controls */}
          {!notificationsEnabled && (
            <PrimaryButton
              text={isSettingUp ? 'Setting up notifications...' : 'Try enabling notifications again'}
              onClick={handleEnableNotifications}
              disabled={isInteractionDisabled}
              className="w-full mb-4"
              isActive={true}
            />
          )}
        </div>

        {/* Legal Agreements Section */}
        <div className="space-y-6 mb-8">
          <h4 className="text-white font-bold text-center text-lg">Legal Agreements</h4>

          <div className="space-y-4">
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
                    <div className="w-full h-full flex items-center justify-center">
                      <div className="w-2 h-2 bg-white rounded-full"></div>
                    </div>
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
                    <div className="w-full h-full flex items-center justify-center">
                      <div className="w-2 h-2 bg-white rounded-full"></div>
                    </div>
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

        {/* Complete Setup Button */}
        <PrimaryButton
          text={
            disabled
              ? 'Creating account...'
              : !allAgreementsAccepted
                ? 'Accept legal agreements to continue'
                : 'Complete setup'
          }
          onClick={canProceed ? handleComplete : undefined}
          disabled={!canProceed}
          className="w-full"
          isActive={!canProceed}
        />
      </ThematicContainer>

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
