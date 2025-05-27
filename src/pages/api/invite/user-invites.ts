// /api/invite/user-invites.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { getUserInviteStats } from '../../../lib/api/dgraph';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { userId } = req.query;

  if (!userId || typeof userId !== 'string') {
    return res.status(400).json({ error: 'User ID is required' });
  }

  try {
    const inviteStats = await getUserInviteStats(userId);
    res.json(inviteStats);
  } catch (error) {
    console.error('Error fetching user invites:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
