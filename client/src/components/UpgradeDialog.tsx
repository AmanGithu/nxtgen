import { Sparkles, X, Check, Clock } from 'lucide-react';
import { useUpgrade } from '../context/UpgradeContext';

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

  if (!block) return null;

  return (
    <div className="fixed inset-0 z-[100] grid place-items-center p-6">
      <div className="absolute inset-0 bg-overlay backdrop-blur-sm" onClick={dismiss} />

      <div className="relative w-full max-w-md rounded-2xl border border-line bg-bg-surface p-7 shadow-2xl">
        <button
          onClick={dismiss}
          aria-label="Close"
          className="absolute right-4 top-4 rounded-lg p-1.5 text-text-muted transition-colors hover:bg-elevate hover:text-strong"
        >
          <X size={16} />
        </button>

        <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-brand-orange/10 text-brand-orange">
          <Sparkles size={20} />
        </div>

        <h3 className="font-display text-xl font-bold text-strong">You&apos;ve hit your free limit</h3>
        {/* The server's message names the exact limit that was reached. */}
        <p className="mt-2 text-sm leading-relaxed text-text-muted">{block.message}</p>

        <p className="mt-4 text-xs font-semibold uppercase tracking-wider text-text-muted">
          A paid plan will include
        </p>
        <ul className="mt-2 space-y-2">
          {PERKS.map((p) => (
            <li key={p} className="flex items-center gap-2.5 text-sm text-text-muted">
              <Check size={15} className="shrink-0 text-brand-orange" />
              {p}
            </li>
          ))}
        </ul>

        {/* There is no checkout yet, so the dialog says so plainly rather than
            offering a button that cannot complete a purchase. */}
        <div className="mt-6 rounded-lg border border-brand-orange/25 bg-brand-orange/5 px-4 py-3">
          <p className="flex items-center gap-2 text-sm font-semibold text-brand-orange">
            <Clock size={15} />
            Paid plans are coming soon
          </p>
          <p className="mt-1 text-xs leading-relaxed text-text-muted">
            We&apos;re still setting up payments. Your limits reset at the start of next month, and
            everything you&apos;ve saved stays in your account.
          </p>
        </div>

        <button
          onClick={dismiss}
          className="mt-5 w-full rounded-lg border border-line px-4 py-2.5 text-sm font-medium text-text-muted transition-colors hover:text-strong"
        >
          Got it
        </button>
      </div>
    </div>
  );
};

export default UpgradeDialog;
