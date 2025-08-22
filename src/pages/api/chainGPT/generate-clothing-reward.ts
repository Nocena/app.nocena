// src/pages/api/chainGPT/generate-clothing-reward.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { Nft } from '@chaingpt/nft';
import {
  getClothingTemplate,
  selectRandomClothingTemplate,
  type ClothingTemplate,
  type ClothingTemplateInfo,
} from '../../../lib/utils/clothingRewardUtils';

// Pinata gateway base URL with token
const PINATA_GATEWAY_BASE = 'https://jade-elaborate-emu-349.mypinata.cloud/ipfs';
const PINATA_GATEWAY_TOKEN = 'XQTlgcFp9rPCXpkx3GkP5M28RfBWRUUwaUwF2H_SCyA3TiFZvm-ssBVMLgIRVz9G';

// Clothing template CIDs from Pinata (without the token - we'll add it in the function)
const CLOTHING_TEMPLATE_CIDS = {
  cap: 'bafkreigp7lpdskit65fjzm5qedqyxfsf4bgf7l26s3yfb5lpnrqa7fyhzu',
  hoodie: 'bafkreig7alofcsl72fcmi5s2effqq3n7gu72alh7kztpkjm4xoqd5byr2m',
  pants: 'bafkreicsnibs5oobiymnic3lo6kjbvanq7tevd7h34hlp5fssjncgqu3vu',
  shoes: 'bafkreifmrooaogvu6owrzveo5t7yfgcna6i3vjmby6a3tapdotxlgfru3y',
} as const;

// Map clothing types to their Pinata CIDs
function getClothingTemplateCID(clothingType: string): string | null {
  const normalizedType = clothingType.toLowerCase();

  // Direct mapping
  if (CLOTHING_TEMPLATE_CIDS[normalizedType as keyof typeof CLOTHING_TEMPLATE_CIDS]) {
    return CLOTHING_TEMPLATE_CIDS[normalizedType as keyof typeof CLOTHING_TEMPLATE_CIDS];
  }

  // Fuzzy matching for variations
  if (normalizedType.includes('hat') || normalizedType.includes('cap')) {
    return CLOTHING_TEMPLATE_CIDS.cap;
  }
  if (normalizedType.includes('hoodie') || normalizedType.includes('jacket') || normalizedType.includes('shirt')) {
    return CLOTHING_TEMPLATE_CIDS.hoodie;
  }
  if (normalizedType.includes('pants') || normalizedType.includes('trousers') || normalizedType.includes('jeans')) {
    return CLOTHING_TEMPLATE_CIDS.pants;
  }
  if (normalizedType.includes('shoes') || normalizedType.includes('sneakers') || normalizedType.includes('boots')) {
    return CLOTHING_TEMPLATE_CIDS.shoes;
  }

  return null;
}

// Build the full Pinata URL for a clothing template
function buildClothingTemplateUrl(cid: string): string {
  return `${PINATA_GATEWAY_BASE}/${cid}?pinataGatewayToken=${PINATA_GATEWAY_TOKEN}`;
}

// Simple prompt building - inspired by avatar generation
function buildClothingPrompt(templateInfo: ClothingTemplateInfo): string {
  // Keep it simple and short - just the clothing type and universe style
  return `Stylized ${templateInfo.name} for Nocena universe, futuristic design`;
}

