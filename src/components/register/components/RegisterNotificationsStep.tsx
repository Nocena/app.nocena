import { useState, useEffect } from 'react';
import PrimaryButton from '../../ui/PrimaryButton';
import ThematicContainer from '../../ui/ThematicContainer';
import { subscribeToPushNotifications, requestNotificationPermission } from '../../../lib/pushNotifications';

interface Props {
  onNotificationsReady: (pushSubscription: string) => void;
}

const RegisterNotificationsStep = ({ onNotificationsReady }: Props) => {
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>('default');
  const [pushSubscription, setPushSubscription] = useState<string | null>(null);
  const [isSettingUp, setIsSettingUp] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // Check current notification permission on component mount
    if ('Notification' in window) {
      setNotificationPermission(Notification.permission);
      if (Notification.permission === 'granted') {
        handleEnableNotifications();
      }
    }
  }, []);

  const handleEnableNotifications = async () => {
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
    if (pushSubscription) {
      onNotificationsReady(pushSubscription);
    }
  };

  return (
    <div className="flex flex-col px-6 py-8">
      <div className="text-center mb-8">
        <div className="relative w-20 h-20 mx-auto mb-6">
          <div className="absolute inset-0 bg-gradient-to-br from-nocenaPink via-purple-500 to-nocenaPurple rounded-2xl animate-pulse opacity-20"></div>
          <div className="relative w-full h-full bg-gradient-to-br from-nocenaPink to-nocenaPurple rounded-2xl flex items-center justify-center backdrop-blur-sm border border-white border-opacity-10">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
          </div>
        </div>
        <h2 className="text-2xl font-bold text-white mb-3 tracking-tight">Stay Connected</h2>
        <p className="text-gray-400 text-sm font-light">Get notified about new challenges and reward opportunities</p>
      </div>

      <ThematicContainer
        color={pushSubscription ? 'nocenaPink' : 'nocenaBlue'}
        asButton={false}
        glassmorphic={true}
        rounded="xl"
        className="p-6 mb-8 border border-white border-opacity-5"
      >
        <div className="text-center">
          {pushSubscription ? (
            <div className="flex items-center justify-center space-x-4">
              <div className="w-12 h-12 bg-emerald-500 rounded-2xl flex items-center justify-center shadow-lg">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                  <polyline points="20,6 9,17 4,12" />
                </svg>
              </div>
              <div className="text-left">
                <span className="text-emerald-400 font-bold text-base tracking-wide">NOTIFICATIONS ACTIVE</span>
                <p className="text-gray-300 text-sm font-light">Ready to receive challenges and rewards</p>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {error && (
                <div className="bg-red-500 bg-opacity-20 border border-red-500 border-opacity-50 rounded-lg p-4">
                  <p className="text-sm text-red-300 font-light">{error}</p>
                </div>
              )}

              <div className="space-y-4">
                <div className="flex items-center space-x-4 p-4 bg-black bg-opacity-30 rounded-xl border border-white border-opacity-10">
                  <div className="w-10 h-10 bg-gradient-to-br from-nocenaBlue to-blue-600 rounded-xl flex items-center justify-center flex-shrink-0">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                      <circle cx="12" cy="12" r="10" />
                      <polyline points="12,6 12,12 16,14" />
                    </svg>
                  </div>
                  <div className="text-left flex-1">
                    <h4 className="text-white font-semibold text-sm">Daily Challenge Alerts</h4>
                    <p className="text-gray-400 text-xs font-light">Get notified when new challenges are available</p>
                  </div>
                </div>

                <div className="flex items-center space-x-4 p-4 bg-black bg-opacity-30 rounded-xl border border-white border-opacity-10">
                  <div className="w-10 h-10 bg-gradient-to-br from-nocenaPink to-pink-600 rounded-xl flex items-center justify-center flex-shrink-0">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                      <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                    </svg>
                  </div>
                  <div className="text-left flex-1">
                    <h4 className="text-white font-semibold text-sm">Reward Notifications</h4>
                    <p className="text-gray-400 text-xs font-light">Know instantly when you earn tokens</p>
                  </div>
                </div>

                <div className="flex items-center space-x-4 p-4 bg-black bg-opacity-30 rounded-xl border border-white border-opacity-10">
                  <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center flex-shrink-0">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                      <circle cx="9" cy="7" r="4" />
                      <path d="m22 21-3-3 3-3" />
                    </svg>
                  </div>
                  <div className="text-left flex-1">
                    <h4 className="text-white font-semibold text-sm">Friend Activity</h4>
                    <p className="text-gray-400 text-xs font-light">See when friends complete challenges</p>
                  </div>
                </div>
              </div>

              <button
                onClick={handleEnableNotifications}
                disabled={isSettingUp}
                className="w-full text-sm py-4 px-6 bg-gradient-to-r from-nocenaBlue to-nocenaPink text-white rounded-xl hover:shadow-xl transition-all duration-300 disabled:opacity-50 font-medium tracking-wide border border-white border-opacity-10"
              >
                {isSettingUp ? (
                  <div className="flex items-center justify-center space-x-3">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>SETTING UP NOTIFICATIONS...</span>
                  </div>
                ) : (
                  'ENABLE NOTIFICATIONS'
                )}
              </button>
            </div>
          )}
        </div>
      </ThematicContainer>

      <PrimaryButton
        text={pushSubscription ? 'COMPLETE SETUP' : 'ENABLE NOTIFICATIONS TO CONTINUE'}
        onClick={pushSubscription ? handleComplete : handleEnableNotifications}
        className={`w-full ${!pushSubscription ? 'opacity-50' : ''}`}
        disabled={!pushSubscription || isSettingUp}
      />
    </div>
  );
};

export default RegisterNotificationsStep;
