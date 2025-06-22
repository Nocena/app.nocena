// lib/api/lens.ts
export interface LensAccount {
  id: string;
  handle?: {
    fullHandle: string;
    localName: string;
  };
  ownedBy?: {
    address: string;
  };
}

export interface LensCheckResult {
  available: boolean;
  account?: LensAccount;
  error?: string;
}

export interface LensAccountCreationResult {
  hash?: string;
  id?: string;
  reason?: string;
  error?: string;
}

export class LensProtocolService {
  private static readonly API_ENDPOINT = 'https://api-v2.lens.dev';

  // GraphQL Queries and Mutations
  private static readonly CHECK_USERNAME_QUERY = `
      query GetProfiles($handles: [Handle!]!) {
        profiles(request: { where: { handles: $handles } }) {
          items {
            id
            handle {
              fullHandle
              localName
            }
            ownedBy {
              address
            }
          }
        }
      }
    `;

  private static readonly CREATE_ACCOUNT_MUTATION = `
      mutation CreateAccountWithUsername($username: String!, $metadataUri: String!) {
        createAccountWithUsername(
          request: {
            username: {
              localName: $username
            }
            metadataUri: $metadataUri
          }
        ) {
          ... on CreateAccountWithUsernameResponse {
            hash
          }
          ... on SponsoredTransactionRequest {
            id
            reason
          }
        }
      }
    `;

