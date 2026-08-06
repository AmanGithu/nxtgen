import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, FileText, Check } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import ScoreRing from '../../components/resume/ScoreRing';
import { scoreResume, extractKeywords } from '../../lib/resume/ats';
import { sanitizeResumeData, type ResumeData } from '../../lib/resume/resumeData';
import { readGuestResume, saveGuestResume } from '../../lib/guestStore';
import {
  injectKeyword,
  buildSuggestions,
  suggestionsToRender,
  type SuggestionStatus,
} from '../../lib/resume/tailor';

import '../../styles/resume/editor.css';
import '../../styles/resume/resume-workspace.css';
import '../../styles/resume/nxtgen-theme.css';

interface ResumeSummary {
  id: string;
  title: string;
}

const toneFor = (n: number) => (n >= 75 ? 'success' : n >= 50 ? 'warning' : 'danger');

/**
 * Standalone JD Tailor.
 *
 * Same keyword analysis and injection logic as the resume editor — accepting a
 * suggestion rewrites the résumé and PATCHes it back, so changes show up in the
 * editor and in the ATS score immediately.
 */
const JDTailor = () => {
  const { token } = useAuth();
  const [resumes, setResumes] = useState<ResumeSummary[]>([]);
  const [activeId, setActiveId] = useState('');
  const [data, setData] = useState<ResumeData | null>(null);
  const [template, setTemplate] = useState('classic');
  const [jd, setJd] = useState(() => localStorage.getItem('atsJd') || '');
  const [sugStatus, setSugStatus] = useState<Record<string, SuggestionStatus>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toastMsg, setToastMsg] = useState('');

  const toast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 2200);
  };

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
    (async () => {
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
    })();
  }, [token]);

  useEffect(() => {
    if (!activeId || !token) return;
    (async () => {
      try {
        const res = await fetch(`/api/resumes/${activeId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const payload = await res.json();
          setData(sanitizeResumeData(payload.data || payload));
          setTemplate(payload.template || 'classic');
          setSugStatus({});
        }
      } catch (err) {
        console.error('Failed to load resume:', err);
      }
    })();
  }, [activeId, token]);

  useEffect(() => {
    localStorage.setItem('atsJd', jd);
  }, [jd]);

  const atsKeywords = useMemo(() => (jd.trim() ? extractKeywords(jd) : []), [jd]);
  const analysis = useMemo(
    () => (data && atsKeywords.length ? scoreResume(data, atsKeywords, 'all') : null),
    [data, atsKeywords]
  );
  const suggestions = useMemo(
    () => (analysis ? buildSuggestions(analysis.missing, sugStatus) : []),
    [analysis, sugStatus]
  );
  const visible = analysis ? suggestionsToRender(suggestions, analysis.score) : [];

  /** Apply injections locally, then persist so the editor sees them. */
  const applyAndSave = async (list: { id: string; keyword: string; section: string }[]) => {
    if (!data || !list.length) return;
    const next: ResumeData = JSON.parse(JSON.stringify(data));
    list.forEach((s) => injectKeyword(next, s.keyword, s.section));
    setData(next);
    setSugStatus((prev) => {
      const out = { ...prev };
      for (const s of list) out[s.id] = 'accepted';
      return out;
    });

    if (!token) {
      // Guests keep tailored changes locally; they migrate on sign-in.
      saveGuestResume(next, template, resumes[0]?.title || 'My résumé');
      toast(`Injected ${list.length} keyword${list.length === 1 ? '' : 's'} ✦`);
      return;
    }

    setSaving(true);
    try {
      const res = await fetch(`/api/resumes/${activeId}`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: next, template, jd }),
      });
      toast(
        res.ok
          ? `Injected ${list.length} keyword${list.length === 1 ? '' : 's'} ✦`
          : 'Saved locally, but the server rejected the update'
      );
    } catch (err) {
      console.error('Failed to save tailored resume:', err);
      toast('Could not save your changes');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="text-text-muted">Loading your resumes…</div>;

  if (!resumes.length) {
    return (
      <div className="rounded-xl border border-line bg-bg-surface p-10 text-center">
        <FileText size={28} className="mx-auto text-text-muted" />
        <p className="mt-3 font-medium text-strong">No resumes yet</p>
        <p className="mt-1 text-sm text-text-muted">
          Build or import a resume first, then tailor it to a specific job description.
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

  return (
    <div className="resume-workspace space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl font-bold text-strong">JD Resume Tailor</h2>
          <p className="mt-1 text-sm text-text-muted">
            Paste a job description to see coverage gaps, then inject missing keywords in one click.
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

      <div className="field">
        <label className="field__label">Target job description</label>
        <textarea
          className="textarea"
          style={{ minHeight: 150 }}
          value={jd}
          placeholder="Paste the role's requirements to check your real ATS match…"
          onChange={(e) => setJd(e.target.value)}
          spellCheck={false}
        />
        <span className="field__help">
          Scored with the same keyword &amp; coverage checks recruiters&apos; software runs — no AI call needed.
        </span>
      </div>

      {analysis && (
        <div className="ats-panel__hero">
          <ScoreRing value={analysis.score} size={88} stroke={9} fontSize={25} cap="Match" />
          <div className="ats-panel__hero-txt">
            <span className={`badge badge--${toneFor(analysis.score)}`}>
              <span className="badge__dot" /> {analysis.matched}/{analysis.total} keywords matched
            </span>
            {analysis.missing.length > 0 && (
              <div className="jd-missing" style={{ margin: 0 }}>
                <div className="jd-missing__lbl">Missing keywords</div>
                <div className="jd-missing__chips">
                  {analysis.missing.filter((m) => m.prio === 'high').map((k) => (
                    <span key={k.label} className="jd-kw jd-kw--high">{k.label}</span>
                  ))}
                  {analysis.missing.filter((m) => m.prio !== 'high').map((k) => (
                    <span key={k.label} className="jd-kw">{k.label}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="tailor-sug__bar">
        <span className="dock__lbl">Recommended adjustments</span>
        {visible.length > 1 && (
          <button className="btn btn--primary btn--sm" disabled={saving} onClick={() => applyAndSave(visible)}>
            <Check /> Accept all ({visible.length})
          </button>
        )}
      </div>

      {visible.length > 0 ? (
        visible.map((s) => (
          <div key={s.id} className="tailor-sug">
            <span className="tailor-sug__tag">{s.section} inject</span>
            <p className="tailor-sug__txt">{s.text}</p>
            <div className="tailor-sug__acts">
              <button className="btn btn--primary btn--sm" disabled={saving} onClick={() => applyAndSave([s])}>
                <Check /> Accept
              </button>
              <button
                className="btn btn--ghost btn--sm"
                onClick={() => setSugStatus((prev) => ({ ...prev, [s.id]: 'rejected' }))}
              >
                Reject
              </button>
            </div>
          </div>
        ))
      ) : (
        <div className="tailor-empty">
          <div className="tailor-empty__title">
            {atsKeywords.length ? '✦ Résumé is ATS-optimised ✦' : 'Paste a job description above'}
          </div>
          <p className="dock__note" style={{ marginTop: 6 }}>
            {atsKeywords.length
              ? 'No coverage gaps detected for this description.'
              : "You'll get a live match score and one-click keyword fixes."}
          </p>
        </div>
      )}

      <div className={`toast${toastMsg ? ' show' : ''}`}>
        <span>{toastMsg}</span>
      </div>
    </div>
  );
};

export default JDTailor;
