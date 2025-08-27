import { v4 as uuidv4 } from 'uuid';
import axios from 'axios';
import { User } from '../../contexts/AuthContext';
import { getDayOfYear, getWeekOfYear } from '../utils/dateUtils';
import { ChallengeFormData, CreateChallengeResponse, PublicChallenge, PrivateChallenge } from '../map/types';

const DGRAPH_ENDPOINT = process.env.NEXT_PUBLIC_DGRAPH_ENDPOINT || '';

const generateId = (): string => {
  return Math.random().toString(36).substring(2, 11) + Math.random().toString(36).substring(2, 11);
};

// User-related functions remain mostly the same, with minor updates to property references

export const registerUser = async (
  username: string,
  bio: string,
  profilePicture: string,
  coverPhoto: string,
  trailerVideo: string,
  wallet: string,
  earnedTokens: number,
  earnedTokensToday: number,
  earnedTokensThisWeek: number,
  earnedTokensThisMonth: number,
  personalField1Type: string,
  personalField1Value: string,
  personalField1Metadata: string,
  personalField2Type: string,
  personalField2Value: string,
  personalField2Metadata: string,
  personalField3Type: string,
  personalField3Value: string,
  personalField3Metadata: string,
  dailyChallenge: string,
  weeklyChallenge: string,
  monthlyChallenge: string,
  inviteCode: string,
  lensHandle: string,
  lensAccountId: string,
  lensTransactionHash: string,
  lensMetadataUri: string,
  invitedById?: string,
  pushSubscription?: string | null,
) => {
  // Normalize wallet address to lowercase for consistency
  const normalizedWallet = wallet.toLowerCase();

  console.log('🔧 REGISTER: Starting user registration with:', {
    username,
    wallet: normalizedWallet,
    inviteCode,
    invitedById,
    hasPushSubscription: !!pushSubscription,
    pushSubscriptionLength: pushSubscription?.length,
    pushSubscriptionValue: pushSubscription || '(empty/null)',
    earnedTokens,
    earnedTokensToday,
    earnedTokensThisWeek,
    earnedTokensThisMonth,
    // Log Lens data
    lensHandle,
    lensAccountId,
    lensTransactionHash: `${lensTransactionHash.substring(0, 10)}...`,
    lensMetadataUri,
  });

  // REMOVED: The validation that was blocking registration without push subscriptions
  // Push subscriptions are now optional - we'll store empty string if not provided
  const finalPushSubscription = pushSubscription || '';

  console.log('🔧 REGISTER: Final push subscription value:', finalPushSubscription ? 'PROVIDED' : 'EMPTY');

  // Validate that all Lens data is provided
  if (!lensHandle || !lensAccountId || !lensTransactionHash || !lensMetadataUri) {
    throw new Error('All Lens Protocol data is required for user registration');
  }

  const mutation = `
    mutation RegisterUser($input: AddUserInput!) {
      addUser(input: [$input]) {
        user {
          id
          username
          wallet
          bio
          profilePicture
          coverPhoto
          trailerVideo
          earnedTokens
          earnedTokensToday
          earnedTokensThisWeek
          earnedTokensThisMonth
          personalField1Type
          personalField1Value
          personalField1Metadata
          personalField2Type
          personalField2Value
          personalField2Metadata
          personalField3Type
          personalField3Value
          personalField3Metadata
          dailyChallenge
          weeklyChallenge
          monthlyChallenge
          pushSubscription
          lensHandle
          lensAccountId
          lensTransactionHash
          lensMetadataUri
          followers {
            id
          }
          following {
            id
          }
        }
      }
    }
  `;

  const userId = uuidv4();
  console.log('🔧 REGISTER: Generated user ID:', userId);

  const variables = {
    input: {
      id: userId,
      username: username,
      bio: bio,
      wallet: normalizedWallet,
      profilePicture: profilePicture,
      coverPhoto: coverPhoto,
      trailerVideo: trailerVideo,
      earnedTokens: earnedTokens,
      earnedTokensToday: earnedTokensToday,
      earnedTokensThisWeek: earnedTokensThisWeek,
      earnedTokensThisMonth: earnedTokensThisMonth,
      personalField1Type: personalField1Type,
      personalField1Value: personalField1Value,
      personalField1Metadata: personalField1Metadata,
      personalField2Type: personalField2Type,
      personalField2Value: personalField2Value,
      personalField2Metadata: personalField2Metadata,
      personalField3Type: personalField3Type,
      personalField3Value: personalField3Value,
      personalField3Metadata: personalField3Metadata,
      dailyChallenge: dailyChallenge,
      weeklyChallenge: weeklyChallenge,
      monthlyChallenge: monthlyChallenge,
      inviteCode: inviteCode,
      invitedById: invitedById || null,
      pushSubscription: finalPushSubscription, // Use the final value (empty string if null)
      // Lens fields are guaranteed to be valid strings
      lensHandle: lensHandle,
      lensAccountId: lensAccountId,
      lensTransactionHash: lensTransactionHash,
      lensMetadataUri: lensMetadataUri,
      // Only add invitedBy reference if invitedById exists and is not 'system'
      ...(invitedById &&
        invitedById !== 'system' && {
          invitedBy: { id: invitedById },
        }),
    },
  };

  console.log('🔧 REGISTER: Mutation variables (push subscription):', {
    pushSubscription: finalPushSubscription ? 'HAS_VALUE' : 'EMPTY',
    pushSubscriptionLength: finalPushSubscription.length,
  });

  try {
    const response = await axios.post(DGRAPH_ENDPOINT, {
      query: mutation,
      variables,
    });

    console.log('🔧 REGISTER: Registration response:', JSON.stringify(response.data, null, 2));

    if (response.data.errors) {
      const errorMessages = response.data.errors.map((err: any) => err.message).join(', ');
      console.error('🔧 REGISTER: GraphQL errors:', response.data.errors);
      throw new Error(`GraphQL Error: ${errorMessages}`);
    }

    // Get the user data from the response
    const userData = response.data.data.addUser.user[0];

    // Format the data to match your User interface
    if (userData) {
      // Convert followers and following from objects to string arrays of ids
      userData.followers = userData.followers?.map((f: any) => f.id) || [];
      userData.following = userData.following?.map((f: any) => f.id) || [];

      // Initialize empty arrays for new users
      userData.notifications = [];
      userData.completedChallenges = [];
      userData.receivedPrivateChallenges = [];
      userData.createdPrivateChallenges = [];
      userData.createdPublicChallenges = [];
      userData.participatingPublicChallenges = [];

      // Log push subscription status
      if (userData.pushSubscription) {
        console.log(
          '🔧 REGISTER: Successfully saved pushSubscription:',
          userData.pushSubscription.substring(0, 50) + '...',
        );
      } else {
        console.log('🔧 REGISTER: No push subscription provided - user can enable later');
      }

      // Verify Lens data was saved (should always be present now)
      console.log('🌿 REGISTER: Successfully saved Lens data:', {
        handle: userData.lensHandle,
        accountId: userData.lensAccountId,
        txHash: userData.lensTransactionHash ? `${userData.lensTransactionHash.substring(0, 10)}...` : 'missing',
        metadataUri: userData.lensMetadataUri,
      });

      // Validate that Lens data was actually saved
      if (!userData.lensHandle || !userData.lensTransactionHash) {
        throw new Error('Failed to save Lens data to database');
      }

      // Verify new media fields were saved
      if (!userData.coverPhoto) {
        console.warn('🔧 REGISTER: Warning - coverPhoto was not saved to database');
        userData.coverPhoto = coverPhoto; // Fallback to provided default
      } else {
        console.log('🔧 REGISTER: Successfully saved coverPhoto:', userData.coverPhoto);
      }

      if (!userData.trailerVideo) {
        console.warn('🔧 REGISTER: Warning - trailerVideo was not saved to database');
        userData.trailerVideo = trailerVideo; // Fallback to provided default
      } else {
        console.log('🔧 REGISTER: Successfully saved trailerVideo:', userData.trailerVideo);
      }

      // Verify token tracking fields were saved
      console.log('🔧 REGISTER: Token tracking fields:', {
        earnedTokens: userData.earnedTokens,
        earnedTokensToday: userData.earnedTokensToday,
        earnedTokensThisWeek: userData.earnedTokensThisWeek,
        earnedTokensThisMonth: userData.earnedTokensThisMonth,
      });

      // Verify personal expression fields were saved
      console.log('🔧 REGISTER: Personal expression fields:', {
        field1: {
          type: userData.personalField1Type,
          value: userData.personalField1Value,
          metadata: userData.personalField1Metadata,
        },
        field2: {
          type: userData.personalField2Type,
          value: userData.personalField2Value,
          metadata: userData.personalField2Metadata,
        },
        field3: {
          type: userData.personalField3Type,
          value: userData.personalField3Value,
          metadata: userData.personalField3Metadata,
        },
      });
    }

    console.log(
      '🔧 REGISTER: Successfully registered user:',
      userData.id,
      userData.username,
      `(notifications: ${userData.pushSubscription ? 'enabled' : 'disabled'})`,
    );
    return userData;
  } catch (error) {
    console.error('🔧 REGISTER: Error during user registration:', error);

    if (error instanceof Error) {
      throw new Error(error.message || 'User registration failed. Please try again.');
    } else {
      throw new Error('An unknown error occurred during user registration.');
    }
  }
};

// New function to update user with Lens data after Lens account creation
export const updateUserLensData = async (
  userId: string,
  lensHandle: string,
  lensAccountId?: string,
  lensTransactionHash?: string,
  lensMetadataUri?: string,
) => {
  console.log('🌿 Updating user with Lens data:', { userId, lensHandle, lensAccountId });

  const mutation = `
    mutation UpdateUserLens($id: ID!, $patch: UserPatch!) {
      updateUser(input: { filter: { id: [$id] }, set: $patch }) {
        user {
          id
          username
          lensHandle
          lensAccountId
          lensTransactionHash
          lensMetadataUri
        }
      }
    }
  `;

  const variables = {
    id: userId,
    patch: {
      lensHandle: lensHandle,
      lensAccountId: lensAccountId || null,
      lensTransactionHash: lensTransactionHash || null,
      lensMetadataUri: lensMetadataUri || null,
    },
  };

  try {
    const response = await axios.post(DGRAPH_ENDPOINT, {
      query: mutation,
      variables,
    });

    if (response.data.errors) {
      throw new Error(`GraphQL Error: ${response.data.errors[0].message}`);
    }

    console.log('🌿 Successfully updated user with Lens data');
    return response.data.data.updateUser.user[0];
  } catch (error) {
    console.error('🌿 Error updating user with Lens data:', error);
    throw error;
  }
};

/**
 * Validates an invite code - FIXED GraphQL types
 */
export const validateInviteCode = async (
  code: string,
): Promise<{ valid: boolean; ownerId?: string; ownerUsername?: string }> => {
  const query = `
    query ValidateInvite($code: String!) {
      queryInviteCode(filter: { code: { eq: $code }, isUsed: false }) {
        id
        ownerId
        owner {
          username
        }
      }
    }
  `;

  try {
    const response = await axios.post(DGRAPH_ENDPOINT, {
      query,
      variables: { code: code.toUpperCase() },
    });

    console.log('🔧 VALIDATE: Validation response:', JSON.stringify(response.data, null, 2));

    const invite = response.data?.data?.queryInviteCode?.[0];

    if (!invite) {
      console.log('🔧 VALIDATE: No invite found for code:', code);
      return { valid: false };
    }

    console.log('🔧 VALIDATE: Found invite:', invite);

    // Handle system codes (which don't have an owner reference)
    let ownerUsername = 'Unknown';
    if (invite.ownerId === 'system') {
      ownerUsername = 'Nocena';
    } else if (invite.owner?.username) {
      ownerUsername = invite.owner.username;
    } else {
      // If there's no owner reference but ownerId exists, try to fetch username separately
      if (invite.ownerId && invite.ownerId !== 'system') {
        try {
          const userQuery = `
            query GetUserById($userId: String!) {
              getUser(id: $userId) {
                username
              }
            }
          `;

          const userResponse = await axios.post(DGRAPH_ENDPOINT, {
            query: userQuery,
            variables: { userId: invite.ownerId },
          });

          if (userResponse.data?.data?.getUser?.username) {
            ownerUsername = userResponse.data.data.getUser.username;
          }
        } catch (userError) {
          console.log('🔧 VALIDATE: Could not fetch owner username:', userError);
          // Continue with 'Unknown' username
        }
      }
    }

    console.log('🔧 VALIDATE: Returning valid invite with owner:', ownerUsername);

    return {
      valid: true,
      ownerId: invite.ownerId,
      ownerUsername: ownerUsername,
    };
  } catch (error) {
    console.error('🔧 VALIDATE: Error validating invite code:', error);
    return { valid: false };
  }
};

/**
 * Marks an invite code as used - FIXED GraphQL types
 */
export const markInviteAsUsed = async (code: string, userId: string): Promise<boolean> => {
  const mutation = `
    mutation markInviteAsUsed($code: String!, $userId: String!, $usedAt: DateTime!) {
      updateInviteCode(
        input: {
          filter: { code: { eq: $code } },
          set: {
            isUsed: true,
            usedById: $userId,
            usedBy: { id: $userId },
            usedAt: $usedAt
          }
        }
      ) {
        inviteCode {
          id
          code
          ownerId
        }
      }
    }
  `;

  try {
    console.log('🔧 MARK_USED: Marking invite code as used:', code, 'by user:', userId);

    const response = await axios.post(DGRAPH_ENDPOINT, {
      query: mutation,
      variables: {
        code: code.toUpperCase(),
        userId,
        usedAt: new Date().toISOString(),
      },
    });

    console.log('🔧 MARK_USED: Response:', JSON.stringify(response.data, null, 2));

    if (response.data.errors) {
      console.error('🔧 MARK_USED: Error marking invite as used:', response.data.errors);
      return false;
    }

    const updatedInvite = response.data?.data?.updateInviteCode?.inviteCode?.[0];
    console.log('🔧 MARK_USED: Successfully marked invite as used:', updatedInvite);

    return true;
  } catch (error) {
    console.error('🔧 MARK_USED: Error using invite code:', error);
    return false;
  }
};

/**
 * Generates invite codes for a user - FIXED GraphQL types
 */
export const generateInviteCode = async (userId: string, source: string = 'earned'): Promise<string | null> => {
  console.log(`🚀 BOOTSTRAP: Starting generateInviteCode for userId: ${userId}, source: ${source}`);

  try {
    if (!DGRAPH_ENDPOINT) {
      throw new Error('DGRAPH_ENDPOINT is not configured');
    }

    // For system/admin codes, skip user validation entirely
    if (userId !== 'system') {
      console.log('🚀 BOOTSTRAP: Checking user limits for regular user');

      // Check current unused invites for regular users
      const checkQuery = `
        query CheckUserInvites($userId: String!) {
          queryInviteCode(filter: { ownerId: { eq: $userId }, isUsed: false }) {
            id
          }
        }
      `;

      const checkResponse = await axios.post(DGRAPH_ENDPOINT, {
        query: checkQuery,
        variables: { userId },
      });

      const unusedCount = checkResponse.data?.data?.queryInviteCode?.length || 0;

      // Set limits based on source
      let maxCodes = 2;
      if (source === 'initial') {
        maxCodes = 2;
      } else if (source === 'earned') {
        maxCodes = 5;
      }

      if (unusedCount >= maxCodes) {
        throw new Error('Maximum invite codes reached');
      }
    } else {
      console.log('🚀 BOOTSTRAP: Creating system code - no user validation needed');
    }

    // Generate unique code
    let code: string;
    let attempts = 0;
    const maxAttempts = 10;

    console.log('🚀 BOOTSTRAP: Starting code generation loop');

    do {
      code = Math.random().toString(36).substring(2, 8).toUpperCase();
      attempts++;
      console.log(`🚀 BOOTSTRAP: Attempt ${attempts}, generated code: ${code}`);

      // Check if code already exists
      const checkCodeQuery = `
        query CheckCodeExists($code: String!) {
          queryInviteCode(filter: { code: { eq: $code } }) {
            id
          }
        }
      `;

      const codeCheckResponse = await axios.post(
        DGRAPH_ENDPOINT,
        {
          query: checkCodeQuery,
          variables: { code },
        },
        {
          headers: {
            'Content-Type': 'application/json',
            ...(process.env.NEXT_PUBLIC_DGRAPH_API_KEY && {
              'X-Auth-Token': process.env.NEXT_PUBLIC_DGRAPH_API_KEY,
            }),
          },
        },
      );

      if (codeCheckResponse.data.errors) {
        console.error('🚀 BOOTSTRAP: GraphQL errors in code check:', codeCheckResponse.data.errors);
        throw new Error(`GraphQL error: ${codeCheckResponse.data.errors[0].message}`);
      }

      const existingCodes = codeCheckResponse.data?.data?.queryInviteCode || [];
      console.log('🚀 BOOTSTRAP: Existing codes found:', existingCodes.length);

      if (existingCodes.length === 0) {
        console.log('🚀 BOOTSTRAP: Code is unique, breaking loop');
        break;
      }
    } while (attempts < maxAttempts);

    if (attempts >= maxAttempts) {
      throw new Error(`Failed to generate unique invite code after ${maxAttempts} attempts`);
    }

    console.log(`🚀 BOOTSTRAP: Found unique code: ${code} after ${attempts} attempts`);

    // Generate a unique ID
    const inviteId = `invite_${code}_${Date.now()}`;

    // Try different mutation approaches based on whether it's system or user
    let mutation: string;
    let variables: any;

    if (userId === 'system') {
      // For system codes - try without owner reference
      console.log('🚀 BOOTSTRAP: Creating system code without owner reference');
      mutation = `
        mutation CreateSystemInviteCode($id: String!, $code: String!, $ownerId: String!, $source: String!, $createdAt: DateTime!) {
          addInviteCode(input: [{
            id: $id,
            code: $code,
            ownerId: $ownerId,
            isUsed: false,
            source: $source,
            createdAt: $createdAt
          }]) {
            inviteCode {
              id
              code
              ownerId
            }
          }
        }
      `;

      variables = {
        id: inviteId,
        code,
        ownerId: 'system',
        source,
        createdAt: new Date().toISOString(),
      };
    } else {
      // For user codes - include owner reference
      console.log('🚀 BOOTSTRAP: Creating user code with owner reference');
      mutation = `
        mutation CreateUserInviteCode($id: String!, $code: String!, $ownerId: String!, $source: String!, $createdAt: DateTime!) {
          addInviteCode(input: [{
            id: $id,
            code: $code,
            ownerId: $ownerId,
            owner: { id: $ownerId },
            isUsed: false,
            source: $source,
            createdAt: $createdAt
          }]) {
            inviteCode {
              id
              code
              ownerId
            }
          }
        }
      `;

      variables = {
        id: inviteId,
        code,
        ownerId: userId,
        source,
        createdAt: new Date().toISOString(),
      };
    }

    console.log('🚀 BOOTSTRAP: Creating invite code...');
    console.log('🚀 BOOTSTRAP: Variables:', JSON.stringify(variables, null, 2));

    const response = await axios.post(
      DGRAPH_ENDPOINT,
      {
        query: mutation,
        variables,
      },
      {
        headers: {
          'Content-Type': 'application/json',
          ...(process.env.NEXT_PUBLIC_DGRAPH_API_KEY && {
            'X-Auth-Token': process.env.NEXT_PUBLIC_DGRAPH_API_KEY,
          }),
        },
      },
    );

    console.log('🚀 BOOTSTRAP: Create response status:', response.status);

    if (response.data.errors) {
      console.error('🚀 BOOTSTRAP: GraphQL errors in creation:', response.data.errors);

      // If it's a system code and the error is about owner being required,
      // let's try a workaround
      if (
        userId === 'system' &&
        response.data.errors.some((err: any) => err.message.includes('owner') || err.message.includes('UserRef'))
      ) {
        console.log('🚀 BOOTSTRAP: Owner field required - this is the bootstrap problem!');
        console.log('🚀 BOOTSTRAP: You need to either:');
        console.log('🚀 BOOTSTRAP: 1. Make the owner field optional in your schema');
        console.log('🚀 BOOTSTRAP: 2. Or create the first user manually and use their ID');

        return null;
      }

      throw new Error(`GraphQL error: ${response.data.errors[0].message}`);
    }

    const createdInvite = response.data?.data?.addInviteCode?.inviteCode?.[0];
    console.log('🚀 BOOTSTRAP: Created invite:', createdInvite);

    if (!createdInvite?.code) {
      console.error('🚀 BOOTSTRAP: No code returned from creation mutation');
      return null;
    }

    console.log(`✅ BOOTSTRAP: Successfully generated invite code: ${createdInvite.code}`);
    return createdInvite.code;
  } catch (error) {
    console.error('🚀 BOOTSTRAP: Error in generateInviteCode:', error);
    if (error instanceof Error) {
      console.error('🚀 BOOTSTRAP: Error message:', error.message);
    }
    return null;
  }
};

