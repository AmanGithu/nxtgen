import { AIService } from "../aiProvider";
import { logger } from "../../lib/logger";
import { ResumeData } from "./resumeData";
import { extractKeywords, scoreResume } from "./ats";
import { MockProvider } from "./mockProvider";
import {
  AIProvider,
  BulletTone,
  Intensity,
  TailorSuggestion,
  CoverLetterInput,
  InterviewPrepResult,
  TokenUsage,
} from "./aiTypes";
import {
  COVER_LETTER_SYSTEM,
  coverLetterUser,
  INTERVIEW_SYSTEM,
  interviewUser,
  parseInterviewResult,
  cleanLetter,
} from "./prompts";

/* ============================================================
   Resume AI — prompt orchestration for rewrite/summary/tailor/
   import-structuring/cover-letter/interview-prep. All LLM calls
   go through the shared AIService proxy (OpenAI/Gemini/Ollama);
   on any failure the deterministic MockProvider takes over, so
   these features never hard-break.

   Config (.env):
     RESUME_AI_PROVIDER    ollama | openai | gemini | mock   (default: mock)
     RESUME_AI_MODEL       heavy model — tailoring, import parsing
     RESUME_AI_MODEL_FAST  fast model — bullet rewrites, summaries
   ============================================================ */

const DEFAULT_MODEL: Record<string, string> = {
  ollama: "llama3.1:8b",
  openai: "gpt-4o-mini",
  gemini: "gemini-3.5-flash-preview",
};

const TONE_INSTRUCTION: Record<BulletTone, string> = {
  stronger: "Rewrite it to be stronger: lead with an active verb, emphasize impact and ownership.",
  shorter: "Rewrite it to be more concise — one tight line, no filler.",
  metric: "Rewrite it to foreground a quantified metric. If the bullet has no real number, insert a clearly editable placeholder like [X%] or [N] rather than inventing a specific figure.",
};

/** Models sometimes wrap JSON in code fences or preamble — pull out the
    outermost object before parsing. */
function parseJsonLoose<T>(raw: string): T {
  const cleaned = raw.replace(/^```[a-z]*\s*|\s*```$/g, "").trim();
  try {
    return JSON.parse(cleaned) as T;
  } catch {
    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");
    if (start >= 0 && end > start) return JSON.parse(cleaned.slice(start, end + 1)) as T;
    throw new Error("Model did not return valid JSON");
  }
}

/** LLM-backed provider — same prompt/parsing logic as the Resume AI app's
    Ollama provider, but provider-agnostic via AIService. */
export class LlmProvider implements AIProvider {
  readonly name: string;
  lastUsage: TokenUsage | null = null;
  private ai = new AIService();
  private heavyModel: string;
  private fastModel: string;

  constructor(provider: string) {
    this.name = provider;
    this.heavyModel = process.env.RESUME_AI_MODEL || DEFAULT_MODEL[provider] || "";
    this.fastModel = process.env.RESUME_AI_MODEL_FAST || this.heavyModel;
  }

