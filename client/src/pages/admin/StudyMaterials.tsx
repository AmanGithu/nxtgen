import { useState, useEffect } from 'react';
import { BookOpen, Video, FileText, Plus, FolderSymlink, X } from 'lucide-react';
import api from '../../services/api';

const StudyMaterials = () => {
  const [materials, setMaterials] = useState<any[]>([]);
  const [batches, setBatches] = useState<any[]>([]);
  const [selectedBatch, setSelectedBatch] = useState('');
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [form, setForm] = useState({
    batchId: '',
    type: 'NOTES' as 'NOTES' | 'RECORDING' | 'ASSIGNMENT' | 'QUIZ',
    title: '',
    driveFileId: '',
    description: '',
  });

  useEffect(() => {
    fetchData();
  }, [selectedBatch]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [matRes, batchRes] = await Promise.all([
        api.get('/admin/materials', { params: { batchId: selectedBatch || undefined } }),
        api.get('/admin/batches')
      ]);
      if (matRes.data.success) setMaterials(matRes.data.materials);
      if (batchRes.data.success) setBatches(batchRes.data.batches);
    } catch (err) {
      console.error('Failed to fetch materials:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateMaterial = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/admin/materials', form);
      setIsModalOpen(false);
      setForm({ batchId: '', type: 'NOTES', title: '', driveFileId: '', description: '' });
      fetchData();
    } catch (err) {
      console.error('Failed to upload material:', err);
    }
  };

  return (
    <div className="space-y-6 p-6 text-white">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold">Study Materials & Drive Assets</h1>
          <p className="text-xs text-text-muted">Manage protected lecture notes, recorded sessions, and quizzes (sorted Date Descending).</p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 rounded-lg bg-brand-orange px-4 py-2 text-sm font-semibold text-white hover:bg-brand-orange/90"
        >
          <Plus size={16} />
          Upload / Link Material
        </button>
      </div>

      {/* Batch Filter */}
      <div className="flex items-center gap-4 rounded-xl border border-white/[0.08] bg-bg-surface p-4">
        <span className="text-xs font-semibold text-text-muted">Filter by Cohort:</span>
        <select
          value={selectedBatch}
          onChange={(e) => setSelectedBatch(e.target.value)}
          className="rounded-lg border border-white/[0.08] bg-bg-card px-4 py-2 text-sm text-white focus:border-brand-orange"
        >
          <option value="">All Cohorts</option>
          {batches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
        </select>
      </div>

      {/* Materials List */}
      <div className="rounded-xl border border-white/[0.08] bg-bg-surface overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-white/[0.08] bg-bg-card text-xs uppercase text-text-muted">
            <tr>
              <th className="px-6 py-3">Date (Descending)</th>
              <th className="px-6 py-3">Cohort</th>
              <th className="px-6 py-3">Type</th>
              <th className="px-6 py-3">Title</th>
              <th className="px-6 py-3">Google Drive Asset</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.08]">
            {loading ? (
              <tr><td colSpan={5} className="px-6 py-8 text-center text-text-muted">Loading study materials...</td></tr>
            ) : materials.length === 0 ? (
              <tr><td colSpan={5} className="px-6 py-8 text-center text-text-muted">No materials uploaded yet.</td></tr>
            ) : (
              materials.map((m) => (
                <tr key={m.id} className="hover:bg-white/[0.02]">
                  <td className="px-6 py-4 text-xs text-text-muted">{new Date(m.createdAt).toLocaleDateString()}</td>
                  <td className="px-6 py-4 text-xs font-semibold text-white">{m.batch?.name || 'General'}</td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center gap-1 rounded bg-brand-orange/10 px-2.5 py-0.5 text-xs font-bold text-brand-orange">
                      {m.type === 'RECORDING' ? <Video size={12} /> : <FileText size={12} />}
                      {m.type}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-semibold text-white">{m.title}</td>
                  <td className="px-6 py-4 text-xs text-text-muted font-mono">{m.driveFileId || 'Direct View Only'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-xl border border-white/[0.08] bg-bg-surface p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
              <h3 className="font-display text-lg font-bold text-white">Upload / Link Study Material</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-text-muted hover:text-white"><X size={20} /></button>
            </div>

            <form onSubmit={handleCreateMaterial} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-text-muted">Target Batch</label>
                <select
                  required value={form.batchId}
                  onChange={(e) => setForm({ ...form, batchId: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-white/[0.08] bg-bg-card p-2 text-sm text-white focus:border-brand-orange"
                >
                  <option value="">Select Cohort</option>
                  {batches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-text-muted">Material Type</label>
                <select
                  value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value as any })}
                  className="mt-1 w-full rounded-lg border border-white/[0.08] bg-bg-card p-2 text-sm text-white focus:border-brand-orange"
                >
                  <option value="NOTES">Class Notes (PDF)</option>
                  <option value="RECORDING">Recorded Video Session</option>
                  <option value="ASSIGNMENT">Hands-On Assignment</option>
                  <option value="QUIZ">Interactive Quiz</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-text-muted">Material Title</label>
                <input
                  type="text" required placeholder="Module 2: Advanced RAG Architecture Notes" value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-white/[0.08] bg-bg-card p-2 text-sm text-white focus:border-brand-orange"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-text-muted">Google Drive File ID</label>
                <input
                  type="text" placeholder="1A2b3C4d5E6f..." value={form.driveFileId}
                  onChange={(e) => setForm({ ...form, driveFileId: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-white/[0.08] bg-bg-card p-2 text-sm text-white focus:border-brand-orange"
                />
              </div>

              <button type="submit" className="w-full rounded-lg bg-brand-orange py-2.5 text-sm font-semibold text-white hover:bg-brand-orange/90">
                Save Material
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default StudyMaterials;
