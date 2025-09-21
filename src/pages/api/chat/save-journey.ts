// pages/api/chat/save-journey.ts

import { NextApiRequest, NextApiResponse } from 'next';
import { createEnhancedAIChallenge } from '../../../lib/api/dgraph';

interface Challenge {
  title: string;
  description: string;
  difficulty?: string;
  estimatedTime?: string;
  category?: string;
  day: number;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { challenges, pathType, goal, userId } = req.body;

  if (!challenges || !Array.isArray(challenges)) {
    return res.status(400).json({ error: 'Challenges array is required' });
  }

  if (!pathType || !['winter-arc', 'daily-side-quest', 'custom-journey'].includes(pathType)) {
    return res.status(400).json({ error: 'Valid pathType is required (winter-arc, daily-side-quest, custom-journey)' });
  }

  if (!userId) {
    return res.status(400).json({ error: 'User ID is required' });
  }

  // For custom journey, goal is required
  if (pathType === 'custom-journey' && (!goal || typeof goal !== 'string')) {
    return res.status(400).json({ error: 'Goal is required for custom journey' });
  }

  try {
    const savedChallenges = [];
    const currentDate = new Date();
    const journeyId = `${pathType}-${userId}-${Date.now()}`;

    // Create appropriate description based on path type
    const getDescription = (challenge: Challenge) => {
      let baseDescription = challenge.description;

      // Add additional info for custom journey
      if (pathType === 'custom-journey') {
        baseDescription += `\n\nGoal: ${goal}`;
        if (challenge.difficulty) baseDescription += `\nDifficulty: ${challenge.difficulty}`;
        if (challenge.estimatedTime) baseDescription += `\nEstimated Time: ${challenge.estimatedTime}`;
        if (challenge.category) baseDescription += `\nCategory: ${challenge.category}`;
      }

      return baseDescription;
    };

    // Get appropriate reward based on path type and difficulty
    const getReward = (challenge: Challenge) => {
      const baseReward = 10;

      if (pathType === 'winter-arc') {
        return 15; // Higher rewards for discipline challenges
      } else if (pathType === 'daily-side-quest') {
        return 8; // Lower rewards for fun/social challenges
      } else {
        // Custom journey - vary by difficulty
        if (challenge.difficulty === 'Advanced') return 20;
        if (challenge.difficulty === 'Intermediate') return 15;
        return baseReward;
      }
    };

    // Save each challenge as an AIChallenge
    for (const challenge of challenges) {
      const challengeData = {
        title: challenge.title,
        description: getDescription(challenge),
        reward: getReward(challenge),
        frequency: pathType, // Use pathType as frequency identifier
        day: challenge.day,
        week: Math.ceil(challenge.day / 7),
        month: Math.ceil(challenge.day / 30),
        year: currentDate.getFullYear(),
        // Universal fields for all journey types
        journeyId: journeyId,
        targetUserId: userId,
        pathType: pathType,
        ...(goal && { originalGoal: goal }), // Only add goal for custom journey
      };

      try {
        const savedChallenge = await createEnhancedAIChallenge(challengeData);
        savedChallenges.push({ id: savedChallenge });
      } catch (challengeError) {
        console.error(`Failed to save challenge ${challenge.day}:`, challengeError);
        // Continue with other challenges even if one fails
      }
    }

    // Update user's current journey status
    // You might want to add a field to User schema to track active journey
    // This could be done with a separate API call to update user record

    const pathNames: { [key: string]: string } = {
      'winter-arc': 'Winter Arc 2K25',
      'daily-side-quest': 'Daily Side Quest',
      'custom-journey': 'Custom Journey',
    };

    res.status(200).json({
      success: true,
      message: `Successfully saved ${savedChallenges.length} ${pathNames[pathType]} challenges`,
      journeyId: journeyId,
      pathType: pathType,
      savedChallenges: savedChallenges.length,
      ...(goal && { goal }), // Only include goal in response if it exists
    });
  } catch (error) {
    console.error('Error saving journey challenges:', error);
    res.status(500).json({
      error: 'Failed to save journey',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

// Helper function you'll need to add to your dgraph.ts file:
/*
export const createOrUpdateAIChallenge = async (challengeData: any) => {
  const mutation = `
    mutation CreateAIChallenge($challenge: AddAIChallengeInput!) {
      addAIChallenge(input: [$challenge]) {
        aiChallenge {
          id
          title
          description
          frequency
          day
          isActive
          reward
        }
      }
    }
  `;

  const variables = {
    challenge: challengeData
  };

  try {
    const response = await executeDgraphMutation(mutation, variables);
    return response.addAIChallenge.aiChallenge[0];
  } catch (error) {
    console.error('Error creating AI challenge:', error);
    throw error;
  }
};
*/
