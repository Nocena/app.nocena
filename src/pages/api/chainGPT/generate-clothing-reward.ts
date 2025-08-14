// src/pages/api/chainGPT/generate-clothing-reward.ts
import { NextApiRequest, NextApiResponse } from 'next';
import path from 'path';
import fs from 'fs';
import { Nft } from '@chaingpt/nft';
import {
  getClothingTemplate,
  type ClothingTemplate,
  type ClothingTemplateInfo,
} from '../../../lib/utils/clothingRewardUtils';

// Helper function to get the clothing template image as base64
async function getClothingTemplateAsBase64(templatePath: string): Promise<string | null> {
  try {
    const fullPath = path.join(process.cwd(), 'public', templatePath.replace('/', ''));

    // Check if the template exists
    if (fs.existsSync(fullPath)) {
      const imageBuffer = fs.readFileSync(fullPath);
      const sizeKB = imageBuffer.length / 5096;

      console.log(`Clothing template size: ${sizeKB.toFixed(1)}KB`);

      // If template is too large for API, use enhanced prompt instead
      if (sizeKB > 200) {
        console.warn('Clothing template too large for API, will use detailed prompt description instead');
        return null;
      }

      const base64 = imageBuffer.toString('base64');
      return `data:image/png;base64,${base64}`;
    } else {
      console.warn(`Clothing template not found at ${fullPath}`);
      return null;
    }
  } catch (error) {
    console.error('Error loading clothing template:', error);
    return null;
  }
}

