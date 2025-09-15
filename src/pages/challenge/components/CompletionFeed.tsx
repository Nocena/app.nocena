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
  hasCompleted: boolean; // Add this prop to receive completion state from parent
  onCompletionStatusChange?: (hasCompleted: boolean, completion?: any) => void; // Optional callback
}

const CompletionFeed: React.FC<CompletionFeedProps> = ({
  user,
  isLoading,
  followerCompletions,
  selectedTab,
  hasCompleted, // Use this instead of calculating internally
  onCompletionStatusChange,
}) => {
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

        // Notify parent component about the completion status if callback is provided
        if (onCompletionStatusChange) {
          onCompletionStatusChange(!!relevantCompletion, relevantCompletion);
        }

        console.log(`Found ${selectedTab} completion:`, relevantCompletion);
      } catch (error) {
        console.error(`Error fetching user's ${selectedTab} completion:`, error);
        setUserCompletion(null);

        // Notify parent about no completion
        if (onCompletionStatusChange) {
          onCompletionStatusChange(false, null);
        }
      } finally {
        setLoadingUserCompletion(false);
      }
    };

    fetchUserCompletion();
  }, [user, selectedTab, onCompletionStatusChange]);

  // Show loading state
  if (isLoading || loadingUserCompletion) {
    return (
      <div className="text-center py-10">
        <LoadingSpinner size="md" />
        <p className="mt-2 text-gray-300">Loading completions...</p>
      </div>
    );
  }

  // Use the hasCompleted prop from parent instead of calculating it here
  const hasUserCompleted = hasCompleted;

  return (
    <div className="space-y-6 mb-20">
      {/* Follower completions */}
      {followerCompletions.length > 0 && (
        <div>
          <h4 className="text-lg font-semibold text-white mb-3">Friends' Completions</h4>
          <div className="space-y-4">
            {followerCompletions.map((item, index) => {
              // Ensure we have a proper profile object
              const profile = {
                userId: item.userId || item.user?.id || item.id || `unknown-${index}`,
                username: item.username || item.user?.username || item.displayName || 'Unknown User',
                profilePicture: item.profilePicture || item.user?.profilePicture || null,
              };

              // Ensure we have a completion object
              const completion = item.completion || item;

              return (
                <CompletionItem
                  key={`follower-${profile.userId}-${index}`}
                  profile={profile}
                  completion={completion}
                  isSelf={false}
                />
              );
            })}
          </div>
        </div>
      )}

      {/* Show user's own completion if they have completed */}
      {hasUserCompleted && userCompletion && (
        <div>
          <h4 className="text-lg font-semibold text-white mb-3">Your Completion</h4>
          <CompletionItem
            key={`user-${user.id}`}
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

      {/* No completions message */}
      {!hasUserCompleted && followerCompletions.length === 0 && (
        <div className="text-center py-8">
          <p className="text-gray-400 text-lg mb-2">No {selectedTab} challenge completions yet</p>
          <p className="text-gray-500 text-sm">Be the first to complete today's challenge!</p>
        </div>
      )}

      {/* Show message when user completed but no friends have */}
      {hasUserCompleted && followerCompletions.length === 0 && (
        <div className="text-center py-8">
          <p className="text-gray-500 text-sm">None of your friends have completed this challenge yet.</p>
        </div>
      )}
    </div>
  );
};

export default CompletionFeed;
