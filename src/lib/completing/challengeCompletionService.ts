// lib/completing/challengeCompletionService.ts - FIXED VERSION

import { createChallengeCompletion, updateUserTokens, createNotification } from '../api/dgraph';

export interface CompletionData {
  video: Blob;
  photo: Blob;
  verificationResult: any;
  description: string;
  challenge: {
    title: string;
    description: string;
    reward: number;
    type: 'AI' | 'PRIVATE' | 'PUBLIC';
    frequency?: 'daily' | 'weekly' | 'monthly';
    challengeId?: string;
    creatorId?: string;
  };
}

export interface MediaMetadata {
  videoCID: string;
  selfieCID: string;
  timestamp: number;
  description: string;
  verificationResult: any;
  // Legacy compatibility fields
  hasVideo?: boolean;
  hasSelfie?: boolean;
  videoFileName?: string;
  selfieFileName?: string;
}

/**
 * Create a simple AI challenge without date filtering
 * This bypasses the schema issues with day/year fields
 */
async function createSimpleAIChallenge(
  title: string,
  description: string,
  reward: number,
  frequency: string,
): Promise<string> {
  console.log('🤖 Creating simple AI challenge');

  const DGRAPH_ENDPOINT = process.env.NEXT_PUBLIC_DGRAPH_ENDPOINT || '';
  const { v4: uuidv4 } = await import('uuid');
  const axios = (await import('axios')).default;

  const id = uuidv4();
  const createdAt = new Date().toISOString();

  // Create AI challenge with only the fields that exist in your schema
  const mutation = `
      mutation CreateSimpleAIChallenge(
        $id: String!,
        $title: String!,
        $description: String!,
        $reward: Int!,
        $createdAt: DateTime!,
        $frequency: String!
      ) {
        addAIChallenge(input: [{
          id: $id,
          title: $title,
          description: $description,
          reward: $reward,
          createdAt: $createdAt,
          isActive: true,
          frequency: $frequency
        }]) {
          aIChallenge {
            id
            title
            description
            reward
            frequency
          }
        }
      }
    `;

  try {
    const response = await axios.post(
      DGRAPH_ENDPOINT,
      {
        query: mutation,
        variables: {
          id,
          title,
          description,
          reward,
          createdAt,
          frequency,
        },
      },
      {
        headers: { 'Content-Type': 'application/json' },
      },
    );

    if (response.data.errors) {
      console.error('AI challenge creation error:', response.data.errors);
      throw new Error(`Failed to create AI challenge: ${response.data.errors[0].message}`);
    }

    const createdChallenge = response.data.data?.addAIChallenge?.aIChallenge?.[0];
    if (!createdChallenge) {
      throw new Error('No challenge returned from creation mutation');
    }

    console.log('✅ AI challenge created successfully:', createdChallenge.id);
    return createdChallenge.id;
  } catch (error) {
    console.error('❌ Error creating AI challenge:', error);
    throw error;
  }
}

/**
 * Get existing AI challenge or create a new one
 * This version doesn't filter by date fields to avoid schema issues
 */
async function getOrCreateSimpleAIChallenge(
  title: string,
  description: string,
  reward: number,
  frequency: string,
): Promise<string> {
  console.log('🔍 Looking for existing AI challenges');

  const DGRAPH_ENDPOINT = process.env.NEXT_PUBLIC_DGRAPH_ENDPOINT || '';
  const axios = (await import('axios')).default;

  try {
    // Look for recent AI challenges with the same frequency (without date filtering)
    const query = `
        query GetRecentAIChallenge($frequency: String!) {
          queryAIChallenge(
            filter: { 
              frequency: { eq: $frequency }, 
              isActive: true 
            },
            order: { desc: createdAt },
            first: 1
          ) {
            id
            title
            description
            reward
            createdAt
          }
        }
      `;

    const response = await axios.post(
      DGRAPH_ENDPOINT,
      {
        query,
        variables: { frequency },
      },
      {
        headers: { 'Content-Type': 'application/json' },
      },
    );

    if (response.data.errors) {
      console.error('Query error:', response.data.errors);
      // If query fails, just create a new challenge
      return await createSimpleAIChallenge(title, description, reward, frequency);
    }

    const existingChallenges = response.data.data?.queryAIChallenge || [];

    if (existingChallenges.length > 0) {
      const existingChallenge = existingChallenges[0];
      const challengeDate = new Date(existingChallenge.createdAt);
      const today = new Date();

      // Check if the challenge is from today (for daily) or this week (for weekly) etc.
      let shouldUseExisting = false;

      if (frequency === 'daily') {
        // Use if created today
        shouldUseExisting = challengeDate.toDateString() === today.toDateString();
      } else if (frequency === 'weekly') {
        // Use if created this week
        const weekStart = new Date(today);
        weekStart.setDate(today.getDate() - today.getDay());
        shouldUseExisting = challengeDate >= weekStart;
      } else if (frequency === 'monthly') {
        // Use if created this month
        shouldUseExisting =
          challengeDate.getMonth() === today.getMonth() && challengeDate.getFullYear() === today.getFullYear();
      }

      if (shouldUseExisting) {
        console.log('✅ Using existing AI challenge:', existingChallenge.id);
        return existingChallenge.id;
      }
    }

    // Create new challenge if none found or existing is too old
    console.log('🆕 Creating new AI challenge');
    return await createSimpleAIChallenge(title, description, reward, frequency);
  } catch (error) {
    console.error('Error in getOrCreateSimpleAIChallenge:', error);
    // Fallback: create a new challenge
    return await createSimpleAIChallenge(title, description, reward, frequency);
  }
}

