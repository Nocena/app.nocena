import { v4 as uuidv4 } from 'uuid';
import axios from 'axios';
import { User } from '../../contexts/AuthContext';

const DGRAPH_ENDPOINT = process.env.NEXT_PUBLIC_DGRAPH_ENDPOINT || '';

const generateId = (): string => {
  return (
    Math.random().toString(36).substring(2, 11) +
    Math.random().toString(36).substring(2, 11)
  );
};

export const registerUser = async (
  username: string,
  email: string,
  passwordHash: string,
  profilePicture: string,
  wallet: string,
  dailyChallenge: string,
  weeklyChallenge: string,
  monthlyChallenge: string
) => {
  const mutation = `
    mutation RegisterUser($input: AddUserInput!) {
      addUser(input: [$input]) {
        user {
          id
          username
          email
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
      email,
      bio: '',
      wallet,
      passwordHash,
      profilePicture,
      earnedTokens: 0,
      followers: [],
      following: [],
      completedChallenges: [],
      upcomingChallenges: [],
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
        email
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
          challenge {
            title
            category
            frequency
          }
          media
          completionDate
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
        headers: { "Content-Type": "application/json" },
      }
    );

    const userData = response.data?.data?.queryUser[0] || null;
    
    // Format the data to match your User interface
    if (userData) {
      // Convert followers from objects to string array of ids
      userData.followers = userData.followers?.map((f: any) => f.id) || [];
      userData.following = userData.following?.map((f: any) => f.id) || [];
      
      // Format completed challenges to match your interface
      userData.completedChallenges = userData.completedChallenges?.map((c: any) => ({
        type: c.challenge.category === 'AI' ? `AI-${c.challenge.frequency}` : 'Social',
        title: c.challenge.title,
        date: c.completionDate,
        proofCID: c.media
      })) || [];
    }
    
    return userData;
  } catch (error) {
    console.error("Error fetching user by ID from Dgraph:", error);
    throw new Error("Failed to fetch user by ID.");
  }
};

export const getUserFromDgraph = async (identifier: string) => {
  const query = `
    query GetUser($identifier: String!) {
      queryUser(filter: { or: [{ username: { eq: $identifier } }, { email: { eq: $identifier } }] }) {
        id
        username
        email
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
          challenge {
            title
            category
            frequency
          }
          media
          completionDate
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
          "Content-Type": "application/json",
        },
      }
    );

    const userData = response.data?.data?.queryUser[0] || null;
    
    // Format the data to match your User interface
    if (userData) {
      // Convert followers from objects to string array of ids
      userData.followers = userData.followers?.map((f: any) => f.id) || [];
      userData.following = userData.following?.map((f: any) => f.id) || [];
      
      // Format completed challenges to match your interface
      userData.completedChallenges = userData.completedChallenges?.map((c: any) => ({
        type: c.challenge.category === 'AI' ? `AI-${c.challenge.frequency}` : 'Social',
        title: c.challenge.title,
        date: c.completionDate,
        proofCID: c.media
      })) || [];
    }
    
    return userData;
  } catch (error) {
    console.error("Error fetching user from Dgraph:", error);
    throw new Error("Failed to fetch user.");
  }
};

export const verifyPassword = (inputPassword: string, storedPasswordHash: string) => {
  // Placeholder for password comparison logic
  return btoa(inputPassword) === storedPasswordHash; // Replace with proper hash verification
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
      }
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
      }
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
    const response = await axios.post(
      DGRAPH_ENDPOINT,
      { query },
      { headers: { 'Content-Type': 'application/json' } }
    );

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
      { headers: { 'Content-Type': 'application/json' } }
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
      { headers: { 'Content-Type': 'application/json' } }
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
  if (!query || query.trim() === "") return [];

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
        variables: { pattern: regexPattern }
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
  currentUsername: string
): Promise<boolean> => {
  if (!currentUserId || !targetUserId || currentUserId === targetUserId) {
    console.error("Invalid user IDs for follow/unfollow operation.", { currentUserId, targetUserId });
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
      console.log("Creating notification with triggeredById:", currentUserId);
      await createNotification(
        targetUserId,
        currentUserId,
        `${currentUsername} followed you`,
        "follow"
      );
    }

    console.log(`Follow/unfollow successful: ${currentUserId} -> ${targetUserId}`);
    return true;
  } catch (error) {
    console.error('Network or fetch error:', error);
    return false;
  }
};

