import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, FileText } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import ScoreRing from '../../components/resume/ScoreRing';
import {
  scoreResume,
  extractKeywords,
  sectionCoverage,
  GENERIC_JD,
} from '../../lib/resume/ats';
import { sanitizeResumeData, type ResumeData } from '../../lib/resume/resumeData';
import { readGuestResume } from '../../lib/guestStore';

import '../../styles/resume/editor.css';
import '../../styles/resume/resume-workspace.css';
import '../../styles/resume/nxtgen-theme.css';

interface ResumeSummary {
  id: string;
  title: string;
}

const toneFor = (n: number) => (n >= 75 ? 'success' : n >= 50 ? 'warning' : 'danger');

/**
 * Standalone ATS Score Checker.
 *
 * Scoring is the same `ats.ts` the resume editor uses — this page is simply
 * where a job description gets pasted. With no description it falls back to a
 * generic role profile and scores summary + experience only, which is exactly
 * what the live chip in the editor topbar reports.
 */
const ATSChecker = () => {
  const { token } = useAuth();
  const [resumes, setResumes] = useState<ResumeSummary[]>([]);
  const [activeId, setActiveId] = useState<string>('');
  const [data, setData] = useState<ResumeData | null>(null);
  const [jd, setJd] = useState(() => localStorage.getItem('atsJd') || '');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) {
      // Guests have no saved résumés — use whatever they've built in the
      // browser so the tool still works before they sign up.
      const stored = readGuestResume();
      if (stored) {
        setResumes([{ id: 'guest', title: stored.title }]);
        setActiveId('guest');
        setData(sanitizeResumeData(stored.data));
      }
      setLoading(false);
      return;
    }
    const load = async () => {
      try {
        const res = await fetch('/api/resumes', { headers: { Authorization: `Bearer ${token}` } });
        if (res.ok) {
          const list = await res.json();
          setResumes(list);
          if (list.length) setActiveId(list[0].id);
        }
      } catch (err) {
        console.error('Failed to load resumes:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [token]);

  useEffect(() => {
    if (!activeId || !token) return;
    const load = async () => {
      try {
        const res = await fetch(`/api/resumes/${activeId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const payload = await res.json();
          setData(sanitizeResumeData(payload.data || payload));
        }
      } catch (err) {
        console.error('Failed to load resume:', err);
      }
    };
    load();
  }, [activeId, token]);

  // Shared with the editor so both screens report the same score.
  useEffect(() => {
    localStorage.setItem('atsJd', jd);
  }, [jd]);

  const atsKeywords = useMemo(() => (jd.trim() ? extractKeywords(jd) : []), [jd]);
  const usingGenericJd = atsKeywords.length === 0;
  const scoreKeywords = useMemo(
    () => (usingGenericJd ? extractKeywords(GENERIC_JD) : atsKeywords),
    [usingGenericJd, atsKeywords]
  );
  const atsAnalysis = useMemo(
    () => (data ? scoreResume(data, scoreKeywords, usingGenericJd ? 'core' : 'all') : null),
    [data, scoreKeywords, usingGenericJd]
  );
  const atsCoverage = useMemo(
    () => (data ? sectionCoverage(data, scoreKeywords) : null),
    [data, scoreKeywords]
  );

  if (loading) {
    return <div className="text-text-muted">Loading your resumes…</div>;
  }

  if (!resumes.length) {
    return (
      <div className="rounded-xl border border-line bg-bg-surface p-10 text-center">
        <FileText size={28} className="mx-auto text-text-muted" />
        <p className="mt-3 font-medium text-strong">No resumes yet</p>
        <p className="mt-1 text-sm text-text-muted">
          Build or import a resume first, then come back to score it against a job description.
        </p>
        <Link
          to="/dashboard/tools/resume-builder"
          className="mt-5 inline-flex items-center gap-2 rounded-lg bg-brand-orange px-4 py-2 text-sm font-semibold text-on-brand transition-colors hover:bg-orange-600"
        >
          <ArrowLeft size={16} />
          Go to Resume Builder
        </Link>
      </div>
    );
  }

  const atsTone = atsAnalysis ? toneFor(atsAnalysis.score) : 'danger';

  return (
    <div className="resume-workspace space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl font-bold text-strong">ATS Score Checker</h2>
          <p className="mt-1 text-sm text-text-muted">
            Paste a job description to score your resume against it. Leave it empty for a generic role profile.
          </p>
        </div>
        <select
          value={activeId}
          onChange={(e) => setActiveId(e.target.value)}
          className="rounded-lg border border-line bg-bg-card px-3 py-2 text-sm text-strong focus:border-brand-orange focus:outline-none"
        >
          {resumes.map((r) => (
            <option key={r.id} value={r.id}>{r.title}</option>
          ))}
        </select>
      </div>

      {atsAnalysis && atsCoverage && (
        <div className="ats-panel">
          <div className="ats-panel__hero">
            <ScoreRing value={atsAnalysis.score} size={104} stroke={10} fontSize={30} cap="ATS" />
            <div className="ats-panel__hero-txt">
              <span className={`badge badge--${atsTone}`}>
                <span className="badge__dot" /> {atsAnalysis.matched}/{atsAnalysis.total} keywords matched
              </span>
              <p className="dock__note" style={{ margin: 0 }}>
                {usingGenericJd ? (
                  <>Measured on your <b>summary and experience</b> against a generic role profile.</>
                ) : (
                  <>Measured on your <b>whole résumé</b> against the job description below.</>
                )}
              </p>
            </div>
          </div>

          <div className="field">
            <label className="field__label">Job description</label>
            <textarea
              className="textarea"
              style={{ minHeight: 160 }}
              value={jd}
              placeholder="Paste a job description to score against it — leave empty to use a generic role profile…"
              onChange={(e) => setJd(e.target.value)}
              spellCheck={false}
            />
            <span className="field__help">
              {usingGenericJd
                ? 'Empty — scoring summary + experience against a generic role profile.'
                : 'Scoring the whole résumé against your description. Shared with the editor.'}
            </span>
          </div>

          {usingGenericJd && (
            <div>
              <span className="dock__lbl">Where the score comes from</span>
              <div className="ats-split" style={{ marginTop: 8 }}>
                <div className="ats-split__row">
                  <span className="ats-split__name">Summary</span>
                  <div className="ats-split__bar"><i style={{ width: `${atsCoverage.summary.pct}%` }} /></div>
                  <span className="ats-split__val">{atsCoverage.summary.pct}%</span>
                </div>
                <div className="ats-split__row">
                  <span className="ats-split__name">Experience</span>
                  <div className="ats-split__bar"><i style={{ width: `${atsCoverage.experience.pct}%` }} /></div>
                  <span className="ats-split__val">{atsCoverage.experience.pct}%</span>
                </div>
              </div>
            </div>
          )}

          <div className="ats-panel__stats">
            <div className="ats-stat">
              <div className="ats-stat__num">{atsAnalysis.total}</div>
              <div className="ats-stat__lbl">Keywords</div>
            </div>
            <div className="ats-stat">
              <div className="ats-stat__num">{atsAnalysis.matched}</div>
              <div className="ats-stat__lbl">Matched</div>
            </div>
            <div className="ats-stat">
              <div className="ats-stat__num">{atsAnalysis.missing.length}</div>
              <div className="ats-stat__lbl">Missing</div>
            </div>
          </div>

          {atsAnalysis.missing.length > 0 ? (
            <div className="jd-missing" style={{ margin: 0 }}>
              <div className="jd-missing__lbl">
                {usingGenericJd ? 'Not evidenced in summary or experience' : 'Missing from your résumé'}
              </div>
              <div className="jd-missing__chips">
                {atsAnalysis.missing.filter((m) => m.prio === 'high').map((k) => (
                  <span key={k.label} className="jd-kw jd-kw--high">{k.label}</span>
                ))}
                {atsAnalysis.missing.filter((m) => m.prio !== 'high').map((k) => (
                  <span key={k.label} className="jd-kw">{k.label}</span>
                ))}
              </div>
            </div>
          ) : (
            <p className="dock__note">
              {usingGenericJd
                ? 'Every keyword is already evidenced in your summary or experience.'
                : 'Every keyword from this description is already covered.'}
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default ATSChecker;
