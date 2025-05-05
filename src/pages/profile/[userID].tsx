import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/router';

import { getUserByIdFromDgraph, toggleFollowUser } from '../../lib/api/dgraph';
import { useAuth, User as AuthUser } from '../../contexts/AuthContext';
import { getPageState, updatePageState } from '../../components/PageManager';
import PrimaryButton from '../../components/ui/PrimaryButton';
import ThematicImage from '../../components/ui/ThematicImage';
import ChallengeIndicator from './components/ChallengeIndicator';
import ThematicText from '../../components/ui/ThematicText';
import FollowersPopup from './components/FollowersPopup';

import FollowersIcon from '../../components/icons/followers';

const defaultProfilePic = '/images/profile.png';
const nocenix = '/nocenix.ico';

// Local User interface for profile page
interface ProfileUser {
  id: string;
  username: string;
  profilePicture: string;
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
        targetProfilePic: user.profilePicture || defaultProfilePic
      }
    });
  };

  // Memoize challenge indicators to prevent unnecessary re-renders
  const challengeIndicators = useMemo(() => {
    if (!user) return null;

    return monthNames.map((month, index) => (
      <div key={index} className={`w-[200px] shrink-0 flex flex-col items-center justify-center`}>
        <div
          className={`w-24 h-24 rounded-full flex items-center justify-center mt-8 ${index === new Date().getMonth() ? 'bg-primary' : ''}`}
        >
          <ChallengeIndicator
            dailyChallenges={user.dailyChallenge.split('').map((char) => char === '1')}
            weeklyChallenges={user.weeklyChallenge.split('').map((char) => char === '1')}
            monthlyChallenge={user.monthlyChallenge.split('').map((char) => char === '1')}
            month={index}
          />
        </div>
        <span className="text-sm mt-4">{month}</span>
      </div>
    ));
  }, [user, monthNames]);

  // Show loading state only if we don't have any cached data at all
  if (isLoading && !user) {
    return <div className="flex items-center justify-center min-h-screen text-white">Loading...</div>;
  }

  if (error && initialDataLoaded) {
    return (
      <div className="flex items-center justify-center min-h-screen text-white">
        Error loading profile: {error.message}
      </div>
    );
  }

  if (!user && initialDataLoaded) {
    return <div className="flex items-center justify-center min-h-screen text-white">User not found.</div>;
  }

  // If we have user data (either from cache or API), show the profile
  if (user) {
    // Check if current user is following this profile
    const isFollowing = !!(currentUser && user.followers.includes(currentUser.id));

    return (
      <div className="flex flex-col items-center text-white relative min-h-screen overflow-hidden mt-16">
        <div className="absolute inset-0">
          <div className="absolute -top-50 right-0 transform translate-x-1/4 w-[400px] h-[400px] bg-primary-blue rounded-full opacity-10 blur-lg"></div>
          <div className="absolute -bottom-40 left-0 transform -translate-x-1/3 w-[500px] h-[500px] bg-primary-pink rounded-full opacity-10 blur-lg"></div>
        </div>

        <div className="relative z-10 flex items-center justify-between w-full max-w-xs my-8">
          <div
            className="flex flex-col items-center cursor-pointer hover:opacity-80 transition-opacity"
            onClick={() => setShowFollowersPopup(true)}
          >
            <FollowersIcon className="w-8 h-8 mb-1" />
            <span>{user.followers.length}</span>
          </div>

          <ThematicImage className="relative z-10">
            <Image
              src={user.profilePicture || defaultProfilePic}
              alt="Profile"
              width={96}
              height={96}
              className="w-24 h-24 object-cover rounded-full"
            />
          </ThematicImage>

          <div className="flex flex-col items-center">
            <Image src={nocenix} alt="Nocenix Token" width={40} height={40} className="w-10 h-10 mb-1" />
            <span>{user.earnedTokens}</span>
          </div>
        </div>

        {/* Followers Popup */}
        <FollowersPopup
          isOpen={showFollowersPopup}
          onClose={() => setShowFollowersPopup(false)}
          followers={user.followers}
          isFollowers={true}
        />

        <ThematicText text={user.username} isActive={true} className="capitalize relative z-10" />

        <div className="relative z-10 mt-4">
          <PrimaryButton
            text={
              isPendingFollow ? (isFollowing ? 'Following...' : 'Unfollowing...') : isFollowing ? 'Following' : 'Follow'
            }
            onClick={handleFollowToggle}
            className="mb-2"
            isActive={!!isFollowing}
            disabled={isPendingFollow || !currentUser}
          />

          <PrimaryButton 
            text="Challenge Me" 
            onClick={handleChallengeClick} 
            disabled={!currentUser || currentUser.id === user.id}
          />
        </div>

        <div className="relative z-10 px-4 text-center text-sm bg-black/40 rounded-md py-2 w-full max-w-xs mt-4">
          <p>{user.bio || 'This user has no bio.'}</p>
        </div>

        <div className="relative z-20 mt-10 text-center w-full">
          <h3 className="text-lg font-semibold">Timed challenge counter</h3>
          <div
            className="relative z-20 flex overflow-x-auto no-scrollbar w-full px-4"
            ref={scrollContainerRef}
            style={{ paddingBottom: '30px' }}
          >
            {challengeIndicators}
          </div>
        </div>
      </div>
    );
  }

  // Default loading state (should only show briefly)
  return (
    <div className="flex items-center justify-center min-h-screen text-white">
      <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
    </div>
  );
};

export default OtherProfileView;