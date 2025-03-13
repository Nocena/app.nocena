// components/home/CompletionFeed.tsx
import React from 'react';
import { getTodaysCompletion } from '../../../lib/api/dgraph';
import CompletionItem from './CompletionItem';

interface CompletionFeedProps {
  user: any;
  isLoading: boolean;
  followerCompletions: any[];
  selectedTab: string;
}

const CompletionFeed: React.FC<CompletionFeedProps> = ({
  user,
  isLoading,
  followerCompletions,
  selectedTab
}) => {
  // Get user's own completion if it exists
  const todaysCompletion = getTodaysCompletion(user, selectedTab);

  if (isLoading) {
    return (
      <div className="text-center py-10">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-white"></div>
        <p className="mt-2">Loading completions...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h3 className="text-xl font-bold text-center">Today's Completions</h3>
      
      {/* User's own completion */}
      {todaysCompletion && (
        <CompletionItem 
          key={`self-${user.id}`}
          profile={{
            userId: user.id,
            username: `${user.username} (You)`,
            profilePicture: user.profilePicture
          }}
          completion={todaysCompletion}
          isSelf={true}
        />
      )}
      
      {/* Follower completions */}
      {followerCompletions.length > 0 ? (
        followerCompletions.map((item) => (
          <CompletionItem 
            key={item.userId}
            profile={{
              userId: item.userId,
              username: item.username,
              profilePicture: item.profilePicture
            }}
            completion={item.completion}
            isSelf={false}
          />
        ))
      ) : (
        <p className="text-center text-gray-400 py-4">
          None of your friends have completed today's challenge yet.
        </p>
      )}
    </div>
  );
};

export default CompletionFeed;