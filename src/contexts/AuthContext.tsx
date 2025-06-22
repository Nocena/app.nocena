import React, { createContext, useState, useContext, useEffect, ReactNode, useRef, useCallback } from 'react';
import { useActiveAccount, useDisconnect, useActiveWallet } from 'thirdweb/react';

// Updated User interface - matches Dgraph schema exactly
export interface User {
  id: string;
  username: string;
  bio: string;
  wallet: string;
  profilePicture: string;
  coverPhoto: string;
  trailerVideo: string;
  earnedTokens: number;
  earnedTokensDay: number; // Maps to earnedTokensToday in Dgraph
  earnedTokensWeek: number; // Maps to earnedTokensThisWeek in Dgraph
  earnedTokensMonth: number; // Maps to earnedTokensThisMonth in Dgraph

  // Personal Expression Fields (matching Dgraph schema)
  personalField1Type: string;
  personalField1Value: string;
  personalField1Metadata: string;
  personalField2Type: string;
  personalField2Value: string;
  personalField2Metadata: string;
  personalField3Type: string;
  personalField3Value: string;
  personalField3Metadata: string;

  pushSubscription?: string | null;

  // Lens Protocol Fields
  lensHandle?: string | null;
  lensAccountId?: string | null;
  lensTransactionHash?: string | null;
  lensMetadataUri?: string | null;

  // Relationships
  followers: string[]; // Array of user IDs
  following: string[]; // Array of user IDs
  notifications: Notification[];

  // Challenge relationships
  completedChallenges: ChallengeCompletion[];
  receivedPrivateChallenges: PrivateChallenge[];
  createdPrivateChallenges: PrivateChallenge[];
  createdPublicChallenges: PublicChallenge[];
  participatingPublicChallenges: PublicChallenge[];

  // AI challenge tracking
  dailyChallenge: string; // String of 365 characters (e.g., "000...0")
  weeklyChallenge: string; // String of 52 characters (e.g., "000...0")
  monthlyChallenge: string; // String of 12 characters (e.g., "000...0")
}

// GeoPoint for location-based challenges
export interface GeoPoint {
  latitude: number;
  longitude: number;
}

// Base challenge interface
interface BaseChallenge {
  id: string;
  title: string;
  description: string;
  reward: number;
  createdAt: string;
  isActive: boolean;
}

// Private Challenge
export interface PrivateChallenge extends BaseChallenge {
  expiresAt: string;
  creator: User | string; // Can be full User object or just ID
  targetUser: User | string;
  isCompleted: boolean;
  completions: ChallengeCompletion[];
}

// Public Challenge
export interface PublicChallenge extends BaseChallenge {
  creator: User | string;
  location: GeoPoint;
  maxParticipants: number;
  participantCount: number;
  participants: User[] | string[];
  completions: ChallengeCompletion[];
}

// AI Challenge
export interface AIChallenge extends BaseChallenge {
  frequency: string; // "daily", "weekly", "monthly"
  day?: number; // Day of year (1-365) for daily challenges
  week?: number; // Week of year (1-52) for weekly challenges
  month?: number; // Month (1-12) for monthly challenges
  year: number; // Year
  completions: ChallengeCompletion[];
}

// Unified Challenge Completion
export interface ChallengeCompletion {
  id: string;
  user: User | string;

  // Challenge references - only one of these will be set
  privateChallenge?: PrivateChallenge;
  publicChallenge?: PublicChallenge;
  aiChallenge?: AIChallenge;

  // Timing information
  completionDate: string;
  completionDay: number;
  completionWeek: number;
  completionMonth: number;
  completionYear: number;

  // Media field
  media: string; // JSON string with metadata

  // Social elements
  likes?: string[]; // User IDs
  likesCount: number;

  // Classification and status
  challengeType: string; // "private", "public", "ai"
  status: string; // "pending", "verified", "rejected"
}

// Enhanced Notification
export interface Notification {
  id: string;
  user: User | string;
  userId: string;

  triggeredBy?: User | string;
  triggeredById?: string;

  content: string;
  notificationType: string; // "follow", "private_challenge", "challenge_completed", etc.

  // Challenge references
  privateChallenge?: PrivateChallenge;
  publicChallenge?: PublicChallenge;
  aiChallenge?: AIChallenge;

  isRead: boolean;
  createdAt: string;
}

// Type for simplified challenge information in the user interface
export interface SimplifiedChallengeInfo {
  type: string; // "private", "public", "AI-daily", "AI-weekly", "AI-monthly"
  title: string;
  date: string;
  proofCID: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (userData: User) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (userData: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isAuthenticated: false,
  loading: true,
  login: async () => {},
  logout: async () => {},
  updateUser: () => {},
});

