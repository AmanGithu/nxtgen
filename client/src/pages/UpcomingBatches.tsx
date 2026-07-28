import { useState, useEffect } from 'react';
import { upcomingAPI } from '../services/api';
import { Calendar, Video, ArrowRight, Clock } from 'lucide-react';

interface UpcomingBatch {
  id: string;
  courseName: string;
  startDate: string;
  webinarDate: string | null;
  description: string | null;
}

const UpcomingBatches = () => {
  const [batches, setBatches] = useState<UpcomingBatch[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBatches();
  }, []);

  const fetchBatches = async () => {
    setLoading(true);
    try {
      const res = await upcomingAPI.getAll();
      if (res.data.success) {
        setBatches(res.data.upcomingBatches);
      }
    } catch (err) {
      console.error('Failed to fetch upcoming batches:', err);
      // Fallback data if DB empty
      setBatches([
        {
          id: 'b1',
          courseName: 'Data Analyst with GenAI — Batch 18',
          startDate: '2026-08-03T00:00:00.000Z',
          webinarDate: '2026-07-31T18:00:00.000Z',
          description: 'Live interactive 12-week batch covering SQL, Pandas, and GenAI Code Interpreters with Monday/Wednesday/Friday evening schedules.'
        },
        {
          id: 'b2',
          courseName: 'Generative AI Masterclass — Batch 19',
          startDate: '2026-09-01T00:00:00.000Z',
          webinarDate: '2026-08-28T18:00:00.000Z',
          description: 'Weekend masterclass covering RAG Pipelines, Vector DBs, PyTorch fine-tuning, and production deployment.'
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg-canvas py-12 text-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        
        <div className="mb-12 text-center">
          <span className="inline-flex items-center gap-2 rounded-full bg-brand-orange/10 px-4 py-1.5 text-xs font-semibold text-brand-orange">
            <Calendar size={14} />
            Live Cohorts & Webinars
          </span>
          <h1 className="mt-4 font-display text-4xl font-bold tracking-tight sm:text-5xl">
            Upcoming <span className="text-brand-orange">Batch Launches</span>
          </h1>
          <p className="mt-4 text-lg text-text-muted">
            Reserve your seat in our upcoming live instructor-led cohorts and free pre-launch orientation webinars.
          </p>
        </div>

        {loading ? (
          <div className="space-y-6">
            {[1, 2].map((i) => (
              <div key={i} className="h-44 animate-pulse rounded-xl bg-bg-surface border border-white/[0.08]" />
            ))}
          </div>
        ) : (
          <div className="space-y-6">
            {batches.map((batch) => (
              <div
                key={batch.id}
                className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between rounded-xl border border-white/[0.08] bg-bg-surface p-6 transition-all hover:border-brand-orange/40"
              >
                <div className="space-y-2 max-w-3xl">
                  <div className="flex items-center gap-3">
                    <span className="rounded-full bg-brand-orange/10 px-3 py-1 text-xs font-semibold text-brand-orange">
                      Live Cohort
                    </span>
                    <span className="flex items-center gap-1.5 text-xs text-text-muted">
                      <Clock size={14} />
                      Starts {new Date(batch.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                  </div>

                  <h3 className="font-display text-2xl font-bold text-white">{batch.courseName}</h3>
                  <p className="text-sm text-text-muted">{batch.description}</p>

                  {batch.webinarDate && (
                    <div className="mt-3 flex items-center gap-2 rounded-lg bg-bg-card p-2.5 text-xs text-text-muted inline-flex">
                      <Video size={16} className="text-brand-orange" />
                      <span>Pre-Launch Orientation Webinar: <strong className="text-white">{new Date(batch.webinarDate).toLocaleDateString()} at 6:00 PM IST</strong></span>
                    </div>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row gap-3 min-w-[200px]">
                  <a
                    href="/courses"
                    className="flex items-center justify-center gap-2 rounded-lg bg-brand-orange px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-brand-orange/90"
                  >
                    Reserve Seat
                    <ArrowRight size={16} />
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
};

export default UpcomingBatches;