/**
 * Gets user's invite statistics - FIXED GraphQL types
 */
export const getUserInviteStats = async (userId: string) => {
  const query = `
    query GetUserInvites($userId: String!) {
      unusedInvites: queryInviteCode(filter: { ownerId: { eq: $userId }, isUsed: false }) {
        code
        createdAt
        source
      }
      usedInvites: queryInviteCode(filter: { ownerId: { eq: $userId }, isUsed: true }) {
        code
        usedAt
        source
        usedBy {
          username
        }
      }
    }
  `;

  try {
    const response = await axios.post(DGRAPH_ENDPOINT, {
      query,
      variables: { userId },
    });

    if (response.data.errors) {
      console.error('Error fetching user invite stats:', response.data.errors);
      return {
        availableInvites: 0,
        totalInvites: 0,
        inviteCode: null,
        friendsInvited: 0,
        tokensEarned: 0,
        canEarnMoreInvites: true,
        inviteCodes: [],
      };
    }

    const data = response.data?.data;
    const unusedInvites = data?.unusedInvites || [];
    const usedInvites = data?.usedInvites || [];

    return {
      availableInvites: unusedInvites.length,
      totalInvites: unusedInvites.length + usedInvites.length,
      inviteCode: unusedInvites[0]?.code || null,
      inviteCodes: unusedInvites.map((invite: any) => ({
        code: invite.code,
        createdAt: invite.createdAt,
        source: invite.source,
      })),
      friendsInvited: usedInvites.length,
      tokensEarned: usedInvites.length * 50,
      canEarnMoreInvites: unusedInvites.length < 5,
      usedInviteDetails: usedInvites.map((invite: any) => ({
        code: invite.code,
        usedAt: invite.usedAt,
        usedByUsername: invite.usedBy?.username || 'Unknown',
        source: invite.source,
      })),
    };
  } catch (error) {
    console.error('Error fetching user invite stats:', error);
    return {
      availableInvites: 0,
      totalInvites: 0,
      inviteCode: null,
      friendsInvited: 0,
      tokensEarned: 0,
      canEarnMoreInvites: true,
      inviteCodes: [],
    };
  }
};

/**
 * Get admin statistics about invite codes - FIXED GraphQL types
 */
export const getAdminInviteStats = async () => {
  const query = `
    query GetAdminInviteStats {
      totalInvites: queryInviteCode {
        id
        source
        isUsed
        createdAt
      }
      systemInvites: queryInviteCode(filter: { ownerId: { eq: "system" } }) {
        id
        code
        isUsed
        source
        createdAt
        usedAt
        usedBy {
          username
        }
      }
    }
  `;

  try {
    const response = await axios.post(DGRAPH_ENDPOINT, {
      query,
    });

    if (response.data.errors) {
      console.error('Error fetching admin invite stats:', response.data.errors);
      return null;
    }

    const data = response.data?.data;
    const totalInvites = data?.totalInvites || [];
    const systemInvites = data?.systemInvites || [];

    // Calculate statistics
    const totalCount = totalInvites.length;
    const usedCount = totalInvites.filter((invite: any) => invite.isUsed).length;
    const unusedCount = totalCount - usedCount;

    const systemUsedCount = systemInvites.filter((invite: any) => invite.isUsed).length;
    const systemUnusedCount = systemInvites.length - systemUsedCount;

    // Group by source
    const bySource = totalInvites.reduce((acc: any, invite: any) => {
      const source = invite.source || 'unknown';
      if (!acc[source]) {
        acc[source] = { total: 0, used: 0, unused: 0 };
      }
      acc[source].total++;
      if (invite.isUsed) {
        acc[source].used++;
      } else {
        acc[source].unused++;
      }
      return acc;
    }, {});

    return {
      total: {
        count: totalCount,
        used: usedCount,
        unused: unusedCount,
        usageRate: totalCount > 0 ? Math.round((usedCount / totalCount) * 100) : 0,
      },
      system: {
        count: systemInvites.length,
        used: systemUsedCount,
        unused: systemUnusedCount,
        usageRate: systemInvites.length > 0 ? Math.round((systemUsedCount / systemInvites.length) * 100) : 0,
      },
      bySource,
      recentSystemUsage: systemInvites
        .filter((invite: any) => invite.isUsed)
        .sort((a: any, b: any) => new Date(b.usedAt).getTime() - new Date(a.usedAt).getTime())
        .slice(0, 10)
        .map((invite: any) => ({
          code: invite.code,
          usedAt: invite.usedAt,
          usedBy: invite.usedBy?.username || 'Unknown',
        })),
    };
  } catch (error) {
    console.error('Error fetching admin invite stats:', error);
    return null;
  }
};

export const getUserFromDgraph = async (walletAddress: string) => {
  console.log('🔍 WALLET LOOKUP: Original wallet address:', walletAddress);

  const normalizedWallet = walletAddress.toLowerCase();
  console.log('🔍 WALLET LOOKUP: Normalized wallet address:', normalizedWallet);

  const query = `
    query GetUserByWallet($walletAddress: String!, $normalizedWallet: String!) {
      queryUser(filter: { 
        or: [
          { wallet: { eq: $walletAddress } },
          { wallet: { eq: $normalizedWallet } }
        ]
      }) {
        id
        username
        wallet
        bio
        profilePicture
        coverPhoto
        trailerVideo
        earnedTokens
        earnedTokensToday
        earnedTokensThisWeek
        earnedTokensThisMonth
        personalField1Type
        personalField1Value
        personalField1Metadata
        personalField2Type
        personalField2Value
        personalField2Metadata
        personalField3Type
        personalField3Value
        personalField3Metadata
        lensHandle
        lensAccountId
        lensTransactionHash
        lensMetadataUri
        pushSubscription
        dailyChallenge
        weeklyChallenge
        monthlyChallenge
        
        # Avatar fields
        currentAvatar
        baseAvatar
        avatarHistory {
          id
          baseImageUrl
          generatedImageUrl
          baseImageCID
          generatedImageCID
          generationPrompt
          generatedAt
          isActive
          equippedCap {
            id
            name
            description
            itemType
            rarity
            tokenBonus
            imageUrl
            imageCID
            generatedAt
            generationPrompt
            isEquipped
            tokenId
            mintTransactionHash
          }
          equippedHoodie {
            id
            name
            description
            itemType
            rarity
            tokenBonus
            imageUrl
            imageCID
            generatedAt
            generationPrompt
            isEquipped
            tokenId
            mintTransactionHash
          }
          equippedPants {
            id
            name
            description
            itemType
            rarity
            tokenBonus
            imageUrl
            imageCID
            generatedAt
            generationPrompt
            isEquipped
            tokenId
            mintTransactionHash
          }
          equippedShoes {
            id
            name
            description
            itemType
            rarity
            tokenBonus
            imageUrl
            imageCID
            generatedAt
            generationPrompt
            isEquipped
            tokenId
            mintTransactionHash
          }
        }
        
        # Equipped NFT items
        equippedCap {
          id
          name
          description
          itemType
          rarity
          tokenBonus
          imageUrl
          imageCID
          generatedAt
          generationPrompt
          isEquipped
          tokenId
          mintTransactionHash
        }
        equippedHoodie {
          id
          name
          description
          itemType
          rarity
          tokenBonus
          imageUrl
          imageCID
          generatedAt
          generationPrompt
          isEquipped
          tokenId
          mintTransactionHash
        }
        equippedPants {
          id
          name
          description
          itemType
          rarity
          tokenBonus
          imageUrl
          imageCID
          generatedAt
          generationPrompt
          isEquipped
          tokenId
          mintTransactionHash
        }
        equippedShoes {
          id
          name
          description
          itemType
          rarity
          tokenBonus
          imageUrl
          imageCID
          generatedAt
          generationPrompt
          isEquipped
          tokenId
          mintTransactionHash
        }
        
        followers {
          id
        }
        following {
          id
        }
        completedChallenges {
          id
          challengeType
          completionDate
          media
          
          # References to the different challenge types
          privateChallenge {
            id
            title
          }
          publicChallenge {
            id
            title
          }
          aiChallenge {
            id
            title
            frequency
          }
        }
      }
    }
  `;

  try {
    console.log('🔍 WALLET LOOKUP: Searching for wallet address with both cases');

    const response = await axios.post(
      DGRAPH_ENDPOINT,
      {
        query,
        variables: {
          walletAddress: walletAddress,
          normalizedWallet: normalizedWallet,
        },
      },
      {
        headers: {
          'Content-Type': 'application/json',
        },
      },
    );

    console.log('🔍 WALLET LOOKUP: Query response:', {
      errors: response.data?.errors,
      userFound: !!response.data?.data?.queryUser?.[0],
      userCount: response.data?.data?.queryUser?.length || 0,
      rawResponse: response.data?.data?.queryUser?.[0] ? 'User data received' : 'No user data',
    });

    if (response.data.errors) {
      console.error('🔍 WALLET LOOKUP: GraphQL errors:', response.data.errors);
      throw new Error(`GraphQL Error: ${response.data.errors[0].message}`);
    }

    const userData = response.data?.data?.queryUser[0] || null;

    // Format the data to match your User interface
    if (userData) {
      console.log('🔍 WALLET LOOKUP: Raw user data fields:', Object.keys(userData));
      console.log('🔍 WALLET LOOKUP: Found user with wallet:', userData.wallet);

      // Convert followers from objects to string array of ids
      userData.followers = userData.followers?.map((f: any) => f.id) || [];
      userData.following = userData.following?.map((f: any) => f.id) || [];

      // Initialize missing arrays for existing users who might not have them
      userData.notifications = userData.notifications || [];
      userData.receivedPrivateChallenges = userData.receivedPrivateChallenges || [];
      userData.createdPrivateChallenges = userData.createdPrivateChallenges || [];
      userData.createdPublicChallenges = userData.createdPublicChallenges || [];
      userData.participatingPublicChallenges = userData.participatingPublicChallenges || [];

      // Ensure token fields have defaults for existing users
      userData.earnedTokens = userData.earnedTokens || 0;
      userData.earnedTokensToday = userData.earnedTokensToday || 0;
      userData.earnedTokensThisWeek = userData.earnedTokensThisWeek || 0;
      userData.earnedTokensThisMonth = userData.earnedTokensThisMonth || 0;

      // Ensure personal expression fields have defaults
      userData.personalField1Type = userData.personalField1Type || '';
      userData.personalField1Value = userData.personalField1Value || '';
      userData.personalField1Metadata = userData.personalField1Metadata || '';
      userData.personalField2Type = userData.personalField2Type || '';
      userData.personalField2Value = userData.personalField2Value || '';
      userData.personalField2Metadata = userData.personalField2Metadata || '';
      userData.personalField3Type = userData.personalField3Type || '';
      userData.personalField3Value = userData.personalField3Value || '';
      userData.personalField3Metadata = userData.personalField3Metadata || '';

      // Ensure Lens fields have defaults for existing users
      userData.lensHandle = userData.lensHandle || null;
      userData.lensAccountId = userData.lensAccountId || null;
      userData.lensTransactionHash = userData.lensTransactionHash || null;
      userData.lensMetadataUri = userData.lensMetadataUri || null;

      // Ensure media fields have defaults
      userData.coverPhoto = userData.coverPhoto || '/images/cover.jpg';
      userData.trailerVideo = userData.trailerVideo || '/trailer.mp4';

      // Ensure push subscription has default
      userData.pushSubscription = userData.pushSubscription || null;

      // Initialize Avatar and NFT fields
      userData.currentAvatar = userData.currentAvatar || null;
      userData.baseAvatar = userData.baseAvatar || null;
      userData.avatarHistory = userData.avatarHistory || [];
      userData.equippedCap = userData.equippedCap || null;
      userData.equippedHoodie = userData.equippedHoodie || null;
      userData.equippedPants = userData.equippedPants || null;
      userData.equippedShoes = userData.equippedShoes || null;

      // Ensure challenge strings have defaults
      userData.dailyChallenge = userData.dailyChallenge || '0'.repeat(365);
      userData.weeklyChallenge = userData.weeklyChallenge || '0'.repeat(52);
      userData.monthlyChallenge = userData.monthlyChallenge || '0'.repeat(12);

      // Format completed challenges to match your interface
      userData.completedChallenges =
        userData.completedChallenges?.map((c: any) => {
          // Determine which challenge type this completion refers to
          let challengeTitle = '';
          let challengeType = '';

          if (c.aiChallenge) {
            challengeTitle = c.aiChallenge.title;
            challengeType = `AI-${c.aiChallenge.frequency}`;
          } else if (c.privateChallenge) {
            challengeTitle = c.privateChallenge.title;
            challengeType = 'private';
          } else if (c.publicChallenge) {
            challengeTitle = c.publicChallenge.title;
            challengeType = 'public';
          }

          return {
            type: challengeType,
            title: challengeTitle,
            date: c.completionDate,
            proofCID: c.media,
          };
        }) || [];

      console.log('🔍 WALLET LOOKUP: Successfully found and formatted user:', {
        id: userData.id,
        username: userData.username,
        wallet: userData.wallet,
        hasLensData: !!(userData.lensHandle || userData.lensAccountId),
        hasPersonalFields: !!(
          userData.personalField1Type ||
          userData.personalField2Type ||
          userData.personalField3Type
        ),
        hasAvatar: !!(userData.currentAvatar || userData.baseAvatar),
        hasEquippedItems: !!(
          userData.equippedCap ||
          userData.equippedHoodie ||
          userData.equippedPants ||
          userData.equippedShoes
        ),
        tokenData: {
          total: userData.earnedTokens,
          today: userData.earnedTokensToday,
          week: userData.earnedTokensThisWeek,
          month: userData.earnedTokensThisMonth,
        },
      });
    } else {
      console.log('🔍 WALLET LOOKUP: No user found for wallet address:', walletAddress);
      console.log('🔍 WALLET LOOKUP: Also searched normalized version:', normalizedWallet);
    }

    return userData;
  } catch (error) {
    console.error('🔍 WALLET LOOKUP: Error fetching user by wallet:', error);
    throw new Error('Failed to fetch user by wallet address.');
  }
};

