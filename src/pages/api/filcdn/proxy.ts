// pages/api/filcdn/proxy.ts
import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { url } = req.query;

  if (!url || typeof url !== 'string') {
    console.log('❌ [Proxy] Missing or invalid URL parameter');
    return res.status(400).json({ error: 'URL parameter is required' });
  }

  console.log(`🔄 [Proxy] Proxying request to: ${url}`);

  try {
    // For mock URLs, return mock video data
    if (url.includes('mock_')) {
      console.log(`🎭 [Proxy] Returning mock video data for: ${url}`);

      // Generate mock video segment data (simple WebM header + data)
      const mockVideoData = Buffer.from([
        // WebM header
        0x1a,
        0x45,
        0xdf,
        0xa3,
        0x9f,
        0x42,
        0x86,
        0x81,
        0x01,
        0x42,
        0xf7,
        0x81,
        0x01,
        0x42,
        0xf2,
        0x81,
        0x04,
        0x42,
        0xf3,
        0x81,
        0x08,
        0x42,
        0x82,
        0x84,
        0x77,
        0x65,
        0x62,
        0x6d,
        0x42,
        0x87,
        0x81,
        0x02,
        0x42,
        0x85,
        0x81,
        0x02,
        0x18,
        0x53,
        0x80,
        0x67,
        0x01,
        0xff,
        0xff,
        0xff,
        0xff,
        0xff,
        0xff,
        0xff,
        // Mock video data (repeated pattern)
        ...Array(1000).fill([0x00, 0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07]).flat(),
      ]);

      res.setHeader('Content-Type', 'video/webm');
      res.setHeader('Content-Length', mockVideoData.length.toString());
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

      return res.status(200).send(mockVideoData);
    }

    // For real FilCDN URLs, proxy the request
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'User-Agent': 'FilCDN-Proxy/1.0',
      },
    });

    if (!response.ok) {
      console.log(`❌ [Proxy] FilCDN request failed: ${response.status} ${response.statusText}`);
      return res.status(response.status).json({
        error: `FilCDN request failed: ${response.status} ${response.statusText}`,
      });
    }

    const contentType = response.headers.get('content-type') || 'application/octet-stream';
    const contentLength = response.headers.get('content-length');

    console.log(
      `✅ [Proxy] FilCDN response: ${response.status}, Content-Type: ${contentType}, Length: ${contentLength}`,
    );

    // Set response headers
    res.setHeader('Content-Type', contentType);
    if (contentLength) {
      res.setHeader('Content-Length', contentLength);
    }
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Stream the response
    const buffer = await response.arrayBuffer();
    res.status(200).send(Buffer.from(buffer));
  } catch (error) {
    console.error('❌ [Proxy] Error proxying request:', error);
    res.status(500).json({ error: 'Proxy request failed' });
  }
}

export const config = {
  api: {
    responseLimit: '50mb', // Allow large video segments
  },
};
