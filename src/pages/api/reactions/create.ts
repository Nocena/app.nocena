// pages/api/reactions/create.ts - FIXED to use existing dgraph functions
import { NextApiRequest, NextApiResponse } from 'next';
import formidable from 'formidable';
import fs from 'fs';

// Import your existing functions from dgraph.ts
import { createRealMojiReaction, uploadRealMojiToIPFS } from '../../../lib/api/dgraph';

// Disable default body parser to handle multipart/form-data
export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('🎭 [API] Starting RealMoji creation...');

    // Parse the multipart form data
    const form = formidable({
      maxFileSize: 10 * 1024 * 1024, // 10MB limit
      maxFields: 10,
      multiples: false,
    });

    const [fields, files] = await form.parse(req);

    // Extract form fields
    const userId = Array.isArray(fields.userId) ? fields.userId[0] : fields.userId;
    const completionId = Array.isArray(fields.completionId) ? fields.completionId[0] : fields.completionId;
    const reactionType = Array.isArray(fields.reactionType) ? fields.reactionType[0] : fields.reactionType;

    // Get the uploaded file
    const imageFile = Array.isArray(files.image) ? files.image[0] : files.image;

    console.log('🎭 [API] Received form data:', {
      userId,
      completionId,
      reactionType,
      hasImageFile: !!imageFile,
      imageFileSize: imageFile?.size,
      imageFileMimeType: imageFile?.mimetype,
    });

    // Validate required fields
    if (!userId || !completionId || !reactionType) {
      return res.status(400).json({
        error: 'Missing required fields',
        required: ['userId', 'completionId', 'reactionType', 'image'],
        received: { userId: !!userId, completionId: !!completionId, reactionType: !!reactionType, image: !!imageFile },
      });
    }

    if (!imageFile) {
      return res.status(400).json({
        error: 'No image file uploaded',
      });
    }

    // Validate file type
    if (!imageFile.mimetype?.startsWith('image/')) {
      return res.status(400).json({
        error: 'Invalid file type. Only images are allowed.',
        receivedType: imageFile.mimetype,
      });
    }

    // Validate reaction type
    const validReactionTypes = ['thumbsUp', 'love', 'shocked', 'curious', 'fire', 'sad'];
    if (!validReactionTypes.includes(reactionType)) {
      return res.status(400).json({
        error: 'Invalid reaction type',
        validTypes: validReactionTypes,
        received: reactionType,
      });
    }

    console.log('🎭 [API] Validation passed, processing image...');

    // Read the file and convert to Blob
    const fileBuffer = fs.readFileSync(imageFile.filepath);
    const imageBlob = new Blob([fileBuffer], { type: imageFile.mimetype });

    console.log('🎭 [API] Image blob created:', {
      size: imageBlob.size,
      type: imageBlob.type,
    });

    // Step 1: Upload the selfie to IPFS using your existing function
    console.log('🎭 [API] Uploading RealMoji selfie to IPFS...');
    const selfieCID = await uploadRealMojiToIPFS(imageBlob, reactionType);
    console.log('🎭 [API] IPFS upload successful:', selfieCID);

    // Step 2: Create the reaction in the database using your existing function
    console.log('🎭 [API] Creating reaction in database...');
    const reactionId = await createRealMojiReaction(userId, completionId, reactionType, selfieCID);
    console.log('🎭 [API] Database creation successful:', reactionId);

    // Clean up the temporary file
    try {
      fs.unlinkSync(imageFile.filepath);
      console.log('🎭 [API] Temporary file cleaned up');
    } catch (cleanupError) {
      console.error('🎭 [API] Error cleaning up temp file:', cleanupError);
      // Don't fail the request for cleanup errors
    }

    // Helper function to get emoji for reaction type
    const getEmojiForReactionType = (type: string): string => {
      const emojiMap: { [key: string]: string } = {
        thumbsUp: '👍',
        love: '😍',
        shocked: '🤯',
        curious: '🤔',
        fire: '🔥',
        sad: '😢',
      };
      return emojiMap[type] || '😊';
    };

    const responseData = {
      success: true,
      reactionId,
      selfieCID,
      selfieUrl: `https://gateway.pinata.cloud/ipfs/${selfieCID}`,
      reactionType,
      emoji: getEmojiForReactionType(reactionType),
      message: 'RealMoji reaction created successfully',
    };

    console.log('🎭 [API] RealMoji creation completed successfully:', responseData);

    return res.status(200).json(responseData);
  } catch (error) {
    console.error('🎭 [API] Error creating RealMoji reaction:', error);

    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';

    // Handle specific error cases
    if (errorMessage.includes('not found')) {
      return res.status(404).json({
        error: 'User or completion not found',
        details: errorMessage,
      });
    }

    if (errorMessage.includes('upload') || errorMessage.includes('IPFS') || errorMessage.includes('Pinata')) {
      return res.status(500).json({
        error: 'Failed to upload image to IPFS',
        details: errorMessage,
      });
    }

    if (
      errorMessage.includes('Database') ||
      errorMessage.includes('Failed to create') ||
      errorMessage.includes('GraphQL')
    ) {
      return res.status(500).json({
        error: 'Database operation failed',
        details: errorMessage,
      });
    }

    return res.status(500).json({
      error: 'Failed to create RealMoji reaction',
      details: errorMessage,
    });
  }
}
