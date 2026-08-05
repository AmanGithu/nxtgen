import { useState, useEffect } from 'react';
import { internshipsAPI } from '../services/api';
import { Briefcase, Calendar, CheckCircle2, Upload, X, Bot, Cpu } from 'lucide-react';

interface ProjectHighlight {
  title: string;
  description: string;
}

interface Internship {
  id: string;
  title: string;
  description: string;
  programType: 'GENERATIVE_AI' | 'AGENTIC_AI';
  duration: string;
  eligibility: string | null;
  learningOutcomes: string[] | null;
  projectHighlights: ProjectHighlight[] | null;
  applicationLink: string | null;
}

const InternshipPage = () => {
  const [internships, setInternships] = useState<Internship[]>([]);
  const [loading, setLoading] = useState(true);

  // Apply Modal state
  const [selectedInternship, setSelectedInternship] = useState<Internship | null>(null);
  const [applyForm, setApplyForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    resumeFileName: '',
  });
  const [resumeFile, setResumeFile] = useState<{ base64: string; name: string; type: string } | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [applyError, setApplyError] = useState('');
  const [applying, setApplying] = useState(false);

  useEffect(() => {
    fetchInternships();
  }, []);

  const fetchInternships = async () => {
    setLoading(true);
    try {
      const res = await internshipsAPI.getAll();
      if (res.data.success) {
        setInternships(res.data.internships);
      }
    } catch (err) {
      console.error('Failed to fetch internships:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleApplySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInternship) return;

    setApplyError('');
    setApplying(true);
    try {
      await internshipsAPI.apply({
        internshipId: selectedInternship.id,
        programTitle: selectedInternship.title,
        fullName: applyForm.fullName.trim(),
        email: applyForm.email.trim(),
        phone: applyForm.phone.trim(),
        ...(resumeFile
          ? {
              resumeBase64: resumeFile.base64,
              resumeFileName: resumeFile.name,
              resumeMimeType: resumeFile.type,
            }
          : {}),
      });
      setSubmitted(true);
      setTimeout(() => {
        setSubmitted(false);
        setSelectedInternship(null);
        setApplyForm({ fullName: '', email: '', phone: '', resumeFileName: '' });
        setResumeFile(null);
      }, 2500);
    } catch (err: any) {
      // Surface the server's validation message — a silent console error just
      // looks like a dead button to the applicant.
      const details = err.response?.data?.errors?.[0]?.message;
      setApplyError(details || err.response?.data?.message || 'Could not submit your application. Please try again.');
      console.error('Failed to submit application:', err);
    } finally {
      setApplying(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg-canvas py-12 text-strong">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="mb-12 text-center">
          <span className="inline-flex items-center gap-2 rounded-full bg-brand-orange/10 px-4 py-1.5 text-xs font-semibold text-brand-orange">
            <Briefcase size={14} />
            Industrial Placement Programs
          </span>
          <h1 className="mt-4 font-display text-4xl font-bold tracking-tight sm:text-5xl">
            Launch Your AI Career — <span className="text-brand-orange">Real-World Internships</span>
          </h1>
          <p className="mt-4 text-lg text-text-muted">
            Work on production multi-agent systems, real-time WebRTC audio pipelines, and LLM backends with 1-on-1 mentorship.
          </p>
        </div>

        {/* Programs List */}
        {loading ? (
          <div className="space-y-8">
            {[1, 2].map((i) => (
              <div key={i} className="h-64 animate-pulse rounded-xl bg-bg-surface border border-line" />
            ))}
          </div>
        ) : (
          <div className="space-y-8">
            {internships.map((program) => (
              <div
                key={program.id}
                className="rounded-xl border border-line bg-bg-surface p-8 transition-all hover:border-brand-orange/40"
              >
                <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
                  <div className="space-y-4 max-w-3xl">
                    <div className="flex items-center gap-3">
                      {program.programType === 'GENERATIVE_AI' ? (
                        <Bot className="h-6 w-6 text-brand-orange" />
                      ) : (
                        <Cpu className="h-6 w-6 text-brand-orange" />
                      )}
                      <h2 className="font-display text-2xl font-bold text-strong">{program.title}</h2>
                      <span className="rounded-full bg-elevate px-3 py-1 text-xs font-medium text-text-muted">
                        {program.duration}
                      </span>
                    </div>

                    <p className="text-sm text-text-muted leading-relaxed">{program.description}</p>

                    {/* Featured Projects */}
                    {program.projectHighlights && (
                      <div className="mt-4">
                        <h4 className="text-xs font-semibold uppercase tracking-wider text-brand-orange">
                          Featured Capstone Projects You Will Build:
                        </h4>
                        <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
                          {program.projectHighlights.map((proj, pidx) => (
                            <div key={pidx} className="rounded-lg border border-line bg-bg-card p-4">
                              <h5 className="font-bold text-strong text-sm">🚀 {proj.title}</h5>
                              <p className="mt-1 text-xs text-text-muted">{proj.description}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Learning Outcomes */}
                    {program.learningOutcomes && (
                      <div className="mt-4">
                        <h4 className="text-xs font-semibold uppercase tracking-wider text-strong">
                          Learning Outcomes:
                        </h4>
                        <ul className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
                          {program.learningOutcomes.map((outcome, oidx) => (
                            <li key={oidx} className="flex items-center gap-2 text-xs text-text-muted">
                              <CheckCircle2 size={14} className="text-brand-orange shrink-0" />
                              <span>{outcome}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>

                  {/* Apply Sidebar */}
                  <div className="flex flex-col items-center md:items-end justify-between border-t md:border-t-0 md:border-l border-line pt-6 md:pt-0 md:pl-8 min-w-[220px]">
                    <div className="text-center md:text-right">
                      <span className="text-xs text-text-muted">Eligibility</span>
                      <p className="text-xs font-semibold text-strong mt-1 max-w-[200px]">{program.eligibility}</p>
                    </div>

                    <button
                      onClick={() => setSelectedInternship(program)}
                      className="mt-6 w-full rounded-lg bg-brand-orange py-3 text-center text-sm font-semibold text-on-brand shadow-lg transition-colors hover:bg-brand-orange/90"
                    >
                      Apply Now →
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

      </div>

      {/* ─── APPLY NOW POPUP MODAL WITH RESUME DROPZONE ─── */}
      {selectedInternship && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-overlay p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-xl border border-line bg-bg-surface p-6 shadow-2xl">
            
            <div className="flex items-center justify-between border-b border-line pb-4">
              <div>
                <span className="text-xs font-semibold text-brand-orange uppercase">Internship Application</span>
                <h3 className="font-display text-lg font-bold text-strong">{selectedInternship.title}</h3>
              </div>
              <button
                onClick={() => setSelectedInternship(null)}
                className="text-text-muted hover:text-strong"
              >
                <X size={20} />
              </button>
            </div>

            {submitted ? (
              <div className="py-8 text-center">
                <CheckCircle2 className="mx-auto h-12 w-12 text-brand-orange" />
                <h4 className="mt-4 text-lg font-bold text-strong">Application Submitted!</h4>
                <p className="mt-2 text-sm text-text-muted">
                  Thank you for applying for <strong className="text-strong">{selectedInternship.title}</strong>. Our admissions panel will contact you within 24 hours.
                </p>
              </div>
            ) : (
              <form onSubmit={handleApplySubmit} className="mt-4 space-y-4">
                <div>
                  <label className="text-xs font-semibold text-text-muted">Full Name</label>
                  <input
                    type="text"
                    required
                    placeholder="Jane Smith"
                    value={applyForm.fullName}
                    onChange={(e) => setApplyForm({ ...applyForm, fullName: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-line bg-bg-card p-2.5 text-sm text-strong focus:border-brand-orange focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-text-muted">Email Address</label>
                  <input
                    type="email"
                    required
                    placeholder="jane@example.com"
                    value={applyForm.email}
                    onChange={(e) => setApplyForm({ ...applyForm, email: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-line bg-bg-card p-2.5 text-sm text-strong focus:border-brand-orange focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-text-muted">Phone Number</label>
                  <input
                    type="tel"
                    required
                    minLength={5}
                    placeholder="+91 98765 43211"
                    value={applyForm.phone}
                    onChange={(e) => setApplyForm({ ...applyForm, phone: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-line bg-bg-card p-2.5 text-sm text-strong focus:border-brand-orange focus:outline-hidden"
                  />
                </div>

                {/* Resume Dropzone */}
                <div>
                  <label className="text-xs font-semibold text-text-muted">Upload Resume (PDF / DOCX)</label>
                  <div className="mt-1 flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-line-strong bg-bg-card p-6 text-center cursor-pointer hover:border-brand-orange transition-colors">
                    <Upload className="h-8 w-8 text-brand-orange" />
                    <p className="mt-2 text-xs text-text-muted">
                      {applyForm.resumeFileName || 'Drag and drop your resume PDF here, or click to browse'}
                    </p>
                    <input
                      type="file"
                      accept=".pdf,.docx"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (!f) return;
                        setApplyForm({ ...applyForm, resumeFileName: f.name });
                        // Read now so submit doesn't have to wait on the reader.
                        const reader = new FileReader();
                        reader.onload = () =>
                          setResumeFile({
                            base64: (reader.result as string).split(',')[1],
                            name: f.name,
                            type: f.type,
                          });
                        reader.readAsDataURL(f);
                      }}
                      className="hidden"
                      id="resume-upload"
                    />
                    <label htmlFor="resume-upload" className="mt-3 rounded-md bg-elevate px-3 py-1.5 text-xs font-semibold text-strong hover:bg-elevate cursor-pointer">
                      Select File
                    </label>
                  </div>
                </div>

                {applyError && (
                  <p className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-400">
                    {applyError}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={applying}
                  className="w-full rounded-lg bg-brand-orange py-3 text-sm font-semibold text-on-brand hover:bg-brand-orange/90 shadow-lg disabled:opacity-60"
                >
                  {applying ? 'Submitting…' : 'Submit Application →'}
                </button>
              </form>
            )}

          </div>
        </div>
      )}

    </div>
  );
};

export default InternshipPage;
