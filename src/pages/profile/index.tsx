import React, { useState, useEffect, useRef } from 'react';
import { updateBio, updateProfilePicture, fetchUserFollowers } from '../../lib/api/dgraph';
import { unpinFromPinata } from '../../lib/api/pinata';
import Image from 'next/image';
import type { StaticImageData } from 'next/image';
import imageCompression from 'browser-image-compression';
import { useAuth } from '../../contexts/AuthContext';

import PrimaryButton from '../../components/ui/PrimaryButton';
import ThematicImage from '../../components/ui/ThematicImage';
import ChallengeIndicator from './components/ChallengeIndicator';
import ThematicText from '../../components/ui/ThematicText';
import ThematicIcon from '../../components/ui/ThematicIcon';
import FollowersPopup from './components/FollowersPopup';

import FollowersIcon from '../../components/icons/followers';

const defaultProfilePic = '/images/profile.png';
const nocenix = '/nocenix.ico';

const ProfileView: React.FC = () => {
  const DEFAULT_PROFILE_PIC = '/images/profile.png';

  const { user, login } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const [profilePic, setProfilePic] = useState<string | StaticImageData>(user?.profilePicture || defaultProfilePic);
  const [username, setUsername] = useState<string>(user?.username || 'Guest');
  const [bio, setBio] = useState<string>(user?.bio || 'This is your bio. Click to edit it.');
  const [isEditingBio, setIsEditingBio] = useState<boolean>(false);
  const [tokenBalance, setTokenBalance] = useState<number>(user?.earnedTokens || 0);
  const [followersCount, setFollowersCount] = useState<number>(0);
  const [followers, setFollowers] = useState<string[]>([]);
  const [showFollowersPopup, setShowFollowersPopup] = useState<boolean>(false);
  const [dailyChallenges, setDailyChallenges] = useState<boolean[]>(
    user?.dailyChallenge.split('').map((char) => char === '1') || []
  );
  const [weeklyChallenges, setWeeklyChallenges] = useState<boolean[]>(
    user?.weeklyChallenge.split('').map((char) => char === '1') || []
  );
  const [monthlyChallenges, setMonthlyChallenges] = useState<boolean[]>(
    user?.monthlyChallenge.split('').map((char) => char === '1') || []
  );

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  useEffect(() => {
    if (user?.id) {
      // Update the followers fetching to get the actual follower IDs
      const getFollowers = async () => {
        try {
          const followers = await fetchUserFollowers(user.id);
          if (Array.isArray(followers)) {
            setFollowers(followers);
            setFollowersCount(followers.length);
          } else if (typeof followers === 'number') {
            setFollowersCount(followers);
          }
        } catch (error) {
          console.error('Error fetching followers:', error);
        }
      };
      
      getFollowers();
    }
  }, [user?.id]);

  useEffect(() => {
    if (scrollContainerRef.current) {
      const currentMonthIndex = new Date().getMonth();
      const elementWidth = scrollContainerRef.current.scrollWidth / 12;
      scrollContainerRef.current.scrollLeft =
        elementWidth * currentMonthIndex -
        scrollContainerRef.current.clientWidth / 2 +
        elementWidth / 2;
    }
  }, []);

  const handleProfilePicClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleProfilePicUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && user) {
      try {
        // **Compression settings**
        const options = {
          maxSizeMB: 0.5, // Target max file size: 500KB
          maxWidthOrHeight: 512, // Resize to max 512px
          useWebWorker: true,
          fileType: 'image/webp' // Convert to WebP for better compression
        };
  
        // **Compress image before uploading**
        const compressedFile = await imageCompression(file, options);
        console.log(`Original size: ${file.size / 1024} KB`);
        console.log(`Compressed size: ${compressedFile.size / 1024} KB`);
  
        // Convert compressed file to Base64
        const reader = new FileReader();
        reader.onloadend = async () => {
          try {
            const base64String = (reader.result as string).replace(/^data:.+;base64,/, '');
  
            // Check if user has an existing profile picture that's not the default
            if (user.profilePicture && 
                user.profilePicture !== DEFAULT_PROFILE_PIC && 
                !user.profilePicture.includes('/images/profile.png')) {
              // Extract CID from the URL - handle both full URLs and CIDs
              const oldCid = user.profilePicture.includes('/')
                ? user.profilePicture.split('/').pop()
                : user.profilePicture;
                
              if (oldCid) {
                await unpinFromPinata(oldCid).catch((error) => {
                  console.warn('Failed to unpin old profile picture:', error);
                });
              }
            }
  
            // Upload the compressed image
            const response = await fetch('/api/pinFileToIPFS', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                file: base64String,
                fileName: `profile-${user.id}-${Date.now()}.webp`, // Add user ID and timestamp for uniqueness
              }),
            });
  
            if (!response.ok) {
              throw new Error(`Upload failed: ${response.status} - ${await response.text()}`);
            }
  
            const { url } = await response.json();
            
            // Log the URL to see what's being returned
            console.log('Received URL from upload:', url);
            
            // Update state with the new URL
            setProfilePic(url);
  
            // Update user in database
            await updateProfilePicture(user.id, url);
  
            // Update local user state
            const updatedUser = { ...user, profilePicture: url };
            login(updatedUser);
            localStorage.setItem('user', JSON.stringify(updatedUser));
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
      console.log('Bio successfully updated.');
      setIsEditingBio(false);
    } catch (error) {
      console.error('Failed to update bio:', error);
      alert('Failed to update your bio. Please try again later.');
    }
  };

  const handleCancelEdit = () => {
    setBio(user?.bio || 'This is your bio. Click to edit it.');
    setIsEditingBio(false);
  };

  const handleFollowersClick = () => {
    setShowFollowersPopup(true);
  };

  return (
    <div className="flex flex-col items-center text-white relative min-h-screen overflow-hidden">
      <div className="absolute inset-0">
        <div className="absolute -top-50 right-0 transform translate-x-1/4 w-[400px] h-[400px] bg-primary-blue rounded-full opacity-10 blur-lg"></div>
        <div className="absolute -bottom-40 left-0 transform -translate-x-1/3 w-[500px] h-[500px] bg-primary-pink rounded-full opacity-10 blur-lg"></div>
      </div>

      <div className="relative z-10 flex items-center justify-between w-full max-w-xs my-8">
        <div
          className="flex flex-col items-center cursor-pointer hover:opacity-80 transition-opacity"
          onClick={handleFollowersClick}
        >
          <FollowersIcon className="w-8 h-8 mb-1" />
          <span>{followersCount}</span>
        </div>

        <div onClick={handleProfilePicClick}>
          <ThematicImage className="relative z-10">
            <Image
              src={profilePic}
              alt="Profile"
              width={96}
              height={96}
              className="w-24 h-24 object-cover rounded-full cursor-pointer"
            />
          </ThematicImage>
        </div>

        <input
          type="file"
          accept=".jpg,.jpeg,.png,.webp,.heif,.hevc"
          ref={fileInputRef}
          style={{ display: 'none' }}
          onChange={handleProfilePicUpload}
        />

        <div className="flex flex-col items-center">
          <Image
            src={nocenix}
            alt="Nocenix Token"
            width={40}
            height={40}
            className="w-10 h-10 mb-1"
          />
          <span>{tokenBalance}</span>
        </div>
      </div>

      <ThematicText text={username} isActive={true} className="capitalize relative z-10" />

      <div
        className={`relative z-10 px-4 text-center text-sm bg-black/40 rounded-md py-2 w-full max-w-xs mt-16 ${
          isEditingBio ? 'border border-white' : ''
        }`}
      >
        <div className="flex justify-between items-center">
          {isEditingBio ? (
            <>
              <textarea
                className="w-full p-2 bg-transparent text-white rounded"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
              />
              <div onClick={handleSaveBioClick} className="ml-4 cursor-pointer">
                <ThematicIcon iconName="save" isActive={false} />
              </div>
              <div onClick={handleCancelEdit} className="ml-4 cursor-pointer">
                <ThematicIcon iconName="pen" isActive={true} />
              </div>
            </>
          ) : (
            <>
              <p>{bio}</p>
              <div onClick={handleEditBioClick} className="cursor-pointer">
                <ThematicIcon iconName="pen" isActive={false} />
              </div>
            </>
          )}
        </div>
      </div>

      <div className="relative z-20 mt-10 text-center w-full">
        <h3 className="text-lg font-semibold">Timed challenge counter</h3>
        <div className="relative z-20 flex overflow-x-auto no-scrollbar w-full px-4" ref={scrollContainerRef} style={{ paddingBottom: '30px' }}>
          {monthNames.map((month, index) => (
            <div
              key={index}
              className={`w-[200px] flex-shrink-0 flex flex-col items-center justify-center`}
            >
              <div className={`w-24 h-24 rounded-full flex items-center justify-center mt-8 ${index === new Date().getMonth() ? 'bg-primary' : ''}`}>
                <ChallengeIndicator
                  dailyChallenges={dailyChallenges}
                  weeklyChallenges={weeklyChallenges}
                  monthlyChallenge={monthlyChallenges}
                  month={index}
                />
              </div>
              <span className="text-sm mt-4">{month}</span>
            </div>
          ))}
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