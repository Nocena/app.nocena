// src/pages/api/chainGPT/check-clothing-reward-progress.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { Nft } from '@chaingpt/nft';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { collectionId } = req.query;

    if (!collectionId || typeof collectionId !== 'string') {
      return res.status(400).json({ error: 'Collection ID required' });
    }

    if (!process.env.CHAINGPT_API_KEY) {
      return res.status(500).json({ error: 'ChainGPT API key not configured' });
    }

    const nftInstance = new Nft({
      apiKey: process.env.CHAINGPT_API_KEY,
    });

    console.log('🔍 Checking clothing NFT progress for:', collectionId);

    // Check progress using ChainGPT SDK
    const progress = await nftInstance.getNftProgress({
      collectionId: collectionId,
    });

    console.log('📊 Clothing NFT progress:', JSON.stringify(progress, null, 2));

    return res.status(200).json({
      success: true,
      progress: progress,
      collectionId: collectionId,
    });
  } catch (error: any) {
    console.error('❌ Error checking clothing NFT progress:', error);
    return res.status(500).json({
      error: 'Failed to check clothing NFT progress',
      details: error.message,
    });
  }
}
