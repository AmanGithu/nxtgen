import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Megaphone, Calendar, Users, ArrowRight, Info } from 'lucide-react';
import { clsx } from 'clsx';
import api from '../../services/api';

interface Batch {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  webinarDate: string | null;
  isPublished: boolean;
  maxStudents: number;
  status: string;
  course?: { title: string } | null;
  _count?: { students: number };
}

/**
 * Upcoming Batches — the public listing, managed here.
 *
 * There is no separate "upcoming" record: the public page is driven by real
 * batches that an admin has published. That keeps one source of truth, so a
 * start date can't say one thing to operations and another to prospects.
 */
const UpcomingManager = () => {
  const [batches, setBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    fetchBatches();
  }, []);

  const fetchBatches = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/batches');
      if (res.data.success) setBatches(res.data.batches);
    } catch (err) {
      console.error('Failed to load batches:', err);
    } finally {
      setLoading(false);
    }
  };

  const patch = async (id: string, data: Record<string, unknown>) => {
    setBusyId(id);
    try {
      await api.patch(`/admin/batches/${id}`, data);
      await fetchBatches();
    } catch (err) {
      console.error('Failed to update batch:', err);
    } finally {
      setBusyId(null);
    }
  };

  const asDateInput = (v?: string | null) => (v ? new Date(v).toISOString().slice(0, 10) : '');

  // Only batches that haven't finished are candidates for the public page.
  const candidates = batches.filter((b) => b.status === 'DRAFT' || b.status === 'ACTIVE');
  const published = candidates.filter((b) => b.isPublished);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-2xl font-bold text-strong">Upcoming Batches</h2>
        <p className="mt-1 text-sm text-text-muted">
          Choose which batches appear on the public Upcoming Batches page, and set an optional
          pre-launch webinar date.
        </p>
      </div>

      <div className="flex items-start gap-3 rounded-xl border border-line bg-bg-surface p-4">
        <Info size={16} className="mt-0.5 shrink-0 text-brand-orange" />
        <p className="text-xs leading-relaxed text-text-muted">
          These are your real batches — publishing one lists it publicly, it doesn&apos;t create a
          separate record. Dates come straight from{' '}
          <Link to="/dashboard/admin/batches" className="text-brand-orange hover:underline">
            Batch Config
          </Link>
          , so the two can never disagree.
        </p>
      </div>

      <div className="flex flex-wrap gap-3 text-xs">
        <span className="rounded-full bg-brand-orange/10 px-3 py-1 font-semibold text-brand-orange">
          {published.length} live on the public page
        </span>
        <span className="rounded-full bg-elevate px-3 py-1 text-text-muted">
          {candidates.length - published.length} not published
        </span>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-xl border border-line bg-bg-surface" />
          ))}
        </div>
      ) : candidates.length === 0 ? (
        <div className="rounded-xl border border-line bg-bg-surface p-10 text-center">
          <Calendar size={28} className="mx-auto text-text-muted" />
          <p className="mt-3 font-medium text-strong">No upcoming batches</p>
          <p className="mt-1 text-sm text-text-muted">
            Create a batch first — completed and archived batches aren&apos;t listed here.
          </p>
          <Link
            to="/dashboard/admin/batches"
            className="mt-5 inline-flex items-center gap-2 rounded-lg bg-brand-orange px-4 py-2 text-sm font-semibold text-on-brand transition-colors hover:bg-orange-600"
          >
            Go to Batch Config <ArrowRight size={15} />
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {candidates.map((batch) => (
            <div
              key={batch.id}
              className={clsx(
                'flex flex-wrap items-center gap-4 rounded-xl border bg-bg-surface p-4',
                batch.isPublished ? 'border-brand-orange/30' : 'border-line'
              )}
            >
              <div
                className={clsx(
                  'flex h-10 w-10 shrink-0 items-center justify-center rounded-lg',
                  batch.isPublished ? 'bg-brand-orange/15 text-brand-orange' : 'bg-elevate text-text-muted'
                )}
              >
                <Megaphone size={18} />
              </div>

              <div className="min-w-0 flex-1">
                <h3 className="truncate font-semibold text-strong">{batch.name}</h3>
                <div className="mt-1 flex flex-wrap gap-3 text-[11px] text-text-muted">
                  <span>{batch.course?.title || 'No course'}</span>
                  <span className="flex items-center gap-1">
                    <Calendar size={11} />
                    Starts {new Date(batch.startDate).toLocaleDateString()}
                  </span>
                  <span className="flex items-center gap-1">
                    <Users size={11} />
                    {batch._count?.students ?? 0}/{batch.maxStudents} enrolled
                  </span>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <div>
                  <label className="mb-1 block text-[10px] uppercase tracking-wider text-text-muted">
                    Webinar
                  </label>
                  <input
                    type="date"
                    value={asDateInput(batch.webinarDate)}
                    onChange={(e) => patch(batch.id, { webinarDate: e.target.value || null })}
                    className="rounded-lg border border-line bg-bg-card px-2.5 py-1.5 text-xs text-strong focus:border-brand-orange focus:outline-none"
                  />
                </div>
                <button
                  onClick={() => patch(batch.id, { isPublished: !batch.isPublished })}
                  disabled={busyId === batch.id}
                  className={clsx(
                    'mt-4 rounded-lg border px-4 py-1.5 text-xs font-semibold transition-colors disabled:opacity-50',
                    batch.isPublished
                      ? 'border-brand-orange bg-brand-orange/10 text-brand-orange'
                      : 'border-line text-text-muted hover:text-strong'
                  )}
                >
                  {batch.isPublished ? 'Published' : 'Publish'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default UpcomingManager;
