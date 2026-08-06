import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Star,
  CheckCircle,
  ChevronRight,
  ChevronLeft,
  Play,
  Pause,
  Sparkles,
  Bot,
  FileText,
  Briefcase,
  Award,
  Globe,
  Cpu,
  Layers
} from 'lucide-react';
import { clsx } from 'clsx';

interface HeroSlide {
  id: string;
  image: string;
  badge: string;
  badgeIcon: any;
  title: string;
  highlightText: string;
  subtitle: string;
  primaryCtaText: string;
  primaryCtaLink: string;
  secondaryCtaText: string;
  secondaryCtaLink: string;
}

const HERO_SLIDES: HeroSlide[] = [
  {
    id: 'slide-1',
    image: '/hero_images/christian-wiediger-WkfDrhxDMC8-unsplash.jpg',
    badge: 'PHASE 2 REAL-TIME VOICE & 3D AVATAR',
    badgeIcon: Bot,
    title: 'Master Live Screening Interviews with',
    highlightText: 'Real AI Interviewers',
    subtitle: 'Experience realistic voice-to-voice probing, custom module assessment, and instant LLM-powered performance scorecards with PDF exports.',
    primaryCtaText: 'Start Live AI Interview',
    primaryCtaLink: '/tools/live-interview',
    secondaryCtaText: 'Explore All AI Tools',
    secondaryCtaLink: '/courses'
  },
  {
    id: 'slide-2',
    image: '/hero_images/daoud-abismail-gbxI8Wi4ZkQ-unsplash.jpg',
    badge: 'EXECUTIVE INTERVIEW CO-PILOT',
    badgeIcon: Cpu,
    title: 'Elevate Your Performance with',
    highlightText: 'Real-Time AI Assistants',
    subtitle: 'Context-aware document retrieval, custom assistant creation, RAG knowledge bases, and automated session transcripts at your fingertips.',
    primaryCtaText: 'Launch I-Assist',
    primaryCtaLink: '/tools/i-assist',
    secondaryCtaText: 'View Dashboard',
    secondaryCtaLink: '/dashboard/student/tools/i-assist'
  },
  {
    id: 'slide-3',
    image: '/hero_images/glenn-carstens-peters-P1qyEf1g0HU-unsplash.jpg',
    badge: 'SMART CAREER TOOLKIT',
    badgeIcon: FileText,
    title: 'Craft 100% ATS-Compliant Resumes That Get',
    highlightText: 'Recruiter Callbacks',
    subtitle: 'Live A4 WYSIWYG editor with inline AI bullet rewriter, keyword gap audit, and job description tailoring built for modern tech hiring.',
    primaryCtaText: 'Build AI Resume',
    primaryCtaLink: '/dashboard/student/tools/resume-builder',
    secondaryCtaText: 'Check ATS Score',
    secondaryCtaLink: '/dashboard/student/tools/ats-checker'
  },
  {
    id: 'slide-4',
    image: '/hero_images/nasa-1lfI7wkGWZ4-unsplash.jpg',
    badge: 'FLAGSHIP ACADEMY COHORTS',
    badgeIcon: Sparkles,
    title: 'Build Autonomous Multi-Agent Swarms &',
    highlightText: 'Production RAG Pipelines',
    subtitle: 'Learn directly from industry leaders using LangGraph, CrewAI, Vector Databases, and production MLOps engineering.',
    primaryCtaText: 'Explore AI Masterclass',
    primaryCtaLink: '/courses',
    secondaryCtaText: 'Upcoming Batches',
    secondaryCtaLink: '/upcoming-batches'
  },
  {
    id: 'slide-5',
    image: '/hero_images/hugo-rocha-qFpnvZ_j9HU-unsplash.jpg',
    badge: 'AI RECRUITER BRANDING',
    badgeIcon: Globe,
    title: 'Optimize Your Profile & Generate',
    highlightText: 'Role-Tailored Cover Letters',
    subtitle: 'Generate high-impact recruiter headlines, profile SEO audits, and tailored 250-word cover letters in seconds.',
    primaryCtaText: 'Analyze LinkedIn Profile',
    primaryCtaLink: '/dashboard/student/tools/linkedin-analyser',
    secondaryCtaText: 'Cover Letter Builder',
    secondaryCtaLink: '/dashboard/student/tools/cover-letter'
  },
  {
    id: 'slide-6',
    image: '/hero_images/jeffery-ho-oITfawv6t-8-unsplash.jpg',
    badge: 'GUARANTEED PLACEMENT PROGRAM',
    badgeIcon: Briefcase,
    title: 'Work on Enterprise AI Projects That',
    highlightText: 'Launch Your Career',
    subtitle: 'Build real AI call centers with LiveKit, AI receptionists with ElevenLabs, and deploy autonomous agents for live businesses.',
    primaryCtaText: 'Apply For Internship',
    primaryCtaLink: '/internship',
    secondaryCtaText: 'Explore Projects',
    secondaryCtaLink: '/internship'
  },
  {
    id: 'slide-7',
    image: '/hero_images/amelie-mourichon-sv8oOQaUb-o-unsplash.jpg',
    badge: 'GLOBAL CERTIFICATION HUB',
    badgeIcon: Award,
    title: 'Validate Your Technical Skills Across',
    highlightText: 'AWS, Azure & GenAI',
    subtitle: 'Accelerate your tech career with 200+ verified certification paths, practice mock exams, and hands-on capstone labs.',
    primaryCtaText: 'Explore Certifications',
    primaryCtaLink: '/certifications',
    secondaryCtaText: 'All Programs',
    secondaryCtaLink: '/courses'
  }
];

