import { useState, useEffect } from 'react';
import { X, FileText, AlertTriangle, RefreshCw, Copy, Check, Pencil, Trash2 } from 'lucide-react';
import { iAssistAPI } from '../../../services/api';
import DeleteDocumentDialog from './DeleteDocumentDialog';

interface FullDocument {
  id: string;
  title: string;
  description: string | null;
  fileName: string | null;
  fileType: string | null;
  fileSize: number | null;
  wordCount: number;
  content: string;
  createdAt: string;
  /** Names of assistants that use this document as context. */
  usedBy?: string[];
}

function formatSize(bytes: number | null): string {
  if (!bytes) return '--';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

interface DocumentViewerModalProps {
  documentId: string;
  onClose: () => void;
  /** Called after a successful edit or delete so the parent can refresh its list. */
  onChanged?: () => void;
}

const DocumentViewerModal = ({ documentId, onClose, onChanged }: DocumentViewerModalProps) => {
  const [doc, setDoc] = useState<FullDocument | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [draftTitle, setDraftTitle] = useState('');
  const [draftDescription, setDraftDescription] = useState('');
  const [draftContent, setDraftContent] = useState('');

  const [confirmDelete, setConfirmDelete] = useState(false);

  // Content is only editable for pasted docs — uploaded files hold extracted text
  // that must stay in sync with the original binary.
  const isPasted = !!doc && !doc.fileName;

  const load = () => {
    setLoading(true);
    setError(null);
    iAssistAPI.getDocument(documentId).then(res => {
      if (res.data.success) setDoc(res.data.document);
      else setError('Failed to load document.');
    }).catch(() => {
      setError('Failed to load document.');
    }).finally(() => setLoading(false));
  };

  useEffect(load, [documentId]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      if (confirmDelete) setConfirmDelete(false);
      else if (editing) setEditing(false);
      else onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose, editing, confirmDelete]);

  const handleCopy = () => {
    if (!doc) return;
    navigator.clipboard.writeText(doc.content).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }).catch(() => {});
  };

  const startEditing = () => {
    if (!doc) return;
    setDraftTitle(doc.title);
    setDraftDescription(doc.description || '');
    setDraftContent(doc.content);
    setSaveError(null);
    setEditing(true);
  };

  const handleSave = async () => {
    if (!doc || !draftTitle.trim()) return;
    if (isPasted && !draftContent.trim()) return;

    setSaving(true);
    setSaveError(null);
    try {
      const res = await iAssistAPI.updateDocument(doc.id, {
        title: draftTitle.trim(),
        description: draftDescription.trim() || null,
        ...(isPasted ? { content: draftContent } : {}),
      });
      if (res.data.success) {
        // The PATCH response has no `usedBy` — carry it over so the delete
        // confirmation keeps warning about dependent assistants after an edit.
        setDoc(prev => ({ ...res.data.document, usedBy: prev?.usedBy }));
        setEditing(false);
        onChanged?.();
      } else {
        setSaveError('Failed to save changes.');
      }
    } catch (err: any) {
      setSaveError(err?.response?.data?.message || 'Failed to save changes.');
    }
    setSaving(false);
  };

  const handleDeleted = () => {
    setConfirmDelete(false);
    onChanged?.();
    onClose();
  };

  const inputClass = 'w-full rounded-lg border border-white/[0.08] bg-bg-card px-3 py-2 text-sm text-white placeholder:text-text-muted/50 focus:border-brand-orange focus:outline-none';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={onClose}>
      <div
        className="relative flex w-full max-w-3xl max-h-[85vh] flex-col overflow-hidden rounded-xl border border-white/[0.08] bg-bg-surface shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4 border-b border-white/[0.06] px-6 py-4">
          <div className="flex min-w-0 items-start gap-2.5">
            <FileText size={16} className="mt-0.5 shrink-0 text-text-muted" />
            <div className="min-w-0">
              <h3 className="truncate text-sm font-semibold text-white">
                {loading ? 'Loading...' : doc?.title || 'Document'}
              </h3>
              {!editing && doc?.description && (
                <p className="mt-0.5 text-xs text-text-muted">{doc.description}</p>
              )}
              {doc && (
                <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-text-muted">
                  {doc.fileName && <span className="truncate max-w-[16rem]">{doc.fileName}</span>}
                  <span className="uppercase">{doc.fileType || 'txt'}</span>
                  <span className="tabular-nums">{formatSize(doc.fileSize)}</span>
                  <span className="tabular-nums">{doc.wordCount.toLocaleString()} words</span>
                  <span>{formatDate(doc.createdAt)}</span>
                </div>
              )}
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            {doc && !editing && (
              <>
                <button
                  onClick={handleCopy}
                  title="Copy text"
                  className="flex items-center gap-1.5 rounded-lg border border-white/[0.08] px-2.5 py-1.5 text-xs font-medium text-text-muted transition-colors hover:text-white"
                >
                  {copied ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
                  {copied ? 'Copied' : 'Copy'}
                </button>
                <button
                  onClick={startEditing}
                  title="Edit document"
                  className="flex items-center gap-1.5 rounded-lg border border-white/[0.08] px-2.5 py-1.5 text-xs font-medium text-text-muted transition-colors hover:text-white"
                >
                  <Pencil size={13} /> Edit
                </button>
                <button
                  onClick={() => setConfirmDelete(true)}
                  title="Delete document"
                  className="flex items-center gap-1.5 rounded-lg border border-white/[0.08] px-2.5 py-1.5 text-xs font-medium text-text-muted transition-colors hover:border-red-500/30 hover:text-red-400"
                >
                  <Trash2 size={13} /> Delete
                </button>
              </>
            )}
            <button onClick={onClose} className="p-1.5 text-text-muted transition-colors hover:text-white">
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
          {loading ? (
            <div className="animate-pulse space-y-2.5">
              {['w-full', 'w-11/12', 'w-full', 'w-4/5', 'w-full', 'w-3/4', 'w-full', 'w-2/3'].map((w, i) => (
                <div key={i} className={`h-3 ${w} rounded bg-white/[0.06]`} />
              ))}
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center rounded-xl border border-red-500/20 bg-red-500/5 py-12 text-center">
              <AlertTriangle size={32} className="mb-3 text-red-400" />
              <p className="text-sm font-medium text-red-400">{error}</p>
              <button
                onClick={load}
                className="mt-4 flex items-center gap-2 rounded-lg border border-white/[0.08] px-4 py-2 text-sm font-medium text-text-muted transition-colors hover:text-white"
              >
                <RefreshCw size={14} /> Retry
              </button>
            </div>
          ) : editing ? (
            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-text-muted">Name *</label>
                <input
                  type="text"
                  value={draftTitle}
                  onChange={e => setDraftTitle(e.target.value)}
                  maxLength={200}
                  className={`mt-1 ${inputClass}`}
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-text-muted">Description</label>
                <textarea
                  value={draftDescription}
                  onChange={e => setDraftDescription(e.target.value)}
                  placeholder="Optional description"
                  rows={2}
                  maxLength={500}
                  className={`mt-1 resize-none ${inputClass}`}
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-text-muted">Content {isPasted && '*'}</label>
                {isPasted ? (
                  <textarea
                    value={draftContent}
                    onChange={e => setDraftContent(e.target.value)}
                    rows={14}
                    maxLength={100000}
                    className={`mt-1 resize-none font-mono text-xs leading-relaxed ${inputClass}`}
                  />
                ) : (
                  <p className="mt-1 rounded-lg border border-white/[0.06] bg-bg-card px-3 py-2.5 text-xs text-text-muted">
                    This text was extracted from <span className="text-white">{doc?.fileName}</span> and can't be edited
                    directly. To change it, delete this document and upload a new version.
                  </p>
                )}
              </div>
              {saveError && (
                <p className="text-xs text-red-400">{saveError}</p>
              )}
            </div>
          ) : !doc?.content.trim() ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <FileText size={32} className="mb-3 text-text-muted" />
              <p className="text-sm font-medium text-text-muted">No extracted text</p>
              <p className="mt-1 text-xs text-text-muted">This document has no readable content.</p>
            </div>
          ) : (
            <pre className="whitespace-pre-wrap break-words font-sans text-sm leading-relaxed text-text-muted">
              {doc.content}
            </pre>
          )}
        </div>

        {/* Edit footer */}
        {editing && (
          <div className="flex justify-end gap-3 border-t border-white/[0.06] px-6 py-4">
            <button
              onClick={() => setEditing(false)}
              className="rounded-lg border border-white/[0.08] px-4 py-2 text-sm font-medium text-text-muted transition-colors hover:text-white"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving || !draftTitle.trim() || (isPasted && !draftContent.trim())}
              className="rounded-lg bg-brand-orange px-4 py-2 text-sm font-semibold text-white shadow-md transition-colors hover:bg-brand-orange/90 disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save changes'}
            </button>
          </div>
        )}

      </div>

      {confirmDelete && doc && (
        <DeleteDocumentDialog
          documentId={doc.id}
          title={doc.title}
          usedBy={doc.usedBy}
          onCancel={() => setConfirmDelete(false)}
          onDeleted={handleDeleted}
        />
      )}
    </div>
  );
};

export default DocumentViewerModal;
