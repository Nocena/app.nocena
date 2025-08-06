// src/pages/api/nft/generate-random.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { prepareAvatarGenerationParams } from '../../../lib/utils/avatarTemplateUtils';

interface RarityRates {
  common: number;
  rare: number;
  epic: number;
  legendary: number;
}

interface TokenBonuses {
  common: number;
  rare: number;
  epic: number;
  legendary: number;
}

interface NameOptions {
  common: string[];
  rare: string[];
  epic: string[];
  legendary: string[];
}

interface ItemNames {
  cap: string;
  hoodie: string;
  pants: string;
  shoes: string;
}

interface Prompts {
  cap: Record<keyof RarityRates, string>;
  hoodie: Record<keyof RarityRates, string>;
  pants: Record<keyof RarityRates, string>;
  shoes: Record<keyof RarityRates, string>;
}

interface NFTData {
  name: string;
  description: string;
  itemType: string;
  rarity: string;
  tokenBonus: number;
  generationPrompt: string;
  userId: string;
  challengeType: string;
}

interface ChainGPTResponse {
  success: boolean;
  collectionId?: string;
  error?: string;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { userId, challengeType }: { userId?: string; challengeType?: string } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    // 1. Randomly pick item type
    const itemTypes: (keyof ItemNames)[] = ['cap', 'hoodie', 'pants', 'shoes'];
    const itemType = itemTypes[Math.floor(Math.random() * itemTypes.length)];

    // 2. Randomly pick rarity
    const rarityRates: RarityRates = {
      common: 0.70,    // 70%
      rare: 0.20,      // 20%
      epic: 0.08,      // 8%
      legendary: 0.02  // 2%
    };

    const roll = Math.random();
    let cumulative = 0;
    let rarity: keyof RarityRates = 'common';

    for (const [rarityLevel, rate] of Object.entries(rarityRates)) {
      cumulative += rate;
      if (roll <= cumulative) {
        rarity = rarityLevel as keyof RarityRates;
        break;
      }
    }

    // 3. Build generation prompt based on item type and rarity
    const prompts: Prompts = {
      cap: {
        common: "stylized 3D cap, clean design, simple materials, futuristic style, Nocena universe aesthetic",
        rare: "stylized 3D cap, enhanced details, subtle glow, premium materials, futuristic style, Nocena universe aesthetic",
        epic: "stylized 3D cap, mystical aura, intricate patterns, glowing effects, futuristic style, Nocena universe aesthetic",
        legendary: "stylized 3D cap, divine radiance, otherworldly design, heavy particle effects, legendary aura, futuristic style, Nocena universe aesthetic"
      },
      hoodie: {
        common: "stylized 3D hoodie, clean design, simple materials, cyberpunk aesthetic, Nocena universe style",
        rare: "stylized 3D hoodie, enhanced details, subtle glow, premium materials, cyberpunk aesthetic, Nocena universe style",
        epic: "stylized 3D hoodie, mystical aura, intricate patterns, glowing effects, cyberpunk aesthetic, Nocena universe style",
        legendary: "stylized 3D hoodie, divine radiance, otherworldly design, heavy particle effects, legendary aura, cyberpunk aesthetic, Nocena universe style"
      },
      pants: {
        common: "stylized 3D pants, clean design, simple materials, futuristic style, Nocena universe aesthetic",
        rare: "stylized 3D pants, enhanced details, subtle glow, premium materials, futuristic style, Nocena universe aesthetic",
        epic: "stylized 3D pants, mystical aura, intricate patterns, glowing effects, futuristic style, Nocena universe aesthetic",
        legendary: "stylized 3D pants, divine radiance, otherworldly design, heavy particle effects, legendary aura, futuristic style, Nocena universe aesthetic"
      },
      shoes: {
        common: "stylized 3D shoes, clean design, simple materials, high-tech style, Nocena universe aesthetic",
        rare: "stylized 3D shoes, enhanced details, subtle glow, premium materials, high-tech style, Nocena universe aesthetic",
        epic: "stylized 3D shoes, mystical aura, intricate patterns, glowing effects, high-tech style, Nocena universe aesthetic",
        legendary: "stylized 3D shoes, divine radiance, otherworldly design, heavy particle effects, legendary aura, high-tech style, Nocena universe aesthetic"
      }
    };

    const basePrompt = prompts[itemType][rarity];
    const fullPrompt = `${basePrompt}, high quality 3D render, gaming asset style, isolated on transparent background, professional lighting, clean surfaces, smooth geometry`;

