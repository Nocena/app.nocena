import { createContext, useContext, ReactNode, useEffect, useState } from 'react';
import { useRouter } from 'next/router';

export interface User {
  id: string;
  username: string;
  wallet: string;
  email?: string;
  bio?: string;
  profilePicture?: string;
  earnedTokens: number;
  followers: string[];
  following: string[];
  dailyChallenge: string;
  weeklyChallenge: string;
  monthlyChallenge: string;
  completedChallenges?: Array<{
    type: string;
    title: string;
    date: string;
    proofCID: string;
  }>;
}

interface UpdateUserData {
  [key: string]: any;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (user: User) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (data: UpdateUserData) => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          setUser(JSON.parse(storedUser));
        }
      } catch (error) {
        console.error('Failed to load user:', error);
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, []);

  const login = async (userData: User) => {
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
    await router.replace('/'); // Changed to replace instead of push
  };

  const logout = async () => {
    localStorage.removeItem('user');
    setUser(null);
  
    // Await small delay for cleanup if necessary
    await new Promise(resolve => setTimeout(resolve, 50));
  
    await router.replace('/login');
  };

  const updateUser = async (data: UpdateUserData) => {
    if (!user) return;
    
    const updatedUser = {
      ...user,
      ...data
    };
    
    // Update local state
    setUser(updatedUser);
    
    // Update in localStorage
    localStorage.setItem('user', JSON.stringify(updatedUser));
    
    //L: Here you could also update the user in your backend if necessary
    // await api.updateUser(user.id, data);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);