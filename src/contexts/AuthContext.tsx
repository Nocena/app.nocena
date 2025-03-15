// contexts/AuthContext.tsx
import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';

export interface User {
  id: string;
  username: string;
  phoneNumber: string;  // Changed from email to phoneNumber
  wallet: string;
  bio: string;
  profilePicture: string;
  earnedTokens: number;
  dailyChallenge: string;
  weeklyChallenge: string;
  monthlyChallenge: string;
  followers: string[];
  following: string[];
  completedChallenges?: Array<{
    type: string;
    title: string;
    date: string;
    proofCID: string;
  }>;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;  // Added loading state
  login: (userData: User) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (userData: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isAuthenticated: false,
  loading: true,  // Default to loading
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
  const [loading, setLoading] = useState<boolean>(true); // Start with loading=true

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
    // Set loading to false once we've checked for stored user
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