import { useMemo, useState } from 'react';
import { Check, Sparkles, Shield, Globe, Wrench } from 'lucide-react';
import { usePricing, sumMinor, formatMinor, type PricedItem } from '../../hooks/usePricing';

/* Package copy stays in the client: these are marketing descriptions, not
   prices. Only the amounts come from the API, because only the amounts change
   without a release. */
const PACKAGE_COPY: Record<string, { desc: string; features: string[]; highlighted?: boolean }> = {
  BASIC: {
    desc: 'Essential AI resume tools for job seekers.',
    features: ['AI Resume Builder (3 modes)', 'ATS Score Checker', 'Cover Letter Builder', 'Standard Templates'],
  },
  PRO: {
    desc: 'Complete career acceleration suite with recruiter optimization.',
    features: ['All Basic Features', 'JD Resume Tailor', 'LinkedIn Profile Analyser', 'Interview Prep Kit (20 STAR Q&As)', '50 AI Credits/mo'],
    highlighted: true,
  },
  ENTERPRISE: {
    desc: 'Max power for serious career changers & architects.',
    features: ['All Pro Features', '200 AI Credits/mo', 'LiveKit AI Interview Avatar Access', 'Priority Support'],
  },
};

const periodLabel = (interval: PricedItem['interval']) =>
  interval === 'ONE_TIME' ? ' one-time' : interval === 'YEAR' ? '/year' : '/month';

