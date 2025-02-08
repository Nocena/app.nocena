import { NextApiRequest, NextApiResponse } from 'next';
import { uploadProfilePictureToPinata } from '../../utils/api/pinata';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Only POST requests are allowed' });
  }

  try {
    const { file, fileName } = req.body;

    console.log('Received file for upload:', fileName);
    console.log('File data (first 100 chars):', file.substring(0, 100)); // Log part of the file data

    // Convert base64 string to Buffer
    const fileBuffer = Buffer.from(file, 'base64');
    console.log('File converted to Buffer:', fileBuffer);

    // Pass the Buffer directly to Pinata
    const result = await uploadProfilePictureToPinata(fileBuffer, fileName);
    console.log('Pinata upload result:', result);

    res.status(200).json({
      IpfsHash: result,
      url: `https://gateway.pinata.cloud/ipfs/${result}`,
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