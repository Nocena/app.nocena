// src/pages/api/chainGPT/generate-clothing-reward.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { Nft } from '@chaingpt/nft';

// Pinata gateway base URL with token
const PINATA_GATEWAY_BASE = 'https://jade-elaborate-emu-349.mypinata.cloud/ipfs';
const PINATA_GATEWAY_TOKEN = 'XQTlgcFp9rPCXpkx3GkP5M28RfBWRUUwaUwF2H_SCyA3TiFZvm-ssBVMLgIRVz9G';

// Updated clothing template CIDs structure with rarity tiers
const CLOTHING_TEMPLATE_CIDS = {
  cap: {
    common: 'bafkreig444pmdgcn7fwmi5df3pn2yat5dyuw376a7sozre33yy45lwq324',
    uncommon: 'bafkreidb2kumxusslxefqkud4vu4fmlidbqt4v5q5t7cm4zm3pimimwvdu',
    rare: 'bafkreigyieybtiubrziy3amxqfq27gsykrzixaa27dqt3b43ntmq3i57ia',
    epic: 'bafkreihgl4qome6i6lv5uyrzs5txz3rdt6v343tyszjzkyrbz2skjpferm',
    legendary: 'bafkreig5g6zotc2ss6h6nslrzb2wu2tfcj3axsoyslgptdbmhzudxc4n7e',
  },
  hoodie: {
    common: 'bafkreidvx3kr45yav2ftgjyp7jhwhfxd3fnmrxgsm7k7b73fy73amrbxwy',
    uncommon: 'bafkreia77gimbce77keuq5lne3vpo5g7zq36z7kd3ea2q7lxrheilt7kq4',
    rare: 'bafkreicjijihfbohmridjqpbytyza4zldlrpi6bl5idxemoelkqroqjs7u',
    epic: 'bafkreido3c4mstt4nqdnpbrfxnikipszuvqraam6ckvgvquu4rmychfopi',
    legendary: 'bafkreicjefdkizpnfvwi4heeulntas2muevrqoajt66koz3ciwlnrousx4',
  },
  pants: {
    common: 'bafkreihbedw3sr6y6gxwiwjzeo72c6hxwd4dg7gsptl3tqzb3c7gttesei',
    uncommon: 'bafkreiczi5wsjf37ve3ojusn4s2rytsqmal6p6ikxxyzzzmxq3mc2tuare',
    rare: 'bafkreifdeqexg3gf2qxfojuo4ans77rqaz4nunbflaelsrl3fhx3hyu4yi',
    epic: 'bafkreidogum2o6rdlk23xwbax6ltu2bcdnwuhgk633dpsbpvsxfuj2x4nm',
    legendary: 'bafkreifombz762rthg5cnwrqpjo2do7cds5crsm7ht5jfhth53zlc7nnca',
  },
  shoes: {
    common: 'bafkreihgonzr4bwxcfnf2emwuyi75iurflhjgaswjwexik7t5hetiu542m',
    uncommon: 'bafkreihdbubyclkjagx4pi44nahv2ewqu2sf3qikwtg5kvsdrbarcgtnoy',
    rare: 'bafkreigb4infyxbnmjoulavsbsv5qrbz4l5sbhr5zbobpx4uq7rj2ozy44',
    epic: 'bafkreibiah7xmep3gq52piml6mpvboo36cuntraoeoiufzewqwwcqcvm2q',
    legendary: 'bafkreigxz2armcnqh5toqshsysee2sjfrnkifrhr5cxeao42rgwy36sqey',
  },
} as const;

// Item drop weights (Cap 30%, Hoodie 25%, Pants 25%, Shoes 20%)
const ITEM_DROP_WEIGHTS = {
  cap: 30,
  hoodie: 25,
  pants: 25,
  shoes: 20,
} as const;

// Rarity drop weights (Common 50%, Uncommon 25%, Rare 15%, Epic 8%, Legendary 2%)
const RARITY_DROP_WEIGHTS = {
  common: 50,
  uncommon: 25,
  rare: 15,
  epic: 8,
  legendary: 2,
} as const;

// Token bonus table
const TOKEN_BONUS_TABLE = {
  cap: { common: 5, uncommon: 12, rare: 25, epic: 50, legendary: 120 },
  hoodie: { common: 5, uncommon: 12, rare: 25, epic: 50, legendary: 110 },
  pants: { common: 5, uncommon: 12, rare: 25, epic: 50, legendary: 105 },
  shoes: { common: 10, uncommon: 20, rare: 35, epic: 75, legendary: 150 },
} as const;

