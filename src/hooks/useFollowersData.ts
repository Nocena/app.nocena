import { useState, useEffect, useCallback } from 'react';
import { fetchUserFollowers } from '../lib/api/dgraph';
import { getPageState, updatePageState } from '../components/PageManager';

const useFollowersData = (userId?: string) => {
  const [followersCount, setFollowersCount] = useState<number>(0);
  const [followers, setFollowers] = useState<string[]>([]);
  const [showFollowersPopup, setShowFollowersPopup] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isPageVisible, setIsPageVisible] = useState(true);

  // Page visibility tracking
  useEffect(() => {
    const handleVisibilityChange = (event: Event) => {
      const customEvent = event as CustomEvent;
      if (customEvent.detail && customEvent.detail.pageName === 'profile') {
        setIsPageVisible(customEvent.detail.isVisible);
      }
    };

    const handleRouteChange = (event: Event) => {
      const customEvent = event as CustomEvent;
      if (customEvent.detail) {
        if (customEvent.detail.to === '/profile') {
          setIsPageVisible(true);
        } else if (customEvent.detail.from === '/profile') {
          setIsPageVisible(false);
        }
      }
    };

    window.addEventListener('pageVisibilityChange', handleVisibilityChange);
    window.addEventListener('routeChange', handleRouteChange);
    setIsPageVisible(window.location.pathname === '/profile');

    return () => {
      window.removeEventListener('pageVisibilityChange', handleVisibilityChange);
      window.removeEventListener('routeChange', handleRouteChange);
    };
  }, []);

  const fetchFollowersData = useCallback(
    async (showLoading = true) => {
      if (!userId) return;
      if (showLoading) setIsLoading(true);

      try {
        const pageState = getPageState();
        const profileCacheKey = `profile_${userId}`;

        // Check cache first
        if (pageState && pageState[profileCacheKey] && Date.now() - pageState[profileCacheKey].lastFetched < 300000) {
          const { followers } = pageState[profileCacheKey].data;
          if (Array.isArray(followers)) {
            setFollowers(followers);
            setFollowersCount(followers.length);
            if (!showLoading) return;
          }
        }

        // Fetch from API
        const fetchedFollowers = await fetchUserFollowers(userId);
        if (Array.isArray(fetchedFollowers)) {
          setFollowers(fetchedFollowers);
          setFollowersCount(fetchedFollowers.length);

          // Update cache
          updatePageState(profileCacheKey, {
            followers: fetchedFollowers,
          });

          localStorage.setItem(
            `nocena_${profileCacheKey}`,
            JSON.stringify({
              data: { followers: fetchedFollowers },
              timestamp: Date.now(),
            }),
          );
        } else if (typeof fetchedFollowers === 'number') {
          setFollowersCount(fetchedFollowers);
        }
      } catch (error) {
        console.error('Error fetching followers:', error);
      } finally {
        if (showLoading) setIsLoading(false);
      }
    },
    [userId],
  );

  // Main effect for fetching followers
  useEffect(() => {
    if (!userId || !isPageVisible) return;

    // Try to load from localStorage cache first
    try {
      const profileCacheKey = `profile_${userId}`;
      const cachedData = localStorage.getItem(`nocena_${profileCacheKey}`);

      if (cachedData) {
        const { data, timestamp } = JSON.parse(cachedData);
        if (data && data.followers && Date.now() - timestamp < 300000) {
          setFollowers(data.followers);
          setFollowersCount(data.followers.length);
        }
      }
    } catch (error) {
      console.error('Error reading cached followers', error);
    }

    // Fetch fresh data
    fetchFollowersData(followers.length === 0);

    // Set up refresh interval
    const intervalId = setInterval(() => {
      if (isPageVisible) {
        fetchFollowersData(false); // Silent refresh
      }
    }, 300000); // Every 5 minutes

    // Add to global timer tracking for cleanup
    if (typeof window !== 'undefined' && window.nocena_app_timers) {
      window.nocena_app_timers.push(intervalId as unknown as number);
    }

    return () => clearInterval(intervalId);
  }, [userId, isPageVisible, fetchFollowersData, followers.length]);

  // Handle app coming back to foreground
  useEffect(() => {
    const handleAppForeground = () => {
      if (isPageVisible && userId) {
        fetchFollowersData(false);
      }
    };

    window.addEventListener('nocena_app_foreground', handleAppForeground);

    return () => {
      window.removeEventListener('nocena_app_foreground', handleAppForeground);
    };
  }, [isPageVisible, userId, fetchFollowersData]);

  const handleFollowersClick = () => {
    setShowFollowersPopup(true);
  };

  return {
    followersCount,
    followers,
    showFollowersPopup,
    setShowFollowersPopup,
    isLoading,
    handleFollowersClick,
    refreshFollowers: () => fetchFollowersData(true),
  };
};

export default useFollowersData;
