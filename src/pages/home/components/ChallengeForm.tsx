// components/home/ChallengeForm.tsx
import React from 'react';
import Image from 'next/image';
import PrimaryButton from '../../../components/ui/PrimaryButton';
import ThematicContainer from '../../../components/ui/ThematicContainer';
import { Challenge } from '../../../data/challenges';

const nocenixIcon = '/nocenix.ico';

interface ChallengeFormProps {
  challenge: Challenge;
  reward: number;
  selectedTab: string;
  onCompleteChallenge: (type: string, frequency: string) => void;
}

const ChallengeForm: React.FC<ChallengeFormProps> = ({ challenge, reward, selectedTab, onCompleteChallenge }) => {
  return (
    <ThematicContainer
      asButton={false}
      color="nocenaBlue"
      rounded="xl"
      className="px-12 py-8"
    >
      <h2 className="text-3xl font-bold mb-4 text-center">{challenge.title}</h2>
      <p className="text-lg text-gray-300 mb-8 text-center font-light">{challenge.description}</p>

      <div className="flex flex-col items-center space-y-6">
        <PrimaryButton
          text="Complete Challenge"
          onClick={() => onCompleteChallenge('AI', selectedTab)} // Pass 'AI' as type and the selectedTab as frequency
        />

        <ThematicContainer
          asButton={false}
          color="nocenaPink"
          className="px-4 py-1"
        >
          <div className="flex items-center space-x-1">
            <span className="text-xl font-semibold">{reward}</span>
            <Image src={nocenixIcon} alt="Nocenix" width={32} height={32} />
          </div>
        </ThematicContainer>
      </div>
    </ThematicContainer>
  );
};

export default ChallengeForm;