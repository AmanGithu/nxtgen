import type { ResumeData, ExperienceItem, EducationItem, ProjectItem, SkillGroup, CustomSection } from "./resumeData";

/* ============================================================
   Deterministic resume parser — NO AI.
   Splits extracted text by its actual section headings, keeps
   the original section ORDER, and never invents, drops, reorders,
   or rewords content. Headings we recognise map to structured
   fields; anything else becomes a custom section with its own
   title. Wrapped lines (from PDF extraction) are rejoined.
   ============================================================ */

const BULLET_RE = /^[•▪◦●‣·*–—-]\s+/;
const stripBullet = (s: string) => s.replace(BULLET_RE, "").trim();

// trailing date / date-range, e.g. "Jan 2026 – Present", "2022 – 2026", "May 2026"
const MON = "(?:jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec|january|february|march|april|may|june|july|august|september|october|november|december)";
const ONE_DATE = `(?:${MON}\\.?\\s*)?\\d{4}|present|current|ongoing`;
const DATE_RE = new RegExp(`\\s+((?:${ONE_DATE})(?:\\s*[\\u2013\\u2014\\-]+\\s*(?:${ONE_DATE}))?)\\s*$`, "i");

function splitTrailingDate(text: string): { head: string; date: string } {
  const m = text.match(DATE_RE);
  if (m && m.index !== undefined && m.index > 3) {
    return { head: text.slice(0, m.index).trim(), date: (m[1] ?? "").trim() };
  }
  return { head: text.trim(), date: "" };
}

/** Recognised section headings → structured field. */
const STD_HEADINGS: [RegExp, "summary" | "experience" | "education" | "skills" | "projects" | "certifications"][] = [
  [/^(career\s+|professional\s+)?(summary|profile|objective|about(\s+me)?)$/i, "summary"],
  [/^(work\s+|professional\s+|employment\s+)?(experience|history)$/i, "experience"],
  [/^employment(\s+history)?$/i, "experience"],
  [/^education(\s+(&|and)\s+training)?$/i, "education"],
  [/^(technical\s+|core\s+|key\s+)?(skills|expertise|competencies)$/i, "skills"],
  [/^(personal\s+|key\s+|selected\s+|notable\s+|academic\s+)?projects$/i, "projects"],
  [/^(certifications?|licen[sc]es?|certifications?\s*(&|and)\s*licen[sc]es?|licen[sc]es?\s*(&|and)\s*certifications?)$/i, "certifications"],
];
/* Extra headings that are real sections but have no structured field → custom.
   One vocabulary entry per concept; compound headings are handled below. */
const CUSTOM_HEADING_WORD =
  /^(awards?|honou?rs?|achievements?|accomplishments?|competitions?|contests?|publications?|patents?|volunteer(ing)?(\s+experience)?|interests?|hobbies|languages?|references?|activities|leadership|positions?\s+of\s+responsibility|extra[\s-]?curriculars?(\s+activities)?|courses?|coursework|certificates?|training|memberships?|affiliations?)$/i;

/* Section headings are routinely compound — "COMPETITIONS / ACHIEVEMENTS",
   "AWARDS & HONORS", "ACTIVITIES AND LEADERSHIP". Split on the usual joiners
   and accept only when EVERY part is a known section word; requiring all parts
   keeps ordinary prose (and skill lines like "React / Next.js") out. */
function isCustomHeading(t: string): boolean {
  const parts = t
    .split(/\s*(?:[/&|,+]|\band\b)\s*/i)
    .map((s) => s.trim())
    .filter(Boolean);
  return parts.length > 0 && parts.length <= 3 && parts.every((p) => CUSTOM_HEADING_WORD.test(p));
}

type Heading = { kind: "std"; type: string } | { kind: "custom"; title: string } | null;

