// pages/api/registration/checkWallet.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { checkWalletExists } from '../../../lib/api/dgraph';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  console.log('🔍 [API] checkWallet endpoint hit');
  console.log('🔍 [API] Request method:', req.method);
  console.log('🔍 [API] Request body:', JSON.stringify(req.body, null, 2));

  if (req.method !== 'POST') {
    console.log('🔍 [API] Method not allowed, returning 405');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { wallet } = req.body;
  console.log('🔍 [API] Wallet from request:', wallet);

  if (!wallet) {
    console.log('🔍 [API] No wallet provided, returning 400');
    return res.status(400).json({ error: 'Wallet address is required' });
  }

  try {
    console.log('🔍 [API] Calling checkWalletExists function...');
    const result = await checkWalletExists(wallet);

    console.log('🔍 [API] checkWalletExists result:', result);
    console.log('🔍 [API] Returning result to frontend');

    return res.status(200).json(result);
  } catch (error) {
    console.error('🔍 [API] Error in checkWallet handler:', error);
    console.error('🔍 [API] Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : 'No stack trace',
    });

    return res.status(500).json({ error: 'Failed to check wallet' });
  }
}
