import { NextApiRequest, NextApiResponse } from 'next';
import { completeChallengeWorkflow } from '../../lib/completing/challengeCompletionService';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { userId, userWalletAddress, challengeFrequency = 'daily' } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    // Mock completion data with empty blobs
    const mockCompletionData = {
      video: new Blob([''], { type: 'video/mp4' }),
      photo: new Blob([''], { type: 'image/jpeg' }),
      verificationResult: { verified: true, confidence: 0.95 },
      description: 'Test challenge completion - automated test',
      challenge: {
        title: 'Test Daily Challenge',
        description: 'This is a test challenge for API testing',
        reward: 100,
        type: 'AI' as const,
        frequency: challengeFrequency as 'daily' | 'weekly' | 'monthly',
        challengeId: 'test-challenge-' + Date.now(),
        creatorId: 'system',
      },
    };

    console.log('🧪 Testing challenge completion flow...');

    const result = await completeChallengeWorkflow(userId, mockCompletionData, undefined, undefined, userWalletAddress);

    console.log('✅ Test completed:', result);

    return res.status(200).json({
      success: true,
      result,
      message: 'Challenge completion test successful',
    });
  } catch (error) {
    console.error('❌ Test failed:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Test failed',
    });
  }
}
