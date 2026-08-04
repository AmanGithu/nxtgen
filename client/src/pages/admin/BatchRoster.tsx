import { useState, useEffect } from 'react';
import { X, UserPlus, UserMinus, GraduationCap, Loader2 } from 'lucide-react';
import api from '../../services/api';

interface Student {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  role: string;
  status: string;
  enrolledAt: string;
}

interface Props {
  batch: any;
  onClose: () => void;
  /** Lets the parent refresh its seat counts without refetching everything. */
  onChanged: () => void;
}

/**
 * Who is on a batch, and the only place in the app that enrols someone.
 *
 * Enrolment is what turns a SITE_USER into a STUDENT — buying a seat is the
 * promotion trigger, not signing up — so this dialog reports back when that
 * upgrade happened, otherwise an admin has no way to tell an existing student
 * from someone who just gained access to the student dashboard.
 */
const BatchRoster = ({ batch, onClose, onChanged }: Props) => {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const seatsUsed = students.length;
  const full = seatsUsed >= batch.maxStudents;

  const fetchRoster = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/admin/batches/${batch.id}/students`);
      if (res.data.success) setStudents(res.data.students);
    } catch (err) {
      console.error('Failed to load roster:', err);
      setError('Could not load the student list.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoster();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [batch.id]);

  const enrol = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setSaving(true);
    setError('');
    setNotice('');
    try {
      const res = await api.post(`/admin/batches/${batch.id}/students`, { email: email.trim() });
      setNotice(res.data.message);
      setEmail('');
      await fetchRoster();
      onChanged();
    } catch (err: any) {
      // The server explains the real reason — full batch, already enrolled,
      // unknown email — so surface it rather than a generic failure.
      setError(err.response?.data?.message || 'Could not enrol that person.');
    } finally {
      setSaving(false);
    }
  };

  const remove = async (student: Student) => {
    setError('');
    setNotice('');
    try {
      await api.delete(`/admin/batches/${batch.id}/students/${student.id}`);
      await fetchRoster();
      onChanged();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Could not remove that student.');
    }
  };

  const displayName = (s: Student) =>
    [s.firstName, s.lastName].filter(Boolean).join(' ') || s.email;

  return (
    <div className="fixed inset-0 z-[80] grid place-items-center p-4">
      <div className="absolute inset-0 bg-overlay backdrop-blur-sm" onClick={onClose} />

      <div className="relative flex max-h-[85vh] w-full max-w-2xl flex-col rounded-2xl border border-line bg-bg-surface shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-line p-6">
          <div className="min-w-0">
            <h2 className="font-display text-xl font-bold text-strong">Students — {batch.name}</h2>
            <p className="mt-1 text-xs text-text-muted">
              {seatsUsed} of {batch.maxStudents} seats filled
              {full && <span className="ml-2 text-brand-orange">· batch is full</span>}
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="rounded-lg p-1.5 text-text-muted transition-colors hover:bg-elevate hover:text-strong"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={enrol} className="border-b border-line p-6">
          <label className="mb-1.5 block text-xs font-medium text-text-muted">
            Enrol someone by the email they signed up with
          </label>
          <div className="flex gap-2">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={full}
              placeholder="learner@example.com"
              className="flex-1 rounded-lg border border-line bg-bg-card px-3 py-2 text-sm text-strong placeholder:text-text-muted/50 focus:border-brand-orange focus:outline-none disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={saving || full || !email.trim()}
              className="flex items-center gap-2 rounded-lg bg-brand-orange px-4 py-2 text-sm font-semibold text-on-brand transition-colors hover:bg-orange-600 disabled:opacity-50"
            >
              {saving ? <Loader2 size={15} className="animate-spin" /> : <UserPlus size={15} />}
              Enrol
            </button>
          </div>

          {error && (
            <p className="mt-3 rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs text-red-400">
              {error}
            </p>
          )}
          {notice && (
            <p className="mt-3 rounded-lg border border-green-500/20 bg-green-500/10 px-3 py-2 text-xs text-green-400">
              {notice}
            </p>
          )}
        </form>

        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <p className="text-sm text-text-muted">Loading students…</p>
          ) : students.length === 0 ? (
            <p className="rounded-xl border border-line bg-bg-card p-8 text-center text-sm text-text-muted">
              Nobody is enrolled yet. Adding someone here gives them the student dashboard.
            </p>
          ) : (
            <ul className="space-y-2">
              {students.map((s) => (
                <li
                  key={s.id}
                  className="flex items-center justify-between gap-3 rounded-lg border border-line bg-bg-card px-4 py-3"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-strong">{displayName(s)}</p>
                    <p className="truncate text-xs text-text-muted">{s.email}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <span className="inline-flex items-center gap-1 rounded-full bg-brand-orange/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-brand-orange">
                      <GraduationCap size={11} />
                      {s.role === 'STUDENT' ? 'Student' : s.role}
                    </span>
                    <button
                      onClick={() => remove(s)}
                      title="Remove from this batch"
                      className="rounded p-1.5 text-text-muted transition-colors hover:bg-red-500/10 hover:text-red-400"
                    >
                      <UserMinus size={15} />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};

export default BatchRoster;