// Verify template URL is accessible
async function verifyTemplateUrl(url: string): Promise<boolean> {
  try {
    const response = await fetch(url, { method: 'HEAD' });
    const contentType = response.headers.get('content-type') || '';
    return response.ok && (contentType.includes('image/jpeg') || contentType.includes('image/png'));
  } catch (error) {
    console.warn('Template URL verification failed:', error);
    return false;
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Use existing params structure or fallback to direct params
    const {
      userID,
      completionId,
      templateType,
      model = 'velogen',
      width = 512,
      height = 512,
      steps = 2,
      enhance = '2x',
    } = req.body;

    // If using prepareClothingNFTParams structure from service
    let finalTemplateType = templateType;
    if (req.body.templateInfo && !templateType) {
      finalTemplateType = req.body.templateInfo.type;
    }

    if (!userID || !completionId) {
      return res.status(400).json({
        error: 'Missing required fields: userID and completionId',
      });
    }

    if (!process.env.CHAINGPT_API_KEY) {
      return res.status(500).json({ error: 'ChainGPT API key not configured' });
    }

    // Get template information - either from params or select random if not provided
    let templateInfo: ClothingTemplateInfo;
    if (finalTemplateType) {
      const template = getClothingTemplate(finalTemplateType as ClothingTemplate);
      if (!template) {
        return res.status(400).json({ error: `Invalid template type: ${finalTemplateType}` });
      }
      templateInfo = template;
    } else {
      // Use existing random selection logic
      templateInfo = selectRandomClothingTemplate();
      finalTemplateType = templateInfo.type;
    }

    // Get the appropriate clothing template CID
    const templateCID = getClothingTemplateCID(finalTemplateType);
    if (!templateCID) {
      return res.status(400).json({
        error: `No template available for clothing type: ${finalTemplateType}. Available types: cap, hoodie, pants, shoes`,
      });
    }

    // Build the template URL
    const templateUrl = buildClothingTemplateUrl(templateCID);

    // Verify template is accessible
    const templateAccessible = await verifyTemplateUrl(templateUrl);
    if (!templateAccessible) {
      console.warn(`Template URL not accessible: ${templateUrl}, continuing with generation...`);
    }

    const nft = new Nft({ apiKey: process.env.CHAINGPT_API_KEY });

    // Simple prompt - no long descriptions
    const finalPrompt = buildClothingPrompt(templateInfo);

    console.log('👕 Clothing Reward Generation Details:');
    console.log('   User ID:', userID);
    console.log('   Completion ID:', completionId);
    console.log('   Template Type:', finalTemplateType);
    console.log('   Template CID:', templateCID);
    console.log('   Template URL:', templateUrl);
    console.log('   Final Prompt:', finalPrompt);

    // Generate clothing using image-to-image with the real model template
    const imgResp = await nft.generateImage({
      prompt: finalPrompt,
      model,
      height,
      width,
      steps,
      enhance,
      image: templateUrl, // Use the real clothing model from Pinata
      isCharacterPreserve: true, // Maintain clothing style consistency
      style: '3d-model', // Enforce 3D style matching Nocena universe
      traits: [
        {
          trait_type: 'Style',
          value: [
            { value: 'nocena-universe', ratio: 50 },
            { value: 'futuristic', ratio: 30 },
            { value: 'cyberpunk', ratio: 20 },
          ],
        },
        {
          trait_type: 'Clothing_Type',
          value: [{ value: templateInfo.type, ratio: 100 }],
        },
        {
          trait_type: 'Rarity',
          value: [{ value: templateInfo.rarity, ratio: 100 }],
        },
      ],
    } as any);

    console.log('📊 ChainGPT Clothing Response structure:', {
      hasData: !!imgResp?.data,
      dataKeys: imgResp?.data ? Object.keys(imgResp.data) : [],
      dataType: typeof imgResp?.data?.data,
      isArray: Array.isArray(imgResp?.data?.data),
      length: imgResp?.data?.data?.length,
    });

    // Handle the response data properly - convert object to array if needed
    let bytes: number[];
    const responseData = imgResp?.data?.data;

    if (!responseData) {
      throw new Error('Missing image data from generateImage()');
    }

    // Check if it's already an array
    if (Array.isArray(responseData)) {
      bytes = responseData;
    } else if (typeof responseData === 'object' && responseData.length !== undefined) {
      // Convert object with array-like properties to actual array
      bytes = Object.values(responseData) as number[];
    } else {
      console.error('❌ Invalid response format from ChainGPT:', {
        response: imgResp,
        dataExists: !!imgResp?.data,
        responseDataType: typeof responseData,
        isArray: Array.isArray(responseData),
        hasLength: 'length' in responseData,
      });
      throw new Error('Invalid image data format from generateImage()');
    }

    if (!bytes || bytes.length === 0) {
      throw new Error('Empty or invalid image bytes from generateImage()');
    }

    const u8 = new Uint8Array(bytes);
    console.log('👕 Clothing image bytes length:', u8.length);

    if (u8.length === 0) {
      throw new Error('Received empty image data from ChainGPT');
    }

    // Convert to base64 data URL (same as avatar generation)
    console.log('📦 Converting clothing image to base64 data URL...');
    const base64String = Buffer.from(u8).toString('base64');
    const dataUrl = `data:image/jpeg;base64,${base64String}`;

    console.log('✅ Generated clothing reward successfully');

    return res.status(200).json({
      success: true,
      message: `${templateInfo.name} clothing reward generated successfully`,
      clothingInfo: {
        type: templateInfo.type,
        name: templateInfo.name,
        description: templateInfo.description,
        rarity: templateInfo.rarity,
        templateCID: templateCID,
        templateUrl: templateUrl,
      },
      generation: {
        promptUsed: finalPrompt,
        imageBytesLen: u8.length,
        imageUrl: dataUrl,
        userID: userID,
        completionId: completionId,
      },
      features: {
        modelUsed: model,
        templateBased: true,
        realModelReference: true,
        pinataBased: true,
      },
      debug: {
        templateAccessible: templateAccessible,
        templateVerified: templateAccessible,
        templateType: finalTemplateType,
        cidUsed: templateCID,
      },
    });
  } catch (error: any) {
    console.error('❌ Clothing reward generation error:', error);

    // Enhanced error handling
    if (error?.response) {
      console.error('ChainGPT API Error Response:', {
        status: error.response.status,
        statusText: error.response.statusText,
        data: error.response.data,
      });
    }

    const details = error?.response?.data
      ? typeof error.response.data === 'string'
        ? error.response.data
        : JSON.stringify(error.response.data, null, 2)
      : error?.message || 'Unknown error';

    return res.status(500).json({
      error: 'Failed to generate clothing reward',
      details,
      clothingType: req.body?.templateType,
    });
  }
}
