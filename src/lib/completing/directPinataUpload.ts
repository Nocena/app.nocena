// lib/completing/directPinataUpload.ts
export class DirectPinataUploadService {
  private pinataJWT: string;
  private pinataEndpoint = 'https://api.pinata.cloud/pinning/pinFileToIPFS';

  constructor() {
    this.pinataJWT = process.env.NEXT_PUBLIC_PINATA_JWT || '';
    if (!this.pinataJWT) {
      throw new Error('NEXT_PUBLIC_PINATA_JWT environment variable is required');
    }
  }

  /**
   * Upload a single file directly to Pinata from the client
   */
  async uploadFile(
    file: Blob,
    fileName: string,
    fileType: 'image' | 'video',
    userId: string,
    maxRetries: number = 3,
  ): Promise<string> {
    const timestamp = Date.now();
    const safeUserId = userId.replace(/[^a-zA-Z0-9]/g, '_');
    const fullFileName = `${safeUserId}_${timestamp}_${fileName}`;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`Direct upload attempt ${attempt}/${maxRetries} for ${fullFileName}`);

        const formData = new FormData();
        formData.append('file', file, fullFileName);

        // Add metadata
        const metadata = {
          name: `Nocena ${fileType}: ${fullFileName}`,
          keyvalues: {
            type: 'challenge_proof',
            fileType: fileType,
            userId: userId,
            uploadedAt: new Date().toISOString(),
          },
        };
        formData.append('pinataMetadata', JSON.stringify(metadata));

        // Add options
        const options = {
          cidVersion: 1,
          wrapWithDirectory: false,
        };
        formData.append('pinataOptions', JSON.stringify(options));

        const response = await fetch(this.pinataEndpoint, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${this.pinataJWT}`,
          },
          body: formData,
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error(`Pinata upload failed (attempt ${attempt}):`, response.status, errorText);

          // Don't retry on client errors (4xx)
          if (response.status >= 400 && response.status < 500) {
            throw new Error(`Pinata upload failed: ${response.status} - ${errorText}`);
          }

          throw new Error(`Pinata server error: ${response.status} - ${errorText}`);
        }

        const result = await response.json();

        if (!result.IpfsHash) {
          throw new Error('No IPFS hash returned from Pinata');
        }

        console.log(`Direct upload successful on attempt ${attempt}:`, result.IpfsHash);
        return result.IpfsHash;
      } catch (error) {
        console.error(`Direct upload attempt ${attempt} failed:`, error);

        // Don't retry on certain errors
        if (error instanceof Error) {
          if (error.message.includes('400') || error.message.includes('401') || error.message.includes('403')) {
            throw error;
          }
        }

        // Wait before retrying (exponential backoff)
        if (attempt < maxRetries) {
          const waitTime = Math.min(1000 * Math.pow(2, attempt - 1), 10000);
          console.log(`Waiting ${waitTime}ms before retry...`);
          await new Promise((resolve) => setTimeout(resolve, waitTime));
        } else {
          throw error;
        }
      }
    }

    throw new Error('Upload failed after all retries');
  }

  /**
   * Upload both video and photo for a challenge completion
   */
  async uploadChallengeMedia(
    videoBlob: Blob,
    photoBlob: Blob,
    userId: string,
  ): Promise<{ videoCID: string; selfieCID: string }> {
    console.log('Starting direct challenge media upload...');
    console.log('Video blob size:', videoBlob.size, 'Photo blob size:', photoBlob.size);

    try {
      // Upload photo first (smaller file)
      console.log('Uploading photo directly to Pinata...');
      const selfieCID = await this.uploadFile(photoBlob, 'challenge_selfie.jpg', 'image', userId);
      console.log('Photo uploaded successfully, CID:', selfieCID);

      // Upload video
      console.log('Uploading video directly to Pinata...');
      const videoCID = await this.uploadFile(videoBlob, 'challenge_video.webm', 'video', userId);
      console.log('Video uploaded successfully, CID:', videoCID);

      // Sanity check
      if (videoCID === selfieCID) {
        throw new Error('Upload error: Video and photo have the same CID');
      }

      return { videoCID, selfieCID };
    } catch (error) {
      console.error('Direct challenge media upload failed:', error);
      throw new Error(`Media upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

// Export a singleton instance
export const directPinataUpload = new DirectPinataUploadService();
