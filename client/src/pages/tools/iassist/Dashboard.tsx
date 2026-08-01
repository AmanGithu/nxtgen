import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Monitor, Clock, MessageSquare, ChevronRight, Download, Headphones } from 'lucide-react';
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
  BEHAVIORAL: 'bg-[#26215C] text-[#7F77DD]',
  TECHNICAL: 'bg-[#04342C] text-[#1D9E75]',
  SYSTEM_DESIGN: 'bg-[#4A1B0C] text-[#D85A30]',
  GENERAL: 'bg-white/[0.06] text-[#888780] border border-white/[0.08]',
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

function formatDuration(seconds: number | null): string {
  if (!seconds) return '--:--';
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

const Dashboard = () => {
  const navigate = useNavigate();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [period, setPeriod] = useState<Period>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    iAssistAPI.getSessions(period).then(res => {
      if (!cancelled && res.data.success) {
        setSessions(res.data.sessions);
      }
    }).catch(() => {}).finally(() => {
      if (!cancelled) setLoading(false);
    });
    return () => { cancelled = true; };
  }, [period]);

  const tabs = [
    { label: 'Sessions', path: '/dashboard/student/tools/i-assist' },
    { label: 'Assistants', path: '/dashboard/student/tools/i-assist/assistants' },
    { label: 'Documents', path: '/dashboard/student/tools/i-assist/documents' },
  ];

  return (
    <div className="p-6 text-white max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-display text-2xl font-bold">I-Assist</h1>
        <p className="text-xs text-text-muted">AI-powered interview co-pilot</p>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 border-b border-white/[0.08]">
        {tabs.map(tab => {
          const isActive = tab.label === 'Sessions';
          return (
            <Link
              key={tab.label}
              to={tab.path}
              className={
                isActive
                  ? 'px-4 py-2.5 text-sm font-medium text-brand-orange border-b-2 border-brand-orange -mb-px'
                  : 'px-4 py-2.5 text-sm font-medium text-text-muted hover:text-white transition-colors'
              }
            >
              {tab.label}
            </Link>
          );
        })}
      </div>

      {/* Desktop CTA banner */}
      <div className="flex items-center gap-4 rounded-xl border border-white/[0.08] bg-bg-surface p-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-orange/10">
          <Monitor size={20} className="text-brand-orange" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-medium">Sessions run on the desktop app</p>
          <p className="text-xs text-text-muted">Download I-Assist Desktop to start interview sessions with real-time AI assistance.</p>
        </div>
        <button className="flex items-center gap-2 rounded-lg bg-brand-orange px-4 py-2 text-sm font-semibold text-white shadow-md hover:bg-brand-orange/90 transition-colors">
          <Download size={16} />
          Download
        </button>
      </div>

      {/* Period filter */}
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold">Session history</h2>
        <div className="flex gap-1 rounded-lg bg-bg-surface p-1 border border-white/[0.08]">
          {(['all', 'week', 'month'] as Period[]).map(p => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={
                period === p
                  ? 'rounded-md bg-brand-orange/10 px-3 py-1 text-xs font-medium text-brand-orange'
                  : 'rounded-md px-3 py-1 text-xs font-medium text-text-muted hover:text-white transition-colors'
              }
            >
              {p === 'all' ? 'All' : p === 'week' ? 'This week' : 'This month'}
            </button>
          ))}
        </div>
      </div>

      {/* Session list */}
      {loading ? (
        <div className="flex justify-center py-16">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-brand-orange border-t-transparent" />
        </div>
      ) : sessions.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-white/[0.12] py-16 text-center">
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
                className="w-full flex items-center gap-4 rounded-xl border border-white/[0.08] bg-bg-surface p-4 hover:border-white/[0.16] transition-colors text-left"
              >
                {/* Category dot */}
                <div
                  className="h-2.5 w-2.5 shrink-0 rounded-full"
                  style={{ backgroundColor: color }}
                />

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {session.assistant?.name || 'Unknown Assistant'}
                  </p>
                  <p className="text-xs text-text-muted mt-0.5">
                    {formatDate(session.startedAt)}, {formatTime(session.startedAt)}
                    {session.durationSeconds != null && <> &middot; {formatDuration(session.durationSeconds)}</>}
                  </p>
                </div>

                {/* Category badge */}
                <span className={`shrink-0 rounded-md px-2 py-0.5 text-[10px] font-semibold ${CATEGORY_BADGE_STYLES[cat] || CATEGORY_BADGE_STYLES.GENERAL}`}>
                  {CATEGORY_LABELS[cat] || cat}
                </span>

                {/* Stats */}
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

export default Dashboard;
