// src/pages/api/checkPinataFile.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { fileName } = req.query;
  if (!fileName || typeof fileName !== 'string') {
    return res.status(400).json({ error: 'Missing or invalid fileName parameter' });
  }

  try {
    const pinataApiKey = process.env.PINATA_API_KEY;
    const pinataSecretKey = process.env.PINATA_SECRET_KEY;
    
    if (!pinataApiKey || !pinataSecretKey) {
      return res.status(500).json({ error: 'Pinata API credentials not configured' });
    }
    
    const response = await axios.get(
      `https://api.pinata.cloud/data/pinList?status=pinned&metadata[name]=${encodeURIComponent(fileName)}`,
      {
        headers: {
          'pinata_api_key': pinataApiKey,
          'pinata_secret_api_key': pinataSecretKey
        }
      }
    );
    
    if (response.data?.rows?.length > 0) {
      const file = response.data.rows[0];
      return res.status(200).json({
        cid: file.ipfs_pin_hash,
        name: file.metadata.name,
        size: file.size,
        timestamp: file.date_pinned
      });
    }
    
    return res.status(404).json({ error: 'File not found on Pinata' });
  } catch (error) {
    console.error('Error checking Pinata:', error);
    return res.status(500).json({ error: 'Failed to check Pinata' });
  }
}