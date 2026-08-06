import { useLayoutEffect, useRef, useState, type CSSProperties } from "react";
import type { ResumeData, ResumeVariant } from "../../lib/resume/resumeData";
import { resumeRows, renderRows, resumeTwoColumn } from "./resumeBlocks";
import { isTwoColumn } from "../../lib/resume/templates";

/* ============================================================
   <ResumeDoc /> — multi-page A4 document with real pagination.
   Measures every ROW (heading, job header, single bullet, or an
   atomic block) at the page width, then packs rows into A4-height
   pages. Because it breaks at the row level, a long section's
   bullets flow across a page boundary and fill each page — the
   same continuous flow headless Chrome produces for the PDF —
   instead of dropping a page-tall section whole onto the next
   sheet and leaving a half-empty page. Headings and job headers
   are never left orphaned at a page bottom.

   Fit-to-one-page: if content overflows one page only modestly
   (scale stays above READ_FLOOR), the whole résumé is scaled down
   uniformly so it lands on one page. Content is NEVER cut.
   ============================================================ */

const PAGE_WIDTH = 660; // matches .resume-doc width in editor.css
const PAGE_HEIGHT = (PAGE_WIDTH * 297) / 210; // A4 ratio
const READ_FLOOR = 0.72; // never shrink below this to force one page

interface ResumeDocProps {
  data: ResumeData;
  variant?: ResumeVariant;
  onPages?: (n: number) => void;
}

/* Two-column templates can't use the row-level paginator (the paginator
   assumes one linear flow). They render as a single page and fit-to-one-page
   scale instead: measure natural height at page width, shrink uniformly if it
   overflows. Content that still overflows past the floor is clipped in the
   editor preview only — the PDF print path lets it flow. */
