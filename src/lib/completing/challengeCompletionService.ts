// lib/completing/challengeCompletionService.ts - UPDATED WITH FILCDN
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
  videoCID: string; // Now FilCDN COMMP
  selfieCID: string; // Now FilCDN COMMP
  timestamp: number;
  description: string;
  verificationResult: any;
  hasVideo?: boolean;
  hasSelfie?: boolean;
  videoFileName?: string;
  selfieFileName?: string;
  // FilCDN specific fields
  videoFileCDNUrl?: string;
  selfieFileCDNUrl?: string;
}

// FilCDN URL construction helper
const getFileCDNUrl = (commp: string): string => {
  const walletAddress = process.env.NEXT_PUBLIC_FILECOIN_WALLET || '0x48Cd52D541A2d130545f3930F5330Ef31cD22B95';
  return `https://${walletAddress}.calibration.filcdn.io/${commp}`;
};

// FilCDN Upload Function for challenge media
const uploadBlobToFileCDN = async (
  blob: Blob,
  fileName: string,
  userId: string,
): Promise<{ commp: string; fileName: string; fileSize: number }> => {
  console.log(`🚀 Starting FilCDN upload for ${fileName}:`, `(${(blob.size / 1024 / 1024).toFixed(2)}MB)`);

  const sessionId = `challenge-${userId}-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
  const chunkSize = 2 * 1024 * 1024; // 2MB chunks
  const totalChunks = Math.ceil(blob.size / chunkSize);

  console.log(`📦 Upload plan: ${totalChunks} chunks of ${chunkSize} bytes each`);

  // Upload chunks sequentially
  for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
    const start = chunkIndex * chunkSize;
    const end = Math.min(start + chunkSize, blob.size);
    const chunk = blob.slice(start, end);

    console.log(`📤 Uploading chunk ${chunkIndex + 1}/${totalChunks} (${chunk.size} bytes)`);

    const formData = new FormData();
    formData.append('chunk', chunk);
    formData.append('sessionId', sessionId);
    formData.append('chunkIndex', chunkIndex.toString());
    formData.append('totalChunks', totalChunks.toString());
    formData.append('fileName', fileName);
    formData.append('totalSize', blob.size.toString());

    const response = await fetch('/api/filcdn/chunked-upload', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Chunk ${chunkIndex} upload failed: ${response.status} - ${errorText}`);
    }

    const result = await response.json();

    if (!result.success) {
      throw new Error(result.error || `Chunk ${chunkIndex} upload failed`);
    }

    console.log(`✅ Chunk ${chunkIndex + 1}/${totalChunks} uploaded successfully`);

    // If this was the last chunk, we should get the final result
    if (result.complete) {
      console.log('🎉 Upload completed!', result.data);
      return {
        commp: result.data.commp,
        fileName: result.data.fileName,
        fileSize: result.data.fileSize,
      };
    }
  }

  throw new Error('Upload completed but no final result received');
};

// Updated media upload function using FilCDN
async function uploadChallengeMediaToFileCDN(
  video: Blob,
  photo: Blob,
  userId: string,
): Promise<{ videoCID: string; selfieCID: string; videoFileCDNUrl: string; selfieFileCDNUrl: string }> {
  console.log('🎬 Starting challenge media upload to FilCDN...');
  const timestamp = Date.now();

  try {
    // Upload video to FilCDN
    console.log('📹 Uploading video to FilCDN...');
    const videoResult = await uploadBlobToFileCDN(video, `challenge_video_${userId}_${timestamp}.webm`, userId);
    const videoFileCDNUrl = getFileCDNUrl(videoResult.commp);
    console.log(`✅ Video uploaded to FilCDN: ${videoResult.commp}`);

    // Upload photo to FilCDN
    console.log('📸 Uploading photo to FilCDN...');
    const photoResult = await uploadBlobToFileCDN(photo, `challenge_selfie_${userId}_${timestamp}.jpg`, userId);
    const selfieFileCDNUrl = getFileCDNUrl(photoResult.commp);
    console.log(`✅ Photo uploaded to FilCDN: ${photoResult.commp}`);

    return {
      videoCID: videoResult.commp, // Using COMMP as CID for consistency
      selfieCID: photoResult.commp, // Using COMMP as CID for consistency
      videoFileCDNUrl,
      selfieFileCDNUrl,
    };
  } catch (error) {
    console.error('❌ FilCDN upload failed:', error);
    throw new Error(
      `Failed to upload challenge media to FilCDN: ${error instanceof Error ? error.message : 'Unknown error'}`,
    );
  }
}

