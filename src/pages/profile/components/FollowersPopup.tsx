import React, { useEffect, useState, useRef } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/router';

import Popup from '../../../components/Popup';
import ThematicImage from '../../../components/ui/ThematicImage';
import ThematicText from '../../../components/ui/ThematicText';
import PrimaryButton from '../../../components/ui/PrimaryButton';
import { useAuth } from '../../../contexts/AuthContext';
import { getUserByIdFromDgraph, toggleFollowUser } from '../../../lib/api/dgraph';
import LoadingSpinner from '../../../components/ui/LoadingSpinner';

const nocenixIcon = '/nocenix.ico';

export interface FollowerUser {
  id: string;
  username: string;
  profilePicture: string;
  earnedTokens: number;
  followers: string[];
  bio?: string;
}

interface FollowersPopupProps {
  isOpen: boolean;
  onClose: () => void;
  followers: string[];
  isFollowers?: boolean; // true for followers, false for following
}

const FollowersPopup: React.FC<FollowersPopupProps> = ({
  isOpen,
  onClose,
  followers,
  isFollowers = true
}) => {
  const [followerUsers, setFollowerUsers] = useState<FollowerUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pendingFollowActions, setPendingFollowActions] = useState<Set<string>>(new Set());
  const { user: currentUser } = useAuth();
  const router = useRouter();
  
  const contentRef = useRef<HTMLDivElement>(null);
  const touchStartY = useRef<number | null>(null);
  const touchMoveY = useRef<number | null>(null);

  // Setup touch handlers for swipe down to close
  useEffect(() => {
    const content = contentRef.current;
    if (!content) return;

    const handleTouchStart = (e: TouchEvent) => {
      // Only enable swipe to close when the content is scrolled to the top
      if (content.scrollTop <= 0) {
        touchStartY.current = e.touches[0].clientY;
      } else {
        touchStartY.current = null;
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (touchStartY.current === null) return;
      
      touchMoveY.current = e.touches[0].clientY;
      const deltaY = touchMoveY.current - touchStartY.current;
      
      // If swiping down
      if (deltaY > 0) {
        e.preventDefault(); // Prevent default scrolling
        content.style.transform = `translateY(${deltaY}px)`;
        content.style.transition = 'none';
      }
    };

    const handleTouchEnd = () => {
      if (touchStartY.current === null || touchMoveY.current === null) return;
      
      const deltaY = touchMoveY.current - touchStartY.current;
      
      // Reset styles
      content.style.transition = 'transform 0.3s ease-out';
      
      // If swiped down enough, close the popup
      if (deltaY > 100) {
        content.style.transform = 'translateY(100%)';
        // Use a local variable to capture onClose for the timeout
        const closePopup = onClose;
        setTimeout(() => closePopup(), 300); // Close after animation
      } else {
        content.style.transform = 'translateY(0)';
      }
      
      touchStartY.current = null;
      touchMoveY.current = null;
    };

    content.addEventListener('touchstart', handleTouchStart);
    content.addEventListener('touchmove', handleTouchMove, { passive: false });
    content.addEventListener('touchend', handleTouchEnd);

    return () => {
      content.removeEventListener('touchstart', handleTouchStart);
      content.removeEventListener('touchmove', handleTouchMove);
      content.removeEventListener('touchend', handleTouchEnd);
    };
  }, [onClose]);

  useEffect(() => {
    if (!isOpen || followers.length === 0) {
      setIsLoading(false);
      setFollowerUsers([]);
      return;
    }

    const fetchFollowers = async () => {
      setIsLoading(true);
      try {
        const userPromises = followers.map(id => getUserByIdFromDgraph(id));
        const users = await Promise.all(userPromises);
        // Filter out null values and type cast
        const validUsers = users.filter(user => user !== null) as FollowerUser[];
        setFollowerUsers(validUsers);
      } catch (error) {
        console.error('Error fetching followers:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchFollowers();
  }, [isOpen, followers]);

  const handleFollow = async (targetUserId: string) => {
    if (!currentUser || !currentUser.id || !targetUserId || currentUser.id === targetUserId) return;
    
    // Add to pending actions to prevent multiple clicks
    if (pendingFollowActions.has(targetUserId)) return;
    setPendingFollowActions(prev => new Set(prev).add(targetUserId));
    
    // Immediately update UI for better user experience
    setFollowerUsers((prevUsers) =>
      prevUsers.map((u) =>
        u.id === targetUserId
          ? {
              ...u,
              followers: u.followers.includes(currentUser.id)
                ? u.followers.filter((id) => id !== currentUser.id)
                : [...u.followers, currentUser.id],
            }
          : u
      )
    );
    
    try {
      // Make API call in the background
      const success = await toggleFollowUser(currentUser.id, targetUserId, currentUser.username);
      
      // If API call fails, revert the UI change
      if (!success) {
        setFollowerUsers((prevUsers) =>
          prevUsers.map((u) =>
            u.id === targetUserId
              ? {
                  ...u,
                  followers: u.followers.includes(currentUser.id)
                    ? u.followers.filter((id) => id !== currentUser.id)
                    : [...u.followers, currentUser.id],
                }
              : u
          )
        );
      }
    } catch (error) {
      console.error('Error toggling follow:', error);
      
      // Revert UI change on error
      setFollowerUsers((prevUsers) =>
        prevUsers.map((u) =>
          u.id === targetUserId
            ? {
                ...u,
                followers: u.followers.includes(currentUser.id)
                  ? u.followers.filter((id) => id !== currentUser.id)
                  : [...u.followers, currentUser.id],
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

  const handleProfileRedirect = (clickedUser: FollowerUser) => {
    if (currentUser?.id === clickedUser.id) {
      router.push(`/profile`);
    } else {
      router.push(`/profile/${clickedUser.id}`);
    }
    onClose();
  };

  return (
    <Popup isOpen={isOpen} onClose={onClose} title={isFollowers ? "Followers" : "Following"}>
      <div 
        ref={contentRef}
        className="p-2 overflow-y-auto"
        style={{ 
          height: 'calc(90vh - 4rem)',
          maxHeight: 'calc(90vh - 4rem)',
          WebkitOverflowScrolling: 'touch'
        }}
      >
        {isLoading ? (
          <div className="flex justify-center py-8">
            <LoadingSpinner />
          </div>
        ) : followerUsers.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            {isFollowers ? "No followers yet" : "Not following anyone yet"}
          </div>
        ) : (
          <div className="space-y-4">
            {followerUsers.map((userData) => {
              const isFollowing = userData.followers.includes(currentUser?.id || '');
              const isCurrentUser = userData.id === currentUser?.id;
              const isPending = pendingFollowActions.has(userData.id);

              return (
                <div
                  key={userData.id}
                  className="w-full bg-nocenaBg/80 p-3 rounded-lg flex flex-col cursor-pointer overflow-hidden"
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

                    {/* Follow Button - show for all users but disable for current user */}
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
                  
                  {/* Remove token display at bottom since we moved it up */}
                </div>
              );
            })}
          </div>
        )}
        
        {/* Pull down to close indicator */}
        <div className="text-center text-xs text-gray-500 mt-3 mb-1">
          Pull down to close
        </div>
      </div>
    </Popup>
  );
};

export default FollowersPopup;