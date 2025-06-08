// lib/api/pinata.ts

import FormData from 'form-data';
import fetch from 'node-fetch';

const PINATA_JWT = process.env.NEXT_PUBLIC_PINATA_JWT || '';
const DEFAULT_PROFILE_PIC = '/images/profile.png';
const PINATA_GATEWAY = 'https://gateway.pinata.cloud/ipfs/';

// List of IPFS gateways to try if the primary one fails
const IPFS_GATEWAYS = [
  'https://gateway.pinata.cloud/ipfs',
  'https://ipfs.io/ipfs',
  'https://cloudflare-ipfs.com/ipfs',
  'https://dweb.link/ipfs',
  'https://gateway.ipfs.io/ipfs',
];

// If you're using a dedicated Pinata subdomain gateway, add it here
const DEDICATED_GATEWAY = process.env.NEXT_PUBLIC_PINATA_DEDICATED_GATEWAY;
if (DEDICATED_GATEWAY) {
  // Add it as the first (preferred) gateway
  IPFS_GATEWAYS.unshift(DEDICATED_GATEWAY);
}

// Generic upload function for any file type
export const uploadToPinata = async (file: Buffer, fileName: string): Promise<string> => {
  const formData = new FormData();
  formData.append('file', file, fileName);

  console.log('Uploading to Pinata:', fileName);

  try {
    const response = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${PINATA_JWT}`,
        ...formData.getHeaders(),
      },
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Pinata upload failed:', errorText);
      throw new Error(`Pinata upload failed: ${response.statusText} - ${errorText}`);
    }

    const result = await response.json();
    console.log('Pinata upload successful:', result);
    return result.IpfsHash;
  } catch (error) {
    console.error('Error uploading to Pinata:', error);
    throw error;
  }
};

// For backward compatibility
export const uploadProfilePictureToPinata = uploadToPinata;
export const uploadChallengeToPinata = uploadToPinata;

export const unpinFromPinata = async (cid: string): Promise<void> => {
  if (!cid || cid === DEFAULT_PROFILE_PIC.split('/').pop()) {
    console.warn('Skipping unpinning as the CID corresponds to the default profile picture.');
    return;
  }

  try {
    const response = await fetch(`https://api.pinata.cloud/pinning/unpin/${cid}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${PINATA_JWT}`,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to unpin file from Pinata: ${errorText}`);
    }

    console.log('File successfully unpinned from Pinata:', cid);
  } catch (error) {
    console.error('Error unpinning file from Pinata:', error);
    throw error;
  }
};

/**
 * Get a profile picture URL, with fallback
 */
export function getProfilePictureUrl(profilePicture: string | null): string {
  if (!profilePicture) {
    return '/default-avatar.png'; // Fallback to default avatar
  }

  // If it's already a complete URL, return it
  if (profilePicture.startsWith('http')) {
    return profilePicture;
  }

  // If it's a CID, convert to a gateway URL
  if (profilePicture.startsWith('Qm') || profilePicture.startsWith('bafy')) {
    return `${IPFS_GATEWAYS[0]}/${profilePicture}`;
  }

  // Otherwise assume it's a relative path
  return profilePicture;
}

/**
 * Get a backup gateway URL if the primary one fails
 * @param url Original URL
 * @param gatewayIndex Index of the gateway to try
 * @returns New URL with alternative gateway or null if no more gateways
 */
export function getBackupGatewayUrl(url: string | null, gatewayIndex: number): string | null {
  if (!url) return null;

  // Add this line to log which gateway we're trying
  console.log(`Attempting to use gateway index: ${gatewayIndex}`);

  // Use these additional gateways
  const IPFS_GATEWAYS = [
    'https://gateway.pinata.cloud/ipfs',
    'https://jade-elaborate-emu-349.mypinata.cloud/ipfs', // Your dedicated gateway
    'https://ipfs.io/ipfs',
    'https://cloudflare-ipfs.com/ipfs',
    'https://dweb.link/ipfs',
    'https://gateway.ipfs.io/ipfs',
  ];

  // If we're out of gateways, return null
  if (gatewayIndex >= IPFS_GATEWAYS.length) {
    return null;
  }

  try {
    // Parse the URL to extract CID and path
    const urlObj = new URL(url);
    const pathParts = urlObj.pathname.split('/');

    // Find CID part (typically after /ipfs/)
    let cidIndex = -1;
    for (let i = 0; i < pathParts.length; i++) {
      if (pathParts[i] === 'ipfs') {
        cidIndex = i + 1;
        break;
      }
    }

    if (cidIndex >= 0 && cidIndex < pathParts.length) {
      // Extract CID and any additional path
      const cid = pathParts[cidIndex];
      const additionalPath = pathParts.slice(cidIndex + 1).join('/');

      // Construct new URL with the gateway
      let newUrl = `${IPFS_GATEWAYS[gatewayIndex]}/${cid}`;
      if (additionalPath) {
        newUrl += `/${additionalPath}`;
      }

      console.log(`Trying alternative gateway: ${newUrl}`);
      return newUrl;
    }
  } catch (err) {
    console.error('Error parsing IPFS URL:', err);
  }

  return null;
}

/**
 * Check if a URL is accessible
 */
