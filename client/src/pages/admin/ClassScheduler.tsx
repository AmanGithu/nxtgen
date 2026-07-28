import { useState, useEffect } from 'react';
import { Calendar as CalendarIcon, Video, Plus, Clock, X } from 'lucide-react';
import api from '../../services/api';

const ClassScheduler = () => {
  const [schedules, setSchedules] = useState<any[]>([]);
  const [batches, setBatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [form, setForm] = useState({
    batchId: '',
    title: '',
    dateTime: '',
    zoomLink: '',
    duration: 60,
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [schedRes, batchRes] = await Promise.all([
        api.get('/admin/scheduler'),
        api.get('/admin/batches')
      ]);
      if (schedRes.data.success) setSchedules(schedRes.data.schedules);
      if (batchRes.data.success) setBatches(batchRes.data.batches);
    } catch (err) {
      console.error('Failed to fetch schedules:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/admin/scheduler', form);
      setIsModalOpen(false);
      setForm({ batchId: '', title: '', dateTime: '', zoomLink: '', duration: 60 });
      fetchData();
    } catch (err) {
      console.error('Failed to create schedule:', err);
    }
  };

  return (
    <div className="space-y-6 p-6 text-white">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold">Class Scheduler</h1>
          <p className="text-xs text-text-muted">Schedule live video sessions, assign Zoom links, and manage class agendas.</p>
        </div>

        <div className="flex gap-3">
          <div className="inline-flex rounded-lg border border-white/[0.08] bg-bg-surface p-1">
            <button
              onClick={() => setViewMode('list')}
              className={`rounded px-3 py-1 text-xs font-semibold ${viewMode === 'list' ? 'bg-brand-orange text-white' : 'text-text-muted'}`}
            >
              List View
            </button>
            <button
              onClick={() => setViewMode('calendar')}
              className={`rounded px-3 py-1 text-xs font-semibold ${viewMode === 'calendar' ? 'bg-brand-orange text-white' : 'text-text-muted'}`}
            >
              Calendar View
            </button>
          </div>

          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 rounded-lg bg-brand-orange px-4 py-2 text-sm font-semibold text-white hover:bg-brand-orange/90"
          >
            <Plus size={16} />
            Schedule Live Class
          </button>
        </div>
      </div>

      {/* Schedules List */}
      <div className="rounded-xl border border-white/[0.08] bg-bg-surface p-6">
        {loading ? (
          <p className="text-sm text-text-muted">Loading schedules...</p>
        ) : schedules.length === 0 ? (
          <p className="text-sm text-text-muted py-6 text-center">No live classes scheduled.</p>
        ) : (
          <div className="space-y-4">
            {schedules.map((s) => (
              <div key={s.id} className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-lg border border-white/[0.08] bg-bg-card p-4">
                <div className="space-y-1">
                  <span className="text-xs font-bold text-brand-orange">{s.batch?.name || 'Cohort'}</span>
                  <h3 className="font-semibold text-white text-base">{s.title}</h3>
                  <div className="flex items-center gap-4 text-xs text-text-muted">
                    <span className="flex items-center gap-1"><CalendarIcon size={14} /> {new Date(s.dateTime).toLocaleString()}</span>
                    <span className="flex items-center gap-1"><Clock size={14} /> {s.duration} mins</span>
                  </div>
                </div>

                {s.zoomLink && (
                  <a
                    href={s.zoomLink}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 rounded-lg border border-brand-orange/40 bg-brand-orange/10 px-4 py-2 text-xs font-semibold text-brand-orange hover:bg-brand-orange hover:text-white"
                  >
                    <Video size={16} />
                    Join Zoom Session
                  </a>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-xl border border-white/[0.08] bg-bg-surface p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
              <h3 className="font-display text-lg font-bold text-white">Schedule Live Class</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-text-muted hover:text-white"><X size={20} /></button>
            </div>

            <form onSubmit={handleCreateSchedule} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-text-muted">Target Batch</label>
                <select
                  required value={form.batchId}
                  onChange={(e) => setForm({ ...form, batchId: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-white/[0.08] bg-bg-card p-2 text-sm text-white focus:border-brand-orange"
                >
                  <option value="">Select Batch</option>
                  {batches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-text-muted">Class Topic / Title</label>
                <input
                  type="text" required placeholder="Prompt Engineering & Red Teaming" value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-white/[0.08] bg-bg-card p-2 text-sm text-white focus:border-brand-orange"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-text-muted">Date & Time</label>
                <input
                  type="datetime-local" required value={form.dateTime}
                  onChange={(e) => setForm({ ...form, dateTime: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-white/[0.08] bg-bg-card p-2 text-xs text-white"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-text-muted">Zoom Meeting Link</label>
                <input
                  type="url" placeholder="https://zoom.us/j/123456789" value={form.zoomLink}
                  onChange={(e) => setForm({ ...form, zoomLink: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-white/[0.08] bg-bg-card p-2 text-sm text-white focus:border-brand-orange"
                />
              </div>

              <button type="submit" className="w-full rounded-lg bg-brand-orange py-2.5 text-sm font-semibold text-white hover:bg-brand-orange/90">
                Save Scheduled Class
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default ClassScheduler;
