import React, { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useRouter } from 'next/router';

import ThematicImage from '../../components/ui/ThematicImage';
import ThematicText from '../../components/ui/ThematicText';
import PrimaryButton from '../../components/ui/PrimaryButton';
import { User } from '../../contexts/AuthContext';
import { fetchAllUsers, toggleFollowUser } from '../../lib/api/dgraph';
import SearchBox from './components/SearchBox';
import Image from 'next/image';

const nocenixIcon = '/nocenix.ico';

const SearchView = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [pendingFollowActions, setPendingFollowActions] = useState<Set<string>>(new Set());
  const { user } = useAuth();
  const router = useRouter();

  // Fetch all users when the component mounts
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const allUsers = await fetchAllUsers();
        setUsers(allUsers);
      } catch (error) {
        console.error('Error fetching users:', error);
      }
    };
    fetchUsers();
  }, []);

  const handleFollow = async (targetUserId: string) => {
    if (!user || !user.id || !targetUserId || user.id === targetUserId) return;
    
    // Add to pending actions to prevent multiple clicks
    if (pendingFollowActions.has(targetUserId)) return;
    setPendingFollowActions(prev => new Set(prev).add(targetUserId));
    
    // Immediately update UI for better user experience
    setUsers((prevUsers) =>
      prevUsers.map((u) =>
        u.id === targetUserId
          ? {
              ...u,
              followers: u.followers.includes(user.id)
                ? u.followers.filter((id) => id !== user.id)
                : [...u.followers, user.id],
            }
          : u
      )
    );
    
    try {
      // Make API call in the background
      const success = await toggleFollowUser(user.id, targetUserId, user.username);
      
      // If API call fails, revert the UI change
      if (!success) {
        setUsers((prevUsers) =>
          prevUsers.map((u) =>
            u.id === targetUserId
              ? {
                  ...u,
                  followers: u.followers.includes(user.id)
                    ? u.followers.filter((id) => id !== user.id)
                    : [...u.followers, user.id],
                }
              : u
          )
        );
      }
    } catch (error) {
      console.error('Error toggling follow:', error);
      
      // Revert UI change on error
      setUsers((prevUsers) =>
        prevUsers.map((u) =>
          u.id === targetUserId
            ? {
                ...u,
                followers: u.followers.includes(user.id)
                  ? u.followers.filter((id) => id !== user.id)
                  : [...u.followers, user.id],
              }
            : u
        )
      );
    } finally {
      // Remove from pending actions
      setPendingFollowActions(prev => {
        const updated = new Set(prev);
        updated.delete(targetUserId);
        return updated;
      });
    }
  };

  const handleProfileRedirect = (clickedUser: User) => {
    if (!clickedUser.wallet) return;
    
    if (user?.id === clickedUser.id) {
      router.push(`/profile`);
    } else {
      router.push(`/profile/${clickedUser.id}`);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center p-4 text-white">
      {/* SearchBox Component */}
      <SearchBox onUserSelect={(selectedUser) => console.log('User selected:', selectedUser)} />

      {/* Default User List */}
      <div className="w-full max-w-md space-y-2 mt-6 px-1">
        {users.map((userData) => {
          const isFollowing = userData.followers.includes(user!.id);
          const isCurrentUser = userData.id === user!.id;
          const isPending = pendingFollowActions.has(userData.id);

          return (
            <div
              key={userData.id}
              className="w-full bg-nocenaBg/80 py-3 rounded-lg flex flex-col cursor-pointer overflow-hidden"
            >
              <div className="flex items-center">
                <div 
                  className="flex items-center gap-3 flex-1 min-w-0" 
                  onClick={() => handleProfileRedirect(userData)}
                >
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
                          ? isFollowing ? 'Following...' : 'Following...' 
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
        })}
      </div>
    </div>
  );
};

export default SearchView;