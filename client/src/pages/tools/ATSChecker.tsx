import { useState } from 'react';
import { Target, Upload, CheckCircle2, AlertTriangle, Sparkles, FileText } from 'lucide-react';
import api from '../../services/api';

const ATSChecker = () => {
  const [resumeText, setResumeText] = useState(
    'JOHN DOE - Senior AI Engineer\nSan Francisco, CA • j.doe@nxtgen.ai\n\nEXPERIENCE:\nNeuralSync Systems - Lead Machine Learning Engineer (2022 - Present)\n• Developed and deployed high-performance RAG pipelines reducing latency by 45% for enterprise clients.\n• Orchestrated multi-agent teams using PyTorch and CUDA.\n\nEDUCATION:\nM.S. in Artificial Intelligence - Stanford University (2018)\n\nSKILLS:\nPython, PyTorch, LangChain, Fast API, Docker, WebSockets'
  );
  
  const [loading, setLoading] = useState(false);
  const [atsResult, setAtsResult] = useState<any>({
    score: 88,
    formattingScore: 92,
    keywordScore: 82,
    sectionScore: 90,
    missingKeywords: ['RAG', 'LangChain', 'Vector Database', 'PEFT', 'LoRA'],
    summaryFeedback: 'Excellent single-column layout with high keyword density. Recommend adding specific vector database names (Pinecone/Chroma).'
  });

  const handleRunATSCheck = async () => {
    setLoading(true);
    try {
      const res = await api.post('/tools/ats-score', { resumeText });
      if (res.data.success) {
        setAtsResult(res.data.result);
      }
    } catch (err) {
      console.error('ATS check failed:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 text-white max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold">ATS Score Checker & Parser Audit</h1>
        <p className="text-xs text-text-muted">Analyze your resume formatting, keyword density, and ATS match algorithm score.</p>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        
        {/* Left Column (50%): Upload & Parsed Text Preview */}
        <div className="space-y-4 rounded-xl border border-white/[0.08] bg-bg-surface p-6">
          <h3 className="font-display text-base font-bold">Resume Upload & Live Parsed Preview</h3>

          {/* Upload Dropzone */}
          <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-white/20 bg-bg-card p-6 text-center cursor-pointer hover:border-brand-orange transition-colors">
            <Upload className="h-8 w-8 text-brand-orange" />
            <p className="mt-2 text-xs text-text-muted">Drag & drop your resume PDF / DOCX here or click to browse</p>
          </div>

          {/* Live Parsed Preview Textarea */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-text-muted">Live Parsed Text Extract</label>
            <textarea
              rows={12}
              value={resumeText}
              onChange={(e) => setResumeText(e.target.value)}
              className="w-full rounded-lg border border-white/[0.08] bg-bg-card p-3 text-xs text-white font-mono focus:border-brand-orange"
            />
          </div>

          <button
            onClick={handleRunATSCheck}
            disabled={loading}
            className="w-full rounded-lg bg-brand-orange py-3 text-sm font-semibold text-white hover:bg-brand-orange/90 shadow-lg disabled:opacity-50"
          >
            {loading ? 'Analyzing with Gemini AI...' : 'Run ATS Audit →'}
          </button>
        </div>

        {/* Right Column (50%): Score Ring & Keyword Audit */}
        <div className="space-y-6 rounded-xl border border-white/[0.08] bg-bg-surface p-6">
          
          {/* Score Ring */}
          <div className="flex flex-col sm:flex-row items-center gap-6 border-b border-white/[0.08] pb-6">
            <div className="relative flex h-32 w-32 items-center justify-center rounded-full border-8 border-brand-orange border-t-white/10 shadow-xl">
              <div className="text-center">
                <span className="font-display text-3xl font-bold text-brand-orange">{atsResult.score}%</span>
                <p className="text-[10px] uppercase text-text-muted">ATS Match</p>
              </div>
            </div>

            <div className="space-y-2 flex-1 w-full text-xs">
              <div className="flex justify-between font-semibold">
                <span className="text-text-muted">Formatting & Parsing:</span>
                <span className="text-green-400">{atsResult.formattingScore}%</span>
              </div>
              <div className="flex justify-between font-semibold">
                <span className="text-text-muted">Keyword Density:</span>
                <span className="text-brand-orange">{atsResult.keywordScore}%</span>
              </div>
              <div className="flex justify-between font-semibold">
                <span className="text-text-muted">Section Structure:</span>
                <span className="text-green-400">{atsResult.sectionScore}%</span>
              </div>
            </div>
          </div>

          {/* Missing Keywords Tag Cloud */}
          <div>
            <h4 className="text-xs font-semibold text-white uppercase tracking-wider mb-2">Missing High-Impact Keywords</h4>
            <div className="flex flex-wrap gap-2">
              {atsResult.missingKeywords.map((kw: string, idx: number) => (
                <span key={idx} className="rounded-full bg-brand-orange/20 border border-brand-orange/40 px-3 py-1 text-xs font-bold text-brand-orange">
                  + {kw}
                </span>
              ))}
            </div>
          </div>

          {/* Summary Feedback */}
          <div className="rounded-lg bg-bg-card p-4 border border-white/[0.08] space-y-2">
            <h4 className="text-xs font-semibold text-white flex items-center gap-2">
              <Sparkles size={14} className="text-brand-orange" />
              AI Audit Feedback
            </h4>
            <p className="text-xs text-text-muted leading-relaxed">{atsResult.summaryFeedback}</p>
          </div>

        </div>

      </div>
    </div>
  );
};

export default ATSChecker;
