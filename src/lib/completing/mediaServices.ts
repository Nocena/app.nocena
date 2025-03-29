// lib/completing/mediaServices.ts

import { MediaMetadata, ChallengeParams } from './types';

/**
 * Initializes the back (main) camera for video recording
 */
export async function initializeBackCamera(videoRef: React.RefObject<HTMLVideoElement>): Promise<MediaStream | null> {
  try {
    const constraints: MediaStreamConstraints = {
      audio: true,
      video: {
        facingMode: 'environment', // Use back camera
        width: { ideal: 1280 },
        height: { ideal: 720 },
      },
    };

    const stream = await navigator.mediaDevices.getUserMedia(constraints);

    if (videoRef.current) {
      videoRef.current.srcObject = stream;
      await videoRef.current.play();
    }

    return stream;
  } catch (err) {
    console.error('Error initializing back camera:', err);
    return null;
  }
}

/**
 * Initializes the front (selfie) camera
 * Updated to handle null ref values
 */
export async function initializeFrontCamera(videoRef: React.RefObject<HTMLVideoElement>): Promise<MediaStream | null> {
  try {
    const constraints: MediaStreamConstraints = {
      audio: false, // No audio needed for selfie
      video: {
        facingMode: 'user', // Use front camera
        width: { ideal: 640 },
        height: { ideal: 480 },
      },
    };

    const stream = await navigator.mediaDevices.getUserMedia(constraints);

    if (videoRef.current) {
      videoRef.current.srcObject = stream;
      await videoRef.current.play();
    }

    return stream;
  } catch (err) {
    console.error('Error initializing front camera:', err);
    return null;
  }
}

/**
 * Creates a MediaRecorder instance with optimized settings based on challenge frequency
 */
export function createMediaRecorder(
  stream: MediaStream,
  onDataAvailable: (event: BlobEvent) => void,
  onStop: () => void,
  frequency: 'daily' | 'weekly' | 'monthly' = 'daily',
): MediaRecorder | null {
  try {
    // Determine optimal bitrate and options based on challenge frequency
    // Lower bitrate for longer videos to keep file size manageable
    const bitrates = {
      daily: 2500000, // 2.5 Mbps for daily (30s)
      weekly: 1500000, // 1.5 Mbps for weekly (1min)
      monthly: 1000000, // 1 Mbps for monthly (3min)
    };

    const selectedBitrate = bitrates[frequency];

    // Try supported MIME types in order of preference
    const mimeTypes = ['video/webm;codecs=vp9,opus', 'video/webm;codecs=vp8,opus', 'video/webm', 'video/mp4'];

    // Find first supported mime type
    let options: MediaRecorderOptions = {};
    for (const mimeType of mimeTypes) {
      if (MediaRecorder.isTypeSupported(mimeType)) {
        options = {
          mimeType,
          videoBitsPerSecond: selectedBitrate,
        };
        break;
      }
    }

    // Create recorder with options
    const mediaRecorder = new MediaRecorder(stream, options);

    // Set up event handlers
    mediaRecorder.ondataavailable = onDataAvailable;
    mediaRecorder.onstop = onStop;

    return mediaRecorder;
  } catch (err) {
    console.error('Error creating MediaRecorder:', err);
    return null;
  }
}

/**
 * Compresses video to keep file size manageable
 * Especially important for weekly and monthly challenges
 */
export async function compressVideo(
  videoBlob: Blob,
  frequency: 'daily' | 'weekly' | 'monthly' = 'daily',
): Promise<Blob> {
  // For now, we're just returning the original blob as compression requires a library
  // In a production environment, consider using ffmpeg.wasm or similar
  console.log(`Compression needed for ${frequency} challenge (placeholder)`);

  // In a real implementation, we would:
  // 1. Use appropriate compression settings based on challenge frequency
  // 2. Apply compression to reduce file size while maintaining acceptable quality
  // 3. Return the compressed blob

  return videoBlob;
}

/**
 * Gets the maximum recording duration based on challenge frequency
 */
export function getMaxRecordingDuration(frequency: 'daily' | 'weekly' | 'monthly' = 'daily'): number {
  const durations = {
    daily: 30, // 30 seconds
    weekly: 60, // 1 minute
    monthly: 180, // 3 minutes
  };

  return durations[frequency] || 30;
}

/**
 * Uploads the challenge completion media to IPFS
 * @param videoFile Video file as base64 string
 * @param selfieFile Selfie file as base64 string (optional)
 * @param challengeId The ID of the challenge being completed
 * @param userId The ID of the user completing the challenge
 * @returns Media metadata object with CIDs and properties
 */
export async function uploadMediaToIPFS(
  videoFile: string,
  selfieFile: string | null,
  challengeId: string,
  userId: string,
): Promise<MediaMetadata> {
  try {
    console.log('Starting media upload process');

    // Format the file name to include challenge ID
    const fileName = `challenge_${challengeId}`;

    // Call the API endpoint to upload to IPFS
    console.log('Calling API endpoint for IPFS upload', { fileName });

    const response = await fetch('/api/pinChallengeToIPFS', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        videoFile,
        selfieFile,
        fileName,
        userId,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`Upload failed: ${response.statusText} - ${JSON.stringify(errorData)}`);
    }

    const data = await response.json();
    console.log('Upload API success response:', data);

    if (!data || !data.mediaMetadata) {
      throw new Error('Invalid response from upload API');
    }

    return data.mediaMetadata;
  } catch (error) {
    console.error('Error in uploadMediaToIPFS:', error);
    throw error;
  }
}

/**
 * Converts a video blob to base64
 */
export async function convertVideoToBase64(video: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const base64String = reader.result as string;
      console.log('Video converted to base64', {
        size: Math.round(base64String.length / 1024),
        type: video.type,
      });
      resolve(base64String);
    };
    reader.onerror = reject;
    reader.readAsDataURL(video);
  });
}

/**
 * Converts an image blob to base64
 */
export async function convertImageToBase64(image: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const base64String = reader.result as string;
      console.log('Selfie converted to base64', {
        size: Math.round(base64String.length / 1024),
        type: image.type,
      });
      resolve(base64String);
    };
    reader.onerror = reject;
    reader.readAsDataURL(image);
  });
}
