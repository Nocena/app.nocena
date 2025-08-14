import type { NextApiRequest, NextApiResponse } from 'next';

export default function handler(_req: NextApiRequest, res: NextApiResponse) {
  res.status(200).json({
    version: process.env.NEXT_PUBLIC_APP_VERSION,
    builtAt: process.env.NEXT_PUBLIC_BUILD_TIME,
  });
}