export async function completeChallengeWorkflow(
  userId: string,
  completionData: CompletionData,
  updateAuthUser?: (userData: any) => void,
): Promise<{ success: boolean; message: string; completionId?: string }> {
  try {
    const { video, photo, verificationResult, description, challenge } = completionData;

    console.log('🎯 Starting challenge completion workflow for user:', userId);
    console.log('📊 Media info:', {
      videoSize: `${(video.size / 1024 / 1024).toFixed(2)}MB`,
      photoSize: `${(photo.size / 1024 / 1024).toFixed(2)}MB`,
      challengeType: challenge.type,
    });

    // UPDATED: Use FilCDN instead of Pinata
    const { videoCID, selfieCID, videoFileCDNUrl, selfieFileCDNUrl } = await uploadChallengeMediaToFileCDN(
      video,
      photo,
      userId,
    );

    console.log('🎉 Media uploaded successfully to FilCDN:', {
      videoCID,
      selfieCID,
      videoFileCDNUrl,
      selfieFileCDNUrl,
    });

    const timestamp = Date.now();
    const mediaMetadata: MediaMetadata = {
      videoCID,
      selfieCID,
      timestamp,
      description,
      verificationResult,
      hasVideo: true,
      hasSelfie: true,
      videoFileName: `challenge_video_${userId}_${timestamp}.webm`,
      selfieFileName: `challenge_selfie_${userId}_${timestamp}.jpg`,
      // FilCDN specific URLs
      videoFileCDNUrl,
      selfieFileCDNUrl,
    };

    let challengeId: string;
    let challengeType: 'ai' | 'private' | 'public';

    if (challenge.type === 'AI') {
      challengeType = 'ai';
      challengeId = await getOrCreateSimpleAIChallenge(
        challenge.title,
        challenge.description,
        challenge.reward,
        challenge.frequency || 'daily',
      );
    } else if (challenge.type === 'PRIVATE') {
      challengeType = 'private';
      challengeId = challenge.challengeId!;
      await validatePrivateChallenge(challengeId, userId);
    } else if (challenge.type === 'PUBLIC') {
      challengeType = 'public';
      challengeId = challenge.challengeId!;
      await validatePublicChallenge(challengeId, userId);
    } else {
      throw new Error('Invalid challenge type');
    }

    console.log(`📝 Creating challenge completion record for ${challengeType} challenge: ${challengeId}`);

    // Create the completion record
    const completionId = await createChallengeCompletion(
      userId,
      challengeId,
      challengeType,
      JSON.stringify(mediaMetadata),
    );

    console.log(`💰 Updating user tokens: +${challenge.reward} Nocenix`);

    // Update user's tokens
    await updateUserTokens(userId, challenge.reward);

    // Update the AuthContext if the callback is provided (for AI challenges)
    if (challenge.type === 'AI' && challenge.frequency && updateAuthUser) {
      const updatedCompletionStrings = calculateUpdatedCompletionStrings(
        challenge.frequency as 'daily' | 'weekly' | 'monthly',
      );
      console.log('🔄 Updating AuthContext with:', updatedCompletionStrings);
      updateAuthUser(updatedCompletionStrings);
    }

    await handlePostCompletionActions(userId, challengeId, challengeType, challenge, completionId);

    console.log(`🎉 Challenge completion workflow finished successfully!`);

    return {
      success: true,
      message: `Challenge completed! +${challenge.reward} Nocenix earned`,
      completionId,
    };
  } catch (error) {
    console.error('❌ Challenge completion failed:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Challenge completion failed',
    };
  }
}

// Rest of your existing functions remain the same...
function calculateUpdatedCompletionStrings(challengeType: 'daily' | 'weekly' | 'monthly'): any {
  const now = new Date();

  if (challengeType === 'daily') {
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    const dayOfYear = Math.floor((now.getTime() - startOfYear.getTime()) / (1000 * 60 * 60 * 24));

    const currentString = Array(365).fill('0');
    currentString[dayOfYear] = '1';

    return {
      dailyChallenge: currentString.join(''),
      earnedTokens: 0,
    };
  } else if (challengeType === 'weekly') {
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    const daysSinceStart = Math.floor((now.getTime() - startOfYear.getTime()) / (1000 * 60 * 60 * 24));
    const weekOfYear = Math.floor(daysSinceStart / 7);

    const currentString = Array(52).fill('0');
    currentString[weekOfYear] = '1';

    return {
      weeklyChallenge: currentString.join(''),
      earnedTokens: 0,
    };
  } else {
    const month = now.getMonth();

    const currentString = Array(12).fill('0');
    currentString[month] = '1';

    return {
      monthlyChallenge: currentString.join(''),
      earnedTokens: 0,
    };
  }
}

