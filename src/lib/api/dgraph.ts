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
  invitedById?: string,
  pushSubscription?: string | null,
) => {
  console.log('🔧 REGISTER: Starting user registration with:', {
    username,
    wallet,
    inviteCode,
    invitedById,
    hasPushSubscription: !!pushSubscription,
    pushSubscriptionLength: pushSubscription?.length,
    earnedTokens,
    earnedTokensToday,
    earnedTokensThisWeek,
    earnedTokensThisMonth,
  });

  // Validate that pushSubscription is provided
  if (!pushSubscription) {
    throw new Error('Push subscription is required for user registration');
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
      wallet: wallet,
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
      pushSubscription: pushSubscription,
      // Only add invitedBy reference if invitedById exists and is not 'system'
      ...(invitedById &&
        invitedById !== 'system' && {
          invitedBy: { id: invitedById },
        }),
    },
  };

  console.log('🔧 REGISTER: Mutation variables:', JSON.stringify(variables, null, 2));

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

      // Verify pushSubscription was saved
      if (!userData.pushSubscription) {
        console.warn('🔧 REGISTER: Warning - pushSubscription was not saved to database');
      } else {
        console.log(
          '🔧 REGISTER: Successfully saved pushSubscription:',
          userData.pushSubscription.substring(0, 50) + '...',
        );
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

    console.log('🔧 REGISTER: Successfully registered user:', userData.id, userData.username);
    return userData;
  } catch (error) {
    console.error('🔧 REGISTER: Error during user registration:', error);

    // Narrowing the type of error
    if (error instanceof Error) {
      throw new Error(error.message || 'User registration failed. Please try again.');
    } else {
      throw new Error('An unknown error occurred during user registration.');
    }
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

export const getUserByIdFromDgraph = async (userId: string) => {
  const query = `
    query GetUserById($userId: String!) {
      queryUser(filter: { id: { eq: $userId } }) {
        id
        username
        phoneNumber
        wallet
        bio
        profilePicture
        earnedTokens
        dailyChallenge
        weeklyChallenge
        monthlyChallenge
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

    const userData = response.data?.data?.queryUser[0] || null;

    // Format the data to match your User interface
    if (userData) {
      // Convert followers from objects to string array of ids
      userData.followers = userData.followers?.map((f: any) => f.id) || [];
      userData.following = userData.following?.map((f: any) => f.id) || [];

      // Format completed challenges to match your interface - updated for new schema
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
    }

    return userData;
  } catch (error) {
    console.error('Error fetching user by ID from Dgraph:', error);
    throw new Error('Failed to fetch user by ID.');
  }
};

export const getUserFromDgraph = async (identifier: string) => {
  const query = `
    query GetUser($identifier: String!) {
      queryUser(filter: { username: { eq: $identifier } }) {
        id
        username
        phoneNumber
        wallet
        bio
        passwordHash
        profilePicture
        earnedTokens
        dailyChallenge
        weeklyChallenge
        monthlyChallenge
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
    const response = await axios.post(
      DGRAPH_ENDPOINT,
      {
        query,
        variables: { identifier },
      },
      {
        headers: {
          'Content-Type': 'application/json',
        },
      },
    );

    const userData = response.data?.data?.queryUser[0] || null;

    // Format the data to match your User interface
    if (userData) {
      // Convert followers from objects to string array of ids
      userData.followers = userData.followers?.map((f: any) => f.id) || [];
      userData.following = userData.following?.map((f: any) => f.id) || [];

      // Format completed challenges to match your interface - updated for new schema
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
    }

    return userData;
  } catch (error) {
    console.error('Error fetching user from Dgraph:', error);
    throw new Error('Failed to fetch user.');
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
      position = getDayOfYear(now) - 1; // 0-based index
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
    let challengeFilter = '';
    if (challengeType === 'ai') {
      challengeFilter = ', has: aiChallenge';
    } else if (challengeType === 'private') {
      challengeFilter = ', has: privateChallenge';
    } else if (challengeType === 'public') {
      challengeFilter = ', has: publicChallenge';
    }

    const query = `
      query FetchUserCompletions($userId: String!, $startDate: DateTime!, $endDate: DateTime!) {
        getUser(id: $userId) {
          completions(
            filter: { 
              completionDate: { between: { min: $startDate, max: $endDate } }${challengeFilter}
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

    return response.data.data?.getUser?.completions || [];
  } catch (error) {
    console.error('Error fetching user completions:', error);
    throw error;
  }
}

/**
 * Fetch follower completions for a specific date and challenge type
 */
export async function fetchFollowerCompletions(
  userId: string,
  dateString: string, // YYYY-MM-DD format
  challengeType: 'daily' | 'weekly' | 'monthly' = 'daily',
): Promise<any[]> {
  const axios = (await import('axios')).default;
  const DGRAPH_ENDPOINT = process.env.NEXT_PUBLIC_DGRAPH_ENDPOINT || '';

  try {
    // Calculate date range based on challenge type
    const targetDate = new Date(dateString);
    let startDate: Date;
    let endDate: Date;

    if (challengeType === 'daily') {
      startDate = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate());
      endDate = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate(), 23, 59, 59);
    } else if (challengeType === 'weekly') {
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
      query FetchFollowerCompletions($userId: String!, $startDate: DateTime!, $endDate: DateTime!, $frequency: String!) {
        getUser(id: $userId) {
          following {
            id
            username
            profilePicture
            completions(
              filter: { 
                completionDate: { between: { min: $startDate, max: $endDate } },
                has: aiChallenge
              }
              order: { desc: completionDate }
              first: 1
            ) {
              id
              media
              completionDate
              status
              challengeType
              likesCount
              aiChallenge {
                id
                title
                description
                frequency
                reward
              }
            }
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
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          frequency: challengeType,
        },
      },
      { headers: { 'Content-Type': 'application/json' } },
    );

    if (response.data.errors) {
      console.error('GraphQL errors:', response.data.errors);
      throw new Error('Failed to fetch follower completions');
    }

    const followers = response.data.data?.getUser?.following || [];

    // Format the response to match the expected structure
    const completions = followers
      .filter((follower: any) => follower.completions && follower.completions.length > 0)
      .map((follower: any) => ({
        userId: follower.id,
        username: follower.username,
        profilePicture: follower.profilePicture,
        completion: follower.completions[0], // Most recent completion
      }))
      .filter((item: any) => {
        // Additional filtering for challenge frequency if available
        const completion = item.completion;
        if (completion.aiChallenge?.frequency) {
          return completion.aiChallenge.frequency === challengeType;
        }
        return true;
      });

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

//L: Update earned tokens for user (so far without polygon layer)
export const updateUserTokens = async (userId: string, tokenAmount: number): Promise<void> => {
  const query = `
    query GetUserTokens($userId: String!) {
      getUser(id: $userId) {
        earnedTokens
      }
    }
  `;

  try {
    // First get current token balance
    const queryResponse = await axios.post(
      DGRAPH_ENDPOINT,
      {
        query,
        variables: { userId },
      },
      {
        headers: { 'Content-Type': 'application/json' },
      },
    );

    if (queryResponse.data.errors) {
      throw new Error(`Dgraph query error: ${queryResponse.data.errors[0].message}`);
    }

    const currentTokens = queryResponse.data.data.getUser?.earnedTokens || 0;
    const newTokens = currentTokens + tokenAmount;

    // Update token balance
    const mutation = `
      mutation UpdateUserTokens($userId: String!, $tokens: Int!) {
        updateUser(input: { filter: { id: { eq: $userId } }, set: { earnedTokens: $tokens } }) {
          user {
            id
            earnedTokens
          }
        }
      }
    `;

    const updateResponse = await axios.post(
      DGRAPH_ENDPOINT,
      {
        query: mutation,
        variables: { userId, tokens: newTokens },
      },
      {
        headers: { 'Content-Type': 'application/json' },
      },
    );

    if (updateResponse.data.errors) {
      throw new Error(`Dgraph mutation error: ${updateResponse.data.errors[0].message}`);
    }
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

// Public challenges

// Add this function to your backend file

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
