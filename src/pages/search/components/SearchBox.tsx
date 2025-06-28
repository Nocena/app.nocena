import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import { searchUsers } from '../../../lib/api/dgraph';
import { sanitizeInput } from '../../../lib/utils/security';
import { useAuth, User as AuthUser } from '../../../contexts/AuthContext';

import ThematicImage from '../../../components/ui/ThematicImage';
import Image from 'next/image';

// Local interface for search results that's compatible with both old and new user structures
export interface SearchUser {
  id: string;
  username: string;
  profilePicture: string;
  wallet: string;
  earnedTokens: number; // Change from optional to required
  bio?: string;
  followers?: any[]; // Keep flexible to support both string[] and User[]
  following?: any[];
}

interface SearchBoxProps {
  onUserSelect?: (user: SearchUser) => void; // Make sure the parameter name is 'user'
  onSearch?: (term: string) => void;
  users?: SearchUser[];
}

const SearchBox: React.FC<SearchBoxProps> = ({ onUserSelect, onSearch, users }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestedUsers, setSuggestedUsers] = useState<SearchUser[]>([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  const router = useRouter();
  const { user } = useAuth();

  // Handle search - supports both local filtering and API search
  // Add this at the beginning of your search useEffect, right after sanitizedQuery check
  useEffect(() => {
    const debounceTimeout = setTimeout(async () => {
      const sanitizedQuery = sanitizeInput(searchQuery);

      if (sanitizedQuery.trim() === '') {
        setSuggestedUsers([]);
        setIsDropdownOpen(false);
        return;
      }

      // Clear previous results first
      setSuggestedUsers([]);

      // Call onSearch callback if provided (for parent component filtering)
      if (onSearch) {
        onSearch(sanitizedQuery);
      }

      // If users are provided by parent, filter them locally
      if (users && users.length > 0) {
        const filtered = users
          .filter((u) => u.username.toLowerCase().includes(sanitizedQuery.toLowerCase()))
          // Remove duplicates by ID
          .filter((user, index, self) => self.findIndex((u) => u.id === user.id) === index)
          .slice(0, 8);

        setSuggestedUsers(filtered);
        setIsDropdownOpen(filtered.length > 0);
        return;
      }

      // Otherwise, fetch from API
      setIsLoading(true);
      try {
        const results = await searchUsers(sanitizedQuery);

        // Ensure results have all required properties and remove duplicates
        const formattedResults: SearchUser[] = results
          .map((user: any) => ({
            id: user.id,
            username: user.username,
            profilePicture: user.profilePicture || '/images/profile.png',
            wallet: user.wallet || '',
            earnedTokens: user.earnedTokens || 0,
            bio: user.bio,
            followers: user.followers || [],
            following: user.following || [],
          }))
          // Remove duplicates by ID
          .filter((user, index, self) => self.findIndex((u) => u.id === user.id) === index);

        setSuggestedUsers(formattedResults);
        setIsDropdownOpen(formattedResults.length > 0);
      } catch (error) {
        console.error('Error fetching search suggestions:', error);
        setSuggestedUsers([]);
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => clearTimeout(debounceTimeout);
  }, [searchQuery, onSearch, users]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleProfileRedirect = (selectedUser: SearchUser) => {
    if (!selectedUser.wallet) return;

    // Call onUserSelect callback if provided
    if (onUserSelect) {
      onUserSelect(selectedUser);
    } else {
      // Default behavior - navigate to profile
      if (user?.id === selectedUser.id) {
        router.push('/profile');
      } else {
        router.push(`/profile/${selectedUser.id}`);
      }
    }

    setSearchQuery('');
    setIsDropdownOpen(false);
  };

  return (
    <div className="relative w-full max-w-md" ref={searchRef}>
      <div className="relative">
        <input
          type="text"
          placeholder="Search by username"
          className="w-full p-3 bg-gray-800 text-white rounded-lg focus:outline-none"
          value={searchQuery}
          onChange={(e) => setSearchQuery(sanitizeInput(e.target.value))}
          onFocus={() => searchQuery.trim() !== '' && suggestedUsers.length > 0 && setIsDropdownOpen(true)}
        />

        {isLoading && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}
      </div>

      {isDropdownOpen && suggestedUsers.length > 0 && (
        <ul className="absolute top-full mt-2 w-full bg-gray-900 rounded-lg shadow-lg overflow-hidden z-50 max-h-80 overflow-y-auto">
          {suggestedUsers.map((suggestedUser) => (
            <li
              key={suggestedUser.id}
              onClick={() => handleProfileRedirect(suggestedUser)}
              className="flex items-center gap-4 p-3 hover:bg-gray-700 cursor-pointer transition-colors"
            >
              <ThematicImage className="rounded-full flex-shrink-0">
                <Image
                  src={suggestedUser.profilePicture || '/images/profile.png'}
                  alt="Profile"
                  width={96}
                  height={96}
                  className="w-10 h-10 object-cover rounded-full"
                />
              </ThematicImage>

              <span className="text-white font-medium truncate">{suggestedUser.username}</span>
            </li>
          ))}
        </ul>
      )}

      {isDropdownOpen && suggestedUsers.length === 0 && !isLoading && (
        <div className="absolute top-full mt-2 w-full bg-gray-900 rounded-lg shadow-lg p-3 text-gray-400 text-center z-50">
          No users found.
        </div>
      )}
    </div>
  );
};

export default SearchBox;
