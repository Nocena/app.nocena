// pages/api/lens/checkWallet.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { LensProtocolService } from '../../../lib/api/lens';

interface CheckWalletRequest {
  walletAddress: string;
}

interface CheckWalletResponse {
  hasAccount: boolean;
  account?: {
    id: string;
    handle?: {
      fullHandle: string;
      localName: string;
    };
    ownedBy?: {
      address: string;
    };
  };
  error?: string;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse<CheckWalletResponse>) {
  console.log('🚀 API /api/lens/checkWallet: Request received');
  console.log('📋 API: Method:', req.method);
  console.log('📋 API: Body:', req.body);

  if (req.method !== 'POST') {
    console.log('❌ API: Method not allowed:', req.method);
    return res.status(405).json({
      hasAccount: false,
      error: 'Method not allowed',
    });
  }

  try {
    const { walletAddress }: CheckWalletRequest = req.body;
    console.log('💳 API: Wallet address from request:', walletAddress);

    if (!walletAddress || typeof walletAddress !== 'string') {
      console.log('❌ API: Invalid wallet address:', walletAddress);
      return res.status(400).json({
        hasAccount: false,
        error: 'Wallet address is required',
      });
    }

    // Basic wallet address validation (should be 42 characters starting with 0x)
    if (!/^0x[a-fA-F0-9]{40}$/.test(walletAddress)) {
      console.log('❌ API: Invalid wallet address format:', walletAddress);
      return res.status(400).json({
        hasAccount: false,
        error: 'Invalid wallet address format',
      });
    }

    console.log('🔍 API: Checking wallet for existing Lens account...');
    const walletCheck = await LensProtocolService.checkWalletLensAccount(walletAddress);
    console.log('📊 API: Wallet check result:', walletCheck);

    if (walletCheck.error) {
      console.log('❌ API: Error checking wallet:', walletCheck.error);
      return res.status(500).json({
        hasAccount: false,
        error: walletCheck.error,
      });
    }

    const finalResult = {
      hasAccount: walletCheck.hasAccount,
      account: walletCheck.account,
    };

    console.log('✅ API: Final response:', finalResult);
    return res.status(200).json(finalResult);
  } catch (error) {
    console.error('💥 API: Error in checkWallet:', error);
    console.error('💥 API: Error stack:', error instanceof Error ? error.stack : 'No stack trace');

    return res.status(500).json({
      hasAccount: false,
      error: 'Internal server error',
    });
  }
}
