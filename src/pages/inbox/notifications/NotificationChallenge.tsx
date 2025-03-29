import React from 'react';
import Image from 'next/image';
import ThematicText from '../../../components/ui/ThematicText';
import ThematicImage from '../../../components/ui/ThematicImage';

interface NotificationChallengeProps {
  title: string;
  challengerName: string;
  challengerProfile: string;
  reward: number;
}

const NotificationChallenge: React.FC<NotificationChallengeProps> = ({
  title,
  challengerName,
  challengerProfile,
  reward,
}) => {
  return (
    <div className="relative flex flex-col p-4 rounded-[15px] bg-white/10 backdrop-blur-md shadow-md w-full max-w-lg overflow-hidden">
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
    </div>
  );
};

export default NotificationChallenge;
