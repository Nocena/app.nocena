// components/home/ChallengeForm.tsx - FIXED WITH COMPLETION STATE
import React from 'react';
import Image from 'next/image';
import PrimaryButton from '../../../components/ui/PrimaryButton';
import ThematicContainer from '../../../components/ui/ThematicContainer';
import { AIChallenge } from '../../../lib/utils/challengeUtils';

const nocenixIcon = '/nocenix.ico';

interface ChallengeFormProps {
  challenge: AIChallenge | null;
  reward: number;
  selectedTab: string;
  hasCompleted: boolean; // Add this prop
  onCompleteChallenge: (type: string, frequency: string) => void;
}

const ChallengeForm: React.FC<ChallengeFormProps> = ({
  challenge,
  reward,
  selectedTab,
  hasCompleted,
  onCompleteChallenge,
}) => {
  // Handle case where challenge is null or loading
  if (!challenge) {
    return (
      <ThematicContainer asButton={false} glassmorphic={true} color="nocenaBlue" rounded="xl" className="px-12 py-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold mb-4">No Challenge Available</h2>
          <p className="text-lg text-gray-300 mb-8 font-light">Please check back later for new challenges.</p>
        </div>
      </ThematicContainer>
    );
  }

  // Show completion state
  if (hasCompleted) {
    return (
      <ThematicContainer asButton={false} glassmorphic={true} color="nocenaPink" rounded="xl" className="px-12 py-8">
        <div className="text-center">
          <h2 className="text-xl font-bold mb-4 text-green-300">{challenge.title}</h2>
          <div className="flex flex-col items-center space-y-6">
            <div className="bg-green-600 text-white px-6 py-3 rounded-full text-md font-medium">
              ✅ {selectedTab.charAt(0).toUpperCase() + selectedTab.slice(1)} Challenge Complete
            </div>

            <ThematicContainer asButton={false} color="nocenaPink" className="px-4 py-1">
              <div className="flex items-center space-x-1">
                <span className="text-xl font-semibold">+{reward}</span>
                <Image src={nocenixIcon} alt="Nocenix" width={32} height={32} />
                <span className="text-sm text-gray-300">earned</span>
              </div>
            </ThematicContainer>
          </div>
        </div>
      </ThematicContainer>
    );
  }

  // Show offline state for inactive challenges
  if (!challenge.isActive) {
    return (
      <ThematicContainer asButton={false} glassmorphic={true} color="nocenaPurple" rounded="xl" className="px-12 py-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold mb-4 text-gray-400">{challenge.title}</h2>
          <p className="text-lg text-gray-400 mb-8 font-light">{challenge.description}</p>

          <div className="flex flex-col items-center space-y-6">
            <div className="bg-yellow-600 text-white px-4 py-2 rounded-full text-sm font-medium">
              ⚠️ Challenge Offline - Check Connection
            </div>

            <ThematicContainer asButton={false} color="nocenaPurple" className="px-4 py-1 opacity-50">
              <div className="flex items-center space-x-1">
                <span className="text-xl font-semibold">{reward}</span>
                <Image src={nocenixIcon} alt="Nocenix" width={32} height={32} />
              </div>
            </ThematicContainer>
          </div>
        </div>
      </ThematicContainer>
    );
  }

  // Show active challenge (not completed)
  return (
    <ThematicContainer asButton={false} glassmorphic={true} color="nocenaBlue" rounded="xl" className="px-12 py-8">
      <div className="text-center">
        <h2 className="text-3xl font-bold mb-4">{challenge.title}</h2>
        <p className="text-lg text-gray-300 mb-8 font-light">{challenge.description}</p>

        <div className="flex flex-col items-center space-y-6">
          <PrimaryButton text="Complete Challenge" onClick={() => onCompleteChallenge('AI', selectedTab)} />

          <ThematicContainer asButton={false} color="nocenaPink" className="px-4 py-1">
            <div className="flex items-center space-x-1">
              <span className="text-xl font-semibold">{reward}</span>
              <Image src={nocenixIcon} alt="Nocenix" width={32} height={32} />
            </div>
          </ThematicContainer>
        </div>
      </div>
    </ThematicContainer>
  );
};

export default ChallengeForm;
