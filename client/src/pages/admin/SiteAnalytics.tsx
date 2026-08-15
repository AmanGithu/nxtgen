import { useState, useEffect } from 'react';
import {
  TrendingUp,
  PieChart,
  Users,
  Eye,
  MousePointer,
  CheckCircle2,
  BookOpen,
  Briefcase,
  Award,
  Wrench,
  Headphones,
  Building2,
  PhoneCall,
  RefreshCw,
} from 'lucide-react';

interface AnalyticsData {
  totals: {
    totalUsers: number;
    totalLeads: number;
    totalBatches: number;
    totalEnrollments: number;
  };
  dailyLeads: { date: string; count: number }[];
  leadsByCta: { ctaType: string; count: number }[];
  leadsByStatus: { status: string; count: number }[];
  userRoleCounts: { role: string; count: number }[];
  userStatusCounts: { status: string; count: number }[];
  topPages: { page: string; visits: number; label: string }[];
  topCtas: { name: string; clicks: number }[];
}

export default function SiteAnalytics() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('accessToken');
      const res = await fetch('/api/analytics/summary', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const resData = await res.json();
      if (resData.success) {
        setData(resData);
      }
    } catch (err) {
      console.error('Failed to fetch analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !data) {
    return (
      <div className="space-y-4 p-8 text-center">
        <RefreshCw size={24} className="animate-spin mx-auto text-[#D4AF37]" />
        <p className="text-sm font-semibold text-text-muted">Loading real-time site analytics…</p>
      </div>
    );
  }

  const maxDaily = Math.max(...data.dailyLeads.map((d) => d.count), 1);

  return (
    <div className="space-y-8">
      {/* Header Bar */}
      <div className="flex items-center justify-between border-b border-white/[0.08] pb-4">
        <div>
          <h1 className="text-2xl font-extrabold font-display text-white">Site Analytics & Overview</h1>
          <p className="text-xs text-text-muted mt-1">
            Real-time traffic metrics, daily lead generation, CTA conversion distribution, and top pages.
          </p>
        </div>
        <button
          onClick={fetchAnalytics}
          className="flex items-center gap-2 rounded-xl bg-white/[0.06] border border-white/[0.1] px-4 py-2 text-xs font-bold text-white hover:bg-white/[0.12] transition-colors"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          <span>Refresh Data</span>
        </button>
      </div>

      {/* Overview Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-white/[0.08] bg-bg-card p-5 space-y-2">
          <span className="text-xs font-bold text-text-muted uppercase">Total Users</span>
          <p className="text-3xl font-black text-white">{data.totals.totalUsers}</p>
          <span className="text-[11px] text-emerald-400 font-semibold">Active Registered Accounts</span>
        </div>

        <div className="rounded-2xl border border-[#D4AF37]/30 bg-gradient-to-br from-[#D4AF37]/10 to-transparent p-5 space-y-2">
          <span className="text-xs font-bold text-[#D4AF37] uppercase">Total Leads</span>
          <p className="text-3xl font-black text-white">{data.totals.totalLeads}</p>
          <span className="text-[11px] text-amber-300 font-semibold">Captured via All CTAs</span>
        </div>

        <div className="rounded-2xl border border-white/[0.08] bg-bg-card p-5 space-y-2">
          <span className="text-xs font-bold text-text-muted uppercase">Active Batches</span>
          <p className="text-3xl font-black text-white">{data.totals.totalBatches}</p>
          <span className="text-[11px] text-blue-400 font-semibold">Live Training Cohorts</span>
        </div>

        <div className="rounded-2xl border border-white/[0.08] bg-bg-card p-5 space-y-2">
          <span className="text-xs font-bold text-text-muted uppercase">Batch Enrollments</span>
          <p className="text-3xl font-black text-white">{data.totals.totalEnrollments}</p>
          <span className="text-[11px] text-purple-400 font-semibold">Enrolled Students</span>
        </div>
      </div>

      {/* Daily Leads Bar Chart */}
      <div className="rounded-2xl border border-white/[0.08] bg-bg-card p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
          <div className="flex items-center gap-2">
            <TrendingUp size={18} className="text-[#D4AF37]" />
            <h2 className="text-base font-bold text-white">Daily Lead Generation (Last 7 Days)</h2>
          </div>
        </div>

        <div className="flex items-end justify-between gap-3 h-44 pt-6 px-4">
          {data.dailyLeads.map((item, idx) => {
            const pct = Math.round((item.count / maxDaily) * 100);
            return (
              <div key={idx} className="flex-1 flex flex-col items-center gap-2 group">
                <span className="text-xs font-bold text-[#D4AF37] opacity-0 group-hover:opacity-100 transition-opacity">
                  {item.count}
                </span>
                <div
                  style={{ height: `${Math.max(pct, 12)}%` }}
                  className="w-full max-w-[48px] rounded-t-xl bg-gradient-to-t from-brand-orange to-[#D4AF37] transition-all group-hover:brightness-125 shadow-lg"
                />
                <span className="text-[11px] font-semibold text-text-muted truncate">
                  {new Date(item.date).toLocaleDateString([], { weekday: 'short', month: 'numeric', day: 'numeric' })}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Grid: Pie Breakdown Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Leads by CTA Source */}
        <div className="rounded-2xl border border-white/[0.08] bg-bg-card p-6 space-y-4">
          <div className="flex items-center gap-2 border-b border-white/[0.06] pb-3">
            <PieChart size={18} className="text-brand-orange" />
            <h3 className="text-base font-bold text-white">Leads Distribution by CTA Source</h3>
          </div>

          <div className="space-y-3">
            {data.leadsByCta.length === 0 ? (
              <p className="text-xs text-text-muted">No lead entries captured yet.</p>
            ) : (
              data.leadsByCta.map((item, idx) => (
                <div key={idx} className="space-y-1">
                  <div className="flex justify-between text-xs font-bold text-white">
                    <span>{item.ctaType}</span>
                    <span className="text-[#D4AF37]">{item.count} leads</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-white/[0.06] overflow-hidden">
                    <div
                      style={{ width: `${Math.min((item.count / (data.totals.totalLeads || 1)) * 100, 100)}%` }}
                      className="h-full bg-gradient-to-r from-[#D4AF37] to-brand-orange rounded-full"
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Top Visited Pages & CTAs */}
        <div className="rounded-2xl border border-white/[0.08] bg-bg-card p-6 space-y-4">
          <div className="flex items-center gap-2 border-b border-white/[0.06] pb-3">
            <Eye size={18} className="text-amber-400" />
            <h3 className="text-base font-bold text-white">Top 7 Visited Pages</h3>
          </div>

          <div className="space-y-2.5">
            {data.topPages.map((page, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-2.5 rounded-xl border border-white/[0.04] bg-bg-surface/50 text-xs"
              >
                <div>
                  <span className="font-bold text-white">{page.label}</span>
                  <span className="text-[11px] text-text-muted block font-mono">{page.page}</span>
                </div>
                <span className="font-bold text-amber-300 bg-amber-400/10 px-2.5 py-1 rounded-full border border-amber-400/20">
                  {page.visits} views
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
