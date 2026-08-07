import { useCallback, useEffect, useState } from 'react';
import api from '../services/api';

/**
 * The localised price catalogue.
 *
 * Prices are never hardcoded in the client. They are provisional — the current
 * figures are placeholders pending real costing — so every number rendered
 * anywhere comes from this hook, and revising a price is an admin edit rather
 * than a release.
 */

export interface PricedItem {
  skuKey: string;
  currency: string;
  amountMinor: number;
  /** Ready to render, formatted server-side so invoices and pages agree. */
  formatted: string;
  interval: 'MONTH' | 'YEAR' | 'ONE_TIME';
  taxBehavior: 'INCLUSIVE' | 'EXCLUSIVE';
}

export interface PricingCatalogue {
  country: string | null;
  currency: string;
  detected: boolean;
  currencies: string[];
  defaultCurrency: string;
  packages: { plan: 'BASIC' | 'PRO' | 'ENTERPRISE'; price: PricedItem }[];
  tools: { key: string; name: string; price: PricedItem }[];
  jobSupport: PricedItem | null;
  courses: {
    id: string;
    title: string;
    slug: string;
    price: PricedItem;
    batches: { id: string; name: string; startDate: string; endDate: string; seatsLeft: number }[];
  }[];
}

const CURRENCY_PREF_KEY = 'nxtgen:currency';

export const usePricing = () => {
  const [data, setData] = useState<PricingCatalogue | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  /* A currency the visitor picked themselves outranks whatever the edge
     resolved from their IP — travel and VPNs make the detected value wrong
     often enough that remembering the choice matters. */
  const [currency, setCurrencyState] = useState<string | null>(
    () => localStorage.getItem(CURRENCY_PREF_KEY)
  );

  const load = useCallback(async (cur: string | null) => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/billing/pricing', {
        params: cur ? { currency: cur } : undefined,
      });
      setData(res.data);
    } catch {
      setError('Could not load prices. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(currency);
  }, [load, currency]);

  const setCurrency = useCallback((next: string) => {
    localStorage.setItem(CURRENCY_PREF_KEY, next);
    setCurrencyState(next);
  }, []);

  return { data, loading, error, currency: data?.currency ?? currency, setCurrency, reload: () => load(currency) };
};

/** Sum a set of prices for display. Minor units so the arithmetic is exact —
    adding formatted strings or float majors is how totals drift by a paisa. */
export const sumMinor = (items: PricedItem[]) =>
  items.reduce((total, item) => total + item.amountMinor, 0);

/**
 * Format a minor-unit total client-side.
 *
 * Only used for running totals the server has not been asked about yet, such
 * as a basket of tools mid-selection. Anything that becomes a charge is
 * formatted and summed again on the server, which is the authority.
 */
export const formatMinor = (amountMinor: number, currency: string) => {
  try {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency,
      minimumFractionDigits: amountMinor % 100 === 0 ? 0 : 2,
      maximumFractionDigits: 2,
    }).format(amountMinor / 100);
  } catch {
    return `${(amountMinor / 100).toFixed(2)} ${currency}`;
  }
};