function TwoColDoc({ data, variant, onPages }: Required<Pick<ResumeDocProps, "data" | "variant">> & { onPages?: (n: number) => void }) {
  const measRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const rfs = (data.fontScale && data.fontScale > 0 ? { "--rfs": data.fontScale } : {}) as CSSProperties;

  useLayoutEffect(() => {
    const el = measRef.current;
    if (!el) return;
    el.style.width = `${PAGE_WIDTH}px`;
    el.style.transform = "none";
    const h = el.getBoundingClientRect().height;
    let s = h > PAGE_HEIGHT ? PAGE_HEIGHT / h : 1;
    // re-measure once at the widened width (a wider column is shorter)
    if (s < 1) {
      el.style.width = `${PAGE_WIDTH / s}px`;
      const h2 = el.getBoundingClientRect().height * s;
      s = h2 > PAGE_HEIGHT ? Math.max(0.55, (s * PAGE_HEIGHT) / h2) : s;
      el.style.width = `${PAGE_WIDTH}px`;
    }
    setScale(s);
    onPages?.(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, variant]);

  return (
    <div className="resume-doc">
      <div className="resume-fit">
        <div
          ref={measRef}
          className={`resume resume--${variant} resume--twocol`}
          style={{ width: PAGE_WIDTH / scale, transform: `scale(${scale})`, transformOrigin: "top left", ...rfs }}
        >
          {resumeTwoColumn(data, variant)}
        </div>
      </div>
    </div>
  );
}

/* Dispatcher: two-column templates and the single-column paginator have
   different hook shapes, so each lives in its own component (a conditional
   early-return in one component would violate the Rules of Hooks). */
export default function ResumeDoc({ data, variant = "classic", onPages }: ResumeDocProps) {
  if (isTwoColumn(variant)) return <TwoColDoc data={data} variant={variant} onPages={onPages} />;
  return <SingleColDoc data={data} variant={variant} onPages={onPages} />;
}

function SingleColDoc({ data, variant = "classic", onPages }: ResumeDocProps) {
  const rows = resumeRows(data, variant);
  const measRef = useRef<HTMLDivElement>(null);
  const [pages, setPages] = useState<number[][]>([rows.map((_, i) => i)]);
  const [scale, setScale] = useState(1); // 1 = no fit-scaling (paginates normally)
  // user text scale — measurer must carry it so pagination reflects the real sizes
  const rfs = (data.fontScale && data.fontScale > 0 ? { "--rfs": data.fontScale } : {}) as CSSProperties;

  useLayoutEffect(() => {
    const meas = measRef.current;
    if (!meas) return;

    const pad = () => {
      const cs = getComputedStyle(meas);
      return { t: parseFloat(cs.paddingTop) || 0, b: parseFloat(cs.paddingBottom) || 0 };
    };
    const contentHeight = () => {
      const p = pad();
      return meas.getBoundingClientRect().height - p.t - p.b;
    };

    meas.style.width = `${PAGE_WIDTH}px`;
    meas.style.transform = "none";
    let p = pad();
    let budget = PAGE_HEIGHT - p.t - p.b;
    const total = contentHeight();

    // ---- fit-to-one-page (scaled) if it overflows only modestly ----
    let fit = 1;
    if (total > budget) {
      let s = budget / total;
      if (s >= READ_FLOOR) {
        for (let k = 0; k < 2; k++) {
          meas.style.width = `${PAGE_WIDTH / s}px`;
          p = pad();
          const b = PAGE_HEIGHT - p.t * s - p.b * s;
          const visual = contentHeight() * s;
          s = Math.min(1, (s * b) / visual);
        }
        fit = s >= READ_FLOOR ? s : 1;
        meas.style.width = `${PAGE_WIDTH}px`;
      }
    }

    if (fit < 1) {
      setScale(fit);
      setPages([rows.map((_, i) => i)]);
      onPages?.(1);
      meas.style.width = `${PAGE_WIDTH}px`;
      return;
    }

    // ---- multi-page: measure each row's top, then pack rows into pages ----
    p = pad();
    budget = PAGE_HEIGHT - p.t - p.b;
    const measRect = meas.getBoundingClientRect();
    const contentTop = measRect.top + p.t;
    const tops = new Array(rows.length).fill(0);
    meas.querySelectorAll<HTMLElement>("[data-ri]").forEach((el) => {
      const idx = Number(el.dataset.ri);
      if (!Number.isNaN(idx)) tops[idx] = el.getBoundingClientRect().top - contentTop;
    });
    const cH = measRect.height - p.t - p.b;
    const heights = rows.map((_, i) => Math.max(0, (i < rows.length - 1 ? tops[i + 1] : cH) - tops[i]));

    const result: number[][] = [[]];
    let used = 0;
    for (let i = 0; i < rows.length; i++) {
      const h = heights[i];
      if (used > 0 && used + h > budget) { result.push([]); used = 0; }
      result[result.length - 1].push(i);
      used += h;
    }
    // don't strand a heading / job header alone at the bottom of a page — a
    // keep-with-next row moves down to sit with the content it introduces
    for (let pg = 0; pg < result.length - 1; pg++) {
      let last = result[pg][result[pg].length - 1];
      while (result[pg].length > 1 && rows[last]?.keepWithNext) {
        result[pg].pop();
        result[pg + 1].unshift(last);
        last = result[pg][result[pg].length - 1];
      }
    }

    setScale(1);
    setPages(result);
    onPages?.(result.length);
    meas.style.width = `${PAGE_WIDTH}px`;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, variant]);

  return (
    <>
      <div className="resume-doc">
        {scale < 1 ? (
          // single page scaled to fit: wrapper holds the A4 footprint; the inner
          // résumé renders wider (W/scale) then scales down to fill it
          <div className="resume-fit">
            <div
              className={`resume resume--${variant}`}
              style={{ width: PAGE_WIDTH / scale, transform: `scale(${scale})`, transformOrigin: "top left", ...rfs }}
            >
              {renderRows(rows)}
            </div>
          </div>
        ) : (
          pages.map((idxs, pg) => (
            <div className={`resume resume--${variant}`} key={pg} style={rfs}>
              {renderRows(idxs.map((i) => rows[i]).filter(Boolean))}
            </div>
          ))
        )}
      </div>

      {/* off-screen measurer: full page width, auto height, unclipped */}
      <div
        ref={measRef}
        aria-hidden
        className={`resume resume--${variant}`}
        style={{
          position: "absolute",
          left: -99999,
          top: 0,
          width: PAGE_WIDTH,
          height: "auto",
          aspectRatio: "auto",
          overflow: "visible",
          visibility: "hidden",
          pointerEvents: "none",
          ...rfs,
        }}
      >
        {renderRows(rows, true)}
      </div>
    </>
  );
}
