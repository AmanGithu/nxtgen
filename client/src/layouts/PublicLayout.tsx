import { useState, useRef, useEffect } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { 
  Menu, X, Sun, Moon, ChevronDown, Wrench, FileText, Target, Award, Globe, Bot, Sparkles, Mic 
} from 'lucide-react';
import { clsx } from 'clsx';

const TOOLS_LIST = [
  { name: 'AI Resume Builder', path: '/dashboard/student/tools/resume-builder', icon: FileText, desc: 'Live A4 WYSIWYG editor with inline AI bullet rewriter' },
  { name: 'ATS Score Checker', path: '/dashboard/student/tools/ats-checker', icon: Target, desc: '0-100% ATS match score ring & keyword audit' },
  { name: 'JD Resume Tailor', path: '/dashboard/student/tools/tailor-resume', icon: Award, desc: 'Compare resume vs JD & inject missing terms' },
  { name: 'LinkedIn Profile Analyser', path: '/dashboard/student/tools/linkedin-analyser', icon: Globe, desc: 'Profile SEO audit & AI recruiter headlines' },
  { name: 'Cover Letter Builder', path: '/dashboard/student/tools/cover-letter', icon: FileText, desc: '250-word role-tailored cover letters' },
  { name: 'Interview Prep Kit', path: '/dashboard/student/tools/interview-prep', icon: Bot, desc: '20 STAR-format model Q&A cards' },
  { name: 'Upload & Enhance', path: '/tools/upload-enhance', icon: Sparkles, desc: 'Auto-parse PDF & enhance action verbs' },
  { name: 'I-Assist', path: '/dashboard/student/tools/i-assist', icon: Mic, desc: 'AI-powered interview co-pilot' },
];

