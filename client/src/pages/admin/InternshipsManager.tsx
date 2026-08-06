import { useState, useEffect } from 'react';
import { Plus, Eye, EyeOff, Briefcase, Trash2 } from 'lucide-react';
import ConfirmDialog from '../../components/ConfirmDialog';
import { clsx } from 'clsx';
import { adminInternshipsAPI } from '../../services/api';

type ProgramType = 'GENERATIVE_AI' | 'AGENTIC_AI';

interface ProjectHighlight {
  title: string;
  description: string;
}

interface Internship {
  id: string;
  title: string;
  description: string;
  programType: ProgramType;
  duration: string;
  eligibility: string | null;
  applicationLink: string | null;
  projectHighlights: ProjectHighlight[] | null;
  isActive: boolean;
}

const emptyForm = {
  title: '',
  description: '',
  programType: 'GENERATIVE_AI' as ProgramType,
  duration: '12 Weeks',
  eligibility: '',
  applicationLink: '/internship',
};

const InternshipsManager = () => {
  const [internships, setInternships] = useState<Internship[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [pendingDelete, setPendingDelete] = useState<Internship | null>(null);

  useEffect(() => {
    fetchInternships();
  }, []);

  const fetchInternships = async () => {
    setLoading(true);
    try {
      const res = await adminInternshipsAPI.getAll();
      if (res.data.success) setInternships(res.data.internships);
    } catch (err) {
      console.error('Failed to fetch internships:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.description.trim()) return;
    setSaving(true);
    try {
      await adminInternshipsAPI.create(form);
      setForm(emptyForm);
      await fetchInternships();
    } catch (err) {
      console.error('Failed to create internship:', err);
    } finally {
      setSaving(false);
    }
  };

  const removeInternship = async (item: Internship) => {
    try {
      await adminInternshipsAPI.deactivate(item.id);
      setPendingDelete(null);
      await fetchInternships();
    } catch (err) {
      console.error('Failed to remove internship:', err);
    }
  };

  const toggleActive = async (item: Internship) => {
    try {
      await adminInternshipsAPI.update(item.id, { isActive: !item.isActive });
      await fetchInternships();
    } catch (err) {
      console.error('Failed to toggle internship:', err);
    }
  };

  return (
    <div className="space-y-8">
      {pendingDelete && (
        <ConfirmDialog
          title={`Remove "${pendingDelete.title}"?`}
          message="The programme stops accepting applications and disappears from the public Internship page. Existing applications are kept."
          confirmLabel="Remove programme"
          onConfirm={() => removeInternship(pendingDelete)}
          onCancel={() => setPendingDelete(null)}
        />
      )}
      <div>
        <h2 className="font-display text-2xl font-bold text-strong">Internship Programs</h2>
        <p className="mt-1 text-sm text-text-muted">
          Programmes shown on the public Internship page. Hidden programmes stop accepting applications.
        </p>
      </div>

      <form onSubmit={handleCreate} className="space-y-4 rounded-xl border border-line bg-bg-surface p-4">
        <div className="flex flex-wrap gap-3">
          <div className="flex-1 min-w-[200px]">
            <label className="mb-1 block text-xs font-medium text-text-muted">Programme Title</label>
            <input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="Generative AI Internship Program"
              className="w-full rounded-lg border border-line bg-bg-card px-3 py-2 text-sm text-strong placeholder:text-text-muted/50 focus:border-brand-orange focus:outline-none"
            />
          </div>
          <div className="w-48">
            <label className="mb-1 block text-xs font-medium text-text-muted">Type</label>
            <select
              value={form.programType}
              onChange={(e) => setForm({ ...form, programType: e.target.value as ProgramType })}
              className="w-full rounded-lg border border-line bg-bg-card px-3 py-2 text-sm text-strong focus:border-brand-orange focus:outline-none"
            >
              <option value="GENERATIVE_AI">Generative AI</option>
              <option value="AGENTIC_AI">Agentic AI</option>
            </select>
          </div>
          <div className="w-36">
            <label className="mb-1 block text-xs font-medium text-text-muted">Duration</label>
            <input
              value={form.duration}
              onChange={(e) => setForm({ ...form, duration: e.target.value })}
              className="w-full rounded-lg border border-line bg-bg-card px-3 py-2 text-sm text-strong focus:border-brand-orange focus:outline-none"
            />
          </div>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-text-muted">Description</label>
          <textarea
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            rows={3}
            placeholder="Hands-on 12-week intensive building production-grade AI software…"
            className="w-full rounded-lg border border-line bg-bg-card px-3 py-2 text-sm text-strong placeholder:text-text-muted/50 focus:border-brand-orange focus:outline-none"
          />
        </div>
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex-1 min-w-[200px]">
            <label className="mb-1 block text-xs font-medium text-text-muted">Eligibility</label>
            <input
              value={form.eligibility}
              onChange={(e) => setForm({ ...form, eligibility: e.target.value })}
              placeholder="Intermediate Python developers…"
              className="w-full rounded-lg border border-line bg-bg-card px-3 py-2 text-sm text-strong placeholder:text-text-muted/50 focus:border-brand-orange focus:outline-none"
            />
          </div>
          <div className="w-48">
            <label className="mb-1 block text-xs font-medium text-text-muted">Application Link</label>
            <input
              value={form.applicationLink}
              onChange={(e) => setForm({ ...form, applicationLink: e.target.value })}
              className="w-full rounded-lg border border-line bg-bg-card px-3 py-2 text-sm text-strong focus:border-brand-orange focus:outline-none"
            />
          </div>
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 rounded-lg bg-brand-orange px-4 py-2 text-sm font-semibold text-on-brand transition-colors hover:bg-orange-600 disabled:opacity-50"
          >
            <Plus size={16} />
            Add Programme
          </button>
        </div>
      </form>

      {loading ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {[1, 2].map((i) => (
            <div key={i} className="h-48 animate-pulse rounded-xl border border-line bg-bg-surface" />
          ))}
        </div>
      ) : internships.length === 0 ? (
        <p className="rounded-xl border border-line bg-bg-surface p-8 text-center text-sm text-text-muted">
          No internship programmes yet.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {internships.map((item) => (
            <div
              key={item.id}
              className={clsx(
                'rounded-xl border bg-bg-surface p-5',
                item.isActive ? 'border-line' : 'border-line-subtle opacity-60'
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-orange/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-brand-orange">
                    <Briefcase size={11} />
                    {item.programType === 'AGENTIC_AI' ? 'Agentic AI' : 'Generative AI'}
                  </span>
                  <h3 className="mt-2 truncate font-semibold text-strong">{item.title}</h3>
                  <p className="mt-1 line-clamp-2 text-xs text-text-muted">{item.description}</p>
                </div>
                <button
                  onClick={() => setPendingDelete(item)}
                  title="Remove this programme"
                  className="shrink-0 rounded p-1.5 text-text-muted transition-colors hover:bg-red-500/10 hover:text-red-400"
                >
                  <Trash2 size={16} />
                </button>
                <button
                  onClick={() => toggleActive(item)}
                  title={item.isActive ? 'Hide from site' : 'Publish'}
                  className="shrink-0 rounded p-1.5 text-text-muted transition-colors hover:bg-elevate hover:text-strong"
                >
                  {item.isActive ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>

              <div className="mt-3 flex flex-wrap gap-2 text-[11px] text-text-muted">
                <span className="rounded bg-elevate px-2 py-0.5">{item.duration}</span>
                <span
                  className={clsx(
                    'rounded px-2 py-0.5',
                    item.isActive ? 'bg-green-500/10 text-green-400' : 'bg-elevate'
                  )}
                >
                  {item.isActive ? 'Live' : 'Hidden'}
                </span>
                {(item.projectHighlights?.length ?? 0) > 0 && (
                  <span className="rounded bg-elevate px-2 py-0.5">
                    {item.projectHighlights!.length} project{item.projectHighlights!.length === 1 ? '' : 's'}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default InternshipsManager;
