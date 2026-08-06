import { parseLinkedInText, looksLikeLinkedIn } from './resume/parseLinkedIn';
import { parseResumeText } from './resume/parseResume';
import { extractKeywords, isCovered } from './resume/ats';
import { GENERIC_JD } from './resume/ats';
import { aiService } from './aiService';
import { logger } from '../lib/logger';
import type { ResumeData } from './resume/resumeData';

export type Severity = 'high' | 'medium' | 'low';

export interface Suggestion {
  section: 'headline' | 'about' | 'experience' | 'skills' | 'general';
  severity: Severity;
  title: string;
  /** Why it matters. */
  detail: string;
  /** Ready-to-paste draft, written from the user's own parsed profile so it
      is specific rather than generic advice. */
  example?: string;
  /** Short label for the example block, e.g. "Try this headline". */
  exampleLabel?: string;
  /** What the Copy button should place on the clipboard, when that differs
      from what is displayed — a before/after block shows both lines but only
      the rewritten one is worth copying. */
  copyText?: string;
}

/** Facts pulled from the parsed profile, used to personalise every draft. */
interface ProfileContext {
  name: string;
  role: string;
  company: string;
  skills: string[];
  topBullet: string;
  /** Bullets from the matched CV that already contain a number. These let the
      drafts quote real achievements instead of "[measurable result]". */
  cvAchievements: string[];
  /** Whether a CV was supplied AND its name matched the profile. */
  cvMatched: boolean;
}

export interface CvLink {
  supplied: boolean;
  matched: boolean;
  cvName: string;
  profileName: string;
  message: string;
}

/** Names match if either contains the other once normalised — handles
    "Abhijeet Mandal" vs "Abhijeet Kumar Mandal" and casing/punctuation. */
const normaliseName = (n: string) =>
  n.toLowerCase().replace(/[^a-z\s]/g, '').replace(/\s+/g, ' ').trim();

export const namesMatch = (a: string, b: string): boolean => {
  const x = normaliseName(a);
  const y = normaliseName(b);
  if (!x || !y) return false;
  if (x === y || x.includes(y) || y.includes(x)) return true;
  // Fall back to first + last token, so middle names don't break the match.
  const parts = (v: string) => v.split(' ').filter(Boolean);
  const [ax, bx] = [parts(x), parts(y)];
  if (ax.length < 2 || bx.length < 2) return false;
  return ax[0] === bx[0] && ax[ax.length - 1] === bx[bx.length - 1];
};

export interface SectionScore {
  score: number;
  max: number;
  label: string;
}

export interface LinkedInAnalysis {
  overall: number;
  sections: {
    headline: SectionScore;
    about: SectionScore;
    experience: SectionScore;
    skills: SectionScore;
  };
  suggestions: Suggestion[];
  keywords: { matched: string[]; missing: string[] };
  rewrites: { headlines: string[]; about: string | null };
  parsed: { name: string; headline: string; roles: number; skills: number };
  cv: CvLink;
  looksLikeLinkedInExport: boolean;
}

/* LinkedIn's own limits, used to judge whether a field is under-used. */
const HEADLINE_MAX = 220;
const HEADLINE_MIN_GOOD = 60;
const ABOUT_MIN_GOOD = 400;
const SKILLS_MIN_GOOD = 8;

const clamp = (n: number, lo = 0, hi = 100) => Math.max(lo, Math.min(hi, Math.round(n)));

/** Bullets that contain a number tend to read as achievements, not duties. */
const hasMetric = (s: string) => /\d/.test(s);

/** Single source of truth for a section's word label, so it can never
    contradict the number next to it. */
const labelFor = (score: number) =>
  score === 0 ? 'Missing' : score >= 75 ? 'Strong' : score >= 45 ? 'Fair' : 'Needs work';


/* ── Draft builders ───────────────────────────────────────────────────────
   Every suggestion ships with something the user can actually paste. These
   compose the drafts from the profile's own facts, falling back to neutral
   placeholders in square brackets when a fact is missing — so the user can
   see exactly which blank to fill. */