const PublicLayout = () => {
  const { theme, toggleTheme } = useTheme();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isToolsOpen, setIsToolsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const location = useLocation();

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsToolsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close dropdown on route change
  useEffect(() => {
    setIsToolsOpen(false);
    setIsMobileMenuOpen(false);
  }, [location]);

  return (
    <div className="flex min-h-screen flex-col bg-bg-canvas font-sans text-white">
      {/* Top Header Navbar */}
      <header className="sticky top-0 z-50 border-b border-white/[0.08] bg-bg-surface/95 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          
          {/* Twin Color Logo */}
          <div className="flex items-center gap-2">
            <Link to="/" className="flex items-center font-display text-2xl font-bold tracking-tight">
              <span className="text-brand-orange">NxtGen</span>
              <span className="text-white ml-1">Academy</span>
            </Link>
          </div>

          {/* Desktop Main Menu Bar */}
          <nav className="hidden md:flex items-center gap-6">
            <Link to="/" className={clsx("text-sm font-medium transition-colors hover:text-white", location.pathname === '/' ? "text-brand-orange font-bold" : "text-text-muted")}>
              Home
            </Link>
            
            <Link to="/courses" className={clsx("text-sm font-medium transition-colors hover:text-white", location.pathname === '/courses' ? "text-brand-orange font-bold" : "text-text-muted")}>
              Courses
            </Link>
            
            <Link to="/certifications" className={clsx("text-sm font-medium transition-colors hover:text-white", location.pathname === '/certifications' ? "text-brand-orange font-bold" : "text-text-muted")}>
              Certifications
            </Link>
            
            <Link to="/internship" className={clsx("text-sm font-medium transition-colors hover:text-white", location.pathname === '/internship' ? "text-brand-orange font-bold" : "text-text-muted")}>
              Internship
            </Link>

            {/* ─── AI TOOLS MAIN MENU ITEM WITH DROPDOWN ─── */}
            <div className="relative flex items-center" ref={dropdownRef}>
              <Link
                to="/tools/resume-builder"
                className={clsx(
                  "flex items-center text-sm font-semibold transition-colors py-2",
                  location.pathname.includes('/tools') ? "text-brand-orange font-bold" : "text-text-muted hover:text-white"
                )}
              >
                <span>AI Tools</span>
              </Link>

              <button
                onClick={() => setIsToolsOpen(!isToolsOpen)}
                className="p-1 text-text-muted hover:text-white transition-colors"
                title="Toggle AI Tools List"
              >
                <ChevronDown size={14} className={clsx("transition-transform", isToolsOpen && "rotate-180")} />
              </button>

              {/* Dropdown Menu Listing All 8 Tools */}
              {isToolsOpen && (
                <div className="absolute left-1/2 -translate-x-1/2 top-full mt-2 w-80 rounded-xl border border-white/[0.08] bg-bg-surface p-2 shadow-2xl backdrop-blur-xl z-50">
                  <div className="px-3 py-2 border-b border-white/[0.08] mb-1 flex items-center justify-between">
                    <span className="text-[10px] font-bold text-brand-orange uppercase tracking-wider">AI Career Toolkit Suite</span>
                    <span className="text-[10px] text-text-muted">8 AI Tools</span>
                  </div>
                  <div className="space-y-1 max-h-[380px] overflow-y-auto">
                    {TOOLS_LIST.map((tool) => {
                      const Icon = tool.icon;
                      return (
                        <Link
                          key={tool.name}
                          to={tool.path}
                          className="flex items-start gap-3 rounded-lg p-2.5 transition-colors hover:bg-white/[0.06]"
                        >
                          <div className="rounded-md bg-brand-orange/10 p-1.5 text-brand-orange shrink-0">
                            <Icon size={16} />
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-white">{tool.name}</p>
                            <p className="text-[10px] text-text-muted leading-tight">{tool.desc}</p>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            <Link to="/upcoming-batches" className={clsx("text-sm font-medium transition-colors hover:text-white", location.pathname === '/upcoming-batches' ? "text-brand-orange font-bold" : "text-text-muted")}>
              Upcoming Batches
            </Link>

            <Link to="/corporate" className={clsx("text-sm font-medium transition-colors hover:text-white", location.pathname === '/corporate' ? "text-brand-orange font-bold" : "text-text-muted")}>
              Corporate
            </Link>
          </nav>

          {/* Right Action Cluster */}
          <div className="hidden md:flex items-center gap-4">
            <button
              onClick={toggleTheme}
              className="rounded-full p-2 text-text-muted hover:bg-white/[0.05] hover:text-white transition-colors"
            >
              {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            <Link
              to="/login"
              className="rounded-lg bg-brand-orange px-4 py-2 text-sm font-semibold text-white transition-transform hover:scale-105 shadow-md"
            >
              Login
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <div className="flex items-center md:hidden">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 text-text-muted hover:text-white"
            >
              {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Drawer */}
      <div
        className={clsx(
          "fixed inset-0 z-40 bg-bg-canvas/95 backdrop-blur-sm transition-transform duration-300 md:hidden overflow-y-auto",
          isMobileMenuOpen ? "translate-x-0" : "translate-x-full"
        )}
      >
        <div className="flex h-full flex-col pt-20 px-6 pb-6">
          <nav className="flex flex-col gap-4">
            <Link to="/" onClick={() => setIsMobileMenuOpen(false)} className="text-lg font-medium text-text-muted hover:text-white">Home</Link>
            <Link to="/courses" onClick={() => setIsMobileMenuOpen(false)} className="text-lg font-medium text-text-muted hover:text-white">Courses</Link>
            <Link to="/certifications" onClick={() => setIsMobileMenuOpen(false)} className="text-lg font-medium text-text-muted hover:text-white">Certifications</Link>
            <Link to="/internship" onClick={() => setIsMobileMenuOpen(false)} className="text-lg font-medium text-text-muted hover:text-white">Internship</Link>

            {/* Mobile Tools List */}
            <div className="space-y-2 border-t border-b border-white/[0.08] py-4">
              <span className="text-xs font-bold text-brand-orange uppercase">AI Tools Toolkit</span>
              <div className="grid grid-cols-1 gap-2 pt-2">
                {TOOLS_LIST.map((tool) => (
                  <Link
                    key={tool.name}
                    to={tool.path}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="text-sm font-medium text-text-muted hover:text-white flex items-center gap-2"
                  >
                    <Wrench size={14} className="text-brand-orange" />
                    <span>{tool.name}</span>
                  </Link>
                ))}
              </div>
            </div>

            <Link to="/upcoming-batches" onClick={() => setIsMobileMenuOpen(false)} className="text-lg font-medium text-text-muted hover:text-white">Upcoming Batches</Link>
            <Link to="/corporate" onClick={() => setIsMobileMenuOpen(false)} className="text-lg font-medium text-text-muted hover:text-white">Corporate</Link>
          </nav>

          <div className="mt-8 flex flex-col gap-4">
            <button onClick={toggleTheme} className="flex items-center gap-2 text-text-muted hover:text-white">
              {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
              <span>Toggle Theme</span>
            </button>
            <Link to="/login" onClick={() => setIsMobileMenuOpen(false)} className="rounded-lg bg-brand-orange py-3 text-center font-medium text-white shadow-lg">
              Login
            </Link>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-grow">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="border-t border-white/[0.08] bg-bg-surface py-12">
        <div className="mx-auto grid max-w-7xl grid-cols-1 gap-8 px-4 sm:px-6 lg:grid-cols-4 lg:px-8">
          <div className="flex flex-col gap-4">
            <div className="flex items-center font-display text-xl font-bold">
              <span className="text-brand-orange">NxtGen</span>
              <span className="text-white ml-1">Academy</span>
            </div>
            <p className="text-sm text-text-muted">Where Careers Are Born, Not Found.</p>
          </div>
          <div>
            <h3 className="mb-4 font-semibold text-white">Courses</h3>
            <ul className="flex flex-col gap-2 text-sm text-text-muted">
              <li><Link to="/courses" className="hover:text-white">All Courses</Link></li>
              <li><Link to="/certifications" className="hover:text-white">Certifications</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="mb-4 font-semibold text-white">Internship & Tools</h3>
            <ul className="flex flex-col gap-2 text-sm text-text-muted">
              <li><Link to="/internship" className="hover:text-white">Internship Programs</Link></li>
              <li><Link to="/dashboard/student/tools/resume-builder" className="hover:text-white">AI Career Toolkit</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="mb-4 font-semibold text-white">Legal</h3>
            <ul className="flex flex-col gap-2 text-sm text-text-muted">
              <li><Link to="/privacy" className="hover:text-white">Privacy Policy</Link></li>
              <li><Link to="/terms" className="hover:text-white">Terms of Service</Link></li>
            </ul>
          </div>
        </div>
        <div className="mx-auto mt-12 max-w-7xl border-t border-white/[0.08] px-4 pt-8 text-center text-sm text-text-muted sm:px-6 lg:px-8">
          Powered by <span className="font-semibold text-white">PAVY</span>
        </div>
      </footer>
    </div>
  );
};

export default PublicLayout;
