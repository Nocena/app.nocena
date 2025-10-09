import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { userAddress, challengeFrequency } = req.body;

    if (!userAddress || !challengeFrequency) {
      return res.status(400).json({ error: 'Missing userAddress or challengeFrequency' });
    }

    // Call our existing mint API with test data
    const mintResponse = await fetch(`${req.headers.origin}/api/mint-challenge-reward`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userAddress,
        challengeFrequency,
        completionId: `test-${Date.now()}`, // Generate test completion ID
      }),
    });

    const mintResult = await mintResponse.json();

    return res.status(200).json({
      success: true,
      message: 'Test minting completed',
      mintResult,
    });
  } catch (error) {
    console.error('❌ Test mint failed:', error);
    return res.status(500).json({
      success: false,
      error: 'Test minting failed',
    });
  }
}
