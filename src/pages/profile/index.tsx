import React, { useState, useEffect, useRef } from 'react';
import { updateBio, updateProfilePicture } from '../../utils/api/dgraph';
import { unpinFromPinata } from '../../utils/api/pinata';
import Image from 'next/image';
import type { StaticImageData } from 'next/image';

import PrimaryButton from '../../components/ui/PrimaryButton';
import ThematicImage from '../../components/ui/ThematicImage';
import ChallengeIndicator from '../../components/ui/ChallengeIndicator';
import ThematicText from '../../components/ui/ThematicText';
import ThematicIcon from '../../components/ui/ThematicIcon';

import FollowersIcon from '../../components/icons/followers';
import SaveIcon from '../../components/icons/save';

const defaultProfilePic = '/profile.png';
const nocenix = '/nocenix.ico';

const ProfileView: React.FC = () => {
  const [profilePic, setProfilePic] = useState<string | StaticImageData>(defaultProfilePic);
  const [username, setUsername] = useState<string>('Guest');
  const [bio, setBio] = useState<string>('This is your bio. Click to edit it.');
  const [isEditingBio, setIsEditingBio] = useState<boolean>(false);
  const [tokenBalance, setTokenBalance] = useState<number>(0);
  const [followersCount, setFollowersCount] = useState<number>(0);
  const [dailyChallenges, setDailyChallenges] = useState<boolean[]>([]);
  const [weeklyChallenges, setWeeklyChallenges] = useState<boolean[]>([]);
  const [monthlyChallenges, setMonthlyChallenges] = useState<boolean[]>([]);
  const [userId, setUserId] = useState<string | null>(null); // Ensure userId is part of state

  const fileInputRef = useRef<HTMLInputElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  useEffect(() => {
    // Load user data from localStorage
    const userData = localStorage.getItem('user');
    if (userData) {
      const parsedUser = JSON.parse(userData);

      // Update state with user data
      setUserId(parsedUser.id || null);
      setUsername(parsedUser.username || 'Guest');
      setProfilePic(parsedUser.profilePicture || defaultProfilePic);
      setBio(parsedUser.bio || 'This is your bio. Click to edit it.');
      setTokenBalance(parsedUser.earnedTokens || 0);
      setFollowersCount(parsedUser.followersCount || 0); // Replace with followers count if available

      // Convert daily, weekly, and monthly challenges from string to array
      setDailyChallenges(parsedUser.dailyChallenge.split('').map((char: string) => char === '1'));
      setWeeklyChallenges(parsedUser.weeklyChallenge.split('').map((char: string) => char === '1'));
      setMonthlyChallenges(parsedUser.monthlyChallenge.split('').map((char: string) => char === '1'));
    }
  }, []);

  useEffect(() => {
    // Center scroll to the current month
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

  const handleProfilePicUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
  
    if (file) {
      const reader = new FileReader();
  
      reader.onloadend = async () => {
        try {
          const base64String = (reader.result as string).replace(/^data:.+;base64,/, '');
  
          console.log('File read as base64:', base64String.substring(0, 100)); // Log part of the base64 string
  
          // Fetch the current user data from localStorage
          const userData = localStorage.getItem('user');
          if (!userData) {
            throw new Error('User data is missing in localStorage.');
          }
  
          const parsedUser = JSON.parse(userData);
  
          // If the user already has a profile picture (and it's not the default one), unpin the old picture
          if (parsedUser.profilePicture && parsedUser.profilePicture !== defaultProfilePic) {
            const oldCid = parsedUser.profilePicture.split('/').pop(); // Extract CID from the URL
            if (oldCid) {
              try {
                await unpinFromPinata(oldCid);
                console.log('Old profile picture unpinned from Pinata:', oldCid);
              } catch (error) {
                console.error('Failed to unpin old profile picture:', error);
                // Continue with the upload even if unpinning fails
              }
            }
          }
  
          // Upload the new profile picture to Pinata
          const response = await fetch('/api/upload-profile-picture', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              file: base64String,
              fileName: file.name,
            }),
          });
  
          if (!response.ok) {
            const errorText = await response.text();
            console.error('Upload failed:', errorText);
            throw new Error(`Upload failed: ${response.status}`);
          }
  
          const { url } = await response.json();
          setProfilePic(url);
  
          // Update profile picture in Dgraph
          await updateProfilePicture(parsedUser.id, url);
  
          // Update profile picture in localStorage
          parsedUser.profilePicture = url;
          localStorage.setItem('user', JSON.stringify(parsedUser));
          console.log('Profile picture successfully updated in localStorage and Dgraph.');
        } catch (error) {
          console.error('Upload error:', error);
        }
      };
  
      reader.readAsDataURL(file);
    }
  };
  
  
  const handleEditBioClick = () => setIsEditingBio(true);

  const handleSaveBioClick = async () => {
    // Fetch the current user data from localStorage
    const userData = localStorage.getItem('user');
    if (!userData) {
      console.error('User data is missing in localStorage.');
      return;
    }
  
    const parsedUser = JSON.parse(userData);
  
    // Check if the bio has changed
    if (bio === parsedUser.bio) {
      console.log('No changes made to the bio.');
      setIsEditingBio(false); // Exit editing mode
      return;
    }
  
    try {
      // Update bio in Dgraph
      await updateBio(parsedUser.id, bio);
  
      // Update bio in localStorage
      parsedUser.bio = bio; // Update the bio field
      localStorage.setItem('user', JSON.stringify(parsedUser));
      console.log('Bio successfully updated in localStorage and Dgraph.');
  
      setIsEditingBio(false); // Exit editing mode
    } catch (error) {
      console.error('Failed to update bio:', error);
      alert('Failed to update your bio. Please try again later.');
    }
  };

  const handleCancelEdit = () => {
    const userData = localStorage.getItem('user');
    if (userData) {
      const parsedUser = JSON.parse(userData);
      setBio(parsedUser.bio || 'This is your bio. Click to edit it.'); // Revert to the bio in localStorage
    }
    setIsEditingBio(false);
  };

  return (
    <div className="flex flex-col items-center text-white relative min-h-screen overflow-hidden">
      <div className="absolute inset-0">
        <div className="absolute -top-50 right-0 transform translate-x-1/4 w-[400px] h-[400px] bg-primary-blue rounded-full opacity-10 blur-lg"></div>
        <div className="absolute -bottom-40 left-0 transform -translate-x-1/3 w-[500px] h-[500px] bg-primary-pink rounded-full opacity-10 blur-lg"></div>
      </div>

      {/* Profile Picture and Stats Row */}
      <div className="relative z-10 flex items-center justify-between w-full max-w-xs my-8">
        {/* Followers Count */}
        <div className="flex flex-col items-center">
          <FollowersIcon className="w-8 h-8 mb-1" />
          <span>{followersCount}</span>
        </div>

        {/* Profile Picture */}
        <div onClick={handleProfilePicClick}>
          <ThematicImage className="relative z-10">
            <Image
              src={profilePic}
              alt="Profile"
              width={96}
              height={96}
              className="w-24 h-24 object-cover rounded-full border-4 border-gray-700 cursor-pointer"
            />
          </ThematicImage>
        </div>

        {/* Hidden File Input */}
        <input
          type="file"
          accept=".jpg,.jpeg,.png,.webp,.heif,.hevc"
          ref={fileInputRef}
          style={{ display: 'none' }}
          onChange={handleProfilePicUpload}
        />

        {/* Token Balance */}
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

      {/* Username */}
      <ThematicText text={username} isActive={true} className="capitalize relative z-10" />

      {/* Buttons */}
      <div className="relative z-10 flex items-center justify-center space-x-4 my-8">
        <PrimaryButton 
          text="Upcoming" 
          className="px-6 py-2" 
          onPressed={() => console.log('Upcoming clicked')} 
        />
      </div>

      {/* Bio */}
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

      {/* Timed Challenge Counter */}
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
    </div>
  );
};

export default ProfileView;
