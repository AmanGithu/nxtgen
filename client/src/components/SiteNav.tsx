import { useState, useRef, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ThemeSelector } from '../theme';
import { Menu, X, ChevronDown, Wrench, LogOut } from 'lucide-react';
import { clsx } from 'clsx';
import { CAREER_TOOLS } from '../lib/tools';
import { useAuth } from '../context/AuthContext';

/**
 * The public site menu bar.
 *
 * Lifted out of PublicLayout rather than copied, because it now appears in two
 * places — the marketing pages and the AI tools dashboard for site users. Two
 * copies would drift the moment a menu item is added to one of them.
 *
 * `floating` is the home-page treatment: transparent, overlaying the hero.
 * Everywhere else it is a solid sticky bar.
 */

/* One shared catalogue, so the nav dropdown and the home-page slider can't
   drift apart — and so every entry points at the public /dashboard/tools
   paths a signed-out visitor can actually reach. */
const TOOLS_LIST = CAREER_TOOLS;

interface Props {
  /** Transparent overlay treatment, used on the home page hero. */
  floating?: boolean;
  /**
   * Span the full window instead of centring on a 7xl column.
   *
   * The marketing pages centre their content, so the nav matches them. The
   * dashboard is full-width with a flush sidebar, and a centred nav above it
   * leaves the logo floating in from the edge with nothing beneath it.
   */
  fullBleed?: boolean;
}

