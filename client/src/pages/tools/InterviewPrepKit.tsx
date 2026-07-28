import { useState } from 'react';
import { Bot, ChevronDown, ChevronUp, Sparkles } from 'lucide-react';
import api from '../../services/api';

const InterviewPrepKit = () => {
  const [resumeText, setResumeText] = useState('Senior AI Engineer with 6 years experience in RAG and PyTorch.');
  const [jobDescription, setJobDescription] = useState('Senior AI Engineer to build RAG pipelines, LangGraph agents, and Pinecone vector search.');
  const [loading, setLoading] = useState(false);
  const [expandedId, setExpandedId] = useState<number | null>(1);

  const [questions, setQuestions] = useState<any[]>([
    {
      id: 1,
      category: 'Technical',
      question: 'How do you handle race conditions and deadlocks in complex distributed vector databases?',
      starAnswer: {
        situation: 'Describe a production deadlock incident involving multi-threaded vector indexing under peak write loads.',
        action: 'Implemented strict lock ordering, configured read-committed isolation levels, and added exponential backoff retry logic.',
        result: 'Reduced deadlock incidents by 95% and improved transaction throughput by 30% under peak load.'
      }
    },
    {
      id: 2,
      category: 'Architecture',
      question: 'Can you explain your approach to optimizing latency in multi-stage RAG pipelines?',
      starAnswer: {
        situation: 'RAG query latency exceeded 1.8 seconds due to unoptimized dense retriever embeddings and LLM reranking.',
        action: 'Introduced hybrid sparse-dense retrieval (BM25 + Cohere Rerank) and cached top-k document chunks in Redis.',
        result: 'Cut end-to-end latency to 380ms while improving context relevance score from 0.72 to 0.89.'
      }
    }
  ]);

  const handleGenerateDeck = async () => {
    setLoading(true);
    try {
      const res = await api.post('/tools/interview-prep', { resumeText, jobDescription });
      if (res.data.success) {
        setQuestions(res.data.result.questions);
      }
    } catch (err) {
      console.error('Interview prep failed:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 text-white max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold">AI Interview Prep Kit (STAR Method)</h1>
        <p className="text-xs text-text-muted">Generate 10 custom technical and behavioral interview questions with structured STAR answers tailored to your resume and target JD.</p>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 rounded-xl border border-white/[0.08] bg-bg-surface p-6">
        <div>
          <label className="text-xs font-semibold text-text-muted">Candidate Resume Summary</label>
          <textarea rows={3} value={resumeText} onChange={(e) => setResumeText(e.target.value)} className="mt-1 w-full rounded-lg border border-white/[0.08] bg-bg-card p-2 text-xs text-white" />
        </div>
        <div>
          <label className="text-xs font-semibold text-text-muted">Target Job Description</label>
          <textarea rows={3} value={jobDescription} onChange={(e) => setJobDescription(e.target.value)} className="mt-1 w-full rounded-lg border border-white/[0.08] bg-bg-card p-2 text-xs text-white" />
        </div>
        <div className="md:col-span-2">
          <button onClick={handleGenerateDeck} disabled={loading} className="w-full rounded-lg bg-brand-orange py-2.5 text-sm font-semibold text-white shadow-lg">
            {loading ? 'Generating Interview Deck...' : 'Generate 10 STAR Q&A Cards →'}
          </button>
        </div>
      </div>

      {/* Q&A Cards List */}
      <div className="space-y-4">
        {questions.map((q) => {
          const isExpanded = expandedId === q.id;
          return (
            <div key={q.id} className="rounded-xl border border-white/[0.08] bg-bg-surface p-6 space-y-3">
              <div
                onClick={() => setExpandedId(isExpanded ? null : q.id)}
                className="flex items-center justify-between cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <span className="rounded bg-brand-orange/20 px-2.5 py-0.5 text-xs font-bold text-brand-orange">{q.category}</span>
                  <h3 className="font-semibold text-white text-base">Q{q.id}: {q.question}</h3>
                </div>
                {isExpanded ? <ChevronUp size={20} className="text-brand-orange" /> : <ChevronDown size={20} className="text-text-muted" />}
              </div>

              {isExpanded && q.starAnswer && (
                <div className="mt-4 border-t border-white/[0.08] pt-4 grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                  <div className="rounded-lg bg-bg-card p-3 border border-white/[0.05]">
                    <span className="font-bold text-yellow-400 uppercase tracking-wider block mb-1">S — Situation</span>
                    <p className="text-text-muted">{q.starAnswer.situation}</p>
                  </div>

                  <div className="rounded-lg bg-bg-card p-3 border border-white/[0.05]">
                    <span className="font-bold text-blue-400 uppercase tracking-wider block mb-1">A — Action</span>
                    <p className="text-text-muted">{q.starAnswer.action}</p>
                  </div>

                  <div className="rounded-lg bg-bg-card p-3 border border-white/[0.05]">
                    <span className="font-bold text-green-400 uppercase tracking-wider block mb-1">R — Result</span>
                    <p className="text-text-muted">{q.starAnswer.result}</p>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

    </div>
  );
};

export default InterviewPrepKit;
