// pages/api/lens/createAccount.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { LensProtocolService } from '../../../lib/api/lens';

interface CreateAccountRequest {
  username: string;
  walletAddress: string;
  bio?: string;
  profilePicture?: string;
  authToken?: string;
}

interface CreateAccountResponse {
  success: boolean;
  txHash?: string;
  accountId?: string;
  existingAccount?: {
    id: string;
    handle?: {
      fullHandle: string;
      localName: string;
    };
  };
  error?: string;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse<CreateAccountResponse>) {
  console.log('🚀 API /api/lens/createAccount: Request received');
  console.log('📋 API: Method:', req.method);
  console.log('📋 API: Body:', req.body);

  if (req.method !== 'POST') {
    console.log('❌ API: Method not allowed:', req.method);
    return res.status(405).json({
      success: false,
      error: 'Method not allowed',
    });
  }

  try {
    const { username, walletAddress, bio, profilePicture, authToken }: CreateAccountRequest = req.body;

    console.log('👤 API: Username:', username);
    console.log('💳 API: Wallet:', walletAddress);

    if (!username || !walletAddress) {
      console.log('❌ API: Missing required fields');
      return res.status(400).json({
        success: false,
        error: 'Username and wallet address are required',
      });
    }

    // First check if wallet already has a Lens account
    console.log('🔍 API: Checking if wallet has existing Lens account...');
    const walletCheck = await LensProtocolService.checkWalletLensAccount(walletAddress);

    if (walletCheck.error) {
      console.log('❌ API: Error checking wallet:', walletCheck.error);
      return res.status(500).json({
        success: false,
        error: 'Failed to check wallet status',
      });
    }

    if (walletCheck.hasAccount) {
      console.log('👤 API: Wallet already has Lens account:', walletCheck.account);
      return res.status(200).json({
        success: true,
        existingAccount: walletCheck.account,
      });
    }

    // Validate username format
    console.log('🔍 API: Validating username format...');
    const validation = LensProtocolService.validateUsername(username.trim());
    console.log('📊 API: Validation result:', validation);

    if (!validation.isValid) {
      console.log('❌ API: Username validation failed:', validation.errors);
      return res.status(400).json({
        success: false,
        error: `Invalid username: ${validation.errors.join(', ')}`,
      });
    }

    // Check if username is still available
    console.log('🔍 API: Checking username availability...');
    const availabilityCheck = await LensProtocolService.checkUsernameAvailability(username.trim());

    if (availabilityCheck.error) {
      console.log('❌ API: Error checking availability:', availabilityCheck.error);
      return res.status(500).json({
        success: false,
        error: 'Failed to check username availability',
      });
    }

    if (!availabilityCheck.available) {
      console.log('❌ API: Username no longer available');
      return res.status(409).json({
        success: false,
        error: 'Username is no longer available',
      });
    }

    // Create Lens account
    console.log('🚀 API: Creating Lens account...');
    const result = await LensProtocolService.createLensAccountWithUsername(username.trim(), walletAddress, authToken);

    console.log('📊 API: Creation result:', result);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: result.error || 'Failed to create Lens account',
      });
    }

    return res.status(200).json({
      success: true,
      txHash: result.txHash,
      accountId: result.accountId,
    });
  } catch (error) {
    console.error('💥 API: Error in createAccount:', error);
    console.error('💥 API: Error stack:', error instanceof Error ? error.stack : 'No stack trace');

    return res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
}
