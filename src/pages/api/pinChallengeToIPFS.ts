import type { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';
import axios from 'axios';
import FormData from 'form-data';

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '20mb', // Increase limit for video+selfie
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
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  console.log('API endpoint called');
  console.log('Pinata API key exists:', !!process.env.PINATA_API_KEY);
  console.log('Pinata API secret exists:', !!process.env.PINATA_API_SECRET);

  try {
    const { videoFile, selfieFile, fileName, userId } = req.body;
    
    if (!videoFile || !selfieFile || !userId) {
      return res.status(400).json({ message: 'Missing required files or user ID' });
    }

    // Generate unique file names
    const timestamp = Date.now();
    const safeUserId = userId.replace(/[^a-zA-Z0-9]/g, '_');
    const directoryName = fileName || `challenge_${safeUserId}_${timestamp}`;
    const videoFileName = `${safeUserId}_${timestamp}_video.webm`;
    const selfieFileName = `${safeUserId}_${timestamp}_selfie.jpg`;
    
    // Decode base64 data
    const videoBuffer = Buffer.from(videoFile.split(',')[1], 'base64');
    const selfieBuffer = Buffer.from(selfieFile.split(',')[1], 'base64');
    
    // Create temporary directory in /tmp (works in Vercel serverless functions)
    const tempDir = '/tmp';
    const uploadDir = path.join(tempDir, directoryName);
    
    try {
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
    } catch (error) {
      console.error('Error creating directory:', error);
      return res.status(500).json({ message: 'Failed to create temp directory' });
    }
    
    // Write files to disk temporarily
    try {
      fs.writeFileSync(path.join(uploadDir, videoFileName), videoBuffer);
      fs.writeFileSync(path.join(uploadDir, selfieFileName), selfieBuffer);
    } catch (error) {
      console.error('Error writing files:', error);
      return res.status(500).json({ message: 'Failed to write temp files' });
    }
    
    // Create metadata file with information about the challenge
    const metadataPath = path.join(uploadDir, 'metadata.json');
    const metadata = {
      userId: safeUserId,
      timestamp,
      type: 'challenge_proof',
      files: {
        video: videoFileName,
        selfie: selfieFileName
      }
    };
    
    fs.writeFileSync(metadataPath, JSON.stringify(metadata));
    
    // Upload to Pinata
    const pinataApiKey = process.env.PINATA_API_KEY;
    const pinataSecretKey = process.env.PINATA_API_SECRET;
    
    if (!pinataApiKey || !pinataSecretKey) {
      console.error('Pinata API keys missing - check environment variables');
      return res.status(500).json({
        message: 'Server configuration error. Please contact support.' 
      });
    }
    
    const formData = new FormData();
    
    // Add all files from the directory
    const files = fs.readdirSync(uploadDir);
    for (const file of files) {
      const filePath = path.join(uploadDir, file);
      const fileStream = fs.createReadStream(filePath);
      formData.append('file', fileStream, { filepath: path.join(directoryName, file) });
    }
    
    // Add pinata metadata
    const pinataMetadata = JSON.stringify({
      name: `Nocena Challenge - ${directoryName}`,
      keyvalues: {
        userId: safeUserId,
        timestamp: timestamp.toString(),
        type: 'challenge_proof'
      }
    });
    
    formData.append('pinataMetadata', pinataMetadata);
    
    // Set options
    const pinataOptions = JSON.stringify({
      cidVersion: 1,
      wrapWithDirectory: true
    });
    
    formData.append('pinataOptions', pinataOptions);
    
    // Upload to Pinata
    try {
      const response = await axios.post<PinataResponse>(
        'https://api.pinata.cloud/pinning/pinFileToIPFS',
        formData,
        {
          maxBodyLength: Infinity,
          headers: {
            'Content-Type': `multipart/form-data; boundary=${formData.getBoundary()}`,
            pinata_api_key: pinataApiKey,
            pinata_secret_api_key: pinataSecretKey,
          },
        }
      );
      
      // Clean up temporary files
      try {
        for (const file of files) {
          fs.unlinkSync(path.join(uploadDir, file));
        }
        fs.rmdirSync(uploadDir);
      } catch (cleanupError) {
        console.error('Error cleaning up temp files:', cleanupError);
        // Continue even if cleanup fails
      }
      
      return res.status(200).json({
        message: 'Challenge proof uploaded successfully',
        ipfsHash: response.data.IpfsHash,
        mediaMetadata: {
          directoryCID: response.data.IpfsHash,
          hasVideo: true,
          hasSelfie: true,
          timestamp,
          videoFileName,
          selfieFileName
        }
      });
    } catch (uploadError: any) {
      console.error('Error uploading to Pinata:', uploadError.response?.data || uploadError);
      return res.status(500).json({ message: 'Failed to upload to IPFS' });
    }
  } catch (error: any) {
    console.error('API error:', error);
    return res.status(500).json({ message: error.message || 'Error uploading to IPFS' });
  }
}