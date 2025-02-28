import FormData from 'form-data';
import fetch from 'node-fetch';

const PINATA_JWT = process.env.NEXT_PUBLIC_PINATA_JWT || '';
const DEFAULT_PROFILE_PIC = '/profile.png';

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