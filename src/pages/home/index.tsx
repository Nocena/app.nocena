// src/views/HomeView.tsx
import { useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../../contexts/AuthContext';
import PrimaryButton from '../../components/ui/PrimaryButton';
import ThematicText from '../../components/ui/ThematicText';
import Image from 'next/image';

type Challenge = {
  title: string;
  description: string;
};

type ChallengeType = 'daily' | 'weekly' | 'monthly';

const nocenixIcon = '/nocenix.ico';

const HomeView = () => {
  const router = useRouter();
  const { user } = useAuth();
  const [selectedTab, setSelectedTab] = useState<ChallengeType>('daily');

  const dailyChallenges = [
    { title: 'Street Performer Duet', description: 'Find a street performer and join them for a song or dance.' },
    { title: 'Foodie Roulette', description: 'Close your eyes and point to a random dish on a menu at a new restaurant.' },
    { title: 'Urban Geocaching', description: 'Go on a geocaching treasure hunt around the city.' },
    { title: 'Secret Library', description: 'Create a mini library by leaving books in random spots with a “take one, leave one” note.' },
    { title: 'Dance in the Park', description: 'Have an impromptu dance session in a public park with music from your phone.' },
    { title: 'City Bingo', description: 'Create a bingo card with random city sights and compete to see who can find them first.' },
    { title: 'Flash Mob Prep', description: 'Organize a mini flash mob with friends or strangers you meet.' },
    { title: 'Art Gallery Sneak', description: 'Pose like the statues or art pieces in a gallery for funny photos.' },
    { title: 'Reverse Scavenger Hunt', description: 'Leave quirky items around the city and make clues for each other to find them.' },
    { title: 'Midnight Mystery Tour', description: 'Take a late-night walk and explore parts of the city you’ve never seen at night.' },
    { title: 'Dress-Up Day', description: 'Dress in a themed costume (superheroes, 80s, etc.) and explore the city.' },
    { title: 'Random Acts of Laughter', description: 'Do something silly in public to make strangers smile or laugh.' },
    { title: 'Urban Farming', description: 'Plant seeds in random places and leave notes to water them.' },
    { title: 'Fountain Frolic', description: 'Find a public fountain and splash around (if it’s allowed!).' },
    { title: 'Random Dance Party', description: 'Start a dance party in a busy public square.' },
    { title: 'Singalong Ride', description: 'Sing loudly together on a public transportation ride.' },
    { title: 'Surprise Picnic', description: 'Set up a surprise picnic for each other in a secret location.' },
    { title: 'Street Art Creation', description: 'Create your own piece of street art using chalk.' },
    { title: 'Photo Bombing', description: 'Sneak into tourist photos and create fun photobomb albums.' },
    { title: 'Mystery Meal Swap', description: 'Order meals for each other at a restaurant without revealing what it is.' },
    { title: 'Skyline Spotting', description: 'Find the tallest building you can and see how many landmarks you can spot from the top.' },
    { title: 'Improv Everywhere', description: 'Act out funny skits or pretend to be tour guides in popular areas.' },
    { title: 'Random High-Fives', description: 'Give high-fives to as many strangers as you can in an hour.' },
    { title: 'Stranger Selfies', description: 'Ask strangers to take selfies with you and compile a fun photo album.' },
    { title: 'Historical Reenactment', description: 'Dress up and act out a famous historical event from your city.' },
    { title: 'Busking Challenge', description: 'Pretend to be buskers and see who can make the most money in an hour.' },
    { title: 'Graffiti Wall', description: 'Find a legal graffiti wall and create art together.' },
    { title: 'Costume Swap', description: 'Wear each other\'s clothes for a day and see who gets recognized.' },
    { title: 'Night at the Museum', description: 'Attend a nighttime museum event or create your own mystery tour.' },
    { title: 'Urban Legend Hunt', description: 'Research and visit locations tied to local urban legends.' },
    { title: 'Bucket List Day', description: 'Each write a mini bucket list for the day and complete as many items as possible.' },
  ];

  const weeklyChallenges = [
    { title: 'Week 1: Ultimate Urban Adventure Race', description: 'Design an epic city-wide scavenger hunt with physical challenges, quirky tasks, and hidden clues. Race against each other or team up and see who can complete the course the fastest!', },
    { title: 'Week 2: Epic Costume Bar Crawl', description: 'Dress up in your wildest costumes and embark on a themed bar crawl. Each bar must match a theme (e.g., pirate bar, 80s bar, etc.), and you must complete a fun task or game at each stop.', },
    { title: 'Week 3: Mystery Destination Weekend', description: 'Each of you secretly plans a surprise weekend trip to a nearby town or city. Reveal the destination only when you’re ready to go, and spend the weekend exploring, trying new activities, and creating spontaneous adventures.', },
    { title: 'Week 4: City-Wide Talent Show', description: 'Host a pop-up talent show at various public spots in the city. Perform your unique talents (singing, dancing, magic tricks) and invite strangers to join in. Record the performances and see who can gather the biggest audience!', },
  ];

  const monthlyChallenges = [
    { title: 'January: Adventure Month', description: 'Complete a new adventure activity each week, such as hiking, biking, or exploring a new part of town.', },
    { title: 'February: Culture Month', description: 'Attend different cultural events and activities, like theater performances, museum visits, or local festivals.', },
    { title: 'March: Foodie Month', description: 'Try a new restaurant or food-related activity each week, such as cooking classes or food festivals.', },
    { title: 'April: Fitness Month', description: 'Participate in different fitness activities each week, like yoga classes, gym workouts, or sports games.', },
    { title: 'May: Charity Month', description: 'Volunteer for different charitable activities each week, such as food drives, community clean-ups, or fundraising events.', },
    { title: 'June: Learning Month', description: 'Engage in different learning activities each week, like taking a new course, reading books, or attending workshops.', },
    { title: 'Jully: DIY Month', description: 'Complete different DIY projects each week, such as home improvements, crafts, or upcycling old items.', },
    { title: 'August: Travel Month', description: 'Plan short trips or day outings to different places each week, like nearby towns, nature reserves, or tourist spots.', },
    { title: 'September: Relaxation Month', description: 'Focus on self-care and relaxation activities each week, such as spa days, meditation, or leisure activities.', },
    { title: 'October: Social Month', description: 'Organize different social activities each week, such as game nights, dinner parties, or group outings.', },
    { title: 'November: Creativity Month', description: 'Engage in different creative activities each week, like painting, writing, or music sessions.', },
    { title: 'December: Celebration Month', description: 'Celebrate different aspects of your life each week, reflecting on achievements, setting goals, and enjoying special moments with loved ones.', },
  ];

  const rewardMapping: Record<ChallengeType, number> = {
    daily: 1,
    weekly: 5,
    monthly: 25,
  };

  const getCurrentChallenge = (type: ChallengeType): Challenge => {
    const now = new Date();
    switch (type) {
      case 'daily':
        return dailyChallenges[now.getDate() - 1];
      case 'weekly':
        const weekNumber = Math.min(Math.ceil(now.getDate() / 7), 4);
        return weeklyChallenges[weekNumber - 1];
      case 'monthly':
        return monthlyChallenges[now.getMonth()];
      default:
        return dailyChallenges[0];
    }
  };

  const handleCompleteChallenge = async (type: ChallengeType) => {
    if (!user) {
      alert('Please login to complete challenges!');
      router.push('/login');
      return;
    }
    
    const challenge = getCurrentChallenge(type);
    
    try {
      // TODO: Add logic to mint tokens and update user's earnedTokens
      // This should interact with your Polygon smart contract
      // and update the Dgraph database
      
      router.push({
        pathname: '/completing',
        query: {
          type,
          title: challenge.title,
          description: challenge.description,
          reward: rewardMapping[type]
        }
      });
    } catch (error) {
      console.error('Error completing challenge:', error);
      alert('Failed to complete challenge. Please try again.');
    }
  };

  const currentChallenge = getCurrentChallenge(selectedTab);

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
                {rewardMapping[selectedTab]} NOCENIX
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