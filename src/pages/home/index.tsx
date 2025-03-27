// pages/home/index.tsx
import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../../contexts/AuthContext';
import { fetchFollowerCompletions } from '../../lib/api/dgraph';
import { getCurrentChallenge, getChallengeReward } from '../../lib/utils/challengeUtils';

// Component imports
import ChallengeHeader from './components/ChallengeHeader';
import ChallengeForm from './components/ChallengeForm';
import CompletionFeed from './components/CompletionFeed';
import LoadingSpinner from '../../components/ui/LoadingSpinner';

type ChallengeType = 'daily' | 'weekly' | 'monthly';

const HomeView = () => {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [selectedTab, setSelectedTab] = useState<ChallengeType>('daily');
  const [followerCompletions, setFollowerCompletions] = useState<any[]>([]);
  const [isFetchingCompletions, setIsFetchingCompletions] = useState(false);
  
  // Pre-calculated values that don't depend on async data
  const currentChallenge = useMemo(() => getCurrentChallenge(selectedTab), [selectedTab]);
  const reward = useMemo(() => getChallengeReward(selectedTab), [selectedTab]);
  
  // Directly check challenge completion status from AuthContext data
  const hasDailyCompleted = useMemo(() => {
    if (!user) return false;
    
    // Get current day of year (1-365)
    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 0);
    const diff = now.getTime() - start.getTime();
    const oneDay = 1000 * 60 * 60 * 24;
    const dayOfYear = Math.floor(diff / oneDay);
    
    // Check if the character at that position is '1' (completed)
    return user.dailyChallenge.charAt(dayOfYear - 1) === '1';
  }, [user]);
  
  const hasWeeklyCompleted = useMemo(() => {
    if (!user) return false;
    
    // Get current week of year (1-52)
    const now = new Date();
    const weekOfYear = Math.ceil((((now.getTime() - new Date(now.getFullYear(), 0, 1).getTime()) / 86400000) + new Date(now.getFullYear(), 0, 1).getDay() + 1) / 7);
    
    // Check if the character at that position is '1' (completed)
    return user.weeklyChallenge.charAt(weekOfYear - 1) === '1';
  }, [user]);
  
  const hasMonthlyCompleted = useMemo(() => {
    if (!user) return false;
    
    // Get current month (0-11)
    const month = new Date().getMonth();
    
    // Check if the character at that position is '1' (completed)
    return user.monthlyChallenge.charAt(month) === '1';
  }, [user]);
  
  // Determine if current challenge type is completed
  const hasCompleted = useMemo(() => {
    if (selectedTab === 'daily') return hasDailyCompleted;
    if (selectedTab === 'weekly') return hasWeeklyCompleted;
    return hasMonthlyCompleted;
  }, [selectedTab, hasDailyCompleted, hasWeeklyCompleted, hasMonthlyCompleted]);
  
  // Fetch follower completions when user data is available and tab changes
  useEffect(() => {
    if (!user || loading) return;
    
    const loadFollowerCompletions = async () => {
      // Don't fetch if challenge isn't completed
      if (!hasCompleted) {
        setFollowerCompletions([]);
        return;
      }
      
      setIsFetchingCompletions(true);
      
      try {
        // Get today's date in YYYY-MM-DD format
        const today = new Date();
        const todayDate = today.toISOString().split('T')[0];
        
        const completions = await fetchFollowerCompletions(user.id, todayDate);
        setFollowerCompletions(completions);
      } catch (error) {
        console.error('Error fetching follower completions:', error);
      } finally {
        setIsFetchingCompletions(false);
      }
    };
    
    loadFollowerCompletions();
  }, [user, loading, selectedTab, hasCompleted]);

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

  // Show loading state while auth is being checked
  if (loading) {
    return (
      <div className="bg-[#0A141D] text-white p-4 min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="bg-[#0A141D] text-white p-4 min-h-screen">
      <div className="max-w-4xl mx-auto">
        {/* Challenge Type Tabs - always renders immediately */}
        <ChallengeHeader 
          selectedTab={selectedTab} 
          onTabChange={setSelectedTab} 
        />
        
        {/* Challenge container - structure always renders */}
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
                isLoading={isFetchingCompletions} 
                followerCompletions={followerCompletions}
                selectedTab={selectedTab}
              />
            </>
          )}
        </div>

        {/* Footer with improved wallet display */}
        <div className="mt-8 text-center text-gray-400">
          <p>Powered by Polygon Testnet</p>
          {user && (
            <div className="mt-2 space-y-1">
              <p>
                Wallet: {user.wallet.slice(0, 6)}...{user.wallet.slice(-4)}
              </p>
              <p>
                Balance: {user.earnedTokens} NOCENIX
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default HomeView;