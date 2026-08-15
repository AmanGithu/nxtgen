import { useState } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { normalizeRole } from '../lib/roles';
import SiteNav from '../components/SiteNav';
import { ThemeSelector } from '../theme';
import { clsx } from 'clsx';
import {
  LayoutDashboard, Users, Settings, Calendar, BookOpen,
  Award, Briefcase, FileText, Menu, X, LogOut, Lock, Mic, Bot, Cpu, Layers, Tag
} from 'lucide-react';

interface DashboardLayoutProps {
  /* 'tools' is the career toolkit, which is open to signed-out visitors.
     Without it, variant="tools" fell through to the student nav and showed a
     guest Study Material, Class Schedule and a Logout button — links they
     cannot use and an action that makes no sense when not signed in. */
  variant: 'admin' | 'student' | 'tools';
}

interface NavLinkItem {
  name: string;
  path: string;
  icon: any;
  disabled?: boolean;
}

const DashboardLayout = ({ variant }: DashboardLayoutProps) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const { user, logout } = useAuth();
  const location = useLocation();

  const adminLinks: NavLinkItem[] = [
    { name: 'Overview', path: '/dashboard/admin', icon: LayoutDashboard },
    { name: 'Site Analytics', path: '/dashboard/admin/analytics', icon: LayoutDashboard },
    { name: 'Lead Manager', path: '/dashboard/admin/leads', icon: Users },
    { name: 'Site Manager CMS', path: '/dashboard/admin/site-manager', icon: Layers },
    { name: 'User Management', path: '/dashboard/admin/users', icon: Users },
    { name: 'Batch Config', path: '/dashboard/admin/batches', icon: Settings },
    { name: 'Class Scheduler', path: '/dashboard/admin/scheduler', icon: Calendar },
    { name: 'Upcoming Batches', path: '/dashboard/admin/upcoming', icon: Calendar },
    { name: 'Corporate', path: '/dashboard/admin/corporate', icon: Briefcase },
    { name: 'Internships', path: '/dashboard/admin/internships', icon: Briefcase },
    { name: 'Study Materials', path: '/dashboard/admin/materials', icon: BookOpen },
    { name: 'Certifications', path: '/dashboard/admin/certifications', icon: Award },
    { name: 'Cert Inquiries', path: '/dashboard/admin/cert-inquiries', icon: FileText },
    { name: 'AI Config', path: '/dashboard/admin/ai-config', icon: Cpu },
    { name: 'Pricing', path: '/dashboard/admin/pricing', icon: Tag },
  ];

  const siteManagerLinks: NavLinkItem[] = [
    { name: 'Site Manager CMS', path: '/dashboard/admin/site-manager', icon: Layers },
    { name: 'Theme Assets', path: '/dashboard/admin/theme-assets', icon: Layers },
    { name: 'AI Config', path: '/dashboard/admin/about-us', icon: Cpu },
    { name: 'Batch Config', path: '/dashboard/admin/batches', icon: Settings },
    { name: 'Study Materials', path: '/dashboard/admin/materials', icon: BookOpen },
    { name: 'Class Scheduler', path: '/dashboard/admin/scheduler', icon: Calendar },
    { name: 'Upcoming Batches', path: '/dashboard/admin/upcoming', icon: Calendar },
    { name: 'Cert Inquiries', path: '/dashboard/admin/cert-inquiries', icon: FileText },
  ];

  const leadManagerLinks: NavLinkItem[] = [
    { name: 'Lead Manager', path: '/dashboard/admin/leads', icon: Users },
  ];

  const studentLinks: NavLinkItem[] = [
    { name: 'Overview', path: '/dashboard/student', icon: LayoutDashboard },
    { name: 'Study Material', path: '/dashboard/student/materials', icon: BookOpen },
    { name: 'Class Schedule', path: '/dashboard/student/schedule', icon: Calendar },
    { name: 'Certifications', path: '/dashboard/student/certifications', icon: Award },
    { name: 'AI Resume Builder', path: '/dashboard/student/tools/resume-builder', icon: FileText },
    { name: 'ATS Score Checker', path: '/dashboard/student/tools/ats-checker', icon: Settings },
    { name: 'JD Resume Tailor', path: '/dashboard/student/tools/tailor-resume', icon: Award },
    { name: 'LinkedIn Analyser', path: '/dashboard/student/tools/linkedin-analyser', icon: Users },
    { name: 'Cover Letter Builder', path: '/dashboard/student/tools/cover-letter', icon: FileText },
    { name: 'Interview Prep Kit', path: '/dashboard/student/tools/interview-prep', icon: LayoutDashboard },
    { name: 'I-Assist', path: '/dashboard/student/tools/i-assist', icon: Mic },
    { name: 'Live AI Interview', path: '/dashboard/student/tools/live-interview', icon: Bot },
    { name: 'Unlock All Packages', path: '/dashboard/student/unlock', icon: Lock },
  ];

  /* Same tools, but pointed at the public /dashboard/tools paths rather than
     the student-only ones, so a guest is never sent somewhere they'll be
     bounced from. */
  const toolLinks: NavLinkItem[] = [
    { name: 'AI Resume Builder', path: '/dashboard/tools/resume-builder', icon: FileText },
    { name: 'ATS Score Checker', path: '/dashboard/tools/ats-checker', icon: Settings },
    { name: 'JD Resume Tailor', path: '/dashboard/tools/tailor-resume', icon: Award },
    { name: 'LinkedIn Analyser', path: '/dashboard/tools/linkedin-analyser', icon: Users },
    { name: 'Cover Letter Builder', path: '/dashboard/tools/cover-letter', icon: FileText },
    { name: 'Interview Prep Kit', path: '/dashboard/tools/interview-prep', icon: LayoutDashboard },
    { name: 'I-Assist', path: '/dashboard/tools/i-assist', icon: Mic },
    { name: 'Live AI Interview', path: '/dashboard/tools/live-interview', icon: Bot },
    { name: 'Unlock All Packages', path: '/dashboard/tools/unlock', icon: Lock },
  ];

  const roleStr = (user?.role || '').toLowerCase();
  const links =
    variant === 'admin'
      ? roleStr === 'site_manager'
        ? siteManagerLinks
        : roleStr === 'lead_manager'
          ? leadManagerLinks
          : adminLinks
      : variant === 'tools'
        ? toolLinks
        : studentLinks;

  /* The public site menu, carried into the AI toolkit for site users.

     They are the only audience it makes sense for: the toolkit is their whole
     product, and without it the marketing site becomes unreachable once they
     enter a tool. Students and admins have their own consoles and their own
     navigation, so a second menu offering Courses and Corporate would just be
     a way to lose their place. Signed-in or not makes no difference — a
     visitor who has not signed up yet is exactly who most needs the way back. */
  const role = normalizeRole(user?.role);
  const showSiteNav = variant === 'tools' && (!user || role === 'site_user');

  return (
    /* --dash-chrome is the total height of the fixed bars above the routed
       content: the dashboard's own 4rem header, plus another 4rem of public
       menu bar when site users get one. Panes that size themselves against
       the viewport read it rather than assuming a single header. */
    <div
      className="flex h-screen flex-col overflow-hidden bg-bg-canvas text-white"
      style={{ ['--dash-chrome' as string]: showSiteNav ? '8rem' : '4rem' }}
    >
      {showSiteNav && <SiteNav fullBleed />}

      <div className="flex min-h-0 flex-1 overflow-hidden">
      {/* Sidebar */}
      <aside
        className={clsx(
          "flex flex-col border-r border-white/[0.08] bg-bg-surface transition-all duration-300",
          isSidebarOpen ? "w-64" : "w-20"
        )}
      >
        <div className={clsx('flex items-center px-4', showSiteNav ? 'h-14 justify-end' : 'h-16 justify-between')}>
          {/* The site nav already carries the masthead directly above this, so
              repeating it here would put the same logo on screen twice. */}
          {isSidebarOpen && !showSiteNav && (
            /* A masthead people expect to click — it was plain text, so the
               only way out of the dashboard was the browser's back button. */
            <Link
              to="/"
              title="Back to NxtGen Academy home"
              className="font-display text-xl font-bold transition-opacity hover:opacity-80"
            >
              <span className="text-brand-orange">NxtGen</span>
              <span className="ml-1 text-strong">Academy</span>
            </Link>
          )}
          <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 text-text-muted hover:text-white">
            <Menu size={20} />
          </button>
        </div>

        <div className={clsx("mb-6 px-4", isSidebarOpen ? "block" : "hidden")}>
          <div className="flex items-center gap-3 rounded-lg bg-bg-card p-3 border border-white/[0.08]">
            <div className="h-10 w-10 rounded-full bg-brand-orange flex items-center justify-center font-bold text-white">
              {user?.firstName?.[0] || 'G'}
            </div>
            <div>
              <p className="text-sm font-medium">
                {user ? `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim() : 'Guest'}
              </p>
              <p className="text-xs text-text-muted capitalize">
                {user ? user.role : 'Not signed in'}
              </p>
            </div>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto px-2">
          <ul className="space-y-1">
            {links.map((link) => {
              const Icon = link.icon;
              const isActive = location.pathname === link.path;
              return (
                <li key={link.name}>
                  {link.disabled ? (
                    <div className="flex items-center gap-3 rounded-lg px-3 py-2 text-text-muted opacity-50 cursor-not-allowed">
                      <Icon size={20} />
                      {isSidebarOpen && <span className="text-sm font-medium">{link.name}</span>}
                    </div>
                  ) : (
                    <Link
                      to={link.path}
                      className={clsx(
                        "flex items-center gap-3 rounded-lg px-3 py-2 transition-colors",
                        isActive 
                          ? "bg-brand-orange/10 text-brand-orange" 
                          : "text-text-muted hover:bg-white/[0.05] hover:text-white"
                      )}
                    >
                      <Icon size={20} />
                      {isSidebarOpen && <span className="text-sm font-medium">{link.name}</span>}
                    </Link>
                  )}
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="border-t border-white/[0.08] p-4">
          {user ? (
            <button
              onClick={logout}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-text-muted transition-colors hover:bg-white/[0.05] hover:text-white"
            >
              <LogOut size={20} />
              {isSidebarOpen && <span className="text-sm font-medium">Logout</span>}
            </button>
          ) : (
            /* Guests keep their work in the browser; signing in is what moves
               it to an account, so that is the action to offer them here. */
            <Link
              to="/login"
              className="flex w-full items-center gap-3 rounded-lg bg-brand-orange px-3 py-2 text-white transition-colors hover:bg-orange-600"
            >
              <LogOut size={20} className="rotate-180" />
              {isSidebarOpen && <span className="text-sm font-medium">Sign in to save</span>}
            </Link>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <div className="h-16 border-b border-white/[0.08] bg-bg-surface/80 backdrop-blur-md sticky top-0 z-10 flex items-center justify-between px-8">
          <h1 className="text-lg font-medium capitalize">{location.pathname.split('/').pop() || 'Dashboard'}</h1>
          {/* The site nav has its own theme control, and two identical
              selectors stacked a row apart reads as a bug. */}
          {!showSiteNav && <ThemeSelector variant="dropdown" />}
        </div>
        <div className="p-8">
          <Outlet />
        </div>
      </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
