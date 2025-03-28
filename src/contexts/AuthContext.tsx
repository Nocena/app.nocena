import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';

// User type that matches your Dgraph schema
export interface User {
  id: string;
  username: string;
  phoneNumber: string;
  bio: string;
  wallet: string;
  passwordHash: string;
  profilePicture: string; // CID stored in Filecoin
  earnedTokens: number;
  followers: User[]; // Array of User objects
  following: User[];
  notifications: Notification[];
  completedChallenges: ChallengeCompletion[];
  upcomingChallenges: Challenge[];
  dailyChallenge: string; // String of 365 characters
  weeklyChallenge: string; // String of 52 characters
  monthlyChallenge: string; // String of 12 characters
}

// Additional types to match Dgraph schema
export interface Challenge {
  id: string;
  title: string;
  description: string;
  type: string;
}

export interface ChallengeCompletion {
  id: string;
  challenge: Challenge;
  user: User;
  completedAt: string;
  proofCID: string;
}

export interface Notification {
  id: string;
  user: User;
  type: string;
  read: boolean;
  message: string;
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