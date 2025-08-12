import { NextApiRequest, NextApiResponse } from 'next';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Set the Clear-Site-Data header to force cache clearing
    res.setHeader('Clear-Site-Data', '"cache", "storage"');

    // Also set cache control headers
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');

    // Return instructions for users
    return res.status(200).json({
      success: true,
      message: 'Emergency cache clear initiated',
      instructions: [
        '1. Close all Nocena tabs/windows',
        '2. Wait 10 seconds',
        '3. Reopen the app',
        '4. If still having issues, try clearing browser data manually',
      ],
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Emergency cache clear error:', error);
    return res.status(500).json({
      success: false,
      message: 'Cache clear failed',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
