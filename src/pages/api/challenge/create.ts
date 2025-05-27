// src/pages/api/challenge/create.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { handleChallengeCreation } from '../../../lib/api/dgraph';
import { ChallengeFormData } from '../../../lib/map/types';

type ResponseData = {
  success: boolean;
  message: string;
  challengeId?: string;
};

export default async function handler(req: NextApiRequest, res: NextApiResponse<ResponseData>) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    const { userId, challengeData, mode } = req.body;

    // Validate required fields
    if (!userId) {
      return res.status(400).json({ success: false, message: 'User ID is required' });
    }

    if (!challengeData || !challengeData.challengeName || !challengeData.description) {
      return res.status(400).json({ success: false, message: 'Challenge data is incomplete' });
    }

    if (!mode || (mode !== 'private' && mode !== 'public')) {
      return res.status(400).json({ success: false, message: 'Invalid challenge mode' });
    }

    // Handle challenge creation
    const result = await handleChallengeCreation(userId, challengeData as ChallengeFormData, mode);

    if (result.success) {
      return res.status(200).json({
        success: true,
        message: result.message,
        challengeId: result.challengeId,
      });
    } else {
      return res.status(400).json({
        success: false,
        message: result.message,
      });
    }
  } catch (error) {
    console.error('Error in challenge creation API route:', error);
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'An unexpected error occurred',
    });
  }
}