const UnlockModal = () => {
  const { data, loading, error, setCurrency } = usePricing();
  const [pickedTools, setPickedTools] = useState<string[]>([]);

  const toggleTool = (key: string) =>
    setPickedTools((prev) => (prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]));

  /* Buying three tools is one payment of the summed amount, not three
     payments. In India each recurring charge needs its own UPI Autopay or
     e-NACH mandate, so three separate subscriptions would mean three approval
     flows and three things that can fail on renewal. */
  const basket = useMemo(
    () => (data ? data.tools.filter((t) => pickedTools.includes(t.key)).map((t) => t.price) : []),
    [data, pickedTools]
  );
  const basketTotal = sumMinor(basket);

  if (loading) return <div className="p-6 text-text-muted">Loading prices…</div>;
  if (error || !data) {
    return (
      <div className="rounded-xl border border-line bg-bg-surface p-8 text-center">
        <p className="text-sm text-text-muted">{error || 'Prices are unavailable right now.'}</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-8 p-6 text-strong">
      <div className="space-y-2 text-center">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-orange/10 px-4 py-1 text-xs font-semibold text-brand-orange">
          <Sparkles size={14} /> Unlock All Career Tools
        </span>
        <h1 className="font-display text-4xl font-bold">Choose Your Upgrade Plan</h1>
        <p className="text-sm text-text-muted">
          Gain unlimited access to AI Resume Tailoring, ATS Auditing, and Interview Practice.
        </p>
      </div>

      {/* Currency switcher. Always offered rather than shown only on a wrong
          guess — the visitor knows where they are and the network does not. */}
      <div className="flex flex-wrap items-center justify-center gap-2 text-xs">
        <Globe size={14} className="text-text-muted" />
        <span className="text-text-muted">
          {data.detected && data.country
            ? `Prices shown for ${data.country}.`
            : 'Showing default prices.'}
        </span>
        <select
          value={data.currency}
          onChange={(e) => setCurrency(e.target.value)}
          className="rounded-lg border border-line bg-bg-card px-2 py-1 text-strong focus:border-brand-orange focus:outline-none"
          aria-label="Display currency"
        >
          {data.currencies.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {data.packages.map(({ plan, price }) => {
          const copy = PACKAGE_COPY[plan] ?? { desc: '', features: [] };
          return (
            <div
              key={plan}
              className={`flex flex-col justify-between rounded-xl border p-6 transition-all ${
                copy.highlighted
                  ? 'scale-[1.02] border-brand-orange bg-bg-surface shadow-xl ring-2 ring-brand-orange/50'
                  : 'border-line bg-bg-surface hover:border-line-strong'
              }`}
            >
              <div className="space-y-4">
                {copy.highlighted && (
                  <span className="inline-block rounded bg-brand-orange px-2.5 py-0.5 text-[10px] font-bold uppercase text-on-brand">
                    Most Popular
                  </span>
                )}
                <h3 className="font-display text-xl font-bold text-strong capitalize">{plan.toLowerCase()}</h3>
                <p className="text-xs text-text-muted">{copy.desc}</p>

                <div className="flex items-baseline">
                  <span className="font-display text-3xl font-bold text-strong">{price.formatted}</span>
                  <span className="text-xs text-text-muted">{periodLabel(price.interval)}</span>
                </div>

                <ul className="space-y-2 border-t border-line pt-4 text-xs text-text-muted">
                  {copy.features.map((f) => (
                    <li key={f} className="flex items-center gap-2">
                      <Check size={14} className="shrink-0 text-brand-orange" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <button
                disabled
                title="Checkout is not connected yet"
                className={`mt-6 w-full cursor-not-allowed rounded-lg py-2.5 text-xs font-semibold opacity-60 shadow-md ${
                  copy.highlighted
                    ? 'bg-brand-orange text-on-brand'
                    : 'border border-line-strong bg-bg-card text-strong'
                }`}
              >
                Select {plan.charAt(0)}{plan.slice(1).toLowerCase()} Plan
              </button>
            </div>
          );
        })}
      </div>

      {/* À la carte tools — pick any number, pay once for the total. */}
      {data.tools.length > 0 && (
        <div className="rounded-xl border border-line bg-bg-surface p-6">
          <div className="flex items-center gap-2">
            <Wrench className="text-brand-orange" size={18} />
            <h3 className="font-display text-lg font-bold text-strong">Or buy just the tools you need</h3>
          </div>
          <p className="mt-1 text-xs text-text-muted">
            Pick any combination. Everything you select is charged together as a single payment.
          </p>

          <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
            {data.tools.map((tool) => {
              const picked = pickedTools.includes(tool.key);
              return (
                <button
                  key={tool.key}
                  onClick={() => toggleTool(tool.key)}
                  aria-pressed={picked}
                  className={`flex items-center justify-between rounded-lg border px-4 py-3 text-left transition-colors ${
                    picked
                      ? 'border-brand-orange bg-brand-orange/10'
                      : 'border-line bg-bg-card hover:border-line-strong'
                  }`}
                >
                  <span className="flex items-center gap-2.5">
                    <span
                      className={`grid h-4 w-4 shrink-0 place-items-center rounded border ${
                        picked ? 'border-brand-orange bg-brand-orange text-on-brand' : 'border-line-strong'
                      }`}
                    >
                      {picked && <Check size={11} strokeWidth={3} />}
                    </span>
                    <span className="text-xs font-medium text-strong">{tool.name}</span>
                  </span>
                  <span className="text-xs font-semibold text-text-muted">
                    {tool.price.formatted}
                    <span className="font-normal">{periodLabel(tool.price.interval)}</span>
                  </span>
                </button>
              );
            })}
          </div>

          <div className="mt-5 flex flex-wrap items-center justify-between gap-4 border-t border-line pt-4">
            <div className="text-sm">
              <span className="text-text-muted">
                {pickedTools.length} tool{pickedTools.length === 1 ? '' : 's'} selected —{' '}
              </span>
              <span className="font-display text-xl font-bold text-strong">
                {formatMinor(basketTotal, data.currency)}
              </span>
              <span className="text-xs text-text-muted">/month</span>
            </div>
            <button
              disabled
              title="Checkout is not connected yet"
              className="cursor-not-allowed rounded-lg bg-brand-orange px-6 py-2 text-xs font-semibold text-on-brand opacity-60 shadow-lg"
            >
              Continue to payment →
            </button>
          </div>
        </div>
      )}

      {/* Standalone by design — deliberately not bundled into any package. */}
      {data.jobSupport && (
        <div className="flex flex-col items-center justify-between gap-6 rounded-xl border-2 border-brand-orange/60 bg-gradient-to-r from-brand-orange/10 via-bg-surface to-bg-surface p-6 md:flex-row">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Shield className="text-brand-orange" size={20} />
              <h3 className="font-display text-xl font-bold text-strong">
                Job Support Subscription — Exclusive Standalone
              </h3>
            </div>
            <p className="max-w-xl text-xs text-text-muted">
              1-on-1 dedicated senior mentor support for technical interviews, code reviews, architectural
              guidance, and daily on-the-job task assist. (Not included in any tool package).
            </p>
          </div>

          <div className="shrink-0 text-center md:text-right">
            <span className="font-display text-2xl font-bold text-brand-orange">{data.jobSupport.formatted}</span>
            <span className="text-xs text-text-muted">{periodLabel(data.jobSupport.interval)}</span>
            <button
              disabled
              title="Checkout is not connected yet"
              className="mt-2 block w-full cursor-not-allowed rounded-lg bg-brand-orange px-6 py-2 text-xs font-semibold text-on-brand opacity-60 shadow-lg"
            >
              Subscribe to Job Support →
            </button>
          </div>
        </div>
      )}

      {/* Said once, plainly, rather than on every disabled button. */}
      <p className="text-center text-xs text-text-muted">
        Card and UPI checkout is being connected. Prices shown are provisional.
      </p>
    </div>
  );
};

export default UnlockModal;
