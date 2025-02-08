import FormData from 'form-data';
import fetch from 'node-fetch';

const PINATA_JWT = process.env.NEXT_PUBLIC_PINATA_JWT || '';

export const uploadProfilePictureToPinata = async (file: Buffer, fileName: string): Promise<string> => {
  const formData = new FormData();
  formData.append('file', file, fileName);

  console.log('FormData prepared for Pinata upload');
  console.log('FormData headers:', formData.getHeaders());

  try {
    const response = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${PINATA_JWT}`,
        ...formData.getHeaders(), // Ensure headers are correctly set
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
    console.error('Error in uploadProfilePictureToPinata:', error);
    throw error;
  }
};

export const unpinFromPinata = async (cid: string): Promise<void> => {
  try {
    const response = await fetch(`https://api.pinata.cloud/pinning/unpin/${cid}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${process.env.NEXT_PUBLIC_PINATA_JWT}`,
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