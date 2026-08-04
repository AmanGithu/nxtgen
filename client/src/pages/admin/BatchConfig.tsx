import { useState, useEffect } from 'react';
import { Layers, Plus, Minus, Calendar, FolderSymlink, CheckCircle2, X, Trash2, Archive, Pencil, Megaphone, Users } from 'lucide-react';
import ConfirmDialog from '../../components/ConfirmDialog';
import BatchRoster from './BatchRoster';
import api from '../../services/api';

const BatchConfig = () => {
  const [batches, setBatches] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<{ batch: any; message: string } | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [rosterBatch, setRosterBatch] = useState<any>(null);

  const blankForm = {
    name: '',
    courseId: '',
    startDate: '',
    endDate: '', // Max student access duration
    driveFolder: '',
    maxStudents: 30,
    webinarDate: '',
    isPublished: false,
  };
  const [form, setForm] = useState(blankForm);

  /** Dates arrive as ISO strings; the date inputs need yyyy-mm-dd. */
  const asDateInput = (v?: string | null) => (v ? new Date(v).toISOString().slice(0, 10) : '');

  const openCreate = () => {
    setEditingId(null);
    setForm(blankForm);
    setIsModalOpen(true);
  };

  const openEdit = (batch: any) => {
    setEditingId(batch.id);
    setForm({
      name: batch.name ?? '',
      courseId: batch.courseId ?? '',
      startDate: asDateInput(batch.startDate),
      endDate: asDateInput(batch.endDate),
      driveFolder: batch.driveFolder ?? '',
      maxStudents: batch.maxStudents ?? 30,
      webinarDate: asDateInput(batch.webinarDate),
      isPublished: !!batch.isPublished,
    });
    setIsModalOpen(true);
  };

  /** Publishing puts the batch on the public Upcoming Batches page. */
  const togglePublished = async (batch: any) => {
    setBusyId(batch.id);
    try {
      await api.patch(`/admin/batches/${batch.id}`, { isPublished: !batch.isPublished });
      await fetchData();
    } catch (err) {
      console.error('Failed to change publish state:', err);
    } finally {
      setBusyId(null);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  /** Archiving keeps the cohort's record — the safe alternative to deleting. */
  const archiveBatch = async (batch: any) => {
    setBusyId(batch.id);
    try {
      await api.patch(`/admin/batches/${batch.id}`, { status: 'ARCHIVED' });
      await fetchData();
    } catch (err) {
      console.error('Failed to archive batch:', err);
    } finally {
      setBusyId(null);
    }
  };

  /* Deleting cascades to enrolments, classes and materials. The server refuses
     the first attempt and returns what would be destroyed; that message is
     shown for confirmation before retrying with ?confirm=true. */
  const deleteBatch = async (batch: any, confirmed = false) => {
    setBusyId(batch.id);
    try {
      const res = await api.delete(`/admin/batches/${batch.id}${confirmed ? '?confirm=true' : ''}`);
      if (res.data.success) {
        setPendingDelete(null);
        await fetchData();
      }
    } catch (err: any) {
      const data = err.response?.data;
      if (data?.requiresConfirmation) {
        setPendingDelete({ batch, message: data.message });
      } else {
        console.error('Failed to delete batch:', err);
      }
    } finally {
      setBusyId(null);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const [batchesRes, coursesRes] = await Promise.all([
        api.get('/admin/batches'),
        api.get('/courses')
      ]);
      if (batchesRes.data.success) setBatches(batchesRes.data.batches);
      if (coursesRes.data.success) setCourses(coursesRes.data.courses);
    } catch (err) {
      console.error('Failed to fetch batches:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBatch = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = { ...form, webinarDate: form.webinarDate || null };
      if (editingId) await api.patch(`/admin/batches/${editingId}`, payload);
      else await api.post('/admin/batches', payload);
      setIsModalOpen(false);
      setEditingId(null);
      setForm(blankForm);
      fetchData();
    } catch (err) {
      console.error(editingId ? 'Failed to update batch:' : 'Failed to create batch:', err);
    }
  };

  return (
    <div className="space-y-6 p-6 text-strong">
      {rosterBatch && (
        <BatchRoster
          batch={rosterBatch}
          onClose={() => setRosterBatch(null)}
          onChanged={fetchData}
        />
      )}
      {pendingDelete && (
        <ConfirmDialog
          title={`Delete "${pendingDelete.batch.name}"?`}
          message={pendingDelete.message}
          confirmLabel="Delete permanently"
          altLabel="Archive instead"
          onAlt={() => { archiveBatch(pendingDelete.batch); setPendingDelete(null); }}
          onConfirm={() => deleteBatch(pendingDelete.batch, true)}
          onCancel={() => setPendingDelete(null)}
        />
      )}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold">Batch & Cohort Configuration</h1>
          <p className="text-xs text-text-muted">Configure cohort start dates, student access expiration dates, and Google Drive folders.</p>
        </div>

        <button
          onClick={openCreate}
          className="flex items-center gap-2 rounded-lg bg-brand-orange px-4 py-2 text-sm font-semibold text-on-brand hover:bg-brand-orange/90"
        >
          <Plus size={16} />
          Create New Batch
        </button>
      </div>

      {/* Batches Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {loading ? (
          <p className="text-sm text-text-muted">Loading batch configurations...</p>
        ) : batches.length === 0 ? (
          <p className="text-sm text-text-muted">No active batches configured.</p>
        ) : (
          batches.map((batch) => (
            <div key={batch.id} className="rounded-xl border border-line bg-bg-surface p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-line pb-3">
                <span className="text-xs font-bold text-brand-orange uppercase">{batch.course?.title || 'Cohort'}</span>
                <span className="rounded bg-green-500/10 px-2 py-0.5 text-xs font-semibold text-green-400">{batch.status}</span>
              </div>

              <h3 className="font-display text-lg font-bold text-strong">{batch.name}</h3>

              <div className="space-y-2 text-xs text-text-muted">
                <div className="flex items-center justify-between">
                  <span>Start Date:</span>
                  <span className="font-medium text-strong">{new Date(batch.startDate).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-brand-orange font-semibold">Max Student Access End Date:</span>
                  <span className="font-bold text-strong">{new Date(batch.endDate).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Enrolled Students:</span>
                  <span className="font-medium text-strong">{batch._count?.students || 0} / {batch.maxStudents}</span>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-line">
                <button
                  onClick={() => setRosterBatch(batch)}
                  title="View and enrol students"
                  className="flex items-center gap-1.5 rounded-lg border border-line px-3 py-1.5 text-xs text-text-muted transition-colors hover:text-strong"
                >
                  <Users size={13} /> Students
                </button>
                <button
                  onClick={() => openEdit(batch)}
                  title="Edit this batch"
                  className="flex items-center gap-1.5 rounded-lg border border-line px-3 py-1.5 text-xs text-text-muted transition-colors hover:text-strong"
                >
                  <Pencil size={13} /> Edit
                </button>
                <button
                  onClick={() => togglePublished(batch)}
                  disabled={busyId === batch.id}
                  title={batch.isPublished ? 'Remove from the public Upcoming page' : 'Show on the public Upcoming page'}
                  className={
                    'flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs transition-colors disabled:opacity-50 ' +
                    (batch.isPublished
                      ? 'border-brand-orange/40 text-brand-orange'
                      : 'border-line text-text-muted hover:text-strong')
                  }
                >
                  <Megaphone size={13} /> {batch.isPublished ? 'Published' : 'Publish'}
                </button>
                {batch.status !== 'ARCHIVED' && (
                  <button
                    onClick={() => archiveBatch(batch)}
                    disabled={busyId === batch.id}
                    title="Archive — keeps the record"
                    className="flex items-center gap-1.5 rounded-lg border border-line px-3 py-1.5 text-xs text-text-muted transition-colors hover:text-strong disabled:opacity-50"
                  >
                    <Archive size={13} /> Archive
                  </button>
                )}
                <button
                  onClick={() => deleteBatch(batch)}
                  disabled={busyId === batch.id}
                  title="Delete permanently"
                  className="flex items-center gap-1.5 rounded-lg border border-line px-3 py-1.5 text-xs text-text-muted transition-colors hover:border-red-500/40 hover:text-red-400 disabled:opacity-50"
                >
                  <Trash2 size={13} /> Delete
                </button>
              </div>

              {batch.driveFolder && (
                <div className="pt-2 border-t border-line">
                  <a
                    href={batch.driveFolder}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-2 text-xs text-brand-orange hover:underline"
                  >
                    <FolderSymlink size={14} />
                    Open Google Drive Folder
                  </a>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* CREATE BATCH MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-overlay p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-xl border border-line bg-bg-surface p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-line pb-3">
              <h3 className="font-display text-lg font-bold text-strong">{editingId ? 'Edit Batch' : 'Create New Batch'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-text-muted hover:text-strong"><X size={20} /></button>
            </div>

            <form onSubmit={handleCreateBatch} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-text-muted">Batch Name</label>
                <input
                  type="text" required placeholder="Batch 18 - GenAI Masterclass" value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-line bg-bg-card p-2 text-sm text-strong focus:border-brand-orange"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-text-muted">Link Course</label>
                <select
                  required value={form.courseId}
                  onChange={(e) => setForm({ ...form, courseId: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-line bg-bg-card p-2 text-sm text-strong focus:border-brand-orange"
                >
                  <option value="">Select Course</option>
                  {courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-text-muted">Start Date</label>
                  <input
                    type="date" required value={form.startDate}
                    onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-line bg-bg-card p-2 text-xs text-strong"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-brand-orange">End Date (Max Access)</label>
                  <input
                    type="date" required value={form.endDate}
                    onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-brand-orange/50 bg-bg-card p-2 text-xs text-strong"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-text-muted">Google Drive Folder Link</label>
                <input
                  type="url" placeholder="https://drive.google.com/drive/folders/..." value={form.driveFolder}
                  onChange={(e) => setForm({ ...form, driveFolder: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-line bg-bg-card p-2 text-sm text-strong focus:border-brand-orange"
                />
              </div>

              {/* Publishing here is what puts the batch on the public
                  Upcoming Batches page — there is no separate record. */}
              <div className="rounded-lg border border-line bg-bg-card p-3 space-y-3">
                <span className="text-[10px] font-bold uppercase tracking-wider text-brand-orange">
                  Public listing
                </span>
                <label className="flex items-center gap-2 text-xs text-text-muted">
                  <input
                    type="checkbox"
                    checked={form.isPublished}
                    onChange={(e) => setForm({ ...form, isPublished: e.target.checked })}
                    className="h-4 w-4 accent-[#f5820b]"
                  />
                  Show on the public Upcoming Batches page
                </label>
                <div>
                  <label className="mb-1 block text-xs text-text-muted">Pre-launch webinar (optional)</label>
                  <input
                    type="date"
                    value={form.webinarDate}
                    onChange={(e) => setForm({ ...form, webinarDate: e.target.value })}
                    className="w-full rounded-lg border border-line bg-bg-surface p-2.5 text-sm text-strong focus:border-brand-orange focus:outline-none"
                  />
                </div>
              </div>

              <button type="submit" className="w-full rounded-lg bg-brand-orange py-2.5 text-sm font-semibold text-on-brand hover:bg-brand-orange/90">
                {editingId ? 'Save Changes' : 'Create Batch'}
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default BatchConfig;
