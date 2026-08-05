import type { ResumeVariant } from "./resumeData";

/* A compact, content-free description of a template's *layout*, used to draw
   the schematic thumbnail in the picker. The thumbnail conveys structure —
   header placement, one vs two columns, accent colour, heading style — so a
   user can scan many templates at a glance without reading dummy résumé text. */
export interface ThumbSpec {
  accent: string;                              // heading / accent colour
  name: "center" | "left";                     // name alignment in the header
  serif?: boolean;                             // render the name in a serif face
  band?: boolean;                              // header is a filled colour band
  columns: 1 | 2;
  sidebar?: "left" | "right";                  // which side the narrow column sits (2-col only)
  heading: "underline" | "rule" | "leftbar" | "hash" | "fill";
}

export interface TemplateMeta {
  id: ResumeVariant;
  label: string;
  premium: boolean;
  blurb: string;
  /** true for the two-column (sidebar + main) layouts */
  twoColumn?: boolean;
  thumb: ThumbSpec;
}

/* The template catalog. Each id maps to a `.resume--{id}` style in
   resume-templates.css (screen) and the mirrored block in pdfExport.ts (PDF).
   Single-column templates stay ATS-safe; the two-column ones are a Pro
   flourish and export to DOCX as clean single-column. */
export const TEMPLATES: TemplateMeta[] = [
  { id: "classic",   label: "Classic",   premium: false, blurb: "Timeless serif, centered header",
    thumb: { accent: "#1a1a1a", name: "center", serif: true, columns: 1, heading: "underline" } },
  { id: "modern",    label: "Modern",    premium: false, blurb: "Clean sans, bold rule lines",
    thumb: { accent: "#1a1a1a", name: "left", columns: 1, heading: "rule" } },
  { id: "compact",   label: "Compact",   premium: false, blurb: "Dense — fits more on a page",
    thumb: { accent: "#2a2a2a", name: "left", columns: 1, heading: "rule" } },
  { id: "executive", label: "Executive", premium: true,  blurb: "Refined serif, navy accents",
    thumb: { accent: "#1f3a5f", name: "center", serif: true, columns: 1, heading: "underline" } },
  { id: "elegant",   label: "Elegant",   premium: true,  blurb: "Airy layout, teal accent rule",
    thumb: { accent: "#0f6f6a", name: "left", columns: 1, heading: "leftbar" } },
  { id: "developer", label: "Developer", premium: true,  blurb: "Mono accents for tech roles",
    thumb: { accent: "#0a7d5a", name: "left", columns: 1, heading: "hash" } },

  // ---- new Pro templates ----
  { id: "sidebar",   label: "Sidebar",   premium: true,  blurb: "Two-column · dark left rail", twoColumn: true,
    thumb: { accent: "#1f2a37", name: "left", columns: 2, sidebar: "left", heading: "rule" } },
  { id: "split",     label: "Split",     premium: true,  blurb: "Two-column · accent right rail", twoColumn: true,
    thumb: { accent: "#0f6f6a", name: "left", columns: 2, sidebar: "right", heading: "leftbar" } },
  { id: "corporate", label: "Corporate", premium: true,  blurb: "Two-column · header band + columns", twoColumn: true,
    thumb: { accent: "#1f3a5f", name: "center", columns: 2, sidebar: "left", heading: "underline" } },
  { id: "bold",      label: "Bold",      premium: true,  blurb: "Solid header band, filled headings",
    thumb: { accent: "#0a0a0a", name: "left", band: true, columns: 1, heading: "fill" } },
];

const TWO_COLUMN_IDS = new Set(TEMPLATES.filter((t) => t.twoColumn).map((t) => t.id));

export function isPremiumTemplate(id: string): boolean {
  return TEMPLATES.find((t) => t.id === id)?.premium ?? false;
}

export function isTwoColumn(id: string): boolean {
  return TWO_COLUMN_IDS.has(id as ResumeVariant);
}
