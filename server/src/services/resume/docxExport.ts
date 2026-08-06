import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  AlignmentType,
  TabStopType,
  BorderStyle,
} from "docx";
import { resolveSectionOrder, type ResumeData } from "./resumeData";

/* Builds an ATS-safe .docx: single column, standard headings, real text,
   web-safe font. Mirrors the on-screen ATS-safe templates. */

const RIGHT_TAB = 9026; // content width in twips for A4 with ~0.75in margins

function sectionHeading(text: string): Paragraph {
  return new Paragraph({
    spacing: { before: 240, after: 100 },
    border: { bottom: { color: "999999", size: 6, style: BorderStyle.SINGLE, space: 2 } },
    children: [new TextRun({ text: text.toUpperCase(), bold: true, size: 21, characterSpacing: 20 })],
  });
}

function bullet(text: string): Paragraph {
  return new Paragraph({
    bullet: { level: 0 },
    spacing: { after: 40 },
    children: [new TextRun({ text, size: 20 })],
  });
}

/** A clean business-letter .docx: name/contact letterhead, date, then the
    letter body (blank-line-separated paragraphs). */
export async function buildCoverLetterDocx(opts: { name: string; contact: string[]; body: string; date?: string }): Promise<Buffer> {
  const children: Paragraph[] = [];
  if (opts.name) children.push(new Paragraph({ spacing: { after: 20 }, children: [new TextRun({ text: opts.name, bold: true, size: 28 })] }));
  const contact = opts.contact.filter((c) => c.trim());
  if (contact.length) children.push(new Paragraph({ spacing: { after: 200 }, children: [new TextRun({ text: contact.join("  •  "), size: 18, color: "444444" })] }));
  const date = opts.date || new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
  children.push(new Paragraph({ spacing: { after: 200 }, children: [new TextRun({ text: date, size: 20 })] }));
  for (const para of opts.body.split(/\n\s*\n/)) {
    const lines = para.split(/\n/).filter((l) => l.length);
    children.push(new Paragraph({
      spacing: { after: 160, line: 276 },
      children: lines.flatMap((l, i) => (i === 0 ? [new TextRun({ text: l, size: 22 })] : [new TextRun({ text: l, size: 22, break: 1 })])),
    }));
  }
  const doc = new Document({
    styles: { default: { document: { run: { font: "Calibri", size: 22 } } } },
    sections: [{ properties: { page: { margin: { top: 1440, bottom: 1440, left: 1440, right: 1440 } } }, children }],
  });
  return Packer.toBuffer(doc);
}