const or = (value: string, placeholder: string) => value || `[${placeholder}]`;

/** Pull the measurable part out of a CV bullet, e.g. "cut latency by 45%". */
const outcomeFrom = (bullet: string): string | null => {
  const m = bullet.match(/([^.;]*\d[^.;]*)/);
  if (!m) return null;
  return m[1].trim().replace(/^[-•\s]+/, '').replace(/\.$/, '');
};

const draftHeadline = (ctx: ProfileContext) => {
  const role = or(ctx.role, 'your role');
  const top = ctx.skills.slice(0, 3);
  const specialisms = top.length ? top.join(' · ') : '[your two or three specialisms]';

  // With a matched CV we can close the headline on a real, quantified result.
  const outcome = ctx.cvMatched ? outcomeFrom(ctx.cvAchievements[0] ?? '') : null;
  const tail = outcome ? outcome.charAt(0).toUpperCase() + outcome.slice(1) : 'Helping [who you help] achieve [the outcome you deliver]';
  return `${role} | ${specialisms} | ${tail}`;
};

const draftAbout = (ctx: ProfileContext) => {
  const role = or(ctx.role, 'your role');
  const skills = ctx.skills.slice(0, 4).join(', ') || '[your core tools and skills]';

  if (ctx.cvMatched && ctx.cvAchievements.length) {
    const wins = ctx.cvAchievements.slice(0, 3).map((b) => `• ${b.replace(/^[-•\s]+/, '')}`);
    return [
      `I'm a ${role} working with ${skills}.`,
      ``,
      `Some of what I've delivered:`,
      ...wins,
      ``,
      `Right now I'm most interested in [what you want next] — reach me at [email].`,
    ].join('\n');
  }

  return [
    `I'm a ${role} focused on [the problem you solve] for [the kind of team or customer you serve].`,
    ``,
    `Over the past [X] years I've [biggest achievement — include a number, e.g. "cut deployment time from 40 minutes to 6"]. ` +
      `Day to day I work with ${skills}.`,
    ``,
    `Right now I'm most interested in [what you want next]. If you're working on [relevant area], I'd be glad to talk — ` +
      `reach me at [email].`,
  ].join('\n');
};

/** The rewritten line on its own — this is what gets copied. */
const draftBulletAfter = (ctx: ProfileContext) => {
  const base = (ctx.topBullet || '[what you did]').trim();
  // A matched CV usually already states the result — reuse it verbatim rather
  // than asking the user to invent one.
  if (ctx.cvMatched && ctx.cvAchievements.length) {
    return ctx.cvAchievements[0].replace(/^[-•\s]+/, '');
  }
  return `${base.replace(/\.$/, '')} — cutting [metric] by [X]% across [scope].`;
};

/** Full before/after, shown in the panel so the change is visible. */
const draftBullet = (ctx: ProfileContext) => {
  const base = (ctx.topBullet || '[what you did]').trim();
  return `Before: ${base}\nAfter:  ${draftBulletAfter(ctx)}`;
};

const draftSkills = (ctx: ProfileContext) => {
  const have = ctx.skills.slice(0, 6);
  const suggestionsList = ['Communication', 'Stakeholder management', 'Mentoring', 'Problem solving'];
  return [...have, ...suggestionsList].slice(0, 12).join(', ');
};

