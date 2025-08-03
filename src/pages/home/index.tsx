// pages/home/index.tsx - WITH DISCOVER BUTTON
import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../../contexts/AuthContext';
import { fetchFollowerCompletions, fetchLatestUserCompletion } from '../../lib/api/dgraph';
import {
  getCurrentChallenge,
  getChallengeReward,
  getFallbackChallenge,
  AIChallenge,
} from '../../lib/utils/challengeUtils';

// Component imports
import ChallengeHeader from './components/ChallengeHeader';
import ChallengeForm from './components/ChallengeForm';
import CompletionFeed from './components/CompletionFeed';
import CompletionItem from './components/CompletionItem';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import PrimaryButton from '../../components/ui/PrimaryButton';

type ChallengeType = 'daily' | 'weekly' | 'monthly';

// FIXED completion check functions
function hasCompletedDaily(user: any): boolean {
  if (!user || !user.dailyChallenge) return false;

  const now = new Date();
  const startOfYear = new Date(now.getFullYear(), 0, 1);
  const dayOfYear = Math.floor((now.getTime() - startOfYear.getTime()) / (1000 * 60 * 60 * 24)) + 1;

  console.log('Daily check:', {
    dayOfYear,
    stringLength: user.dailyChallenge.length,
    value: user.dailyChallenge.charAt(dayOfYear - 1),
  });

  return user.dailyChallenge.charAt(dayOfYear - 2) === '1'; //L: why -2? I don't know, but it works (same as in dgraph.ts when I save the string)
}

function hasCompletedWeekly(user: any): boolean {
  if (!user || !user.weeklyChallenge) return false;

  const now = new Date();
  const startOfYear = new Date(now.getFullYear(), 0, 1);
  const daysSinceStart = Math.floor((now.getTime() - startOfYear.getTime()) / (1000 * 60 * 60 * 24));
  const weekOfYear = Math.floor(daysSinceStart / 7) + 1;

  console.log('Weekly check:', {
    weekOfYear,
    stringLength: user.weeklyChallenge.length,
    value: user.weeklyChallenge.charAt(weekOfYear - 1),
  });

  return user.weeklyChallenge.charAt(weekOfYear - 1) === '1';
}

function hasCompletedMonthly(user: any): boolean {
  if (!user || !user.monthlyChallenge) return false;

  const now = new Date();
  const month = now.getMonth(); // 0-based (0 = January)

  console.log('Monthly check:', {
    month,
    stringLength: user.monthlyChallenge.length,
    value: user.monthlyChallenge.charAt(month),
  });

  return user.monthlyChallenge.charAt(month) === '1';
}

function hasCompletedChallenge(user: any, challengeType: ChallengeType): boolean {
  if (challengeType === 'daily') return hasCompletedDaily(user);
  if (challengeType === 'weekly') return hasCompletedWeekly(user);
  return hasCompletedMonthly(user);
}

// Mock data generator for development testing
const createMockVideoBlob = (): Blob => {
  // Create a simple mock video blob (1x1 pixel black video)
  const canvas = document.createElement('canvas');
  canvas.width = 640;
  canvas.height = 480;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#ffffff';
    ctx.font = '48px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Mock Video', canvas.width / 2, canvas.height / 2);
  }

  return new Promise<Blob>((resolve) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else resolve(new Blob(['mock video'], { type: 'video/mp4' }));
      },
      'image/jpeg',
      0.8,
    );
  }) as any;
};

const createMockPhotoBlob = (): Blob => {
  // Create a simple mock photo blob
  const canvas = document.createElement('canvas');
  canvas.width = 300;
  canvas.height = 400;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#ffffff';
    ctx.font = '24px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Mock Selfie', canvas.width / 2, canvas.height / 2);
  }

  return new Promise<Blob>((resolve) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else resolve(new Blob(['mock photo'], { type: 'image/jpeg' }));
      },
      'image/jpeg',
      0.8,
    );
  }) as any;
};

