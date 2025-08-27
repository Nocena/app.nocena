// lib/completing/challengeCompletionService.ts - UPDATED VERSION WITH NFT DATABASE SAVING
import {
  createChallengeCompletion,
  updateUserTokens,
  createNotification,
  saveNFTRewardToDatabase,
} from '../api/dgraph';
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

export interface CompletionResult {
  success: boolean;
  message: string;
  completionId?: string;
  nftReward?: {
    collectionId: string;
    templateType: string;
    templateName: string;
    status: 'generating' | 'failed' | 'saved';
    nftId?: string; // Added to track the database NFT ID
  };
}

export async function completeChallengeWorkflow(
  userId: string,
  completionData: CompletionData,
  updateAuthUser?: (userData: any) => void,
  // NEW: Add NFT data parameter if it was generated in ClaimingScreen
  existingNFTData?: {
    collectionId: string;
    templateType: string;
    templateName: string;
    imageUrl?: string;
    generationPrompt?: string;
    status: 'generating' | 'completed' | 'failed';
  },
): Promise<CompletionResult> {
  try {
    const { video, photo, verificationResult, description, challenge } = completionData;

    console.log('Starting challenge completion workflow for user:', userId);
    console.log('Challenge type:', challenge.type, 'Challenge ID:', challenge.challengeId);
    console.log('Video blob size:', video.size, 'Photo blob size:', photo.size);
    console.log('Existing NFT data:', existingNFTData);

    // Step 1: Upload media to IPFS
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

    // Step 2: Handle challenge validation and get challenge ID
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

    // Step 3: Create the completion record
    const completionId = await createChallengeCompletion(
      userId,
      challengeId,
      challengeType,
      JSON.stringify(mediaMetadata),
    );

    console.log('✅ Challenge completion created with ID:', completionId);

    // Step 4: Update user's tokens
    await updateUserTokens(userId, challenge.reward);

    // Step 5: Update the AuthContext if needed (for AI challenges)
    if (challenge.type === 'AI' && challenge.frequency && updateAuthUser) {
      const updatedCompletionStrings = calculateUpdatedCompletionStrings(
        challenge.frequency as 'daily' | 'weekly' | 'monthly',
      );
      console.log('Updating AuthContext with:', updatedCompletionStrings);
      updateAuthUser(updatedCompletionStrings);
    }

    // Step 6: Save NFT reward to database if it was successfully generated
    let nftRewardResult: CompletionResult['nftReward'];

    if (existingNFTData && existingNFTData.status === 'completed' && existingNFTData.imageUrl) {
      console.log('🎁 Saving completed NFT reward to database...');

      try {
        const nftSaveResult = await saveNFTRewardToDatabase(completionId, {
          collectionId: existingNFTData.collectionId,
          templateType: existingNFTData.templateType,
          templateName: existingNFTData.templateName,
          imageUrl: existingNFTData.imageUrl,
          generationPrompt: existingNFTData.generationPrompt,
          ownerId: userId,
        });

        if (nftSaveResult.success) {
          console.log('✅ NFT reward saved to database successfully:', nftSaveResult.nftId);
          nftRewardResult = {
            collectionId: existingNFTData.collectionId,
            templateType: existingNFTData.templateType,
            templateName: existingNFTData.templateName,
            status: 'saved' as const,
            nftId: nftSaveResult.nftId,
          };
        } else {
          console.error('❌ Failed to save NFT to database:', nftSaveResult.error);
          nftRewardResult = {
            collectionId: existingNFTData.collectionId,
            templateType: existingNFTData.templateType,
            templateName: existingNFTData.templateName,
            status: 'failed' as const,
          };
        }
      } catch (error) {
        console.error('❌ Error saving NFT reward to database:', error);
        nftRewardResult = {
          collectionId: existingNFTData.collectionId,
          templateType: existingNFTData.templateType,
          templateName: existingNFTData.templateName,
          status: 'failed' as const,
        };
      }
    } else if (existingNFTData && existingNFTData.status === 'generating') {
      console.log('⏳ NFT still generating - will save later via polling mechanism');
      nftRewardResult = {
        collectionId: existingNFTData.collectionId,
        templateType: existingNFTData.templateType,
        templateName: existingNFTData.templateName,
        status: 'generating' as const,
      };
    } else if (existingNFTData && existingNFTData.status === 'failed') {
      console.log('❌ NFT generation failed - no database save needed');
      nftRewardResult = {
        collectionId: existingNFTData.collectionId,
        templateType: existingNFTData.templateType,
        templateName: existingNFTData.templateName,
        status: 'failed' as const,
      };
    }

    // Step 7: Handle post-completion actions
    await handlePostCompletionActions(userId, challengeId, challengeType, challenge, completionId);

    // Step 8: Return success with NFT info
    const baseMessage = `Challenge completed! +${challenge.reward} Nocenix earned`;
    const nftMessage =
      nftRewardResult?.status === 'saved'
        ? ` + ${nftRewardResult.templateName} NFT`
        : nftRewardResult?.status === 'generating'
          ? ` (${nftRewardResult.templateName} NFT generating...)`
          : '';

    return {
      success: true,
      message: baseMessage + nftMessage,
      completionId,
      nftReward: nftRewardResult,
    };
  } catch (error) {
    console.error('Challenge completion failed:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Challenge completion failed',
    };
  }
}

