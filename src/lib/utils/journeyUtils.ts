/**
 * Check if user has an existing journey (custom-journey challenges)
 * @param userId - User ID to check
 * @returns Promise<{hasJourney: boolean, challengeCount: number, nextChallenge?: any}>
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

    const query = `
      query CheckUserJourney($userId: String!) {
        # Get user's completed custom-journey challenges
        getUser(id: $userId) {
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
        
        # Get all available custom-journey challenges
        availableChallenges: queryAIChallenge(
          filter: { frequency: { eq: "custom-journey" }, isActive: true }
          order: { asc: createdAt }
        ) {
          id
          title
          description
          reward
          frequency
          isActive
          createdAt
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
      console.error('❌ Error checking journey status:', data.errors);
      return { hasJourney: false, challengeCount: 0 };
    }

    const completedChallenges = data.data.getUser?.completedChallenges || [];
    const availableChallenges = data.data.availableChallenges || [];

    const completedChallengeIds = new Set(
      completedChallenges.map((completion: any) => completion.aiChallenge?.id).filter(Boolean),
    );

    // Find the next uncompleted challenge
    const nextChallenge = availableChallenges.find((challenge: any) => !completedChallengeIds.has(challenge.id));

    const hasJourney = availableChallenges.length > 0;

    console.log('📊 Journey status result:', {
      hasJourney,
      totalChallenges: availableChallenges.length,
      completedCount: completedChallenges.length,
      nextChallenge: nextChallenge?.title || 'All completed!',
    });

    return {
      hasJourney,
      challengeCount: availableChallenges.length,
      nextChallenge,
      completedCount: completedChallenges.length,
    };
  } catch (error) {
    console.error('❌ Error checking journey status:', error);
    return { hasJourney: false, challengeCount: 0 };
  }
};

/**
 * Create initial journey for user
 * This is called after the VoiceAIChat journey creation is complete
 */
export const markJourneyAsCreated = async (userId: string): Promise<boolean> => {
  try {
    console.log('✅ Marking journey as created for user:', userId);

    // The journey creation is handled by the VoiceAIChat component
    // This function is mainly for any additional setup if needed

    // Could add user preference updates, analytics tracking, etc.

    return true;
  } catch (error) {
    console.error('❌ Error marking journey as created:', error);
    return false;
  }
};