  private async chat(
    system: string,
    user: string,
    json = false,
    model = this.heavyModel,
    temperature = 0.4,
    label = "chat"
  ): Promise<string> {
    const res = await this.ai.query(
      this.name,
      model,
      [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      undefined,
      { json, temperature }
    );
    const usage = res.usage || { promptTokens: 0, completionTokens: 0, totalTokens: 0 };
    this.lastUsage = {
      inputTokens: usage.promptTokens,
      outputTokens: usage.completionTokens,
      totalTokens: usage.totalTokens,
      model,
    };
    logger.debug(`[resume-ai] ${label} provider=${this.name} model=${model} tokens=${usage.totalTokens}`);
    const content = (res.answer || "").trim();
    if (!content) throw new Error(`${this.name} returned empty content`);
    return content;
  }

  async rewriteBullet(bullet: string, tone: BulletTone): Promise<string> {
    const out = await this.chat(
      "You are a resume editor. Rewrite the single bullet point you are given. Reply with ONLY the rewritten bullet — one line, no quotes, no preamble, no markdown.",
      `${TONE_INSTRUCTION[tone]}\n\nBullet:\n${bullet}`,
      false,
      this.fastModel,
      0.4,
      "rewriteBullet"
    );
    return out.replace(/^["'\s-]+|["'\s]+$/g, "");
  }

  async generateSummary(resume: ResumeData, jd?: string): Promise<string> {
    const ctx = {
      target: resume.target,
      skills: resume.skills.map((s) => s[1]).join("; "),
      highlights: resume.experience.flatMap((e) => e.bullets).slice(0, 4),
    };
    const out = await this.chat(
      "You write concise, professional resume summaries (2-3 sentences, first person implied, no clichés). Reply with ONLY the summary text.",
      `Write a resume summary for this candidate.\n${JSON.stringify(ctx)}${
        jd ? `\n\nTailor it toward this job description:\n${jd.slice(0, 1500)}` : ""
      }`,
      false,
      this.fastModel,
      0.4,
      "generateSummary"
    );
    return out.replace(/^["'\s]+|["'\s]+$/g, "");
  }

  async structureResume(rawText: string, sourceHint?: string): Promise<ResumeData> {
    const system =
      "You are a resume parser. Your ONLY job is to SORT the resume's existing text into structured JSON fields. You are NOT a writer or editor. " +
      "VERBATIM RULE (critical): copy the candidate's wording EXACTLY. Do NOT reword, rewrite, rephrase, summarize, shorten, expand, embellish, translate, or fix grammar/spelling. Every summary line, bullet, and value must be the candidate's original text, character-for-character. The only edit allowed is rejoining a single sentence that PDF extraction split across lines (un-wrap it). " +
      "Sort into: \"experience\" = jobs only (role, company, location, meta=dates, bullets=that job's lines copied verbatim); \"education\" = schools/degrees; \"skills\" = [category, comma-separated values] pairs; \"projects\" = projects (name, description); \"certifications\" = licenses/certs. " +
      "CRITICAL placement: a job goes ONLY in experience; a project goes ONLY in projects — NEVER put the same content in two places, and never emit an experience entry without a role or company. Include EVERY distinct item exactly once — do not merge, skip, or duplicate. " +
      "Do not invent anything not present in the text. " +
      'Return ONLY JSON of this exact shape: {"name":string,"target":string,"contact":string[],"summary":string,"experience":[{"role":string,"company":string,"location":string,"meta":string,"bullets":string[]}],"skills":[[string,string]],"education":[{"degree":string,"school":string,"meta":string}],"projects":[{"name":string,"description":string}],"certifications":[{"name":string,"issuer":string,"meta":string}]}';
    const user =
      rawText.slice(0, 12000) +
      (sourceHint ? `\n\n(Note: the text above is a ${sourceHint}; ignore page numbers, repeated headers/footers and navigation artifacts.)` : "");
    const raw = await this.chat(system, user, true, this.heavyModel, 0.2, "structureResume");
    const data = parseJsonLoose<ResumeData>(raw);
    if (!data.name) throw new Error(`${this.name} returned unstructured resume`);
    // normalize possibly-missing arrays
    data.contact = Array.isArray(data.contact) ? data.contact : [];
    data.experience = Array.isArray(data.experience) ? data.experience : [];
    data.skills = Array.isArray(data.skills) ? data.skills : [];
    data.education = Array.isArray(data.education) ? data.education : [];
    data.projects = Array.isArray(data.projects) ? data.projects : [];
    data.certifications = Array.isArray(data.certifications) ? data.certifications : [];

    // small models occasionally repeat entries — drop exact/near duplicates
    const dedupe = <T>(arr: T[], key: (x: T) => string): T[] => {
      const seen = new Set<string>();
      return arr.filter((x) => {
        const k = key(x).toLowerCase().replace(/\s+/g, " ").trim();
        if (!k || seen.has(k)) return false;
        seen.add(k);
        return true;
      });
    };
    data.experience = dedupe(data.experience, (e) => `${e.role}|${e.company}|${e.meta}`);
    data.projects = dedupe(data.projects!, (p) => p.name);
    data.education = dedupe(data.education, (e) => `${e.degree}|${e.school}`);
    data.certifications = dedupe(data.certifications!, (c) => `${c.name}|${c.issuer}`);
    // fall back to the most recent role as the target title when none was found
    if (!data.target?.trim() && data.experience[0]?.role) data.target = data.experience[0].role;

    // normalize skills: merge same-label categories, and fold bare single
    // skills (e.g. LinkedIn "Top Skills" — one per line) into one group
    const grouped = new Map<string, [string, string]>();
    const bare: string[] = [];
    for (const pair of data.skills) {
      if (!Array.isArray(pair)) continue;
      const label = String(pair[0] ?? "").trim();
      const val = String(pair[1] ?? "").trim();
      if (label && val) {
        const key = label.toLowerCase();
        const ex = grouped.get(key);
        if (ex) ex[1] = [ex[1], val].filter(Boolean).join(", ");
        else grouped.set(key, [label, val]);
      } else if (label) {
        bare.push(label);
      }
    }
    const skills = [...grouped.values()];
    if (bare.length) {
      const g = skills.find(([k]) => /skill|tool|tech/i.test(k));
      const uniqBare = [...new Set(bare)];
      if (g) g[1] = [g[1], ...uniqBare].filter(Boolean).join(", ");
      else skills.unshift(["Skills", uniqBare.join(", ")]);
    }
    if (skills.length) data.skills = skills;
    return data;
  }

  async coverLetter(resume: ResumeData, input: CoverLetterInput): Promise<string> {
    const out = await this.chat(COVER_LETTER_SYSTEM, coverLetterUser(resume, input), false, this.heavyModel, 0.6, "coverLetter");
    return cleanLetter(out);
  }

  async interviewPrep(resume: ResumeData, input: { jd: string; role?: string }): Promise<InterviewPrepResult> {
    const raw = await this.chat(INTERVIEW_SYSTEM, interviewUser(resume, input), true, this.heavyModel, 0.5, "interviewPrep");
    return parseInterviewResult(raw);
  }

  async tailor(resume: ResumeData, jd: string, intensity: Intensity): Promise<TailorSuggestion[]> {
    // The keyword/score signal is deterministic; ask the model only for wording.
    const keywords = extractKeywords(jd);
    const { missing } = scoreResume(resume, keywords);

    const system =
      'You tailor a resume to a job description. Return ONLY a JSON object: {"suggestions": Suggestion[]} with exactly 3 or 4 items. ' +
      'Suggestion = {"kind":"edit"|"add", "section":"Summary"|"Experience"|"Skills", "note": string, "before"?: string, "after"?: string, "add"?: string}. ' +
      'For kind "edit": "before" MUST be a sentence copied verbatim from the resume, and "after" is the improved version. ' +
      'For kind "add": "add" is one new line of text. ' +
      'Each suggestion MUST surface at least one of the listed missing keywords inside its after/add text, and the "note" (under 100 chars) must accurately describe that exact change — never name a keyword in the note unless it appears in the after/add text. Never invent facts that are not in the resume.';
    const user =
      `Intensity: ${intensity}\n` +
      `Missing keywords to surface: ${missing.map((m) => m.label).join(", ") || "(none)"}\n\n` +
      `Resume:\n${JSON.stringify({ summary: resume.summary, experience: resume.experience.map((e) => ({ role: e.role, company: e.company, bullets: e.bullets })), skills: resume.skills })}\n\n` +
      `Job description:\n${jd.slice(0, 1800)}`;

    const raw = await this.chat(system, user, true, this.heavyModel, 0.4, "tailor");
    type RawSug = { kind?: string; section?: string; loc?: string; note?: string; before?: string; after?: string; add?: string };
    const parsed = parseJsonLoose<{ suggestions?: RawSug[] }>(raw);
    const list = parsed.suggestions ?? [];
    if (!list.length) throw new Error(`${this.name} returned no suggestions`);

    const SECTIONS = ["Summary", "Experience", "Skills", "Education", "Projects"];
    const normSection = (s: RawSug): string => {
      const rawSec = (s.section || s.loc || "").toString();
      const hit = SECTIONS.find((sec) => rawSec.toLowerCase().includes(sec.toLowerCase()));
      if (hit) return hit;
      if (s.kind === "add" && !s.add?.includes(" ")) return "Skills";
      return "Experience";
    };

    // small models occasionally return arrays or misplace fields — coerce
    const str = (v: unknown): string =>
      Array.isArray(v) ? v.map(String).join(", ") : typeof v === "string" ? v : "";

    return list.slice(0, 4).map((s, i) => {
      const kind = s.kind === "add" ? "add" : "edit";
      const before = str(s.before);
      const after = str(s.after);
      const add = str(s.add) || (kind === "add" ? after : "");
      const text = (kind === "add" ? add : after).toLowerCase();
      const kws = missing
        .filter((m) => text.includes(m.label.toLowerCase().split(" ")[0] ?? ""))
        .slice(0, 2)
        .map((m) => [m.label, m.prio] as [string, "high" | "med"]);
      return {
        id: `s${i}`,
        kind,
        loc: normSection(s),
        note: s.note || "Improves alignment with the job description.",
        before: kind === "edit" ? before : undefined,
        after: kind === "edit" ? after : undefined,
        add: kind === "add" ? add : undefined,
        keywords: kws,
        delta: kws.reduce((d, [, p]) => d + (p === "high" ? 4 : 2), 0) || 4,
      } as TailorSuggestion;
    });
  }
}

export const mockProvider = new MockProvider();

/** The configured provider: RESUME_AI_PROVIDER=ollama|openai|gemini uses the
    shared AI proxy; anything else (or unset) uses the deterministic mock. */
export function getResumeAiProvider(): AIProvider {
  const provider = (process.env.RESUME_AI_PROVIDER || "mock").toLowerCase();
  if (provider === "ollama" || provider === "openai" || provider === "gemini") {
    return new LlmProvider(provider);
  }
  return mockProvider;
}

export interface UsageMeta extends TokenUsage {}

/** Run an AI call with automatic fallback to the mock provider. Returns the
    result plus the token usage of the call. */
export async function withFallback<T>(
  fn: (p: AIProvider) => Promise<T>
): Promise<{ result: T; usage: UsageMeta | null }> {
  const run = async (p: AIProvider) => {
    const result = await fn(p);
    return { result, usage: p.lastUsage ?? null };
  };
  const provider = getResumeAiProvider();
  if (provider.name === "mock") return run(provider);
  try {
    return await run(provider);
  } catch (e) {
    logger.warn(`[resume-ai] ${provider.name} failed, using mock fallback: ${e instanceof Error ? e.message : e}`);
    return run(mockProvider);
  }
}