type ItemType = keyof typeof ITEM_DROP_WEIGHTS;
type RarityType = keyof typeof RARITY_DROP_WEIGHTS;

// Weighted random selection function
function weightedRandom<T extends string>(weights: Record<T, number>): T {
  let totalWeight = 0;
  for (const key in weights) {
    totalWeight += weights[key];
  }

  let random = Math.random() * totalWeight;

  for (const key in weights) {
    random -= weights[key];
    if (random <= 0) {
      return key;
    }
  }

  return Object.keys(weights)[0] as T;
}

// Generate random item and rarity
function generateRandomItemAndRarity(): { itemType: ItemType; rarity: RarityType } {
  const itemType = weightedRandom(ITEM_DROP_WEIGHTS);
  const rarity = weightedRandom(RARITY_DROP_WEIGHTS);
  return { itemType, rarity };
}

// Get clothing template CID for specific item and rarity
function getClothingTemplateCID(itemType: ItemType, rarity: RarityType): string {
  return CLOTHING_TEMPLATE_CIDS[itemType][rarity];
}

// Get token bonus for item and rarity combination
function getTokenBonus(itemType: ItemType, rarity: RarityType): number {
  return TOKEN_BONUS_TABLE[itemType][rarity];
}

// Build the full Pinata URL for a clothing template
function buildClothingTemplateUrl(cid: string): string {
  return `${PINATA_GATEWAY_BASE}/${cid}?pinataGatewayToken=${PINATA_GATEWAY_TOKEN}`;
}

// Refined prompt engineering for subtle template modification
function buildClothingPrompt(
  itemType: ItemType,
  rarity: RarityType,
  challengeTitle: string,
  challengeDescription: string,
): string {
  // Rarity-based subtle effects that don't overwhelm the template
  const rarityEnhancements = {
    common: 'clean, well-crafted appearance',
    uncommon: 'subtle green accent details and refined finish',
    rare: 'elegant blue highlights and enhanced material quality',
    epic: 'sophisticated purple accents with premium detailing',
    legendary: 'luxurious golden touches and masterful craftsmanship',
  };

  // Focus on enhancement rather than transformation
  return `Enhance this ${itemType} while preserving its original structure and silhouette. Add ${rarityEnhancements[rarity]} that reflects the challenge "${challengeTitle}". Incorporate subtle thematic elements inspired by: ${challengeDescription}. Focus on texture improvements, small decorative accents, and premium finishing touches rather than major structural changes. The item should remain clearly recognizable as the original ${itemType} with tasteful enhancements.`;
}

// Verify template URL is accessible
async function verifyTemplateUrl(url: string): Promise<boolean> {
  try {
    const response = await fetch(url, { method: 'HEAD' });
    const contentType = response.headers.get('content-type') || '';
    return response.ok && (contentType.includes('image/jpeg') || contentType.includes('image/png'));
  } catch (error) {
    console.warn('🟨 Template URL verification failed:', error);
    return false;
  }
}

