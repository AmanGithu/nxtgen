import { useState } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { ROLE_LABELS } from '../lib/roles';
import { clsx } from 'clsx';
import {
  LayoutDashboard, Users, Settings, Calendar, BookOpen,
  Award, Briefcase, FileText, Menu, X, LogOut, Lock, Mic, Bot, Sun, Moon, Cpu,
  Image as ImageIcon, Activity
} from 'lucide-react';

interface DashboardLayoutProps {
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
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();

  const adminLinks: NavLinkItem[] = [
    { name: 'Overview', path: '/dashboard/admin', icon: LayoutDashboard },
    { name: 'User Management', path: '/dashboard/admin/users', icon: Users },
    { name: 'Courses', path: '/dashboard/admin/courses', icon: BookOpen },
    { name: 'Batch Config', path: '/dashboard/admin/batches', icon: Settings },
    { name: 'Class Scheduler', path: '/dashboard/admin/scheduler', icon: Calendar },
    { name: 'Upcoming Batches', path: '/dashboard/admin/upcoming', icon: Calendar },
    { name: 'Corporate', path: '/dashboard/admin/corporate', icon: Briefcase },
    { name: 'Internships', path: '/dashboard/admin/internships', icon: Briefcase },
    { name: 'Study Materials', path: '/dashboard/admin/materials', icon: BookOpen },
    { name: 'Certifications', path: '/dashboard/admin/certifications', icon: Award },
    { name: 'Cert Inquiries', path: '/dashboard/admin/cert-inquiries', icon: FileText },
    { name: 'Menu Editor', path: '/dashboard/admin/menu', icon: Menu },
    { name: 'Hero Banners', path: '/dashboard/admin/banners', icon: ImageIcon },
    { name: 'Resume Templates', path: '/dashboard/admin/templates', icon: FileText },
    { name: 'AI Config', path: '/dashboard/admin/ai-config', icon: Cpu },
    { name: 'Audit Logs', path: '/dashboard/admin/logs', icon: Activity },
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

  // Site users get the career toolkit only — no batches, materials or schedule.
  const toolsLinks: NavLinkItem[] = [
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

  const links =
    variant === 'admin' ? adminLinks : variant === 'tools' ? toolsLinks : studentLinks;

  return (
    <div className="flex h-screen overflow-hidden bg-bg-canvas text-strong">
      {/* Sidebar */}
      <aside
        className={clsx(
          "flex flex-col border-r border-line bg-bg-surface transition-all duration-300",
          isSidebarOpen ? "w-64" : "w-20"
        )}
      >
        <div className="flex h-16 items-center justify-between px-4">
          {isSidebarOpen && (
            <Link
              to="/"
              title="Back to NxtGen Academy home"
              className="font-display text-xl font-bold transition-opacity hover:opacity-80"
            >
              <span className="text-brand-orange">NxtGen</span>
              <span className="ml-1 text-strong">Academy</span>
            </Link>
          )}
          <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 text-text-muted hover:text-strong">
            <Menu size={20} />
          </button>
        </div>

        <div className={clsx("mb-6 px-4", isSidebarOpen ? "block" : "hidden")}>
          <div className="flex items-center gap-3 rounded-lg bg-bg-card p-3 border border-line">
            <div className="h-10 w-10 rounded-full bg-brand-orange flex items-center justify-center font-bold text-on-brand">
              {user?.firstName?.[0] || 'G'}
            </div>
            <div>
              <p className="text-sm font-medium">
                {user ? `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim() : 'Guest'}
              </p>
              <p className="text-xs text-text-muted">{user ? ROLE_LABELS[user.role] : 'Not signed in'}</p>
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
                          : "text-text-muted hover:bg-elevate hover:text-strong"
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

        <div className="border-t border-line p-4 space-y-1">
          <button
            onClick={toggleTheme}
            title={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-text-muted transition-colors hover:bg-elevate hover:text-strong"
          >
            {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
            {isSidebarOpen && (
              <span className="text-sm font-medium">{theme === 'dark' ? 'Light theme' : 'Dark theme'}</span>
            )}
          </button>
          {user ? (
            <button
              onClick={logout}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-text-muted transition-colors hover:bg-elevate hover:text-strong"
            >
              <LogOut size={20} />
              {isSidebarOpen && <span className="text-sm font-medium">Logout</span>}
            </button>
          ) : (
            <Link
              to="/login"
              className="flex w-full items-center gap-3 rounded-lg bg-brand-orange px-3 py-2 text-on-brand transition-colors hover:bg-orange-600"
            >
              <LogOut size={20} className="rotate-180" />
              {isSidebarOpen && <span className="text-sm font-medium">Sign in to save</span>}
            </Link>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <div className="h-16 border-b border-line bg-bg-surface/80 backdrop-blur-md sticky top-0 z-10 flex items-center px-8">
          <h1 className="text-lg font-medium capitalize">{location.pathname.split('/').pop() || 'Dashboard'}</h1>
        </div>
        <div className="p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default DashboardLayout;
