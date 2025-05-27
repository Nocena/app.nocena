// home/components/ChallengeHeader.tsx
import React from 'react';
import ThematicContainer from '../../../components/ui/ThematicContainer';

type ChallengeType = 'daily' | 'weekly' | 'monthly';

interface ChallengeHeaderProps {
  selectedTab: ChallengeType;
  onTabChange: (tab: ChallengeType) => void;
}

const ChallengeHeader: React.FC<ChallengeHeaderProps> = ({ selectedTab, onTabChange }) => {
  const getButtonColor = (tab: ChallengeType) => {
    switch (tab) {
      case 'daily':
        return 'nocenaPink';
      case 'weekly':
        return 'nocenaPurple';
      case 'monthly':
        return 'nocenaBlue';
      default:
        return 'nocenaBlue';
    }
  };

  return (
    <div className="flex justify-center mb-8 space-x-4">
      {(['daily', 'weekly', 'monthly'] as ChallengeType[]).map((tab) => (
        <ThematicContainer
          key={tab}
          asButton={true}
          glassmorphic={false}
          color={getButtonColor(tab)}
          isActive={selectedTab === tab}
          onClick={() => onTabChange(tab)}
          className="px-6 py-2"
        >
          {tab.charAt(0).toUpperCase() + tab.slice(1)}
        </ThematicContainer>
      ))}
    </div>
  );
};

export default ChallengeHeader;
