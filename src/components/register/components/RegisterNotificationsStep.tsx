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
    // Check current notification permission on component mount
    if ('Notification' in window) {
      setNotificationPermission(Notification.permission);
      if (Notification.permission === 'granted' && !disabled) {
        handleEnableNotifications();
      }
    }
  }, [disabled]);

  const handleEnableNotifications = async () => {
    if (disabled) {
      console.log('⚠️ Notifications setup disabled, ignoring request');
      return;
    }

    setIsSettingUp(true);
    setError('');

    try {
      const permission = await requestNotificationPermission();
      setNotificationPermission(permission);

      if (permission === 'granted') {
        const subscription = await subscribeToPushNotifications();
        if (subscription) {
          setPushSubscription(subscription);
        } else {
          setError('Failed to setup notifications. Please try again.');
        }
      } else {
        setError('Notifications are required to receive challenges and rewards. Please allow notifications.');
      }
    } catch (error) {
      console.error('Error setting up notifications:', error);
      setError('Failed to setup notifications. Please try again.');
    } finally {
      setIsSettingUp(false);
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
        {/* Notifications Status */}
        {pushSubscription ? (
          <div className="p-6 bg-gradient-to-r from-emerald-500/20 to-green-500/20 rounded-2xl border border-emerald-500/30">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-emerald-500 rounded-2xl flex items-center justify-center shadow-lg flex-shrink-0">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                  <polyline points="20,6 9,17 4,12" />
                </svg>
              </div>
              <div>
                <h3 className="text-emerald-400 font-bold text-base tracking-wide">NOTIFICATIONS ACTIVE</h3>
                <p className="text-emerald-100 text-sm font-light">
                  {disabled ? 'Creating your account...' : 'Ready to receive challenges and rewards'}
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Error Display */}
            {error && !disabled && (
              <div className="bg-red-500/20 border border-red-500/50 rounded-xl p-4">
                <p className="text-sm text-red-300 font-light">{error}</p>
              </div>
            )}

            {/* Registration Status */}
            {disabled && (
              <div className="bg-blue-500/20 border border-blue-500/50 rounded-xl p-4">
                <div className="flex items-center justify-center space-x-3">
                  <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
                  <p className="text-sm text-blue-300 font-light">Creating your account, please wait...</p>
                </div>
              </div>
            )}

            {/* Notification Features Preview */}
            <div className="grid gap-3">
              <div className="flex items-center space-x-4 p-4 bg-gray-800/50 rounded-xl border border-gray-700">
                <div className="w-10 h-10 bg-gradient-to-br from-nocenaBlue to-blue-600 rounded-xl flex items-center justify-center flex-shrink-0">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12,6 12,12 16,14" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h4 className="text-white font-semibold text-sm">Daily Challenge Alerts</h4>
                  <p className="text-gray-400 text-xs">Get notified when new challenges are available</p>
                </div>
              </div>

              <div className="flex items-center space-x-4 p-4 bg-gray-800/50 rounded-xl border border-gray-700">
                <div className="w-10 h-10 bg-gradient-to-br from-nocenaPink to-pink-600 rounded-xl flex items-center justify-center flex-shrink-0">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                    <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h4 className="text-white font-semibold text-sm">Reward Notifications</h4>
                  <p className="text-gray-400 text-xs">Know instantly when you earn tokens</p>
                </div>
              </div>

              <div className="flex items-center space-x-4 p-4 bg-gray-800/50 rounded-xl border border-gray-700">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center flex-shrink-0">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="m22 21-3-3 3-3" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h4 className="text-white font-semibold text-sm">Friend Activity</h4>
                  <p className="text-gray-400 text-xs">See when friends complete challenges</p>
                </div>
              </div>
            </div>

            {/* Enable Notifications Button */}
            {!pushSubscription && (
              <button
                onClick={handleEnableNotifications}
                disabled={isInteractionDisabled}
                className={`w-full text-sm py-4 px-6 bg-gradient-to-r from-nocenaBlue to-nocenaPink text-white rounded-xl hover:shadow-xl transition-all duration-300 font-medium tracking-wide border border-white/10 ${
                  isInteractionDisabled ? 'opacity-50 cursor-not-allowed' : 'hover:opacity-90'
                }`}
              >
                {disabled ? (
                  <div className="flex items-center justify-center space-x-3">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>CREATING ACCOUNT...</span>
                  </div>
                ) : isSettingUp ? (
                  <div className="flex items-center justify-center space-x-3">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>SETTING UP NOTIFICATIONS...</span>
                  </div>
                ) : (
                  'ENABLE NOTIFICATIONS'
                )}
              </button>
            )}
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

          <div className="space-y-3">
            {/* Notifications Agreement */}
            <label className="flex items-start space-x-3 cursor-pointer group">
              <div className="relative flex-shrink-0 mt-0.5">
                <input
                  type="checkbox"
                  checked={notificationsAgreed}
                  onChange={(e) => setNotificationsAgreed(e.target.checked)}
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
              </div>
              <div className="text-sm">
                <span className="text-gray-300">
                  I consent to receive push notifications for challenges, rewards, and app updates.
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
              : !pushSubscription
                ? 'Enable notifications first'
                : !allAgreementsAccepted
                  ? 'Accept all to continue'
                  : 'Complete setup'
          }
          onClick={
            pushSubscription && !allAgreementsAccepted
              ? undefined
              : pushSubscription
                ? handleComplete
                : handleEnableNotifications
          }
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
