import { v4 as uuidv4 } from 'uuid';
import axios from 'axios';
import { User } from '../../contexts/AuthContext';
import { getDayOfYear, getWeekOfYear } from '../utils/dateUtils';
import { 
  ChallengeFormData, 
  CreateChallengeResponse, 
  PublicChallenge, 
  PrivateChallenge 
} from '../map/types';

const DGRAPH_ENDPOINT = process.env.NEXT_PUBLIC_DGRAPH_ENDPOINT || '';

const generateId = (): string => {
  return Math.random().toString(36).substring(2, 11) + Math.random().toString(36).substring(2, 11);
};

// User-related functions remain mostly the same, with minor updates to property references

export const registerUser = async (
  username: string,
  phoneNumber: string,
  passwordHash: string,
  profilePicture: string,
  wallet: string,
  dailyChallenge: string,
  weeklyChallenge: string,
  monthlyChallenge: string,
) => {
  const mutation = `
    mutation RegisterUser($input: AddUserInput!) {
      addUser(input: [$input]) {
        user {
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
        }
      }
    }
  `;

  const variables = {
    input: {
      id: uuidv4(),
      username,
      phoneNumber,
      bio: '',
      wallet,
      passwordHash,
      profilePicture,
      earnedTokens: 0,
      followers: [],
      following: [],
      completedChallenges: [],
      // Remove upcomingChallenges as it's no longer in the schema
      // Add empty arrays for the new challenge relationships
      receivedPrivateChallenges: [],
      createdPrivateChallenges: [],
      createdPublicChallenges: [],
      participatingPublicChallenges: [],
      dailyChallenge,
      weeklyChallenge,
      monthlyChallenge,
    },
  };

  try {
    const response = await axios.post(DGRAPH_ENDPOINT, {
      query: mutation,
      variables,
    });

    if (response.data.errors) {
      const errorMessages = response.data.errors.map((err: any) => err.message).join(', ');
      throw new Error(`GraphQL Error: ${errorMessages}`);
    }

    // Get the user data from the response
    const userData = response.data.data.addUser.user[0];

    // Format the data to match your User interface
    if (userData) {
      // Convert followers and following from objects to string arrays of ids
      userData.followers = userData.followers?.map((f: any) => f.id) || [];
      userData.following = userData.following?.map((f: any) => f.id) || [];

      // Initialize empty completedChallenges array since new users won't have any
      userData.completedChallenges = [];
    }

    return userData;
  } catch (error) {
    console.error('Error during user registration:', error);

    // Narrowing the type of error
    if (error instanceof Error) {
      throw new Error(error.message || 'User registration failed. Please try again.');
    } else {
      throw new Error('An unknown error occurred during user registration.');
    }
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
          let challengeTitle = "";
          let challengeType = "";
          
          if (c.aiChallenge) {
            challengeTitle = c.aiChallenge.title;
            challengeType = `AI-${c.aiChallenge.frequency}`;
          } else if (c.privateChallenge) {
            challengeTitle = c.privateChallenge.title;
            challengeType = "private";
          } else if (c.publicChallenge) {
            challengeTitle = c.publicChallenge.title;
            challengeType = "public";
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
          let challengeTitle = "";
          let challengeType = "";
          
          if (c.aiChallenge) {
            challengeTitle = c.aiChallenge.title;
            challengeType = `AI-${c.aiChallenge.frequency}`;
          } else if (c.privateChallenge) {
            challengeTitle = c.privateChallenge.title;
            challengeType = "private";
          } else if (c.publicChallenge) {
            challengeTitle = c.publicChallenge.title;
            challengeType = "public";
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
  expiresInDays: number = 30
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
          targetUserId
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
  maxParticipants: number = 100
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
          maxParticipants
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
  frequency: string
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
          year
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
    challengeType
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
          challengeType
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
  frequency: string
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
      { headers: { 'Content-Type': 'application/json' } }
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
 * Get today's completion for a user
 * Updated for the new schema with separate challenge types
 * @param user The user object
 * @param type The challenge type (daily, weekly, monthly)
 * @returns The completion object or null
 */
export const getTodaysCompletion = (user: any, type: string): any | null => {
  if (!user?.completedChallenges || user.completedChallenges.length === 0) {
    return null;
  }

  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

  // Match completion type based on challenge type
  const completionType = `AI-${type}`;

  return (
    user.completedChallenges.find((completion: any) => {
      const completionDate = new Date(completion.date).toISOString().split('T')[0];
      return completionDate === today && completion.type === completionType;
    }) || null
  );
};

/**
 * Check if the user has completed a challenge today/this week/this month
 * @param user The user object
 * @param type The challenge type (daily, weekly, monthly)
 * @returns Boolean indicating if the challenge has been completed
 */
export const hasCompletedChallenge = (user: any, type: string): boolean => {
  if (!user) return false;

  const now = new Date();

  // Get the relevant tracking string based on challenge type
  let challengeString: string | undefined;
  let position: number;

  switch (type) {
    case 'daily':
      challengeString = user.dailyChallenge;
      position = getDayOfYear(now) - 1; // 0-based index
      break;
    case 'weekly':
      challengeString = user.weeklyChallenge;
      position = getWeekOfYear(now) - 1; // 0-based index
      break;
    case 'monthly':
      challengeString = user.monthlyChallenge;
      position = now.getMonth(); // 0-based index
      break;
    default:
      return false;
  }

  // Check if the challenge string exists and the position is marked as completed
  if (!challengeString || position < 0 || position >= challengeString.length) {
    return false;
  }

  return challengeString[position] === '1';
};

/**
 * Fetch completions from user's followers for a specific date
 * Updated for the new schema with separate challenge types
 * @param userId The user's ID
 * @param date The date to fetch completions for (YYYY-MM-DD format)
 * @returns Array of follower completions
 */
export const fetchFollowerCompletions = async (userId: string, date: string): Promise<any[]> => {
  if (!userId || !date) return [];

  // Convert date string to DateTime format for GraphQL
  const startDate = `${date}T00:00:00Z`;
  const endDate = `${date}T23:59:59Z`;

  const query = `
    query GetFollowerCompletions($userId: String!, $startDate: DateTime!, $endDate: DateTime!) {
      getUser(id: $userId) {
        following {
          id
          username
          profilePicture
          completedChallenges(
            filter: { 
              and: [
                { completionDate: { ge: $startDate } },
                { completionDate: { le: $endDate } },
                { challengeType: { eq: "ai" } }
              ]
            }
          ) {
            id
            media
            completionDate
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

  try {
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
      {
        headers: { 'Content-Type': 'application/json' },
      },
    );

    if (response.data.errors) {
      console.error('Dgraph query error:', response.data.errors);
      return [];
    }

    const followings = response.data.data.getUser?.following || [];

    // Process and format the data
    const completions = followings
      .filter((following: any) => following.completedChallenges?.length > 0)
      .map((following: any) => {
        // Get the first completion for today (normally there should only be one)
        const completion = following.completedChallenges[0];

        return {
          userId: following.id,
          username: following.username,
          profilePicture: following.profilePicture,
          completion: {
            ...completion,
            date: completion.completionDate, // Normalize property name
            type: completion.aiChallenge ? `AI-${completion.aiChallenge.frequency}` : 'ai',
            title: completion.aiChallenge?.title || 'Unknown Challenge'
          },
        };
      });

    return completions;
  } catch (error) {
    console.error('Error fetching follower completions:', error);
    return [];
  }
};

/**
 * Parse a media metadata JSON string into an object
 * @param mediaJson The JSON string from the database
 * @returns Parsed media metadata or null if invalid
 */
export const parseMediaMetadata = (mediaJson: string | null | undefined): any => {
  if (!mediaJson) return null;

  try {
    return JSON.parse(mediaJson);
  } catch (e) {
    console.error('Error parsing media JSON:', e);
    return null;
  }
};

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
  challengeId: string | null = null
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

/**
 * Checks if a Discord invite code exists and is valid (not used)
 *
 * @param code The 6-character invite code to check
 * @returns Promise<boolean> True if the code is valid and unused
 */
export const validateDiscordInviteCode = async (code: string): Promise<boolean> => {
  try {
    const response = await fetch('/api/registration/validate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ code }),
    });

    const data = await response.json();
    return data.valid;
  } catch (error) {
    console.error('Error validating Discord invite code:', error);
    return false;
  }
};

/**
 * Marks a Discord invite code as used by associating it with a user
 *
 * @param code The 6-character invite code
 * @param userId The Nocena user ID who used this code
 * @returns Promise<boolean> Success status
 */
export const markDiscordInviteAsUsed = async (code: string, userId: string): Promise<boolean> => {
  try {
    const response = await fetch('/api/registration/markAsUsed', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        code,
        userId,
        usedAt: new Date().toISOString(),
      }),
    });

    const data = await response.json();
    return data.success;
  } catch (error) {
    console.error('Error marking Discord invite as used:', error);
    return false;
  }
};

export const handleChallengeCreation = async (
  userId: string,
  challengeData: ChallengeFormData,
  mode: 'private' | 'public'
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
        expiresInDays
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
          variables: { userId: challengeData.targetUserId }
        })
      });

      const data = await response.json();
      const targetUsername = data.data?.getUser?.username || 'user';

      // Create a notification for the target user
      await createChallengeNotification(
        challengeData.targetUserId,
        userId,
        `You've been challenged by ${userId}!`,
        'challenge',
        'private',
        challengeId
      );

      return {
        success: true,
        challengeId: challengeId,
        message: `Successfully challenged ${targetUsername}!`
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
        challengeData.participants || 10
      );

      return {
        success: true,
        challengeId: challengeId,
        message: 'Public challenge created successfully!'
      };
    }
  } catch (error) {
    console.error('Error creating challenge:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to create challenge'
    };
  }
};