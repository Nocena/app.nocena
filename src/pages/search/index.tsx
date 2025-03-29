import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useRouter } from 'next/router';
import { getPageState, updatePageState } from '../../components/PageManager';

import ThematicImage from '../../components/ui/ThematicImage';
import ThematicText from '../../components/ui/ThematicText';
import PrimaryButton from '../../components/ui/PrimaryButton';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { fetchAllUsers, toggleFollowUser } from '../../lib/api/dgraph';
import SearchBox, { SearchUser } from './components/SearchBox';
import Image from 'next/image';

const nocenixIcon = '/nocenix.ico';

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

// Define interface for follower/following item
interface FollowItem {
  id: string;
  [key: string]: unknown;
}

const SearchView = () => {
  const [users, setUsers] = useState<SearchUser[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<SearchUser[]>([]);
  const [pendingFollowActions, setPendingFollowActions] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false); // Start with false to use cache first
  const [searchTerm, setSearchTerm] = useState('');
  const [isPageVisible, setIsPageVisible] = useState(true);
  const [initialRenderComplete, setInitialRenderComplete] = useState(false);
  const { user } = useAuth();
  const router = useRouter();

  // Convert AuthUser to SearchUser helper
  const convertToSearchUser = useCallback((authUser: AuthUserData): SearchUser => {
    return {
      id: authUser.id,
      username: authUser.username,
      profilePicture: authUser.profilePicture || '/images/profile.png',
      wallet: authUser.wallet || '',
      earnedTokens: authUser.earnedTokens || 0,
      bio: authUser.bio || '',
      // Convert followers array to array of IDs
      followers: Array.isArray(authUser.followers)
        ? authUser.followers.map((f: string | FollowItem) => (typeof f === 'string' ? f : f.id))
        : [],
      // Convert following array to array of IDs
      following: Array.isArray(authUser.following)
        ? authUser.following.map((f: string | FollowItem) => (typeof f === 'string' ? f : f.id))
        : [],
    };
  }, []);

  // Check if this page is visible in the PageManager
  useEffect(() => {
    const handleVisibilityChange = (event: Event) => {
      const customEvent = event as CustomEvent;
      if (customEvent.detail && customEvent.detail.pageName === 'search') {
        setIsPageVisible(customEvent.detail.isVisible);
      }
    };

    const handleRouteChange = (event: Event) => {
      const customEvent = event as CustomEvent;
      if (customEvent.detail) {
        if (customEvent.detail.to === '/search') {
          setIsPageVisible(true);
        } else if (customEvent.detail.from === '/search') {
          setIsPageVisible(false);
        }
      }
    };

    window.addEventListener('pageVisibilityChange', handleVisibilityChange);
    window.addEventListener('routeChange', handleRouteChange);

    // Initialize visibility based on current route
    setIsPageVisible(window.location.pathname === '/search');

    return () => {
      window.removeEventListener('pageVisibilityChange', handleVisibilityChange);
      window.removeEventListener('routeChange', handleRouteChange);
    };
  }, []);

  // First load - check for cached data
  useEffect(() => {
    // Try to load from PageManager state first
    try {
      const pageState = getPageState();
      if (pageState && pageState.feed) {
        const { data: cachedUsers, lastFetched } = pageState.feed;

        // Only use data if it's not too old (10 minutes)
        if (cachedUsers && Array.isArray(cachedUsers) && cachedUsers.length > 0 && Date.now() - lastFetched < 600000) {
          setUsers(cachedUsers);
          setFilteredUsers(cachedUsers);
        }
      } else {
        // Try localStorage if PageManager doesn't have data
        const cachedData = localStorage.getItem('nocena_cached_users');
        if (cachedData) {
          const { data, timestamp } = JSON.parse(cachedData);
          if (Array.isArray(data) && data.length > 0 && Date.now() - timestamp < 600000) {
            setUsers(data);
            setFilteredUsers(data);
          }
        }
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Failed to load cached users', error);
    }

    setInitialRenderComplete(true);
  }, []);

  // Fetch users - optimized to prevent unnecessary fetches
  const fetchUserData = useCallback(
    async (showLoading = true) => {
      if (showLoading) setIsLoading(true);

      try {
        const allUsers = await fetchAllUsers();

        // Convert AuthUser[] to SearchUser[]
        const searchUsers = allUsers.map(convertToSearchUser);

        setUsers(searchUsers);
        setFilteredUsers(searchUsers);

        // Update both PageManager state and localStorage cache
        updatePageState('feed', searchUsers);

        localStorage.setItem(
          'nocena_cached_users',
          JSON.stringify({
            data: searchUsers,
            timestamp: Date.now(),
          }),
        );
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('Error fetching users:', error);
      } finally {
        if (showLoading) setIsLoading(false);
      }
    },
    [convertToSearchUser],
  );

  // Fetch users when the component becomes visible or on initial render if needed
  useEffect(() => {
    if (!initialRenderComplete) return;

    const shouldFetch =
      users.length === 0 || // No data
      (isPageVisible && !isLoading); // Page is visible and not already loading

    if (shouldFetch) {
      // Only show loading indicator if we have no data yet
      fetchUserData(users.length === 0);
    }
  }, [isPageVisible, initialRenderComplete, users.length, isLoading, fetchUserData]);

  // Set up background refresh when page is visible
  useEffect(() => {
    if (!isPageVisible) return;

    // Create a function to refresh users silently
    const refreshFunction = () => {
      // Get pageState to check last fetch time
      const pageState = getPageState();
      const lastFetched = pageState?.feed?.lastFetched || 0;

      // Only refresh if data is older than 5 minutes
      if (Date.now() - lastFetched > 300000) {
        fetchUserData(false); // Silent background refresh
      }
    };

    // Create interval with compatibility for both browser and Node.js timer types
    const intervalId = window.setInterval(refreshFunction, 300000); // Check every 5 minutes

    // Add to tracking for memory optimization
    if (typeof window !== 'undefined' && window.nocena_app_timers) {
      window.nocena_app_timers.push(intervalId);
    }

    return () => window.clearInterval(intervalId);
  }, [isPageVisible, fetchUserData]);

  // Handle app foreground events
  useEffect(() => {
    const handleAppForeground = () => {
      if (isPageVisible) {
        // When app comes back to foreground and this page is visible,
        // silently refresh users if it's been more than 5 minutes
        const pageState = getPageState();
        const lastFetched = pageState?.feed?.lastFetched || 0;

        if (Date.now() - lastFetched > 300000) {
          fetchUserData(false);
        }
      }
    };

    window.addEventListener('nocena_app_foreground', handleAppForeground);

    return () => {
      window.removeEventListener('nocena_app_foreground', handleAppForeground);
    };
  }, [isPageVisible, fetchUserData]);

  // Filter users based on search term - optimized for performance
  const handleSearch = useCallback(
    (term: string) => {
      setSearchTerm(term);

      if (!term.trim()) {
        setFilteredUsers(users);
        return;
      }

      // Debounce for better performance
      const filtered = users.filter((user) => user.username.toLowerCase().includes(term.toLowerCase()));

      setFilteredUsers(filtered);
    },
    [users],
  );

  // Optimized follow handler with better state management
  const handleFollow = useCallback(
    async (targetUserId: string) => {
      if (!user || !user.id || !targetUserId || user.id === targetUserId) return;

      // Add to pending actions to prevent multiple clicks
      if (pendingFollowActions.has(targetUserId)) return;
      setPendingFollowActions((prev) => new Set(prev).add(targetUserId));

      // Immediately update UI for better user experience
      const updateUserFollowState = (userList: SearchUser[]) => {
        return userList.map((u) => {
          if (u.id === targetUserId) {
            const isCurrentlyFollowing = u.followers && Array.isArray(u.followers) && u.followers.includes(user.id);

            const updatedFollowers = isCurrentlyFollowing
              ? (u.followers || []).filter((id) => id !== user.id)
              : [...(u.followers || []), user.id];

            return { ...u, followers: updatedFollowers };
          }
          return u;
        });
      };

      // Update both lists
      const updatedUsers = updateUserFollowState(users);
      const updatedFilteredUsers = updateUserFollowState(filteredUsers);

      setUsers(updatedUsers);
      setFilteredUsers(updatedFilteredUsers);

      // Also update the cached state
      updatePageState('feed', updatedUsers);

      try {
        // Make API call in the background
        const success = await toggleFollowUser(user.id, targetUserId, user.username);

        // If API call fails, revert the UI change
        if (!success) {
          const revertedUsers = updateUserFollowState(updatedUsers);
          const revertedFilteredUsers = updateUserFollowState(updatedFilteredUsers);

          setUsers(revertedUsers);
          setFilteredUsers(revertedFilteredUsers);
          updatePageState('feed', revertedUsers);
        }
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('Error toggling follow:', error);
      } finally {
        // Remove from pending actions
        setPendingFollowActions((prev) => {
          const updated = new Set(prev);
          updated.delete(targetUserId);
          return updated;
        });
      }
    },
    [user, pendingFollowActions, users, filteredUsers],
  );

  const handleProfileRedirect = useCallback(
    (clickedUser: SearchUser) => {
      if (!clickedUser.wallet) return;

      if (user?.id === clickedUser.id) {
        router.push(`/profile`);
      } else {
        router.push(`/profile/${clickedUser.id}`);
      }
    },
    [router, user?.id],
  );

  // Define the handler for SearchBox's onUserSelect
  const handleUserSelect = useCallback(
    (user: SearchUser) => {
      handleProfileRedirect(user);
    },
    [handleProfileRedirect],
  );

  // Memoize the user list to prevent unnecessary re-renders
  const userList = useMemo(() => {
    if (isLoading && filteredUsers.length === 0) {
      return (
        <div className="w-full flex justify-center items-center py-8">
          <LoadingSpinner />
        </div>
      );
    }

    if (filteredUsers.length === 0) {
      return (
        <div className="w-full text-center py-8 text-gray-400">
          {searchTerm.trim() ? 'No users found matching your search' : 'No users found'}
        </div>
      );
    }

    return filteredUsers.map((userData) => {
      const isFollowing =
        userData.followers && Array.isArray(userData.followers) && user && userData.followers.includes(user.id);
      const isCurrentUser = userData.id === user?.id;
      const isPending = pendingFollowActions.has(userData.id);

      return (
        <div
          key={userData.id}
          className="w-full bg-nocenaBg/80 py-3 px-3 rounded-lg flex flex-col cursor-pointer overflow-hidden transition-all hover:bg-nocenaBg"
        >
          <div className="flex items-center">
            <div className="flex items-center gap-3 flex-1 min-w-0" onClick={() => handleProfileRedirect(userData)}>
              <ThematicImage className="rounded-full flex-shrink-0">
                <Image
                  src={userData.profilePicture || '/images/profile.png'}
                  alt="Profile"
                  width={96}
                  height={96}
                  className="w-10 h-10 object-cover rounded-full"
                />
              </ThematicImage>

              <div className="flex-1 min-w-0 mr-2">
                <ThematicText
                  text={userData.username}
                  isActive={true}
                  className="truncate text-left max-w-full text-sm font-medium"
                />
                <div className="flex items-center mt-0.5">
                  <Image src={nocenixIcon} alt="Nocenix" width={14} height={14} />
                  <span className="text-xs ml-1 text-gray-400">{userData.earnedTokens}</span>
                </div>
              </div>
            </div>

            {/* Follow Button */}
            <div className="flex-shrink-0">
              <PrimaryButton
                text={
                  isCurrentUser
                    ? 'Your Profile'
                    : isPending
                      ? isFollowing
                        ? 'Following...'
                        : 'Unfollowing...'
                      : isFollowing
                        ? 'Following'
                        : 'Follow'
                }
                onClick={(e) => {
                  e.stopPropagation(); // Prevent profile navigation when clicking the button
                  if (!isCurrentUser) handleFollow(userData.id);
                }}
                className="px-3 py-1 text-xs min-w-[5rem] h-8"
                isActive={!!isFollowing}
                disabled={isCurrentUser || isPending}
              />
            </div>
          </div>
        </div>
      );
    });
  }, [filteredUsers, user, pendingFollowActions, isLoading, searchTerm, handleProfileRedirect, handleFollow]);

  // Immediately show cached results on first render
  if (!initialRenderComplete && users.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center p-4 text-white">
        <SearchBox onSearch={handleSearch} onUserSelect={handleUserSelect} users={[]} />
        <div className="w-full max-w-md space-y-2 mt-6 px-1">
          <div className="w-full flex justify-center items-center py-8">
            <LoadingSpinner />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center p-4 text-white">
      {/* SearchBox Component */}
      <SearchBox onSearch={handleSearch} onUserSelect={handleUserSelect} users={users} />

      {/* User List */}
      <div className="w-full max-w-md space-y-2 mt-6 px-1">{userList}</div>
    </div>
  );
};

export default SearchView;