// Fixed getUserByIdFromDgraph function - matches your schema exactly
export const getUserByIdFromDgraph = async (userId: string) => {
  console.log('=== getUserByIdFromDgraph called ===');
  console.log('userId parameter:', userId);

  const query = `
    query GetUserById($userId: String!) {
      queryUser(filter: { id: { eq: $userId } }) {
        id
        username
        bio
        wallet
        profilePicture
        coverPhoto
        trailerVideo
        earnedTokens
        earnedTokensToday
        earnedTokensThisWeek
        earnedTokensThisMonth
        lastEarningsUpdate
        pushSubscription
        
        # Lens Protocol fields
        lensHandle
        lensAccountId
        lensTransactionHash
        lensMetadataUri
        
        # Personal Expression Fields
        personalField1Type
        personalField1Value
        personalField1Metadata
        personalField2Type
        personalField2Value
        personalField2Metadata
        personalField3Type
        personalField3Value
        personalField3Metadata
        
        # Invite tracking
        invitedById
        inviteCode
        
        # AI challenge tracking
        dailyChallenge
        weeklyChallenge
        monthlyChallenge
        
        # Avatar fields
        currentAvatar
        baseAvatar
        avatarHistory {
          id
          baseImageUrl
          generatedImageUrl
          baseImageCID
          generatedImageCID
          generationPrompt
          generatedAt
          isActive
          equippedCap {
            id
            name
            description
            itemType
            rarity
            tokenBonus
            imageUrl
            imageCID
            generatedAt
            generationPrompt
            isEquipped
            tokenId
            mintTransactionHash
          }
          equippedHoodie {
            id
            name
            description
            itemType
            rarity
            tokenBonus
            imageUrl
            imageCID
            generatedAt
            generationPrompt
            isEquipped
            tokenId
            mintTransactionHash
          }
          equippedPants {
            id
            name
            description
            itemType
            rarity
            tokenBonus
            imageUrl
            imageCID
            generatedAt
            generationPrompt
            isEquipped
            tokenId
            mintTransactionHash
          }
          equippedShoes {
            id
            name
            description
            itemType
            rarity
            tokenBonus
            imageUrl
            imageCID
            generatedAt
            generationPrompt
            isEquipped
            tokenId
            mintTransactionHash
          }
        }
        
        # Equipped NFT items
        equippedCap {
          id
          name
          description
          itemType
          rarity
          tokenBonus
          imageUrl
          imageCID
          generatedAt
          generationPrompt
          isEquipped
          tokenId
          mintTransactionHash
        }
        equippedHoodie {
          id
          name
          description
          itemType
          rarity
          tokenBonus
          imageUrl
          imageCID
          generatedAt
          generationPrompt
          isEquipped
          tokenId
          mintTransactionHash
        }
        equippedPants {
          id
          name
          description
          itemType
          rarity
          tokenBonus
          imageUrl
          imageCID
          generatedAt
          generationPrompt
          isEquipped
          tokenId
          mintTransactionHash
        }
        equippedShoes {
          id
          name
          description
          itemType
          rarity
          tokenBonus
          imageUrl
          imageCID
          generatedAt
          generationPrompt
          isEquipped
          tokenId
          mintTransactionHash
        }
        
        # Relationships
        followers {
          id
        }
        following {
          id
        }
        completedChallenges {
          id
          challengeType
          completionDate
          media
          
          # References to the different challenge types
          privateChallenge {
            id
            title
          }
          publicChallenge {
            id
            title
          }
          aiChallenge {
            id
            title
            frequency
          }
        }
      }
    }
  `;

  try {
    console.log('=== Making Dgraph query ===');
    console.log('Query:', query);
    console.log('Variables:', { userId });

    const response = await axios.post(
      DGRAPH_ENDPOINT,
      {
        query,
        variables: { userId },
      },
      {
        headers: { 'Content-Type': 'application/json' },
      },
    );

    console.log('=== Dgraph response ===');
    console.log('Full response:', response.data);
    console.log('Response data:', response.data?.data);
    console.log('Query result:', response.data?.data?.queryUser);

    const userData = response.data?.data?.queryUser[0] || null;
    console.log('=== Extracted user data ===');
    console.log('userData:', userData);

    // Format the data to match your User interface
    if (userData) {
      console.log('=== Processing user data ===');

      // Convert followers from objects to string array of ids
      userData.followers = userData.followers?.map((f: any) => f.id) || [];
      userData.following = userData.following?.map((f: any) => f.id) || [];

      // Initialize missing arrays for existing users who might not have them
      userData.notifications = userData.notifications || [];
      userData.receivedPrivateChallenges = userData.receivedPrivateChallenges || [];
      userData.createdPrivateChallenges = userData.createdPrivateChallenges || [];
      userData.createdPublicChallenges = userData.createdPublicChallenges || [];
      userData.participatingPublicChallenges = userData.participatingPublicChallenges || [];

      // Ensure token fields have defaults for existing users
      userData.earnedTokens = userData.earnedTokens || 0;
      userData.earnedTokensToday = userData.earnedTokensToday || 0;
      userData.earnedTokensThisWeek = userData.earnedTokensThisWeek || 0;
      userData.earnedTokensThisMonth = userData.earnedTokensThisMonth || 0;

      // Ensure personal expression fields have defaults
      userData.personalField1Type = userData.personalField1Type || '';
      userData.personalField1Value = userData.personalField1Value || '';
      userData.personalField1Metadata = userData.personalField1Metadata || '';
      userData.personalField2Type = userData.personalField2Type || '';
      userData.personalField2Value = userData.personalField2Value || '';
      userData.personalField2Metadata = userData.personalField2Metadata || '';
      userData.personalField3Type = userData.personalField3Type || '';
      userData.personalField3Value = userData.personalField3Value || '';
      userData.personalField3Metadata = userData.personalField3Metadata || '';

      // Ensure Lens fields have defaults for existing users
      userData.lensHandle = userData.lensHandle || null;
      userData.lensAccountId = userData.lensAccountId || null;
      userData.lensTransactionHash = userData.lensTransactionHash || null;
      userData.lensMetadataUri = userData.lensMetadataUri || null;

      // Ensure invite fields have defaults
      userData.invitedById = userData.invitedById || '';
      userData.inviteCode = userData.inviteCode || '';

      // Ensure media fields have defaults
      userData.coverPhoto = userData.coverPhoto || '/images/cover.jpg';
      userData.trailerVideo = userData.trailerVideo || '/trailer.mp4';
      userData.bio = userData.bio || '';

      // Ensure push subscription has default
      userData.pushSubscription = userData.pushSubscription || null;

      // Initialize Avatar and NFT fields
      userData.currentAvatar = userData.currentAvatar || null;
      userData.baseAvatar = userData.baseAvatar || null;
      userData.avatarHistory = userData.avatarHistory || [];
      userData.equippedCap = userData.equippedCap || null;
      userData.equippedHoodie = userData.equippedHoodie || null;
      userData.equippedPants = userData.equippedPants || null;
      userData.equippedShoes = userData.equippedShoes || null;

      // Ensure challenge strings have defaults (very important!)
      userData.dailyChallenge = userData.dailyChallenge || '0'.repeat(365);
      userData.weeklyChallenge = userData.weeklyChallenge || '0'.repeat(52);
      userData.monthlyChallenge = userData.monthlyChallenge || '0'.repeat(12);

      // Format completed challenges to match your interface
      userData.completedChallenges =
        userData.completedChallenges?.map((c: any) => {
          // Determine which challenge type this completion refers to
          let challengeTitle = '';
          let challengeType = '';

          if (c.aiChallenge) {
            challengeTitle = c.aiChallenge.title;
            challengeType = `AI-${c.aiChallenge.frequency}`;
          } else if (c.privateChallenge) {
            challengeTitle = c.privateChallenge.title;
            challengeType = 'private';
          } else if (c.publicChallenge) {
            challengeTitle = c.publicChallenge.title;
            challengeType = 'public';
          }

          return {
            type: challengeType,
            title: challengeTitle,
            date: c.completionDate,
            proofCID: c.media,
          };
        }) || [];

      console.log('=== Final processed user data ===');
      console.log('Processed userData:', {
        id: userData.id,
        username: userData.username,
        hasAvatar: !!(userData.currentAvatar || userData.baseAvatar),
        avatarHistoryCount: userData.avatarHistory?.length || 0,
        hasEquippedItems: !!(
          userData.equippedCap ||
          userData.equippedHoodie ||
          userData.equippedPants ||
          userData.equippedShoes
        ),
      });
    } else {
      console.log('=== No user found ===');
      console.log('queryUser returned:', response.data?.data?.queryUser);
    }

    return userData;
  } catch (error) {
    console.error('=== Error in getUserByIdFromDgraph ===');
    console.error('Error details:', error);
    if (error && typeof error === 'object' && 'response' in error) {
      console.error('Response status:', (error as any).response.status);
      console.error('Response data:', (error as any).response.data);
    }
    throw new Error('Failed to fetch user by ID.');
  }
};

export const updateBio = async (userId: string, newBio: string): Promise<void> => {
  const mutation = `
    mutation UpdateUserBio($id: String!, $bio: String!) {
      updateUser(input: { filter: { id: { eq: $id } }, set: { bio: $bio } }) {
        user {
          id
          bio
        }
      }
    }
  `;

  const variables = {
    id: userId,
    bio: newBio,
  };

  try {
    const response = await axios.post(
      DGRAPH_ENDPOINT,
      {
        query: mutation,
        variables,
      },
      {
        headers: { 'Content-Type': 'application/json' },
      },
    );

    if (response.data.errors) {
      const errorMessages = response.data.errors.map((err: any) => err.message).join(', ');
      throw new Error(`Dgraph Error: ${errorMessages}`);
    }

    console.log('Bio successfully updated in Dgraph:', response.data);
  } catch (error) {
    console.error('Error updating bio in Dgraph:', error);
    throw new Error('Failed to update bio in the database.');
  }
};

export const updateProfilePicture = async (userId: string, profilePictureUrl: string): Promise<void> => {
  const mutation = `
    mutation UpdateUserProfilePicture($id: String!, $profilePicture: String!) {
      updateUser(input: { filter: { id: { eq: $id } }, set: { profilePicture: $profilePicture } }) {
        user {
          id
          profilePicture
        }
      }
    }
  `;

  const variables = {
    id: userId,
    profilePicture: profilePictureUrl,
  };

  try {
    const response = await axios.post(
      DGRAPH_ENDPOINT,
      {
        query: mutation,
        variables,
      },
      {
        headers: { 'Content-Type': 'application/json' },
      },
    );

    if (response.data.errors) {
      const errorMessages = response.data.errors.map((err: any) => err.message).join(', ');
      throw new Error(`Dgraph Error: ${errorMessages}`);
    }

    console.log('Profile picture successfully updated in Dgraph:', response.data);
  } catch (error) {
    console.error('Error updating profile picture in Dgraph:', error);
    throw new Error('Failed to update profile picture in the database.');
  }
};

export const fetchAllUsers = async (): Promise<User[]> => {
  const query = `
    query {
      queryUser(order: { asc: username }) {
        id
        username
        profilePicture
        earnedTokens
        wallet
        followers {
          id
        }
      }
    }
  `;

  try {
    const response = await axios.post(DGRAPH_ENDPOINT, { query }, { headers: { 'Content-Type': 'application/json' } });

    if (response.data.errors) {
      throw new Error(`Dgraph Error: ${response.data.errors.map((e: any) => e.message).join(', ')}`);
    }

    return response.data.data.queryUser.map((user: any) => ({
      ...user,
      followers: user.followers.map((follower: any) => follower.id), // Flatten followers
    }));
  } catch (error) {
    console.error('Error fetching users from Dgraph:', error);
    throw new Error('Failed to fetch users.');
  }
};

export const followUser = async (userId: string, targetUserId: string) => {
  const mutation = `
    mutation FollowUser($userId: String!, $targetUserId: String!) {
      updateUser(input: { filter: { id: { eq: $userId } }, set: { following: [{ id: $targetUserId }] } }) {
        user {
          id
        }
      }
      updateUser(input: { filter: { id: { eq: $targetUserId } }, set: { followers: [{ id: $userId }] } }) {
        user {
          id
        }
      }
    }
  `;

  try {
    const response = await axios.post(
      DGRAPH_ENDPOINT,
      {
        query: mutation,
        variables: { userId, targetUserId },
      },
      { headers: { 'Content-Type': 'application/json' } },
    );

    if (response.data.errors) {
      throw new Error(`Dgraph Error: ${response.data.errors.map((e: any) => e.message).join(', ')}`);
    }
  } catch (error) {
    console.error('Error following user in Dgraph:', error);
    throw new Error('Failed to follow user.');
  }
};

export const unfollowUser = async (userId: string, targetUserId: string) => {
  const mutation = `
    mutation UnfollowUser($userId: String!, $targetUserId: String!) {
      updateUser(input: { filter: { id: { eq: $userId } }, remove: { following: [{ id: $targetUserId }] } }) {
        user {
          id
        }
      }
      updateUser(input: { filter: { id: { eq: $targetUserId } }, remove: { followers: [{ id: $userId }] } }) {
        user {
          id
        }
      }
    }
  `;

  try {
    const response = await axios.post(
      DGRAPH_ENDPOINT,
      {
        query: mutation,
        variables: { userId, targetUserId },
      },
      { headers: { 'Content-Type': 'application/json' } },
    );

    if (response.data.errors) {
      throw new Error(`Dgraph Error: ${response.data.errors.map((e: any) => e.message).join(', ')}`);
    }
  } catch (error) {
    console.error('Error unfollowing user in Dgraph:', error);
    throw new Error('Failed to unfollow user.');
  }
};

export const searchUsers = async (query: string): Promise<any[]> => {
  if (!query || query.trim() === '') return [];

  const escapeRegExp = (str: string) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const safeQuery = escapeRegExp(query.trim());

  const regexPattern = `/${safeQuery}/i`;

  const searchQuery = `
    query searchUsers($pattern: String!) {
      queryUser(filter: { 
        username: { regexp: $pattern }
      }) {
        id
        username
        profilePicture
        wallet  # ✅ Add this field
      }
    }
  `;

  try {
    const response = await fetch(DGRAPH_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: searchQuery,
        variables: { pattern: regexPattern },
      }),
    });

    const data = await response.json();

    if (data.errors) {
      console.error('Dgraph query error:', data.errors);
      return [];
    }

    return data.data?.queryUser || [];
  } catch (error) {
    console.error('Network error:', error);
    return [];
  }
};

export const toggleFollowUser = async (
  currentUserId: string,
  targetUserId: string,
  currentUsername: string,
): Promise<boolean> => {
  if (!currentUserId || !targetUserId || currentUserId === targetUserId) {
    console.error('Invalid user IDs for follow/unfollow operation.', { currentUserId, targetUserId });
    return false;
  }

  console.log(`Toggling follow status: ${currentUserId} -> ${targetUserId}`);

  const checkQuery = `
    query checkFollowStatus($currentUserId: String!, $targetUserId: String!) {
      currentUser: getUser(id: $currentUserId) {
        following(filter: { id: { eq: $targetUserId } }) {
          id
        }
        username
        profilePicture
        wallet
      }
    }
  `;

  try {
    // Check if the current user is already following the target
    const checkResponse = await fetch(DGRAPH_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: checkQuery,
        variables: { currentUserId, targetUserId },
      }),
    });

    const checkData = await checkResponse.json();
    if (checkData.errors) {
      console.error('Dgraph query error:', JSON.stringify(checkData.errors, null, 2));
      return false;
    }

    const currentUser = checkData.data.currentUser;
    if (!currentUser) {
      console.error('Error: Current user not found.');
      return false;
    }

    const isFollowing = currentUser.following?.length > 0;
    console.log(`Current follow status: ${isFollowing}`);

    // Use "remove" for unfollowing, "set" for following
    const mutation = `
      mutation toggleFollow($currentUserId: String!, $targetUserId: String!) {
        updateUser(input: { filter: { id: { eq: $currentUserId } }, 
          ${isFollowing ? 'remove' : 'set'}: { following: [{ id: $targetUserId }] }
        }) {
          user {
            id
          }
        }
        updateUser(input: { filter: { id: { eq: $targetUserId } }, 
          ${isFollowing ? 'remove' : 'set'}: { followers: [{ id: $currentUserId }] }
        }) {
          user {
            id
          }
        }
      }
    `;

    // Execute the follow/unfollow mutation
    const response = await fetch(DGRAPH_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: mutation,
        variables: { currentUserId, targetUserId },
      }),
    });

    const data = await response.json();
    if (data.errors) {
      console.error('Dgraph mutation error:', JSON.stringify(data.errors, null, 2));
      return false;
    }

    if (!isFollowing) {
      console.log('Creating notification with triggeredById:', currentUserId);
      await createNotification(targetUserId, currentUserId, `${currentUsername} followed you`, 'follow');
    }

    console.log(`Follow/unfollow successful: ${currentUserId} -> ${targetUserId}`);
    return true;
  } catch (error) {
    console.error('Network or fetch error:', error);
    return false;
  }
};

/**
 * Fetches the followers for a user
 * @param userId The ID of the user
 * @returns Array of follower IDs
 */
export const fetchUserFollowers = async (userId: string): Promise<string[]> => {
  try {
    const query = `
      query GetUserFollowers($userId: String!) {
        getUser(id: $userId) {
          followers {
            id
          }
        }
      }
    `;

    const response = await fetch(process.env.NEXT_PUBLIC_DGRAPH_ENDPOINT!, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Auth-Token': process.env.NEXT_PUBLIC_DGRAPH_API_KEY!,
      },
      body: JSON.stringify({
        query,
        variables: { userId },
      }),
    });

    const data = await response.json();

    if (data.errors) {
      throw new Error(data.errors[0].message);
    }

    // Extract the IDs from the followers array
    const followerIds = data.data.getUser.followers.map((follower: { id: string }) => follower.id);
    return followerIds || [];
  } catch (error) {
    console.error('Error fetching user followers:', error);
    return [];
  }
};

// Challenge-related functions - these need significant updates

interface MediaMetadata {
  directoryCID: string;
  hasVideo: boolean;
  hasSelfie: boolean;
  timestamp: number;
  videoFileName?: string;
  selfieFileName?: string;
}

/**
 * Creates a private challenge directed at a specific user
 */
export const createPrivateChallenge = async (
  creatorId: string,
  targetUserId: string,
  title: string,
  description: string,
  reward: number,
  expiresInDays: number = 30,
): Promise<string> => {
  const id = uuidv4();
  const now = new Date();
  const createdAt = now.toISOString();
  const expiresAt = new Date(now.getTime() + expiresInDays * 24 * 60 * 60 * 1000).toISOString();

  const mutation = `
    mutation CreatePrivateChallenge(
      $id: String!,
      $title: String!,
      $description: String!,
      $reward: Int!,
      $createdAt: DateTime!,
      $expiresAt: DateTime!,
      $creatorId: String!,
      $targetUserId: String!
    ) {
      addPrivateChallenge(input: [{
        id: $id,
        title: $title,
        description: $description,
        reward: $reward,
        createdAt: $createdAt,
        expiresAt: $expiresAt,
        isActive: true,
        isCompleted: false,
        creator: { id: $creatorId },
        targetUser: { id: $targetUserId }
      }]) {
        privateChallenge {
          id
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
          expiresAt,
          creatorId,
          targetUserId,
        },
      },
      {
        headers: { 'Content-Type': 'application/json' },
      },
    );

    if (response.data.errors) {
      console.error('Dgraph mutation error:', response.data.errors);
      throw new Error('Failed to create private challenge');
    }

    return id;
  } catch (error) {
    console.error('Error creating private challenge:', error);
    throw error;
  }
};

/**
 * Creates a public challenge visible to all users at a specific location
 */
export const createPublicChallenge = async (
  creatorId: string,
  title: string,
  description: string,
  reward: number,
  latitude: number,
  longitude: number,
  maxParticipants: number = 100,
): Promise<string> => {
  const id = uuidv4();
  const createdAt = new Date().toISOString();

  const mutation = `
    mutation CreatePublicChallenge(
      $id: String!,
      $title: String!,
      $description: String!,
      $reward: Int!,
      $createdAt: DateTime!,
      $creatorId: String!,
      $latitude: Float!,
      $longitude: Float!,
      $maxParticipants: Int!
    ) {
      addPublicChallenge(input: [{
        id: $id,
        title: $title,
        description: $description,
        reward: $reward,
        createdAt: $createdAt,
        isActive: true,
        creator: { id: $creatorId },
        location: {
          latitude: $latitude,
          longitude: $longitude
        },
        maxParticipants: $maxParticipants,
        participantCount: 0,
        participants: []
      }]) {
        publicChallenge {
          id
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
          creatorId,
          latitude,
          longitude,
          maxParticipants,
        },
      },
      {
        headers: { 'Content-Type': 'application/json' },
      },
    );

    if (response.data.errors) {
      console.error('Dgraph mutation error:', response.data.errors);
      throw new Error('Failed to create public challenge');
    }

    return id;
  } catch (error) {
    console.error('Error creating public challenge:', error);
    throw error;
  }
};

/**
 * Creates an AI-generated challenge with a specific frequency
 */
