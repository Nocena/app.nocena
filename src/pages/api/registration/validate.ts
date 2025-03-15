// pages/api/registration/validate.ts

import { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';

const DGRAPH_ENDPOINT = process.env.NEXT_PUBLIC_DGRAPH_ENDPOINT || '';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ valid: false, message: 'Method not allowed' });
  }

  const { code } = req.body;

  if (!code) {
    return res.status(400).json({ valid: false, message: 'Invite code is required' });
  }

  try {
    // Query to check if the invite code exists and is not used
    const queryString = `
      query checkDiscordInvite($code: String!) {
        queryDiscordInvite(filter: { code: { eq: $code } }) {
          id
          code
          isUsed
          discordUsername
          quizScore
        }
      }
    `;

    const response = await axios.post(
      DGRAPH_ENDPOINT,
      {
        query: queryString,
        variables: { code }
      },
      {
        headers: { 'Content-Type': 'application/json' }
      }
    );

    // Handle potential errors in the response
    if (response.data.errors) {
      console.error('Dgraph query error:', response.data.errors);
      return res.status(500).json({ valid: false, message: 'Error querying database' });
    }

    // Check if we found a valid invite code
    const invites = response.data.data?.queryDiscordInvite || [];
    
    if (invites.length === 0) {
      return res.status(200).json({ valid: false, message: 'Invalid invite code' });
    }
    
    const invite = invites[0];
    
    // Check if the invite has already been used
    if (invite.isUsed) {
      return res.status(200).json({ valid: false, message: 'This invite code has already been used' });
    }
    
    // Valid invite code
    return res.status(200).json({ 
      valid: true, 
      inviteId: invite.id,
      discordUsername: invite.discordUsername,
      quizScore: invite.quizScore
    });
  } catch (error) {
    console.error('Error validating invite code:', error);
    return res.status(500).json({ valid: false, message: 'Server error validating invite code' });
  }
}