export const useAuth = () => useContext(AuthContext);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  // Refs to track state and prevent multiple calls
  const lastWalletAddress = useRef<string | null>(null);
  const isInitialized = useRef<boolean>(false);
  const isProcessingAuth = useRef<boolean>(false);
  const isMounted = useRef<boolean>(false);

  // Thirdweb v5 hooks
  const account = useActiveAccount();
  const activeWallet = useActiveWallet();
  const { disconnect } = useDisconnect();

  // Check if we're in browser environment
  const isBrowser = typeof window !== 'undefined';

  // Safe localStorage access
  const getStoredUser = useCallback((): User | null => {
    if (!isBrowser) return null;

    try {
      const storedUser = localStorage.getItem('nocenaUser');
      if (!storedUser) return null;

      const userData = JSON.parse(storedUser);

      // Migration: Remove old phoneNumber and passwordHash fields if they exist
      if ('phoneNumber' in userData) {
        delete userData.phoneNumber;
      }
      if ('passwordHash' in userData) {
        delete userData.passwordHash;
      }

      // Migration: Add default media fields if they don't exist
      if (!userData.coverPhoto) {
        userData.coverPhoto = '/images/cover.jpg';
      }
      if (!userData.trailerVideo) {
        userData.trailerVideo = '/trailer.mp4';
      }

      // Migration: Add new token tracking fields if they don't exist
      if (typeof userData.earnedTokensDay !== 'number') {
        userData.earnedTokensDay = 0;
      }
      if (typeof userData.earnedTokensWeek !== 'number') {
        userData.earnedTokensWeek = 0;
      }
      if (typeof userData.earnedTokensMonth !== 'number') {
        userData.earnedTokensMonth = 0;
      }

      // Migration: Add personal expression fields if they don't exist
      if (!userData.personalField1Type) {
        userData.personalField1Type = '';
      }
      if (!userData.personalField1Value) {
        userData.personalField1Value = '';
      }
      if (!userData.personalField1Metadata) {
        userData.personalField1Metadata = '';
      }
      if (!userData.personalField2Type) {
        userData.personalField2Type = '';
      }
      if (!userData.personalField2Value) {
        userData.personalField2Value = '';
      }
      if (!userData.personalField2Metadata) {
        userData.personalField2Metadata = '';
      }
      if (!userData.personalField3Type) {
        userData.personalField3Type = '';
      }
      if (!userData.personalField3Value) {
        userData.personalField3Value = '';
      }
      if (!userData.personalField3Metadata) {
        userData.personalField3Metadata = '';
      }

      // Migration: Add Lens Protocol fields if they don't exist
      if (userData.lensHandle === undefined) {
        userData.lensHandle = null;
      }
      if (userData.lensAccountId === undefined) {
        userData.lensAccountId = null;
      }
      if (userData.lensTransactionHash === undefined) {
        userData.lensTransactionHash = null;
      }
      if (userData.lensMetadataUri === undefined) {
        userData.lensMetadataUri = null;
      }

      return userData;
    } catch (error) {
      console.error('Failed to parse stored user data:', error);
      try {
        localStorage.removeItem('nocenaUser');
      } catch (e) {
        // Ignore cleanup errors
      }
      return null;
    }
  }, [isBrowser]);

  const setStoredUser = useCallback(
    (userData: User | null): void => {
      if (!isBrowser) return;

      try {
        if (userData) {
          localStorage.setItem('nocenaUser', JSON.stringify(userData));
        } else {
          localStorage.removeItem('nocenaUser');
        }
      } catch (error) {
        console.error('Failed to store user data:', error);
      }
    },
    [isBrowser],
  );

  // Track mounting state
  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  // Initial load - only runs once on mount with delay to avoid router conflicts
  useEffect(() => {
    if (!isBrowser || isInitialized.current || isProcessingAuth.current) return;

    // Add a small delay to ensure router is ready
    const initTimer = setTimeout(() => {
      if (!isMounted.current) return;

      const loadUser = async () => {
        isProcessingAuth.current = true;

        try {
          const userData = getStoredUser();
          const currentAddress = account?.address || null;

          console.log('[AuthContext] Initial load:', {
            hasStoredUser: !!userData,
            currentAddress,
            userWallet: userData?.wallet,
            userLensHandle: userData?.lensHandle,
          });

          if (userData) {
            // If we have a wallet connection, validate it matches
            if (currentAddress && userData.wallet) {
              if (userData.wallet.toLowerCase() === currentAddress.toLowerCase()) {
                setUser(userData);
                setIsAuthenticated(true);
                lastWalletAddress.current = currentAddress;
                console.log('[AuthContext] User restored with matching wallet', {
                  lensHandle: userData.lensHandle,
                });
              } else {
                // Wallet mismatch, clear stored user
                console.log('[AuthContext] Wallet address mismatch, clearing stored user');
                setStoredUser(null);
                setUser(null);
                setIsAuthenticated(false);
                lastWalletAddress.current = currentAddress;
              }
            } else if (!currentAddress && userData.wallet) {
              // No wallet connected but user had wallet auth, clear user
              console.log('[AuthContext] No wallet connected, clearing wallet-authenticated user');
              setStoredUser(null);
              setUser(null);
              setIsAuthenticated(false);
              lastWalletAddress.current = null;
            } else {
              // User without wallet requirement
              setUser(userData);
              setIsAuthenticated(true);
              lastWalletAddress.current = currentAddress;
              console.log('[AuthContext] User restored without wallet requirement');
            }
          } else {
            // No stored user
            lastWalletAddress.current = currentAddress;
            console.log('[AuthContext] No stored user found');
          }
        } catch (err) {
          console.error('[AuthContext] Failed to load user:', err);
          setStoredUser(null);
          setUser(null);
          setIsAuthenticated(false);
          lastWalletAddress.current = account?.address || null;
        } finally {
          if (isMounted.current) {
            setLoading(false);
            isInitialized.current = true;
            isProcessingAuth.current = false;
          }
        }
      };

      loadUser();
    }, 100); // Small delay to ensure router initialization

    return () => clearTimeout(initTimer);
  }, [isBrowser, account?.address, getStoredUser, setStoredUser]);

  // Handle wallet address changes after initialization - with debouncing
  useEffect(() => {
    if (!isBrowser || !isInitialized.current || isProcessingAuth.current) return;

    const currentAddress = account?.address || null;
    const previousAddress = lastWalletAddress.current;

    // Only process if wallet address actually changed
    if (currentAddress === previousAddress) return;

    console.log('[AuthContext] Wallet change detected:', {
      from: previousAddress,
      to: currentAddress,
      hasUser: !!user,
      userWallet: user?.wallet,
      userLensHandle: user?.lensHandle,
    });

    // Debounce wallet changes to avoid rapid state updates
    const walletChangeTimer = setTimeout(() => {
      if (!isMounted.current || isProcessingAuth.current) return;

      isProcessingAuth.current = true;

      try {
        if (!currentAddress && user && user.wallet) {
          // Wallet disconnected for wallet-authenticated user
          console.log('[AuthContext] Wallet disconnected, logging out user');
          setUser(null);
          setIsAuthenticated(false);
          setStoredUser(null);
        } else if (
          currentAddress &&
          user &&
          user.wallet &&
          user.wallet.toLowerCase() !== currentAddress.toLowerCase()
        ) {
          // Wallet changed to different address
          console.log('[AuthContext] Wallet changed to different address, logging out current user');
          setUser(null);
          setIsAuthenticated(false);
          setStoredUser(null);
        }

        lastWalletAddress.current = currentAddress;
      } finally {
        if (isMounted.current) {
          isProcessingAuth.current = false;
        }
      }
    }, 250); // 250ms debounce

    return () => clearTimeout(walletChangeTimer);
  }, [account?.address, user?.wallet, user, isBrowser, setStoredUser]);

  const login = useCallback(
    async (userData: User): Promise<void> => {
      if (isProcessingAuth.current) {
        throw new Error('Authentication already in progress');
      }

      isProcessingAuth.current = true;

      try {
        console.log('[AuthContext] Login attempt:', {
          userWallet: userData.wallet,
          connectedWallet: account?.address,
          lensHandle: userData.lensHandle,
          lensAccountId: userData.lensAccountId,
        });

        // For wallet-authenticated users, validate wallet address matches
        if (userData.wallet && account?.address && userData.wallet.toLowerCase() !== account.address.toLowerCase()) {
          throw new Error('User wallet does not match connected wallet');
        }

        setUser(userData);
        setIsAuthenticated(true);
        setStoredUser(userData);
        lastWalletAddress.current = account?.address || null;

        console.log('[AuthContext] Login successful', {
          userId: userData.id,
          username: userData.username,
          lensHandle: userData.lensHandle,
        });
      } catch (error) {
        console.error('[AuthContext] Error during login:', error);
        throw error;
      } finally {
        if (isMounted.current) {
          isProcessingAuth.current = false;
        }
      }
    },
    [account?.address, setStoredUser],
  );

  const logout = useCallback(async (): Promise<void> => {
    if (isProcessingAuth.current) return;

    isProcessingAuth.current = true;

    try {
      console.log('[AuthContext] Logout initiated');

      // Clear local state and storage
      setUser(null);
      setIsAuthenticated(false);
      setStoredUser(null);
      lastWalletAddress.current = null;

      // Disconnect the active wallet if there is one
      if (user?.wallet && activeWallet) {
        try {
          disconnect(activeWallet);
        } catch (disconnectError) {
          // Ignore disconnect errors, just log them
          console.log('[AuthContext] Wallet disconnect error (non-critical):', disconnectError);
        }
      }

      console.log('[AuthContext] Logout successful');
    } catch (error) {
      console.error('[AuthContext] Error during logout:', error);
      // Still clear local state even if wallet disconnect fails
      setUser(null);
      setIsAuthenticated(false);
      setStoredUser(null);
      lastWalletAddress.current = null;
    } finally {
      if (isMounted.current) {
        isProcessingAuth.current = false;
      }
    }
  }, [user?.wallet, activeWallet, disconnect, setStoredUser]);

  const updateUser = useCallback(
    (userData: Partial<User>): void => {
      if (user && !isProcessingAuth.current && isMounted.current) {
        const updatedUser = { ...user, ...userData };
        setUser(updatedUser);
        setIsAuthenticated(true);
        setStoredUser(updatedUser);

        console.log('[AuthContext] User updated', {
          updatedFields: Object.keys(userData),
          lensHandle: updatedUser.lensHandle,
        });
      }
    },
    [user, setStoredUser],
  );

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, loading, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;