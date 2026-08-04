import { useState, useEffect } from 'react';
import { BookOpen, Video, FileText, Plus, FolderSymlink, X, Trash2, Pencil } from 'lucide-react';
import api from '../../services/api';
import { extractDriveFileId } from '../../lib/drive';
import ConfirmDialog from '../../components/ConfirmDialog';

const StudyMaterials = () => {
  const [materials, setMaterials] = useState<any[]>([]);
  const [pendingDelete, setPendingDelete] = useState<any | null>(null);
  const [shareWarning, setShareWarning] = useState('');
  const [batches, setBatches] = useState<any[]>([]);
  const [selectedBatch, setSelectedBatch] = useState('');
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

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

  const openEdit = (m: any) => {
    setEditingId(m.id);
    setForm({
      batchId: m.batchId ?? '',
      type: m.type ?? 'NOTES',
      title: m.title ?? '',
      driveFileId: m.driveFileId ?? '',
      description: m.description ?? '',
    });
    setIsModalOpen(true);
  };

  const deleteMaterial = async (item: any) => {
    try {
      await api.delete(`/admin/materials/${item.id}`);
      setPendingDelete(null);
      await fetchData();
    } catch (err) {
      console.error('Failed to delete material:', err);
    }
  };

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
      /* Admins copy the "Share → Copy link" URL out of Drive; the API wants a
         file ID. Accept either and derive the rest, so a pasted link doesn't
         silently save a material that can never be played. */
      const fileId = extractDriveFileId(form.driveFileId);
      if (form.driveFileId.trim() && !fileId) {
        setShareWarning('That doesn\u2019t look like a Drive link or file ID. Students won\u2019t see anything.');
        return;
      }
      const payload = {
        ...form,
        driveFileId: fileId || '',
        driveUrl: fileId ? `https://drive.google.com/file/d/${fileId}/view` : '',
      };
      if (editingId) await api.patch(`/admin/materials/${editingId}`, payload);
      else await api.post('/admin/materials', payload);
      setIsModalOpen(false);
      setEditingId(null);
      setForm({ batchId: '', type: 'NOTES', title: '', driveFileId: '', description: '' });
      fetchData();
    } catch (err) {
      console.error('Failed to upload material:', err);
    }
  };

  return (
    <div className="space-y-6 p-6 text-strong">
      {pendingDelete && (
        <ConfirmDialog
          title={`Remove "${pendingDelete.title}"?`}
          message="Students in this batch will no longer see the material. The file in Google Drive is not touched."
          confirmLabel="Remove material"
          onConfirm={() => deleteMaterial(pendingDelete)}
          onCancel={() => setPendingDelete(null)}
        />
      )}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold">Study Materials & Drive Assets</h1>
          <p className="text-xs text-text-muted">Manage protected lecture notes, recorded sessions, and quizzes (sorted Date Descending).</p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 rounded-lg bg-brand-orange px-4 py-2 text-sm font-semibold text-on-brand hover:bg-brand-orange/90"
        >
          <Plus size={16} />
          Upload / Link Material
        </button>
      </div>

      {/* Batch Filter */}
      <div className="flex items-center gap-4 rounded-xl border border-line bg-bg-surface p-4">
        <span className="text-xs font-semibold text-text-muted">Filter by Cohort:</span>
        <select
          value={selectedBatch}
          onChange={(e) => setSelectedBatch(e.target.value)}
          className="rounded-lg border border-line bg-bg-card px-4 py-2 text-sm text-strong focus:border-brand-orange"
        >
          <option value="">All Cohorts</option>
          {batches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
        </select>
      </div>

      {/* Materials List */}
      <div className="rounded-xl border border-line bg-bg-surface overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-line bg-bg-card text-xs uppercase text-text-muted">
            <tr>
              <th className="px-6 py-3">Date (Descending)</th>
              <th className="px-6 py-3">Cohort</th>
              <th className="px-6 py-3">Type</th>
              <th className="px-6 py-3">Title</th>
              <th className="px-6 py-3">Google Drive Asset</th>
              <th className="px-6 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {loading ? (
              <tr><td colSpan={5} className="px-6 py-8 text-center text-text-muted">Loading study materials...</td></tr>
            ) : materials.length === 0 ? (
              <tr><td colSpan={5} className="px-6 py-8 text-center text-text-muted">No materials uploaded yet.</td></tr>
            ) : (
              materials.map((m) => (
                <tr key={m.id} className="hover:bg-elevate">
                  <td className="px-6 py-4 text-xs text-text-muted">{new Date(m.createdAt).toLocaleDateString()}</td>
                  <td className="px-6 py-4 text-xs font-semibold text-strong">{m.batch?.name || 'General'}</td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center gap-1 rounded bg-brand-orange/10 px-2.5 py-0.5 text-xs font-bold text-brand-orange">
                      {m.type === 'RECORDING' ? <Video size={12} /> : <FileText size={12} />}
                      {m.type}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-semibold text-strong">{m.title}</td>
                  <td className="px-6 py-4 text-xs text-text-muted font-mono">{m.driveFileId || 'Direct View Only'}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      {m.driveUrl && (
                        <a
                          href={m.driveUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="rounded border border-line px-2.5 py-1 text-xs text-text-muted transition-colors hover:text-strong"
                        >
                          Open
                        </a>
                      )}
                      <button
                        onClick={() => openEdit(m)}
                        title="Edit this material"
                        className="rounded p-1.5 text-text-muted transition-colors hover:bg-elevate hover:text-strong"
                      >
                        <Pencil size={15} />
                      </button>
                      <button
                        onClick={() => setPendingDelete(m)}
                        title="Remove this material"
                        className="rounded p-1.5 text-text-muted transition-colors hover:bg-red-500/10 hover:text-red-400"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-overlay p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-xl border border-line bg-bg-surface p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-line pb-3">
              <h3 className="font-display text-lg font-bold text-strong">Upload / Link Study Material</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-text-muted hover:text-strong"><X size={20} /></button>
            </div>

            <form onSubmit={handleCreateMaterial} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-text-muted">Target Batch</label>
                <select
                  required value={form.batchId}
                  onChange={(e) => setForm({ ...form, batchId: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-line bg-bg-card p-2 text-sm text-strong focus:border-brand-orange"
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
                  className="mt-1 w-full rounded-lg border border-line bg-bg-card p-2 text-sm text-strong focus:border-brand-orange"
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
                  className="mt-1 w-full rounded-lg border border-line bg-bg-card p-2 text-sm text-strong focus:border-brand-orange"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-text-muted">Google Drive File ID</label>
                {/* Sharing is the step people forget, and NxtGen has no Drive
                    API access to detect it — an unshared file looks fine here
                    and shows students a Google sign-in wall instead. */}
                <p className="mt-1 rounded-lg border border-brand-orange/25 bg-brand-orange/5 px-3 py-2 text-[11px] leading-relaxed text-text-muted">
                  <strong className="text-brand-orange">Set sharing first:</strong> in Drive, choose
                  “Anyone with the link → Viewer”. Otherwise students see a Google sign-in instead of
                  the material.
                </p>
                {shareWarning && (
                  <p className="mt-2 rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-[11px] text-red-400">
                    {shareWarning}
                  </p>
                )}
                <input
                  type="text" placeholder="Paste the Drive share link or file ID" value={form.driveFileId}
                  onChange={(e) => setForm({ ...form, driveFileId: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-line bg-bg-card p-2 text-sm text-strong focus:border-brand-orange"
                />
              </div>

              <button type="submit" className="w-full rounded-lg bg-brand-orange py-2.5 text-sm font-semibold text-on-brand hover:bg-brand-orange/90">
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
