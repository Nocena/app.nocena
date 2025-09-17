import React, { useEffect, useState } from 'react';
import { completionItem } from '../../../lib/types';
import { Trophy } from 'lucide-react';
import { ChallengeCard } from '../../../components/profile/ChallengeCard';
import LoadingSpinner from '@components/ui/LoadingSpinner';
import { fetchUserCompletions } from '../../../lib/api/dgraph';

interface ChallengesSectionProps {
  user: any;
}

const ChallengesSection: React.FC<ChallengesSectionProps> = ({ user }) => {
  const [loadingUserCompletion, setLoadingUserCompletion] = useState(true);
  const [userCompletion, setUserCompletion] = useState<any>(null);

  useEffect(() => {
    const fetchUserCompletion = async () => {
      if (!user) {
        setLoadingUserCompletion(false);
        return;
      }

      setLoadingUserCompletion(true);

      try {
        // Calculate the date range for the selected period
        const now = new Date();
        const startDate: Date = new Date(now.getFullYear() - 1, 1, 1);
        const endDate: Date = new Date(now); // End is always now

        // Fetch completions for this period
        const completions = await fetchUserCompletions(
          user.id,
          startDate.toISOString(),
          endDate.toISOString(),
          'ai', // Filter for AI challenges
        );

        setUserCompletion(completions || []);
      } catch (error) {
        setUserCompletion(null);
      } finally {
        setLoadingUserCompletion(false);
      }
    };

    fetchUserCompletion();
  }, [user]);

  if (loadingUserCompletion) {
    return (
      <div className="text-center py-10">
        <LoadingSpinner size="md" />
        <p className="mt-2 text-gray-300">Loading finished challenges...</p>
      </div>
    );
  }

  // UNIFIED AVATAR INTERFACE - Single container for visual consistency
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white">Challenges</h3>
        <div className="text-sm text-gray-400">{userCompletion.length} challenges available</div>
      </div>

      {userCompletion.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {userCompletion.map((item: completionItem) => (
            <ChallengeCard
              key={item.id}
              challenge={item}
              onClick={(challenge) => {
                // TODO: Navigate to challenge detail page
              }}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <Trophy className="w-12 h-12 text-gray-500 mx-auto mb-4" />
          <p className="text-gray-400">No challenges done yet.</p>
        </div>
      )}
    </div>
  );
};

export default ChallengesSection;
