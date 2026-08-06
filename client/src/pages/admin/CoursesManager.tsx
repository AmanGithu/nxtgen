import { useState, useEffect } from 'react';
import { Plus, Minus, Trash2, Eye, EyeOff, BookOpen, ChevronDown, ChevronRight, Layers, Pencil } from 'lucide-react';
import ConfirmDialog from '../../components/ConfirmDialog';
import { clsx } from 'clsx';
import { adminCoursesAPI } from '../../services/api';

type Category = 'AI' | 'DATABASE';

interface CourseModule {
  id?: string;
  title: string;
  duration: string;
  topics: string[];
}

interface Course {
  id: string;
  title: string;
  slug: string;
  category: Category;
  description: string;
  shortDesc: string | null;
  duration: string | null;
  prerequisites: string | null;
  careerOutcomes: string | null;
  modules: CourseModule[] | null;
  isActive: boolean;
  _count?: { batches: number };
}

const emptyModule = (): CourseModule => ({ title: '', duration: '', topics: [] });

const emptyForm = {
  title: '',
  category: 'AI' as Category,
  description: '',
  shortDesc: '',
  duration: '',
  prerequisites: '',
  careerOutcomes: '',
  modules: [emptyModule()],
};

const field =
  'w-full rounded-lg border border-line bg-bg-card px-3 py-2 text-sm text-strong placeholder:text-text-muted/50 focus:border-brand-orange focus:outline-none';

