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
  'https://gateway.ipfs.io/ipfs'
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
 * Get a video URL from media metadata
 * Updated to work with both individual file CIDs and directory structure
 */
export function getVideoUrl(media: any): string | null {
  if (!media) return null;

  // Check for new format first (individual CIDs)
  if (media.videoCID) {
    return `${IPFS_GATEWAYS[0]}/${media.videoCID}`;
  }
  
  // Fall back to old format for backwards compatibility
  const { directoryCID, videoFileName } = media;
  
  if (!directoryCID || !videoFileName) {
    console.error('Invalid media metadata for video', media);
    return null;
  }
  
  return `${IPFS_GATEWAYS[0]}/${directoryCID}/${videoFileName}`;
}

/**
 * Get a selfie URL from media metadata
 * Updated to work with both individual file CIDs and directory structure
 */
export function getSelfieUrl(media: any): string | null {
  if (!media) return null;

  // Check for new format first (individual CIDs)
  if (media.selfieCID) {
    return `${IPFS_GATEWAYS[0]}/${media.selfieCID}`;
  }
  
  // Fall back to old format for backwards compatibility
  const { directoryCID, selfieFileName } = media;
  
  if (!directoryCID || !selfieFileName) {
    console.error('Invalid media metadata for selfie', media);
    return null;
  }
  
  return `${IPFS_GATEWAYS[0]}/${directoryCID}/${selfieFileName}`;
}

/**
 * Get a backup gateway URL if the primary one fails
 * @param url Original URL
 * @param gatewayIndex Index of the gateway to try
 * @returns New URL with alternative gateway or null if no more gateways
 */
export function getBackupGatewayUrl(url: string | null, gatewayIndex: number): string | null {
  if (!url) return null;
  
  // If we've exhausted all gateways, return null
  if (gatewayIndex >= IPFS_GATEWAYS.length) {
    return null;
  }
  
  // Try to extract CID and path from the URL
  let cidAndPath = '';
  
  // Find which gateway is used in the current URL
  for (const gateway of IPFS_GATEWAYS) {
    if (url.startsWith(gateway)) {
      cidAndPath = url.substring(gateway.length);
      break;
    }
  }
  
  // If we couldn't extract the CID and path, can't create a backup URL
  if (!cidAndPath) {
    console.error('Could not extract CID and path from URL', url);
    return null;
  }
  
  // Return the URL with the new gateway
  return `${IPFS_GATEWAYS[gatewayIndex]}${cidAndPath}`;
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