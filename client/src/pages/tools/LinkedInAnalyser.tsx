import { useState } from 'react';
import { Globe, Upload, Sparkles, Copy, Check } from 'lucide-react';
import api from '../../services/api';

const LinkedInAnalyser = () => {
  const [inputMode, setInputMode] = useState<'pdf' | 'text'>('pdf');
  const [profileText, setProfileText] = useState(
    'John Doe - Senior AI Engineer\nSummary: Architecting multi-agent systems and RAG pipelines.\nExperience: Lead ML Engineer at NeuralSync Systems.'
  );
  const [loading, setLoading] = useState(false);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);

  const [result, setResult] = useState<any>({
    headlineScore: 90,
    aboutScore: 75,
    experienceScore: 85,
    keywordScore: 78,
    overallScore: 82,
    suggestedHeadlines: [
      'Senior AI Engineer | Building Scalable RAG Pipelines & Multi-Agent Swarms | PyTorch & LangGraph Specialist',
      'Lead AI Systems Architect @ Ex-NeuralSync | Generative AI & Vector Search (Pinecone/Chroma)',
      'AI & MLOps Engineer | Architecting Low-Latency LLM Backends for Enterprise SaaS'
    ]
  });

  const handleAnalyse = async () => {
    setLoading(true);
    try {
      const res = await api.post('/tools/linkedin-analyser', { profileText });
      if (res.data.success) {
        setResult(res.data.result);
      }
    } catch (err) {
      console.error('LinkedIn analysis failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const copyHeadline = (text: string, idx: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 2000);
  };

  return (
    <div className="p-6 text-white max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold">LinkedIn Profile Analyser</h1>
        <p className="text-xs text-text-muted">Optimize your LinkedIn profile SEO, headline impact, and recruiter search visibility.</p>
      </div>

      {/* Input Section */}
      <div className="rounded-xl border border-white/[0.08] bg-bg-surface p-6 space-y-4">
        
        {/* Radio Toggle */}
        <div className="flex gap-4 border-b border-white/[0.08] pb-4">
          <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold">
            <input
              type="radio" name="inputMode" checked={inputMode === 'pdf'}
              onChange={() => setInputMode('pdf')} className="text-brand-orange focus:ring-brand-orange"
            />
            <span>Upload LinkedIn Profile PDF</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold">
            <input
              type="radio" name="inputMode" checked={inputMode === 'text'}
              onChange={() => setInputMode('text')} className="text-brand-orange focus:ring-brand-orange"
            />
            <span>Paste Raw Profile Text</span>
          </label>
        </div>

        {inputMode === 'pdf' ? (
          <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-white/20 bg-bg-card p-8 text-center cursor-pointer hover:border-brand-orange transition-colors">
            <Upload className="h-8 w-8 text-brand-orange" />
            <p className="mt-2 text-xs text-text-muted">Drop your LinkedIn Profile PDF here (exported from LinkedIn Desktop)</p>
          </div>
        ) : (
          <textarea
            rows={5} value={profileText} onChange={(e) => setProfileText(e.target.value)}
            className="w-full rounded-lg border border-white/[0.08] bg-bg-card p-3 text-xs text-white focus:border-brand-orange"
          />
        )}

        <button
          onClick={handleAnalyse} disabled={loading}
          className="w-full rounded-lg bg-brand-orange py-3 text-sm font-semibold text-white hover:bg-brand-orange/90 shadow-lg"
        >
          {loading ? 'Analyzing LinkedIn Profile...' : 'Analyse LinkedIn Profile →'}
        </button>
      </div>

      {/* Score Cards Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-white/[0.08] bg-bg-surface p-4 text-center">
          <span className="text-xs text-text-muted uppercase">Headline Score</span>
          <p className="mt-2 font-display text-3xl font-bold text-green-400">{result.headlineScore}%</p>
        </div>
        <div className="rounded-xl border border-white/[0.08] bg-bg-surface p-4 text-center">
          <span className="text-xs text-text-muted uppercase">About Section</span>
          <p className="mt-2 font-display text-3xl font-bold text-brand-orange">{result.aboutScore}%</p>
        </div>
        <div className="rounded-xl border border-white/[0.08] bg-bg-surface p-4 text-center">
          <span className="text-xs text-text-muted uppercase">Experience Depth</span>
          <p className="mt-2 font-display text-3xl font-bold text-green-400">{result.experienceScore}%</p>
        </div>
        <div className="rounded-xl border border-white/[0.08] bg-bg-surface p-4 text-center">
          <span className="text-xs text-text-muted uppercase">Recruiter Keywords</span>
          <p className="mt-2 font-display text-3xl font-bold text-brand-orange">{result.keywordScore}%</p>
        </div>
      </div>

      {/* Suggested Headlines */}
      <div className="rounded-xl border border-white/[0.08] bg-bg-surface p-6 space-y-4">
        <h3 className="font-display text-base font-bold flex items-center gap-2">
          <Sparkles className="text-brand-orange" size={18} />
          AI-Generated High-Converting Headlines
        </h3>

        <div className="space-y-3">
          {result.suggestedHeadlines?.map((hl: string, idx: number) => (
            <div key={idx} className="flex items-center justify-between rounded-lg border border-white/[0.08] bg-bg-card p-4 text-xs">
              <span className="text-white font-medium pr-4">{hl}</span>
              <button
                onClick={() => copyHeadline(hl, idx)}
                className="flex items-center gap-1 rounded bg-brand-orange/20 border border-brand-orange/40 px-3 py-1.5 text-xs font-bold text-brand-orange hover:bg-brand-orange hover:text-white shrink-0"
              >
                {copiedIdx === idx ? <Check size={14} /> : <Copy size={14} />}
                {copiedIdx === idx ? 'Copied!' : 'Copy'}
              </button>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};

export default LinkedInAnalyser;