export const fetchUserFollowers = async (userId: string): Promise<number> => {
  if (!userId) return 0;

  const query = `
    query getUserFollowers($userId: String!) {
      getUser(id: $userId) {
        followers {
          id
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
      console.error('Dgraph query error:', JSON.stringify(data.errors, null, 2));
      return 0;
    }

    return data.data.getUser?.followers?.length || 0;
  } catch (error) {
    console.error('Network or fetch error:', error);
    return 0;
  }
};

export const createNotification = async (
  recipientId: string,
  triggeredById: string,
  content: string,
  notificationType: string
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
      console.error("Error creating notification:", data.errors);
      return false;
    }
    return true;
  } catch (error) {
    console.error("Network error creating notification:", error);
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

        triggeredBy {  # ✅ Fetch the full User object
          id
          username
          profilePicture
          wallet  # ✅ Ensure wallet is included for redirection
        }
      }
    }
  `;

  try {
    const response = await fetch(DGRAPH_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query, variables: { userId } }),
    });

    const data = await response.json();
    if (data.errors) {
      console.error("Error fetching notifications:", data.errors);
      return [];
    }

    return data.data?.queryNotification || [];
  } catch (error) {
    console.error("Network error fetching notifications:", error);
    return [];
  }
};

export const fetchUnreadNotificationsCount = async (userId: string) => {
  const query = `
    query GetUnreadNotifications($userId: String!) {
      queryNotification(
        filter: { userId: { eq: $userId }, isRead: { eq: false } }
      ) {
        id
      }
    }
  `;

  try {
    const response = await fetch(DGRAPH_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        query,
        variables: { "userId": userId }  // Ensure the variable is passed correctly
      }),
    });

    const data = await response.json();
    if (data.errors) {
      console.error("GraphQL Errors:", {
        errors: data.errors,
        query,
        variables: { userId }
      });
      return 0;
    }

    return data.data?.queryNotification.length || 0;
  } catch (error) {
    console.error("Network error fetching unread notifications:", error);
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
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        query: mutation,
        variables: { "userId": userId }
      }),
    });

    const data = await response.json();
    if (data.errors) {
      console.error("GraphQL Errors:", {
        errors: data.errors,
        mutation,
        variables: { userId }
      });
      return false;
    }

    return true;
  } catch (error) {
    console.error("Network error marking notifications as read:", error);
    return false;
  }
};

/* completing challenges */

interface MediaMetadata {
  directoryCID: string;
  hasVideo: boolean;
  hasSelfie: boolean;
  timestamp: number;
  videoFileName?: string;
  selfieFileName?: string;
}

/**
 * Creates a challenge completion record in the database
 * Handles both the new video+selfie format and legacy single media
 */
export const createChallengeCompletion = async (
  userId: string,
  challengeId: string,
  mediaData: string | MediaMetadata, // Can be either a plain IPFS hash or a metadata object
  isAIChallenge: boolean,
  visibility: string
): Promise<string> => {
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
      timestamp: now.getTime()
    });
  } else {
    // New format - a MediaMetadata object
    mediaJson = JSON.stringify(mediaData);
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
      $isAIChallenge: Boolean!,
      $visibility: String!
    ) {
      addChallengeCompletion(input: [{
        id: $id,
        user: { id: $userId },
        challenge: { id: $challengeId },
        media: $mediaJson,
        completionDate: $completionDate,
        completionDay: $completionDay,
        completionWeek: $completionWeek,
        completionMonth: $completionMonth,
        completionYear: $completionYear,
        isAIChallenge: $isAIChallenge,
        visibility: $visibility,
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
          isAIChallenge,
          visibility
        }
      },
      {
        headers: { 'Content-Type': 'application/json' }
      }
    );

    if (response.data.errors) {
      console.error('Dgraph mutation error:', response.data.errors);
      throw new Error('Failed to create challenge completion');
    }

    return id;
  } catch (error) {
    console.error('Error creating challenge completion:', error);
    throw error;
  }
};

