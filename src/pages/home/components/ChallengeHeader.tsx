// components/home/ChallengeHeader.tsx
import React from 'react';
import ThematicText from '../../../components/ui/ThematicText';

type ChallengeType = 'daily' | 'weekly' | 'monthly';

interface ChallengeHeaderProps {
  selectedTab: ChallengeType;
  onTabChange: (tab: ChallengeType) => void;
}

const ChallengeHeader: React.FC<ChallengeHeaderProps> = ({ selectedTab, onTabChange }) => {
  return (
    <div className="flex justify-center mb-8 space-x-6">
      {(['daily', 'weekly', 'monthly'] as ChallengeType[]).map((tab) => (
        <button key={tab} onClick={() => onTabChange(tab)} className="hover:opacity-75 transition-opacity">
          <ThematicText text={tab.charAt(0).toUpperCase() + tab.slice(1)} isActive={selectedTab === tab} />
        </button>
      ))}
    </div>
  );
};

export default ChallengeHeader;
