import { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Clock, MessageSquare, Coins, Monitor, Mic, Bot, AlertTriangle, RefreshCw } from 'lucide-react';
import { iAssistAPI } from '../../../services/api';

const CATEGORY_BADGE_STYLES: Record<string, string> = {
  BEHAVIORAL: 'bg-cat-behavioral-bg text-cat-behavioral',
  TECHNICAL: 'bg-cat-technical-bg text-cat-technical',
  SYSTEM_DESIGN: 'bg-cat-design-bg text-cat-design',
  GENERAL: 'bg-elevate text-cat-general border border-line',
};

const CATEGORY_LABELS: Record<string, string> = {
  BEHAVIORAL: 'Behavioral',
  TECHNICAL: 'Technical',
  SYSTEM_DESIGN: 'System Design',
  GENERAL: 'General',
};

interface Transcript {
  id: string;
  speaker: string;
  text: string;
  isQuestion: boolean;
  response: string | null;
  tokens: number;
  timestamp: number;
}

interface SessionData {
  id: string;
  status: string;
  platform: string;
  startedAt: string;
  endedAt: string | null;
  durationSeconds: number | null;
  questionsAnswered: number;
  tokensUsed: number;
  assistant: { id: string; name: string; category: string } | null;
  transcripts: Transcript[];
}

function formatDuration(seconds: number | null): string {
  if (!seconds) return '--:--';
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

function formatTimestamp(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

function formatDateTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })
    + ' at ' + d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
}

function renderMarkdownBold(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i} className="text-strong font-semibold">{part.slice(2, -2)}</strong>;
    }
    return <span key={i}>{part}</span>;
  });
}

const SessionDetailSkeleton = () => (
  <div className="p-6 text-strong max-w-5xl mx-auto space-y-6 animate-pulse">
    <div className="h-4 w-32 rounded bg-elevate" />
    <div className="space-y-2">
      <div className="flex items-center gap-3">
        <div className="h-7 w-48 rounded bg-elevate" />
        <div className="h-5 w-20 rounded-md bg-elevate" />
      </div>
      <div className="h-3 w-64 rounded bg-elevate" />
    </div>
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="rounded-xl border border-line bg-bg-surface p-4 space-y-2">
          <div className="h-4 w-4 mx-auto rounded bg-elevate" />
          <div className="h-6 w-12 mx-auto rounded bg-elevate" />
          <div className="h-3 w-16 mx-auto rounded bg-elevate" />
        </div>
      ))}
    </div>
    <div className="h-4 w-24 rounded bg-elevate" />
    <div className="space-y-4">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="flex gap-3">
          <div className="h-7 w-7 rounded-full bg-elevate" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-full max-w-md rounded bg-elevate" />
            <div className="h-3 w-12 rounded bg-elevate" />
          </div>
        </div>
      ))}
    </div>
  </div>
);

const SessionDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [session, setSession] = useState<SessionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadSession = () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    iAssistAPI.getSession(id).then(res => {
      if (res.data.success) setSession(res.data.session);
    }).catch(() => {
      setError('Failed to load session details.');
    }).finally(() => setLoading(false));
  };

  useEffect(() => { loadSession(); }, [id]);

  if (loading) return <SessionDetailSkeleton />;

  if (error) {
    return (
      <div className="p-6 text-strong max-w-5xl mx-auto">
        <Link to="/dashboard/student/tools/i-assist" className="inline-flex items-center gap-1 text-sm text-text-muted hover:text-strong transition-colors mb-6">
          <ArrowLeft size={16} /> Back to sessions
        </Link>
        <div className="flex flex-col items-center justify-center rounded-xl border border-red-500/20 bg-red-500/5 py-12 text-center">
          <AlertTriangle size={32} className="text-red-400 mb-3" />
          <p className="text-sm font-medium text-red-400">{error}</p>
          <button
            onClick={loadSession}
            className="mt-4 flex items-center gap-2 rounded-lg border border-line px-4 py-2 text-sm font-medium text-text-muted hover:text-strong transition-colors"
          >
            <RefreshCw size={14} /> Retry
          </button>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="p-6 text-strong max-w-5xl mx-auto">
        <Link to="/dashboard/student/tools/i-assist" className="inline-flex items-center gap-1 text-sm text-text-muted hover:text-strong transition-colors mb-6">
          <ArrowLeft size={16} /> Back to sessions
        </Link>
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-line-strong py-12 text-center">
          <MessageSquare size={32} className="text-text-muted mb-3" />
          <p className="text-sm font-medium text-text-muted">Session not found</p>
          <p className="text-xs text-text-muted mt-1">This session may have been deleted or doesn't exist.</p>
        </div>
      </div>
    );
  }

  const cat = session.assistant?.category || 'GENERAL';

  const stats = [
    { label: 'Duration', value: formatDuration(session.durationSeconds), icon: Clock },
    { label: 'Questions', value: String(session.questionsAnswered), icon: MessageSquare },
    { label: 'Tokens used', value: session.tokensUsed.toLocaleString(), icon: Coins },
    { label: 'Platform', value: session.platform.charAt(0).toUpperCase() + session.platform.slice(1), icon: Monitor },
  ];

  return (
    <div className="p-6 text-strong max-w-5xl mx-auto space-y-6">
      {/* Back link */}
      <Link to="/dashboard/student/tools/i-assist" className="inline-flex items-center gap-1 text-sm text-text-muted hover:text-strong transition-colors">
        <ArrowLeft size={16} /> Back to sessions
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="font-display text-2xl font-bold">
              {session.assistant?.name || 'Interview Session'}
            </h1>
            <span className={`rounded-md px-2 py-0.5 text-[10px] font-semibold ${CATEGORY_BADGE_STYLES[cat] || CATEGORY_BADGE_STYLES.GENERAL}`}>
              {CATEGORY_LABELS[cat] || cat}
            </span>
          </div>
          <p className="text-xs text-text-muted mt-1">
            {formatDateTime(session.startedAt)}
            {session.durationSeconds != null && <> &middot; {formatDuration(session.durationSeconds)}</>}
          </p>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {stats.map(stat => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="rounded-xl border border-line bg-bg-surface p-4 text-center">
              <Icon size={16} className="mx-auto text-text-muted mb-2" />
              <p className="text-lg font-bold tabular-nums">{stat.value}</p>
              <p className="text-[10px] text-text-muted uppercase tracking-wider mt-0.5">{stat.label}</p>
            </div>
          );
        })}
      </div>

      {/* Transcript */}
      <div>
        <h2 className="text-sm font-semibold mb-4">Transcript</h2>

        {session.transcripts.length === 0 ? (
          <div className="rounded-xl border border-dashed border-line-strong py-12 text-center">
            <p className="text-sm text-text-muted">No transcript entries recorded.</p>
          </div>
        ) : (
          /*
           * Every stored entry is rendered, with its answer when one exists.
           * `isQuestion` is a per-utterance model classification, not a structural
           * flag — filtering the list by it dropped whole exchanges from the view
           * even though their answers were saved, and how much survived varied
           * session to session with the model's own judgement.
           */
          <div className="space-y-0 divide-y divide-line">
            {session.transcripts.map(entry => (
              <div key={entry.id} className="py-5 first:pt-0">
                <div className="flex gap-3">
                  <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full mt-0.5 ${
                    entry.speaker === 'user' ? 'bg-amber-500/10' : 'bg-emerald-500/10'
                  }`}>
                    {entry.speaker === 'user'
                      ? <Mic size={14} className="text-amber-400" />
                      : <Bot size={14} className="text-emerald-400" />
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-strong">{entry.text}</p>
                    <p className="text-[10px] text-text-muted tabular-nums mt-1">{formatTimestamp(entry.timestamp)}</p>
                  </div>
                </div>

                {entry.response && (
                  <div className="flex gap-3 mt-3 ml-10">
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-500/10 mt-0.5">
                      <Bot size={14} className="text-emerald-400" />
                    </div>
                    <div className="flex-1 min-w-0 rounded-lg border border-line-subtle bg-bg-card p-3">
                      <div className="text-sm text-text-muted leading-relaxed whitespace-pre-line">
                        {entry.response.split('\n').map((line, i) => (
                          <span key={i}>
                            {renderMarkdownBold(line)}
                            {i < entry.response!.split('\n').length - 1 && '\n'}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SessionDetail;
