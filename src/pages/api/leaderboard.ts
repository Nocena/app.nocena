// pages/api/leaderboard.ts
import { getLeaderboard } from '../../lib/api/dgraph';

export default async function handler(req: any, res: any) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { period = 'all-time', limit = 50 } = req.query;

    if (!['all-time', 'today', 'week', 'month'].includes(period)) {
      return res.status(400).json({ message: 'Invalid period. Must be: all-time, today, week, or month' });
    }

    const limitNum = parseInt(limit);
    if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
      return res.status(400).json({ message: 'Invalid limit. Must be between 1 and 100' });
    }

    const leaderboard = await getLeaderboard(period, limitNum);

    res.status(200).json({
      success: true,
      period,
      limit: limitNum,
      leaderboard,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Leaderboard API error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch leaderboard',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
