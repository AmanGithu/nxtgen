import { ResumeRepository } from '../repositories/resumeRepository';
import { BillingService } from './billingService';
import { logger } from '../lib/logger';
import {
  ResumeData,
  ResumeVariant,
  BLANK_RESUME,
  sanitizeResumeData,
} from './resume/resumeData';
import { extractPdfText, extractDocxText } from './resume/textExtract';
import { parseResumeText } from './resume/parseResume';
import { parseLinkedInText, looksLikeLinkedIn } from './resume/parseLinkedIn';
import { extractKeywords, scoreResume, scoreReadiness, type Prio } from './resume/ats';
import { withFallback, type UsageMeta } from './resume/resumeAiService';
import type { BulletTone, Intensity, TailorSuggestion, CoverLetterInput, CoverLetterTone, InterviewQuestion } from './resume/aiTypes';
import { buildDocx, buildCoverLetterDocx } from './resume/docxExport';
import { buildResumePdf, buildCoverLetterPdf } from './resume/pdfExport';

const resumeRepository = new ResumeRepository();
const billingService = new BillingService();

// Flat per-call cost for generative (LLM) resume features. Deterministic
// parsing/scoring/export stays free — only actual model calls are metered.
const AI_ACTION_COST = 1;

function parseData(json: string): ResumeData {
  return sanitizeResumeData(JSON.parse(json));
}

export interface DashVariant {
  id: string; role: string; company: string; ats: number; template: string; updatedAt: Date;
}
export interface DashResume {
  id: string; title: string; template: string; updatedAt: Date; variants: DashVariant[];
}

export class ResumeService {
  async listResumes(userId: string): Promise<DashResume[]> {
    const rows = await resumeRepository.findByUserId(userId);
    return rows.map((r) => ({
      id: r.id,
      title: r.title,
      template: r.template,
      updatedAt: r.updatedAt,
      variants: r.versions.map((v) => ({
        id: v.id, role: v.role, company: v.company, ats: v.ats, template: v.template, updatedAt: v.updatedAt,
      })),
    }));
  }

  async getResume(id: string, userId: string) {
    const r = await resumeRepository.findById(id, userId);
    if (!r) return null;
    return { id: r.id, title: r.title, template: r.template as ResumeVariant, data: parseData(r.data) };
  }

  /** Deterministic, job-agnostic resume quality score (0-100) + tips —
      no AI, no credit charge. Used by the editor's completeness indicator. */
  async getReadiness(id: string, userId: string) {
    const r = await resumeRepository.findById(id, userId);
    if (!r) return null;
    return scoreReadiness(parseData(r.data));
  }

  async getVersion(id: string, userId: string) {
    const v = await resumeRepository.findVersionById(id, userId);
    if (!v) return null;
    return {
      id: v.id, role: v.role, company: v.company, ats: v.ats,
      template: v.template as ResumeVariant, data: parseData(v.data),
    };
  }

  async getLatestTailorContext(resumeId: string, userId: string) {
    const v = await resumeRepository.findLatestVersionWithJd(resumeId, userId);
    if (!v || !v.jdText) return null;
    return { jd: v.jdText, role: v.role, company: v.company, ats: v.ats };
  }

  /**
   * Create a résumé, optionally seeded with content.
   *
   * The seed path is what the guest→account migration uses: a visitor's work
   * is posted here on sign-in, so ignoring the body would silently discard
   * everything they built before signing up.
   */
  async createResume(
    userId: string,
    seed?: { title?: string; template?: string; data?: unknown },
    tx?: any
  ) {
    return resumeRepository.create(userId, {
      title: seed?.title?.trim() || 'Untitled resume',
      template: seed?.template || 'classic',
      data: JSON.stringify(seed?.data ? sanitizeResumeData(seed.data as any) : BLANK_RESUME),
    }, tx);
  }

  async duplicateResume(id: string, userId: string) {
    const r = await resumeRepository.findById(id, userId);
    if (!r) return null;
    const title = r.title.includes(' — base resume')
      ? r.title.replace(' — base resume', ' (copy) — base resume')
      : `${r.title} (copy)`;
    return resumeRepository.create(userId, { title, template: r.template, data: r.data });
  }

  /** Returns false when nothing matched — a wrong id, or someone else's. */
  async deleteResume(id: string, userId: string): Promise<boolean> {
    const { count } = await resumeRepository.delete(id, userId);
    return count > 0;
  }

