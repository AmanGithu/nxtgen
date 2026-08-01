import { useState } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { clsx } from 'clsx';
import { 
  LayoutDashboard, Users, Settings, Calendar, BookOpen, 
  Award, Briefcase, FileText, Menu, X, LogOut, Lock, Mic, Bot 
} from 'lucide-react';

interface DashboardLayoutProps {
  variant: 'admin' | 'student';
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
    { name: 'User Management', path: '/dashboard/admin/users', icon: Users },
    { name: 'Batch Config', path: '/dashboard/admin/batches', icon: Settings },
    { name: 'Class Scheduler', path: '/dashboard/admin/scheduler', icon: Calendar },
    { name: 'Upcoming Batches', path: '/dashboard/admin/upcoming', icon: Calendar },
    { name: 'Corporate', path: '/dashboard/admin/corporate', icon: Briefcase },
    { name: 'Internships', path: '/dashboard/admin/internships', icon: Briefcase },
    { name: 'Study Materials', path: '/dashboard/admin/materials', icon: BookOpen },
    { name: 'Certifications', path: '/dashboard/admin/certifications', icon: Award },
    { name: 'Cert Inquiries', path: '/dashboard/admin/cert-inquiries', icon: FileText },
    { name: 'Menu Editor', path: '/dashboard/admin/menu', icon: Menu },
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

  const links = variant === 'admin' ? adminLinks : studentLinks;

  return (
    <div className="flex h-screen overflow-hidden bg-bg-canvas text-white">
      {/* Sidebar */}
      <aside
        className={clsx(
          "flex flex-col border-r border-white/[0.08] bg-bg-surface transition-all duration-300",
          isSidebarOpen ? "w-64" : "w-20"
        )}
      >
        <div className="flex h-16 items-center justify-between px-4">
          {isSidebarOpen && (
            <div className="font-display text-xl font-bold">
              <span className="text-brand-orange">NxtGen</span>
            </div>
          )}
          <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 text-text-muted hover:text-white">
            <Menu size={20} />
          </button>
        </div>

        <div className={clsx("mb-6 px-4", isSidebarOpen ? "block" : "hidden")}>
          <div className="flex items-center gap-3 rounded-lg bg-bg-card p-3 border border-white/[0.08]">
            <div className="h-10 w-10 rounded-full bg-brand-orange flex items-center justify-center font-bold text-white">
              {user?.firstName?.[0] || 'U'}
            </div>
            <div>
              <p className="text-sm font-medium">{user?.firstName} {user?.lastName}</p>
              <p className="text-xs text-text-muted capitalize">{user?.role}</p>
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
          <button
            onClick={logout}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-text-muted transition-colors hover:bg-white/[0.05] hover:text-white"
          >
            <LogOut size={20} />
            {isSidebarOpen && <span className="text-sm font-medium">Logout</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <div className="h-16 border-b border-white/[0.08] bg-bg-surface/80 backdrop-blur-md sticky top-0 z-10 flex items-center px-8">
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
