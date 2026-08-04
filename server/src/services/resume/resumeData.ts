/* ============================================================
   Resume data model — the single source of truth a resume is
   rendered/exported from. Ported from the Resume AI app; the
   web editor and DOCX/ATS services all consume this shape.
   ============================================================ */

export type ResumeVariant =
  | "classic"
  | "modern"
  | "compact"
  | "executive"
  | "elegant"
  | "developer";

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
  /** Résumé-wide text scale (1 = template default), applied via --rfs. */
  fontScale?: number;
}

/** The empty shape a brand-new resume starts from. */
export const BLANK_RESUME: ResumeData = {
  name: "",
  target: "",
  contact: [""],
  summary: "",
  experience: [{ role: "", company: "", location: "", meta: "", bullets: [""] }],
  skills: [["", ""]],
  education: [{ degree: "", school: "", meta: "" }],
};

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
  const fontScale = Number.isFinite(rawScale) && rawScale > 0 ? Math.min(1.3, Math.max(0.85, rawScale)) : undefined;
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
