import { FileText, Target, Award, Globe, Bot, Sparkles, Mic } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export interface CareerTool {
  name: string;
  path: string;
  icon: LucideIcon;
  desc: string;
}

/**
 * The eight career tools, shared by the public nav dropdown and the home page
 * slider so the two can't drift apart.
 */
export const CAREER_TOOLS: CareerTool[] = [
  { name: 'AI Resume Builder', path: '/dashboard/tools/resume-builder', icon: FileText, desc: 'Live A4 WYSIWYG editor with inline AI bullet rewriter' },
  { name: 'ATS Score Checker', path: '/dashboard/tools/ats-checker', icon: Target, desc: '0-100% ATS match score ring & keyword audit' },
  { name: 'JD Resume Tailor', path: '/dashboard/tools/tailor-resume', icon: Award, desc: 'Compare resume vs JD & inject missing terms' },
  { name: 'LinkedIn Profile Analyser', path: '/dashboard/tools/linkedin-analyser', icon: Globe, desc: 'Profile SEO audit & AI recruiter headlines' },
  { name: 'Cover Letter Builder', path: '/dashboard/tools/cover-letter', icon: FileText, desc: '250-word role-tailored cover letters' },
  { name: 'Interview Prep Kit', path: '/dashboard/tools/interview-prep', icon: Bot, desc: '20 STAR-format model Q&A cards' },
  { name: 'Upload & Enhance', path: '/dashboard/tools/upload-enhance', icon: Sparkles, desc: 'Auto-parse PDF & enhance action verbs' },
  /* Phase 2 replaced the teleprompter placeholder with the full i-Assist
     suite, so the old "transcript & hint cards" copy no longer describes it. */
  { name: 'I-Assist', path: '/tools/i-assist', icon: Mic, desc: 'AI interview co-pilot with real-time answers' },
];
