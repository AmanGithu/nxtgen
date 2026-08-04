/* ============================================================
   Resume data model + seed content.
   Ported from the design bundle's resume.js (window.ARJUN).
   This is the single source of truth a <Resume /> renders from.
   ============================================================ */

export type ResumeVariant =
  | "classic"
  | "modern"
  | "compact"
  | "executive"
  | "elegant"
  | "developer"
  // two-column (Pro)
  | "sidebar"
  | "split"
  | "corporate"
  // single-column, filled header band (Pro)
  | "bold";

export interface ExperienceItem {
  role: string;
  company: string;
  location: string;
  meta: string;
  bullets: string[];
}

export interface EducationItem {
  degree: string;
  school: string;
  meta: string;
}

/** [label, value] pairs, e.g. ["Languages", "JavaScript, TypeScript"]. */
export type SkillGroup = [string, string];

export interface ProjectItem {
  name: string;
  meta?: string; // optional date / tag
  bullets?: string[];
  description?: string; // legacy single-paragraph form (migrated to a bullet)
}

export interface CertItem {
  name: string;
  issuer: string;
  meta: string;
}

/** A user-defined section (e.g. Hobbies, Awards) — a title + bullet lines. */
export interface CustomSection {
  id: string;
  title: string;
  items: string[];
}

/** The reorderable body sections (Contact is the fixed header). Custom
    sections are referenced as `custom:<id>`. */
export const DEFAULT_SECTION_ORDER = [
  "summary",
  "experience",
  "projects",
  "skills",
  "education",
  "certifications",
] as const;

export interface ResumeData {
  name: string;
  target: string;
  contact: string[];
  summary: string;
  experience: ExperienceItem[];
  skills: SkillGroup[];
  education: EducationItem[];
  // optional sections — older records may omit these
  projects?: ProjectItem[];
  certifications?: CertItem[];
  // user-defined sections + the order all body sections render in
  custom?: CustomSection[];
  sectionOrder?: string[];
  /** Résumé-wide text scale (1 = template default). Multiplies every font
      size via the --rfs CSS variable, so bigger text = more/fewer pages. */
  fontScale?: number;
}

/** Text-size presets exposed in the editor (label → multiplier). */
export const FONT_SCALE_MIN = 0.85;
export const FONT_SCALE_MAX = 1.3;
export const FONT_SCALE_STEP = 0.05;
export const clampFontScale = (n: number): number =>
  Math.min(FONT_SCALE_MAX, Math.max(FONT_SCALE_MIN, Math.round(n * 100) / 100));

/* ---------- sanitizer ----------
   LLM-structured (or hand-edited) data can have wrong-typed fields — e.g.
   `bullets` as a string instead of string[]. Coerce everything to the exact
   shape so the renderer/editor never crash on malformed records. */
const str = (v: unknown): string => (typeof v === "string" ? v : v == null ? "" : String(v));
const strArr = (v: unknown): string[] => {
  if (Array.isArray(v)) return v.map(str).filter((s) => s.trim().length > 0);
  if (typeof v === "string" && v.trim()) return [v];
  return [];
};
const obj = (v: unknown): Record<string, unknown> => (v && typeof v === "object" && !Array.isArray(v) ? (v as Record<string, unknown>) : {});

