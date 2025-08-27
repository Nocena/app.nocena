// src/pages/api/chainGPT/update-avatar-clothing.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { Nft } from '@chaingpt/nft';

// Helper function to convert base64 string to proper format
function processAvatarImage(avatarData: string): string | null {
  try {
    // If it's already a proper data URL, return as is
    if (avatarData.startsWith('data:image/')) {
      return avatarData;
    }

    // If it's just base64, add the proper prefix
    if (avatarData && !avatarData.includes('data:')) {
      return `data:image/png;base64,${avatarData}`;
    }

    // If it's a URL, we'll need to fetch it (handled elsewhere)
    if (avatarData.startsWith('http')) {
      return avatarData;
    }

    return avatarData;
  } catch (error) {
    console.error('Error processing avatar image:', error);
    return null;
  }
}

// Helper function to fetch and convert URL to base64
async function fetchImageAsBase64(imageUrl: string): Promise<string | null> {
  try {
    const response = await fetch(imageUrl);
    const buffer = await response.arrayBuffer();

    const bufferSizeKB = buffer.byteLength / 1024;
    if (bufferSizeKB > 500) {
      console.warn('Avatar image too large for API, using prompt-only approach');
      return null;
    }

    const base64 = Buffer.from(buffer).toString('base64');
    const mimeType = response.headers.get('content-type') || 'image/png';
    return `data:${mimeType};base64,${base64}`;
  } catch (error) {
    console.error('Error fetching image as base64:', error);
    return null;
  }
}

// Generate clothing-focused prompt that preserves the avatar
function generateClothingUpdatePrompt(clothingItems: any, clothingTemplates?: any): string {
  // Start with minimal instruction to preserve the avatar
  let prompt =
    'Keep the exact same avatar character, same face, same hair, same body proportions, same pose, same background. ';
  prompt += 'Only modify the clothing items as specified below. ';

  // Build specific clothing instructions
  const clothingUpdates = [];

  if (clothingItems.cap) {
    if (clothingTemplates?.cap) {
      clothingUpdates.push('add a cap/beanie that matches the provided cap template style');
    } else {
      clothingUpdates.push('add a simple geometric cap/beanie in the same art style');
    }
  }

  if (clothingItems.hoodie) {
    if (clothingTemplates?.hoodie) {
      clothingUpdates.push('add a hoodie/jacket that matches the provided hoodie template style');
    } else {
      clothingUpdates.push('add a minimalist hoodie/jacket in the same art style');
    }
  }

  if (clothingItems.pants) {
    if (clothingTemplates?.pants) {
      clothingUpdates.push('change pants to match the provided pants template style');
    } else {
      clothingUpdates.push('change pants to simple geometric style matching the avatar aesthetic');
    }
  }

  if (clothingItems.shoes) {
    if (clothingTemplates?.shoes) {
      clothingUpdates.push('add shoes that match the provided shoes template style');
    } else {
      clothingUpdates.push('add basic geometric shoes/sneakers in the same art style');
    }
  }

  if (clothingUpdates.length > 0) {
    prompt += `CLOTHING CHANGES: ${clothingUpdates.join(', ')}. `;
  }

  // Add preservation instructions
  prompt +=
    'PRESERVE everything else: same character identity, same lighting, same background, same pose, same colors. ';
  prompt += 'ONLY change the specified clothing items.';

  return prompt;
}