const HomeView = () => {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [selectedTab, setSelectedTab] = useState<ChallengeType>('daily');
  const [followerCompletions, setFollowerCompletions] = useState<any[]>([]);
  const [isFetchingCompletions, setIsFetchingCompletions] = useState(false);

  // Challenge state
  const [currentChallenge, setCurrentChallenge] = useState<AIChallenge | null>(null);
  const [isLoadingChallenge, setIsLoadingChallenge] = useState(true);

  // Latest completion state
  const [latestCompletion, setLatestCompletion] = useState<any>(null);
  const [isLoadingLatestCompletion, setIsLoadingLatestCompletion] = useState(false);

  // Development mode check
  const isDevelopmentMode = process.env.NODE_ENV === 'development';

  // Debug user completion strings
  useEffect(() => {
    if (user) {
      console.log('User completion data:', {
        dailyChallenge: user.dailyChallenge,
        weeklyChallenge: user.weeklyChallenge,
        monthlyChallenge: user.monthlyChallenge,
        dailyLength: user.dailyChallenge?.length,
        weeklyLength: user.weeklyChallenge?.length,
        monthlyLength: user.monthlyChallenge?.length,
      });
    }
  }, [user]);

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
          setCurrentChallenge(getFallbackChallenge(selectedTab));
        }
      } catch (error) {
        console.error(`❌ Error loading ${selectedTab} challenge:`, error);
        setCurrentChallenge(getFallbackChallenge(selectedTab));
      } finally {
        setIsLoadingChallenge(false);
      }
    };

    loadChallenge();
  }, [selectedTab]);

  // Fetch latest completion when user changes or when completion status changes
  useEffect(() => {
    if (!user) return;

    const loadLatestCompletion = async () => {
      setIsLoadingLatestCompletion(true);
      try {
        console.log('🔄 Fetching latest completion...');
        const completion = await fetchLatestUserCompletion(user.id);
        setLatestCompletion(completion);
        console.log('✅ Latest completion:', completion);
      } catch (error) {
        console.error('❌ Error fetching latest completion:', error);
        setLatestCompletion(null);
      } finally {
        setIsLoadingLatestCompletion(false);
      }
    };

    loadLatestCompletion();
  }, [user]);

  // Check completion status using the user's completion flags
  const hasCompleted = useMemo(() => {
    if (!user) return false;
    const completed = hasCompletedChallenge(user, selectedTab);
    console.log(`${selectedTab} completion status:`, completed);
    return completed;
  }, [user, selectedTab]);

  // Calculate reward based on challenge data or fallback
  const reward = useMemo(() => {
    return getChallengeReward(currentChallenge, selectedTab);
  }, [currentChallenge, selectedTab]);

  // Check if latest completion matches current challenge frequency
  const latestCompletionMatchesTab = useMemo(() => {
    if (!latestCompletion || !latestCompletion.aiChallenge) return false;
    return latestCompletion.aiChallenge.frequency === selectedTab;
  }, [latestCompletion, selectedTab]);

  // ONLY fetch follower completions if user has actually completed the challenge
  useEffect(() => {
    if (!user || loading || !hasCompleted) {
      setFollowerCompletions([]);
      setIsFetchingCompletions(false);
      return;
    }

    const loadFollowerCompletions = async () => {
      setIsFetchingCompletions(true);

      try {
        console.log(`User has completed ${selectedTab} challenge, fetching friend completions...`);
        const today = new Date().toISOString().split('T')[0];
        const completions = await fetchFollowerCompletions(user.id, today, selectedTab);
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

    // Prevent double completion
    if (hasCompleted) {
      alert(`You have already completed today's ${selectedTab} challenge!`);
      return;
    }

    try {
      router.push({
        pathname: '/completing',
        query: {
          challengeId: currentChallenge.id,
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

  // Handle discover button click - navigate to browsing with all completions
  const handleDiscoverClick = () => {
    if (!user) {
      alert('Please login to discover challenges!');
      router.push('/login');
      return;
    }

    // Navigate to browsing page without specific challenge/user filters
    // This will show all completions across the app
    router.push('/browsing');
  };

  // Development function to test claiming screen
  const handleTestClaiming = async () => {
    if (!user || !currentChallenge) {
      alert('Need user and challenge data to test claiming');
      return;
    }

    try {
      console.log('🧪 Testing claiming screen with mock data...');

      // Create mock blobs
      const mockVideoBlob = createMockVideoBlob();
      const mockPhotoBlob = createMockPhotoBlob();

      // Create mock verification result
      const mockVerificationResult = {
        passed: true,
        overallConfidence: 0.95,
        details: 'Mock verification completed successfully for testing',
        steps: [
          {
            id: 'file-check',
            name: 'File Validation',
            status: 'completed',
            progress: 100,
            message: 'Mock files validated successfully',
            confidence: 0.98,
          },
          {
            id: 'face-match',
            name: 'Face Matching',
            status: 'completed',
            progress: 100,
            message: 'Mock face match completed',
            confidence: 0.92,
          },
        ],
        timestamp: new Date().toISOString(),
      };

      // Navigate to claiming screen with mock data
      // You'll need to create a route for this or handle it in your existing routing
      // For now, storing in sessionStorage to pass data
      const claimingData = {
        challenge: {
          title: currentChallenge.title,
          description: currentChallenge.description,
          challengerName: 'AI Assistant',
          challengerProfile: '/images/ai.png',
          reward: reward,
          color: 'nocenaPink',
          type: 'AI' as const,
          frequency: selectedTab,
          challengeId: currentChallenge.id,
          creatorId: 'ai-system',
        },
        videoBlob: await mockVideoBlob,
        photoBlob: await mockPhotoBlob,
        verificationResult: mockVerificationResult,
        isDevelopmentMode: true,
      };

      // Store in sessionStorage for the claiming screen to pick up
      sessionStorage.setItem(
        'dev-claiming-data',
        JSON.stringify({
          ...claimingData,
          // Note: Can't store blobs in sessionStorage, so we'll recreate them
          mockBlobsNeeded: true,
        }),
      );

      // Navigate to claiming test route
      router.push('/test-claiming');
    } catch (error) {
      console.error('Error setting up claiming test:', error);
      alert('Failed to set up claiming test. Check console for details.');
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
        {/* Development Mode Controls */}
        {isDevelopmentMode && user && currentChallenge && (
          <div className="mb-6 px-4 py-3 bg-yellow-900/20 border border-yellow-700/50 rounded-xl">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-yellow-400 font-medium">🛠️ Development Mode</span>
            </div>
            <div className="flex flex-col gap-2">
              <p className="text-xs text-yellow-300">
                Test the claiming screen with current challenge: "{currentChallenge.title}"
              </p>
              <button
                onClick={handleTestClaiming}
                className="bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                🧪 Test Claiming Screen
              </button>
            </div>
          </div>
        )}

        {/* Challenge Type Tabs */}
        <ChallengeHeader selectedTab={selectedTab} onTabChange={setSelectedTab} />

        {/* Show loading state while fetching challenge */}
        {isLoadingChallenge ? (
          <div className="flex items-center justify-center py-12">
            <LoadingSpinner size="md" />
            <span className="ml-3 text-gray-300">Loading {selectedTab} challenge...</span>
          </div>
        ) : (
          /* Main Content */
          <>
            {/* Discover Button */}
            <div className="mt-6 flex justify-center mb-8">
              <PrimaryButton onClick={handleDiscoverClick} isActive={true} text="Discover" />
            </div>
            {/* Always show the challenge form - it will display completion state if completed */}
            <ChallengeForm
              challenge={currentChallenge}
              reward={reward}
              selectedTab={selectedTab}
              hasCompleted={hasCompleted}
              onCompleteChallenge={handleCompleteChallenge}
            />

            {/* Show latest completion using CompletionItem if user has completed and it matches current tab */}
            {hasCompleted && latestCompletionMatchesTab && latestCompletion && user && (
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
                  selectedTab={selectedTab}
                  hasCompleted={hasCompleted}
                />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default HomeView;
