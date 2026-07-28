import { useState } from 'react';
import { 
  User, FileText, Briefcase, GraduationCap, Award, Wrench, 
  Sparkles, Download, Eye, Plus, Trash2, CheckCircle2, Upload
} from 'lucide-react';
import api from '../../services/api';

const ResumeBuilder = () => {
  const [activeMode, setActiveMode] = useState<'scratch' | 'linkedin' | 'upload'>('scratch');
  const [activeSection, setActiveSection] = useState<'contact' | 'summary' | 'experience' | 'education' | 'skills'>('contact');

  // Resume Data State
  const [resumeData, setResumeData] = useState({
    fullName: 'JOHN DOE',
    title: 'Senior AI Engineer',
    email: 'j.doe@nxtgen.ai',
    phone: '+1 (555) 019-2834',
    location: 'San Francisco, CA',
    linkedin: 'linkedin.com/in/jdoe',
    summary: 'Senior AI Engineer with 6+ years of experience architecting multi-agent systems, RAG pipelines, and high-throughput vector search databases. Reduced query latency by 45% for enterprise clients.',
    experience: [
      {
        id: '1',
        company: 'NeuralSync Systems',
        role: 'Lead Machine Learning Engineer',
        startDate: 'Jan 2022',
        endDate: 'Present',
        bullet: 'Developed and deployed high-performance RAG pipelines reducing latency by 45% for enterprise clients.'
      },
      {
        id: '2',
        company: 'CogniFlow Robotics',
        role: 'AI Systems Architect',
        startDate: 'Jan 2018',
        endDate: 'Dec 2021',
        bullet: 'Designed distributed training architecture handling petabyte-scale vision datasets across GPU clusters.'
      }
    ],
    education: [
      { id: '1', institution: 'Stanford University', degree: 'M.S. in Artificial Intelligence', year: '2018' }
    ],
    skills: 'Python, C++, PyTorch, LangChain, LlamaIndex, Pinecone, Docker, WebSockets'
  });

  const [aiLoading, setAiLoading] = useState<string | null>(null);

  // AI Bullet Rewriter handler
  const handleEnhanceBullet = async (expId: string, currentBullet: string, mode: 'stronger' | 'shorten' | 'metrics') => {
    setAiLoading(expId);
    try {
      const res = await api.post('/tools/enhance-bullet', { bullet: currentBullet, mode });
      if (res.data.success) {
        setResumeData(prev => ({
          ...prev,
          experience: prev.experience.map(item => item.id === expId ? { ...item, bullet: res.data.enhanced } : item)
        }));
      }
    } catch (err) {
      console.error('Failed to enhance bullet:', err);
    } finally {
      setAiLoading(null);
    }
  };

  return (
    <div className="flex h-[calc(100vh-4rem)] bg-bg-canvas text-white overflow-hidden">
      
      {/* ─── LEFT RAIL (260px): Section Nav & Templates ─── */}
      <div className="w-64 flex flex-col border-r border-white/[0.08] bg-bg-surface p-4 space-y-6">
        <div>
          <span className="text-[10px] font-bold text-brand-orange uppercase tracking-wider">Creation Mode</span>
          <div className="mt-2 flex rounded-lg border border-white/[0.08] bg-bg-card p-1">
            <button
              onClick={() => setActiveMode('scratch')}
              className={`flex-1 rounded py-1 text-[11px] font-semibold ${activeMode === 'scratch' ? 'bg-brand-orange text-white' : 'text-text-muted'}`}
            >
              Scratch
            </button>
            <button
              onClick={() => setActiveMode('upload')}
              className={`flex-1 rounded py-1 text-[11px] font-semibold ${activeMode === 'upload' ? 'bg-brand-orange text-white' : 'text-text-muted'}`}
            >
              Upload
            </button>
          </div>
        </div>

        {/* Section Rail */}
        <div className="space-y-1">
          <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Resume Sections</span>
          {([
            { id: 'contact', name: 'Contact Info', icon: User },
            { id: 'summary', name: 'Summary', icon: FileText },
            { id: 'experience', name: 'Experience', icon: Briefcase },
            { id: 'education', name: 'Education', icon: GraduationCap },
            { id: 'skills', name: 'Skills', icon: Wrench },
          ] as const).map((sec) => {
            const Icon = sec.icon;
            return (
              <button
                key={sec.id}
                onClick={() => setActiveSection(sec.id)}
                className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-xs font-medium transition-colors ${
                  activeSection === sec.id ? 'bg-brand-orange/10 text-brand-orange font-bold' : 'text-text-muted hover:bg-white/[0.05] hover:text-white'
                }`}
              >
                <Icon size={16} />
                <span>{sec.name}</span>
              </button>
            );
          })}
        </div>

        {/* Template Gallery */}
        <div className="mt-auto border-t border-white/[0.08] pt-4">
          <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Active Template</span>
          <div className="mt-2 rounded-lg border border-brand-orange bg-bg-card p-3 text-center">
            <p className="text-xs font-bold text-white">Modern Professional (ATS)</p>
            <span className="text-[10px] text-brand-orange">Single Column • High Contrast</span>
          </div>
        </div>
      </div>

      {/* ─── CENTER VIEWPORT (55%): Centered Live A4 Resume Preview ─── */}
      <div className="flex-1 flex flex-col bg-bg-canvas overflow-y-auto p-8 items-center justify-start">
        
        {/* Top Control Bar */}
        <div className="w-full max-w-2xl flex items-center justify-between mb-4">
          <span className="text-xs text-text-muted">Live A4 Preview (100% Scale)</span>
          <button
            onClick={() => alert('Exporting PDF...')}
            className="flex items-center gap-2 rounded-lg bg-brand-orange px-4 py-2 text-xs font-semibold text-white hover:bg-brand-orange/90 shadow-md"
          >
            <Download size={14} />
            Export PDF
          </button>
        </div>

        {/* A4 Paper Canvas Sheet */}
        <div className="w-full max-w-2xl min-h-[842px] bg-white text-black p-10 shadow-2xl rounded-sm text-xs font-sans space-y-4">
          
          {/* Header / Contact */}
          <div className="border-b border-black/20 pb-3 text-center space-y-1">
            <h1 className="text-2xl font-bold tracking-tight text-black">{resumeData.fullName}</h1>
            <p className="text-sm font-semibold text-gray-700">{resumeData.title}</p>
            <p className="text-[10px] text-gray-500">
              {resumeData.location} • {resumeData.email} • {resumeData.phone} • {resumeData.linkedin}
            </p>
          </div>

          {/* Summary */}
          {resumeData.summary && (
            <div>
              <h2 className="text-xs font-bold uppercase tracking-wider border-b border-black/20 pb-1 mb-1 text-black">Professional Summary</h2>
              <p className="text-[11px] text-gray-700 leading-relaxed">{resumeData.summary}</p>
            </div>
          )}

          {/* Experience */}
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider border-b border-black/20 pb-1 mb-2 text-black">Work Experience</h2>
            <div className="space-y-3">
              {resumeData.experience.map((exp) => (
                <div key={exp.id}>
                  <div className="flex justify-between items-baseline font-bold text-[11px] text-black">
                    <span>{exp.role} — <span className="italic font-normal">{exp.company}</span></span>
                    <span className="text-[10px] text-gray-500">{exp.startDate} – {exp.endDate}</span>
                  </div>
                  <ul className="list-disc pl-4 text-[10px] text-gray-700 mt-1">
                    <li>{exp.bullet}</li>
                  </ul>
                </div>
              ))}
            </div>
          </div>

          {/* Education */}
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider border-b border-black/20 pb-1 mb-1 text-black">Education</h2>
            {resumeData.education.map((edu) => (
              <div key={edu.id} className="flex justify-between text-[11px] font-medium text-gray-800">
                <span>{edu.degree} — {edu.institution}</span>
                <span className="text-[10px] text-gray-500">{edu.year}</span>
              </div>
            ))}
          </div>

          {/* Skills */}
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider border-b border-black/20 pb-1 mb-1 text-black">Technical Skills</h2>
            <p className="text-[10px] text-gray-700">{resumeData.skills}</p>
          </div>

        </div>

      </div>

      {/* ─── RIGHT PANE (320px): Form Editor with AI Rewrite Toolbar ─── */}
      <div className="w-80 border-l border-white/[0.08] bg-bg-surface p-4 overflow-y-auto space-y-4">
        <h3 className="font-display text-sm font-bold text-white border-b border-white/[0.08] pb-2">
          Editor: {activeSection.toUpperCase()}
        </h3>

        {activeSection === 'contact' && (
          <div className="space-y-3 text-xs">
            <div>
              <label className="text-text-muted">Full Name</label>
              <input
                type="text" value={resumeData.fullName}
                onChange={(e) => setResumeData({ ...resumeData, fullName: e.target.value })}
                className="mt-1 w-full rounded bg-bg-card border border-white/[0.08] p-2 text-white"
              />
            </div>
            <div>
              <label className="text-text-muted">Job Title</label>
              <input
                type="text" value={resumeData.title}
                onChange={(e) => setResumeData({ ...resumeData, title: e.target.value })}
                className="mt-1 w-full rounded bg-bg-card border border-white/[0.08] p-2 text-white"
              />
            </div>
            <div>
              <label className="text-text-muted">Email</label>
              <input
                type="email" value={resumeData.email}
                onChange={(e) => setResumeData({ ...resumeData, email: e.target.value })}
                className="mt-1 w-full rounded bg-bg-card border border-white/[0.08] p-2 text-white"
              />
            </div>
          </div>
        )}

        {activeSection === 'summary' && (
          <div className="space-y-3 text-xs">
            <label className="text-text-muted">Executive Summary</label>
            <textarea
              rows={5} value={resumeData.summary}
              onChange={(e) => setResumeData({ ...resumeData, summary: e.target.value })}
              className="w-full rounded bg-bg-card border border-white/[0.08] p-2 text-white"
            />
          </div>
        )}

        {activeSection === 'experience' && (
          <div className="space-y-4 text-xs">
            {resumeData.experience.map((exp, idx) => (
              <div key={exp.id} className="rounded-lg border border-white/[0.08] bg-bg-card p-3 space-y-2">
                <input
                  type="text" value={exp.role} placeholder="Role"
                  onChange={(e) => {
                    const newExp = [...resumeData.experience];
                    newExp[idx].role = e.target.value;
                    setResumeData({ ...resumeData, experience: newExp });
                  }}
                  className="w-full rounded bg-bg-surface border border-white/[0.08] p-1.5 text-white font-bold"
                />

                <textarea
                  rows={3} value={exp.bullet}
                  onChange={(e) => {
                    const newExp = [...resumeData.experience];
                    newExp[idx].bullet = e.target.value;
                    setResumeData({ ...resumeData, experience: newExp });
                  }}
                  className="w-full rounded bg-bg-surface border border-white/[0.08] p-1.5 text-white text-[11px]"
                />

                {/* Glowing AI Rewrite Toolbar */}
                <div className="flex gap-1.5 pt-1">
                  <button
                    disabled={aiLoading === exp.id}
                    onClick={() => handleEnhanceBullet(exp.id, exp.bullet, 'stronger')}
                    className="flex-1 rounded bg-brand-orange/20 border border-brand-orange/40 px-2 py-1 text-[10px] font-bold text-brand-orange hover:bg-brand-orange hover:text-white"
                  >
                    ✨ Make Stronger
                  </button>
                  <button
                    disabled={aiLoading === exp.id}
                    onClick={() => handleEnhanceBullet(exp.id, exp.bullet, 'metrics')}
                    className="rounded bg-white/[0.08] px-2 py-1 text-[10px] font-semibold text-white hover:bg-white/20"
                  >
                    Add Metrics
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeSection === 'skills' && (
          <div className="space-y-3 text-xs">
            <label className="text-text-muted">Skills (Comma-separated)</label>
            <textarea
              rows={4} value={resumeData.skills}
              onChange={(e) => setResumeData({ ...resumeData, skills: e.target.value })}
              className="w-full rounded bg-bg-card border border-white/[0.08] p-2 text-white"
            />
          </div>
        )}

      </div>

    </div>
  );
};

export default ResumeBuilder;