async function getOrCreateSimpleAIChallenge(
  title: string,
  description: string,
  reward: number,
  frequency: string,
): Promise<string> {
  const axios = (await import('axios')).default;
  const DGRAPH_ENDPOINT = process.env.NEXT_PUBLIC_DGRAPH_ENDPOINT || '';

  const query = `
    query GetRecentAIChallenge($frequency: String!) {
      queryAIChallenge(filter: { frequency: { eq: $frequency }, isActive: true }, order: { desc: createdAt }, first: 1) {
        id
        createdAt
      }
    }
  `;

  const response = await axios.post(
    DGRAPH_ENDPOINT,
    { query, variables: { frequency } },
    { headers: { 'Content-Type': 'application/json' } },
  );

  const existing = response.data.data?.queryAIChallenge?.[0];
  const today = new Date();

  if (existing) {
    const created = new Date(existing.createdAt);
    const sameDay = created.toDateString() === today.toDateString();
    const sameWeek = created.getFullYear() === today.getFullYear() && getWeek(created) === getWeek(today);
    const sameMonth = created.getMonth() === today.getMonth() && created.getFullYear() === today.getFullYear();

    if (
      (frequency === 'daily' && sameDay) ||
      (frequency === 'weekly' && sameWeek) ||
      (frequency === 'monthly' && sameMonth)
    ) {
      return existing.id;
    }
  }

  return await createSimpleAIChallenge(title, description, reward, frequency);
}

function getWeek(date: Date): number {
  const janFirst = new Date(date.getFullYear(), 0, 1);
  const days = Math.floor((date.getTime() - janFirst.getTime()) / 86400000);
  return Math.ceil((date.getDay() + 1 + days) / 7);
}

async function createSimpleAIChallenge(
  title: string,
  description: string,
  reward: number,
  frequency: string,
): Promise<string> {
  const axios = (await import('axios')).default;
  const { v4: uuidv4 } = await import('uuid');
  const DGRAPH_ENDPOINT = process.env.NEXT_PUBLIC_DGRAPH_ENDPOINT || '';
  const id = uuidv4();

  const mutation = `
    mutation CreateAI($id: String!, $title: String!, $description: String!, $reward: Int!, $createdAt: DateTime!, $frequency: String!) {
      addAIChallenge(input: [{ id: $id, title: $title, description: $description, reward: $reward, createdAt: $createdAt, isActive: true, frequency: $frequency }]) {
        aIChallenge { id }
      }
    }
  `;

  const result = await axios.post(
    DGRAPH_ENDPOINT,
    { query: mutation, variables: { id, title, description, reward, createdAt: new Date().toISOString(), frequency } },
    { headers: { 'Content-Type': 'application/json' } },
  );

  return result.data.data.addAIChallenge.aIChallenge[0].id;
}

async function validatePrivateChallenge(challengeId: string, userId: string): Promise<void> {
  const axios = (await import('axios')).default;
  const DGRAPH_ENDPOINT = process.env.NEXT_PUBLIC_DGRAPH_ENDPOINT || '';

  const query = `
    query ($challengeId: String!) {
      getPrivateChallenge(id: $challengeId) {
        id isActive isCompleted expiresAt targetUser { id }
      }
    }
  `;

  const res = await axios.post(DGRAPH_ENDPOINT, {
    query,
    variables: { challengeId },
  });

  const c = res.data.data.getPrivateChallenge;
  if (
    !c ||
    !c.isActive ||
    c.isCompleted ||
    c.targetUser.id !== userId ||
    (c.expiresAt && new Date(c.expiresAt) < new Date())
  ) {
    throw new Error('Private challenge validation failed');
  }
}

async function validatePublicChallenge(challengeId: string, userId: string): Promise<void> {
  const axios = (await import('axios')).default;
  const DGRAPH_ENDPOINT = process.env.NEXT_PUBLIC_DGRAPH_ENDPOINT || '';

  const query = `
    query ($challengeId: String!) {
      getPublicChallenge(id: $challengeId) {
        id isActive participants { id }
      }
    }
  `;

  const res = await axios.post(DGRAPH_ENDPOINT, {
    query,
    variables: { challengeId },
  });

  const c = res.data.data.getPublicChallenge;
  const isParticipant = c.participants.some((p: any) => p.id === userId);
  if (!c || !c.isActive || !isParticipant) throw new Error('Public challenge validation failed');
}

async function handlePostCompletionActions(
  userId: string,
  challengeId: string,
  challengeType: 'ai' | 'private' | 'public',
  challenge: CompletionData['challenge'],
  completionId: string,
): Promise<void> {
  if (challengeType === 'private') {
    await markPrivateChallengeCompleted(challengeId);
    if (challenge.creatorId) {
      await createNotification(challenge.creatorId, userId, `${challenge.title} was completed!`, 'challenge_completed');
    }
  }
}

async function markPrivateChallengeCompleted(challengeId: string): Promise<void> {
  const axios = (await import('axios')).default;
  const DGRAPH_ENDPOINT = process.env.NEXT_PUBLIC_DGRAPH_ENDPOINT || '';
  const mutation = `
    mutation ($challengeId: String!) {
      updatePrivateChallenge(input: { filter: { id: { eq: $challengeId } }, set: { isCompleted: true } }) {
        privateChallenge { id }
      }
    }
  `;

  await axios.post(DGRAPH_ENDPOINT, { query: mutation, variables: { challengeId } });
}
