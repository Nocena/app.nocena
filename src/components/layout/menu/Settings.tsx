import React, { useState, useEffect } from 'react';
import { usePermissions } from '../../../hooks/usePermissions';
import PrimaryButton from '../../ui/PrimaryButton';

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
  onRefreshNotificationStatus 
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

  // Refresh permissions when component mounts
  useEffect(() => {
    setLastRefresh(new Date());
  }, []);

  const handleRequest = async (
    permission: 'camera' | 'microphone' | 'notifications' | 'all',
    requestFn: () => Promise<any>
  ) => {
    setIsRequesting(prev => ({ ...prev, [permission]: true }));
    try {
      await requestFn();
    } catch (error) {
      console.error(`Failed to request ${permission} permission:`, error);
    } finally {
      setIsRequesting(prev => ({ ...prev, [permission]: false }));
    }
  };

  const handleEnablePushNotifications = async () => {
    if (!onEnableNotifications) return;
    
    setIsRequesting(prev => ({ ...prev, pushSync: true }));
    try {
      await onEnableNotifications();
    } catch (error) {
      console.error('Failed to enable push notifications:', error);
    } finally {
      setIsRequesting(prev => ({ ...prev, pushSync: false }));
    }
  };

  const handleSyncPushNotifications = async () => {
    if (!onSyncNotifications) return;
    
    setIsRequesting(prev => ({ ...prev, pushSync: true }));
    try {
      await onSyncNotifications();
    } catch (error) {
      console.error('Failed to sync push notifications:', error);
    } finally {
      setIsRequesting(prev => ({ ...prev, pushSync: false }));
    }
  };

  const handleRefreshStatus = async () => {
    if (!onRefreshNotificationStatus) return;
    
    setIsRequesting(prev => ({ ...prev, pushSync: true }));
    try {
      await onRefreshNotificationStatus();
      setLastRefresh(new Date());
    } catch (error) {
      console.error('Failed to refresh notification status:', error);
    } finally {
      setIsRequesting(prev => ({ ...prev, pushSync: false }));
    }
  };

  const getStatusColor = (state: string) => {
    switch (state) {
      case 'granted': return 'text-green-400';
      case 'denied': return 'text-red-400';
      case 'prompt': return 'text-yellow-400';
      default: return 'text-white/40';
    }
  };

  const getStatusIcon = (state: string) => {
    switch (state) {
      case 'granted': return '✓';
      case 'denied': return '✗';
      case 'prompt': return '?';
      default: return '○';
    }
  };

  const getStatusText = (state: string) => {
    switch (state) {
      case 'granted': return 'Allowed';
      case 'denied': return 'Blocked';
      case 'prompt': return 'Not Set';
      default: return 'Unknown';
    }
  };

  const getPushNotificationStatus = () => {
    if (!notificationState) return { color: 'text-white/40', icon: '○', text: 'Unknown' };
    
    if (notificationState.isLoading) {
      return { color: 'text-blue-400', icon: '⟳', text: 'Checking...' };
    }
    
    if (notificationState.permission === 'denied') {
      return { color: 'text-red-400', icon: '✗', text: 'Permission Denied' };
    }
    
    if (!notificationState.isSubscribed) {
      return { color: 'text-yellow-400', icon: '○', text: 'Not Subscribed' };
    }
    
    if (notificationState.needsUpdate) {
      return { color: 'text-orange-400', icon: '⚠', text: 'Needs Sync' };
    }
    
    if (notificationState.isSubscribed && notificationState.isInSync) {
      return { color: 'text-green-400', icon: '✓', text: 'Active & Synced' };
    }
    
    return { color: 'text-white/40', icon: '○', text: 'Unknown' };
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

      <h2 className="text-white text-2xl font-bold mb-2">Settings</h2>
      <p className="text-white/60 text-sm mb-6">
        App permissions and preferences
        {!isLoading && (
          <span className="block text-xs mt-1">
            Last checked: {lastRefresh.toLocaleTimeString()}
          </span>
        )}
      </p>

      {/* Enhanced error display for both permission and push notification errors */}
      {(error || notificationState?.error) && (
        <div className="mb-4 p-3 bg-red-500/20 rounded-lg border border-red-500/30">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              {error && <div className="text-red-300 text-sm">{error}</div>}
              {notificationState?.error && (
                <div className="text-red-300 text-sm">Push: {notificationState.error}</div>
              )}
            </div>
            <button 
              onClick={() => {
                clearError();
                // Note: We can't clear notificationState.error from here, 
                // but it should clear on next successful operation
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
            <div className="w-6 h-6 border-4 border-white/20 border-t-white/70 rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-white/70 text-base">Checking permissions...</p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Overall Status */}
          {missingPermissions.length > 0 ? (
            <div className="p-4 bg-red-500/20 rounded-lg border border-red-500/30">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-white font-semibold mb-1">
                    {missingPermissions.length} permission{missingPermissions.length > 1 ? 's' : ''} needed
                  </div>
                  <div className="text-sm text-red-300">
                    Missing: {missingPermissions.join(', ')}
                  </div>
                </div>
                <button
                  onClick={() => handleRequest('all', requestAllPermissions)}
                  disabled={isRequesting.all}
                  className="px-4 py-2 bg-red-600 hover:bg-red-500 disabled:bg-red-800 text-white text-sm rounded transition-colors"
                >
                  {isRequesting.all ? 'Requesting...' : 'Fix All'}
                </button>
              </div>
            </div>
          ) : (
            <div className="p-4 bg-green-500/20 rounded-lg border border-green-500/30">
              <div className="flex items-center space-x-2">
                <span className="text-green-400">✓</span>
                <div>
                  <div className="text-green-300 font-semibold">All permissions granted</div>
                  <div className="text-sm text-green-300/80">Your app is ready to use all features</div>
                </div>
              </div>
            </div>
          )}

          {/* Camera Permission */}
          <div className="p-4 bg-white/5 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center">
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    className="text-white/70"
                  >
                    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
                    <circle cx="12" cy="13" r="4"></circle>
                  </svg>
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-white font-medium">Camera</span>
                    <span className={`text-sm ${getStatusColor(permissionState.camera)}`}>
                      {getStatusIcon(permissionState.camera)}
                    </span>
                  </div>
                  <div className="text-sm text-white/60">Record challenge videos</div>
                  <div className={`text-xs ${getStatusColor(permissionState.camera)}`}>
                    Status: {getStatusText(permissionState.camera)}
                  </div>
                </div>
              </div>
              {permissionState.camera !== 'granted' && (
                <button
                  onClick={() => handleRequest('camera', requestCameraPermission)}
                  disabled={isRequesting.camera}
                  className={`px-3 py-1 rounded text-sm transition-colors ${
                    isRequesting.camera
                      ? 'bg-white/10 text-white/40'
                      : permissionState.camera === 'denied'
                      ? 'bg-red-600 hover:bg-red-500 text-white'
                      : 'bg-blue-600 hover:bg-blue-500 text-white'
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
          <div className="p-4 bg-white/5 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center">
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    className="text-white/70"
                  >
                    <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path>
                    <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
                    <line x1="12" y1="19" x2="12" y2="23"></line>
                    <line x1="8" y1="23" x2="16" y2="23"></line>
                  </svg>
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-white font-medium">Microphone</span>
                    <span className={`text-sm ${getStatusColor(permissionState.microphone)}`}>
                      {getStatusIcon(permissionState.microphone)}
                    </span>
                  </div>
                  <div className="text-sm text-white/60">Capture audio with videos</div>
                  <div className={`text-xs ${getStatusColor(permissionState.microphone)}`}>
                    Status: {getStatusText(permissionState.microphone)}
                  </div>
                </div>
              </div>
              {permissionState.microphone !== 'granted' && (
                <button
                  onClick={() => handleRequest('microphone', requestMicrophonePermission)}
                  disabled={isRequesting.microphone}
                  className={`px-3 py-1 rounded text-sm transition-colors ${
                    isRequesting.microphone
                      ? 'bg-white/10 text-white/40'
                      : permissionState.microphone === 'denied'
                      ? 'bg-red-600 hover:bg-red-500 text-white'
                      : 'bg-blue-600 hover:bg-blue-500 text-white'
                  }`}
                >
                  {isRequesting.microphone ? 'Requesting...' : permissionState.microphone === 'denied' ? 'Blocked' : 'Allow'}
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
          <div className="p-4 bg-white/5 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center">
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    className="text-white/70"
                  >
                    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                    <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
                  </svg>
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-white font-medium">Notifications</span>
                    <span className={`text-sm ${getStatusColor(permissionState.notifications)}`}>
                      {getStatusIcon(permissionState.notifications)}
                    </span>
                  </div>
                  <div className="text-sm text-white/60">Basic notification permission</div>
                  <div className={`text-xs ${getStatusColor(permissionState.notifications)}`}>
                    Status: {getStatusText(permissionState.notifications)}
                  </div>
                </div>
              </div>
              {permissionState.notifications !== 'granted' && (
                <button
                  onClick={() => handleRequest('notifications', requestNotificationPermission)}
                  disabled={isRequesting.notifications}
                  className={`px-3 py-1 rounded text-sm transition-colors ${
                    isRequesting.notifications
                      ? 'bg-white/10 text-white/40'
                      : permissionState.notifications === 'denied'
                      ? 'bg-red-600 hover:bg-red-500 text-white'
                      : 'bg-blue-600 hover:bg-blue-500 text-white'
                  }`}
                >
                  {isRequesting.notifications ? 'Requesting...' : permissionState.notifications === 'denied' ? 'Blocked' : 'Allow'}
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
            <div className="p-4 bg-white/5 rounded-lg border-l-4 border-blue-500/50">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-500/20 rounded-full flex items-center justify-center">
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      className="text-blue-400"
                    >
                      <path d="M12 22c5.421 0 10-4.579 10-10s-4.579-10-10-10-10 4.579-10 10 4.579 10 10 10z"/>
                      <path d="M8 14s1.5 2 4 2 4-2 4-2"/>
                      <line x1="9" y1="9" x2="9.01" y2="9"/>
                      <line x1="15" y1="9" x2="15.01" y2="9"/>
                    </svg>
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="text-white font-medium">Push Notifications</span>
                      <span className={`text-sm ${pushStatus.color}`}>
                        {pushStatus.icon}
                      </span>
                    </div>
                    <div className="text-sm text-white/60">Advanced notification system</div>
                    <div className={`text-xs ${pushStatus.color}`}>
                      Status: {pushStatus.text}
                    </div>
                  </div>
                </div>
                <button
                  onClick={handleRefreshStatus}
                  disabled={isRequesting.pushSync}
                  className="px-2 py-1 rounded text-xs bg-white/10 hover:bg-white/20 text-white/70 hover:text-white transition-colors"
                  title="Refresh status"
                >
                  ⟳
                </button>
              </div>

              {/* Push notification actions */}
              <div className="space-y-2">
                {!notificationState.isSubscribed && notificationState.permission !== 'denied' && (
                  <button
                    onClick={handleEnablePushNotifications}
                    disabled={isRequesting.pushSync || !onEnableNotifications}
                    className="w-full px-3 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 text-white text-sm rounded transition-colors"
                  >
                    {isRequesting.pushSync ? 'Setting up...' : 'Enable Push Notifications'}
                  </button>
                )}

                {notificationState.needsUpdate && (
                  <button
                    onClick={handleSyncPushNotifications}
                    disabled={isRequesting.pushSync || !onSyncNotifications}
                    className="w-full px-3 py-2 bg-orange-600 hover:bg-orange-500 disabled:bg-orange-800 text-white text-sm rounded transition-colors"
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

              {/* Technical details (collapsible or always visible for debug) */}
              {notificationState.isSubscribed && (
                <div className="mt-3 pt-3 border-t border-white/10">
                  <div className="text-xs text-white/50 space-y-1">
                    <div>Device subscribed: {notificationState.isSubscribed ? 'Yes' : 'No'}</div>
                    <div>Database synced: {notificationState.isInSync ? 'Yes' : 'No'}</div>
                    {notificationState.needsUpdate && (
                      <div className="text-orange-400">⚠ Device subscription changed - sync required</div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Help Section */}
          <div className="mt-8 pt-6 border-t border-white/10">
            <h3 className="text-white font-semibold mb-3">Troubleshooting</h3>
            <div className="space-y-2 text-sm text-white/60">
              <div>• If permissions are blocked, check your browser settings</div>
              <div>• On iOS, permissions may reset when the app updates</div>
              <div>• Close other apps using camera/microphone if access fails</div>
              <div>• Try refreshing the app if permissions aren't detected</div>
              <div>• Push notifications may need re-sync after switching devices</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SettingsMenu;