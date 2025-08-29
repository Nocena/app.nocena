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
    console.warn('Template URL verification failed:', error);
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
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
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

    if (!userID || !completionId) {
      return res.status(400).json({
        error: 'Missing required fields: userID and completionId',
      });
    }

    if (!process.env.CHAINGPT_API_KEY) {
      return res.status(500).json({ error: 'ChainGPT API key not configured' });
    }

    // Generate or use forced item type and rarity
    const { itemType, rarity } =
      forceItemType && forceRarity
        ? { itemType: forceItemType as ItemType, rarity: forceRarity as RarityType }
        : generateRandomItemAndRarity();

    // Get template CID and token bonus
    const templateCID = getClothingTemplateCID(itemType, rarity);
    const tokenBonus = getTokenBonus(itemType, rarity);
    const itemName = generateItemName(itemType, rarity);

    // Build the template URL
    const templateUrl = buildClothingTemplateUrl(templateCID);

    // Verify template is accessible
    const templateAccessible = await verifyTemplateUrl(templateUrl);
    if (!templateAccessible) {
      console.warn(`Template URL not accessible: ${templateUrl}, continuing with generation...`);
    }

    const nft = new Nft({ apiKey: process.env.CHAINGPT_API_KEY });

    // Build prompt with simplified approach
    const finalPrompt = buildClothingPrompt(itemType, rarity, challengeTitle, challengeDescription);

    console.log('Clothing Reward Generation Details:');
    console.log('   User ID:', userID);
    console.log('   Completion ID:', completionId);
    console.log('   Challenge:', challengeTitle);
    console.log('   Item Type:', itemType);
    console.log('   Rarity:', rarity);
    console.log('   Token Bonus:', tokenBonus + '%');
    console.log('   Final Prompt:', finalPrompt);

    // Balanced generation parameters inspired by avatar approach
    const imgResp = await nft.generateImage({
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
    } as any);

    // Handle the response data
    let bytes: number[];
    const responseData = imgResp?.data?.data;

    if (!responseData) {
      throw new Error('Missing image data from generateImage()');
    }

    if (Array.isArray(responseData)) {
      bytes = responseData;
    } else if (typeof responseData === 'object' && responseData.length !== undefined) {
      bytes = Object.values(responseData) as number[];
    } else {
      throw new Error('Invalid image data format from generateImage()');
    }

    if (!bytes || bytes.length === 0) {
      throw new Error('Empty or invalid image bytes from generateImage()');
    }

    const u8 = new Uint8Array(bytes);

    if (u8.length === 0) {
      throw new Error('Received empty image data from ChainGPT');
    }

    // Convert to base64 data URL
    const base64String = Buffer.from(u8).toString('base64');
    const dataUrl = `data:image/jpeg;base64,${base64String}`;

    console.log('Generated clothing reward successfully');

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
    console.error('Clothing reward generation error:', error);

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
    });
  }
}