/**
 * Complete a challenge by uploading media and creating completion record
 */
export async function completeChallengeWorkflow(
  userId: string,
  completionData: CompletionData,
): Promise<{ success: boolean; message: string; completionId?: string }> {
  try {
    console.log('🎯 Starting challenge completion workflow');

    // Step 1: Upload media to IPFS
    const { videoCID, selfieCID } = await uploadChallengeMedia(completionData.video, completionData.photo);

    // Step 2: Prepare media metadata
    const mediaMetadata: MediaMetadata = {
      videoCID,
      selfieCID,
      timestamp: Date.now(),
      description: completionData.description,
      verificationResult: completionData.verificationResult,
      // Legacy compatibility fields - removed confusing directoryCID
      hasVideo: true,
      hasSelfie: true,
      videoFileName: `challenge_video_${Date.now()}.webm`,
      selfieFileName: `challenge_selfie_${Date.now()}.jpg`,
    };

    // Step 3: Determine challenge type and get/create challenge ID
    let challengeId: string;
    let challengeType: 'private' | 'public' | 'ai';

    if (completionData.challenge.type === 'AI') {
      challengeType = 'ai';
      // Use the fixed AI challenge creation
      challengeId = await getOrCreateSimpleAIChallenge(
        completionData.challenge.title,
        completionData.challenge.description,
        completionData.challenge.reward,
        completionData.challenge.frequency || 'daily',
      );
    } else if (completionData.challenge.type === 'PRIVATE') {
      challengeType = 'private';
      challengeId = completionData.challenge.challengeId!;

      // Validate that private challenge exists and is active
      await validatePrivateChallenge(challengeId, userId);
    } else if (completionData.challenge.type === 'PUBLIC') {
      challengeType = 'public';
      challengeId = completionData.challenge.challengeId!;

      // Validate that public challenge exists and user can participate
      await validatePublicChallenge(challengeId, userId);
    } else {
      throw new Error('Invalid challenge type');
    }

    console.log('📝 Creating completion record for challenge:', challengeId);

    // Step 4: Create completion record in database
    const completionId = await createChallengeCompletion(
      userId,
      challengeId,
      challengeType,
      JSON.stringify(mediaMetadata),
    );

    console.log('💰 Updating user tokens');

    // Step 5: Update user tokens
    await updateUserTokens(userId, completionData.challenge.reward);

    // Step 6: Handle post-completion actions based on challenge type
    await handlePostCompletionActions(userId, challengeId, challengeType, completionData.challenge, completionId);

    console.log('✅ Challenge completion workflow successful');

    return {
      success: true,
      message: `Challenge completed! +${completionData.challenge.reward} Nocenix earned`,
      completionId,
    };
  } catch (error) {
    console.error('❌ Challenge completion workflow failed:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Challenge completion failed',
    };
  }
}

/**
 * Validate that a private challenge exists and the user can complete it
 */
