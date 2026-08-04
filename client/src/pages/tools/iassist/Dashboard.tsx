import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Monitor, Clock, MessageSquare, ChevronRight, Download, Headphones,
  Activity, Zap, BarChart3, TrendingUp, AlertTriangle, RefreshCw,
} from 'lucide-react';
import { iAssistAPI } from '../../../services/api';

const CATEGORY_COLORS: Record<string, string> = {
  BEHAVIORAL: '#7F77DD',
  TECHNICAL: '#1D9E75',
  SYSTEM_DESIGN: '#D85A30',
  GENERAL: '#888780',
};

const CATEGORY_LABELS: Record<string, string> = {
  BEHAVIORAL: 'Behavioral',
  TECHNICAL: 'Technical',
  SYSTEM_DESIGN: 'System Design',
  GENERAL: 'General',
};

const CATEGORY_BADGE_STYLES: Record<string, string> = {
  BEHAVIORAL: 'bg-cat-behavioral-bg text-cat-behavioral',
  TECHNICAL: 'bg-cat-technical-bg text-cat-technical',
  SYSTEM_DESIGN: 'bg-cat-design-bg text-cat-design',
  GENERAL: 'bg-elevate text-cat-general border border-line',
};

type Period = 'all' | 'week' | 'month';

interface SessionAssistant {
  id: string;
  name: string;
  category: string;
}

interface Session {
  id: string;
  status: string;
  platform: string;
  startedAt: string;
  endedAt: string | null;
  durationSeconds: number | null;
  questionsAnswered: number;
  tokensUsed: number;
  assistant: SessionAssistant | null;
}

interface Analytics {
  totalSessions: number;
  totalQuestions: number;
  totalTokens: number;
  totalDurationSeconds: number;
  avgDurationSeconds: number;
  avgQuestions: number;
  categoryBreakdown: Record<string, { sessions: number; questions: number; durationSeconds: number }>;
  weeklyActivity: Array<{ date: string; sessions: number; questions: number; durationSeconds: number }>;
}

function formatDuration(seconds: number | null): string {
  if (!seconds) return '--:--';
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

function formatDurationLong(seconds: number): string {
  if (!seconds) return '0m';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
}

function dayLabel(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { weekday: 'short' });
}

