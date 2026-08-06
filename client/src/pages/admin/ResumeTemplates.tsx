import { useState, useEffect } from 'react';
import { Plus, Archive, FileText, Pencil, Check, X } from 'lucide-react';
import { clsx } from 'clsx';
import { adminTemplatesAPI } from '../../services/api';

type TemplateCategory = 'FREE' | 'PREMIUM';

interface ResumeTemplate {
  id: string;
  name: string;
  category: TemplateCategory;
  thumbnail: string | null;
  isActive: boolean;
  sortOrder: number;
}

const emptyForm = { name: '', category: 'FREE' as TemplateCategory, htmlTemplate: '', thumbnail: '' };

const ResumeTemplates = () => {
  const [templates, setTemplates] = useState<ResumeTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  /** Rename or re-tier without touching the stored HTML. */
  const saveEdit = async (id: string, category: 'FREE' | 'PREMIUM') => {
    try {
      await adminTemplatesAPI.update(id, { name: editName, category });
      setEditingId(null);
      await fetchTemplates();
    } catch (err) {
      console.error('Failed to update template:', err);
    }
  };

  const toggleTier = async (t: { id: string; category: 'FREE' | 'PREMIUM' }) => {
    try {
      await adminTemplatesAPI.update(t.id, { category: t.category === 'FREE' ? 'PREMIUM' : 'FREE' });
      await fetchTemplates();
    } catch (err) {
      console.error('Failed to change tier:', err);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    setLoading(true);
    try {
      const res = await adminTemplatesAPI.getAll();
      if (res.data.success) setTemplates(res.data.templates);
    } catch (err) {
      console.error('Failed to fetch templates:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.htmlTemplate.trim()) return;
    setSaving(true);
    try {
      await adminTemplatesAPI.create({ ...form, sortOrder: templates.length });
      setForm(emptyForm);
      await fetchTemplates();
    } catch (err) {
      console.error('Failed to create template:', err);
    } finally {
      setSaving(false);
    }
  };

  // Deactivate rather than delete — saved user resumes still reference templates.
  const handleDeactivate = async (id: string) => {
    try {
      await adminTemplatesAPI.deactivate(id);
      await fetchTemplates();
    } catch (err) {
      console.error('Failed to deactivate template:', err);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="font-display text-2xl font-bold text-strong">Resume Templates</h2>
        <p className="mt-1 text-sm text-text-muted">
          Templates offered in the resume builder. Archiving hides a template from new resumes without breaking existing ones.
        </p>
      </div>

      <form onSubmit={handleCreate} className="space-y-4 rounded-xl border border-line bg-bg-surface p-4">
        <div className="flex flex-wrap gap-3">
          <div className="flex-1 min-w-[180px]">
            <label className="mb-1 block text-xs font-medium text-text-muted">Template Name</label>
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Modern Professional"
              className="w-full rounded-lg border border-line bg-bg-card px-3 py-2 text-sm text-strong placeholder:text-text-muted/50 focus:border-brand-orange focus:outline-none"
            />
          </div>
          <div className="w-40">
            <label className="mb-1 block text-xs font-medium text-text-muted">Category</label>
            <select
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value as TemplateCategory })}
              className="w-full rounded-lg border border-line bg-bg-card px-3 py-2 text-sm text-strong focus:border-brand-orange focus:outline-none"
            >
              <option value="FREE">Free</option>
              <option value="PREMIUM">Premium</option>
            </select>
          </div>
          <div className="flex-1 min-w-[180px]">
            <label className="mb-1 block text-xs font-medium text-text-muted">Thumbnail URL</label>
            <input
              value={form.thumbnail}
              onChange={(e) => setForm({ ...form, thumbnail: e.target.value })}
              placeholder="https://…"
              className="w-full rounded-lg border border-line bg-bg-card px-3 py-2 text-sm text-strong placeholder:text-text-muted/50 focus:border-brand-orange focus:outline-none"
            />
          </div>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-text-muted">HTML Template</label>
          <textarea
            value={form.htmlTemplate}
            onChange={(e) => setForm({ ...form, htmlTemplate: e.target.value })}
            placeholder="<div class='resume'>{{fullName}}</div>"
            rows={4}
            className="w-full rounded-lg border border-line bg-bg-card px-3 py-2 font-mono text-xs text-strong placeholder:text-text-muted/50 focus:border-brand-orange focus:outline-none"
          />
        </div>
        <button
          type="submit"
          disabled={saving}
          className="flex items-center gap-2 rounded-lg bg-brand-orange px-4 py-2 text-sm font-semibold text-on-brand transition-colors hover:bg-orange-600 disabled:opacity-50"
        >
          <Plus size={16} />
          Add Template
        </button>
      </form>

      {loading ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-56 animate-pulse rounded-xl border border-line bg-bg-surface" />
          ))}
        </div>
      ) : templates.length === 0 ? (
        <p className="rounded-xl border border-line bg-bg-surface p-8 text-center text-sm text-text-muted">
          No templates yet.
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {templates.map((template) => (
            <div
              key={template.id}
              className={clsx(
                'overflow-hidden rounded-xl border bg-bg-surface',
                template.isActive ? 'border-line' : 'border-line-subtle opacity-50'
              )}
            >
              <div className="flex aspect-[3/4] items-center justify-center border-b border-line bg-bg-card">
                {template.thumbnail ? (
                  <img src={template.thumbnail} alt="" className="h-full w-full object-cover" />
                ) : (
                  <FileText size={28} className="text-text-muted" />
                )}
              </div>
              <div className="p-3">
                <div className="flex items-start justify-between gap-2">
                  {editingId === template.id ? (
                    <div className="flex min-w-0 flex-1 items-center gap-1">
                      <input
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="w-full rounded border border-line bg-bg-canvas px-2 py-1 text-xs text-strong focus:border-brand-orange focus:outline-none"
                      />
                      <button onClick={() => saveEdit(template.id, template.category)} className="text-green-400"><Check size={14} /></button>
                      <button onClick={() => setEditingId(null)} className="text-text-muted"><X size={14} /></button>
                    </div>
                  ) : (
                    <h3
                      onClick={() => { setEditingId(template.id); setEditName(template.name); }}
                      title="Click to rename"
                      className="flex min-w-0 flex-1 cursor-pointer items-center gap-1 truncate text-sm font-medium text-strong hover:text-brand-orange"
                    >
                      <span className="truncate">{template.name}</span>
                      <Pencil size={11} className="shrink-0 opacity-50" />
                    </h3>
                  )}
                  <button
                    onClick={() => toggleTier(template)}
                    title="Switch between Free and Premium"
                    className={clsx(
                      'shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold transition-opacity hover:opacity-80',
                      template.category === 'PREMIUM'
                        ? 'bg-brand-orange/10 text-brand-orange'
                        : 'bg-elevate text-text-muted'
                    )}
                  >
                    {template.category}
                  </button>
                </div>
                {template.isActive && (
                  <button
                    onClick={() => handleDeactivate(template.id)}
                    className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-lg border border-line py-1.5 text-xs text-text-muted transition-colors hover:bg-elevate hover:text-strong"
                  >
                    <Archive size={13} />
                    Archive
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ResumeTemplates;
