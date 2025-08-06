// src/pages/api/nft/generate-from-challenge.ts
import { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';

const DGRAPH_ENDPOINT = process.env.NEXT_PUBLIC_DGRAPH_ENDPOINT || '';

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

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { challengeId, userId, challengeType } = req.body;

    if (!challengeId || !userId || !challengeType) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }

    // 1. Get the challenge to find out what NFT item type to generate
    const getChallengeQuery = `
      query GetChallenge($challengeId: String!) {
        getAIChallenge(id: $challengeId) {
          nftItemType
          title
          frequency
          reward
        }
      }
    `;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (process.env.NEXT_PUBLIC_DGRAPH_API_KEY) {
      headers['X-Auth-Token'] = process.env.NEXT_PUBLIC_DGRAPH_API_KEY;
    }

    const challengeResponse = await axios.post(
      DGRAPH_ENDPOINT,
      {
        query: getChallengeQuery,
        variables: { challengeId }
      },
      { headers }
    );

    if (challengeResponse.data.errors) {
      console.error('Error fetching challenge:', challengeResponse.data.errors);
      return res.status(400).json({ error: 'Failed to fetch challenge data' });
    }

    const challenge = challengeResponse.data.data?.getAIChallenge;

    if (!challenge || !challenge.nftItemType) {
      return res.status(400).json({ error: 'Challenge not found or no NFT reward available' });
    }

    console.log(`🎁 Challenge found: ${challenge.title} - NFT Type: ${challenge.nftItemType}`);

    // 2. Use the predetermined item type from the challenge
    const itemType = challenge.nftItemType;

    // 3. Roll for rarity when user completes the challenge
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

    console.log(`🎲 Rolled rarity: ${rarity} (roll: ${roll.toFixed(3)})`);

    // 4. Generate NFT name and bonuses
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

    const itemNames: Record<string, string> = {
      cap: 'Cap',
      hoodie: 'Hoodie',
      pants: 'Pants',
      shoes: 'Shoes'
    };

    const prefix = nameOptions[rarity][Math.floor(Math.random() * nameOptions[rarity].length)];
    const nftName = `${prefix} ${itemNames[itemType]} of Power`;
    const description = `A ${rarity} ${itemType} that grants +${tokenBonuses[rarity]}% token bonus in the Nocena universe.`;

    // 5. Generate the NFT image using your existing avatar generation system
    console.log(`🎨 Generating ${rarity} ${itemType} NFT image...`);
    
    const nftImageResponse = await fetch('/api/nft/generate-random', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId,
        itemType,
        rarity,
        challengeId,
        challengeType
      })
    });

    if (!nftImageResponse.ok) {
      throw new Error('Failed to generate NFT image');
    }

    const nftImageData = await nftImageResponse.json();

    if (!nftImageData.success) {
      throw new Error(nftImageData.error || 'NFT image generation failed');
    }

    // 6. Save NFT to database
    const nftId = `nft_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const createNFTMutation = `
      mutation CreateNFT(
        $id: String!,
        $name: String!,
        $description: String!,
        $itemType: String!,
        $rarity: String!,
        $tokenBonus: Int!,
        $imageUrl: String!,
        $imageCID: String!,
        $generatedAt: DateTime!,
        $generationPrompt: String!,
        $userId: String!
      ) {
        addNFTItem(input: [{
          id: $id,
          name: $name,
          description: $description,
          itemType: $itemType,
          rarity: $rarity,
          tokenBonus: $tokenBonus,
          imageUrl: $imageUrl,
          imageCID: $imageCID,
          generatedAt: $generatedAt,
          generationPrompt: $generationPrompt,
          owner: { id: $userId },
          isEquipped: false
        }]) {
          nFTItem {
            id
            name
            rarity
            tokenBonus
            imageUrl
          }
        }
      }
    `;

    const nftVariables = {
      id: nftId,
      name: nftName,
      description: description,
      itemType: itemType,
      rarity: rarity,
      tokenBonus: tokenBonuses[rarity],
      imageUrl: nftImageData.imageUrl || '',
      imageCID: nftImageData.imageCID || '',
      generatedAt: new Date().toISOString(),
      generationPrompt: `Generated ${rarity} ${itemType} for challenge completion`,
      userId: userId
    };

    const nftResponse = await axios.post(
      DGRAPH_ENDPOINT,
      {
        query: createNFTMutation,
        variables: nftVariables
      },
      { headers }
    );

    if (nftResponse.data.errors) {
      console.error('Error creating NFT:', nftResponse.data.errors);
      throw new Error('Failed to create NFT in database');
    }

    const createdNFT = nftResponse.data.data?.addNFTItem?.nFTItem?.[0];

    if (!createdNFT) {
      throw new Error('NFT was not created successfully');
    }

    console.log(`✅ NFT created successfully: ${createdNFT.name} (ID: ${createdNFT.id})`);

    // 7. Send success response
    res.status(200).json({
      success: true,
      nft: {
        id: createdNFT.id,
        name: createdNFT.name,
        itemType: itemType,
        rarity: rarity,
        tokenBonus: tokenBonuses[rarity],
        imageUrl: createdNFT.imageUrl,
        description: description
      },
      message: `🎉 Congratulations! You earned a ${rarity} ${itemType}!`,
      bonusMessage: `This NFT grants you +${tokenBonuses[rarity]}% token bonus!`
    });

  } catch (error) {
    console.error('NFT generation from challenge error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ 
      error: 'Failed to generate NFT reward',
      details: errorMessage 
    });
  }
}

// Alternative endpoint that generates a specific NFT (for internal use)
// src/pages/api/nft/generate-specific.ts
export async function generateSpecificNFT(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { userId, itemType, rarity, challengeId, challengeType } = req.body;

    if (!userId || !itemType || !rarity) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }

    // Build generation prompt based on item type and rarity
    const prompts: Record<string, Record<string, string>> = {
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

    // Use your existing avatar generation infrastructure
    const chainGPTResponse = await fetch(`${process.env.CHAINGPT_API_BASE}/avatar`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.CHAINGPT_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        userID: `nft_${itemType}_${rarity}_${Date.now()}`,
        prompt: fullPrompt,
        model: 'velogen',
        width: 512,
        height: 512,
        enhance: '2x',
        useTemplate: true,
        templatePath: `/nft/${itemType}.png`
      })
    });

    if (!chainGPTResponse.ok) {
      throw new Error(`ChainGPT API error: ${chainGPTResponse.status}`);
    }

    const chainGPTData = await chainGPTResponse.json();

    if (!chainGPTData.success) {
      throw new Error(chainGPTData.error || 'ChainGPT generation failed');
    }

    res.status(200).json({
      success: true,
      collectionId: chainGPTData.collectionId,
      imageUrl: chainGPTData.imageUrl,
      imageCID: chainGPTData.imageCID,
      message: `${rarity} ${itemType} generation started`
    });

  } catch (error) {
    console.error('Specific NFT generation error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ 
      error: 'Failed to generate specific NFT',
      details: errorMessage 
    });
  }
}