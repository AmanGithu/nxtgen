import { AlertTriangle } from 'lucide-react';

interface Props {
  title: string;
  /** What will actually happen — the server's own message where there is one. */
  message: string;
  confirmLabel?: string;
  /** Optional middle option, e.g. "Archive instead". */
  altLabel?: string;
  onAlt?: () => void;
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * Destructive-action confirmation.
 *
 * The message is passed in rather than generated here so callers can show the
 * server's real counts ("will also remove 3 enrolments…") instead of a vague
 * "are you sure?" — the admin should see what they're destroying.
 */
const ConfirmDialog = ({ title, message, confirmLabel = 'Delete', altLabel, onAlt, onConfirm, onCancel }: Props) => (
  <div className="fixed inset-0 z-[90] grid place-items-center p-6">
    <div className="absolute inset-0 bg-overlay backdrop-blur-sm" onClick={onCancel} />
    <div className="relative w-full max-w-md rounded-2xl border border-red-500/30 bg-bg-surface p-6 shadow-2xl">
      <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-red-500/10 text-red-400">
        <AlertTriangle size={20} />
      </div>
      <h3 className="font-display text-lg font-bold text-strong">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-text-muted">{message}</p>
      <p className="mt-3 text-xs text-red-400">This cannot be undone.</p>

      <div className="mt-6 flex flex-wrap gap-3">
        <button
          onClick={onConfirm}
          className="flex-1 rounded-lg bg-red-500/90 px-4 py-2.5 text-sm font-semibold text-on-brand transition-colors hover:bg-red-500"
        >
          {confirmLabel}
        </button>
        {altLabel && onAlt && (
          <button
            onClick={onAlt}
            className="rounded-lg border border-line px-4 py-2.5 text-sm font-medium text-text-muted transition-colors hover:text-strong"
          >
            {altLabel}
          </button>
        )}
        <button
          onClick={onCancel}
          className="rounded-lg px-3 py-2.5 text-sm text-text-muted transition-colors hover:text-strong"
        >
          Cancel
        </button>
      </div>
    </div>
  </div>
);

export default ConfirmDialog;