export async function checkUrlAccessibility(url: string): Promise<boolean> {
  try {
    const response = await fetch(url, { method: 'HEAD' });
    return response.ok;
  } catch (error) {
    return false;
  }
}

/**
 * Get a video URL from media metadata
 * Updated to handle your nested structure where directoryCID contains JSON with actual CIDs
 */
export function getVideoUrl(media: any): string | null {
  if (!media) return null;

  // Check for direct videoCID first (new format)
  if (media.videoCID) {
    return `${IPFS_GATEWAYS[0]}/${media.videoCID}`;
  }

  // Handle your specific nested structure where directoryCID contains JSON
  if (media.directoryCID && typeof media.directoryCID === 'string') {
    try {
      const nestedData = JSON.parse(media.directoryCID);
      if (nestedData.videoCID) {
        return `${IPFS_GATEWAYS[0]}/${nestedData.videoCID}`;
      }
    } catch (error) {
      console.error('Error parsing directoryCID for video:', error);
      // If parsing fails, treat directoryCID as a regular CID and try old format
    }
  }

  // Fall back to old format for backwards compatibility
  const { directoryCID, videoFileName } = media;

  if (!directoryCID || !videoFileName) {
    console.error('Invalid media metadata for video', media);
    return null;
  }

  // Only use this if directoryCID is not a JSON string
  if (typeof directoryCID === 'string' && !directoryCID.startsWith('{')) {
    return `${IPFS_GATEWAYS[0]}/${directoryCID}/${videoFileName}`;
  }

  return null;
}

/**
 * Get a selfie URL from media metadata
 * Updated to handle your nested structure where directoryCID contains JSON with actual CIDs
 */
export function getSelfieUrl(media: any): string | null {
  if (!media) return null;

  // Check for direct selfieCID first (new format)
  if (media.selfieCID) {
    return `${IPFS_GATEWAYS[0]}/${media.selfieCID}`;
  }

  // Handle your specific nested structure where directoryCID contains JSON
  if (media.directoryCID && typeof media.directoryCID === 'string') {
    try {
      const nestedData = JSON.parse(media.directoryCID);
      if (nestedData.selfieCID) {
        return `${IPFS_GATEWAYS[0]}/${nestedData.selfieCID}`;
      }
    } catch (error) {
      console.error('Error parsing directoryCID for selfie:', error);
      // If parsing fails, treat directoryCID as a regular CID and try old format
    }
  }

  // Fall back to old format for backwards compatibility
  const { directoryCID, selfieFileName } = media;

  if (!directoryCID || !selfieFileName) {
    console.error('Invalid media metadata for selfie', media);
    return null;
  }

  // Only use this if directoryCID is not a JSON string
  if (typeof directoryCID === 'string' && !directoryCID.startsWith('{')) {
    return `${IPFS_GATEWAYS[0]}/${directoryCID}/${selfieFileName}`;
  }

  return null;
}

/**
 * Helper function to parse and normalize media metadata
 * Fixed TypeScript version with proper type handling
 */
export function parseMediaMetadata(media: string | object | any): any {
  if (!media) return null;

  try {
    let parsedMedia: any = media;

    // Parse string if needed
    if (typeof media === 'string') {
      parsedMedia = JSON.parse(media);
    }

    // Handle your nested structure where directoryCID contains JSON with actual CIDs
    if (parsedMedia && typeof parsedMedia === 'object' && 'directoryCID' in parsedMedia) {
      const directoryCID = parsedMedia.directoryCID;
      if (typeof directoryCID === 'string' && directoryCID.startsWith('{')) {
        try {
          const nestedData = JSON.parse(directoryCID);
          // Merge the nested data with the outer structure, giving priority to nested data
          parsedMedia = { ...parsedMedia, ...nestedData };
        } catch (error) {
          console.error('Error parsing nested directoryCID:', error);
        }
      }
    }

    return parsedMedia;
  } catch (error) {
    console.error('Error parsing media metadata:', error);
    return null;
  }
}

/**
 * Debug helper to understand your data structure (remove in production)
 */
export function debugMediaStructure(media: any): void {
  console.group('🔍 Media Structure Debug');
  console.log('Original media:', media);

  if (typeof media === 'string') {
    try {
      const parsed = JSON.parse(media);
      console.log('Parsed media:', parsed);

      if (parsed.directoryCID && typeof parsed.directoryCID === 'string') {
        if (parsed.directoryCID.startsWith('{')) {
          try {
            const nested = JSON.parse(parsed.directoryCID);
            console.log('Nested CIDs found:', nested);
            console.log('Video CID:', nested.videoCID);
            console.log('Selfie CID:', nested.selfieCID);
          } catch (e) {
            console.log('directoryCID is not nested JSON:', parsed.directoryCID);
          }
        } else {
          console.log('directoryCID appears to be a regular CID:', parsed.directoryCID);
        }
      }
    } catch (e) {
      console.log('Failed to parse media as JSON');
    }
  }

  const normalized = parseMediaMetadata(media);
  console.log('Normalized media:', normalized);
  console.log('Generated video URL:', getVideoUrl(normalized));
  console.log('Generated selfie URL:', getSelfieUrl(normalized));
  console.groupEnd();
}
