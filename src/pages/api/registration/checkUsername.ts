// pages/api/registration/checkUsername.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { checkUsernameExists } from '../../../lib/api/dgraph';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  console.log('🔍 [API] checkUsername endpoint hit');
  console.log('🔍 [API] Request method:', req.method);
  console.log('🔍 [API] Request body:', JSON.stringify(req.body, null, 2));

  if (req.method !== 'POST') {
    console.log('🔍 [API] Method not allowed, returning 405');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { username } = req.body;
  console.log('🔍 [API] Username from request:', username);

  if (!username) {
    console.log('🔍 [API] No username provided, returning 400');
    return res.status(400).json({ error: 'Username is required' });
  }

  // Basic validation
  const trimmedUsername = username.trim();
  if (trimmedUsername.length < 3) {
    console.log('🔍 [API] Username too short, returning validation error');
    return res.status(400).json({ error: 'Username must be at least 3 characters' });
  }

  try {
    console.log('🔍 [API] Calling checkUsernameExists function...');
    const result = await checkUsernameExists(trimmedUsername);

    console.log('🔍 [API] checkUsernameExists result:', result);
    console.log('🔍 [API] Returning result to frontend');

    return res.status(200).json(result);
  } catch (error) {
    console.error('🔍 [API] Error in checkUsername handler:', error);
    console.error('🔍 [API] Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : 'No stack trace',
    });

    return res.status(500).json({ error: 'Failed to check username' });
  }
}