// Helper functions for date calculations
function getDayOfYear(date: Date): number {
  const start = new Date(date.getFullYear(), 0, 0);
  const diff = date.getTime() - start.getTime();
  const oneDay = 1000 * 60 * 60 * 24;
  return Math.floor(diff / oneDay);
}

function getWeekOfYear(date: Date): number {
  const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
  const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000;
  return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
}

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
        variables: { userId }
      },
      {
        headers: { 'Content-Type': 'application/json' }
      }
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
        variables: { userId, tokens: newTokens }
      },
      {
        headers: { 'Content-Type': 'application/json' }
      }
    );

    if (updateResponse.data.errors) {
      throw new Error(`Dgraph mutation error: ${updateResponse.data.errors[0].message}`);
    }
  } catch (error) {
    console.error('Error updating user tokens:', error);
    throw error;
  }
};

export const getOrCreateChallenge = async (
  title: string,
  description: string,
  reward: number,
  category: string,
  frequency: string | null,
  visibility: string
): Promise<string> => {
  // First, try to find an existing challenge with the same title
  // Using allofterms for term search instead of eq
  const query = `
    query GetExistingChallenge($title: String!) {
      queryChallenge(filter: { title: { allofterms: $title } }) {
        id
      }
    }
  `;

  try {
    const queryResponse = await axios.post(
      DGRAPH_ENDPOINT,
      {
        query,
        variables: { title }
      },
      {
        headers: { 'Content-Type': 'application/json' }
      }
    );

    if (queryResponse.data.errors) {
      throw new Error(`Dgraph query error: ${JSON.stringify(queryResponse.data.errors)}`);
    }

    // If challenge exists, return its ID
    if (queryResponse.data.data.queryChallenge && queryResponse.data.data.queryChallenge.length > 0) {
      return queryResponse.data.data.queryChallenge[0].id;
    }

    // Otherwise, create a new challenge
    const id = uuidv4();
    const now = new Date();
    const createdAt = now.toISOString();
    // Set expiration to 30 days from now
    const expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString();

    const mutation = `
      mutation CreateChallenge(
        $id: String!,
        $title: String!,
        $description: String!,
        $reward: Int!,
        $category: String!,
        $frequency: String,
        $visibility: String!,
        $createdAt: DateTime!,
        $expiresAt: DateTime!
      ) {
        addChallenge(input: [{
          id: $id,
          title: $title,
          description: $description,
          reward: $reward,
          category: $category,
          frequency: $frequency,
          visibility: $visibility,
          createdAt: $createdAt,
          expiresAt: $expiresAt,
          isActive: true
        }]) {
          challenge {
            id
          }
        }
      }
    `;

    const createResponse = await axios.post(
      DGRAPH_ENDPOINT,
      {
        query: mutation,
        variables: {
          id,
          title,
          description,
          reward,
          category,
          frequency,
          visibility,
          createdAt,
          expiresAt
        }
      },
      {
        headers: { 'Content-Type': 'application/json' }
      }
    );

    if (createResponse.data.errors) {
      throw new Error(`Dgraph mutation error: ${JSON.stringify(createResponse.data.errors)}`);
    }

    return id;
  } catch (error) {
    console.error('Error getting or creating challenge:', error);
    throw error;
  }
};