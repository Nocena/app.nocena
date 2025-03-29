// pages/api/debugIPFS.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';

const IPFS_GATEWAYS = [
  'https://gateway.pinata.cloud/ipfs',
  'https://ipfs.io/ipfs',
  'https://cloudflare-ipfs.com/ipfs',
  'https://dweb.link/ipfs',
  'https://gateway.ipfs.io/ipfs',
];

/**
 * API endpoint to diagnose IPFS content issues
 *
 * Usage: POST /api/debugIPFS with body:
 * {
 *   "directoryCID": "bafybei...",
 *   "fileName": "file_name.webm"
 * }
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { directoryCID, fileName } = req.body;

  if (!directoryCID || !fileName) {
    return res.status(400).json({ message: 'directoryCID and fileName are required' });
  }

  try {
    console.log('Debug IPFS request:', { directoryCID, fileName });

    // Validate inputs
    if (!directoryCID || !directoryCID.match(/^[a-zA-Z0-9]+/)) {
      return res.status(400).json({
        message: 'Invalid directoryCID format',
        directoryCID,
      });
    }
    const gatewayResults = await Promise.all(
      IPFS_GATEWAYS.map(async (gateway) => {
        const url = `${gateway}/${directoryCID}/${fileName}`;
        const startTime = Date.now();

        try {
          // Use HEAD request first to see if resource exists
          const response = await axios.head(url, { timeout: 5000 });
          const endTime = Date.now();

          return {
            gateway,
            url,
            status: response.status,
            success: true,
            responseTimeMs: endTime - startTime,
          };
        } catch (error: any) {
          return {
            gateway,
            url,
            status: error.response?.status || 0,
            success: false,
            error: error.message,
          };
        }
      }),
    );

    // Check if IPFS directory exists
    let directoryExists = false;
    for (const gateway of IPFS_GATEWAYS) {
      try {
        const directoryUrl = `${gateway}/${directoryCID}/`;
        await axios.head(directoryUrl, { timeout: 5000 });
        directoryExists = true;
        break;
      } catch (error) {
        // Continue to next gateway
      }
    }

    // Check if file exists using Pinata's API if API key is available
    let pinataApiCheck = null;
    if (process.env.PINATA_API_KEY && process.env.PINATA_SECRET_KEY) {
      try {
        const response = await axios.get(
          `https://api.pinata.cloud/data/pinList?status=pinned&metadata[keyvalues]={"directoryCID":{"value":"${directoryCID}","op":"eq"}}`,
          {
            headers: {
              pinata_api_key: process.env.PINATA_API_KEY,
              pinata_secret_api_key: process.env.PINATA_SECRET_KEY,
            },
          },
        );

        pinataApiCheck = {
          success: true,
          pinnedFiles: response.data.rows,
          isPinned: response.data.count > 0,
        };
      } catch (error: any) {
        pinataApiCheck = {
          success: false,
          error: error.message,
        };
      }
    }

    return res.status(200).json({
      directoryCID,
      fileName,
      directoryExists,
      gatewayResults,
      pinataApiCheck,
      workingGateways: gatewayResults.filter((result) => result.success).map((result) => result.gateway),
      recommendations: getRecommendations(gatewayResults, directoryExists, pinataApiCheck),
    });
  } catch (error: any) {
    console.error('Error in debugIPFS API:', error);
    return res.status(500).json({
      message: 'Error debugging IPFS',
      error: error.message || 'Unknown error',
    });
  }
}

/**
 * Generate recommendations based on test results
 */
function getRecommendations(gatewayResults: any[], directoryExists: boolean, pinataApiCheck: any): string[] {
  const recommendations: string[] = [];

  const anySuccess = gatewayResults.some((result) => result.success);

  if (!directoryExists) {
    recommendations.push(
      'The IPFS directory does not appear to exist. The CID may be incorrect or the content may not be properly pinned.',
    );

    if (pinataApiCheck && !pinataApiCheck.isPinned) {
      recommendations.push('This content is not pinned in your Pinata account. You may need to re-upload it.');
    }
  } else if (!anySuccess) {
    recommendations.push(
      'The directory exists but the specific file could not be accessed. Check if the filename is correct.',
    );
  }

  if (anySuccess) {
    const workingGateways = gatewayResults
      .filter((result) => result.success)
      .sort((a, b) => a.responseTimeMs - b.responseTimeMs);

    if (workingGateways.length > 0) {
      recommendations.push(`Use this gateway for best performance: ${workingGateways[0].gateway}`);
    }
  } else {
    recommendations.push('Consider setting up a dedicated Pinata gateway for more reliable access.');
    recommendations.push('Check your Pinata subscription limits to ensure you have not exceeded your bandwidth.');
  }

  return recommendations;
}
