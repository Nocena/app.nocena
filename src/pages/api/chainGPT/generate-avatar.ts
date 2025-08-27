import type { NextApiRequest, NextApiResponse } from 'next';
import { Nft } from '@chaingpt/nft';

// ENV needed:
// - CHAINGPT_API_KEY     (ChainGPT API key)
// - PINATA_JWT           (Pinata JWT: "Bearer eyJhbGciOi..." )

type Ok = {
  success: true;
  promptUsed: string;
  imageBytesLen: number;
  ipfsCid: string;
  ipfsUrl: string;
};

type Err = {
  success: false;
  error: string;
  details?: any;
};

// Use ChainGPT's official example template to avoid Pinata gateway limits
const JPG_TEMPLATE_URL =
  'https://jade-elaborate-emu-349.mypinata.cloud/ipfs/bafkreidlqrkzhi7r2pm75fnul5fi5cnprrz6tnuq5nftdemvmb4nbarxlu?pinataGatewayToken=XQTlgcFp9rPCXpkx3GkP5M28RfBWRUUwaUwF2H_SCyA3TiFZvm-ssBVMLgIRVz9G';

// Enhanced prompt building with better customization
function buildPrompt(customPrompt: string, profileUrl?: string) {
  // Parse the custom prompt to maintain Nocena universe constraints
  const baseConstraints = [
    'Keep the same pose and outfit style as the reference template',
    'Maintain 3D stylized art style consistent with Nocena universe',
    'Ensure the character fits within futuristic/cyberpunk aesthetic',
  ];

  const faceConstraints = [
    'detailed human face with clear facial features',
    'visible eyes, nose, and mouth',
    'well-defined facial structure',
    'expressive facial features that match the character style',
    'face must be clearly visible and detailed',
    'no blank or missing facial features',
    'human-like face with proper proportions',
  ];

  // Clean and validate custom prompt
  const cleanedPrompt = customPrompt
    .trim()
    .replace(/[^\w\s,.-]/g, '') // Remove special characters that might break generation
    .substring(0, 500); // Limit length

  // Build the final prompt with proper structure
  const promptParts: string[] = [
    cleanedPrompt || 'Create a stylized 3D avatar for the Nocena universe',
    ...baseConstraints,
    ...faceConstraints,
  ];

  if (profileUrl) {
    promptParts.push('Adapt facial features to match the provided profile reference');
  }

  return promptParts.join('. ');
}

// Validate prompt to ensure it stays within Nocena universe guidelines
function validatePrompt(prompt: string): { valid: boolean; reason?: string } {
  const lowerPrompt = prompt.toLowerCase();

  // Blocked terms that would break the Nocena aesthetic
  const blockedTerms = [
    'realistic',
    'photorealistic',
    'photograph',
    'real person',
    'nude',
    'naked',
    'sexual',
    'gore',
    'violence',
    'disney',
    'cartoon',
    'anime',
    'manga', // Style conflicts
  ];

  const hasBlockedTerm = blockedTerms.some((term) => lowerPrompt.includes(term));
  if (hasBlockedTerm) {
    return {
      valid: false,
      reason: 'Prompt contains terms that conflict with Nocena universe style guidelines',
    };
  }

  // Check for minimum meaningful content
  if (prompt.trim().length < 10) {
    return {
      valid: false,
      reason: 'Prompt too short - please provide more detail',
    };
  }

  // Check for maximum length
  if (prompt.length > 500) {
    return {
      valid: false,
      reason: 'Prompt too long - please keep under 500 characters',
    };
  }

  return { valid: true };
}

