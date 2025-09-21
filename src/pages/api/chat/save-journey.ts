// pages/api/chat/save-journey.ts - UPDATED TO CREATE USER-SPECIFIC CHALLENGES
import { NextApiRequest, NextApiResponse } from 'next';
import { createEnhancedAIChallenge } from '../../../lib/api/dgraph';

interface Challenge {
  title: string;
  description: string;
  difficulty: string;
  estimatedTime: string;
  category: string;
}

interface SaveJourneyRequest {
  challenges: Challenge[];
  pathType: string;
  goal?: string;
  userId: string; // This should come from auth context
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  console.log('🚀 Save Journey API called');

  try {
    const { challenges, pathType, goal, userId }: SaveJourneyRequest = req.body;

    if (!challenges || !Array.isArray(challenges) || challenges.length === 0) {
      return res.status(400).json({ error: 'Challenges array is required' });
    }

    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    console.log(`📝 Creating ${challenges.length} challenges for user ${userId}`);
    console.log(`🎯 Path type: ${pathType}`);
    if (goal) console.log(`🎯 Goal: ${goal}`);

    const savedChallenges: string[] = [];
    const failedChallenges: { index: number; error: string }[] = [];

    // Process each challenge
    for (let i = 0; i < challenges.length; i++) {
      const challenge = challenges[i];

      try {
        console.log(`📝 Saving challenge ${i + 1}/${challenges.length}: ${challenge.title}`);

        // Create user-specific description that includes the user ID for filtering
        // We'll embed it in a way that doesn't affect the user experience
        const userSpecificDescription = `${challenge.description}\n\n<!-- USER_ID: ${userId} -->`;

        // Map difficulty to reward points
        const getRewardForDifficulty = (difficulty: string): number => {
          switch (difficulty?.toLowerCase()) {
            case 'beginner':
              return 10;
            case 'intermediate':
              return 15;
            case 'advanced':
              return 20;
            default:
              return 10;
          }
        };

        const challengeData = {
          title: challenge.title,
          description: userSpecificDescription, // This includes the user ID marker
          reward: getRewardForDifficulty(challenge.difficulty),
          frequency: 'custom-journey',
          // Remove the extra fields that createEnhancedAIChallenge doesn't accept
        };

        const challengeId = await createEnhancedAIChallenge(challengeData);
        savedChallenges.push(challengeId);

        console.log(`✅ Challenge ${i + 1} saved successfully: ${challengeId}`);
      } catch (error) {
        console.error(`❌ Failed to save challenge ${i + 1}:`, error);
        failedChallenges.push({
          index: i,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    const successCount = savedChallenges.length;
    const failureCount = failedChallenges.length;

    console.log(`📊 Journey save results:`);
    console.log(`✅ Successful: ${successCount}/${challenges.length}`);
    console.log(`❌ Failed: ${failureCount}/${challenges.length}`);

    if (failureCount > 0) {
      console.warn('⚠️ Some challenges failed to save:', failedChallenges);
    }

    // Return success if at least some challenges were saved
    if (successCount > 0) {
      res.status(200).json({
        success: true,
        message: `Successfully saved ${successCount} out of ${challenges.length} challenges`,
        savedCount: successCount,
        failedCount: failureCount,
        savedChallengeIds: savedChallenges,
        failedChallenges: failureCount > 0 ? failedChallenges : undefined,
        journeyMetadata: {
          userId,
          pathType,
          goal,
          totalChallenges: successCount,
          createdAt: new Date().toISOString(),
        },
      });
    } else {
      // All challenges failed
      res.status(500).json({
        success: false,
        error: 'Failed to save any challenges',
        failedChallenges,
        totalFailed: failureCount,
      });
    }
  } catch (error) {
    console.error('❌ Error in save-journey API:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error while saving journey',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
