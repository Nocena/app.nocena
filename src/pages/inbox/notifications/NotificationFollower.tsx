import React from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../../../contexts/AuthContext';
import Image from 'next/image';
import ThematicContainer from '../../../components/ui/ThematicContainer';
import ThematicImage from '../../../components/ui/ThematicImage';

interface NotificationBase {
  id: string;
  content?: string;
  createdAt: string;
  notificationType: string;
  isRead?: boolean;
  triggeredBy?: {
    id?: string;
    username?: string;
    profilePicture?: string;
  };
  reward?: number;
  privateChallenge?: {
    id: string;
    title: string;
    description: string;
  };
  publicChallenge?: {
    id: string;
    title: string;
    description: string;
  };
  aiChallenge?: {
    id: string;
    title: string;
    description: string;
    frequency: string;
  };
}

interface NotificationFollowerProps {
  username: string;
  profilePicture: string;
  id?: string;
  notification?: NotificationBase; // Use full notification type
}

const NotificationFollower: React.FC<NotificationFollowerProps> = ({ username, profilePicture, id, notification }) => {
  const router = useRouter();
  const { user } = useAuth();

  const handleProfileRedirect = () => {
    if (!id) return;

    if (user?.id === id) {
      router.push('/profile');
    } else {
      router.push(`/profile/${id}`);
    }
  };

  // Display NEW tag if isRead is true (for testing)
  const shouldShowNew = notification && notification.isRead === false;
  console.log('NotificationFollower - notification:', notification);
  console.log('NotificationFollower - isRead:', notification?.isRead);
  console.log('NotificationFollower - shouldShowNew:', shouldShowNew);

  return (
    <ThematicContainer
      asButton={false}
      glassmorphic={true}
      color="nocenaBlue"
      rounded="xl"
      className="w-full max-w-lg px-6 py-2 cursor-pointer hover:brightness-110 transition-all relative"
      onClick={handleProfileRedirect}
    >
      {/* New Follower Text - smaller and less bold */}
      <div className="text-lg font-light mb-2">New follower!</div>

      {/* User Info Row */}
      <div className="flex items-center justify-between">
        {/* User Info */}
        <div className="flex items-center space-x-5">
          <ThematicImage className="rounded-full">
            <Image
              src={profilePicture}
              alt="User Profile"
              width={40}
              height={40}
              className="w-8 h-8 object-cover rounded-full"
            />
          </ThematicImage>
          {/* Username - bigger and bold */}
          <span className="text-lg font-bold">{username}</span>
        </div>

        {/* NEW tag for unread notifications - positioned in upper right */}
        {shouldShowNew && (
          <div className="absolute top-2 right-6 transform translate-y-[-100%]">
            <ThematicContainer
              asButton={false}
              color="nocenaBlue"
              isActive={true}
              className="text-xs font-medium px-4"
              rounded="xl"
            >
              NEW
            </ThematicContainer>
          </div>
        )}
      </div>
    </ThematicContainer>
  );
};

export default NotificationFollower;
