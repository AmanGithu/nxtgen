import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useDesktopDownload } from '../../hooks/useDesktopDownload';
import {
  Mic, Monitor, Brain, Shield, Zap, Clock, FileText, MessageSquare,
  ArrowRight, CheckCircle, Download, Headphones, Eye, EyeOff, Settings, Minus
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

          {/* Hero visual — mirrors the shipping desktop UI: the floating bar docked
              above the session window, same labels, controls and layout as the app.
              Worth keeping in step with desktop/src/index.html and session-window.html. */}
          <div className="mt-16 mx-auto max-w-4xl space-y-2">

            {/* Floating bar */}
            <div className="mx-auto flex max-w-lg items-center gap-2.5 rounded-xl border border-line bg-bg-card px-3 py-2 shadow-2xl">
              <span className="text-xs font-bold text-strong">I-Assist</span>
              <span className="text-[11px] font-medium text-text-muted">Backend Engineer</span>
              <span className="text-[11px] font-semibold tabular-nums text-brand-orange">04:12</span>
              <span className="flex items-center gap-1.5 text-[11px] text-text-muted">
                <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
                Session active
              </span>
              <span className="ml-auto flex items-center gap-2">
                <span className="hidden rounded-md border border-line px-2 py-0.5 text-[10px] text-text-muted sm:inline">Jane D…</span>
                <span className="flex h-5 w-5 items-center justify-center rounded-md bg-red-500">
                  <span className="h-1.5 w-1.5 rounded-[1px] bg-white" />
                </span>
                <Settings size={13} className="text-text-muted" />
                <Minus size={13} className="text-text-muted" />
              </span>
            </div>

            {/* Session window */}
            <div className="rounded-2xl border border-line bg-bg-surface p-1.5 shadow-2xl">
              <div className="rounded-xl bg-bg-card overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-line px-4 py-2.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-strong">Backend Engineer</span>
                    <span className="rounded-md bg-cat-technical-bg px-2 py-0.5 text-[10px] font-medium text-cat-technical">technical</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-[11px] font-semibold tabular-nums text-brand-orange">04:12</span>
                    <EyeOff size={13} className="text-text-muted" />
                    <span className="rounded-md bg-red-500 px-2.5 py-1 text-[10px] font-medium text-white">Stop</span>
                  </div>
                </div>

                <div className="grid grid-cols-5 divide-x divide-line min-h-[280px]">
                  {/* Questions heard */}
                  <div className="col-span-2">
                    <div className="flex items-center justify-between border-b border-line px-3 py-2">
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-text-muted">Questions</span>
                      <span className="rounded-full bg-elevate px-1.5 text-[10px] tabular-nums text-text-muted">3</span>
                    </div>
                    <div className="space-y-1 p-2">
                      <div className="rounded-lg px-2.5 py-2">
                        <p className="text-[10px] tabular-nums text-text-muted/60">00:31</p>
                        <p className="mt-0.5 text-[11px] leading-snug text-text-muted">How do you decide between a queue and a direct API call?</p>
                      </div>
                      <div className="rounded-lg px-2.5 py-2">
                        <p className="text-[10px] tabular-nums text-text-muted/60">01:58</p>
                        <p className="mt-0.5 text-[11px] leading-snug text-text-muted">Tell me about a time you had to debug a production outage.</p>
                      </div>
                      {/* Selected question — orange rule, as in the app */}
                      <div className="rounded-lg border-l-2 border-brand-orange bg-elevate px-2.5 py-2">
                        <p className="text-[10px] tabular-nums text-brand-orange">03:40</p>
                        <p className="mt-0.5 text-[11px] font-semibold leading-snug text-strong">Write a function to check if two strings are anagrams</p>
                      </div>
                    </div>
                  </div>

                  {/* Suggested answer */}
                  <div className="col-span-3">
                    <div className="border-b border-line px-3 py-2">
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-text-muted">Suggested Answer</span>
                    </div>
                    <div className="border-b border-line px-3 py-2 text-[11px] italic text-text-muted">
                      Write a function to check if two strings are anagrams
                    </div>
                    <div className="space-y-2 p-3">
                      <p className="text-[11px] leading-relaxed text-strong">
                        Sorting both sides is the one-liner, but I'd count characters instead — same answer in linear time rather than n log n.
                      </p>
                      {/* Fenced code renders as a real block in the app, with the language and a copy button */}
                      <div className="overflow-hidden rounded-lg border border-line bg-elevate">
                        <div className="flex items-center justify-between border-b border-line px-2.5 py-1">
                          <span className="font-mono text-[9px] uppercase tracking-wider text-brand-orange">python</span>
                          <span className="rounded border border-line px-1.5 text-[9px] text-text-muted">Copy</span>
                        </div>
                        <pre className="overflow-x-auto p-2.5 font-mono text-[10px] leading-relaxed text-strong">
<span className="text-purple-400">def</span> <span className="text-blue-400">is_anagram</span>(a, b):{'\n'}    <span className="text-purple-400">if</span> <span className="text-blue-400">len</span>(a) != <span className="text-blue-400">len</span>(b):{'\n'}        <span className="text-purple-400">return False</span>{'\n'}    counts = {'{}'}{'\n'}    <span className="text-purple-400">for</span> ch <span className="text-purple-400">in</span> a:{'\n'}        counts[ch] = counts.get(ch, <span className="text-amber-400">0</span>) + <span className="text-amber-400">1</span>{'\n'}    <span className="text-purple-400">for</span> ch <span className="text-purple-400">in</span> b:{'\n'}        <span className="text-purple-400">if</span> counts.get(ch, <span className="text-amber-400">0</span>) == <span className="text-amber-400">0</span>:{'\n'}            <span className="text-purple-400">return False</span>{'\n'}        counts[ch] -= <span className="text-amber-400">1</span>{'\n'}    <span className="text-purple-400">return True</span></pre>
                      </div>
                      <p className="text-[11px] leading-relaxed text-strong">
                        That's O(n) time and O(k) space for the alphabet, and it exits early the moment a count goes negative.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Live transcription tape */}
                <div className="flex items-center gap-2 border-t border-line px-4 py-2">
                  <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-red-500 animate-pulse" />
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-text-muted">Live transcription</span>
                  <span className="truncate text-[11px] text-strong">Write a function to check if two strings are anagrams</span>
                </div>

                {/* Ask box */}
                <div className="flex items-center gap-2 border-t border-line px-3 py-2">
                  <div className="flex-1 truncate rounded-lg border border-line bg-bg-surface px-3 py-1.5 text-[11px] text-text-muted/60">
                    Ask a question or type a command...
                  </div>
                  <span className="rounded-lg bg-brand-orange px-3 py-1.5 text-[11px] font-semibold text-on-brand">Send</span>
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
