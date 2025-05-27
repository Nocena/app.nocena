// /api/invite/generate.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { generateInviteCode } from '../../../lib/api/dgraph';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { userId, source = 'earned' } = req.body;

  if (!userId) {
    return res.status(400).json({ error: 'User ID is required' });
  }

  try {
    const inviteCode = await generateInviteCode(userId, source);

    if (!inviteCode) {
      return res.status(400).json({
        error: 'Unable to generate invite code. You may have reached the maximum limit.',
      });
    }

    res.json({
      success: true,
      inviteCode,
      message: 'Invite code generated successfully',
    });
  } catch (error) {
    console.error('Error generating invite code:', error);
    if (error instanceof Error && error.message === 'Maximum invite codes reached') {
      return res.status(400).json({ error: error.message });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
}
