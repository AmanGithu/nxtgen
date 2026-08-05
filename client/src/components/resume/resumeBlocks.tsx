import { Fragment, type ReactNode } from "react";
import { resolveSectionOrder, type ResumeData, type ResumeVariant } from "../../lib/resume/resumeData";

/* ============================================================
   Resume content as an ordered list of ROWS — the smallest units
   the paginator can break between (a heading, a job header, a
   single bullet, or an atomic block like the summary/skills body).

   Both <Resume /> (single page) and <ResumeDoc /> (A4 paginator)
   render from the SAME rows via renderRows(), so preview and export
   stay in lockstep. Breaking at the row level lets a long section's
   bullets flow across a page boundary and fill each page — matching
   how headless Chrome paginates the PDF — instead of shoving a
   page-tall section whole onto the next sheet.
   ============================================================ */

export type ResumeRow = {
  i: number;                 // assigned position (used for measurement mapping)
  kind: "head" | "heading" | "jobhead" | "bullet" | "skillline" | "block";
  key: string;
  keepWithNext?: boolean;    // don't leave this row orphaned at a page bottom
  entryKey?: string;         // ties bullets to their job header
  node?: ReactNode;          // head / block payload
  title?: string;            // heading text / skill label
  role?: string; meta?: string; sub?: string; // jobhead
  text?: ReactNode;          // bullet / skill value
};

function Contact({ items }: { items: string[] }) {
  const shown = items.filter((c) => c.trim());
  return (
    <div className="r-contact">
      {shown.map((c, i) => (
        <Fragment key={i}>
          {i > 0 ? " " : null}
          <span>{c}</span>
        </Fragment>
      ))}
    </div>
  );
}

/** Build the flat, ordered row list for a résumé. */
export function resumeRows(data: ResumeData, variant: ResumeVariant): ResumeRow[] {
  const rows: ResumeRow[] = [];
  const push = (r: Omit<ResumeRow, "i">) => { rows.push({ ...r, i: rows.length }); };

  const rowHeader = variant === "compact" || variant === "developer";
  push({
    kind: "head", key: "head", keepWithNext: true,
    node: rowHeader ? (
      <header className="r-head">
        <div className="r-head-row">
          <div className="r-name">{data.name}</div>
          <div className="r-target">{data.target}</div>
        </div>
        <Contact items={data.contact} />
      </header>
    ) : (
      <header className="r-head">
        <div className="r-name">{data.name}</div>
        <div className="r-target">{data.target}</div>
        <Contact items={data.contact} />
      </header>
    ),
  });

  const heading = (key: string, title: string) => push({ kind: "heading", key, title, keepWithNext: true });

  const emit: Record<string, () => void> = {
    summary: () => {
      if (!data.summary.trim()) return;
      heading("summary", "Summary");
      push({ kind: "block", key: "summary-body", node: <p className="r-summary">{data.summary}</p> });
    },
    experience: () => {
      if (!data.experience.length) return;
      heading("experience", "Experience");
      data.experience.forEach((job, i) => {
        const ek = `exp-${i}`;
        const jb = job.bullets.filter((b) => b.trim());
        // only bind the header to the page below it if it actually has bullets
        push({ kind: "jobhead", key: ek, entryKey: ek, keepWithNext: jb.length > 0, role: job.role, meta: job.meta,
          sub: [job.company, job.location].filter((s) => s?.trim()).join(" — ") });
        jb.forEach((b, j) => push({ kind: "bullet", key: `${ek}-b${j}`, entryKey: ek, text: b }));
      });
    },
    skills: () => {
      const skillRows = data.skills.filter(([l, v]) => l.trim() || v.trim());
      if (!skillRows.length) return;
      heading("skills", "Skills");
      // one row per skill group so groups flow across pages; a long value-only
      // list (the grid-import case) is chunked so it can split mid-list too.
      skillRows.forEach(([label, value], gi) => {
        const items = value.split(/\s*,\s*/).filter(Boolean);
        if (!label.trim() && items.length > 14) {
          const CH = 12;
          for (let s = 0; s < items.length; s += CH)
            push({ kind: "skillline", key: `sk-${gi}-${s}`, text: items.slice(s, s + CH).join(", ") + (s + CH < items.length ? "," : "") });
        } else {
          push({ kind: "skillline", key: `sk-${gi}`, title: label.trim(), text: value });
        }
      });
    },
    education: () => {
      if (!data.education.length) return;
      heading("education", "Education");
      data.education.forEach((ed, i) =>
        push({ kind: "jobhead", key: `edu-${i}`, entryKey: `edu-${i}`,
          role: ed.degree, meta: ed.meta, sub: ed.school })); // self-contained (no bullets)
    },
    projects: () => {
      if (!data.projects?.length) return;
      heading("projects", "Projects");
      data.projects.forEach((p, i) => {
        const ek = `proj-${i}`;
        const pb = (p.bullets ?? []).filter((b) => b.trim());
        push({ kind: "jobhead", key: ek, entryKey: ek, keepWithNext: pb.length > 0, role: p.name, meta: p.meta,
          sub: pb.length ? "" : (p.description ?? "") });
        pb.forEach((b, j) => push({ kind: "bullet", key: `${ek}-b${j}`, entryKey: ek, text: b }));
      });
    },
    certifications: () => {
      if (!data.certifications?.length) return;
      heading("certifications", "Certifications");
      data.certifications.forEach((c, i) =>
        push({ kind: "jobhead", key: `cert-${i}`, entryKey: `cert-${i}`,
          role: c.name, meta: c.meta, sub: c.issuer })); // self-contained (no bullets)
    },
  };

  const custom: Record<string, () => void> = {};
  for (const c of data.custom ?? []) {
    custom[`custom:${c.id}`] = () => {
      const items = c.items.filter((it) => it.trim());
      if (!c.title.trim() && !items.length) return;
      const ek = `custom-${c.id}`;
      heading(`custom:${c.id}`, c.title || "Section");
      items.forEach((b, j) => push({ kind: "bullet", key: `${ek}-b${j}`, entryKey: ek, text: b }));
    };
  }

  for (const key of resolveSectionOrder(data)) (key.startsWith("custom:") ? custom[key] : emit[key])?.();
  return rows;
}

