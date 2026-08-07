/**
 * Which currency a visitor is quoted, and which gateway will take the money.
 *
 * Two separate questions that are easy to conflate:
 *
 *   - What we *display* may be guessed from the visitor's IP. Guessing wrong
 *     is a cosmetic annoyance, and the UI always offers a manual switcher.
 *   - What we *charge* is fixed by the billing country given at checkout and
 *     cross-checked against the card. Guessing that from IP would let anyone
 *     with a VPN pay the Indian price, so detection here is explicitly for
 *     display only and the checkout path must not call into it.
 */

/** Currencies we hold real price rows for. Anything else falls back to USD. */
export const SUPPORTED_CURRENCIES = ['INR', 'USD', 'GBP', 'EUR', 'AUD', 'CAD', 'AED', 'SGD'] as const;
export type Currency = (typeof SUPPORTED_CURRENCIES)[number];

export const DEFAULT_CURRENCY: Currency = 'USD';

/** Minor units per major unit. All of ours are 100, but JPY-style zero-decimal
    currencies exist and formatting silently breaks if this is assumed. */
export const MINOR_UNITS: Record<Currency, number> = {
  INR: 100, USD: 100, GBP: 100, EUR: 100, AUD: 100, CAD: 100, AED: 100, SGD: 100,
};

export const CURRENCY_SYMBOL: Record<Currency, string> = {
  INR: '₹', USD: '$', GBP: '£', EUR: '€', AUD: 'A$', CAD: 'C$', AED: 'AED ', SGD: 'S$',
};

/** ISO-3166-1 alpha-2 → currency. Only countries we price differently need an
    entry; everyone else gets USD, which is the intended fallback and not an
    error. The eurozone is listed out in full because "EU" is not a country. */
const COUNTRY_CURRENCY: Record<string, Currency> = {
  IN: 'INR',
  US: 'USD',
  GB: 'GBP',
  AU: 'AUD',
  NZ: 'AUD',
  CA: 'CAD',
  AE: 'AED',
  SA: 'AED',
  QA: 'AED',
  SG: 'SGD',
  MY: 'SGD',
  // Eurozone
  AT: 'EUR', BE: 'EUR', CY: 'EUR', DE: 'EUR', EE: 'EUR', ES: 'EUR', FI: 'EUR',
  FR: 'EUR', GR: 'EUR', HR: 'EUR', IE: 'EUR', IT: 'EUR', LT: 'EUR', LU: 'EUR',
  LV: 'EUR', MT: 'EUR', NL: 'EUR', PT: 'EUR', SI: 'EUR', SK: 'EUR',
};

export const currencyForCountry = (country?: string | null): Currency => {
  if (!country) return DEFAULT_CURRENCY;
  return COUNTRY_CURRENCY[country.toUpperCase()] ?? DEFAULT_CURRENCY;
};

export const isSupportedCurrency = (value?: string | null): value is Currency =>
  !!value && (SUPPORTED_CURRENCIES as readonly string[]).includes(value.toUpperCase());

/**
 * Which gateway collects for a given billing country.
 *
 * India goes to Cashfree because Stripe does not serve Indian businesses for
 * domestic collection; everywhere else goes to Stripe. Keyed on country rather
 * than currency, since the two can disagree — an NRI paying in INR from a UK
 * card is still a Stripe transaction.
 */
export type Provider = 'STRIPE' | 'CASHFREE';

export const providerForCountry = (country?: string | null): Provider =>
  country?.toUpperCase() === 'IN' ? 'CASHFREE' : 'STRIPE';

/** Render minor units for display. Server-side so emails and invoices format
    identically to the pricing page. */
export const formatAmount = (amountMinor: number, currency: Currency): string => {
  const major = amountMinor / MINOR_UNITS[currency];
  const body = major.toLocaleString('en-US', {
    minimumFractionDigits: Number.isInteger(major) ? 0 : 2,
    maximumFractionDigits: 2,
  });
  return `${CURRENCY_SYMBOL[currency]}${body}`;
};