export const createAIChallenge = async (
  title: string,
  description: string,
  reward: number,
  frequency: string,
): Promise<string> => {
  const id = uuidv4();
  const now = new Date();
  const createdAt = now.toISOString();

  // Set the specific time period identifiers based on frequency
  let day = null;
  let week = null;
  let month = null;

  if (frequency === 'daily') {
    day = getDayOfYear(now);
  } else if (frequency === 'weekly') {
    week = getWeekOfYear(now);
  } else if (frequency === 'monthly') {
    month = now.getMonth() + 1;
  }

  const year = now.getFullYear();

  const mutation = `
    mutation CreateAIChallenge(
      $id: String!,
      $title: String!,
      $description: String!,
      $reward: Int!,
      $createdAt: DateTime!,
      $frequency: String!,
      $day: Int,
      $week: Int,
      $month: Int,
      $year: Int!
    ) {
      addAIChallenge(input: [{
        id: $id,
        title: $title,
        description: $description,
        reward: $reward,
        createdAt: $createdAt,
        isActive: true,
        frequency: $frequency,
        day: $day,
        week: $week,
        month: $month,
        year: $year
      }]) {
        aiChallenge {
          id
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
          day,
          week,
          month,
          year,
        },
      },
      {
        headers: { 'Content-Type': 'application/json' },
      },
    );

    if (response.data.errors) {
      console.error('Dgraph mutation error:', response.data.errors);
      throw new Error('Failed to create AI challenge');
    }

    return id;
  } catch (error) {
    console.error('Error creating AI challenge:', error);
    throw error;
  }
};

/**
 * Creates a challenge completion record in the database
 * Updated for the new schema with separate challenge types
 */
export const createChallengeCompletion = async (
  userId: string,
  challengeId: string,
  challengeType: 'private' | 'public' | 'ai',
  mediaData: string | MediaMetadata,
): Promise<string> => {
  console.log('Creating challenge completion with parameters:', {
    userId,
    challengeId,
    challengeType,
  });

  const id = uuidv4();
  const now = new Date();

  // Calculate date fields for easier filtering
  const completionDate = now.toISOString();
  const completionDay = getDayOfYear(now);
  const completionWeek = getWeekOfYear(now);
  const completionMonth = now.getMonth() + 1;
  const completionYear = now.getFullYear();

  // Process the media data
  let mediaJson: string;

  if (typeof mediaData === 'string') {
    // Legacy format - just an IPFS hash
    mediaJson = JSON.stringify({
      directoryCID: mediaData,
      hasVideo: false,
      hasSelfie: false,
      timestamp: now.getTime(),
    });
  } else {
    // New format - a MediaMetadata object
    mediaJson = JSON.stringify(mediaData);
  }

  // Define which challenge reference to use based on the challenge type
  let challengeReference: string;
  if (challengeType === 'private') {
    challengeReference = 'privateChallenge: { id: $challengeId }';
  } else if (challengeType === 'public') {
    challengeReference = 'publicChallenge: { id: $challengeId }';
  } else if (challengeType === 'ai') {
    challengeReference = 'aiChallenge: { id: $challengeId }';
  } else {
    throw new Error(`Invalid challenge type: ${challengeType}`);
  }

  const mutation = `
    mutation CreateChallengeCompletion(
      $id: String!,
      $userId: String!,
      $challengeId: String!,
      $mediaJson: String!,
      $completionDate: DateTime!,
      $completionDay: Int!,
      $completionWeek: Int!,
      $completionMonth: Int!,
      $completionYear: Int!,
      $challengeType: String!
    ) {
      addChallengeCompletion(input: [{
        id: $id,
        user: { id: $userId },
        ${challengeReference},
        media: $mediaJson,
        completionDate: $completionDate,
        completionDay: $completionDay,
        completionWeek: $completionWeek,
        completionMonth: $completionMonth,
        completionYear: $completionYear,
        challengeType: $challengeType,
        status: "verified",
        likesCount: 0
      }]) {
        challengeCompletion {
          id
        }
      }
    }
  `;

  try {
    console.log('Creating challenge completion with media:', mediaJson);

    const response = await axios.post(
      DGRAPH_ENDPOINT,
      {
        query: mutation,
        variables: {
          id,
          userId,
          challengeId,
          mediaJson,
          completionDate,
          completionDay,
          completionWeek,
          completionMonth,
          completionYear,
          challengeType,
        },
      },
      {
        headers: { 'Content-Type': 'application/json' },
      },
    );

    if (response.data.errors) {
      console.error('Dgraph mutation error:', response.data.errors);
      throw new Error('Failed to create challenge completion');
    }

    // If this is an AI challenge and the completion was successful,
    // update the user's challenge strings
    if (challengeType === 'ai') {
      try {
        // First, get the AI challenge to determine its frequency
        const getAIChallengeQuery = `
          query GetAIChallenge($challengeId: String!) {
            getAIChallenge(id: $challengeId) {
              frequency
            }
          }
        `;

        const challengeResponse = await axios.post(
          DGRAPH_ENDPOINT,
          {
            query: getAIChallengeQuery,
            variables: { challengeId },
          },
          {
            headers: { 'Content-Type': 'application/json' },
          },
        );

        if (challengeResponse.data.errors) {
          console.error('Error fetching AI challenge:', challengeResponse.data.errors);
        } else {
          const frequency = challengeResponse.data.data.getAIChallenge?.frequency;
          if (frequency) {
            await updateUserChallengeStrings(userId, frequency);
          }
        }
      } catch (error) {
        console.error('Error updating user challenge strings:', error);
        // Don't throw an error here as the completion was still successful
      }
    }

    return id;
  } catch (error) {
    console.error('Error creating challenge completion:', error);
    throw error;
  }
};

/**
 * Updates the user's challenge tracking strings when a challenge is completed
 * This function handles dailyChallenge, weeklyChallenge, and monthlyChallenge fields
 */
export const updateUserChallengeStrings = async (userId: string, frequency: string | null): Promise<void> => {
  console.log(`Updating challenge strings for user ${userId}, frequency ${frequency}`);

  // Skip if no frequency (for non-AI challenges)
  if (!frequency) {
    console.log('No frequency provided, skipping update');
    return;
  }

  // Get the current date
  const now = new Date();

  // Determine which challenge string to update and which position
  let fieldName: string;
  let position: number;

  switch (frequency.toLowerCase()) {
    case 'daily':
      fieldName = 'dailyChallenge';
      position = getDayOfYear(now) - 2; // 0-based index - L: not sure why -2 but it works
      break;
    case 'weekly':
      fieldName = 'weeklyChallenge';
      position = getWeekOfYear(now) - 1; // 0-based index
      break;
    case 'monthly':
      fieldName = 'monthlyChallenge';
      position = now.getMonth(); // 0-based index
      break;
    default:
      console.log(`Unknown frequency: ${frequency}, not updating challenge strings`);
      return;
  }

  console.log(`Updating ${fieldName} at position ${position}`);

  try {
    // Use specific queries for each field type
    let challengeString = '';

    if (fieldName === 'dailyChallenge') {
      const query = `
        query GetUserDailyChallenge($userId: String!) {
          getUser(id: $userId) {
            dailyChallenge
          }
        }
      `;

      const response = await axios.post(
        DGRAPH_ENDPOINT,
        {
          query,
          variables: { userId },
        },
        {
          headers: { 'Content-Type': 'application/json' },
        },
      );

      challengeString = response.data?.data?.getUser?.dailyChallenge || '';
    } else if (fieldName === 'weeklyChallenge') {
      const query = `
        query GetUserWeeklyChallenge($userId: String!) {
          getUser(id: $userId) {
            weeklyChallenge
          }
        }
      `;

      const response = await axios.post(
        DGRAPH_ENDPOINT,
        {
          query,
          variables: { userId },
        },
        {
          headers: { 'Content-Type': 'application/json' },
        },
      );

      challengeString = response.data?.data?.getUser?.weeklyChallenge || '';
    } else if (fieldName === 'monthlyChallenge') {
      const query = `
        query GetUserMonthlyChallenge($userId: String!) {
          getUser(id: $userId) {
            monthlyChallenge
          }
        }
      `;

      const response = await axios.post(
        DGRAPH_ENDPOINT,
        {
          query,
          variables: { userId },
        },
        {
          headers: { 'Content-Type': 'application/json' },
        },
      );

      challengeString = response.data?.data?.getUser?.monthlyChallenge || '';
    }

    console.log(`Current ${fieldName}:`, challengeString);

    // If challenge string is empty/null, create a new one with the right length
    if (!challengeString) {
      const length = fieldName === 'dailyChallenge' ? 365 : fieldName === 'weeklyChallenge' ? 54 : 12;
      challengeString = '0'.repeat(length);
      console.log(`Created new string with length ${length}`);
    }

    // Ensure position is valid
    if (position < 0 || position >= challengeString.length) {
      console.error(`Invalid position ${position} for ${fieldName} with length ${challengeString.length}`);
      throw new Error(`Invalid position ${position} for ${fieldName} with length ${challengeString.length}`);
    }

    // Update the string at the specified position
    const updatedString = challengeString.substring(0, position) + '1' + challengeString.substring(position + 1);

    console.log(`Updated string:`, updatedString);

    // Create specific mutations for each field
    let mutation;
    if (fieldName === 'dailyChallenge') {
      mutation = `
        mutation UpdateUserDailyChallenge($userId: String!, $updatedString: String!) {
          updateUser(input: { 
            filter: { id: { eq: $userId } }, 
            set: { dailyChallenge: $updatedString } 
          }) {
            user {
              id
              dailyChallenge
            }
          }
        }
      `;
    } else if (fieldName === 'weeklyChallenge') {
      mutation = `
        mutation UpdateUserWeeklyChallenge($userId: String!, $updatedString: String!) {
          updateUser(input: { 
            filter: { id: { eq: $userId } }, 
            set: { weeklyChallenge: $updatedString } 
          }) {
            user {
              id
              weeklyChallenge
            }
          }
        }
      `;
    } else if (fieldName === 'monthlyChallenge') {
      mutation = `
        mutation UpdateUserMonthlyChallenge($userId: String!, $updatedString: String!) {
          updateUser(input: { 
            filter: { id: { eq: $userId } }, 
            set: { monthlyChallenge: $updatedString } 
          }) {
            user {
              id
              monthlyChallenge
            }
          }
        }
      `;
    }

    const updateResponse = await axios.post(
      DGRAPH_ENDPOINT,
      {
        query: mutation,
        variables: { userId, updatedString },
      },
      {
        headers: { 'Content-Type': 'application/json' },
      },
    );

    if (updateResponse.data.errors) {
      console.error('Dgraph mutation error:', updateResponse.data.errors);
      throw new Error(`Dgraph mutation error: ${JSON.stringify(updateResponse.data.errors)}`);
    }

    console.log(`Successfully updated ${fieldName}.`);
  } catch (error) {
    console.error(`Error updating user ${fieldName}:`, error);
    throw error;
  }
};

/**
 * Get or create an AI challenge based on today's date and frequency
 * Replaces the old getOrCreateChallenge function for AI challenges
 */
export const getOrCreateAIChallenge = async (
  title: string,
  description: string,
  reward: number,
  frequency: string,
): Promise<string> => {
  const now = new Date();
  const year = now.getFullYear();

  // Set query parameters based on frequency
  let dayParam = null;
  let weekParam = null;
  let monthParam = null;

  if (frequency === 'daily') {
    dayParam = getDayOfYear(now);
  } else if (frequency === 'weekly') {
    weekParam = getWeekOfYear(now);
  } else if (frequency === 'monthly') {
    monthParam = now.getMonth() + 1;
  }

  // Build the filter conditions based on which parameters are set
  let filterConditions = '';
  if (dayParam) filterConditions += `day: { eq: ${dayParam} }, `;
  if (weekParam) filterConditions += `week: { eq: ${weekParam} }, `;
  if (monthParam) filterConditions += `month: { eq: ${monthParam} }, `;

  // Add year and frequency to the filter conditions
  filterConditions += `year: { eq: ${year} }, frequency: { eq: "${frequency}" }`;

  // First, try to find an existing AI challenge with the matching criteria
  const query = `
    query GetExistingAIChallenge {
      queryAIChallenge(filter: { ${filterConditions} }) {
        id
      }
    }
  `;

  try {
    const queryResponse = await axios.post(
      DGRAPH_ENDPOINT,
      { query },
      { headers: { 'Content-Type': 'application/json' } },
    );

    if (queryResponse.data.errors) {
      throw new Error(`Dgraph query error: ${JSON.stringify(queryResponse.data.errors)}`);
    }

    // If AI challenge exists, return its ID
    if (queryResponse.data.data.queryAIChallenge && queryResponse.data.data.queryAIChallenge.length > 0) {
      return queryResponse.data.data.queryAIChallenge[0].id;
    }

    // Otherwise, create a new AI challenge
    return await createAIChallenge(title, description, reward, frequency);
  } catch (error) {
    console.error('Error getting or creating AI challenge:', error);
    throw error;
  }
};

/**
 * Fetch user's completions within a date range
 */
export async function fetchUserCompletions(
  userId: string,
  startDate: string,
  endDate: string,
  challengeType?: 'ai' | 'private' | 'public',
): Promise<any[]> {
  const axios = (await import('axios')).default;
  const DGRAPH_ENDPOINT = process.env.NEXT_PUBLIC_DGRAPH_ENDPOINT || '';

  try {
    // Build the filter object properly
    let filterConditions = ['{ completionDate: { between: { min: $startDate, max: $endDate } } }'];

    if (challengeType === 'ai') {
      filterConditions.push('{ has: aiChallenge }');
    } else if (challengeType === 'private') {
      filterConditions.push('{ has: privateChallenge }');
    } else if (challengeType === 'public') {
      filterConditions.push('{ has: publicChallenge }');
    }

    const filterString =
      filterConditions.length > 1 ? `and: [${filterConditions.join(', ')}]` : filterConditions[0].slice(1, -1); // Remove outer braces for single condition

    // Query through User's completedChallenges field
    const query = `
      query FetchUserCompletions($userId: String!, $startDate: DateTime!, $endDate: DateTime!) {
        getUser(id: $userId) {
          completedChallenges(
            filter: { 
              ${filterString}
            }
            order: { desc: completionDate }
          ) {
          id
          media
          completionDate
          completionDay
          completionWeek
          completionMonth
          completionYear
          status
          challengeType
          likesCount
          user {
            id
            username
            profilePicture
          }
          aiChallenge {
            id
            title
            description
            frequency
            reward
          }
          privateChallenge {
            id
            title
            description
            reward
          }
          publicChallenge {
            id
            title
            description
            reward
          }
        }
      }
    `;

    const response = await axios.post(
      DGRAPH_ENDPOINT,
      {
        query,
        variables: {
          userId,
          startDate,
          endDate,
        },
      },
      { headers: { 'Content-Type': 'application/json' } },
    );

    if (response.data.errors) {
      console.error('GraphQL errors:', response.data.errors);
      throw new Error('Failed to fetch user completions');
    }

    return response.data.data?.getUser?.completedChallenges || [];
  } catch (error) {
    console.error('Error fetching user completions:', error);
    throw error;
  }
}

/**
 * Fetch user's latest AI completion (regardless of date)
 */
export async function fetchLatestUserCompletion(
  userId: string,
  challengeType: 'ai' | 'private' | 'public' = 'ai',
): Promise<any | null> {
  const axios = (await import('axios')).default;
  const DGRAPH_ENDPOINT = process.env.NEXT_PUBLIC_DGRAPH_ENDPOINT || '';

  try {
    let hasCondition = 'has: aiChallenge';
    if (challengeType === 'private') {
      hasCondition = 'has: privateChallenge';
    } else if (challengeType === 'public') {
      hasCondition = 'has: publicChallenge';
    }

    const query = `
      query GetLatestUserCompletion($userId: String!) {
        getUser(id: $userId) {
          completedChallenges(
            filter: { 
              and: [
                { ${hasCondition} },
                { challengeType: { eq: "${challengeType}" } }
              ]
            }
            order: { desc: completionDate }
            first: 1
          ) {
            id
            media
            completionDate
            completionDay
            completionWeek
            completionMonth
            completionYear
            status
            challengeType
            likesCount
            user {
              id
              username
              profilePicture
            }
            aiChallenge {
              id
              title
              description
              frequency
              reward
              day
              week
              month
              year
            }
            privateChallenge {
              id
              title
              description
              reward
            }
            publicChallenge {
              id
              title
              description
              reward
            }
          }
        }
      }
    `;

    console.log('Fetching latest completion for user:', userId);

    const response = await axios.post(
      DGRAPH_ENDPOINT,
      {
        query,
        variables: {
          userId,
        },
      },
      { headers: { 'Content-Type': 'application/json' } },
    );

    if (response.data.errors) {
      console.error('GraphQL errors:', response.data.errors);
      throw new Error('Failed to fetch latest user completion');
    }

    const completions = response.data.data?.getUser?.completedChallenges || [];
    return completions.length > 0 ? completions[0] : null;
  } catch (error) {
    console.error('Error fetching latest user completion:', error);
    throw error;
  }
}

/**
 * Fetch follower completions for a given date and challenge frequency
 */
export async function fetchFollowerCompletions(userId: string, date: string, frequency: string): Promise<any[]> {
  const axios = (await import('axios')).default;
  const DGRAPH_ENDPOINT = process.env.NEXT_PUBLIC_DGRAPH_ENDPOINT || '';

  try {
    // Calculate date range for the given date
    const targetDate = new Date(date);
    let startDate: Date;
    let endDate: Date;

    if (frequency === 'daily') {
      startDate = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate());
      endDate = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate(), 23, 59, 59);
    } else if (frequency === 'weekly') {
      const dayOfWeek = targetDate.getDay();
      const monday = new Date(targetDate);
      monday.setDate(targetDate.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
      monday.setHours(0, 0, 0, 0);

      startDate = monday;
      endDate = new Date(monday);
      endDate.setDate(monday.getDate() + 6);
      endDate.setHours(23, 59, 59);
    } else {
      startDate = new Date(targetDate.getFullYear(), targetDate.getMonth(), 1);
      endDate = new Date(targetDate.getFullYear(), targetDate.getMonth() + 1, 0, 23, 59, 59);
    }

    const query = `
      query FetchFollowerCompletions($userId: String!, $startDate: DateTime!, $endDate: DateTime!) {
        getUser(id: $userId) {
          following {
            id
            username
            profilePicture
            completedChallenges(
              filter: { 
                and: [
                  { completionDate: { between: { min: $startDate, max: $endDate } } },
                  { has: aiChallenge },
                  { challengeType: { eq: "ai" } }
                ]
              }
              order: { desc: completionDate }
              first: 1
            ) {
              id
              media
              completionDate
              status
              challengeType
              aiChallenge {
                id
                title
                frequency
              }
            }
          }
        }
      }
    `;

    console.log('Fetching follower completions:', {
      userId,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
    });

    const response = await axios.post(
      DGRAPH_ENDPOINT,
      {
        query,
        variables: {
          userId,
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
        },
      },
      { headers: { 'Content-Type': 'application/json' } },
    );

    if (response.data.errors) {
      console.error('GraphQL errors:', response.data.errors);
      throw new Error('Failed to fetch follower completions');
    }

    const following = response.data.data?.getUser?.following || [];

    // Transform the data to match expected format
    const completions = following
      .filter((user: any) => user.completedChallenges.length > 0)
      .map((user: any) => ({
        userId: user.id,
        username: user.username,
        profilePicture: user.profilePicture,
        completion: user.completedChallenges[0], // Get the most recent completion
      }));

    console.log('Transformed follower completions:', completions);
    return completions;
  } catch (error) {
    console.error('Error fetching follower completions:', error);
    throw error;
  }
}

/**
 * Check if user has completed a specific challenge type for current period
 */
export function hasCompletedChallenge(user: any, challengeType: 'daily' | 'weekly' | 'monthly'): boolean {
  if (!user) return false;

  const now = new Date();

  if (challengeType === 'daily') {
    const dayOfYear = Math.floor((now.getTime() - new Date(now.getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24));
    return user.dailyChallenge?.charAt(dayOfYear - 1) === '1';
  } else if (challengeType === 'weekly') {
    const weekOfYear = Math.ceil(
      ((now.getTime() - new Date(now.getFullYear(), 0, 1).getTime()) / 86400000 +
        new Date(now.getFullYear(), 0, 1).getDay() +
        1) /
        7,
    );
    return user.weeklyChallenge?.charAt(weekOfYear - 1) === '1';
  } else {
    const month = now.getMonth();
    return user.monthlyChallenge?.charAt(month) === '1';
  }
}

/**
 * Parse media metadata from string or object
 */
export function parseMediaMetadata(media: string | object): any {
  if (!media) return null;

  try {
    if (typeof media === 'string') {
      const parsed = JSON.parse(media);

      // Handle nested structure where directoryCID contains the actual CIDs
      if (parsed.directoryCID && typeof parsed.directoryCID === 'string') {
        try {
          const nestedData = JSON.parse(parsed.directoryCID);
          return { ...parsed, ...nestedData };
        } catch {
          return parsed;
        }
      }

      return parsed;
    }

    return media;
  } catch (error) {
    console.error('Error parsing media metadata:', error);
    return null;
  }
}

/**
 * Get today's completion for a specific challenge type
 * This is a helper function for backwards compatibility
 */
export function getTodaysCompletion(user: any, challengeType: 'daily' | 'weekly' | 'monthly'): any {
  // This function would need to be updated to actually fetch from the database
  // For now, it returns null since we're using the new fetchUserCompletions function
  // You can remove this function and update any references to use fetchUserCompletions instead
  return null;
}

/**
 * Update the notification type to work with the new schema
 * Enhanced to support references to specific challenge types
 */
export const createChallengeNotification = async (
  recipientId: string,
  triggeredById: string,
  content: string,
  notificationType: string,
  challengeType: 'private' | 'public' | 'ai' | null = null,
  challengeId: string | null = null,
): Promise<boolean> => {
  const id = generateId();
  const createdAt = new Date().toISOString();

  // Build the challenge reference based on the challenge type
  let challengeReference = '';
  if (challengeType && challengeId) {
    if (challengeType === 'private') {
      challengeReference = `privateChallenge: { id: "${challengeId}" },`;
    } else if (challengeType === 'public') {
      challengeReference = `publicChallenge: { id: "${challengeId}" },`;
    } else if (challengeType === 'ai') {
      challengeReference = `aiChallenge: { id: "${challengeId}" },`;
    }
  }

  const mutation = `
    mutation createNotification(
      $id: String!,
      $userId: String!,
      $triggeredById: String!,
      $content: String!,
      $notificationType: String!,
      $isRead: Boolean!,
      $createdAt: DateTime!
    ) {
      addNotification(input: [{
        id: $id,
        user: { id: $userId },
        userId: $userId,
        triggeredBy: { id: $triggeredById },
        triggeredById: $triggeredById,
        content: $content,
        notificationType: $notificationType,
        ${challengeReference}
        isRead: $isRead,
        createdAt: $createdAt
      }]) {
        notification {
          id
        }
      }
    }
  `;

  try {
    const response = await fetch(DGRAPH_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: mutation,
        variables: {
          id,
          userId: recipientId,
          triggeredById,
          content,
          notificationType,
          isRead: false,
          createdAt,
        },
      }),
    });

    const data = await response.json();
    if (data.errors) {
      console.error('Error creating notification:', data.errors);
      return false;
    }
    return true;
  } catch (error) {
    console.error('Network error creating notification:', error);
    return false;
  }
};

export const createNotification = async (
  recipientId: string,
  triggeredById: string,
  content: string,
  notificationType: string,
): Promise<boolean> => {
  const id = generateId();
  const createdAt = new Date().toISOString();

  const mutation = `
    mutation createNotification(
      $id: String!,
      $userId: String!,
      $triggeredById: String!,
      $content: String!,
      $notificationType: String!,
      $isRead: Boolean!,
      $createdAt: DateTime!
    ) {
      addNotification(input: [{
        id: $id,
        user: { id: $userId },
        userId: $userId,
        triggeredBy: { id: $triggeredById },
        triggeredById: $triggeredById,
        content: $content,
        notificationType: $notificationType,
        isRead: $isRead,
        createdAt: $createdAt
      }]) {
        notification {
          id
        }
      }
    }
  `;

  try {
    const response = await fetch(DGRAPH_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: mutation,
        variables: {
          id,
          userId: recipientId,
          triggeredById,
          content,
          notificationType,
          isRead: false,
          createdAt,
        },
      }),
    });

    const data = await response.json();
    if (data.errors) {
      console.error('Error creating notification:', data.errors);
      return false;
    }
    return true;
  } catch (error) {
    console.error('Network error creating notification:', error);
    return false;
  }
};

export const fetchNotifications = async (userId: string) => {
  const query = `
    query getNotifications($userId: String!) {
      queryNotification(filter: { userId: { eq: $userId } }) {
        id
        content
        notificationType
        isRead
        createdAt

        triggeredBy {
          id
          username
          profilePicture
          wallet
        }
        
        # Include challenge references
        privateChallenge {
          id
          title
          description
        }
        publicChallenge {
          id
          title
          description
        }
        aiChallenge {
          id
          title
          description
          frequency
        }
      }
    }
  `;

  try {
    const response = await fetch(DGRAPH_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, variables: { userId } }),
    });

    const data = await response.json();
    if (data.errors) {
      console.error('Error fetching notifications:', data.errors);
      return [];
    }

    return data.data?.queryNotification || [];
  } catch (error) {
    console.error('Network error fetching notifications:', error);
    return [];
  }
};

export const fetchUnreadNotificationsCount = async (userId: string) => {
  const query = `
    query GetUnreadNotifications($userId: String!) {
      queryNotification(
        filter: { userId: { eq: $userId }, isRead: false }
      ) {
        id
      }
    }
  `;

  try {
    const response = await fetch(DGRAPH_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query,
        variables: { userId: userId },
      }),
    });

    const data = await response.json();
    if (data.errors) {
      console.error('GraphQL Errors:', {
        errors: data.errors,
        query,
        variables: { userId },
      });
      return 0;
    }

    return data.data?.queryNotification.length || 0;
  } catch (error) {
    console.error('Network error fetching unread notifications:', error);
    return 0;
  }
};

export const markNotificationsAsRead = async (userId: string) => {
  const mutation = `
    mutation MarkAllNotificationsRead($userId: String!) {
      updateNotification(
        input: {
          filter: { userId: { eq: $userId }, isRead: false },
          set: { isRead: true }
        }
      ) {
        numUids
      }
    }
  `;

  try {
    const response = await fetch(DGRAPH_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: mutation,
        variables: { userId: userId },
      }),
    });

    const data = await response.json();
    if (data.errors) {
      console.error('GraphQL Errors:', {
        errors: data.errors,
        mutation,
        variables: { userId },
      });
      return false;
    }

    return true;
  } catch (error) {
    console.error('Network error marking notifications as read:', error);
    return false;
  }
};

/**
 * Updates user's token balance and time-based earnings tracking
 * FIXED: Get current values first, then set new totals
 */
export const updateUserTokens = async (userId: string, tokenAmount: number): Promise<void> => {
  console.log(`Updating tokens for user ${userId}: +${tokenAmount}`);

  if (tokenAmount <= 0) {
    throw new Error('Token amount must be positive');
  }

  const now = new Date();

  try {
    // First, get the current token values
    const getUserQuery = `
      query GetUserTokens($userId: String!) {
        getUser(id: $userId) {
          earnedTokens
          earnedTokensToday
          earnedTokensThisWeek
          earnedTokensThisMonth
        }
      }
    `;

    const getUserResponse = await axios.post(
      DGRAPH_ENDPOINT,
      {
        query: getUserQuery,
        variables: { userId },
      },
      {
        headers: { 'Content-Type': 'application/json' },
      },
    );

    if (getUserResponse.data.errors) {
      console.error('Error fetching current user tokens:', getUserResponse.data.errors);
      throw new Error('Failed to fetch current user tokens');
    }

    const currentUser = getUserResponse.data.data.getUser;
    if (!currentUser) {
      throw new Error('User not found');
    }

    // Calculate new totals
    const newEarnedTokens = (currentUser.earnedTokens || 0) + tokenAmount;
    const newEarnedTokensToday = (currentUser.earnedTokensToday || 0) + tokenAmount;
    const newEarnedTokensThisWeek = (currentUser.earnedTokensThisWeek || 0) + tokenAmount;
    const newEarnedTokensThisMonth = (currentUser.earnedTokensThisMonth || 0) + tokenAmount;

    // Update with new totals
    const updateMutation = `
      mutation UpdateUserTokens(
        $userId: String!,
        $earnedTokens: Int!,
        $earnedTokensToday: Int!,
        $earnedTokensThisWeek: Int!,
        $earnedTokensThisMonth: Int!,
        $lastEarningsUpdate: DateTime!
      ) {
        updateUser(input: {
          filter: { id: { eq: $userId } },
          set: {
            earnedTokens: $earnedTokens,
            earnedTokensToday: $earnedTokensToday,
            earnedTokensThisWeek: $earnedTokensThisWeek,
            earnedTokensThisMonth: $earnedTokensThisMonth,
            lastEarningsUpdate: $lastEarningsUpdate
          }
        }) {
          user {
            id
            earnedTokens
            earnedTokensToday
            earnedTokensThisWeek
            earnedTokensThisMonth
            lastEarningsUpdate
          }
        }
      }
    `;

    const updateResponse = await axios.post(
      DGRAPH_ENDPOINT,
      {
        query: updateMutation,
        variables: {
          userId,
          earnedTokens: newEarnedTokens,
          earnedTokensToday: newEarnedTokensToday,
          earnedTokensThisWeek: newEarnedTokensThisWeek,
          earnedTokensThisMonth: newEarnedTokensThisMonth,
          lastEarningsUpdate: now.toISOString(),
        },
      },
      {
        headers: { 'Content-Type': 'application/json' },
      },
    );

    if (updateResponse.data.errors) {
      console.error('Dgraph mutation error:', updateResponse.data.errors);
      throw new Error('Failed to update user tokens');
    }

    const updatedUser = updateResponse.data.data.updateUser.user[0];
    console.log('Successfully updated user tokens:', {
      userId,
      tokenAmount: `+${tokenAmount}`,
      newTotal: updatedUser.earnedTokens,
      todayTotal: updatedUser.earnedTokensToday,
      weekTotal: updatedUser.earnedTokensThisWeek,
      monthTotal: updatedUser.earnedTokensThisMonth,
    });
  } catch (error) {
    console.error('Error updating user tokens:', error);
    throw error;
  }
};

export const handleChallengeCreation = async (
  userId: string,
  challengeData: ChallengeFormData,
  mode: 'private' | 'public',
) => {
  try {
    if (mode === 'private') {
      // Handle private challenge creation
      // First check if the necessary property exists
      if (!('targetUserId' in challengeData) || !challengeData.targetUserId) {
        throw new Error('Target user ID is required for private challenges');
      }

      // The existing createPrivateChallenge doesn't use expiresAt directly, it uses expiresInDays
      // So we'll calculate days from now to the expiresAt date, or use default of 7 days
      const expiresInDays = challengeData.expiresAt
        ? Math.ceil((new Date(challengeData.expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
        : 7;

      const challengeId = await createPrivateChallenge(
        userId,
        challengeData.targetUserId,
        challengeData.challengeName,
        challengeData.description,
        challengeData.reward,
        expiresInDays,
      );

      // Fetch the target user's username to include in the success message
      const targetUserQuery = `
        query GetUsername($userId: String!) {
          getUser(id: $userId) {
            username
          }
        }
      `;

      const response = await fetch(process.env.NEXT_PUBLIC_DGRAPH_ENDPOINT!, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: targetUserQuery,
          variables: { userId: challengeData.targetUserId },
        }),
      });

      const data = await response.json();
      const targetUsername = data.data?.getUser?.username || 'user';

      // Create a notification for the target user
      await createChallengeNotification(
        challengeData.targetUserId,
        userId,
        `You've been challenged!`,
        'challenge',
        'private',
        challengeId,
      );

      return {
        success: true,
        challengeId: challengeId,
        message: `Successfully challenged ${targetUsername}!`,
      };
    } else {
      // Handle public challenge creation
      // First check if the necessary properties exist
      if (
        !('latitude' in challengeData) ||
        !('longitude' in challengeData) ||
        challengeData.latitude === undefined ||
        challengeData.longitude === undefined
      ) {
        throw new Error('Location is required for public challenges');
      }

      const challengeId = await createPublicChallenge(
        userId,
        challengeData.challengeName,
        challengeData.description,
        challengeData.reward,
        challengeData.latitude,
        challengeData.longitude,
        challengeData.participants || 10,
      );

      return {
        success: true,
        challengeId: challengeId,
        message: 'Public challenge created successfully!',
      };
    }
  } catch (error) {
    console.error('Error creating challenge:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to create challenge',
    };
  }
};

