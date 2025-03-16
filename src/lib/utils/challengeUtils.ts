import { 
  Challenge, 
  dailyChallenges, 
  weeklyChallenges, 
  monthlyChallenges,
  ChallengeFrequency,
  ChallengeCategory
} from '../../data/challenges';

/**
 * Generates a deterministic but seemingly random ordering of daily challenges
 * that remains consistent for a given year but changes each year
 */
export function getOrderedDailyChallenges(year: number): Challenge[] {
  // Create a copy of the challenges to avoid modifying the original
  const challenges = [...dailyChallenges];
  
  // Use a seeded random number generator based on the year
  // This ensures the order is different each year but consistent within a year
  const seededShuffle = (array: Challenge[]): Challenge[] => {
    const shuffled = [...array];
    
    // Simple seed based on year
    let seed = year;
    
    for (let i = shuffled.length - 1; i > 0; i--) {
      // Generate a seeded random number
      seed = (seed * 9301 + 49297) % 233280;
      const rnd = seed / 233280;
      
      // Fisher-Yates shuffle
      const j = Math.floor(rnd * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    
    return shuffled;
  };
  
  return seededShuffle(challenges);
}

/**
 * Gets the current day, week, or month challenge
 */
export function getCurrentChallenge(type: 'daily' | 'weekly' | 'monthly'): Challenge {
  const now = new Date();
  const currentYear = now.getFullYear();
  
  // Map the string type to the enum
  const frequency = type === 'daily' 
    ? ChallengeFrequency.DAILY 
    : type === 'weekly' 
      ? ChallengeFrequency.WEEKLY 
      : ChallengeFrequency.MONTHLY;
  
  switch (type) {
    case 'daily': {
      // Get the day of the year (0-364)
      const start = new Date(currentYear, 0, 0);
      const diff = (now.getTime() - start.getTime());
      const oneDay = 1000 * 60 * 60 * 24;
      const dayOfYear = Math.floor(diff / oneDay) - 1;
      
      // Get the ordered challenges for the current year
      const orderedDailyChallenges = getOrderedDailyChallenges(currentYear);
      
      // Get the challenge for today (use modulo to cycle through if we have fewer than 365)
      return {
        ...orderedDailyChallenges[dayOfYear % orderedDailyChallenges.length],
        category: ChallengeCategory.AI,
        frequency: frequency
      };
    }
    
    case 'weekly': {
      // Get the current week number (0-51)
      const firstDayOfYear = new Date(currentYear, 0, 1);
      const pastDaysOfYear = (now.getTime() - firstDayOfYear.getTime());
      const oneWeek = 1000 * 60 * 60 * 24 * 7;
      const weekNumber = Math.floor(pastDaysOfYear / oneWeek);
      
      // Get the challenge for this week (use modulo to cycle through if we have fewer than 52)
      return {
        ...weeklyChallenges[weekNumber % weeklyChallenges.length],
        category: ChallengeCategory.AI,
        frequency: frequency
      };
    }
    
    case 'monthly': {
      // Get the current month (0-11)
      const monthIndex = now.getMonth();
      
      // Make sure we have a challenge for each month, or cycle through available ones
      return {
        ...monthlyChallenges[monthIndex % monthlyChallenges.length],
        category: ChallengeCategory.AI,
        frequency: frequency
      };
    }
    
    default:
      throw new Error(`Invalid challenge type: ${type}`);
  }
}

/**
 * Gets the token reward for completing a challenge
 */
export function getChallengeReward(type: 'daily' | 'weekly' | 'monthly'): number {
  switch (type) {
    case 'daily':
      return 1;
    case 'weekly':
      return 5;
    case 'monthly':
      return 25;
    default:
      return 0;
  }
}