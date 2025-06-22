// hooks/useLensIntegration.ts
import { useState, useCallback, useEffect, useRef } from 'react';

export interface LensCheckResult {
  available: boolean;
  account?: {
    id: string;
    handle?: {
      fullHandle: string;
      localName: string;
    };
    ownedBy?: {
      address: string;
    };
  };
  suggestions?: string[];
  validationErrors?: string[];
  error?: string;
}

export interface LensCreationResult {
  success: boolean;
  txHash?: string;
  accountId?: string;
  existingAccount?: {
    id: string;
    handle?: {
      fullHandle: string;
      localName: string;
    };
  };
  error?: string;
}

export interface LensClaimResult {
  success: boolean;
  txHash?: string;
  accountId?: string;
  error?: string;
}

export interface WalletCheckResult {
  hasAccount: boolean;
  account?: {
    id: string;
    handle?: {
      fullHandle: string;
      localName: string;
    };
  };
  error?: string;
}

export interface UseLensIntegrationReturn {
  // State
  isChecking: boolean;
  isCreating: boolean;
  isClaiming: boolean;
  isCheckingWallet: boolean;
  lastCheckResult?: LensCheckResult;
  lastCreationResult?: LensCreationResult;
  lastClaimResult?: LensClaimResult;
  lastWalletCheck?: WalletCheckResult;

  // Actions
  checkUsername: (username: string) => Promise<LensCheckResult>;
  checkWalletAccount: (walletAddress: string) => Promise<WalletCheckResult>;
  createAccount: (params: {
    username: string;
    walletAddress: string;
    bio?: string;
    profilePicture?: string;
    authToken?: string;
  }) => Promise<LensCreationResult>;
  claimAccount: (params: { accountId: string; walletAddress: string; authToken?: string }) => Promise<LensClaimResult>;
  clearResults: () => void;
}

export const useLensIntegration = (): UseLensIntegrationReturn => {
  const [isChecking, setIsChecking] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isClaiming, setIsClaiming] = useState(false);
  const [isCheckingWallet, setIsCheckingWallet] = useState(false);
  const [lastCheckResult, setLastCheckResult] = useState<LensCheckResult>();
  const [lastCreationResult, setLastCreationResult] = useState<LensCreationResult>();
  const [lastClaimResult, setLastClaimResult] = useState<LensClaimResult>();
  const [lastWalletCheck, setLastWalletCheck] = useState<WalletCheckResult>();

  const checkUsername = useCallback(async (username: string): Promise<LensCheckResult> => {
    console.log('🎣 useLensIntegration: Starting username check for:', username);
    setIsChecking(true);

    try {
      console.log('📡 useLensIntegration: Making API request to /api/lens/checkUsername');

      const response = await fetch('/api/lens/checkUsername', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username }),
      });

      console.log('📡 useLensIntegration: Response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ useLensIntegration: API error response:', errorText);
        throw new Error(`API error: ${response.status}`);
      }

      const result: LensCheckResult = await response.json();
      console.log('📊 useLensIntegration: API result:', result);

      setLastCheckResult(result);
      return result;
    } catch (error) {
      console.error('💥 useLensIntegration: Error in checkUsername:', error);

      const errorResult: LensCheckResult = {
        available: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };

      console.log('📊 useLensIntegration: Error result:', errorResult);
      setLastCheckResult(errorResult);
      return errorResult;
    } finally {
      setIsChecking(false);
    }
  }, []);

  const checkWalletAccount = useCallback(async (walletAddress: string): Promise<WalletCheckResult> => {
    console.log('🎣 useLensIntegration: Checking wallet for Lens account:', walletAddress);
    setIsCheckingWallet(true);

    try {
      const response = await fetch('/api/lens/checkWallet', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ walletAddress }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ useLensIntegration: Wallet check error:', errorText);
        throw new Error(`API error: ${response.status}`);
      }

      const result: WalletCheckResult = await response.json();
      console.log('📊 useLensIntegration: Wallet check result:', result);

      setLastWalletCheck(result);
      return result;
    } catch (error) {
      console.error('💥 useLensIntegration: Error in checkWalletAccount:', error);

      const errorResult: WalletCheckResult = {
        hasAccount: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };

      setLastWalletCheck(errorResult);
      return errorResult;
    } finally {
      setIsCheckingWallet(false);
    }
  }, []);

  const createAccount = useCallback(
    async (params: {
      username: string;
      walletAddress: string;
      bio?: string;
      profilePicture?: string;
      authToken?: string;
    }): Promise<LensCreationResult> => {
      console.log('🎣 useLensIntegration: Creating Lens account:', params.username);
      setIsCreating(true);

      try {
        const response = await fetch('/api/lens/createAccount', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(params),
        });

        const result: LensCreationResult = await response.json();
        console.log('📊 useLensIntegration: Creation result:', result);
        setLastCreationResult(result);
        return result;
      } catch (error) {
        const errorResult: LensCreationResult = {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error occurred',
        };
        setLastCreationResult(errorResult);
        return errorResult;
      } finally {
        setIsCreating(false);
      }
    },
    [],
  );

  const claimAccount = useCallback(
    async (params: { accountId: string; walletAddress: string; authToken?: string }): Promise<LensClaimResult> => {
      console.log('🎣 useLensIntegration: Claiming Lens account:', params.accountId);
      setIsClaiming(true);

      try {
        const response = await fetch('/api/lens/claimAccount', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(params),
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error('❌ useLensIntegration: Claim account error:', errorText);
          throw new Error(`API error: ${response.status}`);
        }

        const result: LensClaimResult = await response.json();
        console.log('📊 useLensIntegration: Claim result:', result);
        setLastClaimResult(result);
        return result;
      } catch (error) {
        console.error('💥 useLensIntegration: Error in claimAccount:', error);

        const errorResult: LensClaimResult = {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error occurred',
        };
        setLastClaimResult(errorResult);
        return errorResult;
      } finally {
        setIsClaiming(false);
      }
    },
    [],
  );

  const clearResults = useCallback(() => {
    setLastCheckResult(undefined);
    setLastCreationResult(undefined);
    setLastClaimResult(undefined);
    setLastWalletCheck(undefined);
  }, []);

  return {
    isChecking,
    isCreating,
    isClaiming,
    isCheckingWallet,
    lastCheckResult,
    lastCreationResult,
    lastClaimResult,
    lastWalletCheck,
    checkUsername,
    checkWalletAccount,
    createAccount,
    claimAccount,
    clearResults,
  };
};

