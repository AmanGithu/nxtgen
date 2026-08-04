/* ============================================================
   <ScoreRing /> — circular ATS score dial.
   Ported from landing.js ring(). Tone (green/amber/red) is driven
   by the value via the .tone-* classes in design-system.css.
   ============================================================ */

interface ScoreRingProps {
  value: number;
  size: number;
  stroke: number;
  fontSize: number;
  /** optional small uppercase caption under the value, e.g. "ATS" */
  cap?: string;
}

export default function ScoreRing({ value, size, stroke, fontSize, cap }: ScoreRingProps) {
  const tone =
    value >= 75 ? "tone-success" : value >= 50 ? "tone-warning" : "tone-danger";
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const off = c * (1 - value / 100);

  return (
    <div className={`score-ring ${tone}`} style={{ width: size, height: size }}>
      <svg width={size} height={size}>
        <circle
          className="score-ring__track"
          cx={size / 2}
          cy={size / 2}
          r={r}
          strokeWidth={stroke}
        />
        <circle
          className="score-ring__fill"
          cx={size / 2}
          cy={size / 2}
          r={r}
          strokeWidth={stroke}
          strokeDasharray={c}
          strokeDashoffset={off}
        />
      </svg>
      <div className="score-ring__label">
        <span className="score-ring__value" style={{ fontSize }}>
          {value}
        </span>
        {cap ? <span className="score-ring__cap">{cap}</span> : null}
      </div>
    </div>
  );
}
