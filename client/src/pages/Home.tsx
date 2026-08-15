import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowRight,
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
  Layers,
  Database,
  Shield,
  Brain,
  Users,
  Lightbulb,
  TrendingUp,
  MessageSquare,
  Headphones,
  Server,
  Building2,
  CheckCircle,
  Package,
  Wrench,
} from 'lucide-react';
import { clsx } from 'clsx';
import EnrollmentModal from '../components/EnrollmentModal';
import { ProviderLogo } from '../components/ProviderLogo';
import { POPULAR_PROVIDERS } from '../data/certificationsData';
import { CAREER_TOOLS } from '../lib/tools';

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
    secondaryCtaLink: '/courses',
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
    secondaryCtaLink: '/upcoming-batches',
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
    secondaryCtaLink: '/internship',
  },
  {
    id: 'slide-7',
    image: '/hero_images/amelie-mourichon-sv8oOQaUb-o-unsplash.jpg',
    badge: 'GLOBAL CERTIFICATION HUB',
    badgeIcon: Award,
    title: 'Validate Your Technical Skills Across',
    highlightText: 'AWS, Azure & GenAI',
    subtitle: 'Accelerate your tech career with verified certification paths, practice mock exams, and hands-on capstone labs.',
    primaryCtaText: 'Explore Certifications',
    primaryCtaLink: '/certifications',
    secondaryCtaText: 'All Programs',
    secondaryCtaLink: '/courses',
  },
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

// ─── Course Categories ───
const COURSE_CATEGORIES = [
  {
    id: 'data-analytics-ai',
    name: 'Data Analytics & AI',
    image: '/assets/courses/data-analytics-ai.png',
    keywords: ['Python', 'ML', 'Power BI', 'GenAI', 'Tableau'],
    section: 'data-analytics',
    description: 'Master data analysis, machine learning, and AI-powered analytics with industry tools.',
  },
  {
    id: 'database-management',
    name: 'Database Management',
    image: '/assets/courses/database-management.png',
    keywords: ['SQL', 'Azure DBA', 'Oracle', 'PostgreSQL', 'Cloud'],
    section: 'database',
    description: 'Become a certified database administrator with expertise in SQL, Azure, Oracle, and more.',
  },
  {
    id: 'cyber-security',
    name: 'Cyber Security',
    image: '/assets/courses/cyber-security.png',
    keywords: ['Security+', 'CISSP', 'Ethical Hacking', 'SOC', 'CompTIA'],
    section: 'cybersecurity',
    description: 'Protect enterprise infrastructure with cutting-edge cybersecurity skills and certifications.',
  },
];

// ─── Internship Categories ───
const INTERNSHIP_CATEGORIES = [
  {
    id: 'data-analytics',
    name: 'Data Analytics Internship',
    image: '/assets/internships/data-analytics.png',
    keywords: ['Python', 'SQL', 'Dashboards', 'ML', 'Insights'],
    description: 'Work on real-world telemetry analytics, automated dashboards & predictive ML pipelines.',
  },
  {
    id: 'generative-ai',
    name: 'Generative AI Internship',
    image: '/assets/internships/generative-ai.png',
    keywords: ['LLMs', 'RAG', 'Vector DBs', 'Certification', 'GenAI'],
    description: 'Enterprise LLM deployments, RAG vector pipelines & official vendor certification.',
  },
  {
    id: 'agentic-ai',
    name: 'Agentic AI Internship',
    image: '/assets/internships/agentic-ai.png',
    keywords: ['LangGraph', 'CrewAI', 'AutoGPT', 'Multi-Agent', 'Swarms'],
    description: 'Autonomous multi-agent swarms, tool-use agents & production orchestrations.',
  },
  {
    id: 'database-management',
    name: 'Database Management Internship',
    image: '/assets/internships/database-management.png',
    keywords: ['SQL', 'Azure DBA', 'Certification', 'Cloud', 'HA'],
    description: 'Mission-critical database clusters, cloud migrations & DB performance tuning.',
  },
];