async function validatePrivateChallenge(challengeId: string, userId: string): Promise<void> {
  const DGRAPH_ENDPOINT = process.env.NEXT_PUBLIC_DGRAPH_ENDPOINT || '';
  const axios = (await import('axios')).default;

  const query = `
      query ValidatePrivateChallenge($challengeId: String!) {
        getPrivateChallenge(id: $challengeId) {
          id
          isActive
          isCompleted
          expiresAt
          targetUser {
            id
          }
        }
      }
    `;

  try {
    const response = await axios.post(DGRAPH_ENDPOINT, {
      query,
      variables: { challengeId },
    });

    if (response.data.errors) {
      throw new Error('Private challenge not found');
    }

    const challenge = response.data.data.getPrivateChallenge;
    if (!challenge) {
      throw new Error('Private challenge does not exist');
    }

    if (!challenge.isActive) {
      throw new Error('Private challenge is no longer active');
    }

    if (challenge.isCompleted) {
      throw new Error('Private challenge has already been completed');
    }

    if (challenge.targetUser.id !== userId) {
      throw new Error('You are not the target of this private challenge');
    }

    if (challenge.expiresAt && new Date(challenge.expiresAt) < new Date()) {
      throw new Error('Private challenge has expired');
    }
  } catch (error) {
    console.error('Error validating private challenge:', error);
    throw error;
  }
}

/**
 * Validate that a public challenge exists and the user can participate
 */
async function validatePublicChallenge(challengeId: string, userId: string): Promise<void> {
  const DGRAPH_ENDPOINT = process.env.NEXT_PUBLIC_DGRAPH_ENDPOINT || '';
  const axios = (await import('axios')).default;

  const query = `
      query ValidatePublicChallenge($challengeId: String!) {
        getPublicChallenge(id: $challengeId) {
          id
          isActive
          participantCount
          maxParticipants
          participants {
            id
          }
        }
      }
    `;

  try {
    const response = await axios.post(DGRAPH_ENDPOINT, {
      query,
      variables: { challengeId },
    });

    if (response.data.errors) {
      throw new Error('Public challenge not found');
    }

    const challenge = response.data.data.getPublicChallenge;
    if (!challenge) {
      throw new Error('Public challenge does not exist');
    }

    if (!challenge.isActive) {
      throw new Error('Public challenge is no longer active');
    }

    // Check if user is a participant
    const isParticipant = challenge.participants.some((p: any) => p.id === userId);
    if (!isParticipant) {
      throw new Error('You must join this public challenge before completing it');
    }
  } catch (error) {
    console.error('Error validating public challenge:', error);
    throw error;
  }
}

/**
 * Handle post-completion actions specific to each challenge type
 */
async function handlePostCompletionActions(
  userId: string,
  challengeId: string,
  challengeType: 'private' | 'public' | 'ai',
  challenge: CompletionData['challenge'],
  completionId: string,
): Promise<void> {
  try {
    if (challengeType === 'private') {
      // Mark private challenge as completed
      await markPrivateChallengeCompleted(challengeId);

      // Notify the challenge creator
      if (challenge.creatorId) {
        await createNotification(
          challenge.creatorId,
          userId,
          `${challenge.title} was completed!`,
          'challenge_completed',
        );
      }
    } else if (challengeType === 'public') {
      // For public challenges, we might want to notify other participants
      // or update leaderboards, but for now we'll keep it simple
      console.log('✅ Public challenge completed');
    } else if (challengeType === 'ai') {
      // AI challenges might trigger streak updates or achievements
      console.log('✅ AI challenge completed');
    }
  } catch (error) {
    console.error('⚠️ Post-completion actions failed:', error);
    // Don't throw error here as the main completion was successful
  }
}

/**
 * Mark a private challenge as completed
 */
async function markPrivateChallengeCompleted(challengeId: string): Promise<void> {
  const DGRAPH_ENDPOINT = process.env.NEXT_PUBLIC_DGRAPH_ENDPOINT || '';
  const axios = (await import('axios')).default;

  const mutation = `
      mutation MarkPrivateChallengeCompleted($challengeId: String!) {
        updatePrivateChallenge(
          input: {
            filter: { id: { eq: $challengeId } },
            set: { isCompleted: true }
          }
        ) {
          privateChallenge {
            id
          }
        }
      }
    `;

  try {
    const response = await axios.post(DGRAPH_ENDPOINT, {
      query: mutation,
      variables: { challengeId },
    });

    if (response.data.errors) {
      console.error('Error marking private challenge as completed:', response.data.errors);
      throw new Error('Failed to mark private challenge as completed');
    }
  } catch (error) {
    console.error('Error marking private challenge as completed:', error);
    throw error;
  }
}

/**
 * Upload challenge media (video + selfie) to IPFS
 */
