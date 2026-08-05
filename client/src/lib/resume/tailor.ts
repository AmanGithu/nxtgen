import type { ResumeData } from './resumeData';

export type SuggestionStatus = 'pending' | 'accepted' | 'rejected';

export interface TailorSuggestion {
  id: string;
  keyword: string;
  section: string;
  text: string;
  status: SuggestionStatus;
}

/**
 * Write a missing keyword into the résumé, in place.
 *
 * Shared by the editor's Tailoring flow and the standalone JD Tailor page so
 * the two can't drift — accepting the same suggestion must produce the same
 * edit wherever it's accepted from.
 */
export const injectKeyword = (d: ResumeData, keyword: string, section: string) => {
  if (section === 'skills') {
    if (d.skills.length > 0) d.skills[0][1] += d.skills[0][1] ? `, ${keyword}` : keyword;
    else d.skills.push(['Additional Expertise', keyword]);
  } else if (section === 'experience') {
    if (d.experience.length > 0) d.experience[0].bullets[0] += ` Integrated ${keyword} capabilities.`;
  } else {
    d.summary += d.summary ? ` Experienced in ${keyword}.` : `Specialist in ${keyword}.`;
  }
};

/** Turn missing keywords into per-section injection suggestions. */
export const buildSuggestions = (
  missing: { label: string }[],
  status: Record<string, SuggestionStatus>
): TailorSuggestion[] => {
  const sections = ['skills', 'experience', 'summary'];
  return missing.map((keyword, i) => {
    const sec = sections[i % sections.length];
    const id = `${keyword.label}-${i}`;
    return {
      id,
      keyword: keyword.label,
      section: sec,
      text:
        sec === 'skills'
          ? `Inject "${keyword.label}" into your Core Skills group (+12% match rank)`
          : sec === 'experience'
          ? `Mention target keyword "${keyword.label}" inside your job bullet highlights (+10% match rank)`
          : `Add profile context containing "${keyword.label}" to professional summary (+8% match rank)`,
      status: status[id] ?? 'pending',
    };
  });
};

/** Lower scores surface fewer, higher-impact suggestions at a time. */
export const suggestionsToRender = (list: TailorSuggestion[], score: number) => {
  const pending = list.filter((s) => s.status === 'pending');
  if (score < 70) return pending.slice(0, 3);
  if (score <= 85) return pending.slice(0, 2);
  return pending;
};
