import React, { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import ThematicImage from '../../components/ui/ThematicImage';
import ThematicText from '../../components/ui/ThematicText';
import PrimaryButton from '../../components/ui/PrimaryButton';
import { User } from '../../contexts/AuthContext';
import { fetchAllUsers, toggleFollowUser } from '../../utils/api/dgraph';
import SearchBox from './SearchBox';
import Image from 'next/image';

const nocenixIcon = '/nocenix.ico';

const SearchView = () => {
  const [users, setUsers] = useState<User[]>([]);
  const { user } = useAuth();

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
    
    const success = await toggleFollowUser(user.id, targetUserId, user.username);
    if (success) {
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
  };

  return (
    <div className="min-h-screen flex flex-col items-center p-4 text-white">
      {/* SearchBox Component */}
      <SearchBox onUserSelect={(selectedUser) => console.log('User selected:', selectedUser)} />

      {/* Default User List */}
      <div className="w-full max-w-md space-y-4 mt-6">
        {users.map((userData) => {
          const isFollowing = userData.followers.includes(user!.id);
          const isCurrentUser = userData.id === user!.id;

          return (
            <div
              key={userData.id}
              className="w-full bg-nocenaBg/80 p-4 rounded-lg flex items-center justify-between"
            >
              <div className="flex items-center gap-4 flex-grow">
                <ThematicImage className="rounded-full flex-shrink-0">
                  <Image
                    src={userData.profilePicture || '/profile.png'}
                    alt="Profile"
                    width={96}
                    height={96}
                    className="w-14 h-14 object-cover rounded-full"
                  />
                </ThematicImage>

                <div className="min-w-0">
                  <ThematicText
                    text={userData.username}
                    isActive={true}
                    className="truncate text-left"
                  />
                  <div className="flex items-center space-x-2 mt-1">
                    <Image src={nocenixIcon} alt="Nocenix" width={20} height={20} />
                    <span className="text-sm">{userData.earnedTokens}</span>
                  </div>
                </div>
              </div>

              {/* Follow Button */}
              <div className="ml-4 flex-shrink-0">
                <PrimaryButton
                  text={isCurrentUser ? 'Your Profile' : isFollowing ? 'Following' : 'Follow'}
                  onPressed={() => handleFollow(userData.id)}
                  className="px-3 py-1 text-sm min-w-[7rem]"
                  isActive={isFollowing}
                  disabled={isCurrentUser} // Disable if it's the logged-in user
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default SearchView;
