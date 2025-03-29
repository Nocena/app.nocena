import { NextApiRequest, NextApiResponse } from 'next';
import { uploadToPinata } from '../../lib/api/pinata';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Only POST requests are allowed' });
  }

  try {
    const { file, fileName, fileType = 'image' } = req.body;

    if (!file || !fileName) {
      return res.status(400).json({ message: 'Missing required fields: file and fileName' });
    }

    console.log(`Received ${fileType} for upload:`, fileName);

    // Convert base64 string to Buffer
    const fileBuffer = Buffer.from(file, 'base64');

    // Upload to Pinata
    const ipfsHash = await uploadToPinata(fileBuffer, fileName);

    res.status(200).json({
      success: true,
      ipfsHash,
      url: `https://gateway.pinata.cloud/ipfs/${ipfsHash}`,
      fileType,
    });
  } catch (error) {
    if (error instanceof Error) {
      console.error('Error uploading to Pinata:', error.message);
      res.status(500).json({ message: 'Upload failed', error: error.message });
    } else {
      console.error('Unknown error:', error);
      res.status(500).json({ message: 'Unknown upload error' });
    }
  }
}
