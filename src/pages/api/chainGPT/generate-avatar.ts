// src/pages/api/chainGPT/generate-avatar.ts
import { NextApiRequest, NextApiResponse } from 'next';
import path from 'path';
import fs from 'fs';
// Convert require to import
import { Nft } from '@chaingpt/nft';

// Helper function to compress and resize images
async function compressImage(imageBuffer: Buffer, maxSizeKB: number = 100): Promise<Buffer> {
  // This would ideally use a library like sharp for server-side compression
  // For now, we'll implement basic size checking and truncation
  const currentSizeKB = imageBuffer.length / 1024;

  if (currentSizeKB <= maxSizeKB) {
    return imageBuffer;
  }

  // If too large, we'll need to compress or resize
  // For now, return original and let the enhanced prompt handle the styling
  console.warn(`Image size (${currentSizeKB.toFixed(1)}KB) exceeds limit (${maxSizeKB}KB), using prompt-only approach`);
  throw new Error('Image too large for API');
}

// Helper function to convert profile picture to base64 with compression
async function getProfilePictureAsBase64(profilePicture: string, compress: boolean = true): Promise<string | null> {
  try {
    // If it's already a base64 string, check size
    if (profilePicture.startsWith('data:image/')) {
      const base64Data = profilePicture.split(',')[1];
      const sizeKB = (base64Data.length * 3) / 4 / 1024; // Estimate size

      if (sizeKB > 150 && compress) {
        console.warn('Profile picture base64 too large, using prompt enhancement only');
        return null;
      }
      return profilePicture;
    }

    // If it's a URL, fetch and convert to base64
    if (profilePicture.startsWith('http')) {
      const response = await fetch(profilePicture);
      const buffer = await response.arrayBuffer();

      // Check size before compression
      const bufferSizeKB = buffer.byteLength / 1024;
      if (bufferSizeKB > 500) {
        // If > 500KB, skip image inclusion
        console.warn('Profile picture too large for API, using prompt enhancement only');
        return null;
      }

      if (compress) {
        try {
          await compressImage(Buffer.from(buffer), 100);
        } catch (error) {
          console.warn('Image compression failed, using prompt-only approach');
          return null;
        }
      }

      const base64 = Buffer.from(buffer).toString('base64');
      const mimeType = response.headers.get('content-type') || 'image/jpeg';
      return `data:${mimeType};base64,${base64}`;
    }

    // If it's a local path, we can't process it in the API
    console.log('Cannot process local file path:', profilePicture);
    return null;
  } catch (error) {
    console.error('Error converting profile picture to base64:', error);
    return null;
  }
}

// Helper function to get the default avatar template with size optimization
async function getDefaultAvatarTemplate(): Promise<string | null> {
  try {
    const avatarPath = path.join(process.cwd(), 'public', 'avatar.png');

    // Check if the avatar template exists
    if (fs.existsSync(avatarPath)) {
      const imageBuffer = fs.readFileSync(avatarPath);
      const sizeKB = imageBuffer.length / 1024;

      console.log(`Template image size: ${sizeKB.toFixed(1)}KB`);

      // If template is too large for API, use enhanced prompt instead
      if (sizeKB > 200) {
        console.warn('Template image too large for API, will use detailed prompt description instead');
        return null;
      }

      const base64 = imageBuffer.toString('base64');
      return `data:image/png;base64,${base64}`;
    } else {
      console.warn('Default avatar template not found at public/avatar.png');
      return null;
    }
  } catch (error) {
    console.error('Error loading default avatar template:', error);
    return null;
  }
}

