import { NextApiRequest, NextApiResponse } from 'next';
import { completeChallengeWorkflow } from '../../lib/completing/challengeCompletionService';
import { CHALLENGE_REWARDS } from '../../lib/constants';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { userAddress, challengeFrequency, userId } = req.body;

    if (!userAddress || !challengeFrequency || !userId) {
      return res.status(400).json({ error: 'Missing required fields: userAddress, challengeFrequency, userId' });
    }

    // Create mock completion data that matches the real structure
    const mockCompletionData = {
      video: new Blob(['mock video'], { type: 'video/mp4' }),
      photo: new Blob(['mock photo'], { type: 'image/jpeg' }),
      verificationResult: { success: true, confidence: 0.95 },
      description: 'Test challenge completion',
      challenge: {
        title: `Test ${challengeFrequency} Challenge`,
        description: 'Mock challenge for testing blockchain minting',
        reward:
          challengeFrequency === 'daily'
            ? CHALLENGE_REWARDS.DAILY
            : challengeFrequency === 'weekly'
              ? CHALLENGE_REWARDS.WEEKLY
              : CHALLENGE_REWARDS.MONTHLY,
        type: 'AI' as const,
        frequency: challengeFrequency,
        challengeId: `test-${challengeFrequency}-${Date.now()}`,
        creatorId: 'test-creator',
      },
    };

    console.log('🧪 [TEST] Starting full challenge completion simulation...');

    // Call the actual challenge completion workflow
    const result = await completeChallengeWorkflow(
      userId,
      mockCompletionData,
      undefined, // updateAuthUser
      undefined, // existingNFTData
      userAddress, // userWalletAddress - this is the key parameter!
    );

    return res.status(200).json({
      success: true,
      message: 'Full challenge completion test completed',
      result,
    });
  } catch (error) {
    console.error('❌ [TEST] Full challenge completion test failed:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Test failed',
    });
  }
}
