import { useState } from 'react';
import { Sparkles, X, Check, Loader2 } from 'lucide-react';
import { useUpgrade, purchaseUpgrade } from '../context/UpgradeContext';

const PERKS = [
  'Unlimited résumés',
  'Unlimited PDF & Word downloads',
  'All 7 premium templates',
  'Unlimited JD tailoring and AI rewrites',
];

/**
 * Shown whenever a plan limit is hit, anywhere in the app.
 *
 * Replaces the generic "failed" toasts that used to surface a 402 — hitting a
 * plan limit is a normal, expected moment in the funnel, and reading it as an
 * error made a working product look broken.
 */
const UpgradeDialog = () => {
  const { block, dismiss } = useUpgrade();
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  if (!block) return null;

  const upgrade = async () => {
    setBusy(true);
    setError('');
    try {
      await purchaseUpgrade();
      setDone(true);
      /* Entitlements are read at mount across several pages, so a reload is
         the honest way to make every one of them reflect the new plan. */
      setTimeout(() => window.location.reload(), 900);
    } catch (e: any) {
      setError(e.response?.data?.message || 'Could not activate your plan. Please try again.');
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] grid place-items-center p-6">
      <div className="absolute inset-0 bg-overlay backdrop-blur-sm" onClick={busy ? undefined : dismiss} />

      <div className="relative w-full max-w-md rounded-2xl border border-line bg-bg-surface p-7 shadow-2xl">
        {!busy && !done && (
          <button
            onClick={dismiss}
            aria-label="Close"
            className="absolute right-4 top-4 rounded-lg p-1.5 text-text-muted transition-colors hover:bg-elevate hover:text-strong"
          >
            <X size={16} />
          </button>
        )}

        <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-brand-orange/10 text-brand-orange">
          {done ? <Check size={20} /> : <Sparkles size={20} />}
        </div>

        {done ? (
          <>
            <h3 className="font-display text-xl font-bold text-strong">You&apos;re all set</h3>
            <p className="mt-2 text-sm leading-relaxed text-text-muted">
              Your plan is active and everything is unlocked. Reloading…
            </p>
          </>
        ) : (
          <>
            <h3 className="font-display text-xl font-bold text-strong">Upgrade to continue</h3>
            {/* The server's message names the exact limit that was hit. */}
            <p className="mt-2 text-sm leading-relaxed text-text-muted">{block.message}</p>

            <ul className="mt-5 space-y-2">
              {PERKS.map((p) => (
                <li key={p} className="flex items-center gap-2.5 text-sm text-text-muted">
                  <Check size={15} className="shrink-0 text-brand-orange" />
                  {p}
                </li>
              ))}
            </ul>

            {error && (
              <p className="mt-4 rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs text-red-400">
                {error}
              </p>
            )}

            <div className="mt-6 flex flex-wrap gap-3">
              <button
                onClick={upgrade}
                disabled={busy}
                className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-brand-orange px-4 py-2.5 text-sm font-semibold text-on-brand transition-colors hover:bg-orange-600 disabled:opacity-60"
              >
                {busy ? <Loader2 size={15} className="animate-spin" /> : <Sparkles size={15} />}
                {busy ? 'Activating…' : 'Upgrade'}
              </button>
              <button
                onClick={dismiss}
                disabled={busy}
                className="rounded-lg border border-line px-4 py-2.5 text-sm font-medium text-text-muted transition-colors hover:text-strong disabled:opacity-60"
              >
                Not now
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default UpgradeDialog;
