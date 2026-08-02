import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Plus, Pencil, Trash2, X, FileText, Briefcase, StickyNote,
  Clock, MessageSquare, Upload, ChevronDown, AlertTriangle, RefreshCw,
} from 'lucide-react';
import { iAssistAPI } from '../../../services/api';

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

const CATEGORY_DOT_COLORS: Record<string, string> = {
  BEHAVIORAL: '#7F77DD',
  TECHNICAL: '#1D9E75',
  SYSTEM_DESIGN: '#D85A30',
  GENERAL: '#888780',
};

const ROLE_ICONS: Record<string, typeof FileText> = {
  RESUME: FileText,
  JOB_DESCRIPTION: Briefcase,
  MATERIAL: StickyNote,
};

const ROLE_LABELS: Record<string, string> = {
  RESUME: 'Resume',
  JOB_DESCRIPTION: 'Job Description',
  MATERIAL: 'Material',
};

const CATEGORIES = ['BEHAVIORAL', 'TECHNICAL', 'SYSTEM_DESIGN', 'GENERAL'] as const;

interface Material {
  id: string;
  role: string;
  title: string;
  documentId: string | null;
  hasContent: boolean;
}

interface Assistant {
  id: string;
  name: string;
  category: string;
  targetRole: string | null;
  experienceYears: number | null;
  instructions: string | null;
  materials: Material[];
  sessionCount: number;
  lastUsedAt: string | null;
  createdAt: string;
}

interface DocOption {
  id: string;
  title: string;
  fileType: string | null;
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

// ─── Create / Edit Form ───────────────────────────────────────

interface FormProps {
  initial?: Assistant | null;
  onSave: (data: any) => Promise<void>;
  onCancel: () => void;
  saving: boolean;
}

const AssistantForm = ({ initial, onSave, onCancel, saving }: FormProps) => {
  const [name, setName] = useState(initial?.name || '');
  const [category, setCategory] = useState(initial?.category || 'GENERAL');
  const [targetRole, setTargetRole] = useState(initial?.targetRole || '');
  const [experienceYears, setExperienceYears] = useState<string>(
    initial?.experienceYears != null ? String(initial.experienceYears) : ''
  );
  const [instructions, setInstructions] = useState(initial?.instructions || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      name: name.trim(),
      category,
      targetRole: targetRole.trim() || undefined,
      experienceYears: experienceYears ? Number(experienceYears) : undefined,
      instructions: instructions.trim() || undefined,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <h2 className="font-display text-xl font-bold">{initial ? 'Edit assistant' : 'New assistant'}</h2>
        <p className="text-xs text-text-muted mt-0.5">
          {initial ? 'Update assistant settings.' : 'Configure an AI interview co-pilot for a specific role.'}
        </p>
      </div>

      {/* Basics */}
      <div className="rounded-xl border border-white/[0.08] bg-bg-surface p-5 space-y-4">
        <p className="text-[10px] font-bold text-brand-orange uppercase tracking-wider">Basics</p>

        <div>
          <label className="text-xs font-semibold text-text-muted">Name *</label>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="e.g. Google SDE — Behavioral"
            required
            maxLength={100}
            className="mt-1 w-full rounded-lg border border-white/[0.08] bg-bg-card px-3 py-2 text-sm text-white placeholder:text-text-muted/50 focus:border-brand-orange focus:outline-none"
          />
        </div>

        <div>
          <label className="text-xs font-semibold text-text-muted">Category *</label>
          <p className="text-[10px] text-text-muted mt-0.5 mb-2">Shapes how the AI structures responses during your session</p>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                type="button"
                onClick={() => setCategory(cat)}
                className={
                  category === cat
                    ? `rounded-lg px-3 py-1.5 text-xs font-semibold ${CATEGORY_BADGE_STYLES[cat]}`
                    : 'rounded-lg px-3 py-1.5 text-xs font-medium text-text-muted border border-white/[0.08] hover:border-white/[0.16] transition-colors'
                }
              >
                {CATEGORY_LABELS[cat]}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Configuration */}
      <div className="rounded-xl border border-white/[0.08] bg-bg-surface p-5 space-y-4">
        <p className="text-[10px] font-bold text-brand-orange uppercase tracking-wider">Configuration</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-semibold text-text-muted">Target role</label>
            <input
              type="text"
              value={targetRole}
              onChange={e => setTargetRole(e.target.value)}
              placeholder="e.g. Senior Backend Engineer"
              maxLength={100}
              className="mt-1 w-full rounded-lg border border-white/[0.08] bg-bg-card px-3 py-2 text-sm text-white placeholder:text-text-muted/50 focus:border-brand-orange focus:outline-none"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-text-muted">Experience (years)</label>
            <input
              type="number"
              value={experienceYears}
              onChange={e => setExperienceYears(e.target.value)}
              placeholder="e.g. 5"
              min={0}
              max={50}
              className="mt-1 w-full rounded-lg border border-white/[0.08] bg-bg-card px-3 py-2 text-sm text-white placeholder:text-text-muted/50 focus:border-brand-orange focus:outline-none"
            />
          </div>
        </div>

        <div>
          <label className="text-xs font-semibold text-text-muted">Custom instructions</label>
          <textarea
            value={instructions}
            onChange={e => setInstructions(e.target.value)}
            placeholder="e.g. Focus on leadership examples from my time at Company X. Avoid generic answers."
            rows={3}
            maxLength={2000}
            className="mt-1 w-full rounded-lg border border-white/[0.08] bg-bg-card px-3 py-2 text-sm text-white placeholder:text-text-muted/50 focus:border-brand-orange focus:outline-none resize-none"
          />
        </div>
      </div>

      {/* Footer */}
      <div className="flex justify-end gap-3">
        <button type="button" onClick={onCancel} className="rounded-lg border border-white/[0.08] px-4 py-2 text-sm font-medium text-text-muted hover:text-white transition-colors">
          Cancel
        </button>
        <button
          type="submit"
          disabled={!name.trim() || saving}
          className="rounded-lg bg-brand-orange px-5 py-2 text-sm font-semibold text-white shadow-md hover:bg-brand-orange/90 transition-colors disabled:opacity-50"
        >
          {saving ? 'Saving...' : initial ? 'Save changes' : 'Create'}
        </button>
      </div>
    </form>
  );
};

