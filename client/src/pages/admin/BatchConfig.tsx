import { useState, useEffect } from 'react';
import { Layers, Plus, Calendar, FolderSymlink, CheckCircle2, X } from 'lucide-react';
import api from '../../services/api';

const BatchConfig = () => {
  const [batches, setBatches] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [form, setForm] = useState({
    name: '',
    courseId: '',
    startDate: '',
    endDate: '', // Max student access duration
    driveFolder: '',
    maxStudents: 30,
  });

  useEffect(() => {
    fetchData();
  }, []);

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
      await api.post('/admin/batches', form);
      setIsModalOpen(false);
      setForm({ name: '', courseId: '', startDate: '', endDate: '', driveFolder: '', maxStudents: 30 });
      fetchData();
    } catch (err) {
      console.error('Failed to create batch:', err);
    }
  };

  return (
    <div className="space-y-6 p-6 text-white">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold">Batch & Cohort Configuration</h1>
          <p className="text-xs text-text-muted">Configure cohort start dates, student access expiration dates, and Google Drive folders.</p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 rounded-lg bg-brand-orange px-4 py-2 text-sm font-semibold text-white hover:bg-brand-orange/90"
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
            <div key={batch.id} className="rounded-xl border border-white/[0.08] bg-bg-surface p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
                <span className="text-xs font-bold text-brand-orange uppercase">{batch.course?.title || 'Cohort'}</span>
                <span className="rounded bg-green-500/10 px-2 py-0.5 text-xs font-semibold text-green-400">{batch.status}</span>
              </div>

              <h3 className="font-display text-lg font-bold text-white">{batch.name}</h3>

              <div className="space-y-2 text-xs text-text-muted">
                <div className="flex items-center justify-between">
                  <span>Start Date:</span>
                  <span className="font-medium text-white">{new Date(batch.startDate).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-brand-orange font-semibold">Max Student Access End Date:</span>
                  <span className="font-bold text-white">{new Date(batch.endDate).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Enrolled Students:</span>
                  <span className="font-medium text-white">{batch._count?.students || 0} / {batch.maxStudents}</span>
                </div>
              </div>

              {batch.driveFolder && (
                <div className="pt-2 border-t border-white/[0.08]">
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-xl border border-white/[0.08] bg-bg-surface p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
              <h3 className="font-display text-lg font-bold text-white">Create New Batch</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-text-muted hover:text-white"><X size={20} /></button>
            </div>

            <form onSubmit={handleCreateBatch} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-text-muted">Batch Name</label>
                <input
                  type="text" required placeholder="Batch 18 - GenAI Masterclass" value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-white/[0.08] bg-bg-card p-2 text-sm text-white focus:border-brand-orange"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-text-muted">Link Course</label>
                <select
                  required value={form.courseId}
                  onChange={(e) => setForm({ ...form, courseId: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-white/[0.08] bg-bg-card p-2 text-sm text-white focus:border-brand-orange"
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
                    className="mt-1 w-full rounded-lg border border-white/[0.08] bg-bg-card p-2 text-xs text-white"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-brand-orange">End Date (Max Access)</label>
                  <input
                    type="date" required value={form.endDate}
                    onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-brand-orange/50 bg-bg-card p-2 text-xs text-white"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-text-muted">Google Drive Folder Link</label>
                <input
                  type="url" placeholder="https://drive.google.com/drive/folders/..." value={form.driveFolder}
                  onChange={(e) => setForm({ ...form, driveFolder: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-white/[0.08] bg-bg-card p-2 text-sm text-white focus:border-brand-orange"
                />
              </div>

              <button type="submit" className="w-full rounded-lg bg-brand-orange py-2.5 text-sm font-semibold text-white hover:bg-brand-orange/90">
                Save Batch Config
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default BatchConfig;
