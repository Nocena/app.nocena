// pages/api/pinFileToIPFS.ts - FIXED VERSION
import type { NextApiRequest, NextApiResponse } from 'next';
import FormData from 'form-data';
import fetch from 'node-fetch';

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '100mb',
    },
  },
};

interface PinataResponse {
  IpfsHash: string;
  PinSize: number;
  Timestamp: string;
}

/**
 * FIXED: API endpoint to upload individual files to IPFS via Pinata
 * This endpoint handles one file at a time for better reliability
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  console.log('pinFileToIPFS API called');

  try {
    const { file, fileName, fileType } = req.body;

    if (!file || !fileName || !fileType) {
      return res.status(400).json({
        message: 'Missing required fields: file, fileName, and fileType are required',
      });
    }

    console.log(`Processing ${fileType} upload: ${fileName}`);

    // Validate file type
    if (!['image', 'video'].includes(fileType)) {
      return res.status(400).json({
        message: 'Invalid fileType. Must be "image" or "video"',
      });
    }

    // Decode base64 data
    let fileBuffer: Buffer;
    try {
      fileBuffer = Buffer.from(file, 'base64');
      console.log(`Decoded ${fileType} buffer size: ${fileBuffer.length} bytes`);
    } catch (error) {
      console.error('Base64 decode error:', error);
      return res.status(400).json({
        message: 'Invalid base64 data in file field',
      });
    }

    // Validate buffer size
    if (fileBuffer.length === 0) {
      return res.status(400).json({
        message: 'Empty file buffer after base64 decode',
      });
    }

    // Set reasonable size limits
    const maxImageSize = 10 * 1024 * 1024; // 10MB for images
    const maxVideoSize = 50 * 1024 * 1024; // 50MB for videos

    if (fileType === 'image' && fileBuffer.length > maxImageSize) {
      return res.status(400).json({
        message: 'Image file too large (max 10MB)',
      });
    }

    if (fileType === 'video' && fileBuffer.length > maxVideoSize) {
      return res.status(400).json({
        message: 'Video file too large (max 50MB)',
      });
    }

    // Upload to Pinata with retries
    const ipfsHash = await uploadToPinataWithRetry(fileBuffer, fileName, fileType);

    console.log(`${fileType} upload successful:`, ipfsHash);

    return res.status(200).json({
      success: true,
      ipfsHash,
      fileName,
      fileType,
      size: fileBuffer.length,
      message: `${fileType} uploaded successfully to IPFS`,
    });
  } catch (error: unknown) {
    console.error('API error:', error);

    let errorMessage = 'Error uploading to IPFS';
    let statusCode = 500;

    if (error && typeof error === 'object') {
      const err = error as any;
      if (err.message) {
        errorMessage = err.message;
      }
      if (err.statusCode) {
        statusCode = err.statusCode;
      }
    }

    return res.status(statusCode).json({
      success: false,
      message: errorMessage,
      timestamp: new Date().toISOString(),
    });
  }
}

/**
 * FIXED: Upload to Pinata with proper retry logic and error handling
 */
async function uploadToPinataWithRetry(
  fileBuffer: Buffer,
  fileName: string,
  fileType: string,
  maxRetries: number = 3,
): Promise<string> {
  const pinataJWT = process.env.NEXT_PUBLIC_PINATA_JWT;

  if (!pinataJWT) {
    throw new Error('Pinata JWT token not configured');
  }

  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`Upload attempt ${attempt}/${maxRetries} for ${fileName}`);

      const formData = new FormData();
      formData.append('file', fileBuffer, {
        filename: fileName,
        contentType: fileType === 'video' ? 'video/webm' : 'image/jpeg',
      });

      // Add metadata to help identify the file
      const metadata = {
        name: `Nocena ${fileType}: ${fileName}`,
        keyvalues: {
          type: 'challenge_proof',
          fileType: fileType,
          uploadedAt: new Date().toISOString(),
        },
      };
      formData.append('pinataMetadata', JSON.stringify(metadata));

      // Add options for better performance
      const options = {
        cidVersion: 1,
        wrapWithDirectory: false, // Upload individual files, not directories
      };
      formData.append('pinataOptions', JSON.stringify(options));

      const response = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${pinataJWT}`,
          ...formData.getHeaders(),
        },
        body: formData,
        // Increased timeout for large video files
        timeout: fileType === 'video' ? 300000 : 60000, // 5min for video, 1min for image
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Pinata API error (attempt ${attempt}):`, response.status, errorText);

        // Don't retry on client errors (4xx)
        if (response.status >= 400 && response.status < 500) {
          throw new Error(`Pinata upload failed: ${response.status} - ${errorText}`);
        }

        throw new Error(`Pinata server error: ${response.status} - ${errorText}`);
      }

      const result: PinataResponse = await response.json();

      if (!result.IpfsHash) {
        throw new Error('No IPFS hash returned from Pinata');
      }

      console.log(`Upload successful on attempt ${attempt}:`, result.IpfsHash);
      return result.IpfsHash;
    } catch (error) {
      lastError = error as Error;
      console.error(`Upload attempt ${attempt} failed:`, error);

      // Don't retry on certain errors
      if (error instanceof Error) {
        if (error.message.includes('400') || error.message.includes('401') || error.message.includes('403')) {
          throw error; // Client errors shouldn't be retried
        }
      }

      // Wait before retrying (exponential backoff)
      if (attempt < maxRetries) {
        const waitTime = Math.min(1000 * Math.pow(2, attempt - 1), 10000); // Cap at 10 seconds
        console.log(`Waiting ${waitTime}ms before retry...`);
        await new Promise((resolve) => setTimeout(resolve, waitTime));
      }
    }
  }

  throw lastError || new Error('Upload failed after all retries');
}