// ─── Corporate Services ───
const CORPORATE_SERVICES = [
  {
    id: 'training',
    title: 'Upskilling & Reskilling Training',
    icon: Users,
    image: '/assets/corporate/training.png',
    description: 'Bulk training programs for Data Analytics, Generative AI, Agentic AI, CyberSecurity, and Database Management.',
    cta: 'Request Training',
    href: '/corporate#training',
    keywords: ['Data Analytics', 'GenAI', 'Agentic AI', 'CyberSecurity', 'DBA'],
  },
  {
    id: 'bulk-enrollments',
    title: 'Bulk Enrollments',
    icon: Package,
    image: '/assets/corporate/bulk-enrollments.png',
    description: 'Enroll your teams in bulk for courses, certifications, and internships for upskilling and reskilling.',
    cta: 'Get Bulk Quote',
    href: '/corporate#enrollments',
    keywords: ['Courses', 'Certifications', 'Internships', 'Teams'],
  },
  {
    id: 'consulting',
    title: 'AI & Tech Consulting',
    icon: Lightbulb,
    image: '/assets/corporate/consulting.png',
    description: 'Expert consulting services in Artificial Intelligence (AI), Cyber Security (CS), and Database Management (DBM).',
    cta: 'Book Consultation',
    href: '/corporate#consulting',
    keywords: ['AI', 'Cyber Security', 'DBM', 'Strategy'],
  },
  {
    id: 'custom-solutions',
    title: 'Custom AI Solutions',
    icon: Wrench,
    image: '/assets/corporate/custom-solutions.png',
    description: 'Custom solutions for Resource Training, Consultation, and AI/ML Model development tailored to your enterprise.',
    cta: 'Explore Solutions',
    href: '/corporate#custom',
    keywords: ['AI/ML Models', 'Custom Training', 'Enterprise', 'R&D'],
  },
];

// ─── Job Support Services ───
const JOB_SUPPORT_SERVICES = [
  {
    id: 'data-ai',
    title: 'Data Analytics & AI Support',
    icon: Brain,
    image: '/assets/job-support/data-ai.png',
    items: ['Data Analytics', 'Excel', 'PowerBI', 'Tableau', 'Python', 'Machine Learning', 'Deep Learning', 'Generative AI'],
    description: 'Expert technical support for data professionals tackling complex analytics and AI challenges at work.',
  },
  {
    id: 'data-engineering',
    title: 'Data Engineering Support',
    icon: Server,
    image: '/assets/job-support/data-engineering.png',
    items: ['Microsoft Fabric', 'Databricks', 'ETL Pipelines', 'Azure Data Factory'],
    description: 'Resolve tough data engineering challenges with enterprise-grade pipeline and platform expertise.',
  },
  {
    id: 'database-mgmt',
    title: 'Database Management Support',
    icon: Database,
    image: '/assets/job-support/database-mgmt.png',
    items: ['SQL & Azure DBA', 'Oracle DBA', 'PostgreSQL DBA', 'Performance Tuning'],
    description: 'Hands-on support for DBA professionals managing production databases and complex infrastructure.',
  },
];

