import React from 'react';
import Image from 'next/image';
import { useRouter } from 'next/router';
import ThematicContainer from '../../../components/ui/ThematicContainer';
import ThematicImage from '../../../components/ui/ThematicImage';

interface NotificationChallengeProps {
  title: string;
  challengerName: string;
  challengerProfile: string;
  reward: number;
  notification: any; // Using any to avoid TypeScript errors
}

const NotificationChallenge: React.FC<NotificationChallengeProps> = ({
  title,
  challengerName,
  challengerProfile,
  reward,
  notification,
}) => {
  const router = useRouter();

  const handleCompleteChallenge = () => {
    // Determine challenge type and details
    let challengeType = 'AI';
    let challengeId = '';
    let description = '';
    let frequency = 'daily';

    if (notification.privateChallenge) {
      challengeType = 'PRIVATE';
      challengeId = notification.privateChallenge.id;
      description = notification.privateChallenge.description || '';
    } else if (notification.publicChallenge) {
      challengeType = 'PUBLIC';
      challengeId = notification.publicChallenge.id;
      description = notification.publicChallenge.description || '';
    } else if (notification.aiChallenge) {
      challengeType = 'AI';
      challengeId = notification.aiChallenge.id;
      description = notification.aiChallenge.description || '';
      frequency = notification.aiChallenge.frequency || 'daily';
    }

    if (!challengeId) return;

    // Navigate to the completing page with challenge details
    router.push({
      pathname: '/completing',
      query: {
        type: challengeType,
        frequency,
        title,
        description,
        reward: reward.toString(),
        visibility: challengeType === 'PRIVATE' ? 'private' : 'public',
        challengeId,
        creatorId: notification.triggeredBy?.id || '',
      },
    });
  };

  // Make the entire notification card clickable for challenges that can be completed
  const handleCardClick = () => {
    const hasCompletableChallenge =
      notification.privateChallenge || notification.publicChallenge || notification.aiChallenge;

    // If there's a completable challenge, navigate to the completion page
    if (hasCompletableChallenge) {
      handleCompleteChallenge();
    }
  };

  // Determine if this notification has a challenge that can be completed
  const hasCompletableChallenge =
    notification.privateChallenge || notification.publicChallenge || notification.aiChallenge;

  // Display NEW tag if isRead is false
  const shouldShowNew = notification.isRead === false;

  return (
    <ThematicContainer
      asButton={false}
      glassmorphic={true}
      color="nocenaPink"
      rounded="xl"
      className="w-full max-w-lg px-6 py-2 cursor-pointer hover:brightness-110 transition-all relative"
      onClick={handleCardClick}
    >
      {/* Challenge Text - smaller and less bold */}
      <div className="text-lg font-light mb-2">{title}</div>

      {/* User and Reward Info Row */}
      <div className="flex items-center justify-between">
        {/* User Info */}
        <div className="flex items-center space-x-5">
          <ThematicImage className="rounded-full">
            <Image
              src={challengerProfile}
              alt="Challenger Profile"
              width={40}
              height={40}
              className="w-8 h-8 object-cover rounded-full"
            />
          </ThematicImage>
          {/* Username - bigger and bold */}
          <span className="text-lg font-bold">{challengerName}</span>
        </div>

        {/* Reward Display - now has relative positioning */}
        <div className="relative">
          {/* NEW tag for unread notifications - positioned above reward */}
          {shouldShowNew && (
            <div className="absolute -top-8 right-0 transform translate-y-[-100%]">
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

          <ThematicContainer asButton={false} color="nocenaPink" className="px-4 py-1">
            <div className="flex items-center space-x-1">
              <span className="text-xl font-semibold">{reward}</span>
              <Image src="/nocenix.ico" alt="Nocenix" width={32} height={32} />
            </div>
          </ThematicContainer>
        </div>
      </div>
    </ThematicContainer>
  );
};

export default NotificationChallenge;
