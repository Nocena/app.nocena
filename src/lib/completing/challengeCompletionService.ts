// lib/completing/challengeCompletionService.ts - UPDATED VERSION
import { createChallengeCompletion, updateUserTokens, createNotification } from '../api/dgraph';
import { directPinataUpload } from './directPinataUpload';

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
  hasVideo?: boolean;
  hasSelfie?: boolean;
  videoFileName?: string;
  selfieFileName?: string;
}

export async function completeChallengeWorkflow(
  userId: string,
  completionData: CompletionData,
  updateAuthUser?: (userData: any) => void,
): Promise<{ success: boolean; message: string; completionId?: string }> {
  try {
    const { video, photo, verificationResult, description, challenge } = completionData;

    console.log('Starting challenge completion workflow for user:', userId);
    console.log('Video blob size:', video.size, 'Photo blob size:', photo.size);

    // UPDATED: Use direct upload instead of going through your API
    const { videoCID, selfieCID } = await directPinataUpload.uploadChallengeMedia(video, photo, userId);

    console.log('Media uploaded successfully via direct upload:', { videoCID, selfieCID });

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

    // Create the completion record
    const completionId = await createChallengeCompletion(
      userId,
      challengeId,
      challengeType,
      JSON.stringify(mediaMetadata),
    );

    // Update user's tokens
    await updateUserTokens(userId, challenge.reward);

    // Update the AuthContext if the callback is provided (for AI challenges)
    if (challenge.type === 'AI' && challenge.frequency && updateAuthUser) {
      const updatedCompletionStrings = calculateUpdatedCompletionStrings(
        challenge.frequency as 'daily' | 'weekly' | 'monthly',
      );
      console.log('Updating AuthContext with:', updatedCompletionStrings);
      updateAuthUser(updatedCompletionStrings);
    }

    await handlePostCompletionActions(userId, challengeId, challengeType, challenge, completionId);

    return {
      success: true,
      message: `Challenge completed! +${challenge.reward} Nocenix earned`,
      completionId,
    };
  } catch (error) {
    console.error('Challenge completion failed:', error);
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