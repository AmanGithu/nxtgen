import type { CSSProperties } from "react";
import type { ThumbSpec } from "../../lib/resume/templates";

/* ============================================================
   <TemplateThumb /> — a content-free schematic of a template's
   layout. It draws the *structure* (header placement, one vs two
   columns + sidebar side, accent colour, heading style) with
   placeholder bars, so the picker communicates layout at a glance
   and scales to a large catalogue without dummy résumé text.
   Purely presentational; driven by the template's ThumbSpec.
   ============================================================ */

const INK = "#c9c4b8"; // neutral placeholder text line
const INK_SOFT = "#ddd9cf";

function Line({ w, c = INK, h = 3, mb = 3 }: { w: string | number; c?: string; h?: number; mb?: number }) {
  return <div style={{ width: w, height: h, borderRadius: 2, background: c, marginBottom: mb }} />;
}

function Lines({ n, dense }: { n: number; dense?: boolean }) {
  const widths = ["100%", "92%", "97%", "85%", "95%", "78%", "90%"];
  return (
    <>
      {Array.from({ length: n }).map((_, i) => (
        <Line key={i} w={widths[i % widths.length]} h={dense ? 2 : 2.5} mb={dense ? 2 : 3} />
      ))}
    </>
  );
}

/** A section heading rendered in the template's heading style. */
function Heading({ spec, w = "42%" }: { spec: ThumbSpec; w?: string }) {
  const a = spec.accent;
  if (spec.heading === "fill")
    return <div style={{ background: a, height: 7, width: w, borderRadius: 2, margin: "0 0 5px" }} />;
  if (spec.heading === "leftbar")
    return (
      <div style={{ display: "flex", gap: 4, alignItems: "center", margin: "0 0 5px" }}>
        <div style={{ width: 3, height: 7, background: a, borderRadius: 1 }} />
        <div style={{ width: w, height: 4, background: a, borderRadius: 2 }} />
      </div>
    );
  if (spec.heading === "hash")
    return (
      <div style={{ display: "flex", gap: 3, alignItems: "center", margin: "0 0 5px" }}>
        <div style={{ width: 4, height: 4, background: a, borderRadius: 1 }} />
        <div style={{ width: w, height: 4, background: a, borderRadius: 2 }} />
      </div>
    );
  // underline (short accent rule) or rule (full hairline under the label)
  return (
    <div style={{ margin: "0 0 5px" }}>
      <div style={{ width: w, height: 4, background: a, borderRadius: 2, marginBottom: 2.5 }} />
      <div style={{ width: spec.heading === "underline" ? w : "100%", height: 1, background: spec.heading === "underline" ? a : INK_SOFT }} />
    </div>
  );
}

function Header({ spec }: { spec: ThumbSpec }) {
  const centered = spec.name === "center";
  const align: CSSProperties = { display: "flex", flexDirection: "column", alignItems: centered ? "center" : "flex-start" };
  const nameStyle: CSSProperties = {
    width: centered ? "52%" : "44%",
    height: 8,
    borderRadius: 2,
    background: spec.band ? "#fff" : spec.accent,
    marginBottom: 4,
    fontFamily: spec.serif ? "Georgia, serif" : undefined,
  };
  const dots = (
    <div style={{ display: "flex", gap: 3, justifyContent: centered ? "center" : "flex-start", width: "100%", marginBottom: 5 }}>
      {[26, 20, 24].map((w, i) => (
        <div key={i} style={{ width: w, height: 3, borderRadius: 2, background: spec.band ? "rgba(255,255,255,.6)" : INK }} />
      ))}
    </div>
  );

  if (spec.band)
    return (
      <div style={{ background: spec.accent, padding: "10px 10px 8px", margin: "-11px -11px 9px", ...align }}>
        <div style={nameStyle} />
        {dots}
      </div>
    );

  return (
    <div style={{ ...align, marginBottom: 8, paddingBottom: 7, borderBottom: `1.5px solid ${spec.accent}` }}>
      <div style={nameStyle} />
      {dots}
    </div>
  );
}

/** A stack of mini-sections (heading + a few lines) for one column. */
function Sections({ spec, count, dense }: { spec: ThumbSpec; count: number; dense?: boolean }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} style={{ marginBottom: dense ? 7 : 9 }}>
          <Heading spec={spec} w={dense ? "60%" : "46%"} />
          <Lines n={dense ? 3 : i === 0 ? 2 : 3} dense={dense} />
        </div>
      ))}
    </>
  );
}

export default function TemplateThumb({ spec }: { spec: ThumbSpec }) {
  const pad = 11;
  const shell: CSSProperties = {
    position: "absolute",
    inset: 0,
    padding: pad,
    background: "#fff",
    overflow: "hidden",
    fontSize: 0,
  };

  if (spec.columns === 2) {
    const sideOnLeft = spec.sidebar === "left";
    const darkRail = spec.accent === "#1f2a37"; // the "sidebar" template's filled dark rail
    const rail = (
      <div
        style={{
          flex: "0 0 34%",
          background: darkRail ? spec.accent : "#f3f1ec",
          borderRadius: 3,
          padding: 7,
          alignSelf: "stretch",
        }}
      >
        {/* headings/lines tinted for the dark rail */}
        <Sections spec={darkRail ? { ...spec, accent: "#ffffff", heading: "rule" } : spec} count={3} dense />
      </div>
    );
    const main = (
      <div style={{ flex: 1, minWidth: 0, padding: sideOnLeft ? "0 0 0 8px" : "0 8px 0 0" }}>
        <Sections spec={spec} count={3} />
      </div>
    );
    return (
      <div style={shell}>
        <Header spec={spec} />
        <div style={{ display: "flex", gap: 2 }}>
          {sideOnLeft ? (
            <>
              {rail}
              {main}
            </>
          ) : (
            <>
              {main}
              {rail}
            </>
          )}
        </div>
      </div>
    );
  }

  // single column
  return (
    <div style={shell}>
      <Header spec={spec} />
      <Sections spec={spec} count={4} dense={spec.accent === "#2a2a2a" /* compact = denser */} />
    </div>
  );
}