async function headIsJpeg(url: string) {
  try {
    const r = await fetch(url, { method: 'HEAD' });
    const ct = r.headers.get('content-type') || '';
    return r.ok && ct.includes('image/jpeg');
  } catch {
    return false;
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse<Ok | Err>) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const {
      prompt: customPrompt, // User's custom prompt
      profilePicture, // optional URL/data URI; only used to inform the text prompt
      model = 'velogen',
      width = 512,
      height = 512,
      steps = 2,
      enhance = 'original', // 'original' | '1x' | '2x'
    } = req.body || {};

    if (!customPrompt) {
      return res.status(400).json({ success: false, error: 'Missing custom prompt' });
    }

    if (!process.env.CHAINGPT_API_KEY) {
      return res.status(500).json({ success: false, error: 'CHAINGPT_API_KEY not configured' });
    }

    // Validate the custom prompt
    const validation = validatePrompt(customPrompt);
    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        error: `Invalid prompt: ${validation.reason}`,
      });
    }

    // Sanity: template must be accessible and JPEG
    const jpegOk = await headIsJpeg(JPG_TEMPLATE_URL);
    if (!jpegOk) {
      console.warn('Template URL check failed, but continuing with generation...');
    }

    const nft = new Nft({ apiKey: process.env.CHAINGPT_API_KEY });

    const finalPrompt = buildPrompt(customPrompt, typeof profilePicture === 'string' ? profilePicture : undefined);
    console.log('✨ Final Enhanced Prompt:', finalPrompt);

    // ------ STEP 1: Enhanced image-to-image with custom prompt ------
    console.log('🎨 Starting custom avatar generation with template:', JPG_TEMPLATE_URL);

    const imgResp = await nft.generateImage({
      prompt: finalPrompt,
      model, // e.g. 'velogen'
      height,
      width,
      steps,
      enhance, // 'original' | '1x' | '2x'
      image: JPG_TEMPLATE_URL, // Template JPG from ChainGPT S3
      isCharacterPreserve: true, // Maintain character consistency
      style: '3d-model', // Enforce 3D style
      traits: [
        {
          trait_type: 'Style',
          value: [
            { value: 'futuristic', ratio: 40 },
            { value: 'cyberpunk', ratio: 30 },
            { value: 'tech', ratio: 20 },
            { value: 'custom', ratio: 10 }, // Allow some customization
          ],
        },
        {
          trait_type: 'Pose',
          value: [{ value: 'standing', ratio: 100 }],
        },
        {
          trait_type: 'Background',
          value: [
            { value: 'tech-gradient', ratio: 50 },
            { value: 'futuristic', ratio: 30 },
            { value: 'cyberpunk', ratio: 20 },
          ],
        },
        // NEW: Add dynamic traits based on custom prompt keywords
        ...(customPrompt.toLowerCase().includes('magic') || customPrompt.toLowerCase().includes('fantasy')
          ? [
              {
                trait_type: 'Effects',
                value: [{ value: 'magical-aura', ratio: 100 }],
              },
            ]
          : []),
        ...(customPrompt.toLowerCase().includes('robot') || customPrompt.toLowerCase().includes('android')
          ? [
              {
                trait_type: 'Tech_Level',
                value: [{ value: 'high-tech', ratio: 100 }],
              },
            ]
          : []),
      ],
    } as any);

    console.log('📊 ChainGPT Response structure:', {
      hasData: !!imgResp?.data,
      dataKeys: imgResp?.data ? Object.keys(imgResp.data) : [],
      dataType: typeof imgResp?.data?.data,
      isArray: Array.isArray(imgResp?.data?.data),
      length: imgResp?.data?.data?.length,
    });

    const bytes: number[] = imgResp?.data?.data;
    if (!bytes || !Array.isArray(bytes)) {
      console.error('❌ Invalid response from ChainGPT:', {
        response: imgResp,
        dataExists: !!imgResp?.data,
        bytesType: typeof bytes,
        isArray: Array.isArray(bytes),
      });
      throw new Error('Missing or invalid image bytes from generateImage()');
    }

    const u8 = new Uint8Array(bytes);
    console.log('🖼️  Image bytes length:', u8.length);

    if (u8.length === 0) {
      throw new Error('Received empty image data from ChainGPT');
    }

    // ------ STEP 2: Return base64 data URL (or implement IPFS upload) ------
    console.log('📦 Converting to base64 data URL...');
    const base64String = Buffer.from(u8).toString('base64');
    const dataUrl = `data:image/jpeg;base64,${base64String}`;

    console.log('✅ Generated custom avatar successfully, length:', dataUrl.length);

    return res.status(200).json({
      success: true,
      promptUsed: finalPrompt,
      imageBytesLen: u8.length,
      ipfsCid: 'temp-base64',
      ipfsUrl: dataUrl,
    });
  } catch (err: any) {
    console.error('❌ Custom avatar generation error:', err);

    // Enhanced error handling for custom prompts
    if (err?.response) {
      console.error('ChainGPT API Error Response:', {
        status: err.response.status,
        statusText: err.response.statusText,
        data: err.response.data,
        headers: err.response.headers,
      });
    }

    if (err?.isNftError) {
      console.error('NftError details:', {
        name: err.name,
        message: err.message,
        stack: err.stack,
        cause: err.cause,
      });
    }

    const details = err?.response?.data
      ? typeof err.response.data === 'string'
        ? err.response.data
        : JSON.stringify(err.response.data, null, 2)
      : err?.message || 'Unknown error';

    return res.status(500).json({
      success: false,
      error: 'Failed to generate custom avatar',
      details,
    });
  }
}
