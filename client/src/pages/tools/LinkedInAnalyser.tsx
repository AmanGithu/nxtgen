import { useState, useRef } from 'react';
import { Upload, Sparkles, Copy, Check, AlertTriangle, Info, Lightbulb, Globe, FileText } from 'lucide-react';
import { clsx } from 'clsx';
import { useAuth } from '../../hooks/useAuth';
import ScoreRing from '../../components/resume/ScoreRing';
import { guestHeaders } from '../../lib/guestStore';

import '../../styles/resume/editor.css';
import '../../styles/resume/resume-workspace.css';
import '../../styles/resume/nxtgen-theme.css';

type Severity = 'high' | 'medium' | 'low';

interface Suggestion {
  section: string;
  severity: Severity;
  title: string;
  detail: string;
  example?: string;
  exampleLabel?: string;
  copyText?: string;
}

interface SectionScore {
  score: number;
  max: number;
  label: string;
}

interface CvLink {
  supplied: boolean;
  matched: boolean;
  cvName: string;
  profileName: string;
  message: string;
}

interface Analysis {
  overall: number;
  sections: Record<'headline' | 'about' | 'experience' | 'skills', SectionScore>;
  suggestions: Suggestion[];
  keywords: { matched: string[]; missing: string[] };
  rewrites: { headlines: string[]; about: string | null };
  parsed: { name: string; headline: string; roles: number; skills: number };
  looksLikeLinkedInExport: boolean;
  cv: CvLink;
}

const SECTION_LABELS: Record<string, string> = {
  headline: 'Headline',
  about: 'About',
  experience: 'Experience',
  skills: 'Skills',
};

const SEVERITY_ICON: Record<Severity, typeof AlertTriangle> = {
  high: AlertTriangle,
  medium: Info,
  low: Lightbulb,
};

const toneFor = (n: number) => (n >= 75 ? 'success' : n >= 50 ? 'warning' : 'danger');

