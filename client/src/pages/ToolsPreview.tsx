import { useParams, Link } from 'react-router-dom';
import { 
  FileText, Sparkles, Target, Award, Globe, Bot, Mic, ShieldAlert, ArrowRight, Lock
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const TOOLS_DATA: Record<string, { title: string; desc: string; icon: any; features: string[] }> = {
  'resume-builder': {
    title: 'AI Resume Builder',
    desc: 'Construct ATS-optimized single-column resumes with centered live A4 preview, 3 input modes (Scratch, LinkedIn PDF, Upload), and inline AI bullet rewriting.',
    icon: FileText,
    features: ['3 Creation Modes', 'Centered A4 Live WYSIWYG Editor', '6 ATS Templates', 'Inline AI Bullet Rewriter', 'Export to PDF & DOCX']
  },
  'upload-enhance': {
    title: 'Upload & Enhance',
    desc: 'Drag and drop any existing resume to automatically parse structured fields and enhance bullet points with high-impact action verbs.',
    icon: Sparkles,
    features: ['Hybrid Parser (Regex + Vision)', 'Weak Bullet Detection', 'Action Verb Generator', 'Side-by-Side Comparison']
  },
  'ats-checker': {
    title: 'ATS Score Checker',
    desc: 'Upload your resume PDF/DOCX to get a 0-100% ATS match score, keyword density audit, formatting checklist, and missing keyword tag cloud.',
    icon: Target,
    features: ['Resume Upload Dropzone', 'Live Parsed Resume Preview', 'Overall 88% Match Score Ring', 'Fix All with AI CTA']
  },
  'tailor-resume': {
    title: 'JD Resume Builder / Tailor Resume',
    desc: 'Paste any target job description alongside your resume to highlight missing keywords, compute match %, and inject missing terms automatically.',
    icon: Award,
    features: ['Dual Input Matching', 'Missing Keyword Tag Cloud', 'One-Click Keyword Injection', 'ATS Match Score Calculation']
  },
  'cover-letter': {
    title: 'Cover Letter Builder',
    desc: 'Generate role-specific 250-350 word cover letters tailored to target company culture and matching your resume design template.',
    icon: FileText,
    features: ['Company Culture Matching', '3 Tone Options', 'Template Style Mirroring', 'Instant PDF Export']
  },
  'linkedin-analyser': {
    title: 'LinkedIn Profile Analyser',
    desc: 'Upload your LinkedIn profile PDF (or paste text) to analyze headline strength, about section engagement, experience keywords, and generate recruiter headlines.',
    icon: Globe,
    features: ['Upload Profile as PDF', '4 Dimension Scorecards', 'AI Recruiter Headlines', 'Copy-to-Clipboard Suggestions']
  },
  'interview-prep': {
    title: 'Interview Prep Kit',
    desc: 'Generate 20 custom interview questions across 5 categories tailored to your resume and target JD, complete with STAR-format model answers.',
    icon: Bot,
    features: ['20 Questions & STAR Answers', 'Behavioral & Technical Coverage', 'Targeted to Specific JD', 'Exportable PDF Prep Deck']
  },
  'i-assist': {
    title: 'I-Assist (Echo Desktop)',
    desc: 'Real-time speech teleprompter & interview co-pilot listening to interviewer questions via auto-transcription and rendering live STAR answer hint cards.',
    icon: Mic,
    features: ['Auto-Listening Mode (No Interviewer Video)', 'Real-Time Speech Transcript Stream', 'STAR Answer Hint Cards', 'Audio Level Visualization']
  }
};

const ToolsPreview = () => {
  const { toolId } = useParams<{ toolId: string }>();
  const { isAuthenticated } = useAuth();
  
  const tool = (toolId && TOOLS_DATA[toolId]) ? TOOLS_DATA[toolId] : TOOLS_DATA['resume-builder'];
  const Icon = tool.icon;

  return (
    <div className="min-h-screen bg-bg-canvas py-12 text-white">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        
        <div className="rounded-2xl border border-white/[0.08] bg-bg-surface p-8 sm:p-12">
          <div className="flex items-center gap-4">
            <div className="rounded-xl bg-brand-orange/10 p-3 text-brand-orange">
              <Icon size={32} />
            </div>
            <div>
              <span className="text-xs font-semibold text-brand-orange uppercase tracking-wider">AI Career Tool</span>
              <h1 className="font-display text-3xl font-bold text-white">{tool.title}</h1>
            </div>
          </div>

          <p className="mt-6 text-base text-text-muted leading-relaxed">
            {tool.desc}
          </p>

          {/* Features */}
          <div className="mt-8 border-t border-b border-white/[0.08] py-6">
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider">Core Tool Capabilities:</h3>
            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
              {tool.features.map((feat, idx) => (
                <div key={idx} className="flex items-center gap-2 text-sm text-text-muted">
                  <Sparkles size={16} className="text-brand-orange shrink-0" />
                  <span>{feat}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Call to Action */}
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4 rounded-xl bg-bg-card p-6 border border-white/[0.08]">
            <div className="flex items-center gap-3">
              <Lock className="text-brand-orange" size={24} />
              <div>
                <h4 className="font-bold text-white text-sm">Tool Access & Subscriptions</h4>
                <p className="text-xs text-text-muted">Available with Basic, Pro, or Enterprise NxtGen Academy subscription plans.</p>
              </div>
            </div>

            {isAuthenticated ? (
              <Link
                to="/dashboard/student"
                className="rounded-lg bg-brand-orange px-6 py-2.5 text-sm font-semibold text-white hover:bg-brand-orange/90"
              >
                Launch Tool in Dashboard →
              </Link>
            ) : (
              <Link
                to="/login"
                className="rounded-lg bg-brand-orange px-6 py-2.5 text-sm font-semibold text-white hover:bg-brand-orange/90"
              >
                Sign In to Access Tool →
              </Link>
            )}
          </div>

        </div>

      </div>
    </div>
  );
};

export default ToolsPreview;
