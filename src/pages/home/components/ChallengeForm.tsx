// components/home/ChallengeForm.tsx
import React from 'react';
import Image from 'next/image';
import PrimaryButton from '../../../components/ui/PrimaryButton';
import { Challenge } from '../../../data/challenges';

const nocenixIcon = '/nocenix.ico';

interface ChallengeFormProps {
  challenge: Challenge;
  reward: number;
  selectedTab: string;
  onCompleteChallenge: (type: string, frequency: string) => void;
}

const ChallengeForm: React.FC<ChallengeFormProps> = ({
  challenge,
  reward,
  selectedTab,
  onCompleteChallenge
}) => {
  return (
    <div>
      <h2 className="text-3xl font-bold mb-4 text-center">
        {challenge.title}
      </h2>
      <p className="text-lg text-gray-300 mb-8 text-center">
        {challenge.description}
      </p>

      <div className="flex flex-col items-center space-y-6">
        <PrimaryButton
          text="Complete Challenge"
          onClick={() => onCompleteChallenge('AI', selectedTab)} // Pass 'AI' as type and the selectedTab as frequency
        />

        <div className="flex items-center space-x-2 bg-[#2A3B4D] px-6 py-3 rounded-full">
          <Image 
            src={nocenixIcon} 
            alt="Nocenix" 
            width={32} 
            height={32}
            className="mr-2"
          />
          <span className="text-xl font-semibold">
            {reward} NOCENIX
          </span>
        </div>
      </div>
    </div>
  );
};

export default ChallengeForm;