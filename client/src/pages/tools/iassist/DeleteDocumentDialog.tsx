import { useState, useEffect } from 'react';
import { AlertTriangle } from 'lucide-react';
import { iAssistAPI } from '../../../services/api';

interface DeleteDocumentDialogProps {
  documentId: string;
  title: string;
  /** Pass when already known (the viewer has it loaded) to skip the lookup. */
  usedBy?: string[];
  onCancel: () => void;
  onDeleted: () => void;
}

/**
 * Confirmation for deleting a context document. Always names the assistants that
 * depend on it, so the blast radius is visible before the delete, not after.
 */
const DeleteDocumentDialog = ({ documentId, title, usedBy, onCancel, onDeleted }: DeleteDocumentDialogProps) => {
  const [dependents, setDependents] = useState<string[] | null>(usedBy ?? null);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (usedBy !== undefined) return;
    let cancelled = false;
    iAssistAPI.getDocument(documentId).then(res => {
      if (cancelled) return;
      if (res.data.success) setDependents(res.data.document.usedBy || []);
      else setDependents([]);
    }).catch(() => {
      // Fall back to deleting without the dependency list rather than blocking.
      if (!cancelled) setDependents([]);
    });
    return () => { cancelled = true; };
  }, [documentId, usedBy]);

  const handleDelete = async () => {
    setDeleting(true);
    setError(null);
    try {
      await iAssistAPI.deleteDocument(documentId);
      onDeleted();
    } catch {
      setError('Failed to delete document.');
      setDeleting(false);
    }
  };

  const loading = dependents === null;
  const inUse = !!dependents && dependents.length > 0;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      // Stop the click here — when nested inside the viewer, bubbling would
      // close the viewer too instead of just dismissing this dialog.
      onClick={e => { e.stopPropagation(); onCancel(); }}
    >
      <div
        className="w-full max-w-sm rounded-xl border border-white/[0.08] bg-bg-surface p-6 shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-start gap-3">
          <AlertTriangle size={20} className="mt-0.5 shrink-0 text-red-400" />
          <div className="min-w-0">
            <h4 className="text-sm font-semibold text-white">Delete this document?</h4>
            <p className="mt-1 text-xs text-text-muted">
              <span className="text-white">{title}</span> will be permanently removed. This can't be undone.
            </p>
          </div>
        </div>

        {loading ? (
          <div className="mt-3 h-8 animate-pulse rounded-lg bg-white/[0.04]" />
        ) : inUse ? (
          <div className="mt-3 rounded-lg border border-amber-500/20 bg-amber-500/5 px-3 py-2.5">
            <p className="text-xs font-medium text-amber-400">
              In use by {dependents!.length} assistant{dependents!.length !== 1 ? 's' : ''}
            </p>
            <ul className="mt-1.5 space-y-0.5">
              {dependents!.map(name => (
                <li key={name} className="truncate text-[11px] text-text-muted">— {name}</li>
              ))}
            </ul>
            <p className="mt-2 text-[11px] text-text-muted">
              {dependents!.length !== 1 ? 'They' : 'It'} will keep the attachment but lose its content, and you'll need
              to attach a replacement.
            </p>
          </div>
        ) : (
          <p className="mt-3 text-[11px] text-text-muted">Not attached to any assistant.</p>
        )}

        {error && <p className="mt-3 text-xs text-red-400">{error}</p>}

        <div className="mt-5 flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="rounded-lg border border-white/[0.08] px-4 py-2 text-sm font-medium text-text-muted transition-colors hover:text-white"
          >
            Cancel
          </button>
          <button
            onClick={handleDelete}
            disabled={deleting || loading}
            className="rounded-lg bg-red-500 px-4 py-2 text-sm font-semibold text-white shadow-md transition-colors hover:bg-red-500/90 disabled:opacity-50"
          >
            {deleting ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteDocumentDialog;
