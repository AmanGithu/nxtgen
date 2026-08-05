import type { ResumeData } from "./resumeData";
import type { CoverLetterInput, CoverLetterTone, InterviewPrepResult } from "./aiTypes";

/* ============================================================
   Shared prompt text + parsers for the cover-letter and
   interview-prep features, so the Gemini and Ollama providers
   stay in lockstep. Research-backed structure:
     • Cover letter: opening (role+company+hook) → fit (map real
       experience to the JD's top needs) → why-this-company →
       confident close. ~250–350 words, no fabrication.
     • Interview prep: 16–20 Qs across Role/Technical, Behavioral
       (STAR), Situational, Motivation & Fit, and Questions-to-Ask,
       each with a short answering tip.
   ============================================================ */

/** Compact résumé context we hand the model (keeps tokens lean, no PII beyond
    what the letter needs). */
function resumeContext(resume: ResumeData) {
  return {
    name: resume.name,
    currentTitle: resume.target,
    topSkills: resume.skills.map((s) => (s[0] ? `${s[0]}: ${s[1]}` : s[1])).join(" | ").slice(0, 600),
    achievements: resume.experience.flatMap((e) => e.bullets).filter(Boolean).slice(0, 6),
    recentRoles: resume.experience.slice(0, 3).map((e) => `${e.role}${e.company ? " at " + e.company : ""}`),
  };
}

const TONE_NOTE: Record<CoverLetterTone, string> = {
  professional: "Tone: polished and professional, confident but not boastful.",
  enthusiastic: "Tone: warm and genuinely enthusiastic about the role and company, while staying professional.",
  concise: "Tone: crisp and direct — keep it to ~200 words and three short paragraphs.",
};

export const COVER_LETTER_SYSTEM =
  "You are an expert cover-letter writer. Write a tailored, one-page cover letter of about 250-350 words in 3-4 short paragraphs. " +
  "Structure: (1) Opening — name the exact role and company and open with a genuine hook plus the candidate's single strongest relevant qualification. " +
  "(2) Fit — connect the candidate's REAL experience and achievements to the top 2-3 needs in the job description, using concrete specifics from the résumé. " +
  "(3) Why this company/role and the value the candidate will add. (4) A confident closing with a call to action and thanks. " +
  "Hard rules: never invent employers, titles, metrics, skills, or facts that are not in the résumé; no clichés ('team player', 'hardworking', 'passionate'); no markdown, no bullet points, no placeholders like [Company]. " +
  "Begin with a salutation ('Dear Hiring Manager,' or the provided name) and end with 'Sincerely,' on its own line followed by the candidate's name. Output ONLY the letter text from the salutation through the signature.";

export function coverLetterUser(resume: ResumeData, input: CoverLetterInput): string {
  const tone = TONE_NOTE[input.tone ?? "professional"];
  return (
    `Candidate:\n${JSON.stringify(resumeContext(resume))}\n\n` +
    `Target role: ${input.role || resume.target || "(infer from the job description)"}\n` +
    `Company: ${input.company || "(the hiring company)"}\n` +
    `Address the letter to: ${input.hiringManager || "Hiring Manager"}\n` +
    (input.jd ? `\nJob description:\n${input.jd.slice(0, 2000)}\n` : "") +
    `\n${tone}`
  );
}

/** Strip stray markdown / preamble the model sometimes adds around the letter. */
export function cleanLetter(text: string): string {
  return text
    .replace(/^```[a-z]*\s*|\s*```$/g, "")
    .replace(/^\s*(here('|’)s|here is)[^\n]*\n+/i, "")
    .replace(/\*\*/g, "")
    .trim();
}

export const INTERVIEW_SYSTEM =
  "You are an expert interview coach. From the job description and the candidate's résumé, produce 16 to 20 realistic interview questions the candidate is likely to be ASKED (questions the interviewer asks the candidate — never questions the candidate would ask). " +
  "Spread them across these categories: 'From Your Résumé' (3-4 questions directly about the candidate's OWN experience, projects, or achievements listed in their background — e.g. a specific recent role or a project they built), 'Role & Technical' (specific to the skills/tools in the job description), 'Behavioral' (STAR-style), 'Situational', and 'Motivation & Fit' (why this role/company). " +
  "For EVERY question provide an 'answer': a strong, ready-to-adapt sample answer of 2-4 sentences. For 'From Your Résumé' and 'Behavioral' questions, write the answer in the STAR style using the candidate's REAL details from their background (do not invent facts, employers, or numbers). For 'Role & Technical' questions, give a concise, correct model answer the candidate can adapt. " +
  "Also add a short one-sentence 'tip' on how to deliver the answer. " +
  "Finally, add 'tips': 4-6 concise, actionable 'before the interview' preparation tips tailored to this specific role and company. " +
  "Base technical questions on the ACTUAL skills/tools named in the job description. " +
  'Return ONLY JSON: {"questions":[{"category":string,"question":string,"answer":string,"tip":string}],"tips":[string]}.';

export function interviewUser(resume: ResumeData, input: { jd: string; role?: string }): string {
  return (
    `Target role: ${input.role || resume.target || "(infer from the job description)"}\n\n` +
    `Candidate résumé (use these real facts for 'From Your Résumé' + behavioral answers):\n${JSON.stringify(resumeContext(resume))}\n\n` +
    `Job description:\n${input.jd.slice(0, 2200)}`
  );
}

const CATEGORIES = ["From Your Résumé", "Role & Technical", "Behavioral", "Situational", "Motivation & Fit"];

/** Parse + normalize the model's interview-prep JSON into clean questions + tips. */
export function parseInterviewResult(raw: string): InterviewPrepResult {
  const parsed = JSON.parse(raw) as { questions?: unknown; tips?: unknown };
  const list = Array.isArray(parsed.questions) ? parsed.questions : [];
  const norm = (v: unknown) => (typeof v === "string" ? v.trim() : "");
  const bestCategory = (c: string) => {
    const lc = c.toLowerCase();
    return CATEGORIES.find((k) => lc.includes(k.toLowerCase().split(" ")[0] ?? "") || (/(résumé|resume|cv)/.test(lc) && k === "From Your Résumé")) || c || "General";
  };
  const questions = list
    .map((q) => {
      const o = (q && typeof q === "object" ? q : {}) as Record<string, unknown>;
      return { category: bestCategory(norm(o.category)), question: norm(o.question), answer: norm(o.answer), tip: norm(o.tip) };
    })
    .filter((q) => q.question);
  if (!questions.length) throw new Error("No interview questions returned");
  const tips = (Array.isArray(parsed.tips) ? parsed.tips : []).map(norm).filter(Boolean).slice(0, 6);
  return { questions, tips };
}