    // 4. Use your existing avatar generation params preparation
    const generationParams = prepareAvatarGenerationParams(
      `nft_${itemType}_${rarity}_${Date.now()}`,
      fullPrompt,
      undefined, // No profile picture for NFT clothing
      {
        useTemplate: true,
        templatePath: `/nft/${itemType}.png`, // Use your existing templates
        styleKeywords: [
          'stylized 3D',
          'clean rendering',
          'smooth surfaces',
          'gaming asset style',
          'isolated background',
          'professional lighting'
        ],
        qualitySettings: {
          width: 512,
          height: 512,
          enhance: '2x' as const,
          model: 'velogen'
        }
      }
    );

    // 5. Call ChainGPT API (similar to your avatar generation)
    const chainGPTApiBase = process.env.CHAINGPT_API_BASE;
    const chainGPTApiKey = process.env.CHAINGPT_API_KEY;

    if (!chainGPTApiBase || !chainGPTApiKey) {
      throw new Error('ChainGPT API configuration missing');
    }

    const chainGPTResponse = await fetch(`${chainGPTApiBase}/avatar`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${chainGPTApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(generationParams)
    });

    if (!chainGPTResponse.ok) {
      throw new Error(`ChainGPT API error: ${chainGPTResponse.status}`);
    }

    const chainGPTData: ChainGPTResponse = await chainGPTResponse.json();

    if (!chainGPTData.success) {
      throw new Error(chainGPTData.error || 'ChainGPT generation failed');
    }

    // 6. Generate NFT name and calculate token bonus
    const tokenBonuses: TokenBonuses = {
      common: 10,
      rare: 15,
      epic: 25,
      legendary: 50
    };

    const nameOptions: NameOptions = {
      common: ['Basic', 'Simple', 'Standard'],
      rare: ['Enhanced', 'Superior', 'Advanced'],
      epic: ['Mystic', 'Epic', 'Powerful'],
      legendary: ['Legendary', 'Divine', 'Mythic']
    };

    const itemNames: ItemNames = {
      cap: 'Cap',
      hoodie: 'Hoodie',
      pants: 'Pants',
      shoes: 'Shoes'
    };

    const prefix = nameOptions[rarity][Math.floor(Math.random() * nameOptions[rarity].length)];
    const nftName = `${prefix} ${itemNames[itemType]} of Power`;
    const description = `A ${rarity} ${itemType} that grants +${tokenBonuses[rarity]}% token bonus in the Nocena universe.`;

    const nftData: NFTData = {
      name: nftName,
      description: description,
      itemType: itemType,
      rarity: rarity,
      tokenBonus: tokenBonuses[rarity],
      generationPrompt: fullPrompt,
      userId: userId,
      challengeType: challengeType || 'unknown'
    };

    // 7. Return the generation data (you'll poll for completion like with avatars)
    res.status(200).json({
      success: true,
      collectionId: chainGPTData.collectionId,
      nftData: nftData,
      message: `${rarity} ${itemType} NFT generation started`
    });

  } catch (error) {
    console.error('NFT generation error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ 
      error: 'NFT generation failed',
      details: errorMessage
    });
  }
}

// Helper API to check NFT generation progress (similar to your avatar progress check)
// src/pages/api/nft/check-progress.ts
export async function checkNFTGenerationProgress(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { collectionId } = req.query;

    if (!collectionId || typeof collectionId !== 'string') {
      return res.status(400).json({ error: 'collectionId is required' });
    }

    const chainGPTApiBase = process.env.CHAINGPT_API_BASE;
    const chainGPTApiKey = process.env.CHAINGPT_API_KEY;

    if (!chainGPTApiBase || !chainGPTApiKey) {
      throw new Error('ChainGPT API configuration missing');
    }

    // Use your existing progress check logic (same as avatar)
    const response = await fetch(`${chainGPTApiBase}/avatar/progress/${collectionId}`, {
      headers: {
        'Authorization': `Bearer ${chainGPTApiKey}`,
      }
    });

    if (!response.ok) {
      throw new Error(`Progress check failed: ${response.status}`);
    }

    const data = await response.json();

    res.status(200).json({
      success: true,
      progress: data
    });

  } catch (error) {
    console.error('Progress check error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ 
      error: 'Failed to check progress',
      details: errorMessage 
    });
  }
}