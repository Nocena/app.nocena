import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useRouter } from 'next/router';

import ThematicImage from '../../components/ui/ThematicImage';
import ThematicContainer from '../../components/ui/ThematicContainer';
import PrimaryButton from '../../components/ui/PrimaryButton';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { toggleFollowUser } from '../../lib/api/dgraph';
import SearchBox, { SearchUser } from './components/SearchBox';
import Image from 'next/image';

const nocenixIcon = '/nocenix.ico';

// Define interface for leaderboard user
interface LeaderboardUser {
  rank: number;
  userId: string;
  username: string;
  profilePicture: string;
  currentPeriodTokens: number;
  allTimeTokens: number;
  todayTokens: number;
  weekTokens: number;
  monthTokens: number;
  lastUpdate: string;
  isPlaceholder?: boolean; // For fake users when not enough real users
}

// Define interface for auth user data
interface AuthUserData {
  id: string;
  username: string;
  profilePicture?: string;
  wallet?: string;
  earnedTokens?: number;
  bio?: string;
  followers?: Array<string | { id: string }>;
  following?: Array<string | { id: string }>;
}

type ChallengeType = 'today' | 'week' | 'month';

const SearchView = () => {
  const [dailyLeaderboard, setDailyLeaderboard] = useState<LeaderboardUser[]>([]);
  const [weeklyLeaderboard, setWeeklyLeaderboard] = useState<LeaderboardUser[]>([]);
  const [monthlyLeaderboard, setMonthlyLeaderboard] = useState<LeaderboardUser[]>([]);
  const [activeTab, setActiveTab] = useState<ChallengeType>('today');
  const [pendingFollowActions, setPendingFollowActions] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [isPageVisible, setIsPageVisible] = useState(true);
  const [lastRefreshTime, setLastRefreshTime] = useState(0);
  const { user } = useAuth();
  const router = useRouter();

  // Fetch leaderboard data - only real users with tokens for the period
  const fetchLeaderboard = useCallback(async (period: ChallengeType): Promise<LeaderboardUser[]> => {
    try {
      console.log(`Fetching ${period} leaderboard...`);
      const response = await fetch(`/api/leaderboard?period=${period}&limit=10`);

      if (!response.ok) {
        console.error(`Leaderboard API failed: ${response.status} ${response.statusText}`);
        return [];
      }

      const data = await response.json();
      console.log(`${period} leaderboard response:`, data);

      const leaderboard = data.leaderboard || [];

      // Filter out users with 0 tokens for the current period
      const usersWithTokens = leaderboard.filter((user: LeaderboardUser) => user.currentPeriodTokens > 0);

      console.log(`${period} users with tokens:`, usersWithTokens);
      return usersWithTokens;
    } catch (error) {
      console.error(`Error fetching ${period} leaderboard:`, error);
      // Return empty array if API fails - no fallback data
      return [];
    }
  }, []);

  // Refresh leaderboards - simple approach
  const refreshLeaderboards = useCallback(
    async (forceRefresh = false) => {
      const now = Date.now();

      // Don't refresh if we just refreshed within the last 10 seconds (unless forced)
      if (!forceRefresh && now - lastRefreshTime < 10000) {
        console.log('Skipping refresh - too recent');
        return;
      }

      console.log('Refreshing leaderboards...');
      setIsLoading(true);
      setLastRefreshTime(now);

      try {
        const [daily, weekly, monthly] = await Promise.all([
          fetchLeaderboard('today'),
          fetchLeaderboard('week'),
          fetchLeaderboard('month'),
        ]);

        setDailyLeaderboard(daily);
        setWeeklyLeaderboard(weekly);
        setMonthlyLeaderboard(monthly);

        // Cache the fresh data
        try {
          localStorage.setItem(
            'nocena_cached_leaderboards',
            JSON.stringify({
              data: { daily, weekly, monthly },
              timestamp: now,
            }),
          );
        } catch (error) {
          console.error('Failed to cache leaderboards:', error);
        }

        console.log('Leaderboards refreshed successfully');
      } catch (error) {
        console.error('Error refreshing leaderboards:', error);
      } finally {
        setIsLoading(false);
      }
    },
    [fetchLeaderboard, lastRefreshTime],
  );

  // Simple page visibility handling - refresh when page becomes visible
  useEffect(() => {
    const handleVisibilityChange = (event: Event) => {
      const customEvent = event as CustomEvent;
      if (customEvent.detail && customEvent.detail.pageName === 'search') {
        const wasVisible = isPageVisible;
        const nowVisible = customEvent.detail.isVisible;
        setIsPageVisible(nowVisible);

        // Always refresh when page becomes visible
        if (!wasVisible && nowVisible) {
          console.log('Search page became visible - refreshing leaderboards');
          refreshLeaderboards(true); // Force refresh when opening page
        }
      }
    };

    window.addEventListener('pageVisibilityChange', handleVisibilityChange);
    setIsPageVisible(window.location.pathname === '/search');

    return () => {
      window.removeEventListener('pageVisibilityChange', handleVisibilityChange);
    };
  }, [isPageVisible]);

  // Load leaderboards - only once when page becomes visible
  useEffect(() => {
    if (!isPageVisible) return;

    console.log('Loading leaderboards for search page');
    refreshLeaderboards(true); // Force refresh on page load
  }, [isPageVisible]);

  // Handle user selection from search - SearchBox will handle its own dropdown
  const handleUserSelect = useCallback(
    (selectedUser: SearchUser) => {
      if (user?.id === selectedUser.id) {
        router.push('/profile');
      } else {
        router.push(`/profile/${selectedUser.id}`);
      }
    },
    [router, user?.id],
  );

  // Handle follow action
  const handleFollow = useCallback(
    async (targetUserId: string) => {
      if (!user || !user.id || !targetUserId || user.id === targetUserId || pendingFollowActions.has(targetUserId)) {
        return;
      }

      setPendingFollowActions((prev) => new Set(prev).add(targetUserId));

      try {
        await toggleFollowUser(user.id, targetUserId, user.username);
        // Refresh leaderboards to update follow states
        // You might want to implement a more efficient update here
      } catch (error) {
        console.error('Error toggling follow:', error);
      } finally {
        setPendingFollowActions((prev) => {
          const updated = new Set(prev);
          updated.delete(targetUserId);
          return updated;
        });
      }
    },
    [user, pendingFollowActions],
  );

  // Handle profile navigation
  const handleProfileNavigation = useCallback(
    (leaderboardUser: LeaderboardUser) => {
      if (user?.id === leaderboardUser.userId) {
        router.push('/profile');
      } else {
        router.push(`/profile/${leaderboardUser.userId}`);
      }
    },
    [router, user?.id],
  );

  // Get current leaderboard based on active tab
  const currentLeaderboard = useMemo(() => {
    switch (activeTab) {
      case 'today':
        return dailyLeaderboard;
      case 'week':
        return weeklyLeaderboard;
      case 'month':
        return monthlyLeaderboard;
      default:
        return dailyLeaderboard;
    }
  }, [activeTab, dailyLeaderboard, weeklyLeaderboard, monthlyLeaderboard]);

  // Get button color for tabs
  const getButtonColor = (tab: ChallengeType) => {
    switch (tab) {
      case 'today':
        return 'nocenaPink';
      case 'week':
        return 'nocenaPurple';
      case 'month':
        return 'nocenaBlue';
      default:
        return 'nocenaBlue';
    }
  };

  // Render top 3 leaderboard items (podium style)
  const renderTopThreeItem = useCallback(
    (item: LeaderboardUser, index: number) => {
      const isCurrentUser = user?.id === item.userId;
      const isPending = pendingFollowActions.has(item.userId);

      // Podium heights and styles
      const getPodiumStyle = (rank: number) => {
        if (rank === 1)
          return {
            height: 'h-32',
            color: 'nocenaBlue' as const,
            crown: '👑',
            textColor: 'text-yellow-400',
            order: 'order-2',
          };
        if (rank === 2)
          return {
            height: 'h-24',
            color: 'nocenaPurple' as const,
            crown: '🥈',
            textColor: 'text-gray-300',
            order: 'order-1',
          };
        if (rank === 3)
          return {
            height: 'h-20',
            color: 'nocenaPink' as const,
            crown: '🥉',
            textColor: 'text-orange-400',
            order: 'order-3',
          };
        return {
          height: 'h-16',
          color: 'nocenaBlue' as const,
          crown: '',
          textColor: 'text-gray-400',
          order: 'order-1',
        };
      };

      const style = getPodiumStyle(item.rank);

      return (
        <div
          key={item.userId}
          className={`flex flex-col items-center ${style.order} cursor-pointer`}
          onClick={() => handleProfileNavigation(item)}
        >
          {/* Profile Picture with Crown */}
          <div className="relative mb-2">
            <ThematicImage className="rounded-full">
              <Image
                src={item.profilePicture || '/images/profile.png'}
                alt="Profile"
                width={item.rank === 1 ? 80 : 64}
                height={item.rank === 1 ? 80 : 64}
                className={`${item.rank === 1 ? 'w-20 h-20' : 'w-16 h-16'} object-cover rounded-full`}
              />
            </ThematicImage>
            <div className="absolute -top-2 -right-2 text-2xl">{style.crown}</div>
            {isCurrentUser && (
              <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2">
                <ThematicContainer asButton={false} color="nocenaPink" rounded="full" className="px-2 py-0.5">
                  <span className="text-xs font-medium">You</span>
                </ThematicContainer>
              </div>
            )}
          </div>

          {/* Username */}
          <h3 className="font-bold text-sm text-white text-center mb-1 max-w-20 truncate">{item.username}</h3>

          {/* Token Count */}
          <div className="flex items-center justify-center mb-2">
            <Image src="/nocenix.ico" alt="Nocenix" width={16} height={16} />
            <span className="text-xs font-semibold ml-1 text-white">{item.currentPeriodTokens.toLocaleString()}</span>
          </div>

          {/* Podium Base */}
          <ThematicContainer
            asButton={false}
            color={style.color}
            rounded="t-lg"
            className={`w-20 ${style.height} flex items-end justify-center pb-2`}
            isActive={isCurrentUser}
          >
            <span className={`text-2xl font-bold ${style.textColor}`}>{item.rank}</span>
          </ThematicContainer>
        </div>
      );
    },
    [user?.id, pendingFollowActions, handleProfileNavigation, handleFollow],
  );

  // Render remaining items (clean list style)
  const renderRemainingItem = useCallback(
    (item: LeaderboardUser, index: number) => {
      const isCurrentUser = user?.id === item.userId;
      const isPending = pendingFollowActions.has(item.userId);

      return (
        <ThematicContainer
          key={item.userId}
          asButton={false}
          glassmorphic={true}
          color={isCurrentUser ? 'nocenaPurple' : 'nocenaBlue'}
          rounded="xl"
          className="p-4 mb-3 cursor-pointer hover:scale-[1.02] transition-transform"
          isActive={isCurrentUser}
          onClick={() => handleProfileNavigation(item)}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {/* Rank */}
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-800/50">
                <span className="text-sm font-bold text-gray-300">#{item.rank}</span>
              </div>

              {/* Profile Picture */}
              <ThematicImage className="rounded-full">
                <Image
                  src={item.profilePicture || '/images/profile.png'}
                  alt="Profile"
                  width={48}
                  height={48}
                  className="w-12 h-12 object-cover rounded-full"
                />
              </ThematicImage>

              {/* User Info */}
              <div className="flex-1">
                <div className="flex items-center space-x-2">
                  <h3 className="font-semibold text-white">{item.username}</h3>
                  {isCurrentUser && (
                    <ThematicContainer asButton={false} color="nocenaPink" rounded="full" className="px-2 py-0.5">
                      <span className="text-xs font-medium">You</span>
                    </ThematicContainer>
                  )}
                </div>

                {/* Token display */}
                <div className="flex items-center mt-1">
                  <Image src="/nocenix.ico" alt="Nocenix" width={16} height={16} />
                  <span className="text-sm font-medium text-gray-300 ml-1">
                    {item.currentPeriodTokens.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </ThematicContainer>
      );
    },
    [user?.id, pendingFollowActions, handleProfileNavigation, handleFollow],
  );

  return (
    <div className="text-white p-4 min-h-screen mt-20">
      <div className="flex flex-col items-center">
        {/* Search Box - will handle its own dropdown overlay */}
        <SearchBox onUserSelect={handleUserSelect} />

        {/* Title */}
        <div className="w-full max-w-md mt-6 mb-4">
          <p className="text-center text-sm text-gray-400 mt-1">Best challengers</p>
        </div>

        {/* Tab Navigation - Always refresh on tab change */}
        <div className="flex justify-center mb-8 space-x-4">
          {(['today', 'week', 'month'] as ChallengeType[]).map((tab) => (
            <ThematicContainer
              key={tab}
              asButton={true}
              glassmorphic={false}
              color={getButtonColor(tab)}
              isActive={activeTab === tab}
              onClick={() => {
                if (tab !== activeTab) {
                  console.log(`Switching to ${tab} tab - refreshing leaderboards`);
                  setActiveTab(tab);
                  // Always refresh when switching tabs to get latest data
                  refreshLeaderboards(true);
                }
              }}
              className="px-6 py-2"
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </ThematicContainer>
          ))}
        </div>

        {/* Leaderboard */}
        <div className="w-full max-w-md mb-28">
          {isLoading ? (
            <div className="w-full flex justify-center items-center py-8">
              <LoadingSpinner />
            </div>
          ) : currentLeaderboard.length === 0 ? (
            <ThematicContainer
              asButton={false}
              glassmorphic={true}
              color="nocenaBlue"
              rounded="xl"
              className="p-8 text-center"
            >
              <div className="text-gray-400 mb-4">
                <h3 className="text-lg font-medium mb-2">No Rankings Yet</h3>
                <p className="text-sm">
                  Be the first to complete{' '}
                  {activeTab === 'today' ? 'a daily' : activeTab === 'week' ? 'a weekly' : 'a monthly'} challenge and
                  claim the top spot!
                </p>
              </div>
              <div className="text-4xl mb-4">🏆</div>
              <p className="text-xs text-gray-500">Complete challenges to appear on the {activeTab} leaderboard</p>
            </ThematicContainer>
          ) : (
            <div className="space-y-6">
              {/* Top 3 Podium */}
              {currentLeaderboard.slice(0, 3).length > 0 && (
                <div className="mb-8">
                  <div className="flex justify-center items-end space-x-4 mb-6">
                    {currentLeaderboard.slice(0, 3).map((item, index) => renderTopThreeItem(item, index))}
                  </div>
                </div>
              )}

              {/* Rest of the leaderboard */}
              {currentLeaderboard.slice(3).length > 0 && (
                <div>
                  <h3 className="text-left text-sm font-semibold text-gray-400 mb-4 px-2">Runnerups</h3>
                  {currentLeaderboard.slice(3).map((item, index) => renderRemainingItem(item, index + 3))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SearchView;
