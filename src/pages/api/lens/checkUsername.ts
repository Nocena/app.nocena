// pages/api/lens/checkUsername.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { LensProtocolService } from '../../../lib/api/lens';

interface CheckUsernameRequest {
  username: string;
}

interface CheckUsernameResponse {
  available: boolean;
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
  suggestions?: string[];
  validationErrors?: string[];
  error?: string;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse<CheckUsernameResponse>) {
  console.log('🚀 API /api/lens/checkUsername: Request received');
  console.log('📋 API: Method:', req.method);
  console.log('📋 API: Body:', req.body);

  if (req.method !== 'POST') {
    console.log('❌ API: Method not allowed:', req.method);
    return res.status(405).json({
      available: false,
      error: 'Method not allowed',
    });
  }

  try {
    const { username }: CheckUsernameRequest = req.body;
    console.log('👤 API: Username from request:', username);

    if (!username || typeof username !== 'string') {
      console.log('❌ API: Invalid username:', username);
      return res.status(400).json({
        available: false,
        error: 'Username is required',
      });
    }

    const trimmedUsername = username.trim();
    console.log('✂️ API: Trimmed username:', trimmedUsername);

    // Validate username format
    console.log('🔍 API: Validating username format...');
    const validation = LensProtocolService.validateUsername(trimmedUsername);
    console.log('📊 API: Validation result:', validation);

    if (!validation.isValid) {
      console.log('❌ API: Username validation failed:', validation.errors);
      return res.status(400).json({
        available: false,
        validationErrors: validation.errors,
      });
    }

    // Check availability on Lens Protocol
    console.log('🔍 API: Checking Lens Protocol availability...');
    const lensResult = await LensProtocolService.checkUsernameAvailability(trimmedUsername);
    console.log('📊 API: Lens result:', lensResult);

    // Generate suggestions if username is taken
    const suggestions = !lensResult.available ? LensProtocolService.generateUsernameSuggestions(trimmedUsername) : [];

    console.log('💡 API: Generated suggestions:', suggestions);

    const finalResult = {
      available: lensResult.available,
      account: lensResult.account,
      suggestions: suggestions.length > 0 ? suggestions : undefined,
      error: lensResult.error,
    };

    console.log('✅ API: Final response:', finalResult);
    return res.status(200).json(finalResult);
  } catch (error) {
    console.error('💥 API: Error in checkUsername:', error);
    console.error('💥 API: Error stack:', error instanceof Error ? error.stack : 'No stack trace');

    return res.status(500).json({
      available: false,
      error: 'Internal server error',
    });
  }
}