function detectHeading(line: string): Heading {
  // tolerate markdown-style "# Heading" prefixes some exporters add
  const t = line.replace(/^#{1,6}\s+/, "").replace(/[:：]\s*$/, "").trim();
  if (!t || t.length > 42 || BULLET_RE.test(line)) return null;
  for (const [re, type] of STD_HEADINGS) if (re.test(t)) return { kind: "std", type };
  // std is checked first, so a plain "Certifications" still maps to its field
  if (isCustomHeading(t)) return { kind: "custom", title: t };
  return null;
}

const isPageArtifact = (l: string) => /^[-–—\s]*\d+\s+of\s+\d+[-–—\s]*$/i.test(l) || /^page\s+\d+/i.test(l) || /^[-–—\s]+$/.test(l);

type LL = { text: string; bullet: boolean };

/** Rejoin PDF-wrapped lines into logical lines, flagging bullets. */
function logicalLines(lines: string[]): LL[] {
  const out: LL[] = [];
  for (const raw of lines) {
    const line = raw.trim();
    if (!line) continue;
    const bullet = BULLET_RE.test(line);
    const prev = out[out.length - 1];
    const isContinuation = prev && !bullet && (/[,–—/(&-]$/.test(prev.text) || /^[a-z(]/.test(line));
    if (isContinuation) {
      // soft word-wrap: keep a real hyphen (open-source) but don't add a space
      prev.text = /[-]$/.test(prev.text) ? prev.text + line : prev.text + " " + line;
    } else {
      out.push({ text: bullet ? stripBullet(line) : line, bullet });
    }
  }
  return out;
}

const SENTENCE_END = /[.!?]["')\]]?\s*$/;

/** A line that begins a new experience entry: a role/title with a trailing date
    range (e.g. "…Lead    May 2024 - Present"), not itself a bullet. */
function isDatedHeader(line: string): boolean {
  if (BULLET_RE.test(line.trim())) return false;
  const { head, date } = splitTrailingDate(line.replace(/\t/g, " ").trim());
  return !!date && head.length > 0 && head.length <= 90;
}

/** The line right after a dated header is the employer when it reads like one:
    short, capitalised, and not a sentence (bullets end in a period). */
const looksLikeCompany = (t: string) =>
  !!t && !SENTENCE_END.test(t) && t.split(/\s+/).length <= 8 && !/^[a-z]/.test(t) && !BULLET_RE.test(t);

/** Append a wrapped line to a buffer, respecting soft hyphenation. */
const joinWrap = (buf: string, line: string) => (!buf ? line : /-$/.test(buf) ? buf + line : buf + " " + line);

/** Rebuild bullets from a run of body lines. If markers survived extraction we
    split on them; otherwise (a common case — PDFs drop the •) we join wrapped
    lines into one bullet per sentence. */
function reconstructBullets(lines: string[]): string[] {
  const bullets: string[] = [];
  const hasMarker = lines.some((l) => BULLET_RE.test(l.trim()));
  let buf = "";
  const flush = () => { const t = buf.trim(); if (t) bullets.push(t); buf = ""; };
  for (const raw of lines) {
    const line = raw.trim();
    if (!line) continue;
    if (hasMarker) {
      if (BULLET_RE.test(line)) { flush(); buf = stripBullet(line); }
      else buf = joinWrap(buf, line);
    } else {
      buf = joinWrap(buf, line);
      if (SENTENCE_END.test(line)) flush();
    }
  }
  flush();
  return bullets;
}

/** Old marker-based path — used only when a block has no dated headers to anchor
    on (each non-bullet line starts a new entry; bullets attach to it). */
function parseExperienceFallback(lls: LL[]): ExperienceItem[] {
  const jobs: ExperienceItem[] = [];
  let cur: ExperienceItem | null = null;
  for (const ll of lls) {
    if (ll.bullet) {
      if (!cur) { cur = { role: "", company: "", location: "", meta: "", bullets: [] }; jobs.push(cur); }
      cur.bullets.push(ll.text);
    } else {
      const { head, date } = splitTrailingDate(ll.text);
      const parts = head.split(/\s+[–—|]\s+|\s+—\s+|\s+-\s+|\s+\bat\b\s+/i);
      cur = { role: (parts[0] ?? head).trim(), company: (parts.slice(1).join(" — ")).trim(), location: "", meta: date, bullets: [] };
      jobs.push(cur);
    }
  }
  return jobs;
}

function parseExperienceLike(rawLines: string[]): ExperienceItem[] {
  const lines = rawLines.map((l) => l.replace(/\t/g, " ").replace(/\s+$/, "")).filter((l) => l.trim());
  // No dated headers to anchor on → keep the marker-based behaviour.
  if (!lines.some(isDatedHeader)) return parseExperienceFallback(logicalLines(rawLines));

  // Group lines into entries, each starting at a dated header line.
  const groups: { header: string; body: string[] }[] = [];
  let cur: { header: string; body: string[] } | null = null;
  for (const line of lines) {
    if (isDatedHeader(line)) { cur = { header: line, body: [] }; groups.push(cur); }
    else if (cur) cur.body.push(line);
  }

  const cleanCompany = (s: string) => s.replace(/[\s–—|-]+$/, "").trim();
  return groups.map((g) => {
    const { head, date } = splitTrailingDate(g.header.replace(/\t/g, " "));
    // "Role — Company" / "Role | Company" / "Role at Company" on the header line
    const parts = head.split(/\s+[–—|]\s+|\s+-\s+|\s+\bat\b\s+/i);
    const role = (parts[0] ?? head).trim();
    let company = parts.length > 1 ? cleanCompany(parts.slice(1).join(" — ")) : "";
    let body = g.body;
    // otherwise the employer is usually the line right after the header
    if (!company && body.length && looksLikeCompany(body[0] ?? "")) { company = cleanCompany(body[0] ?? ""); body = body.slice(1); }
    return { role, company, location: "", meta: date, bullets: reconstructBullets(body) };
  });
}

function parseEducation(lls: LL[]): EducationItem[] {
  const eds: EducationItem[] = [];
  let cur: EducationItem | null = null;
  for (const ll of lls) {
    const { head, date } = splitTrailingDate(ll.text);
    if (date || !cur) {
      cur = { degree: date ? "" : head, school: date ? head : "", meta: date };
      eds.push(cur);
      if (date) continue;
    } else if (!cur.degree) {
      cur.degree = ll.text;
    } else {
      cur.school = cur.school || ll.text;
    }
  }
  return eds;
}

/* Projects are anchored on dated headers when the document has them —
   "QuickCart — Full-Stack E-commerce Platform    June 2025 - July 2025" — the
   same way experience entries are. Everything between two headers is body text
   rebuilt into bullets.

   Without that anchor, any line lacking a bullet glyph started a NEW project,
   and PDF extraction routinely drops the • — so a two-project section imported
   as thirteen title-only projects, each bullet rendering as a bold heading. */
function parseProjects(lls: LL[], rawLines: string[]): ProjectItem[] {
  const lines = rawLines.map((l) => l.replace(/\t/g, " ").replace(/\s+$/, "")).filter((l) => l.trim());

  if (lines.some(isDatedHeader)) {
    const groups: { header: string; body: string[] }[] = [];
    let cur: { header: string; body: string[] } | null = null;
    for (const line of lines) {
      if (isDatedHeader(line)) { cur = { header: line, body: [] }; groups.push(cur); }
      else if (cur) cur.body.push(line);
    }
    return groups.map((g) => {
      const { head, date } = splitTrailingDate(g.header.replace(/\t/g, " "));
      return { name: head.trim(), meta: date, bullets: reconstructBullets(g.body) };
    });
  }

  // No dated headers to anchor on → keep the marker-based behaviour.
  const projs: ProjectItem[] = [];
  let cur: ProjectItem | null = null;
  for (const ll of lls) {
    if (ll.bullet) {
      if (!cur) { cur = { name: "", meta: "", bullets: [] }; projs.push(cur); }
      (cur.bullets ??= []).push(ll.text);
    } else {
      const { head, date } = splitTrailingDate(ll.text);
      cur = { name: head, meta: date, bullets: [] };
      projs.push(cur);
    }
  }
  return projs;
}

/* Skills come in every shape: "Category: a, b, c" lists, tab-separated grids
   (each cell a skill, cells wrapping onto their own line), or plain lists.
   We keep real labelled categories intact and, for grid/plain layouts, atomise
   the cells into one clean de-duplicated skill list instead of many broken
   one-per-line rows. Nothing is invented; only whitespace/columns are undone. */
function parseSkills(rawLines: string[]): SkillGroup[] {
  const lines = rawLines.map((l) => l.replace(/\s+$/, "")).filter((l) => l.trim());
  if (!lines.length) return [];
  const colonAt = (l: string) => { const i = l.indexOf(":"); return i > 0 && i <= 40 ? i : -1; };
  const labelled = lines.filter((l) => colonAt(l) >= 0).length;
  const tabbed = lines.filter((l) => /\t/.test(l)).length;
  // Grids are tab-separated with few colons; anything with real "Category:"
  // labels keeps them (labels are worth preserving, even when values wrap).
  const gridLike = labelled < 2 || (tabbed >= lines.length * 0.4 && labelled < lines.length * 0.5);

  // ---- labelled format: "Category: a, b, c" (wrapped values rejoin) ----
  if (!gridLike) {
    const groups: SkillGroup[] = [];
    for (const raw of lines) {
      const l = raw.trim();
      const i = colonAt(l);
      if (i >= 0) groups.push([l.slice(0, i).trim(), l.slice(i + 1).trim()]);
      else if (groups.length && !/[.]$/.test(groups[groups.length - 1]![1]))
        groups[groups.length - 1]![1] = (groups[groups.length - 1]![1] + " " + l).trim(); // wrapped value
      else groups.push(["", l]); // a category with no colon (user labels it in-editor)
    }
    return groups.filter(([, v]) => v.trim());
  }

  // ---- grid / plain list: split columns on tabs or 2+ spaces, atomise ----
  const cells: string[] = [];
  for (const raw of lines) {
    for (const part of raw.split(/\t+|\s{2,}/)) {
      let cell = part.trim();
      if (!cell) continue;
      // a cell that opens with "(abbr) …" carries the tail of the previous cell
      const lead = cell.match(/^(\([^)]*\))\s+(.+)$/);
      if (lead && cells.length) { cells[cells.length - 1] += " " + lead[1]; cell = (lead[2] ?? "").trim(); }
      // a lone "(abbr)" or ")"-terminated fragment also belongs to the previous cell
      if (cells.length && (/^\([^)]*\)$/.test(cell) || (/\)$/.test(cell) && !cell.includes("(")))) {
        cells[cells.length - 1] += " " + cell; continue;
      }
      cells.push(cell);
    }
  }
  // cells may themselves be comma lists → flatten; de-dupe, preserve order
  const seen = new Set<string>();
  const skills: string[] = [];
  for (const c of cells) for (const s of c.split(/\s*,\s*/)) {
    const t = s.trim();
    if (t && !seen.has(t.toLowerCase())) { seen.add(t.toLowerCase()); skills.push(t); }
  }
  return skills.length ? [["", skills.join(", ")]] : [];
}

export function parseResumeText(raw: string): ResumeData {
  const allLines = raw.split(/\r?\n/).map((l) => l.replace(/\s+$/, "")).filter((l) => l.trim() && !isPageArtifact(l.trim()));

  // ---- header: everything before the first recognised heading ----
  let firstHeadingIdx = allLines.findIndex((l) => detectHeading(l));
  if (firstHeadingIdx < 0) firstHeadingIdx = allLines.length;
  const headerLines = allLines.slice(0, firstHeadingIdx);
  const name = headerLines[0]?.trim() ?? "";
  const contact: string[] = [];
  let target = "";
  for (const line of headerLines.slice(1)) {
    if (/[|•·]/.test(line) || /@|https?:|www\.|\d{3}/.test(line)) {
      line.split(/\s*[|•·]\s*/).map((s) => s.trim()).filter(Boolean).forEach((c) => contact.push(c));
    } else if (!target) {
      target = line.trim();
    }
  }

  // ---- split body into [heading, lines] blocks, preserving order ----
  type Block = { heading: Heading; lines: string[] };
  const blocks: Block[] = [];
  let cur: Block | null = null;
  for (const line of allLines.slice(firstHeadingIdx)) {
    const h = detectHeading(line);
    if (h) { cur = { heading: h, lines: [] }; blocks.push(cur); }
    else if (cur) cur.lines.push(line);
  }

  const data: ResumeData = {
    name, target, contact, summary: "",
    experience: [], skills: [], education: [], projects: [], certifications: [], custom: [],
  };
  const order: string[] = [];
  let customIdx = 0;

  for (const block of blocks) {
    const lls = logicalLines(block.lines);
    const h = block.heading!;
    if (h.kind === "std") {
      if (order.includes(h.type)) {
        // a section repeated — merge rather than lose content
      } else order.push(h.type);
      switch (h.type) {
        case "summary": data.summary = [data.summary, ...lls.map((l) => l.text)].filter(Boolean).join(" "); break;
        case "experience": data.experience.push(...parseExperienceLike(block.lines)); break;
        case "education": data.education.push(...parseEducation(lls)); break;
        case "projects": data.projects!.push(...parseProjects(lls, block.lines)); break;
        case "skills": data.skills.push(...parseSkills(block.lines)); break;
        case "certifications":
          // Certs usually come as two lines: a name, then "Issuer - Date".
          // Pair the issuer/date line onto the preceding cert instead of
          // emitting a second phantom cert.
          for (const ll of lls.filter((l) => l.text.trim())) {
            const { head, date } = splitTrailingDate(ll.text);
            const prev = data.certifications![data.certifications!.length - 1];
            const issuer = head.replace(/[-–—]\s*$/, "").trim();
            const isIssuerLine = !!date && !!prev && !prev.issuer && !prev.meta && issuer.length <= 40 && /[-–—]\s*\S/.test(ll.text);
            if (isIssuerLine) { prev.issuer = issuer; prev.meta = date; }
            else data.certifications!.push({ name: head, issuer: "", meta: date });
          }
          break;
      }
    } else {
      const id = `custom-${customIdx++}`;
      data.custom!.push({ id, title: h.title, items: lls.map((l) => l.text).filter(Boolean) } as CustomSection);
      order.push(`custom:${id}`);
    }
  }

  data.sectionOrder = order;
  return data;
}
