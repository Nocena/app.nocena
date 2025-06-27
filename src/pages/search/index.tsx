import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useRouter } from 'next/router';

import ThematicImage from '../../components/ui/ThematicImage';
import ThematicContainer from '../../components/ui/ThematicContainer';
import PrimaryButton from '../../components/ui/PrimaryButton';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { toggleFollowUser, searchUsers as searchUsersAPI } from '../../lib/api/dgraph';
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
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<SearchUser[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [isPageVisible, setIsPageVisible] = useState(true);
  const [lastRefreshTime, setLastRefreshTime] = useState(0);
  const { user } = useAuth();
  const router = useRouter();

  // No more placeholder generation - only show real users

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
  const searchUsers = useCallback(async (term: string): Promise<SearchUser[]> => {
    if (!term.trim()) return [];

    try {
      // Use your existing searchUsers function from dgraph.ts
      const results = await searchUsersAPI(term);
      return results.map((user) => ({
        id: user.id,
        username: user.username,
        profilePicture: user.profilePicture || '/images/profile.png',
        wallet: user.wallet || '',
        earnedTokens: 0, // You might want to fetch this from user data
        bio: '',
        followers: [],
        following: [],
      }));
    } catch (error) {
      console.error('Error searching users:', error);
      return [];
    }
  }, []);

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
  }, [isPageVisible]); // Removed refreshLeaderboards from dependencies

  // Load leaderboards - only once when page becomes visible
  useEffect(() => {
    if (!isPageVisible) return;

    console.log('Loading leaderboards for search page');
    refreshLeaderboards(true); // Force refresh on page load
  }, [isPageVisible]); // Only depend on isPageVisible

  // Handle search
  const handleSearch = useCallback(
    async (term: string) => {
      setSearchTerm(term);

      if (!term.trim()) {
        setShowSearchResults(false);
        setSearchResults([]);
        return;
      }

      setShowSearchResults(true);
      const results = await searchUsers(term);
      setSearchResults(results);
    },
    [searchUsers],
  );

  // Handle user selection from search
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

  // Render top 3 leaderboard items (larger)
  const renderTopThreeItem = useCallback(
    (item: LeaderboardUser, index: number) => {
      const isCurrentUser = user?.id === item.userId;
      const isPending = pendingFollowActions.has(item.userId);

      // Rankings for top 3
      const getRankDisplay = (rank: number) => {
        if (rank === 1) return { text: '1st', color: 'text-yellow-400' };
        if (rank === 2) return { text: '2nd', color: 'text-gray-300' };
        if (rank === 3) return { text: '3rd', color: 'text-orange-400' };
        return { text: `${rank}th`, color: 'text-gray-400' };
      };

      const rankDisplay = getRankDisplay(item.rank);

      return (
        <ThematicContainer
          key={item.userId}
          asButton={false}
          glassmorphic={true}
          color={isCurrentUser ? 'nocenaPurple' : 'nocenaBlue'}
          rounded="xl"
          className={`p-6 mb-4 cursor-pointer`}
          isActive={isCurrentUser}
          onClick={() => handleProfileNavigation(item)}
        >
          <div className="flex items-center">
            {/* Large Rank */}
            <div className="flex-shrink-0 w-16 text-center">
              <span className={`text-2xl font-bold ${rankDisplay.color}`}>{rankDisplay.text}</span>
            </div>

            {/* Large Profile Picture */}
            <div className="flex-shrink-0 mx-4">
              <ThematicImage className="rounded-full">
                <Image
                  src={item.profilePicture || '/images/profile.png'}
                  alt="Profile"
                  width={64}
                  height={64}
                  className="w-16 h-16 object-cover rounded-full"
                />
              </ThematicImage>
            </div>

            {/* User Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-2">
                <h3 className="font-bold text-lg truncate text-white">{item.username}</h3>
                {isCurrentUser && (
                  <ThematicContainer
                    asButton={false}
                    glassmorphic={true}
                    color="nocenaPink"
                    rounded="full"
                    className="px-2 py-1"
                  >
                    <span className="text-xs font-medium">You</span>
                  </ThematicContainer>
                )}
              </div>
              <div className="flex items-center">
                <Image src={nocenixIcon} alt="Nocenix" width={20} height={20} />
                <span className="text-lg ml-2 text-yellow-400 font-bold">
                  {item.currentPeriodTokens.toLocaleString()}
                </span>
              </div>
            </div>

            {/* Follow Button */}
            {!isCurrentUser && (
              <div className="flex-shrink-0 ml-4">
                <PrimaryButton
                  text={isPending ? 'Loading...' : 'Follow'}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleFollow(item.userId);
                  }}
                  className="px-4 py-2 text-sm"
                  disabled={isPending}
                />
              </div>
            )}
          </div>
        </ThematicContainer>
      );
    },
    [user?.id, pendingFollowActions, handleProfileNavigation, handleFollow],
  );

  // Render remaining 7 items (smaller)
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
          rounded="lg"
          className={`p-3 mb-2 cursor-pointer`}
          isActive={isCurrentUser}
          onClick={() => handleProfileNavigation(item)}
        >
          <div className="flex items-center">
            {/* Small Rank */}
            <div className="flex-shrink-0 w-8 text-center">
              <span className="text-sm font-medium text-gray-400">#{item.rank}</span>
            </div>

            {/* Small Profile Picture */}
            <div className="flex-shrink-0 mx-3">
              <ThematicImage className="rounded-full">
                <Image
                  src={item.profilePicture || '/images/profile.png'}
                  alt="Profile"
                  width={32}
                  height={32}
                  className="w-8 h-8 object-cover rounded-full"
                />
              </ThematicImage>
            </div>

            {/* User Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h4 className="font-medium text-sm truncate text-white">{item.username}</h4>
                {isCurrentUser && <span className="text-xs bg-purple-600 px-1 py-0.5 rounded text-white">You</span>}
              </div>
              <div className="flex items-center mt-1">
                <Image src={nocenixIcon} alt="Nocenix" width={14} height={14} />
                <span className="text-sm ml-1 text-yellow-400 font-medium">
                  {item.currentPeriodTokens.toLocaleString()}
                </span>
              </div>
            </div>

            {/* Follow Button */}
            {!isCurrentUser && (
              <div className="flex-shrink-0 ml-2">
                <PrimaryButton
                  text={isPending ? '...' : 'Follow'}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleFollow(item.userId);
                  }}
                  className="px-2 py-1 text-xs h-6"
                  disabled={isPending}
                />
              </div>
            )}
          </div>
        </ThematicContainer>
      );
    },
    [user?.id, pendingFollowActions, handleProfileNavigation, handleFollow],
  );

  if (showSearchResults) {
    return (
      <div className="text-white p-4 min-h-screen mt-20">
        <div className="flex flex-col items-center">
          <SearchBox onSearch={handleSearch} onUserSelect={handleUserSelect} users={searchResults} />

          <div className="w-full max-w-md mt-4">
            <ThematicContainer
              asButton={true}
              glassmorphic={true}
              color="nocenaPink"
              rounded="lg"
              className="mb-4 p-2"
              onClick={() => {
                setShowSearchResults(false);
                setSearchTerm('');
                setSearchResults([]);
              }}
            >
              <span className="text-sm">← Back to Leaderboards</span>
            </ThematicContainer>

            <div className="space-y-2">
              {searchResults.length === 0 ? (
                <div className="text-center py-8 text-gray-400">No users found matching "{searchTerm}"</div>
              ) : (
                searchResults.map((user) => (
                  <ThematicContainer
                    key={user.id}
                    asButton={false}
                    glassmorphic={true}
                    color="nocenaBlue"
                    rounded="lg"
                    className="p-3 cursor-pointer"
                    onClick={() => handleUserSelect(user)}
                  >
                    <div className="flex items-center">
                      <ThematicImage className="rounded-full flex-shrink-0">
                        <Image
                          src={user.profilePicture || '/images/profile.png'}
                          alt="Profile"
                          width={40}
                          height={40}
                          className="w-10 h-10 object-cover rounded-full"
                        />
                      </ThematicImage>
                      <div className="ml-3 flex-1">
                        <h3 className="font-medium text-sm">{user.username}</h3>
                        <div className="flex items-center mt-1">
                          <Image src={nocenixIcon} alt="Nocenix" width={14} height={14} />
                          <span className="text-xs ml-1 text-gray-400">{user.earnedTokens || 0}</span>
                        </div>
                      </div>
                    </div>
                  </ThematicContainer>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="text-white p-4 min-h-screen mt-20">
      <div className="flex flex-col items-center">
        {/* Search Box */}
        <SearchBox onSearch={handleSearch} onUserSelect={handleUserSelect} users={[]} />

        {/* Title */}
        <div className="w-full max-w-md mt-6 mb-4">
          <h1 className="text-2xl font-bold text-center bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            Leaderboards
          </h1>
          <p className="text-center text-sm text-gray-400 mt-1">Compete with other Nocena users</p>
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
            <>
              {/* Top 3 - Large display */}
              {currentLeaderboard.slice(0, 3).map((item, index) => renderTopThreeItem(item, index))}

              {/* Remaining 7 - Smaller display */}
              {currentLeaderboard.slice(3).map((item, index) => renderRemainingItem(item, index + 3))}
            </>
          )}
        </div>

        {/* Footer note - removed since no more demo users */}
      </div>
    </div>
  );
};

export default SearchView;
