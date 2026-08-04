import { useState, useEffect } from 'react';
import { Activity, BarChart3 } from 'lucide-react';
import { clsx } from 'clsx';
import { adminLogsAPI } from '../../services/api';

interface AuditLog {
  id: string;
  action: string;
  targetModel: string | null;
  targetId: string | null;
  ipAddress: string | null;
  timestamp: string;
  user: { email: string; firstName: string | null } | null;
}

interface ToolUsageSummary {
  toolName: string;
  _count: { toolName: number };
  _sum: { creditsConsumed: number | null };
}

/** Destructive actions get a red badge so they stand out when scanning. */
const actionTone = (action: string) => {
  if (action.includes('DELETED') || action.includes('DEACTIVATED')) return 'bg-red-500/10 text-red-400';
  if (action.includes('CREATED')) return 'bg-green-500/10 text-green-400';
  if (action.includes('UPDATED')) return 'bg-blue-500/10 text-blue-400';
  return 'bg-elevate text-text-muted';
};

const AuditLogs = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [toolUsage, setToolUsage] = useState<ToolUsageSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      const [logsRes, usageRes] = await Promise.allSettled([
        adminLogsAPI.getAll(),
        adminLogsAPI.getToolUsage(),
      ]);

      if (logsRes.status === 'fulfilled' && logsRes.value.data.success) {
        setLogs(logsRes.value.data.logs);
      } else if (logsRes.status === 'rejected') {
        console.error('Failed to fetch audit logs:', logsRes.reason);
      }

      if (usageRes.status === 'fulfilled' && usageRes.value.data.success) {
        setToolUsage(usageRes.value.data.byTool);
      } else if (usageRes.status === 'rejected') {
        console.error('Failed to fetch tool usage:', usageRes.reason);
      }

      setLoading(false);
    };
    fetchAll();
  }, []);

  return (
    <div className="space-y-8">
      <div>
        <h2 className="font-display text-2xl font-bold text-strong">Audit Logs</h2>
        <p className="mt-1 text-sm text-text-muted">
          Every administrative mutation, newest first, with the admin and IP that made it.
        </p>
      </div>

      {/* Tool usage summary */}
      <div>
        <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-strong">
          <BarChart3 size={16} className="text-brand-orange" />
          Tool Usage
        </h3>
        {toolUsage.length === 0 ? (
          <p className="rounded-xl border border-line bg-bg-surface p-6 text-sm text-text-muted">
            No tool usage recorded yet.
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {toolUsage.map((tool) => (
              <div key={tool.toolName} className="rounded-xl border border-line bg-bg-surface p-4">
                <p className="truncate text-xs text-text-muted">{tool.toolName}</p>
                <p className="mt-1 font-display text-2xl font-bold text-strong">{tool._count.toolName}</p>
                <p className="text-xs text-text-muted">{tool._sum.creditsConsumed ?? 0} credits</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Audit trail */}
      <div>
        <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-strong">
          <Activity size={16} className="text-brand-orange" />
          Recent Activity
        </h3>
        <div className="overflow-hidden rounded-xl border border-line bg-bg-surface">
          {loading ? (
            <div className="space-y-px">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-14 animate-pulse bg-bg-card" />
              ))}
            </div>
          ) : logs.length === 0 ? (
            <p className="p-8 text-center text-sm text-text-muted">
              No activity recorded yet. Actions appear here as admins make changes.
            </p>
          ) : (
            <table className="w-full text-left text-sm">
              <thead className="border-b border-line text-xs uppercase tracking-wider text-text-muted">
                <tr>
                  <th className="px-4 py-3">Action</th>
                  <th className="px-4 py-3">Target</th>
                  <th className="px-4 py-3">By</th>
                  <th className="px-4 py-3">IP</th>
                  <th className="px-4 py-3">When</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id} className="border-b border-line-subtle last:border-0">
                    <td className="px-4 py-3">
                      <span className={clsx('rounded-full px-2 py-0.5 text-xs font-medium', actionTone(log.action))}>
                        {log.action}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-text-muted">{log.targetModel || '—'}</td>
                    <td className="px-4 py-3 text-strong">{log.user?.email || 'System'}</td>
                    <td className="px-4 py-3 font-mono text-xs text-text-muted">{log.ipAddress || '—'}</td>
                    <td className="px-4 py-3 text-text-muted">{new Date(log.timestamp).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuditLogs;
