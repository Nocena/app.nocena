import React, { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/router';

import { getUserByIdFromDgraph } from '../../utils/api/dgraph';
import PrimaryButton from '../../components/ui/PrimaryButton';
import ThematicImage from '../../components/ui/ThematicImage';
import ChallengeIndicator from './ChallengeIndicator';
import ThematicText from '../../components/ui/ThematicText';

import FollowersIcon from '../../components/icons/followers';

const defaultProfilePic = '/profile.png';
const nocenix = '/nocenix.ico';

interface User {
  id: string;
  username: string;
  profilePicture: string;
  bio: string;
  earnedTokens: number;
  dailyChallenge: string;
  weeklyChallenge: string;
  monthlyChallenge: string;
  followers: string[];
}


const OtherProfileView: React.FC = () => {
  const router = useRouter();
  const { userID } = router.query;
  
  console.log("Received userID from router.query:", userID);

  if (!userID) {
    return <div className="text-white">Invalid user ID.</div>;
  }

  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  useEffect(() => {
    const fetchFullUserData = async () => {
      try {
        const fullUser = await getUserByIdFromDgraph(userID as string);
        if (fullUser) {
          setUser(fullUser as User);
        } else {
          setError(new Error('User not found'));
        }
      } catch (error) {
        console.error('Error fetching full user data:', error);
        setError(error instanceof Error ? error : new Error('An unknown error occurred'));
      } finally {
        setIsLoading(false);
      }
    };

    fetchFullUserData();
  }, [userID]);

  useEffect(() => {
    if (scrollContainerRef.current && user) {
      const currentMonthIndex = new Date().getMonth();
      const elementWidth = scrollContainerRef.current.scrollWidth / 12;
      scrollContainerRef.current.scrollLeft =
        elementWidth * currentMonthIndex -
        scrollContainerRef.current.clientWidth / 2 +
        elementWidth / 2;
    }
  }, [user]);

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen text-white">Loading...</div>;
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen text-white">
        Error loading profile: {error.message}
      </div>
    );
  }

  if (!user) {
    return <div className="flex items-center justify-center min-h-screen text-white">User not found.</div>;
  }

  return (
    <div className="flex flex-col items-center text-white relative min-h-screen overflow-hidden">
      <div className="absolute inset-0">
        <div className="absolute -top-50 right-0 transform translate-x-1/4 w-[400px] h-[400px] bg-primary-blue rounded-full opacity-10 blur-lg"></div>
        <div className="absolute -bottom-40 left-0 transform -translate-x-1/3 w-[500px] h-[500px] bg-primary-pink rounded-full opacity-10 blur-lg"></div>
      </div>

      <div className="relative z-10 flex items-center justify-between w-full max-w-xs my-8">
        <div className="flex flex-col items-center">
          <FollowersIcon className="w-8 h-8 mb-1" />
          <span>{user.followers.length}</span>
        </div>

        <ThematicImage className="relative z-10">
          <Image
            src={user.profilePicture || defaultProfilePic}
            alt="Profile"
            width={96}
            height={96}
            className="w-24 h-24 object-cover rounded-full"
          />
        </ThematicImage>

        <div className="flex flex-col items-center">
          <Image
            src={nocenix}
            alt="Nocenix Token"
            width={40}
            height={40}
            className="w-10 h-10 mb-1"
          />
          <span>{user.earnedTokens}</span>
        </div>
      </div>

      <ThematicText text={user.username} isActive={true} className="capitalize relative z-10" />

      <div className="relative z-10 mt-4">
        <PrimaryButton text="Challenge Me" onPressed={() => {}} className="px-6 py-2" disabled />
      </div>

      <div className="relative z-10 px-4 text-center text-sm bg-black/40 rounded-md py-2 w-full max-w-xs mt-4">
        <p>{user.bio || 'This user has no bio.'}</p>
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
                  dailyChallenges={user.dailyChallenge.split('').map((char) => char === '1')}
                  weeklyChallenges={user.weeklyChallenge.split('').map((char) => char === '1')}
                  monthlyChallenge={user.monthlyChallenge.split('').map((char) => char === '1')}
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

export default OtherProfileView;