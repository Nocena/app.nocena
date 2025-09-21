// pages/home/index.tsx - FIXED WITH PROPER targetUserId FILTERING
import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../../contexts/AuthContext';
import { fetchFollowerCompletions, fetchLatestUserCompletion } from '../../lib/api/dgraph';
import { checkUserJourneyStatus, getUserNextChallenge } from '../../lib/utils/journeyUtils';

// Component imports
import ChallengeForm from './components/ChallengeForm';
import CompletionFeed from './components/CompletionFeed';
import CompletionItem from './components/CompletionItem';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import PrimaryButton from '../../components/ui/PrimaryButton';
import JourneyOnboarding from './components/JourneyOnboarding';

// Types for journey-based challenges
interface JourneyChallenge {
  id: string;
  title: string;
  description: string;
  reward: number;
  frequency: string;
  isActive: boolean;
  createdAt?: string;
}

// Function to check if user has completed today's challenge
const hasCompletedTodaysChallenge = async (userId: string, challengeId: string): Promise<boolean> => {
  try {
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString();
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59).toISOString();

    const query = `
      query CheckTodaysCompletion($userId: String!, $challengeId: String!, $startOfDay: DateTime!, $endOfDay: DateTime!) {
        queryUser(filter: { id: { eq: $userId } }) {
          completedChallenges(filter: {
            and: [
              { aiChallenge: { id: { eq: $challengeId } } },
              { completionDate: { between: { min: $startOfDay, max: $endOfDay } } }
            ]
          }) {
            id
          }
        }
      }
    `;

    const response = await fetch(process.env.NEXT_PUBLIC_DGRAPH_ENDPOINT!, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query,
        variables: { userId, challengeId, startOfDay, endOfDay },
      }),
    });

    const data = await response.json();

    if (data.errors) {
      console.error('Error checking completion status:', data.errors);
      return false;
    }

    const completions = data.data.queryUser?.[0]?.completedChallenges || [];
    return completions.length > 0;
  } catch (error) {
    console.error("Error checking today's completion:", error);
    return false;
  }
};