  async renameResume(id: string, userId: string, title: string) {
    await resumeRepository.update(id, userId, { title });
  }

  async updateResume(id: string, userId: string, patch: { data?: ResumeData; template?: string; title?: string }): Promise<boolean> {
    const { count } = await resumeRepository.update(id, userId, {
      ...(patch.data ? { data: JSON.stringify(patch.data) } : {}),
      ...(patch.template ? { template: patch.template } : {}),
      ...(patch.title ? { title: patch.title } : {}),
    });
    return count > 0;
  }

  async updateVersion(id: string, userId: string, patch: { data?: ResumeData; template?: string }) {
    await resumeRepository.updateVersion(id, userId, {
      ...(patch.data ? { data: JSON.stringify(patch.data) } : {}),
      ...(patch.template ? { template: patch.template } : {}),
    });
  }

  async duplicateVersion(id: string, userId: string) {
    const v = await resumeRepository.findVersionById(id, userId);
    if (!v) return null;
    return resumeRepository.createVersion({
      resumeId: v.resumeId, role: `${v.role} (copy)`, company: v.company, ats: v.ats,
      template: v.template, data: v.data, jdText: v.jdText ?? undefined, jdKeywords: v.jdKeywords ?? undefined,
    });
  }

  async deleteVersion(id: string, userId: string) {
    await resumeRepository.deleteVersion(id, userId);
  }

  /** Deterministic (AI-free) import: PDF/DOCX text extraction + section-aware
      parsing. Imports the resume exactly as written. */
  async importResume(userId: string, file: Buffer, fileName: string, mimeType: string, isLinkedIn: boolean) {
    const lower = fileName.toLowerCase();
    let text = '';
    try {
      text = lower.endsWith('.pdf') || mimeType === 'application/pdf'
        ? await extractPdfText(file)
        : await extractDocxText(file);
    } catch (e: any) {
      logger.warn(`Resume import: text extraction failed for ${fileName}: ${e.message}`);
    }

    const useLinkedIn = isLinkedIn || (text.trim() ? looksLikeLinkedIn(text) : false);
    const parsed = !text.trim() ? {} : useLinkedIn ? parseLinkedInText(text) : parseResumeText(text);
    const data = sanitizeResumeData(parsed);

    const suffix = isLinkedIn ? 'LinkedIn import' : 'imported';
    const title = data.name ? `${data.name} — ${suffix}` : isLinkedIn ? 'LinkedIn import' : 'Imported resume';
    return resumeRepository.create(userId, { title, template: 'classic', data: JSON.stringify(data) });
  }

  async rewriteBullet(userId: string, bullet: string, tone: BulletTone): Promise<{ text: string; usage: UsageMeta | null }> {
    await billingService.chargeCredits(userId, AI_ACTION_COST, 'resume_ai_rewrite');
    const { result, usage } = await withFallback((p) => p.rewriteBullet(bullet, tone));
    return { text: result, usage };
  }

  async generateSummary(userId: string, resume: ResumeData, jd?: string): Promise<{ text: string; usage: UsageMeta | null }> {
    await billingService.chargeCredits(userId, AI_ACTION_COST, 'resume_ai_summary');
    const { result, usage } = await withFallback((p) => p.generateSummary(resume, jd));
    return { text: result, usage };
  }

  /** Deterministic keyword match of a resume against a pasted JD — same
      scoring engine as tailor(), but no AI call, so it's free to run live
      as the user types (powers the editor's ATS-vs-JD panel). */
  async matchAgainstJd(resumeId: string, userId: string, jd: string) {
    const r = await resumeRepository.findById(resumeId, userId);
    if (!r) return null;
    const resume = parseData(r.data);
    const keywords = extractKeywords(jd);
    const { score, matched, total, missing } = scoreResume(resume, keywords);
    return { score, matched, total, missing };
  }