function scoreHeadline(headline: string, ctx: ProfileContext, suggestions: Suggestion[]): SectionScore {
  if (!headline.trim()) {
    suggestions.push({
      section: 'headline',
      severity: 'high',
      title: 'Add a headline',
      detail:
        'Your headline is the most-read line on your profile and carries the most search weight. ' +
        `Use the full ${HEADLINE_MAX} characters to state your role, specialisms and value.`,
      exampleLabel: 'Try this headline',
      example: draftHeadline(ctx),
    });
    return { score: 0, max: 100, label: 'Missing' };
  }

  const len = headline.length;
  // Length is the dominant signal: a 30-char headline wastes ~85% of the field.
  let score = clamp((len / HEADLINE_MIN_GOOD) * 70);
  if (len >= HEADLINE_MIN_GOOD) score = 70 + clamp(((len - HEADLINE_MIN_GOOD) / (HEADLINE_MAX - HEADLINE_MIN_GOOD)) * 30, 0, 30);

  if (len < HEADLINE_MIN_GOOD) {
    suggestions.push({
      section: 'headline',
      severity: 'high',
      title: 'Headline is too short',
      detail:
        `Yours is ${len} characters of a possible ${HEADLINE_MAX}. Add your specialisms and the ` +
        'outcomes you deliver — recruiters search against this field.',
      exampleLabel: 'Try this headline',
      example: draftHeadline(ctx),
    });
  }
  if (!headline.includes('|') && !headline.includes('·') && len > 40) {
    suggestions.push({
      section: 'headline',
      severity: 'low',
      title: 'Separate your headline into scannable parts',
      detail: 'Pipes or middots ("Role | Specialism | Tooling") make a long headline far easier to scan.',
    });
  }

  return { score: clamp(score), max: 100, label: labelFor(clamp(score)) };
}

function scoreAbout(about: string, ctx: ProfileContext, suggestions: Suggestion[]): SectionScore {
  const len = about.trim().length;
  if (!len) {
    suggestions.push({
      section: 'about',
      severity: 'high',
      title: 'Write an About section',
      detail:
        'Profiles with an About section surface far more often in search. Write 3–5 short paragraphs ' +
        'covering what you do, who you do it for, and the results you have delivered.',
      exampleLabel: 'Start from this',
      example: draftAbout(ctx),
    });
    return { score: 0, max: 100, label: 'Missing' };
  }

  const score = clamp((len / ABOUT_MIN_GOOD) * 100);
  if (len < ABOUT_MIN_GOOD) {
    suggestions.push({
      section: 'about',
      severity: 'medium',
      title: 'Expand your About section',
      detail: `It is currently ${len} characters. Aim for at least ${ABOUT_MIN_GOOD} — roughly three short paragraphs.`,
      exampleLabel: 'A structure that works',
      example: draftAbout(ctx),
    });
  }
  if (!/\d/.test(about)) {
    suggestions.push({
      section: 'about',
      severity: 'medium',
      title: 'Add a concrete number',
      detail: 'One quantified result ("cut latency 45%", "led a team of 6") makes the whole section more credible.',
      exampleLabel: 'Add a line like this',
      example:
        ctx.cvMatched && ctx.cvAchievements.length
          ? ctx.cvAchievements[0].replace(/^[-•\s]+/, '')
          : 'In my last role I [action] which [measurable result — e.g. "cut onboarding time by 30%" or "grew revenue £250k"].',
    });
  }

  return { score, max: 100, label: labelFor(score) };
}

