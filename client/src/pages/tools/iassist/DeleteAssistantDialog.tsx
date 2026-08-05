import { useState } from 'react';
import { AlertTriangle, Radio } from 'lucide-react';
import { iAssistAPI } from '../../../services/api';

interface DeleteAssistantDialogProps {
  assistantId: string;
  name: string;
  sessionCount: number;
  /** Sessions still marked ACTIVE within the staleness window. */
  activeSessionCount: number;
  onCancel: () => void;
  onDeleted: () => void;
}

/**
 * Confirmation for deleting an assistant. A live desktop session is surfaced as a
 * soft warning rather than a block — the desktop only clears ACTIVE on a clean
 * /end, so a crashed session can look live when it isn't.
 */
const DeleteAssistantDialog = ({
  assistantId, name, sessionCount, activeSessionCount, onCancel, onDeleted,
}: DeleteAssistantDialogProps) => {
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isLive = activeSessionCount > 0;

  const handleDelete = async () => {
    setDeleting(true);
    setError(null);
    try {
      await iAssistAPI.deleteAssistant(assistantId);
      onDeleted();
    } catch {
      setError('Failed to delete assistant.');
      setDeleting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-overlay backdrop-blur-sm p-4"
      onClick={e => { e.stopPropagation(); onCancel(); }}
    >
      <div
        className="w-full max-w-sm rounded-xl border border-line bg-bg-surface p-6 shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-start gap-3">
          <AlertTriangle size={20} className="mt-0.5 shrink-0 text-red-400" />
          <div className="min-w-0">
            <h4 className="text-sm font-semibold text-strong">Delete this assistant?</h4>
            <p className="mt-1 text-xs text-text-muted">
              <span className="text-strong">{name}</span> and its attached context will be permanently removed. This
              can't be undone.
            </p>
          </div>
        </div>

        {isLive && (
          <div className="mt-3 rounded-lg border border-amber-500/20 bg-amber-500/5 px-3 py-2.5">
            <p className="flex items-center gap-1.5 text-xs font-medium text-amber-400">
              <Radio size={13} />
              {activeSessionCount === 1
                ? 'A session is running on desktop'
                : `${activeSessionCount} sessions are running on desktop`}
            </p>
            <p className="mt-1.5 text-[11px] text-text-muted">
              Deleting now will cut {activeSessionCount === 1 ? 'it' : 'them'} off mid-interview. If the desktop app
              crashed earlier, this may be a stale session and safe to ignore. Delete anyway?
            </p>
          </div>
        )}

        {sessionCount > 0 && (
          <p className="mt-3 text-[11px] text-text-muted">
            {sessionCount} past session{sessionCount !== 1 ? 's' : ''} will be kept in your history.
          </p>
        )}

        {error && <p className="mt-3 text-xs text-red-400">{error}</p>}

        <div className="mt-5 flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="rounded-lg border border-line px-4 py-2 text-sm font-medium text-text-muted transition-colors hover:text-strong"
          >
            Cancel
          </button>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="rounded-lg bg-red-500 px-4 py-2 text-sm font-semibold text-on-brand shadow-md transition-colors hover:bg-red-500/90 disabled:opacity-50"
          >
            {deleting ? 'Deleting...' : isLive ? 'Delete anyway' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteAssistantDialog;
