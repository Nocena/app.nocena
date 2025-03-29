// components/ChallengeHeader.tsx
import React from 'react';
import Image from 'next/image';
import ThematicImage from '../../../components/ui/ThematicImage';
import ThematicText from '../../../components/ui/ThematicText';

interface ChallengeHeaderProps {
  title: string;
  reward: string;
}

const nocenixIcon = '/nocenix.ico';

const ChallengeHeader: React.FC<ChallengeHeaderProps> = ({ title, reward }) => {
  return (
    <>
      {/* Challenge Circle Image with AI Icon */}
      <ThematicImage className="rounded-full mb-6">
        <div className="w-24 h-24 flex items-center justify-center overflow-hidden">
          <Image src="/images/ai.png" alt="Challenge" width={96} height={96} className="w-full h-full object-cover" />
        </div>
      </ThematicImage>

      {/* Challenge Title */}
      <ThematicText text={title || ''} isActive={true} className="text-xl mb-4" />

      {/* Token Reward Display */}
      <div className="flex items-center justify-center mb-6 py-2 px-6 rounded-full bg-[#2A3B4D]">
        <Image src={nocenixIcon} alt="Nocenix" width={24} height={24} className="mr-2" />
        <span className="font-bold text-white">{reward || '1'} NOCENIX</span>
      </div>
    </>
  );
};

export default ChallengeHeader;
