import { useState, useEffect } from 'react';
import { Plus, Trash2, Eye, EyeOff, Briefcase } from 'lucide-react';
import { clsx } from 'clsx';
import { adminCorporateAPI } from '../../services/api';

interface CorporateCourse {
  id: string;
  courseId: string;
  customDescription: string | null;
  targetAudience: string | null;
  isActive: boolean;
  sortOrder: number;
  course: { title: string; category: string } | null;
}

interface CourseOption {
  id: string;
  title: string;
}

const CorporateCourses = () => {
  const [entries, setEntries] = useState<CorporateCourse[]>([]);
  const [courses, setCourses] = useState<CourseOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ courseId: '', customDescription: '', targetAudience: '' });

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const res = await adminCorporateAPI.getAll();
      if (res.data.success) {
        setEntries(res.data.corporateCourses);
        setCourses(res.data.courses);
        setForm((f) => ({ ...f, courseId: f.courseId || res.data.courses[0]?.id || '' }));
      }
    } catch (err) {
      console.error('Failed to fetch corporate courses:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.courseId) return;
    setSaving(true);
    try {
      await adminCorporateAPI.add({ ...form, sortOrder: entries.length });
      setForm({ courseId: courses[0]?.id || '', customDescription: '', targetAudience: '' });
      await fetchAll();
    } catch (err) {
      console.error('Failed to add corporate course:', err);
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (entry: CorporateCourse) => {
    try {
      await adminCorporateAPI.update(entry.id, { isActive: !entry.isActive });
      await fetchAll();
    } catch (err) {
      console.error('Failed to toggle corporate course:', err);
    }
  };

  const handleRemove = async (id: string) => {
    try {
      await adminCorporateAPI.remove(id);
      await fetchAll();
    } catch (err) {
      console.error('Failed to remove corporate course:', err);
    }
  };

  // Courses already on the corporate page shouldn't be offered again.
  const available = courses.filter((c) => !entries.some((e) => e.courseId === c.id));

  return (
    <div className="space-y-8">
      <div>
        <h2 className="font-display text-2xl font-bold text-strong">Corporate Courses</h2>
        <p className="mt-1 text-sm text-text-muted">
          Courses featured on the public Corporate page, with copy aimed at enterprise buyers.
        </p>
      </div>

      <form onSubmit={handleAdd} className="space-y-4 rounded-xl border border-line bg-bg-surface p-4">
        <div className="flex flex-wrap gap-3">
          <div className="flex-1 min-w-[200px]">
            <label className="mb-1 block text-xs font-medium text-text-muted">Course</label>
            <select
              value={form.courseId}
              onChange={(e) => setForm({ ...form, courseId: e.target.value })}
              className="w-full rounded-lg border border-line bg-bg-card px-3 py-2 text-sm text-strong focus:border-brand-orange focus:outline-none"
            >
              {available.length === 0 && <option value="">All courses already added</option>}
              {available.map((c) => (
                <option key={c.id} value={c.id}>{c.title}</option>
              ))}
            </select>
          </div>
          <div className="flex-1 min-w-[200px]">
            <label className="mb-1 block text-xs font-medium text-text-muted">Target Audience</label>
            <input
              value={form.targetAudience}
              onChange={(e) => setForm({ ...form, targetAudience: e.target.value })}
              placeholder="Engineering teams scaling AI adoption"
              className="w-full rounded-lg border border-line bg-bg-card px-3 py-2 text-sm text-strong placeholder:text-text-muted/50 focus:border-brand-orange focus:outline-none"
            />
          </div>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-text-muted">Corporate Description</label>
          <textarea
            value={form.customDescription}
            onChange={(e) => setForm({ ...form, customDescription: e.target.value })}
            rows={2}
            placeholder="Override the public course copy with enterprise-focused positioning…"
            className="w-full rounded-lg border border-line bg-bg-card px-3 py-2 text-sm text-strong placeholder:text-text-muted/50 focus:border-brand-orange focus:outline-none"
          />
        </div>
        <button
          type="submit"
          disabled={saving || !form.courseId}
          className="flex items-center gap-2 rounded-lg bg-brand-orange px-4 py-2 text-sm font-semibold text-on-brand transition-colors hover:bg-orange-600 disabled:opacity-50"
        >
          <Plus size={16} />
          Add to Corporate Page
        </button>
      </form>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 animate-pulse rounded-xl border border-line bg-bg-surface" />
          ))}
        </div>
      ) : entries.length === 0 ? (
        <p className="rounded-xl border border-line bg-bg-surface p-8 text-center text-sm text-text-muted">
          No courses featured yet — the Corporate page will fall back to its default selection.
        </p>
      ) : (
        <div className="space-y-3">
          {entries.map((entry) => (
            <div
              key={entry.id}
              className={clsx(
                'flex flex-wrap items-start gap-4 rounded-xl border bg-bg-surface p-4',
                entry.isActive ? 'border-line' : 'border-line-subtle opacity-60'
              )}
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-orange/10 text-brand-orange">
                <Briefcase size={18} />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="truncate font-semibold text-strong">{entry.course?.title || 'Unknown course'}</h3>
                {entry.targetAudience && (
                  <p className="mt-0.5 text-xs text-brand-orange">{entry.targetAudience}</p>
                )}
                {entry.customDescription && (
                  <p className="mt-1 line-clamp-2 text-xs text-text-muted">{entry.customDescription}</p>
                )}
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <button
                  onClick={() => toggleActive(entry)}
                  title={entry.isActive ? 'Hide from Corporate page' : 'Show on Corporate page'}
                  className="rounded p-1.5 text-text-muted transition-colors hover:bg-elevate hover:text-strong"
                >
                  {entry.isActive ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
                <button
                  onClick={() => handleRemove(entry.id)}
                  title="Remove"
                  className="rounded p-1.5 text-text-muted transition-colors hover:bg-red-500/10 hover:text-red-400"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CorporateCourses;
