import type { ResumeData, ExperienceItem, EducationItem, SkillGroup, CustomSection } from "./resumeData";

/* ============================================================
   Deterministic parser for LinkedIn "Save to PDF" exports.
   LinkedIn's PDF is a two-column layout flattened to text, so it
   looks nothing like a résumé:
     • left sidebar first: "Contact", "Top Skills", "Languages",
       "Certifications" — then the main column.
     • the NAME + headline + location sit (un-headed) right before
       "Summary".
     • Experience entries are Company → Title → Dates("… (N months)")
       → prose description (no bullet markers), and can split across
       page breaks.
     • Education entries are School → "Degree, Field · (dates)".
   We handle all of that here. Nothing is invented.
   ============================================================ */

const isFooter = (l: string) =>
  /^page\s+\d+\s+of\s+\d+$/i.test(l) || /^[-–—\s]*\d+\s+of\s+\d+[-–—\s]*$/.test(l) || /^[-–—\s]+$/.test(l);

// LinkedIn section headings (each on its own line)
const HEADINGS = /^(contact|top skills|skills|languages|certifications|honou?rs?[\s-]*(&|and)?[\s-]*awards?|summary|experience|education|volunteer(ing)?( experience)?|projects|publications|courses|organizations|interests|recommendations)$/i;
const SIDEBAR = /^(contact|top skills|skills|languages|certifications|honou?rs?[\s-]*(&|and)?[\s-]*awards?)$/i;

