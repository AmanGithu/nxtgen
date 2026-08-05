import { useState, useEffect } from 'react';
import { Calendar, Clock, Video, Layers } from 'lucide-react';
import { clsx } from 'clsx';
import api from '../../services/api';

interface ClassSchedule {
  id: string;
  title: string;
  dateTime: string;
  duration: number | null;
  zoomLink: string | null;
  status: string | null;
  batch: { name: string } | null;
}

/**
 * Read-only view of classes for the batches this student is enrolled in.
 * Scheduling is an admin-only action — this page never creates or edits.
 */
const Schedule = () => {
  const [schedules, setSchedules] = useState<ClassSchedule[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSchedule();
  }, []);

  const fetchSchedule = async () => {
    setLoading(true);
    try {
      const res = await api.get('/student/schedule');
      if (res.data.success) setSchedules(res.data.schedules);
    } catch (err) {
      console.error('Failed to fetch class schedule:', err);
    } finally {
      setLoading(false);
    }
  };

  const now = Date.now();
  const upcoming = schedules.filter((s) => new Date(s.dateTime).getTime() >= now);
  const past = schedules.filter((s) => new Date(s.dateTime).getTime() < now);

  const renderClass = (session: ClassSchedule, isPast: boolean) => {
    const date = new Date(session.dateTime);
    // A Zoom link is only actionable close to and during the session.
    const joinable = !isPast && session.zoomLink;

    return (
      <div
        key={session.id}
        className={clsx(
          'flex flex-wrap items-center gap-4 rounded-xl border bg-bg-surface p-4 transition-colors',
          isPast ? 'border-line-subtle opacity-60' : 'border-line hover:border-brand-orange/30'
        )}
      >
        <div className="flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-lg border border-line bg-bg-card">
          <span className="text-[10px] uppercase text-text-muted">
            {date.toLocaleString(undefined, { month: 'short' })}
          </span>
          <span className="font-display text-lg font-bold leading-none text-strong">{date.getDate()}</span>
        </div>

        <div className="min-w-0 flex-1">
          <h3 className="truncate font-semibold text-strong">{session.title}</h3>
          <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-text-muted">
            {session.batch?.name && (
              <span className="flex items-center gap-1">
                <Layers size={12} />
                {session.batch.name}
              </span>
            )}
            <span className="flex items-center gap-1">
              <Clock size={12} />
              {date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
              {session.duration ? ` · ${session.duration} min` : ''}
            </span>
          </div>
        </div>

        {joinable ? (
          <a
            href={session.zoomLink!}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 rounded-lg bg-brand-orange px-4 py-2 text-sm font-semibold text-on-brand transition-colors hover:bg-orange-600"
          >
            <Video size={16} />
            Join Class
          </a>
        ) : (
          <span className="rounded-lg border border-line px-4 py-2 text-xs text-text-muted">
            {isPast ? 'Completed' : 'Link pending'}
          </span>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="font-display text-2xl font-bold text-strong">Class Schedule</h2>
        <p className="mt-1 text-sm text-text-muted">
          Live sessions for your enrolled batches. Classes are scheduled by your academy administrator.
        </p>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 animate-pulse rounded-xl border border-line bg-bg-surface" />
          ))}
        </div>
      ) : schedules.length === 0 ? (
        <div className="rounded-xl border border-line bg-bg-surface p-10 text-center">
          <Calendar size={28} className="mx-auto text-text-muted" />
          <p className="mt-3 font-medium text-strong">No classes scheduled</p>
          <p className="mt-1 text-sm text-text-muted">
            Once you're enrolled in a batch, your upcoming live sessions will appear here.
          </p>
        </div>
      ) : (
        <>
          {upcoming.length > 0 && (
            <section className="space-y-3">
              <h3 className="text-sm font-semibold text-strong">Upcoming</h3>
              {upcoming.map((session) => renderClass(session, false))}
            </section>
          )}

          {past.length > 0 && (
            <section className="space-y-3">
              <h3 className="text-sm font-semibold text-text-muted">Past Classes</h3>
              {past.map((session) => renderClass(session, true))}
            </section>
          )}
        </>
      )}
    </div>
  );
};

export default Schedule;