export interface UseLensUsernameCheckReturn extends UseLensIntegrationReturn {
  // Additional state for debounced checking
  debouncedCheckUsername: (username: string) => void;
  cancelPendingCheck: () => void;
}

export const useLensUsernameCheck = (debounceMs: number = 500): UseLensUsernameCheckReturn => {
  const baseHook = useLensIntegration();
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const debouncedCheckUsername = useCallback(
    (username: string) => {
      // Clear any existing timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      // Set new timeout
      timeoutRef.current = setTimeout(() => {
        if (username && username.trim().length >= 3) {
          baseHook.checkUsername(username.trim());
        }
      }, debounceMs);
    },
    [baseHook.checkUsername, debounceMs],
  );

  const cancelPendingCheck = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return {
    ...baseHook,
    debouncedCheckUsername,
    cancelPendingCheck,
  };
};

// Validation utilities
export const validateLensUsername = (
  username: string,
): {
  isValid: boolean;
  errors: string[];
} => {
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
  const reservedWords = ['admin', 'api', 'www', 'lens', 'nocena', 'root', 'system'];
  if (reservedWords.includes(username.toLowerCase())) {
    errors.push('This username is reserved');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

// Generate username suggestions
export const generateUsernameSuggestions = (baseUsername: string): string[] => {
  const suggestions: string[] = [];
  const cleanBase = baseUsername.toLowerCase().replace(/[^a-zA-Z0-9]/g, '');

  // Add numbers
  for (let i = 1; i <= 3; i++) {
    suggestions.push(`${cleanBase}${i}`);
  }

  // Add random numbers
  suggestions.push(`${cleanBase}${Math.floor(Math.random() * 99) + 10}`);

  // Add suffixes
  const suffixes = ['x', 'pro', 'user'];
  suffixes.forEach((suffix) => {
    if ((cleanBase + suffix).length <= 20) {
      suggestions.push(cleanBase + suffix);
    }
  });

  return suggestions.slice(0, 5);
};
