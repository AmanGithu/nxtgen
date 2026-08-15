import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  GraduationCap,
  Layers,
  MessageSquare,
  Activity,
  ShieldCheck,
  Settings,
  Calendar,
  Briefcase,
  BookOpen,
  Award,
  FileText,
  Menu,
  Cpu,
  Tag,
  Image as ImageIcon,
  Bot,
  Megaphone,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import api from '../../services/api';

interface DashboardTile {
  title: string;
  category: string;
  description: string;
  path: string;
  icon: any;
  color: string;
  bg: string;
  badge: string;
}

export default function AdminOverview() {
  const [stats, setStats] = useState<any>({ totalUsers: 0, totalStudents: 0, totalBatches: 0, newCertInquiries: 0 });
  const [recentLogs, setRecentLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const res = await api.get('/admin/overview');
      if (res.data.success) {
        setStats(res.data.stats);
        setRecentLogs(res.data.recentLogs);
      }
    } catch (err) {
      console.error('Failed to fetch admin stats:', err);
    } finally {
      setLoading(false);
    }
  };

  const dashboardTiles: DashboardTile[] = [
    {
      title: 'Site Analytics',
      category: 'Real-Time Insights',
      description: 'View daily lead charts, CTA distributions, page visits, and conversion analytics.',
      path: '/dashboard/admin/analytics',
      icon: Activity,
      color: '#D4AF37',
      bg: 'rgba(212, 175, 55, 0.15)',
      badge: 'Real-Time Stats',
    },
    {
      title: 'Lead Manager Dashboard',
      category: 'Unified Leads',
      description: 'Track and manage leads captured from WhatsApp, Contact Form, Course CTAs, and AI Coordinator.',
      path: '/dashboard/admin/leads',
      icon: Users,
      color: '#10B981',
      bg: 'rgba(16, 185, 129, 0.15)',
      badge: 'Leads CRM',
    },
    {
      title: 'Site Manager CMS',
      category: 'Page Content & SEO',
      description: 'Manage website text, page section headers, SEO meta tags, and draft/publish controls.',
      path: '/dashboard/admin/site-manager',
      icon: Layers,
      color: '#3B82F6',
      bg: 'rgba(59, 130, 246, 0.15)',
      badge: 'CMS Editor',
    },
    {
      title: 'About Us Management',
      category: 'AI Voice & Brand',
      description: 'Manage PAVY Receptionist display image, AI voice LLM/TTS/STT models, and contact information.',
      path: '/dashboard/admin/about-us',
      icon: Bot,
      color: '#F59E0B',
      bg: 'rgba(245, 158, 11, 0.12)',
      badge: 'AI Receptionist',
    },
    {
      title: 'User Management',
      category: 'Access Control',
      description: 'Manage platform admin users, student accounts, site roles, and access credentials.',
      path: '/dashboard/admin/users',
      icon: Users,
      color: '#3B82F6',
      bg: 'rgba(59, 130, 246, 0.12)',
      badge: 'Users & Roles',
    },
    {
      title: 'Batch Configuration',
      category: 'Academic Cohorts',
      description: 'Create and configure active course batches, seat limits, drive folders, and enrollment dates.',
      path: '/dashboard/admin/batches',
      icon: Settings,
      color: '#10B981',
      bg: 'rgba(16, 185, 129, 0.12)',
      badge: 'Cohorts',
    },
    {
      title: 'Class Scheduler',
      category: 'Live Classes',
      description: 'Schedule live video lectures, Zoom links, timings, and student class calendars.',
      path: '/dashboard/admin/scheduler',
      icon: Calendar,
      color: '#8B5CF6',
      bg: 'rgba(139, 92, 246, 0.12)',
      badge: 'Timetable',
    },
    {
      title: 'Upcoming Batches',
      category: 'Announcements',
      description: 'Publish and manage upcoming webinar dates, demo classes, and batch start schedules.',
      path: '/dashboard/admin/upcoming',
      icon: Sparkles,
      color: '#EC4899',
      bg: 'rgba(236, 72, 153, 0.12)',
      badge: 'Webinars',
    },
    {
      title: 'Corporate Programs',
      category: 'Enterprise Training',
      description: 'Configure corporate AI upskilling, bulk employee enrollments, and custom AI consulting.',
      path: '/dashboard/admin/corporate',
      icon: Briefcase,
      color: '#6366F1',
      bg: 'rgba(99, 102, 241, 0.12)',
      badge: 'B2B Corporate',
    },
    {
      title: 'Internship Programs',
      category: '36-Week Programs',
      description: 'Manage guaranteed placement internship tracks (Data, GenAI, Agentic AI, Database).',
      path: '/dashboard/admin/internships',
      icon: GraduationCap,
      color: '#14B8A6',
      bg: 'rgba(20, 184, 166, 0.12)',
      badge: 'Internships',
    },
    {
      title: 'Study Materials',
      category: 'Curriculum Content',
      description: 'Upload class notes, lecture recordings, assignments, quizzes, and Drive materials.',
      path: '/dashboard/admin/materials',
      icon: BookOpen,
      color: '#F97316',
      bg: 'rgba(249, 115, 22, 0.12)',
      badge: 'Content',
    },
    {
      title: 'Certifications',
      category: 'Exam Vouchers',
      description: 'Manage official certification exam vouchers (Azure, AWS, GCP, Cisco, CompTIA).',
      path: '/dashboard/admin/certifications',
      icon: Award,
      color: '#EAB308',
      bg: 'rgba(234, 179, 8, 0.12)',
      badge: 'Vouchers',
    },
    {
      title: 'Cert Inquiries',
      category: 'Student Leads',
      description: 'Track and respond to student certification inquiries, voucher requests, and messages.',
      path: '/dashboard/admin/cert-inquiries',
      icon: FileText,
      color: '#06B6D4',
      bg: 'rgba(6, 182, 212, 0.12)',
      badge: 'Inquiries',
    },
    {
      title: 'Site Assets Manager',
      category: 'Media Management',
      description: 'Manage section photos, tile videos, course illustrations, and homepage media assets.',
      path: '/dashboard/admin/site-assets',
      icon: ImageIcon,
      color: '#A855F7',
      bg: 'rgba(168, 85, 247, 0.12)',
      badge: 'Media Assets',
    },
    {
      title: 'Theme Assets',
      category: 'Platform Design',
      description: 'Manage platform theme presets, color palettes, background gradients, and UI branding.',
      path: '/dashboard/admin/theme-assets',
      icon: Layers,
      color: '#38BDF8',
      bg: 'rgba(56, 189, 248, 0.12)',
      badge: 'Theme & Styling',
    },
    {
      title: 'Menu Editor',
      category: 'Navigation',
      description: 'Edit public website menu items, header navigation links, and dropdown structures.',
      path: '/dashboard/admin/menu',
      icon: Menu,
      color: '#EF4444',
      bg: 'rgba(239, 68, 68, 0.12)',
      badge: 'Navbar Link',
    },
    {
      title: 'AI Config & Models',
      category: 'LLM Engine',
      description: 'Configure Gemini models, I-Assist routing, AI voice settings, and fallback triggers.',
      path: '/dashboard/admin/ai-config',
      icon: Cpu,
      color: '#F43F5E',
      bg: 'rgba(244, 63, 94, 0.12)',
      badge: 'AI Routing',
    },
    {
      title: 'Pricing Manager',
      category: 'Financial Tier',
      description: 'Manage course pricing, discount packages, promotional vouchers, and payment tiers.',
      path: '/dashboard/admin/pricing',
      icon: Tag,
      color: '#84CC16',
      bg: 'rgba(132, 204, 22, 0.12)',
      badge: 'Pricing Plans',
    },
    {
      title: 'Hero Banners',
      category: 'Promotional',
      description: 'Create and activate home page hero banners, promotional sliders, and CTA links.',
      path: '/dashboard/admin/banners',
      icon: Megaphone,
      color: '#FB923C',
      bg: 'rgba(251, 146, 60, 0.12)',
      badge: 'Banners',
    },
    {
      title: 'Resume Templates',
      category: 'AI Tools Store',
      description: 'Manage HTML/CSS templates and design layouts for the AI Resume Builder tool.',
      path: '/dashboard/admin/templates',
      icon: FileText,
      color: '#22D3EE',
      bg: 'rgba(34, 211, 238, 0.12)',
      badge: 'Templates',
    },
    {
      title: 'Audit Logs',
      category: 'Security & Trail',
      description: 'Inspect system audit trails, admin operational logs, IP tracking, and change histories.',
      path: '/dashboard/admin/logs',
      icon: ShieldCheck,
      color: '#4ADE80',
      bg: 'rgba(74, 222, 128, 0.12)',
      badge: 'Audit Trail',
    },
  ];

  return (
    <div className="space-y-8 p-6 sm:p-8 text-strong max-w-7xl mx-auto">
      {/* Welcome Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-line pb-6">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-brand-orange/30 bg-brand-orange/10 px-3.5 py-1 text-xs font-bold text-brand-orange mb-2">
            <ShieldCheck size={14} />
            <span>NXTGEN ADMIN CONTROL CENTER</span>
          </div>
          <h1 className="font-display text-3xl font-extrabold text-white tracking-tight">Admin Executive Dashboard</h1>
          <p className="text-sm text-text-muted mt-1">
            Access all management modules, platform configurations, user metrics, and AI services from one place.
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-line bg-bg-card p-5 backdrop-blur-xl shadow-lg hover:border-brand-orange/30 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-text-muted uppercase tracking-wider">Total Users</span>
            <div className="p-2 rounded-xl bg-brand-orange/10 text-brand-orange">
              <Users className="h-5 w-5" />
            </div>
          </div>
          <p className="mt-3 font-display text-3xl font-extrabold text-white">{loading ? '...' : stats.totalUsers}</p>
        </div>

        <div className="rounded-2xl border border-line bg-bg-card p-5 backdrop-blur-xl shadow-lg hover:border-brand-orange/30 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-text-muted uppercase tracking-wider">Active Students</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
              <GraduationCap className="h-5 w-5" />
            </div>
          </div>
          <p className="mt-3 font-display text-3xl font-extrabold text-white">{loading ? '...' : stats.totalStudents}</p>
        </div>

        <div className="rounded-2xl border border-line bg-bg-card p-5 backdrop-blur-xl shadow-lg hover:border-brand-orange/30 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-text-muted uppercase tracking-wider">Active Cohorts</span>
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400">
              <Layers className="h-5 w-5" />
            </div>
          </div>
          <p className="mt-3 font-display text-3xl font-extrabold text-white">{loading ? '...' : stats.totalBatches}</p>
        </div>

        <div className="rounded-2xl border border-line bg-bg-card p-5 backdrop-blur-xl shadow-lg hover:border-brand-orange/30 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-text-muted uppercase tracking-wider">New Inquiries</span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
              <MessageSquare className="h-5 w-5" />
            </div>
          </div>
          <p className="mt-3 font-display text-3xl font-extrabold text-white">{loading ? '...' : stats.newCertInquiries}</p>
        </div>
      </div>

      {/* ─── DASHBOARDS GRID (TILES FORMAT) ─── */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-xl font-bold text-white">Management Modules & Dashboards</h2>
          <span className="text-xs text-text-muted">Select any dashboard tile to manage</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {dashboardTiles.map((tile) => {
            const Icon = tile.icon;
            return (
              <Link
                key={tile.title}
                to={tile.path}
                className="group relative flex flex-col justify-between rounded-2xl border border-white/[0.1] bg-bg-card p-5 transition-all duration-300 hover:-translate-y-1 hover:border-white/30 hover:shadow-xl hover:shadow-brand-orange/10 backdrop-blur-xl overflow-hidden"
              >
                {/* Top glow hover accent */}
                <div
                  className="absolute -top-12 -right-12 h-24 w-24 rounded-full blur-2xl transition-opacity opacity-20 group-hover:opacity-40"
                  style={{ backgroundColor: tile.color }}
                />

                <div className="space-y-4 relative z-10">
                  {/* Top Bar: Icon + Badge */}
                  <div className="flex items-center justify-between">
                    <div
                      className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/[0.1] transition-transform group-hover:scale-110"
                      style={{ backgroundColor: tile.bg, color: tile.color }}
                    >
                      <Icon size={22} />
                    </div>
                    <span
                      className="rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider"
                      style={{ borderColor: `${tile.color}40`, color: tile.color, backgroundColor: `${tile.color}15` }}
                    >
                      {tile.badge}
                    </span>
                  </div>

                  {/* Title & Description */}
                  <div>
                    <h3 className="text-sm font-bold text-white group-hover:text-brand-orange transition-colors">
                      {tile.title}
                    </h3>
                    <p className="text-xs text-text-muted mt-1.5 line-clamp-2 leading-relaxed">
                      {tile.description}
                    </p>
                  </div>
                </div>

                {/* Bottom CTA */}
                <div className="mt-5 pt-3 border-t border-white/[0.08] flex items-center justify-between text-xs font-semibold text-text-muted group-hover:text-white transition-colors relative z-10">
                  <span>Enter Dashboard</span>
                  <ArrowRight size={14} className="transform transition-transform group-hover:translate-x-1 group-hover:text-brand-orange" />
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* System Activity & Platform Status */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3 pt-4">
        <div className="lg:col-span-2 rounded-2xl border border-line bg-bg-surface p-6">
          <div className="flex items-center justify-between border-b border-line pb-4">
            <h3 className="font-display text-lg font-bold text-white">Recent Audit Activity</h3>
            <Activity size={18} className="text-brand-orange" />
          </div>

          <div className="mt-4 space-y-3">
            {recentLogs.length === 0 ? (
              <p className="text-sm text-text-muted py-4">No recent activity logs.</p>
            ) : (
              recentLogs.map((log) => (
                <div key={log.id} className="flex items-center justify-between rounded-xl border border-line-subtle bg-bg-card p-3.5 text-xs">
                  <div>
                    <span className="font-semibold text-white">{log.action}</span>
                    <span className="ml-2 text-text-muted">{log.user?.email || 'System Admin'}</span>
                  </div>
                  <span className="text-text-muted">{new Date(log.timestamp).toLocaleTimeString()}</span>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-line bg-bg-surface p-6">
          <div className="flex items-center gap-2 border-b border-line pb-4">
            <ShieldCheck size={20} className="text-emerald-400" />
            <h3 className="font-display text-lg font-bold text-white">Platform Health</h3>
          </div>

          <div className="mt-6 space-y-4 text-xs">
            <div className="flex justify-between items-center">
              <span className="text-text-muted">Database Engine</span>
              <span className="font-semibold text-emerald-400">Prisma / SQLite (Active)</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-text-muted">REST API Backend</span>
              <span className="font-semibold text-emerald-400">Express 5 (Port 3000)</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-text-muted">Primary AI Model</span>
              <span className="font-semibold text-brand-orange">gemini-2.5-flash</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-text-muted">Live Voice Agent</span>
              <span className="font-semibold text-brand-orange">PAVY AI Receptionist</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
