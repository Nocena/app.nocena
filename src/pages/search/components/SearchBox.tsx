import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { searchUsers } from '../../../lib/api/dgraph';
import { sanitizeInput } from '../../../lib/utils/security';
import { useAuth } from '../../../contexts/AuthContext';

import ThematicImage from '../../../components/ui/ThematicImage';
import Image from 'next/image';

interface SearchBoxProps {
  onUserSelect?: (user: any) => void;
}

const SearchBox: React.FC<SearchBoxProps> = ({ onUserSelect }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestedUsers, setSuggestedUsers] = useState<any[]>([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const router = useRouter();
  const { user } = useAuth();

  useEffect(() => {
    const debounceTimeout = setTimeout(async () => {
      const sanitizedQuery = sanitizeInput(searchQuery);

      if (sanitizedQuery.trim() === '') {
        setSuggestedUsers([]);
        setIsDropdownOpen(false);
      } else {
        try {
          const results = await searchUsers(sanitizedQuery);
          setSuggestedUsers(results);
          setIsDropdownOpen(true);
        } catch (error) {
          console.error('Error fetching search suggestions:', error);
          setSuggestedUsers([]);
        }
      }
    }, 300);

    return () => clearTimeout(debounceTimeout);
  }, [searchQuery]);

  const handleProfileRedirect = (selectedUser: any) => {
    console.log(selectedUser);
    if (!selectedUser.wallet) return;
    if (user?.id === selectedUser.id) {
      router.push('/profile');
    } else {
      router.push(`/profile/${selectedUser.id}`);
    }

    setSearchQuery('');
    setIsDropdownOpen(false);
  };

  return (
    <div className="relative w-full max-w-md">
      <input
        type="text"
        placeholder="Search by username"
        className="w-full p-3 bg-gray-800 text-white rounded-lg focus:outline-none"
        value={searchQuery}
        onChange={(e) => setSearchQuery(sanitizeInput(e.target.value))}
      />

      {isDropdownOpen && suggestedUsers.length > 0 && (
        <ul className="absolute top-full mt-2 w-full bg-gray-900 rounded-lg shadow-lg overflow-hidden z-50">
          {suggestedUsers.map((user) => (
            <li
              key={user.id}
              onClick={() => handleProfileRedirect(user)}
              className="flex items-center gap-4 p-3 hover:bg-gray-700 cursor-pointer"
            >

              <ThematicImage className="rounded-full">
                <Image
                  src={user.profilePicture || '/images/profile.png'}
                  alt="Profile"
                  width={96}
                  height={96}
                  className="w-10 h-10 object-cover rounded-full"
                />
              </ThematicImage>

              <span className="text-white font-medium">{user.username}</span>
            </li>
          ))}
        </ul>
      )}

      {isDropdownOpen && suggestedUsers.length === 0 && (
        <div className="absolute top-full mt-2 w-full bg-gray-900 rounded-lg shadow-lg p-3 text-gray-400 text-center z-50">
          No users found.
        </div>
      )}
    </div>
  );
};

export default SearchBox;
