import { useState, useEffect } from 'react';
import { Plus, Minus, Trash2, Eye, EyeOff, Award, Search, Pencil, Check, X } from 'lucide-react';
import { clsx } from 'clsx';
import api from '../../services/api';
import ConfirmDialog from '../../components/ConfirmDialog';

interface Certification {
  id: string;
  name: string;
  provider: string | null;
  link: string | null;
  prerequisite: string | null;
  isActive: boolean;
  ctaEnabled: boolean;
}

const emptyForm = { name: '', provider: '', link: '', prerequisite: '' };

const field =
  'w-full rounded-lg border border-line bg-bg-card px-3 py-2 text-sm text-strong placeholder:text-text-muted/50 focus:border-brand-orange focus:outline-none';

const PAGE_SIZE = 25;

const CertificationsManager = () => {
  const [items, setItems] = useState<Certification[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState(emptyForm);
  const [pendingDelete, setPendingDelete] = useState<Certification | null>(null);

  useEffect(() => {
    fetchCertifications();
    // Debounce isn't needed at this size; the list is server-paginated.
  }, [page, search]);

  const fetchCertifications = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/certifications', {
        params: { page, limit: PAGE_SIZE, search: search || undefined },
      });
      if (res.data.success) {
        setItems(res.data.certifications);
        setTotal(res.data.pagination.total);
      }
    } catch (err) {
      console.error('Failed to load certifications:', err);
    } finally {
      setLoading(false);
    }
  };

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      await api.post('/admin/certifications', form);
      setForm(emptyForm);
      setFormOpen(false);
      await fetchCertifications();
    } catch (err) {
      console.error('Failed to create certification:', err);
    } finally {
      setSaving(false);
    }
  };

  const saveEdit = async (id: string) => {
    try {
      await api.patch(`/admin/certifications/${id}`, editForm);
      setEditingId(null);
      await fetchCertifications();
    } catch (err) {
      console.error('Failed to update certification:', err);
    }
  };

  const toggle = async (cert: Certification, key: 'isActive' | 'ctaEnabled') => {
    try {
      await api.patch(`/admin/certifications/${cert.id}`, { [key]: !cert[key] });
      await fetchCertifications();
    } catch (err) {
      console.error('Failed to update certification:', err);
    }
  };

  const remove = async (cert: Certification) => {
    try {
      await api.delete(`/admin/certifications/${cert.id}`);
      setPendingDelete(null);
      await fetchCertifications();
    } catch (err) {
      console.error('Failed to delete certification:', err);
    }
  };

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="space-y-6">
      {pendingDelete && (
        <ConfirmDialog
          title={`Remove "${pendingDelete.name}"?`}
          message="It will no longer appear in the catalogue or be selectable for courses."
          confirmLabel="Remove"
          onConfirm={() => remove(pendingDelete)}
          onCancel={() => setPendingDelete(null)}
        />
      )}

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl font-bold text-strong">Certifications</h2>
          <p className="mt-1 text-sm text-text-muted">
            The public catalogue. {total} certification{total === 1 ? '' : 's'} — hide one to keep it on
            record without listing it.
          </p>
        </div>
        <button
          onClick={() => setFormOpen((v) => !v)}
          className="flex items-center gap-2 rounded-lg bg-brand-orange px-4 py-2 text-sm font-semibold text-on-brand transition-colors hover:bg-orange-600"
        >
          {formOpen ? <Minus size={16} /> : <Plus size={16} />}
          {formOpen ? 'Cancel' : 'New Certification'}
        </button>
      </div>

      {formOpen && (
        <form onSubmit={create} className="flex flex-wrap items-end gap-3 rounded-xl border border-line bg-bg-surface p-4">
          <div className="flex-1 min-w-[220px]">
            <label className="mb-1 block text-xs font-medium text-text-muted">Name</label>
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="AWS Certified Solutions Architect" className={field} />
          </div>
          <div className="w-48">
            <label className="mb-1 block text-xs font-medium text-text-muted">Provider</label>
            <input value={form.provider} onChange={(e) => setForm({ ...form, provider: e.target.value })}
              placeholder="Amazon Web Services" className={field} />
          </div>
          <div className="flex-1 min-w-[200px]">
            <label className="mb-1 block text-xs font-medium text-text-muted">Registration Link</label>
            <input value={form.link} onChange={(e) => setForm({ ...form, link: e.target.value })}
              placeholder="https://…" className={field} />
          </div>
          <button type="submit" disabled={saving}
            className="flex items-center gap-2 rounded-lg bg-brand-orange px-4 py-2 text-sm font-semibold text-on-brand transition-colors hover:bg-orange-600 disabled:opacity-50">
            <Plus size={16} /> Add
          </button>
        </form>
      )}

      <div className="relative">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
        <input
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          placeholder="Search by name or provider…"
          className={clsx(field, 'pl-9')}
        />
      </div>

      <div className="overflow-hidden rounded-xl border border-line bg-bg-surface">
        {loading ? (
          <div className="space-y-px">
            {[1, 2, 3, 4, 5].map((i) => <div key={i} className="h-14 animate-pulse bg-bg-card" />)}
          </div>
        ) : items.length === 0 ? (
          <p className="p-8 text-center text-sm text-text-muted">No certifications match that search.</p>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="border-b border-line text-xs uppercase tracking-wider text-text-muted">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Provider</th>
                <th className="px-4 py-3">Enquiry CTA</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((cert) => (
                <tr key={cert.id} className={clsx('border-b border-line-subtle last:border-0', !cert.isActive && 'opacity-50')}>
                  {editingId === cert.id ? (
                    <>
                      <td className="px-4 py-2">
                        <input value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} className={field} />
                      </td>
                      <td className="px-4 py-2">
                        <input value={editForm.provider} onChange={(e) => setEditForm({ ...editForm, provider: e.target.value })} className={field} />
                      </td>
                      <td className="px-4 py-2 text-xs text-text-muted">—</td>
                      <td className="px-4 py-2">
                        <div className="flex items-center justify-end gap-2">
                          <button onClick={() => saveEdit(cert.id)} title="Save"
                            className="rounded p-1.5 text-green-400 transition-colors hover:bg-green-500/10">
                            <Check size={16} />
                          </button>
                          <button onClick={() => setEditingId(null)} title="Cancel"
                            className="rounded p-1.5 text-text-muted transition-colors hover:text-strong">
                            <X size={16} />
                          </button>
                        </div>
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="px-4 py-3 font-medium text-strong">
                        <div className="flex items-center gap-2">
                          <Award size={14} className="shrink-0 text-brand-orange" />
                          <span className="line-clamp-1">{cert.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-text-muted">{cert.provider || '—'}</td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => toggle(cert, 'ctaEnabled')}
                          className={clsx(
                            'rounded-full px-2 py-0.5 text-xs font-medium transition-colors',
                            cert.ctaEnabled ? 'bg-green-500/10 text-green-400' : 'bg-elevate text-text-muted'
                          )}
                        >
                          {cert.ctaEnabled ? 'On' : 'Off'}
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => { setEditingId(cert.id); setEditForm({ name: cert.name, provider: cert.provider ?? '', link: cert.link ?? '', prerequisite: cert.prerequisite ?? '' }); }}
                            title="Edit"
                            className="rounded p-1.5 text-text-muted transition-colors hover:bg-elevate hover:text-strong"
                          >
                            <Pencil size={15} />
                          </button>
                          <button onClick={() => toggle(cert, 'isActive')} title={cert.isActive ? 'Hide from catalogue' : 'Show in catalogue'}
                            className="rounded p-1.5 text-text-muted transition-colors hover:bg-elevate hover:text-strong">
                            {cert.isActive ? <EyeOff size={15} /> : <Eye size={15} />}
                          </button>
                          <button onClick={() => setPendingDelete(cert)} title="Remove"
                            className="rounded p-1.5 text-text-muted transition-colors hover:bg-red-500/10 hover:text-red-400">
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between text-xs text-text-muted">
          <span>Page {page} of {totalPages}</span>
          <div className="flex gap-2">
            <button disabled={page === 1} onClick={() => setPage((p) => p - 1)}
              className="rounded-lg border border-line px-3 py-1.5 transition-colors hover:text-strong disabled:opacity-40">
              Previous
            </button>
            <button disabled={page === totalPages} onClick={() => setPage((p) => p + 1)}
              className="rounded-lg border border-line px-3 py-1.5 transition-colors hover:text-strong disabled:opacity-40">
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CertificationsManager;
