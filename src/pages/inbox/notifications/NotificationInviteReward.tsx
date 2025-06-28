import React from 'react';
import Image from 'next/image';
import { useRouter } from 'next/router';
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
}

interface NotificationInviteRewardProps {
  friendUsername: string;
  friendProfilePicture: string;
  friendId?: string;
  notification: NotificationBase;
}

const NotificationInviteReward: React.FC<NotificationInviteRewardProps> = ({
  friendUsername,
  friendProfilePicture,
  friendId,
  notification,
}) => {
  const router = useRouter();

  const handleProfileRedirect = () => {
    if (!friendId) return;
    router.push(`/profile/${friendId}`);
  };

  // Display NEW tag if isRead is false
  const shouldShowNew = notification.isRead === false;

  return (
    <ThematicContainer
      asButton={false}
      glassmorphic={true}
      color="nocenaPurple"
      rounded="xl"
      className="w-full max-w-lg px-6 py-2 cursor-pointer hover:brightness-110 transition-all relative"
      onClick={handleProfileRedirect}
    >
      {/* Invite Reward Text - smaller and less bold */}
      <div className="text-lg font-light mb-2">You have earned a reward for inviting your friend</div>

      {/* User and Reward Info Row */}
      <div className="flex items-center justify-between">
        {/* User Info */}
        <div className="flex items-center space-x-5">
          <ThematicImage className="rounded-full">
            <Image
              src={friendProfilePicture}
              alt="Friend Profile"
              width={40}
              height={40}
              className="w-8 h-8 object-cover rounded-full"
            />
          </ThematicImage>
          {/* Username - bigger and bold */}
          <span className="text-lg font-bold">{friendUsername}</span>
        </div>

        {/* Reward Display - now has relative positioning */}
        <div className="relative">
          {/* NEW tag for unread notifications - positioned above reward */}
          {shouldShowNew && (
            <div className="absolute -top-8 right-0 transform translate-y-[-100%]">
              <ThematicContainer
                asButton={false}
                color="nocenaPurple"
                isActive={true}
                className="text-xs font-medium px-4"
                rounded="xl"
              >
                NEW
              </ThematicContainer>
            </div>
          )}

          <ThematicContainer asButton={false} color="nocenaPink" className="px-4 py-1">
            <div className="flex items-center space-x-1">
              <span className="text-xl font-semibold">50</span>
              <Image src="/nocenix.ico" alt="Nocenix" width={32} height={32} />
            </div>
          </ThematicContainer>
        </div>
      </div>
    </ThematicContainer>
  );
};

export default NotificationInviteReward;
