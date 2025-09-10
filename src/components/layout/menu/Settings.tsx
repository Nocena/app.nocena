import React, { useState, useEffect } from 'react';
import { usePermissions } from '../../../hooks/usePermissions';
import { Settings, Camera, Mic, Bell, RefreshCw, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';

interface NotificationState {
  permission: NotificationPermission;
  isSubscribed: boolean;
  isInSync: boolean;
  needsUpdate: boolean;
  isLoading: boolean;
  error?: string;
}

interface SettingsMenuProps {
  onBack: () => void;
  notificationState?: NotificationState;
  onEnableNotifications?: () => Promise<void>;
  onSyncNotifications?: () => Promise<void>;
  onRefreshNotificationStatus?: () => Promise<void>;
}

const SettingsMenu: React.FC<SettingsMenuProps> = ({
  onBack,
  notificationState,
  onEnableNotifications,
  onSyncNotifications,
  onRefreshNotificationStatus,
}) => {
  const {
    permissionState,
    isLoading,
    error,
    requestCameraPermission,
    requestMicrophonePermission,
    requestNotificationPermission,
    requestAllPermissions,
    hasEssentialPermissions,
    clearError,
  } = usePermissions();

  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const [isRequesting, setIsRequesting] = useState<{
    camera: boolean;
    microphone: boolean;
    notifications: boolean;
    all: boolean;
    pushSync: boolean;
  }>({
    camera: false,
    microphone: false,
    notifications: false,
    all: false,
    pushSync: false,
  });

  useEffect(() => {
    setLastRefresh(new Date());
  }, []);

  const handleRequest = async (
    permission: 'camera' | 'microphone' | 'notifications' | 'all',
    requestFn: () => Promise<any>,
  ) => {
    setIsRequesting((prev) => ({ ...prev, [permission]: true }));
    try {
      await requestFn();
    } catch (error) {
      console.error(`Failed to request ${permission} permission:`, error);
    } finally {
      setIsRequesting((prev) => ({ ...prev, [permission]: false }));
    }
  };

  const handleEnablePushNotifications = async () => {
    if (!onEnableNotifications) return;

    setIsRequesting((prev) => ({ ...prev, pushSync: true }));
    try {
      await onEnableNotifications();
    } catch (error) {
      console.error('Failed to enable push notifications:', error);
    } finally {
      setIsRequesting((prev) => ({ ...prev, pushSync: false }));
    }
  };

  const handleSyncPushNotifications = async () => {
    if (!onSyncNotifications) return;

    setIsRequesting((prev) => ({ ...prev, pushSync: true }));
    try {
      await onSyncNotifications();
    } catch (error) {
      console.error('Failed to sync push notifications:', error);
    } finally {
      setIsRequesting((prev) => ({ ...prev, pushSync: false }));
    }
  };

  const handleRefreshStatus = async () => {
    if (!onRefreshNotificationStatus) return;

    setIsRequesting((prev) => ({ ...prev, pushSync: true }));
    try {
      await onRefreshNotificationStatus();
      setLastRefresh(new Date());
    } catch (error) {
      console.error('Failed to refresh notification status:', error);
    } finally {
      setIsRequesting((prev) => ({ ...prev, pushSync: false }));
    }
  };

  const getStatusIcon = (state: string) => {
    switch (state) {
      case 'granted':
        return <CheckCircle className="w-4 h-4 text-green-400" />;
      case 'denied':
        return <XCircle className="w-4 h-4 text-red-400" />;
      case 'prompt':
        return <AlertTriangle className="w-4 h-4 text-yellow-400" />;
      default:
        return <div className="w-4 h-4 rounded-full bg-white/40" />;
    }
  };

  const getPushNotificationStatus = () => {
    if (!notificationState) return { icon: <div className="w-4 h-4 rounded-full bg-white/40" />, text: 'Unknown' };

    if (notificationState.isLoading) {
      return { icon: <RefreshCw className="w-4 h-4 text-blue-400 animate-spin" />, text: 'Checking...' };
    }

    if (notificationState.permission === 'denied') {
      return { icon: <XCircle className="w-4 h-4 text-red-400" />, text: 'Permission Denied' };
    }

    if (!notificationState.isSubscribed) {
      return { icon: <AlertTriangle className="w-4 h-4 text-yellow-400" />, text: 'Not Subscribed' };
    }

    if (notificationState.needsUpdate) {
      return { icon: <AlertTriangle className="w-4 h-4 text-orange-400" />, text: 'Needs Sync' };
    }

    if (notificationState.isSubscribed && notificationState.isInSync) {
      return { icon: <CheckCircle className="w-4 h-4 text-green-400" />, text: 'Active & Synced' };
    }

    return { icon: <div className="w-4 h-4 rounded-full bg-white/40" />, text: 'Unknown' };
  };

  const missingPermissions = [
    permissionState.camera !== 'granted' && 'Camera',
    permissionState.microphone !== 'granted' && 'Microphone',
    permissionState.notifications !== 'granted' && 'Notifications',
  ].filter(Boolean);

  const pushStatus = getPushNotificationStatus();

  return (
    <div className="p-6">
      <div
        onTouchStart={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onBack();
        }}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onBack();
        }}
        className="flex items-center text-white/70 hover:text-white mb-6 transition-colors cursor-pointer select-none"
        role="button"
        tabIndex={0}
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className="mr-2"
        >
          <polyline points="15,18 9,12 15,6" />
        </svg>
        Back to Menu
      </div>

      <div className="flex items-center space-x-3 mb-6">
        <div className="w-12 h-12 bg-nocenaPurple rounded-xl flex items-center justify-center">
          <Settings className="w-6 h-6 text-white" />
        </div>
        <div>
          <h2 className="text-white text-2xl font-bold">Settings</h2>
          <p className="text-white/60 text-sm">
            App permissions and preferences
            {!isLoading && <span className="block text-xs mt-1">Last checked: {lastRefresh.toLocaleTimeString()}</span>}
          </p>
        </div>
      </div>

      {/* Error Display */}
      {(error || notificationState?.error) && (
        <div className="bg-red-500/20 rounded-2xl p-4 mb-6 border border-red-500/30">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              {error && <div className="text-red-300 text-sm">{error}</div>}
              {notificationState?.error && <div className="text-red-300 text-sm">Push: {notificationState.error}</div>}
            </div>
            <button
              onClick={() => {
                clearError();
              }}
              className="text-red-400 hover:text-red-300"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-white/20 border-t-white/70 rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-white/70 text-base">Checking permissions...</p>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Overall Status */}
          {missingPermissions.length > 0 ? (
            <div className="bg-red-500/20 rounded-2xl p-4 border border-red-500/30">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-white font-semibold mb-1 text-lg">
                    {missingPermissions.length} permission{missingPermissions.length > 1 ? 's' : ''} needed
                  </div>
                  <div className="text-red-300 text-sm">Missing: {missingPermissions.join(', ')}</div>
                </div>
                <button
                  onClick={() => handleRequest('all', requestAllPermissions)}
                  disabled={isRequesting.all}
                  className="px-4 py-2 bg-red-600 hover:bg-red-500 disabled:bg-red-800 text-white text-sm rounded-lg transition-colors"
                >
                  {isRequesting.all ? 'Requesting...' : 'Fix All'}
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-green-500/20 rounded-2xl p-4 border border-green-500/30">
              <div className="flex items-center space-x-3">
                <CheckCircle className="w-5 h-5 text-green-400" />
                <div>
                  <div className="text-green-300 font-semibold text-lg">All permissions granted</div>
                  <div className="text-green-300/80 text-sm">Your app is ready to use all features</div>
                </div>
              </div>
            </div>
          )}

          {/* Permission Items */}
          <div className="space-y-4">
            {/* Camera Permission */}
            <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-nocenaBlue/20 rounded-lg flex items-center justify-center">
                    <Camera className="w-5 h-5 text-nocenaBlue" />
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="text-white font-medium">Camera</span>
                      {getStatusIcon(permissionState.camera)}
                    </div>
                    <div className="text-white/60 text-sm">Record challenge videos</div>
                  </div>
                </div>
                {permissionState.camera !== 'granted' && (
                  <button
                    onClick={() => handleRequest('camera', requestCameraPermission)}
                    disabled={isRequesting.camera}
                    className={`px-3 py-2 rounded-lg text-sm transition-colors ${
                      isRequesting.camera
                        ? 'bg-white/10 text-white/40'
                        : permissionState.camera === 'denied'
                          ? 'bg-red-600 hover:bg-red-500 text-white'
                          : 'bg-nocenaBlue hover:bg-nocenaBlue/80 text-white'
                    }`}
                  >
                    {isRequesting.camera ? 'Requesting...' : permissionState.camera === 'denied' ? 'Blocked' : 'Allow'}
                  </button>
                )}
              </div>
              {permissionState.camera === 'denied' && (
                <div className="mt-3 p-2 bg-red-500/20 rounded text-xs text-red-300">
                  Permission was blocked. Go to your browser settings to allow camera access.
                </div>
              )}
            </div>

            {/* Microphone Permission */}
            <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-nocenaPink/20 rounded-lg flex items-center justify-center">
                    <Mic className="w-5 h-5 text-nocenaPink" />
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="text-white font-medium">Microphone</span>
                      {getStatusIcon(permissionState.microphone)}
                    </div>
                    <div className="text-white/60 text-sm">Capture audio with videos</div>
                  </div>
                </div>
                {permissionState.microphone !== 'granted' && (
                  <button
                    onClick={() => handleRequest('microphone', requestMicrophonePermission)}
                    disabled={isRequesting.microphone}
                    className={`px-3 py-2 rounded-lg text-sm transition-colors ${
                      isRequesting.microphone
                        ? 'bg-white/10 text-white/40'
                        : permissionState.microphone === 'denied'
                          ? 'bg-red-600 hover:bg-red-500 text-white'
                          : 'bg-nocenaPink hover:bg-nocenaPink/80 text-white'
                    }`}
                  >
                    {isRequesting.microphone
                      ? 'Requesting...'
                      : permissionState.microphone === 'denied'
                        ? 'Blocked'
                        : 'Allow'}
                  </button>
                )}
              </div>
              {permissionState.microphone === 'denied' && (
                <div className="mt-3 p-2 bg-red-500/20 rounded text-xs text-red-300">
                  Permission was blocked. Go to your browser settings to allow microphone access.
                </div>
              )}
            </div>

            {/* Basic Notifications Permission */}
            <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-nocenaPurple/20 rounded-lg flex items-center justify-center">
                    <Bell className="w-5 h-5 text-nocenaPurple" />
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="text-white font-medium">Notifications</span>
                      {getStatusIcon(permissionState.notifications)}
                    </div>
                    <div className="text-white/60 text-sm">Basic notification permission</div>
                  </div>
                </div>
                {permissionState.notifications !== 'granted' && (
                  <button
                    onClick={() => handleRequest('notifications', requestNotificationPermission)}
                    disabled={isRequesting.notifications}
                    className={`px-3 py-2 rounded-lg text-sm transition-colors ${
                      isRequesting.notifications
                        ? 'bg-white/10 text-white/40'
                        : permissionState.notifications === 'denied'
                          ? 'bg-red-600 hover:bg-red-500 text-white'
                          : 'bg-nocenaPurple hover:bg-nocenaPurple/80 text-white'
                    }`}
                  >
                    {isRequesting.notifications
                      ? 'Requesting...'
                      : permissionState.notifications === 'denied'
                        ? 'Blocked'
                        : 'Allow'}
                  </button>
                )}
              </div>
              {permissionState.notifications === 'denied' && (
                <div className="mt-3 p-2 bg-red-500/20 rounded text-xs text-red-300">
                  Permission was blocked. Go to your browser settings to allow notifications.
                </div>
              )}
            </div>

            {/* Enhanced Push Notifications Section */}
            {notificationState && (
              <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-nocenaBlue/20 rounded-lg flex items-center justify-center">
                      <Bell className="w-5 h-5 text-nocenaBlue" />
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="text-white font-medium">Push Notifications</span>
                        {pushStatus.icon}
                      </div>
                      <div className="text-white/60 text-sm">Advanced notification system</div>
                    </div>
                  </div>
                  <button
                    onClick={handleRefreshStatus}
                    disabled={isRequesting.pushSync}
                    className="px-2 py-1 rounded text-xs bg-white/10 hover:bg-white/20 text-white/70 hover:text-white transition-colors"
                    title="Refresh status"
                  >
                    <RefreshCw className={`w-4 h-4 ${isRequesting.pushSync ? 'animate-spin' : ''}`} />
                  </button>
                </div>

                {/* Push notification actions */}
                <div className="space-y-2">
                  {!notificationState.isSubscribed && notificationState.permission !== 'denied' && (
                    <button
                      onClick={handleEnablePushNotifications}
                      disabled={isRequesting.pushSync || !onEnableNotifications}
                      className="w-full px-3 py-2 bg-nocenaBlue hover:bg-nocenaBlue/80 disabled:bg-nocenaBlue/50 text-white text-sm rounded-lg transition-colors"
                    >
                      {isRequesting.pushSync ? 'Setting up...' : 'Enable Push Notifications'}
                    </button>
                  )}

                  {notificationState.needsUpdate && (
                    <button
                      onClick={handleSyncPushNotifications}
                      disabled={isRequesting.pushSync || !onSyncNotifications}
                      className="w-full px-3 py-2 bg-orange-600 hover:bg-orange-500 disabled:bg-orange-800 text-white text-sm rounded-lg transition-colors"
                    >
                      {isRequesting.pushSync ? 'Syncing...' : 'Sync Device Subscription'}
                    </button>
                  )}

                  {notificationState.isSubscribed && notificationState.isInSync && (
                    <div className="p-2 bg-green-500/20 rounded text-xs text-green-300">
                      ✓ Push notifications are active and synced with your device
                    </div>
                  )}

                  {notificationState.permission === 'denied' && (
                    <div className="p-2 bg-red-500/20 rounded text-xs text-red-300">
                      Push notifications are blocked. Enable basic notifications first, then refresh this page.
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Help Section */}
          <div className="bg-gradient-to-r from-nocenaPink/10 to-nocenaBlue/10 rounded-2xl p-6 border border-nocenaPink/20">
            <h3 className="text-white font-semibold mb-3 text-lg">Troubleshooting</h3>
            <div className="space-y-2">
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-nocenaPink rounded-full mt-2 flex-shrink-0"></div>
                <p className="text-white/70 text-sm">If permissions are blocked, check your browser settings</p>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-nocenaBlue rounded-full mt-2 flex-shrink-0"></div>
                <p className="text-white/70 text-sm">On iOS, permissions may reset when the app updates</p>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-nocenaPurple rounded-full mt-2 flex-shrink-0"></div>
                <p className="text-white/70 text-sm">Close other apps using camera/microphone if access fails</p>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-nocenaPink rounded-full mt-2 flex-shrink-0"></div>
                <p className="text-white/70 text-sm">Try refreshing the app if permissions aren't detected</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SettingsMenu;
