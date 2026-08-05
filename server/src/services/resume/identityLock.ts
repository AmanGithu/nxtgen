import type { ResumeData } from './resumeData';

/**
 * Forces a résumé's identity to match the account that owns it.
 *
 * The one-résumé cap stops someone *storing* a second CV, but not from
 * retyping the single one as a friend, exporting it, and changing it back —
 * which is the behaviour this is meant to prevent. Names and contact details
 * are therefore taken from the profile on every write rather than trusted
 * from the request.
 *
 * Only identity is replaced. Location, portfolio and LinkedIn lines are the
 * user's own content and are left exactly as they wrote them.
 */

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
/** Seven or more digits, allowing +, spaces, dashes and brackets. */
const PHONE = /^[+(]?[\d][\d\s\-().]{6,}$/;

export interface ProfileIdentity {
  firstName: string | null;
  lastName: string | null;
  email: string;
  phone: string | null;
}

export function isIdentityEntry(value: string): boolean {
  const v = value.trim();
  return EMAIL.test(v) || PHONE.test(v);
}

export function lockIdentity(data: ResumeData, profile: ProfileIdentity): ResumeData {
  const fullName = [profile.firstName, profile.lastName].filter(Boolean).join(' ').trim();

  /* Drop every email and phone the request supplied, then put the account's
     own back. Filtering rather than replacing the whole array keeps the
     entries that are legitimately theirs to choose. */
  const rest = (data.contact || []).filter((c) => c && c.trim() && !isIdentityEntry(c));

  const identity = [profile.email, ...(profile.phone?.trim() ? [profile.phone.trim()] : [])];

  return {
    ...data,
    name: fullName || data.name,
    contact: [...identity, ...rest],
  };
}