/** Render a (sub)list of rows into well-formed résumé DOM: headings open a
    section, a job header groups its following same-entry bullets into one <ul>,
    and continuation bullets (whose header sits on a previous page) render as a
    bare bullet list. `measure` tags each row's anchor element with data-ri. */
export function renderRows(rows: ResumeRow[], measure = false): ReactNode[] {
  const out: ReactNode[] = [];
  const ri = (r: ResumeRow) => (measure ? { "data-ri": r.i } : {});
  let i = 0;
  while (i < rows.length) {
    const r = rows[i];
    if (!r) { i++; continue; }
    if (r.kind === "head") { out.push(<div key={r.key} {...ri(r)}>{r.node}</div>); i++; continue; }
    if (r.kind === "heading") {
      out.push(
        <section className="r-section" key={r.key} {...ri(r)}>
          <div className="r-h">{r.title}</div>
        </section>
      );
      i++; continue;
    }
    if (r.kind === "block") { out.push(<div className="r-block" key={r.key} {...ri(r)}>{r.node}</div>); i++; continue; }
    if (r.kind === "skillline") {
      const run: ResumeRow[] = [r];
      let j = i + 1;
      while (j < rows.length && rows[j].kind === "skillline") { run.push(rows[j]); j++; }
      out.push(
        <div className="r-skills" key={r.key}>
          {run.map((s) => (
            <div key={s.key} {...ri(s)}>{s.title ? <><b>{s.title}:</b> {s.text}</> : s.text}</div>
          ))}
        </div>
      );
      i = j; continue;
    }
    if (r.kind === "jobhead") {
      const bullets: ResumeRow[] = [];
      let j = i + 1;
      while (j < rows.length && rows[j].kind === "bullet" && rows[j].entryKey === r.entryKey) { bullets.push(rows[j]); j++; }
      out.push(
        <div className="r-job" key={r.key} {...ri(r)}>
          <div className="r-job-top">
            <div className="r-role">{r.role}</div>
            {r.meta ? <div className="r-meta">{r.meta}</div> : null}
          </div>
          {r.sub?.trim() ? <div className="r-sub">{r.sub}</div> : null}
          {bullets.length ? (
            <ul className="r-bullets">
              {bullets.map((b) => <li className="r-bullet" key={b.key} {...ri(b)}>{b.text}</li>)}
            </ul>
          ) : null}
        </div>
      );
      i = j; continue;
    }
    // continuation bullets (header was on a previous page)
    const run: ResumeRow[] = [r];
    let j = i + 1;
    while (j < rows.length && rows[j].kind === "bullet" && rows[j].entryKey === r.entryKey) { run.push(rows[j]); j++; }
    out.push(
      <ul className="r-bullets" key={r.key}>
        {run.map((b) => <li className="r-bullet" key={b.key} {...ri(b)}>{b.text}</li>)}
      </ul>
    );
    i = j;
  }
  return out;
}

/** Back-compat: the whole résumé as one flat node list (single-container use). */
export function resumeBlocks(data: ResumeData, variant: ResumeVariant): ReactNode[] {
  return renderRows(resumeRows(data, variant));
}

/* ============================================================
   Two-column layout (Pro templates: sidebar / split / corporate).

   Reuses the EXACT single-column section renderers by feeding each
   column a copy of the résumé with the other column's sections
   blanked out — so a two-column template can never drift from the
   single-column output, and the PDF/HTML path mirrors it the same
   way. Left rail = Skills / Education / Certifications; right main =
   Summary / Experience / Projects / custom sections, each in the
   user's chosen order. The name/contact header spans the full width.
   ============================================================ */
const LEFT_ONLY = (d: ResumeData): ResumeData => ({ ...d, summary: "", experience: [], projects: [], custom: [] });
const RIGHT_ONLY = (d: ResumeData): ResumeData => ({ ...d, skills: [], education: [], certifications: [] });

// section rows only (the head row is rendered separately as a full-width band)
const columnNodes = (d: ResumeData, variant: ResumeVariant): ReactNode[] =>
  renderRows(resumeRows(d, variant).filter((r) => r.kind !== "head"));

export function resumeTwoColumn(data: ResumeData, variant: ResumeVariant): ReactNode {
  const left = columnNodes(LEFT_ONLY(data), variant);
  const right = columnNodes(RIGHT_ONLY(data), variant);
  return (
    <>
      <header className="r-head">
        <div className="r-name">{data.name}</div>
        <div className="r-target">{data.target}</div>
        <Contact items={data.contact} />
      </header>
      <div className="r-two">
        <aside className="r-col r-col-side">{left}</aside>
        <main className="r-col r-col-main">{right}</main>
      </div>
    </>
  );
}
