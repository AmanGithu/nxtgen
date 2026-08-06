import type { ResumeData } from './resume/resumeData';

/**
 * Guest work, kept in the browser.
 *
 * Signed-out visitors have no user record, so there's nowhere in the database
 * to key their résumé to. Rather than invent anonymous user rows (which fill
 * the DB with junk and blur what "logged in" means), their work lives here
 * until they sign in — at which point `takeGuestResume` hands it over for
 * migration and clears it.
 */

const KEY = 'nxtgen:guestResume';

export interface GuestResume {
  title: string;
  template: string;
  data: ResumeData;
  updatedAt: string;
}

export const saveGuestResume = (data: ResumeData, template = 'classic', title = 'My résumé') => {
  try {
    const payload: GuestResume = { title, template, data, updatedAt: new Date().toISOString() };
    localStorage.setItem(KEY, JSON.stringify(payload));
  } catch (err) {
    // Private browsing and full quotas both throw here. Losing the local copy
    // is bad but not worth taking the editor down for.
    console.error('Could not keep your work in this browser:', err);
  }
};

export const readGuestResume = (): GuestResume | null => {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as GuestResume) : null;
  } catch {
    return null;
  }
};

export const clearGuestResume = () => {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* nothing useful to do */
  }
};

/** Read and clear in one step, for the migration on sign-in. */
export const takeGuestResume = (): GuestResume | null => {
  const stored = readGuestResume();
  if (stored) clearGuestResume();
  return stored;
};

export const hasGuestResume = () => readGuestResume() !== null;

const ID_KEY = 'nxtgen:guestId';

/**
 * Stable per-browser id, used to meter free AI actions.
 *
 * Deliberately not a fingerprint — it's a random value the visitor can clear,
 * which is why the server also enforces a much higher per-IP ceiling behind
 * it. This is a fair-use meter, not an identity check.
 */
export const getGuestId = (): string => {
  try {
    let id = localStorage.getItem(ID_KEY);
    if (!id) {
      id = (crypto.randomUUID?.() ?? `g-${Date.now()}-${Math.random().toString(36).slice(2)}`);
      localStorage.setItem(ID_KEY, id);
    }
    return id;
  } catch {
    // Private browsing: fall back to a per-session id.
    return `g-session-${Math.random().toString(36).slice(2)}`;
  }
};

/** Headers to attach to any /api/guest/* request. */
export const guestHeaders = (): Record<string, string> => ({ 'x-guest-id': getGuestId() });
