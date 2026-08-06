import type { CSSProperties } from "react";
import type { ResumeData, ResumeVariant } from "../../lib/resume/resumeData";
import { resumeBlocks, resumeTwoColumn } from "./resumeBlocks";
import { isTwoColumn } from "../../lib/resume/templates";

/* ============================================================
   <Resume /> — a single ATS-safe resume page (no pagination).
   Used for thumbnails / scaled previews (landing, dashboard).
   The .resume element is locked to A4 (210/297) in
   resume-templates.css; overflow beyond one page is clipped.
   For a multi-page, content-aware document use <ResumeDoc />.
   ============================================================ */

interface ResumeProps {
  data: ResumeData;
  variant?: ResumeVariant;
  className?: string;
}

export default function Resume({ data, variant = "classic", className }: ResumeProps) {
  const twoCol = isTwoColumn(variant);
  const fs = data.fontScale && data.fontScale > 0 ? ({ "--rfs": data.fontScale } as CSSProperties) : undefined;
  return (
    <div
      className={`resume resume--${variant}${twoCol ? " resume--twocol" : ""}${className ? ` ${className}` : ""}`}
      style={fs}
    >
      {twoCol ? resumeTwoColumn(data, variant) : resumeBlocks(data, variant)}
    </div>
  );
}
