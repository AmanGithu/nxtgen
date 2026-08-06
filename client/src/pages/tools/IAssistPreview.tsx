import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useDesktopDownload } from '../../hooks/useDesktopDownload';
import {
  Mic, Monitor, Brain, Shield, Zap, Clock, FileText, MessageSquare,
  ArrowRight, CheckCircle, Download, Headphones, Eye, EyeOff
} from 'lucide-react';

const FEATURES = [
  {
    icon: Mic,
    title: 'Real-Time Transcription',
    desc: 'System audio loopback captures interviewer questions as they speak. Gemini-powered transcription converts speech to text instantly.',
  },
  {
    icon: Brain,
    title: 'AI-Powered Coaching',
    desc: 'Context-aware responses using your resume, job description, and prep materials. STAR-format answers for behavioral, code for technical.',
  },
  {
    icon: Eye,
    title: 'Stealth Overlay',
    desc: 'Transparent floating window sits on top of your video call. Adjustable opacity so only you can see the coaching hints.',
  },
  {
    icon: FileText,
    title: 'Context Documents',
    desc: 'Attach your resume, JD, and study notes directly to each assistant. Context is automatically injected into every AI response.',
  },
  {
    icon: Zap,
    title: 'Interview Categories',
    desc: 'Specialized modes for Behavioral, Technical, System Design, and General interviews. Each shapes how the AI structures responses.',
  },
  {
    icon: Clock,
    title: 'Session History',
    desc: 'Every session is recorded with structured transcripts. Review Q&A pairs, track questions answered, and measure improvement.',
  },
];

const STEPS = [
  {
    num: '01',
    title: 'Set Up Your Assistant',
    desc: 'Create an interview assistant in the web dashboard. Choose a category, attach your resume, paste the job description, and add any prep notes.',
    icon: FileText,
  },
  {
    num: '02',
    title: 'Launch the Desktop App',
    desc: 'Open the I-Assist desktop app and sign in with your NxtGen account. Select your assistant and start a new session.',
    icon: Monitor,
  },
  {
    num: '03',
    title: 'Join Your Interview',
    desc: 'Join your video call as normal. I-Assist listens to system audio in the background — no screen sharing or browser extensions needed.',
    icon: Headphones,
  },
  {
    num: '04',
    title: 'Get Real-Time Coaching',
    desc: 'As the interviewer asks questions, I-Assist transcribes them and generates tailored response suggestions in the stealth overlay.',
    icon: Brain,
  },
];

const CATEGORIES = [
  { name: 'Behavioral', color: '#7F77DD', desc: 'STAR-format answers for leadership, teamwork, and problem-solving questions' },
  { name: 'Technical', color: '#1D9E75', desc: 'Code explanations, complexity analysis, algorithm trade-offs' },
  { name: 'System Design', color: '#D85A30', desc: 'Architecture breakdowns, scalability trade-offs, back-of-envelope calculations' },
  { name: 'General', color: '#888780', desc: 'Adaptive format — detects question type and responds accordingly' },
];