const LinkedInAnalyser = () => {
  const { token } = useAuth();
  const [inputMode, setInputMode] = useState<'pdf' | 'text'>('pdf');
  const [profileText, setProfileText] = useState('');
  const [fileName, setFileName] = useState('');
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const cvRef = useRef<HTMLInputElement>(null);
  const [cvBase64, setCvBase64] = useState<string | null>(null);
  const [cvName, setCvName] = useState('');
  const [cvMime, setCvMime] = useState('');

  const post = async (body: Record<string, unknown>) => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/linkedin/analyse', {
        method: 'POST',
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : guestHeaders()),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(
          cvBase64
            ? { ...body, resumeBase64: cvBase64, resumeFileName: cvName, resumeMimeType: cvMime }
            : body
        ),
      });
      const payload = await res.json();
      if (res.ok && payload.success) {
        setAnalysis(payload.analysis);
      } else {
        setError(payload.message || 'Could not analyse that profile.');
      }
    } catch (err) {
      console.error('LinkedIn analysis failed:', err);
      setError('Could not reach the analyser. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleFile = (file: File) => {
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = (reader.result as string).split(',')[1];
      post({ fileBase64: base64, fileName: file.name, mimeType: file.type });
    };
    reader.onerror = () => setError('Could not read that file.');
    reader.readAsDataURL(file);
  };

  const copy = (text: string, idx: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 1600);
  };

  const copyDraft = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 1600);
  };

  return (
    <div className="resume-workspace space-y-6">
      <div>
        <h2 className="font-display text-2xl font-bold text-strong">LinkedIn Profile Analyser</h2>
        <p className="mt-1 text-sm text-text-muted">
          Upload your profile PDF or paste the text, and get specific fixes to make it rank and read better.
        </p>
      </div>

      {/* Input mode toggle */}
      <div className="flex flex-wrap gap-3">
        {(['pdf', 'text'] as const).map((mode) => (
          <button
            key={mode}
            onClick={() => setInputMode(mode)}
            className={clsx(
              'flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-semibold transition-colors',
              inputMode === mode
                ? 'border-brand-orange bg-brand-orange/10 text-brand-orange'
                : 'border-line bg-bg-surface text-text-muted hover:text-strong'
            )}
          >
            <span
              className={clsx(
                'h-3 w-3 rounded-full border-2',
                inputMode === mode ? 'border-brand-orange bg-brand-orange' : 'border-line-strong'
              )}
            />
            {mode === 'pdf' ? 'Upload LinkedIn Profile PDF' : 'Paste Raw Text'}
          </button>
        ))}
      </div>

      {/* Optional CV — when the name matches, drafts quote real achievements
          instead of bracketed placeholders. */}
      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-line bg-bg-surface p-4">
        <FileText size={18} className="text-brand-orange" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-strong">
            Optional: add your CV for specific drafts
          </p>
          <p className="text-xs text-text-muted">
            {cvName
              ? `Using ${cvName} — it must be the same person as the profile.`
              : 'Without it, drafts use [placeholders] you fill in yourself.'}
          </p>
        </div>
        <button
          onClick={() => cvRef.current?.click()}
          className="rounded-lg border border-line px-3 py-1.5 text-xs font-semibold text-text-muted transition-colors hover:text-strong"
        >
          {cvName ? 'Change CV' : 'Attach CV'}
        </button>
        {cvName && (
          <button
            onClick={() => { setCvBase64(null); setCvName(''); setCvMime(''); }}
            className="rounded-lg border border-line px-3 py-1.5 text-xs text-text-muted transition-colors hover:text-strong"
          >
            Remove
          </button>
        )}
        <input
          ref={cvRef}
          type="file"
          accept=".pdf,.docx"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (!f) return;
            const r = new FileReader();
            r.onload = () => {
              setCvBase64((r.result as string).split(',')[1]);
              setCvName(f.name);
              setCvMime(f.type);
            };
            r.readAsDataURL(f);
          }}
        />
      </div>

      {inputMode === 'pdf' ? (
        <div
          onClick={() => fileRef.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            if (e.dataTransfer.files?.[0]) handleFile(e.dataTransfer.files[0]);
          }}
          className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-line-strong bg-bg-surface p-10 text-center transition-colors hover:border-brand-orange"
        >
          <Upload className="h-8 w-8 text-brand-orange" />
          <p className="mt-3 text-sm font-medium text-strong">
            {fileName || 'Drop your LinkedIn PDF here, or click to browse'}
          </p>
          <p className="mt-1 text-xs text-text-muted">
            On LinkedIn: your profile → More → Save to PDF
          </p>
          <input
            ref={fileRef}
            type="file"
            accept=".pdf,.docx"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
          />
        </div>
      ) : (
        <div className="field">
          <label className="field__label">Profile text</label>
          <textarea
            className="textarea"
            style={{ minHeight: 200 }}
            value={profileText}
            placeholder="Paste your headline, About section and experience here…"
            onChange={(e) => setProfileText(e.target.value)}
            spellCheck={false}
          />
          <button
            className="btn btn--primary btn--sm"
            style={{ marginTop: 12 }}
            disabled={loading || profileText.trim().length < 40}
            onClick={() => post({ text: profileText })}
          >
            <Sparkles /> {loading ? 'Analysing…' : 'Analyse profile'}
          </button>
        </div>
      )}

      {loading && <p className="text-sm text-text-muted">Analysing your profile…</p>}

      {error && (
        <p className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-400">{error}</p>
      )}

      {analysis && !loading && (
        <div className="space-y-6">
          {analysis.cv.supplied && (
            <p
              className={clsx(
                'rounded-lg border p-3 text-xs',
                analysis.cv.matched
                  ? 'border-green-500/30 bg-green-500/10 text-green-400'
                  : 'border-amber-500/30 bg-amber-500/10 text-amber-400'
              )}
            >
              {analysis.cv.message}
            </p>
          )}

          {!analysis.looksLikeLinkedInExport && (
            <p className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-400">
              This doesn&apos;t look like a LinkedIn export, so section detection may be less accurate.
              For best results use <b>More → Save to PDF</b> on your profile.
            </p>
          )}

          {/* Overall + section scores */}
          <div className="ats-panel__hero">
            <ScoreRing value={analysis.overall} size={104} stroke={10} fontSize={30} cap="Profile" />
            <div className="ats-panel__hero-txt">
              <span className={`badge badge--${toneFor(analysis.overall)}`}>
                <span className="badge__dot" />
                {analysis.parsed.name || 'Profile'} · {analysis.parsed.roles} role
                {analysis.parsed.roles === 1 ? '' : 's'} detected
              </span>
              <p className="dock__note" style={{ margin: 0 }}>
                Weighted across headline, About, experience and skills — headline and About carry the most
                search weight.
              </p>
            </div>
          </div>

          <div className="ats-panel__stats">
            {(Object.keys(SECTION_LABELS) as Array<keyof typeof analysis.sections>).map((key) => (
              <div key={key} className="ats-stat">
                <div className="ats-stat__num">{analysis.sections[key].score}</div>
                <div className="ats-stat__lbl">
                  {SECTION_LABELS[key]} · {analysis.sections[key].label}
                </div>
              </div>
            ))}
          </div>

          {/* Suggestions */}
          <div>
            <span className="dock__lbl">What to fix</span>
            <div className="mt-3 space-y-3">
              {analysis.suggestions.length === 0 ? (
                <p className="dock__note">Nothing major to fix — your profile covers the essentials.</p>
              ) : (
                analysis.suggestions.map((s, i) => {
                  const Icon = SEVERITY_ICON[s.severity];
                  return (
                    <div
                      key={`${s.section}-${i}`}
                      className={clsx(
                        'flex gap-3 rounded-xl border bg-bg-surface p-4',
                        s.severity === 'high'
                          ? 'border-red-500/30'
                          : s.severity === 'medium'
                          ? 'border-amber-500/25'
                          : 'border-line'
                      )}
                    >
                      <Icon
                        size={18}
                        className={clsx(
                          'mt-0.5 shrink-0',
                          s.severity === 'high'
                            ? 'text-red-400'
                            : s.severity === 'medium'
                            ? 'text-amber-400'
                            : 'text-text-muted'
                        )}
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-strong">{s.title}</p>
                        <p className="mt-1 text-xs leading-relaxed text-text-muted">{s.detail}</p>
                        {s.example && (
                          <div className="mt-3 rounded-lg border border-line bg-bg-canvas p-3">
                            <div className="flex items-center justify-between gap-3">
                              <span className="text-[10px] font-bold uppercase tracking-wider text-brand-orange">
                                {s.exampleLabel || 'Try this'}
                              </span>
                              <button
                                onClick={() => copyDraft(s.copyText ?? s.example!, `${s.section}-${i}`)}
                                className="flex shrink-0 items-center gap-1.5 rounded border border-line px-2 py-1 text-[10px] text-text-muted transition-colors hover:text-strong"
                              >
                                {copiedKey === `${s.section}-${i}` ? <Check size={11} /> : <Copy size={11} />}
                                {copiedKey === `${s.section}-${i}` ? 'Copied' : 'Copy'}
                              </button>
                            </div>
                            <pre className="mt-2 whitespace-pre-wrap font-sans text-xs leading-relaxed text-strong/90">
{s.example}
                            </pre>
                          </div>
                        )}
                        <span className="mt-3 inline-block rounded bg-elevate px-2 py-0.5 text-[10px] uppercase tracking-wider text-text-muted">
                          {s.section}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* AI headline rewrites */}
          {analysis.rewrites.headlines.length > 0 && (
            <div>
              <span className="dock__lbl">Suggested headlines</span>
              <div className="mt-3 space-y-2">
                {analysis.rewrites.headlines.map((h, i) => (
                  <div
                    key={i}
                    className="flex items-start justify-between gap-3 rounded-xl border border-line bg-bg-surface p-4"
                  >
                    <p className="text-sm text-strong">{h}</p>
                    <button
                      onClick={() => copy(h, i)}
                      className="flex shrink-0 items-center gap-1.5 rounded-lg border border-line px-3 py-1.5 text-xs text-text-muted transition-colors hover:text-strong"
                    >
                      {copiedIdx === i ? <Check size={13} /> : <Copy size={13} />}
                      {copiedIdx === i ? 'Copied' : 'Copy'}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Keyword coverage */}
          {analysis.keywords.missing.length > 0 && (
            <div className="jd-missing" style={{ margin: 0 }}>
              <div className="jd-missing__lbl">
                Keywords absent from your profile ({analysis.keywords.matched.length} already covered)
              </div>
              <div className="jd-missing__chips">
                {analysis.keywords.missing.map((k) => (
                  <span key={k} className="jd-kw">{k}</span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {!analysis && !loading && (
        <div className="rounded-xl border border-line bg-bg-surface p-10 text-center">
          <Globe size={28} className="mx-auto text-text-muted" />
          <p className="mt-3 font-medium text-strong">No analysis yet</p>
          <p className="mt-1 text-sm text-text-muted">
            Upload your profile PDF or paste your text above to get started.
          </p>
        </div>
      )}
    </div>
  );
};

export default LinkedInAnalyser;