function scoreExperience(data: ResumeData, ctx: ProfileContext, suggestions: Suggestion[]): SectionScore {
  const roles = data.experience ?? [];
  if (!roles.length) {
    suggestions.push({
      section: 'experience',
      severity: 'high',
      title: 'Add your experience',
      detail: 'No roles were detected. Each role should carry 3–5 bullets describing outcomes, not duties.',
    });
    return { score: 0, max: 100, label: 'Missing' };
  }

  const allBullets = roles.flatMap((r) => r.bullets ?? []).filter(Boolean);
  const withMetrics = allBullets.filter(hasMetric).length;
  const thin = roles.filter((r) => (r.bullets ?? []).filter(Boolean).length < 3);

  // Half the score for describing roles at all, half for quantifying them.
  const coverage = clamp((allBullets.length / (roles.length * 3)) * 50, 0, 50);
  const metrics = allBullets.length ? clamp((withMetrics / allBullets.length) * 50, 0, 50) : 0;

  if (thin.length) {
    suggestions.push({
      section: 'experience',
      severity: 'medium',
      title:
        thin.length === 1
          ? 'One role needs more detail'
          : `${thin.length} roles need more detail`,
      detail:
        `${thin.map((r) => r.company || r.role).filter(Boolean).join(', ') || 'Some roles'} ` +
        'have fewer than three bullets. Add what you delivered and how it was measured.',
      exampleLabel: 'Three bullets to aim for',
      example: [
        '• Delivered [what] for [who], [measurable outcome].',
        '• Led [scope — team size, systems, budget] through [change], resulting in [result].',
        '• Improved [metric] from [before] to [after] by [how].',
      ].join('\n'),
    });
  }
  if (allBullets.length && withMetrics / allBullets.length < 0.3) {
    suggestions.push({
      section: 'experience',
      severity: 'high',
      title: 'Quantify your achievements',
      detail: `Only ${withMetrics} of ${allBullets.length} bullets contain a number. Aim for at least a third.`,
      exampleLabel: 'Rewrite one of yours like this',
      example: draftBullet(ctx),
      copyText: draftBulletAfter(ctx),
    });
  }

  return { score: clamp(coverage + metrics), max: 100, label: labelFor(clamp(coverage + metrics)) };
}

function scoreSkills(data: ResumeData, ctx: ProfileContext, suggestions: Suggestion[]): SectionScore {
  const count = (data.skills ?? []).reduce(
    (n, group) => n + String(group[1] ?? '').split(',').filter((s) => s.trim()).length,
    0
  );
  if (!count) {
    suggestions.push({
      section: 'skills',
      severity: 'high',
      title: 'Add skills',
      detail: 'Skills drive a large share of recruiter search matches. List at least 8 relevant ones.',
      exampleLabel: 'Add skills like these',
      example: draftSkills(ctx),
    });
    return { score: 0, max: 100, label: 'Missing' };
  }
  if (count < SKILLS_MIN_GOOD) {
    suggestions.push({
      section: 'skills',
      severity: 'medium',
      title: 'List more skills',
      detail: `You have ${count}. LinkedIn allows up to 50 — listing at least ${SKILLS_MIN_GOOD} widens your reach.`,
      exampleLabel: 'A fuller list to start from',
      example: draftSkills(ctx),
    });
  }
  return { score: clamp((count / SKILLS_MIN_GOOD) * 100), max: 100, label: labelFor(clamp((count / SKILLS_MIN_GOOD) * 100)) };
}

/**
 * Analyse a LinkedIn profile and return scores plus concrete suggestions.
 *
 * The scoring is deterministic so it always works, with or without an AI key;
 * the AI is used only for optional headline/about rewrites, which degrade to
 * the mock provider when no key is configured.
 */