// Generate item display name
function generateItemName(itemType: ItemType, rarity: RarityType): string {
  const rarityNames = {
    common: 'Common',
    uncommon: 'Uncommon',
    rare: 'Rare',
    epic: 'Epic',
    legendary: 'Legendary',
  };

  const itemNames = {
    cap: 'Cap',
    hoodie: 'Hoodie',
    pants: 'Pants',
    shoes: 'Shoes',
  };

  return `${rarityNames[rarity]} ${itemNames[itemType]}`;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  console.log('🟦 === CLOTHING REWARD GENERATION STARTED ===');
  
  if (req.method !== 'POST') {
    console.log('🟥 ERROR: Method not allowed -', req.method);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('🟩 Step 1: Parsing request body...');
    const {
      userID,
      completionId,
      challengeTitle = 'Challenge',
      challengeDescription = 'Complete this challenge',
      forceItemType,
      forceRarity,
      model = 'velogen',
      width = 512,
      height = 512,
      steps = 4,
      enhance = '4x',
    } = req.body;

    console.log('🟩 Request body parsed successfully:', {
      userID,
      completionId,
      challengeTitle,
      challengeDescription: challengeDescription.slice(0, 50) + '...',
      forceItemType,
      forceRarity,
      model,
      width,
      height,
      steps,
      enhance,
    });

    if (!userID || !completionId) {
      console.log('🟥 ERROR: Missing required fields - userID:', !!userID, 'completionId:', !!completionId);
      return res.status(400).json({
        error: 'Missing required fields: userID and completionId',
      });
    }

    console.log('🟩 Step 2: Checking environment variables...');
    const hasApiKey = !!process.env.CHAINGPT_API_KEY;
    console.log('🟩 ChainGPT API key present:', hasApiKey);
    if (!hasApiKey) {
      console.log('🟥 ERROR: ChainGPT API key not configured');
      return res.status(500).json({ error: 'ChainGPT API key not configured' });
    }

    console.log('🟩 Step 3: Generating item type and rarity...');
    // Generate or use forced item type and rarity
    const { itemType, rarity } =
      forceItemType && forceRarity
        ? { itemType: forceItemType as ItemType, rarity: forceRarity as RarityType }
        : generateRandomItemAndRarity();

    console.log('🟩 Generated/Selected:', { itemType, rarity, forced: !!(forceItemType && forceRarity) });

    console.log('🟩 Step 4: Getting template data...');
    // Get template CID and token bonus
    const templateCID = getClothingTemplateCID(itemType, rarity);
    const tokenBonus = getTokenBonus(itemType, rarity);
    const itemName = generateItemName(itemType, rarity);

    console.log('🟩 Template data retrieved:', {
      templateCID,
      tokenBonus,
      itemName,
    });

    console.log('🟩 Step 5: Building template URL...');
    // Build the template URL
    const templateUrl = buildClothingTemplateUrl(templateCID);
    console.log('🟩 Template URL built:', templateUrl);

    console.log('🟩 Step 6: Verifying template accessibility...');
    // Verify template is accessible
    const templateAccessible = await verifyTemplateUrl(templateUrl);
    console.log('🟩 Template accessible:', templateAccessible);
    if (!templateAccessible) {
      console.log('🟨 WARNING: Template URL not accessible, continuing with generation...');
    }

    console.log('🟩 Step 7: Initializing ChainGPT NFT instance...');
    const nft = new Nft({ apiKey: process.env.CHAINGPT_API_KEY! });
    console.log('🟩 ChainGPT NFT instance created successfully');

    console.log('🟩 Step 8: Building generation prompt...');
    // Build prompt with simplified approach
    const finalPrompt = buildClothingPrompt(itemType, rarity, challengeTitle, challengeDescription);
    console.log('🟩 Final prompt created (length: ' + finalPrompt.length + ')');
    console.log('🟦 Prompt preview:', finalPrompt.slice(0, 100) + '...');

    console.log('🟩 Step 9: Preparing generation parameters...');
    const generationParams = {
      prompt: finalPrompt,
      model,
      height,
      width,
      steps: 2, // Keep low for consistency like avatar
      enhance,
      image: templateUrl,
      strength: 0.1, // Moderate strength - not too high
      isCharacterPreserve: true, // Keep template structure like avatar
      style: '3d-model',
      traits: [
        {
          trait_type: 'Style',
          value: [
            { value: rarity, ratio: 50 }, // Rarity as primary style
            { value: 'premium-details', ratio: 30 },
            { value: 'thematic', ratio: 20 },
          ],
        },
        {
          trait_type: 'Theme_Adaptation',
          value: [{ value: challengeTitle.toLowerCase(), ratio: 60 }], // Lower ratio for subtlety
        },
        {
          trait_type: 'Detail_Level',
          value: [
            { value: 'enhanced-textures', ratio: 40 },
            { value: 'subtle-patterns', ratio: 35 },
            { value: 'premium-finish', ratio: 25 },
          ],
        },
        {
          trait_type: 'Color_Scheme',
          value: [
            { value: `${rarity}-palette`, ratio: 70 },
            { value: 'thematic-accents', ratio: 30 },
          ],
        },
      ],
    };

    console.log('🟩 Generation parameters prepared:', {
      ...generationParams,
      prompt: '[PROMPT_READY]',
      traits: '[TRAITS_READY]'
    });

    console.log('🟦 Step 10: Calling ChainGPT generateImage...');
    console.log('🟦 About to call nft.generateImage with params...');
    console.log('🟦 Generation params summary:', {
      prompt_length: finalPrompt.length,
      model,
      width,
      height,
      steps: 2,
      enhance,
      template_url_length: templateUrl.length,
      strength: 0.1,
      isCharacterPreserve: true,
      style: '3d-model'
    });
    
    let imgResp;
    try {
      imgResp = await nft.generateImage(generationParams as any);
      console.log('🟩 ChainGPT generateImage API call completed!');
    } catch (apiError: any) {
      console.log('🟥 ERROR: ChainGPT generateImage API call failed:', apiError);
      console.log('🟥 API Error type:', typeof apiError);
      console.log('🟥 API Error message:', apiError?.message);
      console.log('🟥 API Error response:', apiError?.response);
      throw apiError;
    }
    console.log('🟩 Response received, analyzing structure...');
    console.log('🟦 imgResp type:', typeof imgResp);
    console.log('🟦 imgResp keys:', imgResp ? Object.keys(imgResp) : 'null/undefined');

    if (imgResp?.data) {
      console.log('🟩 imgResp.data exists, keys:', Object.keys(imgResp.data));
      console.log('🟦 imgResp.data.data type:', typeof imgResp.data.data);
    } else {
      console.log('🟨 WARNING: imgResp.data is missing or falsy');
    }

    console.log('🟩 Step 11: Processing image data...');
    // Handle the response data
    let bytes: number[];
    const responseData = imgResp?.data?.data;

    console.log('🟦 responseData extracted, type:', typeof responseData);
    console.log('🟦 responseData is array:', Array.isArray(responseData));
    console.log('🟦 responseData length/size:', responseData?.length || 'no length property');

    if (!responseData) {
      console.log('🟥 ERROR: Missing image data from generateImage()');
      throw new Error('Missing image data from generateImage()');
    }

    if (Array.isArray(responseData)) {
      console.log('🟩 Processing as array, length:', responseData.length);
      bytes = responseData;
    } else if (typeof responseData === 'object' && responseData.length !== undefined) {
      console.log('🟩 Processing as object with length, converting to array...');
      bytes = Object.values(responseData) as number[];
      console.log('🟩 Converted to array, new length:', bytes.length);
    } else {
      console.log('🟥 ERROR: Invalid image data format:', typeof responseData);
      console.log('🟥 responseData sample:', responseData);
      throw new Error('Invalid image data format from generateImage()');
    }

    console.log('🟩 Step 12: Validating bytes array...');
    if (!bytes || bytes.length === 0) {
      console.log('🟥 ERROR: Empty or invalid bytes - length:', bytes?.length);
      throw new Error('Empty or invalid image bytes from generateImage()');
    }

    console.log('🟩 Bytes validation passed, creating Uint8Array...');
    const u8 = new Uint8Array(bytes);
    console.log('🟩 Uint8Array created, length:', u8.length);

    if (u8.length === 0) {
      console.log('🟥 ERROR: Received empty image data from ChainGPT');
      throw new Error('Received empty image data from ChainGPT');
    }

    console.log('🟩 Step 13: Converting to base64...');
    // Convert to base64 data URL
    const base64String = Buffer.from(u8).toString('base64');
    const dataUrl = `data:image/jpeg;base64,${base64String}`;
    console.log('🟩 Base64 conversion completed, length:', base64String.length);

    console.log('🟩 === CLOTHING REWARD GENERATION COMPLETED SUCCESSFULLY ===');
    console.log('🟩 Final summary:');
    console.log('   📊 Item:', itemName);
    console.log('   📊 Token bonus:', tokenBonus + '%');
    console.log('   📊 Image size:', u8.length, 'bytes');
    console.log('   📊 Base64 length:', base64String.length, 'chars');

    return res.status(200).json({
      success: true,
      message: `${itemName} clothing reward generated successfully`,
      clothingInfo: {
        type: itemType,
        name: itemName,
        description: `A ${rarity} ${itemType} with +${tokenBonus}% token bonus`,
        rarity: rarity,
        tokenBonus: tokenBonus,
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
        raritySystem: true,
      },
      debug: {
        templateAccessible: templateAccessible,
        templateType: itemType,
        rarityGenerated: rarity,
        tokenBonusCalculated: tokenBonus,
        cidUsed: templateCID,
      },
    });
  } catch (error: any) {
    console.log('🟥 === ERROR OCCURRED ===');
    console.error('🟥 Clothing reward generation error:', error);
    console.log('🟥 Error type:', typeof error);
    console.log('🟥 Error name:', error?.name);
    console.log('🟥 Error message:', error?.message);
    console.log('🟥 Error stack:', error?.stack);

    if (error?.response) {
      console.log('🟥 ChainGPT API Error Response detected:');
      console.error('🟥 Status:', error.response.status);
      console.error('🟥 Status text:', error.response.statusText);
      console.error('🟥 Response data:', error.response.data);
      console.error('🟥 Response headers:', error.response.headers);
    } else {
      console.log('🟨 No response object in error');
    }

    const details = error?.response?.data
      ? typeof error.response.data === 'string'
        ? error.response.data
        : JSON.stringify(error.response.data, null, 2)
      : error?.message || 'Unknown error';

    console.log('🟥 Final error details to return:', details);

    return res.status(500).json({
      error: 'Failed to generate clothing reward',
      details,
      debugInfo: {
        errorType: typeof error,
        errorName: error?.name,
        hasResponseObject: !!error?.response,
        timestamp: new Date().toISOString(),
      }
    });
  }
}