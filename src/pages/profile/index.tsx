import React, { useState, useEffect, useRef, useMemo } from 'react';
import { updateBio, updateProfilePicture, updateCoverPhoto } from '../../lib/api/dgraph';
import Image from 'next/image';
import type { StaticImageData } from 'next/image';
// Temporarily disable image compression until CSP is fixed
// import imageCompression from 'browser-image-compression';
import { useAuth } from '../../contexts/AuthContext';
import { getPageState, updatePageState } from '../../components/PageManager';

import ThematicContainer from '../../components/ui/ThematicContainer';
import FollowersPopup from './components/FollowersPopup';
import TrailerSection from './components/TrailerSection';
import StatsSection from './components/StatsSection';
import CalendarSection from './components/CalendarSection';

import PenIcon from '../../components/icons/pen';

// Custom hooks
import useFollowersData from '../../hooks/useFollowersData';

const defaultProfilePic = '/images/profile.png';
const nocenix = '/nocenix.ico';

// FilCDN Upload Interface
interface UploadResult {
  fileName: string;
  fileSize: number;
  commp: string;
  debugInfo?: {
    tempDir: string;
    finalHash: string;
  };
}

const ProfileView: React.FC = () => {
  const DEFAULT_PROFILE_PIC = '/images/profile.png';
  const { user, login } = useAuth();
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

  // Upload states
  const [isUploadingProfile, setIsUploadingProfile] = useState<boolean>(false);
  const [isUploadingCover, setIsUploadingCover] = useState<boolean>(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

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

  // FilCDN URL construction
  const getFileCDNUrl = (commp: string) => {
    const walletAddress = process.env.NEXT_PUBLIC_FILECOIN_WALLET || '0x48Cd52D541A2d130545f3930F5330Ef31cD22B95';
    return `https://${walletAddress}.calibration.filcdn.io/${commp}`;
  };

  // FilCDN Upload Function using your existing chunked upload API
  const uploadToFileCDN = async (file: File, fileType: 'profile' | 'cover'): Promise<UploadResult> => {
    console.log(`🚀 Starting FilCDN upload for ${fileType}:`, file.name, `(${(file.size / 1024 / 1024).toFixed(2)}MB)`);

    const sessionId = `${fileType}-${user?.id}-${Date.now()}`;
    const chunkSize = 2 * 1024 * 1024; // 2MB chunks
    const totalChunks = Math.ceil(file.size / chunkSize);

    console.log(`📦 Upload plan: ${totalChunks} chunks of ${chunkSize} bytes each`);

    // Upload chunks sequentially
    for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
      const start = chunkIndex * chunkSize;
      const end = Math.min(start + chunkSize, file.size);
      const chunk = file.slice(start, end);

      console.log(`📤 Uploading chunk ${chunkIndex + 1}/${totalChunks} (${chunk.size} bytes)`);

      const formData = new FormData();
      formData.append('chunk', chunk);
      formData.append('sessionId', sessionId);
      formData.append('chunkIndex', chunkIndex.toString());
      formData.append('totalChunks', totalChunks.toString());
      formData.append('fileName', `${fileType}-${user?.id}-${Date.now()}.${file.name.split('.').pop()}`);
      formData.append('totalSize', file.size.toString());

      const response = await fetch('/api/filcdn/chunked-upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Chunk ${chunkIndex} upload failed: ${response.status} - ${errorText}`);
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || `Chunk ${chunkIndex} upload failed`);
      }

      console.log(`✅ Chunk ${chunkIndex + 1}/${totalChunks} uploaded successfully`);

      // If this was the last chunk, we should get the final result
      if (result.complete) {
        console.log('🎉 Upload completed!', result.data);
        return {
          fileName: result.data.fileName,
          fileSize: result.data.fileSize,
          commp: result.data.commp,
          debugInfo: result.data.debugInfo,
        };
      }
    }

    throw new Error('Upload completed but no final result received');
  };

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
    }
  }, [user]);

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

  // Image upload handlers
  const handleProfilePicClick = () => {
    if (fileInputRef.current && !isUploadingProfile) {
      fileInputRef.current.click();
    }
  };

  const handleCoverPhotoClick = () => {
    if (coverInputRef.current && !isUploadingCover) {
      coverInputRef.current.click();
    }
  };

  const handleProfilePicUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && user) {
      setIsUploadingProfile(true);
      setUploadError(null);

      try {
        // Validate file type
        if (!file.type.startsWith('image/')) {
          throw new Error('Please select a valid image file.');
        }

        // Check file size (max 5MB for profile picture)
        if (file.size > 5 * 1024 * 1024) {
          throw new Error('Image file must be smaller than 5MB.');
        }

        console.log(`Profile image selected: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)}MB)`);

        // Upload to FilCDN using chunked upload
        console.log('🚀 Starting FilCDN upload...');
        const uploadResult = await uploadToFileCDN(file, 'profile');
        console.log('✅ FilCDN upload completed:', uploadResult);

        // Construct FilCDN URL
        const fileCDNUrl = getFileCDNUrl(uploadResult.commp);
        console.log('🔗 FilCDN URL:', fileCDNUrl);

        // Update local state immediately
        setProfilePic(fileCDNUrl);

        // Update in database
        await updateProfilePicture(user.id, fileCDNUrl);

        // Update user state
        const updatedUser = { ...user, profilePicture: fileCDNUrl };
        login(updatedUser);
        localStorage.setItem('user', JSON.stringify(updatedUser));

        // Update page cache
        const profileCacheKey = `profile_${user.id}`;
        updatePageState(profileCacheKey, {
          ...(getPageState()[profileCacheKey]?.data || {}),
          profilePicture: fileCDNUrl,
        });

        console.log('🎉 Profile picture successfully uploaded to FilCDN and saved!');
      } catch (error) {
        console.error('❌ Profile picture upload error:', error);
        setUploadError(error instanceof Error ? error.message : 'Failed to upload profile picture');
      } finally {
        setIsUploadingProfile(false);
        // Reset file input
        if (event.target) {
          event.target.value = '';
        }
      }
    }
  };

  const handleCoverPhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && user) {
      setIsUploadingCover(true);
      setUploadError(null);

      try {
        // Validate file type
        if (!file.type.startsWith('image/')) {
          throw new Error('Please select a valid image file.');
        }

        // Check file size (max 10MB for cover photo)
        if (file.size > 10 * 1024 * 1024) {
          throw new Error('Image file must be smaller than 10MB.');
        }

        console.log(`Cover photo selected: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)}MB)`);

        // Upload to FilCDN using chunked upload
        console.log('🚀 Starting FilCDN upload...');
        const uploadResult = await uploadToFileCDN(file, 'cover');
        console.log('✅ FilCDN upload completed:', uploadResult);

        // Construct FilCDN URL
        const fileCDNUrl = getFileCDNUrl(uploadResult.commp);
        console.log('🔗 FilCDN URL:', fileCDNUrl);

        // Update local state immediately
        setCoverPhoto(fileCDNUrl);

        // Update in database
        await updateCoverPhoto(user.id, fileCDNUrl);

        // Update user state
        const updatedUser = { ...user, coverPhoto: fileCDNUrl };
        login(updatedUser);
        localStorage.setItem('user', JSON.stringify(updatedUser));

        // Update page cache
        const profileCacheKey = `profile_${user.id}`;
        updatePageState(profileCacheKey, {
          ...(getPageState()[profileCacheKey]?.data || {}),
          coverPhoto: fileCDNUrl,
        });

        console.log('🎉 Cover photo successfully uploaded to FilCDN and saved!');
      } catch (error) {
        console.error('❌ Cover photo upload error:', error);
        setUploadError(error instanceof Error ? error.message : 'Failed to upload cover photo');
      } finally {
        setIsUploadingCover(false);
        // Reset file input
        if (event.target) {
          event.target.value = '';
        }
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
      <div className="min-h-screen">
        {/* Upload Error Display */}
        {uploadError && (
          <div className="fixed top-4 left-4 right-4 z-50 p-4 bg-red-600/90 backdrop-blur-sm text-white rounded-lg border border-red-400">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">❌ {uploadError}</span>
              <button
                onClick={() => setUploadError(null)}
                className="text-white/80 hover:text-white text-lg leading-none"
              >
                ×
              </button>
            </div>
          </div>
        )}

        {/* Cover Photo Section */}
        <div className="relative h-80 overflow-hidden">
          <div
            className="absolute inset-0"
            style={{
              WebkitMask: 'linear-gradient(to bottom, #101010 0%, #101010 60%, transparent 100%)',
              mask: 'linear-gradient(to bottom, #101010 0%, #101010 60%, transparent 100%)',
            }}
          >
            {coverPhoto !== '/images/cover.jpg' ? (
              <Image src={coverPhoto} alt="Cover" fill className="object-cover" />
            ) : (
              <Image src="/images/cover.jpg" alt="Cover" fill className="object-cover" />
            )}
          </div>

          <div
            className={`absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity ${
              isUploadingCover ? 'cursor-not-allowed' : 'cursor-pointer'
            }`}
            onClick={handleCoverPhotoClick}
          >
            <div className="text-white text-sm font-medium bg-black/50 px-4 py-2 rounded-lg backdrop-blur-sm">
              {isUploadingCover ? (
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>Uploading to FilCDN...</span>
                </div>
              ) : (
                'Change Cover Photo'
              )}
            </div>
          </div>

          <input
            type="file"
            accept=".jpg,.jpeg,.png,.webp"
            ref={coverInputRef}
            style={{ display: 'none' }}
            onChange={handleCoverPhotoUpload}
            disabled={isUploadingCover}
          />
        </div>

        {/* Profile Section */}
        <div className="px-4 pb-8">
          {/* Profile Picture & Stats */}
          <div className="relative -mt-24 mb-4">
            <div className="flex items-end justify-between">
              {/* Profile Picture */}
              <div
                onClick={handleProfilePicClick}
                className={`relative group ${isUploadingProfile ? 'cursor-not-allowed' : 'cursor-pointer'}`}
              >
                <div className="w-32 h-32 rounded-full bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500 p-1">
                  <div className="w-full h-full bg-slate-900/80 backdrop-blur-sm rounded-full p-1 relative">
                    <Image
                      src={profilePic}
                      alt="Profile"
                      width={120}
                      height={120}
                      className="w-full h-full object-cover rounded-full group-hover:scale-105 transition-transform"
                    />
                    {isUploadingProfile && (
                      <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center">
                        <div className="flex flex-col items-center space-y-2">
                          <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                          <span className="text-xs text-white font-medium">Uploading...</span>
                        </div>
                      </div>
                    )}
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
              disabled={isUploadingProfile}
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
          <div className="mb-6 flex space-x-3 w-full">
            {[
              { key: 'trailer', label: 'Trailer' },
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
                className="flex-1 min-w-0 px-2 py-1"
              >
                <span className="text-sm font-medium whitespace-nowrap text-center w-full">{label}</span>
              </ThematicContainer>
            ))}
          </div>

          {/* Content Based on Active Section */}
          <div className="space-y-4">
            {activeSection === 'trailer' && (
              <TrailerSection
                currentStreak={currentStreak}
                totalChallenges={totalChallenges}
                tokenBalance={tokenBalance}
              />
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