const CoursesManager = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Course | null>(null);

  /** Load an existing course into the form for editing. */
  const openEdit = (course: Course) => {
    setEditingId(course.id);
    setForm({
      title: course.title,
      category: course.category,
      description: course.description ?? '',
      shortDesc: course.shortDesc ?? '',
      duration: course.duration ?? '',
      prerequisites: course.prerequisites ?? '',
      careerOutcomes: course.careerOutcomes ?? '',
      modules: course.modules?.length
        ? course.modules.map((m) => ({ ...m, topics: m.topics ?? [] }))
        : [emptyModule()],
    });
    setFormOpen(true);
    setError('');
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    setLoading(true);
    try {
      const res = await adminCoursesAPI.getAll();
      if (res.data.success) setCourses(res.data.courses);
    } catch (err) {
      console.error('Failed to fetch courses:', err);
    } finally {
      setLoading(false);
    }
  };

  const setModule = (index: number, patch: Partial<CourseModule>) =>
    setForm((f) => ({
      ...f,
      modules: f.modules.map((m, i) => (i === index ? { ...m, ...patch } : m)),
    }));

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.description.trim()) {
      setError('Title and description are required.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const payload = {
        ...form,
        // Drop blank module rows; keep only those with a title.
        modules: form.modules.filter((m) => m.title.trim()),
      };
      if (editingId) await adminCoursesAPI.update(editingId, payload);
      else await adminCoursesAPI.create(payload);
      setForm(emptyForm);
      setEditingId(null);
      setFormOpen(false);
      await fetchCourses();
    } catch (err: any) {
      console.error('Failed to create course:', err);
      setError(err.response?.data?.errors?.[0]?.message || err.response?.data?.message || 'Could not save this course.');
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (course: Course) => {
    try {
      await adminCoursesAPI.update(course.id, { isActive: !course.isActive });
      await fetchCourses();
    } catch (err) {
      console.error('Failed to toggle course:', err);
    }
  };

  const retire = async (course: Course) => {
    try {
      await adminCoursesAPI.retire(course.id);
      await fetchCourses();
    } catch (err) {
      console.error('Failed to retire course:', err);
    }
  };

  return (
    <div className="space-y-8">
      {pendingDelete && (
        <ConfirmDialog
          title={`Retire "${pendingDelete.title}"?`}
          message={
            (pendingDelete._count?.batches ?? 0) > 0
              ? `It disappears from the public site and from new batch selection. ${pendingDelete._count?.batches} existing batch(es) keep working.`
              : 'It disappears from the public site and from new batch selection.'
          }
          confirmLabel="Retire course"
          onConfirm={() => { retire(pendingDelete); setPendingDelete(null); }}
          onCancel={() => setPendingDelete(null)}
        />
      )}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl font-bold text-strong">Courses</h2>
          <p className="mt-1 text-sm text-text-muted">
            The syllabus catalogue. Each course can be run as many batches — batches carry the dates,
            students and materials.
          </p>
        </div>
        <button
          onClick={() => { setFormOpen((v) => !v); setEditingId(null); setForm(emptyForm); }}
          className="flex items-center gap-2 rounded-lg bg-brand-orange px-4 py-2 text-sm font-semibold text-on-brand transition-colors hover:bg-orange-600"
        >
          {formOpen ? <Minus size={16} /> : <Plus size={16} />}
          {formOpen ? 'Cancel' : 'New Course'}
        </button>
      </div>

      {formOpen && (
        <form onSubmit={handleCreate} className="space-y-4 rounded-xl border border-line bg-bg-surface p-5">
          <div className="flex flex-wrap gap-3">
            <div className="flex-1 min-w-[220px]">
              <label className="mb-1 block text-xs font-medium text-text-muted">Course Title</label>
              <input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="PostgreSQL DBA Masterclass"
                className={field}
              />
            </div>
            <div className="w-44">
              <label className="mb-1 block text-xs font-medium text-text-muted">Category</label>
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value as Category })}
                className={field}
              >
                <option value="AI">AI</option>
                <option value="DATABASE">Database Administration</option>
              </select>
            </div>
            <div className="w-36">
              <label className="mb-1 block text-xs font-medium text-text-muted">Duration</label>
              <input
                value={form.duration}
                onChange={(e) => setForm({ ...form, duration: e.target.value })}
                placeholder="12 Weeks"
                className={field}
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-text-muted">Short Description</label>
            <input
              value={form.shortDesc}
              onChange={(e) => setForm({ ...form, shortDesc: e.target.value })}
              placeholder="One line shown on course cards."
              className={field}
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-text-muted">Full Description</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={3}
              placeholder="What this course covers and who it's for…"
              className={field}
            />
          </div>

          <div className="flex flex-wrap gap-3">
            <div className="flex-1 min-w-[220px]">
              <label className="mb-1 block text-xs font-medium text-text-muted">Prerequisites</label>
              <input
                value={form.prerequisites}
                onChange={(e) => setForm({ ...form, prerequisites: e.target.value })}
                placeholder="Basic SQL and Linux familiarity"
                className={field}
              />
            </div>
            <div className="flex-1 min-w-[220px]">
              <label className="mb-1 block text-xs font-medium text-text-muted">Career Outcomes</label>
              <input
                value={form.careerOutcomes}
                onChange={(e) => setForm({ ...form, careerOutcomes: e.target.value })}
                placeholder="Database Administrator, Platform Engineer"
                className={field}
              />
            </div>
          </div>

          {/* Curriculum — stored as JSON on the course */}
          <div className="rounded-lg border border-line-subtle bg-bg-card p-4">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-brand-orange">Curriculum</span>
              <button
                type="button"
                onClick={() => setForm((f) => ({ ...f, modules: [...f.modules, emptyModule()] }))}
                className="flex items-center gap-1.5 rounded-lg border border-line px-3 py-1.5 text-xs text-text-muted transition-colors hover:text-strong"
              >
                <Plus size={13} /> Add module
              </button>
            </div>

            <div className="space-y-3">
              {form.modules.map((m, i) => (
                <div key={i} className="flex flex-wrap items-start gap-2">
                  <span className="mt-2 w-12 shrink-0 text-xs text-text-muted">M{i + 1}</span>
                  <input
                    value={m.title}
                    onChange={(e) => setModule(i, { title: e.target.value })}
                    placeholder="Module title"
                    className={clsx(field, 'flex-1 min-w-[180px]')}
                  />
                  <input
                    value={m.duration}
                    onChange={(e) => setModule(i, { duration: e.target.value })}
                    placeholder="2 Weeks"
                    className={clsx(field, 'w-28')}
                  />
                  <input
                    value={m.topics.join(', ')}
                    onChange={(e) =>
                      setModule(i, { topics: e.target.value.split(',').map((t) => t.trim()).filter(Boolean) })
                    }
                    placeholder="Topics, comma separated"
                    className={clsx(field, 'flex-1 min-w-[200px]')}
                  />
                  {form.modules.length > 1 && (
                    <button
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, modules: f.modules.filter((_, j) => j !== i) }))}
                      className="mt-1 rounded p-1.5 text-text-muted transition-colors hover:bg-red-500/10 hover:text-red-400"
                    >
                      <Trash2 size={15} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {error && (
            <p className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-400">{error}</p>
          )}

          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 rounded-lg bg-brand-orange px-4 py-2 text-sm font-semibold text-on-brand transition-colors hover:bg-orange-600 disabled:opacity-50"
          >
            <Plus size={16} />
            {saving ? 'Saving…' : editingId ? 'Save Changes' : 'Create Course'}
          </button>
        </form>
      )}

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-xl border border-line bg-bg-surface" />
          ))}
        </div>
      ) : courses.length === 0 ? (
        <p className="rounded-xl border border-line bg-bg-surface p-8 text-center text-sm text-text-muted">
          No courses yet — create one to make it available for batches.
        </p>
      ) : (
        <div className="space-y-3">
          {courses.map((course) => {
            const isOpen = expanded === course.id;
            const modules = course.modules ?? [];
            return (
              <div
                key={course.id}
                className={clsx(
                  'rounded-xl border bg-bg-surface',
                  course.isActive ? 'border-line' : 'border-line-subtle opacity-60'
                )}
              >
                <div className="flex flex-wrap items-start gap-4 p-5">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-orange/10 text-brand-orange">
                    <BookOpen size={18} />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-semibold text-strong">{course.title}</h3>
                      <span className="rounded-full bg-brand-orange/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-brand-orange">
                        {course.category === 'AI' ? 'AI' : 'Database'}
                      </span>
                      {!course.isActive && (
                        <span className="rounded bg-elevate px-2 py-0.5 text-[10px] uppercase text-text-muted">
                          Retired
                        </span>
                      )}
                    </div>
                    <p className="mt-1 line-clamp-2 text-xs text-text-muted">
                      {course.shortDesc || course.description}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2 text-[11px] text-text-muted">
                      {course.duration && <span className="rounded bg-elevate px-2 py-0.5">{course.duration}</span>}
                      <span className="rounded bg-elevate px-2 py-0.5">
                        {modules.length} module{modules.length === 1 ? '' : 's'}
                      </span>
                      <span className="rounded bg-elevate px-2 py-0.5">
                        {course._count?.batches ?? 0} batch{(course._count?.batches ?? 0) === 1 ? '' : 'es'}
                      </span>
                      <span className="rounded bg-elevate px-2 py-0.5 font-mono">/{course.slug}</span>
                    </div>
                  </div>

                  <div className="flex shrink-0 items-center gap-2">
                    {modules.length > 0 && (
                      <button
                        onClick={() => setExpanded(isOpen ? null : course.id)}
                        title="Show curriculum"
                        className="rounded p-1.5 text-text-muted transition-colors hover:bg-elevate hover:text-strong"
                      >
                        {isOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                      </button>
                    )}
                    <button
                      onClick={() => openEdit(course)}
                      title="Edit this course"
                      className="rounded p-1.5 text-text-muted transition-colors hover:bg-elevate hover:text-strong"
                    >
                      <Pencil size={16} />
                    </button>
                    <button
                      onClick={() => toggleActive(course)}
                      title={course.isActive ? 'Hide from site' : 'Publish'}
                      className="rounded p-1.5 text-text-muted transition-colors hover:bg-elevate hover:text-strong"
                    >
                      {course.isActive ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                    <button
                      onClick={() => setPendingDelete(course)}
                      title="Retire this course"
                      className="rounded p-1.5 text-text-muted transition-colors hover:bg-red-500/10 hover:text-red-400"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                {isOpen && (
                  <div className="border-t border-line-subtle px-5 py-4">
                    <div className="space-y-2">
                      {modules.map((m, i) => (
                        <div key={m.id || i} className="flex flex-wrap items-baseline gap-2 text-xs">
                          <Layers size={12} className="text-brand-orange" />
                          <span className="font-medium text-strong">{m.title}</span>
                          {m.duration && <span className="text-text-muted">· {m.duration}</span>}
                          {m.topics?.length > 0 && (
                            <span className="text-text-muted">— {m.topics.join(', ')}</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default CoursesManager;
