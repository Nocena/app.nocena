import { NextApiRequest, NextApiResponse } from 'next';
import { mintReward, getRewardAmount } from '../../lib/kaia/tokenService';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { userAddress, challengeType } = req.body;

    if (!userAddress || !challengeType) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Validate address format
    if (!userAddress.match(/^0x[a-fA-F0-9]{40}$/)) {
      return res.status(400).json({ error: 'Invalid wallet address' });
    }

    const amount = getRewardAmount(challengeType);
    const result = await mintReward(userAddress, amount);

    console.log(`✅ Minted ${amount} NCX to ${userAddress} for ${challengeType} challenge`);

    res.status(200).json({
      success: true,
      txHash: result.hash,
      amount: result.amount,
      challengeType,
    });
  } catch (error: any) {
    console.error('❌ Error minting reward:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to mint reward',
    });
  }
}