const Home = () => {
  const navigate = useNavigate();
  const [slides, setSlides] = useState<DynamicSlide[]>([]);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [enrollModal, setEnrollModal] = useState<{ open: boolean; program: string }>({ open: false, program: '' });

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
        setSlides(HERO_SLIDES.map((s) => ({
          id: s.id, url: s.image, mediaType: 'image',
          badge: s.badge, title: s.title, highlightText: s.highlightText,
          subtitle: s.subtitle, primaryCtaText: s.primaryCtaText,
          primaryCtaLink: s.primaryCtaLink, secondaryCtaText: s.secondaryCtaText,
          secondaryCtaLink: s.secondaryCtaLink,
        })));
      })
      .catch(() => {
        setSlides(HERO_SLIDES.map((s) => ({
          id: s.id, url: s.image, mediaType: 'image',
          badge: s.badge, title: s.title, highlightText: s.highlightText,
          subtitle: s.subtitle, primaryCtaText: s.primaryCtaText,
          primaryCtaLink: s.primaryCtaLink, secondaryCtaText: s.secondaryCtaText,
          secondaryCtaLink: s.secondaryCtaLink,
        })));
      });
  }, []);

  useEffect(() => {
    if (!isPlaying || slides.length === 0) return;
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [isPlaying, slides.length]);

  const activeSlide = slides[currentSlide] || slides[0] || {};
  const isVideo = activeSlide.mediaType === 'video' || (activeSlide.url && (activeSlide.url.endsWith('.mp4') || activeSlide.url.endsWith('.webm')));
  const hasTextOverlay = !!(activeSlide.title?.trim() || activeSlide.subtitle?.trim() || activeSlide.badge?.trim() || activeSlide.highlightText?.trim());

  const openEnroll = (program: string) => setEnrollModal({ open: true, program });
  const closeEnroll = () => setEnrollModal({ open: false, program: '' });

  return (
    <div className="flex flex-col gap-20 pb-24">
      {/* ─── HERO SECTION ─── */}
      <section className="hero-section relative w-full h-screen min-h-screen flex items-center overflow-hidden bg-black text-white pt-24 lg:pt-32 pb-16">
        {slides.map((slide, index) => {
          const isVid = slide.mediaType === 'video' || (slide.url && (slide.url.endsWith('.mp4') || slide.url.endsWith('.webm')));
          return (
            <div
              key={slide.id}
              className={clsx(
                'absolute inset-0 w-full h-full transition-opacity duration-1000 ease-in-out pointer-events-none',
                index === currentSlide ? 'opacity-100 z-0' : 'opacity-0 z-0'
              )}
            >
              {isVid ? (
                <video src={slide.url} autoPlay loop muted playsInline className="w-full h-full object-cover object-center scale-105" />
              ) : (
                <img src={slide.url} alt={slide.title || 'Hero Slide'} className="w-full h-full object-cover object-center scale-105" />
              )}
              <div className="absolute inset-0 bg-black/[0.02] z-0 pointer-events-none" />
              <div className="absolute inset-0 bg-gradient-to-r from-black/30 via-black/10 via-40% to-transparent z-0 pointer-events-none" />
            </div>
          );
        })}

        {hasTextOverlay && (
          <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 w-full">
            <div className="max-w-2xl lg:max-w-3xl space-y-6">
              {activeSlide.badge && (
                <div className="inline-flex items-center gap-2 rounded-full border border-brand-orange/40 bg-brand-orange/15 px-4 py-1.5 text-xs md:text-sm font-bold text-brand-orange backdrop-blur-md shadow-lg tracking-wide uppercase">
                  <Sparkles size={16} className="text-brand-orange animate-pulse" />
                  <span>{activeSlide.badge}</span>
                </div>
              )}
              {activeSlide.title && (
                <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight !text-white leading-[1.15]">
                  {activeSlide.title}{' '}
                  {activeSlide.highlightText && (
                    <span className="block mt-1 text-transparent bg-clip-text bg-gradient-to-r from-brand-orange via-amber-400 to-orange-500 drop-shadow-md">
                      {activeSlide.highlightText}
                    </span>
                  )}
                </h1>
              )}
              {activeSlide.subtitle && (
                <p className="text-base sm:text-lg lg:text-xl text-slate-300 leading-relaxed max-w-2xl">
                  {activeSlide.subtitle}
                </p>
              )}
              {(activeSlide.primaryCtaText || activeSlide.secondaryCtaText) && (
                <div className="flex flex-wrap items-center gap-4 pt-4">
                  {activeSlide.primaryCtaText && (
                    <Link
                      to={activeSlide.primaryCtaLink || '/courses'}
                      className="rounded-xl bg-brand-orange px-7 py-3.5 text-sm font-bold !text-white transition-all hover:scale-105 hover:bg-orange-600 shadow-xl shadow-brand-orange/25 flex items-center gap-2"
                    >
                      <span>{activeSlide.primaryCtaText}</span>
                      <ArrowRight size={18} />
                    </Link>
                  )}
                  {activeSlide.secondaryCtaText && (
                    <Link
                      to={activeSlide.secondaryCtaLink || '/courses'}
                      className="rounded-xl border border-white/[0.2] bg-white/[0.08] px-7 py-3.5 text-sm font-bold !text-white transition-all hover:bg-white/[0.15] hover:border-white/[0.3] backdrop-blur-md"
                    >
                      {activeSlide.secondaryCtaText}
                    </Link>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Slide Controls */}
        <div className="absolute bottom-6 left-0 right-0 z-20 flex items-center justify-between px-6">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length)}
              className="flex h-8 w-8 items-center justify-center rounded-full border border-white/[0.15] bg-black/60 text-white backdrop-blur-md hover:bg-black/80"
            >
              <ChevronLeft size={16} />
            </button>
            <div className="flex gap-1.5">
              {slides.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentSlide(i)}
                  className={clsx('h-1.5 rounded-full transition-all duration-300', i === currentSlide ? 'w-6 bg-brand-orange' : 'w-1.5 bg-white/30')}
                />
              ))}
            </div>
            <button
              onClick={() => setCurrentSlide((prev) => (prev + 1) % slides.length)}
              className="flex h-8 w-8 items-center justify-center rounded-full border border-white/[0.15] bg-black/60 text-white backdrop-blur-md hover:bg-black/80"
            >
              <ChevronRight size={16} />
            </button>
          </div>
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="flex items-center gap-1.5 rounded-full border border-white/[0.15] bg-black/60 px-3.5 py-1.5 text-xs text-slate-300 hover:text-white backdrop-blur-md shadow-lg"
          >
            {isPlaying ? <Pause size={14} className="text-brand-orange" /> : <Play size={14} className="text-emerald-400" />}
            <span className="font-mono">{isPlaying ? 'Autoplay On' : 'Paused'}</span>
          </button>
        </div>
      </section>

      {/* ─── COURSES SECTION ─── */}
      <section className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-10 flex items-end justify-between">
          <div>
            <h2 className="font-display text-3xl font-bold text-white sm:text-4xl">Master the Technologies of Tomorrow</h2>
            <p className="mt-2 text-text-muted">Industry-relevant curriculum designed by experts. 3 core categories available.</p>
          </div>
          <Link to="/courses" className="hidden sm:flex items-center gap-1 text-sm font-medium text-brand-orange hover:underline">
            View All Courses <ChevronRight size={16} />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {COURSE_CATEGORIES.map((course) => (
            <div
              key={course.id}
              className="group relative rounded-2xl border border-white/[0.08] bg-bg-card overflow-hidden transition-all duration-300 hover:scale-[1.02] hover:border-brand-orange/40 hover:shadow-xl flex flex-col"
            >
              {/* Image */}
              <div className="relative w-full aspect-video overflow-hidden">
                <img
                  src={course.image}
                  alt={course.name}
                  className="w-full h-full object-cover object-center transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-bg-card/80 to-transparent pointer-events-none" />
              </div>

              {/* Content */}
              <div className="flex flex-col flex-1 p-5">
                <h3 className="mb-1 font-bold text-lg text-white group-hover:text-brand-orange transition-colors">{course.name}</h3>
                <p className="text-xs text-text-muted mb-4 leading-relaxed">{course.description}</p>
                <div className="mb-4 flex flex-wrap gap-1.5">
                  {course.keywords.map((t) => (
                    <span key={t} className="rounded bg-white/[0.05] px-2 py-0.5 text-[11px] text-text-muted">{t}</span>
                  ))}
                </div>
                <div className="flex gap-3 mt-auto">
                  <Link
                    to={`/courses#${course.section}`}
                    className="flex-1 text-center rounded-lg border border-white/[0.1] py-2 text-xs font-semibold transition-colors hover:bg-white/[0.05] hover:text-white text-text-muted"
                  >
                    Explore
                  </Link>
                  <button
                    onClick={() => openEnroll(course.name)}
                    className="flex-1 text-center rounded-lg bg-brand-orange py-2 text-xs font-semibold text-white transition-colors hover:bg-orange-600"
                  >
                    Enroll Now
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ─── CERTIFICATIONS SECTION ─── */}
      <section className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-10 text-center">
          <h2 className="font-display text-3xl font-bold text-white sm:text-4xl">Industry-Recognized Certifications</h2>
          <p className="mt-2 text-text-muted">Validate your skills with globally recognized certification programs from top providers.</p>
        </div>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
          {POPULAR_PROVIDERS.map((provider) => (
            <Link
              key={provider.id}
              to={`/certifications?provider=${encodeURIComponent(provider.slug)}`}
              className="group flex flex-col items-center gap-3 rounded-2xl border border-white/[0.08] bg-bg-card p-5 text-center transition-all hover:scale-105 hover:border-brand-orange/40 shadow-md cursor-pointer"
            >
              <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-white/[0.06] overflow-hidden">
                <ProviderLogo provider={provider.name} size="lg" />
              </div>
              <h4 className="text-xs font-bold text-white leading-tight group-hover:text-brand-orange transition-colors">{provider.name}</h4>
              <p className="text-[10px] text-text-muted">{provider.tagline}</p>
            </Link>
          ))}
        </div>

        <div className="mt-8 text-center">
          <Link to="/certifications" className="inline-flex items-center gap-2 text-brand-orange font-bold hover:underline">
            Explore All Certifications <ArrowRight size={16} />
          </Link>
        </div>
      </section>

      {/* ─── INTERNSHIPS SECTION ─── */}
      <section className="bg-bg-surface py-20 border-y border-white/[0.08]">
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-12 flex items-end justify-between">
            <div>
              <h2 className="font-display text-3xl font-bold text-white sm:text-4xl">Launch Your Career — Real-World Internships</h2>
              <p className="mt-2 text-text-muted">Work directly on enterprise-grade AI products and build an impressive portfolio.</p>
            </div>
            <Link to="/internship" className="hidden sm:flex items-center gap-1 text-sm font-medium text-brand-orange hover:underline">
              View All Programs <ChevronRight size={16} />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {INTERNSHIP_CATEGORIES.map((internship) => (
              <div
                key={internship.id}
                className="group relative rounded-2xl border border-white/[0.08] bg-bg-card overflow-hidden transition-all duration-300 hover:scale-[1.02] hover:border-brand-orange/40 hover:shadow-xl flex flex-col"
              >
                {/* Image */}
                <div className="relative w-full aspect-video overflow-hidden">
                  <img
                    src={internship.image}
                    alt={internship.name}
                    className="w-full h-full object-cover object-center transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-bg-card/80 to-transparent pointer-events-none" />
                </div>

                {/* Content */}
                <div className="flex flex-col flex-1 p-4">
                  <h3 className="mb-1 font-bold text-sm text-white group-hover:text-brand-orange transition-colors">{internship.name}</h3>
                  <p className="text-xs text-text-muted mb-3 leading-relaxed line-clamp-2">{internship.description}</p>
                  <div className="mb-4 flex flex-wrap gap-1">
                    {internship.keywords.map((t) => (
                      <span key={t} className="rounded bg-white/[0.05] px-1.5 py-0.5 text-[10px] text-text-muted">{t}</span>
                    ))}
                  </div>
                  <div className="flex gap-2 mt-auto">
                    <Link
                      to={`/internship#${internship.id}`}
                      className="flex-1 text-center rounded-lg border border-white/[0.1] py-1.5 text-[11px] font-semibold transition-colors hover:bg-white/[0.05] text-text-muted"
                    >
                      Explore
                    </Link>
                    <button
                      onClick={() => openEnroll(internship.name)}
                      className="flex-1 text-center rounded-lg bg-brand-orange py-1.5 text-[11px] font-semibold text-white transition-colors hover:bg-orange-600"
                    >
                      Enroll Now
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CORPORATE SECTION ─── */}
      <section className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-10 flex items-end justify-between">
          <div>
            <h2 className="font-display text-3xl font-bold text-white sm:text-4xl">Corporate Programs</h2>
            <p className="mt-2 text-text-muted">Enterprise-grade training, consulting, and custom AI solutions for your organization.</p>
          </div>
          <Link to="/corporate" className="hidden sm:flex items-center gap-1 text-sm font-medium text-brand-orange hover:underline">
            View All Programs <ChevronRight size={16} />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {CORPORATE_SERVICES.map((service) => {
            const Icon = service.icon;
            return (
              <div
                key={service.id}
                className="group relative rounded-2xl border border-white/[0.08] bg-bg-card overflow-hidden transition-all duration-300 hover:scale-[1.02] hover:border-brand-orange/40 hover:shadow-xl flex flex-col"
              >
                {/* Image */}
                <div className="relative w-full aspect-video overflow-hidden">
                  <img
                    src={service.image}
                    alt={service.title}
                    className="w-full h-full object-cover object-center transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-bg-card/80 to-transparent pointer-events-none" />
                  <div className="absolute top-3 left-3 flex h-8 w-8 items-center justify-center rounded-xl bg-brand-orange/20 border border-brand-orange/40 text-brand-orange backdrop-blur-sm">
                    <Icon size={16} />
                  </div>
                </div>

                {/* Content */}
                <div className="flex flex-col flex-1 p-4">
                  <h3 className="mb-1 font-bold text-sm text-white group-hover:text-brand-orange transition-colors">{service.title}</h3>
                  <p className="text-xs text-text-muted mb-3 leading-relaxed line-clamp-3">{service.description}</p>
                  <div className="mb-3 flex flex-wrap gap-1">
                    {service.keywords.map((t) => (
                      <span key={t} className="rounded bg-white/[0.05] px-1.5 py-0.5 text-[10px] text-text-muted">{t}</span>
                    ))}
                  </div>
                  <Link
                    to={service.href}
                    className="mt-auto flex items-center justify-center gap-1.5 rounded-lg bg-brand-orange py-2 text-xs font-semibold text-white transition-colors hover:bg-orange-600"
                  >
                    <span>{service.cta}</span>
                    <ArrowRight size={13} />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ─── AI TOOLS STORE SECTION ─── */}
      <section className="bg-bg-surface py-20 border-y border-white/[0.08]">
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-10 text-center">
            <h2 className="font-display text-3xl font-bold text-white sm:text-4xl">AI Tools Store — Power Your Career</h2>
            <p className="mt-2 text-text-muted">Explore AI-powered tools designed to accelerate your job search and career growth.</p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {CAREER_TOOLS.map((tool, i) => {
              const Icon = tool.icon;
              return (
                <div
                  key={i}
                  className="group rounded-2xl border border-white/[0.08] bg-bg-card p-5 transition-all hover:border-brand-orange/40 hover:scale-[1.02] shadow-md flex flex-col justify-between"
                >
                  <div>
                    <div className="mb-3 h-10 w-10 rounded-xl bg-brand-orange/10 flex items-center justify-center text-brand-orange group-hover:scale-110 transition-transform">
                      <Icon size={20} />
                    </div>
                    <h4 className="font-bold text-sm text-white group-hover:text-brand-orange transition-colors">{tool.name}</h4>
                    <p className="text-xs text-text-muted mt-1">{tool.desc}</p>
                  </div>
                  <Link
                    to={`/tools/${tool.path.split('/').pop()}`}
                    className="mt-4 flex items-center text-xs font-semibold text-brand-orange gap-1 hover:underline"
                  >
                    <span>Know More</span>
                    <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
                  </Link>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ─── TECHNICAL JOB SUPPORT SECTION ─── */}
      <section className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-10 flex items-end justify-between">
          <div>
            <h2 className="font-display text-3xl font-bold text-white sm:text-4xl">Technical Job Support</h2>
            <p className="mt-2 text-text-muted">
              Strictly for working professionals — expert support to resolve your toughest technical challenges at work.
            </p>
          </div>
          <Link to="/job-support" className="hidden sm:flex items-center gap-1 text-sm font-medium text-brand-orange hover:underline">
            View All Services <ChevronRight size={16} />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {JOB_SUPPORT_SERVICES.map((service) => {
            const Icon = service.icon;
            return (
              <div
                key={service.id}
                className="group relative rounded-2xl border border-white/[0.08] bg-bg-card overflow-hidden transition-all duration-300 hover:scale-[1.02] hover:border-brand-orange/40 hover:shadow-xl flex flex-col"
              >
                {/* Image */}
                <div className="relative w-full aspect-video overflow-hidden">
                  <img
                    src={service.image}
                    alt={service.title}
                    className="w-full h-full object-cover object-center transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-bg-card/80 to-transparent pointer-events-none" />
                  <div className="absolute top-3 left-3 flex h-8 w-8 items-center justify-center rounded-xl bg-brand-orange/20 border border-brand-orange/40 text-brand-orange backdrop-blur-sm">
                    <Icon size={16} />
                  </div>
                </div>

                {/* Content */}
                <div className="flex flex-col flex-1 p-5">
                  <h3 className="mb-2 font-bold text-white group-hover:text-brand-orange transition-colors">{service.title}</h3>
                  <p className="text-xs text-text-muted mb-4 leading-relaxed">{service.description}</p>
                  <div className="mb-4 flex flex-wrap gap-1.5">
                    {service.items.map((item) => (
                      <span key={item} className="flex items-center gap-1 rounded bg-white/[0.05] px-2 py-0.5 text-[11px] text-text-muted">
                        <span className="h-1 w-1 rounded-full bg-brand-orange" />
                        {item}
                      </span>
                    ))}
                  </div>
                  <Link
                    to="/job-support"
                    className="mt-auto flex items-center justify-center gap-1.5 rounded-lg border border-brand-orange/40 text-brand-orange py-2 text-xs font-semibold transition-colors hover:bg-brand-orange hover:text-white"
                  >
                    <span>Get Support</span>
                    <ArrowRight size={13} />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ─── TESTIMONIALS SECTION (WAVY BACKGROUND) ─── */}
      <section className="relative overflow-hidden bg-gradient-to-b from-[#0e0d12] via-[#16141d] to-[#0a0a0f] py-20 border-y border-white/[0.08]">
        {/* Wavy Background Pattern SVG */}
        <div className="absolute inset-0 pointer-events-none opacity-20">
          <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 320" preserveAspectRatio="none">
            <path
              fill="#D4AF37"
              fillOpacity="0.15"
              d="M0,192L48,202.7C96,213,192,235,288,224C384,213,480,171,576,165.3C672,160,768,192,864,197.3C960,203,1056,181,1152,165.3C1248,150,1344,139,1392,133.3L1440,128L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
            />
            <path
              fill="#F59E0B"
              fillOpacity="0.1"
              d="M0,96L48,128C96,160,192,224,288,229.3C384,235,480,181,576,165.3C672,149,768,171,864,186.7C960,203,1056,213,1152,197.3C1248,181,1344,139,1392,117.3L1440,96L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
            />
          </svg>
        </div>

        <div className="relative z-10 mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#D4AF37]/10 px-4 py-1 text-xs font-bold text-[#D4AF37] border border-[#D4AF37]/25 tracking-widest uppercase">
              <Sparkles size={14} /> Student & Alumni Stories
            </span>
            <h2 className="font-display text-3xl font-extrabold text-white sm:text-4xl">
              What Our Graduates Say About <span className="text-[#D4AF37]">PAVY Academy</span>
            </h2>
            <p className="text-sm text-text-muted">
              Over 2,500+ professionals transformed their engineering careers through our AI & Database cohorts.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                quote:
                  'The Agentic AI Internship gave me hands-on experience building multi-agent LangGraph pipelines. I landed a Senior GenAI Architect role at Microsoft within 4 weeks of graduation.',
                author: 'Rajesh Sharma',
                role: 'Senior GenAI Engineer',
                company: 'Microsoft',
                rating: 5,
                course: 'Agentic AI Internship',
              },
              {
                quote:
                  'The SQL & Azure DBA track with live lab sandboxes was outstanding. 24/7 AI Support helped me solve complex clustering bugs instantly during my capstone.',
                author: 'Priya Venkatesh',
                role: 'Lead Azure Database Admin',
                company: 'Deloitte',
                rating: 5,
                course: 'SQL & Azure DBA',
              },
              {
                quote:
                  'Technical Job Support was a lifesaver when I joined my new team working on Databricks & Fabric. PAVY mentors guided me through production sprints seamlessly.',
                author: 'Ankit Deshmukh',
                role: 'Data Engineer',
                company: 'Accenture',
                rating: 5,
                course: 'Technical Job Support',
              },
            ].map((testi, i) => (
              <div
                key={i}
                className="group relative rounded-2xl border border-white/[0.1] bg-bg-card/80 backdrop-blur-md p-6 transition-all duration-300 hover:border-[#D4AF37]/50 hover:scale-[1.02] shadow-xl flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center gap-1 text-[#D4AF37] mb-3">
                    {Array.from({ length: testi.rating }).map((_, r) => (
                      <span key={r} className="text-sm">★</span>
                    ))}
                  </div>
                  <p className="text-xs text-slate-300 italic leading-relaxed mb-6">
                    "{testi.quote}"
                  </p>
                </div>

                <div className="pt-4 border-t border-white/[0.08] flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-bold text-white group-hover:text-[#D4AF37] transition-colors">
                      {testi.author}
                    </h4>
                    <p className="text-[11px] text-text-muted">
                      {testi.role} • <span className="text-amber-400">{testi.company}</span>
                    </p>
                  </div>
                  <span className="rounded-full bg-[#D4AF37]/10 px-2.5 py-1 text-[10px] font-bold text-[#D4AF37] border border-[#D4AF37]/20">
                    {testi.course}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CONNECT TO US CTA SECTION ─── */}
      <section className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-3xl border border-brand-orange/20 bg-gradient-to-r from-brand-orange/10 via-amber-500/5 to-transparent p-12 text-center shadow-2xl">
          {/* Background glow */}
          <div className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 h-40 w-96 bg-brand-orange/20 blur-3xl rounded-full" />

          <div className="relative z-10 space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full border border-brand-orange/30 bg-brand-orange/10 px-4 py-1.5 text-xs font-bold text-brand-orange">
              <MessageSquare size={14} />
              <span>GET IN TOUCH</span>
            </div>
            <h2 className="font-display text-3xl font-extrabold text-white sm:text-4xl">
              Connect to <span className="text-brand-orange">Us</span>
            </h2>
            <p className="text-text-muted max-w-xl mx-auto text-base">
              Have questions about our programs? Ready to start your learning journey? Our team is here to guide you.
            </p>
            <div className="pt-2">
              <Link
                to="/connect-us"
                className="inline-flex items-center gap-2 rounded-xl bg-brand-orange px-8 py-3.5 text-sm font-bold text-white shadow-xl shadow-brand-orange/25 hover:bg-orange-600 transition-all hover:scale-105"
              >
                <span>Talk to Our Team</span>
                <ArrowRight size={18} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Enrollment Modal */}
      <EnrollmentModal
        isOpen={enrollModal.open}
        onClose={closeEnroll}
        programName={enrollModal.program}
      />
    </div>
  );
};

export default Home;