const SiteNav = ({ floating = false, fullBleed = false }: Props) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isToolsOpen, setIsToolsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const location = useLocation();
  const { user, logout } = useAuth();

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

  const linkClass = (path: string) =>
    clsx(
      'text-sm font-medium transition-colors hover:text-white',
      location.pathname === path ? 'text-brand-orange font-bold' : 'text-text-muted'
    );

  return (
    <>
      <header
        className={clsx(
          'z-50 transition-all duration-300',
          floating
            ? 'fixed top-0 left-0 right-0 border-b border-white/10 bg-gradient-to-b from-black/70 via-black/30 to-transparent backdrop-blur-[3px]'
            : 'sticky top-0 border-b border-white/[0.08] bg-bg-surface/95 backdrop-blur-md'
        )}
      >
        <div
          className={clsx(
            'flex h-16 items-center justify-between',
            fullBleed ? 'w-full px-6' : 'mx-auto max-w-7xl px-4 sm:px-6 lg:px-8'
          )}
        >
          {/* Twin Color Logo */}
          <div className="flex items-center gap-2">
            <Link to="/" className="flex items-center font-display text-2xl font-bold tracking-tight">
              <span className="text-brand-orange">NxtGen</span>
              <span className="ml-1 text-white">Academy</span>
            </Link>
          </div>

          {/* Desktop Main Menu Bar */}
          <nav className="hidden items-center gap-6 md:flex">
            <Link to="/" className={linkClass('/')}>Home</Link>
            <Link to="/courses" className={linkClass('/courses')}>Courses</Link>
            <Link to="/certifications" className={linkClass('/certifications')}>Certifications</Link>
            <Link to="/internship" className={linkClass('/internship')}>Internship</Link>

            {/* ─── AI TOOLS MAIN MENU ITEM WITH DROPDOWN ─── */}
            <div className="relative flex items-center" ref={dropdownRef}>
              {/* A menu heading, not a destination. Linking it sent visitors
                  straight into one tool's marketing preview and hid the other
                  eight; the label now opens the list, which is what a caret
                  next to a nav item implies. */}
              <button
                onClick={() => setIsToolsOpen(!isToolsOpen)}
                aria-haspopup="menu"
                aria-expanded={isToolsOpen}
                className={clsx(
                  'flex items-center gap-1 py-2 text-sm font-semibold transition-colors',
                  location.pathname.includes('/tools')
                    ? 'text-brand-orange font-bold'
                    : 'text-text-muted hover:text-white'
                )}
              >
                <span>AI Tools</span>
                <ChevronDown size={14} className={clsx('transition-transform', isToolsOpen && 'rotate-180')} />
              </button>

              {isToolsOpen && (
                <div className="absolute left-1/2 top-full z-50 mt-2 w-80 -translate-x-1/2 rounded-xl border border-white/[0.08] bg-bg-surface p-2 shadow-2xl backdrop-blur-xl">
                  <div className="mb-1 flex items-center justify-between border-b border-white/[0.08] px-3 py-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-brand-orange">
                      AI Career Toolkit Suite
                    </span>
                    <span className="text-[10px] text-text-muted">{TOOLS_LIST.length} AI Tools</span>
                  </div>
                  <div className="max-h-[380px] space-y-1 overflow-y-auto">
                    {TOOLS_LIST.map((tool) => {
                      const Icon = tool.icon;
                      return (
                        <Link
                          key={tool.name}
                          to={tool.path}
                          className="flex items-start gap-3 rounded-lg p-2.5 transition-colors hover:bg-white/[0.06]"
                        >
                          <div className="shrink-0 rounded-md bg-brand-orange/10 p-1.5 text-brand-orange">
                            <Icon size={16} />
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-white">{tool.name}</p>
                            <p className="text-[10px] leading-tight text-text-muted">{tool.desc}</p>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            <Link to="/upcoming-batches" className={linkClass('/upcoming-batches')}>Upcoming Batches</Link>
            <Link to="/corporate" className={linkClass('/corporate')}>Corporate</Link>
          </nav>

          {/* Right Action Cluster */}
          <div className="hidden items-center gap-4 md:flex">
            <ThemeSelector variant="dropdown" />
            {/* A signed-in visitor offered a "Login" button reads as though
                their session was lost. */}
            {user ? (
              <button
                onClick={logout}
                className="flex items-center gap-2 rounded-lg border border-white/[0.12] px-4 py-2 text-sm font-semibold text-text-muted transition-colors hover:text-white"
              >
                <LogOut size={15} />
                Logout
              </button>
            ) : (
              <Link
                to="/login"
                className="rounded-lg bg-brand-orange px-4 py-2 text-sm font-semibold text-white shadow-md transition-transform hover:scale-105"
              >
                Login
              </Link>
            )}
          </div>

          {/* Mobile Menu Button */}
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

      {/* Mobile Drawer */}
      <div
        className={clsx(
          'fixed inset-0 z-40 overflow-y-auto bg-bg-canvas/95 backdrop-blur-sm transition-transform duration-300 md:hidden',
          isMobileMenuOpen ? 'translate-x-0' : 'translate-x-full'
        )}
      >
        <div className="flex h-full flex-col px-6 pb-6 pt-20">
          <nav className="flex flex-col gap-4">
            <Link to="/" onClick={() => setIsMobileMenuOpen(false)} className="text-lg font-medium text-text-muted hover:text-white">Home</Link>
            <Link to="/courses" onClick={() => setIsMobileMenuOpen(false)} className="text-lg font-medium text-text-muted hover:text-white">Courses</Link>
            <Link to="/certifications" onClick={() => setIsMobileMenuOpen(false)} className="text-lg font-medium text-text-muted hover:text-white">Certifications</Link>
            <Link to="/internship" onClick={() => setIsMobileMenuOpen(false)} className="text-lg font-medium text-text-muted hover:text-white">Internship</Link>

            <div className="space-y-2 border-b border-t border-white/[0.08] py-4">
              <span className="text-xs font-bold uppercase text-brand-orange">AI Tools Toolkit</span>
              <div className="grid grid-cols-1 gap-2 pt-2">
                {TOOLS_LIST.map((tool) => (
                  <Link
                    key={tool.name}
                    to={tool.path}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center gap-2 text-sm font-medium text-text-muted hover:text-white"
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
            <div className="space-y-1.5">
              <span className="text-xs font-bold uppercase text-brand-orange">Theme Options</span>
              <ThemeSelector variant="segmented" />
            </div>
            {user ? (
              <button
                onClick={() => { setIsMobileMenuOpen(false); logout(); }}
                className="rounded-lg border border-white/[0.12] py-3 text-center font-medium text-text-muted"
              >
                Logout
              </button>
            ) : (
              <Link
                to="/login"
                onClick={() => setIsMobileMenuOpen(false)}
                className="rounded-lg bg-brand-orange py-3 text-center font-medium text-white shadow-lg"
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