/**
 * Helper function to reset time-based earnings counters
 * This should be called by a scheduled job (daily/weekly/monthly)
 */
export const resetTimeBasedEarnings = async (resetType: 'daily' | 'weekly' | 'monthly'): Promise<void> => {
  console.log(`Resetting ${resetType} earnings for all users`);

  let setFields: any = {
    lastEarningsUpdate: new Date().toISOString(),
  };

  if (resetType === 'daily') {
    setFields.earnedTokensToday = 0;
  } else if (resetType === 'weekly') {
    setFields.earnedTokensThisWeek = 0;
  } else if (resetType === 'monthly') {
    setFields.earnedTokensThisMonth = 0;
  }

  const mutation = `
    mutation ResetTimeBasedEarnings($setFields: UserPatch!) {
      updateUser(input: {
        filter: {},  # Apply to all users
        set: $setFields
      }) {
        numUids
      }
    }
  `;

  try {
    const response = await axios.post(
      DGRAPH_ENDPOINT,
      {
        query: mutation,
        variables: {
          setFields,
        },
      },
      {
        headers: { 'Content-Type': 'application/json' },
      },
    );

    if (response.data.errors) {
      console.error('Dgraph mutation error:', response.data.errors);
      throw new Error(`Failed to reset ${resetType} earnings`);
    }

    console.log(`Successfully reset ${resetType} earnings for ${response.data.data.updateUser.numUids} users`);
  } catch (error) {
    console.error(`Error resetting ${resetType} earnings:`, error);
    throw error;
  }
};

// Public challenges

/**
 * Fetches all active public challenges
 * @returns Array of public challenges
 */
export const fetchAllPublicChallenges = async (): Promise<any[]> => {
  const query = `
    query {
      queryPublicChallenge(filter: { isActive: true }) {
        id
        title
        description
        reward
        location {
          longitude
          latitude
        }
        creator {
          id
          username
          profilePicture
        }
        participantCount
        maxParticipants
        createdAt
      }
    }
  `;

  try {
    const response = await axios.post(DGRAPH_ENDPOINT, { query }, { headers: { 'Content-Type': 'application/json' } });

    if (response.data.errors) {
      console.error('Dgraph query error:', response.data.errors);
      throw new Error('Error querying public challenges');
    }

    return response.data.data?.queryPublicChallenge || [];
  } catch (error) {
    console.error('Error fetching public challenges:', error);
    throw error;
  }
};

/**
 * Fetches public challenges near a specific location
 * @param longitude The longitude coordinate
 * @param latitude The latitude coordinate
 * @param radiusKm Optional radius in kilometers (default: 10)
 * @returns Array of nearby public challenges
 */
export const fetchNearbyPublicChallenges = async (
  longitude: number,
  latitude: number,
  radiusKm: number = 10,
): Promise<any[]> => {
  try {
    // First fetch all challenges since Dgraph doesn't support geospatial queries directly
    const allChallenges = await fetchAllPublicChallenges();

    // Then filter them by distance
    return allChallenges.filter((challenge) => {
      const distance = calculateDistance(
        latitude,
        longitude,
        challenge.location.latitude,
        challenge.location.longitude,
      );

      return distance <= radiusKm;
    });
  } catch (error) {
    console.error('Error fetching nearby public challenges:', error);
    throw error;
  }
};

/**
 * Joins a public challenge
 * @param userId User ID who is joining
 * @param challengeId Challenge ID to join
 * @returns Updated challenge
 */
export const joinPublicChallenge = async (userId: string, challengeId: string): Promise<any> => {
  // First check if the user is already participating
  const checkQuery = `
    query {
      getPublicChallenge(id: "${challengeId}") {
        id
        participantCount
        maxParticipants
        participants {
          id
        }
      }
    }
  `;

  try {
    const checkResponse = await axios.post(
      DGRAPH_ENDPOINT,
      { query: checkQuery },
      { headers: { 'Content-Type': 'application/json' } },
    );

    if (checkResponse.data.errors) {
      throw new Error(`Dgraph query error: ${checkResponse.data.errors[0].message}`);
    }

    const challenge = checkResponse.data.data.getPublicChallenge;
    if (!challenge) {
      throw new Error('Challenge not found');
    }

    // Check if the user is already participating
    const isParticipating = challenge.participants.some((p: any) => p.id === userId);
    if (isParticipating) {
      throw new Error('You are already participating in this challenge');
    }

    // Check if the challenge is full
    if (challenge.participantCount >= challenge.maxParticipants) {
      throw new Error('This challenge is already full');
    }

    // Join the challenge
    const mutation = `
      mutation {
        updatePublicChallenge(
          input: {
            filter: { id: { eq: "${challengeId}" } },
            set: {
              participants: [{ id: "${userId}" }],
              participantCount: ${challenge.participantCount + 1}
            }
          }
        ) {
          publicChallenge {
            id
            participantCount
            maxParticipants
          }
        }
      }
    `;

    const joinResponse = await axios.post(
      DGRAPH_ENDPOINT,
      { query: mutation },
      { headers: { 'Content-Type': 'application/json' } },
    );

    if (joinResponse.data.errors) {
      throw new Error(`Dgraph mutation error: ${joinResponse.data.errors[0].message}`);
    }

    return joinResponse.data.data.updatePublicChallenge.publicChallenge[0];
  } catch (error) {
    console.error('Error joining public challenge:', error);
    throw error;
  }
};

/**
 * Helper function to calculate distance between two coordinates using the Haversine formula
 * @param lat1 Latitude of first point
 * @param lon1 Longitude of first point
 * @param lat2 Latitude of second point
 * @param lon2 Longitude of second point
 * @returns Distance in kilometers
 */
const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371; // Radius of the earth in km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c; // Distance in km
  return distance;
};

const deg2rad = (deg: number): number => {
  return deg * (Math.PI / 180);
};

export const getAllUserPushSubscriptions = async (): Promise<string[]> => {
  console.log('🔔 BULK: Fetching all user push subscriptions for bulk notification');

  const query = `
    query GetAllPushSubscriptions {
      queryUser(filter: { 
        pushSubscription: { regexp: "/.*/" }  # Get users with any push subscription
      }) {
        pushSubscription
      }
    }
  `;

  try {
    const response = await axios.post(DGRAPH_ENDPOINT, {
      query,
    });

    console.log('🔔 BULK: Push subscriptions query response:', JSON.stringify(response.data, null, 2));

    if (response.data.errors) {
      console.error('🔔 BULK: GraphQL errors:', response.data.errors);
      throw new Error('Failed to fetch push subscriptions');
    }

    const users = response.data.data.queryUser || [];
    const pushSubscriptions = users
      .map((user: any) => user.pushSubscription)
      .filter((sub: string) => sub && sub.length > 0); // Filter out any null/empty subscriptions

    console.log(`🔔 BULK: Found ${pushSubscriptions.length} push subscriptions`);
    return pushSubscriptions;
  } catch (error) {
    console.error('🔔 BULK: Error fetching push subscriptions:', error);
    throw new Error('Failed to fetch user push subscriptions for bulk notification');
  }
};

export const updateTrailerVideo = async (userId: string, trailerVideo: string): Promise<void> => {
  const mutation = `
    mutation UpdateUserTrailerVideo($id: String!, $trailerVideo: String!) {
      updateUser(input: { filter: { id: { eq: $id } }, set: { trailerVideo: $trailerVideo } }) {
        user {
          id
          trailerVideo
        }
      }
    }
  `;

  const variables = {
    id: userId,
    trailerVideo: trailerVideo,
  };

  try {
    const response = await axios.post(
      DGRAPH_ENDPOINT,
      {
        query: mutation,
        variables,
      },
      {
        headers: { 'Content-Type': 'application/json' },
      },
    );

    if (response.data.errors) {
      const errorMessages = response.data.errors.map((err: any) => err.message).join(', ');
      throw new Error(`Dgraph Error: ${errorMessages}`);
    }

    console.log('Trailer video successfully updated in Dgraph:', response.data);
  } catch (error) {
    console.error('Error updating trailer video in Dgraph:', error);
    throw new Error('Failed to update trailer video in the database.');
  }
};

export const updateCoverPhoto = async (userId: string, coverPhoto: string): Promise<void> => {
  const mutation = `
    mutation UpdateUserCoverPhoto($id: String!, $coverPhoto: String!) {
      updateUser(input: { filter: { id: { eq: $id } }, set: { coverPhoto: $coverPhoto } }) {
        user {
          id
          coverPhoto
        }
      }
    }
  `;

  const variables = {
    id: userId,
    coverPhoto: coverPhoto,
  };

  try {
    const response = await axios.post(
      DGRAPH_ENDPOINT,
      {
        query: mutation,
        variables,
      },
      {
        headers: { 'Content-Type': 'application/json' },
      },
    );

    if (response.data.errors) {
      const errorMessages = response.data.errors.map((err: any) => err.message).join(', ');
      throw new Error(`Dgraph Error: ${errorMessages}`);
    }

    console.log('Cover photo successfully updated in Dgraph:', response.data);
  } catch (error) {
    console.error('Error updating cover photo in Dgraph:', error);
    throw new Error('Failed to update cover photo in the database.');
  }
};

