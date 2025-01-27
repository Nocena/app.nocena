import { v4 as uuidv4 } from 'uuid';
import axios from 'axios';

const DGRAPH_ENDPOINT = "https://nameless-brook-670073.eu-central-1.aws.cloud.dgraph.io/graphql";

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
