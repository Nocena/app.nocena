// /api/registration/validate-invite.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { validateInviteCode } from '../../../lib/api/dgraph';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { inviteCode } = req.body;

  if (!inviteCode || inviteCode.length !== 6) {
    return res.status(400).json({ error: 'Invalid invite code format' });
  }

  try {
    const result = await validateInviteCode(inviteCode);

    if (!result.valid) {
      return res.status(404).json({
        error: 'Invalid or already used invite code',
        valid: false,
      });
    }

    res.json({
      valid: true,
      invite: {
        code: inviteCode.toUpperCase(),
        ownerId: result.ownerId,
        ownerUsername: result.ownerUsername,
      },
    });
  } catch (error) {
    console.error('Error validating invite code:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
