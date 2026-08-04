import { Link, useNavigate } from 'react-router-dom';
import { ShieldAlert, Compass, ArrowLeft, Home } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { normalizeRole, dashboardPathForRole } from '../lib/roles';

interface Props {
  kind: 'unauthorized' | 'notFound';
}

/**
 * Shown for 403 and 404 routes.
 *
 * These previously rendered a bare heading with no layout, navigation or way
 * back — on a full-bleed canvas that reads as a broken page rather than a
 * deliberate answer. Every route out of here goes somewhere the visitor can
 * actually use, chosen from their role.
 */
const StatusPage = ({ kind }: Props) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const isForbidden = kind === 'unauthorized';
  const home = user ? dashboardPathForRole(normalizeRole(user.role)) : '/';

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg-canvas p-6">
      <div className="w-full max-w-md rounded-2xl border border-line bg-bg-surface p-8 text-center">
        <div className="mx-auto mb-5 grid h-12 w-12 place-items-center rounded-xl bg-brand-orange/10 text-brand-orange">
          {isForbidden ? <ShieldAlert size={22} /> : <Compass size={22} />}
        </div>

        <h1 className="font-display text-2xl font-bold text-strong">
          {isForbidden ? 'You don’t have access to this' : 'Page not found'}
        </h1>

        <p className="mt-3 text-sm leading-relaxed text-text-muted">
          {isForbidden
            ? user
              ? 'This area is for a different kind of account. If you think you should have access, ask an administrator.'
              : 'Sign in with an account that has access to this area.'
            : 'That link may be out of date, or the page may have moved.'}
        </p>

        <div className="mt-7 flex flex-wrap justify-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 rounded-lg border border-line px-4 py-2.5 text-sm font-medium text-text-muted transition-colors hover:text-strong"
          >
            <ArrowLeft size={15} />
            Go back
          </button>

          <Link
            to={home}
            className="flex items-center gap-2 rounded-lg bg-brand-orange px-5 py-2.5 text-sm font-semibold text-on-brand transition-colors hover:bg-orange-600"
          >
            <Home size={15} />
            {user ? 'My dashboard' : 'Back to home'}
          </Link>

          {!user && isForbidden && (
            <Link
              to="/login"
              className="flex items-center gap-2 rounded-lg border border-line px-4 py-2.5 text-sm font-medium text-text-muted transition-colors hover:text-strong"
            >
              Sign in
            </Link>
          )}
        </div>
      </div>
    </div>
  );
};

export default StatusPage;
