import React from 'react';
import ThematicContainer from '../../../components/ui/ThematicContainer';

interface StatsSectionProps {
  currentStreak: number;
  tokenBalance: number;
  dailyChallenges: boolean[];
  weeklyChallenges: boolean[];
  monthlyChallenges: boolean[];
}

const StatsSection: React.FC<StatsSectionProps> = ({
  currentStreak,
  tokenBalance,
  dailyChallenges,
  weeklyChallenges,
  monthlyChallenges,
}) => {
  return (
    <ThematicContainer asButton={false} glassmorphic={true} color="nocenaBlue" rounded="xl" className="p-6">
      <h3 className="text-lg font-bold mb-4">Statistics</h3>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <ThematicContainer
          asButton={false}
          glassmorphic={true}
          color="nocenaBlue"
          rounded="lg"
          className="p-4 text-center"
        >
          <div className="text-2xl font-bold mb-1">{currentStreak}</div>
          <div className="text-sm text-white/60">Day Streak</div>
        </ThematicContainer>

        <ThematicContainer
          asButton={false}
          glassmorphic={true}
          color="nocenaBlue"
          rounded="lg"
          className="p-4 text-center"
        >
          <div className="text-2xl font-bold mb-1">{Math.floor(tokenBalance / 10)}</div>
          <div className="text-sm text-white/60">Level</div>
        </ThematicContainer>
      </div>

      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-white/80">Daily Challenges</span>
          <span className="font-bold">{dailyChallenges.filter(Boolean).length}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-white/80">Weekly Challenges</span>
          <span className="font-bold">{weeklyChallenges.filter(Boolean).length}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-white/80">Monthly Challenges</span>
          <span className="font-bold">{monthlyChallenges.filter(Boolean).length}</span>
        </div>
      </div>
    </ThematicContainer>
  );
};

export default StatsSection;
