import { NextApiRequest, NextApiResponse } from 'next';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    console.log('Starting monthly challenge generation...');

    const { stdout, stderr } = await execAsync('pnpm challenge:monthly');

    if (stderr) {
      console.error('stderr:', stderr);
    }

    console.log('stdout:', stdout);

    res.status(200).json({
      message: 'Monthly challenge generated successfully',
      timestamp: new Date().toISOString(),
      output: stdout,
    });
  } catch (error) {
    console.error('Error generating daily challenge:', error); // Change message for each file

    // TypeScript-safe error handling
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';

    res.status(500).json({
      error: 'Failed to generate daily challenge', // Change message for each file
      details: errorMessage,
    });
  }
}
