// lib/utils/challengeUtils.ts
import axios from 'axios';
import { getDayOfYear, getWeekOfYear } from './dateUtils';

const DGRAPH_ENDPOINT = process.env.NEXT_PUBLIC_DGRAPH_ENDPOINT || '';

export interface AIChallenge {
  id: string;
  title: string;
  description: string;
  reward: number;
  frequency: string;
  isActive: boolean;
  createdAt?: string;
  day?: number;
  week?: number;
  month?: number;
  year?: number;
}

/**
 * Fetches the current AI challenge based on frequency (daily, weekly, monthly)
 */
/**
 * Debug function to check current date values
 */
export const debugCurrentDateValues = () => {
  const now = new Date();
  console.log('📅 Current date debug info:', {
    fullDate: now.toISOString(),
    year: now.getFullYear(),
    month: now.getMonth() + 1, // 1-12
    dayOfYear: getDayOfYear(now),
    weekOfYear: getWeekOfYear(now),
    localeDateString: now.toLocaleDateString(),
  });
};

export const getCurrentChallenge = async (frequency: 'daily' | 'weekly' | 'monthly'): Promise<AIChallenge | null> => {
  const now = new Date();
  const year = now.getFullYear();

  // Debug current date values
  debugCurrentDateValues();

  // Since we can't filter by year/month/day/week directly in the filter,
  // we'll fetch all challenges of the given frequency and filter in JavaScript
  const query = `
    query GetAIChallenges {
      queryAIChallenge(filter: { 
        and: [
          { frequency: { eq: "${frequency}" } },
          { isActive: true }
        ]
      }) {
        id
        title
        description
        reward
        frequency
        isActive
        createdAt
        day
        week
        month
        year
      }
    }
  `;

  try {
    console.log(`🔍 Fetching ${frequency} AI challenges...`);

    const response = await axios.post(DGRAPH_ENDPOINT, { query }, { headers: { 'Content-Type': 'application/json' } });

    if (response.data.errors) {
      console.error('Dgraph query error:', response.data.errors);
      return null;
    }

    const challenges = response.data.data?.queryAIChallenge || [];
    console.log(`📊 Found ${challenges.length} ${frequency} challenges`, challenges);

    // Now filter based on the current date
    let filteredChallenge = null;

    if (frequency === 'daily') {
      const dayOfYear = getDayOfYear(now);
      filteredChallenge = challenges.find((c: AIChallenge) => c.year === year && c.day === dayOfYear);

      // If no exact match, get the newest daily challenge for today
      if (!filteredChallenge && challenges.length > 0) {
        console.log(`⚠️ No daily challenge for day ${dayOfYear}, using newest daily challenge`);
        filteredChallenge = challenges
          .filter((c: AIChallenge) => c.year === year)
          .sort(
            (a: AIChallenge, b: AIChallenge) =>
              new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime(),
          )[0];
      }
    } else if (frequency === 'weekly') {
      const weekOfYear = getWeekOfYear(now);
      filteredChallenge = challenges.find((c: AIChallenge) => c.year === year && c.week === weekOfYear);

      // If no exact match, check if there's a challenge for week 24 (one week ahead)
      if (!filteredChallenge) {
        console.log(`⚠️ No weekly challenge for week ${weekOfYear}, checking week ${weekOfYear + 1}`);
        filteredChallenge = challenges.find((c: AIChallenge) => c.year === year && c.week === weekOfYear + 1);
      }

      // If still no match, get the newest weekly challenge
      if (!filteredChallenge && challenges.length > 0) {
        console.log(`⚠️ Using newest weekly challenge`);
        filteredChallenge = challenges
          .filter((c: AIChallenge) => c.year === year)
          .sort(
            (a: AIChallenge, b: AIChallenge) =>
              new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime(),
          )[0];
      }
    } else if (frequency === 'monthly') {
      const month = now.getMonth() + 1; // 1-12
      filteredChallenge = challenges.find((c: AIChallenge) => c.year === year && c.month === month);

      // If no exact match, get the newest monthly challenge for this month
      if (!filteredChallenge && challenges.length > 0) {
        console.log(`⚠️ No monthly challenge for month ${month}, using newest monthly challenge`);
        filteredChallenge = challenges
          .filter((c: AIChallenge) => c.year === year)
          .sort(
            (a: AIChallenge, b: AIChallenge) =>
              new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime(),
          )[0];
      }
    }

    if (filteredChallenge) {
      console.log(`✅ Found ${frequency} challenge:`, filteredChallenge.title);
      return filteredChallenge;
    }

    console.log(`⚠️ No ${frequency} challenge found for current period`);
    console.log(
      `Searched for: year=${year}, ${
        frequency === 'daily'
          ? `day=${getDayOfYear(now)}`
          : frequency === 'weekly'
            ? `week=${getWeekOfYear(now)}`
            : `month=${now.getMonth() + 1}`
      }`,
    );

    return null;
  } catch (error) {
    console.error(`Error fetching ${frequency} challenge:`, error);
    if (axios.isAxiosError(error)) {
      console.error('Response data:', error.response?.data);
    }
    return null;
  }
};

/**
 * Get challenge reward based on the challenge data or use default
 */
export const getChallengeReward = (challenge: AIChallenge | null, frequency: string): number => {
  // If we have a challenge with a reward, use it
  if (challenge?.reward) {
    return challenge.reward;
  }

  // Otherwise use defaults based on frequency
  switch (frequency) {
    case 'daily':
      return 25;
    case 'weekly':
      return 100;
    case 'monthly':
      return 500;
    default:
      return 25;
  }
};

/**
 * Get a fallback challenge when none is found in the database
 */
export const getFallbackChallenge = (frequency: 'daily' | 'weekly' | 'monthly'): AIChallenge => {
  const fallbackChallenges = {
    daily: {
      id: 'fallback-daily',
      title: 'Daily Challenge',
      description: "Complete today's challenge to earn rewards!",
      reward: 25,
      frequency: 'daily',
      isActive: false, // Mark as inactive to show offline state
    },
    weekly: {
      id: 'fallback-weekly',
      title: 'Weekly Challenge',
      description: "Complete this week's challenge for bonus rewards!",
      reward: 100,
      frequency: 'weekly',
      isActive: false,
    },
    monthly: {
      id: 'fallback-monthly',
      title: 'Monthly Challenge',
      description: "Complete this month's epic challenge!",
      reward: 500,
      frequency: 'monthly',
      isActive: false,
    },
  };

  return fallbackChallenges[frequency];
};

/**
 * Fetch all active AI challenges (for admin/debug purposes)
 */
export const fetchAllAIChallenges = async (): Promise<AIChallenge[]> => {
  const query = `
    query GetAllAIChallenges {
      queryAIChallenge(filter: { isActive: true }) {
        id
        title
        description
        reward
        frequency
        isActive
        createdAt
        day
        week
        month
        year
      }
    }
  `;

  try {
    const response = await axios.post(DGRAPH_ENDPOINT, { query }, { headers: { 'Content-Type': 'application/json' } });

    if (response.data.errors) {
      console.error('Dgraph query error:', response.data.errors);
      return [];
    }

    const challenges = response.data.data?.queryAIChallenge || [];

    // Log detailed info about each challenge
    console.log('📋 All AI Challenges with date info:');
    challenges.forEach((c: AIChallenge) => {
      console.log(`- ${c.title} (${c.frequency}): year=${c.year}, month=${c.month}, week=${c.week}, day=${c.day}`);
    });

    return challenges;
  } catch (error) {
    console.error('Error fetching all AI challenges:', error);
    return [];
  }
};