  async runTailor(userId: string, resumeId: string, jd: string, intensity: Intensity) {
    const r = await resumeRepository.findById(resumeId, userId);
    if (!r) throw new Error('Resume not found');
    const resume = parseData(r.data);
    const keywords = extractKeywords(jd);
    const { score: baseScore, matched: baseMatched, missing } = scoreResume(resume, keywords);

    await billingService.chargeCredits(userId, AI_ACTION_COST, 'resume_ai_tailor');
    const { result: suggestions, usage } = await withFallback((p) => p.tailor(resume, jd, intensity));

    const inSuggestions = new Set(suggestions.flatMap((s) => s.keywords.map(([l]) => l)));
    const remaining = missing.filter((m) => !inSuggestions.has(m.label));
    if (remaining.length) {
      suggestions.push({
        id: 'surface-skills',
        kind: 'add',
        loc: 'Skills',
        note: 'Surface the remaining job keywords in your Skills — keep only the ones you genuinely have.',
        add: `Add to Skills: ${remaining.map((k) => k.label).join(', ')}`,
        keywords: remaining.map((k) => [k.label, k.prio] as [string, Prio]),
        delta: remaining.reduce((d, k) => d + (k.prio === 'high' ? 4 : 2), 0),
      });
    }

    const deltaSum = suggestions.reduce((d, s) => d + s.delta, 0);
    const target = Math.min(96, baseScore + deltaSum);

    return { suggestions, baseScore, target, total: keywords.length, baseMatched, usage };
  }

  private static normalizeText(s: string) {
    return s.toLowerCase().replace(/\s+/g, ' ').trim();
  }

  private applyToData(base: ResumeData, accepted: TailorSuggestion[]): ResumeData {
    const norm = ResumeService.normalizeText;
    const data = structuredClone(base);
    if (!data.experience.length) data.experience.push({ role: '', company: '', location: '', meta: '', bullets: [] });
    const addedSkills: string[] = [];

    for (const s of accepted) {
      const isSummary = /summary/i.test(s.loc);
      const isSkills = /skill/i.test(s.loc);

      if (isSummary && s.after) {
        data.summary = s.after;
      } else if (isSkills) {
        addedSkills.push(...s.keywords.map(([l]) => l));
      } else if (s.kind === 'add' && s.add) {
        data.experience[0]!.bullets.push(s.add);
      } else if (s.kind === 'edit' && s.after && s.before) {
        const want = norm(s.before);
        for (const job of data.experience) {
          let i = job.bullets.findIndex((b) => norm(b) === want);
          if (i < 0) i = job.bullets.findIndex((b) => norm(b).includes(want) || want.includes(norm(b)));
          if (i >= 0) { job.bullets[i] = s.after; break; }
        }
      }
    }

    if (addedSkills.length) {
      const uniq = [...new Set(addedSkills)];
      const group = data.skills.find(([k]) => /tool|framework|devops|cloud|tech|skill/i.test(k));
      if (group) {
        const existing = norm(group[1]);
        const fresh = uniq.filter((k) => !existing.includes(norm(k)));
        if (fresh.length) group[1] = group[1] ? `${group[1]}, ${fresh.join(', ')}` : fresh.join(', ');
      } else {
        data.skills.push(['Additional', uniq.join(', ')]);
      }
    }
    return data;
  }

  async applyTailoredVersion(userId: string, args: {
    resumeId: string; jd: string; role: string; company: string; score: number; accepted: TailorSuggestion[];
  }) {
    const r = await resumeRepository.findById(args.resumeId, userId);
    if (!r) return null;
    const base = parseData(r.data);
    const data = this.applyToData(base, args.accepted);
    const keywords = extractKeywords(args.jd).map((k) => k.label);

    return resumeRepository.createVersion({
      resumeId: r.id,
      role: args.role || data.target || 'Tailored role',
      company: args.company || 'Target company',
      template: r.template,
      data: JSON.stringify(data),
      ats: args.score,
      jdText: args.jd,
      jdKeywords: JSON.stringify(keywords),
    });
  }

  async getCoverLetter(resumeId: string, userId: string) {
    const cl = await resumeRepository.findCoverLetter(resumeId, userId);
    if (!cl) return null;
    return { company: cl.company, role: cl.role, manager: cl.manager, tone: cl.tone as CoverLetterTone, jd: cl.jd, body: cl.body };
  }

  async generateCoverLetter(userId: string, resumeId: string, input: CoverLetterInput) {
    const r = await resumeRepository.findById(resumeId, userId);
    if (!r) throw new Error('Resume not found');
    const data = parseData(r.data);

    await billingService.chargeCredits(userId, AI_ACTION_COST, 'resume_ai_cover_letter');
    const { result: body, usage } = await withFallback((p) => p.coverLetter(data, input));
    await resumeRepository.upsertCoverLetter(resumeId, {
      company: input.company ?? '', role: input.role ?? '', manager: input.hiringManager ?? '',
      tone: input.tone ?? 'professional', jd: input.jd ?? '', body,
    });
    return { body, usage };
  }