export async function buildDocx(data: ResumeData): Promise<Buffer> {
  const children: Paragraph[] = [];

  // Header
  children.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 20 },
      children: [new TextRun({ text: data.name, bold: true, size: 34 })],
    })
  );
  if (data.target) {
    children.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 20 },
        children: [new TextRun({ text: data.target, italics: true, size: 22, color: "333333" })],
      })
    );
  }
  if (data.contact.length) {
    children.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 80 },
        children: [new TextRun({ text: data.contact.join("  •  "), size: 18, color: "444444" })],
      })
    );
  }

  // ---- each body section as a paragraph builder (empty array = skip) ----
  const sections: Record<string, () => Paragraph[]> = {
    summary: () => {
      if (!data.summary.trim()) return [];
      return [sectionHeading("Summary"), new Paragraph({ spacing: { after: 60 }, children: [new TextRun({ text: data.summary, size: 20 })] })];
    },
    experience: () => {
      if (!data.experience.length) return [];
      const out: Paragraph[] = [sectionHeading("Experience")];
      for (const job of data.experience) {
        out.push(new Paragraph({
          tabStops: [{ type: TabStopType.RIGHT, position: RIGHT_TAB }], spacing: { after: 0 },
          children: [new TextRun({ text: job.role, bold: true, size: 21 }), new TextRun({ text: `\t${job.meta}`, size: 18, color: "444444" })],
        }));
        out.push(new Paragraph({ spacing: { after: 40 }, children: [new TextRun({ text: [job.company, job.location].filter(Boolean).join(" — "), size: 20, color: "333333" })] }));
        job.bullets.filter((b) => b.trim()).forEach((b) => out.push(bullet(b)));
      }
      return out;
    },
    projects: () => {
      if (!data.projects?.length) return [];
      const out: Paragraph[] = [sectionHeading("Projects")];
      for (const p of data.projects) {
        out.push(new Paragraph({
          tabStops: [{ type: TabStopType.RIGHT, position: RIGHT_TAB }], spacing: { after: 0 },
          children: [new TextRun({ text: p.name, bold: true, size: 21 }), ...(p.meta ? [new TextRun({ text: `\t${p.meta}`, size: 18, color: "444444" })] : [])],
        }));
        const pb = (p.bullets ?? []).filter((b) => b.trim());
        if (pb.length) pb.forEach((b) => out.push(bullet(b)));
        else if (p.description) out.push(new Paragraph({ spacing: { after: 40 }, children: [new TextRun({ text: p.description, size: 20, color: "333333" })] }));
      }
      return out;
    },
    skills: () => {
      const rows = data.skills.filter(([l, v]) => l.trim() || v.trim());
      if (!rows.length) return [];
      const out: Paragraph[] = [sectionHeading("Skills")];
      for (const [label, value] of rows) {
        const runs = label.trim()
          ? [new TextRun({ text: `${label}: `, bold: true, size: 20 }), new TextRun({ text: value, size: 20 })]
          : [new TextRun({ text: value, size: 20 })];
        out.push(new Paragraph({ spacing: { after: 20 }, children: runs }));
      }
      return out;
    },
    education: () => {
      if (!data.education.length) return [];
      const out: Paragraph[] = [sectionHeading("Education")];
      for (const ed of data.education) {
        out.push(new Paragraph({
          tabStops: [{ type: TabStopType.RIGHT, position: RIGHT_TAB }], spacing: { after: 0 },
          children: [new TextRun({ text: ed.degree, bold: true, size: 21 }), new TextRun({ text: `\t${ed.meta}`, size: 18, color: "444444" })],
        }));
        out.push(new Paragraph({ spacing: { after: 40 }, children: [new TextRun({ text: ed.school, size: 20, color: "333333" })] }));
      }
      return out;
    },
    certifications: () => {
      if (!data.certifications?.length) return [];
      const out: Paragraph[] = [sectionHeading("Certifications")];
      for (const c of data.certifications) {
        out.push(new Paragraph({
          tabStops: [{ type: TabStopType.RIGHT, position: RIGHT_TAB }], spacing: { after: 0 },
          children: [new TextRun({ text: c.name, bold: true, size: 21 }), new TextRun({ text: c.meta ? `\t${c.meta}` : "", size: 18, color: "444444" })],
        }));
        if (c.issuer) out.push(new Paragraph({ spacing: { after: 40 }, children: [new TextRun({ text: c.issuer, size: 20, color: "333333" })] }));
      }
      return out;
    },
  };

  // user-defined sections (title + bullet lines)
  const customById = new Map((data.custom ?? []).map((c) => [`custom:${c.id}`, c]));

  // assemble body sections in the user's order
  for (const key of resolveSectionOrder(data)) {
    if (key.startsWith("custom:")) {
      const c = customById.get(key);
      const items = c?.items.filter((i) => i.trim()) ?? [];
      if (!c || (!c.title.trim() && !items.length)) continue;
      children.push(sectionHeading(c.title || "Section"));
      items.forEach((b) => children.push(bullet(b)));
    } else {
      children.push(...(sections[key]?.() ?? []));
    }
  }

  const doc = new Document({
    styles: { default: { document: { run: { font: "Calibri", size: 20 } } } },
    sections: [
      {
        properties: { page: { margin: { top: 1080, bottom: 1080, left: 1080, right: 1080 } } },
        children,
      },
    ],
  });

  return Packer.toBuffer(doc);
}
