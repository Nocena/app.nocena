import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';

// Updated types to match your new Dgraph schema
export interface User {
  id: string;
  username: string;
  phoneNumber: string;
  bio: string;
  wallet: string;
  passwordHash: string;
  profilePicture: string;
  earnedTokens: number;
  pushSubscription?: string | null; // Added this field

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

  // Check for existing session on mount
  useEffect(() => {
    const storedUser = localStorage.getItem('nocenaUser');
    if (storedUser) {
      try {
        const userData = JSON.parse(storedUser);
        setUser(userData);
        setIsAuthenticated(true);
      } catch (err) {
        console.error('Failed to parse stored user data:', err);
        localStorage.removeItem('nocenaUser');
      }
    }
    setLoading(false);
  }, []);

  const login = async (userData: User): Promise<void> => {
    setUser(userData);
    setIsAuthenticated(true);
    localStorage.setItem('nocenaUser', JSON.stringify(userData));
  };

  const logout = async (): Promise<void> => {
    setUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem('nocenaUser');
  };

  const updateUser = (userData: Partial<User>): void => {
    if (user) {
      const updatedUser = { ...user, ...userData };
      setUser(updatedUser);
      localStorage.setItem('nocenaUser', JSON.stringify(updatedUser));
    }
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, loading, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
