// src/pages/api/chainGPT/update-avatar-clothing.ts
import { NextApiRequest, NextApiResponse } from 'next';
// Convert require to import
import { Nft } from '@chaingpt/nft';

// Helper function to convert File to base64
async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = (reader.result as string).split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { baseAvatar, clothingItems, userID, avatarCharacteristics } = req.body;

    if (!baseAvatar || !clothingItems || !userID) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    if (!process.env.CHAINGPT_API_KEY) {
      return res.status(500).json({ error: 'ChainGPT API key not configured' });
    }

    console.log('👕 Updating avatar with clothing...');
    console.log('User ID:', userID);
    console.log('Base Avatar:', baseAvatar.substring(0, 50) + '...');
    console.log('Clothing items:', Object.keys(clothingItems));
    console.log('Avatar characteristics:', avatarCharacteristics);

    const nftInstance = new Nft({
      apiKey: process.env.CHAINGPT_API_KEY,
    });

    // Build enhanced prompt that preserves the previous avatar's characteristics
    let clothingPrompt = 'EXACT SAME avatar character as before but now wearing: ';
    const clothingDescriptions = [];

    if (clothingItems.cap) {
      clothingDescriptions.push('a simple geometric cap/beanie (low-poly style, solid colored)');
    }
    if (clothingItems.hoodie) {
      clothingDescriptions.push('a minimalist hoodie/jacket (clean geometric shapes, smooth surfaces)');
    }
    if (clothingItems.pants) {
      clothingDescriptions.push('simple geometric pants (low-poly, solid colored)');
    }
    if (clothingItems.shoes) {
      clothingDescriptions.push('basic low-poly shoes/sneakers (geometric, smooth)');
    }

    clothingPrompt += clothingDescriptions.join(', ');
    clothingPrompt += '. CRITICAL: PRESERVE the exact character from the previous generation: ';

    // Add specific characteristics from the previous avatar if provided
    if (avatarCharacteristics) {
      if (avatarCharacteristics.hairStyle) {
        clothingPrompt += `same hair style: ${avatarCharacteristics.hairStyle}, `;
      }
      if (avatarCharacteristics.faceShape) {
        clothingPrompt += `same face shape: ${avatarCharacteristics.faceShape}, `;
      }
      if (avatarCharacteristics.bodyType) {
        clothingPrompt += `same body proportions: ${avatarCharacteristics.bodyType}, `;
      }
    }

    clothingPrompt += 'MAINTAIN exact same character identity, same hair, same face, same proportions, same pose. ';
    clothingPrompt += 'ONLY change the clothing items. ';
    clothingPrompt += 'SAME exact style: low-poly 3D rendered avatar in Nocena universe style, ';
    clothingPrompt += 'SAME color scheme: deep blue (#2353FF), purple (#6024FB), cyan/teal accent lighting, ';
    clothingPrompt += 'SAME glowing circular aura/ring around the head with cyan neon effect, ';
    clothingPrompt += 'smooth solid-colored clothing with geometric shapes and clean edges, ';
    clothingPrompt += 'glassmorphism effects with subtle transparency and soft gradients, ';
    clothingPrompt += 'standing pose with arms at sides, full-body front-facing view, ';
    clothingPrompt += 'dark navy blue background with subtle tech-grid pattern, ';
    clothingPrompt += 'modern 3D rendered digital art style (NOT photorealistic, NOT cartoon, NOT realistic human). ';
    clothingPrompt += 'CRITICAL: Same character, same identity, just add clothing.';

    const walletAddress = '0x48Cd52D541A2d130545f3930F5330Ef31cD22B95';

    const generationParams: any = {
      walletAddress: walletAddress,
      prompt: clothingPrompt,
      model: 'velogen',
      height: 768,
      width: 512,
      amount: 1,
      chainId: 137,
    };

    // REMOVED: referenceImage parameter since it's not supported
    console.log('🔄 Generating new avatar with clothing (prompt-based approach)...');
    console.log('Prompt:', clothingPrompt.substring(0, 100) + '...');

    const result = await nftInstance.generateNft(generationParams);

    const collectionId = result?.collectionId || result?.id || result?.data?.collectionId || result?.data?.id;

    if (!collectionId) {
      console.log('❌ No collection ID found in update result');
      return res.status(500).json({
        error: 'No collection ID in response',
        details: 'Avatar update response did not contain a collection ID',
      });
    }

    console.log('✅ Avatar clothing generation started with collection ID:', collectionId);

    return res.status(200).json({
      success: true,
      collectionId: collectionId,
      message: 'Avatar with clothing generation started',
      status: 'generating',
      clothingApplied: Object.keys(clothingItems),
      approach: 'prompt-based-clothing',
    });
  } catch (error: any) {
    console.error('❌ Avatar clothing generation error:', error);

    return res.status(500).json({
      error: 'Failed to generate avatar with clothing',
      details: error.message || 'Unknown error occurred',
    });
  }
}