// Generate fallback prompt when no avatar reference is available
function generateFallbackPrompt(clothingItems: any, avatarCharacteristics: any): string {
  let prompt = 'Generate avatar with these characteristics: ';

  if (avatarCharacteristics) {
    if (avatarCharacteristics.hairStyle) {
      prompt += `hair style: ${avatarCharacteristics.hairStyle}, `;
    }
    if (avatarCharacteristics.faceShape) {
      prompt += `face shape: ${avatarCharacteristics.faceShape}, `;
    }
    if (avatarCharacteristics.bodyType) {
      prompt += `body proportions: ${avatarCharacteristics.bodyType}, `;
    }
  }

  // Add clothing specifications
  const clothingDescriptions = [];
  if (clothingItems.cap) clothingDescriptions.push('geometric cap/beanie');
  if (clothingItems.hoodie) clothingDescriptions.push('minimalist hoodie/jacket');
  if (clothingItems.pants) clothingDescriptions.push('simple geometric pants');
  if (clothingItems.shoes) clothingDescriptions.push('basic geometric shoes');

  if (clothingDescriptions.length > 0) {
    prompt += `wearing: ${clothingDescriptions.join(', ')}. `;
  }

  // Add Nocena style specifications
  prompt += 'Style: low-poly 3D rendered avatar, deep blue and purple gradient colors, ';
  prompt += 'cyan/teal accent lighting, glowing circular aura around head, ';
  prompt += 'standing pose, front-facing view, dark navy background, ';
  prompt += 'glassmorphism effects, modern digital art style.';

  return prompt;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const {
      baseAvatar,
      clothingItems,
      userID,
      avatarCharacteristics,
      clothingTemplates, // New: clothing template images
      model = 'velogen',
      width = 512,
      height = 768,
      enhance = '2x',
    } = req.body;

    if (!clothingItems || !userID) {
      return res.status(400).json({ error: 'Missing required fields: clothingItems and userID' });
    }

    if (!process.env.CHAINGPT_API_KEY) {
      return res.status(500).json({ error: 'ChainGPT API key not configured' });
    }

    console.log('👕 Updating avatar with clothing using advanced approach...');
    console.log('User ID:', userID);
    console.log('Has Base Avatar:', !!baseAvatar);
    console.log('Clothing items to update:', Object.keys(clothingItems));
    console.log('Has clothing templates:', !!clothingTemplates);

    const nftInstance = new Nft({
      apiKey: process.env.CHAINGPT_API_KEY,
    });

    const walletAddress = '0x48Cd52D541A2d130545f3930F5330Ef31cD22B95';

    // Process the base avatar image
    let processedAvatarImage: string | null = null;
    let avatarApproach = 'prompt-only';

    if (baseAvatar) {
      // Try to process the avatar image
      if (baseAvatar.startsWith('http')) {
        processedAvatarImage = await fetchImageAsBase64(baseAvatar);
      } else {
        processedAvatarImage = processAvatarImage(baseAvatar);
      }

      if (processedAvatarImage) {
        avatarApproach = 'image-based';
        console.log('✅ Base avatar processed for image-based generation');
      } else {
        console.log('⚠️ Avatar image processing failed, using prompt-based approach');
      }
    }

    // Process clothing templates if provided
    const processedClothingTemplates: any = {};
    if (clothingTemplates) {
      for (const [key, template] of Object.entries(clothingTemplates)) {
        if (template && typeof template === 'string') {
          if (template.startsWith('http')) {
            processedClothingTemplates[key] = await fetchImageAsBase64(template);
          } else {
            processedClothingTemplates[key] = processAvatarImage(template);
          }
        }
      }
    }

    // Generate appropriate prompt based on available resources
    let enhancedPrompt: string;

    if (avatarApproach === 'image-based') {
      enhancedPrompt = generateClothingUpdatePrompt(clothingItems, processedClothingTemplates);
    } else {
      enhancedPrompt = generateFallbackPrompt(clothingItems, avatarCharacteristics);
    }

    console.log('✨ Enhanced Prompt:', enhancedPrompt);
    console.log('🎯 Avatar Approach:', avatarApproach);

    // Build generation parameters
    const generationParams: any = {
      walletAddress: walletAddress,
      prompt: enhancedPrompt,
      model: model,
      height: height,
      width: width,
      amount: 1,
      chainId: 137,
    };

    // Add enhance parameter if supported
    if (enhance && enhance !== 'original') {
      generationParams.enhance = enhance === '2x' ? '2x' : enhance === '1x' ? '1x' : 'original';
    }

    // Calculate total image data size
    let totalImageDataSize = 0;

    // Add base avatar as reference image (highest priority)
    if (processedAvatarImage && avatarApproach === 'image-based') {
      const avatarSize = ((processedAvatarImage.split(',')[1]?.length || 0) * 3) / 4 / 1024;
      totalImageDataSize += avatarSize;

      if (totalImageDataSize < 400) {
        try {
          // Try different parameter names for the base avatar
          generationParams.referenceImage = processedAvatarImage;
          console.log('🧑‍🎨 Base avatar added as referenceImage');
        } catch (error) {
          try {
            generationParams.baseImage = processedAvatarImage;
            console.log('🧑‍🎨 Base avatar added as baseImage');
          } catch (error2) {
            try {
              generationParams.sourceImage = processedAvatarImage;
              console.log('🧑‍🎨 Base avatar added as sourceImage');
            } catch (error3) {
              console.warn('Base avatar parameter not supported, using prompt-only approach');
            }
          }
        }
      } else {
        console.warn('Base avatar image too large, using prompt-only approach');
      }
    }

    // Add clothing templates as style references
    const activeClothingTemplates = Object.entries(processedClothingTemplates).filter(
      ([key, template]) => clothingItems[key] && template,
    );

    if (activeClothingTemplates.length > 0 && totalImageDataSize < 300) {
      // For now, use the first clothing template as style reference
      const [templateType, templateImage] = activeClothingTemplates[0];
      const templateSize = (((templateImage as string)?.split(',')[1]?.length || 0) * 3) / 4 / 1024;

      if (totalImageDataSize + templateSize < 500) {
        try {
          generationParams.styleReference = templateImage;
          console.log(`👕 ${templateType} template added as styleReference`);
        } catch (error) {
          console.warn('Clothing template parameter not supported');
        }
      }
    }

    console.log('🔄 Calling ChainGPT with clothing update params:', {
      walletAddress: generationParams.walletAddress,
      prompt: enhancedPrompt.substring(0, 100) + '...',
      model: generationParams.model,
      dimensions: `${generationParams.width}x${generationParams.height}`,
      enhance: generationParams.enhance,
      hasBaseAvatar:
        !!generationParams.referenceImage || !!generationParams.baseImage || !!generationParams.sourceImage,
      hasClothingTemplate: !!generationParams.styleReference,
      totalDataSize: `~${Math.round(totalImageDataSize)}KB`,
      approach: avatarApproach,
      clothingItems: Object.keys(clothingItems),
    });

    // Generate updated avatar
    const result = await nftInstance.generateNft(generationParams);

    console.log('✅ ChainGPT Avatar Clothing Update Success:', JSON.stringify(result, null, 2));

    // Extract collection ID
    const collectionId = result?.collectionId || result?.id || result?.data?.collectionId || result?.data?.id;

    if (!collectionId) {
      console.log('❌ No collection ID found in update result');

      // Check for immediate result
      if (result?.data?.imagesUrl && result?.data?.imagesUrl.length > 0) {
        console.log('✅ Found immediate result with images');
        return res.status(200).json({
          success: true,
          collectionId: result.data.collectionId || `immediate_${Date.now()}`,
          message: 'Avatar clothing updated successfully',
          status: 'completed',
          immediateResult: true,
          imageUrl: result.data.imagesUrl[0],
          clothingApplied: Object.keys(clothingItems),
          approach: avatarApproach,
          enhancedPrompt: enhancedPrompt.substring(0, 200) + '...',
        });
      }

      return res.status(500).json({
        error: 'No collection ID in response',
        details: 'Avatar update response did not contain a collection ID',
        response: result,
      });
    }

    console.log('✅ Avatar clothing update started with collection ID:', collectionId);

    return res.status(200).json({
      success: true,
      collectionId: collectionId,
      message: `Avatar clothing update started using ${avatarApproach} approach`,
      status: 'generating',
      clothingApplied: Object.keys(clothingItems),
      approach: avatarApproach,
      enhancedPrompt: enhancedPrompt.substring(0, 200) + '...',
      features: {
        hasBaseAvatar: avatarApproach === 'image-based',
        hasClothingTemplates: activeClothingTemplates.length > 0,
        promptStrategy:
          avatarApproach === 'image-based' ? 'preserve-avatar-change-clothing' : 'regenerate-with-characteristics',
        clothingTemplatesUsed: activeClothingTemplates.map(([type]) => type),
      },
      debug: {
        totalImageDataSize: `~${Math.round(totalImageDataSize)}KB`,
        parametersUsed: {
          referenceImage: !!generationParams.referenceImage,
          baseImage: !!generationParams.baseImage,
          sourceImage: !!generationParams.sourceImage,
          styleReference: !!generationParams.styleReference,
        },
        clothingTemplatesProcessed: Object.keys(processedClothingTemplates),
      },
    });
  } catch (error: any) {
    console.error('❌ Avatar clothing update error:', error);

    return res.status(500).json({
      error: 'Failed to update avatar clothing',
      details: error.message || 'Unknown error occurred',
    });
  }
}