export const checkWalletExists = async (wallet: string) => {
  console.log('🔍 [DGRAPH] Checking wallet existence:', wallet);

  const normalizedWallet = wallet.toLowerCase();
  console.log('🔍 [DGRAPH] Normalized wallet:', normalizedWallet);
  console.log('🔍 [DGRAPH] Original wallet:', wallet);

  const query = `
    query CheckWallet($wallet: String!, $originalWallet: String!) {
      queryUser(filter: { 
        or: [
          { wallet: { eq: $wallet } },
          { wallet: { eq: $originalWallet } }
        ]
      }) {
        id
        username
        wallet
      }
    }
  `;

  const variables = {
    wallet: normalizedWallet,
    originalWallet: wallet,
  };

  console.log('🔍 [DGRAPH] Query variables:', JSON.stringify(variables, null, 2));

  try {
    const response = await axios.post(DGRAPH_ENDPOINT, {
      query,
      variables,
    });

    console.log('🔍 [DGRAPH] Response status:', response.status);
    console.log('🔍 [DGRAPH] Response data:', JSON.stringify(response.data, null, 2));

    if (response.data.errors) {
      console.error('🔍 [DGRAPH] GraphQL errors:', response.data.errors);
      throw new Error('Database query failed');
    }

    const users = response.data.data.queryUser;
    const exists = users && users.length > 0;

    console.log('🔍 [DGRAPH] Users found:', users);
    console.log('🔍 [DGRAPH] User count:', users?.length || 0);
    console.log('🔍 [DGRAPH] Exists result:', exists);

    if (exists) {
      console.log('🔍 [DGRAPH] Wallet exists! User details:', {
        id: users[0].id,
        username: users[0].username,
        wallet: users[0].wallet,
      });

      return {
        exists: true,
        user: {
          id: users[0].id,
          username: users[0].username,
        },
      };
    }

    console.log('🔍 [DGRAPH] Wallet does not exist');
    return { exists: false };
  } catch (error) {
    console.error('🔍 [DGRAPH] Error checking wallet:', error);
    throw error;
  }
};

export const checkUsernameExists = async (username: string) => {
  console.log('🔍 [DGRAPH] Checking username existence:', username);

  const normalizedUsername = username.toLowerCase().trim();
  console.log('🔍 [DGRAPH] Normalized username:', normalizedUsername);

  const query = `
    query CheckUsername($username: String!, $originalUsername: String!) {
      queryUser(filter: { 
        or: [
          { username: { eq: $username } },
          { username: { eq: $originalUsername } }
        ]
      }) {
        id
        username
        wallet
      }
    }
  `;

  const variables = {
    username: normalizedUsername,
    originalUsername: username.trim(),
  };

  console.log('🔍 [DGRAPH] Query variables:', JSON.stringify(variables, null, 2));

  try {
    const response = await axios.post(DGRAPH_ENDPOINT, {
      query,
      variables,
    });

    console.log('🔍 [DGRAPH] Response status:', response.status);
    console.log('🔍 [DGRAPH] Response data:', JSON.stringify(response.data, null, 2));

    if (response.data.errors) {
      console.error('🔍 [DGRAPH] GraphQL errors:', response.data.errors);
      throw new Error('Database query failed');
    }

    const users = response.data.data.queryUser;
    const exists = users && users.length > 0;

    console.log('🔍 [DGRAPH] Users found:', users);
    console.log('🔍 [DGRAPH] User count:', users?.length || 0);
    console.log('🔍 [DGRAPH] Exists result:', exists);

    if (exists) {
      console.log('🔍 [DGRAPH] Username exists! User details:', {
        id: users[0].id,
        username: users[0].username,
        wallet: users[0].wallet,
      });

      return {
        exists: true,
        user: {
          id: users[0].id,
          username: users[0].username,
        },
      };
    }

    console.log('🔍 [DGRAPH] Username does not exist');
    return { exists: false };
  } catch (error) {
    console.error('🔍 [DGRAPH] Error checking username:', error);
    throw error;
  }
};

/**
 * Get leaderboard data for different time periods
 */
export const getLeaderboard = async (
  period: 'all-time' | 'today' | 'week' | 'month',
  limit: number = 50,
): Promise<any[]> => {
  console.log(`Fetching ${period} leaderboard (top ${limit})`);

  let orderField: string;
  let selectField: string;

  switch (period) {
    case 'today':
      orderField = 'earnedTokensToday';
      selectField = 'earnedTokensToday';
      break;
    case 'week':
      orderField = 'earnedTokensThisWeek';
      selectField = 'earnedTokensThisWeek';
      break;
    case 'month':
      orderField = 'earnedTokensThisMonth';
      selectField = 'earnedTokensThisMonth';
      break;
    case 'all-time':
    default:
      orderField = 'earnedTokens';
      selectField = 'earnedTokens';
      break;
  }

  const query = `
    query GetLeaderboard($limit: Int!) {
      queryUser(
        order: { desc: ${orderField} },
        first: $limit,
        filter: { ${selectField}: { gt: 0 } }
      ) {
        id
        username
        profilePicture
        earnedTokens
        earnedTokensToday
        earnedTokensThisWeek
        earnedTokensThisMonth
        lastEarningsUpdate
      }
    }
  `;

  try {
    const response = await axios.post(
      DGRAPH_ENDPOINT,
      {
        query,
        variables: { limit },
      },
      {
        headers: { 'Content-Type': 'application/json' },
      },
    );

    if (response.data.errors) {
      console.error('Dgraph query error:', response.data.errors);
      throw new Error('Failed to fetch leaderboard');
    }

    const users = response.data.data.queryUser || [];
    console.log(`Fetched ${period} leaderboard with ${users.length} users`);

    return users.map((user: any, index: number) => ({
      rank: index + 1,
      userId: user.id,
      username: user.username,
      profilePicture: user.profilePicture,
      currentPeriodTokens: user[selectField] || 0,
      allTimeTokens: user.earnedTokens || 0,
      todayTokens: user.earnedTokensToday || 0,
      weekTokens: user.earnedTokensThisWeek || 0,
      monthTokens: user.earnedTokensThisMonth || 0,
      lastUpdate: user.lastEarningsUpdate,
    }));
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    throw error;
  }
};

/**
 * Fetches all active public challenges with completion data
 * @returns Array of public challenges with completion information
 */
export const fetchAllPublicChallengesWithCompletions = async (): Promise<any[]> => {
  const query = `
    query {
      queryPublicChallenge(filter: { isActive: true }) {
        id
        title
        description
        reward
        location {
          longitude
          latitude
        }
        creator {
          id
          username
          profilePicture
        }
        participantCount
        maxParticipants
        createdAt
        completions {
          id
          completionDate
          user {
            id
            username
            profilePicture
          }
        }
      }
    }
  `;

  try {
    const response = await axios.post(DGRAPH_ENDPOINT, { query }, { headers: { 'Content-Type': 'application/json' } });

    if (response.data.errors) {
      console.error('Dgraph query error:', response.data.errors);
      throw new Error('Error querying public challenges with completions');
    }

    const challenges = response.data.data?.queryPublicChallenge || [];

    // Process challenges to add completion data
    return challenges.map((challenge: any) => ({
      ...challenge,
      completionCount: challenge.completions?.length || 0,
      recentCompletions:
        challenge.completions
          ?.sort((a: any, b: any) => new Date(b.completionDate).getTime() - new Date(a.completionDate).getTime())
          ?.slice(0, 5) // Get most recent 5 completions
          ?.map((completion: any) => ({
            userId: completion.user.id,
            username: completion.user.username,
            profilePicture: completion.user.profilePicture,
            completedAt: completion.completionDate,
          })) || [],
    }));
  } catch (error) {
    console.error('Error fetching public challenges with completions:', error);
    throw error;
  }
};

// Add these functions to your dgraph.ts file

/**
 * Toggle like on a challenge completion
 * @param userId - ID of the user liking/unliking
 * @param completionId - ID of the challenge completion
 * @returns Promise<{ isLiked: boolean, newLikeCount: number }>
 */
export const toggleCompletionLike = async (
  userId: string,
  completionId: string,
): Promise<{ isLiked: boolean; newLikeCount: number }> => {
  console.log(`Toggling like: User ${userId} on completion ${completionId}`);

  try {
    // First, get the user data to include in the likes array
    const getUserQuery = `
      query GetUser($userId: String!) {
        getUser(id: $userId) {
          id
          username
          profilePicture
        }
      }
    `;

    const userResponse = await axios.post(
      DGRAPH_ENDPOINT,
      {
        query: getUserQuery,
        variables: { userId },
      },
      {
        headers: { 'Content-Type': 'application/json' },
      },
    );

    if (userResponse.data.errors) {
      console.error('Error fetching user:', userResponse.data.errors);
      throw new Error('Failed to fetch user data');
    }

    const userData = userResponse.data.data.getUser;
    if (!userData) {
      throw new Error('User not found');
    }

    // Now check current like status
    const checkQuery = `
      query CheckLikeStatus($completionId: String!, $userId: String!) {
        getChallengeCompletion(id: $completionId) {
          id
          likesCount
          likes(filter: { id: { eq: $userId } }) {
            id
          }
          user {
            id
            username
          }
        }
      }
    `;

    const checkResponse = await axios.post(
      DGRAPH_ENDPOINT,
      {
        query: checkQuery,
        variables: { completionId, userId },
      },
      {
        headers: { 'Content-Type': 'application/json' },
      },
    );

    if (checkResponse.data.errors) {
      console.error('Error checking like status:', checkResponse.data.errors);
      throw new Error('Failed to check like status');
    }

    const completion = checkResponse.data.data.getChallengeCompletion;
    if (!completion) {
      throw new Error('Challenge completion not found');
    }

    const currentLikeCount = completion.likesCount || 0;
    const isCurrentlyLiked = completion.likes && completion.likes.length > 0;
    const newIsLiked = !isCurrentlyLiked;
    const newLikeCount = isCurrentlyLiked ? currentLikeCount - 1 : currentLikeCount + 1;

    // Create separate mutations for adding vs removing likes
    let updateMutation: string;

    if (newIsLiked) {
      // Adding a like - include full user object
      updateMutation = `
        mutation AddLike($completionId: String!, $userData: UserRef!, $newLikeCount: Int!) {
          updateChallengeCompletion(input: {
            filter: { id: { eq: $completionId } },
            set: { 
              likes: [$userData],
              likesCount: $newLikeCount
            }
          }) {
            challengeCompletion {
              id
              likesCount
              likes {
                id
              }
            }
          }
        }
      `;
    } else {
      // Removing a like - can use just ID reference
      updateMutation = `
        mutation RemoveLike($completionId: String!, $userId: String!, $newLikeCount: Int!) {
          updateChallengeCompletion(input: {
            filter: { id: { eq: $completionId } },
            remove: { 
              likes: [{ id: $userId }]
            },
            set: {
              likesCount: $newLikeCount
            }
          }) {
            challengeCompletion {
              id
              likesCount
              likes {
                id
              }
            }
          }
        }
      `;
    }

    // Prepare variables based on operation type
    const variables: any = { completionId, newLikeCount };
    if (newIsLiked) {
      variables.userData = {
        id: userData.id,
        username: userData.username,
        profilePicture: userData.profilePicture,
      };
    } else {
      variables.userId = userId;
    }

    const updateResponse = await axios.post(
      DGRAPH_ENDPOINT,
      {
        query: updateMutation,
        variables,
      },
      {
        headers: { 'Content-Type': 'application/json' },
      },
    );

    if (updateResponse.data.errors) {
      console.error('Error updating like:', updateResponse.data.errors);
      throw new Error('Failed to update like');
    }

    // If this is a new like (not unliking), create a notification for the completion owner
    if (newIsLiked && completion.user.id !== userId) {
      try {
        await createNotification(completion.user.id, userId, `liked your challenge completion`, 'like');
      } catch (notificationError) {
        console.error('Failed to create like notification:', notificationError);
        // Don't throw error as the like operation succeeded
      }
    }

    console.log(`Like toggled successfully: ${newIsLiked ? 'liked' : 'unliked'}, new count: ${newLikeCount}`);

    return {
      isLiked: newIsLiked,
      newLikeCount: newLikeCount,
    };
  } catch (error) {
    console.error('Error toggling completion like:', error);
    throw error;
  }
};

/**
 * Get like status and count for a completion
 * @param completionId - ID of the challenge completion
 * @param userId - ID of the user (optional, to check if they liked it)
 * @returns Promise<{ likesCount: number, isLiked: boolean, recentLikes: Array }>
 */
export const getCompletionLikes = async (
  completionId: string,
  userId?: string,
): Promise<{ likesCount: number; isLiked: boolean; recentLikes: Array<any> }> => {
  console.log(`Getting likes for completion ${completionId}, user ${userId}`);

  try {
    // Build query based on whether we need to check user's like status
    let userLikeFilter = '';
    if (userId) {
      userLikeFilter = `
        userLike: likes(filter: { id: { eq: $userId } }) {
          id
        }
      `;
    }

    const query = `
      query GetCompletionLikes($completionId: String!${userId ? ', $userId: String!' : ''}) {
        getChallengeCompletion(id: $completionId) {
          id
          likesCount
          ${userLikeFilter}
          likes(order: { desc: id }, first: 10) {
            id
            username
            profilePicture
          }
        }
      }
    `;

    const variables: any = { completionId };
    if (userId) {
      variables.userId = userId;
    }

    const response = await axios.post(
      DGRAPH_ENDPOINT,
      {
        query,
        variables,
      },
      {
        headers: { 'Content-Type': 'application/json' },
      },
    );

    if (response.data.errors) {
      console.error('Error getting completion likes:', response.data.errors);
      throw new Error('Failed to get completion likes');
    }

    const completion = response.data.data.getChallengeCompletion;
    if (!completion) {
      throw new Error('Challenge completion not found');
    }

    const likesCount = completion.likesCount || 0;
    const isLiked = userId ? completion.userLike && completion.userLike.length > 0 : false;
    const recentLikes = completion.likes || [];

    return {
      likesCount,
      isLiked,
      recentLikes,
    };
  } catch (error) {
    console.error('Error getting completion likes:', error);
    throw error;
  }
};

/**
 * Fetch challenge completions with like data for browsing page
 * @param challengeId - Optional challenge ID to filter by
 * @param userId - Current user ID to check like status
 * @returns Promise<Array<ChallengeCompletion>>
 */
export const fetchChallengeCompletionsWithLikes = async (challengeId?: string, userId?: string): Promise<any[]> => {
  console.log('Fetching challenge completions with like data', { challengeId, userId });

  try {
    // Build filter for specific challenge if provided
    let challengeFilter = '';
    if (challengeId) {
      challengeFilter = `filter: { 
        or: [
          { and: [{ has: publicChallenge }, { publicChallenge: { id: { eq: $challengeId } } }] },
          { and: [{ has: privateChallenge }, { privateChallenge: { id: { eq: $challengeId } } }] },
          { and: [{ has: aiChallenge }, { aiChallenge: { id: { eq: $challengeId } } }] }
        ]
      },`;
    }

    // Build user like check if userId provided
    let userLikeField = '';
    if (userId) {
      userLikeField = `
        userLike: likes(filter: { id: { eq: $userId } }) {
          id
        }
      `;
    }

    const query = `
      query GetChallengeCompletionsWithLikes${challengeId ? '($challengeId: String!)' : ''}${userId ? '($userId: String!)' : ''} {
        queryChallengeCompletion(
          ${challengeFilter}
          order: { desc: completionDate }
        ) {
          id
          user {
            id
            username
            profilePicture
          }
          completionDate
          media
          challengeType
          likesCount
          ${userLikeField}
          likes(first: 5, order: { desc: id }) {
            id
            username
            profilePicture
          }
          publicChallenge {
            id
            title
            description
            reward
          }
          aiChallenge {
            id
            title
            description
            reward
            frequency
          }
          privateChallenge {
            id
            title
            description
            reward
          }
        }
      }
    `;

    const variables: any = {};
    if (challengeId) variables.challengeId = challengeId;
    if (userId) variables.userId = userId;

    const response = await axios.post(
      DGRAPH_ENDPOINT,
      {
        query,
        variables,
      },
      {
        headers: {
          'Content-Type': 'application/json',
          ...(process.env.NEXT_PUBLIC_DGRAPH_API_KEY && {
            'X-Auth-Token': process.env.NEXT_PUBLIC_DGRAPH_API_KEY,
          }),
        },
      },
    );

    if (response.data.errors) {
      console.error('Error fetching completions with likes:', response.data.errors);
      throw new Error('Failed to fetch completions with likes');
    }

    const completions = response.data.data.queryChallengeCompletion || [];

    // Process each completion to format the data
    return completions.map((completion: any) => ({
      ...completion,
      // Add convenience fields
      totalLikes: completion.likesCount || 0,
      isLiked: userId ? completion.userLike && completion.userLike.length > 0 : false,
      recentLikes: completion.likes || [],
    }));
  } catch (error) {
    console.error('Error fetching challenge completions with likes:', error);
    throw error;
  }
};

/**
 * Create a RealMoji reaction for a challenge completion
 * @param userId - ID of the user creating the reaction
 * @param completionId - ID of the challenge completion being reacted to
 * @param reactionType - Type of reaction (thumbsUp, love, shocked, etc.)
 * @param selfieCID - IPFS CID of the captured selfie
 * @returns Promise<string> - ID of the created reaction
 */
export const createRealMojiReaction = async (
  userId: string,
  completionId: string,
  reactionType: string,
  selfieCID: string,
): Promise<string> => {
  console.log(`Creating RealMoji reaction: ${reactionType} by user ${userId} on completion ${completionId}`);

  try {
    // For now, skip duplicate check and just create the reaction
    // TODO: Add duplicate check once schema is properly set up

    const reactionId = generateId();
    const createdAt = new Date().toISOString();

    console.log('Creating new reaction with ID:', reactionId);

    const createMutation = `
      mutation CreateReaction(
        $id: String!,
        $userId: String!,
        $completionId: String!,
        $reactionType: String!,
        $selfieCID: String!,
        $createdAt: DateTime!
      ) {
        addReaction(input: [{
          id: $id,
          user: { id: $userId },
          completion: { id: $completionId },
          reactionType: $reactionType,
          selfieCID: $selfieCID,
          createdAt: $createdAt
        }]) {
          reaction {
            id
            reactionType
            selfieCID
            user {
              id
              username
              profilePicture
            }
          }
        }
      }
    `;

    const createResponse = await axios.post(
      DGRAPH_ENDPOINT,
      {
        query: createMutation,
        variables: {
          id: reactionId,
          userId,
          completionId,
          reactionType,
          selfieCID,
          createdAt,
        },
      },
      {
        headers: { 'Content-Type': 'application/json' },
      },
    );

    if (createResponse.data.errors) {
      console.error('Error creating reaction:', createResponse.data.errors);
      throw new Error(`Failed to create reaction: ${createResponse.data.errors[0].message}`);
    }

    // Get the completion owner to send notification
    const completionQuery = `
      query GetCompletion($completionId: String!) {
        getChallengeCompletion(id: $completionId) {
          user {
            id
            username
          }
        }
      }
    `;

    const completionResponse = await axios.post(
      DGRAPH_ENDPOINT,
      {
        query: completionQuery,
        variables: { completionId },
      },
      {
        headers: { 'Content-Type': 'application/json' },
      },
    );

    // Create notification for the completion owner (if not reacting to own post)
    if (!completionResponse.data.errors && completionResponse.data.data.getChallengeCompletion) {
      const completionOwner = completionResponse.data.data.getChallengeCompletion.user;
      if (completionOwner.id !== userId) {
        try {
          await createNotification(
            completionOwner.id,
            userId,
            `reacted with a ${reactionType} RealMoji to your challenge`,
            'reaction',
          );
        } catch (notificationError) {
          console.error('Failed to create reaction notification:', notificationError);
          // Don't throw error as the reaction was successful
        }
      }
    }

    console.log(`RealMoji reaction created successfully: ${reactionId}`);
    return reactionId;
  } catch (error) {
    console.error('Error creating RealMoji reaction:', error);
    throw error;
  }
};

