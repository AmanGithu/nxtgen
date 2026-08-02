import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { authAPI } from '../services/api';

type UserRole = 'admin' | 'student';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (token: string, refreshToken: string, userData: User) => void;
  logout: () => void;
  loginWithGoogle: () => void;
  loginWithGitHub: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const res = await authAPI.getMe();
          if (res.data?.user) {
            const role = (res.data.user.role || '').toLowerCase() as UserRole;
            setUser({ ...res.data.user, role });
          }
        } catch (error) {
          localStorage.removeItem('token');
          localStorage.removeItem('refreshToken');
        }
      }
      setIsLoading(false);
    };
    initAuth();
  }, []);

  const login = (token: string, refreshToken: string, userData: User) => {
    localStorage.setItem('token', token);
    localStorage.setItem('refreshToken', refreshToken);
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    setUser(null);
  };

  const loginWithGoogle = () => {
    // Implement Google OAuth redirection
    window.location.href = 'http://localhost:3001/api/auth/google/url';
  };

  const loginWithGitHub = () => {
    // Implement GitHub OAuth redirection
    window.location.href = 'http://localhost:3001/api/auth/github/url';
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, isAuthenticated: !!user, login, logout, loginWithGoogle, loginWithGitHub }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