async function uploadChallengeMedia(
  videoBlob: Blob,
  photoBlob: Blob,
): Promise<{ videoCID: string; selfieCID: string }> {
  console.log('📁 Uploading challenge media to IPFS');
  console.log('📊 File sizes:', {
    video: `${(videoBlob.size / 1024 / 1024).toFixed(2)}MB`,
    photo: `${(photoBlob.size / 1024).toFixed(2)}KB`,
  });

  try {
    // Generate unique filenames
    const timestamp = Date.now();
    const videoFileName = `challenge_video_${timestamp}.webm`;
    const photoFileName = `challenge_selfie_${timestamp}.jpg`;

    // Check file sizes and compress if needed
    const maxVideoSize = 50 * 1024 * 1024; // 50MB
    const maxPhotoSize = 5 * 1024 * 1024; // 5MB

    let processedVideoBlob = videoBlob;
    let processedPhotoBlob = photoBlob;

    // Compress video if too large
    if (videoBlob.size > maxVideoSize) {
      console.log('⚠️ Video too large, compressing...');
      processedVideoBlob = await compressVideo(videoBlob);
    }

    // Compress photo if too large
    if (photoBlob.size > maxPhotoSize) {
      console.log('⚠️ Photo too large, compressing...');
      processedPhotoBlob = await compressImage(photoBlob);
    }

    // Convert blobs to base64 (as expected by your API)
    const videoBase64 = await blobToBase64(processedVideoBlob);
    const photoBase64 = await blobToBase64(processedPhotoBlob);

    // Upload both files using your existing API format
    console.log('🚀 Starting uploads...');
    const selfieCID = await uploadFileToAPI(photoBase64, photoFileName, 'image');
    const videoCID = await uploadFileToAPI(videoBase64, videoFileName, 'video');

    console.log('✅ Media upload successful:', { videoCID, selfieCID });

    return { videoCID, selfieCID };
  } catch (error) {
    console.error('❌ Media upload failed:', error);
    throw new Error('Failed to upload challenge media to IPFS');
  }
}

/**
 * Convert blob to base64 string
 */
async function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // Remove the data:image/jpeg;base64, prefix to get just the base64 data
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/**
 * Upload file using your existing API format
 */
async function uploadFileToAPI(base64Data: string, fileName: string, fileType: string): Promise<string> {
  console.log(`📤 Uploading ${fileType}:`, fileName);

  const response = await fetch('/api/pinFileToIPFS', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      file: base64Data,
      fileName: fileName,
      fileType: fileType,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`${fileType} upload error:`, response.status, errorText);
    throw new Error(`${fileType} upload failed: ${response.status} ${errorText}`);
  }

  const result = await response.json();
  console.log(`✅ ${fileType} uploaded:`, result.ipfsHash);
  return result.ipfsHash;
}

/**
 * Compress video if it's too large
 */
async function compressVideo(videoBlob: Blob): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      reject(new Error('Canvas context not available'));
      return;
    }

    video.onloadedmetadata = () => {
      // Reduce dimensions for compression
      canvas.width = Math.min(video.videoWidth, 720);
      canvas.height = Math.min(video.videoHeight, 480);

      // Create a new video with lower quality
      const stream = canvas.captureStream(15); // 15 FPS
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'video/webm;codecs=vp8',
        videoBitsPerSecond: 500000, // 500 kbps
      });

      const chunks: BlobPart[] = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const compressedBlob = new Blob(chunks, { type: 'video/webm' });
        resolve(compressedBlob);
      };

      mediaRecorder.start();

      // Play and record
      video.play();
      video.ontimeupdate = () => {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      };

      video.onended = () => {
        mediaRecorder.stop();
      };

      // Stop after 10 seconds max
      setTimeout(() => {
        if (mediaRecorder.state === 'recording') {
          mediaRecorder.stop();
        }
      }, 10000);
    };

    video.src = URL.createObjectURL(videoBlob);
  });
}

/**
 * Compress image if it's too large
 */
async function compressImage(imageBlob: Blob): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      reject(new Error('Canvas context not available'));
      return;
    }

    img.onload = () => {
      // Calculate new dimensions (max 1024px)
      const maxSize = 1024;
      let { width, height } = img;

      if (width > height) {
        if (width > maxSize) {
          height = (height * maxSize) / width;
          width = maxSize;
        }
      } else {
        if (height > maxSize) {
          width = (width * maxSize) / height;
          height = maxSize;
        }
      }

      canvas.width = width;
      canvas.height = height;

      // Draw and compress
      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (compressedBlob) => {
          if (compressedBlob) {
            resolve(compressedBlob);
          } else {
            reject(new Error('Image compression failed'));
          }
        },
        'image/jpeg',
        0.8, // 80% quality
      );
    };

    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = URL.createObjectURL(imageBlob);
  });
}
