import { v4 as uuidv4 } from 'uuid';
import axios from 'axios';

const DGRAPH_ENDPOINT = "https://nameless-brook-670073.eu-central-1.aws.cloud.dgraph.io/graphql";

export const registerUser = async (
  username: string,
  email: string,
  passwordHash: string,
  profilePicture: string,
  wallet: string
) => {
  const mutation = `
    mutation RegisterUser($input: AddUserInput!) {
      addUser(input: [$input]) {
        user {
          id
          username
          email
          wallet
        }
      }
    }
  `;

  const variables = {
    input: {
      id: uuidv4(), // Add unique ID
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
      upcomingChallenges: []
    }
  };

  try {
    const response = await axios.post(DGRAPH_ENDPOINT, {
      query: mutation,
      variables
    });

    if (response.data.errors) {
      const errorMessages = response.data.errors.map((err: any) => err.message).join(', ');
      throw new Error(`GraphQL Error: ${errorMessages}`);
    }

    return response.data.data.addUser.user[0]; // Return the first user added
  } catch (error) {
    let errMessage = 'An unexpected error occurred';
  
    if (error instanceof Error) {
      errMessage = error.message;
    }
  
    console.error('Error during user registration:', errMessage);
  
    throw new Error(errMessage || 'User registration failed. Please try again.');
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
        passwordHash
        profilePicture
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