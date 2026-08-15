import { useState, useRef, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ThemeSelector } from '../theme';
import {
  Menu,
  X,
  ChevronDown,
  LogOut,
  Award,
  Sparkles,
  Layers,
  Briefcase,
  Wrench,
  Headphones,
  Building2,
  Database,
  Cpu,
  Bot,
  Brain,
  Code,
  Server,
  ArrowRight,
  TrendingUp,
  FileCheck,
} from 'lucide-react';
import { clsx } from 'clsx';
import { CAREER_TOOLS } from '../lib/tools';
import { useAuth } from '../context/AuthContext';
import { POPULAR_PROVIDERS } from '../data/certificationsData';
import { ProviderLogo } from './ProviderLogo';

interface Props {
  floating?: boolean;
  fullBleed?: boolean;
}

// ─── STATIC SUBMENU DATA DEFINITIONS ───

const COURSE_CATEGORIES = [
  {
    category: 'AI & Generative AI',
    icon: Brain,
    courses: [
      { name: 'Generative AI Engineering', path: '/courses?category=AI', desc: 'RAG, Vector DBs, LLM fine-tuning' },
      { name: 'Agentic AI & Autonomous Agents', path: '/courses?category=AI', desc: 'Multi-agent frameworks, LangGraph' },
      { name: 'Machine Learning & Deep Learning', path: '/courses?category=AI', desc: 'PyTorch, neural nets & computer vision' },
      { name: 'Data Analytics with AI', path: '/courses?category=AI', desc: 'Predictive modeling, automated insights' },
    ],
  },
  {
    category: 'Database Administrator (DBA)',
    icon: Database,
    courses: [
      { name: 'SQL & Azure Database Admin', path: '/courses?category=DATABASE', desc: 'High-availability, disaster recovery & tuning' },
      { name: 'Oracle Database Admin', path: '/courses?category=DATABASE', desc: 'RAC, Data Guard & Enterprise Manager' },
      { name: 'PostgreSQL Database Admin', path: '/courses?category=DATABASE', desc: 'Replication, partitioning & performance' },
    ],
  },
];

const INTERNSHIP_PROGRAMS = [
  {
    id: 1,
    title: 'AI-Powered Data Analytics: Professional Upskilling & Internship',
    icon: TrendingUp,
    badge: '36 Weeks',
    desc: 'Hands-on telemetry analytics, automated dashboards & predictive ML pipeline builds.',
  },
  {
    id: 2,
    title: 'Master Generative AI: Industry Certification & Internship',
    icon: Bot,
    badge: '36 Weeks',
    desc: 'Enterprise LLM deployments, RAG vector pipelines & official vendor certification.',
  },
  {
    id: 3,
    title: 'AI Agent Development Internship Program',
    icon: Cpu,
    badge: '36 Weeks',
    desc: 'Autonomous multi-agent swarms, tool-use agents & production orchestrations.',
  },
  {
    id: 4,
    title: 'SQL and Azure Database Admin: Industry Certification & Internship',
    icon: Database,
    badge: '36 Weeks',
    desc: 'Mission-critical database clusters, cloud migrations & DB performance tuning.',
  },
];

const JOB_SUPPORT_CATEGORIES = [
  {
    category: '1. Data and AI',
    icon: Brain,
    items: [
      'Data Analytics',
      'Excel',
      'PowerBI',
      'Tableau',
      'Python',
      'Machine Learning',
      'Deep Learning',
      'Generative AI',
    ],
  },
  {
    category: '2. Database Administrator',
    icon: Database,
    items: [
      'SQL and Azure Database Admin',
      'Oracle Database Admin',
      'PostgreSQL Database Admin',
    ],
  },
  {
    category: '3. Data Engineering',
    icon: Server,
    items: [
      'Microsoft Fabric',
      'Databricks',
    ],
  },
];

const CORPORATE_COURSES = [
  'Data Analytics with AI',
  'MSSQL & PowerBI with AI',
  'AI for Business Leaders',
  'Agentic AI for Developers',
  'Generative AI for Developers',
  'Python for AI & Machine Learning',
  'Agentic AI & Autonomous Agents',
];