const DATE_RE = /((?:jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*\.?\s*)?\d{4}\s*[-–—]\s*(present|(?:(?:jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*\.?\s*)?\d{4})|(?:jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*\.?\s*\d{4}/i;
const isDateLine = (l: string) => DATE_RE.test(l) && /\d{4}/.test(l);
const stripDuration = (l: string) => l.replace(/\s*\(\d+\s*(mos?|months?|yrs?|years?)[^)]*\)\s*$/i, "").trim();

/** Rejoin PDF-wrapped lines: a line continues the previous one if the previous
    ends mid-word/phrase or the current starts lowercase / a digit-only tail. */
function joinWrapped(lines: string[]): string[] {
  const out: string[] = [];
  for (const raw of lines) {
    const line = raw.trim();
    if (!line) continue;
    const prev = out[out.length - 1];
    const cont =
      prev &&
      (/[,\-–—/(&]$/.test(prev) ||
        /^[a-z(]/.test(line) ||
        (/·\s*\($/.test(prev) === false && /·\s*\(/.test(prev) && !/\)$/.test(prev)) || // "…· (Nov 2022 - May" + "2026)"
        (/-$|–$|—$/.test(prev)));
    if (cont) out[out.length - 1] = /[-–—]$/.test(prev) ? prev + line : prev + " " + line;
    else out.push(line);
  }
  return out;
}

export function looksLikeLinkedIn(text: string): boolean {
  return /\(LinkedIn\)/.test(text) || /^Top Skills$/im.test(text) || (/^Contact$/im.test(text) && /Page \d+ of \d+/i.test(text));
}

export function parseLinkedInText(raw: string): ResumeData {
  const lines = raw.split(/\r?\n/).map((l) => l.replace(/\s+$/, "")).filter((l) => l.trim() && !isFooter(l.trim()));

  // index the heading lines
  const heads = lines.map((l, i) => ({ key: l.trim().toLowerCase(), i })).filter((h) => HEADINGS.test(h.key));
  const sectionOf = (idx: number): string[] => {
    const next = heads.find((h) => h.i > idx);
    return lines.slice(idx + 1, next ? next.i : lines.length);
  };
  const findHead = (re: RegExp) => heads.find((h) => re.test(h.key));
  const firstMain = heads.find((h) => !SIDEBAR.test(h.key)); // Summary/Experience/Education…

  const data: ResumeData = {
    name: "", target: "", contact: [], summary: "",
    experience: [], skills: [], education: [], projects: [], certifications: [], custom: [],
  };
  const order: string[] = [];

  // ---------- Contact ----------
  const contactH = findHead(/^contact$/);
  if (contactH) {
    const cl = sectionOf(contactH.i);
    for (let j = 0; j < cl.length; j++) {
      let c = (cl[j] ?? "").trim();
      if (/linkedin\.com|^www\./i.test(c)) {
        // LinkedIn URL often wraps: "www.linkedin.com/in/abhijeet-" + "mandal267 (LinkedIn)"
        if (/[-/]$/.test(c) && j + 1 < cl.length) { c += (cl[++j] ?? "").trim(); }
        c = c.replace(/\s*\(linkedin\)\s*$/i, "").trim();
      } else {
        c = c.replace(/\s*\((mobile|phone|work|home)\)\s*$/i, "").trim();
      }
      if (c) data.contact.push(c);
    }
  }

  // ---------- intro (name / headline / location) : tail of the section right before the first main heading ----------
  if (firstMain) {
    const prevSidebar = [...heads].filter((h) => h.i < firstMain.i).pop();
    if (prevSidebar) {
      const block = sectionOf(prevSidebar.i);
      if (block.length) {
        const location = block[block.length - 1];
        const body = block.slice(0, -1);
        const isHeadlineish = (l: string) => /\|/.test(l) || l.split(/\s+/).length > 5 || /\b(at|for)\b/i.test(l);
        let h = body.findIndex(isHeadlineish);
        if (h < 1) h = body.length; // no clear headline → treat all leading as sidebar, last as name
        const leading = body.slice(0, Math.max(0, h - 1)); // sidebar content (e.g. Top Skills)
        data.name = (body[Math.max(0, h - 1)] ?? "").trim();
        data.target = body.slice(h).join(" ").trim(); // headline → target role
        if (location && /,|\b(remote|india|states|kingdom|area)\b/i.test(location)) data.contact.push(location.trim());
        // leading lines belong to the sidebar section (Top Skills → skills)
        if (/top skills|^skills/i.test(prevSidebar.key) && leading.length) {
          data.skills.push(["Top Skills", leading.map((s) => s.trim()).filter(Boolean).join(", ")]);
        }
      }
    }
  }

  // ---------- Summary ----------
  const summaryH = findHead(/^summary$/);
  if (summaryH) { data.summary = joinWrapped(sectionOf(summaryH.i)).join(" ").trim(); if (data.summary) order.push("summary"); }

  // ---------- Experience ----------
  const expH = findHead(/^experience$/);
  if (expH) {
    const el = sectionOf(expH.i);
    const dateIdx = el.map((l, i) => (isDateLine(l) ? i : -1)).filter((i) => i >= 0);
    for (let k = 0; k < dateIdx.length; k++) {
      const d = dateIdx[k]!;
      const company = (el[d - 2] ?? "").trim();
      const role = (el[d - 1] ?? "").trim();
      const meta = stripDuration(el[d] ?? "");
      const descEnd = k + 1 < dateIdx.length ? dateIdx[k + 1]! - 2 : el.length;
      const bullets = joinWrapped(el.slice(d + 1, descEnd)).map((s) => s.trim()).filter(Boolean);
      const job: ExperienceItem = { role, company, location: "", meta, bullets };
      if (job.role || job.company) data.experience.push(job);
    }
    if (data.experience.length) order.push("experience");
  }

  // ---------- Education ----------
  const eduH = findHead(/^education$/);
  if (eduH) {
    const ed = joinWrapped(sectionOf(eduH.i));
    const eds: EducationItem[] = [];
    for (let j = 0; j < ed.length; j++) {
      const line = ed[j] ?? "";
      const next = ed[j + 1] ?? "";
      // an entry is: School line, then a "Degree · (dates)" line (starts with · or contains "· (")
      if (/·\s*\(/.test(next) || /^·\s*\(/.test(next)) {
        const m = next.match(/·\s*\(([^)]*)\)/);
        const degree = next.replace(/·\s*\([^)]*\).*$/, "").trim();
        eds.push({ degree, school: line.trim(), meta: (m?.[1] ?? "").trim() });
        j++;
      } else if (/·\s*\(/.test(line)) {
        // stray dates line without a preceding school — attach to last
        const m = line.match(/·\s*\(([^)]*)\)/);
        if (eds.length) eds[eds.length - 1]!.meta ||= (m?.[1] ?? "").trim();
      }
    }
    if (eds.length) { data.education = eds; order.push("education"); }
  }

  // ---------- sidebar Certifications / Languages / Honors ----------
  const certH = findHead(/^certifications$/);
  if (certH) {
    for (const c of joinWrapped(sectionOf(certH.i))) data.certifications!.push({ name: c.trim(), issuer: "", meta: "" });
    if (data.certifications!.length) order.push("certifications");
  }
  let customIdx = 0;
  for (const h of heads) {
    if (/^(languages|honou?rs?[\s-]*(&|and)?[\s-]*awards?|organizations|interests|publications|courses)$/i.test(h.key)) {
      const items = joinWrapped(sectionOf(h.i)).map((s) => s.trim()).filter(Boolean);
      if (items.length) {
        const id = `li-${customIdx++}`;
        const title = h.key.replace(/\b\w/g, (m) => m.toUpperCase());
        data.custom!.push({ id, title, items } as CustomSection);
        order.push(`custom:${id}`);
      }
    }
  }

  if (data.skills.length) order.push("skills");
  data.sectionOrder = order;
  return data;
}