const IAssistPreview = () => {
  const { isAuthenticated } = useAuth();
  const { url: downloadUrl } = useDesktopDownload();

  return (
    <div className="flex flex-col gap-0 pb-0">
      {/* Hero */}
      <section className="relative overflow-hidden pt-16 pb-20 lg:pt-24 lg:pb-28">
        <div className="pointer-events-none absolute left-1/2 top-0 -z-10 -ml-[39rem] w-[152.5rem] max-w-none transform-gpu opacity-50 blur-3xl">
          <div className="aspect-[1097/845] w-[68.5625rem] bg-gradient-to-tr from-[#f5820b] to-[#111118] opacity-25"></div>
        </div>

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-brand-orange/30 bg-brand-orange/10 px-4 py-1.5 text-sm font-medium text-brand-orange mb-6">
              <Mic size={16} />
              AI Interview Co-Pilot
            </div>

            <h1 className="font-display text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
              Ace Every Interview with{' '}
              {/* nowrap because a browser treats the hyphen in "I-Assist" as a break
                  opportunity and splits the product name across two lines. */}
              <span className="whitespace-nowrap text-brand-orange">I-Assist</span>
            </h1>

            <p className="mt-6 text-lg text-text-muted leading-relaxed max-w-2xl mx-auto">
              A desktop app that listens to your live interview, transcribes questions in real-time,
              and delivers AI-powered coaching hints through a stealth overlay — personalised with
              your resume and prep materials.
            </p>

            <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
              {/* The installer is offered to everyone, signed in or not — the download
                  endpoint is public. The account CTA sits alongside it and drops to
                  secondary styling so there is still one clear primary action. */}
              {downloadUrl && (
                <a
                  href={downloadUrl}
                  download
                  className="inline-flex items-center gap-2 rounded-lg bg-brand-orange px-6 py-3 font-semibold text-on-brand transition-all hover:scale-105 hover:bg-orange-600 shadow-lg shadow-brand-orange/20"
                >
                  <Download size={18} />
                  Get the Desktop App
                </a>
              )}
              <Link
                to={isAuthenticated ? '/dashboard/student/tools/i-assist' : '/login'}
                className={
                  downloadUrl
                    ? 'inline-flex items-center gap-2 rounded-lg border border-line-strong bg-elevate px-6 py-3 font-medium text-strong transition-all hover:bg-elevate backdrop-blur-sm'
                    : 'inline-flex items-center gap-2 rounded-lg bg-brand-orange px-6 py-3 font-semibold text-on-brand transition-all hover:scale-105 hover:bg-orange-600 shadow-lg shadow-brand-orange/20'
                }
              >
                {isAuthenticated ? 'Open I-Assist' : 'Sign In to Get Started'}
                <ArrowRight size={18} />
              </Link>
              <a
                href="#how-it-works"
                className="inline-flex items-center gap-2 rounded-lg border border-line-strong bg-elevate px-6 py-3 font-medium text-strong transition-all hover:bg-elevate backdrop-blur-sm"
              >
                See How It Works
                <ArrowRight size={16} />
              </a>
            </div>
          </div>

          {/* Hero visual — desktop app mockup */}
          <div className="mt-16 mx-auto max-w-4xl">
            <div className="rounded-2xl border border-line bg-bg-surface p-1.5 shadow-2xl">
              <div className="rounded-xl bg-bg-card overflow-hidden">
                {/* Title bar */}
                <div className="flex items-center gap-2 border-b border-line px-4 py-2.5">
                  <div className="flex gap-1.5">
                    <div className="h-3 w-3 rounded-full bg-red-500/60"></div>
                    <div className="h-3 w-3 rounded-full bg-yellow-500/60"></div>
                    <div className="h-3 w-3 rounded-full bg-green-500/60"></div>
                  </div>
                  <span className="ml-2 text-xs text-text-muted font-medium">I-Assist — Interview Session</span>
                  <div className="ml-auto flex items-center gap-3 text-text-muted">
                    <EyeOff size={14} />
                    <span className="text-[11px] tabular-nums">opacity: 85%</span>
                  </div>
                </div>

                {/* Mock content */}
                <div className="grid grid-cols-5 divide-x divide-line min-h-[280px]">
                  {/* Transcript panel */}
                  <div className="col-span-2 p-4 space-y-3">
                    <p className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Live Transcript</p>
                    <div className="space-y-2">
                      <div className="rounded-lg bg-elevate p-2.5">
                        <p className="text-[11px] text-amber-400/80 font-medium mb-0.5">Interviewer</p>
                        <p className="text-xs text-text-muted leading-relaxed">"Tell me about a time you led a team through a difficult technical challenge."</p>
                        <p className="text-[10px] text-text-muted/50 mt-1 tabular-nums">0:42</p>
                      </div>
                      <div className="rounded-lg bg-elevate p-2.5">
                        <p className="text-[11px] text-amber-400/80 font-medium mb-0.5">Interviewer</p>
                        <p className="text-xs text-text-muted leading-relaxed">"What was the outcome? How did you measure success?"</p>
                        <p className="text-[10px] text-text-muted/50 mt-1 tabular-nums">2:15</p>
                      </div>
                    </div>
                  </div>

                  {/* AI response panel */}
                  <div className="col-span-3 p-4 space-y-3">
                    <p className="text-[10px] font-bold text-text-muted uppercase tracking-wider">AI Coaching</p>
                    <div className="rounded-lg border border-green-500/20 bg-green-500/[0.05] p-3">
                      <p className="text-xs text-strong leading-relaxed">
                        <span className="font-bold text-green-400">Situation:</span> At [Company], our payment processing system was experiencing 12% failure rates during peak traffic...
                      </p>
                      <p className="text-xs text-strong leading-relaxed mt-2">
                        <span className="font-bold text-green-400">Task:</span> I was asked to lead a 4-person team to redesign the payment pipeline within 6 weeks...
                      </p>
                      <p className="text-xs text-strong leading-relaxed mt-2">
                        <span className="font-bold text-green-400">Action:</span> I introduced circuit breakers, migrated to async processing...
                      </p>
                      <p className="text-xs text-strong leading-relaxed mt-2">
                        <span className="font-bold text-green-400">Result:</span> Failure rate dropped to 0.3%, processing 2.4M transactions/day...
                      </p>
                    </div>
                  </div>
                </div>

                {/* Bottom bar */}
                <div className="flex items-center justify-between border-t border-line px-4 py-2">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></div>
                    <span className="text-[11px] text-text-muted">Session active</span>
                  </div>
                  <div className="flex items-center gap-4 text-[11px] text-text-muted tabular-nums">
                    <span>14 questions</span>
                    <span>18:22</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20 lg:py-24 border-t border-line-subtle">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="font-display text-3xl font-bold sm:text-4xl">How It Works</h2>
            <p className="mt-3 text-text-muted">From setup to live coaching in 4 steps</p>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((step) => {
              const Icon = step.icon;
              return (
                <div key={step.num} className="group relative rounded-xl border border-line bg-bg-surface p-6 transition-colors hover:border-brand-orange/30">
                  <div className="absolute -top-3 left-6 rounded-full bg-brand-orange px-2.5 py-0.5 text-xs font-bold text-on-brand">
                    {step.num}
                  </div>
                  <div className="mt-2 mb-4 rounded-lg bg-brand-orange/10 p-2.5 text-brand-orange w-fit">
                    <Icon size={22} />
                  </div>
                  <h3 className="text-sm font-bold text-strong mb-2">{step.title}</h3>
                  <p className="text-xs text-text-muted leading-relaxed">{step.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 lg:py-24 border-t border-line-subtle bg-bg-surface/30">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="font-display text-3xl font-bold sm:text-4xl">Everything You Need</h2>
            <p className="mt-3 text-text-muted">Purpose-built for live interview coaching</p>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((feat) => {
              const Icon = feat.icon;
              return (
                <div key={feat.title} className="rounded-xl border border-line bg-bg-surface p-6 transition-colors hover:border-line-strong">
                  <div className="mb-4 rounded-lg bg-brand-orange/10 p-2.5 text-brand-orange w-fit">
                    <Icon size={22} />
                  </div>
                  <h3 className="text-sm font-bold text-strong mb-2">{feat.title}</h3>
                  <p className="text-xs text-text-muted leading-relaxed">{feat.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Interview Categories */}
      <section className="py-20 lg:py-24 border-t border-line-subtle">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="font-display text-3xl font-bold sm:text-4xl">Interview Categories</h2>
            <p className="mt-3 text-text-muted">Specialised AI coaching for every interview format</p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {CATEGORIES.map((cat) => (
              <div key={cat.name} className="rounded-xl border border-line bg-bg-surface p-5 transition-colors hover:border-line-strong">
                <div className="flex items-center gap-2.5 mb-3">
                  <div className="h-3 w-3 rounded-full" style={{ backgroundColor: cat.color }}></div>
                  <h3 className="text-sm font-bold text-strong">{cat.name}</h3>
                </div>
                <p className="text-xs text-text-muted leading-relaxed">{cat.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Privacy / Security */}
      <section className="py-20 lg:py-24 border-t border-line-subtle bg-bg-surface/30">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-2xl border border-line bg-bg-surface p-8 sm:p-12">
            <div className="flex items-start gap-4 mb-6">
              <div className="rounded-xl bg-brand-orange/10 p-3 text-brand-orange shrink-0">
                <Shield size={28} />
              </div>
              <div>
                <h2 className="font-display text-2xl font-bold">Privacy First</h2>
                <p className="mt-1 text-sm text-text-muted">Your interview data stays yours</p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {[
                'Audio is processed in real-time and never stored on our servers',
                'Transcripts are saved to your account — only you can see them',
                'Desktop auth uses one-time cryptographic codes with 5-minute expiry',
                'All API communication is encrypted over HTTPS',
                'No screen recording, no video capture — audio only',
                'Sign out remotely from the web dashboard at any time',
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-2.5">
                  <CheckCircle size={16} className="text-green-400 shrink-0 mt-0.5" />
                  <p className="text-sm text-text-muted">{item}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 lg:py-24 border-t border-line-subtle">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="font-display text-3xl font-bold sm:text-4xl">
            Ready to Ace Your Next Interview?
          </h2>
          <p className="mt-4 text-text-muted">
            Set up your first assistant in under 2 minutes. Attach your resume, pick a category, and download the desktop app.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            {downloadUrl && (
              <a
                href={downloadUrl}
                download
                className="inline-flex items-center gap-2 rounded-lg bg-brand-orange px-8 py-3.5 font-semibold text-on-brand transition-all hover:scale-105 hover:bg-orange-600 shadow-lg shadow-brand-orange/20"
              >
                <Download size={18} />
                Download Desktop App
              </a>
            )}
            {isAuthenticated ? (
              <Link
                to="/dashboard/student/tools/i-assist/assistants"
                className="inline-flex items-center gap-2 rounded-lg border border-line-strong bg-elevate px-8 py-3.5 font-medium text-strong transition-all hover:bg-elevate"
              >
                Manage Assistants
                <ArrowRight size={16} />
              </Link>
            ) : (
              <Link
                to="/login"
                className={
                  downloadUrl
                    ? 'inline-flex items-center gap-2 rounded-lg border border-line-strong bg-elevate px-8 py-3.5 font-medium text-strong transition-all hover:bg-elevate'
                    : 'inline-flex items-center gap-2 rounded-lg bg-brand-orange px-8 py-3.5 font-semibold text-on-brand transition-all hover:scale-105 hover:bg-orange-600 shadow-lg shadow-brand-orange/20'
                }
              >
                Get Started Free
                <ArrowRight size={18} />
              </Link>
            )}
          </div>

          <p className="mt-6 text-xs text-text-muted/60">
            Available for Windows, macOS, and Linux. Requires a NxtGen Academy account.
          </p>
        </div>
      </section>
    </div>
  );
};

export default IAssistPreview;
