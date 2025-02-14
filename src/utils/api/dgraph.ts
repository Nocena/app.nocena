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
          dailyChallenge
          weeklyChallenge
          monthlyChallenge
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

    return response.data.data.addUser.user[0];
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
        dailyChallenge
        weeklyChallenge
        monthlyChallenge
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

    return response.data?.data?.queryUser[0]; // Return the first user found
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

    // isFollowing is true if already following (meaning this action is an unfollow)
    const isFollowing = checkData.data.currentUser?.following?.length > 0;
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

    // If this is a new follow action, create a notification with type "follow"
    if (!isFollowing) {
      const notificationContent = `${currentUsername} followed you`;
      await createNotification(targetUserId, notificationContent, "follow");
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
  userId: string,
  content: string,
  notificationType: string // e.g., "follow", "challenge", etc.
): Promise<boolean> => {
  const id = generateId();
  const mutation = `
    mutation createNotification(
      $id: String!,
      $userId: String!,
      $content: String!,
      $notificationType: String!,
      $isRead: Boolean!,
      $createdAt: DateTime!
    ) {
      addNotification(input: [{
        id: $id,
        user: { id: $userId },  # Linking to User
        userId: $userId,        # Searchable field
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
  
  const createdAt = new Date().toISOString();
  
  try {
    const response = await fetch(DGRAPH_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: mutation,
        variables: {
          id,
          userId,
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
        user {
          id
          username
          profilePicture
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
        filter: { userId: { eq: $userId }, isRead: false }
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
        query: mutation,  // ❌ Wrong key, should be "mutation"
        variables: { "userId": userId }
      }),
    });

    const data = await response.json();
    if (data.errors) {
      console.error("GraphQL Errors:", {
        errors: data.errors,
        mutation,  // Use correct variable reference for debugging
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