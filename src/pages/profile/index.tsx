import React, { useState, useEffect, useRef, useMemo } from 'react';
import { updateBio, updateProfilePicture, updateCoverPhoto, getUserAvatar } from '../../lib/api/dgraph';
import { unpinFromPinata } from '../../lib/api/pinata';
import Image from 'next/image';
import type { StaticImageData } from 'next/image';
import imageCompression from 'browser-image-compression';
import { useAuth } from '../../contexts/AuthContext';
import { getPageState, updatePageState } from '../../components/PageManager';

import ThematicContainer from '../../components/ui/ThematicContainer';
import PrimaryButton from '../../components/ui/PrimaryButton';
import FollowersPopup from './components/FollowersPopup';
import AvatarSection from './components/AvatarSection'; // Changed from TrailerSection
import StatsSection from './components/StatsSection';
import CalendarSection from './components/CalendarSection';

import PenIcon from '../../components/icons/pen';

// Custom hooks
import useFollowersData from '../../hooks/useFollowersData';

const defaultProfilePic = '/images/profile.png';
const nocenix = '/nocenix.ico';

const ProfileView: React.FC = () => {
  const DEFAULT_PROFILE_PIC = '/images/profile.png';
  const { user, login, updateUser } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  // Basic profile state
  const [profilePic, setProfilePic] = useState<string | StaticImageData>(user?.profilePicture || defaultProfilePic);
  const [coverPhoto, setCoverPhoto] = useState<string>(user?.coverPhoto || '/images/cover.jpg');
  const [username, setUsername] = useState<string>(user?.username || 'Guest');
  const [bio, setBio] = useState<string>(user?.bio || 'No bio yet');
  const [isEditingBio, setIsEditingBio] = useState<boolean>(false);
  const [tokenBalance, setTokenBalance] = useState<number>(user?.earnedTokens || 0);
  const [activeSection, setActiveSection] = useState<'trailer' | 'calendar' | 'achievements'>('trailer');

  // Avatar generation state - NEW
  const [generatedAvatar, setGeneratedAvatar] = useState<string | null>(user?.currentAvatar || null);

  // Challenge data
  const [dailyChallenges, setDailyChallenges] = useState<boolean[]>(
    user?.dailyChallenge.split('').map((char) => char === '1') || [],
  );
  const [weeklyChallenges, setWeeklyChallenges] = useState<boolean[]>(
    user?.weeklyChallenge.split('').map((char) => char === '1') || [],
  );
  const [monthlyChallenges, setMonthlyChallenges] = useState<boolean[]>(
    user?.monthlyChallenge.split('').map((char) => char === '1') || [],
  );

  // Use custom hook for followers data
  const { followersCount, followers, showFollowersPopup, setShowFollowersPopup, handleFollowersClick } =
    useFollowersData(user?.id);

  // Sync user data when user changes
  useEffect(() => {
    if (user) {
      setDailyChallenges(user.dailyChallenge.split('').map((char) => char === '1'));
      setWeeklyChallenges(user.weeklyChallenge.split('').map((char) => char === '1'));
      setMonthlyChallenges(user.monthlyChallenge.split('').map((char) => char === '1'));
      setTokenBalance(user.earnedTokens || 0);
      setProfilePic(user.profilePicture || defaultProfilePic);
      setCoverPhoto(user.coverPhoto || '/images/cover.jpg');
      setUsername(user.username);
      setBio(user.bio || 'Creator building the future of social challenges 🚀\nJoin me on this journey!');

      // NEW: Avatar data loading
      setGeneratedAvatar(user.currentAvatar || null);

      console.log('🎨 ProfileView: User avatar data loaded:', {
        currentAvatar: user.currentAvatar,
        baseAvatar: user.baseAvatar,
        equippedItems: {
          cap: user.equippedCap?.name || 'None',
          hoodie: user.equippedHoodie?.name || 'None',
          pants: user.equippedPants?.name || 'None',
          shoes: user.equippedShoes?.name || 'None',
        },
      });
    }
  }, [user]);

  // NEW: Load avatar data from database on component mount
  useEffect(() => {
    const loadUserAvatarData = async () => {
      if (user?.id) {
        try {
          const avatarData = await getUserAvatar(user.id);
          if (avatarData?.currentAvatar) {
            setGeneratedAvatar(avatarData.currentAvatar);
            console.log('🎨 Loaded avatar from database:', avatarData.currentAvatar);
          }
        } catch (error) {
          console.error('Error loading avatar data:', error);
        }
      }
    };

    loadUserAvatarData();
  }, [user?.id]);

  // Calculate stats for components
  const currentStreak = useMemo(() => {
    let streak = 0;
    for (let i = dailyChallenges.length - 1; i >= 0; i--) {
      if (dailyChallenges[i]) {
        streak++;
      } else {
        break;
      }
    }
    return streak;
  }, [dailyChallenges]);

  const totalChallenges = useMemo(() => {
    return (
      dailyChallenges.filter(Boolean).length +
      weeklyChallenges.filter(Boolean).length +
      monthlyChallenges.filter(Boolean).length
    );
  }, [dailyChallenges, weeklyChallenges, monthlyChallenges]);

  // NEW: Updated avatar handler
  const handleAvatarUpdated = (newAvatarUrl: string) => {
    console.log('🎉 Avatar updated in ProfileView:', newAvatarUrl);
    setGeneratedAvatar(newAvatarUrl);

    // Update user context
    if (user) {
      const updatedUser = { ...user, currentAvatar: newAvatarUrl };
      login(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
    }
  };

  // Image upload handlers
  const handleProfilePicClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleCoverPhotoClick = () => {
    if (coverInputRef.current) {
      coverInputRef.current.click();
    }
  };

  const handleProfilePicUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && user) {
      try {
        const options = {
          maxSizeMB: 0.5,
          maxWidthOrHeight: 512,
          useWebWorker: true,
          fileType: 'image/webp',
        };

        const compressedFile = await imageCompression(file, options);
        const reader = new FileReader();

        reader.onloadend = async () => {
          try {
            const base64String = (reader.result as string).replace(/^data:.+;base64,/, '');

            // Clean up old profile picture
            if (
              user.profilePicture &&
              user.profilePicture !== DEFAULT_PROFILE_PIC &&
              !user.profilePicture.includes('/images/profile.png')
            ) {
              const oldCid = user.profilePicture.includes('/')
                ? user.profilePicture.split('/').pop()
                : user.profilePicture;
              if (oldCid) {
                await unpinFromPinata(oldCid).catch((error) => {
                  console.warn('Failed to unpin old profile picture:', error);
                });
              }
            }

            // Upload new image with all required fields
            const response = await fetch('/api/pinFileToIPFS', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                file: base64String,
                fileName: `profile-${user.id}-${Date.now()}.webp`,
                fileType: 'image',
              }),
            });

            if (!response.ok) {
              const errorText = await response.text();
              throw new Error(`Upload failed: ${response.status} - ${errorText}`);
            }

            const { ipfsHash } = await response.json();
            const ipfsUrl = `https://gateway.pinata.cloud/ipfs/${ipfsHash}`;

            setProfilePic(ipfsUrl);
            await updateProfilePicture(user.id, ipfsUrl);

            // Update user state
            const updatedUser = { ...user, profilePicture: ipfsUrl };
            login(updatedUser);
            localStorage.setItem('user', JSON.stringify(updatedUser));

            const profileCacheKey = `profile_${user.id}`;
            updatePageState(profileCacheKey, {
              ...(getPageState()[profileCacheKey]?.data || {}),
              profilePicture: ipfsUrl,
            });

            console.log('Profile picture successfully updated.');
          } catch (error) {
            console.error('Upload error:', error);
            alert('Failed to update profile picture. Please try again.');
          }
        };

        reader.readAsDataURL(compressedFile);
      } catch (error) {
        console.error('Image compression failed:', error);
        alert('Image compression failed. Please try with a different image.');
      }
    }
  };

  const handleCoverPhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && user) {
      try {
        // Validate file type
        if (!file.type.startsWith('image/')) {
          alert('Please select a valid image file.');
          return;
        }

        // Check file size (max 10MB for cover photo)
        if (file.size > 10 * 1024 * 1024) {
          alert('Image file must be smaller than 10MB.');
          return;
        }

        const options = {
          maxSizeMB: 2,
          maxWidthOrHeight: 1920,
          useWebWorker: true,
          fileType: 'image/webp',
        };

        const compressedFile = await imageCompression(file, options);
        const reader = new FileReader();

        reader.onloadend = async () => {
          try {
            const base64String = (reader.result as string).replace(/^data:.+;base64,/, '');

            // Clean up old cover photo if it's not the default
            if (
              user.coverPhoto &&
              user.coverPhoto !== '/images/cover.jpg' &&
              !user.coverPhoto.includes('/images/cover.jpg')
            ) {
              const oldCid = user.coverPhoto.includes('/') ? user.coverPhoto.split('/').pop() : user.coverPhoto;
              if (oldCid) {
                await unpinFromPinata(oldCid).catch((error) => {
                  console.warn('Failed to unpin old cover photo:', error);
                });
              }
            }

            // Upload new cover photo to IPFS with all required fields
            const response = await fetch('/api/pinFileToIPFS', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                file: base64String,
                fileName: `cover-${user.id}-${Date.now()}.webp`,
                fileType: 'image',
              }),
            });

            if (!response.ok) {
              const errorText = await response.text();
              throw new Error(`Upload failed: ${response.status} - ${errorText}`);
            }

            const { ipfsHash } = await response.json();
            const ipfsUrl = `https://gateway.pinata.cloud/ipfs/${ipfsHash}`;

            setCoverPhoto(ipfsUrl);

            // Update in database
            await updateCoverPhoto(user.id, ipfsUrl);

            // Update user state
            const updatedUser = { ...user, coverPhoto: ipfsUrl };
            login(updatedUser);
            localStorage.setItem('user', JSON.stringify(updatedUser));

            // Update page cache
            const profileCacheKey = `profile_${user.id}`;
            updatePageState(profileCacheKey, {
              ...(getPageState()[profileCacheKey]?.data || {}),
              coverPhoto: ipfsUrl,
            });

            console.log('Cover photo successfully updated.');
          } catch (error) {
            console.error('Upload error:', error);
            alert('Failed to update cover photo. Please try again.');
          }
        };

        reader.readAsDataURL(compressedFile);
      } catch (error) {
        console.error('Image compression failed:', error);
        alert('Image compression failed. Please try with a different image.');
      }
    }
  };

  // Bio editing handlers
  const handleEditBioClick = () => setIsEditingBio(true);

  const handleSaveBioClick = async () => {
    if (!user || bio === user.bio) {
      setIsEditingBio(false);
      return;
    }

    try {
      await updateBio(user.id, bio);

      const updatedUser = { ...user, bio };
      login(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));

      const profileCacheKey = `profile_${user.id}`;
      updatePageState(profileCacheKey, {
        ...(getPageState()[profileCacheKey]?.data || {}),
        bio,
      });

      console.log('Bio successfully updated.');
      setIsEditingBio(false);
    } catch (error) {
      console.error('Failed to update bio:', error);
      alert('Failed to update your bio. Please try again later.');
    }
  };

  const handleCancelEdit = () => {
    setBio(user?.bio || 'Creator building the future of social challenges 🚀\nJoin me on this journey!');
    setIsEditingBio(false);
  };

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
      <div className="min-h-screen mb-20">
        {/* Cover Photo Section */}
        <div className="relative h-80 overflow-hidden">
          {coverPhoto !== '/images/cover.jpg' ? (
            <Image src={coverPhoto} alt="Cover" fill className="object-cover" />
          ) : (
            <Image src="/images/cover.jpg" alt="Cover" fill className="object-cover" />
          )}

          {/* Gradient overlay for smooth blending effect */}
          <div className="absolute inset-0 bg-gradient-to-b from-transparent from-40% via-transparent via-70% to-black/80" />

          <div
            className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity cursor-pointer"
            onClick={handleCoverPhotoClick}
          >
            <div className="text-white text-sm font-medium bg-black/50 px-4 py-2 rounded-lg backdrop-blur-sm">
              Change Cover Photo
            </div>
          </div>

          <input
            type="file"
            accept=".jpg,.jpeg,.png,.webp"
            ref={coverInputRef}
            style={{ display: 'none' }}
            onChange={handleCoverPhotoUpload}
          />
        </div>

        {/* Profile Section */}
        <div className="px-4 pb-8">
          {/* Profile Picture & Stats */}
          <div className="relative -mt-24 mb-4">
            <div className="flex items-end justify-between">
              {/* Profile Picture */}
              <div onClick={handleProfilePicClick} className="relative cursor-pointer group">
                <div className="w-32 h-32 rounded-full bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500 p-1">
                  <div className="w-full h-full bg-slate-900/80 backdrop-blur-sm rounded-full p-1">
                    <Image
                      src={profilePic}
                      alt="Profile"
                      width={120}
                      height={120}
                      className="w-full h-full object-cover rounded-full group-hover:scale-105 transition-transform"
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
                    <div className="text-2xl font-bold">{followersCount}</div>
                    <div className="text-sm text-white/60">Followers</div>
                  </div>
                  <div className="w-px h-8 bg-white/20"></div>
                  <div className="text-center">
                    <div className="flex items-center space-x-1">
                      <span className="text-2xl font-bold">{tokenBalance}</span>
                      <Image src={nocenix} alt="Nocenix" width={20} height={20} />
                    </div>
                    <div className="text-sm text-white/60">Nocenix</div>
                  </div>
                </div>
              </div>
            </div>

            <input
              type="file"
              accept=".jpg,.jpeg,.png,.webp,.heif,.hevc"
              ref={fileInputRef}
              style={{ display: 'none' }}
              onChange={handleProfilePicUpload}
            />
          </div>

          {/* Username */}
          <h1 className="text-2xl font-bold mb-4">{username}</h1>

          {/* Bio */}
          <div className="mb-6">
            {isEditingBio ? (
              <div className="space-y-3">
                <textarea
                  className="w-full p-4 bg-slate-800/40 backdrop-blur-md text-white rounded-xl border border-white/20 resize-none focus:outline-none focus:border-purple-400 transition-colors"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  rows={4}
                  placeholder="Tell others about yourself..."
                />
                <div className="flex space-x-3 justify-end">
                  <button
                    onClick={handleCancelEdit}
                    className="px-4 py-2 bg-slate-700/60 backdrop-blur-sm hover:bg-slate-600/60 rounded-lg transition-colors text-sm"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveBioClick}
                    className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:opacity-80 rounded-lg transition-all text-sm font-medium"
                  >
                    Save
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  {bio.split('\n').map((line, index) => (
                    <p key={index} className="text-white/80 leading-relaxed">
                      {line}
                    </p>
                  ))}
                </div>
                <button
                  onClick={handleEditBioClick}
                  className="ml-4 p-2 hover:bg-white/10 rounded-lg transition-colors flex-shrink-0"
                >
                  <PenIcon className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {/* Three Section Menu using ThematicContainer */}
          <div className="flex justify-center mb-6 space-x-4">
            {[
              { key: 'trailer', label: 'Avatar' }, // Changed label
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
                className="px-8 py-2"
              >
                {label}
              </ThematicContainer>
            ))}
          </div>

          {/* Content Based on Active Section */}
          <div className="space-y-4">
            {activeSection === 'trailer' && (
              <div className="space-y-4">
                <AvatarSection
                  profilePicture={profilePic}
                  generatedAvatar={generatedAvatar}
                  onAvatarUpdated={handleAvatarUpdated}
                  userID={user?.id}
                  enableAvatarFeature={true}
                />
              </div>
            )}

            {activeSection === 'calendar' && (
              <CalendarSection
                dailyChallenges={dailyChallenges}
                weeklyChallenges={weeklyChallenges}
                monthlyChallenges={monthlyChallenges}
              />
            )}

            {activeSection === 'achievements' && (
              <StatsSection
                currentStreak={currentStreak}
                tokenBalance={tokenBalance}
                dailyChallenges={dailyChallenges}
                weeklyChallenges={weeklyChallenges}
                monthlyChallenges={monthlyChallenges}
              />
            )}
          </div>
        </div>
      </div>

      {/* Followers Popup */}
      <FollowersPopup
        isOpen={showFollowersPopup}
        onClose={() => setShowFollowersPopup(false)}
        followers={followers}
        isFollowers={true}
      />
    </div>
  );
};

export default ProfileView;