interface DynamicSlide {
  id: string;
  url: string;
  mediaType?: 'image' | 'video';
  badge?: string;
  title?: string;
  highlightText?: string;
  subtitle?: string;
  primaryCtaText?: string;
  primaryCtaLink?: string;
  secondaryCtaText?: string;
  secondaryCtaLink?: string;
  enabled?: boolean;
}

const Home = () => {
  const [slides, setSlides] = useState<DynamicSlide[]>([]);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);

  // Fetch dynamic theme assets from server API
  useEffect(() => {
    fetch('/api/theme-assets')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.slides)) {
          const activeOnly = data.slides.filter((s: any) => s.enabled !== false);
          if (activeOnly.length > 0) {
            setSlides(activeOnly);
            return;
          }
        }
        // Fallback to initial slides mapping
        setSlides(HERO_SLIDES.map(s => ({
          id: s.id,
          url: s.image,
          mediaType: 'image',
          badge: s.badge,
          title: s.title,
          highlightText: s.highlightText,
          subtitle: s.subtitle,
          primaryCtaText: s.primaryCtaText,
          primaryCtaLink: s.primaryCtaLink,
          secondaryCtaText: s.secondaryCtaText,
          secondaryCtaLink: s.secondaryCtaLink,
        })));
      })
      .catch(() => {
        setSlides(HERO_SLIDES.map(s => ({
          id: s.id,
          url: s.image,
          mediaType: 'image',
          badge: s.badge,
          title: s.title,
          highlightText: s.highlightText,
          subtitle: s.subtitle,
          primaryCtaText: s.primaryCtaText,
          primaryCtaLink: s.primaryCtaLink,
          secondaryCtaText: s.secondaryCtaText,
          secondaryCtaLink: s.secondaryCtaLink,
        })));
      });
  }, []);

  // Auto-play hero slider
  useEffect(() => {
    if (!isPlaying || slides.length === 0) return;
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [isPlaying, slides.length]);

  const activeSlide = slides[currentSlide] || slides[0] || {};
  const isVideo = activeSlide.mediaType === 'video' || (activeSlide.url && (activeSlide.url.endsWith('.mp4') || activeSlide.url.endsWith('.webm')));

  // Check if text overlay fields are present
  const hasTextOverlay = !!(
    activeSlide.title?.trim() || 
    activeSlide.subtitle?.trim() || 
    activeSlide.badge?.trim() || 
    activeSlide.highlightText?.trim()
  );

  return (
    <div className="flex flex-col gap-20 pb-24">
      {/* ─── FULL BACKGROUND IMAGE / VIDEO SLIDER HERO SECTION (100% FULL SCREEN) ─── */}
      <section className="hero-section relative w-full h-screen min-h-screen flex items-center overflow-hidden bg-black text-white pt-24 lg:pt-32 pb-16">
        {/* Background Image / Video Carousel Stack */}
        {slides.map((slide, index) => {
          const isVid = slide.mediaType === 'video' || (slide.url && (slide.url.endsWith('.mp4') || slide.url.endsWith('.webm')));
          return (
            <div
              key={slide.id}
              className={clsx(
                "absolute inset-0 w-full h-full transition-opacity duration-1000 ease-in-out pointer-events-none",
                index === currentSlide ? "opacity-100 z-0 scale-100" : "opacity-0 z-0 scale-105"
              )}
            >
              {isVid ? (
                <video
                  src={slide.url}
                  autoPlay
                  loop
                  muted
                  playsInline
                  className="w-full h-full object-cover object-center scale-105"
                />
              ) : (
                <img
                  src={slide.url}
                  alt={slide.title || "Hero Slide"}
                  className="w-full h-full object-cover object-center transform transition-transform duration-[8000ms] ease-out scale-105"
                />
              )}
              {/* Ultra-subtle 2% gradient overlay for maximum video and image clarity */}
              <div className="absolute inset-0 bg-black/[0.02] z-0 pointer-events-none" />
              <div className="absolute inset-0 bg-gradient-to-r from-black/30 via-black/10 via-40% to-transparent z-0 pointer-events-none" />
            </div>
          );
        })}

        {/* Hero Content Overlay - ONLY RENDERS IF TEXT OVERLAY IS CONFIGURED */}
        {hasTextOverlay && (
          <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 w-full">
            <div className="max-w-2xl lg:max-w-3xl space-y-6 animate-fade-in-up">
              {/* Badge Indicator */}
              {activeSlide.badge && (
                <div className="inline-flex items-center gap-2 rounded-full border border-brand-orange/40 bg-brand-orange/15 px-4 py-1.5 text-xs md:text-sm font-bold text-brand-orange backdrop-blur-md shadow-lg tracking-wide uppercase">
                  <Sparkles size={16} className="text-brand-orange animate-pulse" />
                  <span>{activeSlide.badge}</span>
                </div>
              )}

              {/* Dynamic Headline - Enforced Bright White */}
              {activeSlide.title && (
                <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight !text-white hero-text-white leading-[1.15]">
                  {activeSlide.title}{' '}
                  {activeSlide.highlightText && (
                    <span className="block mt-1 text-transparent bg-clip-text bg-gradient-to-r from-brand-orange via-amber-400 to-orange-500 drop-shadow-md">
                      {activeSlide.highlightText}
                    </span>
                  )}
                </h1>
              )}

              {/* Dynamic Subtitle */}
              {activeSlide.subtitle && (
                <p className="text-base sm:text-lg lg:text-xl text-slate-300 leading-relaxed max-w-2xl">
                  {activeSlide.subtitle}
                </p>
              )}

              {/* Action Call to Action Buttons */}
              {(activeSlide.primaryCtaText || activeSlide.secondaryCtaText) && (
                <div className="flex flex-wrap items-center gap-4 pt-4">
                  {activeSlide.primaryCtaText && (
                    <Link
                      to={activeSlide.primaryCtaLink || '/courses'}
                      className="rounded-xl bg-brand-orange px-7 py-3.5 text-sm font-bold !text-white hero-text-white transition-all hover:scale-105 hover:bg-orange-600 shadow-xl shadow-brand-orange/25 flex items-center gap-2"
                    >
                      <span>{activeSlide.primaryCtaText}</span>
                      <ArrowRight size={18} />
                    </Link>
                  )}
                  {activeSlide.secondaryCtaText && (
                    <Link
                      to={activeSlide.secondaryCtaLink || '/courses'}
                      className="rounded-xl border border-white/[0.2] bg-white/[0.08] px-7 py-3.5 text-sm font-bold !text-white hero-text-white transition-all hover:bg-white/[0.15] hover:border-white/[0.3] backdrop-blur-md"
                    >
                      {activeSlide.secondaryCtaText}
                    </Link>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Bottom Right Controller */}
        <div className="absolute bottom-6 right-6 z-20">
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="flex items-center gap-1.5 rounded-full border border-white/[0.15] bg-black/60 px-3.5 py-1.5 text-xs text-slate-300 hover:text-white backdrop-blur-md shadow-lg"
          >
            {isPlaying ? <Pause size={14} className="text-brand-orange" /> : <Play size={14} className="text-emerald-400" />}
            <span className="font-mono">{isPlaying ? 'Autoplay On' : 'Paused'}</span>
          </button>
        </div>
      </section>

      {/* Courses Section */}
      <section className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-10 flex items-end justify-between">
          <div>
            <h2 className="font-display text-3xl font-bold text-white sm:text-4xl">Master the Technologies of Tomorrow</h2>
            <p className="mt-2 text-text-muted">Industry-relevant curriculum designed by experts.</p>
          </div>
          <Link to="/courses" className="hidden sm:flex items-center gap-1 text-sm font-medium text-brand-orange hover:underline">
            View All Courses <ChevronRight size={16} />
          </Link>
        </div>
        
        <div className="flex gap-6 overflow-x-auto pb-6 snap-x snap-mandatory hide-scrollbar">
          {[
            { title: 'Generative AI Masterclass', desc: 'LLM Architecture, RAG & Fine-Tuning', tags: ['Prompt Eng', 'RAG', 'LoRA'] },
            { title: 'Agentic AI Development', desc: 'Multi-Agent Frameworks & Stateful Swarms', tags: ['LangGraph', 'CrewAI', 'Agents'] },
            { title: 'Data Analyst with GenAI', desc: 'SQL, Python Data Stack & Co-Pilots', tags: ['Python', 'SQL', 'Pandas'] },
            { title: 'Azure & SQL DBA Masterclass', desc: 'Cloud Architecture & DB Administration', tags: ['Azure', 'MSSQL', 'Cloud'] },
          ].map((course, i) => (
            <div key={i} className="group relative min-w-[300px] max-w-[320px] flex-none snap-start rounded-xl border border-white/[0.08] bg-bg-card p-5 transition-all duration-300 hover:scale-[1.02] hover:border-brand-orange/40 hover:shadow-xl flex flex-col justify-between">
              <div>
                <div className="mb-4 aspect-video w-full rounded-lg bg-bg-surface flex items-center justify-center border border-white/[0.04]">
                  <Layers size={32} className="text-brand-orange/70" />
                </div>
                <div className="flex items-center gap-2 mb-2">
                  <div className="flex text-brand-orange">
                    <Star size={14} fill="currentColor" />
                    <Star size={14} fill="currentColor" />
                    <Star size={14} fill="currentColor" />
                    <Star size={14} fill="currentColor" />
                    <Star size={14} fill="currentColor" />
                  </div>
                  <span className="text-xs text-text-muted">(4.9/5)</span>
                </div>
                <h3 className="mb-1 font-bold text-lg text-white group-hover:text-brand-orange transition-colors">{course.title}</h3>
                <p className="text-xs text-text-muted mb-4">{course.desc}</p>
                <div className="mb-4 flex flex-wrap gap-1.5">
                  {course.tags.map((t) => (
                    <span key={t} className="rounded bg-white/[0.05] px-2 py-0.5 text-[11px] text-text-muted">{t}</span>
                  ))}
                </div>
              </div>
              <div className="flex gap-3 mt-auto">
                <Link to="/courses" className="flex-1 text-center rounded-lg border border-white/[0.1] py-2 text-xs font-semibold transition-colors hover:bg-white/[0.05]">Explore</Link>
                <Link to="/courses" className="flex-1 text-center rounded-lg bg-brand-orange py-2 text-xs font-semibold text-white transition-colors hover:bg-orange-600">Enroll Now</Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Certifications Section */}
      <section className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-10 text-center">
          <h2 className="font-display text-3xl font-bold text-white sm:text-4xl">200+ Industry-Recognized Certifications</h2>
          <p className="mt-2 text-text-muted">Validate your skills and stand out to top tech employers worldwide.</p>
        </div>
        
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          {[
            'AWS Certified Solutions Architect',
            'Azure Solutions Architect Expert',
            'Generative AI Engineer Associate',
            'Google Cloud ML Engineer',
            'Databricks Certified Associate',
            'TensorFlow Developer Certificate'
          ].map((cert, i) => (
            <div key={i} className="flex flex-col items-center gap-3 rounded-xl border border-white/[0.08] bg-bg-card p-6 text-center transition-all hover:scale-105 hover:border-brand-orange/40 shadow-md">
              <div className="h-12 w-12 rounded-full bg-brand-orange/10 flex items-center justify-center text-brand-orange">
                <CheckCircle size={24} />
              </div>
              <h4 className="text-xs font-bold text-white leading-tight">{cert}</h4>
            </div>
          ))}
        </div>
        <div className="mt-8 text-center">
          <Link to="/certifications" className="inline-flex items-center gap-2 text-brand-orange font-bold hover:underline">
            Explore All 200+ Certifications <ArrowRight size={16} />
          </Link>
        </div>
      </section>

      {/* Internships Section */}
      <section className="bg-bg-surface py-20 border-y border-white/[0.08]">
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-12 text-center">
            <h2 className="font-display text-3xl font-bold text-white sm:text-4xl">Launch Your AI Career — Real-World Internships That Matter</h2>
            <p className="mt-2 text-text-muted">Work directly on enterprise-grade AI products and build an impressive portfolio.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="rounded-2xl border border-white/[0.08] bg-bg-card p-8 transition-transform hover:-translate-y-1 shadow-xl">
              <h3 className="mb-4 text-2xl font-bold text-white">Generative AI Internship</h3>
              <ul className="mb-8 space-y-3">
                <li className="flex items-start gap-3 text-text-muted">
                  <CheckCircle size={20} className="text-brand-orange shrink-0 mt-0.5" />
                  <span>Build an AI Call Center with LiveKit and WebRTC streams</span>
                </li>
                <li className="flex items-start gap-3 text-text-muted">
                  <CheckCircle size={20} className="text-brand-orange shrink-0 mt-0.5" />
                  <span>Master Production RAG, Vector DBs, and Custom Models</span>
                </li>
              </ul>
              <Link to="/internship" className="block text-center w-full rounded-lg bg-white/[0.05] py-3 font-semibold text-white border border-white/[0.1] hover:bg-white/[0.1] transition-colors">
                Apply For GenAI Internship
              </Link>
            </div>
            
            <div className="rounded-2xl border border-brand-orange/30 bg-bg-card p-8 relative overflow-hidden transition-transform hover:-translate-y-1 shadow-xl">
              <div className="absolute top-0 right-0 bg-brand-orange px-4 py-1 rounded-bl-lg text-xs font-bold text-white uppercase tracking-wider">
                MOST POPULAR
              </div>
              <h3 className="mb-4 text-2xl font-bold text-white">Agentic AI Internship</h3>
              <ul className="mb-8 space-y-3">
                <li className="flex items-start gap-3 text-text-muted">
                  <CheckCircle size={20} className="text-brand-orange shrink-0 mt-0.5" />
                  <span>Make Your Own AI Receptionist with ElevenLabs and Gemini</span>
                </li>
                <li className="flex items-start gap-3 text-text-muted">
                  <CheckCircle size={20} className="text-brand-orange shrink-0 mt-0.5" />
                  <span>Deploy autonomous agent swarms for real-world enterprise clients</span>
                </li>
              </ul>
              <Link to="/internship" className="block text-center w-full rounded-lg bg-brand-orange py-3 font-semibold text-white hover:bg-orange-600 transition-colors shadow-lg shadow-brand-orange/20">
                Apply For Agentic AI Internship
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Tools Suite Section */}
      <section className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 mb-12">
        <div className="mb-10 text-center">
          <h2 className="font-display text-3xl font-bold text-white sm:text-4xl">AI-Powered Career Toolkit — From Resume to Job Offer</h2>
          <p className="mt-2 text-text-muted">Explore 8 specialized AI tools designed to accelerate your job search success.</p>
        </div>
        
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { name: 'Live AI Interview', path: '/tools/live-interview', desc: 'Voice & 3D Avatar screening' },
            { name: 'I-Assist Co-Pilot', path: '/tools/i-assist', desc: 'Real-time context assistant' },
            { name: 'AI Resume Builder', path: '/dashboard/student/tools/resume-builder', desc: 'A4 WYSIWYG rewriter' },
            { name: 'ATS Score Checker', path: '/dashboard/student/tools/ats-checker', desc: '0-100% keyword audit' },
            { name: 'JD Resume Tailor', path: '/dashboard/student/tools/tailor-resume', desc: 'Targeted resume tailoring' },
            { name: 'LinkedIn Analyser', path: '/dashboard/student/tools/linkedin-analyser', desc: 'Profile SEO audit' },
            { name: 'Cover Letter AI', path: '/dashboard/student/tools/cover-letter', desc: '250-word letter generator' },
            { name: 'Interview Prep Kit', path: '/dashboard/student/tools/interview-prep', desc: 'STAR model Q&A cards' },
          ].map((tool, i) => (
            <Link
              key={i}
              to={tool.path}
              className="rounded-2xl border border-white/[0.08] bg-bg-card p-5 transition-all hover:border-brand-orange/40 hover:scale-[1.02] shadow-md group flex flex-col justify-between"
            >
              <div>
                <div className="mb-3 h-10 w-10 rounded-xl bg-brand-orange/10 flex items-center justify-center text-brand-orange group-hover:scale-110 transition-transform">
                  <FileText size={20} />
                </div>
                <h4 className="font-bold text-sm text-white group-hover:text-brand-orange transition-colors">{tool.name}</h4>
                <p className="text-xs text-text-muted mt-1">{tool.desc}</p>
              </div>
              <div className="mt-4 flex items-center text-xs font-semibold text-brand-orange gap-1">
                <span>Launch Tool</span>
                <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
};

export default Home;
