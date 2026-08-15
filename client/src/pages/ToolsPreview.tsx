import { useParams, Link } from 'react-router-dom';
import {
  FileText, Sparkles, Target, Award, Globe, Bot, Mic, ArrowRight, Lock, Check
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const TOOLS_DATA: Record<string, {
  title: string;
  tagline: string;
  desc: string;
  icon: any;
  overview: string;
  whatYouLearn: string[];
  features: string[];
  launchPath: string;
  badge: string;
}> = {
  'resume-builder': {
    title: 'AI Resume Builder',
    tagline: 'Build ATS-Optimized Resumes That Get Noticed',
    desc: 'Construct ATS-optimized single-column resumes with centered live A4 preview, 3 input modes (Scratch, LinkedIn PDF, Upload), and inline AI bullet rewriting.',
    icon: FileText,
    overview: 'The AI Resume Builder is a professional-grade tool designed to help job seekers craft ATS-optimized resumes that pass applicant tracking systems and impress human recruiters. Built with a live A4 WYSIWYG editor, it offers three modes: build from scratch, import from LinkedIn PDF, or upload an existing resume for enhancement.',
    whatYouLearn: ['How to structure resumes for ATS compliance', 'Using AI to rewrite bullet points for impact', 'Keyword optimization for specific job descriptions', 'Exporting to PDF and DOCX formats'],
    features: ['3 Creation Modes (Scratch, LinkedIn PDF, Upload)', 'Centered A4 Live WYSIWYG Editor', '6 ATS-Optimized Templates', 'Inline AI Bullet Rewriter', 'Export to PDF & DOCX', 'Keyword Gap Analysis'],
    launchPath: '/dashboard/tools/resume-builder',
    badge: 'Most Popular',
  },
  'ats-checker': {
    title: 'ATS Score Checker',
    tagline: 'Know Your Resume\'s ATS Score Before You Apply',
    desc: 'Upload your resume PDF/DOCX to get a 0-100% ATS match score, keyword density audit, formatting checklist, and missing keyword tag cloud.',
    icon: Target,
    overview: 'The ATS Score Checker analyzes your resume against applicant tracking system algorithms, giving you a detailed 0-100% compatibility score. Understand exactly why your resume gets filtered out and what needs to change to get through to human reviewers.',
    whatYouLearn: ['How ATS systems parse and score resumes', 'Which keywords matter most for your role', 'Formatting issues that cause ATS rejection', 'How to improve your match score systematically'],
    features: ['Resume Upload Dropzone (PDF/DOCX)', 'Live Parsed Resume Preview', 'Overall ATS Match Score Ring', 'Missing Keyword Tag Cloud', 'Formatting Checklist', 'Fix All with AI CTA'],
    launchPath: '/dashboard/tools/ats-checker',
    badge: 'Career Essential',
  },
  'tailor-resume': {
    title: 'JD Resume Tailor',
    tagline: 'Customize Your Resume for Every Job Application',
    desc: 'Paste any target job description alongside your resume to highlight missing keywords, compute match %, and inject missing terms automatically.',
    icon: Award,
    overview: 'Stop sending generic resumes. The JD Resume Tailor lets you match your resume to any specific job description, showing you exactly which keywords are missing and automatically injecting them at the right places. Dramatically increase your interview callback rate.',
    whatYouLearn: ['How to read and decode job descriptions', 'Keyword injection without sounding robotic', 'Tailoring experience bullets for specific roles', 'Maximizing ATS match percentage per application'],
    features: ['Dual Input Matching (Resume + JD)', 'Missing Keyword Tag Cloud', 'One-Click Keyword Injection', 'ATS Match Score Calculation', 'Side-by-Side Comparison View'],
    launchPath: '/dashboard/tools/tailor-resume',
    badge: 'High Impact',
  },
  'linkedin-analyser': {
    title: 'LinkedIn Profile Analyser',
    tagline: 'Make Your LinkedIn Profile Work for You',
    desc: 'Upload your LinkedIn profile PDF (or paste text) to analyze headline strength, about section engagement, experience keywords, and generate recruiter headlines.',
    icon: Globe,
    overview: 'Your LinkedIn profile is your digital career brand. The LinkedIn Profile Analyser gives you a 4-dimension scorecard analyzing your headline, about section, experience keywords, and profile completeness — then generates AI-powered recruiter headlines to maximize your visibility.',
    whatYouLearn: ['How recruiters search and evaluate LinkedIn profiles', 'Writing compelling headlines that attract views', 'Optimizing your About section for engagement', 'Keyword strategies for LinkedIn SEO'],
    features: ['Upload Profile as PDF', '4 Dimension Scorecards', 'AI Recruiter Headlines Generator', 'Copy-to-Clipboard Suggestions', 'Profile Completeness Score', 'Keywords Gap Analysis'],
    launchPath: '/dashboard/tools/linkedin-analyser',
    badge: 'Brand Builder',
  },
  'cover-letter': {
    title: 'Cover Letter Builder',
    tagline: 'Write Compelling Cover Letters in Minutes',
    desc: 'Generate role-specific 250-350 word cover letters tailored to target company culture and matching your resume design template.',
    icon: FileText,
    overview: 'A great cover letter can be the difference between an interview and rejection. The Cover Letter Builder generates personalized, role-specific cover letters that match your resume style and speak directly to what employers are looking for — in just seconds.',
    whatYouLearn: ['Cover letter structure and best practices', 'Adapting tone for different company cultures', 'Connecting your experience to job requirements', 'Making a strong opening and closing statement'],
    features: ['Company Culture Matching', '3 Tone Options (Professional, Enthusiastic, Creative)', 'Template Style Mirroring', 'Instant PDF Export', '250-350 Word Optimization', 'Role-Specific Tailoring'],
    launchPath: '/dashboard/tools/cover-letter',
    badge: 'Differentiator',
  },
  'interview-prep': {
    title: 'Interview Prep Kit',
    tagline: 'Ace Every Interview with Confidence',
    desc: 'Generate 20 custom interview questions across 5 categories tailored to your resume and target JD, complete with STAR-format model answers.',
    icon: Bot,
    overview: 'Walk into your interview fully prepared. The Interview Prep Kit generates 20 custom questions tailored to your specific resume and the job description, covering behavioral, technical, situational, and role-specific questions — each with STAR-format model answers you can adapt.',
    whatYouLearn: ['How to use the STAR format for any question', 'Anticipating technical interview questions for your role', 'Crafting compelling behavioral stories', 'Preparing for industry-specific scenarios'],
    features: ['20 Custom Questions & STAR Answers', 'Behavioral & Technical Coverage', 'Targeted to Specific JD', 'Exportable PDF Prep Deck', '5 Question Categories', 'AI-Generated Model Answers'],
    launchPath: '/dashboard/tools/interview-prep',
    badge: 'Confidence Booster',
  },
  'i-assist': {
    title: 'I-Assist (Echo Desktop)',
    tagline: 'Your Real-Time AI Co-Pilot During Interviews',
    desc: 'Real-time speech teleprompter & interview co-pilot listening to interviewer questions via auto-transcription and rendering live STAR answer hint cards.',
    icon: Mic,
    overview: 'I-Assist is your secret weapon during live interviews. It listens to the interviewer\'s questions in real-time, automatically transcribes them, and instantly shows you relevant STAR answer hint cards on your screen — giving you the edge to deliver confident, structured responses.',
    whatYouLearn: ['How to use AI assistance ethically in interviews', 'Real-time answer structuring with STAR method', 'Managing interview anxiety with AI support', 'Reviewing transcripts post-interview for improvement'],
    features: ['Auto-Listening Mode (No Interviewer Video)', 'Real-Time Speech Transcript Stream', 'STAR Answer Hint Cards', 'Audio Level Visualization', 'Session Recording & Replay', 'Post-Interview Analysis'],
    launchPath: '/tools/i-assist',
    badge: 'Secret Weapon',
  },
  'live-interview': {
    title: 'AI Mock Interview',
    tagline: 'Practice with Real AI Interviewers — Before the Real Thing',
    desc: 'Experience realistic voice-to-voice probing, custom module assessment, and instant LLM-powered performance scorecards with PDF exports.',
    icon: Bot,
    overview: 'The AI Mock Interview puts you face-to-face with a sophisticated AI interviewer that asks real interview questions, probes your answers with follow-up questions, evaluates your responses in real-time, and delivers a comprehensive performance scorecard with specific improvement areas.',
    whatYouLearn: ['Handling unexpected follow-up questions under pressure', 'Calibrating your answer depth and conciseness', 'Identifying verbal filler words and communication patterns', 'Building confidence through repeated practice'],
    features: ['Real-Time Voice-to-Voice Interview', 'Custom Module Assessment', 'Instant LLM Performance Scorecards', 'PDF Report Export', 'Follow-Up Question Probing', 'Multi-Role Interview Templates'],
    launchPath: '/tools/live-interview',
    badge: 'Phase 2 Feature',
  },
};

const ToolsPreview = () => {
  const { toolId } = useParams<{ toolId: string }>();
  const { isAuthenticated } = useAuth();

  const tool = (toolId && TOOLS_DATA[toolId]) ? TOOLS_DATA[toolId] : TOOLS_DATA['resume-builder'];
  const Icon = tool.icon;

  return (
    <div className="min-h-screen bg-bg-canvas text-white pt-28 pb-20 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl">

        {/* Hero */}
        <div className="rounded-3xl border border-white/[0.12] bg-bg-surface/90 p-8 sm:p-12 shadow-2xl backdrop-blur-xl mb-8">
          <div className="flex items-start gap-5 mb-6">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-brand-orange/10 border border-brand-orange/20 text-brand-orange shadow-lg shadow-brand-orange/10">
              <Icon size={32} />
            </div>
            <div>
              <div className="flex items-center gap-3 mb-1">
                <span className="text-xs font-bold text-brand-orange uppercase tracking-wider">AI Career Tool</span>
                {tool.badge && (
                  <span className="rounded-full bg-brand-orange/15 border border-brand-orange/30 px-2.5 py-0.5 text-[10px] font-bold text-brand-orange uppercase tracking-wider">
                    {tool.badge}
                  </span>
                )}
              </div>
              <h1 className="font-display text-3xl sm:text-4xl font-extrabold text-white">{tool.title}</h1>
              <p className="text-base text-text-muted mt-1">{tool.tagline}</p>
            </div>
          </div>

          {/* Overview */}
          <div className="mb-8">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider mb-3 flex items-center gap-2">
              <Sparkles size={14} className="text-brand-orange" />
              Overview
            </h2>
            <p className="text-sm text-text-muted leading-relaxed">{tool.overview}</p>
          </div>

          {/* What You'll Learn */}
          <div className="mb-8 rounded-2xl bg-brand-orange/5 border border-brand-orange/15 p-5">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
              <Award size={14} className="text-brand-orange" />
              What You Will Learn
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {tool.whatYouLearn.map((item, i) => (
                <div key={i} className="flex items-start gap-2.5 text-sm text-text-muted">
                  <Check size={14} className="text-brand-orange shrink-0 mt-0.5" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Key Features */}
          <div className="mb-8 border-t border-white/[0.08] pt-6">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
              <Target size={14} className="text-brand-orange" />
              Key Features
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {tool.features.map((feat, idx) => (
                <div key={idx} className="flex items-center gap-2.5 text-sm text-text-muted rounded-xl bg-white/[0.02] border border-white/[0.05] px-3 py-2.5">
                  <Sparkles size={13} className="text-brand-orange shrink-0" />
                  <span>{feat}</span>
                </div>
              ))}
            </div>
          </div>

          {/* CTA */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-5 rounded-2xl bg-bg-card p-5 border border-white/[0.08]">
            <div className="flex items-center gap-3">
              <Lock className="text-brand-orange shrink-0" size={22} />
              <div>
                <h4 className="font-bold text-white text-sm">Tool Access & Subscriptions</h4>
                <p className="text-xs text-text-muted">Available with Basic, Pro, or Enterprise NxtGen Academy subscription plans.</p>
              </div>
            </div>

            {isAuthenticated ? (
              <Link
                to={tool.launchPath}
                className="shrink-0 flex items-center gap-2 rounded-xl bg-brand-orange px-6 py-2.5 text-sm font-bold text-white shadow-lg hover:bg-orange-600 transition-all hover:scale-105"
              >
                <span>Launch Tool</span>
                <ArrowRight size={16} />
              </Link>
            ) : (
              <Link
                to="/login"
                className="shrink-0 flex items-center gap-2 rounded-xl bg-brand-orange px-6 py-2.5 text-sm font-bold text-white shadow-lg hover:bg-orange-600 transition-all hover:scale-105"
              >
                <span>Sign In to Access</span>
                <ArrowRight size={16} />
              </Link>
            )}
          </div>
        </div>

        {/* Back Link */}
        <div className="text-center">
          <Link
            to="/#tools"
            className="inline-flex items-center gap-2 text-sm text-text-muted hover:text-brand-orange transition-colors"
          >
            ← Back to AI Tools Store
          </Link>
        </div>

      </div>
    </div>
  );
};

export default ToolsPreview;