export function sanitizeResumeData(input: unknown): ResumeData {
  const d = obj(input);
  const experience = (Array.isArray(d.experience) ? d.experience : [])
    .map((raw) => {
      const e = obj(raw);
      return { role: str(e.role), company: str(e.company), location: str(e.location), meta: str(e.meta), bullets: strArr(e.bullets) };
    })
    // A real job has a role or a company. Drop entries with neither — LLM imports
    // sometimes emit phantom entries (e.g. a project's bullets with no title),
    // which would otherwise render as a junk "— / date" block.
    .filter((e) => e.role.trim() || e.company.trim());
  const skills = (Array.isArray(d.skills) ? d.skills : [])
    .map((raw): SkillGroup => (Array.isArray(raw) ? [str(raw[0]), str(raw[1])] : typeof raw === "string" ? ["Skills", raw] : ["", ""]))
    .filter(([l, v]) => l.trim() || v.trim());
  const education = (Array.isArray(d.education) ? d.education : [])
    .map((raw) => {
      const e = obj(raw);
      return { degree: str(e.degree), school: str(e.school), meta: str(e.meta) };
    })
    .filter((e) => e.degree.trim() || e.school.trim());
  const projects = (Array.isArray(d.projects) ? d.projects : []).map((raw) => {
    const p = obj(raw);
    const bullets = strArr(p.bullets);
    const description = str(p.description);
    // migrate the legacy single-paragraph form into a bullet
    if (!bullets.length && description) bullets.push(description);
    return { name: str(p.name), meta: str(p.meta), bullets };
  });
  const certifications = (Array.isArray(d.certifications) ? d.certifications : []).map((raw) => {
    const c = obj(raw);
    return { name: str(c.name), issuer: str(c.issuer), meta: str(c.meta) };
  });
  const contact = Array.isArray(d.contact) ? d.contact.map(str).filter((s) => s.trim()) : typeof d.contact === "string" && d.contact ? [d.contact] : [];
  const custom = (Array.isArray(d.custom) ? d.custom : [])
    .map((raw, i): CustomSection => {
      const c = obj(raw);
      return { id: str(c.id) || `custom-${i}`, title: str(c.title), items: strArr(c.items) };
    })
    .filter((c) => c.title.trim() || c.items.length);
  const sectionOrder = Array.isArray(d.sectionOrder)
    ? d.sectionOrder.map(str).filter(Boolean)
    : undefined;
  const rawScale = typeof d.fontScale === "number" ? d.fontScale : Number(d.fontScale);
  const fontScale = Number.isFinite(rawScale) && rawScale > 0 ? clampFontScale(rawScale) : undefined;
  return {
    name: str(d.name),
    target: str(d.target),
    contact,
    summary: str(d.summary),
    experience,
    skills,
    education,
    projects,
    certifications,
    custom,
    sectionOrder,
    fontScale,
  };
}

/** The full ordered list of body-section keys (standard + `custom:<id>`),
    reconciling any saved order with the sections that actually exist. */
export function resolveSectionOrder(d: ResumeData): string[] {
  const customKeys = (d.custom ?? []).map((c) => `custom:${c.id}`);
  const known = [...DEFAULT_SECTION_ORDER, ...customKeys];
  if (!d.sectionOrder || !d.sectionOrder.length) return known;
  const saved = d.sectionOrder.filter((k) => known.includes(k));
  const missing = known.filter((k) => !saved.includes(k)); // newly-added sections
  return [...saved, ...missing];
}

export const ARJUN: ResumeData = {
  name: "Arjun Mehta",
  target: "Senior Frontend Engineer",
  contact: [
    "arjun.mehta@gmail.com",
    "(415) 555-0142",
    "San Francisco, CA",
    "linkedin.com/in/arjunmehta",
  ],
  summary:
    "Frontend-focused software engineer with 4 years building fast, accessible web applications in React and TypeScript. Shipped a customer-facing dashboard used by 20,000+ users and cut page load time ~40% by reworking the rendering pipeline. Owns features end to end and mentors junior engineers.",
  experience: [
    {
      role: "Software Engineer",
      company: "Northwind Labs",
      location: "San Francisco, CA",
      meta: "May 2022 — Present",
      bullets: [
        "Built and shipped a customer-facing React dashboard now used by 20,000+ monthly active users, owning the work from design through release.",
        "Reworked the client rendering pipeline with code-splitting and memoization, cutting median page load time by ~40%.",
        "Mentored 2 junior engineers through code review and pairing, ramping both to independent feature ownership within a quarter.",
        "Established a component testing standard with Jest and React Testing Library, raising critical-path coverage to 85%.",
      ],
    },
    {
      role: "Frontend Engineer",
      company: "Brightside Software",
      location: "Remote",
      meta: "Jun 2021 — May 2022",
      bullets: [
        "Developed reusable UI components in React and TypeScript adopted across 4 product teams.",
        "Integrated REST APIs and hardened error handling, reducing client-side error rates by 30%.",
        "Partnered with design to ship a WCAG AA accessibility pass across the core product.",
      ],
    },
  ],
  skills: [
    ["Languages", "JavaScript, TypeScript, HTML, CSS"],
    ["Frameworks & Tools", "React, Node.js, REST APIs, Jest, React Testing Library"],
    ["Practices", "CI/CD, Automated testing, Accessibility, Performance optimization"],
  ],
  education: [
    {
      degree: "B.E., Computer Engineering",
      school: "Savitribai Phule Pune University",
      meta: "2017 — 2021",
    },
  ],
};
