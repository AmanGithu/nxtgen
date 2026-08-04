import { Link, useLocation } from 'react-router-dom';
import { Lock, Sparkles, X } from 'lucide-react';
import { gateReason, type Tier } from '../lib/entitlements';

interface Props {
  tier: Tier;
  action: 'save' | 'export' | 'premium-template' | 'extra-resume';
  onClose: () => void;
}

/**
 * Prompt shown when a visitor hits a gated action.
 *
 * Guests are asked to sign in (free); signed-in free users are asked to
 * upgrade. The copy reassures guests that their work follows them, because
 * the main reason people abandon at this point is fear of losing it.
 */
const SignInGate = ({ tier, action, onClose }: Props) => {
  const location = useLocation();
  const { title, body } = gateReason(tier, action);
  const isGuest = tier === 'guest';

  return (
    <div className="fixed inset-0 z-[90] grid place-items-center p-6">
      <div className="absolute inset-0 bg-overlay backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-md rounded-2xl border border-line-strong bg-bg-surface p-7 shadow-2xl">
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute right-4 top-4 rounded-lg p-1.5 text-text-muted transition-colors hover:bg-elevate hover:text-strong"
        >
          <X size={16} />
        </button>

        <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-brand-orange/10 text-brand-orange">
          {isGuest ? <Lock size={20} /> : <Sparkles size={20} />}
        </div>

        <h3 className="font-display text-xl font-bold text-strong">{title}</h3>
        <p className="mt-2 text-sm leading-relaxed text-text-muted">{body}</p>

        {isGuest && (
          <p className="mt-3 rounded-lg border border-line bg-bg-card p-3 text-xs text-text-muted">
            Nothing is lost — your résumé is saved in this browser and moves to your account when you sign in.
          </p>
        )}

        <div className="mt-6 flex flex-wrap gap-3">
          {isGuest ? (
            <>
              <Link
                to="/login"
                // Come back to the tool afterwards — a site user signing in to
                // save their work should not land on a dashboard.
                state={{ from: location.pathname + location.search }}
                className="flex-1 rounded-lg bg-brand-orange px-4 py-2.5 text-center text-sm font-semibold text-on-brand transition-colors hover:bg-orange-600"
              >
                Sign in — it&apos;s free
              </Link>
              <button
                onClick={onClose}
                className="rounded-lg border border-line px-4 py-2.5 text-sm font-medium text-text-muted transition-colors hover:text-strong"
              >
                Keep editing
              </button>
            </>
          ) : (
            <>
              <Link
                to="/dashboard/tools/unlock"
                className="flex-1 rounded-lg bg-brand-orange px-4 py-2.5 text-center text-sm font-semibold text-on-brand transition-colors hover:bg-orange-600"
              >
                See plans
              </Link>
              <button
                onClick={onClose}
                className="rounded-lg border border-line px-4 py-2.5 text-sm font-medium text-text-muted transition-colors hover:text-strong"
              >
                Not now
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default SignInGate;
