import { useState, useEffect } from 'react';
import { X, FileText, AlertTriangle, RefreshCw, Copy, Check } from 'lucide-react';
import { iAssistAPI } from '../../../services/api';

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
}

const DocumentViewerModal = ({ documentId, onClose }: DocumentViewerModalProps) => {
  const [doc, setDoc] = useState<FullDocument | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

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
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const handleCopy = () => {
    if (!doc) return;
    navigator.clipboard.writeText(doc.content).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }).catch(() => {});
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={onClose}>
      <div
        className="flex w-full max-w-3xl max-h-[85vh] flex-col rounded-xl border border-white/[0.08] bg-bg-surface shadow-2xl"
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
              {doc?.description && (
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
            {doc && (
              <button
                onClick={handleCopy}
                title="Copy text"
                className="flex items-center gap-1.5 rounded-lg border border-white/[0.08] px-2.5 py-1.5 text-xs font-medium text-text-muted transition-colors hover:text-white"
              >
                {copied ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
                {copied ? 'Copied' : 'Copy'}
              </button>
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
      </div>
    </div>
  );
};

export default DocumentViewerModal;
