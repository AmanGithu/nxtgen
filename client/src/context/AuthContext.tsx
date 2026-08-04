import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { authAPI, API_BASE_URL } from '../services/api';
import { normalizeRole, type UserRole } from '../lib/roles';
import { readGuestResume, clearGuestResume } from '../lib/guestStore';

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
  login: (token: string, refreshToken: string, userData: User) => Promise<void>;
  logout: () => Promise<void>;
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
            setUser({ ...res.data.user, role: normalizeRole(res.data.user.role) });
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

  /**
   * Move anything built while signed out into the new account.
   *
   * Losing a visitor's work at the moment they sign up is the worst point in
   * the funnel to lose them, so this runs on every login and fails quietly —
   * the local copy is only cleared once the server has accepted it.
   */
  const migrateGuestWork = async (token: string) => {
    const guest = readGuestResume();
    if (!guest) return;
    try {
      const res = await fetch(`${API_BASE_URL}/resumes`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: guest.title, template: guest.template, data: guest.data }),
      });
      // Only drop the browser copy once it is safely on the server, so a
      // failed request can be retried on the next sign-in instead of
      // silently destroying their work.
      if (res.ok) clearGuestResume();
      else console.error('Server rejected the guest résumé migration:', res.status);
    } catch (err) {
      console.error('Could not move your guest résumé into your account:', err);
    }
  };

  const login = async (token: string, refreshToken: string, userData: User) => {
    localStorage.setItem('token', token);
    localStorage.setItem('refreshToken', refreshToken);
    setUser(userData);
    /* Awaited, not fire-and-forget: the caller navigates straight after this,
       and if the résumé list loads before the migration lands the visitor sees
       an empty deck and assumes their work was lost — at the exact moment
       they've just signed up. */
    await migrateGuestWork(token);
  };

  const logout = async () => {
    const refreshToken = localStorage.getItem('refreshToken');
    /* Tell the server first so the refresh token is revoked. Clearing storage
       alone leaves it valid, so a captured token still works after the user
       believes they have signed out. Failure is ignored — the local session
       must end regardless. */
    try {
      if (refreshToken) {
        await fetch(`${API_BASE_URL}/auth/logout`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken }),
        });
      }
    } catch {
      /* offline, or the server is down — sign out locally anyway */
    }
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    setUser(null);
  };

  const loginWithGoogle = () => {
    // Implement Google OAuth redirection
    window.location.href = `${API_BASE_URL}/auth/google/url`;
  };

  const loginWithGitHub = () => {
    // Implement GitHub OAuth redirection
    window.location.href = `${API_BASE_URL}/auth/github/url`;
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
