import { useState } from 'react';
import { Target, Sparkles, CheckCircle2, Plus } from 'lucide-react';
import api from '../../services/api';

const JDTailor = () => {
  const [resumeText, setResumeText] = useState('Senior AI Engineer experienced in PyTorch, SQL, Docker, and REST APIs.');
  const [jobDescription, setJobDescription] = useState('We are hiring a Lead AI Engineer to architect RAG pipelines, LangGraph multi-agent systems, and vector search with Pinecone.');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>({
    matchPercentage: 65,
    matchedKeywords: ['PyTorch', 'REST APIs', 'SQL'],
    missingKeywords: ['RAG Pipelines', 'LangGraph', 'Pinecone', 'Multi-Agent Systems'],
    suggestedBulletInjections: [
      'Architected RAG pipelines and vector retrieval engines using Pinecone, improving document retrieval accuracy by 40%.',
      'Orchestrated multi-agent stateful graphs with LangGraph for autonomous workflow execution.'
    ]
  });

  const handleTailor = async () => {
    setLoading(true);
    try {
      const res = await api.post('/tools/tailor-resume', { resumeText, jobDescription });
      if (res.data.success) {
        setResult(res.data.result);
      }
    } catch (err) {
      console.error('Tailoring failed:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 text-white max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold">JD Resume Tailor & Keyword Matcher</h1>
        <p className="text-xs text-text-muted">Compare your resume against a target Job Description to extract missing terms and inject high-converting bullet points.</p>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        {/* Dual Input */}
        <div className="space-y-4 rounded-xl border border-white/[0.08] bg-bg-surface p-6">
          <div>
            <label className="text-xs font-semibold text-text-muted">Candidate Resume Text</label>
            <textarea
              rows={6} value={resumeText} onChange={(e) => setResumeText(e.target.value)}
              className="mt-1 w-full rounded-lg border border-white/[0.08] bg-bg-card p-3 text-xs text-white focus:border-brand-orange"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-text-muted">Target Job Description (JD)</label>
            <textarea
              rows={6} value={jobDescription} onChange={(e) => setJobDescription(e.target.value)}
              className="mt-1 w-full rounded-lg border border-white/[0.08] bg-bg-card p-3 text-xs text-white focus:border-brand-orange"
            />
          </div>

          <button
            onClick={handleTailor} disabled={loading}
            className="w-full rounded-lg bg-brand-orange py-3 text-sm font-semibold text-white hover:bg-brand-orange/90 shadow-lg"
          >
            {loading ? 'Tailoring with Gemini AI...' : 'Calculate JD Match & Generate Injections →'}
          </button>
        </div>

        {/* Tailoring Analysis Output */}
        <div className="space-y-6 rounded-xl border border-white/[0.08] bg-bg-surface p-6">
          <div className="flex items-center justify-between border-b border-white/[0.08] pb-4">
            <div>
              <span className="text-xs font-semibold text-text-muted uppercase">JD Match Score</span>
              <h2 className="font-display text-3xl font-bold text-brand-orange">{result.matchPercentage}%</h2>
            </div>
            <Target size={36} className="text-brand-orange" />
          </div>

          {/* Missing Keywords Tag Cloud */}
          <div>
            <h4 className="text-xs font-semibold text-white uppercase tracking-wider mb-2">Missing Keywords from JD</h4>
            <div className="flex flex-wrap gap-2">
              {result.missingKeywords?.map((kw: string, idx: number) => (
                <span key={idx} className="rounded-full bg-brand-orange/20 border border-brand-orange/40 px-3 py-1 text-xs font-bold text-brand-orange">
                  + {kw}
                </span>
              ))}
            </div>
          </div>

          {/* Bullet Injections */}
          <div>
            <h4 className="text-xs font-semibold text-white uppercase tracking-wider mb-2">AI-Generated Bullet Point Injections</h4>
            <div className="space-y-3">
              {result.suggestedBulletInjections?.map((bullet: string, idx: number) => (
                <div key={idx} className="rounded-lg border border-white/[0.08] bg-bg-card p-3 text-xs space-y-2">
                  <p className="text-white">{bullet}</p>
                  <button onClick={() => navigator.clipboard.writeText(bullet)} className="text-[10px] font-bold text-brand-orange hover:underline">
                    Copy Bullet to Clipboard
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default JDTailor;
