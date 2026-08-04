import { useState, useEffect } from 'react';
import { Users, GraduationCap, Layers, MessageSquare, Activity, ShieldCheck } from 'lucide-react';
import api from '../../services/api';

const AdminOverview = () => {
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

  return (
    <div className="space-y-8 p-6 text-strong">
      <div>
        <h1 className="font-display text-3xl font-bold">Admin Control Center</h1>
        <p className="text-sm text-text-muted mt-1">NxtGen Academy system health, user metrics, and platform logs.</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-line bg-bg-card p-6">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-text-muted uppercase">Total Users</span>
            <Users className="h-5 w-5 text-brand-orange" />
          </div>
          <p className="mt-4 font-display text-3xl font-bold">{loading ? '...' : stats.totalUsers}</p>
        </div>

        <div className="rounded-xl border border-line bg-bg-card p-6">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-text-muted uppercase">Active Students</span>
            <GraduationCap className="h-5 w-5 text-brand-orange" />
          </div>
          <p className="mt-4 font-display text-3xl font-bold">{loading ? '...' : stats.totalStudents}</p>
        </div>

        <div className="rounded-xl border border-line bg-bg-card p-6">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-text-muted uppercase">Active Cohorts</span>
            <Layers className="h-5 w-5 text-brand-orange" />
          </div>
          <p className="mt-4 font-display text-3xl font-bold">{loading ? '...' : stats.totalBatches}</p>
        </div>

        <div className="rounded-xl border border-line bg-bg-card p-6">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-text-muted uppercase">New Inquiries</span>
            <MessageSquare className="h-5 w-5 text-brand-orange" />
          </div>
          <p className="mt-4 font-display text-3xl font-bold">{loading ? '...' : stats.newCertInquiries}</p>
        </div>
      </div>

      {/* System Status & Recent Logs */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2 rounded-xl border border-line bg-bg-surface p-6">
          <div className="flex items-center justify-between border-b border-line pb-4">
            <h3 className="font-display text-lg font-bold">Recent System Activity</h3>
            <Activity size={18} className="text-brand-orange" />
          </div>

          <div className="mt-4 space-y-3">
            {recentLogs.length === 0 ? (
              <p className="text-sm text-text-muted py-4">No recent activity logs.</p>
            ) : (
              recentLogs.map((log) => (
                <div key={log.id} className="flex items-center justify-between rounded-lg border border-line-subtle bg-bg-card p-3 text-xs">
                  <div>
                    <span className="font-semibold text-strong">{log.action}</span>
                    <span className="ml-2 text-text-muted">{log.user?.email || 'System'}</span>
                  </div>
                  <span className="text-text-muted">{new Date(log.timestamp).toLocaleTimeString()}</span>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="rounded-xl border border-line bg-bg-surface p-6">
          <div className="flex items-center gap-2 border-b border-line pb-4">
            <ShieldCheck size={20} className="text-green-400" />
            <h3 className="font-display text-lg font-bold">Platform Status</h3>
          </div>

          <div className="mt-6 space-y-4 text-xs">
            <div className="flex justify-between items-center">
              <span className="text-text-muted">Database Engine</span>
              <span className="font-semibold text-green-400">MariaDB 3306 (Connected)</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-text-muted">REST API Backend</span>
              <span className="font-semibold text-green-400">Express 5 (Port 3001)</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-text-muted">Gemini Primary Model</span>
              <span className="font-semibold text-brand-orange">gemini-1.5-flash</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-text-muted">Gemini Voice Model</span>
              <span className="font-semibold text-brand-orange">gemini-2.0-flash-exp</span>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
};

export default AdminOverview;
