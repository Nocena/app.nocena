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
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (user: User) => Promise<void>;
  logout: () => Promise<void>;
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

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);