const SiteNav = ({ floating = false, fullBleed = false }: Props) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Desktop Hover Dropdown States
  const [isCoursesOpen, setIsCoursesOpen] = useState(false);
  const [isCertsOpen, setIsCertsOpen] = useState(false);
  const [isInternshipOpen, setIsInternshipOpen] = useState(false);
  const [isToolsOpen, setIsToolsOpen] = useState(false);
  const [isJobSupportOpen, setIsJobSupportOpen] = useState(false);
  const [isCorporateOpen, setIsCorporateOpen] = useState(false);

  // Mobile Accordion States
  const [isMobileCoursesOpen, setIsMobileCoursesOpen] = useState(false);
  const [isMobileCertsOpen, setIsMobileCertsOpen] = useState(false);
  const [isMobileInternshipOpen, setIsMobileInternshipOpen] = useState(false);
  const [isMobileToolsOpen, setIsMobileToolsOpen] = useState(false);
  const [isMobileJobSupportOpen, setIsMobileJobSupportOpen] = useState(false);
  const [isMobileCorporateOpen, setIsMobileCorporateOpen] = useState(false);

  // Hover Debounce Timers
  const coursesTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const certsTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const internshipTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const toolsTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const jobSupportTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const corporateTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const location = useLocation();
  const { user, logout } = useAuth();

  // Close all dropdowns on route change
  useEffect(() => {
    setIsCoursesOpen(false);
    setIsCertsOpen(false);
    setIsInternshipOpen(false);
    setIsToolsOpen(false);
    setIsJobSupportOpen(false);
    setIsCorporateOpen(false);
    setIsMobileMenuOpen(false);
  }, [location]);

  // Generic Hover Handlers Helper
  const createHoverHandlers = (
    setOpen: React.Dispatch<React.SetStateAction<boolean>>,
    timeoutRef: React.MutableRefObject<ReturnType<typeof setTimeout> | null>
  ) => ({
    onMouseEnter: () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      setOpen(true);
    },
    onMouseLeave: () => {
      timeoutRef.current = setTimeout(() => {
        setOpen(false);
      }, 200);
    },
  });

  const coursesHandlers = createHoverHandlers(setIsCoursesOpen, coursesTimeoutRef);
  const certsHandlers = createHoverHandlers(setIsCertsOpen, certsTimeoutRef);
  const internshipHandlers = createHoverHandlers(setIsInternshipOpen, internshipTimeoutRef);
  const toolsHandlers = createHoverHandlers(setIsToolsOpen, toolsTimeoutRef);
  const jobSupportHandlers = createHoverHandlers(setIsJobSupportOpen, jobSupportTimeoutRef);
  const corporateHandlers = createHoverHandlers(setIsCorporateOpen, corporateTimeoutRef);

  return (
    <>
      <header
        className={clsx(
          'fixed top-3 sm:top-4 left-1/2 -translate-x-1/2 z-50 transition-all duration-300 w-[95%] sm:w-auto md:w-max max-w-[96vw]'
        )}
      >
        <div
          className="flex h-14 md:h-15 items-center justify-between gap-4 lg:gap-6 rounded-full border border-white/[0.14] bg-bg-surface/10 backdrop-blur-2xl shadow-2xl shadow-black/50 px-4 sm:px-6 py-2"
        >
          {/* Brand Logo (Desktop & Mobile ~100px) */}
          <div className="flex items-center gap-2 shrink-0">
            <Link to="/" className="flex items-center gap-2 font-display text-xl sm:text-2xl font-bold tracking-tight whitespace-nowrap">
              <img
                src="/assets/pavy_logo.png"
                alt="PAVY Logo"
                className="h-8 w-auto md:h-9 max-w-[100px] object-contain"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
              <span className="flex items-center">
                <span className="text-[#D4AF37] font-black drop-shadow-[0_0_12px_rgba(212,175,55,0.4)]">PAVY</span>
                <span className="ml-1 text-white font-bold">Academy</span>
              </span>
            </Link>
          </div>

          {/* Desktop Main Navigation Bar with Hover Submenus */}
          <nav className="hidden items-center gap-3.5 lg:gap-4.5 xl:gap-5.5 md:flex shrink-0">

            {/* 1. HOME */}
            <Link
              to="/"
              className={clsx(
                'text-sm font-semibold transition-colors hover:text-white whitespace-nowrap shrink-0',
                location.pathname === '/' ? 'text-brand-orange font-bold' : 'text-text-muted'
              )}
            >
              Home
            </Link>

            {/* 2. COURSES FLYOUT */}
            <div className="relative flex items-center shrink-0" {...coursesHandlers}>
              <Link
                to="/courses"
                className={clsx(
                  'flex items-center gap-1 py-2 text-sm font-semibold transition-colors whitespace-nowrap shrink-0',
                  location.pathname === '/courses' ? 'text-brand-orange font-bold' : 'text-text-muted hover:text-white'
                )}
              >
                <span>Courses</span>
                <ChevronDown size={14} className={clsx('transition-transform duration-200', isCoursesOpen && 'rotate-180')} />
              </Link>

              {isCoursesOpen && (
                <div className="absolute left-1/2 top-full z-50 mt-1 w-[680px] max-w-[95vw] max-h-[85vh] overflow-y-auto -translate-x-1/2 rounded-2xl border border-white/[0.12] bg-bg-surface/98 p-5 shadow-2xl backdrop-blur-2xl animate-in fade-in zoom-in-95 duration-150">
                  <div className="mb-3.5 flex items-center justify-between border-b border-white/[0.08] pb-2.5">
                    <div className="flex items-center gap-2">
                      <span className="flex h-6 w-6 items-center justify-center rounded-md bg-brand-orange/10 text-brand-orange">
                        <Layers size={14} />
                      </span>
                      <span className="text-xs font-bold uppercase tracking-wider text-brand-orange">
                        All Courses by Domain
                      </span>
                    </div>
                    <Link
                      to="/courses"
                      className="text-xs font-semibold text-text-muted hover:text-brand-orange transition-colors"
                    >
                      View All Courses →
                    </Link>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    {COURSE_CATEGORIES.map((cat, idx) => {
                      const Icon = cat.icon;
                      return (
                        <div key={idx} className="space-y-2 rounded-xl border border-white/[0.04] bg-bg-card/50 p-3">
                          <div className="flex items-center gap-1.5 text-xs font-bold text-white border-b border-white/[0.06] pb-2">
                            <Icon size={14} className="text-brand-orange" />
                            <span className="truncate">{cat.category}</span>
                          </div>
                          <div className="space-y-1.5">
                            {cat.courses.map((c, cidx) => (
                              <Link
                                key={cidx}
                                to={c.path}
                                className="group block rounded-lg p-1.5 transition-colors hover:bg-white/[0.06]"
                              >
                                <p className="text-xs font-medium text-white group-hover:text-brand-orange transition-colors line-clamp-1">
                                  {c.name}
                                </p>
                                <p className="text-[10px] text-text-muted line-clamp-1">
                                  {c.desc}
                                </p>
                              </Link>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="mt-3.5 flex items-center justify-between rounded-xl bg-gradient-to-r from-brand-orange/15 via-amber-500/10 to-transparent px-3.5 py-2 border border-brand-orange/20">
                    <div className="flex items-center gap-2 text-xs text-brand-orange font-semibold">
                      <Sparkles size={14} />
                      <span>Live Cohort Training & Dedicated Cloud Sandboxes</span>
                    </div>
                    <Link
                      to="/courses"
                      className="rounded-lg bg-brand-orange px-3 py-1 text-[11px] font-bold text-white shadow-sm hover:bg-orange-600 transition-colors"
                    >
                      Explore Tracks
                    </Link>
                  </div>
                </div>
              )}
            </div>

            {/* 3. CERTIFICATIONS FLYOUT */}
            <div className="relative flex items-center shrink-0" {...certsHandlers}>
              <Link
                to="/certifications"
                className={clsx(
                  'flex items-center gap-1 py-2 text-sm font-semibold transition-colors whitespace-nowrap shrink-0',
                  location.pathname === '/certifications' ? 'text-brand-orange font-bold' : 'text-text-muted hover:text-white'
                )}
              >
                <span>Certifications</span>
                <ChevronDown size={14} className={clsx('transition-transform duration-200', isCertsOpen && 'rotate-180')} />
              </Link>

              {isCertsOpen && (
                <div className="absolute left-1/2 top-full z-50 mt-1 w-[680px] max-w-[95vw] max-h-[85vh] overflow-y-auto -translate-x-1/2 rounded-2xl border border-white/[0.12] bg-bg-surface/98 p-5 shadow-2xl backdrop-blur-2xl animate-in fade-in zoom-in-95 duration-150">
                  <div className="mb-3.5 flex items-center justify-between border-b border-white/[0.08] pb-2.5">
                    <div className="flex items-center gap-2">
                      <span className="flex h-6 w-6 items-center justify-center rounded-md bg-brand-orange/10 text-brand-orange">
                        <Award size={14} />
                      </span>
                      <span className="text-xs font-bold uppercase tracking-wider text-brand-orange">
                        Top Certifications
                      </span>
                    </div>
                    <Link
                      to="/certifications"
                      className="text-xs font-semibold text-text-muted hover:text-brand-orange transition-colors"
                    >
                      View All Certifications →
                    </Link>
                  </div>

                  <div className="grid grid-cols-4 gap-2.5">
                    {POPULAR_PROVIDERS.map((provider) => (
                      <Link
                        key={provider.id}
                        to={`/certifications?provider=${encodeURIComponent(provider.slug)}`}
                        className="group flex items-center gap-2.5 rounded-xl border border-white/[0.04] bg-bg-card/60 p-2.5 transition-all hover:border-brand-orange/40 hover:bg-white/[0.06] hover:scale-[1.02]"
                      >
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white/[0.04] p-1">
                          <ProviderLogo provider={provider.name} size="sm" />
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-xs font-bold text-white group-hover:text-brand-orange transition-colors">
                            {provider.name}
                          </p>
                          <p className="truncate text-[10px] text-text-muted">
                            {provider.shortName}
                          </p>
                        </div>
                      </Link>
                    ))}
                  </div>

                  <div className="mt-3.5 flex items-center justify-between rounded-xl bg-gradient-to-r from-brand-orange/15 via-amber-500/10 to-transparent px-3.5 py-2 border border-brand-orange/20">
                    <div className="flex items-center gap-2 text-xs text-brand-orange font-semibold">
                      <Sparkles size={14} />
                      <span>Official Exam Vouchers & Blueprint Prep</span>
                    </div>
                    <Link
                      to="/certifications"
                      className="rounded-lg bg-brand-orange px-3 py-1 text-[11px] font-bold text-white shadow-sm hover:bg-orange-600 transition-colors"
                    >
                      Explore Catalog
                    </Link>
                  </div>
                </div>
              )}
            </div>

            {/* 4. INTERNSHIP FLYOUT */}
            <div className="relative flex items-center shrink-0" {...internshipHandlers}>
              <Link
                to="/internship"
                className={clsx(
                  'flex items-center gap-1 py-2 text-sm font-semibold transition-colors whitespace-nowrap shrink-0',
                  location.pathname === '/internship' ? 'text-brand-orange font-bold' : 'text-text-muted hover:text-white'
                )}
              >
                <span>Internship</span>
                <ChevronDown size={14} className={clsx('transition-transform duration-200', isInternshipOpen && 'rotate-180')} />
              </Link>

              {isInternshipOpen && (
                <div className="absolute left-1/2 top-full z-50 mt-1 w-[680px] max-w-[95vw] max-h-[85vh] overflow-y-auto -translate-x-1/2 rounded-2xl border border-white/[0.12] bg-bg-surface/98 p-5 shadow-2xl backdrop-blur-2xl animate-in fade-in zoom-in-95 duration-150">
                  <div className="mb-3.5 flex items-center justify-between border-b border-white/[0.08] pb-2.5">
                    <div className="flex items-center gap-2">
                      <span className="flex h-6 w-6 items-center justify-center rounded-md bg-brand-orange/10 text-brand-orange">
                        <Briefcase size={14} />
                      </span>
                      <span className="text-xs font-bold uppercase tracking-wider text-brand-orange">
                        Industrial Placement & Internship Programs
                      </span>
                    </div>
                    <Link
                      to="/internship"
                      className="text-xs font-semibold text-text-muted hover:text-brand-orange transition-colors"
                    >
                      Explore All Internships →
                    </Link>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    {INTERNSHIP_PROGRAMS.map((prog) => {
                      const Icon = prog.icon;
                      return (
                        <Link
                          key={prog.id}
                          to="/internship"
                          className="group flex flex-col justify-between rounded-xl border border-white/[0.06] bg-bg-card/60 p-3.5 transition-all hover:border-brand-orange/40 hover:bg-white/[0.06] hover:scale-[1.01]"
                        >
                          <div>
                            <div className="flex items-center justify-between">
                              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-orange/10 text-brand-orange">
                                <Icon size={15} />
                              </div>
                              <span className="rounded-full bg-white/[0.06] px-2 py-0.5 text-[10px] font-bold text-amber-300">
                                {prog.badge}
                              </span>
                            </div>
                            <h4 className="mt-2 text-xs font-bold text-white group-hover:text-brand-orange transition-colors leading-snug">
                              {prog.title}
                            </h4>
                            <p className="mt-1 text-[11px] text-text-muted line-clamp-2 leading-relaxed">
                              {prog.desc}
                            </p>
                          </div>
                          <span className="mt-2.5 inline-flex items-center gap-1 text-[10px] font-semibold text-brand-orange">
                            Apply for Cohort <ArrowRight size={10} />
                          </span>
                        </Link>
                      );
                    })}
                  </div>

                  <div className="mt-3.5 flex items-center justify-between rounded-xl bg-gradient-to-r from-brand-orange/15 via-amber-500/10 to-transparent px-3.5 py-2 border border-brand-orange/20">
                    <div className="flex items-center gap-2 text-xs text-brand-orange font-semibold">
                      <Sparkles size={14} />
                      <span>Guaranteed 1-on-1 Mentor Guidance & Production Capstones</span>
                    </div>
                    <Link
                      to="/internship"
                      className="rounded-lg bg-brand-orange px-3 py-1 text-[11px] font-bold text-white shadow-sm hover:bg-orange-600 transition-colors"
                    >
                      Apply Now
                    </Link>
                  </div>
                </div>
              )}
            </div>

            {/* 5. AI TOOLS FLYOUT */}
            <div className="relative flex items-center shrink-0" {...toolsHandlers}>
              <button
                aria-haspopup="menu"
                aria-expanded={isToolsOpen}
                className={clsx(
                  'flex items-center gap-1 py-2 text-sm font-semibold transition-colors whitespace-nowrap shrink-0',
                  location.pathname.includes('/tools') ? 'text-brand-orange font-bold' : 'text-text-muted hover:text-white'
                )}
              >
                <span>AI Tools</span>
                <ChevronDown size={14} className={clsx('transition-transform duration-200', isToolsOpen && 'rotate-180')} />
              </button>

              {isToolsOpen && (
                <div className="absolute left-1/2 top-full z-50 mt-1 w-[720px] max-w-[95vw] max-h-[85vh] overflow-y-auto -translate-x-1/2 rounded-2xl border border-white/[0.12] bg-bg-surface/98 p-5 shadow-2xl backdrop-blur-2xl animate-in fade-in zoom-in-95 duration-150">
                  <div className="mb-3.5 flex items-center justify-between border-b border-white/[0.08] pb-2.5">
                    <div className="flex items-center gap-2">
                      <span className="flex h-6 w-6 items-center justify-center rounded-md bg-brand-orange/10 text-brand-orange">
                        <Wrench size={14} />
                      </span>
                      <span className="text-xs font-bold uppercase tracking-wider text-brand-orange">
                        AI Tools for Business Growth
                      </span>
                    </div>
                    <Link
                      to="/dashboard/tools"
                      className="text-xs font-semibold text-text-muted hover:text-brand-orange transition-colors"
                    >
                      Explore All {CAREER_TOOLS.length} Tools →
                    </Link>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    {CAREER_TOOLS.map((tool) => {
                      const Icon = tool.icon;
                      // Extract toolId from path: /dashboard/tools/resume-builder → resume-builder
                      const toolId = tool.path.split('/').pop();
                      const detailPath = `/tools/${toolId}`;
                      return (
                        <Link
                          key={tool.name}
                          to={detailPath}
                          className="group flex flex-col justify-between rounded-xl border border-white/[0.04] bg-bg-card/60 p-3 transition-all hover:border-brand-orange/40 hover:bg-white/[0.06] hover:scale-[1.02]"
                        >
                          <div>
                            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-orange/10 p-1.5 text-brand-orange">
                              <Icon size={16} />
                            </div>
                            <p className="mt-2 text-xs font-bold text-white group-hover:text-brand-orange transition-colors line-clamp-1">
                              {tool.name}
                            </p>
                            <p className="mt-0.5 text-[10px] text-text-muted line-clamp-2 leading-tight">
                              {tool.desc}
                            </p>
                          </div>
                          <span className="mt-2 inline-flex items-center gap-1 text-[10px] font-semibold text-brand-orange">
                            Know More <ArrowRight size={10} />
                          </span>
                        </Link>
                      );
                    })}
                  </div>

                  <div className="mt-3.5 flex items-center justify-between rounded-xl bg-gradient-to-r from-brand-orange/15 via-amber-500/10 to-transparent px-3.5 py-2 border border-brand-orange/20">
                    <div className="flex items-center gap-2 text-xs text-brand-orange font-semibold">
                      <Sparkles size={14} />
                      <span>Live AI Avatar Mock Interviews & STAR-Format Q&A</span>
                    </div>
                    <Link
                      to="/tools/live-interview"
                      className="rounded-lg bg-brand-orange px-3 py-1 text-[11px] font-bold text-white shadow-sm hover:bg-orange-600 transition-colors"
                    >
                      Try AI Mock Interview
                    </Link>
                  </div>
                </div>
              )}
            </div>

            {/* 6. TECHNICAL JOB SUPPORT FLYOUT */}
            <div className="relative flex items-center shrink-0" {...jobSupportHandlers}>
              <button
                aria-haspopup="menu"
                aria-expanded={isJobSupportOpen}
                className={clsx(
                  'flex items-center gap-1 py-2 text-sm font-semibold transition-colors whitespace-nowrap shrink-0',
                  location.pathname.includes('/job-support') ? 'text-brand-orange font-bold' : 'text-text-muted hover:text-white'
                )}
              >
                <span>Technical Job Support</span>
                <ChevronDown size={14} className={clsx('transition-transform duration-200', isJobSupportOpen && 'rotate-180')} />
              </button>

              {isJobSupportOpen && (
                <div className="absolute left-1/2 top-full z-50 mt-1 w-[740px] max-w-[95vw] max-h-[85vh] overflow-y-auto -translate-x-1/2 rounded-2xl border border-white/[0.12] bg-bg-surface/98 p-5 shadow-2xl backdrop-blur-2xl animate-in fade-in zoom-in-95 duration-150">
                  <div className="mb-3.5 flex items-center justify-between border-b border-white/[0.08] pb-2.5">
                    <div className="flex items-center gap-2">
                      <span className="flex h-6 w-6 items-center justify-center rounded-md bg-brand-orange/10 text-brand-orange">
                        <Headphones size={14} />
                      </span>
                      <span className="text-xs font-bold uppercase tracking-wider text-brand-orange">
                        On-the-Job Technical Mentorship
                      </span>
                    </div>
                    <Link
                      to="/job-support"
                      className="text-xs font-semibold text-text-muted hover:text-brand-orange transition-colors"
                    >
                      View Full Job Support Page →
                    </Link>
                  </div>

                  <div className="grid grid-cols-3 gap-3.5">
                    {JOB_SUPPORT_CATEGORIES.map((cat, idx) => {
                      const Icon = cat.icon;
                      return (
                        <div key={idx} className="space-y-2 rounded-xl border border-white/[0.04] bg-bg-card/50 p-3">
                          <div className="flex items-center gap-1.5 text-xs font-bold text-white border-b border-white/[0.06] pb-2">
                            <Icon size={14} className="text-brand-orange" />
                            <span>{cat.category}</span>
                          </div>
                          <ul className="space-y-1.5 pt-1">
                            {cat.items.map((item, itemIdx) => (
                              <li key={itemIdx}>
                                <Link
                                  to="/job-support"
                                  className="group flex items-center gap-1.5 text-xs text-text-muted hover:text-white transition-colors"
                                >
                                  <span className="h-1 w-1 rounded-full bg-brand-orange group-hover:scale-125 transition-transform" />
                                  <span className="group-hover:text-brand-orange transition-colors">{item}</span>
                                </Link>
                              </li>
                            ))}
                          </ul>
                        </div>
                      );
                    })}
                  </div>

                  <div className="mt-3.5 flex items-center justify-between rounded-xl bg-gradient-to-r from-brand-orange/15 via-amber-500/10 to-transparent px-3.5 py-2 border border-brand-orange/20">
                    <div className="flex items-center gap-2 text-xs text-brand-orange font-semibold">
                      <Sparkles size={14} />
                      <span>Production Ticket Assistance, Code Debugging & Sprint Delivery</span>
                    </div>
                    <Link
                      to="/job-support"
                      className="rounded-lg bg-brand-orange px-3 py-1 text-[11px] font-bold text-white shadow-sm hover:bg-orange-600 transition-colors"
                    >
                      View Job Support Page
                    </Link>
                  </div>
                </div>
              )}
            </div>

            {/* 7. CORPORATE TRAINING FLYOUT */}
            <div className="relative flex items-center shrink-0" {...corporateHandlers}>
              <Link
                to="/corporate"
                className={clsx(
                  'flex items-center gap-1 py-2 text-sm font-semibold transition-colors whitespace-nowrap shrink-0',
                  location.pathname === '/corporate' ? 'text-brand-orange font-bold' : 'text-text-muted hover:text-white'
                )}
              >
                <span>Corporate</span>
                <ChevronDown size={14} className={clsx('transition-transform duration-200', isCorporateOpen && 'rotate-180')} />
              </Link>

              {isCorporateOpen && (
                <div className="absolute right-0 top-full z-50 mt-1 w-[680px] max-w-[95vw] max-h-[85vh] overflow-y-auto rounded-2xl border border-white/[0.12] bg-bg-surface/98 p-5 shadow-2xl backdrop-blur-2xl animate-in fade-in zoom-in-95 duration-150">
                  <div className="mb-3.5 flex items-center justify-between border-b border-white/[0.08] pb-2.5">
                    <div className="flex items-center gap-2">
                      <span className="flex h-6 w-6 items-center justify-center rounded-md bg-brand-orange/10 text-brand-orange">
                        <Building2 size={14} />
                      </span>
                      <span className="text-xs font-bold uppercase tracking-wider text-brand-orange">
                        Enterprise Corporate Training Tracks
                      </span>
                    </div>
                    <Link
                      to="/corporate"
                      className="text-xs font-semibold text-text-muted hover:text-brand-orange transition-colors"
                    >
                      View All Corporate Solutions →
                    </Link>
                  </div>

                  {/* 7 Corporate Courses Grid */}
                  <div className="grid grid-cols-2 gap-2.5">
                    {CORPORATE_COURSES.map((course, idx) => (
                      <Link
                        key={idx}
                        to="/corporate"
                        className="group flex items-center gap-2.5 rounded-xl border border-white/[0.04] bg-bg-card/60 p-2.5 transition-all hover:border-brand-orange/40 hover:bg-white/[0.06] hover:scale-[1.01]"
                      >
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-brand-orange/10 text-brand-orange">
                          <FileCheck size={14} />
                        </div>
                        <p className="truncate text-xs font-bold text-white group-hover:text-brand-orange transition-colors">
                          {course}
                        </p>
                      </Link>
                    ))}
                  </div>

                  {/* Custom Training Requirement CTA */}
                  <div className="mt-3.5 flex items-center justify-between rounded-xl bg-gradient-to-r from-amber-500/20 via-orange-500/15 to-transparent p-3 border border-amber-400/30">
                    <div>
                      <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                        <Sparkles size={13} className="text-amber-400" />
                        Custom Training Requirement?
                      </h4>
                      <p className="text-[10px] text-text-muted mt-0.5">
                        Tailor curriculum to your enterprise tech stack with custom cohort schedules.
                      </p>
                    </div>
                    <Link
                      to="/corporate"
                      className="shrink-0 rounded-lg bg-amber-500 hover:bg-amber-400 text-black px-3.5 py-1.5 text-xs font-black uppercase tracking-wider shadow-md transition-all"
                    >
                      Create Custom Cohort
                    </Link>
                  </div>
                </div>
              )}
            </div>

            {/* 8. CONNECT US */}
            <Link
              to="/connect-us"
              className={clsx(
                'text-sm font-semibold transition-colors hover:text-white whitespace-nowrap shrink-0',
                location.pathname === '/connect-us' || location.pathname === '/contact'
                  ? 'text-brand-orange font-bold'
                  : 'text-text-muted'
              )}
            >
              Connect Us
            </Link>

          </nav>

          {/* Right Action Cluster */}
          <div className="hidden items-center gap-3 md:flex shrink-0">
            {user ? (
              <div className="flex items-center gap-2.5">
                <div className="flex items-center gap-2 rounded-xl bg-white/[0.04] border border-white/[0.08] px-2.5 py-1.5">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-orange/20 text-brand-orange text-xs font-bold border border-brand-orange/30">
                    {(user.firstName?.[0] || user.email[0]).toUpperCase()}
                  </div>
                  <span className="text-xs font-semibold text-white truncate max-w-[100px]">
                    {user.firstName || user.email.split('@')[0]}
                  </span>
                </div>

                <Link
                  to={user.role === 'admin' ? '/dashboard/admin' : '/dashboard/student'}
                  className="flex items-center gap-1.5 rounded-xl bg-brand-orange px-3.5 py-2 text-xs font-bold text-white shadow-md hover:bg-orange-600 transition-all hover:scale-105 whitespace-nowrap"
                >
                  <span>Dashboard</span>
                </Link>

                <button
                  onClick={logout}
                  className="rounded-xl border border-white/[0.12] p-2 text-xs font-semibold text-text-muted transition-colors hover:text-white hover:bg-white/[0.06]"
                  title="Logout"
                >
                  <LogOut size={15} />
                </button>
              </div>
            ) : (
              <Link
                to="/login"
                className="rounded-xl bg-brand-orange px-4 py-2 text-xs font-bold text-white shadow-md transition-transform hover:scale-105 whitespace-nowrap"
              >
                Login
              </Link>
            )}

            {/* Theme Selector Icon at the end of the menu */}
            <ThemeSelector variant="icon" />
          </div>

          {/* Mobile Menu Toggle Button */}
          <div className="flex items-center md:hidden">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 text-text-muted hover:text-white"
              aria-label="Toggle menu"
            >
              {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </header>

      {/* ─── MOBILE ACCORDION NAVIGATION DRAWER ─── */}
      <div
        className={clsx(
          'fixed inset-0 z-40 overflow-y-auto bg-bg-canvas/95 backdrop-blur-sm transition-transform duration-300 md:hidden',
          isMobileMenuOpen ? 'translate-x-0' : 'translate-x-full'
        )}
      >
        <div className="flex h-full flex-col px-6 pb-6 pt-20">
          <nav className="flex flex-col gap-3">

            {/* 1. Mobile Home */}
            <Link
              to="/"
              onClick={() => setIsMobileMenuOpen(false)}
              className="text-lg font-medium text-text-muted hover:text-white"
            >
              Home
            </Link>

            {/* 2. Mobile Courses Accordion */}
            <div className="border-b border-t border-white/[0.08] py-2.5">
              <div className="flex items-center justify-between">
                <Link
                  to="/courses"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="text-base font-semibold text-white"
                >
                  Courses
                </Link>
                <button
                  onClick={() => setIsMobileCoursesOpen(!isMobileCoursesOpen)}
                  className="p-1 text-text-muted hover:text-white"
                >
                  <ChevronDown size={18} className={clsx('transition-transform', isMobileCoursesOpen && 'rotate-180')} />
                </button>
              </div>

              {isMobileCoursesOpen && (
                <div className="mt-2 space-y-3 pt-2 pl-2">
                  {COURSE_CATEGORIES.map((cat, idx) => (
                    <div key={idx} className="space-y-1">
                      <span className="text-xs font-bold text-brand-orange">{cat.category}</span>
                      {cat.courses.map((c, cidx) => (
                        <Link
                          key={cidx}
                          to={c.path}
                          onClick={() => setIsMobileMenuOpen(false)}
                          className="block py-1 text-xs text-text-muted hover:text-white"
                        >
                          {c.name}
                        </Link>
                      ))}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 3. Mobile Certifications Accordion */}
            <div className="border-b border-white/[0.08] py-2.5">
              <div className="flex items-center justify-between">
                <Link
                  to="/certifications"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="text-base font-semibold text-white"
                >
                  Certifications
                </Link>
                <button
                  onClick={() => setIsMobileCertsOpen(!isMobileCertsOpen)}
                  className="p-1 text-text-muted hover:text-white"
                >
                  <ChevronDown size={18} className={clsx('transition-transform', isMobileCertsOpen && 'rotate-180')} />
                </button>
              </div>

              {isMobileCertsOpen && (
                <div className="mt-2 grid grid-cols-2 gap-2 pt-2">
                  {POPULAR_PROVIDERS.map((provider) => (
                    <Link
                      key={provider.id}
                      to={`/certifications?provider=${encodeURIComponent(provider.slug)}`}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="flex items-center gap-2 rounded-lg bg-bg-card p-2 text-xs font-semibold text-white hover:bg-white/[0.08]"
                    >
                      <ProviderLogo provider={provider.name} size="sm" />
                      <span className="truncate">{provider.name}</span>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* 4. Mobile Internship Accordion */}
            <div className="border-b border-white/[0.08] py-2.5">
              <div className="flex items-center justify-between">
                <Link
                  to="/internship"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="text-base font-semibold text-white"
                >
                  Internship
                </Link>
                <button
                  onClick={() => setIsMobileInternshipOpen(!isMobileInternshipOpen)}
                  className="p-1 text-text-muted hover:text-white"
                >
                  <ChevronDown size={18} className={clsx('transition-transform', isMobileInternshipOpen && 'rotate-180')} />
                </button>
              </div>

              {isMobileInternshipOpen && (
                <div className="mt-2 space-y-2 pt-2 pl-2">
                  {INTERNSHIP_PROGRAMS.map((prog) => (
                    <Link
                      key={prog.id}
                      to="/internship"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="block rounded-lg bg-bg-card p-2 text-xs font-semibold text-white hover:bg-white/[0.08]"
                    >
                      <span className="text-brand-orange font-bold text-[10px] block">{prog.badge}</span>
                      {prog.title}
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* 5. Mobile AI Tools Accordion */}
            <div className="border-b border-white/[0.08] py-2.5">
              <div className="flex items-center justify-between">
                <span className="text-base font-semibold text-white">AI Tools</span>
                <button
                  onClick={() => setIsMobileToolsOpen(!isMobileToolsOpen)}
                  className="p-1 text-text-muted hover:text-white"
                >
                  <ChevronDown size={18} className={clsx('transition-transform', isMobileToolsOpen && 'rotate-180')} />
                </button>
              </div>

              {isMobileToolsOpen && (
                <div className="mt-2 grid grid-cols-1 gap-1.5 pt-2">
                  {CAREER_TOOLS.map((tool) => (
                    <Link
                      key={tool.name}
                      to={tool.path}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="flex items-center gap-2 rounded-lg p-2 text-xs font-medium text-text-muted hover:bg-white/[0.06] hover:text-white"
                    >
                      <Wrench size={13} className="text-brand-orange" />
                      <span>{tool.name}</span>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* 6. Mobile Technical Job Support Accordion */}
            <div className="border-b border-white/[0.08] py-2.5">
              <div className="flex items-center justify-between">
                <span className="text-base font-semibold text-white">Technical Job Support</span>
                <button
                  onClick={() => setIsMobileJobSupportOpen(!isMobileJobSupportOpen)}
                  className="p-1 text-text-muted hover:text-white"
                >
                  <ChevronDown size={18} className={clsx('transition-transform', isMobileJobSupportOpen && 'rotate-180')} />
                </button>
              </div>

              {isMobileJobSupportOpen && (
                <div className="mt-2 space-y-2 pt-2 pl-2">
                  {JOB_SUPPORT_CATEGORIES.map((cat, idx) => (
                    <div key={idx} className="space-y-1">
                      <span className="text-xs font-bold text-brand-orange">{cat.category}</span>
                      <div className="grid grid-cols-2 gap-1 pt-1">
                        {cat.items.map((item, itemIdx) => (
                          <Link
                            key={itemIdx}
                            to="/corporate"
                            onClick={() => setIsMobileMenuOpen(false)}
                            className="text-xs text-text-muted hover:text-white py-0.5"
                          >
                            • {item}
                          </Link>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 7. Mobile Corporate Training Accordion */}
            <div className="border-b border-white/[0.08] py-2.5">
              <div className="flex items-center justify-between">
                <Link
                  to="/corporate"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="text-base font-semibold text-white"
                >
                  Corporate Training
                </Link>
                <button
                  onClick={() => setIsMobileCorporateOpen(!isMobileCorporateOpen)}
                  className="p-1 text-text-muted hover:text-white"
                >
                  <ChevronDown size={18} className={clsx('transition-transform', isMobileCorporateOpen && 'rotate-180')} />
                </button>
              </div>

              {isMobileCorporateOpen && (
                <div className="mt-2 space-y-1.5 pt-2 pl-2">
                  {CORPORATE_COURSES.map((course, idx) => (
                    <Link
                      key={idx}
                      to="/corporate"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="block py-1 text-xs text-text-muted hover:text-white"
                    >
                      • {course}
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* 8. Mobile Connect Us */}
            <div className="border-b border-white/[0.08] py-2.5">
              <Link
                to="/connect-us"
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center justify-between text-base font-semibold text-white"
              >
                <span>Connect Us</span>
                <ArrowRight size={16} className="text-brand-orange" />
              </Link>
            </div>

          </nav>

          <div className="mt-8 flex flex-col gap-4">
            <div className="space-y-1.5">
              <span className="text-xs font-bold uppercase text-brand-orange">Theme Options</span>
              <ThemeSelector variant="segmented" />
            </div>
            {user ? (
              <div className="space-y-2">
                <div className="flex items-center gap-3 rounded-xl bg-white/[0.04] border border-white/[0.08] p-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-orange/20 text-brand-orange text-sm font-bold border border-brand-orange/30">
                    {(user.firstName?.[0] || user.email[0]).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white">{user.firstName || user.email.split('@')[0]}</p>
                    <p className="text-xs text-text-muted">{user.email}</p>
                  </div>
                </div>

                <Link
                  to={user.role === 'admin' ? '/dashboard/admin' : '/dashboard/student'}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="block rounded-xl bg-brand-orange py-3 text-center text-sm font-bold text-white shadow-lg"
                >
                  Enter Dashboard
                </Link>

                <button
                  onClick={() => { setIsMobileMenuOpen(false); logout(); }}
                  className="w-full rounded-xl border border-white/[0.12] py-2.5 text-center text-sm font-medium text-text-muted hover:text-white"
                >
                  Logout
                </button>
              </div>
            ) : (
              <Link
                to="/login"
                onClick={() => setIsMobileMenuOpen(false)}
                className="rounded-xl bg-brand-orange py-3 text-center font-medium text-white shadow-lg"
              >
                Login
              </Link>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default SiteNav;
