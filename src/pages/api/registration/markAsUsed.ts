// pages/api/registration/markAsUsed.ts

import { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';

const DGRAPH_ENDPOINT = process.env.NEXT_PUBLIC_DGRAPH_ENDPOINT || '';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  const { code, userId, usedAt } = req.body;

  if (!code || !userId) {
    return res.status(400).json({ success: false, message: 'Code and userId are required' });
  }

  try {
    // First, ensure the code exists and is not used
    const checkQuery = `
      query checkDiscordInvite($code: String!) {
        queryDiscordInvite(filter: { code: { eq: $code } }) {
          id
          isUsed
        }
      }
    `;

    const checkResponse = await axios.post(
      DGRAPH_ENDPOINT,
      {
        query: checkQuery,
        variables: { code },
      },
      {
        headers: { 'Content-Type': 'application/json' },
      },
    );

    if (checkResponse.data.errors) {
      console.error('Dgraph query error:', checkResponse.data.errors);
      return res.status(500).json({ success: false, message: 'Error querying database' });
    }

    const invites = checkResponse.data.data.queryDiscordInvite || [];

    if (invites.length === 0) {
      return res.status(404).json({ success: false, message: 'Invite code not found' });
    }

    const invite = invites[0];

    if (invite.isUsed) {
      return res.status(400).json({ success: false, message: 'This invite code has already been used' });
    }

    // Update the invite code to mark it as used
    const usedAtValue = usedAt || new Date().toISOString();

    const mutationString = `
      mutation updateDiscordInvite($id: String!, $userId: String!, $usedAt: DateTime!) {
        updateDiscordInvite(
          input: {
            filter: { id: { eq: $id } }
            set: { 
              isUsed: true
              userId: $userId
              usedAt: $usedAt
            }
          }
        ) {
          discordInvite {
            id
            code
            isUsed
            userId
            usedAt
          }
        }
      }
    `;

    const updateResponse = await axios.post(
      DGRAPH_ENDPOINT,
      {
        query: mutationString,
        variables: {
          id: invite.id,
          userId: userId,
          usedAt: usedAtValue,
        },
      },
      {
        headers: { 'Content-Type': 'application/json' },
      },
    );

    if (updateResponse.data.errors) {
      console.error('Dgraph mutation error:', updateResponse.data.errors);
      return res.status(500).json({ success: false, message: 'Error updating database' });
    }

    return res.status(200).json({
      success: true,
      invite: updateResponse.data.data.updateDiscordInvite.discordInvite[0],
    });
  } catch (error) {
    console.error('Error marking invite code as used:', error);
    return res.status(500).json({ success: false, message: 'Server error marking invite code as used' });
  }
}
