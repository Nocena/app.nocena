import { useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../../contexts/AuthContext';
import PrimaryButton from '../../components/ui/PrimaryButton';
import ThematicText from '../../components/ui/ThematicText';
import Image from 'next/image';
import { Challenge } from '../../data/challenges';
import { getCurrentChallenge, getChallengeReward } from '../../utils/challengeUtils';

type ChallengeType = 'daily' | 'weekly' | 'monthly';

const nocenixIcon = '/nocenix.ico';

const HomeView = () => {
  const router = useRouter();
  const { user } = useAuth();
  const [selectedTab, setSelectedTab] = useState<ChallengeType>('daily');

  // Get the current challenge for the selected tab
  const currentChallenge = getCurrentChallenge(selectedTab);
  
  // Get the reward for the current challenge type
  const reward = getChallengeReward(selectedTab);

  const handleCompleteChallenge = async (type: ChallengeType) => {
    if (!user) {
      alert('Please login to complete challenges!');
      router.push('/login');
      return;
    }
    
    try {
      // TODO: Add logic to mint tokens and update user's earnedTokens
      // This should interact with your Polygon smart contract
      // and update the Dgraph database
      
      router.push({
        pathname: '/completing',
        query: {
          type,
          title: currentChallenge.title,
          description: currentChallenge.description,
          reward
        }
      });
    } catch (error) {
      console.error('Error completing challenge:', error);
      alert('Failed to complete challenge. Please try again.');
    }
  };

  return (
    <div className="bg-[#0A141D] text-white p-4 min-h-screen">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-center mb-8 space-x-6">
          {(['daily', 'weekly', 'monthly'] as ChallengeType[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setSelectedTab(tab)}
              className="hover:opacity-75 transition-opacity"
            >
              <ThematicText 
                text={tab.charAt(0).toUpperCase() + tab.slice(1)}
                isActive={selectedTab === tab}
              />
            </button>
          ))}
        </div>

        <div className="bg-[#1A2734] rounded-xl p-8 shadow-xl">
          <h2 className="text-3xl font-bold mb-4 text-center">
            {currentChallenge.title}
          </h2>
          <p className="text-lg text-gray-300 mb-8 text-center">
            {currentChallenge.description}
          </p>

          <div className="flex flex-col items-center space-y-6">
            <PrimaryButton
              text="Complete Challenge"
              onClick={() => handleCompleteChallenge(selectedTab)}
            />

            <div className="flex items-center space-x-2 bg-[#2A3B4D] px-6 py-3 rounded-full">
              <Image 
                src={nocenixIcon} 
                alt="Nocenix" 
                width={32} 
                height={32}
                className="mr-2"
              />
              <span className="text-xl font-semibold">
                {reward} NOCENIX
              </span>
            </div>
          </div>
        </div>

        <div className="mt-8 text-center text-gray-400">
          <p>Powered by Polygon Testnet</p>
          {user && (
            <p className="mt-2">
              Your Wallet: {user.wallet.slice(0, 6)}...{user.wallet.slice(-4)}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default HomeView;