// lib/utils/journeyUtils.ts - Updated with targetUserId filtering

/**
 * Check if user has an existing journey (user-specific custom-journey challenges)
 * NOW PROPERLY FILTERS BY targetUserId
 */
export const checkUserJourneyStatus = async (
  userId: string,
): Promise<{
  hasJourney: boolean;
  challengeCount: number;
  nextChallenge?: any;
  completedCount?: number;
}> => {
  try {
    console.log('🔍 Checking journey status for user:', userId);

    const journeyQuery = `
      query CheckUserJourneyMetadata($userId: String!) {
        queryUser(filter: { id: { eq: $userId } }) {
          id
          # Get user's completed custom-journey challenges
          completedChallenges(filter: { 
            and: [
              { challengeType: { eq: "ai" } },
              { aiChallenge: { frequency: { eq: "custom-journey" } } }
            ]
          }) {
            id
            aiChallenge {
              id
              title
            }
          }
        }
        
        # Get user-specific challenges using targetUserId
        userSpecificChallenges: queryAIChallenge(
          filter: { 
            and: [
              { frequency: { eq: "custom-journey" } },
              { isActive: true },
              { targetUserId: { eq: $userId } }
            ]
          }
          order: { asc: createdAt }
        ) {
          id
          title
          description
          reward
          frequency
          isActive
          createdAt
          targetUserId
        }
      }
    `;

    const response = await fetch(process.env.NEXT_PUBLIC_DGRAPH_ENDPOINT!, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: journeyQuery, variables: { userId } }),
    });

    const data = await response.json();

    if (data.errors) {
      console.error('❌ Error checking journey status:', data.errors);
      return { hasJourney: false, challengeCount: 0 };
    }

    const userData = data.data.queryUser?.[0];
    const userSpecificChallenges = data.data.userSpecificChallenges || [];
    const completedChallenges = userData?.completedChallenges || [];

    const completedChallengeIds = new Set(
      completedChallenges.map((completion: any) => completion.aiChallenge?.id).filter(Boolean),
    );

    // Only use user-specific challenges now
    const hasJourney = userSpecificChallenges.length > 0;

    if (!hasJourney) {
      console.log('👋 No user-specific journey found');
      return { hasJourney: false, challengeCount: 0 };
    }

    // Find the next uncompleted challenge
    const nextChallenge = userSpecificChallenges.find((challenge: any) => !completedChallengeIds.has(challenge.id));

    console.log('📊 Journey status result:', {
      hasJourney,
      totalChallenges: userSpecificChallenges.length,
      completedCount: completedChallenges.length,
      nextChallenge: nextChallenge?.title || 'All completed!',
      userId,
    });

    return {
      hasJourney,
      challengeCount: userSpecificChallenges.length,
      nextChallenge,
      completedCount: completedChallenges.length,
    };
  } catch (error) {
    console.error('❌ Error checking journey status:', error);
    return { hasJourney: false, challengeCount: 0 };
  }
};

/**
 * Get user's next challenge - now properly filtered by targetUserId
 */
export const getUserNextChallenge = async (userId: string): Promise<any> => {
  try {
    const query = `
      query GetUserNextChallenge($userId: String!) {
        # Get user's completed challenge IDs first
        getUser(id: $userId) {
          completedChallenges(filter: { challengeType: { eq: "ai" } }) {
            aiChallenge {
              id
            }
          }
        }
        
        # Get user-specific journey challenges only
        queryAIChallenge(
          filter: { 
            and: [
              { frequency: { eq: "custom-journey" } }, 
              { isActive: true },
              { targetUserId: { eq: $userId } }
            ]
          }
          order: { asc: createdAt }
        ) {
          id
          title
          description
          reward
          frequency
          isActive
          createdAt
          targetUserId
        }
      }
    `;

    const response = await fetch(process.env.NEXT_PUBLIC_DGRAPH_ENDPOINT!, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, variables: { userId } }),
    });

    const data = await response.json();

    if (data.errors) {
      console.error('Error fetching user journey:', data.errors);
      return null;
    }

    const completedChallengeIds = new Set(
      data.data.getUser?.completedChallenges?.map((completion: any) => completion.aiChallenge?.id).filter(Boolean) ||
        [],
    );

    const userJourneyChallenges = data.data.queryAIChallenge || [];

    // Find the first challenge that hasn't been completed
    const nextChallenge = userJourneyChallenges.find((challenge: any) => !completedChallengeIds.has(challenge.id));

    console.log('Next challenge for user:', {
      userId,
      completedCount: completedChallengeIds.size,
      totalChallenges: userJourneyChallenges.length,
      nextChallenge: nextChallenge?.title || 'None',
    });

    return nextChallenge || null;
  } catch (error) {
    console.error('Error getting user next challenge:', error);
    return null;
  }
};
