// pages/home/index.tsx
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../../contexts/AuthContext';
import { hasCompletedChallenge, fetchFollowerCompletions } from '../../lib/api/dgraph';
import { getCurrentChallenge, getChallengeReward } from '../../lib/utils/challengeUtils';

// Component imports
import ChallengeHeader from './components/ChallengeHeader';
import ChallengeForm from './components/ChallengeForm';
import CompletionFeed from './components/CompletionFeed';

type ChallengeType = 'daily' | 'weekly' | 'monthly';

const HomeView = () => {
  const router = useRouter();
  const { user } = useAuth();
  const [selectedTab, setSelectedTab] = useState<ChallengeType>('daily');
  const [followerCompletions, setFollowerCompletions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const currentChallenge = getCurrentChallenge(selectedTab);
  const reward = getChallengeReward(selectedTab);
  const hasCompleted = user ? hasCompletedChallenge(user, selectedTab) : false;
  
  // Fetch follower completions when the component mounts or when the user completes a challenge
  useEffect(() => {
    const loadFollowerCompletions = async () => {
      if (!user || !hasCompleted) {
        setFollowerCompletions([]);
        setIsLoading(false);
        return;
      }
      
      setIsLoading(true);
      
      try {
        // Get today's date in YYYY-MM-DD format
        const today = new Date();
        const todayDate = today.toISOString().split('T')[0];
        
        const completions = await fetchFollowerCompletions(user.id, todayDate);
        setFollowerCompletions(completions);
      } catch (error) {
        console.error('Error fetching follower completions:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadFollowerCompletions();
  }, [user, hasCompleted]);

  const handleCompleteChallenge = async (type: string, frequency: string) => {
    if (!user) {
      alert('Please login to complete challenges!');
      router.push('/login');
      return;
    }
    
    try {
      router.push({
        pathname: '/completing',
        query: {
          type, // 'AI'
          frequency, // 'daily', 'weekly', or 'monthly'
          title: currentChallenge.title,
          description: currentChallenge.description,
          reward,
          visibility: 'public'
        }
      });
    } catch (error) {
      console.error('Error navigating to challenge completion:', error);
      alert('Failed to start challenge. Please try again.');
    }
  };

  return (
    <div className="bg-[#0A141D] text-white p-4 min-h-screen">
      <div className="max-w-4xl mx-auto">
        {/* Challenge Type Tabs */}
        <ChallengeHeader 
          selectedTab={selectedTab} 
          onTabChange={setSelectedTab} 
        />
        
        {/* Challenge Form or Completion Feed based on completion status */}
        <div className="bg-[#1A2734] rounded-xl p-8 shadow-xl">
          {!hasCompleted ? (
            <ChallengeForm 
              challenge={currentChallenge}
              reward={reward}
              selectedTab={selectedTab}
              onCompleteChallenge={handleCompleteChallenge}
            />
          ) : (
            <>
              <div className="flex items-center justify-center mb-6">
                <div className="bg-green-700 text-white px-4 py-2 rounded-full text-sm font-medium">
                  Challenge Completed! 🎉
                </div>
              </div>
              
              <CompletionFeed 
                user={user}
                isLoading={isLoading} 
                followerCompletions={followerCompletions}
                selectedTab={selectedTab}
              />
            </>
          )}
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-gray-400">
          <p>Powered by Polygon Testnet</p>
          {user && (
            <p className="mt-2">
              Your Wallet: {user.wallet.slice(0, 6)}...{user.wallet.slice(-4)}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default HomeView;