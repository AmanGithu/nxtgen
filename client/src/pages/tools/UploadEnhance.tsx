import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, Sparkles, Check, ArrowRight, RefreshCw } from 'lucide-react';
import { clsx } from 'clsx';
import { useAuth } from '../../hooks/useAuth';
import { sanitizeResumeData, type ResumeData } from '../../lib/resume/resumeData';
import { scoreReadiness } from '../../lib/resume/ats';
import { saveGuestResume, guestHeaders } from '../../lib/guestStore';
import { entitlementsFor } from '../../lib/entitlements';
import SignInGate from '../../components/SignInGate';

import '../../styles/resume/editor.css';
import '../../styles/resume/resume-workspace.css';
import '../../styles/resume/nxtgen-theme.css';

interface BulletRef {
  roleIndex: number;
  bulletIndex: number;
  company: string;
  original: string;
  improved?: string;
  status: 'idle' | 'working' | 'done' | 'error';
}

/**
 * Upload & Enhance — drop a CV, have it parsed, then rewrite its weakest
 * bullets side by side.
 *
 * Reuses the same import and bullet-rewrite endpoints the resume editor uses,
 * so an enhanced résumé is a normal résumé and opens straight in the editor.
 */
const UploadEnhance = () => {
  const { token } = useAuth();
  const navigate = useNavigate();
  const fileRef = useRef<HTMLInputElement>(null);

  const [resumeId, setResumeId] = useState<string | null>(null);
  const [data, setData] = useState<ResumeData | null>(null);
  const [bullets, setBullets] = useState<BulletRef[]>([]);
  const [fileName, setFileName] = useState('');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const ent = entitlementsFor(!!token);
  const [gate, setGate] = useState<null | 'save' | 'export' | 'premium-template' | 'extra-resume'>(null);

  /* Bullets that state no measurable result are the ones worth rewriting. */
  const weakest = (d: ResumeData): BulletRef[] => {
    const out: BulletRef[] = [];
    (d.experience ?? []).forEach((role, roleIndex) => {
      (role.bullets ?? []).forEach((b, bulletIndex) => {
        const text = (b || '').trim();
        if (text.length > 20 && !/\d/.test(text)) {
          out.push({
            roleIndex,
            bulletIndex,
            company: role.company || role.role || 'Experience',
            original: text,
            status: 'idle',
          });
        }
      });
    });
    return out.slice(0, 8);
  };

  const handleFile = (file: File) => {
    setFileName(file.name);
    setError('');
    setUploading(true);
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const base64 = (reader.result as string).split(',')[1];
        if (!token) {
          const res = await fetch('/api/guest/import', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', ...guestHeaders() },
            body: JSON.stringify({ fileBase64: base64, fileName: file.name, mimeType: file.type }),
          });
          const payload = await res.json();
          if (!res.ok) throw new Error(payload.message || 'Import failed');
          const clean = sanitizeResumeData(payload.data);
          setResumeId('guest');
          setData(clean);
          setBullets(weakest(clean));
          saveGuestResume(clean, 'modern', file.name.replace(/\.[^.]+$/, ''));
          return;
        }

        const res = await fetch('/api/resumes/import', {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ fileBase64: base64, fileName: file.name, mimeType: file.type, source: 'upload' }),
        });
        if (!res.ok) throw new Error(await res.text());
        const created = await res.json();
        setResumeId(created.id);

        const detail = await fetch(`/api/resumes/${created.id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const payload = await detail.json();
        const clean = sanitizeResumeData(payload.data || payload);
        setData(clean);
        setBullets(weakest(clean));
      } catch (err) {
        console.error('Upload failed:', err);
        setError('Could not read that file. Try a PDF or DOCX export of your résumé.');
      } finally {
        setUploading(false);
      }
    };
    reader.onerror = () => {
      setError('Could not read that file.');
      setUploading(false);
    };
    reader.readAsDataURL(file);
  };

  const enhance = async (index: number) => {
    if (!resumeId) return;
    setBullets((prev) => prev.map((b, i) => (i === index ? { ...b, status: 'working' } : b)));
    try {
      const res = await fetch(
        token ? `/api/resumes/${resumeId}/ai/rewrite-bullet` : '/api/guest/ai/rewrite-bullet',
        {
          method: 'POST',
          headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : guestHeaders()),
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ bullet: bullets[index].original, tone: 'impact' }),
        }
      );
      const payload = await res.json();
      if (res.status === 402) {
        setBullets((prev) => prev.map((b, i) => (i === index ? { ...b, status: 'idle' } : b)));
        setGate('save');
        return;
      }
      setBullets((prev) =>
        prev.map((b, i) =>
          i === index ? { ...b, improved: payload.text, status: payload.text ? 'done' : 'error' } : b
        )
      );
    } catch (err) {
      console.error('Enhance failed:', err);
      setBullets((prev) => prev.map((b, i) => (i === index ? { ...b, status: 'error' } : b)));
    }
  };

  const enhanceAll = () => bullets.forEach((_, i) => enhance(i));

  /** Write accepted rewrites back and hand off to the editor. */
  const applyAndOpen = async () => {
    if (!resumeId || !data) return;
    const next: ResumeData = JSON.parse(JSON.stringify(data));
    for (const b of bullets) {
      if (b.status === 'done' && b.improved) {
        next.experience[b.roleIndex].bullets[b.bulletIndex] = b.improved;
      }
    }
    if (!token) {
      // Guests keep the enhanced résumé in the browser; it migrates on sign-in.
      saveGuestResume(next, 'modern', fileName.replace(/\.[^.]+$/, '') || 'My résumé');
      navigate('/dashboard/tools/resume-builder');
      return;
    }
    try {
      await fetch(`/api/resumes/${resumeId}`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: next }),
      });
    } catch (err) {
      console.error('Failed to save enhancements:', err);
    }
    navigate('/dashboard/tools/resume-builder');
  };

  const readiness = data ? scoreReadiness(data) : null;
  const improvedCount = bullets.filter((b) => b.status === 'done').length;

  return (
    <div className="resume-workspace space-y-6">
      {gate && <SignInGate tier={ent.tier} action={gate} onClose={() => setGate(null)} />}
      <div>
        <h2 className="font-display text-2xl font-bold text-strong">Upload &amp; Enhance</h2>
        <p className="mt-1 text-sm text-text-muted">
          Drop your existing résumé — we&apos;ll parse it, find the bullets with no measurable result, and rewrite them.
        </p>
      </div>

      {!data && (
        <div
          onClick={() => fileRef.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            if (e.dataTransfer.files?.[0]) handleFile(e.dataTransfer.files[0]);
          }}
          className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-line-strong bg-bg-surface p-12 text-center transition-colors hover:border-brand-orange"
        >
          <Upload className="h-9 w-9 text-brand-orange" />
          <p className="mt-3 font-medium text-strong">
            {uploading ? 'Parsing your résumé…' : fileName || 'Drop your résumé here, or click to browse'}
          </p>
          <p className="mt-1 text-xs text-text-muted">PDF or DOCX</p>
          <input
            ref={fileRef}
            type="file"
            accept=".pdf,.docx"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
          />
        </div>
      )}

      {error && (
        <p className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-400">{error}</p>
      )}

      {data && (
        <>
          <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-line bg-bg-surface p-4">
            <div>
              <p className="font-semibold text-strong">{data.name || fileName}</p>
              <p className="text-xs text-text-muted">
                {(data.experience ?? []).length} role{(data.experience ?? []).length === 1 ? '' : 's'} parsed
                {readiness && ` · résumé strength ${readiness.score}%`}
                {bullets.length > 0 && ` · ${bullets.length} bullet${bullets.length === 1 ? '' : 's'} to strengthen`}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {bullets.length > 0 && (
                <button className="btn btn--secondary btn--sm" onClick={enhanceAll}>
                  <Sparkles /> Enhance all
                </button>
              )}
              <button className="btn btn--primary btn--sm" onClick={applyAndOpen}>
                {improvedCount > 0 ? `Apply ${improvedCount} & open editor` : 'Open in editor'} <ArrowRight />
              </button>
            </div>
          </div>

          {bullets.length === 0 ? (
            <div className="rounded-xl border border-line bg-bg-surface p-8 text-center">
              <Check size={24} className="mx-auto text-green-400" />
              <p className="mt-3 font-medium text-strong">Every bullet already states a result</p>
              <p className="mt-1 text-sm text-text-muted">Nothing obvious to strengthen — open it in the editor to keep refining.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {bullets.map((b, i) => (
                <div key={`${b.roleIndex}-${b.bulletIndex}`} className="rounded-xl border border-line bg-bg-surface p-4">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <span className="rounded bg-elevate px-2 py-0.5 text-[10px] uppercase tracking-wider text-text-muted">
                      {b.company}
                    </span>
                    <button
                      onClick={() => enhance(i)}
                      disabled={b.status === 'working'}
                      className="flex items-center gap-1.5 rounded-lg border border-line px-3 py-1.5 text-xs text-text-muted transition-colors hover:text-strong disabled:opacity-50"
                    >
                      {b.status === 'working' ? <RefreshCw size={12} className="animate-spin" /> : <Sparkles size={12} />}
                      {b.status === 'done' ? 'Rewrite again' : 'Enhance'}
                    </button>
                  </div>

                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    <div className="rounded-lg border border-line-subtle bg-bg-canvas p-3">
                      <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wider text-text-muted">Before</p>
                      <p className="text-xs leading-relaxed text-text-muted">{b.original}</p>
                    </div>
                    <div
                      className={clsx(
                        'rounded-lg border p-3',
                        b.improved ? 'border-brand-orange/30 bg-brand-orange/[0.06]' : 'border-line-subtle bg-bg-canvas'
                      )}
                    >
                      <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wider text-brand-orange">After</p>
                      <p className="text-xs leading-relaxed text-strong/90">
                        {b.improved ||
                          (b.status === 'error'
                            ? 'Could not rewrite this one — try again.'
                            : 'Press Enhance to rewrite this bullet with a measurable result.')}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default UploadEnhance;
