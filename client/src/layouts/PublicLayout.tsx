import { useState, useRef, useEffect } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { Menu, X, Sun, Moon, ChevronDown, Wrench, LayoutDashboard, LogOut } from 'lucide-react';
import { clsx } from 'clsx';
import { CAREER_TOOLS } from '../lib/tools';
import { siteAPI } from '../services/api';
import AccountMenu from '../components/AccountMenu';
import { useAuth } from '../context/AuthContext';
import { normalizeRole, dashboardPathForRole, ROLE_LABELS } from '../lib/roles';

const TOOLS_LIST = CAREER_TOOLS;

/** Shown when no admin-defined menu exists, so the nav is never empty. */
const DEFAULT_NAV = [
  { label: 'Home', href: '/' },
  { label: 'Courses', href: '/courses' },
  { label: 'Certifications', href: '/certifications' },
  { label: 'Internship', href: '/internship' },
];

const TRAILING_NAV = [
  { label: 'Upcoming Batches', href: '/upcoming-batches' },
  { label: 'Corporate', href: '/corporate' },
];

const PublicLayout = () => {
  const { theme, toggleTheme } = useTheme();
  const { user, logout } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isToolsOpen, setIsToolsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const location = useLocation();
  const [navItems, setNavItems] = useState(DEFAULT_NAV);

  /* The navigation is admin-editable via /dashboard/admin/menu. Fall back to
     the built-in list when none is configured, so the site is never left
     without a nav. */
  useEffect(() => {
    siteAPI
      .getMenu()
      .then((res) => {
        const items = res.data?.items ?? [];
        if (items.length) setNavItems(items.map((i: any) => ({ label: i.label, href: i.href })));
      })
      .catch((err) => console.error('Failed to load menu, using defaults:', err));
  }, []);

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
    <div className="flex min-h-screen flex-col bg-bg-canvas font-sans text-strong">
      {/* Top Header Navbar */}
      <header className="sticky top-0 z-50 border-b border-line bg-bg-surface/95 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          
          {/* Twin Color Logo */}
          <div className="flex items-center gap-2">
            <Link to="/" className="flex items-center font-display text-2xl font-bold tracking-tight">
              <span className="text-brand-orange">NxtGen</span>
              <span className="text-strong ml-1">Academy</span>
            </Link>
          </div>

          {/* Desktop Main Menu Bar */}
          <nav className="hidden md:flex items-center gap-6">
            {navItems.map((item) => (
              <Link
                key={item.href}
                to={item.href}
                className={clsx(
                  "text-sm font-medium transition-colors hover:text-strong",
                  location.pathname === item.href ? "text-brand-orange font-bold" : "text-text-muted"
                )}
              >
                {item.label}
              </Link>
            ))}

            {/* ─── AI TOOLS MAIN MENU ITEM WITH DROPDOWN ─── */}
            <div className="relative flex items-center" ref={dropdownRef}>
              <Link
                to="/dashboard/tools/resume-builder"
                className={clsx(
                  "flex items-center text-sm font-semibold transition-colors py-2",
                  location.pathname.includes('/tools') ? "text-brand-orange font-bold" : "text-text-muted hover:text-strong"
                )}
              >
                <span>AI Tools</span>
              </Link>

              <button
                onClick={() => setIsToolsOpen(!isToolsOpen)}
                className="p-1 text-text-muted hover:text-strong transition-colors"
                title="Toggle AI Tools List"
              >
                <ChevronDown size={14} className={clsx("transition-transform", isToolsOpen && "rotate-180")} />
              </button>

              {/* Dropdown Menu Listing All 8 Tools */}
              {isToolsOpen && (
                <div className="absolute left-1/2 -translate-x-1/2 top-full mt-2 w-80 rounded-xl border border-line bg-bg-surface p-2 shadow-2xl backdrop-blur-xl z-50">
                  <div className="px-3 py-2 border-b border-line mb-1 flex items-center justify-between">
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
                          className="flex items-start gap-3 rounded-lg p-2.5 transition-colors hover:bg-elevate"
                        >
                          <div className="rounded-md bg-brand-orange/10 p-1.5 text-brand-orange shrink-0">
                            <Icon size={16} />
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-strong">{tool.name}</p>
                            <p className="text-[10px] text-text-muted leading-tight">{tool.desc}</p>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {TRAILING_NAV.map((item) => (
              <Link
                key={item.href}
                to={item.href}
                className={clsx(
                  "text-sm font-medium transition-colors hover:text-strong",
                  location.pathname === item.href ? "text-brand-orange font-bold" : "text-text-muted"
                )}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          {/* Right Action Cluster */}
          <div className="hidden md:flex items-center gap-4">
            <button
              onClick={toggleTheme}
              className="rounded-full p-2 text-text-muted hover:bg-elevate hover:text-strong transition-colors"
            >
              {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            <AccountMenu />
          </div>

          {/* Mobile Menu Button */}
          <div className="flex items-center md:hidden">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 text-text-muted hover:text-strong"
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
            <Link to="/" onClick={() => setIsMobileMenuOpen(false)} className="text-lg font-medium text-text-muted hover:text-strong">Home</Link>
            <Link to="/courses" onClick={() => setIsMobileMenuOpen(false)} className="text-lg font-medium text-text-muted hover:text-strong">Courses</Link>
            <Link to="/certifications" onClick={() => setIsMobileMenuOpen(false)} className="text-lg font-medium text-text-muted hover:text-strong">Certifications</Link>
            <Link to="/internship" onClick={() => setIsMobileMenuOpen(false)} className="text-lg font-medium text-text-muted hover:text-strong">Internship</Link>

            {/* Mobile Tools List */}
            <div className="space-y-2 border-t border-b border-line py-4">
              <span className="text-xs font-bold text-brand-orange uppercase">AI Tools Toolkit</span>
              <div className="grid grid-cols-1 gap-2 pt-2">
                {TOOLS_LIST.map((tool) => (
                  <Link
                    key={tool.name}
                    to={tool.path}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="text-sm font-medium text-text-muted hover:text-strong flex items-center gap-2"
                  >
                    <Wrench size={14} className="text-brand-orange" />
                    <span>{tool.name}</span>
                  </Link>
                ))}
              </div>
            </div>

            <Link to="/upcoming-batches" onClick={() => setIsMobileMenuOpen(false)} className="text-lg font-medium text-text-muted hover:text-strong">Upcoming Batches</Link>
            <Link to="/corporate" onClick={() => setIsMobileMenuOpen(false)} className="text-lg font-medium text-text-muted hover:text-strong">Corporate</Link>
          </nav>

          <div className="mt-8 flex flex-col gap-4">
            <button onClick={toggleTheme} className="flex items-center gap-2 text-text-muted hover:text-strong">
              {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
              <span>Toggle Theme</span>
            </button>
            {user ? (
              <>
                <div className="flex items-center gap-3 rounded-lg border border-line bg-bg-surface p-3">
                  <span className="grid h-10 w-10 place-items-center rounded-full bg-brand-orange font-bold text-on-brand">
                    {(user.firstName?.[0] || user.email?.[0] || 'U').toUpperCase()}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-strong">
                      {`${user.firstName ?? ''} ${user.lastName ?? ''}`.trim() || user.email}
                    </p>
                    <p className="truncate text-xs text-text-muted">{ROLE_LABELS[normalizeRole(user.role)]}</p>
                  </div>
                </div>
                <Link
                  to={dashboardPathForRole(normalizeRole(user.role))}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center gap-3 rounded-lg bg-brand-orange py-3 px-4 font-medium text-on-brand shadow-lg"
                >
                  <LayoutDashboard size={18} />
                  Dashboard
                </Link>
                <button
                  onClick={() => { setIsMobileMenuOpen(false); logout(); }}
                  className="flex items-center gap-2 text-text-muted hover:text-strong"
                >
                  <LogOut size={20} />
                  <span>Sign out</span>
                </button>
              </>
            ) : (
              <Link to="/login" onClick={() => setIsMobileMenuOpen(false)} className="rounded-lg bg-brand-orange py-3 text-center font-medium text-on-brand shadow-lg">
                Login
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-grow">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="border-t border-line bg-bg-surface py-12">
        <div className="mx-auto grid max-w-7xl grid-cols-1 gap-8 px-4 sm:px-6 lg:grid-cols-4 lg:px-8">
          <div className="flex flex-col gap-4">
            <div className="flex items-center font-display text-xl font-bold">
              <span className="text-brand-orange">NxtGen</span>
              <span className="text-strong ml-1">Academy</span>
            </div>
            <p className="text-sm text-text-muted">Where Careers Are Born, Not Found.</p>
          </div>
          <div>
            <h3 className="mb-4 font-semibold text-strong">Courses</h3>
            <ul className="flex flex-col gap-2 text-sm text-text-muted">
              <li><Link to="/courses" className="hover:text-strong">All Courses</Link></li>
              <li><Link to="/certifications" className="hover:text-strong">Certifications</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="mb-4 font-semibold text-strong">Internship & Tools</h3>
            <ul className="flex flex-col gap-2 text-sm text-text-muted">
              <li><Link to="/internship" className="hover:text-strong">Internship Programs</Link></li>
              <li><Link to="/dashboard/tools/resume-builder" className="hover:text-strong">AI Career Toolkit</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="mb-4 font-semibold text-strong">Legal</h3>
            <ul className="flex flex-col gap-2 text-sm text-text-muted">
              <li><Link to="/privacy" className="hover:text-strong">Privacy Policy</Link></li>
              <li><Link to="/terms" className="hover:text-strong">Terms of Service</Link></li>
            </ul>
          </div>
        </div>
        <div className="mx-auto mt-12 max-w-7xl border-t border-line px-4 pt-8 text-center text-sm text-text-muted sm:px-6 lg:px-8">
          Powered by <span className="font-semibold text-strong">PAVY</span>
        </div>
      </footer>
    </div>
  );
};

export default PublicLayout;
