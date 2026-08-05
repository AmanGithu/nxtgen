import { useAuth as useNxtGenAuth } from '../context/AuthContext';

export interface ResumeToolUser {
  id: string;
  name: string;
  email: string;
  plan: string;
  creditsRemaining: number;
  tokensUtilized?: number;
  avatar?: string;
  role: string;
}

/**
 * Compatibility shim for the ported MindSync tools.
 *
 * Those pages expect `{ user, token, loading }` with a flat `name` field;
 * NxtGen's AuthContext exposes first/last name and keeps the JWT in
 * localStorage. This adapts one to the other so the ported code runs
 * unmodified against NxtGen's session.
 */
export function useAuth(_requireAuth = false) {
  const { user, isLoading } = useNxtGenAuth();
  const token = localStorage.getItem('token');

  const adapted: ResumeToolUser | null = user
    ? {
        id: user.id,
        name: [user.firstName, user.lastName].filter(Boolean).join(' ') || user.email,
        email: user.email,
        plan: 'pro',
        creditsRemaining: 0,
        role: user.role,
      }
    : null;

  return { user: adapted, token, loading: isLoading };
}
