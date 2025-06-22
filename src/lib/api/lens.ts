// lib/api/lens.ts - Corrected for Lens Protocol V3

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
  // Updated to use the correct V3 endpoint
  private static readonly API_ENDPOINT = 'https://api.lens.xyz';

  // GraphQL Queries and Mutations for V3
  private static readonly CHECK_USERNAME_QUERY = `
      query CanCreateUsername($request: CanCreateUsernameRequest!) {
        canCreateUsername(request: $request) {
          ... on NamespaceOperationValidationPassed {
            passed
          }
          ... on NamespaceOperationValidationFailed {
            reason
            unsatisfiedRules {
              rule
            }
          }
          ... on NamespaceOperationValidationUnknown {
            extraChecksRequired {
              address
              data
            }
          }
          ... on UsernameTaken {
            localName
          }
        }
      }
    `;

  private static readonly CREATE_USERNAME_MUTATION = `
      mutation CreateUsername($request: CreateUsernameRequest!) {
        createUsername(request: $request) {
          ... on CreateUsernameResponse {
            hash
          }
          ... on SponsoredTransactionRequest {
            id
            reason
          }
          ... on SelfFundedTransactionRequest {
            reason
          }
          ... on TransactionWillFail {
            reason
          }
        }
      }
    `;

  /**
   * Check if a username is available on Lens Protocol V3
   */
  public static async checkUsernameAvailability(username: string): Promise<LensCheckResult> {
    console.log('🔍 LensProtocolService: Starting username check for:', username);

    try {
      console.log('📡 LensProtocolService: Making API request to:', this.API_ENDPOINT);

      const response = await fetch(this.API_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: this.CHECK_USERNAME_QUERY,
          variables: {
            request: {
              localName: username.toLowerCase(),
              // Using global lens namespace by default
            },
          },
        }),
      });

      console.log('📡 LensProtocolService: Response status:', response.status);

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

      const result = data.data?.canCreateUsername;

      if (!result) {
        throw new Error('No result returned from Lens API');
      }

      // Handle different response types
      switch (result.__typename) {
        case 'NamespaceOperationValidationPassed':
          console.log('✅ LensProtocolService: Username is available');
          return { available: true };

        case 'NamespaceOperationValidationFailed':
          console.log('❌ LensProtocolService: Username creation not allowed:', result.reason);
          return { available: false, error: result.reason };

        case 'NamespaceOperationValidationUnknown':
          console.log('⚠️ LensProtocolService: Username validation unknown - treating as unavailable');
          return { available: false, error: 'Username validation requires additional checks' };

        case 'UsernameTaken':
          console.log('❌ LensProtocolService: Username is taken');
          return { available: false, error: 'Username is already taken' };

        default:
          console.log('❌ LensProtocolService: Unknown response type:', result);
          return { available: false, error: 'Unknown response from Lens API' };
      }
    } catch (error) {
      console.error('💥 LensProtocolService: Error in checkUsernameAvailability:', error);
      return {
        available: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  /**
   * Check if a wallet address already has a Lens account - keeping for compatibility
   */
  public static async checkWalletLensAccount(walletAddress: string): Promise<{
    hasAccount: boolean;
    account?: LensAccount;
    error?: string;
  }> {
    console.log('🔍 LensProtocolService: Checking wallet for existing Lens account:', walletAddress);

    // For V3, this would require a different approach - for now return false
    // This would need to be implemented with proper V3 account queries
    return {
      hasAccount: false,
      error: 'Wallet account checking not implemented for V3 API',
    };
  }

  /**
   * Create account metadata - simplified for username creation
   */
  public static async createAccountMetadata(
    username: string,
    additionalData?: {
      bio?: string;
      profilePicture?: string;
      coverPicture?: string;
    },
  ): Promise<string> {
    console.log('📋 LensProtocolService: Creating account metadata for:', username);

    // For username creation, we might not need complex metadata
    // This would be used when setting up the full profile later
    const metadataId = `lens-${username}-${Date.now()}`;
    const metadataUri = `lens://nocena.app/metadata/${metadataId}`;

    console.log('✅ LensProtocolService: Metadata URI created:', metadataUri);
    return metadataUri;
  }

  /**
   * Create a Lens Protocol username (V3 API)
   */
  public static async createUsername(username: string, accessToken: string): Promise<LensAccountCreationResult> {
    try {
      console.log('🏗️ LensProtocolService: Creating username with V3 API...');

      const response = await fetch(this.API_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          query: this.CREATE_USERNAME_MUTATION,
          variables: {
            request: {
              username: {
                localName: username.toLowerCase(),
                // Uses global lens namespace by default
              },
            },
          },
        }),
      });

      console.log('📡 LensProtocolService: Create username response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ LensProtocolService: Create username HTTP error:', response.status, errorText);

        try {
          const errorData = JSON.parse(errorText);
          console.error('❌ LensProtocolService: Parsed error data:', errorData);
        } catch (parseError) {
          console.error('❌ LensProtocolService: Could not parse error response');
        }

        throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      console.log('📊 LensProtocolService: Create username response data:', JSON.stringify(data, null, 2));

      if (data.errors && data.errors.length > 0) {
        console.error('❌ LensProtocolService: Create username GraphQL errors:', data.errors);
        throw new Error(`GraphQL error: ${data.errors[0].message}`);
      }

      const result = data.data?.createUsername;

      if (!result) {
        throw new Error('No result returned from Lens API');
      }

      // Handle different response types
      if (result.__typename === 'CreateUsernameResponse') {
        return {
          hash: result.hash,
        };
      } else if (result.reason) {
        throw new Error(`Username creation failed: ${result.reason}`);
      }

      return result;
    } catch (error) {
      console.error('💥 LensProtocolService: Error creating username:', error);
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

    // V3 requirements from documentation
    if (username.length < 5) {
      errors.push('Username must be at least 5 characters long');
    }

    if (username.length > 26) {
      errors.push('Username must be no more than 26 characters long');
    }

    // Check if username contains only allowed characters: a-z, 0-9, -, and _
    const allowedPattern = /^[a-z0-9_-]+$/;
    if (!allowedPattern.test(username.toLowerCase())) {
      errors.push('Username can only contain lowercase letters, numbers, hyphens, and underscores');
    }

    // Must start with a letter or a number
    if (!/^[a-z0-9]/.test(username.toLowerCase())) {
      errors.push('Username must start with a letter or a number');
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
    const cleanBase = baseUsername.toLowerCase().replace(/[^a-z0-9]/g, '');

    // Ensure minimum length
    const base = cleanBase.length >= 5 ? cleanBase : cleanBase + '12345'.slice(0, 5 - cleanBase.length);

    // Add numbers
    for (let i = 1; i <= 5; i++) {
      const suggestion = `${base}${i}`;
      if (suggestion.length <= 26) {
        suggestions.push(suggestion);
      }
    }

    // Add suffixes
    const suffixes = ['_', 'app', 'dev', 'user'];
    suffixes.forEach((suffix) => {
      const suggestion = `${base}-${suffix}`;
      if (suggestion.length <= 26) {
        suggestions.push(suggestion);
      }
    });

    return suggestions.slice(0, 5); // Return max 5 suggestions
  }

  /**
   * Create a Lens Protocol username - main method for integration
   * Note: This requires proper authentication which needs to be implemented separately
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
    console.log('🚀 LensProtocolService: Creating Lens username with V3 API:', username);

    if (!authToken) {
      return {
        success: false,
        error:
          'Authentication token is required for username creation. Please implement proper Lens authentication first.',
      };
    }

    try {
      // Create the username
      const result = await this.createUsername(username, authToken);

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
    createUsername: LensProtocolService.createUsername,
    validateUsername: LensProtocolService.validateUsername,
    generateSuggestions: LensProtocolService.generateUsernameSuggestions,
  };
};