const Dashboard = () => {
  const navigate = useNavigate();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [period, setPeriod] = useState<Period>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadAnalytics = () => {
    iAssistAPI.getAnalytics().then(res => {
      if (res.data.success) setAnalytics(res.data.analytics);
    }).catch(() => {});
  };

  useEffect(() => { loadAnalytics(); }, []);

  const loadSessions = (p: Period) => {
    setLoading(true);
    setError(null);
    iAssistAPI.getSessions(p).then(res => {
      if (res.data.success) setSessions(res.data.sessions);
    }).catch(() => {
      setError('Failed to load sessions. Please try again.');
    }).finally(() => setLoading(false));
  };

  useEffect(() => { loadSessions(period); }, [period]);

  const tabs = [
    { label: 'Sessions', path: '/dashboard/student/tools/i-assist' },
    { label: 'Assistants', path: '/dashboard/student/tools/i-assist/assistants' },
    { label: 'Documents', path: '/dashboard/student/tools/i-assist/documents' },
  ];

  return (
    <div className="p-6 text-strong max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-display text-2xl font-bold">I-Assist</h1>
        <p className="text-xs text-text-muted">AI-powered interview co-pilot</p>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 border-b border-line">
        {tabs.map(tab => {
          const isActive = tab.label === 'Sessions';
          return (
            <Link
              key={tab.label}
              to={tab.path}
              className={
                isActive
                  ? 'px-4 py-2.5 text-sm font-medium text-brand-orange border-b-2 border-brand-orange -mb-px'
                  : 'px-4 py-2.5 text-sm font-medium text-text-muted hover:text-strong transition-colors'
              }
            >
              {tab.label}
            </Link>
          );
        })}
      </div>

      {/* Analytics Section */}
      {analytics && analytics.totalSessions > 0 && (
        <div className="space-y-4">
          {/* Stat cards */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatCard
              icon={Activity}
              label="Sessions"
              value={analytics.totalSessions.toString()}
              sub={`~${formatDurationLong(analytics.avgDurationSeconds)} avg`}
            />
            <StatCard
              icon={MessageSquare}
              label="Questions"
              value={analytics.totalQuestions.toLocaleString()}
              sub={`~${analytics.avgQuestions}/session`}
            />
            <StatCard
              icon={Clock}
              label="Practice Time"
              value={formatDurationLong(analytics.totalDurationSeconds)}
              sub={`${analytics.totalSessions} sessions`}
            />
            <StatCard
              icon={Zap}
              label="Tokens Used"
              value={analytics.totalTokens.toLocaleString()}
              sub="total consumption"
            />
          </div>

          {/* Weekly activity + category breakdown row */}
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-5">
            {/* Weekly activity */}
            <div className="lg:col-span-3 rounded-xl border border-line bg-bg-surface p-4">
              <div className="flex items-center gap-2 mb-3">
                <BarChart3 size={14} className="text-text-muted" />
                <span className="text-xs font-semibold text-text-muted">Last 7 days</span>
              </div>
              <WeeklyChart data={analytics.weeklyActivity} />
            </div>

            {/* Category breakdown */}
            <div className="lg:col-span-2 rounded-xl border border-line bg-bg-surface p-4">
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp size={14} className="text-text-muted" />
                <span className="text-xs font-semibold text-text-muted">By category</span>
              </div>
              <CategoryBreakdown data={analytics.categoryBreakdown} total={analytics.totalSessions} />
            </div>
          </div>
        </div>
      )}

      {/* Desktop CTA banner */}
      <div className="flex items-center gap-4 rounded-xl border border-line bg-bg-surface p-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-orange/10">
          <Monitor size={20} className="text-brand-orange" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-medium">Sessions run on the desktop app</p>
          <p className="text-xs text-text-muted">Download I-Assist Desktop to start interview sessions with real-time AI assistance.</p>
        </div>
        <button className="flex items-center gap-2 rounded-lg bg-brand-orange px-4 py-2 text-sm font-semibold text-on-brand shadow-md hover:bg-brand-orange/90 transition-colors">
          <Download size={16} />
          Download
        </button>
      </div>

      {/* Period filter */}
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold">Session history</h2>
        <div className="flex gap-1 rounded-lg bg-bg-surface p-1 border border-line">
          {(['all', 'week', 'month'] as Period[]).map(p => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={
                period === p
                  ? 'rounded-md bg-brand-orange/10 px-3 py-1 text-xs font-medium text-brand-orange'
                  : 'rounded-md px-3 py-1 text-xs font-medium text-text-muted hover:text-strong transition-colors'
              }
            >
              {p === 'all' ? 'All' : p === 'week' ? 'This week' : 'This month'}
            </button>
          ))}
        </div>
      </div>

      {/* Session list */}
      {loading ? (
        <div className="space-y-2">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="flex items-center gap-4 rounded-xl border border-line bg-bg-surface p-4 animate-pulse">
              <div className="h-2.5 w-2.5 rounded-full bg-elevate" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-40 rounded bg-elevate" />
                <div className="h-3 w-56 rounded bg-elevate" />
              </div>
              <div className="h-5 w-16 rounded-md bg-elevate" />
              <div className="hidden sm:flex items-center gap-4">
                <div className="h-4 w-12 rounded bg-elevate" />
                <div className="h-4 w-8 rounded bg-elevate" />
              </div>
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-red-500/20 bg-red-500/5 py-12 text-center">
          <AlertTriangle size={32} className="text-red-400 mb-3" />
          <p className="text-sm font-medium text-red-400">{error}</p>
          <button
            onClick={() => loadSessions(period)}
            className="mt-4 flex items-center gap-2 rounded-lg border border-line px-4 py-2 text-sm font-medium text-text-muted hover:text-strong transition-colors"
          >
            <RefreshCw size={14} /> Retry
          </button>
        </div>
      ) : sessions.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-line-strong py-16 text-center">
          <Headphones size={40} className="text-text-muted mb-3" />
          <p className="text-sm font-medium text-text-muted">No sessions yet</p>
          <p className="text-xs text-text-muted mt-1">Download the desktop app to start your first interview session.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {sessions.map(session => {
            const cat = session.assistant?.category || 'GENERAL';
            const color = CATEGORY_COLORS[cat] || CATEGORY_COLORS.GENERAL;
            return (
              <button
                key={session.id}
                onClick={() => navigate(`/dashboard/student/tools/i-assist/session/${session.id}`)}
                className="w-full flex items-center gap-4 rounded-xl border border-line bg-bg-surface p-4 hover:border-line-strong transition-colors text-left"
              >
                <div
                  className="h-2.5 w-2.5 shrink-0 rounded-full"
                  style={{ backgroundColor: color }}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {session.assistant?.name || 'Unknown Assistant'}
                  </p>
                  <p className="text-xs text-text-muted mt-0.5">
                    {formatDate(session.startedAt)}, {formatTime(session.startedAt)}
                    {session.durationSeconds != null && <> &middot; {formatDuration(session.durationSeconds)}</>}
                  </p>
                </div>
                <span className={`shrink-0 rounded-md px-2 py-0.5 text-[10px] font-semibold ${CATEGORY_BADGE_STYLES[cat] || CATEGORY_BADGE_STYLES.GENERAL}`}>
                  {CATEGORY_LABELS[cat] || cat}
                </span>
                <div className="hidden sm:flex items-center gap-4 shrink-0 text-text-muted">
                  <span className="flex items-center gap-1 text-xs tabular-nums">
                    <Clock size={13} />
                    {formatDuration(session.durationSeconds)}
                  </span>
                  <span className="flex items-center gap-1 text-xs tabular-nums">
                    <MessageSquare size={13} />
                    {session.questionsAnswered}
                  </span>
                </div>
                <ChevronRight size={16} className="shrink-0 text-text-muted" />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

// ─── Sub-components ───

const StatCard = ({ icon: Icon, label, value, sub }: { icon: any; label: string; value: string; sub: string }) => (
  <div className="rounded-xl border border-line bg-bg-surface p-4">
    <div className="flex items-center gap-2 text-text-muted mb-1">
      <Icon size={14} />
      <span className="text-[11px] font-medium">{label}</span>
    </div>
    <p className="text-2xl font-bold tabular-nums">{value}</p>
    <p className="text-[11px] text-text-muted/60 mt-0.5">{sub}</p>
  </div>
);

const WeeklyChart = ({ data }: { data: Analytics['weeklyActivity'] }) => {
  const maxSessions = Math.max(...data.map(d => d.sessions), 1);

  return (
    <div className="flex items-end gap-2 h-24">
      {data.map((day) => {
        const height = Math.max((day.sessions / maxSessions) * 100, 4);
        const hasData = day.sessions > 0;
        return (
          <div key={day.date} className="flex-1 flex flex-col items-center gap-1.5">
            <div className="w-full flex flex-col items-center justify-end h-[72px]">
              {hasData && (
                <span className="text-[10px] tabular-nums text-text-muted mb-1">{day.sessions}</span>
              )}
              <div
                className="w-full max-w-[32px] rounded-t-md transition-all"
                style={{
                  height: `${height}%`,
                  backgroundColor: hasData ? '#f5820b' : 'rgba(255,255,255,0.06)',
                  minHeight: '3px',
                }}
              />
            </div>
            <span className="text-[10px] text-text-muted/60">{dayLabel(day.date)}</span>
          </div>
        );
      })}
    </div>
  );
};

const CategoryBreakdown = ({ data, total }: { data: Analytics['categoryBreakdown']; total: number }) => {
  const categories = ['BEHAVIORAL', 'TECHNICAL', 'SYSTEM_DESIGN', 'GENERAL'].filter(c => data[c]);

  if (categories.length === 0) {
    return <p className="text-xs text-text-muted/60 py-4 text-center">No category data yet</p>;
  }

  return (
    <div className="space-y-3">
      {categories.map(cat => {
        const stats = data[cat];
        const pct = total > 0 ? Math.round((stats.sessions / total) * 100) : 0;
        return (
          <div key={cat}>
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <div
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: CATEGORY_COLORS[cat] }}
                />
                <span className="text-xs font-medium">{CATEGORY_LABELS[cat]}</span>
              </div>
              <span className="text-[11px] text-text-muted tabular-nums">
                {stats.sessions} ({pct}%)
              </span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-elevate overflow-hidden">
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${pct}%`,
                  backgroundColor: CATEGORY_COLORS[cat],
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default Dashboard;
