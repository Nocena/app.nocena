import React from 'react';
import Image from 'next/image';
import { useRouter } from 'next/router';
import ThematicText from '../../../components/ui/ThematicText';
import ThematicImage from '../../../components/ui/ThematicImage';
import PrimaryButton from '../../../components/ui/PrimaryButton';

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
  notification
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
    const hasCompletableChallenge = notification.privateChallenge || notification.publicChallenge || notification.aiChallenge;
    
    // If there's a completable challenge, navigate to the completion page
    if (hasCompletableChallenge) {
      handleCompleteChallenge();
    }
  };

  // Determine if this notification has a challenge that can be completed
  const hasCompletableChallenge = notification.privateChallenge || notification.publicChallenge || notification.aiChallenge;
  
  // Determine if this is a challenge notification type
  const isChallengeNotification = 
    notification.notificationType === 'challenge_invitation' || 
    notification.notificationType === 'challenge_completion' ||
    notification.notificationType === 'challenge_created';

  return (
    <div 
      className="relative flex flex-col p-4 rounded-[15px] bg-white/10 backdrop-blur-md shadow-md w-full max-w-lg overflow-hidden cursor-pointer hover:bg-white/15 transition-colors"
      onClick={handleCardClick} // Make the entire card clickable
    >
      {/* Background Ellipse */}
      <div
        className="absolute top-1/2 left-[70%] w-[80%] h-[80%] transform -translate-x-1/2 -translate-y-1/2 rounded-full z-0"
        style={{
          background: 'radial-gradient(circle, rgba(253, 78, 245, 0.5) 0%, rgba(253, 78, 245, 0) 70%)',
          filter: 'blur(40px)',
        }}
      />

      {/* Challenge Text (First Line) */}
      <span className="text-white text-md font-light">{title}</span>

      {/* Reward & User Info (Second Line) */}
      <div className="flex justify-between items-center mt-2">
        {/* Token Amount */}
        <div className="flex items-center text-white">
          <Image src="/nocenix.ico" alt="Token" width={20} height={20} className="w-5 h-5 mr-2" />
          <span>{reward}</span>
        </div>

        {/* Username & Profile Picture */}
        <div className="flex items-center space-x-3">
          <ThematicText text={challengerName} isActive={true} className="capitalize" />
          <ThematicImage className="rounded-full">
            <Image
              src={challengerProfile}
              alt="Challenger Profile"
              width={40}
              height={40}
              className="w-10 h-10 object-cover"
            />
          </ThematicImage>
        </div>
      </div>

      {/* Complete Challenge Button - Only show if this is a challenge notification with a completable challenge */}
      {isChallengeNotification && hasCompletableChallenge && (
        <div className="mt-3 w-full flex justify-center">
          <PrimaryButton
            text="Complete Challenge"
            onClick={(e) => {
              e.stopPropagation(); // Prevent the card click handler from firing
              handleCompleteChallenge();
            }}
            isActive={true}
            className="px-4 py-2 text-sm"
          />
        </div>
      )}
    </div>
  );
};

export default NotificationChallenge;