/**
 * Get all reactions for a challenge completion
 * @param completionId - ID of the challenge completion
 * @returns Promise<Array> - Array of reactions with user data
 */
export const getCompletionReactions = async (completionId: string): Promise<any[]> => {
  console.log(`Getting reactions for completion ${completionId}`);

  try {
    const query = `
      query GetCompletionReactions($completionId: String!) {
        getChallengeCompletion(id: $completionId) {
          id
          reactions {
            id
            reactionType
            selfieCID
            createdAt
            user {
              id
              username
              profilePicture
            }
          }
        }
      }
    `;

    const response = await axios.post(
      DGRAPH_ENDPOINT,
      {
        query,
        variables: { completionId },
      },
      {
        headers: { 'Content-Type': 'application/json' },
      },
    );

    if (response.data.errors) {
      console.error('Error getting completion reactions:', response.data.errors);
      throw new Error('Failed to get completion reactions');
    }

    const completion = response.data.data.getChallengeCompletion;
    if (!completion) {
      throw new Error('Challenge completion not found');
    }

    const reactions = completion.reactions || [];

    // Process reactions to add convenience fields
    return reactions.map((reaction: any) => ({
      ...reaction,
      emoji: getEmojiForReactionType(reaction.reactionType),
      selfieUrl: reaction.selfieCID ? `https://gateway.pinata.cloud/ipfs/${reaction.selfieCID}` : null,
    }));
  } catch (error) {
    console.error('Error getting completion reactions:', error);
    throw error;
  }
};

/**
 * Upload RealMoji selfie to IPFS via Pinata
 * @param imageBlob - The captured selfie image
 * @param reactionType - Type of reaction for filename
 * @returns Promise<string> - IPFS CID of uploaded image
 */
export const uploadRealMojiToIPFS = async (imageBlob: Blob, reactionType: string): Promise<string> => {
  console.log(`Uploading RealMoji selfie to IPFS: ${reactionType}, size: ${imageBlob.size} bytes`);

  try {
    const formData = new FormData();

    // Create filename with timestamp and reaction type
    const timestamp = Date.now();
    const filename = `realmoji-${reactionType}-${timestamp}.jpg`;

    formData.append('file', imageBlob, filename);

    // Add metadata
    const metadata = JSON.stringify({
      name: filename,
      description: `RealMoji ${reactionType} reaction selfie`,
      attributes: [
        { trait_type: 'Type', value: 'RealMoji' },
        { trait_type: 'Reaction', value: reactionType },
        { trait_type: 'Created', value: new Date().toISOString() },
      ],
    });
    formData.append('pinataMetadata', metadata);

    // Upload to Pinata
    const response = await axios.post('https://api.pinata.cloud/pinning/pinFileToIPFS', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
        'pinata_api_key': process.env.PINATA_API_KEY!,
        'pinata_secret_api_key': process.env.PINATA_SECRET_KEY!,
      },
    });

    if (response.data.IpfsHash) {
      console.log(`RealMoji uploaded successfully: ${response.data.IpfsHash}`);
      return response.data.IpfsHash;
    } else {
      throw new Error('No IPFS hash returned from Pinata');
    }
  } catch (error) {
    console.error('Error uploading RealMoji to IPFS:', error);
    throw new Error('Failed to upload RealMoji selfie');
  }
};

/**
 * Helper function to get emoji for reaction type
 * @param reactionType - The reaction type string
 * @returns string - The corresponding emoji
 */
const getEmojiForReactionType = (reactionType: string): string => {
  const emojiMap: { [key: string]: string } = {
    thumbsUp: '👍',
    love: '😍',
    shocked: '🤯',
    curious: '🤔',
    fire: '🔥',
    sad: '😢',
  };
  return emojiMap[reactionType] || '😊';
};

/**
 * Enhanced fetch completions with reactions
 * @param challengeId - Optional challenge ID to filter by
 * @param userId - Current user ID to check like status
 * @returns Promise<Array<ChallengeCompletion>>
 */
export const fetchChallengeCompletionsWithLikesAndReactions = async (
  challengeId?: string,
  userId?: string,
): Promise<any[]> => {
  console.log('Fetching challenge completions with likes and reactions', { challengeId, userId });

  try {
    // Build filter for specific challenge if provided
    let challengeFilter = '';
    if (challengeId) {
      challengeFilter = `filter: { 
        or: [
          { and: [{ has: publicChallenge }, { publicChallenge: { id: { eq: $challengeId } } }] },
          { and: [{ has: privateChallenge }, { privateChallenge: { id: { eq: $challengeId } } }] },
          { and: [{ has: aiChallenge }, { aiChallenge: { id: { eq: $challengeId } } }] }
        ]
      },`;
    }

    // Build user like check if userId provided
    let userLikeField = '';
    if (userId) {
      userLikeField = `
        userLike: likes(filter: { id: { eq: $userId } }) {
          id
        }
      `;
    }

    const query = `
      query GetChallengeCompletionsWithLikesAndReactions${challengeId ? '($challengeId: String!)' : ''}${userId ? '($userId: String!)' : ''} {
        queryChallengeCompletion(
          ${challengeFilter}
          order: { desc: completionDate }
        ) {
          id
          user {
            id
            username
            profilePicture
          }
          completionDate
          media
          challengeType
          likesCount
          ${userLikeField}
          likes(first: 5, order: { desc: id }) {
            id
            username
            profilePicture
          }
          reactions {
            id
            reactionType
            selfieCID
            createdAt
            user {
              id
              username
              profilePicture
            }
          }
          publicChallenge {
            id
            title
            description
            reward
          }
          aiChallenge {
            id
            title
            description
            reward
            frequency
          }
          privateChallenge {
            id
            title
            description
            reward
          }
        }
      }
    `;

    const variables: any = {};
    if (challengeId) variables.challengeId = challengeId;
    if (userId) variables.userId = userId;

    const response = await axios.post(
      DGRAPH_ENDPOINT,
      {
        query,
        variables,
      },
      {
        headers: {
          'Content-Type': 'application/json',
          ...(process.env.NEXT_PUBLIC_DGRAPH_API_KEY && {
            'X-Auth-Token': process.env.NEXT_PUBLIC_DGRAPH_API_KEY,
          }),
        },
      },
    );

    if (response.data.errors) {
      console.error('Error fetching completions with likes and reactions:', response.data.errors);
      throw new Error('Failed to fetch completions with likes and reactions');
    }

    const completions = response.data.data.queryChallengeCompletion || [];

    // Process each completion to format the data
    return completions.map((completion: any) => ({
      ...completion,
      // Add convenience fields for likes
      totalLikes: completion.likesCount || 0,
      isLiked: userId ? completion.userLike && completion.userLike.length > 0 : false,
      recentLikes: completion.likes || [],
      // Add convenience fields for reactions
      totalReactions: completion.reactions?.length || 0,
      recentReactions: (completion.reactions || []).map((reaction: any) => ({
        ...reaction,
        emoji: getEmojiForReactionType(reaction.reactionType),
        selfieUrl: reaction.selfieCID ? `https://gateway.pinata.cloud/ipfs/${reaction.selfieCID}` : null,
      })),
    }));
  } catch (error) {
    console.error('Error fetching challenge completions with likes and reactions:', error);
    throw error;
  }
};

/**
 * Creates an NFT item in the database
 * @param nftData - NFT creation data
 * @returns Promise<string> - ID of the created NFT
 */
export const createNFTItem = async (nftData: {
  name: string;
  description: string;
  itemType: string; // 'cap' | 'hoodie' | 'pants' | 'shoes'
  rarity: string; // 'common' | 'rare' | 'epic'
  tokenBonus: number;
  imageUrl: string;
  imageCID?: string;
  generationPrompt?: string;
  ownerId: string;
  tokenId?: string;
  mintTransactionHash?: string;
}): Promise<string> => {
  console.log('Creating NFT item in database:', {
    name: nftData.name,
    itemType: nftData.itemType,
    ownerId: nftData.ownerId,
    imageUrl: nftData.imageUrl.substring(0, 50) + '...',
  });

  const nftId = uuidv4();
  const now = new Date().toISOString();

  // Extract CID from imageUrl if it's an IPFS URL
  let imageCID = nftData.imageCID;
  if (!imageCID && nftData.imageUrl.includes('ipfs')) {
    const cidMatch = nftData.imageUrl.match(/\/ipfs\/([^\/]+)/);
    if (cidMatch) {
      imageCID = cidMatch[1];
    }
  }

  const mutation = `
    mutation CreateNFTItem(
      $id: String!,
      $name: String!,
      $description: String!,
      $itemType: String!,
      $rarity: String!,
      $tokenBonus: Int!,
      $imageUrl: String!,
      $imageCID: String,
      $generatedAt: DateTime!,
      $generationPrompt: String,
      $ownerId: String!,
      $tokenId: String,
      $mintTransactionHash: String
    ) {
      addNFTItem(input: [{
        id: $id,
        name: $name,
        description: $description,
        itemType: $itemType,
        rarity: $rarity,
        tokenBonus: $tokenBonus,
        imageUrl: $imageUrl,
        imageCID: $imageCID,
        generatedAt: $generatedAt,
        generationPrompt: $generationPrompt,
        owner: { id: $ownerId },
        isEquipped: false,
        tokenId: $tokenId,
        mintTransactionHash: $mintTransactionHash
      }]) {
        nFTItem {
          id
          name
          itemType
          rarity
          imageUrl
          owner {
            id
            username
          }
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
          id: nftId,
          name: nftData.name,
          description: nftData.description,
          itemType: nftData.itemType,
          rarity: nftData.rarity,
          tokenBonus: nftData.tokenBonus,
          imageUrl: nftData.imageUrl,
          imageCID: imageCID,
          generatedAt: now,
          generationPrompt: nftData.generationPrompt,
          ownerId: nftData.ownerId,
          tokenId: nftData.tokenId,
          mintTransactionHash: nftData.mintTransactionHash,
        },
      },
      {
        headers: { 'Content-Type': 'application/json' },
      },
    );

    if (response.data.errors) {
      console.error('Error creating NFT item:', response.data.errors);
      throw new Error(`Failed to create NFT item: ${response.data.errors[0].message}`);
    }

    const createdNFT = response.data.data.addNFTItem.nFTItem[0];
    console.log('✅ NFT item created successfully:', {
      id: createdNFT.id,
      name: createdNFT.name,
      owner: createdNFT.owner.username,
    });

    return nftId;
  } catch (error) {
    console.error('Error creating NFT item:', error);
    throw error;
  }
};

/**
 * Updates a challenge completion with an NFT reward
 * @param completionId - ID of the challenge completion
 * @param nftId - ID of the NFT item
 * @returns Promise<boolean> - Success status
 */
export const updateChallengeCompletionWithNFT = async (completionId: string, nftId: string): Promise<boolean> => {
  console.log('Updating challenge completion with NFT reward:', { completionId, nftId });

  const mutation = `
    mutation UpdateCompletionWithNFT($completionId: String!, $nftId: String!) {
      updateChallengeCompletion(input: {
        filter: { id: { eq: $completionId } },
        set: {
          nftReward: { id: $nftId }
        }
      }) {
        challengeCompletion {
          id
          nftReward {
            id
            name
            itemType
            imageUrl
          }
        }
      }
    }
  `;

  try {
    const response = await axios.post(
      DGRAPH_ENDPOINT,
      {
        query: mutation,
        variables: { completionId, nftId },
      },
      {
        headers: { 'Content-Type': 'application/json' },
      },
    );

    if (response.data.errors) {
      console.error('Error updating completion with NFT:', response.data.errors);
      throw new Error(`Failed to update completion with NFT: ${response.data.errors[0].message}`);
    }

    const updatedCompletion = response.data.data.updateChallengeCompletion.challengeCompletion[0];
    console.log('✅ Challenge completion updated with NFT:', {
      completionId: updatedCompletion.id,
      nftName: updatedCompletion.nftReward.name,
    });

    return true;
  } catch (error) {
    console.error('Error updating challenge completion with NFT:', error);
    return false;
  }
};

/**
 * Creates NFT item and associates it with challenge completion
 * This is the main function to call when saving NFT rewards
 */
export const saveNFTRewardToDatabase = async (
  completionId: string,
  nftRewardData: {
    collectionId: string;
    templateType: string;
    templateName: string;
    imageUrl: string;
    generationPrompt?: string;
    ownerId: string;
  },
): Promise<{ success: boolean; nftId?: string; error?: string }> => {
  console.log('🎁 Saving NFT reward to database:', {
    completionId,
    templateType: nftRewardData.templateType,
    templateName: nftRewardData.templateName,
    ownerId: nftRewardData.ownerId,
  });

  try {
    // Map template type to rarity and token bonus
    const getRarityAndBonus = (templateType: string) => {
      switch (templateType) {
        case 'cap':
          return { rarity: 'common', tokenBonus: 5 };
        case 'hoodie':
          return { rarity: 'common', tokenBonus: 10 };
        case 'pants':
          return { rarity: 'rare', tokenBonus: 15 };
        case 'shoes':
          return { rarity: 'epic', tokenBonus: 20 };
        default:
          return { rarity: 'common', tokenBonus: 5 };
      }
    };

    const { rarity, tokenBonus } = getRarityAndBonus(nftRewardData.templateType);

    // Create the NFT item
    const nftId = await createNFTItem({
      name: nftRewardData.templateName,
      description: `${nftRewardData.templateName} earned from challenge completion`,
      itemType: nftRewardData.templateType,
      rarity: rarity,
      tokenBonus: tokenBonus,
      imageUrl: nftRewardData.imageUrl,
      generationPrompt: nftRewardData.generationPrompt,
      ownerId: nftRewardData.ownerId,
      // Use collectionId as tokenId for now
      tokenId: nftRewardData.collectionId,
    });

    // Associate the NFT with the challenge completion
    const updateSuccess = await updateChallengeCompletionWithNFT(completionId, nftId);

    if (!updateSuccess) {
      console.warn('⚠️ NFT created but failed to associate with completion');
      // Don't throw error since the NFT was created successfully
    }

    console.log('🎉 NFT reward saved successfully to database:', {
      nftId,
      completionId,
      associated: updateSuccess,
    });

    return {
      success: true,
      nftId,
    };
  } catch (error) {
    console.error('❌ Error saving NFT reward to database:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
};

/**
 * Get user's NFT collection
 * @param userId - User ID
 * @returns Promise<Array> - Array of user's NFTs
 */
export const getUserNFTCollection = async (userId: string): Promise<any[]> => {
  console.log('Fetching NFT collection for user:', userId);

  const query = `
    query GetUserNFTs($userId: String!) {
      getUser(id: $userId) {
        ownedNFTs {
          id
          name
          description
          itemType
          rarity
          tokenBonus
          imageUrl
          imageCID
          generatedAt
          isEquipped
          tokenId
          mintTransactionHash
        }
        equippedNFT {
          id
          name
          itemType
          imageUrl
        }
      }
    }
  `;

  try {
    const response = await axios.post(
      DGRAPH_ENDPOINT,
      {
        query,
        variables: { userId },
      },
      {
        headers: { 'Content-Type': 'application/json' },
      },
    );

    if (response.data.errors) {
      console.error('Error fetching user NFTs:', response.data.errors);
      throw new Error('Failed to fetch user NFT collection');
    }

    const userData = response.data.data.getUser;
    if (!userData) {
      throw new Error('User not found');
    }

    const nfts = userData.ownedNFTs || [];
    console.log(`Found ${nfts.length} NFTs for user ${userId}`);

    return nfts.map((nft: any) => ({
      ...nft,
      // Add convenience fields
      isRare: nft.rarity === 'rare' || nft.rarity === 'epic',
      displayUrl: nft.imageUrl || (nft.imageCID ? `https://gateway.pinata.cloud/ipfs/${nft.imageCID}` : null),
    }));
  } catch (error) {
    console.error('Error fetching user NFT collection:', error);
    throw error;
  }
};

/**
 * Equip an NFT for a user
 * @param userId - User ID
 * @param nftId - NFT ID to equip
 * @returns Promise<boolean> - Success status
 */
export const equipNFT = async (userId: string, nftId: string): Promise<boolean> => {
  console.log('Equipping NFT for user:', { userId, nftId });

  try {
    // First, unequip any currently equipped NFT
    const unequipMutation = `
      mutation UnequipCurrentNFT($userId: String!) {
        updateUser(input: {
          filter: { id: { eq: $userId } },
          remove: { equippedNFT: {} }
        }) {
          user {
            id
          }
        }
        updateNFTItem(input: {
          filter: { owner: { id: { eq: $userId } }, isEquipped: true },
          set: { isEquipped: false }
        }) {
          nFTItem {
            id
          }
        }
      }
    `;

    await axios.post(
      DGRAPH_ENDPOINT,
      {
        query: unequipMutation,
        variables: { userId },
      },
      {
        headers: { 'Content-Type': 'application/json' },
      },
    );

    // Then equip the new NFT
    const equipMutation = `
      mutation EquipNFT($userId: String!, $nftId: String!) {
        updateUser(input: {
          filter: { id: { eq: $userId } },
          set: { equippedNFT: { id: $nftId } }
        }) {
          user {
            id
            equippedNFT {
              id
              name
            }
          }
        }
        updateNFTItem(input: {
          filter: { id: { eq: $nftId } },
          set: { isEquipped: true }
        }) {
          nFTItem {
            id
            isEquipped
          }
        }
      }
    `;

    const response = await axios.post(
      DGRAPH_ENDPOINT,
      {
        query: equipMutation,
        variables: { userId, nftId },
      },
      {
        headers: { 'Content-Type': 'application/json' },
      },
    );

    if (response.data.errors) {
      console.error('Error equipping NFT:', response.data.errors);
      return false;
    }

    console.log('✅ NFT equipped successfully');
    return true;
  } catch (error) {
    console.error('Error equipping NFT:', error);
    return false;
  }
};

/**
 * Creates or updates a user's avatar with cleanup of old avatars
 * @param avatarData - Avatar data
 * @returns Promise<{success: boolean, avatarId?: string, error?: string, cleanupResults?: any}>
 */
