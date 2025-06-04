// /api/registration/use-invite.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { validateInviteCode, markInviteAsUsed, updateUserTokens, createNotification } from '../../../lib/api/dgraph';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { inviteCode, newUserId } = req.body;

  if (!inviteCode || !newUserId) {
    return res.status(400).json({ error: 'Invite code and user ID are required' });
  }

  try {
    // First validate the invite is still available
    const validation = await validateInviteCode(inviteCode);

    if (!validation.valid) {
      return res.status(404).json({ error: 'Invalid or already used invite code' });
    }

    // Mark invite as used
    const success = await markInviteAsUsed(inviteCode, newUserId);

    if (!success) {
      return res.status(500).json({ error: 'Failed to use invite code' });
    }

    // Award tokens to invite owner (if not system)
    if (validation.ownerId && validation.ownerId !== 'system') {
      try {
        await updateUserTokens(validation.ownerId, 50);

        // Create notification for invite owner
        await createNotification(
          validation.ownerId,
          newUserId,
          `Someone joined Nocena using your invite code ${inviteCode}! You earned 50 Nocenix tokens.`,
          'invite_used',
        );
      } catch (tokenError) {
        console.error('Error awarding tokens:', tokenError);
        // Don't fail the whole process if token update fails
      }
    }

    res.json({
      success: true,
      inviteOwner: {
        id: validation.ownerId,
        username: validation.ownerUsername,
      },
      tokensAwarded: validation.ownerId !== 'system' ? 50 : 0,
      message: 'Invite code used successfully',
    });
  } catch (error) {
    console.error('Error using invite code:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