  /**
   * Check if a username is available on Lens Protocol
   */
  public static async checkUsernameAvailability(username: string): Promise<LensCheckResult> {
    console.log('🔍 LensProtocolService: Starting username check for:', username);

    try {
      console.log('📡 LensProtocolService: Making API request to:', this.API_ENDPOINT);
      console.log('📋 LensProtocolService: Query:', this.CHECK_USERNAME_QUERY);
      console.log('📋 LensProtocolService: Variables:', { username: username.toLowerCase() });

      const response = await fetch(this.API_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: this.CHECK_USERNAME_QUERY,
          variables: {
            handles: [`lens/${username.toLowerCase()}`],
          },
        }),
      });

      console.log('📡 LensProtocolService: Response status:', response.status);
      console.log('📡 LensProtocolService: Response headers:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        console.error('❌ LensProtocolService: HTTP error! status:', response.status);
        const errorText = await response.text();
        console.error('❌ LensProtocolService: Error response body:', errorText);
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('📊 LensProtocolService: Response data:', JSON.stringify(data, null, 2));

      if (data.errors && data.errors.length > 0) {
        console.error('❌ LensProtocolService: GraphQL errors:', data.errors);
        throw new Error(data.errors[0].message);
      }

      const profiles = data.data?.profiles?.items || [];
      console.log('👥 LensProtocolService: Found profiles:', profiles.length);

      const existingProfile = profiles.find(
        (profile: LensAccount) => profile.handle?.localName?.toLowerCase() === username.toLowerCase(),
      );

      console.log('🔎 LensProtocolService: Existing profile found:', !!existingProfile);
      if (existingProfile) {
        console.log('👤 LensProtocolService: Existing profile details:', existingProfile);
      }

      const result = {
        available: !existingProfile,
        account: existingProfile,
      };

      console.log('✅ LensProtocolService: Final result:', result);
      return result;
    } catch (error) {
      console.error('💥 LensProtocolService: Error in checkUsernameAvailability:', error);
      console.error('💥 LensProtocolService: Error stack:', error instanceof Error ? error.stack : 'No stack trace');

      return {
        available: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  /**
   * Check if a wallet address already has a Lens account
   */
  public static async checkWalletLensAccount(walletAddress: string): Promise<{
    hasAccount: boolean;
    account?: LensAccount;
    error?: string;
  }> {
    console.log('🔍 LensProtocolService: Checking wallet for existing Lens account:', walletAddress);

    try {
      const WALLET_QUERY = `
          query GetProfilesByWallet($ownedBy: [EvmAddress!]!) {
            profiles(request: { where: { ownedBy: $ownedBy } }) {
              items {
                id
                handle {
                  fullHandle
                  localName
                }
                ownedBy {
                  address
                }
              }
            }
          }
        `;

      const response = await fetch(this.API_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: WALLET_QUERY,
          variables: {
            ownedBy: [walletAddress],
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.errors && data.errors.length > 0) {
        throw new Error(data.errors[0].message);
      }

      const profiles = data.data?.profiles?.items || [];
      console.log('👥 LensProtocolService: Found profiles for wallet:', profiles.length);

      return {
        hasAccount: profiles.length > 0,
        account: profiles[0], // Return first profile if exists
      };
    } catch (error) {
      console.error('💥 LensProtocolService: Error checking wallet:', error);
      return {
        hasAccount: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }
  public static async createAccountMetadata(
    username: string,
    additionalData?: {
      bio?: string;
      profilePicture?: string;
      coverPicture?: string;
      attributes?: Array<{
        key: string;
        type: string;
        value: string;
      }>;
    },
  ): Promise<string> {
    const metadata = {
      name: username,
      bio: additionalData?.bio || `Nocena user: ${username}`,
      picture: additionalData?.profilePicture || null,
      coverPicture: additionalData?.coverPicture || null,
      attributes: [
        {
          key: 'platform',
          type: 'STRING',
          value: 'nocena',
        },
        {
          key: 'created',
          type: 'DATE',
          value: new Date().toISOString(),
        },
        ...(additionalData?.attributes || []),
      ],
    };

    try {
      // Upload metadata to IPFS using your existing Pinata service
      const response = await fetch('/api/pinFileToIPFS', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          data: metadata,
          filename: `lens-metadata-${username}.json`,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to upload metadata to IPFS');
      }

      const result = await response.json();

      // Convert IPFS hash to lens:// URI format
      return `lens://${result.IpfsHash}`;
    } catch (error) {
      console.error('Error creating account metadata:', error);
      // Return a placeholder URI in case of error
      return `lens://placeholder-${Date.now()}`;
    }
  }

  /**
   * Create a Lens Protocol account
   */
  public static async createAccount(
    username: string,
    metadataUri: string,
    authToken?: string,
  ): Promise<LensAccountCreationResult> {
    try {
      const response = await fetch(this.API_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(authToken && { Authorization: `Bearer ${authToken}` }),
        },
        body: JSON.stringify({
          query: this.CREATE_ACCOUNT_MUTATION,
          variables: {
            username: username.toLowerCase(),
            metadataUri: metadataUri,
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.errors && data.errors.length > 0) {
        throw new Error(data.errors[0].message);
      }

      const result = data.data?.createAccountWithUsername;

      if (!result) {
        throw new Error('No result returned from Lens API');
      }

      return result;
    } catch (error) {
      console.error('Error creating Lens account:', error);
      return {
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  /**
   * Validate username format for Lens Protocol
   */
  public static validateUsername(username: string): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (!username || username.trim().length === 0) {
      errors.push('Username is required');
    }

    if (username.length < 3) {
      errors.push('Username must be at least 3 characters long');
    }

    if (username.length > 20) {
      errors.push('Username must be no more than 20 characters long');
    }

    // Check if username contains only allowed characters
    const allowedPattern = /^[a-zA-Z0-9_]+$/;
    if (!allowedPattern.test(username)) {
      errors.push('Username can only contain letters, numbers, and underscores');
    }

    // Check if username starts with a letter
    if (!/^[a-zA-Z]/.test(username)) {
      errors.push('Username must start with a letter');
    }

    // Check for reserved words
    const reservedWords = ['admin', 'api', 'www', 'lens', 'nocena', 'root'];
    if (reservedWords.includes(username.toLowerCase())) {
      errors.push('This username is reserved');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Generate suggested usernames if the desired one is taken
   */
  public static generateUsernameSuggestions(baseUsername: string): string[] {
    const suggestions: string[] = [];
    const cleanBase = baseUsername.toLowerCase().replace(/[^a-zA-Z0-9]/g, '');

    // Add numbers
    for (let i = 1; i <= 5; i++) {
      suggestions.push(`${cleanBase}${i}`);
    }

    // Add random numbers
    suggestions.push(`${cleanBase}${Math.floor(Math.random() * 100)}`);
    suggestions.push(`${cleanBase}${Math.floor(Math.random() * 1000)}`);

    // Add prefixes/suffixes
    const suffixes = ['_', 'x', 'pro', 'user'];
    suffixes.forEach((suffix) => {
      if ((cleanBase + suffix).length <= 20) {
        suggestions.push(cleanBase + suffix);
      }
    });

    return suggestions.slice(0, 5); // Return max 5 suggestions
  }

  /**
   * Create a Lens Protocol account with username - combines metadata creation and account creation
   */
  public static async createLensAccountWithUsername(
    username: string,
    walletAddress: string,
    authToken?: string,
    additionalData?: {
      bio?: string;
      profilePicture?: string;
      coverPicture?: string;
    },
  ): Promise<{
    success: boolean;
    txHash?: string;
    accountId?: string;
    error?: string;
  }> {
    console.log('🚀 LensProtocolService: Creating Lens account with username:', username);

    try {
      // First, create metadata for the account
      console.log('📋 LensProtocolService: Creating account metadata...');
      const metadataUri = await this.createAccountMetadata(username, additionalData);

      if (!metadataUri) {
        throw new Error('Failed to create account metadata');
      }

      console.log('📋 LensProtocolService: Metadata URI created:', metadataUri);

      // Then create the account
      console.log('🏗️ LensProtocolService: Creating account...');
      const result = await this.createAccount(username, metadataUri, authToken);

      if (result.error) {
        return {
          success: false,
          error: result.error,
        };
      }

      return {
        success: true,
        txHash: result.hash,
        accountId: result.id,
      };
    } catch (error) {
      console.error('💥 LensProtocolService: Error in createLensAccountWithUsername:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }
}

// Hook for React components
export const useLensProtocol = () => {
  return {
    checkUsernameAvailability: LensProtocolService.checkUsernameAvailability,
    createAccount: LensProtocolService.createAccount,
    validateUsername: LensProtocolService.validateUsername,
    generateSuggestions: LensProtocolService.generateUsernameSuggestions,
  };
};
