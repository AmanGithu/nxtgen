import { useState } from 'react';
import { Lock, Check, Sparkles, Shield, X, ArrowRight } from 'lucide-react';

const UnlockModal = () => {
  const [selectedTier, setSelectedTier] = useState('PRO');

  const tiers = [
    {
      name: 'Basic',
      price: '₹299',
      period: '/month',
      desc: 'Essential AI resume tools for job seekers.',
      features: ['AI Resume Builder (3 modes)', 'ATS Score Checker', 'Cover Letter Builder', 'Standard Templates'],
      buttonText: 'Select Basic Plan',
      highlighted: false,
    },
    {
      name: 'Pro',
      price: '₹499',
      period: '/month',
      desc: 'Complete career acceleration suite with recruiter optimization.',
      features: ['All Basic Features', 'JD Resume Tailor', 'LinkedIn Profile Analyser', 'Interview Prep Kit (20 STAR Q&As)', '50 AI Credits/mo'],
      buttonText: 'Select Pro Plan',
      highlighted: true,
    },
    {
      name: 'Enterprise',
      price: '₹999',
      period: '/month',
      desc: 'Max power for serious career changers & architects.',
      features: ['All Pro Features', '200 AI Credits/mo', 'LiveKit AI Interview Avatar Access', 'Priority Support'],
      buttonText: 'Select Enterprise Plan',
      highlighted: false,
    },
  ];

  return (
    <div className="space-y-8 p-6 text-strong max-w-5xl mx-auto">
      <div className="text-center space-y-2">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-orange/10 px-4 py-1 text-xs font-semibold text-brand-orange">
          <Sparkles size={14} /> Unlock All Career Tools
        </span>
        <h1 className="font-display text-4xl font-bold">Choose Your Upgrade Plan</h1>
        <p className="text-sm text-text-muted">Gain unlimited access to AI Resume Tailoring, ATS Auditing, and Interview Practice.</p>
      </div>

      {/* 3 Pricing Tiers Side by Side */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {tiers.map((tier) => (
          <div
            key={tier.name}
            className={`flex flex-col justify-between rounded-xl border p-6 transition-all ${
              tier.highlighted
                ? 'border-brand-orange bg-bg-surface shadow-xl ring-2 ring-brand-orange/50 scale-[1.02]'
                : 'border-line bg-bg-surface hover:border-line-strong'
            }`}
          >
            <div className="space-y-4">
              {tier.highlighted && (
                <span className="inline-block rounded bg-brand-orange px-2.5 py-0.5 text-[10px] font-bold uppercase text-on-brand">
                  Most Popular
                </span>
              )}
              <h3 className="font-display text-xl font-bold text-strong">{tier.name}</h3>
              <p className="text-xs text-text-muted">{tier.desc}</p>
              
              <div className="flex items-baseline">
                <span className="font-display text-3xl font-bold text-strong">{tier.price}</span>
                <span className="text-xs text-text-muted">{tier.period}</span>
              </div>

              <ul className="space-y-2 border-t border-line pt-4 text-xs text-text-muted">
                {tier.features.map((f, fidx) => (
                  <li key={fidx} className="flex items-center gap-2">
                    <Check size={14} className="text-brand-orange shrink-0" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
            </div>

            <button
              onClick={() => alert(`Selected ${tier.name} plan!`)}
              className={`mt-6 w-full rounded-lg py-2.5 text-xs font-semibold shadow-md transition-colors ${
                tier.highlighted
                  ? 'bg-brand-orange text-on-brand hover:bg-brand-orange/90'
                  : 'border border-line-strong bg-bg-card text-strong hover:bg-elevate'
              }`}
            >
              {tier.buttonText}
            </button>
          </div>
        ))}
      </div>

      {/* ─── SEPARATE HIGHLIGHTED BANNER: JOB SUPPORT SUBSCRIPTION (EXCLUSIVE STANDALONE) ─── */}
      <div className="rounded-xl border-2 border-brand-orange/60 bg-gradient-to-r from-brand-orange/10 via-bg-surface to-bg-surface p-6 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Shield className="text-brand-orange" size={20} />
            <h3 className="font-display text-xl font-bold text-strong">Job Support Subscription — Exclusive Standalone</h3>
          </div>
          <p className="text-xs text-text-muted max-w-xl">
            1-on-1 dedicated senior mentor support for technical interviews, code reviews, architectural guidance, and daily on-the-job task assist. (Not included in any tool package).
          </p>
        </div>

        <div className="text-center md:text-right shrink-0">
          <span className="font-display text-2xl font-bold text-brand-orange">₹1,999</span>
          <span className="text-xs text-text-muted"> / month</span>
          <button
            onClick={() => alert('Selected Standalone Job Support Subscription!')}
            className="mt-2 block w-full rounded-lg bg-brand-orange px-6 py-2 text-xs font-semibold text-on-brand shadow-lg hover:bg-brand-orange/90"
          >
            Subscribe to Job Support →
          </button>
        </div>
      </div>

    </div>
  );
};

export default UnlockModal;
