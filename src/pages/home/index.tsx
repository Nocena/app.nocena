// pages/home/index.tsx
import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../../contexts/AuthContext';
import { fetchFollowerCompletions } from '../../lib/api/dgraph';
import { getCurrentChallenge, getChallengeReward, getFallbackChallenge, AIChallenge } from '../../lib/utils/challengeUtils';

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
  
  // New state for challenges from Dgraph
  const [currentChallenge, setCurrentChallenge] = useState<AIChallenge | null>(null);
  const [isLoadingChallenge, setIsLoadingChallenge] = useState(true);

  // Fetch challenge from Dgraph when tab changes
  useEffect(() => {
    const loadChallenge = async () => {
      setIsLoadingChallenge(true);
      console.log(`🔄 Loading ${selectedTab} challenge from Dgraph...`);
      
      try {
        const challenge = await getCurrentChallenge(selectedTab);
        
        if (challenge) {
          console.log(`✅ Loaded ${selectedTab} challenge:`, challenge.title);
          setCurrentChallenge(challenge);
        } else {
          console.warn(`⚠️ No ${selectedTab} challenge found, using fallback`);
          // Use fallback challenge when none found
          setCurrentChallenge(getFallbackChallenge(selectedTab));
        }
      } catch (error) {
        console.error(`❌ Error loading ${selectedTab} challenge:`, error);
        // Use fallback challenge on error
        setCurrentChallenge(getFallbackChallenge(selectedTab));
      } finally {
        setIsLoadingChallenge(false);
      }
    };

    loadChallenge();
  }, [selectedTab]);

  // Calculate reward based on challenge data or fallback
  const reward = useMemo(() => {
    return getChallengeReward(currentChallenge, selectedTab);
  }, [currentChallenge, selectedTab]);

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
    const weekOfYear = Math.ceil(
      ((now.getTime() - new Date(now.getFullYear(), 0, 1).getTime()) / 86400000 +
        new Date(now.getFullYear(), 0, 1).getDay() +
        1) /
        7,
    );

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

    if (!currentChallenge) {
      alert('No challenge available. Please try again later.');
      return;
    }

    // Don't allow completing offline/fallback challenges
    if (!currentChallenge.isActive) {
      alert('Challenge is currently unavailable. Please check your connection and try again.');
      return;
    }

    try {
      router.push({
        pathname: '/completing',
        query: {
          challengeId: currentChallenge.id, // Pass the actual challenge ID
          type, // 'AI'
          frequency, // 'daily', 'weekly', or 'monthly'
          title: currentChallenge.title,
          description: currentChallenge.description,
          reward: currentChallenge.reward,
          visibility: 'public',
        },
      });
    } catch (error) {
      console.error('Error navigating to challenge completion:', error);
      alert('Failed to start challenge. Please try again.');
    }
  };

  // Show loading state while auth is being checked
  if (loading) {
    return (
      <div className="text-white p-4 min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="text-white p-4 min-h-screen mt-20">
      <div className="max-w-4xl mx-auto">
        {/* Challenge Type Tabs - always renders immediately */}
        <ChallengeHeader selectedTab={selectedTab} onTabChange={setSelectedTab} />

        {/* Show loading state while fetching challenge */}
        {isLoadingChallenge ? (
          <div className="flex items-center justify-center py-12">
            <LoadingSpinner size="md" />
            <span className="ml-3 text-gray-300">Loading {selectedTab} challenge...</span>
          </div>
        ) : (
          /* Challenge container - structure always renders */
          !hasCompleted ? (
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
          )
        )}
      </div>
    </div>
  );
};

export default HomeView;
