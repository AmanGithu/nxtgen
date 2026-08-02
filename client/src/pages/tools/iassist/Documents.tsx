import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  Upload, Search, Trash2, FileText, X, CloudUpload, AlertTriangle, RefreshCw,
} from 'lucide-react';
import { iAssistAPI } from '../../../services/api';
import DocumentViewerModal from './DocumentViewerModal';
import DeleteDocumentDialog from './DeleteDocumentDialog';

const FILE_TYPE_STYLES: Record<string, string> = {
  pdf: 'bg-red-500/10 text-red-400 border-red-500/20',
  docx: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  txt: 'bg-white/[0.04] text-text-muted border-white/[0.08]',
  md: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
};

interface Document {
  id: string;
  title: string;
  description: string | null;
  fileName: string | null;
  fileType: string | null;
  fileSize: number | null;
  wordCount: number;
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

// ─── Upload Modal ─────────────────────────────────────────────

interface UploadModalProps {
  onUpload: (formData: FormData) => Promise<void>;
  onCreateText: (data: { title: string; description?: string; content: string }) => Promise<void>;
  onClose: () => void;
  saving: boolean;
}

const UploadModal = ({ onUpload, onCreateText, onClose, saving }: UploadModalProps) => {
  const [mode, setMode] = useState<'file' | 'text'>('file');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [content, setContent] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const canSubmit = mode === 'file'
    ? title.trim() && file
    : title.trim() && content.trim();

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped) {
      setFile(dropped);
      if (!title.trim()) setTitle(dropped.name.replace(/\.[^.]+$/, ''));
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) {
      setFile(selected);
      if (!title.trim()) setTitle(selected.name.replace(/\.[^.]+$/, ''));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    if (mode === 'file' && file) {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('title', title.trim());
      if (description.trim()) fd.append('description', description.trim());
      onUpload(fd);
    } else if (mode === 'text') {
      onCreateText({
        title: title.trim(),
        description: description.trim() || undefined,
        content: content.trim(),
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-md rounded-xl border border-white/[0.08] bg-bg-surface p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-sm font-semibold">Upload a document</h3>
          <button onClick={onClose} className="text-text-muted hover:text-white transition-colors">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-text-muted">Name *</label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Document title"
              maxLength={200}
              className="mt-1 w-full rounded-lg border border-white/[0.08] bg-bg-card px-3 py-2 text-sm text-white placeholder:text-text-muted/50 focus:border-brand-orange focus:outline-none"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-text-muted">Description</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Optional description"
              rows={2}
              maxLength={500}
              className="mt-1 w-full rounded-lg border border-white/[0.08] bg-bg-card px-3 py-2 text-sm text-white placeholder:text-text-muted/50 focus:border-brand-orange focus:outline-none resize-none"
            />
          </div>

          {/* Mode toggle */}
          <div>
            <label className="text-xs font-semibold text-text-muted">Content source *</label>
            <div className="mt-1 flex gap-1 rounded-lg bg-bg-card p-1 border border-white/[0.08]">
              <button
                type="button"
                onClick={() => setMode('file')}
                className={
                  mode === 'file'
                    ? 'flex-1 rounded-md bg-brand-orange/10 px-3 py-1.5 text-xs font-medium text-brand-orange'
                    : 'flex-1 rounded-md px-3 py-1.5 text-xs font-medium text-text-muted hover:text-white transition-colors'
                }
              >
                File upload
              </button>
              <button
                type="button"
                onClick={() => setMode('text')}
                className={
                  mode === 'text'
                    ? 'flex-1 rounded-md bg-brand-orange/10 px-3 py-1.5 text-xs font-medium text-brand-orange'
                    : 'flex-1 rounded-md px-3 py-1.5 text-xs font-medium text-text-muted hover:text-white transition-colors'
                }
              >
                Paste text
              </button>
            </div>
          </div>

          {mode === 'file' ? (
            <div>
              <div
                onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleFileDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`flex flex-col items-center justify-center rounded-lg border-2 border-dashed py-8 cursor-pointer transition-colors ${
                  dragOver
                    ? 'border-brand-orange bg-brand-orange/5'
                    : 'border-white/[0.12] hover:border-white/[0.24]'
                }`}
              >
                <CloudUpload size={28} className={dragOver ? 'text-brand-orange' : 'text-text-muted'} />
                {file ? (
                  <p className="mt-2 text-xs text-white">{file.name} ({formatSize(file.size)})</p>
                ) : (
                  <>
                    <p className="mt-2 text-xs text-text-muted">Drag and drop or choose file</p>
                    <p className="text-[10px] text-text-muted mt-0.5">PDF, DOCX, TXT, MD (max 10 MB)</p>
                  </>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.docx,.txt,.md"
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>
          ) : (
            <div>
              <label className="text-xs font-semibold text-text-muted">Content *</label>
              <textarea
                value={content}
                onChange={e => setContent(e.target.value)}
                placeholder="Paste your resume, job description, or notes here..."
                rows={8}
                maxLength={100000}
                className="mt-1 w-full rounded-lg border border-white/[0.08] bg-bg-card px-3 py-2 text-sm text-white placeholder:text-text-muted/50 focus:border-brand-orange focus:outline-none resize-none"
              />
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="rounded-lg border border-white/[0.08] px-4 py-2 text-sm font-medium text-text-muted hover:text-white transition-colors">
              Cancel
            </button>
            <button
              type="submit"
              disabled={!canSubmit || saving}
              className="rounded-lg bg-brand-orange px-4 py-2 text-sm font-semibold text-white shadow-md hover:bg-brand-orange/90 transition-colors disabled:opacity-50"
            >
              {saving ? 'Uploading...' : 'Upload document'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ─── Main Page ────────────────────────────────────────────────

const Documents = () => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [showUpload, setShowUpload] = useState(false);
  const [saving, setSaving] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<{ id: string; title: string } | null>(null);
  const [viewingId, setViewingId] = useState<string | null>(null);

  const loadDocs = (q?: string) => {
    setLoading(true);
    setError(null);
    iAssistAPI.getDocuments(q || undefined).then(res => {
      if (res.data.success) setDocuments(res.data.documents);
    }).catch(() => {
      setError('Failed to load documents.');
    }).finally(() => setLoading(false));
  };

  useEffect(() => { loadDocs(); }, []);

  useEffect(() => {
    const t = setTimeout(() => loadDocs(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  const handleUpload = async (fd: FormData) => {
    setSaving(true);
    try {
      const res = await iAssistAPI.uploadDocument(fd);
      if (res.data.success) { setShowUpload(false); loadDocs(search); }
    } catch {}
    setSaving(false);
  };

  const handleCreateText = async (data: { title: string; description?: string; content: string }) => {
    setSaving(true);
    try {
      const res = await iAssistAPI.createDocument(data);
      if (res.data.success) { setShowUpload(false); loadDocs(search); }
    } catch {}
    setSaving(false);
  };

  const handleDeleted = () => {
    setPendingDelete(null);
    loadDocs(search);
  };

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
          const isActive = tab.label === 'Documents';
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

      {/* Sub-header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-semibold">Documents</h2>
          <span className="rounded-full bg-white/[0.06] px-2 py-0.5 text-[10px] font-medium text-text-muted tabular-nums">
            {documents.length}
          </span>
        </div>
        <button
          onClick={() => setShowUpload(true)}
          className="flex items-center gap-1.5 rounded-lg bg-brand-orange px-4 py-2 text-sm font-semibold text-white shadow-md hover:bg-brand-orange/90 transition-colors"
        >
          <Upload size={16} /> Upload
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search documents..."
          className="w-full rounded-lg border border-white/[0.08] bg-bg-surface pl-9 pr-3 py-2 text-sm text-white placeholder:text-text-muted/50 focus:border-brand-orange focus:outline-none"
        />
      </div>

      {/* Documents table */}
      {loading ? (
        <div className="rounded-xl border border-white/[0.08] bg-bg-surface overflow-hidden animate-pulse">
          <div className="border-b border-white/[0.06] px-4 py-3 flex gap-4">
            {['w-8', 'flex-1', 'w-16', 'w-16', 'w-16', 'w-24', 'w-8'].map((w, i) => (
              <div key={i} className={`h-3 ${w} rounded bg-white/[0.06]`} />
            ))}
          </div>
          {[...Array(4)].map((_, i) => (
            <div key={i} className="border-b border-white/[0.04] px-4 py-3.5 flex items-center gap-4">
              <div className="h-3 w-4 rounded bg-white/[0.06]" />
              <div className="flex-1 space-y-1">
                <div className="h-4 w-40 rounded bg-white/[0.08]" />
                <div className="h-2.5 w-56 rounded bg-white/[0.04]" />
              </div>
              <div className="h-5 w-10 rounded bg-white/[0.06]" />
              <div className="h-3 w-14 rounded bg-white/[0.06]" />
              <div className="h-3 w-12 rounded bg-white/[0.06]" />
              <div className="h-3 w-20 rounded bg-white/[0.06]" />
              <div className="h-4 w-4 rounded bg-white/[0.04]" />
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-red-500/20 bg-red-500/5 py-12 text-center">
          <AlertTriangle size={32} className="text-red-400 mb-3" />
          <p className="text-sm font-medium text-red-400">{error}</p>
          <button
            onClick={() => loadDocs(search)}
            className="mt-4 flex items-center gap-2 rounded-lg border border-white/[0.08] px-4 py-2 text-sm font-medium text-text-muted hover:text-white transition-colors"
          >
            <RefreshCw size={14} /> Retry
          </button>
        </div>
      ) : documents.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-white/[0.12] py-16 text-center">
          <FileText size={40} className="text-text-muted mb-3" />
          <p className="text-sm font-medium text-text-muted">
            {search ? 'No documents match your search' : 'No documents yet'}
          </p>
          <p className="text-xs text-text-muted mt-1 mb-4">
            {search ? 'Try a different search term.' : 'Upload your resume, job descriptions, or study materials.'}
          </p>
          {!search && (
            <button
              onClick={() => setShowUpload(true)}
              className="flex items-center gap-1.5 rounded-lg bg-brand-orange px-4 py-2 text-sm font-semibold text-white shadow-md hover:bg-brand-orange/90 transition-colors"
            >
              <Upload size={16} /> Upload document
            </button>
          )}
        </div>
      ) : (
        <div className="rounded-xl border border-white/[0.08] bg-bg-surface overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-white/[0.06]">
                  <th className="px-4 py-3 text-[10px] font-bold text-text-muted uppercase tracking-wider w-8">#</th>
                  <th className="px-4 py-3 text-[10px] font-bold text-text-muted uppercase tracking-wider">Name</th>
                  <th className="px-4 py-3 text-[10px] font-bold text-text-muted uppercase tracking-wider">Type</th>
                  <th className="px-4 py-3 text-[10px] font-bold text-text-muted uppercase tracking-wider text-right">Size</th>
                  <th className="px-4 py-3 text-[10px] font-bold text-text-muted uppercase tracking-wider text-right">Words</th>
                  <th className="px-4 py-3 text-[10px] font-bold text-text-muted uppercase tracking-wider">Added</th>
                  <th className="px-4 py-3 text-[10px] font-bold text-text-muted uppercase tracking-wider w-12"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {documents.map((doc, i) => {
                  const ft = (doc.fileType || 'txt').toLowerCase();
                  const pillStyle = FILE_TYPE_STYLES[ft] || FILE_TYPE_STYLES.txt;
                  return (
                    <tr key={doc.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="px-4 py-3 text-xs text-text-muted tabular-nums">{i + 1}</td>
                      <td className="px-4 py-3">
                        <button
                          type="button"
                          onClick={() => setViewingId(doc.id)}
                          title="Open document"
                          className="flex items-center gap-2 min-w-0 text-left"
                        >
                          <FileText size={14} className="shrink-0 text-text-muted" />
                          <span className="text-sm text-brand-orange truncate hover:underline">{doc.title}</span>
                        </button>
                        {doc.description && (
                          <p className="text-[10px] text-text-muted mt-0.5 truncate max-w-xs">{doc.description}</p>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-block rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase border ${pillStyle}`}>
                          {ft}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-text-muted text-right tabular-nums whitespace-nowrap">
                        {formatSize(doc.fileSize)}
                      </td>
                      <td className="px-4 py-3 text-xs text-text-muted text-right tabular-nums">
                        {doc.wordCount.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-xs text-text-muted whitespace-nowrap">
                        {formatDate(doc.createdAt)}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => setPendingDelete({ id: doc.id, title: doc.title })}
                          title="Delete document"
                          className="p-1 rounded text-text-muted hover:text-red-400 transition-colors"
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Table footer */}
          <div className="border-t border-white/[0.06] px-4 py-3">
            <p className="text-[10px] text-text-muted">
              Showing {documents.length} document{documents.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
      )}

      {/* Delete confirmation */}
      {pendingDelete && (
        <DeleteDocumentDialog
          documentId={pendingDelete.id}
          title={pendingDelete.title}
          onCancel={() => setPendingDelete(null)}
          onDeleted={handleDeleted}
        />
      )}

      {/* Document Viewer */}
      {viewingId && (
        <DocumentViewerModal
          documentId={viewingId}
          onClose={() => setViewingId(null)}
          onChanged={() => loadDocs(search)}
        />
      )}

      {/* Upload Modal */}
      {showUpload && (
        <UploadModal
          onUpload={handleUpload}
          onCreateText={handleCreateText}
          onClose={() => setShowUpload(false)}
          saving={saving}
        />
      )}
    </div>
  );
};

export default Documents;
