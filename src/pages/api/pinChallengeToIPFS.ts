// pages/api/pinChallengeToIPFS.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';
import axios from 'axios';
import FormData from 'form-data';

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '100mb', // Increase limit for video+selfie
    },
  },
};

interface PinataResponse {
  IpfsHash: string;
  PinSize: number;
  Timestamp: string;
}

/**
 * API endpoint to upload challenge completion (video + selfie) to IPFS via Pinata
 * Simplified to upload one file at a time
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  console.log('API endpoint called');

  try {
    const { videoFile, selfieFile, fileName, userId } = req.body;

    if (!videoFile || !userId) {
      return res.status(400).json({ message: 'Missing required video file or user ID' });
    }

    // Generate unique file names
    const timestamp = Date.now();
    const safeUserId = userId.replace(/[^a-zA-Z0-9]/g, '_');
    const videoFileName = `${safeUserId}_${timestamp}_video.webm`;
    const selfieFileName = selfieFile ? `${safeUserId}_${timestamp}_selfie.jpg` : '';

    // Decode base64 data
    const videoBuffer = Buffer.from(videoFile.split(',')[1], 'base64');
    let selfieBuffer = null;
    if (selfieFile) {
      selfieBuffer = Buffer.from(selfieFile.split(',')[1], 'base64');
    }

    // Upload video file to Pinata
    console.log('Uploading video file to Pinata...');
    const videoCID = await uploadSingleFileToPinata(videoBuffer, videoFileName, safeUserId, timestamp);

    // Upload selfie if exists
    let selfieCID = null;
    if (selfieBuffer) {
      console.log('Uploading selfie file to Pinata...');
      selfieCID = await uploadSingleFileToPinata(selfieBuffer, selfieFileName, safeUserId, timestamp);
    }

    // Successful response
    return res.status(200).json({
      message: 'Challenge proof uploaded successfully',
      mediaMetadata: {
        videoCID,
        selfieCID,
        hasVideo: true,
        hasSelfie: !!selfieFile,
        timestamp,
        videoFileName,
        selfieFileName: selfieFile ? selfieFileName : null,
      },
    });
  } catch (error: unknown) {
    console.error('API error:', error);

    let errorMessage = 'Error uploading to IPFS';
    let errorDetails = {};

    if (error && typeof error === 'object') {
      const err = error as any;
      if (err.message) {
        errorMessage = err.message;
      }
      if (err.response && err.response.data) {
        errorDetails = err.response.data;
      }
    }

    return res.status(500).json({
      message: errorMessage,
      details: errorDetails,
    });
  }
}

/**
 * Helper function to upload a single file to Pinata
 */
async function uploadSingleFileToPinata(
  fileBuffer: Buffer,
  fileName: string,
  userId: string,
  timestamp: number,
): Promise<string> {
  const pinataApiKey = process.env.PINATA_API_KEY;
  const pinataSecretKey = process.env.PINATA_SECRET_KEY;

  if (!pinataApiKey || !pinataSecretKey) {
    throw new Error('Pinata API keys missing');
  }

  // Retry logic
  const maxRetries = 3;
  let retryCount = 0;
  let lastError = null;

  while (retryCount < maxRetries) {
    try {
      const formData = new FormData();

      // Add just the single file to form data
      formData.append('file', fileBuffer, fileName);

      // Add metadata
      const pinataMetadata = JSON.stringify({
        name: `Nocena ${fileName}`,
        keyvalues: {
          userId,
          timestamp: timestamp.toString(),
          type: 'challenge_proof',
        },
      });

      formData.append('pinataMetadata', pinataMetadata);

      // Set options
      const pinataOptions = JSON.stringify({
        cidVersion: 1,
      });

      formData.append('pinataOptions', pinataOptions);

      console.log(`Attempting upload attempt ${retryCount + 1}/${maxRetries}`);

      const response = await axios.post<PinataResponse>('https://api.pinata.cloud/pinning/pinFileToIPFS', formData, {
        maxBodyLength: Infinity,
        headers: {
          'Content-Type': `multipart/form-data; boundary=${formData.getBoundary()}`,
          'pinata_api_key': pinataApiKey,
          'pinata_secret_api_key': pinataSecretKey,
        },
        timeout: 120000,
      });

      console.log('Pinata upload successful:', response.data);
      return response.data.IpfsHash;
    } catch (error) {
      lastError = error;
      retryCount++;

      console.error(`Upload attempt ${retryCount} failed:`, error);

      if (retryCount < maxRetries) {
        const waitTime = 1000 * Math.pow(2, retryCount);
        console.log(`Retrying in ${waitTime}ms...`);
        await new Promise((resolve) => setTimeout(resolve, waitTime));
      }
    }
  }

  // If we get here, all retries failed
  throw lastError;
}
