// src/pages/api/chainGPT/mint-avatar.ts
import { NextApiRequest, NextApiResponse } from 'next';
// Convert require to import
import { Nft } from '@chaingpt/nft';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { collectionId, name, description, userID } = req.body;

    if (!collectionId || !name || !userID) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    if (!process.env.CHAINGPT_API_KEY) {
      return res.status(500).json({ error: 'ChainGPT API key not configured' });
    }

    console.log('🪙 Minting Nocena Avatar NFT...');
    console.log('Collection ID:', collectionId);
    console.log('User ID:', userID);
    console.log('Name:', name);

    // For now, return the avatar data without actual minting
    // You can implement actual minting later using ChainGPT's mint endpoint
    const mockNFT = {
      name: name,
      description: description,
      image: `https://gateway.pinata.cloud/ipfs/your-avatar-hash`, // This will be the actual IPFS hash
      collectionId: collectionId,
      userID: userID,
      attributes: [
        { trait_type: 'Type', value: 'Nocena Avatar' },
        { trait_type: 'Style', value: 'Low Poly' },
        { trait_type: 'Generation', value: 'AI Generated' },
        { trait_type: 'Rarity', value: 'Unique' },
      ],
    };

    console.log('✅ Avatar NFT prepared for minting:', mockNFT);

    return res.status(200).json({
      success: true,
      nft: mockNFT,
      message: 'Avatar NFT ready for minting',
    });
  } catch (error: any) {
    console.error('❌ Avatar minting error:', error);
    return res.status(500).json({
      error: 'Failed to prepare avatar for minting',
      details: error.message,
    });
  }
}