// ─── Add Material Modal ───────────────────────────────────────

interface AddMaterialModalProps {
  role: string;
  onAdd: (data: { role: string; title: string; documentId?: string; content?: string }) => Promise<void>;
  onClose: () => void;
  saving: boolean;
}

const AddMaterialModal = ({ role, onAdd, onClose, saving }: AddMaterialModalProps) => {
  const [title, setTitle] = useState('');
  const [source, setSource] = useState<'document' | 'direct'>('document');
  const [documents, setDocuments] = useState<DocOption[]>([]);
  const [selectedDocId, setSelectedDocId] = useState('');
  const [content, setContent] = useState('');
  const [docsLoading, setDocsLoading] = useState(false);

  useEffect(() => {
    setDocsLoading(true);
    iAssistAPI.getDocuments().then(res => {
      if (res.data.success) setDocuments(res.data.documents);
    }).catch(() => {}).finally(() => setDocsLoading(false));
  }, []);

  const canSubmit = title.trim() && (source === 'document' ? selectedDocId : content.trim());

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    onAdd({
      role,
      title: title.trim(),
      ...(source === 'document' ? { documentId: selectedDocId } : { content: content.trim() }),
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-md rounded-xl border border-white/[0.08] bg-bg-surface p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <Upload size={18} className="text-brand-orange" />
            <h3 className="text-sm font-semibold">Add {ROLE_LABELS[role]?.toLowerCase() || 'content'}</h3>
          </div>
          <button onClick={onClose} className="text-text-muted hover:text-white transition-colors">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-text-muted">Title *</label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder={role === 'RESUME' ? 'e.g. My Resume 2026' : role === 'JOB_DESCRIPTION' ? 'e.g. Google L5 Backend JD' : 'e.g. Company research notes'}
              maxLength={200}
              className="mt-1 w-full rounded-lg border border-white/[0.08] bg-bg-card px-3 py-2 text-sm text-white placeholder:text-text-muted/50 focus:border-brand-orange focus:outline-none"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-text-muted">Content source *</label>
            <div className="mt-1 flex gap-1 rounded-lg bg-bg-card p-1 border border-white/[0.08]">
              <button
                type="button"
                onClick={() => setSource('document')}
                className={
                  source === 'document'
                    ? 'flex-1 rounded-md bg-brand-orange/10 px-3 py-1.5 text-xs font-medium text-brand-orange'
                    : 'flex-1 rounded-md px-3 py-1.5 text-xs font-medium text-text-muted hover:text-white transition-colors'
                }
              >
                From documents
              </button>
              <button
                type="button"
                onClick={() => setSource('direct')}
                className={
                  source === 'direct'
                    ? 'flex-1 rounded-md bg-brand-orange/10 px-3 py-1.5 text-xs font-medium text-brand-orange'
                    : 'flex-1 rounded-md px-3 py-1.5 text-xs font-medium text-text-muted hover:text-white transition-colors'
                }
              >
                Direct input
              </button>
            </div>
          </div>

          {source === 'document' ? (
            <div>
              <label className="text-xs font-semibold text-text-muted">Select document *</label>
              {docsLoading ? (
                <p className="mt-1 text-xs text-text-muted">Loading documents...</p>
              ) : documents.length === 0 ? (
                <div className="mt-1 text-xs text-text-muted">
                  No documents yet.{' '}
                  <Link to="/dashboard/student/tools/i-assist/documents" className="text-brand-orange hover:underline">
                    Upload one
                  </Link>
                </div>
              ) : (
                <div className="relative mt-1">
                  <select
                    value={selectedDocId}
                    onChange={e => setSelectedDocId(e.target.value)}
                    className="w-full appearance-none rounded-lg border border-white/[0.08] bg-bg-card px-3 py-2 text-sm text-white focus:border-brand-orange focus:outline-none"
                  >
                    <option value="">Choose a document...</option>
                    {documents.map(doc => (
                      <option key={doc.id} value={doc.id}>{doc.title}</option>
                    ))}
                  </select>
                  <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
                </div>
              )}
            </div>
          ) : (
            <div>
              <label className="text-xs font-semibold text-text-muted">Content *</label>
              <textarea
                value={content}
                onChange={e => setContent(e.target.value)}
                placeholder="Paste your content here..."
                rows={6}
                maxLength={50000}
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
              {saving ? 'Adding...' : 'Add content'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ─── Main Page ────────────────────────────────────────────────

const Assistants = () => {
  const [assistants, setAssistants] = useState<Assistant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingAssistant, setEditingAssistant] = useState<Assistant | null>(null);
  const [saving, setSaving] = useState(false);
  const [materialModal, setMaterialModal] = useState<{ assistantId: string; role: string } | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadAssistants = () => {
    setLoading(true);
    setError(null);
    iAssistAPI.getAssistants().then(res => {
      if (res.data.success) setAssistants(res.data.assistants);
    }).catch(() => {
      setError('Failed to load assistants.');
    }).finally(() => setLoading(false));
  };

  useEffect(() => { loadAssistants(); }, []);

  const handleCreate = async (data: any) => {
    setSaving(true);
    try {
      const res = await iAssistAPI.createAssistant(data);
      if (res.data.success) {
        setShowForm(false);
        loadAssistants();
      }
    } catch {}
    setSaving(false);
  };

  const handleUpdate = async (data: any) => {
    if (!editingAssistant) return;
    setSaving(true);
    try {
      const res = await iAssistAPI.updateAssistant(editingAssistant.id, data);
      if (res.data.success) {
        setEditingAssistant(null);
        setShowForm(false);
        loadAssistants();
      }
    } catch {}
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      await iAssistAPI.deleteAssistant(id);
      loadAssistants();
    } catch {}
    setDeletingId(null);
  };

  const handleAddMaterial = async (data: { role: string; title: string; documentId?: string; content?: string }) => {
    if (!materialModal) return;
    setSaving(true);
    try {
      const res = await iAssistAPI.addMaterial(materialModal.assistantId, data);
      if (res.data.success) {
        setMaterialModal(null);
        loadAssistants();
      }
    } catch {}
    setSaving(false);
  };

  const handleRemoveMaterial = async (assistantId: string, materialId: string) => {
    try {
      await iAssistAPI.removeMaterial(assistantId, materialId);
      loadAssistants();
    } catch {}
  };

  const tabs = [
    { label: 'Sessions', path: '/dashboard/student/tools/i-assist' },
    { label: 'Assistants', path: '/dashboard/student/tools/i-assist/assistants' },
    { label: 'Documents', path: '/dashboard/student/tools/i-assist/documents' },
  ];

  // ── Form view ──
  if (showForm) {
    return (
      <div className="p-6 text-white max-w-5xl mx-auto space-y-6">
        <AssistantForm
          initial={editingAssistant}
          onSave={editingAssistant ? handleUpdate : handleCreate}
          onCancel={() => { setShowForm(false); setEditingAssistant(null); }}
          saving={saving}
        />
      </div>
    );
  }

  // ── List view ──
  return (
    <div className="p-6 text-white max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold">I-Assist</h1>
          <p className="text-xs text-text-muted">AI-powered interview co-pilot</p>
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 border-b border-white/[0.08]">
        {tabs.map(tab => {
          const isActive = tab.label === 'Assistants';
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
        <div>
          <h2 className="text-sm font-semibold">Interview assistants</h2>
          <p className="text-[10px] text-text-muted">Create and manage AI assistants with custom context for your interviews</p>
        </div>
        <button
          onClick={() => { setEditingAssistant(null); setShowForm(true); }}
          className="flex items-center gap-1.5 rounded-lg bg-brand-orange px-4 py-2 text-sm font-semibold text-white shadow-md hover:bg-brand-orange/90 transition-colors"
        >
          <Plus size={16} /> New
        </button>
      </div>

      {/* Assistant list */}
      {loading ? (
        <div className="space-y-4 animate-pulse">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="rounded-xl border border-white/[0.08] bg-bg-surface overflow-hidden">
              <div className="p-5">
                <div className="flex items-center gap-3">
                  <div className="h-2.5 w-2.5 rounded-full bg-white/[0.08]" />
                  <div className="h-4 w-44 rounded bg-white/[0.08]" />
                  <div className="h-5 w-20 rounded-md bg-white/[0.06]" />
                </div>
                <div className="h-3 w-64 rounded bg-white/[0.06] mt-2 ml-[22px]" />
              </div>
              <div className="border-t border-white/[0.06] bg-white/[0.02] px-5 py-4 space-y-2">
                <div className="h-3 w-24 rounded bg-white/[0.06]" />
                <div className="h-9 w-full rounded-lg bg-white/[0.04]" />
                <div className="h-9 w-full rounded-lg bg-white/[0.04]" />
              </div>
              <div className="border-t border-white/[0.06] px-5 py-3 flex gap-4">
                <div className="h-3 w-24 rounded bg-white/[0.06]" />
                <div className="h-3 w-20 rounded bg-white/[0.06]" />
              </div>
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-red-500/20 bg-red-500/5 py-12 text-center">
          <AlertTriangle size={32} className="text-red-400 mb-3" />
          <p className="text-sm font-medium text-red-400">{error}</p>
          <button
            onClick={loadAssistants}
            className="mt-4 flex items-center gap-2 rounded-lg border border-white/[0.08] px-4 py-2 text-sm font-medium text-text-muted hover:text-white transition-colors"
          >
            <RefreshCw size={14} /> Retry
          </button>
        </div>
      ) : assistants.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-white/[0.12] py-16 text-center">
          <Briefcase size={40} className="text-text-muted mb-3" />
          <p className="text-sm font-medium text-text-muted">No assistants yet</p>
          <p className="text-xs text-text-muted mt-1 mb-4">Create your first assistant to get started with interview prep.</p>
          <button
            onClick={() => { setEditingAssistant(null); setShowForm(true); }}
            className="flex items-center gap-1.5 rounded-lg bg-brand-orange px-4 py-2 text-sm font-semibold text-white shadow-md hover:bg-brand-orange/90 transition-colors"
          >
            <Plus size={16} /> New assistant
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {assistants.map(ast => {
            const cat = ast.category || 'GENERAL';
            const resume = ast.materials.find(m => m.role === 'RESUME');
            const jd = ast.materials.find(m => m.role === 'JOB_DESCRIPTION');
            const extraMaterials = ast.materials.filter(m => m.role === 'MATERIAL');

            return (
              <div key={ast.id} className="rounded-xl border border-white/[0.08] bg-bg-surface overflow-hidden">
                {/* Card header */}
                <div className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="h-2.5 w-2.5 shrink-0 rounded-full mt-1" style={{ backgroundColor: CATEGORY_DOT_COLORS[cat] }} />
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-sm font-semibold truncate">{ast.name}</h3>
                          <span className={`shrink-0 rounded-md px-2 py-0.5 text-[10px] font-semibold ${CATEGORY_BADGE_STYLES[cat]}`}>
                            {CATEGORY_LABELS[cat]}
                          </span>
                        </div>
                        {ast.instructions && (
                          <p className="text-xs text-text-muted mt-1 line-clamp-2">{ast.instructions}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => { setEditingAssistant(ast); setShowForm(true); }}
                        className="p-1.5 rounded text-text-muted hover:text-white transition-colors"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        onClick={() => handleDelete(ast.id)}
                        disabled={deletingId === ast.id}
                        className="p-1.5 rounded text-text-muted hover:text-red-400 transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Attached context */}
                <div className="border-t border-white/[0.06] bg-white/[0.02] px-5 py-4 space-y-2">
                  <p className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Attached context</p>

                  {/* Resume slot */}
                  {resume ? (
                    <MaterialRow
                      material={resume}
                      onRemove={() => handleRemoveMaterial(ast.id, resume.id)}
                    />
                  ) : (
                    <button
                      onClick={() => setMaterialModal({ assistantId: ast.id, role: 'RESUME' })}
                      className="w-full flex items-center gap-2 rounded-lg border border-dashed border-[#7F77DD]/30 px-3 py-2 text-xs text-[#7F77DD] hover:border-[#7F77DD]/60 transition-colors"
                    >
                      <Plus size={14} /> Attach resume
                    </button>
                  )}

                  {/* JD slot */}
                  {jd ? (
                    <MaterialRow
                      material={jd}
                      onRemove={() => handleRemoveMaterial(ast.id, jd.id)}
                    />
                  ) : (
                    <button
                      onClick={() => setMaterialModal({ assistantId: ast.id, role: 'JOB_DESCRIPTION' })}
                      className="w-full flex items-center gap-2 rounded-lg border border-dashed border-white/[0.12] px-3 py-2 text-xs text-text-muted hover:border-white/[0.24] transition-colors"
                    >
                      <Plus size={14} /> Attach job description
                    </button>
                  )}

                  {/* Extra materials */}
                  {extraMaterials.map(mat => (
                    <MaterialRow
                      key={mat.id}
                      material={mat}
                      onRemove={() => handleRemoveMaterial(ast.id, mat.id)}
                    />
                  ))}

                  {/* Add material button */}
                  <button
                    onClick={() => setMaterialModal({ assistantId: ast.id, role: 'MATERIAL' })}
                    className="w-full flex items-center gap-2 rounded-lg border border-dashed border-white/[0.12] px-3 py-2 text-xs text-text-muted hover:border-white/[0.24] transition-colors"
                  >
                    <Plus size={14} /> Add material
                  </button>
                </div>

                {/* Card footer */}
                <div className="border-t border-white/[0.06] px-5 py-3 flex items-center gap-4 text-[11px] text-text-muted">
                  {ast.lastUsedAt && (
                    <span className="flex items-center gap-1">
                      <Clock size={12} /> Last used {timeAgo(ast.lastUsedAt)}
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <MessageSquare size={12} /> {ast.sessionCount} session{ast.sessionCount !== 1 ? 's' : ''}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Material Modal */}
      {materialModal && (
        <AddMaterialModal
          role={materialModal.role}
          onAdd={handleAddMaterial}
          onClose={() => setMaterialModal(null)}
          saving={saving}
        />
      )}
    </div>
  );
};

// ─── Material Row ─────────────────────────────────────────────

const MaterialRow = ({ material, onRemove }: { material: Material; onRemove: () => void }) => {
  const Icon = ROLE_ICONS[material.role] || StickyNote;
  return (
    <div className="flex items-center gap-3 rounded-lg bg-bg-card border border-white/[0.06] px-3 py-2">
      <Icon size={14} className="shrink-0 text-text-muted" />
      <span className="flex-1 text-xs text-white truncate">{material.title}</span>
      <span className="shrink-0 text-[10px] text-text-muted">
        {material.documentId ? 'From documents' : 'Direct input'}
      </span>
      <button onClick={onRemove} className="shrink-0 p-1 text-text-muted hover:text-red-400 transition-colors">
        <X size={13} />
      </button>
    </div>
  );
};

export default Assistants;
