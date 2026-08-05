/**
 * Working out which half of an experience header is the job title and which is
 * the employer.
 *
 * CVs write this both ways round — "Senior Engineer — Razorpay" and
 * "Razorpay — Senior Engineer" are both common — so taking the first half as
 * the role, as the parser used to, gets it backwards about half the time.
 * Dates also appear in three places: trailing, in brackets, or on their own
 * line underneath.
 */

/** Words that appear in job titles far more often than in company names. */
const ROLE_WORDS =
  /\b(engineer|engineering|developer|designer|manager|analyst|lead|director|consultant|intern|internship|architect|scientist|specialist|associate|officer|head|founder|administrator|coordinator|executive|strategist|researcher|technician|programmer|writer|editor|accountant|advisor|assistant|supervisor|trainee|apprentice|principal|staff|senior|junior|sde|swe)\b/i;

/** Suffixes and words that mark an organisation rather than a job title. */
const COMPANY_WORDS =
  /\b(inc|llc|ltd|limited|co|corp|corporation|gmbh|pvt|private|plc|technologies|technology|labs|laboratories|systems|solutions|software|services|consulting|group|holdings|ventures|partners|university|institute|college|school|hospital|bank|foundation|agency|studio|media|networks|industries)\b\.?/i;

/**
 * Decide the order of a two-part header.
 *
 * Only swaps on positive evidence: if the evidence is equal or absent the
 * original order is kept, because "Role — Company" is the more common
 * convention and guessing against it would make things worse, not better.
 */
export function orderRoleCompany(a: string, b: string): { role: string; company: string } {
  const A = a.trim();
  const B = b.trim();
  if (!B) return { role: A, company: '' };

  const aRole = ROLE_WORDS.test(A);
  const bRole = ROLE_WORDS.test(B);
  const aCompany = COMPANY_WORDS.test(A);
  const bCompany = COMPANY_WORDS.test(B);

  // Clearest signal: one side reads like a title and the other like an employer.
  if (bRole && !aRole) return { role: B, company: A };
  if (aRole && !bRole) return { role: A, company: B };

  // Next best: an explicit company marker ("Ltd", "Technologies") on one side.
  if (aCompany && !bCompany) return { role: B, company: A };
  if (bCompany && !aCompany) return { role: A, company: B };

  return { role: A, company: B };
}

/**
 * Pull a date range out of a header, wherever it sits.
 *
 * Handles "(2020 - Present)", "2020 – 2022" at the end, and "Jan 2021 –
 * Present". Previously a bracketed range stayed glued to the company name, so
 * entries came back as "Zerodha (2020 — Present)" with an empty date.
 */
const MONTH = '(?:jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*';
const POINT = `(?:${MONTH}\\.?\\s*)?(?:\\d{4}|present|current|now|ongoing)`;
const RANGE = new RegExp(
  `(${POINT}\\s*(?:[-–—]|to)\\s*${POINT})`,
  'i'
);

export function extractDateRange(text: string): { rest: string; date: string } {
  // Bracketed first — brackets are unambiguous, so they can't take a false hit.
  const bracketed = text.match(/[([]([^)\]]*\d{4}[^)\]]*)[)\]]/);
  if (bracketed && RANGE.test(bracketed[1])) {
    return {
      rest: text.replace(bracketed[0], ' ').replace(/\s{2,}/g, ' ').trim(),
      date: bracketed[1].trim(),
    };
  }

  const m = text.match(RANGE);
  if (m) {
    return {
      rest: text.replace(m[0], ' ').replace(/[\s|,–—-]+$/, '').replace(/\s{2,}/g, ' ').trim(),
      date: m[1].trim(),
    };
  }
  return { rest: text.trim(), date: '' };
}

/** True when a line is nothing but a date range — the "dates underneath" style. */
export function isDateOnlyLine(text: string): boolean {
  const t = text.trim();
  if (!t || t.length > 40) return false;
  const { rest } = extractDateRange(t);
  return rest.replace(/[^a-z0-9]/gi, '').length === 0;
}

/** Split a header on the separators CVs use between title and employer. */
export function splitHeaderParts(head: string): string[] {
  return head
    .split(/\s+[–—|·]\s+|\s+-\s+|\s+\bat\b\s+|\s*,\s*(?=[A-Z])/)
    .map((p) => p.trim())
    .filter(Boolean);
}
