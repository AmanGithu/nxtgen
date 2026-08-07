import { useCallback, useEffect, useMemo, useState } from 'react';
import { IndianRupee, Save, Loader2, AlertCircle, Check } from 'lucide-react';
import api from '../../services/api';

/**
 * Price editor.
 *
 * The whole reason prices live in the database is that they are provisional —
 * the current figures are placeholders pending real costing, and revising them
 * has to be a form submit rather than a release. This is that form.
 *
 * Amounts are edited in major units because that is how people think about
 * money, and converted to minor units here. The server only ever accepts
 * integer minor units, so the one place decimals exist is this component.
 */

interface PriceRow {
  id: string;
  currency: string;
  amountMinor: number;
  formatted: string;
  taxBehavior: 'INCLUSIVE' | 'EXCLUSIVE';
  isActive: boolean;
}

interface SkuRow {
  skuKey: string;
  skuType: 'PACKAGE' | 'TOOL' | 'BATCH' | 'JOB_SUPPORT';
  label: string;
  interval: 'MONTH' | 'YEAR' | 'ONE_TIME';
  prices: PriceRow[];
}

const TYPE_ORDER: SkuRow['skuType'][] = ['PACKAGE', 'TOOL', 'JOB_SUPPORT', 'BATCH'];
const TYPE_LABEL: Record<SkuRow['skuType'], string> = {
  PACKAGE: 'Packages',
  TOOL: 'Individual tools',
  JOB_SUPPORT: 'Job Support',
  BATCH: 'Courses',
};

const intervalLabel = (i: SkuRow['interval']) =>
  i === 'ONE_TIME' ? 'one-time' : i === 'YEAR' ? 'per year' : 'per month';

const PricingManager = () => {
  const [skus, setSkus] = useState<SkuRow[]>([]);
  const [currencies, setCurrencies] = useState<string[]>([]);
  const [currency, setCurrency] = useState('INR');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  /** Edits held locally until saved, keyed by price id. */
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState<string | null>(null);
  const [saved, setSaved] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/admin/pricing');
      setSkus(res.data.skus);
      setCurrencies(res.data.currencies);
    } catch {
      setError('Could not load prices.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const grouped = useMemo(
    () =>
      TYPE_ORDER.map((type) => ({
        type,
        rows: skus.filter((s) => s.skuType === type),
      })).filter((g) => g.rows.length),
    [skus]
  );

  const priceFor = (sku: SkuRow) => sku.prices.find((p) => p.currency === currency);

  const save = async (row: PriceRow) => {
    const raw = drafts[row.id];
    if (raw === undefined) return;

    const major = Number(raw);
    if (!Number.isFinite(major) || major < 0) {
      setError('Enter a valid non-negative amount.');
      return;
    }

    /* Round rather than truncate: 299.995 entered by hand should become
       ₹300.00, not ₹299.99. */
    const amountMinor = Math.round(major * 100);

    setSaving(row.id);
    setError('');
    try {
      const res = await api.patch(`/admin/pricing/${row.id}`, { amountMinor });
      setSkus((prev) =>
        prev.map((s) => ({
          ...s,
          prices: s.prices.map((p) =>
            p.id === row.id ? { ...p, amountMinor, formatted: res.data.price.formatted } : p
          ),
        }))
      );
      setDrafts((d) => {
        const next = { ...d };
        delete next[row.id];
        return next;
      });
      setSaved(row.id);
      setTimeout(() => setSaved((s) => (s === row.id ? null : s)), 1800);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Could not save that price.');
    } finally {
      setSaving(null);
    }
  };

  if (loading) return <div className="text-text-muted">Loading prices…</div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl font-bold text-strong">Pricing</h2>
          <p className="mt-1 text-sm text-text-muted">
            Every price shown to customers comes from here. Changes take effect immediately — no deploy needed.
          </p>
        </div>
        <label className="text-xs text-text-muted">
          Currency
          <select
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
            className="ml-2 rounded-lg border border-line bg-bg-card px-3 py-2 text-sm text-strong focus:border-brand-orange focus:outline-none"
          >
            {currencies.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </label>
      </div>

      <div className="flex items-start gap-2 rounded-lg border border-brand-orange/30 bg-brand-orange/5 p-3 text-xs text-text-muted">
        <AlertCircle size={15} className="mt-0.5 shrink-0 text-brand-orange" />
        <span>
          Current figures are placeholders pending costing. Each currency is priced independently rather than
          converted from the rupee amount — a live exchange rate would quote a different number every day and
          leave refunds mismatched against the original charge.
        </span>
      </div>

      {error && (
        <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-500">{error}</div>
      )}

      {grouped.map(({ type, rows }) => (
        <div key={type} className="overflow-hidden rounded-xl border border-line bg-bg-surface">
          <div className="border-b border-line px-5 py-3">
            <h3 className="font-display text-sm font-bold uppercase tracking-wide text-strong">
              {TYPE_LABEL[type]}
            </h3>
          </div>

          <div className="divide-y divide-line">
            {rows.map((sku) => {
              const row = priceFor(sku);
              if (!row) {
                return (
                  <div key={sku.skuKey} className="flex items-center justify-between px-5 py-3">
                    <span className="text-sm text-strong">{sku.label}</span>
                    <span className="text-xs text-text-muted">No {currency} price set</span>
                  </div>
                );
              }
              const draft = drafts[row.id];
              const dirty = draft !== undefined && Number(draft) * 100 !== row.amountMinor;

              return (
                <div key={sku.skuKey} className="flex flex-wrap items-center gap-3 px-5 py-3">
                  <div className="min-w-[220px] flex-1">
                    <p className="text-sm font-medium text-strong">{sku.label}</p>
                    <p className="text-xs text-text-muted">
                      {sku.skuKey} · {intervalLabel(sku.interval)}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs text-text-muted">{row.currency}</span>
                    <input
                      type="number"
                      min={0}
                      step="0.01"
                      value={draft ?? (row.amountMinor / 100).toString()}
                      onChange={(e) => setDrafts((d) => ({ ...d, [row.id]: e.target.value }))}
                      className="w-28 rounded-lg border border-line bg-bg-card px-3 py-1.5 text-right text-sm text-strong focus:border-brand-orange focus:outline-none"
                    />

                    <button
                      onClick={() => save(row)}
                      disabled={!dirty || saving === row.id}
                      className="flex items-center gap-1.5 rounded-lg bg-brand-orange px-3 py-1.5 text-xs font-semibold text-on-brand transition-opacity disabled:opacity-40"
                    >
                      {saving === row.id ? (
                        <Loader2 size={13} className="animate-spin" />
                      ) : saved === row.id ? (
                        <Check size={13} />
                      ) : (
                        <Save size={13} />
                      )}
                      {saved === row.id ? 'Saved' : 'Save'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}

      <p className="flex items-center gap-1.5 text-xs text-text-muted">
        <IndianRupee size={12} />
        Every change is written to the audit log with the previous and new amount.
      </p>
    </div>
  );
};

export default PricingManager;
