import { useState } from 'react';
import { FileText, Copy, Download, Sparkles } from 'lucide-react';
import api from '../../services/api';

const CoverLetterBuilder = () => {
  const [role, setRole] = useState('Senior AI Engineer');
  const [company, setCompany] = useState('Anthropic');
  const [resumeText, setResumeText] = useState('Senior AI Engineer with 6 years experience building LLM pipelines and RAG systems.');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>({
    coverLetterText: 'Dear Hiring Manager,\n\nI am writing to express my strong interest in the Senior AI Engineer position at Anthropic. With over 6 years of experience architecting multi-agent AI systems, high-throughput RAG pipelines, and vector search databases, I am eager to contribute to your core AI alignment and engineering teams.\n\nAt NeuralSync Systems, I spearheaded the deployment of enterprise retrieval engines that reduced query latency by 45%. My expertise aligns directly with Anthropic’s commitment to safety-first, performant frontier models.\n\nThank you for your time and consideration.\n\nSincerely,\nJohn Doe',
    wordCount: 185
  });

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const res = await api.post('/tools/cover-letter', { targetRole: role, companyName: company, resumeText });
      if (res.data.success) setResult(res.data.result);
    } catch (err) {
      console.error('Cover letter failed:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 text-white max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold">AI Cover Letter Builder</h1>
        <p className="text-xs text-text-muted">Generate tailored, high-converting cover letters matching target role culture.</p>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        <div className="space-y-4 rounded-xl border border-white/[0.08] bg-bg-surface p-6">
          <div>
            <label className="text-xs font-semibold text-text-muted">Target Role Title</label>
            <input type="text" value={role} onChange={(e) => setRole(e.target.value)} className="mt-1 w-full rounded-lg border border-white/[0.08] bg-bg-card p-2.5 text-xs text-white" />
          </div>
          <div>
            <label className="text-xs font-semibold text-text-muted">Company Name</label>
            <input type="text" value={company} onChange={(e) => setCompany(e.target.value)} className="mt-1 w-full rounded-lg border border-white/[0.08] bg-bg-card p-2.5 text-xs text-white" />
          </div>
          <div>
            <label className="text-xs font-semibold text-text-muted">Resume Summary Context</label>
            <textarea rows={4} value={resumeText} onChange={(e) => setResumeText(e.target.value)} className="mt-1 w-full rounded-lg border border-white/[0.08] bg-bg-card p-2.5 text-xs text-white" />
          </div>
          <button onClick={handleGenerate} disabled={loading} className="w-full rounded-lg bg-brand-orange py-3 text-sm font-semibold text-white shadow-lg">
            {loading ? 'Generating Cover Letter...' : 'Generate Cover Letter →'}
          </button>
        </div>

        <div className="rounded-xl border border-white/[0.08] bg-bg-surface p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
            <span className="text-xs font-bold text-brand-orange">Generated Cover Letter ({result.wordCount} words)</span>
            <button onClick={() => navigator.clipboard.writeText(result.coverLetterText)} className="flex items-center gap-1 text-xs text-brand-orange hover:underline">
              <Copy size={14} /> Copy Text
            </button>
          </div>
          <textarea rows={12} readOnly value={result.coverLetterText} className="w-full rounded-lg border border-white/[0.08] bg-bg-card p-3 text-xs text-white font-sans leading-relaxed" />
        </div>
      </div>
    </div>
  );
};

export default CoverLetterBuilder;