// Enhanced prompt generation for clothing NFTs
function generateEnhancedClothingPrompt(
  basePrompt: string,
  templateInfo: ClothingTemplateInfo,
  hasTemplate: boolean,
  userID: string,
): string {
  let enhancedPrompt = `A single NFT clothing item: ${templateInfo.name}. `;

  // Add detailed template style description
  enhancedPrompt += `${templateInfo.prompt} `;

  // Add Nocena universe styling
  enhancedPrompt += 'Style it with the Nocena universe aesthetic: ';
  enhancedPrompt += 'deep blue and purple gradient color scheme with cyan/teal accent lighting, ';
  enhancedPrompt += 'minimalist geometric design with clean angular features, ';
  enhancedPrompt += 'glassmorphism effects with subtle transparency and blur, ';
  enhancedPrompt += 'dark navy background with subtle tech-grid patterns. ';

  // Add technical quality specifications
  enhancedPrompt += 'High-quality 3D rendering with smooth surfaces, proper lighting, ';
  enhancedPrompt += 'and professional stylized quality suitable for NFT display. ';

  // Add uniqueness for user
  enhancedPrompt += `Make this ${templateInfo.name} unique for user ${userID} while maintaining the template design consistency. `;

  // Add template context if available
  if (hasTemplate) {
    enhancedPrompt += 'Use the provided template image as a style reference while creating a unique variation. ';
  }

  // Emphasize single item constraint
  enhancedPrompt += 'IMPORTANT: Generate only ONE clothing item, not multiple views or figures. ';
  enhancedPrompt += 'Single NFT clothing piece only, centered composition, clean background.';

  return enhancedPrompt;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const {
      userID,
      completionId,
      templateType,
      templatePath,
      prompt,
      model = 'velogen',
      width = 512,
      height = 512,
      enhance = '2x',
      useTemplate = true,
      clothingInfo,
    } = req.body;

    if (!userID || !completionId || !templateType || !prompt) {
      return res.status(400).json({
        error: 'Missing required fields: userID, completionId, templateType, and prompt',
      });
    }

    if (!process.env.CHAINGPT_API_KEY) {
      return res.status(500).json({ error: 'ChainGPT API key not configured' });
    }

    const nftInstance = new Nft({
      apiKey: process.env.CHAINGPT_API_KEY,
    });

    console.log('🎁 Generating Clothing NFT Reward...');
    console.log('User ID:', userID);
    console.log('Completion ID:', completionId);
    console.log('Template Type:', templateType);
    console.log('Clothing Info:', clothingInfo);

    // Get template information
    const templateInfo = getClothingTemplate(templateType as ClothingTemplate);
    if (!templateInfo) {
      return res.status(400).json({ error: `Invalid template type: ${templateType}` });
    }

    // Use the same wallet address as your other NFTs
    const walletAddress = '0x48Cd52D541A2d130545f3930F5330Ef31cD22B95';

    // Load the clothing template (but prioritize prompt-based approach)
    let templateImage: string | null = null;
    let templateApproach = 'prompt-based';

    if (useTemplate && templatePath) {
      templateImage = await getClothingTemplateAsBase64(templatePath);
      if (templateImage) {
        templateApproach = 'image-based';
        console.log('👕 Clothing Template: Loaded successfully for image-based generation');
      } else {
        console.log('👕 Clothing Template: Using detailed prompt description instead');
      }
    }

    // Generate enhanced prompt
    const enhancedPrompt = generateEnhancedClothingPrompt(
      prompt,
      templateInfo,
      templateApproach === 'image-based',
      userID,
    );

    console.log('✨ Enhanced Clothing Prompt:', enhancedPrompt.substring(0, 200) + '...');
    console.log('🎯 Generation Approach:', templateApproach);

    const generationParams: any = {
      walletAddress: walletAddress,
      prompt: enhancedPrompt,
      model: model,
      height: height,
      width: width,
      amount: 1, // Explicitly ensure only 1 image is generated
      chainId: 137, // Polygon
    };

    // Only add enhance parameter if it's supported
    if (enhance && enhance !== 'original') {
      generationParams.enhance = enhance === '2x' ? '2x' : enhance === '1x' ? '1x' : 'original';
    }

    // Add template image if available and small enough
    if (templateImage && templateApproach === 'image-based') {
      const templateSize = ((templateImage.split(',')[1]?.length || 0) * 3) / 4 / 1024; // Estimate KB

      if (templateSize < 200) {
        try {
          generationParams.templateImage = templateImage;
          console.log('👕 Template image added to generation parameters');
        } catch (error) {
          console.warn('Template image parameter not supported, using prompt enhancement only');
        }
      } else {
        console.warn('Template image too large, using prompt-only approach');
      }
    }

    console.log('🔄 Calling ChainGPT with clothing reward params:', {
      walletAddress: generationParams.walletAddress,
      prompt: enhancedPrompt.substring(0, 100) + '...',
      model: generationParams.model,
      dimensions: `${generationParams.width}x${generationParams.height}`,
      enhance: generationParams.enhance,
      templateImage: generationParams.templateImage ? '[TEMPLATE_DATA]' : 'None',
      approach: templateApproach,
      clothingType: templateInfo.type,
      clothingName: templateInfo.name,
    });

    // Generate clothing NFT using ChainGPT SDK
    const result = await nftInstance.generateNft(generationParams);

    console.log('✅ ChainGPT Clothing NFT Generation Success:', JSON.stringify(result, null, 2));

    // Extract collection ID from response - handle both possible response formats
    const collectionId = result?.collectionId || result?.id || result?.data?.collectionId;

    if (!collectionId) {
      console.log('❌ No collection ID found in clothing NFT generation result');
      console.log('Full result object:', JSON.stringify(result, null, 2));

      // If the result has data.imagesUrl, it means generation was successful but format is different
      if (result?.data?.imagesUrl && result?.data?.imagesUrl.length > 0) {
        console.log('✅ Found immediate result with images, using as completed NFT');
        return res.status(200).json({
          success: true,
          collectionId: result.data.collectionId || `immediate_${Date.now()}`,
          message: `${templateInfo.name} NFT generated successfully`,
          status: 'completed', // Mark as completed since we have the image
          immediateResult: true,
          imageUrl: result.data.imagesUrl[0], // Return the image URL immediately
          enhancedPrompt: enhancedPrompt.substring(0, 300) + '...',
          clothingInfo: {
            type: templateInfo.type,
            name: templateInfo.name,
            description: templateInfo.description,
            rarity: templateInfo.rarity,
            templateUsed: useTemplate,
            approach: templateApproach,
          },
          features: {
            hasTemplate: templateApproach === 'image-based',
            templateUsed: useTemplate,
            modelUsed: model,
            approach: templateApproach,
            completionId,
            userID,
          },
        });
      }

      return res.status(500).json({
        error: 'No collection ID in response',
        details: 'Clothing NFT generation response did not contain a collection ID',
        response: result,
      });
    }

    console.log('🔄 Clothing NFT generation started with collection ID:', collectionId);

    return res.status(200).json({
      success: true,
      collectionId: collectionId,
      message: `${templateInfo.name} NFT generation started using ${templateApproach} approach`,
      status: 'generating',
      enhancedPrompt: enhancedPrompt.substring(0, 300) + '...',
      clothingInfo: {
        type: templateInfo.type,
        name: templateInfo.name,
        description: templateInfo.description,
        rarity: templateInfo.rarity,
        templateUsed: useTemplate,
        approach: templateApproach,
      },
      features: {
        hasTemplate: templateApproach === 'image-based',
        templateUsed: useTemplate,
        modelUsed: model,
        approach: templateApproach,
        completionId,
        userID,
      },
    });
  } catch (error: any) {
    console.error('❌ Clothing NFT generation error:', error);

    if (error.isNftError) {
      return res.status(500).json({
        error: 'ChainGPT SDK Error',
        details: error.message || 'Unknown SDK error',
      });
    }

    return res.status(500).json({
      error: 'Failed to generate clothing NFT reward',
      details: error.message,
    });
  }
}
