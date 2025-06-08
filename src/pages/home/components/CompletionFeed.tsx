// components/home/CompletionFeed.tsx - FIXED VERSION
import React, { useState, useEffect } from 'react';
import { fetchUserCompletions } from '../../../lib/api/dgraph';
import CompletionItem from './CompletionItem';
import LoadingSpinner from '@components/ui/LoadingSpinner';

interface CompletionFeedProps {
  user: any;
  isLoading: boolean;
  followerCompletions: any[];
  selectedTab: 'daily' | 'weekly' | 'monthly';
}

const CompletionFeed: React.FC<CompletionFeedProps> = ({ user, isLoading, followerCompletions, selectedTab }) => {
  const [userCompletion, setUserCompletion] = useState<any>(null);
  const [loadingUserCompletion, setLoadingUserCompletion] = useState(true);

  // Fetch user's own completion for the current period
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
        let startDate: Date;
        let endDate: Date = new Date(now); // End is always now

        if (selectedTab === 'daily') {
          // Today only
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
        } else if (selectedTab === 'weekly') {
          // Current week (Monday to Sunday)
          const dayOfWeek = now.getDay();
          const monday = new Date(now);
          monday.setDate(now.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
          monday.setHours(0, 0, 0, 0);

          startDate = monday;
          endDate = new Date(monday);
          endDate.setDate(monday.getDate() + 6);
          endDate.setHours(23, 59, 59);
        } else {
          // Current month
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
        }

        console.log(`Fetching ${selectedTab} completion for user ${user.id}`, {
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
        });

        // Fetch completions for this period
        const completions = await fetchUserCompletions(
          user.id,
          startDate.toISOString(),
          endDate.toISOString(),
          'ai', // Filter for AI challenges
        );

        // Find the most recent completion for this period
        const relevantCompletion = completions.find((completion) => {
          // Additional filtering based on the challenge frequency if available
          if (completion.aiChallenge?.frequency) {
            return completion.aiChallenge.frequency === selectedTab;
          }
          return true; // If no frequency info, assume it's relevant
        });

        setUserCompletion(relevantCompletion || null);

        console.log(`Found ${selectedTab} completion:`, relevantCompletion);
      } catch (error) {
        console.error(`Error fetching user's ${selectedTab} completion:`, error);
        setUserCompletion(null);
      } finally {
        setLoadingUserCompletion(false);
      }
    };

    fetchUserCompletion();
  }, [user, selectedTab]);

  // Show loading state
  if (isLoading || loadingUserCompletion) {
    return (
      <div className="text-center py-10">
        <LoadingSpinner size="md" />
        <p className="mt-2 text-gray-300">Loading completions...</p>
      </div>
    );
  }

  // Determine if user has completed the current period's challenge
  const hasUserCompleted = !!userCompletion;

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-xl font-bold text-white mb-2">
          {selectedTab.charAt(0).toUpperCase() + selectedTab.slice(1)} Challenge Completions
        </h3>

        {hasUserCompleted ? (
          <div className="inline-flex items-center px-4 py-2 bg-green-700 text-white rounded-full text-sm font-medium mb-4">
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Challenge Completed! 🎉
          </div>
        ) : (
          <div className="inline-flex items-center px-4 py-2 bg-gray-700 text-gray-300 rounded-full text-sm font-medium mb-4">
            Challenge not completed yet
          </div>
        )}
      </div>

      {/* User's own completion */}
      {userCompletion && (
        <div>
          <h4 className="text-lg font-semibold text-white mb-3">Your Completion</h4>
          <CompletionItem
            key={`self-${user.id}-${userCompletion.id}`}
            profile={{
              userId: user.id,
              username: user.username,
              profilePicture: user.profilePicture,
            }}
            completion={userCompletion}
            isSelf={true}
          />
        </div>
      )}

      {/* Follower completions */}
      {followerCompletions.length > 0 && (
        <div>
          <h4 className="text-lg font-semibold text-white mb-3">Friends' Completions</h4>
          <div className="space-y-4">
            {followerCompletions.map((item, index) => (
              <CompletionItem
                key={`follower-${item.userId}-${index}`}
                profile={{
                  userId: item.userId,
                  username: item.username,
                  profilePicture: item.profilePicture,
                }}
                completion={item.completion}
                isSelf={false}
              />
            ))}
          </div>
        </div>
      )}

      {/* No completions message */}
      {!userCompletion && followerCompletions.length === 0 && (
        <div className="text-center py-8">
          <div className="text-6xl mb-4">🎯</div>
          <p className="text-gray-400 text-lg mb-2">No {selectedTab} challenge completions yet</p>
          <p className="text-gray-500 text-sm">
            {hasUserCompleted
              ? 'None of your friends have completed this challenge yet.'
              : "Be the first to complete today's challenge!"}
          </p>
        </div>
      )}
    </div>
  );
};

export default CompletionFeed;