// Enhanced prompt generation with detailed template description
function generateEnhancedPrompt(basePrompt: string, hasProfilePicture: boolean, hasTemplate: boolean): string {
  let enhancedPrompt = 'A single futuristic low-poly avatar character';

  // Add detailed template style description based on the actual template
  enhancedPrompt += ' in the exact style of the Nocena universe with these specific characteristics: ';
  enhancedPrompt += 'ONE CHARACTER ONLY with minimalist geometric design and clean angular features, ';
  enhancedPrompt += 'deep blue and purple gradient color scheme with cyan/teal accent lighting, ';
  enhancedPrompt += 'simple rounded facial features with no detailed facial expressions, ';
  enhancedPrompt += 'smooth solid-colored clothing including hoodie or jacket and pants, ';
  enhancedPrompt += 'glowing circular aura or ring around the head with cyan/blue neon effect, ';
  enhancedPrompt += 'standing pose with arms at sides in full-body front-facing view, ';
  enhancedPrompt += 'dark blue navy background with subtle tech-grid patterns, ';
  enhancedPrompt += 'glassmorphism effects with subtle transparency and blur, ';
  enhancedPrompt += 'clean and minimalist design with no intricate details. ';

  // Add profile picture instructions if available
  if (hasProfilePicture) {
    enhancedPrompt +=
      "While maintaining the exact template style described above, subtly incorporate the general hair style and basic facial structure from the user's profile picture into this SINGLE CHARACTER. ";
    enhancedPrompt +=
      'Keep the same minimalist geometric approach but adjust hair shape and basic proportions to match the reference. ';
  }

  // Add specific single character instructions
  enhancedPrompt += 'IMPORTANT: Generate only ONE character, not multiple views or figures. ';
  enhancedPrompt += 'Single avatar only, front-facing view, ';
  enhancedPrompt +=
    'modern sleek digitally-enhanced appearance with perfect symmetry and professional 3D modeling quality. ';
  enhancedPrompt += 'No duplicates, no multiple poses, no back views, just one single futuristic avatar character.';

  return enhancedPrompt;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const {
      prompt,
      profilePicture,
      userID,
      model = 'velogen',
      width = 512,
      height = 768,
      enhance = '2x',
      useTemplate = true, // New parameter to control template usage
    } = req.body;

    if (!prompt || !userID) {
      return res.status(400).json({ error: 'Missing required fields: prompt and userID' });
    }

    if (!process.env.CHAINGPT_API_KEY) {
      return res.status(500).json({ error: 'ChainGPT API key not configured' });
    }

    const nftInstance = new Nft({
      apiKey: process.env.CHAINGPT_API_KEY,
    });

    console.log('🎨 Generating Nocena Avatar NFT with Template and Profile Picture...');
    console.log('User ID:', userID);
    console.log('Base Prompt:', prompt);
    console.log('Profile Picture:', profilePicture ? 'Provided' : 'Not provided');
    console.log('Use Template:', useTemplate);

    // The same wallet address as your challenge NFTs or make it user-specific
    const walletAddress = '0x48Cd52D541A2d130545f3930F5330Ef31cD22B95';

    // Load the default avatar template (but prioritize prompt-based approach)
    let templateImage: string | null = null;
    let templateApproach = 'prompt-based'; // Track which approach we're using

    if (useTemplate) {
      templateImage = await getDefaultAvatarTemplate();
      if (templateImage) {
        templateApproach = 'image-based';
        console.log('📋 Avatar Template: Loaded successfully for image-based generation');
      } else {
        console.log('📋 Avatar Template: Using detailed prompt description instead');
      }
    }

    // Process profile picture if provided (with size limitations)
    let profilePictureBase64: string | null = null;
    if (profilePicture) {
      profilePictureBase64 = await getProfilePictureAsBase64(profilePicture, true);
      console.log(
        '📸 Profile Picture:',
        profilePictureBase64 ? 'Processed successfully' : 'Using prompt enhancement only',
      );
    }

    // Generate enhanced prompt with template and profile picture context
    const enhancedPrompt = generateEnhancedPrompt(
      prompt,
      !!profilePictureBase64 || !!profilePicture, // True if we have profile pic (even if not processed)
      templateApproach === 'image-based',
    );

    console.log('✨ Enhanced Prompt:', enhancedPrompt.substring(0, 200) + '...');
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

    // Only add image data if images are small enough and processed successfully
    let totalImageDataSize = 0;

    if (templateImage && templateApproach === 'image-based') {
      const templateSize = ((templateImage.split(',')[1]?.length || 0) * 3) / 4 / 1024; // Estimate KB
      totalImageDataSize += templateSize;

      if (totalImageDataSize < 200) {
        // Keep under 200KB total
        try {
          generationParams.templateImage = templateImage;
          console.log('📋 Template image added to generation parameters');
        } catch (error) {
          console.warn('Template image parameter not supported, using prompt enhancement only');
        }
      } else {
        console.warn('Template image too large, using prompt-only approach');
      }
    }

    if (profilePictureBase64) {
      const profileSize = ((profilePictureBase64.split(',')[1]?.length || 0) * 3) / 4 / 1024; // Estimate KB
      totalImageDataSize += profileSize;

      if (totalImageDataSize < 300) {
        // Keep total under 300KB
        try {
          generationParams.referenceImage = profilePictureBase64;
          console.log('📸 Profile picture added as reference image');
        } catch (error) {
          console.warn('Reference image parameter not supported, using prompt enhancement only');
        }
      } else {
        console.warn('Combined image data too large, using prompt-only approach');
      }
    }

    console.log('🔄 Calling ChainGPT with optimized params:', {
      walletAddress: generationParams.walletAddress,
      prompt: enhancedPrompt.substring(0, 100) + '...',
      model: generationParams.model,
      dimensions: `${generationParams.width}x${generationParams.height}`,
      enhance: generationParams.enhance,
      // Hide the actual image data in logs for clarity
      templateImage: generationParams.templateImage ? `[TEMPLATE_DATA_~${Math.round(totalImageDataSize)}KB]` : 'None',
      referenceImage: generationParams.referenceImage ? '[PROFILE_DATA]' : 'None',
      totalDataSize: `~${Math.round(totalImageDataSize)}KB`,
      approach: templateApproach,
    });

    // Generate avatar NFT using ChainGPT SDK
    const result = await nftInstance.generateNft(generationParams);

    console.log('✅ ChainGPT Avatar Generation Success:', JSON.stringify(result, null, 2));

    // Extract collection ID from response
    const collectionId = result?.collectionId || result?.id || result?.data?.collectionId;

    if (!collectionId) {
      console.log('❌ No collection ID found in avatar generation result');
      return res.status(500).json({
        error: 'No collection ID in response',
        details: 'Avatar generation response did not contain a collection ID',
        response: result,
      });
    }

    console.log('🔄 Avatar generation started with collection ID:', collectionId);

    return res.status(200).json({
      success: true,
      collectionId: collectionId,
      message: `Avatar NFT generation started using ${templateApproach} approach with ${profilePictureBase64 ? 'profile' : 'prompt-only'} reference`,
      status: 'generating',
      enhancedPrompt: enhancedPrompt.substring(0, 300) + '...',
      features: {
        hasTemplate: templateApproach === 'image-based',
        hasProfileReference: !!profilePictureBase64,
        templateUsed: useTemplate,
        modelUsed: model,
        approach: templateApproach,
        dataSize: `~${Math.round(totalImageDataSize)}KB`,
      },
    });
  } catch (error: any) {
    console.error('❌ Avatar generation error:', error);

    if (error.isNftError) {
      return res.status(500).json({
        error: 'ChainGPT SDK Error',
        details: error.message || 'Unknown SDK error',
      });
    }

    return res.status(500).json({
      error: 'Failed to generate avatar NFT',
      details: error.message,
    });
  }
}