const HomeView = () => {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [currentChallenge, setCurrentChallenge] = useState<JourneyChallenge | null>(null);
  const [isLoadingChallenge, setIsLoadingChallenge] = useState(true);
  const [hasCompleted, setHasCompleted] = useState(false);
  const [isCheckingCompletion, setIsCheckingCompletion] = useState(false);
  const [followerCompletions, setFollowerCompletions] = useState<any[]>([]);
  const [isFetchingCompletions, setIsFetchingCompletions] = useState(false);
  const [latestCompletion, setLatestCompletion] = useState<any>(null);
  const [isLoadingLatestCompletion, setIsLoadingLatestCompletion] = useState(false);

  // Journey status state
  const [journeyStatus, setJourneyStatus] = useState<{
    hasJourney: boolean;
    challengeCount: number;
    isLoading: boolean;
  }>({
    hasJourney: false,
    challengeCount: 0,
    isLoading: true,
  });

  // Check journey status first - this determines if we show onboarding or journey
  useEffect(() => {
    const checkJourneyStatus = async () => {
      if (!user) return;

      console.log('🔍 Checking journey status for user:', user.id);

      try {
        const status = await checkUserJourneyStatus(user.id);
        setJourneyStatus({
          hasJourney: status.hasJourney,
          challengeCount: status.challengeCount,
          isLoading: false,
        });

        console.log('📊 Journey status result:', {
          hasJourney: status.hasJourney,
          challengeCount: status.challengeCount,
          userId: user.id,
        });
      } catch (error) {
        console.error('❌ Error checking journey status:', error);
        setJourneyStatus({
          hasJourney: false,
          challengeCount: 0,
          isLoading: false,
        });
      }
    };

    checkJourneyStatus();
  }, [user]);

  // Fetch user's next challenge (only if they have a journey)
  useEffect(() => {
    const loadChallenge = async () => {
      if (!user || journeyStatus.isLoading) return;

      // If user doesn't have a journey, don't load challenges
      if (!journeyStatus.hasJourney) {
        setIsLoadingChallenge(false);
        return;
      }

      setIsLoadingChallenge(true);
      console.log('📝 Loading next challenge for user with journey...');

      try {
        const nextChallenge = await getUserNextChallenge(user.id);

        if (nextChallenge) {
          console.log('✅ Loaded next challenge:', nextChallenge.title);
          setCurrentChallenge(nextChallenge);
        } else {
          console.log('📝 No more challenges available for this user');
          setCurrentChallenge(null);
        }
      } catch (error) {
        console.error('❌ Error loading challenge:', error);
        setCurrentChallenge(null);
      } finally {
        setIsLoadingChallenge(false);
      }
    };

    loadChallenge();
  }, [user, journeyStatus]);

  // Check if user has completed today's challenge
  useEffect(() => {
    const checkCompletion = async () => {
      if (!user || !currentChallenge) return;

      setIsCheckingCompletion(true);
      try {
        const completed = await hasCompletedTodaysChallenge(user.id, currentChallenge.id);
        setHasCompleted(completed);
        console.log('Completion status:', completed);
      } catch (error) {
        console.error('Error checking completion:', error);
        setHasCompleted(false);
      } finally {
        setIsCheckingCompletion(false);
      }
    };

    checkCompletion();
  }, [user, currentChallenge]);

  // Fetch latest completion when user completes challenge
  useEffect(() => {
    if (!user || !hasCompleted) return;

    const loadLatestCompletion = async () => {
      setIsLoadingLatestCompletion(true);
      try {
        console.log('Fetching latest completion...');
        const completion = await fetchLatestUserCompletion(user.id, 'ai');
        setLatestCompletion(completion);
        console.log('Latest completion:', completion);
      } catch (error) {
        console.error('Error fetching latest completion:', error);
        setLatestCompletion(null);
      } finally {
        setIsLoadingLatestCompletion(false);
      }
    };

    loadLatestCompletion();
  }, [user, hasCompleted]);

  // Fetch follower completions if user has completed
  useEffect(() => {
    if (!user || loading || !hasCompleted || !currentChallenge) {
      setFollowerCompletions([]);
      setIsFetchingCompletions(false);
      return;
    }

    const loadFollowerCompletions = async () => {
      setIsFetchingCompletions(true);
      try {
        console.log('User has completed challenge, fetching friend completions...');
        const today = new Date().toISOString().split('T')[0];
        const completions = await fetchFollowerCompletions(user.id, today, 'ai');
        setFollowerCompletions(completions);
        console.log('Loaded follower completions:', completions.length);
      } catch (error) {
        console.error('Error fetching follower completions:', error);
        setFollowerCompletions([]);
      } finally {
        setIsFetchingCompletions(false);
      }
    };

    loadFollowerCompletions();
  }, [user, loading, hasCompleted, currentChallenge]);

  // Calculate reward
  const reward = useMemo(() => {
    return currentChallenge?.reward || 10;
  }, [currentChallenge]);

  // Check if latest completion matches current challenge
  const latestCompletionMatchesChallenge = useMemo(() => {
    if (!latestCompletion || !currentChallenge || !latestCompletion.aiChallenge) return false;
    return latestCompletion.aiChallenge.id === currentChallenge.id;
  }, [latestCompletion, currentChallenge]);

  const handleCompleteChallenge = async () => {
    if (!user) {
      alert('Please login to complete challenges!');
      router.push('/login');
      return;
    }

    if (!currentChallenge) {
      alert('No challenge available. Please try again later.');
      return;
    }

    if (!currentChallenge.isActive) {
      alert('Challenge is currently unavailable. Please check your connection and try again.');
      return;
    }

    if (hasCompleted) {
      alert("You have already completed today's challenge!");
      return;
    }

    try {
      router.push({
        pathname: '/completing',
        query: {
          challengeId: currentChallenge.id,
          type: 'AI',
          frequency: currentChallenge.frequency,
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

  const handleDiscoverClick = () => {
    if (!user) {
      alert('Please login to discover challenges!');
      router.push('/login');
      return;
    }

    router.push('/browsing');
  };

  const handleJourneyCreated = () => {
    // Force refresh the journey status
    setJourneyStatus({
      hasJourney: false,
      challengeCount: 0,
      isLoading: true,
    });

    // Reload the page or refresh the component
    window.location.reload();
  };

  // Show loading state while auth is being checked
  if (loading) {
    return (
      <div className="text-white p-4 min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  // Show journey onboarding if user has no journey
  if (!journeyStatus.isLoading && !journeyStatus.hasJourney) {
    console.log('👋 No journey found, showing onboarding');
    return <JourneyOnboarding onJourneyCreated={handleJourneyCreated} />;
  }

  // Show main journey view if user has a journey
  return (
    <div className="text-white p-4 min-h-screen mt-20">
      <div className="max-w-4xl mx-auto">
        {/* Header Section */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Your Journey</h1>
          <p className="text-gray-300">Complete challenges to progress through your learning path</p>
        </div>

        {/* Show loading state while fetching challenge */}
        {journeyStatus.isLoading || isLoadingChallenge || isCheckingCompletion ? (
          <div className="flex items-center justify-center py-12">
            <LoadingSpinner size="md" />
            <span className="ml-3 text-gray-300">Loading your next challenge...</span>
          </div>
        ) : (
          <>
            {/* Discover Button */}
            <div className="mt-6 flex justify-center mb-8">
              <PrimaryButton onClick={handleDiscoverClick} isActive={true} text="Discover" />
            </div>

            {/* Show challenge if available */}
            {currentChallenge ? (
              <>
                {/* Challenge Form */}
                <ChallengeForm
                  challenge={currentChallenge}
                  reward={reward}
                  hasCompleted={hasCompleted}
                  onCompleteChallenge={handleCompleteChallenge}
                />

                {/* Show latest completion if user has completed */}
                {hasCompleted && latestCompletionMatchesChallenge && latestCompletion && user && (
                  <div className="mt-8">
                    <CompletionItem
                      profile={{
                        userId: user.id,
                        username: user.username,
                        profilePicture: user.profilePicture,
                      }}
                      completion={latestCompletion}
                      isSelf={true}
                    />
                  </div>
                )}

                {/* Show completion feed if user has completed the challenge */}
                {hasCompleted && (
                  <div className="mt-8">
                    <CompletionFeed
                      user={user}
                      isLoading={isFetchingCompletions}
                      followerCompletions={followerCompletions}
                      selectedTab="journey"
                      hasCompleted={hasCompleted}
                    />
                  </div>
                )}
              </>
            ) : (
              /* Show message when no challenges available */
              <div className="text-center py-12">
                <h2 className="text-2xl font-bold mb-4">Journey Complete!</h2>
                <p className="text-gray-300 mb-6">You've completed all challenges in your journey.</p>
                <PrimaryButton onClick={() => window.location.reload()} text="Create New Journey" isActive={true} />
              </div>
            )}

            {/* Progress indicator */}
            {user && currentChallenge && (
              <div className="mt-8 text-center">
                <div className="bg-gray-800 rounded-lg p-4">
                  <p className="text-sm text-gray-400 mb-2">Journey Progress</p>
                  <div className="text-lg font-semibold">
                    {hasCompleted ? 'Challenge Completed! 🎉' : 'Ready for your next challenge'}
                  </div>
                  <p className="text-xs text-gray-500 mt-2">Challenge: {currentChallenge.title}</p>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default HomeView;