  async saveCoverLetter(userId: string, resumeId: string, rec: { company: string; role: string; manager: string; tone: string; jd: string; body: string }) {
    const owned = await resumeRepository.findById(resumeId, userId);
    if (!owned) throw new Error('Resume not found');
    await resumeRepository.upsertCoverLetter(resumeId, rec);
  }

  async getInterviewPrep(resumeId: string, userId: string) {
    const ip = await resumeRepository.findInterviewPrep(resumeId, userId);
    if (!ip) return null;
    let questions: InterviewQuestion[] = [];
    let tips: string[] = [];
    try {
      const parsed = JSON.parse(ip.questions);
      if (Array.isArray(parsed)) questions = parsed;
      else { questions = parsed.questions ?? []; tips = parsed.tips ?? []; }
    } catch { /* leave empty */ }
    return { role: ip.role, jd: ip.jd, questions, tips };
  }

  async generateInterviewPrep(userId: string, resumeId: string, input: { jd: string; role?: string }) {
    const r = await resumeRepository.findById(resumeId, userId);
    if (!r) throw new Error('Resume not found');
    if (!input.jd.trim()) return { questions: [], tips: [], usage: null as UsageMeta | null };
    const data = parseData(r.data);

    await billingService.chargeCredits(userId, AI_ACTION_COST, 'resume_ai_interview_prep');
    const { result, usage } = await withFallback((p) => p.interviewPrep(data, input));
    await resumeRepository.upsertInterviewPrep(resumeId, { role: input.role ?? '', jd: input.jd, questions: JSON.stringify(result) });
    return { questions: result.questions, tips: result.tips, usage };
  }

  async exportResumeDocx(resumeId: string, userId: string): Promise<{ buffer: Buffer; fileName: string } | null> {
    const r = await resumeRepository.findById(resumeId, userId);
    if (!r) return null;
    const buffer = await buildDocx(parseData(r.data));
    return { buffer, fileName: `${(r.title || 'resume').replace(/[^\w-]+/g, '_')}.docx` };
  }

  async exportVersionDocx(versionId: string, userId: string): Promise<{ buffer: Buffer; fileName: string } | null> {
    const v = await resumeRepository.findVersionById(versionId, userId);
    if (!v) return null;
    const buffer = await buildDocx(parseData(v.data));
    return { buffer, fileName: `${(v.role || 'resume').replace(/[^\w-]+/g, '_')}.docx` };
  }

  async exportCoverLetterDocx(resumeId: string, userId: string): Promise<{ buffer: Buffer; fileName: string } | null> {
    const r = await resumeRepository.findById(resumeId, userId);
    const cl = await resumeRepository.findCoverLetter(resumeId, userId);
    if (!r || !cl) return null;
    const data = parseData(r.data);
    const buffer = await buildCoverLetterDocx({ name: data.name, contact: data.contact, body: cl.body });
    return { buffer, fileName: `${(data.name || 'cover_letter').replace(/[^\w-]+/g, '_')}_cover_letter.docx` };
  }

  async exportResumePdf(resumeId: string, userId: string): Promise<{ buffer: Buffer; fileName: string } | null> {
    const r = await resumeRepository.findById(resumeId, userId);
    if (!r) return null;
    const buffer = await buildResumePdf(parseData(r.data), r.template);
    return { buffer, fileName: `${(r.title || 'resume').replace(/[^\w-]+/g, '_')}.pdf` };
  }

  async exportVersionPdf(versionId: string, userId: string): Promise<{ buffer: Buffer; fileName: string } | null> {
    const v = await resumeRepository.findVersionById(versionId, userId);
    if (!v) return null;
    const buffer = await buildResumePdf(parseData(v.data), v.template);
    return { buffer, fileName: `${(v.role || 'resume').replace(/[^\w-]+/g, '_')}.pdf` };
  }

  async exportCoverLetterPdf(resumeId: string, userId: string): Promise<{ buffer: Buffer; fileName: string } | null> {
    const r = await resumeRepository.findById(resumeId, userId);
    const cl = await resumeRepository.findCoverLetter(resumeId, userId);
    if (!r || !cl) return null;
    const data = parseData(r.data);
    const buffer = await buildCoverLetterPdf({ name: data.name, contact: data.contact, body: cl.body });
    return { buffer, fileName: `${(data.name || 'cover_letter').replace(/[^\w-]+/g, '_')}_cover_letter.pdf` };
  }
}