// NEW: Function to save NFT after completion (for polling mechanism)
export async function saveNFTRewardAfterCompletion(
  completionId: string,
  userId: string,
  nftData: {
    collectionId: string;
    templateType: string;
    templateName: string;
    imageUrl: string;
    generationPrompt?: string;
  },
): Promise<{ success: boolean; nftId?: string; error?: string }> {
  console.log('🎁 Saving NFT reward after completion for:', { completionId, userId });

  try {
    const result = await saveNFTRewardToDatabase(completionId, {
      ...nftData,
      ownerId: userId,
    });

    if (result.success) {
      console.log('✅ NFT reward saved after completion:', result.nftId);
    } else {
      console.error('❌ Failed to save NFT after completion:', result.error);
    }

    return result;
  } catch (error) {
    console.error('❌ Error in saveNFTRewardAfterCompletion:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

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
  const DGRAPH_ENDPOINT = process.env.NEXT_PUBLIC_DGRAPH_API_KEY
    ? `${process.env.NEXT_PUBLIC_DGRAPH_ENDPOINT}`
    : process.env.NEXT_PUBLIC_DGRAPH_ENDPOINT || '';

  console.log('Validating public challenge:', { challengeId, userId });

  const query = `
    query ValidatePublicChallenge($challengeId: String!) {
      queryPublicChallenge(filter: { id: { eq: $challengeId } }) {
        id 
        isActive 
        participants { 
          id 
        }
        maxParticipants
        participantCount
        creator {
          id
        }
      }
    }
  `;

  const headers: any = {
    'Content-Type': 'application/json',
  };

  if (process.env.NEXT_PUBLIC_DGRAPH_API_KEY) {
    headers['X-Auth-Token'] = process.env.NEXT_PUBLIC_DGRAPH_API_KEY;
  }

  const res = await axios.post(
    DGRAPH_ENDPOINT,
    {
      query,
      variables: { challengeId },
    },
    { headers },
  );

  console.log('Public challenge validation response:', res.data);

  if (res.data.errors && res.data.errors.length > 0) {
    console.error('GraphQL errors:', res.data.errors);

    const alternativeQuery = `
      query GetPublicChallengeByID($challengeId: String!) {
        getPublicChallenge(id: $challengeId) {
          id 
          isActive 
          participants { 
            id 
          }
          maxParticipants
          participantCount
          creator {
            id
          }
        }
      }
    `;

    const altRes = await axios.post(
      DGRAPH_ENDPOINT,
      {
        query: alternativeQuery,
        variables: { challengeId },
      },
      { headers },
    );

    console.log('Alternative query response:', altRes.data);

    if (altRes.data.errors && altRes.data.errors.length > 0) {
      console.error('Alternative query also failed:', altRes.data.errors);
      const errorMessage = altRes.data.errors[0]?.message || 'Unknown error';
      console.error('Specific error:', errorMessage);
      throw new Error(`Database query failed: ${errorMessage}`);
    }

    const challenge = altRes.data.data?.getPublicChallenge;
    return await validateAndAutoJoinChallenge(challenge, challengeId, userId, headers);
  }

  const challenges = res.data.data?.queryPublicChallenge;
  const challenge = challenges && challenges.length > 0 ? challenges[0] : null;

  return await validateAndAutoJoinChallenge(challenge, challengeId, userId, headers);
}

async function validateAndAutoJoinChallenge(
  challenge: any,
  challengeId: string,
  userId: string,
  headers: any,
): Promise<void> {
  if (!challenge) {
    console.error('Public challenge not found:', challengeId);
    throw new Error('Public challenge not found.');
  }

  console.log('Found challenge:', challenge);

  if (!challenge.isActive) {
    console.error('Public challenge is not active:', challengeId);
    throw new Error('This public challenge is no longer active');
  }

  const participants = challenge.participants || [];
  const isParticipant = participants.some((p: any) => p.id === userId);

  console.log('Participant check:', {
    userId,
    participants: participants.map((p: any) => p.id),
    isParticipant,
    totalParticipants: participants.length,
    maxParticipants: challenge.maxParticipants,
  });

  if (isParticipant) {
    console.log('User is already a participant - validation successful');
    return;
  }

  console.log('User is not a participant - auto-joining them to the challenge');

  if (challenge.participantCount >= challenge.maxParticipants) {
    throw new Error('This public challenge is already full and cannot accept more participants');
  }

  const axios = (await import('axios')).default;
  const DGRAPH_ENDPOINT = process.env.NEXT_PUBLIC_DGRAPH_API_KEY
    ? `${process.env.NEXT_PUBLIC_DGRAPH_ENDPOINT}`
    : process.env.NEXT_PUBLIC_DGRAPH_ENDPOINT || '';

  const joinMutation = `
    mutation AutoJoinPublicChallenge($challengeId: String!, $userId: String!, $newCount: Int!) {
      updatePublicChallenge(
        input: {
          filter: { id: { eq: $challengeId } },
          set: {
            participants: [{ id: $userId }],
            participantCount: $newCount
          }
        }
      ) {
        publicChallenge {
          id
          participantCount
          participants {
            id
          }
        }
      }
    }
  `;

  try {
    const joinResponse = await axios.post(
      DGRAPH_ENDPOINT,
      {
        query: joinMutation,
        variables: {
          challengeId,
          userId,
          newCount: challenge.participantCount + 1,
        },
      },
      { headers },
    );

    console.log('Auto-join response:', joinResponse.data);

    if (joinResponse.data.errors) {
      console.error('Error auto-joining challenge:', joinResponse.data.errors);
      throw new Error(`Failed to join challenge: ${joinResponse.data.errors[0]?.message || 'Unknown error'}`);
    }

    const updatedChallenge = joinResponse.data.data?.updatePublicChallenge?.publicChallenge?.[0];
    if (updatedChallenge) {
      console.log('Successfully auto-joined challenge:', {
        challengeId: updatedChallenge.id,
        newParticipantCount: updatedChallenge.participantCount,
        totalParticipants: updatedChallenge.participants.length,
      });
    }

    console.log('Auto-join successful - validation complete');
  } catch (error) {
    console.error('Error during auto-join:', error);
    throw new Error('Failed to join the public challenge. Please try again.');
  }
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

  if (challengeType === 'public' && challenge.creatorId) {
    await createNotification(
      challenge.creatorId,
      userId,
      `Someone completed your public challenge: ${challenge.title}`,
      'challenge_completed',
    );
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