export async function analyseLinkedIn(
  rawText: string,
  resumeText?: string
): Promise<LinkedInAnalysis> {
  // The LinkedIn parser understands the sidebar layout of an official PDF
  // export. Free-form pasted text doesn't match it and would come back empty —
  // scoring every section zero — so fall back to the general resume parser.
  const isExport = looksLikeLinkedIn(rawText);
  const data = isExport ? parseLinkedInText(rawText) : parseResumeText(rawText);
  const suggestions: Suggestion[] = [];

  const firstRole = (data.experience ?? [])[0];
  const skillList = (data.skills ?? [])
    .flatMap((g) => String(g[1] ?? '').split(','))
    .map((x) => x.trim())
    .filter(Boolean);
  // A CV only enriches the drafts when it belongs to the same person —
  // otherwise we'd be putting someone else's achievements in their profile.
  const cvSupplied = !!(resumeText && resumeText.trim().length > 40);
  // Pick the CV parser the same way as the profile — a LinkedIn-exported CV
  // read by the generic parser yields a name of "Contact", which would then
  // fail the match against the profile's real name.
  const cvData = cvSupplied
    ? looksLikeLinkedIn(resumeText!)
      ? parseLinkedInText(resumeText!)
      : parseResumeText(resumeText!)
    : null;
  const profileName = (data.name || '').trim();
  const cvName = (cvData?.name || '').trim();
  const cvMatched = cvSupplied && namesMatch(profileName, cvName);

  const cvAchievements = cvMatched
    ? (cvData!.experience ?? [])
        .flatMap((r) => r.bullets ?? [])
        .map((b) => (b || '').trim())
        .filter((b) => b.length > 30 && hasMetric(b))
    : [];

  const cv: CvLink = {
    supplied: cvSupplied,
    matched: cvMatched,
    cvName,
    profileName,
    message: !cvSupplied
      ? 'No CV supplied — drafts use placeholders you can fill in.'
      : cvMatched
      ? `Drafts written from your CV (${cvAchievements.length} quantified achievement${cvAchievements.length === 1 ? '' : 's'} found).`
      : `The CV name (${cvName || 'not detected'}) doesn't match the profile name (${profileName || 'not detected'}), so it was ignored.`,
  };

  const ctx: ProfileContext = {
    name: profileName,
    role: (firstRole?.role || '').trim(),
    company: (firstRole?.company || '').trim(),
    cvAchievements,
    cvMatched,
    skills: skillList,
    topBullet: ((firstRole?.bullets ?? []).find(Boolean) || '').trim(),
  };

  let headline = (data.target || '').trim();
  if (!headline && !isExport) {
    // Pasted profiles put the headline on the line under the name.
    const lines = rawText.split('\n').map((l) => l.trim()).filter(Boolean);
    const nameIdx = data.name ? lines.findIndex((l) => l === data.name.trim()) : -1;
    const candidate = lines[nameIdx + 1] ?? '';
    if (nameIdx >= 0 && candidate && candidate.length <= HEADLINE_MAX) headline = candidate;
  }
  const about = (data.summary || '').trim();

  const sections = {
    headline: scoreHeadline(headline, ctx, suggestions),
    about: scoreAbout(about, ctx, suggestions),
    experience: scoreExperience(data, ctx, suggestions),
    skills: scoreSkills(data, ctx, suggestions),
  };

  // Headline and About carry the most search weight, so weight them heavier.
  const overall = clamp(
    sections.headline.score * 0.3 +
      sections.about.score * 0.25 +
      sections.experience.score * 0.3 +
      sections.skills.score * 0.15
  );

  // Keyword coverage against a generic technical role profile.
  const profileText = rawText.toLowerCase();
  const kws = extractKeywords(GENERIC_JD);
  const matched: string[] = [];
  const missing: string[] = [];
  for (const k of kws) (isCovered(k.label, profileText) ? matched : missing).push(k.label);

  if (missing.length > kws.length / 2) {
    suggestions.push({
      section: 'general',
      severity: 'medium',
      title: 'Broaden your keyword coverage',
      detail: `${missing.length} common role keywords are absent. Weave the relevant ones into your headline, About and roles.`,
      exampleLabel: 'Work these in where they are genuinely true',
      example: missing.slice(0, 10).join(', '),
    });
  }

  // Optional AI polish. Never fail the analysis because the model misbehaved.
  let rewrites: { headlines: string[]; about: string | null } = { headlines: [], about: null };
  try {
    const ai = await aiService.analyseLinkedInProfile(rawText.slice(0, 4000));
    rewrites = {
      headlines: ai.suggestedHeadlines ?? [],
      about: (ai.summaryRecommendations ?? []).join(' ') || null,
    };
  } catch (error) {
    logger.warn('LinkedIn AI rewrite step failed; returning deterministic analysis only:', error);
  }

  const severityRank: Record<Severity, number> = { high: 0, medium: 1, low: 2 };
  suggestions.sort((a, b) => severityRank[a.severity] - severityRank[b.severity]);

  return {
    overall,
    sections,
    suggestions,
    keywords: { matched, missing },
    rewrites,
    parsed: {
      name: data.name || '',
      headline,
      roles: (data.experience ?? []).length,
      skills: (data.skills ?? []).length,
    },
    looksLikeLinkedInExport: isExport,
    cv,
  };
}
