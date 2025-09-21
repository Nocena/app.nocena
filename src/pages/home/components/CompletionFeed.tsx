// components/home/CompletionFeed.tsx - UPDATED FOR JOURNEY-BASED CHALLENGES
import React from 'react';
import CompletionItem from './CompletionItem';
import LoadingSpinner from '../../../components/ui/LoadingSpinner';
import ThematicContainer from '../../../components/ui/ThematicContainer';

interface CompletionFeedProps {
  user: any;
  isLoading: boolean;
  followerCompletions: any[];
  selectedTab: string; // Keep for backwards compatibility, but not used in journey mode
  hasCompleted: boolean;
}

const CompletionFeed: React.FC<CompletionFeedProps> = ({ user, isLoading, followerCompletions, hasCompleted }) => {
  // Don't show feed if user hasn't completed their challenge
  if (!hasCompleted) {
    return null;
  }

  return (
    <div className="space-y-6">
      <ThematicContainer asButton={false} glassmorphic={true} color="nocenaBlue" rounded="xl" className="p-6">
        <h3 className="text-xl font-bold mb-4 text-center">Friends' Challenges</h3>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <LoadingSpinner size="md" />
            <span className="ml-3 text-gray-300">Loading friend completions...</span>
          </div>
        ) : followerCompletions.length > 0 ? (
          <div className="space-y-4">
            {followerCompletions.map((followerCompletion, index) => (
              <CompletionItem
                key={`${followerCompletion.userId}-${index}`}
                profile={{
                  userId: followerCompletion.userId,
                  username: followerCompletion.username,
                  profilePicture: followerCompletion.profilePicture,
                }}
                completion={followerCompletion.completion}
                isSelf={false}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="text-gray-400 mb-2">🎯</div>
            <p className="text-gray-300 text-sm">No friends have completed challenges today.</p>
            <p className="text-gray-400 text-xs mt-1">Invite more friends to see their progress!</p>
          </div>
        )}
      </ThematicContainer>

      {/* Optional: Show completion stats */}
      {followerCompletions.length > 0 && (
        <div className="text-center">
          <p className="text-xs text-gray-400">
            {followerCompletions.length} friend{followerCompletions.length !== 1 ? 's' : ''} completed challenges today
          </p>
        </div>
      )}
    </div>
  );
};

export default CompletionFeed;