export const saveUserAvatar = async (avatarData: {
  userId: string;
  baseImageUrl: string;
  generatedImageUrl: string;
  baseImageCID?: string;
  generatedImageCID?: string;
  equippedCapId?: string;
  equippedHoodieId?: string;
  equippedPantsId?: string;
  equippedShoesId?: string;
  generationPrompt?: string;
}): Promise<{ success: boolean; avatarId?: string; error?: string; cleanupResults?: any }> => {
  console.log('🎨 Saving user avatar with cleanup:', {
    userId: avatarData.userId,
    hasGeneratedImage: !!avatarData.generatedImageUrl,
    equippedItems: {
      cap: !!avatarData.equippedCapId,
      hoodie: !!avatarData.equippedHoodieId,
      pants: !!avatarData.equippedPantsId,
      shoes: !!avatarData.equippedShoesId,
    },
  });

  const avatarId = uuidv4();
  const now = new Date().toISOString();

  try {
    // STEP 1: Clean up old avatars BEFORE creating new one
    console.log('🧹 Step 1: Cleaning up old avatars...');
    const cleanupResults = await cleanupOldAvatars(avatarData.userId);

    if (!cleanupResults.success) {
      console.warn('⚠️ Cleanup failed, but continuing with save:', cleanupResults.error);
    } else {
      console.log(
        `✅ Cleanup complete: ${cleanupResults.deletedCount} records, ${cleanupResults.cleanedFiles?.length} files`,
      );
    }

    // STEP 2: Deactivate any remaining active avatars (just in case)
    const deactivateQuery = `
      mutation DeactivateOldAvatars($userId: String!) {
        updateAvatar(input: {
          filter: { user: { id: { eq: $userId } }, isActive: true },
          set: { isActive: false }
        }) {
          numUids
        }
      }
    `;

    await axios.post(
      DGRAPH_ENDPOINT,
      {
        query: deactivateQuery,
        variables: { userId: avatarData.userId },
      },
      {
        headers: { 'Content-Type': 'application/json' },
      },
    );

    // STEP 3: Create the new avatar
    console.log('🎨 Step 2: Creating new avatar record...');

    // Build the input object dynamically based on what's provided
    const input: any = {
      id: avatarId,
      user: { id: avatarData.userId },
      baseImageUrl: avatarData.baseImageUrl,
      generatedImageUrl: avatarData.generatedImageUrl,
      generatedAt: now,
      isActive: true,
    };

    // Only add optional fields if they exist
    if (avatarData.baseImageCID) {
      input.baseImageCID = avatarData.baseImageCID;
    }
    if (avatarData.generatedImageCID) {
      input.generatedImageCID = avatarData.generatedImageCID;
    }
    if (avatarData.generationPrompt) {
      input.generationPrompt = avatarData.generationPrompt;
    }
    if (avatarData.equippedCapId) {
      input.equippedCap = { id: avatarData.equippedCapId };
    }
    if (avatarData.equippedHoodieId) {
      input.equippedHoodie = { id: avatarData.equippedHoodieId };
    }
    if (avatarData.equippedPantsId) {
      input.equippedPants = { id: avatarData.equippedPantsId };
    }
    if (avatarData.equippedShoesId) {
      input.equippedShoes = { id: avatarData.equippedShoesId };
    }

    const createMutation = `
      mutation CreateAvatar($input: [AddAvatarInput!]!) {
        addAvatar(input: $input) {
          avatar {
            id
            generatedImageUrl
            user {
              id
              username
            }
          }
        }
      }
    `;

    const response = await axios.post(
      DGRAPH_ENDPOINT,
      {
        query: createMutation,
        variables: {
          input: [input],
        },
      },
      {
        headers: { 'Content-Type': 'application/json' },
      },
    );

    if (response.data.errors) {
      console.error('Error creating avatar:', response.data.errors);
      throw new Error(`Failed to create avatar: ${response.data.errors[0].message}`);
    }

    const createdAvatar = response.data.data.addAvatar.avatar[0];
    console.log('✅ Avatar created successfully:', {
      id: createdAvatar.id,
      user: createdAvatar.user.username,
    });

    // STEP 4: Update user's current avatar reference
    console.log('🎨 Step 3: Updating user current avatar reference...');

    const updateUserMutation = `
      mutation UpdateUserAvatar($userId: String!, $avatarUrl: String!) {
        updateUser(input: {
          filter: { id: { eq: $userId } },
          set: { 
            currentAvatar: $avatarUrl
          }
        }) {
          user {
            id
            currentAvatar
          }
        }
      }
    `;

    await axios.post(
      DGRAPH_ENDPOINT,
      {
        query: updateUserMutation,
        variables: {
          userId: avatarData.userId,
          avatarUrl: avatarData.generatedImageUrl,
        },
      },
      {
        headers: { 'Content-Type': 'application/json' },
      },
    );

    console.log('✅ User currentAvatar updated successfully');
    console.log('🎉 Avatar saved successfully with cleanup:', avatarId);

    return {
      success: true,
      avatarId,
      cleanupResults,
    };
  } catch (error) {
    console.error('❌ Error saving avatar:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
};

/**
 * Get user's current avatar and equipped items
 * @param userId - User ID
 * @returns Promise<Avatar | null>
 */
export const getUserAvatar = async (userId: string): Promise<any | null> => {
  console.log('🎨 Fetching user avatar:', userId);

  const query = `
    query GetUserAvatar($userId: String!) {
      getUser(id: $userId) {
        currentAvatar
        baseAvatar
        avatarHistory(filter: { isActive: true }, first: 1) {
          id
          baseImageUrl
          generatedImageUrl
          baseImageCID
          generatedImageCID
          generatedAt
          generationPrompt
          isActive
          equippedCap {
            id
            name
            imageUrl
            itemType
          }
          equippedHoodie {
            id
            name
            imageUrl
            itemType
          }
          equippedPants {
            id
            name
            imageUrl
            itemType
          }
          equippedShoes {
            id
            name
            imageUrl
            itemType
          }
        }
        equippedCap {
          id
          name
          imageUrl
          itemType
        }
        equippedHoodie {
          id
          name
          imageUrl
          itemType
        }
        equippedPants {
          id
          name
          imageUrl
          itemType
        }
        equippedShoes {
          id
          name
          imageUrl
          itemType
        }
      }
    }
  `;

  try {
    const response = await axios.post(
      DGRAPH_ENDPOINT,
      {
        query,
        variables: { userId },
      },
      {
        headers: { 'Content-Type': 'application/json' },
      },
    );

    if (response.data.errors) {
      console.error('Error fetching user avatar:', response.data.errors);
      throw new Error('Failed to fetch user avatar');
    }

    const userData = response.data.data.getUser;
    if (!userData) {
      return null;
    }

    const currentAvatarRecord = userData.avatarHistory?.[0];

    return {
      currentAvatar: userData.currentAvatar,
      baseAvatar: userData.baseAvatar,
      avatarRecord: currentAvatarRecord,
      equippedItems: {
        cap: userData.equippedCap,
        hoodie: userData.equippedHoodie,
        pants: userData.equippedPants,
        shoes: userData.equippedShoes,
      },
    };
  } catch (error) {
    console.error('Error fetching user avatar:', error);
    return null;
  }
};

/**
 * Get user's owned NFT items by type
 * @param userId - User ID
 * @param itemType - Optional item type filter
 * @returns Promise<Array> - Array of user's NFT items
 */
export const getUserNFTsByType = async (userId: string, itemType?: string): Promise<any[]> => {
  console.log('🎨 Fetching user NFTs by type:', { userId, itemType });

  const query = `
    query GetUserNFTsByType($userId: String!${itemType ? ', $itemType: String!' : ''}) {
      getUser(id: $userId) {
        ownedNFTs${itemType ? '(filter: { itemType: { eq: $itemType } })' : ''} {
          id
          name
          description
          itemType
          rarity
          tokenBonus
          imageUrl
          imageCID
          generatedAt
          isEquipped
          tokenId
          mintTransactionHash
        }
      }
    }
  `;

  try {
    const response = await axios.post(
      DGRAPH_ENDPOINT,
      {
        query,
        variables: itemType ? { userId, itemType } : { userId },
      },
      {
        headers: { 'Content-Type': 'application/json' },
      },
    );

    if (response.data.errors) {
      console.error('Error fetching user NFTs by type:', response.data.errors);
      throw new Error('Failed to fetch user NFTs by type');
    }

    const userData = response.data.data.getUser;
    if (!userData) {
      return [];
    }

    return userData.ownedNFTs || [];
  } catch (error) {
    console.error('Error fetching user NFTs by type:', error);
    return [];
  }
};

/**
 * Update user's equipped items
 * @param userId - User ID
 * @param equippedItems - Object with equipped item IDs
 * @returns Promise<boolean> - Success status
 */
export const updateUserEquippedItems = async (
  userId: string,
  equippedItems: {
    capId?: string | null;
    hoodieId?: string | null;
    pantsId?: string | null;
    shoesId?: string | null;
  },
): Promise<boolean> => {
  console.log('🎨 Updating user equipped items:', { userId, equippedItems });

  try {
    // Build the mutation dynamically based on provided items
    let setClause = '';
    const variables: any = { userId };

    if (equippedItems.capId !== undefined) {
      if (equippedItems.capId) {
        setClause += 'equippedCap: { id: $capId },';
        variables.capId = equippedItems.capId;
      } else {
        setClause += 'equippedCap: null,';
      }
    }

    if (equippedItems.hoodieId !== undefined) {
      if (equippedItems.hoodieId) {
        setClause += 'equippedHoodie: { id: $hoodieId },';
        variables.hoodieId = equippedItems.hoodieId;
      } else {
        setClause += 'equippedHoodie: null,';
      }
    }

    if (equippedItems.pantsId !== undefined) {
      if (equippedItems.pantsId) {
        setClause += 'equippedPants: { id: $pantsId },';
        variables.pantsId = equippedItems.pantsId;
      } else {
        setClause += 'equippedPants: null,';
      }
    }

    if (equippedItems.shoesId !== undefined) {
      if (equippedItems.shoesId) {
        setClause += 'equippedShoes: { id: $shoesId },';
        variables.shoesId = equippedItems.shoesId;
      } else {
        setClause += 'equippedShoes: null,';
      }
    }

    // Remove trailing comma
    setClause = setClause.slice(0, -1);

    const mutation = `
      mutation UpdateUserEquippedItems($userId: String!${variables.capId ? ', $capId: String!' : ''}${variables.hoodieId ? ', $hoodieId: String!' : ''}${variables.pantsId ? ', $pantsId: String!' : ''}${variables.shoesId ? ', $shoesId: String!' : ''}) {
        updateUser(input: {
          filter: { id: { eq: $userId } },
          set: {
            ${setClause}
          }
        }) {
          user {
            id
            equippedCap { id }
            equippedHoodie { id }
            equippedPants { id }
            equippedShoes { id }
          }
        }
      }
    `;

    const response = await axios.post(
      DGRAPH_ENDPOINT,
      {
        query: mutation,
        variables,
      },
      {
        headers: { 'Content-Type': 'application/json' },
      },
    );

    if (response.data.errors) {
      console.error('Error updating equipped items:', response.data.errors);
      return false;
    }

    console.log('✅ Equipped items updated successfully');
    return true;
  } catch (error) {
    console.error('Error updating equipped items:', error);
    return false;
  }
};

/**
 * Delete old avatar records and clean up IPFS files - FIXED VERSION
 * @param userId - User ID
 * @returns Promise<{success: boolean, deletedCount?: number, cleanedFiles?: string[]}>
 */
export const cleanupOldAvatars = async (
  userId: string,
): Promise<{
  success: boolean;
  deletedCount?: number;
  cleanedFiles?: string[];
  error?: string;
}> => {
  console.log('🧹 Starting cleanup of old avatars for user:', userId);

  try {
    // First, get all avatars for this user by querying through the User entity
    // This avoids the AvatarFilter issue
    const getOldAvatarsQuery = `
      query GetOldAvatars($userId: String!) {
        getUser(id: $userId) {
          avatarHistory(filter: { isActive: false }) {
            id
            generatedImageCID
            baseImageCID
            generatedImageUrl
            baseImageUrl
            generatedAt
            isActive
          }
        }
      }
    `;

    const response = await axios.post(
      DGRAPH_ENDPOINT,
      {
        query: getOldAvatarsQuery,
        variables: { userId },
      },
      {
        headers: { 'Content-Type': 'application/json' },
      },
    );

    if (response.data.errors) {
      console.error('Error fetching old avatars:', response.data.errors);
      throw new Error(`Failed to fetch old avatars: ${response.data.errors[0].message}`);
    }

    const userData = response.data.data.getUser;
    if (!userData) {
      console.log('🧹 User not found, nothing to clean up');
      return { success: true, deletedCount: 0, cleanedFiles: [] };
    }

    const oldAvatars = userData.avatarHistory || [];
    console.log(`🧹 Found ${oldAvatars.length} old avatars to clean up`);

    if (oldAvatars.length === 0) {
      return { success: true, deletedCount: 0, cleanedFiles: [] };
    }

    // Extract CIDs for Pinata cleanup
    const cidsToDelete: string[] = [];
    const avatarIds: string[] = [];

    oldAvatars.forEach((avatar: any) => {
      avatarIds.push(avatar.id);

      // Add generated image CID if it exists
      if (avatar.generatedImageCID) {
        cidsToDelete.push(avatar.generatedImageCID);
      }

      // Extract CID from URL if CID field is not available
      if (!avatar.generatedImageCID && avatar.generatedImageUrl?.includes('ipfs')) {
        const cidMatch = avatar.generatedImageUrl.match(/\/ipfs\/([^\/\?]+)/);
        if (cidMatch) {
          cidsToDelete.push(cidMatch[1]);
        }
      }
    });

    console.log(`🧹 Will delete ${avatarIds.length} avatar records and ${cidsToDelete.length} IPFS files`);

    // Delete from Pinata first (so we don't lose reference if Dgraph fails)
    const cleanedFiles: string[] = [];
    if (cidsToDelete.length > 0 && process.env.PINATA_JWT) {
      console.log('🧹 Cleaning up IPFS files from Pinata...');

      for (const cid of cidsToDelete) {
        try {
          await deletePinataFile(cid);
          cleanedFiles.push(cid);
          console.log(`🗑️ Deleted IPFS file: ${cid}`);
        } catch (error) {
          console.warn(`⚠️ Failed to delete IPFS file ${cid}:`, error);
          // Continue with other files even if one fails
        }
      }
    }

    // Delete avatar records from Dgraph using the correct mutation
    if (avatarIds.length > 0) {
      const deleteAvatarsQuery = `
        mutation DeleteOldAvatars($avatarIds: [String!]!) {
          deleteAvatar(filter: { id: $avatarIds }) {
            numUids
          }
        }
      `;

      const deleteResponse = await axios.post(
        DGRAPH_ENDPOINT,
        {
          query: deleteAvatarsQuery,
          variables: { avatarIds },
        },
        {
          headers: { 'Content-Type': 'application/json' },
        },
      );

      if (deleteResponse.data.errors) {
        console.error('Error deleting avatar records:', deleteResponse.data.errors);
        throw new Error(`Failed to delete avatar records: ${deleteResponse.data.errors[0].message}`);
      }

      const deletedCount = deleteResponse.data.data.deleteAvatar.numUids;
      console.log(`🗑️ Deleted ${deletedCount} avatar records from database`);

      return {
        success: true,
        deletedCount,
        cleanedFiles,
      };
    }

    return { success: true, deletedCount: 0, cleanedFiles };
  } catch (error) {
    console.error('🧹 Error during avatar cleanup:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown cleanup error',
    };
  }
};

/**
 * Delete a file from Pinata IPFS
 * @param cid - IPFS CID to delete
 * @returns Promise<boolean>
 */
export const deletePinataFile = async (cid: string): Promise<boolean> => {
  console.log(`🗑️ Deleting IPFS file from Pinata: ${cid}`);

  if (!process.env.PINATA_JWT) {
    console.warn('⚠️ PINATA_JWT not configured, skipping IPFS cleanup');
    return false;
  }

  try {
    const response = await axios.delete(`https://api.pinata.cloud/pinning/unpin/${cid}`, {
      headers: {
        Authorization: process.env.PINATA_JWT,
      },
    });

    if (response.status === 200) {
      console.log(`✅ Successfully deleted IPFS file: ${cid}`);
      return true;
    } else {
      console.warn(`⚠️ Unexpected response when deleting ${cid}:`, response.status);
      return false;
    }
  } catch (error: any) {
    if (error.response?.status === 404) {
      console.log(`📝 IPFS file ${cid} was already deleted or doesn't exist`);
      return true; // Consider 404 as success since file is gone
    }

    console.error(`❌ Error deleting IPFS file ${cid}:`, error.response?.data || error.message);
    throw error;
  }
};

/**
 * Get storage usage statistics for a user
 * @param userId - User ID
 * @returns Promise with storage stats
 */
export const getUserStorageStats = async (
  userId: string,
): Promise<{
  totalAvatars: number;
  activeAvatars: number;
  inactiveAvatars: number;
  estimatedStorageUsed: string;
}> => {
  console.log('📊 Getting storage stats for user:', userId);

  try {
    const query = `
      query GetUserStorageStats($userId: String!) {
        totalAvatars: queryAvatar(filter: { user: { id: { eq: $userId } } }) {
          id
          generatedImageUrl
        }
        activeAvatars: queryAvatar(filter: { 
          user: { id: { eq: $userId } }, 
          isActive: true 
        }) {
          id
        }
        inactiveAvatars: queryAvatar(filter: { 
          user: { id: { eq: $userId } }, 
          isActive: false 
        }) {
          id
        }
      }
    `;

    const response = await axios.post(
      DGRAPH_ENDPOINT,
      {
        query,
        variables: { userId },
      },
      {
        headers: { 'Content-Type': 'application/json' },
      },
    );

    if (response.data.errors) {
      throw new Error('Failed to get storage stats');
    }

    const data = response.data.data;
    const totalCount = data.totalAvatars?.length || 0;
    const activeCount = data.activeAvatars?.length || 0;
    const inactiveCount = data.inactiveAvatars?.length || 0;

    // Rough estimate: assume each avatar is ~500KB average
    const estimatedMB = (totalCount * 0.5).toFixed(1);
    const estimatedStorageUsed = `~${estimatedMB}MB`;

    return {
      totalAvatars: totalCount,
      activeAvatars: activeCount,
      inactiveAvatars: inactiveCount,
      estimatedStorageUsed,
    };
  } catch (error) {
    console.error('Error getting storage stats:', error);
    return {
      totalAvatars: 0,
      activeAvatars: 0,
      inactiveAvatars: 0,
      estimatedStorageUsed: '0MB',
    };
  }
};

// Add this function to your dgraph API file (lib/api/dgraph.js or similar)

export async function getUserAvatarByImageUrl(userId: string, imageUrl: string) {
  const query = `
    query GetUserAvatarByImageUrl($userId: String!) {
      queryUser(filter: { id: { eq: $userId } }) {
        avatarHistory {
          id
          generationPrompt
          generatedImageUrl
          baseImageUrl
          generatedAt
          isActive
          equippedCap {
            id
            name
            itemType
            rarity
            tokenBonus
            imageUrl
          }
          equippedHoodie {
            id
            name
            itemType
            rarity
            tokenBonus
            imageUrl
          }
          equippedPants {
            id
            name
            itemType
            rarity
            tokenBonus
            imageUrl
          }
          equippedShoes {
            id
            name
            itemType
            rarity
            tokenBonus
            imageUrl
          }
        }
      }
    }
  `;

  try {
    const response = await axios.post(
      DGRAPH_ENDPOINT,
      {
        query,
        variables: { userId },
      },
      {
        headers: {
          'Content-Type': 'application/json',
        },
      },
    );

    if (response.data.errors) {
      console.error('GraphQL errors:', response.data.errors);
      return null;
    }

    const user = response.data?.data?.queryUser?.[0];
    if (user?.avatarHistory?.length > 0) {
      // Filter in JavaScript to find the avatar with matching URL
      const matchingAvatar = user.avatarHistory.find((avatar: any) => avatar.generatedImageUrl === imageUrl);
      return matchingAvatar || null;
    }

    return null;
  } catch (error) {
    console.error('Error fetching avatar by URL:', error);
    return null;
  }
}
