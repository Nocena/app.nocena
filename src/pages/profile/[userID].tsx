import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/router';

import { getUserByIdFromDgraph, toggleFollowUser } from '../../lib/api/dgraph';
import { useAuth, User as AuthUser } from '../../contexts/AuthContext';
import { getPageState, updatePageState } from '../../components/PageManager';
import PrimaryButton from '../../components/ui/PrimaryButton';
import ThematicContainer from '../../components/ui/ThematicContainer';
import FollowersPopup from './components/FollowersPopup';
import TrailerSection from './components/AvatarSection';
import StatsSection from './components/StatsSection';
import CalendarSection from './components/CalendarSection';

const defaultProfilePic = '/images/profile.png';
const nocenix = '/nocenix.ico';

// Local User interface for profile page
interface ProfileUser {
  id: string;
  username: string;
  profilePicture: string;
  coverPhoto?: string;
  trailerVideo?: string;
  bio: string;
  earnedTokens: number;
  dailyChallenge: string;
  weeklyChallenge: string;
  monthlyChallenge: string;
  followers: string[]; // Array of user IDs
}

// Interface for follower data that could be string or object
type FollowerData = string | { id: string; [key: string]: any };

const OtherProfileView: React.FC = () => {
  const router = useRouter();
  const { userID } = router.query;
  const { user: currentUser } = useAuth();

  const [user, setUser] = useState<ProfileUser | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [isPendingFollow, setIsPendingFollow] = useState(false);
  const [showFollowersPopup, setShowFollowersPopup] = useState(false);
  const [isPageVisible, setIsPageVisible] = useState(true);
  const [initialDataLoaded, setInitialDataLoaded] = useState(false);
  const [activeSection, setActiveSection] = useState<'trailer' | 'calendar' | 'achievements'>('trailer');

  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const monthNames = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ];

  // Check if this page is visible in the PageManager
  useEffect(() => {
    if (!userID) return;

    const profilePath = `/profile/${userID}`;

    const handleVisibilityChange = (event: Event) => {
      const customEvent = event as CustomEvent;
      if (customEvent.detail && customEvent.detail.pageName === 'profile') {
        setIsPageVisible(customEvent.detail.isVisible);
      }
    };

    const handleRouteChange = (event: Event) => {
      const customEvent = event as CustomEvent;
      if (customEvent.detail) {
        if (customEvent.detail.to === profilePath) {
          setIsPageVisible(true);
        } else if (customEvent.detail.from === profilePath) {
          setIsPageVisible(false);
        }
      }
    };

    window.addEventListener('pageVisibilityChange', handleVisibilityChange);
    window.addEventListener('routeChange', handleRouteChange);

    // Initialize visibility based on current route
    setIsPageVisible(window.location.pathname === profilePath);

    return () => {
      window.removeEventListener('pageVisibilityChange', handleVisibilityChange);
      window.removeEventListener('routeChange', handleRouteChange);
    };
  }, [userID]);

  // Function to fetch user data with caching
  const fetchUserData = useCallback(async (userId: string, showLoading = true) => {
    if (showLoading) setIsLoading(true);

    try {
      // Try to get from PageManager first
      const pageState = getPageState();
      const profileCacheKey = `other_profile_${userId}`;

      // Check if we have fresh data in PageManager
      if (pageState && pageState[profileCacheKey] && Date.now() - pageState[profileCacheKey].lastFetched < 300000) {
        const cachedUser = pageState[profileCacheKey].data;
        if (cachedUser && cachedUser.id) {
          setUser(cachedUser as ProfileUser);
          setError(null);
          if (!showLoading) return; // Skip API call if silent refresh
        }
      } else {
        // Try localStorage if PageManager doesn't have data
        const cachedData = localStorage.getItem(`nocena_${profileCacheKey}`);
        if (cachedData) {
          const { data, timestamp } = JSON.parse(cachedData);
          if (data && data.id && Date.now() - timestamp < 300000) {
            setUser(data as ProfileUser);
            setError(null);
            if (!showLoading) return; // Skip API call if silent refresh
          }
        }
      }

      // If no fresh data or forced refresh, get from API
      const fullUser = await getUserByIdFromDgraph(userId);

      if (fullUser) {
        // Convert the AuthUser to ProfileUser format
        const profileUser: ProfileUser = {
          id: fullUser.id,
          username: fullUser.username,
          profilePicture: fullUser.profilePicture,
          coverPhoto: fullUser.coverPhoto,
          trailerVideo: fullUser.trailerVideo,
          bio: fullUser.bio,
          earnedTokens: fullUser.earnedTokens,
          dailyChallenge: fullUser.dailyChallenge,
          weeklyChallenge: fullUser.weeklyChallenge,
          monthlyChallenge: fullUser.monthlyChallenge,
          // Extract follower IDs from User objects
          followers: Array.isArray(fullUser.followers)
            ? fullUser.followers.map((f: FollowerData) => (typeof f === 'string' ? f : f.id))
            : [],
        };

        setUser(profileUser);
        setError(null);

        // Update PageManager state
        updatePageState(profileCacheKey, profileUser);

        // Also update localStorage for faster loads
        localStorage.setItem(
          `nocena_${profileCacheKey}`,
          JSON.stringify({
            data: profileUser,
            timestamp: Date.now(),
          }),
        );
      } else {
        setError(new Error('User not found'));
      }
    } catch (error) {
      console.error('Error fetching full user data:', error);
      setError(error instanceof Error ? error : new Error('An unknown error occurred'));
    } finally {
      if (showLoading) setIsLoading(false);
      setInitialDataLoaded(true);
    }
  }, []);

  // Initial data fetch and setup background refresh
  useEffect(() => {
    if (!userID) return;

    // Try to load from cache first (this will show UI immediately)
    const userId = userID as string;
    const profileCacheKey = `other_profile_${userId}`;

    try {
      // First try PageManager state
      const pageState = getPageState();
      if (pageState && pageState[profileCacheKey]) {
        const cachedUser = pageState[profileCacheKey].data;
        setUser(cachedUser as ProfileUser);
      } else {
        // Try localStorage as fallback
        const cachedData = localStorage.getItem(`nocena_${profileCacheKey}`);
        if (cachedData) {
          const { data } = JSON.parse(cachedData);
          setUser(data as ProfileUser);
        }
      }
    } catch (error) {
      console.error('Error loading cached profile data', error);
    }

    // Fetch fresh data
    fetchUserData(userId, true);

    // Set up background refresh when page is visible
    const refreshInterval = setInterval(() => {
      if (isPageVisible) {
        fetchUserData(userId, false); // Silent refresh
      }
    }, 300000); // Every 5 minutes

    // Add to tracking for memory optimization
    if (typeof window !== 'undefined' && window.nocena_app_timers) {
      window.nocena_app_timers.push(refreshInterval as unknown as number);
    }

    return () => clearInterval(refreshInterval);
  }, [userID, isPageVisible, fetchUserData]);

  useEffect(() => {
    if (scrollContainerRef.current && user) {
      const currentMonthIndex = new Date().getMonth();
      const elementWidth = scrollContainerRef.current.scrollWidth / 12;
      scrollContainerRef.current.scrollLeft =
        elementWidth * currentMonthIndex - scrollContainerRef.current.clientWidth / 2 + elementWidth / 2;
    }
  }, [user]);

  // React to app foreground events
  useEffect(() => {
    const handleAppForeground = () => {
      if (isPageVisible && userID) {
        fetchUserData(userID as string, false); // Silent refresh when app comes to foreground
      }
    };

    window.addEventListener('nocena_app_foreground', handleAppForeground);

    return () => {
      window.removeEventListener('nocena_app_foreground', handleAppForeground);
    };
  }, [isPageVisible, userID, fetchUserData]);

  const handleFollowToggle = async () => {
    if (!currentUser || !user || !currentUser.id || isPendingFollow) return;

    // Set pending state
    setIsPendingFollow(true);

    // Optimistically update UI
    setUser((prevUser) => {
      if (!prevUser) return null;

      const isCurrentlyFollowing = prevUser.followers.includes(currentUser.id);
      const updatedFollowers = isCurrentlyFollowing
        ? prevUser.followers.filter((id) => id !== currentUser.id)
        : [...prevUser.followers, currentUser.id];

      return {
        ...prevUser,
        followers: updatedFollowers,
      };
    });

    // Also update the cached state
    if (user) {
      const profileCacheKey = `other_profile_${user.id}`;
      const isCurrentlyFollowing = user.followers.includes(currentUser.id);
      const updatedFollowers = isCurrentlyFollowing
        ? user.followers.filter((id) => id !== currentUser.id)
        : [...user.followers, currentUser.id];

      const updatedUser = {
        ...user,
        followers: updatedFollowers,
      };

      // Update PageManager state
      updatePageState(profileCacheKey, updatedUser);

      // Update localStorage
      localStorage.setItem(
        `nocena_${profileCacheKey}`,
        JSON.stringify({
          data: updatedUser,
          timestamp: Date.now(),
        }),
      );
    }

    try {
      // Make API call
      const success = await toggleFollowUser(currentUser.id, user.id, currentUser.username);

      // If API call fails, revert the UI change
      if (!success) {
        setUser((prevUser) => {
          if (!prevUser) return null;

          const isCurrentlyFollowing = prevUser.followers.includes(currentUser.id);
          const updatedFollowers = isCurrentlyFollowing
            ? prevUser.followers.filter((id) => id !== currentUser.id)
            : [...prevUser.followers, currentUser.id];

          return {
            ...prevUser,
            followers: updatedFollowers,
          };
        });

        // Also revert the cached state
        if (user) {
          const profileCacheKey = `other_profile_${user.id}`;
          const isCurrentlyFollowing = user.followers.includes(currentUser.id);
          const updatedFollowers = isCurrentlyFollowing
            ? user.followers.filter((id) => id !== currentUser.id)
            : [...user.followers, currentUser.id];

          const updatedUser = {
            ...user,
            followers: updatedFollowers,
          };

          // Update PageManager state
          updatePageState(profileCacheKey, updatedUser);

          // Update localStorage
          localStorage.setItem(
            `nocena_${profileCacheKey}`,
            JSON.stringify({
              data: updatedUser,
              timestamp: Date.now(),
            }),
          );
        }
      }
    } catch (error) {
      console.error('Error toggling follow:', error);

      // Revert UI change on error
      setUser((prevUser) => {
        if (!prevUser) return null;

        const isCurrentlyFollowing = prevUser.followers.includes(currentUser.id);
        const updatedFollowers = isCurrentlyFollowing
          ? prevUser.followers.filter((id) => id !== currentUser.id)
          : [...prevUser.followers, currentUser.id];

        return {
          ...prevUser,
          followers: updatedFollowers,
        };
      });
    } finally {
      setIsPendingFollow(false);
    }
  };

  // Handle "Challenge Me" button click
  const handleChallengeClick = () => {
    if (!user || !currentUser) return;

    console.log('Challenge button clicked for user:', user.username);

    // Navigate to create challenge with private mode and target user data
    router.push({
      pathname: '/createchallenge',
      query: {
        isPrivate: 'true',
        targetUserId: user.id,
        targetUsername: user.username,
        targetProfilePic: user.profilePicture || defaultProfilePic,
      },
    });
  };

  // Handle followers click
  const handleFollowersClick = () => {
    setShowFollowersPopup(true);
  };

  // Calculate stats for components
  const currentStreak = useMemo(() => {
    if (!user) return 0;
    const dailyChallenges = user.dailyChallenge.split('').map((char) => char === '1');
    let streak = 0;
    for (let i = dailyChallenges.length - 1; i >= 0; i--) {
      if (dailyChallenges[i]) {
        streak++;
      } else {
        break;
      }
    }
    return streak;
  }, [user]);

  const totalChallenges = useMemo(() => {
    if (!user) return 0;
    const dailyChallenges = user.dailyChallenge.split('').map((char) => char === '1');
    const weeklyChallenges = user.weeklyChallenge.split('').map((char) => char === '1');
    const monthlyChallenges = user.monthlyChallenge.split('').map((char) => char === '1');

    return (
      dailyChallenges.filter(Boolean).length +
      weeklyChallenges.filter(Boolean).length +
      monthlyChallenges.filter(Boolean).length
    );
  }, [user]);

  const getButtonColor = (section: string) => {
    switch (section) {
      case 'trailer':
        return 'nocenaPink';
      case 'calendar':
        return 'nocenaPurple';
      case 'achievements':
        return 'nocenaBlue';
      default:
        return 'nocenaBlue';
    }
  };

  // Show loading state only if we don't have any cached data at all
  if (isLoading && !user) {
    return (
      <div
        className="fixed inset-0 text-white overflow-y-auto"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 1,
          width: '100vw',
          height: '100vh',
        }}
      >
        <div className="flex items-center justify-center min-h-screen">
          <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  if (error && initialDataLoaded) {
    return (
      <div
        className="fixed inset-0 text-white overflow-y-auto"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 1,
          width: '100vw',
          height: '100vh',
        }}
      >
        <div className="flex items-center justify-center min-h-screen">Error loading profile: {error.message}</div>
      </div>
    );
  }

  if (!user && initialDataLoaded) {
    return (
      <div
        className="fixed inset-0 text-white overflow-y-auto"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 1,
          width: '100vw',
          height: '100vh',
        }}
      >
        <div className="flex items-center justify-center min-h-screen">User not found.</div>
      </div>
    );
  }

  // If we have user data (either from cache or API), show the profile
  if (user) {
    // Check if current user is following this profile
    const isFollowing = !!(currentUser && user.followers.includes(currentUser.id));

    return (
      <div
        className="fixed inset-0 text-white overflow-y-auto"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 1,
          width: '100vw',
          height: '100vh',
        }}
      >
        <div className="min-h-screen">
          {/* Cover Photo Section */}
          <div className="relative h-80 overflow-hidden">
            <div
              className="absolute inset-0"
              style={{
                WebkitMask: 'linear-gradient(to bottom, #101010 0%, #101010 60%, transparent 100%)',
                mask: 'linear-gradient(to bottom, #101010 0%, #101010 60%, transparent 100%)',
              }}
            >
              {user.coverPhoto && user.coverPhoto !== '/images/cover.jpg' ? (
                <Image src={user.coverPhoto} alt="Cover" fill className="object-cover" />
              ) : (
                <Image src="/images/cover.jpg" alt="Cover" fill className="object-cover" />
              )}
            </div>
          </div>

          {/* Profile Section - with improved bottom padding */}
          <div className="px-4 pb-20">
            {/* Profile Picture & Stats */}
            <div className="relative -mt-24 mb-4">
              <div className="flex items-end justify-between">
                {/* Profile Picture */}
                <div className="relative">
                  <div className="w-32 h-32 rounded-full bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500 p-1">
                    <div className="w-full h-full bg-slate-900/80 backdrop-blur-sm rounded-full p-1">
                      <Image
                        src={user.profilePicture || defaultProfilePic}
                        alt="Profile"
                        width={120}
                        height={120}
                        className="w-full h-full object-cover rounded-full"
                      />
                    </div>
                  </div>
                </div>

                {/* Combined Stats Card */}
                <div className="bg-slate-800/60 backdrop-blur-md rounded-2xl p-4 border border-white/10">
                  <div className="flex items-center space-x-6">
                    <div
                      className="text-center cursor-pointer hover:opacity-80 transition-opacity"
                      onClick={handleFollowersClick}
                    >
                      <div className="text-2xl font-bold">{user.followers.length}</div>
                      <div className="text-sm text-white/60">Followers</div>
                    </div>
                    <div className="w-px h-8 bg-white/20"></div>
                    <div className="text-center">
                      <div className="flex items-center space-x-1">
                        <span className="text-2xl font-bold">{user.earnedTokens}</span>
                        <Image src={nocenix} alt="Nocenix" width={20} height={20} />
                      </div>
                      <div className="text-sm text-white/60">Nocenix</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Username */}
            <h1 className="text-2xl font-bold mb-4">{user.username}</h1>

            {/* Bio - Read-only */}
            <div className="mb-6">
              <div className="flex-1">
                {(user.bio || 'This user has no bio.').split('\n').map((line, index) => (
                  <p key={index} className="text-white/80 leading-relaxed">
                    {line}
                  </p>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="mb-6 flex space-x-3">
              <PrimaryButton
                text={
                  isPendingFollow
                    ? isFollowing
                      ? 'Unfollowing...'
                      : 'Following...'
                    : isFollowing
                      ? 'Following'
                      : 'Follow'
                }
                onClick={handleFollowToggle}
                className="flex-1"
                isActive={!isFollowing}
                disabled={isPendingFollow || !currentUser}
              />
              {/*
              <PrimaryButton
                text="Challenge Me"
                onClick={handleChallengeClick}
                className="flex-1"
                isActive={false}
                disabled={!currentUser || currentUser.id === user.id}
              />
              */}
            </div>

            {/* Three Section Menu using ThematicContainer */}
            <div className="mb-6 flex space-x-3 w-full">
              {[
                { key: 'trailer', label: 'Avatar' },
                { key: 'calendar', label: 'Calendar' },
                { key: 'achievements', label: 'Stats' },
              ].map(({ key, label }) => (
                <ThematicContainer
                  key={key}
                  asButton={true}
                  glassmorphic={false}
                  color={getButtonColor(key)}
                  isActive={activeSection === key}
                  onClick={() => setActiveSection(key as any)}
                  className="flex-1 min-w-0 px-2 py-1" // Added min-w-0 to prevent flex shrinking issues
                >
                  <span className="text-sm font-medium whitespace-nowrap text-center w-full">{label}</span>
                </ThematicContainer>
              ))}
            </div>

            {/* Content Based on Active Section - with bottom margin */}
            <div className="space-y-4 mb-8">
              {activeSection === 'trailer' && (
                <TrailerSection profilePicture="placeholder" generatedAvatar="placeholder" />
              )}

              {activeSection === 'calendar' && (
                <CalendarSection
                  dailyChallenges={user.dailyChallenge.split('').map((char) => char === '1')}
                  weeklyChallenges={user.weeklyChallenge.split('').map((char) => char === '1')}
                  monthlyChallenges={user.monthlyChallenge.split('').map((char) => char === '1')}
                />
              )}

              {activeSection === 'achievements' && (
                <StatsSection
                  currentStreak={currentStreak}
                  tokenBalance={user.earnedTokens}
                  dailyChallenges={user.dailyChallenge.split('').map((char) => char === '1')}
                  weeklyChallenges={user.weeklyChallenge.split('').map((char) => char === '1')}
                  monthlyChallenges={user.monthlyChallenge.split('').map((char) => char === '1')}
                />
              )}
            </div>
          </div>
        </div>

        {/* Followers Popup */}
        <FollowersPopup
          isOpen={showFollowersPopup}
          onClose={() => setShowFollowersPopup(false)}
          followers={user.followers}
          isFollowers={true}
        />
      </div>
    );
  }

  // Default loading state (should only show briefly)
  return (
    <div
      className="fixed inset-0 text-white overflow-y-auto"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 1,
        width: '100vw',
        height: '100vh',
      }}
    >
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    </div>
  );
};

export default OtherProfileView;
