import { ResumeData } from "./resumeData";
import { Prio } from "./ats";

/* Shared types for the resume AI features (rewrite, summary, tailor,
   import structuring, cover letter, interview prep). */

export type BulletTone = "stronger" | "shorter" | "metric";
export type Intensity = "conservative" | "balanced" | "creative";
export type CoverLetterTone = "professional" | "enthusiastic" | "concise";

/** Inputs for a tailored cover letter. All optional except that a JD or a
    company/role gives the model something concrete to tailor toward. */
export interface CoverLetterInput {
  jd?: string;
  company?: string;
  role?: string;
  hiringManager?: string;
  tone?: CoverLetterTone;
}

/** One interview question with a sample answer + a short delivery tip. */
export interface InterviewQuestion {
  category: string;
  question: string;
  answer: string;
  tip: string;
}

/** Full interview-prep payload: the questions plus a few overall "before the
    interview" preparation tips. */
export interface InterviewPrepResult {
  questions: InterviewQuestion[];
  tips: string[];
}

export interface TailorSuggestion {
  id: string;
  kind: "edit" | "add";
  loc: string; // e.g. "Summary", "Experience › Northwind Labs"
  note: string;
  before?: string;
  after?: string;
  add?: string;
  keywords: [string, Prio][];
  delta: number;
}

export interface TokenUsage {
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  model: string;
}

export interface AIProvider {
  readonly name: string;
  /** Token usage of this provider's most recent call. */
  lastUsage?: TokenUsage | null;
  rewriteBullet(bullet: string, tone: BulletTone): Promise<string>;
  generateSummary(resume: ResumeData, jd?: string): Promise<string>;
  tailor(resume: ResumeData, jd: string, intensity: Intensity): Promise<TailorSuggestion[]>;
  /** Parse raw extracted resume text into structured ResumeData.
     `sourceHint` (e.g. "LinkedIn profile PDF export") guides cleanup. */
  structureResume(rawText: string, sourceHint?: string): Promise<ResumeData>;
  /** Write a tailored, one-page cover letter (greeting → sign-off) from the
     résumé + target role/company/JD. Never invents facts. */
  coverLetter(resume: ResumeData, input: CoverLetterInput): Promise<string>;
  /** Generate ~16–20 likely interview questions (with sample answers + tips)
     and overall prep tips, from the job description + the candidate's résumé. */
  interviewPrep(resume: ResumeData, input: { jd: string; role?: string }): Promise<InterviewPrepResult>;
}
